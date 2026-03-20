# BOB Project - Dev Orchestration Guide

## Overview

BOB (Business Operations Butler) is a Next.js/TypeScript call analysis dashboard. This guide covers how to use the dev-orchestrator for maintaining and improving this project.

## Project Structure

```
bob-ags/
├── app/                    # Next.js pages (App Router)
├── components/             # React components (modular)
├── hooks/                 # Custom React hooks
├── lib/                   # Core libraries (ai, rag, realtime, calls, ctm, etc.)
├── notes/bob/            # Project documentation
└── supabase/              # Supabase Edge Functions
```

## Refactoring Tasks

### Identifying Monolith Files

```bash
# Find files over 300 lines (potential monoliths)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | xargs wc -l | sort -rn | head -20
```

### Current Refactoring Status

| File | Lines | Status | Priority |
|------|-------|--------|----------|
| `app/dashboard/settings/page.tsx` | 937 | Needs refactor | High |
| `app/dashboard/calls/[id]/page.tsx` | 313 | Partially done | Medium |
| `components/ui/sidebar.tsx` | 726 | shadcn/ui - OK | Low |
| `lib/realtime/assemblyai-realtime.ts` | 390 | Refactored | Done |
| `app/dashboard/monitor/page.tsx` | 384 | Refactored | Done |
| `app/dashboard/page.tsx` | 501 | Refactored | Done |
| `app/dashboard/history/page.tsx` | 371 | Refactored | Done |
| `app/dashboard/agents/page.tsx` | 395 | Refactored | Done |

## Running Refactoring

### Manual Refactoring Workflow

1. **Identify**: Find monolith files over 300 lines
2. **Analyze**: Read the file to understand its responsibilities
3. **Plan**: Identify logical splits (hooks, components, services)
4. **Execute**: Create new modular structure
5. **Verify**: Run `npm run build` to ensure no breakage

### Quick Refactoring Commands

```bash
# Navigate to project
cd /Users/archerterminez/Desktop/REPOSITORY/bob-ags

# Check for TypeScript errors
npm run build

# Check for lint errors
npm run lint  # or ruff check

# Format code
npm run format  # or ruff format
```

## Using Dev Orchestrator for BOB

The dev-orchestrator can be used to run agents on the BOB workspace:

```bash
# From bob-ags directory
cd /Users/archerterminez/Desktop/REPOSITORY/bob-ags

# Run website-analyst agent on BOB documentation
python3 /Users/archerterminez/agents/dev-orchestrator/dev_orchestrator.py run \
  --agent website-analyst \
  --agent-args https://github.com/vtion001/bob-ags \
  --workspace /Users/archerterminez/Desktop/REPOSITORY/bob-ags
```

## Adding New Agents to BOB

### For Python Agents

1. Add agent path to `AGENT_PATHS` in orchestrator.py
2. Agent receives workspace as working directory
3. Agent can be run via `dev_orchestrator.py run --agent <name>`

### For TypeScript/Next.js Tasks

Since BOB is TypeScript-based, create a task script:

```typescript
// scripts/refactor-task.ts
import { execSync } from 'child_process'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

function findLargeFiles(dir: string, maxLines: number = 300): string[] {
  const largeFiles: string[] = []
  
  function walk(currentDir: string) {
    const entries = readdirSync(currentDir)
    for (const entry of entries) {
      const fullPath = join(currentDir, entry)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        walk(fullPath)
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        if (stat.size > maxLines * 50) { // rough estimate
          largeFiles.push(fullPath)
        }
      }
    }
  }
  
  walk(dir)
  return largeFiles
}

// Example usage
const files = findLargeFiles('/path/to/bob-ags')
console.log('Large files:', files)
```

## Build & Deployment

### Local Development

```bash
cd /Users/archerterminez/Desktop/REPOSITORY/bob-ags

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck  # or tsc --noEmit
```

### Deployment

BOB deploys to Vercel (or similar Next.js hosting):

```bash
# Build and deploy
npm run build
# Push to main branch - auto-deploys
```

## Common Issues

### Missing Imports After Refactoring

After splitting a monolith file, ensure:
1. All exports are in the original location (or re-exported)
2. Import paths are updated
3. Build passes (`npm run build`)

### Type Errors

```bash
# Run TypeScript check
npx tsc --noEmit

# Fix common issues:
# - Missing type annotations
# - Incorrect import paths (@/ should resolve correctly)
# - Circular dependencies
```

## Documentation

See also:
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detailed project architecture
- [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) - Refactoring patterns and checklists

## Agent Integration

To integrate agents with BOB:

1. **Workspace Setup**: Agents run with BOB as working directory
2. **Agent Types**: 
   - Python agents (website-analyst, data-analyst, etc.) - can analyze BOB docs/code
   - TypeScript tasks - should be added as npm scripts or Next.js API routes
3. **Running Agents**:
   ```bash
   python3 /Users/archerterminez/agents/dev-orchestrator/dev_orchestrator.py \
     run --agent <agent-name> --workspace /Users/archerterminez/Desktop/REPOSITORY/bob-ags
   ```

## Task Checklist

When refactoring a monolith file:

- [ ] File identified as over 300 lines with multiple responsibilities
- [ ] Logical divisions identified (state, effects, helpers, components)
- [ ] New file structure designed
- [ ] Types moved to `lib/types/` or appropriate module
- [ ] Constants moved to module or dedicated file
- [ ] Pure functions moved to helpers
- [ ] Main logic in dedicated module/file
- [ ] Re-exports set up in index files
- [ ] Build passes without errors
- [ ] No TypeScript errors
- [ ] Documentation updated if needed
