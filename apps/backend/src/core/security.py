"""Security utilities for authentication and authorization."""

import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.core.config import settings

logger = logging.getLogger(__name__)

# BCrypt has a maximum password length of 72 bytes
BCRYPT_MAX_PASSWORD_LENGTH = 72

# Password hashing context with bcrypt configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def _truncate_password(password: str) -> str:
    """
    Truncate password to BCrypt's maximum length of 72 bytes.

    BCrypt silently truncates passwords longer than 72 bytes, which can lead to
    security issues where different passwords hash to the same value. This function
    explicitly truncates to ensure consistent behavior.

    Args:
        password: Plain text password

    Returns:
        Password truncated to 72 bytes if necessary
    """
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > BCRYPT_MAX_PASSWORD_LENGTH:
        logger.debug(f"Password exceeds {BCRYPT_MAX_PASSWORD_LENGTH} bytes, truncating")
        # Truncate at byte boundary, then decode back to string
        return password_bytes[:BCRYPT_MAX_PASSWORD_LENGTH].decode("utf-8", errors="ignore")
    return password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against

    Returns:
        True if password matches, False otherwise
    """
    truncated = _truncate_password(plain_password)
    return pwd_context.verify(truncated, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password string
    """
    truncated = _truncate_password(password)
    return pwd_context.hash(truncated)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token (typically user_id)
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    logger.debug(f"Created access token for user_id={data.get('sub')}")
    return encoded_jwt


def create_refresh_token(data: dict[str, Any]) -> str:
    """
    Create a JWT refresh token.

    Args:
        data: Data to encode in the token (typically user_id)

    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    logger.debug(f"Created refresh token for user_id={data.get('sub')}")
    return encoded_jwt


def decode_token(token: str) -> dict[str, Any] | None:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string to decode

    Returns:
        Decoded token payload or None if invalid

    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        logger.debug(f"Successfully decoded token for user_id={payload.get('sub')}")
        return payload
    except JWTError as e:
        logger.debug(f"Failed to decode token: {e}")
        return None


def create_session_token() -> str:
    """
    Create a cryptographically secure session token.

    Returns:
        str: Random session token
    """
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """
    Hash a token using SHA-256 for secure storage.

    Args:
        token: Token to hash

    Returns:
        str: Hexadecimal hash of the token
    """
    return hashlib.sha256(token.encode()).hexdigest()
