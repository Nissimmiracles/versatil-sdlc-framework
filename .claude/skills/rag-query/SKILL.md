---
name: rag-query
description: Query and store RAG memories for knowledge retrieval. This skill should be used when researching historical context, storing learnings, querying past experiences, or using the /learn command.
allowed-tools:
  - Bash
  - Read
---

# RAG Query Skill

**Auto-invoked during**: Research, learning codification, `/learn` command, historical context retrieval

Query and store RAG memories for semantic knowledge retrieval.

## What This Skill Provides

Two RAG memory operations:

1. **Query Memories** - Retrieve relevant historical knowledge
2. **Store Memories** - Codify new learnings for future use

**Result**: Learn from past work, avoid repeating mistakes

## When to Use

Use this skill when you need to:

- **Research similar work** - Find past implementations
- **Store learnings** - Codify insights from completed features
- **Query experiences** - Search historical context
- **Avoid mistakes** - Retrieve warnings and gotchas

## Quick Start

### Query Memories

```bash
! npx tsx .claude/skills/rag-query/scripts/execute-rag-query.ts \
  --action query \
  --query "How to implement OAuth2 authentication?" \
  --limit 5
```

**Returns**: Top 5 semantically similar memories with relevance scores

---

### Store Memories

```bash
! npx tsx .claude/skills/rag-query/scripts/execute-rag-query.ts \
  --action store \
  --memory "Google OAuth requires CORS whitelist in GCP console" \
  --tags "auth,oauth,google,cors"
```

**Returns**: Confirmation of storage with tags

---

## Integration with /learn Command

**Automatic storage** after feature completion:

```bash
/learn "Completed auth in 26h - Google OAuth needs CORS config"
# Internally uses rag-query skill to store
```

**Query during planning**:

```bash
/plan "Add user authentication"
# Internally queries: "user authentication implementation"
# Returns historical learnings
```

---

## Query Return Format

```json
{
  "query": "How to implement OAuth2 authentication?",
  "results": [
    {
      "content": "OAuth2 requires CORS configuration for Google provider...",
      "score": 0.89,
      "tags": ["auth", "oauth", "cors"],
      "timestamp": 1234567890
    }
  ],
  "total_found": 3,
  "search_method": "vector"
}
```

---

## Store Return Format

```json
{
  "stored": true,
  "memory": "Google OAuth requires CORS whitelist in GCP console",
  "tags": ["auth", "oauth", "google", "cors"]
}
```

---

## Critical Requirements

1. **Tags are important** - Enable category-based filtering
2. **Store after success** - Only codify learnings from completed features
3. **Query before planning** - Historical context improves estimates
4. **Min-score threshold** - 0.7 is good balance (precision vs recall)

---

## Common Use Cases

**Before implementing**:
```bash
# Query: "authentication implementation"
# Returns: 3 past auth implementations with lessons
# Avoid: Mistakes from past attempts
```

**After completing**:
```bash
/learn "Auth took 26h (estimated 32h) - CORS config needed"
# Stores for future auth projects
```

---

## Performance

- **Query**: ~1-2s (vector search + embedding)
- **Store**: ~500ms-1s (embedding + database write)

---

## Detailed Documentation

For complete RAG specifications:

- **Vector Search**: See `references/vector-search.md`
- **Embedding Model**: See `references/embedding-details.md`
- **Storage Schema**: See `references/memory-schema.md`

---

## Related Skills

- `compounding-engineering` - Uses rag-query for pattern search
- `rag-patterns/session-codify` - Automatic storage at session end

---

## Quick Reference

**Operations**: query | store

**Key Insight**: Your past work is your best teacher - query it before implementing
