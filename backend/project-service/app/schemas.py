from datetime import date
from pydantic import BaseModel, ConfigDict, Field

from app.models import ProjectStatus, ProjectRole


class ProjectCreate(BaseModel):
    organization_id: int
    name: str
    description: str | None = None
    start_date: date
    deadline: date


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    start_date: date | None = None
    deadline: date | None = None
    status: ProjectStatus | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    name: str
    description: str | None
    start_date: date
    deadline: date
    status: ProjectStatus
    progress: float
    created_by: int


class ProjectMemberCreate(BaseModel):
    user_id: int
    role: ProjectRole


class ProjectMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    user_id: int
    role: ProjectRole


class ProjectProgressUpdate(BaseModel):
    progress: float = Field(ge=0, le=100)