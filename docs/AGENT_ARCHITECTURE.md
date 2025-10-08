# VERSATIL SDLC Framework - Agent Architecture

**Version**: 2.0
**Last Updated**: 2025-10-08
**Status**: Production Ready

---

## 🎯 Architecture Overview

The VERSATIL framework uses a **3-tier agent architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER 1: META-AGENTS                       │
│              (Self-Enhancement & Monitoring)                  │
│                                                               │
│  • Introspective Meta-Agent (system-wide optimization)       │
│    └─ Monitors all agents, orchestrators, and RAG            │
│    └─ Implements self-enhancement loop                       │
│    └─ Triggers validation cycles                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   TIER 2: OPERA AGENTS                       │
│           (Domain Experts - 6 Primary Agents)                │
│                                                               │
│  1. Maria-QA          (Quality Assurance Lead)               │
│  2. James-Frontend     (UI/UX Specialist)                     │
│     ├─ Accessibility Guardian (WCAG compliance)              │
│     ├─ Design Implementation Engine (Figma → Code)           │
│     ├─ Performance Optimizer (Core Web Vitals)               │
│     └─ Component Orchestrator (State management)             │
│  3. Marcus-Backend    (System Architect)                     │
│  4. Sarah-PM          (Project Manager)                      │
│  5. Alex-BA           (Business Analyst)                     │
│  6. Dr.AI-ML          (AI/ML Specialist)                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   TIER 3: SUB-AGENTS                         │
│           (Dynamic Task Executors - Created on Demand)       │
│                                                               │
│  • Created by Sub-Agent Factory                              │
│  • Specialized for parallel task execution                   │
│  • Examples:                                                 │
│     - sub-marcus-1: Backend auth API implementation          │
│     - sub-james-2: Frontend login form component             │
│     - sub-maria-3: Integration test suite                    │
│                                                               │
│  • Lifecycle:                                                │
│     1. Created by Sub-Agent Factory                          │
│     2. Borrows agent instance from Agent Pool                │
│     3. Executes task                                         │
│     4. Returns agent to pool                                 │
│     5. Self-destructs after completion                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

### Primary OPERA Agents
```
src/agents/
├── enhanced-maria.ts          (25,988 lines) - QA Lead
├── enhanced-james.ts          (21,151 lines) - Frontend Specialist
│   └── james-frontend/        (4 sub-agents, 134,850 lines total)
│       ├── autonomous-accessibility-guardian.ts  (42,967 lines)
│       ├── design-implementation-engine.ts       (17,059 lines)
│       ├── intelligent-performance-optimizer.ts  (29,818 lines)
│       └── smart-component-orchestrator.ts       (45,006 lines)
├── enhanced-marcus.ts         (21,534 lines) - Backend Architect
├── sarah-pm.ts                ( 7,558 lines) - Project Manager
├── alex-ba.ts                 ( 9,515 lines) - Business Analyst
└── dr-ai-ml.ts                (10,560 lines) - AI/ML Specialist
```

### Meta-Agents (Self-Enhancement)
```
src/agents/
├── introspective-agent.ts     (20,588 lines) - Main introspective agent
└── meta/
    └── introspective-meta-agent.ts (36,902 lines) - System-wide monitor
└── introspective/
    ├── enhanced-introspective-agent.ts      (43,527 lines)
    ├── full-context-introspective-agent.ts  (18,804 lines)
    └── introspective-agent.ts               (13,982 lines)
```

### Infrastructure
```
src/agents/
├── base-agent.ts              (12,918 lines) - Abstract base class
├── rag-enabled-agent.ts       (20,279 lines) - RAG integration layer
├── agent-pool.ts              (12,503 lines) - Agent pooling (50% faster activation)
├── sub-agent-factory.ts       (16,566 lines) - Dynamic sub-agent creation
└── agent-registry.ts          ( 5,990 lines) - Agent registration & discovery
```

---

## 🔄 Agent Lifecycle

### OPERA Agents (Persistent)
```typescript
// 1. Initialization (on framework start)
await globalAgentPool.initialize();
// Pre-warms 3 instances of each agent type

// 2. Activation (on file change or explicit trigger)
const agent = await globalAgentPool.getAgent('maria-qa');
await agent.execute(context);

// 3. Release (after execution)
await globalAgentPool.releaseAgent(agent);
// Agent returned to pool for reuse
```

### Sub-Agents (Ephemeral)
```typescript
// 1. Creation (dynamic, on demand)
const subAgent = await subAgentFactory.createSubAgent({
  type: 'marcus-backend',
  task: { id: 'auth-api', title: 'Implement OAuth2 flow' },
  epicId: 'epic-123',
  priority: 8.5
});

// 2. Execution
await subAgentFactory.executeTask(subAgent.id);
// Borrows 'marcus-backend' from agent pool
// Executes task
// Returns agent to pool

// 3. Cleanup (automatic after completion)
// Sub-agent self-destructs, releases resources
```

### Meta-Agents (Always Active)
```typescript
// 1. Initialization (on framework start)
const metaAgent = new IntrospectiveMetaAgent();
await metaAgent.initialize();

// 2. Continuous Monitoring (background)
setInterval(async () => {
  await metaAgent.monitorSystem();
}, 30000); // Every 30 seconds

// 3. Self-Enhancement (triggered by issues)
const insights = await metaAgent.analyze();
if (insights.criticalIssues.length > 0) {
  await metaAgent.applySelfEnhancements(insights);
}
```

---

## 🤝 Agent Collaboration Patterns

### Pattern 1: Sequential Handoff
```
Alex-BA → Marcus-Backend → James-Frontend → Maria-QA

Example: "Add user authentication"
1. Alex-BA: Creates user stories, defines acceptance criteria
2. Marcus: Implements backend auth API, JWT tokens
3. James: Creates login UI components
4. Maria: Validates with integration tests
```

### Pattern 2: Parallel Execution (via Sub-Agents)
```
Epic: "Implement OAuth2 Authentication"
├── sub-marcus-1: Backend OAuth endpoints  (parallel)
├── sub-marcus-2: JWT token service        (parallel)
├── sub-james-1: Login form component      (parallel)
├── sub-james-2: Auth state management     (parallel)
└── sub-maria-1: Integration test suite    (waits for above)
```

### Pattern 3: Meta-Agent Supervision
```
Introspective Meta-Agent (watches all agents)
├── Detects: Marcus and James modifying same file
├── Action: Triggers Conflict Resolution Engine
└── Result: Priority-based resolution (Marcus wins, James waits)
```

---

## 🛡️ Conflict Prevention & Resolution

### File Collision Detection
```typescript
// Automatic detection via Conflict Resolution Engine
await conflictResolutionEngine.registerAgent({
  id: 'sub-marcus-1',
  type: 'marcus-backend',
  files: ['src/api/auth.ts'],  // File being modified
  priority: 8.5
});

// If collision detected:
// 1. Compare priorities
// 2. Higher priority agent proceeds
// 3. Lower priority agent waits (30-second sync cycle)
// 4. Retry after sync window
```

### Resource Exhaustion Prevention
```typescript
// Agent Pool Capacity Limits
const MAX_SUBAGENTS_PER_TYPE = {
  'marcus-backend': 5,   // Max 5 Marcus sub-agents
  'james-frontend': 5,   // Max 5 James sub-agents
  'maria-qa': 3,         // Max 3 Maria sub-agents
  'sarah-pm': 2,
  'alex-ba': 2,
  'dr-ai-ml': 2
};

// If capacity reached:
// Task is queued
// Sub-agent created after slot available
```

---

## 📊 Agent Communication Protocol

### RAG-Based Context Sharing
```typescript
// Agent 1 stores context in RAG
await vectorMemoryStore.storeMemory({
  content: 'Implemented OAuth2 flow with JWT tokens',
  contentType: 'handoff',
  metadata: {
    agentId: 'marcus-backend',
    handoffTo: 'james-frontend',
    taskId: 'auth-123',
    tags: ['oauth', 'authentication', 'api']
  }
});

// Agent 2 retrieves context
const context = await vectorMemoryStore.queryMemory(
  'oauth authentication implementation',
  'handoff',
  5
);
```

### Event-Driven Coordination
```typescript
// Agent emits event
subAgentFactory.emit('task:completed', {
  agentId: 'sub-marcus-1',
  taskId: 'auth-api',
  duration: 15000 // 15 seconds
});

// Other agents listen
subAgentFactory.on('task:completed', async (event) => {
  if (event.taskId === 'auth-api') {
    // James can now start UI work
    await jamesFrontend.execute(uiTaskContext);
  }
});
```

---

## 🔬 Self-Enhancement Loop (Meta-Agent)

### Overview
The Introspective Meta-Agent implements a continuous self-enhancement loop:

```
┌──────────────────────────────────────────────────────────┐
│  1. MONITOR                                               │
│     • Track all agent activities                         │
│     • Collect performance metrics                        │
│     • Detect patterns and anomalies                      │
└───────────────────┬──────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  2. ANALYZE                                               │
│     • Identify inefficiencies                            │
│     • Calculate confidence scores                        │
│     • Generate improvement recommendations               │
└───────────────────┬──────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  3. VALIDATE (Direct Validation)                         │
│     • Run framework health checks                        │
│     • Verify agent consistency                           │
│     • Detect configuration issues                        │
└───────────────────┬──────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  4. ENHANCE (Auto-Fix)                                    │
│     • Apply fixes with confidence > 0.8                  │
│     • Update agent configurations                        │
│     • Optimize orchestrator routing                      │
└───────────────────┬──────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  5. RE-VALIDATE (Direct Validation)                      │
│     • Verify enhancements succeeded                      │
│     • Rollback if validation fails                       │
│     • Store learnings in RAG                             │
└───────────────────┬──────────────────────────────────────┘
                    ↓
                 Loop continues every 30 seconds
```

### Implementation Status
- ✅ **Monitor**: Implemented in `introspective-meta-agent.ts`
- ✅ **Analyze**: Implemented with system insights
- ⚠️ **Validate**: Partial (needs direct validation integration)
- ⚠️ **Enhance**: Partial (needs auto-fix implementation)
- ❌ **Re-Validate**: Not yet implemented

---

## 📈 Agent Performance Metrics

### OPERA Agent KPIs
```yaml
Performance_Targets:
  - Agent Switch Time: < 2 seconds
  - Context Accuracy: >= 99.9%
  - Task Completion Rate: >= 95%
  - Code Quality Score: >= 8.5/10
  - Proactive Activation Success: >= 90%

Agent_Pool_Efficiency:
  - Pool Hit Rate: >= 85% (warm agent available)
  - Pool Miss Rate: <= 15% (cold start required)
  - Average Allocation Time: < 500ms (warm), < 2s (cold)

Sub-Agent_Metrics:
  - Creation Time: < 1 second
  - Cleanup Time: < 500ms
  - Max Concurrent Sub-Agents: 19 (sum of all type limits)
  - Average Task Duration: < 30 seconds
```

### Meta-Agent KPIs
```yaml
Self_Enhancement_Metrics:
  - Monitoring Frequency: Every 30 seconds
  - Analysis Accuracy: >= 95%
  - Auto-Fix Success Rate: >= 90%
  - Rollback Rate: < 5%
  - System Health Score: >= 90/100
```

---

## 🚨 Troubleshooting

### Issue: Agent Not Activating
```bash
# Check agent pool status
npm run agent-pool:status

# Verify agent registration
npm run agent-pool:list

# Force agent warm-up
npm run agent-pool:warmup maria-qa
```

### Issue: Sub-Agent Creation Failing
```bash
# Check capacity limits
npm run sub-agent:capacity

# View active sub-agents
npm run sub-agent:list

# Clear zombie sub-agents
npm run sub-agent:cleanup
```

### Issue: Self-Enhancement Loop Stalled
```bash
# Check meta-agent status
npm run meta-agent:status

# Trigger manual introspection
npm run meta-agent:analyze

# View enhancement history
npm run meta-agent:history
```

---

## 🔧 Configuration

### Enable/Disable Agents
```typescript
// src/agents/agent-registry.ts
const ENABLED_AGENTS = {
  'maria-qa': true,
  'james-frontend': true,
  'marcus-backend': true,
  'sarah-pm': true,
  'alex-ba': true,
  'dr-ai-ml': true,
  'introspective-meta-agent': true
};
```

### Adjust Agent Pool Size
```typescript
// src/agents/agent-pool.ts
const AGENT_POOL_CONFIG = {
  poolSize: 3,           // Instances per agent type
  enableAdaptive: true,  // Auto-scale based on demand
  minPoolSize: 1,
  maxPoolSize: 10
};
```

### Adjust Sub-Agent Limits
```typescript
// src/agents/sub-agent-factory.ts
const MAX_SUBAGENTS_PER_TYPE = {
  'marcus-backend': 5,  // Increase for more parallelism
  'james-frontend': 5,
  'maria-qa': 3,
  'sarah-pm': 2,
  'alex-ba': 2,
  'dr-ai-ml': 2
};
```

---

## 📚 Related Documentation

- **Core Methodology**: `CLAUDE.md`
- **Agent Details**: `.claude/AGENTS.md`
- **Orchestration**: `docs/ORCHESTRATION_HIERARCHY.md`
- **5-Rule System**: `.claude/rules/README.md`
- **RAG Integration**: `docs/features/rag-memory.md`
- **Production Readiness**: `docs/PRODUCTION_READINESS_GAP_ANALYSIS.md`

---

**Document Version**: 1.0
**Cleanup Date**: 2025-10-08
**Duplicates Removed**: 5 (introspective-agent-old, architecture-dan, devops-dan, security-sam, simulation-qa)
**Total Agent Count**: 7 (6 OPERA + 1 Meta) + Dynamic Sub-Agents
