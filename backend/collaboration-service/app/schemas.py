from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    task_id: int
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    user_id: int
    content: str
    created_at: datetime


class CommentMentionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    comment_id: int
    mentioned_user_id: int