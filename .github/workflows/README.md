# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for automated testing and quality assurance.

## Workflows

### `test.yml` - Main Test Suite

**Triggers**: Push to `main`/`develop`, Pull Requests, Manual dispatch

**Jobs**:
1. Build & Type Check
2. MCP Module Tests
3. Marcus Sub-Agents (5 parallel jobs)
4. James Sub-Agents (5 parallel jobs)
5. Integration Tests (10 parallel jobs)
6. Agent Tests
7. Library Tests
8. Coverage Report
9. Test Summary

### `test-single.yml` - Single File Testing

**Triggers**: Manual dispatch only

**Usage**: Test a specific file quickly through GitHub Actions UI

## Running Tests

### Via GitHub Actions (Recommended)

Push to main/develop or create a PR - tests run automatically.

### Manual Trigger

```bash
gh workflow run test.yml
```

## Expected Results

✅ **Should Pass**: MCP tests, sub-agent tests, build checks (Waves 3-4 complete)
⚠️ **May Need Fixes**: Some integration/E2E tests (Waves 5-6 pending)

---

**Created**: 2025-11-19  
**Framework**: VERSATIL SDLC v7.16.2
