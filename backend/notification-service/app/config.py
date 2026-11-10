from pathlib import Path

from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"    
    NOTIFICATION_DATABASE_URL: str

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str

    model_config = {
        "env_file": BASE_DIR / ".env",
        "extra": "ignore"
    }


settings = Settings()