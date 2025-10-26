# RAG Auto-Activation System

**Version**: v6.6.0+
**Status**: ✅ ACTIVE
**Hook**: `.claude/hooks/before-prompt.ts`
**Last Updated**: 2025-10-22

---

## Overview

The **RAG Auto-Activation System** automatically detects keywords in your questions and retrieves relevant learning patterns from `.versatil/learning/patterns/`. This enables Claude to answer with YOUR specific implementation details instead of generic LLM knowledge.

---

## How It Works

```
You ask: "How do I implement hooks?"
    ↓
UserPromptSubmit hook fires (.claude/hooks/before-prompt.ts)
    ↓
Hook detects keyword: "hooks"
    ↓
Hook loads: native-sdk-integration-v6.6.0.json
    ↓
Pattern injected into context
    ↓
Claude answers with YOUR v6.6.0 implementation (file paths, effort data, lessons)
```

---

## Keyword Mappings

### 1. **Native SDK Integration**
**Pattern**: `native-sdk-integration-v6.6.0.json`

**Keywords**:
- hook, hooks
- sdk, native
- settings.json
- PostToolUse, SubagentStop, Stop
- UserPromptSubmit

**Example Questions**:
- "How do I implement hooks?"
- "What's the SDK integration approach?"
- "Show me settings.json configuration"

---

### 2. **Victor-Verifier (Anti-Hallucination)**
**Pattern**: `victor-verifier-anti-hallucination.json`

**Keywords**:
- verification, verifier, verify
- hallucination, anti-hallucination
- victor
- cove, chain-of-verification
- proof log, confidence score

**Example Questions**:
- "How does verification work?"
- "What is anti-hallucination?"
- "Show me Victor implementation"
- "How do I verify claims?"

---

### 3. **Assessment Engine**
**Pattern**: `assessment-engine-v6.6.0.json`

**Keywords**:
- assessment, assess
- quality audit, pattern detection
- security scan, coverage requirement
- semgrep, lighthouse, axe-core

**Example Questions**:
- "How do I assess code quality?"
- "What are the security requirements?"
- "Show me assessment patterns"
- "How does quality auditing work?"

---

### 4. **Session CODIFY (Compounding Engineering)**
**Pattern**: `session-codify-compounding.json`

**Keywords**:
- codify, learning
- compounding
- session end, CLAUDE.md
- automatic learning
- stop hook learning

**Example Questions**:
- "How does CODIFY work?"
- "What is compounding engineering?"
- "How do I capture learnings?"
- "Show me session-end automation"

---

### 5. **Marketplace Organization**
**Pattern**: `marketplace-repository-organization.json`

**Keywords**:
- marketplace
- repository org, cleanup
- archive
- plugin metadata
- .claude-plugin

**Example Questions**:
- "How do I organize for marketplace?"
- "What's the plugin structure?"
- "How do I archive old docs?"

---

## Visual Indicator

When RAG activates, you'll see in your terminal:

```
🧠 [RAG] Auto-activated 2 pattern(s):
  1. Native SDK Integration Pattern (98% success)
  2. Victor-Verifier Anti-Hallucination System (95% success)
```

This confirms patterns were loaded and injected into context.

---

## Testing RAG Activation

### Test 1: Ask About Hooks
**You**: "How do I implement hooks?"

**Expected**:
- ✅ RAG activates: `native-sdk-integration-v6.6.0.json`
- ✅ Terminal shows: `🧠 [RAG] Auto-activated 1 pattern(s)`
- ✅ Answer includes:
  - File paths: `.claude/settings.json`, `.claude/hooks/*.ts`
  - Effort data: "28 hours (estimated 40, 70% accuracy)"
  - Success rate: "98%"
  - Commit hash: "8abdc04"

---

### Test 2: Ask About Verification
**You**: "How does verification work?"

**Expected**:
- ✅ RAG activates: `victor-verifier-anti-hallucination.json`
- ✅ Terminal shows: `🧠 [RAG] Auto-activated 1 pattern(s)`
- ✅ Answer includes:
  - 4-step CoVe process
  - File paths: `src/agents/verification/chain-of-verification.ts:1-453`
  - Metrics: "22 hours, 92% accuracy, 40% hallucination reduction"
  - Research basis: "Meta AI (arXiv:2309.11495)"

---

### Test 3: Ask About Assessment
**You**: "What are the security coverage requirements?"

**Expected**:
- ✅ RAG activates: `assessment-engine-v6.6.0.json`
- ✅ Answer includes:
  - "Security code requires 90%+ coverage (not 80%)"
  - File paths: `.versatil/verification/assessment-config.json`
  - Pattern keywords: 71 keywords across 5 categories

---

### Test 4: Multiple Patterns
**You**: "How do I implement verification hooks?"

**Expected**:
- ✅ RAG activates: BOTH patterns
  - `native-sdk-integration-v6.6.0.json` (keyword: "hooks")
  - `victor-verifier-anti-hallucination.json` (keyword: "verification")
- ✅ Terminal shows: `🧠 [RAG] Auto-activated 2 pattern(s)`

---

## Advantages Over Manual Queries

### Before RAG Activation
```
You: "How do I implement hooks?"
Claude: [Generic LLM answer with no specifics]

You: "Read the native-sdk pattern and tell me about hooks"
Claude: [Now reads YOUR pattern and gives specific answer]
```

**Problem**: You must remember to ask for the pattern.

---

### After RAG Activation
```
You: "How do I implement hooks?"
Claude: [Automatically retrieves YOUR pattern and gives specific answer]
```

**Benefit**: RAG activates automatically on every relevant question.

---

## Configuration

### Hook Location
`.claude/hooks/before-prompt.ts`

### Settings Configuration
Already configured in `.claude/settings.json`:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/before-prompt.ts"
          }
        ]
      }
    ]
  }
}
```

---

## Adding New Patterns

To add a new pattern for auto-activation:

1. **Create Pattern File**:
   ```bash
   # Save to .versatil/learning/patterns/my-new-pattern.json
   ```

2. **Add Keyword Mapping**:
   Edit `.claude/hooks/before-prompt.ts`:
   ```typescript
   const KEYWORD_MAP: Record<string, string> = {
     // ... existing mappings ...

     // Your new pattern
     'keyword1|keyword2|keyword3': 'my-new-pattern.json'
   };
   ```

3. **Test**:
   ```
   You: "Tell me about keyword1"
   # Should activate your pattern
   ```

---

## Troubleshooting

### RAG Not Activating

**Symptom**: No terminal message `🧠 [RAG] Auto-activated...`

**Causes**:
1. Keyword not in `KEYWORD_MAP`
2. Pattern file doesn't exist
3. Hook not configured in settings.json

**Debug**:
```bash
# Test hook manually
echo '{"prompt":"How do I implement hooks?","workingDirectory":"'$(pwd)'"}' | .claude/hooks/before-prompt.ts
```

---

### Pattern Found But Not Used

**Symptom**: Terminal shows activation but Claude doesn't use pattern data

**Cause**: Pattern injection might not be working with current SDK version

**Workaround**: Manually read the pattern:
```
"Read the native-sdk-integration pattern and tell me about hooks"
```

---

### Wrong Pattern Activated

**Symptom**: RAG activates irrelevant pattern

**Cause**: Keyword regex too broad

**Solution**: Make keywords more specific in `KEYWORD_MAP`:
```typescript
// ❌ Too broad
'hook': 'native-sdk-integration-v6.6.0.json',

// ✅ More specific
'hook|hooks|sdk.*hook|settings\\.json.*hook': 'native-sdk-integration-v6.6.0.json',
```

---

## Success Metrics

**Activation Rate**:
- Target: 80%+ of relevant questions activate RAG
- Measure: Check terminal for `🧠 [RAG] Auto-activated...`

**Answer Quality**:
- ✅ Specific file paths included
- ✅ Actual effort metrics cited
- ✅ Commit hashes referenced
- ✅ YOUR code examples shown

---

## Future Enhancements

### Phase 2: Semantic Search (Optional)
Replace keyword matching with vector embeddings:
- Use OpenAI/Anthropic embeddings
- Store in ChromaDB/Pinecone
- Query by semantic similarity
- Rank patterns by relevance

**Benefit**: Finds related patterns even without exact keywords

**Effort**: ~24 hours

---

## Related Documentation

- [Native SDK Best Practices](native-sdk-best-practices.md)
- [Verification and Assessment Patterns](verification-and-assessment.md)
- [Learning Report v6.6.0](../../.versatil/learning/session-learning-v6.6.0.md)

---

**Status**: ✅ ACTIVE (v6.6.0+)
**Maintenance**: Add new keywords as patterns grow
**Next**: Test with real questions and validate answer quality
