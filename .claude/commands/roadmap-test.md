---
description: "Load and execute complete roadmap stress tests with real or mock agents"
argument-hint: "[roadmap template name]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Task"
  - "TodoWrite"
  - "Read"
  - "Write"
  - "Bash(npm:*)"
  - "Bash(git:*)"
---

# Roadmap Stress Test - Execute Complete Development Workflows

## Introduction

**Execute complete multi-hour roadmaps end-to-end** with real or simulated agents. This command loads roadmap stress test templates and validates the entire workflow from planning through deployment.

**Philosophy**: "Run a 28-hour auth system in dry-run mode, then run it for real"

**Use Cases**:
- Validate framework before large implementations
- Stress-test agent coordination with multi-feature roadmaps
- Measure actual vs estimated effort for learning
- Test complete SDLC workflow (requirements → deployment)
- Prove Compounding Engineering effectiveness

## Roadmap Template

<roadmap_template> #$ARGUMENTS </roadmap_template>

## Main Tasks

### 1. Load Roadmap Template

<thinking>
Load the specified roadmap template from templates/stress-tests/ directory.
Templates range from 2-hour CRUD endpoints to 2-week multi-feature releases.
</thinking>

**Available Templates:**

```bash
# List available roadmap templates
ls templates/stress-tests/*.yaml

# Templates:
# - small-feature.yaml (2-4 hours, CRUD endpoint)
# - medium-feature.yaml (8-12 hours, analytics dashboard)
# - large-feature.yaml (24-32 hours, auth system)
# - enterprise-roadmap.yaml (80+ hours, 3-feature release)
```

**Template Selection:**

If template name provided:
```bash
roadmap_test "small-feature"
→ Loads templates/stress-tests/small-feature.yaml
```

If no template (interactive):
```
Select roadmap to test:
1. Small Feature (2-4 hours) - CRUD endpoint
2. Medium Feature (8-12 hours) - Analytics dashboard
3. Large Feature (24-32 hours) - Authentication system
4. Enterprise Roadmap (80+ hours) - Multi-feature release

Enter number [1-4]:
```

**Template Parsing:**

Load and parse YAML:
- [ ] Extract `estimated_effort` (hours, range, confidence)
- [ ] Extract `phases` (all phases with dependencies)
- [ ] Extract `todos` (all tasks with acceptance criteria)
- [ ] Extract `agents_required` (which agents needed)
- [ ] Extract `parallel_waves` (execution waves for parallelization)
- [ ] Extract `quality_gates` (all checkpoints)
- [ ] Extract `success_criteria` (validation requirements)

**Example Output:**
```yaml
Loaded Roadmap: large-feature.yaml
Name: Complete Authentication System
Complexity: Large
Estimated Effort: 28 hours (24-32 hours range, 85% confidence)
Phases: 5 phases
Todos: 28 todos
Agents Required: 5 (Alex-BA, Dana, Marcus, James, Maria)
Parallel Waves: 4 waves
Quality Gates: 16 checkpoints
```

---

### 2. Execution Mode Selection

<thinking>
User chooses between dry-run (mock agents) or real execution (actual agents).
Dry-run is fast (minutes) for validation. Real execution takes actual time (hours).
</thinking>

**Mode Options:**

**Option 1: Dry-Run (Mock Execution)**
- **Speed**: 5-10 minutes (regardless of roadmap size)
- **Purpose**: Validate workflow without making changes
- **Agents**: Simulated (no actual execution)
- **Changes**: No code changes, no database modifications
- **Use Case**: Pre-flight validation before real work

**Option 2: Real Execution**
- **Speed**: Actual roadmap time (2-80 hours)
- **Purpose**: Execute roadmap with real agents
- **Agents**: Real agents make actual changes
- **Changes**: Code written, database modified, tests run
- **Use Case**: Actual implementation with stress testing

**Selection Prompt:**
```
Select execution mode:
1. Dry-Run (Mock agents, 5-10 minutes)
2. Real Execution (Actual agents, 28 hours estimated)

Enter number [1-2]:
```

**Additional Flags:**

```bash
# Dry-run only (no prompt)
roadmap-test large-feature --dry-run

# Real execution with timeout (safety)
roadmap-test small-feature --real --timeout=6h

# Real execution with continuous monitoring
roadmap-test medium-feature --real --monitor
```

---

### 3. Pre-Flight Validation

<thinking>
Before executing (especially for real execution), run comprehensive health checks to ensure framework is ready.
</thinking>

**Health Check (Similar to /validate-workflow Phase 1):**

Run framework assessment:
```bash
npm run monitor
```

**Requirements:**

For **Dry-Run Mode**:
- [ ] Framework health ≥ 80% (basic readiness)
- [ ] All required agents present (files exist)
- [ ] Template valid (YAML parses correctly)

For **Real Execution Mode**:
- [ ] Framework health ≥ 95% (strict readiness)
- [ ] All required agents operational (100%)
- [ ] Git working tree clean (no uncommitted changes)
- [ ] Database connected (if roadmap needs DB)
- [ ] Test suite passing (100%)
- [ ] All 5 rules enabled

**Pre-Flight Report:**
```yaml
Pre-Flight Check:
  mode: real-execution
  roadmap: large-feature (28 hours)

  framework_health: 98% ✅
  agents_required: 5/5 available ✅
  git_status: clean ✅
  database: connected ✅
  tests: 100% passing ✅
  rules: 5/5 enabled ✅

  readiness: ✅ READY TO PROCEED
  estimated_duration: 28 hours
  estimated_completion: 2025-10-15 18:30:00
```

**Confirmation Prompt (Real Execution Only):**
```
⚠️  WARNING: Real execution mode selected

This will:
- Execute 28 todos with real agents
- Make actual code changes
- Modify database schema
- Run for approximately 28 hours
- Create 22 git commits

Continue? [y/N]:
```

---

### 4. Execution: Dry-Run Mode

<thinking>
Simulate the complete roadmap without making changes. Fast validation of workflow structure.
</thinking>

**Dry-Run Execution Steps:**

1. **Phase-by-Phase Simulation**

   For each phase in roadmap:
   - [ ] Log phase start (name, agent, estimated hours)
   - [ ] Simulate todos (mark as "simulated")
   - [ ] Check dependencies (would they be met?)
   - [ ] Validate quality gates (are they defined?)
   - [ ] Log phase complete
   - [ ] Track simulated time (instant, but show estimate)

2. **Agent Coordination Simulation**

   - [ ] Identify parallel execution waves
   - [ ] Calculate speedup (parallel vs sequential)
   - [ ] Simulate agent handoffs (validate data passed)
   - [ ] Check for potential collisions
   - [ ] Validate context preservation

3. **Quality Gate Validation**

   - [ ] List all quality gates from template
   - [ ] Verify each has validation method
   - [ ] Check blocking gates vs non-blocking
   - [ ] Validate success criteria are measurable

**Dry-Run Output (Real-Time):**
```
🔄 Executing Dry-Run: large-feature.yaml

Phase 1: Requirements & Business Analysis (Alex-BA)
  ⏱️  Estimated: 2 hours
  📋 Todos: 2/2 simulated
    ✓ 001: Define user stories [SIMULATED]
    ✓ 002: Create API contracts [SIMULATED]
  🎯 Quality Gates: 2/2 defined ✅
  ⏱️  Phase complete (0.5s actual, 2h estimated)

Phase 2: Database Architecture (Dana-Database)
  ⏱️  Estimated: 4 hours
  📋 Todos: 5/5 simulated
    ✓ 003: Create users table [SIMULATED]
    ✓ 004: Create sessions table [SIMULATED]
    ✓ 005: Create password_reset_tokens [SIMULATED]
    ✓ 006: Add RLS policies [SIMULATED]
    ✓ 007: Create indexes [SIMULATED]
  🎯 Quality Gates: 3/3 defined ✅
  ⏱️  Phase complete (0.8s actual, 4h estimated)

Phase 3: Backend API Implementation (Marcus-Backend) [PARALLEL with Phase 4]
  ⏱️  Estimated: 12 hours
  📋 Todos: 10/10 simulated
  🎯 Quality Gates: 3/3 defined ✅
  ⏱️  Phase complete (1.2s actual, 12h estimated)

Phase 4: Frontend UI (James-Frontend) [PARALLEL with Phase 3]
  ⏱️  Estimated: 8 hours
  📋 Todos: 5/5 simulated
  🎯 Quality Gates: 3/3 defined ✅
  ⏱️  Phase complete (0.9s actual, 8h estimated)

Phase 5: Testing & QA (Maria-QA)
  ⏱️  Estimated: 4 hours
  📋 Todos: 6/6 simulated
  🎯 Quality Gates: 4/4 defined ✅
  ⏱️  Phase complete (1.0s actual, 4h estimated)

═══════════════════════════════════════════════════════════════
  Dry-Run Complete
═══════════════════════════════════════════════════════════════

Total Time: 4.4 seconds (simulation)
Estimated Real Time: 28 hours (with parallelization: 22 hours)

Summary:
  ✅ All 5 phases validated
  ✅ All 28 todos structured correctly
  ✅ All 16 quality gates defined
  ✅ Parallel execution identified (3h + 4h → 12h + 8h → 4h)
  ✅ Agent coordination validated (no collisions)
  ✅ Dependencies correct (Phase 2 → 3+4 → 5)

Readiness Score: 95/100 ✅
Recommendation: ✅ READY FOR REAL EXECUTION
```

---

### 5. Execution: Real Mode

<thinking>
Execute the roadmap with real agents making actual changes. Track progress, handle errors, capture learnings.
</thinking>

**Real Execution Steps:**

1. **Initialize TodoWrite**

   Create in-session todo list from roadmap:
   ```markdown
   TodoWrite for large-feature.yaml:

   1. Phase 1: Requirements (Alex-BA) - 2 hours
   2. Phase 2: Database (Dana) - 4 hours
   3. Phase 3: API (Marcus) - 12 hours [PARALLEL]
   4. Phase 4: Frontend (James) - 8 hours [PARALLEL]
   5. Phase 5: Testing (Maria) - 4 hours
   ```

2. **Create Persistent Todos**

   Generate todos/*.md files:
   ```bash
   todos/001-pending-p1-requirements-user-stories.md
   todos/002-pending-p1-requirements-api-contracts.md
   todos/003-pending-p1-database-users-table.md
   ...
   todos/028-pending-p2-testing-performance.md
   ```

3. **Execute Phase-by-Phase**

   For each phase:
   - [ ] Mark phase as in_progress in TodoWrite
   - [ ] Activate assigned agent(s) with Task tool
   - [ ] Agent executes todos (real code changes)
   - [ ] Validate quality gates after phase
   - [ ] Mark phase as completed
   - [ ] Track actual time vs estimated
   - [ ] Commit changes (if specified)

4. **Parallel Execution Handling**

   When parallel phases detected:
   - [ ] Launch multiple agents simultaneously (Task tool)
   - [ ] Monitor progress of each agent
   - [ ] Detect collisions (file conflicts)
   - [ ] Wait for all parallel agents to complete
   - [ ] Merge results

5. **Quality Gate Validation**

   After each phase:
   - [ ] Run automated quality gates (npm test, npm run lint, etc.)
   - [ ] Check blocking gates (stop if failed)
   - [ ] Log non-blocking gate warnings
   - [ ] Allow manual review for manual gates

6. **Progress Monitoring**

   Real-time updates:
   ```
   🚀 Executing: large-feature.yaml (Real Mode)

   [█████████░░░░░░░░░░░] 45% Complete (12.6h / 28h)

   ✅ Phase 1: Requirements (2.1h) - Complete
   ✅ Phase 2: Database (4.3h) - Complete
   🔄 Phase 3: API (Marcus) - In Progress (6.2h / 12h)
      ✅ 008: POST /auth/signup - Complete
      ✅ 009: POST /auth/login - Complete
      🔄 010: POST /auth/logout - In Progress
      ⏳ 011: GET /auth/me - Pending
      ...
   ⏳ Phase 4: Frontend (James) - Pending (starts after Phase 3)
   ⏳ Phase 5: Testing (Maria) - Pending

   Quality Gates Passed: 5/16 ✅
   Next Gate: API Response Time (< 200ms)
   ```

7. **Error Handling**

   If agent fails or quality gate fails:
   - [ ] Log error with context
   - [ ] Mark todo as failed
   - [ ] Pause execution (ask user to fix or skip)
   - [ ] Offer rollback option
   - [ ] Track failure for learning

**Real Execution Output (End of Phase):**
```
Phase 3 Complete: Backend API Implementation

Agent: Marcus-Backend
Estimated: 12 hours
Actual: 11.2 hours
Variance: -0.8 hours (-6.7%) ✅

Todos Completed: 10/10 ✅
  ✅ 008: POST /auth/signup (1.5h)
  ✅ 009: POST /auth/login (1.8h)
  ✅ 010: POST /auth/logout (0.7h)
  ✅ 011: GET /auth/me (0.9h)
  ✅ 012: POST /auth/refresh (1.3h)
  ✅ 013: POST /auth/forgot-password (1.2h)
  ✅ 014: POST /auth/reset-password (1.1h)
  ✅ 015: POST /auth/oauth/google (1.9h)
  ✅ 016: Implement auth middleware (0.6h)
  ✅ 017: OWASP security hardening (0.2h)

Quality Gates: 3/3 ✅
  ✅ API Response Time: 185ms (target: < 200ms) ✅
  ✅ Security Scan: OWASP ZAP passed ✅
  ✅ Rate Limiting: 11th attempt returned 429 ✅

Code Changes:
  - 12 files created
  - 1,847 lines added
  - 3 git commits

Next Phase: Frontend UI (James-Frontend)
```

---

### 6. Quality Gate Enforcement

<thinking>
After each phase, validate quality gates. Blocking gates stop execution if failed. Non-blocking gates warn but allow continuation.
</thinking>

**Quality Gate Execution:**

For each quality gate in phase:

1. **Automated Gates**
   ```bash
   # Run automated check
   npm run test:coverage
   # Check result against target (≥ 80%)
   # Pass/Fail based on result
   ```

2. **Manual Gates**
   ```
   Manual Review Required:
   Gate: "API contract matches frontend expectations"

   Review Checklist:
   - [ ] All endpoints documented in OpenAPI spec
   - [ ] Request/response schemas match frontend types
   - [ ] Error formats consistent

   Pass this gate? [y/N]:
   ```

3. **Blocking vs Non-Blocking**

   **Blocking Gate Failed:**
   ```
   ❌ BLOCKING GATE FAILED

   Gate: Test Coverage (≥ 80%)
   Actual: 72%
   Target: ≥ 80%

   This is a BLOCKING gate. Execution paused.

   Options:
   1. Fix issues and retry gate
   2. Skip gate (not recommended)
   3. Abort execution

   Enter number [1-3]:
   ```

   **Non-Blocking Gate Failed:**
   ```
   ⚠️  NON-BLOCKING GATE WARNING

   Gate: Lighthouse Performance Score
   Actual: 87
   Target: ≥ 90

   This is a non-blocking gate. Execution continues.
   Recommendation: Optimize bundle size before deployment.
   ```

**Quality Gate Summary:**
```yaml
Quality Gates Status (Phase 3):
  total: 3
  passed: 2 ✅
  failed: 1 ❌
  blocking_failed: 0 ✅

Gates:
  ✅ API Response Time: 185ms < 200ms (target)
  ✅ Security Scan: OWASP ZAP no high vulnerabilities
  ❌ Rate Limiting: Not configured (non-blocking) ⚠️

Overall: PASSED (all blocking gates passed)
```

---

### 7. Learning Capture

<thinking>
After completion (or failure), capture learnings for Compounding Engineering. Store in RAG for future roadmaps.
</thinking>

**Automatic Learning Capture:**

Collect metrics:
- [ ] **Effort Accuracy**: Estimated vs actual for each phase
- [ ] **Quality Gate Effectiveness**: Which gates caught issues?
- [ ] **Agent Performance**: Switch time, handoff success rate
- [ ] **Parallel Efficiency**: Actual speedup vs theoretical
- [ ] **Error Patterns**: What failed and why?

**Learning Structure:**
```yaml
Learnings from large-feature.yaml Execution:

effort_accuracy:
  phase_1_requirements:
    estimated: 2.0 hours
    actual: 2.1 hours
    variance: +5.0%
  phase_2_database:
    estimated: 4.0 hours
    actual: 4.3 hours
    variance: +7.5%
  phase_3_api:
    estimated: 12.0 hours
    actual: 11.2 hours
    variance: -6.7%
  phase_4_frontend:
    estimated: 8.0 hours
    actual: 8.5 hours
    variance: +6.3%
  phase_5_testing:
    estimated: 4.0 hours
    actual: 3.8 hours
    variance: -5.0%

  total:
    estimated: 30.0 hours (28h + 2h buffer)
    actual: 29.9 hours
    variance: -0.3% ✅ (excellent accuracy!)

quality_gates:
  most_valuable: "Security Scan (caught 2 vulnerabilities)"
  least_valuable: "Manual API review (all issues found by automation)"
  blocking_gates_triggered: 0
  non_blocking_warnings: 3

agent_performance:
  alex_ba:
    switch_time: 1.2s ✅
    handoff_success: 100% ✅
  dana_database:
    switch_time: 1.5s ✅
    handoff_success: 100% ✅
  marcus_backend:
    switch_time: 1.8s ✅
    handoff_success: 100% ✅
  james_frontend:
    switch_time: 1.6s ✅
    handoff_success: 100% ✅
  maria_qa:
    switch_time: 1.4s ✅
    handoff_success: 100% ✅

parallel_efficiency:
  theoretical_speedup: 2.4x
  actual_speedup: 2.1x (88% efficiency)
  reason: "Context switching overhead, 10 min handoff delays"

patterns_extracted:
  - "JWT generation pattern (src/auth/jwt-service.ts:42-67)"
  - "bcrypt password hashing (src/auth/password-hasher.ts:15-28)"
  - "Rate limiting middleware (src/middleware/rate-limit.ts:10-35)"

pitfalls_avoided:
  - "Added email index early (prevented 2s login queries)"
  - "Used httpOnly cookies (prevented XSS attacks)"
  - "Implemented token rotation (prevented replay attacks)"

recommendations:
  next_auth_system: "22 hours (21% faster with these patterns)"
  improvements:
    - "Parallelize Phase 2+3 (Dana creates schema while Marcus starts API stubs)"
    - "Automate manual API review gate (use OpenAPI validator)"
    - "Add integration tests earlier (caught issue late in Phase 5)"
```

**Store Learnings:**
```bash
# Automatically run /learn command
/learn "Feature: Complete authentication system (large-feature.yaml execution)"

# Stores in RAG vector database
# Future /plan commands will use this data for better estimates
```

---

### 8. Final Report

<thinking>
Generate comprehensive report with all metrics, learnings, and recommendations.
</thinking>

**Report Structure:**

```
═══════════════════════════════════════════════════════════════
  Roadmap Test Complete: large-feature.yaml
═══════════════════════════════════════════════════════════════

Execution Mode: Real Execution
Duration: 29.9 hours (estimated: 28 hours)
Variance: +1.9 hours (+6.8%)

═══════════════════════════════════════════════════════════════
  Summary
═══════════════════════════════════════════════════════════════

Status: ✅ COMPLETE
Overall Score: 94/100

Phases: 5/5 completed ✅
Todos: 28/28 completed ✅
Quality Gates: 16/16 passed ✅
Agents: 5/5 successful ✅

═══════════════════════════════════════════════════════════════
  Effort Accuracy
═══════════════════════════════════════════════════════════════

Phase 1 (Requirements):   2.1h / 2.0h (+5.0%) ✅
Phase 2 (Database):       4.3h / 4.0h (+7.5%) ✅
Phase 3 (API):           11.2h / 12.0h (-6.7%) ✅
Phase 4 (Frontend):       8.5h / 8.0h (+6.3%) ✅
Phase 5 (Testing):        3.8h / 4.0h (-5.0%) ✅

Total:                   29.9h / 30.0h (-0.3%) ✅ EXCELLENT

═══════════════════════════════════════════════════════════════
  Agent Performance
═══════════════════════════════════════════════════════════════

Alex-BA:      2.1h   100% success   1.2s switch time ✅
Dana:         4.3h   100% success   1.5s switch time ✅
Marcus:      11.2h   100% success   1.8s switch time ✅
James:        8.5h   100% success   1.6s switch time ✅
Maria:        3.8h   100% success   1.4s switch time ✅

Average Switch Time: 1.5s (target: < 2s) ✅
Handoff Success Rate: 100% (20/20 handoffs) ✅

═══════════════════════════════════════════════════════════════
  Quality Gates
═══════════════════════════════════════════════════════════════

Total Gates: 16
Passed: 16 ✅
Failed: 0 ✅
Blocking Gates Triggered: 0 ✅

Most Valuable Gate: "Security Scan (caught 2 vulnerabilities)"

═══════════════════════════════════════════════════════════════
  Code Changes
═══════════════════════════════════════════════════════════════

Files Created: 38
Lines Added: 4,521
Lines Modified: 89
Git Commits: 22
Test Coverage: 84% (target: ≥ 80%) ✅

═══════════════════════════════════════════════════════════════
  Learnings Captured
═══════════════════════════════════════════════════════════════

Patterns Extracted: 12 patterns stored in RAG
Code Examples: 18 examples with file paths
Pitfalls Documented: 8 issues to avoid
Recommendations: 6 improvements for next iteration

Next Iteration Prediction:
  Estimated Effort: 22 hours (-26% with learning)
  Confidence: 92% (up from 85%)

═══════════════════════════════════════════════════════════════
  Recommendations
═══════════════════════════════════════════════════════════════

✅ READY FOR PRODUCTION DEPLOYMENT

Suggested Improvements:
  1. Parallelize Phase 2+3 (save 2 hours)
  2. Automate manual API review gate
  3. Add integration tests earlier in workflow
  4. Consider Redis caching for login endpoint (220ms → 180ms)

═══════════════════════════════════════════════════════════════
  Compounding Engineering Impact
═══════════════════════════════════════════════════════════════

Baseline (v1.0):     30 hours (this execution)
Predicted (v2.0):    22 hours (-26% with patterns)
Predicted (v3.0):    16 hours (-47% with maturity)

Compounding Effect: Each iteration 20-30% faster ✅

═══════════════════════════════════════════════════════════════
  Next Steps
═══════════════════════════════════════════════════════════════

1. Review learnings: Read captured patterns and pitfalls
2. Deploy to staging: Test with real users
3. Run next roadmap: Apply learnings to similar feature
4. Measure improvement: Compare effort accuracy

Report saved to: docs/roadmap-tests/large-feature-2025-10-13.md
```

---

## Usage Examples

### Example 1: Dry-Run Validation
```bash
/roadmap-test large-feature --dry-run

→ Loads auth system template (28 hours)
→ Simulates all 5 phases in 4.4 seconds
→ Reports: 95/100 readiness score
→ Recommendation: READY FOR REAL EXECUTION
```

### Example 2: Real Execution with Timeout
```bash
/roadmap-test small-feature --real --timeout=6h

→ Executes CRUD endpoint (3 hours estimated)
→ Real agents make changes
→ Timeout protection (aborts if > 6 hours)
→ Reports: 29.9h actual vs 30h estimated (99.7% accurate)
```

### Example 3: Interactive Mode
```bash
/roadmap-test

→ Shows menu of available templates
→ Prompts for execution mode (dry-run or real)
→ Asks for confirmation before real execution
→ Provides real-time progress updates
```

---

## Output Format

Present comprehensive roadmap test results with:
1. **Execution Summary** (duration, variance, status)
2. **Effort Accuracy** (estimated vs actual per phase)
3. **Agent Performance** (switch time, handoff success)
4. **Quality Gates** (passed/failed, most valuable)
5. **Code Changes** (files, lines, commits, coverage)
6. **Learnings Captured** (patterns, examples, recommendations)
7. **Compounding Impact** (baseline, predictions)
8. **Next Steps** (deploy, apply learnings, measure)

---

**Framework Version**: 7.0
**Command Type**: Stress Testing & Validation
**Estimated Duration**: 5-10 minutes (dry-run), 2-80 hours (real execution)
**Maintenance**: Add new templates as roadmap patterns emerge
