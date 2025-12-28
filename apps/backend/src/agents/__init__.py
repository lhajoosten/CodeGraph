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

Key exports:
- WorkflowState: TypedDict for workflow state management
- create_workflow/invoke_workflow: Workflow creation and execution
- Agent nodes: planner_node, coder_node, tester_node, reviewer_node
"""

from src.agents.graph import (
    CancellationToken,
    WorkflowCancelledError,
    cancel_workflow,
    create_workflow,
    get_compiled_graph,
    invoke_workflow,
    stream_workflow,
)
from src.agents.state import CouncilState, JudgeVerdictState, WorkflowState

__all__ = [
    # Workflow management
    "create_workflow",
    "get_compiled_graph",
    "invoke_workflow",
    "stream_workflow",
    "cancel_workflow",
    "CancellationToken",
    "WorkflowCancelledError",
    # State types
    "WorkflowState",
    "CouncilState",
    "JudgeVerdictState",
]
