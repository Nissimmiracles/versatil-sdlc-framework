# Fix Guardian's Own Non-Native Hook Definition - P2

## Status
- [ ] Pending
- **Priority**: P2 (High - Dogfooding / lead by example)
- **Created**: 2025-10-27
- **Assigned**: Iris-Guardian + Sarah-PM
- **Estimated Effort**: Medium (1.5 hours)

## Description

Remove custom `lifecycle_hooks` and `triggers` YAML fields from Guardian's own agent definition (`.claude/agents/iris-guardian.md`) and replace with proper native Claude SDK configuration in `.claude/settings.json`. This fixes an ironic situation where Guardian enforces native SDK compliance but doesn't follow it itself.

**The Irony**: Guardian's agent definition (lines 371-378) uses custom YAML fields that violate the very native SDK standards Guardian is supposed to enforce. This is a textbook example of "do as I say, not as I do" - which undermines Guardian's credibility.

## Acceptance Criteria

- [ ] Remove `triggers:` YAML block (lines 354-378) from `iris-guardian.md`
- [ ] Remove `lifecycle_hooks:` references if any exist
- [ ] Create `.claude/hooks/guardian-before-prompt.ts` for UserPromptSubmit event
- [ ] Create `.claude/hooks/guardian-post-action.ts` for PostToolUse event
- [ ] Create `.claude/hooks/guardian-on-error.ts` for error handling
- [ ] Create `.claude/hooks/guardian-on-stop.ts` for Stop event
- [ ] Update `.claude/settings.json` to register Guardian hooks with native SDK events
- [ ] Add proper shebang to all hooks: `#!/usr/bin/env ts-node`
- [ ] Test Guardian activation after migration (ensure still works)

## Context

- **Related Issue**: Guardian Audit Findings (2025-10-27) - Gap #3 (Skills Alignment 85/100)
- **Related PR**: TBD (include in next Guardian version bump)
- **Files Involved**:
  - `.claude/agents/iris-guardian.md` (modify, remove lines 354-378)
  - `.claude/hooks/guardian-before-prompt.ts` (new, ~150 lines)
  - `.claude/hooks/guardian-post-action.ts` (new, ~100 lines)
  - `.claude/hooks/guardian-on-error.ts` (new, ~80 lines)
  - `.claude/hooks/guardian-on-stop.ts` (new, ~60 lines)
  - `.claude/settings.json` (modify, add Guardian hook registrations)
- **References**:
  - [Claude Code Native SDK](https://docs.anthropic.com/claude-code)
  - [Native SDK Integration Skill](.claude/skills/code-generators/native-sdk-integration/SKILL.md)
  - [Existing hooks](.claude/hooks/before-prompt.ts, post-file-edit.ts, session-codify.ts)

## Dependencies

- **Depends on**: 014 - Add native SDK to Guardian mission (establishes responsibility)
- **Blocks**: None (but demonstrates Guardian's commitment to native SDK)
- **Related to**: Native SDK Integration skill, Guardian audit fixes

## Implementation Notes

### Current State (Lines 354-378 in iris-guardian.md)

**Custom YAML (violates native SDK)**:
```yaml
triggers:
  file_patterns:
    - "src/**/*.ts"
    - ".claude/agents/**/*.md"
    - ".claude/skills/**/*.md"
    - "tests/**/*.test.ts"
    - "package.json"
    - "CHANGELOG.md"
  keywords:
    - "guardian"
    - "health"
    - "monitor"
    - "rag"
    - "graphrag"
    - "fix"
    - "error"
    - "failure"
  lifecycle_hooks:
    - "beforePrompt"
    - "afterAction"
    - "onError"
    - "onStop"
  scheduled:
    - "*/5 * * * *"  # Every 5 minutes
    - "0 2 * * *"    # Daily 2am
```

**Problems**:
1. `triggers:` is not a native SDK field
2. `lifecycle_hooks:` uses non-SDK event names (should be UserPromptSubmit, PostToolUse, etc.)
3. `scheduled:` cron syntax not supported by native SDK
4. Hook definitions belong in `.claude/settings.json`, not agent files

### Proposed Change

**1. Remove Custom YAML from iris-guardian.md**:
Delete lines 354-378 entirely.

**2. Create Native SDK Hooks**:

#### `guardian-before-prompt.ts` (UserPromptSubmit)
```typescript
#!/usr/bin/env ts-node

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guardian Before Prompt Hook
 * Checks framework health and injects context before every user prompt
 */

async function main() {
  const workingDir = process.cwd();

  // Check if Guardian should activate (keyword detection)
  const stdin = await readStdinAsync();
  const keywords = ['guardian', 'health', 'monitor', 'rag', 'graphrag', 'fix', 'error', 'failure'];
  const shouldActivate = keywords.some(kw => stdin.toLowerCase().includes(kw));

  if (!shouldActivate) {
    return; // Skip if not relevant
  }

  // Run health checks
  const healthScore = await checkFrameworkHealth();

  // Inject context
  const context = `
# 🛡️ Guardian Health Check

**Framework Health**: ${healthScore}%
${healthScore < 70 ? '⚠️ **CRITICAL**: Framework health below 70% - auto-pause recommended' : ''}
${healthScore < 90 ? '⚡ **WARNING**: Framework health below 90% - investigate issues' : '✅ **HEALTHY**: All systems operational'}

**Monitoring Active**: Iris-Guardian is watching for issues.
`;

  console.log(context);
}

async function checkFrameworkHealth(): Promise<number> {
  // Implement actual health checks
  return 95; // Placeholder
}

async function readStdinAsync(): Promise<string> {
  return new Promise(resolve => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

main().catch(err => {
  console.error(`[guardian-before-prompt] Error: ${err.message}`);
  process.exit(1);
});
```

#### `guardian-post-action.ts` (PostToolUse)
```typescript
#!/usr/bin/env ts-node

/**
 * Guardian Post Action Hook
 * Validates actions and logs violations after tool usage
 */

async function main() {
  // Parse action from stdin (JSON format from SDK)
  const action = await readActionFromStdin();

  // Validate action against framework rules
  const violations = validateAction(action);

  if (violations.length > 0) {
    console.error(`[Guardian] Detected ${violations.length} violations:`);
    violations.forEach(v => console.error(`  - ${v}`));

    // Log violations for audit
    logViolation(violations);
  }
}

function validateAction(action: any): string[] {
  const violations: string[] = [];

  // Check for SDK compliance violations
  if (action.tool === 'Write' && action.path?.includes('.claude/agents/')) {
    const content = action.content || '';
    if (content.includes('lifecycle_hooks:') || content.includes('triggers:')) {
      violations.push('Non-native SDK field detected in agent definition');
    }
  }

  return violations;
}

main().catch(err => {
  console.error(`[guardian-post-action] Error: ${err.message}`);
  process.exit(1);
});
```

#### `guardian-on-error.ts` (Error event)
```typescript
#!/usr/bin/env ts-node

/**
 * Guardian On Error Hook
 * Detects errors and triggers auto-remediation
 */

async function main() {
  const error = await readErrorFromStdin();

  // Classify error severity
  const severity = classifyError(error);

  // Auto-remediate if high confidence
  if (severity === 'critical' && canAutoFix(error)) {
    console.log(`[Guardian] Auto-remediating: ${error.type}`);
    await attemptAutoFix(error);
  } else {
    console.log(`[Guardian] Logged error for investigation: ${error.type}`);
  }
}

main().catch(err => {
  console.error(`[guardian-on-error] Error: ${err.message}`);
  process.exit(1);
});
```

#### `guardian-on-stop.ts` (Stop event)
```typescript
#!/usr/bin/env ts-node

/**
 * Guardian On Stop Hook
 * Runs final health check and saves state before session ends
 */

async function main() {
  console.log('[Guardian] Running final health check before stop...');

  const healthScore = await checkFrameworkHealth();

  if (healthScore < 90) {
    console.warn(`[Guardian] ⚠️ Session ended with health ${healthScore}% - issues require attention`);
  } else {
    console.log(`[Guardian] ✅ Session ended with healthy framework (${healthScore}%)`);
  }
}

main().catch(err => {
  console.error(`[guardian-on-stop] Error: ${err.message}`);
  process.exit(1);
});
```

**3. Update `.claude/settings.json`**:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      ".claude/hooks/before-prompt.ts",
      ".claude/hooks/guardian-before-prompt.ts"
    ],
    "PostToolUse": [
      ".claude/hooks/post-file-edit.ts",
      ".claude/hooks/guardian-post-action.ts"
    ],
    "Stop": [
      ".claude/hooks/session-codify.ts",
      ".claude/hooks/guardian-on-stop.ts"
    ]
  }
}
```

### Scheduled Tasks Alternative

**Problem**: Native SDK doesn't support cron-style scheduled hooks.

**Solution**: Use external scheduler (cron, systemd timer, or GitHub Actions):

```yaml
# .github/workflows/guardian-scheduled.yml
name: Guardian Scheduled Health Checks
on:
  schedule:
    - cron: '*/5 * * * *'   # Every 5 minutes
    - cron: '0 2 * * *'     # Daily 2am

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx ts-node scripts/guardian-health-check.ts
```

**Alternative**: Background process that sleeps between checks (not recommended, hook-based is cleaner).

### Suggested Approach

1. Read existing custom YAML from iris-guardian.md (lines 354-378)
2. Map custom hooks to native SDK events:
   - `beforePrompt` → `UserPromptSubmit`
   - `afterAction` → `PostToolUse`
   - `onError` → (needs custom error handling, PostToolUse can detect)
   - `onStop` → `Stop`
3. Create 4 new TypeScript hook files with proper shebangs
4. Implement health checks and validation logic in hooks
5. Delete custom YAML from iris-guardian.md
6. Update `.claude/settings.json` to register hooks
7. Test Guardian activation after migration
8. Document scheduled task alternative (GitHub Actions or cron)

### Potential Challenges

- **Challenge**: Scheduled tasks (cron) not supported by native SDK
  - **Mitigation**: Use external scheduler (GitHub Actions, cron, systemd) or background process

- **Challenge**: Guardian may not activate correctly after migration
  - **Mitigation**: Extensive testing with various triggers (keywords, file patterns)

- **Challenge**: Keyword detection needs stdin parsing in UserPromptSubmit hook
  - **Mitigation**: Use existing pattern from before-prompt.ts as reference

- **Challenge**: PostToolUse doesn't provide error details directly
  - **Mitigation**: Validate tool output, detect errors by checking exit codes/output patterns

## Testing Requirements

- [ ] Manual test: Trigger Guardian via keyword ("health check") → before-prompt hook fires
- [ ] Manual test: Edit agent file with custom YAML → post-action hook detects violation
- [ ] Manual test: Stop session → on-stop hook runs final health check
- [ ] Manual test: Verify Guardian still activates after migration
- [ ] Manual test: Check all 4 hooks have executable permissions
- [ ] Manual test: Verify shebang works (`./guardian-before-prompt.ts` runs)
- [ ] Validation: `.claude/settings.json` has correct event mappings
- [ ] Validation: No custom YAML remains in iris-guardian.md

## Documentation Updates

- [ ] Update Guardian Integration Guide with native SDK hook architecture
- [ ] Add inline comments in all 4 new hook files
- [ ] Document scheduled task alternative (GitHub Actions workflow)
- [ ] Update VERSATIL architecture docs to show Guardian's native SDK compliance
- [ ] Add example hook usage to Native SDK Integration skill

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 9 acceptance criteria met
2. ✅ Custom YAML removed from iris-guardian.md
3. ✅ 4 native SDK hooks created and executable
4. ✅ `.claude/settings.json` updated
5. ✅ All manual tests passing
6. ✅ Guardian activates correctly
7. ✅ Documentation updated

**Resolution Steps**:
```bash
# Create hook files
touch .claude/hooks/guardian-{before-prompt,post-action,on-error,on-stop}.ts

# Make executable
chmod +x .claude/hooks/guardian-*.ts

# Edit iris-guardian.md (remove lines 354-378)
code .claude/agents/iris-guardian.md

# Update settings.json
code .claude/settings.json

# Test Guardian activation
# (Type "health check" in Claude and verify Guardian context appears)

# Mark as resolved
mv todos/015-pending-p2-guardian-fix-own-hooks-definition.md \
   todos/015-resolved-guardian-fix-own-hooks-definition.md
```

---

## Notes

**Implementation Priority**: HIGH - This demonstrates Guardian's commitment to native SDK compliance by "eating its own dog food". Fixes an ironic oversight identified in audit.

**Why This Matters**:
- **Credibility**: Guardian must follow its own rules
- **Example**: Shows other agents how to use native SDK correctly
- **Dogfooding**: Proves native SDK is sufficient (no workarounds needed)
- **Audit**: Addresses Gap #3 from Guardian audit (Skills Alignment 85/100)

**Impact on Guardian**:
- **Before**: Guardian uses custom YAML (violates native SDK)
- **After**: Guardian uses native SDK events + hooks (100% compliant)
- **Functionality**: No change - Guardian continues monitoring framework health

**Scheduled Tasks Note**: Native SDK doesn't support cron scheduling. Recommend using GitHub Actions for periodic health checks (every 5 minutes, daily 2am). Alternative: background process, but this adds complexity.

**Audit Context**: This was identified during the 2025-10-27 Guardian audit as an ironic situation where Guardian enforces native SDK compliance but doesn't follow it itself.

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD (estimated 1.5 hours)
