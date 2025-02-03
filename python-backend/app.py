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


from tasks import create_mindmap

load_dotenv()

app = Flask(__name__)

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


# LangChain 체인 구성
chat_chain = chat_prompt | chat_model | StrOutputParser()

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


@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        if not data or 'question' not in data:
            return jsonify({'status': 'error', 'message': '질문이 없습니다.'}), 400

        question = data['question']
        chat_id = str(uuid.uuid4())
        answer = chat_chain.invoke({"question": question})

        # 답변을 문장 단위로 분리
        answer_sentences = [line.strip() for line in answer.split('\n') if line.strip()]
        
        # 각 문장에 sentence_id 부여 및 Cypher 이스케이프 처리
        sentences_with_ids = [
            {
                'sentenceId': str(uuid.uuid4()),
                'content': escape_cypher_quotes(sentence)  # Cypher 이스케이프 처리
            }
            for sentence in answer_sentences
        ]

        create_mindmap.delay(
            account_id=data.get('accountId'),
            chat_room_id=data.get('chatRoomId'),
            chat_id=chat_id,
            question=data['question'],
            answer_sentences=sentences_with_ids
        )

        # MongoDB 저장용 응답에는 원본 텍스트 사용
        response_data = {
            'status': 'success',
            'id': chat_id,
            'answer': answer,
            'answerSentences': [
                {
                    'sentenceId': s['sentenceId'],
                    'content': sentence  # 원본 텍스트
                }
                for s, sentence in zip(sentences_with_ids, answer_sentences)
            ],
        }

        return jsonify(response_data)

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


# @app.route('/')
# def home():
#     return render_template('index.html')


if __name__ == '__main__':
    try:
        app.run(debug=True, port=5001)
    finally:
        neo4j_driver.close()
