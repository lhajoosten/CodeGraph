"""Council-based code review with multiple judges.

This module implements a council of judges for code review, where multiple
reviewers (either different models or different personas) independently
review code and their verdicts are aggregated into a final decision.

Phase 3 Features:
- Prompt-based personas for local vLLM (security, performance, maintainability)
- Real multi-model judges for Claude API (haiku, sonnet, opus)
- Parallel judge execution for efficiency
- Weighted voting for verdict aggregation
- Consensus detection and confidence scoring
"""

import asyncio
import time
from dataclasses import dataclass, field
from typing import Literal

from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig

from src.agents.models import ModelFactory
from src.agents.reviewer import (
    create_fallback_verdict,
    parse_structured_verdict,
)
from src.agents.state import CouncilState, JudgeVerdictState
from src.core.config import settings
from src.core.logging import get_logger
from src.services.cost_calculator import CostCalculator

logger = get_logger(__name__)


# =============================================================================
# Judge Persona Definitions
# =============================================================================

SECURITY_JUDGE_PROMPT = """You are a security-focused code reviewer with expertise in:
- OWASP Top 10 vulnerabilities
- Input validation and sanitization
- Authentication and authorization patterns
- SQL injection, XSS, CSRF prevention
- Secrets management and encryption
- Secure coding practices

Focus your review on security vulnerabilities and risks. Be thorough but avoid
false positives. Prioritize issues that could lead to data breaches or unauthorized access.

IMPORTANT: You MUST respond with a valid JSON object following this exact schema:
{
  "summary": "2-3 sentence security-focused summary",
  "verdict": "APPROVE" | "REVISE" | "REJECT",
  "confidence": 0.0 to 1.0,
  "strengths": ["security strength 1", "security strength 2"],
  "issues": [
    {
      "severity": "critical" | "major" | "minor" | "suggestion",
      "category": "security",
      "description": "Clear description of the security issue",
      "file_path": "optional file path",
      "line_number": optional line number,
      "suggested_fix": "How to fix this security issue"
    }
  ],
  "action_items": ["security action 1", "security action 2"],
  "test_coverage_assessment": "Assessment of security test coverage"
}

Always respond with valid JSON only."""

PERFORMANCE_JUDGE_PROMPT = """You are a performance-focused code reviewer with expertise in:
- Algorithm complexity analysis (Big O)
- Database query optimization
- Memory management and leaks
- Caching strategies
- Async/await patterns and concurrency
- Resource utilization

Focus your review on performance issues and optimization opportunities.
Consider both time and space complexity. Identify potential bottlenecks.

IMPORTANT: You MUST respond with a valid JSON object following this exact schema:
{
  "summary": "2-3 sentence performance-focused summary",
  "verdict": "APPROVE" | "REVISE" | "REJECT",
  "confidence": 0.0 to 1.0,
  "strengths": ["performance strength 1", "performance strength 2"],
  "issues": [
    {
      "severity": "critical" | "major" | "minor" | "suggestion",
      "category": "performance",
      "description": "Clear description of the performance issue",
      "file_path": "optional file path",
      "line_number": optional line number,
      "suggested_fix": "How to optimize this"
    }
  ],
  "action_items": ["performance action 1", "performance action 2"],
  "test_coverage_assessment": "Assessment of performance test coverage"
}

Always respond with valid JSON only."""

MAINTAINABILITY_JUDGE_PROMPT = """You are a maintainability-focused code reviewer with expertise in:
- Clean code principles and SOLID
- Code readability and documentation
- Design patterns and architecture
- Error handling and logging
- Type safety and contracts
- Testing best practices

Focus your review on code quality, readability, and long-term maintainability.
Consider how easy it would be for another developer to understand and modify this code.

IMPORTANT: You MUST respond with a valid JSON object following this exact schema:
{
  "summary": "2-3 sentence maintainability-focused summary",
  "verdict": "APPROVE" | "REVISE" | "REJECT",
  "confidence": 0.0 to 1.0,
  "strengths": ["maintainability strength 1", "maintainability strength 2"],
  "issues": [
    {
      "severity": "critical" | "major" | "minor" | "suggestion",
      "category": "maintainability",
      "description": "Clear description of the maintainability issue",
      "file_path": "optional file path",
      "line_number": optional line number,
      "suggested_fix": "How to improve maintainability"
    }
  ],
  "action_items": ["maintainability action 1", "maintainability action 2"],
  "test_coverage_assessment": "Assessment of test quality and coverage"
}

Always respond with valid JSON only."""


@dataclass
class JudgeConfig:
    """Configuration for a single judge in the council."""

    name: str
    persona: str
    system_prompt: str
    model_tier: Literal["haiku", "sonnet", "opus", "local"]
    weight: float = 0.33  # Weight in final verdict calculation

    def __post_init__(self) -> None:
        """Validate weight is in valid range."""
        if not 0.0 <= self.weight <= 1.0:
            raise ValueError(f"Weight must be between 0 and 1, got {self.weight}")


@dataclass
class CouncilConfig:
    """Configuration for the council review process."""

    judges: list[JudgeConfig] = field(default_factory=list)
    aggregation_method: Literal["weighted_vote", "unanimous", "majority"] = "weighted_vote"
    require_unanimous_reject: bool = True  # REJECT only if all judges agree
    confidence_threshold: float = 0.7  # Minimum confidence for APPROVE
    parallel_execution: bool = True  # Run judges in parallel

    @classmethod
    def default_local(cls) -> "CouncilConfig":
        """Create default config for local vLLM (persona-based judges)."""
        return cls(
            judges=[
                JudgeConfig(
                    name="security_judge",
                    persona="Security Expert",
                    system_prompt=SECURITY_JUDGE_PROMPT,
                    model_tier="local",
                    weight=0.35,
                ),
                JudgeConfig(
                    name="performance_judge",
                    persona="Performance Expert",
                    system_prompt=PERFORMANCE_JUDGE_PROMPT,
                    model_tier="local",
                    weight=0.30,
                ),
                JudgeConfig(
                    name="maintainability_judge",
                    persona="Maintainability Expert",
                    system_prompt=MAINTAINABILITY_JUDGE_PROMPT,
                    model_tier="local",
                    weight=0.35,
                ),
            ]
        )

    @classmethod
    def default_cloud(cls) -> "CouncilConfig":
        """Create default config for Claude API (multi-model judges)."""
        return cls(
            judges=[
                JudgeConfig(
                    name="quick_scan",
                    persona="Quick Scanner (Haiku)",
                    system_prompt=SECURITY_JUDGE_PROMPT,  # Haiku focuses on security
                    model_tier="haiku",
                    weight=0.20,
                ),
                JudgeConfig(
                    name="balanced_review",
                    persona="Balanced Reviewer (Sonnet)",
                    system_prompt=MAINTAINABILITY_JUDGE_PROMPT,  # Sonnet on maintainability
                    model_tier="sonnet",
                    weight=0.35,
                ),
                JudgeConfig(
                    name="deep_analysis",
                    persona="Deep Analyzer (Opus)",
                    system_prompt=PERFORMANCE_JUDGE_PROMPT,  # Opus on performance
                    model_tier="opus",
                    weight=0.45,
                ),
            ]
        )


class CodeReviewCouncil:
    """Multi-judge code review council.

    The council convenes multiple judges to review code independently,
    then aggregates their verdicts into a final decision.

    For local vLLM: Uses the same model with different persona prompts.
    For Claude API: Uses different model tiers (haiku, sonnet, opus).

    Example:
        council = CodeReviewCouncil()
        result = await council.convene(
            code="def hello(): print('world')",
            tests="def test_hello(): ...",
            plan="Create a greeting function"
        )
        print(result["final_verdict"])  # APPROVE, REVISE, or REJECT
    """

    def __init__(self, config: CouncilConfig | None = None):
        """Initialize the council with configuration.

        Args:
            config: Council configuration. If None, uses default based on
                    settings.use_local_llm
        """
        if config is None:
            if settings.use_local_llm:
                config = CouncilConfig.default_local()
            else:
                config = CouncilConfig.default_cloud()

        self.config = config
        self.cost_calculator = CostCalculator()

    async def convene(
        self,
        code: str,
        tests: str,
        plan: str,
        config: RunnableConfig | None = None,
    ) -> CouncilState:
        """Convene the council to review code.

        Runs all judges (in parallel if configured) and aggregates their
        verdicts into a final decision.

        Args:
            code: The code to review
            tests: The test suite
            plan: The execution plan for context
            config: Optional LangChain runnable config

        Returns:
            CouncilState with all judge verdicts and final decision
        """
        logger.info(
            "Council convening",
            judge_count=len(self.config.judges),
            llm_mode="local" if settings.use_local_llm else "cloud",
        )

        start_time = time.time()

        # Run judges
        if self.config.parallel_execution:
            verdicts = await self._run_judges_parallel(code, tests, plan, config)
        else:
            verdicts = await self._run_judges_sequential(code, tests, plan, config)

        deliberation_time_ms = int((time.time() - start_time) * 1000)

        # Aggregate verdicts
        final_verdict, confidence, consensus_type, dissenting = self._aggregate_verdicts(verdicts)

        # Build council conclusion text
        council_conclusion = self._build_conclusion(
            verdicts, final_verdict, confidence, consensus_type
        )

        # Calculate total cost
        total_cost = sum(v["cost_usd"] for v in verdicts.values())

        logger.info(
            "Council concluded",
            final_verdict=final_verdict,
            confidence=confidence,
            consensus_type=consensus_type,
            dissenting_count=len(dissenting),
            deliberation_time_ms=deliberation_time_ms,
            total_cost_usd=total_cost,
        )

        return CouncilState(
            judge_verdicts=verdicts,
            council_conclusion=council_conclusion,
            final_verdict=final_verdict,
            confidence_score=confidence,
            consensus_type=consensus_type,
            dissenting_opinions=dissenting,
            deliberation_time_ms=deliberation_time_ms,
            total_cost_usd=total_cost,
            llm_mode="local" if settings.use_local_llm else "cloud",
        )

    async def _run_judges_parallel(
        self,
        code: str,
        tests: str,
        plan: str,
        config: RunnableConfig | None,
    ) -> dict[str, JudgeVerdictState]:
        """Run all judges in parallel."""
        tasks = [
            self._invoke_judge(judge, code, tests, plan, config) for judge in self.config.judges
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        verdicts: dict[str, JudgeVerdictState] = {}
        for judge, result in zip(self.config.judges, results, strict=False):
            if isinstance(result, BaseException):
                logger.error(
                    "Judge failed",
                    judge_name=judge.name,
                    error=str(result),
                )
                # Create a fallback verdict for failed judge
                verdicts[judge.name] = self._create_error_verdict(judge, str(result))
            else:
                # Result is JudgeVerdictState when not an exception
                verdict_state: JudgeVerdictState = result
                verdicts[judge.name] = verdict_state

        return verdicts

    async def _run_judges_sequential(
        self,
        code: str,
        tests: str,
        plan: str,
        config: RunnableConfig | None,
    ) -> dict[str, JudgeVerdictState]:
        """Run judges one at a time (for debugging or rate limiting)."""
        verdicts: dict[str, JudgeVerdictState] = {}

        for judge in self.config.judges:
            try:
                verdict = await self._invoke_judge(judge, code, tests, plan, config)
                verdicts[judge.name] = verdict
            except Exception as e:
                logger.error(
                    "Judge failed",
                    judge_name=judge.name,
                    error=str(e),
                )
                verdicts[judge.name] = self._create_error_verdict(judge, str(e))

        return verdicts

    async def _invoke_judge(
        self,
        judge: JudgeConfig,
        code: str,
        tests: str,
        plan: str,
        config: RunnableConfig | None,
    ) -> JudgeVerdictState:
        """Invoke a single judge to review the code."""
        logger.info(
            "Judge reviewing",
            judge_name=judge.name,
            persona=judge.persona,
            model_tier=judge.model_tier,
        )

        # Create model based on tier
        if judge.model_tier == "local":
            model = ModelFactory.create("sonnet")  # Uses local vLLM
        else:
            model = ModelFactory.create(judge.model_tier)

        # Build the review prompt
        review_prompt = f"""Please provide a focused code review from your expert perspective:

## Generated Code
{code}

## Test Suite
{tests}

## Context (Execution Plan)
{plan}

Review the code from your specialized perspective and provide your verdict in JSON format."""

        # Invoke the model
        start_time = time.time()
        response = await model.ainvoke(
            [
                ("system", judge.system_prompt),
                ("human", review_prompt),
            ],
            config,
        )
        latency_ms = int((time.time() - start_time) * 1000)

        # Extract response content
        raw_content = response.content if isinstance(response, BaseMessage) else str(response)
        if isinstance(raw_content, list):
            response_text = " ".join(str(item) for item in raw_content)
        else:
            response_text = str(raw_content)

        # Parse structured verdict
        structured = parse_structured_verdict(response_text)
        if structured is None:
            logger.warning(
                "Judge returned non-JSON response, using fallback",
                judge_name=judge.name,
            )
            structured = create_fallback_verdict(response_text)

        # Extract usage metadata
        usage_metadata = getattr(response, "usage_metadata", None) or {}
        input_tokens = usage_metadata.get("input_tokens", 0)
        output_tokens = usage_metadata.get("output_tokens", 0)
        total_tokens = input_tokens + output_tokens

        # Calculate cost
        if judge.model_tier == "local":
            cost_usd = 0.0
        else:
            cost_breakdown = self.cost_calculator.calculate(
                input_tokens=input_tokens,
                output_tokens=output_tokens,
            )
            # Map judge model tier to cost breakdown field
            tier_to_cost_field = {
                "haiku": cost_breakdown.claude_haiku,
                "sonnet": cost_breakdown.claude_sonnet,
                "opus": cost_breakdown.claude_opus,
            }
            cost_usd = tier_to_cost_field.get(judge.model_tier, 0.0)

        logger.info(
            "Judge completed",
            judge_name=judge.name,
            verdict=structured.verdict,
            confidence=structured.confidence,
            issue_count=len(structured.issues),
            latency_ms=latency_ms,
            cost_usd=cost_usd,
        )

        return JudgeVerdictState(
            judge_name=judge.name,
            persona=judge.persona,
            model_tier=judge.model_tier,
            verdict=structured.verdict,
            confidence=structured.confidence,
            issues=[
                {
                    "severity": i.severity.value,
                    "category": i.category.value,
                    "description": i.description,
                    "file_path": i.file_path,
                    "line_number": i.line_number,
                    "suggested_fix": i.suggested_fix,
                }
                for i in structured.issues
            ],
            reasoning=structured.summary,
            strengths=structured.strengths,
            action_items=structured.action_items,
            tokens_used=total_tokens,
            latency_ms=latency_ms,
            cost_usd=cost_usd,
        )

    def _create_error_verdict(
        self,
        judge: JudgeConfig,
        error_message: str,
    ) -> JudgeVerdictState:
        """Create a fallback verdict when a judge fails."""
        return JudgeVerdictState(
            judge_name=judge.name,
            persona=judge.persona,
            model_tier=judge.model_tier,
            verdict="REVISE",  # Conservative default
            confidence=0.0,  # No confidence due to error
            issues=[
                {
                    "severity": "critical",
                    "category": "correctness",
                    "description": f"Judge failed to complete review: {error_message}",
                    "file_path": None,
                    "line_number": None,
                    "suggested_fix": "Retry the review",
                }
            ],
            reasoning=f"Judge encountered an error: {error_message}",
            strengths=[],
            action_items=["Retry council review"],
            tokens_used=0,
            latency_ms=0,
            cost_usd=0.0,
        )

    def _aggregate_verdicts(
        self,
        verdicts: dict[str, JudgeVerdictState],
    ) -> tuple[
        Literal["APPROVE", "REVISE", "REJECT"],
        float,
        Literal["unanimous", "majority", "tie_broken", "dissent"],
        list[str],
    ]:
        """Aggregate judge verdicts into final decision.

        Returns:
            Tuple of (final_verdict, confidence, consensus_type, dissenting_judges)
        """
        # Calculate weighted votes for each verdict
        votes: dict[str, float] = {"APPROVE": 0.0, "REVISE": 0.0, "REJECT": 0.0}
        total_weight = 0.0

        judge_config_map = {j.name: j for j in self.config.judges}

        for judge_name, verdict in verdicts.items():
            judge_cfg = judge_config_map.get(judge_name)
            weight = judge_cfg.weight if judge_cfg else 0.33
            # Weight by both config weight and judge's confidence
            effective_weight = weight * verdict["confidence"]
            votes[verdict["verdict"]] += effective_weight
            total_weight += weight

        # Normalize votes
        if total_weight > 0:
            for v in votes:
                votes[v] /= total_weight

        # Determine consensus type and final verdict
        verdict_counts = {
            v: sum(1 for vd in verdicts.values() if vd["verdict"] == v) for v in votes
        }
        all_same = len({vd["verdict"] for vd in verdicts.values()}) == 1

        # Type alias for verdict literal
        VerdictType = Literal["APPROVE", "REVISE", "REJECT"]

        if all_same:
            consensus_type: Literal["unanimous", "majority", "tie_broken", "dissent"] = "unanimous"
            final_verdict: VerdictType = list(verdicts.values())[0]["verdict"]
        elif max(votes.values()) >= 0.5:
            consensus_type = "majority"
            # Get the verdict with highest vote, cast to proper type
            winning_verdict = max(votes.keys(), key=lambda k: votes[k])
            final_verdict = (
                "APPROVE"
                if winning_verdict == "APPROVE"
                else ("REJECT" if winning_verdict == "REJECT" else "REVISE")
            )
        else:
            # Close call - use weights to break tie
            consensus_type = "tie_broken"
            winning_verdict = max(votes.keys(), key=lambda k: votes[k])
            final_verdict = (
                "APPROVE"
                if winning_verdict == "APPROVE"
                else ("REJECT" if winning_verdict == "REJECT" else "REVISE")
            )

        # Special handling for REJECT
        if final_verdict == "REJECT" and self.config.require_unanimous_reject:
            if verdict_counts.get("REJECT", 0) < len(verdicts):
                # Not unanimous REJECT, downgrade to REVISE
                final_verdict = "REVISE"
                consensus_type = "dissent"

        # Identify dissenting judges
        dissenting = [name for name, v in verdicts.items() if v["verdict"] != final_verdict]
        if dissenting:
            consensus_type = "dissent" if consensus_type != "unanimous" else consensus_type

        # Calculate overall confidence
        if total_weight > 0:
            confidence = votes[final_verdict]
        else:
            confidence = 0.5  # Default if no valid weights

        # Apply confidence threshold for APPROVE
        if final_verdict == "APPROVE" and confidence < self.config.confidence_threshold:
            final_verdict = "REVISE"
            consensus_type = "dissent"

        return final_verdict, confidence, consensus_type, dissenting

    def _build_conclusion(
        self,
        verdicts: dict[str, JudgeVerdictState],
        final_verdict: str,
        confidence: float,
        consensus_type: str,
    ) -> str:
        """Build a human-readable conclusion from the council review."""
        lines = [
            "## Council Review Conclusion",
            "",
            f"**Final Verdict:** {final_verdict} (Confidence: {confidence:.0%})",
            f"**Consensus:** {consensus_type.replace('_', ' ').title()}",
            "",
            "### Judge Summaries",
        ]

        for _name, verdict in verdicts.items():
            emoji = {"APPROVE": "✅", "REVISE": "⚠️", "REJECT": "❌"}.get(verdict["verdict"], "❓")
            lines.append("")
            lines.append(f"**{verdict['persona']}** {emoji}")
            lines.append(f"- Verdict: {verdict['verdict']} ({verdict['confidence']:.0%})")
            lines.append(f"- {verdict['reasoning']}")
            if verdict["issues"]:
                lines.append(f"- Issues: {len(verdict['issues'])} found")

        # Aggregate all issues
        all_issues = []
        for v in verdicts.values():
            all_issues.extend(v["issues"])

        if all_issues:
            lines.append("")
            lines.append(f"### Combined Issues ({len(all_issues)} total)")
            critical = [i for i in all_issues if i.get("severity") == "critical"]
            major = [i for i in all_issues if i.get("severity") == "major"]

            if critical:
                lines.append(f"- **Critical:** {len(critical)}")
            if major:
                lines.append(f"- **Major:** {len(major)}")

        # Aggregate action items
        all_actions = []
        for v in verdicts.values():
            all_actions.extend(v["action_items"])

        if all_actions:
            lines.append("")
            lines.append("### Action Items")
            for action in all_actions[:10]:  # Limit to top 10
                lines.append(f"- {action}")

        return "\n".join(lines)
