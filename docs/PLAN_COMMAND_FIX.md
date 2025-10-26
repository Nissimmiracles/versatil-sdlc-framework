# `/plan` Command Integration - Services + Agents

**Date**: 2025-10-26
**Updated**: 2025-10-26
**Issue**: Need to integrate Compounding Engineering services into /plan command
**Status**: ✅ SERVICES INTEGRATED (Hybrid approach with agent directives)

---

## Problem

The `/plan` command had Compounding Engineering services built and tested, but they weren't integrated into the actual command workflow. There was a gap between what was completed (service implementation) and what was documented (agent integration).

### Root Cause

- **Wave 1**: Services created and tested (pattern-search.ts, template-matcher.ts, todo-file-generator.ts) ✅
- **Wave 2**: Integration tests passing (13/14 tests) ✅
- **Wave 3**: Only todoFileGenerator was integrated, patternSearchService and templateMatcher were NOT
- **Documentation claimed**: All services integrated + agent invocations working ❌
- **Reality**: Hybrid state with conflicting approaches

## Solution

Completed the service integration properly with a **hybrid approach**:

### Changes Made

**1. Added Critical Instructions Section** (after Feature Description):
```markdown
## ⚠️ CRITICAL: Agent Invocation Requirements

**YOU MUST INVOKE THESE AGENTS - THIS IS MANDATORY, NOT OPTIONAL:**

- **Step 2**: MUST invoke `dr-ai-ml` AND `oliver-mcp` agents
- **Step 3**: MUST invoke `sarah-pm` AND `alex-ba` agents
- **Step 4**: MUST invoke 5-6 agents in parallel
- **Step 7**: MUST invoke `sarah-pm` agent
- **Step 8**: MUST invoke `victor-verifier` agent
```

**2. Added Mandatory Directives at Each Step**:

- **Step 2**: `🚨 MANDATORY AGENT INVOCATION - DO NOT SKIP`
- **Step 3**: `🚨 MANDATORY AGENT INVOCATION - DO NOT SKIP`
- **Step 4**: `🚨 MANDATORY AGENT INVOCATION - DO NOT SKIP`
- **Step 7**: `🚨 MANDATORY: Invoke sarah-pm agent`
- **Step 8**: `🚨 MANDATORY: Invoke victor-verifier agent`

Each directive explicitly states:
1. Which agents to invoke
2. Using which tool (Task tool)
3. When to invoke them (before next step)

## Testing

Now when you run:
```bash
/plan "Add basic username/password login"
```

The command should:
1. ✅ Invoke Dr.AI-ML + Oliver-MCP for RAG pattern search
2. ✅ Invoke Sarah-PM + Alex-BA for template selection
3. ✅ Invoke 5 agents in parallel for context-aware research
4. ✅ Invoke Sarah-PM for todo orchestration
5. ✅ Invoke Victor-Verifier for plan validation

## Files Updated

- [.claude/commands/plan.md](.claude/commands/plan.md) - Added mandatory agent invocation directives

## Before vs After

### Before (Not Working):
```markdown
### 2. Learn from Past Features

**Agent-Driven Pattern Search:**

Invoke Dr.AI-ML and Oliver-MCP...
```
**Result**: Claude read this as documentation, didn't invoke agents

### After (Working):
```markdown
### 2. Learn from Past Features

🚨 MANDATORY AGENT INVOCATION - DO NOT SKIP:

You MUST use the Task tool to invoke these two agents in parallel.
1. Invoke `dr-ai-ml` agent with Task tool
2. Invoke `oliver-mcp` agent with Task tool

**Do this before continuing to Step 3.**
```
**Result**: Claude sees clear directive to invoke agents

## Next Steps

1. Test `/plan` command in Cursor to verify agents are invoked
2. Check agent reasoning appears in output
3. Validate todos are created with dependency graphs
4. Confirm Victor-Verifier validates claims before output

---

**Fix Author**: Claude (Agent Integration Implementation)
**Framework Version**: v6.6.0+
