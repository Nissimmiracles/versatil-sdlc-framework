# Usage Tracking Integration Guide

**VERSATIL Pulse System v1.0** - Real-Time Framework Usage Visualization

This guide explains how to integrate the new UsageLogger and SessionManager with existing OPERA agents to provide real-time visibility and power sentiment tracking.

---

## Quick Start

### View Sample Session Report

```bash
# Generate sample data (first time only)
node scripts/test-usage-logger.cjs

# View your session summary
pnpm run session:summary
```

**Output Example**:
```
╔═══════════════════════════════════════════════════════════╗
║         VERSATIL Session Summary                          ║
╚═══════════════════════════════════════════════════════════╝

📅 Sunday, October 19, 2025
Session ID: 2025-10-19-test01

⏱️  Session Duration: 3h 30m
🤖 Agents Activated: 4 times

Agent Activity:

  🤖 Maria-QA        2 activations │ ██████████ 100%
     Time saved: ~58 minutes

  🤖 James-Frontend  1 activation  │ ██████████ 100%
     Time saved: ~17.5 minutes

  🤖 Marcus-Backend  1 activation  │ ██████████ 100%
     Time saved: ~28.5 minutes

💰 Productivity Impact:

  Time Saved:         ~104 minutes
  Productivity Gain:  50%
  Framework Score:    7.1/10 ✨

📚 Top Patterns Used:

  • React Testing Library patterns
  • API security best practices
  • Component optimization techniques

💡 Recommendations:

  • Excellent session! You're using VERSATIL effectively
  • Consider enabling Dana-Database agent for database tasks
```

---

## Available Commands

| Command | Description | Example Output |
|---------|-------------|----------------|
| `pnpm run session:summary` | Show current session | Today's activity and time saved |
| `pnpm run session:summary --week` | Show weekly report | Last 7 days aggregate |
| `pnpm run session:summary --all` | Show all-time stats | Cumulative impact since installation |

---

## Integration with OPERA Agents

### Step 1: Import UsageLogger

In any agent file (e.g., `src/agents/opera/maria-qa/maria-sdk-agent.ts`):

```typescript
import { getUsageLogger } from '../../../tracking/usage-logger.js';
```

### Step 2: Log Agent Activation

When agent task starts:

```typescript
const usageLogger = getUsageLogger();

// Log activation (returns taskId for later completion logging)
const taskId = await usageLogger.logAgentActivation({
  agentId: 'maria-qa',
  agentName: 'Maria-QA',
  taskType: 'test_coverage_analysis',  // See MANUAL_TASK_TIMES in usage-logger.ts
  taskDescription: 'Analyze test coverage for LoginForm component',
  context: {
    filesModified: ['src/__tests__/LoginForm.test.tsx'],
  },
});
```

### Step 3: Log Task Completion

When agent task finishes:

```typescript
await usageLogger.logTaskCompletion({
  taskId,
  success: true,  // or false if failed
  quality: 85,    // 0-100 quality score
  context: {
    testsGenerated: 8,
    filesModified: ['src/__tests__/LoginForm.test.tsx'],
    linesChanged: 120,
  },
});
```

### Step 4: Handle Errors

If task fails:

```typescript
await usageLogger.logTaskCompletion({
  taskId,
  success: false,
  quality: 0,
  error: 'Test coverage too low (only 65%, target is 80%)',
});
```

---

## Task Types and Time Estimates

The UsageLogger calculates "time saved" by comparing actual agent execution time to estimated manual work time.

**Predefined Task Types** (see `MANUAL_TASK_TIMES` in `usage-logger.ts`):

| Task Type | Manual Estimate | Description |
|-----------|----------------|-------------|
| `test_coverage_analysis` | 30 min | Analyze test coverage manually |
| `missing_test_detection` | 20 min | Find missing test cases |
| `component_optimization` | 20 min | Optimize React component performance |
| `accessibility_audit` | 45 min | Manual WCAG 2.1 AA audit |
| `security_scan` | 30 min | Manual OWASP security review |
| `stress_test_generation` | 40 min | Write stress tests manually |
| `visual_regression_testing` | 35 min | Manual visual regression checks |
| `api_documentation` | 25 min | Write API documentation |
| `code_review` | 45 min | Manual code review |
| `bug_detection` | 15 min | Find bugs manually |
| `performance_optimization` | 30 min | Optimize code performance |
| `requirement_extraction` | 40 min | Extract requirements from docs |
| `user_story_generation` | 35 min | Write user stories manually |
| `database_schema_design` | 50 min | Design database schema |
| `api_endpoint_implementation` | 60 min | Implement API endpoint |
| `ui_component_creation` | 45 min | Create UI component |
| `default` | 20 min | Fallback for unknown tasks |

**Add Custom Task Types**:

If you have a new task type, add it to `MANUAL_TASK_TIMES` in `src/tracking/usage-logger.ts`:

```typescript
const MANUAL_TASK_TIMES: Record<string, number> = {
  // ... existing tasks
  'custom_task_name': 35,  // 35 minutes manual estimate
};
```

---

## Full Integration Example

### Maria-QA Agent Integration

```typescript
// src/agents/opera/maria-qa/maria-sdk-agent.ts

import { Agent } from '@anthropic-ai/claude-agent-sdk';
import { getUsageLogger } from '../../../tracking/usage-logger.js';

export const MARIA_QA_AGENT: Agent = {
  name: 'Maria-QA',

  async run(context) {
    const usageLogger = getUsageLogger();

    // 1. Log activation
    const taskId = await usageLogger.logAgentActivation({
      agentId: 'maria-qa',
      agentName: 'Maria-QA',
      taskType: 'test_coverage_analysis',
      taskDescription: 'Analyze test coverage for components',
    });

    try {
      // 2. Execute agent logic
      const results = await this.analyzeCoverage(context);

      // 3. Log successful completion
      await usageLogger.logTaskCompletion({
        taskId,
        success: true,
        quality: results.coveragePercent,
        context: {
          filesModified: results.filesModified,
          testsGenerated: results.newTests.length,
        },
      });

      return results;
    } catch (error) {
      // 4. Log failure
      await usageLogger.logTaskCompletion({
        taskId,
        success: false,
        quality: 0,
        error: error.message,
      });

      throw error;
    }
  },

  async analyzeCoverage(context) {
    // Existing Maria-QA logic
    return {
      coveragePercent: 85,
      filesModified: ['src/__tests__/Login.test.tsx'],
      newTests: [...],
    };
  },
};
```

---

## Session Metrics Explained

### Impact Score (0-10)

**Calculation**:
```
Impact Score = Efficiency (0-5) + Quality (0-3) + Usage (0-2)

Efficiency  = (Time Saved / Session Duration) * 5
Quality     = (Success Rate) * 3
Usage       = (Agent Activations / 5) * 2
```

**Interpretation**:
- **9-10**: 🔥 Exceptional framework usage
- **8-9**: 🚀 Excellent productivity
- **7-8**: ✨ Very good session
- **6-7**: 👍 Good usage
- **5-6**: 👌 Moderate impact
- **< 5**: 📊 Low utilization (consider using more agents)

### Productivity Gain

**Calculation**:
```
Productivity Gain = (Time Saved / Session Duration) * 100%
```

**Example**:
- Session Duration: 3 hours (180 minutes)
- Time Saved: 90 minutes
- Productivity Gain: (90 / 180) * 100 = **50%**

**Meaning**: You worked 50% faster than manual development.

### Framework ROI

**Calculation**:
```
Framework Overhead = Session Duration * 5%  (estimated framework setup/learning)
ROI = Time Saved / Framework Overhead
```

**Example**:
- 10 sessions, total duration: 30 hours (1800 minutes)
- Framework overhead: 1800 * 0.05 = 90 minutes
- Total time saved: 600 minutes
- ROI = 600 / 90 = **6.7x**

**Meaning**: For every 1 minute invested in VERSATIL, you save 6.7 minutes.

---

## Logs and Data Storage

### File Locations

```
~/.versatil/
├── logs/
│   └── usage.log              # All agent activations (JSON lines)
└── sessions/
    ├── session-2025-10-19.json  # Today's session summary
    ├── session-2025-10-18.json
    └── ...                      # Historical sessions
```

### Log Format (usage.log)

**JSON Lines** format (one event per line):

```json
{"timestamp":1729351200000,"sessionId":"2025-10-19-abc123","agentId":"maria-qa","agentName":"Maria-QA","taskType":"test_coverage_analysis","taskDescription":"Analyze test coverage","status":"started"}
{"timestamp":1729351380000,"sessionId":"2025-10-19-abc123","agentId":"maria-qa","agentName":"Maria-QA","taskType":"test_coverage_analysis","taskDescription":"Analyze test coverage","status":"completed","duration":180000,"outcome":{"success":true,"quality":85,"timeSaved":27}}
```

### Session Format (session-YYYY-MM-DD.json)

```json
{
  "sessionId": "2025-10-19-abc123",
  "startTime": 1729351200000,
  "endTime": 1729364000000,
  "duration": 12600000,
  "agentActivations": 4,
  "tasksCompleted": 4,
  "tasksFailed": 0,
  "totalTimeSaved": 104,
  "averageQuality": 89.5,
  "impactScore": 7.1,
  "agentBreakdown": {
    "maria-qa": {
      "activations": 2,
      "successRate": 1.0,
      "avgDuration": 180000,
      "timeSaved": 58
    }
  },
  "date": "2025-10-19",
  "productivity": {
    "timeSaved": 104,
    "productivityGain": 50,
    "efficiency": 100
  },
  "topPatterns": [
    "React Testing Library patterns"
  ],
  "recommendations": [
    "Excellent session!"
  ]
}
```

---

## Programmatic Access

### Get Current Session Metrics

```typescript
import { getUsageLogger } from './tracking/usage-logger.js';

const usageLogger = getUsageLogger();
const metrics = usageLogger.getSessionMetrics();

console.log(`Time saved this session: ${metrics.totalTimeSaved} minutes`);
console.log(`Impact score: ${metrics.impactScore}/10`);
```

### Get Session Summary

```typescript
import { getSessionManager } from './tracking/session-manager.js';

const sessionManager = getSessionManager();
const summary = await sessionManager.getCurrentSessionSummary();

console.log(`Productivity gain: ${summary.productivity.productivityGain}%`);
```

### Get All-Time Stats

```typescript
const cumulativeStats = await sessionManager.getCumulativeStats();

console.log(`Total time saved: ${cumulativeStats.totalTimeSaved} minutes`);
console.log(`Framework ROI: ${cumulativeStats.frameworkROI}x`);
console.log(`Trend: ${cumulativeStats.trend}`);
```

---

## Next Steps

### Immediate (Today)

1. ✅ Test sample data generation: `node scripts/test-usage-logger.cjs`
2. ✅ View session summary: `pnpm run session:summary`
3. ✅ Review weekly report: `pnpm run session:summary --week`

### Short-Term (This Week)

1. **Integrate with Maria-QA** (most-used agent)
   - Add usage logging to Maria-QA agent
   - Track test coverage analysis tasks
   - Measure time saved

2. **Integrate with James-Frontend**
   - Log component optimization tasks
   - Track accessibility audits
   - Measure visual regression testing

3. **Integrate with Marcus-Backend**
   - Log security scans
   - Track API documentation generation
   - Measure stress test creation

### Long-Term (Next 2-4 Weeks)

1. **Build Cursor Status Bar Extension** (Phase 2)
   - Show live agent activity in IDE
   - Display time saved in real-time
   - Click to open detailed dashboard

2. **Add Power Sentiment Metrics** (Phase 3)
   - Real-time "time saved" calculations
   - Framework impact score in statusline
   - Cumulative productivity tracking

3. **Implement Notifications** (Phase 4)
   - Agent activation messages
   - Completion notifications with time saved
   - Daily summary notifications

---

## Troubleshooting

### Issue: No session data

**Symptom**: `pnpm run session:summary` shows "No session data for today yet"

**Solution**:
```bash
# Generate sample data first
node scripts/test-usage-logger.cjs

# Then try again
pnpm run session:summary
```

### Issue: Missing log files

**Symptom**: Can't find `~/.versatil/logs/usage.log`

**Solution**:
```bash
# Create directory
mkdir -p ~/.versatil/logs

# Run test to populate
node scripts/test-usage-logger.cjs
```

### Issue: Empty reports

**Symptom**: Reports show 0 activations, 0 time saved

**Solution**: Agents not yet integrated. Follow integration steps above to add usage logging to your agents.

---

## Reference

### Files Created (Phase 1)

| File | Purpose | Lines |
|------|---------|-------|
| `src/tracking/usage-logger.ts` | Auto-log agent activations | 383 |
| `src/tracking/session-manager.ts` | Track session metrics | 281 |
| `scripts/session-summary.cjs` | Human-readable reports | 468 |
| `scripts/test-usage-logger.cjs` | Generate sample data | 151 |

### Related Documentation

- [Real-Time IDE Integration Guide](realtime-ide-integration.md)
- [Cursor Integration Guide](cursor-integration.md)
- [Agent Troubleshooting Guide](agent-troubleshooting.md)

---

**Version**: 1.0.0 (Phase 1 Complete)
**Date**: October 19, 2025
**Status**: ✅ Production Ready
**Next Phase**: Cursor Status Bar Extension (Phase 2)

