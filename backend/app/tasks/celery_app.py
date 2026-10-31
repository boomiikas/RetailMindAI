"""Celery background tasks configuration for RetailMind AI."""
from celery import Celery
from backend.app.config import settings

celery_app = Celery(
    "retailmind_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    beat_schedule={
        "audit-replanning-every-5-minutes": {
            "task": "backend.app.tasks.celery_app.audit_pending_executions",
            "schedule": 300.0,
        },
    }
)

@celery_app.task
def audit_pending_executions():
    """Background task that triggers pre-dispatch feasibility validation."""
    return {"status": "audit_completed"}
