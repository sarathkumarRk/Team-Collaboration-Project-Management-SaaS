import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Comment, CommentMention


# Create Comment
def create_comment(
    task_id: int,
    user_id: int,
    content: str,
    db: Session,
):
    comment = Comment(
        task_id=task_id,
        user_id=user_id,
        content=content,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Find Mentioned User IDs
    mentioned_users = set(
        re.findall(r"@(\d+)", content)
    )

    # Save Mentions
    for mentioned_user_id in mentioned_users:
        mentioned_user_id = int(mentioned_user_id)

        if mentioned_user_id == user_id:
            continue

        mention = CommentMention(
            comment_id=comment.id,
            mentioned_user_id=mentioned_user_id,
        )

        db.add(mention)

    db.commit()

    return comment


# Get Comment
def get_comment(
    comment_id: int,
    db: Session,
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    return comment