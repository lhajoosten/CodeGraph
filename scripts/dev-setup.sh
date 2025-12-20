#!/bin/bash

# CodeGraph Development Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 CodeGraph Development Setup"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "📦 Installing Poetry..."
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

echo "✅ Poetry is installed"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm is installed"

# Set up backend
echo ""
echo "🔧 Setting up backend..."
cd apps/backend

if [ ! -f .env ]; then
    echo "📝 Creating backend .env file..."
    cp .env.example .env
    echo "⚠️  Please edit apps/backend/.env and add your API keys"
fi

echo "📦 Installing backend dependencies..."
poetry install

cd ../..

# Set up frontend
echo ""
echo "🔧 Setting up frontend..."
cd apps/frontend

if [ ! -f .env ]; then
    echo "📝 Creating frontend .env file..."
    cp .env.example .env
fi

echo "📦 Installing frontend dependencies..."
pnpm install

cd ../..

# Start infrastructure services
echo ""
echo "🐳 Starting infrastructure services..."
cd docker
docker-compose up -d postgres redis

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
cd ../apps/backend
poetry run alembic upgrade head

cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  Option 1 (Full stack with Docker):"
echo "    cd docker && docker-compose up"
echo ""
echo "  Option 2 (Individual services):"
echo "    Terminal 1: cd apps/backend && poetry run uvicorn src.main:app --reload"
echo "    Terminal 2: cd apps/frontend && pnpm dev"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "⚠️  Don't forget to add your API keys to apps/backend/.env"
