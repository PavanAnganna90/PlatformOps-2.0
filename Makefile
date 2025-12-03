# ============================================================================
# OpsSight - Makefile
# ============================================================================
# 
# Quick Start:
#   make setup    # First-time setup
#   make dev      # Start development servers
#   make docker   # Run with Docker Compose
#
# ============================================================================

.PHONY: help setup dev dev-web dev-api docker docker-build docker-down \
        test test-api lint format clean

# Default target
.DEFAULT_GOAL := help

# Colors for terminal output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# ============================================================================
# Help
# ============================================================================

help: ## Show this help message
	@echo ""
	@echo "$(BLUE)OpsSight$(NC) - DevOps Visibility Platform"
	@echo ""
	@echo "$(GREEN)Usage:$(NC)"
	@echo "  make $(YELLOW)<target>$(NC)"
	@echo ""
	@echo "$(GREEN)Quick Start:$(NC)"
	@echo "  make setup     # First-time setup (install dependencies)"
	@echo "  make dev       # Start both frontend and backend"
	@echo "  make docker    # Run with Docker Compose"
	@echo ""
	@echo "$(GREEN)Available Targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ============================================================================
# Setup
# ============================================================================

setup: ## First-time setup - install all dependencies
	@echo "$(BLUE)Setting up OpsSight...$(NC)"
	@echo ""
	@echo "$(GREEN)1. Creating .env file...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "   Created .env from .env.example"; \
		echo "   $(YELLOW)Please edit .env with your configuration$(NC)"; \
	else \
		echo "   .env already exists, skipping"; \
	fi
	@echo ""
	@echo "$(GREEN)2. Installing frontend dependencies...$(NC)"
	npm install
	@echo ""
	@echo "$(GREEN)3. Installing backend dependencies...$(NC)"
	cd apps/api && pip install -e ".[dev]"
	@echo ""
	@echo "$(GREEN)Setup complete!$(NC)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit .env with your configuration"
	@echo "  2. Run 'make dev' to start development servers"
	@echo ""

setup-web: ## Install frontend dependencies only
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	npm install

setup-api: ## Install backend dependencies only
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	cd apps/api && pip install -e ".[dev]"

# ============================================================================
# Development
# ============================================================================

dev: ## Start both frontend and backend development servers
	@echo "$(BLUE)Starting OpsSight development servers...$(NC)"
	@echo ""
	@echo "$(GREEN)Frontend:$(NC) http://localhost:5173"
	@echo "$(GREEN)Backend:$(NC)  http://localhost:8000"
	@echo "$(GREEN)API Docs:$(NC) http://localhost:8000/docs"
	@echo ""
	@echo "Press Ctrl+C to stop"
	@echo ""
	@# Run both in parallel using background processes
	@trap 'kill 0' EXIT; \
		(cd apps/api && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) & \
		npm run dev & \
		wait

dev-web: ## Start frontend development server only
	@echo "$(GREEN)Starting frontend on http://localhost:5173$(NC)"
	npm run dev

dev-api: ## Start backend development server only
	@echo "$(GREEN)Starting backend on http://localhost:8000$(NC)"
	@echo "$(GREEN)API Docs: http://localhost:8000/docs$(NC)"
	cd apps/api && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ============================================================================
# Docker
# ============================================================================

docker: docker-build docker-up ## Build and start Docker containers

docker-build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker-compose build

docker-up: ## Start Docker containers
	@echo "$(GREEN)Starting Docker containers...$(NC)"
	@echo ""
	@echo "$(GREEN)Frontend:$(NC) http://localhost:5173"
	@echo "$(GREEN)Backend:$(NC)  http://localhost:8000"
	@echo ""
	docker-compose up

docker-down: ## Stop Docker containers
	@echo "$(GREEN)Stopping Docker containers...$(NC)"
	docker-compose down

docker-logs: ## View Docker container logs
	docker-compose logs -f

docker-clean: ## Remove Docker containers and images
	@echo "$(YELLOW)Removing Docker containers and images...$(NC)"
	docker-compose down --rmi all --volumes --remove-orphans

# ============================================================================
# Testing
# ============================================================================

test: test-api ## Run all tests

test-api: ## Run backend tests
	@echo "$(GREEN)Running backend tests...$(NC)"
	cd apps/api && pytest -v --cov=app --cov-report=term-missing

test-web: ## Run frontend tests
	@echo "$(GREEN)Running frontend tests...$(NC)"
	npm test

# ============================================================================
# Code Quality
# ============================================================================

lint: lint-api lint-web ## Run all linters

lint-api: ## Lint backend code
	@echo "$(GREEN)Linting backend code...$(NC)"
	cd apps/api && ruff check app
	cd apps/api && mypy app

lint-web: ## Lint frontend code
	@echo "$(GREEN)Linting frontend code...$(NC)"
	npm run lint 2>/dev/null || echo "No lint script configured"

format: format-api ## Format all code

format-api: ## Format backend code
	@echo "$(GREEN)Formatting backend code...$(NC)"
	cd apps/api && black app
	cd apps/api && ruff check --fix app

# ============================================================================
# Build
# ============================================================================

build: build-web ## Build for production

build-web: ## Build frontend for production
	@echo "$(GREEN)Building frontend for production...$(NC)"
	npm run build

build-api: ## Build backend Docker image
	@echo "$(GREEN)Building backend Docker image...$(NC)"
	docker build -t opssight-api ./apps/api

# ============================================================================
# Kubernetes
# ============================================================================

k8s-deploy: ## Deploy to Kubernetes using Helm
	@echo "$(GREEN)Deploying to Kubernetes...$(NC)"
	helm upgrade --install opssight ./charts/opssight \
		--namespace opssight \
		--create-namespace \
		--values ./charts/opssight/values.yaml

k8s-delete: ## Delete Kubernetes deployment
	@echo "$(YELLOW)Deleting Kubernetes deployment...$(NC)"
	helm uninstall opssight --namespace opssight

# ============================================================================
# Cleanup
# ============================================================================

clean: ## Clean build artifacts and caches
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf dist/
	rm -rf node_modules/.cache/
	rm -rf apps/api/.pytest_cache/
	rm -rf apps/api/.mypy_cache/
	rm -rf apps/api/.ruff_cache/
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)Done!$(NC)"

clean-all: clean ## Clean everything including node_modules
	@echo "$(YELLOW)Removing node_modules...$(NC)"
	rm -rf node_modules/
	@echo "$(GREEN)Done!$(NC)"

