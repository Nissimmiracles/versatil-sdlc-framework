# Todo File Generator Service - Dual Todo System - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical - Dual todo system)
- **Created**: 2025-10-26
- **Assigned**: Sarah-PM + Marcus-Backend
- **Estimated Effort**: Medium (3 hours)

## Description

Create the Todo File Generator Service that creates persistent `todos/*.md` files from plan breakdowns, using auto-numbering and the template at `todos/000-pending-p1-TEMPLATE.md`. This enables dual todo tracking: TodoWrite (in-session) + persistent files (cross-session).

## Acceptance Criteria

- [ ] Create `src/planning/todo-file-generator.ts` with complete type definitions
- [ ] Auto-number files (get next number from existing todos)
- [ ] Load and populate template from `todos/000-pending-p1-TEMPLATE.md`
- [ ] Create dependency graph in Mermaid format
- [ ] Generate both TodoWrite items + file todos
- [ ] Link each TodoWrite item to file path
- [ ] Support parallel execution waves (todos with no dependencies)
- [ ] Handle priority assignment (P1/P2/P3/P4)
- [ ] Unit tests with mock plan data (80%+ coverage)

## Context

- **Related Issue**: #001 - Enhance /plan Command
- **Related PR**: TBD
- **Files Involved**:
  - `src/planning/todo-file-generator.ts` (new - ~250 lines)
  - `tests/planning/todo-file-generator.test.ts` (new - ~200 lines)
  - `todos/000-pending-p1-TEMPLATE.md` (existing - template to use)
  - `todos/README.md` (existing - dual system documentation)
- **References**:
  - Todo system spec: `todos/README.md`
  - Template: `todos/000-pending-p1-TEMPLATE.md`

## Dependencies

- **Depends on**: None (standalone service)
- **Blocks**:
  - 005 - Integration tests need this service
  - 006 - Plan command integration needs this service
- **Related to**: 001 - Master enhancement task

## Implementation Notes

### Type Definitions Required

```typescript
export interface TodoFileSpec {
  title: string;
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  assigned_agent: string;
  estimated_effort: 'Small' | 'Medium' | 'Large' | 'XL';
  acceptance_criteria: string[];
  dependencies: {
    depends_on: string[]; // Todo numbers: ["002", "003"]
    blocks: string[];
  };
  implementation_notes: string;
  files_involved: string[];
  context: {
    feature_description: string;
    related_issue?: string;
    related_pr?: string;
  };
}

export interface TodoGenerationResult {
  files_created: string[];
  todowrite_items: Array<{
    content: string;
    activeForm: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  dependency_graph: string; // Mermaid diagram
  total_estimated_hours: number;
}

export interface ExecutionWave {
  wave_number: number;
  todos: string[]; // Todo numbers
  can_run_parallel: boolean;
  estimated_hours: number;
}
```

### Suggested Approach

1. **Create TodoFileGenerator class**
   - Load template from `todos/000-pending-p1-TEMPLATE.md`
   - Get next todo number: `ls todos/ | grep -o '^[0-9]+' | sort -n | tail -1`
   - Parse plan breakdown into TodoFileSpec array

2. **Implement file generation**
   - For each TodoFileSpec:
     - Increment todo number
     - Populate template with spec data
     - Create file: `todos/[NUM]-pending-[PRIORITY]-[description].md`
     - Track dependencies (depends_on, blocks)

3. **Implement TodoWrite generation**
   - For each created file:
     - Create TodoWrite item with file path link
     - Set status based on dependencies
     - Use activeForm for in-progress display

4. **Implement dependency graph**
   - Analyze dependencies across all todos
   - Generate Mermaid diagram
   - Detect parallel execution waves
   - Calculate critical path

5. **Implement execution wave detection**
   - Wave 1: Todos with no dependencies
   - Wave 2: Todos that depend only on Wave 1
   - Wave N: Todos that depend on Wave N-1
   - Mark waves as parallel or sequential

### File Naming Convention

```
[NUMBER]-[STATUS]-[PRIORITY]-[SHORT-DESCRIPTION].md

Examples:
002-pending-p1-implement-auth-api.md
003-pending-p2-add-test-coverage.md
004-resolved-optimize-queries.md
```

### Template Population Fields

From `todos/000-pending-p1-TEMPLATE.md`:
- `[TITLE]` → TodoFileSpec.title
- `P[1-3]` → TodoFileSpec.priority
- `[YYYY-MM-DD]` → Current date
- `[Agent Name]` → TodoFileSpec.assigned_agent
- `[Small|Medium|Large|XL]` → TodoFileSpec.estimated_effort
- `[Clear description]` → TodoFileSpec.context.feature_description
- `[Criterion 1]` → TodoFileSpec.acceptance_criteria[0]
- `path/to/file1.ts` → TodoFileSpec.files_involved[0]
- `[TODO_NUMBER]` → TodoFileSpec.dependencies.depends_on[0]

### Potential Challenges

- **Challenge**: Todo numbering conflicts (multiple plans running)
  - **Mitigation**: Use file locking, atomic number increment, retry on conflict

- **Challenge**: Circular dependencies in todo graph
  - **Mitigation**: Detect cycles, warn user, suggest breaking dependencies

- **Challenge**: Too many todos (complexity explosion)
  - **Mitigation**: Group related tasks, limit to 10-15 todos max, suggest higher-level planning

## Testing Requirements

- [ ] Unit test: Get next todo number (001 exists → return 002)
- [ ] Unit test: Load template from file
- [ ] Unit test: Populate template with TodoFileSpec
- [ ] Unit test: Generate file with correct naming convention
- [ ] Unit test: Create TodoWrite items with file links
- [ ] Unit test: Generate dependency graph (Mermaid format)
- [ ] Unit test: Detect execution waves (3 todos: A, B depends on A, C depends on B → 3 waves)
- [ ] Unit test: Detect parallel execution (A, B, C no dependencies → Wave 1)
- [ ] Unit test: Handle empty plan (no todos to create)
- [ ] Integration test: Full generation flow with 5 todos

## Documentation Updates

- [ ] Add JSDoc comments to all exported interfaces
- [ ] Add inline comments for numbering algorithm
- [ ] Add usage examples in file header
- [ ] Update `todos/README.md` with dual system workflow

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 9 acceptance criteria met
2. ✅ All unit tests passing (80%+ coverage)
3. ✅ File numbering works correctly
4. ✅ Template population accurate
5. ✅ Dependency graph generation works
6. ✅ No file conflicts or race conditions

**Resolution Steps**:
```bash
# Run tests
npm run test:unit -- todo-file-generator.test.ts

# Check coverage
npm run test:coverage -- todo-file-generator.test.ts

# Mark as resolved
mv todos/004-pending-p1-todo-file-generator-service.md todos/004-resolved-todo-file-generator-service.md
```

---

## Notes

**Implementation Priority**: HIGH - This completes the dual todo system that enables cross-session persistence and team collaboration.

**Integration Points**:
- Called from `.claude/commands/plan.md` Step 7 (Create Dual Todo System)
- Uses template from `todos/000-pending-p1-TEMPLATE.md`
- Results displayed in plan output "Created Persistent Todos" section

**Dual System Benefits**:
- TodoWrite: In-session visibility, real-time updates
- todos/*.md files: Cross-session persistence, team collaboration, audit trail

**Execution Wave Example**:
```
Wave 1 (Parallel - 3 hours):
  - 002: Pattern Search (Marcus)
  - 003: Template Matcher (Sarah)
  - 004: Todo Generator (Marcus)

Wave 2 (Sequential - 2 hours):
  - 005: Integration Tests (Maria) - depends on 002, 003, 004

Wave 3 (Sequential - 2 hours):
  - 006: Plan Integration (Sarah) - depends on 005
```

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD
