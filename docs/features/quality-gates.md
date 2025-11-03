# Quality Gates Documentation

**VERSATIL SDLC Framework v4.1.0** - Complete Quality Gate Enforcement Guide

Quality gates are automated checkpoints that enforce code quality, security, and testing standards throughout the development lifecycle.

---

## 🎯 What Are Quality Gates?

Quality gates are **automated enforcement points** that:
- ✅ Block low-quality code from progressing
- ✅ Enforce coverage thresholds (80%+)
- ✅ Validate security standards (OWASP)
- ✅ Check accessibility compliance (WCAG 2.1 AA)
- ✅ Ensure performance targets (Lighthouse 90+)

**Without Quality Gates**: Bugs reach production, tech debt accumulates
**With Quality Gates**: Issues caught early, quality maintained automatically

---

## 📋 Table of Contents

1. [Quality Gate Types](#quality-gate-types)
2. [Quick Setup](#quick-setup)
3. [Pre-Commit Gate](#pre-commit-gate)
4. [Pre-Push Gate](#pre-push-gate)
5. [Pre-Deploy Gate](#pre-deploy-gate)
6. [Configuration](#configuration)
7. [Bypassing Gates (Emergency)](#bypassing-gates-emergency)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

---

## Quality Gate Types

### Three-Tier Quality System

```yaml
Tier 1: Pre-Commit (Local, Fast)
  - Runs before: git commit
  - Duration: 10-30 seconds
  - Checks: Linting, type checking, unit tests
  - Purpose: Catch syntax/logic errors immediately
  - Block: Yes (prevents commit)

Tier 2: Pre-Push (Local/CI, Medium)
  - Runs before: git push
  - Duration: 1-3 minutes
  - Checks: Full test suite, integration tests, coverage
  - Purpose: Ensure code quality before code review
  - Block: Yes (prevents push)

Tier 3: Pre-Deploy (CI/CD, Comprehensive)
  - Runs before: Deployment to staging/production
  - Duration: 5-10 minutes
  - Checks: E2E tests, security audit, performance validation
  - Purpose: Prevent production issues
  - Block: Yes (prevents deployment)
```

---

## Quick Setup

### Automatic Installation (Recommended)

```bash
# During initial setup
versatil init

# This automatically:
# 1. Creates .git/hooks/pre-commit
# 2. Creates .git/hooks/pre-push
# 3. Configures quality thresholds
# 4. Enables Maria-QA enforcement
```

### Manual Installation

```bash
# Install Git hooks manually
versatil quality-gate:setup

# Verify installation
ls -la .git/hooks/pre-commit .git/hooks/pre-push

# Test pre-commit gate
versatil quality-gate pre-commit
```

---

## Pre-Commit Gate

### What It Checks

```yaml
Pre-Commit Checks (10-30 seconds):
  1. Linting (ESLint, Prettier)
     - Code formatting
     - Common code smells
     - Import organization

  2. Type Checking (TypeScript)
     - Type errors
     - Missing types
     - Unsafe any usage

  3. Unit Tests
     - Changed files only (fast)
     - Must pass (no failures)
     - Minimum coverage threshold

  4. Security Scan (Basic SAST)
     - Known vulnerability patterns
     - Hardcoded secrets detection
     - Insecure function usage
```

### Configuration

Edit `.cursorrules`:

```yaml
quality_gates:
  pre_commit:
    enabled: true
    require_tests: true
    min_coverage: 80  # Block commit if below 80%
    lint_check: true
    type_check: true
    security_scan: true
    block_on_failure: true  # Set to false to warn only
```

### Example Output

**Successful Commit**:
```bash
$ git commit -m "feat: add user authentication"

🔐 VERSATIL Pre-Commit Quality Gate

Running checks...
  ✅ Linting (ESLint): 0 errors, 0 warnings
  ✅ Type Check (TypeScript): No errors
  ✅ Unit Tests: 12 passed, 0 failed
  ✅ Coverage: 87% (threshold: 80%)
  ✅ Security Scan: No issues found

Quality Gate: ✅ PASSED

[main 3a2f1c4] feat: add user authentication
 3 files changed, 89 insertions(+), 12 deletions(-)
```

**Failed Commit** (Blocked):
```bash
$ git commit -m "fix: update login logic"

🔐 VERSATIL Pre-Commit Quality Gate

Running checks...
  ✅ Linting (ESLint): 0 errors, 0 warnings
  ❌ Type Check (TypeScript): 3 errors
     - src/auth/login.ts:45 - Type 'string | undefined' is not assignable to type 'string'
     - src/auth/login.ts:67 - Property 'token' does not exist on type 'User'
     - src/auth/login.ts:89 - Cannot find name 'userRepository'

  ⏹️  Remaining checks skipped due to failures

Quality Gate: ❌ FAILED

Commit blocked. Fix errors and try again.
  Run: versatil quality-gate pre-commit --verbose
```

---

## Pre-Push Gate

### What It Checks

```yaml
Pre-Push Checks (1-3 minutes):
  1. Full Test Suite
     - All unit tests
     - All integration tests
     - All files (not just changed)

  2. Coverage Threshold (85%+)
     - Stricter than pre-commit
     - Branch coverage
     - Statement coverage

  3. Visual Regression (if configured)
     - Screenshot comparison
     - Chromatic/Percy integration

  4. Security Scan (OWASP)
     - Dependency vulnerabilities
     - OWASP Top 10 compliance
     - Known CVEs
```

### Configuration

Edit `.cursorrules`:

```yaml
quality_gates:
  pre_push:
    enabled: true
    require_all_tests_pass: true
    min_coverage: 85  # Stricter for push
    integration_tests: true
    e2e_tests: false  # Set to true if you have E2E tests
    security_scan: true
    visual_regression: false  # Optional
    block_on_failure: true
```

### Example Output

**Successful Push**:
```bash
$ git push origin feature/authentication

🔐 VERSATIL Pre-Push Quality Gate

Running comprehensive checks...
  ✅ Unit Tests: 247 passed, 0 failed (2.3s)
  ✅ Integration Tests: 34 passed, 0 failed (12.1s)
  ✅ Coverage: 89% (threshold: 85%)
     - Statements: 91%
     - Branches: 87%
     - Functions: 88%
     - Lines: 90%
  ✅ Security Scan (Snyk): No vulnerabilities
  ✅ OWASP Top 10: Compliant

Quality Gate: ✅ PASSED

Pushing to origin/feature/authentication...
```

**Failed Push** (Blocked):
```bash
$ git push origin feature/authentication

🔐 VERSATIL Pre-Push Quality Gate

Running comprehensive checks...
  ✅ Unit Tests: 247 passed, 0 failed
  ✅ Integration Tests: 34 passed, 0 failed
  ❌ Coverage: 78% (threshold: 85%)
     Missing coverage in:
     - src/auth/login.ts (67% covered)
     - src/auth/token.ts (45% covered)

  Suggested tests:
     1. Test error handling in login.ts:validateCredentials()
     2. Test token expiration in token.ts:isExpired()
     3. Test edge cases in token.ts:refresh()

Quality Gate: ❌ FAILED

Push blocked. Add tests to meet 85% coverage threshold.
  Run: pnpm test -- --coverage
```

---

## Pre-Deploy Gate

### What It Checks

```yaml
Pre-Deploy Checks (5-10 minutes):
  1. E2E Tests (Playwright + Chrome MCP)
     - Full user workflows
     - Cross-browser testing
     - Mobile responsive

  2. Security Audit (Comprehensive)
     - OWASP ZAP dynamic scan
     - Dependency audit (Snyk)
     - API contract validation
     - Rate limiting verification

  3. Performance Validation
     - Lighthouse score >= 90
     - Core Web Vitals
     - Bundle size check
     - API response times

  4. Accessibility Audit
     - WCAG 2.1 AA compliance (95%+)
     - axe-core automated checks
     - Color contrast validation
     - Keyboard navigation

  5. Infrastructure Checks
     - Database migrations valid
     - Environment variables set
     - Service health checks
```

### Configuration

Edit `.cursorrules`:

```yaml
quality_gates:
  pre_deploy:
    enabled: true
    require_e2e_tests: true
    security_scan: true
    performance_check: true
    accessibility_audit: true
    min_lighthouse_score: 90
    min_accessibility_score: 95
    check_infrastructure: true
    block_on_failure: true
```

### Example Output

**Successful Deployment**:
```bash
$ versatil quality-gate pre-deploy

🔐 VERSATIL Pre-Deploy Quality Gate

Running comprehensive validation...

1. E2E Tests (Playwright + Chrome MCP)
   ✅ Authentication flow: 12 tests passed
   ✅ User management: 8 tests passed
   ✅ API integration: 15 tests passed
   ✅ Payment flow: 6 tests passed
   Duration: 3m 24s

2. Security Audit
   ✅ OWASP ZAP: No vulnerabilities
   ✅ Snyk: 0 high, 2 low (acceptable)
   ✅ API contracts: All valid
   ✅ Rate limiting: Configured (100 req/min)
   Duration: 2m 15s

3. Performance Validation
   ✅ Lighthouse Performance: 94/100
   ✅ Lighthouse Accessibility: 98/100
   ✅ Lighthouse Best Practices: 100/100
   ✅ Lighthouse SEO: 92/100
   ✅ Bundle Size: 245KB (target: < 500KB)
   ✅ API Response Time: avg 145ms (target: < 200ms)
   Duration: 1m 12s

4. Accessibility Audit
   ✅ WCAG 2.1 AA: 98% compliant
   ✅ axe-core: 0 violations
   ✅ Color Contrast: All checks passed
   ✅ Keyboard Navigation: Verified
   Duration: 45s

5. Infrastructure Checks
   ✅ Database migrations: Up to date
   ✅ Environment variables: All set
   ✅ Service health: All services running
   Duration: 18s

Quality Gate: ✅ PASSED
Overall Score: 97/100 (Excellent)

✅ Deployment approved. Proceed with confidence!
```

**Failed Deployment** (Blocked):
```bash
$ versatil quality-gate pre-deploy

🔐 VERSATIL Pre-Deploy Quality Gate

Running comprehensive validation...

1. E2E Tests (Playwright + Chrome MCP)
   ✅ Authentication flow: 12 tests passed
   ❌ Payment flow: 1 test failed
      Test: "should process refund successfully"
      Error: Timeout waiting for refund confirmation
      Stack trace: tests/e2e/payment.spec.ts:89

  ⏹️  Remaining checks skipped due to critical failure

Quality Gate: ❌ FAILED
Overall Score: 45/100 (Poor)

❌ Deployment blocked due to failed E2E test.

Recommended actions:
  1. Fix payment refund logic
  2. Verify external payment API connectivity
  3. Run: pnpm run test:e2e -- payment.spec.ts
  4. Re-run quality gate after fix

Do NOT deploy to production with failing tests.
```

---

## Configuration

### Global Configuration

Edit `~/.versatil/config.json`:

```json
{
  "quality_gates": {
    "default_thresholds": {
      "coverage": 80,
      "lighthouse_performance": 90,
      "accessibility": 95
    },
    "enforce_all_environments": true,
    "allow_bypass_with_approval": false
  }
}
```

### Project-Specific Configuration

Edit `.versatil-project.json`:

```json
{
  "quality_gates": {
    "pre_commit": {
      "enabled": true,
      "min_coverage": 80,
      "block_on_failure": true
    },
    "pre_push": {
      "enabled": true,
      "min_coverage": 85,
      "block_on_failure": true
    },
    "pre_deploy": {
      "enabled": true,
      "min_lighthouse_score": 90,
      "min_accessibility_score": 95,
      "block_on_failure": true
    }
  }
}
```

### Environment-Specific Overrides

Edit `.cursorrules`:

```yaml
# Development: More lenient
env_development:
  quality_gates:
    pre_commit:
      block_on_failure: false  # Warn only
      min_coverage: 70

# Staging: Moderate
env_staging:
  quality_gates:
    pre_deploy:
      min_lighthouse_score: 85

# Production: Strict
env_production:
  quality_gates:
    pre_deploy:
      min_lighthouse_score: 95
      min_accessibility_score: 98
      block_on_failure: true
```

---

## Bypassing Gates (Emergency)

### When to Bypass

**Valid Reasons**:
- ⚠️ Critical production hotfix
- ⚠️ Emergency security patch
- ⚠️ Rollback deployment

**Invalid Reasons**:
- ❌ "I'm in a hurry"
- ❌ "Tests are flaky"
- ❌ "It works on my machine"

### How to Bypass

#### Option 1: Skip Git Hooks (Pre-Commit/Push Only)

```bash
# Skip pre-commit hook
git commit --no-verify -m "hotfix: critical security patch"

# Skip pre-push hook
git push --no-verify origin main

# ⚠️ WARNING: Use only for emergencies
```

#### Option 2: Approval-Based Bypass

```bash
# Request bypass approval
versatil quality-gate pre-deploy --request-bypass \
  --reason="Critical production outage" \
  --ticket="INC-12345"

# Requires approval from:
# - Technical lead
# - Security team (for security gates)
# - Product owner (for deployment)
```

#### Option 3: Temporary Disable

```bash
# Disable quality gates temporarily
versatil config set quality_gates.enabled=false

# Run deployment
pnpm run deploy

# RE-ENABLE IMMEDIATELY AFTER
versatil config set quality_gates.enabled=true
```

### Audit Trail

All bypasses are logged:

```bash
# View bypass history
versatil quality-gate:audit

# Output:
# 2025-10-05 14:32:15 | user@example.com | pre-deploy | BYPASSED
#   Reason: Critical production outage
#   Ticket: INC-12345
#   Approved by: tech-lead@example.com
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: VERSATIL Quality Gates

on:
  pull_request:
    branches: [main, develop]

jobs:
  pre-push-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install VERSATIL
        run: npm install -g @versatil/sdlc-framework

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Pre-Push Quality Gate
        run: versatil quality-gate pre-push

      - name: Upload Coverage Report
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  pre-deploy-gate:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install VERSATIL
        run: npm install -g @versatil/sdlc-framework

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Pre-Deploy Quality Gate
        run: versatil quality-gate pre-deploy

      - name: Deploy (if gate passed)
        run: pnpm run deploy:production
```

### GitLab CI

```yaml
stages:
  - quality
  - deploy

quality-gate:
  stage: quality
  image: node:20
  before_script:
    - npm install -g @versatil/sdlc-framework
    - pnpm install --frozen-lockfile
  script:
    - versatil quality-gate pre-push
  only:
    - merge_requests

deploy-gate:
  stage: deploy
  image: node:20
  before_script:
    - npm install -g @versatil/sdlc-framework
    - pnpm install --frozen-lockfile
  script:
    - versatil quality-gate pre-deploy
    - pnpm run deploy:production
  only:
    - main
```

---

## Troubleshooting

### Issue 1: "Quality Gate Not Running"

**Symptoms**: Commits/pushes succeed without running gates

**Diagnosis**:
```bash
# Check if hooks are installed
ls -la .git/hooks/pre-commit .git/hooks/pre-push

# Verify they're executable
file .git/hooks/pre-commit
```

**Fix**:
```bash
# Reinstall hooks
versatil quality-gate:setup

# Verify
cat .git/hooks/pre-commit  # Should contain VERSATIL code
```

---

### Issue 2: "Gate Fails But Should Pass"

**Symptoms**: Quality gate fails despite code being correct

**Diagnosis**:
```bash
# Run gate with verbose output
versatil quality-gate pre-commit --verbose

# Check coverage calculation
pnpm test -- --coverage

# Check configuration
versatil config show | grep quality_gates
```

**Fix**:
```bash
# If coverage calculation is wrong:
# 1. Clear coverage cache
rm -rf coverage/ .nyc_output/

# 2. Re-run tests
pnpm test -- --coverage

# 3. Try gate again
versatil quality-gate pre-commit
```

---

### Issue 3: "Gate Too Slow"

**Symptoms**: Pre-commit takes > 60 seconds

**Diagnosis**:
```bash
# Run with timing
time versatil quality-gate pre-commit
```

**Fix**:

#### Option A: Optimize Test Selection

```yaml
# .cursorrules
quality_gates:
  pre_commit:
    test_strategy: "changed_files_only"  # Faster
```

#### Option B: Disable Slow Checks

```yaml
quality_gates:
  pre_commit:
    security_scan: false  # Move to pre-push
    visual_regression: false  # Move to pre-deploy
```

---

## Quality Metrics

### Coverage Trends

```bash
# View coverage history
versatil quality-gate:metrics coverage

# Output:
# 📊 Test Coverage Trends (Last 30 Days)
#
# Current: 87%
# 30 days ago: 72%
# Improvement: +15%
#
# Top Uncovered Files:
#   1. src/auth/token.ts (45% covered)
#   2. src/utils/encryption.ts (67% covered)
```

### Gate Success Rate

```bash
# View gate statistics
versatil quality-gate:metrics success-rate

# Output:
# ✅ Quality Gate Success Rate (Last 30 Days)
#
# Pre-Commit: 94% (1,247 passed / 1,327 total)
# Pre-Push: 89% (456 passed / 512 total)
# Pre-Deploy: 97% (34 passed / 35 total)
#
# Common Failures:
#   1. Coverage below threshold (45%)
#   2. Type errors (28%)
#   3. Linting errors (18%)
```

---

## Best Practices

### 1. Start Lenient, Increase Gradually

```yaml
# Week 1: Warn only
quality_gates:
  pre_commit:
    block_on_failure: false
    min_coverage: 60

# Week 2: Enable blocking, keep low threshold
quality_gates:
  pre_commit:
    block_on_failure: true
    min_coverage: 70

# Week 4: Target threshold
quality_gates:
  pre_commit:
    block_on_failure: true
    min_coverage: 80
```

### 2. Different Thresholds for Different Environments

```yaml
# Development: Fast feedback
pre_commit:
  min_coverage: 70
  timeout: 30s

# CI/Staging: Comprehensive
pre_push:
  min_coverage: 85
  timeout: 3m

# Production: Maximum quality
pre_deploy:
  min_coverage: 90
  timeout: 10m
```

### 3. Monitor Bypass Frequency

```bash
# If bypasses > 10% of commits:
# → Quality gates too strict
# → Tests are flaky
# → Developer education needed
```

---

**Framework Version**: 4.1.0
**Last Updated**: 2025-10-05
**Maintained By**: VERSATIL Development Team

**Related Documentation**:
- [Agent Activation Troubleshooting](AGENT_ACTIVATION_TROUBLESHOOTING.md)
- [Commands Reference](../reference/commands.md)
- [Cursor Integration Guide](CURSOR_INTEGRATION.md)
- [Installation Troubleshooting](INSTALLATION_TROUBLESHOOTING.md)
