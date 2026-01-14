"""
데이터베이스 연결 관리 서비스
MongoDB, Neo4j 연결을 중앙에서 관리
"""
import os
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
from neo4j import GraphDatabase

load_dotenv()

# 불필요한 경고 로그 숨기기
logging.getLogger("neo4j").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.WARNING)


# Docker 환경인지 확인
IS_DOCKER = os.getenv('IS_DOCKER', 'false').lower() == 'true'


# ==================== MongoDB ====================
_mongo_client = None

def get_mongo_client():
    """MongoDB 클라이언트 싱글톤"""
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(os.getenv('MONGODB_URI'))
    return _mongo_client

def get_mongo_db(db_name: str = 'mindflow_db'):
    """MongoDB 데이터베이스 가져오기"""
    return get_mongo_client()[db_name]

# 컬렉션 헬퍼
def get_chat_memories():
    return get_mongo_db()['chat_memories']

def get_chat_rooms():
    return get_mongo_db()['chat_rooms']

def get_chat_logs():
    return get_mongo_db()['chat_logs']


# ==================== Neo4j ====================
_neo4j_driver = None

def get_neo4j_driver():
    """Neo4j 드라이버 싱글톤"""
    global _neo4j_driver
    if _neo4j_driver is None:
        try:
            neo4j_uri = os.getenv("NEO4J_URI")
            neo4j_user = os.getenv("NEO4J_USER")
            neo4j_password = os.getenv("NEO4J_PASSWORD")
            _neo4j_driver = GraphDatabase.driver(
                neo4j_uri,
                auth=(neo4j_user, neo4j_password),
                database="mindmap"
            )
        except Exception as e:
            print(f"Neo4j 연결 오류: {str(e)}")
            raise
    return _neo4j_driver


# ==================== Redis URL ====================
def get_redis_url():
    """Redis URL 가져오기"""
    redis_host = 'redis' if IS_DOCKER else 'localhost'
    redis_port = '6379' if IS_DOCKER else '6380'
    return f'redis://{redis_host}:{redis_port}/0'


# ==================== 연결 종료 ====================
def close_connections():
    """모든 DB 연결 종료"""
    global _mongo_client, _neo4j_driver
    
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
    
    if _neo4j_driver:
        _neo4j_driver.close()
        _neo4j_driver = None
