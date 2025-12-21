#!/bin/bash

# CodeGraph Test Runner Script
# Runs all tests for backend and frontend

set -e

echo "🧪 Running CodeGraph Tests"
echo "=========================="

# Backend tests
echo ""
echo "🐍 Running backend tests..."
cd apps/backend

# Linting
echo "  → Checking code formatting..."
poetry run black --check src/ || {
    echo "❌ Code formatting check failed. Run 'poetry run black src/' to fix."
    exit 1
}

echo "  → Running linter..."
poetry run ruff check src/ || {
    echo "❌ Linting failed. Fix the issues and try again."
    exit 1
}

echo "  → Running type checker..."
poetry run mypy src/ || {
    echo "❌ Type checking failed. Fix the type errors and try again."
    exit 1
}

echo "  → Running tests..."
poetry run pytest --cov=src --cov-report=term-missing || {
    echo "❌ Backend tests failed."
    exit 1
}

cd ../..

# Frontend tests
echo ""
echo "⚛️  Running frontend tests..."
cd apps/frontend

echo "  → Running linter..."
pnpm lint || {
    echo "❌ Frontend linting failed."
    exit 1
}

echo "  → Running type checker..."
pnpm tsc --noEmit || {
    echo "❌ Frontend type checking failed."
    exit 1
}

echo "  → Running tests..."
pnpm test || {
    echo "❌ Frontend tests failed."
    exit 1
}

echo "  → Building..."
pnpm build || {
    echo "❌ Frontend build failed."
    exit 1
}

cd ../..

echo ""
echo "✅ All tests passed!"
echo ""
echo "📊 Coverage reports:"
echo "  Backend:  apps/backend/htmlcov/index.html"
echo "  Frontend: apps/frontend/coverage/index.html"
