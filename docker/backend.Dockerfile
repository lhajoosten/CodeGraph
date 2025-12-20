# Multi-stage build for Python backend

FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD poetry run alembic upgrade head && \
    poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000

# Production stage
FROM base as production

# Remove development dependencies
RUN poetry install --no-interaction --no-ansi --no-root --only main

# Run with production settings
CMD poetry run alembic upgrade head && \
    poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
