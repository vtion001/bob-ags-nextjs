# Azure Deployment Guide

Deploys BOB to Azure Container Apps with Azure Database for PostgreSQL and Azure Redis.

## Architecture

```
Internet → Next.js (bob-nextjs) [public]
                 ↓ NEXT_PUBLIC_LARAVEL_API_URL
          Laravel (bob-laravel) [internal]
                 ↓
          PostgreSQL Flexible (bob-postgres)
          Redis (bob-redis)
```

## Prerequisites

- Azure CLI (`az login`)
- jq (`brew install jq` or `apt install jq`)
- Resource group: `rg-bob-prod`
- ACR name: `bobacr` (must be globally unique)

## One-Time Infrastructure Setup

```bash
# Login to Azure
az login

# Set variables
RG="rg-bob-prod"
LOCATION="southeastasia"

# Generate secrets
POSTGRES_PASSWORD=$(openssl rand -base64 24)
REDIS_KEY=$(openssl rand -base64 24)
LARAVEL_APP_KEY=$(php -r "echo 'base64:' . base64_encode(random_bytes(32));")

# Deploy infrastructure
az deployment group create \
  --resource-group "$RG" \
  --template-file main.bicep \
  --parameters baseName=bob \
             location="$LOCATION" \
             postgresPassword="$POSTGRES_PASSWORD" \
             redisKey="$REDIS_KEY" \
             laravelAppKey="$LARAVEL_APP_KEY"
```

## Generate Laravel APP_KEY

```bash
cd backend
php artisan key:generate --show
```

Or manually:
```bash
php -r "echo 'base64:' . base64_encode(random_bytes(32));"
```

## Deploy (CI/CD)

Every push to `main` triggers the GitHub Actions workflow:

1. Builds `bob-nextjs` and `bob-laravel` Docker images
2. Pushes to `bobacr.azurecr.io`
3. Deploys to existing Container Apps
4. Runs `php artisan migrate --force`
5. Runs `php artisan db:seed --force`

## Manual Deployment

```bash
# Build and push images
az acr build --registry bobacr --image bob-nextjs:latest --file Dockerfile .
az acr build --registry bobacr --image bob-laravel:latest --file backend/Dockerfile ./backend

# Update Container Apps (must already exist from bicep)
az containerapp update --name bob-nextjs --resource-group rg-bob-prod \
  --image bobacr.azurecr.io/bob-nextjs:latest

az containerapp update --name bob-laravel --resource-group rg-bob-prod \
  --image bobacr.azurecr.io/bob-laravel:latest

# Run migrations
az containerapp exec --name bob-laravel --resource-group rg-bob-prod \
  --command "php artisan migrate --force"

# Seed users
az containerapp exec --name bob-laravel --resource-group rg-bob-prod \
  --command "php artisan db:seed --force"
```

## Seeded Users

| Role | Email | Password |
|------|-------|----------|
| Admin | v.rodriguez@allianceglobalsolutions.com | vrodriguez2026@@ |
| QA | allyssa@allianceglobalsolutions.com | allyssa2026@@ |
| Viewer | kiel@allianceglobalsolutions.com | kiel2026@@ |
| Viewer | jd@allianceglobalsolutions.com | jd2026@@ |

## Environment Variables

### Laravel (bob-laravel)

| Secret | Description |
|--------|-------------|
| `APP_KEY` | Laravel encryption key |
| `DB_PASSWORD` | PostgreSQL password |
| `REDIS_KEY` | Redis access key |
| `CTM_SECRET_KEY` | CTM API secret |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key |

| Env Var | Value |
|---------|-------|
| `APP_ENV` | `production` |
| `SESSION_DRIVER` | `redis` |
| `CACHE_DRIVER` | `redis` |
| `REDIS_CLIENT` | `predis` |
| `DB_HOST` | `bob-postgres.postgres.database.azure.com` |

### Next.js (bob-nextjs)

| Env Var | Value |
|---------|-------|
| `NEXT_PUBLIC_LARAVEL_API_URL` | `https://bob-laravel.<region>.azurecontainerapps.io` |

## Local Development

```bash
# Start Laravel backend
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --port=8000

# Start Next.js
pnpm dev
```

## Rollback

```bash
# Re-deploy previous image
az containerapp update --name bob-laravel --resource-group rg-bob-prod \
  --image bobacr.azurecr.io/bob-laravel:<previous-sha>
```
