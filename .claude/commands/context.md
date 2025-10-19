# /context - Session Compass Command

**Purpose**: Display comprehensive session overview with development context

**Slash Command**: `/context [--brief|--json|--watch]`

---

## What It Does

The `/context` command provides a **real-time development overview** answering:

1. **Where am I?** - Project, branch, git status, last session
2. **What am I working on?** - Active feature, phases, progress
3. **What's next?** - Prioritized tasks (high/medium/low)
4. **Can I parallelize?** - What tasks can run simultaneously
5. **Do I have context?** - Context budget availability
6. **Three-tier status** - Backend/database/frontend progress
7. **Framework health** - Quick stats and recommendations

---

## Usage

### Full Overview (Default)
```bash
/context
```

Shows comprehensive session overview:
- Project context (name, branch, git status, last session)
- Main plan summary (active feature, phases with progress/ETA)
- Task prioritization (high/medium/low with dependencies)
- Parallel execution opportunities
- Context budget status (tokens available/allocated/remaining)
- Three-tier architecture status (backend/database/frontend)
- Quick stats (framework health, active agents, todos, build/test status)

### Brief Summary
```bash
/context --brief
```

Shows condensed overview:
- Quick status (health, agents, tasks, context)
- Next high-priority task only

### JSON Output
```bash
/context --json
```

Returns machine-readable JSON for programmatic use:
```json
{
  "projectContext": {
    "projectName": "VERSATIL SDLC FW",
    "branch": "main",
    "gitStatus": { "clean": false, "modified": 3, "untracked": 2 },
    "lastSession": { "when": "21m ago", "timeSaved": 104, "impactScore": 7.1 }
  },
  "mainPlan": {
    "activeFeature": "Session Compass Implementation",
    "status": "in_progress",
    "phases": [ ... ],
    "totalETA": "4 hours"
  },
  "taskPriority": {
    "high": [ ... ],
    "medium": [ ... ],
    "low": [ ... ]
  },
  "contextBudget": {
    "available": 200000,
    "remaining": 140000,
    "status": "healthy"
  },
  "threeTierStatus": { ... }
}
```

### Watch Mode
```bash
/context --watch
```

Continuous monitoring - refresh every 60 seconds (press Ctrl+C to stop)

---

## When to Use

**Session Opening**:
- When you open Cursor/Claude tab
- Shows where you left off last session
- Prioritizes what to work on next

**Mid-Development**:
- Check context budget before starting new task
- Identify parallel execution opportunities
- Review three-tier status

**Task Planning**:
- See what's high priority
- Check task dependencies
- Estimate context requirements

**Before Committing**:
- Verify git status
- Check framework health
- Ensure quality gates passed

---

## Integration with VERSATIL Pulse

`/context` complements VERSATIL Pulse session tracking:

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `/context` | **Current state** - Where am I now? What's next? | Session opening, task planning |
| `session:summary` | **Historical data** - What did I accomplish? Time saved? | After session, weekly review |

**Together**: Complete visibility into framework usage (past + present)

---

## Cursor Hooks Integration

`/context` can auto-run on Cursor workspace open:

**Configuration**: `~/.cursor/hooks.json`
```json
{
  "version": 1,
  "hooks": {
    "afterWorkspaceOpen": [
      {
        "command": "npm run session:compass:brief",
        "description": "Show session overview on project open"
      }
    ]
  }
}
```

**Result**: Every time you open Cursor, you see:
- Where you left off
- What to work on next
- Framework health status

---

## Output Format

### Text Format (Default)

```
╔═══════════════════════════════════════════════════════════╗
║         🧭 VERSATIL Session Compass                       ║
╚═══════════════════════════════════════════════════════════╝

📁 Project: VERSATIL SDLC FW
🌿 Branch: main
📊 Git: ⚠️ 3 modified, 2 untracked
⏰ Last Session: 21m ago (saved 104 min, score: 7.1/10)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Main Plan: Session Compass Implementation
Status: 🔄 in_progress
Agents: Sarah-PM, Marcus-Backend
Total ETA: 4 hours

Phases:
  ✅ Phase 1: Session Opening Hook
     ██████████████████ 60% │ ETA: 1 hour
  ⏸️ Phase 2: Three-Tier Status Tracker
     ░░░░░░░░░░░░░░░░░░ 0% │ ETA: 3 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Task Prioritization:

🔴 High Priority (2):
  • Create /context command for manual session overview
    Marcus-Backend │ ETA: 20 minutes │ ✓ Can parallel
  • Create session-compass.cjs CLI script
    Sarah-PM │ ETA: 30 minutes │ Depends on: COMPASS-2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Parallel Execution Opportunities:

  ✓ Run tasks COMPASS-2, COMPASS-3 in parallel
    Agents: Marcus-Backend, Sarah-PM │ Time Saved: 20 minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Context Budget:

  🟢 HEALTHY - Plenty of context available for all tasks
  Available: 200,000 tokens
  Remaining: 140,000 tokens

  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 30% used

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️  Three-Tier Architecture Status:

  💻 Backend (Marcus):
     ██████████████████ 60% (3/5)
     Next: Create SessionCompass CLI script
     💡 Complete SessionCompass class first

  🗄️  Database (Dana):
     ░░░░░░░░░░░░░░░░░░ 0% - Not started
     💡 No database changes needed for Session Compass

  🎨 Frontend (James):
     ░░░░░░░░░░░░░░░░░░ 0% (0/1)
     Next: Create Cursor status bar integration
     💡 Wait for Phase 2 (Cursor Status Bar Extension)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Quick Stats:

  Framework Health: 🟢 87%
  Active Agents:    2
  Pending Todos:    9
  Git Status:       uncommitted changes
  Build Status:     ✅ passing
  Test Status:      ✅ passing
```

### Brief Format (--brief)

```
╔═══════════════════════════════════════════════════════════╗
║         🧭 VERSATIL Session Compass                       ║
╚═══════════════════════════════════════════════════════════╝

��� Project: VERSATIL SDLC FW
🌿 Branch: main
📊 Git: ⚠️ 3 modified, 2 untracked

Quick Status:
  Framework Health: 🟢 87%
  Active Agents: 2
  Pending Tasks: 9
  Context Budget: 🟢 healthy

⚡ Next Task:
  Create /context command for manual session overview
  Agent: Marcus-Backend │ ETA: 20 minutes
```

---

## Data Sources

Session Compass aggregates data from **7 systems**:

1. **SessionManager** - Last session metrics, time saved, impact score
2. **TaskPlanManager** - Active feature, phases, task dependencies
3. **ContextSentinel** - Real-time context monitoring, token usage
4. **ThreeTierStatusTracker** - Backend/database/frontend progress
5. **UsageLogger** - Agent activations, productivity gains
6. **DiagramGenerator** - Task pipeline visualization
7. **Git** - Branch, status, ahead/behind tracking

**Result**: Single comprehensive view of entire development context

---

## npm Shortcuts

```bash
npm run session:compass         # Full overview
npm run session:compass:brief   # Brief summary
npm run session:compass:watch   # Watch mode (refresh every 60s)
```

---

## Implementation

**CLI Script**: `scripts/session-compass.cjs` (479 lines)
**Core Class**: `src/tracking/session-compass.ts` (580+ lines)
**Command Definition**: `.claude/commands/context.md` (this file)

**Part of**: VERSATIL Pulse System (Phase 2: Session Opening Hook)

---

## Troubleshooting

**"Using mock data"**: Run `npm run build` to compile TypeScript files for real-time data

**No last session**: First time using VERSATIL Pulse - last session will appear after next session

**Context budget warning**: Defer low-priority tasks or compact context (automatic at 85%)

**Git status dirty**: Commit or stash changes before starting new tasks

---

## See Also

- **VERSATIL Pulse Guide**: `docs/guides/usage-tracking-integration.md`
- **Session Compass Implementation**: `src/tracking/session-compass.ts`
- **CLI Script**: `scripts/session-compass.cjs`
- **Session Summaries**: `npm run session:summary` (historical data)
- **Context Stats**: `npm run context:stats` (context management)

---

**Version**: 6.4.1
**Part of**: Session Compass (Phase 1)
**Status**: ✅ Implemented
**Last Updated**: 2025-10-19
