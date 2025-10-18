# Agent Activation Troubleshooting Guide

**VERSATIL SDLC Framework v4.1.0** - Complete Troubleshooting Reference

This guide helps diagnose and fix agent auto-activation issues. If your agents aren't activating automatically when editing files, this is your starting point.

---

## 🎯 Quick Diagnosis

Run the built-in diagnostic tool:

```bash
versatil test-activation

# Expected output if working:
# ✅ Cursor IDE detected
# ✅ .cursorrules found
# ✅ Agent triggers configured
# ✅ Proactive orchestrator ready
```

If you see ❌ errors, jump to the relevant section below.

---

## 📋 Table of Contents

1. [Understanding Auto-Activation](#understanding-auto-activation)
2. [Common Issues & Fixes](#common-issues--fixes)
3. [Diagnostic Commands](#diagnostic-commands)
4. [Configuration Validation](#configuration-validation)
5. [IDE-Specific Issues](#ide-specific-issues)
6. [Advanced Debugging](#advanced-debugging)
7. [Manual Activation Fallback](#manual-activation-fallback)

---

## Understanding Auto-Activation

### How It Works

VERSATIL agents activate automatically based on **three factors**:

1. **File Patterns** - File name matching (e.g., `*.test.*` → Maria-QA)
2. **Code Patterns** - Code content matching (e.g., `describe(` → Maria-QA)
3. **Configuration** - Enabled in `.cursorrules` and `.cursor/settings.json`

```yaml
Example Flow:
User Action: Edit src/LoginForm.test.tsx
  ↓
File Pattern Match: "*.test.*" matches
  ↓
Code Pattern Match: "describe(" found in file
  ↓
Agent Activation: Maria-QA activates
  ↓
Proactive Actions:
  - Test coverage analysis
  - Missing test detection
  - Assertion validation
  ↓
User Sees: Statusline "🤖 Maria-QA analyzing..."
           Inline suggestions appear
```

### Required Components

For auto-activation to work, you need ALL of these:

- ✅ VERSATIL framework installed globally
- ✅ `.versatil-project.json` in project root
- ✅ `.cursorrules` file (Cursor IDE users)
- ✅ `.cursor/settings.json` with agent triggers
- ✅ Proactive mode enabled in configuration
- ✅ IDE integration active (Cursor or VS Code)

---

## Common Issues & Fixes

### Issue 1: "Agents Never Activate"

**Symptoms**:
- Edit test files, no Maria-QA activation
- No statusline updates
- No inline suggestions

**Diagnosis**:
```bash
# Step 1: Check if framework is installed
which versatil
# Expected: /usr/local/bin/versatil or similar

# Step 2: Check project configuration
cat .versatil-project.json
# Expected: Valid JSON with agent config

# Step 3: Run activation test
versatil test-activation
```

**Common Causes**:

#### 1a. Missing Configuration Files

**Check**:
```bash
ls -la .versatil-project.json .cursorrules .cursor/settings.json

# Expected output:
# .versatil-project.json
# .cursorrules
# .cursor/settings.json
```

**Fix**:
```bash
# Regenerate all config files
versatil cursor:init --force

# This creates:
# - .versatil-project.json
# - .cursorrules
# - .cursor/settings.json
```

#### 1b. Proactive Mode Disabled

**Check**:
```bash
versatil config show | grep proactive_agents.enabled
```

**Fix**:
```bash
# Enable proactive mode
versatil config set proactive_agents.enabled=true

# Verify
versatil config show
```

#### 1c. Agent Not Enabled for File Type

**Check** `.cursorrules`:
```yaml
agents:
  maria-qa:
    enabled: true  # ← Must be true
    auto_run_on_save: true  # ← Must be true
```

**Fix**:
Edit `.cursorrules` and set:
```yaml
agents:
  maria-qa:
    enabled: true
    auto_run_on_save: true

  james-frontend:
    enabled: true
    auto_run_on_save: true

  marcus-backend:
    enabled: true
    auto_run_on_save: true
```

---

### Issue 2: "Agents Activate But No Statusline Updates"

**Symptoms**:
- Agents working (can verify with `versatil agents --status`)
- No visual feedback in IDE statusline
- Inline suggestions might work

**Diagnosis**:
```bash
# Check if statusline updates enabled
versatil config show | grep statusline_updates
```

**Fix**:

#### 2a. Enable Statusline Updates

Edit `.cursor/settings.json`:
```json
{
  "versatil.proactive_agents": {
    "statusline_updates": true,  // ← Ensure this is true
    "inline_suggestions": true
  }
}
```

#### 2b. Restart IDE

```bash
# After changing settings:
# 1. Close Cursor IDE completely
# 2. Reopen project
# 3. Test again
```

---

### Issue 3: "Wrong Agent Activating"

**Symptoms**:
- Edit test file → James-Frontend activates instead of Maria-QA
- Multiple agents activating for same file

**Diagnosis**:
```bash
# Test specific file
versatil test-activation --file=src/LoginForm.test.tsx

# Shows which agents match and why
```

**Fix**:

#### 3a. File Pattern Priority

File patterns are matched in order. Check `.cursor/settings.json`:

```json
"activation_triggers": {
  "maria-qa": {
    "file_patterns": [
      "*.test.*",        // ← This should match first
      "**/__tests__/**",
      "*.spec.*"
    ]
  },
  "james-frontend": {
    "file_patterns": [
      "*.tsx",           // ← This is more generic
      "*.jsx"
    ]
  }
}
```

**Solution**: Make test patterns more specific or reorder triggers.

#### 3b. Too Many Agents Activating

If multiple agents are valid (e.g., `LoginForm.test.tsx` is both a test and a component):

```yaml
# In .cursorrules, set priority:
agents:
  maria-qa:
    priority: 1  # Highest priority for test files

  james-frontend:
    priority: 2
    exclude_patterns: ["*.test.*"]  # Don't activate for tests
```

---

### Issue 4: "Activation Too Slow"

**Symptoms**:
- Agents activate but with 5-10 second delay
- IDE lags when editing files

**Diagnosis**:
```bash
# Check agent response times
versatil agents --stats
```

**Fix**:

#### 4a. Reduce Background Monitoring

Edit `.cursor/settings.json`:
```json
{
  "versatil.proactive_agents": {
    "background_monitoring": false,  // Disable for large projects
    "auto_activation": true  // Keep on-save activation
  }
}
```

#### 4b. Increase Debounce Time

Edit `.cursorrules`:
```yaml
advanced:
  performance:
    debounce_file_changes_ms: 1000  // Wait 1s before activating
```

#### 4c. Limit Parallel Agents

```yaml
advanced:
  agent_coordination:
    max_parallel_agents: 2  // Reduce from 3 to 2
```

---

### Issue 5: "File Pattern Not Matching"

**Symptoms**:
- `LoginForm.test.tsx` → No activation
- But `LoginForm.test.ts` → Works

**Diagnosis**:
```bash
# Test specific file
versatil test-activation --file=src/LoginForm.test.tsx --verbose

# Shows pattern matching details
```

**Fix**:

#### 5a. Add Missing Patterns

Edit `.cursor/settings.json`:
```json
"maria-qa": {
  "file_patterns": [
    "*.test.*",      // Matches .test.ts, .test.tsx, .test.js
    "*.spec.*",      // Matches .spec.ts, .spec.tsx
    "**/__tests__/**",  // Matches __tests__ directory
    "**/*.test.tsx", // Explicit .test.tsx pattern
    "**/*.test.ts"   // Explicit .test.ts pattern
  ]
}
```

#### 5b. Use Glob Patterns

```json
"file_patterns": [
  "**/*.{test,spec}.{ts,tsx,js,jsx}"  // Matches all test files
]
```

---

### Issue 6: "Activation Only Works Sometimes"

**Symptoms**:
- Inconsistent activation
- Works for some files, not others
- Random "works then stops working"

**Diagnosis**:
```bash
# Watch agent activity in real-time
versatil agents --watch

# Edit different files and observe output
```

**Fix**:

#### 6a. Check File System Watchers

```bash
# macOS/Linux: Increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# macOS: Check launchd limits
launchctl limit maxfiles
```

#### 6b. Restart Proactive Orchestrator

```bash
# Kill and restart monitoring
pkill -f "versatil.*orchestrator"
versatil init  # Reinitialize
```

#### 6c. Clear Cache

```bash
# Clear VERSATIL cache
rm -rf ~/.versatil/cache/*

# Restart
versatil init
```

---

## Diagnostic Commands

### Test Activation

```bash
# Basic test
versatil test-activation

# Test specific file
versatil test-activation --file=src/LoginForm.test.tsx

# Verbose output
versatil test-activation --verbose

# Debug mode
VERSATIL_DEBUG=true versatil test-activation
```

**Output Explanation**:
```
✅ Agent activation working correctly!
  - Pattern matched: *.test.*
  - Confidence: 95%
  - Proactive actions: 4

⚠️  Agent activation partially working
  - Pattern matched but agent disabled
  - Check .cursorrules: maria-qa.enabled

❌ Agent activation not working
  - No pattern matches
  - Check .cursor/settings.json triggers
```

---

### Watch Agent Activity

```bash
# Monitor all agents
versatil agents --watch

# Monitor specific agent
versatil agents --watch maria

# With detailed logging
VERSATIL_DEBUG=true versatil agents --watch
```

**Output Example**:
```
[14:32:15] 🤖 Maria-QA activated
           File: src/LoginForm.test.tsx
           Matched: *.test.* (file pattern)
           Matched: describe( (code pattern)
           Action: test_coverage_analysis

[14:32:17] 📊 Maria-QA analysis complete
           Coverage: 85%
           Suggestions: 2
           Duration: 1.8s
```

---

### Check Agent Status

```bash
# List all agents
versatil agents --status

# Show agent statistics
versatil agents --stats

# List agent configuration
versatil agents --config
```

---

### Configuration Validation

```bash
# Validate all configuration
versatil config:validate

# Expected output:
# ✅ .versatil-project.json: Valid
# ✅ .cursorrules: Valid
# ✅ .cursor/settings.json: Valid
# ⚠️  Warning: RAG memory not initialized

# Show current configuration
versatil config show

# Show specific agent config
versatil config show maria-qa
```

---

## Configuration Validation

### Verify .versatil-project.json

**Check file exists**:
```bash
cat .versatil-project.json
```

**Required structure**:
```json
{
  "name": "my-project",
  "version": "1.0.0",
  "versatil": {
    "version": "4.1.0",
    "agents": {
      "maria-qa": { "enabled": true },
      "james-frontend": { "enabled": true },
      "marcus-backend": { "enabled": true }
    },
    "proactive": {
      "enabled": true,
      "auto_activation": true
    }
  }
}
```

**Fix if invalid**:
```bash
versatil init --force
```

---

### Verify .cursorrules

**Check file exists**:
```bash
cat .cursorrules
```

**Critical sections**:
```yaml
# 1. Agents must be enabled
agents:
  maria-qa:
    enabled: true  # ← Must be true
    auto_run_on_save: true

# 2. Proactive features enabled
proactive:
  inline_suggestions: true
  statusline_updates: true
  background_monitoring: true
  auto_activation: true  # ← Critical

# 3. Agent actions configured
agents:
  maria-qa:
    proactive_actions:
      test_coverage_analysis:
        enabled: true  # ← At least one action enabled
```

**Fix if missing**:
```bash
versatil cursor:init --force
```

---

### Verify .cursor/settings.json

**Check file exists**:
```bash
cat .cursor/settings.json
```

**Critical sections**:
```json
{
  "versatil.proactive_agents": {
    "enabled": true,  // ← Must be true
    "auto_activation": true,  // ← Must be true
    "statusline_updates": true,

    "activation_triggers": {
      "maria-qa": {
        "file_patterns": ["*.test.*"],  // ← Must have patterns
        "auto_run_on_save": true  // ← Must be true
      }
    }
  }
}
```

**Fix if invalid**:
```bash
versatil cursor:init --force
```

---

## IDE-Specific Issues

### Cursor IDE

#### Issue: Extension Not Loaded

**Check**:
1. Open Cursor Settings (Cmd+,)
2. Search for "VERSATIL"
3. Verify extension is installed and enabled

**Fix**:
```bash
# Reinstall extension
cursor --install-extension versatil.sdlc-framework

# Restart Cursor
```

#### Issue: Settings Not Applied

**Check**:
```bash
# Verify settings file location
ls ~/.config/Cursor/User/settings.json

# Check VERSATIL settings present
grep "versatil" ~/.config/Cursor/User/settings.json
```

**Fix**:
```bash
# Merge .cursor/settings.json into User settings
cat .cursor/settings.json >> ~/.config/Cursor/User/settings.json

# Restart Cursor
```

---

### VS Code

#### Issue: Extension Compatibility

**Note**: VERSATIL is optimized for Cursor but works with VS Code.

**Check**:
```bash
# Install VS Code extension
code --install-extension versatil.sdlc-framework

# Check installed
code --list-extensions | grep versatil
```

**Fix**:
```bash
# Create .vscode/settings.json
mkdir -p .vscode
cp .cursor/settings.json .vscode/settings.json

# Restart VS Code
```

---

## Advanced Debugging

### Enable Debug Mode

```bash
# Method 1: Environment variable
export VERSATIL_DEBUG=true
versatil agents --watch

# Method 2: Configuration
versatil config set debug_mode=true

# Method 3: Command flag
versatil test-activation --debug
```

**Debug Output Example**:
```
[DEBUG] Proactive orchestrator started
[DEBUG] Watching directory: /path/to/project
[DEBUG] File change detected: src/LoginForm.test.tsx
[DEBUG] Matching agents for pattern: *.test.*
[DEBUG] Maria-QA matched (confidence: 95%)
[DEBUG] Activating Maria-QA...
[DEBUG] Running proactive actions: test_coverage_analysis
[DEBUG] Action complete in 1.8s
```

---

### Check Logs

```bash
# View framework logs
tail -f ~/.versatil/logs/versatil.log

# View agent logs
tail -f ~/.versatil/logs/agents/maria-qa.log

# View orchestrator logs
tail -f ~/.versatil/logs/orchestrator.log
```

---

### Network Issues (MCP)

If using MCP integration:

```bash
# Test MCP connection
versatil mcp:test

# Check MCP server status
ps aux | grep versatil-mcp

# Restart MCP server
pkill -f versatil-mcp
versatil-mcp &
```

---

## Manual Activation Fallback

If auto-activation continues to fail, use manual slash commands:

### Cursor IDE / Claude Desktop

```bash
# Manually activate Maria-QA
/maria review test coverage for authentication

# Manually activate James-Frontend
/james check accessibility for LoginForm

# Manually activate Marcus-Backend
/marcus review API security implementation

# Run framework health checks
/framework:doctor
/framework:validate
```

### CLI Commands

```bash
# Run quality checks manually
versatil quality-gate pre-commit

# Generate stress tests manually
versatil stress-test api

# Run health audit
versatil audit --quick
```

---

## Getting Help

### Self-Diagnosis Checklist

Before reporting an issue, run through this checklist:

- [ ] Run `versatil test-activation` → Check all ✅
- [ ] Run `versatil doctor` → No ❌ errors
- [ ] Run `versatil config:validate` → All valid
- [ ] Check `.cursorrules` → `proactive.auto_activation: true`
- [ ] Check `.cursor/settings.json` → File patterns present
- [ ] Restart IDE → Test again
- [ ] Check logs → Any errors?

---

### Debug Information to Collect

If issues persist, collect this information for support:

```bash
# Generate debug report
versatil debug:report > debug-report.txt

# Contents will include:
# - Framework version
# - Node.js version
# - OS and IDE version
# - Configuration files
# - Recent logs
# - Agent status
```

---

### Community Support

1. **GitHub Discussions**: [versatil-sdlc-framework/discussions](https://github.com/versatil-sdlc-framework/discussions)
2. **GitHub Issues**: [Report a bug](https://github.com/versatil-sdlc-framework/issues/new?template=bug_report.md)
3. **Documentation**: [docs.versatil.dev](https://docs.versatil.dev)

---

## Common Error Messages

### "Agent not found: maria-qa"

**Cause**: Agent not registered
**Fix**:
```bash
versatil init --force
```

### "File pattern not matching"

**Cause**: Pattern syntax error in `.cursor/settings.json`
**Fix**: Validate JSON syntax, use glob patterns

### "Proactive orchestrator not running"

**Cause**: Orchestrator crashed or not started
**Fix**:
```bash
pkill -f versatil
versatil init
```

### "Configuration file invalid"

**Cause**: JSON/YAML syntax error
**Fix**:
```bash
# Validate JSON
cat .versatil-project.json | jq .

# Regenerate
versatil cursor:init --force
```

---

## Quick Reference

### Most Common Fixes

```bash
# 1. Regenerate all configuration
versatil cursor:init --force

# 2. Enable proactive mode
versatil config set proactive_agents.enabled=true

# 3. Test activation
versatil test-activation

# 4. Watch real-time activity
versatil agents --watch

# 5. If all else fails: Reinstall
npm uninstall -g @versatil/sdlc-framework
npm install -g @versatil/sdlc-framework
versatil init
```

---

**Framework Version**: 4.1.0
**Last Updated**: 2025-10-05
**Maintained By**: VERSATIL Development Team

**Related Documentation**:
- [Cursor Integration Guide](CURSOR_INTEGRATION.md)
- [BMad Commands Reference](BMAD_COMMANDS.md)
- [Quality Gates Guide](QUALITY_GATES.md)
- [Installation Troubleshooting](INSTALLATION_TROUBLESHOOTING.md)
