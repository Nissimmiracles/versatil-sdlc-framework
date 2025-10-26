# Integrate Pattern Search Service into /plan Command - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical - Wave 3 integration)
- **Created**: 2025-10-26
- **Assigned**: Marcus-Backend + Sarah-PM
- **Estimated Effort**: Small (30 minutes)

## Description

Integrate the PatternSearchService into `.claude/commands/plan.md` Step 2 (CODIFY Phase) to enable automatic learning from historical feature implementations. This enables the core Compounding Engineering workflow where each feature makes the next 40% faster.

## Acceptance Criteria

- [ ] Import `patternSearchService` from `src/rag/pattern-search.js`
- [ ] Call `searchSimilarFeatures()` with feature description and filters
- [ ] Display "Historical Context" output section with patterns found
- [ ] Handle no-results scenario gracefully (show helpful message)
- [ ] Add error handling with try/catch (fallback to template/research)
- [ ] Extract and display: avg_effort, lessons, recommendations, confidence
- [ ] Support category filtering (auth, crud, dashboard, integration, file-upload)

## Context

- **Related Issue**: #001 - Enhance /plan Command
- **Parent Task**: #006 - Plan Command Integration
- **Related PR**: TBD
- **Files Involved**:
  - `.claude/commands/plan.md` (modify lines 103-150)
  - `src/rag/pattern-search.ts` (import and use)
- **References**:
  - Pattern Search Service spec: `todos/002-pending-p1-pattern-search-service.md`
  - Every Inc Compounding Engineering: https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it

## Dependencies

- **Depends on**: 002 - Pattern Search Service (implemented ✅)
- **Blocks**: 011 - Enhanced Output Format (needs pattern data)
- **Related to**: 009, 010 (parallel Wave 3 tasks)

## Implementation Notes

### Current Code (lines 103-150)
```markdown
### 2. Learn from Past Features (CODIFY Phase) ⭐ NEW

**Automated Pattern Search:**

Import and use the pattern search service:
```typescript
import { patternSearchService } from '@/rag/pattern-search';

const searchResult = await patternSearchService.searchSimilarFeatures({
  description: feature_description,
  category: detected_category,
  min_similarity: 0.75,
  limit: 5
});
```

### Enhanced Implementation

**Add Import Section** (top of file):
```typescript
import { patternSearchService } from '../../src/rag/pattern-search.js';
```

**Replace Placeholder with Real Call** (lines 112-127):
```typescript
let searchResult = null;
let hasHistoricalContext = false;

try {
  searchResult = await patternSearchService.searchSimilarFeatures({
    description: feature_description,
    category: detected_category, // auto-detect or from template
    min_similarity: 0.75,
    limit: 5
  });

  hasHistoricalContext = searchResult.patterns.length > 0;
} catch (error) {
  console.warn('Pattern search failed, continuing without historical context:', error);
  // Graceful degradation - continue with templates/research
}
```

**Enhanced Output Section** (lines 129-148):
```markdown
## Historical Context (Codified Learnings) 🎓

${hasHistoricalContext ? `
**Search Results**: Found ${searchResult.total_found} similar features (${searchResult.search_method})

**Top Patterns**:
${searchResult.patterns.slice(0, 3).map((p, i) => `
${i + 1}. **"${p.feature_name}"** (${Math.round(p.similarity_score * 100)}% similar)
   - Effort: ${p.effort_hours}h (range: ${p.effort_range.min}-${p.effort_range.max}h)
   - Success rate: ${p.success_score}%
   - Agent: ${p.agent}
   - Category: ${p.category}
`).join('\n')}

**Aggregated Insights**:
- 📊 **Average Effort**: ${searchResult.avg_effort}h (based on ${searchResult.patterns.length} features)
- 🎯 **Confidence**: ${searchResult.avg_confidence}%
- ⚠️ **Common Pitfalls**:
${searchResult.consolidated_lessons.slice(0, 3).map(l => `  - ${l}`).join('\n')}

**Recommendation**: ${searchResult.recommended_approach}

` : `
**No historical data found** - This appears to be a novel feature type. Plan will be based on templates and agent research. After implementation, this feature will become part of the historical knowledge base for future similar features.
`}
```

### Suggested Approach
1. Add import statement at top of `.claude/commands/plan.md`
2. Replace placeholder code with actual service call (with try/catch)
3. Update output section to display real pattern data
4. Test with feature that has historical patterns
5. Test with novel feature (no patterns)
6. Verify graceful degradation on service failure

### Potential Challenges
- **Challenge**: RAG store may be empty initially (first-time usage)
  - **Mitigation**: Show helpful message encouraging user to complete features so they become patterns

- **Challenge**: Service initialization failure (missing dependencies)
  - **Mitigation**: Wrap in try/catch, continue with templates/research, log warning

## Testing Requirements

- [ ] Manual test: "Add user authentication" (should find patterns if RAG has auth data)
- [ ] Manual test: "Quantum blockchain feature" (should gracefully handle no results)
- [ ] Manual test: Verify error handling if service fails
- [ ] Verify output formatting is clean and readable
- [ ] Check that avg_effort and confidence are displayed correctly

## Documentation Updates

- [ ] Inline comments in plan.md explaining the CODIFY phase
- [ ] Update command description at top of plan.md
- [ ] Add note about first-time usage (no historical data initially)

---

## Resolution Checklist

When marking as resolved:

1. ✅ PatternSearchService imported successfully
2. ✅ searchSimilarFeatures() call working
3. ✅ Historical Context section displays correctly
4. ✅ Error handling implemented
5. ✅ Manual testing complete (with/without patterns)
6. ✅ No TypeScript errors

**Resolution Steps**:
```bash
# Test the integration
/plan "Add user authentication"
# Should show historical context if patterns exist

# Test graceful degradation
/plan "Novel feature xyz"
# Should show "No historical data" message

# Mark as resolved
mv todos/008-pending-p1-integrate-pattern-search-service.md todos/008-resolved-integrate-pattern-search-service.md
```

---

## Notes

**Integration Priority**: HIGHEST - This is the core CODIFY functionality that enables 40% faster planning via Compounding Engineering.

**Expected Impact**:
- 40% faster planning (based on Every Inc results)
- ±10-20% effort accuracy (vs ±50% without history)
- Avoid repeating past mistakes
- Direct code reuse via file:line references

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD
