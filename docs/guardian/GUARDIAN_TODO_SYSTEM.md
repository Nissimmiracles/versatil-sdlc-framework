# Guardian Automatic TODO Generation System

**Version**: 7.10.0+
**Status**: Production Ready
**Default**: Enabled (combined TODOs)

## Overview

Guardian automatically creates **combined TODO files** for errors and gaps detected during health checks. Issues are grouped by assigned agent, priority, or layer to reduce TODO spam while maintaining actionable tracking.

## Key Features

✅ **Automatic Detection**: Health checks run every 5 minutes (configurable)
✅ **Smart Grouping**: Related issues combined into single TODO files (5-10x reduction)
✅ **Anti-Duplication**: Content-based fingerprinting prevents duplicate TODOs
✅ **Multi-Layer Verification**: Framework, Project, and Context layers with confidence scoring
✅ **Agent Assignment**: Issues automatically routed to specialized agents (Maria-QA, Marcus-Backend, etc.)
✅ **Auto-Apply Detection**: High-confidence issues (≥90%) marked for automatic remediation

---

## Quick Start

### 1. Enable Guardian TODO Generation (Default: ON)

```bash
# .env or environment
GUARDIAN_CREATE_TODOS=true          # Enable TODO creation (default: true)
GUARDIAN_GROUP_TODOS=true           # Group related issues (default: true)
GUARDIAN_GROUP_BY=agent             # Grouping strategy (default: agent)
GUARDIAN_MAX_ISSUES_PER_TODO=10     # Max issues per file (default: 10)
```

### 2. Run Health Check

Guardian runs automatically every 5 minutes, or trigger manually:

```bash
# Manual trigger (framework development context)
npm run guardian:health-check

# Or via slash command
/guardian health-check
```

### 3. Review Generated TODOs

TODOs appear in `todos/` directory with namespaced format:

```
todos/
├── guardian-combined-maria-qa-critical-1730123456789-ab3f.md   (3 issues)
├── guardian-combined-marcus-backend-high-1730123457890-cd4g.md (2 issues)
└── guardian-combined-james-frontend-medium-1730123458901-ef5h.md (4 issues)
```

---

## Configuration Options

### GUARDIAN_CREATE_TODOS

**Default**: `true` (enabled)

Controls whether Guardian creates TODO files for detected issues.

```bash
# Enable TODO generation (default)
GUARDIAN_CREATE_TODOS=true

# Disable (telemetry-only tracking)
GUARDIAN_CREATE_TODOS=false
```

**When to disable**:
- You prefer viewing issues via telemetry logs (`~/.versatil/logs/guardian-telemetry.log`)
- You have custom issue tracking integration
- Testing/CI environments where TODOs aren't needed

---

### GUARDIAN_GROUP_TODOS

**Default**: `true` (enabled)

Groups related issues into combined TODO files.

```bash
# Enable grouping (recommended)
GUARDIAN_GROUP_TODOS=true

# Disable (create individual TODO per issue)
GUARDIAN_GROUP_TODOS=false
```

**Impact**:

| Setting | 10 Issues Detected | Files Created | Notes |
|---------|-------------------|---------------|-------|
| `true` | Maria-QA: 6, Marcus: 4 | **2 files** | Combined by agent |
| `false` | Maria-QA: 6, Marcus: 4 | **10 files** | Individual files |

**Recommendation**: Keep enabled to reduce TODO spam.

---

### GUARDIAN_GROUP_BY

**Default**: `agent` (group by assigned agent)

Controls how issues are grouped together.

```bash
# Group by assigned agent (default, recommended)
GUARDIAN_GROUP_BY=agent
# Example: All Maria-QA issues → guardian-combined-maria-qa-*.md

# Group by priority
GUARDIAN_GROUP_BY=priority
# Example: All critical issues → guardian-combined-critical-*.md

# Group by layer (framework/project/context)
GUARDIAN_GROUP_BY=layer
# Example: All framework issues → guardian-combined-framework-*.md
```

**Comparison**:

| Strategy | Grouping Logic | Use Case |
|----------|---------------|----------|
| **agent** | Issues assigned to same agent | **Recommended**: Work on all Maria-QA issues together |
| **priority** | Issues with same priority | Focus on all critical issues first |
| **layer** | Issues in same layer (framework/project/context) | Fix all framework issues before project issues |

---

### GUARDIAN_MAX_ISSUES_PER_TODO

**Default**: `10` (recommended: 5-15)

Maximum number of issues to include in a single combined TODO file.

```bash
# Default (recommended)
GUARDIAN_MAX_ISSUES_PER_TODO=10

# Lower limit (more files, smaller TODOs)
GUARDIAN_MAX_ISSUES_PER_TODO=5

# Higher limit (fewer files, larger TODOs)
GUARDIAN_MAX_ISSUES_PER_TODO=20
```

**What happens when exceeded**:
- Guardian splits the group into multiple parts
- Example: 23 Maria-QA issues with `MAX=10`:
  - `guardian-combined-maria-qa-critical-part1-*.md` (10 issues)
  - `guardian-combined-maria-qa-critical-part2-*.md` (10 issues)
  - `guardian-combined-maria-qa-critical-part3-*.md` (3 issues)

---

## TODO File Format

### Combined TODO Example

```markdown
---
id: "Maria-QA-critical-1730123456789"
created: "2025-10-28T10:30:00.000Z"
type: "guardian-combined"
assigned_agent: "Maria-QA"
priority: "critical"
issue_count: 3
avg_confidence: 93
auto_apply_count: 2
manual_review_count: 1
grouping_strategy: "agent"
verified_by: "Victor-Verifier (Guardian Health Check)"
---

# 🛡️ Guardian Health Check - Maria-QA

**Combined TODO**: 3 related issues detected

## Summary

- **Assigned Agent**: **Maria-QA**
- **Priority**: **CRITICAL**
- **Total Issues**: 3
- **Average Confidence**: 93%
- **Auto-Apply Eligible**: 2
- **Manual Review Required**: 1
- **Detection Layer**: 📦 Project

## Issues Detected

### 1. Test Coverage

**Issue**: Test coverage dropped below 80% threshold (current: 67%)

**Details**:
- **Priority**: critical
- **Confidence**: 95%
- **Auto-Apply**: YES ✅
- **Layer**: 📦 project

**Evidence Summary**: ✓ Coverage file exists (95%), ✓ Coverage below threshold (95%)

**Recommended Fix**: Add unit tests for uncovered modules: src/auth.ts, src/utils.ts

---

### 2. TypeScript Errors

**Issue**: 12 TypeScript compilation errors in src/

**Details**:
- **Priority**: critical
- **Confidence**: 92%
- **Auto-Apply**: YES ✅
- **Layer**: 📦 project

**Evidence Summary**: ✓ tsc --noEmit failed (92%), ✓ Error locations verified (92%)

**Recommended Fix**: Run `npx tsc --noEmit` and fix type errors

---

### 3. Security Vulnerabilities

**Issue**: 3 high-severity npm vulnerabilities detected

**Details**:
- **Priority**: critical
- **Confidence**: 90%
- **Auto-Apply**: NO (manual review required)
- **Layer**: 📦 project

**Evidence Summary**: ✓ npm audit found vulnerabilities (90%), ✓ Package versions verified (90%)

**Recommended Fix**: Run `npm audit fix` and review breaking changes

---

## 🎯 Recommended Actions (Priority Order)

1. Add unit tests for uncovered modules: src/auth.ts, src/utils.ts
2. Run `npx tsc --noEmit` and fix type errors
3. Run `npm audit fix` and review breaking changes

## 📊 Execution Strategy

**Suggested Approach**:

1. **Auto-Apply (2 issues)**: Guardian can automatically remediate these high-confidence issues
   - Review auto-fix logs after execution
   - Verify changes before committing

2. **Manual Review (1 issue)**: This requires human judgment
   - Investigate root causes using verification evidence
   - Apply fixes with proper testing
   - Codify learnings in RAG for future pattern matching

**Estimated Effort**: 45-90 minutes (depending on complexity)

## 🧠 Learning Opportunity

After resolving these issues:
1. Run `/learn "Resolved 3 critical issues in project layer"`
2. Guardian will store fix patterns in RAG
3. Similar issues will be auto-remediable in the future (compounding engineering)

## 🔍 Verification Details

All issues verified using Chain-of-Verification (CoVe) methodology:
- Layer Classification (framework/project/context)
- Ground Truth Verification (file system, git, logs)
- Agent Assignment (based on specialization)
- Confidence Scoring (0-100%)

**Full verification evidence available in individual issue sections above.**

---

**Generated by Guardian Verified Issue Detector**
**Verification Pipeline**: Health Check → Layer Classification → Ground Truth Verification → TODO Grouping
**Anti-Hallucination**: Chain-of-Verification (CoVe) methodology
**Grouping Strategy**: agent (configurable via GUARDIAN_GROUP_BY env var)
```

---

## Anti-Duplication System

Guardian has **three layers** of anti-duplication protection:

### Layer 1: Content-Based Fingerprinting

```typescript
// First 100 characters of issue description used as fingerprint
const fingerprint = issue.description
  .toLowerCase()
  .slice(0, 100)
  .replace(/\s+/g, ' ')
  .trim();

// Check all existing TODO files for fingerprint match
// If found: Skip creation
```

**Result**: Same error detected twice → Only 1 TODO created

### Layer 2: Namespaced Filenames

All Guardian TODOs use namespaced format:
- **Individual**: `guardian-{timestamp}-{random}-{priority}-{layer}.md`
- **Combined**: `guardian-combined-{agent}-{priority}-{timestamp}-{random}.md`

**Result**: No collisions with `/plan` command TODOs (001-pending-p1-*.md)

### Layer 3: TODO Grouping

Related issues combined into single file (5-10x reduction).

**Example**:

```
Before (no grouping):
- guardian-12345-critical-project.md (Test coverage)
- guardian-12346-critical-project.md (TypeScript errors)
- guardian-12347-critical-project.md (npm vulnerabilities)
- guardian-12348-critical-project.md (ESLint errors)
- guardian-12349-critical-project.md (Missing docs)

After (grouping by agent):
- guardian-combined-maria-qa-critical-12345-ab3f.md (5 issues)
```

---

## Agent Assignment

Guardian automatically routes issues to specialized agents:

| Agent | Handles | Example Issues |
|-------|---------|---------------|
| **Maria-QA** | Testing, coverage, quality | Test coverage <80%, ESLint errors, accessibility |
| **Marcus-Backend** | API, database, security | API failures, database errors, OWASP vulnerabilities |
| **James-Frontend** | UI, performance, accessibility | Bundle size, WCAG violations, React errors |
| **Dana-Database** | Database, migrations, RLS | RLS policy errors, migration failures, query performance |
| **Sarah-PM** | Documentation, roadmap | Missing docs, incomplete features |
| **Oliver-MCP** | MCP servers, integrations | MCP server errors, protocol issues |
| **Dr.AI-ML** | RAG, embeddings, ML | GraphRAG failures, embedding errors |
| **Alex-BA** | Business logic, analytics | Vision misalignment, feature conflicts |

---

## Configuration Scenarios

### Scenario 1: Default (Recommended)

**Goal**: Automatic TODO generation with smart grouping

```bash
GUARDIAN_CREATE_TODOS=true
GUARDIAN_GROUP_TODOS=true
GUARDIAN_GROUP_BY=agent
GUARDIAN_MAX_ISSUES_PER_TODO=10
```

**Result**: 10 issues → 2-3 combined TODOs (by agent)

---

### Scenario 2: Individual TODOs

**Goal**: One TODO per issue (old behavior)

```bash
GUARDIAN_CREATE_TODOS=true
GUARDIAN_GROUP_TODOS=false
```

**Result**: 10 issues → 10 individual TODOs

---

### Scenario 3: Telemetry Only

**Goal**: No TODO files, tracking via logs only

```bash
GUARDIAN_CREATE_TODOS=false
```

**Result**: 10 issues → 0 TODOs, view in `~/.versatil/logs/guardian-telemetry.log`

---

### Scenario 4: Priority-Based Grouping

**Goal**: Group by priority to focus on critical issues first

```bash
GUARDIAN_CREATE_TODOS=true
GUARDIAN_GROUP_TODOS=true
GUARDIAN_GROUP_BY=priority
```

**Result**: 10 issues (6 critical, 4 high) → 2 TODOs (`guardian-combined-critical-*.md`, `guardian-combined-high-*.md`)

---

## Viewing Telemetry Logs

Even with TODO generation enabled, Guardian writes all issues to telemetry logs:

```bash
# View recent Guardian activity
tail -f ~/.versatil/logs/guardian-telemetry.log

# Search for specific issue type
grep "Test coverage" ~/.versatil/logs/guardian-telemetry.log

# View last health check
grep "Health Check" ~/.versatil/logs/guardian-telemetry.log | tail -1
```

---

## Manual Trigger

Trigger Guardian health check manually:

```bash
# Framework development context
npm run guardian:health-check

# Or via slash command
/guardian health-check

# Or via programmatic API
import { getGuardian } from '@versatil/sdlc-framework/guardian';
const guardian = getGuardian();
const result = await guardian.performHealthCheck();
```

---

## Performance Impact

| Metric | Value | Notes |
|--------|-------|-------|
| **Health Check Duration** | 2-5 seconds | Depends on project size |
| **TODO Generation Overhead** | <100ms | Per group of 10 issues |
| **Duplicate Detection** | <50ms | Per issue (fingerprint check) |
| **Total Impact** | <200ms | Negligible for 5-minute intervals |

---

## Troubleshooting

### No TODOs Created After Errors

**Symptom**: Guardian detects errors but doesn't create TODO files

**Solution**:
1. Check `GUARDIAN_CREATE_TODOS` is not set to `false`
2. Check console output for "Guardian todo creation disabled" message
3. Verify `todos/` directory exists and is writable

```bash
# Enable TODO creation
export GUARDIAN_CREATE_TODOS=true

# Verify configuration
env | grep GUARDIAN
```

---

### Too Many TODO Files

**Symptom**: Guardian creates too many TODO files (spam)

**Solution**: Enable grouping

```bash
GUARDIAN_GROUP_TODOS=true
GUARDIAN_GROUP_BY=agent
GUARDIAN_MAX_ISSUES_PER_TODO=10
```

---

### Duplicate TODOs

**Symptom**: Same issue appears in multiple TODO files

**Solution**: Anti-duplication is enabled by default, but verify:

```bash
# Check duplicate detection is enabled
GUARDIAN_DUPLICATE_DETECTION=true  # Default: true
```

If duplicates persist, check if issue descriptions are different (fingerprint won't match).

---

### TODOs Not Assigned to Correct Agent

**Symptom**: Issues routed to wrong agent

**Solution**: Guardian uses layer + issue type for routing. Check layer classification:

```typescript
// Framework layer → Sarah-PM, Oliver-MCP
// Project layer → Maria-QA, Marcus-Backend, James-Frontend
// Context layer → Alex-BA (vision), git-blame (style violations)
```

If routing is incorrect, file an issue with verification evidence.

---

## Related Documentation

- [Guardian Health System](./GUARDIAN_HEALTH_SYSTEM.md)
- [Three-Layer Verification](../architecture/THREE_LAYER_VERIFICATION.md)
- [Chain-of-Verification (CoVe)](../architecture/VICTOR_VERIFIER.md)
- [Agent Assignment Rules](../agents/AGENT_ASSIGNMENT_MATRIX.md)

---

## Version History

| Version | Change | Date |
|---------|--------|------|
| **7.10.0** | TODO generation enabled by default, combined TODOs | 2025-10-28 |
| **7.7.0** | TODO generation disabled by default, telemetry-only | 2025-10-21 |
| **7.0.0** | Initial Guardian health check system | 2025-10-15 |

---

## Frequently Asked Questions (FAQ)

### Q1: Why did Guardian start creating TODO files in v7.10.0?

**A**: Based on user feedback, many developers expected to see visible TODO files for detected issues rather than checking telemetry logs manually. v7.10.0 enables this by default while maintaining the option to disable for users who prefer telemetry-only tracking.

**Migration**: See [MIGRATION_V7.9_TO_V7.10.md](./MIGRATION_V7.9_TO_V7.10.md) for upgrade guide.

---

### Q2: How is this different from /plan or /triage TODOs?

**A**: Three different TODO sources:

| Command | Purpose | When | Format |
|---------|---------|------|--------|
| **Guardian** | Automatic error detection | Every 5 min | `guardian-combined-[agent]-*.md` |
| **/plan** | Feature implementation planning | Manual command | `001-pending-p1-[feature].md` |
| **/triage** | Convert findings to TODOs | Manual command | `002-pending-p2-[finding].md` |

**Guardian is automatic and reactive** (detects problems), while `/plan` and `/triage` are manual and proactive (plan work).

---

### Q3: Will I see hundreds of TODO files?

**A**: No! Smart grouping reduces files by 5-10x:
- **Without grouping**: 10 issues = 10 files
- **With grouping** (default): 10 issues = 2-3 combined files

Example:
```
Before grouping:
- guardian-12345-critical.md (test coverage)
- guardian-12346-critical.md (TypeScript error)
- guardian-12347-critical.md (npm vulnerability)
... (7 more)

After grouping:
- guardian-combined-maria-qa-critical-12345.md (all 10 issues)
```

---

### Q4: How do I disable Guardian TODO creation?

**A**: Set environment variable:

```bash
export GUARDIAN_CREATE_TODOS=false
```

Guardian reverts to telemetry-only tracking (v7.9.0 behavior).

---

### Q5: Can I customize which issues create TODOs?

**A**: Not directly, but you can:

1. **Disable by priority**: Guardian creates TODOs for all verified issues. To filter, set grouping strategy:
   ```bash
   GUARDIAN_GROUP_BY=priority
   ```

2. **Ignore low-priority**: Delete low-priority Guardian TODOs manually. Guardian won't recreate (anti-duplication).

3. **Custom filtering**: Create a script to filter Guardian TODOs based on your criteria.

---

### Q6: Do Guardian TODOs get committed to git?

**A**: Depends on your `.gitignore`:

- **If `todos/` in `.gitignore`**: Guardian TODOs NOT committed (like temporary files)
- **If `todos/` NOT in `.gitignore`**: Guardian TODOs ARE committed (for team visibility)

**Recommendation**: Add `todos/guardian-combined-*.md` to `.gitignore` if you don't want them in version control:

```bash
# .gitignore
todos/guardian-combined-*.md
```

---

### Q7: What happens to old Guardian TODOs after issues are fixed?

**A**: Guardian has anti-duplication, so:

1. Issue detected → Guardian creates TODO
2. You fix issue → Manual delete TODO
3. Same issue detected again → Guardian skips (duplicate detected via fingerprinting)

**Best practice**: Delete Guardian TODOs after fixing issues to keep `todos/` clean.

---

### Q8: Can Guardian auto-fix issues instead of creating TODOs?

**A**: YES! Guardian has auto-remediation for high-confidence issues (≥90%):

1. **Auto-apply eligible** (≥90% confidence):
   - Guardian attempts automatic fix
   - Logs action to telemetry
   - Creates TODO with "Auto-applied" status

2. **Manual review required** (<90% confidence):
   - Guardian creates TODO only
   - You review and fix manually
   - Run `/learn` to improve future auto-remediation

---

### Q9: How does Guardian collect context automatically?

**A**: Guardian auto-collects context through:

1. **Git config**: `git config user.email` → User ID
2. **Project metadata**: `.versatil-project.json` → Team/Project IDs (optional)
3. **User preferences**: `~/.versatil/users/[id]/profile.json` (created during onboarding)
4. **Team conventions**: `~/.versatil/teams/[id]/conventions.json` (if team setup done)
5. **Project vision**: `~/.versatil/projects/[id]/vision.json` (if project setup done)

**No manual configuration required** - Guardian uses git email as minimum.

---

### Q10: Can I see Guardian TODOs in my IDE?

**A**: Yes! Guardian TODOs are markdown files in `todos/`:

- **VSCode**: Use Markdown Preview (`Cmd+Shift+V` on Mac)
- **Cursor**: Open `todos/guardian-combined-*.md` files directly
- **JetBrains**: Markdown plugin renders them natively
- **Command line**: `cat todos/guardian-combined-*.md`

---

### Q11: What if Guardian detects false positives?

**A**: Guardian uses Chain-of-Verification (CoVe) to minimize false positives, but if one occurs:

1. **Short-term**: Delete the Guardian TODO (won't recreate due to anti-duplication)
2. **Long-term**: Report false positive to improve verification logic
3. **Workaround**: Disable Guardian TODO creation: `GUARDIAN_CREATE_TODOS=false`

---

### Q12: Can Guardian create TODOs in user projects AND framework development?

**A**: Yes! Guardian operates in dual-context mode:

| Context | Detects | Creates TODOs For |
|---------|---------|-------------------|
| **User Project** | Test failures, build errors, security vulnerabilities | Your application issues |
| **Framework Development** | Framework bugs, TypeScript errors, missing features | VERSATIL framework issues |

Guardian automatically detects context (no configuration needed).

---

### Q13: How often does Guardian check for issues?

**A**: Default: Every 5 minutes (configurable)

**To change interval**:
```bash
# Custom interval (in minutes)
export GUARDIAN_HEALTH_CHECK_INTERVAL=10  # Every 10 minutes
```

**To trigger manually**:
```bash
/guardian health-check
```

---

### Q14: What's the difference between Guardian TODOs and telemetry logs?

**A**: Both track the same issues:

| Feature | Guardian TODOs | Telemetry Logs |
|---------|---------------|----------------|
| **Format** | Markdown files in `todos/` | JSON logs in `~/.versatil/logs/` |
| **Visibility** | High (visible in project) | Low (requires manual check) |
| **Grouping** | By agent (smart grouping) | Chronological (all mixed) |
| **Actionable** | Yes (integrated with `/work`) | No (for debugging only) |
| **Default** | v7.10.0+ enabled | Always enabled |

**Recommendation**: Use Guardian TODOs for actionable tracking, telemetry logs for debugging.

---

### Q15: Can I customize Guardian TODO format?

**A**: Not directly (would require code changes), but you can:

1. **Fork framework**: Modify `formatCombinedTodoMarkdown()` in `src/agents/guardian/verified-issue-detector.ts`
2. **Post-process**: Script to transform Guardian TODOs after creation
3. **Request feature**: File GitHub issue with desired format

---

**Questions or Issues?**

- GitHub Issues: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- Migration Guide: [MIGRATION_V7.9_TO_V7.10.md](./MIGRATION_V7.9_TO_V7.10.md)
- Documentation: [CLAUDE.md](../../CLAUDE.md)
