# Test RAG with Real User Questions - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical - validation)
- **Created**: 2025-10-26
- **Assigned**: Maria-QA
- **Estimated Effort**: Small (1 hour)

## Description

Validate RAG auto-activation works end-to-end by asking real user questions and verifying Claude's answers use YOUR v6.6.0 implementation patterns (not generic LLM knowledge).

## Acceptance Criteria

- [ ] Test 5 real questions (1 per pattern category: Native SDK, Victor, Assessment, CODIFY, Marketplace)
- [ ] Verify terminal shows `🧠 [RAG] Auto-activated...` for each
- [ ] Validate answers include YOUR metrics (commit hashes, effort hours, file paths)
- [ ] Measure answer quality: >90% should reference YOUR patterns
- [ ] Document test results in `.versatil/learning/rag-validation-report.md`

## Context

- **Related Issue**: RAG audit completion
- **Related PR**: N/A
- **Files Involved**:
  - `.versatil/learning/patterns/*.json` (5 pattern files)
  - `.claude/hooks/dist/before-prompt.cjs` (hook execution)
  - `.versatil/learning/rag-validation-report.md` (test results - to be created)
- **References**:
  - [docs/patterns/rag-activation.md](../docs/patterns/rag-activation.md)

## Dependencies

- **Depends on**: 008 - RAG Context Injection Fixed
- **Blocks**: 011 - Verify RAG Claims (Victor-Verifier)
- **Related to**: 009 - Monitor RAG Execution

## Implementation Notes

### Test Questions (5 Categories)

**Category 1: Native SDK Integration**
- Question: "How do I implement hooks in my Claude Code project?"
- Expected pattern: `native-sdk-integration-v6.6.0.json`
- Expected details: `.claude/settings.json`, `#!/usr/bin/env ts-node`, commit `8abdc04`

**Category 2: Victor-Verifier**
- Question: "How can I prevent hallucinations in my agent responses?"
- Expected pattern: `victor-verifier-anti-hallucination.json`
- Expected details: Chain-of-Verification (CoVe), 4-step process, commit `421a055`, 95% success rate

**Category 3: Assessment Engine**
- Question: "What are the test coverage requirements for security code?"
- Expected pattern: `assessment-engine-v6.6.0.json`
- Expected details: 90%+ coverage (not 80%), semgrep, mandatory assessments, commit `22c2ce2`

**Category 4: Session CODIFY**
- Question: "How does automatic learning capture work at session end?"
- Expected pattern: `session-codify-compounding.json`
- Expected details: Stop hook, CLAUDE.md updates, 40% faster by Feature 2

**Category 5: Marketplace Organization**
- Question: "How was the repository cleaned up for marketplace submission?"
- Expected pattern: `marketplace-repository-organization.json`
- Expected details: Net -20,187 LOC, archive/ directory, plugin metadata

### Suggested Approach

1. **Ask each question in a NEW conversation** (to test UserPromptSubmit hook)
2. **Check terminal output** for `🧠 [RAG] Auto-activated...`
3. **Analyze Claude's answer** for YOUR implementation details:
   - ✅ Specific commit hashes (e.g., "8abdc04")
   - ✅ Effort hours (e.g., "28 hours")
   - ✅ File paths (e.g., `.claude/hooks/post-file-edit.ts:42`)
   - ✅ Success rates (e.g., "98% success")
   - ❌ Generic answers without specifics
4. **Score each answer**:
   - 100%: Uses YOUR patterns exclusively
   - 75%: Mix of YOUR patterns + generic knowledge
   - 50%: Mostly generic, minimal YOUR patterns
   - 0%: Purely generic LLM knowledge
5. **Document results** in validation report

### Potential Challenges

- **Challenge 1**: UserPromptSubmit hook may not fire in all conversation contexts
  - **Mitigation**: Test in fresh conversations, verify settings.json hook configuration

- **Challenge 2**: Claude may blend YOUR patterns with generic LLM knowledge
  - **Mitigation**: Use Victor-Verifier to score answer specificity (>90% target)

## Testing Requirements

- [ ] Manual testing steps:
  1. Start new conversation
  2. Ask Category 1 question: "How do I implement hooks?"
  3. Verify terminal shows: `🧠 [RAG] Auto-activated 1 pattern(s): Native SDK...`
  4. Check answer includes: commit 8abdc04, `.claude/settings.json`, `#!/usr/bin/env ts-node`
  5. Score answer quality (0-100%)
  6. Repeat for Categories 2-5
  7. Calculate average score (target: >90%)

## Documentation Updates

- [ ] Create `.versatil/learning/rag-validation-report.md` with test results
- [ ] Update `docs/patterns/rag-activation.md` with validation summary
- [ ] Update CHANGELOG.md: Add RAG validation milestone
- [ ] Add inline code comments: N/A

---

## Test Results Template

```markdown
# RAG Validation Report

**Date**: 2025-10-26
**Tester**: Maria-QA
**Status**: [PASS/FAIL]

## Category 1: Native SDK Integration
- **Question**: "How do I implement hooks?"
- **Pattern Activated**: ✅/❌ native-sdk-integration-v6.6.0.json
- **Terminal Output**: ✅/❌ `🧠 [RAG] Auto-activated...`
- **Answer Quality**: [0-100%]
- **Specific Details Found**:
  - [ ] Commit hash: 8abdc04
  - [ ] File path: .claude/settings.json
  - [ ] Shebang: #!/usr/bin/env ts-node
  - [ ] Success rate: 98%

## Category 2: Victor-Verifier
[Repeat template]

## Category 3: Assessment Engine
[Repeat template]

## Category 4: Session CODIFY
[Repeat template]

## Category 5: Marketplace Organization
[Repeat template]

---

## Summary
- **Tests Passed**: X/5
- **Average Answer Quality**: X%
- **Overall Status**: PASS/FAIL (target: 90%+ quality, 5/5 passed)
- **Recommendation**: [Proceed to production / Fix issues first]
```

---

## Notes

**Success Criteria**:
- 5/5 patterns activated correctly
- >90% average answer quality
- All answers include YOUR specific implementation details

**If tests fail**:
- Check `.claude/settings.json` hook configuration
- Verify pattern JSON files are valid and complete
- Test before-prompt.cjs manually with echo commands
- Review keyword mappings in KEYWORD_MAP
