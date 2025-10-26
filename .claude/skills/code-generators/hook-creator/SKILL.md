---
name: hook-creator
description: Generate lifecycle hooks (before-prompt, after-file-edit, after-build) with tsx runtime and <100ms performance. Use when creating hooks, implementing context injection, or setting up auto-activation. Provides hook-template.ts with graceful failure patterns and stdin/stdout handling.
tags: [code-generation, hooks, lifecycle, tsx, performance]
---

# hook-creator - Lifecycle Hook Generator

**Purpose**: Generate fast, reliable lifecycle hooks with error handling

## When to Use

- Creating new lifecycle hooks (before-prompt, after-file-edit, etc.)
- Implementing context injection logic
- Setting up auto-activation patterns
- Building fast hook logic (<100ms requirement)

## Quick Start

1. **Copy template**: `cp .claude/skills/code-generators/hook-creator/assets/hook-template.ts .claude/hooks/your-hook.ts`
2. **Make executable**: `chmod +x .claude/hooks/your-hook.ts`
3. **Replace placeholders**: `{{HOOK_NAME}}`, `{{INPUT_FIELD_1}}`, `{{HELPER_1_NAME}}`, etc.
4. **Test hook**: `echo '{"prompt":"test"}' | npx tsx .claude/hooks/your-hook.ts`

## Performance Requirements

| Hook Type | Max Time | Typical |
|-----------|----------|---------|
| before-prompt | 100ms | 50ms |
| after-file-edit | 50ms | 20ms |
| after-build | 500ms | 200ms |

## Key Patterns

### Graceful Failure (Required)
```typescript
try {
  const result = await loadData();
  return result;
} catch (error) {
  console.error('Load failed:', error);
  return null; // Never throw
}
```

### Timeout Pattern
```typescript
await Promise.race([
  loadData(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 100)
  )
]).catch(() => null);
```

## Template Location

[assets/hook-template.ts](assets/hook-template.ts)

## Real Examples

- [.claude/hooks/before-prompt.ts](../../.claude/hooks/before-prompt.ts)
- [.claude/hooks/after-file-edit.ts](../../.claude/hooks/after-file-edit.ts)
