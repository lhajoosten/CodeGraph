#!/usr/bin/env python
"""Test database connection script."""

import asyncio
import asyncpg
import sys


async def test_connection():
    """Test asyncpg connection to PostgreSQL."""
    try:
        print("Testing database connection...")
        conn = await asyncpg.connect(
            user='codegraph',
            password='codegraph',
            database='codegraph',
            host='localhost',
            port=5432,
        )
        version = await conn.fetchval('SELECT version()')
        print(f"✓ Database connection successful!")
        print(f"  PostgreSQL version: {version[:50]}...")
        await conn.close()
        return 0
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(asyncio.run(test_connection()))
