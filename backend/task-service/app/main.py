from fastapi import FastAPI

from app.database import Base, engine
from app.routes import tasks


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Task Management Service",
    description="Create, assign and manage tasks and dependencies",
)


app.include_router(tasks.router)


@app.get("/")
def home():
    return {
        "message": "Task Management Service is running"
    }
