"""OAuth account model for third-party authentication."""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.encryption import EncryptedString
from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.user import User

# Use JSONB for PostgreSQL, fallback to JSON for other databases (e.g., SQLite in tests)
JSONType = JSON().with_variant(JSONB(), "postgresql")


class OAuthAccount(Base, TimestampMixin):
    """OAuth account model for linked third-party accounts.

    Stores OAuth provider connections for users, allowing them to log in
    via GitHub, Google, Microsoft, etc.

    OAuth tokens are stored encrypted using Fernet symmetric encryption.
    Encryption/decryption is transparent and happens automatically.

    Attributes:
        id (int): Primary key.
        user_id (int): Foreign key to the linked user.
        provider (str): OAuth provider name (e.g., 'github', 'google', 'microsoft').
        provider_user_id (str): User ID from the OAuth provider.
        access_token (str | None): Encrypted OAuth access token (auto-decrypted on read).
        refresh_token (str | None): Encrypted OAuth refresh token (auto-decrypted on read).
        token_expires_at (datetime | None): When the access token expires.
        profile_data (dict): Additional profile data from the provider.

    Relationships:
        user (User): The user who owns this OAuth account.
    """

    __tablename__ = "oauth_accounts"

    # Ensure unique provider per user
    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_user"),
        UniqueConstraint("user_id", "provider", name="uq_user_provider"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False)

    # OAuth tokens - stored encrypted using Fernet symmetric encryption
    # Encryption is transparent - automatically encrypted on write, decrypted on read
    access_token: Mapped[str | None] = mapped_column(EncryptedString())
    refresh_token: Mapped[str | None] = mapped_column(EncryptedString())
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Profile data from OAuth provider
    email: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(512))
    profile_data: Mapped[dict[str, Any]] = mapped_column(JSONType, default=dict)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="oauth_accounts")

    def __repr__(self) -> str:
        """String representation of the OAuth account."""
        return f"<OAuthAccount(id={self.id}, provider={self.provider}, user_id={self.user_id})>"
