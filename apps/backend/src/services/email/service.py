"""Email service utilities for sending transactional emails."""

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.core.config import settings
from src.core.security import create_session_token, hash_token
from src.models.email_verification_token import EmailVerificationToken
from src.models.password_reset_token import PasswordResetToken
from src.models.user import User
from src.services.email import get_email_service

logger = logging.getLogger(__name__)


class EmailTokenService:
    """Service for generating and validating email tokens."""

    @staticmethod
    async def create_verification_token(db: AsyncSession, user_id: int, email: str) -> str:
        """Create an email verification token.

        Args:
            db: Database session
            user_id: ID of the user
            email: Email address to verify

        Returns:
            str: The verification token (plain text, not hashed)
        """
        token = create_session_token()
        token_hash = hash_token(token)

        verification_token = EmailVerificationToken(
            user_id=user_id,
            token=token_hash,
            email=email,
            expires_at=datetime.now(UTC)
            + timedelta(hours=settings.email_verification_token_expire_hours),
        )

        db.add(verification_token)
        await db.commit()
        return token

    @staticmethod
    async def verify_email_token(db: AsyncSession, token: str) -> tuple[bool, User | None]:
        """Verify an email verification token.

        Args:
            db: Database session
            token: The verification token to verify

        Returns:
            tuple: (is_valid, user) - (True, user) if valid, (False, None) if invalid
        """
        try:
            token_hash = hash_token(token)
            logger.debug(f"Verifying email token (hash prefix: {token_hash[:8]}...)")

            stmt = (
                select(EmailVerificationToken)
                .options(joinedload(EmailVerificationToken.user))
                .where(
                    EmailVerificationToken.token == token_hash,
                    ~EmailVerificationToken.used,
                    EmailVerificationToken.expires_at > datetime.now(UTC),
                )
            )

            result = await db.execute(stmt)
            verification_token = result.scalars().first()

            if not verification_token:
                logger.debug("Email verification token not found or expired")
                return False, None

            # Mark token as used
            verification_token.used = True
            verification_token.used_at = datetime.now(UTC)

            # Get user and mark email as verified
            user = verification_token.user
            if user:
                user.email_verified = True
                logger.info(f"Email verified for user_id={user.id}")

            return True, user

        except Exception as e:
            logger.error(f"Error verifying email token: {str(e)}")
            return False, None

    @staticmethod
    async def create_password_reset_token(db: AsyncSession, user_id: int) -> str:
        """Create a password reset token.

        Args:
            db: Database session
            user_id: ID of the user

        Returns:
            str: The reset token (plain text, not hashed)
        """
        token = create_session_token()
        token_hash = hash_token(token)

        reset_token = PasswordResetToken(
            user_id=user_id,
            token=token_hash,
            expires_at=datetime.now(UTC)
            + timedelta(hours=settings.password_reset_token_expire_hours),
        )

        db.add(reset_token)
        await db.commit()
        return token

    @staticmethod
    async def verify_password_reset_token(db: AsyncSession, token: str) -> tuple[bool, User | None]:
        """Verify a password reset token.

        Args:
            db: Database session
            token: The reset token to verify

        Returns:
            tuple: (is_valid, user) - (True, user) if valid, (False, None) if invalid
        """
        try:
            token_hash = hash_token(token)
            logger.debug(f"Verifying password reset token (hash prefix: {token_hash[:8]}...)")

            stmt = (
                select(PasswordResetToken)
                .options(joinedload(PasswordResetToken.user))
                .where(
                    PasswordResetToken.token == token_hash,
                    ~PasswordResetToken.used,
                    PasswordResetToken.expires_at > datetime.now(UTC),
                )
            )

            result = await db.execute(stmt)
            reset_token = result.scalars().first()

            if not reset_token:
                logger.debug("Password reset token not found or expired")
                return False, None

            # Mark token as used
            reset_token.used = True
            reset_token.used_at = datetime.now(UTC)
            logger.info(f"Password reset token verified for user_id={reset_token.user_id}")

            return True, reset_token.user

        except Exception as e:
            logger.error(f"Error verifying password reset token: {str(e)}")
            return False, None


class EmailSendingService:
    """Service for sending transactional emails."""

    def __init__(self):
        """Initialize email service."""
        self.email_service = get_email_service()

    async def send_verification_email(self, user_email: str, token: str) -> bool:
        """Send email verification email.

        Args:
            user_email: Recipient email address
            token: Verification token

        Returns:
            bool: True if sent successfully
        """
        verification_link = f"{settings.frontend_url}/verify-email?token={token}"

        return await self.email_service.send_email(
            to=user_email,
            subject="Verify Your CodeGraph Email",
            template="verification",
            context={
                "user_email": user_email,
                "verification_link": verification_link,
            },
        )

    async def send_password_reset_email(self, user_email: str, token: str) -> bool:
        """Send password reset email.

        Args:
            user_email: Recipient email address
            token: Password reset token

        Returns:
            bool: True if sent successfully
        """
        reset_link = f"{settings.frontend_url}/reset-password?token={token}"

        return await self.email_service.send_email(
            to=user_email,
            subject="Reset Your CodeGraph Password",
            template="password_reset",
            context={
                "reset_link": reset_link,
            },
        )

    async def send_email_change_confirmation(self, new_email: str, token: str) -> bool:
        """Send email change confirmation email.

        Args:
            new_email: New email address to confirm
            token: Email verification token

        Returns:
            bool: True if sent successfully
        """
        confirmation_link = f"{settings.frontend_url}/confirm-email-change?token={token}"

        return await self.email_service.send_email(
            to=new_email,
            subject="Confirm Your New CodeGraph Email",
            template="email_change",
            context={
                "new_email": new_email,
                "confirmation_link": confirmation_link,
            },
        )

    async def send_welcome_email(self, user_email: str) -> bool:
        """Send welcome email after email verification.

        Args:
            user_email: Recipient email address

        Returns:
            bool: True if sent successfully
        """
        dashboard_link = f"{settings.frontend_url}/dashboard"

        return await self.email_service.send_email(
            to=user_email,
            subject="Welcome to CodeGraph!",
            template="welcome",
            context={
                "user_email": user_email,
                "dashboard_link": dashboard_link,
            },
        )

    async def send_otp_email(self, user_email: str, otp_code: str) -> bool:
        """Send one-time password via email.

        Args:
            user_email: Recipient email address
            otp_code: The OTP code to send

        Returns:
            bool: True if sent successfully
        """
        return await self.email_service.send_email(
            to=user_email,
            subject="Your CodeGraph One-Time Password",
            template="otp",
            context={
                "otp_code": otp_code,
            },
        )
