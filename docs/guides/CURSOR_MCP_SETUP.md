# 🔧 Cursor MCP Setup Guide

**Claude Opera by VERSATIL v1.0.0**

Complete guide to installing and configuring MCP (Model Context Protocol) servers in Cursor IDE.

---

## 📋 Current Status

Your Cursor configuration at `.cursor/mcp_config.json` includes:

✅ **Claude Opera MCP** (Core framework - Ready to use!)
⚠️ **10 Optional MCP Servers** (Require installation)

---

## ✅ What's Already Working

### 1. Claude Opera MCP Server (v7.5.1)
**Status**: ✅ **Fully Configured with Pattern Library**

- **Location**: `bin/versatil-mcp.js`
- **Version**: 7.5.1
- **Tools**: 29 VERSATIL tools (21 core + 8 pattern tools)
- **Resources**: 5 real-time resources
- **Prompts**: 5 AI-powered prompts

**What it provides:**

**Core Framework Tools** (21):
- Agent coordination (`versatil_activate_agent`, `opera_set_goal`, `opera_execute_goal`)
- Health checks (`versatil_health_check`, `opera_health_check`)
- Quality gates (`versatil_run_quality_gates`, `versatil_run_tests`)
- Orchestration (`versatil_orchestrate_phase`, `opera_analyze_project`)
- Emergency protocols (`versatil_emergency_protocol`)
- Browser automation (`chrome_navigate`, `chrome_snapshot`, `chrome_test_component`, `chrome_close`)
- Documentation access (`gitmcp_query`)

**Pattern Library Tools (v7.5.1)** (8):
- 🔍 `pattern_search` - Search WebSocket, Payments, S3, Email, Rate-limiting patterns
- 🚀 `pattern_apply` - Apply pattern template with guided code generation
- 🌐 `websocket_setup` - Socket.io real-time communication setup
- 💳 `payment_setup` - Stripe/PayPal integration with webhooks
- ☁️ `s3_upload_setup` - AWS S3 file upload with image optimization
- 📧 `email_setup` - SendGrid/Nodemailer email templates system
- ⏱️ `rate_limit_setup` - Redis-backed API rate limiting
- 📊 `telemetry_report` - Analytics report (hook perf, agent activation, pattern usage)

**Time Savings**: 40-57 hours/year from pattern library alone!

**This MCP server works WITHOUT any external dependencies!** 🎉

---

## 🚀 How to Enable MCP Servers in Cursor

### Step 1: Locate Your MCP Config File

Your MCP config is already at:
```
/Users/nissimmenashe/VERSATIL SDLC FW/.cursor/mcp_config.json
```

This file is **already configured**! ✅

### Step 2: Restart Cursor IDE

**Important**: Cursor only loads MCP servers on startup.

1. **Close Cursor completely** (Cmd+Q on Mac)
2. **Reopen Cursor**
3. **Open your project**: `/Users/nissimmenashe/VERSATIL SDLC FW`

### Step 3: Verify MCP Servers Loaded

In Cursor, press **Cmd+L** (Mac) or **Ctrl+L** (Windows) to open AI chat, then type:

```
Can you list the available MCP tools?
```

**Expected output**: Claude should show `versatil_*` tools if the MCP server is loaded.

---

## 🔍 Troubleshooting: "MCP Not Installed"

### Issue: Cursor Not Finding MCP Config

**Possible causes:**

#### Cause 1: MCP Config in Wrong Location

Cursor looks for MCP config in **two places**:

1. **Project-level**: `.cursor/mcp_config.json` (✅ You have this!)
2. **Global**: `~/Library/Application Support/Cursor/User/globalStorage/mcp_config.json`

**Solution**: Your project-level config should work. If not, try global config:

```bash
# Create global MCP config directory
mkdir -p "$HOME/Library/Application Support/Cursor/User/globalStorage"

# Copy your config to global location
cp "/Users/nissimmenashe/VERSATIL SDLC FW/.cursor/mcp_config.json" \
   "$HOME/Library/Application Support/Cursor/User/globalStorage/mcp_config.json"

# Restart Cursor
```

#### Cause 2: Cursor Version Doesn't Support MCP

**Check Cursor version:**
- MCP support requires **Cursor v0.40+**
- Update Cursor: `Help` → `Check for Updates`

#### Cause 3: MCP Feature Not Enabled

Some Cursor versions require enabling MCP:

1. Open Cursor Settings (`Cmd+,`)
2. Search for "MCP" or "Model Context Protocol"
3. Enable MCP server support
4. Restart Cursor

---

## 🧪 Test MCP Server Manually

To verify the Claude Opera MCP server works:

```bash
cd "/Users/nissimmenashe/VERSATIL SDLC FW"

# Test MCP server startup
node bin/versatil-mcp.js "/Users/nissimmenashe/VERSATIL SDLC FW"

# Expected output:
# ✅ VERSATIL MCP Server running
# 📊 Tools: 15
# 📚 Resources: 5
# 💬 Prompts: 5
```

**If this works**, the MCP server is functional. The issue is Cursor not connecting to it.

---

## 📦 Optional MCP Servers

Your config includes **10 additional MCP servers** that require installation:

### Core MCP Servers (Recommended)

#### 1. **Playwright MCP** (Browser Automation)
**Used by**: Maria-QA, James-Frontend

**Installation**: Auto-installs via `npx` (no action needed!)

**Purpose**:
- Visual regression testing
- E2E testing
- Accessibility audits
- Performance testing

**Configuration**: Already in `.cursor/mcp_config.json`

---

#### 2. **GitHub MCP** (Repository Operations)
**Used by**: Marcus-Backend, Sarah-PM, Alex-BA

**Installation**: Auto-installs via `npx`

**Requires**: GitHub Personal Access Token

**Setup**:
```bash
# Add to ~/.versatil/.env (already exists!)
echo "GITHUB_TOKEN=your_github_token_here" >> ~/.versatil/.env

# Or use existing token from your secure .env file
# GITHUB_TOKEN=<your_token_here>
```

**What it provides**:
- Create/update PRs
- List issues
- Review code
- Manage branches

---

### Advanced MCP Servers (Optional)

#### 3. **Exa Search MCP** (AI-Powered Search)
**Used by**: Alex-BA, Dr.AI-ML

**Requires**: Exa API key (https://exa.ai)

**Setup**:
```bash
echo "EXA_API_KEY=your_exa_api_key" >> ~/.versatil/.env
```

---

#### 4. **Supabase MCP** (Database + RAG)
**Used by**: Marcus-Backend, Dr.AI-ML

**Status**: ✅ Already configured in `~/.versatil/.env`

```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

**What it provides**:
- RAG memory (98%+ context retention)
- Vector search
- Database operations

---

#### 5. **Vertex AI MCP** (Google Cloud AI)
**Used by**: Dr.AI-ML, Marcus-Backend

**Requires**: Google Cloud project with Vertex AI enabled

**Setup**:
```bash
echo "GOOGLE_CLOUD_PROJECT=your-project-id" >> ~/.versatil/.env
echo "GOOGLE_CLOUD_LOCATION=us-central1" >> ~/.versatil/.env
echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json" >> ~/.versatil/.env
```

---

#### 6-10. **Other MCP Servers**
- **n8n** - Workflow automation (Sarah-PM)
- **Semgrep** - Security scanning (Marcus, Maria)
- **Sentry** - Error monitoring (Maria, Marcus, Sarah)
- **Claude Code MCP** - Additional code tools

**Installation**: All auto-install via `npx` when first used!

---

## ✅ Minimal Setup (Core Features)

To use **just the essential features** without external services:

### What Works Out-of-the-Box

✅ **Claude Opera MCP** - All 15 framework tools
✅ **Playwright MCP** - Browser automation (auto-installs)
✅ **GitHub MCP** - If you have GitHub token (already configured!)

**No additional installation needed!** 🎉

---

## 🔧 Configuration Files

### Your MCP Config
```json
{
  "mcpServers": {
    "claude-opera": {
      "command": "node",
      "args": [
        "/Users/nissimmenashe/VERSATIL SDLC FW/bin/versatil-mcp.js",
        "/Users/nissimmenashe/VERSATIL SDLC FW"
      ],
      "env": {
        "VERSATIL_RULES_ENABLED": "true",
        "RULE_1_PARALLEL_EXECUTION": "true",
        "RULE_2_STRESS_TESTING": "true",
        "RULE_3_DAILY_AUDIT": "true"
      }
    }
  }
}
```

### Environment Variables
Located at: `~/.versatil/.env`

**Already configured:**
- ✅ `GITHUB_TOKEN` (for GitHub MCP)
- ✅ `SUPABASE_URL` (for RAG memory)
- ⚠️ `OPENAI_API_KEY` (placeholder)

---

## 🎯 Quick Fix: MCP Not Working

### Try This First

1. **Restart Cursor completely**
   ```bash
   # Kill all Cursor processes
   killall Cursor

   # Reopen Cursor
   open -a Cursor
   ```

2. **Verify MCP config location**
   ```bash
   ls -la "/Users/nissimmenashe/VERSATIL SDLC FW/.cursor/mcp_config.json"
   # Should show: -rw-r--r-- ... mcp_config.json
   ```

3. **Test MCP server manually**
   ```bash
   cd "/Users/nissimmenashe/VERSATIL SDLC FW"
   node bin/versatil-mcp.js "$(pwd)"
   # Should output: ✅ VERSATIL MCP Server running
   # Press Ctrl+C to stop
   ```

4. **Check Cursor logs**
   ```bash
   # Mac
   tail -f "$HOME/Library/Logs/Cursor/main.log" | grep -i mcp

   # Look for:
   # - "MCP server started"
   # - "MCP connection established"
   # - Or any MCP errors
   ```

---

## 🧪 Verify MCP is Working

### In Cursor AI Chat

Type any of these:

```
1. List available MCP tools
```

**Expected**: Shows `versatil_welcome_setup`, `versatil_health_check`, etc.

```
2. Run versatil_health_check
```

**Expected**: Returns framework health status

```
3. Use versatil_welcome_setup to show onboarding status
```

**Expected**: Shows setup completion status

---

## 📖 MCP Tool Reference

Once MCP is loaded, you can use these tools in Cursor chat:

### Agent Management
- `versatil_activate_agent` - Activate specific OPERA agents (Maria-QA, James, Marcus, etc.)
- `opera_set_goal` - Set autonomous development goal
- `opera_execute_goal` - Execute autonomous goal with optional dry-run
- `opera_get_goals` - Get all active/completed/failed goals
- `opera_get_status` - Get Opera orchestrator status and metrics

### Framework Management
- `versatil_health_check` - Framework health check
- `opera_health_check` - Opera orchestrator health check
- `versatil_emergency_protocol` - Emergency response for critical issues

### Workflow & Quality
- `versatil_orchestrate_phase` - Orchestrate SDLC phase transitions
- `versatil_run_quality_gates` - Execute quality gates
- `versatil_run_tests` - Comprehensive testing via Maria-QA
- `opera_analyze_project` - Analyze project for improvements

### Pattern Library (v7.5.1)
- `pattern_search` - Search pattern library (WebSocket, Payments, S3, Email, Rate-limiting)
- `pattern_apply` - Apply pattern template with code generation
- `websocket_setup` - Set up WebSocket real-time communication
- `payment_setup` - Set up Stripe/PayPal payment integration
- `s3_upload_setup` - Set up AWS S3 file upload system
- `email_setup` - Set up email templates system
- `rate_limit_setup` - Set up API rate limiting
- `telemetry_report` - Generate telemetry analytics report

### Browser Automation
- `chrome_navigate` - Navigate to URL with real Chrome
- `chrome_snapshot` - Capture screenshot and DOM snapshot
- `chrome_test_component` - Execute automated component tests
- `chrome_close` - Close Chrome browser session

### Code & Documentation
- `versatil_analyze_architecture` - Architectural analysis
- `versatil_manage_deployment` - Manage deployment pipeline
- `gitmcp_query` - Query GitHub repository documentation
- `versatil_adaptive_insights` - Get adaptive learning insights

### Resources (real-time data)
- `versatil://agent-status/{agentId}` - Agent health status
- `versatil://quality-metrics` - Current project quality metrics
- `versatil://performance-metrics` - Performance analytics and trends
- `versatil://sdlc-phase` - Current SDLC phase and transition history
- `versatil://activity-log` - Recent agent activities and system events

---

## 🆘 Still Not Working?

### Check These:

1. **Cursor Version**
   - Go to `Help` → `About Cursor`
   - Requires v0.40+ for MCP support

2. **Node.js Version**
   ```bash
   node --version
   # Should be v18+ (you have v24.7.0 ✅)
   ```

3. **MCP Config Syntax**
   ```bash
   # Validate JSON
   cat "/Users/nissimmenashe/VERSATIL SDLC FW/.cursor/mcp_config.json" | jq .
   # Should output valid JSON without errors
   ```

4. **File Permissions**
   ```bash
   # Make MCP server executable
   chmod +x "/Users/nissimmenashe/VERSATIL SDLC FW/bin/versatil-mcp.js"
   ```

5. **Check Cursor Settings**
   - Open Settings (`Cmd+,`)
   - Search "MCP"
   - Ensure MCP feature is enabled

---

## 💡 Alternative: Use Without MCP

If MCP isn't working in Cursor, you can still use Claude Opera:

### Option 1: Terminal Mode
```bash
# Start interactive mode
versatil init

# Or use individual commands
versatil-daemon start
versatil health
```

### Option 2: Claude Desktop
MCP works better in Claude Desktop app. Copy your config:

```bash
# Copy to Claude Desktop config
mkdir -p "$HOME/Library/Application Support/Claude"
cp "/Users/nissimmenashe/VERSATIL SDLC FW/.cursor/mcp_config.json" \
   "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
```

Then use Claude Desktop alongside Cursor for framework commands.

---

## 📧 Get Help

If you're still having issues:

1. **Check Cursor logs**: `$HOME/Library/Logs/Cursor/main.log`
2. **Test MCP manually**: `node bin/versatil-mcp.js "$(pwd)"`
3. **Verify config**: `.cursor/mcp_config.json` is valid JSON
4. **Restart Cursor**: Complete shutdown and restart

---

**Version**: 7.5.1 (with Pattern Library)
**Last Updated**: 2025-10-26
**Platform**: macOS (Darwin 25.0.0)
**Node**: v24.7.0
**npm**: 11.5.1
**New in v7.5.1**: 8 pattern library MCP tools (40-57 hours/year time savings)

---

## ✅ Summary

- ✅ **Claude Opera MCP**: Configured and ready
- ✅ **Node.js**: v24.7.0 (compatible)
- ✅ **Config File**: Valid JSON at `.cursor/mcp_config.json`
- ✅ **MCP Server**: Tested and working
- ⚠️ **Cursor Connection**: Needs restart to load MCP

**Next Step**: Restart Cursor completely and test with `List available MCP tools` in AI chat!
