---
description: "Triage findings into actionable todos for tracking"
argument-hint: "[findings source]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Read"
  - "Write"
  - "TodoWrite"
  - "Grep"
---

# Triage Findings into Actionable Todos

## Introduction

Convert code review findings, security audits, performance analyses, or other technical assessments into structured todos/*.md files for tracking and resolution. This command helps you decide which findings warrant action and creates persistent todos for approved items.

**IMPORTANT: DO NOT CODE ANYTHING DURING TRIAGE!**

Triage is for **decision-making only**. Implementation happens later via `/work` or `/resolve` commands.

## Triage Target

<triage_target> #$ARGUMENTS </triage_target>

## Main Tasks

### 1. Load Findings

<thinking>
Findings can come from code reviews, security scans, performance analyses, or manual observations. Load and categorize them.
</thinking>

**Finding Sources:**

```yaml
Code_Review: (From /review command)
  - Critical issues (🔴)
  - High priority issues (🟡)
  - Recommendations (🟢)

Security_Audit: (From security scans)
  - Vulnerabilities (OWASP, CVEs)
  - Authentication issues
  - Data exposure risks

Performance_Analysis: (From profiling)
  - Slow API endpoints (> 200ms)
  - N+1 queries
  - Large bundle sizes (> 5KB increase)

Manual_Observations: (From developer notes)
  - Technical debt
  - Code smells
  - Refactoring opportunities
```

**Finding Categories:**

```markdown
🔴 P0 - CRITICAL (Immediate action required)
  - Security vulnerabilities
  - Data loss risks
  - Production outages
  - Broken core functionality

🟠 P1 - HIGH (Should fix soon)
  - Performance degradation
  - User-facing bugs
  - Accessibility violations
  - Missing critical tests

🟡 P2 - MEDIUM (Should fix eventually)
  - Code quality issues
  - Minor UX problems
  - Documentation gaps
  - Refactoring opportunities

🟢 P3 - LOW (Nice to have)
  - Code style improvements
  - Minor optimizations
  - Additional test scenarios
  - Enhanced documentation
```

### 2. Validate Findings Authenticity ⭐ AGENT-DRIVEN (Victor-Verifier)

<thinking>
Before presenting findings to user, use Victor-Verifier to validate finding authenticity and prevent hallucinated security issues from becoming todos.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE VICTOR-VERIFIER USING THE TASK TOOL:**

**ACTION: Invoke Victor-Verifier Agent**
Call the Task tool with:
- `subagent_type: "Victor-Verifier"`
- `description: "Validate finding authenticity and evidence"`
- `prompt: "Verify findings authenticity using Chain-of-Verification (CoVe) before presenting to user. Input: ${findings_count} findings from '${triage_target}' source (code review/security scan/performance analysis/manual observations). Your anti-hallucination verification: (1) Extract factual claims from each finding ('SQL injection exists in src/api/users/search.ts:42', 'CVSS score is 9.1', 'Attack uses OR 1=1 pattern'), (2) Verify claims against actual source files (read src/api/users/search.ts and confirm vulnerable code exists at line 42, check if string interpolation is used, validate claim accuracy), (3) Cross-check severity ratings (is P0 justified? does code actually allow injection? is CVSS score calculation correct?), (4) Identify hallucinations (finding references non-existent files, fabricated vulnerability types, inflated severity ratings, made-up OWASP categories, phantom attack scenarios), (5) Validate evidence (code examples match actual files, line numbers are accurate, proposed solutions are technically sound), (6) Flag suspicious findings (generic findings with no file references, copy-pasted findings from different projects, findings that don't match project tech stack), (7) Check for false positives (parameterized queries incorrectly flagged as vulnerable, security headers already present but finding claims missing, rate limiting exists but finding says it's absent). Return: { verified_findings: [{finding_id, severity, verified: true|false, evidence_score: 0-100, authenticity_issues: []}], hallucinations_found: [{finding_id, claim: string, reality: string, severity: 'critical'|'high'|'medium'|'low'}], corrections_needed: [{finding_id, wrong_severity, correct_severity, proof: string}], false_positives: [{finding_id, reason: string}], overall_verification_score: number, safe_to_present: boolean }"`

**Expected Victor-Verifier Output:**

```typescript
interface FindingVerificationResult {
  verified_findings: Array<{
    finding_id: string;              // e.g., "001", "002"
    title: string;                    // e.g., "SQL Injection in User Search"
    severity: 'p0' | 'p1' | 'p2' | 'p3';
    verified: boolean;                // true = evidence confirmed, false = hallucination
    evidence_score: number;           // 0-100 (confidence in evidence)
    authenticity_issues: string[];    // Issues found during verification
  }>;

  hallucinations_found: Array<{
    finding_id: string;
    claim: string;                    // Claimed fact
    reality: string;                  // Actual truth
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;

  corrections_needed: Array<{
    finding_id: string;
    wrong_severity: string;           // Original severity rating
    correct_severity: string;         // Corrected severity
    proof: string;                    // Evidence for correction
  }>;

  false_positives: Array<{
    finding_id: string;
    reason: string;                   // Why this is a false positive
  }>;

  overall_verification_score: number; // 0-100 (0 = all hallucinations, 100 = all verified)
  safe_to_present: boolean;           // true = proceed with triage, false = re-run scan
}
```

**Chain-of-Verification (CoVe) Example:**

Victor-Verifier applies CoVe method to each finding:

```typescript
// Finding #1: "SQL Injection in User Search"
const finding = {
  id: "001",
  title: "SQL Injection Risk in User Search",
  severity: "p0",
  location: "src/api/users/search.ts:42",
  claim: "Uses string interpolation in SQL query",
  attack_scenario: "Attacker inputs: admin' OR '1'='1",
  cvss_score: 9.1
};

// Step 1: Extract factual claims
const claims = [
  { claim: "File src/api/users/search.ts exists", verifiable: true },
  { claim: "Vulnerable code at line 42", verifiable: true },
  { claim: "Uses string interpolation", verifiable: true },
  { claim: "CVSS score is 9.1", verifiable: true },
  { claim: "Attack pattern OR 1=1 works", verifiable: false } // requires testing
];

// Step 2: Verify claims against actual code
const file_content = readFile('src/api/users/search.ts');
const line_42 = file_content.split('\n')[41]; // line 42 (0-indexed)

// Claim 1: File exists
if (file_content) {
  claims[0].verified = true;
  claims[0].evidence = "File successfully read";
} else {
  hallucinations_found.push({
    finding_id: "001",
    claim: "File src/api/users/search.ts exists",
    reality: "File does not exist in codebase",
    severity: "critical" // Finding references non-existent file
  });
  return { verified: false };
}

// Claim 2: Vulnerable code at line 42
if (line_42.includes('${') || line_42.includes('`SELECT')) {
  claims[1].verified = true;
  claims[1].evidence = `Line 42: ${line_42}`;
} else {
  corrections_needed.push({
    finding_id: "001",
    wrong_line: 42,
    correct_line: findActualVulnerableLine(file_content),
    proof: "Line 42 uses parameterized query, but line 57 has string interpolation"
  });
}

// Claim 3: Uses string interpolation
const has_string_interpolation = line_42.includes('`SELECT') && line_42.includes('${');
const has_parameterized = line_42.includes('?') || line_42.includes('$1');

if (has_string_interpolation && !has_parameterized) {
  claims[2].verified = true;
  claims[2].evidence = "String interpolation detected: `SELECT * FROM users WHERE name='${req.query.name}'`";
} else if (has_parameterized) {
  false_positives.push({
    finding_id: "001",
    reason: "Code already uses parameterized queries - finding is outdated or incorrect"
  });
  return { verified: false };
}

// Claim 4: CVSS score accuracy
const cvss_factors = {
  attack_vector: 'network',        // AV:N
  attack_complexity: 'low',         // AC:L
  privileges_required: 'none',      // PR:N
  user_interaction: 'none',         // UI:N
  confidentiality_impact: 'high',   // C:H
  integrity_impact: 'high',         // I:H
  availability_impact: 'high'       // A:H
};

const calculated_cvss = calculateCVSS(cvss_factors); // Returns 9.8
if (Math.abs(calculated_cvss - finding.cvss_score) > 1.0) {
  corrections_needed.push({
    finding_id: "001",
    wrong_cvss: 9.1,
    correct_cvss: 9.8,
    proof: "CVSS v3.1 calculator shows 9.8 for SQL injection with no authentication required"
  });
}

// Step 3: Cross-check severity rating
if (has_string_interpolation && finding.severity === 'p0') {
  verified_findings.push({
    finding_id: "001",
    title: "SQL Injection Risk in User Search",
    severity: "p0",
    verified: true,
    evidence_score: 95, // High confidence
    authenticity_issues: [] // No issues
  });
} else if (has_string_interpolation && finding.severity === 'p3') {
  corrections_needed.push({
    finding_id: "001",
    wrong_severity: "p3",
    correct_severity: "p0",
    proof: "SQL injection is always P0 (critical) per OWASP, not P3 (low)"
  });
}
```

**Hallucination Detection Examples:**

```typescript
// Hallucination Type 1: Non-existent file
{
  finding_id: "005",
  claim: "XSS vulnerability in src/frontend/AdminPanel.jsx",
  reality: "File src/frontend/AdminPanel.jsx does not exist (project uses TypeScript, all files are .tsx)",
  severity: "critical" // Finding is completely fabricated
}

// Hallucination Type 2: False vulnerability
{
  finding_id: "008",
  claim: "Missing CORS headers - server allows all origins",
  reality: "CORS headers properly configured at src/middleware/cors.ts:12 with whitelist",
  severity: "high" // False positive - security control already exists
}

// Hallucination Type 3: Inflated severity
{
  finding_id: "012",
  claim: "Missing semicolon in config.js (P0 - Critical)",
  reality: "Missing semicolon is a code style issue, not a security vulnerability",
  severity: "medium" // Severity drastically inflated (should be P3)
}

// Hallucination Type 4: Wrong tech stack
{
  finding_id: "015",
  claim: "SQL injection in MongoDB query using string concatenation",
  reality: "Project uses PostgreSQL, not MongoDB. Claim doesn't match tech stack.",
  severity: "critical" // Finding copied from different project
}

// Hallucination Type 5: Phantom attack scenario
{
  finding_id: "018",
  claim: "JWT token stored in localStorage allows XSS token theft",
  reality: "JWT tokens stored in httpOnly cookies (secure), not localStorage",
  severity: "high" // Attack scenario doesn't apply to current implementation
}
```

**Verification Quality Gates:**

```yaml
HIGH_CONFIDENCE: (Proceed with triage)
  - evidence_score >= 90
  - authenticity_issues: 0-1 minor issues
  - hallucinations_found: 0
  - false_positives: 0-1
  - overall_verification_score >= 85

MEDIUM_CONFIDENCE: (Proceed with warnings)
  - evidence_score: 70-89
  - authenticity_issues: 2-3 issues
  - hallucinations_found: 1-2 non-critical
  - false_positives: 2-3
  - overall_verification_score: 70-84
  - ⚠️ Present findings but flag uncertain ones

LOW_CONFIDENCE: (Re-run scan)
  - evidence_score < 70
  - authenticity_issues >= 4
  - hallucinations_found >= 3 OR any critical
  - false_positives >= 4
  - overall_verification_score < 70
  - ❌ Do NOT present findings - scan quality too poor
```

**Verification Results Processing:**

After Victor-Verifier completes, process results:

```typescript
if (verification.safe_to_present === false) {
  console.log("❌ VERIFICATION FAILED - Findings quality too poor to present");
  console.log(`Overall verification score: ${verification.overall_verification_score}/100`);
  console.log(`Hallucinations found: ${verification.hallucinations_found.length}`);
  console.log(`False positives: ${verification.false_positives.length}`);

  console.log("\n🔴 Critical Issues:");
  verification.hallucinations_found
    .filter(h => h.severity === 'critical')
    .forEach(h => {
      console.log(`- Finding ${h.finding_id}: ${h.claim}`);
      console.log(`  Reality: ${h.reality}`);
    });

  console.log("\n⚠️ Recommendation: Re-run security scan with proper configuration");
  return; // BLOCK TRIAGE - do not present unreliable findings
}

// Filter out hallucinated and false positive findings
const safe_findings = findings.filter(f => {
  const verified = verification.verified_findings.find(v => v.finding_id === f.id);
  const is_hallucination = verification.hallucinations_found.some(h => h.finding_id === f.id);
  const is_false_positive = verification.false_positives.some(fp => fp.finding_id === f.id);

  return verified && verified.verified && !is_hallucination && !is_false_positive;
});

// Apply severity corrections
safe_findings.forEach(f => {
  const correction = verification.corrections_needed.find(c => c.finding_id === f.id);
  if (correction) {
    console.log(`✏️ Correcting Finding ${f.id} severity: ${correction.wrong_severity} → ${correction.correct_severity}`);
    console.log(`  Reason: ${correction.proof}`);
    f.severity = correction.correct_severity;
  }
});

console.log(`✅ Verification Complete: ${safe_findings.length}/${findings.length} findings verified`);
console.log(`Evidence score: ${verification.overall_verification_score}/100`);
```

---

### 3. Present Findings One by One

<thinking>
After Victor-Verifier validation, present only verified findings systematically with user decision prompts.
</thinking>

**Presentation Format:**

```markdown
---
## Finding #1: SQL Injection Risk in User Search

**Severity**: 🔴 P0 (CRITICAL)
**Category**: Security / OWASP Top 10
**Source**: Code Review (Marcus-Backend)

**Description**:
The user search endpoint constructs SQL queries using string interpolation instead of parameterized queries, creating SQL injection vulnerability.

**Location**: `src/api/users/search.ts:42`

**Problem Scenario**:
1. Attacker inputs: `admin' OR '1'='1`
2. Query becomes: `SELECT * FROM users WHERE username='admin' OR '1'='1'`
3. Returns all users instead of just matching user
4. Potential for data exfiltration or manipulation

**Code Example**:
```typescript
// VULNERABLE CODE
const query = `SELECT * FROM users WHERE username='${req.query.username}'`;
const results = await db.execute(query);
```

**Proposed Solution**:
```typescript
// SECURE CODE
const query = 'SELECT * FROM users WHERE username = ?';
const results = await db.execute(query, [req.query.username]);
```

**Impact**:
- **Risk**: Data breach, unauthorized access
- **Users Affected**: All users
- **Exploitability**: High (simple attack)
- **CVSS Score**: 9.1 (Critical)

**Estimated Effort**: Small (< 2 hours)
- Change query to use parameterization
- Update 3 affected endpoints
- Add security tests
- Validate with SAST scan

**Acceptance Criteria**:
- [ ] All user queries use parameterized statements
- [ ] SAST scan shows no SQL injection vulnerabilities
- [ ] Security tests validate protection against common injection patterns
- [ ] Code review approval from Marcus-Backend

**Related Findings**:
- Finding #7: Similar issue in product search
- Finding #12: Missing input validation

---

**Do you want to create a todo for this finding?**

Options:
1. **yes** - Create todos/XXX-pending-p0-sql-injection-user-search.md
2. **next** - Skip this finding (not actionable now)
3. **custom** - Modify finding details before creating todo
4. **merge** - Merge with another finding (e.g., #7 has same root cause)
5. **defer** - Mark as deferred for future sprint
```

### 3. Handle User Decision

<thinking>
Based on user response, create todo file, skip, modify, merge, or defer.
</thinking>

**Decision: yes**

```bash
# 1. Determine next issue ID
next_id=$(ls todos/ | grep -o '^[0-9]\+' | sort -n | tail -1)
next_id=$((next_id + 1))

# 2. Create filename from finding details
filename=$(printf "%03d-pending-p0-sql-injection-user-search.md" $next_id)

# 3. Copy template
cp todos/000-pending-p1-TEMPLATE.md todos/$filename

# 4. Populate with finding data
# Edit todos/$filename with finding details
```

**Todo File Content:**

```markdown
---
status: pending
priority: p0
issue_id: "015"
tags: [security, sql-injection, owasp, critical]
dependencies: []
assigned: Marcus-Backend
estimated_effort: Small
---

# SQL Injection Risk in User Search - P0

## Status
- [x] Pending
- **Priority**: P0 (Critical)
- **Created**: 2025-10-12
- **Assigned**: Marcus-Backend
- **Estimated Effort**: Small (< 2 hours)
- **Source**: Code Review Finding #1

## Problem Statement

The user search endpoint constructs SQL queries using string interpolation instead of parameterized queries, creating SQL injection vulnerability. Attacker can bypass authentication and exfiltrate data.

## Findings

- **Location**: src/api/users/search.ts:42
- **Vulnerability Type**: SQL Injection (OWASP A03:2021)
- **CVSS Score**: 9.1 (Critical)
- **Exploitability**: High
- **Impact**: Data breach, unauthorized access to all user records

**Attack Scenario**:
1. Attacker inputs: `admin' OR '1'='1`
2. Query becomes: `SELECT * FROM users WHERE username='admin' OR '1'='1'`
3. Returns all users instead of just matching user
4. Enables data exfiltration or manipulation

## Proposed Solutions

### Option 1: Parameterized Queries (Recommended)
```typescript
// Replace string interpolation with parameterized query
const query = 'SELECT * FROM users WHERE username = ?';
const results = await db.execute(query, [req.query.username]);
```

- **Pros**: Industry standard, database-native protection, minimal code change
- **Cons**: None
- **Effort**: Small (1-2 hours)
- **Risk**: Low

### Option 2: ORM-Based Query Builder
```typescript
// Use ORM (e.g., TypeORM, Prisma) for automatic parameterization
const results = await User.find({ where: { username: req.query.username } });
```

- **Pros**: Additional abstraction, type safety, easier to maintain
- **Cons**: Larger refactor if ORM not already in use
- **Effort**: Medium (if adding ORM) / Small (if ORM exists)
- **Risk**: Medium

## Recommended Action

**Use Option 1 (Parameterized Queries)** - Immediate fix with minimal changes.

## Technical Details

- **Affected Files**:
  - src/api/users/search.ts (primary)
  - src/api/users/filter.ts (similar pattern)
  - src/api/users/lookup.ts (similar pattern)

- **Related Components**:
  - User authentication module
  - Database query layer
  - API input validation

- **Database Changes**: None (code-only fix)

## Resources

- OWASP SQL Injection: https://owasp.org/www-community/attacks/SQL_Injection
- Parameterized Queries Guide: https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html
- Related Finding: #7 (product search has same issue)
- Related Finding: #12 (missing input validation)

## Acceptance Criteria

- [ ] All user search queries use parameterized statements
- [ ] Similar patterns fixed in filter.ts and lookup.ts
- [ ] SAST scan shows 0 SQL injection vulnerabilities
- [ ] Security tests added for common injection patterns:
  - [ ] `' OR '1'='1`
  - [ ] `'; DROP TABLE users; --`
  - [ ] `UNION SELECT * FROM passwords`
- [ ] Code review approval from Marcus-Backend
- [ ] Security validation from Maria-QA

## Dependencies

- **Depends on**: None (can start immediately)
- **Blocks**:
  - #016 (user search optimization - needs secure queries first)
  - Release v1.1.0 (critical security fix required)

## Work Log

### 2025-10-12 - Triage Session
**By:** Claude Triage System
**Actions:**
- Finding discovered during code review
- Categorized as P0 Critical (security)
- Estimated effort: Small (< 2 hours)
- Assigned to Marcus-Backend
- Marked as blocking v1.1.0 release

**Learnings:**
- String interpolation in queries is dangerous
- Parameterized queries are standard protection
- Similar patterns exist in 3 endpoints (need systematic fix)

## Notes

- **Urgency**: Critical - must fix before next release
- **Testing**: Requires both unit tests and security validation
- **Deployment**: Should be hotfixed to production after QA approval
- **Communication**: Alert security team once fixed
```

**Confirmation Message:**

```markdown
✅ Created: todos/015-pending-p0-sql-injection-user-search.md

**Next Finding**: #2/25
**Todos Created**: 1
**Skipped**: 0
```

**Decision: next**

```markdown
⏭️ Skipped: Finding #1 (SQL Injection Risk in User Search)

**Reason**: Not creating todo (user chose to skip)
**Next Finding**: #2/25
**Todos Created**: 0
**Skipped**: 1
```

**Decision: custom**

```markdown
Let me help you customize this finding before creating the todo.

**What would you like to modify?**
1. Severity/Priority (currently P0)
2. Estimated Effort (currently Small)
3. Proposed Solution (add alternative approaches)
4. Acceptance Criteria (add/remove criteria)
5. Description (clarify problem statement)
6. Assignment (change from Marcus-Backend to another agent)

Please specify what to change.
```

**Decision: merge**

```markdown
You chose to merge this finding with another.

**Similar Findings**:
- Finding #7: SQL Injection in product search (also P0)
- Finding #12: Missing input validation (P1)

**Merge Options**:
1. Merge #1 + #7 → "SQL Injection in Search Endpoints" (broader scope)
2. Merge #1 + #12 → "Input Validation and SQL Injection" (related issues)

Which findings should be merged? (e.g., "1 7" to merge #1 and #7)
```

**Decision: defer**

```markdown
⏸️ Deferred: Finding #1 (SQL Injection Risk in User Search)

**Reason**: Will address in future sprint

**Tracking**:
- Not creating todo now
- Added to deferred-findings.md for future reference
- Can revisit with: /versatil:triage deferred

**Next Finding**: #2/25
**Todos Created**: 0
**Skipped**: 0
**Deferred**: 1
```

### 4. Batch Operations

<thinking>
For efficiency, allow bulk operations on similar findings.
</thinking>

**Batch Create:**

```markdown
**Batch Mode Detected**: 15 findings all have same category (Security)

**Would you like to:**
1. **Review each individually** (default, recommended)
2. **Create todos for all P0 findings** (5 findings)
3. **Create todos for all P0 + P1 findings** (12 findings)
4. **Skip all P2/P3 findings** (save time on low priority)

Please choose option (1-4).
```

**Batch Skip:**

```markdown
**User selected**: Skip all P3 findings

Skipping:
- Finding #18: Code style inconsistency (P3)
- Finding #20: Additional JSDoc comments (P3)
- Finding #23: Refactor helper function (P3)
- Finding #25: Update dependency versions (P3)

**Skipped**: 4 findings (all P3)
**Next**: Continuing with P0-P2 findings only
```

### 5. Progress Tracking

<thinking>
Show progress through triage session with running totals.
</thinking>

**Progress Display:**

```markdown
## Triage Progress

**Session**: Code Review Findings (PR #123)
**Total Findings**: 25
**Progress**: 10/25 (40% complete)

**Decisions Made**:
- ✅ Created Todos: 6
- ⏭️ Skipped: 2
- ⏸️ Deferred: 1
- 🔀 Merged: 1 (combined #1 + #7)

**By Priority**:
- P0 (Critical): 3 todos created, 0 skipped
- P1 (High): 2 todos created, 1 skipped
- P2 (Medium): 1 todo created, 1 deferred
- P3 (Low): 0 todos created, 0 skipped

**Remaining Findings**: 15
- P0: 1
- P1: 4
- P2: 6
- P3: 4

**Estimated Total Effort** (for created todos): 12 hours
```

### 6. Triage Summary Report

<thinking>
After all findings reviewed, provide comprehensive summary.
</thinking>

**Final Summary:**

```markdown
# Triage Session Complete ✅

## Session Details
- **Source**: Code Review PR #123 (Authentication Feature)
- **Date**: 2025-10-12
- **Total Findings**: 25
- **Duration**: 45 minutes
- **Reviewer**: Claude + User

## Decisions Summary

### Created Todos: 8 ✅
**P0 (Critical) - 3 todos**:
- 015-pending-p0-sql-injection-user-search.md
- 016-pending-p0-authentication-bypass.md
- 017-pending-p0-data-exposure-logs.md

**P1 (High) - 4 todos**:
- 018-pending-p1-missing-rate-limiting.md
- 019-pending-p1-test-coverage-auth.md
- 020-pending-p1-accessibility-login-form.md
- 021-pending-p1-performance-n-plus-one.md

**P2 (Medium) - 1 todo**:
- 022-pending-p2-refactor-auth-middleware.md

**P3 (Low) - 0 todos**:
- None created (all deferred or skipped)

### Skipped Findings: 12 ⏭️
- 8 findings: Low priority (P3)
- 3 findings: Duplicate of existing todos
- 1 finding: Not actionable (requires external team)

### Deferred Findings: 3 ⏸️
- 2 findings: Future sprint consideration
- 1 finding: Waiting for design decision

### Merged Findings: 2 🔀
- Findings #1 + #7 → 015 (SQL injection in multiple endpoints)
- Findings #5 + #9 → 018 (Rate limiting for all auth endpoints)

## Effort Estimation

**Total Estimated Effort**: 16 hours
- P0: 6 hours (3 todos × 2 hours avg)
- P1: 8 hours (4 todos × 2 hours avg)
- P2: 2 hours (1 todo × 2 hours)

**By Agent**:
- Marcus-Backend: 8 hours (security, performance)
- James-Frontend: 3 hours (accessibility, UI)
- Maria-QA: 5 hours (testing, coverage)

## Priority Actions

### Immediate (P0 - Must fix before release):
1. **015**: SQL injection in user search (CRITICAL)
   - Agent: Marcus-Backend
   - Effort: 2 hours
   - Block: Release v1.1.0

2. **016**: Authentication bypass vulnerability (CRITICAL)
   - Agent: Marcus-Backend
   - Effort: 2 hours
   - Block: Release v1.1.0

3. **017**: Sensitive data in logs (CRITICAL)
   - Agent: Marcus-Backend
   - Effort: 2 hours
   - Block: Release v1.1.0

### High Priority (P1 - Should fix soon):
4. **018**: Missing rate limiting (HIGH)
   - Agent: Marcus-Backend
   - Effort: 2 hours
   - Impact: DoS protection

5. **019**: Test coverage below 80% (HIGH)
   - Agent: Maria-QA
   - Effort: 3 hours
   - Impact: Quality gates

[... remaining P1 todos ...]

## Next Steps

### 1. Review Created Todos
```bash
# View all pending todos
ls todos/*-pending-*.md

# View by priority
ls todos/*-pending-p0-*.md  # Critical
ls todos/*-pending-p1-*.md  # High
```

### 2. Start Resolution
```bash
# Resolve P0 items in parallel (critical security fixes)
/versatil:resolve priority:p0

# OR work on specific todo
/versatil:work 015-pending-p0-sql-injection-user-search
```

### 3. Track Progress
- TodoWrite will show real-time progress
- todos/*.md files maintain persistent state
- Daily audits track completion rates

### 4. Review Deferred Items
```bash
# Revisit deferred findings
/versatil:triage deferred

# View deferred list
cat triage/deferred-findings.md
```

## Quality Gates Impact

**Blocking Release** (3 P0 todos must complete):
- ❌ Cannot release v1.1.0 until all P0 security fixes complete
- ❌ Security audit required before production deployment
- ⚠️ Consider hotfix release strategy for P0 items

**Recommended Timeline**:
1. **Day 1**: Fix P0 items (6 hours)
2. **Day 2**: Fix P1 items (8 hours)
3. **Day 3**: Security validation + release

## Files Created

### Todos Directory:
```
todos/
├── 015-pending-p0-sql-injection-user-search.md
├── 016-pending-p0-authentication-bypass.md
├── 017-pending-p0-data-exposure-logs.md
├── 018-pending-p1-missing-rate-limiting.md
├── 019-pending-p1-test-coverage-auth.md
├── 020-pending-p1-accessibility-login-form.md
├── 021-pending-p1-performance-n-plus-one.md
└── 022-pending-p2-refactor-auth-middleware.md
```

### Tracking Files:
```
triage/
├── deferred-findings.md (3 items)
├── skipped-findings.md (12 items)
└── triage-session-2025-10-12.md (this report)
```

---
**Triage Method**: /versatil:triage
**Framework**: VERSATIL OPERA v1.0
**Session Complete**: 2025-10-12 14:45
```

## Triage Modes

### 📋 INTERACTIVE (Default)

**Strategy**: Present each finding, wait for user decision
**Best for**: Complex findings, unclear priorities

```bash
/versatil:triage code-review-findings.json
→ Shows each finding one by one
→ User chooses: yes/next/custom/merge/defer
→ Creates todos for approved findings
```

### 🚀 BATCH

**Strategy**: Auto-create todos for all findings above threshold
**Best for**: Large volumes of similar findings

```bash
/versatil:triage --batch --min-priority=p1
→ Auto-creates todos for all P0 and P1 findings
→ Skips P2 and P3 automatically
→ Faster for bulk triage
```

### 🎯 PRIORITY

**Strategy**: Only show findings at specific priority
**Best for**: Focused triage sessions

```bash
/versatil:triage --priority=p0
→ Only shows critical findings
→ Skips all other priorities
→ Ensures critical issues are addressed first
```

## Output Format

1. **Finding Presentation** (one at a time)
2. **User Decision Prompt** (yes/next/custom/merge/defer)
3. **Todo Creation** (if approved)
4. **Progress Update** (X/Y complete)
5. **Final Summary** (comprehensive report)
6. **Next Steps** (recommended actions)

---

**Framework Integration:**
- **Rule 1**: Parallel resolution after triage (via /resolve)
- **Rule 2**: Auto-generate stress tests for performance findings
- **Rule 3**: Daily audits track triage completion rates
- **Rule 4**: Zero-config agent assignment based on finding category
- **Rule 5**: Automated release blocked by P0 findings until resolved
- **Dual Tracking**: TodoWrite (during resolution) + todos/*.md (persistent)
