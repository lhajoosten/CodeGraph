"""Backup code model for two-factor authentication recovery."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.user import User


class BackupCode(Base, TimestampMixin):
    """Backup code model for 2FA recovery.

    Backup codes allow users to regain access to their account if they lose
    their authenticator device.

    Attributes:
        id (int): Primary key.
        user_id (int): Foreign key to the user who owns this backup code.
        code_hash (str): Hashed backup code for secure storage.
        used (bool): Whether this code has been used.
        used_at (datetime | None): Timestamp when the code was used.

    Relationships:
        user (User): The user who owns this backup code.
    """

    __tablename__ = "backup_codes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    used: Mapped[bool] = mapped_column(default=False, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="backup_codes")

    def __repr__(self) -> str:
        """String representation of the backup code."""
        return f"<BackupCode(id={self.id}, user_id={self.user_id}, used={self.used})>"
