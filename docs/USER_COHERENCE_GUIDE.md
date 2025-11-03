# User Coherence Guide

**Version**: 7.16.1
**Last Updated**: 2025-10-31

## Overview

VERSATIL Framework includes comprehensive **User Coherence** validation - a health checking system that ensures your MCP server is up-to-date, properly configured, and functioning correctly.

This guide explains how to use the coherence checking tools to maintain a healthy VERSATIL MCP server.

**Note**: As of v7.16.1, VERSATIL uses **npx** for MCP server execution. Health checks focus on MCP server status rather than traditional npm package installation.

---

## Quick Start

### Check Framework Health (CLI)

```bash
# Full health check (outside Claude sessions)
npx versatil doctor

# Quick check (version + critical issues only)
npx versatil doctor --quick

# Auto-fix detected issues
npx versatil doctor --fix
```

### Check Framework Health (Claude Session)

```bash
# Full health check (in Claude session)
/coherence

# Quick check
/coherence --quick

# Auto-fix issues
/coherence --fix
```

---

## What Gets Checked

### 1. Version Alignment ✅

**Checks**:
- Installed framework version vs latest npm version
- How many versions behind (major/minor/patch)
- Breaking changes since your installed version
- Update recommendations

**Example Output**:
```
📦 Version Status
  Installed: v7.8.0
  Latest:    v7.9.0
  Status:    ⚠ Patch available
  Health:    ████████████████████ 95/100
```

**Actions**:
- **Up to date**: No action needed
- **Patch available**: Optional update (bug fixes)
- **Minor available**: Recommended update (new features, no breaking changes)
- **Major available**: Review breaking changes, then update

---

### 2. Installation Integrity ✅

**Checks**:
- Critical files present (agents, commands, skills, hooks)
- Directory structure validity
- File count (expected vs actual)
- TypeScript compilation status

**Example Output**:
```
📁 Installation Integrity
  Files:     1,247/1,247 present
  Structure: ✓ Valid
  Build:     ✓ Current
  Health:    ████████████████████ 100/100
```

**Actions**:
- **Corrupted**: Clear npx cache: `rm -rf ~/.npm/_npx`
- **Partial**: Re-run: `npx --yes --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp`
- **Outdated**: Update version tag in MCP config

---

### 3. Agent Configuration ✅

**Checks**:
- All 18 agents operational (8 core + 10 sub-agents)
- Agent definition syntax validity
- Auto-activation patterns configured
- Priority settings

**Example Output**:
```
🤖 Agent Configuration
  Agents:    18/18 operational
  Auto-Act:  ✓ Configured
  Health:    ████████████████████ 100/100
```

**Actions**:
- **Failed**: Check agent files for syntax errors
- **Degraded**: Some agents have invalid definitions
- **Auto-activation missing**: Update AGENT_TRIGGERS.md

---

### 4. MCP Server Connections ✅

**Checks**:
- 29 MCP tools accessible
- Connection latency (<100ms expected)
- Server health status
- Tool availability

**Example Output**:
```
🔌 MCP Servers
  Tools:     29/29 accessible
  Latency:   47ms
  Status:    ✓ All operational
  Health:    ████████████████████ 100/100
```

**Actions**:
- **Some down**: Restart affected MCP servers
- **All down**: Check MCP configuration
- **High latency**: Investigate network or server performance

---

### 5. RAG Connectivity ✅

**Checks**:
- GraphRAG (Neo4j) connection status
- Vector store (Supabase) connection status
- RAG Router operational
- Pattern search service functional

**Example Output**:
```
🧠 RAG Connectivity
  GraphRAG:  ⚠ Timeout
  Vector:    ✓ Connected (52ms)
  Router:    ✓ Operational (fallback to vector)
  Search:    ✓ Operational
  Health:    ████████████████░░░░ 85/100
```

**Actions**:
- **GraphRAG timeout**: Run `pnpm run rag:start`
- **Vector store failed**: Check Supabase connection
- **Router failed**: Reinstall framework
- **Pattern search failed**: Check RAG configuration

---

### 6. Dependencies Health ✅

**Checks**:
- Security vulnerabilities (critical, high)
- Peer dependencies installed
- Version compatibility (Node.js, TypeScript)
- Lock file integrity

**Example Output**:
```
📦 Dependencies
  Security:  ✓ No issues
  Peers:     ✓ Installed
  Compat:    ✓ Valid
  Lock:      ✓ Valid
  Health:    ████████████████████ 100/100
```

**Actions**:
- **Critical vulnerabilities**: Run `pnpm audit fix` immediately
- **High vulnerabilities**: Update dependencies
- **Missing peers**: Run `npm install`
- **Incompatible versions**: Update Node.js or TypeScript

---

### 7. Context Detection ✅

**Checks**:
- Current context (FRAMEWORK_CONTEXT vs PROJECT_CONTEXT)
- Isolation boundaries enforced
- Configuration loaded correctly
- No context mixing detected

**Example Output**:
```
🔒 Context Detection
  Context:   User Project
  Isolation: ✓ Enforced
  Config:    ✓ Loaded
  Mixing:    ✓ None
  Health:    ████████████████████ 100/100
```

**Actions**:
- **Unknown context**: Check package.json for framework dependency
- **Isolation not enforced**: Check hooks directory
- **Config not loaded**: Create CLAUDE.md in project root
- **Context mixing detected**: Remove framework source files from project

---

## Health Scores

### Overall Health

| Score | Status | Meaning |
|-------|--------|---------|
| 90-100 | 🟢 Excellent | Framework is healthy, no action needed |
| 75-89 | 🟡 Good | Minor issues, no immediate action required |
| 50-74 | 🟠 Degraded | Attention needed, some features may not work |
| 0-49 | 🔴 Critical | Immediate action required, framework may not function |

### Component Health

Each component (version, installation, agents, etc.) has its own health score (0-100). The overall health is a **weighted average**:

- Installation: 20% (most critical)
- Dependencies: 15%
- Version: 15%
- Agents: 15%
- RAG: 15%
- MCP: 10%
- Context: 10%

---

## Auto-Fix System

The coherence checker can automatically fix many common issues.

### How It Works

1. **Issue Detection**: Coherence check identifies issues
2. **Confidence Scoring**: Each fix has a confidence score (0-100%)
3. **Threshold Check**: Only fixes with ≥90% confidence are auto-applied
4. **Execution**: Fix commands run automatically
5. **Verification**: Results logged and reported

### Auto-Fixable Issues

| Issue | Fix Action | Confidence | Duration |
|-------|-----------|-----------|----------|
| GraphRAG timeout | `pnpm run rag:start` | 85% | 1 min |
| Outdated build | `pnpm run build` | 90% | 2 min |
| Missing dependencies | `npm install` | 90% | 3 min |
| Security vulnerabilities | `pnpm audit fix` | 95% | 1.5 min |

### Manual Fixes Required

Some issues cannot be auto-fixed and require manual intervention:

- **Version updates** - Requires review of breaking changes
- **Corrupted installation** - Requires full reinstall
- **Context mixing** - Requires file cleanup
- **Agent syntax errors** - Requires code fixes

---

## Proactive Monitoring

VERSATIL Guardian automatically monitors framework health in user projects.

### Daily Health Checks

Guardian performs automatic health checks every 24 hours:
- Version alignment check
- Installation integrity check
- Critical issue detection
- Trend analysis

### Notifications

Guardian will notify you when:
- ⚠️ New framework version available
- ⚠️ Critical or high-priority issues detected
- ⚠️ Framework health degraded below 75%

### Auto-Remediation

Guardian can automatically apply fixes with ≥90% confidence:
- Restart GraphRAG on timeout
- Rebuild outdated TypeScript
- Fix security vulnerabilities (safe updates)

**Configuration**:
```typescript
// .versatil/config/guardian.json
{
  "user_coherence": {
    "check_interval_hours": 24,
    "notify_on_updates": true,
    "notify_on_issues": true,
    "auto_fix_threshold": 90,
    "enable_trend_analysis": true
  }
}
```

---

## Health Trends

Track framework health over time with trend analysis.

### Metrics Tracked

- Overall health score (7-day, 30-day averages)
- Issues detected vs resolved
- Version staleness (how far behind latest)
- Component-level health trends

### View Trends

```bash
# In Claude session
/guardian trends

# CLI
npx versatil doctor --trends
```

**Example Output**:
```
📊 Health Trends (Last 7 Days)

  Current Health:  94/100 (Excellent)
  7-Day Average:   92/100
  30-Day Average:  89/100
  Trend:           ↗ Improving

  Issues:
  - Detected:      3
  - Resolved:      2
  - Remaining:     1

  Version:
  - Current:       v7.8.0
  - Behind by:     0 major, 1 minor, 0 patch
```

---

## Common Scenarios

### Scenario 1: Framework Update Available

**Check Output**:
```
📦 Version Status
  Installed: v7.8.0
  Latest:    v7.9.0
  Status:    ⚠ Minor update available
```

**Action**:
```bash
# Review changes
npm view @versatil/sdlc-framework@7.9.0

# Update
npm install @versatil/sdlc-framework@latest

# Verify
npx versatil doctor
```

---

### Scenario 2: GraphRAG Connection Failed

**Check Output**:
```
🧠 RAG Connectivity
  GraphRAG:  ✗ Failed
  Vector:    ✓ Connected
  Router:    ✓ Operational (fallback to vector)
```

**Action**:
```bash
# Auto-fix (recommended)
npx versatil doctor --fix

# Or manually
pnpm run rag:start

# Verify
npx versatil doctor
```

---

### Scenario 3: Security Vulnerabilities

**Check Output**:
```
📦 Dependencies
  Security:  ✗ 2 critical, 5 high
  Health:    ████░░░░░░░░░░░░░░░░ 30/100
```

**Action**:
```bash
# Auto-fix (recommended)
npx versatil doctor --fix

# Or manually
pnpm audit fix

# If force needed
pnpm audit fix --force

# Verify
npx versatil doctor
```

---

### Scenario 4: Corrupted Installation

**Check Output**:
```
📁 Installation Integrity
  Files:     847/1,247 present
  Structure: ✗ Invalid
  Missing:   .claude/agents, dist/
  Health:    ████░░░░░░░░░░░░░░░░ 30/100
```

**Action**:
```bash
# Reinstall framework
npm install @versatil/sdlc-framework

# Verify
npx versatil doctor
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed troubleshooting guides.

### Quick Troubleshooting

**Problem**: `npx versatil doctor` command not found

**Solution**: Ensure `@versatil/sdlc-framework` is installed:
```bash
npm install @versatil/sdlc-framework
```

---

**Problem**: Health check times out

**Solution**: Run quick check instead:
```bash
npx versatil doctor --quick
```

---

**Problem**: Auto-fixes fail

**Solution**: Check logs and apply fixes manually:
```bash
# View logs
cat ~/.versatil/logs/guardian/user-coherence-*.log

# Apply fixes from recommendations
```

---

## Best Practices

### 1. Regular Health Checks

Run health checks:
- **Before starting work** - Ensure framework is healthy
- **After updates** - Verify update succeeded
- **Weekly** - Catch issues early

```bash
# Before work
npx versatil doctor --quick

# Full check weekly
npx versatil doctor
```

---

### 2. Keep Framework Updated

Stay within **1 minor version** of latest:
- Patch updates: Apply immediately (bug fixes)
- Minor updates: Apply within 1 week (new features)
- Major updates: Review breaking changes, plan migration

---

### 3. Enable Auto-Fix

Use auto-fix for routine maintenance:
```bash
npx versatil doctor --fix
```

Only requires manual intervention for:
- Major version updates
- Corrupted installations
- Custom configurations

---

### 4. Monitor Trends

Review health trends monthly:
```bash
npx versatil doctor --trends
```

Investigate if:
- Health degrading over time
- Consistent issues appearing
- Version staleness increasing

---

## Related Commands

| Command | Purpose | Context |
|---------|---------|---------|
| `/coherence` | Health check in Claude session | Claude |
| `npx versatil doctor` | Health check from terminal | CLI |
| `/assess` | Readiness check before work | Claude |
| `/monitor` | Real-time monitoring | Claude |
| `/guardian` | Guardian control | Claude |

---

## Support

**Documentation**:
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Guardian Integration](./GUARDIAN_INTEGRATION.md)
- [Framework Architecture](./VERSATIL_ARCHITECTURE.md)

**Issues**:
- Report bugs: [GitHub Issues](https://github.com/Nissimmiracles/versatil-sdlc-framework/issues)
- Ask questions: [GitHub Discussions](https://github.com/Nissimmiracles/versatil-sdlc-framework/discussions)

**Community**:
- Discord: [VERSATIL Community](#)
- Twitter: [@VERSATILFramework](#)

---

## Version History

### v7.9.0 (2025-10-28)
- Initial release of User Coherence system
- `/coherence` slash command
- `npx versatil doctor` CLI command
- Guardian user coherence monitoring
- Health trend analysis
- Auto-fix system

---

**Next Steps**: Read [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed issue resolution guides.
