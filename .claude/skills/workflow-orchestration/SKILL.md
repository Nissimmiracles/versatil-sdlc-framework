---
name: workflow-orchestration
description: Multi-agent workflows, handoff patterns, state management. Use when coordinating multiple agents, implementing handoff protocols, managing workflow state, or building complex multi-step agent systems. Covers OPERA methodology, agent contracts, state persistence, and error recovery. Enables 3x faster multi-agent development.
---

# Workflow Orchestration

## Overview

Multi-agent workflow orchestration using OPERA (Orchestration Protocol for Engineering and Research Agents) methodology. Covers agent handoffs, state management, contract validation, and error recovery for complex multi-agent systems.

**Goal**: Build reliable multi-agent workflows with 95%+ handoff success rate and complete state recovery

## When to Use This Skill

Use this skill when:
- Coordinating multiple OPERA agents (Alex-BA, Marcus-Backend, James-Frontend, etc.)
- Implementing agent handoff protocols
- Managing workflow state across agents
- Building complex multi-step workflows (planning → implementation → testing)
- Creating custom agent orchestration patterns
- Debugging agent handoff failures
- Implementing workflow error recovery

**Triggers**: "agent handoff", "workflow orchestration", "OPERA", "multi-agent", "agent coordination", "state management", "handoff contract"

---

## Quick Start: Workflow Pattern Decision Tree

### Choosing the Right Orchestration Pattern

**Sequential Handoff** (Agent A → Agent B → Agent C):
- ✅ Linear workflow with clear dependencies
- ✅ Each agent depends on previous output
- ✅ Example: Plan (Sarah-PM) → Design (James-Frontend) → Implement (Marcus-Backend)
- ✅ Best for: Feature development, documentation flows

**Parallel Execution** (Multiple agents simultaneously):
- ✅ Independent tasks that can run concurrently
- ✅ Results merged at the end
- ✅ Example: Frontend (James) + Backend (Marcus) + Database (Dana) in parallel
- ✅ Best for: Full-stack features, large refactors

**Conditional Routing** (If/else agent selection):
- ✅ Agent selection based on context
- ✅ Example: If frontend → James, If backend → Marcus, If ML → Dr.AI-ML
- ✅ Best for: Auto-routing based on file types, adaptive workflows

**Feedback Loop** (Agent A → Agent B → back to Agent A):
- ✅ Iterative refinement needed
- ✅ Example: Maria-QA finds issues → Marcus fixes → Maria re-validates
- ✅ Best for: Quality assurance, code review cycles

**Hub-and-Spoke** (Coordinator → Multiple specialists):
- ✅ Central coordinator delegates to specialists
- ✅ Example: Sarah-PM coordinates Alex-BA + Marcus + James + Maria
- ✅ Best for: Complex projects, project management

---

## OPERA Handoff Protocol

### 1. Handoff Contract Schema

```typescript
// orchestration/contracts/handoff-contract.ts
import { z } from 'zod';

/**
 * Standard OPERA handoff contract
 * All agent handoffs must conform to this schema
 */
export const HandoffContractSchema = z.object({
  // Handoff metadata
  handoff_id: z.string().uuid(),
  timestamp: z.string().datetime(),

  // Source agent
  from_agent: z.object({
    name: z.enum([
      'alex-ba',
      'marcus-backend',
      'james-frontend',
      'dana-database',
      'maria-qa',
      'dr-ai-ml',
      'sarah-pm',
      'oliver-mcp'
    ]),
    version: z.string(),
    phase: z.enum(['PLAN', 'DESIGN', 'BUILD', 'TEST', 'DEPLOY', 'CODIFY'])
  }),

  // Target agent
  to_agent: z.object({
    name: z.string(),
    required_capabilities: z.array(z.string()).optional(),
    priority: z.enum(['p0', 'p1', 'p2', 'p3']).default('p1')
  }),

  // Handoff payload
  payload: z.object({
    // Context from previous work
    context: z.object({
      feature_description: z.string(),
      previous_decisions: z.array(z.string()).optional(),
      constraints: z.array(z.string()).optional(),
      dependencies: z.array(z.string()).optional()
    }),

    // Work artifacts
    artifacts: z.array(z.object({
      type: z.enum(['code', 'design', 'documentation', 'test', 'data']),
      path: z.string(),
      description: z.string(),
      format: z.string().optional()
    })).optional(),

    // Expected output
    expected_output: z.object({
      deliverables: z.array(z.string()),
      acceptance_criteria: z.array(z.string()),
      estimated_effort_hours: z.number().optional()
    }),

    // Continuation conditions
    on_success: z.object({
      next_agent: z.string().optional(),
      action: z.enum(['handoff', 'complete', 'loop'])
    }),

    on_failure: z.object({
      retry_strategy: z.enum(['retry', 'rollback', 'escalate']),
      fallback_agent: z.string().optional(),
      max_retries: z.number().default(3)
    })
  }),

  // State management
  state: z.object({
    workflow_id: z.string(),
    current_phase: z.string(),
    completed_phases: z.array(z.string()),
    shared_memory: z.record(z.any()).optional()
  })
});

export type HandoffContract = z.infer<typeof HandoffContractSchema>;
```

### 2. Handoff Manager

```typescript
// orchestration/handoff-manager.ts
import { HandoffContract, HandoffContractSchema } from './contracts/handoff-contract.js';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';

export class HandoffManager {
  private stateDir: string;

  constructor(stateDir: string = '.versatil/state') {
    this.stateDir = stateDir;
  }

  /**
   * Create a new handoff contract
   */
  async createHandoff(params: {
    fromAgent: string;
    toAgent: string;
    context: any;
    expectedOutput: any;
    workflowId: string;
  }): Promise<HandoffContract> {
    const contract: HandoffContract = {
      handoff_id: uuidv4(),
      timestamp: new Date().toISOString(),

      from_agent: {
        name: params.fromAgent as any,
        version: '1.0.0',
        phase: this.detectPhase(params.fromAgent)
      },

      to_agent: {
        name: params.toAgent,
        priority: 'p1'
      },

      payload: {
        context: params.context,
        expected_output: params.expectedOutput,
        on_success: { action: 'handoff' },
        on_failure: { retry_strategy: 'retry', max_retries: 3 }
      },

      state: {
        workflow_id: params.workflowId,
        current_phase: this.detectPhase(params.fromAgent),
        completed_phases: []
      }
    };

    // Validate contract
    HandoffContractSchema.parse(contract);

    // Persist to disk
    await this.saveHandoff(contract);

    console.log(`✅ Handoff created: ${params.fromAgent} → ${params.toAgent}`);
    return contract;
  }

  /**
   * Execute handoff to target agent
   */
  async executeHandoff(contract: HandoffContract): Promise<void> {
    console.log(`🔄 Executing handoff: ${contract.from_agent.name} → ${contract.to_agent.name}`);

    // Load target agent
    const agent = await this.loadAgent(contract.to_agent.name);

    // Pass contract to agent
    try {
      await agent.execute(contract);

      // Update state on success
      await this.updateHandoffStatus(contract.handoff_id, 'completed');

      // Handle on_success action
      if (contract.payload.on_success.next_agent) {
        await this.createHandoff({
          fromAgent: contract.to_agent.name,
          toAgent: contract.payload.on_success.next_agent,
          context: { ...contract.payload.context },
          expectedOutput: contract.payload.expected_output,
          workflowId: contract.state.workflow_id
        });
      }

    } catch (error) {
      console.error(`❌ Handoff failed: ${error.message}`);

      // Handle on_failure strategy
      await this.handleFailure(contract, error);
    }
  }

  /**
   * Handle handoff failure
   */
  private async handleFailure(contract: HandoffContract, error: Error): Promise<void> {
    const { retry_strategy, max_retries, fallback_agent } = contract.payload.on_failure;

    // Check retry count
    const retryCount = await this.getRetryCount(contract.handoff_id);

    if (retry_strategy === 'retry' && retryCount < max_retries) {
      console.log(`🔄 Retrying handoff (attempt ${retryCount + 1}/${max_retries})`);
      await this.incrementRetryCount(contract.handoff_id);
      await this.executeHandoff(contract);

    } else if (retry_strategy === 'rollback') {
      console.log('↩️ Rolling back to previous agent');
      await this.rollbackToPreviousAgent(contract);

    } else if (retry_strategy === 'escalate' && fallback_agent) {
      console.log(`⬆️ Escalating to fallback agent: ${fallback_agent}`);
      contract.to_agent.name = fallback_agent;
      await this.executeHandoff(contract);

    } else {
      // Final failure
      await this.updateHandoffStatus(contract.handoff_id, 'failed');
      throw new Error(`Handoff failed after ${retryCount} retries: ${error.message}`);
    }
  }

  /**
   * Detect phase from agent name
   */
  private detectPhase(agentName: string): 'PLAN' | 'DESIGN' | 'BUILD' | 'TEST' | 'DEPLOY' | 'CODIFY' {
    const phaseMap: Record<string, any> = {
      'sarah-pm': 'PLAN',
      'alex-ba': 'PLAN',
      'james-frontend': 'BUILD',
      'marcus-backend': 'BUILD',
      'dana-database': 'BUILD',
      'maria-qa': 'TEST',
      'oliver-mcp': 'DEPLOY'
    };
    return phaseMap[agentName] || 'BUILD';
  }

  /**
   * Save handoff to disk
   */
  private async saveHandoff(contract: HandoffContract): Promise<void> {
    const filePath = path.join(this.stateDir, 'handoffs', `${contract.handoff_id}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(contract, null, 2));
  }

  /**
   * Load agent by name
   */
  private async loadAgent(agentName: string): Promise<any> {
    // Load agent definition from .claude/agents/{agentName}.md
    const agentPath = path.join('.claude', 'agents', `${agentName}.md`);
    const agentDef = await fs.readFile(agentPath, 'utf-8');

    // Return agent interface
    return {
      name: agentName,
      execute: async (contract: HandoffContract) => {
        // Agent execution logic
        console.log(`Executing agent: ${agentName}`);
      }
    };
  }

  private async updateHandoffStatus(handoffId: string, status: string): Promise<void> {
    // Implementation
  }

  private async getRetryCount(handoffId: string): Promise<number> {
    // Implementation
    return 0;
  }

  private async incrementRetryCount(handoffId: string): Promise<void> {
    // Implementation
  }

  private async rollbackToPreviousAgent(contract: HandoffContract): Promise<void> {
    // Implementation
  }
}

// Usage
const manager = new HandoffManager();

const handoff = await manager.createHandoff({
  fromAgent: 'sarah-pm',
  toAgent: 'marcus-backend',
  context: {
    feature_description: 'Add user authentication API',
    constraints: ['Use JWT tokens', 'OAuth2 support']
  },
  expectedOutput: {
    deliverables: ['auth-api.ts', 'auth.test.ts'],
    acceptance_criteria: ['80%+ test coverage', 'Security audit passed']
  },
  workflowId: 'workflow-123'
});

await manager.executeHandoff(handoff);
```

---

## Workflow State Management

### Persistent State Store

```typescript
// orchestration/state/workflow-state.ts
import { promises as fs } from 'fs';
import path from 'path';

export interface WorkflowState {
  workflow_id: string;
  started_at: string;
  updated_at: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  // Workflow definition
  workflow: {
    name: string;
    phases: string[];
    current_phase: string;
    completed_phases: string[];
  };

  // Agents involved
  agents: {
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    started_at?: string;
    completed_at?: string;
  }[];

  // Shared memory (cross-agent data)
  memory: Record<string, any>;

  // Artifacts produced
  artifacts: {
    agent: string;
    type: string;
    path: string;
    created_at: string;
  }[];
}

export class WorkflowStateManager {
  private stateDir: string;

  constructor(stateDir: string = '.versatil/state/workflows') {
    this.stateDir = stateDir;
  }

  /**
   * Create new workflow state
   */
  async createWorkflow(params: {
    name: string;
    phases: string[];
  }): Promise<WorkflowState> {
    const workflowId = `workflow-${Date.now()}`;

    const state: WorkflowState = {
      workflow_id: workflowId,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',

      workflow: {
        name: params.name,
        phases: params.phases,
        current_phase: params.phases[0],
        completed_phases: []
      },

      agents: [],
      memory: {},
      artifacts: []
    };

    await this.saveState(state);
    return state;
  }

  /**
   * Update workflow state
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<WorkflowState>
  ): Promise<WorkflowState> {
    const state = await this.loadState(workflowId);

    const updatedState = {
      ...state,
      ...updates,
      updated_at: new Date().toISOString()
    };

    await this.saveState(updatedState);
    return updatedState;
  }

  /**
   * Store value in shared memory
   */
  async setMemory(
    workflowId: string,
    key: string,
    value: any
  ): Promise<void> {
    const state = await this.loadState(workflowId);
    state.memory[key] = value;
    await this.saveState(state);
  }

  /**
   * Retrieve value from shared memory
   */
  async getMemory(workflowId: string, key: string): Promise<any> {
    const state = await this.loadState(workflowId);
    return state.memory[key];
  }

  /**
   * Add artifact to workflow
   */
  async addArtifact(
    workflowId: string,
    artifact: { agent: string; type: string; path: string }
  ): Promise<void> {
    const state = await this.loadState(workflowId);

    state.artifacts.push({
      ...artifact,
      created_at: new Date().toISOString()
    });

    await this.saveState(state);
  }

  /**
   * Mark phase as complete
   */
  async completePhase(workflowId: string, phase: string): Promise<void> {
    const state = await this.loadState(workflowId);

    state.workflow.completed_phases.push(phase);

    // Move to next phase
    const currentIndex = state.workflow.phases.indexOf(phase);
    if (currentIndex < state.workflow.phases.length - 1) {
      state.workflow.current_phase = state.workflow.phases[currentIndex + 1];
    } else {
      // All phases complete
      state.status = 'completed';
    }

    await this.saveState(state);
  }

  private async saveState(state: WorkflowState): Promise<void> {
    const filePath = path.join(this.stateDir, `${state.workflow_id}.json`);
    await fs.mkdir(this.stateDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(state, null, 2));
  }

  private async loadState(workflowId: string): Promise<WorkflowState> {
    const filePath = path.join(this.stateDir, `${workflowId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
}

// Usage
const stateManager = new WorkflowStateManager();

// Create workflow
const workflow = await stateManager.createWorkflow({
  name: 'user-auth-feature',
  phases: ['PLAN', 'BUILD', 'TEST', 'DEPLOY']
});

// Store shared data
await stateManager.setMemory(workflow.workflow_id, 'api_endpoint', '/api/auth');

// Add artifact
await stateManager.addArtifact(workflow.workflow_id, {
  agent: 'marcus-backend',
  type: 'code',
  path: 'src/api/auth.ts'
});

// Complete phase
await stateManager.completePhase(workflow.workflow_id, 'PLAN');
```

---

## Workflow Patterns

### Sequential Workflow

```typescript
// orchestration/patterns/sequential.ts
import { HandoffManager } from '../handoff-manager.js';
import { WorkflowStateManager } from '../state/workflow-state.js';

export class SequentialWorkflow {
  private handoffManager: HandoffManager;
  private stateManager: WorkflowStateManager;

  constructor() {
    this.handoffManager = new HandoffManager();
    this.stateManager = new WorkflowStateManager();
  }

  /**
   * Execute sequential workflow: A → B → C
   */
  async execute(steps: {
    agent: string;
    context: any;
    expectedOutput: any;
  }[]): Promise<void> {
    // Create workflow
    const workflow = await this.stateManager.createWorkflow({
      name: 'sequential-workflow',
      phases: steps.map((_, i) => `step-${i + 1}`)
    });

    console.log(`🚀 Starting sequential workflow: ${steps.length} steps`);

    // Execute steps sequentially
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const nextStep = steps[i + 1];

      console.log(`📍 Step ${i + 1}/${steps.length}: ${step.agent}`);

      // Create handoff
      const handoff = await this.handoffManager.createHandoff({
        fromAgent: i === 0 ? 'system' : steps[i - 1].agent,
        toAgent: step.agent,
        context: step.context,
        expectedOutput: step.expectedOutput,
        workflowId: workflow.workflow_id
      });

      // Execute handoff
      await this.handoffManager.executeHandoff(handoff);

      // Mark phase complete
      await this.stateManager.completePhase(workflow.workflow_id, `step-${i + 1}`);
    }

    console.log('✅ Sequential workflow completed');
  }
}

// Usage
const workflow = new SequentialWorkflow();

await workflow.execute([
  {
    agent: 'alex-ba',
    context: { feature: 'Add user auth' },
    expectedOutput: { deliverables: ['requirements.md'] }
  },
  {
    agent: 'marcus-backend',
    context: { feature: 'Add user auth' },
    expectedOutput: { deliverables: ['auth-api.ts'] }
  },
  {
    agent: 'maria-qa',
    context: { feature: 'Add user auth' },
    expectedOutput: { deliverables: ['auth.test.ts'] }
  }
]);
```

### Parallel Workflow

```typescript
// orchestration/patterns/parallel.ts
export class ParallelWorkflow {
  private handoffManager: HandoffManager;
  private stateManager: WorkflowStateManager;

  /**
   * Execute parallel workflow: A + B + C simultaneously
   */
  async execute(tasks: {
    agent: string;
    context: any;
    expectedOutput: any;
  }[]): Promise<void> {
    const workflow = await this.stateManager.createWorkflow({
      name: 'parallel-workflow',
      phases: ['execute', 'merge']
    });

    console.log(`🚀 Starting parallel workflow: ${tasks.length} tasks`);

    // Create handoffs for all tasks
    const handoffPromises = tasks.map(task =>
      this.handoffManager.createHandoff({
        fromAgent: 'system',
        toAgent: task.agent,
        context: task.context,
        expectedOutput: task.expectedOutput,
        workflowId: workflow.workflow_id
      })
    );

    const handoffs = await Promise.all(handoffPromises);

    // Execute all in parallel
    const executionPromises = handoffs.map(handoff =>
      this.handoffManager.executeHandoff(handoff)
    );

    await Promise.all(executionPromises);

    console.log('✅ Parallel workflow completed');
  }
}

// Usage
const workflow = new ParallelWorkflow();

await workflow.execute([
  {
    agent: 'james-frontend',
    context: { component: 'LoginForm' },
    expectedOutput: { deliverables: ['LoginForm.tsx'] }
  },
  {
    agent: 'marcus-backend',
    context: { endpoint: 'POST /auth/login' },
    expectedOutput: { deliverables: ['auth-api.ts'] }
  },
  {
    agent: 'dana-database',
    context: { table: 'users' },
    expectedOutput: { deliverables: ['migration-001-users.sql'] }
  }
]);
```

---

## Resources

### scripts/
- `execute-workflow.ts` - Run pre-defined workflows
- `validate-handoff.ts` - Validate handoff contracts
- `recover-workflow.ts` - Recover failed workflows

### references/
- `references/opera-methodology.md` - Complete OPERA protocol specification
- `references/handoff-patterns.md` - Common handoff patterns
- `references/state-management.md` - State persistence best practices

### assets/
- `assets/workflow-templates/` - Pre-built workflow templates
- `assets/handoff-schemas/` - JSON schemas for contracts

## Related Skills

- `opera-orchestration` - OPERA agent system architecture
- `cross-domain-patterns` - Full-stack multi-agent patterns
- `quality-gates` - Contract validation in workflows
