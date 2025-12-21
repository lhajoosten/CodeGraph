"""API dependencies for authentication and database access."""

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import decode_token
from src.models.user import User

# HTTP Bearer token security scheme (legacy support, will be removed)
security = HTTPBearer(auto_error=False)


async def get_token_from_cookie(
    access_token: Annotated[str | None, Cookie()] = None,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
) -> str:
    """
    Extract JWT token from cookie or fallback to Bearer header.

    Prioritizes cookie-based authentication but supports legacy Bearer tokens.

    Args:
        access_token: Access token from HTTP-only cookie
        credentials: HTTP authorization credentials (legacy support)

    Returns:
        str: JWT token

    Raises:
        HTTPException: If no valid token is found
    """
    # Priority 1: Cookie-based authentication (new method)
    if access_token:
        return access_token

    # Priority 2: Bearer token (legacy support, will be removed)
    if credentials:
        return credentials.credentials

    # No authentication found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    token: Annotated[str, Depends(get_token_from_cookie)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Get the current authenticated user from the JWT token.

    Args:
        token: JWT token from cookie or header
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


async def get_current_user_optional(
    access_token: Annotated[str | None, Cookie()] = None,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> User | None:
    """
    Get the current user if authenticated, otherwise return None.

    Useful for endpoints that have optional authentication.

    Args:
        access_token: Access token from HTTP-only cookie
        credentials: HTTP authorization credentials (legacy support)
        db: Database session

    Returns:
        User | None: The authenticated user or None
    """
    try:
        token = await get_token_from_cookie(access_token, credentials)
        return await get_current_user(token, db)
    except HTTPException:
        return None


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Get the current active user.

    Args:
        current_user: Current authenticated user

    Returns:
        User: The authenticated active user

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user
