# Compounding Engineering with VERSATIL

**Making Each Feature 40% Faster Than the Last**

## What is Compounding Engineering?

Compounding Engineering is a methodology pioneered by Every Inc where each feature implementation makes the next one significantly faster through systematic learning and codification. VERSATIL implements this through the enhanced `/plan` command with automatic pattern search, template matching, and dual todo tracking.

**The Power of Compounding**:
- **Feature 1**: Baseline (100% effort)
- **Feature 2**: 17% faster (83% effort)
- **Feature 3**: 26% faster (74% effort)
- **Feature 4**: 31% faster (69% effort)
- **Feature 5**: **40% faster** (60% effort) ← Target achieved!

## The VELOCITY Workflow

VERSATIL implements compounding engineering through a 5-phase workflow:

```
PLAN → ASSESS → DELEGATE → WORK → CODIFY
  ↓        ↓         ↓         ↓        ↓
Learn   Check   Assign   Execute  Store
History  Ready   Agents    Tasks   Patterns
```

### Phase 1: PLAN (Learn from History)

**Purpose**: Use historical data to create accurate implementation plans

**How it Works**:
```bash
/plan "Add user authentication"
```

1. **Pattern Search** (Step 2 - CODIFY Phase):
   - Queries GraphRAG/Vector store for similar features
   - Retrieves top 5 most similar implementations (≥75% similarity)
   - Extracts effort estimates, lessons learned, code examples
   - Calculates average effort with confidence intervals

2. **Template Matching** (Step 3):
   - Matches feature description to 5 pre-built templates
   - Scores based on keyword overlap (70% threshold)
   - Provides base effort estimates and proven patterns
   - Customizes template for project context

3. **Dual Todo Generation** (Step 7):
   - Creates TodoWrite items (in-session tracking)
   - Generates `todos/*.md` files (cross-session persistence)
   - Auto-numbers files, detects dependencies
   - Visualizes dependency graph with Mermaid

**Output**: Enhanced plan with confidence scores, risk assessment, effort estimates

### Phase 2: ASSESS (Check Readiness)

**Purpose**: Validate environment is ready before implementation

**How it Works**:
```bash
/assess "Add user authentication"
```

**Quality Gates**:
- Framework health ≥ 80%
- Git working tree clean
- Dependencies installed and secure
- Database connected
- Environment variables valid
- Build and tests passing

**Readiness Scores**:
- ✅ **90-100%**: GO - Ready to proceed
- ⚠️ **70-89%**: CAUTION - Proceed with warnings
- ❌ **< 70%**: NO-GO - Fix blockers first

### Phase 3: DELEGATE (Assign to OPERA Agents)

**Purpose**: Route work to specialized agents based on expertise

**How it Works**:
```bash
/delegate "Add user authentication"
```

**Agent Routing**:
- **Marcus-Backend**: API design, authentication middleware, security
- **James-Frontend**: Login UI, form validation, accessibility
- **Dana-Database**: User schema, migrations, RLS policies
- **Maria-QA**: Test coverage, security validation, quality gates
- **Alex-BA**: Requirements analysis, user stories, acceptance criteria
- **Sarah-PM**: Coordination, dependency management, reporting

### Phase 4: WORK (Execute Tasks)

**Purpose**: Implement features with OPERA agent assistance

**How it Works**:
```bash
/work todos/001-pending-p1-auth-api.md
```

**Execution**:
- Agents execute assigned tasks from `todos/*.md` files
- Real-time progress tracking via TodoWrite
- Automatic quality gates enforcement
- Cross-agent collaboration and handoffs

### Phase 5: CODIFY (Store Learnings)

**Purpose**: Capture implementation details for future features

**How it Works**:
```bash
/learn feature-branch
# or after completion:
/learn "Completed user authentication in 26 hours"
```

**What Gets Stored**:
- Actual effort vs. estimated effort
- Lessons learned (pitfalls, best practices)
- Code examples with file:line references
- Success patterns and anti-patterns
- Agent effectiveness scores

**Storage**:
- **GraphRAG**: Knowledge graph (preferred - no API quota)
- **Vector Store**: Supabase embeddings (fallback)
- **Metadata**: Feature category, complexity, success score

---

## Three Services Powering Compounding Engineering

### 1. Pattern Search Service (`src/rag/pattern-search.ts`)

**Purpose**: Find and analyze similar historical features

**Key Features**:
- GraphRAG-first search (no API quota, works offline)
- Vector store fallback (semantic search via Supabase)
- Similarity filtering (configurable threshold)
- Effort aggregation (mean, std, confidence intervals)
- Lesson consolidation (prioritized by frequency)

**Usage**:
```typescript
import { patternSearchService } from '@/rag/pattern-search';

const result = await patternSearchService.searchSimilarFeatures({
  description: "Add user authentication with OAuth2",
  category: "auth",
  min_similarity: 0.75,
  limit: 5
});

console.log(`Average effort: ${result.average_effort.mean}h ± ${result.average_effort.std}h`);
console.log(`Confidence: ${result.confidence_score}%`);
console.log(`Top lessons: ${result.consolidated_lessons.high.join(', ')}`);
```

**Output**:
```typescript
{
  patterns: [
    {
      feature_name: "User login system",
      effort_hours: 24,
      similarity_score: 0.92,
      lessons_learned: ["Add indexes early", "Use RLS policies"],
      code_examples: [{ file: "src/auth/login.ts", lines: "42-67" }]
    }
  ],
  average_effort: { mean: 26, std: 4, range: { min: 22, max: 30 } },
  confidence_score: 85,
  consolidated_lessons: {
    high: ["Add database indexes on foreign keys"],
    medium: ["Use Row Level Security from start"],
    low: ["Document OAuth flow"]
  }
}
```

### 2. Template Matcher (`src/templates/template-matcher.ts`)

**Purpose**: Auto-match features to proven templates

**Available Templates**:
1. **auth-system.yaml** - Authentication (OAuth2, JWT, sessions) - 28h
2. **crud-endpoint.yaml** - REST API with CRUD operations - 8h
3. **dashboard.yaml** - Analytics dashboard with charts - 16h
4. **api-integration.yaml** - Third-party API integration - 12h
5. **file-upload.yaml** - Secure file upload with S3 - 10h

**Matching Algorithm**:
1. Extract keywords from description
2. Calculate base score (keyword overlap %)
3. Add category boost (+20% if category matches)
4. Add name boost (+30% if template name in description)
5. Return best match if score ≥ 70%

**Usage**:
```typescript
import { templateMatcher } from '@/templates/template-matcher';

const result = await templateMatcher.matchTemplate({
  description: "Build user authentication with Google OAuth",
  explicit_template: undefined // or "auth-system" to force
});

if (result.best_match) {
  console.log(`Matched: ${result.best_match.template_name}`);
  console.log(`Score: ${result.best_match.match_score}%`);
  console.log(`Base effort: ${result.best_match.estimated_effort.hours}h`);
}
```

**Output**:
```typescript
{
  best_match: {
    template_name: "auth-system",
    match_score: 88,
    matched_keywords: ["auth", "oauth", "user", "google"],
    category: "authentication",
    estimated_effort: { hours: 28, range: "24-32h", confidence: 85 },
    complexity: "Medium"
  },
  all_matches: [ /* other templates */ ],
  no_match_reason: null,
  recommended_action: "use_template"
}
```

### 3. Todo File Generator (`src/planning/todo-file-generator.ts`)

**Purpose**: Create dual todo system with dependency tracking

**Key Features**:
- Auto-numbering (finds next available number)
- Template-based file generation
- TodoWrite synchronization
- Dependency graph generation (Mermaid)
- Execution wave detection (parallel vs sequential)

**Usage**:
```typescript
import { todoFileGenerator } from '@/planning/todo-file-generator';

const result = await todoFileGenerator.generateTodos([
  {
    title: "Implement authentication API",
    priority: "p1",
    assigned_agent: "Marcus-Backend",
    estimated_effort: "Medium",
    acceptance_criteria: ["JWT tokens working", "Tests passing"],
    dependencies: { depends_on: [], blocks: ["002"] },
    implementation_notes: "Use Supabase Auth",
    files_involved: ["src/api/auth.ts"],
    context: {
      feature_description: "User authentication",
      related_issue: "#123"
    }
  },
  {
    title: "Build login UI",
    priority: "p1",
    assigned_agent: "James-Frontend",
    estimated_effort: "Small",
    acceptance_criteria: ["Form validation working", "WCAG 2.1 AA"],
    dependencies: { depends_on: ["001"], blocks: [] },
    implementation_notes: "Use React Hook Form",
    files_involved: ["src/components/LoginForm.tsx"],
    context: {
      feature_description: "User authentication",
      related_issue: "#123"
    }
  }
]);

console.log(`Created ${result.files_created.length} todo files`);
console.log(`Dependency graph:\n${result.dependency_graph}`);
console.log(`Execution waves: ${result.execution_waves.length}`);
```

**Output**:
```typescript
{
  files_created: [
    "todos/008-pending-p1-implement-authentication-api.md",
    "todos/009-pending-p1-build-login-ui.md"
  ],
  todowrite_items: [
    { content: "Implement authentication API", status: "pending", activeForm: "Implementing..." },
    { content: "Build login UI", status: "pending", activeForm: "Building..." }
  ],
  dependency_graph: "graph TD\n  001[Auth API]\n  002[Login UI]\n  001 --> 002",
  execution_waves: [
    { wave: 1, tasks: ["001"], type: "sequential" },
    { wave: 2, tasks: ["002"], type: "sequential" }
  ],
  total_estimated_effort: 6, // Medium (4h) + Small (2h)
  summary: "Created 2 todos in 2 waves"
}
```

---

## Real-World Example

### Feature: "Add user authentication with Google OAuth"

**Step 1: Run /plan**
```bash
/plan "Add user authentication with Google OAuth"
```

**Step 2: Pattern Search (Automatic)**
- Searches GraphRAG for "authentication", "oauth", "google", "user"
- Finds 3 similar features:
  - "User login system" (24h, 92% similar)
  - "OAuth2 integration" (32h, 87% similar)
  - "Social auth" (26h, 85% similar)
- Calculates average: **27h ± 4h** (confidence: 88%)
- Extracts lessons:
  - ⚠️ "Add database indexes on foreign keys early"
  - ✅ "Use Supabase Auth for OAuth providers"
  - 📚 Code example: `src/auth/oauth.ts:42-67`

**Step 3: Template Matching (Automatic)**
- Matches "auth-system.yaml" (88% score)
- Base effort: 28h
- Complexity adjustment: 1.1x (Google OAuth adds complexity)
- Adjusted effort: **31h**

**Step 4: Combine Estimates**
- Historical average: 27h ± 4h (88% confidence)
- Template estimate: 31h (85% confidence)
- **Final estimate: 29h ± 3h** (weighted average, 91% confidence)

**Step 5: Generate Todos (Automatic)**
- Creates 6 todo files:
  - `008-pending-p1-auth-api-backend.md` (Marcus, Medium, 4h)
  - `009-pending-p1-oauth-config-setup.md` (Marcus, Small, 2h)
  - `010-pending-p1-login-ui-component.md` (James, Small, 2h)
  - `011-pending-p1-user-schema-migration.md` (Dana, Small, 2h)
  - `012-pending-p2-test-coverage.md` (Maria, Medium, 4h)
  - `013-pending-p2-documentation.md` (Sarah, Small, 1h)
- Detects execution waves:
  - Wave 1 (parallel): 008, 009, 011 (backend + DB setup)
  - Wave 2 (sequential): 010 (depends on Wave 1)
  - Wave 3 (sequential): 012, 013 (depends on Waves 1+2)
- Generates Mermaid dependency graph

**Step 6: Execute with /work**
```bash
/work todos/008-pending-p1-auth-api-backend.md
```

**Step 7: Codify with /learn (After Completion)**
```bash
/learn "Completed Google OAuth authentication in 26 hours"
```

Stores:
- Actual effort: 26h (vs estimated 29h = **-10% error**)
- Lessons learned: "Google OAuth requires additional CORS config"
- Code examples: `src/api/auth/google.ts:1-85`
- Success score: 95% (tests passing, security validated)

**Result**: Next authentication feature will be **15-20% faster** due to:
- More accurate effort estimates
- Additional lessons learned
- More code examples to reference
- Updated template with Google OAuth patterns

---

## Measuring Compounding Impact

### Metrics to Track

1. **Effort Estimation Accuracy**
   - Initial: ±50% confidence interval
   - After 5 features: ±10-20% confidence interval
   - **Target**: <15% error rate

2. **Planning Speed**
   - Initial: 30-60 minutes per feature
   - After 5 features: 10-15 minutes per feature
   - **Target**: <15 minutes

3. **Implementation Speed**
   - Feature 1: 100% effort (baseline)
   - Feature 5: 60% effort (40% faster)
   - **Target**: 40% reduction by feature 5

4. **Code Reuse**
   - Initial: 20% code reused from examples
   - After 5 features: 60% code reused
   - **Target**: >50% reuse rate

5. **Quality Consistency**
   - Test coverage: 80%+ maintained
   - Security: OWASP compliance maintained
   - Accessibility: WCAG 2.1 AA maintained
   - **Target**: Zero quality regression

### Example Progression

| Feature | Category | Estimated | Actual | Error | Planning Time | Reuse % |
|---------|----------|-----------|--------|-------|---------------|---------|
| 1 | Auth | 40h ± 20h | 38h | -5% | 60 min | 10% |
| 2 | CRUD | 12h ± 6h | 10h | -17% | 45 min | 25% |
| 3 | Dashboard | 20h ± 8h | 18h | -10% | 30 min | 40% |
| 4 | API Integration | 14h ± 4h | 13h | -7% | 20 min | 55% |
| 5 | File Upload | 15h ± 3h | 14h | -7% | 15 min | 65% |

**Total Savings**: Feature 5 took **63% less time than Feature 1** (14h vs 38h for similar complexity)

---

## Best Practices

### 1. Always Run /plan First
```bash
# Good: Learn from history before starting
/plan "Add feature X"
# Then: /work todos/NNN-pending-p1-feature-x.md

# Bad: Skip planning and start coding
/work "Add feature X" # No historical context!
```

### 2. Use /learn After Every Feature
```bash
# After completing work
/learn feature-branch
# or
/learn "Completed feature X in Yh - Learned Z"
```

**What to Include**:
- Actual effort vs estimated
- Unexpected challenges
- What worked well
- Code patterns to reuse
- What to avoid next time

### 3. Keep Templates Updated
```bash
# Review template accuracy quarterly
# Update base effort if consistently off
# Add new templates for common patterns
```

### 4. Leverage Execution Waves
```bash
# Run parallel tasks simultaneously
/work todos/001-*.md todos/002-*.md todos/003-*.md # Wave 1 (parallel)

# Wait for Wave 1, then Wave 2
/work todos/004-*.md # Wave 2 (depends on 001-003)
```

### 5. Monitor Confidence Scores
- **<60%**: Low confidence - add buffer to estimates
- **60-80%**: Medium confidence - reasonable estimates
- **>80%**: High confidence - accurate estimates

---

## Troubleshooting

### "No historical patterns found"

**Cause**: First time implementing this type of feature

**Solution**:
1. Use template matching instead
2. Add ±50% buffer to estimates
3. Document extensively for future features
4. Run `/learn` after completion to seed history

### "Template match score too low (<70%)"

**Cause**: Unique feature not matching existing templates

**Solution**:
1. Use custom agent-driven planning
2. Create new template if this becomes a pattern
3. Still run pattern search for similar features
4. Document as potential template candidate

### "Effort estimates still inaccurate after 5 features"

**Cause**: Not running `/learn` consistently or incomplete codification

**Solution**:
1. Ensure `/learn` runs after EVERY feature
2. Include actual effort, lessons, code examples
3. Verify GraphRAG/Vector store is storing data
4. Check for data quality issues (incomplete entries)

### "GraphRAG not returning results"

**Cause**: GraphRAG store not initialized or empty

**Solution**:
1. Check GraphRAG setup: `pnpm run graphrag:status`
2. Fallback to Vector store automatically
3. Seed initial data from git history: `pnpm run graphrag:seed`
4. Verify network connectivity if using cloud GraphRAG

---

## Advanced Usage

### Custom Templates

Create project-specific templates in `.claude/templates/`:

```yaml
# .claude/templates/mobile-screen.yaml
name: "Mobile Screen"
category: "mobile"
base_effort: 12
complexity: "Medium"
phases:
  - name: "Design Figma mockup"
    effort: 2
    agent: "James-Frontend"
  - name: "Implement React Native component"
    effort: 6
    agent: "James-Frontend"
  - name: "Add navigation integration"
    effort: 2
    agent: "James-Frontend"
  - name: "Test on iOS/Android"
    effort: 2
    agent: "Maria-QA"
```

### Bulk Learning from Git History

Seed GraphRAG with past features:

```bash
pnpm run graphrag:seed -- --from-date=2024-01-01 --repo=.
```

Analyzes:
- Commit messages for feature descriptions
- PR descriptions for effort estimates
- Code changes for implementation patterns
- Issue comments for lessons learned

### Integration with Project Management

Export todos to Jira/Linear/GitHub Issues:

```bash
pnpm run todos:export -- --format=jira --sprint=current
```

---

## FAQ

**Q: How many features before I see 40% improvement?**
A: Typically 5-7 features of the same category (e.g., 5 auth features, 5 CRUD endpoints)

**Q: Does this work for all feature types?**
A: Best for repeated patterns (CRUD, auth, dashboards). Unique features benefit less but still improve over time.

**Q: Can I use this without GraphRAG?**
A: Yes, Vector store fallback works. GraphRAG preferred for offline use and no API quota.

**Q: How do I export historical data?**
A: `pnpm run rag:export -- --format=json --output=history.json`

**Q: Does /learn run automatically?**
A: Not yet - manual after each feature. Automatic codification coming in v6.7.0.

---

## Related Documentation

- [/plan Command Reference](.claude/commands/plan.md)
- [Pattern Search Service](../api/pattern-search-service.md)
- [Template Matcher](../api/template-matcher.md)
- [Todo File Generator](../api/todo-file-generator.md)
- [VELOCITY Workflow](./velocity-workflow.md)
- [OPERA Agents](./opera-agents.md)

---

**Version**: 6.6.0
**Last Updated**: 2025-10-26
**Methodology Source**: Every Inc (https://every.to/chain-of-thought/compounding-engineering)
