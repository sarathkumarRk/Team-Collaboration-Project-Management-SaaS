from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Index
)

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=True, index=True)

    recipient_email = Column(String(255), nullable=False)

    event_type = Column(String(100), nullable=False)

    subject = Column(String(255), nullable=False)

    message = Column(Text, nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="PENDING"
    )

    error_message = Column(Text, nullable=True)

    scheduled_at = Column(DateTime, nullable=True)

    sent_at = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


Index(
    "ix_notifications_status_scheduled",
    Notification.status,
    Notification.scheduled_at
)