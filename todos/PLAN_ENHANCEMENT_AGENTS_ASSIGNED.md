# P1: /plan Command Enhancement - Agent Assignments & Execution Plan

## Executive Summary

Transform `/plan` command with Compounding Engineering patterns. **92 tests now passing** after Jest fixes. Ready to implement enhanced planning with RAG, templates, and effort estimation.

## Current Status (2025-10-26)

### ✅ Completed Prerequisites
- [x] Jest configuration fixed - ts-jest working correctly
- [x] Contract tests fixed - 92 tests passing
- [x] Test infrastructure ready for new features
- [x] Basic /plan command operational (parallel agent research)

### 📋 Master Task Status
- **File**: `todos/001-in-progress-p1-enhance-plan-command.md`
- **Progress**: 2/8 acceptance criteria complete
- **Estimated Effort**: 9 hours across 6 sub-tasks
- **Target**: v7.0 transformation

## Agent Team Assignments

### 🎯 **Sarah-PM** (Project Manager & Orchestrator)
**Role**: Lead coordinator, integration owner
**Priority**: Critical
**Responsibilities**:
- Coordinate all 6 sub-tasks
- Own task 003 (Template Matcher) with Alex-BA
- Own task 004 (Todo Generator) with Marcus
- Own task 006 (Integration) with Alex-BA + Marcus
- Own task 007 (Documentation) with Alex-BA
- Ensure dependencies are respected (Wave 1 → Wave 2 → Wave 3 → Wave 4)

**Assigned Sub-Tasks**:
- 003-pending-p1-template-matcher-service.md
- 004-pending-p1-todo-file-generator-service.md
- 006-pending-p1-plan-command-integration.md
- 007-pending-p2-documentation-updates.md

---

### 🤖 **Dr.AI-ML** (Machine Learning & RAG Specialist)
**Role**: RAG implementation lead
**Priority**: Critical
**Responsibilities**:
- Implement pattern search service (task 002)
- Design vector search queries
- Optimize similarity thresholds
- Extract effort estimates from historical data
- Work with Marcus on RAG infrastructure

**Assigned Sub-Tasks**:
- 002-pending-p1-pattern-search-service.md

**Technical Focus**:
```typescript
// Vector search in RAG store
async function searchSimilarFeatures(
  description: string
): Promise<HistoricalPattern[]> {
  const results = await vectorStore.search({
    query: description,
    domain: 'feature_implementations',
    limit: 5,
    threshold: 0.75
  });

  return results.map(r => ({
    feature_name: r.metadata.feature,
    effort_hours: r.metadata.effort,
    lessons_learned: r.metadata.lessons
  }));
}
```

---

### ⚙️ **Marcus-Backend** (Backend & Infrastructure)
**Role**: API and system integration
**Priority**: High
**Responsibilities**:
- Support Dr.AI-ML on RAG infrastructure (task 002)
- Co-own todo file generator (task 004) with Sarah-PM
- Co-own plan command integration (task 006)
- Implement file system operations for persistent todos
- Ensure proper error handling

**Assigned Sub-Tasks**:
- 002-pending-p1-pattern-search-service.md (support)
- 004-pending-p1-todo-file-generator-service.md
- 006-pending-p1-plan-command-integration.md

---

### 📊 **Alex-BA** (Business Analyst & Requirements)
**Role**: Requirements and templates
**Priority**: High
**Responsibilities**:
- Co-own template matcher (task 003) with Sarah-PM
- Design 5 plan templates (auth, CRUD, dashboard, API, RAG)
- Define acceptance criteria for templates
- Co-own documentation updates (task 007)
- Ensure business value is maintained

**Assigned Sub-Tasks**:
- 003-pending-p1-template-matcher-service.md
- 006-pending-p1-plan-command-integration.md (support)
- 007-pending-p2-documentation-updates.md

**Template Focus**:
```yaml
# Plan Template: Authentication System
name: "Authentication System"
category: "Security"
estimated_effort: "Large (24-32 hours)"
phases:
  database: [users table, sessions, RLS]
  api: [signup, login, logout, /auth/me]
  frontend: [LoginForm, AuthProvider, Protected routes]
  testing: [Unit, Integration, E2E, Security]
```

---

### ✅ **Maria-QA** (Quality Assurance & Testing)
**Role**: Testing and quality gates
**Priority**: High
**Responsibilities**:
- Own integration tests (task 005)
- Validate all services work together
- Ensure 80%+ test coverage maintained
- Create E2E tests for /plan workflow
- Quality gate enforcement

**Assigned Sub-Tasks**:
- 005-pending-p2-integration-tests-plan-command.md

**Test Coverage Required**:
- Unit tests for each service (002, 003, 004)
- Integration test for full /plan workflow
- E2E test: `/plan "Add user authentication"`
- Manual testing: simple vs complex features

---

### 🎨 **James-Frontend** (UI/UX - Minimal Involvement)
**Role**: Output format review (optional)
**Priority**: Low
**Responsibilities**:
- Review enhanced plan output markdown format
- Suggest improvements for readability
- No direct implementation work required

**Assigned Sub-Tasks**: None (advisory only)

---

### 🗄️ **Dana-Database** (Database - No Involvement)
**Role**: N/A for this task
**Priority**: None
**Assigned Sub-Tasks**: None

---

## Execution Plan

### 📦 **Wave 1: Core Services** (Parallel - 3 hours)

**Can start immediately** - no dependencies

#### Task 002: Pattern Search Service
- **Owner**: Dr.AI-ML + Marcus
- **Effort**: 1.5 hours
- **File**: `src/rag/pattern-search.ts`
- **Deliverables**:
  - `searchSimilarFeatures(description)` function
  - Vector store integration
  - Effort estimation extraction
  - Lessons learned retrieval

#### Task 003: Template Matcher Service
- **Owner**: Sarah-PM + Alex-BA
- **Effort**: 1 hour
- **File**: `src/templates/template-matcher.ts`
- **Deliverables**:
  - 5 plan templates (auth, CRUD, dashboard, API, RAG)
  - Keyword matching algorithm
  - Template scoring system

#### Task 004: Todo File Generator Service
- **Owner**: Sarah-PM + Marcus
- **Effort**: 0.5 hours
- **File**: `src/planning/todo-file-generator.ts`
- **Deliverables**:
  - `generateTodoFile()` function
  - Persistent todos/*.md file creation
  - Dual todo system (TodoWrite + files)

---

### 🧪 **Wave 2: Quality Gate** (Sequential - 2 hours)

**Depends on**: Wave 1 complete

#### Task 005: Integration Tests
- **Owner**: Maria-QA
- **Effort**: 2 hours
- **File**: `tests/integration/plan-command-e2e.test.ts`
- **Deliverables**:
  - Integration test for full /plan flow
  - Mock RAG responses
  - Test all 3 services working together
  - 80%+ coverage validation

---

### 🔗 **Wave 3: Integration** (Sequential - 2 hours)

**Depends on**: Wave 2 complete (tests passing)

#### Task 006: Plan Command Integration
- **Owner**: Sarah-PM + Alex-BA + Marcus
- **Effort**: 2 hours
- **File**: `.claude/commands/plan.md`
- **Deliverables**:
  - Integrate all 3 services into /plan command
  - Enhanced output format with:
    - Historical context
    - Effort estimates with confidence
    - Risk assessment
    - Alternative approaches
  - Backward compatibility maintained

---

### 📚 **Wave 4: Documentation** (Sequential - 1 hour)

**Depends on**: Wave 3 complete

#### Task 007: Documentation Updates
- **Owner**: Sarah-PM + Alex-BA
- **Effort**: 1 hour
- **Files**:
  - `docs/guides/compounding-engineering.md`
  - `CLAUDE.md` (enhanced planning section)
  - `README.md` (before/after examples)
- **Deliverables**:
  - Compounding engineering guide
  - Updated CLAUDE.md with new capabilities
  - User-facing documentation

---

## Dependencies Graph

```
Wave 1 (Parallel):
  002 (Dr.AI-ML + Marcus) ─┐
  003 (Sarah-PM + Alex-BA)─┼─> Wave 2
  004 (Sarah-PM + Marcus) ─┘
                            │
                            ↓
                    005 (Maria-QA)
                            │
                            ↓
                    006 (Sarah-PM + Alex-BA + Marcus)
                            │
                            ↓
                    007 (Sarah-PM + Alex-BA)
```

---

## Success Metrics

### Acceptance Criteria (8 total)
- [x] **Assess Phase**: Already implemented via `/assess`
- [ ] **Codify Phase**: RAG search for similar features (task 002)
- [ ] **Plan Templates**: 5 templates created (task 003)
- [ ] **Effort Estimation**: Historical data-based (task 002 + 003)
- [ ] **Historical Context**: Lessons learned (task 002)
- [ ] **Enhanced Output**: Confidence/risk/alternatives (task 006)
- [x] **Three-Tier Analysis**: Already in plan.md
- [ ] **TodoWrite Integration**: Dual todos (task 004)

### Quality Gates
- [ ] All 6 sub-tasks marked RESOLVED
- [ ] Integration tests passing (80%+ coverage)
- [ ] Manual testing complete (5 templates work)
- [ ] 40% improvement path demonstrated

---

## Timeline Estimate

**Start Date**: 2025-10-26 (Today)
**Target Completion**: 2025-10-29 (3 days)

| Day | Wave | Tasks | Effort | Cumulative |
|-----|------|-------|--------|------------|
| 1 | Wave 1 | 002, 003, 004 | 3h | 3h |
| 2 | Wave 2 | 005 | 2h | 5h |
| 2-3 | Wave 3 | 006 | 2h | 7h |
| 3 | Wave 4 | 007 | 1h | 8h |

**Buffer**: 1 hour (total 9 hours estimated)

---

## Next Actions

### Immediate (Today)
1. **Sarah-PM**: Kick off Wave 1 coordination
2. **Dr.AI-ML**: Start implementing pattern-search.ts
3. **Sarah-PM + Alex-BA**: Create first template (auth)
4. **Sarah-PM + Marcus**: Implement todo-file-generator.ts

### Tomorrow
5. **Maria-QA**: Begin integration tests once Wave 1 complete
6. **Sarah-PM**: Prepare for integration work

### Day 3
7. **All agents**: Final integration and documentation

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| RAG store empty initially | Medium | Bootstrap with examples from Every Inc patterns |
| Effort estimation accuracy | Low | Start with ±50% confidence, improve over time |
| Template coverage gaps | Low | Start with 5 common templates, add more later |
| Integration complexity | Medium | Wave-based approach with quality gates |

---

## Generated Files Tracker

### New Files Created
- ✅ `src/planning/todo-file-generator.ts` (skeleton exists)
- ✅ `src/rag/pattern-search.ts` (skeleton exists)
- ✅ `src/templates/template-matcher.ts` (skeleton exists)
- ✅ `tests/unit/planning/todo-file-generator.test.ts` (skeleton)
- ✅ `tests/unit/rag/pattern-search.test.ts` (skeleton)
- ✅ `tests/unit/templates/template-matcher.test.ts` (skeleton)
- ✅ `tests/integration/plan-command-e2e.test.ts` (skeleton)
- ✅ `docs/guides/compounding-engineering.md` (created)

### Modified Files
- [ ] `.claude/commands/plan.md` (integration work)
- [ ] `CLAUDE.md` (documentation)
- [ ] `README.md` (examples)

---

## Communication Protocol

### Daily Standups
- **Sarah-PM** provides status updates
- All agents report blockers
- Dependencies verified before Wave transitions

### Hand-offs
- Dr.AI-ML → Marcus: RAG infrastructure ready
- Wave 1 → Maria-QA: All services implemented
- Maria-QA → Sarah-PM: Tests passing, ready for integration
- Wave 3 → Wave 4: Integration complete, ready for docs

---

**Generated**: 2025-10-26
**Last Updated**: 2025-10-26
**Status**: Ready to Execute

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
