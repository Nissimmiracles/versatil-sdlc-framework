---
description: "Learn from completed work and codify patterns into RAG for future use"
argument-hint: "[feature branch or completion summary]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Task"
  - "Read"
  - "Write"
  - "Grep"
  - "Glob"
  - "Bash(git:*)"
---

# Learn from Completed Work - Compounding Engineering (Codify Phase)

## Introduction

**Codify learnings** from completed features, bugs, or improvements into the RAG system for future use. This implements the "Codify" phase of VELOCITY workflow's Compounding Engineering approach: each unit of work makes subsequent units easier.

**Philosophy**: "Make the next feature 40% faster by learning from this one."

## Flags

- `--roadmap`: Capture learnings from complete roadmap execution (includes all phases, agent performance, effort accuracy)
- `--compare=BRANCH`: Compare with another branch to extract differential learnings
- `--confidence=N`: Set confidence level for patterns (default: 75, range: 0-100)

## Usage Examples

```bash
# Basic learning (single feature)
/learn "Feature: User authentication"

# Roadmap learning (after /roadmap-test execution)
/learn --roadmap "large-feature.yaml completed in 29.9 hours"

# Compare branches to extract patterns
/learn --compare=main "feature/user-auth"

# High-confidence learning only
/learn --confidence=85 "Feature: Payment processing"
```

## Learning Target

<learning_target> #$ARGUMENTS </learning_target>

## Main Tasks

### 1. Identify Completed Work

<thinking>
First, determine what work was completed and gather all artifacts (code changes, tests, docs, todos).
</thinking>

**Work Discovery:**

- [ ] Parse learning target (feature branch, PR number, todo ID, or description)
- [ ] Identify git branch or commit range
- [ ] List all changed files: `git diff main...feature-branch --name-only`
- [ ] Count lines changed: `git diff main...feature-branch --stat`
- [ ] Extract commit messages: `git log main...feature-branch --oneline`

**Artifact Collection:**

- [ ] Code changes (implementation files)
- [ ] Test files (coverage, patterns)
- [ ] Documentation updates (README, inline comments)
- [ ] Todo completion notes (todos/*.md files)
- [ ] Time tracking data (estimated vs actual)

### 2. Extract Patterns (Feedback-Codifier Agent)

<thinking>
Use the feedback-codifier agent to analyze completed work and extract reusable patterns, successful approaches, and lessons learned.
</thinking>

**Pattern Analysis:**

Run feedback-codifier agent on the completed work:

```yaml
Agent: feedback-codifier
Task: "Analyze completed feature and extract learnings"
Input:
  - feature_description: [from commits/todos]
  - code_changes: [diff output]
  - test_coverage: [coverage report]
  - time_spent: [actual effort]
  - success_indicators: [tests passing, deployed, etc.]

Output:
  - successful_patterns: [What worked well]
  - anti_patterns_avoided: [What was avoided]
  - effort_accuracy: [estimated vs actual]
  - reusable_code: [code snippets with file paths]
  - lessons_learned: [key insights]
  - future_improvements: [what could be better]
```

**Pattern Categories:**

- [ ] **Architecture Patterns**: Component structure, API design, database schema
- [ ] **Security Patterns**: Auth implementation, input validation, RLS policies
- [ ] **Performance Patterns**: Query optimization, caching strategies, indexes
- [ ] **Testing Patterns**: Test organization, coverage strategies, fixtures
- [ ] **Developer Experience**: Setup ease, documentation quality, debugging

### 3. Calculate Effort Metrics

<thinking>
Track actual effort vs estimated effort to improve future planning accuracy.
</thinking>

**Effort Analysis:**

- [ ] Extract original estimate from todo file or plan
- [ ] Calculate actual time spent (git commits, work logs)
- [ ] Compute accuracy: `actual / estimated`
- [ ] Identify variance reasons (complexity, dependencies, blockers)
- [ ] Update effort model for similar features

**Metrics to Track:**

```yaml
Feature Metrics:
  feature_name: "User authentication system"
  estimated_effort: "24 hours"
  actual_effort: "28 hours"
  accuracy: 86%
  variance_reason: "OAuth2 integration more complex than expected"

  complexity_factors:
    - database_tables: 3
    - api_endpoints: 5
    - frontend_components: 4
    - test_files: 8
    - dependencies: ["bcrypt", "jsonwebtoken", "passport"]

  success_metrics:
    - tests_passing: true
    - coverage: 92%
    - performance: "< 200ms login"
    - security_audit: "passed OWASP"
```

### 4. Store in RAG System

<thinking>
Embed learnings into vector store for future retrieval during planning phase.
</thinking>

**RAG Storage:**

```typescript
// Save to vector store
await vectorStore.store({
  content: pattern_description,
  metadata: {
    type: 'feature_implementation',
    feature_name: 'User authentication',
    domain: 'security',
    tech_stack: ['Node.js', 'PostgreSQL', 'JWT'],
    effort_hours: 28,
    success_score: 95,
    lessons: ['Add email index early', 'Use httpOnly cookies', 'Test token expiry'],
    code_examples: [
      { file: 'src/auth/jwt-service.ts', lines: '42-67', pattern: 'JWT generation' },
      { file: 'src/auth/middleware.ts', lines: '12-35', pattern: 'Auth middleware' }
    ],
    similar_to: ['feature-123', 'feature-456'],
    tags: ['authentication', 'security', 'jwt', 'oauth2']
  },
  domain: 'feature_implementations',
  timestamp: new Date()
});
```

**Embedding Categories:**

1. **Successful Patterns** (high similarity threshold)
   - "How to implement JWT auth with refresh tokens"
   - "Database schema pattern for multi-tenant SaaS"
   - "React form validation with Zod + React Hook Form"

2. **Lessons Learned** (medium similarity threshold)
   - "Remember to add indexes on foreign keys"
   - "Test RLS policies with multiple users"
   - "Use optimistic locking for concurrent updates"

3. **Code Examples** (low similarity threshold)
   - Specific file paths and line numbers
   - Working implementation snippets
   - Test examples that achieved 90%+ coverage

### 5. Update Planning Templates

<thinking>
If this is a common feature type, update or create a plan template for future use.
</thinking>

**Template Creation:**

- [ ] Determine if feature matches template category (auth, CRUD, dashboard, etc.)
- [ ] Update existing template or create new one
- [ ] Include actual effort data
- [ ] Add code examples and file structure
- [ ] Document common pitfalls and solutions

**Template Format:**

```yaml
# src/templates/plan-templates/auth-system-v2.yaml

name: "Authentication System (OAuth2 + JWT)"
category: "Security"
estimated_effort: "28 hours ± 4 hours"  # Updated with actual data
confidence: 95%  # Based on 3 successful implementations

phases:
  database:
    effort: "6 hours"
    tables:
      - users: "email (indexed!), password_hash, created_at"
      - sessions: "token (indexed!), user_id, expires_at"
    lessons:
      - "⚠️ Add index on users.email BEFORE inserting data"
      - "✅ Use UUID for session tokens (better security)"

  api:
    effort: "14 hours"
    endpoints:
      - POST /auth/signup: "Zod validation, bcrypt hashing (12 rounds)"
      - POST /auth/login: "JWT generation, httpOnly cookie"
      - POST /auth/refresh: "Token rotation for security"
      - DELETE /auth/logout: "Clear session, revoke token"
    code_examples:
      - file: "src/auth/jwt-service.ts:42-67"
        pattern: "JWT generation with 24h expiry"
    lessons:
      - "✅ Use httpOnly cookies (not localStorage)"
      - "⚠️ Test token expiry thoroughly"

  frontend:
    effort: "8 hours"
    components:
      - LoginForm: "Email validation, password strength"
      - AuthProvider: "React Context + useAuth hook"
      - ProtectedRoute: "Redirect to /login if not authed"
    code_examples:
      - file: "src/components/auth/LoginForm.tsx:15-45"
        pattern: "Form validation with React Hook Form"

success_metrics:
  - "< 200ms auth endpoint response"
  - "92%+ test coverage achieved"
  - "OWASP Top 10 compliance"
  - "WCAG 2.1 AA accessible forms"

learnings_applied_from:
  - feature-auth-v1 (#123): "Added email index upfront"
  - feature-oauth (#456): "Implemented token refresh"
  - feature-sso (#789): "Used httpOnly cookies"
```

### 6. Generate Learning Report

<thinking>
Create a summary report showing what was learned and how it will help future work.
</thinking>

**Report Structure:**

```markdown
# Learning Report: User Authentication System

**Date**: 2025-10-13
**Feature**: User authentication with OAuth2 + JWT
**Actual Effort**: 28 hours (estimated: 24 hours, 86% accuracy)
**Success Score**: 95/100

## What Worked Well ✅

1. **JWT Implementation**
   - Used httpOnly cookies for XSS protection
   - Implemented token refresh for better UX
   - 24h expiry with automatic renewal
   - **Saved to RAG**: Pattern "jwt-auth-cookies"

2. **Database Design**
   - Added email index BEFORE data insertion (learned from #123)
   - UUID for session tokens (better than auto-increment)
   - RLS policies tested with 5 different users
   - **Saved to RAG**: Pattern "auth-database-schema"

3. **Testing Strategy**
   - Achieved 92% coverage (target: 80%+)
   - Comprehensive token expiry tests
   - Security tests for SQL injection, XSS, CSRF
   - **Saved to RAG**: Pattern "auth-testing-suite"

## Lessons Learned 📚

1. **OAuth2 Complexity** ⚠️
   - Initial estimate: 4 hours
   - Actual: 8 hours (2x)
   - Reason: Token refresh logic more complex than expected
   - **Future adjustment**: Add 2x multiplier for OAuth integrations

2. **Index Timing** ✅
   - Added email index BEFORE inserting users (learned from #123)
   - Prevented performance degradation at scale
   - **Lesson**: Always create indexes before bulk inserts

3. **Cookie Security** ✅
   - Started with localStorage (insecure)
   - Switched to httpOnly cookies (recommended by #789)
   - Prevented XSS attacks
   - **Lesson**: Always use httpOnly for sensitive tokens

## Reusable Code 📝

Extracted 8 reusable patterns:

1. **JWT Service** (`src/auth/jwt-service.ts:42-67`)
   - Token generation with custom claims
   - Expiry handling
   - Refresh token rotation

2. **Auth Middleware** (`src/auth/middleware.ts:12-35`)
   - Token verification
   - User session restoration
   - Error handling

3. **LoginForm Component** (`src/components/auth/LoginForm.tsx:15-45`)
   - Form validation with React Hook Form
   - Accessibility (WCAG 2.1 AA)
   - Error message display

4. **RLS Policies** (`supabase/migrations/003_auth_rls.sql`)
   - User data isolation
   - Session management
   - Admin bypass patterns

## Impact on Future Work 🚀

**Next Authentication Feature**:
- Estimated effort: **20 hours** (was 28 hours)
- Confidence: **95%** (was 75%)
- Known pitfalls: **8 avoided**
- Code reuse: **60%** (3 of 5 files)

**Template Updated**: `auth-system-v2.yaml`
**RAG Embeddings**: 12 patterns stored
**Plan Accuracy**: Improved from 75% → 95%

## Recommended Actions

1. ✅ Apply "httpOnly cookies" pattern to all auth features
2. ✅ Update onboarding docs with OAuth2 complexity notes
3. ✅ Add "early index creation" checklist to DB guidelines
4. ⏳ Schedule knowledge share session on JWT best practices

---

**Codified by**: feedback-codifier agent
**Stored in**: RAG vector store (domain: feature_implementations)
**Available for**: Future /plan commands
**Next review**: After 3 more auth features (validate template accuracy)
```

### 7. Update Related Documentation

<thinking>
Ensure lessons learned are captured in relevant docs and guidelines.
</thinking>

**Documentation Updates:**

- [ ] Update `docs/patterns/authentication.md` with new learnings
- [ ] Add to `docs/lessons-learned/security.md`
- [ ] Update `CHANGELOG.md` with pattern improvements
- [ ] Add to team wiki or knowledge base
- [ ] Update onboarding checklist with new best practices

## Output Format

Present the learning report with:

1. **Executive Summary** (2-3 sentences)
2. **Effort Accuracy** (estimated vs actual)
3. **Patterns Extracted** (what worked well)
4. **Lessons Learned** (what to remember)
5. **RAG Embeddings** (what was stored)
6. **Future Impact** (how this helps next time)
7. **Recommended Actions** (what to do with learnings)

## Success Metrics

- **RAG Storage**: 5-15 patterns per feature
- **Template Update**: Effort estimates within ±20%
- **Future Accuracy**: 85%+ plan confidence
- **Code Reuse**: 40%+ in similar features
- **Time Savings**: 30-50% on subsequent features

## Integration with /plan Command

When `/plan "Add user authentication"` runs:

1. **RAG Search**: Query vector store for "authentication" patterns
2. **Retrieve Learnings**: Get lessons from previous auth implementations
3. **Apply Estimates**: Use actual effort data (28 hours, not 24)
4. **Suggest Code**: Show reusable examples with file paths
5. **Warn Pitfalls**: "Remember to add email index early"

**Result**: Plans become 40% more accurate with each learning cycle.

---

**Philosophy**: Compounding Engineering
**Phase**: CODIFY (learn from completed work)
**Next Phase**: Use learnings in future PLAN phases
**Cycle**: Plan → Delegate → Assess → **Codify** → Plan (better!)
