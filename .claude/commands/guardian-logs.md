---
description: "View Guardian activity logs and monitor framework health in real-time"
argument-hint: "[category] [--tail] [--follow] [--filter=pattern]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Read"
  - "Bash"
---

# Guardian Logs Viewer

View Iris-Guardian activity logs to monitor framework health, auto-remediation, RAG operations, and agent coordination.

## Usage

```bash
# View main activity log (last 50 lines)
/guardian-logs

# View specific category
/guardian-logs health
/guardian-logs remediation
/guardian-logs rag
/guardian-logs agents
/guardian-logs version        # FRAMEWORK_CONTEXT only
/guardian-logs timeline       # Activity timeline

# Follow logs in real-time (like tail -f)
/guardian-logs --follow

# View last N lines
/guardian-logs --tail=100

# Filter by pattern
/guardian-logs --filter="error"
/guardian-logs health --filter="GraphRAG"
```

## Log Categories

### 1. Main Activity Log (`guardian`)
**Path**: `~/.versatil/logs/guardian/guardian-YYYY-MM-DD.log`

All Guardian activity including:
- System start/stop events
- Health checks
- Auto-remediation attempts
- RAG operations
- Agent coordination
- Version management (FRAMEWORK_CONTEXT)

**After displaying logs, invoke Iris-Guardian for pattern analysis:**

```typescript
await Task({
  subagent_type: "Iris-Guardian",
  description: "Analyze log patterns",
  prompt: `Analyze logs for error patterns, anomalies, root causes, trend analysis. Return analysis with anomalies_detected, root_causes, and recommended_actions.`
});
```

**View**:
```bash
/guardian-logs
/guardian-logs --tail=100
```

---

### 2. Health Checks (`health`)
**Path**: `~/.versatil/logs/guardian/health/health-checks-YYYY-MM-DD.log`

Health check results every 5 minutes:
- Overall health score (0-100%)
- Component scores (framework, agents, RAG, build, tests)
- Issues detected
- Alert thresholds

**View**:
```bash
/guardian-logs health
/guardian-logs health --tail=20
```

**Example Entry**:
```json
{
  "timestamp": "2025-10-27T14:35:22.123Z",
  "level": "info",
  "category": "health",
  "context": "FRAMEWORK_CONTEXT",
  "message": "Health check completed: 95% (healthy)",
  "data": {
    "overall_health": 95,
    "status": "healthy",
    "components": {
      "framework": { "score": 100, "status": "healthy" },
      "agents": { "score": 95, "status": "healthy" },
      "rag": { "score": 90, "status": "healthy" },
      "build": { "score": 100, "status": "healthy" },
      "tests": { "score": 85, "status": "healthy" }
    },
    "issues_count": 0,
    "issues": []
  },
  "duration_ms": 1234
}
```

---

### 3. Auto-Remediation (`remediation`)
**Path**: `~/.versatil/logs/guardian/remediation/auto-remediation-YYYY-MM-DD.log`

Auto-fix attempts and results:
- Issue detected
- Action taken
- Success/failure
- Confidence score
- Before/after state
- Learned pattern (stored in RAG)

**View**:
```bash
/guardian-logs remediation
/guardian-logs remediation --filter="success"
```

**Example Entry**:
```json
{
  "timestamp": "2025-10-27T14:36:45.789Z",
  "level": "info",
  "category": "remediation",
  "context": "FRAMEWORK_CONTEXT",
  "message": "Auto-remediation SUCCESS: GraphRAG latency spike",
  "data": {
    "issue": "GraphRAG query latency >3 seconds",
    "action": "Restarted Neo4j container (docker restart versatil-neo4j)",
    "success": true,
    "confidence": 95,
    "before": "Latency: 4200ms, Memory: 4.1GB/4GB",
    "after": "Latency: 95ms, Memory: 1.2GB/4GB",
    "learned": true
  },
  "duration_ms": 8500
}
```

---

### 4. RAG Operations (`rag`)
**Path**: `~/.versatil/logs/guardian/rag/rag-operations-YYYY-MM-DD.log`

RAG/GraphRAG health monitoring:
- GraphRAG query latency
- Vector store connectivity
- Pattern search operations
- Fallback events (GraphRAG → Vector → Local)

**View**:
```bash
/guardian-logs rag
/guardian-logs rag --filter="graphrag"
```

**Example Entry**:
```json
{
  "timestamp": "2025-10-27T14:37:12.456Z",
  "level": "warn",
  "category": "rag",
  "context": "PROJECT_CONTEXT",
  "message": "RAG health_check on graphrag: FAILED (timeout)",
  "data": {
    "operation": "health_check",
    "store": "graphrag",
    "success": false,
    "latency_ms": 5000,
    "error": "Connection timeout",
    "fallback": "vector"
  },
  "duration_ms": 5000
}
```

---

### 5. Agent Coordination (`agents`)
**Path**: `~/.versatil/logs/guardian/agents/agent-coordination-YYYY-MM-DD.log`

Agent activation tracking:
- Agent activation success/failures
- Agent handoffs
- Multi-agent coordination
- Performance metrics

**View**:
```bash
/guardian-logs agents
/guardian-logs agents --filter="Maria-QA"
```

**Example Entry**:
```json
{
  "timestamp": "2025-10-27T14:38:00.123Z",
  "level": "error",
  "category": "agent",
  "context": "PROJECT_CONTEXT",
  "message": "Agent Maria-QA activated: FAILED",
  "data": {
    "agent": "Maria-QA",
    "action": "activated",
    "success": false,
    "error": "Module not found: dist/agents/opera/maria-qa/",
    "auto_fix_attempted": true,
    "auto_fix_success": true
  }
}
```

---

### 6. Version Management (`version`) - FRAMEWORK_CONTEXT Only
**Path**: `~/.versatil/logs/guardian/version/version-management-YYYY-MM-DD.log`

Framework version and release activity:
- Version bump recommendations
- Release creation
- CHANGELOG updates
- Roadmap updates

**View**:
```bash
/guardian-logs version
/guardian-logs version --tail=10
```

**Example Entry**:
```json
{
  "timestamp": "2025-10-27T14:39:30.789Z",
  "level": "info",
  "category": "version",
  "context": "FRAMEWORK_CONTEXT",
  "message": "Version bump_recommended: v7.6.0 → v7.7.0",
  "data": {
    "type": "bump_recommended",
    "from": "v7.6.0",
    "to": "v7.7.0",
    "reason": "MINOR - 45 commits, 2 major features, 3 critical bugs fixed",
    "completeness": 88,
    "confidence": 92
  }
}
```

---

### 7. Activity Timeline (`timeline`)
**Path**: `~/.versatil/logs/guardian/activity-timeline.jsonl`

High-level activity timeline (JSONL format):
- Health checks
- Auto-fixes
- Alerts
- RAG queries
- Agent activations
- Version bumps
- Releases

**View**:
```bash
/guardian-logs timeline
/guardian-logs timeline --tail=50
```

**Example Entry**:
```json
{
  "timestamp": "2025-10-27T14:40:00.000Z",
  "type": "auto_fix",
  "status": "success",
  "description": "Fixed: GraphRAG latency spike",
  "details": {
    "action": "docker restart versatil-neo4j",
    "confidence": 95
  }
}
```

---

## Flags

### `--tail=N`
View last N lines (default: 50)

```bash
/guardian-logs --tail=100
/guardian-logs health --tail=20
```

### `--follow` or `-f`
Follow logs in real-time (like `tail -f`)

```bash
/guardian-logs --follow
/guardian-logs health --follow
```

**Note**: Press Ctrl+C to stop following

### `--filter=PATTERN`
Filter logs by pattern (case-insensitive grep)

```bash
/guardian-logs --filter="error"
/guardian-logs health --filter="GraphRAG"
/guardian-logs remediation --filter="success"
```

### `--json`
Output raw JSON (for programmatic parsing)

```bash
/guardian-logs --json
/guardian-logs health --json --tail=10
```

---

## Quick Commands

### Check recent health
```bash
/guardian-logs health --tail=5
```

### Monitor auto-fixes in real-time
```bash
/guardian-logs remediation --follow
```

### Find all errors
```bash
/guardian-logs --filter="error" --tail=100
```

### Watch for specific agent issues
```bash
/guardian-logs agents --filter="Maria-QA" --tail=20
```

### Check version activity (framework development)
```bash
/guardian-logs version --tail=10
```

### View full activity timeline
```bash
/guardian-logs timeline --tail=100
```

---

## Log Locations

All logs stored in: `~/.versatil/logs/guardian/`

```
~/.versatil/logs/guardian/
├── guardian-2025-10-27.log          # Main activity log
├── activity-timeline.jsonl           # Activity timeline
├── health/
│   └── health-checks-2025-10-27.log
├── remediation/
│   └── auto-remediation-2025-10-27.log
├── rag/
│   └── rag-operations-2025-10-27.log
├── agents/
│   └── agent-coordination-2025-10-27.log
├── version/                          # FRAMEWORK_CONTEXT only
│   └── version-management-2025-10-27.log
└── archive/                          # Logs older than 30 days
    └── ...
```

---

## Integration with /monitor

Guardian logs complement the `/monitor` command:

- **`/monitor`**: Real-time health dashboard (TUI)
- **`/guardian-logs`**: Historical log analysis

**Workflow**:
1. Run `/monitor` to see current health
2. If issues detected, run `/guardian-logs health --tail=20` to see trend
3. Check `/guardian-logs remediation` to see if auto-fixes were attempted
4. Review `/guardian-logs timeline` for full activity context

---

## Troubleshooting

### Logs not found
```bash
# Check if Guardian has run
ls -la ~/.versatil/logs/guardian/

# If empty, start Guardian
/guardian start
```

### Large log files
```bash
# Logs are rotated automatically (kept 30 days)
# Archived logs: ~/.versatil/logs/guardian/archive/

# Manual cleanup (if needed)
rm ~/.versatil/logs/guardian/archive/*.log
```

### Permission denied
```bash
# Fix permissions
chmod -R u+rw ~/.versatil/logs/guardian/
```

---

## Examples

### Example 1: Debug agent activation failure
```bash
# User: "Maria-QA not activating"

# Step 1: Check agent logs
/guardian-logs agents --filter="Maria-QA" --tail=10

# Output shows:
# Agent Maria-QA activated: FAILED
# error: "Module not found: dist/agents/opera/maria-qa/"

# Step 2: Check if auto-fix worked
/guardian-logs remediation --tail=5

# Output shows:
# Auto-remediation SUCCESS: Ran npm run build
# After: Agent Maria-QA now operational
```

### Example 2: Investigate RAG slowness
```bash
# User: "Pattern search slow"

# Step 1: Check RAG operations
/guardian-logs rag --tail=20

# Output shows:
# GraphRAG query latency: 4200ms (slow)
# Fallback to vector store: 95ms (fast)

# Step 2: Check if Guardian fixed it
/guardian-logs remediation --filter="GraphRAG"

# Output shows:
# Auto-remediation SUCCESS: Restarted Neo4j
# Latency restored: 95ms
```

### Example 3: Monitor framework health during development
```bash
# In one terminal: Follow health checks
/guardian-logs health --follow

# In another terminal: Work on feature
# Guardian logs health every 5 minutes:
# 14:35 - Health: 95% (healthy)
# 14:40 - Health: 92% (healthy, 2 warnings)
# 14:45 - Health: 88% (degraded, 5 warnings)
# 14:50 - Health: 95% (healthy, auto-fixed)
```

---

## API Access (Programmatic)

For programmatic access to logs:

```typescript
import { GuardianLogger } from 'src/agents/guardian/guardian-logger.js';

const logger = new GuardianLogger('PROJECT_CONTEXT');

// Get recent activities
const activities = logger.getRecentActivities(50);

// Get activity timeline (full history)
const timeline = logger.getActivityTimeline(100);

// Get log file paths
const paths = logger.getLogPaths();
console.log(paths.main);      // ~/.versatil/logs/guardian/guardian-2025-10-27.log
console.log(paths.health);    // ~/.versatil/logs/guardian/health/health-checks-2025-10-27.log
```

---

**Related Commands**:
- `/monitor` - Real-time health dashboard
- `/guardian` - Guardian control (start/stop/status)
- `/framework-debug` - Comprehensive debug report
