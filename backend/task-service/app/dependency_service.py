from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Task, TaskStatus, TaskDependency


# Check Task Dependencies
def check_task_dependencies(
    task: Task,
    db: Session,
):
    dependencies = db.query(TaskDependency).filter(
        TaskDependency.task_id == task.id
    ).all()

    for dependency in dependencies:
        required_task = db.query(Task).filter(
            Task.id == dependency.depends_on_task_id
        ).first()

        if not required_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dependent task not found",
            )

        if required_task.status != TaskStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Complete prerequisite tasks first",
            )

    return True