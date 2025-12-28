"""API endpoints for webhook management.

This module provides endpoints for:
- Creating, reading, updating, and deleting webhooks
- Testing webhook delivery
- Viewing delivery history
- Regenerating webhook secrets
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user
from src.core.database import get_db
from src.models.user import User
from src.models.webhook import DeliveryStatus, WebhookStatus
from src.schemas.webhook import (
    WebhookCreate,
    WebhookDeliveryListResponse,
    WebhookDeliveryResponse,
    WebhookListResponse,
    WebhookResponse,
    WebhookTestRequest,
    WebhookTestResponse,
    WebhookUpdate,
    WebhookWithSecretResponse,
)
from src.services.webhook_service import WebhookService

router = APIRouter()


@router.post(
    "/webhooks",
    response_model=WebhookWithSecretResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_webhook(
    webhook_data: WebhookCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> WebhookWithSecretResponse:
    """
    Create a new webhook.

    The response includes the generated secret which should be stored securely.
    The secret is only shown once on creation and cannot be retrieved later.

    Args:
        webhook_data: Webhook creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created webhook with secret
    """
    service = WebhookService(db)
    webhook = await service.create_webhook(current_user.id, webhook_data)

    return WebhookWithSecretResponse.model_validate(webhook)


@router.get("/webhooks", response_model=WebhookListResponse)
async def list_webhooks(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: WebhookStatus | None = Query(None, description="Filter by status"),
) -> WebhookListResponse:
    """
    List webhooks for the current user.

    Args:
        db: Database session
        current_user: Current authenticated user
        page: Page number
        page_size: Items per page
        status: Optional status filter

    Returns:
        Paginated list of webhooks
    """
    service = WebhookService(db)
    webhooks, total = await service.list_webhooks(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status,
    )

    return WebhookListResponse(
        items=[WebhookResponse.model_validate(w) for w in webhooks],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/webhooks/{webhook_id}", response_model=WebhookResponse)
async def get_webhook(
    webhook_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> WebhookResponse:
    """
    Get a specific webhook by ID.

    Args:
        webhook_id: Webhook ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Webhook details

    Raises:
        HTTPException: If webhook not found
    """
    service = WebhookService(db)
    webhook = await service.get_webhook(webhook_id, current_user.id)

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    return WebhookResponse.model_validate(webhook)


@router.patch("/webhooks/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    webhook_id: int,
    webhook_data: WebhookUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> WebhookResponse:
    """
    Update a webhook.

    Args:
        webhook_id: Webhook ID
        webhook_data: Update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated webhook

    Raises:
        HTTPException: If webhook not found
    """
    service = WebhookService(db)
    webhook = await service.update_webhook(webhook_id, current_user.id, webhook_data)

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    return WebhookResponse.model_validate(webhook)


@router.delete("/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """
    Delete a webhook.

    Args:
        webhook_id: Webhook ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If webhook not found
    """
    service = WebhookService(db)
    deleted = await service.delete_webhook(webhook_id, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )


@router.post(
    "/webhooks/{webhook_id}/regenerate-secret",
    response_model=WebhookWithSecretResponse,
)
async def regenerate_webhook_secret(
    webhook_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> WebhookWithSecretResponse:
    """
    Regenerate the secret for a webhook.

    The old secret will be invalidated immediately.

    Args:
        webhook_id: Webhook ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Webhook with new secret

    Raises:
        HTTPException: If webhook not found
    """
    service = WebhookService(db)
    webhook = await service.regenerate_secret(webhook_id, current_user.id)

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    return WebhookWithSecretResponse.model_validate(webhook)


@router.post("/webhooks/{webhook_id}/test", response_model=WebhookTestResponse)
async def test_webhook(
    webhook_id: int,
    test_data: WebhookTestRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> WebhookTestResponse:
    """
    Send a test event to a webhook.

    This sends a test payload to verify the webhook endpoint is working.

    Args:
        webhook_id: Webhook ID
        test_data: Test configuration
        db: Database session
        current_user: Current authenticated user

    Returns:
        Test result with response details
    """
    service = WebhookService(db)
    result = await service.test_webhook(
        webhook_id=webhook_id,
        user_id=current_user.id,
        event_type=test_data.event_type,
    )

    if result.get("error_message") == "Webhook not found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    return WebhookTestResponse(**result)


@router.get(
    "/webhooks/{webhook_id}/deliveries",
    response_model=WebhookDeliveryListResponse,
)
async def list_webhook_deliveries(
    webhook_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    delivery_status: DeliveryStatus | None = Query(None, description="Filter by status"),
) -> WebhookDeliveryListResponse:
    """
    List delivery history for a webhook.

    Args:
        webhook_id: Webhook ID
        db: Database session
        current_user: Current authenticated user
        page: Page number
        page_size: Items per page
        delivery_status: Optional status filter

    Returns:
        Paginated list of deliveries

    Raises:
        HTTPException: If webhook not found
    """
    service = WebhookService(db)
    deliveries, total = await service.get_deliveries(
        webhook_id=webhook_id,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=delivery_status,
    )

    if total == 0:
        # Check if webhook exists
        webhook = await service.get_webhook(webhook_id, current_user.id)
        if not webhook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook not found",
            )

    return WebhookDeliveryListResponse(
        items=[WebhookDeliveryResponse.model_validate(d) for d in deliveries],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/webhooks/{webhook_id}/deliveries/{delivery_id}",
    response_model=WebhookDeliveryResponse,
)
async def get_webhook_delivery(
    webhook_id: int,
    delivery_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> WebhookDeliveryResponse:
    """
    Get a specific delivery by ID.

    Args:
        webhook_id: Webhook ID
        delivery_id: Delivery ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Delivery details

    Raises:
        HTTPException: If webhook or delivery not found
    """
    service = WebhookService(db)

    # Verify webhook ownership
    webhook = await service.get_webhook(webhook_id, current_user.id)
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    # Get all deliveries for this webhook and find the specific one
    from sqlalchemy import select

    from src.models.webhook import WebhookDelivery

    result = await db.execute(
        select(WebhookDelivery).where(
            WebhookDelivery.id == delivery_id,
            WebhookDelivery.webhook_id == webhook_id,
        )
    )
    delivery = result.scalar_one_or_none()

    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found",
        )

    return WebhookDeliveryResponse.model_validate(delivery)
