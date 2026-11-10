from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy.orm import Session
import jwt

from app.database import get_db
from app.config import settings
from app.models import Comment, CommentMention
from app.schemas import CommentCreate, CommentUpdate, CommentResponse
from app.dependencies import get_current_user
from app.services import create_comment, get_comment
from app.websocket_manager import manager
from app.clients import send_mention_notification


router = APIRouter(
    prefix="/comments",
    tags=["Collaboration"],
)


# Create Comment
@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_comment(
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    comment = create_comment(
        data.task_id,
        current_user["id"],
        data.content,
        db,
    )

    message = {
        "event": "new_comment",
        "comment_id": comment.id,
        "task_id": comment.task_id,
        "user_id": comment.user_id,
        "content": comment.content,
    }

    # Send Real-Time Update
    await manager.broadcast(data.task_id, message)

    # Send Mention Notifications
    mentions = db.query(CommentMention).filter(
        CommentMention.comment_id == comment.id
    ).all()

    for mention in mentions:
        await send_mention_notification(
            user_id=mention.mentioned_user_id,
            task_id=comment.task_id,
            comment_id=comment.id,
            content=comment.content,
        )

    return {
        "message": "Comment added successfully",
        "comment_id": comment.id,
    }


# Get Task Comments
@router.get("/task/{task_id}", response_model=list[CommentResponse])
def get_task_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    comments = db.query(Comment).filter(
        Comment.task_id == task_id
    ).order_by(Comment.created_at.asc()).all()

    return comments


# Update Comment
@router.put("/{comment_id}")
def update_comment(
    comment_id: int,
    data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    comment = get_comment(comment_id, db)

    if comment.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can update only your own comments",
        )

    comment.content = data.content

    db.commit()
    db.refresh(comment)

    # Update Mention Records
    db.query(CommentMention).filter(
        CommentMention.comment_id == comment.id
    ).delete()

    import re

    mentioned_users = set(
        re.findall(r"@(\d+)", data.content)
    )

    for mentioned_user_id in mentioned_users:
        mentioned_user_id = int(mentioned_user_id)

        if mentioned_user_id == current_user["id"]:
            continue

        db.add(
            CommentMention(
                comment_id=comment.id,
                mentioned_user_id=mentioned_user_id,
            )
        )

    db.commit()

    return {
        "message": "Comment updated successfully",
    }


# Delete Comment
@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    comment = get_comment(comment_id, db)

    if comment.user_id != current_user["id"] and current_user["role"] not in [
        "ADMIN",
        "PROJECT_MANAGER",
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot delete this comment",
        )

    task_id = comment.task_id

    db.delete(comment)
    db.commit()

    return {
        "message": "Comment deleted successfully",
        "task_id": task_id,
    }


# WebSocket Real-Time Updates
@router.websocket("/ws/{task_id}")
async def task_websocket(
    websocket: WebSocket,
    task_id: int,
    token: str,
):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            await websocket.close(code=1008)
            return

    except (jwt.InvalidTokenError, ValueError):
        await websocket.close(code=1008)
        return

    await manager.connect(task_id, websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(task_id, websocket)