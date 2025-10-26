---
name: memory-library
description: Context persistence layer for agent memory, conversation history, and semantic search. Use when storing agent memories, implementing vector search with Supabase pgvector, enforcing privacy isolation (User > Team > Project > Public), or caching with Redis. Enables long-term context retention across sessions.
tags: [memory, vector-store, pgvector, privacy, redis]
---

# memory/ - Context Persistence Layer

**Priority**: LOW
**Agent(s)**: Dana-Database (primary owner), Marcus-Backend
**Last Updated**: 2025-10-26

## When to Use

- Storing agent memory and conversation history
- Implementing semantic search with Supabase pgvector
- Enforcing privacy isolation (User > Team > Project > Public)
- Caching frequently accessed data with Redis (15min TTL)
- Enabling long-term context retention across sessions
- Searching agent memories by semantic similarity

## What This Library Provides

- **VectorStore**: Supabase pgvector for embeddings and semantic search
- **MemoryPersistence**: Save/load agent conversations
- **PrivacyFilter**: Four-layer access control (User > Team > Project > Public)
- **Redis Cache**: 15-minute TTL for hot data
- **Encryption**: Sensitive data encrypted at rest

## Core Conventions

### DO ✓
- ✓ Encrypt sensitive data at rest
- ✓ Filter by user/team/project context
- ✓ Use Redis cache for hot data (15min TTL)
- ✓ Always enforce privacy isolation

### DON'T ✗
- ✗ Don't store secrets in memory
- ✗ Don't skip privacy filtering
- ✗ Don't expose higher-level contexts to lower levels

## Quick Start

```typescript
import { memoryStore } from '@/memory/vector-store.js';

// Store agent memory
await memoryStore.save({
  agentId: 'Marcus-Backend',
  content: 'User prefers REST over GraphQL',
  metadata: { userId: 'user-123', privacy: 'user' }
});

// Search memories (privacy-filtered)
const memories = await memoryStore.search({
  query: 'API design preferences',
  userId: 'user-123'
}); // Returns only user's private memories
```

## Privacy Isolation

```
User (HIGHEST - private to user only)
  ↓
Team (shared with team members only)
  ↓
Project (shared with project contributors)
  ↓
Public (LOWEST - shared with all users)
```

## Related Documentation

- [references/vector-search.md](references/vector-search.md) - Semantic search with pgvector
- [references/privacy-isolation.md](references/privacy-isolation.md) - Four-layer access control
- [docs/MEMORY.md](../../../docs/MEMORY.md) - Memory architecture

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/memory/**`
