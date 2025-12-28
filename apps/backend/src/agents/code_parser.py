"""Code block parser for extracting structured code from LLM responses.

This module provides utilities for parsing markdown code blocks from LLM
responses into structured data. It handles:
- Multiple code blocks in a single response
- Language detection from fence markers
- File path extraction from comments or headers
- Code validation and cleaning

Example LLM response:
    Here's the implementation:

    ```python
    # src/services/auth.py
    def authenticate(user: str, password: str) -> bool:
        return check_credentials(user, password)
    ```

    And the tests:

    ```python
    # tests/test_auth.py
    def test_authenticate():
        assert authenticate("user", "pass") == True
    ```

Parsed output:
    [
        CodeBlock(language="python", filepath="src/services/auth.py", content="..."),
        CodeBlock(language="python", filepath="tests/test_auth.py", content="..."),
    ]
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from src.core.logging import get_logger

logger = get_logger(__name__)


class Language(str, Enum):
    """Supported programming languages."""

    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    SQL = "sql"
    BASH = "bash"
    SHELL = "shell"
    JSON = "json"
    YAML = "yaml"
    TOML = "toml"
    MARKDOWN = "markdown"
    HTML = "html"
    CSS = "css"
    UNKNOWN = "unknown"

    @classmethod
    def from_string(cls, lang: str) -> "Language":
        """Convert string to Language enum."""
        lang_lower = lang.lower().strip()
        # Handle common aliases
        aliases = {
            "py": cls.PYTHON,
            "python3": cls.PYTHON,
            "js": cls.JAVASCRIPT,
            "ts": cls.TYPESCRIPT,
            "sh": cls.BASH,
            "zsh": cls.BASH,
            "yml": cls.YAML,
            "md": cls.MARKDOWN,
        }
        if lang_lower in aliases:
            return aliases[lang_lower]
        try:
            return cls(lang_lower)
        except ValueError:
            return cls.UNKNOWN


@dataclass
class CodeBlock:
    """A parsed code block from an LLM response.

    Attributes:
        content: The actual code content (without fence markers)
        language: Detected programming language
        filepath: Optional file path extracted from comments
        start_line: Line number where this block started in original response
        raw_block: The original markdown block including fences
        metadata: Additional extracted metadata (e.g., function names, imports)
    """

    content: str
    language: Language = Language.UNKNOWN
    filepath: str | None = None
    start_line: int = 0
    raw_block: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def is_python(self) -> bool:
        """Check if this is Python code."""
        return self.language == Language.PYTHON

    @property
    def is_test(self) -> bool:
        """Check if this looks like test code."""
        if self.filepath:
            return "test" in self.filepath.lower()
        return (
            "def test_" in self.content or "class Test" in self.content or "@pytest" in self.content
        )

    @property
    def line_count(self) -> int:
        """Count lines of code."""
        return len(self.content.strip().splitlines())


@dataclass
class ParsedResponse:
    """Complete parsed response from an LLM.

    Attributes:
        code_blocks: List of extracted code blocks
        explanations: Non-code text from the response
        raw_response: The original full response
        primary_code: The main code block (usually the longest or first)
    """

    code_blocks: list[CodeBlock] = field(default_factory=list)
    explanations: list[str] = field(default_factory=list)
    raw_response: str = ""

    @property
    def primary_code(self) -> CodeBlock | None:
        """Get the primary (main) code block.

        Returns the longest Python code block, or the first block if no Python.
        """
        if not self.code_blocks:
            return None

        # Prefer Python code blocks
        python_blocks = [b for b in self.code_blocks if b.is_python and not b.is_test]
        if python_blocks:
            return max(python_blocks, key=lambda b: b.line_count)

        # Fall back to longest non-test block
        non_test_blocks = [b for b in self.code_blocks if not b.is_test]
        if non_test_blocks:
            return max(non_test_blocks, key=lambda b: b.line_count)

        # Fall back to first block
        return self.code_blocks[0]

    @property
    def test_blocks(self) -> list[CodeBlock]:
        """Get all test code blocks."""
        return [b for b in self.code_blocks if b.is_test]

    @property
    def all_code(self) -> str:
        """Concatenate all code blocks."""
        return "\n\n".join(block.content for block in self.code_blocks)

    @property
    def has_code(self) -> bool:
        """Check if any code was extracted."""
        return len(self.code_blocks) > 0


# Regex patterns for parsing
CODE_BLOCK_PATTERN = re.compile(
    r"```(\w*)\n(.*?)```",
    re.DOTALL,
)

# Pattern to extract filepath from first comment line
FILEPATH_PATTERNS = [
    re.compile(r"^#\s*(?:file:|filepath:)?\s*([^\n]+\.py)\s*$", re.MULTILINE | re.IGNORECASE),
    re.compile(r"^#\s*([a-zA-Z0-9_/\\]+\.py)\s*$", re.MULTILINE),
    re.compile(r"^//\s*(?:file:|filepath:)?\s*([^\n]+\.[a-z]+)\s*$", re.MULTILINE | re.IGNORECASE),
]


def extract_filepath(content: str) -> tuple[str | None, str]:
    """Extract filepath from code content if present.

    Looks for patterns like:
    - # src/services/auth.py
    - # file: auth.py
    - // filepath: index.ts

    Args:
        content: Code content to search

    Returns:
        Tuple of (filepath or None, content with filepath comment removed)
    """
    for pattern in FILEPATH_PATTERNS:
        match = pattern.search(content)
        if match:
            filepath = match.group(1).strip()
            # Remove the filepath line from content
            cleaned = pattern.sub("", content, count=1).lstrip("\n")
            return filepath, cleaned

    return None, content


def parse_code_blocks(response: str) -> ParsedResponse:
    """Parse code blocks from an LLM response.

    Extracts all markdown code blocks, detects languages, and extracts
    file paths from comments.

    Args:
        response: Raw LLM response text

    Returns:
        ParsedResponse with extracted code blocks and explanations

    Example:
        >>> response = '''Here's the code:
        ... ```python
        ... # src/main.py
        ... def main():
        ...     print("Hello")
        ... ```
        ... '''
        >>> parsed = parse_code_blocks(response)
        >>> parsed.code_blocks[0].filepath
        'src/main.py'
    """
    result = ParsedResponse(raw_response=response)

    # Find all code blocks
    last_end = 0
    for match in CODE_BLOCK_PATTERN.finditer(response):
        # Capture explanation text before this code block
        explanation = response[last_end : match.start()].strip()
        if explanation:
            result.explanations.append(explanation)

        language_str = match.group(1) or ""
        content = match.group(2).strip()

        # Extract filepath from content
        filepath, cleaned_content = extract_filepath(content)

        # Create code block
        block = CodeBlock(
            content=cleaned_content,
            language=Language.from_string(language_str),
            filepath=filepath,
            start_line=response[: match.start()].count("\n") + 1,
            raw_block=match.group(0),
        )

        # Extract metadata for Python files
        if block.is_python:
            block.metadata = extract_python_metadata(cleaned_content)

        result.code_blocks.append(block)
        last_end = match.end()

    # Capture any remaining explanation
    remaining = response[last_end:].strip()
    if remaining:
        result.explanations.append(remaining)

    logger.debug(
        "Parsed code blocks",
        block_count=len(result.code_blocks),
        languages=[b.language.value for b in result.code_blocks],
        has_filepaths=any(b.filepath for b in result.code_blocks),
    )

    return result


def extract_python_metadata(content: str) -> dict[str, Any]:
    """Extract metadata from Python code.

    Args:
        content: Python code content

    Returns:
        Dict with extracted metadata (functions, classes, imports)
    """
    metadata: dict[str, Any] = {
        "functions": [],
        "classes": [],
        "imports": [],
        "has_main": False,
    }

    # Extract function names
    func_pattern = re.compile(r"^(?:async\s+)?def\s+(\w+)\s*\(", re.MULTILINE)
    metadata["functions"] = func_pattern.findall(content)

    # Extract class names
    class_pattern = re.compile(r"^class\s+(\w+)\s*[:\(]", re.MULTILINE)
    metadata["classes"] = class_pattern.findall(content)

    # Extract imports
    import_pattern = re.compile(r"^(?:from\s+[\w.]+\s+)?import\s+.+$", re.MULTILINE)
    metadata["imports"] = import_pattern.findall(content)

    # Check for main block
    metadata["has_main"] = 'if __name__ == "__main__"' in content

    return metadata


def combine_code_blocks(blocks: list[CodeBlock], separator: str = "\n\n") -> str:
    """Combine multiple code blocks into a single string.

    Args:
        blocks: List of code blocks to combine
        separator: String to use between blocks

    Returns:
        Combined code as a single string
    """
    return separator.join(block.content for block in blocks)


def format_as_markdown(blocks: list[CodeBlock]) -> str:
    """Format code blocks back to markdown.

    Args:
        blocks: List of code blocks

    Returns:
        Markdown string with fenced code blocks
    """
    parts = []
    for block in blocks:
        fence = f"```{block.language.value}"
        if block.filepath:
            content = f"# {block.filepath}\n{block.content}"
        else:
            content = block.content
        parts.append(f"{fence}\n{content}\n```")

    return "\n\n".join(parts)
