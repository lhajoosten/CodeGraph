.PHONY: help install dev test clean lint format type-check check build
.PHONY: db-migrate db-reset db-test db-fix-auth db-init db-setup
.PHONY: docker-up docker-down docker-logs docker-build docker-full

# Variables
DOCKER_DIR=../../docker
SCRIPTS_DIR=../../scripts

# Colors for output
COLOR_RESET=\033[0m
COLOR_BOLD=\033[1m
COLOR_GREEN=\033[32m
COLOR_YELLOW=\033[33m

# Default target
help:
	@echo "$(COLOR_BOLD)CodeGraph Backend Makefile$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BOLD)Setup & Installation:$(COLOR_RESET)"
	@echo "  make install           - Install backend dependencies"
	@echo ""
	@echo "$(COLOR_BOLD)Development:$(COLOR_RESET)"
	@echo "  make dev               - Start backend dev server"
	@echo ""
	@echo "$(COLOR_BOLD)Database:$(COLOR_RESET)"
	@echo "  make db-setup          - Full database setup (docker + auth fix + migrations)"
	@echo "  make db-init           - Initialize database container & fix authentication"
	@echo "  make db-migrate        - Run database migrations"
	@echo "  make db-test           - Test database connection"
	@echo "  make db-fix-auth       - Fix PostgreSQL authentication (pg_hba.conf)"
	@echo "  make db-reset          - Reset database (careful!)"
	@echo ""
	@echo "$(COLOR_BOLD)Docker:$(COLOR_RESET)"
	@echo "  make docker-up         - Start Docker containers (postgres, redis)"
	@echo "  make docker-down       - Stop Docker containers"
	@echo "  make docker-logs       - View Docker container logs"
	@echo "  make docker-build      - Build Docker containers"
	@echo "  make docker-full       - Rebuild and restart full Docker stack"
	@echo ""
	@echo "$(COLOR_BOLD)Code Quality:$(COLOR_RESET)"
	@echo "  make check             - Full check pipeline (lint + format + type-check)"
	@echo "  make lint              - Run linter (ruff)"
	@echo "  make format            - Format code (ruff)"
	@echo "  make type-check        - Type check (mypy)"
	@echo ""
	@echo "$(COLOR_BOLD)Testing:$(COLOR_RESET)"
	@echo "  make test              - Run all tests"
	@echo "  make test-cov          - Run tests with coverage report"
	@echo ""
	@echo "$(COLOR_BOLD)Build & Cleanup:$(COLOR_RESET)"
	@echo "  make build             - Build backend package"
	@echo "  make clean             - Clean generated files and caches"
	@echo ""

# Setup & Installation
install:
	@echo "$(COLOR_GREEN)Installing backend dependencies...$(COLOR_RESET)"
	@poetry install
	@echo "$(COLOR_GREEN)✓ Backend dependencies installed$(COLOR_RESET)"

# Development
dev:
	@echo "$(COLOR_GREEN)Starting backend dev server...$(COLOR_RESET)"
	@poetry run uvicorn src.main:app --reload

# Database
db-migrate:
	@echo "$(COLOR_GREEN)Running database migrations...$(COLOR_RESET)"
	@poetry run alembic upgrade head
	@echo "$(COLOR_GREEN)✓ Migrations complete$(COLOR_RESET)"

db-reset:
	@echo "$(COLOR_YELLOW)⚠️  WARNING: This will reset your database!$(COLOR_RESET)"
	@echo "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@cd $(DOCKER_DIR) && docker-compose down -v
	@$(MAKE) docker-up
	@$(MAKE) db-migrate
	@echo "$(COLOR_GREEN)✓ Database reset complete$(COLOR_RESET)"

db-fix-auth:
	@echo "$(COLOR_GREEN)Fixing PostgreSQL authentication (pg_hba.conf)...$(COLOR_RESET)"
	@if docker ps | grep -q codegraph-postgres; then \
		docker exec codegraph-postgres bash -c 'echo "host    all             all             172.18.0.0/16           md5" >> /var/lib/postgresql/data/pg_hba.conf' && \
		docker exec codegraph-postgres bash -c 'echo "host    all             all             0.0.0.0/0               md5" >> /var/lib/postgresql/data/pg_hba.conf' && \
		docker restart codegraph-postgres && \
		sleep 2 && \
		echo "$(COLOR_GREEN)✓ PostgreSQL authentication fixed$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_YELLOW)✗ PostgreSQL container is not running$(COLOR_RESET)"; \
		exit 1; \
	fi

db-test:
	@echo "$(COLOR_GREEN)Testing database connection...$(COLOR_RESET)"
	@poetry run python $(SCRIPTS_DIR)/test_db_connection.py

db-init: docker-up db-fix-auth db-test db-migrate
	@echo "$(COLOR_GREEN)✓ Database initialized and ready$(COLOR_RESET)"

db-setup: docker-up db-fix-auth db-migrate db-test
	@echo "$(COLOR_GREEN)✓ Database setup complete$(COLOR_RESET)"
	@echo ""
	@echo "Next steps:"
	@echo "  make dev    - Start backend dev server"

# Docker
docker-up:
	@echo "$(COLOR_GREEN)Starting Docker containers (postgres, redis)...$(COLOR_RESET)"
	@cd $(DOCKER_DIR) && docker-compose up -d postgres redis
	@echo "Waiting for services to be healthy..."
	@sleep 5
	@cd $(DOCKER_DIR) && docker-compose ps

docker-down:
	@echo "$(COLOR_GREEN)Stopping Docker containers...$(COLOR_RESET)"
	@cd $(DOCKER_DIR) && docker-compose down

docker-logs:
	@echo "$(COLOR_GREEN)Tailing Docker logs...$(COLOR_RESET)"
	@cd $(DOCKER_DIR) && docker-compose logs -f

docker-build:
	@echo "$(COLOR_GREEN)Building Docker containers...$(COLOR_RESET)"
	@cd $(DOCKER_DIR) && docker-compose build
	@echo "$(COLOR_GREEN)✓ Docker containers built$(COLOR_RESET)"

docker-full:
	@echo "$(COLOR_GREEN)Rebuilding and restarting full Docker stack...$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)Cleaning up old volumes (including node_modules cache)...$(COLOR_RESET)"
	@cd $(DOCKER_DIR) && docker-compose down -v 2>/dev/null || true
	@echo "$(COLOR_GREEN)Building Docker containers...$(COLOR_RESET)"
	@$(MAKE) docker-build
	@cd $(DOCKER_DIR) && docker-compose up -d
	@sleep 5
	@$(MAKE) db-fix-auth
	@$(MAKE) db-migrate
	@echo "$(COLOR_GREEN)✓ Full Docker stack restarted$(COLOR_RESET)"

# Code Quality
lint:
	@echo "$(COLOR_GREEN)Linting backend code...$(COLOR_RESET)"
	@poetry run ruff check . --fix

format:
	@echo "$(COLOR_GREEN)Formatting backend code...$(COLOR_RESET)"
	@poetry run ruff format .

type-check:
	@echo "$(COLOR_GREEN)Type checking backend...$(COLOR_RESET)"
	@poetry run mypy src/

check: lint format type-check
	@echo "$(COLOR_GREEN)✓ Backend checks passed (lint + format + type-check)$(COLOR_RESET)"

# Testing
test:
	@echo "$(COLOR_GREEN)Running backend tests...$(COLOR_RESET)"
	@poetry run pytest tests/

test-cov:
	@echo "$(COLOR_GREEN)Running backend tests with coverage...$(COLOR_RESET)"
	@poetry run pytest --cov=src --cov-report=html --cov-report=term tests/
	@echo "$(COLOR_GREEN)✓ Coverage report generated in htmlcov/$(COLOR_RESET)"

# Build
build:
	@echo "$(COLOR_GREEN)Building backend package...$(COLOR_RESET)"
	@poetry build
	@echo "$(COLOR_GREEN)✓ Backend build complete$(COLOR_RESET)"

# Cleanup
clean:
	@echo "$(COLOR_GREEN)Cleaning backend artifacts...$(COLOR_RESET)"
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	@find . -name "*.pyc" -delete 2>/dev/null || true
	@rm -rf dist build *.egg-info htmlcov .coverage 2>/dev/null || true
	@echo "$(COLOR_GREEN)✓ Backend artifacts cleaned$(COLOR_RESET)"
