# Health Monitoring Skill

**Category**: Guardian Core Skills
**Priority**: HIGH
**Auto-Load**: When health, monitor, doctor, coherence mentioned
**Context Size**: ~300 tokens (SKILL.md) + ~450 tokens (references) = ~750 tokens total

---

## 📋 Metadata (Level 1 - Always in Context)

**Purpose**: Framework health validation and proactive monitoring

**When to Use**:
- Guardian performs daily/weekly health checks
- User runs `/coherence` or `npx versatil doctor`
- Before major operations (release, migration, deployment)
- When framework behavior seems degraded

**What It Provides**:
- 7-dimension health scoring (0-100 scale)
- Auto-remediation patterns (90%+ confidence)
- Trend analysis (7-day, 30-day averages)
- Alert thresholds and notification triggers

**Related Skills**:
- `version-management` - Works with health checks for update recommendations
- `native-sdk-integration` - SDK compliance is part of health validation

**Token Savings**: ~2,000 tokens (progressive disclosure vs always-loaded)

---

## 📖 Description (Level 2 - Load When Skill Triggered)

### What This Skill Does

The **health-monitoring** skill provides comprehensive framework health validation across 7 critical dimensions:

1. **Version Alignment** - Installed vs latest npm version
2. **Installation Integrity** - File count, structure validation
3. **Agent Configuration** - 18 agents operational?
4. **MCP Servers** - 29 tools accessible, latency <100ms
5. **RAG Connectivity** - GraphRAG + Vector store health
6. **Dependencies** - Security vulnerabilities, version compatibility
7. **Context Detection** - Proper isolation (FRAMEWORK vs PROJECT)

Each dimension gets a **health score (0-100)** and the overall health is a **weighted average**:

```typescript
const weights = {
  version: 0.15,
  installation: 0.20,  // Most critical
  agents: 0.15,
  mcp: 0.10,
  rag: 0.15,
  dependencies: 0.15,
  context: 0.10
};
```

### Health Scoring Scale

| Score | Status | Meaning | Action |
|-------|--------|---------|--------|
| 90-100 | 🟢 Excellent | All systems operational | None |
| 75-89 | 🟡 Good | Minor issues detected | Review warnings |
| 50-74 | 🟠 Degraded | Functionality impaired | Fix immediately |
| 0-49 | 🔴 Critical | Framework broken | Emergency recovery |

### Auto-Remediation System

Guardian applies fixes automatically when:
- **Confidence ≥90%** - Known issue with proven fix
- **Non-destructive** - Won't cause data loss
- **Idempotent** - Safe to run multiple times

Common auto-fixes:
- Restart GraphRAG (ECONNREFUSED)
- Reinstall dependencies (npm audit fix)
- Rebuild framework (outdated dist/)
- Clear caches (npm cache clean)

### Proactive Monitoring

Guardian monitors health:
- **Daily**: Quick check (<5s, lightweight)
- **Weekly**: Full check (up to 30s, comprehensive)
- **On-demand**: User runs `/coherence` or `npx versatil doctor`

Notifications sent when:
- Health drops below 75% (degraded)
- Critical issues detected (health <50%)
- Major/minor updates available
- Auto-remediation applied

---

## 🔧 Usage (Level 2 - Load When Skill Triggered)

### For Guardian (Proactive Monitoring)

```typescript
import { UserCoherenceMonitor } from './agents/guardian/user-coherence-monitor.js';

const monitor = new UserCoherenceMonitor({
  check_interval_hours: 24,        // Daily checks
  notify_on_updates: true,
  notify_on_issues: true,
  auto_fix_threshold: 90,           // 90%+ confidence
  enable_trend_analysis: true
});

// Perform monitoring check
const report = await monitor.performMonitoring();

console.log(`Overall Health: ${report.current_health}/100`);
console.log(`Status: ${report.status}`);
console.log(`Issues: ${report.critical_issues.length} critical, ${report.warnings.length} warnings`);
console.log(`Auto-fixes applied: ${report.auto_fixes_applied.length}`);

// Get 30-day trend
const trends = await monitor.getHealthTrends();
console.log(`7-day avg: ${trends.avg_health_7d}/100`);
console.log(`30-day avg: ${trends.avg_health_30d}/100`);
console.log(`Trend: ${trends.trend}`); // 'improving' | 'stable' | 'degrading'
```

### For Users (CLI)

```bash
# Quick health check (version + critical only)
npx versatil doctor --quick

# Full health check (all 7 dimensions)
npx versatil doctor

# With auto-fix (apply ≥90% confidence fixes)
npx versatil doctor --fix

# View 30-day health trends
npx versatil doctor --trends
```

**Exit codes** (for CI/CD):
- `0` - Health ≥75% (good/excellent)
- `1` - Health 50-74% (degraded)
- `2` - Health <50% (critical)

### For Users (In-Session)

```
/coherence              # Full health check
/coherence --quick      # Fast check
/coherence --fix        # Apply auto-fixes
```

**Output includes**:
- Overall health score with color-coded status bar
- Component-by-component breakdown
- List of issues (critical + warnings)
- Recommendations for manual fixes
- Auto-fixes available (with confidence scores)

---

## 📊 Health Dimensions (Level 2)

### 1. Version Alignment (15% weight)

**What it checks**:
- Installed framework version (from package.json)
- Latest npm version (from npm registry)
- Version compatibility (Node.js ≥18.0.0, TypeScript ≥5.0.0)

**Health scoring**:
```typescript
if (installed === latest) health_score = 100;
else if (semver.diff(installed, latest) === 'patch') health_score = 90;
else if (semver.diff(installed, latest) === 'minor') health_score = 75;
else if (semver.diff(installed, latest) === 'major') health_score = 50;
```

**Auto-fixes**:
- Patch updates: `npm update @versatil/sdlc-framework` (95% confidence)
- Minor updates: Suggest with migration notes (70% confidence)
- Major updates: Manual review required (no auto-fix)

---

### 2. Installation Integrity (20% weight) ⭐ MOST CRITICAL

**What it checks**:
- File count (should be 1,247 files)
- Required directories exist (.claude/, src/, dist/, docs/)
- Critical files present (package.json, CLAUDE.md, hooks)

**Health scoring**:
```typescript
const file_coverage = files_present / 1247;
if (file_coverage >= 0.99) health_score = 100;        // 1,235+ files
else if (file_coverage >= 0.90) health_score = 80;    // 1,122+ files
else if (file_coverage >= 0.70) health_score = 50;    // 873+ files
else health_score = 0;  // Corrupted installation
```

**Auto-fixes**:
- Missing files: `npm install @versatil/sdlc-framework --force` (92% confidence)
- Corrupted: Full reinstall (88% confidence)

---

### 3. Agent Configuration (15% weight)

**What it checks**:
- 18 agents operational (8 core + 10 sub-agents)
- Agent definition files valid (.claude/agents/*.md)
- Required fields present (role, context, tools)

**Health scoring**:
```typescript
const agent_ratio = operational_agents / 18;
if (agent_ratio >= 0.95) health_score = 100;  // 17-18 agents
else if (agent_ratio >= 0.80) health_score = 75;  // 15-16 agents
else if (agent_ratio >= 0.50) health_score = 40;  // 9-14 agents
else health_score = 0;  // <9 agents
```

**Auto-fixes**:
- Invalid YAML: Fix frontmatter syntax (85% confidence)
- Missing files: Reinstall framework (90% confidence)

---

### 4. MCP Servers (10% weight)

**What it checks**:
- 29 MCP tools accessible
- Connection latency <100ms (target)
- No authentication errors

**Health scoring**:
```typescript
const tool_ratio = accessible_tools / 29;
if (tool_ratio >= 0.90 && latency < 100) health_score = 100;
else if (tool_ratio >= 0.75 && latency < 200) health_score = 75;
else if (tool_ratio >= 0.50) health_score = 50;
else health_score = 20;
```

**Auto-fixes**:
- Restart MCP servers (depends on implementation)
- Clear connection cache (75% confidence)

---

### 5. RAG Connectivity (15% weight)

**What it checks**:
- GraphRAG connection (Neo4j, local)
- Vector store connection (Supabase)
- Query latency (GraphRAG <500ms, Vector <1s)

**Health scoring**:
```typescript
if (graphrag_ok && vector_ok) health_score = 100;
else if (graphrag_ok || vector_ok) health_score = 70;  // One working
else health_score = 0;  // Both failed
```

**Auto-fixes**:
- GraphRAG timeout: `npm run rag:start` (93% confidence)
- Vector failed: Check .env credentials (manual)
- Both failed: `npm run rag:reset && npm run rag:init` (85% confidence)

---

### 6. Dependencies (15% weight)

**What it checks**:
- `npm audit` results (critical/high/moderate vulnerabilities)
- Peer dependency warnings
- Outdated packages

**Health scoring**:
```typescript
if (critical_vulns > 0) health_score = 0;
else if (high_vulns > 0) health_score = 40;
else if (moderate_vulns > 2) health_score = 70;
else health_score = 100;
```

**Auto-fixes**:
- Critical/high vulnerabilities: `npm audit fix` (94% confidence)
- Force needed: `npm audit fix --force` (80% confidence, warn user)

---

### 7. Context Detection (10% weight)

**What it checks**:
- Proper context detection (FRAMEWORK vs PROJECT)
- Isolation enforced (no context mixing)
- Configuration loaded (CLAUDE.md exists)

**Health scoring**:
```typescript
if (context_detected && isolation_ok && config_loaded) health_score = 100;
else if (context_detected && isolation_ok) health_score = 80;
else if (context_detected) health_score = 50;
else health_score = 0;
```

**Auto-fixes**:
- Missing CLAUDE.md: Create template (75% confidence)
- Context mixing: Remove framework source files from project (manual, dangerous)

---

## 🎯 When Guardian Uses This Skill

### Daily Monitoring (Lightweight)

**Trigger**: Every 24 hours
**Duration**: <5 seconds
**Checks**: Version + Installation + Critical issues only

```typescript
const quickHealth = await coherenceCheck.performCoherenceCheck(true); // quick=true
if (quickHealth.overall_health < 75) {
  // Notify user of degradation
  // Schedule full check
}
```

### Weekly Deep Check (Comprehensive)

**Trigger**: Every 7 days
**Duration**: Up to 30 seconds
**Checks**: All 7 dimensions + trend analysis

```typescript
const fullHealth = await coherenceCheck.performCoherenceCheck(false); // full check
await monitor.updateHealthHistory(fullHealth);
const trends = await monitor.getHealthTrends();

if (trends.trend === 'degrading') {
  // Alert user - framework health declining over time
}
```

### On-Demand (User-Initiated)

**Trigger**: `/coherence` command or `npx versatil doctor`
**Duration**: 5-30 seconds (depending on --quick flag)
**Checks**: User-specified (quick or full)

---

## 📁 Reference Files (Level 3 - Load as Needed)

### `references/metrics.md` (~150 tokens)
Detailed health scoring formulas, component weights, threshold calculations

**Load when**: Implementing new health checks, debugging scoring logic

### `references/remediation-playbook.md` (~200 tokens)
Complete list of auto-remediation patterns with confidence scores, prerequisites, rollback steps

**Load when**: Implementing auto-fix logic, debugging remediation failures

### `references/alert-thresholds.md` (~100 tokens)
Notification trigger thresholds, severity levels, notification templates

**Load when**: Implementing monitoring alerts, customizing notification behavior

---

## 🔗 Integration Points

### With User Coherence System

```typescript
// src/coherence/user-coherence-check.ts
import { healthMonitoring } from '.claude/skills/health-monitoring/SKILL.md';

export class UserCoherenceCheckService {
  async performCoherenceCheck(quick: boolean = false): Promise<CoherenceCheckResult> {
    // Uses health-monitoring skill patterns for:
    // - 7-dimension validation
    // - Weighted scoring
    // - Auto-fix selection (≥90% confidence)
  }
}
```

### With Guardian Monitoring

```typescript
// src/agents/guardian/user-coherence-monitor.ts
import { healthMonitoring } from '.claude/skills/health-monitoring/SKILL.md';

export class UserCoherenceMonitor {
  async performMonitoring(): Promise<UserCoherenceReport> {
    // Uses health-monitoring skill patterns for:
    // - Daily/weekly check scheduling
    // - Trend analysis
    // - Notification triggers
  }
}
```

### With CLI Doctor

```bash
# bin/versatil-doctor.js
# Uses health-monitoring skill patterns for:
# - Terminal output formatting (health bars, colors)
# - Exit code determination (0/1/2)
# - Quick vs full check logic
```

---

## 📈 Performance Characteristics

- **Quick check**: <5 seconds (version + installation + critical only)
- **Full check**: 5-30 seconds (all 7 dimensions + trends)
- **Memory overhead**: <50MB (health history storage)
- **Disk usage**: <10MB (30 days of health logs)

---

## 🎓 Best Practices

### For Guardian

1. **Always try lightweight check first** - Save time, only go full if issues detected
2. **Apply auto-fixes conservatively** - Require ≥90% confidence, log all changes
3. **Track trends over time** - 7-day and 30-day averages reveal patterns
4. **Notify proactively** - Alert before health becomes critical (<50%)

### For Users

1. **Run weekly health checks** - `npx versatil doctor` as part of routine maintenance
2. **Use --fix for known issues** - Auto-remediation is safe and tested
3. **Check trends before major work** - `--trends` flag shows if framework degrading
4. **CI/CD integration** - Add health check to pipeline, fail on critical (<50%)

---

## 📚 Additional Resources

- **User Guide**: [docs/USER_COHERENCE_GUIDE.md](../../../docs/USER_COHERENCE_GUIDE.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](../../../docs/TROUBLESHOOTING.md)
- **Service Implementation**: [src/coherence/user-coherence-check.ts](../../../src/coherence/user-coherence-check.ts)
- **Guardian Monitor**: [src/agents/guardian/user-coherence-monitor.ts](../../../src/agents/guardian/user-coherence-monitor.ts)
