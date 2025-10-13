---
name: monitor
description: Monitor VERSATIL framework health, agents, and performance in real-time
tags: [monitoring, health, metrics, diagnostics, troubleshooting]
---

# Framework Monitoring Command

You are helping the user monitor the VERSATIL SDLC Framework's health, performance, and agent activity.

## Command Modes

The user can specify different monitoring modes:

### 1. Quick Health Check (Default)
```bash
/monitor
/monitor health
```

**What to do:**
- Run: `npm run monitor`
- This performs a comprehensive health check:
  - ✅ All 7 OPERA agents (Dana, Maria, James, Marcus, Sarah, Alex, Dr.AI-ML)
  - ✅ Proactive agent system status
  - ✅ 5-Rule system efficiency
  - ✅ Framework integrity (critical files)
  - ✅ Quick stress tests
- **Output**: Health score (0-100%) with issues and recommendations
- **Duration**: ~5 seconds

**Interpret results:**
- 🟢 90-100%: Excellent health
- 🟡 75-89%: Good, minor issues
- 🟠 50-74%: Degraded, needs attention
- 🔴 <50%: Critical issues, run `/doctor --fix`

---

### 2. Interactive Dashboard
```bash
/monitor dashboard
```

**What to do:**
- Run: `npm run dashboard` (launches v3 by default)
- This opens an **interactive terminal dashboard** with:
  - Real-time workflow visualization
  - Live agent progress tracking
  - Data flow animation between agents
  - Node selection with detailed metrics
  - Progress bars and status indicators

**Controls:**
```
q/ESC     - Quit
↑↓←→      - Navigate nodes
Enter     - Select node / Show details
Tab       - Cycle through nodes
Space     - Pause/Resume animation
h         - Toggle help
f         - Focus on active node
+/-       - Zoom in/out
r         - Refresh
```

**Duration**: Runs continuously until user quits (Ctrl+C)

---

### 3. Continuous Monitoring (Watch Mode)
```bash
/monitor watch
```

**What to do:**
- Run: `npm run monitor -- --watch`
- This performs **continuous health checks** every 60 seconds
- Shows live updates of:
  - Agent activation counts
  - Proactive system accuracy
  - Rules efficiency
  - Framework integrity
- **Duration**: Runs until user quits (Ctrl+C)

**Interval customization:**
```bash
npm run monitor -- --watch --interval=30000  # Every 30 seconds
```

---

### 4. Comprehensive Debug Report
```bash
/monitor report
/monitor debug
```

**What to do:**
- Run: `/framework-debug` command
- This collects **comprehensive diagnostic information**:
  - Environment (Node.js, npm, OS versions)
  - Framework status (~/.versatil/ directory)
  - Configuration files (.cursor/settings.json, .claude/agents/*)
  - Recent logs (last 50 lines)
  - Test suite status
  - Git status and dependencies
- **Outputs:**
  - `versatil-debug-report.json` (machine-readable)
  - `VERSATIL_DEBUG_REPORT.md` (human-readable)
- **Duration**: ~10 seconds

**When to use:**
- Troubleshooting issues
- Before reporting bugs
- Validating installation
- Preparing for upgrades

---

### 5. Agent Performance Metrics
```bash
/monitor agents
```

**What to do:**
- Run: `npm run show-agents`
- This displays **all 7 OPERA agents** with:
  - Agent name and role
  - Status (active/idle/processing)
  - Activation count
  - Success rate
  - Average response time
  - Proactive triggers configured
  - Model assignment (Haiku/Sonnet/Opus)

**Example output:**
```
🤖 Dana-Database (Database Architect)
   Status: ✅ Active
   Activations: 42
   Success rate: 98.5%
   Avg time: 1.2s
   Model: sonnet
   Triggers: *.sql, migrations/**, schema/**
```

---

### 6. Stress Testing
```bash
/monitor stress
```

**What to do:**
- Run: `npm run monitor -- --stress`
- This performs **comprehensive stress tests**:
  - CLAUDE.md size check (< 20k)
  - All 7 agent configurations present
  - Proactive system configured
  - Framework file integrity
  - MCP health validation
- **Output**: Pass/fail for each test with recommendations
- **Duration**: ~15 seconds

---

### 7. Recent Logs
```bash
/monitor logs
```

**What to do:**
- Check if logs exist:
  ```bash
  ls -la ~/.versatil/logs/
  ```
- Display recent logs:
  ```bash
  tail -50 ~/.versatil/logs/framework.log
  tail -50 ~/.versatil/logs/agents.log
  tail -50 .versatil/logs/background-monitor.log
  ```
- If logs don't exist, inform user: "No logs found. Framework may not have run yet or logging is disabled."

---

### 8. Background Monitoring
```bash
/monitor background start
/monitor background stop
/monitor background logs
```

**What to do:**

**Start background monitoring:**
```bash
npm run dashboard:background
```
- Runs monitoring in background
- Logs to `.versatil/logs/background-monitor.log`
- Shows: "Background monitor started. View logs with `/monitor background logs`"

**Stop background monitoring:**
```bash
npm run dashboard:stop
```
- Stops background monitor process
- Shows: "Background monitor stopped"

**View background logs:**
```bash
npm run dashboard:logs
```
- Displays live log stream
- Press Ctrl+C to stop viewing

---

## Monitoring Best Practices

### For Development
1. Run `/monitor health` at start of session
2. Keep `/monitor dashboard` open in separate terminal
3. Check `/monitor agents` to see which agents are most active

### For Production
1. Run `/monitor stress` before deployments
2. Enable background monitoring: `/monitor background start`
3. Schedule daily health checks: `cron 0 2 * * * npm run monitor`

### For Troubleshooting
1. Generate debug report: `/monitor report`
2. Check recent logs: `/monitor logs`
3. Validate isolation: `npm run validate:isolation`
4. Run doctor: `/doctor --fix`

---

## Health Score Interpretation

### Overall Health Score (0-100%)

**Components** (weighted):
- Agent Health: 30% (all 7 agents operational)
- Proactive System: 30% (triggers + orchestration working)
- Rules Efficiency: 20% (5 rules enabled and functional)
- Framework Integrity: 20% (critical files present)

**What affects score:**

⬇️ **Decreases score:**
- Missing agent configurations
- Proactive system not configured
- Rules disabled or not implemented
- Missing critical framework files
- Test failures
- Recent errors in logs

⬆️ **Increases score:**
- All agents configured and working
- Proactive system enabled with 95%+ accuracy
- All 5 rules enabled and efficient
- 100% framework integrity
- High test coverage (>80%)
- No recent errors

---

## Common Issues and Fixes

### Issue: Health score < 70%
**Fix:**
1. Run `/doctor --fix` for auto-repair
2. Check missing files in health report
3. Validate isolation: `npm run validate:isolation`
4. Reinstall if needed: `npm install`

### Issue: Agent not showing in dashboard
**Fix:**
1. Check agent config exists: `ls -la .claude/agents/`
2. Validate agent implementation: `ls -la src/agents/`
3. Run `/monitor agents` to see if agent is registered

### Issue: Proactive system accuracy < 90%
**Fix:**
1. Check `.cursor/settings.json` exists and has `versatil.proactive_agents`
2. Verify hooks exist: `ls -la .claude/hooks/pre-tool-use/`
3. Run `/doctor --fix` to restore hooks

### Issue: Dashboard shows no activity
**Fix:**
1. Ensure framework is running (not just installed)
2. Check status file exists: `ls -la /tmp/versatil-sync-status-*.json`
3. Try different dashboard version: `npm run dashboard:v1` or `npm run dashboard:v2`

---

## Advanced Monitoring

### WebSocket-based Real-Time Tracking

VERSATIL includes `RealTimeSDLCTracker` for enterprise monitoring:

```typescript
import { getGlobalStatusline } from 'src/ui/statusline-manager.js';

const statusline = getGlobalStatusline();

// Track agent progress
statusline.startAgent('maria-qa', 'Running test coverage');
statusline.updateProgress('maria-qa', 50);
statusline.addRAGRetrieval('maria-qa', 3);
statusline.completeAgent('maria-qa');

// Get statistics
const stats = statusline.getStats();
console.log(stats.activeAgents); // Number of active agents
console.log(stats.totalRAGRetrievals); // Total RAG retrievals
```

---

## Monitoring Metrics Reference

### Agent Metrics
- **Activation Count**: Times agent has been triggered
- **Success Rate**: % of successful task completions
- **Avg Response Time**: Average time per task (seconds)
- **Efficiency Score**: 0-100% based on performance

### Proactive System Metrics
- **Accuracy**: % of correct agent activations
- **Enabled**: Whether proactive system is running
- **Settings Configured**: `.cursor/settings.json` valid
- **Hook Exists**: Agent coordinator hook present
- **Orchestrator Exists**: Proactive orchestrator implementation present

### Rules Efficiency Metrics
- **Enabled**: Whether rule is enabled in settings
- **Implemented**: Whether rule source code exists
- **Velocity Gain**: Performance improvement (Rule 1: +300%, Rule 2: +89%, etc.)

### Framework Integrity Metrics
- **Files Present**: Count of critical files found
- **Missing Files**: List of critical files missing
- **Integrity Score**: % of critical files present (should be 100%)

---

## Related Commands

- `/doctor` - Diagnose and auto-fix framework issues
- `/framework:validate` - Validate isolation and quality
- `/framework:debug` - Generate comprehensive debug report
- `npm run monitor` - CLI health check
- `npm run dashboard` - Interactive TUI dashboard
- `npm run show-agents` - Show all agent configurations

---

## Output Format

For each monitoring command, provide:

1. **Command executed** (so user can run manually if needed)
2. **Results summary** (health score, key metrics)
3. **Issues detected** (if any, with severity)
4. **Recommendations** (immediate actions, optional improvements)
5. **Next steps** (what user should do based on results)

Keep output concise but actionable. Focus on what matters most.

---

**Support**: If monitoring reveals persistent issues, generate a debug report (`/monitor report`) and share on GitHub issues.
