# Task Tool Investigation - How to Actually Invoke Agents

**Date**: 2025-10-26
**Status**: IN PROGRESS - Testing actual invocation syntax

---

## Discovery: Task Tool Exists But Format Unknown

### What We Know:
1. ✅ Task tool is available in Claude Code (listed in my tools)
2. ✅ It has 3 parameters: `subagent_type`, `description`, `prompt`
3. ❌ XML format doesn't work (got InputValidationError)
4. ❓ Correct invocation format unknown

### Test 1: XML Format (FAILED)
```xml
<invoke name="Task">
  <parameter name="subagent_type">Dr.AI-ML</parameter>
  <parameter name="description">Search patterns</parameter>
  <parameter name="prompt">...</parameter>
</invoke>
```
**Error**: `An unexpected parameter 'description' was provided`

This error is strange - the tool definition says it requires `description`, but it rejects it?

### Hypothesis 1: Task Tool May Not Be Fully Implemented

The error suggests:
1. Tool is defined in the interface
2. But backend implementation may be incomplete
3. Or parameters don't match between definition and implementation

### Hypothesis 2: Task Tool Works Differently Than Other Tools

Maybe Task tool uses a different invocation pattern:
- Other tools: XML with parameters
- Task tool: ??? (JSON? Direct call? Different format?)

### Hypothesis 3: Commands Use Wrong Instructions

The updated plan.md says:
```markdown
Call the Task tool with:
- `subagent_type: "Dr.AI-ML"`
- `description: "Search patterns"`
- `prompt: "..."`
```

But this is **pseudocode**, not actual invocation syntax.

---

## What Commands Actually Need

Instead of documenting "how to use Task tool", commands need to **demonstrate working invocation**.

### Current Approach (Doesn't Work):
```markdown
**ACTION: Invoke Dr.AI-ML**
Call the Task tool with:
- subagent_type: "Dr.AI-ML"
- description: "Search patterns"
```

**Problem**: This is instructions to Claude, not executable code

### What's Needed (Unknown):
```markdown
**ACTION: Invoke Dr.AI-ML**

<actual working invocation syntax here>
```

---

## Next Steps

1. **Test Task tool in isolation** - Try different formats:
   - JSON object
   - Plain text with parameters
   - Alternative XML structure
   - Check if tool name is correct ("Task" vs "TaskTool" vs "Agent"?)

2. **Check Claude Code SDK docs** - Find official examples of agent invocation

3. **Examine existing VERSATIL code** - Search for any working Task tool usage:
   ```bash
   grep -r "Task(" src/
   grep -r "invoke.*agent" src/
   grep -r "subagent_type" src/
   ```

4. **Test with simple agent** - Try invoking simplest possible agent to isolate format issues

---

## Critical Question

**Does the Task tool actually work in Claude Code?**

Possibilities:
A. ✅ Yes, but we're using wrong syntax
B. ❌ No, it's defined but not implemented
C. ⚠️ Partial - works for some agents but not others

**Finding this answer is CRITICAL** - if Task tool doesn't work, entire agent invocation strategy fails.

---

## Fallback if Task Tool Doesn't Work

If Task tool is not functional:

### Option A: Direct Agent Class Instantiation
```typescript
import { drAiML } from '../../src/agents/opera/dr-ai-ml/dr-ai-ml.js';

const result = await drAiML.activate({
  task: 'pattern-search',
  feature: feature_description
});
```

### Option B: Agent Registry Pattern
```typescript
import { agentRegistry } from '../../src/agents/core/agent-registry.js';

const agent = agentRegistry.get('dr-ai-ml');
const result = await agent.activate({...});
```

### Option C: Service Calls Only (Accept Reality)
```typescript
// Just use services directly, no agents
import { patternSearchService } from '../../src/rag/pattern-search.js';
const result = await patternSearchService.searchSimilarFeatures({...});
```

---

## Recommendation

**STOP** trying to fix commands until we answer:

**"Can Task tool actually invoke agents in Claude Code?"**

If YES: Find correct syntax, update commands
If NO: Choose Option A/B/C above

Do NOT continue updating plan.md until this is confirmed.

---

**Next Action**: Test Task tool invocation in a simple, isolated way to determine if it works at all.
