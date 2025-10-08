# VERSATIL SDLC Framework - Orchestration Hierarchy

**Version**: 2.0
**Last Updated**: 2025-10-08
**Status**: Production Ready

---

## 🎯 Orchestration Overview

The VERSATIL framework uses a **5-layer orchestration hierarchy** with clear separation of concerns and responsibilities. This document defines the complete orchestration chain from epic-level intelligence down to individual file operations.

---

## 📊 Complete Orchestration Hierarchy

```
┌──────────────────────────────────────────────────────────────────┐
│         LAYER 1: EPIC INTELLIGENCE ORCHESTRATION                  │
│         (New Epic-Level Work - 15 Intelligence Systems)           │
│                                                                    │
│  • Master Intelligence Orchestrator                                │
│    ├─ Epic Conversation Analyzer (detect epics from chat)        │
│    ├─ Mindset Context Engine (validate against vision)            │
│    ├─ PRD Feasibility Analyzer (web research + stress test)      │
│    ├─ Epic Workflow Orchestrator (epic → stories → tasks)         │
│    ├─ Priority Scoring Engine (calculate task priorities)        │
│    ├─ Conflict Resolution Engine (prevent file collisions)       │
│    ├─ Sub-Agent Factory (create parallel sub-agents)             │
│    ├─ MCP Task Executor (infer and execute MCP tools)            │
│    ├─ Diagram Generator (mermaid diagrams)                       │
│    ├─ Auto-Index Generator (epic documentation)                  │
│    └─ Context Assembler (.context/ directory)                    │
│                                                                    │
│  Triggers: User conversation, epic-level requests                 │
│  Output: Complete epic execution plan with sub-agents             │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│         LAYER 2: WORKFLOW ORCHESTRATION                           │
│         (Epic Breakdown & Task Management)                        │
│                                                                    │
│  • Epic Workflow Orchestrator                                     │
│    ├─ Breaks epics into user stories                             │
│    ├─ Breaks user stories into tasks                             │
│    ├─ Calculates dependencies                                    │
│    ├─ Creates sub-agents for parallel execution                  │
│    └─ Manages epic lifecycle (pending → running → completed)     │
│                                                                    │
│  Triggers: Epic approved by Master Intelligence Orchestrator     │
│  Output: Task breakdown with priorities and dependencies         │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│         LAYER 3: AGENT COORDINATION                               │
│         (Proactive Agent Activation & Handoffs)                   │
│                                                                    │
│  • Proactive Agent Orchestrator                                   │
│    ├─ Monitors file changes (file watchers)                      │
│    ├─ Activates agents proactively                               │
│    ├─ Manages agent handoffs (Alex → Marcus → James → Maria)     │
│    ├─ Coordinates multi-agent collaboration                      │
│    └─ Tracks agent performance metrics                           │
│                                                                    │
│  Triggers: File saves, git events, slash commands                │
│  Output: Agent activation with context                           │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│         LAYER 4: EVENT-DRIVEN ORCHESTRATION                       │
│         (Real-Time File Watching & Event Processing)              │
│                                                                    │
│  • Event-Driven Orchestrator                                      │
│    ├─ File watchers (*.test.*, *.api.*, *.tsx, etc.)            │
│    ├─ Git event listeners (commits, PRs, issues)                 │
│    ├─ Emergency protocol triggers (urgent, critical, hotfix)     │
│    ├─ Quality gate enforcement (pre-commit, pre-deploy)          │
│    └─ Real-time statusline updates                               │
│                                                                    │
│  Triggers: File system events, git hooks, keywords               │
│  Output: Event routing to appropriate agent                      │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│         LAYER 5: INDIVIDUAL AGENTS                                │
│         (Domain-Specific Execution)                               │
│                                                                    │
│  • 6 OPERA Agents + 1 Meta-Agent + Dynamic Sub-Agents             │
│    ├─ Maria-QA: Test execution, quality validation               │
│    ├─ James-Frontend: UI implementation, accessibility           │
│    ├─ Marcus-Backend: API implementation, security               │
│    ├─ Sarah-PM: Documentation, project tracking                  │
│    ├─ Alex-BA: Requirements analysis, user stories               │
│    ├─ Dr.AI-ML: Model training, AI integration                   │
│    └─ Introspective Meta-Agent: Self-enhancement, monitoring     │
│                                                                    │
│  Triggers: Agent-specific file patterns, manual activation       │
│  Output: Code changes, test results, documentation               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Orchestration Flow Examples

### Example 1: Epic-Level Request
**User**: "Add OAuth2 authentication with Google and GitHub providers"

```
1. LAYER 1: Master Intelligence Orchestrator
   ├─ Epic Conversation Analyzer detects epic (score: 0.95)
   ├─ Mindset Context Engine validates against project vision
   │  └─ Result: Approved (aligns with security roadmap)
   ├─ PRD Feasibility Analyzer:
   │  ├─ Web Pattern Researcher: Finds 10 OAuth2 implementations
   │  ├─ Architecture Stress Tester: Simulates 10k users
   │  └─ Result: Go-ahead (95% confidence, 3.5/10 risk)
   ├─ Epic Workflow Orchestrator breaks down:
   │  ├─ Story 1: Backend OAuth2 implementation (3 tasks)
   │  ├─ Story 2: Frontend login UI (2 tasks)
   │  └─ Story 3: Integration testing (2 tasks)
   └─ Priority Scoring Engine calculates priorities (8.5/10 backend, 7.2/10 frontend)

2. LAYER 2: Epic Workflow Orchestrator
   ├─ Creates sub-agents for parallel execution:
   │  ├─ sub-marcus-1: OAuth2 endpoints (priority: 8.5)
   │  ├─ sub-marcus-2: JWT token service (priority: 8.3)
   │  ├─ sub-james-1: Login form component (priority: 7.2)
   │  └─ sub-maria-1: Integration tests (priority: 7.0)
   └─ Registers with Conflict Resolution Engine

3. LAYER 3: Proactive Agent Orchestrator
   ├─ Activates Marcus-Backend for sub-marcus-1
   ├─ Activates Marcus-Backend for sub-marcus-2 (parallel)
   ├─ Activates James-Frontend for sub-james-1 (parallel)
   └─ Waits for completion before Maria-QA

4. LAYER 4: Event-Driven Orchestrator
   ├─ Watches file changes (src/api/oauth.ts created)
   ├─ Triggers Maria-QA on test file creation
   └─ Updates statusline: "🤖 4 agents active │ 60% complete"

5. LAYER 5: Individual Agents Execute
   ├─ Marcus implements OAuth2 endpoints
   ├─ James creates login UI
   ├─ Maria validates with tests
   └─ Sarah updates documentation
```

**Result**: Complete OAuth2 implementation in ~15 minutes (vs 2 hours manual)

---

### Example 2: File Change Trigger
**User**: Saves `LoginForm.test.tsx`

```
1. LAYER 4: Event-Driven Orchestrator (Primary Entry Point)
   ├─ File watcher detects: *.test.tsx pattern
   ├─ Matches Maria-QA activation trigger
   └─ Routes to Layer 3

2. LAYER 3: Proactive Agent Orchestrator
   ├─ Activates Maria-QA agent
   ├─ Creates activation context:
   │  └─ { filePath: 'LoginForm.test.tsx', trigger: 'file-save' }
   └─ Borrows Maria instance from Agent Pool

3. LAYER 5: Maria-QA Executes
   ├─ Runs test suite
   ├─ Calculates coverage (85% - above 80% threshold ✅)
   ├─ Validates assertions
   └─ Returns results to Layer 3

4. LAYER 3: Proactive Agent Orchestrator
   ├─ Receives results from Maria
   ├─ Returns agent to pool
   └─ Updates statusline: "✅ Tests passed │ 85% coverage"
```

**Result**: Instant test validation (<2 seconds)

---

### Example 3: Emergency Protocol
**User**: Commits message with "hotfix: critical security vulnerability"

```
1. LAYER 4: Event-Driven Orchestrator
   ├─ Detects emergency keyword: "critical"
   ├─ Activates Emergency Response Protocol
   └─ Escalates to Layer 1

2. LAYER 1: Master Intelligence Orchestrator
   ├─ Maria-QA takes lead (P0 priority)
   ├─ Activates ALL relevant agents immediately
   ├─ Skips normal prioritization
   └─ Creates emergency task breakdown

3. LAYER 3: Proactive Agent Orchestrator
   ├─ Activates Maria-QA (lead)
   ├─ Activates Marcus-Backend (security fix)
   ├─ Activates Sarah-PM (stakeholder communication)
   └─ All agents run in parallel

4. LAYER 5: Agents Execute
   ├─ Marcus: Patches vulnerability
   ├─ Maria: Runs security scan + tests
   ├─ Sarah: Notifies stakeholders
   └─ All agents: Generate post-mortem report

5. LAYER 1: Master Intelligence Orchestrator
   ├─ Validates fix with stress test
   ├─ Stores incident learnings in RAG
   └─ Updates emergency response patterns
```

**Result**: Security fix deployed in ~10 minutes with full validation

---

## 🔗 Cross-Layer Communication

### Upward Communication (Layer 5 → Layer 1)
```typescript
// Agent reports completion to orchestrator
agent.emit('task:completed', {
  taskId: 'oauth-backend-123',
  success: true,
  artifacts: ['src/api/oauth.ts', 'src/services/jwt.ts']
});

// Proactive Agent Orchestrator (Layer 3) listens
proactiveOrchestrator.on('task:completed', (event) => {
  // Update epic progress
  epicWorkflowOrchestrator.updateTaskStatus(event.taskId, 'completed');

  // Trigger dependent tasks
  if (allDependenciesComplete(event.taskId)) {
    epicWorkflowOrchestrator.startDependentTasks(event.taskId);
  }
});
```

### Downward Communication (Layer 1 → Layer 5)
```typescript
// Master Intelligence Orchestrator creates work
const epic = await masterIntelligenceOrchestrator.processEpicRequest(userMessage);

// Epic Workflow Orchestrator (Layer 2) breaks down
const breakdown = await epicWorkflowOrchestrator.breakdownEpic(epic);

// Proactive Agent Orchestrator (Layer 3) activates agents
for (const task of breakdown.tasks) {
  await proactiveOrchestrator.activateAgent(task.agentType, task);
}
```

### Lateral Communication (Same Layer)
```typescript
// Conflict Resolution Engine (Layer 1) coordinates
await conflictResolutionEngine.registerAgent({
  id: 'sub-marcus-1',
  files: ['src/api/auth.ts']
});

// Sub-Agent Factory (Layer 1) checks conflicts
const hasConflict = await conflictResolutionEngine.checkFileConflicts('src/api/auth.ts');

if (hasConflict) {
  // Wait for sync window (30 seconds)
  await conflictResolutionEngine.waitForSyncWindow();
}
```

---

## 📋 Orchestrator Responsibilities

### Layer 1: Master Intelligence Orchestrator
**File**: `src/orchestration/master-intelligence-orchestrator.ts`

**Responsibilities**:
- Epic detection and validation
- Mindset alignment checking
- Web research and stress testing orchestration
- Epic breakdown coordination
- Priority calculation
- Conflict prevention
- Sub-agent creation
- MCP tool inference and execution
- Documentation generation

**Entry Points**:
- User conversation (epic requests)
- Manual epic submission
- Scheduled health checks (Rule 3)

**Exit Points**:
- Complete epic execution plan
- Sub-agents created and ready
- Documentation generated

---

### Layer 2: Epic Workflow Orchestrator
**File**: `src/orchestration/epic-workflow-orchestrator.ts`

**Responsibilities**:
- Epic lifecycle management (pending → running → completed)
- Epic → User Stories → Tasks breakdown
- Dependency graph calculation
- Task parallelization planning
- Progress tracking
- Milestone management

**Entry Points**:
- Approved epic from Layer 1
- Manual epic breakdown requests

**Exit Points**:
- Task list with priorities and dependencies
- Sub-agent creation requests to Layer 1

---

### Layer 3: Proactive Agent Orchestrator
**File**: `src/orchestration/proactive-agent-orchestrator.ts`

**Responsibilities**:
- Agent activation (proactive and on-demand)
- Agent handoff coordination (Alex → Marcus → James → Maria)
- Context preservation across agents
- Agent performance monitoring
- Agent pool management
- Statusline updates

**Entry Points**:
- File change events from Layer 4
- Task assignments from Layer 2
- Manual agent activation (slash commands)
- Emergency escalations from Layer 4

**Exit Points**:
- Agent execution results
- Agent performance metrics
- Handoff context to next agent

---

### Layer 4: Event-Driven Orchestrator
**File**: `src/orchestration/event-driven-orchestrator.ts`

**Responsibilities**:
- File system watching (chokidar)
- Git event listening (hooks, webhooks)
- Emergency keyword detection
- Quality gate enforcement
- Real-time event routing
- Statusline integration

**Entry Points**:
- File system events (file save, create, delete)
- Git events (commit, push, PR)
- Emergency keywords (urgent, critical, hotfix)
- Quality gate checkpoints (pre-commit, pre-deploy)

**Exit Points**:
- Agent activation requests to Layer 3
- Emergency escalations to Layer 1
- Quality gate validation results

---

### Layer 5: Individual Agents
**Files**: `src/agents/enhanced-{maria|james|marcus}.ts`, etc.

**Responsibilities**:
- Domain-specific code execution
- Test execution and validation
- Code review and quality checks
- Documentation updates
- RAG-based context storage and retrieval

**Entry Points**:
- Activation context from Layer 3
- Manual execution (slash commands)
- Sub-agent task assignment from Layer 1

**Exit Points**:
- Code changes (git commits)
- Test results
- Quality validation results
- Documentation updates
- RAG memories stored

---

## 🚨 Special Orchestration Modes

### Parallel Task Execution Mode (Rule 1)
**Activated by**: Multiple independent tasks in epic breakdown

```typescript
// Layer 2: Epic Workflow Orchestrator identifies parallel tasks
const parallelTasks = [
  { id: 'oauth-backend', agent: 'marcus-backend', dependencies: [] },
  { id: 'jwt-service', agent: 'marcus-backend', dependencies: [] },
  { id: 'login-ui', agent: 'james-frontend', dependencies: [] }
];

// Layer 1: Sub-Agent Factory creates parallel sub-agents
for (const task of parallelTasks) {
  await subAgentFactory.createSubAgent({
    type: task.agent,
    task,
    epicId: 'epic-oauth-123',
    priority: task.priority
  });
}

// All sub-agents execute in parallel (Rule 1)
await Promise.all(
  parallelTasks.map(task =>
    subAgentFactory.executeTask(task.id)
  )
);
```

---

### Emergency Response Mode
**Activated by**: Keywords (urgent, critical, emergency, hotfix) or system alerts

```typescript
// Layer 4: Event-Driven Orchestrator detects emergency
if (commitMessage.includes('critical') || commitMessage.includes('hotfix')) {
  // Escalate to Layer 1
  await masterIntelligenceOrchestrator.activateEmergencyProtocol({
    severity: 'P0',
    trigger: commitMessage,
    timestamp: Date.now()
  });

  // Maria-QA takes lead
  await proactiveOrchestrator.activateAgent('maria-qa', {
    emergency: true,
    urgency: 'emergency'
  });

  // Activate all relevant agents in parallel
  const relevantAgents = determineRelevantAgents(commitMessage);
  await Promise.all(
    relevantAgents.map(agent =>
      proactiveOrchestrator.activateAgent(agent, { emergency: true })
    )
  );
}
```

---

### Self-Enhancement Mode
**Activated by**: Introspective Meta-Agent (continuous background)

```typescript
// Layer 1: Introspective Meta-Agent monitors system
setInterval(async () => {
  const insights = await introspectiveMetaAgent.analyzeSystem();

  if (insights.criticalIssues.length > 0) {
    // Trigger self-enhancement loop
    await masterIntelligenceOrchestrator.runSelfEnhancementCycle(insights);

    // Re-validate after enhancements
    const validationResult = await introspectiveMetaAgent.validate();

    if (!validationResult.success) {
      // Rollback enhancements
      await masterIntelligenceOrchestrator.rollbackEnhancements();
    }
  }
}, 30000); // Every 30 seconds
```

---

## 📊 Orchestration Performance Metrics

### Layer 1 Metrics (Master Intelligence Orchestrator)
```yaml
Epic_Detection:
  - Accuracy: >= 95%
  - False Positives: < 5%
  - Processing Time: < 2 seconds

Feasibility_Analysis:
  - Web Research Time: < 10 seconds
  - Stress Test Time: < 30 seconds
  - Total Analysis Time: < 60 seconds

Epic_Breakdown:
  - Stories per Epic: 3-7 (average: 4.5)
  - Tasks per Story: 2-5 (average: 3.2)
  - Breakdown Time: < 5 seconds
```

### Layer 2 Metrics (Epic Workflow Orchestrator)
```yaml
Task_Management:
  - Dependency Calculation Time: < 1 second
  - Parallel Task Identification: < 500ms
  - Progress Tracking Overhead: < 100ms

Epic_Lifecycle:
  - Average Epic Duration: 15-30 minutes
  - Success Rate: >= 95%
  - Task Completion Rate: >= 98%
```

### Layer 3 Metrics (Proactive Agent Orchestrator)
```yaml
Agent_Activation:
  - Warm Agent Allocation: < 500ms
  - Cold Agent Allocation: < 2 seconds
  - Context Handoff Time: < 1 second

Agent_Coordination:
  - Handoff Success Rate: >= 99%
  - Context Loss Rate: < 1%
  - Agent Switch Time: < 2 seconds
```

### Layer 4 Metrics (Event-Driven Orchestrator)
```yaml
Event_Processing:
  - File Change Detection: < 100ms
  - Event Routing Time: < 200ms
  - Emergency Detection Time: < 50ms

Quality_Gates:
  - Pre-Commit Validation: < 5 seconds
  - Pre-Deploy Validation: < 30 seconds
  - Gate Failure Rate: < 5%
```

### Layer 5 Metrics (Individual Agents)
```yaml
Agent_Execution:
  - Average Task Duration: < 30 seconds
  - Code Quality Score: >= 8.5/10
  - Test Coverage: >= 80%
  - Task Success Rate: >= 95%
```

---

## 🔧 Configuration

### Enable/Disable Orchestrators
```typescript
// config/orchestration.ts
export const ORCHESTRATION_CONFIG = {
  masterIntelligence: {
    enabled: true,
    epicDetectionThreshold: 0.8
  },
  epicWorkflow: {
    enabled: true,
    maxParallelTasks: 10
  },
  proactiveAgent: {
    enabled: true,
    enableFileWatchers: true
  },
  eventDriven: {
    enabled: true,
    emergencyKeywords: ['urgent', 'critical', 'hotfix', 'emergency']
  }
};
```

---

## 📚 Related Documentation

- **Agent Architecture**: `docs/AGENT_ARCHITECTURE.md`
- **Core Methodology**: `CLAUDE.md`
- **Agent Details**: `.claude/AGENTS.md`
- **5-Rule System**: `.claude/rules/README.md`
- **Production Readiness**: `docs/PRODUCTION_READINESS_GAP_ANALYSIS.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-08
**Total Orchestrators**: 10 (5 active layers + 5 specialized)
**Hierarchy Depth**: 5 layers
**Primary Entry Points**: Layer 1 (epics), Layer 4 (file changes)
