# MCP Quick Start Guide

Get your VERSATIL Framework MCP ecosystem up and running in **under 30 minutes**.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] VERSATIL Framework installed (`versatil --version`)
- [ ] 2GB+ disk space available
- [ ] Internet connection for package downloads

**Total time**: 2 minutes

---

## Step 1: Choose Your Setup Path

### Option A: Automated Setup (Recommended)

**Best for**: Most users, fastest setup

```bash
npm run mcp:setup
```

Follow interactive prompts. **Time**: 15-30 minutes.

### Option B: Manual Setup

**Best for**: Advanced users, CI/CD pipelines

**Time**: 20-40 minutes. See [Manual Setup](#manual-setup-path).

---

## Step 2: Configure Critical MCPs (Required)

These 3 MCPs are **required** for core framework functionality.

### 2.1 GitHub MCP (5 minutes)

**Purpose**: Repository access, PR automation, issue tracking

**Setup**:
1. Get GitHub token: https://github.com/settings/tokens/new
   - Scopes: `repo`, `workflow`, `read:org`
2. Add to `~/.versatil/.env`:
   ```bash
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   GITHUB_OWNER=your-username
   GITHUB_REPO=your-repo
   ```
3. Validate:
   ```bash
   npm run mcp:health -- --filter=github
   ```

**Success Criteria**: ✅ GitHub MCP: Healthy (< 500ms)

**Troubleshooting**: [GitHub Setup Guide](individual/github-setup.md)

---

### 2.2 Playwright MCP (10 minutes)

**Purpose**: Browser automation for E2E testing, visual regression

**Setup**:
1. Install Playwright browsers:
   ```bash
   npm run playwright:install
   ```
2. Add to `~/.versatil/.env`:
   ```bash
   PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
   PLAYWRIGHT_MCP_HEADLESS=false
   PLAYWRIGHT_MCP_TIMEOUT=30000
   ```
3. Validate:
   ```bash
   npm run mcp:health -- --filter=playwright
   ```

**Success Criteria**: ✅ Playwright MCP: Healthy (< 1000ms)

**Troubleshooting**: [Playwright Setup Guide](individual/playwright-setup.md)

---

### 2.3 Supabase MCP (15 minutes)

**Purpose**: Vector database for RAG memory, stores agent context

**Setup**:
1. Create Supabase project: https://app.supabase.com
2. Get credentials: Project Settings → API
3. Add to `~/.versatil/.env`:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_KEY=eyJhbGc...
   ```
4. Run migrations:
   ```bash
   npm run migrate:vector-store
   ```
5. Validate:
   ```bash
   npm run mcp:health -- --filter=supabase
   ```

**Success Criteria**: ✅ Supabase MCP: Healthy (< 500ms)

**Troubleshooting**: [Supabase Setup Guide](individual/supabase-setup.md)

---

## Step 3: Configure High-Priority MCPs (Recommended)

These MCPs significantly enhance framework capabilities.

### 3.1 GitMCP (3 minutes) ⭐

**Purpose**: Access GitHub repository documentation, anti-hallucination

**Setup**:
1. No additional credentials needed (uses GitHub token)
2. Already configured in `.cursor/mcp_config.json`
3. Validate:
   ```bash
   npm run mcp:health -- --filter=gitmcp
   ```

**Success Criteria**: ✅ GitMCP: Healthy (< 200ms)

**Benefits**: Agents can access official docs from any GitHub repo (React, Next.js, FastAPI, etc.)

---

### 3.2 Semgrep MCP (5 minutes)

**Purpose**: Security scanning for 30+ languages

**Setup**:
1. (Optional) Get API key: https://semgrep.dev/login
2. Add to `~/.versatil/.env`:
   ```bash
   SEMGREP_API_KEY=sgk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Optional
   SEMGREP_CONFIG=auto
   ```
3. Validate:
   ```bash
   npm run mcp:health -- --filter=semgrep
   ```

**Success Criteria**: ✅ Semgrep MCP: Healthy (< 2000ms)

**Note**: Works without API key for local scanning.

---

### 3.3 Sentry MCP (10 minutes)

**Purpose**: Error monitoring, performance tracking

**Setup**:
1. Create Sentry project: https://sentry.io/signup/
2. Get DSN: Settings → Projects → [Your Project] → Client Keys
3. Add to `~/.versatil/.env`:
   ```bash
   SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
   SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=versatil-sdlc-framework
   ```
4. Validate:
   ```bash
   npm run mcp:health -- --filter=sentry
   ```

**Success Criteria**: ✅ Sentry MCP: Healthy (< 1000ms)

---

## Step 4: Validate Setup

Run comprehensive health check:

```bash
npm run mcp:health
```

**Expected Output**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 VERSATIL Framework - MCP Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total MCPs: 6
✅ Healthy: 6
❌ Unhealthy: 0

─────────────────────────────────────────────────────
| MCP                  | Status      | Response Time |
─────────────────────────────────────────────────────
| github               | ✅ Healthy  | 120ms         |
| playwright           | ✅ Healthy  | 450ms         |
| supabase             | ✅ Healthy  | 230ms         |
| gitmcp               | ✅ Healthy  | 89ms          |
| semgrep              | ✅ Healthy  | 1800ms        |
| sentry               | ✅ Healthy  | 340ms         |
─────────────────────────────────────────────────────

✅ All MCPs healthy!
```

---

## Step 5: Test Integration

Verify MCPs work with OPERA agents:

### Test Maria-QA + Playwright

```bash
# Run E2E tests
npm run test:e2e

# Expected: Tests run in Chromium browser
```

### Test Marcus + GitHub + Semgrep

```bash
# Security scan
npm run security:scan

# Expected: Semgrep finds 0 high-severity issues
```

### Test RAG Memory + Supabase

```bash
# Query RAG memory
npm run test:supabase

# Expected: Vector search returns relevant code patterns
```

---

## Step 6: Enable Framework Features

### Start Proactive Agents

```bash
# Enable automatic agent activation
versatil-daemon start

# Verify daemon running
versatil-daemon status
```

### Run Framework Doctor

```bash
# Comprehensive health check
npm run doctor

# Expected: 100% health score
```

### Test Agent Collaboration

```bash
# Example: Test multi-agent workflow
/plan "Add user authentication"

# Expected: Alex-BA → [Dana + Marcus + James] → Maria-QA
```

---

## Optional MCPs (Skip for Now)

Configure these later based on your needs:

| MCP | Purpose | Time | Guide |
|-----|---------|------|-------|
| Exa Search | AI-powered web search | 5 min | [Setup](individual/exa-setup.md) |
| Vertex AI | Google Cloud AI (Gemini) | 15 min | [Setup](individual/vertex-ai-setup.md) |
| n8n | Workflow automation | 10 min | [Setup](individual/n8n-setup.md) |
| Shadcn | Component library | 3 min | [Setup](individual/shadcn-setup.md) |
| Ant Design | React components | 3 min | [Setup](individual/ant-design-setup.md) |
| Claude Code | Enhanced features | 2 min | [Setup](individual/claude-code-setup.md) |

---

## Manual Setup Path

For advanced users who prefer manual configuration:

### 1. Create Credentials File

```bash
# Copy template
cp .env.example ~/.versatil/.env

# Secure permissions
chmod 600 ~/.versatil/.env

# Edit credentials
nano ~/.versatil/.env
```

### 2. Add MCP Credentials

Edit `~/.versatil/.env`:

```bash
# === Critical MCPs ===
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# === High-Priority MCPs ===
SEMGREP_API_KEY=sgk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-org-slug
```

### 3. Verify MCP Config

Check `.cursor/mcp_config.json` exists:

```bash
cat .cursor/mcp_config.json | jq '.mcpServers | keys'
```

**Expected**: `["github", "playwright", "supabase", "gitmcp", ...]`

### 4. Install Dependencies

```bash
# Install Playwright browsers
npm run playwright:install

# Run Supabase migrations
npm run migrate:vector-store
```

### 5. Validate

```bash
npm run mcp:health
```

---

## Success Checklist

After setup, you should have:

- [ ] ✅ 3 critical MCPs healthy (GitHub, Playwright, Supabase)
- [ ] ✅ 3 high-priority MCPs healthy (GitMCP, Semgrep, Sentry)
- [ ] ✅ Framework health score ≥ 90% (`npm run doctor`)
- [ ] ✅ Proactive daemon running (`versatil-daemon status`)
- [ ] ✅ Test suite passing (`npm run test:integration`)
- [ ] ✅ Credentials isolated to `~/.versatil/.env` (`npm run validate:isolation`)

**Total setup time**: 30-48 minutes

---

## Next Steps

### 1. Learn Agent Workflows

- **[Plan Mode](../features/plan-mode.md)** - Multi-step task planning
- **[Every Workflow](../workflows/every-workflow.md)** - Compounding engineering
- **[Agent Collaboration](../../.claude/agents/README.md)** - Multi-agent patterns

### 2. Configure Advanced Features

- **[Session Compass](../features/session-compass.md)** - Session context recovery
- **[Memory Tool](../enhancements/MEMORY_TOOL_INTEGRATION.md)** - Agent memories
- **[Context Editing](../enhancements/CONTEXT_EDITING_PHASE2.md)** - Context management

### 3. Integrate with Your Stack

- **[Framework Detection](../guides/framework-integration.md)** - Auto-detect project type
- **[Language Sub-Agents](../../.claude/agents/README.md#sub-agents)** - Node, Python, Rails, Go, Java, React, Vue, Next, Angular, Svelte

### 4. Explore Optional MCPs

Configure remaining MCPs as needed:
- **[Exa Search](individual/exa-setup.md)** - When you need AI-powered research
- **[Vertex AI](individual/vertex-ai-setup.md)** - For Google Cloud AI features
- **[n8n](individual/n8n-setup.md)** - For complex workflow automation

---

## Troubleshooting Quick Fixes

### "MCP server not found"

```bash
# Install globally
npm install -g @modelcontextprotocol/server-github

# Or clear cache and retry
npm cache clean --force
npm run mcp:setup
```

### "Missing credentials"

```bash
# Verify file location
ls -la ~/.versatil/.env

# Check variable is set
grep GITHUB_TOKEN ~/.versatil/.env

# Reload environment
source ~/.versatil/.env
```

### "Connection timeout"

```bash
# Increase timeout
export MCP_TIMEOUT=60000

# Test network
curl -I https://api.github.com
```

### "Permission denied"

```bash
# Fix file permissions
chmod 600 ~/.versatil/.env

# For GitHub: check token scopes at
# https://github.com/settings/tokens
```

**For more issues**: See [MCP Troubleshooting Guide](MCP_TROUBLESHOOTING.md)

---

## Getting Help

**Issues**: [GitHub Issues](https://github.com/Nissimmiracles/versatil-sdlc-framework/issues)
**Discord**: [Join Community](https://discord.gg/versatil)
**Documentation**: [Full Docs](https://docs.versatil.dev)

---

**Last Updated**: October 19, 2025
**Framework Version**: 6.4.0
