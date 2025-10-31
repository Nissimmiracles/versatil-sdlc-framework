# VERSATIL Framework Troubleshooting Guide

**Version**: 7.16.1
**Last Updated**: 2025-10-31

## Overview

This guide provides detailed troubleshooting steps for common VERSATIL framework issues. Use this when:
- Health checks report issues
- Framework features not working as expected
- Installation or configuration problems
- Performance degradation

**Note**: As of v7.16.1, VERSATIL uses **npx** for MCP server execution (no installation required). Legacy `npm install` commands in this guide refer to development setup only.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Version & Update Issues](#version--update-issues)
3. [Agent Issues](#agent-issues)
4. [RAG Connectivity Issues](#rag-connectivity-issues)
5. [MCP Server Issues](#mcp-server-issues)
6. [Dependency Issues](#dependency-issues)
7. [Context & Configuration Issues](#context--configuration-issues)
8. [Performance Issues](#performance-issues)
9. [Build & Compilation Issues](#build--compilation-issues)
10. [Emergency Recovery](#emergency-recovery)

---

## Installation Issues

### Issue: MCP Server Not Running

**Symptoms**:
```bash
# MCP server not responding
# Tools not available in Claude Desktop/Cursor
```

**Solution**:
```bash
# Run VERSATIL MCP Server
npx --yes --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp

# Or add to Claude Desktop config
# See: docs/INSTALLATION.md
```

---

### Issue: Corrupted Installation

**Symptoms**:
- Health check reports missing files
- Commands not working
- Import errors

**Health Check Output**:
```
📁 Installation Integrity
  Files:     600/1,247 present
  Structure: ✗ Invalid
  Status:    Corrupted
```

**Solution**:
```bash
# Remove existing installation
npm uninstall @versatil/sdlc-framework

# Clear npm cache
npm cache clean --force

# Clear npx cache and re-run
rm -rf ~/.npm/_npx
npx --yes --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp

# Verify
npx versatil doctor
```

---

### Issue: Partial Installation

**Symptoms**:
- Some features work, others don't
- Health check reports <90% files present

**Solution**:
```bash
# Reinstall without removing
npm install @versatil/sdlc-framework --force

# Verify
npx versatil doctor
```

---

## Version & Update Issues

### Issue: Framework Version Outdated

**Symptoms**:
- Health check shows "major/minor update available"
- Missing new features from documentation

**Solution**:
```bash
# Check current version
npm list @versatil/sdlc-framework

# Check latest version
npm view @versatil/sdlc-framework version

# Update (patch/minor - safe)
npm update @versatil/sdlc-framework

# Update (major - review breaking changes first)
npm view @versatil/sdlc-framework@8.0.0  # Review changes
npm install @versatil/sdlc-framework@latest

# Verify
npx versatil doctor
```

---

### Issue: Update Failed or Incomplete

**Symptoms**:
- Update command succeeded but version unchanged
- Post-update health check fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules

# Remove package-lock.json
rm package-lock.json

# Reinstall all dependencies
npm install

# Verify
npx versatil doctor
```

---

### Issue: Breaking Changes After Update

**Symptoms**:
- Framework not working after major update
- Import errors or API changes

**Solution**:
```bash
# Rollback to previous version
npm install @versatil/sdlc-framework@7.8.0

# Or fix breaking changes (check CHANGELOG)
# https://github.com/Nissimmiracles/versatil-sdlc-framework/blob/main/CHANGELOG.md

# View migration guide
cat node_modules/@versatil/sdlc-framework/docs/MIGRATION_*.md
```

---

## Agent Issues

### Issue: No Agents Operational

**Symptoms**:
- Health check shows 0/18 agents operational
- Agent commands not working

**Health Check Output**:
```
🤖 Agent Configuration
  Agents:    0/18 operational
  Status:    Failed
```

**Solution**:
```bash
# Check if agents directory exists
ls node_modules/@versatil/sdlc-framework/.claude/agents/

# If missing, reinstall
npm install @versatil/sdlc-framework --force

# Verify
npx versatil doctor
```

---

### Issue: Some Agents Not Working

**Symptoms**:
- Health check shows <18 agents operational
- Specific agents fail when invoked

**Solution**:
```bash
# Check agent definitions for syntax errors
cat node_modules/@versatil/sdlc-framework/.claude/agents/*.md

# Look for:
# - Missing required fields (role, context, tools)
# - Malformed markdown
# - Invalid YAML frontmatter

# If found, report issue on GitHub
# For now, reinstall
npm install @versatil/sdlc-framework --force
```

---

### Issue: Agent Auto-Activation Not Working

**Symptoms**:
- Agents don't activate automatically on file edits
- Must manually invoke agents with slash commands

**Solution**:
```bash
# Check if AGENT_TRIGGERS.md exists
cat node_modules/@versatil/sdlc-framework/.claude/AGENT_TRIGGERS.md

# Check if hooks are installed
ls node_modules/@versatil/sdlc-framework/.claude/hooks/

# Reinstall if missing
npm install @versatil/sdlc-framework --force

# Verify auto-activation configuration
npx versatil doctor
```

---

## RAG Connectivity Issues

### Issue: GraphRAG Connection Timeout

**Symptoms**:
- Health check shows GraphRAG timeout/failed
- Pattern search slower than expected

**Health Check Output**:
```
🧠 RAG Connectivity
  GraphRAG:  ✗ Timeout
  Vector:    ✓ Connected
  Router:    ✓ Operational (fallback to vector)
```

**Solution**:
```bash
# Auto-fix (recommended)
npx versatil doctor --fix

# Or manually restart GraphRAG
npm run rag:start

# Check Neo4j container status
docker ps | grep neo4j

# If container not running, start it
docker start versatil-neo4j

# Verify
npx versatil doctor
```

---

### Issue: Vector Store Connection Failed

**Symptoms**:
- Health check shows vector store failed
- RAG operations completely broken

**Solution**:
```bash
# Check Supabase configuration
cat .env | grep SUPABASE

# Verify credentials
# SUPABASE_URL=https://...
# SUPABASE_KEY=...

# Test connection manually
curl -H "apikey: YOUR_KEY" YOUR_SUPABASE_URL/rest/v1/

# If credentials invalid, update .env
# Then restart
npm run rag:restart

# Verify
npx versatil doctor
```

---

### Issue: Both GraphRAG and Vector Store Failed

**Symptoms**:
- All RAG operations fail
- Pattern search unavailable

**Solution**:
```bash
# Check RAG configuration
cat .versatil/config/rag.json

# Reset RAG system
npm run rag:reset

# Reinitialize
npm run rag:init

# Verify
npx versatil doctor
```

---

## MCP Server Issues

### Issue: Some MCP Tools Unavailable

**Symptoms**:
- Health check shows <29 tools accessible
- Specific MCP operations fail

**Solution**:
```bash
# List MCP servers
cat .claude/mcp.json

# Check server status
# (depends on your MCP server implementation)

# Restart MCP servers
# (depends on your MCP server implementation)

# Verify
npx versatil doctor
```

---

### Issue: High MCP Connection Latency

**Symptoms**:
- Health check shows latency >100ms
- Slow MCP operations

**Solution**:
```bash
# Check network connectivity
ping your-mcp-server-host

# Check MCP server load
# (depends on your MCP server implementation)

# Restart MCP servers if needed
# (depends on your MCP server implementation)

# Consider using local MCP servers instead of remote
```

---

## Dependency Issues

### Issue: Critical Security Vulnerabilities

**Symptoms**:
- Health check shows critical vulnerabilities
- npm audit reports issues

**Health Check Output**:
```
📦 Dependencies
  Security:  ✗ 3 critical
  Health:    ████░░░░░░░░░░░░░░░░ 30/100
```

**Solution**:
```bash
# Auto-fix (recommended)
npx versatil doctor --fix

# Or manually
npm audit fix

# If force needed
npm audit fix --force

# Verify
npx versatil doctor
```

---

### Issue: Peer Dependency Warnings

**Symptoms**:
- npm warnings about peer dependencies
- Some features not working

**Solution**:
```bash
# Install peer dependencies
npm install --save-dev @types/node typescript

# For specific warnings
npm install <missing-peer-dependency>

# Verify
npx versatil doctor
```

---

### Issue: Version Compatibility Issues

**Symptoms**:
- Health check shows version incompatibility
- TypeScript or Node.js version errors

**Solution**:
```bash
# Check current versions
node --version   # Should be ≥18.0.0
npx tsc --version  # Should be ≥5.0.0

# Update Node.js (if needed)
# Use nvm:
nvm install 20
nvm use 20

# Or download from: https://nodejs.org/

# Update TypeScript
npm install --save-dev typescript@latest

# Verify
npx versatil doctor
```

---

## Context & Configuration Issues

### Issue: Context Not Detected

**Symptoms**:
- Health check shows "unknown" context
- Framework features behave incorrectly

**Solution**:
```bash
# Check package.json for framework dependency
cat package.json | grep @versatil/sdlc-framework

# If missing, install it
npm install @versatil/sdlc-framework

# Verify
npx versatil doctor
```

---

### Issue: Context Isolation Not Enforced

**Symptoms**:
- Health check shows isolation not enforced
- Unexpected framework behavior

**Solution**:
```bash
# Check if hooks exist
ls node_modules/@versatil/sdlc-framework/.claude/hooks/

# Reinstall if missing
npm install @versatil/sdlc-framework --force

# Verify
npx versatil doctor
```

---

### Issue: Configuration Not Loaded

**Symptoms**:
- Health check shows config not loaded
- Custom settings not applied

**Solution**:
```bash
# Check if CLAUDE.md exists in project root
ls CLAUDE.md

# If missing, create it
cat > CLAUDE.md << 'EOF'
# Your Project Configuration

## Agents
- Maria-QA: Enabled
- James-Frontend: Enabled
...
EOF

# Verify
npx versatil doctor
```

---

### Issue: Context Mixing Detected

**Symptoms**:
- Health check shows context mixing
- Framework source code in user project

**Solution**:
```bash
# This is critical - remove framework source files
# Check what's detected:
find . -name "guardian" -type d

# If you see:
# ./src/agents/guardian/  ← This should NOT be in user project

# Remove it (BE CAREFUL - only remove if you're in user project)
rm -rf src/agents/guardian/

# Verify
npx versatil doctor
```

---

## Performance Issues

### Issue: Slow Health Checks

**Symptoms**:
- `npx versatil doctor` takes >30 seconds
- Health checks timeout

**Solution**:
```bash
# Use quick check instead
npx versatil doctor --quick

# Or check specific components:
# - Version check only: <5s
# - Installation check: <10s
# - Full check: <15s expected

# If still slow, check:
# 1. Network connectivity (npm registry, RAG servers)
# 2. Disk I/O (SSD recommended)
# 3. System resources (CPU, memory)
```

---

### Issue: Slow RAG Operations

**Symptoms**:
- Pattern search takes >5 seconds
- `/plan` command very slow

**Solution**:
```bash
# Check RAG connectivity
npx versatil doctor

# If GraphRAG timeout, restart it
npm run rag:start

# If Vector store slow, check Supabase status
# https://status.supabase.com/

# Consider using GraphRAG only (faster, offline)
# Edit .versatil/config/rag.json:
{
  "primary_store": "graphrag",
  "fallback_enabled": false
}
```

---

### Issue: High Memory Usage

**Symptoms**:
- System running out of memory
- Framework consuming >2GB RAM

**Solution**:
```bash
# Check memory usage
ps aux | grep node

# Reduce RAG cache size
# Edit .versatil/config/rag.json:
{
  "cache_size_mb": 256  # Default: 512
}

# Disable trend analysis if not needed
# Edit .versatil/config/guardian.json:
{
  "user_coherence": {
    "enable_trend_analysis": false
  }
}
```

---

## Build & Compilation Issues

### Issue: Outdated Build Files

**Symptoms**:
- Health check shows "outdated" compilation
- Runtime errors from stale code

**Solution**:
```bash
# Auto-fix (recommended)
npx versatil doctor --fix

# Or manually rebuild
cd node_modules/@versatil/sdlc-framework
npm run build

# Verify
npx versatil doctor
```

---

### Issue: Build Missing Entirely

**Symptoms**:
- Health check shows "missing" compilation
- Import errors for dist/ files

**Solution**:
```bash
# Rebuild framework
cd node_modules/@versatil/sdlc-framework
npm install
npm run build

# Verify
npx versatil doctor
```

---

### Issue: TypeScript Compilation Errors

**Symptoms**:
- Build fails with TypeScript errors
- Cannot rebuild framework

**Solution**:
```bash
# Check TypeScript version
npx tsc --version  # Should be ≥5.0.0

# Update TypeScript if needed
npm install --save-dev typescript@latest

# Retry build
cd node_modules/@versatil/sdlc-framework
npm run build

# If still failing, report issue on GitHub
```

---

## Emergency Recovery

### Full Framework Reset

**When to use**:
- Multiple critical issues detected
- Framework completely non-functional
- All other troubleshooting failed

**Steps**:
```bash
# 1. Backup your project (important!)
cp -r . ../my-project-backup

# 2. Remove framework completely
npm uninstall @versatil/sdlc-framework

# 3. Clear all caches
npm cache clean --force
rm -rf node_modules
rm package-lock.json

# 4. Clear VERSATIL state
rm -rf .versatil/

# 5. Reinstall from scratch
npm install

# 6. Verify
npx versatil doctor

# 7. If still broken, report issue on GitHub
```

---

### Rollback to Last Known Good Version

**When to use**:
- Recent update broke framework
- Need to quickly restore functionality

**Steps**:
```bash
# 1. Check current version
npm list @versatil/sdlc-framework

# 2. Install previous version
npm install @versatil/sdlc-framework@7.8.0

# 3. Verify
npx versatil doctor

# 4. Report update issue on GitHub
```

---

### Clean Slate Installation

**When to use**:
- Starting new project
- Setting up VERSATIL for first time

**Steps**:
```bash
# 1. Create new project
mkdir my-project
cd my-project
npm init -y

# 2. Install VERSATIL
npm install @versatil/sdlc-framework

# 3. Initialize configuration
cat > CLAUDE.md << 'EOF'
# My Project

Generated by VERSATIL Onboarding Wizard
EOF

# 4. Verify
npx versatil doctor

# 5. All checks should pass with 100% health
```

---

## Getting Help

### Before Asking for Help

1. **Run health check**:
   ```bash
   npx versatil doctor > health-report.txt
   ```

2. **Check logs**:
   ```bash
   cat ~/.versatil/logs/guardian/user-coherence-*.log
   ```

3. **Gather system info**:
   ```bash
   node --version
   npm --version
   npx tsc --version
   uname -a
   ```

### Where to Get Help

**GitHub Issues** (preferred):
- Bug reports: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- Feature requests: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- Questions: https://github.com/Nissimmiracles/versatil-sdlc-framework/discussions

**Include in Your Report**:
- Health check output (`npx versatil doctor`)
- Error messages (full stack trace)
- Steps to reproduce
- System information (Node.js version, OS)
- Framework version

---

## Common Error Messages

### "Cannot find module '@versatil/sdlc-framework'"

**Cause**: Framework not installed or corrupted

**Solution**: Reinstall framework
```bash
npm install @versatil/sdlc-framework
```

---

### "ECONNREFUSED" or "Connection timeout"

**Cause**: RAG servers (Neo4j, Supabase) not accessible

**Solution**: Restart RAG services
```bash
npm run rag:start
npx versatil doctor
```

---

### "Permission denied"

**Cause**: Insufficient permissions to access files

**Solution**: Check file permissions
```bash
chmod -R 755 node_modules/@versatil/sdlc-framework
```

---

### "Out of memory"

**Cause**: Framework consuming too much memory

**Solution**: Reduce cache sizes, disable features
```bash
# Edit .versatil/config/rag.json
{ "cache_size_mb": 256 }

# Edit .versatil/config/guardian.json
{ "user_coherence": { "enable_trend_analysis": false } }
```

---

## Prevention Best Practices

1. **Regular health checks** - Run `npx versatil doctor` weekly
2. **Keep updated** - Stay within 1 minor version of latest
3. **Monitor trends** - Review `npx versatil doctor --trends` monthly
4. **Enable auto-fix** - Let Guardian automatically fix issues
5. **Backup before updates** - Always backup before major updates

---

## Related Documentation

- [User Coherence Guide](./USER_COHERENCE_GUIDE.md)
- [Guardian Integration](./GUARDIAN_INTEGRATION.md)
- [Framework Architecture](./VERSATIL_ARCHITECTURE.md)
- [Changelog](../CHANGELOG.md)

---

**Last Updated**: 2025-10-28
**Version**: 7.9.0
