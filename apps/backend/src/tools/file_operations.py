"""File operations tools - re-exported from filesystem module.

This module is kept for backward compatibility. Use the filesystem
module directly for new code.

Example:
    from src.tools.filesystem import read_file, write_file
"""

from src.tools.filesystem import (
    delete_file,
    edit_file,
    file_exists,
    read_file,
    write_file,
)

__all__ = [
    "read_file",
    "write_file",
    "edit_file",
    "delete_file",
    "file_exists",
]
