---
name: orchestration-library
description: Multi-agent workflow coordination for complex features spanning database, API, and frontend tiers. Use when creating execution plans, coordinating parallel tasks, implementing human checkpoints, resolving dependencies, or building /plan, /work, /delegate commands. Provides PlanFirstOrchestrator, ParallelTaskManager, and tech stack-aware routing.
tags: [orchestration, multi-agent, parallel, workflow, coordination]
---

# orchestration/ - Multi-Agent Workflow Coordination

**Priority**: HIGH
**Agent(s)**: Sarah-PM (primary owner), all agents (consumers)
**Last Updated**: 2025-10-26

## When to Use

- Creating multi-agent execution plans (DB + API + Frontend)
- Coordinating parallel task execution (40% time savings)
- Implementing human-in-the-loop checkpoints
- Resolving task dependencies and execution order
- Building /plan, /work, /delegate commands
- Auto-routing tasks based on tech stack detection
- Implementing rollback strategies for failed plans
- Debugging workflow coordination issues

## What This Library Provides

### Core Services
- **PlanFirstOrchestrator**: Central coordinator for multi-agent workflows
- **ParallelTaskManager**: Concurrent task execution with dependency resolution
- **StackAwareOrchestrator**: Tech stack detection + sub-agent routing
- **ConflictResolutionEngine**: Merge conflict resolution
- **EventDrivenOrchestrator**: Event-based progress tracking

### Key Features
- **Plan-First Approach**: Always plan before execution, present to user for approval
- **Parallel Execution**: 40% time savings by running independent tasks concurrently
- **Human Checkpoints**: Approval gates for destructive operations
- **Dependency Resolution**: Auto-detect task dependencies, prevent circular deps
- **Rollback Strategies**: Safeguards for failed plans
- **Progress Events**: Real-time EventEmitter updates

### File Structure
```
src/orchestration/
├── plan-first-opera.ts               # Main orchestrator (core)
├── parallel-task-manager.ts          # Concurrent execution
├── stack-aware-orchestrator.ts       # Tech stack routing
├── agentic-rag-orchestrator.ts       # RAG-enhanced planning
├── conflict-resolution-engine.ts     # Merge conflicts
├── github-sync-orchestrator.ts       # PR/issue sync
├── event-driven-orchestrator.ts      # Event-based coordination
└── proactive-agent-orchestrator.ts   # Auto-activation
```

## Core Conventions

### DO ✓
- ✓ **Always create plans before execution** - Use PlanFirstOrchestrator
- ✓ **Emit progress events** - Use EventEmitter for observability
- ✓ **Detect dependencies** - Use dependency graph for execution order
- ✓ **Enable parallel execution** - Use ParallelTaskManager for independent tasks
- ✓ **Add human checkpoints** - Require approval for destructive operations
- ✓ **Implement rollback strategies** - All plans must have rollback logic

### DON'T ✗
- ✗ **Don't execute without plan approval** - Always present plan to user first
- ✗ **Don't run dependent tasks in parallel** - Respect dependency ordering
- ✗ **Don't skip validation** - Validate all task outputs before next phase
- ✗ **Don't hardcode agent assignments** - Use StackAwareOrchestrator for routing
- ✗ **Don't ignore errors** - Implement proper error handling and rollback

## Quick Start Patterns

### Pattern 1: Create Multi-Agent Plan
```typescript
import { PlanFirstOrchestrator } from '@/orchestration/plan-first-opera.js';

const orchestrator = new PlanFirstOrchestrator();

const plan = await orchestrator.createPlan({
  goal: 'Add user authentication with JWT',
  requirements: {
    businessNeeds: 'Users can sign up, log in, access protected routes',
    technicalConstraints: ['Use bcrypt', 'JWT with 24h expiry'],
    acceptanceCriteria: [
      'User can sign up with email/password',
      'User can log in and receive token',
      'Protected routes require auth'
    ]
  }
});

// Plan structure:
// phases: [
//   { phase: 'Database Setup', agents: ['Dana-Database'] },
//   { phase: 'API Implementation', agents: ['Marcus-Backend'] },
//   { phase: 'Frontend UI', agents: ['James-Frontend'] },
//   { phase: 'Testing', agents: ['Maria-QA'] }
// ]

// Present to user for approval
console.log(`Plan: ${plan.metadata.estimatedTime} hours`);
if (await getUserApproval(plan)) {
  await orchestrator.executePlan(plan);
}
```

### Pattern 2: Parallel Task Execution
```typescript
import { ParallelTaskManager } from '@/orchestration/parallel-task-manager.js';

const manager = new ParallelTaskManager({ maxConcurrency: 3 });

const tasks = [
  { id: 'task-1', description: 'Create LoginForm', agent: 'James-Frontend', estimatedDuration: 30 },
  { id: 'task-2', description: 'Create SignupForm', agent: 'James-Frontend', estimatedDuration: 30 },
  { id: 'task-3', description: 'Write unit tests', agent: 'Maria-QA', estimatedDuration: 20 }
];

// Execute in parallel (saves 40 minutes vs sequential)
const results = await manager.executeTasks(tasks);
```

### Pattern 3: Tech Stack-Aware Routing
```typescript
import { StackAwareOrchestrator } from '@/orchestration/stack-aware-orchestrator.js';

const orchestrator = new StackAwareOrchestrator();

// Detect tech stack
const stack = await orchestrator.detectStack();
// { frontend: 'react', backend: 'node', database: 'postgresql' }

// Route to appropriate sub-agents
const frontendAgent = orchestrator.selectFrontendAgent(stack.frontend);
// Returns: james-react-frontend (instead of generic James-Frontend)
```

## Important Gotchas

### Gotcha 1: Circular Dependencies Break Execution
**Problem**: Tasks with circular dependencies (A → B, B → A) cause deadlock

**Solution**: Validate dependency graph before execution
```typescript
// ✅ Good - Validate graph first
import { validateDependencyGraph } from '@/orchestration/parallel-task-manager.js';

const validation = validateDependencyGraph(tasks);
if (!validation.valid) {
  throw new Error(`Circular dependencies: ${validation.cycles.join(', ')}`);
}
```

### Gotcha 2: Human Checkpoint Timeout
**Problem**: Plan execution blocks indefinitely waiting for user approval

**Solution**: Add timeout with auto-cancel
```typescript
// ✅ Good - Timeout with cancellation
const approved = await orchestrator.waitForCheckpointApproval(checkpoint, {
  timeout: 300000, // 5 minutes
  onTimeout: () => orchestrator.rollback()
});
```

### Gotcha 3: Parallel Tasks Exceeding Concurrency
**Problem**: Too many concurrent tasks overwhelm system resources

**Solution**: Use ParallelTaskManager with maxConcurrency
```typescript
// ✅ Good - Limit to 3 concurrent tasks
const manager = new ParallelTaskManager({ maxConcurrency: 3 });
const results = await manager.executeTasks(tasks);
```

## Performance Targets

- **Plan generation**: < 2s for 10 tasks
- **Parallel execution**: 40% time savings vs sequential
- **Dependency resolution**: < 100ms for 50 tasks

### Optimization Tips
- Batch agent calls (group similar tasks to same agent)
- Cache tech stack detection (detect once per project)
- Lazy load orchestrators (only instantiate when needed)

## Testing Guidelines

### Coverage Requirements
- Minimum: 80% (Enhanced Maria-QA standard)
- Critical paths: 85%+ (plan generation, execution, rollback)
- Focus: PlanFirstOrchestrator.createPlan(), ParallelTaskManager.executeTasks()

### Common Test Pattern
```typescript
describe('orchestration - PlanFirstOrchestrator', () => {
  it('should generate multi-phase plan with dependencies', async () => {
    const plan = await orchestrator.createPlan({
      goal: 'Add user authentication',
      businessNeeds: 'Secure user access',
      acceptanceCriteria: ['Users can log in']
    });

    expect(plan.phases).toHaveLength(4); // DB, API, Frontend, Testing
    expect(plan.phases[0].agents).toContain('Dana-Database');
    expect(plan.phases[1].dependencies).toContain(plan.phases[0].phase);
  });
});
```

## Debugging Tips

### Common Issues
1. **Plan generation too slow**: Enable `DEBUG=orchestration:*` to see bottlenecks
2. **Tasks not running in parallel**: Check dependencies - may have hidden conflicts
3. **Checkpoint not firing**: Verify HumanCheckpoint.condition evaluates correctly

### Debug Logging
```typescript
// Enable debug mode
process.env.DEBUG = 'orchestration:*';

// Listen to events
orchestrator.on('phase-started', (phase) => console.log('Phase:', phase.phase));
orchestrator.on('task-completed', (task) => console.log('Task done:', task.id));
```

## Related Documentation

For detailed orchestration guides:
- [references/plan-first-pattern.md](references/plan-first-pattern.md) - Plan-First methodology
- [references/parallel-execution.md](references/parallel-execution.md) - Concurrent task patterns
- [references/dependency-resolution.md](references/dependency-resolution.md) - Dependency graph algorithms
- [references/checkpoint-system.md](references/checkpoint-system.md) - Human-in-the-loop patterns

For command implementations:
- [.claude/commands/plan.md](../../.claude/commands/plan.md) - /plan command using PlanFirstOrchestrator
- [.claude/commands/work.md](../../.claude/commands/work.md) - /work command using task execution
- [.claude/commands/delegate.md](../../.claude/commands/delegate.md) - /delegate command using routing

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/orchestration/**`
