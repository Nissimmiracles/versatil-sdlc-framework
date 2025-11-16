# Wave-Based Parallel Execution Guide

## Overview

The VERSATIL SDLC Framework implements **wave-based parallel execution** to achieve 40%+ time savings through intelligent task orchestration. Tasks are organized into sequential waves, where each wave can execute tasks in parallel while maintaining dependency order.

## Key Concepts

### What is a Wave?

A **wave** is a group of tasks that:
- Execute sequentially relative to other waves (Wave 1 → Wave 2 → Wave 3)
- Can execute tasks in parallel within the wave
- Share dependencies and coordination requirements
- Have quality gates and checkpoints

### Wave Structure

```typescript
interface Wave {
  wave_number: number;                    // Sequential wave number (1, 2, 3...)
  wave_name: string;                      // Descriptive name
  wave_duration_estimate: number;         // Estimated duration (minutes)
  parallel_execution: boolean;            // Enable parallel task execution
  tasks: string[];                        // Task IDs to execute
  agents: string[];                       // OPERA agents assigned
  dependencies: number[];                 // Required wave numbers
  coordination_checkpoint?: Checkpoint;   // Optional quality gate
}
```

## Time Savings Calculation

### Sequential vs Parallel Execution

**Sequential Execution** (No Waves):
```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5
Total: 15 + 20 + 15 + 10 + 20 = 80 minutes
```

**Wave-Based Parallel Execution**:
```
Wave 1 (Sequential):  Task 1                    = 15 min
Wave 2 (Parallel):    Task 2 + Task 3 + Task 4  = 20 min (max of 20, 15, 10)
Wave 3 (Sequential):  Task 5                    = 20 min
Total: 15 + 20 + 20 = 55 minutes

Time Savings: 25 minutes (31% faster)
```

### Formula

```typescript
sequential_time = sum(all_task_durations)
parallel_time = sum(wave_durations)  // Max task duration per wave
time_savings = sequential_time - parallel_time
percentage_faster = (time_savings / sequential_time) * 100
```

## Wave Execution Workflow

### 1. Plan Structure

```typescript
const waves: Wave[] = [
  {
    wave_number: 1,
    wave_name: 'Database Foundation',
    wave_duration_estimate: 15,
    parallel_execution: false,
    tasks: ['create-schema', 'create-migrations'],
    agents: ['Dana-Database', 'Dana-Database'],
    dependencies: [],
  },
  {
    wave_number: 2,
    wave_name: 'Backend + Frontend (Parallel)',
    wave_duration_estimate: 30,
    parallel_execution: true,
    tasks: ['build-api', 'build-ui', 'create-tests'],
    agents: ['Marcus-Backend', 'James-Frontend', 'Maria-QA'],
    dependencies: [1],  // Requires Wave 1 to complete
    coordination_checkpoint: {
      checkpoint_name: 'Development Complete',
      location: 'After Wave 2',
      blocking: true,
      quality_gates: ['All tests passing', 'Build successful'],
      validation_steps: ['pnpm test', 'pnpm build'],
    },
  },
  {
    wave_number: 3,
    wave_name: 'Deployment',
    wave_duration_estimate: 10,
    parallel_execution: false,
    tasks: ['deploy-staging', 'verify-deployment'],
    agents: ['Marcus-Backend', 'Maria-QA'],
    dependencies: [2],  // Requires Wave 2 to complete
  },
];
```

### 2. Execute Plan

```typescript
import { WaveExecutor } from '../src/orchestration/wave-executor.js';

const executor = new WaveExecutor();
const result = await executor.executePlan(waves);

console.log(`Waves Completed: ${result.waves_completed}/${waves.length}`);
console.log(`Time Savings: ${result.total_time_savings}ms (${result.percentage_faster.toFixed(1)}% faster)`);
```

### 3. Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Wave 1: Database Foundation                                 │
│ ┌─────────────────┐  ┌─────────────────────┐               │
│ │ create-schema   │→ │ create-migrations   │               │
│ │ Dana-Database   │  │ Dana-Database       │               │
│ └─────────────────┘  └─────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Wave 2: Backend + Frontend (Parallel)                       │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ build-api    │  │ build-ui     │  │ create-tests │       │
│ │ Marcus-Backend  │ James-Frontend  │ Maria-QA     │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│ ✓ Checkpoint: Development Complete                          │
│   - All tests passing ✓                                     │
│   - Build successful ✓                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Wave 3: Deployment                                           │
│ ┌──────────────────┐  ┌────────────────────┐               │
│ │ deploy-staging   │→ │ verify-deployment  │               │
│ │ Marcus-Backend   │  │ Maria-QA           │               │
│ └──────────────────┘  └────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Wave Dependencies

### Dependency Rules

1. **Dependencies must be satisfied before wave execution**
   ```typescript
   dependencies: [1, 2]  // Requires Waves 1 AND 2 to complete
   ```

2. **Waves execute in numerical order**
   - Wave 1 always executes first
   - Wave N waits for all dependencies

3. **Circular dependencies are not allowed**
   ```typescript
   // ❌ INVALID
   Wave 2: dependencies: [3]
   Wave 3: dependencies: [2]  // Circular!
   ```

### Dependency Validation

```typescript
// Automatic validation before execution
const waveResult = await executor.executeWave(wave);

// Check dependencies
const dependenciesSatisfied = wave.dependencies.every(depWave => {
  const depResult = executor.getWaveResult(depWave);
  return depResult && depResult.status === 'completed';
});

if (!dependenciesSatisfied) {
  console.log(`⛔ Wave ${wave.wave_number} blocked - dependencies not met`);
}
```

## Parallel Execution Strategies

### When to Use Parallel Execution

✅ **Use Parallel Execution When**:
- Tasks are independent (no file conflicts)
- Tasks target different agents
- Tasks modify different files
- Tasks are read-only operations

❌ **Avoid Parallel Execution When**:
- Tasks modify the same files
- Tasks have sequential dependencies
- Tasks share critical resources
- File collision risk is HIGH/CRITICAL

### Collision Detection Integration

The WaveExecutor automatically detects file collisions:

```typescript
// Automatic collision detection for parallel waves
if (wave.parallel_execution && wave.tasks.length > 1) {
  const collisionResult = await this.collisionDetector.detectCollisions(fileDependencies);

  if (collisionResult.require_serialization) {
    console.log('⚠️  HIGH COLLISION RISK DETECTED');
    console.log('   Forcing sequential execution to prevent merge conflicts\n');
    wave.parallel_execution = false;  // Override parallel flag
  }
}
```

**Risk Levels**:
- **NONE**: No file overlap → Allow parallel
- **LOW**: Read-only overlap → Allow parallel
- **MEDIUM**: Multiple creates → Reschedule
- **HIGH**: Multiple modifications → Force sequential
- **CRITICAL**: Delete + modify → Force sequential

## Agent Assignment

### Multi-Agent Coordination

```typescript
const wave: Wave = {
  wave_number: 2,
  wave_name: 'Full-Stack Development',
  wave_duration_estimate: 45,
  parallel_execution: true,
  tasks: [
    'design-database-schema',
    'implement-api-endpoints',
    'build-ui-components',
    'write-integration-tests',
  ],
  agents: [
    'Dana-Database',      // Database expert
    'Marcus-Backend',     // API specialist
    'James-Frontend',     // UI/UX specialist
    'Maria-QA',          // Testing expert
  ],
  dependencies: [1],
};
```

### Agent Specialization

| Agent | Specialization | Typical Tasks |
|-------|---------------|---------------|
| **Dana-Database** | Database design, migrations, RLS policies | Schema design, query optimization |
| **Marcus-Backend** | API design, backend logic, security | REST/GraphQL APIs, authentication |
| **James-Frontend** | UI/UX, accessibility, performance | React components, responsive design |
| **Maria-QA** | Testing, quality gates, validation | Unit/E2E tests, coverage checks |

## Coordination Checkpoints

### Purpose

Checkpoints enforce quality gates between waves:
- Validate tests pass before deployment
- Ensure builds succeed before merging
- Check security scans before release
- Verify performance before production

### Checkpoint Structure

```typescript
coordination_checkpoint: {
  checkpoint_name: 'Pre-Deployment Quality Gate',
  location: 'After Wave 2',
  blocking: true,  // Stop execution if failed
  quality_gates: [
    'All tests passing',
    'Code coverage >= 80%',
    'Security scan clean',
    'Build successful',
  ],
  validation_steps: [
    'pnpm test',
    'pnpm test:coverage',
    'pnpm audit',
    'pnpm build',
  ],
  handoff_agents: [
    {
      from: 'Marcus-Backend',
      to: 'Maria-QA',
      context: 'API ready for testing',
    },
  ],
}
```

### Blocking vs Warning Checkpoints

**Blocking Checkpoint** (`blocking: true`):
```
✅ Checkpoint Passed → Continue to next wave
❌ Checkpoint Failed → STOP execution, fix issues
```

**Warning Checkpoint** (`blocking: false`):
```
✅ Checkpoint Passed → Continue to next wave
⚠️  Checkpoint Failed → Log warning, continue anyway
```

## Performance Optimization

### Maximizing Parallel Efficiency

1. **Group Independent Tasks**
   ```typescript
   // ✅ Good: Independent tasks in parallel
   Wave 2 (parallel): ['api-auth', 'ui-login', 'db-users']

   // ❌ Bad: Dependent tasks in parallel
   Wave 2 (parallel): ['create-table', 'seed-table', 'query-table']
   ```

2. **Balance Wave Duration**
   ```typescript
   // ✅ Good: Similar duration tasks
   Wave 2 (20 min): ['task-a:20min', 'task-b:18min', 'task-c:19min']

   // ❌ Bad: Unbalanced duration
   Wave 2 (60 min): ['task-a:5min', 'task-b:60min', 'task-c:10min']
   // Wave limited by slowest task (60min)
   ```

3. **Minimize Dependencies**
   ```typescript
   // ✅ Good: Minimal dependencies
   Wave 1: [] → Wave 2: [1] → Wave 3: [2]

   // ❌ Bad: Over-constrained
   Wave 1: [] → Wave 2: [1] → Wave 3: [1,2] → Wave 4: [1,2,3]
   ```

### Time Savings Examples

**Example 1: Full-Stack Feature**
```
Sequential: 15 + 20 + 30 + 15 + 20 = 100 minutes

Wave-Based:
  Wave 1 (DB):       15 min
  Wave 2 (BE+FE+QA): 30 min  (parallel: max of 20, 30, 15)
  Wave 3 (Deploy):   20 min
  Total:             65 minutes

Savings: 35 minutes (35% faster)
```

**Example 2: Microservices Development**
```
Sequential: 8 services × 30 min = 240 minutes

Wave-Based:
  Wave 1 (Foundation):    30 min
  Wave 2 (4 services):    30 min  (parallel)
  Wave 3 (4 services):    30 min  (parallel)
  Wave 4 (Integration):   20 min
  Total:                  110 minutes

Savings: 130 minutes (54% faster)
```

## Best Practices

### ✅ DO

- **Use meaningful wave names**: "Database Setup" vs "Wave 1"
- **Set realistic duration estimates**: Based on historical data
- **Enable parallel execution** when tasks are independent
- **Add checkpoints** at critical transitions
- **Document agent handoffs** with clear context
- **Test collision detection** before production use

### ❌ DON'T

- **Don't over-parallelize**: Balance parallelism with complexity
- **Don't skip checkpoints**: Quality gates prevent rework
- **Don't ignore collision warnings**: HIGH risk = merge conflicts
- **Don't create circular dependencies**: Breaks execution flow
- **Don't mix sequential/parallel** tasks in same wave without reason

## Troubleshooting

### Wave Execution Blocked

**Problem**: Wave won't execute
```
⛔ Wave 3 BLOCKED - dependencies not met
```

**Solution**: Check dependency satisfaction
```typescript
// Verify all dependencies completed
wave.dependencies.forEach(depWave => {
  const result = executor.getWaveResult(depWave);
  console.log(`Wave ${depWave}: ${result?.status}`);
});
```

### Checkpoint Failures

**Problem**: Checkpoint blocking execution
```
❌ Checkpoint Failed: "All tests passing"
   Quality gate failed: Tests
```

**Solution**:
1. Review validation step output
2. Fix failing tests
3. Re-run wave execution
4. Consider making checkpoint non-blocking if appropriate

### Performance Not Improving

**Problem**: Parallel execution not saving time

**Common Causes**:
1. **Unbalanced tasks**: One slow task limits wave
   - **Fix**: Split slow tasks into smaller units

2. **Too many dependencies**: Waves can't parallelize
   - **Fix**: Reduce dependency constraints

3. **Collision detection forcing sequential**
   - **Fix**: Reduce file conflicts, split tasks

## Integration with /work Command

The `/work` command automatically generates wave-based execution plans:

```bash
/work "Build authentication system with OAuth2"
```

**Generated Plan**:
```typescript
{
  execution_waves: [
    {
      wave_number: 1,
      wave_name: 'Database Setup',
      parallel_execution: false,
      tasks: ['create-users-table', 'add-oauth-fields'],
      agents: ['Dana-Database', 'Dana-Database'],
      ...
    },
    {
      wave_number: 2,
      wave_name: 'Backend + Frontend (Parallel)',
      parallel_execution: true,
      tasks: ['oauth-api', 'login-ui'],
      agents: ['Marcus-Backend', 'James-Frontend'],
      dependencies: [1],
      ...
    },
  ],
  ...
}
```

## Monitoring and Reporting

### Execution Progress

```typescript
executor.on('wave:start', (waveNumber) => {
  console.log(`🌊 Starting Wave ${waveNumber}...`);
});

executor.on('wave:complete', (waveNumber, result) => {
  console.log(`✅ Wave ${waveNumber} completed in ${result.actual_duration}ms`);
});

executor.on('checkpoint:start', (checkpoint) => {
  console.log(`🔍 Validating checkpoint: ${checkpoint.checkpoint_name}`);
});
```

### Final Report

```typescript
const result = await executor.executePlan(waves);

console.log(`
═══════════════════════════════════════════════════════════════
WAVE EXECUTION COMPLETE
═══════════════════════════════════════════════════════════════

Overall Status:        ${result.overall_status.toUpperCase()}
Waves Completed:       ${result.waves_completed}/${waves.length}
Waves Failed/Blocked:  ${result.waves_failed}

Sequential Time:       ${result.sequential_time}ms
Parallel Time:         ${result.parallel_time}ms
Time Savings:          ${result.total_time_savings}ms
Percentage Faster:     ${result.percentage_faster.toFixed(1)}%

═══════════════════════════════════════════════════════════════
`);
```

## Advanced Topics

### Custom Wave Strategies

```typescript
// Strategy 1: Progressive parallelization
const waves = [
  { wave_number: 1, parallel_execution: false, tasks: ['foundation'] },
  { wave_number: 2, parallel_execution: true,  tasks: ['layer-1a', 'layer-1b'] },
  { wave_number: 3, parallel_execution: true,  tasks: ['layer-2a', 'layer-2b', 'layer-2c'] },
];

// Strategy 2: Mixed execution
const waves = [
  { wave_number: 1, parallel_execution: true,  tasks: ['setup-a', 'setup-b', 'setup-c'] },
  { wave_number: 2, parallel_execution: false, tasks: ['critical-step'] },  // Must be sequential
  { wave_number: 3, parallel_execution: true,  tasks: ['finalize-a', 'finalize-b'] },
];
```

### Dynamic Wave Generation

```typescript
// Generate waves based on task dependencies
function generateWaves(tasks: Task[]): Wave[] {
  const waves: Wave[] = [];
  let waveNumber = 1;

  // Group tasks by dependency level
  const tasksByLevel = groupByDependencyLevel(tasks);

  for (const [level, levelTasks] of tasksByLevel) {
    const canParallelize = levelTasks.every(t => !hasFileConflicts(t, levelTasks));

    waves.push({
      wave_number: waveNumber++,
      wave_name: `Level ${level}`,
      parallel_execution: canParallelize,
      tasks: levelTasks.map(t => t.id),
      agents: levelTasks.map(t => t.agent),
      dependencies: level > 0 ? [level] : [],
    });
  }

  return waves;
}
```

## Summary

Wave-based parallel execution delivers:

✅ **40%+ time savings** through intelligent parallelization
✅ **Automatic collision detection** prevents merge conflicts
✅ **Quality gates and checkpoints** ensure code quality
✅ **Agent coordination** leverages specialist expertise
✅ **Dependency management** maintains execution order
✅ **Production-ready** workflows with rollback support

**Next Steps**:
- [Coordination Checkpoints Guide](./COORDINATION_CHECKPOINTS.md)
- [Conflict Detection Guide](./CONFLICT_DETECTION.md)
- [Agent Orchestration Patterns](/docs/VERSATIL_ARCHITECTURE.md)
