---
name: context-library
description: Three-layer context system with priority hierarchy (User > Library > Team > Framework). Use when implementing Context Resolution Graph (CRG) for merging contexts, Context-Aware Generation (CAG) for personalized code, or enforcing privacy isolation. Resolves context conflicts in <50ms.
tags: [context, crg, cag, privacy, priority-hierarchy]
---

# context/ - Three-Layer Context System

**Priority**: LOW
**Agent(s)**: Victor-Verifier (primary owner)
**Last Updated**: 2025-10-26

## When to Use

- Implementing three-layer context priority hierarchy
- Using Context Resolution Graph (CRG) for merging contexts (<50ms)
- Implementing Context-Aware Generation (CAG) for personalized code
- Enforcing privacy isolation (User > Team > Project > Framework)
- Detecting and resolving context conflicts
- Caching context resolution results

## What This Library Provides

- **CRG (Context Resolution Graph)**: Merges contexts with priority resolution (<50ms)
- **CAG (Context-Aware Generation)**: Generates code matching user preferences
- **PrivacyIsolation**: Enforces User > Team > Project > Framework separation
- **Conflict Detection**: Logs warnings when contexts conflict
- **Cache**: Context resolution results cached for performance

## Core Conventions

### DO ✓
- ✓ Always respect priority hierarchy (User > Library > Team > Framework)
- ✓ Detect conflicts and log warnings
- ✓ Cache context resolution results
- ✓ Enforce privacy isolation

### DON'T ✗
- ✗ Don't expose higher-priority contexts to lower levels
- ✗ Don't skip conflict detection
- ✗ Don't violate priority hierarchy

## Quick Start

```typescript
import { contextResolver } from '@/context/context-resolver.js';

// Resolve context with priority hierarchy
const resolved = await contextResolver.resolve({
  user: { asyncStyle: 'async/await', indentation: 2 },
  library: { asyncStyle: 'promises', indentation: 4 },
  team: { asyncStyle: 'callbacks', indentation: 2 },
  framework: { asyncStyle: 'promises', indentation: 2 }
});

// Result: { asyncStyle: 'async/await', indentation: 2 }
// User preference wins for both fields

console.log(`Resolved asyncStyle: ${resolved.asyncStyle}`);
console.log(`Conflicts detected: ${resolved.conflicts.length}`);
```

## Priority Hierarchy

```
User (HIGHEST - always wins)
  ↓
Library (library-specific overrides)
  ↓
Team (team conventions)
  ↓
Framework (LOWEST - defaults)
```

## Context-Aware Generation (CAG)

```typescript
import { codeGenerator } from '@/context/code-generator.js';

// Generate code respecting user preferences
const code = await codeGenerator.generate({
  template: 'async-function',
  userContext: { asyncStyle: 'async/await', naming: 'camelCase' }
});

// Output:
// async function fetchData() {
//   const response = await fetch(url);
//   return response.json();
// }
```

## Conflict Resolution

```typescript
// If contexts conflict, log warning and use highest priority
const resolved = await contextResolver.resolve({
  user: { quotes: 'single' },
  team: { quotes: 'double' }
});

// Result: { quotes: 'single' }
// Warning logged: "Context conflict: user.quotes='single' vs team.quotes='double'"
```

## Related Documentation

- [references/crg-algorithm.md](references/crg-algorithm.md) - Context Resolution Graph algorithm
- [references/cag-generation.md](references/cag-generation.md) - Context-Aware Generation patterns
- [docs/THREE_LAYER_CONTEXT_SYSTEM.md](../../../docs/THREE_LAYER_CONTEXT_SYSTEM.md) - Complete guide
- [docs/CRG_ALGORITHM.md](../../../docs/CRG_ALGORITHM.md) - CRG implementation details

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/context/**`
