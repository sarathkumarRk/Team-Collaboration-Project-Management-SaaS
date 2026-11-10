from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int


class ProjectAnalyticsResponse(BaseModel):
    project_id: int
    project_name: str
    total_tasks: int
    completed_tasks: int
    completion_percentage: float


class TeamPerformanceResponse(BaseModel):
    user_id: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int


class ProductivityReportResponse(BaseModel):
    period: str
    total_tasks: int
    completed_tasks: int
    pending_tasks: int