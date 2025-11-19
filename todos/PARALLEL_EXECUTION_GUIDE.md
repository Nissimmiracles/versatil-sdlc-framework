# VERSATIL SDLC Framework - Parallel Execution Guide

**Quick Start Guide for Executing Todos with OPERA Agents**

**Generated**: 2025-11-18
**Companion to**: MASTER_WAVE_ORCHESTRATION.md

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [IMMEDIATE WAVE Commands](#immediate-wave-week-1)
3. [SHORT-TERM WAVE Commands](#short-term-wave-weeks-2-3)
4. [MEDIUM-TERM WAVE Commands](#medium-term-wave-weeks-4-8)
5. [LONG-TERM WAVE Commands](#long-term-wave-weeks-9-16)
6. [Agent Command Reference](#agent-command-reference)
7. [Monitoring & Status](#monitoring--status)

---

## Quick Start

### Step 1: Review Current Status
```bash
# See all active todos
ls -la todos/*.md | grep -v archive

# Check MASTER_WAVE_ORCHESTRATION.md for detailed plan
cat todos/MASTER_WAVE_ORCHESTRATION.md
```

### Step 2: Start with IMMEDIATE WAVE (Critical - Week 1)
```bash
# This is your CRITICAL PATH - must complete first
/maria-qa "Fix critical build and test failures per guardian-combined-maria-qa-critical-1763467269260-gtyk.md"
```

### Step 3: Launch Parallel Tracks (After Step 2 completes)
```bash
# Copy and paste these commands to execute in parallel:
/dr-ai-ml "Fix RAG system issues per guardian-combined-dr-ai-ml-high-1763460419471-et9h.md and guardian-combined-dr-ai-ml-high-1763462647009-mdqm.md" &
/marcus-backend "Update dependencies and fix TypeScript error per guardian-combined-marcus-backend-low-1763460419470-1h0f.md and guardian-combined-marcus-backend-low-1763467269262-4cyv.md" &
```

### Step 4: Review and Approve Enhancements
See [Enhancement Approval Commands](#enhancement-approval-commands) below.

---

## IMMEDIATE WAVE (Week 1)

**Goal**: Fix critical blockers and prepare foundation
**Duration**: 2-4 hours
**Status**: 🔴 MUST COMPLETE BEFORE ANYTHING ELSE

### 🔴 CRITICAL PATH - Execute First (Maria-QA)

**BLOCKER**: Build and test failures prevent all development

```bash
# Command 1: Fix build and test failures
/maria-qa "Fix critical build and test failures per guardian-combined-maria-qa-critical-1763467269260-gtyk.md"
```

**What this fixes**:
- ✅ Build failed: Command failed: `npm run build`
- ✅ Tests failed: stdout maxBuffer length exceeded

**Success check**:
```bash
pnpm run build        # Should complete successfully
pnpm run test:unit    # Should run without maxBuffer errors
```

---

### 🟡 Parallel Track - Guardian Health Checks

**After Maria-QA completes**, launch these in parallel:

#### Dr.AI-ML: RAG System Fixes (HIGH Priority)

```bash
# Command 2: Fix RAG system issues (can run in background)
/dr-ai-ml "Fix RAG system issues per guardian-combined-dr-ai-ml-high-1763460419471-et9h.md and guardian-combined-dr-ai-ml-high-1763462647009-mdqm.md"
```

**What this fixes**:
- ✅ GraphRAG connection failed
- ✅ RAG Router malfunction
- ✅ GraphRAG query timeout (3270ms)

**Estimated time**: 30-60 minutes

---

#### Marcus-Backend: Dependencies & TypeScript (LOW Priority)

```bash
# Command 3: Update dependencies and fix TypeScript (can run in background)
/marcus-backend "Update dependencies and fix TypeScript error per guardian-combined-marcus-backend-low-1763460419470-1h0f.md and guardian-combined-marcus-backend-low-1763467269262-4cyv.md"
```

**What this fixes**:
- ✅ 46 outdated dependencies
- ✅ 1 TypeScript error

**Manual alternative** (if command fails):
```bash
pnpm update
pnpm run typecheck
```

**Estimated time**: 15-30 minutes

---

### 🟢 Enhancement Approval Commands

**While agents work**, review and approve 9 enhancement proposals:

#### Critical Enhancements (Approve First)

```bash
# Enhancement 1: Build reliability (Maria-QA, 2.5h)
/approve enhancement-reliability-critical-1761852491886-etli.md

# Enhancement 2: Test reliability (Marcus-Backend, 3h)
/approve enhancement-reliability-critical-1761852491902-1je6.md
```

#### High Priority Enhancements

```bash
# Enhancement 3: Query optimization + caching (Marcus-Backend, 6h, ROI: 39,008:1)
/approve enhancement-performance-high-1761852491915-gxwh.md

# Enhancement 4: RAG system reliability (Marcus-Backend, 2h, ROI: 117,026:1)
/approve enhancement-reliability-high-1761852491915-s8bu.md
```

#### Medium Priority Enhancements

```bash
# Enhancement 5: TypeScript reliability (Marcus-Backend, 2h)
/approve enhancement-reliability-medium-1761852491911-xxt5.md

# Enhancement 6: Agents reliability (Sarah-PM, 2h)
/approve enhancement-reliability-medium-1761852491916-f4fo.md

# Enhancement 7: Hooks reliability (Marcus-Backend, 2h)
/approve enhancement-reliability-medium-1761852491923-r0he.md

# Enhancement 8: Documentation reliability (Marcus-Backend, 2h)
/approve enhancement-reliability-medium-1761852491924-zulg.md

# Enhancement 9: Dependencies reliability (Marcus-Backend, 2h)
/approve enhancement-reliability-medium-1761852491925-5dr9.md
```

**Batch approval** (alternative):
```bash
# Review all enhancements at once
/approve-batch todos/enhancement-*.md --filter "priority:critical,high" --dry-run

# After review, approve batch
/approve-batch todos/enhancement-*.md --filter "priority:critical,high" --confirm
```

---

### IMMEDIATE WAVE - Complete Command Sequence

**Copy and paste this complete sequence**:

```bash
# Step 1: CRITICAL PATH (blocks everything)
echo "🔴 Starting CRITICAL PATH - Maria-QA"
/maria-qa "Fix critical build and test failures per guardian-combined-maria-qa-critical-1763467269260-gtyk.md"

# Verify build works before continuing
pnpm run build && echo "✅ Build fixed!" || echo "❌ Build still failing - investigate"

# Step 2: Parallel Guardian fixes (launch in background)
echo "🟡 Launching parallel Guardian health checks"
/dr-ai-ml "Fix RAG system issues per guardian-combined-dr-ai-ml-high-1763460419471-et9h.md and guardian-combined-dr-ai-ml-high-1763462647009-mdqm.md" &
/marcus-backend "Update dependencies and fix TypeScript error per guardian-combined-marcus-backend-low-1763460419470-1h0f.md and guardian-combined-marcus-backend-low-1763467269262-4cyv.md" &

# Step 3: While agents work, approve enhancements
echo "🟢 Review and approve enhancements (manual)"
echo "See Enhancement Approval Commands above"

# Wait for all background jobs
wait
echo "✅ IMMEDIATE WAVE COMPLETE"
```

**Expected Duration**: 2-4 hours total

---

## SHORT-TERM WAVE (Weeks 2-3)

**Goal**: Build foundation for ML workflow
**Duration**: 2-3 weeks
**Dependencies**: IMMEDIATE WAVE must complete first

### 🔴 Critical Path: Database Schema (Dana-Database)

**BLOCKS**: Backend API (48h), all Wave 2 work

```bash
# Command 1: Database schema implementation (16h, CRITICAL PATH)
/dana-database "Implement database schema per backlog/014-pending-p1-database-schema-implementation.md"
```

**What this creates**:
- 11 core tables (workflows, datasets, models, experiments, features, metrics, etc.)
- PostgreSQL schema with Prisma ORM
- Migration scripts
- Seed data

**Success check**:
```bash
# Verify database schema
npx prisma db push
npx prisma studio  # Should show all 11 tables
```

---

### 🟡 Parallel Tracks (Can run with database work)

#### Track B: GCP Infrastructure (Marcus-Backend)

**BLOCKS**: Vertex AI integration (48h)

```bash
# Command 2: GCP infrastructure setup (8h, parallel with Command 1)
/marcus-backend "Set up GCP infrastructure per backlog/015-pending-p1-gcp-infrastructure-setup.md"
```

**What this sets up**:
- GCP project with Vertex AI APIs
- Service accounts and IAM roles
- Cloud Storage buckets
- Environment configuration

---

#### Track C: RAG System Completion (Dr.AI-ML)

```bash
# Command 3: Complete RAG system (8h, parallel with Commands 1 & 2)
/dr-ai-ml "Complete RAG system fixes and testing per backlog/010-pending-p1-test-rag-with-real-questions.md, backlog/012-pending-p1-context-management-audit.md, backlog/013-pending-p1-create-library-context-files.md"
```

**What this completes**:
- ✅ RAG tested with real user questions
- ✅ Context management audit
- ✅ Library context files for 14+ libraries

---

#### Track D: ML Workflow Validation (Iris-Guardian)

```bash
# Command 4: ML workflow validation (8h, parallel with Commands 1, 2, 3)
/guardian "Validate ML workflow implementation per backlog/013-pending-p1-guardian-ml-workflow-implementation-validation.md"
```

**What this validates**:
- Gap analysis across 12 components
- Remediation todos generated
- Implementation status dashboard

---

### SHORT-TERM WAVE - Complete Command Sequence

```bash
# Launch all 4 tracks in parallel (no dependencies between them)
echo "🚀 Launching SHORT-TERM WAVE (4 parallel tracks)"

/dana-database "Implement database schema per backlog/014-pending-p1-database-schema-implementation.md" &
/marcus-backend "Set up GCP infrastructure per backlog/015-pending-p1-gcp-infrastructure-setup.md" &
/dr-ai-ml "Complete RAG system fixes and testing per backlog/010, 012, 013" &
/guardian "Validate ML workflow implementation per backlog/013-pending-p1-guardian-ml-workflow-implementation-validation.md" &

# Wait for all to complete
wait
echo "✅ SHORT-TERM WAVE COMPLETE"

# Verify database schema (critical path)
npx prisma db push && echo "✅ Database ready!" || echo "❌ Database issues - investigate"
```

**Expected Duration**: 2-3 weeks (Dana-Database is critical path at 16h)

---

## MEDIUM-TERM WAVE (Weeks 4-8)

**Goal**: Build core ML services
**Duration**: 4-6 weeks
**Dependencies**: SHORT-TERM WAVE (especially database schema) must complete

### 🔴 Sequential Tracks (Backend API blocks Frontend/N8N)

#### Track A: Backend API Development (Marcus-Backend)

**BLOCKS**: Frontend UI (56h), N8N integration (32h)
**DEPENDS ON**: Database schema (16h) from SHORT-TERM WAVE

```bash
# Command 1: Backend API development (48h, MUST wait for database)
/marcus-backend "Develop backend API per backlog/017-pending-p1-backend-api-development.md"
```

**What this creates**:
- REST API endpoints: `/api/v1/workflows`, `/datasets`, `/models`, `/experiments`
- Authentication & authorization
- API documentation (OpenAPI/Swagger)
- Integration tests

**Success check**:
```bash
# Verify API is running
curl http://localhost:3000/api/v1/workflows
# Should return JSON response
```

---

### 🟡 Parallel Tracks

#### Track B: Vertex AI Integration (Dr.AI-ML)

**DEPENDS ON**: GCP infrastructure (8h) from SHORT-TERM WAVE
**PARALLEL**: Can run with Backend API (different owner)

```bash
# Command 2: Vertex AI integration (48h, parallel with Command 1)
/dr-ai-ml "Implement Vertex AI integration per backlog/018-pending-p1-vertex-ai-integration.md"
```

**What this creates**:
- Vertex AI training pipeline
- Model deployment service
- Prediction API
- Experiment tracking

---

#### Track C: Plan Command Enhancement (Sarah-PM, Maria-QA)

**PARALLEL**: Independent of ML workflow

```bash
# Command 3a: Integration tests (Maria-QA, 2h)
/maria-qa "Create integration tests per backlog/005-pending-p2-integration-tests-plan-command.md"

# Command 3b: Plan integration (Sarah-PM, 2h, AFTER tests pass)
/sarah-pm "Integrate plan command enhancements per backlog/006-pending-p1-plan-command-integration.md"

# Command 3c: Documentation (Sarah-PM, 1h, AFTER integration)
/sarah-pm "Update documentation per backlog/007-pending-p2-documentation-updates.md"
```

**What this enhances**:
- ✅ /plan command with RAG-powered pattern search
- ✅ Template matching for common features
- ✅ Effort estimation from historical data
- ✅ Compounding engineering documentation

---

### MEDIUM-TERM WAVE - Complete Command Sequence

```bash
echo "🚀 Launching MEDIUM-TERM WAVE"

# Phase 1: Launch parallel tracks (Tracks A & B)
/marcus-backend "Develop backend API per backlog/017-pending-p1-backend-api-development.md" &
/dr-ai-ml "Implement Vertex AI integration per backlog/018-pending-p1-vertex-ai-integration.md" &

# Phase 2: Plan enhancement (sequential sub-tasks)
echo "📋 Starting Plan Enhancement (sequential)"
/maria-qa "Create integration tests per backlog/005-pending-p2-integration-tests-plan-command.md"

# Wait for tests to pass
pnpm run test:integration && \
/sarah-pm "Integrate plan command enhancements per backlog/006-pending-p1-plan-command-integration.md" && \
/sarah-pm "Update documentation per backlog/007-pending-p2-documentation-updates.md"

# Wait for Phase 1 to complete
wait
echo "✅ MEDIUM-TERM WAVE COMPLETE"
```

**Expected Duration**: 4-6 weeks

---

## LONG-TERM WAVE (Weeks 9-16)

**Goal**: Advanced features and polish
**Duration**: 8-12 weeks
**Dependencies**: MEDIUM-TERM WAVE (especially Backend API) must complete

### Phase 1: Backend-Dependent Features (Parallel)

```bash
# Launch all 3 tracks in parallel (all depend on Backend API)
echo "🚀 Launching LONG-TERM WAVE Phase 1"

# Track A: N8N Integration (Marcus-Backend, 32h)
/marcus-backend "Implement N8N workflow integration per backlog/019-pending-p2-n8n-workflow-integration.md" &

# Track B: Frontend UI (James-Frontend, 56h)
/james-frontend "Build frontend UI components per backlog/020-pending-p2-frontend-ui-components.md" &

# Track D: Dataset Tools (Dr.AI-ML, 40h)
/dr-ai-ml "Create dataset building tools per backlog/022-pending-p2-dataset-building-tools.md" &

wait
echo "✅ Phase 1 complete"
```

---

### Phase 2: Advanced ML (Sequential)

```bash
# Command: Pattern Recognition Framework (Dr.AI-ML, 80h)
/dr-ai-ml "Build pattern recognition framework per backlog/021-pending-p2-pattern-recognition-framework.md"

echo "✅ Phase 2 complete"
```

---

### Phase 3: Testing & Documentation (Sequential)

```bash
# Command 1: ML Test Coverage (Maria-QA, 64h)
/maria-qa "Create comprehensive ML test coverage per backlog/023-pending-p1-ml-test-coverage.md"

# Command 2: ML Documentation (Sarah-PM, 16h)
/sarah-pm "Create ML documentation per backlog/024-pending-p3-ml-documentation.md"

echo "✅ LONG-TERM WAVE COMPLETE"
```

---

## Agent Command Reference

### Available Agent Commands

```bash
# Business Analyst
/alex-ba "task description"

# Database Specialist
/dana-database "task description"

# AI/ML Specialist
/dr-ai-ml "task description"

# Frontend Developer
/james-frontend "task description"

# Backend Developer
/marcus-backend "task description"

# QA Engineer
/maria-qa "task description"

# Guardian Framework Monitor
/guardian "task description"

# Project Manager
/sarah-pm "task description"
```

### Delegation Command

**Automatically assign work to optimal agents**:

```bash
# Delegate all Wave 1 todos
/delegate "todos/guardian-combined-*.md"

# Delegate by priority
/delegate "priority:critical,high"

# Delegate specific wave
/delegate "IMMEDIATE WAVE"
```

### Resolve Command

**Resolve multiple todos in parallel**:

```bash
# Resolve all guardian todos
/resolve "todos/guardian-combined-*.md"

# Resolve by pattern
/resolve "enhancement-reliability-*"

# Resolve specific IDs
/resolve "1763460419471 1763462647009"
```

---

## Monitoring & Status

### Check Overall Progress

```bash
# View master orchestration plan
cat todos/MASTER_WAVE_ORCHESTRATION.md

# Count todos by status
find todos -name "*.md" ! -path "*/archive/*" | wc -l

# List active guardian todos
ls -la todos/guardian-combined-*.md

# List enhancement todos
ls -la todos/enhancement-*.md

# Check backlog
ls -la todos/backlog/*.md | wc -l
```

### Wave Status Checks

#### IMMEDIATE WAVE Status

```bash
# Check if build works
pnpm run build && echo "✅ Build OK" || echo "❌ Build failing"

# Check if tests work
pnpm run test:unit && echo "✅ Tests OK" || echo "❌ Tests failing"

# Check dependencies
pnpm outdated

# Check TypeScript
pnpm run typecheck
```

#### SHORT-TERM WAVE Status

```bash
# Check database schema
npx prisma db push && echo "✅ Database OK" || echo "❌ Database issues"

# Check GCP setup
gcloud projects list | grep versatil

# Test RAG system
# (Use appropriate RAG query command)
```

#### MEDIUM-TERM WAVE Status

```bash
# Check Backend API
curl http://localhost:3000/api/v1/health

# Check Vertex AI
gcloud ai models list --region=us-central1

# Test /plan command
# (Run /plan command in Claude Code)
```

### Agent Workload Check

```bash
# Count todos by agent
grep -r "assigned_agent:" todos/*.md | cut -d: -f3 | sort | uniq -c

# Expected output:
#   10 Marcus-Backend
#    4 Dr.AI-ML
#    3 Maria-QA
#    2 Sarah-PM
#    1 Dana-Database
```

### Guardian Health Check

```bash
# Run Guardian health check
/guardian "Run comprehensive health check"

# Check Guardian logs
cat ~/.versatil/logs/guardian-*.log | tail -50

# View Guardian activity
/guardian-logs --tail --follow
```

---

## Troubleshooting

### Command Not Working

**If agent command fails**:

1. **Check agent is available**:
   ```bash
   /help  # Shows available agents and commands
   ```

2. **Use alternative syntax**:
   ```bash
   # Instead of /agent-name, use SlashCommand
   /delegate "task description" --agent=agent-name
   ```

3. **Manual execution**:
   - Read the todo file
   - Execute tasks manually
   - Mark todo as resolved

### Build Still Failing After Maria-QA

```bash
# Check build logs
pnpm run build 2>&1 | tee build.log

# Check specific errors
pnpm run typecheck

# Clean and rebuild
rm -rf dist node_modules
pnpm install
pnpm run build
```

### Tests Still Failing

```bash
# Increase maxBuffer (temporary fix)
NODE_OPTIONS="--max-old-space-size=4096" pnpm run test:unit

# Run tests individually
pnpm run test:unit -- tests/specific.test.ts

# Check Jest configuration
cat config/jest.config.cjs
```

### RAG System Issues

```bash
# Check GraphRAG connection
# (Use appropriate connection test command)

# Check vector store
# (Use appropriate vector store health check)

# Fallback: Use simpler RAG
# (Configure fallback in environment)
```

### Dependencies Won't Update

```bash
# Force update
pnpm update --force

# Check for conflicts
pnpm list --depth=0

# Clear cache
pnpm store prune
rm -rf node_modules
pnpm install
```

---

## Best Practices

### 1. Always Follow Wave Order

❌ **Don't skip waves**:
```bash
# BAD: Jumping to LONG-TERM before SHORT-TERM
/james-frontend "Build UI" # Will fail - no backend API yet
```

✅ **Follow dependencies**:
```bash
# GOOD: Complete SHORT-TERM first
/dana-database "Implement schema"  # THEN
/marcus-backend "Build API"        # THEN
/james-frontend "Build UI"
```

### 2. Use Parallel Execution When Possible

❌ **Don't run sequentially when parallel is possible**:
```bash
/dr-ai-ml "task1"
/marcus-backend "task2"  # Waited unnecessarily
```

✅ **Launch parallel tracks together**:
```bash
/dr-ai-ml "task1" &
/marcus-backend "task2" &
wait
```

### 3. Verify Success Before Moving On

❌ **Don't assume success**:
```bash
/maria-qa "fix build"
/marcus-backend "build API"  # May fail if build still broken
```

✅ **Verify before proceeding**:
```bash
/maria-qa "fix build"
pnpm run build && echo "✅ Verified" || exit 1
/marcus-backend "build API"
```

### 4. Monitor Agent Workload

```bash
# Check before assigning more work
grep "assigned_agent: Marcus-Backend" todos/*.md | wc -l
# If >5, consider delegating to other agents
```

### 5. Document Blockers Immediately

If an agent gets blocked:
```bash
# Create blocker todo
echo "BLOCKER: <description>" > todos/blocker-$(date +%s).md

# Tag in master orchestration
# Update MASTER_WAVE_ORCHESTRATION.md with blocker status
```

---

## Quick Command Cheat Sheet

```bash
# === IMMEDIATE WAVE (Week 1) ===
/maria-qa "Fix build/tests per guardian-combined-maria-qa-critical-1763467269260-gtyk.md"
/dr-ai-ml "Fix RAG per guardian-combined-dr-ai-ml-high-1763460419471-et9h.md" &
/marcus-backend "Update deps per guardian-combined-marcus-backend-low-1763467269262-4cyv.md" &

# === SHORT-TERM WAVE (Weeks 2-3) ===
/dana-database "Schema per backlog/014-pending-p1-database-schema-implementation.md" &
/marcus-backend "GCP per backlog/015-pending-p1-gcp-infrastructure-setup.md" &
/dr-ai-ml "RAG per backlog/010, 012, 013" &
/guardian "Validate per backlog/013-pending-p1-guardian-ml-workflow-implementation-validation.md" &

# === MEDIUM-TERM WAVE (Weeks 4-8) ===
/marcus-backend "API per backlog/017-pending-p1-backend-api-development.md" &
/dr-ai-ml "Vertex AI per backlog/018-pending-p1-vertex-ai-integration.md" &
/maria-qa "Tests per backlog/005-pending-p2-integration-tests-plan-command.md"

# === LONG-TERM WAVE (Weeks 9-16) ===
/marcus-backend "N8N per backlog/019-pending-p2-n8n-workflow-integration.md" &
/james-frontend "UI per backlog/020-pending-p2-frontend-ui-components.md" &
/dr-ai-ml "Datasets per backlog/022-pending-p2-dataset-building-tools.md" &
```

---

**Last Updated**: 2025-11-18
**Status**: Active - Ready for execution
**Related**: MASTER_WAVE_ORCHESTRATION.md (detailed plan)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
