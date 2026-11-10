from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.clients import get_projects, get_tasks

from app.analytics_service import (
    get_dashboard_analytics,
    get_project_analytics,
    get_team_performance,
    get_productivity_report
)

from app.schemas import (
    DashboardResponse,
    ProjectAnalyticsResponse,
    TeamPerformanceResponse,
    ProductivityReportResponse
)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


def get_analytics_data(current_user):
    token = current_user["token"]

    projects = get_projects(token)
    tasks = get_tasks(token)

    return projects, tasks


@router.get(
    "/dashboard",
    response_model=DashboardResponse
)
def dashboard(
    current_user: dict = Depends(get_current_user)
):
    projects, tasks = get_analytics_data(current_user)

    return get_dashboard_analytics(projects, tasks)


@router.get(
    "/projects",
    response_model=list[ProjectAnalyticsResponse]
)
def project_analytics(
    current_user: dict = Depends(get_current_user)
):
    projects, tasks = get_analytics_data(current_user)

    return get_project_analytics(projects, tasks)


@router.get(
    "/team-performance",
    response_model=list[TeamPerformanceResponse]
)
def team_performance(
    current_user: dict = Depends(get_current_user)
):
    projects, tasks = get_analytics_data(current_user)

    return get_team_performance(tasks)


@router.get(
    "/weekly-report",
    response_model=ProductivityReportResponse
)
def weekly_report(
    current_user: dict = Depends(get_current_user)
):
    projects, tasks = get_analytics_data(current_user)

    return get_productivity_report(tasks, "weekly")


@router.get(
    "/monthly-report",
    response_model=ProductivityReportResponse
)
def monthly_report(
    current_user: dict = Depends(get_current_user)
):
    projects, tasks = get_analytics_data(current_user)

    return get_productivity_report(tasks, "monthly")