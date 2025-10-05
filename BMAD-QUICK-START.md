# OPERA UI/UX Testing Flywheel - Quick Start Guide

## 🚀 Start Using the Flywheel in 5 Minutes

### Prerequisites
```bash
# Ensure framework is built
npm run build

# Verify tests are working
npm run test:maria-qa
```

---

## 📋 5 MCP Tools for UI/UX Testing

### 1. **Trigger UI/UX Testing** (`opera_trigger_ui_test`)

**When to use**: After making changes to UI components, routes, styles, or configuration

**Parameters**:
- `filePath` (required): Path to the changed file
- `changeType` (required): Type of change - `component`, `route`, `style`, or `configuration`

**Example**:
```json
{
  "tool": "opera_trigger_ui_test",
  "parameters": {
    "filePath": "src/components/UserProfile.tsx",
    "changeType": "component"
  }
}
```

**Response**:
```json
{
  "success": true,
  "workflowId": "workflow-1727490123456",
  "result": {
    "qualityScore": 85,
    "agent": "enhanced-maria",
    "issues": 2,
    "recommendations": 3,
    "success": true,
    "nextSteps": ["Address medium priority issues for production readiness"]
  },
  "message": "UI/UX testing flywheel triggered for src/components/UserProfile.tsx (component)"
}
```

---

### 2. **Get Quality Metrics** (`opera_get_quality_metrics`)

**When to use**: Check current framework quality status, agent utilization, and recent workflows

**Parameters**:
- `includeHistory` (optional): Include recent workflow history
- `limit` (optional): Number of historical records to include

**Example**:
```json
{
  "tool": "opera_get_quality_metrics",
  "parameters": {
    "includeHistory": true,
    "limit": 5
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "overallScore": 85,
      "testCoverage": 78,
      "performanceScore": 90,
      "accessibilityScore": 95,
      "securityScore": 88,
      "visualRegressionStatus": "passing",
      "activeWorkflows": 1
    },
    "activeWorkflows": [...],
    "alerts": [...],
    "workflowHistory": [...]
  }
}
```

---

### 3. **Get Agent Status** (`opera_get_agent_status`)

**When to use**: Check if specific agents are available or see overall agent health

**Parameters**:
- `agentName` (optional): Specific agent name (`enhanced-maria`, `enhanced-james`, `enhanced-marcus`)

**Example (All Agents)**:
```json
{
  "tool": "opera_get_agent_status",
  "parameters": {}
}
```

**Example (Specific Agent)**:
```json
{
  "tool": "opera_get_agent_status",
  "parameters": {
    "agentName": "enhanced-maria"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "agentName": "enhanced-maria",
        "status": {
          "activeJobs": 1,
          "completedJobs": 45,
          "averageExecutionTime": 1200,
          "successRate": 96
        },
        "isActive": true
      },
      {
        "agentName": "enhanced-james",
        "status": {
          "activeJobs": 0,
          "completedJobs": 38,
          "averageExecutionTime": 800,
          "successRate": 94
        },
        "isActive": false
      }
    ],
    "totalActiveJobs": 1
  }
}
```

---

### 4. **Generate Quality Report** (`opera_generate_quality_report`)

**When to use**: Create comprehensive quality reports for stakeholders or review sessions

**Parameters**:
- `reportType` (optional): `summary`, `detailed`, or `trends` (default: `summary`)
- `timeRange` (optional): `1h`, `24h`, `7d`, or `30d` (default: `24h`)

**Example**:
```json
{
  "tool": "opera_generate_quality_report",
  "parameters": {
    "reportType": "detailed",
    "timeRange": "24h"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "reportType": "detailed",
    "timeRange": "24h",
    "generatedAt": "2025-09-28T02:00:00.000Z",
    "metrics": {...},
    "summary": {
      "overallHealth": "good",
      "criticalIssues": 0,
      "recommendationsCount": 8,
      "workflowsExecuted": 12
    },
    "recommendations": [
      "Focus on addressing critical and high-priority issues",
      "Optimize performance with bundle analysis and Core Web Vitals"
    ],
    "trends": {
      "qualityScore": { "trend": "improving", "change": "+5%", "period": "7d" }
    }
  }
}
```

---

### 5. **Execute Quality Check** (`opera_execute_quality_check`)

**When to use**: Run immediate quality validation on current codebase state

**Parameters**:
- `scope` (optional): `full`, `changed-files`, or `critical-paths` (default: `changed-files`)
- `includePerformance` (optional): Include performance testing (default: false)
- `includeAccessibility` (optional): Include accessibility testing (default: false)

**Example**:
```json
{
  "tool": "opera_execute_quality_check",
  "parameters": {
    "scope": "changed-files",
    "includePerformance": true,
    "includeAccessibility": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scope": "changed-files",
    "executedAt": "2025-09-28T02:30:00.000Z",
    "qualityScore": 87,
    "checks": {
      "performance": 92,
      "accessibility": 96,
      "security": 88,
      "codeQuality": 84
    },
    "issues": [
      {
        "type": "medium",
        "category": "performance",
        "description": "Bundle size increased by 12KB",
        "recommendation": "Consider lazy loading for non-critical components"
      }
    ]
  }
}
```

---

## 🎯 Common Use Cases

### Use Case 1: After Component Update
```bash
# 1. Trigger testing for component change
opera_trigger_ui_test {
  "filePath": "src/components/Button.tsx",
  "changeType": "component"
}

# 2. Check results
opera_get_quality_metrics {
  "includeHistory": true,
  "limit": 1
}

# 3. If issues found, generate detailed report
opera_generate_quality_report {
  "reportType": "detailed",
  "timeRange": "1h"
}
```

### Use Case 2: Pre-Deployment Check
```bash
# 1. Execute comprehensive quality check
opera_execute_quality_check {
  "scope": "full",
  "includePerformance": true,
  "includeAccessibility": true
}

# 2. Check agent availability
opera_get_agent_status {}

# 3. Generate deployment report
opera_generate_quality_report {
  "reportType": "summary",
  "timeRange": "24h"
}
```

### Use Case 3: Monitoring Agent Health
```bash
# 1. Check specific agent status
opera_get_agent_status {
  "agentName": "enhanced-maria"
}

# 2. Get current metrics
opera_get_quality_metrics {
  "includeHistory": false
}

# 3. View trends
opera_generate_quality_report {
  "reportType": "trends",
  "timeRange": "7d"
}
```

### Use Case 4: Style/CSS Changes
```bash
# 1. Trigger visual regression testing
opera_trigger_ui_test {
  "filePath": "src/styles/theme.css",
  "changeType": "style"
}

# 2. Monitor visual regression status
opera_get_quality_metrics {
  "includeHistory": false
}
# Check: visualRegressionStatus should be "passing"
```

### Use Case 5: Route Changes
```bash
# 1. Trigger E2E testing for route changes
opera_trigger_ui_test {
  "filePath": "src/routes/user-profile.ts",
  "changeType": "route"
}

# 2. Wait for workflow completion (async)
# 3. Check quality metrics
opera_get_quality_metrics {}
```

---

## 💡 Best Practices

### 1. **Always Check Agent Status Before Triggering Tests**
```bash
# Good practice
opera_get_agent_status {} # Check availability first
opera_trigger_ui_test {...} # Then trigger

# Bad practice
opera_trigger_ui_test {...} # Direct trigger without checking
```

### 2. **Use Appropriate Change Types**
- `component`: React/Vue components, UI widgets
- `route`: Navigation routes, URL patterns
- `style`: CSS/SCSS changes, theme updates
- `configuration`: Config files, environment variables

### 3. **Monitor Quality Scores**
- **90-100**: Excellent - Ready for production
- **80-89**: Good - Minor improvements needed
- **70-79**: Fair - Address issues before deployment
- **<70**: Poor - Significant improvements required

### 4. **Generate Reports Regularly**
```bash
# Daily summary
opera_generate_quality_report {
  "reportType": "summary",
  "timeRange": "24h"
}

# Weekly trends
opera_generate_quality_report {
  "reportType": "trends",
  "timeRange": "7d"
}
```

### 5. **Quality Gate Thresholds**
The flywheel enforces these thresholds:
- Performance: **90+**
- Accessibility: **95+** (WCAG 2.1 AA)
- Visual Regression: **95+**
- Security: **90+** (OWASP Top 10)

---

## 🔧 Configuration

### Dashboard Configuration
Located in `src/dashboard/opera-quality-dashboard.ts`:

```typescript
const dashboard = new OPERAQualityDashboard({
  refreshInterval: 5000, // 5 seconds
  enableRealTimeUpdates: true,
  qualityThresholds: {
    overall: 80,
    performance: 90,
    accessibility: 95,
    security: 90
  },
  alertSettings: {
    criticalIssues: true,
    performanceDegradation: true,
    testFailures: true
  }
});
```

### MCP Server Integration
The OPERA tools are automatically registered when the MCP server starts:

```bash
# Start MCP server with OPERA integration
npm run build && node dist/index.js
```

---

## 📊 Real-Time Events

The dashboard emits real-time events that you can listen to:

### Event: `workflowComplete`
```typescript
dashboard.on('workflowComplete', (result) => {
  console.log('Workflow completed:', {
    agent: result.agent,
    qualityScore: result.qualityScore,
    success: result.success
  });
});
```

### Event: `metricsUpdate`
```typescript
dashboard.on('metricsUpdate', (metrics) => {
  console.log('Metrics updated:', {
    overallScore: metrics.overallScore,
    activeWorkflows: metrics.activeWorkflows
  });
});
```

### Event: `alert`
```typescript
dashboard.on('alert', (alert) => {
  console.log('Quality alert:', {
    type: alert.type,
    message: alert.message,
    severity: alert.severity
  });
});
```

---

## 🧪 Testing the Flywheel

### Manual Testing
```bash
# 1. Build the framework
npm run build

# 2. Run unit tests
npm run test:unit

# 3. Run e2e tests
npm run test:e2e

# 4. Run full test suite
npm run test:maria-qa
```

### Automated Testing
```bash
# Run OPERA-specific tests
npm run test:opera

# Run complete validation
npm run validate
```

---

## 🆘 Troubleshooting

### Issue: "OPERA MCP Integration is not active"
**Solution**: Ensure the MCP server has started properly
```bash
npm run build
node dist/index.js
# Look for: "🎯 OPERA Quality Dashboard integrated and active"
```

### Issue: Low Quality Scores
**Solution**: Check specific metrics and address issues
```bash
opera_get_quality_metrics {}
# Review: performanceScore, accessibilityScore, securityScore
```

### Issue: Agent Not Responding
**Solution**: Check agent status
```bash
opera_get_agent_status { "agentName": "enhanced-maria" }
# If activeJobs > 5, agent may be overloaded
```

---

## 📚 Additional Resources

- **Full Documentation**: `OPERA-FLYWHEEL-COMPLETE.md`
- **Integration Report**: `.versatil/INTEGRATION_REPORT.md`
- **VERSATIL v1.2.0 Guide**: `.versatil/MIGRATION_GUIDE.md`
- **Agent Registry**: Run `npm run show-agents`

---

**Quick Start Complete! 🚀**

You now have an operational UI/UX testing flywheel with real-time quality monitoring and intelligent agent orchestration.

Start by triggering your first test:
```bash
opera_trigger_ui_test {
  "filePath": "your-component.tsx",
  "changeType": "component"
}
```