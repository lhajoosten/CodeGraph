"""Cost calculator for estimating API costs.

This module provides cost calculations to show users how much they would be
paying if using cloud LLM APIs instead of local vLLM. Useful for demonstrating
the cost savings of local development.

Pricing is per 1 million tokens and is based on published API pricing
as of December 2025.

Usage:
    # Calculate cost for a single run
    cost = CostCalculator.calculate(
        input_tokens=1500,
        output_tokens=500,
    )
    print(f"Claude Haiku equivalent: ${cost['claude_haiku']:.4f}")

    # Calculate cost comparison for metrics summary
    from src.services.metrics_service import TaskMetricsSummary
    comparison = CostCalculator.calculate_from_metrics(summary)
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class CostBreakdown:
    """Cost breakdown across different providers and models."""

    local_cost: float
    claude_haiku: float
    claude_sonnet: float
    claude_opus: float
    o4_mini: float
    gpt52: float
    o3: float

    def to_dict(self) -> dict[str, float]:
        """Convert to dictionary."""
        return {
            "local_cost": self.local_cost,
            "claude_haiku": self.claude_haiku,
            "claude_sonnet": self.claude_sonnet,
            "claude_opus": self.claude_opus,
            "o4_mini": self.o4_mini,
            "gpt52": self.gpt52,
            "o3": self.o3,
        }


class CostCalculator:
    """Calculator for LLM API cost equivalents.

    Pricing per 1M tokens (as of December 2025):

    Anthropic Claude:
    - Haiku 4.5:  $0.80 input, $4.00 output (fast, economical)
    - Sonnet 4.5: $3.00 input, $15.00 output (balanced)
    - Opus 4.5:   $15.00 input, $75.00 output (most capable)

    OpenAI (tier equivalents - December 2025):
    - o4-mini:  $0.15 input, $0.60 output (Haiku tier - fast/cheap)
    - GPT-5.2:  $3.00 input, $12.00 output (Sonnet tier - workhorse)
    - o3:       $20.00 input, $80.00 output (Opus tier - complex reasoning)
    """

    # Pricing per 1M tokens
    PRICING = {
        # Anthropic (December 2025)
        "claude_haiku": {"input": 0.80, "output": 4.00},
        "claude_sonnet": {"input": 3.00, "output": 15.00},
        "claude_opus": {"input": 15.00, "output": 75.00},
        # OpenAI (December 2025) - tier equivalents
        "o4_mini": {"input": 0.15, "output": 0.60},  # Haiku tier
        "gpt52": {"input": 3.00, "output": 12.00},  # Sonnet tier
        "o3": {"input": 20.00, "output": 80.00},  # Opus tier
    }

    @classmethod
    def calculate(
        cls,
        input_tokens: int,
        output_tokens: int,
    ) -> CostBreakdown:
        """Calculate cost for given token counts.

        Args:
            input_tokens: Number of input/prompt tokens
            output_tokens: Number of output/completion tokens

        Returns:
            CostBreakdown with costs for each provider/model
        """
        # Convert to millions for pricing calculation
        input_millions = input_tokens / 1_000_000
        output_millions = output_tokens / 1_000_000

        return CostBreakdown(
            local_cost=0.0,  # Local inference is free
            claude_haiku=(
                input_millions * cls.PRICING["claude_haiku"]["input"]
                + output_millions * cls.PRICING["claude_haiku"]["output"]
            ),
            claude_sonnet=(
                input_millions * cls.PRICING["claude_sonnet"]["input"]
                + output_millions * cls.PRICING["claude_sonnet"]["output"]
            ),
            claude_opus=(
                input_millions * cls.PRICING["claude_opus"]["input"]
                + output_millions * cls.PRICING["claude_opus"]["output"]
            ),
            o4_mini=(
                input_millions * cls.PRICING["o4_mini"]["input"]
                + output_millions * cls.PRICING["o4_mini"]["output"]
            ),
            gpt52=(
                input_millions * cls.PRICING["gpt52"]["input"]
                + output_millions * cls.PRICING["gpt52"]["output"]
            ),
            o3=(
                input_millions * cls.PRICING["o3"]["input"]
                + output_millions * cls.PRICING["o3"]["output"]
            ),
        )

    @classmethod
    def calculate_total(
        cls,
        input_tokens: int,
        output_tokens: int,
    ) -> dict[str, float]:
        """Calculate costs and return as dictionary.

        Convenience method for JSON serialization.

        Args:
            input_tokens: Number of input/prompt tokens
            output_tokens: Number of output/completion tokens

        Returns:
            Dictionary with cost per provider/model
        """
        breakdown = cls.calculate(input_tokens, output_tokens)
        return breakdown.to_dict()

    @classmethod
    def calculate_from_metrics(
        cls,
        metrics_summary: Any,
    ) -> dict[str, Any]:
        """Calculate costs from a metrics summary object.

        Args:
            metrics_summary: TaskMetricsSummary or PeriodMetricsSummary

        Returns:
            Dictionary with tokens and cost breakdown
        """
        breakdown = cls.calculate(
            input_tokens=metrics_summary.input_tokens,
            output_tokens=metrics_summary.output_tokens,
        )

        return {
            "total_tokens": metrics_summary.total_tokens,
            "input_tokens": metrics_summary.input_tokens,
            "output_tokens": metrics_summary.output_tokens,
            "costs": breakdown.to_dict(),
            "savings": {
                "vs_claude_haiku": breakdown.claude_haiku,
                "vs_claude_sonnet": breakdown.claude_sonnet,
                "vs_claude_opus": breakdown.claude_opus,
                "vs_o4_mini": breakdown.o4_mini,
                "vs_gpt52": breakdown.gpt52,
                "vs_o3": breakdown.o3,
            },
        }

    @classmethod
    def format_cost(cls, amount: float) -> str:
        """Format a cost amount for display.

        Args:
            amount: Cost in USD

        Returns:
            Formatted string (e.g., "$0.0042" or "$1.23")
        """
        if amount < 0.01:
            return f"${amount:.4f}"
        return f"${amount:.2f}"

    @classmethod
    def get_pricing_info(cls) -> dict[str, dict[str, float]]:
        """Get current pricing information.

        Returns:
            Dictionary of pricing per model
        """
        return cls.PRICING.copy()

    @classmethod
    def estimate_monthly_cost(
        cls,
        daily_tokens: int,
        input_ratio: float = 0.67,
    ) -> dict[str, Any]:
        """Estimate monthly costs based on daily token usage.

        Args:
            daily_tokens: Average tokens used per day
            input_ratio: Ratio of input tokens (default 2/3)

        Returns:
            Dictionary with monthly cost estimates per provider
        """
        monthly_tokens = daily_tokens * 30
        input_tokens = int(monthly_tokens * input_ratio)
        output_tokens = monthly_tokens - input_tokens

        breakdown = cls.calculate(input_tokens, output_tokens)
        return {
            "monthly_tokens": monthly_tokens,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "costs": breakdown.to_dict(),
        }
