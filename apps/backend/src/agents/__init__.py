"""Multi-agent coding workflow system.

The agents package provides a complete multi-agent coding workflow:
- Planner: Breaks tasks into execution plans
- Coder: Generates production code
- Tester: Creates pytest test suites
- Reviewer: Reviews code quality (single or council-based)

Subpackages:
- nodes: Individual agent node implementations
- council: Multi-judge review system
- analyzers: Static analysis utilities
- processing: Code parsing and formatting
- infrastructure: Models, tracking, tracing, error handling

Module organization:
- graph.py: Core workflow definitions (create_workflow, get_compiled_graph)
- execution.py: Workflow invocation and streaming
- cancellation.py: Graceful cancellation support
- interrupts.py: Human-in-the-loop interrupt handling
- resilience.py: Error recovery and retry logic
- state.py: Workflow state type definitions

Key exports:
- WorkflowState: TypedDict for workflow state management
- create_workflow/invoke_workflow: Workflow creation and execution
- Agent nodes: planner_node, coder_node, tester_node, reviewer_node
"""

# Core workflow creation
# Cancellation support
from src.agents.cancellation import (
    CancellationToken,
    WorkflowCancelledError,
    cancel_workflow,
)

# Workflow execution
from src.agents.execution import (
    StreamEventType,
    filter_stream_events,
    invoke_workflow,
    stream_workflow,
)
from src.agents.graph import (
    create_supervised_workflow,
    create_workflow,
    get_compiled_graph,
    get_compiled_graph_with_checkpointer,
)

# Human-in-the-loop interrupts
from src.agents.interrupts import (
    InterruptPoint,
    WorkflowInterruptedError,
    get_interrupt_status,
    get_interruptible_graph,
    resume_workflow,
)

# Error recovery
from src.agents.resilience import (
    create_resilient_node,
    reset_workflow_error_handler,
)

# State types
from src.agents.state import CouncilState, JudgeVerdictState, WorkflowState

__all__ = [
    # Workflow management
    "create_workflow",
    "create_supervised_workflow",
    "get_compiled_graph",
    "get_compiled_graph_with_checkpointer",
    "invoke_workflow",
    "stream_workflow",
    # Streaming helpers
    "StreamEventType",
    "filter_stream_events",
    # Cancellation
    "cancel_workflow",
    "CancellationToken",
    "WorkflowCancelledError",
    # Human-in-the-loop interrupts
    "get_interruptible_graph",
    "resume_workflow",
    "get_interrupt_status",
    "InterruptPoint",
    "WorkflowInterruptedError",
    # Error recovery
    "create_resilient_node",
    "reset_workflow_error_handler",
    # State types
    "WorkflowState",
    "CouncilState",
    "JudgeVerdictState",
]
