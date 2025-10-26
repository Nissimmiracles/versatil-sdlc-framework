# Plan Command Integration - Main Integration - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical - Main integration)
- **Created**: 2025-10-26
- **Assigned**: Sarah-PM + Alex-BA + Marcus-Backend
- **Estimated Effort**: Medium (2 hours)

## Description

Integrate all three services (Pattern Search, Template Matcher, Todo Generator) into `.claude/commands/plan.md` and enhance the output format with confidence scores, risk assessment, and alternative approaches. This is the final integration that brings everything together.

## Acceptance Criteria

- [ ] Modify `.claude/commands/plan.md` Step 2 (CODIFY phase integration)
- [ ] Modify `.claude/commands/plan.md` Step 3 (Template matching logic)
- [ ] Modify `.claude/commands/plan.md` Step 7 (Dual todo generation)
- [ ] Modify `.claude/commands/plan.md` Step 8 (Enhanced output format)
- [ ] Add confidence scoring logic (weighted: template 40% + patterns 40% + research 20%)
- [ ] Add risk assessment section (consolidated from template + patterns)
- [ ] Add alternative approaches section (from template + agent research)
- [ ] Add "Plan Source" section (template used, patterns found, customizations)
- [ ] Add timeline/sprint breakdown
- [ ] Manual testing with all 5 templates

## Context

- **Related Issue**: #001 - Enhance /plan Command
- **Related PR**: TBD
- **Files Involved**:
  - `.claude/commands/plan.md` (modify - existing ~500 lines → ~700 lines)
  - `src/rag/pattern-search.ts` (import and use)
  - `src/templates/template-matcher.ts` (import and use)
  - `src/planning/todo-file-generator.ts` (import and use)
- **References**:
  - Current plan.md: `.claude/commands/plan.md`
  - Every Inc Compounding Engineering: https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it

## Dependencies

- **Depends on**:
  - 002 - Pattern Search Service (must be implemented)
  - 003 - Template Matcher Service (must be implemented)
  - 004 - Todo File Generator (must be implemented)
  - 005 - Integration Tests (services should be tested first)
- **Blocks**:
  - 007 - Documentation updates (document final implementation)
- **Related to**: 001 - Master enhancement task

## Implementation Notes

### Step 2 Modification: CODIFY Phase Integration

**Current** (lines 103-133):
```markdown
### 2. Learn from Past Features (CODIFY Phase)

**RAG Pattern Search:**
Query vector store for similar features:
- [ ] Search feature_implementations domain with description
- [ ] Retrieve top 5 similar features (≥75% similarity)
...
```

**Enhanced**:
```markdown
### 2. Learn from Past Features (CODIFY Phase)

<thinking>
Use PatternSearchService to query historical implementations and extract learnings.
</thinking>

**Import and Initialize**:
```typescript
import { PatternSearchService } from '../../src/rag/pattern-search.js';
const patternSearch = new PatternSearchService();
```

**Execute Pattern Search**:
```typescript
const patterns = await patternSearch.searchSimilarFeatures({
  description: feature_description,
  limit: 5,
  min_similarity: 0.75
});

if (patterns.patterns.length > 0) {
  // Display historical context
  console.log(`Found ${patterns.total_found} similar features`);
  console.log(`Average effort: ${patterns.avg_effort} hours`);
  console.log(`Consolidated lessons: ${patterns.consolidated_lessons.join(', ')}`);
}
```

**Historical Context Output**:
[Display patterns.patterns with effort estimates, lessons learned, code examples]
```

### Step 3 Modification: Template Matching Logic

**Current** (lines 134-160):
```markdown
### 3. Check Plan Templates

**Available Templates:**
- `auth-system.yaml` - OAuth2, JWT, password hashing (28 hours)
...
```

**Enhanced**:
```markdown
### 3. Check Plan Templates

<thinking>
Use TemplateMatcher to automatically match feature description to templates.
</thinking>

**Import and Initialize**:
```typescript
import { TemplateMatcher } from '../../src/templates/template-matcher.js';
const matcher = new TemplateMatcher();
```

**Execute Template Matching**:
```typescript
// Check for explicit template selection
const explicitTemplate = flags.template; // From --template=NAME

const matchResult = await matcher.matchTemplate({
  description: feature_description,
  explicit_template: explicitTemplate
});

if (matchResult.use_template) {
  console.log(`Matched template: ${matchResult.best_match.template_name}`);
  console.log(`Match score: ${matchResult.best_match.match_score}%`);
  console.log(`Estimated effort: ${matchResult.best_match.estimated_effort.hours} hours`);

  // Load and customize template
  const template = await matcher.loadTemplate(matchResult.best_match.template_path);
  // Merge with project-specific requirements
}
```

**Template Match Output**:
[Display matched template, score, customizations]
```

### Step 7 Modification: Dual Todo Generation

**Current** (lines 324-370):
```markdown
### 7. Create Dual Todo System

**TodoWrite (In-Session Tracking):**
- [ ] Create TodoWrite with top-level phases
...

**todos/*.md Files (Persistent Tracking):**
- [ ] Create numbered files (001-pending-p1-description.md)
...
```

**Enhanced**:
```markdown
### 7. Create Dual Todo System

<thinking>
Use TodoFileGenerator to create both TodoWrite items and persistent files.
</thinking>

**Import and Initialize**:
```typescript
import { TodoFileGenerator } from '../../src/planning/todo-file-generator.js';
const todoGen = new TodoFileGenerator();
```

**Execute Todo Generation**:
```typescript
// Build TodoFileSpec array from plan breakdown
const todoSpecs = [
  {
    title: 'Database Schema Implementation',
    priority: 'p1',
    assigned_agent: 'Dana-Database',
    estimated_effort: 'Medium',
    acceptance_criteria: [...],
    dependencies: { depends_on: [], blocks: ['002'] },
    implementation_notes: '...',
    files_involved: ['supabase/migrations/...'],
    context: { feature_description, related_issue: '#123' }
  },
  // ... more todos
];

// Generate files and TodoWrite items
const result = await todoGen.generateTodos(todoSpecs);

console.log(`Created ${result.files_created.length} todo files`);
console.log(`Total estimated effort: ${result.total_estimated_hours} hours`);
console.log(`Dependency graph:\n${result.dependency_graph}`);

// Create TodoWrite with links to files
TodoWrite({
  todos: result.todowrite_items
});
```

**Dual Todo Output**:
[Display created files, TodoWrite items, dependency graph]
```

### Step 8 Modification: Enhanced Output Format

**Add new sections** to plan output:

1. **Executive Summary** (with confidence score)
```markdown
## Executive Summary
[Brief description]
**Confidence: ${confidence.score}%** (based on ${basis})
**Estimated Effort**: ${avg_effort} hours ± ${variance} hours
```

2. **Historical Context** (from pattern search)
```markdown
## Historical Context (Codified Learnings)
${patterns.patterns.map(p => `
- ✅ Similar feature: "${p.feature_name}" took ${p.effort_hours} hours (${p.similarity_score * 100}% similar)
- ⚠️ Common pitfall: ${p.lessons_learned.filter(l => l.type === 'warning').join(', ')}
- ✅ Proven pattern: ${p.lessons_learned.filter(l => l.type === 'success').join(', ')}
- 📚 Code examples: ${p.code_examples.map(ex => `${ex.file}:${ex.lines}`).join(', ')}
`).join('\n')}
```

3. **Plan Source** (transparency)
```markdown
## Plan Source
- **Template Used**: ${matchResult.best_match?.template_name || 'None'} (match: ${matchResult.best_match?.match_score || 0}%)
- **Historical Patterns**: ${patterns.total_found} similar features found
- **Agent Research**: ${agents_used.join(', ')}
- **Customizations**: ${customizations.join(', ')}
```

4. **Risk Assessment** (consolidated)
```markdown
## Risk Assessment
- **High Risk**: ${risks.high.map(r => `${r.risk} (mitigation: ${r.mitigation})`).join('\n  - ')}
- **Medium Risk**: ${risks.medium.map(r => `${r.risk} (mitigation: ${r.mitigation})`).join('\n  - ')}
- **Low Risk**: ${risks.low.map(r => `${r.risk} (mitigation: ${r.mitigation})`).join('\n  - ')}
```

5. **Alternative Approaches** (from template + agents)
```markdown
## Alternative Approaches Considered
${alternatives.map((alt, i) => `
${i + 1}. **${alt.name}**
   - Pros: ${alt.pros.join(', ')}
   - Cons: ${alt.cons.join(', ')}
   - Effort: ${alt.effort}
`).join('\n')}

**Recommended**: ${recommended.name} (reason: ${recommended.reason})
```

6. **Confidence Analysis**
```markdown
## Confidence Analysis
- **Score**: ${confidence.score}%
- **Basis**:
  - Template match: ${template_confidence}% (weight: 40%)
  - Historical patterns: ${pattern_confidence}% (weight: 40%)
  - Agent research quality: ${research_confidence}% (weight: 20%)
- **Reliability**: ${reliability}
- **Recommendation**: ${recommendation}
```

### Confidence Scoring Algorithm

```typescript
function calculateConfidence(
  templateMatch: TemplateMatchResult,
  patterns: PatternSearchResult,
  agentResearch: AgentResearchResult
): ConfidenceScore {
  // Template confidence (40% weight)
  const templateConf = templateMatch.use_template
    ? templateMatch.best_match.match_score
    : 50; // Conservative if no template

  // Pattern confidence (40% weight)
  const patternConf = patterns.patterns.length > 0
    ? patterns.avg_confidence || 70
    : 50; // Conservative if no patterns

  // Research confidence (20% weight)
  const researchConf = agentResearch.quality_score || 80;

  // Weighted average
  const score = Math.round(
    (templateConf * 0.4) +
    (patternConf * 0.4) +
    (researchConf * 0.2)
  );

  return {
    score,
    breakdown: { template: templateConf, patterns: patternConf, research: researchConf },
    reliability: score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low',
    recommendation: score >= 80 ? 'Go ahead' : score >= 60 ? 'Proceed with caution' : 'Prototype first'
  };
}
```

### Potential Challenges

- **Challenge**: Services may not initialize if dependencies missing
  - **Mitigation**: Graceful fallback, check if Supabase configured, use local-only mode

- **Challenge**: Plan output may become too verbose
  - **Mitigation**: Collapsible sections, summary-first approach, detailed sections optional

- **Challenge**: Confidence scoring may be inaccurate initially
  - **Mitigation**: Conservative estimates, clear disclaimers, improve over time

## Testing Requirements

- [ ] Manual test: `/plan "Add user authentication"` → auth-system template match
- [ ] Manual test: `/plan "Add products CRUD"` → crud-endpoint template match
- [ ] Manual test: `/plan --template=dashboard "Analytics page"` → explicit template
- [ ] Manual test: `/plan "Custom unique feature"` → no template, agent research
- [ ] Manual test: Verify todos/*.md files created with correct numbering
- [ ] Manual test: Verify TodoWrite items link to file paths
- [ ] Manual test: Verify historical patterns displayed (if RAG has data)
- [ ] Manual test: Verify confidence score calculated correctly
- [ ] Manual test: Verify risk assessment included
- [ ] Manual test: Verify alternative approaches listed

## Documentation Updates

- [ ] Add usage examples in plan.md
- [ ] Document confidence scoring methodology
- [ ] Document template matching algorithm
- [ ] Add troubleshooting section

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 10 acceptance criteria met
2. ✅ All manual tests passing
3. ✅ Services integrated correctly
4. ✅ Output format enhanced
5. ✅ No TypeScript errors
6. ✅ Plan.md updated and functional

**Resolution Steps**:
```bash
# Test each scenario
/plan "Add user authentication"
/plan "Add products API"
/plan --template=dashboard "Analytics"
/plan "Custom feature"

# Verify output sections
# - Executive Summary with confidence
# - Historical Context (if patterns exist)
# - Plan Source
# - Risk Assessment
# - Alternative Approaches
# - Confidence Analysis
# - Created Persistent Todos

# Mark as resolved
mv todos/006-pending-p1-plan-command-integration.md todos/006-resolved-plan-command-integration.md
```

---

## Notes

**Implementation Priority**: CRITICAL - This is the final integration that completes the P1 enhancement. All services must work together seamlessly.

**Integration Points**:
- Step 2: Pattern search integration (historical learning)
- Step 3: Template matching integration (proven patterns)
- Step 7: Todo generation integration (dual system)
- Step 8: Enhanced output (confidence, risk, alternatives)

**Backward Compatibility**: Old `/plan` calls continue to work. New features are additive, not breaking.

**Expected Impact**: Each feature makes the next **40% faster** through compounding engineering.

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD
