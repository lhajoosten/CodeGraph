"""Code parsing and formatting utilities.

Handles extraction and formatting of code from LLM responses:
- parser: Extract code blocks from markdown/text
- formatter: Format and validate code structure
"""

from src.agents.processing.formatter import (
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
from src.agents.processing.parser import (
    CodeBlock,
    Language,
    ParsedResponse,
    combine_code_blocks,
    extract_filepath,
    extract_python_metadata,
    format_as_markdown,
    parse_code_blocks,
)

__all__ = [
    # Formatter
    "CodeFile",
    "FormatResult",
    "LintCategory",
    "LintIssue",
    "LintSeverity",
    "MultiFileResult",
    "SyntaxError_",
    "create_multi_file_result",
    "format_python_code",
    "infer_filepath",
    "validate_python_syntax",
    # Parser
    "CodeBlock",
    "Language",
    "ParsedResponse",
    "combine_code_blocks",
    "extract_filepath",
    "extract_python_metadata",
    "format_as_markdown",
    "parse_code_blocks",
]
