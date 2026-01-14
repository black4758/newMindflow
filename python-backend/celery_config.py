from celery import Celery
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

from services.db_service import get_chat_memories, get_redis_url

load_dotenv()

REDIS_URL = get_redis_url()

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

# MongoDB 컬렉션 (db_service에서 가져옴)
chat_memories = get_chat_memories()

# 요약용 LLM 설정
summary_llm = ChatOpenAI(
    model="gpt-4o-mini", 
    temperature=0.3, 
    max_tokens=1024
)