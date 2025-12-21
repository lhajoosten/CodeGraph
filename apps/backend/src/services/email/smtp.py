"""SMTP-based email service implementation."""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
from jinja2 import Environment, FileSystemLoader, TemplateNotFound

from src.core.config import settings
from src.services.email.base import EmailService

logger = logging.getLogger(__name__)


class SMTPEmailService(EmailService):
    """SMTP-based email service using Jinja2 templates.

    Sends emails via SMTP with HTML templates rendered from Jinja2.
    """

    def __init__(self):
        """Initialize SMTP email service with Jinja2 template environment."""
        template_dir = Path(__file__).parent / "templates"
        self.env = Environment(loader=FileSystemLoader(template_dir), autoescape=True)
        logger.debug(
            f"SMTPEmailService initialized with host={settings.smtp_host}, "
            f"port={settings.smtp_port}, from={settings.smtp_from_email}"
        )

    async def send_email(
        self,
        to: str,
        subject: str,
        template: str,
        context: dict,
    ) -> bool:
        """Send an email using SMTP.

        Args:
            to: Recipient email address
            subject: Email subject line
            template: Name of template file (without .html extension)
            context: Dictionary of template variables

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        logger.debug(f"Preparing email to={to}, subject={subject}, template={template}")

        try:
            # Render HTML template
            html_content = self._render_template(template, context)
            logger.debug(f"Template '{template}' rendered successfully")

            # Create email message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
            message["To"] = to

            # Attach HTML part
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            # Determine TLS mode based on port
            # Port 587: Use STARTTLS (start_tls=True)
            # Port 465: Use implicit TLS (use_tls=True)
            use_implicit_tls = settings.smtp_port == 465
            use_starttls = settings.smtp_port == 587 and settings.smtp_use_tls

            logger.debug(
                f"Connecting to SMTP server {settings.smtp_host}:{settings.smtp_port} "
                f"(implicit_tls={use_implicit_tls}, starttls={use_starttls})"
            )

            # Send via SMTP
            async with aiosmtplib.SMTP(
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                use_tls=use_implicit_tls,
                start_tls=use_starttls,
            ) as smtp:
                logger.debug(f"SMTP connection established, logging in as {settings.smtp_username}")
                await smtp.login(settings.smtp_username, settings.smtp_password)
                logger.debug("SMTP login successful, sending message")
                await smtp.send_message(message)

            logger.info(f"Email sent successfully: to={to}, subject={subject}")
            return True

        except TemplateNotFound:
            logger.error(f"Email template not found: template={template}.html")
            return False
        except aiosmtplib.SMTPAuthenticationError as e:
            logger.error(
                f"SMTP authentication failed: username={settings.smtp_username}, error={e}"
            )
            return False
        except aiosmtplib.SMTPConnectError as e:
            logger.error(
                f"SMTP connection failed: host={settings.smtp_host}, "
                f"port={settings.smtp_port}, error={e}"
            )
            return False
        except Exception as e:
            logger.error(
                f"Failed to send email: to={to}, subject={subject}, "
                f"error_type={type(e).__name__}, error={e}"
            )
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
