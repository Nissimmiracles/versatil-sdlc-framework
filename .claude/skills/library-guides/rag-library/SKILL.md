---
name: rag-library
description: RAG (Retrieval-Augmented Generation) system for historical pattern search, effort estimation, and context-aware code generation. Use when searching similar features, estimating effort from historical data, implementing GraphRAG/Vector stores, or building compounding engineering workflows. Includes fallback chain (GraphRAG → Vector → Local) and privacy isolation.
tags: [rag, pattern-search, graphrag, vector-store, compounding-engineering]
---

# rag/ - Retrieval-Augmented Generation System

**Priority**: HIGH
**Agent(s)**: Marcus-Backend (primary owner), Dr.AI-ML, Oliver-MCP
**Last Updated**: 2025-10-26

## When to Use

- Searching for similar historical feature implementations
- Estimating effort based on past projects (40% compounding speedup)
- Implementing GraphRAG or Vector store integration
- Building context-aware code generation workflows
- Debugging RAG search failures or fallback chains
- Setting up privacy-isolated pattern storage
- Optimizing semantic search performance

## What This Library Provides

### Core Services
- **PatternSearchService**: Main API for searching historical implementations
- **EnhancedVectorMemoryStore**: Supabase pgvector + semantic search
- **GraphRAG Store**: Neo4j knowledge graph with relationship-based queries
- **Pattern Codifier**: Converts feedback → structured patterns

### Key Features
- **Fallback Chain**: GraphRAG → Vector → Local → None (graceful degradation)
- **Privacy Isolation**: User > Team > Project > Public (four-layer filtering)
- **Aggregated Insights**: avg_effort, consolidated_lessons, recommended_approach
- **Adaptive Thresholds**: 0.75 default, auto-retry at 0.60 if no results
- **15-min Cache**: Self-cleaning cache for repeated queries

### File Structure
```
src/rag/
├── pattern-search.ts                 # PatternSearchService (main API)
├── enhanced-vector-memory-store.ts   # Supabase pgvector
├── graphrag-store.ts                 # Neo4j GraphRAG
├── rag-query-builder.ts              # Query DSL
├── pattern-codifier.ts               # Feedback → patterns
└── types.ts                          # TypeScript interfaces
```

## Core Conventions

### DO ✓
- ✓ **Always use fallback chain** - GraphRAG preferred, gracefully degrade to Vector → Local
- ✓ **Lazy initialize stores** - Call `initialize()` on first search, not constructor
- ✓ **Respect privacy isolation** - Filter results by access level (user/team/project/public)
- ✓ **Cache search results** - 15-minute cache for repeated queries
- ✓ **Log search methods** - Track which store was used (graphrag/vector/local/none)
- ✓ **Calculate aggregated insights** - avg_effort, consolidated_lessons, recommended_approach

### DON'T ✗
- ✗ **Don't skip fallback logic** - Always try all 3 stores before returning empty
- ✗ **Don't expose private patterns** - Enforce User > Team > Project > Public filtering
- ✗ **Don't query without min_similarity** - Default 0.75 prevents low-quality matches
- ✗ **Don't hardcode effort estimates** - Always derive from historical data
- ✗ **Don't block on RAG failures** - Gracefully return empty results, log warning

## Quick Start Patterns

### Pattern 1: Search Similar Features
```typescript
import { patternSearchService } from '@/rag/pattern-search.js';

const result = await patternSearchService.searchSimilarFeatures({
  description: 'Add user authentication with JWT tokens',
  agent: 'Marcus-Backend', // Optional filter
  category: 'Security',
  limit: 5,
  min_similarity: 0.75
});

// Result structure:
console.log(`Found ${result.total_found} similar features (via ${result.search_method})`);
console.log(`Estimated effort: ${result.avg_effort} hours`);
console.log(`Key lessons: ${result.consolidated_lessons.join(', ')}`);

// result.patterns[0]:
// {
//   feature_name: 'OAuth2 Authentication',
//   effort_hours: 24,
//   confidence: 90,
//   similarity_score: 0.87,
//   lessons_learned: ['Use bcrypt', 'JWT in httpOnly cookies'],
//   code_examples: [{ file: 'auth-service.ts', lines: '42-100' }]
// }
```

### Pattern 2: Adaptive Threshold Search
```typescript
import { patternSearchService } from '@/rag/pattern-search.js';

// Try strict threshold first
let result = await patternSearchService.searchSimilarFeatures({
  description: 'authentication',
  min_similarity: 0.75
});

// If no results, retry with lower threshold
if (result.patterns.length === 0) {
  result = await patternSearchService.searchSimilarFeatures({
    description: 'authentication',
    min_similarity: 0.60
  });
}
```

### Pattern 3: Graceful Error Handling
```typescript
import { patternSearchService } from '@/rag/pattern-search.js';

try {
  const patterns = await patternSearchService.searchSimilarFeatures(query);

  if (patterns.patterns.length === 0) {
    this.logger.warn('No historical patterns found, using defaults', { query }, 'rag');
    return { patterns: [], search_method: 'none', avg_effort: null };
  }

  return patterns;
} catch (error) {
  this.logger.error('Pattern search failed', { error, query }, 'rag');
  // Don't throw - return empty results for graceful degradation
  return { patterns: [], search_method: 'none', avg_effort: null };
}
```

## Important Gotchas

### Gotcha 1: Empty Results from All Stores
**Problem**: GraphRAG fails, Vector store empty, Local fallback has no data → returns []

**Solution**: Bootstrap Local store with example patterns
```typescript
// ✅ Good - Graceful fallback with defaults
const result = await patternSearchService.searchSimilarFeatures(query);
if (result.patterns.length === 0) {
  this.logger.warn('No patterns found, using defaults', { query }, 'rag');
  return {
    patterns: [],
    search_method: 'none',
    avg_effort: null // Caller provides fallback estimate
  };
}
```

### Gotcha 2: GraphRAG Initialization Timeout
**Problem**: GraphRAG.initialize() takes 5+ seconds on first call, blocks planning

**Solution**: Pre-initialize in background during startup
```typescript
// In framework startup (src/cli/index.ts):
import { graphRAGStore } from '@/lib/graphrag-store.js';
graphRAGStore.initialize().catch(err => {
  console.warn('GraphRAG pre-initialization failed', err);
});
```

### Gotcha 3: High Similarity Threshold Filters Too Much
**Problem**: `min_similarity: 0.90` too strict, returns 0 results

**Solution**: Use 0.75 default, adaptive retry at 0.60 (see Pattern 2 above)

## Performance Targets

- **Pattern search**: < 500ms (GraphRAG), < 1s (Vector), < 50ms (Local)
- **Cache hit**: < 10ms
- **Privacy filtering**: < 20ms

### Optimization Tips
- Cache results (15-min self-cleaning cache)
- Batch queries to reduce round trips
- Lazy load stores (don't initialize until first use)

## Testing Guidelines

### Coverage Requirements
- Minimum: 80% (Enhanced Maria-QA standard)
- Critical paths: 85%+ (search fallback chain)
- Focus: PatternSearchService.searchSimilarFeatures(), fallback logic

### Common Test Pattern
```typescript
describe('rag - PatternSearchService', () => {
  it('should fallback from GraphRAG to Vector store', async () => {
    // Mock GraphRAG to fail
    jest.spyOn(graphRAGStore, 'query').mockRejectedValue(new Error('GraphRAG unavailable'));

    // Mock Vector store to succeed
    jest.spyOn(vectorStore, 'search').mockResolvedValue({
      documents: [{ content: 'auth pattern', metadata: { feature_name: 'OAuth2' } }]
    });

    const result = await service.searchSimilarFeatures({ description: 'auth', min_similarity: 0.75 });

    expect(result.search_method).toBe('vector'); // Fallback used
    expect(graphRAGStore.query).toHaveBeenCalled(); // Tried GraphRAG first
  });
});
```

## Debugging Tips

### Common Issues
1. **GraphRAG not found**: Check Neo4j connection, verify `NEO4J_URI` env var
2. **Vector store empty**: Run `npm run rag:bootstrap` to seed initial patterns
3. **Low similarity scores**: Lower `min_similarity` to 0.60, check query phrasing

### Debug Logging
```typescript
// Enable debug mode
process.env.DEBUG = 'rag:*';

// Check which store was used
const result = await patternSearchService.searchSimilarFeatures(query);
console.log('Search method:', result.search_method); // 'graphrag', 'vector', 'local', 'none'
```

## Related Documentation

For detailed implementation guides:
- [references/pattern-search-api.md](references/pattern-search-api.md) - Complete API reference
- [references/graphrag-integration.md](references/graphrag-integration.md) - Neo4j setup and queries
- [references/vector-store-setup.md](references/vector-store-setup.md) - Supabase pgvector configuration
- [references/privacy-isolation.md](references/privacy-isolation.md) - Four-layer filtering implementation

For high-level guides:
- [docs/guides/compounding-engineering.md](../../../docs/guides/compounding-engineering.md) - 40% speedup methodology
- [docs/PATTERN_CODIFICATION.md](../../../docs/PATTERN_CODIFICATION.md) - Feedback → patterns workflow

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/rag/**`
