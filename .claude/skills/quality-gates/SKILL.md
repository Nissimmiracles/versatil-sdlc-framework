---
name: quality-gates
description: Execute quality validation checks including test coverage, TypeScript compilation, and contract validation. This skill should be used before commits, during PR reviews, before deployments, or when validating code quality with the /review command.
allowed-tools:
  - Bash
  - Read
---

# Quality Gates Skill

**Auto-invoked during**: Pre-commit hooks, PR reviews, deployment validation, `/review` command

Execute automated quality validation to enforce VERSATIL quality standards (Best Measured Automated Defensively).

## What This Skill Provides

Three automated quality checks:

1. **Test Coverage** - Ensure 80%+ coverage across all code
2. **TypeScript Compilation** - Verify no type errors
3. **Contract Validation** - Check agent handoff contracts

**Result**: Block bad commits, ensure production readiness

## When to Use

Use this skill when you need to:

- **Pre-commit validation** - Check quality before committing
- **PR review automation** - Automated code review checks
- **Deployment gates** - Ensure production readiness
- **Quality enforcement** - VERSATIL standards (80%+ coverage)

## Quick Start

### Run All Quality Gates

```bash
! npx tsx .claude/skills/quality-gates/scripts/execute-validation.ts \
  --check all \
  --threshold 80
```

**Returns**: Overall status (PASSED/FAILED) + results for all 3 checks

**Exit Code**: 0 if all pass, 1 if any fail

---

### Individual Checks

**Coverage only**:
```bash
! npx tsx .claude/skills/quality-gates/scripts/execute-validation.ts \
  --check coverage \
  --threshold 80
```

**TypeScript only**:
```bash
! npx tsx .claude/skills/quality-gates/scripts/execute-validation.ts \
  --check typescript
```

**Contracts only**:
```bash
! npx tsx .claude/skills/quality-gates/scripts/execute-validation.ts \
  --check contracts
```

---

## Quality Standards

**VERSATIL Quality Standards (Best Measured Automated Defensively)** - Maria-QA enforces:

| Check | Standard | Blocking |
|-------|----------|----------|
| **Test Coverage** | 80%+ (90%+ for security code) | ✅ Yes |
| **TypeScript** | Zero type errors | ✅ Yes |
| **Contracts** | Valid agent handoffs | ⚠️ Warning |
| **Performance** | Tests <15s | ⚠️ Warning |

**Coverage Breakdown**:
- Lines: 80%+
- Statements: 80%+
- Functions: 80%+
- Branches: 75%+

---

## Integration with Commands

**`/review` command**: Runs all quality gates
```bash
/review feature/auth
# Internally: execute-validation.ts --check all
```

**Pre-commit hook**: Validates before commit
```bash
git commit -m "Add auth"
# Hook runs: execute-validation.ts --check all
# Blocks commit if validation fails
```

---

## Return Format

```json
{
  "overall_status": "PASSED",
  "checks_run": 3,
  "checks_passed": 3,
  "checks_failed": 0,
  "results": [
    {
      "check": "coverage",
      "passed": true,
      "score": 87,
      "threshold": 80,
      "message": "Test coverage: 87% (threshold: 80%)"
    },
    {
      "check": "typescript",
      "passed": true,
      "message": "TypeScript compilation successful - no type errors"
    },
    {
      "check": "contracts",
      "passed": true,
      "message": "Agent contract validation passed"
    }
  ]
}
```

---

## Critical Requirements

1. **80% minimum coverage** - Non-negotiable (Maria-QA standard)
2. **Security code = 90%** - Higher bar for auth/crypto/security
3. **Zero TypeScript errors** - No type safety compromises
4. **Fast execution** - All checks complete in <1 minute

---

## Common Use Cases

**Before committing**:
```bash
# Check quality
! execute-validation.ts --check all

# If PASSED → safe to commit
# If FAILED → fix issues before committing
```

**During code review**:
```bash
# Automated review checks
/review feature/auth

# Quality gates run automatically
# Report shows what needs fixing
```

**Before deployment**:
```bash
# Full validation
! execute-validation.ts --check all

# Must pass all gates for production
```

---

## Error Handling

**Graceful failure** - Returns structured JSON even on errors:

```json
{
  "overall_status": "FAILED",
  "checks_run": 3,
  "checks_passed": 1,
  "checks_failed": 2,
  "results": [
    {
      "check": "coverage",
      "passed": false,
      "score": 65,
      "threshold": 80,
      "message": "Test coverage: 65% (threshold: 80%) - BELOW THRESHOLD"
    }
  ]
}
```

**Fallback strategy**: Individual check failures don't crash - all checks complete

---

## Performance

- **Coverage check**: 10-30s (runs full test suite)
- **TypeScript check**: 5-10s (compilation only)
- **Contracts check**: 2-5s (validation tests)
- **All checks**: 20-45s total

---

## Detailed Documentation

For complete specifications, examples, and troubleshooting:

- **Coverage Standards**: See `references/coverage-requirements.md`
- **TypeScript Config**: See `references/typescript-validation.md`
- **Contract Schema**: See `references/contract-validation.md`
- **Quality Standards**: See `references/quality-principles.md`

---

## Related Skills

- `compounding-engineering` - Pattern search uses quality metrics
- `rag-patterns/victor-verifier` - Verification complements validation
- Skills auto-coordinate when using `/review` command

---

## Quick Reference

**Commands**:
- `/review [branch]` - Full quality check
- Pre-commit hook - Automatic validation

**Standards**:
- 80%+ coverage (90%+ security)
- Zero TypeScript errors
- Valid contracts

**Key Insight**: Quality gates catch issues before they reach production
