---
description: "End-to-end validation of complex multi-hour development workflows"
argument-hint: "[roadmap template name or feature description]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Read"
  - "Grep"
  - "Glob"
  - "Bash(npm:*)"
  - "Bash(git:*)"
---

# Validate Complete Development Workflow

## Introduction

**Comprehensive end-to-end validation** for complex, multi-hour development workflows. This command stress-tests the entire Compounding Engineering cycle (Assess → Plan → Delegate → Execute → Codify) to ensure your framework is ready for production roadmaps.

**Philosophy**: "Test the workflow before running a 28-hour auth implementation"

**Use Cases**:
- Validate framework before starting large features (24+ hours)
- Stress-test agent coordination for complex roadmaps
- Verify Compounding Engineering cycle effectiveness
- Ensure quality gates catch issues reliably
- Validate effort estimation accuracy

## Validation Target

<validation_target> #$ARGUMENTS </validation_target>

## Main Tasks

### Phase 1: Pre-Flight Deep Assessment

<thinking>
Stricter than /assess - we need 95%+ health for complex multi-hour workflows. A 28-hour auth system implementation requires perfect infrastructure.
</thinking>

**Enhanced Health Check:**

Run comprehensive validation:
```bash
npm run monitor
```

**Strict Requirements (95%+ overall health)**:

- [ ] **Framework Health**: ≥ 95% (vs 80% for /assess)
  - Overall: 95-100% ✅
  - Agent Health: 100% (all 18 agents operational)
  - Proactive System: ≥ 98% (auto-activation flawless)
  - Rules Efficiency: 100% (all 5 rules enabled and tested)
  - Framework Integrity: 100% (zero critical files missing)

- [ ] **Agent Availability**: All agents at 100%
  - Database: Dana-Database ✅
  - Backend: Marcus-Backend ✅
  - Frontend: James-Frontend ✅
  - Quality: Maria-QA ✅
  - Business: Alex-BA ✅
  - Project: Sarah-PM ✅
  - AI/ML: Dr.AI-ML ✅
  - Feedback: feedback-codifier ✅
  - Sub-agents: All 10 language specialists ✅

- [ ] **Rule Status**: All automation enabled
  - Rule 1 (Parallel Execution): ✅ Tested with mock tasks
  - Rule 2 (Stress Testing): ✅ Test suite passing
  - Rule 3 (Daily Audit): ✅ Last audit < 24h ago
  - Rule 4 (Intelligent Onboarding): ✅ Config valid
  - Rule 5 (Automated Releases): ✅ Git hooks working

- [ ] **Infrastructure**:
  - Git: Clean working tree ✅
  - Dependencies: All installed, zero vulnerabilities ✅
  - Database: Connected, migrations applied ✅
  - Environment: All variables set ✅
  - Build: Passes without errors ✅
  - Tests: 100% passing (not just 80%+) ✅

**Pre-Flight Report:**
```yaml
Pre-Flight Assessment:
  overall_health: 98%
  status: ✅ READY FOR COMPLEX WORKFLOWS
  readiness_score: 98/100

  component_health:
    framework: 100% ✅
    agents: 100% ✅ (18/18 operational)
    rules: 100% ✅ (5/5 enabled)
    infrastructure: 95% ✅ (1 minor warning)

  warnings:
    - ⚠️ Database connection: 180ms latency (target: < 100ms)
      Impact: Low (API calls will be 80ms slower)
      Mitigation: Consider local database for development

  recommendations:
    - ✅ Framework is ready for multi-hour workflows
    - ⚠️ Consider database optimization for best performance
```

---

### Phase 2: Workflow Simulation (Dry-Run)

<thinking>
Simulate a complete workflow without making changes. This tests the planning → delegation → execution flow with mock agents to catch coordination issues.
</thinking>

**Load Roadmap Template:**

If template name provided (e.g., "auth-system"):
```bash
# Load from templates/plan-templates/auth-system.yaml
```

If feature description provided (e.g., "Add user authentication"):
```bash
# Match to template using keywords
# Fall back to /plan command to generate plan
```

**Simulation Steps:**

1. **Plan Generation**
   - [ ] Run /plan command (or load template)
   - [ ] Verify plan includes all phases (DB → API → Frontend → Testing)
   - [ ] Check effort estimate has confidence interval (±X hours)
   - [ ] Validate historical context present (similar features found)
   - [ ] Confirm template matched correctly (if applicable)

2. **Delegation Simulation**
   - [ ] Run /delegate logic (mock, no actual agent activation)
   - [ ] Verify todos created (TodoWrite + todos/*.md files)
   - [ ] Check agent assignments (right agent for each task)
   - [ ] Validate dependency graph (correct execution order)
   - [ ] Confirm parallel execution waves identified

3. **Execution Simulation**
   - [ ] Mock agent activations (track handoffs without executing)
   - [ ] Validate agent coordination protocol
     * Alex-BA → Marcus-Backend (API contracts defined)
     * Marcus-Backend → James-Frontend (API endpoints ready)
     * All → Maria-QA (quality validation)
   - [ ] Check context preservation across handoffs
   - [ ] Measure agent switch time (target: < 2 seconds)

4. **Quality Gates Validation**
   - [ ] List all quality gates from template
   - [ ] Verify checkpoints exist for each phase
     * Database: Schema valid, indexes created, RLS policies
     * API: Endpoints defined, security checked, performance targets
     * Frontend: Components designed, accessible, responsive
     * Testing: Coverage ≥80%, E2E tests planned, security tests
   - [ ] Confirm blocking gates (work stops if gate fails)

5. **Timeline Estimation**
   - [ ] Sum effort estimates across all phases
   - [ ] Calculate confidence interval (based on historical data)
   - [ ] Estimate total development time (hours)
   - [ ] Project completion date (based on daily capacity)

**Simulation Report:**
```yaml
Workflow Simulation:
  template: auth-system.yaml
  estimated_effort: 28 hours ± 4 hours (85% confidence)
  status: ✅ SIMULATION SUCCESSFUL

  plan_generation:
    phases_identified: 4 (DB, API, Frontend, Testing) ✅
    templates_matched: auth-system (90% similarity) ✅
    historical_context: 3 similar features found ✅
    confidence_score: 85% ✅

  delegation:
    todos_created: 12 (4 DB, 5 API, 6 Frontend, 3 Testing) ✅
    agent_assignments: Optimal ✅
      - Dana-Database: 4 tasks (6 hours)
      - Marcus-Backend: 5 tasks (12 hours)
      - James-Frontend: 6 tasks (8 hours)
      - Maria-QA: 3 tasks (2 hours)
    dependency_graph: Valid ✅ (3 execution waves)
    parallel_efficiency: 3.2x speedup ✅

  execution_simulation:
    agent_handoffs: 8 handoffs simulated ✅
    context_preservation: 100% (no data loss) ✅
    agent_switch_time: 1.8s (target: < 2s) ✅

  quality_gates:
    gates_defined: 12 checkpoints ✅
    coverage: Database (4), API (5), Frontend (6), Testing (3) ✅
    blocking_gates: 4 critical gates ✅

  timeline:
    estimated_completion: 28 hours ± 4 hours
    with_3_devs: 10 hours (3.2x parallel speedup)
    with_1_dev: 28 hours (sequential)
    calendar_time: 3.5 days (8 hours/day)
```

---

### Phase 3: Agent Coordination Stress Test

<thinking>
Test parallel agent execution with real agents (but mock work) to validate Rule 1 works correctly and no collision issues exist.
</thinking>

**Parallel Agent Activation:**

Trigger 4 agents simultaneously (parallel research phase):
- [ ] Alex-BA: Requirements analysis
- [ ] Dana-Database: Schema design research
- [ ] Marcus-Backend: API patterns research
- [ ] James-Frontend: Component patterns research

**Coordination Tests:**

1. **No Collision Detection**
   - [ ] All 4 agents can run in parallel
   - [ ] No file write conflicts
   - [ ] No database lock issues
   - [ ] No race conditions

2. **Handoff Protocol**
   - [ ] Alex-BA finishes → Marcus-Backend receives requirements ✅
   - [ ] Marcus-Backend finishes → James-Frontend receives API contracts ✅
   - [ ] Both finish → Maria-QA receives completed work ✅
   - [ ] Context preserved across all handoffs ✅

3. **Performance Metrics**
   - [ ] Agent switch time: < 2 seconds
   - [ ] Parallel speedup: ≥ 3x (vs sequential)
   - [ ] Context accuracy: ≥ 99.9%
   - [ ] Handoff success rate: 100%

**Stress Test Scenarios:**

Test edge cases:
- [ ] **Concurrent File Edits**: 2 agents edit different files simultaneously
- [ ] **Sequential Dependencies**: Agent B waits for Agent A to finish
- [ ] **Failed Agent**: Agent fails mid-work, recovery protocol triggered
- [ ] **Context Overflow**: Large context passed between agents (>100KB)
- [ ] **Long-Running Task**: Agent works for 2+ hours, context preserved

**Coordination Report:**
```yaml
Agent Coordination Stress Test:
  status: ✅ PASS
  parallel_agents_tested: 4 (Alex, Dana, Marcus, James)

  collision_detection:
    file_conflicts: 0 ✅
    database_locks: 0 ✅
    race_conditions: 0 ✅

  handoff_protocol:
    alex_to_marcus: ✅ (1.2s, 100% context)
    marcus_to_james: ✅ (1.5s, 100% context)
    both_to_maria: ✅ (1.8s, 100% context)

  performance:
    agent_switch_time: 1.5s avg (target: < 2s) ✅
    parallel_speedup: 3.4x (target: ≥ 3x) ✅
    context_accuracy: 99.9% ✅
    handoff_success_rate: 100% (8/8) ✅

  stress_scenarios:
    concurrent_edits: ✅ PASS (no conflicts)
    sequential_deps: ✅ PASS (wait protocol works)
    failed_agent: ✅ PASS (recovery triggered)
    context_overflow: ✅ PASS (100KB+ handled)
    long_running: ✅ PASS (2h+ context preserved)
```

---

### Phase 4: Quality Gates Deep Validation

<thinking>
Validate every quality gate checkpoint from the template to ensure nothing is missed during actual implementation.
</thinking>

**Gate Discovery:**

Load template and extract all quality gates:
- [ ] Database phase gates (schema, migrations, indexes, RLS)
- [ ] API phase gates (endpoints, security, performance, validation)
- [ ] Frontend phase gates (components, accessibility, responsive, state)
- [ ] Testing phase gates (coverage, E2E, security, performance)

**Gate Validation:**

For each gate, verify:
1. **Checkpoint Definition**
   - [ ] Clear success criteria (e.g., "80%+ test coverage")
   - [ ] Measurable metric (e.g., "< 200ms API response")
   - [ ] Blocking behavior defined (fail → stop work)

2. **Validation Method**
   - [ ] Automated check available (npm script, API test)
   - [ ] Manual review process defined
   - [ ] Tools specified (jest, lighthouse, axe-core)

3. **Failure Recovery**
   - [ ] Clear error message
   - [ ] Remediation steps documented
   - [ ] Rollback procedure if needed

**Example Gate Validation:**

```yaml
Gate: "API Performance - Login endpoint < 200ms (P95)"

Definition:
  success_criteria: "95% of login requests complete in < 200ms"
  metric: "P95 response time"
  blocking: true (stop deployment if > 200ms)

Validation:
  automated: "npm run test:performance -- login"
  manual: "Use autocannon for load testing"
  tools: ["autocannon", "clinic.js"]

Failure_Recovery:
  error: "Login endpoint: 220ms (target: < 200ms)"
  remediation:
    - "Add Redis caching for session lookup"
    - "Add database index on users(email)"
    - "Optimize bcrypt rounds (reduce from 12 to 10)"
  rollback: "Revert to previous API version"
```

**Quality Gates Report:**
```yaml
Quality Gates Validation:
  total_gates: 16
  status: ✅ ALL GATES VALIDATED

  by_phase:
    database: 4 gates ✅
      - Schema validation: ✅ (automated with Zod)
      - Index creation: ✅ (SQL EXPLAIN queries)
      - RLS policies: ✅ (Supabase policy editor)
      - Migration safety: ✅ (dry-run on staging)

    api: 5 gates ✅
      - Endpoint definitions: ✅ (OpenAPI spec)
      - Security checks: ✅ (OWASP ZAP scan)
      - Performance: ✅ (autocannon load test)
      - Input validation: ✅ (Zod schema validation)
      - Error handling: ✅ (test all error codes)

    frontend: 4 gates ✅
      - Component design: ✅ (Storybook review)
      - Accessibility: ✅ (axe-core, score ≥95)
      - Responsive: ✅ (Chrome DevTools, 3 breakpoints)
      - State management: ✅ (Redux DevTools)

    testing: 3 gates ✅
      - Coverage: ✅ (jest --coverage, ≥80%)
      - E2E tests: ✅ (Playwright, critical paths)
      - Security tests: ✅ (npm audit, OWASP checks)

  blocking_gates: 4 critical gates identified ✅
    1. Security scan: Must pass OWASP Top 10
    2. Test coverage: Must reach 80%+
    3. Accessibility: Must score ≥95 (axe-core)
    4. Performance: All API endpoints < 200ms

  validation_coverage: 100% ✅
    - All gates have automated checks
    - All gates have clear success criteria
    - All gates have failure recovery plans
```

---

### Phase 5: Compounding Engineering Cycle Test

<thinking>
Validate the complete Assess → Plan → Delegate → Execute → Codify loop works correctly and learning compounds over time.
</thinking>

**Cycle Validation:**

Run the complete cycle 3 times with progressively more accurate results:

**Iteration 1: Bootstrap (No Historical Data)**
1. **Assess**: Run /assess → expect ≥90% readiness
2. **Plan**: Run /plan → expect conservative estimate (wide confidence interval ±50%)
3. **Delegate**: Run /delegate → expect basic agent matching (keyword-based)
4. **Execute**: (Mock) implementation → simulate 100% success
5. **Codify**: Run /learn → store patterns to RAG (first feature data)

**Expected Result**:
- Effort estimate: 28 hours ± 14 hours (50% confidence)
- Plan quality: 70/100 (no historical data)

**Iteration 2: With Historical Data (1 feature)**
1. **Assess**: Run /assess → expect ≥95% readiness (now have baseline)
2. **Plan**: Run /plan → expect better estimate (narrower confidence interval ±30%)
3. **Delegate**: Run /delegate → expect improved agent matching (pattern-based)
4. **Execute**: (Mock) implementation → simulate 100% success
5. **Codify**: Run /learn → store patterns to RAG (second feature data)

**Expected Result**:
- Effort estimate: 28 hours ± 8 hours (70% confidence)
- Plan quality: 80/100 (1 similar feature reference)

**Iteration 3: Compounding Effect (2+ features)**
1. **Assess**: Run /assess → expect 98%+ readiness (established baseline)
2. **Plan**: Run /plan → expect accurate estimate (tight confidence interval ±15%)
3. **Delegate**: Run /delegate → expect optimal agent matching (ML-based)
4. **Execute**: (Mock) implementation → simulate 100% success
5. **Codify**: Run /learn → store patterns to RAG (third feature data)

**Expected Result**:
- Effort estimate: 28 hours ± 4 hours (85% confidence)
- Plan quality: 90/100 (3 similar feature references)

**Compounding Validation:**

Verify improvement across iterations:
- [ ] Confidence interval narrowed (±50% → ±30% → ±15%)
- [ ] Plan quality improved (70 → 80 → 90)
- [ ] Agent matching improved (keyword → pattern → ML)
- [ ] Estimate accuracy improved (+40% per iteration)

**Compounding Report:**
```yaml
Compounding Engineering Cycle Test:
  iterations: 3
  status: ✅ COMPOUNDING VERIFIED

  iteration_1_bootstrap:
    effort_estimate: 28h ± 14h (50% confidence)
    plan_quality: 70/100
    agent_matching: keyword-based
    historical_data: 0 features

  iteration_2_learning:
    effort_estimate: 28h ± 8h (70% confidence)
    plan_quality: 80/100
    agent_matching: pattern-based
    historical_data: 1 feature
    improvement: +40% accuracy

  iteration_3_compounding:
    effort_estimate: 28h ± 4h (85% confidence)
    plan_quality: 90/100
    agent_matching: ML-based
    historical_data: 3 features
    improvement: +40% accuracy (cumulative +96%)

  compounding_effect_verified: ✅
    - Confidence interval: ±50% → ±15% (3x improvement)
    - Plan quality: 70 → 90 (29% improvement)
    - Estimate accuracy: +96% cumulative improvement
    - Each iteration makes next 40% faster ✅
```

---

### Phase 6: Roadmap Completion Verification

<thinking>
Validate a complete multi-phase roadmap can be executed end-to-end with all quality gates passing and all learnings codified.
</thinking>

**Full Roadmap Simulation:**

Load complete roadmap (e.g., auth-system with 4 phases, 28 hours):

**Phase 1: Database (6 hours)**
- [ ] 4 todos created (schema, migrations, RLS, indexes)
- [ ] Dana-Database assigned
- [ ] Quality gates defined (4 checkpoints)
- [ ] (Mock) execution → all tasks completed ✅
- [ ] Quality validation → schema valid, indexes created ✅

**Phase 2: API (12 hours)**
- [ ] 5 todos created (endpoints, security, validation, tests)
- [ ] Marcus-Backend assigned
- [ ] Quality gates defined (5 checkpoints)
- [ ] (Mock) execution → all tasks completed ✅
- [ ] Quality validation → endpoints tested, security passed ✅

**Phase 3: Frontend (8 hours)**
- [ ] 6 todos created (components, forms, state, tests)
- [ ] James-Frontend assigned
- [ ] Quality gates defined (4 checkpoints)
- [ ] (Mock) execution → all tasks completed ✅
- [ ] Quality validation → accessible, responsive ✅

**Phase 4: Testing (2 hours)**
- [ ] 3 todos created (unit, integration, E2E)
- [ ] Maria-QA assigned
- [ ] Quality gates defined (3 checkpoints)
- [ ] (Mock) execution → all tasks completed ✅
- [ ] Quality validation → 80%+ coverage, E2E pass ✅

**Completion Verification:**

- [ ] **All Todos Completed**: 18/18 todos ✅
- [ ] **All Quality Gates Passed**: 16/16 gates ✅
- [ ] **All Phases Finished**: 4/4 phases ✅
- [ ] **Documentation Generated**: README, API docs, component docs ✅
- [ ] **Learnings Codified**: Patterns stored in RAG ✅
- [ ] **Effort Accuracy**: Actual 27h vs estimated 28h (96% accurate) ✅

**Roadmap Report:**
```yaml
Roadmap Completion Verification:
  roadmap: auth-system (28 hours)
  status: ✅ COMPLETE

  phases_completed: 4/4 ✅
    - Phase 1 (Database): ✅ 6h (estimated 6h)
    - Phase 2 (API): ✅ 11.5h (estimated 12h)
    - Phase 3 (Frontend): ✅ 8h (estimated 8h)
    - Phase 4 (Testing): ✅ 1.5h (estimated 2h)

  todos_completed: 18/18 ✅
    - Database: 4/4 ✅
    - API: 5/5 ✅
    - Frontend: 6/6 ✅
    - Testing: 3/3 ✅

  quality_gates_passed: 16/16 ✅
    - Critical gates: 4/4 ✅
    - Non-critical gates: 12/12 ✅

  effort_accuracy:
    estimated: 28h ± 4h (85% confidence)
    actual: 27h
    accuracy: 96% ✅
    variance: -1h (under by 3.6%)

  documentation_generated: ✅
    - README.md: API usage, setup instructions
    - API docs: OpenAPI spec, endpoint descriptions
    - Component docs: Storybook stories

  learnings_codified: ✅
    - Patterns: 8 patterns stored in RAG
    - Code examples: 12 examples with file paths
    - Lessons learned: 5 pitfalls documented
    - Effort data: Added to historical database

  next_iteration_prediction:
    estimated_effort: 24h ± 3h (90% confidence)
    improvement: +14% accuracy (compounding effect)
```

---

## Final Validation Report

<thinking>
Synthesize all 6 phases into a comprehensive readiness report with an overall score and clear go/no-go recommendation.
</thinking>

**Overall Validation Score:**

Calculate weighted average across all phases:
- Pre-Flight Assessment: 25% weight
- Workflow Simulation: 20% weight
- Agent Coordination: 15% weight
- Quality Gates: 20% weight
- Compounding Cycle: 10% weight
- Roadmap Completion: 10% weight

**Report Structure:**

```yaml
═══════════════════════════════════════════════════════════════
  VERSATIL Framework Workflow Validation Report
═══════════════════════════════════════════════════════════════

Overall Score: 95/100 ✅
Status: READY FOR PRODUCTION WORKFLOWS
Recommendation: ✅ GO - Framework is ready for complex multi-hour roadmaps

═══════════════════════════════════════════════════════════════
  Phase Results
═══════════════════════════════════════════════════════════════

Phase 1: Pre-Flight Assessment
  Score: 98/100 ✅
  Status: EXCELLENT
  Details:
    - Framework Health: 100% ✅
    - Agent Availability: 100% (18/18) ✅
    - Rule Status: 100% (5/5) ✅
    - Infrastructure: 95% ✅
  Issues: 1 minor warning (database latency)

Phase 2: Workflow Simulation
  Score: 95/100 ✅
  Status: EXCELLENT
  Details:
    - Plan Generation: 90% ✅
    - Delegation: 100% ✅
    - Execution Simulation: 95% ✅
    - Quality Gates: 100% ✅
    - Timeline Estimation: 90% ✅
  Issues: None

Phase 3: Agent Coordination
  Score: 98/100 ✅
  Status: EXCELLENT
  Details:
    - No Collisions: 100% ✅
    - Handoff Protocol: 100% ✅
    - Performance: 95% ✅
    - Stress Scenarios: 100% (5/5) ✅
  Issues: None

Phase 4: Quality Gates
  Score: 90/100 ✅
  Status: GOOD
  Details:
    - Gates Defined: 100% (16/16) ✅
    - Validation Methods: 100% ✅
    - Failure Recovery: 100% ✅
    - Blocking Gates: 75% ⚠️
  Issues: 1 performance target missed

Phase 5: Compounding Cycle
  Score: 92/100 ✅
  Status: EXCELLENT
  Details:
    - Iteration 1: 70% ✅
    - Iteration 2: 80% ✅
    - Iteration 3: 90% ✅
    - Compounding Effect: +96% ✅
  Issues: None

Phase 6: Roadmap Completion
  Score: 96/100 ✅
  Status: EXCELLENT
  Details:
    - Phases: 100% (4/4) ✅
    - Todos: 100% (18/18) ✅
    - Quality Gates: 100% (16/16) ✅
    - Effort Accuracy: 96% ✅
  Issues: None

═══════════════════════════════════════════════════════════════
  Performance Metrics
═══════════════════════════════════════════════════════════════

Agent Performance:
  - Agent Switch Time: 1.5s avg (target: < 2s) ✅
  - Parallel Speedup: 3.4x (target: ≥ 3x) ✅
  - Context Accuracy: 99.9% ✅
  - Handoff Success Rate: 100% (8/8) ✅

Workflow Performance:
  - Planning Time: 2.5 minutes ✅
  - Delegation Time: 45 seconds ✅
  - Quality Validation Time: 1.2 minutes ✅
  - Total Validation Time: 8 minutes ✅

Accuracy Metrics:
  - Effort Estimation Accuracy: 96% ✅
  - Confidence Interval: ±15% (target: ±20%) ✅
  - Plan Quality Score: 90/100 ✅
  - Compounding Improvement: +96% cumulative ✅

═══════════════════════════════════════════════════════════════
  Issues Detected
═══════════════════════════════════════════════════════════════

Total Issues: 2

⚠️ MEDIUM (1):
  • Login endpoint: 220ms (target: < 200ms)
    Impact: API calls 10% slower than target
    Mitigation: Add Redis caching for session lookup
    Blocking: No (not critical)

⚠️ LOW (1):
  • Database latency: 180ms (optimal: < 100ms)
    Impact: Negligible for development
    Mitigation: Use local database instead of remote
    Blocking: No (acceptable for dev)

═══════════════════════════════════════════════════════════════
  Recommendations
═══════════════════════════════════════════════════════════════

✅ READY TO PROCEED:
  • Framework is in excellent condition (95/100)
  • All critical systems operational
  • Agent coordination tested and working
  • Compounding Engineering cycle validated
  • Quality gates comprehensive and enforceable

🎯 SUGGESTED OPTIMIZATIONS (Optional):
  1. Add Redis caching for improved API performance
  2. Use local database for development (reduce latency)
  3. Monitor agent performance during actual work
  4. Track actual vs estimated effort for future accuracy

📊 NEXT STEPS:
  1. Run /plan to create implementation plan
  2. Run /delegate to distribute work to agents
  3. Execute with /work --monitor (continuous health checks)
  4. Complete with /learn (codify learnings for next iteration)

═══════════════════════════════════════════════════════════════
  Validation Timestamp: 2025-10-13T14:30:00Z
  Duration: 8 minutes
  Framework Version: v7.0
═══════════════════════════════════════════════════════════════
```

---

## Output Format

Present the comprehensive validation report with:
1. **Executive Summary** (overall score, recommendation)
2. **Phase Results** (all 6 phases with scores)
3. **Performance Metrics** (agent performance, workflow performance, accuracy)
4. **Issues Detected** (severity, impact, mitigation)
5. **Recommendations** (ready to proceed, optimizations, next steps)

---

## Usage Examples

### Example 1: Validate Framework Before Large Feature
```bash
/validate-workflow "auth-system"

→ Loads auth-system.yaml template
→ Runs all 6 validation phases
→ Reports: 95/100, READY FOR PRODUCTION
→ Estimated effort: 28h ± 4h
→ Suggests: Add Redis caching for login endpoint
```

### Example 2: Validate Custom Feature
```bash
/validate-workflow "Add payment processing with Stripe"

→ Generates plan using /plan command
→ Matches to api-integration.yaml template
→ Runs validation phases
→ Reports: 92/100, READY (1 minor warning)
→ Estimated effort: 12h ± 3h
```

### Example 3: Validate Framework Health Only
```bash
/validate-workflow --quick

→ Runs Phase 1 only (Pre-Flight Assessment)
→ Reports: 98/100, EXCELLENT
→ Duration: 30 seconds
```

---

## Integration with Other Commands

**Before /plan**: Run /validate-workflow to ensure framework is ready
**Before /work**: Run /validate-workflow --quick for health check
**After /learn**: Run /validate-workflow to verify compounding effect

---

**Framework Version**: 7.0
**Command Type**: Validation & Quality Assurance
**Estimated Duration**: 5-10 minutes (full validation)
**Maintenance**: Update validation criteria as framework evolves
