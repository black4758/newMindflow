
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
import json
import os
from neo4j import GraphDatabase
from datetime import datetime
from dotenv import load_dotenv
from celery_config import celery



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

2. 기존 마인드맵과의 연결성 분석 (최우선 규칙):
   - 새로운 내용을 추가하기 전에 반드시 기존 노드의 title과 content를 검사
   - 연관된 내용이 있다면 해당 노드를 MATCH하여 거기서부터 확장
   - 연관성 검사 예시 쿼리:
     MATCH (existing:Topic)
     WHERE existing.title CONTAINS '키워드' OR existing.content CONTAINS '키워드'
     WITH existing
     CREATE (new:Topic {{...}})
     CREATE (existing)-[:HAS_SUBTOPIC]->(new)

3. 계층 구조 생성 규칙:
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

4. 노드 생성 시:
   - 각 단계별로 적절한 추상화 수준 유지
   - 상위 개념은 포괄적으로, 하위 개념은 구체적으로 작성
   - 모든 노드에 mongo_ref: '{mongo_ref}' 포함
   - 새로운 노드 생성 시 기존 노드와의 중복성 검사
   - 각 노드는 반드시 하나의 답변 문장에 대응되어야 함
   - 각 노드의 mongo_ref 속성에는 해당 답변 문장의 line_id를 저장
   - 기존 노드에 연결 시 chat_room_id 및 account_id 일치 여부 확인

5. Cypher 쿼리 작성 규칙:
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

6. 관계 유형:
   - HAS_SUBTOPIC: 계층 관계 (상위->하위 개념)
   - RELATED_TO: 연관 관계 (유사 주제간)
   - COMPARED_TO: 비교 관계 (대조되는 개념)

7. 연관성 판단 기준:
   - 동일한 주제 영역
   - 유사한 개념/의미
   - 상위-하위 개념 관계
   - 원인-결과 관계
   - 부분-전체 관계
     

가능한 한 깊은 계층 구조를 만들되, 자연스러운 관계를 유지하세요.
기존 노드와의 연결을 최우선으로 고려하고, 완전히 새로운 주제인 경우에만 새 루트 노드를 생성하세요.
Cypher 쿼리만 반환하고 다른 설명은 하지 말아주세요.""")
])

# LangChain 체인 구성
query_chain = query_prompt | chat_model | StrOutputParser()

def get_mindmap_structure(account_id):
    """특정 account_id에 해당하는 마인드맵 구조를 반환"""
    with neo4j_driver.session(database="mindmap") as session:
        result = session.run("""
        MATCH (n:Topic)-[r]->(m:Topic)
        WHERE n.account_id = $account_id AND m.account_id = $account_id
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
        """, account_id=account_id)
        return result.single()["structure"]

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



@celery.task
def create_mindmap(account_id, chat_room_id, chat_id, question, answer_sentences):
    try:

        print(f"""
        마인드맵 생성 시작:
        - account_id: {account_id}
        - chat_room_id: {chat_room_id}
        - chat_id: {chat_id}
        - question: {question}
        - sentences: {len(answer_sentences)}개
        """)


        # 마인드맵 구조 가져오기
        current_structure = get_mindmap_structure(account_id)
        
        # 쿼리 생성을 위한 데이터 준비
        query_data = {
            "structure": json.dumps(current_structure, indent=2, default=str) if current_structure else "아직 생성된 노드가 없습니다.",
            "question": escape_cypher_quotes(question),
            "answer_lines": answer_sentences,
            "account_id": account_id,
            "chat_room_id": chat_room_id,
            "mongo_ref": chat_id
        }
        
        # 쿼리 생성 및 실행

        print("Cypher 쿼리 생성 시작")  
        query = query_chain.invoke(query_data)
        print(f"""생성된 Cypher 쿼리:{query}""")

        print("Neo4j 쿼리 실행 시작")
        with neo4j_driver.session(database="mindmap") as session:
            session.run(query)
        print("마인드맵 생성 작업 완료")
        return True
    
    except Exception as e:
        print(f"""마인드맵 생성 오류:
- Error Type: {type(e).__name__}
- Error Message: {str(e)}
""")
        return False
