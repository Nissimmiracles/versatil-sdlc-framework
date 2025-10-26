# hooks/ - Lifecycle Hook System

**Priority**: HIGH
**Agent(s)**: Oliver-MCP (primary owner), all agents (hook consumers)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Lifecycle hooks for context injection (before-prompt), post-edit actions (after-file-edit), and git operations (after-build). Enables library context loading, RAG pattern injection, and auto-activation.

## 🎯 Core Concepts

- **before-prompt.ts**: Inject context before LLM prompt (RAG patterns, library context)
- **after-file-edit.ts**: Suggest agent activation after file changes
- **after-build.ts**: Run quality gates after build completion

## ✅ Rules

### DO ✓
- ✓ Keep hooks fast (<100ms)
- ✓ Use TypeScript with tsx runtime (not ts-node)
- ✓ Log hook execution for debugging

### DON'T ✗
- ✗ Don't block on external APIs
- ✗ Don't throw errors (log + continue)

## 🔧 Pattern: before-prompt Hook
```typescript
// .claude/hooks/before-prompt.ts
export default async function beforePrompt() {
  const context = await loadLibraryContext(); // <50ms
  const patterns = await loadRAGPatterns(); // <200ms
  return { context, patterns };
}
```

## 📚 Docs
- [Hook System](../../docs/HOOKS.md)
- [Context Injection](.claude/CONTEXT_INJECTION.md)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('hooks')`
