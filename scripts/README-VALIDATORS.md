# VERSATIL Validation System Documentation

## Overview

The VERSATIL Framework includes automated validators to prevent common errors and ensure code quality. This guide covers the slash command validator and how to extend the validation system.

---

## Slash Command Validator

### Purpose

Validates `.claude/commands/*.md` files to prevent syntax errors, particularly:
- Invalid MCP tool invocation patterns (`!mcp__...`)
- Missing required frontmatter fields
- Incorrect bash pre-execution syntax
- Non-existent tool references

### Why It Exists

**The Problem**: During development, invalid syntax like `!mcp__server__tool` was introduced, which doesn't work in Claude Code slash commands.

**The Solution**: Automatic validation catches these errors before they reach production.

---

## Usage

### Quick Validation

```bash
npm run validate:commands
```

**Output** (if errors found):
```
✗ ERROR in .claude/commands/test.md [line 10]:
Invalid MCP invocation: '!mcp__server__tool'

The '!' prefix is for bash commands only (e.g., '!git status').
To use MCP tools, use natural language instead:
"Use the versatil_activate_agent tool with agentId='maria-qa'"
```

### Verbose Mode

```bash
npm run validate:commands:verbose
```

Shows additional information:
- MCP tools referenced
- Bash commands found
- Warnings and suggestions

### Automatic Validation

#### Pre-Commit Hook

Validator runs automatically when committing `.claude/commands/*.md` files:

```bash
git add .claude/commands/maria-qa.md
git commit -m "update command"

# If errors found, commit blocked:
Validate Claude Code Slash Commands......................Failed
❌ Invalid MCP invocation detected!
Commit blocked. Fix errors and try again.
```

#### CI/CD Integration

Validator runs as part of `npm run validate`:

```bash
npm run validate  # Runs: lint → commands → tests → build
```

---

## Common Errors and Fixes

### Error 1: Invalid MCP Invocation

**Error**:
```
✗ ERROR [line 27]: Invalid MCP invocation: '!mcp__claude-opera__versatil_activate_agent'
```

**Problem**: The `!` prefix is for bash commands only, not MCP tools.

**Fix**:
```markdown
<!-- ❌ WRONG -->
!mcp__claude-opera__versatil_activate_agent agentId=maria-qa

<!-- ✅ CORRECT -->
If the VERSATIL MCP server (`claude-opera`) is connected, use the
`versatil_activate_agent` tool with `agentId="maria-qa"`.
```

**Why**: Claude Code slash commands are prompts, not execution environments. Use natural language to request MCP tool usage.

---

### Error 2: Missing Required Fields

**Error**:
```
✗ ERROR [frontmatter]: Missing required field: description
```

**Fix**:
```yaml
---
description: "Activate Maria-QA for quality assurance and testing"
argument-hint: "[task description]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Read"
  - "Write"
  - "Bash"
---
```

**Required Fields**:
- `description` - Brief command description (shown in `/` menu)

**Recommended Fields**:
- `argument-hint` - Parameter hint for users
- `model` - Claude model to use
- `allowed-tools` - Tools command can use

---

### Warning 1: Unknown Bash Command

**Warning**:
```
⚠️  WARNING [line 15]: Unknown bash command: '!custom-script'
```

**Meaning**: Validator doesn't recognize this bash command.

**Actions**:
1. **If correct**: Ignore warning (command will still run)
2. **If typo**: Fix the command name
3. **If common**: Add to `KNOWN_BASH_COMMANDS` in validator script

---

### Warning 2: No Tools Specified

**Warning**:
```
⚠️  WARNING [allowed-tools]: No tools specified
```

**Meaning**: Command has no `allowed-tools` list.

**Impact**: Command functionality may be limited.

**Fix** (if needed):
```yaml
---
allowed-tools:
  - "Read"
  - "Write"
  - "Bash"
---
```

---

## Slash Command Syntax Reference

### Correct MCP Tool Usage

**Option 1: Natural Language** (Recommended)
```markdown
Perform QA analysis. If the VERSATIL MCP server is connected,
use the `versatil_activate_agent` tool with `agentId="maria-qa"`.
```

**Option 2: Explicit Request**
```markdown
Use the versatil_activate_agent MCP tool (from claude-opera server)
with these parameters:
- agentId: "maria-qa"
- context: $ARGUMENTS
```

### Correct Bash Pre-Execution

**Valid Usage**:
```markdown
Current branch: !git branch --show-current
Project status: !git status
Recent commits: !git log --oneline -5
```

**How it works**:
- `!` prefix executes bash command
- Output embedded in prompt before Claude sees it
- Only works for actual bash commands

---

## Extending the Validator

### Adding New Checks

Edit `scripts/validate-slash-commands.cjs`:

```javascript
/**
 * Add your custom validation check
 */
function validateMyCustomRule(filePath, content) {
  // Your validation logic
  if (/* condition */) {
    reportError(filePath, 'location', 'Error message');
  }
}

// Call from validateCommandFile()
function validateCommandFile(filePath) {
  // ... existing checks ...
  validateMyCustomRule(filePath, content);
}
```

### Adding Known Commands

```javascript
// Add to KNOWN_BASH_COMMANDS array
const KNOWN_BASH_COMMANDS = [
  'git', 'npm', 'node', 'ls', 'cat', 'grep', 'find', 'curl', 'echo',
  'your-custom-command'  // Add here
];
```

### Adding Known Tools

```javascript
// Add to KNOWN_TOOLS array
const KNOWN_TOOLS = [
  'Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'Task', 'TodoWrite',
  'YourCustomTool'  // Add here
];
```

---

## Validator Architecture

### How It Works

1. **Scan**: Find all `.claude/commands/**/*.md` files
2. **Parse**: Extract YAML frontmatter and body
3. **Validate**: Run multiple validation checks:
   - Frontmatter syntax
   - Required fields
   - Invalid MCP patterns
   - Bash command syntax
   - Tool availability
4. **Report**: Clear, actionable error messages
5. **Exit**: Non-zero exit code if errors (blocks commits/CI)

### Error vs Warning

**Error** (Blocks commit/CI):
- Invalid syntax that will cause runtime failures
- Missing critical fields
- Security issues

**Warning** (Allows commit/CI):
- Unknown commands (may still work)
- Missing optional fields
- Style suggestions

---

## Testing the Validator

### Unit Test Example

```javascript
// tests/validate-slash-commands.test.js
describe('SlashCommandValidator', () => {
  it('catches invalid MCP invocation', () => {
    const content = `
---
description: Test
---
!mcp__server__tool
    `;

    expect(() => validateMCPSyntax(content))
      .toThrow('Invalid MCP invocation');
  });
});
```

### Integration Test

```bash
# Create test file with error
echo "!mcp__test__tool" > .claude/commands/test-error.md

# Run validator
npm run validate:commands

# Expected: Exits with code 1 and shows error

# Cleanup
rm .claude/commands/test-error.md
```

---

## Troubleshooting

### Validator Not Running on Commit

**Check pre-commit installation**:
```bash
pre-commit install
```

**Test manually**:
```bash
pre-commit run validate-slash-commands --all-files
```

### False Positives

If validator reports errors incorrectly:

1. **Check syntax**: Verify your command syntax is correct
2. **Update validator**: May need to extend `KNOWN_COMMANDS`
3. **Report issue**: Create GitHub issue with example

### Validator Crashes

```bash
# Run with verbose for debugging
npm run validate:commands:verbose

# Check Node.js version (requires Node 14+)
node --version
```

---

## Best Practices

### 1. Always Use Natural Language for MCP Tools

✅ **Good**:
```markdown
Use the versatil_activate_agent tool with agentId="maria-qa"
```

❌ **Bad**:
```markdown
!mcp__claude-opera__versatil_activate_agent agentId=maria-qa
```

### 2. Specify Allowed Tools

Explicitly list tools your command uses:

```yaml
allowed-tools:
  - "Read"
  - "Write"
  - "Bash"
```

### 3. Test Commands After Changes

```bash
# After editing any command
npm run validate:commands

# Test in Claude Code
/your-command test argument
```

### 4. Document Custom Commands

Add usage examples in the command body:

```markdown
## Example Usage

```bash
/maria-qa Review test coverage
/maria-qa Run full validation suite
```
```

---

## Integration with Other Validators

VERSATIL includes multiple validators:

- **Config Validator** (`src/config/config-validator.ts`)
- **Agent Validator** (`src/agents/validators/config-validators.ts`)
- **Credential Validator** (`src/onboarding/credential-validator.ts`)
- **Slash Command Validator** (this document)

All run via:
```bash
npm run validate  # Runs all validators + tests + build
```

---

## FAQ

**Q: Can I disable the validator?**
A: Yes, but not recommended. Remove from `.pre-commit-config.yaml` and `package.json`.

**Q: Why are MCP tools not directly invocable?**
A: Claude Code slash commands are prompt templates, not execution environments. They provide instructions to Claude, which then decides to use tools.

**Q: Can I auto-fix errors?**
A: Currently manual fixes required. Auto-fix planned for future release.

**Q: How do I validate a single file?**
A: `node scripts/validate-slash-commands.cjs path/to/file.md`

---

## Summary

✅ **Use Validator**: `npm run validate:commands`
✅ **Auto-Runs**: On git commit (pre-commit hook)
✅ **Prevents**: Invalid MCP syntax, missing fields, bad bash commands
✅ **Clear Errors**: Actionable messages with fixes
✅ **Extensible**: Easy to add new checks

**The validator prevents the basic errors that were made during framework development, ensuring code quality and reliability.**

---

**Last Updated**: 2025-10-13
**Framework Version**: 6.4.0
**Validator Version**: 1.0.0
