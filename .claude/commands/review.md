---
description: "Multi-agent code review with OPERA in isolated worktrees"
argument-hint: "[branch or PR]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Task"
  - "Read"
  - "Grep"
  - "Glob"
  - "Bash(git:*)"
---

# Multi-Agent Code Review with OPERA

## Introduction

Conduct comprehensive code reviews using VERSATIL's OPERA agents in isolated git worktrees. This command provides parallel multi-perspective analysis for thorough quality assessment before merging.

## Review Target

<review_target> #$ARGUMENTS </review_target>

## Main Tasks

### 1. Setup Isolated Review Environment

<thinking>
Use git worktrees to create isolated review environments, preventing interference with active development work.
</thinking>

**Worktree Creation:**

- [ ] Identify the branch/PR to review (e.g., `feature/auth-system`)
- [ ] Create isolated worktree: `git worktree add ../review-worktree-<timestamp> <branch-name>`
- [ ] Verify worktree is clean and up to date
- [ ] Navigate to worktree directory for analysis

**Changed Files Identification:**

- [ ] Run `git diff main...HEAD --name-only` to list all changed files
- [ ] Categorize files by type (backend, frontend, tests, docs, config)
- [ ] Identify which OPERA agents are relevant for each category
- [ ] Calculate total lines changed: `git diff main...HEAD --shortstat`

### 2. Assign Review Responsibilities

<thinking>
Match file types and changes to appropriate OPERA agents based on their expertise domains.
</thinking>

**Agent Assignment Matrix:**

```yaml
Backend_Files: (*.ts API, controllers/, services/, routes/)
  Primary: Marcus-Backend
  Responsibilities:
    - API design and RESTful patterns
    - Security review (OWASP Top 10)
    - Database query optimization
    - Error handling and logging
    - Performance benchmarks (< 200ms)

Frontend_Files: (*.tsx, *.jsx, *.vue, *.css, components/)
  Primary: James-Frontend
  Responsibilities:
    - Component architecture and reusability
    - Accessibility audit (WCAG 2.1 AA)
    - Responsive design validation
    - Performance optimization
    - State management patterns

Test_Files: (*.test.*, *.spec.*, __tests__/)
  Primary: Maria-QA
  Responsibilities:
    - Test coverage analysis (80%+ required)
    - Test quality and completeness
    - Edge case coverage
    - Integration test validation
    - E2E test scenarios

Requirements_Docs: (*.feature, requirements/, issues/)
  Primary: Alex-BA
  Responsibilities:
    - Requirements traceability
    - Acceptance criteria validation
    - User story completeness
    - Business logic alignment
    - Edge case documentation

Project_Docs: (*.md, docs/, CHANGELOG.md)
  Primary: Sarah-PM
  Responsibilities:
    - Documentation clarity
    - Changelog accuracy
    - Migration guides
    - API documentation
    - Release notes

AI_ML_Code: (*.py, *.ipynb, models/, ml/)
  Primary: Dr.AI-ML
  Responsibilities:
    - Model architecture review
    - Training pipeline validation
    - Performance metrics
    - Data preprocessing
    - Model versioning
```

### 3. Parallel Multi-Agent Review

<thinking>
Execute reviews in parallel to maximize velocity while maintaining thoroughness. Each agent operates independently within their domain.
</thinking>

**Parallel Execution:**

Run these agents in parallel (Rule 1):

```markdown
- Task marcus-backend(backend_files) - API security, performance, OWASP
- Task james-frontend(frontend_files) - UI/UX, accessibility, performance
- Task maria-qa(test_files, all_files) - Test coverage, quality gates
- Task alex-ba(feature_description) - Requirements alignment
- Task sarah-pm(docs_files) - Documentation completeness
```

**Review Focus Areas:**

**Marcus-Backend Review Checklist:**
- [ ] API endpoints follow RESTful conventions
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Authentication/authorization checks
- [ ] Rate limiting and throttling
- [ ] Error handling with appropriate status codes
- [ ] Database query optimization (N+1 queries)
- [ ] Response time < 200ms for standard operations
- [ ] Logging without sensitive data exposure
- [ ] OWASP Top 10 compliance

**James-Frontend Review Checklist:**
- [ ] Component structure and reusability
- [ ] Accessibility (ARIA labels, semantic HTML, keyboard navigation)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] State management (Redux/Context patterns)
- [ ] Form validation and error handling
- [ ] Bundle size impact (< 5KB per feature)
- [ ] Cross-browser compatibility
- [ ] Design system consistency
- [ ] Loading states and error boundaries

**Maria-QA Review Checklist:**
- [ ] Test coverage >= 80% for new code
- [ ] Unit tests for all business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows
- [ ] Edge cases and error scenarios covered
- [ ] Test quality (clear assertions, no flaky tests)
- [ ] Mocking strategy appropriate
- [ ] Performance regression tests
- [ ] Security test scenarios
- [ ] Accessibility automated tests (axe-core)

**Alex-BA Review Checklist:**
- [ ] User stories fully implemented
- [ ] Acceptance criteria met
- [ ] Edge cases addressed
- [ ] Error messages user-friendly
- [ ] Business logic correct
- [ ] Requirements traceability
- [ ] Stakeholder concerns addressed
- [ ] Feature completeness
- [ ] Future extensibility considerations

**Sarah-PM Review Checklist:**
- [ ] CHANGELOG.md updated
- [ ] README.md reflects changes
- [ ] API documentation complete
- [ ] Migration guides provided
- [ ] Breaking changes documented
- [ ] Release notes prepared
- [ ] Dependencies updated
- [ ] Configuration documented

### 4. Review Output Collection

<thinking>
Each agent produces structured findings that need synthesis into actionable feedback.
</thinking>

**Finding Categories:**

```markdown
🔴 CRITICAL (Must Fix Before Merge):
- Security vulnerabilities (OWASP violations)
- Broken functionality
- Test coverage < 80%
- Accessibility violations
- Data loss risks

🟡 HIGH PRIORITY (Should Fix):
- Performance issues
- Code quality concerns
- Missing tests for edge cases
- Documentation gaps
- Architectural concerns

🟢 RECOMMENDATIONS (Nice to Have):
- Refactoring suggestions
- Optimization opportunities
- Code style improvements
- Additional test scenarios
- Documentation enhancements
```

**Agent Output Format:**

Each agent reports findings with:
```markdown
## [Agent Name] Review Report

### Summary
[High-level assessment of changes in their domain]

### Critical Issues (🔴)
1. **[Issue Title]** - [file_path:line_number]
   - **Problem**: [Description]
   - **Risk**: [Security/Performance/Functionality]
   - **Fix**: [Specific recommendation]
   - **Priority**: Must fix before merge

### High Priority Issues (🟡)
[Same format as critical]

### Recommendations (🟢)
[Same format as critical]

### Approval Status
- [ ] ❌ BLOCKED - Critical issues must be resolved
- [ ] ⚠️ APPROVED WITH CHANGES - High priority items should be addressed
- [ ] ✅ APPROVED - No blocking issues found
```

### 5. Synthesis & Final Review Report

<thinking>
Combine all agent findings into a unified, actionable review report with clear next steps.
</thinking>

**Synthesis Process:**

- [ ] Collect all agent reports
- [ ] Identify overlapping concerns (multiple agents flag same issue)
- [ ] Prioritize issues by severity and impact
- [ ] Group related findings
- [ ] Generate consolidated fix recommendations
- [ ] Create TodoWrite tasks for required changes

**Final Report Structure:**

```markdown
# Code Review Report: [Branch/PR Name]

## Executive Summary
- **Branch**: [branch-name]
- **Author**: [author-name]
- **Changed Files**: [count] ([+added][-deleted])
- **Review Date**: [YYYY-MM-DD]
- **Agents Consulted**: Marcus-Backend, James-Frontend, Maria-QA, Alex-BA, Sarah-PM

## Overall Assessment
[2-3 sentence summary of the changes and general code quality]

## Approval Status
- [ ] ✅ **APPROVED** - Ready to merge
- [ ] ⚠️ **APPROVED WITH CHANGES** - Non-blocking recommendations
- [ ] ❌ **CHANGES REQUESTED** - Critical issues must be resolved

## Critical Issues (🔴) - Must Fix
[Consolidated list with file paths, agent who found it, and fix recommendation]

### 1. [Issue Title] - Found by: [Agent Name]
- **File**: [file_path:line_number]
- **Problem**: [Description]
- **Impact**: [Security/Performance/Functionality risk]
- **Fix**: [Step-by-step resolution]

## High Priority Issues (🟡) - Should Fix
[Same format as critical]

## Recommendations (🟢) - Nice to Have
[Same format as critical]

## Agent-Specific Insights

### Marcus-Backend (API & Security)
[Key findings summary]

### James-Frontend (UI/UX)
[Key findings summary]

### Maria-QA (Testing & Quality)
- **Test Coverage**: [XX]% ([target: 80%+])
- **Missing Tests**: [list critical untested paths]
- **Quality Gates**: [Pass/Fail status]

### Alex-BA (Requirements)
- **Requirements Met**: [X]/[Y]
- **Acceptance Criteria**: [Complete/Incomplete]
- **Edge Cases**: [Addressed/Missing]

### Sarah-PM (Documentation)
- **Documentation Status**: [Complete/Incomplete]
- **CHANGELOG**: [Updated/Needs Update]
- **Breaking Changes**: [Yes/No - if yes, documented?]

## Test Coverage Analysis
- **Overall Coverage**: [XX]%
- **Files Below 80%**: [list]
- **Untested Critical Paths**: [list]

## Performance Assessment
- **API Response Times**: [assessment]
- **Bundle Size Impact**: [+XX KB]
- **Database Queries**: [N+1 issues: X found]

## Security Assessment
- **OWASP Compliance**: [Pass/Fail]
- **Vulnerabilities Found**: [count]
- **Authentication/Authorization**: [Pass/Fail]
- **Input Validation**: [Pass/Fail]

## Next Steps

### TodoWrite Tasks Created:
1. 🔄 Fix critical security issue in auth endpoint
2. ⏳ Add missing test coverage for payment flow
3. ⏳ Update accessibility labels in LoginForm
4. ⏳ Update CHANGELOG.md with breaking changes

### todos/*.md Files Created:
- 001-pending-p0-fix-auth-security.md (Marcus)
- 002-pending-p1-test-coverage-payment.md (Maria)
- 003-pending-p1-accessibility-fixes.md (James)
- 004-pending-p2-documentation-updates.md (Sarah)

## Review Meeting Notes
[Space for synchronous discussion notes if applicable]

## Approval Signatures
- [ ] Marcus-Backend: [✅ Approved | ❌ Changes Requested]
- [ ] James-Frontend: [✅ Approved | ❌ Changes Requested]
- [ ] Maria-QA: [✅ Approved | ❌ Changes Requested]
- [ ] Alex-BA: [✅ Approved | ❌ Changes Requested]
- [ ] Sarah-PM: [✅ Approved | ❌ Changes Requested]

---
**Review conducted by VERSATIL OPERA Framework**
**Git Worktree**: [worktree-path]
**Review Duration**: [X minutes]
```

### 6. Cleanup & Worktree Removal

<thinking>
After review is complete, clean up the isolated worktree to free disk space.
</thinking>

**Cleanup Steps:**

- [ ] Navigate back to main repository: `cd ../main-repo`
- [ ] Remove worktree: `git worktree remove ../review-worktree-<timestamp>`
- [ ] Prune worktree list: `git worktree prune`
- [ ] Verify cleanup: `git worktree list`

## Review Types

### 🔍 QUICK REVIEW (< 100 lines changed)

**Agents**: 1-2 relevant agents only
**Focus**: Core functionality and obvious issues
**Duration**: 5-10 minutes

**Example:**
```bash
/versatil:review feature/button-color-fix
→ Runs: James-Frontend only
→ Checks: UI consistency, accessibility, no breaking changes
```

### 📋 STANDARD REVIEW (100-500 lines changed)

**Agents**: 3-4 relevant agents
**Focus**: Comprehensive domain-specific review
**Duration**: 15-30 minutes

**Example:**
```bash
/versatil:review feature/user-authentication
→ Runs: Marcus-Backend, James-Frontend, Maria-QA
→ Checks: Security, tests, UI, documentation
```

### 📚 COMPREHENSIVE REVIEW (500+ lines changed)

**Agents**: All 6 OPERA agents
**Focus**: Deep multi-perspective analysis
**Duration**: 30-60 minutes

**Example:**
```bash
/versatil:review feature/payment-system
→ Runs: All OPERA agents in parallel
→ Checks: Security, architecture, tests, docs, requirements, project impact
```

## Parallel Execution Pattern

**Rule 1 Integration (Parallel Agent Execution):**

```yaml
Review_Request: "Review feature/auth-system branch"

Step_1_Setup:
  - Create git worktree
  - Identify changed files
  - Categorize by agent domain

Step_2_Parallel_Review (Concurrent):
  Marcus-Backend:
    - Reviews: src/api/auth.ts, src/middleware/jwt.ts
    - Checks: Security, OWASP, performance
    - Duration: ~10 minutes

  James-Frontend (Parallel with Marcus):
    - Reviews: src/components/LoginForm.tsx, src/styles/auth.css
    - Checks: Accessibility, responsive, performance
    - Duration: ~8 minutes

  Maria-QA (Parallel with both):
    - Reviews: All files + tests
    - Checks: Coverage, test quality, edge cases
    - Duration: ~12 minutes

Step_3_Synthesis:
  - Collect all findings
  - Remove duplicates
  - Prioritize by severity
  - Generate unified report

Total_Time: ~12 minutes (parallel) vs ~30 minutes (sequential)
Velocity_Gain: 2.5x faster with Rule 1
```

## Quality Gates Enforcement

**Automatic Blocking Conditions:**

- ❌ Test coverage < 80%
- ❌ Security vulnerabilities (OWASP violations)
- ❌ Accessibility violations (WCAG 2.1 AA)
- ❌ API response time > 200ms
- ❌ Missing documentation for breaking changes
- ❌ Unaddressed critical findings from any agent

**Quality Gate Report:**

```markdown
## Quality Gates Status

### Test Coverage: [PASS/FAIL]
- Required: 80%+
- Actual: [XX]%
- Status: [✅ Pass | ❌ Fail]

### Security: [PASS/FAIL]
- OWASP Compliance: [✅ Pass | ❌ Fail]
- Vulnerabilities: [0 | X found]

### Performance: [PASS/FAIL]
- API Response: [✅ < 200ms | ❌ XXXms]
- Bundle Size: [✅ < 5KB | ❌ +XX KB]

### Accessibility: [PASS/FAIL]
- WCAG 2.1 AA: [✅ Pass | ❌ X violations]

### Documentation: [PASS/FAIL]
- CHANGELOG: [✅ Updated | ❌ Missing]
- Breaking Changes: [✅ Documented | ❌ Not Documented | N/A]

**MERGE STATUS**: [✅ READY | ❌ BLOCKED]
```

## Git Worktree Benefits

**Why Worktrees for Reviews?**

1. **Isolation**: Review doesn't interfere with active development
2. **Parallel Reviews**: Review multiple PRs simultaneously
3. **Clean State**: Fresh checkout ensures no local changes affect review
4. **Easy Cleanup**: Remove worktree after review without affecting main repo
5. **Branch Switching**: No need to stash changes to switch branches

**Worktree Commands:**

```bash
# Create review worktree
git worktree add ../review-auth feature/auth-system

# List all worktrees
git worktree list

# Remove worktree after review
git worktree remove ../review-auth

# Prune stale worktree references
git worktree prune
```

## AI-Era Review Considerations

- [ ] Code may be AI-generated (validate logic, not just syntax)
- [ ] Check for AI hallucinations (non-existent APIs, incorrect patterns)
- [ ] Verify AI-generated tests actually test meaningful scenarios
- [ ] Ensure AI-generated docs are accurate and complete
- [ ] Review for over-engineering (AI tends to add complexity)
- [ ] Validate performance (AI may not optimize for scale)

## Output Format

Present complete review report with:

1. **Executive Summary** (2-3 sentences)
2. **Approval Status** (✅/⚠️/❌)
3. **Critical Issues** (blocking)
4. **High Priority Issues** (should fix)
5. **Recommendations** (nice to have)
6. **TodoWrite Tasks** (for fixing issues)
7. **todos/*.md Files** (persistent tracking)
8. **Quality Gates Status** (pass/fail)
9. **Next Steps** (immediate actions)

---

**Framework Integration:**
- **Rule 1**: Parallel agent execution for maximum velocity
- **Rule 2**: Auto-generate stress tests during review
- **Rule 3**: Daily audits track review completion rates
- **Rule 4**: Zero-config agent activation based on file patterns
- **Rule 5**: Automated release orchestration after review approval
