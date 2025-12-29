"""Streaming utilities for LangGraph agent nodes with metrics collection.

This module provides utilities for streaming LLM responses while capturing
usage metrics (tokens, latency). It solves the problem that model.astream()
doesn't easily provide usage metadata.

The StreamingResponse class accumulates chunks and extracts final metrics,
allowing nodes to both stream output and track token usage accurately.
"""

import time
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Any

from langchain_core.messages import AIMessageChunk, BaseMessage
from langchain_core.runnables import RunnableConfig

from src.agents.infrastructure.models import ChatModel
from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class StreamingMetrics:
    """Metrics collected during streaming response.

    Attributes:
        input_tokens: Number of input tokens (if available)
        output_tokens: Number of output tokens (if available)
        total_tokens: Total tokens used
        latency_ms: Total latency in milliseconds
        chunk_count: Number of chunks streamed
    """

    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    latency_ms: int = 0
    chunk_count: int = 0


@dataclass
class StreamingResponse:
    """Container for streaming response with metrics.

    Accumulates content chunks and extracts final usage metadata.
    Use iterate_with_metrics() to stream content and get metrics at the end.

    Attributes:
        content: Accumulated full content
        metrics: Usage metrics from the stream
        chunks: List of individual chunks (optional, for debugging)
    """

    content: str = ""
    metrics: StreamingMetrics = field(default_factory=StreamingMetrics)
    chunks: list[str] = field(default_factory=list)
    _store_chunks: bool = False

    def add_chunk(self, chunk: str) -> None:
        """Add a chunk to the accumulated content."""
        self.content += chunk
        self.metrics.chunk_count += 1
        if self._store_chunks:
            self.chunks.append(chunk)


async def stream_with_metrics(
    model: ChatModel,
    messages: list[tuple[str, str]],
    config: RunnableConfig | None = None,
    store_chunks: bool = False,
) -> AsyncGenerator[tuple[str, StreamingMetrics | None], None]:
    """Stream model response while collecting metrics.

    This generator yields (chunk, None) for each content chunk, then yields
    ("", metrics) as the final item with the complete metrics.

    Args:
        model: The chat model to use (ChatAnthropic or ChatOpenAI)
        messages: List of (role, content) tuples
        config: Optional RunnableConfig for tracing
        store_chunks: Whether to store individual chunks (for debugging)

    Yields:
        Tuple of (content_chunk, None) for content, then ("", StreamingMetrics) at end

    Example:
        async for chunk, metrics in stream_with_metrics(model, messages):
            if metrics is None:
                yield chunk  # Stream to client
            else:
                # metrics contains final usage data
                log_usage(metrics)
    """
    start_time = time.time()
    response = StreamingResponse(_store_chunks=store_chunks)

    # Track the last chunk for extracting usage metadata
    last_chunk: AIMessageChunk | BaseMessage | None = None

    async for chunk in model.astream(messages, config):
        if isinstance(chunk, (AIMessageChunk, BaseMessage)):
            last_chunk = chunk
            if chunk.content:
                content = chunk.content
                if isinstance(content, str):
                    response.add_chunk(content)
                    yield content, None

    # Calculate latency
    response.metrics.latency_ms = int((time.time() - start_time) * 1000)

    # Extract usage metadata from the final accumulated chunk
    # LangChain accumulates usage_metadata across chunks
    if last_chunk is not None:
        usage_metadata = getattr(last_chunk, "usage_metadata", None) or {}
        response.metrics.input_tokens = usage_metadata.get("input_tokens", 0)
        response.metrics.output_tokens = usage_metadata.get("output_tokens", 0)
        response.metrics.total_tokens = usage_metadata.get(
            "total_tokens", response.metrics.input_tokens + response.metrics.output_tokens
        )

        # Also check response_metadata for some providers
        response_metadata = getattr(last_chunk, "response_metadata", None) or {}
        if not response.metrics.input_tokens and "token_usage" in response_metadata:
            token_usage = response_metadata["token_usage"]
            response.metrics.input_tokens = token_usage.get("prompt_tokens", 0)
            response.metrics.output_tokens = token_usage.get("completion_tokens", 0)
            response.metrics.total_tokens = token_usage.get("total_tokens", 0)

    logger.debug(
        "Stream completed with metrics",
        content_length=len(response.content),
        chunk_count=response.metrics.chunk_count,
        input_tokens=response.metrics.input_tokens,
        output_tokens=response.metrics.output_tokens,
        latency_ms=response.metrics.latency_ms,
    )

    # Yield final metrics
    yield "", response.metrics


async def collect_stream_response(
    model: ChatModel,
    messages: list[tuple[str, str]],
    config: RunnableConfig | None = None,
) -> tuple[str, StreamingMetrics]:
    """Collect entire streamed response with metrics (non-streaming to caller).

    Use this when you need to process the entire response before returning,
    but still want accurate token counts from the streaming API.

    Args:
        model: The chat model to use
        messages: List of (role, content) tuples
        config: Optional RunnableConfig for tracing

    Returns:
        Tuple of (full_content, metrics)
    """
    content = ""
    final_metrics = StreamingMetrics()

    async for chunk, metrics in stream_with_metrics(model, messages, config):
        if metrics is None:
            content += chunk
        else:
            final_metrics = metrics

    return content, final_metrics


def format_usage_dict(metrics: StreamingMetrics) -> dict[str, Any]:
    """Convert StreamingMetrics to a dict for metadata storage.

    Args:
        metrics: The streaming metrics to format

    Returns:
        Dict suitable for storing in workflow state metadata
    """
    return {
        "input_tokens": metrics.input_tokens,
        "output_tokens": metrics.output_tokens,
        "total_tokens": metrics.total_tokens,
        "latency_ms": metrics.latency_ms,
        "chunk_count": metrics.chunk_count,
        "streaming": True,
    }
