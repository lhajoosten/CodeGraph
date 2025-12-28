"""Agent execution tracking for LangGraph workflows.

This module provides a callback handler that tracks agent node executions
by persisting AgentRun records to the database. It integrates with
LangGraph's callback system to capture node start/end events.

It also records token usage metrics via MetricsService for analytics
and dashboard display.

Usage:
    tracker = AgentRunTracker(db_session, task_id)
    config = {"callbacks": [tracker]}
    result = await graph.ainvoke(state, config)
"""

from typing import Any

from langchain_core.callbacks import AsyncCallbackHandler
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.agent_run import AgentType
from src.services.agent_run_service import AgentRunService
from src.services.metrics_service import MetricsService

logger = get_logger(__name__)

# Map node names to AgentType enum
NODE_TO_AGENT_TYPE: dict[str, AgentType] = {
    "planner": AgentType.PLANNER,
    "coder": AgentType.CODER,
    "tester": AgentType.TESTER,
    "reviewer": AgentType.REVIEWER,
}


class AgentRunTracker(AsyncCallbackHandler):
    """Callback handler that tracks agent node executions.

    This handler creates and updates AgentRun records as nodes execute
    in the LangGraph workflow. It tracks:
    - Node start/end times
    - Token usage
    - Output data
    - Errors and timeouts

    Attributes:
        db: Database session for persistence
        task_id: ID of the task being executed
        iteration: Current iteration of the review loop
        active_runs: Map of node names to active AgentRun IDs
    """

    def __init__(
        self,
        db: AsyncSession,
        task_id: int,
        iteration: int = 1,
        model_used: str | None = None,
    ) -> None:
        """Initialize the tracker.

        Args:
            db: Async database session
            task_id: ID of the task being processed
            iteration: Current iteration number
            model_used: Name of the model being used
        """
        super().__init__()
        self.db = db
        self.task_id = task_id
        self.iteration = iteration
        self.model_used = model_used
        self.service = AgentRunService(db)
        self.metrics_service = MetricsService(db)
        self.active_runs: dict[str, int] = {}  # node_name -> run_id

    async def on_chain_start(
        self,
        serialized: dict[str, Any],
        inputs: dict[str, Any],
        *,
        run_id: Any,
        parent_run_id: Any | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> None:
        """Called when a chain (node) starts execution.

        Creates an AgentRun record and marks it as running.

        Args:
            serialized: Serialized chain info
            inputs: Input data to the chain
            run_id: LangChain run ID
            parent_run_id: Parent run ID (if nested)
            tags: Tags for the run
            metadata: Additional metadata
        """
        # Extract node name from serialized data
        node_name = serialized.get("name", "")

        # Only track our agent nodes
        if node_name not in NODE_TO_AGENT_TYPE:
            return

        agent_type = NODE_TO_AGENT_TYPE[node_name]

        # Prepare input data (avoid storing large content)
        input_summary = {
            "task_id": inputs.get("task_id"),
            "task_description": inputs.get("task_description", "")[:200],
            "has_plan": bool(inputs.get("plan")),
            "has_code": bool(inputs.get("code")),
            "has_tests": bool(inputs.get("test_results")),
            "iteration": inputs.get("iterations", 0),
        }

        try:
            # Create and start the run
            run = await self.service.create_run(
                task_id=self.task_id,
                agent_type=agent_type,
                iteration=self.iteration,
                model_used=self.model_used,
                input_data=input_summary,
            )
            await self.service.start_run(run.id)
            self.active_runs[node_name] = run.id

            logger.info(
                "Tracking node start",
                node=node_name,
                run_id=run.id,
                task_id=self.task_id,
            )
        except Exception as e:
            logger.error(
                "Failed to track node start",
                node=node_name,
                task_id=self.task_id,
                error=str(e),
            )

    async def on_chain_end(
        self,
        outputs: dict[str, Any],
        *,
        run_id: Any,
        parent_run_id: Any | None = None,
        tags: list[str] | None = None,
        **kwargs: Any,
    ) -> None:
        """Called when a chain (node) completes execution.

        Updates the AgentRun record with output data and marks it complete.
        Also records token usage metrics for analytics.

        Args:
            outputs: Output data from the chain
            run_id: LangChain run ID
            parent_run_id: Parent run ID (if nested)
            tags: Tags for the run
        """
        # We need to find which node completed
        # Check if any of our tracked nodes match
        for node_name, agent_run_id in list(self.active_runs.items()):
            try:
                # Prepare output summary
                output_summary = self._extract_output_summary(node_name, outputs)

                # Extract verdict for reviewer
                verdict = None
                if node_name == "reviewer":
                    feedback = outputs.get("review_feedback", "")
                    if "APPROVE" in feedback.upper():
                        verdict = "APPROVE"
                    elif "REJECT" in feedback.upper():
                        verdict = "REJECT"
                    elif "REVISE" in feedback.upper():
                        verdict = "REVISE"

                # Extract usage metrics from metadata
                metadata = outputs.get("metadata", {})
                usage_key = f"{node_name}_usage"
                usage_data = metadata.get(usage_key, {})

                # Calculate tokens used for AgentRun
                tokens_used = usage_data.get("total_tokens", 0)

                await self.service.complete_run(
                    run_id=agent_run_id,
                    output_data=output_summary,
                    tokens_used=tokens_used if tokens_used > 0 else None,
                    verdict=verdict,
                    run_metadata={"node_name": node_name},
                )

                # Record usage metrics if available
                if usage_data and node_name in NODE_TO_AGENT_TYPE:
                    try:
                        await self.metrics_service.record_usage(
                            task_id=self.task_id,
                            agent_type=NODE_TO_AGENT_TYPE[node_name],
                            input_tokens=usage_data.get("input_tokens", 0),
                            output_tokens=usage_data.get("output_tokens", 0),
                            model_used=self.model_used or "unknown",
                            latency_ms=usage_data.get("latency_ms", 0),
                            agent_run_id=agent_run_id,
                        )
                        logger.debug(
                            "Recorded usage metrics",
                            node=node_name,
                            task_id=self.task_id,
                            tokens=usage_data.get("total_tokens", 0),
                        )
                    except Exception as metrics_error:
                        logger.warning(
                            "Failed to record usage metrics",
                            node=node_name,
                            error=str(metrics_error),
                        )

                # Remove from active runs
                del self.active_runs[node_name]

                logger.info(
                    "Tracking node end",
                    node=node_name,
                    run_id=agent_run_id,
                    verdict=verdict,
                    tokens_used=tokens_used,
                )

                # Only process one node per callback
                break

            except Exception as e:
                logger.error(
                    "Failed to track node end",
                    node=node_name,
                    run_id=agent_run_id,
                    error=str(e),
                )

    async def on_chain_error(
        self,
        error: BaseException,
        *,
        run_id: Any,
        parent_run_id: Any | None = None,
        tags: list[str] | None = None,
        **kwargs: Any,
    ) -> None:
        """Called when a chain (node) encounters an error.

        Updates the AgentRun record with error information.

        Args:
            error: The exception that occurred
            run_id: LangChain run ID
            parent_run_id: Parent run ID (if nested)
            tags: Tags for the run
        """
        # Mark all active runs as failed
        for node_name, agent_run_id in list(self.active_runs.items()):
            try:
                await self.service.fail_run(
                    run_id=agent_run_id,
                    error_message=str(error)[:1000],
                    run_metadata={"node_name": node_name, "error_type": type(error).__name__},
                )
                del self.active_runs[node_name]

                logger.error(
                    "Tracking node error",
                    node=node_name,
                    run_id=agent_run_id,
                    error=str(error)[:200],
                )
            except Exception as e:
                logger.error(
                    "Failed to track node error",
                    node=node_name,
                    run_id=agent_run_id,
                    tracking_error=str(e),
                )

    def _extract_output_summary(
        self,
        node_name: str,
        outputs: dict[str, Any],
    ) -> dict[str, Any]:
        """Extract a summary of the output data.

        Avoids storing large content while preserving useful metadata.

        Args:
            node_name: Name of the node
            outputs: Full output data

        Returns:
            Summarized output dict
        """
        summary: dict[str, Any] = {"node": node_name}

        if node_name == "planner":
            plan = outputs.get("plan", "")
            summary["plan_length"] = len(plan)
            summary["plan_preview"] = plan[:500] if plan else None

        elif node_name == "coder":
            code = outputs.get("code", "")
            summary["code_length"] = len(code)
            summary["code_preview"] = code[:500] if code else None

        elif node_name == "tester":
            tests = outputs.get("test_results", "")
            summary["tests_length"] = len(tests)
            summary["tests_preview"] = tests[:500] if tests else None

        elif node_name == "reviewer":
            feedback = outputs.get("review_feedback", "")
            summary["feedback_length"] = len(feedback)
            summary["feedback_preview"] = feedback[:500] if feedback else None
            summary["iterations"] = outputs.get("iterations", 0)

        summary["status"] = outputs.get("status")

        return summary

    async def cleanup(self) -> None:
        """Clean up any active runs that didn't complete normally.

        Called when workflow is cancelled or times out.
        """
        for node_name, agent_run_id in list(self.active_runs.items()):
            try:
                await self.service.timeout_run(agent_run_id)
                logger.warning(
                    "Cleaned up incomplete run",
                    node=node_name,
                    run_id=agent_run_id,
                )
            except Exception as e:
                logger.error(
                    "Failed to cleanup run",
                    node=node_name,
                    run_id=agent_run_id,
                    error=str(e),
                )

        self.active_runs.clear()
