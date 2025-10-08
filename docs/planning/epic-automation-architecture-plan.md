# Epic-Aware Flywheel Integration - Complete Architecture Plan

**Version**: 1.0.0
**Date**: 2025-10-08
**Status**: Draft
**Owner**: VERSATIL Core Team

---

## 🎯 Executive Summary

### Problem Statement
VERSATIL currently has **no automated epic workflow system**. Epic detection is keyword-based only (regex pattern in Sarah-PM), with no automated breakdown, story generation, or flywheel integration.

### Solution Overview
This plan integrates **proactive epic automation** directly into VERSATIL's existing runtime architecture:

- ✅ **Conversation-driven**: NLP + RAG detect epics from natural language
- ✅ **Fully automated**: Epic → Stories → Tasks → Agent execution → MCP tools
- ✅ **Flywheel native**: Integrates with existing 8-phase SDLC orchestration
- ✅ **Zero breaking changes**: Extends existing systems (AgentPool, MCP, RAG, OPERA)
- ✅ **Context preservation**: RAG + conversation backup = zero context loss

---

## 📋 Current State Analysis

### What EXISTS Today

1. **Sarah-PM Pattern Detection** ([sarah-pm.ts:58](../../src/agents/sarah-pm.ts#L58))
   ```typescript
   if (content.match(/task|story|epic|backlog|TODO/i)) {
     patterns.push({ type: 'task-coordination', ... });
   }
   ```
   - **What it does**: Keyword-only detection
   - **Limitation**: No epic creation, no automation

2. **SDLC Flywheel** ([sdlc-orchestrator.ts](../../src/flywheel/sdlc-orchestrator.ts))
   - 8 phases: requirements → design → development → testing → deployment → monitoring → feedback → improvement
   - Quality gates (automated/manual/hybrid)
   - Agent activation per phase
   - **Limitation**: No epic-level orchestration (only SDLC phase-level)

3. **Enhanced OPERA Coordinator** ([enhanced-opera-coordinator.ts](../../src/opera/enhanced-opera-coordinator.ts))
   - RAG-enabled agent activation
   - Autonomous action detection
   - Memory-enriched context
   - **Limitation**: No epic workflow integration

4. **Conversation Backup Manager** ([conversation-backup-manager.ts](../../src/conversation-backup-manager.ts))
   - Auto-saves conversations
   - Links docs/plans to sessions
   - Resume capability
   - **Limitation**: No epic linking or state preservation

5. **Agent Pool** ([agent-pool.ts](../../src/agents/agent-pool.ts))
   - 50% faster agent activation
   - Warm agent instances
   - Adaptive pool sizing
   - **Limitation**: No sub-agent support

6. **MCP Integration** ([mcp-integration.ts](../../src/mcp-integration.ts))
   - 14 production MCPs (Chrome, GitHub, Semgrep, etc.)
   - Tool execution per agent
   - **Limitation**: Manual tool selection, no task-based inference

### What's MISSING

❌ **Dedicated Epic Workflow Engine** - No automated epic → story → task breakdown
❌ **Proactive Epic Detection** - No NLP-based extraction from conversations
❌ **Flywheel Epic Integration** - No epic-level phase orchestration
❌ **Context-Aware Epic Enrichment** - No automatic linking of conversation → epic
❌ **Sub-Agent Orchestration** - No temporary agents for parallel execution
❌ **Cross-Conversation Epic Tracking** - No epic lifecycle across sessions

---

## 🏗️ Architecture Integration Plan

### Layer 1: Conversation → Epic Detection Pipeline

**Purpose**: Detect epics from natural conversation using NLP + RAG

#### New Components

**File**: `src/intelligence/epic-conversation-analyzer.ts`
```typescript
export class EpicConversationAnalyzer {
  /**
   * Analyze conversation messages to extract epic/story/task intent
   */
  async analyzeMessage(
    content: string,
    context: {
      conversationHistory: ConversationSnapshot;
      ragContext: RAGQueryResult;
    }
  ): Promise<EpicIntent> {
    // 1. NLP intent extraction
    const intent = await this.extractIntent(content);

    // 2. RAG pattern matching
    const similarEpics = await this.findSimilarEpics(intent);

    // 3. Confidence scoring
    const confidence = this.calculateConfidence(intent, similarEpics);

    return {
      detected: confidence > 0.75,
      confidence,
      title: intent.epicTitle,
      description: intent.description,
      type: intent.type, // feature|bug_fix|optimization
      priority: intent.priority,
      suggestedStories: similarEpics.flatMap(e => e.stories)
    };
  }

  /**
   * Proactive: Watch conversation stream in real-time
   */
  async detectEpicPatterns(stream: MessageStream): Promise<void> {
    // Listen to conversation events
    stream.on('message', async (message) => {
      const intent = await this.analyzeMessage(message.content, ...);

      if (intent.detected) {
        this.emit('epic_detected', intent);
      }
    });
  }
}
```

**File**: `src/models/epic-model.ts`
```typescript
export interface Epic {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug_fix' | 'optimization' | 'refactor';
  priority: 'critical' | 'high' | 'medium' | 'low';
  phase: SDLCPhase;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed';

  // Context linking
  conversationId: string;
  projectId: string;
  linkedDocs: string[];
  linkedRoadmaps: string[];

  // Breakdown
  stories: UserStory[];
  tasks: Task[];

  // Execution tracking
  assignedAgents: string[];
  subAgents: string[];
  mcpToolsUsed: string[];

  // Metadata
  createdAt: number;
  updatedAt: number;
  createdBy: 'user' | 'ai_detected';
}

export interface UserStory {
  id: string;
  epicId: string;
  title: string;
  description: string; // "As a [role], I want [goal], so that [benefit]"
  acceptanceCriteria: string[];
  priority: number;
  estimatedEffort: number; // story points
  tasks: Task[];
}

export interface Task {
  id: string;
  storyId: string;
  epicId: string;
  description: string;
  type: 'development' | 'testing' | 'documentation' | 'deployment';
  assignedAgent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  filePath?: string;
  mcpTools: string[];
  dependencies: string[]; // Other task IDs
}
```

#### Integration Point 1: Enhanced Server

**File**: `src/enhanced-server.ts` (NEW ENDPOINT)
```typescript
// ADD after line 102
app.post('/api/conversation/message', async (req, res) => {
  const { role, content, metadata } = req.body;

  try {
    // 1. Store conversation via ConversationBackupManager
    const conversationManager = getConversationBackupManager(process.cwd());
    await conversationManager.addMessage(role, content, metadata);

    // 2. EPIC DETECTION LAYER
    const epicAnalyzer = new EpicConversationAnalyzer();
    const ragContext = await vectorMemoryStore.queryMemories({
      query: content,
      topK: 5,
      filters: { tags: ['epic', 'story', 'task'] }
    });

    const epicIntent = await epicAnalyzer.analyzeMessage(content, {
      conversationHistory: conversationManager.getCurrentConversation()!,
      ragContext
    });

    // 3. If epic detected, create workflow automatically
    if (epicIntent.detected && epicIntent.confidence > 0.75) {
      const epicOrchestrator = new EpicWorkflowOrchestrator();
      const epic = await epicOrchestrator.createEpicFromIntent(epicIntent);

      // 4. Trigger SDLC flywheel for epic
      const orchestrator = new SDLCOrchestrator();
      await orchestrator.orchestrateEpicPhaseTransition(
        epic,
        'init',
        'requirements'
      );

      res.json({
        success: true,
        epicDetected: true,
        epic,
        confidence: epicIntent.confidence
      });
    } else {
      res.json({
        success: true,
        epicDetected: false,
        message: 'Message stored, no epic detected'
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

**Detection Patterns**:
- **Explicit**: "Create epic for...", "Add user authentication feature"
- **Implicit**: "We need to improve..." → Extract epic from context
- **Multi-turn**: Accumulates context across messages to detect larger epics

---

### Layer 2: Epic → SDLC Flywheel Orchestration

**Purpose**: Automated epic → story → task breakdown with flywheel integration

#### Enhanced Component

**File**: `src/flywheel/sdlc-orchestrator.ts` (ENHANCEMENTS)
```typescript
export class SDLCOrchestrator extends EventEmitter {
  private phases: Map<string, SDLCPhase>;
  private epics: Map<string, Epic> = new Map(); // NEW

  // NEW: Epic-level orchestration
  async orchestrateEpicPhaseTransition(
    epic: Epic,
    fromPhase: string,
    toPhase: string
  ): Promise<void> {
    console.log(`🎯 Epic "${epic.title}" transitioning: ${fromPhase} → ${toPhase}`);

    // 1. Generate user stories from epic (Alex-BA)
    const stories = await this.generateUserStories(epic);
    epic.stories = stories;

    // 2. Break down stories into tasks (Sarah-PM)
    const tasks = await this.generateTasksFromStories(stories);
    epic.tasks = tasks;

    // 3. Activate agents based on phase
    const agents = this.getPhaseAgents(toPhase);
    await this.activateAgentsForEpic(epic, agents, tasks);

    // 4. Execute quality gates
    await this.executeEpicQualityGates(epic, toPhase);

    // 5. Update flywheel state
    epic.phase = toPhase as SDLCPhase;
    epic.updatedAt = Date.now();
    this.epics.set(epic.id, epic);

    this.emit('epic_phase_transition', { epic, fromPhase, toPhase });
  }

  // NEW: Generate stories using Alex-BA agent
  private async generateUserStories(epic: Epic): Promise<UserStory[]> {
    console.log(`📝 Generating user stories for epic: ${epic.title}`);

    // 1. Get Alex-BA from agent pool (50% faster activation)
    const alexAgent = await globalAgentPool.getAgent('alex-ba');

    // 2. Build context-rich request
    const request = this.buildStoryGenerationRequest(epic);

    // 3. Activate with epic context + RAG
    const response = await alexAgent.activate({
      trigger: { agent: 'alex-ba', reason: 'epic_story_generation' },
      filePath: epic.projectId,
      userRequest: request,
      contextClarity: 'high',
      urgency: epic.priority === 'critical' ? 'emergency' : 'normal',
      // RAG context: similar epics from past
      memories: await this.queryRelatedEpics(epic)
    });

    // 4. Parse stories from agent response
    const stories = this.parseStoriesFromResponse(response, epic);

    // 5. Return agent to pool
    await globalAgentPool.releaseAgent(alexAgent);

    console.log(`✅ Generated ${stories.length} user stories`);
    return stories;
  }

  // NEW: Generate tasks using Sarah-PM agent
  private async generateTasksFromStories(stories: UserStory[]): Promise<Task[]> {
    console.log(`📋 Breaking down ${stories.length} stories into tasks`);
    const allTasks: Task[] = [];

    for (const story of stories) {
      const sarahAgent = await globalAgentPool.getAgent('sarah-pm');

      const request = `Break down user story into tasks:

**Story**: ${story.title}
${story.description}

**Acceptance Criteria**:
${story.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

Generate specific, actionable tasks with:
- Clear descriptions
- File paths (if applicable)
- Required MCP tools
- Dependencies`;

      const response = await sarahAgent.activate({
        trigger: { agent: 'sarah-pm', reason: 'story_task_breakdown' },
        userRequest: request,
        contextClarity: 'high',
        urgency: 'normal'
      });

      const tasks = this.parseTasksFromResponse(response, story);
      allTasks.push(...tasks);

      await globalAgentPool.releaseAgent(sarahAgent);
    }

    console.log(`✅ Generated ${allTasks.length} tasks`);
    return allTasks;
  }

  // NEW: Activate agents for epic tasks
  private async activateAgentsForEpic(
    epic: Epic,
    agentTypes: string[],
    tasks: Task[]
  ): Promise<void> {
    console.log(`🤖 Activating ${agentTypes.length} agents for epic execution`);

    // Use enhanced OPERA coordinator for multi-agent orchestration
    const context = await enhancedOPERA.getContext(epic.projectId);

    for (const agentType of agentTypes) {
      const agent = await globalAgentPool.getAgent(agentType);

      // Filter tasks for this agent
      const agentTasks = tasks.filter(t => t.assignedAgent === agentType);

      if (agentTasks.length > 0) {
        console.log(`  → ${agentType}: ${agentTasks.length} tasks`);

        // Activate agent with task context
        await agent.activate({
          trigger: { agent: agentType, reason: 'epic_task_execution' },
          filePath: epic.projectId,
          userRequest: this.buildTaskExecutionRequest(epic, agentTasks),
          contextClarity: 'high',
          urgency: epic.priority === 'critical' ? 'emergency' : 'normal',
          // RAG context from enhanced OPERA
          memories: context.memory
        });

        epic.assignedAgents.push(agentType);
      }

      await globalAgentPool.releaseAgent(agent);
    }
  }

  // NEW: Epic-level quality gates
  async executeEpicQualityGates(epic: Epic, phase: string): Promise<void> {
    const phaseGates = this.getPhaseQualityGates(phase);

    for (const gate of phaseGates) {
      const result = await this.executeGate(gate, epic);

      if (!result.passed && gate.blocking) {
        throw new Error(`Quality gate failed: ${gate.id} - ${result.reason}`);
      }
    }
  }
}
```

**New Helper Methods**:
```typescript
private buildStoryGenerationRequest(epic: Epic): string {
  return `Generate user stories for the following epic:

**Epic**: ${epic.title}
**Type**: ${epic.type}
**Description**: ${epic.description}

Generate 5-8 user stories following the format:
"As a [role], I want [goal], so that [benefit]"

Include acceptance criteria for each story.`;
}

private parseStoriesFromResponse(response: AgentResponse, epic: Epic): UserStory[] {
  // Parse agent response and extract stories
  // Uses regex + NLP to identify story patterns
  const stories: UserStory[] = [];

  // Example parsing logic
  const storyPattern = /As a (.+?), I want (.+?), so that (.+?)\n/g;
  let match;

  while ((match = storyPattern.exec(response.message)) !== null) {
    stories.push({
      id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      epicId: epic.id,
      title: match[2].trim(),
      description: match[0].trim(),
      acceptanceCriteria: [], // Extracted separately
      priority: 1,
      estimatedEffort: 3,
      tasks: []
    });
  }

  return stories;
}

private parseTasksFromResponse(response: AgentResponse, story: UserStory): Task[] {
  // Parse tasks from Sarah-PM response
  const tasks: Task[] = [];

  const taskPattern = /- \[(.+?)\] (.+?)(?:\n|$)/g;
  let match;

  while ((match = taskPattern.exec(response.message)) !== null) {
    tasks.push({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      storyId: story.id,
      epicId: story.epicId,
      description: match[2].trim(),
      type: this.inferTaskType(match[2]),
      assignedAgent: this.inferAgent(match[2]),
      status: 'pending',
      mcpTools: this.inferMCPTools(match[2]),
      dependencies: []
    });
  }

  return tasks;
}

private async queryRelatedEpics(epic: Epic): Promise<any[]> {
  const results = await vectorMemoryStore.queryMemories({
    query: `${epic.type} ${epic.title}`,
    topK: 5,
    filters: { tags: ['epic', 'completed'] }
  });

  return results.documents;
}
```

**Integration Points**:
- ✅ Uses existing `AgentPool` ([agent-pool.ts](../../src/agents/agent-pool.ts))
- ✅ Leverages `EnhancedOPERACoordinator` ([enhanced-opera-coordinator.ts](../../src/opera/enhanced-opera-coordinator.ts))
- ✅ Existing SDLC phases (line 68-80) now epic-aware
- ✅ Agent activation uses existing `BaseAgent.activate()` interface

---

### Layer 3: Tasks → MCP Tool Execution

**Purpose**: Automated MCP tool selection and execution based on task patterns

#### Enhanced Component

**File**: `src/mcp-integration.ts` (ENHANCEMENTS)
```typescript
export class MCPToolManager {
  // NEW: Execute MCP tools based on epic task context
  async executeEpicTaskTools(
    task: Task,
    agent: BaseAgent
  ): Promise<MCPToolResult[]> {
    console.log(`🛠️  Executing MCP tools for task: ${task.description}`);
    const results: MCPToolResult[] = [];

    // 1. Determine required MCP tools from task type and description
    const requiredTools = this.inferMCPToolsFromTask(task);
    console.log(`  → Required tools: ${requiredTools.join(', ')}`);

    // 2. Execute each tool in sequence (with RAG context)
    for (const tool of requiredTools) {
      const result = await this.executeMCPTool(tool, {
        trigger: { agent: agent.id, reason: 'epic_task_tool_execution' },
        filePath: task.filePath,
        userRequest: task.description,
        contextClarity: 'high',
        urgency: task.priority === 'critical' ? 'emergency' : 'normal'
      });

      results.push(result);

      // 3. Store tool execution in RAG for future learning
      await vectorMemoryStore.storeMemory({
        content: JSON.stringify({
          taskId: task.id,
          epicId: task.epicId,
          tool,
          result,
          agentId: agent.id,
          executionTime: result.executionTime
        }),
        metadata: {
          agentId: agent.id,
          timestamp: Date.now(),
          tags: ['epic_task', 'mcp_execution', tool, task.type],
          epicId: task.epicId,
          taskId: task.id
        }
      });
    }

    console.log(`✅ Executed ${results.length} MCP tools for task`);
    return results;
  }

  // NEW: Infer MCP tools from task type and description
  private inferMCPToolsFromTask(task: Task): string[] {
    const tools: string[] = [];
    const desc = task.description.toLowerCase();

    // Pattern matching for tool inference
    if (desc.match(/test|qa|coverage|validation/i)) {
      tools.push('chrome_mcp', 'playwright_mcp');
    }

    if (desc.match(/ui|component|design|button|form/i)) {
      tools.push('shadcn_mcp');
    }

    if (desc.match(/api|backend|endpoint|security|auth/i)) {
      tools.push('semgrep_mcp', 'sentry_mcp');
    }

    if (desc.match(/deploy|workflow|automation|ci\/cd/i)) {
      tools.push('n8n_mcp', 'github_mcp');
    }

    if (desc.match(/search|research|documentation|docs/i)) {
      tools.push('exa_mcp');
    }

    if (desc.match(/ai|ml|model|prediction/i)) {
      tools.push('vertex_ai_mcp');
    }

    if (desc.match(/database|storage|query|supabase/i)) {
      tools.push('supabase_mcp');
    }

    // Task type-based tools
    if (task.type === 'testing') {
      tools.push('chrome_mcp', 'sentry_mcp');
    } else if (task.type === 'deployment') {
      tools.push('n8n_mcp', 'github_mcp');
    }

    return [...new Set(tools)]; // Remove duplicates
  }
}
```

**Integration Points**:
- ✅ Uses existing MCP executors:
  - [github-mcp-executor.ts](../../src/mcp/github-mcp-executor.ts) - Octokit integration
  - [chrome-mcp-executor.ts](../../src/mcp/chrome-mcp-executor.ts) - Playwright browser automation
  - [semgrep-mcp-executor.ts](../../src/mcp/semgrep-mcp-executor.ts) - Security scanning
  - [shadcn-mcp-executor.ts](../../src/mcp/shadcn-mcp-executor.ts) - Component library
  - And 6 more production MCPs
- ✅ All executors already implement real production logic
- ✅ Tool results stored in existing `vectorMemoryStore` for learning

---

### Layer 4: Sub-Agent Orchestration & Synchronization

**Purpose**: Parallel task execution via temporary sub-agents with automated sync

#### New Component

**File**: `src/agents/sub-agent-factory.ts`
```typescript
import { EventEmitter } from 'events';
import { BaseAgent } from './base-agent.js';
import { vectorMemoryStore } from '../rag/vector-memory-store.js';
import { Epic, Task } from '../models/epic-model.js';

export class SubAgentFactory extends EventEmitter {
  private subAgents: Map<string, BaseAgent> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create temporary sub-agent for specific epic task
   * Sub-agents are ephemeral - destroyed after task completion
   */
  async createSubAgent(
    parentAgent: BaseAgent,
    task: Task,
    epic: Epic
  ): Promise<BaseAgent> {
    const subAgentId = `sub-${parentAgent.id}-${task.id.substr(0, 8)}`;

    console.log(`🤖 Creating sub-agent: ${subAgentId}`);

    // 1. Clone parent agent with task-specific context
    const subAgent = await this.cloneAgent(parentAgent, {
      id: subAgentId,
      specialization: task.type,
      epicContext: epic,
      taskContext: task,
      parentId: parentAgent.id
    });

    // 2. Register sub-agent for synchronization
    this.subAgents.set(subAgentId, subAgent);

    // 3. Start sync interval for this epic (if not already running)
    if (!this.syncIntervals.has(epic.id)) {
      this.startEpicSyncInterval(epic.id);
    }

    // 4. Emit sub-agent creation event
    this.emit('sub_agent_created', {
      parentAgent: parentAgent.id,
      subAgent: subAgentId,
      task: task.id,
      epic: epic.id
    });

    return subAgent;
  }

  /**
   * Clone agent with custom configuration
   */
  private async cloneAgent(
    parent: BaseAgent,
    config: {
      id: string;
      specialization: string;
      epicContext: Epic;
      taskContext: Task;
      parentId: string;
    }
  ): Promise<BaseAgent> {
    // Create shallow clone with overrides
    const clone = Object.create(Object.getPrototypeOf(parent));
    Object.assign(clone, parent);

    // Override specific properties
    clone.id = config.id;
    clone.specialization = `${parent.specialization} (${config.specialization})`;
    clone.epicContext = config.epicContext;
    clone.taskContext = config.taskContext;
    clone.parentId = config.parentId;

    return clone;
  }

  /**
   * Start synchronization interval for epic
   */
  private startEpicSyncInterval(epicId: string): void {
    const interval = setInterval(async () => {
      await this.synchronizeSubAgents(epicId);
    }, 30000); // Sync every 30 seconds

    this.syncIntervals.set(epicId, interval);
    console.log(`⏱️  Started sync interval for epic: ${epicId}`);
  }

  /**
   * Synchronize sub-agents working on same epic
   * Uses event bus + shared RAG context
   */
  async synchronizeSubAgents(epicId: string): Promise<void> {
    const epicSubAgents = Array.from(this.subAgents.values())
      .filter(agent => agent.epicContext?.id === epicId);

    if (epicSubAgents.length === 0) return;

    console.log(`🔄 Synchronizing ${epicSubAgents.length} sub-agents for epic ${epicId}`);

    // 1. Collect all sub-agent states
    const states = await Promise.all(
      epicSubAgents.map(agent => this.getAgentState(agent))
    );

    // 2. Query RAG for shared epic context
    const sharedContext = await vectorMemoryStore.queryMemories({
      query: `epic:${epicId}`,
      topK: 20,
      filters: {
        tags: ['epic_task', 'mcp_execution'],
        epicId
      }
    });

    // 3. Broadcast shared context to all sub-agents
    for (const agent of epicSubAgents) {
      await this.updateAgentContext(agent, {
        peerStates: states.filter(s => s.agentId !== agent.id),
        sharedMemory: sharedContext.documents,
        syncTimestamp: Date.now()
      });
    }

    // 4. Check for conflicts and resolve
    const conflicts = await this.detectConflicts(epicSubAgents, states);
    if (conflicts.length > 0) {
      await this.resolveConflicts(conflicts);
    }

    this.emit('sub_agents_synchronized', {
      epicId,
      agentCount: epicSubAgents.length,
      conflictsResolved: conflicts.length,
      timestamp: Date.now()
    });
  }

  /**
   * Get agent state for synchronization
   */
  private async getAgentState(agent: BaseAgent): Promise<any> {
    return {
      agentId: agent.id,
      taskId: agent.taskContext?.id,
      status: agent.taskContext?.status,
      filesModified: await this.getModifiedFiles(agent),
      mcpToolsUsed: agent.taskContext?.mcpTools || [],
      lastUpdate: Date.now()
    };
  }

  /**
   * Update agent context with sync data
   */
  private async updateAgentContext(
    agent: BaseAgent,
    context: {
      peerStates: any[];
      sharedMemory: any[];
      syncTimestamp: number;
    }
  ): Promise<void> {
    // Update agent's internal context
    (agent as any).syncContext = context;

    // Store sync event in RAG
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        agentId: agent.id,
        syncEvent: 'context_update',
        peerCount: context.peerStates.length,
        memoryCount: context.sharedMemory.length
      }),
      metadata: {
        agentId: agent.id,
        timestamp: context.syncTimestamp,
        tags: ['sub_agent_sync', 'context_update'],
        epicId: agent.epicContext?.id
      }
    });
  }

  /**
   * Detect conflicts between sub-agents
   */
  private async detectConflicts(
    agents: BaseAgent[],
    states: any[]
  ): Promise<any[]> {
    const conflicts: any[] = [];

    // Check for file conflicts (same file modified by multiple agents)
    const fileMap = new Map<string, string[]>();

    for (const state of states) {
      for (const file of state.filesModified || []) {
        if (!fileMap.has(file)) {
          fileMap.set(file, []);
        }
        fileMap.get(file)!.push(state.agentId);
      }
    }

    // Identify conflicts
    for (const [file, agentIds] of fileMap.entries()) {
      if (agentIds.length > 1) {
        conflicts.push({
          type: 'file_conflict',
          file,
          agents: agentIds,
          severity: 'high'
        });
      }
    }

    // Check for API endpoint conflicts
    // Check for component name conflicts
    // etc.

    return conflicts;
  }

  /**
   * Resolve conflicts using RAG-based decision making
   */
  private async resolveConflicts(conflicts: any[]): Promise<void> {
    for (const conflict of conflicts) {
      console.log(`⚠️  Resolving conflict: ${conflict.type} - ${conflict.file}`);

      // Query RAG for conflict resolution patterns
      const resolution = await vectorMemoryStore.queryMemories({
        query: `resolve conflict ${conflict.type} ${conflict.file}`,
        topK: 3,
        filters: { tags: ['conflict_resolution', 'best_practice'] }
      });

      // Apply resolution (simplified)
      if (resolution.documents.length > 0) {
        const strategy = this.extractResolutionStrategy(resolution.documents[0]);
        await this.applyResolution(conflict, strategy);
      } else {
        // Fallback: Choose agent with highest priority
        const primaryAgent = conflict.agents[0];
        console.log(`  → Fallback: Prioritizing ${primaryAgent}'s changes`);
      }
    }
  }

  /**
   * Destroy sub-agents after epic phase completion
   */
  async destroySubAgents(epicId: string): Promise<void> {
    console.log(`🗑️  Destroying sub-agents for epic: ${epicId}`);

    // Stop sync interval
    const interval = this.syncIntervals.get(epicId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(epicId);
    }

    // Get all sub-agents for this epic
    const epicSubAgents = Array.from(this.subAgents.entries())
      .filter(([_, agent]) => agent.epicContext?.id === epicId);

    // Destroy each sub-agent
    for (const [id, agent] of epicSubAgents) {
      // 1. Save final state to RAG
      await this.saveFinalState(agent);

      // 2. Clean up resources
      if (typeof (agent as any).destroy === 'function') {
        (agent as any).destroy();
      }

      // 3. Remove from registry
      this.subAgents.delete(id);
    }

    console.log(`✅ Destroyed ${epicSubAgents.length} sub-agents for epic ${epicId}`);

    this.emit('sub_agents_destroyed', {
      epicId,
      count: epicSubAgents.length
    });
  }

  /**
   * Save sub-agent final state to RAG
   */
  private async saveFinalState(agent: BaseAgent): Promise<void> {
    const finalState = await this.getAgentState(agent);

    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        ...finalState,
        taskContext: agent.taskContext,
        epicContext: agent.epicContext
      }),
      metadata: {
        agentId: agent.id,
        timestamp: Date.now(),
        tags: ['sub_agent_final_state', 'completed'],
        epicId: agent.epicContext?.id,
        taskId: agent.taskContext?.id
      }
    });
  }

  /**
   * Get files modified by agent
   */
  private async getModifiedFiles(agent: BaseAgent): Promise<string[]> {
    // In production, this would query git status or file watchers
    return agent.taskContext?.filePath ? [agent.taskContext.filePath] : [];
  }

  /**
   * Extract resolution strategy from RAG result
   */
  private extractResolutionStrategy(document: any): string {
    // Parse document content for strategy
    try {
      const content = JSON.parse(document.content);
      return content.strategy || 'merge';
    } catch {
      return 'merge';
    }
  }

  /**
   * Apply conflict resolution
   */
  private async applyResolution(conflict: any, strategy: string): Promise<void> {
    console.log(`  → Applying strategy: ${strategy}`);

    switch (strategy) {
      case 'merge':
        // Attempt automatic merge
        break;
      case 'prioritize':
        // Prioritize one agent's changes
        break;
      case 'manual':
        // Flag for manual review
        this.emit('manual_resolution_required', conflict);
        break;
    }
  }
}

// Export singleton
export const subAgentFactory = new SubAgentFactory();
```

**Integration Points**:
- ✅ Sub-agents use same `BaseAgent` interface
- ✅ Share parent's `vectorMemoryStore` for RAG context
- ✅ Sync uses existing `EventEmitter` event bus
- ✅ Compatible with `AgentPool` lifecycle
- ✅ Conflict resolution uses RAG query results

---

### Layer 5: Context Preservation & Epic Memory

**Purpose**: Zero context loss for epics across conversations using RAG

#### Enhanced Components

**File**: `src/conversation-backup-manager.ts` (ENHANCEMENTS)
```typescript
export class ConversationBackupManager {
  // ... existing code ...

  /**
   * NEW: Link epics to current conversation
   */
  async linkEpicsToConversation(epics: Epic[]): Promise<void> {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    if (!this.currentConversation.metadata.linkedEpics) {
      this.currentConversation.metadata.linkedEpics = [];
    }

    for (const epic of epics) {
      if (!this.currentConversation.metadata.linkedEpics.includes(epic.id)) {
        this.currentConversation.metadata.linkedEpics.push(epic.id);
      }
    }

    await this.saveConversation();

    console.log(`🔗 Linked ${epics.length} epic(s) to conversation`);
  }

  /**
   * NEW: Generate epic-aware resume context
   */
  async generateEpicAwareResumeContext(conversationId: string): Promise<string> {
    const conversation = await this.loadConversation(conversationId);
    let context = await this.generateResumeContext(conversationId);

    // Add epic context
    if (conversation.metadata.linkedEpics && conversation.metadata.linkedEpics.length > 0) {
      context += `\n## Linked Epics\n\n`;

      for (const epicId of conversation.metadata.linkedEpics) {
        // Query epic from RAG
        const epicData = await this.loadEpicFromRAG(epicId);

        if (epicData) {
          context += `### Epic: ${epicData.title}\n`;
          context += `- **Status**: ${epicData.status}\n`;
          context += `- **Phase**: ${epicData.phase}\n`;
          context += `- **Stories**: ${epicData.stories.length}\n`;
          context += `- **Tasks**: ${epicData.tasks.length} (${epicData.tasks.filter(t => t.status === 'completed').length} completed)\n`;
          context += `- **Agents**: ${epicData.assignedAgents.join(', ')}\n\n`;
        }
      }
    }

    return context;
  }

  /**
   * Load epic from RAG
   */
  private async loadEpicFromRAG(epicId: string): Promise<Epic | null> {
    const results = await vectorMemoryStore.queryMemories({
      query: epicId,
      topK: 1,
      filters: { tags: ['epic_state'], epicId }
    });

    if (results.documents.length > 0) {
      try {
        return JSON.parse(results.documents[0].content);
      } catch {
        return null;
      }
    }

    return null;
  }
}
```

**File**: `src/rag/epic-memory-store.ts` (NEW)
```typescript
import { vectorMemoryStore, RAGQuery } from './vector-memory-store.js';
import { Epic, UserStory, Task } from '../models/epic-model.js';

export interface EpicContext {
  epic: Epic;
  stories: UserStory[];
  tasks: Task[];
  decisions: any[];
  codeChanges: any[];
  mcpResults: any[];
  subAgentStates: any[];
}

export class EpicMemoryStore {
  /**
   * Store epic with full context in RAG
   */
  async storeEpicMemory(epic: Epic, context: EpicContext): Promise<void> {
    console.log(`💾 Storing epic memory: ${epic.title}`);

    // 1. Store epic state
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify(epic),
      metadata: {
        agentId: 'epic-orchestrator',
        timestamp: Date.now(),
        tags: ['epic_state', epic.type, epic.phase],
        epicId: epic.id,
        projectId: epic.projectId
      }
    });

    // 2. Store stories
    for (const story of context.stories) {
      await vectorMemoryStore.storeMemory({
        content: JSON.stringify(story),
        metadata: {
          agentId: 'alex-ba',
          timestamp: Date.now(),
          tags: ['user_story', epic.type],
          epicId: epic.id,
          storyId: story.id
        }
      });
    }

    // 3. Store tasks
    for (const task of context.tasks) {
      await vectorMemoryStore.storeMemory({
        content: JSON.stringify(task),
        metadata: {
          agentId: task.assignedAgent,
          timestamp: Date.now(),
          tags: ['task', task.type, task.status],
          epicId: epic.id,
          taskId: task.id
        }
      });
    }

    // 4. Store MCP results
    for (const result of context.mcpResults) {
      await vectorMemoryStore.storeMemory({
        content: JSON.stringify(result),
        metadata: {
          agentId: result.agent,
          timestamp: Date.now(),
          tags: ['mcp_result', result.tool],
          epicId: epic.id
        }
      });
    }

    console.log(`✅ Stored epic memory with ${context.stories.length} stories, ${context.tasks.length} tasks`);
  }

  /**
   * Retrieve epic with full historical context
   */
  async queryEpicHistory(epicId: string): Promise<EpicContext | null> {
    console.log(`🔍 Querying epic history: ${epicId}`);

    // Query all epic-related memories
    const results = await vectorMemoryStore.queryMemories({
      query: epicId,
      topK: 100,
      filters: { epicId }
    });

    if (results.documents.length === 0) {
      return null;
    }

    // Parse and organize results
    const epic = this.findEpicState(results.documents);
    const stories = this.findStories(results.documents);
    const tasks = this.findTasks(results.documents);
    const mcpResults = this.findMCPResults(results.documents);

    return {
      epic: epic!,
      stories,
      tasks,
      decisions: [],
      codeChanges: [],
      mcpResults,
      subAgentStates: []
    };
  }

  /**
   * Find similar epics from past (for reuse/learning)
   */
  async findSimilarEpics(intent: EpicIntent, topK: number = 5): Promise<Epic[]> {
    const query = `${intent.type} ${intent.title} ${intent.description}`;

    const results = await vectorMemoryStore.queryMemories({
      query,
      topK,
      filters: {
        tags: ['epic_state', 'completed'],
        type: intent.type
      }
    });

    return results.documents.map(doc => {
      try {
        return JSON.parse(doc.content);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Helper: Find epic state from documents
   */
  private findEpicState(documents: any[]): Epic | null {
    const epicDoc = documents.find(doc => doc.metadata.tags?.includes('epic_state'));

    if (epicDoc) {
      try {
        return JSON.parse(epicDoc.content);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Helper: Find stories from documents
   */
  private findStories(documents: any[]): UserStory[] {
    return documents
      .filter(doc => doc.metadata.tags?.includes('user_story'))
      .map(doc => {
        try {
          return JSON.parse(doc.content);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Helper: Find tasks from documents
   */
  private findTasks(documents: any[]): Task[] {
    return documents
      .filter(doc => doc.metadata.tags?.includes('task'))
      .map(doc => {
        try {
          return JSON.parse(doc.content);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Helper: Find MCP results from documents
   */
  private findMCPResults(documents: any[]): any[] {
    return documents
      .filter(doc => doc.metadata.tags?.includes('mcp_result'))
      .map(doc => {
        try {
          return JSON.parse(doc.content);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }
}

// Export singleton
export const epicMemoryStore = new EpicMemoryStore();
```

**Integration Points**:
- ✅ Uses existing `ConversationBackupManager` (already supports doc linking)
- ✅ Extends existing `vectorMemoryStore` with epic-specific methods
- ✅ `/resume` command auto-loads epic context
- ✅ RAG preserves epic state across sessions

---

## 🔄 Complete Execution Flow

### User Message → Epic Execution Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ USER: "Add user authentication with OAuth and 2FA"          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: EPIC DETECTION                                      │
│ POST /api/conversation/message                               │
│                                                              │
│ 1. ConversationBackupManager.addMessage()                    │
│ 2. EpicConversationAnalyzer.analyzeMessage()                 │
│    - NLP intent extraction                                   │
│    - RAG query: vectorMemoryStore.queryMemories()           │
│    - Confidence: 0.87 (>0.75 threshold)                     │
│ 3. EPIC DETECTED: "User Authentication System"              │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: FLYWHEEL ORCHESTRATION                              │
│ SDLCOrchestrator.orchestrateEpicPhaseTransition()            │
│                                                              │
│ STEP 1: Story Generation (Alex-BA)                           │
│   - globalAgentPool.getAgent('alex-ba') ← 50% faster        │
│   - alexAgent.activate({ epic context + RAG })              │
│   - Stories: 5 generated                                     │
│   - globalAgentPool.releaseAgent(alexAgent)                 │
│                                                              │
│ STEP 2: Task Breakdown (Sarah-PM)                            │
│   - For each story:                                          │
│     - globalAgentPool.getAgent('sarah-pm')                  │
│     - sarahAgent.activate({ story breakdown })              │
│     - Tasks: 4 per story = 20 total                         │
│   - globalAgentPool.releaseAgent(sarahAgent)                │
│                                                              │
│ STEP 3: Agent Activation (Multi-Agent)                       │
│   - Phase: "development"                                     │
│   - Agents: [marcus, james, maria, dr-ai-ml]                │
│   - For each agent:                                          │
│     - globalAgentPool.getAgent(agentType)                   │
│     - Create sub-agents for parallel execution               │
│     - Activate with RAG context                              │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: MCP TOOL EXECUTION                                  │
│ MCPToolManager.executeEpicTaskTools()                        │
│                                                              │
│ Task: "Implement OAuth callback handler"                     │
│   - Infer tools: [semgrep_mcp, github_mcp, sentry_mcp]      │
│   - Execute Semgrep: 2 violations found                      │
│   - Execute GitHub: PR #123 created                          │
│   - Execute Sentry: Alerts configured                        │
│   - Store results in RAG                                     │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 4: SUB-AGENT SYNC                                      │
│ SubAgentFactory.synchronizeSubAgents()                       │
│                                                              │
│ Sub-agents: 4 active                                         │
│   - sub-marcus-task-1 (OAuth setup)                         │
│   - sub-marcus-task-2 (callback)                            │
│   - sub-james-task-5 (login UI)                             │
│   - sub-maria-task-18 (tests)                               │
│                                                              │
│ Sync cycle (30s):                                            │
│   1. Collect states                                          │
│   2. Query RAG: epic context                                 │
│   3. Share context: cross-agent learning                     │
│   4. Detect conflicts: 1 found (endpoint URL mismatch)       │
│   5. Resolve: Update James's code                            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 5: QUALITY GATES                                       │
│ SDLCOrchestrator.executeEpicQualityGates()                   │
│                                                              │
│ Gate 1: Code Coverage ✅ 87% (threshold: 80%)               │
│ Gate 2: Security Scan ❌ 2 violations (threshold: 0)        │
│ Gate 3: Integration Tests ✅ 45/45 passing                  │
│                                                              │
│ ACTION: Block phase transition until fixes                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 6: CONTEXT PRESERVATION                                │
│ ConversationBackupManager + EpicMemoryStore                  │
│                                                              │
│ 1. Link epic to conversation                                 │
│ 2. Store epic state in RAG                                   │
│ 3. Update conversation metadata                              │
│ 4. On /resume: Load conversation + epic + RAG context        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Automation Breakdown

### What's Automated vs Manual

| Component | Automated? | Command Override | Flywheel Role |
|-----------|------------|------------------|---------------|
| **Epic Detection** | ✅ Yes (NLP + RAG) | Optional user approval | Triggers flywheel |
| **Story Generation** | ✅ Yes (Alex-BA) | `/alex-ba refine story` | Requirements phase |
| **Task Breakdown** | ✅ Yes (Sarah-PM) | Manual task addition | Requirements phase |
| **Agent Activation** | ✅ Yes (AgentPool) | Manual agent assign | All phases |
| **MCP Tool Execution** | ✅ Yes (Pattern inference) | Manual tool selection | Development/Testing |
| **Sub-Agent Creation** | ✅ Yes (Per task) | N/A | Development phase |
| **Sub-Agent Sync** | ✅ Yes (30s cycles) | Debug inspection | Development phase |
| **Conflict Resolution** | ✅ Yes (RAG-based) | Manual override | All phases |
| **Quality Gates** | ✅ Yes (Auto-enforce) | Admin gate skip | All phase transitions |
| **Phase Transition** | ✅ Yes (When gates pass) | Manual force | Flywheel orchestration |
| **Context Preservation** | ✅ Yes (RAG + Conversation) | N/A | Continuous |

### Flywheel Process Involvement

| Epic Phase | Flywheel Actions | Agents Activated | MCP Tools | Sub-Agents |
|------------|------------------|------------------|-----------|------------|
| **Requirements** | Story generation, acceptance criteria | Alex-BA, Sarah-PM | Exa (research), GitHub (issues) | 0 |
| **Design** | Architecture planning, API contracts | Marcus, James | GitHub (diagrams), Vertex AI (gen) | 0 |
| **Development** | Code implementation, testing | All 6 agents | Semgrep, Sentry, Chrome, Shadcn | 4-8 |
| **Testing** | QA validation, performance tests | Maria-QA, Marcus | Chrome, Playwright, Sentry | 2-4 |
| **Deployment** | CI/CD automation, monitoring | Sarah-PM, Marcus | n8n, GitHub, Sentry | 1-2 |
| **Monitoring** | Performance tracking, error alerts | Dr.AI-ML, Marcus | Sentry, Vertex AI, Supabase | 0 |

---

## 📅 Implementation Timeline

### Phase 1: Epic Detection (Days 1-2)
**Files to Create**:
- `src/intelligence/epic-conversation-analyzer.ts`
- `src/models/epic-model.ts`

**Files to Enhance**:
- `src/enhanced-server.ts` - Add `/api/conversation/message` endpoint

**Deliverables**:
- NLP-based epic detection from conversations
- Epic intent extraction with confidence scoring
- Integration with existing `ConversationBackupManager`

---

### Phase 2: Flywheel Orchestration (Days 3-5)
**Files to Enhance**:
- `src/flywheel/sdlc-orchestrator.ts` - Add epic methods

**New Methods**:
- `orchestrateEpicPhaseTransition()`
- `generateUserStories()` (uses Alex-BA)
- `generateTasksFromStories()` (uses Sarah-PM)
- `activateAgentsForEpic()`

**Deliverables**:
- Automated story generation (Alex-BA + AgentPool)
- Automated task breakdown (Sarah-PM + AgentPool)
- Multi-agent activation with RAG context
- Epic-level quality gates

---

### Phase 3: MCP Tool Automation (Days 6-7)
**Files to Enhance**:
- `src/mcp-integration.ts` - Add `executeEpicTaskTools()`

**New Logic**:
- Pattern-based MCP tool inference
- Automated tool execution per task
- RAG storage of tool results

**Deliverables**:
- Automatic MCP tool selection from task patterns
- Integration with existing 14 MCP executors
- Tool execution results stored in RAG for learning

---

### Phase 4: Sub-Agent Orchestration (Days 8-9)
**Files to Create**:
- `src/agents/sub-agent-factory.ts`

**New Features**:
- Temporary sub-agent creation
- 30-second sync cycles
- RAG-based conflict resolution
- Automatic cleanup on phase completion

**Deliverables**:
- Parallel task execution via sub-agents
- Cross-agent synchronization
- Conflict detection and resolution
- Final state preservation in RAG

---

### Phase 5: Context Preservation (Day 10)
**Files to Enhance**:
- `src/conversation-backup-manager.ts` - Add `linkEpicsToConversation()`

**Files to Create**:
- `src/rag/epic-memory-store.ts`

**New Features**:
- Epic-conversation linking
- Epic state storage in RAG
- Epic-aware resume context

**Deliverables**:
- Zero context loss for epics across sessions
- `/resume` command loads epic state
- Epic history query from RAG

---

## ✅ Success Criteria

### Technical Metrics
- ✅ Epic detection accuracy: >85%
- ✅ Story generation quality: >90% acceptance
- ✅ Task breakdown completeness: >95%
- ✅ Agent activation time: <1000ms (with pool)
- ✅ Sub-agent sync latency: <100ms
- ✅ Context retention: 98%+ (RAG)
- ✅ Quality gate pass rate: >90%

### Business Metrics
- ✅ Development velocity: +300% (automated epic breakdown)
- ✅ Context loss: -100% (RAG + conversation backup)
- ✅ Manual effort: -80% (automated story/task generation)
- ✅ Cross-session continuity: 100% (resume with full context)

---

## 🚀 Key Benefits

1. **100% Proactive**: Epic workflows happen automatically from conversation
2. **Zero Breaking Changes**: All enhancements extend existing systems
3. **Production Ready**: Uses existing MCP executors (Octokit, Playwright, etc.)
4. **RAG Native**: Context preserved across sessions with zero loss
5. **Flywheel Integrated**: Epic phases map to existing SDLC orchestration
6. **Sub-Agent Sync**: Parallel execution with automatic conflict resolution
7. **CTO-Level Intelligence**: Epic → Stories → Tasks → Execution fully automated

---

## 📝 Next Steps

1. **Review & Approve**: Team review of architecture plan
2. **Phase 1 Kickoff**: Begin epic detection implementation
3. **Integration Testing**: Test with existing VERSATIL components
4. **Documentation**: Update docs for epic workflow
5. **Production Deployment**: Gradual rollout with monitoring

---

**Plan Version**: 1.0.0
**Last Updated**: 2025-10-08
**Status**: Ready for Implementation
**Estimated Completion**: 10 days
