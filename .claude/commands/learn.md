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

### 2. Extract Patterns ⭐ AGENT-DRIVEN (Feedback-Codifier)

<thinking>
Use the Feedback-Codifier agent to systematically analyze completed work and extract reusable patterns, successful approaches, and lessons learned for future use.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE FEEDBACK-CODIFIER USING THE TASK TOOL:**

**ACTION: Invoke Feedback-Codifier Agent**
Call the Task tool with:
- `subagent_type: "Feedback-Codifier"`
- `description: "Extract patterns from completed work"`
- `prompt: "Analyze completed work and extract learnings for '${learning_target}'. Input: Git commits (${commit_count}), code changes (${files_changed} files), test coverage (${coverage}%), time spent (estimated: ${estimated_effort}, actual: ${actual_effort}), success indicators (tests passing: ${tests_passing}, deployed: ${deployed}). Your pattern extraction expertise: (1) Identify successful patterns (what worked well), (2) Identify anti-patterns avoided (what was prevented), (3) Calculate effort accuracy (planned vs actual with variance analysis), (4) Extract reusable code snippets with file:line references, (5) Codify lessons learned (key insights, gotchas, best practices), (6) Suggest future improvements (what could be better next time). Pattern categories: Architecture, Security, Performance, Testing, Developer Experience. Return: { successful_patterns: [], anti_patterns_avoided: [], effort_metrics: {}, reusable_code: [{snippet, file, lines, pattern_name}], lessons_learned: [], future_improvements: [], confidence_score: number }"`

**STOP AND WAIT for Feedback-Codifier agent to complete before proceeding.**

**⛔ CHECKPOINT: You MUST have Feedback-Codifier's pattern extraction before storing in RAG. Use their systematic analysis to ensure high-quality learnings.**

**Agent-Driven Pattern Analysis:**

Invoke Feedback-Codifier for comprehensive learning extraction:

```typescript
// Agent Task: Feedback-Codifier analyzes completed work
Task feedback-codifier: `Extract learnings from completed work: "${learning_target}"

**Completed Work Analysis Data**:

Git History:
- Commits: ${commit_count}
- Changed files: ${files_changed}
- Lines added: ${lines_added}
- Lines removed: ${lines_removed}
- Commit messages: ${commit_messages}

Code Changes:
- Implementation files: ${impl_files}
- Test files: ${test_files}
- Documentation: ${doc_files}
- Migrations: ${migration_files}

Quality Metrics:
- Test coverage: ${coverage}% (target: 80%+)
- Tests passing: ${tests_passing}/${tests_total}
- Security audit: ${security_status}
- Performance: ${performance_metrics}

Effort Tracking:
- Estimated effort: ${estimated_effort} hours
- Actual effort: ${actual_effort} hours
- Accuracy: ${accuracy}%
- Variance reason: ${variance_reason}

Success Indicators:
- Tests passing: ${tests_passing}
- Deployed: ${deployed}
- User acceptance: ${user_acceptance}

**Your Pattern Extraction Expertise:**

1. **Identify Successful Patterns** (What worked well):
   ```typescript
   // Analyze code changes for patterns that led to success
   const successfulPatterns = [];

   // Architecture patterns
   if (has_clean_separation_of_concerns) {
     successfulPatterns.push({
       category: 'architecture',
       pattern: 'Clean database/API/UI separation',
       evidence: 'Database layer independent, API tested with mocks, UI tested with API mocks',
       reusability: 'high',
       files: ['src/database/', 'src/api/', 'src/components/']
     });
   }

   // Security patterns
   if (has_parameterized_queries) {
     successfulPatterns.push({
       category: 'security',
       pattern: 'Parameterized SQL queries prevent injection',
       evidence: 'All database queries use parameterized statements, 0 SQL injection vulnerabilities',
       reusability: 'critical',
       files: ['src/database/queries.ts:42-67']
     });
   }

   // Performance patterns
   if (has_early_indexes) {
     successfulPatterns.push({
       category: 'performance',
       pattern: 'Create indexes BEFORE bulk inserts',
       evidence: 'Email index created before user data import, no performance degradation',
       reusability: 'high',
       files: ['supabase/migrations/001_indexes.sql']
     });
   }
   ```

2. **Identify Anti-Patterns Avoided** (What was prevented):
   ```typescript
   // Analyze what mistakes were avoided
   const antiPatternsAvoided = [];

   if (avoided_string_concatenation_in_sql) {
     antiPatternsAvoided.push({
       anti_pattern: 'SQL string concatenation',
       how_avoided: 'Used parameterized queries from the start',
       risk_prevented: 'SQL injection vulnerability',
       evidence: 'Code review flagged concatenation attempt, immediately switched to params'
     });
   }

   if (avoided_storing_secrets_in_code) {
     antiPatternsAvoided.push({
       anti_pattern: 'Hardcoded secrets',
       how_avoided: 'Used environment variables for all sensitive data',
       risk_prevented: 'Credential exposure in git history',
       evidence: '.env.example provided, .env in .gitignore'
     });
   }
   ```

3. **Calculate Effort Accuracy** (Planned vs actual):
   ```typescript
   const effortMetrics = {
     estimated_hours: 24,
     actual_hours: 28,
     accuracy: 86%,  // 24/28 = 0.857
     variance_hours: +4,  // 28 - 24
     variance_percentage: +16.7%,

     variance_breakdown: [
       { reason: 'OAuth2 integration complexity', hours_added: 3, notes: 'Token refresh logic took longer than expected' },
       { reason: 'Additional security tests', hours_added: 1, notes: 'Added XSS and CSRF tests not in original estimate' }
     ],

     complexity_factors: {
       database_tables: 3,
       api_endpoints: 5,
       frontend_components: 4,
       test_files: 8,
       external_integrations: 2  // OAuth2, email service
     },

     future_estimate_adjustment: {
       for_similar_features: '28 hours ± 4 hours',
       confidence: '95%',
       reasoning: 'Now have real data for auth features with OAuth'
     }
   };
   ```

4. **Extract Reusable Code** (Snippets with file:line references):
   ```typescript
   const reusableCode = [
     {
       pattern_name: 'JWT token generation',
       file: 'src/auth/jwt-service.ts',
       lines: '42-67',
       snippet: `
function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}`,
       reusability: 'high',
       notes: 'Works for any user authentication, configurable expiry'
     },
     {
       pattern_name: 'RLS policy for multi-tenant data',
       file: 'supabase/migrations/003_auth_rls.sql',
       lines: '15-22',
       snippet: `
CREATE POLICY users_own_data ON users
USING (id = auth.uid());`,
       reusability: 'critical',
       notes: 'Standard RLS pattern for user data isolation'
     },
     {
       pattern_name: 'React form validation with Zod',
       file: 'src/components/auth/LoginForm.tsx',
       lines: '15-45',
       snippet: `
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});`,
       reusability: 'high',
       notes: 'Zod + React Hook Form integration for client-side validation'
     }
   ];
   ```

5. **Codify Lessons Learned** (Key insights):
   ```typescript
   const lessonsLearned = [
     {
       lesson: 'Create database indexes BEFORE inserting data',
       category: 'performance',
       impact: 'high',
       evidence: 'Index created after 1000 users → 5s queries. Index created before → 10ms queries.',
       future_action: 'Always add indexes in initial migration, not later'
     },
     {
       lesson: 'Use httpOnly cookies for JWT tokens, not localStorage',
       category: 'security',
       impact: 'critical',
       evidence: 'OWASP recommends httpOnly cookies to prevent XSS token theft',
       future_action: 'Default to httpOnly cookies for all sensitive tokens'
     },
     {
       lesson: 'OAuth2 token refresh is complex - estimate 2x time',
       category: 'estimation',
       impact: 'medium',
       evidence: 'Estimated 3h for OAuth, actually took 6h due to token rotation complexity',
       future_action: 'Add 2x multiplier for OAuth features in estimates'
     },
     {
       lesson: 'Test RLS policies with multiple users, not just one',
       category: 'testing',
       impact: 'high',
       evidence: 'RLS policy worked for admin but failed for regular users',
       future_action: 'Test RLS with 3+ user roles (admin, user, guest)'
     }
   ];
   ```

6. **Suggest Future Improvements** (What could be better):
   ```typescript
   const futureImprovements = [
     {
       improvement: 'Add rate limiting to auth endpoints',
       priority: 'high',
       reasoning: 'Current implementation has no rate limiting, vulnerable to brute force',
       estimated_effort: '2 hours',
       implementation: 'Use express-rate-limit middleware on /auth/login'
     },
     {
       improvement: 'Implement refresh token rotation',
       priority: 'medium',
       reasoning: 'Current refresh tokens never expire, security risk',
       estimated_effort: '4 hours',
       implementation: 'Generate new refresh token on each refresh, invalidate old one'
     },
     {
       improvement: 'Add email verification',
       priority: 'medium',
       reasoning: 'Users can sign up without verifying email',
       estimated_effort: '6 hours',
       implementation: 'Send verification email on signup, require verification before login'
     }
   ];
   ```

**Return Format:**
```typescript
return {
  successful_patterns: [
    { category: 'architecture', pattern: 'Clean separation', evidence: '...', reusability: 'high' },
    { category: 'security', pattern: 'Parameterized queries', evidence: '...', reusability: 'critical' },
    { category: 'performance', pattern: 'Early indexes', evidence: '...', reusability: 'high' }
  ],
  anti_patterns_avoided: [
    { anti_pattern: 'SQL concatenation', how_avoided: 'Used params', risk_prevented: 'SQL injection' },
    { anti_pattern: 'Hardcoded secrets', how_avoided: 'Used env vars', risk_prevented: 'Credential exposure' }
  ],
  effort_metrics: {
    estimated: 24, actual: 28, accuracy: 86%, variance: +4h,
    variance_breakdown: [{reason: 'OAuth complexity', hours: +3}],
    future_estimate: '28h ± 4h'
  },
  reusable_code: [
    { pattern: 'JWT generation', file: 'src/auth/jwt-service.ts:42-67', snippet: '...' },
    { pattern: 'RLS policy', file: 'supabase/migrations/003_rls.sql:15-22', snippet: '...' }
  ],
  lessons_learned: [
    { lesson: 'Create indexes early', impact: 'high', evidence: '5s → 10ms', action: 'Always add indexes first' },
    { lesson: 'httpOnly cookies > localStorage', impact: 'critical', evidence: 'OWASP rec', action: 'Default to cookies' }
  ],
  future_improvements: [
    { improvement: 'Add rate limiting', priority: 'high', effort: '2h' },
    { improvement: 'Token rotation', priority: 'medium', effort: '4h' }
  ],
  confidence_score: 95  // High confidence due to real evidence from completed work
}
```
`

// Wait for Feedback-Codifier to complete pattern extraction
const patterns = await waitForAgent('feedback-codifier');
```

**Pattern Categories (Enhanced):**

- [ ] **Architecture Patterns**: Component structure, API design, database schema, separation of concerns
- [ ] **Security Patterns**: Auth implementation, input validation, RLS policies, OWASP compliance
- [ ] **Performance Patterns**: Query optimization, caching strategies, indexes, < 200ms response times
- [ ] **Testing Patterns**: Test organization, coverage strategies (80%+), fixtures, AAA pattern
- [ ] **Developer Experience**: Setup ease, documentation quality, debugging, onboarding time

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
Embed learnings into vector store for future retrieval during planning phase. Users can choose to store patterns in Public RAG (framework patterns), Private RAG (proprietary learnings), or both.
</thinking>

**🔒 Storage Selection with Automated Sanitization (v7.8.0+)**

Before storing patterns, determine where to save them. VERSATIL now includes **automated privacy protection** to prevent data leaks.

**Prompt user**:
```
Where should these learnings be stored?

1. 🔒 Private RAG (recommended) - Your proprietary patterns, not shared
   → Full implementation with project-specific details
   → No sanitization applied (your data stays yours)

2. 🌍 Public RAG - Framework patterns, helps community
   → Automatic sanitization applied (project IDs → placeholders)
   → Patterns validated for privacy (no credentials/secrets)
   → Rejected if proprietary/unsanitizable

3. Both - Store in Private + contribute sanitized version to Public
   → Private: Complete implementation
   → Public: Generic framework pattern (auto-sanitized)
   → Best of both: Keep your specifics + help community

Choose (1/2/3): _
```

**Default behavior**:
- If Private RAG configured: Default to option 1 (Private)
- If Private RAG NOT configured: Suggest setup with `npm run setup:private-rag`, fallback to option 2 (Public)
- If user says "both": Classify patterns automatically (proprietary → Private, generic → Public)

**Automated Sanitization (v7.8.0)** - Options 2 & 3:

When storing to Public RAG, patterns are automatically:
1. **Classified**: `public-safe`, `requires-sanitization`, `private-only`, `credentials`, `unsanitizable`
2. **Sanitized**: Project IDs → `YOUR_PROJECT_ID`, URLs → `https://your-service.run.app`
3. **Validated**: Pre-storage privacy audit (no leaks)
4. **Rejected**: If contains credentials, proprietary logic, or unsanitizable data

**Sanitization Preview** (shown for option 2/3):

```typescript
// BEFORE (your implementation):
gcloud run deploy versatil-graphrag-query \
  --project=centering-vine-443902-f1 \
  --service-account=123456@developer.gserviceaccount.com

// AFTER (sanitized for Public RAG):
gcloud run deploy versatil-graphrag-query \
  --project=YOUR_PROJECT_ID \
  --service-account=YOUR_SERVICE_ACCOUNT@developer.gserviceaccount.com

✅ Sanitization: 2 redactions, 95% confidence
⚠️  Review changes before confirming storage
```

**Pattern Classification with Sanitization Policy**:

```typescript
import { getSanitizationPolicy } from '../src/rag/sanitization-policy.js';

// Auto-classify patterns with sanitization awareness
const policy = getSanitizationPolicy();

for (const pattern of patterns) {
  const decision = await policy.evaluatePattern(pattern);

  switch (decision.classification) {
    case 'PUBLIC_SAFE':
      // Store in Public RAG as-is
      console.log(`✅ ${pattern.pattern}: Public-safe (no sanitization needed)`);
      break;

    case 'REQUIRES_SANITIZATION':
      // Sanitize then store in Public RAG
      console.log(`⚠️  ${pattern.pattern}: Sanitization required`);
      console.log(`   Redactions: ${decision.sanitizationResult.redactions.length}`);
      console.log(`   Confidence: ${decision.sanitizationResult.confidence}%`);
      // Show preview, ask user to confirm
      break;

    case 'PRIVATE_ONLY':
    case 'CREDENTIALS':
    case 'UNSANITIZABLE':
      // Block from Public RAG, only allow Private storage
      console.log(`❌ ${pattern.pattern}: Cannot be made public`);
      console.log(`   Reason: ${decision.reasoning.join(', ')}`);
      // Force Private RAG storage only
      break;
  }
}
```

**User Confirmation for Sanitized Patterns**:

```
Pattern: "Cloud Run GraphRAG Deployment"
Classification: Requires Sanitization
Confidence: 95%

Sanitization Preview:
  - Project ID: cent...2-f1 → YOUR_PROJECT_ID
  - Service Account: 1234...m → YOUR_SERVICE_ACCOUNT@...

Store sanitized version in Public RAG? (y/n):
```

**⛔ BLOCKING STEP - YOU MUST INVOKE DR.AI-ML AND OLIVER-MCP USING THE TASK TOOL:**

**ACTION 1: Invoke Dr.AI-ML Agent**
Call the Task tool with:
- `subagent_type: "Dr.AI-ML"`
- `description: "Extract patterns and generate embeddings"`
- `prompt: "Extract reusable patterns from completed work. Input: Session learnings (${learning_count} items), completed todos (${todo_count} items), implementation notes. Your ML expertise: (1) Analyze successful approaches and identify patterns, (2) Generate semantic embeddings for pattern search, (3) Calculate confidence scores for each pattern, (4) Consolidate lessons learned with priority levels (high/medium/low), (5) Extract code examples with file:line references. Return: { patterns: [{pattern_name, description, embedding, confidence, lessons_learned, code_examples}], storage_metadata: {} }"`

**STOP AND WAIT for Dr.AI-ML agent to complete before proceeding.**

**ACTION 2: Invoke Oliver-MCP Agent**
Call the Task tool with:
- `subagent_type: "Oliver-MCP"`
- `description: "Route to RAG store with validation"`
- `prompt: "Route patterns to optimal RAG store with anti-hallucination validation. Input: Patterns from Dr.AI-ML (${pattern_count} patterns). Your routing expertise: (1) Try GraphRAG first (no API quota, offline), (2) Fallback to Vector store if GraphRAG unavailable, (3) Validate patterns aren't hallucinated (cross-check with actual files), (4) Ensure data quality before storage, (5) Return storage confirmation with method used. Return: { stored: boolean, method: 'graphrag'|'vector'|'local', pattern_ids: [], validation_results: {} }"`

**STOP AND WAIT for Oliver-MCP agent to complete before proceeding.**

**Do NOT directly call RAG services - route through agents for ML-powered extraction and quality validation.**

**⛔ CHECKPOINT: You MUST have BOTH agent outputs before confirming patterns are stored. Verify Oliver confirms successful storage.**

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
