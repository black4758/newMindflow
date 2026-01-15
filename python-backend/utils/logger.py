"""
중앙 로깅 설정
Python logging 모듈을 사용한 구조화된 로그 출력
"""
import logging
import sys
from typing import Dict, Any


# 애플리케이션 로깅 기본 설정 (앱 시작 시 한 번만 실행)
def configure_logging(level: int = logging.INFO):
    """
    애플리케이션 전체의 로깅을 설정합니다.
    app.py 시작 시 한 번만 호출하면 됩니다.
    
    Args:
        level: 로그 레벨 (기본: INFO)
    """
    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # 기존 핸들러 제거 (중복 방지)
    root_logger.handlers.clear()
    
    # 콘솔 핸들러 생성
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # 포맷 정의
    formatter = logging.Formatter(
        fmt='%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    root_logger.addHandler(console_handler)


def log_error(logger: logging.Logger, title: str, error: Exception, context: Dict[str, Any] = None):
    """
    에러를 구조화된 형식으로 로깅합니다.
    
    Args:
        logger: Logger 객체
        title: 에러 타이틀
        error: Exception 객체
        context: 추가 컨텍스트 정보
    """
    separator = "=" * 80
    logger.error(separator)
    logger.error(f"{title}")
    logger.error(separator)
    
    if context:
        logger.error("컨텍스트:")
        for key, value in context.items():
            logger.error(f"  {key}: {value}")
    
    # Error code 파싱
    error_msg = str(error)
    if "Error code:" in error_msg:
        parts = error_msg.split(" - ", 1)
        logger.error(f"오류 코드: {parts[0].replace('Error code:', '').strip()}")
        
        if len(parts) > 1:
            logger.error("오류 상세:")
            try:
                import ast
                error_dict = ast.literal_eval(parts[1])
                for key, value in error_dict.items():
                    if isinstance(value, dict):
                        logger.error(f"  {key}:")
                        for k, v in value.items():
                            logger.error(f"    {k}: {v}")
                    else:
                        logger.error(f"  {key}: {value}")
            except:
                logger.error(f"  {parts[1]}")
    else:
        logger.error(f"오류 내용: {error_msg}")
    
    logger.error(f"에러 타입: {type(error).__name__}")
    logger.error(separator)


def log_info_block(logger: logging.Logger, title: str, content: str = None, context: Dict[str, Any] = None):
    """
    정보를 구조화된 블록 형식으로 로깅합니다.
    
    Args:
        logger: Logger 객체
        title: 정보 타이틀
        content: 메인 컨텐츠 (긴 텍스트)
        context: 추가 컨텍스트 정보
    """
    separator = "=" * 80
    logger.info(separator)
    logger.info(f"{title}")
    logger.info(separator)
    
    if context:
        for key, value in context.items():
            logger.info(f"  {key}: {value}")
    
    if content:
        # 줄바꿈이 있는 텍스트는 그대로 출력
        if '\n' in content:
            lines = content.split('\n')
            for line in lines:
                logger.info(f"  {line}")
        else:
            # 긴 한 줄 텍스트는 80자마다 줄바꿈
            if len(content) > 80:
                for i in range(0, len(content), 80):
                    logger.info(f"  {content[i:i+80]}")
            else:
                logger.info(f"  {content}")
    
    logger.info(separator)
