"""Mock email service for development without real SMTP connection."""

import logging
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, TemplateNotFound

from src.services.email.base import EmailService

logger = logging.getLogger(__name__)


class MockEmailService(EmailService):
    """Mock email service that logs emails instead of sending them.

    Useful for development and testing without a real SMTP server.
    """

    def __init__(self):
        """Initialize mock email service with Jinja2 template environment."""
        template_dir = Path(__file__).parent / "templates"
        self.env = Environment(loader=FileSystemLoader(template_dir), autoescape=True)

    async def send_email(
        self,
        to: str,
        subject: str,
        template: str,
        context: dict,
    ) -> bool:
        """Log an email instead of sending it.

        Args:
            to: Recipient email address
            subject: Email subject line
            template: Name of template file (without .html extension)
            context: Dictionary of template variables

        Returns:
            bool: Always returns True (simulated success)
        """
        try:
            # Render HTML template
            html_content = self._render_template(template, context)

            # Log the email
            logger.info(f"[MOCK EMAIL] To: {to} | Subject: {subject} | Template: {template}")
            logger.debug(f"[MOCK EMAIL BODY]\n{html_content}\n[END MOCK EMAIL]")

            return True

        except TemplateNotFound:
            logger.error(f"Email template '{template}.html' not found")
            return False
        except Exception as e:
            logger.error(f"Failed to log email to {to}: {str(e)}")
            return False

    def _render_template(self, template: str, context: dict) -> str:
        """Render a Jinja2 template with the given context.

        Args:
            template: Template name (without .html extension)
            context: Dictionary of variables for template rendering

        Returns:
            str: Rendered HTML content

        Raises:
            TemplateNotFound: If template file doesn't exist
        """
        template_obj = self.env.get_template(f"{template}.html")
        return template_obj.render(**context)
