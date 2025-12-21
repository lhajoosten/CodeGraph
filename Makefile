.PHONY: help install dev build test clean docker-up docker-down docker-logs db-migrate db-reset db-init db-setup db-test db-fix-auth lint format type-check api-generate all

# Variables
DOCKER_COMPOSE=docker-compose -f docker/docker-compose.yml
BACKEND_DIR=apps/backend
FRONTEND_DIR=apps/frontend
DOCKER_DIR=docker

# Default target
help:
	@echo "CodeGraph Development Makefile"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install           - Install all dependencies (backend + frontend)"
	@echo "  make install-backend   - Install backend dependencies only"
	@echo "  make install-frontend  - Install frontend dependencies only"
	@echo ""
	@echo "Development:"
	@echo "  make dev               - Start all services (backend + frontend + docker)"
	@echo "  make dev-backend       - Start backend dev server only"
	@echo "  make dev-frontend      - Start frontend dev server only"
	@echo ""
	@echo "API & Database:"
	@echo "  make api-generate      - Generate API client from OpenAPI spec"
	@echo "  make db-setup          - Full database setup (docker + auth fix + migrations)"
	@echo "  make db-init           - Initialize database container & fix authentication"
	@echo "  make db-test           - Test database connection"
	@echo "  make db-migrate        - Run database migrations"
	@echo "  make db-fix-auth       - Fix PostgreSQL authentication (pg_hba.conf)"
	@echo "  make db-reset          - Reset database (careful!)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up         - Start Docker containers (postgres, redis)"
	@echo "  make docker-down       - Stop Docker containers"
	@echo "  make docker-logs       - View Docker container logs"
	@echo "  make docker-compose    - Start full stack with docker-compose"
	@echo ""
	@echo "Code Quality:"
	@echo "  make check             - Full check pipeline (lint + format + type-check)"
	@echo "  make check-backend     - Backend check pipeline"
	@echo "  make check-frontend    - Frontend check pipeline"
	@echo ""
	@echo "  make lint              - Run linters (backend + frontend)"
	@echo "  make lint-backend      - Run backend linter (ruff)"
	@echo "  make lint-frontend     - Run frontend linter (eslint)"
	@echo "  make lint-fix          - Run frontend linter fix"
	@echo ""
	@echo "  make format            - Format code (backend + frontend)"
	@echo "  make format-backend    - Format backend code (ruff)"
	@echo "  make format-frontend   - Format frontend code (prettier)"
	@echo ""
	@echo "  make type-check        - Type check (backend + frontend)"
	@echo "  make type-check-backend - Type check backend (mypy)"
	@echo "  make type-check-frontend - Type check frontend"
	@echo ""
	@echo "Testing:"
	@echo "  make test              - Run tests (backend + frontend)"
	@echo "  make test-backend      - Run backend tests"
	@echo "  make test-frontend     - Run frontend tests"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean             - Clean all generated files and caches"
	@echo "  make clean-backend     - Clean backend artifacts"
	@echo "  make clean-frontend    - Clean frontend artifacts"
	@echo ""

# Setup & Installation
install: install-backend install-frontend
	@echo "✓ All dependencies installed"

install-backend:
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && poetry install

install-frontend:
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install

# Development
dev: docker-up dev-backend dev-frontend
	@echo "✓ All services started (backend, frontend, docker)"

dev-backend:
	@echo "Starting backend dev server..."
	cd $(BACKEND_DIR) && poetry run uvicorn src.main:app --reload

dev-frontend:
	@echo "Starting frontend dev server..."
	cd $(FRONTEND_DIR) && npm run dev

docker-compose:
	@echo "Starting full stack with docker-compose..."
	cd $(DOCKER_DIR) && docker-compose up

# Docker
docker-up:
	@echo "Starting Docker containers (postgres, redis)..."
	cd $(DOCKER_DIR) && docker-compose up -d postgres redis
	@echo "Waiting for services to be healthy..."
	@sleep 5
	@cd $(DOCKER_DIR) && docker-compose ps

docker-down:
	@echo "Stopping Docker containers..."
	cd $(DOCKER_DIR) && docker-compose down

docker-logs:
	@echo "Tailing Docker logs..."
	cd $(DOCKER_DIR) && docker-compose logs -f

docker-build:
	@echo "Building Docker containers..."
	cd $(DOCKER_DIR) && docker-compose build
	@echo "✓ Docker containers built"

# restart docker, build containers first, then bring up full stack, run db-fix-auth and db-migrate
docker-full:
	@echo "Rebuilding and restarting full Docker stack..."
	make docker-build
	cd $(DOCKER_DIR) && docker-compose up -d
	@sleep 5
	make db-fix-auth
	make db-migrate
	@echo "✓ Full Docker stack restarted"

# Database
db-migrate:
	@echo "Running database migrations..."
	cd $(BACKEND_DIR) && poetry run alembic upgrade head
	@echo "✓ Migrations complete"

db-reset:
	@echo "⚠️  WARNING: This will reset your database!"
	@echo "Are you sure? [y/N]"
	@read -r response; \
	if [ "$$response" = "y" ]; then \
		cd $(DOCKER_DIR) && docker-compose down -v; \
		make docker-up; \
		make db-migrate; \
		echo "✓ Database reset complete"; \
	else \
		echo "Database reset cancelled"; \
	fi

# Database Setup & Authentication
db-fix-auth:
	@echo "Fixing PostgreSQL authentication (pg_hba.conf)..."
	@if docker ps | grep -q codegraph-postgres; then \
		docker exec codegraph-postgres bash -c 'echo "host    all             all             172.18.0.0/16           md5" >> /var/lib/postgresql/data/pg_hba.conf' && \
		docker exec codegraph-postgres bash -c 'echo "host    all             all             0.0.0.0/0               md5" >> /var/lib/postgresql/data/pg_hba.conf' && \
		docker restart codegraph-postgres && \
		sleep 2 && \
		echo "✓ PostgreSQL authentication fixed"; \
	else \
		echo "✗ PostgreSQL container is not running"; \
		exit 1; \
	fi

db-test:
	@echo "Testing database connection..."
	@poetry -C $(BACKEND_DIR) run python $(PWD)/scripts/test_db_connection.py

db-init: docker-up db-fix-auth db-test db-migrate
	@echo "✓ Database initialized and ready"

db-setup: docker-up db-fix-auth db-migrate db-test
	@echo "✓ Database setup complete"
	@echo ""
	@echo "Next steps:"
	@echo "  make dev-backend    - Start backend dev server"
	@echo "  make dev-frontend   - Start frontend dev server"

# API
api-generate:
	@echo "Generating API client from OpenAPI spec..."
	cd $(FRONTEND_DIR) && npm run api:generate
	@echo "✓ API client generated"

# Code Quality
lint: lint-backend lint-frontend
	@echo "✓ All linting passed"

lint-backend:
	@echo "Linting backend code..."
	cd $(BACKEND_DIR) && poetry run ruff check . --fix

lint-frontend:
	@echo "Linting frontend code..."
	cd $(FRONTEND_DIR) && npm run lint

lint-fix:
	@echo "Fixing frontend lint issues..."
	cd $(FRONTEND_DIR) && npm run lint:fix
	@echo "✓ Frontend lint issues fixed"

format: format-backend format-frontend
	@echo "✓ All code formatted"

format-backend:
	@echo "Formatting backend code..."
	cd $(BACKEND_DIR) && poetry run ruff format .

format-frontend:
	@echo "Formatting frontend code..."
	cd $(FRONTEND_DIR) && npm run format

type-check: type-check-backend type-check-frontend
	@echo "✓ All type checks passed"

type-check-backend:
	@echo "Type checking backend..."
	cd $(BACKEND_DIR) && poetry run mypy src/

type-check-frontend:
	@echo "Type checking frontend..."
	cd $(FRONTEND_DIR) && npm run type-check

# Testing
test: test-backend test-frontend
	@echo "✓ All tests passed"

test-backend:
	@echo "Running backend tests..."
	cd $(BACKEND_DIR) && poetry run pytest tests/

test-frontend:
	@echo "Running frontend tests..."
	cd $(FRONTEND_DIR) && npm run test

# Build
build: build-backend build-frontend
	@echo "✓ Build complete"

build-backend:
	@echo "Building backend..."
	cd $(BACKEND_DIR) && poetry build

build-frontend:
	@echo "Building frontend..."
	cd $(FRONTEND_DIR) && npm run build

# Cleanup
clean: clean-backend clean-frontend
	@echo "✓ All artifacts cleaned"

clean-backend:
	@echo "Cleaning backend artifacts..."
	cd $(BACKEND_DIR) && \
		find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true; \
		find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true; \
		find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true; \
		find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true; \
		find . -name "*.pyc" -delete 2>/dev/null || true

clean-frontend:
	@echo "Cleaning frontend artifacts..."
	cd $(FRONTEND_DIR) && \
		rm -rf node_modules .next .dist build coverage .vite dist 2>/dev/null || true

# Code Quality Pipeline
check-backend: lint-backend format-backend type-check-backend
	@echo "✓ Backend checks passed (lint + format + type-check)"

check-frontend: lint-frontend format-frontend type-check-frontend
	@echo "✓ Frontend checks passed (lint + format + type-check)"

check: check-backend check-frontend
	@echo "✓ All checks passed (backend + frontend)"

setup: install db-migrate
	@echo "✓ Development environment setup complete"
	@echo "Next steps:"
	@echo "  make dev           - Start all development servers"
	@echo "  make api-generate  - Generate API client"
	@echo ""

status:
	@echo "=== Backend Status ==="
	@cd $(BACKEND_DIR) && poetry --version
	@echo ""
	@echo "=== Frontend Status ==="
	@cd $(FRONTEND_DIR) && npm --version
	@echo ""
	@echo "=== Docker Status ==="
	@cd $(DOCKER_DIR) && docker-compose ps
