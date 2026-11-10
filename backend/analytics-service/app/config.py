from pathlib import Path

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    PROJECT_SERVICE_URL: str = "http://127.0.0.1:8002"
    TASK_SERVICE_URL: str = "http://127.0.0.1:8003"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    model_config = {
        "env_file": BASE_DIR / ".env",
        "extra": "ignore"
    }


settings = Settings()