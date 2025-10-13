# Enhance /plan Command with Compounding Engineering Patterns - P1

## Status
- [x] In Progress
- **Priority**: P1 (Critical)
- **Created**: 2025-10-13
- **Assigned**: Alex-BA + Marcus-Backend + James-Frontend (Parallel Research Team)
- **Estimated Effort**: Large (6-8 hours)

## Description

Transform the `/plan` command from basic parallel research into a fully empowered Compounding Engineering workflow following Every Inc's proven "Plan → Delegate → Assess → Codify" pattern. This enhancement will make plans 40% more accurate with effort estimates and historical context.

## Acceptance Criteria

- [ ] **Assess Phase Added**: Pre-planning quality gates check dependencies, health, prerequisites
- [ ] **Codify Phase Added**: Auto-learn from similar past features using RAG search
- [ ] **Plan Templates**: Pre-built templates for auth, CRUD, dashboards, API integrations
- [ ] **Effort Estimation**: AI-powered effort estimates based on historical data
- [ ] **Historical Context**: Search and incorporate lessons from similar past implementations
- [ ] **Enhanced Output**: Plans include confidence scores, risks, and alternative approaches
- [ ] **Three-Tier Analysis**: Database (Dana) → API (Marcus) → Frontend (James) coordination
- [ ] **TodoWrite Integration**: Auto-create dual todos (TodoWrite + todos/*.md files)

## Context

- **Related Issue**: v7.0 Transformation Plan
- **Related PR**: TBD
- **Files Involved**:
  - `.claude/commands/plan.md` (current implementation ~500 lines)
  - `src/orchestration/planning-orchestrator.ts` (new file)
  - `src/rag/pattern-search.ts` (RAG integration)
  - `src/templates/plan-templates/` (new directory)
- **References**:
  - Every Inc Compounding Engineering: https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it
  - TRANSFORMATION_COMPLETE.md (workflow patterns)
  - COMPETITIVE_ANALYSIS_2025.md (market positioning)

## Dependencies

- **Depends on**: None (starting point for v7.0)
- **Blocks**:
  - 002 - Enhance /work command (needs improved plans)
  - 003 - Enhance /review command (needs planning context)
- **Related to**: All Phase 1 workflow enhancements

## Implementation Notes

### Current /plan Command Flow
```
1. Parse feature description
2. Run parallel agents (Alex-BA, Marcus, James, Dana)
3. Synthesize findings
4. Create TodoWrite list
5. Output plan markdown
```

### Enhanced Flow (Compounding Engineering)
```
1. **ASSESS** - Pre-Planning Quality Gates
   - Check framework health (npm run monitor)
   - Verify dependencies installed
   - Check git status (clean working tree)
   - Validate prerequisites (database running, env vars set)

2. **PLAN** - Multi-Tier Parallel Research
   - Tier 1: Database Layer (Dana-Database)
     * Schema design
     * Migration strategy
     * RLS policies
     * Performance indexes

   - Tier 2: API Layer (Marcus-Backend + Dana coordination)
     * Endpoint definitions
     * Request/response schemas
     * Business logic
     * Security patterns

   - Tier 3: Frontend Layer (James-Frontend + Marcus coordination)
     * Component design
     * State management
     * Form validation
     * Accessibility

   - Tier 0: Business Requirements (Alex-BA)
     * User stories
     * Acceptance criteria
     * Success metrics
     * Edge cases

3. **CODIFY** - Learn from Past
   - RAG search for similar features: `vectorStore.search(feature_description)`
   - Retrieve successful patterns: "auth implementation that worked"
   - Extract effort estimates: "similar feature took 8 hours"
   - Identify common pitfalls: "watch out for N+1 queries"
   - Surface relevant code examples with file paths

4. **DELEGATE** - Smart Todo Creation
   - Generate numbered todos (001-pending-p1-*.md)
   - Auto-assign to optimal agents
   - Set dependencies and priorities
   - Estimate effort per todo
   - Create execution waves (parallel groups)

5. **OUTPUT** - Enhanced Plan Document
   - Executive summary with confidence score
   - Three-tier technical approach (DB → API → UI)
   - Historical context and learnings
   - Effort estimate with confidence interval
   - Risk assessment and mitigation
   - Alternative approaches considered
   - Success metrics and validation criteria
```

### Suggested Approach

#### Step 1: Add ASSESS Phase
```typescript
// src/orchestration/planning-orchestrator.ts

interface AssessmentResult {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  health_score: number;
}

async function assessReadiness(): Promise<AssessmentResult> {
  // Check framework health
  const health = await runMonitor();

  // Check git status
  const gitStatus = await exec('git status --porcelain');

  // Check dependencies
  const nodeModules = fs.existsSync('node_modules');

  // Check database connection
  const dbConnected = await checkDatabase();

  return {
    ready: health.overall >= 80 && gitStatus === '' && nodeModules && dbConnected,
    blockers: [...],
    warnings: [...],
    health_score: health.overall
  };
}
```

#### Step 2: Integrate RAG for CODIFY Phase
```typescript
// src/rag/pattern-search.ts

interface HistoricalPattern {
  feature_name: string;
  implementation_path: string;
  effort_hours: number;
  success_score: number;
  lessons_learned: string[];
  code_examples: Array<{file: string, lines: string}>;
}

async function searchSimilarFeatures(
  description: string
): Promise<HistoricalPattern[]> {
  // Vector search in RAG store
  const results = await vectorStore.search({
    query: description,
    domain: 'feature_implementations',
    limit: 5,
    threshold: 0.75
  });

  return results.map(r => ({
    feature_name: r.metadata.feature,
    effort_hours: r.metadata.effort,
    success_score: r.metadata.success,
    lessons_learned: r.metadata.lessons,
    code_examples: r.metadata.examples
  }));
}
```

#### Step 3: Create Plan Templates
```yaml
# src/templates/plan-templates/auth-system.yaml

name: "Authentication System"
category: "Security"
estimated_effort: "Large (24-32 hours)"
phases:
  database:
    - Create users table with email, password_hash, roles
    - Add RLS policies for user data isolation
    - Create sessions table with token, expires_at
    - Add indexes on email (unique) and session_token

  api:
    - POST /auth/signup (email, password validation)
    - POST /auth/login (returns JWT token)
    - POST /auth/logout (invalidate session)
    - GET /auth/me (current user info)
    - Security: bcrypt for passwords, JWT with 24h expiry

  frontend:
    - LoginForm component (email, password, validation)
    - SignupForm component (email, password, confirm)
    - AuthProvider (React Context for current user)
    - Protected routes with auth check
    - Accessibility: WCAG 2.1 AA form labels

  testing:
    - Unit: password hashing, token generation
    - Integration: auth endpoints with database
    - E2E: complete signup → login → access protected route
    - Security: SQL injection, XSS, CSRF tests

success_metrics:
  - User can sign up with valid email/password
  - User can log in and receive JWT token
  - Protected routes require authentication
  - 80%+ test coverage
  - < 200ms auth endpoint response time
```

#### Step 4: Enhance Plan Output Format
```markdown
# Feature Plan: User Authentication System

## Executive Summary
Implement OAuth2-compliant authentication with JWT tokens, secure password hashing, and role-based access control. **Confidence: 85%** (based on 3 similar implementations).

**Estimated Effort**: 28 hours ± 4 hours (based on historical data from auth features #123, #456, #789)

## Historical Context (Codified Learnings)
- ✅ Similar feature #123 took 24 hours (90% similar)
- ⚠️ Common pitfall: Remember to add indexes on email field (caused 2s login times in #456)
- ✅ Proven pattern: Use httpOnly cookies for JWT storage (recommendation from #789)
- 📚 Code examples: See src/auth/jwt-service.ts:42 for token generation pattern

## Three-Tier Technical Approach

### Database Layer (Dana-Database) - 6 hours
[Schema design, migrations, RLS policies...]

### API Layer (Marcus-Backend) - 12 hours
[Endpoints, security, validation...]

### Frontend Layer (James-Frontend) - 8 hours
[Components, forms, state management...]

### Quality Assurance (Maria-QA) - 2 hours
[Test strategy, coverage requirements...]

## Risk Assessment
- **High Risk**: Password reset flow complexity (mitigation: use proven library)
- **Medium Risk**: Token refresh logic (mitigation: start with simple 24h expiry)
- **Low Risk**: Email validation (mitigation: use standard regex + DNS check)

## Alternative Approaches Considered
1. **OAuth2 with external provider** (Google, GitHub) - Faster but less control
2. **Session-based auth** - Simpler but doesn't scale to microservices
3. **JWT in localStorage** - Easy but vulnerable to XSS

**Recommended**: JWT in httpOnly cookies (balance of security and scalability)

## TodoWrite List
✅ Phase 0: Assessment complete (framework health: 100%, git clean, database connected)
⏳ Phase 1: Database implementation (Dana-Database) - 6 hours
⏳ Phase 2: API implementation (Marcus-Backend) - 12 hours
⏳ Phase 3: Frontend implementation (James-Frontend) - 8 hours
⏳ Phase 4: QA validation (Maria-QA) - 2 hours

## Created Persistent Todos
- 001-pending-p1-auth-database-schema.md (Dana, depends on none)
- 002-pending-p1-auth-api-endpoints.md (Marcus, depends on 001)
- 003-pending-p1-auth-frontend-ui.md (James, depends on 002)
- 004-pending-p2-auth-test-coverage.md (Maria, depends on 001+002+003)
```

### Potential Challenges

1. **Challenge**: RAG store may not have enough historical data initially
   **Mitigation**: Bootstrap with examples from Every Inc, Seth Hobson patterns, and VERSATIL's own codebase

2. **Challenge**: Effort estimation accuracy depends on data quality
   **Mitigation**: Start with conservative estimates (±50%), improve over time as more features are completed

3. **Challenge**: Assessment phase might be too strict (blocking legitimate work)
   **Mitigation**: Make assessment warnings not blockers, allow override with `/plan --force`

4. **Challenge**: Plan templates might not cover all feature types
   **Mitigation**: Start with 5-10 common templates, add `/generate:template` command to create custom ones

## Testing Requirements

- [ ] **Unit tests**: Test each phase (Assess, Codify, Delegate) independently
- [ ] **Integration test**: Full `/plan` command flow with mocked RAG responses
- [ ] **E2E test**: Real `/plan "Add user authentication"` command
- [ ] **Manual testing**:
  - Plan a simple feature (CRUD endpoint) - should use MINIMAL detail level
  - Plan a complex feature (full auth system) - should use A LOT detail level
  - Plan with no historical data - should work without RAG context
  - Plan with health < 80% - should show warnings but not block

## Documentation Updates

- [ ] Update `.claude/commands/plan.md` with new capabilities
- [ ] Add `docs/guides/compounding-engineering.md` explaining the philosophy
- [ ] Update `CLAUDE.md` with enhanced planning workflow
- [ ] Add examples to README showing before/after plan quality
- [ ] Document plan templates in `src/templates/plan-templates/README.md`

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 8 acceptance criteria met
2. ✅ Assessment phase working (health check, git status, dependencies)
3. ✅ Codify phase working (RAG search returns similar features)
4. ✅ At least 3 plan templates created (auth, CRUD, dashboard)
5. ✅ Effort estimation showing confidence intervals
6. ✅ TodoWrite + todos/*.md files auto-created
7. ✅ Tests passing (80%+ coverage)
8. ✅ Documentation updated

---

## Notes

**Implementation Priority**: This is the HIGHEST priority task for v7.0 because:
1. `/plan` is the entry point for all feature work
2. Better plans = faster execution (40% time savings)
3. Effort estimates help with project management
4. Historical context prevents repeating mistakes

**Expected Timeline**:
- Day 1: Implement ASSESS phase (2 hours)
- Day 1-2: Implement CODIFY phase with RAG (4 hours)
- Day 2: Create 5 plan templates (2 hours)
- Day 2-3: Enhance output format (2 hours)
- Day 3: Testing and documentation (2 hours)
- **Total**: 3 days (assuming 4 hours/day focus time)

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD
