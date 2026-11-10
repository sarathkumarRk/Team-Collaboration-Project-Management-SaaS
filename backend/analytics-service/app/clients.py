import httpx

from fastapi import HTTPException

from app.config import settings


def get_projects(token: str):
    try:
        response = httpx.get(
            f"{settings.PROJECT_SERVICE_URL}/projects/",
            headers={
                "Authorization": f"Bearer {token}"
            },
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Project Service is unavailable"
        )


def get_tasks(token: str):
    try:
        response = httpx.get(
            f"{settings.TASK_SERVICE_URL}/tasks/",
            headers={
                "Authorization": f"Bearer {token}"
            },
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Task Service is unavailable"
        )