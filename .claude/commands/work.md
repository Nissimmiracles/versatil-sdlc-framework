---
description: "Execute implementation plan with OPERA agents and todo tracking"
argument-hint: "[work target]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Task"
  - "TodoWrite"
  - "Read"
  - "Write"
  - "Edit"
  - "Grep"
  - "Glob"
  - "Bash(npm:*)"
  - "Bash(git:*)"
---

# Execute Implementation Plan with OPERA Agents

## Introduction

Systematically execute implementation plans using VERSATIL's OPERA agents with dual todo tracking (TodoWrite + todos/*.md files). This command loads persistent todos, creates session tracking, and executes work with real-time progress visibility.

## Flags

- `--monitor`: Run continuous health monitoring during work (`/assess --continuous`)
- `--quality-gates`: Pause at each quality gate for validation before continuing
- `--timeout=Nh`: Maximum execution time (safety, e.g., `--timeout=8h`)

## Usage Examples

```bash
# Basic work execution
/work "Feature: User authentication"

# With continuous monitoring (recommended for long work)
/work --monitor "Feature: User authentication"

# With quality gate pauses (extra safety)
/work --quality-gates "Feature: Analytics dashboard"

# With timeout protection
/work --monitor --timeout=8h "Feature: Payment processing"

# All flags combined (maximum safety)
/work --monitor --quality-gates --timeout=28h "Complete auth system"
```

## Work Target

<work_target> #$ARGUMENTS </work_target>

## Main Tasks

### 1. Load Persistent Todos

<thinking>
Start by loading existing todos/*.md files to understand all pending work and dependencies.
</thinking>

**Todo Discovery:**

- [ ] List all pending todos: `ls todos/*-pending-*.md`
- [ ] Count total pending items by priority:
  - P0 (Critical): `ls todos/*-pending-p0-*.md | wc -l`
  - P1 (High): `ls todos/*-pending-p1-*.md | wc -l`
  - P2 (Medium): `ls todos/*-pending-p2-*.md | wc -l`
  - P3 (Low): `ls todos/*-pending-p3-*.md | wc -l`
- [ ] Identify work target (specific todo ID or feature name)
- [ ] Load full content of target todo file(s)

**Dependency Analysis:**

- [ ] Check "Depends on" field in todo frontmatter
- [ ] Verify all dependencies are resolved (status: completed)
- [ ] Identify what this todo blocks (for priority context)
- [ ] Validate prerequisites are met (database, services, configs)

**Example Todo Load:**

```bash
# Target: todos/001-pending-p1-implement-auth-api.md
# Status: pending
# Priority: p1
# Assigned: Marcus-Backend
# Depends on: [] (no dependencies)
# Blocks: 002-pending-p1-login-ui.md (James needs API first)
# Effort: Medium
```

### 2. Create TodoWrite for Session Tracking

<thinking>
Use TodoWrite tool to create in-session tracking that mirrors the persistent todos/*.md files.
</thinking>

**TodoWrite Creation:**

Parse the target todo file and create TodoWrite list:

```markdown
TodoWrite Example for 001-pending-p1-implement-auth-api.md:

1. Implement /api/auth/login endpoint (Marcus-Backend)
   - POST handler with email/password
   - JWT token generation
   - Input validation

2. Add authentication middleware (Marcus-Backend)
   - Token verification
   - Request authentication
   - Error handling

3. Implement /api/auth/refresh endpoint (Marcus-Backend)
   - Refresh token validation
   - New JWT generation

4. Add security features (Marcus-Backend)
   - Rate limiting
   - OWASP compliance
   - Input sanitization

5. Create test suite (Maria-QA)
   - Unit tests (80%+ coverage)
   - Integration tests
   - Security tests

6. Update documentation (Sarah-PM)
   - API documentation
   - CHANGELOG.md
   - Migration guide
```

**TodoWrite Best Practices:**

- [ ] Break todo into 3-10 subtasks
- [ ] Assign each subtask to appropriate OPERA agent
- [ ] Use imperative form ("Implement", "Add", "Create")
- [ ] Include activeForm for each task ("Implementing", "Adding", "Creating")
- [ ] Start with first task as in_progress
- [ ] Keep other tasks as pending

### 3. Plan Execution Waves ⭐ AGENT-DRIVEN (Sarah-PM)

<thinking>
Before executing implementation, use Sarah-PM to analyze dependencies and design optimal execution waves (parallel vs sequential).
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE SARAH-PM USING THE TASK TOOL:**

**ACTION: Invoke Sarah-PM Agent**
Call the Task tool with:
- `subagent_type: "Sarah-PM"`
- `description: "Design execution wave orchestration"`
- `prompt: "Design execution waves for '${work_target}' from loaded todo analysis. Input: Todo file details (priority, dependencies, assigned agent, effort, acceptance criteria), dependency graph (what depends on what, what blocks what). Your strategic PM orchestration: (1) Analyze dependency chains (identify critical path, find independent tasks that can run parallel), (2) Design execution waves (group tasks into waves 1-N, wave 1 = no dependencies, wave 2 = depends only on wave 1, etc.), (3) Determine wave parallelism (which tasks within wave can run concurrently, which must run sequentially), (4) Calculate wave duration estimates (sum parallel tasks by max duration, sum sequential tasks by total duration), (5) Define coordination checkpoints (after each wave, what quality gates must pass before next wave), (6) Identify orchestration risks (agent overload, handoff complexity, dependency bottlenecks), (7) Create agent handoff contracts (what context each agent needs from previous agent). Return: { execution_waves: [{wave_number, wave_name, tasks: [{task, agent, parallel: boolean, depends_on: [], duration_estimate}], wave_duration_estimate, dependencies: []}], coordination_checkpoints: [{checkpoint_name, location, blocking: boolean, quality_gates: [], handoff_agents: [{from, to, context}]}], critical_path: [], total_duration_estimate, orchestration_risks: [], recommendations: [] }"`

**Expected Sarah-PM Output:**

```typescript
interface ExecutionOrchestrationPlan {
  execution_waves: Array<{
    wave_number: number;               // 1, 2, 3, 4
    wave_name: string;                 // e.g., "Foundation Setup"
    tasks: Array<{
      task_id: string;                 // e.g., "001-subtask-1"
      task_title: string;              // e.g., "Implement /api/auth/login"
      assigned_agent: string;          // e.g., "Marcus-Backend"
      parallel: boolean;               // true = can run concurrently with other tasks in this wave
      depends_on: string[];            // Task IDs this depends on
      duration_estimate: string;       // e.g., "30 minutes", "2 hours"
      priority: 'p0' | 'p1' | 'p2' | 'p3';
    }>;
    wave_duration_estimate: string;    // e.g., "2 hours" (max of parallel tasks)
    dependencies: string[];            // Previous waves this depends on (e.g., ["wave_1", "wave_2"])
    parallel_execution: boolean;       // true = all tasks in wave run concurrently
  }>;

  coordination_checkpoints: Array<{
    checkpoint_name: string;           // e.g., "API Endpoints Complete"
    location: string;                  // e.g., "After Wave 1", "Before Wave 3"
    blocking: boolean;                 // true = MUST complete before next wave
    quality_gates: string[];           // e.g., ["All tests passing", "Coverage >= 80%", "OWASP scan clean"]
    handoff_agents: Array<{
      from: string;                    // e.g., "Marcus-Backend"
      to: string;                      // e.g., "James-Frontend"
      context: string;                 // e.g., "API endpoint documentation, example requests"
    }>;
    validation_steps: string[];        // Manual or automated validation required
  }>;

  critical_path: Array<{
    task_id: string;
    task_title: string;
    duration: string;
  }>;  // Longest dependency chain determining minimum completion time

  total_duration_estimate: string;     // e.g., "6 hours" (sum of wave durations)
  buffer_recommendation: string;       // e.g., "+1 hour (15% buffer for unknowns)"

  orchestration_risks: Array<{
    risk: string;
    likelihood: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    affected_waves: number[];
    mitigation: string;
  }>;

  recommendations: string[];           // Strategic recommendations for optimal execution
}
```

**Execution Wave Design Examples:**

```typescript
// Example 1: Authentication Feature Implementation
const work_target = "todos/001-pending-p1-implement-auth-api.md";

// Sarah-PM's orchestration:
const orchestration = {
  execution_waves: [
    {
      wave_number: 1,
      wave_name: "Foundation Setup (Database + Core API)",
      tasks: [
        {
          task_id: "001-subtask-1",
          task_title: "Create users table schema",
          assigned_agent: "Dana-Database",
          parallel: false,  // Must complete first - others depend on it
          depends_on: [],
          duration_estimate: "20 minutes",
          priority: "p1"
        }
      ],
      wave_duration_estimate: "20 minutes",
      dependencies: [],
      parallel_execution: false
    },
    {
      wave_number: 2,
      wave_name: "API Endpoints (Parallel Implementation)",
      tasks: [
        {
          task_id: "001-subtask-2",
          task_title: "Implement /api/auth/login endpoint",
          assigned_agent: "Marcus-Backend",
          parallel: true,  // Can run with subtask-3
          depends_on: ["001-subtask-1"],  // Needs database schema
          duration_estimate: "45 minutes",
          priority: "p1"
        },
        {
          task_id: "001-subtask-3",
          task_title: "Implement /api/auth/refresh endpoint",
          assigned_agent: "Marcus-Backend",
          parallel: true,  // Can run with subtask-2
          depends_on: ["001-subtask-1"],
          duration_estimate: "30 minutes",
          priority: "p1"
        }
      ],
      wave_duration_estimate: "45 minutes",  // Max of parallel tasks
      dependencies: ["wave_1"],
      parallel_execution: true
    },
    {
      wave_number: 3,
      wave_name: "Security & Testing (Parallel Validation)",
      tasks: [
        {
          task_id: "001-subtask-4",
          task_title: "Add security features (rate limiting, OWASP)",
          assigned_agent: "Marcus-Backend",
          parallel: true,
          depends_on: ["001-subtask-2", "001-subtask-3"],
          duration_estimate: "30 minutes",
          priority: "p1"
        },
        {
          task_id: "001-subtask-5",
          task_title: "Create test suite (80%+ coverage)",
          assigned_agent: "Maria-QA",
          parallel: true,
          depends_on: ["001-subtask-2", "001-subtask-3"],
          duration_estimate: "40 minutes",
          priority: "p1"
        }
      ],
      wave_duration_estimate: "40 minutes",
      dependencies: ["wave_2"],
      parallel_execution: true
    },
    {
      wave_number: 4,
      wave_name: "Documentation & Finalization",
      tasks: [
        {
          task_id: "001-subtask-6",
          task_title: "Update API documentation and CHANGELOG",
          assigned_agent: "Sarah-PM",
          parallel: false,
          depends_on: ["001-subtask-4", "001-subtask-5"],
          duration_estimate: "15 minutes",
          priority: "p2"
        }
      ],
      wave_duration_estimate: "15 minutes",
      dependencies: ["wave_3"],
      parallel_execution: false
    }
  ],

  coordination_checkpoints: [
    {
      checkpoint_name: "Database Schema Ready",
      location: "After Wave 1",
      blocking: true,  // MUST complete before Wave 2
      quality_gates: [
        "Users table created successfully",
        "RLS policies tested",
        "Indexes verified (EXPLAIN ANALYZE)",
        "Migration applied to dev environment"
      ],
      handoff_agents: [
        {
          from: "Dana-Database",
          to: "Marcus-Backend",
          context: "Database connection string, table schema documentation, example queries"
        }
      ],
      validation_steps: [
        "Run migration: npm run migrate:dev",
        "Verify table exists: SELECT * FROM users LIMIT 1",
        "Test RLS policy: attempt unauthorized access"
      ]
    },
    {
      checkpoint_name: "API Endpoints Functional",
      location: "After Wave 2",
      blocking: true,
      quality_gates: [
        "Both endpoints return 200 OK on valid input",
        "JWT tokens generated correctly",
        "Input validation prevents invalid requests",
        "Error handling returns proper status codes"
      ],
      handoff_agents: [
        {
          from: "Marcus-Backend",
          to: "Marcus-Backend + Maria-QA",
          context: "API endpoint documentation, cURL examples, expected responses"
        }
      ],
      validation_steps: [
        "Test login: curl -X POST /api/auth/login -d '{\"email\":\"test@example.com\",\"password\":\"test123\"}'",
        "Test refresh: curl -X POST /api/auth/refresh -H 'Authorization: Bearer <token>'"
      ]
    },
    {
      checkpoint_name: "Security & Quality Validated",
      location: "After Wave 3",
      blocking: true,
      quality_gates: [
        "Test coverage >= 80%",
        "OWASP scan shows no critical vulnerabilities",
        "Rate limiting blocks > 10 requests/minute",
        "All security tests passing"
      ],
      handoff_agents: [
        {
          from: "Marcus-Backend + Maria-QA",
          to: "Sarah-PM",
          context: "Test coverage report, security scan results, performance metrics"
        }
      ],
      validation_steps: [
        "Run tests: npm run test:coverage",
        "Security scan: npm run security:scan",
        "Load test: npm run load:test"
      ]
    }
  ],

  critical_path: [
    { task_id: "001-subtask-1", task_title: "Create users table schema", duration: "20 minutes" },
    { task_id: "001-subtask-2", task_title: "Implement /api/auth/login endpoint", duration: "45 minutes" },
    { task_id: "001-subtask-5", task_title: "Create test suite", duration: "40 minutes" },
    { task_id: "001-subtask-6", task_title: "Update documentation", duration: "15 minutes" }
  ],  // Total: 2 hours (minimum possible completion time)

  total_duration_estimate: "2 hours",
  buffer_recommendation: "+20 minutes (15% buffer for unknowns, context switching)",

  orchestration_risks: [
    {
      risk: "Wave 2 parallel execution (2 endpoints) may conflict if both modify shared middleware",
      likelihood: "low",
      impact: "medium",
      affected_waves: [2],
      mitigation: "Ensure login and refresh endpoints use separate middleware, or coordinate Marcus-Backend work sequentially"
    },
    {
      risk: "Maria-QA in Wave 3 may start testing before Marcus completes security features in same wave",
      likelihood: "medium",
      impact: "high",
      affected_waves: [3],
      mitigation: "Add sub-checkpoint: Marcus completes security → Maria can start testing"
    }
  ],

  recommendations: [
    "Add sub-checkpoint in Wave 3: Marcus finishes security features → Maria starts tests",
    "Consider splitting Wave 2 if middleware conflicts emerge during implementation",
    "Total time estimate: 2h 20min (2h waves + 20min buffer)",
    "Critical path tasks must complete on time - no delays allowed"
  ]
};
```

**After Sarah-PM Orchestration, Process the Execution Plan:**

```typescript
// Display execution plan to user
console.log("📋 Execution Plan Generated by Sarah-PM\n");

console.log(`**Total Duration Estimate**: ${orchestration.total_duration_estimate} (${orchestration.buffer_recommendation})`);
console.log(`**Number of Waves**: ${orchestration.execution_waves.length}`);
console.log(`**Critical Path**: ${orchestration.critical_path.length} tasks\n`);

// Show waves
orchestration.execution_waves.forEach(wave => {
  console.log(`\n## Wave ${wave.wave_number}: ${wave.wave_name}`);
  console.log(`Duration: ${wave.wave_duration_estimate}`);
  console.log(`Parallel Execution: ${wave.parallel_execution ? '✅ Yes' : '❌ No (sequential)'}`);
  console.log(`Dependencies: ${wave.dependencies.length > 0 ? wave.dependencies.join(', ') : 'None'}\n`);

  console.log("**Tasks:**");
  wave.tasks.forEach(task => {
    const parallelIcon = task.parallel ? '🔀' : '➡️';
    console.log(`${parallelIcon} ${task.task_title}`);
    console.log(`   Agent: ${task.assigned_agent} | Duration: ${task.duration_estimate} | Priority: ${task.priority.toUpperCase()}`);
    if (task.depends_on.length > 0) {
      console.log(`   Depends on: ${task.depends_on.join(', ')}`);
    }
  });
});

// Show checkpoints
console.log("\n## Coordination Checkpoints\n");
orchestration.coordination_checkpoints.forEach(cp => {
  const blockingIcon = cp.blocking ? '⛔' : '⚠️';
  console.log(`${blockingIcon} **${cp.checkpoint_name}** (${cp.location})`);
  console.log(`   Quality Gates: ${cp.quality_gates.length} checks`);
  cp.quality_gates.forEach(gate => console.log(`   - ${gate}`));
  console.log("");
});

// Show risks
if (orchestration.orchestration_risks.length > 0) {
  console.log("\n## Orchestration Risks\n");
  orchestration.orchestration_risks.forEach(risk => {
    console.log(`⚠️ **${risk.risk}**`);
    console.log(`   Likelihood: ${risk.likelihood} | Impact: ${risk.impact}`);
    console.log(`   Mitigation: ${risk.mitigation}\n`);
  });
}

// Show recommendations
console.log("\n## Recommendations\n");
orchestration.recommendations.forEach(rec => console.log(`💡 ${rec}`));
```

---

### 4. Execute Implementation Loop

<thinking>
Systematically work through each wave and subtask, updating both TodoWrite (in-session) and todos/*.md (persistent) as progress is made.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE ASSIGNED AGENTS USING THE TASK TOOL:**

For each subtask in the implementation plan, you MUST follow this mandatory workflow:

1. **Read todo file** to identify `assigned_agent` field (e.g., "Marcus-Backend", "James-Frontend", "Dana-Database")

2. **Invoke agent via Task tool** - This is MANDATORY, not optional:

**Call the Task tool with these exact parameters:**
- `subagent_type: "[assigned_agent from todo file]"` (e.g., "Marcus-Backend", "James-Frontend")
- `description: "Implement [task title from todo]"`
- `prompt:` (detailed prompt below)

**Prompt Template:**
```
Implement [task description from todo file].

**Context from Todo File**:
- Priority: [P0/P1/P2/P3]
- Estimated Effort: [Small/Medium/Large]
- Historical Patterns: [from RAG if available]
- Acceptance Criteria: [from todo file]
- Files Involved: [from todo file]
- Dependencies: [what this task depends on]

**Quality Gates**:
- Test Coverage: 80%+ required
- Security: OWASP compliant
- Performance: < 200ms API response (backend), < 2.5s LCP (frontend)
- Accessibility: WCAG 2.1 AA compliant (frontend)
- Documentation: Code comments + API docs

**Your Implementation Task**:
[Copy detailed implementation steps from todo file]

**Expected Output Format**:
{
  implementation_summary: "Brief description of what was implemented",
  files_modified: ["path/to/file1.ts", "path/to/file2.tsx"],
  files_created: ["path/to/new-file.ts"],
  tests_added: ["path/to/test-file.test.ts"],
  quality_validation: {
    test_coverage: "XX%",
    security_scan: "passed/failed",
    performance: "XXXms",
    accessibility: "passed/failed"
  },
  lessons_learned: ["Key insight 1", "Key insight 2"],
  next_steps: ["What should happen after this task"]
}
```

3. **STOP AND WAIT** for agent to complete work
   - Do NOT proceed to next task
   - Do NOT execute work yourself
   - Do NOT skip agent invocation
   - Wait for agent's structured output

4. **Validate agent output** before marking complete:
   - ✅ Check implementation_summary is detailed (not vague)
   - ✅ Verify files_modified/created list is complete
   - ✅ Confirm quality_validation passed all gates
   - ✅ Ensure tests_added meet 80%+ coverage requirement
   - ✅ Review lessons_learned for future improvements

5. **Update both tracking systems**:
   - **TodoWrite**: Mark current task as completed (`status: "completed"`)
   - **todos/*.md**: Add work log entry with:
     ```markdown
     ### [Date] - [Task Title] Completed
     **By:** [Agent Name] (invoked via Task tool)
     **Actions:** [implementation_summary from agent output]
     **Files Changed:** [files_modified + files_created]
     **Quality Metrics:** [quality_validation results]
     **Learnings:** [lessons_learned from agent output]
     **Next:** [next_steps from agent output]
     ```

**⚡ CRITICAL RULES (NEVER VIOLATE):**
- **Do NOT execute work directly** - ALWAYS route to the assigned agent via Task tool
- **Do NOT skip agent invocation** - Even for "simple" or "trivial" tasks
- **Do NOT batch multiple tasks** to one agent call - Invoke Task tool once per subtask for granular tracking
- **Do NOT proceed** if agent invocation fails - Stop, report error, wait for user intervention
- **Do NOT make up agent output** - Wait for actual agent response with real data

**⛔ CHECKPOINT: Each task MUST be completed by its assigned agent before proceeding to the next task.**

**Why Mandatory Agent Invocation Matters:**
1. **Domain Expertise**: Marcus knows backend security (OWASP), James knows accessibility (WCAG 2.1 AA)
2. **Quality Gates**: Agents enforce 80%+ coverage, security scans, performance benchmarks
3. **Sub-Agent Routing**: Marcus detects Node.js → routes to marcus-node-backend automatically
4. **Learning Codification**: Agent outputs feed into RAG for compounding engineering (next feature 40% faster)
5. **Consistent Format**: Structured output enables automation, reporting, and quality tracking
6. **Tool Integration**: Agents use MCP tools (65 available) - direct execution can't access these

**Implementation Workflow:**

```yaml
For_Each_Subtask:
  Step_1_Mark_In_Progress:
    - TodoWrite: Set task status to in_progress
    - Terminal: Show "🔄 [activeForm]..." in statusline

  Step_2_Execute_Work:
    - Activate assigned OPERA agent
    - Agent performs implementation
    - Agent runs validation (tests, linting, security)
    - Agent reports completion

  Step_3_Validation:
    - Run relevant tests
    - Check code quality
    - Verify acceptance criteria
    - Test integration points

  Step_4_Mark_Complete:
    - TodoWrite: Set task status to completed
    - TodoWrite: Immediately move to next task
    - Terminal: Show "✅ [content] - Complete"

  Step_5_Update_Persistent_Todo:
    - Update Work Log in todos/*.md file
    - Add timestamp, agent, actions taken
    - Document learnings or issues encountered
    - Keep status: pending until ALL subtasks done
```

**Example Execution:**

```markdown
Task 1: Implement /api/auth/login endpoint
Status: in_progress
Agent: Marcus-Backend

Actions:
1. Create src/api/auth/login.ts
2. Add POST handler with schema validation
3. Implement JWT token generation
4. Add error handling
5. Test endpoint manually

Validation:
- ✅ Endpoint responds on POST /api/auth/login
- ✅ Returns JWT token on valid credentials
- ✅ Returns 401 on invalid credentials
- ✅ Input validation working
- ✅ No security warnings

Result: ✅ Complete

TodoWrite:
✅ 1. Implement /api/auth/login endpoint (Marcus-Backend) - COMPLETE
🔄 2. Add authentication middleware (Marcus-Backend) - IN PROGRESS
⏳ 3. Implement /api/auth/refresh endpoint (Marcus-Backend)
⏳ 4. Add security features (Marcus-Backend)
⏳ 5. Create test suite (Maria-QA)
⏳ 6. Update documentation (Sarah-PM)
```

### 4. Agent Collaboration Patterns

<thinking>
Different tasks require different agents. Route work to the appropriate OPERA specialist based on the subtask domain.
</thinking>

**Agent Routing (Three-Tier Architecture):**

```yaml
Database_Tasks: (Schema, migrations, RLS, queries, optimization)
  Route_To: Dana-Database
  Examples:
    - "Design user authentication schema"
    - "Add database migration for new feature"
    - "Create RLS policies for multi-tenant data"
    - "Optimize database queries and add indexes"
    - "Set up pgvector table for embeddings (RAG)"

Backend_Tasks: (API, services, middleware, business logic)
  Route_To: Marcus-Backend
  Examples:
    - "Implement /api/users endpoint"
    - "Create authentication middleware"
    - "Add JWT token generation"
    - "Implement rate limiting"

Frontend_Tasks: (Components, UI, styles, state)
  Route_To: James-Frontend
  Examples:
    - "Create LoginForm component"
    - "Add responsive design for mobile"
    - "Implement form validation"
    - "Optimize bundle size"

Testing_Tasks: (Unit, integration, e2e, coverage)
  Route_To: Maria-QA
  Examples:
    - "Add test coverage for auth module"
    - "Create e2e test for login flow"
    - "Run security tests"
    - "Validate 80%+ coverage"

Requirements_Tasks: (User stories, acceptance criteria, business logic)
  Route_To: Alex-BA
  Examples:
    - "Validate user story implementation"
    - "Check acceptance criteria"
    - "Review business logic"
    - "Clarify edge cases"

Documentation_Tasks: (README, CHANGELOG, API docs, migration guides)
  Route_To: Sarah-PM
  Examples:
    - "Update CHANGELOG.md"
    - "Document API endpoints"
    - "Create migration guide"
    - "Update README.md"

AI_ML_Tasks: (Models, training, inference, data processing)
  Route_To: Dr.AI-ML
  Examples:
    - "Train recommendation model"
    - "Optimize inference pipeline"
    - "Preprocess training data"
    - "Evaluate model performance"
```

**Sequential vs Parallel Execution:**

```yaml
Sequential_Execution: (Tasks with dependencies)
  Example: "002-pending-p1-login-ui.md depends on 001 (Auth API)"
  Pattern:
    1. Complete 001 first (Marcus-Backend)
    2. Update 001 status to completed
    3. Then start 002 (James-Frontend)
    4. James can now integrate with Marcus's API

Parallel_Execution: (Independent tasks via Rule 1)
  Example: "Database, Backend API, and Frontend UI can run parallel"
  Three_Tier_Pattern:
    1. Alex-BA defines API contract
    2. Parallel Phase (Rule 1):
       - Task dana-database(schema_design) - Database schema
       - Task marcus-backend(api_with_mocks) - API with DB mocks
       - Task james-frontend(ui_with_mocks) - UI with API mocks
    3. Integration Phase:
       - Dana → Marcus: Connect real database
       - Marcus → James: Connect real API
    4. Maria-QA validates end-to-end
  Time_Savings: 2-3x faster than sequential
    - Task sarah-pm(documentation) - Runs in parallel
    - Both complete independently
    - Merge results when both done
```

### 5. Quality Gates During Execution

<thinking>
Enforce quality standards at each step to prevent technical debt accumulation.
</thinking>

**Quality Checkpoints:**

```yaml
After_Each_Backend_Task:
  Maria-QA_Validation:
    - Run unit tests
    - Check code coverage (must be 80%+)
    - Run security scan (OWASP)
    - Validate API response time (< 200ms)
  Block_If:
    - Tests fail
    - Coverage < 80%
    - Security vulnerabilities found
    - Performance regression detected

After_Each_Frontend_Task:
  James-Frontend_Validation:
    - Run component tests
    - Check accessibility (WCAG 2.1 AA)
    - Validate responsive design
    - Check bundle size impact (< 5KB)
  Maria-QA_Validation:
    - Run visual regression tests
    - Check browser compatibility
    - Validate user flows
  Block_If:
    - Accessibility violations found
    - Bundle size exceeds limit
    - Visual regressions detected

After_All_Tasks:
  Comprehensive_Validation:
    - Run full test suite
    - Check overall coverage
    - Run integration tests
    - Validate documentation completeness
  Block_If:
    - Any test failures
    - Documentation incomplete
    - Integration issues found
```

### 6. Update Persistent Todo File

<thinking>
As work progresses, update the todos/*.md file with work log entries to maintain cross-session continuity.
</thinking>

**Work Log Updates:**

Add entries to the Work Log section of the todo file:

```markdown
## Work Log

### 2025-10-12 - Implementation Session
**By:** Claude + Marcus-Backend
**Actions:**
- Implemented /api/auth/login endpoint in src/api/auth/login.ts
- Added JWT token generation with jsonwebtoken library
- Implemented input validation using Zod schema
- Added rate limiting middleware (10 requests/minute)
- Created unit tests with 85% coverage

**Learnings:**
- JWT expiry set to 1 hour for security
- Refresh token expiry set to 7 days
- Rate limiting prevents brute force attacks
- Zod provides excellent TypeScript inference

**Issues Encountered:**
- None

**Next Steps:**
- Add authentication middleware (next subtask)
- Create refresh token endpoint
- Add OWASP security features
```

**Status Transitions:**

Update status field as work progresses:

```yaml
Initial:
  status: pending
  priority: p1

During_Work: (Tasks in progress, but not all complete)
  status: in-progress  # Optional: change to show active work
  priority: p1

After_Completion:
  status: completed
  priority: p1
  completed_date: 2025-10-12

File_Rename:
  From: 001-pending-p1-implement-auth-api.md
  To: 001-completed-implement-auth-api.md
```

### 7. Acceptance Criteria Validation

<thinking>
Before marking todo as complete, validate all acceptance criteria from the persistent todo file.
</thinking>

**Validation Checklist:**

```markdown
## Acceptance Criteria (from todo file)

- [x] ✅ Criterion 1: /api/auth/login endpoint responds with JWT token
  - Validated: Manual test + unit test
  - Agent: Marcus-Backend

- [x] ✅ Criterion 2: Authentication middleware validates tokens
  - Validated: Integration test
  - Agent: Marcus-Backend

- [x] ✅ Criterion 3: Rate limiting prevents brute force
  - Validated: Security test
  - Agent: Marcus-Backend + Maria-QA

- [x] ✅ Criterion 4: 80%+ test coverage
  - Validated: Coverage report shows 85%
  - Agent: Maria-QA

- [x] ✅ Criterion 5: OWASP Top 10 compliant
  - Validated: Security scan passed
  - Agent: Marcus-Backend

- [x] ✅ Criterion 6: API documentation updated
  - Validated: docs/api/auth.md created
  - Agent: Sarah-PM

- [x] ✅ Criterion 7: CHANGELOG.md updated
  - Validated: Entry added for v1.1.0
  - Agent: Sarah-PM

**All acceptance criteria met**: ✅
**Ready to mark as completed**: ✅
```

### 8. Completion & Handoff

<thinking>
After all subtasks complete and acceptance criteria met, finalize the work and handle any dependencies.
</thinking>

**Completion Process:**

1. **Final TodoWrite Update:**
```markdown
TodoWrite Final State:
✅ 1. Implement /api/auth/login endpoint (Marcus-Backend) - COMPLETE
✅ 2. Add authentication middleware (Marcus-Backend) - COMPLETE
✅ 3. Implement /api/auth/refresh endpoint (Marcus-Backend) - COMPLETE
✅ 4. Add security features (Marcus-Backend) - COMPLETE
✅ 5. Create test suite (Maria-QA) - COMPLETE
✅ 6. Update documentation (Sarah-PM) - COMPLETE

All tasks completed successfully! ✅
```

2. **Mark Persistent Todo as Completed:**
```bash
# Update status in file
# Rename file to reflect completion
mv todos/001-pending-p1-implement-auth-api.md \
   todos/001-completed-implement-auth-api.md
```

3. **Unblock Dependent Todos:**
```markdown
Completed: 001-completed-implement-auth-api.md

Unblocks:
- 002-pending-p1-login-ui.md (James-Frontend can now start)
  - Update: Remove "Depends on: 001" from frontmatter
  - Status: Ready to work

Next suggested work:
/versatil:work 002-pending-p1-login-ui
```

4. **Generate Completion Report:**
```markdown
## Work Session Complete: 001-implement-auth-api

**Status**: ✅ All tasks completed
**Duration**: 2 hours 15 minutes
**Agents Involved**: Marcus-Backend (primary), Maria-QA (testing), Sarah-PM (docs)

### Deliverables:
- ✅ /api/auth/login endpoint (JWT authentication)
- ✅ /api/auth/refresh endpoint (token refresh)
- ✅ Authentication middleware
- ✅ Rate limiting (10 req/min)
- ✅ Test suite (85% coverage)
- ✅ API documentation
- ✅ CHANGELOG.md updated

### Quality Metrics:
- **Test Coverage**: 85% (target: 80%+) ✅
- **Security**: OWASP compliant ✅
- **Performance**: 180ms avg response (target: < 200ms) ✅
- **Documentation**: Complete ✅

### Files Changed:
- Created: src/api/auth/login.ts (120 lines)
- Created: src/api/auth/refresh.ts (80 lines)
- Created: src/middleware/auth.ts (60 lines)
- Created: src/middleware/rate-limit.ts (40 lines)
- Created: __tests__/api/auth.test.ts (200 lines)
- Updated: docs/api/auth.md
- Updated: CHANGELOG.md

### Next Steps:
1. Work on 002-pending-p1-login-ui.md (now unblocked)
2. Run `/versatil:work 002` to start frontend implementation
3. James-Frontend will integrate with new auth API
```

## Work Modes

### 🎯 FOCUSED (Single Todo)

**Target**: Specific todo ID
**Pattern**: Load one todo, execute all subtasks, mark complete

**Example:**
```bash
/versatil:work 001-pending-p1-implement-auth-api
→ Loads: todos/001-pending-p1-implement-auth-api.md
→ Creates: TodoWrite with subtasks
→ Executes: All subtasks sequentially
→ Completes: Marks 001 as completed
```

### 📋 BATCH (Multiple Related Todos)

**Target**: Feature name or tag
**Pattern**: Load all related todos, work through in priority order

**Example:**
```bash
/versatil:work authentication-feature
→ Loads: All todos tagged with "authentication"
→ Order: 001 (API), 002 (UI), 003 (tests), 004 (docs)
→ Executes: Sequential with dependency awareness
→ Completes: All todos in the feature set
```

### 🔥 PRIORITY (All P0/P1 Todos)

**Target**: Priority level
**Pattern**: Load all todos at priority level, work in order

**Example:**
```bash
/versatil:work priority:p1
→ Loads: All P1 todos
→ Order: By creation date (oldest first)
→ Executes: Until all P1 complete
→ Completes: Entire P1 backlog cleared
```

## Parallel Work Execution (Rule 1)

**Independent Tasks Pattern:**

```yaml
Scenario: "Authentication feature with independent backend and frontend"

Sequential_Approach: (Without Rule 1)
  1. Complete 001-auth-api (Marcus) - 2 hours
  2. Complete 002-login-ui (James) - 1.5 hours
  3. Complete 003-tests (Maria) - 1 hour
  Total: 4.5 hours

Parallel_Approach: (With Rule 1)
  Parallel_Set_1:
    - Task marcus-backend(001-auth-api) - 2 hours
    - Task james-frontend(002-login-ui-mockdata) - 1.5 hours (uses mock API)
  Wait_For_Both: max(2, 1.5) = 2 hours

  Parallel_Set_2:
    - Task james-frontend(integrate-real-api) - 0.5 hours
    - Task maria-qa(003-tests) - 1 hour
  Wait_For_Both: max(0.5, 1) = 1 hour

  Total: 3 hours (33% faster)
```

**Collision Detection:**

```yaml
Rule_1_Collision_Detection:
  Scenario: "Two tasks edit same file"

  Task_A: Marcus editing src/api/auth.ts
  Task_B: James editing src/api/auth.ts

  Detection:
    - Rule 1 detects both tasks target same file
    - Blocks parallel execution
    - Enforces sequential: A completes, then B starts

  Benefit: Prevents merge conflicts and lost work
```

## Error Handling & Recovery

**Task Failure Handling:**

```yaml
Task_Fails:
  Example: "Test coverage check fails (78% < 80%)"

  Actions:
    1. Mark TodoWrite task as failed (not completed)
    2. Add work log entry to todos/*.md file
    3. Create new subtask: "Fix test coverage"
    4. Block completion until coverage met

  TodoWrite_Update:
    ✅ 1. Implement endpoint - COMPLETE
    ✅ 2. Add middleware - COMPLETE
    ❌ 3. Create test suite - FAILED (78% coverage)
    🔄 3a. Add missing test cases - IN PROGRESS
    ⏳ 4. Update documentation
```

**Recovery Pattern:**

```markdown
## Work Log

### 2025-10-12 14:30 - Test Coverage Issue
**By:** Maria-QA
**Issue:** Test coverage at 78%, below 80% threshold
**Actions:**
- Identified untested paths: error handling in login endpoint
- Identified untested paths: refresh token validation edge cases
- Created additional test cases

**Resolution:**
- Added 15 new test cases
- New coverage: 85%
- Quality gate passed ✅

**Learnings:**
- Always test error scenarios
- Edge cases often missed in first pass
- Coverage tool identified exact untested lines
```

## Output Format

Present work session status with:

1. **Session Summary** (What todo is being worked on)
2. **TodoWrite List** (Real-time progress)
3. **Current Task** (What's in_progress right now)
4. **Completion Status** (X/Y tasks complete)
5. **Quality Gates** (Pass/Fail status)
6. **Next Steps** (What happens after current task)

**Example Output:**

```markdown
## Work Session: 001-implement-auth-api

**Progress**: 3/6 tasks complete (50%)

TodoWrite:
✅ 1. Implement /api/auth/login endpoint (Marcus-Backend) - COMPLETE
✅ 2. Add authentication middleware (Marcus-Backend) - COMPLETE
✅ 3. Implement /api/auth/refresh endpoint (Marcus-Backend) - COMPLETE
🔄 4. Add security features (Marcus-Backend) - IN PROGRESS
⏳ 5. Create test suite (Maria-QA)
⏳ 6. Update documentation (Sarah-PM)

**Current Task**: Adding rate limiting and OWASP security features
**Estimated Completion**: 30 minutes

**Quality Gates**:
- Test Coverage: 85% ✅ (target: 80%+)
- Security Scan: Passed ✅
- Performance: 180ms ✅ (target: < 200ms)

**Next**: After security features complete, Maria-QA will run full test suite
```

---

**Framework Integration:**
- **Rule 1**: Parallel execution for independent tasks
- **Rule 2**: Auto-generate stress tests during implementation
- **Rule 3**: Daily audits track work completion rates
- **Rule 4**: Zero-config agent activation based on task type
- **Rule 5**: Automated release orchestration after work complete
- **Dual Tracking**: TodoWrite (in-session) + todos/*.md (persistent)
