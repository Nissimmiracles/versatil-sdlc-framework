# Command Agent Integration Fix V2: Blocking Procedural Steps

**Date**: 2025-10-26
**Previous Approach**: Mandatory directives (FAILED - still just documentation)
**New Approach**: Blocking procedural steps with verification checkpoints
**Status**: 🔄 IN PROGRESS

---

## Why V1 Failed

### What I Did (V1 - Mandatory Directives):
```markdown
🚨 MANDATORY AGENT INVOCATION - DO NOT SKIP:

1. Invoke `dr-ai-ml` agent with Task tool
2. Invoke `oliver-mcp` agent with Task tool
3. Wait for both to complete
```

### Why It Didn't Work:
- Still just **documentation/suggestions**
- Claude can **read and ignore** the directive
- No **forced blocking** - Claude can skip to next step
- No **verification** that agents were actually invoked

**Result**: Commands still don't invoke agents ❌

---

## V2 Approach: Blocking Procedural Steps

### New Pattern:
```markdown
⛔ BLOCKING STEP - CANNOT PROCEED WITHOUT COMPLETING THIS:

**ACTION 1 - Invoke dr-ai-ml (DO THIS NOW):**
Use the Task tool with these exact parameters:
- subagent_type: "dr-ai-ml"
- description: "Search RAG for patterns"
- prompt: [Copy FULL prompt from section below]

**STOP. WAIT for dr-ai-ml to return. Do NOT continue until you have output.**

**ACTION 2 - Verify dr-ai-ml output (REQUIRED):**
- Did agent return `patterns` array? YES/NO
- Did agent return `avg_effort` number? YES/NO
- **If ANY answer is NO**: RETRY ACTION 1

**⛔ CHECKPOINT: Do you have agent output? If NO, go back to ACTION 1.**
**⛔ If you proceed to Step 3 without agent output, you MUST stop and return here.**
```

### Key Differences:
1. **Numbered ACTIONS** - More imperative than "steps"
2. **"DO THIS NOW"** - Immediate action required
3. **STOP/WAIT** - Explicit blocking instructions
4. **Verification checkpoints** - YES/NO questions to confirm completion
5. **RETRY logic** - What to do if verification fails
6. **Multiple ⛔ CHECKPOINT warnings** - Redundant blocking
7. **Consequences stated** - "If you proceed... you MUST stop and return"

---

## Implementation Status

### ✅ Updated: `/plan` Command - Step 2
**File**: `.claude/commands/plan.md`

**Changes**:
- Replaced "🚨 MANDATORY" with "⛔ BLOCKING STEP"
- Added 4 sequential ACTIONS with STOP/WAIT directives
- Added verification checkpoints after each agent invocation
- Added 2x redundant checkpoint warnings at end

**Testing**: Needs verification in Cursor

---

### ⏳ To Update:

#### `/plan` Command - Remaining Steps
- **Step 3**: Sarah-PM + Alex-BA (template selection)
- **Step 4**: 5-6 agents in parallel (context-aware research)
- **Step 7**: Sarah-PM (todo orchestration)
- **Step 8**: Victor-Verifier (plan validation)

#### Other Commands
- `/work` - Step 3 (agent invocation from todo file)
- `/delegate` - Step 2 (Sarah-PM strategic assignment)
- `/learn` - Step 4 (Dr.AI-ML + Oliver-MCP RAG storage)

---

## Why This Might Work Better

### Psychological Framing:
- **"DO THIS NOW"** - More urgent than "you must"
- **"STOP. WAIT."** - Creates pause, prevents rushing ahead
- **YES/NO questions** - Forces explicit self-check
- **Multiple checkpoints** - Redundancy increases compliance
- **⛔ Symbol** - Visual blocking cue

### Procedural Structure:
- **Numbered ACTIONS** - Clear sequence
- **Verification after each action** - Prevents skipping
- **RETRY logic** - Handles failures explicitly
- **Consequences** - States what happens if skipped

---

## Testing Plan

### Test 1: Simple Feature with `/plan`
```bash
/plan "Add basic login"
```

**Watch for**:
1. Does Claude stop at "STOP. WAIT." instruction?
2. Does Claude invoke Task tool for dr-ai-ml?
3. Does Claude verify output with YES/NO questions?
4. Does Claude proceed to ACTION 3 only after verification?
5. Does Claude reach Step 3 without agent outputs?

**Success Criteria**:
- ✅ Both dr-ai-ml AND oliver-mcp invoked
- ✅ Claude waits for agent outputs before continuing
- ✅ Verification checkpoints completed
- ✅ Agent reasoning visible in plan output

### Test 2: If Claude Skips Agents
**Observation**: Claude proceeds to Step 3 without agent invocations

**Expected**: Claude should encounter checkpoint warnings:
- "⛔ CHECKPOINT: Do you have BOTH agent outputs? If NO, go back to ACTION 1."
- "⛔ If you proceed to Step 3 without agent outputs, you MUST stop and return here."

**Ideal Behavior**: Claude self-corrects and goes back to ACTION 1

**Realistic Behavior**: Claude acknowledges skip and continues anyway

---

## Backup Plan: If V2 Also Fails

If blocking procedural steps still don't force agent invocation, the only remaining option is:

### Option 3: Convert Commands to TypeScript

Replace markdown commands with executable TypeScript:

```typescript
// .claude/commands/plan.ts
export async function execute(args: {featureDescription: string}) {
  // Step 2: FORCED execution - no way to skip
  const drAiResult = await invokeDrAiML(args.featureDescription);
  const oliverResult = await invokeOliverMCP(args.featureDescription);

  // Continue with Steps 3-8...
}
```

**Pros**:
- **Guaranteed execution** - Code runs programmatically
- **No interpretation** - No way for Claude to "skip" steps
- **Type-safe** - Parameters enforced by TypeScript

**Cons**:
- **Major rewrite** - All 4 commands need conversion
- **Less flexible** - Harder to customize prompts
- **Maintenance** - Code instead of markdown

---

## Next Steps

1. **Test V2 with `/plan` in Cursor** - Does blocking + verification work?
2. **If successful**: Update Steps 3, 4, 7, 8 in `/plan` + other 3 commands
3. **If failed**: Proceed to Option 3 (TypeScript conversion)

---

**Author**: Claude (Agent Integration Implementation)
**Framework Version**: v6.6.0+
**Last Updated**: 2025-10-26
