# 🚀 VERSATIL Enhanced Features Guide

## RAG Memory System & Archon Autonomous Orchestration

### Table of Contents
1. [Overview](#overview)
2. [RAG Memory System](#rag-memory-system)
3. [Archon Autonomous Orchestrator](#archon-autonomous-orchestrator)
4. [Enhanced BMAD Integration](#enhanced-bmad-integration)
5. [Getting Started](#getting-started)
6. [API Reference](#api-reference)
7. [Examples](#examples)
8. [Migration Guide](#migration-guide)

---

## Overview

The enhanced VERSATIL SDLC Framework introduces three revolutionary features:

- **🧠 RAG Memory System**: Vector-based memory storage for agents to learn from past interactions
- **🤖 Archon Orchestrator**: Autonomous goal planning and execution with hierarchical agent coordination
- **🚀 Enhanced BMAD**: Integration of RAG and Archon with existing BMAD agents for zero context loss

### Key Benefits

1. **Persistent Learning**: Agents remember and learn from every interaction
2. **Autonomous Execution**: Set goals and let Archon orchestrate the entire workflow
3. **Pattern Recognition**: Automatically detect and respond to recurring issues
4. **Self-Healing**: Autonomous recovery from failures with alternative strategies

---

## RAG Memory System

### What is RAG?

RAG (Retrieval-Augmented Generation) enhances agent responses by retrieving relevant past experiences. Each agent interaction is stored as a vector embedding, enabling semantic search across all memories.

### Core Features

- **Vector Storage**: Efficient semantic search using embeddings
- **Agent-Specific Memories**: Each agent maintains its own knowledge base
- **Relevance Scoring**: Memories are ranked by relevance to current context
- **Feedback Learning**: Memories improve based on user feedback

### Using RAG Memory

#### Store a Memory

```typescript
import { vectorMemoryStore } from 'versatil-sdlc-framework';

// Store a memory
const memoryId = await vectorMemoryStore.storeMemory({
  content: JSON.stringify({
    issue: 'undefined variable',
    solution: 'import from module',
    file: 'user.service.ts'
  }),
  metadata: {
    agentId: 'enhanced-marcus',
    timestamp: Date.now(),
    tags: ['typescript', 'import-error', 'backend']
  }
});
```

#### Query Memories

```typescript
// Query relevant memories
const results = await vectorMemoryStore.queryMemories({
  query: 'undefined variable error in typescript',
  agentId: 'enhanced-marcus',
  topK: 5,
  filters: {
    tags: ['typescript'],
    timeRange: {
      start: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
      end: Date.now()
    }
  }
});

// Results include relevance scores
results.documents.forEach(doc => {
  console.log(`Relevance: ${doc.metadata.relevanceScore}`);
  console.log(`Content: ${doc.content}`);
});
```

#### Provide Feedback

```typescript
// Mark a memory as helpful
await vectorMemoryStore.updateMemoryRelevance(
  memoryId,
  'helpful'
);
```

---

## Archon Autonomous Orchestrator

### What is Archon?

Archon is a hierarchical orchestration system that autonomously plans and executes complex development workflows. It breaks down high-level goals into executable steps and coordinates multiple agents.

### Core Capabilities

1. **Goal Planning**: Transforms requirements into detailed execution plans
2. **Agent Coordination**: Orchestrates multiple agents in parallel or sequence
3. **Decision Making**: Selects optimal execution strategies based on context
4. **Self-Recovery**: Handles failures with retry and alternative strategies

### Goal Types

- **feature**: New feature development
- **bug_fix**: Issue resolution
- **optimization**: Performance improvements
- **refactor**: Code restructuring
- **security**: Security enhancements

### Using Archon

#### Create a Goal

```typescript
import { ArchonOrchestrator, ArchonGoal } from 'versatil-sdlc-framework';

const goal: ArchonGoal = {
  id: 'goal-123',
  type: 'feature',
  description: 'Implement user authentication with JWT',
  priority: 'high',
  constraints: [
    'Must support refresh tokens',
    'Session timeout after 24 hours',
    'Compatible with existing user model'
  ],
  successCriteria: [
    'Login endpoint working',
    'Token refresh implemented',
    'Tests passing with 90% coverage',
    'Documentation updated'
  ],
  deadline: new Date('2024-12-31')
};

// Add goal for autonomous execution
await archonOrchestrator.addGoal(goal);
```

#### Monitor Execution

```typescript
// Listen to Archon events
archonOrchestrator.on('decision_made', (decision) => {
  console.log(`Decision: ${decision.decision}`);
  console.log(`Confidence: ${decision.confidence}`);
  console.log(`Selected agents: ${decision.selectedAgents.join(', ')}`);
});

archonOrchestrator.on('step_completed', ({ step, result }) => {
  console.log(`Step completed: ${step.action}`);
  console.log(`Execution time: ${result.executionTime}ms`);
});

archonOrchestrator.on('goal_completed', ({ goal, decision }) => {
  console.log(`Goal completed: ${goal.description}`);
});

archonOrchestrator.on('human_intervention_required', ({ step, error }) => {
  console.log(`Human help needed: ${error}`);
});
```

#### Get Archon State

```typescript
const state = archonOrchestrator.getState();

console.log(`Active goals: ${state.currentGoals.length}`);
console.log(`Queued steps: ${state.executionQueue.length}`);
console.log(`Success rate: ${state.performance.successRate}`);
```

---

## Enhanced BMAD Integration

### What's Enhanced?

Every BMAD agent now has:

1. **Memory Context**: Access to relevant past experiences
2. **Learning Capability**: Improves based on interactions
3. **Autonomous Actions**: Can trigger workflows independently
4. **Pattern Detection**: Recognizes recurring issues

### Using Enhanced Agents

#### Basic Usage

```typescript
import { enhancedBMAD } from 'versatil-sdlc-framework';

// Get enhanced agent
const mariaQA = enhancedBMAD.getEnhancedAgent('enhanced-maria');

// Activate with context
const response = await mariaQA.activate({
  filePath: 'src/auth.service.ts',
  content: fileContent,
  userRequest: 'Check for security vulnerabilities'
});

// Response includes enhanced features
console.log(`Memories used: ${response.memories.length}`);
console.log(`Learnings: ${response.learnings}`);
console.log(`Autonomous actions: ${response.autonomousActions}`);
```

#### Execute BMAD Workflow

```typescript
// Create project context
const projectId = 'my-project';
await enhancedBMAD.createContext(projectId);

// Execute complete workflow
await enhancedBMAD.executeBMADWorkflow(
  projectId,
  'Build a REST API for user management with authentication'
);

// Workflow will be executed autonomously
```

#### Configure Enhanced Features

```typescript
// Enable/disable features
enhancedBMAD.setRAGEnabled(true);      // Enable memory
enhancedBMAD.setAutonomousMode(true);  // Enable autonomous execution

// Get performance metrics
const metrics = await enhancedBMAD.getPerformanceMetrics();
console.log(JSON.stringify(metrics, null, 2));
```

---

## Getting Started

### Installation

```bash
# Update to latest version
npm update versatil-sdlc-framework

# Or install fresh
npm install -g versatil-sdlc-framework@latest
```

### Starting with Enhanced Features

#### Option 1: Enhanced Mode
```bash
# Start with enhanced features (RAG + Archon, manual mode)
npx versatil-sdlc enhanced
```

#### Option 2: Autonomous Mode
```bash
# Start in fully autonomous mode
npx versatil-sdlc autonomous
```

#### Option 3: Programmatic
```typescript
import { startEnhancedServer, startAutonomousMode } from 'versatil-sdlc-framework';

// Enhanced mode
await startEnhancedServer();

// Or autonomous mode
await startAutonomousMode();
```

### Quick Example

```typescript
import { 
  enhancedBMAD, 
  vectorMemoryStore, 
  ArchonGoal 
} from 'versatil-sdlc-framework';

async function buildFeature() {
  // 1. Create project context
  const projectId = 'auth-feature';
  await enhancedBMAD.createContext(projectId);
  
  // 2. Store relevant context in memory
  await vectorMemoryStore.storeMemory({
    content: JSON.stringify({
      requirement: 'Use bcrypt for password hashing',
      standard: 'OWASP recommendations'
    }),
    metadata: {
      agentId: 'security-sam',
      timestamp: Date.now(),
      tags: ['security', 'authentication', 'requirements']
    }
  });
  
  // 3. Execute workflow - Archon will handle the rest
  await enhancedBMAD.executeBMADWorkflow(
    projectId,
    'Implement secure user registration with email verification'
  );
  
  // The system will autonomously:
  // - Analyze requirements (Alex-BA)
  // - Create project plan (Sarah-PM)
  // - Design architecture (Architecture-Dan)
  // - Implement backend (Enhanced-Marcus)
  // - Implement frontend (Enhanced-James)
  // - Security audit (Security-Sam)
  // - Test everything (Enhanced-Maria)
}
```

---

## API Reference

### VectorMemoryStore

```typescript
class VectorMemoryStore {
  // Store a memory
  async storeMemory(doc: MemoryDocument): Promise<string>
  
  // Query memories
  async queryMemories(query: RAGQuery): Promise<RAGResult>
  
  // Update relevance
  async updateMemoryRelevance(
    memoryId: string, 
    feedback: 'helpful' | 'not_helpful'
  ): Promise<void>
}
```

### ArchonOrchestrator

```typescript
class ArchonOrchestrator {
  // Add goal for execution
  async addGoal(goal: ArchonGoal): Promise<void>
  
  // Get current state
  getState(): ArchonState
  
  // Control autonomous mode
  pauseAutonomous(): void
  resumeAutonomous(): void
  
  // Events
  on('goal_completed', callback)
  on('goal_failed', callback)
  on('decision_made', callback)
  on('step_completed', callback)
  on('human_intervention_required', callback)
}
```

### EnhancedBMADCoordinator

```typescript
class EnhancedBMADCoordinator {
  // Project management
  async createContext(projectId: string): Promise<BMADContext>
  async getContext(projectId: string): Promise<BMADContext>
  
  // Workflow execution
  async executeBMADWorkflow(
    projectId: string, 
    requirements: string
  ): Promise<void>
  
  // Agent access
  getEnhancedAgent(agentId: string): BaseAgent | undefined
  
  // Configuration
  setRAGEnabled(enabled: boolean): void
  setAutonomousMode(enabled: boolean): void
  
  // Metrics
  async getPerformanceMetrics(): Promise<any>
}
```

---

## Examples

### Example 1: Bug Fix Workflow

```typescript
// Autonomous bug fix
const bugGoal: ArchonGoal = {
  id: 'bug-001',
  type: 'bug_fix',
  description: 'Fix memory leak in user service causing server crashes',
  priority: 'critical',
  constraints: ['Minimal code changes', 'No breaking changes'],
  successCriteria: [
    'Memory leak identified',
    'Fix implemented',
    'Tests added',
    'No performance regression'
  ]
};

await archonOrchestrator.addGoal(bugGoal);
```

### Example 2: Learning from Patterns

```typescript
// Store pattern in memory
await vectorMemoryStore.storeMemory({
  content: JSON.stringify({
    pattern: 'N+1 query problem',
    solution: 'Use eager loading with includes',
    example: 'User.findAll({ include: [Profile] })'
  }),
  metadata: {
    agentId: 'enhanced-marcus',
    timestamp: Date.now(),
    tags: ['performance', 'database', 'pattern', 'sequelize']
  }
});

// Agent will now suggest this solution for similar issues
```

### Example 3: Multi-Agent Collaboration

```typescript
// Complex feature requiring multiple agents
await enhancedBMAD.executeBMADWorkflow(
  'ecommerce-project',
  `Build a complete shopping cart feature with:
   - Product catalog with search
   - Cart management with persistence
   - Checkout process with payment integration
   - Order tracking system
   - Email notifications`
);

// Archon will coordinate all necessary agents automatically
```

---

## Migration Guide

### From Version 1.0.x to 1.1.x

1. **No Breaking Changes**: All existing functionality remains intact
2. **New Features are Opt-in**: Enhanced features are disabled by default
3. **Gradual Migration**: Enable features one at a time

#### Step 1: Update Package

```bash
npm update versatil-sdlc-framework
```

#### Step 2: Enable RAG Memory (Optional)

```typescript
import { enhancedBMAD } from 'versatil-sdlc-framework';

// Enable RAG for memory-based learning
enhancedBMAD.setRAGEnabled(true);
```

#### Step 3: Enable Autonomous Mode (Optional)

```typescript
// Enable autonomous execution
enhancedBMAD.setAutonomousMode(true);
```

#### Step 4: Use Enhanced Agents

```typescript
// Old way still works
const maria = agentRegistry.getAgent('enhanced-maria');

// New way with enhanced features
const enhancedMaria = enhancedBMAD.getEnhancedAgent('enhanced-maria');
```

### Best Practices

1. **Start with RAG**: Enable memory first to build knowledge base
2. **Monitor Autonomous Mode**: Use events to track autonomous decisions
3. **Provide Feedback**: Help agents learn by rating memory relevance
4. **Set Clear Goals**: Well-defined success criteria improve outcomes

---

## Troubleshooting

### Common Issues

#### Memory Not Being Retrieved
- Check if RAG is enabled: `enhancedBMAD.setRAGEnabled(true)`
- Verify memories exist: Check `.versatil/rag/vector-index/`
- Review query terms: Use specific keywords

#### Autonomous Execution Not Starting
- Verify autonomous mode: `enhancedBMAD.setAutonomousMode(true)`
- Check goal format: Ensure all required fields are provided
- Review constraints: Conflicting constraints may prevent execution

#### Performance Issues
- Limit memory queries: Adjust `topK` parameter
- Clear old memories: Remove outdated entries periodically
- Monitor metrics: Use `getPerformanceMetrics()` to identify bottlenecks

### Debug Mode

```typescript
// Enable detailed logging
process.env.VERSATIL_DEBUG = 'true';

// Monitor all events
enhancedBMAD.on('enhanced_activation', (data) => {
  console.log('Enhanced activation:', data);
});

archonOrchestrator.on('decision_made', (decision) => {
  console.log('Archon decision:', decision);
});
```

---

## Support & Resources

- **Documentation**: [docs.versatil-framework.com/enhanced](https://docs.versatil-framework.com/enhanced)
- **Examples**: [github.com/versatil-platform/enhanced-examples](https://github.com/versatil-platform/enhanced-examples)
- **Discord**: [discord.gg/versatil-enhanced](https://discord.gg/versatil-enhanced)
- **Issues**: [GitHub Issues](https://github.com/versatil-platform/versatil-sdlc-framework/issues)

---

## Future Roadmap

### Coming Soon

1. **Neural Architecture Search**: Automatic optimization of agent configurations
2. **Federated Learning**: Share learnings across organizations while maintaining privacy
3. **Multi-Modal Memory**: Support for images, diagrams, and audio in memory
4. **Advanced Planning**: Monte Carlo Tree Search for optimal execution paths
5. **Human-in-the-Loop**: Seamless handoff between autonomous and manual modes

---

*Built with ❤️ by the VERSATIL Team*
