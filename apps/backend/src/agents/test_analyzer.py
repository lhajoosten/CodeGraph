"""Test analyzer for parsing, simulating, and measuring test coverage.

This module provides utilities for analyzing generated pytest test code:
- Extracting test functions and classes from test code
- Simulating test execution with pass/fail results
- Calculating coverage metrics based on code and tests
- Generating structured test reports

TODO: Add integration with actual pytest execution (Phase 3)
TODO: Add mutation testing support (Phase 4)
"""

import ast
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from src.core.logging import get_logger

logger = get_logger(__name__)


class TestStatus(str, Enum):
    """Status of a simulated test execution."""

    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class TestType(str, Enum):
    """Classification of test types."""

    UNIT = "unit"
    INTEGRATION = "integration"
    EDGE_CASE = "edge_case"
    ERROR_HANDLING = "error_handling"
    PARAMETRIZED = "parametrized"
    FIXTURE = "fixture"


@dataclass
class TestCase:
    """A single test case extracted from test code.

    Attributes:
        name: Test function or method name
        class_name: Parent class name if test is in a class
        docstring: Test docstring/description
        line_number: Line number in source code
        test_type: Classification of the test
        is_parametrized: Whether test uses pytest.mark.parametrize
        is_async: Whether test is async
        decorators: List of decorator names
        assertions: Count of assert statements
    """

    name: str
    class_name: str | None = None
    docstring: str | None = None
    line_number: int = 0
    test_type: TestType = TestType.UNIT
    is_parametrized: bool = False
    is_async: bool = False
    decorators: list[str] = field(default_factory=list)
    assertions: int = 0

    @property
    def full_name(self) -> str:
        """Get fully qualified test name."""
        if self.class_name:
            return f"{self.class_name}::{self.name}"
        return self.name

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "full_name": self.full_name,
            "class_name": self.class_name,
            "docstring": self.docstring,
            "line_number": self.line_number,
            "test_type": self.test_type.value,
            "is_parametrized": self.is_parametrized,
            "is_async": self.is_async,
            "decorators": self.decorators,
            "assertions": self.assertions,
        }


@dataclass
class TestResult:
    """Result of a simulated test execution.

    Attributes:
        test_case: The test case that was run
        status: Pass/fail/skip/error status
        duration_ms: Simulated duration in milliseconds
        error_message: Error message if failed
        output: Simulated test output
    """

    test_case: TestCase
    status: TestStatus = TestStatus.PASSED
    duration_ms: int = 0
    error_message: str | None = None
    output: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "test_name": self.test_case.full_name,
            "status": self.status.value,
            "duration_ms": self.duration_ms,
            "error_message": self.error_message,
            "output": self.output,
        }


@dataclass
class TestSuite:
    """Collection of test cases from a test file.

    Attributes:
        filepath: Path to test file
        test_cases: List of test cases
        fixtures: List of fixture function names
        imports: List of import statements
    """

    filepath: str = ""
    test_cases: list[TestCase] = field(default_factory=list)
    fixtures: list[str] = field(default_factory=list)
    imports: list[str] = field(default_factory=list)

    @property
    def test_count(self) -> int:
        """Total number of tests."""
        return len(self.test_cases)

    @property
    def parametrized_count(self) -> int:
        """Number of parametrized tests."""
        return sum(1 for t in self.test_cases if t.is_parametrized)

    @property
    def async_count(self) -> int:
        """Number of async tests."""
        return sum(1 for t in self.test_cases if t.is_async)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "filepath": self.filepath,
            "test_count": self.test_count,
            "parametrized_count": self.parametrized_count,
            "async_count": self.async_count,
            "fixtures": self.fixtures,
            "test_cases": [t.to_dict() for t in self.test_cases],
        }


@dataclass
class CoverageMetrics:
    """Coverage analysis metrics.

    Attributes:
        functions_in_code: Functions found in source code
        functions_tested: Functions with corresponding tests
        classes_in_code: Classes found in source code
        classes_tested: Classes with corresponding tests
        coverage_percentage: Estimated coverage percentage
        untested_items: List of untested functions/classes
    """

    functions_in_code: list[str] = field(default_factory=list)
    functions_tested: list[str] = field(default_factory=list)
    classes_in_code: list[str] = field(default_factory=list)
    classes_tested: list[str] = field(default_factory=list)
    coverage_percentage: float = 0.0
    untested_items: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "functions_in_code": self.functions_in_code,
            "functions_tested": self.functions_tested,
            "classes_in_code": self.classes_in_code,
            "classes_tested": self.classes_tested,
            "coverage_percentage": round(self.coverage_percentage, 1),
            "untested_items": self.untested_items,
            "function_coverage": (
                f"{len(self.functions_tested)}/{len(self.functions_in_code)}"
                if self.functions_in_code
                else "N/A"
            ),
            "class_coverage": (
                f"{len(self.classes_tested)}/{len(self.classes_in_code)}"
                if self.classes_in_code
                else "N/A"
            ),
        }


@dataclass
class ExecutionSummary:
    """Summary of simulated test execution.

    Attributes:
        total: Total tests run
        passed: Number of passed tests
        failed: Number of failed tests
        skipped: Number of skipped tests
        errors: Number of error tests
        duration_ms: Total duration in milliseconds
    """

    total: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    errors: int = 0
    duration_ms: int = 0

    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage."""
        if self.total == 0:
            return 0.0
        return (self.passed / self.total) * 100

    @property
    def all_passed(self) -> bool:
        """Check if all tests passed."""
        return self.failed == 0 and self.errors == 0

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "total": self.total,
            "passed": self.passed,
            "failed": self.failed,
            "skipped": self.skipped,
            "errors": self.errors,
            "duration_ms": self.duration_ms,
            "success_rate": round(self.success_rate, 1),
            "all_passed": self.all_passed,
        }


@dataclass
class TestAnalysis:
    """Complete test analysis result.

    Attributes:
        test_suite: Extracted test suite
        results: Simulated execution results
        summary: Execution summary
        coverage: Coverage metrics
        quality_score: Overall test quality score (0-100)
        recommendations: List of improvement recommendations
    """

    test_suite: TestSuite = field(default_factory=TestSuite)
    results: list[TestResult] = field(default_factory=list)
    summary: ExecutionSummary = field(default_factory=ExecutionSummary)
    coverage: CoverageMetrics = field(default_factory=CoverageMetrics)
    quality_score: float = 0.0
    recommendations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "test_suite": self.test_suite.to_dict(),
            "results": [r.to_dict() for r in self.results],
            "summary": self.summary.to_dict(),
            "coverage": self.coverage.to_dict(),
            "quality_score": round(self.quality_score, 1),
            "recommendations": self.recommendations,
        }


def extract_test_functions(test_code: str) -> TestSuite:
    """Extract test functions and metadata from test code.

    Parses Python test code to extract:
    - Test functions (def test_*)
    - Test classes (class Test*)
    - Fixtures (@pytest.fixture)
    - Decorators and assertions

    Args:
        test_code: Python test source code

    Returns:
        TestSuite with extracted test cases
    """
    suite = TestSuite()

    # Try AST parsing for accurate extraction
    try:
        tree = ast.parse(test_code)
        suite = _extract_from_ast(tree, test_code)
    except SyntaxError:
        # Fall back to regex if AST fails
        logger.warning("AST parsing failed, falling back to regex extraction")
        suite = _extract_from_regex(test_code)

    logger.debug(
        "Extracted test functions",
        test_count=suite.test_count,
        fixture_count=len(suite.fixtures),
        parametrized_count=suite.parametrized_count,
    )

    return suite


def _extract_from_ast(tree: ast.AST, source: str) -> TestSuite:
    """Extract tests using AST parsing."""
    suite = TestSuite()
    lines = source.splitlines()

    for node in ast.walk(tree):
        # Extract imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                suite.imports.append(f"import {alias.name}")
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            names = ", ".join(alias.name for alias in node.names)
            suite.imports.append(f"from {module} import {names}")

    # Process top-level and class-level functions
    for node in ast.iter_child_nodes(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            _process_function(node, None, suite, lines)
        elif isinstance(node, ast.ClassDef):
            if node.name.startswith("Test"):
                for item in node.body:
                    if isinstance(item, ast.FunctionDef | ast.AsyncFunctionDef):
                        _process_function(item, node.name, suite, lines)

    return suite


def _process_function(
    node: ast.FunctionDef | ast.AsyncFunctionDef,
    class_name: str | None,
    suite: TestSuite,
    lines: list[str],
) -> None:
    """Process a function node and add to suite if it's a test or fixture."""
    decorators = [_get_decorator_name(d) for d in node.decorator_list]

    # Check for fixtures
    if "pytest.fixture" in decorators or "fixture" in decorators:
        suite.fixtures.append(node.name)
        return

    # Check for test functions
    if not node.name.startswith("test_"):
        return

    # Extract docstring
    docstring = ast.get_docstring(node)

    # Count assertions
    assertions = sum(1 for n in ast.walk(node) if isinstance(n, ast.Assert))

    # Determine test type
    test_type = _classify_test(node.name, docstring, decorators)

    # Check for parametrize
    is_parametrized = any("parametrize" in d for d in decorators)

    test_case = TestCase(
        name=node.name,
        class_name=class_name,
        docstring=docstring,
        line_number=node.lineno,
        test_type=test_type,
        is_parametrized=is_parametrized,
        is_async=isinstance(node, ast.AsyncFunctionDef),
        decorators=decorators,
        assertions=assertions,
    )

    suite.test_cases.append(test_case)


def _get_decorator_name(decorator: ast.expr) -> str:
    """Extract decorator name from AST node."""
    if isinstance(decorator, ast.Name):
        return decorator.id
    elif isinstance(decorator, ast.Attribute):
        parts: list[str] = []
        current: ast.expr = decorator
        while isinstance(current, ast.Attribute):
            parts.append(current.attr)
            current = current.value
        if isinstance(current, ast.Name):
            parts.append(current.id)
        return ".".join(reversed(parts))
    elif isinstance(decorator, ast.Call):
        return _get_decorator_name(decorator.func)
    return "unknown"


def _classify_test(name: str, docstring: str | None, decorators: list[str]) -> TestType:
    """Classify test type based on name, docstring, and decorators."""
    name_lower = name.lower()
    doc_lower = (docstring or "").lower()

    if any("parametrize" in d for d in decorators):
        return TestType.PARAMETRIZED

    if "integration" in name_lower or "integration" in doc_lower:
        return TestType.INTEGRATION

    if any(
        word in name_lower
        for word in ["edge", "boundary", "limit", "max", "min", "empty", "null", "none"]
    ):
        return TestType.EDGE_CASE

    if any(
        word in name_lower for word in ["error", "exception", "raise", "invalid", "fail", "reject"]
    ):
        return TestType.ERROR_HANDLING

    return TestType.UNIT


def _extract_from_regex(test_code: str) -> TestSuite:
    """Fallback regex extraction when AST fails."""
    suite = TestSuite()

    # Extract test functions
    func_pattern = re.compile(
        r"^(\s*)(async\s+)?def\s+(test_\w+)\s*\([^)]*\)\s*(?:->.*?)?:",
        re.MULTILINE,
    )

    for match in func_pattern.finditer(test_code):
        indent = len(match.group(1))
        is_async = match.group(2) is not None
        name = match.group(3)

        # Determine class context by indent
        class_name = None
        if indent > 0:
            # Look backwards for class definition
            class_pattern = re.compile(r"^class\s+(Test\w+)\s*[:\(]", re.MULTILINE)
            for class_match in class_pattern.finditer(test_code[: match.start()]):
                class_name = class_match.group(1)

        test_case = TestCase(
            name=name,
            class_name=class_name,
            is_async=is_async,
            line_number=test_code[: match.start()].count("\n") + 1,
        )
        suite.test_cases.append(test_case)

    # Extract fixtures
    fixture_pattern = re.compile(r"@pytest\.fixture.*\ndef\s+(\w+)\s*\(", re.MULTILINE)
    suite.fixtures = fixture_pattern.findall(test_code)

    return suite


def analyze_coverage(source_code: str, test_suite: TestSuite) -> CoverageMetrics:
    """Analyze test coverage by comparing source code to tests.

    Estimates coverage by matching function/class names in source code
    to test function names.

    Args:
        source_code: Original source code being tested
        test_suite: Extracted test suite

    Returns:
        CoverageMetrics with coverage analysis
    """
    metrics = CoverageMetrics()

    # Extract functions and classes from source code
    try:
        tree = ast.parse(source_code)

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
                # Skip private functions and test functions
                if not node.name.startswith("_") and not node.name.startswith("test_"):
                    metrics.functions_in_code.append(node.name)
            elif isinstance(node, ast.ClassDef):
                if not node.name.startswith("_"):
                    metrics.classes_in_code.append(node.name)
    except SyntaxError:
        # Fall back to regex
        func_pattern = re.compile(r"^(?:async\s+)?def\s+(\w+)\s*\(", re.MULTILINE)
        class_pattern = re.compile(r"^class\s+(\w+)\s*[:\(]", re.MULTILINE)

        metrics.functions_in_code = [
            f
            for f in func_pattern.findall(source_code)
            if not f.startswith("_") and not f.startswith("test_")
        ]
        metrics.classes_in_code = [
            c for c in class_pattern.findall(source_code) if not c.startswith("_")
        ]

    # Build list of tested items from test names
    tested_items = set()
    for test in test_suite.test_cases:
        # Extract item being tested from test name
        # e.g., test_authenticate_success -> authenticate
        name_parts = test.name.replace("test_", "").split("_")
        for i in range(len(name_parts)):
            candidate = "_".join(name_parts[: i + 1])
            tested_items.add(candidate)
            tested_items.add(candidate.title().replace("_", ""))  # CamelCase

    # Match functions
    for func in metrics.functions_in_code:
        func_lower = func.lower()
        if func_lower in tested_items or func in tested_items:
            metrics.functions_tested.append(func)
        else:
            metrics.untested_items.append(f"function: {func}")

    # Match classes
    for cls in metrics.classes_in_code:
        cls_lower = cls.lower()
        if cls_lower in tested_items or cls in tested_items:
            metrics.classes_tested.append(cls)
        else:
            metrics.untested_items.append(f"class: {cls}")

    # Calculate coverage percentage
    total_items = len(metrics.functions_in_code) + len(metrics.classes_in_code)
    tested_count = len(metrics.functions_tested) + len(metrics.classes_tested)

    if total_items > 0:
        metrics.coverage_percentage = (tested_count / total_items) * 100

    logger.debug(
        "Analyzed coverage",
        functions_in_code=len(metrics.functions_in_code),
        functions_tested=len(metrics.functions_tested),
        coverage=metrics.coverage_percentage,
    )

    return metrics


def simulate_test_execution(test_suite: TestSuite) -> tuple[list[TestResult], ExecutionSummary]:
    """Simulate test execution and generate results.

    Since we can't actually run tests safely, this simulates execution
    by analyzing test structure. Tests are assumed to pass unless they
    have indicators of potential issues.

    Args:
        test_suite: Test suite to simulate

    Returns:
        Tuple of (list of TestResults, ExecutionSummary)
    """
    import random

    results: list[TestResult] = []
    summary = ExecutionSummary(total=len(test_suite.test_cases))

    for test_case in test_suite.test_cases:
        # Simulate duration based on test type
        base_duration = 10  # ms
        if test_case.is_async:
            base_duration = 50
        if test_case.test_type == TestType.INTEGRATION:
            base_duration = 100
        if test_case.is_parametrized:
            base_duration = 30

        # Add some randomness for realism
        duration = base_duration + random.randint(1, 20)

        # Determine status - most tests pass in simulation
        # Tests with no assertions or very few assertions might indicate issues
        status = TestStatus.PASSED
        error_message = None

        if test_case.assertions == 0:
            # Test with no assertions is suspicious
            status = TestStatus.PASSED  # Still pass but note it
            error_message = "Warning: No assertions found"

        result = TestResult(
            test_case=test_case,
            status=status,
            duration_ms=duration,
            error_message=error_message,
        )
        results.append(result)

        # Update summary
        if status == TestStatus.PASSED:
            summary.passed += 1
        elif status == TestStatus.FAILED:
            summary.failed += 1
        elif status == TestStatus.SKIPPED:
            summary.skipped += 1
        else:
            summary.errors += 1

        summary.duration_ms += duration

    logger.debug(
        "Simulated test execution",
        total=summary.total,
        passed=summary.passed,
        duration_ms=summary.duration_ms,
    )

    return results, summary


def calculate_quality_score(
    test_suite: TestSuite,
    coverage: CoverageMetrics,
    summary: ExecutionSummary,
) -> tuple[float, list[str]]:
    """Calculate overall test quality score and recommendations.

    Scoring factors:
    - Coverage percentage (40% weight)
    - Test type diversity (20% weight)
    - Assertion density (20% weight)
    - Parametrization usage (10% weight)
    - Success rate (10% weight)

    Args:
        test_suite: Analyzed test suite
        coverage: Coverage metrics
        summary: Execution summary

    Returns:
        Tuple of (quality score 0-100, list of recommendations)
    """
    score = 0.0
    recommendations: list[str] = []

    # Coverage contribution (40%)
    coverage_score = min(coverage.coverage_percentage, 100) * 0.4
    score += coverage_score

    if coverage.coverage_percentage < 80:
        recommendations.append(
            f"Increase test coverage from {coverage.coverage_percentage:.0f}% to at least 80%"
        )

    # Test type diversity (20%)
    test_types = {t.test_type for t in test_suite.test_cases}
    diversity_score = (len(test_types) / len(TestType)) * 20
    score += diversity_score

    if TestType.EDGE_CASE not in test_types:
        recommendations.append("Add edge case tests for boundary conditions")
    if TestType.ERROR_HANDLING not in test_types:
        recommendations.append("Add error handling tests for exception scenarios")

    # Assertion density (20%)
    if test_suite.test_cases:
        avg_assertions = sum(t.assertions for t in test_suite.test_cases) / len(
            test_suite.test_cases
        )
        assertion_score = min(avg_assertions / 3, 1.0) * 20  # Target 3 assertions avg
        score += assertion_score

        if avg_assertions < 2:
            recommendations.append("Increase assertions per test (target: 2-4 per test)")

    # Parametrization (10%)
    if test_suite.test_count > 0:
        param_ratio = test_suite.parametrized_count / test_suite.test_count
        param_score = min(param_ratio * 3, 1.0) * 10  # Target 33% parametrized
        score += param_score

        if test_suite.parametrized_count == 0:
            recommendations.append("Use @pytest.mark.parametrize for testing multiple inputs")

    # Success rate (10%)
    success_score = (summary.success_rate / 100) * 10
    score += success_score

    # Additional recommendations based on test count
    if test_suite.test_count < 5:
        recommendations.append("Add more tests - minimum 5 tests recommended")

    if not test_suite.fixtures:
        recommendations.append("Consider using fixtures for test setup and teardown")

    if coverage.untested_items:
        untested_sample = coverage.untested_items[:3]
        recommendations.append(f"Add tests for: {', '.join(untested_sample)}")

    return score, recommendations


def create_test_analysis(
    test_code: str,
    source_code: str = "",
    filepath: str = "",
) -> TestAnalysis:
    """Create complete test analysis from test code.

    Main entry point for analyzing generated tests. Extracts tests,
    simulates execution, calculates coverage, and generates quality score.

    Args:
        test_code: Generated pytest test code
        source_code: Original source code being tested (for coverage)
        filepath: Path to test file

    Returns:
        Complete TestAnalysis with all metrics
    """
    logger.info("Creating test analysis", filepath=filepath or "inline")

    # Extract test functions
    test_suite = extract_test_functions(test_code)
    test_suite.filepath = filepath

    # Analyze coverage if source code provided
    coverage = CoverageMetrics()
    if source_code:
        coverage = analyze_coverage(source_code, test_suite)

    # Simulate test execution
    results, summary = simulate_test_execution(test_suite)

    # Calculate quality score
    quality_score, recommendations = calculate_quality_score(test_suite, coverage, summary)

    analysis = TestAnalysis(
        test_suite=test_suite,
        results=results,
        summary=summary,
        coverage=coverage,
        quality_score=quality_score,
        recommendations=recommendations,
    )

    logger.info(
        "Test analysis complete",
        test_count=test_suite.test_count,
        coverage=coverage.coverage_percentage,
        quality_score=quality_score,
    )

    return analysis
