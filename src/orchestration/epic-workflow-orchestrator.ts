/**
 * VERSATIL Framework - Epic Workflow Orchestrator
 * Orchestrates epic → stories → tasks → sub-agents workflow
 *
 * Features:
 * - Automatic epic breakdown into user stories and tasks
 * - Priority-based task scheduling
 * - Sub-agent assignment and coordination
 * - Conflict resolution integration
 * - Progress tracking and reporting
 * - RAG-based learning from past epics
 *
 * Workflow:
 * 1. Epic detected (from Epic Conversation Analyzer)
 * 2. Alex-BA: Break into user stories
 * 3. Sarah-PM: Break stories into tasks
 * 4. Priority Scoring: Assign priorities to tasks
 * 5. Sub-Agent Factory: Create specialized sub-agents
 * 6. Conflict Resolution: Manage parallel execution
 * 7. Progress tracking: Monitor completion
 */

import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import { PriorityScoringEngine } from './priority-scoring-engine.js';
import { ConflictResolutionEngine } from './conflict-resolution-engine.js';
import type { EpicDetectionResult } from '../intelligence/epic-conversation-analyzer.js';
import type { SubAgent } from './conflict-resolution-engine.js';
import type { TaskContext } from './priority-scoring-engine.js';

export interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed' | 'blocked' | 'cancelled';
  priority: 'p0-critical' | 'p1-high' | 'p2-medium' | 'p3-low';
  complexity: 'low' | 'medium' | 'high' | 'very-high';

  // Breakdown
  stories: UserStory[];
  totalTasks: number;
  completedTasks: number;

  // Timeline
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedCompletion?: number;

  // Metadata
  createdBy: 'user' | 'conversation-analyzer';
  source: string; // Conversation ID or manual entry
  tags: string[];
}

export interface UserStory {
  id: string;
  epicId: string;
  title: string;
  description: string; // "As a [user], I want [goal], so that [benefit]"
  acceptanceCriteria: string[];
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  status: 'todo' | 'in-progress' | 'review' | 'done';

  // Tasks
  tasks: Task[];

  // Assignment
  assignedAgent?: 'alex-ba' | 'marcus-backend' | 'james-frontend' | 'maria-qa' | 'sarah-pm' | 'dr-ai-ml';

  // Timeline
  createdAt: number;
  completedAt?: number;
}

export interface Task {
  id: string;
  storyId: string;
  epicId: string;
  title: string;
  description: string;
  type: 'development' | 'testing' | 'documentation' | 'research' | 'devops';
  status: 'pending' | 'assigned' | 'in-progress' | 'blocked' | 'review' | 'completed' | 'failed';

  // Priority and complexity
  priority: number; // 0-10 (from Priority Scoring Engine)
  estimatedEffort: number; // Hours

  // Assignment
  assignedSubAgent?: string; // Sub-agent ID
  assignedTo?: SubAgent['type'];

  // Dependencies
  dependsOn: string[]; // Task IDs
  blocks: string[]; // Task IDs

  // Files
  files: string[]; // Files this task will modify

  // Timeline
  createdAt: number;
  startedAt?: number;
  completedAt?: number;

  // Results
  output?: {
    filesModified: string[];
    testsAdded: number;
    linesOfCode: number;
  };
}

export interface WorkflowProgress {
  epicId: string;
  totalStories: number;
  completedStories: number;
  totalTasks: number;
  completedTasks: number;
  percentComplete: number;
  estimatedTimeRemaining: number; // Minutes
  currentPhase: 'planning' | 'development' | 'testing' | 'review' | 'deployment';
  blockers: Blocker[];
  activeSubAgents: number;
}

export interface Blocker {
  taskId: string;
  type: 'dependency' | 'conflict' | 'technical' | 'resource';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestedResolution?: string;
}

export class EpicWorkflowOrchestrator extends EventEmitter {
  private vectorStore: EnhancedVectorMemoryStore;
  private priorityEngine: PriorityScoringEngine;
  private conflictEngine: ConflictResolutionEngine;

  private activeEpics: Map<string, Epic> = new Map();
  private epicHistory: Map<string, Epic> = new Map();
  private subAgentRegistry: Map<string, SubAgent> = new Map();

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super();
    this.vectorStore = vectorStore || new EnhancedVectorMemoryStore();
    this.priorityEngine = new PriorityScoringEngine(this.vectorStore);
    this.conflictEngine = new ConflictResolutionEngine(this.vectorStore);
  }

  async initialize(): Promise<void> {
    console.log('🎯 Epic Workflow Orchestrator initializing...');

    // Initialize sub-engines
    await Promise.all([
      this.priorityEngine.initialize(),
      this.conflictEngine.initialize()
    ]);

    // Load historical epics from RAG
    await this.loadHistoricalEpics();

    this.emit('orchestrator:initialized');
    console.log('✅ Epic Workflow Orchestrator ready');
  }

  /**
   * Start epic workflow (main method)
   */
  async startEpicWorkflow(epicDetection: EpicDetectionResult, conversationId: string): Promise<Epic> {
    console.log(`🎯 Starting epic workflow: ${epicDetection.title}`);

    // STEP 1: Create epic
    const epic = this.createEpic(epicDetection, conversationId);
    this.activeEpics.set(epic.id, epic);

    console.log(`   📋 Epic created: ${epic.id}`);

    try {
      // STEP 2: Break into user stories (Alex-BA agent)
      console.log('   🔄 Step 1/5: Breaking epic into user stories (Alex-BA)...');
      const stories = await this.generateUserStories(epic, epicDetection);
      epic.stories = stories;

      console.log(`      ✅ Generated ${stories.length} user stories`);

      // STEP 3: Break stories into tasks (Sarah-PM agent)
      console.log('   🔄 Step 2/5: Breaking user stories into tasks (Sarah-PM)...');
      for (const story of stories) {
        story.tasks = await this.generateTasks(story, epic);
        epic.totalTasks += story.tasks.length;
      }

      console.log(`      ✅ Generated ${epic.totalTasks} tasks`);

      // STEP 4: Calculate priority scores for all tasks
      console.log('   🔄 Step 3/5: Calculating task priorities...');
      await this.calculateTaskPriorities(epic);

      console.log(`      ✅ Priorities calculated`);

      // STEP 5: Assign tasks to sub-agents
      console.log('   🔄 Step 4/5: Assigning tasks to sub-agents...');
      await this.assignTasksToSubAgents(epic);

      console.log(`      ✅ Tasks assigned to ${this.subAgentRegistry.size} sub-agents`);

      // STEP 6: Start execution (with conflict resolution)
      console.log('   🔄 Step 5/5: Starting parallel execution...');
      epic.status = 'in-progress';
      epic.startedAt = Date.now();
      await this.startParallelExecution(epic);

      console.log(`      ✅ Execution started`);

      // Store in RAG
      await this.storeEpicPattern(epic);

      this.emit('epic:started', {
        epicId: epic.id,
        storiesCount: epic.stories.length,
        tasksCount: epic.totalTasks,
        subAgentsCount: this.subAgentRegistry.size
      });

      console.log(`✅ Epic workflow started: ${epic.id}`);

      return epic;
    } catch (error: any) {
      epic.status = 'blocked';
      console.error(`❌ Epic workflow failed:`, error.message);

      this.emit('epic:failed', {
        epicId: epic.id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Create epic from detection result
   */
  private createEpic(detection: EpicDetectionResult, conversationId: string): Epic {
    return {
      id: `epic-${Date.now()}`,
      title: detection.title,
      description: detection.description,
      status: 'planning',
      priority: detection.priority,
      complexity: detection.complexity,
      stories: [],
      totalTasks: 0,
      completedTasks: 0,
      createdAt: Date.now(),
      estimatedCompletion: Date.now() + (detection.estimatedEffort.development * 24 * 60 * 60 * 1000),
      createdBy: 'conversation-analyzer',
      source: conversationId,
      tags: [detection.epicType, ...detection.techStack]
    };
  }

  /**
   * Generate user stories from epic (Alex-BA agent simulation)
   */
  private async generateUserStories(epic: Epic, detection: EpicDetectionResult): Promise<UserStory[]> {
    const stories: UserStory[] = [];

    // Generate stories from objectives
    for (let i = 0; i < detection.objectives.length; i++) {
      const objective = detection.objectives[i];

      // Convert objective to user story format
      const userStory = this.convertToUserStory(objective, epic, i);
      stories.push(userStory);
    }

    // Generate stories from requirements (if no objectives)
    if (stories.length === 0) {
      const mustHaveReqs = detection.requirements.filter(r => r.priority === 'must-have');

      for (let i = 0; i < mustHaveReqs.length; i++) {
        const req = mustHaveReqs[i];
        const userStory: UserStory = {
          id: `story-${epic.id}-${i + 1}`,
          epicId: epic.id,
          title: req.description.substring(0, 100),
          description: `As a user, I want ${req.description}, so that I can use the feature`,
          acceptanceCriteria: [`${req.description} is implemented and working`],
          priority: 'must-have',
          status: 'todo',
          tasks: [],
          createdAt: Date.now()
        };
        stories.push(userStory);
      }
    }

    // Ensure at least one story
    if (stories.length === 0) {
      stories.push({
        id: `story-${epic.id}-1`,
        epicId: epic.id,
        title: epic.title,
        description: `As a user, I want ${epic.description}, so that I can achieve my goals`,
        acceptanceCriteria: ['Feature is implemented', 'Tests pass', 'Documentation is updated'],
        priority: 'must-have',
        status: 'todo',
        tasks: [],
        createdAt: Date.now()
      });
    }

    return stories;
  }

  /**
   * Convert objective to user story format
   */
  private convertToUserStory(objective: string, epic: Epic, index: number): UserStory {
    // Try to extract actor, action, benefit
    const match = objective.match(/(.*?)\s+(?:wants?|needs?|should)\s+(.*?)(?:\s+so\s+that\s+(.*))?$/i);

    let description: string;
    if (match) {
      const actor = match[1] || 'user';
      const action = match[2];
      const benefit = match[3] || 'achieve goals';
      description = `As a ${actor}, I want to ${action}, so that I can ${benefit}`;
    } else {
      description = `As a user, I want to ${objective}, so that I can achieve my goals`;
    }

    return {
      id: `story-${epic.id}-${index + 1}`,
      epicId: epic.id,
      title: objective.substring(0, 100),
      description,
      acceptanceCriteria: this.generateAcceptanceCriteria(objective),
      priority: 'must-have',
      status: 'todo',
      tasks: [],
      createdAt: Date.now()
    };
  }

  /**
   * Generate acceptance criteria
   */
  private generateAcceptanceCriteria(objective: string): string[] {
    return [
      `${objective} is fully implemented`,
      'All tests pass (unit + integration)',
      'Code review completed',
      'Documentation updated'
    ];
  }

  /**
   * Generate tasks from user story (Sarah-PM agent simulation)
   */
  private async generateTasks(story: UserStory, epic: Epic): Promise<Task[]> {
    const tasks: Task[] = [];

    // Standard task breakdown for every story:
    // 1. Requirements analysis (Alex-BA)
    // 2. Backend implementation (Marcus)
    // 3. Frontend implementation (James)
    // 4. Testing (Maria)
    // 5. Documentation (Sarah-PM)

    // Task 1: Requirements analysis
    tasks.push({
      id: `task-${story.id}-req`,
      storyId: story.id,
      epicId: epic.id,
      title: `Analyze requirements for ${story.title}`,
      description: `Review and refine acceptance criteria for: ${story.description}`,
      type: 'research',
      status: 'pending',
      priority: 0, // Will be calculated
      estimatedEffort: 2, // 2 hours
      dependsOn: [],
      blocks: [], // Will be filled
      files: [],
      createdAt: Date.now()
    });

    // Task 2: Backend implementation (if needed)
    if (this.needsBackend(story)) {
      tasks.push({
        id: `task-${story.id}-backend`,
        storyId: story.id,
        epicId: epic.id,
        title: `Implement backend for ${story.title}`,
        description: `Create API endpoints, database models, and business logic`,
        type: 'development',
        status: 'pending',
        priority: 0,
        estimatedEffort: 8, // 8 hours
        dependsOn: [`task-${story.id}-req`],
        blocks: [],
        files: [], // Will be inferred
        assignedTo: 'marcus-backend',
        createdAt: Date.now()
      });
    }

    // Task 3: Frontend implementation
    if (this.needsFrontend(story)) {
      const frontendTask: Task = {
        id: `task-${story.id}-frontend`,
        storyId: story.id,
        epicId: epic.id,
        title: `Implement UI for ${story.title}`,
        description: `Create React components, forms, and user interactions`,
        type: 'development',
        status: 'pending',
        priority: 0,
        estimatedEffort: 6, // 6 hours
        dependsOn: [`task-${story.id}-req`],
        blocks: [],
        files: [],
        assignedTo: 'james-frontend',
        createdAt: Date.now()
      };

      // If backend exists, frontend depends on it
      if (tasks.some(t => t.id === `task-${story.id}-backend`)) {
        frontendTask.dependsOn.push(`task-${story.id}-backend`);
      }

      tasks.push(frontendTask);
    }

    // Task 4: Testing (always needed)
    const testDependencies = [
      `task-${story.id}-req`,
      ...tasks.filter(t => t.type === 'development').map(t => t.id)
    ];

    tasks.push({
      id: `task-${story.id}-test`,
      storyId: story.id,
      epicId: epic.id,
      title: `Write tests for ${story.title}`,
      description: `Create unit tests, integration tests, and E2E tests`,
      type: 'testing',
      status: 'pending',
      priority: 0,
      estimatedEffort: 4, // 4 hours
      dependsOn: testDependencies,
      blocks: [],
      files: [],
      assignedTo: 'maria-qa',
      createdAt: Date.now()
    });

    // Task 5: Documentation
    tasks.push({
      id: `task-${story.id}-docs`,
      storyId: story.id,
      epicId: epic.id,
      title: `Document ${story.title}`,
      description: `Update README, API docs, and user guides`,
      type: 'documentation',
      status: 'pending',
      priority: 0,
      estimatedEffort: 2, // 2 hours
      dependsOn: testDependencies,
      blocks: [],
      files: [],
      assignedTo: 'sarah-pm',
      createdAt: Date.now()
    });

    // Set "blocks" relationships
    for (const task of tasks) {
      for (const depId of task.dependsOn) {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) {
          depTask.blocks.push(task.id);
        }
      }
    }

    return tasks;
  }

  /**
   * Check if story needs backend implementation
   */
  private needsBackend(story: UserStory): boolean {
    const backendKeywords = ['api', 'database', 'server', 'backend', 'data', 'store', 'save', 'persist'];
    const text = `${story.title} ${story.description}`.toLowerCase();
    return backendKeywords.some(kw => text.includes(kw));
  }

  /**
   * Check if story needs frontend implementation
   */
  private needsFrontend(story: UserStory): boolean {
    const frontendKeywords = ['ui', 'user interface', 'form', 'button', 'page', 'component', 'display', 'show'];
    const text = `${story.title} ${story.description}`.toLowerCase();
    return frontendKeywords.some(kw => text.includes(kw)) || !this.needsBackend(story); // Default to frontend
  }

  /**
   * Calculate priority scores for all tasks
   */
  private async calculateTaskPriorities(epic: Epic): Promise<void> {
    const allTasks = epic.stories.flatMap(s => s.tasks);

    for (const task of allTasks) {
      const context: TaskContext = {
        taskId: task.id,
        taskType: 'task',
        agentType: task.assignedTo || 'sarah-pm',
        description: task.description,
        files: task.files,
        criticality: epic.priority,
        dependencies: task.dependsOn,
        blockedBy: task.blocks,
        estimatedDuration: task.estimatedEffort * 60, // Convert to minutes
        epicId: epic.id,
        epicPriority: this.mapPriorityToNumber(epic.priority)
      };

      const priorityScore = await this.priorityEngine.calculatePriority(context);
      task.priority = priorityScore.total;
    }
  }

  /**
   * Map priority string to number
   */
  private mapPriorityToNumber(priority: Epic['priority']): number {
    const map = { 'p0-critical': 10, 'p1-high': 7, 'p2-medium': 5, 'p3-low': 3 };
    return map[priority];
  }

  /**
   * Assign tasks to sub-agents
   */
  private async assignTasksToSubAgents(epic: Epic): Promise<void> {
    const allTasks = epic.stories.flatMap(s => s.tasks);

    // Group tasks by agent type
    const tasksByAgent = new Map<SubAgent['type'], Task[]>();
    for (const task of allTasks) {
      if (!task.assignedTo) continue;

      if (!tasksByAgent.has(task.assignedTo)) {
        tasksByAgent.set(task.assignedTo, []);
      }
      tasksByAgent.get(task.assignedTo)!.push(task);
    }

    // Create sub-agents
    for (const [agentType, tasks] of tasksByAgent.entries()) {
      const subAgent: SubAgent = {
        id: `${agentType}-${epic.id}-${Date.now()}`,
        type: agentType,
        taskId: tasks[0].id, // Primary task
        priority: Math.max(...tasks.map(t => t.priority)), // Highest priority among tasks
        files: [...new Set(tasks.flatMap(t => t.files))], // All files
        startTime: Date.now(),
        status: 'pending',
        parentEpicId: epic.id,
        dependencies: []
      };

      this.subAgentRegistry.set(subAgent.id, subAgent);

      // Assign sub-agent ID to tasks
      for (const task of tasks) {
        task.assignedSubAgent = subAgent.id;
      }

      // Register with conflict engine
      await this.conflictEngine.registerAgent(subAgent);
    }
  }

  /**
   * Start parallel execution (with conflict resolution)
   */
  private async startParallelExecution(epic: Epic): Promise<void> {
    // Get all pending sub-agents
    const pendingAgents = Array.from(this.subAgentRegistry.values()).filter(a =>
      a.parentEpicId === epic.id && a.status === 'pending'
    );

    console.log(`   🚀 Starting ${pendingAgents.length} sub-agents in parallel...`);

    // Start agents (conflict engine will manage conflicts)
    for (const agent of pendingAgents) {
      await this.conflictEngine.updateAgentStatus(agent.id, 'running');

      // Simulate agent execution (in real implementation, this would call actual agents)
      this.simulateAgentExecution(agent, epic);
    }
  }

  /**
   * Simulate agent execution (placeholder for real agent execution)
   */
  private simulateAgentExecution(agent: SubAgent, epic: Epic): void {
    // In real implementation, this would:
    // 1. Call actual agent (Marcus, James, Maria, etc.)
    // 2. Execute tasks assigned to this sub-agent
    // 3. Monitor progress
    // 4. Update task status
    // 5. Handle conflicts via conflict engine
    // 6. Report completion

    console.log(`      🤖 ${agent.id} starting execution (${agent.files.length} files)...`);

    // Simulate async execution
    setTimeout(async () => {
      await this.conflictEngine.updateAgentStatus(agent.id, 'completed');
      this.handleAgentCompletion(agent, epic);
    }, 5000); // 5 seconds simulation
  }

  /**
   * Handle agent completion
   */
  private async handleAgentCompletion(agent: SubAgent, epic: Epic): Promise<void> {
    console.log(`      ✅ ${agent.id} completed`);

    // Update task statuses
    for (const story of epic.stories) {
      for (const task of story.tasks) {
        if (task.assignedSubAgent === agent.id) {
          task.status = 'completed';
          task.completedAt = Date.now();
          epic.completedTasks++;
        }
      }
    }

    // Check if epic is complete
    if (epic.completedTasks === epic.totalTasks) {
      epic.status = 'completed';
      epic.completedAt = Date.now();

      this.emit('epic:completed', {
        epicId: epic.id,
        duration: epic.completedAt - (epic.startedAt || epic.createdAt),
        tasksCompleted: epic.completedTasks
      });

      console.log(`🎉 Epic completed: ${epic.id}`);
    }
  }

  /**
   * Get workflow progress
   */
  getProgress(epicId: string): WorkflowProgress | null {
    const epic = this.activeEpics.get(epicId);
    if (!epic) return null;

    const completedStories = epic.stories.filter(s => s.status === 'done').length;
    const percentComplete = epic.totalTasks > 0 ? (epic.completedTasks / epic.totalTasks) * 100 : 0;

    // Estimate time remaining
    const completedTime = Date.now() - (epic.startedAt || epic.createdAt);
    const estimatedTotal = percentComplete > 0 ? (completedTime / percentComplete) * 100 : 0;
    const estimatedTimeRemaining = Math.max(0, estimatedTotal - completedTime) / (1000 * 60); // Minutes

    // Find blockers
    const blockers: Blocker[] = [];
    for (const story of epic.stories) {
      for (const task of story.tasks) {
        if (task.status === 'blocked') {
          blockers.push({
            taskId: task.id,
            type: 'dependency',
            description: `Task blocked: ${task.title}`,
            severity: 'high',
            suggestedResolution: 'Resolve dependencies first'
          });
        }
      }
    }

    // Determine current phase
    let currentPhase: WorkflowProgress['currentPhase'] = 'planning';
    if (epic.status === 'in-progress') {
      const developmentTasks = epic.stories.flatMap(s => s.tasks.filter(t => t.type === 'development'));
      const testingTasks = epic.stories.flatMap(s => s.tasks.filter(t => t.type === 'testing'));

      if (developmentTasks.some(t => t.status === 'in-progress')) currentPhase = 'development';
      else if (testingTasks.some(t => t.status === 'in-progress')) currentPhase = 'testing';
      else if (epic.completedTasks > epic.totalTasks * 0.8) currentPhase = 'review';
    }

    const activeSubAgents = Array.from(this.subAgentRegistry.values()).filter(a =>
      a.parentEpicId === epicId && a.status === 'running'
    ).length;

    return {
      epicId,
      totalStories: epic.stories.length,
      completedStories,
      totalTasks: epic.totalTasks,
      completedTasks: epic.completedTasks,
      percentComplete,
      estimatedTimeRemaining,
      currentPhase,
      blockers,
      activeSubAgents
    };
  }

  /**
   * Store epic pattern in RAG
   */
  private async storeEpicPattern(epic: Epic): Promise<void> {
    const pattern = {
      epicId: epic.id,
      title: epic.title,
      priority: epic.priority,
      complexity: epic.complexity,
      storiesCount: epic.stories.length,
      tasksCount: epic.totalTasks,
      tags: epic.tags,
      timestamp: epic.createdAt
    };

    try {
      await this.vectorStore.storeMemory(
        `Epic workflow: ${epic.title} - ${epic.description}`,
        'epic-workflows',
        pattern
      );
    } catch (error) {
      console.warn('Failed to store epic pattern in RAG:', error);
    }
  }

  /**
   * Load historical epics from RAG
   */
  private async loadHistoricalEpics(): Promise<void> {
    try {
      const epics = await this.vectorStore.queryMemory('epic workflows', 'epic-workflows', 100);
      console.log(`   📚 Loaded ${epics.length} historical epic workflows from RAG`);
    } catch (error) {
      console.warn('   ⚠️  Failed to load historical epics (starting fresh)');
    }
  }

  /**
   * Get epic by ID
   */
  getEpic(epicId: string): Epic | undefined {
    return this.activeEpics.get(epicId) || this.epicHistory.get(epicId);
  }

  /**
   * Get all active epics
   */
  getActiveEpics(): Epic[] {
    return Array.from(this.activeEpics.values());
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown(): Promise<void> {
    await Promise.all([
      this.priorityEngine.shutdown(),
      this.conflictEngine.shutdown()
    ]);

    this.activeEpics.clear();
    this.subAgentRegistry.clear();
    this.emit('orchestrator:shutdown');
    console.log('🛑 Epic Workflow Orchestrator shut down');
  }
}

// Export singleton instance
export const globalEpicWorkflowOrchestrator = new EpicWorkflowOrchestrator();
