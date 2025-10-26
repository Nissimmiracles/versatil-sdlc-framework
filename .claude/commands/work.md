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

### 3. Execute Implementation Loop

<thinking>
Systematically work through each subtask, updating both TodoWrite (in-session) and todos/*.md (persistent) as progress is made.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE ASSIGNED AGENTS USING THE TASK TOOL:**

For each subtask, follow this workflow:

1. **Read todo file** to identify `assigned_agent` (e.g., "Marcus-Backend", "James-Frontend")
2. **Invoke agent via Task tool**:
   - `subagent_type: [assigned_agent from file]`
   - `description: "Implement [task title]"`
   - `prompt: "Implement [task description from todo file]. Context: [historical patterns, acceptance criteria, files involved]. Return: { implementation_summary, files_modified, tests_added, lessons_learned }"`
3. **STOP AND WAIT** for agent to complete work
4. **Update both systems**:
   - TodoWrite: Mark task as completed
   - todos/*.md: Update status, add agent's implementation notes

**Do NOT execute work directly - ALWAYS route to the assigned agent via Task tool.**

**⛔ CHECKPOINT: Each task MUST be completed by its assigned agent before proceeding to the next task.**

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
