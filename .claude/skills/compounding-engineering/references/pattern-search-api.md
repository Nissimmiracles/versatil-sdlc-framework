# Pattern Search Service - Complete API Reference

## Store Routing Chain

**Intelligent fallback**:
1. **GraphRAG (Neo4j)** - Preferred
   - No API quota limits
   - Works offline
   - Graph-based similarity
   - Fast: ~200-500ms

2. **Vector Store (Supabase pgvector)** - Fallback
   - Cloud-based
   - Embedding similarity search
   - Requires internet
   - Medium: ~1-2s

3. **Local In-Memory** - Last Resort
   - Keyword matching only
   - Always available
   - Basic similarity
   - Fast: ~50-100ms

4. **Empty/None** - Graceful Degradation
   - Returns empty results
   - Never crashes
   - Enables template-based planning

## Anti-Hallucination Quality Gates

**5 Validation Checks**:

1. **Feature Name Exists** - Not null/empty
2. **Realistic Effort** - 1-1000 hours (catches 0, null, 999999)
3. **Lessons Learned** - Has actual content (not empty array)
4. **Valid File Paths** - Code examples reference real files
5. **Similarity Range** - Scores 0.0-1.0 (catches invalid scores)

**Minimum Completeness**: 50% of fields must be valid

## Quality Scoring

**Score Calculation**: 0-100 based on pattern completeness

- 90-100: Excellent (all fields complete, verified)
- 70-89: Good (minor gaps, still useful)
- 50-69: Fair (usable but incomplete)
- <50: Poor (too many gaps, not recommended)

**Verification Status**:
- `verified` - Quality ≥90, all gates passed
- `degraded` - Quality 50-89, some gaps
- `unavailable` - Quality <50 or critical failures

## Complete API Specification

### Input Parameters

```typescript
interface PatternSearchQuery {
  description: string;       // Feature description
  category?: string;         // Optional: auth, api, ui, database
  min_similarity?: number;   // Default: 0.75 (75%)
  limit?: number;           // Default: 5
}
```

### Output Format

```typescript
interface PatternSearchResult {
  query: string;
  category?: string;
  patterns: Pattern[];       // Top matches
  total_found: number;
  search_method: 'graphrag' | 'vector' | 'local' | 'none';
  quality_score: number;     // 0-100
  verification_status: 'verified' | 'degraded' | 'unavailable';
  avg_effort?: number;       // Average hours
  avg_confidence?: number;   // Average confidence
  confidence_interval?: {
    lower: number;
    upper: number;
    confidence: number;      // 0.95 = 95%
  };
  consolidated_lessons: string[];
  recommended_approach: string;
  issues: string[];         // Any warnings/errors
}

interface Pattern {
  feature_name: string;
  similarity_score: number;  // 0.0-1.0
  effort_hours: number;
  effort_range: {
    min: number;
    max: number;
  };
  success_score: number;     // Percentage
  agent: string;             // Which agent built it
  lessons_learned: string[];
  warnings: string[];
  code_examples?: CodeExample[];
}
```

## Usage Examples

**Basic Search**:
```bash
npx tsx execute-pattern-search.ts \
  --description "Add user authentication"
```

**Category-Filtered Search**:
```bash
npx tsx execute-pattern-search.ts \
  --description "JWT token validation" \
  --category "auth" \
  --min-similarity 0.8
```

**Limit Results**:
```bash
npx tsx execute-pattern-search.ts \
  --description "REST API with CRUD" \
  --limit 3
```

## Error Scenarios

**GraphRAG Unavailable**:
```json
{
  "search_method": "vector",
  "issues": ["GraphRAG initialization failed, using vector store fallback"]
}
```

**All Stores Failed**:
```json
{
  "patterns": [],
  "search_method": "none",
  "quality_score": 0,
  "recommended_approach": "Proceed with template-based planning"
}
```

## Performance Benchmarks

| Store | Avg Latency | Success Rate | Offline |
|-------|-------------|--------------|---------|
| GraphRAG | 350ms | 95% | ✅ Yes |
| Vector | 1.5s | 98% | ❌ No |
| Local | 75ms | 100% | ✅ Yes |

**Recommendation**: Always try GraphRAG first for speed + offline capability
