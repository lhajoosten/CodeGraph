"""Pydantic schemas for agent-related operations."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel

from src.models.agent_run import AgentRunStatus, AgentType


class AgentRunResponse(BaseModel):
    """Schema for agent run responses."""

    id: int
    agent_type: AgentType
    status: AgentRunStatus
    task_id: int
    model_used: str | None
    tokens_used: int | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentExecutionRequest(BaseModel):
    """Schema for requesting agent execution."""

    task_id: int


class AgentStreamEvent(BaseModel):
    """Schema for agent execution stream events."""

    event_type: str
    agent_type: AgentType
    data: dict[str, Any]
    timestamp: datetime
