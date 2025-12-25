"""Test email endpoints for development and debugging."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings as app_settings
from src.core.database import get_db
from src.services.email import get_email_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/test", tags=["test"])


@router.post("/send-test-email")
async def send_test_email(
    recipient_email: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    """
    Send a test email to verify SMTP configuration.

    **Development Only** - Remove this endpoint in production.

    Args:
        recipient_email: Email address to send test email to
        db: Database session

    Returns:
        dict: Success message with details

    Raises:
        HTTPException: If email sending fails
    """
    if app_settings.environment == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test email endpoint not available in production",
        )

    try:
        email_service = get_email_service()

        success = await email_service.send_email(
            to=recipient_email,
            subject="CodeGraph Test Email - Configuration Verified ✓",
            template="test",
            context={"config": app_settings},
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test email",
            )

        return {
            "message": "Test email sent successfully",
            "recipient": recipient_email,
            "from": app_settings.smtp_from_email,
            "smtp_host": app_settings.smtp_host,
        }

    except Exception as e:
        logger.error(f"Test email sending failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email sending failed: {str(e)}",
        ) from e
