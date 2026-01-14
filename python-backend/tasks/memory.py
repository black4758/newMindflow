from celery_config import celery, chat_memories, summary_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from datetime import datetime
import traceback

@celery.task
def summarize_messages(chat_room_id, threshold=50):
    """
    백그라운드에서 오래된 메시지를 요약합니다.
    Safe Handover 전략: Target IDs를 스냅샷 떠서 해당 메시지만 요약/삭제합니다.
    """
    try:
        # 1. 메시지 가져오기 (오래된 순)
        doc = chat_memories.find_one({"chat_room_id": int(chat_room_id)})
        if not doc or "messages" not in doc:
            return "No messages found"

        messages = doc['messages']
        if len(messages) <= threshold:
            return "Not enough messages to simply"

        # 요약할 대상 선정 (threshold 초과분 + 여유 5개, 최대 절반)
        target_count = 5 
        
        if len(messages) < (threshold + target_count): 
             target_count = min(target_count, len(messages) // 2)

        if target_count == 0:
             return "Skipped summarization"

        target_messages = messages[:target_count]
        
        # 2. 요약 수행
        # 기존 요약 가져오기 (chat_memories 문서 내 'summary' 필드)
        prev_summary = doc.get('summary', "")

        # 프롬프트 구성
        chat_content = "\n".join([f"{msg.get('role','unknown')}: {msg.get('content','')}" for msg in target_messages])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "너는 대화 요약 전문가야. 이전 요약과 새로운 대화 내용을 합쳐서 하나의 자연스러운 요약문을 만들어줘."),
            ("human", f"""
            이전 요약: {prev_summary}
            
            새로운 대화 내용:
            {chat_content}
            
            지침:
            1. 중요한 정보(이름, 날짜, 핵심 주제)는 반드시 보존해.
            2. 불필요한 인사말이나 반복은 제거해.
            3. 전체 맥락을 이해할 수 있도록 서술형으로 3줄 이내로 간결하게 요약해.
            정보가 누락되지 않게 주의해.
            """)
        ])
        
        chain = prompt | summary_llm | StrOutputParser()
        new_summary = chain.invoke({})
        
        print(f"[요약] room={chat_room_id}, 생성 완료")

        # 3. DB 업데이트 (단일 문서 업데이트로 통합)
        chat_memories.update_one(
            {"chat_room_id": int(chat_room_id)},
            {
                "$set": {"summary": new_summary, "updated_at": datetime.now()},
                "$pullAll": {"messages": target_messages}
            }
        )
        
        print(f"[요약] room={chat_room_id}, {target_count}개 메시지 압축")
        return True

    except Exception as e:
        print(f"[요약] 오류: {e}")
        return False

@celery.task
def test_task():
    print("[테스트] task received")
    return True
