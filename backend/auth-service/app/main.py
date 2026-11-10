from fastapi import FastAPI

from app.database import Base, engine
from app.routes import auth, organizations, members


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Authentication & Organization Service",
    description="User authentication, JWT and organization management",
)


# Authentication Routes
app.include_router(auth.router)

# Organization Routes
app.include_router(organizations.router)

# Organization Member Routes
app.include_router(members.router)


# Home Route
@app.get("/")
def home():
    return {
        "message": "Authentication & Organization Service is running"
    }

