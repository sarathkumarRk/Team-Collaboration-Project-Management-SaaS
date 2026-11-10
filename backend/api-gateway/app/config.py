from pathlib import Path

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    GATEWAY_PORT: int = 8000

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    AUTH_SERVICE_URL: str = "http://127.0.0.1:8001"
    PROJECT_SERVICE_URL: str = "http://127.0.0.1:8002"
    TASK_SERVICE_URL: str = "http://127.0.0.1:8003"
    COLLABORATION_SERVICE_URL: str = "http://127.0.0.1:8004"
    NOTIFICATION_SERVICE_URL: str = "http://127.0.0.1:8005"
    ANALYTICS_SERVICE_URL: str = "http://127.0.0.1:8006"

    REQUEST_TIMEOUT: int = 10

    model_config = {
        "env_file": BASE_DIR / ".env",
        "extra": "ignore"
    }


settings = Settings()