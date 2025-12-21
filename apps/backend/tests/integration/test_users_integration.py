"""Integration tests for user authentication endpoints with real database."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_password_hash
from src.models.user import User


@pytest.mark.asyncio
class TestUserAuthIntegration:
    """Integration tests for user authentication with PostgreSQL."""

    async def test_register_user_success(
        self, client: TestClient, db_session: AsyncSession
    ) -> None:
        """Test successful user registration with real database."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "pass123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data
        assert "password" not in data

    async def test_register_user_duplicate_email(
        self, client: TestClient, db_session: AsyncSession
    ) -> None:
        """Test registration fails with duplicate email."""
        # First registration
        response1 = client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "pass123",
            },
        )
        assert response1.status_code == 201

        # Duplicate registration
        response2 = client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "pass456",
            },
        )
        assert response2.status_code == 400
        assert "already registered" in response2.json()["detail"]

    async def test_register_user_invalid_email(self, client: TestClient) -> None:
        """Test registration fails with invalid email."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email-format",
                "password": "pass123",
            },
        )
        assert response.status_code == 422

    async def test_register_user_weak_password(self, client: TestClient) -> None:
        """Test registration fails with password less than 8 characters."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "short",
            },
        )
        assert response.status_code == 422

    async def test_login_success(self, client: TestClient, db_session: AsyncSession) -> None:
        """Test successful login returns JWT tokens."""
        # Register user first
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "testuser@example.com",
                "password": "pass123",
            },
        )
        assert register_response.status_code == 201

        # Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "testuser@example.com",
                "password": "pass123",
            },
        )
        assert login_response.status_code == 200
        data = login_response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_credentials(
        self, client: TestClient, db_session: AsyncSession
    ) -> None:
        """Test login fails with incorrect password."""
        # Register user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "wrongpass@example.com",
                "password": "pass123",
            },
        )

        # Try wrong password
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "wrongpass@example.com",
                "password": "wrong123",
            },
        )
        assert response.status_code == 401
        assert "Incorrect" in response.json()["detail"]

    async def test_login_nonexistent_user(self, client: TestClient) -> None:
        """Test login fails for nonexistent user."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "pass123",
            },
        )
        assert response.status_code == 401

    async def test_login_inactive_user(self, client: TestClient, db_session: AsyncSession) -> None:
        """Test login fails for inactive user."""
        # Create inactive user directly
        inactive_user = User(
            email="inactive@example.com",
            hashed_password=get_password_hash("pass123"),
            is_active=False,
        )
        db_session.add(inactive_user)
        await db_session.commit()

        # Try to login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "inactive@example.com",
                "password": "pass123",
            },
        )
        assert response.status_code == 403
        assert "inactive" in response.json()["detail"]
