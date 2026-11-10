from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Task, TaskActivity


# Get Task
def get_task(
    task_id: int,
    db: Session,
):
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return task


# Check Task Access
def check_task_access(
    task: Task,
    current_user: dict,
):
    if current_user["role"] in ["ADMIN", "PROJECT_MANAGER"]:
        return True

    if task.assigned_to != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access this task",
        )

    return True


# Save Task Activity
def save_task_activity(
    task_id: int,
    user_id: int,
    action: str,
    description: str,
    db: Session,
):
    activity = TaskActivity(
        task_id=task_id,
        user_id=user_id,
        action=action,
        description=description,
    )

    db.add(activity)
    db.commit()

    return activity