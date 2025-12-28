"""Pydantic schemas for webhook-related operations."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, HttpUrl, field_validator

from src.models.webhook import DeliveryStatus, WebhookEvent, WebhookStatus


class WebhookBase(BaseModel):
    """Base webhook schema with common fields."""

    name: str = Field(..., min_length=1, max_length=255, description="Human-readable webhook name")
    url: HttpUrl = Field(..., description="Target URL for webhook delivery")
    events: list[str] = Field(
        ...,
        min_length=1,
        description="List of events to subscribe to (use '*' for all events)",
    )

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: list[str]) -> list[str]:
        """Validate that events are valid WebhookEvent values or '*'."""
        valid_events = {e.value for e in WebhookEvent}
        valid_events.add("*")  # Allow wildcard
        for event in v:
            if event not in valid_events:
                raise ValueError(
                    f"Invalid event: {event}. Valid events are: {sorted(valid_events)}"
                )
        return v


class WebhookCreate(WebhookBase):
    """Schema for creating a new webhook."""

    headers: dict[str, str] | None = Field(
        None, description="Custom headers to include in webhook requests"
    )
    retry_count: int = Field(3, ge=0, le=10, description="Maximum retry attempts")
    timeout_seconds: int = Field(30, ge=5, le=120, description="Request timeout in seconds")


class WebhookUpdate(BaseModel):
    """Schema for updating a webhook."""

    name: str | None = Field(None, min_length=1, max_length=255)
    url: HttpUrl | None = None
    events: list[str] | None = Field(None, min_length=1)
    status: WebhookStatus | None = None
    headers: dict[str, str] | None = None
    retry_count: int | None = Field(None, ge=0, le=10)
    timeout_seconds: int | None = Field(None, ge=5, le=120)

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: list[str] | None) -> list[str] | None:
        """Validate events if provided."""
        if v is None:
            return v
        valid_events = {e.value for e in WebhookEvent}
        valid_events.add("*")
        for event in v:
            if event not in valid_events:
                raise ValueError(f"Invalid event: {event}")
        return v


class WebhookResponse(BaseModel):
    """Schema for webhook responses."""

    id: int
    name: str
    url: str
    events: list[str]
    status: WebhookStatus
    headers: dict[str, str] | None
    retry_count: int
    timeout_seconds: int
    success_count: int
    failure_count: int
    last_triggered_at: datetime | None
    last_success_at: datetime | None
    last_failure_at: datetime | None
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WebhookWithSecretResponse(WebhookResponse):
    """Schema for webhook response including the secret (only on create)."""

    secret: str


class WebhookListResponse(BaseModel):
    """Schema for paginated webhook list responses."""

    items: list[WebhookResponse]
    total: int
    page: int
    page_size: int


class WebhookDeliveryResponse(BaseModel):
    """Schema for webhook delivery responses."""

    id: int
    webhook_id: int
    event_type: str
    event_id: str
    status: DeliveryStatus
    attempt_count: int
    response_status: int | None
    response_body: str | None
    error_message: str | None
    delivered_at: datetime | None
    next_retry_at: datetime | None
    duration_ms: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookDeliveryListResponse(BaseModel):
    """Schema for paginated delivery list responses."""

    items: list[WebhookDeliveryResponse]
    total: int
    page: int
    page_size: int


class WebhookTestRequest(BaseModel):
    """Schema for testing a webhook."""

    event_type: str = Field(
        default="task.completed",
        description="Event type to simulate for the test",
    )

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        """Validate that event type is valid."""
        valid_events = {e.value for e in WebhookEvent}
        if v not in valid_events:
            raise ValueError(f"Invalid event type: {v}")
        return v


class WebhookTestResponse(BaseModel):
    """Schema for webhook test results."""

    success: bool
    status_code: int | None
    response_body: str | None
    error_message: str | None
    duration_ms: int


class WebhookEventPayload(BaseModel):
    """Schema for webhook event payloads sent to endpoints."""

    event_id: str = Field(..., description="Unique identifier for this event")
    event_type: str = Field(..., description="Type of event (e.g., task.completed)")
    timestamp: datetime = Field(..., description="When the event occurred")
    data: dict[str, Any] = Field(..., description="Event-specific data")

    # Optional context
    task_id: int | None = Field(None, description="Associated task ID if applicable")
    agent_run_id: int | None = Field(None, description="Associated agent run ID if applicable")
    user_id: int | None = Field(None, description="User ID who owns the resource")


class WebhookEventData(BaseModel):
    """Base schema for event-specific data."""

    pass


class TaskEventData(WebhookEventData):
    """Data payload for task-related events."""

    task_id: int
    title: str
    status: str
    description: str | None = None
    error_message: str | None = None


class AgentEventData(WebhookEventData):
    """Data payload for agent-related events."""

    agent_run_id: int
    agent_type: str
    status: str
    task_id: int
    iteration: int | None = None
    tokens_used: int | None = None
    duration_ms: int | None = None
    error_message: str | None = None


class WorkflowEventData(WebhookEventData):
    """Data payload for workflow-related events."""

    task_id: int
    stage: str
    iteration: int
    verdict: str | None = None
    coverage_percentage: float | None = None
    quality_score: float | None = None
    recommendations: list[str] | None = None
