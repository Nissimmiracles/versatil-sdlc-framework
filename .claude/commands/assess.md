---
description: "Assess readiness before starting work - quality gates and prerequisite checks"
argument-hint: "[work target or feature description]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Read"
  - "Grep"
  - "Glob"
  - "Bash(npm:*)"
  - "Bash(git:*)"
  - "Bash(psql:*)"
---

# Assess Readiness - Compounding Engineering (Assess Phase)

## Introduction

**Quality gates before work starts** to ensure you're set up for success. This implements the "Assess" phase of VELOCITY workflow's Compounding Engineering approach: verify readiness before executing.

**Philosophy**: "Catch blockers early, not halfway through implementation."

## Flags

- `--continuous`: Run continuous monitoring during implementation (checks every 30 minutes)
- `--interval=N`: Custom monitoring interval in minutes (default: 30, with `--continuous`)
- `--alert-threshold=N`: Health threshold for alerts (default: 80%)

## Usage Examples

```bash
# Single assessment (default)
/assess "Feature: User authentication"

# Continuous monitoring during 8-hour implementation
/assess --continuous "Feature: User authentication"

# Custom monitoring interval (every 15 minutes)
/assess --continuous --interval=15 "Feature: Analytics dashboard"

# Custom alert threshold (warn if health < 90%)
/assess --continuous --alert-threshold=90 "Feature: Payment processing"
```

## Assessment Target

<assessment_target> #$ARGUMENTS </assessment_target>

## Main Tasks

### 1. Framework Health Check

<thinking>
First, verify the VERSATIL framework itself is healthy and ready for work.
</thinking>

**Health Assessment:**

Run comprehensive health check:

```bash
npm run monitor
```

**Health Criteria:**

- [ ] **Overall Health**: ≥ 80% (minimum for production work)
  - Agent Health: 100% (all agents operational)
  - Proactive System: ≥ 95% (auto-activation working)
  - Rules Efficiency: ≥ 80% (at least 4 of 5 rules enabled)
  - Framework Integrity: 100% (all critical files present)

- [ ] **Agent Availability**: All required agents operational
  - Database work: Dana-Database at 100%
  - API work: Marcus-Backend at 100%
  - Frontend work: James-Frontend at 100%
  - Quality assurance: Maria-QA at 100%

- [ ] **Rule Status**: Key automation rules enabled
  - Rule 1 (Parallel): ✅ (for efficient multi-task work)
  - Rule 2 (Stress Testing): ✅ (for quality validation)
  - Rule 3 (Daily Audit): ✅ (for ongoing monitoring)

**Health Report:**

```yaml
Framework Assessment:
  overall_health: 100%
  status: ✅ READY
  blockers: []
  warnings: []

Agent Readiness:
  dana-database: 100% ✅
  marcus-backend: 100% ✅
  james-frontend: 100% ✅
  maria-qa: 100% ✅
  alex-ba: 100% ✅
  sarah-pm: 100% ✅
  dr-ai-ml: 100% ✅

Automation Rules:
  rule1_parallel: ✅ enabled
  rule2_stress: ✅ enabled
  rule3_audit: ✅ enabled
  rule4_onboarding: ✅ enabled
  rule5_releases: ✅ enabled
```

### 2. Git Repository Status

<thinking>
Verify clean working tree and proper branch state before starting work.
</thinking>

**Git Assessment:**

```bash
# Check working tree status
git status --porcelain

# Check current branch
git branch --show-current

# Check if branch is up to date
git fetch origin
git status -uno

# Check for uncommitted changes
git diff --stat
git diff --cached --stat
```

**Git Criteria:**

- [ ] **Clean Working Tree**: No uncommitted changes
  - Unstaged files: 0
  - Staged files: 0
  - Untracked files: Acceptable (not critical)

- [ ] **Branch Status**: Proper branch for work
  - Not on `main` or `master` (unless hotfix)
  - Feature branch exists or can be created
  - Up to date with remote: `git pull origin main`

- [ ] **Merge Conflicts**: No conflicts with main branch
  - `git merge-base main HEAD` succeeds
  - No conflicting files

**Git Report:**

```yaml
Git Assessment:
  working_tree: ✅ clean
  current_branch: "feature/user-auth"
  up_to_date: ✅ yes
  conflicts: ❌ none
  ready_to_work: ✅ YES

Recommendations:
  - ✅ Working tree clean, ready to start
  - ✅ On feature branch (not main)
  - ✅ No merge conflicts detected
```

**Auto-Remediation** (if issues found):

```bash
# If uncommitted changes:
git stash save "WIP: Stashing before assess"

# If on main branch:
git checkout -b feature/new-feature

# If behind remote:
git pull origin main
```

### 3. Dependencies Check

<thinking>
Verify all dependencies are installed and up to date.
</thinking>

**Dependency Assessment:**

```bash
# Check node_modules exists
test -d node_modules && echo "✅ Installed" || echo "❌ Missing"

# Check for security vulnerabilities
npm audit --audit-level=high

# Check for outdated dependencies
npm outdated

# Verify lock file integrity
npm ci --dry-run 2>&1
```

**Dependency Criteria:**

- [ ] **Installation**: `node_modules/` directory exists
- [ ] **Security**: No high/critical vulnerabilities
- [ ] **Versions**: No major version conflicts
- [ ] **Lock File**: `package-lock.json` matches `package.json`

**Dependency Report:**

```yaml
Dependency Assessment:
  installed: ✅ yes (node_modules exists)
  security_audit: ✅ passed (0 high/critical)
  outdated_count: 3 packages (not blocking)
  lock_file_valid: ✅ yes

Security Vulnerabilities:
  critical: 0
  high: 0
  moderate: 2 (acceptable)
  low: 5 (acceptable)

Outdated Packages:
  - typescript: 5.2.2 → 5.3.0 (minor update)
  - eslint: 8.50.0 → 8.52.0 (patch update)
  - jest: 29.6.0 → 29.7.0 (minor update)

Recommendation: ✅ Safe to proceed (no blocking issues)
```

**Auto-Remediation:**

```bash
# If node_modules missing:
npm install

# If high/critical vulnerabilities:
npm audit fix

# If lock file out of sync:
npm ci
```

### 4. Database Connectivity

<thinking>
Verify database is accessible and migrations are up to date.
</thinking>

**Database Assessment:**

```bash
# Check database connection (PostgreSQL/Supabase)
psql $DATABASE_URL -c "SELECT version();" 2>&1

# Check migration status (if using migrations)
npx supabase migration list 2>&1 || \
  npx prisma migrate status 2>&1 || \
  echo "No migration system detected"

# Check table count (basic health)
psql $DATABASE_URL -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>&1
```

**Database Criteria:**

- [ ] **Connection**: Can connect to database
- [ ] **Migrations**: All migrations applied
- [ ] **Schema**: Expected tables exist
- [ ] **Permissions**: User has required permissions (SELECT, INSERT, UPDATE, DELETE)

**Database Report:**

```yaml
Database Assessment:
  connection: ✅ connected
  database_url: "postgresql://localhost:5432/versatil"
  version: "PostgreSQL 15.4"
  migrations: ✅ up to date (12 applied, 0 pending)
  tables: 15 tables in public schema
  permissions: ✅ full access

Tables Present:
  - users (with RLS policies)
  - sessions
  - features
  - todos
  - ... (12 more)

Recommendation: ✅ Database ready for work
```

**Auto-Remediation:**

```bash
# If migrations pending:
npx supabase migration up || npx prisma migrate deploy

# If connection fails:
echo "⚠️  BLOCKER: Cannot connect to database"
echo "→ Check DATABASE_URL environment variable"
echo "→ Ensure database is running: docker-compose up -d"
```

### 5. Environment Variables ⭐ AGENT-DRIVEN

<thinking>
Use Oliver-MCP agent to intelligently validate environment configuration and route to appropriate validation tools.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE OLIVER-MCP USING THE TASK TOOL:**

**ACTION: Invoke Oliver-MCP Agent**
Call the Task tool with:
- `subagent_type: "Oliver-MCP"`
- `description: "Validate environment configuration"`
- `prompt: "Validate environment configuration for '${assessment_target}'. Input: .env file status, detected environment variables, project type. Your intelligent routing: (1) Detect project type (Supabase/PostgreSQL/custom), (2) Identify required environment variables based on project dependencies, (3) Validate variable formats (URLs, keys, secrets), (4) Check for placeholder values ('YOUR_KEY_HERE', 'CHANGE_ME'), (5) Test connectivity for external services (database, APIs), (6) Route validation to appropriate MCP tools if available, (7) Provide anti-hallucination check (verify vars actually exist, don't make up missing ones). Return: { env_file_exists: boolean, required_vars: [], vars_set: [], vars_missing: [], format_issues: [], placeholder_issues: [], connectivity_tests: {}, validation_method: 'mcp'|'bash'|'manual', recommendations: [] }"`

**STOP AND WAIT for Oliver-MCP agent to complete before proceeding.**

**⛔ CHECKPOINT: You MUST have Oliver-MCP's validation results before continuing. Use his intelligent routing to perform comprehensive environment checks.**

**Agent-Driven Environment Validation:**

Invoke Oliver-MCP for intelligent environment configuration validation:

```typescript
// Agent Task: Oliver-MCP validates environment with intelligent routing
Task oliver-mcp: `Validate environment configuration for: "${assessment_target}"

**Initial Environment Scan**:
- .env file exists: ${env_file_exists}
- Project type: ${project_type}  // Detected from package.json
- Dependencies: ${dependencies}  // Supabase, PostgreSQL, Redis, etc.

**Your Intelligent Routing Strategy:**

1. **Detect Project Type** (auto-detect from dependencies):
   - Supabase project: package.json has "@supabase/supabase-js"
   - PostgreSQL: package.json has "pg" or "postgres"
   - MySQL: package.json has "mysql2"
   - MongoDB: package.json has "mongodb"
   - Redis: package.json has "redis" or "ioredis"
   - Custom: No recognized database library

2. **Identify Required Environment Variables**:
   ```typescript
   // Based on detected project type
   if (has_supabase) {
     required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
   }
   if (has_postgres) {
     required = ['DATABASE_URL'];
   }
   if (has_jwt_auth) {
     required = ['JWT_SECRET', 'JWT_EXPIRY'];
   }
   if (has_oauth) {
     required = ['OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_CALLBACK_URL'];
   }
   // ... detect from imports and dependencies
   ```

3. **Validate Variable Formats**:
   - DATABASE_URL: postgresql://[user]:[pass]@[host]:[port]/[db]
   - SUPABASE_URL: https://[project].supabase.co
   - JWT_SECRET: >= 32 characters
   - API Keys: Match expected format (e.g., eyJ... for JWT)

4. **Check for Placeholder Values**:
   ```bash
   grep -r "YOUR_.*_HERE\|CHANGE_ME\|REPLACE_THIS" .env
   ```

5. **Test Connectivity** (if MCP tools available):
   - Use Supabase MCP to test SUPABASE_URL connectivity
   - Use bash to test DATABASE_URL connection
   - Use curl to test external API endpoints

6. **Route Validation**:
   ```typescript
   route_validation():
     if (has_supabase_mcp):
       use versatil_mcp_supabase_health_check()
     else if (has_psql):
       use bash: psql $DATABASE_URL -c "SELECT 1"
     else:
       use manual: Check .env file manually
   ```

7. **Anti-Hallucination Check**:
   - Read .env file directly (don't guess variable values)
   - Verify variables actually exist in process.env
   - Don't report variables as "set" if you haven't verified them
   - Flag uncertainty if variable format is unknown

**Return Format:**
```typescript
return {
  env_file_exists: boolean,
  required_vars: ['DATABASE_URL', 'JWT_SECRET', ...],
  vars_set: ['DATABASE_URL', 'JWT_SECRET'],
  vars_missing: ['OAUTH_CLIENT_ID'],  // Actually missing, not hallucinated
  format_issues: [
    { var: 'DATABASE_URL', issue: 'Invalid PostgreSQL URL format', expected: 'postgresql://...' }
  ],
  placeholder_issues: [
    { var: 'JWT_SECRET', value_pattern: 'CHANGE_ME', severity: 'critical' }
  ],
  connectivity_tests: {
    database: { tested: true, connected: true, latency_ms: 45 },
    supabase: { tested: false, reason: 'No Supabase MCP available' }
  },
  validation_method: 'mcp' | 'bash' | 'manual',
  recommendations: [
    'Replace JWT_SECRET placeholder with secure 64-character string',
    'Add missing OAUTH_CLIENT_ID for OAuth authentication'
  ]
}
```

**Intelligent Routing Example:**
```typescript
// Supabase project detected
if (has_supabase_dependency && has_supabase_mcp) {
  // Use MCP for advanced validation
  const result = await mcp_supabase_health_check({
    supabase_url: process.env.SUPABASE_URL,
    anon_key: process.env.SUPABASE_ANON_KEY
  });
  return { connectivity_tests: { supabase: result }, validation_method: 'mcp' };
}

// PostgreSQL detected, no MCP
else if (has_postgres_dependency) {
  // Use bash psql command
  exec(`psql ${process.env.DATABASE_URL} -c "SELECT 1"`);
  return { validation_method: 'bash' };
}

// Unknown/custom setup
else {
  // Manual verification needed
  return { validation_method: 'manual', recommendations: ['Manually verify environment setup'] };
}
```
`

// Wait for Oliver-MCP to complete intelligent validation
const envValidation = await waitForAgent('oliver-mcp');
```

**Environment Assessment (Enhanced with Oliver-MCP):**

```bash
# Check .env file exists
test -f .env && echo "✅ Present" || echo "❌ Missing"

# Check required variables (auto-detected by Oliver-MCP)
required_vars=$(oliver_detected_vars)  # Intelligent detection based on project type
for var in $required_vars; do
  if [ -z "${!var}" ]; then
    echo "❌ $var not set"
  else
    echo "✅ $var set"
  fi
done
```

**Environment Criteria:**

- [ ] **File Exists**: `.env` file present
- [ ] **Required Variables**: All critical vars set (auto-detected by Oliver-MCP)
  - Auto-detected from project dependencies
  - No hardcoded list (intelligent project analysis)

- [ ] **Variable Format**: Proper URL/key formats (validated by Oliver-MCP)
- [ ] **No Placeholders**: No "YOUR_KEY_HERE" values (checked by Oliver-MCP)
- [ ] **Connectivity**: External services reachable (tested by Oliver-MCP if MCP available)

**Environment Report (Oliver-MCP Enhanced):**

```yaml
Environment Assessment:
  env_file: ✅ present (.env exists)
  required_vars: 5/5 set (100%)
  validation_method: mcp  # Oliver-MCP used Supabase MCP for advanced validation

Variables Status:
  DATABASE_URL: ✅ set (postgresql://...) - Format valid, connection tested (45ms)
  SUPABASE_URL: ✅ set (https://...) - Format valid, MCP health check passed
  SUPABASE_ANON_KEY: ✅ set (eyJ...) - Format valid (JWT)
  JWT_SECRET: ✅ set (64 chars) - Strong entropy
  OAUTH_CLIENT_ID: ⚠️ missing - Required for OAuth (detected from dependencies)

Connectivity Tests:
  database: ✅ connected (45ms latency)
  supabase: ✅ healthy (MCP health check passed)

Placeholder Issues:
  None detected ✅

Recommendation: ⚠️ Add missing OAUTH_CLIENT_ID before starting OAuth work
```

**Auto-Remediation:**

```bash
# If .env missing:
cp .env.example .env
echo "⚠️  Created .env from template - CONFIGURE BEFORE PROCEEDING"

# If variables missing (Oliver-MCP detected):
echo "❌ BLOCKER: Required environment variables not set"
echo "→ Copy .env.example to .env"
echo "→ Oliver-MCP detected missing: OAUTH_CLIENT_ID"
echo "→ Project dependencies indicate OAuth is used"

# If placeholders detected:
echo "🔴 CRITICAL: Placeholder values detected"
echo "→ JWT_SECRET: Replace 'CHANGE_ME' with secure 64-character string"
echo "→ Generate: openssl rand -hex 32"
```

### 6. Build & Test Status

<thinking>
Verify the codebase builds and tests pass before starting new work.
</thinking>

**Build Assessment:**

```bash
# Check if build succeeds
npm run build 2>&1 | tail -20

# Check test suite status
npm test 2>&1 | grep -E "(passing|failing|Tests:)" | tail -5

# Check test coverage
npm run test:coverage 2>&1 | grep -E "Statements|Branches" | head -2
```

**Build Criteria:**

- [ ] **Build Success**: `npm run build` exits with code 0
- [ ] **No TypeScript Errors**: 0 errors, warnings acceptable
- [ ] **Tests Passing**: ≥ 95% of tests pass (some flaky tests acceptable)
- [ ] **Coverage**: ≥ 80% statement coverage

**Build Report:**

```yaml
Build Assessment:
  build_status: ✅ success
  typescript_errors: 0
  typescript_warnings: 12 (acceptable)
  build_time: 4.2s

Test Assessment:
  total_tests: 342
  passing: 340 (99.4%)
  failing: 2 (known flaky tests)
  skipped: 0
  coverage: 87% (target: 80%+)

Test Suite Breakdown:
  unit_tests: 285 passing
  integration_tests: 48 passing
  e2e_tests: 7 passing (2 flaky)

Recommendation: ✅ Tests healthy (2 flaky tests acceptable)
```

**Auto-Remediation:**

```bash
# If build fails:
echo "❌ BLOCKER: Build failing"
echo "→ Fix TypeScript errors before proceeding"
npm run build 2>&1 | grep "error TS"

# If tests fail:
echo "⚠️  WARNING: Tests failing"
echo "→ Review failed tests (may proceed if unrelated)"
npm test 2>&1 | grep "FAIL"
```

### 7. Work Prerequisites Check

<thinking>
Verify specific prerequisites for the target work (feature-specific).
</thinking>

**Prerequisites Assessment:**

Based on assessment target, check domain-specific requirements:

**For Database Work** (Dana-Database):
- [ ] Database connection established
- [ ] Migrations up to date
- [ ] Backup taken (if production)
- [ ] RLS policies reviewed (if multi-tenant)

**For API Work** (Marcus-Backend):
- [ ] API server can start: `npm run dev` (test for 5 seconds)
- [ ] Required services running (Redis, message queue, etc.)
- [ ] API documentation accessible
- [ ] Postman/Insomnia collection available

**For Frontend Work** (James-Frontend):
- [ ] Dev server can start: `npm run dev` (test for 5 seconds)
- [ ] Backend API accessible
- [ ] UI component library available
- [ ] Design mockups accessible (Figma, etc.)

**For Testing Work** (Maria-QA):
- [ ] Test framework configured
- [ ] Coverage reports generating
- [ ] CI/CD pipeline accessible
- [ ] Test data/fixtures available

### 8. Generate Readiness Score ⭐ AGENT-DRIVEN

<thinking>
Use Sarah-PM agent to calculate strategic readiness score and provide go/no-go recommendation based on her project management expertise.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE SARAH-PM USING THE TASK TOOL:**

**ACTION: Invoke Sarah-PM Agent**
Call the Task tool with:
- `subagent_type: "Sarah-PM"`
- `description: "Calculate strategic readiness score"`
- `prompt: "Calculate readiness score for '${assessment_target}'. Input: Assessment data from Steps 1-7 (framework health, git status, dependencies, database, environment, build/tests, prerequisites). Your strategic PM analysis: (1) Calculate weighted readiness score (0-100%), (2) Identify blockers (issues preventing start), (3) Identify warnings (non-blocking concerns), (4) Provide go/no-go recommendation with reasoning, (5) Suggest mitigation strategies for warnings, (6) Estimate risk level. Return: { overall_score: number, components: {framework_health, git_status, dependencies, database, environment, build_tests, prerequisites}, blockers: [], warnings: [], recommendation: 'GO'|'CAUTION'|'NO-GO', reasoning: string, risk_level: 'LOW'|'MEDIUM'|'HIGH', mitigation_plan: [] }"`

**STOP AND WAIT for Sarah-PM agent to complete before displaying assessment report.**

**⛔ CHECKPOINT: You MUST have Sarah-PM's readiness calculation before proceeding. Use her strategic assessment to generate the final report.**

**Agent-Driven Readiness Calculation:**

Invoke Sarah-PM for strategic project readiness assessment:

```typescript
// Agent Task: Sarah-PM calculates readiness with PM expertise
Task sarah-pm: `Calculate readiness score for: "${assessment_target}"

**Assessment Data from Steps 1-7**:

Framework Health (Step 1):
- Overall health: ${framework_health}%
- Agents operational: ${agents_operational}/7
- Rules enabled: ${rules_enabled}/5

Git Status (Step 2):
- Working tree: ${working_tree_clean ? 'Clean' : 'Dirty'}
- Branch: ${current_branch}
- Up to date: ${up_to_date}

Dependencies (Step 3):
- Installed: ${deps_installed}
- Security audit: ${security_vulnerabilities} vulnerabilities
- Outdated: ${outdated_count} packages

Database (Step 4):
- Connected: ${db_connected}
- Migrations: ${pending_migrations} pending
- Tables: ${table_count}

Environment (Step 5):
- Variables set: ${required_vars_set}/${required_vars_total}
- .env file: ${env_file_exists}

Build & Tests (Step 6):
- Build status: ${build_status}
- Tests passing: ${tests_passing}/${tests_total}
- Coverage: ${test_coverage}%

Prerequisites (Step 7):
- Domain-specific checks: ${prerequisites_met}/${prerequisites_total}
- Blockers: ${prerequisites_blockers}

**Your Strategic PM Analysis:**

1. **Calculate Weighted Readiness Score** (0-100%):
   ```typescript
   readiness = (
     framework_health * 0.20 +
     git_status * 0.15 +
     dependencies * 0.15 +
     database * 0.15 +
     environment * 0.15 +
     build_tests * 0.10 +
     prerequisites * 0.10
   )
   ```

2. **Identify Blockers** (issues preventing start):
   - Critical: Framework health < 70%
   - Critical: Build failing
   - Critical: Database not connected
   - Critical: Required env vars missing

3. **Identify Warnings** (non-blocking concerns):
   - Minor: Outdated dependencies
   - Minor: Flaky tests
   - Minor: Git branch not up to date

4. **Provide Go/No-Go Recommendation**:
   - ≥ 90%: GO - Proceed with confidence
   - 70-89%: CAUTION - Proceed but address warnings
   - < 70%: NO-GO - Fix blockers first

5. **Suggest Mitigation Strategies**:
   - For each warning, provide actionable mitigation
   - Prioritize mitigations by impact

6. **Estimate Risk Level**:
   - LOW: All checks passing, minor warnings only
   - MEDIUM: Some warnings, but no blockers
   - HIGH: Blockers present or many warnings

**Return Format:**
```typescript
return {
  overall_score: number,  // 0-100
  components: {
    framework_health: number,  // 0-100
    git_status: number,        // 0-100
    dependencies: number,      // 0-100
    database: number,          // 0-100
    environment: number,       // 0-100
    build_tests: number,       // 0-100
    prerequisites: number      // 0-100
  },
  blockers: [
    { component: 'database', issue: 'Not connected', severity: 'critical' }
  ],
  warnings: [
    { component: 'dependencies', issue: '3 outdated packages', severity: 'low', mitigation: 'Run npm update' }
  ],
  recommendation: 'GO' | 'CAUTION' | 'NO-GO',
  reasoning: 'Strategic explanation for recommendation',
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH',
  mitigation_plan: [
    { action: 'Update outdated dependencies', priority: 'low', effort: '5 minutes' }
  ]
}
```

**Thresholds:**
- ≥ 90%: GO - Ready to start work
- 70-89%: CAUTION - Proceed with warnings addressed
- < 70%: NO-GO - Fix blockers before proceeding
`

// Wait for Sarah-PM to complete strategic assessment
const readinessAssessment = await waitForAgent('sarah-pm');
```

**Example Sarah-PM Output:**

```yaml
Readiness Assessment:
  overall_score: 92
  recommendation: GO
  reasoning: "Framework health excellent (100%), all critical systems operational. Minor warnings about outdated dependencies and flaky tests, but neither blocking work. Git status clean, database connected, environment configured. Proceed with high confidence."
  risk_level: LOW

  components:
    framework_health: 100  # 20% weight → 20 points
    git_status: 100        # 15% weight → 15 points
    dependencies: 90       # 15% weight → 13.5 points
    database: 100          # 15% weight → 15 points
    environment: 100       # 15% weight → 15 points
    build_tests: 85        # 10% weight → 8.5 points
    prerequisites: 95      # 10% weight → 9.5 points

  blockers: []  # None - ready to proceed

  warnings:
    - component: dependencies
      issue: "3 outdated packages (typescript, eslint, jest)"
      severity: low
      mitigation: "Run 'npm update' - 5 minute effort"

    - component: build_tests
      issue: "2 E2E tests flaky (known issue)"
      severity: low
      mitigation: "Review __tests__/e2e/auth.test.ts or skip for now"

  mitigation_plan:
    - action: "Update outdated dependencies"
      priority: low
      effort: "5 minutes"
      command: "npm update"

    - action: "Review flaky tests"
      priority: low
      effort: "15 minutes"
      command: "npm test __tests__/e2e/auth.test.ts"
```

**Readiness Thresholds:**

- **≥ 90%**: ✅ **GO** - Proceed with confidence
- **70-89%**: ⚠️ **CAUTION** - Proceed but address warnings
- **< 70%**: ❌ **NO-GO** - Fix blockers before starting

### 9. Final Assessment Report

<thinking>
Present comprehensive readiness report with clear recommendation.
</thinking>

**Report Format:**

```markdown
# Readiness Assessment Report

**Date**: 2025-10-13 16:30:00
**Target**: User authentication feature
**Assessed by**: VERSATIL framework monitor

---

## Overall Readiness: 92% ✅ GO

You are **READY TO START WORK** with high confidence.

---

## Component Scores

| Component | Score | Status | Notes |
|-----------|-------|--------|-------|
| Framework Health | 100% | ✅ | All agents operational, 5/5 rules enabled |
| Git Status | 100% | ✅ | Clean working tree, on feature branch |
| Dependencies | 90% | ✅ | All installed, 3 outdated (non-critical) |
| Database | 100% | ✅ | Connected, migrations up to date |
| Environment | 100% | ✅ | All required variables set |
| Build & Tests | 85% | ✅ | Build passes, 99.4% tests passing |
| Prerequisites | 95% | ✅ | Dev server starts, API accessible |

---

## Blockers (0)

No blocking issues detected. ✅

---

## Warnings (2)

1. **Outdated Dependencies** ⚠️
   - Impact: Low
   - Details: 3 packages have minor updates available
   - Action: Run `npm update` (optional, not blocking)

2. **Flaky Tests** ⚠️
   - Impact: Low
   - Details: 2 E2E tests occasionally fail
   - Action: Review tests in `__tests__/e2e/auth.test.ts`

---

## Recommendations

✅ **PROCEED** with work on "User authentication feature"

**Before starting**:
1. Create feature branch: `git checkout -b feature/user-auth`
2. Run initial tests: `npm test` (baseline)
3. Start dev server: `npm run dev` (verify working)

**During work**:
1. Commit frequently (every 30-60 minutes)
2. Run tests after each component: `npm test`
3. Monitor health: `npm run monitor` (if issues arise)

**After completion**:
1. Run full test suite: `npm test`
2. Check coverage: `npm run test:coverage` (≥ 80%)
3. Run `/learn` command to codify learnings

---

## Quick Commands

```bash
# Start development
npm run dev

# Run tests
npm test

# Check health anytime
npm run monitor

# Codify learnings when done
/learn feature/user-auth
```

---

**Assessment Duration**: 8.2 seconds
**Confidence**: High (92%)
**Ready to ship**: YES ✅
```

### 9. Continuous Monitoring Mode

<thinking>
For long-running implementations (8-28 hours), run continuous health checks to catch issues during execution, not after.
</thinking>

**Continuous Mode (--continuous flag):**

When `--continuous` flag is provided:
- [ ] Run initial assessment (all 8 checks)
- [ ] Schedule recurring assessments every N minutes (default: 30)
- [ ] Alert if health drops below threshold (default: 80%)
- [ ] Track health over time (trend analysis)
- [ ] Auto-pause work if critical issues detected

**Usage:**
```bash
# Start continuous monitoring
/assess --continuous "Feature: User authentication (28 hours)"

→ Initial assessment: 98% ✅
→ Monitoring started (checks every 30 minutes)
→ Will alert if health < 80%
```

**Monitoring Loop:**
```yaml
Continuous Monitoring Active:
  feature: "User authentication"
  started: 2025-10-13 10:00:00
  interval: 30 minutes
  alert_threshold: 80%
  checks_completed: 0

Schedule:
  - Check 1: 10:30 (30 min)
  - Check 2: 11:00 (1 hour)
  - Check 3: 11:30 (1.5 hours)
  - ... (continues until work complete)
```

**Real-Time Updates:**
```
🔄 Continuous Monitoring Active

[10:00] Initial Assessment: 98% ✅
[10:30] Health Check 1/16: 97% ✅ (framework: 100%, git: clean, tests: passing)
[11:00] Health Check 2/16: 96% ✅ (minor: 1 dependency outdated)
[11:30] Health Check 3/16: 94% ✅ (minor: test coverage 78%, target 80%)
[12:00] Health Check 4/16: 92% ✅ (warning: database latency 150ms)
[12:30] Health Check 5/16: 88% ⚠️  (CAUTION: test coverage 75%, 3 tests failing)
[12:35] 🚨 ALERT: Health dropped to 88% (threshold: 80%)
        Issue: 3 integration tests failing
        Recommendation: Fix tests before continuing
        Pausing work... (waiting for fix)

[13:00] Health Check 6/16: 95% ✅ (tests fixed, back on track)
[13:30] Health Check 7/16: 96% ✅ (all systems normal)
...
```

**Alert Triggers:**

Alerts sent when:
- [ ] Health drops below threshold (default: 80%)
- [ ] Critical component fails (framework, database, tests)
- [ ] Significant regression (health drops >10% in one check)
- [ ] Quality gate failures accumulate

**Auto-Pause Conditions:**

Work automatically paused when:
- [ ] Health < 70% (critical threshold)
- [ ] Framework integrity broken
- [ ] Database connection lost
- [ ] All tests failing (blocking quality gate)

**Monitoring Report (End of Session):**
```yaml
Continuous Monitoring Summary:
  duration: 28 hours
  checks_completed: 56 (every 30 minutes)
  alerts_triggered: 2

  health_trend:
    initial: 98%
    minimum: 88% (at 12:30, tests failing)
    final: 97%
    average: 95%

  issues_detected:
    - timestamp: 12:30
      issue: "3 integration tests failing"
      severity: medium
      resolved: 12:50 (20 minutes)
      impact: "Work paused for 20 minutes"

    - timestamp: 18:45
      issue: "Database latency 220ms (target: < 100ms)"
      severity: low
      resolved: auto (not blocking)
      impact: "None (continued working)"

  recommendations:
    - "Address test flakiness (3 failures mid-implementation)"
    - "Consider local database (reduce latency)"
    - "Health remained excellent overall (95% avg)"
```

**Integration with /work:**
```bash
# Start work with continuous monitoring
/work --monitor "Feature: User authentication"

→ Automatically runs /assess --continuous
→ Monitors health during entire implementation
→ Alerts on issues in real-time
```

---

## Integration with Workflows

**Before `/plan`**: Run `/assess "Feature X"` to ensure readiness
**Before `/work`**: Run `/assess` to verify environment (or `/work --monitor` for continuous)
**Before `/resolve`**: Run `/assess` to check health
**During long work**: Use `/assess --continuous` for real-time monitoring

**Compounding Engineering Cycle**:
1. **ASSESS** ← (Check readiness before starting + continuous monitoring during work)
2. **PLAN** (Create implementation plan)
3. **DELEGATE** (Execute work)
4. **CODIFY** (Learn from completion)

---

**Philosophy**: Compounding Engineering
**Phase**: ASSESS (verify readiness before work + monitor during execution)
**Next Phase**: PLAN (create detailed implementation)
**Benefit**: Catch blockers early (20-30% rework time saved) + detect issues during execution
