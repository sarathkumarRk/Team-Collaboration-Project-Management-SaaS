from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class NotificationCreate(BaseModel):
    user_id: Optional[int] = None
    recipient_email: EmailStr
    event_type: str
    subject: str
    message: str
    scheduled_at: Optional[datetime] = None


class MentionNotificationCreate(BaseModel):
    user_id: int
    recipient_email: EmailStr
    task_id: int
    comment_id: int
    message: str


class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int]
    recipient_email: EmailStr
    event_type: str
    subject: str
    message: str
    status: str
    error_message: Optional[str]
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True