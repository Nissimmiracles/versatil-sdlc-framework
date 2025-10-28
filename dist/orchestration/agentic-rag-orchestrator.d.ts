/**
 * VERSATIL SDLC Framework - Agentic RAG Orchestrator
 * Enhanced RAG system specifically for agent collaboration with full context
 */
import { EventEmitter } from 'events';
import { IsolatedPaths } from './isolated-versatil-orchestrator.js';
export interface AgentMemory {
    id: string;
    agentId: string;
    type: 'code' | 'decision' | 'pattern' | 'error' | 'success' | 'learning' | 'rule_execution' | 'cross_rule_optimization';
    content: any;
    context: any;
    timestamp: number;
    relevance?: number;
    tags: string[];
    ruleId?: string;
    ruleType?: 'parallel_execution' | 'stress_testing' | 'daily_audit';
}
export interface FullAgentContext {
    repository: RepositoryContext;
    stack: StackContext;
    ui: UIContext;
    plan: DevelopmentPlan;
    memories: AgentMemory[];
    patterns: Pattern[];
    errors: ErrorContext[];
}
export interface RepositoryContext {
    structure: any;
    dependencies: DependencyGraph;
    history: GitHistory;
    branches: Branch[];
    currentBranch: string;
    uncommittedChanges: FileChange[];
}
export interface StackContext {
    supabase?: {
        schema: any;
        edgeFunctions: EdgeFunction[];
        rlsPolicies: RLSPolicy[];
        realtimeChannels: string[];
    };
    vercel?: {
        config: any;
        env: Record<string, string>;
        analytics: any;
        deployments: Deployment[];
    };
    n8n?: {
        workflows: Workflow[];
        credentials: string[];
        executions: Execution[];
    };
}
export interface UIContext {
    components: ShadcnComponent[];
    theme: ThemeConfig;
    routes: AppRoute[];
    tests: PlaywrightTest[];
    coverage: CoverageReport;
}
export interface DevelopmentPlan {
    current: any;
    progress: number;
    blockers: Blocker[];
    nextSteps: Step[];
    timeline: Timeline;
}
interface DependencyGraph {
    [key: string]: string[];
}
interface GitHistory {
    commits: Commit[];
}
interface Branch {
    name: string;
    lastCommit: string;
}
interface FileChange {
    path: string;
    type: 'added' | 'modified' | 'deleted';
}
interface EdgeFunction {
    name: string;
    path: string;
}
interface RLSPolicy {
    table: string;
    policy: string;
}
interface Deployment {
    id: string;
    url: string;
    status: string;
}
interface Workflow {
    id: string;
    name: string;
    nodes: any[];
}
interface Execution {
    id: string;
    status: string;
    timestamp: number;
}
interface ShadcnComponent {
    name: string;
    path: string;
    props: any;
}
interface ThemeConfig {
    colors: any;
    fonts: any;
}
interface AppRoute {
    path: string;
    component: string;
}
interface PlaywrightTest {
    name: string;
    path: string;
    status: string;
}
interface CoverageReport {
    total: number;
    covered: number;
}
interface Blocker {
    id: string;
    description: string;
    severity: string;
}
interface Step {
    id: string;
    description: string;
    agent: string;
}
interface Timeline {
    start: Date;
    end: Date;
    milestones: Milestone[];
}
interface Milestone {
    name: string;
    date: Date;
    completed: boolean;
}
interface Commit {
    hash: string;
    message: string;
    author: string;
    date: Date;
}
interface Pattern {
    id: string;
    type: string;
    description: string;
    examples: string[];
}
interface ErrorContext {
    id: string;
    error: string;
    solution?: string;
}
export declare class AgenticRAGOrchestrator extends EventEmitter {
    private logger;
    private paths;
    private memoryStores;
    private agentMemories;
    private currentPlan;
    private patternDetector;
    private ruleExecutionMetrics;
    private crossRuleKnowledge;
    constructor(paths: IsolatedPaths);
    initialize(): Promise<void>;
    /**
     * Get full context for a specific agent and task
     */
    getContextForAgent(agentId: string, task: any): Promise<FullAgentContext>;
    /**
     * Get repository context with full awareness
     */
    private getRepositoryContext;
    /**
     * Get stack-specific context
     */
    private getStackContext;
    /**
     * Get UI/UX context
     */
    private getUIContext;
    /**
     * Get current development plan
     */
    private getDevelopmentPlan;
    /**
     * Get relevant memories for agent and task
     */
    private getRelevantMemories;
    /**
     * Get relevant patterns
     */
    private getRelevantPatterns;
    /**
     * Get relevant errors and solutions
     */
    private getRelevantErrors;
    /**
     * Enhance context based on agent specialization
     */
    private enhanceContextForAgent;
    /**
     * Store agent execution for learning
     */
    storeAgentExecution(agentId: string, task: any, context: any, result: any): Promise<void>;
    /**
     * Detect patterns from new memories
     */
    private detectPatterns;
    /**
     * Helper methods for context building
     */
    private scanProjectStructure;
    private buildDependencyGraph;
    private parseGitHistory;
    private getDefaultRepositoryContext;
    private hasSupabase;
    private hasVercel;
    private hasN8N;
    private getSupabaseSchema;
    private getSupabaseEdgeFunctions;
    private getRLSPolicies;
    private getRealtimeChannels;
    private getVercelConfig;
    private getVercelEnv;
    private getVercelAnalytics;
    private getVercelDeployments;
    private getN8NWorkflows;
    private getN8NCredentials;
    private getRecentExecutions;
    private getShadcnComponents;
    private getThemeConfig;
    private getAppRoutes;
    private getPlaywrightTests;
    private getCoverageReport;
    private getCurrentPlan;
    private calculateProgress;
    private identifyBlockers;
    private getNextSteps;
    private getTimeline;
    private getRecencyScore;
    private extractKeywords;
    private isPatternRelevant;
    private getDetailedDependencies;
    private getDetailedComponents;
    private getDetailedSchema;
    private getAllRecentMemories;
    private generateMemoryId;
    private inferMemoryType;
    private generateTags;
    private findSimilarMemories;
    private areSimilar;
    private describePattern;
    private generatePatternId;
    /**
     * Load existing memories from disk
     */
    private loadExistingMemories;
    /**
     * Initialize pattern detection
     */
    private initializePatternDetection;
    /**
     * Get all agent memories
     */
    getAgentMemories(): Promise<Map<string, AgentMemory[]>>;
    /**
     * Cleanup
     */
    shutdown(): Promise<void>;
    searchAllStores(query: any): Promise<any[]>;
    getMemoryStatistics(): Promise<any>;
    /**
     * Store rule execution result for learning
     */
    storeRuleExecution(ruleType: 'parallel_execution' | 'stress_testing' | 'daily_audit', ruleId: string, executionData: any): Promise<void>;
    /**
     * Store cross-rule optimization insights
     */
    storeCrossRuleOptimization(ruleTypes: string[], optimizationData: any): Promise<void>;
    /**
     * Get rule execution insights for optimization
     */
    getRuleExecutionInsights(ruleType?: string): Promise<any>;
    /**
     * Get context enhanced with rule execution memory
     */
    getContextWithRuleMemory(agentId: string, task: any): Promise<FullAgentContext>;
    /**
     * Detect patterns in rule executions
     */
    private detectRulePatterns;
    /**
     * Update rule execution metrics
     */
    private updateRuleMetrics;
    /**
     * Update cross-rule knowledge base
     */
    private updateCrossRuleKnowledge;
    /**
     * Get rule execution memories relevant to current task
     */
    private getRuleExecutionMemories;
    /**
     * Get cross-rule insights for current task
     */
    private getCrossRuleInsights;
    /**
     * Generate rule-specific recommendations
     */
    private generateRuleRecommendations;
    /**
     * Generate cross-rule recommendations
     */
    private generateCrossRuleRecommendations;
    private getSystemLoad;
    private getActiveAgents;
    private getCurrentProjectPhase;
    private getRulePatterns;
    private getCrossRuleOptimizations;
    private findSimilarRuleExecutions;
    private describeRulePattern;
}
export {};
