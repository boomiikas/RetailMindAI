"""Configuration settings for RetailMind AI."""
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Resolve root directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "RetailMind AI Backend"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./retailmind.db"
    SYNC_DATABASE_URL: str = "sqlite:///./retailmind.db"
    DATABASE_ECHO: bool = False

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # LLM (Groq Cloud API)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    LLM_PROVIDER: str = "groq"
    LLM_TEMPERATURE: float = 0.1

    # WhatsApp Cloud API
    WHATSAPP_TOKEN: str = "mock_token"
    WHATSAPP_PHONE_NUMBER_ID: str = "mock_phone_id"
    WHATSAPP_VERIFY_TOKEN: str = "retailmind_meta_webhook_verify_secret"
    WHATSAPP_API_VERSION: str = "v21.0"
    USE_MOCK_WHATSAPP: bool = True

    # Security & CORS
    SECRET_KEY: str = "dev-retailmind-super-secret-key-32-chars-long!"
    ALLOWED_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


settings = Settings()
