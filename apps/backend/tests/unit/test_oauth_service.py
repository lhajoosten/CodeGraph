"""Unit tests for the OAuth service."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_password_hash
from src.models.oauth_account import OAuthAccount
from src.models.user import User
from src.services.oauth_service import (
    GitHubOAuth,
    GoogleOAuth,
    MicrosoftOAuth,
    OAuthService,
    OAuthUserProfile,
    get_oauth_provider,
    is_oauth_configured,
)


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user for OAuth tests."""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
        email_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def github_profile() -> OAuthUserProfile:
    """Create a sample GitHub OAuth profile."""
    return OAuthUserProfile(
        provider="github",
        provider_user_id="12345",
        email="github@example.com",
        name="GitHub User",
        avatar_url="https://github.com/avatar.png",
        profile_data={"login": "ghuser", "access_token": "gh_token"},
    )


@pytest.fixture
def google_profile() -> OAuthUserProfile:
    """Create a sample Google OAuth profile."""
    return OAuthUserProfile(
        provider="google",
        provider_user_id="google-12345",
        email="google@example.com",
        name="Google User",
        avatar_url="https://google.com/avatar.png",
        profile_data={"given_name": "Google", "access_token": "google_token"},
    )


class TestOAuthProviderRegistry:
    """Tests for OAuth provider registry."""

    def test_get_github_provider(self) -> None:
        """Test getting GitHub provider."""
        provider = get_oauth_provider("github")
        assert isinstance(provider, GitHubOAuth)
        assert provider.provider_name == "github"

    def test_get_google_provider(self) -> None:
        """Test getting Google provider."""
        provider = get_oauth_provider("google")
        assert isinstance(provider, GoogleOAuth)
        assert provider.provider_name == "google"

    def test_get_microsoft_provider(self) -> None:
        """Test getting Microsoft provider."""
        provider = get_oauth_provider("microsoft")
        assert isinstance(provider, MicrosoftOAuth)
        assert provider.provider_name == "microsoft"

    def test_get_unsupported_provider(self) -> None:
        """Test getting unsupported provider."""
        with pytest.raises(ValueError, match="Unsupported OAuth provider"):
            get_oauth_provider("unsupported")


class TestOAuthProviderConfiguration:
    """Tests for OAuth provider configuration checking."""

    def test_is_oauth_configured_github(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test checking if GitHub is configured."""
        from src.core import config as config_module

        # Not configured (default)
        assert is_oauth_configured("github") is False

        # Configure it
        monkeypatch.setattr(config_module.settings, "github_client_id", "test_id")
        monkeypatch.setattr(config_module.settings, "github_client_secret", "test_secret")
        assert is_oauth_configured("github") is True

    def test_is_oauth_configured_unknown(self) -> None:
        """Test checking unknown provider."""
        assert is_oauth_configured("unknown") is False


class TestGitHubOAuth:
    """Tests for GitHub OAuth provider."""

    def test_get_authorization_url(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test GitHub authorization URL generation."""
        from src.core import config as config_module

        monkeypatch.setattr(config_module.settings, "github_client_id", "test_client_id")
        monkeypatch.setattr(config_module.settings, "frontend_url", "http://localhost:5173")

        provider = GitHubOAuth()
        state = "test_state_123"
        url = provider.get_authorization_url(state)

        assert "https://github.com/login/oauth/authorize" in url
        assert "client_id=test_client_id" in url
        assert "state=test_state_123" in url
        assert "scope=user:email" in url


class TestOAuthService:
    """Tests for OAuthService."""

    @pytest.mark.asyncio
    async def test_get_or_create_user_new_user(
        self, db_session: AsyncSession, github_profile: OAuthUserProfile
    ) -> None:
        """Test creating a new user from OAuth profile."""
        service = OAuthService(db_session)

        user, is_new = await service.get_or_create_user(github_profile)

        assert is_new is True
        assert user.email == github_profile.email
        assert user.email_verified is True  # OAuth emails are verified

    @pytest.mark.asyncio
    async def test_get_or_create_user_existing_oauth(
        self, db_session: AsyncSession, test_user: User, github_profile: OAuthUserProfile
    ) -> None:
        """Test returning existing user with same OAuth account."""
        service = OAuthService(db_session)

        # First, link the OAuth account
        github_profile.email = test_user.email
        user1, is_new1 = await service.get_or_create_user(github_profile)

        # Second call should return the same user
        user2, is_new2 = await service.get_or_create_user(github_profile)

        assert is_new1 is False  # Email existed
        assert is_new2 is False
        assert user1.id == user2.id

    @pytest.mark.asyncio
    async def test_get_or_create_user_link_to_existing_email(
        self, db_session: AsyncSession, test_user: User, github_profile: OAuthUserProfile
    ) -> None:
        """Test linking OAuth to existing user with same email."""
        service = OAuthService(db_session)

        # Change profile email to match existing user
        github_profile.email = test_user.email

        user, is_new = await service.get_or_create_user(github_profile)

        assert is_new is False
        assert user.id == test_user.id

    @pytest.mark.asyncio
    async def test_link_oauth_account(
        self, db_session: AsyncSession, test_user: User, github_profile: OAuthUserProfile
    ) -> None:
        """Test linking OAuth account to user."""
        service = OAuthService(db_session)

        oauth_account = await service.link_oauth_account(test_user.id, github_profile)

        assert oauth_account.user_id == test_user.id
        assert oauth_account.provider == "github"
        assert oauth_account.provider_user_id == github_profile.provider_user_id

    @pytest.mark.asyncio
    async def test_link_oauth_account_already_linked_same_user(
        self, db_session: AsyncSession, test_user: User, github_profile: OAuthUserProfile
    ) -> None:
        """Test linking same OAuth account twice to same user."""
        service = OAuthService(db_session)

        account1 = await service.link_oauth_account(test_user.id, github_profile)
        account2 = await service.link_oauth_account(test_user.id, github_profile)

        assert account1.id == account2.id

    @pytest.mark.asyncio
    async def test_link_oauth_account_provider_already_linked(
        self, db_session: AsyncSession, test_user: User, github_profile: OAuthUserProfile
    ) -> None:
        """Test linking second GitHub account to same user."""
        service = OAuthService(db_session)

        # Link first account
        await service.link_oauth_account(test_user.id, github_profile)

        # Try to link different GitHub account
        github_profile.provider_user_id = "different_id"
        with pytest.raises(ValueError, match="already have a github account linked"):
            await service.link_oauth_account(test_user.id, github_profile)

    @pytest.mark.asyncio
    async def test_unlink_oauth_account(
        self,
        db_session: AsyncSession,
        test_user: User,
        github_profile: OAuthUserProfile,
        google_profile: OAuthUserProfile,
    ) -> None:
        """Test unlinking OAuth account when another auth method exists."""
        service = OAuthService(db_session)

        # Link two accounts (so one can be unlinked)
        await service.link_oauth_account(test_user.id, github_profile)
        await service.link_oauth_account(test_user.id, google_profile)

        # Unlink one
        await service.unlink_oauth_account(test_user.id, "github")

        # Check only google remains
        accounts = await service.get_linked_accounts(test_user.id)
        assert len(accounts) == 1
        assert accounts[0].provider == "google"

    @pytest.mark.asyncio
    async def test_unlink_oauth_account_not_linked(
        self, db_session: AsyncSession, test_user: User
    ) -> None:
        """Test unlinking non-existent OAuth account."""
        service = OAuthService(db_session)

        with pytest.raises(ValueError, match="No github account linked"):
            await service.unlink_oauth_account(test_user.id, "github")

    @pytest.mark.asyncio
    async def test_get_linked_accounts(
        self,
        db_session: AsyncSession,
        test_user: User,
        github_profile: OAuthUserProfile,
        google_profile: OAuthUserProfile,
    ) -> None:
        """Test getting all linked accounts."""
        service = OAuthService(db_session)

        # Link multiple accounts
        await service.link_oauth_account(test_user.id, github_profile)
        await service.link_oauth_account(test_user.id, google_profile)

        accounts = await service.get_linked_accounts(test_user.id)

        assert len(accounts) == 2
        providers = {acc.provider for acc in accounts}
        assert providers == {"github", "google"}
