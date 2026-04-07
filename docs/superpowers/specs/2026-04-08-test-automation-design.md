# Test & Validation System Design — bob-ags-nextjs-backup

## Status

**Approved** — Pending implementation via writing-plans.

---

## Overview

A 4-phase hybrid workflow:
1. **Parallel audit** — Fan-out subagents to inventory all code
2. **Sequential deep-dive** — Critical path analysis (auth → CTM → AI → realtime → hooks)
3. **Test infrastructure build** — Vitest + Testing Library + Playwright scaffolding
4. **PR-triggered cron validation** — On every PR open/update, plus daily fallback; desktop notifications on failure

---

## Phase 1: Parallel Audit

### Subagents (run simultaneously)

| Agent | Scope | Output |
|-------|-------|--------|
| `frontend-auditor` | `components/`, `hooks/`, `app/dashboard/` | Inventory of all hooks/components, dependency graph, issue log |
| `backend-auditor` | `app/api/`, `lib/ai/`, `lib/calls/`, `lib/utils/` | Same |
| `integrations-auditor` | `lib/ctm/`, `app/api/ctm/` | Same + CTM auth flow trace |
| `realtime-auditor` | `lib/realtime/`, `app/api/assemblyai/` | Same + WebSocket flow trace |

### Audit inventory format (per item)

```
## [filename]: [exported name]
- **Type**: hook | utility | service | API route | component
- **Signature**: [function signature]
- **Purpose**: [1 sentence]
- **Dependencies**: [list]
- **Risk**: Low | Medium | High
- **Issues**: [any type gaps, missing error handling, any abuse]
```

### Output

`AUDIT_INVENTORY.md` — merged inventory from all 4 auditors.

---

## Phase 2: Sequential Deep-Dive

Run **after** Phase 1. Sequential because each path informs the next.

### Critical Path 1: Auth Flow

**Files**: `proxy.ts`, `lib/supabase/server.ts`, `lib/auth.ts`, `app/api/auth/*`

**Trace**:
```
Login form → POST /api/auth/login → JWT cookie set → proxy.ts session refresh →
getSession() on API routes → Supabase SSR middleware
```

**Failure modes**:
- `getUser()` used instead of `getSession()` → session null on API routes
- `sb-dev-session` cookie not converted → dev bypass fails silently
- JWT expired → no refresh → 401 on protected routes
- Cookie not set with `httpOnly: true` → XSS risk

**What needs mocking**: Supabase client, JWT verification
**What needs live credentials**: None (dev bypass available)

---

### Critical Path 2: CTM Integration

**Files**: `lib/ctm/client.ts`, `lib/ctm/services/*.ts`, `app/api/ctm/*`

**Trace**:
```
API route → createCallsService() → CTMClient → Basic Auth header →
https://api.calltrackingmetrics.com/api/v1
```

**Failure modes**:
- Missing `CTM_ACCESS_KEY` / `CTM_SECRET_KEY` → 401
- Rate limit (1000 req/min) not handled → 429
- Service factory not returning correct instance → runtime error
- Transformer returning wrong shape → UI breaks

**What needs mocking**: CTM HTTP responses (use `nock` or MSW)
**What needs live credentials**: Optional (can test transform logic in isolation)

---

### Critical Path 3: AI Analysis Pipeline

**Files**: `lib/ai/analyzer.ts`, `lib/ai/rubric.ts`, `lib/ai/scoring.ts`, `lib/ai/result-parser.ts`, `app/api/openrouter/`

**Trace**:
```
Transcript → analyzer.ts → OpenRouter API (Claude-3-Haiku) →
result-parser.ts → rubric scoring → tags + disposition
```

**Failure modes**:
- OpenRouter API key missing → fallback to keyword matching (should work, but verify)
- Malformed transcript → scoring breaks
- ZTP criteria (3.4, 5.1, 5.2) not triggering auto-fail → score incorrect
- Score formula `(earned/max) × 100` off → disposition wrong

**What needs mocking**: OpenRouter API responses
**What needs live credentials**: `OPENROUTER_API_KEY` only

---

### Critical Path 4: Realtime Pipeline

**Files**: `lib/realtime/assemblyai-realtime.ts`, `lib/realtime/analyzer.ts`, `lib/realtime/audio-processor.ts`, `app/api/assemblyai/`

**Trace**:
```
Browser microphone → AudioWorklet → AssemblyAI WebSocket →
streaming transcript → analyzer.ts → live QA score → polling via useMonitorPage
```

**Failure modes**:
- AudioWorklet fails → no fallback to ScriptProcessorNode → mic doesn't work
- WebSocket disconnects → no reconnect logic → live analysis dies silently
- Transcript buffer overflow → memory leak
- `useMonitorPage` polling stops on error → stale data shown

**What needs mocking**: AssemblyAI WebSocket (mock streaming responses)
**What needs live credentials**: `ASSEMBLYAI_API_KEY`

---

### Critical Path 5: Dashboard Hooks

**Files**: `hooks/dashboard/*.ts`, `hooks/monitor/*.ts`, `hooks/calls/*.ts`

**Trace**:
```
Page mount → hook fetches data → API route called →
CTM/Supabase queried → state updated → UI re-renders
```

**Failure modes**:
- Missing `use client` directive → server-side rendering breaks
- SWR/fetch cache not invalidated after mutations
- Error state not handled → blank screen on network failure
- Loading states not wired → skeleton not shown

**What needs mocking**: All API responses (CTM + Supabase)

---

## Phase 3: Test Infrastructure Build

### Tooling

- **Vitest** — Unit + integration tests
- **Testing Library** (`@testing-library/react`) — React component tests
- **Playwright** (`@playwright/test`) — E2E tests
- **Mock Service Worker (MSW)** — Mock HTTP in browser + Node
- **`osascript`** — macOS desktop notifications (built-in)

### Install

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
pnpm add -D msw
npx playwright install --with-deps chromium
```

### Config: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/integration/**/*.test.ts'],
  },
})
```

### Config: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

### Test Directory Structure

```
tests/
├── setup.ts                    # Testing Library globals, MSW setup
├── mocks/
│   ├── supabase.ts             # Mock Supabase client
│   ├── ctm.ts                  # Mock CTM API responses
│   └── openrouter.ts            # Mock OpenRouter responses
├── unit/
│   ├── auth.test.ts
│   ├── ctm-transformer.test.ts
│   ├── ai-scoring.test.ts
│   ├── rubric.test.ts
│   └── utils.test.ts
├── integration/
│   ├── api-auth.test.ts
│   ├── api-calls.test.ts
│   └── hooks/
│       ├── useDashboard.test.tsx
│       └── useCallDetail.test.tsx
└── e2e/
    ├── login.spec.ts
    ├── dashboard.spec.ts
    ├── call-detail.spec.ts
    └── monitor.spec.ts
```

### Test Priority

| Priority | What | Why |
|----------|------|-----|
| 1 | Auth utilities (`lib/auth.ts`, `lib/supabase/server.ts`) | Auth breaks = everything breaks |
| 2 | CTM transformer (`lib/ctm/transformer.ts`) | Wrong data shape = UI breaks |
| 3 | AI scoring (`lib/ai/scoring.ts`, `lib/ai/result-parser.ts`) | Score/disposition wrong = wrong business decisions |
| 4 | Dashboard hooks | Data fetching broken = blank screens |
| 5 | API route handlers | API broken = no data flows |
| 6 | UI components | Components broken = bad UX |

### E2E Tests (Playwright)

| Test | What it does |
|------|--------------|
| `login.spec.ts` | Demo mode login + real credentials login flow |
| `dashboard.spec.ts` | Dashboard loads, stats cards visible, call table renders |
| `call-detail.spec.ts` | Navigate to call detail, transcript visible |
| `monitor.spec.ts` | Monitor page loads, active call card renders |

---

## Phase 4: PR-Triggered Cron Validation

### Trigger

**Primary**: GitHub PR webhook — fires on `pull_request` (opened, synchronize)

**Fallback**: Daily cron at 9am local — fires regardless of git activity

```
┌─────────────────────────────────────────────────────────┐
│  PR opened/updated                                      │
│    ↓                                                    │
│  GitHub webhook → CI script runs                        │
│    ↓                                                    │
│  vitest run  (unit + integration)                       │
│    ↓                                                    │
│  playwright test  (E2E)                                │
│    ↓                                                    │
│  [PASS] → post success comment on PR                   │
│  [FAIL] → desktop notification + post failure comment   │
└─────────────────────────────────────────────────────────┘
```

### CI Script: `scripts/run-pr-tests.sh`

```bash
#!/bin/bash
set -e

echo "=== Running Vitest (unit + integration) ==="
pnpm vitest run --reporter=verbose

echo "=== Running Playwright E2E ==="
pnpm playwright test --reporter=list

echo "=== All tests passed ==="
```

### Desktop Notification

```bash
# On failure (macOS)
osascript -e 'display notification "BOB-AGS Tests FAILED" with title "Test Run" sound name "Basso"'

# On success (macOS)
osascript -e 'display notification "BOB-AGS Tests PASSED" with title "Test Run" sound name "Glass"'
```

### PR Comment Template

```
## Test Results

| Suite | Status | Duration |
|-------|--------|----------|
| Vitest (unit/integration) | ✅ | Xs |
| Playwright (E2E) | ✅/❌ | Xs |

<details>
<summary>Failures (if any)</summary>

```
[error output]
```
</details>
```

---

## Documentation Outputs

| File | Phase | Contents |
|------|-------|----------|
| `docs/superpowers/specs/2026-04-08-test-automation-design.md` | 0 (this doc) | Design spec |
| `AUDIT_INVENTORY.md` | 1 | Full codebase inventory |
| `CRITICAL_PATHS.md` | 2 | Deep-dive findings per critical path |
| `TEST_SUITE_GUIDE.md` | 3 | How to run tests locally + CI |
| `CLAUDE.md` (update) | 3 | Add test commands to existing CLAUDE.md |

---

## Scope Boundaries

### In Scope
- Unit tests for all pure utilities and transformers
- Integration tests for API routes (mocked external APIs)
- E2E tests for happy-path user flows
- Vitest + Playwright infrastructure
- PR-triggered validation with desktop notifications
- Daily cron fallback

### Out of Scope
- Tests for `node_modules/` (vendor code)
- Performance/load testing
- Visual regression testing (future consideration)
- Tests requiring live CTM/AssemblyAI credentials (all mocked)
- Modifying production code (audit only; refactoring comes later)

---

## Acceptance Criteria

1. Phase 1 produces `AUDIT_INVENTORY.md` with every exported function/hook/service catalogued
2. Phase 2 identifies all failure modes in the 5 critical paths
3. Phase 3 `vitest run` passes for all unit tests
4. Phase 3 `playwright test` passes for all E2E tests
5. Phase 4 fires on every PR and sends desktop notification on failure
6. Daily cron fires at 9am and runs full suite
7. No live credentials required for any test (all mocked)
8. `CLAUDE.md` updated with test commands
