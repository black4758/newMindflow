"""
MongoDB 기반 채팅 히스토리 관리 서비스
"""
import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage, SystemMessage
from langchain_core.chat_history import BaseChatMessageHistory

load_dotenv()

# MongoDB 클라이언트 초기화
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['mindflow_db']

# 컬렉션 정의
chat_rooms = db['chat_rooms']
chat_logs = db['chat_logs']
chat_memories = db['chat_memories']


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
        # 요약본이 있는지 확인하고 맨 앞에 추가
        # 같은 doc 안에 summary 필드로 존재함
        if doc and "summary" in doc:
             summary_message = SystemMessage(content=f"이전 대화 요약: {doc['summary']}")
             messages.insert(0, summary_message)
             
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
    """세션 ID로 채팅 히스토리 가져오기"""
    return MongoDBChatHistory(session_id)
