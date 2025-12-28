"""Cross-cutting infrastructure for agent system.

Provides:
- models: LLM factory and model configuration
- tracking: Agent run persistence and metrics
- tracing: LangSmith integration
- error_handler: Error classification and recovery
- streaming: Real-time output streaming
"""

from src.agents.infrastructure.error_handler import ErrorHandler, ErrorType
from src.agents.infrastructure.models import (
    ChatModel,
    ModelFactory,
    get_coder_model,
    get_model_for_task,
    get_planner_model,
    get_reviewer_model,
    get_tester_model,
)
from src.agents.infrastructure.streaming import StreamingMetrics, stream_with_metrics
from src.agents.infrastructure.tracing import configure_tracing, is_tracing_enabled
from src.agents.infrastructure.tracking import AgentRunTracker

__all__ = [
    "ChatModel",
    "ModelFactory",
    "get_model_for_task",
    "get_planner_model",
    "get_coder_model",
    "get_tester_model",
    "get_reviewer_model",
    "ErrorHandler",
    "ErrorType",
    "StreamingMetrics",
    "stream_with_metrics",
    "configure_tracing",
    "is_tracing_enabled",
    "AgentRunTracker",
]
