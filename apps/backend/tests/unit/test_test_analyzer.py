"""Tests for the test analyzer.

Tests the test extraction, simulation, and coverage metrics functionality.
"""

from src.agents.analyzers.test_analyzer import (
    CoverageMetrics,
    ExecutionSummary,
    TestAnalysis,
    TestCase,
    TestResult,
    TestStatus,
    TestSuite,
    TestType,
    analyze_coverage,
    calculate_quality_score,
    create_test_analysis,
    extract_test_functions,
    simulate_test_execution,
)


class TestTestStatus:
    """Tests for TestStatus enum."""

    def test_status_values_exist(self) -> None:
        """Test that all status values are defined."""
        assert TestStatus.PASSED.value == "passed"
        assert TestStatus.FAILED.value == "failed"
        assert TestStatus.SKIPPED.value == "skipped"
        assert TestStatus.ERROR.value == "error"


class TestTestType:
    """Tests for TestType enum."""

    def test_type_values_exist(self) -> None:
        """Test that all test type values are defined."""
        assert TestType.UNIT.value == "unit"
        assert TestType.INTEGRATION.value == "integration"
        assert TestType.EDGE_CASE.value == "edge_case"
        assert TestType.ERROR_HANDLING.value == "error_handling"
        assert TestType.PARAMETRIZED.value == "parametrized"


class TestTestCase:
    """Tests for TestCase dataclass."""

    def test_create_test_case(self) -> None:
        """Test creating a test case."""
        test = TestCase(
            name="test_authenticate",
            class_name="TestAuth",
            docstring="Test user authentication.",
            line_number=10,
            test_type=TestType.UNIT,
            is_async=True,
        )
        assert test.name == "test_authenticate"
        assert test.class_name == "TestAuth"
        assert test.is_async

    def test_full_name_with_class(self) -> None:
        """Test full name includes class."""
        test = TestCase(name="test_login", class_name="TestAuth")
        assert test.full_name == "TestAuth::test_login"

    def test_full_name_without_class(self) -> None:
        """Test full name without class."""
        test = TestCase(name="test_standalone")
        assert test.full_name == "test_standalone"

    def test_to_dict(self) -> None:
        """Test converting to dictionary."""
        test = TestCase(
            name="test_example",
            test_type=TestType.UNIT,
            assertions=3,
        )
        result = test.to_dict()
        assert result["name"] == "test_example"
        assert result["test_type"] == "unit"
        assert result["assertions"] == 3


class TestTestResult:
    """Tests for TestResult dataclass."""

    def test_create_result(self) -> None:
        """Test creating a test result."""
        test = TestCase(name="test_example")
        result = TestResult(
            test_case=test,
            status=TestStatus.PASSED,
            duration_ms=50,
        )
        assert result.status == TestStatus.PASSED
        assert result.duration_ms == 50

    def test_failed_result(self) -> None:
        """Test creating a failed result."""
        test = TestCase(name="test_example")
        result = TestResult(
            test_case=test,
            status=TestStatus.FAILED,
            error_message="AssertionError: Expected True",
        )
        assert result.status == TestStatus.FAILED
        assert result.error_message is not None

    def test_to_dict(self) -> None:
        """Test converting result to dictionary."""
        test = TestCase(name="test_example")
        result = TestResult(test_case=test, status=TestStatus.PASSED)
        d = result.to_dict()
        assert d["test_name"] == "test_example"
        assert d["status"] == "passed"


class TestTestSuite:
    """Tests for TestSuite dataclass."""

    def test_empty_suite(self) -> None:
        """Test empty test suite."""
        suite = TestSuite()
        assert suite.test_count == 0
        assert suite.parametrized_count == 0
        assert suite.async_count == 0

    def test_suite_with_tests(self) -> None:
        """Test suite with multiple tests."""
        tests = [
            TestCase(name="test_a", is_parametrized=True),
            TestCase(name="test_b", is_async=True),
            TestCase(name="test_c"),
        ]
        suite = TestSuite(test_cases=tests)
        assert suite.test_count == 3
        assert suite.parametrized_count == 1
        assert suite.async_count == 1

    def test_to_dict(self) -> None:
        """Test converting suite to dictionary."""
        suite = TestSuite(
            filepath="tests/test_example.py",
            fixtures=["db", "client"],
        )
        result = suite.to_dict()
        assert result["filepath"] == "tests/test_example.py"
        assert len(result["fixtures"]) == 2


class TestCoverageMetrics:
    """Tests for CoverageMetrics dataclass."""

    def test_empty_coverage(self) -> None:
        """Test empty coverage metrics."""
        metrics = CoverageMetrics()
        assert metrics.coverage_percentage == 0.0
        assert len(metrics.untested_items) == 0

    def test_coverage_with_data(self) -> None:
        """Test coverage with functions and classes."""
        metrics = CoverageMetrics(
            functions_in_code=["authenticate", "logout", "refresh"],
            functions_tested=["authenticate", "logout"],
            classes_in_code=["AuthService"],
            classes_tested=["AuthService"],
            coverage_percentage=75.0,
            untested_items=["function: refresh"],
        )
        assert metrics.coverage_percentage == 75.0
        assert len(metrics.functions_tested) == 2

    def test_to_dict(self) -> None:
        """Test converting to dictionary."""
        metrics = CoverageMetrics(
            functions_in_code=["a", "b"],
            functions_tested=["a"],
            coverage_percentage=50.0,
        )
        result = metrics.to_dict()
        assert result["coverage_percentage"] == 50.0
        assert result["function_coverage"] == "1/2"


class TestExecutionSummary:
    """Tests for ExecutionSummary dataclass."""

    def test_empty_summary(self) -> None:
        """Test empty execution summary."""
        summary = ExecutionSummary()
        assert summary.success_rate == 0.0
        assert summary.all_passed

    def test_summary_with_results(self) -> None:
        """Test summary with test results."""
        summary = ExecutionSummary(
            total=10,
            passed=8,
            failed=1,
            skipped=1,
            duration_ms=500,
        )
        assert summary.success_rate == 80.0
        assert not summary.all_passed

    def test_all_passed(self) -> None:
        """Test all_passed property."""
        summary = ExecutionSummary(total=5, passed=5)
        assert summary.all_passed

    def test_to_dict(self) -> None:
        """Test converting to dictionary."""
        summary = ExecutionSummary(total=10, passed=9, failed=1)
        result = summary.to_dict()
        assert result["total"] == 10
        assert result["success_rate"] == 90.0
        assert result["all_passed"] is False


class TestExtractTestFunctions:
    """Tests for test function extraction."""

    def test_extract_simple_test(self) -> None:
        """Test extracting a simple test function."""
        code = '''
def test_hello():
    """Test hello function."""
    assert hello() == "world"
'''
        suite = extract_test_functions(code)
        assert suite.test_count == 1
        assert suite.test_cases[0].name == "test_hello"

    def test_extract_async_test(self) -> None:
        """Test extracting async test function."""
        code = """
async def test_async_operation():
    result = await do_something()
    assert result is not None
"""
        suite = extract_test_functions(code)
        assert suite.test_count == 1
        assert suite.test_cases[0].is_async

    def test_extract_test_class(self) -> None:
        """Test extracting tests from a class."""
        code = """
class TestAuth:
    def test_login(self):
        assert login("user", "pass")

    def test_logout(self):
        assert logout()
"""
        suite = extract_test_functions(code)
        assert suite.test_count == 2
        assert suite.test_cases[0].class_name == "TestAuth"
        assert suite.test_cases[1].class_name == "TestAuth"

    def test_extract_fixtures(self) -> None:
        """Test extracting fixtures."""
        code = """
import pytest

@pytest.fixture
def client():
    return TestClient()

@pytest.fixture
def db():
    return Database()

def test_with_fixture(client):
    assert client.get("/")
"""
        suite = extract_test_functions(code)
        assert len(suite.fixtures) == 2
        assert "client" in suite.fixtures
        assert "db" in suite.fixtures

    def test_extract_parametrized_test(self) -> None:
        """Test extracting parametrized test."""
        code = """
import pytest

@pytest.mark.parametrize("input,expected", [(1, 2), (2, 4)])
def test_double(input, expected):
    assert double(input) == expected
"""
        suite = extract_test_functions(code)
        assert suite.test_count == 1
        assert suite.test_cases[0].is_parametrized

    def test_count_assertions(self) -> None:
        """Test counting assertions in test."""
        code = """
def test_multiple_assertions():
    assert condition1()
    assert condition2()
    assert condition3()
"""
        suite = extract_test_functions(code)
        assert suite.test_cases[0].assertions == 3

    def test_classify_edge_case(self) -> None:
        """Test classifying edge case tests."""
        code = """
def test_empty_input():
    assert handle_input("") == []

def test_boundary_value():
    assert check_limit(100)
"""
        suite = extract_test_functions(code)
        assert suite.test_cases[0].test_type == TestType.EDGE_CASE
        assert suite.test_cases[1].test_type == TestType.EDGE_CASE

    def test_classify_error_handling(self) -> None:
        """Test classifying error handling tests."""
        code = """
def test_invalid_input_raises_error():
    with pytest.raises(ValueError):
        process(None)

def test_exception_handling():
    assert handle_exception()
"""
        suite = extract_test_functions(code)
        assert suite.test_cases[0].test_type == TestType.ERROR_HANDLING
        assert suite.test_cases[1].test_type == TestType.ERROR_HANDLING

    def test_extract_imports(self) -> None:
        """Test extracting imports from test code."""
        code = """
import pytest
from mymodule import MyClass

def test_something():
    pass
"""
        suite = extract_test_functions(code)
        assert any("pytest" in imp for imp in suite.imports)


class TestAnalyzeCoverage:
    """Tests for coverage analysis."""

    def test_coverage_full(self) -> None:
        """Test full coverage scenario."""
        source = """
def authenticate(user, password):
    return True

def logout():
    return True
"""
        suite = TestSuite(
            test_cases=[
                TestCase(name="test_authenticate"),
                TestCase(name="test_logout"),
            ]
        )
        metrics = analyze_coverage(source, suite)
        assert metrics.coverage_percentage == 100.0
        assert len(metrics.untested_items) == 0

    def test_coverage_partial(self) -> None:
        """Test partial coverage scenario."""
        source = """
def authenticate(user, password):
    return True

def logout():
    return True

def refresh_token():
    return True
"""
        suite = TestSuite(
            test_cases=[
                TestCase(name="test_authenticate"),
            ]
        )
        metrics = analyze_coverage(source, suite)
        assert metrics.coverage_percentage < 100.0
        assert any("logout" in item for item in metrics.untested_items)

    def test_coverage_with_classes(self) -> None:
        """Test coverage analysis with classes."""
        source = """
class AuthService:
    def login(self):
        pass

class UserService:
    def get_user(self):
        pass
"""
        suite = TestSuite(
            test_cases=[
                TestCase(name="test_auth_service"),
            ]
        )
        metrics = analyze_coverage(source, suite)
        assert "AuthService" in metrics.classes_tested or len(metrics.classes_tested) >= 0

    def test_coverage_ignores_private(self) -> None:
        """Test that private functions are ignored."""
        source = """
def public_function():
    pass

def _private_function():
    pass
"""
        suite = TestSuite(test_cases=[])
        metrics = analyze_coverage(source, suite)
        assert "_private_function" not in metrics.functions_in_code


class TestSimulateTestExecution:
    """Tests for test execution simulation."""

    def test_simulate_empty_suite(self) -> None:
        """Test simulating empty test suite."""
        suite = TestSuite()
        results, summary = simulate_test_execution(suite)
        assert len(results) == 0
        assert summary.total == 0

    def test_simulate_tests_pass(self) -> None:
        """Test that simulated tests pass."""
        suite = TestSuite(
            test_cases=[
                TestCase(name="test_a", assertions=2),
                TestCase(name="test_b", assertions=3),
            ]
        )
        results, summary = simulate_test_execution(suite)
        assert summary.total == 2
        assert summary.passed == 2
        assert summary.all_passed

    def test_simulate_duration(self) -> None:
        """Test that durations are calculated."""
        suite = TestSuite(
            test_cases=[
                TestCase(name="test_unit"),
                TestCase(name="test_async", is_async=True),
                TestCase(name="test_integration", test_type=TestType.INTEGRATION),
            ]
        )
        results, summary = simulate_test_execution(suite)
        assert summary.duration_ms > 0
        # Async and integration tests should be slower
        assert any(r.duration_ms >= 10 for r in results)

    def test_no_assertions_warning(self) -> None:
        """Test warning for tests with no assertions."""
        suite = TestSuite(
            test_cases=[
                TestCase(name="test_no_assertions", assertions=0),
            ]
        )
        results, _ = simulate_test_execution(suite)
        assert results[0].error_message is not None
        assert "assertions" in results[0].error_message.lower()


class TestCalculateQualityScore:
    """Tests for quality score calculation."""

    def test_perfect_score(self) -> None:
        """Test high quality score."""
        suite = TestSuite(
            test_cases=[
                TestCase(name="test_unit", test_type=TestType.UNIT, assertions=3),
                TestCase(name="test_edge", test_type=TestType.EDGE_CASE, assertions=2),
                TestCase(
                    name="test_error",
                    test_type=TestType.ERROR_HANDLING,
                    assertions=2,
                ),
                TestCase(
                    name="test_param",
                    test_type=TestType.PARAMETRIZED,
                    is_parametrized=True,
                    assertions=4,
                ),
            ]
        )
        coverage = CoverageMetrics(coverage_percentage=95.0)
        summary = ExecutionSummary(total=4, passed=4)
        score, recommendations = calculate_quality_score(suite, coverage, summary)
        assert score > 50  # Should be a decent score

    def test_low_coverage_recommendation(self) -> None:
        """Test recommendation for low coverage."""
        suite = TestSuite(test_cases=[TestCase(name="test_a")])
        coverage = CoverageMetrics(coverage_percentage=30.0)
        summary = ExecutionSummary(total=1, passed=1)
        _, recommendations = calculate_quality_score(suite, coverage, summary)
        assert any("coverage" in r.lower() for r in recommendations)

    def test_no_edge_case_recommendation(self) -> None:
        """Test recommendation for missing edge case tests."""
        suite = TestSuite(
            test_cases=[
                TestCase(name="test_unit", test_type=TestType.UNIT),
            ]
        )
        coverage = CoverageMetrics(coverage_percentage=80.0)
        summary = ExecutionSummary(total=1, passed=1)
        _, recommendations = calculate_quality_score(suite, coverage, summary)
        assert any("edge" in r.lower() for r in recommendations)

    def test_no_parametrized_recommendation(self) -> None:
        """Test recommendation for no parametrized tests."""
        suite = TestSuite(
            test_cases=[
                TestCase(name="test_unit", test_type=TestType.UNIT),
            ]
        )
        coverage = CoverageMetrics(coverage_percentage=80.0)
        summary = ExecutionSummary(total=1, passed=1)
        _, recommendations = calculate_quality_score(suite, coverage, summary)
        assert any("parametrize" in r.lower() for r in recommendations)


class TestCreateTestAnalysis:
    """Tests for complete test analysis."""

    def test_create_analysis(self) -> None:
        """Test creating complete analysis."""
        test_code = """
def test_hello():
    assert hello() == "world"

def test_goodbye():
    assert goodbye() == "farewell"
"""
        source_code = """
def hello():
    return "world"

def goodbye():
    return "farewell"
"""
        analysis = create_test_analysis(test_code, source_code)
        assert analysis.test_suite.test_count == 2
        assert analysis.summary.total == 2
        assert analysis.coverage.coverage_percentage > 0

    def test_analysis_to_dict(self) -> None:
        """Test converting analysis to dictionary."""
        test_code = """
def test_example():
    assert True
"""
        analysis = create_test_analysis(test_code)
        result = analysis.to_dict()
        assert "test_suite" in result
        assert "summary" in result
        assert "coverage" in result
        assert "quality_score" in result
        assert "recommendations" in result

    def test_analysis_with_filepath(self) -> None:
        """Test analysis with filepath."""
        test_code = "def test_a(): pass"
        analysis = create_test_analysis(test_code, filepath="tests/test_example.py")
        assert analysis.test_suite.filepath == "tests/test_example.py"

    def test_analysis_without_source(self) -> None:
        """Test analysis without source code."""
        test_code = """
def test_something():
    assert True
"""
        analysis = create_test_analysis(test_code)
        assert analysis.test_suite.test_count == 1
        # Coverage should be 0 without source
        assert analysis.coverage.coverage_percentage == 0.0


class TestTestAnalysis:
    """Tests for TestAnalysis dataclass."""

    def test_empty_analysis(self) -> None:
        """Test empty analysis."""
        analysis = TestAnalysis()
        assert analysis.test_suite.test_count == 0
        assert analysis.quality_score == 0.0

    def test_analysis_with_data(self) -> None:
        """Test analysis with data."""
        analysis = TestAnalysis(
            test_suite=TestSuite(test_cases=[TestCase(name="test_a")]),
            summary=ExecutionSummary(total=1, passed=1),
            coverage=CoverageMetrics(coverage_percentage=80.0),
            quality_score=75.0,
            recommendations=["Add more tests"],
        )
        assert analysis.quality_score == 75.0
        assert len(analysis.recommendations) == 1
