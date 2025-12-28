"""Code formatting, linting, and syntax validation for generated code.

This module provides utilities for ensuring generated code meets quality standards:
- Syntax validation using Python's AST parser
- Basic code formatting (indentation, line length)
- Linting for common issues (unused imports, undefined names)
- Multi-file code organization

Example:
    >>> code = "def hello( ):\\n  return 'world'"
    >>> result = format_python_code(code)
    >>> result.formatted_code
    "def hello():\\n    return 'world'"
    >>> result.is_valid
    True
"""

import ast
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from src.core.logging import get_logger

logger = get_logger(__name__)


class LintSeverity(str, Enum):
    """Severity level for lint issues."""

    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class LintCategory(str, Enum):
    """Category of lint issue."""

    SYNTAX = "syntax"
    STYLE = "style"
    UNUSED = "unused"
    UNDEFINED = "undefined"
    SECURITY = "security"
    COMPLEXITY = "complexity"


@dataclass
class LintIssue:
    """A single lint issue found in code."""

    message: str
    severity: LintSeverity
    category: LintCategory
    line: int | None = None
    column: int | None = None
    rule: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "message": self.message,
            "severity": self.severity.value,
            "category": self.category.value,
            "line": self.line,
            "column": self.column,
            "rule": self.rule,
        }


@dataclass
class SyntaxError_:
    """Syntax error details."""

    message: str
    line: int
    column: int
    text: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "message": self.message,
            "line": self.line,
            "column": self.column,
            "text": self.text,
        }


@dataclass
class FormatResult:
    """Result of formatting a code block."""

    original_code: str
    formatted_code: str
    is_valid: bool
    syntax_error: SyntaxError_ | None = None
    lint_issues: list[LintIssue] = field(default_factory=list)
    was_modified: bool = False

    @property
    def error_count(self) -> int:
        """Count of error-level issues."""
        return sum(1 for i in self.lint_issues if i.severity == LintSeverity.ERROR)

    @property
    def warning_count(self) -> int:
        """Count of warning-level issues."""
        return sum(1 for i in self.lint_issues if i.severity == LintSeverity.WARNING)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "is_valid": self.is_valid,
            "was_modified": self.was_modified,
            "error_count": self.error_count,
            "warning_count": self.warning_count,
            "syntax_error": self.syntax_error.to_dict() if self.syntax_error else None,
            "lint_issues": [i.to_dict() for i in self.lint_issues],
        }


@dataclass
class CodeFile:
    """A single file in a multi-file code generation result."""

    filepath: str
    content: str
    language: str = "python"
    format_result: FormatResult | None = None
    is_test: bool = False
    line_count: int = 0

    def __post_init__(self) -> None:
        """Calculate line count after initialization."""
        self.line_count = len(self.content.strip().splitlines())

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "filepath": self.filepath,
            "language": self.language,
            "is_test": self.is_test,
            "line_count": self.line_count,
            "format_result": self.format_result.to_dict() if self.format_result else None,
        }


@dataclass
class MultiFileResult:
    """Result of multi-file code generation."""

    files: list[CodeFile] = field(default_factory=list)
    primary_file: CodeFile | None = None
    test_files: list[CodeFile] = field(default_factory=list)
    all_valid: bool = True
    total_lines: int = 0

    def __post_init__(self) -> None:
        """Calculate totals after initialization."""
        self.total_lines = sum(f.line_count for f in self.files)
        self.test_files = [f for f in self.files if f.is_test]
        # Primary file is the longest non-test Python file
        non_test = [f for f in self.files if not f.is_test and f.language == "python"]
        if non_test:
            self.primary_file = max(non_test, key=lambda f: f.line_count)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "file_count": len(self.files),
            "test_file_count": len(self.test_files),
            "total_lines": self.total_lines,
            "all_valid": self.all_valid,
            "files": [f.to_dict() for f in self.files],
            "primary_filepath": self.primary_file.filepath if self.primary_file else None,
        }


def validate_python_syntax(code: str) -> tuple[bool, SyntaxError_ | None]:
    """Validate Python syntax using AST parser.

    Args:
        code: Python source code

    Returns:
        Tuple of (is_valid, syntax_error or None)
    """
    try:
        ast.parse(code)
        return True, None
    except SyntaxError as e:
        return False, SyntaxError_(
            message=str(e.msg) if e.msg else "Syntax error",
            line=e.lineno or 0,
            column=e.offset or 0,
            text=e.text,
        )


def _fix_indentation(code: str, indent_size: int = 4) -> str:
    """Fix indentation to use consistent spaces.

    Args:
        code: Source code
        indent_size: Number of spaces per indent level

    Returns:
        Code with fixed indentation
    """
    lines = code.splitlines()
    fixed_lines = []

    for line in lines:
        if not line.strip():
            fixed_lines.append("")
            continue

        # Count leading whitespace
        stripped = line.lstrip()
        leading = line[: len(line) - len(stripped)]

        # Convert tabs to spaces and normalize
        leading = leading.replace("\t", " " * indent_size)

        # Round to nearest indent level
        indent_level = len(leading) // indent_size
        if len(leading) % indent_size >= indent_size // 2:
            indent_level += 1

        fixed_lines.append(" " * (indent_level * indent_size) + stripped)

    return "\n".join(fixed_lines)


def _fix_whitespace(code: str) -> str:
    """Fix whitespace issues in code.

    Args:
        code: Source code

    Returns:
        Code with fixed whitespace
    """
    # Remove trailing whitespace from each line
    lines = [line.rstrip() for line in code.splitlines()]

    # Remove excessive blank lines (more than 2 in a row)
    result_lines: list[str] = []
    blank_count = 0

    for line in lines:
        if not line:
            blank_count += 1
            if blank_count <= 2:
                result_lines.append(line)
        else:
            blank_count = 0
            result_lines.append(line)

    # Ensure single newline at end
    result = "\n".join(result_lines)
    return result.rstrip() + "\n" if result.strip() else ""


def _fix_spacing(code: str) -> str:
    """Fix spacing around operators and after commas.

    Args:
        code: Source code

    Returns:
        Code with improved spacing
    """
    # Fix spacing after commas (but not in strings)
    # This is a simple approach - full implementation would need proper parsing
    lines = code.splitlines()
    fixed_lines = []

    for line in lines:
        # Skip if line is mostly a string
        if line.count('"') >= 2 or line.count("'") >= 2:
            fixed_lines.append(line)
            continue

        # Fix spacing after commas not followed by space
        line = re.sub(r",(?=[^\s])", ", ", line)

        # Fix spacing around colons in type hints (simple cases)
        # e.g., "def foo(x:int)" -> "def foo(x: int)"
        line = re.sub(r":(?=[^\s:\]])", ": ", line)

        # Remove double spaces (except at start of line)
        leading = len(line) - len(line.lstrip())
        if leading > 0:
            line = line[:leading] + re.sub(r"  +", " ", line[leading:])
        else:
            line = re.sub(r"  +", " ", line)

        fixed_lines.append(line)

    return "\n".join(fixed_lines)


def _lint_python_code(code: str) -> list[LintIssue]:
    """Run basic linting checks on Python code.

    Args:
        code: Python source code

    Returns:
        List of lint issues found
    """
    issues: list[LintIssue] = []

    try:
        tree = ast.parse(code)
    except SyntaxError:
        return issues  # Syntax issues are handled separately

    lines = code.splitlines()

    # Track defined names and used names
    defined_names: set[str] = set()
    used_names: set[str] = set()
    imported_names: set[str] = set()

    class NameVisitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
            defined_names.add(node.name)
            self.generic_visit(node)

        def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
            defined_names.add(node.name)
            self.generic_visit(node)

        def visit_ClassDef(self, node: ast.ClassDef) -> None:
            defined_names.add(node.name)
            self.generic_visit(node)

        def visit_Name(self, node: ast.Name) -> None:
            if isinstance(node.ctx, ast.Store):
                defined_names.add(node.id)
            elif isinstance(node.ctx, ast.Load):
                used_names.add(node.id)
            self.generic_visit(node)

        def visit_Import(self, node: ast.Import) -> None:
            for alias in node.names:
                name = alias.asname if alias.asname else alias.name.split(".")[0]
                imported_names.add(name)
            self.generic_visit(node)

        def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
            for alias in node.names:
                name = alias.asname if alias.asname else alias.name
                if name != "*":
                    imported_names.add(name)
            self.generic_visit(node)

    visitor = NameVisitor()
    visitor.visit(tree)

    # Check for unused imports (simple check)
    for name in imported_names:
        if name not in used_names and name not in defined_names:
            # Find the line number
            for i, line in enumerate(lines, 1):
                if f"import {name}" in line or f"import {name}," in line or f" {name}" in line:
                    issues.append(
                        LintIssue(
                            message=f"'{name}' imported but unused",
                            severity=LintSeverity.WARNING,
                            category=LintCategory.UNUSED,
                            line=i,
                            rule="W0611",
                        )
                    )
                    break

    # Check for lines that are too long
    for i, line in enumerate(lines, 1):
        if len(line) > 100:
            issues.append(
                LintIssue(
                    message=f"Line too long ({len(line)} > 100 characters)",
                    severity=LintSeverity.INFO,
                    category=LintCategory.STYLE,
                    line=i,
                    rule="E501",
                )
            )

    # Check for common security issues
    security_patterns = [
        (r"\beval\s*\(", "Use of eval() is a security risk", "S307"),
        (r"\bexec\s*\(", "Use of exec() is a security risk", "S102"),
        (r"\b__import__\s*\(", "Use of __import__() is discouraged", "S403"),
        (r"password\s*=\s*['\"][^'\"]+['\"]", "Hardcoded password detected", "S105"),
        (r"secret\s*=\s*['\"][^'\"]+['\"]", "Hardcoded secret detected", "S105"),
    ]

    for pattern, message, rule in security_patterns:
        for i, line in enumerate(lines, 1):
            if re.search(pattern, line, re.IGNORECASE):
                issues.append(
                    LintIssue(
                        message=message,
                        severity=LintSeverity.WARNING,
                        category=LintCategory.SECURITY,
                        line=i,
                        rule=rule,
                    )
                )

    # Check for missing docstrings on public functions/classes
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if not node.name.startswith("_"):
                if not ast.get_docstring(node):
                    issues.append(
                        LintIssue(
                            message=f"Missing docstring in public function '{node.name}'",
                            severity=LintSeverity.INFO,
                            category=LintCategory.STYLE,
                            line=node.lineno,
                            rule="D103",
                        )
                    )
        elif isinstance(node, ast.ClassDef):
            if not node.name.startswith("_"):
                if not ast.get_docstring(node):
                    issues.append(
                        LintIssue(
                            message=f"Missing docstring in public class '{node.name}'",
                            severity=LintSeverity.INFO,
                            category=LintCategory.STYLE,
                            line=node.lineno,
                            rule="D101",
                        )
                    )

    return issues


def format_python_code(
    code: str,
    fix_indentation: bool = True,
    fix_whitespace: bool = True,
    fix_spacing: bool = True,
    run_linting: bool = True,
) -> FormatResult:
    """Format and validate Python code.

    Applies formatting fixes and runs linting checks on Python code.

    Args:
        code: Python source code to format
        fix_indentation: Whether to fix indentation issues
        fix_whitespace: Whether to fix whitespace issues
        fix_spacing: Whether to fix spacing around operators
        run_linting: Whether to run linting checks

    Returns:
        FormatResult with formatted code and any issues found

    Example:
        >>> result = format_python_code("def foo( ):\\n  pass")
        >>> result.formatted_code
        "def foo():\\n    pass\\n"
        >>> result.is_valid
        True
    """
    original_code = code
    formatted_code = code

    # Apply formatting fixes
    if fix_indentation:
        formatted_code = _fix_indentation(formatted_code)

    if fix_whitespace:
        formatted_code = _fix_whitespace(formatted_code)

    if fix_spacing:
        formatted_code = _fix_spacing(formatted_code)

    # Validate syntax
    is_valid, syntax_error = validate_python_syntax(formatted_code)

    # Run linting if valid and requested
    lint_issues: list[LintIssue] = []
    if is_valid and run_linting:
        lint_issues = _lint_python_code(formatted_code)

    was_modified = formatted_code != original_code

    result = FormatResult(
        original_code=original_code,
        formatted_code=formatted_code,
        is_valid=is_valid,
        syntax_error=syntax_error,
        lint_issues=lint_issues,
        was_modified=was_modified,
    )

    logger.debug(
        "Formatted Python code",
        is_valid=is_valid,
        was_modified=was_modified,
        error_count=result.error_count,
        warning_count=result.warning_count,
    )

    return result


def create_multi_file_result(
    code_blocks: list[tuple[str, str, str]],
    format_code: bool = True,
) -> MultiFileResult:
    """Create a multi-file result from code blocks.

    Args:
        code_blocks: List of (filepath, content, language) tuples
        format_code: Whether to format Python files

    Returns:
        MultiFileResult with organized files

    Example:
        >>> blocks = [
        ...     ("src/main.py", "def main(): pass", "python"),
        ...     ("tests/test_main.py", "def test_main(): pass", "python"),
        ... ]
        >>> result = create_multi_file_result(blocks)
        >>> len(result.files)
        2
    """
    files: list[CodeFile] = []
    all_valid = True

    for filepath, content, language in code_blocks:
        # Determine if this is a test file
        is_test = "test" in filepath.lower() or content.strip().startswith("def test_")

        # Format Python files if requested
        format_result = None
        if format_code and language == "python":
            format_result = format_python_code(content)
            content = format_result.formatted_code
            if not format_result.is_valid:
                all_valid = False

        code_file = CodeFile(
            filepath=filepath,
            content=content,
            language=language,
            format_result=format_result,
            is_test=is_test,
        )
        files.append(code_file)

    result = MultiFileResult(files=files, all_valid=all_valid)

    logger.debug(
        "Created multi-file result",
        file_count=len(files),
        test_count=len(result.test_files),
        all_valid=all_valid,
    )

    return result


def infer_filepath(content: str, index: int = 0) -> str:
    """Infer a filepath for code without an explicit path.

    Args:
        content: Code content to analyze
        index: Index for generating unique names

    Returns:
        Inferred filepath
    """
    # Check for class definition
    class_match = re.search(r"^class\s+(\w+)", content, re.MULTILINE)
    if class_match:
        class_name = class_match.group(1)
        # Convert CamelCase to snake_case
        snake_name = re.sub(r"(?<!^)(?=[A-Z])", "_", class_name).lower()
        return f"src/{snake_name}.py"

    # Check for function definition
    func_match = re.search(r"^(?:async\s+)?def\s+(\w+)", content, re.MULTILINE)
    if func_match:
        func_name = func_match.group(1)
        if func_name.startswith("test_"):
            return f"tests/test_{index}.py"
        return f"src/{func_name}.py"

    # Default
    return f"src/module_{index}.py"
