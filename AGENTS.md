# AGENTS.md

## Architecture

**Next.js frontend** (`/`) proxies to **Laravel backend** (`backend/`). They deploy as separate Azure Container Apps.

- `backend/` — Laravel 11 API (Sanctum auth, CTM proxy, PostgreSQL + Redis)
- `/` (root) — Next.js 16 frontend

## Dev Setup

```bash
pnpm dev          # Next.js dev server (port 3000)
pnpm build        # Production build
pnpm lint         # ESLint only
pnpm exec playwright test path/to/test.spec.ts   # Single e2e test
```

**No `typecheck` script.** CI runs `pnpm tsc --noEmit` directly.

**Package manager: pnpm.** Node 22.x required.

## Auth

**Laravel Sanctum** is the sole auth provider. All `app/api/auth/*` routes proxy to Laravel (`NEXT_PUBLIC_LARAVEL_API_URL`).

- `app/api/auth/{login,logout,session,register,forgot-password}/route.ts` — Laravel proxies
- `lib/laravel/api-client.ts` — API client (`credentials: 'include'`)
- `proxy.ts` — CORS middleware for Laravel API calls

**No Supabase auth.** `supabase/`, `lib/supabase/`, and `scripts/create-test-users.ts` are deleted.

## Database

Authoritative schema: `database/init.sql` (Azure PostgreSQL).

Laravel Sanctum `personal_access_tokens` table used for sessions (not Supabase auth).

## Redis

Laravel uses Redis for sessions and cache (`SESSION_DRIVER=redis`, `CACHE_DRIVER=redis`).
Client: `predis/predis` (pure PHP, no extension required).

## Azure Infrastructure

**Region**: Southeast Asia (Singapore).

Bicep templates in `azure/`:
- `main.bicep` — orchestrator
- `postgres.bicep` — Azure Database for PostgreSQL Flexible (B1ms)
- `redis.bicep` — Azure Cache for Redis (Standard S0)
- `containerapp-laravel.bicep` — Internal ingress only
- `containerapp-nextjs.bicep` — Public ingress

CI/CD deploys images via ACR (`bobacr`). See `azure/README.md` for one-time setup.

## CTM Integration

CTM API called from **both**:
- Next.js `app/api/ctm/*` routes (frontend proxy)
- Laravel `backend/app/Http/Controllers/CTMController.php` (backend proxy)

## Seeded Users (Laravel)

Run `php artisan db:seed` (or via CI/CD after migrate):

| Role | Email | Password |
|------|-------|----------|
| Admin | v.rodriguez@allianceglobalsolutions.com | vrodriguez2026@@ |
| QA | allyssa@allianceglobalsolutions.com | allyssa2026@@ |
| Viewer | kiel@allianceglobalsolutions.com | kiel2026@@ |
| Viewer | jd@allianceglobalsolutions.com | jd2026@@ |

## Key Files

- `lib/laravel/api-client.ts` — Laravel API client
- `backend/database/seeders/UserSeeder.php` — user seeding
- `backend/database/seeders/DatabaseSeeder.php` — calls UserSeeder
- `lib/ai/analyzer.ts` — AI scoring entrypoint
- `lib/ctm/client.ts` — CTM base client
- `lib/realtime/assemblyai-realtime.ts` — AssemblyAI WebSocket streaming
- `database/init.sql` — authoritative DB schema
