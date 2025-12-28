"""Tests for the code formatter.

Tests formatting, linting, and syntax validation of generated code.
"""

from src.agents.code_formatter import (
    CodeFile,
    FormatResult,
    LintCategory,
    LintIssue,
    LintSeverity,
    MultiFileResult,
    SyntaxError_,
    create_multi_file_result,
    format_python_code,
    infer_filepath,
    validate_python_syntax,
)


class TestLintIssue:
    """Tests for LintIssue dataclass."""

    def test_create_issue(self) -> None:
        """Test creating a lint issue."""
        issue = LintIssue(
            message="Unused import",
            severity=LintSeverity.WARNING,
            category=LintCategory.UNUSED,
            line=5,
            rule="W0611",
        )
        assert issue.message == "Unused import"
        assert issue.severity == LintSeverity.WARNING
        assert issue.category == LintCategory.UNUSED
        assert issue.line == 5

    def test_to_dict(self) -> None:
        """Test converting issue to dictionary."""
        issue = LintIssue(
            message="Test",
            severity=LintSeverity.ERROR,
            category=LintCategory.SYNTAX,
        )
        result = issue.to_dict()
        assert result["message"] == "Test"
        assert result["severity"] == "error"
        assert result["category"] == "syntax"


class TestSyntaxError:
    """Tests for SyntaxError_ dataclass."""

    def test_create_error(self) -> None:
        """Test creating a syntax error."""
        error = SyntaxError_(
            message="invalid syntax",
            line=10,
            column=5,
            text="def foo(",
        )
        assert error.message == "invalid syntax"
        assert error.line == 10
        assert error.column == 5

    def test_to_dict(self) -> None:
        """Test converting to dictionary."""
        error = SyntaxError_(message="error", line=1, column=0)
        result = error.to_dict()
        assert result["message"] == "error"
        assert result["line"] == 1


class TestFormatResult:
    """Tests for FormatResult dataclass."""

    def test_error_count(self) -> None:
        """Test counting error-level issues."""
        result = FormatResult(
            original_code="x",
            formatted_code="x",
            is_valid=True,
            lint_issues=[
                LintIssue("e1", LintSeverity.ERROR, LintCategory.SYNTAX),
                LintIssue("w1", LintSeverity.WARNING, LintCategory.STYLE),
                LintIssue("e2", LintSeverity.ERROR, LintCategory.SYNTAX),
            ],
        )
        assert result.error_count == 2
        assert result.warning_count == 1

    def test_to_dict(self) -> None:
        """Test converting to dictionary."""
        result = FormatResult(
            original_code="x",
            formatted_code="y",
            is_valid=True,
            was_modified=True,
        )
        d = result.to_dict()
        assert d["is_valid"] is True
        assert d["was_modified"] is True


class TestCodeFile:
    """Tests for CodeFile dataclass."""

    def test_create_file(self) -> None:
        """Test creating a code file."""
        file = CodeFile(
            filepath="src/main.py",
            content="def main():\n    pass\n",
            language="python",
        )
        assert file.filepath == "src/main.py"
        assert file.line_count == 2
        assert not file.is_test

    def test_test_file_detection(self) -> None:
        """Test test file detection when explicitly set."""
        file = CodeFile(
            filepath="tests/test_main.py",
            content="def test_main(): pass",
            is_test=True,  # Must be explicitly set
        )
        assert file.is_test

    def test_to_dict(self) -> None:
        """Test converting to dictionary."""
        file = CodeFile(filepath="src/app.py", content="x = 1")
        result = file.to_dict()
        assert result["filepath"] == "src/app.py"
        assert result["line_count"] == 1


class TestMultiFileResult:
    """Tests for MultiFileResult dataclass."""

    def test_primary_file_selection(self) -> None:
        """Test that longest non-test Python file is selected as primary."""
        files = [
            CodeFile("tests/test_a.py", "def test_a(): pass"),
            CodeFile("src/short.py", "x = 1"),
            CodeFile("src/longer.py", "def foo():\n    pass\n\ndef bar():\n    pass"),
        ]
        result = MultiFileResult(files=files)
        assert result.primary_file is not None
        assert result.primary_file.filepath == "src/longer.py"

    def test_test_files_extraction(self) -> None:
        """Test that test files are extracted."""
        files = [
            CodeFile("src/main.py", "x = 1"),
            CodeFile("tests/test_a.py", "def test_a(): pass", is_test=True),
            CodeFile("tests/test_b.py", "def test_b(): pass", is_test=True),
        ]
        result = MultiFileResult(files=files)
        assert len(result.test_files) == 2

    def test_total_lines(self) -> None:
        """Test total line count."""
        files = [
            CodeFile("a.py", "line1\nline2"),
            CodeFile("b.py", "line1\nline2\nline3"),
        ]
        result = MultiFileResult(files=files)
        assert result.total_lines == 5

    def test_to_dict(self) -> None:
        """Test converting to dictionary."""
        files = [CodeFile("src/main.py", "x = 1")]
        result = MultiFileResult(files=files, all_valid=True)
        d = result.to_dict()
        assert d["file_count"] == 1
        assert d["all_valid"] is True


class TestValidatePythonSyntax:
    """Tests for syntax validation."""

    def test_valid_syntax(self) -> None:
        """Test valid Python syntax."""
        code = "def hello():\n    return 'world'"
        is_valid, error = validate_python_syntax(code)
        assert is_valid
        assert error is None

    def test_invalid_syntax(self) -> None:
        """Test invalid Python syntax."""
        code = "def hello(\n    return 'world'"
        is_valid, error = validate_python_syntax(code)
        assert not is_valid
        assert error is not None
        # Python reports the unclosed parenthesis on line 1
        assert error.line >= 1

    def test_missing_colon(self) -> None:
        """Test missing colon syntax error."""
        code = "def hello()"
        is_valid, error = validate_python_syntax(code)
        assert not is_valid

    def test_empty_code(self) -> None:
        """Test empty code is valid."""
        is_valid, error = validate_python_syntax("")
        assert is_valid


class TestFormatPythonCode:
    """Tests for code formatting."""

    def test_format_valid_code(self) -> None:
        """Test formatting valid code."""
        code = "def hello():\n    return 'world'"
        result = format_python_code(code)
        assert result.is_valid
        assert "def hello():" in result.formatted_code

    def test_format_invalid_code(self) -> None:
        """Test formatting invalid code."""
        code = "def hello(\n    return 'world'"
        result = format_python_code(code)
        assert not result.is_valid
        assert result.syntax_error is not None

    def test_fix_indentation(self) -> None:
        """Test indentation fixing."""
        code = "def foo():\n  return 1"  # 2-space indent
        result = format_python_code(code, fix_indentation=True)
        assert "    return 1" in result.formatted_code  # 4-space indent

    def test_fix_trailing_whitespace(self) -> None:
        """Test trailing whitespace removal."""
        code = "def foo():   \n    pass   "
        result = format_python_code(code, fix_whitespace=True)
        # Trailing whitespace within lines should be removed
        assert ":   \n" not in result.formatted_code
        assert "pass   " not in result.formatted_code

    def test_fix_multiple_blank_lines(self) -> None:
        """Test reducing multiple blank lines."""
        code = "x = 1\n\n\n\n\ny = 2"
        result = format_python_code(code, fix_whitespace=True)
        # Should have at most 2 consecutive blank lines
        assert "\n\n\n\n" not in result.formatted_code

    def test_linting_detects_long_lines(self) -> None:
        """Test linting detects lines over 100 chars."""
        long_line = "x = " + "a" * 100
        code = f"def foo():\n    {long_line}"
        result = format_python_code(code, run_linting=True)
        assert any("too long" in i.message.lower() for i in result.lint_issues)

    def test_linting_detects_security_issues(self) -> None:
        """Test linting detects eval() usage."""
        code = "result = eval(user_input)"
        result = format_python_code(code, run_linting=True)
        assert any("eval" in i.message.lower() for i in result.lint_issues)

    def test_was_modified_flag(self) -> None:
        """Test was_modified flag."""
        code = "def foo():\n    pass\n"  # Already well formatted
        format_python_code(code)
        # May or may not be modified depending on exact formatting

        code2 = "def foo():\n  pass"  # Needs fixing
        result2 = format_python_code(code2)
        assert result2.was_modified

    def test_skip_formatting_options(self) -> None:
        """Test skipping formatting options."""
        code = "def foo():\n  pass"
        result = format_python_code(
            code,
            fix_indentation=False,
            fix_whitespace=False,
            fix_spacing=False,
            run_linting=False,
        )
        assert result.is_valid
        assert result.formatted_code == code
        assert len(result.lint_issues) == 0


class TestCreateMultiFileResult:
    """Tests for multi-file result creation."""

    def test_create_from_tuples(self) -> None:
        """Test creating result from tuples."""
        blocks = [
            ("src/main.py", "def main(): pass", "python"),
            ("tests/test_main.py", "def test_main(): pass", "python"),
        ]
        result = create_multi_file_result(blocks)
        assert len(result.files) == 2
        assert result.primary_file is not None

    def test_formatting_applied(self) -> None:
        """Test that formatting is applied to Python files."""
        blocks = [
            ("src/app.py", "def foo():\n  return 1", "python"),
        ]
        result = create_multi_file_result(blocks, format_code=True)
        assert result.files[0].format_result is not None
        assert "    return 1" in result.files[0].content

    def test_skip_formatting(self) -> None:
        """Test skipping formatting."""
        blocks = [
            ("src/app.py", "def foo():\n  return 1", "python"),
        ]
        result = create_multi_file_result(blocks, format_code=False)
        assert result.files[0].format_result is None
        assert "  return 1" in result.files[0].content

    def test_invalid_syntax_affects_all_valid(self) -> None:
        """Test that invalid syntax sets all_valid to False."""
        blocks = [
            ("src/valid.py", "x = 1", "python"),
            ("src/invalid.py", "def foo(", "python"),
        ]
        result = create_multi_file_result(blocks, format_code=True)
        assert not result.all_valid

    def test_non_python_files(self) -> None:
        """Test handling of non-Python files."""
        blocks = [
            ("config.json", '{"key": "value"}', "json"),
            ("src/main.py", "x = 1", "python"),
        ]
        result = create_multi_file_result(blocks, format_code=True)
        assert len(result.files) == 2
        # JSON file should not have format_result
        json_file = next(f for f in result.files if f.filepath == "config.json")
        assert json_file.format_result is None


class TestInferFilepath:
    """Tests for filepath inference."""

    def test_infer_from_class(self) -> None:
        """Test inferring filepath from class name."""
        content = "class UserService:\n    pass"
        filepath = infer_filepath(content)
        assert "user_service" in filepath

    def test_infer_from_function(self) -> None:
        """Test inferring filepath from function name."""
        content = "def calculate_total():\n    pass"
        filepath = infer_filepath(content)
        assert "calculate_total" in filepath

    def test_infer_test_file(self) -> None:
        """Test inferring test file."""
        content = "def test_something():\n    pass"
        filepath = infer_filepath(content)
        assert "test" in filepath

    def test_default_fallback(self) -> None:
        """Test fallback to default name."""
        content = "x = 1\ny = 2"
        filepath = infer_filepath(content, index=3)
        assert "module_3" in filepath

    def test_camel_case_to_snake_case(self) -> None:
        """Test CamelCase to snake_case conversion."""
        content = "class MyAwesomeClass:\n    pass"
        filepath = infer_filepath(content)
        assert "my_awesome_class" in filepath.lower()
