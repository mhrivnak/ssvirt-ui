# Makefile for SSVIRT Web UI
.PHONY: help install install-dev clean clean-build build test test-watch lint lint-fix typecheck format format-check security audit ci all dev preview check dev-check info

# Default target
help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Installation and setup
install: ## Install dependencies
	npm ci

install-dev: ## Install dependencies (including dev)
	npm install

# Cleaning
clean: ## Clean build artifacts and node_modules
	rm -rf dist node_modules

clean-build: ## Clean only build artifacts
	rm -rf dist

# Development
dev: ## Start development server
	npm run dev

preview: build ## Preview production build
	npm run preview

# Building
build: ## Build the application
	npm run build

# Testing and quality checks
test: ## Run tests
	npm run test:run

test-watch: ## Run tests in watch mode
	npm run test

# Code quality
lint: ## Run ESLint
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint:fix

typecheck: ## Run TypeScript type checking
	npm run typecheck

format: ## Format code with Prettier
	npm run format

format-check: ## Check code formatting
	npm run format:check

# Security
security: ## Run security audit
	npm audit --audit-level moderate

audit: ## Run full security audit
	npm audit

# CI pipeline (matches GitHub Actions)
ci: install check build test security ## Run all CI checks (same as GitHub Actions)

# Quality checks (without build)
check: lint format-check typecheck ## Run code quality checks only

# Complete workflow
all: clean ci ## Clean, install, and run all checks

# Development workflow
dev-check: lint format typecheck ## Quick development checks with auto-formatting

# Help for common workflows
info: ## Show common workflow information
	@printf "\nCommon workflows:\n  make dev          - Start development server\n  make dev-check    - Quick development checks with formatting\n  make ci           - Run all CI checks (same as GitHub Actions)\n  make check        - Run quality checks without building\n  make all          - Complete clean build and test\n\nIndividual commands:\n  make install      - Install dependencies\n  make build        - Build application\n  make test         - Run tests\n  make lint         - Check code style\n  make format       - Format code\n  make typecheck    - Check TypeScript types\n  make security     - Run security audit\n\n"