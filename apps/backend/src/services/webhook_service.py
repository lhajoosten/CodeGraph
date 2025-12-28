"""Webhook service for managing webhooks and dispatching events.

This service handles:
- CRUD operations for webhook configurations
- Dispatching webhook events to registered endpoints
- Retry logic for failed deliveries
- HMAC signature generation for payload verification
"""

import hashlib
import hmac
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
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
    WebhookUpdate,
)

logger = get_logger(__name__)

# Retry backoff intervals in seconds (exponential backoff)
RETRY_INTERVALS = [60, 300, 900, 3600]  # 1min, 5min, 15min, 1hour


class WebhookService:
    """Service for managing webhooks and dispatching events."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the webhook service.

        Args:
            db: Async database session
        """
        self.db = db

    async def create_webhook(self, user_id: int, data: WebhookCreate) -> Webhook:
        """Create a new webhook configuration.

        Args:
            user_id: ID of the user creating the webhook
            data: Webhook creation data

        Returns:
            Created webhook with generated secret
        """
        webhook = Webhook(
            name=data.name,
            url=str(data.url),
            secret=Webhook.generate_secret(),
            events=data.events,
            headers=data.headers,
            retry_count=data.retry_count,
            timeout_seconds=data.timeout_seconds,
            user_id=user_id,
        )
        self.db.add(webhook)
        await self.db.commit()
        await self.db.refresh(webhook)

        logger.info(
            "Webhook created",
            webhook_id=webhook.id,
            user_id=user_id,
            events=webhook.events,
        )

        return webhook

    async def get_webhook(self, webhook_id: int, user_id: int) -> Webhook | None:
        """Get a webhook by ID for a specific user.

        Args:
            webhook_id: Webhook ID
            user_id: Owner user ID

        Returns:
            Webhook if found and owned by user, None otherwise
        """
        result = await self.db.execute(
            select(Webhook).where(Webhook.id == webhook_id, Webhook.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_webhooks(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        status: WebhookStatus | None = None,
    ) -> tuple[list[Webhook], int]:
        """List webhooks for a user with pagination.

        Args:
            user_id: Owner user ID
            page: Page number (1-indexed)
            page_size: Items per page
            status: Optional status filter

        Returns:
            Tuple of (webhooks list, total count)
        """
        query = select(Webhook).where(Webhook.user_id == user_id)

        if status:
            query = query.where(Webhook.status == status)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query) or 0

        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Webhook.created_at.desc())

        result = await self.db.execute(query)
        webhooks = list(result.scalars().all())

        return webhooks, total

    async def update_webhook(
        self,
        webhook_id: int,
        user_id: int,
        data: WebhookUpdate,
    ) -> Webhook | None:
        """Update a webhook configuration.

        Args:
            webhook_id: Webhook ID
            user_id: Owner user ID
            data: Update data

        Returns:
            Updated webhook or None if not found
        """
        webhook = await self.get_webhook(webhook_id, user_id)
        if not webhook:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "url" and value is not None:
                setattr(webhook, field, str(value))
            else:
                setattr(webhook, field, value)

        await self.db.commit()
        await self.db.refresh(webhook)

        logger.info("Webhook updated", webhook_id=webhook_id)

        return webhook

    async def delete_webhook(self, webhook_id: int, user_id: int) -> bool:
        """Delete a webhook.

        Args:
            webhook_id: Webhook ID
            user_id: Owner user ID

        Returns:
            True if deleted, False if not found
        """
        webhook = await self.get_webhook(webhook_id, user_id)
        if not webhook:
            return False

        await self.db.delete(webhook)
        await self.db.commit()

        logger.info("Webhook deleted", webhook_id=webhook_id)

        return True

    async def regenerate_secret(self, webhook_id: int, user_id: int) -> Webhook | None:
        """Regenerate the secret for a webhook.

        Args:
            webhook_id: Webhook ID
            user_id: Owner user ID

        Returns:
            Updated webhook with new secret or None if not found
        """
        webhook = await self.get_webhook(webhook_id, user_id)
        if not webhook:
            return None

        webhook.secret = Webhook.generate_secret()
        await self.db.commit()
        await self.db.refresh(webhook)

        logger.info("Webhook secret regenerated", webhook_id=webhook_id)

        return webhook

    async def get_deliveries(
        self,
        webhook_id: int,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        status: DeliveryStatus | None = None,
    ) -> tuple[list[WebhookDelivery], int]:
        """Get delivery history for a webhook.

        Args:
            webhook_id: Webhook ID
            user_id: Owner user ID
            page: Page number
            page_size: Items per page
            status: Optional status filter

        Returns:
            Tuple of (deliveries list, total count)
        """
        # First verify ownership
        webhook = await self.get_webhook(webhook_id, user_id)
        if not webhook:
            return [], 0

        query = select(WebhookDelivery).where(WebhookDelivery.webhook_id == webhook_id)

        if status:
            query = query.where(WebhookDelivery.status == status)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query) or 0

        # Apply pagination and ordering
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(WebhookDelivery.created_at.desc())

        result = await self.db.execute(query)
        deliveries = list(result.scalars().all())

        return deliveries, total

    def generate_signature(self, payload: str, secret: str) -> str:
        """Generate HMAC-SHA256 signature for webhook payload.

        Args:
            payload: JSON payload string
            secret: Webhook secret

        Returns:
            Hex-encoded signature
        """
        return hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    async def dispatch_event(
        self,
        event_type: WebhookEvent | str,
        data: dict[str, Any],
        task_id: int | None = None,
        agent_run_id: int | None = None,
        user_id: int | None = None,
    ) -> int:
        """Dispatch an event to all subscribed webhooks.

        Args:
            event_type: Type of event being dispatched
            data: Event-specific data
            task_id: Associated task ID
            agent_run_id: Associated agent run ID
            user_id: User ID to filter webhooks (if None, dispatches to all matching)

        Returns:
            Number of webhooks the event was dispatched to
        """
        event_value = event_type.value if isinstance(event_type, WebhookEvent) else event_type
        event_id = str(uuid.uuid4())

        # Find all active webhooks subscribed to this event
        query = select(Webhook).where(
            Webhook.status == WebhookStatus.ACTIVE,
        )
        if user_id:
            query = query.where(Webhook.user_id == user_id)

        result = await self.db.execute(query)
        webhooks = list(result.scalars().all())

        # Filter to webhooks subscribed to this event
        subscribed_webhooks = [w for w in webhooks if w.is_subscribed_to(event_value)]

        if not subscribed_webhooks:
            logger.debug("No webhooks subscribed to event", event_type=event_value)
            return 0

        # Create event payload
        payload = WebhookEventPayload(
            event_id=event_id,
            event_type=event_value,
            timestamp=datetime.now(UTC),
            data=data,
            task_id=task_id,
            agent_run_id=agent_run_id,
            user_id=user_id,
        )

        # Dispatch to each webhook
        dispatch_count = 0
        for webhook in subscribed_webhooks:
            await self._deliver_webhook(webhook, payload)
            dispatch_count += 1

        logger.info(
            "Event dispatched",
            event_type=event_value,
            event_id=event_id,
            webhook_count=dispatch_count,
        )

        return dispatch_count

    async def _deliver_webhook(
        self,
        webhook: Webhook,
        payload: WebhookEventPayload,
    ) -> WebhookDelivery:
        """Deliver a webhook payload to an endpoint.

        Args:
            webhook: Webhook configuration
            payload: Event payload to deliver

        Returns:
            Delivery record
        """
        payload_json = payload.model_dump_json()
        signature = self.generate_signature(payload_json, webhook.secret)

        # Create delivery record
        delivery = WebhookDelivery(
            webhook_id=webhook.id,
            event_type=payload.event_type,
            event_id=payload.event_id,
            payload=payload.model_dump(mode="json"),
            status=DeliveryStatus.PENDING,
        )
        self.db.add(delivery)
        await self.db.commit()

        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Event": payload.event_type,
            "X-Webhook-Signature": f"sha256={signature}",
            "X-Webhook-Timestamp": payload.timestamp.isoformat(),
            "X-Webhook-ID": payload.event_id,
            "User-Agent": "CodeGraph-Webhook/1.0",
        }
        if webhook.headers:
            headers.update(webhook.headers)

        # Attempt delivery
        start_time = datetime.now(UTC)
        try:
            async with httpx.AsyncClient(timeout=webhook.timeout_seconds) as client:
                response = await client.post(
                    webhook.url,
                    content=payload_json,
                    headers=headers,
                )

            duration_ms = int((datetime.now(UTC) - start_time).total_seconds() * 1000)

            delivery.attempt_count = 1
            delivery.response_status = response.status_code
            delivery.response_body = response.text[:1000] if response.text else None
            delivery.duration_ms = duration_ms

            if 200 <= response.status_code < 300:
                delivery.status = DeliveryStatus.SUCCESS
                delivery.delivered_at = datetime.now(UTC)
                webhook.success_count += 1
                webhook.last_success_at = datetime.now(UTC)
            else:
                delivery.status = DeliveryStatus.FAILED
                delivery.error_message = f"HTTP {response.status_code}"
                webhook.failure_count += 1
                webhook.last_failure_at = datetime.now(UTC)

                # Schedule retry if needed
                if delivery.attempt_count < webhook.retry_count:
                    delivery.status = DeliveryStatus.RETRYING
                    retry_interval = RETRY_INTERVALS[
                        min(delivery.attempt_count - 1, len(RETRY_INTERVALS) - 1)
                    ]
                    delivery.next_retry_at = datetime.now(UTC) + timedelta(seconds=retry_interval)

        except httpx.TimeoutException:
            duration_ms = int((datetime.now(UTC) - start_time).total_seconds() * 1000)
            delivery.attempt_count = 1
            delivery.status = DeliveryStatus.FAILED
            delivery.error_message = "Request timeout"
            delivery.duration_ms = duration_ms
            webhook.failure_count += 1
            webhook.last_failure_at = datetime.now(UTC)

            if delivery.attempt_count < webhook.retry_count:
                delivery.status = DeliveryStatus.RETRYING
                delivery.next_retry_at = datetime.now(UTC) + timedelta(seconds=RETRY_INTERVALS[0])

        except httpx.RequestError as e:
            duration_ms = int((datetime.now(UTC) - start_time).total_seconds() * 1000)
            delivery.attempt_count = 1
            delivery.status = DeliveryStatus.FAILED
            delivery.error_message = str(e)[:500]
            delivery.duration_ms = duration_ms
            webhook.failure_count += 1
            webhook.last_failure_at = datetime.now(UTC)

            if delivery.attempt_count < webhook.retry_count:
                delivery.status = DeliveryStatus.RETRYING
                delivery.next_retry_at = datetime.now(UTC) + timedelta(seconds=RETRY_INTERVALS[0])

        webhook.last_triggered_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(delivery)

        logger.info(
            "Webhook delivery attempt",
            webhook_id=webhook.id,
            delivery_id=delivery.id,
            status=delivery.status.value,
            response_status=delivery.response_status,
            duration_ms=delivery.duration_ms,
        )

        return delivery

    async def test_webhook(
        self,
        webhook_id: int,
        user_id: int,
        event_type: str = "task.completed",
    ) -> dict[str, Any]:
        """Send a test event to a webhook.

        Args:
            webhook_id: Webhook ID
            user_id: Owner user ID
            event_type: Event type to simulate

        Returns:
            Test result with success status and response details
        """
        webhook = await self.get_webhook(webhook_id, user_id)
        if not webhook:
            return {
                "success": False,
                "error_message": "Webhook not found",
                "status_code": None,
                "response_body": None,
                "duration_ms": 0,
            }

        # Create test payload
        payload = WebhookEventPayload(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=datetime.now(UTC),
            data={
                "test": True,
                "message": "This is a test webhook delivery",
            },
            task_id=None,
            agent_run_id=None,
            user_id=user_id,
        )

        payload_json = payload.model_dump_json()
        signature = self.generate_signature(payload_json, webhook.secret)

        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Event": payload.event_type,
            "X-Webhook-Signature": f"sha256={signature}",
            "X-Webhook-Timestamp": payload.timestamp.isoformat(),
            "X-Webhook-ID": payload.event_id,
            "X-Webhook-Test": "true",
            "User-Agent": "CodeGraph-Webhook/1.0",
        }
        if webhook.headers:
            headers.update(webhook.headers)

        start_time = datetime.now(UTC)
        try:
            async with httpx.AsyncClient(timeout=webhook.timeout_seconds) as client:
                response = await client.post(
                    webhook.url,
                    content=payload_json,
                    headers=headers,
                )

            duration_ms = int((datetime.now(UTC) - start_time).total_seconds() * 1000)

            return {
                "success": 200 <= response.status_code < 300,
                "status_code": response.status_code,
                "response_body": response.text[:1000] if response.text else None,
                "error_message": None
                if 200 <= response.status_code < 300
                else f"HTTP {response.status_code}",
                "duration_ms": duration_ms,
            }

        except httpx.TimeoutException:
            duration_ms = int((datetime.now(UTC) - start_time).total_seconds() * 1000)
            return {
                "success": False,
                "status_code": None,
                "response_body": None,
                "error_message": "Request timeout",
                "duration_ms": duration_ms,
            }

        except httpx.RequestError as e:
            duration_ms = int((datetime.now(UTC) - start_time).total_seconds() * 1000)
            return {
                "success": False,
                "status_code": None,
                "response_body": None,
                "error_message": str(e)[:500],
                "duration_ms": duration_ms,
            }

    async def retry_failed_deliveries(self) -> int:
        """Retry failed webhook deliveries that are due.

        This should be called periodically by a background task.

        Returns:
            Number of deliveries retried
        """
        now = datetime.now(UTC)

        # Find deliveries due for retry
        query = select(WebhookDelivery).where(
            WebhookDelivery.status == DeliveryStatus.RETRYING,
            WebhookDelivery.next_retry_at <= now,
        )

        result = await self.db.execute(query)
        deliveries = list(result.scalars().all())

        retry_count = 0
        for delivery in deliveries:
            webhook = await self.db.get(Webhook, delivery.webhook_id)
            if not webhook or webhook.status != WebhookStatus.ACTIVE:
                delivery.status = DeliveryStatus.FAILED
                delivery.error_message = "Webhook disabled or deleted"
                await self.db.commit()
                continue

            # Retry delivery
            await self._retry_delivery(webhook, delivery)
            retry_count += 1

        logger.info("Retried failed deliveries", count=retry_count)

        return retry_count

    async def _retry_delivery(
        self,
        webhook: Webhook,
        delivery: WebhookDelivery,
    ) -> None:
        """Retry a failed webhook delivery.

        Args:
            webhook: Webhook configuration
            delivery: Delivery to retry
        """
        payload_json = delivery.payload
        if isinstance(payload_json, dict):
            import json

            payload_str = json.dumps(payload_json)
        else:
            payload_str = str(payload_json)

        signature = self.generate_signature(payload_str, webhook.secret)

        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Event": delivery.event_type,
            "X-Webhook-Signature": f"sha256={signature}",
            "X-Webhook-ID": delivery.event_id,
            "X-Webhook-Retry": str(delivery.attempt_count + 1),
            "User-Agent": "CodeGraph-Webhook/1.0",
        }
        if webhook.headers:
            headers.update(webhook.headers)

        start_time = datetime.now(UTC)
        try:
            async with httpx.AsyncClient(timeout=webhook.timeout_seconds) as client:
                response = await client.post(
                    webhook.url,
                    content=payload_str,
                    headers=headers,
                )

            duration_ms = int((datetime.now(UTC) - start_time).total_seconds() * 1000)

            delivery.attempt_count += 1
            delivery.response_status = response.status_code
            delivery.response_body = response.text[:1000] if response.text else None
            delivery.duration_ms = duration_ms

            if 200 <= response.status_code < 300:
                delivery.status = DeliveryStatus.SUCCESS
                delivery.delivered_at = datetime.now(UTC)
                delivery.next_retry_at = None
                webhook.success_count += 1
                webhook.last_success_at = datetime.now(UTC)
            else:
                if delivery.attempt_count >= webhook.retry_count:
                    delivery.status = DeliveryStatus.FAILED
                    delivery.error_message = (
                        f"HTTP {response.status_code} after {delivery.attempt_count} attempts"
                    )
                else:
                    retry_interval = RETRY_INTERVALS[
                        min(delivery.attempt_count - 1, len(RETRY_INTERVALS) - 1)
                    ]
                    delivery.next_retry_at = datetime.now(UTC) + timedelta(seconds=retry_interval)
                    delivery.error_message = f"HTTP {response.status_code}"

                webhook.failure_count += 1
                webhook.last_failure_at = datetime.now(UTC)

        except (httpx.TimeoutException, httpx.RequestError) as e:
            duration_ms = int((datetime.now(UTC) - start_time).total_seconds() * 1000)
            delivery.attempt_count += 1
            delivery.duration_ms = duration_ms
            delivery.error_message = str(e)[:500]

            if delivery.attempt_count >= webhook.retry_count:
                delivery.status = DeliveryStatus.FAILED
            else:
                retry_interval = RETRY_INTERVALS[
                    min(delivery.attempt_count - 1, len(RETRY_INTERVALS) - 1)
                ]
                delivery.next_retry_at = datetime.now(UTC) + timedelta(seconds=retry_interval)

            webhook.failure_count += 1
            webhook.last_failure_at = datetime.now(UTC)

        await self.db.commit()


async def dispatch_workflow_event(
    db: AsyncSession,
    event_type: WebhookEvent,
    task_id: int,
    user_id: int,
    data: dict[str, Any],
    agent_run_id: int | None = None,
) -> int:
    """Convenience function to dispatch a workflow event.

    Args:
        db: Database session
        event_type: Type of workflow event
        task_id: Associated task ID
        user_id: Owner user ID
        data: Event-specific data
        agent_run_id: Optional agent run ID

    Returns:
        Number of webhooks notified
    """
    service = WebhookService(db)
    return await service.dispatch_event(
        event_type=event_type,
        data=data,
        task_id=task_id,
        agent_run_id=agent_run_id,
        user_id=user_id,
    )
