---
name: library-guides
description: Library-specific development guides for VERSATIL framework modules. Use this when working with agents, rag, orchestration, planning, templates, hooks, mcp, context, intelligence, learning, memory, testing, validation, ui, or dashboard libraries. Provides architecture patterns, conventions, and gotchas for each library.
tags: [library, conventions, patterns, architecture]
---

# Library Guides - Module-Specific Development Context

## When to Use

- Working with code in `src/agents/`, `src/rag/`, `src/orchestration/`, etc.
- Need library-specific conventions and patterns
- Want to understand a library's architecture
- Looking for common patterns and gotchas
- Need to follow module-specific rules

## What This Skill Provides

Access to 15 library-specific guides covering:

### HIGH Priority (Most Used, Largest Files)
- **agents-library** (394 lines) - OPERA agent definitions, handoff contracts
- **rag-library** (470 lines) - Pattern search, GraphRAG, Vector stores
- **orchestration-library** (214 lines) - Workflow coordination, phase detection
- **testing-library** (199 lines) - Test infrastructure, 80%+ coverage standards

### MEDIUM Priority
- **planning-library** - Todo generation, dependency management
- **mcp-library** - MCP server integration, protocol
- **templates-library** - Template matching, scoring

### LOW Priority (Smaller, Less Frequently Modified)
- **dashboard-library** - Charts, visualization
- **memory-library** - State persistence, caching
- **validation-library** - Quality gates, contract validation
- **learning-library** - Pattern codification, feedback loops
- **intelligence-library** - Adaptive learning, AI features
- **context-library** - Three-layer context system
- **ui-library** - React components, WCAG 2.1 AA
- **hooks-library** - Event system, hook lifecycle

## How Library Context Works

### Progressive Disclosure (3 Levels)

```
1. This Index (Always Available)
   ↓ When you edit src/rag/pattern-search.ts
2. rag-library/SKILL.md Loads (~300 tokens)
   ↓ When you need API details
3. rag-library/references/pattern-search-api.md (~2,000 tokens)
```

### Integration with before-prompt Hook

When you edit a file like `src/rag/pattern-search.ts`:
1. Hook detects library: `rag`
2. Adds notification: "See rag-library skill for conventions"
3. You load skill details only if needed
4. Token savings: 85-95% (vs full claude.md injection)

## Library Statistics

| Library | Lines | Priority | Primary Agent |
|---------|-------|----------|---------------|
| agents | 394 | HIGH | Sarah-PM |
| rag | 470 | HIGH | Dr.AI-ML |
| orchestration | 214 | HIGH | Sarah-PM |
| testing | 199 | HIGH | Maria-QA |
| planning | 104 | MEDIUM | Sarah-PM |
| mcp | 51 | MEDIUM | Oliver-MCP |
| templates | 98 | MEDIUM | Sarah-PM |
| dashboard | 46 | LOW | James-Frontend |
| memory | 51 | LOW | Dana-Database |
| validation | 43 | LOW | Victor-Verifier |
| learning | 49 | LOW | Dr.AI-ML |
| intelligence | 43 | LOW | Dr.AI-ML |
| context | 98 | LOW | Sarah-PM |
| ui | 46 | LOW | James-Frontend |
| hooks | 227 | LOW | Marcus-Backend |

**Total**: 2,133 lines across 15 libraries

## Architecture Benefits

### Before (Hook Injection)
```typescript
// Loaded full claude.md into context
contextContent += fs.readFileSync('src/rag/claude.md', 'utf-8'); // 470 lines
// Cost: ~2,000 tokens, always loaded
```

### After (Skills)
```typescript
// Notify about available skill
contextContent += `See rag-library skill for conventions`; // ~10 tokens
// Details loaded progressively only when needed
```

### Token Savings
- **Average case**: 85-95% reduction (notification vs full file)
- **Best case**: 99% reduction (notification only, no details needed)
- **Worst case**: 0% reduction (need all reference docs)
- **Expected**: 5-8k token savings per session

## Usage Pattern

### Automatic (Recommended)
```typescript
// Edit file in library
vim src/rag/pattern-search.ts

// Hook auto-notifies about rag-library skill
// Load details if needed: "Tell me about RAG conventions"
```

### Manual Invocation
```bash
# Get library overview
"What are the RAG library conventions?"

# Load specific reference
"Show me the pattern-search API reference"

# Check multiple libraries
"What are the conventions for rag and orchestration libraries?"
```

## Related Skills

- **compounding-engineering** - Uses RAG patterns for historical search
- **rag-patterns** - Historical patterns stored in RAG format
- **quality-gates** - Uses testing-library standards
- **opera-orchestration** - Uses orchestration-library workflows

## Transformation Details

**Created**: Phase 3 of Skills-First Architecture (v7.0.0)
**Replaces**: Individual `src/*/claude.md` files (hook injection)
**Migration**: Progressive - old files archived after validation
**Documentation**: [docs/SKILLS_FIRST_ARCHITECTURE_TRANSFORMATION.md](../../docs/SKILLS_FIRST_ARCHITECTURE_TRANSFORMATION.md)

---

**Next Steps**: Explore individual library skills (agents-library, rag-library, etc.) for detailed conventions and patterns.
