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

**After displaying health score, ALWAYS invoke Iris-Guardian for predictive analysis:**

```typescript
await Task({
  subagent_type: "Iris-Guardian",
  description: "Proactive issue detection",
  prompt: `
You are Iris-Guardian, the framework health monitoring and auto-remediation agent. Your role is to detect issues BEFORE they become critical and proactively suggest remediation.

## Your Task

Analyze the health check results and provide predictive insights about potential framework degradation.

## Context

Current health check results:
- Overall score: [insert score from npm run monitor]
- Agent health: [insert agent health %]
- Proactive system: [insert proactive system %]
- Rules efficiency: [insert rules efficiency]
- Framework integrity: [insert integrity %]

Recent activity (last 24 hours):
- Commands executed: [check ~/.versatil/logs/]
- Agent activations: [check agent activation counts]
- Failed tasks: [check for failures in logs]
- Performance metrics: [response times, resource usage]

## Steps to Execute

### 1. Anomaly Detection
Identify patterns that indicate potential future issues:
- Health score trending downward (compare with historical)
- Agent activation failures increasing
- Response time degradation (slower than baseline)
- Memory/CPU usage anomalies
- Repeated errors in logs (same error > 3 times)

### 2. Degradation Prediction
Predict when system health will fall below thresholds:
- Time to 80% health (warning threshold)
- Time to 70% health (critical threshold)
- Probability of component failure (0-100%)
- Risk factors with impact assessment

### 3. Root Cause Analysis
For detected anomalies, identify likely root causes:
- Configuration drift (settings changed)
- Dependency conflicts (package updates)
- Resource exhaustion (disk, memory, CPU)
- External service failures (RAG, MCP servers)
- Framework file corruption

### 4. Proactive Remediation Suggestions
Suggest actions to prevent degradation:
- Auto-fixable issues (can run commands automatically)
- Manual fixes required (user action needed)
- Priority order (critical first)
- Estimated effort (time to fix)

### 5. Health Trend Forecasting
Forecast framework health trajectory:
- Health score in 1 day, 3 days, 7 days
- Confidence intervals (±X%)
- Factors influencing trajectory
- Recommended monitoring intervals

## Expected Output

Return a TypeScript interface with predictive analysis:

\`\`\`typescript
interface PredictiveHealthAnalysis {
  // Anomaly detection
  anomalies_detected: Array<{
    anomaly_type: 'health_decline' | 'activation_failures' | 'performance_degradation' | 'error_surge' | 'resource_anomaly';
    component: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    evidence: string[];  // Log excerpts, metrics, file paths
    first_detected: string;  // ISO timestamp
    occurrence_count: number;
  }>;

  // Degradation prediction
  degradation_forecast: {
    current_health: number;  // 0-100
    time_to_warning: string | null;  // "2 days 5 hours" or null if not predicted
    time_to_critical: string | null;  // "5 days 12 hours" or null if not predicted
    failure_probability: {
      next_24h: number;  // 0-100%
      next_7d: number;  // 0-100%
      next_30d: number;  // 0-100%
    };
    risk_factors: Array<{
      factor: string;
      impact: 'critical' | 'high' | 'medium' | 'low';
      likelihood: number;  // 0-100%
    }>;
  };

  // Root cause analysis
  root_causes: Array<{
    anomaly_id: string;
    root_cause: string;
    evidence: string[];
    confidence: number;  // 0-100%
    contributing_factors: string[];
  }>;

  // Proactive remediation
  remediation_plan: Array<{
    issue: string;
    action: string;
    auto_fixable: boolean;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimated_effort: string;  // "2 minutes", "10 minutes", "30 minutes"
    command: string | null;  // Bash command if auto-fixable
    impact: string;  // What improves if fixed
  }>;

  // Health trends
  health_forecast: {
    current: number;
    day_1: {score: number, confidence: number};  // Confidence 0-100%
    day_3: {score: number, confidence: number};
    day_7: {score: number, confidence: number};
    influencing_factors: string[];
    recommended_monitoring_interval: string;  // "hourly", "every 6 hours", "daily"
  };

  // Summary
  predictive_summary: {
    overall_risk: 'low' | 'medium' | 'high' | 'critical';
    immediate_actions_required: number;
    auto_fix_available: boolean;
    manual_review_required: boolean;
    confidence_score: number;  // 0-100 (how confident in predictions)
  };
}
\`\`\`

## Example Output

\`\`\`typescript
{
  anomalies_detected: [
    {
      anomaly_type: "performance_degradation",
      component: "RAG pattern search",
      severity: "medium",
      description: "RAG query response time increased from 68ms to 180ms (165% slower)",
      evidence: [
        "~/.versatil/logs/framework.log:142: RAG query took 180ms",
        "~/.versatil/logs/framework.log:157: RAG query took 195ms",
        "Baseline: 68ms (from last week)"
      ],
      first_detected: "2025-10-26T12:00:00Z",
      occurrence_count: 8
    },
    {
      anomaly_type: "activation_failures",
      component: "Maria-QA agent",
      severity: "low",
      description: "Maria-QA auto-activation failed 2 times in last 24h",
      evidence: [
        "~/.versatil/logs/agents.log:89: Maria-QA trigger failed - file pattern mismatch",
        "~/.versatil/logs/agents.log:112: Maria-QA trigger failed - file pattern mismatch"
      ],
      first_detected: "2025-10-26T08:30:00Z",
      occurrence_count: 2
    }
  ],

  degradation_forecast: {
    current_health: 87,
    time_to_warning: null,  // Not predicted to drop below 80%
    time_to_critical: null,  // Not predicted to drop below 70%
    failure_probability: {
      next_24h: 5,  // 5% chance
      next_7d: 12,  // 12% chance
      next_30d: 25  // 25% chance
    },
    risk_factors: [
      {
        factor: "RAG performance degradation continues",
        impact: "medium",
        likelihood: 40
      },
      {
        factor: "Maria-QA activation failures increase",
        impact: "low",
        likelihood: 15
      }
    ]
  },

  root_causes: [
    {
      anomaly_id: "performance_degradation-rag",
      root_cause: "Firestore connection latency increased (external service issue)",
      evidence: [
        "ping storage.googleapis.com: 180ms (baseline: 50ms)",
        "Firestore API quota: 87% used (increased from 45% last week)"
      ],
      confidence: 85,
      contributing_factors: [
        "Increased RAG query volume (2.5x more queries)",
        "Firestore free tier limits approaching"
      ]
    },
    {
      anomaly_id: "activation_failures-maria",
      root_cause: "File pattern configuration drift (.cursor/settings.json modified)",
      evidence: [
        "git diff .cursor/settings.json shows trigger pattern changed",
        "Pattern changed from '*.test.*' to '**/*.test.ts' (too specific)"
      ],
      confidence: 95,
      contributing_factors: [
        "Manual config edit 2 days ago"
      ]
    }
  ],

  remediation_plan: [
    {
      issue: "Maria-QA activation pattern too restrictive",
      action: "Restore original pattern '*.test.*' in .cursor/settings.json",
      auto_fixable: true,
      priority: "low",
      estimated_effort: "2 minutes",
      command: "sed -i '' 's|\\*\\*/\\*.test.ts|*.test.*|' .cursor/settings.json",
      impact: "Fixes 2 activation failures, improves auto-activation accuracy to 98%"
    },
    {
      issue: "RAG performance degradation due to external latency",
      action: "Consider local RAG cache or switch to Supabase (lower latency)",
      auto_fixable: false,
      priority: "medium",
      estimated_effort: "10 minutes",
      command: null,
      impact: "Reduces query time from 180ms to <80ms, improves /plan speed by 40%"
    }
  ],

  health_forecast: {
    current: 87,
    day_1: {score: 86, confidence: 85},
    day_3: {score: 84, confidence: 70},
    day_7: {score: 81, confidence: 55},
    influencing_factors: [
      "RAG latency (if unchanged, -2 points/week)",
      "Maria-QA failures (if unfixed, -1 point/week)"
    ],
    recommended_monitoring_interval: "daily"
  },

  predictive_summary: {
    overall_risk: "low",
    immediate_actions_required: 1,  // Fix Maria-QA pattern
    auto_fix_available: true,
    manual_review_required: true,  // RAG performance needs manual decision
    confidence_score: 82
  }
}
\`\`\`

## CRITICAL: Auto-Remediation

If \`auto_fix_available: true\`, ask user:

**"Auto-fix available for 1 issue. Apply automatic fix?"** (Y/n)

If yes, execute auto-fixable commands:
\`\`\`bash
sed -i '' 's|\\*\\*/\\*.test.ts|*.test.*|' .cursor/settings.json
\`\`\`

Then re-run health check to verify fix:
\`\`\`bash
npm run monitor
\`\`\`

Return the complete predictive analysis.
`
});
```

**Process Iris-Guardian Results**:

```typescript
// Display anomalies
if (analysis.anomalies_detected.length > 0) {
  console.log("\n⚠️ ANOMALIES DETECTED");
  analysis.anomalies_detected.forEach(anomaly => {
    console.log(`\n[${anomaly.severity.toUpperCase()}] ${anomaly.component}`);
    console.log(`  ${anomaly.description}`);
    console.log(`  Detected: ${anomaly.first_detected}`);
    console.log(`  Occurrences: ${anomaly.occurrence_count}`);
  });
}

// Display degradation forecast
console.log("\n📊 HEALTH FORECAST");
console.log(`Current: ${analysis.health_forecast.current}%`);
console.log(`+1 day: ${analysis.health_forecast.day_1.score}% (${analysis.health_forecast.day_1.confidence}% confidence)`);
console.log(`+3 days: ${analysis.health_forecast.day_3.score}% (${analysis.health_forecast.day_3.confidence}% confidence)`);
console.log(`+7 days: ${analysis.health_forecast.day_7.score}% (${analysis.health_forecast.day_7.confidence}% confidence)`);

if (analysis.degradation_forecast.time_to_warning) {
  console.log(`\n⚠️ Health will drop below 80% in: ${analysis.degradation_forecast.time_to_warning}`);
}

// Show remediation plan
if (analysis.remediation_plan.length > 0) {
  console.log("\n🔧 REMEDIATION PLAN");
  analysis.remediation_plan.forEach((fix, index) => {
    console.log(`\n${index + 1}. [${fix.priority.toUpperCase()}] ${fix.issue}`);
    console.log(`   Action: ${fix.action}`);
    console.log(`   Effort: ${fix.estimated_effort}`);
    console.log(`   Impact: ${fix.impact}`);
    if (fix.auto_fixable) {
      console.log(`   ✅ Auto-fixable`);
    }
  });
}

// Auto-fix prompt
if (analysis.predictive_summary.auto_fix_available) {
  const auto_fixable = analysis.remediation_plan.filter(fix => fix.auto_fixable);
  console.log(`\n💡 ${auto_fixable.length} issue(s) can be auto-fixed. Apply automatic fixes? (Y/n)`);
}
```

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

### 6. RAG Storage Health (NEW - v7.7.0+)
```bash
/monitor rag
```

**What to do:**
- Run: `/rag status` command
- This displays **Public/Private RAG health and metrics**:
  - Storage backend status (Firestore/Supabase/Local)
  - Connection health
  - Pattern counts (public vs private)
  - Query performance metrics
  - Privacy compliance status
  - Cache hit rates
  - Edge acceleration status

**Example output:**
```
🌍 Public RAG (Framework Patterns)
   Status: ✅ Connected
   Backend: Google Cloud Firestore (versatil-public-rag)
   Patterns: 1,247 framework patterns
   Edge acceleration: ✅ Cloud Run (68ms avg)
   Cache hit rate: 87%

🔒 Private RAG (Your Proprietary Patterns)
   Status: ✅ Connected
   Backend: Google Cloud Firestore (my-project-rag)
   Patterns: 127 proprietary patterns
   Privacy: ✅ Verified (zero leaks)
   Query performance: 72ms avg

📊 RAG Query Analytics (Last 30 Days)
   Total queries: 1,342
   Private-only: 412 (31%)
   Public-only: 523 (39%)
   Mixed: 407 (30%)

✅ Overall RAG Health: 98%
```

**If Private RAG not configured:**
```
⚠️ Private RAG: Not configured
   Impact: All patterns stored in Public RAG (shared)
   Action: Run `npm run setup:private-rag` to enable
```

---

### 7. Stress Testing
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

### 8. Recent Logs
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

### 9. Background Monitoring
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
