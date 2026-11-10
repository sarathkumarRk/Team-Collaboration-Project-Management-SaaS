from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification
from app.schemas import (
    NotificationCreate,
    MentionNotificationCreate,
    NotificationResponse
)
from app.services import (
    create_notification,
    get_user_notifications,
    get_all_notifications,
    get_notification,
    retry_notification
)
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.post(
    "/send",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED
)
def send_notification_route(
    data: NotificationCreate,
    db: Session = Depends(get_db)
):
    return create_notification(db, data)


@router.post(
    "/mentions",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED
)
def send_mention_notification(
    data: MentionNotificationCreate,
    db: Session = Depends(get_db)
):
    notification_data = NotificationCreate(
        user_id=data.user_id,
        recipient_email=data.recipient_email,
        event_type="COMMENT_MENTION",
        subject="You were mentioned in a task comment",
        message=(
            f"You were mentioned in a comment on Task {data.task_id}.\n\n"
            f"Comment ID: {data.comment_id}\n"
            f"Message: {data.message}"
        )
    )

    return create_notification(db, notification_data)


@router.get(
    "/",
    response_model=list[NotificationResponse]
)
def list_my_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return get_user_notifications(
        db,
        current_user["id"]
    )


@router.get(
    "/all",
    response_model=list[NotificationResponse]
)
def list_all_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return get_all_notifications(db)


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse
)
def get_notification_route(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    notification = get_notification(db, notification_id)

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    if (
        notification.user_id != current_user["id"]
        and current_user["role"] != "ADMIN"
    ):
        raise HTTPException(
            status_code=403,
            detail="You cannot access this notification"
        )

    return notification


@router.post(
    "/{notification_id}/retry",
    response_model=NotificationResponse
)
def retry_notification_route(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    notification = get_notification(db, notification_id)

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    if (
        notification.user_id != current_user["id"]
        and current_user["role"] != "ADMIN"
    ):
        raise HTTPException(
            status_code=403,
            detail="You cannot retry this notification"
        )

    if notification.status == "SENT":
        raise HTTPException(
            status_code=400,
            detail="Notification already sent"
        )

    return retry_notification(db, notification)