from celery import Celery
from pymongo import MongoClient
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

# Docker 환경인지 확인
IS_DOCKER = os.getenv('IS_DOCKER', 'false').lower() == 'true'

# Redis 호스트 설정
REDIS_HOST = 'redis' if IS_DOCKER else 'localhost'
REDIS_PORT = '6379' if IS_DOCKER else '6380'  # 로컬에서는 6380 포트 사용
REDIS_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/0'

celery = Celery('mindflow',
                broker=REDIS_URL,
                backend=REDIS_URL,
                include=['tasks.mindmap', 'tasks.memory'],
                task_track_started=True,
                task_publish_retry=True)

# Celery 설정
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
    broker_connection_retry_on_startup=True
)

# MongoDB 설정 (독립적 연결)
mongo_client = MongoClient(os.getenv('MONGODB_URI'))
db = mongo_client['mindflow_db']
chat_memories = db['chat_memories']

# 요약용 LLM 설정
summary_llm = ChatOpenAI(
    model="gpt-4o-mini", 
    temperature=0.3, 
    max_tokens=1024
)