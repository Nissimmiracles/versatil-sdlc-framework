# planning/ - Todo Generation & Dependency Management

**Priority**: HIGH
**Agent(s)**: Sarah-PM (primary owner), all agents (consumers)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Generates persistent todo files (todos/*.md) from plan breakdowns. Implements dual todo system (TodoWrite + persistent files), dependency graph generation (Mermaid), and execution wave detection (parallel vs sequential).

## 🎯 Core Concepts

### Key Abstractions
- **TodoFileGenerator**: Creates numbered todo files (001-pending-p1-*.md)
- **ExecutionWave**: Groups todos that can run in parallel vs sequentially
- **TodoFileSpec**: Specification for single todo (title, priority, agent, dependencies)
- **DependencyGraph**: Mermaid diagram showing todo relationships

### Design Patterns
- **Dual System**: TodoWrite (ephemeral) + persistent .md files
- **Numbering Convention**: 001-pending-p1-feature-name.md
- **Wave Detection**: Analyze dependencies to find parallel opportunities

## ✅ Development Rules

### DO ✓
- ✓ **Always create persistent files** - todos survive session restarts
- ✓ **Use template** - todos/000-pending-p1-TEMPLATE.md for consistency
- ✓ **Detect parallel waves** - maximize concurrent execution
- ✓ **Generate Mermaid graphs** - visualize dependencies

### DON'T ✗
- ✗ **Don't skip dependency analysis** - required for wave detection
- ✗ **Don't hardcode todo numbers** - use getNextTodoNumber()
- ✗ **Don't forget activeForm** - TodoWrite requires both content + activeForm

## 🔧 Common Patterns

### Pattern: Generate Todos from Plan
```typescript
import { todoFileGenerator, TodoFileSpec } from '@/planning/todo-file-generator.js';

const specs: TodoFileSpec[] = [
  {
    title: 'Create database schema',
    priority: 'p1',
    assigned_agent: 'Dana-Database',
    estimated_effort: 'Medium',
    acceptance_criteria: ['Users table created', 'RLS policies added'],
    dependencies: { depends_on: [], blocks: ['002'] },
    implementation_notes: 'Use Supabase migrations',
    files_involved: ['migrations/001_users.sql'],
    context: { feature_description: 'User authentication system' }
  },
  {
    title: 'Create auth API endpoints',
    priority: 'p1',
    assigned_agent: 'Marcus-Backend',
    estimated_effort: 'Large',
    acceptance_criteria: ['/auth/signup works', '/auth/login works'],
    dependencies: { depends_on: ['001'], blocks: ['003'] },
    implementation_notes: 'JWT with 24h expiry',
    files_involved: ['src/api/auth.ts'],
    context: { feature_description: 'User authentication system' }
  }
];

const result = await todoFileGenerator.generateTodos(specs);

console.log(`Created ${result.files_created.length} todo files`);
console.log(`Total effort: ${result.total_estimated_hours}h`);
console.log(`Execution waves: ${result.execution_waves.length}`);
console.log(result.dependency_graph); // Mermaid diagram
```

## ⚠️ Gotchas

### Gotcha: Circular Dependencies
**Problem**: Todo A depends on B, B depends on A → infinite loop
**Solution**: Validate dependency graph before generation

```typescript
// ❌ Bad - Creates circular dependency
const specs = [
  { title: 'A', dependencies: { depends_on: ['002'], blocks: [] } },
  { title: 'B', dependencies: { depends_on: ['001'], blocks: [] } }
];

// ✅ Good - Detect cycles first
const validation = validateDependencies(specs);
if (validation.hasCycles) {
  throw new Error(`Circular dependencies: ${validation.cycles}`);
}
```

## 📚 Related Documentation
- [Todo Template](../../todos/000-pending-p1-TEMPLATE.md)
- [Todo File Convention](../../docs/TODO_FILE_CONVENTION.md)
- [/plan Command](.claude/commands/plan.md)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('planning')`
