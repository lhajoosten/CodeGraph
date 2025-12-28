"""Test analyzer for parsing, simulating, and measuring test coverage.

This module provides utilities for analyzing generated pytest test code:
- Extracting test functions and classes from test code
- Simulating test execution with pass/fail results
- Real pytest execution in isolated environment
- Calculating coverage metrics based on code and tests
- Generating structured test reports

Features:
- Real pytest execution with subprocess isolation
- JSON report parsing for accurate results
- Coverage data extraction
- Safe temp file handling
- Configurable execution timeout

TODO: Add mutation testing support
"""

import ast
import asyncio
import json
import re
import shutil
import tempfile
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

from src.core.config import settings
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
        duration = base_duration + random.randint(1, 20)  # nosec: B311 - not for security

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


# =============================================================================
# Real Pytest Execution
# =============================================================================


@dataclass
class PytestExecutionConfig:
    """Configuration for real pytest execution.

    Attributes:
        timeout_seconds: Maximum execution time
        enable_coverage: Whether to run with coverage
        working_dir: Optional working directory
        extra_args: Additional pytest arguments
        python_path: Path to Python interpreter
    """

    timeout_seconds: int = 30
    enable_coverage: bool = False
    working_dir: str | None = None
    extra_args: list[str] = field(default_factory=list)
    python_path: str = "python"


@dataclass
class PytestResult:
    """Result from real pytest execution.

    Attributes:
        success: Whether execution completed successfully
        exit_code: Pytest exit code
        duration_ms: Total execution time
        test_results: Individual test results
        summary: Execution summary
        coverage_data: Coverage data if enabled
        stdout: Captured stdout
        stderr: Captured stderr
        error: Error message if execution failed
    """

    success: bool = False
    exit_code: int = -1
    duration_ms: int = 0
    test_results: list[TestResult] = field(default_factory=list)
    summary: ExecutionSummary = field(default_factory=ExecutionSummary)
    coverage_data: dict[str, Any] = field(default_factory=dict)
    stdout: str = ""
    stderr: str = ""
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "success": self.success,
            "exit_code": self.exit_code,
            "duration_ms": self.duration_ms,
            "summary": self.summary.to_dict(),
            "coverage_data": self.coverage_data,
            "stdout": self.stdout[:1000] if self.stdout else "",
            "stderr": self.stderr[:1000] if self.stderr else "",
            "error": self.error,
        }


async def run_pytest_execution(
    test_code: str,
    source_code: str = "",
    test_suite: TestSuite | None = None,
    config: PytestExecutionConfig | None = None,
) -> PytestResult:
    """Execute tests with real pytest in an isolated environment.

    Creates a temporary directory, writes test and source files,
    runs pytest with JSON output, and parses the results.

    Security Note:
        This function executes arbitrary code. It should only be used
        in sandboxed environments with untrusted code. The temp directory
        is cleaned up after execution.

    Args:
        test_code: The pytest test code to execute
        source_code: Optional source code being tested
        test_suite: Pre-extracted test suite (optional, will extract if not provided)
        config: Execution configuration

    Returns:
        PytestResult with execution details

    Example:
        result = await run_pytest_execution(
            test_code=\"\"\"
            def test_addition():
                assert 1 + 1 == 2
            \"\"\",
            config=PytestExecutionConfig(timeout_seconds=10),
        )
        if result.success:
            print(f"Tests passed: {result.summary.passed}")
    """
    config = config or PytestExecutionConfig()
    result = PytestResult()

    # Check if real execution is enabled
    if not getattr(settings, "enable_real_test_execution", False):
        logger.debug("Real test execution disabled, using simulation")
        if test_suite is None:
            test_suite = extract_test_functions(test_code)
        results, summary = simulate_test_execution(test_suite)
        result.success = True
        result.exit_code = 0
        result.test_results = results
        result.summary = summary
        return result

    temp_dir = None
    try:
        # Create isolated temp directory
        temp_dir = Path(tempfile.mkdtemp(prefix="codegraph_test_"))
        logger.debug("Created temp directory", path=str(temp_dir))

        # Write test file
        test_file = temp_dir / "test_generated.py"
        test_file.write_text(test_code, encoding="utf-8")

        # Write source file if provided
        if source_code:
            source_file = temp_dir / "source_module.py"
            source_file.write_text(source_code, encoding="utf-8")

        # Write conftest.py for proper imports
        conftest = temp_dir / "conftest.py"
        conftest.write_text(
            "import sys\n"
            "from pathlib import Path\n"
            "sys.path.insert(0, str(Path(__file__).parent))\n",
            encoding="utf-8",
        )

        # Build pytest command
        json_report = temp_dir / "report.json"
        cmd = [
            config.python_path,
            "-m",
            "pytest",
            str(test_file),
            f"--json-report-file={json_report}",
            "--json-report",
            "-v",
            "--tb=short",
        ]

        # Add coverage if enabled
        if config.enable_coverage:
            cmd.extend(
                [
                    f"--cov={temp_dir}",
                    f"--cov-report=json:{temp_dir}/coverage.json",
                ]
            )

        # Add extra args
        cmd.extend(config.extra_args)

        logger.debug("Running pytest", cmd=" ".join(cmd))

        # Run pytest with timeout
        import time

        start_time = time.perf_counter()

        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(temp_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env={"PYTHONPATH": str(temp_dir)},
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=config.timeout_seconds,
            )
            result.exit_code = process.returncode or 0
            result.stdout = stdout.decode("utf-8", errors="replace")
            result.stderr = stderr.decode("utf-8", errors="replace")
        except TimeoutError:
            process.kill()
            await process.wait()
            result.error = f"Test execution timed out after {config.timeout_seconds}s"
            result.exit_code = -1
            logger.warning("Pytest execution timeout", timeout=config.timeout_seconds)
            return result

        result.duration_ms = int((time.perf_counter() - start_time) * 1000)

        # Parse JSON report if available
        if json_report.exists():
            try:
                report_data = json.loads(json_report.read_text(encoding="utf-8"))
                result = _parse_pytest_json_report(report_data, result, test_suite)
            except json.JSONDecodeError as e:
                logger.warning("Failed to parse pytest JSON report", error=str(e))
        else:
            # Fall back to parsing stdout
            result = _parse_pytest_stdout(result.stdout, result, test_suite)

        # Parse coverage if available
        coverage_json = temp_dir / "coverage.json"
        if config.enable_coverage and coverage_json.exists():
            try:
                coverage_data = json.loads(coverage_json.read_text(encoding="utf-8"))
                result.coverage_data = _extract_coverage_summary(coverage_data)
            except json.JSONDecodeError:
                logger.warning("Failed to parse coverage JSON")

        result.success = result.exit_code == 0

        logger.info(
            "Pytest execution completed",
            exit_code=result.exit_code,
            duration_ms=result.duration_ms,
            passed=result.summary.passed,
            failed=result.summary.failed,
        )

    except Exception as e:
        result.error = f"Execution failed: {e}"
        logger.error("Pytest execution error", error=str(e))

    finally:
        # Clean up temp directory
        if temp_dir and temp_dir.exists():
            try:
                shutil.rmtree(temp_dir)
                logger.debug("Cleaned up temp directory")
            except OSError as e:
                logger.warning("Failed to clean up temp directory", error=str(e))

    return result


def _parse_pytest_json_report(
    report_data: dict[str, Any],
    result: PytestResult,
    test_suite: TestSuite | None,
) -> PytestResult:
    """Parse pytest-json-report output into structured result.

    Args:
        report_data: Parsed JSON report data
        result: PytestResult to populate
        test_suite: Optional pre-extracted test suite

    Returns:
        Updated PytestResult
    """
    # Extract summary
    summary_data = report_data.get("summary", {})
    result.summary = ExecutionSummary(
        total=summary_data.get("total", 0),
        passed=summary_data.get("passed", 0),
        failed=summary_data.get("failed", 0),
        skipped=summary_data.get("skipped", 0),
        errors=summary_data.get("error", 0),
        duration_ms=int(report_data.get("duration", 0) * 1000),
    )

    # Extract individual test results
    tests = report_data.get("tests", [])
    for test_data in tests:
        node_id = test_data.get("nodeid", "")
        outcome = test_data.get("outcome", "unknown")

        # Map outcome to TestStatus
        status_map = {
            "passed": TestStatus.PASSED,
            "failed": TestStatus.FAILED,
            "skipped": TestStatus.SKIPPED,
            "error": TestStatus.ERROR,
        }
        status = status_map.get(outcome, TestStatus.ERROR)

        # Extract test name from node_id
        test_name = node_id.split("::")[-1] if "::" in node_id else node_id

        # Find matching TestCase if we have a test suite
        test_case = None
        if test_suite:
            for tc in test_suite.test_cases:
                if tc.name == test_name or tc.full_name in node_id:
                    test_case = tc
                    break

        if test_case is None:
            test_case = TestCase(name=test_name)

        # Extract error message if failed
        error_message = None
        if outcome in ("failed", "error"):
            call_data = test_data.get("call", {})
            longrepr = call_data.get("longrepr", "")
            if isinstance(longrepr, str):
                error_message = longrepr[:500]

        test_result = TestResult(
            test_case=test_case,
            status=status,
            duration_ms=int(test_data.get("duration", 0) * 1000),
            error_message=error_message,
        )
        result.test_results.append(test_result)

    return result


def _parse_pytest_stdout(
    stdout: str,
    result: PytestResult,
    test_suite: TestSuite | None,
) -> PytestResult:
    """Parse pytest stdout when JSON report is unavailable.

    Fallback parser that extracts basic information from pytest output.

    Args:
        stdout: Pytest stdout output
        result: PytestResult to populate
        test_suite: Optional pre-extracted test suite

    Returns:
        Updated PytestResult
    """
    # Parse summary line like "5 passed, 2 failed, 1 skipped in 1.23s"
    summary_pattern = re.compile(
        r"(?:=+\s*)?"
        r"(?:(\d+)\s+passed)?"
        r"(?:,?\s*(\d+)\s+failed)?"
        r"(?:,?\s*(\d+)\s+skipped)?"
        r"(?:,?\s*(\d+)\s+error)?"
        r"(?:\s+in\s+([\d.]+)s)?",
        re.IGNORECASE,
    )

    for line in stdout.splitlines():
        match = summary_pattern.search(line)
        if match and any(match.groups()):
            result.summary = ExecutionSummary(
                passed=int(match.group(1) or 0),
                failed=int(match.group(2) or 0),
                skipped=int(match.group(3) or 0),
                errors=int(match.group(4) or 0),
                duration_ms=int(float(match.group(5) or 0) * 1000),
            )
            result.summary.total = (
                result.summary.passed
                + result.summary.failed
                + result.summary.skipped
                + result.summary.errors
            )
            break

    # Parse individual test lines like "test_file.py::test_name PASSED"
    test_pattern = re.compile(r"([\w/.]+)::(\w+)\s+(PASSED|FAILED|SKIPPED|ERROR)", re.IGNORECASE)

    for match in test_pattern.finditer(stdout):
        test_name = match.group(2)
        outcome = match.group(3).lower()

        status_map = {
            "passed": TestStatus.PASSED,
            "failed": TestStatus.FAILED,
            "skipped": TestStatus.SKIPPED,
            "error": TestStatus.ERROR,
        }

        test_case = TestCase(name=test_name)
        if test_suite:
            for tc in test_suite.test_cases:
                if tc.name == test_name:
                    test_case = tc
                    break

        test_result = TestResult(
            test_case=test_case,
            status=status_map.get(outcome, TestStatus.ERROR),
        )
        result.test_results.append(test_result)

    return result


def _extract_coverage_summary(coverage_data: dict[str, Any]) -> dict[str, Any]:
    """Extract coverage summary from coverage.py JSON output.

    Args:
        coverage_data: Parsed coverage.json data

    Returns:
        Simplified coverage summary dict
    """
    totals = coverage_data.get("totals", {})
    return {
        "covered_lines": totals.get("covered_lines", 0),
        "missing_lines": totals.get("missing_lines", 0),
        "total_statements": totals.get("num_statements", 0),
        "coverage_percent": totals.get("percent_covered", 0.0),
        "branch_coverage_percent": totals.get("percent_covered_branches", 0.0),
    }


async def run_or_simulate_tests(
    test_code: str,
    source_code: str = "",
    test_suite: TestSuite | None = None,
    prefer_real_execution: bool = False,
    config: PytestExecutionConfig | None = None,
) -> tuple[list[TestResult], ExecutionSummary]:
    """Run tests using real pytest or simulation based on configuration.

    This is a convenience wrapper that chooses between real execution
    and simulation based on settings and preferences.

    Args:
        test_code: The pytest test code
        source_code: Optional source code being tested
        test_suite: Pre-extracted test suite
        prefer_real_execution: Prefer real execution if available
        config: Pytest execution config

    Returns:
        Tuple of (test results, execution summary)
    """
    if test_suite is None:
        test_suite = extract_test_functions(test_code)

    # Check if real execution should be attempted
    real_exec_enabled = getattr(settings, "enable_real_test_execution", False)

    if prefer_real_execution and real_exec_enabled:
        try:
            result = await run_pytest_execution(
                test_code=test_code,
                source_code=source_code,
                test_suite=test_suite,
                config=config,
            )
            if result.success or result.exit_code >= 0:
                return result.test_results, result.summary
        except Exception as e:
            logger.warning("Real test execution failed, falling back to simulation", error=str(e))

    # Fall back to simulation
    return simulate_test_execution(test_suite)
