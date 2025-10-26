# Verify RAG Claims with Victor-Verifier - P2

## Status
- [ ] Pending
- **Priority**: P2 (High - anti-hallucination)
- **Created**: 2025-10-26
- **Assigned**: Victor-Verifier
- **Estimated Effort**: Medium (2 hours)

## Description

Use Victor-Verifier's Chain-of-Verification (CoVe) system to verify all claims made about RAG working vs theoretical. Ensures we don't hallucinate about RAG value proposition - verify ACTUAL functionality against ground truth.

## Acceptance Criteria

- [ ] Extract claims from audit and implementation (e.g., "RAG auto-activation works", "Patterns injected to Claude")
- [ ] Verify each claim against ground truth (filesystem, hook execution, test results)
- [ ] Generate confidence scores (0-100%) for each claim
- [ ] Flag claims with <80% confidence for human review
- [ ] Create proof log in `.versatil/verification/rag-audit-proof-log.jsonl`

## Context

- **Related Issue**: RAG audit completion - verify honest assessment
- **Related PR**: N/A
- **Files Involved**:
  - `src/agents/verification/chain-of-verification.ts` (CoVe engine)
  - `.versatil/verification/rag-audit-proof-log.jsonl` (proof logs - to be created)
  - `.claude/hooks/dist/before-prompt.cjs` (ground truth for hook implementation)
  - `.versatil/learning/patterns/*.json` (ground truth for patterns)
- **References**:
  - Research: arXiv:2309.11495 (CoVe paper - Meta AI)
  - Pattern: `victor-verifier-anti-hallucination.json`

## Dependencies

- **Depends on**: 010 - Test RAG with Real Questions (needs test results)
- **Blocks**: None
- **Related to**: 009 - Monitor RAG Execution

## Implementation Notes

### Claims to Verify

**Claim 1: "RAG auto-activation works"**
- **Statement**: "Before-prompt hook detects keywords and loads patterns"
- **Category**: CommandExecution
- **Evidence**: Test output from 008 showing pattern activation
- **Verification Method**:
  1. Plan: Execute before-prompt.cjs with test input
  2. Answer: Check if patterns are loaded
  3. Cross-check: Verify JSON output to stdout
  4. Finalize: Confidence score based on test pass rate
- **Expected Confidence**: 100% (verified via tests)

**Claim 2: "Patterns injected to Claude's context"**
- **Statement**: "Hook outputs JSON to stdout for Claude to receive"
- **Category**: DataAssertion
- **Evidence**: Test output showing `{"role":"system","content":"..."}`
- **Verification Method**:
  1. Plan: Check before-prompt.cjs source for `console.log(JSON.stringify(...))`
  2. Answer: Verify JSON structure matches Claude context spec
  3. Cross-check: Test execution shows JSON on stdout (not just stderr)
  4. Finalize: Confidence 100% if JSON output confirmed
- **Expected Confidence**: 100% (verified via code + tests)

**Claim 3: "RAG makes answers 40% faster/better"**
- **Statement**: "Compounding engineering achieves 40% faster by Feature 2"
- **Category**: Metric
- **Evidence**: Claim from session-codify-compounding.json pattern
- **Verification Method**:
  1. Plan: Need historical data for Feature 1 vs Feature 2 effort
  2. Answer: Check if we have 2+ features built with RAG to compare
  3. Cross-check: Calculate actual % improvement
  4. Finalize: Confidence <50% (not enough data yet - only 1 session with RAG)
- **Expected Confidence**: 30% (theoretical claim, not yet proven)

**Claim 4: "5 patterns stored with high success rates"**
- **Statement**: "Native SDK (98%), Victor (95%), Assessment (90%), CODIFY (95%), Marketplace (85%)"
- **Category**: FileCreation
- **Evidence**: Pattern JSON files in `.versatil/learning/patterns/`
- **Verification Method**:
  1. Plan: Read all 5 pattern files
  2. Answer: Extract `metrics.successRate` from each
  3. Cross-check: Verify rates match claimed percentages
  4. Finalize: Confidence 100% if files exist and rates match
- **Expected Confidence**: 100% (verifiable via filesystem)

**Claim 5: "Keyword detection has 80% accuracy"**
- **Statement**: "Test results: 80% pass rate (4/5 tests passed)"
- **Category**: DataAssertion
- **Evidence**: Test execution output from test-rag-activation.cjs
- **Verification Method**:
  1. Plan: Re-run test suite
  2. Answer: Count passed vs failed tests
  3. Cross-check: Verify 4/5 = 80%
  4. Finalize: Confidence 100% if test results reproducible
- **Expected Confidence**: 100% (verifiable via test execution)

### Suggested Approach

1. **Phase 1: Claim Extraction** (30 min)
   - Parse audit markdown and implementation files
   - Extract all statements about RAG functionality
   - Categorize claims (FileCreation, CommandExecution, DataAssertion, Metric)

2. **Phase 2: 4-Step CoVe Verification** (60 min)
   - For each claim:
     - Plan: Define verification method
     - Answer: Execute verification (file read, command execution, test run)
     - Cross-check: Compare result against multiple sources
     - Finalize: Calculate confidence score (0-100%)

3. **Phase 3: Proof Logging** (30 min)
   - Write results to `.versatil/verification/rag-audit-proof-log.jsonl`
   - Flag claims with <80% confidence
   - Generate summary report

### Potential Challenges

- **Challenge 1**: Some claims are theoretical (e.g., "40% faster") and can't be verified without historical data
  - **Mitigation**: Mark as "UNVERIFIABLE - NEEDS DATA" with low confidence (30%)

- **Challenge 2**: CoVe requires ground truth - what if ground truth is missing?
  - **Mitigation**: Acknowledge limitation, recommend building ground truth dataset

## Testing Requirements

- [ ] Unit tests: Test CoVe engine independently
- [ ] Integration tests: Verify proof log format (JSONL)
- [ ] Manual testing steps:
  1. Run CoVe verification on all 5 claims
  2. Check proof log created at `.versatil/verification/rag-audit-proof-log.jsonl`
  3. Verify flagged claims (confidence <80%) are identified
  4. Review summary report for honesty

## Documentation Updates

- [ ] Create `.versatil/verification/rag-audit-proof-log.jsonl` (JSONL format)
- [ ] Update `docs/patterns/verification-and-assessment.md` with RAG audit example
- [ ] Update CHANGELOG.md: Add RAG audit verification milestone
- [ ] Add inline code comments: Document CoVe usage for RAG claims

---

## Expected Proof Log Format

```jsonl
{"claim":"RAG auto-activation works","category":"CommandExecution","confidence":100,"evidence":{"test_output":"🧠 [RAG] Auto-activated 1 pattern(s)..."},"verification_method":"4-step CoVe","timestamp":"2025-10-26T10:00:00Z"}
{"claim":"Patterns injected to Claude's context","category":"DataAssertion","confidence":100,"evidence":{"stdout_json":"{\"role\":\"system\",\"content\":\"...\"}"},"verification_method":"4-step CoVe","timestamp":"2025-10-26T10:01:00Z"}
{"claim":"RAG makes answers 40% faster","category":"Metric","confidence":30,"evidence":{"historical_data":"MISSING"},"verification_method":"4-step CoVe","flagged":true,"reason":"Insufficient data - need Feature 2 completion","timestamp":"2025-10-26T10:02:00Z"}
{"claim":"5 patterns stored with high success rates","category":"FileCreation","confidence":100,"evidence":{"files_found":5,"rates_verified":true},"verification_method":"4-step CoVe","timestamp":"2025-10-26T10:03:00Z"}
{"claim":"Keyword detection has 80% accuracy","category":"DataAssertion","confidence":100,"evidence":{"test_results":"4/5 passed"},"verification_method":"4-step CoVe","timestamp":"2025-10-26T10:04:00Z"}
```

---

## Notes

**Purpose**: Anti-hallucination - verify we're not claiming RAG works when it's theoretical. Victor-Verifier ensures honesty by verifying claims against ground truth.

**Key Insight from Audit**: The audit discovered that RAG patterns existed but weren't being injected (stdout vs stderr issue). Victor must verify this fix actually works, not just assume it does.

**Success Criteria**:
- 5/5 claims verified (or flagged as unverifiable)
- >80% average confidence across verifiable claims
- Flagged claims documented with mitigation recommendations
