# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BOB (Business Operations Butler) is a Next.js 16 call tracking and AI-powered quality assurance dashboard for substance abuse helpline calls. It integrates with CallTrackingMetrics (CTM) for call data and AssemblyAI for real-time transcription, with AI scoring via OpenRouter.

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (SSR auth), AssemblyAI, OpenRouter

## Commands

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

**Package manager:** pnpm (not npm). Node 22.x required.

**Testing:** No test suite configured yet.

## Code Style

- **TypeScript**: Strict mode enabled. Prefer explicit types over `any`. Use `interface` for object shapes, `type` for unions.
- **Naming**: PascalCase for components/files, camelCase for functions/variables.
- **Components**: Use `'use client'` directive for client-side components. Custom UI components in `components/ui/`.
- **Styling**: Tailwind CSS 4 with custom design tokens. CSS variables defined in `app/globals.css`. Navy color scale in `tailwind.config.ts`.
- **API Routes**: JWT session validation on protected routes. HTTP-only cookies for session tokens.

## Architecture

### Directory Structure

```
app/
├── api/
│   ├── auth/           # Login, logout, session, forgot-password, agent-lookup
│   ├── ctm/            # CTM API proxy routes
│   │   ├── calls/      # calls, calls/[id], calls/history, calls/search, calls/bulk-sync, calls/analyze
│   │   ├── agents/     # agents, agents/groups
│   │   ├── numbers/    # numbers, numbers/search, numbers/purchase
│   │   ├── receiving_numbers/
│   │   ├── schedules/
│   │   ├── sources/
│   │   ├── voice_menus/
│   │   ├── accounts/
│   │   ├── live-calls/
│   │   ├── active-calls/
│   │   ├── dashboard/stats/
│   │   └── monitor/active-calls/
│   ├── openrouter/     # AI analysis endpoint
│   ├── assemblyai/     # AssemblyAI token and transcription
│   ├── calls/          # notes, qa-override
│   ├── users/          # permissions, settings, ctm-assignments
│   ├── admin/          # fix-user-role, import-agents
│   ├── live-analysis-logs/
│   └── qa-overrides/
├── dashboard/          # Protected dashboard pages
│   ├── calls/[id]/    # Call detail page
│   ├── calls/         # Calls listing page
│   ├── monitor/       # Live call monitoring
│   ├── history/       # Call history with search
│   ├── settings/      # User settings & credentials
│   ├── agents/       # Agent management
│   └── qa-logs/      # QA analysis logs
├── auth/              # Auth pages (signup, callback, forgot-password, reset-password)
└── page.tsx          # Login page

components/
├── ui/                 # shadcn/ui base components (Button, Card, Input, Badge, Dialog, etc.)
├── dashboard/          # Dashboard-specific components
├── call-detail/        # Call detail page components
├── monitor/            # Live monitoring components
├── settings/           # Settings page components
├── agents/             # Agent management components
└── history/            # History page components

lib/
├── supabase/           # Supabase client helpers (server.ts, client.ts, middleware.ts)
├── types/              # Centralized TypeScript types (index.ts, ctm.ts)
├── ctm/               # CTM API client and services
│   ├── client.ts      # Base CTMClient class
│   ├── services/      # calls, agents, numbers, schedules, sources, voiceMenus, receivingNumbers, accounts
│   └── transformer.ts # Data transformation utilities
├── ai/                # AI analysis (OpenRouter + keyword fallback)
│   ├── analyzer.ts    # Main transcript analyzer
│   ├── helpers.ts     # Rubric evaluation, scoring, tag generation
│   ├── rubric.ts      # QA rubric definitions
│   └── types.ts       # AI-related types
├── realtime/          # Real-time call analysis (AssemblyAI streaming)
│   ├── assemblyai-realtime.ts  # Streaming transcriber
│   ├── analyzer.ts    # Live text analysis for insights
│   └── types.ts       # Realtime types (RealtimeTranscript, RealtimeInsight, LiveCallState)
├── calls/             # Call data fetching, caching, transformations
│   ├── fetcher.ts     # Data fetching utilities
│   ├── transformer.ts # Data transformation
│   └── cache.ts       # Caching utilities
├── rag/               # RAG knowledge base for suggestions
├── api/               # API utilities (cache.ts, deps.ts)
├── utils/             # Helper functions (formatters.ts, helpers.ts)
└── auth.ts            # Custom HMAC-based session management (legacy)

hooks/
├── dashboard/          # useCalls, useActiveCalls, useDashboardStats, useDashboard, useAgents, useAgentProfiles, useCallHistory
├── monitor/           # useLiveAnalysis, useLiveAIInsights, useMonitorPage
├── calls/             # useCallDetail
├── settings/          # useSettings
└── use-mobile.ts      # Mobile detection hook

supabase/
├── migrations/         # Database schema migrations
└── functions/         # Edge Functions (on-auth-signup)
```

### Data Flow

```
Browser → AssemblyAI WebSocket (streaming audio)
       → lib/realtime/analyzer.ts (live keyword detection)
       → useMonitorPage (polling for updates)
       → Dashboard UI

Browser → CTM API → app/api/ctm/* (proxy) → CTMClient → CTM API
       → lib/ctm/services/*.ts (transform)
       → Dashboard hooks → UI

Transcript → lib/ai/analyzer.ts (OpenRouter API)
          → 25-criterion rubric evaluation
          → QA score + tags + disposition
```

### Authentication

Two auth systems coexist:
1. **Supabase SSR** (`@supabase/ssr`) - Primary auth, configured in `proxy.ts` (root) and `lib/supabase/server.ts`
2. **Legacy HMAC sessions** (`lib/auth.ts`) - Custom session tokens for developer login

`proxy.ts` creates a Supabase server client and refreshes sessions on every request. **Must use `getSession()` (not `getUser()`)** to refresh cookies. Using `getUser()` alone will cause `getSession()` to return null on API routes.

### CTM Integration

`lib/ctm/client.ts` is the base class; `lib/ctm/services/*.ts` contain feature-specific service modules with factory functions (createCallsService, createAgentsService, etc.). API routes in `app/api/ctm/` proxy requests to CTM to hide credentials.

**CTM uses Basic Auth** with `Authorization: Basic base64(ACCESS_KEY:SECRET_KEY)`. API base: `https://api.calltrackingmetrics.com/api/v1`. Rate limit: 1000 req/min.

**Key services:** `calls.ts` (list/detail/transcript/bulk-sync), `agents.ts` (agent profiles/groups), `numbers.ts` (tracking numbers/search/purchase), `receivingNumbers.ts`, `schedules.ts`, `sources.ts`, `accounts.ts`, `voiceMenus.ts`.

### AI Analysis System

`lib/ai/` handles call scoring with:
- **OpenRouter** as primary AI analyzer (Claude-3-Haiku)
- **Keyword fallback** when AI fails
- **25-criterion rubric** for QA scoring (see `docs/AI_SCORING_SYSTEM.md`)

ZTP (Zero Tolerance Policy) criteria (3.4, 5.1, 5.2) auto-fail calls if violated.

### Realtime Analysis

`lib/realtime/` handles live call transcription via AssemblyAI streaming. Uses a rubric-based analyzer (`analyzer.ts`) that detects keywords in real-time and calculates live QA scores.

**Flow:** Browser → AssemblyAI WebSocket (streaming audio) → Realtime analyzer → Live QA score updates via polling (`useMonitorPage` hook).

### AI Scoring System (docs/AI_SCORING_SYSTEM.md)

25-criterion rubric evaluates call quality across 5 sections (Opening, Probing, Qualification, Closing, Compliance).

**Max score: 107 points** (22 evaluated criteria; 3 are always N/A requiring Salesforce verification: criteria 4.2, 4.3, 4.4)

**Score formula**: (earned/max) × 100

**Auto-fail (ZTP)**: Criteria 3.4 (unqualified transfers), 5.1 (HIPAA violations), 5.2 (medical advice) set score to 0 if violated, regardless of other criteria.

**Dispositions**: Qualified Lead (80-100), Warm Lead (60-79), Refer (40-59), Do Not Refer (0-39).

**Tags generated:** `excellent`, `good`, `needs-improvement`, `poor`, `unqualified-transfer`, `hipaa-risk`, `medical-advice-risk`, `ztp-violation`, `insurance:{type}`, `state:{state}`

### Database (Supabase)

Migrations in `supabase/migrations/` define the schema. Key tables:
- `users` / `user_roles` - Authentication and authorization
- `agent_profiles` - CTM agent mappings
- `user_settings` - Per-user preferences and credentials
- `live_analysis_logs` - Realtime analysis history
- `qa_overrides` - Manual QA score overrides

## Environment Variables

```bash
NEXTAUTH_SECRET=              # Session encryption key
NEXTAUTH_URL=                 # Application URL
NEXT_PUBLIC_SUPABASE_URL=     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
CTM_ACCESS_KEY=               # CTM API access key
CTM_SECRET_KEY=               # CTM API secret key
CTM_ACCOUNT_ID=               # CTM account ID
OPENROUTER_API_KEY=           # OpenRouter API key for AI
ASSEMBLYAI_API_KEY=           # AssemblyAI API key
```

## Key Patterns

**Server vs Client Components**: Most dashboard components are `'use client'`. API routes in `app/api/` are server-side.

**Supabase Server Client Pattern**:
```typescript
// In API routes, use the proxy pattern:
const { supabase, response } = await createServerSupabase(request)
return response
```

**CTM Service Pattern** (factory functions in `lib/ctm/services/`):
```typescript
const callsService = createCallsService()
const calls = await callsService.getCalls({ hours: 24, limit: 100 })
```

**Live Monitoring**: Uses polling with `useMonitorPage` hook, not WebSockets. AssemblyAI streaming via `lib/realtime/assemblyai-realtime.ts` with AudioWorklet (falls back to ScriptProcessorNode).

**Session refresh middleware** is in `proxy.ts` at the **project root** (not in `lib/`). It uses Supabase SSR and also handles a **dev bypass session** (`sb-dev-session` cookie) that allows local development without real Supabase auth — the dev session is detected and converted to a fake `sb-session` placeholder so downstream Supabase client code works.

**Middleware matcher** excludes `_next/static`, `_next/image`, favicon, and static file extensions (svg, png, jpg, etc.) from session refresh.

**IMPORTANT**: In Supabase SSR, always use `getSession()` (not `getUser()`) to refresh cookies on API routes. Using `getUser()` alone will cause `getSession()` to return null.

## UI Components

Uses **shadcn/ui** (Radix UI primitives) for base components in `components/ui/`:
- Button, Card, Input, Badge, Dialog, Sheet, Select, Tabs, Table, etc.
- Styled with Tailwind CSS 4 and CSS variables from `app/globals.css`
- Custom dashboard components in `components/dashboard/`, `components/monitor/`, `components/call-detail/`, `components/settings/`, `components/agents/`

## next.config.mjs

Contains server external packages for AssemblyAI:
```javascript
serverExternalPackages: ['assemblyai']
```

## Color System

Dark navy theme with cyan accents:
- Navy 900: `#0A1628` (primary)
- Background: `#050D18`
- Cyan Accent: `#00D4FF`

## Demo Credentials

- Email: `demo@example.com`
- Password: `demo`
- Dev credentials: `agsdev@allianceglobalsolutions.com` / `ags2026@@`
