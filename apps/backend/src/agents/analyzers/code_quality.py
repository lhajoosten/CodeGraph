"""Code quality analyzer for generated code evaluation.

This module provides static analysis capabilities for evaluating the quality
of generated code. It analyzes various aspects including:
- Cyclomatic complexity
- Documentation coverage (docstrings)
- Type hint completeness
- Security issues
- Performance anti-patterns
- Style violations

Features:
- Comprehensive quality scoring (0-100)
- Issue categorization by severity
- Actionable recommendations
- Integration with model tier selection

Usage:
    analyzer = CodeQualityAnalyzer()
    result = analyzer.analyze(source_code)
    print(f"Quality Score: {result.overall_score}")
    for issue in result.issues:
        print(f"{issue.severity}: {issue.message}")
"""

import ast
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from src.core.logging import get_logger

logger = get_logger(__name__)


class IssueSeverity(str, Enum):
    """Severity levels for code issues."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class IssueCategory(str, Enum):
    """Categories of code issues."""

    SECURITY = "security"
    PERFORMANCE = "performance"
    MAINTAINABILITY = "maintainability"
    CORRECTNESS = "correctness"
    STYLE = "style"
    DOCUMENTATION = "documentation"
    TYPE_SAFETY = "type_safety"


@dataclass
class CodeIssue:
    """A single code quality issue.

    Attributes:
        category: Issue category
        severity: Issue severity level
        message: Description of the issue
        line_number: Line where issue was found (0 if N/A)
        suggestion: Recommended fix
        code_snippet: Relevant code snippet
    """

    category: IssueCategory
    severity: IssueSeverity
    message: str
    line_number: int = 0
    suggestion: str = ""
    code_snippet: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "category": self.category.value,
            "severity": self.severity.value,
            "message": self.message,
            "line_number": self.line_number,
            "suggestion": self.suggestion,
        }


@dataclass
class ComplexityMetrics:
    """Cyclomatic complexity metrics for code.

    Attributes:
        total_complexity: Sum of complexity for all functions
        max_function_complexity: Highest complexity in any single function
        average_complexity: Average complexity per function
        complex_functions: List of functions exceeding threshold
        complexity_by_function: Dict mapping function names to complexity
    """

    total_complexity: int = 0
    max_function_complexity: int = 0
    average_complexity: float = 0.0
    complex_functions: list[str] = field(default_factory=list)
    complexity_by_function: dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "total_complexity": self.total_complexity,
            "max_function_complexity": self.max_function_complexity,
            "average_complexity": round(self.average_complexity, 2),
            "complex_functions": self.complex_functions,
        }


@dataclass
class DocumentationMetrics:
    """Documentation coverage metrics.

    Attributes:
        total_items: Total documentable items (functions, classes)
        documented_items: Items with docstrings
        coverage_percentage: Percentage of items documented
        missing_docstrings: List of undocumented items
    """

    total_items: int = 0
    documented_items: int = 0
    coverage_percentage: float = 0.0
    missing_docstrings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "total_items": self.total_items,
            "documented_items": self.documented_items,
            "coverage_percentage": round(self.coverage_percentage, 1),
            "missing_docstrings": self.missing_docstrings[:5],  # Top 5
        }


@dataclass
class TypeHintMetrics:
    """Type hint coverage metrics.

    Attributes:
        total_parameters: Total function parameters
        typed_parameters: Parameters with type hints
        total_return_types: Functions that should have return types
        typed_return_types: Functions with return type hints
        coverage_percentage: Overall type hint coverage
        untyped_items: List of items missing type hints
    """

    total_parameters: int = 0
    typed_parameters: int = 0
    total_return_types: int = 0
    typed_return_types: int = 0
    coverage_percentage: float = 0.0
    untyped_items: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "total_parameters": self.total_parameters,
            "typed_parameters": self.typed_parameters,
            "total_return_types": self.total_return_types,
            "typed_return_types": self.typed_return_types,
            "coverage_percentage": round(self.coverage_percentage, 1),
        }


@dataclass
class QualityAnalysisResult:
    """Complete code quality analysis result.

    Attributes:
        overall_score: Composite quality score (0-100)
        complexity: Cyclomatic complexity metrics
        documentation: Documentation coverage metrics
        type_hints: Type hint coverage metrics
        issues: List of detected issues
        recommendations: Prioritized improvement suggestions
        grade: Letter grade (A-F)
    """

    overall_score: float = 0.0
    complexity: ComplexityMetrics = field(default_factory=ComplexityMetrics)
    documentation: DocumentationMetrics = field(default_factory=DocumentationMetrics)
    type_hints: TypeHintMetrics = field(default_factory=TypeHintMetrics)
    issues: list[CodeIssue] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)
    grade: str = "F"

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "overall_score": round(self.overall_score, 1),
            "grade": self.grade,
            "complexity": self.complexity.to_dict(),
            "documentation": self.documentation.to_dict(),
            "type_hints": self.type_hints.to_dict(),
            "issues": [i.to_dict() for i in self.issues],
            "recommendations": self.recommendations[:5],  # Top 5
            "issue_counts": {
                "critical": sum(1 for i in self.issues if i.severity == IssueSeverity.CRITICAL),
                "high": sum(1 for i in self.issues if i.severity == IssueSeverity.HIGH),
                "medium": sum(1 for i in self.issues if i.severity == IssueSeverity.MEDIUM),
                "low": sum(1 for i in self.issues if i.severity == IssueSeverity.LOW),
            },
        }


# Security patterns to detect
SECURITY_PATTERNS = [
    {
        "pattern": r"exec\s*\(",
        "message": "Use of exec() can lead to code injection",
        "severity": IssueSeverity.CRITICAL,
    },
    {
        "pattern": r"eval\s*\(",
        "message": "Use of eval() can lead to code injection",
        "severity": IssueSeverity.CRITICAL,
    },
    {
        "pattern": r"os\.system\s*\(",
        "message": "Use of os.system() is vulnerable to shell injection",
        "severity": IssueSeverity.HIGH,
    },
    {
        "pattern": r"subprocess\.(?:call|run|Popen)\s*\([^)]*shell\s*=\s*True",
        "message": "subprocess with shell=True is vulnerable to injection",
        "severity": IssueSeverity.HIGH,
    },
    {
        "pattern": r"pickle\.loads?\s*\(",
        "message": "Unpickling data can lead to code execution",
        "severity": IssueSeverity.HIGH,
    },
    {
        "pattern": r"yaml\.load\s*\([^)]*(?!Loader)",
        "message": "yaml.load without Loader parameter is unsafe",
        "severity": IssueSeverity.HIGH,
    },
    {
        "pattern": r'password\s*=\s*["\'][^"\']+["\']',
        "message": "Hardcoded password detected",
        "severity": IssueSeverity.CRITICAL,
    },
    {
        "pattern": r"api_key\s*=\s*[\"'][^\"']+[\"']",
        "message": "Hardcoded API key detected",
        "severity": IssueSeverity.CRITICAL,
    },
]

# Performance anti-patterns
PERFORMANCE_PATTERNS = [
    {
        "pattern": r"for\s+\w+\s+in\s+range\(len\(",
        "message": "Use enumerate() instead of range(len())",
        "severity": IssueSeverity.LOW,
    },
    {
        "pattern": r"\+\s*=\s*.*\+",
        "message": "String concatenation in loop may be inefficient",
        "severity": IssueSeverity.LOW,
    },
    {
        "pattern": r"\.append\([^)]+\)\s*$",
        "message": "Consider list comprehension instead of repeated append",
        "severity": IssueSeverity.INFO,
    },
]


class CodeQualityAnalyzer:
    """Analyzer for evaluating code quality.

    Performs static analysis on Python code to calculate quality metrics
    and detect potential issues.

    Attributes:
        complexity_threshold: Threshold for flagging complex functions
        min_docstring_coverage: Minimum expected docstring coverage
        min_type_coverage: Minimum expected type hint coverage
    """

    # Scoring weights
    WEIGHTS = {
        "complexity": 0.20,  # 20% - lower is better
        "documentation": 0.25,  # 25%
        "type_hints": 0.20,  # 20%
        "security": 0.25,  # 25%
        "style": 0.10,  # 10%
    }

    # Grade thresholds
    GRADE_THRESHOLDS = [
        (90, "A"),
        (80, "B"),
        (70, "C"),
        (60, "D"),
        (0, "F"),
    ]

    def __init__(
        self,
        complexity_threshold: int = 10,
        min_docstring_coverage: float = 80.0,
        min_type_coverage: float = 80.0,
    ) -> None:
        """Initialize the analyzer.

        Args:
            complexity_threshold: Max complexity before flagging
            min_docstring_coverage: Minimum docstring coverage target
            min_type_coverage: Minimum type hint coverage target
        """
        self.complexity_threshold = complexity_threshold
        self.min_docstring_coverage = min_docstring_coverage
        self.min_type_coverage = min_type_coverage

    def analyze(self, source_code: str) -> QualityAnalysisResult:
        """Perform complete quality analysis on source code.

        Args:
            source_code: Python source code to analyze

        Returns:
            QualityAnalysisResult with all metrics and issues
        """
        result = QualityAnalysisResult()

        # Try to parse the code
        try:
            tree = ast.parse(source_code)
        except SyntaxError as e:
            result.issues.append(
                CodeIssue(
                    category=IssueCategory.CORRECTNESS,
                    severity=IssueSeverity.CRITICAL,
                    message=f"Syntax error: {e}",
                    line_number=e.lineno or 0,
                )
            )
            result.overall_score = 0
            result.grade = "F"
            return result

        # Calculate metrics
        result.complexity = self._calculate_complexity(tree)
        result.documentation = self._analyze_documentation(tree)
        result.type_hints = self._analyze_type_coverage(tree)

        # Detect issues
        security_issues = self._detect_security_issues(source_code)
        performance_issues = self._detect_performance_issues(source_code)
        style_issues = self._detect_style_issues(tree, source_code)

        result.issues.extend(security_issues)
        result.issues.extend(performance_issues)
        result.issues.extend(style_issues)

        # Calculate overall score
        result.overall_score = self._calculate_overall_score(result)
        result.grade = self._calculate_grade(result.overall_score)

        # Generate recommendations
        result.recommendations = self._generate_recommendations(result)

        logger.info(
            "Code quality analysis complete",
            score=result.overall_score,
            grade=result.grade,
            issue_count=len(result.issues),
        )

        return result

    def _calculate_complexity(self, tree: ast.AST) -> ComplexityMetrics:
        """Calculate cyclomatic complexity metrics.

        Args:
            tree: Parsed AST

        Returns:
            ComplexityMetrics
        """
        metrics = ComplexityMetrics()
        complexities: dict[str, int] = {}

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
                complexity = self._function_complexity(node)
                func_name = node.name
                complexities[func_name] = complexity

                if complexity > self.complexity_threshold:
                    metrics.complex_functions.append(f"{func_name} ({complexity})")

        if complexities:
            metrics.complexity_by_function = complexities
            metrics.total_complexity = sum(complexities.values())
            metrics.max_function_complexity = max(complexities.values())
            metrics.average_complexity = metrics.total_complexity / len(complexities)

        return metrics

    def _function_complexity(self, node: ast.FunctionDef | ast.AsyncFunctionDef) -> int:
        """Calculate cyclomatic complexity for a function.

        Complexity = 1 + number of decision points
        Decision points: if, elif, for, while, except, and, or, ternary
        """
        complexity = 1  # Base complexity

        for child in ast.walk(node):
            if isinstance(child, ast.If | ast.While | ast.For | ast.AsyncFor):
                complexity += 1
            elif isinstance(child, ast.ExceptHandler):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                # and/or add complexity
                complexity += len(child.values) - 1
            elif isinstance(child, ast.IfExp):
                # Ternary expression
                complexity += 1
            elif isinstance(child, ast.comprehension):
                # List/dict/set comprehension with if
                complexity += len(child.ifs)

        return complexity

    def _analyze_documentation(self, tree: ast.AST) -> DocumentationMetrics:
        """Analyze docstring coverage.

        Args:
            tree: Parsed AST

        Returns:
            DocumentationMetrics
        """
        metrics = DocumentationMetrics()
        missing: list[str] = []

        for node in ast.iter_child_nodes(tree):
            # Check module docstring
            if isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant):
                if isinstance(node.value.value, str):
                    metrics.documented_items += 1
                    metrics.total_items += 1

            # Check functions and classes
            if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef):
                metrics.total_items += 1
                if ast.get_docstring(node):
                    metrics.documented_items += 1
                else:
                    missing.append(node.name)

                # Check methods inside classes
                if isinstance(node, ast.ClassDef):
                    for item in node.body:
                        if isinstance(item, ast.FunctionDef | ast.AsyncFunctionDef):
                            metrics.total_items += 1
                            if ast.get_docstring(item):
                                metrics.documented_items += 1
                            else:
                                missing.append(f"{node.name}.{item.name}")

        metrics.missing_docstrings = missing
        if metrics.total_items > 0:
            metrics.coverage_percentage = (metrics.documented_items / metrics.total_items) * 100

        return metrics

    def _analyze_type_coverage(self, tree: ast.AST) -> TypeHintMetrics:
        """Analyze type hint coverage.

        Args:
            tree: Parsed AST

        Returns:
            TypeHintMetrics
        """
        metrics = TypeHintMetrics()
        untyped: list[str] = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
                # Check return type
                metrics.total_return_types += 1
                if node.returns is not None:
                    metrics.typed_return_types += 1
                else:
                    untyped.append(f"{node.name} return type")

                # Check parameters (skip self, cls)
                for arg in node.args.args:
                    if arg.arg not in ("self", "cls"):
                        metrics.total_parameters += 1
                        if arg.annotation is not None:
                            metrics.typed_parameters += 1
                        else:
                            untyped.append(f"{node.name}.{arg.arg}")

        metrics.untyped_items = untyped
        total = metrics.total_parameters + metrics.total_return_types
        typed = metrics.typed_parameters + metrics.typed_return_types
        if total > 0:
            metrics.coverage_percentage = (typed / total) * 100

        return metrics

    def _detect_security_issues(self, source_code: str) -> list[CodeIssue]:
        """Detect security issues using pattern matching.

        Args:
            source_code: Source code to analyze

        Returns:
            List of security issues
        """
        issues: list[CodeIssue] = []
        lines = source_code.splitlines()

        for pattern_info in SECURITY_PATTERNS:
            pattern = re.compile(str(pattern_info["pattern"]), re.IGNORECASE)
            severity = pattern_info["severity"]
            assert isinstance(severity, IssueSeverity)  # nosec B101
            for i, line in enumerate(lines):
                if pattern.search(line):
                    issues.append(
                        CodeIssue(
                            category=IssueCategory.SECURITY,
                            severity=severity,
                            message=str(pattern_info["message"]),
                            line_number=i + 1,
                            code_snippet=line.strip()[:80],
                        )
                    )

        return issues

    def _detect_performance_issues(self, source_code: str) -> list[CodeIssue]:
        """Detect performance anti-patterns.

        Args:
            source_code: Source code to analyze

        Returns:
            List of performance issues
        """
        issues: list[CodeIssue] = []
        lines = source_code.splitlines()

        for pattern_info in PERFORMANCE_PATTERNS:
            pattern = re.compile(str(pattern_info["pattern"]))
            severity = pattern_info["severity"]
            assert isinstance(severity, IssueSeverity)  # nosec B101
            for i, line in enumerate(lines):
                if pattern.search(line):
                    issues.append(
                        CodeIssue(
                            category=IssueCategory.PERFORMANCE,
                            severity=severity,
                            message=str(pattern_info["message"]),
                            line_number=i + 1,
                        )
                    )

        return issues

    def _detect_style_issues(self, tree: ast.AST, source_code: str) -> list[CodeIssue]:
        """Detect style issues.

        Args:
            tree: Parsed AST
            source_code: Source code

        Returns:
            List of style issues
        """
        issues: list[CodeIssue] = []

        # Check for very long lines
        for i, line in enumerate(source_code.splitlines()):
            if len(line) > 120:
                issues.append(
                    CodeIssue(
                        category=IssueCategory.STYLE,
                        severity=IssueSeverity.LOW,
                        message=f"Line exceeds 120 characters ({len(line)})",
                        line_number=i + 1,
                    )
                )

        # Check for bare except
        for node in ast.walk(tree):
            if isinstance(node, ast.ExceptHandler) and node.type is None:
                issues.append(
                    CodeIssue(
                        category=IssueCategory.STYLE,
                        severity=IssueSeverity.MEDIUM,
                        message="Bare except clause catches all exceptions",
                        line_number=node.lineno,
                        suggestion="Specify exception type or use 'except Exception:'",
                    )
                )

        # Check for mutable default arguments
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
                for default in node.args.defaults + node.args.kw_defaults:
                    if default and isinstance(default, ast.List | ast.Dict | ast.Set):
                        issues.append(
                            CodeIssue(
                                category=IssueCategory.CORRECTNESS,
                                severity=IssueSeverity.HIGH,
                                message="Mutable default argument",
                                line_number=node.lineno,
                                suggestion="Use None and initialize in function body",
                            )
                        )

        return issues

    def _calculate_overall_score(self, result: QualityAnalysisResult) -> float:
        """Calculate overall quality score.

        Args:
            result: Analysis result with metrics

        Returns:
            Score from 0 to 100
        """
        scores: dict[str, float] = {}

        # Complexity score (inverse - lower is better)
        if result.complexity.average_complexity > 0:
            complexity_score = max(0, 100 - (result.complexity.average_complexity - 1) * 10)
        else:
            complexity_score = 100
        scores["complexity"] = complexity_score

        # Documentation score
        scores["documentation"] = min(result.documentation.coverage_percentage, 100)

        # Type hint score
        scores["type_hints"] = min(result.type_hints.coverage_percentage, 100)

        # Security score (deduct for issues)
        security_score = 100
        for issue in result.issues:
            if issue.category == IssueCategory.SECURITY:
                if issue.severity == IssueSeverity.CRITICAL:
                    security_score -= 30
                elif issue.severity == IssueSeverity.HIGH:
                    security_score -= 15
                elif issue.severity == IssueSeverity.MEDIUM:
                    security_score -= 5
        scores["security"] = max(0, security_score)

        # Style score (deduct for issues)
        style_score = 100
        for issue in result.issues:
            if issue.category in (IssueCategory.STYLE, IssueCategory.CORRECTNESS):
                if issue.severity == IssueSeverity.HIGH:
                    style_score -= 10
                elif issue.severity == IssueSeverity.MEDIUM:
                    style_score -= 5
                elif issue.severity == IssueSeverity.LOW:
                    style_score -= 2
        scores["style"] = max(0, style_score)

        # Weighted average
        overall = sum(scores[k] * self.WEIGHTS[k] for k in self.WEIGHTS)

        return min(100, max(0, overall))

    def _calculate_grade(self, score: float) -> str:
        """Calculate letter grade from score.

        Args:
            score: Numeric score (0-100)

        Returns:
            Letter grade (A-F)
        """
        for threshold, grade in self.GRADE_THRESHOLDS:
            if score >= threshold:
                return grade
        return "F"

    def _generate_recommendations(self, result: QualityAnalysisResult) -> list[str]:
        """Generate prioritized recommendations.

        Args:
            result: Analysis result

        Returns:
            List of recommendation strings
        """
        recommendations: list[str] = []

        # Critical issues first
        critical = [i for i in result.issues if i.severity == IssueSeverity.CRITICAL]
        if critical:
            recommendations.append(f"Fix {len(critical)} critical issue(s): {critical[0].message}")

        # High issues
        high = [i for i in result.issues if i.severity == IssueSeverity.HIGH]
        if high:
            recommendations.append(f"Address {len(high)} high-severity issue(s)")

        # Documentation
        if result.documentation.coverage_percentage < self.min_docstring_coverage:
            recommendations.append(
                f"Increase docstring coverage from {result.documentation.coverage_percentage:.0f}% to {self.min_docstring_coverage}%"
            )

        # Type hints
        if result.type_hints.coverage_percentage < self.min_type_coverage:
            recommendations.append(
                f"Add type hints (current: {result.type_hints.coverage_percentage:.0f}%, target: {self.min_type_coverage}%)"
            )

        # Complexity
        if result.complexity.complex_functions:
            recommendations.append(
                f"Refactor complex functions: {', '.join(result.complexity.complex_functions[:3])}"
            )

        return recommendations


def analyze_code_quality(source_code: str) -> QualityAnalysisResult:
    """Convenience function for code quality analysis.

    Args:
        source_code: Python source code to analyze

    Returns:
        Complete QualityAnalysisResult
    """
    analyzer = CodeQualityAnalyzer()
    return analyzer.analyze(source_code)


def get_quality_tier_recommendation(score: float) -> str:
    """Get recommended model tier based on quality score.

    Lower quality code may benefit from more capable models for review.

    Args:
        score: Quality score (0-100)

    Returns:
        Recommended model tier ("opus", "sonnet", or "haiku")
    """
    if score < 50:
        return "opus"  # Low quality needs stronger review
    elif score < 75:
        return "sonnet"  # Medium quality
    else:
        return "haiku"  # High quality can use faster model
