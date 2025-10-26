---
name: hooks-library
description: Lifecycle hook system for context injection (before-prompt), post-edit actions (after-file-edit), and git operations (after-build). Use when implementing hooks, enabling library context loading, injecting RAG patterns, or implementing agent auto-activation. Must be fast (<100ms) and use tsx runtime (not ts-node).
tags: [hooks, lifecycle, context-injection, auto-activation, tsx]
---

# hooks/ - Lifecycle Hook System

**Priority**: LOW
**Agent(s)**: Oliver-MCP (primary owner), all agents (hook consumers)
**Last Updated**: 2025-10-26

## When to Use

- Implementing lifecycle hooks (before-prompt, after-file-edit, after-build)
- Enabling library context loading and RAG pattern injection
- Implementing agent auto-activation based on file changes
- Running quality gates after build completion
- Logging hook execution for debugging
- Keeping hooks fast (<100ms performance requirement)

## What This Library Provides

- **before-prompt.ts**: Inject context before LLM prompt (RAG patterns, library context)
- **after-file-edit.ts**: Suggest agent activation after file changes
- **after-build.ts**: Run quality gates after build completion
- **tsx runtime**: Fast TypeScript execution (not ts-node)
- **Performance**: <100ms execution time requirement

## Core Conventions

### DO ✓
- ✓ Keep hooks fast (<100ms execution time)
- ✓ Use TypeScript with tsx runtime (not ts-node)
- ✓ Log hook execution for debugging
- ✓ Fail gracefully (log + continue, don't throw)

### DON'T ✗
- ✗ Don't block on external APIs (use timeouts)
- ✗ Don't throw errors (log + continue)
- ✗ Don't use ts-node (use tsx for speed)

## Quick Start

### before-prompt Hook
```typescript
// .claude/hooks/before-prompt.ts
#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface HookInput {
  prompt: string;
  message: string;
  workingDirectory: string;
}

async function main() {
  const input: HookInput = JSON.parse(
    fs.readFileSync(process.stdin.fd, 'utf-8')
  );

  // Load library context (<50ms)
  const context = await loadLibraryContext(input.message);

  // Load RAG patterns (<200ms)
  const patterns = await loadRAGPatterns(input.message);

  // Output JSON context
  console.log(JSON.stringify({
    role: 'system',
    content: `${context}\n\n${patterns}`
  }));

  process.exit(0);
}

main();
```

### after-file-edit Hook
```typescript
// .claude/hooks/after-file-edit.ts
#!/usr/bin/env tsx

import fs from 'fs';

interface HookInput {
  filePath: string;
  action: 'create' | 'edit' | 'delete';
}

async function main() {
  const input: HookInput = JSON.parse(
    fs.readFileSync(process.stdin.fd, 'utf-8')
  );

  // Suggest agent activation based on file pattern
  if (input.filePath.endsWith('.test.ts')) {
    console.error('💡 TIP: Run Maria-QA for test coverage analysis');
  }

  process.exit(0);
}

main();
```

## Hook Performance Requirements

| Hook | Max Execution Time | Typical Time |
|------|-------------------|--------------|
| before-prompt | 100ms | 50ms |
| after-file-edit | 50ms | 20ms |
| after-build | 500ms | 200ms |

## Hook Input/Output

### Input (via stdin)
```json
{
  "prompt": "User's message",
  "message": "User's message",
  "workingDirectory": "/path/to/project",
  "filePath": "src/auth.ts",
  "action": "edit"
}
```

### Output (via stdout)
```json
{
  "role": "system",
  "content": "Context and patterns to inject"
}
```

### Logging (via stderr)
```bash
console.error('🧠 [RAG Patterns] 2 pattern(s) available');
console.error('📚 [Library Context] Loaded rag, testing');
```

## Debugging Hooks

```bash
# Test hook manually
echo '{"prompt":"test","message":"work on rag","workingDirectory":"'$(pwd)'"}' | \
  npx tsx .claude/hooks/before-prompt.ts

# Enable debug mode
DEBUG=hooks:* npx tsx .claude/hooks/before-prompt.ts

# Check hook execution time
time echo '{"prompt":"test","message":"test","workingDirectory":"'$(pwd)'"}' | \
  npx tsx .claude/hooks/before-prompt.ts
```

## Common Patterns

### Timeout Pattern
```typescript
// Always use timeouts for external calls
const result = await Promise.race([
  loadRAGPatterns(query),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 100)
  )
]).catch(error => {
  console.error('RAG load timeout, continuing without patterns');
  return null;
});
```

### Graceful Failure Pattern
```typescript
// Never throw errors - log and continue
try {
  const context = await loadLibraryContext(message);
  return context;
} catch (error) {
  console.error('Library context load failed:', error);
  return ''; // Continue without context
}
```

## Related Documentation

- [references/hook-lifecycle.md](references/hook-lifecycle.md) - Hook execution lifecycle
- [references/context-injection.md](references/context-injection.md) - Context injection patterns
- [docs/HOOKS.md](../../../docs/HOOKS.md) - Hook system guide
- [.claude/CONTEXT_INJECTION.md](../../.claude/CONTEXT_INJECTION.md) - Context injection details

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `.claude/hooks/**`
