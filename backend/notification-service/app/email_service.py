import smtplib

from email.message import EmailMessage

from app.config import settings


def send_email(
    recipient_email: str,
    subject: str,
    message: str
):
    email = EmailMessage()

    email["Subject"] = subject
    email["From"] = settings.SMTP_FROM_EMAIL
    email["To"] = recipient_email

    email.set_content(message)

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        timeout=15
    ) as server:

        server.starttls()

        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD
        )

        server.send_message(email)