# VERSATIL MCP Server - Usage Examples

**Version**: 6.1.0
**Last Updated**: October 9, 2025
**MCP SDK**: @modelcontextprotocol/sdk@1.19.1

This document provides working examples for using the VERSATIL SDLC Framework's Model Context Protocol (MCP) server with Claude and other AI assistants.

---

## Quick Start

### Installation

```bash
# Install VERSATIL framework
npm install -g versatil-sdlc-framework

# Start MCP server
versatil-mcp start

# Or use with Claude Desktop (add to config)
{
  "mcpServers": {
    "versatil": {
      "command": "node",
      "args": ["/path/to/versatil-mcp-server.js"]
    }
  }
}
```

**First-Time Users**: When you first connect the MCP server to Claude Desktop, it will automatically configure itself. Run the `versatil_welcome_setup` tool to verify your setup and see available features.

---

## Example 0: Welcome & Setup (First-Time Users)

### Use Case
Check onboarding status, verify configuration, and get setup instructions for VERSATIL MCP.

### MCP Tool Call

```json
{
  "tool": "versatil_welcome_setup",
  "arguments": {
    "showDetails": true
  }
}
```

### Expected Response

```json
{
  "setupComplete": true,
  "frameworkHome": "/Users/username/.versatil",
  "instructions": "✅ VERSATIL MCP Server is fully configured!\n\n📁 Configuration location: /Users/username/.versatil\n\n🚀 Getting Started:\n  • All MCP tools are ready to use\n  • Agents will activate automatically based on your requests\n  • Framework works locally without external dependencies\n\n📖 Learn More:\n  • Tool examples: Use any versatil_* tool from Claude\n  • Resources: Access versatil:// URIs for real-time framework data\n  • Prompts: Generate AI-powered code analysis prompts\n\n🔧 Optional Configuration:\n  • Edit preferences: /Users/username/.versatil/preferences.json\n  • Add credentials: /Users/username/.versatil/.env\n  • Install full framework: npm install -g @versatil/sdlc-framework",
  "details": {
    "hasPreferences": true,
    "hasEnvFile": true,
    "missingComponents": [],
    "mcpPrimitives": {
      "tools": 15,
      "resources": 5,
      "prompts": 5
    },
    "operaAgents": [
      { "id": "enhanced-maria", "name": "Maria-QA", "specialization": "Quality assurance and testing" },
      { "id": "enhanced-james", "name": "James-Frontend", "specialization": "UI/UX development" },
      { "id": "enhanced-marcus", "name": "Marcus-Backend", "specialization": "API and backend development" },
      { "id": "alex-ba", "name": "Alex-BA", "specialization": "Business analysis and requirements" },
      { "id": "sarah-pm", "name": "Sarah-PM", "specialization": "Project coordination" },
      { "id": "dr-ai-ml", "name": "Dr.AI-ML", "specialization": "AI/ML development" }
    ]
  }
}
```

### Claude Prompt Example

```
I just installed VERSATIL MCP. Can you run versatil_welcome_setup to show me
my configuration status and help me get started?
```

**When to Use**:
- First-time installation verification
- Checking if configuration is complete
- Getting setup instructions
- Viewing available OPERA agents
- Confirming MCP primitives count (15 tools, 5 resources, 5 prompts)

---

## Example 1: Agent Activation for Code Analysis

### Use Case
Activate Enhanced Maria (QA Agent) to analyze a test file and provide coverage recommendations.

### MCP Tool Call

```json
{
  "tool": "versatil_activate_agent",
  "arguments": {
    "agentId": "enhanced-maria",
    "filePath": "src/components/LoginForm.test.tsx",
    "trigger": "test_review"
  }
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "agentId": "enhanced-maria",
    "agentName": "Enhanced Maria (QA Agent)",
    "status": "activated",
    "message": "Test file analysis complete",
    "suggestions": [
      "Add edge case tests for empty username/password",
      "Increase coverage for error handling paths",
      "Add accessibility tests for form validation"
    ],
    "analysis": {
      "testCoverage": 78.5,
      "missingTests": 12,
      "criticalPaths": 3,
      "qualityScore": 82
    }
  }
}
```

### Claude Prompt Example

```
Use the versatil_activate_agent tool to have Enhanced Maria review
the LoginForm test file at src/components/LoginForm.test.tsx.
I need recommendations for improving test coverage.
```

---

## Example 2: SDLC Phase Transition with Quality Gates

### Use Case
Transition from Development to Testing phase with automatic quality gate validation.

### MCP Tool Call

```json
{
  "tool": "versatil_orchestrate_phase",
  "arguments": {
    "fromPhase": "development",
    "toPhase": "testing",
    "context": {
      "feature": "user-authentication",
      "strictMode": true
    }
  }
}
```

### Expected Response

```json
{
  "success": true,
  "fromPhase": "development",
  "toPhase": "testing",
  "result": {
    "currentPhase": "testing",
    "qualityScore": 89.3,
    "activatedAgents": [
      "enhanced-maria",
      "enhanced-james",
      "enhanced-marcus"
    ],
    "recommendations": [
      "Run full test suite before deployment",
      "Validate accessibility compliance",
      "Review security scan results"
    ],
    "blockers": [],
    "nextActions": [
      "Execute comprehensive test suite",
      "Perform visual regression testing",
      "Generate test coverage report"
    ]
  }
}
```

### Claude Prompt Example

```
I've completed development on the user authentication feature.
Use versatil_orchestrate_phase to transition from development to
testing phase with strict quality gates enabled.
```

---

## Example 3: Comprehensive Health Check

### Use Case
Perform a comprehensive health check on the VERSATIL framework and all agents.

### MCP Tool Call

```json
{
  "tool": "versatil_health_check",
  "arguments": {
    "comprehensive": true
  }
}
```

### Expected Response

```json
{
  "status": "healthy",
  "components": {
    "agents": true,
    "orchestrator": true,
    "performance": true,
    "enhanced-maria": "healthy",
    "enhanced-james": "healthy",
    "enhanced-marcus": "healthy",
    "sarah-pm": "healthy",
    "alex-ba": "healthy",
    "dr-ai-ml": "healthy"
  },
  "timestamp": "2025-10-09T14:30:00Z"
}
```

### Claude Prompt Example

```
Use versatil_health_check with comprehensive mode enabled to
verify all framework components are operational.
```

---

## Example 4: Running Test Suite with Chrome MCP

### Use Case
Execute comprehensive testing including visual regression tests using real Chrome browser.

### MCP Tool Call

```json
{
  "tool": "versatil_run_tests",
  "arguments": {
    "testType": "e2e",
    "coverage": true,
    "chromeMCP": true
  }
}
```

### Expected Response

```json
{
  "success": true,
  "testType": "e2e",
  "result": {
    "passed": 124,
    "failed": 2,
    "skipped": 0,
    "coverage": {
      "statements": 85.7,
      "branches": 82.3,
      "functions": 89.1,
      "lines": 86.2
    },
    "duration": "45.3s",
    "browser": "chrome",
    "visualRegressions": 0
  }
}
```

### Claude Prompt Example

```
Use versatil_run_tests to execute end-to-end tests with Chrome MCP
browser automation and full coverage reporting enabled.
```

---

## Example 5: Architecture Analysis

### Use Case
Analyze codebase architecture using Architecture Dan agent for SOLID principles and design patterns.

### MCP Tool Call

```json
{
  "tool": "versatil_analyze_architecture",
  "arguments": {
    "filePath": "src/services/AuthService.ts",
    "analysisType": "solid-principles",
    "generateADR": true
  }
}
```

### Expected Response

```json
{
  "success": true,
  "filePath": "src/services/AuthService.ts",
  "analysisType": "solid-principles",
  "result": {
    "score": 78,
    "violations": [
      {
        "principle": "Single Responsibility",
        "severity": "medium",
        "description": "AuthService handles both authentication and session management",
        "suggestion": "Extract SessionManager as separate service"
      }
    ],
    "patterns": ["Singleton", "Factory Method"],
    "adrGenerated": true,
    "adrPath": "docs/adr/0042-auth-service-refactoring.md"
  }
}
```

### Claude Prompt Example

```
Use versatil_analyze_architecture to review AuthService.ts for
SOLID principles compliance and generate an Architecture Decision
Record for any recommended refactoring.
```

---

## Example 6: Deployment Management

### Use Case
Deploy to staging environment using blue-green deployment strategy.

### MCP Tool Call

```json
{
  "tool": "versatil_manage_deployment",
  "arguments": {
    "action": "deploy",
    "environment": "staging",
    "strategy": "blue-green"
  }
}
```

### Expected Response

```json
{
  "success": true,
  "action": "deploy",
  "environment": "staging",
  "result": {
    "status": "completed",
    "strategy": "blue-green",
    "stages": [
      {
        "name": "pre-deployment-validation",
        "status": "passed",
        "duration": "15s"
      },
      {
        "name": "blue-environment-deploy",
        "status": "success",
        "duration": "2m 30s"
      },
      {
        "name": "smoke-tests",
        "status": "passed",
        "duration": "45s"
      },
      {
        "name": "traffic-switch",
        "status": "success",
        "duration": "5s"
      }
    ],
    "deploymentUrl": "https://staging.versatil-app.com",
    "rollbackAvailable": true
  }
}
```

### Claude Prompt Example

```
⚠️ DESTRUCTIVE OPERATION - Use versatil_manage_deployment to deploy
to staging environment using blue-green strategy. Ensure all quality
gates have passed before proceeding.
```

---

## Example 7: Opera Goal Management

### Use Case
Set an autonomous development goal for Opera orchestrator to implement a new feature.

### MCP Tool Call

```json
{
  "tool": "opera_set_goal",
  "arguments": {
    "type": "feature",
    "description": "Implement real-time notification system with WebSocket support",
    "priority": "high",
    "constraints": [
      "Must support 10,000 concurrent connections",
      "Sub-100ms latency requirement",
      "Redis-backed message queue"
    ],
    "deadline": "2025-10-15T23:59:59Z",
    "autoExecute": false
  }
}
```

### Expected Response

```json
{
  "success": true,
  "goalId": "goal-1728485930-k3jf92k",
  "goal": {
    "id": "goal-1728485930-k3jf92k",
    "type": "feature",
    "description": "Implement real-time notification system with WebSocket support",
    "priority": "high",
    "constraints": [
      "Must support 10,000 concurrent connections",
      "Sub-100ms latency requirement",
      "Redis-backed message queue"
    ],
    "deadline": "2025-10-15T23:59:59Z",
    "status": "pending",
    "createdAt": "2025-10-09T14:45:30Z",
    "autoExecute": false
  },
  "message": "Goal \"Implement real-time notification system with WebSocket support\" created successfully",
  "nextSteps": "Use opera_execute_goal to start execution"
}
```

### Claude Prompt Example

```
Use opera_set_goal to create a high-priority feature goal for
implementing a real-time notification system with WebSocket support,
Redis message queue, and sub-100ms latency requirements.
```

---

## Example 8: Multi-Agent Collaboration Workflow

### Use Case
Complete workflow demonstrating multiple agents working together on a feature.

### Step 1: Activate Alex-BA for Requirements Analysis

```json
{
  "tool": "versatil_activate_agent",
  "arguments": {
    "agentId": "alex-ba",
    "filePath": "docs/requirements/user-authentication.md",
    "trigger": "requirements_analysis"
  }
}
```

### Step 2: Get Marcus-Backend to Implement API

```json
{
  "tool": "versatil_activate_agent",
  "arguments": {
    "agentId": "enhanced-marcus",
    "filePath": "src/api/auth/login.ts",
    "content": "// Requirements from Alex-BA: JWT auth, OWASP compliance",
    "trigger": "api_implementation"
  }
}
```

### Step 3: Get James-Frontend to Build UI

```json
{
  "tool": "versatil_activate_agent",
  "arguments": {
    "agentId": "enhanced-james",
    "filePath": "src/components/LoginForm.tsx",
    "trigger": "ui_implementation"
  }
}
```

### Step 4: Maria-QA Validates Everything

```json
{
  "tool": "versatil_run_tests",
  "arguments": {
    "testType": "all",
    "coverage": true,
    "chromeMCP": true
  }
}
```

### Claude Prompt Example

```
Let's build a user authentication feature. First, use versatil_activate_agent
with alex-ba to analyze requirements, then enhanced-marcus for API implementation,
enhanced-james for UI, and finally versatil_run_tests with maria-qa to validate
everything with full test coverage.
```

---

## Example 9: Emergency Response Protocol

### Use Case
Trigger emergency protocol for critical production incident.

### MCP Tool Call

```json
{
  "tool": "versatil_emergency_protocol",
  "arguments": {
    "severity": "critical",
    "description": "Database connection pool exhausted - production API down",
    "component": "database-connection-manager"
  }
}
```

### Expected Response

```json
{
  "success": true,
  "severity": "critical",
  "response": {
    "protocolActivated": true,
    "incidentId": "INC-20251009-001",
    "activatedAgents": [
      "enhanced-maria",
      "enhanced-marcus",
      "deployment-orchestrator",
      "sarah-pm"
    ],
    "immediateActions": [
      "Scaling database connection pool to 200 connections",
      "Enabling connection pooling circuit breaker",
      "Deploying hotfix branch to production",
      "Notifying stakeholders via Sarah-PM"
    ],
    "estimatedResolutionTime": "5-10 minutes",
    "rollbackAvailable": true
  },
  "message": "Emergency protocol activated"
}
```

### Claude Prompt Example

```
⚠️ CRITICAL EMERGENCY - Use versatil_emergency_protocol for severity
"critical" - our production API is down due to database connection pool
exhaustion in the database-connection-manager component. Immediate action required.
```

---

## Example 10: Adaptive Insights Generation

### Use Case
Get AI-powered insights and recommendations based on project patterns learned over time.

### MCP Tool Call

```json
{
  "tool": "versatil_adaptive_insights",
  "arguments": {
    "agentId": "enhanced-maria",
    "timeRange": "week",
    "includeRecommendations": true
  }
}
```

### Expected Response

```json
{
  "success": true,
  "insights": {
    "agent": "enhanced-maria",
    "timeRange": "week",
    "patterns": [
      {
        "pattern": "Test failures occur 3x more on Fridays",
        "confidence": 0.89,
        "recommendation": "Add pre-Friday test validation gate"
      },
      {
        "pattern": "Frontend components with >300 LOC have 45% lower test coverage",
        "confidence": 0.94,
        "recommendation": "Enforce component size limits in quality gates"
      },
      {
        "pattern": "API endpoints using Redis cache have 78% faster response times",
        "confidence": 0.97,
        "recommendation": "Expand Redis caching to remaining endpoints"
      }
    ],
    "performanceTrends": {
      "testCoverage": "+12%",
      "buildTime": "-23%",
      "qualityScore": "+8%"
    }
  }
}
```

### Claude Prompt Example

```
Use versatil_adaptive_insights to analyze patterns from the past week
and provide AI-powered recommendations for improving our development process.
```

---

## MCP Resources Examples

### Example 11: Reading Agent Status Resource

### Use Case
Query real-time status and health information for a specific OPERA agent using MCP Resources.

### MCP Resource Read

```json
{
  "resource": "read",
  "uri": "versatil://agent-status/enhanced-maria"
}
```

### Expected Response

```json
{
  "contents": [{
    "uri": "versatil://agent-status/enhanced-maria",
    "text": "{\n  \"agentId\": \"enhanced-maria\",\n  \"agentName\": \"Enhanced Maria (QA Agent)\",\n  \"status\": \"healthy\",\n  \"uptime\": 3600,\n  \"capabilities\": [\"testing\", \"quality-gates\", \"coverage-analysis\"],\n  \"lastActivity\": \"2025-10-10T14:30:00Z\",\n  \"metrics\": {\n    \"tasksCompleted\": 145,\n    \"averageResponseTime\": 2100,\n    \"successRate\": 98.4\n  }\n}",
    "mimeType": "application/json"
  }]
}
```

### Claude Prompt Example

```
Read the resource at versatil://agent-status/enhanced-maria to check
if Maria-QA is healthy and see her recent performance metrics.
```

---

### Example 12: Reading Quality Metrics Resource

### Use Case
Retrieve current project quality metrics including test coverage and code health.

### MCP Resource Read

```json
{
  "resource": "read",
  "uri": "versatil://quality-metrics"
}
```

### Expected Response

```json
{
  "contents": [{
    "uri": "versatil://quality-metrics",
    "text": "{\n  \"timestamp\": \"2025-10-10T14:30:00Z\",\n  \"testCoverage\": {\n    \"statements\": 85.7,\n    \"branches\": 82.3,\n    \"functions\": 89.1,\n    \"lines\": 86.2,\n    \"target\": 80,\n    \"status\": \"passing\"\n  },\n  \"qualityScore\": 89.3,\n  \"codeHealth\": {\n    \"maintainability\": \"A\",\n    \"complexity\": \"B+\",\n    \"duplication\": \"< 3%\",\n    \"technicalDebt\": \"low\"\n  }\n}",
    "mimeType": "application/json"
  }]
}
```

### Claude Prompt Example

```
Read versatil://quality-metrics to see our current test coverage
and code health status. Are we meeting our 80% coverage target?
```

---

### Example 13: Reading SDLC Phase Resource

### Use Case
Check current SDLC phase and transition history to understand project state.

### MCP Resource Read

```json
{
  "resource": "read",
  "uri": "versatil://sdlc-phase"
}
```

### Expected Response

```json
{
  "contents": [{
    "uri": "versatil://sdlc-phase",
    "text": "{\n  \"currentPhase\": \"development\",\n  \"phaseProgress\": 65,\n  \"nextPhase\": \"testing\",\n  \"transitionHistory\": [\n    {\"from\": \"requirements\", \"to\": \"development\", \"timestamp\": \"2025-10-10T12:00:00Z\"}\n  ],\n  \"flywheelMetrics\": {\n    \"cycleEfficiency\": 91.3,\n    \"velocityTrend\": \"+12%\",\n    \"qualityGatesPassed\": 15\n  }\n}",
    "mimeType": "application/json"
  }]
}
```

### Claude Prompt Example

```
Read versatil://sdlc-phase to understand what development phase we're
currently in and when we last transitioned. What's our flywheel efficiency?
```

---

## MCP Prompts Examples

### Example 14: Using Code Analysis Prompt

### Use Case
Generate a comprehensive code analysis prompt for security review.

### MCP Prompt Call

```json
{
  "prompt": "get",
  "name": "analyze-code",
  "arguments": {
    "filePath": "src/api/auth/login.ts",
    "analysisType": "security"
  }
}
```

### Expected Response

```json
{
  "description": "Code analysis prompt for security analysis of src/api/auth/login.ts",
  "messages": [{
    "role": "user",
    "content": {
      "type": "text",
      "text": "Conduct a thorough security audit of src/api/auth/login.ts. Analyze for:\n- OWASP Top 10 vulnerabilities\n- Input validation and sanitization\n- Authentication and authorization issues\n- Data exposure risks\n- Cryptographic weaknesses\n- Dependency vulnerabilities\n\nProvide severity ratings and remediation steps for each finding."
    }
  }]
}
```

### Claude Prompt Example

```
Get the analyze-code prompt for src/api/auth/login.ts with security
analysis type. Then use that prompt to analyze the file.
```

---

### Example 15: Using Test Generation Prompt

### Use Case
Generate comprehensive test creation prompt for E2E testing.

### MCP Prompt Call

```json
{
  "prompt": "get",
  "name": "test-generation",
  "arguments": {
    "filePath": "src/components/LoginForm.tsx",
    "testType": "e2e"
  }
}
```

### Expected Response

```json
{
  "description": "Test generation prompt for e2e tests for src/components/LoginForm.tsx",
  "messages": [{
    "role": "user",
    "content": {
      "type": "text",
      "text": "Generate end-to-end tests for src/components/LoginForm.tsx using browser automation. Test:\n- Complete user workflows from start to finish\n- Cross-browser compatibility (Chrome, Firefox, Safari)\n- Responsive design across device sizes\n- Form validation and submission\n- Error handling and user feedback\n- Accessibility compliance (WCAG 2.1 AA)\n\nProvide Playwright/Cypress test specs with page objects and helpers."
    }
  }]
}
```

### Claude Prompt Example

```
Get the test-generation prompt for LoginForm with e2e test type.
Then generate complete E2E tests following the prompt guidelines.
```

---

### Example 16: Using Performance Optimization Prompt

### Use Case
Generate optimization recommendations for database query performance.

### MCP Prompt Call

```json
{
  "prompt": "get",
  "name": "performance-optimization",
  "arguments": {
    "component": "UserService",
    "metric": "database-queries"
  }
}
```

### Expected Response

```json
{
  "description": "Performance optimization prompt for database-queries in UserService",
  "messages": [{
    "role": "user",
    "content": {
      "type": "text",
      "text": "Optimize database queries for UserService. Improve:\n- N+1 query problems (use eager loading, joins)\n- Missing indexes (analyze slow query logs)\n- Query complexity reduction\n- Connection pooling efficiency\n- Read replicas for heavy read workloads\n- Query result caching\n\nProvide query execution plans with optimization strategies."
    }
  }]
}
```

### Claude Prompt Example

```
Get the performance-optimization prompt for UserService targeting
database-queries metric. Then apply those optimizations to our code.
```

---

## Advanced Usage

### Chaining Multiple Tools

```
1. Use opera_analyze_project with depth "comprehensive"
2. Based on analysis, use versatil_activate_agent for each recommended agent
3. Use versatil_run_quality_gates to validate all changes
4. Use versatil_get_status to confirm framework health
```

### Error Handling

All tools return `success: boolean` field. Check before processing results:

```javascript
const response = await mcpClient.executeTool('versatil_activate_agent', { ... });

if (!response.success) {
  console.error('Tool execution failed:', response.error);
  // Handle error
} else {
  console.log('Success:', response.data);
  // Process results
}
```

---

## Common Workflows

### 1. New Feature Development
```
opera_set_goal → versatil_activate_agent (alex-ba) →
versatil_activate_agent (marcus/james) → versatil_run_tests →
versatil_orchestrate_phase (to testing)
```

### 2. Bug Fix Pipeline
```
versatil_emergency_protocol → versatil_activate_agent (maria) →
versatil_run_tests → versatil_manage_deployment (hotfix)
```

### 3. Code Review Workflow
```
versatil_activate_agent (maria) → versatil_analyze_architecture →
versatil_run_quality_gates → versatil_get_status
```

### 4. Performance Optimization
```
versatil_adaptive_insights → opera_analyze_project →
versatil_activate_agent (dr-ai-ml) → versatil_run_tests (performance)
```

---

## Troubleshooting

### Tool Not Found
```json
{
  "success": false,
  "error": "Tool versatil_activate_agent not found"
}
```
**Solution**: Verify MCP server is running: `versatil-mcp status`

### Agent Not Available
```json
{
  "success": false,
  "error": "Agent enhanced-maria not found"
}
```
**Solution**: Check agent registry: `versatil-agents list`

### Timeout Errors
**Solution**: Increase timeout in MCP client config or use `dryRun: true` for testing

---

## Resources

- **MCP Server Documentation**: [docs/MCP_INTEGRATION_GUIDE.md](./MCP_INTEGRATION_GUIDE.md)
- **Privacy Policy**: [docs/PRIVACY_POLICY.md](./PRIVACY_POLICY.md)
- **Agent Details**: [.claude/AGENTS.md](../.claude/AGENTS.md)
- **Framework Documentation**: [https://github.com/versatil-sdlc-framework](https://github.com/versatil-sdlc-framework)
- **Anthropic MCP Specification**: [https://spec.modelcontextprotocol.io](https://spec.modelcontextprotocol.io)

---

**Version History**:
- v6.1.0 (2025-10-09): Initial MCP examples documentation for Anthropic certification
