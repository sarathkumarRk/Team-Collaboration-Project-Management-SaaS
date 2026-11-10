from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

from app.models import TaskStatus, TaskPriority


class TaskCreate(BaseModel):
    project_id: int
    title: str
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: date | None = None
    assigned_to: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None
    status: TaskStatus | None = None
    assigned_to: int | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: str | None
    priority: TaskPriority
    due_date: date | None
    status: TaskStatus
    assigned_to: int | None
    created_by: int


class TaskAssign(BaseModel):
    assigned_to: int


class TaskDependencyCreate(BaseModel):
    depends_on_task_id: int


class TaskDependencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    depends_on_task_id: int


class TaskActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    user_id: int
    action: str
    description: str | None
    created_at: datetime