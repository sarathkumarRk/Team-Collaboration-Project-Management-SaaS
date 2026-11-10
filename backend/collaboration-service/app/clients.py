import httpx

from app.config import settings


# Send Mention Notification
async def send_mention_notification(
    user_id: int,
    task_id: int,
    comment_id: int,
    content: str,
):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/notifications/mentions",
                json={
                    "user_id": user_id,
                    "task_id": task_id,
                    "comment_id": comment_id,
                    "message": content,
                },
            )

            response.raise_for_status()

    except httpx.HTTPError:
        return False

    return True