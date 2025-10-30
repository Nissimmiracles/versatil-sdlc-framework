# Template Matcher Service - Template Automation - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical - Template automation)
- **Created**: 2025-10-26
- **Assigned**: Sarah-PM + Alex-BA
- **Estimated Effort**: Medium (2 hours)

## Description

Create the Template Matcher Service that automatically matches feature descriptions to existing plan templates using keyword analysis and category detection. Templates already exist in `templates/plan-templates/` (5 YAML files: auth-system, crud-endpoint, dashboard, api-integration, file-upload).

## Acceptance Criteria

- [ ] Create `src/templates/template-matcher.ts` with complete type definitions
- [ ] Load all YAML templates from `templates/plan-templates/`
- [ ] Parse keywords array from each template
- [ ] Implement keyword matching algorithm (score 0-100)
- [ ] Return best match if score >= 70%
- [ ] Support `--template=NAME` flag for explicit selection
- [ ] Merge template with custom project requirements
- [ ] Calculate effort adjustments based on complexity
- [ ] Unit tests with all 5 existing templates (80%+ coverage)

## Context

- **Related Issue**: #001 - Enhance /plan Command
- **Related PR**: TBD
- **Files Involved**:
  - `src/templates/template-matcher.ts` (new - ~200 lines)
  - `tests/templates/template-matcher.test.ts` (new - ~150 lines)
  - `templates/plan-templates/*.yaml` (existing - 5 templates)
  - `templates/plan-templates/README.md` (existing - documentation)
- **References**:
  - Existing templates: `templates/plan-templates/`
  - Template spec: `templates/plan-templates/README.md`

## Dependencies

- **Depends on**: None (templates already exist)
- **Blocks**:
  - 005 - Integration tests need this service
  - 006 - Plan command integration needs this service
- **Related to**: 001 - Master enhancement task

## Implementation Notes

### Type Definitions Required

```typescript
export interface TemplateMatch {
  template_name: string;
  template_path: string;
  match_score: number; // 0-100
  matched_keywords: string[];
  category: string;
  estimated_effort: {
    hours: number;
    range: string; // "8-12"
    confidence: number;
  };
  complexity: 'Small' | 'Medium' | 'Large' | 'XL';
}

export interface TemplateMatchResult {
  best_match: TemplateMatch | null;
  all_matches: TemplateMatch[];
  use_template: boolean;
  reason: string; // Why template was/wasn't used
}

export interface PlanTemplate {
  name: string;
  category: string;
  keywords: string[];
  estimated_effort: {
    hours: number;
    range: string;
    confidence: number;
  };
  complexity: string;
  phases: {
    database?: any;
    api?: any;
    frontend?: any;
    testing?: any;
  };
  success_metrics?: string[];
  risks?: any;
  alternative_approaches?: any[];
}
```

### Suggested Approach

1. **Create TemplateMatcher class**
   - Load all YAML files from `templates/plan-templates/`
   - Parse template metadata (name, keywords, category, effort)
   - Cache loaded templates (lazy load on first use)

2. **Implement keyword matching algorithm**
   - Tokenize feature description (lowercase, remove stopwords)
   - Calculate keyword overlap with each template
   - Score = (matched_keywords / total_keywords) * 100
   - Boost score for category keyword matches (+20%)
   - Boost score for exact name match (+30%)

3. **Implement template selection logic**
   - Sort matches by score (descending)
   - Return best match if score >= 70%
   - Support explicit selection via `--template=NAME` flag
   - Return all matches for user review

4. **Implement effort adjustment**
   - Base effort from template
   - Adjust for complexity difference (+/- 20-40%)
   - Adjust for custom requirements (+10-30%)
   - Calculate new confidence based on adjustments

### Existing Templates (Already Created)

1. **auth-system.yaml**
   - Keywords: auth, login, signup, jwt, oauth, password, session, authentication
   - Effort: 28 hours (24-32 range), Confidence: 85%
   - Category: Security

2. **crud-endpoint.yaml**
   - Keywords: crud, api, rest, endpoint, get, post, put, delete, resource
   - Effort: 8 hours (6-10 range), Confidence: 90%
   - Category: API

3. **dashboard.yaml**
   - Keywords: dashboard, analytics, charts, metrics, visualization, kpi, reporting
   - Effort: 16 hours (12-20 range), Confidence: 80%
   - Category: Visualization

4. **api-integration.yaml**
   - Keywords: api, integration, webhook, rest, graphql, third-party, external
   - Effort: 12 hours (8-16 range), Confidence: 75%
   - Category: Integration

5. **file-upload.yaml**
   - Keywords: upload, file, s3, storage, image, pdf, document, media
   - Effort: 10 hours (8-12 range), Confidence: 85%
   - Category: File Management

### Potential Challenges

- **Challenge**: Multiple templates match with similar scores
  - **Mitigation**: Return all high-scoring matches, let user choose, or combine templates

- **Challenge**: Feature description too vague for matching
  - **Mitigation**: Return low confidence, suggest using agent research instead

- **Challenge**: Custom feature doesn't match any template
  - **Mitigation**: Return no match gracefully, recommend creating custom template after implementation

## Testing Requirements

- [ ] Unit test: Match "Add user authentication" → auth-system.yaml (score >= 80)
- [ ] Unit test: Match "Add products API" → crud-endpoint.yaml (score >= 80)
- [ ] Unit test: Match "Build analytics page" → dashboard.yaml (score >= 70)
- [ ] Unit test: Match "Stripe integration" → api-integration.yaml (score >= 70)
- [ ] Unit test: Match "Profile picture upload" → file-upload.yaml (score >= 70)
- [ ] Unit test: No match for "Custom unique feature" (score < 70)
- [ ] Unit test: Explicit selection `--template=auth-system` → force match
- [ ] Unit test: Calculate effort adjustment (base 28h + complexity +4h = 32h)
- [ ] Unit test: Load all 5 templates from YAML files
- [ ] Integration test: Full matching flow with real templates

## Documentation Updates

- [ ] Add JSDoc comments to all exported interfaces
- [ ] Add inline comments for scoring algorithm
- [ ] Add usage examples in file header
- [ ] Document template matching criteria in README

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 9 acceptance criteria met
2. ✅ All unit tests passing (80%+ coverage)
3. ✅ Works with all 5 existing templates
4. ✅ Explicit template selection works
5. ✅ No TypeScript errors
6. ✅ YAML parsing working correctly

**Resolution Steps**:
```bash
# Run tests
npm run test:unit -- template-matcher.test.ts

# Check coverage
npm run test:coverage -- template-matcher.test.ts

# Mark as resolved
mv todos/003-pending-p1-template-matcher-service.md todos/003-resolved-template-matcher-service.md
```

---

## Notes

**Implementation Priority**: HIGH - Templates are already created and documented. This service just needs to match descriptions to existing templates, significantly accelerating planning.

**Integration Points**:
- Called from `.claude/commands/plan.md` Step 3 (Check Plan Templates)
- Uses existing YAML templates from `templates/plan-templates/`
- Results displayed in plan output "Plan Source" section

**Template Maintenance**: After features are completed, templates can be updated with new learnings via `/learn` command.

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD
