from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import Base, engine
from app.routes.notifications import router as notification_router
from app.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    start_scheduler()

    yield

    stop_scheduler()


app = FastAPI(
    title="Notification Service",
    description="Email Notifications and Notification Logs",
    lifespan=lifespan
)

app.include_router(notification_router)


@app.get("/")
def home():
    return {
        "message": "Notification Service is running"
    }

