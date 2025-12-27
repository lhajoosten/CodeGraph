"""Encryption utilities for storing sensitive data securely.

Uses cryptography.fernet for symmetric encryption of sensitive fields
like OAuth tokens, API credentials, etc.
"""

import base64
from typing import Any

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from sqlalchemy import String, TypeDecorator

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class EncryptionManager:
    """Manages encryption and decryption of sensitive data."""

    def __init__(self, key: str | None = None):
        """Initialize encryption manager with a key.

        Args:
            key: Encryption key (base64 encoded). If None, uses settings.encryption_key.
                The key should be a base64-encoded 32-byte key or a secret string.
        """
        if key is None:
            key = settings.encryption_key

        if key is None:
            raise ValueError("Encryption key is required. Set ENCRYPTION_KEY environment variable.")

        # If key is not already a valid Fernet key (base64-encoded 32 bytes),
        # derive it from the secret using PBKDF2HMAC
        try:
            # Try to use the key directly if it's already a valid Fernet key
            self._cipher = Fernet(key.encode() if isinstance(key, str) else key)
        except Exception:
            # Derive a key from the secret string
            salt = b"codegraph_oauth"  # Static salt for consistent key derivation
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            derived_key = base64.urlsafe_b64encode(
                kdf.derive(key.encode() if isinstance(key, str) else key)
            )
            self._cipher = Fernet(derived_key)

    def encrypt(self, plaintext: str | None) -> str | None:
        """Encrypt a string.

        Args:
            plaintext: String to encrypt. None values pass through unchanged.

        Returns:
            Base64-encoded encrypted value, or None if input was None.
        """
        if plaintext is None:
            return None

        try:
            encrypted = self._cipher.encrypt(plaintext.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt(self, ciphertext: str | None) -> str | None:
        """Decrypt a string.

        Args:
            ciphertext: Base64-encoded encrypted value. None values pass through unchanged.

        Returns:
            Decrypted plaintext string, or None if input was None.
        """
        if ciphertext is None:
            return None

        try:
            decrypted = self._cipher.decrypt(ciphertext.encode())
            return decrypted.decode()
        except InvalidToken:
            logger.error("Decryption failed: invalid token (possible key mismatch)")
            raise
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise


# Global encryption manager instance
_encryption_manager: EncryptionManager | None = None


def get_encryption_manager() -> EncryptionManager:
    """Get or create the global encryption manager instance."""
    global _encryption_manager
    if _encryption_manager is None:
        _encryption_manager = EncryptionManager()
    return _encryption_manager


class EncryptedString(TypeDecorator[str]):
    """SQLAlchemy type for encrypted strings.

    Automatically encrypts values on write and decrypts on read.
    Transparent to the application code.

    Example:
        class OAuthAccount(Base):
            access_token: Mapped[str | None] = mapped_column(EncryptedString())
    """

    impl = String
    cache_ok = True

    def process_bind_param(self, value: str | None, dialect: Any) -> str | None:
        """Encrypt value before storing in database."""
        if value is None:
            return None
        return get_encryption_manager().encrypt(value)

    def process_result_value(self, value: str | None, dialect: Any) -> str | None:
        """Decrypt value when reading from database."""
        if value is None:
            return None
        try:
            return get_encryption_manager().decrypt(value)
        except InvalidToken:
            # Log but don't crash - return None for unreadable encrypted values
            logger.warning(
                "Failed to decrypt value - possible encryption key mismatch, returning None"
            )
            return None
