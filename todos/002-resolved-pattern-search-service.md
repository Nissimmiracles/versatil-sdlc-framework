# Pattern Search Service - CODIFY Phase Integration - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical - Core CODIFY functionality)
- **Created**: 2025-10-26
- **Assigned**: Marcus-Backend + Dr.AI-ML
- **Estimated Effort**: Medium (2 hours)

## Description

Create the Pattern Search Service that queries historical feature implementations from RAG storage (GraphRAG + Supabase Vector Store) to provide historical context, effort estimates, and lessons learned for feature planning. This enables the CODIFY phase of the Compounding Engineering workflow.

## Acceptance Criteria

- [ ] Create `src/rag/pattern-search.ts` with complete type definitions
- [ ] Implement `searchSimilarFeatures()` using GraphRAG first, Vector store fallback
- [ ] Calculate average effort from historical patterns (min/max/confidence)
- [ ] Consolidate lessons learned across similar features
- [ ] Generate recommended approach based on pattern analysis
- [ ] Return top 5 most similar features with similarity scores (0-1)
- [ ] Handle no-results gracefully (fallback to conservative estimates)
- [ ] Unit tests with mock historical data (80%+ coverage)

## Context

- **Related Issue**: #001 - Enhance /plan Command
- **Related PR**: TBD
- **Files Involved**:
  - `src/rag/pattern-search.ts` (new - ~300 lines)
  - `tests/rag/pattern-search.test.ts` (new - ~200 lines)
  - `src/lib/graphrag-store.ts` (existing - use for entity-based search)
  - `src/rag/enhanced-vector-memory-store.ts` (existing - use for semantic search)
- **References**:
  - GraphRAG implementation: `src/lib/graphrag-store.ts`
  - Vector store implementation: `src/rag/enhanced-vector-memory-store.ts`
  - Learning codifier: `src/workflows/learning-codifier.ts`

## Dependencies

- **Depends on**: None (standalone service)
- **Blocks**:
  - 005 - Integration tests need this service
  - 006 - Plan command integration needs this service
- **Related to**: 001 - Master enhancement task

## Implementation Notes

### Type Definitions Required

```typescript
export interface HistoricalPattern {
  feature_name: string;
  implementation_path: string;
  effort_hours: number;
  effort_range: { min: number; max: number };
  confidence: number; // 0-100
  success_score: number; // 0-100
  lessons_learned: string[];
  code_examples: Array<{
    file: string;
    lines: string;
    description: string;
  }>;
  risks: {
    high: string[];
    medium: string[];
    low: string[];
  };
  agent: string;
  category: string;
  timestamp: number;
  similarity_score: number; // 0-1
}

export interface PatternSearchQuery {
  description: string;
  agent?: string;
  category?: string;
  limit?: number; // default: 5
  min_similarity?: number; // default: 0.75
}

export interface PatternSearchResult {
  patterns: HistoricalPattern[];
  total_found: number;
  search_method: 'graphrag' | 'vector' | 'local' | 'none';
  avg_effort: number | null;
  avg_confidence: number | null;
  consolidated_lessons: string[];
  recommended_approach: string | null;
}
```

### Suggested Approach

1. **Create PatternSearchService class**
   - Import GraphRAGStore and EnhancedVectorMemoryStore
   - Initialize stores on first use (lazy initialization)
   - Prefer GraphRAG (no API quota) over Vector store

2. **Implement searchSimilarFeatures() method**
   - Query GraphRAG store by entities/keywords first
   - Fallback to Vector store semantic search
   - Rank results by similarity score
   - Filter by min_similarity threshold (default: 0.75)
   - Return top N results (default: 5)

3. **Implement pattern analysis helpers**
   - `calculateAverageEffort()` - avg, min, max from historical data
   - `calculateConfidence()` - based on number of patterns and variance
   - `consolidateLessons()` - deduplicate and prioritize lessons
   - `generateRecommendation()` - suggest approach based on patterns

4. **Handle edge cases**
   - No patterns found → return null with 'none' search method
   - Low confidence → return conservative estimate with wide range
   - Single pattern → use exact values but lower confidence
   - Multiple patterns → average with confidence based on consistency

### Potential Challenges

- **Challenge**: GraphRAG may not have historical data initially
  - **Mitigation**: Bootstrap with example patterns, use Vector store fallback, provide clear "no data" messaging

- **Challenge**: Pattern similarity scoring accuracy
  - **Mitigation**: Use multiple scoring factors (keywords, category, agent), weight by recency

- **Challenge**: Lesson consolidation (duplicates, contradictions)
  - **Mitigation**: Deduplicate by similarity, prioritize by success_score, flag conflicts

## Testing Requirements

- [ ] Unit test: Search with mock GraphRAG data (5 patterns)
- [ ] Unit test: Fallback to Vector store when GraphRAG empty
- [ ] Unit test: Filter by category (auth, crud, dashboard)
- [ ] Unit test: Filter by agent (Marcus, James, Dana)
- [ ] Unit test: Calculate average effort (3 patterns: 8h, 12h, 10h → avg: 10h, range: 8-12h)
- [ ] Unit test: Calculate confidence (high variance → lower confidence)
- [ ] Unit test: Consolidate lessons (remove duplicates, rank by frequency)
- [ ] Unit test: Handle no results (return null gracefully)
- [ ] Unit test: Handle single result (exact values, medium confidence)
- [ ] Integration test: Real GraphRAG query (if store available)

## Documentation Updates

- [ ] Add JSDoc comments to all exported interfaces
- [ ] Add inline comments for complex algorithms (similarity scoring, consolidation)
- [ ] Add usage examples in file header
- [ ] Update `docs/architecture/rag-system.md` with pattern search flow

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 8 acceptance criteria met
2. ✅ All unit tests passing (80%+ coverage)
3. ✅ Code reviewed by Maria-QA
4. ✅ JSDoc comments added
5. ✅ No TypeScript errors
6. ✅ Integrated with GraphRAG and Vector stores

**Resolution Steps**:
```bash
# Run tests
npm run test:unit -- pattern-search.test.ts

# Check coverage
npm run test:coverage -- pattern-search.test.ts

# Mark as resolved
mv todos/002-pending-p1-pattern-search-service.md todos/002-resolved-pattern-search-service.md
```

---

## Notes

**Implementation Priority**: HIGH - This is the core CODIFY functionality that enables compounding engineering. Without historical pattern search, plans won't improve over time.

**Integration Points**:
- Called from `.claude/commands/plan.md` Step 2 (CODIFY phase)
- Uses existing `graphRAGStore` from `src/lib/graphrag-store.ts`
- Uses existing `EnhancedVectorMemoryStore` from `src/rag/enhanced-vector-memory-store.ts`
- Results displayed in plan output "Historical Context" section

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD
