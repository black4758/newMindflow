from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from neo4j import GraphDatabase
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
import json
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
import time as timer

load_dotenv()

app = Flask(__name__)

# MongoDB 설정
try:
    mongo_client = MongoClient('mongodb://localhost:27017/')
    db = mongo_client['chat_database']
    # conversations = db['conversations']

    chat_rooms = db['chat_rooms']
    chat_logs = db['chat_logs']

except Exception as e:
    print(f"MongoDB 연결 오류: {e}")
    raise e

# Neo4j 설정
try:
    neo4j_uri = "neo4j://localhost:7687"
    neo4j_driver = GraphDatabase.driver(neo4j_uri, 
                                    auth=(os.getenv("NEO4J_USER", "neo4j"), 
                                            os.getenv("NEO4J_PASSWORD", "password")))
except Exception as e:
    print(f"Neo4j 연결 오류: {e}")

# LangChain 설정
chat_model = ChatAnthropic(model="claude-3-5-sonnet-latest", max_tokens=4096)

# 일반 대화용 프롬프트 템플릿
chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "다음 질문에 대해 최대 13줄 정도로 답변해주세요. 간단하게 요청한 경우 5줄 정도로 답변"),
    ("user", "{question}")
])

# Neo4j 쿼리 생성용 프롬프트 템플릿
query_prompt = ChatPromptTemplate.from_messages([
    ("user", """

다음은 현재 마인드맵의 구조와 새로운 대화입니다. 이를 바탕으로 마인드맵을 업데이트하는 Cypher 쿼리를 생성해주세요.

현재 마인드맵 구조:
{structure}

새로운 대화:
질문: {question}
답변 문장들:
{answer_lines}
     
1. 노드 생성 규칙:
   - 모든 Topic 노드는 account_id와 chat_room_id 속성을 가져야 함
   - 첫 노드 생성시:
     CREATE (n:Topic {{
         title: '제목',
         content: '내용',
         account_id: '{account_id}',
         chat_room_id: '{chat_room_id}',
         created_at: datetime()
     }})

1. 기존 마인드맵과의 연결성 분석 (최우선 규칙):
   - 새로운 내용을 추가하기 전에 반드시 기존 노드의 title과 content를 검사
   - 연관된 내용이 있다면 해당 노드를 MATCH하여 거기서부터 확장
   - 연관성 검사 예시 쿼리:
     MATCH (existing:Topic)
     WHERE existing.title CONTAINS '키워드' OR existing.content CONTAINS '키워드'
     WITH existing
     CREATE (new:Topic {{...}})
     CREATE (existing)-[:HAS_SUBTOPIC]->(new)

2. 계층 구조 생성 규칙:
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

3. 노드 생성 시:
   - 각 단계별로 적절한 추상화 수준 유지
   - 상위 개념은 포괄적으로, 하위 개념은 구체적으로 작성
   - 모든 노드에 mongo_ref: '{mongo_ref}' 포함
   - 새로운 노드 생성 시 기존 노드와의 중복성 검사
   - 각 노드는 반드시 하나의 답변 문장에 대응되어야 함
   - 각 노드의 mongo_ref 속성에는 해당 답변 문장의 line_id를 저장
   - 기존 노드에 연결 시 chat_room_id 및 account_id 일치 여부 확인

4. Cypher 쿼리 작성 규칙:
   - 우선 MATCH로 연관된 기존 노드 검색
   - 연관 노드가 있으면 거기서부터 확장
   - 연관 노드가 없으면 새로운 구조 생성
   - CREATE와 MATCH를 함께 사용할 때는 WITH 절 필수
   - 예시:
     MATCH (existing:Topic)
     WHERE existing.title CONTAINS '키워드'
     WITH existing
     CREATE (new:Topic {{...}})
     CREATE (existing)-[:HAS_SUBTOPIC]->(new)

5. 관계 유형:
   - HAS_SUBTOPIC: 계층 관계 (상위-하위 개념)
   - RELATED_TO: 연관 관계 (유사 주제간)
   - COMPARED_TO: 비교 관계 (대조되는 개념)

6. 연관성 판단 기준:
   - 동일한 주제 영역
   - 유사한 개념/의미
   - 상위-하위 개념 관계
   - 원인-결과 관계
   - 부분-전체 관계
     
추가 규칙:
     
1. 문자열 값의 이스케이프 처리:
  - 작은따옴표(') -> 두 개('')로 처리
  - 큰따옴표(") -> \"로 처리
  - 백슬래시(\) -> \\로 처리
  - 역따옴표(`) -> 제거 또는 다른 문자로 대체

2. 이스케이프 예시:
  '챔피언' -> ''챔피언''
  "텍스트" -> \"텍스트\"
  백틱`제거` -> 백틱제거

가능한 한 깊은 계층 구조를 만들되, 자연스러운 관계를 유지하세요.
기존 노드와의 연결을 최우선으로 고려하고, 완전히 새로운 주제인 경우에만 새 루트 노드를 생성하세요.
Cypher 쿼리만 반환하고 다른 설명은 하지 말아주세요.""")
])

# LangChain 체인 구성
chat_chain = chat_prompt | chat_model | StrOutputParser()
query_chain = query_prompt | chat_model | StrOutputParser()

def get_mindmap_structure():
    """현재 마인드맵의 구조를 반환"""
    return """
    MATCH (n:Topic)-[r]->(m:Topic)
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
    """

def datetime_handler(obj):
    """datetime 객체를 JSON 직렬화"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f'Object of type {type(obj)} is not JSON serializable')

def generate_mindmap_query(conversation_data):
    try:
        with neo4j_driver.session(database="mindmap") as session:
            result = session.run(get_mindmap_structure())
            structure = result.single()['structure']
            
            query = query_chain.invoke({
                "structure": json.dumps(structure, indent=2, default=str) if structure else "아직 생성된 노드가 없습니다.",
                "question": conversation_data['question'],
                "answer_lines": json.dumps(conversation_data['answer_lines'], indent=2, default=datetime_handler),
                "mongo_ref": conversation_data["_id"],

                "chat_room_id" : "room1",
                "account_id" : "rhs1",
            })
            
            return query
            
    except Exception as e:
        print(f"쿼리 생성 오류: {e}")
        return None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        if not data or 'question' not in data:
            return jsonify({'status': 'error', 'message': '질문이 없습니다.'}), 400
        
        question = data['question']

        answer = chat_chain.invoke({"question": question})


        if answer:

            conversation_id = str(uuid.uuid4())
            
            answer_sentences = [line.strip() for line in answer.split('\n') if line.strip()]
            
            conversation_document = {
                'account_id' : "account_id",
                'chat_room_id' : "chat_room_id",
                'id': conversation_id,
                'question': question,
                'answer_sentences': [
                    {
                        'sentence_id': str(uuid.uuid4()),
                        'content': sentence,
                        'is_deleted': False
                    }
                    for sentence in answer_sentences
                ],
                'timestamp': datetime.now(),
                'processed': False
            }
            
            chat_logs.insert_one(conversation_document)

            conversation_data = {
                'id': conversation_id,
                'question': question,
                'answer_lines': [
                    {
                        'line_id': sentence['sentence_id'],
                        'content': sentence['content']
                    }
                    for sentence in conversation_document['answer_sentences']
                ]
            }
            

            update_query = generate_mindmap_query(conversation_data)
            
            if update_query:
                with neo4j_driver.session(database="mindmap") as session:
                    session.run(update_query)
                    chat_logs.update_one(
                        {'id': conversation_id},
                        {'$set': {'processed': True}}
                    )


            return jsonify({
                'status': 'success',
                'answer': answer,
                'conversation_id': conversation_id,
                'answer_sentences': [
                    {
                        'sentence_id': sentence['sentence_id'],
                        'content': sentence['content']
                    }
                    for sentence in conversation_document['answer_sentences']
                ]
            })
            
    except Exception as e:
        print(f"Chat 엔드포인트 오류: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/get_mindmap', methods=['GET'])
def get_mindmap():
    try:

        with neo4j_driver.session(database="mindmap") as session:

            test_result = session.run("MATCH (n) RETURN count(n) as count")
            node_count = test_result.single()['count']
            print(f"Total nodes in database: {node_count}")

            result = session.run("""
                MATCH (n:Topic)
                OPTIONAL MATCH (n)-[r]->(m:Topic)
                RETURN collect(distinct {
                    id: elementId(n),
                    title: n.title,
                    content: n.content,
                    mongo_ref: n.mongo_ref
                }) as nodes,
                collect(distinct CASE WHEN r IS NOT NULL
                    THEN {
                        source: elementId(n),
                        target: elementId(m),
                        type: type(r)
                    }
                    ELSE null
                END) as rels
            """)
            
            data = result.single()
            return jsonify({
                'nodes': [node for node in data['nodes'] if node is not None],
                'relationships': [rel for rel in data['rels'] if rel is not None]
            })
            
    except Exception as e:
        print(f"마인드맵 조회 오류: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


# @app.route('/mindmaps/user', methods=['GET'])
# def get_user_mindmaps():
#     """사용자의 전체 마인드맵 조회"""
#     try:
#         account_id = "account_id"
#         # account_id = request.args.get('account_id')
#         # if not account_id:
#         #     return jsonify({'status': 'error', 'message': 'account_id is required'}), 400

#         with neo4j_driver.session() as session:
#             result = session.run("""
#                 MATCH (n:Topic {account_id: $account_id})
#                 OPTIONAL MATCH (n)-[r]->(m:Topic)
#                 WHERE m.account_id = $account_id
#                 RETURN collect(distinct {
#                     id: elementId(n),
#                     title: n.title,
#                     content: n.content,
#                     mongo_ref: n.mongo_ref
#                 }) as nodes,
#                 collect(distinct CASE WHEN r IS NOT NULL
#                     THEN {
#                         source: elementId(n),
#                         target: elementId(m),
#                         type: type(r)
#                     }
#                     ELSE null
#                 END) as relationships
#             """, account_id=account_id)
            
#             data = result.single()
#             return jsonify({
#                 'nodes': [node for node in data['nodes'] if node is not None],
#                 'relationships': [rel for rel in data['relationships'] if rel is not None]
#             })
            
#     except Exception as e:
#         print(f"사용자 마인드맵 조회 오류: {e}")
#         return jsonify({'status': 'error', 'message': str(e)}), 500

# @app.route('/mindmaps/thread', methods=['GET'])
# def get_thread_mindmap():
#     """특정 스레드의 마인드맵 조회"""
#     try:

#         account_id = "account_id"
#         chat_room_id = "chat_room_id"

#         # account_id = request.args.get('account_id')
#         # chat_room_id = request.args.get('chat_room_id')
#         # if not account_id or not chat_room_id:
#         #     return jsonify({'status': 'error', 'message': 'account_id and chat_room_id are required'}), 400

#         with neo4j_driver.session() as session:
#             result = session.run("""
#                 MATCH (n:Topic {account_id: $account_id, chat_room_id: $chat_room_id})
#                 OPTIONAL MATCH (n)-[r]->(m:Topic)
#                 WHERE m.chat_room_id = $chat_room_id AND m.account_id = $account_id
#                 RETURN collect(distinct {
#                     id: elementId(n),
#                     title: n.title,
#                     content: n.content,
#                     mongo_ref: n.mongo_ref
#                 }) as nodes,
#                 collect(distinct CASE WHEN r IS NOT NULL
#                     THEN {
#                         source: elementId(n),
#                         target: elementId(m),
#                         type: type(r)
#                     }
#                     ELSE null
#                 END) as relationships
#             """, account_id=account_id, chat_room_id=chat_room_id)
            
#             data = result.single()
#             return jsonify({
#                 'nodes': [node for node in data['nodes'] if node is not None],
#                 'relationships': [rel for rel in data['relationships'] if rel is not None]
#             })
            
#     except Exception as e:
#         print(f"스레드 마인드맵 조회 오류: {e}")
#         return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    try:
        app.run(debug=True, port=5001)
    finally:
        neo4j_driver.close()
        mongo_client.close()