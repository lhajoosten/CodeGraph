"""Unit tests for code quality analyzer."""

import pytest

from src.agents.code_quality import (
    CodeIssue,
    CodeQualityAnalyzer,
    ComplexityMetrics,
    DocumentationMetrics,
    IssueCategory,
    IssueSeverity,
    QualityAnalysisResult,
    TypeHintMetrics,
    analyze_code_quality,
    get_quality_tier_recommendation,
)


class TestCodeQualityAnalyzer:
    """Tests for CodeQualityAnalyzer class."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_analyze_simple_function(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test analyzing a simple, well-documented function."""
        code = '''
def greet(name: str) -> str:
    """Return a greeting message.

    Args:
        name: The name to greet

    Returns:
        A greeting string
    """
    return f"Hello, {name}!"
'''
        result = analyzer.analyze(code)

        assert isinstance(result, QualityAnalysisResult)
        assert result.overall_score > 0
        assert result.grade in ["A", "B", "C", "D", "F"]

    def test_analyze_syntax_error(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test that syntax errors are caught."""
        code = "def broken(:\n    pass"

        result = analyzer.analyze(code)

        assert result.overall_score == 0
        assert result.grade == "F"
        assert len(result.issues) > 0
        assert any(i.category == IssueCategory.CORRECTNESS for i in result.issues)

    def test_analyze_empty_code(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test analyzing empty code."""
        result = analyzer.analyze("")

        assert isinstance(result, QualityAnalysisResult)
        # Empty code should parse but have no metrics
        assert result.complexity.total_complexity == 0


class TestComplexityCalculation:
    """Tests for cyclomatic complexity calculation."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_simple_function_complexity(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test complexity of simple linear function."""
        code = """
def simple():
    x = 1
    y = 2
    return x + y
"""
        result = analyzer.analyze(code)

        # Simple function has complexity of 1
        assert result.complexity.max_function_complexity == 1

    def test_if_statement_complexity(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test that if statements increase complexity."""
        code = """
def with_if(x):
    if x > 0:
        return "positive"
    return "non-positive"
"""
        result = analyzer.analyze(code)

        # Base 1 + 1 for if = 2
        assert result.complexity.max_function_complexity == 2

    def test_loop_complexity(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test that loops increase complexity."""
        code = """
def with_loop(items):
    total = 0
    for item in items:
        total += item
    return total
"""
        result = analyzer.analyze(code)

        # Base 1 + 1 for loop = 2
        assert result.complexity.max_function_complexity == 2

    def test_multiple_conditions_complexity(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test complexity with multiple conditions."""
        code = """
def complex_logic(a, b, c):
    if a > 0 and b > 0:
        if c > 0:
            return "all positive"
        return "partial"
    elif a < 0 or b < 0:
        return "negative"
    return "zero"
"""
        result = analyzer.analyze(code)

        # Higher complexity due to nested conditions and boolean ops
        assert result.complexity.max_function_complexity >= 4

    def test_complex_function_flagged(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test that highly complex functions are flagged."""
        # Create a function with high complexity
        code = """
def very_complex(a, b, c, d, e, f, g, h, i, j, k):
    if a: return 1
    if b: return 2
    if c: return 3
    if d: return 4
    if e: return 5
    if f: return 6
    if g: return 7
    if h: return 8
    if i: return 9
    if j: return 10
    if k: return 11
    return 0
"""
        result = analyzer.analyze(code)

        # Should be flagged as complex (threshold is 10)
        assert len(result.complexity.complex_functions) > 0
        assert "very_complex" in result.complexity.complex_functions[0]


class TestDocumentationAnalysis:
    """Tests for documentation coverage analysis."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_fully_documented_code(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test code with full documentation."""
        code = '''
"""Module docstring."""

def documented_func():
    """Function docstring."""
    pass

class DocumentedClass:
    """Class docstring."""

    def documented_method(self):
        """Method docstring."""
        pass
'''
        result = analyzer.analyze(code)

        assert result.documentation.coverage_percentage == 100.0
        assert len(result.documentation.missing_docstrings) == 0

    def test_undocumented_function(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test detection of undocumented functions."""
        code = """
def undocumented_func():
    pass
"""
        result = analyzer.analyze(code)

        assert result.documentation.coverage_percentage < 100
        assert "undocumented_func" in result.documentation.missing_docstrings

    def test_partial_documentation(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test partially documented code."""
        code = '''
def documented():
    """Has docstring."""
    pass

def undocumented():
    pass
'''
        result = analyzer.analyze(code)

        assert result.documentation.documented_items == 1
        assert result.documentation.total_items == 2
        assert result.documentation.coverage_percentage == 50.0


class TestTypeHintAnalysis:
    """Tests for type hint coverage analysis."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_fully_typed_function(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test function with full type hints."""
        code = """
def typed_func(name: str, age: int) -> str:
    return f"{name} is {age}"
"""
        result = analyzer.analyze(code)

        assert result.type_hints.coverage_percentage == 100.0
        assert result.type_hints.typed_parameters == 2
        assert result.type_hints.typed_return_types == 1

    def test_untyped_function(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test function without type hints."""
        code = """
def untyped_func(name, age):
    return f"{name} is {age}"
"""
        result = analyzer.analyze(code)

        assert result.type_hints.coverage_percentage < 100
        assert result.type_hints.total_parameters == 2
        assert result.type_hints.typed_parameters == 0

    def test_self_cls_not_counted(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test that self and cls parameters are not counted."""
        code = """
class MyClass:
    def method(self, value: int) -> None:
        pass

    @classmethod
    def class_method(cls, value: str) -> None:
        pass
"""
        result = analyzer.analyze(code)

        # self and cls should not be counted as requiring type hints
        assert result.type_hints.total_parameters == 2  # value in each method


class TestSecurityIssueDetection:
    """Tests for security pattern detection."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_detect_eval(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test detection of eval() usage."""
        code = """
def dangerous(user_input):
    return eval(user_input)
"""
        result = analyzer.analyze(code)

        security_issues = [i for i in result.issues if i.category == IssueCategory.SECURITY]
        assert len(security_issues) > 0
        assert any("eval" in i.message.lower() for i in security_issues)

    def test_detect_exec(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test detection of exec() usage."""
        code = """
def dangerous(code_string):
    exec(code_string)
"""
        result = analyzer.analyze(code)

        security_issues = [i for i in result.issues if i.category == IssueCategory.SECURITY]
        assert len(security_issues) > 0
        assert any("exec" in i.message.lower() for i in security_issues)

    def test_detect_os_system(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test detection of os.system() usage."""
        code = """
import os

def run_command(cmd):
    os.system(cmd)
"""
        result = analyzer.analyze(code)

        security_issues = [i for i in result.issues if i.category == IssueCategory.SECURITY]
        assert len(security_issues) > 0
        assert any("os.system" in i.message.lower() for i in security_issues)

    def test_detect_hardcoded_password(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test detection of hardcoded passwords."""
        code = """
def connect():
    password = "secretpassword123"
    return connect_db(password=password)
"""
        result = analyzer.analyze(code)

        security_issues = [i for i in result.issues if i.category == IssueCategory.SECURITY]
        assert len(security_issues) > 0
        assert any("password" in i.message.lower() for i in security_issues)

    def test_no_false_positive_for_safe_code(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test that safe code doesn't trigger false positives."""
        code = '''
def safe_function(data: dict) -> str:
    """Process data safely."""
    return str(data.get("value", ""))
'''
        result = analyzer.analyze(code)

        security_issues = [i for i in result.issues if i.category == IssueCategory.SECURITY]
        assert len(security_issues) == 0


class TestPerformanceIssueDetection:
    """Tests for performance anti-pattern detection."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_detect_range_len(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test detection of range(len()) anti-pattern."""
        code = """
def bad_iteration(items):
    for i in range(len(items)):
        print(items[i])
"""
        result = analyzer.analyze(code)

        perf_issues = [i for i in result.issues if i.category == IssueCategory.PERFORMANCE]
        assert len(perf_issues) > 0
        assert any("enumerate" in i.message.lower() for i in perf_issues)


class TestStyleIssueDetection:
    """Tests for style issue detection."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_detect_long_lines(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test detection of lines exceeding 120 characters."""
        long_line = "x = " + "a" * 150
        code = f"""
def func():
    {long_line}
"""
        result = analyzer.analyze(code)

        style_issues = [i for i in result.issues if i.category == IssueCategory.STYLE]
        assert any("120" in i.message for i in style_issues)

    def test_detect_bare_except(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test detection of bare except clause."""
        code = """
def risky():
    try:
        do_something()
    except:
        pass
"""
        result = analyzer.analyze(code)

        style_issues = [i for i in result.issues if i.category == IssueCategory.STYLE]
        assert any("bare except" in i.message.lower() for i in style_issues)

    def test_detect_mutable_default(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test detection of mutable default arguments."""
        code = """
def bad_default(items=[]):
    items.append(1)
    return items
"""
        result = analyzer.analyze(code)

        correctness_issues = [i for i in result.issues if i.category == IssueCategory.CORRECTNESS]
        assert any("mutable default" in i.message.lower() for i in correctness_issues)


class TestScoreCalculation:
    """Tests for overall score calculation."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_perfect_code_high_score(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test that well-written code gets high score."""
        code = '''
"""Module for greeting operations."""

def greet(name: str) -> str:
    """Return a greeting message.

    Args:
        name: The person's name

    Returns:
        A greeting string
    """
    return f"Hello, {name}!"


def farewell(name: str) -> str:
    """Return a farewell message.

    Args:
        name: The person's name

    Returns:
        A farewell string
    """
    return f"Goodbye, {name}!"
'''
        result = analyzer.analyze(code)

        # Well-written code should score high
        assert result.overall_score >= 80
        assert result.grade in ["A", "B"]

    def test_poor_code_low_score(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test that poorly written code gets low score."""
        code = """
def x(a,b,c,d,e,f,g,h,i,j):
    password = "hardcoded123"
    eval(a)
    if b: pass
    if c: pass
    if d: pass
    if e: pass
    if f: pass
    if g: pass
    if h: pass
    if i: pass
    if j: pass
"""
        result = analyzer.analyze(code)

        # Poor code should score low
        assert result.overall_score < 50
        assert result.grade in ["D", "F"]


class TestGradeCalculation:
    """Tests for letter grade calculation."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_grade_thresholds(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test grade calculation at boundaries."""
        assert analyzer._calculate_grade(95) == "A"
        assert analyzer._calculate_grade(90) == "A"
        assert analyzer._calculate_grade(85) == "B"
        assert analyzer._calculate_grade(80) == "B"
        assert analyzer._calculate_grade(75) == "C"
        assert analyzer._calculate_grade(70) == "C"
        assert analyzer._calculate_grade(65) == "D"
        assert analyzer._calculate_grade(60) == "D"
        assert analyzer._calculate_grade(55) == "F"
        assert analyzer._calculate_grade(0) == "F"


class TestRecommendations:
    """Tests for recommendation generation."""

    @pytest.fixture
    def analyzer(self) -> CodeQualityAnalyzer:
        """Create analyzer instance."""
        return CodeQualityAnalyzer()

    def test_recommendations_for_undocumented_code(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test recommendations when documentation is lacking."""
        code = """
def func1(): pass
def func2(): pass
def func3(): pass
"""
        result = analyzer.analyze(code)

        assert any("docstring" in r.lower() for r in result.recommendations)

    def test_recommendations_for_security_issues(self, analyzer: CodeQualityAnalyzer) -> None:
        """Test recommendations when security issues exist."""
        code = """
def dangerous(input):
    eval(input)
"""
        result = analyzer.analyze(code)

        assert any("critical" in r.lower() for r in result.recommendations)


class TestConvenienceFunctions:
    """Tests for module-level convenience functions."""

    def test_analyze_code_quality_function(self) -> None:
        """Test the analyze_code_quality convenience function."""
        code = "def hello(): pass"
        result = analyze_code_quality(code)

        assert isinstance(result, QualityAnalysisResult)

    def test_get_quality_tier_recommendation_low(self) -> None:
        """Test tier recommendation for low quality code."""
        tier = get_quality_tier_recommendation(30)
        assert tier == "opus"

    def test_get_quality_tier_recommendation_medium(self) -> None:
        """Test tier recommendation for medium quality code."""
        tier = get_quality_tier_recommendation(60)
        assert tier == "sonnet"

    def test_get_quality_tier_recommendation_high(self) -> None:
        """Test tier recommendation for high quality code."""
        tier = get_quality_tier_recommendation(85)
        assert tier == "haiku"


class TestDataclassConversion:
    """Tests for dataclass to_dict methods."""

    def test_code_issue_to_dict(self) -> None:
        """Test CodeIssue.to_dict()."""
        issue = CodeIssue(
            category=IssueCategory.SECURITY,
            severity=IssueSeverity.CRITICAL,
            message="Test issue",
            line_number=10,
            suggestion="Fix it",
        )
        d = issue.to_dict()

        assert d["category"] == "security"
        assert d["severity"] == "critical"
        assert d["message"] == "Test issue"
        assert d["line_number"] == 10

    def test_complexity_metrics_to_dict(self) -> None:
        """Test ComplexityMetrics.to_dict()."""
        metrics = ComplexityMetrics(
            total_complexity=15,
            max_function_complexity=8,
            average_complexity=3.5,
            complex_functions=["func1 (8)"],
        )
        d = metrics.to_dict()

        assert d["total_complexity"] == 15
        assert d["max_function_complexity"] == 8
        assert d["average_complexity"] == 3.5

    def test_documentation_metrics_to_dict(self) -> None:
        """Test DocumentationMetrics.to_dict()."""
        metrics = DocumentationMetrics(
            total_items=10,
            documented_items=8,
            coverage_percentage=80.0,
        )
        d = metrics.to_dict()

        assert d["total_items"] == 10
        assert d["documented_items"] == 8
        assert d["coverage_percentage"] == 80.0

    def test_type_hint_metrics_to_dict(self) -> None:
        """Test TypeHintMetrics.to_dict()."""
        metrics = TypeHintMetrics(
            total_parameters=5,
            typed_parameters=4,
            total_return_types=2,
            typed_return_types=2,
            coverage_percentage=85.7,
        )
        d = metrics.to_dict()

        assert d["total_parameters"] == 5
        assert d["typed_parameters"] == 4

    def test_quality_analysis_result_to_dict(self) -> None:
        """Test QualityAnalysisResult.to_dict()."""
        result = QualityAnalysisResult(
            overall_score=85.5,
            grade="B",
        )
        d = result.to_dict()

        assert d["overall_score"] == 85.5
        assert d["grade"] == "B"
        assert "issue_counts" in d
        assert "complexity" in d
