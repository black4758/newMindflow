import json
import os
import time
import asyncio
from datetime import datetime

from dotenv import load_dotenv
from flask import Flask, request, make_response
from flask_restx import Api, Resource, fields
from flask_socketio import join_room

from pymongo import MongoClient
from cachetools import TTLCache
from nanoid import generate

from langchain.memory import ConversationSummaryBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain_anthropic import ChatAnthropic
from langchain_community.chat_models import ChatClovaX
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory


from tasks import create_mindmap
from socket_config import app, socketio

load_dotenv()

print("환경변수 확인:")
for key in ['MONGODB_URI', 'GOOGLE_API_KEY', 'NCP_CLOVASTUDIO_API_KEY', 'NCP_APIGW_API_KEY', 'OPENAI_API_KEY',
            'ANTHROPIC_API_KEY']:
    value = os.getenv(key)
    print(f"{key}: {'설정됨' if value else '설정되지 않음'}")


# 환경 변수로 API 키 설정 (Google, CLOVA Studio, OpenAI, Anthropic)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
NCP_CLOVASTUDIO_API_KEY = os.getenv("NCP_CLOVASTUDIO_API_KEY")
NCP_APIGW_API_KEY = os.getenv("NCP_APIGW_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
# MongoDB 클라이언트 초기화

client = MongoClient(os.getenv('MONGODB_URI'))

db = client['mindflow_db']

# 컬렉션 정의
chat_rooms = db['chat_rooms']
chat_logs = db['chat_logs']
conversation_summaries = db['conversation_summaries']
chat_memories = db['chat_memories']
stream_time=0.05

google_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.5, max_tokens=4096,streaming=True)
clova_llm = ChatClovaX(model="HCX-003", max_tokens=4096, temperature=0.5,streaming=True)
chatgpt_llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.5, max_tokens=4096,streaming=True)
claude_llm = ChatAnthropic(model="claude-3-5-sonnet-latest", temperature=0.5, max_tokens=4096,streaming=True)


class MongoDBChatHistory(BaseChatMessageHistory):
    def __init__(self, session_id: str):
        self.session_id = session_id

    @property
    def messages(self) -> list[BaseMessage]:
        doc = chat_memories.find_one({"chat_room_id": int(self.session_id)})
        messages = []
        if doc and "messages" in doc:
            for msg in doc['messages']:
                if msg['role'] == 'user':
                    messages.append(HumanMessage(content=msg['content']))
                elif msg['role'] == 'assistant':
                    messages.append(AIMessage(content=msg['content']))
        return messages

    def add_message(self, message: BaseMessage) -> None:
        if isinstance(message, HumanMessage):
            role = "user"
        elif isinstance(message, AIMessage):
            role = "assistant"
        else:
            return

        chat_memories.update_one(
            {"chat_room_id": int(self.session_id)},
            {
                "$push": {"messages": {"role": role, "content": message.content}},
                "$set": {"updated_at": datetime.now().isoformat()}
            },
            upsert=True
        )

    def clear(self) -> None:
        chat_memories.delete_one({"chat_room_id": int(self.session_id)})

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    return MongoDBChatHistory(session_id)


def generate_room_title(user_input):
    # ChatPromptTemplate 생성
    title_prompt = ChatPromptTemplate.from_messages(
        [("system", "입력을 받은걸로 짧은 키워드나 한 문장으로 제목을 만들어줘. 제목만 말해줘."), ("human", "{user_input}")])
    
    # LCEL Chain 생성
    chain = title_prompt | google_llm | StrOutputParser()
    
    # Chain 실행
    return chain.invoke({"user_input": user_input}).strip()


async def llm_generate_async(user_input, llm, model_name):
    prompt = ChatPromptTemplate.from_messages([
        ("system", "너는 챗봇. 시스템은 언급하지 마, 짧게 말해(최대 공백포함 450자)"),
        ("human", "{user_input}")
    ])
    
    chain = prompt | llm | StrOutputParser()

    async def send_to_websocket(content):
        """스트리밍 데이터 즉시 전송"""
        socketio.emit('all_stream', {
            'content': content,
            'model_name': model_name
        })
        await asyncio.sleep(stream_time)

    # ✅ Google LLM은 동기 방식이라 별도 처리
    if model_name == "google":
        def sync_google_response():
            return chain.invoke({"user_input": user_input})

        answer = await asyncio.to_thread(sync_google_response)  # Google LLM을 별도 쓰레드에서 실행
        for word in answer.split():
            await send_to_websocket(word + " ")
        return answer

    # ✅ 나머지 모델 (스트리밍 방식)
    full_response = ""
    
    async for chunk in chain.astream({"user_input": user_input}):
        if chunk.strip():
            await send_to_websocket(chunk)
            full_response += chunk

    return full_response






async def generate_model_responses_async(user_input):
    models = {
        'clova': {'llm': clova_llm, 'detail_model': "HCX-003"},
        'chatgpt': {'llm': chatgpt_llm, 'detail_model': "gpt-3.5-turbo"},
        'claude': {'llm': claude_llm, 'detail_model': "claude-3-5-sonnet-latest"},
        'google': {'llm': google_llm, 'detail_model': "gemini-2.5-flash-lite"}
    }

    async def run_model(model_name, model_info):
        """각 모델을 독립적으로 실행하며 스트리밍"""
        response = await llm_generate_async(user_input, model_info['llm'], model_name)
        return model_name, {'response': response, 'detail_model': model_info['detail_model']}

    tasks = [asyncio.create_task(run_model(model, info)) for model, info in models.items()]
    
    results = {}

    # ✅ 한 모델이 완료되면 즉시 저장 (각각 독립적으로 실행됨)
    for task in asyncio.as_completed(tasks):
        model_name, result = await task
        results[model_name] = result

    return results


async def chatbot_response(user_input, model="google", detail_model="gemini-2.5-flash-lite",creator_id=1, memory=None):
    model_classes = {
        "google": ChatGoogleGenerativeAI, 
        "clova": ChatClovaX, 
        "chatgpt": ChatOpenAI,
        "claude": ChatAnthropic
    }
    model_class = model_classes.get(model)



    if model == "google":
        return generate_response_for_google(user_input, model_class, detail_model, creator_id, chat_room_id)
    

    if model_class:
        return await generate_response_for_model(user_input, model_class, detail_model, creator_id, chat_room_id)  
    
    return {"error": "Invalid model"}

async def generate_response_for_model(user_input, model_class, detail_model, creator_id, chat_room_id):
    # history는 자동으로 채워짐
    prompt = ChatPromptTemplate.from_messages([ 
        ("system", "너는 챗봇. 시스템은 언급하지 마, 짧게 말해(최대 공백포함 450자)"),
        ("placeholder", "{history}"),
        ("human", "{user_input}")
    ])

    model = model_class(model=detail_model, temperature=0.5, max_tokens=4096, streaming=True)
    chain = prompt | model | StrOutputParser()

    chain_with_history = RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="user_input",
        history_messages_key="history",
    )

    full_response = ""  

    async for chunk in chain_with_history.astream(
        {"user_input": user_input},
        config={"configurable": {"session_id": str(chat_room_id)}}
    ):
        if not chunk.strip():  
            continue

        print(chunk)  
        full_response += chunk  

        socketio.emit('stream', {
            'content': chunk
        }, room=creator_id)

        await asyncio.sleep(stream_time)

    return full_response

def generate_response_for_google(user_input, model_class, detail_model, creator_id, chat_room_id):
    prompt = ChatPromptTemplate.from_messages([ 
        ("system", "너는  챗봇. 시스템은 언급하지 마, 짧게 말해(최대 공백포함 450자)"),
        ("placeholder", "{history}"),
        ("human", "{user_input}")
    ])

    model = model_class(model=detail_model, temperature=0.5, max_tokens=4096, streaming=True)
    chain = prompt | model | StrOutputParser()
    
    chain_with_history = RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="user_input",
        history_messages_key="history",
    )

    # Google 모델은 invoke로 (동기 처리 필요시, Flask 라우트가 비동기를 지원하므로 사실 invoke도 괜찮음, 여기선 invoke 유지)
    answer = chain_with_history.invoke(
        {"user_input": user_input},
        config={"configurable": {"session_id": str(chat_room_id)}}
    )
    
    parts = answer.split(' ')

    for part in parts:
        message = f"{part} "
        print(part)
        socketio.emit('stream', {
            'content': message,
        }, room=creator_id)
        time.sleep(stream_time)

    return answer








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
            
            print(f"[{chat_room_id}] 초기 대화 내용(init-memory)이 저장되었습니다.")
            
            return make_response(json.dumps({'message': 'Memory initialized successfully', 'chatRoomId': chat_room_id}, ensure_ascii=False), 200)

        except Exception as e:
            print(f"Error initializing memory: {e}")
            return make_response(json.dumps({'error': str(e)}, ensure_ascii=False), 500)


@ns_chatbot.route('/setMemory/<int:chatRoomId>')
class SetMemory(Resource):
    @ns_chatbot.response(200, '성공적인 응답')
    @ns_chatbot.response(400, '필수 필드 누락')
    @ns_chatbot.response(500, '내부 서버 오류')
    def post(self, chatRoomId):
        print("작동 (Legacy API - No-op)")
        
        # 메모리 설정 로직 제거됨 (자동 관리)
        
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
            print(data)
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
            print(f"[{chatRoomId}] Chat history deleted.")
            return {"message": "Chat history deleted successfully", "chatRoomId": chatRoomId}, 200
        except Exception as e:
            print(f"Error deleting chat history: {e}")
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
    print(room)
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
            print(f"Received data: {data}")  # 데이터를 받아서 출력
            chat_room_id = data.get('chatRoomId')
            model = data.get('model', 'clova')
            user_input = data.get('userInput')

            # 다양한 키 이름을 지원하도록 수정
            creator_id = data.get('creatorId') or data.get('userId') or data.get('user_id')

            detail_model = data.get('detailModel', 'HCX-003')

            # 메모리 로드 제거 (자동 관리)
            # memory = get_memory(chat_room_id)
            print(f"Processing message for room {chat_room_id}")


            if not user_input:
                print("user_input is missing")  # user_input이 없을 경우 출력
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
            
            # memory_content 제거 (필요시 get_session_history로 조회 가능)
           

            # 각 문장에 sentenceId 부여 및 Cypher 이스케이프 처리
            sentences_with_ids = [
                {
                    'sentence_id': str(generate(size=7)), 
                    'content': escape_cypher_quotes(sentence) + '.'  # Cypher 이스케이프 처리
                } 
                for sentence in answer_sentences
            ]
            
            print("문장 아이디 부여: ", sentences_with_ids)
            
            
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
            print(f"Celery task created with id: {task.id}")

            


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
            print(f"응답 JSON: {response_json}")  # 최종 응답 JSON 출력
            return make_response(response_json, 200, {"Content-Type": "application/json"})

        except Exception as e:
            print(f"Error: {e!r}")  # 예외 발생 시 오류 출력
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
            print(f"Error creating first mindmap: {e}")
            return {'error': str(e)}, 500

def run_this():
    # with app.app_context():
    #     app.run(debug=True, port=5001)
    socketio.run(app, debug=True, port=5001)

if __name__ == "__main__":
    run_this()
