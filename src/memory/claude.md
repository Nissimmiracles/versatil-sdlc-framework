# memory/ - Context Persistence Layer

**Priority**: HIGH
**Agent(s)**: Dana-Database (primary owner), Marcus-Backend
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Persistent storage for agent memory, conversation history, and context vectors. Uses Supabase pgvector for semantic search and Redis for cache. Enforces privacy isolation (User > Team > Project > Public).

## 🎯 Core Concepts

- **VectorStore**: Supabase pgvector for embeddings
- **MemoryPersistence**: Save/load agent conversations
- **PrivacyFilter**: Four-layer access control

## ✅ Rules

### DO ✓
- ✓ Encrypt sensitive data at rest
- ✓ Filter by user/team/project context
- ✓ Use Redis cache for hot data (15min TTL)

### DON'T ✗
- ✗ Don't store secrets in memory
- ✗ Don't skip privacy filtering

## 🔧 Pattern: Store Agent Memory
```typescript
import { memoryStore } from '@/memory/vector-store.js';

await memoryStore.save({
  agentId: 'Marcus-Backend',
  content: 'User prefers REST over GraphQL',
  metadata: { userId: 'user-123', privacy: 'user' }
});

const memories = await memoryStore.search({
  query: 'API design preferences',
  userId: 'user-123'
}); // Returns only user's memories
```

## 📚 Docs
- [Memory Architecture](../../docs/MEMORY.md)
- [Privacy Isolation](../../docs/PRIVACY.md)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('memory')`
