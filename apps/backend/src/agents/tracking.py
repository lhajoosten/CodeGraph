"""Agent execution tracking for LangGraph workflows.

This module provides a callback handler that tracks agent node executions
by persisting AgentRun records to the database. It integrates with
LangGraph's callback system to capture node start/end events.

It also records token usage metrics via MetricsService for analytics
and dashboard display.

Phase 3 Additions:
- Council review tracking with judge verdicts
- Extended metrics (tokens, latency, cost, quality)
- Enhanced output summaries

Usage:
    tracker = AgentRunTracker(db_session, task_id)
    config = {"callbacks": [tracker]}
    result = await graph.ainvoke(state, config)
"""

from datetime import UTC, datetime
from typing import Any

from langchain_core.callbacks import AsyncCallbackHandler
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.agent_run import AgentRun, AgentType
from src.models.council_review import (
    ConsensusType,
    CouncilReview,
    JudgeVerdict,
    LLMMode,
    ReviewVerdict,
)
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

    async def track_council_review(
        self,
        agent_run_id: int | None,
        council_state: dict[str, Any],
    ) -> CouncilReview | None:
        """Track a council review with all judge verdicts.

        Persists the council review and individual judge verdicts
        to the database for history and analytics.

        Args:
            agent_run_id: ID of the reviewer AgentRun (if tracked)
            council_state: Full council state from CodeReviewCouncil.convene()

        Returns:
            Created CouncilReview record, or None if tracking failed
        """
        try:
            # Map verdict strings to enum
            verdict_map = {
                "APPROVE": ReviewVerdict.APPROVE,
                "REVISE": ReviewVerdict.REVISE,
                "REJECT": ReviewVerdict.REJECT,
            }

            consensus_map = {
                "unanimous": ConsensusType.UNANIMOUS,
                "majority": ConsensusType.MAJORITY,
                "tie_broken": ConsensusType.TIE_BROKEN,
                "dissent": ConsensusType.DISSENT,
            }

            llm_mode_map = {
                "local": LLMMode.LOCAL,
                "cloud": LLMMode.CLOUD,
            }

            # Create council review record
            council_review = CouncilReview(
                task_id=self.task_id,
                agent_run_id=agent_run_id,
                final_verdict=verdict_map.get(
                    council_state.get("final_verdict", "REVISE"),
                    ReviewVerdict.REVISE,
                ),
                consensus_type=consensus_map.get(
                    council_state.get("consensus_type", "majority"),
                    ConsensusType.MAJORITY,
                ),
                confidence_score=council_state.get("confidence_score", 0.0),
                deliberation_time_ms=council_state.get("deliberation_time_ms", 0),
                total_cost_usd=council_state.get("total_cost_usd", 0.0),
                llm_mode=llm_mode_map.get(
                    council_state.get("llm_mode", "local"),
                    LLMMode.LOCAL,
                ),
                council_conclusion=council_state.get("council_conclusion"),
                dissenting_opinions=council_state.get("dissenting_opinions", []),
                reviewed_at=datetime.now(UTC),
            )

            # Calculate aggregate issue counts
            total_issues = 0
            critical_issues = 0
            major_issues = 0

            for jv_data in council_state.get("judge_verdicts", {}).values():
                issues = jv_data.get("issues", [])
                total_issues += len(issues)
                for issue in issues:
                    if issue.get("severity") == "critical":
                        critical_issues += 1
                    elif issue.get("severity") == "major":
                        major_issues += 1

            council_review.total_issues = total_issues
            council_review.critical_issues = critical_issues
            council_review.major_issues = major_issues

            self.db.add(council_review)
            await self.db.flush()

            # Create judge verdict records
            for judge_name, jv_data in council_state.get("judge_verdicts", {}).items():
                judge_verdict = JudgeVerdict(
                    council_review_id=council_review.id,
                    judge_name=judge_name,
                    persona=jv_data.get("persona", "unknown"),
                    model_tier=jv_data.get("model_tier", "local"),
                    verdict=verdict_map.get(
                        jv_data.get("verdict", "REVISE"),
                        ReviewVerdict.REVISE,
                    ),
                    confidence=jv_data.get("confidence", 0.0),
                    reasoning=jv_data.get("reasoning"),
                    issues_found=jv_data.get("issues", []),
                    strengths_found=jv_data.get("strengths", []),
                    input_tokens=jv_data.get("input_tokens", 0),
                    output_tokens=jv_data.get("output_tokens", 0),
                    total_tokens=jv_data.get("tokens_used", 0),
                    latency_ms=jv_data.get("latency_ms", 0),
                    cost_usd=jv_data.get("cost_usd", 0.0),
                    judged_at=datetime.now(UTC),
                )
                self.db.add(judge_verdict)

            await self.db.flush()

            logger.info(
                "Tracked council review",
                council_review_id=council_review.id,
                task_id=self.task_id,
                final_verdict=council_state.get("final_verdict"),
                judge_count=len(council_state.get("judge_verdicts", {})),
            )

            return council_review

        except Exception as e:
            logger.error(
                "Failed to track council review",
                task_id=self.task_id,
                error=str(e),
            )
            return None

    async def update_run_metrics(
        self,
        run_id: int,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
        cost_usd: float | None = None,
        first_token_latency_ms: int | None = None,
        total_latency_ms: int | None = None,
        code_quality_score: int | None = None,
        lint_warning_count: int | None = None,
        model_tier: str | None = None,
    ) -> AgentRun | None:
        """Update an AgentRun with extended Phase 3 metrics.

        Args:
            run_id: ID of the AgentRun to update
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            cost_usd: Estimated cost in USD
            first_token_latency_ms: Time to first token
            total_latency_ms: Total execution time
            code_quality_score: Quality score 0-100 (for coder)
            lint_warning_count: Number of lint warnings (for coder)
            model_tier: Model tier used (haiku/sonnet/opus/local)

        Returns:
            Updated AgentRun or None if not found
        """
        try:
            run = await self.db.get(AgentRun, run_id)
            if not run:
                logger.warning("AgentRun not found for metrics update", run_id=run_id)
                return None

            if input_tokens is not None:
                run.input_tokens = input_tokens
            if output_tokens is not None:
                run.output_tokens = output_tokens
            if cost_usd is not None:
                run.cost_usd = cost_usd
            if first_token_latency_ms is not None:
                run.first_token_latency_ms = first_token_latency_ms
            if total_latency_ms is not None:
                run.total_latency_ms = total_latency_ms
            if code_quality_score is not None:
                run.code_quality_score = code_quality_score
            if lint_warning_count is not None:
                run.lint_warning_count = lint_warning_count
            if model_tier is not None:
                run.model_tier = model_tier

            # Update tokens_used as aggregate
            if input_tokens is not None or output_tokens is not None:
                run.tokens_used = (run.input_tokens or 0) + (run.output_tokens or 0)

            await self.db.flush()

            logger.debug(
                "Updated AgentRun metrics",
                run_id=run_id,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost_usd=cost_usd,
            )

            return run

        except Exception as e:
            logger.error(
                "Failed to update AgentRun metrics",
                run_id=run_id,
                error=str(e),
            )
            return None
