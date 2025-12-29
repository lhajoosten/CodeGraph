"""Supervisor node for dynamic workflow orchestration.

The supervisor pattern enables dynamic routing decisions based on the current
workflow state. Instead of fixed edges, the supervisor analyzes the state and
decides which node should execute next.

Use cases:
- Skip testing for simple tasks
- Add extra review cycles for complex changes
- Route to specialized agents based on task type
- Implement adaptive workflows that respond to intermediate results

Example:
    # Create supervised workflow
    workflow = create_supervised_workflow()
    graph = workflow.compile()

    # The supervisor will dynamically route based on state
    result = await graph.ainvoke(initial_state)
"""

from typing import Any, Literal

from langchain_core.runnables import RunnableConfig

from src.agents.state import WorkflowState
from src.core.logging import get_logger

logger = get_logger(__name__)

# Node names for routing
PLANNER = "planner"
CODER = "coder"
TESTER = "tester"
REVIEWER = "reviewer"
END = "__end__"

# Routing decisions
RoutingDecision = Literal["planner", "coder", "tester", "reviewer", "__end__"]


class SupervisorConfig:
    """Configuration for supervisor behavior.

    Attributes:
        skip_tests_for_simple: Skip testing for low-complexity tasks
        extra_review_for_security: Add extra review for security-related code
        max_iterations: Maximum workflow iterations before forcing completion
        complexity_threshold: Threshold for considering a task complex
    """

    skip_tests_for_simple: bool = False
    extra_review_for_security: bool = True
    max_iterations: int = 5
    complexity_threshold: float = 0.6

    # Keywords that trigger extra security review
    SECURITY_KEYWORDS = [
        "auth",
        "password",
        "token",
        "encrypt",
        "decrypt",
        "secret",
        "credential",
        "permission",
        "role",
        "access",
        "sql",
        "injection",
        "xss",
        "csrf",
    ]

    @classmethod
    def has_security_concerns(cls, task_description: str, code: str) -> bool:
        """Check if the code has security-related concerns."""
        text = (task_description + " " + code).lower()
        return any(keyword in text for keyword in cls.SECURITY_KEYWORDS)


def get_next_node(state: WorkflowState, config: SupervisorConfig | None = None) -> RoutingDecision:
    """Determine the next node based on current workflow state.

    This is the core supervisor logic that analyzes the state and decides
    which node should execute next.

    Args:
        state: Current workflow state
        config: Optional supervisor configuration

    Returns:
        The name of the next node to execute, or "__end__" to finish
    """
    config = config or SupervisorConfig()
    status = state.get("status", "planning")
    iterations = state.get("iterations", 0)
    metadata = state.get("metadata", {})

    # Check iteration limit
    if iterations >= config.max_iterations:
        logger.warning(
            "Max iterations reached, forcing completion",
            iterations=iterations,
            max_iterations=config.max_iterations,
        )
        return END

    # Check for error state
    if state.get("error"):
        logger.info("Error detected, ending workflow")
        return END

    # Route based on current status
    if status == "planning":
        # Need a plan first
        if not state.get("plan"):
            return PLANNER
        # Plan exists, move to coding
        return CODER

    elif status == "coding":
        # Need code
        if not state.get("code"):
            return CODER

        # Check if we should skip tests for simple tasks
        if config.skip_tests_for_simple:
            complexity = metadata.get("plan_validation", {}).get("complexity", {})
            complexity_score = complexity.get("overall_score", 0.5)
            if complexity_score < 0.3:
                logger.info(
                    "Skipping tests for simple task",
                    complexity_score=complexity_score,
                )
                return REVIEWER

        # Code exists, move to testing
        return TESTER

    elif status == "testing":
        # Need tests
        if not state.get("test_results"):
            return TESTER
        # Tests exist, move to review
        return REVIEWER

    elif status == "reviewing":
        # Need review
        if not state.get("review_feedback"):
            return REVIEWER

        # Check verdict
        verdict = metadata.get("verdict", "")
        if not verdict:
            feedback = state.get("review_feedback", "").upper()
            if "APPROVE" in feedback:
                verdict = "APPROVE"
            elif "REVISE" in feedback:
                verdict = "REVISE"
            elif "REJECT" in feedback:
                verdict = "REJECT"

        if verdict == "APPROVE":
            return END
        elif verdict == "REJECT":
            return END
        elif verdict == "REVISE":
            # Check for security concerns before revision
            if config.extra_review_for_security:
                task_desc = state.get("task_description", "")
                code = state.get("code", "")
                if SupervisorConfig.has_security_concerns(task_desc, code):
                    logger.info("Security concerns detected, extra review recommended")
                    # Add note to metadata
                    state.setdefault("metadata", {})["security_review_recommended"] = True
            # Go back to coder for revisions
            return CODER
        else:
            # Unknown verdict, end workflow
            logger.warning("Unknown verdict, ending workflow", verdict=verdict)
            return END

    elif status == "complete":
        return END

    else:
        # Unknown status
        logger.warning("Unknown status, starting from planner", status=status)
        return PLANNER


async def supervisor_node(
    state: WorkflowState, config: RunnableConfig | None = None
) -> dict[str, Any]:
    """Supervisor node that determines workflow routing.

    This node doesn't perform any actual work - it analyzes the state
    and returns routing information that the graph uses for conditional edges.

    Args:
        state: Current workflow state
        config: Optional RunnableConfig

    Returns:
        Dictionary with routing information in metadata
    """
    supervisor_config = SupervisorConfig()
    next_node = get_next_node(state, supervisor_config)

    logger.info(
        "Supervisor routing decision",
        task_id=state.get("task_id"),
        current_status=state.get("status"),
        next_node=next_node,
        iterations=state.get("iterations", 0),
    )

    # Return metadata with routing decision
    return {
        "metadata": {
            **(state.get("metadata", {})),
            "supervisor_decision": next_node,
            "supervisor_iteration": state.get("iterations", 0) + 1,
        }
    }


def create_supervisor_router(config: SupervisorConfig | None = None):
    """Create a routing function for supervised workflow edges.

    This creates a function that can be used with add_conditional_edges
    to implement supervisor-based routing.

    Args:
        config: Optional supervisor configuration

    Returns:
        A routing function for use with conditional edges

    Example:
        router = create_supervisor_router()
        workflow.add_conditional_edges("supervisor", router)
    """
    config = config or SupervisorConfig()

    def router(state: WorkflowState) -> str:
        """Route to next node based on supervisor decision."""
        # Check if supervisor already made a decision
        decision = state.get("metadata", {}).get("supervisor_decision")
        if decision:
            return decision

        # Otherwise, compute routing
        return get_next_node(state, config)

    return router


# Convenience function for determining if task is simple
def is_simple_task(state: WorkflowState) -> bool:
    """Check if the task is considered simple based on validation.

    Args:
        state: Current workflow state

    Returns:
        True if the task is simple (low complexity, few steps)
    """
    metadata = state.get("metadata", {})
    validation = metadata.get("plan_validation", {})
    complexity = validation.get("complexity", {})

    complexity_score = complexity.get("overall_score", 0.5)
    total_steps = validation.get("total_steps", 5)

    return complexity_score < 0.3 and total_steps <= 3


def should_skip_tests(state: WorkflowState) -> bool:
    """Check if tests can be skipped for this task.

    Args:
        state: Current workflow state

    Returns:
        True if tests can be safely skipped
    """
    # Never skip tests for security-related code
    task_desc = state.get("task_description", "")
    code = state.get("code", "")
    if SupervisorConfig.has_security_concerns(task_desc, code):
        return False

    # Skip for simple tasks
    return is_simple_task(state)


def needs_extra_review(state: WorkflowState) -> bool:
    """Check if this task needs extra review.

    Args:
        state: Current workflow state

    Returns:
        True if extra review is recommended
    """
    # Security concerns need extra review
    task_desc = state.get("task_description", "")
    code = state.get("code", "")
    if SupervisorConfig.has_security_concerns(task_desc, code):
        return True

    # High complexity needs extra review
    metadata = state.get("metadata", {})
    validation = metadata.get("plan_validation", {})
    complexity = validation.get("complexity", {})
    complexity_score = complexity.get("overall_score", 0.5)

    return complexity_score > 0.7
