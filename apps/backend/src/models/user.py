"""User model for authentication and authorization."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.backup_code import BackupCode
    from src.models.oauth_account import OAuthAccount
    from src.models.refresh_token import RefreshToken
    from src.models.repository import Repository
    from src.models.task import Task
    from src.models.user_session import UserSession


class User(Base, TimestampMixin):
    """User model representing registered users in the system.

    Attributes:
        id (int): Primary key.
        email (str): Unique email address of the user.
        hashed_password (str): Hashed password for authentication.
        is_active (bool): Indicates if the user account is active.
        is_superuser (bool): Indicates if the user has superuser privileges.
        email_verified (bool): Indicates if the user's email has been verified.
        email_verification_sent_at (datetime | None): Timestamp of last verification email sent.
        last_login_at (datetime | None): Timestamp of the last successful login.
        last_login_ip (str | None): IP address of the last successful login.
        failed_login_attempts (int): Count of consecutive failed login attempts.
        locked_until (datetime | None): Timestamp until which the account is locked due to failed logins.
        first_name (str | None): First name of the user.
        last_name (str | None): Last name of the user.
        display_name (str | None): Full or preferred name of the user.
        avatar_url (str | None): URL to user's profile picture.
        profile_completed (bool): Flag indicating if user profile is complete.

    Relationships:
        tasks (list[Task]): List of tasks created by the user.
        repositories (list[Repository]): List of repositories owned by the user.
        refresh_tokens (list[RefreshToken]): List of refresh tokens issued to the user.
        sessions (list[UserSession]): List of active sessions for the user.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Email verification fields
    email_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    email_verification_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Login tracking fields
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_ip: Mapped[str | None] = mapped_column(String(45))
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Two-factor authentication fields
    two_factor_enabled: Mapped[bool] = mapped_column(default=False, nullable=False)
    two_factor_secret: Mapped[str | None] = mapped_column(String(32))

    # Profile fields
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    display_name: Mapped[str | None] = mapped_column(String(200))
    avatar_url: Mapped[str | None] = mapped_column(String(512))
    profile_completed: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Relationships
    tasks: Mapped[list["Task"]] = relationship(
        "Task", back_populates="user", cascade="all, delete-orphan"
    )
    repositories: Mapped[list["Repository"]] = relationship(
        "Repository", back_populates="user", cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["UserSession"]] = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan"
    )
    backup_codes: Mapped[list["BackupCode"]] = relationship(
        "BackupCode", back_populates="user", cascade="all, delete-orphan"
    )
    oauth_accounts: Mapped[list["OAuthAccount"]] = relationship(
        "OAuthAccount", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation of the user."""
        return f"<User(id={self.id}, email={self.email})>"
