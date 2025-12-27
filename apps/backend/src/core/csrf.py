"""CSRF (Cross-Site Request Forgery) protection utilities."""

import hashlib
import hmac
import secrets

from fastapi import HTTPException, Request, status

from src.core.config import settings


def generate_csrf_token() -> str:
    """
    Generate a cryptographically secure CSRF token.

    Returns:
        str: Random CSRF token
    """
    return secrets.token_urlsafe(32)


def create_csrf_token_hash(token: str) -> str:
    """
    Create an HMAC hash of the CSRF token for validation.

    Args:
        token: CSRF token to hash

    Returns:
        str: HMAC hash of the token
    """
    return hmac.new(
        settings.csrf_secret_key.encode(),
        token.encode(),
        hashlib.sha256,
    ).hexdigest()


def validate_csrf_token(token_from_header: str | None, token_from_cookie: str | None) -> bool:
    """
    Validate CSRF token using double-submit cookie pattern.

    Compares the token from the request header with the token from the cookie.

    Args:
        token_from_header: CSRF token from X-CSRF-Token header
        token_from_cookie: CSRF token from cookie

    Returns:
        bool: True if tokens match and are valid, False otherwise
    """
    if not token_from_header or not token_from_cookie:
        return False

    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(token_from_header, token_from_cookie)


async def verify_csrf_token(request: Request) -> None:
    """
    Dependency to verify CSRF token for state-changing requests.

    Args:
        request: FastAPI request object

    Raises:
        HTTPException: 403 if CSRF token is invalid or missing
    """
    # Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    # Extract tokens
    token_from_header = request.headers.get("X-CSRF-Token")
    token_from_cookie = request.cookies.get("csrf_token")

    # Validate tokens
    if not validate_csrf_token(token_from_header, token_from_cookie):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token validation failed",
        )
