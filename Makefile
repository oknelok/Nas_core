.PHONY: up up-detached up-frontend up-backend down down-frontend down-backend build logs

## Full stack
up:
	docker compose --profile frontend --profile backend up

up-detached:
	docker compose --profile frontend --profile backend up -d

## Frontend only (set DRUPAL_BASE_URL in .env to external Drupal URL)
up-frontend:
	docker compose --profile frontend up

## Backend only
up-backend:
	docker compose --profile backend up

## Stop all
down:
	docker compose --profile frontend --profile backend down

down-frontend:
	docker compose --profile frontend down

down-backend:
	docker compose --profile backend down

## Rebuild images (use after code changes)
build:
	docker compose --profile frontend --profile backend build

## Tail logs
logs:
	docker compose --profile frontend --profile backend logs -f
