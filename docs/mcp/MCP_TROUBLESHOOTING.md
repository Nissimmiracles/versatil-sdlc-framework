# MCP Troubleshooting Guide

Comprehensive solutions for common MCP setup and runtime issues.

---

## Table of Contents

1. [Diagnostic Tools](#diagnostic-tools)
2. [Common Errors](#common-errors)
3. [MCP-Specific Issues](#mcp-specific-issues)
4. [Network & Connectivity](#network--connectivity)
5. [Performance Issues](#performance-issues)
6. [Security & Permissions](#security--permissions)
7. [Advanced Troubleshooting](#advanced-troubleshooting)
8. [Getting Help](#getting-help)

---

## Diagnostic Tools

### Health Check

Run comprehensive health check:

```bash
# Quick check (5 seconds)
npm run mcp:health

# Verbose output (shows connection details)
npm run mcp:health:verbose

# Continuous monitoring
npm run mcp:health:watch
```

### Framework Doctor

Auto-detect and fix common issues:

```bash
# Comprehensive health audit
npm run doctor

# Auto-fix issues
npm run doctor:fix

# Specific component check
npm run doctor -- --check=mcp
```

### Validation Commands

```bash
# Validate MCP configuration
npm run validate:mcp

# Validate isolation (credentials not in project)
npm run validate:isolation

# Validate environment variables
npm run validate:env
```

### Manual Tests

```bash
# Test specific MCP
npm run test:mcp -- --filter=github

# Test MCP integration with agent
npm run test:maria-qa  # Playwright + Chrome MCP
npm run test:marcus    # GitHub + Semgrep + Sentry
```

---

## Common Errors

### 1. "MCP server not found"

**Error Message**:
```
Error: MCP server 'github' not found
  at MCPClient.connect (/path/to/mcp-client.ts:45)
```

**Cause**: MCP package not installed or `npx` can't find it.

**Solutions**:

#### A. Install MCP Globally

```bash
npm install -g @modelcontextprotocol/server-github
```

#### B. Use Full Path in Config

Edit `.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "/usr/local/bin/node",
      "args": ["/usr/local/lib/node_modules/@modelcontextprotocol/server-github/index.js"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

#### C. Verify npx Can Find Package

```bash
# Check if package exists
npx --yes @modelcontextprotocol/server-github --version

# Clear npm cache if needed
npm cache clean --force
```

---

### 2. "Missing credentials" / "Invalid API key"

**Error Message**:
```
Error: Missing required environment variable: GITHUB_TOKEN
```

**Cause**: Environment variables not set or wrong file location.

**Solutions**:

#### A. Verify Credentials File Exists

```bash
# Check file exists
ls -la ~/.versatil/.env

# If missing, copy template
cp .env.example ~/.versatil/.env
chmod 600 ~/.versatil/.env
```

#### B. Check Variable is Set

```bash
# View all MCP credentials
cat ~/.versatil/.env | grep -E '(GITHUB|SUPABASE|SENTRY)'

# Check specific variable
echo $GITHUB_TOKEN
```

#### C. Reload Environment

```bash
# Source credentials file
source ~/.versatil/.env

# Or restart terminal
exit  # Then reopen terminal
```

#### D. Validate API Key Format

**GitHub Token**: Starts with `ghp_` (40 characters)
```bash
# Valid format
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz12
```

**Supabase Keys**:
```bash
# Anon key (starts with eyJhbGc)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service key (starts with eyJhbGc)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Sentry DSN**: Starts with `https://`
```bash
SENTRY_DSN=https://1234567890abcdef@o123456.ingest.sentry.io/123456
```

---

### 3. "Connection timeout" / "MCP server unresponsive"

**Error Message**:
```
Error: Connection timeout after 5000ms
  at MCPHealthChecker.waitForReady (mcp-health-check.cjs:258)
```

**Cause**: MCP server slow to start or network issue.

**Solutions**:

#### A. Increase Timeout

Edit `.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    "semgrep": {
      "command": "npx",
      "args": ["-y", "semgrep-mcp"],
      "env": {
        "SEMGREP_API_KEY": "${SEMGREP_API_KEY}",
        "MCP_TIMEOUT": "60000"  // 60 seconds
      }
    }
  }
}
```

#### B. Test Network Connectivity

```bash
# GitHub MCP
curl -I https://api.github.com

# Supabase MCP
curl -I https://your-project.supabase.co

# Sentry MCP
curl -I https://sentry.io
```

#### C. Check MCP Server Logs

```bash
# Run MCP directly to see errors
npx -y @modelcontextprotocol/server-github

# Expected output: MCP server startup messages
```

#### D. Restart MCP Server

```bash
# Kill existing processes
pkill -f "mcp-server"

# Restart framework
npm run doctor:fix
```

---

### 4. "Permission denied" / "Unauthorized"

**Error Message**:
```
Error: Request failed with status code 403: Forbidden
  at GithubMCPClient.fetchRepository (github-mcp-client.ts:89)
```

**Cause**: API token lacks required permissions.

**Solutions**:

#### A. Verify GitHub Token Scopes

1. Go to: https://github.com/settings/tokens
2. Click on your token
3. Ensure these scopes are selected:
   - ✅ `repo` - Full repository access
   - ✅ `workflow` - Workflow management
   - ✅ `read:org` - Organization access (if using org repos)

#### B. Check Supabase Key Type

```bash
# ❌ WRONG: Using anon key for backend operations
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQ...

# ✅ CORRECT: Using service_role key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0Ijox...
```

Get correct key from: Project Settings → API → `service_role` secret

#### C. Check Sentry Token Permissions

1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Click on your token
3. Ensure these permissions:
   - ✅ `project:read`
   - ✅ `event:read`
   - ✅ `org:read`

---

### 5. "Isolation violation" / "Credentials in project"

**Error Message**:
```
❌ Isolation violation detected!

Found credentials in project directory:
  - /Users/you/project/.env (contains GITHUB_TOKEN)

Expected location:
  - ~/.versatil/.env
```

**Cause**: Credentials stored in project directory instead of `~/.versatil/`.

**Solutions**:

#### A. Move Credentials to Correct Location

```bash
# Move credentials
mv .env ~/.versatil/.env

# Secure permissions
chmod 600 ~/.versatil/.env

# Remove from project
rm -f .env

# Add to .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: add .env to .gitignore"
```

#### B. Validate Isolation

```bash
# Run isolation check
npm run validate:isolation

# Expected output:
# ✅ Isolation validated
# ✅ No framework files in project
# ✅ Credentials in ~/.versatil/.env
```

#### C. Clean Up Accidentally Committed Credentials

```bash
# Remove from git history (CAREFUL!)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (if you own the repo)
git push origin --force --all

# Rotate compromised API tokens immediately!
```

---

## MCP-Specific Issues

### GitHub MCP

#### Issue: "Repository not found"

**Solution**:
```bash
# Check repository exists
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/owner/repo

# Verify owner/repo in .env
cat ~/.versatil/.env | grep GITHUB
```

#### Issue: "Rate limit exceeded"

**Solution**:
```bash
# Check current rate limit
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# Upgrade to authenticated requests (5000/hour vs 60/hour)
# Ensure GITHUB_TOKEN is set correctly
```

---

### Playwright MCP

#### Issue: "Browser not installed"

**Error**:
```
Error: Executable doesn't exist at /Users/you/.cache/ms-playwright/chromium-1234/chrome-mac/Chromium.app
```

**Solution**:
```bash
# Install Playwright browsers
npm run playwright:install

# Or install specific browser
npx playwright install chromium

# Verify installation
ls ~/.cache/ms-playwright/
```

#### Issue: "Display server not found" (Linux)

**Solution**:
```bash
# Install Xvfb for headless display
sudo apt-get install xvfb

# Run with Xvfb
xvfb-run --auto-servernum npm run test:e2e
```

---

### Supabase MCP

#### Issue: "Vector store not initialized"

**Solution**:
```bash
# Run migrations
npm run migrate:vector-store

# Check migration status
npm run migrate:vector-store:status

# Validate schema
npm run migrate:vector-store:validate
```

#### Issue: "Connection pool exhausted"

**Solution**:

Edit `~/.versatil/.env`:
```bash
# Increase pool size
DB_POOL_MIN=2
DB_POOL_MAX=20  # Was 10
DB_POOL_IDLE_TIMEOUT=30000
```

---

### Semgrep MCP

#### Issue: "Slow scan performance" (> 3 seconds)

**Solution**:

Reduce scan scope in `.semgrepconfig.yml`:

```yaml
rules:
  - id: security-audit
    pattern-either:
      - pattern: eval(...)
      - pattern: exec(...)
    severity: ERROR
    languages: [javascript, typescript]
    paths:
      include:
        - src/  # Only scan src/
      exclude:
        - node_modules/
        - dist/
        - test/
```

---

### Sentry MCP

#### Issue: "DSN parsing failed"

**Error**:
```
Error: Invalid Sentry DSN format
```

**Solution**:

Verify DSN format:
```bash
# Correct format
SENTRY_DSN=https://<key>@<organization>.ingest.sentry.io/<project-id>

# Example
SENTRY_DSN=https://1234567890abcdef@o123456.ingest.sentry.io/123456
```

Get correct DSN from: Settings → Projects → [Your Project] → Client Keys (DSN)

---

## Network & Connectivity

### Firewall Blocking MCP Connections

**Symptom**: All MCPs timeout or fail to connect.

**Solution**:

#### A. Check Firewall Rules

**macOS**:
```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Allow Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
```

**Linux (ufw)**:
```bash
# Allow outbound HTTPS
sudo ufw allow out 443/tcp
```

#### B. Configure Proxy (if behind corporate proxy)

Edit `~/.versatil/.env`:
```bash
# HTTP proxy
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080

# No proxy for local services
NO_PROXY=localhost,127.0.0.1,.local
```

---

### SSL/TLS Certificate Errors

**Error**:
```
Error: unable to verify the first certificate
```

**Solution**:

#### A. Trust Self-Signed Certificates (Development Only)

```bash
# ⚠️ DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

#### B. Add Corporate CA Certificate

```bash
# macOS
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /path/to/ca.crt

# Linux
sudo cp /path/to/ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

---

## Performance Issues

### MCP Health Check Slow (> 10 seconds)

**Cause**: Too many MCPs or network latency.

**Solutions**:

#### A. Disable Unused MCPs

Comment out in `.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    // "exa": {  // Disabled
    //   "command": "npx",
    //   ...
    // }
  }
}
```

#### B. Increase Health Check Timeout

```bash
# Run with longer timeout
MCP_HEALTH_TIMEOUT=30000 npm run mcp:health
```

#### C. Run Health Checks in Parallel

Edit `scripts/mcp-health-check.cjs`:

```javascript
// Before (sequential)
for (const [name, config] of Object.entries(configs)) {
  results.push(await this.checkMCP(name, config));
}

// After (parallel)
const promises = Object.entries(configs).map(([name, config]) =>
  this.checkMCP(name, config)
);
results = await Promise.all(promises);
```

---

### High Memory Usage (> 1GB)

**Cause**: Too many concurrent MCP connections or memory leak.

**Solutions**:

#### A. Limit Concurrent Connections

Edit `~/.versatil/.env`:
```bash
MCP_MAX_CONNECTIONS=5  # Was 10
MCP_CONNECTION_POOL_SIZE=3  # Was 5
```

#### B. Monitor Memory Usage

```bash
# Watch memory usage
watch -n 5 'ps aux | grep mcp'

# Or use npm script
npm run monitor -- --watch
```

#### C. Restart MCP Connections Periodically

Add to cron (Linux/macOS):
```bash
# Restart MCPs daily at 3 AM
0 3 * * * cd ~/.versatil && npm run mcp:restart
```

---

## Security & Permissions

### Credentials Leaked to Git

**Immediate Actions**:

1. **Rotate Compromised Tokens** (highest priority)
   ```bash
   # GitHub: Delete token immediately
   # https://github.com/settings/tokens

   # Supabase: Rotate service key
   # https://app.supabase.com → Project Settings → API → Generate New

   # Sentry: Revoke auth token
   # https://sentry.io/settings/account/api/auth-tokens/
   ```

2. **Remove from Git History**
   ```bash
   # Use BFG Repo-Cleaner (faster than git filter-branch)
   brew install bfg  # macOS
   # Or download from: https://rtyley.github.io/bfg-repo-cleaner/

   # Remove .env files
   bfg --delete-files .env

   # Clean git history
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive

   # Force push
   git push origin --force --all
   ```

3. **Verify Removal**
   ```bash
   # Search for leaked credentials
   git log --all --full-history -- '*.env'

   # Should return no results
   ```

---

### File Permission Errors

**Error**:
```
Error: EACCES: permission denied, open '~/.versatil/.env'
```

**Solution**:
```bash
# Fix file permissions
chmod 600 ~/.versatil/.env
chmod 700 ~/.versatil/

# Verify
ls -la ~/.versatil/.env
# Should show: -rw------- (owner read/write only)
```

---

## Advanced Troubleshooting

### Enable Debug Logging

#### A. Framework-Wide Debug

```bash
# Set debug level
export LOG_LEVEL=debug

# Run command with debug output
DEBUG=* npm run mcp:health
```

#### B. MCP-Specific Debug

Edit `.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "DEBUG": "github-mcp:*",  // Enable debug logs
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

#### C. View MCP Logs

```bash
# Framework logs
tail -f ~/.versatil/logs/opera-mcp.log

# MCP-specific logs
tail -f ~/.versatil/logs/mcp-github.log
tail -f ~/.versatil/logs/mcp-playwright.log
```

---

### Capture Network Traffic

Use `mitmproxy` to inspect MCP API calls:

```bash
# Install mitmproxy
brew install mitmproxy  # macOS
# Or: pip install mitmproxy

# Start proxy
mitmproxy -p 8080

# Configure proxy for MCPs
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080

# Run MCP command
npm run mcp:health

# View captured requests in mitmproxy UI
```

---

### Generate Debug Report

```bash
# Comprehensive debug report
npm run doctor -- --report > debug-report.txt

# Includes:
# - Framework version
# - Node.js version
# - MCP configurations
# - Health check results
# - Environment variables (sanitized)
# - Recent logs
# - System information
```

Send `debug-report.txt` when requesting support.

---

## Getting Help

### Before Asking for Help

1. **Run diagnostics**:
   ```bash
   npm run doctor
   npm run mcp:health:verbose
   npm run validate:isolation
   ```

2. **Check logs**:
   ```bash
   tail -100 ~/.versatil/logs/opera-mcp.log
   ```

3. **Search existing issues**:
   - GitHub: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues

### Reporting Bugs

Create an issue with:

1. **Error message** (full stack trace)
2. **Steps to reproduce**
3. **Environment**:
   ```bash
   node --version
   npm --version
   versatil --version
   cat ~/.versatil/.env | grep -v 'KEY\|TOKEN\|SECRET'  # Sanitized
   ```
4. **Debug report**: `npm run doctor -- --report`

### Community Support

- **GitHub Discussions**: https://github.com/Nissimmiracles/versatil-sdlc-framework/discussions
- **Discord**: https://discord.gg/versatil
- **Stack Overflow**: Tag `versatil-framework`

### Commercial Support

For enterprise support, contact: support@versatil.dev

---

## Appendix: Error Code Reference

| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| `MCP-001` | Server not found | Package not installed | `npm install -g <package>` |
| `MCP-002` | Missing credentials | Env vars not set | Check `~/.versatil/.env` |
| `MCP-003` | Connection timeout | Network issue or slow server | Increase timeout |
| `MCP-004` | Permission denied | Invalid API token | Check token scopes |
| `MCP-005` | Isolation violation | Credentials in project | Move to `~/.versatil/` |
| `MCP-006` | Invalid configuration | Malformed JSON | Validate `mcp_config.json` |
| `MCP-007` | Rate limit exceeded | Too many API calls | Wait or upgrade tier |
| `MCP-008` | SSL certificate error | Untrusted certificate | Add CA cert |
| `MCP-009` | Memory exhausted | Too many connections | Reduce pool size |
| `MCP-010` | Process crash | Unhandled exception | Check logs, report bug |

---

**Last Updated**: October 19, 2025
**Framework Version**: 6.4.0
