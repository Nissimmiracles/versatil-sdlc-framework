# Instinctive Testing Workflow

**Version**: 1.0.0
**Date**: 2025-10-19
**Purpose**: Automatic testing after each task completion (zero manual intervention)
**Philosophy**: "Tests should be as automatic as breathing - you shouldn't have to think about them"

---

## Executive Summary

**Problem**: Testing is currently deferred to end of phases instead of running automatically after each task completion.

**Solution**: Implement **instinctive testing** - automatic test execution triggered by task completion events, with quality gates that prevent marking tasks complete until tests pass.

**Impact**:
- ✅ Zero manual test commands needed
- ✅ Catch bugs immediately (not at end of sprint)
- ✅ 80%+ coverage enforced automatically
- ✅ Faster feedback loop (minutes not hours)

---

## Core Principles

### 1. **Zero Manual Intervention**
- Tests auto-run on task completion
- No `/test` commands needed
- No waiting until end of phase

### 2. **Immediate Feedback**
- Tests run within 30 seconds of task completion
- Results shown in statusline
- Failures block task completion

### 3. **Smart Test Selection**
- Only run affected tests (not full suite)
- Prioritize critical paths
- Full suite for major milestones

### 4. **Quality Gates Enforcement**
- Tests MUST pass before task marked complete
- Coverage MUST be ≥80%
- Security scans MUST pass

---

## Testing Trigger Matrix

### API Endpoint Created/Modified

**Triggers**:
```yaml
File_Pattern: "**/*.api.ts", "**/api/**/*.ts", "**/routes/**/*.ts"
Agent: Marcus-Backend
Auto_Tests:
  1. Integration_Tests:
     - Run endpoint-specific tests
     - Validate request/response schemas
     - Check authentication/authorization
     - Verify error handling

  2. Stress_Tests: (Rule 2)
     - Auto-generate load tests
     - Test with 100/500/1000 concurrent users
     - Verify < 200ms response time
     - Check rate limiting

  3. Security_Tests:
     - OWASP Top 10 validation
     - SQL injection attempts
     - XSS attempts
     - CSRF protection

  4. Contract_Tests:
     - Validate API contract unchanged (or versioned)
     - Check backwards compatibility
     - Verify OpenAPI spec updated

Duration: 2-5 minutes
Block_Completion_If: Any test fails OR coverage < 80%
```

### React Component Created/Modified

**Triggers**:
```yaml
File_Pattern: "**/*.tsx", "**/*.jsx", "**/components/**/*"
Agent: James-Frontend
Auto_Tests:
  1. Unit_Tests:
     - Render without crashing
     - Props validation
     - State management
     - Event handlers

  2. Accessibility_Tests:
     - WCAG 2.1 AA compliance
     - Keyboard navigation
     - Screen reader compatibility
     - Color contrast

  3. Visual_Regression_Tests:
     - Screenshot comparison
     - Responsive breakpoints
     - Dark mode variants

  4. Integration_Tests:
     - Component + API integration
     - User flow testing
     - Error state handling

Duration: 1-3 minutes
Block_Completion_If: Accessibility < 95 score OR visual regression diffs
```

### Database Schema/Migration

**Triggers**:
```yaml
File_Pattern: "**/*.sql", "**/migrations/**/*", "**/prisma/**/*"
Agent: Dana-Database
Auto_Tests:
  1. Migration_Tests:
     - Up migration succeeds
     - Down migration succeeds (rollback)
     - Idempotency check
     - Data integrity preserved

  2. Schema_Validation:
     - RLS policies applied correctly
     - Indexes created
     - Foreign key constraints valid
     - Performance impact measured

  3. Data_Integrity_Tests:
     - Existing data not corrupted
     - Null constraints enforced
     - Unique constraints working
     - Triggers functioning

Duration: 30 seconds - 2 minutes
Block_Completion_If: Migration fails OR RLS policies missing
```

### Test File Modified

**Triggers**:
```yaml
File_Pattern: "**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"
Agent: Maria-QA
Auto_Tests:
  1. Test_Validation:
     - New tests actually test something
     - No disabled/skipped tests without reason
     - Coverage increased (not decreased)
     - Test isolation verified

  2. Meta_Tests:
     - Tests run in < 5 seconds (unit tests)
     - No flaky tests (run 10 times)
     - Clear assertion messages
     - No console.logs left behind

Duration: 10-30 seconds
Block_Completion_If: Coverage decreased OR tests are flaky
```

### Configuration File Modified

**Triggers**:
```yaml
File_Pattern: "**/package.json", "**/tsconfig.json", "**/.env*"
Agent: Sarah-PM
Auto_Tests:
  1. Build_Tests:
     - TypeScript compilation succeeds
     - No type errors
     - Dependencies resolve
     - Scripts executable

  2. Security_Tests:
     - npm audit clean (no critical/high vulns)
     - No secrets in .env committed
     - License compatibility

  3. Environment_Tests:
     - All required env vars present
     - Values in valid format
     - Database connection works
     - External services reachable

Duration: 30 seconds - 1 minute
Block_Completion_If: Build fails OR critical vulnerabilities found
```

---

## Task Completion Workflow

### Current Behavior (BEFORE)

```yaml
User_Action: "Create API endpoint for /api/users"

Current_Workflow:
  1. Agent implements endpoint (Marcus-Backend)
  2. Agent marks todo as completed ✅
  3. Tests run later (maybe at end of day)
  4. Bug found days later
  5. Context lost, harder to fix

Problem: Tests deferred, bugs found late
```

### New Behavior (AFTER - Instinctive Testing)

```yaml
User_Action: "Create API endpoint for /api/users"

Instinctive_Workflow:
  1. Agent implements endpoint (Marcus-Backend)
  2. Agent attempts to mark todo complete
  3. 🔒 QUALITY GATE TRIGGERED:
     - Detect file pattern: src/api/users.ts
     - Trigger: API Endpoint Tests
     - Maria-QA auto-activates
  4. Maria-QA runs tests (2-5 minutes):
     ✅ Integration tests: PASS
     ✅ Stress tests: PASS (198ms avg)
     ✅ Security tests: PASS (OWASP compliant)
     ✅ Coverage: 87% (> 80% ✓)
  5. Quality gate: PASS ✅
  6. Todo marked as completed ✅
  7. User notified: "✅ Task complete + all tests passing"

Benefit: Immediate feedback, bugs caught in minutes not days
```

### Quality Gate Failure Scenario

```yaml
User_Action: "Create API endpoint for /api/users"

Quality_Gate_Failure:
  1. Agent implements endpoint (Marcus-Backend)
  2. Agent attempts to mark todo complete
  3. 🔒 QUALITY GATE TRIGGERED
  4. Maria-QA runs tests:
     ✅ Integration tests: PASS
     ❌ Stress tests: FAIL (502 errors at 500 users)
     ✅ Security tests: PASS
     ⚠️ Coverage: 73% (< 80% ✗)
  5. Quality gate: FAIL ❌
  6. Todo status: in_progress (NOT completed)
  7. User notified:
     "⚠️ Task not complete - 2 issues found:
      - Stress test failed: 502 errors under load
      - Coverage below 80% (73% current)

      Fix these issues before marking complete."
  8. Agent fixes issues
  9. Quality gate re-runs automatically
  10. Once passing: Todo marked complete ✅

Benefit: Forces quality before moving on
```

---

## Implementation Architecture

### Component 1: TaskCompletionTrigger (NEW)

```typescript
/**
 * src/daemon/task-completion-trigger.ts
 *
 * Listens to TodoWrite completion events and triggers testing
 */

export class TaskCompletionTrigger extends EventEmitter {
  constructor(
    private proactiveDaemon: ProactiveDaemon,
    private mariaQA: MariaQAAgent,
    private qualityGates: QualityGateEnforcer
  ) {}

  /**
   * Setup event listeners
   */
  initialize(): void {
    // Listen to TodoWrite completion attempts
    this.proactiveDaemon.on('todo-completion-requested', async (todo) => {
      console.log(`[TaskCompletionTrigger] Todo completion requested: ${todo.id}`);

      // Trigger quality gate
      const gateResult = await this.runQualityGate(todo);

      if (gateResult.passed) {
        // Allow completion
        this.emit('todo-completion-approved', todo);
      } else {
        // Block completion
        this.emit('todo-completion-blocked', {
          todo,
          failures: gateResult.failures,
          message: gateResult.message
        });
      }
    });
  }

  /**
   * Run quality gate for todo
   */
  async runQualityGate(todo: Todo): Promise<QualityGateResult> {
    // Detect file patterns
    const changedFiles = await this.getChangedFiles(todo);
    const testType = this.detectTestType(changedFiles);

    // Run appropriate tests
    const testResult = await this.mariaQA.runTests(testType, changedFiles);

    // Enforce quality gates
    return this.qualityGates.enforce(testResult, {
      minCoverage: 80,
      requirePassingTests: true,
      requireSecurityScan: testType.includes('api'),
      requireAccessibilityScan: testType.includes('component')
    });
  }

  /**
   * Detect test type from changed files
   */
  detectTestType(files: string[]): TestType {
    if (files.some(f => f.includes('/api/') || f.endsWith('.api.ts'))) {
      return 'api_endpoint';
    }
    if (files.some(f => f.endsWith('.tsx') || f.endsWith('.jsx'))) {
      return 'react_component';
    }
    if (files.some(f => f.endsWith('.sql') || f.includes('/migrations/'))) {
      return 'database_migration';
    }
    if (files.some(f => f.includes('.test.') || f.includes('.spec.'))) {
      return 'test_file';
    }
    return 'general';
  }
}
```

### Component 2: QualityGateEnforcer (NEW)

```typescript
/**
 * src/testing/quality-gate-enforcer.ts
 *
 * Enforces quality standards before allowing task completion
 */

export interface QualityGateConfig {
  minCoverage: number;           // Default: 80
  requirePassingTests: boolean;  // Default: true
  requireSecurityScan: boolean;  // Default: true for APIs
  requireAccessibilityScan: boolean; // Default: true for components
  allowOverride: boolean;        // Default: false (only for emergencies)
}

export class QualityGateEnforcer {
  async enforce(
    testResult: TestResult,
    config: QualityGateConfig
  ): Promise<QualityGateResult> {
    const failures: string[] = [];

    // Check test pass rate
    if (config.requirePassingTests && testResult.failedTests > 0) {
      failures.push(`${testResult.failedTests} tests failed`);
    }

    // Check coverage
    if (testResult.coverage < config.minCoverage) {
      failures.push(`Coverage ${testResult.coverage}% < ${config.minCoverage}%`);
    }

    // Check security scan
    if (config.requireSecurityScan && testResult.securityIssues > 0) {
      failures.push(`${testResult.securityIssues} security issues found`);
    }

    // Check accessibility
    if (config.requireAccessibilityScan && testResult.accessibilityScore < 95) {
      failures.push(`Accessibility score ${testResult.accessibilityScore} < 95`);
    }

    return {
      passed: failures.length === 0,
      failures,
      message: failures.length > 0
        ? `Quality gate failed: ${failures.join(', ')}`
        : 'Quality gate passed ✅'
    };
  }
}
```

### Component 3: Enhanced AutomatedStressTestGenerator (MODIFY)

```typescript
/**
 * src/testing/automated-stress-test-generator.ts (ENHANCED)
 *
 * Modified to AUTO-RUN tests immediately after generation
 */

export class AutomatedStressTestGenerator {
  // Existing code...

  /**
   * Generate AND RUN stress tests (NEW behavior)
   */
  async generateAndRunStressTests(
    target: TestTarget,
    config: StressTestConfig
  ): Promise<StressTestResult> {
    // Step 1: Generate tests (existing)
    const tests = await this.generateTests(target, config);

    // Step 2: AUTO-RUN tests immediately (NEW)
    console.log('[Rule 2] Auto-running generated stress tests...');
    const results = await this.runTests(tests);

    // Step 3: Report results
    return {
      generated: tests.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
      details: results
    };
  }

  /**
   * Run stress tests
   */
  private async runTests(tests: StressTest[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const test of tests) {
      const startTime = Date.now();

      try {
        // Run test using Maria-QA or test runner
        const result = await this.executeTest(test);

        results.push({
          testName: test.name,
          passed: result.success,
          duration: Date.now() - startTime,
          assertions: result.assertions,
          failures: result.failures
        });

      } catch (error: any) {
        results.push({
          testName: test.name,
          passed: false,
          duration: Date.now() - startTime,
          error: error.message
        });
      }
    }

    return results;
  }
}
```

### Component 4: Integration with proactive-daemon.ts (MODIFY)

```typescript
/**
 * src/daemon/proactive-daemon.ts (ENHANCED)
 *
 * Add task completion event handling
 */

// Add to imports
import { TaskCompletionTrigger } from './task-completion-trigger.js';
import { QualityGateEnforcer } from '../testing/quality-gate-enforcer.js';

class ProactiveDaemon {
  private taskCompletionTrigger: TaskCompletionTrigger | null = null;

  async start() {
    // Existing initialization...

    // NEW: Initialize task completion trigger
    this.taskCompletionTrigger = new TaskCompletionTrigger(
      this,
      this.agents.mariaQA,
      new QualityGateEnforcer()
    );

    this.taskCompletionTrigger.initialize();

    // Listen to completion events
    this.taskCompletionTrigger.on('todo-completion-blocked', (data) => {
      console.log(`❌ Task completion blocked: ${data.message}`);
      this.statusline.update({
        status: 'warning',
        message: `Quality gate failed: ${data.failures.join(', ')}`
      });
    });

    this.taskCompletionTrigger.on('todo-completion-approved', (todo) => {
      console.log(`✅ Task completion approved: ${todo.id}`);
      this.statusline.update({
        status: 'success',
        message: 'All tests passing ✅'
      });
    });
  }

  /**
   * NEW: Emit event when todo completion requested
   */
  async onTodoCompletionRequested(todo: Todo): Promise<boolean> {
    return new Promise((resolve) => {
      // Emit event for quality gate check
      this.emit('todo-completion-requested', todo);

      // Listen for approval/blocking
      const approveHandler = (approvedTodo: Todo) => {
        if (approvedTodo.id === todo.id) {
          this.taskCompletionTrigger?.off('todo-completion-approved', approveHandler);
          this.taskCompletionTrigger?.off('todo-completion-blocked', blockHandler);
          resolve(true);
        }
      };

      const blockHandler = (data: any) => {
        if (data.todo.id === todo.id) {
          this.taskCompletionTrigger?.off('todo-completion-approved', approveHandler);
          this.taskCompletionTrigger?.off('todo-completion-blocked', blockHandler);
          resolve(false);
        }
      };

      this.taskCompletionTrigger?.on('todo-completion-approved', approveHandler);
      this.taskCompletionTrigger?.on('todo-completion-blocked', blockHandler);
    });
  }
}
```

---

## Smart Test Selection

### Problem: Running Full Suite is Slow
- Full test suite: 10-15 minutes
- Blocks developer while waiting
- Discourages frequent testing

### Solution: Affected Tests Only

```yaml
Smart_Test_Selection:
  Changed_File: src/api/users.ts

  Step_1_Analyze_Dependencies:
    - Find tests that import users.ts
    - Find tests for endpoints using users.ts
    - Find integration tests touching users

  Step_2_Calculate_Affected_Tests:
    Direct:
      - tests/unit/api/users.test.ts (direct test)
      - tests/integration/users-api.test.ts (integration)

    Indirect:
      - tests/e2e/login-flow.test.ts (uses /api/users)
      - tests/integration/admin-users.test.ts (uses users service)

  Step_3_Run_Affected_Only:
    - Total: 4 tests instead of 150
    - Duration: 30 seconds instead of 10 minutes
    - Coverage: Still validates all affected code paths

  Step_4_Full_Suite_Triggers:
    - Before commit to main
    - Before releases
    - Daily CI/CD run
    - Manual trigger: /test --full
```

---

## User Experience

### Statusline Integration

```yaml
Before_Instinctive_Testing:
  Statusline: "🤖 Marcus-Backend: Implementing /api/users..."
  User_Action: Wait for completion
  Next_Step: Manually run tests later

After_Instinctive_Testing:
  Statusline_Phase_1: "🤖 Marcus-Backend: Implementing /api/users..."
  Statusline_Phase_2: "🧪 Maria-QA: Running auto-tests (2/4 complete)..."
  Statusline_Phase_3: "✅ All tests passing | Coverage: 87% | Duration: 2.3min"
  User_Action: Nothing! Tests ran automatically
  Next_Step: Move to next task
```

### Terminal Output

```bash
# When task completion requested
[TaskCompletionTrigger] Todo completion requested: 001-implement-users-api
[TaskCompletionTrigger] Detected file pattern: API Endpoint
[Maria-QA] Running integration tests... ✅ PASS (4/4)
[Maria-QA] Running stress tests... ✅ PASS (198ms avg)
[Maria-QA] Running security scans... ✅ PASS (OWASP compliant)
[Maria-QA] Checking coverage... ✅ 87% (>80% required)
[QualityGate] All checks passed ✅
[TodoWrite] Task 001 marked as completed ✅

✅ Task complete! All quality gates passed.
```

### Failure Output

```bash
# When quality gate fails
[TaskCompletionTrigger] Todo completion requested: 001-implement-users-api
[TaskCompletionTrigger] Detected file pattern: API Endpoint
[Maria-QA] Running integration tests... ✅ PASS (4/4)
[Maria-QA] Running stress tests... ❌ FAIL (2/3)
  - ❌ High load test: 502 errors at 500 concurrent users
  - ✅ Medium load: OK
  - ✅ Spike test: OK
[Maria-QA] Running security scans... ✅ PASS
[Maria-QA] Checking coverage... ⚠️ 73% (<80% required)
[QualityGate] Quality gate FAILED ❌

❌ Task NOT complete - Fix these issues:
  1. Stress test failed: 502 errors under high load
  2. Coverage below 80% (current: 73%)

Recommendations:
  - Add connection pooling for high concurrency
  - Add tests for error handling edge cases
  - Current coverage gaps: src/api/users.ts lines 45-67

Task remains "in_progress" until these are fixed.
```

---

## Rollout Strategy

### Phase 1: Pilot (Week 1)
- Enable for API endpoints only
- Monitor Maria-QA activation success rate
- Measure time-to-feedback improvement
- Gather user feedback

### Phase 2: Expand (Week 2)
- Enable for React components
- Enable for database migrations
- Add accessibility testing
- Tune test selection algorithm

### Phase 3: Full Deployment (Week 3)
- Enable for all file types
- Make quality gates mandatory
- Document override process (emergencies only)
- Train team on new workflow

### Phase 4: Optimization (Week 4)
- Optimize test execution time
- Improve smart test selection
- Add caching for faster re-runs
- Measure impact metrics

---

## Success Metrics

### Quantitative

**Before Instinctive Testing**:
- Time to first test run: 2-8 hours after implementation
- Tests run frequency: 2-3 times per day
- Bugs found: Days after introduction
- Coverage drift: Gradual decline over time

**After Instinctive Testing** (Expected):
- Time to first test run: < 30 seconds after implementation
- Tests run frequency: After every task (10-20 times per day)
- Bugs found: Minutes after introduction
- Coverage: Maintained at 80%+

**Target Improvements**:
- 🎯 Feedback time: 2-8 hours → 30 seconds (96% faster)
- 🎯 Bug detection: Days → Minutes (99% faster)
- 🎯 Coverage: Variable → Consistent 80%+
- 🎯 Developer confidence: Higher (tests always run)

### Qualitative

- ✅ Less context switching (tests run automatically)
- ✅ Higher code quality (immediate feedback)
- ✅ Reduced bug escape rate (caught before merge)
- ✅ Better developer experience (no manual test commands)

---

## Emergency Override

**IMPORTANT**: Quality gates can be overridden in emergencies, but with accountability.

```bash
# Override quality gate (emergencies only)
/work --override-quality-gate "P0 production issue, tests will follow"

# Creates audit trail:
# - Who overrode
# - When overrode
# - Reason given
# - Creates todo to fix quality issues
# - Notifies team in Slack/email
```

**When to Override**:
- ✅ P0 production outage
- ✅ Critical security patch
- ✅ Legal/compliance deadline

**When NOT to Override**:
- ❌ "Running late on sprint"
- ❌ "Tests are flaky" (fix the tests!)
- ❌ "Don't feel like fixing coverage"

---

## Configuration

### Enable/Disable Instinctive Testing

```yaml
# .versatil/config.yaml

instinctive_testing:
  enabled: true  # Master switch

  quality_gates:
    min_coverage: 80
    require_passing_tests: true
    require_security_scan: true  # For APIs
    require_accessibility_scan: true  # For components

  test_selection:
    smart_selection: true  # Run affected tests only
    full_suite_triggers:
      - before_commit_to_main
      - before_release
      - daily_at: "02:00"

  override:
    allowed: false  # Set true for emergencies
    audit_trail: true
    notify_team: true
```

---

## FAQ

### Q: What if tests take too long?
**A**: Smart test selection runs only affected tests (30 seconds - 2 minutes). Full suite runs on major milestones only.

### Q: What if I need to skip tests temporarily?
**A**: Use emergency override with reason. Creates todo to fix quality issues later.

### Q: What if tests are flaky?
**A**: Quality gate will block. Fix the flaky tests - they hurt everyone.

### Q: Can I disable for specific tasks?
**A**: No. Quality is mandatory. If tests don't apply, improve test relevance detection.

### Q: What about experimental code?
**A**: Use feature branches. Quality gates still apply but won't block experimentation.

---

## Implementation Checklist

- [ ] Create TaskCompletionTrigger class
- [ ] Create QualityGateEnforcer class
- [ ] Enhance AutomatedStressTestGenerator to auto-run tests
- [ ] Integrate with proactive-daemon.ts
- [ ] Add TodoWrite completion event emission
- [ ] Implement smart test selection algorithm
- [ ] Add statusline integration for test progress
- [ ] Create quality gate failure messaging
- [ ] Add emergency override mechanism
- [ ] Write integration tests for instinctive testing
- [ ] Update documentation
- [ ] Train OPERA agents on new workflow

---

**Status**: Design Complete ✅
**Next Steps**: Implementation (estimated 2-3 days)
**Expected Impact**: 96% faster feedback, 80%+ coverage enforcement, fewer bugs in production
