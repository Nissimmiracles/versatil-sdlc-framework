# Create Library claude.md Context Files (Top 15) - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical - enables per-library context)
- **Created**: 2025-10-26
- **Updated**: 2025-10-26
- **Assigned**: ALL agents (distributed by expertise)
- **Estimated Effort**: Medium (6 hours total, parallel execution)

## Description

Create `claude.md` context files for the top 15 priority libraries identified in task 012. Each file provides library-specific rules, conventions, patterns, and gotchas to help agents work correctly with that code.

## Acceptance Criteria

- [ ] **15 library claude.md files created** in their respective directories:
  ```
  src/agents/claude.md
  src/rag/claude.md
  src/orchestration/claude.md
  src/planning/claude.md
  src/templates/claude.md
  src/hooks/claude.md
  src/mcp/claude.md
  src/context/claude.md
  src/intelligence/claude.md
  src/learning/claude.md
  src/memory/claude.md
  src/testing/claude.md
  src/validation/claude.md
  src/ui/claude.md
  src/dashboard/claude.md
  ```

- [ ] **Each file follows template structure** from 012:
  - Purpose & scope (1-2 sentences)
  - Key concepts (3-5 bullet points)
  - Conventions & rules (5-10 numbered items)
  - Common usage patterns (2-3 code examples)
  - Important gotchas (3-5 warnings)
  - Related libraries
  - Testing requirements

- [ ] **Accurate and helpful content** - Not generic boilerplate:
  - Real code examples from the library
  - Actual conventions used in the codebase
  - True gotchas discovered from git history/issues
  - Specific file:line references

- [ ] **Consistent quality** across all 15 files:
  - Same level of detail
  - Same format/structure
  - Cross-references between related libraries

## Agent Assignments

### Marcus-Backend (2 files, 1.5 hours)
- **src/rag/claude.md** - RAG system, vector stores, pattern search
- **src/orchestration/claude.md** - Workflow orchestration, agent coordination

**Why Marcus**: Backend systems expert, understands RAG infrastructure and orchestration patterns.

### Dr.AI-ML (2 files, 1 hour)
- **src/intelligence/claude.md** - AI/ML features, adaptive learning
- **src/learning/claude.md** - Learning system, codification, feedback loops

**Why Dr.AI-ML**: ML specialist, owns intelligence and learning capabilities.

### Dana-Database (1 file, 30 minutes)
- **src/memory/claude.md** - Memory management, state persistence, caching

**Why Dana**: Database expert, understands memory/storage patterns.

### James-Frontend (2 files, 1 hour)
- **src/ui/claude.md** - UI components, React patterns, accessibility
- **src/dashboard/claude.md** - Dashboard features, charts, visualization

**Why James**: Frontend specialist, owns UI/UX components.

### Sarah-PM (2 files, 1 hour)
- **src/planning/claude.md** - Feature planning, todo generation, CODIFY phase
- **src/templates/claude.md** - Template system, matching algorithm

**Why Sarah**: Project management, owns planning and template systems.

### Alex-BA (1 file, 30 minutes)
- **src/agents/claude.md** - Agent definitions, OPERA framework, handoff contracts

**Why Alex**: Business analyst, understands agent responsibilities and contracts.

### Maria-QA (2 files, 1 hour)
- **src/testing/claude.md** - Test infrastructure, coverage requirements, Maria-QA patterns
- **src/validation/claude.md** - Quality gates, validation rules, contract validation

**Why Maria**: QA expert, owns testing and validation standards.

### Oliver-MCP (2 files, 1 hour)
- **src/mcp/claude.md** - MCP integration, server management, protocol
- **src/hooks/claude.md** - Event hooks, Native SDK integration, hook lifecycle

**Why Oliver**: MCP specialist, owns hook system and MCP orchestration.

### Victor-Verifier (1 file, 30 minutes)
- **src/context/claude.md** - Context management, three-layer system, preferences

**Why Victor**: Verification expert, meta-context for the context system itself.

## Dependencies

- **Depends on**: 012 (Context audit report and template must be complete)
- **Blocks**: 014 (Validate context injection - needs files to test)

## Implementation Notes

### Creation Process (Per Agent)

1. **Read the template** from `templates/context/library-claude.md.template`

2. **Analyze the library**:
   - Read existing code (2-3 key files)
   - Check git history for common changes
   - Review any existing README or docs
   - Look at tests for usage examples

3. **Fill in template sections**:
   - **Purpose**: What problem does this solve? (from README or main file comment)
   - **Key Concepts**: Extract from TypeScript interfaces/types
   - **Conventions**: Look for patterns (naming, structure, exports)
   - **Usage Patterns**: Copy actual code snippets from tests or examples
   - **Gotchas**: Check git blame, issue tracker, TODO comments
   - **Related Libraries**: Check imports and dependencies
   - **Testing**: Check test files, coverage requirements

4. **Cross-reference other libraries**:
   - Link to related claude.md files
   - Note dependencies and interactions

5. **Validate**:
   - Read it as if you're a new developer
   - Would this help you use the library correctly?
   - Are examples copy-pasteable?

### Quality Checklist (Each File)

- [ ] **Purpose** is clear and specific (not vague)
- [ ] **Key Concepts** are the 3-5 most important to understand
- [ ] **Conventions** are ACTUAL rules used in the code (not aspirational)
- [ ] **Usage Patterns** have working code examples (not pseudo-code)
- [ ] **Gotchas** are real footguns (checked git history)
- [ ] **Related Libraries** list is complete and accurate
- [ ] **Testing** requirements match actual test files
- [ ] **Examples** link to real files with line numbers

### Example: src/rag/claude.md Structure

```markdown
# RAG (Retrieval-Augmented Generation) - Context Guide

## Purpose
Provides pattern search and historical context retrieval using GraphRAG (preferred) and Vector stores (fallback) for Compounding Engineering.

## Key Concepts
- **PatternSearchService**: Singleton service for searching similar implementations
- **GraphRAG vs Vector**: GraphRAG is offline, no API quota; Vector needs Supabase
- **Fallback chain**: GraphRAG → Vector → Local (empty)
- **Historical Patterns**: Feature implementations with effort, lessons, code examples
- **Confidence scoring**: 0-100 based on similarity and success rate

## Conventions & Rules
1. **Always try GraphRAG first** - It's offline and has no API quota
2. **Lazy initialization** - Services don't load until first search
3. **Graceful degradation** - If RAG unavailable, return empty results (don't crash)
4. **Similarity threshold** - Default 0.75 (75%), adjustable via min_similarity param
5. **Export singletons** - Use `patternSearchService`, not `new PatternSearchService()`
6. **Error handling** - Catch and log, never throw to caller
7. **Result metadata** - Always include search_method ('graphrag', 'vector', 'none')

## Common Usage Patterns

### Pattern 1: Search Similar Features
\`\`\`typescript
import { patternSearchService } from './pattern-search.js';

const result = await patternSearchService.searchSimilarFeatures({
  description: 'Add user authentication',
  category: 'security',  // Optional filter
  min_similarity: 0.75,
  limit: 5
});

if (result.patterns.length > 0) {
  console.log(`Found ${result.patterns.length} similar features`);
  console.log(`Average effort: ${result.avg_effort}h`);
  console.log(`Top lesson: ${result.consolidated_lessons[0]}`);
}
\`\`\`
**When to use**: Feature planning, effort estimation, learning from past
**When NOT to use**: Real-time responses (can be slow), critical path operations

### Pattern 2: Custom Similarity Threshold
\`\`\`typescript
// For exploratory search, lower threshold
const exploratoryResult = await patternSearchService.searchSimilarFeatures({
  description: query,
  min_similarity: 0.5,  // Lower = more results, less precision
  limit: 10
});

// For production planning, higher threshold
const productionResult = await patternSearchService.searchSimilarFeatures({
  description: query,
  min_similarity: 0.85,  // Higher = fewer results, higher precision
  limit: 3
});
\`\`\`

## Important Gotchas
⚠️ **GraphRAG initialization can fail silently** - Check search_method in result
⚠️ **Vector store needs Supabase** - Will fallback to 'none' if not configured
⚠️ **Lazy loading means first search is slow** - Consider pre-warming in long-running processes
⚠️ **Patterns may be empty initially** - Bootstrap with examples from Every Inc patterns
⚠️ **similarity_score vs relevanceScore** - Different fields depending on source (GraphRAG vs Vector)

## Related Libraries
- **src/lib/graphrag-store.ts**: GraphRAG implementation
- **src/rag/enhanced-vector-memory-store.ts**: Vector store fallback
- **src/planning/**: Uses pattern search for effort estimation
- **src/templates/**: Combines with template matching
- **.versatil/learning/patterns/**: Storage location for patterns (44 files)

## Testing Requirements
- [ ] Unit test: searchSimilarFeatures with mock GraphRAG
- [ ] Unit test: Fallback to Vector store when GraphRAG fails
- [ ] Unit test: Empty results when no RAG available
- [ ] Integration test: Real search against .versatil/learning/patterns/
- [ ] Performance test: Search completes in <2 seconds

## Examples
- Implementation: `src/rag/pattern-search.ts:83-174`
- Tests: `tests/unit/rag/pattern-search.test.ts`
- Integration: `.claude/commands/plan.md:103-162` (CODIFY phase)
- Usage: `tests/integration/plan-command-e2e.test.ts:52-62`
```

## Files Involved

**To Create** (15 files):
- `src/agents/claude.md`
- `src/rag/claude.md`
- `src/orchestration/claude.md`
- `src/planning/claude.md`
- `src/templates/claude.md`
- `src/hooks/claude.md`
- `src/mcp/claude.md`
- `src/context/claude.md`
- `src/intelligence/claude.md`
- `src/learning/claude.md`
- `src/memory/claude.md`
- `src/testing/claude.md`
- `src/validation/claude.md`
- `src/ui/claude.md`
- `src/dashboard/claude.md`

**Reference**:
- `templates/context/library-claude.md.template` (from 012)
- `docs/context/LIBRARY_AUDIT_REPORT.md` (from 012)
- Existing code in each library

## Testing Requirements

**Per-file validation** (automated script):
```bash
# Check each claude.md has all required sections
for file in src/*/claude.md; do
  echo "Validating $file"

  grep -q "## Purpose" $file || echo "  ❌ Missing Purpose"
  grep -q "## Key Concepts" $file || echo "  ❌ Missing Key Concepts"
  grep -q "## Conventions & Rules" $file || echo "  ❌ Missing Conventions"
  grep -q "## Common Usage Patterns" $file || echo "  ❌ Missing Usage Patterns"
  grep -q "## Important Gotchas" $file || echo "  ❌ Missing Gotchas"
  grep -q "## Related Libraries" $file || echo "  ❌ Missing Related Libraries"
  grep -q "## Testing Requirements" $file || echo "  ❌ Missing Testing"

  echo "  ✅ Valid"
done
```

**Integration test** (014):
- Verify before-prompt hook loads library context
- Test with sample file from each library
- Ensure context appears in system message

## Potential Challenges

1. **Challenge**: Too generic - just copying template without real content
   **Mitigation**: Require specific code examples with file:line references

2. **Challenge**: Inconsistent quality across agents
   **Mitigation**: Sarah-PM reviews all files before marking task complete

3. **Challenge**: Outdated quickly as code changes
   **Mitigation**: Add "Last Updated" date, create review schedule (quarterly)

4. **Challenge**: Too long - agents get overwhelmed
   **Mitigation**: Keep under 200 lines per file, prioritize signal over noise

## Success Metrics

- [ ] All 15 files created
- [ ] Each file 100-200 lines (not too short, not too long)
- [ ] At least 2 code examples per file
- [ ] All sections present (validated by script)
- [ ] Cross-references between related libraries
- [ ] Sarah-PM review: All files approved for quality

---

**Next**: After completion, proceed to 014 (Validate context injection)

**Estimated Timeline**:
- Parallel execution: All agents work simultaneously
- Each agent: 30 min - 1.5 hours depending on complexity
- Total wall time: ~2 hours (parallel)
- Total effort: ~6 hours (sum of all agents)

**Generated**: 2025-10-26
**Assigned to**: ALL agents (see assignments above)
