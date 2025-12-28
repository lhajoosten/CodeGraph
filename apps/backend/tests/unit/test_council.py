"""Unit tests for council-based code review."""

import pytest

from src.agents.council import (
    MAINTAINABILITY_JUDGE_PROMPT,
    PERFORMANCE_JUDGE_PROMPT,
    SECURITY_JUDGE_PROMPT,
    CodeReviewCouncil,
    CouncilConfig,
    JudgeConfig,
)
from src.agents.state import JudgeVerdictState


class TestJudgeConfig:
    """Tests for JudgeConfig dataclass."""

    def test_create_valid_judge_config(self) -> None:
        """Test creating a valid judge config."""
        config = JudgeConfig(
            name="test_judge",
            persona="Test Expert",
            system_prompt="You are a test expert.",
            model_tier="sonnet",
            weight=0.5,
        )
        assert config.name == "test_judge"
        assert config.persona == "Test Expert"
        assert config.model_tier == "sonnet"
        assert config.weight == 0.5

    def test_judge_config_default_weight(self) -> None:
        """Test that default weight is 0.33."""
        config = JudgeConfig(
            name="test_judge",
            persona="Test Expert",
            system_prompt="Prompt",
            model_tier="haiku",
        )
        assert config.weight == 0.33

    def test_judge_config_invalid_weight_too_high(self) -> None:
        """Test that weight > 1.0 raises error."""
        with pytest.raises(ValueError, match="Weight must be between 0 and 1"):
            JudgeConfig(
                name="test_judge",
                persona="Test Expert",
                system_prompt="Prompt",
                model_tier="sonnet",
                weight=1.5,
            )

    def test_judge_config_invalid_weight_negative(self) -> None:
        """Test that negative weight raises error."""
        with pytest.raises(ValueError, match="Weight must be between 0 and 1"):
            JudgeConfig(
                name="test_judge",
                persona="Test Expert",
                system_prompt="Prompt",
                model_tier="sonnet",
                weight=-0.1,
            )

    def test_judge_config_boundary_weights(self) -> None:
        """Test boundary weight values are accepted."""
        config_zero = JudgeConfig(
            name="test", persona="Test", system_prompt="P", model_tier="haiku", weight=0.0
        )
        config_one = JudgeConfig(
            name="test", persona="Test", system_prompt="P", model_tier="haiku", weight=1.0
        )
        assert config_zero.weight == 0.0
        assert config_one.weight == 1.0


class TestCouncilConfig:
    """Tests for CouncilConfig dataclass."""

    def test_default_local_config(self) -> None:
        """Test default local vLLM configuration."""
        config = CouncilConfig.default_local()

        assert len(config.judges) == 3
        assert config.aggregation_method == "weighted_vote"
        assert config.require_unanimous_reject is True
        assert config.confidence_threshold == 0.7
        assert config.parallel_execution is True

        # Check judge names
        judge_names = [j.name for j in config.judges]
        assert "security_judge" in judge_names
        assert "performance_judge" in judge_names
        assert "maintainability_judge" in judge_names

        # All local judges should have "local" tier
        for judge in config.judges:
            assert judge.model_tier == "local"

    def test_default_cloud_config(self) -> None:
        """Test default Claude API configuration."""
        config = CouncilConfig.default_cloud()

        assert len(config.judges) == 3
        assert config.aggregation_method == "weighted_vote"

        # Check model tiers (should use different models)
        tiers = [j.model_tier for j in config.judges]
        assert "haiku" in tiers
        assert "sonnet" in tiers
        assert "opus" in tiers

    def test_weights_sum_approximately_to_one(self) -> None:
        """Test that judge weights sum to approximately 1.0."""
        for config_factory in [CouncilConfig.default_local, CouncilConfig.default_cloud]:
            config = config_factory()
            total_weight = sum(j.weight for j in config.judges)
            assert 0.99 <= total_weight <= 1.01, f"Weights sum to {total_weight}"

    def test_custom_council_config(self) -> None:
        """Test creating custom council config."""
        judges = [
            JudgeConfig(
                name="custom_judge",
                persona="Custom Expert",
                system_prompt="Custom prompt",
                model_tier="sonnet",
                weight=1.0,
            )
        ]
        config = CouncilConfig(
            judges=judges,
            aggregation_method="unanimous",
            require_unanimous_reject=False,
            confidence_threshold=0.9,
            parallel_execution=False,
        )

        assert len(config.judges) == 1
        assert config.aggregation_method == "unanimous"
        assert config.require_unanimous_reject is False
        assert config.confidence_threshold == 0.9
        assert config.parallel_execution is False


class TestCodeReviewCouncil:
    """Tests for CodeReviewCouncil verdict aggregation."""

    @pytest.fixture
    def council(self) -> CodeReviewCouncil:
        """Create a council instance with local config."""
        return CodeReviewCouncil(config=CouncilConfig.default_local())

    def test_aggregate_unanimous_approve(self, council: CodeReviewCouncil) -> None:
        """Test unanimous APPROVE verdict."""
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.9,
                issues=[],
                reasoning="Code is secure",
                strengths=["Good validation"],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "performance_judge": JudgeVerdictState(
                judge_name="performance_judge",
                persona="Performance Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.85,
                issues=[],
                reasoning="Code is performant",
                strengths=["Efficient algorithms"],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "maintainability_judge": JudgeVerdictState(
                judge_name="maintainability_judge",
                persona="Maintainability Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.95,
                issues=[],
                reasoning="Code is clean",
                strengths=["Good structure"],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        final_verdict, confidence, consensus_type, dissenting = council._aggregate_verdicts(
            verdicts
        )

        assert final_verdict == "APPROVE"
        assert consensus_type == "unanimous"
        assert len(dissenting) == 0
        assert confidence > 0.7  # Should meet threshold

    def test_aggregate_unanimous_reject(self, council: CodeReviewCouncil) -> None:
        """Test unanimous REJECT verdict."""
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="REJECT",
                confidence=0.95,
                issues=[
                    {"severity": "critical", "category": "security", "description": "SQL injection"}
                ],
                reasoning="Critical security issue",
                strengths=[],
                action_items=["Fix SQL injection"],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "performance_judge": JudgeVerdictState(
                judge_name="performance_judge",
                persona="Performance Expert",
                model_tier="local",
                verdict="REJECT",
                confidence=0.9,
                issues=[],
                reasoning="Agrees with rejection",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "maintainability_judge": JudgeVerdictState(
                judge_name="maintainability_judge",
                persona="Maintainability Expert",
                model_tier="local",
                verdict="REJECT",
                confidence=0.85,
                issues=[],
                reasoning="Agrees with rejection",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        final_verdict, confidence, consensus_type, dissenting = council._aggregate_verdicts(
            verdicts
        )

        assert final_verdict == "REJECT"
        assert consensus_type == "unanimous"
        assert len(dissenting) == 0

    def test_aggregate_majority_revise(self, council: CodeReviewCouncil) -> None:
        """Test majority REVISE verdict with one dissent."""
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="REVISE",
                confidence=0.8,
                issues=[
                    {
                        "severity": "major",
                        "category": "security",
                        "description": "Missing validation",
                    }
                ],
                reasoning="Needs security improvements",
                strengths=[],
                action_items=["Add input validation"],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "performance_judge": JudgeVerdictState(
                judge_name="performance_judge",
                persona="Performance Expert",
                model_tier="local",
                verdict="REVISE",
                confidence=0.75,
                issues=[],
                reasoning="Could be optimized",
                strengths=[],
                action_items=["Optimize queries"],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "maintainability_judge": JudgeVerdictState(
                judge_name="maintainability_judge",
                persona="Maintainability Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.7,
                issues=[],
                reasoning="Code is readable",
                strengths=["Good naming"],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        final_verdict, confidence, consensus_type, dissenting = council._aggregate_verdicts(
            verdicts
        )

        assert final_verdict == "REVISE"
        assert "maintainability_judge" in dissenting

    def test_aggregate_non_unanimous_reject_downgrades_to_revise(
        self, council: CodeReviewCouncil
    ) -> None:
        """Test that non-unanimous REJECT is downgraded to REVISE."""
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="REJECT",
                confidence=0.95,
                issues=[{"severity": "critical", "category": "security", "description": "Issue"}],
                reasoning="Critical issue found",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "performance_judge": JudgeVerdictState(
                judge_name="performance_judge",
                persona="Performance Expert",
                model_tier="local",
                verdict="REJECT",
                confidence=0.9,
                issues=[],
                reasoning="Agrees",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "maintainability_judge": JudgeVerdictState(
                judge_name="maintainability_judge",
                persona="Maintainability Expert",
                model_tier="local",
                verdict="REVISE",  # Dissent
                confidence=0.7,
                issues=[],
                reasoning="Can be fixed with revisions",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        # Council requires unanimous reject
        final_verdict, confidence, consensus_type, dissenting = council._aggregate_verdicts(
            verdicts
        )

        # Should downgrade to REVISE since not unanimous
        assert final_verdict == "REVISE"
        assert consensus_type == "dissent"

    def test_aggregate_low_confidence_approve_downgrades_to_revise(
        self, council: CodeReviewCouncil
    ) -> None:
        """Test that low-confidence APPROVE is downgraded to REVISE."""
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.3,  # Very low confidence
                issues=[],
                reasoning="Uncertain approval",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "performance_judge": JudgeVerdictState(
                judge_name="performance_judge",
                persona="Performance Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.4,  # Low confidence
                issues=[],
                reasoning="Uncertain approval",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "maintainability_judge": JudgeVerdictState(
                judge_name="maintainability_judge",
                persona="Maintainability Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.5,  # Low confidence
                issues=[],
                reasoning="Uncertain approval",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        final_verdict, confidence, consensus_type, dissenting = council._aggregate_verdicts(
            verdicts
        )

        # Confidence below 0.7 threshold should downgrade APPROVE to REVISE
        assert final_verdict == "REVISE"
        assert confidence < 0.7

    def test_create_error_verdict(self, council: CodeReviewCouncil) -> None:
        """Test creating error verdict for failed judge."""
        judge = JudgeConfig(
            name="test_judge",
            persona="Test Expert",
            system_prompt="Prompt",
            model_tier="sonnet",
        )

        verdict = council._create_error_verdict(judge, "Connection timeout")

        assert verdict["judge_name"] == "test_judge"
        assert verdict["verdict"] == "REVISE"  # Conservative default
        assert verdict["confidence"] == 0.0
        assert len(verdict["issues"]) == 1
        assert "Connection timeout" in verdict["issues"][0]["description"]

    def test_build_conclusion_format(self, council: CodeReviewCouncil) -> None:
        """Test that conclusion is properly formatted."""
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.9,
                issues=[],
                reasoning="Code is secure",
                strengths=["Good validation"],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        conclusion = council._build_conclusion(verdicts, "APPROVE", 0.9, "unanimous")

        assert "## Council Review Conclusion" in conclusion
        assert "APPROVE" in conclusion
        assert "Security Expert" in conclusion
        assert "90%" in conclusion  # Confidence formatted as percentage


class TestJudgePrompts:
    """Tests for judge system prompts."""

    def test_security_prompt_contains_owasp(self) -> None:
        """Test that security prompt mentions OWASP."""
        assert "OWASP" in SECURITY_JUDGE_PROMPT

    def test_security_prompt_contains_json_schema(self) -> None:
        """Test that security prompt contains JSON schema."""
        assert '"verdict"' in SECURITY_JUDGE_PROMPT
        assert '"confidence"' in SECURITY_JUDGE_PROMPT
        assert '"issues"' in SECURITY_JUDGE_PROMPT

    def test_performance_prompt_contains_complexity(self) -> None:
        """Test that performance prompt mentions complexity analysis."""
        assert "complexity" in PERFORMANCE_JUDGE_PROMPT.lower()
        assert "Big O" in PERFORMANCE_JUDGE_PROMPT

    def test_maintainability_prompt_contains_solid(self) -> None:
        """Test that maintainability prompt mentions SOLID."""
        assert "SOLID" in MAINTAINABILITY_JUDGE_PROMPT

    def test_all_prompts_require_json(self) -> None:
        """Test that all prompts require JSON response."""
        for prompt in [
            SECURITY_JUDGE_PROMPT,
            PERFORMANCE_JUDGE_PROMPT,
            MAINTAINABILITY_JUDGE_PROMPT,
        ]:
            assert "JSON" in prompt
            assert "verdict" in prompt.lower()
