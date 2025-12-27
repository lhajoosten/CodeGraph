"""Integration tests for user authentication endpoints with real database."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_password_hash
from src.models.user import User


@pytest.mark.asyncio
class TestUserAuthIntegration:
    """Integration tests for user authentication with PostgreSQL."""

    async def test_register_user_success(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test successful user registration with real database."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "pass1234",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data
        assert "password" not in data

    async def test_register_user_duplicate_email(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test registration fails with duplicate email."""
        # First registration
        response1 = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "pass1234",
            },
        )
        assert response1.status_code == 201

        # Duplicate registration
        response2 = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "pass456",
            },
        )
        assert response2.status_code == 422

    async def test_register_user_invalid_email(self, client: AsyncClient) -> None:
        """Test registration fails with invalid email."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email-format",
                "password": "pass1234",
            },
        )
        assert response.status_code == 422

    async def test_register_user_weak_password(self, client: AsyncClient) -> None:
        """Test registration fails with password less than 8 characters."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "short",
            },
        )
        assert response.status_code == 422

    async def test_login_success(self, client: AsyncClient, db_session: AsyncSession) -> None:
        """Test successful login returns JWT tokens."""
        # Register user first
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "testuser@example.com",
                "password": "pass1234",
            },
        )
        assert register_response.status_code == 201

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "testuser@example.com",
                "password": "pass1234",
            },
        )
        assert login_response.status_code == 200
        data = login_response.json()
        # Tokens are set via HTTP-only cookies, not in response body
        assert data["message"] == "Login successful"
        # Verify cookies are set by checking the response headers
        assert "set-cookie" in {k.lower() for k in login_response.headers.keys()}

    async def test_login_invalid_credentials(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test login fails with incorrect password."""
        # Register user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "wrongpass@example.com",
                "password": "pass1234",
            },
        )

        # Try wrong password
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "wrongpass@example.com",
                "password": "wrong123",
            },
        )
        assert response.status_code == 401
        assert "Incorrect" in response.json()["detail"]

    async def test_login_nonexistent_user(self, client: AsyncClient) -> None:
        """Test login fails for nonexistent user."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "pass1234",
            },
        )
        assert response.status_code == 401

    async def test_login_inactive_user(self, client: AsyncClient, db_session: AsyncSession) -> None:
        """Test login fails for inactive user."""
        # Create inactive user
        inactive_user = User(
            email="inactive@example.com",
            hashed_password=get_password_hash("pass1234"),
            is_active=False,
        )
        db_session.add(inactive_user)
        await db_session.commit()

        # Try to login
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "inactive@example.com",
                "password": "pass1234",
            },
        )
        assert response.status_code == 403
        assert "inactive" in response.json()["detail"]
