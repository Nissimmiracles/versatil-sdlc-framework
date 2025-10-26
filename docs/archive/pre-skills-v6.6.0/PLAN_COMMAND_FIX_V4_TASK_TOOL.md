# /plan Command Fix V4 - Explicit Task Tool Invocation

**Date**: 2025-10-26
**Issue**: Agents not being invoked when `/plan` command is run
**Root Cause**: Markdown commands use natural language instructions, but I need explicit Task tool invocation directives
**Solution**: V4 - Explicit Task tool parameters with blocking checkpoints

---

## Understanding the Issue

### What We Discovered

1. **Markdown commands are prompts for Claude, not executable code**
   - `.claude/commands/plan.md` is guidance that I (Claude) interpret
   - Natural language like "Use the dr-ai-ml subagent to..." is interpretive
   - I need explicit instructions to use the Task tool

2. **This is Claude Native SDK, not just Claude Code**
   - User clarified: "it's not just claude coe but claude sdk agent"
   - The framework has TypeScript-based orchestration (`VersatilOrchestratorAgent`, `SDKTaskIntegration`)
   - BUT: The markdown commands still need to instruct me to invoke agents via Task tool

3. **Agent definition format**
   ```yaml
   ---
   name: "Dr.AI-ML"
   description: "Use PROACTIVELY when designing ML pipelines..."
   model: "sonnet"
   tools: ["Read", "Write", "Edit", ...]
   ---
   ```

4. **Task tool invocation format** (from system instructions)
   ```typescript
   Task tool parameters:
   - subagent_type: "Dr.AI-ML" | "Oliver-MCP" | "Sarah-PM" | etc.
   - description: "Short 3-5 word description"
   - prompt: "Detailed task for agent to perform autonomously"
   ```

---

## The Fix (V4)

### Changes Made to `.claude/commands/plan.md`

Replaced all natural language agent instructions with explicit Task tool invocation blocks:

#### Step 2: Pattern Search (Dr.AI-ML + Oliver-MCP)

**Before (V3 - Natural Language)**:
```markdown
> Use the dr-ai-ml subagent to search RAG for similar features...
```

**After (V4 - Explicit Task Tool)**:
```markdown
**⛔ BLOCKING STEP - YOU MUST INVOKE THESE AGENTS USING THE TASK TOOL:**

**ACTION 1: Invoke Dr.AI-ML Agent**
Call the Task tool with:
- `subagent_type: "Dr.AI-ML"`
- `description: "Search RAG for similar patterns"`
- `prompt: "Search RAG for similar features to '${feature_description}'. Use ML-powered similarity scoring, query GraphRAG via Oliver-MCP's routing, calculate similarity scores (min 75%), consolidate lessons learned by priority, provide confidence intervals for effort estimates, and extract code examples with file:line references. Return format: { patterns: [], total_found, avg_effort, avg_confidence, consolidated_lessons: {high, medium, low}, recommended_approach }"`

**STOP AND WAIT for Dr.AI-ML agent to complete before proceeding.**
```

#### Step 3: Template Selection (Sarah-PM + Alex-BA)

**ACTION 1**: Invoke Sarah-PM for template decision
**ACTION 2**: Invoke Alex-BA for complexity assessment
**CHECKPOINT**: Both agents must complete before Step 4

#### Step 4: Context-Aware Research (All 6 Agents)

**ACTION 1-6**: Invoke all agents **IN PARALLEL** (single message, multiple Task calls)
- Alex-BA
- Marcus-Backend
- James-Frontend
- Dana-Database
- Maria-QA
- Dr.AI-ML (optional)

**CHECKPOINT**: All agents must complete before Step 5

#### Step 7: Todo Orchestration (Sarah-PM)

**ACTION**: Invoke Sarah-PM for dual todo system generation
**CHECKPOINT**: Sarah-PM must complete before Step 8

#### Step 8: Plan Verification (Victor-Verifier)

**ACTION**: Invoke Victor-Verifier to validate all claims
**CHECKPOINT**: Victor must verify (confidence ≥95%) before displaying plan to user

---

## Key Improvements in V4

### 1. **Explicit Task Tool Parameters**
No ambiguity - every agent invocation has:
- `subagent_type` (exact agent name)
- `description` (3-5 word summary)
- `prompt` (detailed autonomous task instructions)

### 2. **Blocking Checkpoints**
Every step has:
```markdown
**STOP AND WAIT for [agent] to complete before proceeding.**
**⛔ CHECKPOINT: You MUST have [outputs] before [next step].**
```

### 3. **Parallel Execution Explicit**
Step 4 clearly states:
```markdown
**ACTION 1-6: Invoke All 6 Agents Simultaneously**
Send all 6 Task calls in parallel
```

### 4. **Return Format Specification**
Every prompt includes expected return format:
```typescript
Return: { patterns: [], total_found, avg_effort, ... }
```

### 5. **Failure Handling**
```markdown
**⛔ CHECKPOINT: You MUST have BOTH agent outputs before Step 3. If either agent failed, retry or use fallback estimates.**
```

---

## Testing Next Steps

1. **Test `/plan` command in Cursor**
   ```bash
   /plan "Add authentication with JWT"
   ```

2. **Expected Behavior**
   - I (Claude) should invoke Dr.AI-ML via Task tool in Step 2
   - I should wait for agent response before continuing
   - I should invoke Oliver-MCP via Task tool
   - Steps 3, 4, 7, 8 follow same pattern
   - Victor-Verifier validates before showing plan to user

3. **Verification**
   - Check agent responses appear in output
   - Verify agents provide reasoning (not just service results)
   - Confirm 8 agents invoked total (Dr.AI-ML, Oliver-MCP, Sarah-PM, Alex-BA, Marcus, James, Dana, Maria, Victor)

---

## Why V4 Should Work

### Previous Attempts
- **V1**: Added "🚨 MANDATORY" directives → Still interpretive
- **V2**: Added "⛔ BLOCKING STEP" with verification → Better but still interpretive
- **V3**: Natural language "Use the X subagent to..." → Correct format but not explicit enough

### V4 Advantages
1. **No ambiguity** - "Call the Task tool with:" is a direct command
2. **Parameterized** - Exact parameters listed in bullet format
3. **Copy-paste ready** - I can literally copy the parameters to Task tool
4. **Blocking checkpoints** - "STOP AND WAIT" is impossible to miss
5. **Failure paths** - "If either agent failed, retry or use fallback"

---

## Files Modified

- ✅ `.claude/commands/plan.md` - All 5 steps updated (2, 3, 4, 7, 8)
- ✅ `.claude/commands/work.md` - Agent invocation for implementation tasks
- ✅ `.claude/commands/delegate.md` - Sarah-PM invocation for work distribution
- ✅ `.claude/commands/learn.md` - Dr.AI-ML + Oliver-MCP invocation for RAG codification

---

## Implementation Status

| Step | Agents | V4 Status | Checkpoint |
|------|--------|-----------|------------|
| Step 2 | Dr.AI-ML + Oliver-MCP | ✅ Updated | Both agents required |
| Step 3 | Sarah-PM + Alex-BA | ✅ Updated | Both agents required |
| Step 4 | All 6 agents (parallel) | ✅ Updated | All agents required |
| Step 7 | Sarah-PM | ✅ Updated | Sarah-PM required |
| Step 8 | Victor-Verifier | ✅ Updated | Confidence ≥95% required |

---

## What This Achieves

**Before**: Markdown commands were documentation that I interpreted loosely
**After**: Markdown commands are explicit execution instructions with blocking checkpoints

**Before**: Natural language "Use the X subagent to..." could be ignored
**After**: "Call the Task tool with: `subagent_type: 'X'`" is a direct command

**Before**: No verification of agent execution
**After**: CHECKPOINT blocks ensure I cannot proceed without agent outputs

---

## Next Action

**User should test**: `/plan "Add authentication with JWT"` in Cursor

**Expected Result**: I will invoke all 8 agents via Task tool, wait for responses, and provide a verified plan with transparent agent reasoning at each step.

---

**Version**: V4 - Explicit Task Tool Invocation
**Date**: 2025-10-26
**Status**: ✅ READY FOR TESTING
