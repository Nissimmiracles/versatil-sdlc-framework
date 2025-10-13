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

**Quality gates before work starts** to ensure you're set up for success. This implements the "Assess" phase of Every Inc's Compounding Engineering philosophy: verify readiness before executing.

**Philosophy**: "Catch blockers early, not halfway through implementation."

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

### 5. Environment Variables

<thinking>
Verify all required environment variables are set.
</thinking>

**Environment Assessment:**

```bash
# Check .env file exists
test -f .env && echo "✅ Present" || echo "❌ Missing"

# Check required variables (without revealing values)
required_vars="DATABASE_URL SUPABASE_URL SUPABASE_ANON_KEY JWT_SECRET"
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
- [ ] **Required Variables**: All critical vars set
  - `DATABASE_URL`: Database connection string
  - `SUPABASE_URL`: Supabase project URL (if using)
  - `SUPABASE_ANON_KEY`: Public API key
  - `JWT_SECRET`: Token signing secret
  - (Add project-specific variables)

- [ ] **Variable Format**: Proper URL/key formats
- [ ] **No Placeholders**: No "YOUR_KEY_HERE" values

**Environment Report:**

```yaml
Environment Assessment:
  env_file: ✅ present (.env exists)
  required_vars: 4/4 set (100%)

Variables Status:
  DATABASE_URL: ✅ set (postgresql://...)
  SUPABASE_URL: ✅ set (https://...)
  SUPABASE_ANON_KEY: ✅ set (eyJ...)
  JWT_SECRET: ✅ set (length: 64 chars)

Recommendation: ✅ Environment configured correctly
```

**Auto-Remediation:**

```bash
# If .env missing:
cp .env.example .env
echo "⚠️  Created .env from template - CONFIGURE BEFORE PROCEEDING"

# If variables missing:
echo "❌ BLOCKER: Required environment variables not set"
echo "→ Copy .env.example to .env"
echo "→ Fill in: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET"
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

### 8. Generate Readiness Score

<thinking>
Calculate overall readiness score and provide go/no-go recommendation.
</thinking>

**Readiness Calculation:**

```typescript
interface ReadinessScore {
  overall: number;  // 0-100
  components: {
    framework_health: number;      // 20% weight
    git_status: number;            // 15% weight
    dependencies: number;          // 15% weight
    database: number;              // 15% weight
    environment: number;           // 15% weight
    build_tests: number;           // 10% weight
    prerequisites: number;         // 10% weight
  };
  blockers: string[];
  warnings: string[];
  recommendation: 'GO' | 'CAUTION' | 'NO-GO';
}

// Example calculation
const readiness: ReadinessScore = {
  overall: 92,
  components: {
    framework_health: 100,  // 20% → 20 points
    git_status: 100,        // 15% → 15 points
    dependencies: 90,       // 15% → 13.5 points
    database: 100,          // 15% → 15 points
    environment: 100,       // 15% → 15 points
    build_tests: 85,        // 10% → 8.5 points
    prerequisites: 95,      // 10% → 9.5 points
  },
  blockers: [],  // No blockers = GO
  warnings: [
    "3 outdated dependencies (not critical)",
    "2 flaky tests (known issue)"
  ],
  recommendation: 'GO'
};
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

## Integration with Workflows

**Before `/plan`**: Run `/assess "Feature X"` to ensure readiness
**Before `/work`**: Run `/assess` to verify environment
**Before `/resolve`**: Run `/assess` to check health

**Compounding Engineering Cycle**:
1. **ASSESS** ← (Check readiness before starting)
2. **PLAN** (Create implementation plan)
3. **DELEGATE** (Execute work)
4. **CODIFY** (Learn from completion)

---

**Philosophy**: Compounding Engineering
**Phase**: ASSESS (verify readiness before work)
**Next Phase**: PLAN (create detailed implementation)
**Benefit**: Catch blockers early, save 20-30% rework time
