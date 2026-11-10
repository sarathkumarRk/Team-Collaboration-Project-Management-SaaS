from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.models import Notification
from app.services import send_notification

scheduler = BackgroundScheduler()


def send_pending_notifications():
    db = SessionLocal()

    try:
        current_time = datetime.now(timezone.utc).replace(tzinfo=None)

        notifications = (
            db.query(Notification)
            .filter(
                Notification.status == "PENDING",
                Notification.scheduled_at <= current_time
            )
            .all()
        )

        for notification in notifications:
            try:
                send_notification(db, notification)
            except Exception as error:
                print(
                    f"Failed to process notification "
                    f"{notification.id}: {error}"
                )
                db.rollback()

    except Exception as error:
        print(f"Scheduler error: {error}")
        db.rollback()

    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            send_pending_notifications,
            trigger="interval",
            seconds=60,
            id="send_pending_notifications",
            replace_existing=True,
            max_instances=1
        )

        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)