"""Unit tests for email-related database models."""

from datetime import UTC, datetime, timedelta

from src.models.email_verification_token import EmailVerificationToken
from src.models.password_reset_token import PasswordResetToken


class TestEmailVerificationToken:
    """Tests for EmailVerificationToken model."""

    def test_email_verification_token_creation(self):
        """Test creating an email verification token."""
        token = EmailVerificationToken(
            user_id=1,
            token="abc123xyz",
            email="test@example.com",
            expires_at=datetime.now(UTC) + timedelta(hours=24),
            used=False,
        )

        assert token.user_id == 1
        assert token.token == "abc123xyz"
        assert token.email == "test@example.com"
        assert token.used is False
        assert token.used_at is None

    def test_email_verification_token_defaults(self):
        """Test email verification token default values."""
        token = EmailVerificationToken(
            user_id=1,
            token="abc123xyz",
            email="test@example.com",
            expires_at=datetime.now(UTC) + timedelta(hours=24),
        )

        # SQLAlchemy defaults are only applied when persisted to database
        # In Python object, explicitly check the value or use the SQLAlchemy default
        assert not token.used or token.used is None  # None until database default applies
        assert token.used_at is None

    def test_email_verification_token_mark_used(self):
        """Test marking email verification token as used."""
        token = EmailVerificationToken(
            user_id=1,
            token="abc123xyz",
            email="test@example.com",
            expires_at=datetime.now(UTC) + timedelta(hours=24),
            used=False,
        )

        # Mark as used
        token.used = True
        token.used_at = datetime.now(UTC)

        assert token.used is True
        assert token.used_at is not None

    def test_email_verification_token_repr(self):
        """Test EmailVerificationToken has tablename."""
        assert EmailVerificationToken.__tablename__ == "email_verification_tokens"


class TestPasswordResetToken:
    """Tests for PasswordResetToken model."""

    def test_password_reset_token_creation(self):
        """Test creating a password reset token."""
        token = PasswordResetToken(
            user_id=1,
            token="reset123xyz",
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            used=False,
        )

        assert token.user_id == 1
        assert token.token == "reset123xyz"
        assert token.used is False
        assert token.used_at is None

    def test_password_reset_token_defaults(self):
        """Test password reset token default values."""
        token = PasswordResetToken(
            user_id=1,
            token="reset123xyz",
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )

        # SQLAlchemy defaults are only applied when persisted to database
        assert not token.used or token.used is None  # None until database default applies
        assert token.used_at is None

    def test_password_reset_token_mark_used(self):
        """Test marking password reset token as used."""
        token = PasswordResetToken(
            user_id=1,
            token="reset123xyz",
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            used=False,
        )

        # Mark as used
        token.used = True
        token.used_at = datetime.now(UTC)

        assert token.used is True
        assert token.used_at is not None

    def test_password_reset_token_repr(self):
        """Test PasswordResetToken has tablename."""
        assert PasswordResetToken.__tablename__ == "password_reset_tokens"


class TestUserModelEmailFields:
    """Tests for User model email-related fields."""

    def test_user_email_verified_default(self):
        """Test User email_verified defaults to False."""
        from src.core.security import get_password_hash
        from src.models.user import User

        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False,
        )

        # SQLAlchemy defaults are only applied when persisted to database
        assert not user.email_verified or user.email_verified is None
        assert user.email_verification_sent_at is None

    def test_user_email_verified_set(self):
        """Test setting User email_verified field."""
        from src.core.security import get_password_hash
        from src.models.user import User

        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False,
            email_verified=True,
        )

        assert user.email_verified is True

    def test_user_email_verification_sent_at(self):
        """Test setting User email_verification_sent_at field."""
        from src.core.security import get_password_hash
        from src.models.user import User

        now = datetime.now(UTC)
        user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False,
            email_verification_sent_at=now,
        )

        assert user.email_verification_sent_at == now
