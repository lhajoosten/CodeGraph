"""Alembic environment configuration for async SQLAlchemy."""

import asyncio
from logging.config import fileConfig
from typing import Any

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy.types import TypeEngine

from alembic import context

# Import settings and models
from src.core.config import settings
from src.core.encryption import EncryptedString
from src.models import Base


def compare_type(
    context: Any,
    inspected_column: Any,
    metadata_column: Any,
    inspected_type: TypeEngine[Any],
    metadata_type: TypeEngine[Any],
) -> bool | None:
    """Custom type comparison to handle EncryptedString.

    EncryptedString uses String/TEXT as its underlying storage type,
    so we should ignore type differences when the model uses EncryptedString
    and the database has TEXT/VARCHAR.

    Returns:
        False if types should be considered equal (no migration needed)
        True if types are different (migration needed)
        None to use default comparison
    """
    # If the model uses EncryptedString, ignore the type comparison
    # since it stores as TEXT/VARCHAR in the database
    if isinstance(metadata_type, EncryptedString):
        return False

    # Use default comparison for other types
    return None


# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set SQLAlchemy URL from settings
config.set_main_option("sqlalchemy.url", str(settings.database_url))

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=compare_type,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with the given connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=compare_type,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
