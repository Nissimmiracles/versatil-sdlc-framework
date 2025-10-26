---
name: session-codify
description: Automatic learning capture at session end using Stop hook for compounding engineering. This skill should be used when implementing session-end codification, automatic pattern learning, or capturing development insights for future reference.
---

# Session CODIFY - Compounding Engineering

**Category**: Learning & Codification
**Success Rate**: 90%
**Effort**: 18h actual (20h estimated) - 90% accuracy
**Status**: Production (Stable)

## When to Use This Pattern

Use this pattern when you need to:

1. **Automatic learning** - Capture what was accomplished at session end
2. **Compounding engineering** - Each session makes next sessions faster
3. **Pattern codification** - Store reusable learnings in RAG
4. **Effort tracking** - Actual vs estimated hours for accuracy improvement

## What This Pattern Solves

**Problem**: Learnings are lost when sessions end - repeat same mistakes
**Solution**: Stop hook automatically codifies session into RAG patterns for future retrieval

**Formula**: Better historical patterns = More accurate estimates = 40% faster by feature 5

## How to Implement

### Step 1: Configure Stop Hook

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/session-codify.ts"
        }]
      }
    ]
  }
}
```

### Step 2: Capture Session Summary

```typescript
interface SessionSummary {
  conversation_id: string;
  duration_ms: number;
  tools_used: string[];
  files_modified: string[];
  feature_description?: string;
  effort_actual?: number;
  effort_estimated?: number;
  lessons_learned: string[];
  success_indicators: string[];
}
```

### Step 3: Store as RAG Pattern

Auto-generate pattern JSON for future retrieval:

```json
{
  "id": "auth-implementation-session-123",
  "name": "User Authentication Implementation",
  "description": "OAuth2 + JWT with Google provider",
  "category": "auth",
  "metrics": {
    "effortHours": 26,
    "estimatedHours": 32,
    "accuracy": 81
  },
  "implementation": {
    "files": ["src/auth/oauth.ts", "src/auth/jwt.ts"],
    "instructions": ["CORS config needed for Google OAuth"],
    "warnings": ["Don't forget to whitelist redirect URL in GCP"]
  }
}
```

### Step 4: Automatic Triggering

**When it fires**: Session ends (user closes, timeout, manual stop)

**What it captures**:
- Tools used
- Files modified
- Commands executed
- Time spent
- Success/failure indicators

**Where it stores**: `.versatil/learning/patterns/`

## Critical Requirements

1. **Non-blocking** - Must complete quickly (<2s)
2. **Graceful failure** - Never block session close
3. **Privacy** - No sensitive data in patterns
4. **Versioning** - Pattern schema version for migration

## Success Metrics

- **Patterns Captured**: 100% of sessions with code changes
- **Retrieval Accuracy**: 75%+ similarity for future queries
- **Effort Variance**: ±50% → ±10-20% after 5 features
- **Compounding Effect**: 40% faster by feature 5

## Related Information

For implementation details and examples:
- See `references/codify-implementation.md` for complete hook code
- See `references/pattern-schema.md` for RAG pattern format

## Related Patterns

- `native-sdk-integration` - Stop hook configuration
- Pattern search in `compounding-engineering` skill
