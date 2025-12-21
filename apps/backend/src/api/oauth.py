"""OAuth authentication API endpoints."""

import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db
from src.core.cookies import set_auth_cookies
from src.core.logging import get_logger
from src.core.security import create_access_token, create_refresh_token
from src.models.user import User
from src.services.oauth_service import (
    OAuthService,
    get_oauth_provider,
    is_oauth_configured,
)

logger = get_logger(__name__)

router = APIRouter()

# Store OAuth states temporarily (in production, use Redis)
oauth_states: dict[str, dict] = {}


class OAuthAccountResponse(BaseModel):
    """Response for a linked OAuth account."""

    provider: str
    provider_user_id: str
    email: str | None = None
    name: str | None = None
    avatar_url: str | None = None
    connected_at: str


class ConnectedAccountsResponse(BaseModel):
    """Response for listing connected accounts."""

    accounts: list[OAuthAccountResponse]


class OAuthCallbackRequest(BaseModel):
    """Request body for OAuth callback."""

    code: str
    state: str


@router.get("/oauth/providers")
async def get_oauth_providers() -> dict[str, bool]:
    """Get available OAuth providers and their configuration status.

    Returns:
        Dictionary of provider names and whether they are configured.
    """
    return {
        "github": is_oauth_configured("github"),
        "google": is_oauth_configured("google"),
        "microsoft": is_oauth_configured("microsoft"),
    }


@router.get("/oauth/{provider}/authorize")
async def oauth_authorize(
    provider: str,
    request: Request,
    redirect_url: str | None = Query(default=None),
) -> RedirectResponse:
    """Start OAuth authorization flow.

    Redirects the user to the OAuth provider's authorization page.

    Args:
        provider: OAuth provider name (github, google, microsoft).
        redirect_url: Optional URL to redirect to after successful auth.

    Returns:
        Redirect to the OAuth provider.

    Raises:
        HTTPException: If provider is not supported or not configured.
    """
    if not is_oauth_configured(provider):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider '{provider}' is not configured.",
        )

    try:
        oauth_provider = get_oauth_provider(provider)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)

    # Store state with metadata
    oauth_states[state] = {
        "provider": provider,
        "redirect_url": redirect_url or "/",
        "created_at": datetime.now(UTC),
        "user_id": None,  # Will be set if linking to existing account
    }

    # Clean up old states (older than 10 minutes)
    cleanup_old_states()

    authorization_url = oauth_provider.get_authorization_url(state)

    logger.info("oauth_authorize_started", provider=provider)

    return RedirectResponse(url=authorization_url)


@router.get("/oauth/{provider}/authorize/link")
async def oauth_authorize_link(
    provider: str,
    current_user: User = Depends(get_current_user),
    redirect_url: str | None = Query(default=None),
) -> RedirectResponse:
    """Start OAuth authorization flow for linking to existing account.

    Requires authentication. Links the OAuth account to the current user.

    Args:
        provider: OAuth provider name.
        redirect_url: Optional URL to redirect to after linking.

    Returns:
        Redirect to the OAuth provider.
    """
    if not is_oauth_configured(provider):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider '{provider}' is not configured.",
        )

    try:
        oauth_provider = get_oauth_provider(provider)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    state = secrets.token_urlsafe(32)

    oauth_states[state] = {
        "provider": provider,
        "redirect_url": redirect_url or "/settings",
        "created_at": datetime.now(UTC),
        "user_id": current_user.id,  # Link to this user
    }

    cleanup_old_states()

    authorization_url = oauth_provider.get_authorization_url(state)

    logger.info("oauth_authorize_link_started", provider=provider, user_id=current_user.id)

    return RedirectResponse(url=authorization_url)


@router.post("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: OAuthCallbackRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Handle OAuth callback.

    Exchanges the authorization code for tokens and creates/links user account.

    Args:
        provider: OAuth provider name.
        request: Contains code and state from OAuth callback.

    Returns:
        User info and redirect URL.

    Raises:
        HTTPException: If callback fails.
    """
    # Validate state
    state_data = oauth_states.pop(request.state, None)
    if not state_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OAuth state.",
        )

    if state_data["provider"] != provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider mismatch.",
        )

    try:
        oauth_provider = get_oauth_provider(provider)
        profile = await oauth_provider.handle_callback(request.code)
    except ValueError as e:
        logger.error("oauth_callback_failed", provider=provider, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth callback failed: {e}",
        ) from e
    except Exception as e:
        logger.exception("oauth_callback_error", provider=provider)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete OAuth authentication.",
        ) from e

    oauth_service = OAuthService(db)

    # Check if linking to existing account
    if state_data.get("user_id"):
        try:
            await oauth_service.link_oauth_account(state_data["user_id"], profile)
            logger.info(
                "oauth_account_linked",
                provider=provider,
                user_id=state_data["user_id"],
            )
            return {
                "success": True,
                "message": f"{provider.capitalize()} account linked successfully.",
                "redirect_url": state_data["redirect_url"],
            }
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            ) from e

    # Get or create user
    user, is_new = await oauth_service.get_or_create_user(profile)

    # Set auth cookies
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    set_auth_cookies(response, access_token, refresh_token)

    logger.info(
        "oauth_login_success",
        provider=provider,
        user_id=user.id,
        is_new_user=is_new,
    )

    return {
        "success": True,
        "is_new_user": is_new,
        "user": {
            "id": user.id,
            "email": user.email,
            "email_verified": user.email_verified,
        },
        "redirect_url": state_data["redirect_url"],
    }


@router.get("/oauth/accounts", response_model=ConnectedAccountsResponse)
async def get_connected_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConnectedAccountsResponse:
    """Get all OAuth accounts linked to the current user.

    Returns:
        List of connected OAuth accounts.
    """
    oauth_service = OAuthService(db)
    accounts = await oauth_service.get_linked_accounts(current_user.id)

    return ConnectedAccountsResponse(
        accounts=[
            OAuthAccountResponse(
                provider=acc.provider,
                provider_user_id=acc.provider_user_id,
                email=acc.email,
                name=acc.name,
                avatar_url=acc.avatar_url,
                connected_at=acc.created_at.isoformat(),
            )
            for acc in accounts
        ]
    )


@router.delete("/oauth/{provider}/unlink")
async def unlink_oauth_account(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Unlink an OAuth account from the current user.

    Args:
        provider: OAuth provider to unlink.

    Returns:
        Success message.

    Raises:
        HTTPException: If unlinking fails.
    """
    oauth_service = OAuthService(db)

    try:
        await oauth_service.unlink_oauth_account(current_user.id, provider)
        logger.info("oauth_account_unlinked", provider=provider, user_id=current_user.id)
        return {"message": f"{provider.capitalize()} account unlinked successfully."}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


def cleanup_old_states() -> None:
    """Remove OAuth states older than 10 minutes."""
    cutoff = datetime.now(UTC) - timedelta(minutes=10)
    expired = [state for state, data in oauth_states.items() if data["created_at"] < cutoff]
    for state in expired:
        oauth_states.pop(state, None)
