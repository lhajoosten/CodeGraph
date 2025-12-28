"""Webhook models for event-driven notifications.

This module defines models for storing webhook configurations and tracking
webhook delivery history for agent workflow events.
"""

import enum
import secrets
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.user import User


class WebhookEvent(str, enum.Enum):
    """Events that can trigger webhook notifications."""

    # Task lifecycle events
    TASK_CREATED = "task.created"
    TASK_STARTED = "task.started"
    TASK_COMPLETED = "task.completed"
    TASK_FAILED = "task.failed"
    TASK_CANCELLED = "task.cancelled"

    # Agent run events
    AGENT_STARTED = "agent.started"
    AGENT_COMPLETED = "agent.completed"
    AGENT_FAILED = "agent.failed"

    # Workflow events
    PLANNING_COMPLETED = "workflow.planning_completed"
    CODING_COMPLETED = "workflow.coding_completed"
    TESTING_COMPLETED = "workflow.testing_completed"
    REVIEW_COMPLETED = "workflow.review_completed"
    REVIEW_APPROVED = "workflow.review_approved"
    REVIEW_REJECTED = "workflow.review_rejected"
    REVIEW_REVISION_REQUESTED = "workflow.review_revision_requested"

    # Iteration events
    ITERATION_STARTED = "workflow.iteration_started"
    MAX_ITERATIONS_REACHED = "workflow.max_iterations_reached"


class WebhookStatus(str, enum.Enum):
    """Status of a webhook configuration."""

    ACTIVE = "active"
    PAUSED = "paused"
    DISABLED = "disabled"


class DeliveryStatus(str, enum.Enum):
    """Status of a webhook delivery attempt."""

    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"


class Webhook(Base, TimestampMixin):
    """Webhook configuration model.

    Stores webhook endpoints and their configuration for receiving
    notifications about agent workflow events.

    Attributes:
        id: Primary key
        name: Human-readable name for the webhook
        url: Target URL for webhook delivery
        secret: Secret key for signing webhook payloads (HMAC-SHA256)
        events: List of events to subscribe to
        status: Current status (active, paused, disabled)
        headers: Custom headers to include in requests
        retry_count: Maximum number of retry attempts
        timeout_seconds: Request timeout in seconds
        user_id: Owner of the webhook
    """

    __tablename__ = "webhooks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    secret: Mapped[str] = mapped_column(String(64), nullable=False)
    events: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[WebhookStatus] = mapped_column(
        Enum(WebhookStatus), default=WebhookStatus.ACTIVE, nullable=False, index=True
    )

    # Request configuration
    headers: Mapped[dict[str, str] | None] = mapped_column(JSON, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=30, nullable=False)

    # Statistics
    success_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failure_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_triggered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_failure_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Foreign keys
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="webhooks")
    deliveries: Mapped[list["WebhookDelivery"]] = relationship(
        "WebhookDelivery", back_populates="webhook", cascade="all, delete-orphan"
    )

    @classmethod
    def generate_secret(cls) -> str:
        """Generate a secure random secret for webhook signing."""
        return secrets.token_hex(32)

    def is_subscribed_to(self, event: WebhookEvent | str) -> bool:
        """Check if webhook is subscribed to an event."""
        event_value = event.value if isinstance(event, WebhookEvent) else event
        return event_value in self.events or "*" in self.events

    def __repr__(self) -> str:
        """String representation of the webhook."""
        return f"<Webhook(id={self.id}, name={self.name}, status={self.status})>"


class WebhookDelivery(Base, TimestampMixin):
    """Webhook delivery record.

    Tracks individual webhook delivery attempts including request/response
    details and retry history.

    Attributes:
        id: Primary key
        webhook_id: Associated webhook configuration
        event_type: Type of event that triggered this delivery
        payload: JSON payload sent to the webhook
        status: Delivery status (pending, success, failed, retrying)
        attempt_count: Number of delivery attempts made
        response_status: HTTP response status code
        response_body: Response body (truncated)
        error_message: Error message if delivery failed
        delivered_at: Timestamp of successful delivery
        next_retry_at: Timestamp for next retry attempt
    """

    __tablename__ = "webhook_deliveries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    event_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    status: Mapped[DeliveryStatus] = mapped_column(
        Enum(DeliveryStatus), default=DeliveryStatus.PENDING, nullable=False, index=True
    )
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Response tracking
    response_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_headers: Mapped[dict[str, str] | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Timing
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Foreign keys
    webhook_id: Mapped[int] = mapped_column(
        ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    webhook: Mapped["Webhook"] = relationship("Webhook", back_populates="deliveries")

    def __repr__(self) -> str:
        """String representation of the delivery."""
        return f"<WebhookDelivery(id={self.id}, event={self.event_type}, status={self.status})>"
