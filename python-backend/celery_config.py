from celery import Celery

# 작업을 자동으로 찾을 수 있도록 설정
celery = Celery('mindflow',
                broker='redis://localhost:6379/0',
                backend='redis://localhost:6379/0',
                include=['tasks'],
                task_track_started=True,
                task_publish_retry=True
                )  # tasks 모듈 명시적으로 포함

# Celery 설정
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
)
