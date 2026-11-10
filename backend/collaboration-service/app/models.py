from sqlalchemy import (
    Column,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(Integer, nullable=False, index=True)

    user_id = Column(Integer, nullable=False)

    content = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    mentions = relationship(
        "CommentMention",
        back_populates="comment",
        cascade="all, delete-orphan"
    )


class CommentMention(Base):
    __tablename__ = "comment_mentions"

    __table_args__ = (
        UniqueConstraint(
            "comment_id",
            "mentioned_user_id",
            name="unique_comment_mention"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    comment_id = Column(
        Integer,
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=False
    )

    mentioned_user_id = Column(Integer, nullable=False)

    comment = relationship(
        "Comment",
        back_populates="mentions"
    )