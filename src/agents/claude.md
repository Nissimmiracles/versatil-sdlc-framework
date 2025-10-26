# agents/ - OPERA Agent System

**Priority**: HIGH
**Agent(s)**: All OPERA agents (Primary: Alex-BA for coordination)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Core implementation of the 8 OPERA agents (Enhanced Maria-QA, James-Frontend, Marcus-Backend, Alex-BA, Dana-Database, Dr.AI-ML, Sarah-PM, Oliver-MCP) plus their 10 specialized sub-agents. Provides base abstractions, agent lifecycle management, contract-based handoffs, and auto-activation patterns.

## 🎯 Core Concepts

### Key Abstractions
- **BaseAgent**: Abstract class with `activate(context)` lifecycle method
- **AgentActivationContext**: Contains file path, content, action type, git status
- **AgentResponse**: Standardized response with `success`, `shouldActivate`, `suggestions`, `issues`
- **Three-Tier Handoff Contract**: Database → API → Frontend coordination pattern
- **Sub-Agent Factory**: Auto-selects specialized sub-agents based on tech stack detection

### Design Patterns Used
- **Strategy Pattern**: BaseAgent with specialized implementations per OPERA agent
- **Factory Pattern**: SubAgentFactory creates tech-specific agents (React, Vue, Node.js, Python, etc.)
- **Contract Pattern**: Three-tier handoff with validation gates between tiers
- **Registry Pattern**: AgentRegistry maintains agent instances and metadata

## 📁 File Organization

```
src/agents/
├── core/
│   ├── base-agent.ts           # Abstract BaseAgent class
│   ├── agent-types.ts          # TypeScript definitions
│   ├── agent-registry.ts       # Singleton registry for all agents
│   ├── sub-agent-factory.ts    # Creates tech-specific sub-agents
│   ├── sub-agent-selector.ts   # Selects optimal sub-agent based on context
│   └── tech-stack-detector.ts  # Detects React, Vue, Node.js, Python, etc.
├── contracts/
│   ├── three-tier-handoff.ts           # ThreeTierHandoffBuilder
│   ├── agent-handoff-contract.ts       # Contract interfaces
│   ├── contract-validator.ts           # Validates contracts (90+ score)
│   └── contract-tracker.ts             # Tracks contract execution
├── opera/
│   ├── maria-qa/enhanced-maria.ts      # Maria-QA agent
│   ├── james-frontend/enhanced-james.ts # James-Frontend agent
│   ├── marcus-backend/enhanced-marcus.ts # Marcus-Backend agent
│   ├── alex-ba/alex-ba.ts              # Alex-BA agent
│   ├── dana-database/enhanced-dana.ts  # Dana-Database agent
│   ├── dr-ai-ml/dr-ai-ml.ts            # Dr.AI-ML agent
│   ├── sarah-pm/sarah-pm.ts            # Sarah-PM agent
│   └── oliver-mcp/ (distributed)       # Oliver-MCP agent
├── opera/*/sub-agents/                 # Tech-specific sub-agents
│   ├── james-react.ts, james-vue.ts, james-nextjs.ts, james-angular.ts, james-svelte.ts
│   └── marcus-node.ts, marcus-python.ts, marcus-rails.ts, marcus-go.ts, marcus-java.ts
├── verification/
│   ├── assessment-engine.ts            # Pre-planning quality gates
│   └── chain-of-verification.ts        # Victor-Verifier CoVe patterns
├── sdk/
│   ├── sdk-agent-adapter.ts            # Claude Code Native SDK integration
│   ├── agent-definitions.ts            # Agent metadata for SDK
│   └── context-aware-agent.ts          # Context-enhanced agent base
└── activation-validator.ts             # Validates agent activation suggestions
```

## ✅ Development Rules

### DO ✓
- ✓ **Always extend BaseAgent** for new OPERA agents
- ✓ **Use VERSATILLogger** for all logging (NOT console.log)
- ✓ **Export singleton instances** for stateful agents (e.g., `export const mariaQA = new EnhancedMaria()`)
- ✓ **Validate activation context** before processing (check filePath, content, actionType)
- ✓ **Return standardized AgentResponse** with success/shouldActivate/suggestions/issues
- ✓ **Use ThreeTierHandoffBuilder** for multi-tier features (DB → API → UI)
- ✓ **Add work items to contracts** - at least one work item required per contract

### DON'T ✗
- ✗ **Don't use console.log** - use `this.logger.info/warn/error` instead
- ✗ **Don't mutate AgentActivationContext** - treat as immutable input
- ✗ **Don't skip contract validation** - always call `buildAndValidate()` on ThreeTierHandoffBuilder
- ✗ **Don't create agents without systemPrompt** - abstract method must be implemented
- ✗ **Don't hardcode tech stacks** - use TechStackDetector for framework detection

## 🔧 Common Patterns

### Pattern 1: Creating a New OPERA Agent
**When to use**: Adding a new specialized agent to the framework

```typescript
import { BaseAgent, AgentActivationContext, AgentResponse } from '../core/base-agent.js';
import { VERSATILLogger } from '../../utils/logger.js';

export class NewAgent extends BaseAgent {
  private logger = new VERSATILLogger();

  systemPrompt = `You are NewAgent, specialized in [domain]. Your responsibilities:
  1. [Primary responsibility]
  2. [Secondary responsibility]
  3. [Tertiary responsibility]`;

  constructor() {
    super('new-agent', 'New Agent Specialization');
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    this.logger.info('Activating NewAgent', { file: context.filePath }, 'new-agent');

    // Standard validation
    const validation = await this.runStandardValidation(context);

    // Agent-specific logic
    const suggestions = this.analyzeDomain(context);

    return {
      success: true,
      shouldActivate: suggestions.length > 0,
      suggestions,
      issues: validation.issues,
      recommendations: validation.recommendations
    };
  }

  private analyzeDomain(context: AgentActivationContext): string[] {
    // Domain-specific analysis
    return [];
  }
}

// Export singleton
export const newAgent = new NewAgent();
```

### Pattern 2: Three-Tier Handoff Workflow
**When to use**: Implementing features spanning Database → API → Frontend

```typescript
import { ThreeTierHandoffBuilder } from '../contracts/three-tier-handoff.js';

// Build contract
const builder = new ThreeTierHandoffBuilder({
  name: 'User Authentication',
  businessRequirements: 'Users can sign up, log in, and access protected routes',
  acceptanceCriteria: [
    'User can sign up with email/password',
    'User can log in and receive JWT token',
    'Protected routes require authentication'
  ]
});

// Database tier (Dana-Database)
builder.withDatabaseTier({
  schemaDesign: `
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  migrations: ['001_create_users_table.sql'],
  rlsPolicies: [
    'CREATE POLICY users_read_own ON users FOR SELECT USING (auth.uid() = id);'
  ],
  performanceIndexes: [
    'CREATE UNIQUE INDEX users_email_idx ON users(email);'
  ]
});

// API tier (Marcus-Backend)
builder.withAPITier({
  endpoints: [
    { method: 'POST', path: '/auth/signup', description: 'Create new user' },
    { method: 'POST', path: '/auth/login', description: 'Authenticate user' }
  ],
  requestSchemas: { signup: 'email, password', login: 'email, password' },
  responseSchemas: { signup: 'user', login: 'user, token' },
  businessLogic: 'bcrypt password hashing, JWT token generation with 24h expiry',
  securityPatterns: ['Password hashing (bcrypt)', 'JWT tokens', 'Rate limiting']
});

// Frontend tier (James-Frontend)
builder.withFrontendTier({
  components: ['LoginForm', 'SignupForm', 'AuthProvider'],
  stateManagement: 'React Context (AuthContext)',
  formValidation: 'email regex, min 8 chars password',
  accessibility: 'WCAG 2.1 AA - form labels, aria-invalid, focus management'
});

// Validate and get contract
const contract = await builder.buildAndValidate();
// Throws error if validation score < 90
```

## ⚠️ Gotchas & Edge Cases

### Gotcha 1: Empty Work Items Causes Validation Failure
**Problem**: ThreeTierHandoffBuilder requires at least one work item, but auto-generation can create contracts with zero items
**Solution**: Always add work items to baseBuilder before calling buildAndValidate()

```typescript
// ❌ Bad - May have zero work items
const contract = builder.buildAndValidate(); // May throw validation error

// ✅ Good - Ensure at least one work item
if (workItems.length === 0) {
  workItems.push({
    id: `work-plan-${Date.now()}`,
    type: 'planning',
    description: `Plan three-tier implementation for ${requirements.name}`,
    acceptanceCriteria: ['Requirements analyzed', 'Architecture designed'],
    estimatedEffort: 1,
    priority: 'high'
  });
}
workItems.forEach(item => baseBuilder.addWorkItem(item));
const contract = await builder.buildAndValidate();
```

### Gotcha 2: Contract Validation Doesn't Throw by Default
**Problem**: buildAndValidate() returns validation object but doesn't throw on failure (fixed in v6.6.0)
**Solution**: Now throws automatically if validation.valid === false

```typescript
// v6.5.0 (old behavior) - needed manual check
const validation = builder.build();
if (!validation.valid) {
  throw new Error(`Contract validation failed: ${validation.errors}`);
}

// v6.6.0+ (new behavior) - throws automatically
const contract = await builder.buildAndValidate();
// Automatically throws if validation fails
```

### Gotcha 3: Agent Activation Context May Be Incomplete
**Problem**: Some hooks provide partial context (missing content or filePath)
**Solution**: Always validate context fields before using

```typescript
// ❌ Bad - Assumes content exists
const issues = this.analyzeCode(context.content);

// ✅ Good - Defensive validation
if (!context.content || !context.filePath) {
  this.logger.warn('Incomplete activation context', { context }, 'agent');
  return { success: false, shouldActivate: false, suggestions: [], issues: [] };
}
const issues = this.analyzeCode(context.content);
```

## 🧪 Testing Guidelines

### Test Structure
```typescript
describe('agents - EnhancedMaria', () => {
  let agent: EnhancedMaria;

  beforeEach(() => {
    agent = new EnhancedMaria();
  });

  describe('activate', () => {
    it('should detect missing tests and suggest activation', async () => {
      // Arrange
      const context: AgentActivationContext = {
        filePath: 'src/services/auth.ts',
        content: 'export function login() { /* implementation */ }',
        actionType: 'create',
        gitStatus: { modified: [], added: ['src/services/auth.ts'] }
      };

      // Act
      const response = await agent.activate(context);

      // Assert
      expect(response.success).toBe(true);
      expect(response.shouldActivate).toBe(true);
      expect(response.suggestions).toContain('Missing test coverage for auth.ts');
    });
  });
});
```

### Common Test Patterns
- **Unit tests**: Test individual agent activation logic in isolation
- **Integration tests**: Test three-tier handoff workflows end-to-end
- **Mock patterns**: Mock AgentActivationContext, file system, git commands

### Coverage Requirements
- Minimum: 80% (Enhanced Maria-QA standard)
- Critical paths: 85%+ (all agents/)
- Focus areas: BaseAgent.activate(), ThreeTierHandoffBuilder, ContractValidator

## 🔗 Dependencies

### Internal Dependencies
- **utils/logger.js**: VERSATILLogger for structured logging
- **types.js**: AgentResponse, AgentActivationContext interfaces
- **orchestration/**: PlanningOrchestrator for multi-agent coordination
- **rag/**: PatternSearchService for historical context

### External Dependencies
- None (pure TypeScript, no external packages)

## 🎨 Code Style Preferences

### Naming Conventions
- **Agents**: PascalCase with "Enhanced" prefix (e.g., `EnhancedMaria`)
- **Sub-agents**: PascalCase with framework suffix (e.g., `JamesReact`, `MarcusNode`)
- **Singletons**: camelCase with agent name (e.g., `mariaQA`, `jamesFrontend`)
- **Interfaces**: PascalCase (e.g., `AgentActivationContext`, `ThreeTierContract`)

### Async Patterns
- **Preferred**: async/await
- **All lifecycle methods**: `activate(context): Promise<AgentResponse>`

### Error Handling
```typescript
try {
  const result = await agent.activate(context);
} catch (error) {
  this.logger.error('Agent activation failed', { error, agent: agent.id }, 'activation');
  throw new Error(`Failed to activate ${agent.id}: ${error.message}`);
}
```

## 📊 Performance Considerations

### Performance Targets
- Agent activation: < 100ms per agent
- Three-tier contract validation: < 50ms
- Sub-agent selection: < 20ms

### Optimization Tips
- **Lazy initialization**: Don't load all agents upfront, use AgentRegistry.get(id)
- **Cache tech stack detection**: TechStackDetector caches results per project
- **Batch validations**: ContractValidator can validate multiple contracts in parallel

## 🔍 Debugging Tips

### Common Issues
1. **Agent not activating**: Check `.claude/hooks/after-file-edit.ts` trigger patterns
2. **Contract validation failing**: Run `ContractValidator.validate()` to see detailed errors
3. **Sub-agent not found**: Verify tech stack detection with `TechStackDetector.detect()`

### Debug Logging
```typescript
// Enable debug mode
process.env.DEBUG = 'agents:*';
this.logger.setLevel('debug');
```

## 📚 Related Documentation

- [OPERA Methodology](../../docs/OPERA_METHODOLOGY.md)
- [Three-Tier Handoff Guide](../../docs/THREE_TIER_HANDOFF.md)
- [Agent Auto-Activation](.claude/AGENT_TRIGGERS.md)
- [CLAUDE.md Agent Configuration](../../CLAUDE.md)

## 🚀 Quick Start Example

```typescript
import { mariaQA } from '@/agents/opera/maria-qa/enhanced-maria.js';
import { AgentActivationContext } from '@/agents/core/base-agent.js';

// Create activation context
const context: AgentActivationContext = {
  filePath: 'src/components/LoginForm.tsx',
  content: fs.readFileSync('src/components/LoginForm.tsx', 'utf-8'),
  actionType: 'edit',
  gitStatus: { modified: ['src/components/LoginForm.tsx'], added: [] }
};

// Activate agent
const response = await mariaQA.activate(context);

if (response.shouldActivate) {
  console.log('Maria-QA suggests:', response.suggestions);
  console.log('Issues found:', response.issues);
}
```

## 🔄 Migration Notes

### From v6.5.0 to v6.6.0
- **Breaking**: `buildAndValidate()` now throws on validation failure (previously returned validation object)
- **Migration**: Remove manual validation checks after buildAndValidate() calls
- **New**: Added library context system - agents now inject library-specific patterns

### Deprecation Warnings
- **AgentPool**: Deprecated - use AgentRegistry instead (removal in v7.0.0)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('agents')`
**Priority Layer**: User Preferences > **Library Context** > Team Conventions > Framework Defaults
