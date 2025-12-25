.PHONY: help install dev build test clean check lint format type-check api-generate
.PHONY: docker-up docker-down docker-logs docker-build docker-full
.PHONY: db-setup db-init db-migrate db-test db-fix-auth db-reset
.PHONY: setup status

# Variables
BACKEND_DIR=apps/backend
FRONTEND_DIR=apps/frontend
DOCKER_DIR=docker

# Colors for output
COLOR_RESET=\033[0m
COLOR_BOLD=\033[1m
COLOR_GREEN=\033[32m
COLOR_BLUE=\033[34m

# Default target
help:
	@echo "$(COLOR_BOLD)CodeGraph Development Makefile$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BLUE)Quick tip: You can also run commands directly in backend/frontend:$(COLOR_RESET)"
	@echo "  cd apps/backend && make help"
	@echo "  cd apps/frontend && make help"
	@echo ""
	@echo "$(COLOR_BOLD)Setup & Installation:$(COLOR_RESET)"
	@echo "  make install           - Install all dependencies (backend + frontend)"
	@echo "  make setup             - Full setup (install + db setup)"
	@echo ""
	@echo "$(COLOR_BOLD)Development:$(COLOR_RESET)"
	@echo "  make dev               - Start all services (docker + backend + frontend)"
	@echo ""
	@echo "$(COLOR_BOLD)Docker:$(COLOR_RESET)"
	@echo "  make docker-up         - Start Docker containers (postgres, redis)"
	@echo "  make docker-down       - Stop Docker containers"
	@echo "  make docker-logs       - View Docker container logs"
	@echo "  make docker-build      - Build Docker containers"
	@echo "  make docker-full       - Rebuild and restart full Docker stack"
	@echo ""
	@echo "$(COLOR_BOLD)Database:$(COLOR_RESET)"
	@echo "  make db-setup          - Full database setup (docker + auth fix + migrations)"
	@echo "  make db-init           - Initialize database container & fix authentication"
	@echo "  make db-migrate        - Run database migrations"
	@echo "  make db-test           - Test database connection"
	@echo "  make db-reset          - Reset database (careful!)"
	@echo ""
	@echo "$(COLOR_BOLD)API:$(COLOR_RESET)"
	@echo "  make api-generate      - Generate API client from OpenAPI spec"
	@echo ""
	@echo "$(COLOR_BOLD)Code Quality:$(COLOR_RESET)"
	@echo "  make check             - Full check pipeline (backend + frontend)"
	@echo "  make lint              - Run linters (backend + frontend)"
	@echo "  make format            - Format code (backend + frontend)"
	@echo "  make type-check        - Type check (backend + frontend)"
	@echo ""
	@echo "$(COLOR_BOLD)Testing:$(COLOR_RESET)"
	@echo "  make test              - Run all tests (backend + frontend)"
	@echo ""
	@echo "$(COLOR_BOLD)Build & Cleanup:$(COLOR_RESET)"
	@echo "  make build             - Build all (backend + frontend)"
	@echo "  make clean             - Clean all generated files and caches"
	@echo ""
	@echo "$(COLOR_BOLD)Status:$(COLOR_RESET)"
	@echo "  make status            - Show status of all services"
	@echo ""

# Setup & Installation
install:
	@echo "$(COLOR_GREEN)Installing all dependencies...$(COLOR_RESET)"
	@$(MAKE) -C $(BACKEND_DIR) install
	@$(MAKE) -C $(FRONTEND_DIR) install
	@echo "$(COLOR_GREEN)✓ All dependencies installed$(COLOR_RESET)"

# Development
dev:
	@echo "$(COLOR_GREEN)Starting all services (docker + backend + frontend)...$(COLOR_RESET)"
	@echo "$(COLOR_BLUE)Note: Run backend and frontend in separate terminals for better log visibility:$(COLOR_RESET)"
	@echo "  Terminal 1: make docker-up && cd apps/backend && make dev"
	@echo "  Terminal 2: cd apps/frontend && make dev"
	@echo ""
	@$(MAKE) docker-up
	@echo "$(COLOR_GREEN)✓ Docker services started. Now start backend and frontend manually.$(COLOR_RESET)"

# Docker
docker-up:
	@$(MAKE) -C $(BACKEND_DIR) docker-up

docker-down:
	@$(MAKE) -C $(BACKEND_DIR) docker-down

docker-logs:
	@$(MAKE) -C $(BACKEND_DIR) docker-logs

docker-build:
	@$(MAKE) -C $(BACKEND_DIR) docker-build

docker-full:
	@$(MAKE) -C $(BACKEND_DIR) docker-full

# Database
db-migrate:
	@$(MAKE) -C $(BACKEND_DIR) db-migrate

db-reset:
	@$(MAKE) -C $(BACKEND_DIR) db-reset

db-fix-auth:
	@$(MAKE) -C $(BACKEND_DIR) db-fix-auth

db-test:
	@$(MAKE) -C $(BACKEND_DIR) db-test

db-init:
	@$(MAKE) -C $(BACKEND_DIR) db-init

db-setup:
	@$(MAKE) -C $(BACKEND_DIR) db-setup

# API
api-generate:
	@$(MAKE) -C $(FRONTEND_DIR) api-generate

# Code Quality
lint:
	@echo "$(COLOR_GREEN)Running linters (backend + frontend)...$(COLOR_RESET)"
	@$(MAKE) -C $(BACKEND_DIR) lint
	@$(MAKE) -C $(FRONTEND_DIR) lint
	@echo "$(COLOR_GREEN)✓ All linting passed$(COLOR_RESET)"

format:
	@echo "$(COLOR_GREEN)Formatting code (backend + frontend)...$(COLOR_RESET)"
	@$(MAKE) -C $(BACKEND_DIR) format
	@$(MAKE) -C $(FRONTEND_DIR) format
	@echo "$(COLOR_GREEN)✓ All code formatted$(COLOR_RESET)"

type-check:
	@echo "$(COLOR_GREEN)Type checking (backend + frontend)...$(COLOR_RESET)"
	@$(MAKE) -C $(BACKEND_DIR) type-check
	@$(MAKE) -C $(FRONTEND_DIR) type-check
	@echo "$(COLOR_GREEN)✓ All type checks passed$(COLOR_RESET)"

check:
	@echo "$(COLOR_GREEN)Running full check pipeline (backend + frontend)...$(COLOR_RESET)"
	@$(MAKE) -C $(BACKEND_DIR) check
	@$(MAKE) -C $(FRONTEND_DIR) check
	@echo "$(COLOR_GREEN)✓ All checks passed (backend + frontend)$(COLOR_RESET)"

# Testing
test:
	@echo "$(COLOR_GREEN)Running all tests (backend + frontend)...$(COLOR_RESET)"
	@$(MAKE) -C $(BACKEND_DIR) test
	@$(MAKE) -C $(FRONTEND_DIR) test
	@echo "$(COLOR_GREEN)✓ All tests passed$(COLOR_RESET)"

# Build
build:
	@echo "$(COLOR_GREEN)Building all (backend + frontend)...$(COLOR_RESET)"
	@$(MAKE) -C $(BACKEND_DIR) build
	@$(MAKE) -C $(FRONTEND_DIR) build
	@echo "$(COLOR_GREEN)✓ Build complete$(COLOR_RESET)"

# Cleanup
clean:
	@echo "$(COLOR_GREEN)Cleaning all artifacts (backend + frontend)...$(COLOR_RESET)"
	@$(MAKE) -C $(BACKEND_DIR) clean
	@$(MAKE) -C $(FRONTEND_DIR) clean
	@echo "$(COLOR_GREEN)✓ All artifacts cleaned$(COLOR_RESET)"

# Setup & Status
setup:
	@echo "$(COLOR_GREEN)Setting up development environment...$(COLOR_RESET)"
	@$(MAKE) install
	@$(MAKE) db-setup
	@echo ""
	@echo "$(COLOR_GREEN)✓ Development environment setup complete$(COLOR_RESET)"
	@echo ""
	@echo "Next steps:"
	@echo "  make dev           - Start all development servers"
	@echo "  make api-generate  - Generate API client"
	@echo ""

status:
	@echo "$(COLOR_BOLD)=== CodeGraph Status ===$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BOLD)Backend:$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && poetry --version 2>/dev/null || echo "  Poetry not installed"
	@echo ""
	@echo "$(COLOR_BOLD)Frontend:$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && npm --version 2>/dev/null || echo "  npm not installed"
	@echo ""
	@echo "$(COLOR_BOLD)Docker:$(COLOR_RESET)"
	@cd $(DOCKER_DIR) && docker-compose ps 2>/dev/null || echo "  Docker not running"
	@echo ""
