# GitHub Workflows Documentation

**VERSATIL SDLC Framework v4.2.0** - Complete CI/CD Pipeline with MCP Ecosystem Validation

This document describes all GitHub Actions workflows that power the VERSATIL SDLC Framework's continuous integration, deployment, testing, and quality assurance.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Workflows](#core-workflows)
3. [MCP Ecosystem Workflows](#mcp-ecosystem-workflows)
4. [Testing Workflows](#testing-workflows)
5. [Deployment Workflows](#deployment-workflows)
6. [Workflow Triggers](#workflow-triggers)
7. [Secrets & Configuration](#secrets--configuration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The VERSATIL SDLC Framework uses **7 active GitHub workflows** to ensure quality, security, and performance:

| Workflow | Purpose | Frequency | Status |
|----------|---------|-----------|--------|
| [CI](#ci-workflow) | Build, test, lint | Every push/PR | ✅ Active |
| [NPM Publish](#npm-publish-workflow) | Publish to NPM | On release/tag | ✅ Active |
| [Release](#release-workflow) | Create GitHub releases | On version tag | ✅ Active |
| [MCP Integration](#mcp-integration-workflow) | Test 11 MCP executors | On MCP code changes | ✅ Active |
| [Security Scan](#security-scan-workflow) | Security validation | Weekly + on push | ✅ Active |
| [Agent Performance](#agent-performance-workflow) | Performance benchmarks | Daily + on changes | ✅ Active |
| [Test Updates](#test-updates-workflow) | Update system tests | On update code changes | ✅ Active |

---

## Core Workflows

### CI Workflow

**File**: `.github/workflows/ci.yml`

**Purpose**: Continuous integration - build, test, and lint on every code change

**Triggers**:
- Push to `main`, `develop`, `feature/*` branches
- Pull requests to `main`, `develop`
- Manual dispatch

**Jobs**:

#### 1. `test` Job
- **Matrix**: Ubuntu/macOS/Windows × Node 18/20
- **Steps**:
  1. Checkout code
  2. Setup Node.js with npm cache
  3. Install dependencies (`npm ci`)
  4. Run unit tests (`npm run test:unit`)
  5. Build (`npm run build`)

#### 2. `lint` Job
- **Platform**: Ubuntu Latest, Node 20
- **Steps**:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run linter (continue on error)
  5. Run TypeScript type checking (continue on error)

**Example**:
```yaml
- name: Run unit tests
  run: npm run test:unit

- name: Build
  run: npm run build
```

---

### NPM Publish Workflow

**File**: `.github/workflows/npm-publish.yml`

**Purpose**: Automatically publish to NPM registry when releases are created

**Triggers**:
- GitHub release published
- Push tags matching `v*` (e.g., `v4.2.0`)

**Jobs**:

#### 1. `publish` Job
- **Platform**: Ubuntu Latest, Node 20
- **Steps**:
  1. Checkout code
  2. Setup Node.js with NPM registry
  3. Install dependencies
  4. Build
  5. Check package version
  6. Check if already published (skip if exists)
  7. Dry run publish
  8. **Publish to NPM** (`npm publish --access public`)
  9. Verify publication
  10. Post-publish validation
  11. Create GitHub summary

**Secrets Required**:
- `NPM_TOKEN` - NPM authentication token

**Example**:
```bash
npm publish --access public
```

#### 2. `test-install` Job
- **Matrix**: Ubuntu/macOS/Windows × Node 18/20
- **Depends on**: `publish` job
- **Steps**:
  1. Wait for NPM propagation (60s)
  2. Install package globally
  3. Verify installation (`versatil --version`)
  4. Run basic commands

---

### Release Workflow

**File**: `.github/workflows/release.yml`

**Purpose**: Create GitHub releases with auto-generated changelogs

**Triggers**:
- Push tags matching `v*.*.*` (e.g., `v4.2.0`)

**Jobs**:

#### 1. `release` Job
- **Steps**:
  1. Checkout code with full history
  2. Install dependencies
  3. Run unit tests
  4. Build
  5. Extract version from tag
  6. **Generate changelog** (categorized by commit type)
  7. **Create GitHub release** with changelog
  8. Upload artifacts (dist/, package.json, README, LICENSE)

**Changelog Categories**:
- Breaking Changes (`BREAKING CHANGE`)
- Features (`feat:`)
- Bug Fixes (`fix:`)
- Performance Improvements (`perf:`)
- Documentation (`docs:`)
- Full commit history

**Example**:
```yaml
- name: Generate changelog
  run: |
    git log ${PREV_TAG}..HEAD --grep="^feat" --pretty=format:"* %s (%h)" >> RELEASE_NOTES.md
```

#### 2. `notify` Job
- **Depends on**: `release` job
- **Steps**:
  1. Extract version
  2. Notify success with next steps

---

## MCP Ecosystem Workflows

### MCP Integration Workflow

**File**: `.github/workflows/mcp-integration.yml`

**Purpose**: Validate all 11 MCP executors load correctly without credentials

**Triggers**:
- Push to `main`, `develop` (paths: `src/mcp/**`, `src/mcp-integration.ts`)
- Pull requests to `main`, `develop`
- Manual dispatch

**Jobs**:

#### 1. `test-mcp-executors` Job
- **Platform**: Ubuntu Latest, Node 20
- **Tests 8 MCP Executors**:
  1. **Playwright MCP** - Browser automation
  2. **GitHub MCP** - Repository operations
  3. **Exa Search MCP** - AI-powered search
  4. **Vertex AI MCP** - Google Cloud AI
  5. **Supabase MCP** - Database + vector ops
  6. **n8n MCP** - Workflow automation
  7. **Semgrep MCP** - Security scanning
  8. **Sentry MCP** - Error monitoring

**Example Test**:
```javascript
const { PlaywrightMCPExecutor } = require('./dist/mcp/playwright-mcp-executor.js');
const executor = new PlaywrightMCPExecutor();
console.log('✅ Playwright MCP Executor loaded');
```

#### 2. `test-mcp-integration` Job
- **Depends on**: `test-mcp-executors`
- **Tests**:
  - MCP integration layer routing
  - Intelligent context detection
  - Agent-MCP mapping

**Artifacts**:
- `mcp-integration-test-report` - Full test report

---

### Security Scan Workflow

**File**: `.github/workflows/security-scan.yml`

**Purpose**: Comprehensive security validation using Semgrep MCP and other tools

**Triggers**:
- Push to `main`, `develop`
- Pull requests
- **Weekly schedule**: Sunday at midnight UTC (`0 0 * * 0`)
- Manual dispatch

**Jobs**:

#### 1. `semgrep-mcp-scan` Job
- **Platform**: Ubuntu Latest, Node 20
- **Permissions**: `contents: read`, `security-events: write`
- **Steps**:
  1. **Semgrep MCP Security Check**
     - Scans critical TypeScript files
     - Detects security patterns (eval, injection, etc.)
     - Checks OWASP Top 10 compliance
  2. **OWASP Top 10 Compliance Check**
     - Validates against OWASP 2021 categories
  3. **Generate Security Report**
     - JSON + Markdown reports
     - Critical/High/Medium findings breakdown

**Critical Files Scanned**:
```javascript
const criticalFiles = [
  'src/mcp-integration.ts',
  'src/agents/enhanced-maria.ts',
  'src/agents/enhanced-marcus.ts',
  'src/agents/enhanced-james.ts',
  'src/security/security-scanner.ts',
];
```

**OWASP Top 10 2021 Coverage**:
- ✅ A01:2021 - Broken Access Control
- ✅ A02:2021 - Cryptographic Failures
- ✅ A03:2021 - Injection
- ✅ A04:2021 - Insecure Design
- ✅ A05:2021 - Security Misconfiguration
- ✅ A06:2021 - Vulnerable Components
- ✅ A07:2021 - Identification/Authentication Failures
- ✅ A08:2021 - Software/Data Integrity Failures
- ✅ A09:2021 - Security Logging/Monitoring Failures
- ✅ A10:2021 - Server-Side Request Forgery

#### 2. `dependency-scan` Job
- **Steps**:
  1. Run `npm audit` (moderate+ vulnerabilities)
  2. Generate JSON report
  3. Upload results

#### 3. `secret-scan` Job
- **Tools**:
  - **TruffleHog** - Verified secret detection
  - **Custom patterns** - API keys, passwords, secrets

**Example**:
```bash
grep -r -n -i "api[_-]key" --include="*.ts" src/
```

#### 4. `security-summary` Job
- **Depends on**: All security scan jobs
- **Steps**:
  1. Aggregate results from all scans
  2. Generate overall security posture report
  3. Upload comprehensive summary

**Artifacts**:
- `security-scan-report` - Semgrep results
- `dependency-scan-results` - npm audit JSON
- `overall-security-summary` - Aggregated report

---

### Agent Performance Workflow

**File**: `.github/workflows/agent-performance.yml`

**Purpose**: Benchmark all 6 agents with their respective MCP integrations

**Triggers**:
- Push to `main` (paths: `src/agents/**`, `src/mcp/**`)
- **Daily schedule**: 2 AM UTC (`0 2 * * *`)
- Manual dispatch

**Jobs**:

#### 1. `benchmark-agents` Job
- **Platform**: Ubuntu Latest, Node 20
- **Benchmarks 6 Agents**:

| Agent | MCP | Iterations | Metric |
|-------|-----|------------|--------|
| Maria-QA | Playwright | 100 | Accessibility checks |
| Marcus-Backend | Semgrep | 50 | Security scans |
| James-Frontend | Playwright | 75 | Screenshots |
| Alex-BA | Exa Search | 50 | Company research |
| Dr.AI-ML | Vertex AI | 50 | Sentiment analysis |
| Sarah-PM | n8n | 50 | Task scheduling |

**Example Benchmark**:
```javascript
const iterations = 100;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  await executor.executePlaywrightMCP('accessibility_snapshot', {});
}

const avgTime = (Date.now() - startTime) / iterations;
const opsPerSecond = 1000 / avgTime;
```

**Metrics Collected**:
- Total execution time
- Average time per operation
- Operations per second (throughput)

#### 2. `analyze-performance` Job
- **Depends on**: `benchmark-agents`
- **Steps**:
  1. Aggregate benchmark results
  2. Calculate overall averages
  3. **Generate performance report**
  4. Compare with targets (< 100ms avg, > 10 ops/sec)
  5. Upload artifacts

**Performance Targets**:
- ✅ Average operation time: **< 100ms**
- ✅ Throughput: **> 10 ops/sec**

**Artifacts**:
- `agent-performance-report` - Detailed benchmarks

---

## Testing Workflows

### Test Updates Workflow

**File**: `.github/workflows/test-updates.yml`

**Purpose**: Test the framework's update system components

**Triggers**:
- Push to `main`, `develop` (paths: `src/update/**`, `src/config/**`, `bin/*-command.js`)
- Pull requests
- Manual dispatch

**Jobs**:

#### 1. `test-update-system` Job
- **Matrix**: Ubuntu/macOS/Windows × Node 18/20
- **Timeout**: 10 minutes (prevents hanging)
- **Tests**:
  1. **Version comparison** - Semantic version parsing
  2. **GitHub release checking** - Latest release detection (with timeout)
  3. **Preference management** - Config loading/saving
  4. **Config profiles** - Conservative/Balanced/Aggressive
  5. **Config validation** - Schema validation

**Timeout Fixes**:
```yaml
timeout-minutes: 10  # Job level

- name: Test GitHub release checking
  timeout-minutes: 2  # Step level
  run: |
    timeout 60s node -e "
    Promise.race([
      checker.getLatestRelease(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 50000))
    ])
```

#### 2. `test-update-flow` Job
- **Platform**: Ubuntu Latest
- **Tests**:
  1. Simulated update flow
  2. Version locking mechanism
  3. Crash recovery system

#### 3. `integration-test` Job
- **Platform**: Ubuntu Latest
- **Timeout**: 10 minutes
- **Tests**:
  1. End-to-end update flow
  2. GitHub release checking (with graceful timeout)
  3. Preference management
  4. Config validation
  5. Version locking/unlocking

**Graceful Timeout Example**:
```javascript
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Integration test timeout')), 200000)
);

await Promise.race([testPromise, timeoutPromise]);
```

---

## Deployment Workflows

### Deploy Staging Workflow

**File**: `.github/workflows/deploy-staging.yml`

**Status**: ⚠️ **Disabled** (not needed for NPM package distribution)

**Purpose**: Deploy to staging environment (infrastructure-based deployments)

**Note**: The VERSATIL SDLC Framework is distributed via NPM, so traditional staging deployments are not applicable. Users install via `npm install -g @versatil/sdlc-framework`.

---

## Workflow Triggers

### Summary Table

| Trigger Type | Workflows | Frequency |
|-------------|-----------|-----------|
| **Push to main/develop** | CI, MCP Integration, Security Scan, Agent Performance | On every push |
| **Pull Request** | CI, MCP Integration, Security Scan, Test Updates | On every PR |
| **Release/Tag** | NPM Publish, Release | On version tag |
| **Daily Schedule** | Agent Performance | 2 AM UTC |
| **Weekly Schedule** | Security Scan | Sunday midnight UTC |
| **Manual Dispatch** | All workflows | On demand |

### Branch Protection Rules

Recommended branch protection for `main`:
```yaml
required_status_checks:
  - test (ubuntu-latest, 20)
  - test (macos-latest, 20)
  - test (windows-latest, 20)
  - lint
  - test-mcp-executors
  - test-mcp-integration
```

---

## Secrets & Configuration

### Required Secrets

Add these secrets in **Settings → Secrets and variables → Actions**:

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `NPM_TOKEN` | NPM registry authentication | NPM Publish workflow |
| `GITHUB_TOKEN` | GitHub API access | Auto-provided by GitHub |

### Optional Secrets (for MCP integrations)

These are **not required** for workflows, but enable full MCP functionality:

| Secret | MCP | Purpose |
|--------|-----|---------|
| `GITHUB_PERSONAL_TOKEN` | GitHub MCP | Extended API access |
| `EXA_API_KEY` | Exa Search MCP | AI-powered search |
| `GOOGLE_CLOUD_PROJECT` | Vertex AI MCP | Google Cloud project |
| `GOOGLE_APPLICATION_CREDENTIALS` | Vertex AI MCP | GCP credentials JSON |
| `N8N_API_KEY` | n8n MCP | Workflow automation |
| `SEMGREP_API_KEY` | Semgrep MCP | Enhanced security scanning |
| `SENTRY_DSN` | Sentry MCP | Error monitoring |

### Generating NPM Token

```bash
# Login to NPM
npm login

# Generate automation token
npm token create --type=automation

# Add to GitHub Secrets as NPM_TOKEN
```

---

## Troubleshooting

### Common Issues

#### 1. Workflow Hangs or Timeouts

**Problem**: Workflow runs indefinitely without completing

**Solution**:
- Job-level timeout: `timeout-minutes: 10`
- Step-level timeout: `timeout-minutes: 2`
- Command-level timeout: `timeout 60s node ...`
- Promise timeout wrapper: `Promise.race([task, timeout])`

**Example**:
```yaml
- name: Test with timeout
  timeout-minutes: 2
  run: |
    timeout 60s node -e "
    Promise.race([
      actualTest(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 50000))
    ])
    " || echo "⚠️ Test timed out"
```

#### 2. NPM Publish Fails - Version Already Exists

**Problem**: `npm ERR! 403 You cannot publish over the previously published versions`

**Solution**: The workflow automatically checks if version exists and skips publication

```yaml
- name: Check if version already published
  id: check
  run: |
    if npm view @versatil/sdlc-framework@$VERSION version 2>/dev/null; then
      echo "PUBLISHED=true" >> $GITHUB_OUTPUT
    fi
```

#### 3. Security Scan False Positives

**Problem**: Semgrep reports false positive security issues

**Solution**:
- Review findings in workflow artifacts
- Add exclusions to Semgrep config if necessary
- Findings don't block workflow (informational only)

#### 4. Test Failures on Specific OS

**Problem**: Tests pass on Ubuntu but fail on Windows/macOS

**Solution**:
- Use `fail-fast: false` in matrix strategy
- Check platform-specific issues in logs
- Add conditional steps for OS-specific behavior

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
  fail-fast: false  # Continue testing other OS even if one fails
```

#### 5. GitHub API Rate Limiting

**Problem**: `API rate limit exceeded` in workflows

**Solution**:
- Workflows use `GITHUB_TOKEN` automatically (higher limits)
- Add timeout wrappers for external API calls
- Graceful fallbacks: `|| echo "⚠️ Rate limited"`

```yaml
- name: Test GitHub API
  run: |
    timeout 60s node -e "..." || echo "⚠️ API call timed out (rate limit)"
```

---

## Workflow Best Practices

### 1. Always Use Timeouts

```yaml
jobs:
  my-job:
    timeout-minutes: 10  # Job-level timeout
    steps:
      - name: Step with timeout
        timeout-minutes: 2  # Step-level timeout
```

### 2. Cache Dependencies

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Cache npm dependencies
```

### 3. Upload Artifacts for Debugging

```yaml
- name: Upload reports
  uses: actions/upload-artifact@v3
  if: always()  # Upload even on failure
  with:
    name: test-reports
    path: reports/
```

### 4. Use Matrix for Cross-Platform Testing

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node-version: [18, 20]
  fail-fast: false
```

### 5. Add GitHub Step Summaries

```yaml
- name: Create summary
  run: |
    cat >> $GITHUB_STEP_SUMMARY << 'EOF'
    ## Test Results
    - ✅ All tests passed
    EOF
```

---

## Monitoring Workflow Health

### GitHub Actions Dashboard

1. **Repository → Actions tab**
2. **View workflow runs** by workflow name
3. **Check run history** for patterns
4. **Download artifacts** for detailed reports

### Workflow Status Badges

Add to `README.md`:

```markdown
![CI](https://github.com/Nissimmiracles/versatil-sdlc-framework/workflows/CI/badge.svg)
![Security Scan](https://github.com/Nissimmiracles/versatil-sdlc-framework/workflows/Security%20Scanning/badge.svg)
```

### Scheduled Workflow Health

- **Agent Performance**: Runs daily at 2 AM UTC
- **Security Scan**: Runs weekly on Sunday at midnight UTC

Check email notifications or GitHub notifications for failures.

---

## Future Enhancements

### Planned Improvements

1. **Historical Performance Tracking**
   - Compare current benchmarks with previous runs
   - Detect performance regressions over time

2. **Enhanced Security Scanning**
   - Integrate OWASP ZAP for DAST (dynamic analysis)
   - Add container security scanning

3. **Automated Dependency Updates**
   - Dependabot integration for MCP packages
   - Auto-merge minor/patch updates after testing

4. **Enhanced Release Notes**
   - Auto-generate comprehensive changelogs
   - Include performance metrics in releases

---

## Contributing to Workflows

### Adding New Workflows

1. Create workflow file: `.github/workflows/my-workflow.yml`
2. Define trigger events (`on:`)
3. Define jobs and steps
4. Add timeouts and error handling
5. Upload artifacts for debugging
6. Test with `workflow_dispatch` trigger first
7. Document in this file

### Modifying Existing Workflows

1. Test changes in a feature branch first
2. Use `workflow_dispatch` for manual testing
3. Monitor first run after merge
4. Update this documentation
5. Commit with descriptive message

---

## Support

For workflow issues or questions:

- **GitHub Issues**: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- **Documentation**: https://docs.versatil.dev
- **Workflow Logs**: Check workflow run details in GitHub Actions

---

**Last Updated**: 2025-10-06
**Framework Version**: 4.2.0
**Total Workflows**: 7 active, 1 disabled

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
