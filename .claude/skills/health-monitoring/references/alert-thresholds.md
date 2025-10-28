# Alert Thresholds Reference

**Purpose**: Notification trigger thresholds and alert templates

---

## Alert Severity Levels

| Level | Health Score | When to Alert | Urgency | User Action Required |
|-------|-------------|---------------|---------|---------------------|
| 🟢 Info | 90-100 | Optional | Low | None (informational) |
| 🟡 Warning | 75-89 | Recommended | Medium | Review soon (within 48h) |
| 🟠 Alert | 50-74 | Required | High | Fix today |
| 🔴 Critical | 0-49 | Immediate | Urgent | Fix now (within 1h) |

---

## Notification Triggers

### Daily Monitoring (Lightweight Check)

```typescript
const DAILY_TRIGGERS = {
  health_drop: {
    threshold: 10,  // Alert if health drops >10 points in 24h
    severity: 'warning',
    message: 'Framework health declined by {delta} points in the last 24 hours'
  },

  new_critical_issue: {
    threshold: 1,   // Alert on ANY new critical issue
    severity: 'critical',
    message: 'Critical issue detected: {issue_description}'
  },

  version_update_available: {
    threshold: 'minor',  // Alert on minor/major updates
    severity: 'info',
    message: 'Framework update available: {current} → {latest}'
  }
};
```

**Notification Frequency**: Once per day (max)

---

### Weekly Deep Check (Comprehensive)

```typescript
const WEEKLY_TRIGGERS = {
  health_degrading_trend: {
    threshold: 'degrading',  // 30-day trend is degrading
    severity: 'warning',
    message: 'Framework health has been declining over the past 30 days'
  },

  multiple_warnings: {
    threshold: 5,   // 5+ warnings accumulated
    severity: 'alert',
    message: '{count} warnings detected across components'
  },

  stale_dependencies: {
    threshold: 90,  // Dependencies >90 days old
    severity: 'warning',
    message: 'Dependencies have not been updated in {days} days'
  }
};
```

**Notification Frequency**: Once per week (max)

---

## Component-Specific Alerts

### 1. Version Alignment

```typescript
const VERSION_ALERTS = {
  patch_available: {
    severity: 'info',
    frequency: 'weekly',
    message: 'Patch update available: v{current} → v{latest}\n' +
             'Run: npm update @versatil/sdlc-framework'
  },

  minor_available: {
    severity: 'warning',
    frequency: 'weekly',
    message: 'Minor update available: v{current} → v{latest}\n' +
             'New features available. Review CHANGELOG and update.\n' +
             'Run: npm install @versatil/sdlc-framework@latest'
  },

  major_available: {
    severity: 'alert',
    frequency: 'weekly',
    message: 'Major update available: v{current} → v{latest}\n' +
             'Breaking changes present. Review migration guide.\n' +
             'Migration guide: {migration_url}'
  },

  node_incompatible: {
    severity: 'critical',
    frequency: 'daily',
    message: 'Node.js version incompatible!\n' +
             'Current: {current_node}, Required: ≥18.0.0\n' +
             'Framework may not function correctly.'
  }
};
```

---

### 2. Installation Integrity

```typescript
const INSTALLATION_ALERTS = {
  partial_installation: {
    severity: 'warning',
    threshold: 0.90,  // <90% files present
    message: 'Framework installation incomplete\n' +
             'Files present: {count}/1247 ({percent}%)\n' +
             'Auto-fix available: npm install @versatil/sdlc-framework --force'
  },

  corrupted_installation: {
    severity: 'critical',
    threshold: 0.70,  // <70% files present
    message: 'Framework installation corrupted!\n' +
             'Files present: {count}/1247 ({percent}%)\n' +
             'Immediate action: Full reinstall required'
  },

  missing_critical_file: {
    severity: 'critical',
    frequency: 'daily',
    message: 'Critical framework file missing: {file_path}\n' +
             'Framework will not function correctly.\n' +
             'Auto-fix: npm install @versatil/sdlc-framework --force'
  }
};
```

---

### 3. Agent Configuration

```typescript
const AGENT_ALERTS = {
  agents_degraded: {
    severity: 'warning',
    threshold: 0.80,  // <80% agents operational
    message: '{count} agents not operational ({percent}%)\n' +
             'Affected: {agent_names}\n' +
             'Framework functionality may be limited.'
  },

  agents_critical: {
    severity: 'critical',
    threshold: 0.50,  // <50% agents operational
    message: 'Agent system critically degraded!\n' +
             'Only {count}/18 agents operational\n' +
             'Auto-fix: Reinstall framework'
  },

  invalid_agent_definition: {
    severity: 'warning',
    frequency: 'weekly',
    message: 'Invalid agent definition: {agent_name}\n' +
             'Error: {error_message}\n' +
             'Agent will not function until fixed.'
  }
};
```

---

### 4. MCP Servers

```typescript
const MCP_ALERTS = {
  tools_unavailable: {
    severity: 'warning',
    threshold: 0.75,  // <75% tools accessible
    message: 'MCP tools degraded\n' +
             'Accessible: {count}/29 ({percent}%)\n' +
             'Some framework features may not work.'
  },

  high_latency: {
    severity: 'warning',
    threshold: 200,  // >200ms avg latency
    message: 'MCP connection latency high: {latency}ms (target: <100ms)\n' +
             'Framework performance may be impacted.'
  },

  mcp_offline: {
    severity: 'alert',
    frequency: 'daily',
    message: 'MCP servers unreachable\n' +
             'Check network connectivity and MCP server status.'
  }
};
```

---

### 5. RAG Connectivity

```typescript
const RAG_ALERTS = {
  graphrag_offline: {
    severity: 'warning',
    frequency: 'daily',
    message: 'GraphRAG offline (falling back to Vector store)\n' +
             'Auto-fix available: npm run rag:start'
  },

  vector_offline: {
    severity: 'warning',
    frequency: 'daily',
    message: 'Vector store offline (using GraphRAG only)\n' +
             'Check Supabase credentials in .env'
  },

  rag_completely_offline: {
    severity: 'critical',
    frequency: 'daily',
    message: 'RAG system completely offline!\n' +
             'Pattern search and learning unavailable.\n' +
             'Auto-fix: npm run rag:reset && npm run rag:init'
  },

  slow_rag_queries: {
    severity: 'info',
    threshold: 1000,  // >1s avg query time
    message: 'RAG queries slow: {latency}ms (target: <500ms)\n' +
             'Performance may be impacted.'
  }
};
```

---

### 6. Dependencies

```typescript
const DEPENDENCY_ALERTS = {
  critical_vulnerabilities: {
    severity: 'critical',
    threshold: 1,  // ANY critical vulnerability
    message: 'CRITICAL security vulnerabilities detected!\n' +
             'Count: {count}\n' +
             'Auto-fix available: npm audit fix\n' +
             'Details: npm audit'
  },

  high_vulnerabilities: {
    severity: 'alert',
    threshold: 1,  // ANY high vulnerability
    message: 'High security vulnerabilities detected\n' +
             'Count: {count}\n' +
             'Auto-fix: npm audit fix (may require --force)'
  },

  moderate_vulnerabilities: {
    severity: 'warning',
    threshold: 3,  // >2 moderate vulnerabilities
    message: 'Multiple moderate vulnerabilities: {count}\n' +
             'Consider running: npm audit fix'
  },

  outdated_dependencies: {
    severity: 'info',
    frequency: 'weekly',
    threshold: 90,  // >90 days since update
    message: 'Dependencies not updated in {days} days\n' +
             'Consider reviewing: npm outdated'
  }
};
```

---

### 7. Context Detection

```typescript
const CONTEXT_ALERTS = {
  context_unknown: {
    severity: 'critical',
    frequency: 'daily',
    message: 'Unable to detect context (FRAMEWORK vs PROJECT)\n' +
             'Framework may behave incorrectly.\n' +
             'Check package.json for @versatil/sdlc-framework dependency.'
  },

  isolation_broken: {
    severity: 'critical',
    frequency: 'daily',
    message: 'Context isolation broken!\n' +
             'Framework source files detected in user project.\n' +
             'Manual fix required - see docs/TROUBLESHOOTING.md'
  },

  config_missing: {
    severity: 'warning',
    frequency: 'weekly',
    message: 'Configuration file missing (CLAUDE.md)\n' +
             'Using framework defaults.\n' +
             'Suggested: Create CLAUDE.md for customization.'
  }
};
```

---

## Notification Templates

### Daily Digest (Email/Slack)

```markdown
# VERSATIL Framework Health - Daily Digest

**Date**: {date}
**Overall Health**: {health_score}/100 ({status})
**Trend**: {trend} (7-day avg: {avg_7d}, 30-day avg: {avg_30d})

## Component Status

- Version: {version_status} ({version_health}/100)
- Installation: {install_status} ({install_health}/100)
- Agents: {agent_status} ({agent_health}/100)
- MCP: {mcp_status} ({mcp_health}/100)
- RAG: {rag_status} ({rag_health}/100)
- Dependencies: {dep_status} ({dep_health}/100)
- Context: {context_status} ({context_health}/100)

## Issues Detected

{critical_issues_list}
{warnings_list}

## Auto-Fixes Applied

{auto_fixes_list}

## Recommended Actions

{recommendations_list}

---
View full report: npx versatil doctor
Troubleshooting: docs/TROUBLESHOOTING.md
```

---

### Instant Alert (Critical Issues)

```markdown
🚨 VERSATIL Framework Alert - CRITICAL

**Issue**: {issue_type}
**Severity**: CRITICAL
**Detected**: {timestamp}
**Health Impact**: {health_before} → {health_after} (-{delta} points)

**Description**:
{issue_description}

**Immediate Action Required**:
{action_steps}

**Auto-Fix Available**: {auto_fix_available ? 'Yes' : 'No'}
{auto_fix_available ? `Run: ${auto_fix_command}` : ''}

---
Full diagnostics: npx versatil doctor
Help: {help_url}
```

---

## Notification Channels

### In-Session (Claude)

```typescript
// Show in conversation context
const notification = {
  type: 'health_alert',
  severity: 'warning',
  message: 'Framework health degraded to 68/100',
  action: 'Run /coherence --fix to attempt auto-remediation',
  dismissible: true
};
```

**Frequency**: Real-time during session

---

### CLI Output

```bash
⚠️  WARNING: Framework health degraded

    Overall Health: 68/100 (degraded)
    Critical Issues: 1
    Warnings: 4

    Run for details: npx versatil doctor
    Auto-fix: npx versatil doctor --fix
```

**Frequency**: On command execution

---

### System Notifications (OS)

```typescript
// macOS/Linux/Windows system notifications
const systemNotif = {
  title: 'VERSATIL Framework Alert',
  message: 'Critical security vulnerabilities detected',
  urgency: 'critical',
  sound: true,
  actions: [
    { label: 'Fix Now', command: 'npm audit fix' },
    { label: 'View Details', command: 'npx versatil doctor' }
  ]
};
```

**Frequency**: Critical issues only

---

### Log Files

```typescript
// ~/.versatil/logs/guardian/health-alerts.log
{
  timestamp: '2025-10-28T10:30:00Z',
  severity: 'critical',
  alert_type: 'critical_vulnerabilities',
  health_before: 85,
  health_after: 0,
  details: {
    vulnerability_count: 2,
    packages_affected: ['axios', 'lodash']
  },
  auto_fix_attempted: true,
  auto_fix_success: true
}
```

**Frequency**: All alerts logged

---

## Alert Suppression Rules

```typescript
const SUPPRESSION_RULES = {
  // Don't alert on same issue repeatedly
  duplicate_window_hours: 24,

  // Don't alert if health is improving
  suppress_if_improving: true,

  // Don't alert during maintenance windows
  maintenance_hours: [0, 1, 2, 3, 4, 5],  // 12am-6am

  // User can silence specific alert types
  user_silenced: ['info', 'outdated_dependencies']
};
```

---

## Best Practices

1. **Alert fatigue prevention** - Don't spam user with notifications
2. **Actionable alerts only** - Every alert should have clear next steps
3. **Severity-appropriate urgency** - Critical = immediate, info = optional
4. **Respect user preferences** - Allow customization and silencing
5. **Consolidate related alerts** - Group similar issues together
6. **Provide context** - Explain WHY something is an issue
7. **Include auto-fix info** - If available, tell user how to fix
8. **Log everything** - Even suppressed alerts go to logs for debugging
