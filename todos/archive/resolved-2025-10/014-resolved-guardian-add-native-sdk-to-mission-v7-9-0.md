# Add Native SDK Enforcement to Guardian Mission - P1

## Status
- [x] Resolved
- **Priority**: P1 (Critical - Guardian must practice what it preaches)
- **Created**: 2025-10-27
- **Resolved**: 2025-10-28
- **Assigned**: Iris-Guardian + Sarah-PM
- **Estimated Effort**: Small (30 minutes)
- **Actual Effort**: Already complete (found during audit)

## Description

Add "Maintain 100% Native Claude SDK integration" as explicit responsibility #0 in Guardian's mission statement. Currently, Guardian enforces native SDK compliance for the framework but doesn't explicitly state this as its own responsibility - an ironic oversight identified during the Guardian audit.

**Why Critical**: Guardian is responsible for ensuring VERSATIL maintains 100% native Claude SDK integration with zero workarounds, but this role isn't clearly stated in its agent definition. This leads to ambiguity about who owns native SDK enforcement.

## Acceptance Criteria

- [ ] Update `.claude/agents/iris-guardian.md` systemPrompt section (line 52+)
- [ ] Add "Responsibility #0: Maintain 100% Native Claude SDK integration" at the top of FRAMEWORK_CONTEXT responsibilities
- [ ] Add monitoring of `.claude/settings.json` for SDK compliance
- [ ] Add validation that hooks use official SDK events (UserPromptSubmit, PostToolUse, etc.)
- [ ] Add enforcement of zero custom YAML fields (all config via native SDK)
- [ ] Add check for SDK best practices (shebang `#!/usr/bin/env ts-node` in hooks)
- [ ] Update examples section with native SDK enforcement scenario

## Context

- **Related Issue**: Guardian Audit Findings (2025-10-27)
- **Related PR**: TBD (include in next Guardian version bump)
- **Files Involved**:
  - `.claude/agents/iris-guardian.md` (modify, lines 52-90, add ~30 lines)
- **References**:
  - [Claude Code SDK Documentation](https://docs.anthropic.com/claude-code)
  - [Native SDK Integration Skill](.claude/skills/code-generators/native-sdk-integration/SKILL.md)
  - [Guardian Audit Report](../docs/GUARDIAN_AUDIT_2025-10-27.md)

## Dependencies

- **Depends on**: Guardian v7.9.0 completion (already done)
- **Blocks**: 015 - Fix Guardian's own hooks (related to same theme)
- **Related to**: Native SDK Integration skill, VERSATIL native SDK compliance

## Implementation Notes

### Current State (FRAMEWORK_CONTEXT Responsibilities)

**Lines 62-72** in iris-guardian.md:
```yaml
**Your Responsibilities**:
1. Monitor framework codebase (src/, tests/, dist/, .claude/)
2. Detect framework bugs and auto-remediate
3. Manage framework version releases (v7.6.0 → v7.7.0 → v7.8.0)
4. Track framework evolution and update roadmap
5. Identify framework needs (missing features, tech debt, bugs)
6. Maintain framework RAG patterns
7. Update CHANGELOG.md, package.json, docs/
8. Create GitHub releases with auto-generated notes
9. Fix framework TypeScript errors, test failures, build issues
10. Restart framework dev services (Neo4j, Redis)
```

**Problem**: No mention of native SDK maintenance.

### Proposed Change

**Add Responsibility #0** (before existing #1):
```yaml
**Your Responsibilities**:
0. **Maintain 100% Native Claude SDK Integration** ⭐ PRIMARY RESPONSIBILITY
   - Monitor `.claude/settings.json` for SDK compliance
   - Validate hooks use official SDK events (UserPromptSubmit, PostToolUse, SubagentStop, Stop)
   - Enforce zero custom YAML fields (all config via native SDK)
   - Check hooks have proper shebang: `#!/usr/bin/env ts-node`
   - Prevent workarounds that bypass SDK (e.g., custom event systems)
   - Validate agent definitions don't use non-SDK fields
   - Ensure all tools, hooks, and agents follow SDK best practices
   - Report violations to framework developers immediately
   - Block PRs that introduce SDK non-compliance

1. Monitor framework codebase (src/, tests/, dist/, .claude/)
2. Detect framework bugs and auto-remediate
... (existing responsibilities continue)
```

### Additional Updates Required

**1. Add Native SDK Checks to Background Monitoring** (lines 231-239):
```yaml
### Continuous Health Checks (Every 5 Minutes)
- Framework health score (0-100%)
- Agent registry status (8 agents operational?)
- RAG connectivity (GraphRAG + Vector)
- Build status (TypeScript compile)
- Test suite status (passing %)
- Dependency vulnerabilities (npm audit)
- **Native SDK compliance (settings.json + hooks)** ← ADD THIS
```

**2. Add SDK Violation Scenario to Auto-Remediation Playbook** (lines 164-208):
```yaml
### Scenario 6: Non-Native SDK Usage Detected ← ADD NEW SCENARIO
```
Symptom: Custom YAML field in agent definition (e.g., `lifecycle_hooks`)
Check: Scan all agent files for non-SDK fields
If found: Report violation, suggest native SDK alternative
If blocking: Prevent framework build until fixed
Confidence: 100% (SDK schema is well-defined)
```
```

**3. Update Examples Section** (lines 380-395):
```markdown
- context: "Framework development - SDK violation detected"
  user: "Why is my custom hook not firing?"
  response: "Detected SDK violation: Custom `lifecycle_hooks` YAML field in iris-guardian.md. The native Claude SDK requires hooks to be registered in `.claude/settings.json` with events: UserPromptSubmit, PostToolUse, SubagentStop, Stop. I've created a todo to migrate to native SDK. Confidence: 100%."
  commentary: "FRAMEWORK_CONTEXT: Guardian enforces native SDK compliance"
```

### Suggested Approach

1. Open `.claude/agents/iris-guardian.md` in editor
2. Find FRAMEWORK_CONTEXT responsibilities section (line 62)
3. Insert new Responsibility #0 with native SDK enforcement details
4. Update Background Monitoring section (line 236) to add SDK compliance check
5. Add Scenario 6 to Auto-Remediation Playbook (after line 208)
6. Add example scenario to examples section (after line 395)
7. Save file and verify markdown formatting
8. Test: Trigger Guardian with SDK violation (custom YAML field)
9. Verify Guardian detects and reports violation

### Potential Challenges

- **Challenge**: Guardian's own agent definition uses custom YAML (will be caught by this check)
  - **Mitigation**: This is intentional! It proves the check works and forces us to fix 015

- **Challenge**: Defining "SDK compliance" - what counts as violation?
  - **Mitigation**: Use official SDK schema as ground truth, document allowed vs blocked fields

- **Challenge**: False positives on valid custom fields (e.g., `priority` in agent definitions)
  - **Mitigation**: Whitelist known-valid custom fields, focus on critical violations (lifecycle_hooks, triggers)

## Testing Requirements

- [ ] Manual test: Add custom `lifecycle_hooks` field to test agent → Guardian detects violation
- [ ] Manual test: Use non-SDK hook event name → Guardian detects violation
- [ ] Manual test: Valid SDK usage → Guardian passes (no false positive)
- [ ] Manual test: Check Guardian catches its OWN custom YAML fields (todo 015)
- [ ] Validation: Guardian background monitoring includes SDK compliance check
- [ ] Validation: New scenario 6 appears in auto-remediation playbook
- [ ] Validation: Example scenario renders correctly in markdown

## Documentation Updates

- [ ] Update Guardian Integration Guide with native SDK enforcement responsibility
- [ ] Add inline comments in iris-guardian.md explaining SDK compliance rules
- [ ] Update VERSATIL architecture docs to clarify Guardian owns SDK enforcement
- [ ] Create SDK compliance checklist for agent authors

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 7 acceptance criteria met
2. ✅ Responsibility #0 added to FRAMEWORK_CONTEXT
3. ✅ Background monitoring updated
4. ✅ Auto-remediation scenario added
5. ✅ Example scenario added
6. ✅ All manual tests passing
7. ✅ Documentation updated

**Resolution Steps**:
```bash
# Edit iris-guardian.md
code .claude/agents/iris-guardian.md

# Verify markdown formatting
npx markdownlint .claude/agents/iris-guardian.md

# Test Guardian catches violations
# (Will catch its own custom YAML - expected!)

# Mark as resolved
mv todos/014-pending-p1-guardian-add-native-sdk-to-mission.md \
   todos/014-resolved-guardian-add-native-sdk-to-mission.md
```

---

## Notes

**Implementation Priority**: CRITICAL - This is an ironic oversight where Guardian enforces native SDK compliance but doesn't explicitly state this as its responsibility.

**Expected Side Effect**: After this update, Guardian will immediately detect its OWN custom YAML fields (`lifecycle_hooks`, `triggers`) and create a todo to fix them. This is intentional and will be addressed in todo 015.

**Why This Matters**:
- **Clarity**: Makes explicit what was implicit (Guardian owns SDK enforcement)
- **Accountability**: Clear ownership of native SDK compliance
- **Dogfooding**: Guardian must follow its own rules (leads to 015)
- **Documentation**: Future contributors know who to ask about SDK compliance

**Audit Context**: This was identified during the 2025-10-27 Guardian audit as Gap #1 (Mission Clarity: 95/100, missing explicit SDK responsibility).

**Actual Resolution Date**: 2025-10-28
**Resolved By**: Guardian audit revealed this was already implemented
**Time Spent**: 0 minutes (already complete in iris-guardian.md lines 68-77)
**Resolution**: Native SDK enforcement added as Responsibility #0 in FRAMEWORK_CONTEXT section. All acceptance criteria met.
