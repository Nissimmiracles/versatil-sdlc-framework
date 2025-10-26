# context/ - Three-Layer Context System

**Priority**: HIGH
**Agent(s)**: Victor-Verifier (primary owner)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Implements three-layer context system with priority hierarchy (User > Library > Team > Framework). Provides Context Resolution Graph (CRG) for merging contexts and Context-Aware Generation (CAG) for personalized code.

## 🎯 Core Concepts

- **CRG (Context Resolution Graph)**: Merges contexts with priority resolution (<50ms)
- **CAG (Context-Aware Generation)**: Generates code matching user preferences
- **PrivacyIsolation**: Enforces User > Team > Project > Framework separation

## ✅ Rules

### DO ✓
- ✓ Always respect priority hierarchy
- ✓ Detect conflicts and log warnings
- ✓ Cache context resolution results

### DON'T ✗
- ✗ Don't expose higher-priority contexts to lower levels
- ✗ Don't skip conflict detection

## 🔧 Pattern: Resolve Context
```typescript
import { contextResolver } from '@/context/context-resolver.js';

const resolved = await contextResolver.resolve({
  user: { asyncStyle: 'async/await' },
  library: { asyncStyle: 'promises' },
  team: { asyncStyle: 'callbacks' }
});
// Result: 'async/await' (user preference wins)
```

## 📚 Docs
- [Three-Layer Context System](../../docs/THREE_LAYER_CONTEXT_SYSTEM.md)
- [CRG Algorithm](../../docs/CRG_ALGORITHM.md)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('context')`
