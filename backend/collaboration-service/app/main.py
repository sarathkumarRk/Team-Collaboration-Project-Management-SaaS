from fastapi import FastAPI

from app.database import Base, engine
from app.routes import comments


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Collaboration Service",
    description="Task comments, discussions and real-time collaboration",
)


app.include_router(comments.router)


@app.get("/")
def home():
    return {
        "message": "Collaboration Service is running"
    }

