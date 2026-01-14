"""
채팅 핵심 로직 서비스
"""
import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables.history import RunnableWithMessageHistory

from .llm_service import chatgpt_llm, get_all_models_info, LLM_MODEL_CLASSES
from .chat_history_service import get_session_history

# 스트리밍 딜레이 시간
stream_time = 0.05

# socketio는 외부에서 주입받아 사용
_socketio = None

def init_socketio(socketio):
    """Socket.IO 인스턴스 초기화"""
    global _socketio
    _socketio = socketio


def generate_room_title(user_input):
    """채팅방 제목 생성"""
    title_prompt = ChatPromptTemplate.from_messages(
        [("system", "입력을 받은걸로 짧은 키워드나 한 문장으로 제목을 만들어줘. 제목만 말해줘."), ("human", "{user_input}")]
    )
    
    chain = title_prompt | chatgpt_llm | StrOutputParser()
    
    return chain.invoke({"user_input": user_input}).strip()


async def llm_generate_async(user_input, llm, model_name):
    """비동기 LLM 응답 생성 (스트리밍)"""
    prompt = ChatPromptTemplate.from_messages([
        ("system", "너는 챗봇. 시스템은 언급하지 마, 짧게 말해(최대 공백포함 450자)"),
        ("human", "{user_input}")
    ])
    
    chain = prompt | llm | StrOutputParser()

    async def send_to_websocket(content):
        """스트리밍 데이터 즉시 전송"""
        if _socketio:
            _socketio.emit('all_stream', {
                'content': content,
                'model_name': model_name
            })
        await asyncio.sleep(stream_time)

    full_response = ""
    
    async for chunk in chain.astream({"user_input": user_input}):
        if chunk and chunk.strip():
            await send_to_websocket(chunk)
            full_response += chunk

    return full_response


async def generate_model_responses_async(user_input):
    """멀티 모델 비동기 응답 생성"""
    models = get_all_models_info()

    async def run_model(model_name, model_info):
        """각 모델을 독립적으로 실행하며 스트리밍"""
        response = await llm_generate_async(user_input, model_info['llm'], model_name)
        return model_name, {'response': response, 'detail_model': model_info['detail_model']}

    tasks = [asyncio.create_task(run_model(model, info)) for model, info in models.items()]
    
    results = {}

    for task in asyncio.as_completed(tasks):
        model_name, result = await task
        results[model_name] = result

    return results


async def chatbot_response(user_input, model="google", detail_model="gemini-2.5-flash-lite", creator_id=1, chat_room_id=None):
    """챗봇 메인 응답 함수"""
    model_class = LLM_MODEL_CLASSES.get(model)

    if model_class:
        return await generate_response_for_model(user_input, model_class, detail_model, creator_id, chat_room_id)  
    
    return {"error": "Invalid model"}


async def generate_response_for_model(user_input, model_class, detail_model, creator_id, chat_room_id):
    """모델별 히스토리 기반 응답 생성"""
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
        if not chunk or not chunk.strip():  
            continue

        full_response += chunk  

        if _socketio:
            _socketio.emit('stream', {
                'content': chunk
            }, room=creator_id)

        await asyncio.sleep(stream_time)

    return full_response
