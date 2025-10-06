# 🔌 VERSATIL Framework API Documentation

Complete API reference for the VERSATIL SDLC Framework.

## 📚 Table of Contents

- [Agent Dispatcher API](#agent-dispatcher-api)
- [MCP Integration API](#mcp-integration-api)
- [Context Validation API](#context-validation-api)
- [Quality Gates API](#quality-gates-api)
- [Configuration API](#configuration-api)
- [Examples](#examples)

## 🤖 Agent Dispatcher API

### `VERSATILAgentDispatcher`

Core class for managing agent activation and coordination.

```typescript
import { VERSATILAgentDispatcher } from 'versatil-sdlc-framework';

const dispatcher = new VERSATILAgentDispatcher();
```

#### Methods

##### `startMonitoring(projectPath: string): void`

Start file system monitoring for auto-agent activation.

```typescript
dispatcher.startMonitoring('/path/to/project');

// Events emitted:
// - 'agent-activated': When an agent is triggered
// - 'agent-completed': When an agent finishes work
// - 'context-needed': When clarification is required
```

##### `registerAgent(config: AgentTrigger): void`

Register a custom agent with the dispatcher.

```typescript
dispatcher.registerAgent({
  agent: 'CustomAgent',
  priority: 5,
  triggers: {
    filePatterns: ['*.custom'],
    keywords: ['custom', 'special'],
    actions: ['build', 'deploy'],
    dependencies: ['react'],
    errorPatterns: ['CustomError']
  },
  autoActivate: true,
  mcpTools: ['custom_mcp'],
  collaborators: ['Maria-QA']
});
```

##### `activateAgent(agentName: string, context: AgentActivationContext): Promise<AgentResponse>`

Manually activate a specific agent.

```typescript
const response = await dispatcher.activateAgent('Maria-QA', {
  trigger: mariaConfig,
  filePath: '/src/component.test.tsx',
  contextClarity: 'clear'
});

console.log(response.status); // 'activated' | 'clarification_needed' | 'completed'
```

##### `getAgentStatus(): Map<string, AgentStatus>`

Get current status of all registered agents.

```typescript
const status = dispatcher.getAgentStatus();
status.forEach((agentStatus, agentName) => {
  console.log(`${agentName}: ${agentStatus.state}`);
});
```

#### Events

```typescript
// Agent activation event
dispatcher.on('agent-activated', (event) => {
  console.log(`${event.agent} activated for ${event.trigger}`);
});

// Agent completion event
dispatcher.on('agent-completed', (event) => {
  console.log(`${event.agent} completed with status: ${event.status}`);
});

// Context clarification needed
dispatcher.on('context-needed', (event) => {
  console.log(`Clarification needed: ${event.clarifications.join(', ')}`);
});

// MCP tool activation
dispatcher.on('mcp-tool-activated', (event) => {
  console.log(`${event.tool} activated by ${event.agent}`);
});
```

## 🔧 MCP Integration API

### `MCPToolManager`

Manages MCP tool execution and integration.

```typescript
import { mcpToolManager } from 'versatil-sdlc-framework';
```

#### Methods

##### `executeMCPTool(tool: string, context: AgentActivationContext): Promise<MCPToolResult>`

Execute an MCP tool with given context.

```typescript
const result = await mcpToolManager.executeMCPTool('chrome_mcp', {
  trigger: { agent: 'Maria-QA' },
  filePath: '/src/Button.test.tsx',
  contextClarity: 'clear'
});

console.log(result.success); // true/false
console.log(result.data);    // Tool execution results
```

##### `registerTool(name: string, executor: MCPToolExecutor): void`

Register a custom MCP tool.

```typescript
mcpToolManager.registerTool('custom_mcp', {
  execute: async (context) => {
    // Custom tool implementation
    return {
      success: true,
      data: { message: 'Custom tool executed' },
      executionTime: Date.now() - startTime
    };
  }
});
```

##### `getSessionResults(): MCPToolResult[]`

Get execution results from all MCP tools.

```typescript
const results = mcpToolManager.getSessionResults();
results.forEach(result => {
  console.log(`${result.tool} by ${result.agent}: ${result.success}`);
});
```

##### `closeAllSessions(): Promise<void>`

Close all active MCP tool sessions.

```typescript
await mcpToolManager.closeAllSessions();
```

### Chrome MCP API

Specific API for Chrome MCP integration.

```typescript
import { ChromeMCP } from 'versatil-sdlc-framework/mcp';

const chromeMCP = new ChromeMCP();

// Navigate to URL
await chromeMCP.navigate('http://localhost:3000');

// Take screenshot
const screenshot = await chromeMCP.screenshot({ fullPage: true });

// Execute tests
const testResults = await chromeMCP.runTests({
  component: 'VERSSAIButton',
  testSuite: 'accessibility'
});

// Close session
await chromeMCP.close();
```

## 🧠 Context Validation API

### `EnhancedContextValidator`

Advanced context analysis and validation.

```typescript
import { enhancedContextValidator } from 'versatil-sdlc-framework';
```

#### Methods

##### `validateTaskContext(request: string): Promise<ContextAssessment>`

Validate and analyze task context clarity.

```typescript
const assessment = await enhancedContextValidator.validateTaskContext(
  "Fix the broken component"
);

console.log(assessment.overall); // 'clear' | 'ambiguous' | 'missing'
console.log(assessment.requiredClarifications); // Array of clarification questions
```

##### `generateClarifications(issues: ContextIssue[]): string[]`

Generate clarification questions for context issues.

```typescript
const clarifications = enhancedContextValidator.generateClarifications([
  {
    type: 'ambiguous_reference',
    severity: 'high',
    description: 'Unclear what "it" refers to',
    suggestion: 'Specify the component or file name'
  }
]);
```

##### `assessProjectContext(projectPath: string): Promise<ProjectContextAssessment>`

Analyze overall project context and structure.

```typescript
const projectContext = await enhancedContextValidator.assessProjectContext('/project');

console.log(projectContext.frameworks); // Detected frameworks
console.log(projectContext.patterns);   // Code patterns found
console.log(projectContext.suggestions); // Improvement suggestions
```

## 🛡️ Quality Gates API

### `QualityGateEnforcer`

Enforce quality standards and gates.

```typescript
import { qualityGateEnforcer } from 'versatil-sdlc-framework';
```

#### Methods

##### `enforceGate(gateName: string, context: any): Promise<QualityGateResult>`

Enforce a specific quality gate.

```typescript
const result = await qualityGateEnforcer.enforceGate('code-review', {
  filePath: '/src/component.tsx',
  changes: ['Added new prop', 'Fixed bug']
});

console.log(result.passed); // true/false
console.log(result.issues); // Array of quality issues
```

##### `runAllGates(context: any): Promise<QualityGateResults>`

Run all configured quality gates.

```typescript
const results = await qualityGateEnforcer.runAllGates({
  projectPath: '/project',
  changedFiles: ['src/component.tsx']
});

console.log(results.overall); // 'passed' | 'failed' | 'warning'
console.log(results.gateResults); // Individual gate results
```

##### `configureGate(gateName: string, config: QualityGateConfig): void`

Configure quality gate parameters.

```typescript
qualityGateEnforcer.configureGate('test-coverage', {
  threshold: 85,
  enforced: true,
  excludePatterns: ['*.test.ts']
});
```

## ⚙️ Configuration API

### `VERSATILConfig`

Framework configuration management.

```typescript
import { VERSATILConfig } from 'versatil-sdlc-framework';

const config = new VERSATILConfig();
```

#### Methods

##### `load(projectPath?: string): Promise<FrameworkConfig>`

Load configuration from project or default.

```typescript
const config = await VERSATILConfig.load('/project');
console.log(config.agents);    // Agent configurations
console.log(config.mcpTools);  // MCP tool settings
```

##### `save(config: FrameworkConfig, projectPath?: string): Promise<void>`

Save configuration to project.

```typescript
await VERSATILConfig.save({
  version: '1.0.0',
  agents: { /* agent configs */ },
  mcpTools: { /* mcp configs */ },
  qualityGates: { /* gate configs */ }
}, '/project');
```

##### `validate(config: FrameworkConfig): ValidationResult`

Validate configuration structure and values.

```typescript
const validation = VERSATILConfig.validate(config);
console.log(validation.valid);   // true/false
console.log(validation.errors);  // Array of validation errors
```

## 📖 Examples

### Complete Agent Workflow

```typescript
import {
  VERSATILAgentDispatcher,
  mcpToolManager,
  enhancedContextValidator
} from 'versatil-sdlc-framework';

async function setupFramework() {
  // Initialize dispatcher
  const dispatcher = new VERSATILAgentDispatcher();

  // Register custom agent
  dispatcher.registerAgent({
    agent: 'DevOps-Dan',
    priority: 4,
    triggers: {
      filePatterns: ['Dockerfile', '*.yml', '*.tf'],
      keywords: ['deploy', 'infrastructure'],
      actions: ['build', 'deploy'],
      dependencies: [],
      errorPatterns: ['deployment failed']
    },
    autoActivate: true,
    mcpTools: ['docker_mcp', 'terraform_mcp'],
    collaborators: ['Marcus-Backend']
  });

  // Set up event handlers
  dispatcher.on('agent-activated', async (event) => {
    console.log(`🎯 ${event.agent} activated`);

    if (event.agent === 'Maria-QA') {
      // Execute Chrome MCP for testing
      const mcpResult = await mcpToolManager.executeMCPTool('chrome_mcp', event.context);
      console.log(`🚀 Chrome MCP result: ${mcpResult.success}`);
    }
  });

  dispatcher.on('context-needed', async (event) => {
    console.log(`❓ Clarification needed: ${event.clarifications.join(', ')}`);
  });

  // Start monitoring
  dispatcher.startMonitoring(process.cwd());

  console.log('✅ VERSATIL Framework ready');
}

setupFramework().catch(console.error);
```

### Custom MCP Tool

```typescript
import { mcpToolManager, MCPExecutionResult } from 'versatil-sdlc-framework';

// Register custom Slack notification tool
mcpToolManager.registerTool('slack_mcp', {
  execute: async (context): Promise<MCPExecutionResult> => {
    const startTime = Date.now();

    try {
      // Send notification to Slack
      const message = `🤖 ${context.trigger.agent} is working on ${context.filePath}`;

      // Simulate Slack API call
      await fetch('https://hooks.slack.com/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });

      return {
        success: true,
        data: { message: 'Slack notification sent' },
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
});

// Use in agent configuration
dispatcher.registerAgent({
  agent: 'NotificationBot',
  mcpTools: ['slack_mcp'],
  // ... other config
});
```

### Context-Aware Development

```typescript
import { enhancedContextValidator } from 'versatil-sdlc-framework';

async function handleUserRequest(request: string) {
  // Validate context before proceeding
  const context = await enhancedContextValidator.validateTaskContext(request);

  if (context.overall === 'ambiguous') {
    console.log('❓ Need clarification:');
    context.requiredClarifications.forEach(clarification => {
      console.log(`  • ${clarification.question}`);
    });
    return;
  }

  if (context.overall === 'clear') {
    console.log('✅ Context is clear, proceeding with agents');
    // Proceed with agent activation
  }
}

// Test with ambiguous request
await handleUserRequest("Fix the broken thing");
// Output: Need clarification about what "thing" refers to

// Test with clear request
await handleUserRequest("Fix TypeScript error in VERSSAIButton.tsx line 45");
// Output: Context is clear, proceeding with agents
```

## 🔗 TypeScript Definitions

```typescript
// Core interfaces
interface AgentTrigger {
  agent: string;
  priority: number;
  triggers: {
    filePatterns: string[];
    keywords: string[];
    actions: string[];
    dependencies: string[];
    errorPatterns: string[];
  };
  autoActivate: boolean;
  mcpTools: string[];
  collaborators: string[];
}

interface AgentActivationContext {
  trigger: AgentTrigger;
  filePath?: string;
  errorMessage?: string;
  userRequest?: string;
  contextClarity: 'clear' | 'ambiguous' | 'missing';
  requiredClarifications?: string[];
}

interface MCPToolResult {
  success: boolean;
  tool: string;
  agent: string;
  data?: any;
  error?: string;
  timestamp: Date;
}

interface ContextAssessment {
  overall: 'clear' | 'ambiguous' | 'missing' | 'conflicting';
  confidence: number;
  requiredClarifications: ContextClarification[];
  suggestedAgents: string[];
}
```

---

**📞 Need Help?**

- 📖 [Full Documentation](https://docs.versatil-platform.com)
- 💬 [Discord Community](https://discord.gg/versatil)
- 🐛 [Report Issues](https://github.com/versatil-platform/versatil-sdlc-framework/issues)
- 📧 [Email Support](mailto:support@versatil.vc)