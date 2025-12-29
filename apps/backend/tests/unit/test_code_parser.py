"""Tests for the code block parser.

Tests the extraction and parsing of code blocks from LLM responses.
"""

from src.agents.processing.parser import (
    CodeBlock,
    Language,
    combine_code_blocks,
    extract_filepath,
    extract_python_metadata,
    format_as_markdown,
    parse_code_blocks,
)


class TestLanguageEnum:
    """Tests for Language enum."""

    def test_from_string_python(self) -> None:
        """Test Python language detection."""
        assert Language.from_string("python") == Language.PYTHON
        assert Language.from_string("Python") == Language.PYTHON
        assert Language.from_string("py") == Language.PYTHON
        assert Language.from_string("python3") == Language.PYTHON

    def test_from_string_javascript(self) -> None:
        """Test JavaScript language detection."""
        assert Language.from_string("javascript") == Language.JAVASCRIPT
        assert Language.from_string("js") == Language.JAVASCRIPT

    def test_from_string_typescript(self) -> None:
        """Test TypeScript language detection."""
        assert Language.from_string("typescript") == Language.TYPESCRIPT
        assert Language.from_string("ts") == Language.TYPESCRIPT

    def test_from_string_bash(self) -> None:
        """Test Bash language detection."""
        assert Language.from_string("bash") == Language.BASH
        assert Language.from_string("sh") == Language.BASH
        assert Language.from_string("shell") == Language.SHELL

    def test_from_string_unknown(self) -> None:
        """Test unknown language fallback."""
        assert Language.from_string("unknown_lang") == Language.UNKNOWN
        assert Language.from_string("") == Language.UNKNOWN


class TestExtractFilepath:
    """Tests for filepath extraction."""

    def test_extract_python_filepath(self) -> None:
        """Test extracting Python filepath from comment."""
        content = "# src/services/auth.py\ndef authenticate():\n    pass"
        filepath, cleaned = extract_filepath(content)
        assert filepath == "src/services/auth.py"
        assert cleaned == "def authenticate():\n    pass"

    def test_extract_filepath_with_file_prefix(self) -> None:
        """Test extracting filepath with 'file:' prefix."""
        content = "# file: src/main.py\nprint('hello')"
        filepath, cleaned = extract_filepath(content)
        assert filepath == "src/main.py"
        assert cleaned == "print('hello')"

    def test_no_filepath(self) -> None:
        """Test content without filepath."""
        content = "def hello():\n    print('world')"
        filepath, cleaned = extract_filepath(content)
        assert filepath is None
        assert cleaned == content

    def test_filepath_case_insensitive(self) -> None:
        """Test case-insensitive filepath extraction."""
        content = "# File: Test.py\ncode here"
        filepath, cleaned = extract_filepath(content)
        assert filepath == "Test.py"


class TestParseCodeBlocks:
    """Tests for code block parsing."""

    def test_parse_single_python_block(self) -> None:
        """Test parsing a single Python code block."""
        response = """Here's the code:

```python
def hello():
    print("world")
```

That's it!"""
        parsed = parse_code_blocks(response)

        assert len(parsed.code_blocks) == 1
        assert parsed.code_blocks[0].language == Language.PYTHON
        assert "def hello():" in parsed.code_blocks[0].content
        assert parsed.has_code

    def test_parse_multiple_blocks(self) -> None:
        """Test parsing multiple code blocks."""
        response = """Here's the implementation:

```python
def add(a, b):
    return a + b
```

And the tests:

```python
def test_add():
    assert add(1, 2) == 3
```
"""
        parsed = parse_code_blocks(response)

        assert len(parsed.code_blocks) == 2
        assert parsed.code_blocks[0].language == Language.PYTHON
        assert parsed.code_blocks[1].language == Language.PYTHON
        assert not parsed.code_blocks[0].is_test
        assert parsed.code_blocks[1].is_test

    def test_parse_with_filepath(self) -> None:
        """Test parsing code block with filepath comment."""
        response = """```python
# src/utils/math.py
def multiply(a, b):
    return a * b
```"""
        parsed = parse_code_blocks(response)

        assert len(parsed.code_blocks) == 1
        assert parsed.code_blocks[0].filepath == "src/utils/math.py"
        assert "multiply" in parsed.code_blocks[0].content
        # Filepath comment should be removed from content
        assert "src/utils/math.py" not in parsed.code_blocks[0].content

    def test_parse_mixed_languages(self) -> None:
        """Test parsing blocks with different languages."""
        response = """Python code:
```python
print("hello")
```

JSON config:
```json
{"key": "value"}
```
"""
        parsed = parse_code_blocks(response)

        assert len(parsed.code_blocks) == 2
        assert parsed.code_blocks[0].language == Language.PYTHON
        assert parsed.code_blocks[1].language == Language.JSON

    def test_parse_no_code_blocks(self) -> None:
        """Test parsing response with no code blocks."""
        response = "This is just text with no code blocks."
        parsed = parse_code_blocks(response)

        assert len(parsed.code_blocks) == 0
        assert not parsed.has_code
        assert parsed.primary_code is None

    def test_parse_extracts_explanations(self) -> None:
        """Test that explanations are extracted."""
        response = """First explanation.

```python
code()
```

Second explanation."""
        parsed = parse_code_blocks(response)

        assert len(parsed.explanations) == 2
        assert "First explanation" in parsed.explanations[0]
        assert "Second explanation" in parsed.explanations[1]


class TestParsedResponse:
    """Tests for ParsedResponse class."""

    def test_primary_code_returns_longest_python(self) -> None:
        """Test that primary_code returns longest Python block."""
        response = """```python
short
```

```python
def longer_function():
    with open("file") as f:
        data = f.read()
    return data
```"""
        parsed = parse_code_blocks(response)

        primary = parsed.primary_code
        assert primary is not None
        assert "longer_function" in primary.content

    def test_primary_code_excludes_tests(self) -> None:
        """Test that primary_code excludes test blocks."""
        response = """```python
def test_something():
    assert True
```

```python
def main_code():
    return 42
```"""
        parsed = parse_code_blocks(response)

        primary = parsed.primary_code
        assert primary is not None
        assert "main_code" in primary.content
        assert "test_something" not in primary.content

    def test_test_blocks_property(self) -> None:
        """Test that test_blocks returns only test code."""
        response = """```python
def main():
    pass
```

```python
def test_main():
    assert main() is None
```

```python
class TestMain:
    def test_it(self):
        pass
```"""
        parsed = parse_code_blocks(response)

        test_blocks = parsed.test_blocks
        assert len(test_blocks) == 2
        assert all(b.is_test for b in test_blocks)

    def test_all_code_concatenates(self) -> None:
        """Test that all_code combines all blocks."""
        response = """```python
def a(): pass
```

```python
def b(): pass
```"""
        parsed = parse_code_blocks(response)

        all_code = parsed.all_code
        assert "def a():" in all_code
        assert "def b():" in all_code


class TestCodeBlock:
    """Tests for CodeBlock class."""

    def test_is_python(self) -> None:
        """Test is_python property."""
        python_block = CodeBlock(content="code", language=Language.PYTHON)
        js_block = CodeBlock(content="code", language=Language.JAVASCRIPT)

        assert python_block.is_python
        assert not js_block.is_python

    def test_is_test_by_filepath(self) -> None:
        """Test is_test detection by filepath."""
        test_block = CodeBlock(
            content="def something(): pass",
            filepath="tests/test_auth.py",
        )
        assert test_block.is_test

    def test_is_test_by_content(self) -> None:
        """Test is_test detection by content."""
        test_block = CodeBlock(content="def test_something(): pass")
        class_block = CodeBlock(content="class TestSomething: pass")
        pytest_block = CodeBlock(content="@pytest.mark.asyncio\ndef check(): pass")

        assert test_block.is_test
        assert class_block.is_test
        assert pytest_block.is_test

    def test_line_count(self) -> None:
        """Test line counting."""
        block = CodeBlock(content="line1\nline2\nline3")
        assert block.line_count == 3


class TestExtractPythonMetadata:
    """Tests for Python metadata extraction."""

    def test_extract_functions(self) -> None:
        """Test function name extraction."""
        content = """
def hello():
    pass

async def async_func():
    pass
"""
        metadata = extract_python_metadata(content)
        assert "hello" in metadata["functions"]
        assert "async_func" in metadata["functions"]

    def test_extract_classes(self) -> None:
        """Test class name extraction."""
        content = """
class MyClass:
    pass

class AnotherClass(BaseClass):
    pass
"""
        metadata = extract_python_metadata(content)
        assert "MyClass" in metadata["classes"]
        assert "AnotherClass" in metadata["classes"]

    def test_extract_imports(self) -> None:
        """Test import extraction."""
        content = """
import os
from typing import Any
from collections.abc import Generator
"""
        metadata = extract_python_metadata(content)
        assert len(metadata["imports"]) == 3

    def test_detect_main_block(self) -> None:
        """Test main block detection."""
        with_main = 'if __name__ == "__main__":\n    main()'
        without_main = "def main(): pass"

        assert extract_python_metadata(with_main)["has_main"]
        assert not extract_python_metadata(without_main)["has_main"]


class TestCombineCodeBlocks:
    """Tests for combining code blocks."""

    def test_combine_blocks(self) -> None:
        """Test combining multiple blocks."""
        blocks = [
            CodeBlock(content="def a(): pass"),
            CodeBlock(content="def b(): pass"),
        ]
        combined = combine_code_blocks(blocks)
        assert "def a():" in combined
        assert "def b():" in combined


class TestFormatAsMarkdown:
    """Tests for markdown formatting."""

    def test_format_single_block(self) -> None:
        """Test formatting a single block."""
        blocks = [CodeBlock(content="print('hello')", language=Language.PYTHON)]
        markdown = format_as_markdown(blocks)

        assert "```python" in markdown
        assert "print('hello')" in markdown
        assert "```" in markdown

    def test_format_with_filepath(self) -> None:
        """Test formatting with filepath."""
        blocks = [
            CodeBlock(
                content="def main(): pass",
                language=Language.PYTHON,
                filepath="src/main.py",
            )
        ]
        markdown = format_as_markdown(blocks)

        assert "# src/main.py" in markdown
