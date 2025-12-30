"""Cookie management utilities for authentication."""

from typing import Literal, cast

from fastapi import Response

from src.core.config import settings


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    csrf_token: str,
) -> None:
    """
    Set authentication cookies in the response.

    Args:
        response: FastAPI response object
        access_token: JWT access token
        refresh_token: JWT refresh token
        csrf_token: CSRF protection token
    """
    samesite: Literal["lax", "strict", "none"] | None = cast(
        Literal["lax", "strict", "none"],
        settings.cookie_samesite,
    )

    # Access token cookie (15 minutes)
    # HTTP-only, secure, SameSite protection
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=samesite,
        domain=settings.cookie_domain if settings.cookie_domain != "localhost" else None,
        path="/",
    )

    # Refresh token cookie (7 days)
    # HTTP-only, secure, restricted to auth endpoints
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=samesite,
        domain=settings.cookie_domain if settings.cookie_domain != "localhost" else None,
        path="/api/v1/auth",
    )

    # CSRF token cookie (readable by JavaScript)
    # Not HTTP-only so frontend can read and include in headers
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=False,  # Frontend needs to read this
        secure=settings.cookie_secure,
        samesite=samesite,
        domain=settings.cookie_domain if settings.cookie_domain != "localhost" else None,
        path="/",
    )


def set_partial_auth_cookies(
    response: Response,
    partial_token: str,
    csrf_token: str,
) -> None:
    """
    Set partial authentication cookies (5-minute expiry for 2FA verification step).

    Args:
        response: FastAPI response object
        partial_token: JWT partial access token
        csrf_token: CSRF protection token
    """
    samesite: Literal["lax", "strict", "none"] | None = cast(
        Literal["lax", "strict", "none"],
        settings.cookie_samesite,
    )

    # Partial access token cookie (5 minutes)
    # HTTP-only, secure, SameSite protection
    # Restricted to /api paths for 2FA verification only
    response.set_cookie(
        key="access_token",
        value=partial_token,
        max_age=300,  # 5 minutes
        httponly=True,
        secure=settings.cookie_secure,
        samesite=samesite,
        domain=settings.cookie_domain if settings.cookie_domain != "localhost" else None,
        path="/api",
    )

    # CSRF token cookie (readable by JavaScript)
    # Not HTTP-only so frontend can read and include in headers
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=300,  # 5 minutes
        httponly=False,  # Frontend needs to read this
        secure=settings.cookie_secure,
        samesite=samesite,
        domain=settings.cookie_domain if settings.cookie_domain != "localhost" else None,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """
    Clear all authentication cookies from the response.

    Args:
        response: FastAPI response object
    """
    samesite: Literal["lax", "strict", "none"] | None = cast(
        Literal["lax", "strict", "none"],
        settings.cookie_samesite,
    )

    # Clear access token (both regular and partial tokens use this name,
    # but they have different paths, so we need to clear both)
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=samesite,
        domain=settings.cookie_domain if settings.cookie_domain != "localhost" else None,
    )
    response.delete_cookie(
        key="access_token",
        path="/api",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=samesite,
        domain=settings.cookie_domain if settings.cookie_domain != "localhost" else None,
    )

    # Clear refresh token
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=samesite,
        domain=settings.cookie_domain if settings.cookie_domain != "localhost" else None,
    )

    # Clear CSRF token (not HTTP-only)
    response.delete_cookie(
        key="csrf_token",
        path="/",
        httponly=False,
        secure=settings.cookie_secure,
        samesite=samesite,
        domain=settings.cookie_domain if settings.cookie_domain != "localhost" else None,
    )


def get_cookie_max_age(hours: int) -> int:
    """
    Convert hours to seconds for cookie max_age.

    Args:
        hours: Number of hours

    Returns:
        int: Seconds
    """
    return hours * 60 * 60
