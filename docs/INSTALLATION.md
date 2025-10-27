# VERSATIL Framework Installation Guide

**Version**: 7.5.1 | **Last Updated**: 2025-10-27

Choose your installation path based on how you want to use VERSATIL:

---

## Choose Your Path

### 🎯 Path 1: Cursor Users (MCP Integration)
**Best for**: Claude Desktop + Cursor IDE users
**Installation Time**: 2 minutes
**Requirements**: Claude Desktop, Cursor IDE, Node.js 18+

[→ Jump to Cursor MCP Setup](#cursor-mcp-setup)

---

### 🖥️ Path 2: Terminal/CLI Users
**Best for**: Terminal workflows, other IDEs, CI/CD
**Installation Time**: 5 minutes
**Requirements**: Node.js 18+, npm 9+

[→ Jump to CLI Installation](#cli-installation)

---

## Cursor MCP Setup

### Prerequisites

- **Claude Desktop** installed ([download](https://claude.ai/download))
- **Cursor IDE** installed ([download](https://cursor.sh))
- **Node.js** 18.0.0+ ([download](https://nodejs.org))

### Step 1: Clone Repository

```bash
git clone https://github.com/Nissimmiracles/versatil-sdlc-framework.git
cd versatil-sdlc-framework
```

### Step 2: Install Dependencies

```bash
npm install
npm run build
```

**Time**: 5-10 minutes

### Step 3: Configure MCP Server

The MCP configuration is already set up in `.cursor/mcp_config.json`. You just need to verify it points to the correct path:

```bash
# Check the config
cat .cursor/mcp_config.json
```

Expected output:
```json
{
  "mcpServers": {
    "claude-opera": {
      "command": "node",
      "args": ["<YOUR_PATH>/bin/versatil-mcp.js", "<YOUR_PATH>"],
      "cwd": "<YOUR_PATH>",
      "env": {
        "NODE_ENV": "production",
        "VERSATIL_MCP_MODE": "true"
      }
    }
  }
}
```

### Step 4: Update Paths (if needed)

If the paths don't match your installation:

```bash
# Run auto-fixer
node scripts/fix-mcp-configs.cjs
```

This will update:
- `.cursor/mcp_config.json`
- `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- Or equivalent Windows/Linux paths

### Step 5: Restart Claude Desktop & Cursor

```bash
# macOS
killall "Claude" "Cursor"
open -a "Claude"
open -a "Cursor"

# Or manually quit and reopen both applications
```

### Step 6: Verify MCP Connection

In Claude Desktop, try:
```
Call versatil_health_check
```

Expected response:
```json
{
  "status": "healthy",
  "version": "7.5.1",
  "lazyMode": true,
  "startupTime": "<500ms"
}
```

### Step 7: Test Agent Activation

In Cursor, create a test file:
```bash
echo "describe('test', () => {})" > test.spec.ts
```

Save the file. Maria-QA should auto-activate and provide quality feedback.

---

## CLI Installation

### Prerequisites

- **Node.js** 18.0.0+ ([download](https://nodejs.org))
- **npm** 9.0.0+ (comes with Node.js)
- **Git** (for cloning repository)

### Step 1: Install Globally via npm

```bash
# Install VERSATIL globally
npm install -g @versatil/sdlc-framework

# Verify installation
versatil --version
# Expected: 7.5.1
```

**Alternative**: Use npx (no installation required)
```bash
npx @versatil/sdlc-framework init
```

### Step 2: Initialize Your Project

Navigate to your project directory and initialize VERSATIL:

```bash
cd /path/to/your/project
versatil init
```

**What `versatil init` does:**
1. ✅ Auto-detects your tech stack (React, Vue, Python, Node.js, etc.)
2. ✅ Recommends relevant agents from 18 available
3. ✅ Generates personalized 4-week roadmap (`docs/VERSATIL_ROADMAP.md`)
4. ✅ Creates `.versatil/config.json` configuration
5. ✅ Sets up quality gates (80%+ test coverage, WCAG 2.1 AA)

### Step 3: Configure Environment (Optional)

Create `.env` in your project root:

```bash
cat > .env << 'EOF'
# Framework Settings
VERSATIL_LOG_LEVEL=info
VERSATIL_AUTO_ACTIVATE=true
VERSATIL_MCP_ENABLED=false  # Set to true if using MCP

# Agent Settings
VERSATIL_AGENT_TIMEOUT=30000
VERSATIL_QUALITY_GATES=strict

# Optional: External Services
# GITHUB_TOKEN=your_github_token
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_key
EOF
```

### Step 4: Start Daemon (Optional - For Auto-Activation)

```bash
# Start daemon (agents auto-activate on file saves)
versatil-daemon start

# Check status
versatil-daemon status
# Expected: ✅ Daemon running (PID: xxxxx)
```

**What the daemon does:**
- 👀 Watches project files
- 🤖 Auto-activates relevant agents when you save files
- ⚡ Runs quality gates before commits
- 📊 Provides real-time feedback

### Step 5: Verify Installation

```bash
# Run comprehensive health check
versatil doctor

# Expected output:
# ✅ Framework Status: OPERATIONAL
# ✅ Agents: 18/18 configured
# ✅ MCP Tools: 0/12 (CLI mode - MCP disabled)
# ✅ RAG Memory: Ready
# ✅ Quality Gates: Enforced
```

### Step 6: Test Basic Commands

```bash
# View available agents
versatil show-agents

# Generate development plan
versatil plan "Add user authentication"

# Execute work
versatil work todos/001-auth.md

# Check framework health
versatil doctor
```

---

## Verification

### Common Checks (Both Paths)

After installation, verify these items:

#### 1. Framework Health
```bash
npm run doctor  # (Cursor path)
versatil doctor  # (CLI path)

# Should show:
# ✅ All systems operational
# ✅ Agents configured
# ✅ Quality gates active
```

#### 2. Build Status
```bash
npm run build  # (Cursor path)
# No TypeScript errors
```

#### 3. Test Suite
```bash
npm test  # (Cursor path)
versatil test  # (CLI path)

# All tests should pass
```

#### 4. MCP Server (Cursor Path Only)
```bash
tail -f ~/.versatil/mcp-server.log

# Expected:
# ✅ MCP Server running
# ✅ Startup time: <500ms
```

#### 5. Agent Auto-Activation (Both Paths)
```bash
# Create test file
echo "describe('test', () => {})" > test.spec.ts

# Check logs
tail -f ~/.versatil/logs/agent-activation.log

# Expected:
# [timestamp] 🤖 Maria-QA activated (trigger: test.spec.ts)
```

---

## Troubleshooting

### Issue: npm install fails

**Symptoms**: Package installation errors, network timeouts

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install --verbose
```

---

### Issue: MCP server timeout (Cursor Path)

**Symptoms**: Claude Desktop shows "MCP server timeout"

**Solution**:
```bash
# Check server logs
tail -f ~/.versatil/mcp-server.log

# Reapply config fix
node scripts/fix-mcp-configs.cjs

# Restart clients
killall "Claude" "Cursor"
open -a "Claude"
```

**Expected**: Server should start in <500ms

---

### Issue: Agents not auto-activating

**Symptoms**: No agent activation on file save

**Solution**:
```bash
# Check daemon status
versatil-daemon status

# View logs
versatil-daemon logs

# Restart daemon
versatil-daemon restart
```

---

### Issue: Tests failing

**Symptoms**: Jest test failures, Playwright errors

**Solution**:
```bash
# Install Playwright browsers
npm run playwright:install

# Run tests individually
npm run test:unit           # Should pass
npm run test:integration    # May require setup
npm run test:e2e           # Requires Playwright
```

---

## Next Steps

### For Cursor Users

1. **Try Slash Commands** in Claude Desktop:
   ```
   /help                    # Framework help
   /plan "feature"         # Generate plan
   /work todos/xxx.md      # Execute work
   /monitor                # Health monitoring
   ```

2. **Review Your Roadmap**:
   ```bash
   cat docs/VERSATIL_ROADMAP.md
   ```

3. **Test Agent Auto-Activation**:
   - Edit a `*.test.ts` file → Maria-QA activates
   - Edit a `*.tsx` file → James-Frontend activates
   - Edit an API file → Marcus-Backend activates

### For CLI Users

1. **Generate Development Plan**:
   ```bash
   versatil plan "Add user authentication"
   ```

2. **Execute Work**:
   ```bash
   versatil work todos/001-auth.md
   ```

3. **Monitor Framework Health**:
   ```bash
   versatil monitor
   # Real-time TUI dashboard
   ```

4. **View Your Roadmap**:
   ```bash
   cat docs/VERSATIL_ROADMAP.md
   ```

---

## Additional Resources

### Documentation
- **[README.md](../README.md)** - Framework overview
- **[CLAUDE.md](../CLAUDE.md)** - OPERA methodology
- **[docs/VERSATIL_ARCHITECTURE.md](VERSATIL_ARCHITECTURE.md)** - Architecture guide
- **[docs/guides/compounding-engineering.md](guides/compounding-engineering.md)** - Compounding engineering

### Support
- **GitHub Issues**: [Report bugs](https://github.com/Nissimmiracles/versatil-sdlc-framework/issues)
- **Discussions**: [Ask questions](https://github.com/Nissimmiracles/versatil-sdlc-framework/discussions)

---

## Success Checklist

- [ ] Prerequisites installed (Node.js 18+, npm 9+)
- [ ] Repository cloned or npm package installed
- [ ] Dependencies installed successfully
- [ ] Build completed without errors
- [ ] Health check passes (`npm run doctor` or `versatil doctor`)
- [ ] MCP server running <500ms (Cursor path only)
- [ ] Agents can be invoked manually
- [ ] Tests pass
- [ ] Roadmap generated

**Estimated Total Time**:
- Cursor Path: ~10 minutes
- CLI Path: ~8 minutes

---

**Welcome to VERSATIL!** 🚀 Your AI-native SDLC framework is ready.
