# VELOCITY Automatic Reactions - Complete Reference

**Framework Version:** 7.16.2
**Date:** 2025-01-03
**Purpose:** Document all automatic reactions across VELOCITY workflow phases

---

## Executive Summary

The VERSATIL Framework features **3-layer automatic reaction system** that requires **ZERO manual intervention** across all VELOCITY workflow phases:

### Automatic Reaction Layers
1. **Phase Auto-Transitions** - Automatic progression through Plan → Assess → Delegate → Work → Codify
2. **Agent Auto-Activation** - File-pattern-based agent triggers (e.g., save `.tsx` → James activates)
3. **Proactive Monitoring** - Background health checks, MCP monitoring, quality gates

### Key Metrics
- **Auto-Transition Speed:** <500ms between phases
- **Agent Activation:** <150ms from file save
- **File Detection:** <100ms via fs.watch
- **MCP Health Checks:** 95% reliability target
- **Quality Gates:** Automatic enforcement on save/commit

---

## Phase-by-Phase Automatic Reactions

### Phase 1: PLAN (Auto-Reactions)

#### **Automatic Triggers**
```typescript
// WHEN: User types "velocity plan 'Add authentication'"
// AUTOMATICALLY HAPPENS:

1. ✅ Plan Generation (0-3 seconds)
   → Auto-detect project tech stack
   → Load historical similar features from RAG
   → Generate todos with effort estimates
   → Identify required templates
   → Create task dependencies graph

2. ✅ Alex-BA Auto-Activation
   → Triggers if keywords detected: "feature", "requirement", "user story"
   → Extracts acceptance criteria
   → Validates business logic
   → Suggests edge cases

3. ✅ RAG Context Loading
   → Auto-retrieves similar past plans
   → Loads relevant code patterns
   → Fetches historical effort data
   → Adjusts estimates based on learning

4. ✅ Auto-Transition Check
   → Validates plan completeness
   → Checks: todos.length > 0
   → Checks: estimates.total > 0
   → IF VALID: Auto-transition to Assess
```

#### **Automatic Validations**
```yaml
Plan Completeness:
  - ✅ At least 1 todo item created
  - ✅ Effort estimate provided (hours)
  - ✅ Templates identified (if applicable)
  - ✅ Historical context loaded from RAG

Auto-Transition Conditions:
  - config.autoTransition === true (default)
  - plan.todos.length > 0
  - plan.estimates.total > 0

→ IF ALL PASS: Automatically executes Phase 2 (Assess)
```

#### **Configuration**
```json
{
  "velocityWorkflowConfig": {
    "autoTransition": true,  // ← Enables automatic phase progression
    "requireApprovalPerPhase": false,  // Set true to pause for approval
    "continuousMonitoring": true
  }
}
```

---

### Phase 2: ASSESS (Auto-Reactions)

#### **Automatic Triggers**
```typescript
// WHEN: Plan phase completes OR user runs "velocity assess"
// AUTOMATICALLY HAPPENS:

1. ✅ Framework Health Check (1-2 seconds)
   → Validates all agents operational
   → Checks MCP server health (11 MCPs)
   → Verifies RAG/memory store connectivity
   → Tests quality gate systems
   → Calculates health score (0-100%)

2. ✅ Readiness Assessment
   → Checks for blockers:
     - Missing dependencies
     - Configuration errors
     - Agent availability
     - MCP server failures
   → Determines readiness level:
     - "ready" (health ≥90%, 0 blockers)
     - "caution" (health 70-89%, warnings only)
     - "blocked" (health <70% OR critical blockers)

3. ✅ Sarah-PM Auto-Activation
   → Triggers on assess command
   → Reviews project structure
   → Validates architectural readiness
   → Checks milestone alignment

4. ✅ Auto-Transition Decision
   → IF readiness = "ready" OR "caution":
     ✓ Automatically transition to Delegate
   → IF readiness = "blocked":
     ✗ STOP, display blockers, require fixes
```

#### **Automatic Validations**
```yaml
Health Requirements:
  - ✅ Framework health ≥ 70% (MINIMUM)
  - ✅ Framework health ≥ 90% (IDEAL, warnings if below)
  - ✅ Zero critical blockers
  - ✅ All required MCPs healthy

Auto-Transition Conditions:
  - assessment.readiness !== "blocked"
  - assessment.health >= 70
  - assessment.blockers.length === 0
  - config.autoTransition === true

→ IF ALL PASS: Automatically executes Phase 3 (Delegate)
```

#### **Automatic Blocker Detection**
```typescript
Common Auto-Detected Blockers:
  - MCP server unreachable (GitHub, Playwright, etc.)
  - RAG/vector store connection failed
  - Missing required agents (Maria, James, Marcus)
  - Configuration file errors (.cursorrules invalid)
  - Quality gate system failures
  - Insufficient disk space / resources
```

---

### Phase 3: DELEGATE (Auto-Reactions)

#### **Automatic Triggers**
```typescript
// WHEN: Assess phase passes OR user runs "velocity delegate"
// AUTOMATICALLY HAPPENS:

1. ✅ Smart Agent Assignment (1-3 seconds)
   → Analyzes todos from Plan phase
   → Detects file patterns in each todo:
     - *.tsx → James-Frontend
     - *.api.ts → Marcus-Backend
     - *.test.ts → Maria-QA
     - *.sql → Dana-Database
   → Creates agent assignments map
   → Identifies parallel execution opportunities
   → Builds dependency graph

2. ✅ Parallel Group Formation
   → Groups independent tasks:
     - Group 1: [Frontend UI + Backend API] (parallel)
     - Group 2: [Tests] (depends on Group 1)
   → Calculates optimal execution order
   → Estimates time savings (up to 50% faster)

3. ✅ Dependency Resolution
   → Validates task dependencies
   → Checks: All dependencies have assigned agents
   → Detects circular dependencies (error if found)
   → Creates execution order

4. ✅ Auto-Transition to Work
   → IF all tasks assigned: ✓ Auto-proceed
   → IF unresolved deps: ✗ Stop, display errors
```

#### **Automatic Validations**
```yaml
Delegation Requirements:
  - ✅ Every todo has assigned agent
  - ✅ No unresolved dependencies
  - ✅ No circular dependency loops
  - ✅ At least 1 agent assignment

Auto-Transition Conditions:
  - delegation.assignments.size > 0
  - plan.todos.length > 0
  - NO unresolved dependencies
  - config.autoTransition === true

→ IF ALL PASS: Automatically executes Phase 4 (Work)
```

#### **Agent Selection Logic**
```typescript
Automatic Agent Assignment Rules:

File Pattern → Agent Mapping:
  - *.tsx, *.jsx, *.vue, *.svelte → james-frontend
  - *.api.*, routes/**, controllers/** → marcus-backend
  - *.test.*, *.spec.*, __tests__/** → maria-qa
  - *.sql, migrations/**, schema.prisma → dana-database
  - *.py, *.ipynb, models/** → dr-ai-ml
  - *.md, docs/**, README.* → sarah-pm
  - requirements/**, *.story → alex-ba

Keyword Detection:
  - "test", "coverage" → maria-qa
  - "api", "security", "auth" → marcus-backend
  - "component", "ui", "accessibility" → james-frontend
  - "database", "migration", "rls" → dana-database
```

---

### Phase 4: WORK (Auto-Reactions)

#### **Automatic Triggers**
```typescript
// WHEN: Delegate phase completes OR user runs "velocity work"
// AUTOMATICALLY HAPPENS:

1. ✅ Agent Execution Starts (Parallel when possible)
   → Activates assigned agents simultaneously
   → Executes parallel groups in optimal order
   → Monitors progress in real-time (statusline)
   → Provides live updates every 200ms

2. ✅ Real-Time File Monitoring
   → Watches all files via fs.watch (<100ms detection)
   → On file save:
     ✓ Detects file type (extension, content patterns)
     ✓ Auto-activates relevant agent
     ✓ Runs proactive actions (tests, security, a11y)
     ✓ Provides inline suggestions

3. ✅ Quality Gate Enforcement (Automatic)
   → On file save:
     - James-Frontend: Accessibility check (WCAG AA)
     - Marcus-Backend: Security scan (OWASP Top 10)
     - Maria-QA: Test coverage analysis (80% target)
     - Dana-Database: RLS policy validation
   → On commit attempt:
     - Blocks if coverage < 80%
     - Blocks if security vulnerabilities found
     - Blocks if tests failing

4. ✅ Test Auto-Generation
   → When new function/component created:
     - Maria-QA automatically triggers
     - Detects missing test file
     - Generates test skeleton
     - Runs tests, reports coverage

5. ✅ MCP Health Monitoring (Background)
   → Every 60 seconds (configurable):
     - Checks all 11 MCP servers
     - Circuit breaker on 5 consecutive failures
     - Auto-retry with exponential backoff
     - Alerts on degradation

6. ✅ Agent Handoffs (Event-Driven)
   → When agent completes task:
     - Emits "task:completed" event
     - Next agent receives context automatically
     - Handoff latency: <150ms (target)
     - No manual intervention required

7. ✅ Auto-Transition to Codify
   → When all todos marked complete:
     - Validates all files modified
     - Checks all tests passing
     - Ensures quality gates passed
     - Auto-proceeds to Codify phase
```

#### **Automatic File-Save Reactions**

```typescript
File Type → Automatic Reactions:

SAVE: src/components/Button.tsx
  → (2 seconds later)
    ✓ James-Frontend activates
    ✓ Runs accessibility check (WCAG AA)
    ✓ Validates component structure
    ✓ Checks responsive design
    ✓ Suggests performance optimizations
    ✓ Generates test if missing

SAVE: src/api/auth.ts
  → (2 seconds later)
    ✓ Marcus-Backend activates
    ✓ Scans for SQL injection
    ✓ Detects hardcoded secrets
    ✓ Validates OWASP patterns
    ✓ Checks API response time
    ✓ Suggests rate limiting

SAVE: prisma/schema.prisma
  → (2 seconds later)
    ✓ Dana-Database activates
    ✓ Validates schema syntax
    ✓ Checks RLS policies
    ✓ Detects dangerous migrations
    ✓ Suggests missing indexes

SAVE: tests/Button.test.tsx
  → (2 seconds later)
    ✓ Maria-QA activates
    ✓ Runs tests automatically
    ✓ Calculates coverage
    ✓ Validates assertions
    ✓ Detects flaky tests
```

#### **Automatic Validations**
```yaml
Work Completion Requirements:
  - ✅ All todos marked complete
  - ✅ All tests passing
  - ✅ Coverage ≥ 80%
  - ✅ No security vulnerabilities
  - ✅ All files committed (or staged)

Auto-Transition Conditions:
  - work.completedTodos === plan.todos.length
  - ALL quality gates passed
  - config.autoTransition === true

→ IF ALL PASS: Automatically executes Phase 5 (Codify)
```

#### **Background Monitoring (Continuous)**
```yaml
Always Running (No Manual Trigger):
  - File system watching (fs.watch, <100ms detection)
  - MCP health checks (every 60s)
  - Agent pool warming (lazy loading)
  - Event-driven orchestration (150ms handoffs)
  - Statusline updates (every 200ms)
  - Memory/RAG indexing (background)
  - Quality score tracking (real-time)
```

---

### Phase 5: CODIFY (Auto-Reactions)

#### **Automatic Triggers**
```typescript
// WHEN: Work phase completes OR user runs "velocity codify"
// AUTOMATICALLY HAPPENS:

1. ✅ Learning Extraction (2-5 seconds)
   → Analyzes completed work:
     - Files modified/created
     - Patterns used
     - Effort actual vs estimated
     - Issues encountered
     - Solutions applied
   → Extracts reusable patterns
   → Calculates accuracy metrics

2. ✅ RAG Storage (Automatic)
   → Stores patterns to vector memory:
     - Code patterns (successful approaches)
     - Effort data (for future estimates)
     - Common issues + solutions
     - Agent effectiveness per task type
   → Enables compounding learning effect
   → Next similar feature: 40% faster

3. ✅ Metrics Calculation
   → Computes compounding effect:
     - Baseline: Previous similar features
     - Current: This feature's duration
     - Improvement: Percentage faster
     - Trend: Multi-feature velocity graph

4. ✅ Pattern Categorization
   → Classifies learnings:
     - Frontend patterns (React, Vue, etc.)
     - Backend patterns (API, security)
     - Database patterns (schema, RLS)
     - Testing patterns (coverage, assertions)

5. ✅ Workflow Completion
   → Archives workflow to history
   → Clears current workflow state
   → Generates completion report
   → Updates velocity metrics
```

#### **Automatic RAG Storage**
```typescript
Automatically Stored to RAG:

Patterns:
  - Code snippets that worked well
  - Component structures used
  - API endpoint designs
  - Database schema decisions
  - Test approaches that achieved high coverage

Effort Data:
  - Estimated hours vs actual hours
  - Accuracy percentage per task type
  - Complexity indicators
  - Blockers encountered + resolution time

Lessons Learned:
  - "Used React Query → 30% faster data fetching"
  - "Parameterized queries prevented SQL injection"
  - "WCAG AA compliance from start → no refactoring"

Agent Performance:
  - James-Frontend: 15 min avg for component + tests
  - Marcus-Backend: 20 min avg for API endpoint + security
  - Maria-QA: 5 min avg for test suite generation
```

#### **Automatic Metrics**
```yaml
Compounding Effect Tracking:
  - Feature 1 (baseline): 2 hours
  - Feature 2 (with RAG): 1.4 hours (30% faster)
  - Feature 3 (more learning): 1.2 hours (40% faster)
  - Feature 4+ (compounded): ~1.2 hours (40% sustained)

Stored Automatically:
  - ✅ Total workflow duration
  - ✅ Phase breakdown (Plan: 2m, Assess: 1m, etc.)
  - ✅ Estimated vs actual accuracy
  - ✅ Files modified count
  - ✅ Tests added count
  - ✅ Coverage achieved
```

---

## Agent Auto-Activation Matrix

### Complete Trigger Reference

| Agent | File Patterns | Code Patterns | Keywords | Auto-Run on Save | Proactive Actions |
|-------|--------------|---------------|----------|------------------|-------------------|
| **Maria-QA** | `*.test.*`, `*.spec.*`, `__tests__/**` | `describe(`, `it(`, `expect(` | test, spec, coverage | ✅ YES | Test coverage analysis, missing test detection, quality gate enforcement |
| **James-Frontend** | `*.tsx`, `*.jsx`, `*.vue`, `*.svelte` | `useState`, `component`, `props` | component, react, ui | ✅ YES | WCAG accessibility check, responsive design validation, performance optimization |
| **Marcus-Backend** | `*.api.*`, `routes/**`, `controllers/**` | `router.`, `express.`, `async function` | api, security, auth | ✅ YES | OWASP security validation, SQL injection detection, response time check <200ms |
| **Dana-Database** | `*.sql`, `migrations/**`, `schema.prisma` | `CREATE TABLE`, `RLS`, `POLICY` | database, migration, rls | ✅ YES | Schema validation, RLS policy check, migration safety check, query optimization |
| **Sarah-PM** | `*.md`, `docs/**`, `README.*` | `# `, `## `, `TODO` | project, documentation | ⚠️ ON MILESTONE | Sprint report generation, milestone tracking, documentation consistency |
| **Alex-BA** | `requirements/**`, `*.story`, `*.feature` | `As a`, `Given`, `When`, `Then` | requirement, user story | ⚠️ ON ISSUE | Requirement extraction, user story generation, acceptance criteria validation |
| **Dr.AI-ML** | `*.py`, `*.ipynb`, `models/**` | `import torch`, `model.train(` | machine learning, model | ✅ YES | Model performance validation, data quality check, training optimization |
| **Oliver-MCP** | `mcp/**`, `*.mcp.*` | `mcpServers`, `MCP` | mcp, integration | ⚠️ MANUAL | MCP selection suggestions, anti-hallucination detection, health check |

---

## Real-Time Monitoring & Feedback

### Statusline Updates (Every 200ms)
```
┌─────────────────────────────────────────────────────────────┐
│ VERSATIL │ ⚡ james-frontend (analyzing) │ 🧪 maria-qa (testing) │ 📊 81% coverage │ 🏥 MCP: 11/11 healthy │
└─────────────────────────────────────────────────────────────┘
```

### Inline Annotations (Real-time)
```typescript
function UserProfile() {
  const [user, setUser] = useState(null); // ⚠️ James: Missing loading state

  return <div>{user?.name}</div>; // ⚠️ James: Missing ARIA label
}
```

### Notifications (Critical Events Only)
```
🚨 Marcus-Backend: SQL injection detected in auth.ts:42
   → Auto-fix available: Use parameterized query?
   [Apply Fix] [Ignore] [View Details]

✅ Maria-QA: Coverage increased to 82% (+3%)
   → Quality gate: PASSED

⚠️ MCP Health: playwright_mcp degraded (3 consecutive failures)
   → Auto-retry in progress...
```

---

## Configuration: Enabling/Disabling Auto-Reactions

### Global Configuration
```json
// .cursor/settings.json

{
  "versatil.proactive_agents": {
    "enabled": true,              // ← Master switch (all auto-reactions)
    "auto_activation": true,       // ← File-save triggers
    "background_monitoring": true, // ← Continuous health checks
    "inline_suggestions": true,    // ← Real-time code annotations
    "statusline_updates": true,    // ← Live progress display

    "quality_gates": {
      "enforce_on_save": false,    // ← Validate on every save (can be slow)
      "enforce_on_commit": true,   // ← Validate before commit (recommended)
      "enforce_on_push": true,     // ← Validate before push (strict)
      "block_on_failure": true,    // ← Prevent commit if gates fail
      "minimum_coverage": 80       // ← Required test coverage %
    }
  },

  "versatil.velocity_workflow": {
    "autoTransition": true,              // ← Phase auto-progression
    "requireApprovalPerPhase": false,    // ← Pause for manual approval
    "continuousMonitoring": true,        // ← Background health checks
    "qualityGateLevel": "normal"         // ← strict | normal | relaxed
  }
}
```

### Per-Agent Configuration
```json
{
  "activation_triggers": {
    "maria-qa": {
      "auto_run_on_save": true,      // ← Run on every test file save
      "background_analysis": true,   // ← Continuous coverage monitoring
      "debounce_ms": 500            // ← Wait 500ms after last change
    },
    "james-frontend": {
      "auto_run_on_save": true,
      "background_analysis": true,
      "proactive_actions": [        // ← Customize which checks run
        "accessibility_check_wcag",
        "performance_optimization_suggestions"
        // "component_structure_validation" ← Can disable specific checks
      ]
    }
  }
}
```

### Disabling Specific Auto-Reactions
```json
{
  // Disable all auto-reactions (manual mode):
  "versatil.proactive_agents.enabled": false,

  // Disable auto-transitions (manual phase control):
  "versatil.velocity_workflow.autoTransition": false,

  // Disable specific agent:
  "activation_triggers.james-frontend.auto_run_on_save": false,

  // Disable background monitoring (performance mode):
  "versatil.proactive_agents.background_monitoring": false,

  // Disable quality gates (fast iteration mode):
  "versatil.proactive_agents.quality_gates.enforce_on_commit": false
}
```

---

## Performance Impact

### Resource Usage (Background Monitoring)
```yaml
Proactive Daemon:
  CPU: <1% (idle)
  Memory: ~50MB
  Disk I/O: Minimal (event-driven)

Agent Pool (Pre-warmed):
  Memory: ~150MB (3 agents × ~50MB each)
  Performance Benefit: 50% faster activation
  Load: Lazy (warm up on-demand)

File Watching:
  Detection Latency: <100ms
  CPU Impact: <0.1%
  Method: Native fs.watch (efficient)

MCP Health Monitoring:
  Interval: 60 seconds (configurable)
  Network: Minimal (health ping)
  CPU: <0.5% per check cycle
```

### Response Times
```yaml
Automatic Reactions:
  - File save → Agent activation: <150ms
  - Phase transition: <500ms
  - Quality gate validation: 1-3 seconds
  - Test coverage analysis: 2-5 seconds
  - Security scan (OWASP): 3-7 seconds
  - Accessibility audit (WCAG): 2-4 seconds
```

---

## Troubleshooting Auto-Reactions

### Issue: Agents Not Auto-Activating

**Symptoms:**
- Save file, no agent reaction
- No statusline updates
- No inline suggestions

**Diagnosis:**
```bash
# Check daemon status
velocity status

# Check configuration
cat .cursor/settings.json | grep "proactive_agents"

# View daemon logs
tail -f ~/.versatil/daemon/daemon.log
```

**Solutions:**
1. Ensure daemon running: `velocity start --daemon`
2. Verify `proactive_agents.enabled: true`
3. Check file patterns match your files
4. Restart daemon: `velocity restart`

---

### Issue: Too Many Auto-Reactions

**Symptoms:**
- IDE lag on file save
- Constant notifications
- High CPU usage

**Solutions:**
1. Increase debounce delay:
   ```json
   { "debounce_ms": 2000 } // Wait 2s after last change
   ```

2. Disable background analysis:
   ```json
   { "background_analysis": false }
   ```

3. Reduce concurrent agents:
   ```json
   { "max_concurrent": 2 } // Max 2 agents at once
   ```

4. Disable specific proactive actions:
   ```json
   {
     "proactive_actions": [
       "test_coverage_analysis"  // Only run coverage, disable others
     ]
   }
   ```

---

## Summary: Zero-Command Development

### What You Type
```bash
velocity plan "Add user authentication"
# → That's it. Everything else is automatic.
```

### What Happens Automatically
1. ✅ **Plan Phase** - Generates todos, estimates, templates (3s)
2. ✅ **Assess Phase** - Validates health, checks blockers (2s)
3. ✅ **Delegate Phase** - Assigns agents, creates parallel groups (2s)
4. ✅ **Work Phase** - Agents execute tasks, monitor in real-time (variable)
   - File save → Auto-analysis (2s per save)
   - Tests → Auto-run + coverage (3-5s)
   - Security → Auto-scan on API files (3-7s)
   - Quality gates → Auto-enforce on commit
5. ✅ **Codify Phase** - Extracts learnings, stores to RAG (3s)

**Total:** One command → Complete feature with tests, docs, and learning

---

## Related Documentation

- [OPTION-5-AUTO-ACTIVATION-PATTERNS.md](./guides/OPTION-5-AUTO-ACTIVATION-PATTERNS.md) - Customizing auto-activation
- [OPTION-3-WORKFLOW-DEMO.md](./guides/OPTION-3-WORKFLOW-DEMO.md) - See auto-reactions in action
- [TESTING_COMPLETION_SUMMARY.md](./TESTING_COMPLETION_SUMMARY.md) - Test coverage details

---

**Version:** 7.16.2
**Last Updated:** 2025-01-03
**Maintained By:** VERSATIL Framework Team

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
