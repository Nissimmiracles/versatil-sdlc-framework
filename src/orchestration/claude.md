# orchestration/ - Multi-Agent Workflow Coordination

**Priority**: HIGH
**Agent(s)**: Sarah-PM (primary owner), all agents (consumers)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Coordinates multi-agent workflows for complex features spanning database, API, and frontend tiers. Provides planning orchestration, parallel task execution, conflict resolution, and human-in-the-loop checkpoints. Core engine for `/plan`, `/work`, and `/delegate` commands.

## 🎯 Core Concepts

### Key Abstractions
- **MultiAgentPlan**: Comprehensive execution plan with phases, tasks, agents, dependencies
- **PlanPhase**: Sequential or parallel execution phase (e.g., "Database Setup", "API Implementation")
- **Task**: Atomic work unit assigned to specific agent with estimated duration
- **HumanCheckpoint**: Points requiring user approval before proceeding
- **ParallelTaskManager**: Executes independent tasks concurrently (40% time savings)

### Design Patterns Used
- **Orchestrator Pattern**: Central coordinator delegates work to specialized agents
- **Pipeline Pattern**: Sequential phases with dependency resolution
- **Checkpoint Pattern**: Human-in-the-loop approval gates
- **Event-Driven**: EventEmitter for progress tracking and status updates

## 📁 File Organization

```
src/orchestration/
├── plan-first-opera.ts               # Plan-First Orchestrator (core)
├── parallel-task-manager.ts          # Concurrent task execution
├── stack-aware-orchestrator.ts       # Tech stack detection + routing
├── agentic-rag-orchestrator.ts       # RAG-enhanced orchestration
├── epic-workflow-orchestrator.ts     # Multi-week epic coordination
├── conflict-resolution-engine.ts     # Merge conflict resolution
├── github-sync-orchestrator.ts       # GitHub PR/issue sync
├── event-driven-orchestrator.ts      # Event-based coordination
├── proactive-agent-orchestrator.ts   # Auto-activation patterns
└── ai-era-dev-orchestrator.ts        # AI-first development workflows
```

## ✅ Development Rules

### DO ✓
- ✓ **Always create plans before execution** - use PlanFirstOrchestrator
- ✓ **Emit progress events** - use EventEmitter for observability
- ✓ **Detect dependencies** - use dependency graph to determine execution order
- ✓ **Enable parallel execution** - use ParallelTaskManager for independent tasks
- ✓ **Add human checkpoints** - require approval for destructive operations
- ✓ **Implement rollback strategies** - all plans must have safeguards.rollbackPlan

### DON'T ✗
- ✗ **Don't execute without plan approval** - always present plan to user first
- ✗ **Don't run dependent tasks in parallel** - respect dependency ordering
- ✗ **Don't skip validation** - validate all task outputs before next phase
- ✗ **Don't hardcode agent assignments** - use StackAwareOrchestrator for routing
- ✗ **Don't ignore errors** - implement proper error handling and rollback

## 🔧 Common Patterns

### Pattern 1: Create Multi-Agent Plan
**When to use**: Implementing features requiring multiple agents (DB + API + Frontend)

```typescript
import { PlanFirstOrchestrator } from '@/orchestration/plan-first-opera.js';

const orchestrator = new PlanFirstOrchestrator();

const plan = await orchestrator.createPlan({
  goal: 'Add user authentication with JWT',
  requirements: {
    businessNeeds: 'Users can sign up, log in, access protected routes',
    technicalConstraints: ['Use bcrypt for passwords', 'JWT with 24h expiry'],
    acceptanceCriteria: [
      'User can sign up with email/password',
      'User can log in and receive token',
      'Protected routes require auth'
    ]
  }
});

// Plan structure:
// phases: [
//   { phase: 'Database Setup', agents: ['Dana-Database'], parallelizable: false },
//   { phase: 'API Implementation', agents: ['Marcus-Backend'], parallelizable: false },
//   { phase: 'Frontend UI', agents: ['James-Frontend'], parallelizable: false },
//   { phase: 'Testing', agents: ['Maria-QA'], parallelizable: false }
// ]

// Present to user for approval
console.log('Plan created:', plan.metadata.estimatedTime, 'hours');
console.log('Human checkpoints:', plan.humanCheckpoints);

// Execute with approval
if (await getUserApproval(plan)) {
  await orchestrator.executePlan(plan);
}
```

### Pattern 2: Parallel Task Execution
**When to use**: Multiple independent tasks that don't depend on each other

```typescript
import { ParallelTaskManager } from '@/orchestration/parallel-task-manager.js';

const manager = new ParallelTaskManager({ maxConcurrency: 3 });

// Define independent tasks
const tasks = [
  {
    id: 'task-1',
    description: 'Create LoginForm component',
    agent: 'James-Frontend',
    estimatedDuration: 30, // minutes
    dependencies: []
  },
  {
    id: 'task-2',
    description: 'Create SignupForm component',
    agent: 'James-Frontend',
    estimatedDuration: 30,
    dependencies: []
  },
  {
    id: 'task-3',
    description: 'Write unit tests for auth service',
    agent: 'Maria-QA',
    estimatedDuration: 20,
    dependencies: []
  }
];

// Execute in parallel (saves 40 minutes vs sequential)
const results = await manager.executeTasks(tasks);

// results: [
//   { taskId: 'task-1', success: true, duration: 28 },
//   { taskId: 'task-2', success: true, duration: 32 },
//   { taskId: 'task-3', success: true, duration: 18 }
// ]
```

### Pattern 3: Tech Stack-Aware Routing
**When to use**: Auto-select sub-agents based on detected tech stack

```typescript
import { StackAwareOrchestrator } from '@/orchestration/stack-aware-orchestrator.js';

const orchestrator = new StackAwareOrchestrator();

// Detect tech stack
const stack = await orchestrator.detectStack();
// { frontend: 'react', backend: 'node', database: 'postgresql' }

// Route to appropriate sub-agents
const frontendAgent = orchestrator.selectFrontendAgent(stack.frontend);
// Returns: JamesReact (instead of generic James-Frontend)

const backendAgent = orchestrator.selectBackendAgent(stack.backend);
// Returns: MarcusNode (instead of generic Marcus-Backend)
```

## ⚠️ Gotchas & Edge Cases

### Gotcha 1: Circular Dependencies Break Execution
**Problem**: Tasks with circular dependencies (A depends on B, B depends on A) cause deadlock
**Solution**: Validate dependency graph before execution, throw error if cycles detected

```typescript
// ❌ Bad - Creates circular dependency
const tasks = [
  { id: 'A', dependencies: ['B'] },
  { id: 'B', dependencies: ['A'] }
];

// ✅ Good - Validate graph first
import { validateDependencyGraph } from '@/orchestration/parallel-task-manager.js';

const validation = validateDependencyGraph(tasks);
if (!validation.valid) {
  throw new Error(`Circular dependencies detected: ${validation.cycles.join(', ')}`);
}
```

### Gotcha 2: Human Checkpoint Timeout
**Problem**: Plan execution blocks indefinitely waiting for user approval
**Solution**: Add timeout to checkpoints, auto-cancel plan after 5 minutes

```typescript
// ❌ Bad - Waits forever
await orchestrator.waitForCheckpointApproval(checkpoint);

// ✅ Good - Timeout with cancellation
const approved = await orchestrator.waitForCheckpointApproval(checkpoint, {
  timeout: 300000, // 5 minutes
  onTimeout: () => {
    console.log('Checkpoint timeout - plan cancelled');
    orchestrator.rollback();
  }
});
```

### Gotcha 3: Parallel Tasks Exceeding Concurrency Limit
**Problem**: Too many concurrent tasks overwhelm system resources (memory, API rate limits)
**Solution**: Use ParallelTaskManager with maxConcurrency limit

```typescript
// ❌ Bad - Launches all 50 tasks at once
const results = await Promise.all(tasks.map(t => executeTask(t)));

// ✅ Good - Limit to 3 concurrent tasks
const manager = new ParallelTaskManager({ maxConcurrency: 3 });
const results = await manager.executeTasks(tasks);
// Executes 3 at a time, queues remaining 47
```

## 🧪 Testing Guidelines

### Test Structure
```typescript
describe('orchestration - PlanFirstOrchestrator', () => {
  let orchestrator: PlanFirstOrchestrator;

  beforeEach(() => {
    orchestrator = new PlanFirstOrchestrator();
  });

  describe('createPlan', () => {
    it('should generate multi-phase plan with dependencies', async () => {
      // Arrange
      const requirements = {
        goal: 'Add user authentication',
        businessNeeds: 'Secure user access',
        acceptanceCriteria: ['Users can log in']
      };

      // Act
      const plan = await orchestrator.createPlan(requirements);

      // Assert
      expect(plan.phases).toHaveLength(4); // DB, API, Frontend, Testing
      expect(plan.phases[0].agents).toContain('Dana-Database');
      expect(plan.phases[1].dependencies).toContain(plan.phases[0].phase);
      expect(plan.humanCheckpoints.length).toBeGreaterThan(0);
    });
  });
});
```

### Common Test Patterns
- **Unit tests**: Test plan generation, dependency resolution, task routing
- **Integration tests**: Test full plan execution with mocked agents
- **Mock patterns**: Mock agent responses, file system, git operations

### Coverage Requirements
- Minimum: 80% (Enhanced Maria-QA standard)
- Critical paths: 85%+ (plan generation, execution, rollback)
- Focus areas: PlanFirstOrchestrator.createPlan(), ParallelTaskManager.executeTasks()

## 🔗 Dependencies

### Internal Dependencies
- **agents/**: All OPERA agents (delegates work to them)
- **rag/pattern-search.js**: Historical context for effort estimation
- **templates/template-matcher.js**: Plan template selection
- **planning/todo-file-generator.js**: Persistent todo file creation
- **utils/logger.js**: VERSATILLogger for structured logging

### External Dependencies
- **events**: Node.js EventEmitter (built-in)

## 🎨 Code Style Preferences

### Naming Conventions
- **Orchestrators**: PascalCase with "Orchestrator" suffix (e.g., `PlanFirstOrchestrator`)
- **Plans**: PascalCase (e.g., `MultiAgentPlan`, `PlanPhase`)
- **Events**: kebab-case (e.g., `plan-created`, `phase-completed`, `task-failed`)

### Async Patterns
- **Preferred**: async/await
- **Event handling**: EventEmitter for progress updates

### Error Handling
```typescript
try {
  const plan = await orchestrator.createPlan(requirements);
  await orchestrator.executePlan(plan);
} catch (error) {
  this.logger.error('Plan execution failed', { error, plan: plan.metadata.id }, 'orchestrator');
  await orchestrator.rollback(plan);
  throw new Error(`Orchestration failed: ${error.message}`);
}
```

## 📊 Performance Considerations

### Performance Targets
- Plan generation: < 2 seconds for 10 tasks
- Parallel execution: 40% time savings vs sequential
- Dependency resolution: < 100ms for 50 tasks

### Optimization Tips
- **Batch agent calls**: Group similar tasks to same agent to reduce overhead
- **Cache tech stack detection**: Detect once per project, cache results
- **Lazy load orchestrators**: Only instantiate orchestrators when needed

## 🔍 Debugging Tips

### Common Issues
1. **Plan generation too slow**: Enable `DEBUG=orchestration:*` to see bottlenecks
2. **Tasks not executing in parallel**: Check dependencies - may have hidden conflicts
3. **Checkpoint not firing**: Verify HumanCheckpoint.condition evaluates correctly

### Debug Logging
```typescript
// Enable debug mode
process.env.DEBUG = 'orchestration:*';

// Listen to events
orchestrator.on('phase-started', (phase) => {
  console.log('Phase started:', phase.phase, phase.agents);
});
orchestrator.on('task-completed', (task) => {
  console.log('Task completed:', task.id, task.duration);
});
```

## 📚 Related Documentation

- [/plan Command](.claude/commands/plan.md)
- [OPERA Methodology](../../docs/OPERA_METHODOLOGY.md)
- [Compounding Engineering](../../docs/guides/compounding-engineering.md)
- [Parallel Execution Guide](../../docs/PARALLEL_EXECUTION.md)

## 🚀 Quick Start Example

```typescript
import { PlanFirstOrchestrator } from '@/orchestration/plan-first-opera.js';

// Create orchestrator
const orchestrator = new PlanFirstOrchestrator();

// Create plan for authentication feature
const plan = await orchestrator.createPlan({
  goal: 'Add JWT authentication',
  requirements: {
    businessNeeds: 'Secure user access',
    technicalConstraints: ['bcrypt passwords', 'JWT 24h expiry'],
    acceptanceCriteria: ['Signup works', 'Login works', 'Protected routes work']
  }
});

// Present plan to user
console.log(`Plan: ${plan.metadata.estimatedTime} hours`);
console.log(`Phases: ${plan.phases.map(p => p.phase).join(' → ')}`);
console.log(`Checkpoints: ${plan.humanCheckpoints.length}`);

// Execute with monitoring
orchestrator.on('phase-completed', (phase) => {
  console.log(`✅ ${phase.phase} complete`);
});

await orchestrator.executePlan(plan);
console.log('✅ Authentication feature complete!');
```

## 🔄 Migration Notes

### From v6.5.0 to v6.6.0
- **New**: Added library context system - orchestrators now use library-specific patterns from RAG
- **Enhanced**: ParallelTaskManager now supports priority-based scheduling
- **Breaking**: HumanCheckpoint timeout now defaults to 5 minutes (was infinite)

### Deprecation Warnings
- **ProactiveCapabilityEnhancer**: Deprecated - use ProactiveAgentOrchestrator instead (removal in v7.0.0)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('orchestration')`
**Priority Layer**: User Preferences > **Library Context** > Team Conventions > Framework Defaults
