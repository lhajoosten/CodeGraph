"""Human-in-the-loop interrupt support for workflow control.

This module provides mechanisms for pausing workflows at specific points
to allow human review, approval, or modification before continuing.

Features:
- Configurable interrupt points (after planning, coding, testing)
- State inspection at interrupt points
- Resume with optional modifications
- Rejection handling

Example:
    # Create interruptible graph
    graph = await get_interruptible_graph(interrupt_before=["coder"])

    # Start workflow - will pause after planner
    config = {"configurable": {"thread_id": f"task-{task_id}"}}
    state = await graph.ainvoke(initial_state, config)

    # Review the plan
    print(state["plan"])

    # Resume with approval
    final_state = await resume_workflow(graph, thread_id, action="approve")
"""

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from src.agents.state import WorkflowState
from src.core.logging import get_logger

if TYPE_CHECKING:
    pass

logger = get_logger(__name__)


class InterruptPoint:
    """Defines points where the workflow can be interrupted for human review.

    Interrupt points allow human-in-the-loop workflows where users can:
    - Review and approve generated plans before coding
    - Review generated code before testing
    - Override reviewer decisions

    Usage:
        # Create workflow with interrupts
        workflow = await get_interruptible_graph(
            interrupt_before=InterruptPoint.for_plan_approval(),
        )

        # Compile with checkpointer (required for interrupts)
        checkpointer = await get_checkpointer()
        graph = workflow.compile(checkpointer=checkpointer, interrupt_before=["coder"])

        # First run - will pause after planner
        result = await graph.ainvoke(state, config)

        # Resume with optional modifications
        modified_state = result.copy()
        modified_state["plan"] = "Modified plan..."
        final_result = await graph.ainvoke(modified_state, config)
    """

    # Standard interrupt points (nodes to interrupt BEFORE)
    AFTER_PLANNING = "coder"  # Interrupt before coder (after plan is ready)
    AFTER_CODING = "tester"  # Interrupt before tester (after code is ready)
    AFTER_TESTING = "reviewer"  # Interrupt before review (after tests ready)
    AFTER_REVIEW = "coder"  # Interrupt before revision (if REVISE verdict)

    @classmethod
    def all_points(cls) -> list[str]:
        """Get all available interrupt points (node names)."""
        return ["coder", "tester", "reviewer"]

    @classmethod
    def for_plan_approval(cls) -> list[str]:
        """Get interrupt points for plan approval workflow.

        Pauses after planning so users can review and approve the plan
        before coding begins.
        """
        return ["coder"]

    @classmethod
    def for_code_review(cls) -> list[str]:
        """Get interrupt points for manual code review workflow.

        Pauses after coding and testing for manual review.
        """
        return ["tester", "reviewer"]

    @classmethod
    def for_full_human_review(cls) -> list[str]:
        """Get all interrupt points for full human-in-the-loop workflow.

        Maximum human oversight - pause at every major stage.
        """
        return cls.all_points()


class WorkflowInterruptedError(Exception):
    """Raised when a workflow is interrupted and waiting for human input.

    This is not an error condition - it indicates the workflow is paused
    and waiting for human review/approval before continuing.

    Attributes:
        interrupt_node: The node where the interrupt occurred
        state: The current workflow state at the interrupt point
        thread_id: The thread ID for resuming the workflow
    """

    def __init__(
        self,
        message: str,
        interrupt_node: str,
        state: WorkflowState,
        thread_id: str,
    ) -> None:
        super().__init__(message)
        self.interrupt_node = interrupt_node
        self.state = state
        self.thread_id = thread_id


def get_interrupt_status(state: WorkflowState) -> dict[str, Any]:
    """Get information about the current interrupt state.

    Useful for determining what user action is needed when a workflow
    is interrupted.

    Args:
        state: Current workflow state

    Returns:
        Dictionary with interrupt context:
        - stage: Current workflow stage (planning, coding, testing, reviewing)
        - awaiting: What type of input is awaited
        - content: The content to review (plan, code, etc.)
        - can_modify: Whether the content can be modified before resuming
        - description: Human-readable description of what's needed
    """
    status = state.get("status", "planning")

    if status == "planning" or (state.get("plan") and not state.get("code")):
        return {
            "stage": "plan_review",
            "awaiting": "plan_approval",
            "content": state.get("plan", ""),
            "can_modify": True,
            "description": "Review and optionally modify the execution plan before coding begins.",
        }
    elif status == "coding" or (state.get("code") and not state.get("test_results")):
        return {
            "stage": "code_review",
            "awaiting": "code_approval",
            "content": state.get("code", ""),
            "code_files": state.get("code_files", {}),
            "can_modify": True,
            "description": "Review generated code before testing.",
        }
    elif status == "testing" or (state.get("test_results") and not state.get("review_feedback")):
        return {
            "stage": "test_review",
            "awaiting": "test_approval",
            "content": state.get("test_results", ""),
            "test_analysis": state.get("test_analysis", {}),
            "can_modify": False,
            "description": "Review test results before final review.",
        }
    elif status == "reviewing":
        return {
            "stage": "review_override",
            "awaiting": "review_decision",
            "content": state.get("review_feedback", ""),
            "verdict": state.get("metadata", {}).get("verdict", ""),
            "can_modify": True,
            "description": "Override the reviewer's decision if needed.",
        }
    else:
        return {
            "stage": "unknown",
            "awaiting": "none",
            "content": "",
            "can_modify": False,
            "description": "Workflow is in an unknown state.",
        }


async def resume_workflow(
    graph: Any,
    thread_id: str,
    modifications: dict[str, Any] | None = None,
    action: str = "continue",
) -> WorkflowState:
    """Resume an interrupted workflow with optional modifications.

    Args:
        graph: The compiled workflow graph (must have checkpointer)
        thread_id: The thread ID of the interrupted workflow
        modifications: Optional state modifications to apply before resuming
        action: The action to take - "continue", "approve", "reject", or "modify"

    Returns:
        The final workflow state after resumption

    Raises:
        ValueError: If thread_id is not found or workflow is not interrupted

    Example:
        # Resume with plan modification
        result = await resume_workflow(
            graph,
            thread_id="task-123",
            modifications={"plan": "Modified plan..."},
            action="modify",
        )

        # Resume with approval (no modifications)
        result = await resume_workflow(
            graph,
            thread_id="task-123",
            action="approve",
        )

        # Reject the workflow
        result = await resume_workflow(
            graph,
            thread_id="task-123",
            action="reject",
        )
    """
    config = {"configurable": {"thread_id": thread_id}}

    # Get current state from checkpoint
    current_state = await graph.aget_state(config)

    if current_state is None:
        raise ValueError(f"No interrupted workflow found for thread_id: {thread_id}")

    # Check if there are pending tasks (interrupted state)
    if not current_state.next:
        logger.warning(
            "Workflow is not in interrupted state",
            thread_id=thread_id,
        )

    # Apply modifications if provided
    if modifications and action in ("modify", "continue"):
        logger.info(
            "Applying modifications to interrupted workflow",
            thread_id=thread_id,
            modified_fields=list(modifications.keys()),
        )
        await graph.aupdate_state(config, modifications)

    # Handle rejection
    if action == "reject":
        await graph.aupdate_state(
            config,
            {
                "status": "cancelled",
                "error": "Workflow rejected by user",
                "metadata": {
                    **current_state.values.get("metadata", {}),
                    "rejected_at": datetime.now(UTC).isoformat(),
                    "rejection_stage": current_state.values.get("status", "unknown"),
                },
            },
        )
        state_snapshot = await graph.aget_state(config)
        # The values from state snapshot are compatible with WorkflowState
        return state_snapshot.values  # type: ignore[no-any-return]

    # Resume execution
    logger.info(
        "Resuming interrupted workflow",
        thread_id=thread_id,
        action=action,
        next_node=current_state.next[0] if current_state.next else "END",
    )

    # Continue execution with None to resume from interrupt
    result: WorkflowState = await graph.ainvoke(None, config)

    return result


async def get_interruptible_graph(
    interrupt_before: list[str] | None = None,
    interrupt_after: list[str] | None = None,
) -> Any:
    """Get a compiled graph with interrupt support for human-in-the-loop workflows.

    Interrupts allow pausing the workflow at specific points for human review
    and approval. The workflow can then be resumed with optional modifications.

    Args:
        interrupt_before: List of node names to interrupt BEFORE execution.
            Common values: ["coder"] for plan approval, ["reviewer"] for code review.
        interrupt_after: List of node names to interrupt AFTER execution.
            Use this when you want to review a node's output before the next step.

    Returns:
        Compiled StateGraph with checkpointing and interrupts enabled

    Raises:
        ConnectionError: If unable to connect to PostgreSQL (checkpointing required)

    Example:
        # Create graph that pauses after planning for approval
        graph = await get_interruptible_graph(interrupt_before=["coder"])

        # Start workflow - will pause after planner completes
        config = {"configurable": {"thread_id": f"task-{task_id}"}}
        state = await graph.ainvoke(initial_state, config)

        # Review the plan...
        print(state["plan"])

        # Resume with approval (or modify plan first)
        final_state = await resume_workflow(graph, thread_id, action="approve")

    Note:
        Interrupts require checkpointing to be enabled. This function automatically
        initializes the AsyncPostgresSaver checkpointer.
    """
    # Import here to avoid circular imports
    from src.agents.graph import create_workflow
    from src.agents.infrastructure.checkpointer import get_checkpointer

    workflow = create_workflow()
    checkpointer = await get_checkpointer()

    # Build compile kwargs
    compile_kwargs: dict[str, Any] = {"checkpointer": checkpointer}

    if interrupt_before:
        compile_kwargs["interrupt_before"] = interrupt_before
        logger.info(
            "Workflow will interrupt before nodes",
            interrupt_before=interrupt_before,
        )

    if interrupt_after:
        compile_kwargs["interrupt_after"] = interrupt_after
        logger.info(
            "Workflow will interrupt after nodes",
            interrupt_after=interrupt_after,
        )

    compiled = workflow.compile(**compile_kwargs)

    logger.info(
        "Compiled interruptible workflow graph",
        has_interrupt_before=bool(interrupt_before),
        has_interrupt_after=bool(interrupt_after),
    )

    return compiled
