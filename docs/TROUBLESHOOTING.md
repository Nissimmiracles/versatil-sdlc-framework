# VERSATIL Framework Troubleshooting Guide

**Version**: 7.7.0+
**Last Updated**: 2025-10-27

Comprehensive troubleshooting guide for VERSATIL OPERA Framework covering common issues, error messages, and solutions.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Build & Compilation](#build--compilation)
3. [Agent Activation](#agent-activation)
4. [RAG Storage](#rag-storage)
5. [Context Enforcement](#context-enforcement)
6. [MCP Integration](#mcp-integration)
7. [Hooks](#hooks)
8. [Performance](#performance)
9. [Quality Gates](#quality-gates)
10. [Common Error Messages](#common-error-messages)

---

## Installation Issues

### npm install fails with peer dependency errors

**Symptom**:
```
npm ERR! peer dependency missing: @anthropic-ai/sdk@^0.30.0
```

**Solution**:
```bash
# Use --legacy-peer-deps flag
npm install --legacy-peer-deps

# Or update npm to latest
npm install -g npm@latest
npm install
```

---

### TypeScript compilation errors after install

**Symptom**:
```
node_modules/@types/node/index.d.ts(37,13): error TS2403: Subsequent variable declarations must have the same type.
```

**Solution**:
```bash
# Clear TypeScript cache
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install

# Or update TypeScript
npm install typescript@latest --save-dev
```

---

### "Command not found: versatil" after installation

**Symptom**:
```bash
$ versatil
-bash: versatil: command not found
```

**Solution**:
VERSATIL is a chat-based framework, not a CLI tool. Use slash commands in Claude Desktop:
```bash
/plan "Add feature"
/work todos/001-pending-p1-feature.md
```

**Alternative**: If you want CLI access, add npm bin to PATH:
```bash
export PATH="$PATH:./node_modules/.bin"
```

---

## Build & Compilation

### Build hangs indefinitely after TypeScript compilation

**Symptom**:
```bash
$ npm run build
> tsc
[build continues indefinitely without completing]
```

**Root Cause**: `afterBuild.sh` hook runs full test suite (slow)

**Solution** (FIXED in v7.7.0):
Hook now has QUICK_MODE flag that skips tests during build. Update hook:
```bash
npm run build  # Should complete in <10 seconds now
```

**Manual verification**:
```bash
# Run tests separately if needed
npm test
npm run test:coverage
```

---

### "Cannot find module" errors after build

**Symptom**:
```
Error: Cannot find module './dist/index.js'
```

**Solution**:
```bash
# Verify build artifacts exist
ls dist/

# If missing, check tsconfig.json
cat tsconfig.json | grep outDir  # Should be "dist"

# Rebuild
rm -rf dist/
npm run build
```

---

### Build succeeds but dist/ is empty

**Symptom**:
```bash
$ npm run build
# No errors, but dist/ is empty
```

**Solution**:
```bash
# Check tsconfig.json includes
cat tsconfig.json

# Should have:
{
  "include": ["src/**/*", ".claude/**/*"],
  "exclude": ["node_modules", "dist"]
}

# If wrong, fix and rebuild
npm run build
```

---

## Agent Activation

### Agent not auto-activating on file edit

**Symptom**: Edit `*.test.ts` file but Maria-QA doesn't activate

**Diagnosis**:
```bash
# Check hook is installed
cat .claude/settings.json | grep UserPromptSubmit

# Check hook compiled
ls .claude/hooks/dist/before-prompt.cjs
```

**Solution 1**: Recompile hooks
```bash
npm run build
# Hooks should compile to .claude/hooks/dist/
```

**Solution 2**: Verify hook triggers
```bash
# Check hook logs
tail -f ~/.versatil/logs/hooks/before-prompt.log
```

**Solution 3**: Manual activation
```bash
# Use slash command directly
/maria-qa "Validate test coverage for src/auth.test.ts"
```

---

### "Agent not available in this context" error

**Symptom**:
```
Error: Sarah-PM agent is not available in user project context
```

**Root Cause**: Sarah-PM is framework-only agent, blocked in user projects

**Solution**:
This is **intentional** - Sarah-PM is for framework development only. Use appropriate agents:
- **User projects**: Maria-QA, Marcus-Backend, James-Frontend, Dana-Database, Alex-BA, Dr.AI-ML
- **Framework dev**: All agents including Sarah-PM

**Verify context**:
```bash
/setup --verify
# Shows current context and allowed agents
```

---

### Agent invocation returns no output

**Symptom**: Agent task completes but returns empty result

**Diagnosis**:
```typescript
await Task({
  subagent_type: "Maria-QA",
  description: "Validate coverage",
  prompt: "Check test coverage"  // Too vague!
});
// Returns: {}
```

**Solution**: Provide detailed structured prompts
```typescript
await Task({
  subagent_type: "Maria-QA",
  description: "Validate test coverage",
  prompt: `
    Analyze test coverage for src/auth.ts.

    Requirements:
    - Check coverage is ≥80% (lines, statements, branches, functions)
    - Verify AAA pattern compliance
    - Identify untested edge cases

    Return structured result with:
    - coverage_percentage: number
    - issues: string[]
    - recommendations: string[]
    - safe_to_proceed: boolean
  `
});
```

---

## RAG Storage

### "RAG_CONNECTION_ERROR: Unable to connect to Public RAG"

**Symptom**:
```
Error: RAG_CONNECTION_ERROR: Unable to connect to Public RAG
Code: unavailable
```

**Root Cause**: Firestore connection failure (network, credentials, quota)

**Solution 1**: Check network
```bash
# Test Firestore connectivity
curl -I https://firestore.googleapis.com
```

**Solution 2**: Check credentials
```bash
# Verify Google Cloud credentials
cat ~/.versatil/.env | grep GOOGLE_APPLICATION_CREDENTIALS

# If missing, authenticate
gcloud auth application-default login
```

**Solution 3**: Check quota
```bash
# Check Firestore quota usage
gcloud firestore operations list --project=centering-vine-454613-b3
```

**Fallback**: Use local RAG (no network required)
```bash
# Configure local RAG
npm run setup:private-rag
# Choose "Local JSON" option
```

---

### Private RAG not storing patterns

**Symptom**: Run `/learn` but patterns don't appear in Private RAG

**Diagnosis**:
```bash
/rag status
# Shows Private RAG: "Not configured"
```

**Solution**:
```bash
# Configure Private RAG
npm run setup:private-rag

# Follow wizard steps:
# 1. Choose storage backend (Firestore/Supabase/Local)
# 2. Enter credentials
# 3. Test connection
# 4. Verify storage

# Then retry
/learn "Completed auth in 24h"
/rag status  # Should show pattern count increased
```

---

### "Pattern classification accuracy below 70%"

**Symptom**: `/rag verify` shows classification accuracy <70%

**Root Cause**: Ambiguous pattern descriptions, missing keywords

**Solution**:
```bash
# Re-classify patterns manually
/rag migrate --dry-run  # Preview classification

# Add explicit keywords to pattern descriptions
# GOOD: "Company-specific OAuth2 integration with internal LDAP"
# BAD:  "Auth workflow"

# Then migrate
/rag migrate --force
```

---

### RAG query returns no results

**Symptom**:
```bash
/rag query "authentication"
# Returns: "No patterns found"
```

**Diagnosis**:
```bash
# Check RAG has patterns
/rag status
# Shows: "Public RAG: 1,247 patterns"

# Check similarity threshold
/rag query "authentication" --min-similarity=0.5  # Lower threshold
```

**Solution**:
- **Too specific query**: Broaden search term
  - Bad: "OAuth2 with Google and GitHub using Passport.js"
  - Good: "OAuth2 authentication"

- **Typos**: Check spelling
  - Bad: "authentcation"
  - Good: "authentication"

- **Empty RAG**: Add patterns via `/learn`

---

## Context Enforcement

### "Context violation: Framework internals blocked"

**Symptom**:
```
Error: Context violation: Access to src/agents/core/agent-registry.ts blocked in user project context
```

**Root Cause**: Attempting to access framework source from user project

**Solution**: This is **intentional** - framework internals are blocked in user projects for privacy isolation.

**Workaround**: If you need framework functionality, use public APIs:
- ❌ Read `src/agents/core/agent-registry.ts` (blocked)
- ✅ Use `/help agents` (allowed)
- ✅ Use agent slash commands (allowed)

---

### Context detection wrong (framework detected as user project)

**Symptom**: `/setup` shows "User Project Mode" but this is the framework repo

**Diagnosis**:
```bash
# Check git remote
git remote -v
# Should show: versatil-sdlc-framework.git

# Check package.json name
cat package.json | grep '"name"'
# Should show: "@versatil/sdlc-framework"
```

**Solution**:
```bash
# Reset context detection
/setup --reset

# Manual verification
/setup --verify
# Should show: "Framework Development Mode"
```

---

### Hook not injecting context boundaries

**Symptom**: No context enforcement shown in prompt

**Diagnosis**:
```bash
# Check hook output
tail -f ~/.versatil/logs/hooks/before-prompt.log

# Should show:
# [2025-10-27] Context detected: user-project
# [2025-10-27] Injecting boundaries...
```

**Solution 1**: Recompile hooks
```bash
npm run build
# Check hook exists
ls .claude/hooks/dist/before-prompt.cjs
```

**Solution 2**: Verify hook configured
```bash
cat .claude/settings.json

# Should have:
{
  "hooks": {
    "UserPromptSubmit": {
      "command": ".claude/hooks/dist/before-prompt.cjs"
    }
  }
}
```

**Solution 3**: Check hook permissions
```bash
chmod +x .claude/hooks/dist/before-prompt.cjs
```

---

## MCP Integration

### Supabase MCP not connecting

**Symptom**:
```
Error: Supabase MCP server connection failed
```

**Diagnosis**:
```bash
# Check MCP configuration
cat ~/.claude/claude_desktop_config.json | grep supabase

# Should show:
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJxxx..."
      }
    }
  }
}
```

**Solution 1**: Verify credentials
```bash
# Test Supabase connection
curl -H "apikey: YOUR_SERVICE_ROLE_KEY" \
     https://xxx.supabase.co/rest/v1/

# Should return 200 OK
```

**Solution 2**: Restart Claude Desktop
```bash
# Kill Claude Desktop
pkill -9 "Claude"

# Restart and retry
```

**Solution 3**: Check MCP server logs
```bash
# MCP logs location (macOS)
tail -f ~/Library/Logs/Claude/mcp*.log
```

---

### GitHub MCP returning 401 Unauthorized

**Symptom**:
```
Error: GitHub API returned 401 Unauthorized
```

**Root Cause**: Invalid or expired GitHub token

**Solution**:
```bash
# Generate new GitHub token
# Go to: https://github.com/settings/tokens
# Scopes needed: repo, read:org

# Update MCP config
vi ~/.claude/claude_desktop_config.json

# Add token:
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_TOKEN": "ghp_NEW_TOKEN_HERE"
      }
    }
  }
}

# Restart Claude Desktop
```

---

### "MCP server not responding" timeout

**Symptom**:
```
Error: MCP server timed out after 30s
```

**Solution 1**: Check server health
```bash
# List running MCP servers
ps aux | grep mcp

# Kill stuck servers
pkill -f "server-supabase"
pkill -f "server-github"

# Restart Claude Desktop
```

**Solution 2**: Increase timeout (if slow network)
```bash
# Edit MCP config
vi ~/.claude/claude_desktop_config.json

# Add timeout:
{
  "mcpServers": {
    "supabase": {
      "timeout": 60000  // 60 seconds
    }
  }
}
```

---

## Hooks

### Hook not firing on expected trigger

**Symptom**: Edit file but `post-file-edit.ts` doesn't fire

**Diagnosis**:
```bash
# Check hook is registered
cat .claude/settings.json | grep AfterToolCall

# Check hook compiled
ls .claude/hooks/dist/post-file-edit.cjs
```

**Solution**:
```bash
# Recompile hooks
npm run build

# Check hook logs
tail -f ~/.versatil/logs/hooks/post-file-edit.log

# Should show:
# [2025-10-27] File edited: src/auth.test.ts
# [2025-10-27] Suggesting agent: Maria-QA
```

---

### "Hook failed with exit code 1"

**Symptom**:
```
Error: Hook before-prompt.ts failed with exit code 1
```

**Diagnosis**:
```bash
# Check hook logs for error
tail -50 ~/.versatil/logs/hooks/before-prompt.log

# Common errors:
# - Module not found (missing dependency)
# - JSON parse error (malformed config)
# - Permission denied (wrong chmod)
```

**Solution 1**: Install dependencies
```bash
npm install
npm run build
```

**Solution 2**: Fix permissions
```bash
chmod +x .claude/hooks/dist/*.cjs
```

**Solution 3**: Check Node.js version
```bash
node --version
# Should be ≥18.0.0

# Update if needed
nvm install 18
nvm use 18
```

---

### Hook output not appearing in context

**Symptom**: Hook executes but output not visible to Claude

**Root Cause**: Hook outputting JSON instead of plain text

**Solution** (FIXED in v7.1.1):
Hooks must output plain text to stdout, not JSON:

```typescript
// ❌ WRONG (JSON wrapper)
console.log(JSON.stringify({
  role: "system",
  content: "Context enforcement text"
}));

// ✅ CORRECT (plain text)
console.log("Context enforcement text");
```

**Verify fix**:
```bash
# Run hook manually
.claude/hooks/dist/before-prompt.cjs <<< '{"working_dir": "."}'

# Should output plain text, not JSON
```

---

## Performance

### RAG queries taking >5 seconds

**Symptom**: `/plan` command hangs for 5-10 seconds

**Diagnosis**:
```bash
# Check RAG backend
/rag status

# If using direct Firestore (no Cloud Run):
# Query time: 2,000-5,000ms (slow)

# If using Cloud Run:
# Query time: 50-100ms (fast)
```

**Solution**: Enable Cloud Run edge acceleration
```bash
# Check Cloud Run status
gcloud run services list --project=centering-vine-454613-b3

# Should show:
# NAME                    URL
# versatil-rag-cloudrun   https://versatil-rag-xxx.run.app

# If not deployed, deploy:
./scripts/deploy-cloudrun.sh
```

**Alternative**: Use GraphRAG (offline, no network)
```bash
# GraphRAG is automatic fallback if Firestore slow
# Check logs:
tail -f ~/.versatil/logs/rag.log

# Should show:
# [2025-10-27] Search method: graphrag (68ms)
```

---

### Agent invocations slow (>60s per agent)

**Symptom**: `/work` takes 10+ minutes for simple tasks

**Root Cause**: Over-detailed agent prompts, redundant invocations

**Solution 1**: Optimize prompts
```typescript
// ❌ TOO DETAILED (sends entire codebase)
await Task({
  subagent_type: "Maria-QA",
  prompt: `
    Here's the entire 10,000-line codebase...
    [massive context dump]
    Please validate coverage.
  `
});

// ✅ CONCISE (targeted context)
await Task({
  subagent_type: "Maria-QA",
  prompt: `
    Validate test coverage for src/auth.ts.
    Current coverage: 65% (need 80%+).
    Generate missing tests.
  `
});
```

**Solution 2**: Reduce redundant calls
```typescript
// ❌ BAD (3 sequential calls)
await Task({ subagent_type: "Maria-QA", prompt: "Check coverage" });
await Task({ subagent_type: "Maria-QA", prompt: "Generate tests" });
await Task({ subagent_type: "Maria-QA", prompt: "Run tests" });

// ✅ GOOD (1 call)
await Task({
  subagent_type: "Maria-QA",
  prompt: `
    1. Check coverage for src/auth.ts
    2. Generate missing tests if <80%
    3. Run tests and report results
  `
});
```

---

### Build taking >5 minutes

**Symptom**: `npm run build` extremely slow

**Root Cause**: Running full test suite during build

**Solution** (FIXED in v7.7.0):
```bash
# Verify QUICK_MODE enabled in afterBuild.sh
grep "QUICK_MODE" ~/.versatil/hooks/afterBuild.sh

# Should show:
# QUICK_MODE=false
# if [ "$BUILD_COMMAND" = "npm run build" ] && [ -z "$CI" ]; then
#   QUICK_MODE=true
# fi

# Build should complete in <10 seconds now
npm run build
```

---

## Quality Gates

### "Quality gate failed: Test coverage below 80%"

**Symptom**:
```
Error: Quality gate failed
Reason: Test coverage 65% (requires 80%+)
```

**Solution**:
```bash
# Check current coverage
npm run test:coverage

# Coverage report:
# Statements   : 65% ( 130/200 )
# Branches     : 58% ( 23/40 )
# Functions    : 70% ( 14/20 )
# Lines        : 65% ( 128/197 )

# Identify untested files
# (Files with 0% coverage)

# Generate tests
/maria-qa "Generate tests for src/utils/crypto.ts to reach 80%+ coverage"

# Verify
npm run test:coverage
```

---

### "OWASP compliance failed: SQL injection vulnerability"

**Symptom**:
```
Error: Quality gate failed
Reason: OWASP Top 10 violation - SQL injection in src/api/users.ts:42
```

**Solution**:
```bash
# Review finding
cat src/api/users.ts | sed -n '40,45p'

# Fix SQL injection (use parameterized queries)
# ❌ BAD:
db.query(`SELECT * FROM users WHERE id = ${userId}`)

# ✅ GOOD:
db.query('SELECT * FROM users WHERE id = $1', [userId])

# Re-scan
npm run security:scan

# Or use agent
/marcus-backend "Fix SQL injection vulnerability in src/api/users.ts:42"
```

---

### "API response time exceeds 200ms threshold"

**Symptom**:
```
Error: Quality gate failed
Reason: API response time 450ms (requires <200ms)
```

**Solution**:
```bash
# Profile endpoint
/marcus-backend "Optimize API response time for POST /api/auth/login (currently 450ms, target <200ms)"

# Common optimizations:
# 1. Add database indexes
# 2. Cache frequent queries (Redis)
# 3. Reduce N+1 queries
# 4. Use connection pooling
# 5. Compress responses (gzip)
```

---

## Common Error Messages

### "Module not found: Cannot resolve '@anthropic-ai/sdk'"

**Solution**:
```bash
npm install @anthropic-ai/sdk
```

---

### "TS2339: Property 'getInstance' does not exist"

**Root Cause**: TypeScript compilation error (false alarm)

**Solution**:
```bash
# Clean rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

---

### "EACCES: permission denied"

**Solution**:
```bash
# Fix file permissions
chmod -R 755 .claude/hooks/
chmod +x .claude/hooks/dist/*.cjs
```

---

### "Context violation: Sarah-PM blocked in user project"

**Solution**: This is **intentional**. Use alternative agents:
- Sarah-PM → Use `/plan` + `/work` (automated orchestration)
- For manual coordination, use individual agents

---

### "RAG pattern not found for query: [X]"

**Solution**:
```bash
# Add pattern manually
/learn "Implemented [X] feature. Effort: [Y]h. Key insights: [Z]"

# Or adjust similarity threshold
/rag query "[X]" --min-similarity=0.5
```

---

## Getting Help

### Check framework health

```bash
/monitor
# Shows comprehensive health dashboard
```

---

### Run diagnostics

```bash
/framework-debug
# Collects diagnostic information automatically
```

---

### View logs

```bash
# Hook logs
tail -f ~/.versatil/logs/hooks/*.log

# Guardian logs
/guardian-logs all --follow

# Build logs
tail -f ~/.versatil/logs/build.log
```

---

### Contact support

- **GitHub Issues**: [anthropics/claude-code/issues](https://github.com/anthropics/claude-code/issues)
- **Documentation**: [docs/README.md](./README.md)
- **Help Command**: `/help [issue description]`

---

## Related Documentation

- [Installation Guide](./getting-started/installation.md)
- [Quick Start](./getting-started/quick-start.md)
- [MCP Troubleshooting](./mcp/MCP_TROUBLESHOOTING.md)
- [Agent Troubleshooting](./guides/agent-troubleshooting.md)
- [API Reference](./API_REFERENCE.md)

---

**Last Updated**: 2025-10-27
**Version**: 7.7.0+
**Status**: ✅ Production Ready
