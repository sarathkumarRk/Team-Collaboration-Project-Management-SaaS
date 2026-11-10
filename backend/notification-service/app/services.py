from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Notification
from app.email_service import send_email


def create_notification(
    db: Session,
    data
):
    notification = Notification(
        user_id=data.user_id,
        recipient_email=str(data.recipient_email),
        event_type=data.event_type,
        subject=data.subject,
        message=data.message,
        scheduled_at=data.scheduled_at,
        status="PENDING"
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    if notification.scheduled_at is None:
        send_notification(db, notification)

    return notification


def send_notification(
    db: Session,
    notification: Notification
):
    try:
        send_email(
            recipient_email=notification.recipient_email,
            subject=notification.subject,
            message=notification.message
        )

        notification.status = "SENT"
        notification.error_message = None
        notification.sent_at = datetime.utcnow()

    except Exception as error:
        notification.status = "FAILED"
        notification.error_message = str(error)

    db.commit()
    db.refresh(notification)

    return notification


def get_user_notifications(
    db: Session,
    user_id: int
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def get_all_notifications(db: Session):
    return (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .all()
    )


def get_notification(
    db: Session,
    notification_id: int
):
    return (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )


def retry_notification(
    db: Session,
    notification: Notification
):
    if notification.status == "SENT":
        return notification

    return send_notification(db, notification)