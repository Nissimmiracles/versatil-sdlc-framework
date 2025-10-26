---
name: opera-orchestration
description: Detect OPERA phases and coordinate multi-agent workflows. This skill should be used for workflow coordination, phase transitions, determining which agents to use, or understanding the current development stage.
allowed-tools:
  - Bash
  - Read
  - Task
---

# OPERA Orchestration Skill

**Auto-invoked during**: Workflow coordination, phase transitions, agent selection, `/work` and `/delegate` commands

Automatic OPERA phase detection and multi-agent coordination.

## What This Skill Provides

OPERA phase detection for the 6-phase methodology:
**Observe → Plan → Execute → Refine → Codify → Archive**

**Result**: Right agents at the right time, proper workflow sequencing

## When to Use

Use this skill when you need to:

- **Detect current phase** - Understand where you are in OPERA
- **Select agents** - Which agents fit the current phase
- **Coordinate workflows** - Sequence multi-agent tasks properly
- **Phase transitions** - Move from Plan → Execute → Refine

## Quick Start

### Detect Current Phase

```bash
! npx tsx .claude/skills/opera-orchestration/scripts/execute-phase-detection.ts \
  --context "User requested feature planning" \
  --command "/plan"
```

**Returns**: Current phase + metadata (agents, duration, outputs)

---

## OPERA Phases (Quick Reference)

### 1. OBSERVE (10-20% of project)
**Purpose**: Gather context, understand requirements
**Agents**: Alex-BA, Sarah-PM, Oliver-MCP
**Outputs**: Requirements analysis, user stories

### 2. PLAN (15-25% of project)
**Purpose**: Design solution, estimate effort
**Agents**: Sarah-PM, Alex-BA, Marcus-Backend, James-Frontend
**Outputs**: Architecture, todos, estimates
**Skills**: `compounding-engineering`

### 3. EXECUTE (50-60% of project)
**Purpose**: Implement solution, write code
**Agents**: Marcus-Backend, James-Frontend, Dana-Database, Dr.AI-ML
**Outputs**: Code, migrations, features

### 4. REFINE (10-20% of project)
**Purpose**: Test, review, validate, fix
**Agents**: Maria-QA, Victor-Verifier, Sarah-PM
**Outputs**: Test results, bug fixes
**Skills**: `quality-gates`

### 5. CODIFY (5-10% of project)
**Purpose**: Store learnings, update patterns
**Agents**: Feedback-Codifier, Sarah-PM
**Outputs**: RAG memories, updated templates
**Skills**: `rag-query`, `session-codify`

### 6. ARCHIVE (5-10% of project)
**Purpose**: Document, deploy, close out
**Agents**: Sarah-PM, Oliver-MCP
**Outputs**: Deployment logs, documentation

---

## Command → Phase Mapping

| Command | Phase | Primary Agents |
|---------|-------|----------------|
| `/assess` | OBSERVE | Alex-BA, Sarah-PM |
| `/plan` | PLAN | Sarah-PM, compounding-engineering |
| `/work` | EXECUTE | Marcus/James/Dana (based on task) |
| `/delegate` | EXECUTE | Sarah-PM + domain agents |
| `/review` | REFINE | Maria-QA, quality-gates |
| `/learn` | CODIFY | Feedback-Codifier, rag-query |

---

## Phase Detection Return Format

```json
{
  "phase": "PLAN",
  "metadata": {
    "description": "Design solution, estimate effort, create roadmap",
    "agents": ["Sarah-PM", "Alex-BA", "Marcus-Backend", "James-Frontend"],
    "next_phase": "EXECUTE",
    "typical_duration": "15-25% of project",
    "outputs": ["Architecture design", "Todo files", "Effort estimates"]
  },
  "context_analyzed": "User requested feature planning",
  "command_analyzed": "/plan",
  "confidence": "high"
}
```

---

## Integration with Commands

**`/work` command**: Auto-detects EXECUTE phase
```bash
/work "Implement user authentication"
# Phase detection → EXECUTE
# Routes to Marcus-Backend + Maria-QA
```

**`/delegate` command**: Multi-agent coordination
```bash
/delegate "todos/001-*.md"
# Analyzes todo assignees
# Coordinates parallel execution
# Manages handoffs
```

---

## Critical Requirements

1. **Sequential phases** - Don't skip (OBSERVE → PLAN → EXECUTE, not OBSERVE → EXECUTE)
2. **Phase-appropriate agents** - Use agents specialized for current phase
3. **Handoff contracts** - Validate transitions between agents
4. **Duration percentages** - Indicative, not strict (adjust per project)

---

## Common Use Cases

**Determine what to do next**:
```bash
# Current: Just finished planning
# Phase detection → Next is EXECUTE
# Suggests: Use /work or /delegate
```

**Select right agents**:
```bash
# Phase: REFINE
# Agents: Maria-QA (testing), Victor-Verifier (validation)
# Not: Marcus-Backend (wrong phase)
```

**Coordinate multi-agent work**:
```bash
# Phase: EXECUTE
# Parallel: Marcus-Backend (API) + James-Frontend (UI)
# Sequential: Both → Maria-QA (testing)
```

---

## Performance

- **Phase detection**: ~50-100ms
- **Metadata lookup**: <10ms
- **Total overhead**: Negligible (<100ms)

---

## Detailed Documentation

For complete phase specifications and agent routing:

- **Phase Definitions**: See `references/opera-phases.md`
- **Agent Routing**: See `references/agent-selection.md`
- **Workflow Patterns**: See `references/coordination-patterns.md`

---

## Related Skills

- `compounding-engineering` - Auto-invoked during PLAN phase
- `quality-gates` - Auto-invoked during REFINE phase
- `rag-query` - Auto-invoked during CODIFY phase

---

## Quick Reference

**Phases**: OBSERVE → PLAN → EXECUTE → REFINE → CODIFY → ARCHIVE

**Key Insight**: Right phase = Right agents = Right outcomes
