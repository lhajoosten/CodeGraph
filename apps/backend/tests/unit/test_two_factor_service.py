"""Unit tests for the two-factor authentication service."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_password_hash
from src.models.backup_code import BackupCode
from src.models.user import User
from src.services.two_factor_service import TwoFactorService


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user for 2FA tests."""
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


class TestTwoFactorService:
    """Tests for TwoFactorService."""

    def test_generate_secret(self, db_session: AsyncSession) -> None:
        """Test TOTP secret generation."""
        service = TwoFactorService(db_session)
        secret = service.generate_secret()

        assert secret is not None
        assert len(secret) == 32  # Base32 encoded, 32 characters
        assert secret.isalnum()  # Should be alphanumeric

    def test_generate_qr_code(self, db_session: AsyncSession) -> None:
        """Test QR code generation."""
        service = TwoFactorService(db_session)
        secret = service.generate_secret()
        qr_code = service.generate_qr_code("test@example.com", secret)

        assert qr_code.startswith("data:image/png;base64,")
        assert len(qr_code) > 100  # Should contain base64 image data

    def test_verify_totp_valid(self, db_session: AsyncSession) -> None:
        """Test TOTP verification with valid code."""
        import pyotp

        service = TwoFactorService(db_session)
        secret = service.generate_secret()

        # Generate a valid code
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        assert service.verify_totp(secret, valid_code) is True

    def test_verify_totp_invalid(self, db_session: AsyncSession) -> None:
        """Test TOTP verification with invalid code."""
        service = TwoFactorService(db_session)
        secret = service.generate_secret()

        # Use an obviously invalid code
        assert service.verify_totp(secret, "000000") is False
        assert service.verify_totp(secret, "999999") is False
        assert service.verify_totp(secret, "abcdef") is False

    def test_generate_backup_codes(self, db_session: AsyncSession) -> None:
        """Test backup code generation."""
        service = TwoFactorService(db_session)
        codes = service.generate_backup_codes(10)

        assert len(codes) == 10
        # All codes should be unique
        assert len(set(codes)) == 10
        # All codes should be 8 characters (uppercase hex)
        for code in codes:
            assert len(code) == 8
            assert code.isalnum()

    def test_hash_and_verify_backup_code(self, db_session: AsyncSession) -> None:
        """Test backup code hashing and verification."""
        service = TwoFactorService(db_session)
        code = "ABCD1234"
        hashed = service.hash_backup_code(code)

        assert hashed != code  # Should be hashed
        assert service.verify_backup_code(code, hashed) is True
        assert service.verify_backup_code("wrong", hashed) is False

    @pytest.mark.asyncio
    async def test_setup_2fa(self, db_session: AsyncSession, test_user: User) -> None:
        """Test 2FA setup process."""
        service = TwoFactorService(db_session)

        secret, qr_code = await service.setup_2fa(test_user)

        assert secret is not None
        assert len(secret) == 32
        assert qr_code.startswith("data:image/png;base64,")

        # Check that secret is stored in user
        await db_session.refresh(test_user)
        assert test_user.two_factor_secret == secret
        assert test_user.two_factor_enabled is False

    @pytest.mark.asyncio
    async def test_enable_2fa_success(self, db_session: AsyncSession, test_user: User) -> None:
        """Test successfully enabling 2FA."""
        import pyotp

        service = TwoFactorService(db_session)

        # Setup first
        secret, _ = await service.setup_2fa(test_user)

        # Get valid code
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        # Enable with valid code
        backup_codes = await service.enable_2fa(test_user, valid_code)

        assert len(backup_codes) == 10
        await db_session.refresh(test_user)
        assert test_user.two_factor_enabled is True

    @pytest.mark.asyncio
    async def test_enable_2fa_invalid_code(self, db_session: AsyncSession, test_user: User) -> None:
        """Test enabling 2FA with invalid code."""
        service = TwoFactorService(db_session)

        # Setup first
        await service.setup_2fa(test_user)

        # Try to enable with invalid code
        with pytest.raises(ValueError, match="Invalid verification code"):
            await service.enable_2fa(test_user, "000000")

    @pytest.mark.asyncio
    async def test_enable_2fa_without_setup(
        self, db_session: AsyncSession, test_user: User
    ) -> None:
        """Test enabling 2FA without setup."""
        service = TwoFactorService(db_session)

        with pytest.raises(ValueError, match="2FA has not been set up"):
            await service.enable_2fa(test_user, "123456")

    @pytest.mark.asyncio
    async def test_disable_2fa(self, db_session: AsyncSession, test_user: User) -> None:
        """Test disabling 2FA."""
        import pyotp

        service = TwoFactorService(db_session)

        # Setup and enable first
        secret, _ = await service.setup_2fa(test_user)
        totp = pyotp.TOTP(secret)
        await service.enable_2fa(test_user, totp.now())

        # Disable
        await service.disable_2fa(test_user)

        await db_session.refresh(test_user)
        assert test_user.two_factor_enabled is False
        assert test_user.two_factor_secret is None

    @pytest.mark.asyncio
    async def test_verify_2fa_with_totp(self, db_session: AsyncSession, test_user: User) -> None:
        """Test 2FA verification with TOTP code."""
        import pyotp

        service = TwoFactorService(db_session)

        # Setup and enable
        secret, _ = await service.setup_2fa(test_user)
        totp = pyotp.TOTP(secret)
        await service.enable_2fa(test_user, totp.now())

        # Verify with fresh TOTP code
        new_code = totp.now()
        assert await service.verify_2fa(test_user, new_code) is True

    @pytest.mark.asyncio
    async def test_verify_2fa_with_backup_code(
        self, db_session: AsyncSession, test_user: User
    ) -> None:
        """Test 2FA verification with backup code."""
        import pyotp

        service = TwoFactorService(db_session)

        # Setup and enable
        secret, _ = await service.setup_2fa(test_user)
        totp = pyotp.TOTP(secret)
        backup_codes = await service.enable_2fa(test_user, totp.now())

        # Verify with backup code
        backup_code = backup_codes[0]
        assert await service.verify_2fa(test_user, backup_code) is True

        # Same backup code should not work twice
        assert await service.verify_2fa(test_user, backup_code) is False

    @pytest.mark.asyncio
    async def test_verify_2fa_when_not_enabled(
        self, db_session: AsyncSession, test_user: User
    ) -> None:
        """Test 2FA verification when not enabled (should pass)."""
        service = TwoFactorService(db_session)

        # 2FA not enabled, any code should pass
        assert await service.verify_2fa(test_user, "any") is True

    @pytest.mark.asyncio
    async def test_regenerate_backup_codes(self, db_session: AsyncSession, test_user: User) -> None:
        """Test regenerating backup codes."""
        import pyotp

        service = TwoFactorService(db_session)

        # Setup and enable
        secret, _ = await service.setup_2fa(test_user)
        totp = pyotp.TOTP(secret)
        old_codes = await service.enable_2fa(test_user, totp.now())

        # Regenerate
        new_codes = await service.regenerate_backup_codes(test_user)

        assert len(new_codes) == 10
        # Old codes should not match new codes
        assert set(old_codes) != set(new_codes)

    @pytest.mark.asyncio
    async def test_regenerate_backup_codes_when_not_enabled(
        self, db_session: AsyncSession, test_user: User
    ) -> None:
        """Test regenerating backup codes when 2FA not enabled."""
        service = TwoFactorService(db_session)

        with pytest.raises(ValueError, match="2FA is not enabled"):
            await service.regenerate_backup_codes(test_user)

    @pytest.mark.asyncio
    async def test_get_backup_codes_remaining(
        self, db_session: AsyncSession, test_user: User
    ) -> None:
        """Test counting remaining backup codes."""
        import pyotp

        service = TwoFactorService(db_session)

        # Setup and enable
        secret, _ = await service.setup_2fa(test_user)
        totp = pyotp.TOTP(secret)
        backup_codes = await service.enable_2fa(test_user, totp.now())

        # All codes should be remaining
        remaining = await service.get_backup_codes_remaining(test_user.id)
        assert remaining == 10

        # Use one code
        await service.verify_2fa(test_user, backup_codes[0])
        remaining = await service.get_backup_codes_remaining(test_user.id)
        assert remaining == 9
