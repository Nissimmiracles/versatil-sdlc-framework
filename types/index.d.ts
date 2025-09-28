/**
 * VERSATIL SDLC Framework v1.2.0
 * TypeScript Type Definitions
 */

declare module 'versatil-sdlc-framework' {
  // RAG Memory Types
  export interface MemoryDocument {
    id: string;
    content: string;
    embedding?: number[];
    metadata: {
      agentId: string;
      timestamp: number;
      fileType?: string;
      projectContext?: string;
      tags: string[];
      relevanceScore?: number;
    };
  }

  export interface RAGQuery {
    query: string;
    agentId?: string;
    topK?: number;
    filters?: {
      timeRange?: { start: number; end: number };
      tags?: string[];
      fileTypes?: string[];
    };
  }

  export interface RAGResult {
    documents: MemoryDocument[];
    queryEmbedding?: number[];
    processingTime: number;
  }

  export class VectorMemoryStore {
    storeMemory(doc: Omit<MemoryDocument, 'id' | 'embedding'>): Promise<string>;
    queryMemories(query: RAGQuery): Promise<RAGResult>;
    updateMemoryRelevance(memoryId: string, feedback: 'helpful' | 'not_helpful'): Promise<void>;
  }

  // Archon Types
  export interface ArchonGoal {
    id: string;
    type: 'feature' | 'bug_fix' | 'optimization' | 'refactor' | 'security';
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    constraints: string[];
    successCriteria: string[];
    deadline?: Date;
  }

  export interface ArchonDecision {
    id: string;
    timestamp: number;
    goalId: string;
    decision: string;
    reasoning: string;
    confidence: number;
    selectedAgents: string[];
    executionPlan: ExecutionStep[];
    alternativePlans?: ExecutionPlan[];
  }

  export interface ExecutionStep {
    stepId: string;
    agentId: string;
    action: string;
    inputs: Record<string, any>;
    expectedOutput: string;
    dependencies: string[];
    timeEstimate: number;
  }

  export interface ExecutionPlan {
    planId: string;
    steps: ExecutionStep[];
    estimatedDuration: number;
    riskScore: number;
    confidence: number;
  }

  export interface ArchonState {
    currentGoals: ArchonGoal[];
    activeDecisions: ArchonDecision[];
    executionQueue: ExecutionStep[];
    completedSteps: string[];
    performance: {
      successRate: number;
      averageExecutionTime: number;
      goalCompletionRate: number;
    };
  }

  export class ArchonOrchestrator {
    addGoal(goal: ArchonGoal): Promise<void>;
    getState(): ArchonState;
    pauseAutonomous(): void;
    resumeAutonomous(): void;
    on(event: 'goal_completed' | 'goal_failed' | 'decision_made' | 'step_completed' | 'human_intervention_required', callback: Function): void;
  }

  // Enhanced BMAD Types
  export interface EnhancedBMADConfig {
    ragEnabled: boolean;
    archonEnabled: boolean;
    autonomousMode: boolean;
    memoryDepth: number;
    contextWindowSize: number;
    learningRate: number;
  }

  export interface BMADContext {
    projectId: string;
    phase: string;
    activeAgents: string[];
    memory: any[];
    goals: ArchonGoal[];
    decisions: any[];
  }

  export interface EnhancedAgentResponse extends AgentResponse {
    memories?: any[];
    learnings?: any[];
    autonomousActions?: any[];
  }

  export class EnhancedBMADCoordinator {
    createContext(projectId: string): Promise<BMADContext>;
    getContext(projectId: string): Promise<BMADContext>;
    executeBMADWorkflow(projectId: string, requirements: string): Promise<void>;
    getEnhancedAgent(agentId: string): BaseAgent | undefined;
    setRAGEnabled(enabled: boolean): void;
    setAutonomousMode(enabled: boolean): void;
    getPerformanceMetrics(): Promise<any>;
  }

  // Base Types (existing)
  export interface AgentResponse {
    agentId: string;
    message: string;
    suggestions: Recommendation[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    handoffTo: string[];
    context: Record<string, any>;
  }

  export interface AgentActivationContext {
    trigger?: any;
    filePath?: string;
    content?: string;
    errorMessage?: string;
    userRequest?: string;
    contextClarity?: 'clear' | 'ambiguous' | 'missing';
    requiredClarifications?: string[];
    matchedKeywords?: string[];
    emergency?: boolean;
    testing?: boolean;
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
    emergencyType?: string;
    emergencySeverity?: string;
    bridgeInvoked?: boolean;
  }

  export interface Issue {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    file: string;
    line?: number;
    fix?: string;
    preventionStrategy?: string;
    impact?: string;
  }

  export interface Recommendation {
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    actions?: string[];
  }

  export abstract class BaseAgent {
    activate(context: AgentActivationContext): Promise<AgentResponse>;
  }

  // Exports
  export const vectorMemoryStore: VectorMemoryStore;
  export const enhancedBMAD: EnhancedBMADCoordinator;
  
  // Functions
  export function startEnhancedServer(): Promise<void>;
  export function startAutonomousMode(): Promise<void>;
}
