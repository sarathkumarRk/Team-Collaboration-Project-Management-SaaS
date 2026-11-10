from fastapi import FastAPI

from app.database import Base, engine
from app.routes import projects


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Project Management Service",
    description="Create and manage projects and project members",
)


app.include_router(projects.router)


@app.get("/")
def home():
    return {
        "message": "Project Management Service is running"
    }
