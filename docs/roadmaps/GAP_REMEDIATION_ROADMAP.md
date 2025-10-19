# VERSATIL Framework - Gap Remediation Roadmap

**Version**: v6.4.0 → v7.0.0
**Timeline**: 40-50 days (10 weeks)
**Objective**: Close all 31 identified gaps to achieve 100% promise delivery
**Reference**: [Comprehensive Gap Analysis](../audits/COMPREHENSIVE_FRAMEWORK_GAP_ANALYSIS.md)

---

## Executive Summary

This roadmap details the 4-phase implementation plan to transform VERSATIL from **62% complete** to **100% production-ready** by closing 31 identified gaps.

### Phase Overview

| Phase | Duration | Tasks | Priority | Deliverables |
|-------|----------|-------|----------|--------------|
| **Phase 1** | Weeks 1-3 (15 days) | 8 tasks | 🔴 CRITICAL | Restore broken core promises |
| **Phase 2** | Weeks 4-7 (22 days) | 13 tasks | 🟠 HIGH | Complete documented features |
| **Phase 3** | Weeks 8-9 (10 days) | 9 tasks | 🟡 MEDIUM | Polish & integration |
| **Phase 4** | Week 10 (3 days) | 1 task | 🟢 LOW | Enhancements |
| **TOTAL** | **50 days** | **31 tasks** | | **v7.0 Release** |

---

## PHASE 1: Critical Gaps (Weeks 1-3) 🔴

**Goal**: Restore core functionality that is currently broken or completely missing

**Duration**: 15 working days
**Team Size**: 2-3 developers
**Priority**: Blocks production readiness

### Task 1.1: Implement Oliver-MCP Orchestrator (3 days)

**Status**: ❌ 0-byte stub file, completely non-functional
**Impact**: GitMCP anti-hallucination system broken, 11 MCPs not intelligently routed

**Deliverables**:
```
✅ src/agents/mcp/oliver-mcp-orchestrator.ts           # Main orchestrator (~800 lines)
✅ src/agents/mcp/mcp-selection-engine.ts               # MCP selection logic (~300 lines)
✅ src/agents/mcp/anti-hallucination-detector.ts        # Hallucination detection (~200 lines)
✅ src/agents/mcp/gitmcp-query-generator.ts             # GitMCP query generation (~200 lines)
✅ tests/mcp/oliver-mcp-integration.test.ts             # Integration tests (~400 lines)
```

**Acceptance Criteria**:
- [ ] Oliver-MCP selects appropriate MCP for task type
- [ ] Anti-hallucination detection triggers GitMCP for outdated knowledge
- [ ] Confidence scoring (0-100%) for MCP recommendations
- [ ] All 11 MCPs routed intelligently
- [ ] Tests validate MCP selection accuracy >= 90%

**Implementation Steps**:
1. Create MCP selection matrix (task type → best MCP)
2. Implement hallucination risk detector (checks knowledge freshness)
3. Build GitMCP query generator (framework mention → repo + path)
4. Create orchestrator integrating selection + detection
5. Write comprehensive tests (unit + integration)

---

### Task 1.2: Implement Dana-Database Agent (4 days)

**Status**: ❌ Definition exists but zero implementation
**Impact**: Three-tier parallel workflow impossible, 43% time savings claim undeliverable

**Deliverables**:
```
✅ src/agents/opera/dana-database/dana-sdk-agent.ts            # Main agent (~600 lines)
✅ src/agents/opera/dana-database/schema-validator.ts          # Schema validation (~300 lines)
✅ src/agents/opera/dana-database/rls-policy-generator.ts      # RLS policies (~250 lines)
✅ src/agents/opera/dana-database/query-optimizer.ts           # Query optimization (~400 lines)
✅ src/agents/opera/dana-database/migration-safety-checker.ts  # Migration validation (~200 lines)
✅ tests/agents/dana-database-integration.test.ts              # Tests (~500 lines)
```

**Acceptance Criteria**:
- [ ] Auto-activates on `*.sql`, `migrations/**`, `prisma/**`, `supabase/**`
- [ ] Validates database schema (normalization, constraints)
- [ ] Generates RLS policies for multi-tenant tables
- [ ] Optimizes queries (suggests indexes, analyzes performance)
- [ ] Checks migration safety (up/down, idempotency, data integrity)
- [ ] Integrates with Marcus-Backend and James-Frontend (three-tier workflow)

**Implementation Steps**:
1. Create dana-sdk-agent.ts with full OPERA agent interface
2. Implement schema validator (SQL parsing, normalization checks)
3. Build RLS policy generator (detect multi-tenant patterns → auto-generate policies)
4. Create query optimizer (EXPLAIN analysis, index suggestions)
5. Implement migration safety checker (up/down validation, rollback testing)
6. Write integration tests with Marcus/James handoff scenarios

---

### Task 1.3: Implement Instinctive Testing Workflow (3 days)

**Status**: ❌ 526-line design doc exists, zero implementation
**Impact**: User complaint unaddressed - tests deferred to end of phases

**Deliverables**:
```
✅ src/testing/instinctive-testing-engine.ts                   # Main engine (~800 lines)
✅ src/testing/task-completion-trigger.ts                      # Task completion detector (~300 lines)
✅ src/testing/quality-gate-enforcer.ts                        # Coverage/security gates (~400 lines)
✅ src/testing/smart-test-selector.ts                          # Affected tests selector (~350 lines)
✅ src/testing/test-trigger-matrix.ts                          # File pattern → test mapping (~200 lines)
✅ tests/workflows/instinctive-testing-integration.test.ts     # End-to-end tests (~600 lines)
```

**Acceptance Criteria**:
- [ ] Tests auto-run within 30 seconds of task completion
- [ ] Smart test selection (only affected tests, not full suite)
- [ ] Quality gates enforce 80%+ coverage before task marked complete
- [ ] File pattern triggers correct test type:
  - `*.api.ts` → Integration + Stress + Security tests
  - `*.tsx` → Unit + Accessibility + Visual regression tests
  - `*.sql` → Migration + Schema validation tests
- [ ] Integrated with TodoWrite (can't complete todo until tests pass)

**Implementation Steps**:
1. Create TaskCompletionTrigger watching TodoWrite status changes
2. Build TestTriggerMatrix mapping file patterns to test types
3. Implement SmartTestSelector (git diff → affected tests)
4. Create QualityGateEnforcer (coverage, WCAG, security thresholds)
5. Integrate with Maria-QA for test execution
6. Write end-to-end tests validating auto-test workflow

---

### Task 1.4: Create Cursor Hooks Infrastructure (2 days)

**Status**: ❌ Extensively documented (155 lines) but completely missing
**Impact**: No isolation validation, auto-formatting, security checks, or learning codification

**Deliverables**:
```
✅ scripts/create-cursor-hooks.cjs                             # Hook installer (~300 lines)
✅ ~/.cursor/hooks.json                                        # Auto-created config
✅ ~/.versatil/hooks/afterFileEdit.sh                          # Format + validate + RAG (~150 lines)
✅ ~/.versatil/hooks/beforeShellExecution.sh                   # Security checks (~200 lines)
✅ ~/.versatil/hooks/beforeReadFile.sh                         # Context tracking (~100 lines)
✅ ~/.versatil/hooks/beforeSubmitPrompt.sh                     # Agent suggestions (~100 lines)
✅ ~/.versatil/hooks/stop.sh                                   # Learning codification (~200 lines)
✅ tests/hooks/cursor-hooks-integration.test.ts                # Validation tests (~400 lines)
```

**Acceptance Criteria**:
- [ ] `~/.cursor/hooks.json` created on `npm install` (postinstall script)
- [ ] All 5 hook scripts executable and functional
- [ ] afterFileEdit blocks framework file creation in user projects
- [ ] beforeShellExecution blocks destructive commands (`rm -rf`, `DROP DATABASE`, etc.)
- [ ] beforeSubmitPrompt suggests relevant OPERA agents based on keywords
- [ ] stop hook stores session learnings to RAG memory
- [ ] Tests validate each hook behavior

**Implementation Steps**:
1. Create create-cursor-hooks.cjs script
2. Write 5 shell scripts implementing hook behaviors
3. Update package.json postinstall to run create-cursor-hooks.cjs
4. Test hook execution on file edits, shell commands, prompts
5. Validate isolation enforcement and security checks

---

### Task 1.5: Implement GitMCP Anti-Hallucination Runtime Logic (2 days)

**Status**: ❌ Pattern documented but no runtime detection
**Impact**: Agents hallucinate outdated framework knowledge instead of querying GitMCP

**Deliverables**:
```
✅ src/agents/mcp/anti-hallucination-detector.ts               # Detect outdated knowledge (~300 lines)
✅ src/agents/mcp/knowledge-freshness-checker.ts               # Check currency (~150 lines)
✅ src/agents/mcp/framework-repo-mapper.ts                     # Framework → repo mapping (~200 lines)
✅ tests/mcp/anti-hallucination.test.ts                        # Validation tests (~400 lines)
```

**Acceptance Criteria**:
- [ ] Detects when agent mentions framework/library (FastAPI, React, Rails, etc.)
- [ ] Checks if Claude knowledge cutoff (Jan 2025) is outdated for framework
- [ ] Auto-generates GitMCP query for latest docs
- [ ] Returns hallucination risk score (low/medium/high)
- [ ] Tests validate detection accuracy >= 95%

**Implementation Steps**:
1. Build framework mention extractor (regex + NLP)
2. Create knowledge freshness checker (cutoff date + framework release history)
3. Implement framework → repo mapper (FastAPI → tiangolo/fastapi, etc.)
4. Integrate with Oliver-MCP orchestrator
5. Write tests with various hallucination scenarios

---

### Task 1.6: Connect VELOCITY Workflow (5-Phase Orchestrator) (1 day)

**Status**: ❌ Individual commands exist but no orchestrator connecting them
**Impact**: Users must manually chain /plan → /assess → /delegate → /work → /learn

**Deliverables**:
```
✅ src/workflows/every-workflow-orchestrator.ts                # Main orchestrator (~600 lines)
✅ .claude/commands/work.md                                    # Missing Phase 4 command
✅ src/workflows/every-phase-transitions.ts                    # Auto-transitions (~300 lines)
✅ src/workflows/every-workflow-state-machine.ts               # State tracking (~250 lines)
✅ tests/workflows/every-workflow-integration.test.ts          # End-to-end tests (~500 lines)
```

**Acceptance Criteria**:
- [ ] /plan approval auto-triggers /assess
- [ ] /assess passing auto-triggers /delegate
- [ ] /delegate completion auto-triggers /work
- [ ] /work completion auto-triggers /learn
- [ ] State machine tracks workflow progress
- [ ] Tests validate full cycle (plan → assess → delegate → work → learn)

**Implementation Steps**:
1. Create VELOCITY workflow state machine (5 states + transitions)
2. Implement auto-transitions between phases
3. Create missing /work command
4. Integrate with TodoWrite for progress tracking
5. Write end-to-end workflow test

---

### Task 1.7: Integrate Memory Tool (Claude SDK) (2 days)

**Status**: ❌ Extensively documented (160 lines) but zero implementation
**Impact**: No cross-session learning, agents can't remember patterns

**Deliverables**:
```
✅ src/memory/memory-tool-integration.ts                       # Main integration (~600 lines)
✅ src/memory/memory-tool-operations.ts                        # 6 operations (~400 lines)
✅ src/memory/context-editing-integration.ts                   # 100k auto-clear (~300 lines)
✅ src/memory/agent-memory-manager.ts                          # Per-agent directories (~250 lines)
✅ tests/memory/memory-tool-operations.test.ts                 # Test all 6 ops (~500 lines)
✅ ~/.versatil/memories/[agent-id]/                            # Agent memory directories
```

**Acceptance Criteria**:
- [ ] 6 operations implemented: view, create, str_replace, insert, delete, rename
- [ ] Agent-specific directories: `~/.versatil/memories/maria-qa/`, etc.
- [ ] Context editing with 100k token auto-clear
- [ ] File-based storage (markdown format)
- [ ] Tests validate all operations work correctly

**Implementation Steps**:
1. Create agent memory directories structure
2. Implement 6 memory operations (view, create, str_replace, insert, delete, rename)
3. Build context editing integration (100k auto-clear)
4. Create agent memory manager (load/save patterns)
5. Write comprehensive tests for all operations

---

### Task 1.8: Enable Rule 2 Auto-Trigger (Stress Testing on File Changes) (1 day)

**Status**: ❌ Stress test generator exists but no auto-trigger
**Impact**: Core Rule 2 promise broken - tests only run manually

**Deliverables**:
```
✅ ~/.cursor/hooks.json                                        # Add afterFileEdit hook
✅ ~/.versatil/hooks/afterFileEdit.sh                          # Enhanced with stress test trigger
✅ tests/rules/rule2-auto-stress-testing.test.ts               # Validation tests (~300 lines)
```

**Acceptance Criteria**:
- [ ] Editing `*.api.ts` auto-triggers stress tests
- [ ] Only affected API endpoints tested (not full suite)
- [ ] Tests run within 2-5 minutes
- [ ] Results shown in statusline
- [ ] Tests block file save if failures detected (optional, configurable)

**Implementation Steps**:
1. Enhance afterFileEdit.sh hook with API file detection
2. Add stress test trigger for API changes
3. Integrate with automated-stress-test-generator.ts
4. Configure smart test selection (affected endpoints only)
5. Write tests validating auto-trigger behavior

---

## PHASE 2: High-Priority Gaps (Weeks 4-7) 🟠

**Goal**: Complete all documented features and enforce quality gates

**Duration**: 22 working days
**Team Size**: 2-3 developers
**Priority**: Required for production-ready framework

### Task 2.1-2.10: Implement 10 Language-Specific Sub-Agents (8 days)

**Status**: ❌ Documented but completely missing
**Impact**: Framework claims "18 agents" but delivers only 8

**Sub-Tasks**:

#### Marcus Backend Sub-Agents (5 sub-agents, 4 days)
```
✅ src/agents/opera/marcus-backend/sub-agents/marcus-node.ts       # Node.js specialist (~500 lines)
✅ src/agents/opera/marcus-backend/sub-agents/marcus-python.ts     # Python specialist (~500 lines)
✅ src/agents/opera/marcus-backend/sub-agents/marcus-rails.ts      # Rails specialist (~500 lines)
✅ src/agents/opera/marcus-backend/sub-agents/marcus-go.ts         # Go specialist (~500 lines)
✅ src/agents/opera/marcus-backend/sub-agents/marcus-java.ts       # Java specialist (~500 lines)
```

#### James Frontend Sub-Agents (5 sub-agents, 4 days)
```
✅ src/agents/opera/james-frontend/sub-agents/james-react.ts       # React specialist (~500 lines)
✅ src/agents/opera/james-frontend/sub-agents/james-vue.ts         # Vue specialist (~500 lines)
✅ src/agents/opera/james-frontend/sub-agents/james-nextjs.ts      # Next.js specialist (~500 lines)
✅ src/agents/opera/james-frontend/sub-agents/james-angular.ts     # Angular specialist (~500 lines)
✅ src/agents/opera/james-frontend/sub-agents/james-svelte.ts      # Svelte specialist (~500 lines)
```

#### Supporting Infrastructure
```
✅ src/agents/core/tech-stack-detector.ts                          # Auto-detect language/framework (~300 lines)
✅ src/agents/core/sub-agent-selector.ts                           # Select optimal sub-agent (~250 lines)
✅ tests/agents/sub-agents/marcus-sub-agents.test.ts               # Marcus tests (~600 lines)
✅ tests/agents/sub-agents/james-sub-agents.test.ts                # James tests (~600 lines)
```

**Acceptance Criteria**:
- [ ] Each sub-agent has language-specific best practices
- [ ] Tech stack detector auto-selects correct sub-agent
- [ ] Marcus sub-agents enforce language conventions (Node: async/await, Python: type hints, etc.)
- [ ] James sub-agents enforce framework patterns (React: hooks, Vue: Composition API, etc.)
- [ ] Tests validate sub-agent selection accuracy >= 95%

---

### Task 2.11: Add UX Excellence Reviewer Sub-Agent (2 days)

**Status**: ❌ Documented as "NEW v6.2" but doesn't exist
**Impact**: No automated UX audits or visual consistency checks

**Deliverables**:
```
✅ src/agents/opera/james-frontend/sub-agents/ux-excellence-reviewer.ts  # Main reviewer (~500 lines)
✅ src/agents/opera/james-frontend/ux-review/visual-consistency-checker.ts  # Visual checks (~300 lines)
✅ src/agents/opera/james-frontend/ux-review/markdown-analyzer.ts        # Markdown rendering (~200 lines)
✅ src/agents/opera/james-frontend/ux-review/ux-report-generator.ts      # Report generation (~250 lines)
✅ tests/agents/james-frontend/ux-excellence-reviewer.test.ts             # Tests (~400 lines)
```

**Acceptance Criteria**:
- [ ] Reviews visual consistency (tables, buttons, forms, spacing)
- [ ] Evaluates UX (navigation flow, feedback, accessibility)
- [ ] Analyzes markdown rendering (headings, lists, code blocks)
- [ ] Generates comprehensive UX reports with actionable recommendations
- [ ] Creates priority roadmaps for UX improvements

---

### Task 2.12: Integrate TodoWrite with Rule 1 (Parallel Execution) (1 day)

**Status**: ⚠️ Parallel execution works but no TodoWrite integration
**Impact**: Users can't see parallel task progress in statusline

**Deliverables**:
```
✅ Enhanced src/orchestration/parallel-task-manager.ts             # Add TodoWrite calls
✅ tests/orchestration/parallel-task-todowrite-integration.test.ts # Validation tests (~300 lines)
```

**Acceptance Criteria**:
- [ ] Parallel task execution auto-creates todos
- [ ] TodoWrite shows "Dana + Marcus + James working in parallel"
- [ ] Progress percentages updated in real-time
- [ ] Completed tasks auto-mark todos as complete

---

### Task 2.13: Add Rule 3 Cron Scheduler (Daily 2 AM Audits) (2 days)

**Status**: ⚠️ Audit system exists but no scheduler
**Impact**: Audits only run manually, not daily at 2 AM as promised

**Deliverables**:
```
✅ src/audit/daily-audit-daemon.ts                                 # Node.js daemon with cron (~400 lines)
✅ bin/versatil-audit-daemon.js                                    # Daemon entry point
✅ scripts/install-cron-job.sh                                     # Optional system cron setup
✅ tests/rules/rule3-daily-audit-scheduling.test.ts                # Tests (~300 lines)
```

**Acceptance Criteria**:
- [ ] Daemon runs continuously in background
- [ ] Audit executes at 2 AM daily (node-cron)
- [ ] Immediate audit on issue detection
- [ ] Logs to ~/.versatil/logs/daily-audit.log
- [ ] Tests validate cron scheduling

**Implementation Options**:
- **Option 1**: Node.js daemon with node-cron (recommended)
- **Option 2**: System cron job via scripts/install-cron-job.sh

---

### Task 2.14: Test Three-Tier Parallel Workflow (2 days)

**Status**: ⚠️ Architecture exists but no end-to-end tests
**Impact**: 43% time savings claim unvalidated

**Deliverables**:
```
✅ tests/workflows/three-tier-parallel-workflow.test.ts            # Main test (~500 lines)
✅ tests/integration/dana-marcus-handoff.test.ts                   # Dana → Marcus integration (~300 lines)
✅ tests/integration/marcus-james-handoff.test.ts                  # Marcus → James integration (~300 lines)
✅ tests/performance/three-tier-time-savings.test.ts               # Validate 43% claim (~400 lines)
```

**Acceptance Criteria**:
- [ ] Dana + Marcus + James execute in parallel
- [ ] Handoffs work correctly (Dana → Marcus, Marcus → James)
- [ ] Total time < 60% of sequential estimate (proves 40%+ savings)
- [ ] Integration phase completes successfully
- [ ] Tests run in CI/CD pipeline

---

### Task 2.15: Enforce 80%+ Coverage Pre-Commit Hook (1 day)

**Status**: ⚠️ Coverage documented but not enforced
**Impact**: Can commit untested code

**Deliverables**:
```
✅ .husky/pre-commit                                               # Git hook script
✅ package.json updates (husky install)
✅ tests/quality-gates/coverage-enforcement.test.ts                # Tests (~200 lines)
```

**Acceptance Criteria**:
- [ ] Pre-commit hook blocks if coverage < 80%
- [ ] Clear error message showing current coverage
- [ ] Husky installed and configured
- [ ] Tests validate enforcement

---

### Task 2.16: Enforce WCAG 2.1 AA Automated Tests (2 days)

**Status**: ⚠️ Accessibility project configured but no tests
**Impact**: Can deploy inaccessible components

**Deliverables**:
```
✅ tests/accessibility/wcag-2.1-aa-enforcement.a11y.spec.ts        # Axe-core tests (~400 lines)
✅ .github/workflows/quality-gates.yml                             # CI/CD enforcement
✅ tests/accessibility/keyboard-navigation.a11y.spec.ts            # Keyboard tests (~300 lines)
```

**Acceptance Criteria**:
- [ ] Axe-core tests validate WCAG 2.1 AA compliance
- [ ] Tests run on all pages/components
- [ ] Violations block build in CI/CD
- [ ] Keyboard navigation validated

---

### Task 2.17: Implement Context Statistics Tracking (2 days)

**Status**: ❌ Documented (194 lines) but completely missing
**Impact**: No visibility into context usage or token savings

**Deliverables**:
```
✅ src/memory/context-stats-tracker.ts                             # Main tracker (~500 lines)
✅ src/memory/context-stats-visualizer.ts                          # Dashboard (~300 lines)
✅ scripts/context-stats.cjs                                       # CLI tool (~200 lines)
✅ scripts/context-report.cjs                                      # Report generator (~250 lines)
✅ scripts/context-cleanup.cjs                                     # Cleanup utility (~100 lines)
✅ ~/.versatil/stats/clear-events.json                             # Auto-created
✅ ~/.versatil/stats/memory-ops.json                               # Auto-created
✅ ~/.versatil/stats/sessions.jsonl                                # Auto-created
✅ tests/memory/context-stats-tracking.test.ts                     # Tests (~400 lines)
```

**Acceptance Criteria**:
- [ ] Tracks all context clear events (timestamp, input tokens, tools cleared)
- [ ] Tracks all memory operations (view, create, str_replace, etc.)
- [ ] `npm run context:stats` shows dashboard
- [ ] `npm run context:report` generates detailed markdown report
- [ ] `npm run context:cleanup` removes stats older than 30 days

---

### Task 2.18: Validate 11 MCPs Integration (2 days)

**Status**: ⚠️ MCPs configured but untested
**Impact**: Unknown if MCPs actually work

**Deliverables**:
```
✅ tests/mcp/mcp-health-check.test.ts                              # Health check all MCPs (~600 lines)
✅ tests/mcp/playwright-integration.test.ts                        # Playwright validation (~300 lines)
✅ tests/mcp/github-integration.test.ts                            # GitHub validation (~300 lines)
✅ tests/mcp/gitmcp-integration.test.ts                            # GitMCP validation (~300 lines)
✅ scripts/mcp-health-check.cjs                                    # CLI health check (~200 lines)
```

**Acceptance Criteria**:
- [ ] All 11 MCPs tested individually
- [ ] Health check returns healthy/unhealthy status
- [ ] Response time < 5 seconds for each MCP
- [ ] Tests run in CI/CD pipeline

---

## PHASE 3: Medium-Priority Gaps (Weeks 8-9) 🟡

**Goal**: Polish documentation and integrations

**Duration**: 10 working days
**Team Size**: 1-2 developers
**Priority**: Nice-to-have for v7.0

### Task 3.1: Validate RAG Pattern Storage/Retrieval (2 days)

**Deliverables**:
```
✅ tests/rag/pattern-storage-retrieval.test.ts                     # Main test (~400 lines)
✅ tests/rag/compounding-engineering-validation.test.ts            # Validate 40% faster (~300 lines)
✅ tests/integration/rag-to-agent-handoff.test.ts                  # Pattern → agent (~300 lines)
```

---

### Task 3.2: Add Percy Visual Regression (1 day)

**Deliverables**:
```
✅ Install Percy (@percy/cli, @percy/playwright)
✅ Enhanced playwright.config.ts with visual-regression project
✅ tests/visual/dashboard.visual.spec.ts                           # Example visual test (~200 lines)
```

---

### Task 3.3: Implement Stop Hook Learning Codification (1 day)

**Deliverables**:
```
✅ Enhanced ~/.versatil/hooks/stop.sh with pattern extraction
✅ src/hooks/pattern-extractor.ts                                  # Extract patterns (~300 lines)
✅ src/rag/store-session-patterns.ts                               # Store to RAG (~200 lines)
✅ src/hooks/session-report-generator.ts                           # Generate report (~250 lines)
```

---

### Task 3.4: Add Mozilla Observatory Security Checks (1 day)

**Deliverables**:
```
✅ Install observatory-cli
✅ package.json: "security:observatory" script
✅ tests/security/observatory-validation.test.ts                   # Tests (~200 lines)
```

---

### Task 3.5: Fix CLAUDE.md 17 vs 8 Agents Mismatch (0.5 days)

**Deliverables**:
```
✅ Update CLAUDE.md line 357 to clarify agent count
✅ Document 10 sub-agents as "planned for v7.0" or "language-specific extensions"
```

---

### Task 3.6: Create /help Command (0.5 days)

**Deliverables**:
```
✅ .claude/commands/help.md                                        # Help command (~200 lines)
```

---

### Task 3.7: Write MCP Setup Guide (2 days)

**Deliverables**:
```
✅ docs/guides/mcp-setup-guide.md                                  # Comprehensive guide (~1000 lines)
```

---

### Task 3.8: Validate Agent Auto-Activation (2 days)

**Deliverables**:
```
✅ tests/proactive/auto-activation.test.ts                         # Auto-activation tests (~400 lines)
✅ tests/proactive/file-pattern-matching.test.ts                   # File pattern tests (~300 lines)
✅ tests/proactive/code-pattern-matching.test.ts                   # Code pattern tests (~250 lines)
```

---

## PHASE 4: Low-Priority Enhancements (Week 10) 🟢

**Goal**: Create example projects and polish onboarding

**Duration**: 3 working days
**Team Size**: 1 developer
**Priority**: Optional for v7.0, can defer to v7.1

### Task 4.1: Create Example Projects (3 days)

**Deliverables**:
```
✅ examples/todo-app-with-opera/                                   # Simple CRUD app
✅ examples/auth-system-three-tier/                                # Dana + Marcus + James example
✅ examples/ml-pipeline-deployment/                                # Dr.AI-ML example
✅ examples/accessibility-showcase/                                # James WCAG 2.1 AA example
```

---

## Release Schedule

### v6.5.0 Alpha (End of Week 3)
**Deliverables**: Phase 1 complete
**Status**: Critical gaps resolved, core promises restored

### v6.6.0 Beta (End of Week 7)
**Deliverables**: Phases 1 & 2 complete
**Status**: All high-priority features implemented

### v6.9.0 RC (End of Week 9)
**Deliverables**: Phases 1, 2, & 3 complete
**Status**: Polish complete, documentation accurate

### v7.0.0 Production (End of Week 10)
**Deliverables**: All phases complete
**Status**: 100% promise delivery, production-ready

---

## Success Metrics

### Completeness Score
- **Current (v6.4.0)**: 62% complete
- **Target (v7.0.0)**: 100% complete

### Gap Resolution Rate
- **Phase 1**: 8/31 gaps (26%) → 74% remaining
- **Phase 2**: 21/31 gaps (68%) → 32% remaining
- **Phase 3**: 30/31 gaps (97%) → 3% remaining
- **Phase 4**: 31/31 gaps (100%) → 0% remaining ✅

### Quality Metrics
- **Test Coverage**: 80%+ enforced
- **WCAG 2.1 AA**: 100% compliance
- **Security Score**: A+ (Observatory)
- **Performance**: Lighthouse 90+
- **Context Loss**: <0.5%

---

## Resource Requirements

### Team Composition
- **Backend Developer**: 1 FTE (Phases 1-2)
- **Frontend Developer**: 1 FTE (Phases 1-2)
- **QA Engineer**: 0.5 FTE (All phases)
- **DevOps Engineer**: 0.25 FTE (CI/CD, hooks, cron)

### Infrastructure
- GitHub Actions minutes: ~500 minutes/month
- Supabase free tier: Sufficient for RAG storage
- Test environments: Staging + Production

---

## Risk Mitigation

### High-Risk Items
1. **Oliver-MCP complexity**: Anti-hallucination logic requires advanced NLP
   - **Mitigation**: Start with simple keyword detection, iterate to advanced
2. **Three-tier workflow timing**: 43% savings claim hard to validate
   - **Mitigation**: Use synthetic benchmarks, validate on real features
3. **Memory Tool integration**: Claude SDK Memory Tool may have breaking changes
   - **Mitigation**: Reference Claude Cookbooks, follow official docs

### Blockers
- Claude SDK beta flags (context-management-2025-06-27)
- MCP server availability (Vertex AI, Sentry API keys)
- Cursor 1.7+ hooks API stability

---

## Approval & Sign-Off

**Project Manager**: _______________  Date: __________
**Tech Lead**: _______________  Date: __________
**QA Lead**: _______________  Date: __________

---

## Next Steps

1. **Week 1 Kickoff**: Assign Phase 1 tasks to team
2. **Daily Standups**: Track progress, unblock issues
3. **Weekly Reviews**: Demo completed tasks, adjust timeline
4. **Milestone Releases**: Alpha (Week 3), Beta (Week 7), RC (Week 9), Production (Week 10)

**Let's build VERSATIL v7.0 - the world's first 100% promise-delivering AI-native SDLC framework!** 🚀
