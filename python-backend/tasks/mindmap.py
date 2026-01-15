import json
import os
import logging
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_anthropic import ChatAnthropic
from celery_config import celery
from flask_socketio import SocketIO
import requests
import traceback

from services.db_service import get_neo4j_driver
from utils.logger import log_error, log_info_block

logger = logging.getLogger(__name__)

# socketio 인스턴스 생성 (Redis 메시지 큐 사용)
socketio = SocketIO(message_queue='redis://redis:6379/0')

load_dotenv()

SPRING_SERVER_URL = os.getenv("SPRING_SERVER_URL")

# Neo4j 드라이버 (db_service에서 가져옴)
neo4j_driver = get_neo4j_driver()

chat_model = ChatAnthropic(model="claude-3-5-sonnet-latest", max_tokens=4096)


query_prompt = ChatPromptTemplate.from_messages([("user", """
다음은 현재 마인드맵의 구조와 새로운 대화입니다. 이를 바탕으로 마인드맵을 업데이트하는 Cypher 쿼리를 생성해주세요.

현재 마인드맵 구조:
{structure}

새로운 대화:
질문: {question}
답변 문장들:
{answer_lines}
     
1. 노드 생성 규칙:
   - 모든 Topic 노드는 다음 속성들을 반드시 포함해야 함:
     * chat_room_id
     * chat_room_title
     * mongo_ref (답변 문장의 sentenceId)
     * title
     * content
     * creator_id
     * created_at
   - 첫 노드 생성 예시:
     CREATE (n:Topic {{
         title: '제목',
         content: '내용',
         chat_room_id: '{chat_room_id}',
         chat_room_title: '{chat_room_title}',
         mongo_ref: '답변문장의_sentenceId',
         creator_id: '{creator_id}',
         created_at: datetime()
     }})
                                                  
2. mongo_ref 할당 규칙:
   - 각 노드는 정확히 하나의 mongo_ref 값을 가져야 함
   - 하나의 sentenceId는 하나의 노드에만 할당.

3. 기존 마인드맵과의 연결성 분석 (최우선 규칙):
   - 새로운 내용을 추가하기 전에 반드시 기존 노드의 title과 content를 검사
   - 연관된 내용이 있다면 해당 노드를 MATCH하여 거기서부터 확장
   - 연관성 검사 예시 쿼리:
     MATCH (existing:Topic)
     WHERE existing.title CONTAINS '키워드' OR existing.content CONTAINS '키워드'
     WITH existing
     CREATE (new:Topic {{...}})
     CREATE (existing)-[:HAS_SUBTOPIC]->(new)

4. 계층 구조 생성 규칙:
   - 완전히 새로운 주제인 경우에만 새 루트 노드 생성
   - 대화 내용을 최대한 세분화하여 다단계 계층 구조로 구성
   - 각 개념이나 단계는 더 작은 하위 개념으로 분해
   - 예시 구조:
     * 기존 주제와 연관성이 있는 경우:
       -> 기존 노드 MATCH
          -> 새로운 하위 개념 추가
             -> 세부 설명 추가
     * 완전히 새로운 주제인 경우만:
       -> 새 루트 노드 생성
          -> 하위 개념 추가
             -> 세부 설명 추가

5. 노드 생성 시:
   - 각 단계별로 적절한 추상화 수준 유지
   - 상위 개념은 포괄적으로, 하위 개념은 구체적으로 작성
   - 새로운 노드 생성 시 기존 노드와의 중복성 검사
   - 각 노드는 반드시 하나의 답변 문장에 대응되어야 함
   - 각 노드의 mongo_ref 속성에 해당 답변 문장의 sentenceId 값을 저장.
                                                

6. Cypher 쿼리 작성 규칙:
   - 우선 MATCH로 연관된 기존 노드 검색
   - 연관 노드가 있으면 거기서부터 확장
   - 연관 노드가 없으면 새로운 구조 생성
   - 모든 관계는 방향이 있어야 함
   - CREATE와 MATCH를 함께 사용할 때는 WITH 절 필수
   - 예시:
     MATCH (existing:Topic)
     WHERE existing.title CONTAINS '키워드'
     WITH existing
     CREATE (new:Topic {{...}})
     CREATE (existing)-[:HAS_SUBTOPIC]->(new)

7. 관계 유형:
   - HAS_SUBTOPIC: 계층 관계 (상위->하위 개념)
   - RELATED_TO: 연관 관계 (유사 주제간)
   - COMPARED_TO: 비교 관계 (대조되는 개념)

8. 연관성 판단 기준:
   - 동일한 주제 영역
   - 유사한 개념/의미
   - 상위-하위 개념 관계
   - 원인-결과 관계
   - 부분-전체 관계
     

가능한 한 깊은 트리 구조를 만들되, 사이클이나 다이아몬드 구조가 생기면 안됩니다.
기존 노드와의 연결을 최우선으로 고려하고, 완전히 새로운 주제인 경우에만 새 루트 노드를 생성하세요.
Cypher 쿼리만 반환하고 다른 설명은 하지 말아주세요. 단, APOC 라이브러리를 이용한 쿼리는 쓰면 안되요.""")])

query_chain = query_prompt | chat_model | StrOutputParser()


def get_mindmap_structure(creator_id, chat_room_id):
    """특정 chat_room_id에 해당하는 마인드맵 구조를 반환"""
    
    with neo4j_driver.session(database="mindmap") as session:
        result = session.run("""
        MATCH (n:Topic)-[r]->(m:Topic)
        WHERE n.chat_room_id = $chat_room_id AND m.chat_room_id = $chat_room_id
        RETURN collect({
            source: {
                id: elementId(n),
                title: n.title,
                content: n.content
            },
            relationship: type(r),
            target: {
                id: elementId(m),
                title: m.title,
                content: m.content
            }
        }) as structure
        """, chat_room_id=chat_room_id)
        return result.single()["structure"]


def escape_cypher_quotes(text):
    """Neo4j Cypher 쿼리용 문자열 이스케이프 개선"""
    if text is None:
        return text

    escaped_text = ""
    prev_char = None

    for char in text:
        if char == "'":
            if (prev_char and prev_char.isalpha()) and len(escaped_text) < len(text) - 1:
                escaped_text += "'"
            else:
                escaped_text += "''"
        else:
            escaped_text += char
        prev_char = char

    return escaped_text


@celery.task
def create_mindmap(account_id, chat_room_id, chat_id, question, answer_sentences, creator_id):
    logger.info(f"Task received with chat_room_id: {chat_room_id}")

    chat_room_title = None

    try:
        url = f"{SPRING_SERVER_URL}/api/messages/room-title/{chat_room_id}"
        
        response = requests.get(url)
        
        if response.status_code == 200:
            chat_room_title = response.text
            logger.info(f"설정된 채팅방 제목: {chat_room_title}")
        else:
            logger.warning(f"채팅방 제목 조회 실패: HTTP {response.status_code}")
    except Exception as e:
        logger.error(f"채팅방 제목 조회 중 예외 발생: {str(e)}")
        traceback.print_exc()

    if chat_room_title is None:
        logger.warning("주의: 채팅방 제목이 None으로 설정됨")


    try:
        logger.info(f"마인드맵 생성 시작: chat_room_id={chat_room_id}, sentences={len(answer_sentences)}개")

        current_structure = get_mindmap_structure(creator_id, chat_room_id)

        query_data = {
                        "structure": json.dumps(current_structure, indent=2, default=str) if current_structure else "아직 생성된 노드가 없습니다.",
                        "question": escape_cypher_quotes(question), 
                        "answer_lines": answer_sentences,
                        "account_id": account_id, 
                        "chat_room_id": chat_room_id, 
                        "creator_id": creator_id,
                        "chat_room_title": chat_room_title,
                    }

        socketio.emit('mindmap_status', {
            'status': 'generating',
            'message': '마인드맵을 생성하고 있습니다',
            'chatRoomId': chat_room_id
        })

        logger.info("Cypher 쿼리 생성 시작")
        query = query_chain.invoke(query_data)
        
        # Cypher 쿼리 구조화 출력
        log_info_block(logger, "생성된 Cypher 쿼리", content=query)

        logger.info("Neo4j 쿼리 실행 시작")
        with neo4j_driver.session(database="mindmap") as session:
            session.run(query)
        logger.info("마인드맵 생성 작업 완료")

        socketio.emit('mindmap_status', {
            'status': 'completed',
            'message': '마인드맵 생성이 완료되었습니다',
            'chatRoomId': chat_room_id
        })

        return True
    except Exception as e:
        log_error(logger, "마인드맵 생성 오류", e, {
            "chat_room_id": chat_room_id,
            "question": question,
            "sentence_count": len(answer_sentences)
        })
        
        socketio.emit('mindmap_status', {
            'status': 'error',
            'message': f'마인드맵 생성 중 오류가 발생했습니다: {str(e)}',
            'chatRoomId': chat_room_id
        })

        return False
