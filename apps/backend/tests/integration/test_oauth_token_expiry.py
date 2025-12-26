"""Integration tests for OAuth token expiry and remember_me functionality."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.security import create_access_token, decode_token
from src.models.oauth_account import OAuthAccount
from src.models.refresh_token import RefreshToken
from src.models.user import User
from src.models.user_session import UserSession
from src.services.oauth_service import OAuthUserProfile


@pytest.mark.asyncio
class TestOAuthTokenExpiry:
    """Test OAuth token expiry and re-authentication flow."""

    async def test_oauth_login_does_not_create_refresh_token_record(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        Test that OAuth login creates JWT tokens but NO RefreshToken DB record.

        This is the key difference from traditional auth.
        """
        # Mock the OAuth provider
        with patch("src.api.oauth.get_oauth_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.handle_callback.return_value = OAuthUserProfile(
                provider="github",
                provider_user_id="github_user_123",
                email="github_user@example.com",
                name="GitHub User",
                avatar_url="https://github.com/avatar.png",
                access_token="github_access_token",
                refresh_token=None,
                profile_data={"login": "github_user"},
            )
            mock_get_provider.return_value = mock_provider

            # Setup OAuth state
            from src.api.oauth import oauth_states

            state = "test_state_oauth_123"
            oauth_states[state] = {
                "provider": "github",
                "redirect_url": "/",
                "created_at": datetime.now(UTC),
                "user_id": None,
            }

            # Simulate OAuth callback
            response = await client.get(
                "/api/v1/oauth/github/callback",
                params={
                    "code": "github_code_123",
                    "state": state,
                },
            )

            # Should redirect to frontend
            assert response.status_code == 307

            # Verify user was created
            result = await db_session.execute(
                select(User).where(User.email == "github_user@example.com")
            )
            user = result.scalar_one_or_none()
            assert user is not None
            assert user.email_verified is True

            # Verify OAuth account was created
            oauth_result = await db_session.execute(
                select(OAuthAccount).where(OAuthAccount.user_id == user.id)
            )
            oauth_account = oauth_result.scalar_one_or_none()
            assert oauth_account is not None
            assert oauth_account.provider == "github"
            assert oauth_account.provider_user_id == "github_user_123"

            # ✅ KEY TEST: RefreshToken DB record should NOT be created for OAuth
            refresh_result = await db_session.execute(
                select(RefreshToken).where(RefreshToken.user_id == user.id)
            )
            refresh_token = refresh_result.scalar_one_or_none()
            assert refresh_token is None, "OAuth users should not have RefreshToken DB records"

            # ✅ KEY TEST: UserSession should NOT be created for OAuth
            session_result = await db_session.execute(
                select(UserSession).where(UserSession.user_id == user.id)
            )
            session = session_result.scalar_one_or_none()
            assert session is None, "OAuth users should not have UserSession DB records"

    async def test_oauth_refresh_token_attempt_returns_oauth_reauthentication_error(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        Test that attempting to refresh an OAuth token returns the correct error.

        When access token expires, frontend should detect this error and redirect
        to OAuth provider for re-authentication.
        """
        with patch("src.api.oauth.get_oauth_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.handle_callback.return_value = OAuthUserProfile(
                provider="github",
                provider_user_id="github_user_456",
                email="github_user_456@example.com",
                name="GitHub User 456",
                avatar_url="https://github.com/avatar.png",
                access_token="github_access_token",
                refresh_token=None,
                profile_data={"login": "github_user_456"},
            )
            mock_get_provider.return_value = mock_provider

            # Setup OAuth state
            from src.api.oauth import oauth_states

            state = "test_state_refresh_123"
            oauth_states[state] = {
                "provider": "github",
                "redirect_url": "/",
                "created_at": datetime.now(UTC),
                "user_id": None,
            }

            # Create OAuth user
            response = await client.get(
                "/api/v1/oauth/github/callback",
                params={
                    "code": "github_code_456",
                    "state": state,
                },
            )
            assert response.status_code == 307

            # Get the refresh token from cookies (it should be set)
            cookies = response.cookies
            refresh_token = cookies.get("refresh_token")
            assert refresh_token is not None

            # Extract user ID to verify OAuth token has oauth flag
            payload = decode_token(refresh_token)
            assert payload.get("oauth") is True, "OAuth tokens should have oauth flag"

            # Try to refresh - should get oauth_reauthentication_required error
            response = await client.post(
                "/api/v1/auth/refresh",
                cookies={"refresh_token": refresh_token},
            )

            # ✅ Should return 401 with specific error detail
            assert response.status_code == 401
            assert response.json()["detail"] == "oauth_reauthentication_required"

            # ✅ Should have X-Auth-Method header
            assert response.headers.get("X-Auth-Method") == "oauth"

    async def test_oauth_token_has_oauth_flag_set(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test that OAuth tokens have the oauth flag set in JWT payload."""
        with patch("src.api.oauth.get_oauth_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.handle_callback.return_value = OAuthUserProfile(
                provider="google",
                provider_user_id="google_user_789",
                email="google_user_789@example.com",
                name="Google User",
                avatar_url="https://google.com/avatar.png",
                access_token="google_access_token",
                refresh_token=None,
                profile_data={"id": "google_user_789"},
            )
            mock_get_provider.return_value = mock_provider

            from src.api.oauth import oauth_states

            state = "test_state_flag_123"
            oauth_states[state] = {
                "provider": "google",
                "redirect_url": "/",
                "created_at": datetime.now(UTC),
                "user_id": None,
            }

            response = await client.get(
                "/api/v1/oauth/google/callback",
                params={
                    "code": "google_code_123",
                    "state": state,
                },
            )

            refresh_token = response.cookies.get("refresh_token")
            payload = decode_token(refresh_token)

            # ✅ OAuth tokens should be marked with oauth: True
            assert payload.get("oauth") is True
            assert payload.get("type") == "refresh"

    async def test_oauth_token_expiry_matches_access_token(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        Test that OAuth refresh token expiry matches access token expiry.

        Both should expire after ~30 minutes (access_token_expire_minutes).
        """
        with patch("src.api.oauth.get_oauth_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.handle_callback.return_value = OAuthUserProfile(
                provider="microsoft",
                provider_user_id="ms_user_321",
                email="ms_user_321@example.com",
                name="MS User",
                avatar_url="https://microsoft.com/avatar.png",
                access_token="ms_access_token",
                refresh_token=None,
                profile_data={"id": "ms_user_321"},
            )
            mock_get_provider.return_value = mock_provider

            from src.api.oauth import oauth_states

            state = "test_state_expiry_123"
            oauth_states[state] = {
                "provider": "microsoft",
                "redirect_url": "/",
                "created_at": datetime.now(UTC),
                "user_id": None,
            }

            response = await client.get(
                "/api/v1/oauth/microsoft/callback",
                params={
                    "code": "ms_code_123",
                    "state": state,
                },
            )

            access_token = response.cookies.get("access_token")
            refresh_token = response.cookies.get("refresh_token")

            # Decode both tokens
            access_payload = decode_token(access_token)
            refresh_payload = decode_token(refresh_token)

            # Get expiry times
            access_exp = access_payload.get("exp")
            refresh_exp = refresh_payload.get("exp")

            # Both should expire at approximately the same time (~30 minutes)
            exp_diff = abs(access_exp - refresh_exp)
            assert exp_diff < 5, "OAuth access and refresh tokens should expire at same time"

            # Should be roughly 30 minutes from now
            now = datetime.now(UTC).timestamp()
            expected_exp = now + (settings.access_token_expire_minutes * 60)
            actual_diff = abs(refresh_exp - expected_exp)
            assert actual_diff < 10, "Refresh token should expire in ~30 minutes"


@pytest.mark.asyncio
class TestRememberMeFunctionality:
    """Test 'Remember Me' functionality for traditional auth."""

    async def test_login_without_remember_me_creates_4hour_token(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test that login without remember_me creates 4-hour expiry token."""
        # Register user first
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test_remember_false@example.com",
                "password": "SecurePassword123!",
            },
        )
        assert register_response.status_code == 201

        # Login WITHOUT remember_me (default=False)
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test_remember_false@example.com",
                "password": "SecurePassword123!",
                "remember_me": False,
            },
        )
        assert login_response.status_code == 200

        # Get user from DB
        result = await db_session.execute(
            select(User).where(User.email == "test_remember_false@example.com")
        )
        user = result.scalar_one_or_none()
        assert user is not None

        # Commit to ensure we see changes from the API call
        await db_session.commit()

        # Get RefreshToken from DB (fresh query after commit)
        token_result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.user_id == user.id)
        )
        refresh_token_record = token_result.scalar_one_or_none()
        assert refresh_token_record is not None

        # ✅ Verify expiry is ~4 hours from creation
        # Access attributes immediately after query to avoid lazy loading issues
        created_at = refresh_token_record.created_at
        expires_at = refresh_token_record.expires_at
        now = datetime.now(created_at.tzinfo)
        expiry_diff = (expires_at - now).total_seconds()
        expected_seconds = settings.refresh_token_expire_hours * 3600

        # Allow 10 second margin
        assert abs(expiry_diff - expected_seconds) < 10

    async def test_login_with_remember_me_creates_7day_token(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test that login with remember_me creates 7-day expiry token."""
        # Register user first
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test_remember_true@example.com",
                "password": "SecurePassword123!",
            },
        )
        assert register_response.status_code == 201

        # Login WITH remember_me=True
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test_remember_true@example.com",
                "password": "SecurePassword123!",
                "remember_me": True,
            },
        )
        assert login_response.status_code == 200

        # Get user from DB
        result = await db_session.execute(
            select(User).where(User.email == "test_remember_true@example.com")
        )
        user = result.scalar_one_or_none()
        assert user is not None

        # Commit to ensure we see changes from the API call
        await db_session.commit()

        # Get RefreshToken from DB (fresh query after commit)
        token_result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.user_id == user.id)
        )
        refresh_token_record = token_result.scalar_one_or_none()
        assert refresh_token_record is not None

        # ✅ Verify expiry is ~7 days from creation
        # Access attributes immediately after query to avoid lazy loading issues
        created_at = refresh_token_record.created_at
        expires_at = refresh_token_record.expires_at
        now = datetime.now(created_at.tzinfo)
        expiry_diff = (expires_at - now).total_seconds()
        expected_seconds = settings.refresh_token_expire_days * 24 * 3600

        # Allow 10 second margin
        assert abs(expiry_diff - expected_seconds) < 10

    async def test_refresh_token_preserves_session_type_4hour(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test that token refresh preserves 4-hour session type."""
        # Create user and login without remember_me
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test_refresh_4h@example.com",
                "password": "SecurePassword123!",
            },
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test_refresh_4h@example.com",
                "password": "SecurePassword123!",
                "remember_me": False,
            },
        )
        assert login_response.status_code == 200

        # Rollback and refresh to see changes committed by the API
        await db_session.rollback()

        # Get user (fresh query after rollback)
        result = await db_session.execute(
            select(User).where(User.email == "test_refresh_4h@example.com")
        )
        user = result.scalar_one_or_none()
        assert user is not None

        # Get original RefreshToken from DB
        token_result = await db_session.execute(
            select(RefreshToken)
            .where(RefreshToken.user_id == user.id)
            .where(RefreshToken.revoked is False)
        )
        original_token_record = token_result.scalar_one_or_none()
        assert original_token_record is not None

        # Access attributes immediately after query to avoid lazy loading issues
        created_at = original_token_record.created_at
        expires_at = original_token_record.expires_at

        # Verify original token has ~4 hour expiry
        now = datetime.now(created_at.tzinfo)
        original_expiry_diff = (expires_at - now).total_seconds()
        expected_seconds = settings.refresh_token_expire_hours * 3600
        assert abs(original_expiry_diff - expected_seconds) < 10

        # ✅ Key assertion: session type is 4 hours (original_expiry_hours < 24)
        original_expiry_hours = (expires_at - created_at).total_seconds() / 3600
        assert original_expiry_hours < 24, "Should be a standard 4-hour session"

    async def test_refresh_token_preserves_session_type_7day(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test that token refresh preserves 7-day remember_me session type."""
        # Create user and login WITH remember_me
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test_refresh_7d@example.com",
                "password": "SecurePassword123!",
            },
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test_refresh_7d@example.com",
                "password": "SecurePassword123!",
                "remember_me": True,
            },
        )
        assert login_response.status_code == 200

        # Rollback and refresh to see changes committed by the API
        await db_session.rollback()

        # Get user (fresh query after rollback)
        result = await db_session.execute(
            select(User).where(User.email == "test_refresh_7d@example.com")
        )
        user = result.scalar_one_or_none()
        assert user is not None

        # Get original RefreshToken from DB
        token_result = await db_session.execute(
            select(RefreshToken)
            .where(RefreshToken.user_id == user.id)
            .where(RefreshToken.revoked is False)
        )
        original_token_record = token_result.scalar_one_or_none()
        assert original_token_record is not None

        # Access attributes immediately after query to avoid lazy loading issues
        created_at = original_token_record.created_at
        expires_at = original_token_record.expires_at

        # Verify original token has ~7 day expiry
        now = datetime.now(created_at.tzinfo)
        original_expiry_diff = (expires_at - now).total_seconds()
        expected_seconds = settings.refresh_token_expire_days * 24 * 3600
        assert abs(original_expiry_diff - expected_seconds) < 10

        # ✅ Key assertion: session type is 7 days (original_expiry_hours > 24)
        original_expiry_hours = (expires_at - created_at).total_seconds() / 3600
        assert original_expiry_hours > 24, "Should be a remember_me 7-day session"


@pytest.mark.asyncio
class TestLogoutWithOptionalAuth:
    """Test that logout works even with expired tokens."""

    async def test_logout_with_valid_token(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test normal logout with valid token."""
        # Create and login user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test_logout_valid@example.com",
                "password": "SecurePassword123!",
            },
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test_logout_valid@example.com",
                "password": "SecurePassword123!",
            },
        )
        assert login_response.status_code == 200

        # Logout - should succeed
        logout_response = await client.post("/api/v1/auth/logout")
        assert logout_response.status_code == 200
        assert logout_response.json() == {"message": "Logout successful"}

    async def test_logout_without_authentication(
        self,
        client: AsyncClient,
    ):
        """
        Test that logout succeeds even when not authenticated.

        This is idempotent - calling logout multiple times should always work.
        """
        # Try to logout without any token - should still succeed
        logout_response = await client.post("/api/v1/auth/logout")

        # ✅ Should return 200, not 401
        assert logout_response.status_code == 200
        assert logout_response.json() == {"message": "Logout successful"}

    async def test_logout_with_expired_token(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        Test that logout works even if access token is expired.

        The old implementation would fail with 401 because it required valid auth.
        """
        # Create and login user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test_logout_expired@example.com",
                "password": "SecurePassword123!",
            },
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test_logout_expired@example.com",
                "password": "SecurePassword123!",
            },
        )
        assert login_response.status_code == 200

        # Create an expired access token
        expired_token = create_access_token(
            {"sub": "1"},
            expires_delta=timedelta(seconds=-1),  # Already expired
        )

        # Try to logout with expired token - should still succeed
        logout_response = await client.post(
            "/api/v1/auth/logout",
            cookies={"access_token": expired_token},
        )

        # ✅ Should succeed, not fail with 401
        assert logout_response.status_code == 200
        assert logout_response.json() == {"message": "Logout successful"}
