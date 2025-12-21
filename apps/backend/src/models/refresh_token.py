"""Refresh token model for token rotation and tracking."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.user import User


class RefreshToken(Base, TimestampMixin):
    """Refresh token model for tracking issued refresh tokens.

    Attributes:
        id (int): Primary key.
        user_id (int): Foreign key to the user.
        token_hash (str): Hashed refresh token.
        expires_at (datetime): Expiration datetime of the token.
        revoked (bool): Indicates if the token has been revoked.
        revoked_at (datetime | None): Datetime when the token was revoked.
        ip_address (str | None): IP address from which the token was issued.
        user_agent (str | None): User agent string of the client.

    Relationships:
        user (User): The user associated with the refresh token.
    """

    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(Text)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
