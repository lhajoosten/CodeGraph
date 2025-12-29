"""Cross-cutting infrastructure for agent system.

Provides:
- models: LLM factory and model configuration
- tracking: Agent run persistence and metrics
- tracing: LangSmith integration
- error_handler: Error classification and recovery
- streaming: Real-time output streaming
- checkpointer: Workflow state persistence
"""

from src.agents.infrastructure.checkpointer import (
    check_checkpointer_health,
    close_checkpointer,
    get_checkpoint_state,
    get_checkpointer,
    list_checkpoints,
)
from src.agents.infrastructure.error_handler import ErrorHandler, ErrorType
from src.agents.infrastructure.models import (
    ChatModel,
    ModelFactory,
    ModelRateLimiter,
    get_coder_model,
    get_model_for_task,
    get_planner_model,
    get_rate_limiter,
    get_reviewer_model,
    get_tester_model,
    reset_rate_limiter,
)
from src.agents.infrastructure.streaming import StreamingMetrics, stream_with_metrics
from src.agents.infrastructure.tracing import configure_tracing, is_tracing_enabled
from src.agents.infrastructure.tracking import AgentRunTracker

__all__ = [
    # Models
    "ChatModel",
    "ModelFactory",
    "get_model_for_task",
    "get_planner_model",
    "get_coder_model",
    "get_tester_model",
    "get_reviewer_model",
    # Rate limiting
    "ModelRateLimiter",
    "get_rate_limiter",
    "reset_rate_limiter",
    # Error handling
    "ErrorHandler",
    "ErrorType",
    # Streaming
    "StreamingMetrics",
    "stream_with_metrics",
    # Tracing
    "configure_tracing",
    "is_tracing_enabled",
    # Tracking
    "AgentRunTracker",
    # Checkpointing
    "get_checkpointer",
    "close_checkpointer",
    "get_checkpoint_state",
    "list_checkpoints",
    "check_checkpointer_health",
]
