# Add Missing Tools to Guardian - P3

## Status
- [ ] Pending
- **Priority**: P3 (Medium - Nice-to-have)
- **Created**: 2025-10-27
- **Assigned**: Iris-Guardian + Sarah-PM
- **Estimated Effort**: Small (30 minutes)

## Description

Add two missing tools to Guardian's tool list: `WebFetch` and `Bash(gh:*)`. These tools enable Guardian to check official Claude SDK documentation and automate GitHub release creation, completing its version management capabilities.

**Missing Tools**:
1. **WebFetch** - Fetch and analyze web content (SDK docs, marketplace listings)
2. **Bash(gh:*)** - GitHub CLI commands for release automation

## Acceptance Criteria

- [ ] Add `WebFetch` to Guardian's tools list in iris-guardian.md (line 6)
- [ ] Add `Bash(gh:*)` to Guardian's tools list (after Bash(git:*))
- [ ] Add usage examples for WebFetch in systemPrompt (checking SDK docs)
- [ ] Add usage examples for Bash(gh:*) in systemPrompt (release automation)
- [ ] Test Guardian can access both tools when activated
- [ ] Update Guardian Integration Guide with tool usage patterns

## Context

- **Related Issue**: Guardian Audit Findings (2025-10-27) - Gap #2 (Context Access 90/100)
- **Related PR**: TBD (include in next Guardian version bump)
- **Files Involved**:
  - `.claude/agents/iris-guardian.md` (modify, add 2 tools to list)
  - `docs/GUARDIAN_INTEGRATION.md` (modify, add tool usage examples)
- **References**:
  - [WebFetch Tool Documentation](https://docs.anthropic.com/claude-code/tools/webfetch)
  - [GitHub CLI Documentation](https://cli.github.com/manual/)
  - [Existing tool usage in VERSATIL](../.claude/agents/)

## Dependencies

- **Depends on**: 016 - Add missing skills (version-management skill needs gh:* tool)
- **Blocks**: None (minor enhancement)
- **Related to**: Version management skill, release automation

## Implementation Notes

### 1. Add WebFetch Tool

**Current** (lines 6-19 in iris-guardian.md):
```yaml
tools:
  - "Read"
  - "Write"
  - "Edit"
  - "Grep"
  - "Glob"
  - "Bash(npm:*)"
  - "Bash(npx:*)"
  - "Bash(node:*)"
  - "Bash(git:*)"
  - "Bash(docker:*)"
  - "Bash(systemctl:*)"
  - "Task"
  - "SlashCommand"
```

**Add WebFetch**:
```yaml
tools:
  - "Read"
  - "Write"
  - "Edit"
  - "Grep"
  - "Glob"
  - "WebFetch"              # NEW
  - "Bash(npm:*)"
  - "Bash(npx:*)"
  - "Bash(node:*)"
  - "Bash(git:*)"
  - "Bash(gh:*)"            # NEW
  - "Bash(docker:*)"
  - "Bash(systemctl:*)"
  - "Task"
  - "SlashCommand"
```

### 2. Add Usage Examples for WebFetch

**Add to systemPrompt** (after line 350, before examples section):

```markdown
### WebFetch Tool Usage

**Purpose**: Check official Claude SDK documentation and marketplace listings for SDK compliance validation.

**Common Patterns**:

```typescript
// Check SDK documentation for hook events
await WebFetch({
  url: 'https://docs.anthropic.com/claude-code/hooks',
  prompt: 'List all official SDK hook events (UserPromptSubmit, PostToolUse, etc.)'
});

// Check marketplace for MCP servers
await WebFetch({
  url: 'https://marketplace.anthropic.com/mcp',
  prompt: 'Find MCP servers related to GraphRAG or Neo4j'
});

// Verify SDK best practices
await WebFetch({
  url: 'https://docs.anthropic.com/claude-code/best-practices',
  prompt: 'What are the SDK recommendations for hook shebang lines?'
});
```

**Use Cases**:
- Validate hook event names against official SDK docs
- Check marketplace for new MCP servers to integrate
- Verify SDK best practices during code review
- Research SDK updates and breaking changes
```

### 3. Add Usage Examples for Bash(gh:*)

**Add to systemPrompt** (after WebFetch section):

```markdown
### Bash(gh:*) Tool Usage

**Purpose**: GitHub CLI commands for release automation and repository management.

**Common Patterns**:

```bash
# List recent releases
gh release list --limit 5

# Create new release with auto-generated notes
gh release create v7.7.0 \
  --title "v7.7.0 - Guardian Enhancements" \
  --generate-notes

# View release notes for version
gh release view v7.6.0

# Check workflow status
gh run list --limit 5

# View open issues
gh issue list --state open --label "guardian"

# Create issue for detected problem
gh issue create \
  --title "GraphRAG latency spike detected" \
  --body "Guardian detected 5s latency (threshold: 500ms)" \
  --label "critical,rag"
```

**Use Cases**:
- Automate version releases (version-management skill)
- Check CI/CD workflow status during health checks
- Create GitHub issues for detected problems
- View release history for version bump recommendations
- Monitor open issues related to Guardian responsibilities
```

### 4. Update Guardian Integration Guide

**File**: `docs/GUARDIAN_INTEGRATION.md`

**Add section** (after existing tool documentation):

```markdown
## Tool Usage Patterns

### WebFetch for SDK Compliance

Guardian uses WebFetch to validate SDK compliance by checking official documentation:

```typescript
// Example: Validate hook event name
const sdkDocs = await WebFetch({
  url: 'https://docs.anthropic.com/claude-code/hooks',
  prompt: 'Is "beforePrompt" a valid SDK hook event?'
});

if (!sdkDocs.includes('beforePrompt')) {
  console.error('❌ Invalid hook event: "beforePrompt" not in SDK');
  console.error('✅ Valid events: UserPromptSubmit, PostToolUse, SubagentStop, Stop');
}
```

**Frequency**: On-demand (during SDK compliance checks)

### Bash(gh:*) for Release Automation

Guardian uses GitHub CLI for automated release creation:

```bash
# 1. Check current version
current=$(jq -r .version package.json)

# 2. Recommend version bump
next=$(guardian-recommend-version)  # MINOR, MAJOR, or PATCH

# 3. Create release
gh release create "v${next}" \
  --title "v${next} - $(date +%Y-%m-%d)" \
  --generate-notes

# 4. Update roadmap
# (manual step - Guardian suggests updates)
```

**Frequency**: On-demand (when user asks "should we release?")
```

### Suggested Approach

1. Open `.claude/agents/iris-guardian.md`
2. Add `WebFetch` tool to tools list (after Glob, before Bash commands)
3. Add `Bash(gh:*)` tool to tools list (after Bash(git:*))
4. Add WebFetch usage examples to systemPrompt (after line 350)
5. Add Bash(gh:*) usage examples to systemPrompt (after WebFetch section)
6. Open `docs/GUARDIAN_INTEGRATION.md`
7. Add "Tool Usage Patterns" section with examples
8. Test Guardian activation → verify tools appear in context
9. Test WebFetch call to SDK docs (verify works)
10. Test Bash(gh release list) command (verify works)

### Potential Challenges

- **Challenge**: WebFetch may be rate-limited by Anthropic
  - **Mitigation**: Cache SDK docs locally, only fetch when needed

- **Challenge**: Bash(gh:*) requires GitHub CLI installed
  - **Mitigation**: Check if `gh` command exists, provide installation instructions if missing

- **Challenge**: GitHub CLI may require authentication
  - **Mitigation**: Document `gh auth login` setup in Guardian Integration Guide

## Testing Requirements

- [ ] Manual test: Activate Guardian → verify WebFetch and Bash(gh:*) in tool list
- [ ] Manual test: Use WebFetch to fetch SDK docs → verify response
- [ ] Manual test: Run `gh release list` via Guardian → verify output
- [ ] Manual test: Check if gh CLI installed → provide helpful error if not
- [ ] Validation: Tool usage examples render correctly in markdown
- [ ] Validation: Guardian Integration Guide updated

## Documentation Updates

- [ ] Add tool usage examples to iris-guardian.md systemPrompt
- [ ] Update Guardian Integration Guide with tool patterns
- [ ] Add troubleshooting section for gh CLI setup
- [ ] Document WebFetch rate limiting and caching strategies

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 6 acceptance criteria met
2. ✅ Two tools added to Guardian's list
3. ✅ Usage examples added to systemPrompt
4. ✅ Guardian Integration Guide updated
5. ✅ All manual tests passing
6. ✅ Documentation updated

**Resolution Steps**:
```bash
# Edit iris-guardian.md (add tools)
code .claude/agents/iris-guardian.md

# Edit Guardian Integration Guide
code docs/GUARDIAN_INTEGRATION.md

# Test WebFetch
# (Activate Guardian and try fetching SDK docs)

# Test gh CLI
gh release list --limit 5

# Mark as resolved
mv todos/017-pending-p3-guardian-add-missing-tools.md \
   todos/017-resolved-guardian-add-missing-tools.md
```

---

## Notes

**Implementation Priority**: MEDIUM - Nice-to-have enhancements that complete Guardian's tool set. Not blocking any critical functionality.

**Why This Matters**:
- **SDK Compliance**: WebFetch enables Guardian to validate against official SDK docs (ground truth)
- **Automation**: Bash(gh:*) completes release automation workflow (version-management skill)
- **Completeness**: Addresses Gap #2 from Guardian audit (Context Access 90/100 → expected 95/100)

**Tool Usage Frequency**:
- **WebFetch**: Low (on-demand, during SDK compliance checks)
- **Bash(gh:*)**: Medium (weekly for release automation, daily for issue tracking)

**GitHub CLI Setup**:
```bash
# Install gh CLI (macOS)
brew install gh

# Authenticate
gh auth login

# Verify
gh release list --limit 5
```

**WebFetch Rate Limiting**:
- Anthropic may rate-limit WebFetch (unknown limits)
- **Mitigation**: Cache SDK docs locally in `.versatil/cache/sdk-docs/`
- **Fallback**: Use local markdown copies of SDK docs

**Audit Context**: This was identified during the 2025-10-27 Guardian audit as Gap #2 (Context Access 90/100) - missing tools for SDK validation and release automation.

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD (estimated 30 minutes)
