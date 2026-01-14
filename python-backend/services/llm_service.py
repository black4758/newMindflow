"""
LLM 모델 초기화 및 관리 서비스
"""
import os
from dotenv import load_dotenv

from langchain_anthropic import ChatAnthropic
from langchain_community.chat_models import ChatClovaX
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

load_dotenv()

# 환경 변수로 API 키 설정
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
NCP_CLOVASTUDIO_API_KEY = os.getenv("NCP_CLOVASTUDIO_API_KEY")
NCP_APIGW_API_KEY = os.getenv("NCP_APIGW_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# LLM 인스턴스 초기화
google_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite", 
    temperature=0.5, 
    max_tokens=4096, 
    streaming=True
)

clova_llm = ChatClovaX(
    model="HCX-003", 
    max_tokens=4096, 
    temperature=0.5, 
    streaming=True
)

chatgpt_llm = ChatOpenAI(
    model="gpt-4o-mini", 
    temperature=0.5, 
    max_tokens=4096, 
    streaming=True
)

claude_llm = ChatAnthropic(
    model="claude-3-5-sonnet-latest", 
    temperature=0.5, 
    max_tokens=4096, 
    streaming=True
)

# 모델 매핑
LLM_MODELS = {
    'google': google_llm,
    'clova': clova_llm,
    'chatgpt': chatgpt_llm,
    'claude': claude_llm
}

# 모델 클래스 매핑
LLM_MODEL_CLASSES = {
    "google": ChatGoogleGenerativeAI, 
    "clova": ChatClovaX, 
    "chatgpt": ChatOpenAI,
    "claude": ChatAnthropic
}

def get_llm(model_name: str):
    """모델 이름으로 LLM 인스턴스 가져오기"""
    return LLM_MODELS.get(model_name)

def get_llm_class(model_name: str):
    """모델 이름으로 LLM 클래스 가져오기"""
    return LLM_MODEL_CLASSES.get(model_name)

def get_all_models_info():
    """모든 모델 정보 반환"""
    return {
        'clova': {'llm': clova_llm, 'detail_model': "HCX-003"},
        'chatgpt': {'llm': chatgpt_llm, 'detail_model': "gpt-4o-mini"},
        'claude': {'llm': claude_llm, 'detail_model': "claude-3-5-sonnet-latest"},
        'google': {'llm': google_llm, 'detail_model': "gemini-2.5-flash-lite"}
    }
