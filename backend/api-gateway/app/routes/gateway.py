import logging
from typing import Any, Optional

import httpx

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response
)

from app.config import settings
from app.dependencies import get_current_user, admin_required


router = APIRouter()
logger = logging.getLogger(__name__)


AUTH_SERVICE_URL = settings.AUTH_SERVICE_URL
PROJECT_SERVICE_URL = settings.PROJECT_SERVICE_URL
TASK_SERVICE_URL = settings.TASK_SERVICE_URL
COLLABORATION_SERVICE_URL = settings.COLLABORATION_SERVICE_URL
NOTIFICATION_SERVICE_URL = settings.NOTIFICATION_SERVICE_URL
ANALYTICS_SERVICE_URL = settings.ANALYTICS_SERVICE_URL


async def forward_request(
    request: Request,
    service_url: str,
    path: str,
    json_body: Optional[dict[str, Any]] = None
):
    url = f"{service_url.rstrip('/')}/{path.lstrip('/')}"

    excluded_request_headers = {
        "host",
        "content-length",
        "content-encoding",
        "connection",
        "transfer-encoding"
    }

    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in excluded_request_headers
    }

    try:
        request_body = None

        if request.method not in ["GET", "HEAD"] and json_body is None:
            request_body = await request.body()

        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT,
            follow_redirects=True
        ) as client:

            if json_body is not None:
                response = await client.request(
                    method=request.method,
                    url=url,
                    params=request.query_params,
                    headers=headers,
                    json=json_body
                )
            else:
                response = await client.request(
                    method=request.method,
                    url=url,
                    params=request.query_params,
                    headers=headers,
                    content=request_body
                )

        excluded_response_headers = {
            "content-encoding",
            "content-length",
            "transfer-encoding",
            "connection"
        }

        response_headers = {
            key: value
            for key, value in response.headers.items()
            if key.lower() not in excluded_response_headers
        }

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers
        )

    except httpx.TimeoutException:
        logger.exception("Service request timed out: %s", url)

        raise HTTPException(
            status_code=504,
            detail="Microservice request timed out"
        )

    except httpx.RequestError:
        logger.exception("Service connection failed: %s", url)

        raise HTTPException(
            status_code=503,
            detail="Microservice is currently unavailable"
        )



# AUTHENTICATION SERVICE
@router.post(
    "/auth/register",
    tags=["Authentication"],
    summary="Register User"
)
async def register_user(request: Request):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        "auth/register"
    )


@router.post(
    "/auth/login",
    tags=["Authentication"],
    summary="Login User"
)
async def login_user(request: Request):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        "auth/login"
    )


@router.get(
    "/auth/users",
    tags=["Authentication"],
    summary="Get All Users"
)
async def get_all_users(
    request: Request,
    admin: dict = Depends(admin_required)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        "auth/users"
    )


@router.get(
    "/auth/me",
    tags=["Authentication"],
    summary="Get Current User"
)
async def get_current_user_details(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        "auth/me"
    )


# ORGANIZATION SERVICE


@router.post(
    "/organizations/",
    tags=["Organizations"],
    summary="Create Organization"
)
async def create_organization(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        "organizations/"
    )


@router.get(
    "/organizations/",
    tags=["Organizations"],
    summary="Get My Organizations"
)
async def get_organizations(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        "organizations/"
    )


@router.get(
    "/organizations/{organization_id}",
    tags=["Organizations"],
    summary="Get Organization"
)
async def get_organization(
    organization_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        f"organizations/{organization_id}"
    )


@router.put(
    "/organizations/{organization_id}",
    tags=["Organizations"],
    summary="Update Organization"
)
async def update_organization(
    organization_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        f"organizations/{organization_id}"
    )


@router.post(
    "/organizations/{organization_id}/members",
    tags=["Organizations"],
    summary="Add Organization Member"
)
async def add_organization_member(
    organization_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        f"organizations/{organization_id}/members"
    )


@router.get(
    "/organizations/{organization_id}/members",
    tags=["Organizations"],
    summary="Get Organization Members"
)
async def get_organization_members(
    organization_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        f"organizations/{organization_id}/members"
    )


@router.put(
    "/organizations/{organization_id}/members/{user_id}",
    tags=["Organizations"],
    summary="Update Member Role"
)
async def update_member_role(
    organization_id: int,
    user_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        f"organizations/{organization_id}/members/{user_id}"
    )


@router.delete(
    "/organizations/{organization_id}/members/{user_id}",
    tags=["Organizations"],
    summary="Remove Organization Member"
)
async def remove_organization_member(
    organization_id: int,
    user_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        AUTH_SERVICE_URL,
        f"organizations/{organization_id}/members/{user_id}"
    )


# PROJECT MANAGEMENT SERVICE


@router.post(
    "/projects/",
    tags=["Projects"],
    summary="Create Project"
)
async def create_project(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        PROJECT_SERVICE_URL,
        "projects/"
    )


@router.get(
    "/projects/",
    tags=["Projects"],
    summary="Get All Projects"
)
async def get_projects(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        PROJECT_SERVICE_URL,
        "projects/"
    )


@router.get(
    "/projects/{project_id}",
    tags=["Projects"],
    summary="Get Project By ID"
)
async def get_project(
    project_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        PROJECT_SERVICE_URL,
        f"projects/{project_id}"
    )


@router.put(
    "/projects/{project_id}",
    tags=["Projects"],
    summary="Update Project"
)
async def update_project(
    project_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        PROJECT_SERVICE_URL,
        f"projects/{project_id}"
    )


@router.patch(
    "/projects/{project_id}/archive",
    tags=["Projects"],
    summary="Archive Project"
)
async def archive_project(
    project_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        PROJECT_SERVICE_URL,
        f"projects/{project_id}/archive"
    )


@router.delete(
    "/projects/{project_id}",
    tags=["Projects"],
    summary="Delete Project"
)
async def delete_project(
    project_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        PROJECT_SERVICE_URL,
        f"projects/{project_id}"
    )


@router.post(
    "/projects/{project_id}/members",
    tags=["Projects"],
    summary="Add Project Member"
)
async def add_project_member(
    project_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        PROJECT_SERVICE_URL,
        f"projects/{project_id}/members"
    )


@router.get(
    "/projects/{project_id}/members",
    tags=["Projects"],
    summary="Get Project Members"
)
async def get_project_members(
    project_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        PROJECT_SERVICE_URL,
        f"projects/{project_id}/members"
    )


@router.patch(
    "/projects/{project_id}/progress",
    tags=["Projects"],
    summary="Update Project Progress"
)
async def update_project_progress(
    project_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        PROJECT_SERVICE_URL,
        f"projects/{project_id}/progress"
    )


# TASK MANAGEMENT SERVICE


@router.post(
    "/tasks/",
    tags=["Tasks"],
    summary="Create Task"
)
async def create_task(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        TASK_SERVICE_URL,
        "tasks/"
    )


@router.get(
    "/tasks/",
    tags=["Tasks"],
    summary="Get All Tasks"
)
async def get_tasks(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        TASK_SERVICE_URL,
        "tasks/"
    )


@router.get(
    "/tasks/{task_id}",
    tags=["Tasks"],
    summary="Get Task By ID"
)
async def get_task(
    task_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        TASK_SERVICE_URL,
        f"tasks/{task_id}"
    )


@router.put(
    "/tasks/{task_id}",
    tags=["Tasks"],
    summary="Update Task"
)
async def update_task(
    task_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        TASK_SERVICE_URL,
        f"tasks/{task_id}"
    )


@router.patch(
    "/tasks/{task_id}/assign",
    tags=["Tasks"],
    summary="Assign Task"
)
async def assign_task(
    task_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        TASK_SERVICE_URL,
        f"tasks/{task_id}/assign"
    )


@router.post(
    "/tasks/{task_id}/dependencies",
    tags=["Tasks"],
    summary="Add Task Dependency"
)
async def add_task_dependency(
    task_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        TASK_SERVICE_URL,
        f"tasks/{task_id}/dependencies"
    )


@router.get(
    "/tasks/{task_id}/dependencies",
    tags=["Tasks"],
    summary="Get Task Dependencies"
)
async def get_task_dependencies(
    task_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        TASK_SERVICE_URL,
        f"tasks/{task_id}/dependencies"
    )


@router.get(
    "/tasks/{task_id}/activities",
    tags=["Tasks"],
    summary="Get Task Activities"
)
async def get_task_activities(
    task_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        TASK_SERVICE_URL,
        f"tasks/{task_id}/activities"
    )


@router.delete(
    "/tasks/{task_id}",
    tags=["Tasks"],
    summary="Delete Task"
)
async def delete_task(
    task_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        TASK_SERVICE_URL,
        f"tasks/{task_id}"
    )


# COLLABORATION SERVICE


@router.post(
    "/comments/",
    tags=["Collaboration"],
    summary="Create Comment"
)
async def create_comment(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        COLLABORATION_SERVICE_URL,
        "comments/"
    )


@router.get(
    "/comments/task/{task_id}",
    tags=["Collaboration"],
    summary="Get Task Comments"
)
async def get_task_comments(
    task_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        COLLABORATION_SERVICE_URL,
        f"comments/task/{task_id}"
    )


@router.put(
    "/comments/{comment_id}",
    tags=["Collaboration"],
    summary="Update Comment"
)
async def update_comment(
    comment_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        COLLABORATION_SERVICE_URL,
        f"comments/{comment_id}"
    )


@router.delete(
    "/comments/{comment_id}",
    tags=["Collaboration"],
    summary="Delete Comment"
)
async def delete_comment(
    comment_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        COLLABORATION_SERVICE_URL,
        f"comments/{comment_id}"
    )


# NOTIFICATION SERVICE


@router.post(
    "/notifications/send",
    tags=["Notifications"],
    summary="Send Notification"
)
async def send_notification(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        NOTIFICATION_SERVICE_URL,
        "notifications/send"
    )


@router.post(
    "/notifications/mentions",
    tags=["Notifications"],
    summary="Send Mention Notification"
)
async def send_mention_notification(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        NOTIFICATION_SERVICE_URL,
        "notifications/mentions"
    )


@router.get(
    "/notifications/",
    tags=["Notifications"],
    summary="Get My Notifications"
)
async def get_notifications(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        NOTIFICATION_SERVICE_URL,
        "notifications/"
    )


@router.get(
    "/notifications/all",
    tags=["Notifications"],
    summary="Get All Notifications"
)
async def get_all_notifications(
    request: Request,
    admin: dict = Depends(admin_required)
):
    return await forward_request(
        request,
        NOTIFICATION_SERVICE_URL,
        "notifications/all"
    )


@router.get(
    "/notifications/{notification_id}",
    tags=["Notifications"],
    summary="Get Notification By ID"
)
async def get_notification(
    notification_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        NOTIFICATION_SERVICE_URL,
        f"notifications/{notification_id}"
    )


@router.post(
    "/notifications/{notification_id}/retry",
    tags=["Notifications"],
    summary="Retry Failed Notification"
)
async def retry_notification(
    notification_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        NOTIFICATION_SERVICE_URL,
        f"notifications/{notification_id}/retry"
    )


# ANALYTICS SERVICE


@router.get(
    "/analytics/dashboard",
    tags=["Analytics"],
    summary="Get Dashboard Analytics"
)
async def get_dashboard_analytics(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        ANALYTICS_SERVICE_URL,
        "analytics/dashboard"
    )


@router.get(
    "/analytics/projects",
    tags=["Analytics"],
    summary="Get Project Analytics"
)
async def get_project_analytics(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        ANALYTICS_SERVICE_URL,
        "analytics/projects"
    )


@router.get(
    "/analytics/team-performance",
    tags=["Analytics"],
    summary="Get Team Performance"
)
async def get_team_performance(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        ANALYTICS_SERVICE_URL,
        "analytics/team-performance"
    )


@router.get(
    "/analytics/weekly-report",
    tags=["Analytics"],
    summary="Get Weekly Report"
)
async def get_weekly_report(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        ANALYTICS_SERVICE_URL,
        "analytics/weekly-report"
    )


@router.get(
    "/analytics/monthly-report",
    tags=["Analytics"],
    summary="Get Monthly Report"
)
async def get_monthly_report(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return await forward_request(
        request,
        ANALYTICS_SERVICE_URL,
        "analytics/monthly-report"
    )