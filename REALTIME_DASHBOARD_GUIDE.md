# VERSATIL Framework - Real-Time Dashboard Guide

## Overview

The VERSATIL Framework now includes a **real-time dashboard** that provides continuous, always-on visualization of framework activity without requiring manual commands.

### What's New

- ✅ **Real-Time Terminal Dashboard** - Always-on visualization with live updates
- ✅ **Background Monitoring Service** - Continuous data collection in the background
- ✅ **Zero User Intervention** - Updates automatically every 2 seconds
- ✅ **Rich Visual Interface** - Terminal UI with graphs, logs, and metrics
- ✅ **Keyboard Controls** - Interactive controls for pause/resume/refresh

---

## Quick Start

### Option 1: Real-Time Dashboard (Interactive)

Launch the interactive terminal dashboard:

```bash
npm run dashboard
```

This opens a full-screen terminal UI showing:
- 🎯 **Header**: Framework status, sync score, orchestrator count
- 📊 **Left Panel**: 8 orchestrators with live status
- 📜 **Center Panel**: Scrolling event stream
- 👥 **Right Panel**: Agent activity monitor
- 📈 **Bottom Left**: Sync score trend graph
- 📋 **Middle Bottom**: Current operations
- 📊 **Right Bottom**: System metrics table

**Keyboard Controls:**
- `Q` or `Esc` - Quit dashboard
- `R` - Force refresh
- `P` - Pause/Resume updates

### Option 2: Background Monitor (Daemon)

Run monitoring in the background (no UI, just data collection):

```bash
npm run dashboard:background
```

This starts a lightweight daemon that:
- Runs continuously in the background
- Collects metrics every 2 seconds
- Writes status to shared file
- Enables other tools to read framework status

**To stop background monitor:**
```bash
npm run dashboard:stop
```

**To view logs:**
```bash
npm run dashboard:logs
# or
tail -f .versatil/logs/background-monitor.log
```

---

## VSCode Integration

### Running from Command Palette

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: `Tasks: Run Task`
3. Select one of:
   - **VERSATIL: Real-Time Dashboard** - Launch interactive dashboard
   - **VERSATIL: Start Background Monitor** - Start background service
   - **VERSATIL: Stop Background Monitor** - Stop background service

### Add to Workspace

The dashboard tasks are already configured in `.vscode/tasks.json`:

```json
{
  "label": "VERSATIL: Real-Time Dashboard",
  "type": "shell",
  "command": "npm run dashboard"
}
```

---

## Dashboard Layout

### Full Terminal UI

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  VERSATIL Framework Status  |  🟢 Sync: 96%  |  Orchestrators: 8/8  |  12:34  ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌ Orchestrators (8) ──┐  ┌ Event Stream ───────┐  ┌ Agent Activity ──┐
│ ✓ ProactiveOrch     │  │ [12:34:56] Framework│  │ ● Maria-QA       │
│ ✓ AgenticRAG        │  │   heartbeat: 8/8    │  │ ● James-Frontend │
│ ✓ PlanFirstOpera    │  │ [12:34:58] Sync     │  │ ● Marcus-Backend │
│ ✓ StackAware        │  │   score: 96%        │  │ ● Sarah-PM       │
│ ✓ GitHubSync        │  │ [12:35:00] All orch │  │ ● Alex-BA        │
│ ✓ ParallelTask      │  │   initialized       │  │ ● Dr.AI-ML       │
│ ✓ EfficiencyMon     │  │                     │  │                  │
│ ✓ IntrospectiveMeta │  │                     │  │                  │
└─────────────────────┘  └─────────────────────┘  └──────────────────┘

┌ Sync Score Trend ──────────────────┐  ┌ System Metrics ────────────┐
│                                    │  │ Metric          Value       │
│       100 ┤          ╭─────────    │  │ Memory (MB)     45          │
│        95 ┤  ╭───────╯             │  │ CPU (ms)        1234        │
│        90 ┤──╯                     │  │ Uptime (s)      120         │
│            12:30  12:32  12:34     │  │ Sync Score      96%         │
└────────────────────────────────────┘  │ Orchestrators   8/8         │
                                        └─────────────────────────────┘

┌ Current Operations ────────────────┐
│ Current: Running tests             │
│ Framework: Active                  │
│ Mode: Real-time monitoring         │
└────────────────────────────────────┘

LIVE • Q: quit • R: refresh • P: pause • Last update: 12:34:56
```

---

## What You See in Real-Time

### 1. Framework Status (Header)
- ✅ Sync score with color indicator (🟢 🟡 🟠)
- ✅ Number of active orchestrators (8/8)
- ✅ Update count
- ✅ Current timestamp

### 2. Orchestrator Status (Live)
All 8 orchestrators with real-time status:
- ✓ = Active (green)
- ✗ = Inactive (red)

### 3. Event Stream
Scrolling log of framework events:
- Heartbeats every 10 seconds
- Sync score updates
- Orchestrator status changes
- Framework operations
- Initialization events

### 4. Agent Activity
Current status of all 6 OPERA agents:
- ● Maria-QA
- ● James-Frontend
- ● Marcus-Backend
- ● Sarah-PM
- ● Alex-BA
- ● Dr.AI-ML

### 5. Sync Score Graph
Live trending chart showing:
- Last 20 data points
- Updates every 2 seconds
- Visual trend indication

### 6. Current Operations
What the framework is doing right now:
- Test execution
- Build process
- Code analysis
- Agent coordination

### 7. System Metrics
Real-time resource usage:
- Memory usage (MB)
- CPU usage (ms)
- Process uptime
- Sync score percentage
- Active orchestrators

---

## Background Monitor Service

### How It Works

The background monitor is a lightweight daemon that:

1. **Runs Independently** - Detached from terminal, runs in background
2. **Collects Metrics** - Every 2 seconds, gathers framework status
3. **Writes Shared File** - Updates `/tmp/versatil-sync-status-<session>.json`
4. **No UI Overhead** - Just data collection, minimal resources
5. **Logs Activity** - Writes to `.versatil/logs/background-monitor.log`

### Status File Format

The shared status file contains:

```json
{
  "timestamp": 1234567890,
  "iso_timestamp": "2025-09-30T12:34:56.789Z",
  "synchronized": true,
  "score": 96,
  "orchestrators_active": 8,
  "orchestrators_total": 8,
  "orchestrators_inactive": 0,
  "orchestrator_statuses": {
    "ProactiveOrchestrator": "active",
    "AgenticRAGOrchestrator": "active",
    ...
  },
  "current_operation": "Running tests",
  "system_metrics": {
    "memory_mb": 45,
    "memory_total_mb": 128,
    "cpu_user": 1234,
    "cpu_system": 567,
    "uptime_seconds": 120
  },
  "monitor_pid": 12345,
  "session_id": "default"
}
```

### Starting/Stopping

```bash
# Start background monitor
npm run dashboard:background

# Check if running
ps aux | grep background-monitor

# View logs
npm run dashboard:logs

# Stop monitor
npm run dashboard:stop
```

### PID File Location

Process ID stored in: `/tmp/versatil-monitor-<session>.pid`

---

## Use Cases

### Use Case 1: Continuous Development Monitoring

**Scenario**: You're developing and want to see framework activity at all times

**Solution**:
1. Open a terminal pane/window
2. Run `npm run dashboard`
3. Position it where you can always see it
4. Framework activity displays in real-time as you work

### Use Case 2: CI/CD Pipeline Monitoring

**Scenario**: Running tests in CI/CD, need to monitor framework health

**Solution**:
1. Start background monitor: `npm run dashboard:background`
2. Run your CI/CD commands
3. Check status file: `cat /tmp/versatil-sync-status-default.json`
4. Stop monitor when done: `npm run dashboard:stop`

### Use Case 3: Debugging Framework Issues

**Scenario**: Framework not behaving as expected, need to see what's happening

**Solution**:
1. Launch dashboard: `npm run dashboard`
2. Watch event stream for errors/warnings
3. Check orchestrator status
4. Monitor sync score trends
5. View system metrics

### Use Case 4: Team Collaboration

**Scenario**: Multiple developers need to see framework status

**Solution**:
1. Start background monitor on shared server
2. Team members can read status file
3. Or share terminal session with dashboard
4. Everyone sees same real-time status

---

## Troubleshooting

### Dashboard Won't Start

**Error**: "Cannot find module 'blessed'"

**Solution**:
```bash
npm install blessed blessed-contrib
```

### Background Monitor Already Running

**Error**: "Background monitor already running (PID: 12345)"

**Solution**:
```bash
# Stop existing monitor
npm run dashboard:stop

# Or manually kill
kill 12345

# Then start again
npm run dashboard:background
```

### No Events Showing

**Issue**: Event log is empty or not updating

**Cause**: No framework activity happening

**Solution**: Run some commands to generate events:
```bash
npm test
npm run build
npm run validate:sync
```

### Sync Score Low

**Issue**: Sync score showing 75% or lower

**Solution**:
```bash
# Run sync validation
npm run validate:sync

# Check for missing files
npm run validate:sync --quick

# Review issues in dashboard event log
```

### Terminal Display Issues

**Issue**: Dashboard looks broken or misaligned

**Solution**:
- Resize terminal to at least 120x30
- Press `R` to force refresh
- Restart dashboard: Quit (Q) and relaunch

---

## Configuration

### Update Interval

Default: 2 seconds (2000ms)

To change:
```bash
# Dashboard (edit scripts/realtime-dashboard.cjs)
const UPDATE_INTERVAL = 5000; // 5 seconds

# Background monitor (command line)
npm run dashboard:background -- --interval=5000
```

### Session ID

Default: "default"

To use custom session:
```bash
CLAUDE_SESSION_ID=my-session npm run dashboard
CLAUDE_SESSION_ID=my-session npm run dashboard:background
```

This creates separate status files for different sessions.

---

## Advanced Usage

### Multiple Dashboards

You can run multiple dashboards for different sessions:

```bash
# Terminal 1
CLAUDE_SESSION_ID=dev npm run dashboard

# Terminal 2
CLAUDE_SESSION_ID=staging npm run dashboard

# Terminal 3
CLAUDE_SESSION_ID=prod npm run dashboard
```

### Dashboard + Background Monitor

Run both together for maximum visibility:

```bash
# Terminal 1: Start background monitor
npm run dashboard:background

# Terminal 2: Launch dashboard (reads from background monitor)
npm run dashboard

# Now you have continuous monitoring + visual dashboard
```

### Scripting with Status File

Read framework status from scripts:

```bash
#!/bin/bash
STATUS=$(cat /tmp/versatil-sync-status-default.json)
SYNC_SCORE=$(echo $STATUS | jq -r '.score')

if [ "$SYNC_SCORE" -lt 80 ]; then
  echo "⚠️  Framework sync low: ${SYNC_SCORE}%"
  exit 1
fi

echo "✅ Framework healthy: ${SYNC_SCORE}%"
```

---

## Comparison: Before vs After

### Before (On-Demand Visibility)

```bash
# User had to manually check status
npm run validate:sync

# Output appeared only when command run
# No continuous monitoring
# Had to remember to check periodically
```

### After (Real-Time Visibility)

```bash
# Launch once
npm run dashboard

# Framework activity visible 24/7
# Updates every 2 seconds automatically
# No manual intervention needed
# Always know what's happening
```

---

## Key Benefits

### 1. Always-On Visibility
- See framework activity without asking
- Real-time updates every 2 seconds
- No manual commands needed

### 2. Comprehensive Monitoring
- 8 orchestrators tracked live
- Event stream showing all activity
- Sync score trending graph
- System metrics in real-time

### 3. Interactive Controls
- Pause/resume updates
- Force refresh on demand
- Keyboard shortcuts

### 4. Background Operation
- Run monitoring as daemon
- No terminal UI overhead
- Logs to file
- Easy start/stop

### 5. Integration Ready
- VSCode tasks configured
- Status file for scripting
- Multiple session support
- CI/CD friendly

---

## Next Steps

### Getting Started

1. **Launch Dashboard**:
   ```bash
   npm run dashboard
   ```

2. **Try Background Monitor**:
   ```bash
   npm run dashboard:background
   npm run dashboard:logs
   npm run dashboard:stop
   ```

3. **Use from VSCode**:
   - `Cmd+Shift+P` → "Tasks: Run Task" → "VERSATIL: Real-Time Dashboard"

4. **Experiment with Controls**:
   - Press `P` to pause
   - Press `R` to refresh
   - Press `Q` to quit

### Customization

- Adjust update interval in scripts
- Modify dashboard layout (edit `realtime-dashboard.cjs`)
- Add custom panels
- Create additional monitors

---

## Summary

You now have **real-time, continuous visualization** of the VERSATIL framework:

- ✅ **Launch once** - `npm run dashboard`
- ✅ **See everything** - Orchestrators, events, metrics, graphs
- ✅ **Updates automatically** - Every 2 seconds
- ✅ **No intervention** - Just watch it work
- ✅ **Background mode** - Run as daemon
- ✅ **Full control** - Pause, refresh, quit

**The framework is no longer invisible - it's actively present in real-time!** 🚀

---

## Support

### Documentation
- `FRAMEWORK_VISIBILITY_SUMMARY.md` - Visibility system overview
- `SYNC_VALIDATION_GUIDE.md` - Synchronization validation
- `CLAUDE.md` - Framework methodology

### Commands Reference
```bash
npm run dashboard              # Interactive dashboard
npm run dashboard:background   # Background monitor
npm run dashboard:stop         # Stop background monitor
npm run dashboard:logs         # View monitor logs
npm run validate:sync          # On-demand sync check
npm run monitor                # Health check
```

### Getting Help
- Check event log in dashboard for errors
- Review background monitor logs
- Run sync validation
- Check GitHub issues
- Join community discussions

---

*Real-time framework visibility - Always on, always accurate, always helpful* ✨