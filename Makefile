.PHONY: help build up down restart logs logs-backend logs-frontend logs-db ps shell-backend shell-db migrate-db seed-db test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all containers
	docker-compose build

build-dev: ## Build development containers
	docker-compose -f docker-compose.dev.yml build

up: ## Start all services in production mode
	docker-compose up -d

dev: ## Start all services in development mode
	docker-compose -f docker-compose.dev.yml up -d

down: ## Stop all services
	docker-compose down

down-dev: ## Stop development services
	docker-compose -f docker-compose.dev.yml down

restart: ## Restart all services
	docker-compose restart

restart-dev: ## Restart development services
	docker-compose -f docker-compose.dev.yml restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

logs-db: ## Show database logs
	docker-compose logs -f postgres

ps: ## Show running containers
	docker-compose ps

ps-dev: ## Show running development containers
	docker-compose -f docker-compose.dev.yml ps

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-backend-dev: ## Open shell in development backend container
	docker-compose -f docker-compose.dev.yml exec backend sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d beautyshop

migrate-db: ## Run database migrations
	docker-compose exec backend npx prisma migrate deploy

seed-db: ## Seed database with initial data
	docker-compose exec backend npx prisma db seed

test: ## Run tests
	docker-compose exec backend npm test

test-coverage: ## Run tests with coverage
	docker-compose exec backend npm run test:coverage

clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

rebuild-dev: ## Rebuild and restart development services
	docker-compose -f docker-compose.dev.yml down
	docker-compose -f docker-compose.dev.yml build --no-cache
	docker-compose -f docker-compose.dev.yml up -d
