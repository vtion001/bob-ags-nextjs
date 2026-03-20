# BOB (Business Operations Butler) Project Structure

## Overview

BOB is a call analysis dashboard built with Next.js that provides:
- CTM API integration for call tracking
- Supabase caching for calls
- AssemblyAI/OpenRouter for call transcription and analysis
- RAG system for agent assistance
- Real-time monitoring capabilities

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + pgvector for RAG)
- **AI Services**: AssemblyAI (transcription), OpenRouter (analysis)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks + Context

## Directory Structure

```
bob-ags/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── analyze/             # AI analysis endpoint
│   │   ├── auth/                # Authentication (login, logout, session)
│   │   ├── calls/               # Calls listing and sync
│   │   ├── ctm/                 # CTM API proxies
│   │   │   ├── accounts/
│   │   │   ├── active-calls/
│   │   │   ├── agents/          # CTM agents + groups
│   │   │   ├── calls/           # Call detail, transcript, audio, analyze
│   │   │   ├── dashboard/
│   │   │   ├── live-calls/
│   │   │   ├── monitor/
│   │   │   ├── numbers/         # Phone number management
│   │   │   ├── receiving_numbers/
│   │   │   ├── schedules/
│   │   │   ├── sources/
│   │   │   └── voice_menus/
│   │   ├── settings/            # User settings
│   │   └── users/               # User management, permissions
│   ├── auth/                     # Auth callback page
│   ├── dashboard/               # Main dashboard pages
│   │   ├── agents/              # Agent profiles page
│   │   ├── calls/[id]/         # Call detail page
│   │   ├── history/            # Call history page
│   │   ├── layout.tsx           # Dashboard layout with navbar
│   │   ├── monitor/             # Live monitoring page
│   │   ├── page.tsx             # Dashboard home
│   │   └── settings/            # Settings page (936 lines - needs refactor)
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing/login page
│   └── auth/callback/           # OAuth callback
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── ... (30+ more shadcn components)
│   │
│   ├── dashboard/               # Dashboard-specific components
│   │   ├── DashboardHeader.tsx # Filters, sync, analyze buttons
│   │   ├── DashboardStats.tsx   # Stats cards
│   │   └── DashboardRecentCalls.tsx
│   │
│   ├── history/                 # History page components
│   │   ├── HistoryFilters.tsx   # Search/filter controls
│   │   └── HistoryStats.tsx    # Results summary
│   │
│   ├── agents/                  # Agents page components
│   │   ├── AgentForm.tsx        # Add/edit agent form
│   │   ├── AgentCard.tsx        # Agent display card
│   │   └── CTMImportModal.tsx   # Import from CTM
│   │
│   ├── monitor/                # Live monitoring components
│   │   ├── TranscriptPanel.tsx  # Real-time transcript
│   │   ├── LiveInsightsPanel.tsx # Live QA insights
│   │   ├── QAChecklist.tsx     # QA criteria checklist
│   │   ├── CallDetailsCard.tsx  # Call info display
│   │   ├── MonitorHeader.tsx    # Header with sentiment/score
│   │   ├── ScoreProgress.tsx    # Score progress bar
│   │   └── ActiveCallsList.tsx  # Sidebar with active calls
│   │
│   ├── call-detail/             # Call detail page components
│   │   ├── AudioPlayerCard.tsx
│   │   ├── AIAnalysisCard.tsx
│   │   ├── QAAnalysisCard.tsx
│   │   ├── TranscriptCard.tsx
│   │   ├── CallScoreCard.tsx
│   │   ├── CallerInfoCard.tsx
│   │   ├── ActionButtonsCard.tsx
│   │   ├── NotesDispositionPanel.tsx
│   │   └── AgentAssistantPanel.tsx # AI agent assistant
│   │
│   ├── CallTable.tsx            # Shared call table
│   ├── StatsCard.tsx            # Stats display card
│   ├── ScoreCircle.tsx          # Score visualization
│   ├── Navbar.tsx              # Navigation bar
│   ├── Analytics.tsx           # Analytics component
│   └── EmptyState.tsx           # Empty state component
│
├── hooks/                        # Custom React hooks
│   ├── dashboard/
│   │   ├── useDashboard.ts      # Dashboard state management
│   │   ├── useCallHistory.ts    # Call history state
│   │   └── useAgentProfiles.ts # Agent profiles state
│   │
│   ├── monitor/
│   │   └── useLiveAnalysis.ts   # AssemblyAI realtime state
│   │
│   ├── use-mobile.ts            # Mobile detection
│   └── index.ts                # Hook exports
│
├── lib/                         # Core libraries
│   ├── ai/                     # AI analysis module
│   │   ├── types.ts            # AnalysisResult, CriterionResult interfaces
│   │   ├── rubric.ts          # RUBRIC_CRITERIA constant
│   │   ├── helpers.ts         # Extraction, scoring, formatting helpers
│   │   └── analyzer.ts        # analyzeTranscript function
│   │
│   ├── rag/                    # RAG knowledge base
│   │   ├── types.ts           # KnowledgeEntry interface
│   │   ├── knowledge.ts       # KNOWLEDGE_BASE, getRelevantKnowledge
│   │   └── suggestions.ts     # getAgentSuggestions, SUGGESTIONS
│   │
│   ├── realtime/              # AssemblyAI realtime module
│   │   ├── types.ts           # RealtimeTranscript, LiveCallState
│   │   ├── constants.ts       # RUBRIC_KEYWORDS, patterns
│   │   ├── analyzer.ts        # Text analysis functions
│   │   ├── assemblyai-realtime.ts # AssemblyAIRealtime class
│   │   └── index.ts
│   │
│   ├── calls/                 # Calls caching module
│   │   ├── transformer.ts     # DB/API transformations
│   │   ├── fetcher.ts        # CTM fetch logic
│   │   ├── cache.ts          # Supabase caching
│   │   └── index.ts
│   │
│   ├── ctm/                  # CTM API client
│   │   ├── client.ts         # CTMClient class
│   │   ├── transformer.ts    # CTM data transformations
│   │   ├── services/         # CTM service modules
│   │   │   ├── accounts.ts
│   │   │   ├── agents.ts
│   │   │   ├── calls.ts
│   │   │   ├── numbers.ts
│   │   │   ├── receivingNumbers.ts
│   │   │   ├── schedules.ts
│   │   │   ├── sources.ts
│   │   │   └── voiceMenus.ts
│   │   └── index.ts
│   │
│   ├── supabase/             # Supabase clients
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── middleware.ts     # Auth middleware
│   │
│   ├── types/                # TypeScript types
│   │   ├── ctm.ts            # CTM API types
│   │   └── index.ts         # App types (Call, Agent, etc.)
│   │
│   ├── utils.ts             # General utilities
│   ├── utils/
│   │   ├── formatters.ts     # Date, number formatters
│   │   ├── helpers.ts        # General helpers
│   │   └── index.ts
│   │
│   ├── mockData.ts           # Mock data for development
│   └── ai.ts                 # Re-exports from ai/ module
│
├── notes/                      # Project documentation
│   └── bob/
│       ├── PROJECT_STRUCTURE.md
│       └── REFACTORING_GUIDE.md
│
├── scripts/                    # Utility scripts
│   └── create-superadmin.ts
│
├── supabase/                  # Supabase Edge Functions
│   └── functions/
│       └── on-auth-signup/    # Auto-create user profile
│
├── public/                    # Static assets
├── proxy.ts                   # API proxy configuration
├── tailwind.config.ts
└── package.json
```

## Module Architecture

### AI Module (`lib/ai/`)

Handles call analysis using OpenRouter (Claude).

**Files:**
- `types.ts` - Interfaces for analysis results
- `rubric.ts` - 25 criteria for call quality scoring
- `helpers.ts` - Text extraction, scoring, formatting functions
- `analyzer.ts` - Main analysis orchestration

**Key Functions:**
```typescript
analyzeTranscript(transcript: string, phone: string, client?: string): Promise<Analysis>
evaluateRubric(lower: string, aiResults: Record<string, {pass, details}>): CriterionResult[]
calculateScore(breakdown: RubricBreakdown, ztpFailures: number, autoFailed: boolean): number
```

### RAG Module (`lib/rag/`)

Provides knowledge base for agent assistance.

**Files:**
- `types.ts` - KnowledgeEntry interface
- `knowledge.ts` - KNOWLEDGE_BASE + relevance filtering
- `suggestions.ts` - Agent coaching suggestions

**Key Functions:**
```typescript
getRelevantKnowledge(context: {insurance?, state?, substance?, ...}): KnowledgeEntry[]
getAgentSuggestions(missingCriteria: string[], currentContext): AgentSuggestion[]
```

### Realtime Module (`lib/realtime/`)

AssemblyAI WebSocket integration for live call monitoring.

**Files:**
- `types.ts` - State interfaces
- `constants.ts` - Keywords and patterns
- `analyzer.ts` - Real-time text analysis
- `assemblyai-realtime.ts` - Main WebSocket class

**Key Classes:**
```typescript
class AssemblyAIRealtime {
  connect(callId?: string): Promise<void>
  stop(): void
  getState(): Partial<LiveCallState>
}
```

### Calls Module (`lib/calls/`)

Supabase caching layer for CTM calls.

**Files:**
- `transformer.ts` - DB row <-> API response transforms
- `fetcher.ts` - CTM API fetch logic
- `cache.ts` - Supabase read/write operations

**Key Functions:**
```typescript
fetchCallsFromCTM(options: FetchCallsOptions): Promise<CallAPIResponse[]>
getCachedCalls(supabase, options): Promise<{calls, cacheAge} | null>
storeCallsToCache(supabase, userId, calls): Promise<void>
```

## Hooks Architecture

### `useDashboard`

Manages dashboard state including:
- User authentication and permissions
- CTM calls fetching with filters
- Auto-refresh mechanism
- Analysis triggering

```typescript
const {
  isLoading, stats, recentCalls, timeRange, selectedGroup,
  handleGroupChange, handleSyncNow, handleAnalyze, ...
} = useDashboard()
```

### `useCallHistory`

Manages call history with:
- Client-side filtering (search, score, date range)
- Agent/group filtering
- CSV export
- Incremental sync

### `useAgentProfiles`

CRUD operations for agent profiles:
- Fetch from Supabase
- Import from CTM
- Add/edit/delete agents

### `useLiveAnalysis`

AssemblyAI realtime state:
- Connection management
- Transcript updates
- Live insights generation
- Sentiment tracking

## API Routes

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Calls
- `GET /api/calls` - List calls (with Supabase caching)
- `POST /api/calls` - Sync calls from CTM

### CTM Proxy Routes
All routes under `/api/ctm/*` proxy to CTM API:
- `/api/ctm/agents` - List agents
- `/api/ctm/live-calls` - Live call data
- `/api/ctm/calls/[id]` - Call detail
- `/api/ctm/calls/[id]/transcript` - Get transcript
- `/api/ctm/calls/analyze` - Trigger analysis
- etc.

### Analysis
- `POST /api/analyze` - Analyze transcript with AI

## Database Schema (Supabase)

### Tables

**calls** - Cached call data
```
id, ctm_call_id, user_id, phone, direction, duration, status,
timestamp, caller_number, tracking_number, agent_id, agent_name,
recording_url, transcript, score, sentiment, summary, tags,
disposition, synced_at, rubric_results, rubric_breakdown
```

**agent_profiles** - User-managed agent list
```
id, name, agent_id, email, phone, notes, created_at
```

**users** - Extended user profiles
```
id, email, role, permissions, ctm_agent_id, ctm_user_group_id
```

**calls_sync_log** - Sync tracking
```
id, user_id, last_sync_at, calls_synced, status
```

## Environment Variables

```bash
# CTM API
CTM_ACCESS_KEY=
CTM_SECRET_KEY=
CTM_ACCOUNT_ID=

# AssemblyAI
NEXT_PUBLIC_ASSEMBLYAI_API_KEY=

# OpenRouter (AI Analysis)
OPENROUTER_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

## Development Workflow

1. **Authentication Flow:**
   - User logs in via CTM OAuth
   - Session stored in Supabase
   - Role/permissions loaded from `users` table

2. **Call Caching Flow:**
   - Initial load: Fetch from CTM → Store in Supabase → Return to client
   - Subsequent loads: Check Supabase cache → If stale, sync new from CTM
   - Incremental sync: Only fetch calls newer than last sync

3. **Analysis Flow:**
   - User triggers analysis on call
   - Transcript sent to AssemblyAI (if not already available)
   - Transcript + call data sent to OpenRouter for scoring
   - Results stored in Supabase and returned

4. **Live Monitoring Flow:**
   - User starts monitoring session
   - Browser connects to AssemblyAI WebSocket
   - Real-time audio streamed to AssemblyAI
   - Transcript + insights displayed live
   - On disconnect, session can be saved

## Refactoring Guidelines

See [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) for detailed refactoring patterns and best practices.

### Key Principles

1. **Single Responsibility** - Each module/file does one thing
2. **Hook-based State** - Use custom hooks for complex state
3. **Component Modularity** - Split large page components
4. **Type Safety** - Keep types in dedicated files
5. **Service Layer** - Extract API logic to lib/ modules

### Common Refactoring Patterns

**Page → Hook + Components:**
```typescript
// Before: 500 line page component
// After:
hooks/dashboard/useDashboard.ts    // State + logic
components/dashboard/DashboardHeader.tsx
components/dashboard/DashboardStats.tsx
pages/dashboard/page.tsx           // Thin page component
```

**Monolith Module → Modular:**
```typescript
// Before: lib/ai.ts (348 lines)
// After:
lib/ai/types.ts       // Interfaces
lib/ai/rubric.ts      // Constants
lib/ai/helpers.ts      // Pure functions
lib/ai/analyzer.ts    // Main logic
lib/ai.ts             // Re-exports
```
