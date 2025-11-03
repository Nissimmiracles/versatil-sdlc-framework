# 🎨 Visual Features Setup Guide

> **Troubleshooting Guide**: Why visual features (Session Compass, statusbar, automation) aren't appearing in your project

---

## 🔍 Problem Diagnosis

**Symptoms**:
- ❌ No Session Compass on project open
- ❌ No statusbar/statusline updates
- ❌ No automation running
- ❌ No versioning tracking
- ❌ Workflow automation not executing
- ❌ Test automation not running

**Root Cause**: VERSATIL daemon is **not running** and/or project is not properly initialized.

---

## ✅ Quick Fix (5 Minutes)

### Step 1: Check if Daemon is Running

```bash
# Check for running VERSATIL daemon
ps aux | grep "versatil-daemon\|versatil-mcp" | grep -v grep

# Expected output: (one or more processes)
# nissimmenashe  12345  versatil-daemon --project "/path/to/project"

# If EMPTY: Daemon is NOT running (this is your problem)
```

### Step 2: Start the Daemon

**Option A: Global daemon (recommended)**

```bash
# Start daemon for all projects
cd ~/.versatil/
./bin/versatil-daemon.js start

# Verify it started
ps aux | grep versatil-daemon | grep -v grep
```

**Option B: Project-specific daemon**

```bash
# Start daemon for specific project
cd /path/to/your/project
pnpm run daemon:start

# OR if VERSATIL is installed globally
versatil-daemon start --project "$(pwd)"
```

### Step 3: Verify Your Project Has VERSATIL Setup

```bash
cd /path/to/your/project

# Check 1: Does .versatil-project.json exist?
ls -la .versatil-project.json

# Check 2: Are npm scripts available?
pnpm run | grep -E "daemon|compass|monitor"

# Check 3: Is framework home accessible?
ls -la ~/.versatil/

# Expected:
# ✅ .versatil-project.json exists
# ✅ pnpm run daemon:start, session:compass available
# ✅ ~/.versatil/ directory with hooks/, memories/, etc.
```

**If ANY check fails**, run initialization:

```bash
# Initialize VERSATIL for this project
cd /path/to/your/project
npm install -g versatil-sdlc-framework  # If not installed
versatil init  # OR: npx versatil-sdlc-framework init
```

### Step 4: Test Session Compass

```bash
# Should display: git status, last session, next tasks
pnpm run session:compass:brief

# Expected output:
# 📁 Project: Your Project Name
# 🌿 Branch: main
# 📊 Git: Clean (or shows modified files)
# ⏰ Last Session: 21m ago (saved 104 min, score: 7.1/10)
```

**If error**: "npm ERR! Missing script: 'session:compass:brief'"
→ Your project's `package.json` is missing VERSATIL scripts. Reinitialize with `versatil init`.

### Step 5: Test Hooks

```bash
# Check hooks are configured
cat ~/.cursor/hooks.json

# Should contain:
# - afterFileEdit
# - beforeShellExecution
# - beforeReadFile
# - beforeSubmitPrompt (with onSessionOpen.sh)
# - afterTaskComplete
# - stop

# Test hook execution
tail -f ~/.versatil/logs/hooks.log &
# Open Cursor → Should see "onSessionOpen: New session starting"
```

---

## 🛠️ Complete Setup from Scratch

### If Your Project Has Never Used VERSATIL:

#### 1. Install VERSATIL Framework

```bash
# Option A: Global installation (recommended)
npm install -g versatil-sdlc-framework

# Option B: Project dependency
cd /path/to/your/project
npm install --save-dev versatil-sdlc-framework
```

#### 2. Initialize Project

```bash
cd /path/to/your/project
versatil init

# This creates:
# ✅ .versatil-project.json (project configuration)
# ✅ Adds npm scripts to package.json
# ✅ Configures ~/.cursor/hooks.json
# ✅ Sets up ~/.versatil/ framework home (if not exists)
```

**Interactive Prompts**:
```
? Project name: [Auto-detected from package.json]
? Project type: [typescript | javascript | python | ...]
? Framework: [react | node | django | ...]
? Enable proactive agents? [Yes]
? Enable real-time monitoring? [Yes]
? Enable background daemon? [Yes]
```

#### 3. Start Daemon

```bash
# Start background daemon
pnpm run daemon:start

# Verify daemon is running
pnpm run daemon:status

# Expected output:
# ✅ Daemon running (PID: 12345)
# ✅ Monitoring: /path/to/your/project
# ✅ Agents active: 3/18
# ✅ Proactive mode: enabled
```

#### 4. Test Visual Features

```bash
# Test 1: Session Compass
pnpm run session:compass:brief
# Should show: project context, git status, next tasks

# Test 2: Statusline (requires active agent work)
# → Edit a .tsx file → Should see: 🤖 James-Frontend analyzing...

# Test 3: Automation (Rule 1: Parallel execution)
# → Edit multiple files → Should auto-detect parallelization opportunities

# Test 4: Versioning tracking
git status
# Should see version tracking in commits if enabled
```

---

## 🎯 What Each Visual Feature Requires

### 1. Session Compass (Project Context on Open)

**Requirements**:
- ✅ `~/.cursor/hooks.json` with `beforeSubmitPrompt` hook pointing to `onSessionOpen.sh`
- ✅ `pnpm run session:compass:brief` script in package.json
- ✅ `scripts/session-compass.cjs` file exists
- ✅ `~/.versatil/learning/` directory with session history

**How it works**:
1. Cursor opens → Triggers `beforeSubmitPrompt` hook (runs on first prompt)
2. Hook executes `onSessionOpen.sh` script
3. Script calls `session-compass.cjs` with `--brief` flag
4. Displays: last session summary, git status, next tasks

**Manual test**:
```bash
~/.versatil/hooks/onSessionOpen.sh <<< "test"
# Should output session context
```

---

### 2. Statusline (Real-Time Agent Activity)

**Requirements**:
- ✅ Daemon running (`versatil-daemon` process)
- ✅ `src/ui/statusline-manager.ts` module loaded by daemon
- ✅ Proactive orchestrator monitoring file changes
- ✅ Agent activation configured in `.versatil-project.json`

**How it works**:
1. You edit a file (e.g., `Button.tsx`)
2. Daemon detects file change via file watcher
3. Proactive orchestrator determines agent (James-Frontend for `.tsx`)
4. Agent starts → Statusline manager updates
5. Visual feedback appears: `🤖 James-Frontend │ Validating component... │ ████████░░ 80%`

**Why it's not showing**:
- ❌ Daemon not running → No file watching → No agent activation → No statusline
- ❌ Project not initialized → `.versatil-project.json` missing → Daemon doesn't know which agents to use

**Manual test**:
```bash
# Start daemon with debug logging
VERSATIL_LOG_LEVEL=debug pnpm run daemon:start

# In another terminal, edit a file
echo "// test" >> src/test.tsx

# Check daemon logs
tail ~/.versatil/logs/daemon.log
# Should show: File change detected, agent activated, statusline updated
```

---

### 3. Automation (Rule 1-5 System)

**Requirements**:
- ✅ Daemon running
- ✅ Rules enabled in `.versatil-project.json` (`"rules": [1, 2, 3, 4, 5]`)
- ✅ Rule-specific modules loaded:
  - Rule 1: `ParallelTaskManager`
  - Rule 2: `AutomatedStressTestGenerator`
  - Rule 3: `DailyAuditSystem`
  - Rule 4: `IntelligentOnboardingSystem`
  - Rule 5: `BugCollectionReleaseSystem`

**How it works (Rule 1 example - Parallel Execution)**:
1. You edit `api.ts` and `ui.tsx` simultaneously
2. Daemon detects both changes
3. `ParallelTaskManager` analyzes collision potential
4. If safe: Activates Marcus-Backend + James-Frontend in parallel
5. Shows: `⚡ Running 2 agents in parallel (no conflicts)`

**Manual test**:
```bash
# Check if rules are enabled
cat .versatil-project.json | jq '.rules'
# Should show: [1, 2, 3, 4, 5]

# Test Rule 1 (parallel execution)
touch src/api.ts src/ui.tsx
# Should detect parallel opportunity

# Check daemon logs
tail ~/.versatil/logs/daemon.log | grep -i "parallel"
```

---

### 4. Versioning Tracking

**Requirements**:
- ✅ Git repository initialized
- ✅ Daemon running with git monitoring
- ✅ Commit hooks enabled in `.husky/` or `.git/hooks/`

**How it works**:
1. You make code changes
2. Daemon tracks changes via git
3. Before commit: Pre-commit hook analyzes changes
4. Adds metadata: agent involved, time saved, quality score
5. Commit message enhanced with VERSATIL stats

**Manual test**:
```bash
# Check git hooks
ls -la .git/hooks/ | grep -E "pre-commit|post-commit"

# Check if VERSATIL hooks are registered
cat .git/hooks/pre-commit
# Should reference: ~/.versatil/hooks/ scripts
```

---

### 5. Workflow Automation

**Requirements**:
- ✅ Daemon running
- ✅ Event-driven orchestrator enabled
- ✅ Workflow definitions in `.versatil/workflows/`
- ✅ n8n MCP integration (optional, for advanced workflows)

**How it works**:
1. You perform action (e.g., create PR)
2. Daemon detects event
3. Event-driven orchestrator checks workflow definitions
4. Auto-executes workflow:
   - Run tests → Build → Deploy to staging → Notify team
5. Shows: `🔄 Workflow: PR Review (Step 2/4)`

**Manual test**:
```bash
# Check for workflow definitions
ls ~/.versatil/workflows/
# Should contain: pr-review.yaml, deploy.yaml, etc.

# Test workflow manually
pnpm run workflow:trigger -- --workflow=pr-review
```

---

### 6. Test Automation (Rule 2)

**Requirements**:
- ✅ Daemon running
- ✅ Rule 2 enabled (`AutomatedStressTestGenerator`)
- ✅ Test framework configured (Jest, Playwright, etc.)

**How it works**:
1. You add new API endpoint: `POST /api/users`
2. Daemon detects new route
3. `AutomatedStressTestGenerator` creates stress test:
   - 1000 concurrent requests
   - Validates < 200ms response time
   - Checks error handling
4. Auto-runs test suite
5. Shows: `🧪 Stress test generated: api-users-stress.test.ts (✅ Passed)`

**Manual test**:
```bash
# Create new API route
echo "export const route = '/api/test';" > src/api/test.ts

# Check daemon logs for auto-generated test
tail ~/.versatil/logs/daemon.log | grep -i "stress test"

# Verify test file created
ls tests/stress/ | grep "api-test"
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "Daemon won't start"

**Symptoms**:
```bash
pnpm run daemon:start
# Error: EADDRINUSE: port 3030 already in use
```

**Fix**:
```bash
# Find and kill existing daemon
ps aux | grep versatil-daemon | grep -v grep | awk '{print $2}' | xargs kill

# Start again
pnpm run daemon:start
```

---

### Issue 2: "Session Compass shows 'No data'"

**Symptoms**:
```bash
pnpm run session:compass:brief
# Output: No session data available
```

**Fix**:
```bash
# Session data is stored in ~/.versatil/learning/
# If empty, run a session first to generate data

# Option A: Use framework for 5+ minutes, then check again
# Option B: Manually create session data
mkdir -p ~/.versatil/learning/
echo '{"agent":"test","duration":300,"timeSaved":60}' > ~/.versatil/learning/session-$(date +%s).json
```

---

### Issue 3: "Hooks not triggering"

**Symptoms**:
```bash
# Open Cursor, no session compass appears
# Edit file, no statusline updates
```

**Fix**:
```bash
# Check hooks.json exists and is valid
cat ~/.cursor/hooks.json
# Should be valid JSON with 6 hooks

# If missing, recreate:
cp /path/to/versatil/config/hooks.template.json ~/.cursor/hooks.json

# Verify hook scripts exist and are executable
ls -la ~/.versatil/hooks/*.sh
chmod +x ~/.versatil/hooks/*.sh
```

---

### Issue 4: "Visual features work in VERSATIL repo but not my project"

**Root Cause**: Your project is NOT initialized with VERSATIL

**Fix**:
```bash
cd /path/to/your/project

# Check if .versatil-project.json exists
ls .versatil-project.json
# If NOT EXISTS → Run: versatil init

# Check if npm scripts exist
pnpm run | grep versatil
# If EMPTY → Add scripts to package.json (see below)

# Add missing scripts to package.json:
npm pkg set scripts.daemon:start="versatil-daemon start"
npm pkg set scripts.daemon:stop="versatil-daemon stop"
npm pkg set scripts.daemon:status="versatil-daemon status"
npm pkg set scripts.session:compass="node ~/.versatil/scripts/session-compass.cjs"
npm pkg set scripts.session:compass:brief="node ~/.versatil/scripts/session-compass.cjs --brief"
```

---

### Issue 5: "Statusline appears briefly then disappears"

**Symptoms**:
- Statusline shows `🤖 James-Frontend analyzing...` for 1 second
- Then disappears without completing

**Root Cause**: Agent crashed or encountered error

**Fix**:
```bash
# Check agent error logs
cat ~/.versatil/logs/agents/james-frontend.log

# Common errors:
# 1. Missing dependencies → npm install
# 2. TypeScript errors → pnpm run build
# 3. Memory limit → Increase Node memory: NODE_OPTIONS=--max-old-space-size=4096

# Restart daemon with debug logging
VERSATIL_LOG_LEVEL=debug pnpm run daemon:start
```

---

## 📊 Verification Checklist

After setup, verify all components are working:

```bash
# ✅ 1. Daemon running
ps aux | grep versatil-daemon | grep -v grep
# Expected: 1+ processes

# ✅ 2. Hooks configured
cat ~/.cursor/hooks.json | jq '.hooks | keys'
# Expected: ["afterFileEdit", "beforeShellExecution", ...]

# ✅ 3. Project initialized
cat .versatil-project.json | jq '.proactive.enabled'
# Expected: true

# ✅ 4. Session compass works
pnpm run session:compass:brief
# Expected: Project context + git status + next tasks

# ✅ 5. Framework health
pnpm run monitor
# Expected: Health score 80%+

# ✅ 6. Logs are being written
ls -lh ~/.versatil/logs/
# Expected: daemon.log, hooks.log, agent logs (sizes > 0)

# ✅ 7. Test automation ready
pnpm run test:stress
# Expected: Stress tests exist and can run
```

---

## 🔧 Advanced Configuration

### Custom Statusline Format

Edit: `~/.versatil/config/statusline.json`

```json
{
  "maxWidth": 120,
  "maxAgents": 3,
  "showRAG": true,
  "showMCP": true,
  "showProgress": true,
  "refreshRate": 100,
  "format": "emoji-detailed"
}
```

### Custom Session Compass Display

Edit: `~/.versatil/config/session-compass.json`

```json
{
  "brief": true,
  "showLastSession": true,
  "showGitStatus": true,
  "showNextTasks": true,
  "maxTasks": 5,
  "showFrameworkHealth": true,
  "showThreeTier": false
}
```

### Daemon Configuration

Edit: `~/.versatil/config/daemon.json`

```json
{
  "watchPatterns": ["**/*.{ts,tsx,js,jsx,py}"],
  "ignorePatterns": ["node_modules/**", "dist/**"],
  "proactive": {
    "enabled": true,
    "autoActivation": true,
    "backgroundMonitoring": true,
    "inlineSuggestions": true,
    "statuslineUpdates": true
  },
  "rules": {
    "parallel": true,
    "stressTesting": true,
    "dailyAudit": true,
    "onboarding": true,
    "releases": true
  }
}
```

---

## 📚 Additional Resources

- **Daemon Documentation**: [docs/daemon/daemon-guide.md](daemon-guide.md)
- **Session Compass Guide**: [docs/guides/session-compass-guide.md](session-compass-guide.md)
- **Hooks Reference**: [docs/reference/hooks-reference.md](../reference/hooks-reference.md)
- **Proactive Agents**: [.claude/AGENTS.md](../../.claude/AGENTS.md)
- **5-Rule System**: [.claude/rules/README.md](../../.claude/rules/README.md)

---

## 🆘 Still Not Working?

If visual features STILL don't appear after following this guide:

1. **Generate debug report**:
   ```bash
   pnpm run framework:doctor -- --verbose
   # Saves report to: ~/.versatil/logs/doctor-report.txt
   ```

2. **Check framework health**:
   ```bash
   pnpm run monitor report
   # Shows: All systems status, agents active, errors
   ```

3. **Review logs**:
   ```bash
   tail -100 ~/.versatil/logs/daemon.log
   tail -100 ~/.versatil/logs/hooks.log
   tail -100 ~/.versatil/logs/agents/*.log
   ```

4. **Reinitialize from scratch**:
   ```bash
   # Backup existing config
   mv ~/.versatil ~/.versatil.backup
   mv .versatil-project.json .versatil-project.json.backup

   # Fresh initialization
   versatil init
   pnpm run daemon:start
   pnpm run session:compass:brief
   ```

5. **Report issue**:
   - Include: Debug report, daemon logs, hook logs
   - GitHub: https://github.com/versatil-sdlc-framework/issues
   - Provide: OS, Cursor version, Node version, project type

---

**Last Updated**: 2025-10-20
**VERSATIL Version**: 6.5.0+
**Maintained By**: VERSATIL Core Team
