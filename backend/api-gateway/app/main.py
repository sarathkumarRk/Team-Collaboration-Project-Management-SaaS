from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.gateway import router

app = FastAPI(
    title="Project Management API Gateway",
    description="Single entry point for all microservices",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(router)


@app.get("/")
def home():
    return {
        "message": "Project Management API Gateway is running"
    }

