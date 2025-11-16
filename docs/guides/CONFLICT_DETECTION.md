# File Conflict Detection Guide

## Overview

The **CollisionDetector** service automatically detects file conflicts between parallel tasks to prevent merge conflicts and data loss. It analyzes file dependencies, calculates collision risk levels, and auto-serializes high-risk operations.

## The Problem: Parallel Execution Conflicts

### Without Conflict Detection

```
Wave 2 (Parallel):
  Task A: Modify src/api/auth.ts
  Task B: Modify src/api/auth.ts  ← CONFLICT!
  Task C: Delete src/api/auth.ts  ← CRITICAL CONFLICT!

Result:
  - Merge conflicts
  - Lost changes
  - Data corruption
  - Wasted developer time
```

### With Conflict Detection

```
Wave 2 (Parallel Requested):
  ⚠️  HIGH COLLISION RISK DETECTED
  File: src/api/auth.ts
  Operations: Task A (modify), Task B (modify), Task C (delete)
  Risk Level: CRITICAL

  ✓ Forcing sequential execution to prevent conflicts
  ✓ Task A → Task B → Task C (safe execution order)
```

## Collision Risk Levels

The CollisionDetector uses a 5-level risk assessment:

| Risk Level | Operations | Behavior | Example |
|-----------|-----------|----------|---------|
| **NONE** | No overlap or read-only | Allow parallel | Tasks access different files |
| **LOW** | Write with concurrent reads | Allow parallel | Task A modifies, Task B reads |
| **MEDIUM** | Multiple creates of same file | Reschedule | Tasks both create `test.ts` |
| **HIGH** | Multiple modifications | Force sequential | Tasks both modify `auth.ts` |
| **CRITICAL** | Delete + modify/create | Force sequential | Task A deletes, Task B modifies |

### Risk Level Details

#### NONE Risk (Safe Parallel)

**Conditions**:
- Tasks access completely different files
- All tasks perform read-only operations

**Action**: Allow parallel execution

**Example**:
```typescript
Task 1: Modify src/api/auth.ts
Task 2: Modify src/components/Login.tsx
Task 3: Read config.json

Risk: NONE
Resolution: ALLOW_PARALLEL ✓
```

#### LOW Risk (Safe Parallel)

**Conditions**:
- One task writes, others read
- No destructive operations

**Action**: Allow parallel with monitoring

**Example**:
```typescript
Task 1: Modify src/database/schema.ts
Task 2: Read src/database/schema.ts
Task 3: Read src/database/schema.ts

Risk: LOW
Resolution: ALLOW_PARALLEL ✓
Reason: Write operation with concurrent reads (safe)
```

#### MEDIUM Risk (Reschedule Recommended)

**Conditions**:
- Multiple tasks create the same file
- Potential for overwriting

**Action**: Reschedule to different waves

**Example**:
```typescript
Task 1: Create tests/auth.test.ts
Task 2: Create tests/auth.test.ts

Risk: MEDIUM
Resolution: RESCHEDULE ⚠️
Recommendation: Move Task 2 to later wave
```

#### HIGH Risk (Force Sequential)

**Conditions**:
- Multiple tasks modify the same file
- High chance of merge conflicts

**Action**: Force sequential execution

**Example**:
```typescript
Task 1: Modify src/api/users.ts
Task 2: Modify src/api/users.ts
Task 3: Modify src/api/users.ts

Risk: HIGH
Resolution: SERIALIZE ⛔
Action: Convert wave to sequential execution
```

#### CRITICAL Risk (Manual Review)

**Conditions**:
- Delete operation conflicts with modify/create
- Destructive operation risks data loss

**Action**: Force sequential or require manual review

**Example**:
```typescript
Task 1: Delete src/api/old-auth.ts
Task 2: Modify src/api/old-auth.ts

Risk: CRITICAL
Resolution: SERIALIZE ⛔
Reason: Destructive operation conflict
```

## File Operation Types

The CollisionDetector tracks four operation types:

### 1. Read Operations

**Description**: Tasks that only read files without modification

**Safety**: Safe to parallelize with any operation (including writes)

**Examples**:
```typescript
files_read: [
  'config/app.json',
  'src/utils/constants.ts',
  '.env.example',
]
```

**Use Cases**:
- Reading configuration
- Importing types
- Analyzing code structure
- Documentation generation

### 2. Modify Operations

**Description**: Tasks that modify existing files

**Safety**: High collision risk with other modifications

**Examples**:
```typescript
files_modified: [
  'src/api/auth.ts',        // Update authentication logic
  'src/database/schema.ts',  // Add new fields
  'package.json',            // Update dependencies
]
```

**Use Cases**:
- Updating existing functions
- Refactoring code
- Fixing bugs
- Adding features to existing files

### 3. Create Operations

**Description**: Tasks that create new files

**Safety**: Medium collision risk if multiple tasks create same file

**Examples**:
```typescript
files_created: [
  'src/api/new-endpoint.ts',      // New API endpoint
  'tests/auth.test.ts',            // New test file
  'docs/api/authentication.md',    // New documentation
]
```

**Use Cases**:
- Adding new features
- Creating tests
- Generating documentation

### 4. Delete Operations

**Description**: Tasks that delete files

**Safety**: Critical collision risk with modify/create operations

**Examples**:
```typescript
files_deleted: [
  'src/api/deprecated-auth.ts',  // Remove old code
  'tests/obsolete.test.ts',       // Remove old tests
]
```

**Use Cases**:
- Removing deprecated code
- Cleaning up unused files
- Refactoring file structure

## Task File Dependencies

### Specifying Dependencies

```typescript
interface TaskFileDependency {
  task_id: string;              // Task identifier
  task_name: string;            // Descriptive name
  files_read: string[];         // Files to read
  files_modified: string[];     // Files to modify
  files_created: string[];      // Files to create
  files_deleted: string[];      // Files to delete
  agent: string;                // Assigned agent
}
```

### Example Dependencies

```typescript
const tasks: TaskFileDependency[] = [
  {
    task_id: 'task-backend',
    task_name: 'Build Authentication API',
    files_read: ['src/database/schema.ts'],
    files_modified: ['src/api/routes.ts'],
    files_created: ['src/api/auth.ts', 'src/middleware/auth.ts'],
    files_deleted: [],
    agent: 'Marcus-Backend',
  },
  {
    task_id: 'task-frontend',
    task_name: 'Build Login UI',
    files_read: [],
    files_modified: ['src/App.tsx'],
    files_created: ['src/components/Login.tsx', 'src/hooks/useAuth.ts'],
    files_deleted: [],
    agent: 'James-Frontend',
  },
  {
    task_id: 'task-database',
    task_name: 'Add User Table',
    files_read: [],
    files_modified: ['src/database/schema.ts'],
    files_created: ['migrations/001_create_users.sql'],
    files_deleted: [],
    agent: 'Dana-Database',
  },
];
```

## Collision Detection Workflow

### Step 1: Build File Access Map

```typescript
// Track all file operations
const fileAccessMap = new Map<string, Array<{
  task_id: string;
  operation: 'read' | 'modify' | 'create' | 'delete';
}>>();

// Example map:
{
  'src/database/schema.ts': [
    { task_id: 'task-backend', operation: 'read' },
    { task_id: 'task-database', operation: 'modify' },
  ],
  'src/api/auth.ts': [
    { task_id: 'task-backend', operation: 'create' },
  ],
}
```

### Step 2: Analyze File Collisions

For each file with multiple accessors:

```typescript
// Check operation types
const hasDelete = operations.some(op => op.operation === 'delete');
const hasModify = operations.some(op => op.operation === 'modify');
const hasCreate = operations.some(op => op.operation === 'create');
const onlyReads = operations.every(op => op.operation === 'read');

// Determine risk level
if (onlyReads) {
  risk = CollisionRisk.NONE;  // Safe
} else if (hasDelete && (hasModify || hasCreate)) {
  risk = CollisionRisk.CRITICAL;  // Dangerous!
} else if (hasModify && multipleModifications) {
  risk = CollisionRisk.HIGH;  // Merge conflicts likely
}
```

### Step 3: Determine Resolution Strategy

```typescript
enum ResolutionStrategy {
  ALLOW_PARALLEL = 'allow_parallel',     // Safe to run in parallel
  SERIALIZE = 'serialize',               // Force sequential execution
  RESCHEDULE = 'reschedule',             // Move to later wave
  MANUAL_REVIEW = 'manual_review',       // Human decision required
}

// Map risk to strategy
switch (risk) {
  case CollisionRisk.NONE:
  case CollisionRisk.LOW:
    return ResolutionStrategy.ALLOW_PARALLEL;

  case CollisionRisk.MEDIUM:
    return ResolutionStrategy.RESCHEDULE;

  case CollisionRisk.HIGH:
    return ResolutionStrategy.SERIALIZE;

  case CollisionRisk.CRITICAL:
    return ResolutionStrategy.SERIALIZE;  // or MANUAL_REVIEW
}
```

## Integration with Wave Execution

### Automatic Collision Detection

The WaveExecutor automatically checks for collisions:

```typescript
// Before executing parallel wave
if (wave.parallel_execution && wave.tasks.length > 1) {
  const fileDependencies: TaskFileDependency[] = tasks.map(task => ({
    task_id: task.id,
    task_name: task.name,
    files_read: task.metadata.files_read || [],
    files_modified: task.metadata.files_modified || [],
    files_created: task.metadata.files_created || [],
    files_deleted: task.metadata.files_deleted || [],
    agent: task.agentId || 'unknown',
  }));

  const collisionResult = await this.collisionDetector.detectCollisions(fileDependencies);

  // Auto-serialize on high risk
  if (collisionResult.require_serialization) {
    console.log('⚠️  HIGH COLLISION RISK DETECTED');
    console.log('   Forcing sequential execution to prevent merge conflicts\n');
    wave.parallel_execution = false;  // Override!
  }
}
```

### Collision Report

```typescript
const report = collisionDetector.generateCollisionReport(collisionResult);
console.log(report);
```

**Output**:
```
═══════════════════════════════════════════════════════════════
FILE COLLISION DETECTION REPORT
═══════════════════════════════════════════════════════════════

⚠️  Collision Detected: HIGH
   Conflicting Tasks: 2
   Conflicting Files: 1
   Resolution: serialize

Collision Details:

❌ File 1: src/api/auth.ts
   Tasks: task-1, task-2
   Reason: Multiple tasks modifying same file
   Operations:
      - task-1: MODIFY
      - task-2: MODIFY

Recommendations:
   ⚠️ Recommend sequential execution to avoid conflicts

═══════════════════════════════════════════════════════════════
```

## Practical Examples

### Example 1: Full-Stack Feature (No Conflicts)

```typescript
const tasks = [
  {
    task_id: 'db-schema',
    files_modified: ['src/database/schema.ts'],
    agent: 'Dana-Database',
  },
  {
    task_id: 'api-endpoints',
    files_created: ['src/api/users.ts'],
    agent: 'Marcus-Backend',
  },
  {
    task_id: 'ui-components',
    files_created: ['src/components/UserList.tsx'],
    agent: 'James-Frontend',
  },
];

const result = await detector.detectCollisions(tasks);

// Result:
{
  has_collision: false,
  risk: CollisionRisk.NONE,
  resolution: ResolutionStrategy.ALLOW_PARALLEL,
  require_serialization: false,
}
```

**Outcome**: ✅ Safe parallel execution - no file overlap

### Example 2: Same File Modifications (HIGH Risk)

```typescript
const tasks = [
  {
    task_id: 'add-authentication',
    files_modified: ['src/api/routes.ts'],
    agent: 'Marcus-Backend',
  },
  {
    task_id: 'add-rate-limiting',
    files_modified: ['src/api/routes.ts'],
    agent: 'Marcus-Backend',
  },
];

const result = await detector.detectCollisions(tasks);

// Result:
{
  has_collision: true,
  risk: CollisionRisk.HIGH,
  conflicting_files: ['src/api/routes.ts'],
  resolution: ResolutionStrategy.SERIALIZE,
  require_serialization: true,
}
```

**Outcome**: ⛔ Force sequential execution to prevent merge conflicts

### Example 3: Delete Conflict (CRITICAL Risk)

```typescript
const tasks = [
  {
    task_id: 'remove-old-auth',
    files_deleted: ['src/api/deprecated-auth.ts'],
    agent: 'Marcus-Backend',
  },
  {
    task_id: 'refactor-auth',
    files_modified: ['src/api/deprecated-auth.ts'],
    agent: 'Marcus-Backend',
  },
];

const result = await detector.detectCollisions(tasks);

// Result:
{
  has_collision: true,
  risk: CollisionRisk.CRITICAL,
  conflicting_files: ['src/api/deprecated-auth.ts'],
  details: [{
    file: 'src/api/deprecated-auth.ts',
    reason: 'Destructive operation conflict (delete + modify/create)',
  }],
  resolution: ResolutionStrategy.SERIALIZE,
  require_serialization: true,
}
```

**Outcome**: ⛔ Critical conflict - force sequential or manual review

### Example 4: Read-Only Access (NONE Risk)

```typescript
const tasks = [
  {
    task_id: 'analyze-api',
    files_read: ['src/api/auth.ts'],
    agent: 'Marcus-Backend',
  },
  {
    task_id: 'generate-docs',
    files_read: ['src/api/auth.ts'],
    agent: 'Alex-BA',
  },
  {
    task_id: 'test-api',
    files_read: ['src/api/auth.ts'],
    agent: 'Maria-QA',
  },
];

const result = await detector.detectCollisions(tasks);

// Result:
{
  has_collision: false,
  risk: CollisionRisk.NONE,
  resolution: ResolutionStrategy.ALLOW_PARALLEL,
  require_serialization: false,
}
```

**Outcome**: ✅ Read-only operations are always safe in parallel

## File Dependency Extraction

### Automatic Extraction from Metadata

The CollisionDetector can infer file dependencies from naming patterns:

```typescript
const taskMetadata = {
  task_id: 'task-1',
  task_name: 'Implement Auth',
  files_involved: [
    'src/api/auth.ts',          // Modified (no prefix)
    'new-login.tsx',             // Created (new- prefix)
    'delete-old-auth.ts',        // Deleted (delete- prefix)
    'read-config.json',          // Read (read- prefix)
  ],
};

const dependencies = detector.extractFileDependencies(taskMetadata);

// Result:
{
  files_read: ['read-config.json'],
  files_modified: ['src/api/auth.ts'],
  files_created: ['new-login.tsx'],
  files_deleted: ['delete-old-auth.ts'],
}
```

### Naming Conventions

| Prefix | Operation | Example |
|--------|-----------|---------|
| `new-` | Create | `new-component.tsx` |
| `create-` | Create | `create-test.ts` |
| `delete-` | Delete | `delete-old-file.ts` |
| `remove-` | Delete | `remove-deprecated.ts` |
| `read-` | Read | `read-config.json` |
| (none) | Modify | `auth.ts` |

## Best Practices

### ✅ DO

1. **Specify file dependencies explicitly**
   ```typescript
   ✅ Explicit:
   {
     files_modified: ['src/api/auth.ts', 'src/api/routes.ts'],
     files_created: ['src/middleware/auth.ts'],
   }

   ❌ Vague:
   {
     files_involved: ['src/api/*'],  // Too broad
   }
   ```

2. **Use specific file paths**
   ```typescript
   ✅ 'src/api/users.ts'
   ❌ 'src/**/*.ts'  // Wildcards not supported
   ```

3. **Split tasks with high collision risk**
   ```typescript
   ✅ Split:
   Task 1: Add authentication to routes.ts
   Task 2: Add rate limiting to routes.ts (later wave)

   ❌ Parallel:
   Task 1 + Task 2 in same wave → collision!
   ```

4. **Monitor collision reports**
   ```typescript
   if (collisionResult.has_collision) {
     console.log(collisionResult.details);
     // Review and adjust task dependencies
   }
   ```

### ❌ DON'T

1. **Don't ignore HIGH/CRITICAL warnings**
   ```typescript
   ❌ if (collisionResult.risk === CollisionRisk.HIGH) {
        // Ignore warning and proceed anyway
      }

   ✅ if (collisionResult.require_serialization) {
        wave.parallel_execution = false;  // Force sequential
      }
   ```

2. **Don't assume read operations are safe to modify**
   ```typescript
   ❌ Task A: Read config.json
       Task B: Modify config.json (parallel)
       // While LOW risk, can cause race conditions

   ✅ Task A → Task B (sequential if order matters)
   ```

3. **Don't use parallel execution for dependent tasks**
   ```typescript
   ❌ Wave 2 (parallel):
        Task: Create database schema
        Task: Seed database (depends on schema)

   ✅ Wave 2: Create schema
       Wave 3: Seed database
   ```

## Troubleshooting

### False Positives

**Problem**: Collision detected but tasks are actually independent

**Example**:
```typescript
Task 1: Modify src/api/auth.ts (line 1-50)
Task 2: Modify src/api/auth.ts (line 100-150)
// Same file, but different sections → false positive
```

**Solutions**:
1. **Split files**: Break large files into smaller modules
2. **Sequential execution**: Accept sequential as safer option
3. **Manual review**: Override with care if confident

### Missing Dependencies

**Problem**: Collision not detected, merge conflict occurs

**Cause**: File dependencies not specified

**Solution**:
```typescript
✅ Always specify file dependencies:
{
  files_modified: ['src/api/auth.ts'],  // ← Must be explicit
}
```

### Performance Impact

**Problem**: Collision detection slows down execution

**Mitigation**:
- Collision detection is O(n×m) where n=tasks, m=files
- Optimize for waves with <10 tasks
- Use caching for repeated collision checks

## Advanced Topics

### Custom Collision Rules

```typescript
class CustomCollisionDetector extends CollisionDetector {
  protected analyzeFileCollision(file: string, accessList: Access[]): CollisionAnalysis {
    // Custom logic for specific file patterns
    if (file.endsWith('.md')) {
      // Documentation files: lower risk
      return { has_collision: false, risk: CollisionRisk.NONE };
    }

    if (file.includes('/migrations/')) {
      // Database migrations: high risk
      return { has_collision: true, risk: CollisionRisk.CRITICAL };
    }

    return super.analyzeFileCollision(file, accessList);
  }
}
```

### Collision Metrics

```typescript
interface CollisionMetrics {
  total_tasks: number;
  total_files: number;
  collisions_detected: number;
  high_risk_collisions: number;
  serializations_forced: number;
  time_impact: number;  // Time lost to serialization
}
```

### Predictive Collision Detection

```typescript
// Analyze historical collision patterns
const historicalData = await loadCollisionHistory();
const prediction = predictCollisionRisk(tasks, historicalData);

if (prediction.risk > 0.7) {
  console.log('⚠️  High collision probability based on historical data');
}
```

## Summary

File Conflict Detection provides:

✅ **Automatic collision detection** for parallel tasks
✅ **5-level risk assessment** (NONE → LOW → MEDIUM → HIGH → CRITICAL)
✅ **Auto-serialization** for high-risk operations
✅ **Comprehensive reporting** with conflict details
✅ **Resolution strategies** (allow/serialize/reschedule/manual)
✅ **Integration** with wave execution workflow

**Key Benefits**:
- **Prevent merge conflicts** before they occur
- **Protect data integrity** with delete conflict detection
- **Maximize parallelism** while maintaining safety
- **Save developer time** by avoiding conflict resolution

**Next Steps**:
- [Wave Execution Guide](./WAVE_EXECUTION.md)
- [Coordination Checkpoints Guide](./COORDINATION_CHECKPOINTS.md)
- [OPERA Agent Architecture](/docs/VERSATIL_ARCHITECTURE.md)
