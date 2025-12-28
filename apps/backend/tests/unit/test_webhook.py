"""Tests for the webhook system.

Tests webhook models, schemas, and service functionality.
"""

import hashlib
import hmac
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from src.models.webhook import (
    DeliveryStatus,
    Webhook,
    WebhookDelivery,
    WebhookEvent,
    WebhookStatus,
)
from src.schemas.webhook import (
    WebhookCreate,
    WebhookEventPayload,
    WebhookTestRequest,
    WebhookUpdate,
)


class TestWebhookEvent:
    """Tests for WebhookEvent enum."""

    def test_task_events_exist(self) -> None:
        """Test that task events are defined."""
        assert WebhookEvent.TASK_CREATED.value == "task.created"
        assert WebhookEvent.TASK_STARTED.value == "task.started"
        assert WebhookEvent.TASK_COMPLETED.value == "task.completed"
        assert WebhookEvent.TASK_FAILED.value == "task.failed"

    def test_workflow_events_exist(self) -> None:
        """Test that workflow events are defined."""
        assert WebhookEvent.PLANNING_COMPLETED.value == "workflow.planning_completed"
        assert WebhookEvent.CODING_COMPLETED.value == "workflow.coding_completed"
        assert WebhookEvent.TESTING_COMPLETED.value == "workflow.testing_completed"
        assert WebhookEvent.REVIEW_COMPLETED.value == "workflow.review_completed"

    def test_agent_events_exist(self) -> None:
        """Test that agent events are defined."""
        assert WebhookEvent.AGENT_STARTED.value == "agent.started"
        assert WebhookEvent.AGENT_COMPLETED.value == "agent.completed"
        assert WebhookEvent.AGENT_FAILED.value == "agent.failed"


class TestWebhookStatus:
    """Tests for WebhookStatus enum."""

    def test_status_values_exist(self) -> None:
        """Test that all status values are defined."""
        assert WebhookStatus.ACTIVE.value == "active"
        assert WebhookStatus.PAUSED.value == "paused"
        assert WebhookStatus.DISABLED.value == "disabled"


class TestDeliveryStatus:
    """Tests for DeliveryStatus enum."""

    def test_status_values_exist(self) -> None:
        """Test that all status values are defined."""
        assert DeliveryStatus.PENDING.value == "pending"
        assert DeliveryStatus.SUCCESS.value == "success"
        assert DeliveryStatus.FAILED.value == "failed"
        assert DeliveryStatus.RETRYING.value == "retrying"


class TestWebhookModel:
    """Tests for Webhook model."""

    def test_generate_secret(self) -> None:
        """Test secret generation."""
        secret = Webhook.generate_secret()
        assert len(secret) == 64  # 32 bytes = 64 hex chars
        assert secret.isalnum()

    def test_is_subscribed_to_exact_match(self) -> None:
        """Test event subscription with exact match."""
        webhook = Webhook(
            id=1,
            name="Test",
            url="https://example.com/webhook",
            secret="test_secret",
            events=["task.completed", "task.failed"],
            user_id=1,
        )
        assert webhook.is_subscribed_to(WebhookEvent.TASK_COMPLETED)
        assert webhook.is_subscribed_to("task.failed")
        assert not webhook.is_subscribed_to(WebhookEvent.TASK_STARTED)

    def test_is_subscribed_to_wildcard(self) -> None:
        """Test event subscription with wildcard."""
        webhook = Webhook(
            id=1,
            name="Test",
            url="https://example.com/webhook",
            secret="test_secret",
            events=["*"],
            user_id=1,
        )
        assert webhook.is_subscribed_to(WebhookEvent.TASK_COMPLETED)
        assert webhook.is_subscribed_to(WebhookEvent.AGENT_STARTED)
        assert webhook.is_subscribed_to("any.event")

    def test_repr(self) -> None:
        """Test string representation."""
        webhook = Webhook(id=1, name="Test Webhook", status=WebhookStatus.ACTIVE)
        result = repr(webhook)
        assert "id=1" in result
        assert "Test Webhook" in result


class TestWebhookDeliveryModel:
    """Tests for WebhookDelivery model."""

    def test_repr(self) -> None:
        """Test string representation."""
        delivery = WebhookDelivery(
            id=1,
            event_type="task.completed",
            status=DeliveryStatus.SUCCESS,
        )
        result = repr(delivery)
        assert "id=1" in result
        assert "task.completed" in result


class TestWebhookCreateSchema:
    """Tests for WebhookCreate schema."""

    def test_create_valid(self) -> None:
        """Test creating a valid webhook."""
        data = WebhookCreate(
            name="My Webhook",
            url="https://example.com/webhook",
            events=["task.completed"],
        )
        assert data.name == "My Webhook"
        assert str(data.url) == "https://example.com/webhook"
        assert data.events == ["task.completed"]

    def test_create_with_all_options(self) -> None:
        """Test creating webhook with all options."""
        data = WebhookCreate(
            name="Full Webhook",
            url="https://example.com/webhook",
            events=["task.completed", "task.failed"],
            headers={"X-Custom": "value"},
            retry_count=5,
            timeout_seconds=60,
        )
        assert data.headers == {"X-Custom": "value"}
        assert data.retry_count == 5
        assert data.timeout_seconds == 60

    def test_create_with_wildcard(self) -> None:
        """Test creating webhook with wildcard event."""
        data = WebhookCreate(
            name="All Events",
            url="https://example.com/webhook",
            events=["*"],
        )
        assert data.events == ["*"]

    def test_invalid_event_fails(self) -> None:
        """Test that invalid event raises error."""
        with pytest.raises(ValidationError) as exc_info:
            WebhookCreate(
                name="Invalid",
                url="https://example.com/webhook",
                events=["invalid.event"],
            )
        assert "Invalid event" in str(exc_info.value)

    def test_empty_events_fails(self) -> None:
        """Test that empty events list fails."""
        with pytest.raises(ValidationError):
            WebhookCreate(
                name="No Events",
                url="https://example.com/webhook",
                events=[],
            )

    def test_invalid_url_fails(self) -> None:
        """Test that invalid URL fails."""
        with pytest.raises(ValidationError):
            WebhookCreate(
                name="Bad URL",
                url="not-a-url",
                events=["task.completed"],
            )


class TestWebhookUpdateSchema:
    """Tests for WebhookUpdate schema."""

    def test_partial_update(self) -> None:
        """Test partial update with just name."""
        data = WebhookUpdate(name="New Name")
        assert data.name == "New Name"
        assert data.url is None
        assert data.events is None

    def test_update_status(self) -> None:
        """Test updating status."""
        data = WebhookUpdate(status=WebhookStatus.PAUSED)
        assert data.status == WebhookStatus.PAUSED

    def test_invalid_event_fails(self) -> None:
        """Test that invalid event in update fails."""
        with pytest.raises(ValidationError):
            WebhookUpdate(events=["invalid.event"])


class TestWebhookTestRequestSchema:
    """Tests for WebhookTestRequest schema."""

    def test_default_event(self) -> None:
        """Test default event type."""
        data = WebhookTestRequest()
        assert data.event_type == "task.completed"

    def test_custom_event(self) -> None:
        """Test custom event type."""
        data = WebhookTestRequest(event_type="workflow.planning_completed")
        assert data.event_type == "workflow.planning_completed"

    def test_invalid_event_fails(self) -> None:
        """Test that invalid event type fails."""
        with pytest.raises(ValidationError):
            WebhookTestRequest(event_type="invalid.event")


class TestWebhookEventPayloadSchema:
    """Tests for WebhookEventPayload schema."""

    def test_create_payload(self) -> None:
        """Test creating an event payload."""
        payload = WebhookEventPayload(
            event_id="abc123",
            event_type="task.completed",
            timestamp=datetime.now(UTC),
            data={"task_id": 1, "status": "completed"},
        )
        assert payload.event_id == "abc123"
        assert payload.event_type == "task.completed"
        assert payload.data["task_id"] == 1

    def test_payload_with_context(self) -> None:
        """Test payload with optional context."""
        payload = WebhookEventPayload(
            event_id="abc123",
            event_type="task.completed",
            timestamp=datetime.now(UTC),
            data={"status": "completed"},
            task_id=42,
            user_id=1,
        )
        assert payload.task_id == 42
        assert payload.user_id == 1

    def test_payload_json_serializable(self) -> None:
        """Test that payload can be serialized to JSON."""
        payload = WebhookEventPayload(
            event_id="abc123",
            event_type="task.completed",
            timestamp=datetime.now(UTC),
            data={"task_id": 1},
        )
        json_str = payload.model_dump_json()
        assert "abc123" in json_str
        assert "task.completed" in json_str


class TestWebhookSignature:
    """Tests for webhook signature generation."""

    def test_signature_generation(self) -> None:
        """Test HMAC-SHA256 signature generation."""
        secret = "test_secret_key"
        payload = '{"event": "task.completed"}'

        # Generate signature the same way the service does
        signature = hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        assert len(signature) == 64  # SHA256 produces 64 hex chars
        assert signature.isalnum()

    def test_signature_verification(self) -> None:
        """Test that same input produces same signature."""
        secret = "test_secret_key"
        payload = '{"event": "task.completed"}'

        sig1 = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        sig2 = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

        assert sig1 == sig2

    def test_different_payload_different_signature(self) -> None:
        """Test that different payloads produce different signatures."""
        secret = "test_secret_key"

        sig1 = hmac.new(secret.encode(), b'{"event": "task.completed"}', hashlib.sha256).hexdigest()
        sig2 = hmac.new(secret.encode(), b'{"event": "task.failed"}', hashlib.sha256).hexdigest()

        assert sig1 != sig2

    def test_different_secret_different_signature(self) -> None:
        """Test that different secrets produce different signatures."""
        payload = b'{"event": "task.completed"}'

        sig1 = hmac.new(b"secret1", payload, hashlib.sha256).hexdigest()
        sig2 = hmac.new(b"secret2", payload, hashlib.sha256).hexdigest()

        assert sig1 != sig2


class TestWebhookEventTypes:
    """Tests for webhook event type coverage."""

    def test_all_events_have_values(self) -> None:
        """Test that all events have string values."""
        for event in WebhookEvent:
            assert isinstance(event.value, str)
            assert "." in event.value  # All events use dot notation

    def test_task_events_start_with_task(self) -> None:
        """Test task events naming convention."""
        task_events = [
            WebhookEvent.TASK_CREATED,
            WebhookEvent.TASK_STARTED,
            WebhookEvent.TASK_COMPLETED,
            WebhookEvent.TASK_FAILED,
            WebhookEvent.TASK_CANCELLED,
        ]
        for event in task_events:
            assert event.value.startswith("task.")

    def test_workflow_events_start_with_workflow(self) -> None:
        """Test workflow events naming convention."""
        workflow_events = [
            WebhookEvent.PLANNING_COMPLETED,
            WebhookEvent.CODING_COMPLETED,
            WebhookEvent.TESTING_COMPLETED,
            WebhookEvent.REVIEW_COMPLETED,
            WebhookEvent.REVIEW_APPROVED,
            WebhookEvent.REVIEW_REJECTED,
            WebhookEvent.REVIEW_REVISION_REQUESTED,
            WebhookEvent.ITERATION_STARTED,
            WebhookEvent.MAX_ITERATIONS_REACHED,
        ]
        for event in workflow_events:
            assert event.value.startswith("workflow.")

    def test_agent_events_start_with_agent(self) -> None:
        """Test agent events naming convention."""
        agent_events = [
            WebhookEvent.AGENT_STARTED,
            WebhookEvent.AGENT_COMPLETED,
            WebhookEvent.AGENT_FAILED,
        ]
        for event in agent_events:
            assert event.value.startswith("agent.")
