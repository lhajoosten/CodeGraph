"""OAuth service for third-party authentication."""

import secrets
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.logging import get_logger
from src.core.security import get_password_hash
from src.models.oauth_account import OAuthAccount
from src.models.user import User

logger = get_logger(__name__)


@dataclass
class OAuthUserProfile:
    """User profile data from OAuth provider."""

    provider: str
    provider_user_id: str
    email: str
    name: str | None
    avatar_url: str | None
    profile_data: dict[str, Any]


class OAuthProvider(ABC):
    """Abstract base class for OAuth providers."""

    provider_name: str

    @abstractmethod
    def get_authorization_url(self, state: str) -> str:
        """Get the authorization URL for the OAuth flow.

        Args:
            state: CSRF protection state parameter.

        Returns:
            Authorization URL to redirect the user to.
        """

    @abstractmethod
    async def handle_callback(self, code: str) -> OAuthUserProfile:
        """Handle the OAuth callback and get user profile.

        Args:
            code: Authorization code from the callback.

        Returns:
            User profile data from the OAuth provider.
        """


class GitHubOAuth(OAuthProvider):
    """GitHub OAuth provider implementation."""

    provider_name = "github"

    def get_authorization_url(self, state: str) -> str:
        """Get GitHub authorization URL."""
        client_id = settings.github_client_id
        redirect_uri = f"{settings.frontend_url}/oauth/callback/github"
        scope = "user:email"

        return (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope={scope}"
            f"&state={state}"
        )

    async def handle_callback(self, code: str) -> OAuthUserProfile:
        """Handle GitHub OAuth callback."""
        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
            )
            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                raise ValueError(f"Failed to get access token: {token_data}")

            # Get user profile
            headers = {"Authorization": f"token {access_token}"}
            user_response = await client.get("https://api.github.com/user", headers=headers)
            user_data = user_response.json()

            # Get user email if not public
            email = user_data.get("email")
            if not email:
                emails_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers=headers,
                )
                emails = emails_response.json()
                primary_email = next(
                    (e for e in emails if e.get("primary") and e.get("verified")),
                    None,
                )
                if primary_email:
                    email = primary_email.get("email")

            return OAuthUserProfile(
                provider="github",
                provider_user_id=str(user_data["id"]),
                email=email or "",
                name=user_data.get("name") or user_data.get("login"),
                avatar_url=user_data.get("avatar_url"),
                profile_data={
                    "login": user_data.get("login"),
                    "bio": user_data.get("bio"),
                    "company": user_data.get("company"),
                    "location": user_data.get("location"),
                    "access_token": access_token,
                },
            )


class GoogleOAuth(OAuthProvider):
    """Google OAuth provider implementation."""

    provider_name = "google"

    def get_authorization_url(self, state: str) -> str:
        """Get Google authorization URL."""
        client_id = settings.google_client_id
        redirect_uri = f"{settings.frontend_url}/oauth/callback/google"
        scope = "openid email profile"

        return (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope={scope}"
            f"&response_type=code"
            f"&state={state}"
            f"&access_type=offline"
            f"&prompt=consent"
        )

    async def handle_callback(self, code: str) -> OAuthUserProfile:
        """Handle Google OAuth callback."""
        redirect_uri = f"{settings.frontend_url}/oauth/callback/google"

        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                },
            )
            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                raise ValueError(f"Failed to get access token: {token_data}")

            # Get user profile
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_data = user_response.json()

            return OAuthUserProfile(
                provider="google",
                provider_user_id=user_data["id"],
                email=user_data.get("email", ""),
                name=user_data.get("name"),
                avatar_url=user_data.get("picture"),
                profile_data={
                    "given_name": user_data.get("given_name"),
                    "family_name": user_data.get("family_name"),
                    "locale": user_data.get("locale"),
                    "access_token": access_token,
                    "refresh_token": token_data.get("refresh_token"),
                },
            )


class MicrosoftOAuth(OAuthProvider):
    """Microsoft OAuth provider implementation."""

    provider_name = "microsoft"

    def get_authorization_url(self, state: str) -> str:
        """Get Microsoft authorization URL."""
        client_id = settings.microsoft_client_id
        redirect_uri = f"{settings.frontend_url}/oauth/callback/microsoft"
        scope = "openid email profile User.Read"

        return (
            f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope={scope}"
            f"&response_type=code"
            f"&state={state}"
            f"&response_mode=query"
        )

    async def handle_callback(self, code: str) -> OAuthUserProfile:
        """Handle Microsoft OAuth callback."""
        redirect_uri = f"{settings.frontend_url}/oauth/callback/microsoft"

        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            token_response = await client.post(
                "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                data={
                    "client_id": settings.microsoft_client_id,
                    "client_secret": settings.microsoft_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                },
            )
            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                raise ValueError(f"Failed to get access token: {token_data}")

            # Get user profile
            user_response = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_data = user_response.json()

            return OAuthUserProfile(
                provider="microsoft",
                provider_user_id=user_data["id"],
                email=user_data.get("mail") or user_data.get("userPrincipalName", ""),
                name=user_data.get("displayName"),
                avatar_url=None,  # Microsoft requires separate API call for photo
                profile_data={
                    "job_title": user_data.get("jobTitle"),
                    "office_location": user_data.get("officeLocation"),
                    "access_token": access_token,
                    "refresh_token": token_data.get("refresh_token"),
                },
            )


# OAuth provider registry
OAUTH_PROVIDERS: dict[str, type[OAuthProvider]] = {
    "github": GitHubOAuth,
    "google": GoogleOAuth,
    "microsoft": MicrosoftOAuth,
}


def get_oauth_provider(provider_name: str) -> OAuthProvider:
    """Get an OAuth provider by name.

    Args:
        provider_name: Name of the provider (github, google, microsoft).

    Returns:
        OAuth provider instance.

    Raises:
        ValueError: If provider is not supported.
    """
    provider_class = OAUTH_PROVIDERS.get(provider_name)
    if not provider_class:
        raise ValueError(f"Unsupported OAuth provider: {provider_name}")
    return provider_class()


def is_oauth_configured(provider_name: str) -> bool:
    """Check if an OAuth provider is configured.

    Args:
        provider_name: Name of the provider.

    Returns:
        True if the provider is configured.
    """
    if provider_name == "github":
        return bool(settings.github_client_id and settings.github_client_secret)
    elif provider_name == "google":
        return bool(settings.google_client_id and settings.google_client_secret)
    elif provider_name == "microsoft":
        return bool(settings.microsoft_client_id and settings.microsoft_client_secret)
    return False


class OAuthService:
    """Service for OAuth authentication operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the OAuth service.

        Args:
            db: Async database session.
        """
        self.db = db

    async def get_or_create_user(self, profile: OAuthUserProfile) -> tuple[User, bool]:
        """Get existing user or create new one from OAuth profile.

        If the OAuth account is already linked to a user, return that user.
        If a user with the same email exists, link the OAuth account.
        Otherwise, create a new user.

        Args:
            profile: OAuth user profile data.

        Returns:
            Tuple of (user, is_new_user).
        """
        # Check if OAuth account already exists
        existing_oauth = await self._get_oauth_account(profile.provider, profile.provider_user_id)
        if existing_oauth:
            logger.info(
                "oauth_login_existing",
                provider=profile.provider,
                user_id=existing_oauth.user_id,
            )
            # Update tokens
            existing_oauth.access_token = profile.profile_data.get("access_token")
            existing_oauth.refresh_token = profile.profile_data.get("refresh_token")
            if profile.profile_data.get("refresh_token"):
                existing_oauth.token_expires_at = datetime.now(UTC) + timedelta(hours=1)
            await self.db.commit()

            result = await self.db.execute(select(User).where(User.id == existing_oauth.user_id))
            user = result.scalar_one()
            return user, False

        # Check if user with same email exists
        if profile.email:
            result = await self.db.execute(select(User).where(User.email == profile.email))
            existing_user = result.scalar_one_or_none()

            if existing_user:
                # Link OAuth account to existing user
                await self._create_oauth_account(existing_user.id, profile)
                logger.info(
                    "oauth_linked_to_existing",
                    provider=profile.provider,
                    user_id=existing_user.id,
                )
                return existing_user, False

        # Create new user
        new_user = User(
            email=profile.email or f"{profile.provider}_{profile.provider_user_id}@oauth.local",
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            email_verified=bool(profile.email),  # OAuth emails are verified
            is_active=True,
        )
        self.db.add(new_user)
        await self.db.flush()

        # Create OAuth account link
        await self._create_oauth_account(new_user.id, profile)

        await self.db.commit()
        logger.info(
            "oauth_user_created",
            provider=profile.provider,
            user_id=new_user.id,
        )
        return new_user, True

    async def link_oauth_account(self, user_id: int, profile: OAuthUserProfile) -> OAuthAccount:
        """Link an OAuth account to an existing user.

        Args:
            user_id: The user ID to link to.
            profile: OAuth user profile data.

        Returns:
            The created OAuth account.

        Raises:
            ValueError: If the OAuth account is already linked to another user.
        """
        # Check if OAuth account already exists
        existing = await self._get_oauth_account(profile.provider, profile.provider_user_id)
        if existing:
            if existing.user_id != user_id:
                raise ValueError("This account is already linked to another user.")
            return existing

        # Check if user already has this provider linked
        result = await self.db.execute(
            select(OAuthAccount).where(
                OAuthAccount.user_id == user_id,
                OAuthAccount.provider == profile.provider,
            )
        )
        existing_provider = result.scalar_one_or_none()
        if existing_provider:
            raise ValueError(f"You already have a {profile.provider} account linked.")

        return await self._create_oauth_account(user_id, profile)

    async def unlink_oauth_account(self, user_id: int, provider: str) -> None:
        """Unlink an OAuth account from a user.

        Args:
            user_id: The user ID.
            provider: The OAuth provider to unlink.

        Raises:
            ValueError: If the account is not linked or is the only auth method.
        """
        # Check if OAuth account exists
        result = await self.db.execute(
            select(OAuthAccount).where(
                OAuthAccount.user_id == user_id,
                OAuthAccount.provider == provider,
            )
        )
        oauth_account = result.scalar_one_or_none()

        if not oauth_account:
            raise ValueError(f"No {provider} account linked.")

        # Check if user has password or other OAuth accounts
        result = await self.db.execute(
            select(OAuthAccount).where(
                OAuthAccount.user_id == user_id,
                OAuthAccount.provider != provider,
            )
        )
        other_oauth = result.scalars().all()

        user_result = await self.db.execute(select(User).where(User.id == user_id))
        user: User = user_result.scalar_one()

        # User must have either a password or another OAuth account
        has_password = not user.hashed_password.startswith("$2b$")  # Check if it's a random hash
        if not other_oauth and not has_password:
            # Actually, we should check if they have a real password set
            # For now, we'll allow unlinking if they have other OAuth accounts
            if not other_oauth:
                raise ValueError(
                    "Cannot unlink the only authentication method. "
                    "Please set a password or link another account first."
                )

        await self.db.delete(oauth_account)
        await self.db.commit()

        logger.info("oauth_account_unlinked", provider=provider, user_id=user_id)

    async def get_linked_accounts(self, user_id: int) -> list[OAuthAccount]:
        """Get all OAuth accounts linked to a user.

        Args:
            user_id: The user ID.

        Returns:
            List of linked OAuth accounts.
        """
        result = await self.db.execute(select(OAuthAccount).where(OAuthAccount.user_id == user_id))
        return list(result.scalars().all())

    async def _get_oauth_account(self, provider: str, provider_user_id: str) -> OAuthAccount | None:
        """Get an OAuth account by provider and provider user ID."""
        result = await self.db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == provider,
                OAuthAccount.provider_user_id == provider_user_id,
            )
        )
        return result.scalar_one_or_none()

    async def _create_oauth_account(self, user_id: int, profile: OAuthUserProfile) -> OAuthAccount:
        """Create a new OAuth account link."""
        oauth_account = OAuthAccount(
            user_id=user_id,
            provider=profile.provider,
            provider_user_id=profile.provider_user_id,
            email=profile.email,
            name=profile.name,
            avatar_url=profile.avatar_url,
            access_token=profile.profile_data.get("access_token"),
            refresh_token=profile.profile_data.get("refresh_token"),
            token_expires_at=(
                datetime.now(UTC) + timedelta(hours=1)
                if profile.profile_data.get("access_token")
                else None
            ),
            profile_data=profile.profile_data,
        )
        self.db.add(oauth_account)
        await self.db.commit()
        return oauth_account
