from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Task,
    TaskStatus,
    TaskDependency,
    TaskActivity,
)
from app.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskAssign,
    TaskDependencyCreate,
    TaskDependencyResponse,
    TaskActivityResponse,
)
from app.dependencies import (
    get_current_user,
    project_manager_required,
)
from app.services import (
    get_task,
    check_task_access,
    save_task_activity,
)
from app.dependency_service import check_task_dependencies


router = APIRouter(prefix="/tasks", tags=["Tasks"])


# Create Task
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(project_manager_required),
):
    task = Task(
        project_id=data.project_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        due_date=data.due_date,
        assigned_to=data.assigned_to,
        created_by=current_user["id"],
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    save_task_activity(
        task.id,
        current_user["id"],
        "CREATED",
        "Task created",
        db,
    )

    return {
        "message": "Task created successfully",
        "task_id": task.id,
    }


# Get All Tasks
@router.get("/", response_model=list[TaskResponse])
def get_all_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = db.query(Task)

    if current_user["role"] == "TEAM_MEMBER":
        query = query.filter(
            Task.assigned_to == current_user["id"]
        )

    return query.all()


# Get Task By ID
@router.get("/{task_id}", response_model=TaskResponse)
def get_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = get_task(task_id, db)

    check_task_access(task, current_user)

    return task


# Update Task
@router.put("/{task_id}")
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = get_task(task_id, db)

    check_task_access(task, current_user)

    update_data = data.model_dump(exclude_unset=True)

    # Team Member Can Update Only Task Status
    if current_user["role"] == "TEAM_MEMBER":
        if any(key != "status" for key in update_data):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Team members can update only task status",
            )

    if task.status == TaskStatus.COMPLETED:
        if data.status is not None and data.status != TaskStatus.COMPLETED:
            if current_user["role"] not in ["ADMIN", "PROJECT_MANAGER"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only Project Manager can reopen completed tasks",
                )

    # Check Task Dependencies
    if data.status == TaskStatus.COMPLETED:
        check_task_dependencies(task, db)

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    save_task_activity(
        task.id,
        current_user["id"],
        "UPDATED",
        "Task details updated",
        db,
    )

    return {
        "message": "Task updated successfully",
        "task_id": task.id,
        "status": task.status.value,
    }


# Assign Task
@router.patch("/{task_id}/assign")
def assign_task(
    task_id: int,
    data: TaskAssign,
    db: Session = Depends(get_db),
    current_user: dict = Depends(project_manager_required),
):
    task = get_task(task_id, db)

    if task.assigned_to == data.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is already assigned to this user",
        )

    task.assigned_to = data.assigned_to

    db.commit()

    save_task_activity(
        task.id,
        current_user["id"],
        "ASSIGNED",
        f"Task assigned to user {data.assigned_to}",
        db,
    )

    return {
        "message": "Task assigned successfully",
        "assigned_to": task.assigned_to,
    }


# Add Task Dependency
@router.post(
    "/{task_id}/dependencies",
    status_code=status.HTTP_201_CREATED,
)
def add_task_dependency(
    task_id: int,
    data: TaskDependencyCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(project_manager_required),
):
    task = get_task(task_id, db)

    required_task = get_task(data.depends_on_task_id, db)

    if task.id == required_task.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A task cannot depend on itself",
        )

    if task.project_id != required_task.project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tasks must belong to the same project",
        )

    existing_dependency = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id,
        TaskDependency.depends_on_task_id == data.depends_on_task_id,
    ).first()

    if existing_dependency:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dependency already exists",
        )

    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add dependency to a completed task",
        )

    dependency = TaskDependency(
        task_id=task_id,
        depends_on_task_id=data.depends_on_task_id,
    )

    db.add(dependency)
    db.commit()
    db.refresh(dependency)

    save_task_activity(
        task.id,
        current_user["id"],
        "DEPENDENCY_ADDED",
        f"Task depends on task {required_task.id}",
        db,
    )

    return {
        "message": "Task dependency added successfully",
    }


# Get Task Dependencies
@router.get(
    "/{task_id}/dependencies",
    response_model=list[TaskDependencyResponse],
)
def get_task_dependencies(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = get_task(task_id, db)

    check_task_access(task, current_user)

    dependencies = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id
    ).all()

    return dependencies


# Get Task Activity History
@router.get(
    "/{task_id}/activities",
    response_model=list[TaskActivityResponse],
)
def get_task_activities(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = get_task(task_id, db)

    check_task_access(task, current_user)

    activities = db.query(TaskActivity).filter(
        TaskActivity.task_id == task_id
    ).order_by(TaskActivity.created_at.desc()).all()

    return activities


# Delete Task
@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(project_manager_required),
):
    task = get_task(task_id, db)

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully",
    }