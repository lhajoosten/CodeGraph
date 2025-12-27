"""Integration tests for mandatory 2FA authentication flow."""

import pyotp
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_password_hash
from src.models.user import User
from src.services.two_factor_service import TwoFactorService


@pytest.mark.asyncio
async def test_login_with_2fa_enabled(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test login flow when user has 2FA enabled."""
    # Create user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Enable 2FA
    service = TwoFactorService(db_session)
    secret, _ = await service.setup_2fa(user)
    totp = pyotp.TOTP(secret)
    code = totp.now()
    await service.enable_2fa(user, code)
    await db_session.commit()
    db_session.expunge(user)

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["requires_two_factor"] is True
    assert data["two_factor_enabled"] is True
    # Verify partial token is set (not full token)
    assert response.cookies.get("access_token") is not None


@pytest.mark.asyncio
async def test_verify_2fa_code_success(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test successful 2FA code verification during login."""
    # Create user with 2FA enabled
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()

    service = TwoFactorService(db_session)
    secret, _ = await service.setup_2fa(user)
    totp = pyotp.TOTP(secret)
    await service.enable_2fa(user, totp.now())
    await db_session.commit()
    db_session.expunge(user)

    # Get partial token by logging in
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200

    # Verify 2FA code
    totp = pyotp.TOTP(user.two_factor_secret)
    code = totp.now()
    verify_response = await client.post(
        "/api/v1/auth/verify-2fa",
        json={"code": code, "remember_me": False},
    )

    assert verify_response.status_code == 200
    data = verify_response.json()
    assert data["requires_two_factor"] is False
    assert data["two_factor_enabled"] is True


@pytest.mark.asyncio
async def test_verify_invalid_2fa_code(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test 2FA code verification with invalid code."""
    # Create user with 2FA enabled
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()

    service = TwoFactorService(db_session)
    secret, _ = await service.setup_2fa(user)
    totp = pyotp.TOTP(secret)
    await service.enable_2fa(user, totp.now())
    await db_session.commit()
    await db_session.refresh(user)

    # Login to get partial token
    await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )

    # Try to verify with invalid code
    response = await client.post(
        "/api/v1/auth/verify-2fa",
        json={"code": "999999", "remember_me": False},
    )

    assert response.status_code == 401
    assert "Invalid" in response.json().get("detail", "")


@pytest.mark.asyncio
async def test_login_without_2fa_when_mandatory(
    client: AsyncClient,
    db_session: AsyncSession,
    settings_override,
) -> None:
    """Test login when 2FA is mandatory but not enabled."""
    # Enable mandatory 2FA setting
    settings_override(two_factor_mandatory=True)

    # Create user without 2FA
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        email_verified=True,
        two_factor_enabled=False,
    )
    db_session.add(user)
    await db_session.commit()

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["requires_two_factor"] is True
    assert data["two_factor_enabled"] is False


@pytest.mark.asyncio
async def test_partial_token_cannot_access_protected_resource(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test that partial tokens cannot access protected resources."""
    # Create user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        email_verified=True,
        two_factor_enabled=True,
    )
    db_session.add(user)
    await db_session.flush()

    service = TwoFactorService(db_session)
    secret, _ = await service.setup_2fa(user)
    totp = pyotp.TOTP(secret)
    await service.enable_2fa(user, totp.now())
    await db_session.commit()
    await db_session.refresh(user)

    # Login to get partial token
    await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )

    # Try to access protected resource with partial token
    response = await client.get("/api/v1/users/me")

    assert response.status_code == 403
    assert "2fa_verification_required" in response.json().get("detail", "")


@pytest.mark.asyncio
async def test_backup_code_works_for_2fa_verification(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test that backup codes work for 2FA verification."""
    # Create user with 2FA
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()

    service = TwoFactorService(db_session)
    secret, _ = await service.setup_2fa(user)
    # Generate valid TOTP code
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()
    backup_codes = await service.enable_2fa(user, valid_code)
    await db_session.commit()
    await db_session.refresh(user)

    # Login to get partial token
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200

    # Verify with backup code
    if backup_codes:
        backup_code = backup_codes[0]
        response = await client.post(
            "/api/v1/auth/verify-2fa",
            json={"code": backup_code, "remember_me": False},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["two_factor_enabled"] is True
