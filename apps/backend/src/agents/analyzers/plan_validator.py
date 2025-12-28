"""Plan validation and complexity scoring for execution plans.

This module provides utilities for validating LLM-generated execution plans
and calculating their complexity scores. It helps ensure plans are:
- Well-structured with clear sections and steps
- Actionable with specific success criteria
- Appropriately sized for the task complexity

Example:
    >>> plan = '''
    ... ## Phase 1: Design
    ... 1. Define data models
    ...    - Success: Schema documented
    ... 2. Design API endpoints
    ...    - Success: OpenAPI spec created
    ... '''
    >>> validation = validate_plan(plan)
    >>> validation.is_valid
    True
    >>> validation.complexity.overall_score
    0.35
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from src.core.logging import get_logger

logger = get_logger(__name__)


class ComplexityLevel(str, Enum):
    """Complexity level classification."""

    TRIVIAL = "trivial"  # < 0.2 - Simple one-step tasks
    LOW = "low"  # 0.2 - 0.4 - Basic implementation
    MEDIUM = "medium"  # 0.4 - 0.6 - Standard feature
    HIGH = "high"  # 0.6 - 0.8 - Complex multi-component
    VERY_HIGH = "very_high"  # > 0.8 - Major architectural work


class ValidationSeverity(str, Enum):
    """Severity level for validation issues."""

    ERROR = "error"  # Plan cannot be executed
    WARNING = "warning"  # Plan may have issues
    INFO = "info"  # Suggestion for improvement


@dataclass
class ValidationIssue:
    """A single validation issue found in the plan."""

    message: str
    severity: ValidationSeverity
    location: str | None = None  # e.g., "Step 3", "Phase 2"

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "message": self.message,
            "severity": self.severity.value,
            "location": self.location,
        }


@dataclass
class PlanStep:
    """A single step extracted from the plan."""

    number: int
    content: str
    has_success_criteria: bool = False
    has_dependencies: bool = False
    estimated_complexity: float = 0.0  # 0.0 - 1.0

    @property
    def word_count(self) -> int:
        """Count words in step content."""
        return len(self.content.split())


@dataclass
class PlanSection:
    """A section/phase of the plan."""

    title: str
    steps: list[PlanStep] = field(default_factory=list)
    raw_content: str = ""

    @property
    def step_count(self) -> int:
        """Number of steps in section."""
        return len(self.steps)


@dataclass
class ComplexityScore:
    """Breakdown of plan complexity scoring."""

    step_count_score: float = 0.0  # Based on number of steps
    dependency_score: float = 0.0  # Based on inter-step dependencies
    technical_score: float = 0.0  # Based on technical keywords
    scope_score: float = 0.0  # Based on files/components mentioned
    overall_score: float = 0.0  # Weighted combination
    level: ComplexityLevel = ComplexityLevel.LOW

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "step_count_score": round(self.step_count_score, 3),
            "dependency_score": round(self.dependency_score, 3),
            "technical_score": round(self.technical_score, 3),
            "scope_score": round(self.scope_score, 3),
            "overall_score": round(self.overall_score, 3),
            "level": self.level.value,
        }


@dataclass
class PlanValidation:
    """Complete validation result for a plan."""

    is_valid: bool
    issues: list[ValidationIssue] = field(default_factory=list)
    sections: list[PlanSection] = field(default_factory=list)
    complexity: ComplexityScore = field(default_factory=ComplexityScore)
    total_steps: int = 0
    has_phases: bool = False
    has_success_criteria: bool = False
    is_actionable: bool = True

    @property
    def error_count(self) -> int:
        """Count of error-level issues."""
        return sum(1 for i in self.issues if i.severity == ValidationSeverity.ERROR)

    @property
    def warning_count(self) -> int:
        """Count of warning-level issues."""
        return sum(1 for i in self.issues if i.severity == ValidationSeverity.WARNING)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "is_valid": self.is_valid,
            "is_actionable": self.is_actionable,
            "total_steps": self.total_steps,
            "has_phases": self.has_phases,
            "has_success_criteria": self.has_success_criteria,
            "error_count": self.error_count,
            "warning_count": self.warning_count,
            "issues": [i.to_dict() for i in self.issues],
            "complexity": self.complexity.to_dict(),
            "sections": [{"title": s.title, "step_count": s.step_count} for s in self.sections],
        }


# Patterns for parsing plans
SECTION_PATTERN = re.compile(
    r"^(?:#{1,3}\s*)?(?:Phase\s*\d+[:\s]*|Stage\s*\d+[:\s]*|Part\s*\d+[:\s]*)?(.+?)$",
    re.MULTILINE | re.IGNORECASE,
)
NUMBERED_STEP_PATTERN = re.compile(r"^\s*(\d+)[.)]\s*(.+?)$", re.MULTILINE)
BULLET_STEP_PATTERN = re.compile(r"^\s*[-*]\s*(.+?)$", re.MULTILINE)
SUCCESS_CRITERIA_PATTERN = re.compile(
    r"(?:success|criteria|done when|complete when|verify|test|expected)[:\s]",
    re.IGNORECASE,
)
DEPENDENCY_PATTERN = re.compile(
    r"(?:depends on|after|requires|following|prerequisite|before step)",
    re.IGNORECASE,
)

# Technical complexity indicators
TECHNICAL_KEYWORDS = {
    "high": [
        "database migration",
        "authentication",
        "authorization",
        "security",
        "encryption",
        "async",
        "concurrent",
        "distributed",
        "microservice",
        "api gateway",
        "load balancer",
        "cache invalidation",
        "transaction",
        "rollback",
        "websocket",
        "real-time",
        "machine learning",
        "optimization",
    ],
    "medium": [
        "api",
        "endpoint",
        "database",
        "query",
        "model",
        "schema",
        "validation",
        "error handling",
        "logging",
        "testing",
        "integration",
        "configuration",
        "deployment",
        "docker",
        "redis",
        "queue",
    ],
    "low": [
        "function",
        "class",
        "method",
        "variable",
        "import",
        "file",
        "format",
        "string",
        "list",
        "dict",
        "loop",
        "condition",
    ],
}


def extract_plan_sections(plan: str) -> list[PlanSection]:
    """Extract structured sections from a plan.

    Parses the plan text to identify phases/sections and their steps.

    Args:
        plan: Raw plan text

    Returns:
        List of PlanSection objects
    """
    sections: list[PlanSection] = []

    # Split by common section headers
    section_splits = re.split(
        r"(?:^|\n)(?:#{1,3}\s*)?(?:Phase|Stage|Part|Section)\s*\d*[:\s]*",
        plan,
        flags=re.IGNORECASE,
    )

    # Find section titles
    section_titles = re.findall(
        r"(?:^|\n)(?:#{1,3}\s*)?(?:Phase|Stage|Part|Section)\s*\d*[:\s]*([^\n]+)",
        plan,
        flags=re.IGNORECASE,
    )

    # If no explicit sections, treat entire plan as one section
    if len(section_splits) <= 1:
        section = PlanSection(title="Main", raw_content=plan)
        section.steps = _extract_steps(plan)
        return [section] if section.steps else []

    # Process each section
    for i, content in enumerate(section_splits[1:], 0):
        title = section_titles[i] if i < len(section_titles) else f"Section {i + 1}"
        section = PlanSection(
            title=title.strip(),
            raw_content=content.strip(),
        )
        section.steps = _extract_steps(content)
        if section.steps or content.strip():
            sections.append(section)

    return sections


def _extract_steps(content: str) -> list[PlanStep]:
    """Extract individual steps from section content."""
    steps: list[PlanStep] = []

    # Try numbered steps first
    numbered_matches = list(NUMBERED_STEP_PATTERN.finditer(content))

    if numbered_matches:
        for i, match in enumerate(numbered_matches):
            step_num = int(match.group(1))
            step_content = match.group(2).strip()

            # Get content until next step
            end = numbered_matches[i + 1].start() if i + 1 < len(numbered_matches) else len(content)
            full_content = content[match.start() : end].strip()

            step = PlanStep(
                number=step_num,
                content=step_content,
                has_success_criteria=bool(SUCCESS_CRITERIA_PATTERN.search(full_content)),
                has_dependencies=bool(DEPENDENCY_PATTERN.search(full_content)),
                estimated_complexity=_estimate_step_complexity(full_content),
            )
            steps.append(step)
    else:
        # Fall back to bullet points
        bullet_matches = BULLET_STEP_PATTERN.findall(content)
        for i, match in enumerate(bullet_matches, 1):
            step = PlanStep(
                number=i,
                content=match.strip(),
                has_success_criteria=bool(SUCCESS_CRITERIA_PATTERN.search(match)),
                has_dependencies=bool(DEPENDENCY_PATTERN.search(match)),
                estimated_complexity=_estimate_step_complexity(match),
            )
            steps.append(step)

    return steps


def _estimate_step_complexity(content: str) -> float:
    """Estimate complexity of a single step (0.0 - 1.0)."""
    content_lower = content.lower()
    score = 0.0

    # Check for technical keywords
    for keyword in TECHNICAL_KEYWORDS["high"]:
        if keyword in content_lower:
            score += 0.15

    for keyword in TECHNICAL_KEYWORDS["medium"]:
        if keyword in content_lower:
            score += 0.08

    # Cap at 1.0
    return min(score, 1.0)


def calculate_complexity(plan: str, sections: list[PlanSection]) -> ComplexityScore:
    """Calculate complexity score for a plan.

    The complexity score is a weighted combination of:
    - Step count: More steps = higher complexity
    - Dependencies: More inter-step dependencies = higher complexity
    - Technical keywords: More advanced concepts = higher complexity
    - Scope: More files/components mentioned = higher complexity

    Args:
        plan: Raw plan text
        sections: Extracted plan sections

    Returns:
        ComplexityScore with breakdown and overall score
    """
    plan_lower = plan.lower()
    all_steps = [step for section in sections for step in section.steps]
    total_steps = len(all_steps)

    # Step count score (0-15 steps maps to 0-1)
    step_count_score = min(total_steps / 15, 1.0)

    # Dependency score (percentage of steps with dependencies)
    deps_count = sum(1 for step in all_steps if step.has_dependencies)
    dependency_score = deps_count / max(total_steps, 1)

    # Technical complexity score
    tech_score = 0.0
    for keyword in TECHNICAL_KEYWORDS["high"]:
        if keyword in plan_lower:
            tech_score += 0.1
    for keyword in TECHNICAL_KEYWORDS["medium"]:
        if keyword in plan_lower:
            tech_score += 0.05
    technical_score = min(tech_score, 1.0)

    # Scope score (based on file/component mentions)
    file_mentions = len(re.findall(r"\b\w+\.(py|ts|js|tsx|jsx|sql|yaml|json)\b", plan_lower))
    component_mentions = len(
        re.findall(r"(?:component|service|model|controller|handler|router|schema)", plan_lower)
    )
    scope_score = min((file_mentions + component_mentions) / 10, 1.0)

    # Calculate weighted overall score
    overall_score = (
        step_count_score * 0.25
        + dependency_score * 0.20
        + technical_score * 0.35
        + scope_score * 0.20
    )

    # Determine complexity level
    if overall_score < 0.2:
        level = ComplexityLevel.TRIVIAL
    elif overall_score < 0.4:
        level = ComplexityLevel.LOW
    elif overall_score < 0.6:
        level = ComplexityLevel.MEDIUM
    elif overall_score < 0.8:
        level = ComplexityLevel.HIGH
    else:
        level = ComplexityLevel.VERY_HIGH

    return ComplexityScore(
        step_count_score=step_count_score,
        dependency_score=dependency_score,
        technical_score=technical_score,
        scope_score=scope_score,
        overall_score=overall_score,
        level=level,
    )


def validate_plan(plan: str, min_steps: int = 2, max_steps: int = 20) -> PlanValidation:
    """Validate an execution plan for structure and actionability.

    Checks that the plan:
    - Has a minimum number of steps
    - Is not overly complex (too many steps)
    - Contains actionable items
    - Has success criteria where appropriate
    - Is properly structured

    Args:
        plan: Raw plan text from LLM
        min_steps: Minimum required steps (default: 2)
        max_steps: Maximum recommended steps (default: 20)

    Returns:
        PlanValidation with validation result, issues, and complexity score

    Example:
        >>> result = validate_plan(plan_text)
        >>> if not result.is_valid:
        ...     for issue in result.issues:
        ...         print(f"{issue.severity}: {issue.message}")
    """
    issues: list[ValidationIssue] = []

    # Check for empty or very short plan
    if not plan or len(plan.strip()) < 50:
        issues.append(
            ValidationIssue(
                message="Plan is too short or empty",
                severity=ValidationSeverity.ERROR,
            )
        )
        return PlanValidation(is_valid=False, issues=issues, is_actionable=False)

    # Extract sections and steps
    sections = extract_plan_sections(plan)
    all_steps = [step for section in sections for step in section.steps]
    total_steps = len(all_steps)

    # Check minimum steps
    if total_steps < min_steps:
        issues.append(
            ValidationIssue(
                message=f"Plan has only {total_steps} steps, minimum {min_steps} required",
                severity=ValidationSeverity.ERROR,
            )
        )

    # Check maximum steps (warning, not error)
    if total_steps > max_steps:
        issues.append(
            ValidationIssue(
                message=f"Plan has {total_steps} steps, consider breaking into sub-tasks (max recommended: {max_steps})",
                severity=ValidationSeverity.WARNING,
            )
        )

    # Check for success criteria
    steps_with_criteria = sum(1 for step in all_steps if step.has_success_criteria)
    has_success_criteria = steps_with_criteria > 0

    if not has_success_criteria and total_steps >= 3:
        issues.append(
            ValidationIssue(
                message="Plan lacks success criteria - consider adding verification steps",
                severity=ValidationSeverity.WARNING,
            )
        )

    # Check for very vague steps
    vague_count = 0
    for step in all_steps:
        if step.word_count < 3:
            vague_count += 1
            issues.append(
                ValidationIssue(
                    message=f"Step {step.number} is too vague: '{step.content[:50]}...'",
                    severity=ValidationSeverity.WARNING,
                    location=f"Step {step.number}",
                )
            )

    # Check for phases/structure
    has_phases = len(sections) > 1

    if not has_phases and total_steps > 8:
        issues.append(
            ValidationIssue(
                message="Large plan without phases - consider organizing into sections",
                severity=ValidationSeverity.INFO,
            )
        )

    # Check actionability
    actionable_verbs = [
        "create",
        "implement",
        "add",
        "update",
        "modify",
        "remove",
        "delete",
        "configure",
        "setup",
        "test",
        "verify",
        "deploy",
        "build",
        "write",
        "design",
        "define",
        "refactor",
        "optimize",
        "fix",
        "integrate",
    ]
    plan_lower = plan.lower()
    has_action_verbs = any(verb in plan_lower for verb in actionable_verbs)

    if not has_action_verbs:
        issues.append(
            ValidationIssue(
                message="Plan lacks actionable verbs (create, implement, test, etc.)",
                severity=ValidationSeverity.WARNING,
            )
        )

    # Calculate complexity
    complexity = calculate_complexity(plan, sections)

    # Determine if plan is actionable
    is_actionable = total_steps >= min_steps and vague_count < total_steps / 2 and has_action_verbs

    # Determine overall validity
    is_valid = all(issue.severity != ValidationSeverity.ERROR for issue in issues)

    validation = PlanValidation(
        is_valid=is_valid,
        issues=issues,
        sections=sections,
        complexity=complexity,
        total_steps=total_steps,
        has_phases=has_phases,
        has_success_criteria=has_success_criteria,
        is_actionable=is_actionable,
    )

    logger.debug(
        "Plan validated",
        is_valid=is_valid,
        total_steps=total_steps,
        error_count=validation.error_count,
        warning_count=validation.warning_count,
        complexity_level=complexity.level.value,
    )

    return validation


def needs_refinement(validation: PlanValidation) -> bool:
    """Check if a plan needs refinement before execution.

    A plan needs refinement if:
    - It has validation errors
    - It's not actionable
    - Complexity is very high without proper structure

    Args:
        validation: Result from validate_plan()

    Returns:
        True if plan should be refined
    """
    if not validation.is_valid:
        return True

    if not validation.is_actionable:
        return True

    # Very high complexity without phases needs breaking down
    if validation.complexity.level == ComplexityLevel.VERY_HIGH and not validation.has_phases:
        return True

    return False


def get_refinement_suggestions(validation: PlanValidation) -> list[str]:
    """Generate suggestions for improving a plan.

    Args:
        validation: Result from validate_plan()

    Returns:
        List of actionable suggestions
    """
    suggestions: list[str] = []

    if validation.error_count > 0:
        suggestions.append("Address all error-level issues before proceeding")

    if not validation.is_actionable:
        suggestions.append("Make steps more specific with clear action verbs")

    if not validation.has_success_criteria and validation.total_steps >= 3:
        suggestions.append("Add success criteria to verify each phase is complete")

    if not validation.has_phases and validation.total_steps > 8:
        suggestions.append("Organize steps into phases (Design, Implementation, Testing)")

    if validation.complexity.level == ComplexityLevel.VERY_HIGH:
        suggestions.append("Consider breaking into smaller sub-tasks")

    if validation.warning_count > 3:
        suggestions.append("Review and address warning-level issues for better clarity")

    return suggestions
