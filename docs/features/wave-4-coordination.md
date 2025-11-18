# Wave 4 Coordination Patterns

**Status**: ✅ Production Ready (v7.16.2+)
**Impact**: 2-3x faster development through parallel multi-agent execution

---

## 🌊 Overview

Wave 4 Coordination Patterns enable **parallel multi-agent execution** with intelligent conflict resolution, state management, and dependency coordination. Instead of sequential execution (Dana → Marcus → James), agents work simultaneously with automatic synchronization.

### Key Benefits

| Traditional Sequential | Wave 4 Parallel |
|----------------------|-----------------|
| ⏱️ **125 minutes** total | ⏱️ **45-60 minutes** total |
| 🔄 1 agent at a time | 🔄 3+ agents in parallel |
| ❌ Manual coordination | ✅ Automatic coordination |
| ❌ No conflict detection | ✅ Built-in collision prevention |
| ❌ No state recovery | ✅ Checkpoint-based recovery |

---

## 🏗️ Architecture

### Core Components

```typescript
Wave 4 Coordination System
├── Wave Executor       // Parallel task execution
├── Collision Detector  // Conflict prevention
├── Checkpoint Manager  // State persistence
└── Dependency Resolver // Task ordering
```

### 1. Wave Executor

**Purpose**: Orchestrates parallel execution of related tasks in coordinated "waves"

```typescript
interface Wave {
  id: string;
  tasks: Task[];
  dependencies: string[]; // Wave IDs this wave depends on
  agents: Agent[];        // Agents assigned to this wave
  status: 'pending' | 'running' | 'completed' | 'failed';
}
```

**Example**:
```yaml
Wave 1 (Preparation):
  - Alex-BA: Define API contract
  - Sarah-PM: Create project structure

Wave 2 (Parallel Development):
  - Dana-Database: Schema design
  - Marcus-Backend: API with mocks
  - James-Frontend: UI with mocks

Wave 3 (Integration):
  - Dana → Marcus: Connect real DB
  - Marcus → James: Connect real API

Wave 4 (Quality):
  - Maria-QA: E2E testing
  - Victor-Verifier: Verification
```

### 2. Collision Detector

**Purpose**: Prevents agent conflicts through file and resource locking

**Detection Strategies**:
1. **File-level locks**: Track which agent is modifying which files
2. **Directory-level locks**: Prevent multiple agents in same module
3. **Resource locks**: Database connections, API endpoints, etc.

```typescript
interface ResourceLock {
  resource: string;      // File path, DB table, API endpoint
  agent: string;         // Agent holding the lock
  operation: 'read' | 'write';
  timestamp: number;
  expiresAt: number;     // Auto-release after timeout
}
```

**Collision Prevention Example**:
```typescript
// Marcus tries to modify user.service.ts
// James already has write lock on user.service.ts
// Collision Detector: BLOCKS Marcus, queues for later
// When James completes → Marcus proceeds
```

### 3. Checkpoint Manager

**Purpose**: Enable workflow resumption from last successful state

**Checkpoint Structure**:
```typescript
interface Checkpoint {
  id: string;
  waveId: string;
  timestamp: number;
  state: {
    completedTasks: string[];
    completedWaves: string[];
    pendingTasks: string[];
    agentStates: Map<string, AgentState>;
    resourceLocks: ResourceLock[];
  };
  metadata: {
    filesModified: string[];
    testsRun: string[];
    errors: Error[];
  };
}
```

**Recovery Workflow**:
```bash
# System crashes during Wave 2
# On restart:
1. Load last checkpoint (Wave 1 completed)
2. Restore agent states
3. Resume from Wave 2 start
4. Re-acquire necessary locks
5. Continue execution
```

### 4. Dependency Resolver

**Purpose**: Automatically order tasks based on dependencies

**Dependency Types**:
- **Data dependency**: Task B needs output from Task A
- **Resource dependency**: Both need exclusive access to resource
- **Agent dependency**: Sub-agent must wait for parent agent

**Resolution Algorithm**:
```typescript
function resolveWaveOrder(tasks: Task[]): Wave[] {
  // 1. Build dependency graph
  const graph = buildDependencyGraph(tasks);

  // 2. Topological sort
  const sorted = topologicalSort(graph);

  // 3. Group into parallel waves
  const waves = [];
  while (sorted.length > 0) {
    // Find all tasks with no dependencies
    const parallelTasks = sorted.filter(t =>
      t.dependencies.every(d => isCompleted(d))
    );

    waves.push({
      tasks: parallelTasks,
      agents: assignAgents(parallelTasks)
    });

    sorted = sorted.filter(t => !parallelTasks.includes(t));
  }

  return waves;
}
```

---

## 🎯 Usage Patterns

### Pattern 1: Full-Stack Feature Development

**Use Case**: Build complete feature (DB + API + UI) in parallel

```bash
/work "Add user authentication feature"
```

**Automatic Wave Generation**:
```yaml
Wave 1 (Requirements - Serial):
  Duration: 10 min
  Tasks:
    - Alex-BA: Define auth requirements
    - Alex-BA: Design API contract
    - Sarah-PM: Create task breakdown

Wave 2 (Development - Parallel):
  Duration: 45 min (vs 120 min serial)
  Tasks:
    - Dana-Database:
        * users table schema
        * auth_tokens table
        * RLS policies
    - Marcus-Backend:
        * /auth/login endpoint (mocked DB)
        * /auth/register endpoint
        * JWT middleware
    - James-Frontend:
        * Login component (mocked API)
        * Register component
        * Auth context

Wave 3 (Integration - Serial):
  Duration: 15 min
  Tasks:
    - Dana → Marcus: Connect real database
    - Marcus → James: Connect real API
    - Integration smoke tests

Wave 4 (Quality - Parallel):
  Duration: 20 min
  Tasks:
    - Maria-QA: E2E auth flow tests
    - Victor-Verifier: Security verification
    - Maria-QA: Coverage validation (80%+)
```

**Result**: 90 minutes total (vs 180 minutes sequential)

### Pattern 2: Schema Migration with Zero Downtime

**Use Case**: Update database schema across all layers

```bash
/work "Add email verification to user table"
```

**Wave Execution**:
```yaml
Wave 1 (Database):
  - Dana: Create migration (add email_verified column)
  - Dana: Update seed data
  - Dana: Test migration rollback

Wave 2 (Backend - waits for Wave 1):
  - Marcus: Update User TypeScript types
  - Marcus: Add email verification endpoint
  - Marcus: Update existing queries

Wave 3 (Frontend - waits for Wave 2):
  - James: Update User interface
  - James: Add verification UI component
  - James: Update API client

Wave 4 (Deployment):
  - Database migration first
  - Backend deploy second
  - Frontend deploy third
```

### Pattern 3: Bug Fix Across Stack

**Use Case**: Fix authentication bug affecting all layers

```bash
/work "Fix: Token refresh not working"
```

**Parallel Investigation**:
```yaml
Wave 1 (Investigation - Parallel):
  - Dana: Check token expiry in database
  - Marcus: Debug token refresh endpoint
  - James: Test UI token refresh flow
  - Victor: Verify JWT validation logic

Wave 2 (Fix - Based on findings):
  - [Determined: Issue in Marcus backend]
  - Marcus: Fix token refresh logic
  - Marcus: Add refresh token tests

Wave 3 (Validation - Parallel):
  - Dana: Verify DB queries
  - Marcus: Run backend tests
  - James: Test UI integration
  - Maria: E2E regression tests
```

---

## 🔧 Configuration

### Enable Wave 4 Coordination

```typescript
// .versatil/config.ts
export default {
  coordination: {
    enableWave4: true,

    // Collision detection
    collisionDetection: {
      enabled: true,
      lockTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      retryDelay: 5000
    },

    // Checkpoints
    checkpoints: {
      enabled: true,
      interval: 60000, // Every minute
      maxCheckpoints: 10,
      autoRecover: true
    },

    // Parallelization
    parallel: {
      maxConcurrentAgents: 5,
      maxConcurrentWaves: 2
    }
  }
}
```

### Slash Command Integration

Wave 4 is automatically used by:
- `/work [task]` - Auto-generates waves
- `/plan [feature]` - Shows wave breakdown
- `/assess [task]` - Analyzes parallelization opportunities

---

## 📊 Performance Metrics

### Real-World Benchmarks

| Feature Type | Sequential | Wave 4 Parallel | Speedup |
|--------------|-----------|-----------------|---------|
| **Auth System** | 180 min | 90 min | **2.0x** |
| **CRUD Feature** | 120 min | 45 min | **2.7x** |
| **Bug Fix** | 60 min | 25 min | **2.4x** |
| **Schema Change** | 90 min | 40 min | **2.3x** |

### Agent Utilization

```
Sequential Execution:
Dana:   ████████░░░░░░░░░░░░ (40% idle)
Marcus: ░░░░░░░░████████░░░░ (60% idle)
James:  ░░░░░░░░░░░░░░░░████ (80% idle)

Wave 4 Parallel:
Dana:   ████████████████░░░░ (20% idle)
Marcus: ████████████████░░░░ (20% idle)
James:  ████████████████░░░░ (20% idle)
```

---

## 🛡️ Safety Guarantees

### 1. Data Consistency

- **Resource Locking**: Prevents write conflicts
- **Transaction Support**: Atomic operations
- **Rollback Capability**: Undo on errors

### 2. Conflict Resolution

- **Automatic Detection**: File and resource conflicts
- **Queue Management**: Serialize conflicting operations
- **Priority Handling**: Critical agents get precedence

### 3. Error Recovery

- **Checkpoint Restore**: Resume from last good state
- **Partial Rollback**: Undo failed wave only
- **Error Isolation**: Failing agent doesn't block others

---

## 🔍 Debugging

### View Wave Execution

```bash
# Show current waves
/guardian-logs wave-execution --tail

# Show collision events
/guardian-logs collision-detection --filter="blocked"

# Show checkpoint history
/guardian-logs checkpoints --tail=20
```

### Common Issues

**Issue**: Agents blocked by collision detection
```bash
# Check locks
cat ~/.versatil/logs/resource-locks.json

# Force release (use carefully)
versatil-daemon release-locks --agent=Marcus-Backend
```

**Issue**: Checkpoint recovery failing
```bash
# List checkpoints
versatil-daemon list-checkpoints

# Manual restore
versatil-daemon restore-checkpoint [checkpoint-id]
```

---

## 🚀 Best Practices

### 1. Design for Parallelization

✅ **DO**: Use mocks for parallel development
```typescript
// Dana creates schema
// Marcus uses mock DB
// James uses mock API
// Integrate later
```

❌ **DON'T**: Create hard dependencies
```typescript
// Marcus waits for Dana
// James waits for Marcus
// Serial execution (slow)
```

### 2. Minimize Shared Resources

✅ **DO**: Separate concerns clearly
```typescript
Dana:   db/schema.ts, db/migrations/
Marcus: api/routes/, api/services/
James:  ui/components/, ui/pages/
```

❌ **DON'T**: Multiple agents in same files
```typescript
All:    shared/utils.ts (collision risk!)
```

### 3. Use Checkpoints for Long Operations

```typescript
// Long-running migration
async function migrateDatabase() {
  await checkpoint('migration-start');

  await step1(); // 10 min
  await checkpoint('migration-step1');

  await step2(); // 10 min
  await checkpoint('migration-step2');

  await step3(); // 10 min
  await checkpoint('migration-complete');
}
```

---

## 📚 Additional Resources

- [Wave 4 API Reference](../reference/wave-4-api.md)
- [Agent Coordination Guide](../agents/coordination.md)
- [Collision Detection Details](./collision-detection.md)
- [Checkpoint System](./checkpoint-system.md)

---

**Next**: [Test Remediation Guide](./test-remediation.md)
