---
description: "Smart work distribution to optimal OPERA agents with automatic coordination"
argument-hint: "[todos pattern or work scope]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Task"
  - "TodoWrite"
  - "Read"
  - "Write"
  - "Grep"
  - "Glob"
---

# Delegate Work - Compounding Engineering (Delegate Phase)

## Introduction

**Smart distribution of work** to the optimal OPERA agents with automatic coordination, dependency management, and parallel execution. This implements the "Delegate" phase of VELOCITY workflow's Compounding Engineering approach.

**Philosophy**: "Route work to the best specialist, execute in parallel when possible."

## Delegation Target

<delegation_target> #$ARGUMENTS </delegation_target>

## Main Tasks

### 1. Analyze Work Scope

<thinking>
First, understand what work needs to be done and break it into delegatable units.
</thinking>

**Work Discovery:**

- [ ] Parse delegation target (todo pattern, priority, or work description)
- [ ] List all pending todos matching pattern: `ls todos/*-pending-*.md`
- [ ] Count total work items by priority:
  - P0 (Critical): Emergency fixes, production incidents
  - P1 (High): Important features, major bugs
  - P2 (Medium): Standard features, enhancements
  - P3 (Low): Nice-to-haves, refactoring

**Work Categorization:**

```yaml
Work Scope Analysis:
  total_todos: 12
  breakdown:
    p0_critical: 1 (production API down)
    p1_high: 4 (user auth, payment flow, dashboard)
    p2_medium: 5 (UI polish, docs, tests)
    p3_low: 2 (refactoring, cleanup)

  domains:
    database: 3 todos (migrations, RLS, indexes)
    api: 4 todos (endpoints, middleware, auth)
    frontend: 3 todos (components, forms, routing)
    quality: 2 todos (tests, coverage, security)

  estimated_effort:
    total: 48 hours
    per_priority:
      p0: 2 hours (urgent)
      p1: 24 hours (high priority)
      p2: 18 hours (medium priority)
      p3: 4 hours (low priority)
```

### 2. Agent Capability Matching

<thinking>
Match work items to the best-suited OPERA agents based on specialization.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE SARAH-PM USING THE TASK TOOL:**

**ACTION: Invoke Sarah-PM Agent**
Call the Task tool with:
- `subagent_type: "Sarah-PM"`
- `description: "Strategic work distribution"`
- `prompt: "Distribute work items to optimal OPERA agents. Input: Todo list (${todo_count} items), agent capabilities (Dana-Database, Marcus-Backend, James-Frontend, Maria-QA, Alex-BA, Dr.AI-ML, Oliver-MCP), project context. Your strategic planning: (1) Analyze each work item requirements, (2) Match to agent specializations, (3) Consider workload balancing, (4) Detect dependencies between assignments, (5) Provide reasoning for each assignment. Agent specializations: Dana=database/migrations, Marcus=backend/API/security, James=frontend/UI/accessibility, Maria=testing/QA, Alex=requirements/business logic, Dr.AI-ML=ML/AI/data science, Oliver=MCP/routing/anti-hallucination. Return: { assignments: [{todo_id, assigned_agent, reasoning}], workload_distribution: {}, dependency_notes: string }"`

**STOP AND WAIT for Sarah-PM agent to complete before applying assignments.**

**Do NOT assign agents manually - let Sarah-PM make strategic decisions using her PM expertise.**

**⛔ CHECKPOINT: You MUST have Sarah-PM's assignments before updating todos. Apply her recommendations exactly as provided.**

**Agent Specializations:**

```yaml
OPERA Agents:
  dana-database:
    specialization: "Database Architect & Data Layer"
    expertise:
      - PostgreSQL, Supabase schema design
      - Migrations and RLS policies
      - Query optimization, indexing
      - Vector databases (pgvector)
    workload: "current: 0 tasks, capacity: 3 tasks"
    performance_score: 95

  marcus-backend:
    specialization: "Backend API Architect"
    expertise:
      - REST/GraphQL API design
      - Authentication & authorization
      - OWASP security validation
      - < 200ms performance optimization
    workload: "current: 1 task, capacity: 5 tasks"
    performance_score: 98
    sub_agents:
      - marcus-node-backend
      - marcus-python-backend
      - marcus-rails-backend
      - marcus-go-backend
      - marcus-java-backend

  james-frontend:
    specialization: "Frontend UI/UX Architect"
    expertise:
      - React, Vue, Angular, Svelte
      - WCAG 2.1 AA accessibility
      - Responsive design
      - State management
    workload: "current: 0 tasks, capacity: 4 tasks"
    performance_score: 92
    sub_agents:
      - james-react-frontend
      - james-vue-frontend
      - james-nextjs-frontend
      - james-angular-frontend
      - james-svelte-frontend

  maria-qa:
    specialization: "Quality Assurance Lead"
    expertise:
      - Test coverage (80%+ target)
      - Security validation
      - Accessibility audits
      - Performance testing
    workload: "current: 0 tasks, capacity: 3 tasks"
    performance_score: 100

  alex-ba:
    specialization: "Business Analyst"
    expertise:
      - Requirements analysis
      - User story creation
      - API contract definition
      - Stakeholder communication
    workload: "current: 0 tasks, capacity: 2 tasks"
    performance_score: 90

  sarah-pm:
    specialization: "Project Manager"
    expertise:
      - Sprint planning
      - Progress tracking
      - Documentation
      - Team coordination
    workload: "current: 0 tasks, capacity: 2 tasks"
    performance_score: 88

  dr-ai-ml:
    specialization: "AI/ML Specialist"
    expertise:
      - RAG systems
      - LLM integration
      - Model deployment
      - Vector embeddings
    workload: "current: 0 tasks, capacity: 2 tasks"
    performance_score: 93
```

**Matching Algorithm:**

```typescript
function matchTodoToAgent(todo: Todo): Agent {
  // 1. Check explicit assignment
  if (todo.assigned_agent) {
    return getAgent(todo.assigned_agent);
  }

  // 2. Match by file patterns
  if (todo.files_involved.some(f => f.endsWith('.sql') || f.includes('migration'))) {
    return agents.dana_database;
  }
  if (todo.files_involved.some(f => f.includes('api/') || f.includes('routes/'))) {
    return agents.marcus_backend;
  }
  if (todo.files_involved.some(f => f.endsWith('.tsx') || f.endsWith('.vue'))) {
    return agents.james_frontend;
  }
  if (todo.files_involved.some(f => f.includes('test') || f.includes('spec'))) {
    return agents.maria_qa;
  }

  // 3. Match by keywords
  const keywords = todo.description.toLowerCase();
  if (keywords.includes('database') || keywords.includes('schema')) {
    return agents.dana_database;
  }
  if (keywords.includes('api') || keywords.includes('endpoint')) {
    return agents.marcus_backend;
  }
  if (keywords.includes('ui') || keywords.includes('component')) {
    return agents.james_frontend;
  }

  // 4. Match by domain tags
  switch (todo.domain) {
    case 'database': return agents.dana_database;
    case 'api': return agents.marcus_backend;
    case 'frontend': return agents.james_frontend;
    case 'testing': return agents.maria_qa;
    case 'requirements': return agents.alex_ba;
    case 'documentation': return agents.sarah_pm;
    case 'ai_ml': return agents.dr_ai_ml;
    default: return agents.sarah_pm;  // PM coordinates unknown work
  }
}
```

**Assignment Result:**

```yaml
Todo Assignments:
  001-pending-p1-auth-database-schema.md:
    assigned_to: dana-database
    reason: "File pattern match: supabase/migrations/001_auth.sql"
    confidence: 95%

  002-pending-p1-auth-api-endpoints.md:
    assigned_to: marcus-backend
    reason: "Keyword match: 'API endpoints', 'authentication'"
    confidence: 98%
    sub_agent: marcus-node-backend (project uses Node.js)

  003-pending-p1-auth-frontend-ui.md:
    assigned_to: james-frontend
    reason: "File pattern match: src/components/auth/LoginForm.tsx"
    confidence: 92%
    sub_agent: james-react-frontend (project uses React)

  004-pending-p2-auth-test-coverage.md:
    assigned_to: maria-qa
    reason: "Domain tag: testing, keyword: 'test coverage'"
    confidence: 100%

  005-pending-p2-auth-documentation.md:
    assigned_to: sarah-pm
    reason: "Keyword match: 'documentation', 'README'"
    confidence: 88%
```

### 3. Dependency Graph Analysis

<thinking>
Build dependency graph to determine execution order and parallelization opportunities.
</thinking>

**Dependency Extraction:**

```yaml
Dependency Graph:
  001-auth-database:
    depends_on: []  # No dependencies
    blocks: [002, 003, 004]  # Must complete before others
    parallel_group: 1
    estimated_effort: 6 hours

  002-auth-api:
    depends_on: [001]  # Needs database schema
    blocks: [003, 004]  # Frontend needs API, tests need both
    parallel_group: 2
    estimated_effort: 12 hours

  003-auth-frontend:
    depends_on: [001, 002]  # Needs database + API
    blocks: [004]  # Tests need UI
    parallel_group: 3
    estimated_effort: 8 hours

  004-auth-tests:
    depends_on: [001, 002, 003]  # Needs everything
    blocks: []  # Nothing depends on tests
    parallel_group: 4
    estimated_effort: 4 hours

  005-auth-docs:
    depends_on: [001, 002, 003]  # Document after implementation
    blocks: []  # Nothing depends on docs
    parallel_group: 4  # Can run parallel with tests
    estimated_effort: 2 hours
```

**Execution Waves:**

```yaml
Wave 1 (Parallel: 1 task):
  - 001-auth-database (Dana) - 6 hours
  total_wave_time: 6 hours

Wave 2 (Parallel: 1 task):
  - 002-auth-api (Marcus) - 12 hours
  total_wave_time: 12 hours

Wave 3 (Parallel: 1 task):
  - 003-auth-frontend (James) - 8 hours
  total_wave_time: 8 hours

Wave 4 (Parallel: 2 tasks):  # Tests + Docs can run together
  - 004-auth-tests (Maria) - 4 hours
  - 005-auth-docs (Sarah) - 2 hours
  total_wave_time: 4 hours (longest task)

Total Sequential Time: 30 hours
Total Parallel Time: 30 hours (no parallelization in this case due to dependencies)

Optimization Opportunity:
  Wave 4 saves 2 hours (4h instead of 6h sequential)
  Efficiency gain: 6.7%
```

### 4. Workload Balancing

<thinking>
Distribute work evenly across agents to prevent bottlenecks.
</thinking>

**Current Workload:**

```yaml
Agent Workloads (before delegation):
  dana-database: 0 tasks (0 hours)
  marcus-backend: 1 task (4 hours remaining)
  james-frontend: 0 tasks (0 hours)
  maria-qa: 0 tasks (0 hours)
  alex-ba: 0 tasks (0 hours)
  sarah-pm: 0 tasks (0 hours)
  dr-ai-ml: 0 tasks (0 hours)

Agent Workloads (after delegation):
  dana-database: 1 task (6 hours) ← 🟢 Good
  marcus-backend: 2 tasks (16 hours) ← ⚠️ High load
  james-frontend: 1 task (8 hours) ← 🟢 Good
  maria-qa: 1 task (4 hours) ← 🟢 Light
  sarah-pm: 1 task (2 hours) ← 🟢 Light

Bottleneck Analysis:
  primary_bottleneck: marcus-backend (16 hours)
  secondary_bottleneck: james-frontend (8 hours)

  mitigation:
    - Consider using marcus sub-agents for parallelization
    - marcus-node-backend handles auth endpoints
    - marcus-python-backend handles data processing (if separate todo)
```

**Load Balancing Strategy:**

```yaml
Optimization:
  # If Marcus has 3+ tasks, distribute to sub-agents
  marcus_tasks:
    - auth-api (marcus-node-backend) - 12 hours
    - payment-api (marcus-python-backend) - 8 hours
    - analytics-api (marcus-go-backend) - 6 hours

  parallel_execution: true
  total_time: 12 hours (longest task)
  sequential_time: 26 hours
  time_saved: 14 hours (54% faster!)
```

### 5. Generate Delegation Plan

<thinking>
Create comprehensive delegation plan with assignments, order, and coordination.
</thinking>

**Delegation Plan:**

```markdown
# Work Delegation Plan: User Authentication Feature

**Generated**: 2025-10-13 16:45:00
**Scope**: 5 todos (P1: 4, P2: 1)
**Total Effort**: 32 hours
**Parallel Execution**: Enabled (Rule 1)
**Estimated Duration**: 30 hours (sequential) → 30 hours (with parallelization)

---

## Execution Waves

### Wave 1: Database Layer (6 hours)
**Executor**: Dana-Database
**Dependencies**: None (can start immediately)

**Task**: 001-pending-p1-auth-database-schema.md
- Create users table (email, password_hash, roles)
- Create sessions table (token, user_id, expires_at)
- Add RLS policies for data isolation
- Create indexes on email (unique) and session_token

**Deliverables**:
- `supabase/migrations/001_create_users.sql`
- `supabase/migrations/002_create_sessions.sql`
- `supabase/migrations/003_auth_rls_policies.sql`

**Quality Gates**:
- Migration succeeds without errors
- RLS policies tested with 3 different users
- Indexes created correctly

**Coordination**:
- Notify Marcus when database ready: "Schema available for API integration"
- Share table definitions with team

---

### Wave 2: API Layer (12 hours)
**Executor**: Marcus-Backend (sub-agent: marcus-node-backend)
**Dependencies**: Wave 1 (database schema must exist)

**Task**: 002-pending-p1-auth-api-endpoints.md
- POST /auth/signup (email validation, password hashing)
- POST /auth/login (JWT generation, httpOnly cookie)
- POST /auth/refresh (token rotation)
- DELETE /auth/logout (session revocation)
- GET /auth/me (current user info)

**Deliverables**:
- `src/api/auth/signup.ts`
- `src/api/auth/login.ts`
- `src/api/auth/refresh.ts`
- `src/api/auth/logout.ts`
- `src/middleware/auth.ts`

**Quality Gates**:
- All endpoints return < 200ms
- OWASP Top 10 security validation passed
- Stress tests auto-generated (Rule 2)

**Coordination**:
- Notify James when API ready: "Auth endpoints available at /auth/*"
- Share API documentation (OpenAPI spec)

---

### Wave 3: Frontend Layer (8 hours)
**Executor**: James-Frontend (sub-agent: james-react-frontend)
**Dependencies**: Wave 2 (API must be functional)

**Task**: 003-pending-p1-auth-frontend-ui.md
- LoginForm component (email, password, validation)
- SignupForm component (email, password, confirm)
- AuthProvider (React Context for current user)
- Protected routes with auth check

**Deliverables**:
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignupForm.tsx`
- `src/contexts/AuthContext.tsx`
- `src/hooks/useAuth.ts`

**Quality Gates**:
- WCAG 2.1 AA accessibility compliance
- Forms validated with React Hook Form + Zod
- Responsive design (mobile, tablet, desktop)

**Coordination**:
- Notify Maria when UI ready: "Auth components ready for testing"

---

### Wave 4: Quality & Documentation (4 hours - parallel)
**Executors**: Maria-QA + Sarah-PM (parallel execution)
**Dependencies**: Wave 3 (full feature must be implemented)

#### Task A: Testing (Maria-QA) - 4 hours
- Unit tests for auth service, middleware
- Integration tests for auth endpoints
- E2E tests for signup → login → protected route flow
- Security tests (SQL injection, XSS, CSRF)

**Deliverables**:
- `__tests__/auth/service.test.ts`
- `__tests__/auth/endpoints.test.ts`
- `__tests__/e2e/auth-flow.test.ts`
- Coverage report (target: 90%+)

**Quality Gates**:
- All tests passing
- Coverage ≥ 80% (ideally 90%+)
- 0 high/critical security vulnerabilities

#### Task B: Documentation (Sarah-PM) - 2 hours
- Update README with auth setup instructions
- API documentation (endpoints, request/response)
- User guide (how to sign up, log in)
- Architecture diagram (auth flow)

**Deliverables**:
- `README.md` (updated Auth section)
- `docs/api/authentication.md`
- `docs/guides/user-authentication.md`
- `docs/architecture/auth-flow.md`

**Coordination**:
- Maria and Sarah work in parallel (no file conflicts)
- Total wave time: 4 hours (limited by Maria's testing time)

---

## Summary

**Total Tasks**: 5
**Agent Assignments**:
- Dana-Database: 1 task (6 hours)
- Marcus-Backend: 1 task (12 hours)
- James-Frontend: 1 task (8 hours)
- Maria-QA: 1 task (4 hours)
- Sarah-PM: 1 task (2 hours)

**Timeline**:
- Sequential execution: 32 hours
- Parallel execution: 30 hours (Wave 4 parallelization)
- **Time saved**: 2 hours (6.3% improvement)

**Coordination Points**:
1. Dana → Marcus: "Database schema ready"
2. Marcus → James: "API endpoints ready"
3. James → Maria: "UI components ready"
4. Maria + Sarah → All: "Feature complete"

**Risk Mitigation**:
- Daily check-ins during Wave 2 (longest wave)
- Health monitoring: `npm run monitor` (ensure 100%)
- Rollback plan: Each wave has rollback script

---

## Execution Commands

```bash
# Execute all waves sequentially (default)
/work 001-pending-p1-auth-database-schema
/work 002-pending-p1-auth-api-endpoints
/work 003-pending-p1-auth-frontend-ui
/work 004-pending-p2-auth-test-coverage

# OR: Execute Wave 4 in parallel (Rule 1)
/resolve priority:p2  # Executes 004 + 005 in parallel
```

---

## Success Criteria

- [ ] All 5 todos completed
- [ ] All quality gates passed
- [ ] Tests passing (90%+ coverage)
- [ ] Documentation updated
- [ ] Feature deployed to staging
- [ ] Learnings codified: `/learn feature/auth`

**Estimated Completion**: 30 hours of work (4 days @ 7.5 hours/day)
**Confidence**: 92% (based on similar past features)
```

### 6. Automatic Agent Notification

<thinking>
Notify assigned agents and set up coordination channels.
</thinking>

**Agent Notifications:**

```yaml
Notifications Sent:
  dana-database:
    message: "You have 1 new task: 001-auth-database-schema (P1, 6 hours)"
    priority: high
    start_time: "immediately"
    coordination: "Notify marcus-backend when schema ready"

  marcus-backend:
    message: "You have 1 queued task: 002-auth-api-endpoints (P1, 12 hours)"
    priority: high
    start_time: "after Wave 1 completes"
    dependencies: "Waiting for: 001-auth-database-schema"
    sub_agent: "marcus-node-backend (project uses Node.js)"

  james-frontend:
    message: "You have 1 queued task: 003-auth-frontend-ui (P1, 8 hours)"
    priority: high
    start_time: "after Wave 2 completes"
    dependencies: "Waiting for: 002-auth-api-endpoints"
    sub_agent: "james-react-frontend (project uses React)"

  maria-qa:
    message: "You have 1 queued task: 004-auth-test-coverage (P2, 4 hours)"
    priority: medium
    start_time: "after Wave 3 completes"
    parallel_with: "sarah-pm (005-auth-docs)"

  sarah-pm:
    message: "You have 1 queued task: 005-auth-docs (P2, 2 hours)"
    priority: medium
    start_time: "after Wave 3 completes"
    parallel_with: "maria-qa (004-auth-test-coverage)"
```

## Integration with Compounding Engineering

**Full Cycle**:

1. **ASSESS** (`/assess`) - Verify readiness
2. **PLAN** (`/plan`) - Create detailed implementation plan
3. **DELEGATE** (`/delegate`) ← Smart work distribution
4. **EXECUTE** (`/work` or `/resolve`) - Agents perform work
5. **CODIFY** (`/learn`) - Extract learnings for next cycle

**Compounding Effect**:
Each delegation becomes smarter:
- Learn optimal agent assignments
- Track actual effort vs estimated
- Improve parallelization strategies
- Refine workload balancing

---

**Philosophy**: Compounding Engineering
**Phase**: DELEGATE (smart work distribution)
**Benefit**: Right work to right agent, 20-50% time savings through parallelization
