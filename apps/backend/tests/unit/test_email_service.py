"""Unit tests for email service components."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest

from src.core.security import create_session_token, hash_token
from src.services.email.service import EmailSendingService, EmailTokenService


class TestEmailTokenService:
    """Tests for EmailTokenService token generation and validation."""

    @pytest.mark.asyncio
    async def test_create_verification_token(self, db_session):
        """Test creating an email verification token."""
        user_id = 1
        email = "test@example.com"

        token = await EmailTokenService.create_verification_token(db_session, user_id, email)

        assert token is not None
        assert len(token) > 0
        assert isinstance(token, str)

    @pytest.mark.asyncio
    async def test_create_password_reset_token(self, db_session):
        """Test creating a password reset token."""
        user_id = 1

        token = await EmailTokenService.create_password_reset_token(db_session, user_id)

        assert token is not None
        assert len(token) > 0
        assert isinstance(token, str)

    @pytest.mark.asyncio
    async def test_verify_email_token_valid(self, db_session):
        """Test verifying a valid email token."""
        from src.models.user import User

        # Create a user
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.flush()

        # Create a verification token
        token = await EmailTokenService.create_verification_token(db_session, user.id, user.email)

        # Verify the token
        is_valid, verified_user = await EmailTokenService.verify_email_token(db_session, token)

        assert is_valid is True
        assert verified_user is not None
        assert verified_user.id == user.id
        assert verified_user.email_verified is True

    @pytest.mark.asyncio
    async def test_verify_email_token_invalid(self, db_session):
        """Test verifying an invalid email token."""
        is_valid, user = await EmailTokenService.verify_email_token(db_session, "invalid_token_xyz")

        assert is_valid is False
        assert user is None

    @pytest.mark.asyncio
    async def test_verify_email_token_expired(self, db_session):
        """Test verifying an expired email token."""
        from src.models.email_verification_token import EmailVerificationToken
        from src.models.user import User

        # Create a user
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.flush()

        # Create an expired verification token
        token = create_session_token()
        token_hash = hash_token(token)
        expired_token = EmailVerificationToken(
            user_id=user.id,
            token=token_hash,
            email=user.email,
            expires_at=datetime.now(UTC) - timedelta(hours=1),  # Expired
            used=False,
        )
        db_session.add(expired_token)
        await db_session.commit()

        # Try to verify the expired token
        is_valid, verified_user = await EmailTokenService.verify_email_token(db_session, token)

        assert is_valid is False
        assert verified_user is None

    @pytest.mark.asyncio
    async def test_verify_email_token_already_used(self, db_session):
        """Test verifying an already used email token."""
        from src.models.email_verification_token import EmailVerificationToken
        from src.models.user import User

        # Create a user
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.flush()

        # Create an already used verification token
        token = create_session_token()
        token_hash = hash_token(token)
        used_token = EmailVerificationToken(
            user_id=user.id,
            token=token_hash,
            email=user.email,
            expires_at=datetime.now(UTC) + timedelta(hours=24),
            used=True,
            used_at=datetime.now(UTC),
        )
        db_session.add(used_token)
        await db_session.commit()

        # Try to verify the used token
        is_valid, verified_user = await EmailTokenService.verify_email_token(db_session, token)

        assert is_valid is False
        assert verified_user is None

    @pytest.mark.asyncio
    async def test_verify_password_reset_token_valid(self, db_session):
        """Test verifying a valid password reset token."""
        from src.models.user import User

        # Create a user
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.flush()

        # Create a password reset token
        token = await EmailTokenService.create_password_reset_token(db_session, user.id)

        # Verify the token
        is_valid, verified_user = await EmailTokenService.verify_password_reset_token(
            db_session, token
        )

        assert is_valid is True
        assert verified_user is not None
        assert verified_user.id == user.id

    @pytest.mark.asyncio
    async def test_verify_password_reset_token_invalid(self, db_session):
        """Test verifying an invalid password reset token."""
        is_valid, user = await EmailTokenService.verify_password_reset_token(
            db_session, "invalid_token_xyz"
        )

        assert is_valid is False
        assert user is None


class TestEmailSendingService:
    """Tests for EmailSendingService.

    These tests verify that EmailSendingService correctly delegates to the
    underlying email service (mock or SMTP based on configuration).
    Since tests run with email_service_mode="mock" by default, we test
    that emails are sent successfully via the mock service.
    """

    @pytest.mark.asyncio
    async def test_send_verification_email(self):
        """Test sending verification email (using mock service)."""
        # Mock the email service to track calls
        mock_email_service = AsyncMock()
        mock_email_service.send_email = AsyncMock(return_value=True)

        with patch("src.services.email.service.get_email_service", return_value=mock_email_service):
            service = EmailSendingService()
            result = await service.send_verification_email("test@example.com", "test_token_123")

            assert result is True
            mock_email_service.send_email.assert_called_once()
            call_args = mock_email_service.send_email.call_args
            assert call_args.kwargs["to"] == "test@example.com"
            assert call_args.kwargs["template"] == "verification"

    @pytest.mark.asyncio
    async def test_send_password_reset_email(self):
        """Test sending password reset email (using mock service)."""
        mock_email_service = AsyncMock()
        mock_email_service.send_email = AsyncMock(return_value=True)

        with patch("src.services.email.service.get_email_service", return_value=mock_email_service):
            service = EmailSendingService()
            result = await service.send_password_reset_email("test@example.com", "reset_token_123")

            assert result is True
            mock_email_service.send_email.assert_called_once()
            call_args = mock_email_service.send_email.call_args
            assert call_args.kwargs["to"] == "test@example.com"
            assert call_args.kwargs["template"] == "password_reset"

    @pytest.mark.asyncio
    async def test_send_email_change_confirmation(self):
        """Test sending email change confirmation (using mock service)."""
        mock_email_service = AsyncMock()
        mock_email_service.send_email = AsyncMock(return_value=True)

        with patch("src.services.email.service.get_email_service", return_value=mock_email_service):
            service = EmailSendingService()
            result = await service.send_email_change_confirmation(
                "newemail@example.com", "confirmation_token_123"
            )

            assert result is True
            mock_email_service.send_email.assert_called_once()
            call_args = mock_email_service.send_email.call_args
            assert call_args.kwargs["to"] == "newemail@example.com"
            assert call_args.kwargs["template"] == "email_change"

    @pytest.mark.asyncio
    async def test_send_welcome_email(self):
        """Test sending welcome email (using mock service)."""
        mock_email_service = AsyncMock()
        mock_email_service.send_email = AsyncMock(return_value=True)

        with patch("src.services.email.service.get_email_service", return_value=mock_email_service):
            service = EmailSendingService()
            result = await service.send_welcome_email("test@example.com")

            assert result is True
            mock_email_service.send_email.assert_called_once()
            call_args = mock_email_service.send_email.call_args
            assert call_args.kwargs["to"] == "test@example.com"
            assert call_args.kwargs["template"] == "welcome"

    @pytest.mark.asyncio
    async def test_send_otp_email(self):
        """Test sending OTP email (using mock service)."""
        mock_email_service = AsyncMock()
        mock_email_service.send_email = AsyncMock(return_value=True)

        with patch("src.services.email.service.get_email_service", return_value=mock_email_service):
            service = EmailSendingService()
            result = await service.send_otp_email("test@example.com", "123456")

            assert result is True
            mock_email_service.send_email.assert_called_once()
            call_args = mock_email_service.send_email.call_args
            assert call_args.kwargs["to"] == "test@example.com"
            assert call_args.kwargs["template"] == "otp"
            assert call_args.kwargs["context"]["otp_code"] == "123456"
