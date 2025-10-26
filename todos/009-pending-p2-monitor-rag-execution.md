# Monitor RAG Execution - P2

## Status
- [ ] Pending
- **Priority**: P2 (High)
- **Created**: 2025-10-26
- **Assigned**: Oliver-MCP + Victor-Verifier
- **Estimated Effort**: Medium (ongoing monitoring)

## Description

Continuous monitoring of RAG auto-activation system to ensure patterns are correctly injected and Claude uses YOUR implementation details (not generic LLM knowledge).

## Acceptance Criteria

- [ ] Monitor hook execution logs for before-prompt.cjs
- [ ] Verify pattern detection accuracy (>80% keyword match rate)
- [ ] Validate Claude's answers reference YOUR metrics (commit hashes, effort hours, success rates)
- [ ] Track false positives (patterns activated when not needed)
- [ ] Track false negatives (patterns missed when needed)
- [ ] Alert on hook failures or empty pattern retrievals

## Context

- **Related Issue**: RAG audit completion
- **Related PR**: N/A
- **Files Involved**:
  - `.claude/hooks/dist/before-prompt.cjs` (execution monitoring)
  - `.versatil/learning/patterns/*.json` (pattern files)
  - `.versatil/logs/rag-activation.log` (to be created)
- **References**:
  - [docs/patterns/rag-activation.md](../docs/patterns/rag-activation.md)

## Dependencies

- **Depends on**: 008 - RAG Context Injection Fixed
- **Blocks**: None
- **Related to**: 011 - Verify RAG Claims

## Implementation Notes

### Monitoring Strategy

**Oliver-MCP** (MCP Ecosystem Orchestration):
1. Monitor `.claude/hooks/dist/before-prompt.cjs` execution
2. Log keyword matches and pattern retrievals
3. Alert on failures (file not found, JSON parse errors)
4. Track performance (<50ms context resolution target)

**Victor-Verifier** (Anti-Hallucination):
1. Verify Claude's answers use YOUR patterns (not generic knowledge)
2. Check for specific indicators:
   - ✅ Commit hashes mentioned (e.g., "8abdc04")
   - ✅ Effort hours cited (e.g., "28 hours")
   - ✅ File paths referenced (e.g., `.claude/hooks/post-file-edit.ts:42`)
   - ❌ Generic answers without specifics
3. Flag answers with <80% confidence (possible hallucination)

### Suggested Approach

1. **Phase 1: Real-time Hook Monitoring** (Oliver-MCP)
   - Watch `.claude/hooks/dist/before-prompt.cjs` execution
   - Log stderr output (terminal messages) to `.versatil/logs/rag-activation.log`
   - Count pattern activations per category (Native SDK, Victor, Assessment, CODIFY, Marketplace)

2. **Phase 2: Answer Quality Verification** (Victor-Verifier)
   - Sample Claude's answers to RAG-activated questions
   - Extract claims about implementation (e.g., "Your v6.6.0 used...")
   - Verify claims against pattern files (ground truth)
   - Generate confidence scores (0-100%)

3. **Phase 3: Performance Tracking**
   - Measure context resolution time (<50ms target)
   - Track pattern file read performance
   - Monitor JSON parsing overhead

### Potential Challenges

- **Challenge 1**: Hook execution is ephemeral, hard to monitor without process instrumentation
  - **Mitigation**: Add logging to before-prompt.ts, append to `.versatil/logs/rag-activation.log`

- **Challenge 2**: Victor needs ground truth to verify Claude's answers
  - **Mitigation**: Use pattern JSON files as ground truth, cross-reference claims

## Testing Requirements

- [ ] Unit tests: Test monitoring service independently
- [ ] Integration tests: Verify Oliver detects hook failures
- [ ] E2E tests: Full workflow - user question → RAG activation → answer verification
- [ ] Manual testing steps:
  1. Ask question with RAG keyword (e.g., "How do I implement hooks?")
  2. Check Oliver logs for pattern activation
  3. Verify Victor confirms answer uses YOUR v6.6.0 details
  4. Repeat with 5 different keywords across all 5 categories

## Documentation Updates

- [ ] Update README: Add monitoring section to docs/patterns/rag-activation.md
- [ ] Update API docs: N/A
- [ ] Update CHANGELOG.md: Will add in next release
- [ ] Add inline code comments: Document monitoring hooks

---

## Notes

**Monitoring Metrics**:
- Pattern activation rate: [to be tracked]
- Keyword match accuracy: Target >80%
- Answer verification confidence: Target >90%
- Context resolution time: Target <50ms

**Future Enhancements**:
- Dashboard for RAG activation statistics
- Weekly reports on most-used patterns
- Automatic pattern quality scoring based on usage
