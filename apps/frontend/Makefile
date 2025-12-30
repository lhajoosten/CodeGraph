.PHONY: help install dev test test-e2e clean lint lint-fix format format-check type-check check build api-generate test-watch test-cov checkout push

# Colors for output
COLOR_RESET=\033[0m
COLOR_BOLD=\033[1m
COLOR_GREEN=\033[32m

COPILOT_MESSAGE=""

# Default target
help:
	@echo "$(COLOR_BOLD)CodeGraph Frontend Makefile$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BOLD)Setup & Installation:$(COLOR_RESET)"
	@echo "  make install           - Install frontend dependencies"
	@echo ""
	@echo "$(COLOR_BOLD)Development:$(COLOR_RESET)"
	@echo "  make dev               - Start frontend dev server (port 5173)"
	@echo ""
	@echo "$(COLOR_BOLD)API:$(COLOR_RESET)"
	@echo "  make api-generate      - Generate API client from OpenAPI spec"
	@echo ""
	@echo "$(COLOR_BOLD)Code Quality:$(COLOR_RESET)"
	@echo "  make check             - Full check pipeline (lint + format + type-check)"
	@echo "  make lint              - Run linter (eslint)"
	@echo "  make lint-fix          - Fix linting issues automatically"
	@echo "  make format            - Format code (prettier)"
	@echo "  make format-check      - Check code formatting"
	@echo "  make type-check        - Type check (TypeScript)"
	@echo ""
	@echo "$(COLOR_BOLD)Testing:$(COLOR_RESET)"
	@echo "  make test              - Run all tests"
	@echo "  make test-e2e          - Run end-to-end tests"
	@echo "  make test-watch        - Run tests in watch mode"
	@echo "  make test-cov          - Run tests with coverage report"
	@echo ""
	@echo "$(COLOR_BOLD)Build & Cleanup:$(COLOR_RESET)"
	@echo "  make build             - Build for production"
	@echo "  make clean             - Clean generated files and caches"
	@echo ""
	@echo "$(COLOR_BOLD)Git:$(COLOR_RESET)"
	@echo "  make checkout          - Checkout main branch, fetch & pull latest changes"
	@echo "  make push              - Add, commit, and push changes to the current branch"
	@echo ""

# Setup & Installation
install:
	@echo "$(COLOR_GREEN)Installing frontend dependencies...$(COLOR_RESET)"
	@npm install
	@echo "$(COLOR_GREEN)✓ Frontend dependencies installed$(COLOR_RESET)"

# Development
dev:
	@echo "$(COLOR_GREEN)Starting frontend dev server...$(COLOR_RESET)"
	@npm run dev

# API
api-generate:
	@echo "$(COLOR_GREEN)Generating API client from OpenAPI spec...$(COLOR_RESET)"
	@npm run api:generate
	@echo "$(COLOR_GREEN)✓ API client generated$(COLOR_RESET)"

# Code Quality
lint:
	@echo "$(COLOR_GREEN)Linting frontend code...$(COLOR_RESET)"
	@npm run lint

lint-fix:
	@echo "$(COLOR_GREEN)Fixing frontend lint issues...$(COLOR_RESET)"
	@npm run lint:fix
	@echo "$(COLOR_GREEN)✓ Frontend lint issues fixed$(COLOR_RESET)"

format:
	@echo "$(COLOR_GREEN)Formatting frontend code...$(COLOR_RESET)"
	@npm run format

format-check:
	@echo "$(COLOR_GREEN)Checking frontend code formatting...$(COLOR_RESET)"
	@npm run format:check

type-check:
	@echo "$(COLOR_GREEN)Type checking frontend...$(COLOR_RESET)"
	@npm run type-check

check: lint-fix format type-check
	@echo "$(COLOR_GREEN)✓ Frontend checks passed (lint-fix + format + type-check)$(COLOR_RESET)"

# Testing
test:
	@echo "$(COLOR_GREEN)Running frontend tests...$(COLOR_RESET)"
	@npm run test

test-e2e:
	@echo "$(COLOR_GREEN)Running frontend e2e tests...$(COLOR_RESET)"
	@npm run e2e

test-watch:
	@echo "$(COLOR_GREEN)Running frontend tests in watch mode...$(COLOR_RESET)"
	@npm run test -- --watch

test-cov:
	@echo "$(COLOR_GREEN)Running frontend tests with coverage...$(COLOR_RESET)"
	@npm run test -- --coverage
	@echo "$(COLOR_GREEN)✓ Coverage report generated$(COLOR_RESET)"

# Build
build:
	@echo "$(COLOR_GREEN)Building frontend for production...$(COLOR_RESET)"
	@npm run build
	@echo "$(COLOR_GREEN)✓ Frontend build complete$(COLOR_RESET)"

# Cleanup
clean:
	@echo "$(COLOR_GREEN)Cleaning frontend artifacts...$(COLOR_RESET)"
	@rm -rf node_modules .next dist build coverage .vite 2>/dev/null || true
	@echo "$(COLOR_GREEN)✓ Frontend artifacts cleaned$(COLOR_RESET)"

# Git
checkout:
	@echo "$(COLOR_GREEN)Checking out main branch and pulling latest changes...$(COLOR_RESET)"
	@git checkout main
	@git fetch origin
	@git pull origin main
	@echo "$(COLOR_GREEN)✓ On main branch with latest changes$(COLOR_RESET)"

push:
	@echo "$(COLOR_GREEN)Adding, committing, and pushing changes...$(COLOR_RESET)"
	@git add .
	@git commit -m $(COPILOT_MESSAGE)"
	@git push
	@echo "$(COLOR_GREEN)✓ Changes pushed to remote repository$(COLOR_RESET)"