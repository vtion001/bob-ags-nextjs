# BOB Refactoring Guide

## Overview

This guide documents refactoring patterns used in the BOB project to maintain a clean, modular architecture.

## When to Refactor

Consider refactoring when:
- A file exceeds **300 lines**
- A page component has **multiple responsibilities**
- Logic is **duplicated** across files
- A module has **mixed concerns** (types, logic, constants all in one file)
- Testing becomes **difficult** due to tight coupling

## Refactoring Patterns

### 1. Monolith AI Module → Modular

**Before:** `lib/ai.ts` (348 lines)
- Types, rubric, helpers, analyzer all in one file

**After:** `lib/ai/` module
```
lib/ai/
├── types.ts      # Interfaces (Analysis, CriterionResult)
├── rubric.ts     # RUBRIC_CRITERIA constant
├── helpers.ts    # Pure functions (extractNames, keywordMatch, etc.)
├── analyzer.ts   # Main analyzeTranscript function
└── index.ts     # Re-exports (via lib/ai.ts)
```

**Steps:**
1. Create `lib/ai/types.ts` - Move interfaces
2. Create `lib/ai/rubric.ts` - Move constants
3. Create `lib/ai/helpers.ts` - Move pure functions
4. Create `lib/ai/analyzer.ts` - Move main function
5. Update `lib/ai.ts` to re-export from module

**Verification:**
```bash
npm run build
```

### 2. Monolith Page → Hook + Components

**Before:** `app/dashboard/page.tsx` (500+ lines)
- All state, logic, and UI in one file

**After:**
```
hooks/dashboard/useDashboard.ts       # State + side effects
components/dashboard/
├── DashboardHeader.tsx              # Header with filters
├── DashboardStats.tsx              # Stats cards
├── DashboardRecentCalls.tsx         # Calls table
pages/dashboard/page.tsx             # Thin page (~100 lines)
```

**Steps:**
1. Create custom hook (`useDashboard.ts`)
   - Move all state
   - Move all useEffect hooks
   - Move callback functions
2. Identify UI sections as components
3. Create component files
4. Update page to compose hook + components

**Example Hook Structure:**
```typescript
interface UseDashboardReturn {
  // State
  isLoading: boolean
  stats: DashboardStats
  recentCalls: Call[]
  // Actions
  handleSyncNow: () => Promise<void>
  handleAnalyze: () => Promise<void>
  // ...
}

export function useDashboard(): UseDashboardReturn {
  // ... implementation
}
```

### 3. Large API Route → Service Module

**Before:** `app/api/calls/route.ts` (300+ lines)
- Direct CTM calls, Supabase caching, all in route

**After:** `lib/calls/` module
```
lib/calls/
├── transformer.ts   # DB <-> API transforms
├── fetcher.ts       # CTM API calls
├── cache.ts         # Supabase operations
└── index.ts
```

**Steps:**
1. Create `lib/calls/transformer.ts` - Data transformations
2. Create `lib/calls/fetcher.ts` - CTM API logic
3. Create `lib/calls/cache.ts` - Supabase operations
4. Simplify route to use service module

**Example:**
```typescript
// Before in route
const calls = await ctmClient.calls.getCalls({ limit, hours, agentId })
const inbound = calls.filter(c => c.direction === 'inbound')
// ... transformation logic

// After in route
import { fetchCallsFromCTM } from '@/lib/calls'
const calls = await fetchCallsFromCTM({ hours, agentId, limit })
```

### 4. Mixed RAG Module → Structured

**Before:** `lib/rag/knowledge-base.ts` (270 lines)
- Types, knowledge entries, suggestions all in one file

**After:** `lib/rag/` module
```
lib/rag/
├── types.ts        # KnowledgeEntry interface
├── knowledge.ts    # KNOWLEDGE_BASE + getRelevantKnowledge
└── suggestions.ts # SUGGESTIONS + getAgentSuggestions
```

### 5. Component with Inline Data → External Constants

**Before:** `AgentAssistantPanel.tsx` (270 lines)
- SUGGESTIONS constant defined inline

**After:**
- Move `SUGGESTIONS` to `lib/rag/suggestions.ts`
- Component imports from module

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Hooks | `useCamelCase.ts` | `useDashboard.ts` |
| Components | `PascalCase.tsx` | `DashboardHeader.tsx` |
| Service modules | `camelCase.ts` | `transformer.ts` |
| Types | `camelCase.ts` | `analyzer.ts` |
| Constants | `UPPER_SNAKE.ts` or `camelCase.ts` | `rubric.ts` |

## Import Patterns

```typescript
// Prefer absolute imports with @
import { useDashboard } from '@/hooks/dashboard'
import { DashboardHeader } from '@/components/dashboard'

// Group imports
// 1. React/Next.js
import React, { useState, useEffect } from 'react'
// 2. Third-party
import { createClient } from '@/lib/supabase/client'
// 3. Internal modules
import { Call } from '@/lib/ctm'
// 4. Components
import Button from '@/components/ui/Button'
```

## Testing Considerations

1. **Hooks** - Can be tested in isolation with renderHook
2. **Components** - Test rendered output
3. **Service modules** - Pure functions can be unit tested
4. **API routes** - Integration test with Supertest

## Build Verification

Always run after refactoring:
```bash
npm run build
```

If build fails:
1. Check import paths
2. Verify re-exports in index files
3. Ensure types are properly exported

## Common Issues

### Circular Dependencies
Avoid:
```typescript
// a.ts
import { b } from './b'
// b.ts  
import { a } from './a'
```

### Type Import Issues
Use `import type` for type-only imports:
```typescript
import type { Call } from '@/lib/ctm'
import { useDashboard } from '@/hooks/dashboard' // actual value
```

### Missing Index Exports
When adding new module files, update index.ts:
```typescript
// lib/ai/index.ts
export * from './types'
export * from './rubric'
export * from './helpers'
export * from './analyzer'
```

## Remaining Refactoring Tasks

As of last update:

| File | Lines | Status | Priority |
|------|-------|--------|----------|
| `app/dashboard/settings/page.tsx` | 937 | Needs refactor | High |
| `app/dashboard/calls/[id]/page.tsx` | 313 | Could be improved | Medium |
| `components/call-detail/NotesDispositionPanel.tsx` | 198 | UI component, acceptable | Low |

## Checklist

Before completing refactoring:

- [ ] Build passes (`npm run build`)
- [ ] No TypeScript errors
- [ ] Imports use correct paths
- [ ] Re-exports in index files
- [ ] No duplicate code
- [ ] Logic moved to appropriate layer (hook/service/component)
- [ ] Types in dedicated type files
- [ ] Constants in dedicated constant files
