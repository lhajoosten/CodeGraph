"""Unit tests for SMTP email service."""

from unittest.mock import AsyncMock, patch

import pytest

from src.services.email.smtp import SMTPEmailService


class TestSMTPEmailService:
    """Tests for SMTPEmailService."""

    def test_smtp_service_initialization(self):
        """Test SMTP service initializes with Jinja2 environment."""
        service = SMTPEmailService()

        assert service.env is not None
        assert service.env.autoescape is True

    def test_render_template_verification(self):
        """Test rendering verification template."""
        service = SMTPEmailService()

        context = {
            "user_email": "test@example.com",
            "verification_link": "http://example.com/verify?token=abc123",
        }

        html = service._render_template("verification", context)

        assert "test@example.com" in html
        assert "http://example.com/verify?token=abc123" in html
        assert "Verify Your Email" in html

    def test_render_template_password_reset(self):
        """Test rendering password reset template."""
        service = SMTPEmailService()

        context = {
            "reset_link": "http://example.com/reset?token=xyz789",
        }

        html = service._render_template("password_reset", context)

        assert "http://example.com/reset?token=xyz789" in html
        assert "Password Reset" in html or "Reset" in html

    def test_render_template_welcome(self):
        """Test rendering welcome template."""
        service = SMTPEmailService()

        context = {
            "user_email": "test@example.com",
            "dashboard_link": "http://example.com/dashboard",
        }

        html = service._render_template("welcome", context)

        assert "test@example.com" in html
        assert "http://example.com/dashboard" in html

    def test_render_template_otp(self):
        """Test rendering OTP template."""
        service = SMTPEmailService()

        context = {
            "otp_code": "123456",
        }

        html = service._render_template("otp", context)

        assert "123456" in html

    def test_render_template_email_change(self):
        """Test rendering email change template."""
        service = SMTPEmailService()

        context = {
            "new_email": "newemail@example.com",
            "confirmation_link": "http://example.com/confirm?token=abc123",
        }

        html = service._render_template("email_change", context)

        assert "newemail@example.com" in html
        assert "http://example.com/confirm?token=abc123" in html

    def test_render_template_not_found(self):
        """Test rendering non-existent template raises error."""
        from jinja2 import TemplateNotFound

        service = SMTPEmailService()

        with pytest.raises(TemplateNotFound):
            service._render_template("nonexistent", {})

    @pytest.mark.asyncio
    async def test_send_email_success(self):
        """Test sending email successfully."""
        with patch("src.services.email.smtp.aiosmtplib.SMTP") as mock_smtp:
            mock_smtp_instance = AsyncMock()
            mock_smtp.return_value.__aenter__.return_value = mock_smtp_instance

            service = SMTPEmailService()
            result = await service.send_email(
                to="test@example.com",
                subject="Test Email",
                template="verification",
                context={
                    "user_email": "test@example.com",
                    "verification_link": "http://example.com/verify?token=abc",
                },
            )

            assert result is True
            mock_smtp_instance.login.assert_called_once()
            mock_smtp_instance.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_email_template_not_found(self):
        """Test sending email with non-existent template returns False."""
        service = SMTPEmailService()
        result = await service.send_email(
            to="test@example.com",
            subject="Test Email",
            template="nonexistent_template",
            context={},
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_send_email_smtp_error(self):
        """Test sending email with SMTP error returns False."""
        with patch("src.services.email.smtp.aiosmtplib.SMTP") as mock_smtp:
            mock_smtp.return_value.__aenter__.side_effect = Exception("SMTP Error")

            service = SMTPEmailService()
            result = await service.send_email(
                to="test@example.com",
                subject="Test Email",
                template="verification",
                context={
                    "user_email": "test@example.com",
                    "verification_link": "http://example.com/verify?token=abc",
                },
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_send_email_has_html_content(self):
        """Test that sent email contains HTML content."""
        with patch("src.services.email.smtp.aiosmtplib.SMTP") as mock_smtp:
            mock_smtp_instance = AsyncMock()
            mock_smtp.return_value.__aenter__.return_value = mock_smtp_instance

            service = SMTPEmailService()
            await service.send_email(
                to="test@example.com",
                subject="Test Email",
                template="verification",
                context={
                    "user_email": "test@example.com",
                    "verification_link": "http://example.com/verify?token=abc",
                },
            )

            # Get the message that was sent
            call_args = mock_smtp_instance.send_message.call_args
            message = call_args[0][0]

            # Check that message has HTML part
            assert message.is_multipart()
            assert "text/html" in str(message)

    @pytest.mark.asyncio
    async def test_send_email_message_headers(self):
        """Test that sent email has correct headers."""
        with patch("src.services.email.smtp.aiosmtplib.SMTP") as mock_smtp:
            mock_smtp_instance = AsyncMock()
            mock_smtp.return_value.__aenter__.return_value = mock_smtp_instance

            service = SMTPEmailService()
            await service.send_email(
                to="test@example.com",
                subject="Test Subject",
                template="verification",
                context={
                    "user_email": "test@example.com",
                    "verification_link": "http://example.com/verify?token=abc",
                },
            )

            # Get the message that was sent
            call_args = mock_smtp_instance.send_message.call_args
            message = call_args[0][0]

            assert message["To"] == "test@example.com"
            assert message["Subject"] == "Test Subject"
            assert "From" in message
