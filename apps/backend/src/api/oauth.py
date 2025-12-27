"""OAuth authentication API endpoints."""

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user
from src.core.config import settings
from src.core.cookies import set_auth_cookies
from src.core.csrf import generate_csrf_token
from src.core.database import get_db
from src.core.error_codes import AuthErrorCode
from src.core.exceptions import ValidationException
from src.core.logging import get_logger
from src.core.security import (
    create_access_token,
    create_refresh_token,
)
from src.models.user import User
from src.services.oauth_service import (
    OAuthService,
    get_oauth_provider,
    is_oauth_configured,
)

logger = get_logger(__name__)

router = APIRouter()

# Store OAuth states temporarily (in production, use Redis)
oauth_states: dict[str, dict[str, Any]] = {}


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
        raise ValidationException(
            message=f"OAuth provider '{provider}' is not configured.",
            error_code=AuthErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED,
        )

    try:
        oauth_provider = get_oauth_provider(provider)
    except ValueError as e:
        raise ValidationException(
            message=str(e),
            error_code=AuthErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED,
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
        raise ValidationException(
            message=f"OAuth provider '{provider}' is not configured.",
            error_code=AuthErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED,
        )

    try:
        oauth_provider = get_oauth_provider(provider)
    except ValueError as e:
        raise ValidationException(
            message=str(e),
            error_code=AuthErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED,
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


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Handle OAuth callback.

    Exchanges the authorization code for tokens and creates/links user account.
    Then redirects to frontend with success/error status.

    Args:
        provider: OAuth provider name.
        code: Authorization code from OAuth provider.
        state: CSRF protection state.

    Returns:
        Redirect to frontend.

    Raises:
        HTTPException: If callback fails.
    """
    # Validate state
    state_data = oauth_states.pop(state, None)
    if not state_data:
        error_url = f"{settings.frontend_url}/oauth/callback/{provider}?error_code={AuthErrorCode.OAUTH_STATE_INVALID.value}&message=Invalid+OAuth+state"
        return RedirectResponse(url=error_url)

    if state_data["provider"] != provider:
        error_url = f"{settings.frontend_url}/oauth/callback/{provider}?error_code={AuthErrorCode.OAUTH_PROVIDER_MISMATCH.value}&message=Provider+mismatch"
        return RedirectResponse(url=error_url)

    try:
        oauth_provider = get_oauth_provider(provider)
        profile = await oauth_provider.handle_callback(code)
    except ValueError as e:
        logger.error("oauth_callback_failed", provider=provider, error=str(e))
        error_url = f"{settings.frontend_url}/oauth/callback/{provider}?error_code={AuthErrorCode.OAUTH_CALLBACK_FAILED.value}&message=OAuth+authentication+failed"
        return RedirectResponse(url=error_url)
    except Exception:
        logger.exception("oauth_callback_error", provider=provider)
        error_url = f"{settings.frontend_url}/oauth/callback/{provider}?error_code={AuthErrorCode.OAUTH_CALLBACK_FAILED.value}&message=Server+error"
        return RedirectResponse(url=error_url)

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
            success_url = (
                f"{settings.frontend_url}{state_data['redirect_url']}"
                f"?oauth_linked=true&provider={provider}"
            )
            return RedirectResponse(url=success_url)
        except ValueError as e:
            error_url = (
                f"{settings.frontend_url}/oauth/callback/{provider}"
                f"?error_code={AuthErrorCode.OAUTH_LINK_FAILED.value}&message={str(e)}"
            )
            return RedirectResponse(url=error_url)

    # Get or create user
    user, is_new = await oauth_service.get_or_create_user(profile)

    # All OAuth login scenarios need to authenticate the user via the frontend callback route
    # The backend sets auth cookies here, then redirects to frontend to fetch user info and update auth store

    # Determine which redirect URL to use based on user state
    if user.two_factor_enabled:
        # User has 2FA - frontend will route to verification
        auth_redirect = f"/oauth/callback/{provider}?oauth=true&status=2fa_required"
    elif (settings.two_factor_mandatory or is_new) and not user.two_factor_enabled:
        # User needs 2FA setup - frontend will route to setup
        auth_redirect = f"/oauth/callback/{provider}?oauth=true&status=2fa_setup_required"
    elif is_new and not user.profile_completed:
        # New user needs profile completion - frontend will route to profile
        auth_redirect = f"/oauth/callback/{provider}?oauth=true&status=profile_completion_required"
    else:
        # Normal login - user will be directed to their requested redirect URL
        auth_redirect = f"/oauth/callback/{provider}?oauth=true&status=success"

    response = RedirectResponse(url=f"{settings.frontend_url}{auth_redirect}")

    csrf_token = generate_csrf_token()

    # ALL OAuth users get a refresh token marked with oauth=True
    # When the refresh token expires, frontend detects oauth_reauthentication_required error
    # and redirects to OAuth provider for re-authentication
    # For OAuth, both access and refresh tokens expire at the same time (access_token_expire_minutes)
    oauth_token_expiry = timedelta(minutes=settings.access_token_expire_minutes)

    refresh_token_str = create_refresh_token(
        data={"sub": str(user.id), "oauth": True},  # Mark as OAuth token
        expires_delta=oauth_token_expiry,
    )

    # OAuth users always get full access tokens (not partial)
    # The frontend will handle 2FA verification/setup UX, but the user remains authenticated via OAuth
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=oauth_token_expiry,
    )

    # Set auth cookies (both access and refresh tokens)
    set_auth_cookies(response, access_token, refresh_token_str, csrf_token)

    # DO NOT create RefreshToken or UserSession DB records for OAuth users
    # OAuth tokens are ephemeral - when they expire, user re-authenticates via provider

    logger.info(
        "oauth_login_success",
        provider=provider,
        user_id=user.id,
        is_new_user=is_new,
        auth_method="oauth",
    )

    return response


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
        raise ValidationException(
            message=str(e),
            error_code=AuthErrorCode.OAUTH_LINK_FAILED,
        ) from e


def cleanup_old_states() -> None:
    """Remove OAuth states older than 10 minutes."""
    cutoff = datetime.now(UTC) - timedelta(minutes=10)
    expired = [state for state, data in oauth_states.items() if data["created_at"] < cutoff]
    for state in expired:
        oauth_states.pop(state, None)
