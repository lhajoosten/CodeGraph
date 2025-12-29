"""Council-based multi-judge code review system.

The council review uses multiple judges (either different model tiers or
different personas on the same model) to provide comprehensive code review.

Components:
- orchestrator: Main council logic and judge coordination
- node: LangGraph node integration
"""

from src.agents.council.node import council_reviewer_node
from src.agents.council.orchestrator import CodeReviewCouncil

__all__ = [
    "CodeReviewCouncil",
    "council_reviewer_node",
]
