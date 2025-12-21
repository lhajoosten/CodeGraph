"""Integration tests for auth endpoints with email functionality."""

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select

from src.core.security import create_session_token, get_password_hash, hash_token
from src.models.email_verification_token import EmailVerificationToken
from src.models.password_reset_token import PasswordResetToken
from src.models.user import User


class TestAuthEmailEndpoints:
    """Integration tests for auth endpoints with email support."""

    @pytest.mark.asyncio
    async def test_register_sends_verification_email(self, client, db_session):
        """Test that registration sends verification email."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "SecurePassword123!",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["email_verified"] is False

        # Verify email token was created (proves email sending was attempted)
        stmt = select(EmailVerificationToken).where(
            EmailVerificationToken.email == "newuser@example.com"
        )
        result = await db_session.execute(stmt)
        token = result.scalar_one_or_none()
        assert token is not None

    @pytest.mark.asyncio
    async def test_register_creates_verification_token(self, client, db_session):
        """Test that registration creates a verification token."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "user@example.com",
                "password": "SecurePassword123!",
            },
        )

        assert response.status_code == 201

        # Check that verification token was created
        stmt = select(EmailVerificationToken).where(
            EmailVerificationToken.email == "user@example.com"
        )
        result = await db_session.execute(stmt)
        token = result.scalar_one_or_none()

        assert token is not None
        assert token.used is False
        assert token.expires_at > datetime.now(UTC)

    @pytest.mark.asyncio
    async def test_verify_email_with_valid_token(self, client, db_session):
        """Test verifying email with valid token."""
        # Create a user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False,
            email_verified=False,
        )
        db_session.add(user)
        await db_session.flush()

        # Create a verification token
        token = create_session_token()
        token_hash = hash_token(token)
        verification_token = EmailVerificationToken(
            user_id=user.id,
            token=token_hash,
            email=user.email,
            expires_at=datetime.now(UTC) + timedelta(hours=24),
            used=False,
        )
        db_session.add(verification_token)
        await db_session.commit()

        response = await client.post(
            "/api/v1/auth/verify-email",
            json={"token": token},
        )

        assert response.status_code == 200
        assert "Email verified successfully" in response.json()["message"]

        # Verify user email is now verified
        await db_session.refresh(user)
        assert user.email_verified is True

    @pytest.mark.asyncio
    async def test_verify_email_with_invalid_token(self, client):
        """Test verifying email with invalid token."""
        response = await client.post(
            "/api/v1/auth/verify-email",
            json={"token": "invalid_token_xyz"},
        )

        assert response.status_code == 400
        assert "Invalid or expired verification token" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_verify_email_with_expired_token(self, client, db_session):
        """Test verifying email with expired token."""
        # Create a user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.flush()

        # Create an expired verification token
        token = create_session_token()
        token_hash = hash_token(token)
        verification_token = EmailVerificationToken(
            user_id=user.id,
            token=token_hash,
            email=user.email,
            expires_at=datetime.now(UTC) - timedelta(hours=1),  # Expired
            used=False,
        )
        db_session.add(verification_token)
        await db_session.commit()

        response = await client.post(
            "/api/v1/auth/verify-email",
            json={"token": token},
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_resend_verification_email(self, client, db_session):
        """Test resending verification email."""
        # Create a user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False,
            email_verified=False,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client.post(
            "/api/v1/auth/resend-verification",
            json={"email": "test@example.com"},
        )

        assert response.status_code == 200
        assert "Verification email sent" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_resend_verification_email_already_verified(self, client, db_session):
        """Test resending verification email for already verified user."""
        # Create a verified user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False,
            email_verified=True,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client.post(
            "/api/v1/auth/resend-verification",
            json={"email": "test@example.com"},
        )

        assert response.status_code == 200
        assert "Email already verified" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_forgot_password_sends_email(self, client, db_session):
        """Test forgot password sends reset email."""
        # Create a user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.commit()

        response = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "test@example.com"},
        )

        assert response.status_code == 200
        assert "password reset link will be sent" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent_email(self, client):
        """Test forgot password with non-existent email returns success for security."""
        response = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent@example.com"},
        )

        assert response.status_code == 200
        assert "password reset link will be sent" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_reset_password_with_valid_token(self, client, db_session):
        """Test resetting password with valid token."""
        # Create a user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("OldPassword123!"),
            is_active=True,
            is_superuser=False,
            failed_login_attempts=5,  # Account was locked
            locked_until=datetime.now(UTC) + timedelta(minutes=30),
        )
        db_session.add(user)
        await db_session.flush()

        # Create a password reset token
        token = create_session_token()
        token_hash = hash_token(token)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token_hash,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            used=False,
        )
        db_session.add(reset_token)
        await db_session.commit()

        response = await client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": token,
                "password": "NewPassword123!",
            },
        )

        assert response.status_code == 200
        assert "Password reset successfully" in response.json()["message"]

        # Verify password was changed
        await db_session.refresh(user)
        from src.core.security import verify_password

        assert verify_password("NewPassword123!", user.hashed_password)
        # Verify failed login attempts were reset
        assert user.failed_login_attempts == 0
        assert user.locked_until is None

    @pytest.mark.asyncio
    async def test_reset_password_with_invalid_token(self, client):
        """Test resetting password with invalid token."""
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "invalid_token_xyz",
                "password": "NewPassword123!",
            },
        )

        assert response.status_code == 400
        assert "Invalid or expired reset token" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_change_password_authenticated_user(self, client, db_session):
        """Test changing password for authenticated user."""
        # Create and login a user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("OldPassword123!"),
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.commit()

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "OldPassword123!",
            },
        )
        assert login_response.status_code == 200

        # Change password
        response = await client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "OldPassword123!",
                "new_password": "NewPassword123!",
            },
        )

        assert response.status_code == 200
        assert "Password changed successfully" in response.json()["message"]

        # Verify password was changed
        await db_session.refresh(user)
        from src.core.security import verify_password

        assert verify_password("NewPassword123!", user.hashed_password)

    @pytest.mark.asyncio
    async def test_change_password_wrong_current_password(self, client, db_session):
        """Test changing password with wrong current password."""
        # Create and login a user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("OldPassword123!"),
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.commit()

        # Login
        await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "OldPassword123!",
            },
        )

        # Try to change password with wrong current password
        response = await client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "WrongPassword123!",
                "new_password": "NewPassword123!",
            },
        )

        assert response.status_code == 401
        assert "Current password is incorrect" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_change_email_authenticated_user(self, client, db_session):
        """Test changing email for authenticated user."""
        # Create and login a user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("Password123!"),
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.commit()

        # Login
        await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "Password123!",
            },
        )

        # Request email change
        response = await client.post(
            "/api/v1/auth/change-email",
            json={
                "new_email": "newemail@example.com",
                "password": "Password123!",
            },
        )

        assert response.status_code == 200
        assert "Verification email sent to new address" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_change_email_wrong_password(self, client, db_session):
        """Test changing email with wrong password."""
        # Create and login a user
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("Password123!"),
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        await db_session.commit()

        # Login
        await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "Password123!",
            },
        )

        # Try to change email with wrong password
        response = await client.post(
            "/api/v1/auth/change-email",
            json={
                "new_email": "newemail@example.com",
                "password": "WrongPassword123!",
            },
        )

        assert response.status_code == 401
        assert "Password is incorrect" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_change_email_already_registered(self, client, db_session):
        """Test changing email to one that's already registered."""
        # Create two users
        user1 = User(
            email="test1@example.com",
            hashed_password=get_password_hash("Password123!"),
            is_active=True,
            is_superuser=False,
        )
        user2 = User(
            email="test2@example.com",
            hashed_password=get_password_hash("Password456!"),
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user1)
        db_session.add(user2)
        await db_session.commit()

        # Login as user1
        await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test1@example.com",
                "password": "Password123!",
            },
        )

        # Try to change email to user2's email
        response = await client.post(
            "/api/v1/auth/change-email",
            json={
                "new_email": "test2@example.com",
                "password": "Password123!",
            },
        )

        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
