# rag/ - Retrieval-Augmented Generation System

**Priority**: HIGH
**Agent(s)**: Marcus-Backend (primary owner), Dr.AI-ML, Oliver-MCP
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Provides RAG (Retrieval-Augmented Generation) capabilities for historical pattern search, effort estimation, and context-aware code generation. Implements GraphRAG (knowledge graph) with vector store fallback and local in-memory search. Core enabler for Compounding Engineering (40% faster development with historical context).

## 🎯 Core Concepts

### Key Abstractions
- **PatternSearchService**: Queries historical implementations for similar features
- **EnhancedVectorMemoryStore**: Supabase pgvector + semantic search
- **GraphRAG Store**: Neo4j knowledge graph with relationship-based queries
- **HistoricalPattern**: Feature implementation with effort, lessons, code examples
- **RAGQuery**: Semantic/hybrid/keyword search with filters and reranking

### Design Patterns Used
- **Fallback Chain**: GraphRAG → Vector Store → Local → None (graceful degradation)
- **Singleton Pattern**: Export patternSearchService singleton
- **Privacy Isolation**: User > Team > Project > Public (four-layer separation)
- **Lazy Initialization**: Only load stores on first search (faster startup)

## 📁 File Organization

```
src/rag/
├── pattern-search.ts                 # PatternSearchService (main API)
├── enhanced-vector-memory-store.ts   # Supabase pgvector integration
├── graphrag-store.ts                 # Neo4j GraphRAG implementation
├── rag-query-builder.ts              # Query DSL for semantic search
├── pattern-codifier.ts               # Converts feedback → patterns
└── types.ts                          # TypeScript interfaces
```

## ✅ Development Rules

### DO ✓
- ✓ **Always use fallback chain** - GraphRAG preferred, but gracefully degrade to Vector → Local
- ✓ **Lazy initialize stores** - call `initialize()` on first search, not constructor
- ✓ **Respect privacy isolation** - filter results by access level (user/team/project/public)
- ✓ **Cache search results** - use 15-minute cache for repeated queries
- ✓ **Log search methods** - track which store was used (graphrag/vector/local/none)
- ✓ **Calculate aggregated insights** - avg_effort, consolidated_lessons, recommended_approach

### DON'T ✗
- ✗ **Don't skip fallback logic** - always try all 3 stores before returning empty
- ✗ **Don't expose private patterns** - enforce User > Team > Project > Public filtering
- ✗ **Don't query without min_similarity** - default 0.75 prevents low-quality matches
- ✗ **Don't hardcode effort estimates** - always derive from historical data
- ✗ **Don't block on RAG failures** - gracefully return empty results, log warning

## 🔧 Common Patterns

### Pattern 1: Search Similar Features
**When to use**: Planning new feature, need historical context for effort estimation

```typescript
import { patternSearchService, PatternSearchQuery } from '@/rag/pattern-search.js';

const query: PatternSearchQuery = {
  description: 'Add user authentication with JWT tokens',
  agent: 'Marcus-Backend', // Optional filter
  category: 'Security', // Optional filter
  limit: 5,
  min_similarity: 0.75 // 75%+ similarity required
};

const result = await patternSearchService.searchSimilarFeatures(query);

// Result structure:
// {
//   patterns: [
//     {
//       feature_name: 'OAuth2 Authentication',
//       effort_hours: 24,
//       effort_range: { min: 20, max: 28 },
//       confidence: 90,
//       similarity_score: 0.87,
//       lessons_learned: ['Use bcrypt for passwords', 'JWT tokens in httpOnly cookies'],
//       code_examples: [{ file: 'auth-service.ts', lines: '42-100', description: 'JWT generation' }]
//     }
//   ],
//   total_found: 3,
//   search_method: 'graphrag', // or 'vector', 'local', 'none'
//   avg_effort: 26, // Average of 24, 28, 26
//   avg_confidence: 85,
//   consolidated_lessons: ['Use bcrypt', 'httpOnly cookies', 'Rate limiting'],
//   recommended_approach: 'Based on 3 similar implementations (avg 26h), recommend following OAuth2 Authentication (87% similar, 24h effort)'
// }

console.log(`Found ${result.total_found} similar features (via ${result.search_method})`);
console.log(`Estimated effort: ${result.avg_effort} hours`);
console.log(`Key lessons: ${result.consolidated_lessons.join(', ')}`);
```

### Pattern 2: Vector Store Semantic Search
**When to use**: GraphRAG not available, need semantic similarity search

```typescript
import { EnhancedVectorMemoryStore, RAGQuery } from '@/rag/enhanced-vector-memory-store.js';

const vectorStore = new EnhancedVectorMemoryStore();

const query: RAGQuery = {
  query: 'authentication JWT bcrypt',
  queryType: 'semantic', // or 'hybrid', 'keyword'
  agentId: 'Marcus-Backend',
  topK: 5,
  rerank: true, // Use reranking for better results
  filters: {
    tags: ['Security', 'Authentication'],
    dateRange: { start: new Date('2024-01-01'), end: new Date() }
  }
};

const result = await vectorStore.search(query);

// result.documents: [
//   {
//     content: 'Implement JWT authentication...',
//     metadata: {
//       feature_name: 'OAuth2 Auth',
//       effort_hours: 24,
//       relevanceScore: 0.87
//     }
//   }
// ]
```

### Pattern 3: Privacy-Isolated Search
**When to use**: Ensuring patterns are filtered by access level

```typescript
import { patternSearchService } from '@/rag/pattern-search.js';

// Search with user-specific context
const result = await patternSearchService.searchSimilarFeatures({
  description: 'Add payment processing',
  limit: 5,
  min_similarity: 0.75
});

// Automatic privacy filtering:
// 1. User patterns (private to this user)
// 2. Team patterns (shared with team members)
// 3. Project patterns (shared with project contributors)
// 4. Framework patterns (public to all)

// Patterns are filtered based on current user context
// (injected via before-prompt hook)
```

## ⚠️ Gotchas & Edge Cases

### Gotcha 1: Empty Results from All Stores
**Problem**: GraphRAG fails, Vector store empty, Local fallback has no data → returns empty array
**Solution**: Bootstrap Local store with example patterns from VERSATIL codebase

```typescript
// ❌ Bad - Empty results break planning
const result = await patternSearchService.searchSimilarFeatures(query);
if (result.patterns.length === 0) {
  throw new Error('No patterns found'); // Breaks workflow
}

// ✅ Good - Graceful fallback with defaults
const result = await patternSearchService.searchSimilarFeatures(query);
if (result.patterns.length === 0) {
  this.logger.warn('No historical patterns found, using defaults', { query }, 'rag');
  return {
    patterns: [],
    search_method: 'none',
    avg_effort: null, // Caller provides fallback estimate
    consolidated_lessons: []
  };
}
```

### Gotcha 2: High Similarity Threshold Filters Too Much
**Problem**: `min_similarity: 0.90` too strict, returns 0 results even for good matches
**Solution**: Use 0.75 as default, adjust down to 0.60 if no results

```typescript
// ❌ Bad - Too strict threshold
const result = await patternSearchService.searchSimilarFeatures({
  description: 'authentication',
  min_similarity: 0.95 // Almost never matches
});

// ✅ Good - Adaptive threshold
let result = await patternSearchService.searchSimilarFeatures({
  description: 'authentication',
  min_similarity: 0.75
});

if (result.patterns.length === 0) {
  // Retry with lower threshold
  result = await patternSearchService.searchSimilarFeatures({
    description: 'authentication',
    min_similarity: 0.60
  });
}
```

### Gotcha 3: GraphRAG Initialization Timeout
**Problem**: GraphRAG.initialize() takes 5+ seconds on first call, blocks planning
**Solution**: Initialize GraphRAG in background during framework startup

```typescript
// ❌ Bad - Blocks first planning request
const result = await patternSearchService.searchSimilarFeatures(query);
// First call waits 5 seconds for GraphRAG.initialize()

// ✅ Good - Pre-initialize in background
// In framework startup (src/cli/index.ts):
import { graphRAGStore } from '@/lib/graphrag-store.js';
graphRAGStore.initialize().catch(err => {
  console.warn('GraphRAG pre-initialization failed', err);
});
```

## 🧪 Testing Guidelines

### Test Structure
```typescript
describe('rag - PatternSearchService', () => {
  let service: PatternSearchService;

  beforeEach(() => {
    service = new PatternSearchService();
  });

  describe('searchSimilarFeatures', () => {
    it('should search via GraphRAG first, then Vector fallback', async () => {
      // Arrange
      const query: PatternSearchQuery = {
        description: 'authentication JWT',
        limit: 5,
        min_similarity: 0.75
      };

      // Mock GraphRAG to fail
      jest.spyOn(graphRAGStore, 'query').mockRejectedValue(new Error('GraphRAG unavailable'));

      // Mock Vector store to succeed
      jest.spyOn(vectorStore, 'search').mockResolvedValue({
        documents: [
          { content: 'auth pattern', metadata: { feature_name: 'OAuth2', effort_hours: 24 } }
        ]
      });

      // Act
      const result = await service.searchSimilarFeatures(query);

      // Assert
      expect(result.search_method).toBe('vector'); // Fallback used
      expect(result.patterns).toHaveLength(1);
      expect(graphRAGStore.query).toHaveBeenCalled(); // Tried GraphRAG first
      expect(vectorStore.search).toHaveBeenCalled(); // Then Vector
    });
  });
});
```

### Common Test Patterns
- **Unit tests**: Test search logic, fallback chain, aggregation calculations
- **Integration tests**: Test with real Vector store (Supabase test instance)
- **Mock patterns**: Mock GraphRAG/Vector stores to control fallback behavior

### Coverage Requirements
- Minimum: 80% (Enhanced Maria-QA standard)
- Critical paths: 85%+ (search fallback chain)
- Focus areas: PatternSearchService.searchSimilarFeatures(), fallback logic

## 🔗 Dependencies

### Internal Dependencies
- **lib/graphrag-store.js**: Neo4j GraphRAG implementation
- **utils/logger.js**: VERSATILLogger for structured logging

### External Dependencies
- **@supabase/supabase-js**: Supabase client for pgvector
- **neo4j-driver**: Neo4j driver for GraphRAG (optional)

## 🎨 Code Style Preferences

### Naming Conventions
- **Services**: PascalCase with "Service" suffix (e.g., `PatternSearchService`)
- **Interfaces**: PascalCase (e.g., `HistoricalPattern`, `RAGQuery`)
- **Singletons**: camelCase (e.g., `patternSearchService`, `graphRAGStore`)
- **Enums**: PascalCase (e.g., `SearchMethod`)

### Async Patterns
- **Preferred**: async/await
- **All search methods**: `search(query): Promise<Result>`

### Error Handling
```typescript
try {
  const patterns = await patternSearchService.searchSimilarFeatures(query);
} catch (error) {
  this.logger.error('Pattern search failed', { error, query }, 'rag');
  // Graceful fallback - return empty results, don't throw
  return { patterns: [], search_method: 'none', avg_effort: null };
}
```

## 📊 Performance Considerations

### Performance Targets
- Pattern search: < 500ms (GraphRAG), < 1s (Vector), < 50ms (Local)
- Cache hit: < 10ms
- Privacy filtering: < 20ms

### Optimization Tips
- **Cache results**: 15-minute cache for repeated queries (self-cleaning)
- **Batch queries**: Group similar searches to reduce round trips
- **Lazy load stores**: Don't initialize GraphRAG/Vector until first use

## 🔍 Debugging Tips

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
console.log('Search method:', result.search_method); // 'graphrag', 'vector', 'local', or 'none'
```

## 📚 Related Documentation

- [GraphRAG Implementation](../../docs/GRAPHRAG.md)
- [Compounding Engineering Guide](../../docs/guides/compounding-engineering.md)
- [Pattern Codification](../../docs/PATTERN_CODIFICATION.md)
- [RAG Validation Report](.versatil/learning/rag-validation-report-CORRECTED.md)

## 🚀 Quick Start Example

```typescript
import { patternSearchService } from '@/rag/pattern-search.js';

// Search for similar authentication implementations
const result = await patternSearchService.searchSimilarFeatures({
  description: 'Add JWT authentication with bcrypt passwords',
  limit: 5,
  min_similarity: 0.75
});

if (result.patterns.length > 0) {
  console.log(`Found ${result.patterns.length} similar features:`);
  result.patterns.forEach(p => {
    console.log(`- ${p.feature_name}: ${p.effort_hours}h (${Math.round(p.similarity_score * 100)}% similar)`);
    console.log(`  Lessons: ${p.lessons_learned.join(', ')}`);
  });

  console.log(`\nEstimated effort: ${result.avg_effort}h`);
  console.log(`Recommendation: ${result.recommended_approach}`);
} else {
  console.log('No historical patterns found - using default estimates');
}
```

## 🔄 Migration Notes

### From v6.5.0 to v6.6.0
- **New**: Added library context system - RAG now injects library-specific patterns
- **Enhanced**: Privacy isolation with four-layer filtering (User > Team > Project > Public)
- **Breaking**: `min_similarity` now defaults to 0.75 (was 0.60)

### Deprecation Warnings
- **SimpleVectorStore**: Deprecated - use EnhancedVectorMemoryStore instead (removal in v7.0.0)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('rag')`
**Priority Layer**: User Preferences > **Library Context** > Team Conventions > Framework Defaults
