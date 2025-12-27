"""Email service module for sending transactional emails."""

from src.services.email.base import EmailService
from src.services.email.mock import MockEmailService
from src.services.email.smtp import SMTPEmailService


def get_email_service() -> EmailService:
    """Factory function to get the appropriate email service based on configuration.

    Returns:
        EmailService: Either MockEmailService (development) or SMTPEmailService (production)
    """
    from src.core.config import settings

    if settings.email_service_mode == "mock":
        return MockEmailService()
    else:
        return SMTPEmailService()


__all__ = ["EmailService", "SMTPEmailService", "MockEmailService", "get_email_service"]
