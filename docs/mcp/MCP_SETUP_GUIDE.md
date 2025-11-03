# VERSATIL Framework - MCP Setup Guide

## Overview

The VERSATIL Framework integrates **12 Model Context Protocol (MCP) servers** to provide comprehensive development capabilities across the entire software development lifecycle. This guide provides step-by-step instructions for configuring each MCP server.

**Framework Version**: 6.4.0
**Last Updated**: October 2025
**Estimated Setup Time**: 30-90 minutes (depending on MCPs selected)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [MCP Ecosystem Overview](#mcp-ecosystem-overview)
4. [Automated Setup](#automated-setup)
5. [Manual Setup](#manual-setup)
6. [Validation](#validation)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

---

## Quick Start

**For experienced users** who want to get started immediately:

```bash
# 1. Run automated setup wizard
pnpm run mcp:setup

# 2. Follow interactive prompts to configure MCPs
# 3. Validate installation
pnpm run mcp:health

# Done! All MCPs configured and validated.
```

For detailed setup instructions, continue reading.

---

## Prerequisites

### System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Operating System**: macOS, Linux, or Windows (WSL2 recommended)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 2GB for MCP servers and dependencies

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version  # Should be 9.0.0 or higher

# Check available disk space
df -h  # Ensure 2GB+ available
```

### Framework Installation

Ensure VERSATIL Framework is installed:

```bash
# Install framework globally
npm install -g @versatil/sdlc-framework

# Or install in project
npm install --save-dev @versatil/sdlc-framework

# Verify installation
versatil --version
```

---

## MCP Ecosystem Overview

VERSATIL integrates 12 MCP servers, categorized by priority and function:

### Critical MCPs (Required for Core Features)

| MCP | Purpose | Agent Integration | Setup Time |
|-----|---------|-------------------|------------|
| **GitHub** | Repository operations, PR automation | Marcus, Sarah, Alex | 5 min |
| **Playwright** | Browser automation, E2E testing | Maria-QA, James | 10 min |
| **Supabase** | Vector database, RAG memory | All agents | 15 min |

**Estimated Total**: 30 minutes

### High-Priority MCPs (Strongly Recommended)

| MCP | Purpose | Agent Integration | Setup Time |
|-----|---------|-------------------|------------|
| **GitMCP** | GitHub docs, anti-hallucination | Alex, Marcus, James, Dr.AI | 3 min |
| **Semgrep** | Security scanning | Marcus, Maria, Dr.AI | 5 min |
| **Sentry** | Error monitoring | Maria, Marcus, Sarah | 10 min |

**Estimated Total**: 18 minutes

### Optional MCPs (Feature Enhancements)

| MCP | Purpose | Agent Integration | Setup Time |
|-----|---------|-------------------|------------|
| **Exa Search** | AI-powered web search | Alex, Dr.AI | 5 min |
| **Vertex AI** | Google Cloud AI (Gemini) | Dr.AI, Marcus | 15 min |
| **n8n** | Workflow automation | Sarah, Marcus, Maria | 10 min |
| **Shadcn** | Component library | James | 3 min |
| **Ant Design** | React components | James | 3 min |
| **Claude Code** | Enhanced Claude features | All agents | 2 min |

**Estimated Total**: 38 minutes

### Total Setup Time

- **Minimal** (Critical only): ~30 minutes
- **Recommended** (Critical + High-Priority): ~48 minutes
- **Full** (All 12 MCPs): ~86 minutes

---

## Automated Setup

### Interactive Setup Wizard

The easiest way to configure MCPs is using the automated setup wizard:

```bash
# Launch setup wizard
pnpm run mcp:setup
```

**Wizard Features**:
- Interactive MCP selection (checkbox UI)
- API key validation before saving
- Auto-detect existing configurations
- Isolation enforcement (credentials → `~/.versatil/.env`)
- Automatic health check after setup

### Wizard Steps

1. **Select MCPs to Configure**
   ```
   ? Which MCPs would you like to configure? (Press <space> to select)

   Critical MCPs:
   ◉ GitHub MCP (Repository operations)
   ◉ Playwright MCP (Browser automation)
   ◉ Supabase MCP (RAG memory)

   High-Priority MCPs:
   ◉ GitMCP (Documentation access)
   ◉ Semgrep MCP (Security scanning)
   ○ Sentry MCP (Error monitoring)

   Optional MCPs:
   ○ Exa Search MCP (AI search)
   ○ Vertex AI MCP (Google Cloud AI)
   ○ n8n MCP (Workflow automation)
   ○ Shadcn MCP (Component library)
   ○ Ant Design MCP (React components)
   ○ Claude Code MCP (Enhanced features)
   ```

2. **Enter Credentials for Each MCP**
   ```
   ──────────────────────────────────────
   GitHub MCP Configuration
   ──────────────────────────────────────

   ? Enter GitHub Personal Access Token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ✓ Token validated successfully

   ? Enter GitHub Owner (default: your-username): your-org
   ? Enter GitHub Repository (default: current-repo): your-repo

   ✓ GitHub MCP configured
   ```

3. **Credentials Storage**
   ```
   ✓ Credentials saved to ~/.versatil/.env
   ✓ MCP config updated at .cursor/mcp_config.json
   ✓ Isolation validated (no credentials in project)
   ```

4. **Automatic Validation**
   ```
   ──────────────────────────────────────
   Running Health Checks
   ──────────────────────────────────────

   ✅ GitHub MCP: Healthy (120ms)
   ✅ Playwright MCP: Healthy (450ms)
   ✅ Supabase MCP: Healthy (230ms)
   ⏭️ Exa Search MCP: Skipped (not configured)

   ✓ 3/3 MCPs healthy
   ```

### Wizard Options

```bash
# Full interactive mode (default)
pnpm run mcp:setup

# Configure specific MCP
pnpm run mcp:setup -- --only=github

# Skip validation (faster, for testing)
pnpm run mcp:setup -- --no-validate

# Reconfigure existing MCP (overwrites)
pnpm run mcp:setup -- --force

# Show current configuration
pnpm run mcp:setup -- --show
```

---

## Manual Setup

For advanced users or CI/CD integration, configure MCPs manually.

### Step 1: Copy Environment Template

```bash
# Copy template to ~/.versatil/.env (NOT your project!)
cp .env.example ~/.versatil/.env

# Secure permissions
chmod 600 ~/.versatil/.env
```

### Step 2: Configure MCP Config File

Edit `.cursor/mcp_config.json` (auto-generated during installation):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "Official GitHub MCP for repository operations"
    }
  }
}
```

**Important**: Use `${ENV_VAR}` syntax to reference environment variables from `~/.versatil/.env`.

### Step 3: Add Credentials to `~/.versatil/.env`

Add credentials for each MCP you're configuring:

```bash
# Edit credentials file
nano ~/.versatil/.env

# Add MCP credentials (examples below)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

### Step 4: Install MCP Server Packages

Some MCPs require additional npm packages:

```bash
# Install Playwright browsers (one-time)
pnpm run playwright:install

# Install optional MCP servers
npm install -g @modelcontextprotocol/server-github
npm install -g exa-mcp-server
npm install -g vertex-ai-mcp-server
```

### Step 5: Validate Configuration

```bash
# Run health check
pnpm run mcp:health

# Expected output:
# ✅ GitHub MCP: Healthy (120ms)
# ✅ Playwright MCP: Healthy (450ms)
# ✅ Supabase MCP: Healthy (230ms)
```

---

## Individual MCP Setup Guides

Detailed setup instructions for each MCP:

### Critical MCPs

1. **[GitHub MCP](individual/github-setup.md)** - Repository operations
2. **[Playwright MCP](individual/playwright-setup.md)** - Browser automation
3. **[Supabase MCP](individual/supabase-setup.md)** - Vector database

### High-Priority MCPs

4. **[GitMCP](individual/gitmcp-setup.md)** - GitHub repository documentation
5. **[Semgrep MCP](individual/semgrep-setup.md)** - Security scanning
6. **[Sentry MCP](individual/sentry-setup.md)** - Error monitoring

### Optional MCPs

7. **[Exa Search MCP](individual/exa-setup.md)** - AI-powered search
8. **[Vertex AI MCP](individual/vertex-ai-setup.md)** - Google Cloud AI
9. **[n8n MCP](individual/n8n-setup.md)** - Workflow automation
10. **[Shadcn MCP](individual/shadcn-setup.md)** - Component library
11. **[Ant Design MCP](individual/ant-design-setup.md)** - React components
12. **[Claude Code MCP](individual/claude-code-setup.md)** - Enhanced features

---

## Validation

### Health Check

Verify all MCPs are configured correctly:

```bash
# Quick health check (5 seconds)
pnpm run mcp:health

# Verbose output (shows connection details)
pnpm run mcp:health:verbose

# Continuous monitoring (every 60s)
pnpm run mcp:health:watch
```

### Health Check Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 VERSATIL Framework - MCP Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total MCPs: 12
✅ Healthy: 8
❌ Unhealthy: 1
⚠️  Slow: 1
⏭️  Skipped: 2

─────────────────────────────────────────────────────
| MCP                  | Status      | Response Time | Last Check       |
─────────────────────────────────────────────────────
| github               | ✅ Healthy  | 120ms         | 2:34:56 PM       |
| playwright           | ✅ Healthy  | 450ms         | 2:34:56 PM       |
| supabase             | ✅ Healthy  | 230ms         | 2:34:57 PM       |
| gitmcp               | ✅ Healthy  | 89ms          | 2:34:57 PM       |
| semgrep              | ⚠️  Slow    | 3500ms        | 2:34:58 PM       |
| sentry               | ❌ Down     | 5000ms        | 2:35:00 PM       |
| exa                  | ⏭️  Skipped | 0ms           | -                |
| vertex-ai            | ⏭️  Skipped | 0ms           | -                |
─────────────────────────────────────────────────────

⚠️  Errors:
  sentry:
    Connection timeout - check SENTRY_DSN

Performance Metrics:
  Average Response Time: 897ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  1 MCP unhealthy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Individual MCP Testing

Test specific MCP functionality:

```bash
# Test GitHub MCP
pnpm run test:mcp -- --filter=github

# Test Playwright MCP
pnpm run test:mcp -- --filter=playwright

# Test Supabase MCP
pnpm run test:mcp -- --filter=supabase
```

### Framework Integration Test

Verify MCPs integrate correctly with OPERA agents:

```bash
# Run integration tests
pnpm run test:integration

# Test specific agent + MCP integration
pnpm run test:maria-qa  # Tests Playwright + Chrome MCP
pnpm run test:marcus   # Tests GitHub + Semgrep + Sentry
```

---

## Troubleshooting

### Common Issues

#### 1. "MCP server not found"

**Cause**: MCP package not installed or `npx` can't find it.

**Solution**:
```bash
# Install MCP globally
npm install -g @modelcontextprotocol/server-github

# Or use full path in mcp_config.json
"command": "/usr/local/bin/node",
"args": ["/path/to/mcp-server.js"]
```

#### 2. "Missing credentials"

**Cause**: Environment variables not set or wrong file location.

**Solution**:
```bash
# Verify credentials file exists
ls -la ~/.versatil/.env

# Check environment variable is set
cat ~/.versatil/.env | grep GITHUB_TOKEN

# Reload environment
source ~/.versatil/.env
```

#### 3. "Connection timeout"

**Cause**: MCP server unresponsive or network issue.

**Solution**:
```bash
# Check MCP server health
pnpm run mcp:health:verbose

# Increase timeout in mcp_config.json
"env": {
  "MCP_TIMEOUT": "60000"  # 60 seconds
}

# Test network connectivity
curl -I https://api.github.com  # For GitHub MCP
```

#### 4. "Permission denied"

**Cause**: API token lacks required permissions.

**Solution**:
```bash
# GitHub: Ensure token has repo, workflow, admin:org scopes
# Verify at: https://github.com/settings/tokens

# Supabase: Ensure service key (not anon key) is used
# Check at: https://app.supabase.com → Project Settings → API
```

#### 5. "Isolation violation"

**Cause**: Credentials in project directory instead of `~/.versatil/`.

**Solution**:
```bash
# Validate isolation
pnpm run validate:isolation

# Move credentials to correct location
mv .env ~/.versatil/.env

# Remove from project
git rm .env
echo ".env" >> .gitignore
```

### Advanced Troubleshooting

For complex issues, see:
- **[MCP Troubleshooting Guide](MCP_TROUBLESHOOTING.md)** - Comprehensive error resolution
- **[Framework Doctor](../guides/framework-doctor.md)** - Auto-fix common issues
- **[MCP Examples](MCP_EXAMPLES.md)** - Working code examples

### Get Help

- **GitHub Issues**: [Report a bug](https://github.com/Nissimmiracles/versatil-sdlc-framework/issues)
- **Discord Community**: [Join discussions](https://discord.gg/versatil)
- **Documentation**: [Full docs](https://docs.versatil.dev)

---

## Next Steps

### After Setup

1. **Verify Framework Health**
   ```bash
   pnpm run doctor
   ```

2. **Test Agent Integration**
   ```bash
   # Test Maria-QA with Playwright
   /maria run test coverage for src/components/Button.tsx

   # Test Marcus with GitHub + Semgrep
   /marcus review API security for src/api/auth.ts
   ```

3. **Configure Proactive Agents**
   ```bash
   # Enable automatic agent activation
   pnpm run init

   # Start daemon for background monitoring
   versatil-daemon start
   ```

4. **Learn Advanced Features**
   - **[Plan Mode](../features/plan-mode.md)** - Multi-step task planning
   - **[Every Workflow](../workflows/every-workflow.md)** - Compounding engineering
   - **[Session Compass](../features/session-compass.md)** - Session context recovery

### Recommended Reading

- **[Quick Start Guide](../getting-started/quickstart.md)** - New user onboarding
- **[Agent Overview](../../.claude/agents/README.md)** - All 18 OPERA agents
- **[5 Rules System](../../.claude/rules/README.md)** - Automation rules
- **[CLAUDE.md](../../CLAUDE.md)** - Core framework methodology

---

## Configuration Templates

### Minimal Configuration (Critical MCPs Only)

**File**: `~/.versatil/.env`

```bash
# GitHub MCP (required)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Playwright MCP (required)
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright

# Supabase MCP (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

### Recommended Configuration (Critical + High-Priority)

**File**: `~/.versatil/.env`

```bash
# === Critical MCPs ===
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here

# === High-Priority MCPs ===
# GitMCP (no credentials required - uses GitHub token)

# Semgrep MCP (optional API key)
SEMGREP_API_KEY=sgk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sentry MCP
SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-org-slug
```

### Full Configuration (All 12 MCPs)

**See**: [templates/mcp/.env.mcp.template](../../templates/mcp/.env.mcp.template)

---

## Security Best Practices

### Credential Storage

✅ **DO**:
- Store credentials in `~/.versatil/.env`
- Use `chmod 600 ~/.versatil/.env` for proper permissions
- Use environment variable substitution in `mcp_config.json`
- Rotate API tokens regularly (every 90 days)

❌ **DON'T**:
- Store credentials in project directory
- Commit `.env` files to version control
- Share API tokens via Slack/email
- Use production tokens in development

### API Token Permissions

**GitHub Token** (minimum scopes):
- `repo` - Repository access
- `workflow` - GitHub Actions
- `read:org` - Organization access

**Supabase Keys**:
- `anon_key` - Public client access
- `service_role_key` - Backend operations (keep secret!)

**Sentry Auth Token** (minimum permissions):
- `project:read` - Read project data
- `event:read` - Read error events
- `org:read` - Read organization settings

### Network Security

- Use HTTPS for all API endpoints
- Enable rate limiting in production
- Configure CORS policies in `mcp_config.json`
- Use VPN for sensitive operations

---

## Frequently Asked Questions

### Q: Which MCPs are required?

**A**: Only **3 MCPs are required** for core functionality:
1. GitHub MCP - Repository operations
2. Playwright MCP - Browser automation
3. Supabase MCP - RAG memory

All other MCPs are optional enhancements.

### Q: Can I use the framework without Supabase?

**A**: Yes, but with limited memory capabilities. Set `USE_LOCAL_EMBEDDINGS=true` in `.env` for hash-based embeddings (development only, not recommended for production).

### Q: How do I update MCP servers?

**A**: MCP servers are installed via `npx`, which automatically uses the latest version. To force updates:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall MCP servers
pnpm run install-mcps
```

### Q: Can I use custom MCP servers?

**A**: Yes! Add to `.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    "custom-mcp": {
      "command": "node",
      "args": ["/path/to/your/custom-mcp.js"],
      "env": {
        "CUSTOM_API_KEY": "${CUSTOM_API_KEY}"
      },
      "description": "Your custom MCP server"
    }
  }
}
```

### Q: How do I disable an MCP temporarily?

**A**: Comment out the MCP in `.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    // "sentry": {
    //   "command": "npx",
    //   "args": ["-y", "sentry-mcp-stdio"],
    //   ...
    // }
  }
}
```

Or use the wizard:

```bash
pnpm run mcp:setup -- --disable=sentry
```

---

## Appendix

### A. MCP Configuration Schema

**File**: `.cursor/mcp_config.json`

```typescript
interface MCPConfig {
  mcpServers: {
    [mcpId: string]: {
      command: string;           // Executable (node, npx, python, etc.)
      args: string[];            // Arguments to pass
      env?: Record<string, string>; // Environment variables
      cwd?: string;              // Working directory
      description?: string;      // Human-readable description
      timeout?: number;          // Timeout in milliseconds
    };
  };
}
```

### B. Environment Variable Reference

| Variable | MCP | Required | Default | Description |
|----------|-----|----------|---------|-------------|
| `GITHUB_TOKEN` | GitHub | ✅ | - | Personal access token |
| `PLAYWRIGHT_BROWSERS_PATH` | Playwright | ⚠️ | `~/.cache/ms-playwright` | Browser cache |
| `SUPABASE_URL` | Supabase | ✅ | - | Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase | ✅ | - | Service role key |
| `SEMGREP_API_KEY` | Semgrep | ❌ | - | Optional API key |
| `SENTRY_DSN` | Sentry | ✅ | - | Project DSN |
| `EXA_API_KEY` | Exa Search | ✅ | - | API key |
| `GOOGLE_CLOUD_PROJECT` | Vertex AI | ✅ | - | GCP project ID |
| `N8N_API_KEY` | n8n | ✅ | - | Workflow API key |

### C. MCP Server Versions

| MCP | Package | Version | Last Updated |
|-----|---------|---------|--------------|
| GitHub | `@modelcontextprotocol/server-github` | 2025.4.8 | Oct 2025 |
| Playwright | `@playwright/mcp` | 0.0.41 | Oct 2025 |
| Supabase | `supabase-mcp` | Latest | Oct 2025 |
| GitMCP | `mcp-remote` | Latest | Oct 2025 |
| Exa Search | `exa-mcp-server` | 3.0.5 | Oct 2025 |
| Semgrep | `semgrep-mcp` | Latest | Oct 2025 |
| Sentry | `sentry-mcp-stdio` | Latest | Oct 2025 |
| Vertex AI | `vertex-ai-mcp-server` | Latest | Oct 2025 |
| n8n | `n8n-nodes-mcp` | Latest | Oct 2025 |
| Claude Code | `@steipete/claude-code-mcp` | Latest | Oct 2025 |

---

**Last Updated**: October 19, 2025
**Framework Version**: 6.4.0
**Maintained By**: Claude Opera by VERSATIL Team

For updates and support:
- **GitHub**: https://github.com/Nissimmiracles/versatil-sdlc-framework
- **Documentation**: https://docs.versatil.dev
- **Discord**: https://discord.gg/versatil
