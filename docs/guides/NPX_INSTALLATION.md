# npx Installation Guide for VERSATIL MCP

**Version**: 7.16.1 | **Last Updated**: 2025-10-31

Complete guide to installing and running VERSATIL MCP Server using npx (no installation required).

---

## 🚀 Why npx?

| Feature | npx | npm install |
|---------|-----|-------------|
| **Installation Time** | 2-3 min | 10-15 min |
| **Disk Space** | Cached (~200MB) | 1-2GB per project |
| **Updates** | Automatic (on demand) | Manual (`npm update`) |
| **Global Pollution** | None | Can conflict |
| **Version Control** | Pin to any tag/commit | Requires package.json |
| **MCP Use Case** | ✅ Perfect | ⚠️ Overkill |

**Recommendation**: Use npx for MCP servers. Use `git clone + npm install` only for framework development.

---

## Quick Start

### One-Line Command

```bash
npx --yes --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp
```

**What happens:**
1. npx downloads the framework from GitHub (2-3 min first time)
2. Caches it locally for future runs
3. Executes `versatil-mcp` binary
4. MCP server starts with 32 tools (coding profile)

---

## Claude Desktop Configuration

Add to Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "versatil": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1",
        "versatil-mcp"
      ]
    }
  }
}
```

**Restart Claude Desktop** after saving.

---

## Cursor IDE Configuration

Add to `.cursor/mcp_config.json` in your project:

```json
{
  "mcpServers": {
    "versatil": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1",
        "versatil-mcp"
      ]
    }
  }
}
```

**Restart Cursor** (Cmd/Ctrl+Q, then reopen).

---

## Version Management

### Pin to Specific Version (Recommended)

```bash
# Use exact release tag
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp

# Pros: Stable, reproducible, tested
# Cons: Requires manual updates
```

### Use Latest from Main Branch

```bash
# Always use bleeding edge
npx --package=github:Nissimmiracles/versatil-sdlc-framework#main versatil-mcp

# Pros: Latest features
# Cons: May be unstable, cache invalidation issues
```

### Use Specific Commit

```bash
# Pin to exact commit SHA
npx --package=github:Nissimmiracles/versatil-sdlc-framework#8d8ff99 versatil-mcp

# Pros: Reproducible, exact state
# Cons: Requires knowing commit SHA
```

### Check Available Versions

```bash
# List all GitHub releases
gh release list --repo Nissimmiracles/versatil-sdlc-framework

# Or visit: https://github.com/Nissimmiracles/versatil-sdlc-framework/releases
```

---

## Cache Management

### Where npx Stores Cache

**macOS/Linux**: `~/.npm/_npx/`
**Windows**: `%USERPROFILE%\.npm\_npx\`

### Clear npx Cache

```bash
# Clear all npx cache
rm -rf ~/.npm/_npx

# Or just VERSATIL cache
rm -rf ~/.npm/_npx/*/node_modules/.cache/github*versatil*
```

**When to clear:**
- Switching between versions frequently
- Disk space issues
- Corruption (rare)

### Check Cache Size

```bash
du -sh ~/.npm/_npx
```

---

## Upgrading

### To New Version

```bash
# Step 1: Update your config to new version
# Change: #v7.16.1 → #v7.17.0

# Step 2: Clear npx cache (optional but recommended)
rm -rf ~/.npm/_npx

# Step 3: Run with new version
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.17.0 versatil-mcp
```

### Automatic Updates

npx does **NOT** auto-update. This is by design:
- Prevents breaking changes
- Reproducible environments
- Explicit version control

To "auto-update", use `#main` instead of `#v7.16.1` (not recommended for production).

---

## Troubleshooting

### Issue: "Failed to download package"

**Cause**: GitHub rate limiting or network issues

**Solutions**:
```bash
# 1. Wait 5 minutes and retry
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp

# 2. Use GitHub token (if rate limited)
export GITHUB_TOKEN=ghp_your_token_here
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp

# 3. Check GitHub status
curl https://www.githubstatus.com/api/v2/status.json
```

### Issue: "command not found: versatil-mcp"

**Cause**: Package doesn't have `versatil-mcp` binary at specified version

**Solutions**:
```bash
# 1. Check available binaries
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 --help

# 2. Verify version exists
gh release view v7.16.1 --repo Nissimmiracles/versatil-sdlc-framework

# 3. Try latest stable
npx --package=github:Nissimmiracles/versatil-sdlc-framework#main versatil-mcp
```

### Issue: npx Using Old Cached Version

**Cause**: npx cache not invalidating

**Solution**:
```bash
# Clear cache and force re-download
rm -rf ~/.npm/_npx
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp
```

### Issue: "ProfileManager config not found"

**Cause**: v7.16.0 bug (fixed in v7.16.1)

**Solution**:
```bash
# Upgrade to v7.16.1+
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp
```

### Issue: Slow First Run

**Expected behavior**: First run takes 2-3 minutes

**Why**:
- Downloads ~200MB from GitHub
- Installs dependencies in cache
- Builds TypeScript (if needed)

**Subsequent runs**: <1 second (uses cache)

---

## Advanced Configuration

### Custom Profile

```bash
# Start with ML profile (59 tools)
MCP_PROFILE=ml npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp

# Start with testing profile (32 tools)
MCP_PROFILE=testing npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp
```

### Custom Config Path

```bash
# Use custom config file
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp --config=/path/to/mcp-profiles.config.json
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=versatil:* npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp
```

---

## Performance Benchmarks

### Installation Time Comparison

| Method | First Run | Subsequent | Disk Space |
|--------|-----------|------------|------------|
| **npx (recommended)** | 2-3 min | <1 sec | ~200MB cached |
| npm install (GitHub) | 10-15 min | N/A | 1-2GB per project |
| git clone + npm install | 12-18 min | N/A | 2-3GB |

### Startup Time (v7.16.1)

| Profile | Tools | Startup Time | Memory |
|---------|-------|--------------|--------|
| coding | 32 | 7ms | ~150MB |
| testing | 32 | 7ms | ~180MB |
| ml | 59 | 7ms | ~250MB |
| full | 82 | 8ms | ~300MB |

**Note**: v7.16.0 introduced profile-based loading (286x faster than v7.15.0)

---

## Comparison with Other Methods

### vs npm install

❌ **npm install @versatil/sdlc-framework**
- Package not published to npm registry
- Last published: v7.10.2 (outdated)

❌ **npm install git+https://github.com/...**
- 10-15 minutes installation
- 1-2GB per project
- Adds to package.json dependencies
- Times out frequently

✅ **npx (recommended)**
- 2-3 minutes first run
- Cached for instant subsequent runs
- No project dependencies
- Always works with latest GitHub releases

### vs git clone

**git clone** is better for:
- Framework development
- Customization
- Contributing PRs
- Local testing

**npx** is better for:
- Running MCP servers
- Production use
- CI/CD pipelines
- Quick testing

---

## FAQ

### Q: Does npx work offline?

**A**: Yes, if you've run the command before. npx uses cached version.

```bash
# Test offline mode
# 1. Run once with internet
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp

# 2. Disconnect internet
# 3. Run again (uses cache)
npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-mcp
```

### Q: Can I use npx in CI/CD?

**A**: Yes! npx is perfect for CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run VERSATIL tests
  run: |
    npx --yes --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil test
```

### Q: Does npx support private repos?

**A**: Yes, with GitHub token:

```bash
# Set GitHub token
export GITHUB_TOKEN=ghp_your_token_here

# Run from private repo
npx --package=github:YourOrg/private-repo#v1.0.0 versatil-mcp
```

### Q: How do I rollback to previous version?

**A**: Just change the version in your config:

```json
{
  "mcpServers": {
    "versatil": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=github:Nissimmiracles/versatil-sdlc-framework#v7.15.0",
        "versatil-mcp"
      ]
    }
  }
}
```

### Q: Can I run multiple versions simultaneously?

**A**: Yes! Each MCP server runs independently:

```json
{
  "mcpServers": {
    "versatil-stable": {
      "command": "npx",
      "args": ["--package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1", "versatil-mcp"]
    },
    "versatil-beta": {
      "command": "npx",
      "args": ["--package=github:Nissimmiracles/versatil-sdlc-framework#main", "versatil-mcp"]
    }
  }
}
```

---

## Next Steps

1. ✅ Install using npx
2. 📚 Read [MCP Setup Guide](CURSOR_MCP_SETUP.md)
3. 🎯 Try [Quick Start Tutorial](../getting-started/quick-start.md)
4. 🤖 Learn about [OPERA Agents](../agents/README.md)
5. 🔍 Explore [Pattern Library](../mcp/MCP_PATTERN_LIBRARY_GUIDE.md)

---

## Support

- **Documentation**: [docs.versatil.ai](https://github.com/Nissimmiracles/versatil-sdlc-framework/tree/main/docs)
- **Issues**: [GitHub Issues](https://github.com/Nissimmiracles/versatil-sdlc-framework/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Nissimmiracles/versatil-sdlc-framework/discussions)
