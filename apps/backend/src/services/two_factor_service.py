"""Two-factor authentication service for TOTP and backup codes."""

import base64
import io
import secrets
from datetime import UTC, datetime

import bcrypt
import pyotp
import qrcode
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.logging import get_logger
from src.models.backup_code import BackupCode
from src.models.user import User

logger = get_logger(__name__)

# BCrypt work factor for backup codes (slightly lower than passwords for faster verification)
BACKUP_CODE_BCRYPT_ROUNDS = 10


class TwoFactorService:
    """Service for handling two-factor authentication operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the two-factor service.

        Args:
            db: Async database session.
        """
        self.db = db

    def generate_secret(self) -> str:
        """Generate a random base32 secret for TOTP.

        Returns:
            A random base32 encoded string.
        """
        return pyotp.random_base32()

    def generate_qr_code(self, user_email: str, secret: str) -> str:
        """Generate a QR code for the TOTP setup.

        Args:
            user_email: The user's email address.
            secret: The TOTP secret key.

        Returns:
            Base64 encoded PNG image of the QR code as a data URL.
        """
        totp = pyotp.TOTP(secret)
        issuer_name = settings.app_name
        provisioning_uri = totp.provisioning_uri(user_email, issuer_name=issuer_name)

        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)

        # Create image
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, "PNG")
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()

        return f"data:image/png;base64,{img_base64}"

    def verify_totp(self, secret: str, code: str) -> bool:
        """Verify a TOTP code.

        Args:
            secret: The user's TOTP secret.
            code: The 6-digit code to verify.

        Returns:
            True if the code is valid, False otherwise.
        """
        try:
            totp = pyotp.TOTP(secret)
            # Allow a window of 1 (30 seconds before and after)
            return totp.verify(code, valid_window=1)
        except Exception as e:
            logger.warning("totp_verification_failed", error=str(e))
            return False

    def generate_backup_codes(self, count: int = 10) -> list[str]:
        """Generate a list of backup codes.

        Args:
            count: Number of backup codes to generate.

        Returns:
            List of plaintext backup codes (to show to the user once).
        """
        codes = []
        for _ in range(count):
            # Generate 8 character alphanumeric codes
            code = secrets.token_hex(4).upper()
            codes.append(code)
        return codes

    def hash_backup_code(self, code: str) -> str:
        """Hash a backup code for secure storage.

        Args:
            code: The plaintext backup code.

        Returns:
            The hashed backup code.
        """
        salt = bcrypt.gensalt(rounds=BACKUP_CODE_BCRYPT_ROUNDS)
        hashed = bcrypt.hashpw(code.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    def verify_backup_code(self, code: str, hashed: str) -> bool:
        """Verify a backup code against its hash.

        Args:
            code: The plaintext backup code to verify.
            hashed: The stored hash.

        Returns:
            True if the code matches, False otherwise.
        """
        try:
            return bcrypt.checkpw(code.encode("utf-8"), hashed.encode("utf-8"))
        except (ValueError, TypeError):
            return False

    async def setup_2fa(self, user: User) -> tuple[str, str]:
        """Start the 2FA setup process for a user.

        Args:
            user: The user setting up 2FA.

        Returns:
            Tuple of (secret, qr_code_data_url).
        """
        secret = self.generate_secret()
        qr_code = self.generate_qr_code(user.email, secret)

        # Store the secret temporarily (not enabled yet)
        user.two_factor_secret = secret
        await self.db.commit()

        logger.info("two_factor_setup_started", user_id=user.id)
        return secret, qr_code

    async def enable_2fa(self, user: User, code: str) -> list[str]:
        """Enable 2FA for a user after verifying their TOTP code.

        Args:
            user: The user enabling 2FA.
            code: The TOTP code to verify.

        Returns:
            List of backup codes for the user to save.

        Raises:
            ValueError: If the code is invalid or 2FA is not set up.
        """
        if not user.two_factor_secret:
            raise ValueError("2FA has not been set up. Please run setup first.")

        if not self.verify_totp(user.two_factor_secret, code):
            raise ValueError("Invalid verification code.")

        # Generate and store backup codes
        plaintext_codes = self.generate_backup_codes(10)
        await self._store_backup_codes(user.id, plaintext_codes)

        # Enable 2FA
        user.two_factor_enabled = True
        await self.db.commit()

        logger.info("two_factor_enabled", user_id=user.id)
        return plaintext_codes

    async def disable_2fa(self, user: User) -> None:
        """Disable 2FA for a user.

        Args:
            user: The user disabling 2FA.
        """
        # Remove backup codes
        await self.db.execute(delete(BackupCode).where(BackupCode.user_id == user.id))

        # Disable 2FA
        user.two_factor_enabled = False
        user.two_factor_secret = None
        await self.db.commit()

        logger.info("two_factor_disabled", user_id=user.id)

    async def verify_2fa(self, user: User, code: str) -> bool:
        """Verify a 2FA code (TOTP or backup code).

        Args:
            user: The user to verify.
            code: The TOTP or backup code.

        Returns:
            True if the code is valid, False otherwise.
        """
        if not user.two_factor_enabled or not user.two_factor_secret:
            return True  # 2FA not enabled

        # Try TOTP first
        if self.verify_totp(user.two_factor_secret, code):
            logger.info("two_factor_verified_totp", user_id=user.id)
            return True

        # Try backup codes
        if await self._verify_and_use_backup_code(user.id, code):
            logger.info("two_factor_verified_backup_code", user_id=user.id)
            return True

        logger.warning("two_factor_verification_failed", user_id=user.id)
        return False

    async def regenerate_backup_codes(self, user: User) -> list[str]:
        """Regenerate backup codes for a user.

        Args:
            user: The user to regenerate codes for.

        Returns:
            List of new backup codes.
        """
        if not user.two_factor_enabled:
            raise ValueError("2FA is not enabled.")

        # Delete existing backup codes
        await self.db.execute(delete(BackupCode).where(BackupCode.user_id == user.id))

        # Generate and store new backup codes
        plaintext_codes = self.generate_backup_codes(10)
        await self._store_backup_codes(user.id, plaintext_codes)

        logger.info("backup_codes_regenerated", user_id=user.id)
        return plaintext_codes

    async def get_backup_codes_remaining(self, user_id: int) -> int:
        """Get the count of remaining (unused) backup codes.

        Args:
            user_id: The user's ID.

        Returns:
            Number of remaining backup codes.
        """
        result = await self.db.execute(
            select(BackupCode).where(BackupCode.user_id == user_id, BackupCode.used.is_(False))
        )
        return len(result.scalars().all())

    async def _store_backup_codes(self, user_id: int, codes: list[str]) -> None:
        """Store hashed backup codes for a user.

        Args:
            user_id: The user's ID.
            codes: List of plaintext backup codes.
        """
        for code in codes:
            backup_code = BackupCode(
                user_id=user_id,
                code_hash=self.hash_backup_code(code),
                used=False,
            )
            self.db.add(backup_code)
        await self.db.commit()

    async def _verify_and_use_backup_code(self, user_id: int, code: str) -> bool:
        """Verify and mark a backup code as used.

        Args:
            user_id: The user's ID.
            code: The backup code to verify.

        Returns:
            True if a valid code was found and used, False otherwise.
        """
        # Normalize the code (uppercase, remove any hyphens)
        normalized_code = code.upper().replace("-", "")

        result = await self.db.execute(
            select(BackupCode).where(BackupCode.user_id == user_id, BackupCode.used.is_(False))
        )
        backup_codes = result.scalars().all()

        for backup_code in backup_codes:
            if self.verify_backup_code(normalized_code, backup_code.code_hash):
                backup_code.used = True
                backup_code.used_at = datetime.now(UTC)
                await self.db.commit()
                return True

        return False
