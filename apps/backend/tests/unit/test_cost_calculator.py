"""Unit tests for CostCalculator service."""

import pytest

from src.services.cost_calculator import CostBreakdown, CostCalculator


class TestCostCalculator:
    """Test suite for CostCalculator."""

    def test_calculate_returns_cost_breakdown(self) -> None:
        """Test that calculate returns a CostBreakdown object."""
        result = CostCalculator.calculate(input_tokens=1000, output_tokens=500)
        assert isinstance(result, CostBreakdown)

    def test_local_cost_is_zero(self) -> None:
        """Test that local cost is always zero."""
        result = CostCalculator.calculate(input_tokens=1000000, output_tokens=500000)
        assert result.local_cost == 0.0

    def test_calculate_with_zero_tokens(self) -> None:
        """Test calculation with zero tokens."""
        result = CostCalculator.calculate(input_tokens=0, output_tokens=0)
        assert result.local_cost == 0.0
        assert result.claude_haiku == 0.0
        assert result.claude_sonnet == 0.0
        assert result.claude_opus == 0.0
        assert result.o4_mini == 0.0
        assert result.gpt52 == 0.0
        assert result.o3 == 0.0

    def test_calculate_claude_haiku_cost(self) -> None:
        """Test Claude Haiku cost calculation."""
        # 1M input + 1M output tokens
        result = CostCalculator.calculate(input_tokens=1_000_000, output_tokens=1_000_000)
        # Input: $0.80/1M, Output: $4.00/1M
        # Total: 0.80 + 4.00 = 4.80
        assert result.claude_haiku == pytest.approx(4.80, rel=0.01)

    def test_calculate_claude_sonnet_cost(self) -> None:
        """Test Claude Sonnet cost calculation."""
        # 1M input + 1M output tokens
        result = CostCalculator.calculate(input_tokens=1_000_000, output_tokens=1_000_000)
        # Input: $3.00/1M, Output: $15.00/1M
        # Total: 3.00 + 15.00 = 18.00
        assert result.claude_sonnet == pytest.approx(18.00, rel=0.01)

    def test_calculate_claude_opus_cost(self) -> None:
        """Test Claude Opus cost calculation."""
        # 1M input + 1M output tokens
        result = CostCalculator.calculate(input_tokens=1_000_000, output_tokens=1_000_000)
        # Input: $15.00/1M, Output: $75.00/1M
        # Total: 15.00 + 75.00 = 90.00
        assert result.claude_opus == pytest.approx(90.00, rel=0.01)

    def test_calculate_o4_mini_cost(self) -> None:
        """Test o4-mini cost calculation (Haiku tier)."""
        # 1M input + 1M output tokens
        result = CostCalculator.calculate(input_tokens=1_000_000, output_tokens=1_000_000)
        # Input: $0.15/1M, Output: $0.60/1M
        # Total: 0.15 + 0.60 = 0.75
        assert result.o4_mini == pytest.approx(0.75, rel=0.01)

    def test_calculate_gpt52_cost(self) -> None:
        """Test GPT-5.2 cost calculation (Sonnet tier)."""
        # 1M input + 1M output tokens
        result = CostCalculator.calculate(input_tokens=1_000_000, output_tokens=1_000_000)
        # Input: $3.00/1M, Output: $12.00/1M
        # Total: 3.00 + 12.00 = 15.00
        assert result.gpt52 == pytest.approx(15.00, rel=0.01)

    def test_calculate_o3_cost(self) -> None:
        """Test o3 cost calculation (Opus tier)."""
        # 1M input + 1M output tokens
        result = CostCalculator.calculate(input_tokens=1_000_000, output_tokens=1_000_000)
        # Input: $20.00/1M, Output: $80.00/1M
        # Total: 20.00 + 80.00 = 100.00
        assert result.o3 == pytest.approx(100.00, rel=0.01)

    def test_calculate_with_realistic_usage(self) -> None:
        """Test calculation with realistic token usage."""
        # 2000 input, 500 output (typical agent call)
        result = CostCalculator.calculate(input_tokens=2000, output_tokens=500)

        # All values should be small but positive
        assert result.local_cost == 0.0
        assert result.claude_haiku > 0
        assert result.claude_sonnet > result.claude_haiku
        assert result.claude_opus > result.claude_sonnet

    def test_to_dict(self) -> None:
        """Test CostBreakdown.to_dict() method."""
        result = CostCalculator.calculate(input_tokens=1000, output_tokens=500)
        dict_result = result.to_dict()

        assert "local_cost" in dict_result
        assert "claude_haiku" in dict_result
        assert "claude_sonnet" in dict_result
        assert "claude_opus" in dict_result
        assert "o4_mini" in dict_result
        assert "gpt52" in dict_result
        assert "o3" in dict_result
        assert all(isinstance(v, float) for v in dict_result.values())

    def test_calculate_total(self) -> None:
        """Test calculate_total returns dictionary."""
        result = CostCalculator.calculate_total(input_tokens=1000, output_tokens=500)
        assert isinstance(result, dict)
        assert "local_cost" in result
        assert "claude_haiku" in result

    def test_format_cost_small(self) -> None:
        """Test cost formatting for small amounts."""
        formatted = CostCalculator.format_cost(0.0042)
        assert formatted == "$0.0042"

    def test_format_cost_large(self) -> None:
        """Test cost formatting for larger amounts."""
        formatted = CostCalculator.format_cost(1.23)
        assert formatted == "$1.23"

    def test_get_pricing_info(self) -> None:
        """Test getting pricing information."""
        pricing = CostCalculator.get_pricing_info()
        assert "claude_haiku" in pricing
        assert "claude_sonnet" in pricing
        assert "claude_opus" in pricing
        assert "o4_mini" in pricing
        assert "gpt52" in pricing
        assert "o3" in pricing

        # Each should have input and output pricing
        for model_pricing in pricing.values():
            assert "input" in model_pricing
            assert "output" in model_pricing

    def test_estimate_monthly_cost(self) -> None:
        """Test monthly cost estimation."""
        # 10,000 tokens per day
        result = CostCalculator.estimate_monthly_cost(daily_tokens=10000)

        assert "monthly_tokens" in result
        assert "input_tokens" in result
        assert "output_tokens" in result
        assert "costs" in result

        # Monthly tokens = 10,000 * 30 = 300,000
        assert result["monthly_tokens"] == 300000

        # Default input ratio is 0.67
        assert result["input_tokens"] == int(300000 * 0.67)
        assert result["output_tokens"] == 300000 - int(300000 * 0.67)

    def test_estimate_monthly_cost_custom_ratio(self) -> None:
        """Test monthly cost estimation with custom input ratio."""
        result = CostCalculator.estimate_monthly_cost(daily_tokens=10000, input_ratio=0.80)

        # Input ratio = 0.80
        assert result["input_tokens"] == int(300000 * 0.80)


class TestCostBreakdown:
    """Test suite for CostBreakdown dataclass."""

    def test_creation(self) -> None:
        """Test creating a CostBreakdown."""
        breakdown = CostBreakdown(
            local_cost=0.0,
            claude_haiku=0.01,
            claude_sonnet=0.05,
            claude_opus=0.15,
            o4_mini=0.002,
            gpt52=0.03,
            o3=0.20,
        )
        assert breakdown.local_cost == 0.0
        assert breakdown.claude_haiku == 0.01

    def test_to_dict_values(self) -> None:
        """Test that to_dict preserves values."""
        breakdown = CostBreakdown(
            local_cost=0.0,
            claude_haiku=0.01,
            claude_sonnet=0.05,
            claude_opus=0.15,
            o4_mini=0.002,
            gpt52=0.03,
            o3=0.20,
        )
        dict_result = breakdown.to_dict()
        assert dict_result["local_cost"] == 0.0
        assert dict_result["claude_haiku"] == 0.01
        assert dict_result["claude_sonnet"] == 0.05
        assert dict_result["claude_opus"] == 0.15
        assert dict_result["o4_mini"] == 0.002
        assert dict_result["gpt52"] == 0.03
        assert dict_result["o3"] == 0.20
