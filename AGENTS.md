# AGENTS.md

## Critical: Architecture Has Two Parts

This repo contains a **Next.js frontend** that proxies to a **Laravel backend** (`backend/`). They deploy as separate Azure Container Apps.

- `backend/` — Laravel 11 API (Sanctum auth, CTM proxy, database access)
- `/` (root) — Next.js 16 frontend (this repo)

## Dev Setup

```bash
pnpm dev          # Next.js dev server (port 3000)
pnpm build        # Production build
pnpm lint         # ESLint only
pnpm exec playwright test path/to/test.spec.ts   # Single e2e test
```

**No `typecheck` script in package.json.** CI runs `pnpm tsc --noEmit` directly (with `continue-on-error: true`).

**Package manager: pnpm.** Node 22.x required.

## Authentication

Auth is handled by Laravel Sanctum in `backend/`. The Next.js `app/api/auth/*` routes proxy to `http://localhost:8000/api/*` (or `NEXT_PUBLIC_LARAVEL_API_URL`).

`lib/auth.ts` provides **dev bypass only** — hardcoded credentials `agsdev@allianceglobalsolutions.com` / `ags2026@@`.

`proxy.ts` (root) is **CORS middleware for Laravel API calls**, not Supabase auth. Do not confuse it with auth session logic.

## Azure Deployment

CI builds two images via ACR (Azure Container Registry):
- `bob-nextjs` — Next.js standalone build
- `bob-laravel` — Laravel API

Migrations run via `az containerapp exec --name bob-laravel -- command "php artisan migrate --force"`.

## Database

Azure PostgreSQL, initialized via `database/init.sql`. Schema uses Laravel's `personal_access_tokens` (Sanctum), NOT Supabase auth. The `supabase/migrations/` files are stale — do not rely on them for schema truth.

## CTM Integration

CTM API is called from **both**:
- Next.js `app/api/ctm/*` routes (frontend proxy)
- Laravel `backend/app/Http/Controllers/CTMController.php` (backend proxy)

CTM uses Basic Auth: `Authorization: Basic base64(ACCESS_KEY:SECRET_KEY)`.

## AI Analysis

`lib/ai/` handles scoring via OpenRouter (Claude-3-Haiku) + keyword fallback. 25-criterion rubric. ZTP criteria (3.4, 5.1, 5.2) auto-fail calls (score → 0). See `docs/AI_SCORING_SYSTEM.md`.

Live monitoring uses **polling** (`useMonitorPage` hook), not WebSockets. AssemblyAI streaming is for real-time transcription only.

## Key File Locations

- `app/api/auth/login/route.ts` → proxies to Laravel `/api/login`
- `app/api/ctm/*` → CTM API proxy (frontend side)
- `backend/app/Http/Controllers/CTMController.php` → CTM API proxy (backend side)
- `lib/ai/analyzer.ts` → main AI scoring entrypoint
- `lib/ctm/client.ts` → CTM base client
- `lib/realtime/assemblyai-realtime.ts` → AssemblyAI WebSocket streaming
- `database/init.sql` → authoritative database schema
