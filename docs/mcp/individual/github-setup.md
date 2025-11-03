# GitHub MCP Setup Guide

Complete setup guide for integrating GitHub MCP with VERSATIL Framework.

---

## Overview

**GitHub MCP** provides repository operations, PR automation, issue tracking, and CI/CD integration for Marcus-Backend, Sarah-PM, and Alex-BA agents.

**Agent Integration**:
- **Marcus-Backend**: Security reviews, code quality checks
- **Sarah-PM**: Sprint tracking, milestone management
- **Alex-BA**: Requirements extraction, user stories

**Setup Time**: ~5 minutes

---

## Prerequisites

- GitHub account (https://github.com)
- Repository access (read/write permissions)
- VERSATIL Framework installed (`versatil --version`)

---

## Step 1: Create GitHub Personal Access Token

### 1.1 Navigate to Token Settings

Go to: https://github.com/settings/tokens/new

### 1.2 Configure Token

**Token Name**: `VERSATIL Framework - [Your Project]`

**Expiration**: 90 days (recommended) or No expiration

**Select Scopes**:
- ✅ **repo** (Full repository access)
  - `repo:status` - Access commit status
  - `repo_deployment` - Access deployment statuses
  - `public_repo` - Access public repositories
  - `repo:invite` - Access repository invitations
  - `security_events` - Read security events
- ✅ **workflow** (Update GitHub Action workflows)
- ✅ **read:org** (Read organization data)
  - Required if using organization repositories
- ✅ **read:discussion** (Read discussions - optional)
- ✅ **read:packages** (Read packages - optional)

### 1.3 Generate Token

1. Click **Generate token** (bottom of page)
2. **Copy token immediately** (won't be shown again)
   ```
   ghp_1234567890abcdefghijklmnopqrstuvwxyz12
   ```
3. Store securely (e.g., password manager)

**Security Note**: Treat this token like a password. Anyone with access can perform repository operations.

---

## Step 2: Configure Credentials

### 2.1 Add to Environment File

Edit `~/.versatil/.env`:

```bash
# Open file
nano ~/.versatil/.env

# Add GitHub credentials
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz12
GITHUB_OWNER=your-username  # Or organization name
GITHUB_REPO=your-repo-name

# Optional: GitHub Enterprise
GITHUB_ENTERPRISE_URL=  # Leave blank for github.com
```

### 2.2 Secure Permissions

```bash
chmod 600 ~/.versatil/.env
```

### 2.3 Verify Configuration

```bash
# Check credentials are set
cat ~/.versatil/.env | grep GITHUB

# Expected output:
# GITHUB_TOKEN=ghp_...
# GITHUB_OWNER=your-username
# GITHUB_REPO=your-repo-name
```

---

## Step 3: Validate MCP Configuration

### 3.1 Check MCP Config File

Verify `.cursor/mcp_config.json` includes GitHub MCP:

```bash
cat .cursor/mcp_config.json | jq '.mcpServers.github'
```

**Expected Output**:
```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": "${GITHUB_TOKEN}"
  },
  "description": "Official GitHub MCP for repository operations"
}
```

### 3.2 Test Connection

```bash
# Run health check
pnpm run mcp:health -- --filter=github
```

**Expected Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 GitHub MCP Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ github: Healthy (120ms)

  Command: npx -y @modelcontextprotocol/server-github
  Response Time: 120ms
  Last Check: 2:34:56 PM

✅ All checks passed
```

---

## Step 4: Test Integration

### 4.1 Test Repository Access

```bash
# Test GitHub API connection
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Expected: Your GitHub user info (JSON)
```

### 4.2 Test MCP Operations

```bash
# Run integration tests
pnpm run test:mcp -- --filter=github

# Expected: All tests passing
```

### 4.3 Test Agent Integration

**With Marcus-Backend**:
```bash
# Security review via Marcus
/marcus review API security for src/api/auth.ts

# Expected: Marcus uses GitHub MCP to:
# - Fetch file from repository
# - Analyze code for vulnerabilities
# - Create GitHub issue if needed
```

**With Sarah-PM**:
```bash
# Sprint planning via Sarah
/sarah create sprint milestone for Q1 2025

# Expected: Sarah uses GitHub MCP to:
# - Create GitHub milestone
# - Link issues to milestone
# - Generate sprint board
```

---

## Advanced Configuration

### Multi-Repository Support

To work with multiple repositories, create a config file:

**File**: `~/.versatil/github-repos.json`

```json
{
  "repositories": [
    {
      "owner": "your-org",
      "repo": "frontend",
      "token": "${GITHUB_TOKEN_FRONTEND}"
    },
    {
      "owner": "your-org",
      "repo": "backend",
      "token": "${GITHUB_TOKEN_BACKEND}"
    }
  ]
}
```

Add tokens to `~/.versatil/.env`:
```bash
GITHUB_TOKEN_FRONTEND=ghp_...
GITHUB_TOKEN_BACKEND=ghp_...
```

### GitHub Enterprise Support

For GitHub Enterprise Server:

Edit `~/.versatil/.env`:
```bash
GITHUB_ENTERPRISE_URL=https://github.yourcompany.com
GITHUB_TOKEN=ghp_your_enterprise_token
```

Edit `.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_API_URL": "${GITHUB_ENTERPRISE_URL}/api/v3"
      }
    }
  }
}
```

### Rate Limit Optimization

Monitor and optimize API usage:

```bash
# Check current rate limit
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# Example output:
# {
#   "resources": {
#     "core": {
#       "limit": 5000,
#       "remaining": 4987,
#       "reset": 1634567890
#     }
#   }
# }
```

Configure caching in `.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_CACHE_TTL": "3600000"  // 1 hour in ms
      }
    }
  }
}
```

---

## Troubleshooting

### Issue: "Repository not found" (404)

**Cause**: Token lacks access to repository or repo name incorrect.

**Solution**:
```bash
# Verify repository exists
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO

# Check owner/repo in .env
cat ~/.versatil/.env | grep GITHUB_OWNER
cat ~/.versatil/.env | grep GITHUB_REPO
```

### Issue: "Rate limit exceeded" (403)

**Cause**: Too many API calls in short time.

**Solution**:
```bash
# Check rate limit status
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# Wait until reset time or implement caching
# Authenticated requests: 5,000/hour
# Unauthenticated: 60/hour
```

### Issue: "Bad credentials" (401)

**Cause**: Invalid or expired token.

**Solution**:
1. Regenerate token: https://github.com/settings/tokens
2. Update `~/.versatil/.env` with new token
3. Restart framework: `pnpm run doctor:fix`

### Issue: "Two-factor authentication required"

**Cause**: Organization requires 2FA.

**Solution**:
1. Enable 2FA on your account: https://github.com/settings/security
2. Generate new token after 2FA enabled
3. Use token (not password) for authentication

---

## Security Best Practices

### Token Security

✅ **DO**:
- Store tokens in `~/.versatil/.env` (not project directory)
- Use `chmod 600` for proper permissions
- Rotate tokens every 90 days
- Use separate tokens for different projects
- Revoke unused tokens immediately

❌ **DON'T**:
- Commit tokens to version control
- Share tokens via Slack/email
- Use production tokens in development
- Grant more permissions than needed

### Scope Minimization

Only grant required scopes:

**Minimal** (read-only operations):
- `public_repo` - Read public repositories
- `read:org` - Read organization data

**Recommended** (framework operations):
- `repo` - Full repository access
- `workflow` - Update workflows
- `read:org` - Organization access

**Full Access** (admin operations):
- `admin:org` - Manage organization
- `delete_repo` - Delete repositories

Use minimal scopes unless absolutely necessary.

### Token Rotation

Automate token rotation:

**Step 1**: Create rotation script

**File**: `~/.versatil/scripts/rotate-github-token.sh`

```bash
#!/bin/bash
# GitHub Token Rotation Script

echo "⚠️  Current token will be revoked. Create new token first!"
echo "Go to: https://github.com/settings/tokens/new"
read -p "Enter new token: " NEW_TOKEN

# Update .env file
sed -i '' "s/GITHUB_TOKEN=.*/GITHUB_TOKEN=$NEW_TOKEN/" ~/.versatil/.env

# Validate new token
if pnpm run mcp:health -- --filter=github; then
  echo "✅ Token rotation successful"
else
  echo "❌ Token validation failed - restore previous token"
fi
```

**Step 2**: Schedule rotation (macOS/Linux)

```bash
# Add to crontab (every 90 days)
crontab -e

# Add line:
0 0 1 */3 * ~/.versatil/scripts/rotate-github-token.sh
```

---

## Usage Examples

### Marcus-Backend: Code Review

```typescript
// Marcus automatically uses GitHub MCP to:
// 1. Fetch PR files
// 2. Run security scan
// 3. Post review comments

const review = await marcus.reviewPR({
  owner: 'your-org',
  repo: 'your-repo',
  prNumber: 123
});

// Output:
// ✅ Security scan: Passed
// ⚠️ 2 suggestions:
//   - Use parameterized queries (sql.ts:45)
//   - Sanitize user input (auth.ts:78)
```

### Sarah-PM: Sprint Planning

```typescript
// Sarah creates milestone via GitHub MCP
const sprint = await sarah.createSprint({
  title: 'Q1 2025 - User Authentication',
  dueDate: '2025-03-31',
  issues: ['#123', '#124', '#125']
});

// Output:
// ✅ Milestone created: Q1 2025 - User Authentication
// ✅ 3 issues linked
// 🔗 https://github.com/your-org/your-repo/milestone/5
```

### Alex-BA: Requirements Extraction

```typescript
// Alex analyzes GitHub issues for requirements
const requirements = await alex.extractRequirements({
  labels: ['enhancement', 'user-story'],
  state: 'open'
});

// Output:
// 📋 Found 12 user stories:
//   1. As a user, I want to login with OAuth
//   2. As an admin, I want to manage user roles
//   ...
```

---

## Performance Optimization

### Caching Strategy

Enable caching to reduce API calls:

```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_CACHE_TTL": "3600000",  // 1 hour
        "GITHUB_CACHE_MAX_SIZE": "100"   // 100 entries
      }
    }
  }
}
```

### Batch Operations

Use GraphQL for batch queries:

```graphql
query {
  repository(owner: "your-org", name: "your-repo") {
    pullRequests(last: 10, states: OPEN) {
      nodes {
        number
        title
        author { login }
        reviews(last: 5) { nodes { state } }
      }
    }
  }
}
```

Marcus-Backend automatically uses GraphQL for complex queries.

---

## Integration Patterns

### Webhook Integration

Receive GitHub events in real-time:

**File**: `~/.versatil/webhooks/github-webhook.ts`

```typescript
import express from 'express';

const app = express();

app.post('/webhook/github', async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  // Handle PR events
  if (event === 'pull_request') {
    if (payload.action === 'opened') {
      // Trigger Marcus review
      await marcus.reviewPR(payload.pull_request);
    }
  }

  res.status(200).send('OK');
});

app.listen(3000);
```

Configure webhook in GitHub:
- URL: `https://your-domain.com/webhook/github`
- Events: Pull requests, Issues, Push

---

## Next Steps

1. **Test GitHub Integration**
   ```bash
   pnpm run test:marcus  # Tests GitHub + Semgrep + Sentry
   ```

2. **Configure Other MCPs**
   - [Semgrep MCP](semgrep-setup.md) - Security scanning
   - [Sentry MCP](sentry-setup.md) - Error monitoring
   - [GitMCP](gitmcp-setup.md) - Repository documentation

3. **Learn Agent Workflows**
   - [Marcus-Backend Guide](../../.claude/agents/marcus-backend.md)
   - [Sarah-PM Guide](../../.claude/agents/sarah-pm.md)
   - [Alex-BA Guide](../../.claude/agents/alex-ba.md)

---

## Additional Resources

- **GitHub REST API**: https://docs.github.com/en/rest
- **GitHub GraphQL API**: https://docs.github.com/en/graphql
- **Token Best Practices**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- **MCP Documentation**: https://modelcontextprotocol.io

---

**Last Updated**: October 19, 2025
**MCP Version**: @modelcontextprotocol/server-github@2025.4.8
