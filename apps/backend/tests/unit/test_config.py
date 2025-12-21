"""Tests for configuration module."""

import pytest
from src.core.config import settings


class TestSettings:
    """Test cases for application settings."""

    def test_settings_loaded(self) -> None:
        """Test that settings are loaded successfully."""
        assert settings is not None

    def test_app_name(self) -> None:
        """Test that app name is configured."""
        assert settings.app_name == "CodeGraph"

    def test_app_version(self) -> None:
        """Test that app version is configured."""
        assert settings.app_version is not None
        assert len(settings.app_version) > 0

    def test_database_url(self) -> None:
        """Test that database URL is configured."""
        assert settings.database_url is not None

    def test_environment(self) -> None:
        """Test that environment is set."""
        assert settings.environment in ["development", "staging", "production"]

    def test_secret_key_configured(self) -> None:
        """Test that secret key is configured."""
        assert settings.secret_key is not None
        assert len(settings.secret_key) > 0

    def test_jwt_settings(self) -> None:
        """Test that JWT settings are configured."""
        assert settings.algorithm == "HS256"
        assert settings.access_token_expire_minutes > 0
        assert settings.refresh_token_expire_days > 0

    def test_cors_settings(self) -> None:
        """Test that CORS settings are configured."""
        assert isinstance(settings.cors_origins, list)
        assert isinstance(settings.cors_allow_credentials, bool)
