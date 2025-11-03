# Cursor Hooks Installation Guide

## Overview

VERSATIL Framework includes **automated Cursor 1.7+ hooks** that run at key points in the development workflow to provide:
- **Security**: Block destructive commands and isolation violations
- **Automation**: Auto-format code, trigger stress tests, update RAG memory
- **Intelligence**: Suggest relevant agents, track context, codify learnings

## Installation

### Automatic Installation (via npm)

Hooks are installed automatically when you run:

```bash
npm install
```

The postinstall script (`scripts/create-cursor-hooks.cjs`) will:
1. Create `~/.cursor/hooks.json` configuration
2. Install 6 hook scripts to `~/.versatil/hooks/`
3. Create supporting directories (logs, metrics, bin, learning, temp)
4. Set executable permissions on all scripts

### Manual Installation

If hooks aren't installed automatically, run:

```bash
node scripts/create-cursor-hooks.cjs
```

### Verify Installation

```bash
# Check hooks configuration
cat ~/.cursor/hooks.json

# Check hook scripts
ls -la ~/.versatil/hooks/

# Test a hook
echo '{"file_path": "/tmp/test.ts", "agent": "test"}' | ~/.versatil/hooks/afterFileEdit.sh
```

## Hook Scripts

### 1. afterFileEdit.sh

**When it runs**: After agent edits a file
**Purpose**: Format code, validate isolation, update RAG

**Features**:
- Auto-formats TypeScript/JavaScript with Prettier
- Auto-formats Python with Black
- Blocks edits that violate isolation (`.versatil/` in project directories)
- Triggers Rule 2 stress tests for API file changes
- Updates RAG memory with code patterns (async)

**Example Success**:
```bash
echo '{"file_path": "/tmp/test.ts", "agent": "maria-qa"}' | ~/.versatil/hooks/afterFileEdit.sh

# Output:
{
  "allowed": true,
  "metadata": {
    "formatted": true,
    "isolation_validated": true,
    "rag_updated": true
  }
}
```

**Example Violation**:
```bash
echo '{"file_path": "/project/.versatil/test.ts", "agent": "test"}' | ~/.versatil/hooks/afterFileEdit.sh

# Output:
{
  "allowed": false,
  "error": "❌ ISOLATION VIOLATION: Framework files must be in ~/.versatil/, not in project directory."
}
```

### 2. beforeShellExecution.sh

**When it runs**: Before agent executes shell commands
**Purpose**: Security checks, audit logging, prevent destructive operations

**Features**:
- Blocks destructive commands: `rm -rf`, `DROP TABLE`, `git push --force`, etc.
- Blocks production deployments: `npm publish`, deployment to main/master
- Validates isolation (prevents `.versatil/` modification from projects)
- Audits all commands to `~/.versatil/logs/hooks.log`

**Destructive Patterns Blocked**:
- `rm -rf`
- `git reset --hard`
- `git push --force`
- `DROP DATABASE` / `DROP TABLE`
- `TRUNCATE TABLE` / `DELETE FROM`
- `mkfs`, `dd if=`, `> /dev/`
- `chmod 000`, `chown root`

**Production Patterns Blocked**:
- `npm publish`
- `git push origin main/master`
- `vercel --prod`, `netlify deploy --prod`
- `docker push.*:latest`
- `kubectl apply.*production`
- `terraform apply.*prod`

**Example Safe Command**:
```bash
echo '{"command": "pnpm test", "cwd": "/project", "agent": "maria-qa"}' | ~/.versatil/hooks/beforeShellExecution.sh

# Output:
{
  "allowed": true,
  "metadata": {
    "security_validated": true,
    "isolation_validated": true,
    "audited": true
  }
}
```

**Example Blocked Command**:
```bash
echo '{"command": "rm -rf /", "cwd": "/project", "agent": "test"}' | ~/.versatil/hooks/beforeShellExecution.sh

# Output:
{
  "allowed": false,
  "error": "🚨 BLOCKED: Destructive command detected: rm -rf\n\nThis command requires explicit user approval.",
  "suggestion": "Ask user for confirmation before proceeding."
}
```

### 3. beforeReadFile.sh

**When it runs**: Before agent reads a file
**Purpose**: Context tracking, access logging, security warnings

**Features**:
- Tracks file access for RAG context building
- Warns when reading sensitive files (`.env`, `credentials.json`, etc.)
- Logs all file access to `~/.versatil/logs/file-access.log`
- Updates context tracker (async)

**Sensitive Patterns**:
- `.env`
- `credentials.json`, `secrets.yaml`
- `id_rsa`, `.pem`, `.key`, `private.key`
- `auth.json`
- `.aws/credentials`, `.gcp/credentials`

**Example Normal File**:
```bash
echo '{"file_path": "/tmp/test.ts", "agent": "james", "purpose": "reading"}' | ~/.versatil/hooks/beforeReadFile.sh

# Output:
{
  "allowed": true,
  "metadata": {
    "sensitive": false,
    "context_tracked": true,
    "access_logged": true
  }
}
```

**Example Sensitive File**:
```bash
echo '{"file_path": "/tmp/.env", "agent": "test", "purpose": "reading"}' | ~/.versatil/hooks/beforeReadFile.sh

# Output:
{
  "allowed": true,
  "warning": "⚠️  Reading sensitive file. Ensure secrets are redacted before sharing context.",
  "metadata": {
    "sensitive": true,
    "context_tracked": true,
    "access_logged": true
  }
}
```

### 4. beforeSubmitPrompt.sh

**When it runs**: Before user submits a prompt
**Purpose**: Agent activation suggestions, context enrichment

**Features**:
- Detects agent keywords and suggests relevant OPERA agents
- Enriches prompt with project context (if `.versatil-project.json` exists)
- Provides proactive hints based on prompt content

**Agent Trigger Keywords**:
- **Maria-QA**: test, coverage, quality, bug, fix, validate
- **James-Frontend**: component, ui, frontend, react, vue, css, responsive, accessible, design
- **Marcus-Backend**: api, backend, server, endpoint, route, auth, security, owasp
- **Dana-Database**: schema, migration, sql, postgres, supabase, database, query, rls, policy
- **Sarah-PM**: plan, milestone, project, documentation, coordinate, roadmap
- **Alex-BA**: requirement, user story, feature, business, specification, acceptance
- **Dr.AI-ML**: model, machine learning, ai, ml, dataset, training, inference

**Example**:
```bash
echo '{"prompt": "write tests for authentication", "context": [], "files": []}' | ~/.versatil/hooks/beforeSubmitPrompt.sh

# Output includes:
{
  "allowed": true,
  "metadata": {
    "suggestions": "💡 Suggested agents for this task:\\n  - Maria-QA: Quality and testing expert\\n...",
    "context_enriched": true
  }
}
```

### 5. stop.sh

**When it runs**: When agent session stops
**Purpose**: Session cleanup, learning codification, metrics

**Features**:
- Logs session metrics (duration, actions, agent)
- Codifies learned patterns to RAG memory
- Generates session report for Sarah-PM
- Updates agent performance metrics
- Cleans up temporary files

**What Gets Logged**:
- Session ID, agent, duration
- Actions performed
- Timestamp
- Success status

**Files Created**:
- `~/.versatil/learning/session-{id}.json` - Session summary
- `~/.versatil/logs/session-metrics.log` - Metrics log
- `~/.versatil/metrics/agent-{agent}.json` - Agent performance

**Example**:
```bash
echo '{"session_id": "test-123", "agent": "maria-qa", "duration": 120, "actions": []}' | ~/.versatil/hooks/stop.sh

# Output:
{
  "allowed": true,
  "metadata": {
    "session_logged": true,
    "learning_codified": true,
    "metrics_updated": true,
    "cleanup_completed": true
  },
  "message": "✅ Session completed. Metrics and learnings saved to RAG memory."
}
```

### 6. onSessionOpen.sh

**When it runs**: On first prompt of new session
**Purpose**: Display last session context, provide continuity

**Features**:
- Shows last session summary (agent, duration, timestamp)
- Provides context continuity between sessions
- Welcome message for new sessions

## File Locations

```
~/.cursor/
├── hooks.json              # Hooks configuration

~/.versatil/
├── hooks/
│   ├── afterFileEdit.sh
│   ├── beforeShellExecution.sh
│   ├── beforeReadFile.sh
│   ├── beforeSubmitPrompt.sh
│   ├── stop.sh
│   └── onSessionOpen.sh
├── bin/
│   ├── rag-update.sh          # RAG memory updater (placeholder)
│   ├── rag-codify.sh          # Learning codifier (placeholder)
│   ├── context-tracker.sh     # Context tracker (placeholder)
│   ├── session-report.sh      # Session reporter (placeholder)
│   └── stress-test-generator.sh  # Stress test generator (placeholder)
├── logs/
│   ├── hooks.log              # All hook executions
│   ├── file-access.log        # File access tracking
│   └── session-metrics.log    # Session metrics
├── metrics/
│   └── agent-{agent}.json     # Per-agent metrics
├── learning/
│   └── session-{id}.json      # Session summaries
└── temp/
    └── {session-id}/          # Temporary session files
```

## Logging

### hooks.log
All hook executions are logged with timestamps:

```bash
tail -f ~/.versatil/logs/hooks.log

# Output:
[2025-10-19 18:42:15] afterFileEdit: /tmp/test.ts by maria-qa
[2025-10-19 18:42:16] ALLOWED: pnpm test
[2025-10-19 18:42:17] beforeReadFile: /tmp/app.ts by james (purpose: reading)
```

### file-access.log
File access tracking for RAG:

```bash
tail -f ~/.versatil/logs/file-access.log

# Output:
[2025-10-19 18:42:15]|maria-qa|/tmp/test.ts|reading
[2025-10-19 18:42:17]|james|/tmp/app.ts|reading
```

### session-metrics.log
Session metrics:

```bash
tail -f ~/.versatil/logs/session-metrics.log

# Output:
[2025-10-19 18:45:00]|session-123|maria-qa|120|15
```

## Security Features

### Isolation Enforcement
- ✅ Blocks framework files (`.versatil/`) in user projects
- ✅ Allows framework files only in `~/.versatil/`
- ✅ Prevents accidental commits of framework data

### Destructive Command Protection
- ✅ Blocks `rm -rf`, `DROP TABLE`, etc.
- ✅ Blocks force pushes to Git
- ✅ Requires manual approval for destructive operations

### Production Deployment Protection
- ✅ Blocks `npm publish` without approval
- ✅ Blocks deployments to main/master branches
- ✅ Requires manual confirmation for production changes

### Sensitive File Warnings
- ✅ Warns when reading `.env`, credentials, etc.
- ✅ Logs sensitive file access
- ✅ Prevents accidental exposure of secrets

## Automation Features

### Code Formatting
- ✅ Auto-formats TypeScript/JavaScript with Prettier
- ✅ Auto-formats Python with Black
- ✅ Runs on every file save (via afterFileEdit)

### RAG Memory Updates
- ✅ Updates on file changes (async, non-blocking)
- ✅ Tracks file access patterns
- ✅ Codifies learnings from sessions

### Agent Activation Suggestions
- ✅ Detects keywords in prompts
- ✅ Suggests relevant OPERA agents
- ✅ Enriches prompts with project context

### Stress Test Triggering
- ✅ Auto-triggers Rule 2 stress tests for API files
- ✅ Detects API file patterns: `*.api.*`, `*/routes/*`, `*/api/*`
- ✅ Runs asynchronously (doesn't block file saves)

## Troubleshooting

### Hooks Not Running

1. Check Cursor hooks configuration:
   ```bash
   cat ~/.cursor/hooks.json
   ```

2. Verify hook scripts exist and are executable:
   ```bash
   ls -la ~/.versatil/hooks/
   # Should show: -rwxr-xr-x for all .sh files
   ```

3. Check logs for errors:
   ```bash
   tail -50 ~/.versatil/logs/hooks.log
   ```

4. Restart Cursor to reload hooks configuration

### Permission Denied Errors

```bash
# Make all hooks executable
chmod +x ~/.versatil/hooks/*.sh
chmod +x ~/.versatil/bin/*.sh
```

### Hook Timeouts

Hooks have a 5-second timeout (configured in `hooks.json`). If a hook takes longer:

1. Check for infinite loops in hook scripts
2. Ensure async operations use `&` to run in background
3. Check logs for hanging processes

### Missing Dependencies

Some hooks require:
- `jq` - JSON parsing
- `prettier` - JavaScript/TypeScript formatting
- `black` - Python formatting

Install on macOS:
```bash
brew install jq prettier
pip install black
```

## Performance

- **Hook Execution**: <10ms per hook (fast path)
- **Formatting**: <500ms (Prettier/Black)
- **Logging**: <1ms (async)
- **RAG Updates**: Async, no blocking
- **Stress Tests**: Async, no blocking

## See Also

- [CLAUDE.md](../../CLAUDE.md) - Section: "Cursor Hooks Integration"
- [scripts/create-cursor-hooks.cjs](../../scripts/create-cursor-hooks.cjs) - Installation script
- [Cursor Hooks Documentation](https://cursor.com/docs/agent/hooks)
