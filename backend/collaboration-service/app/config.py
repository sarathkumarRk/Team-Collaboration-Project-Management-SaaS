from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    COLLABORATION_DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    NOTIFICATION_SERVICE_URL: str = "http://127.0.0.1:8005"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore"
    )


settings = Settings()