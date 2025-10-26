# Native SDK Integration - Troubleshooting Guide

Common issues and solutions when implementing native Claude SDK hooks.

## Issue 1: Hooks Not Firing

**Symptoms**:
- Hook scripts exist but never execute
- No output when expected events occur
- Settings.json configured but hooks silent

**Diagnosis**:
```bash
# Check if hooks are executable
ls -la .claude/hooks/*.ts
# Should show '-rwxr-xr-x' (x permission)

# Verify settings.json syntax
jq . .claude/settings.json
# Should parse without errors

# Check event names
jq '.hooks | keys' .claude/settings.json
# Should show: PostToolUse, SubagentStop, Stop, UserPromptSubmit (not custom names)
```

**Solutions**:

1. **Make hooks executable**:
   ```bash
   chmod +x .claude/hooks/*.ts
   ```

2. **Fix event name casing**:
   ```json
   // Wrong
   "hooks": {
     "post_tool_use": [...],  ❌
     "POSTTOOLUSE": [...],     ❌
     "PostToolUse": [...]      ✅
   }
   ```

3. **Verify hook path exists**:
   ```bash
   ls -la .claude/hooks/post-file-edit.ts
   # Should exist and be readable
   ```

---

## Issue 2: Bash Scripts Don't Receive Context

**Symptoms**:
- Bash hook executes but receives no input
- TypeScript hooks work, bash hooks don't
- Empty stdin when reading `/dev/stdin`

**Root Cause**: Bash scripts don't receive SDK context automatically

**Solution**: Use TypeScript with ts-node instead

```bash
# Don't use bash
#!/bin/bash  ❌
# stdin is empty

# Use TypeScript
#!/usr/bin/env ts-node  ✅
const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));
```

---

## Issue 3: Custom YAML Fields Ignored

**Symptoms**:
- Agent frontmatter has `lifecycle_hooks` or `auto_activation_rules`
- Fields are present but have no effect
- Hooks don't trigger despite YAML configuration

**Root Cause**: Claude SDK only recognizes official fields

**Solution**: Remove custom fields, use settings.json instead

```yaml
# Wrong (agent YAML)
---
name: my-agent
lifecycle_hooks:          ❌
  file_edit: "*.test.ts"  ❌
---

# Right (.claude/settings.json)
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/detect-test-file.ts"
        }]
      }
    ]
  }
}
```

---

## Issue 4: Hook Crashes Block Claude

**Symptoms**:
- Hook throws uncaught error
- Claude hangs or fails to respond
- Error messages visible but no recovery

**Root Cause**: Throwing errors blocks Claude's execution

**Solution**: Always wrap in try-catch and exit gracefully

```typescript
// Wrong
async function main() {
  const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));
  // If parse fails → uncaught error → Claude blocked ❌
}

// Right
async function main() {
  try {
    const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));
    // Hook logic...
    process.exit(0);
  } catch (error) {
    // Fail silently - don't block Claude
    process.exit(0);  ✅
  }
}
```

---

## Issue 5: Wrong Matcher Pattern

**Symptoms**:
- Hook configured but doesn't trigger on expected tools
- Triggers on wrong tools or agents
- Regex pattern doesn't match

**Diagnosis**:
```bash
# Check current matchers
jq '.hooks.PostToolUse[].matcher' .claude/settings.json
```

**Common Mistakes**:

```json
// Glob patterns (don't work)
"matcher": "*.test.ts"  ❌

// Regex patterns (correct)
"matcher": ".*\\.test\\.ts$"  ✅

// Simple string match
"matcher": "Edit"  ✅

// OR logic
"matcher": "Edit|Write|MultiEdit"  ✅

// All tools
"matcher": "*"  ✅
```

---

## Issue 6: ts-node Not Found

**Symptoms**:
- Hook shebang: `#!/usr/bin/env ts-node`
- Error: `env: ts-node: No such file or directory`
- Hook won't execute

**Solution**: Install ts-node globally or use npx

```bash
# Option 1: Install ts-node globally
npm install -g ts-node

# Option 2: Use npx in shebang (slower but always works)
#!/usr/bin/env -S npx tsx
```

**Alternative** (faster, recommended):
```bash
# Install tsx (faster than ts-node)
npm install -D tsx

# Update shebang
#!/usr/bin/env -S npx tsx
```

---

## Issue 7: Hook Runs But No Output

**Symptoms**:
- Hook executes (confirmed via logging)
- No context injected into Claude
- Return value seems ignored

**Root Cause**: Output must be valid JSON on stdout

**Solution**: Use console.log with JSON.stringify

```typescript
// Wrong
console.log('Some context here');  ❌

// Right
console.log(JSON.stringify({
  role: 'system',
  content: 'Context here...'
}));  ✅
```

**Debug**: Log to stderr to see what's happening
```typescript
console.error('[DEBUG] Hook fired!');  // Visible to user
console.log(JSON.stringify({...}));     // Sent to Claude
```

---

## Issue 8: Settings.json Not Found

**Symptoms**:
- Hooks don't fire in Claude Code
- Works locally but not in IDE
- Error: `settings.json not found`

**Diagnosis**:
```bash
# Check if file exists
ls -la .claude/settings.json

# Verify it's in project root .claude/ directory
pwd
# Should be: /path/to/project/.claude/
```

**Solution**:
```bash
# Create settings.json in correct location
mkdir -p .claude
touch .claude/settings.json

# Add minimal config
echo '{
  "hooks": {}
}' > .claude/settings.json
```

---

## Issue 9: Hooks Work in Cursor, Not Claude Code (or vice versa)

**Symptoms**:
- IDE-specific behavior differences
- Hook triggers in one IDE but not the other

**Root Cause**: Different SDK versions or IDE configurations

**Solution**: Use lowest common denominator

```json
// Use only features supported by both IDEs
{
  "hooks": {
    "PostToolUse": [...],  // Supported everywhere
    "Stop": [...],          // Supported everywhere
    "UserPromptSubmit": [...] // SDK v0.1.22+
  }
}
```

**Verify SDK version**:
```bash
# Check Claude Code version
claude --version

# Check Cursor IDE SDK
# Settings → Extensions → Claude SDK
```

---

## Issue 10: Multiple Hooks on Same Event

**Symptoms**:
- Want multiple hooks for PostToolUse
- Only first hook runs
- Hooks seem to override each other

**Solution**: Use array of hooks, not multiple entries

```json
// Wrong
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit", "hooks": [{...}] },
      { "matcher": "Edit", "hooks": [{...}] }  // Second Edit entry ignored
    ]
  }
}

// Right
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/hook1.ts" },
          { "type": "command", "command": ".claude/hooks/hook2.ts" }
        ]
      }
    ]
  }
}
```

---

## Debugging Checklist

Run through this checklist when hooks aren't working:

- [ ] Hooks have execute permission (`chmod +x`)
- [ ] Shebang is correct (`#!/usr/bin/env ts-node` or `npx tsx`)
- [ ] Event names match SDK spec (case-sensitive)
- [ ] settings.json is valid JSON (`jq . .claude/settings.json`)
- [ ] Hook paths exist and are readable
- [ ] Matcher patterns use regex syntax (not glob)
- [ ] Hook wraps all logic in try-catch
- [ ] Output is valid JSON on stdout
- [ ] ts-node/tsx is installed (`npm list ts-node tsx`)
- [ ] Testing with simple hook first (just log to stderr)

---

## Minimal Working Example

If nothing works, start with this minimal hook:

```typescript
#!/usr/bin/env -S npx tsx

import * as fs from 'fs';

async function main() {
  try {
    console.error('[DEBUG] Hook fired!');
    const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));
    console.error('[DEBUG] Input:', JSON.stringify(input, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    process.exit(0);
  }
}

main();
```

**settings.json**:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/debug.ts"
        }]
      }
    ]
  }
}
```

Run any Edit tool and check terminal output for `[DEBUG]` messages.

---

## Getting Help

If issues persist after troubleshooting:

1. **Check SDK version**: `npm list @anthropic/sdk`
2. **Review logs**: Look for hook errors in IDE console
3. **Simplify**: Start with minimal example above
4. **Verify**: Run hook manually with test input
   ```bash
   echo '{"tool":"Edit"}' | .claude/hooks/your-hook.ts
   ```

---

## Related Resources

- SDK Events API: `references/sdk-events-api.md`
- Implementation Guide: `references/implementation-guide.md`
- Official SDK Docs: https://github.com/anthropics/claude-sdk
