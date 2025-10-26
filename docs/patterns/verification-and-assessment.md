# Verification and Assessment Patterns

**Based on**: VERSATIL v6.6.0 (Victor-Verifier + Assessment Engine)
**Status**: Production (Victor 95%, Assessment Phase 1 90%)
**Last Updated**: 2025-10-22

---

## Overview

This document captures verification and assessment patterns from VERSATIL v6.6.0, including:
- **Victor-Verifier**: Anti-hallucination with Chain-of-Verification (CoVe)
- **Assessment Engine**: Quality auditing with pattern detection

---

## Part 1: Anti-Hallucination (Victor-Verifier)

### Chain-of-Verification (CoVe)

**Research Basis**: Meta AI (arXiv:2309.11495)
**Success Rate**: 95%
**Hallucination Reduction**: 40%

#### 4-Step CoVe Process

```
1. PLAN → Determine verification method
   ↓
2. ANSWER → Execute verification
   ↓
3. CROSS-CHECK → Validate evidence
   ↓
4. FINALIZE → Assign confidence score (0-100%)
```

#### Implementation

```typescript
// src/agents/verification/chain-of-verification.ts
class ChainOfVerification {
  async verify(claim: Claim): Promise<VerificationResult> {
    // Step 1: Plan verification method
    const plan = await this.planVerification(claim);
    // Examples:
    // - FileCreation → fs.existsSync
    // - GitCommit → git show
    // - CommandExecution → exit code

    // Step 2: Execute verification
    const answer = await this.executeVerification(plan);

    // Step 3: Cross-check evidence
    const crossCheck = await this.crossCheckEvidence(answer);
    // Additional validation beyond initial answer

    // Step 4: Finalize with confidence scoring
    return this.finalizeVerification(crossCheck);
    // Confidence: 0-100%
    // Evidence: Proof data
    // Verified: true/false
  }
}
```

---

### Claim Categories

Victor verifies 6 types of claims:

| Category | Example | Verification Method |
|----------|---------|---------------------|
| **FileCreation** | "Created src/auth.ts" | `fs.existsSync()`, `ls -la` |
| **FileEdit** | "Edited line 42" | Read file, check content |
| **GitCommit** | "Committed hash abc123" | `git show abc123` |
| **CommandExecution** | "Ran npm test" | Exit code, stdout |
| **DataAssertion** | "Line 42 contains..." | Grep/Read tools |
| **Metric** | "618 lines written" | `wc -l` |

---

### Confidence Scoring

**Scale**: 0-100%

**Thresholds**:
- **100%**: Perfect verification (file exists, git commit verified)
- **80-99%**: High confidence (minor uncertainty)
- **<80%**: **FLAGGED FOR REVIEW** (uncertain claim)
- **0%**: Failed verification (hallucination detected)

**Example**:
```json
{
  "claim": "Created src/auth.ts with 283 lines",
  "verified": true,
  "confidence": 95,
  "evidence": {
    "exists": true,
    "size": 1283,
    "lines": 283,
    "created": "2025-10-22T17:30:00Z"
  },
  "reason": "File exists, line count verified (confidence reduced 5% due to timestamp uncertainty)"
}
```

---

### Proof Logging

**Format**: JSONL (append-only)
**Location**: `.versatil/verification/proof-log.jsonl`

**Benefits**:
- ✅ Append-only (audit trail)
- ✅ One verification per line (easy parsing)
- ✅ Machine-readable (JSONL)
- ✅ Timestamped (trend analysis)

**Example Entry**:
```json
{"timestamp":"2025-10-22T17:30:00Z","claim":"Created src/auth.ts","category":"FileCreation","verified":true,"confidence":100,"evidence":{"exists":true,"size":1283},"method":"fs.existsSync + ls -la"}
```

---

### Universal Verification Pattern

**Key**: Use PostToolUse matcher `"*"` to verify ALL tool outputs.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",  // ✅ ALL tools (not just specific ones)
        "hooks": [{"command": ".claude/hooks/post-agent-response.ts"}]
      }
    ]
  }
}
```

**Why**: Hallucinations can occur in ANY tool output (Write, Edit, Bash, Task, etc.). Universal verification catches all of them.

---

### Best Practices

#### 1. **Non-Blocking Verification**
```typescript
// ✅ Good: Async, non-blocking
(async () => {
  const result = await verify(claim);
  await logToProofLog(result);
})();

// ❌ Bad: Synchronous, blocks SDK
const result = verifySync(claim);
logToProofLogSync(result);
```

#### 2. **Flag Low-Confidence Claims**
```typescript
if (result.confidence < 80) {
  console.error(`⚠️ Low confidence: ${claim.statement} (${result.confidence}%)`);
  await flagForHumanReview(claim, result);
}
```

#### 3. **JSONL for Proof Logs**
```typescript
// ✅ Good: Append-only JSONL
await fs.appendFile('proof-log.jsonl', JSON.stringify(result) + '\n');

// ❌ Bad: Overwriting JSON
await fs.writeFile('proof-log.json', JSON.stringify(results));
```

---

## Part 2: Assessment Engine (Quality Auditing)

### Pattern Detection

**Categories**: 5 (security, api, ui, test, database)
**Keywords**: 71 total
**Tools**: 8 integrated

#### Pattern Keywords

| Category | Priority | Keywords (Sample) | Mandatory Assessments |
|----------|----------|-------------------|----------------------|
| **Security** | Critical | auth, login, jwt, password, token, crypto, session | semgrep (0 vulns), jest (90%+ coverage) |
| **API** | High | api, route, endpoint, controller, handler, rest | semgrep (0 critical), jest (80%+ coverage) |
| **UI** | High | component, jsx, tsx, react, vue, svelte, button, form | axe-core (90%+ WCAG), lighthouse (90+ perf) |
| **Test** | Medium | test, spec, .test., __tests__, jest, vitest | jest (80%+ coverage) |
| **Database** | Critical | migration, schema, database, sql, prisma, rls, policy | semgrep (0 SQL injection), jest (85%+ coverage) |

---

### Assessment Planning

**Phase 1**: Pattern detection + plan generation (COMPLETE)
**Phase 2**: Auto-execution (UPCOMING)
**Phase 3**: Merge blocking (FUTURE)

#### Pattern Matching

```typescript
// src/agents/verification/assessment-engine.ts
class AssessmentEngine {
  needsAssessment(claim: Claim): boolean {
    const context = claim.context?.toLowerCase() || '';

    // Security patterns
    const securityPatterns = ['auth', 'login', 'jwt', 'password', 'token'];
    if (securityPatterns.some(p => context.includes(p))) {
      return true;  // Security code ALWAYS needs assessment
    }

    // API patterns
    const apiPatterns = ['api', 'route', 'endpoint', 'controller'];
    if (apiPatterns.some(p => context.includes(p))) {
      return true;
    }

    // ... other patterns

    return false;
  }
}
```

---

### Assessment Tools

| Tool | Type | Threshold | When | Mandatory |
|------|------|-----------|------|-----------|
| **semgrep** | Security | 0 vulnerabilities | Security/API code | ✅ Yes |
| **jest** | Coverage | 80-90% | All code | ✅ Yes (varies) |
| **axe-core** | Accessibility | 90%+ WCAG 2.1 AA | UI components | ✅ Yes |
| **lighthouse** | Performance | 90+ score | UI components | ❌ Optional |
| **eslint** | Code quality | 0 warnings | Test code | ❌ Optional |
| **@redocly/cli** | API compliance | OpenAPI spec | API code | ❌ Optional |

---

### Assessment Plan Structure

```typescript
interface AssessmentPlan {
  claim: string;
  needsAssessment: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  assessments: Assessment[];
  estimatedDuration: string;
}

interface Assessment {
  type: 'Security' | 'TestCoverage' | 'Accessibility' | 'Performance' | 'CodeQuality' | 'APICompliance';
  tool: 'semgrep' | 'jest' | 'axe-core' | 'lighthouse' | 'eslint' | 'api-linter';
  command: string;  // Shell command to run
  threshold: number;  // 0-100
  mandatory: boolean;
  reason: string;
}
```

**Example Plan**:
```json
{
  "claim": "Created src/api/auth/login.ts",
  "needsAssessment": true,
  "priority": "critical",
  "reason": "Security-sensitive code detected",
  "assessments": [
    {
      "type": "Security",
      "tool": "semgrep",
      "command": "npx semgrep scan --config=auto --severity=ERROR",
      "threshold": 0,
      "mandatory": true,
      "reason": "Zero vulnerabilities required for auth code"
    },
    {
      "type": "TestCoverage",
      "tool": "jest",
      "command": "npm run test:coverage -- --collectCoverageFrom=\"**/auth/**/*.ts\"",
      "threshold": 90,
      "mandatory": true,
      "reason": "Security code requires 90%+ coverage"
    }
  ],
  "estimatedDuration": "45s"
}
```

---

### Configuration

**Location**: `.versatil/verification/assessment-config.json`

```json
{
  "assessmentRules": {
    "security": {
      "patterns": ["auth", "login", "jwt", "password", "token", "crypto", "session"],
      "assessments": [
        {
          "type": "Security",
          "tool": "semgrep",
          "command": "npx semgrep scan --config=auto",
          "threshold": 0,
          "mandatory": true,
          "reason": "Zero vulnerabilities required"
        },
        {
          "type": "TestCoverage",
          "tool": "jest",
          "command": "npm run test:coverage",
          "threshold": 90,
          "mandatory": true,
          "reason": "Security code requires 90%+ coverage (not 80%)"
        }
      ],
      "priority": "critical"
    }
  },
  "thresholds": {
    "testCoverage": 80,
    "securityVulnerabilities": 0,
    "performanceScore": 90,
    "accessibilityScore": 90
  }
}
```

---

### Best Practices

#### 1. **Security Code = 90%+ Coverage**
```typescript
// ✅ Good: Higher bar for security
if (this.matchesSecurityPattern(claim)) {
  return {
    type: 'TestCoverage',
    threshold: 90,  // Not 80%
    mandatory: true
  };
}
```

**Why**: Security code requires higher coverage than general code.

---

#### 2. **Log Plans Before Execution**
```typescript
// ✅ Good: Log plan before execution (audit trail)
const plan = assessmentEngine.planAssessment(claim);
await logAssessmentPlan(plan);
await executeAssessments(plan);  // Phase 2

// ❌ Bad: Execute without logging
await executeAssessments(plan);
```

**Why**: Audit trail shows what SHOULD have been assessed (even if execution fails).

---

#### 3. **Tool-Agnostic Design**
```json
{
  "type": "Security",
  "tool": "semgrep",  // ✅ Configurable
  "command": "npx semgrep scan --config=auto"
}
```

**Why**: Easy to swap tools (semgrep → snyk, jest → vitest, etc.).

---

#### 4. **Mandatory vs Optional**
```typescript
// ✅ Good: Clear distinction
{
  "type": "Security",
  "mandatory": true,  // Blocks merge if fails
}
{
  "type": "Performance",
  "mandatory": false  // Recommendation only
}
```

**Why**: Critical assessments (security, coverage) should block merges. Nice-to-have assessments (performance) should not.

---

## Combining Victor + Assessment

**Integration Point**: `.claude/hooks/post-agent-response.ts`

```typescript
// Step 1: Extract claims
const claims = extractClaims(toolOutput);

for (const claim of claims) {
  // Step 2: Verify claim (Victor)
  const verificationResult = await coveEngine.verify(claim);
  await logToProofLog(verificationResult);

  // Step 3: Check if assessment needed (Assessment Engine)
  if (assessmentEngine.needsAssessment(claim)) {
    const assessmentPlan = assessmentEngine.planAssessment(claim);
    await logAssessmentPlan(assessmentPlan);

    // Phase 2: Execute assessments
    // await executeAssessments(assessmentPlan);
  }
}
```

**Flow**:
```
Tool executes (Write, Edit, Bash, etc.)
  ↓
PostToolUse hook fires
  ↓
Extract claims from output
  ↓
Victor verifies each claim (CoVe 4-step)
  ↓
Log verification results (proof log)
  ↓
Check if assessment needed (pattern detection)
  ↓
Generate assessment plan
  ↓
Log assessment plan
  ↓
[Phase 2] Execute assessments
  ↓
[Phase 3] Block merge if mandatory assessments fail
```

---

## Success Metrics

### Victor-Verifier
- ✅ **Success Rate**: 95%
- ✅ **Hallucination Reduction**: 40% (research-backed)
- ✅ **Confidence Scoring**: 0-100%
- ✅ **Proof Logs**: JSONL format
- ✅ **Claim Categories**: 6 types

### Assessment Engine (Phase 1)
- ✅ **Pattern Detection**: 71 keywords, 5 categories
- ✅ **Tool Integrations**: 8 tools
- ✅ **Assessment Plans**: Logged to JSONL
- ⏳ **Phase 2**: Auto-execution (upcoming)
- ⏳ **Phase 3**: Merge blocking (future)

---

## Troubleshooting

### Victor: False Positives

**Symptom**: Claim flagged as hallucination but is actually correct.

**Causes**:
1. Verification method too strict
2. Timing issues (file not yet created)
3. Async operations not complete

**Solution**:
```typescript
// Add retry logic
if (!verified && confidence < 80) {
  await sleep(1000);  // Wait 1 second
  const retryResult = await verify(claim);
  // ...
}
```

---

### Assessment: Pattern Not Detected

**Symptom**: Security code not triggering assessment.

**Causes**:
1. Keyword not in configuration
2. Context not available in claim
3. Pattern matching case-sensitive

**Solution**:
```typescript
// Always lowercase for matching
const context = claim.context?.toLowerCase() || '';

// Add more keywords
const securityPatterns = [
  'auth', 'login', 'jwt', 'password', 'token',
  'oauth', 'session', 'credential', 'secret'  // ✅ Add more
];
```

---

## Related Patterns

- **Native SDK Integration**: PostToolUse hooks for Victor/Assessment
- **Session CODIFY**: Learn from verification failures
- **Marketplace Organization**: Documentation for verification system

---

## References

- **Chain-of-Verification**: Meta AI (arXiv:2309.11495)
- **VERSATIL v6.6.0**: Commits 421a055 (Victor) + 22c2ce2 (Assessment)
- **Templates**:
  - `src/templates/plan-templates/anti-hallucination-system.yaml`
  - `src/templates/plan-templates/assessment-engine.yaml`

---

**Last Updated**: 2025-10-22
**Version**: 6.6.0
**Victor Success Rate**: 95%
**Assessment Phase**: Phase 1 Complete (90%)
