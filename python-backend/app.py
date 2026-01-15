import json
import os
import asyncio

from dotenv import load_dotenv
from flask import Flask, request, make_response
from flask_restx import Api, Resource, fields
from flask_socketio import join_room

from nanoid import generate

from tasks import create_mindmap, summarize_messages
from socket_config import app, socketio

# 분리된 서비스 import
from services import (
    get_all_models_info,
    get_session_history,
    init_socketio,
    generate_room_title,
    generate_model_responses_async,
    chatbot_response,
    chat_memories
)

load_dotenv()

# Socket.IO 인스턴스를 chat_service에 주입
init_socketio(socketio)

# 환경변수 상태 출력 (시작 시 1회)
env_keys = ['MONGODB_URI', 'GOOGLE_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY']
env_status = {k: '✓' if os.getenv(k) else '✗' for k in env_keys}
print(f"[환경변수] {env_status}")






def serialize_message(message):
    if hasattr(message, 'to_dict'):  # 객체에 to_dict 메서드가 있는 경우
        message_dict = message.to_dict()
        # 'content' 키만 반환
        return message_dict.get('content', '')
    # 'to_dict' 메서드가 없을 경우, 'content' 속성을 직접 반환
    return getattr(message, 'content', '') if hasattr(message, 'content') else str(message)


# app = Flask(__name__)
# app.config['SECRET_KEY'] = 'REDACTED'
# socketio = SocketIO(app, cors_allowed_origins="*",host='0.0.0.0')

api = Api(app, version='1.0', title='다중 AI 챗봇 API', description='다양한 AI 모델을 활용한 챗봇 API')

ns_chatbot = api.namespace('chatbot', description='Chatbot 관련 API')

# 모델 입력/출력 스키마 정의 (Swagger 문서용)
message_model = api.model('message', {'chatRoomId': fields.Integer(required=False, description='채팅방 ID'),
                                      'model': fields.String(required=False, description='사용할 모델 (예: google, clova)'),
                                      'userInput': fields.String(required=True, description='사용자 입력 메시지'),
                                      'detailModel': fields.String(required=False, description='사용할 세부모델'), })
message_all = api.model('title', {'userInput': fields.String(required=True, description='사용자 입력 메시지'), })
message_title = api.model('all', {'userInput': fields.String(required=True, description='사용자 입력 메시지'), })

init_memory_model = api.model('init_memory', {
    'chatRoomId': fields.Integer(required=True, description='채팅방 ID'),
    'userInput': fields.String(required=True, description='사용자 초기 입력'),
    'modelResponse': fields.String(required=True, description='선택된 모델의 답변')
})

@ns_chatbot.route('/init-memory')
class InitMemoryAPI(Resource):
    @ns_chatbot.expect(init_memory_model)
    @ns_chatbot.response(200, '메모리 초기화 성공')
    @ns_chatbot.response(400, '필수 필드 누락')
    @ns_chatbot.response(500, '서버 내부 오류')
    def post(self):
        try:
            data = request.get_json()
            chat_room_id = data.get('chatRoomId')
            user_input = data.get('userInput')
            model_response = data.get('modelResponse')

            if not all([chat_room_id, user_input, model_response]):
                 return make_response(json.dumps({'error': '모든 필드(chatRoomId, userInput, modelResponse)가 필요합니다.'}, ensure_ascii=False), 400)

            # 1. 
            history = get_session_history(str(chat_room_id))

            # 2. 초기 대화 내용 주입
            history.add_user_message(user_input)
            history.add_ai_message(model_response)
            
            print(f"[메모리] 초기화: room={chat_room_id}")
            
            return make_response(json.dumps({'message': 'Memory initialized successfully', 'chatRoomId': chat_room_id}, ensure_ascii=False), 200)

        except Exception as e:
            print(f"[메모리] 초기화 오류: {e}")
            return make_response(json.dumps({'error': str(e)}, ensure_ascii=False), 500)


@ns_chatbot.route('/setMemory/<int:chatRoomId>')
class SetMemory(Resource):
    @ns_chatbot.response(200, '성공적인 응답')
    @ns_chatbot.response(400, '필수 필드 누락')
    @ns_chatbot.response(500, '내부 서버 오류')
    def post(self, chatRoomId):
                
        return {"message": "Memory set successfully", "chatRoomId": chatRoomId}, 200



@ns_chatbot.route('/all')
class AllAPI(Resource):
    @ns_chatbot.expect(message_all)
    @ns_chatbot.response(200, '성공적인 응답')
    @ns_chatbot.response(400, '필수 필드 누락')
    @ns_chatbot.response(500, '내부 서버 오류')
    def post(self):  # 비동기 함수가 아님!
        try:
            data = request.get_json()
            # data = request.get_json()
            user_input = data.get('userInput')
            
            responses = asyncio.run(generate_model_responses_async(user_input))  

            response_data = {
                'models': ['google', 'clova', 'chatgpt', 'claude'],
                'user_input': user_input,
                'responses': responses,
            }

            return response_data

        except Exception as e:
            error_response = {'error': str(e)}
            return make_response(json.dumps(error_response, ensure_ascii=False), 500)


@ns_chatbot.route('/title')
class TitleAPI(Resource):
    @ns_chatbot.expect(message_title)  # 요청 스키마 정의 연결
    @ns_chatbot.response(200, '성공적인 응답')
    @ns_chatbot.response(400, '필수 필드 누락')
    @ns_chatbot.response(500, '내부 서버 오류')
    def post(self):
        try:
            data = request.get_json()
            user_input = data.get('userInput')
            responses = generate_room_title(user_input)
            response_data = {"response": responses}
            response_json = json.dumps(response_data, ensure_ascii=False)
            return make_response(response_json, 200, {"Content-Type": "application/json"})


        except Exception as e:
            error_response = {'error': str(e)}

            # 에러 응답도 ensure_ascii=False로 처리
            return make_response(json.dumps(error_response, ensure_ascii=False), 500)


@ns_chatbot.route('/cleanup/<int:chatRoomId>')
class CleanupAPI(Resource):
    @ns_chatbot.response(200, '메모리 삭제 성공')
    @ns_chatbot.response(500, '서버 내부 오류')
    def delete(self, chatRoomId):
        try:
            history = get_session_history(str(chatRoomId))
            history.clear()
            print(f"[히스토리] 삭제: room={chatRoomId}")
            return {"message": "Chat history deleted successfully", "chatRoomId": chatRoomId}, 200
        except Exception as e:
            print(f"[히스토리] 삭제 오류: {e}")
            return {"error": str(e)}, 500


def escape_cypher_quotes(text):
    """Neo4j Cypher 쿼리용 문자열 이스케이프 개선"""
    if text is None:
        return text

    # 축약형(I'm, don't 등)과 따옴표를 포함한 텍스트를 처리하기 위해
    # 작은따옴표를 두 개의 작은따옴표로 이스케이프 처리
    escaped_text = ""
    prev_char = None

    for char in text:
        if char == "'":
            # 이전 문자가 알파벳이고 다음 문자가 m, s, t, ve, ll 등인 경우를 처리하기 위해
            # 그대로 작은따옴표 하나만 사용
            if (prev_char and prev_char.isalpha()) and len(escaped_text) < len(text) - 1:
                escaped_text += "'"
            else:
                escaped_text += "''"
        else:
            escaped_text += char
        prev_char = char

    return escaped_text



# 클라이언트가 join 이벤트를 보냈을 때 실행
@socketio.on('join')
def handle_join(data):
    room = data['room']  # 클라이언트가 보낸 room 정보
    # Socket room join
    join_room(room)
    
    # 추가적인 세션 관리 로직을 여기에 추가 가능


@ns_chatbot.route('/message')
class MessageAPI(Resource):

    @ns_chatbot.expect(message_model)  # 요청 스키마 정의 연결
    @ns_chatbot.response(200, '성공적인 응답')
    @ns_chatbot.response(400, '필수 필드 누락')
    @ns_chatbot.response(500, '내부 서버 오류')
    def post(self):
        """Message API"""

        try:
            data = request.get_json()
            print(f"[메시지] 요청: room={data.get('chatRoomId')}")
            chat_room_id = data.get('chatRoomId')
            model = data.get('model', 'clova')
            user_input = data.get('userInput')

            # 다양한 키 이름을 지원하도록 수정
            creator_id = data.get('creatorId')

            detail_model = data.get('detailModel', 'HCX-003')

            # 메모리 로드 제거 (자동 관리)
            # memory = get_memory(chat_room_id)
            # message processing


            if not user_input:
                print("[메시지] 오류: user_input 없음")
                return make_response(json.dumps({'error': 'user_input은 필수입니다'}, ensure_ascii=False), 400)

            socketio.emit('mindmap_status', {
                'status': 'creating',
                'message': '마인드맵 생성을 시작합니다',
                'chatRoomId': chat_room_id
            })
            # 비동기 함수 호출 (await)
            # 챗봇 응답
            response_obj = asyncio.run(chatbot_response(user_input, model=model, detail_model=detail_model, creator_id=creator_id, chat_room_id=chat_room_id))
             
            response_content_serialized = (response_obj)

            answer_sentences = [
                sentence.strip() 
                for sentence in response_content_serialized.replace('\n', ' ').split('.')  # 개행은 공백으로 바꾸고, 마침표로 분리
                if sentence.strip()  # 빈 문장 제거
            ]
                       

            # 각 문장에 sentenceId 부여 및 Cypher 이스케이프 처리
            sentences_with_ids = [
                {
                    'sentence_id': str(generate(size=7)), 
                    'content': escape_cypher_quotes(sentence) + '.'  # Cypher 이스케이프 처리
                } 
                for sentence in answer_sentences
            ]
            
            # sentences_with_ids 생성 완료
            
            
            task = create_mindmap.delay(  
                    # account_id=data.get('accountId'),
                    # user_id=data.get('userId'),
                    account_id=data.get('accountId'), 
                    chat_room_id= str(data.get('chatRoomId')), 
                    chat_id="chat_id", 
                    question=user_input,
                    answer_sentences=sentences_with_ids,
                    creator_id=creator_id
                    # creator_id='1'
                )
            # Celery task 시작

            # 대화 요약 Task 트리거 (백그라운드)
            summarize_messages.delay(chat_room_id)

            
            response_data = {
                
                'status': 'success',
                'chat_room_id': chat_room_id,
                'user_id':creator_id,
                'model': model,
                'detail_model':detail_model,
                'response': response_content_serialized,
                'answer_sentences': sentences_with_ids
            }

            response_json = json.dumps(response_data, ensure_ascii=False)
            print(f"[메시지] 응답 완료: room={chat_room_id}")
            return make_response(response_json, 200, {"Content-Type": "application/json"})

        except Exception as e:
            print(f"[메시지] 오류: {e!r}")
            error_response = {'error': str(e)}
            return make_response(json.dumps(error_response, ensure_ascii=False), 500)

answer_sentence_model = api.model('AnswerSentence', {
    'sentenceId': fields.String(),
    'content': fields.String()
})

@ns_chatbot.route('/first-mindmap')
class FirstMindmapAPI(Resource):
    @ns_chatbot.expect(api.model('first_mindmap', {
        'chatRoomId': fields.Integer(required=True),
        'userInput': fields.String(required=True),
        'creatorId': fields.Integer(required=True),
        'answerSentences': fields.List(fields.Nested(answer_sentence_model))  # ✅ 수정됨
    }))
    def post(self):
        try:
            data = request.get_json()
            chat_room_id = data.get('chatRoomId')
            user_input = data.get('userInput')
            creator_id = data.get('creatorId')
            answer_sentences = data.get('answerSentences')  # MongoDB에 저장된 sentenceId 사용
            
            # 마인드맵 생성 시작 알림
            socketio.emit('mindmap_status', {
                'status': 'creating',
                'message': '마인드맵 생성을 시작합니다',
                'chatRoomId': chat_room_id
            })

            # 마인드맵 생성 태스크 실행
            task = create_mindmap.delay(
                account_id=creator_id,
                chat_room_id=str(chat_room_id),
                chat_id="chat_id",
                question=user_input,
                answer_sentences=answer_sentences,
                creator_id=creator_id
            )
            
            return {'status': 'success', 'task_id': task.id}, 200

        except Exception as e:
            print(f"[첫마인드맵] 오류: {e}")
            return {'error': str(e)}, 500

def run_this():
    # with app.app_context():
    #     app.run(debug=True, port=5001)
    socketio.run(app, debug=True, port=5001)

if __name__ == "__main__":
    run_this()
