# Health Metrics Reference

**Purpose**: Detailed health scoring formulas and threshold calculations

---

## Overall Health Calculation

```typescript
function calculateOverallHealth(checks: HealthChecks): number {
  const weights = {
    version: 0.15,
    installation: 0.20,  // Most critical
    agents: 0.15,
    mcp: 0.10,
    rag: 0.15,
    dependencies: 0.15,
    context: 0.10
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [component, weight] of Object.entries(weights)) {
    if (checks[component]?.health_score !== undefined) {
      weightedSum += checks[component].health_score * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}
```

---

## Component-Specific Scoring

### 1. Version Alignment (0-100)

```typescript
function calculateVersionHealth(installed: string, latest: string): number {
  if (installed === latest) return 100;

  const diff = semver.diff(installed, latest);

  switch (diff) {
    case 'patch':
      return 90;  // Minor issue, easy fix
    case 'minor':
      return 75;  // Some new features missed
    case 'major':
      return 50;  // Significant gap, breaking changes
    case 'premajor':
    case 'preminor':
    case 'prepatch':
      return 60;  // Pre-release versions
    default:
      return 0;   // Unknown version relationship
  }
}

// Additional penalties
if (!isNodeCompatible(nodeVersion)) health_score *= 0.5;  // -50%
if (!isTypeScriptCompatible(tsVersion)) health_score *= 0.8;  // -20%
```

---

### 2. Installation Integrity (0-100)

```typescript
function calculateInstallationHealth(
  filesPresent: number,
  requiredFiles: string[]
): number {
  const EXPECTED_FILES = 1247;
  const fileCoverage = filesPresent / EXPECTED_FILES;

  let health_score = 0;

  if (fileCoverage >= 0.99) {
    health_score = 100;  // 1,235+ files (99%+)
  } else if (fileCoverage >= 0.90) {
    health_score = 80;   // 1,122+ files (90-99%)
  } else if (fileCoverage >= 0.70) {
    health_score = 50;   // 873+ files (70-90%)
  } else if (fileCoverage >= 0.50) {
    health_score = 20;   // 623+ files (50-70%)
  } else {
    health_score = 0;    // <623 files - corrupted
  }

  // Check critical files
  const missingCritical = requiredFiles.filter(f => !fs.existsSync(f));
  if (missingCritical.length > 0) {
    health_score *= 0.5;  // -50% if any critical file missing
  }

  return Math.round(health_score);
}

// Critical files that MUST exist
const CRITICAL_FILES = [
  'package.json',
  '.claude/settings.json',
  'dist/index.js',
  '.claude/agents/iris-guardian.md',
  '.claude/hooks/dist/before-prompt.cjs'
];
```

---

### 3. Agent Configuration (0-100)

```typescript
function calculateAgentHealth(
  operationalAgents: number,
  invalidAgents: string[]
): number {
  const EXPECTED_AGENTS = 18;
  const agentRatio = operationalAgents / EXPECTED_AGENTS;

  let health_score = 0;

  if (agentRatio >= 0.95) {
    health_score = 100;  // 17-18 agents (95%+)
  } else if (agentRatio >= 0.80) {
    health_score = 75;   // 15-16 agents (80-95%)
  } else if (agentRatio >= 0.50) {
    health_score = 40;   // 9-14 agents (50-80%)
  } else {
    health_score = 0;    // <9 agents - broken
  }

  // Penalty for invalid definitions
  if (invalidAgents.length > 0) {
    const invalidPenalty = (invalidAgents.length / EXPECTED_AGENTS) * 30;
    health_score -= invalidPenalty;
  }

  return Math.max(0, Math.round(health_score));
}
```

---

### 4. MCP Servers (0-100)

```typescript
function calculateMCPHealth(
  accessibleTools: number,
  avgLatency: number
): number {
  const EXPECTED_TOOLS = 29;
  const toolRatio = accessibleTools / EXPECTED_TOOLS;

  let health_score = 0;

  if (toolRatio >= 0.90) {
    health_score = 100;  // 26-29 tools (90%+)
  } else if (toolRatio >= 0.75) {
    health_score = 75;   // 22-25 tools (75-90%)
  } else if (toolRatio >= 0.50) {
    health_score = 50;   // 15-21 tools (50-75%)
  } else {
    health_score = 20;   // <15 tools
  }

  // Latency penalties
  if (avgLatency > 100) {
    health_score *= 0.9;   // -10% for >100ms
  }
  if (avgLatency > 500) {
    health_score *= 0.7;   // Additional -30% for >500ms
  }

  return Math.round(health_score);
}
```

---

### 5. RAG Connectivity (0-100)

```typescript
function calculateRAGHealth(
  graphragOk: boolean,
  vectorOk: boolean,
  graphragLatency: number,
  vectorLatency: number
): number {
  let health_score = 0;

  // Base score from connectivity
  if (graphragOk && vectorOk) {
    health_score = 100;  // Both working
  } else if (graphragOk) {
    health_score = 70;   // GraphRAG only (acceptable - offline)
  } else if (vectorOk) {
    health_score = 60;   // Vector only (degraded - needs API)
  } else {
    health_score = 0;    // Both failed - critical
  }

  // Latency penalties
  if (graphragOk && graphragLatency > 500) {
    health_score *= 0.9;  // -10% for slow GraphRAG
  }
  if (vectorOk && vectorLatency > 1000) {
    health_score *= 0.9;  // -10% for slow Vector
  }

  return Math.round(health_score);
}
```

---

### 6. Dependencies (0-100)

```typescript
function calculateDependencyHealth(auditResult: NpmAuditResult): number {
  const { critical, high, moderate, low } = auditResult.vulnerabilities;

  let health_score = 100;

  // Critical vulnerabilities = immediate 0
  if (critical > 0) {
    return 0;
  }

  // High vulnerabilities = major penalty
  if (high > 0) {
    health_score = 40;  // Max 40/100 with high vulns
  }

  // Moderate vulnerabilities = minor penalty
  if (moderate > 2) {
    health_score -= (moderate - 2) * 10;  // -10 per extra moderate
  }

  // Low vulnerabilities = minimal penalty
  if (low > 5) {
    health_score -= (low - 5) * 2;  // -2 per extra low
  }

  return Math.max(0, Math.round(health_score));
}
```

---

### 7. Context Detection (0-100)

```typescript
function calculateContextHealth(
  contextDetected: boolean,
  isolationOk: boolean,
  configLoaded: boolean
): number {
  let health_score = 0;

  if (contextDetected && isolationOk && configLoaded) {
    health_score = 100;  // Perfect
  } else if (contextDetected && isolationOk) {
    health_score = 80;   // Good, missing config only
  } else if (contextDetected) {
    health_score = 50;   // Degraded, isolation issues
  } else {
    health_score = 0;    // Critical, context unknown
  }

  return health_score;
}
```

---

## Status Thresholds

```typescript
function getHealthStatus(overallHealth: number): HealthStatus {
  if (overallHealth >= 90) return 'excellent';
  if (overallHealth >= 75) return 'good';
  if (overallHealth >= 50) return 'degraded';
  return 'critical';
}

// Color coding
const STATUS_COLORS = {
  excellent: '🟢',
  good: '🟡',
  degraded: '🟠',
  critical: '🔴'
};
```

---

## Trend Analysis

```typescript
function calculateHealthTrend(
  healthHistory: HealthRecord[]
): 'improving' | 'stable' | 'degrading' {
  const recent7 = healthHistory.slice(-7);
  const recent30 = healthHistory.slice(-30);

  const avg7d = average(recent7.map(r => r.overall_health));
  const avg30d = average(recent30.map(r => r.overall_health));

  const diff = avg7d - avg30d;

  if (diff > 5) return 'improving';    // +5 points in recent week
  if (diff < -5) return 'degrading';   // -5 points in recent week
  return 'stable';
}
```

---

## Confidence Scores for Auto-Fix

```typescript
const AUTO_FIX_CONFIDENCE: Record<string, number> = {
  // High confidence (90%+) - Always auto-apply
  'restart_graphrag': 93,
  'npm_audit_fix': 94,
  'npm_install_force': 92,
  'clear_npm_cache': 95,

  // Medium confidence (80-89%) - Apply with logging
  'npm_audit_fix_force': 80,
  'rebuild_framework': 88,
  'reinstall_dependencies': 85,

  // Low confidence (70-79%) - Suggest only, no auto-apply
  'create_missing_config': 75,
  'fix_yaml_frontmatter': 72,

  // Manual only (<70%) - Never auto-apply
  'fix_context_mixing': 50,
  'major_version_update': 30
};

function shouldAutoFix(fixName: string, threshold: number = 90): boolean {
  return AUTO_FIX_CONFIDENCE[fixName] >= threshold;
}
```
