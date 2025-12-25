"""Abstract base class for email services."""

from abc import ABC, abstractmethod
from typing import Any


class EmailService(ABC):
    """Abstract email service interface.

    All email service implementations should inherit from this class
    and implement the send_email method.
    """

    @abstractmethod
    async def send_email(
        self,
        to: str,
        subject: str,
        template: str,
        context: dict[str, Any],
    ) -> bool:
        """Send an email using the specified template.

        Args:
            to: Recipient email address
            subject: Email subject line
            template: Name of template file (without extension)
            context: Dictionary of template variables

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        pass
