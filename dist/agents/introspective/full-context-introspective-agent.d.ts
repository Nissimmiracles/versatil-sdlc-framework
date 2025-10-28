/**
 * VERSATIL SDLC Framework v1.3.0 - Full Context Introspective Agent
 * Has complete visibility into all systems, agents, and memory
 * Based on context engineering patterns
 */
import { BaseAgent, AgentActivationContext, AgentResponse } from '../base-agent.js';
import { AgentRegistry } from '../agent-registry.js';
export interface SystemContext {
    agents: {
        active: string[];
        performance: Record<string, AgentMetrics>;
        interactions: AgentInteraction[];
    };
    memory: {
        totalMemories: number;
        recentQueries: RAGQuery[];
        patterns: Pattern[];
    };
    repository: {
        structure: any;
        changes: GitChange[];
        dependencies: any;
    };
    stack: {
        supabase: SupabaseContext;
        vercel: VercelContext;
        n8n: N8NContext;
        claude: ClaudeContext;
    };
    plans: {
        active: Plan[];
        completed: Plan[];
        success_rate: number;
    };
}
interface AgentMetrics {
    activations: number;
    successRate: number;
    avgResponseTime: number;
    errors: number;
    lastActive: Date;
}
interface AgentInteraction {
    from: string;
    to: string;
    type: string;
    timestamp: Date;
    context: any;
}
interface RAGQuery {
    query: string;
    results: number;
    timestamp: Date;
    agent: string;
}
interface Pattern {
    type: string;
    frequency: number;
    description: string;
    recommendation?: string;
}
interface GitChange {
    file: string;
    type: 'added' | 'modified' | 'deleted';
    lines: {
        added: number;
        removed: number;
    };
    timestamp: Date;
}
interface SupabaseContext {
    tables: string[];
    functions: string[];
    policies: number;
    realtimeChannels: string[];
}
interface VercelContext {
    deployments: number;
    domains: string[];
    functions: string[];
    environment: string;
}
interface N8NContext {
    workflows: number;
    activeWorkflows: number;
    executions: number;
    triggers: string[];
}
interface ClaudeContext {
    model: string;
    tokensUsed: number;
    conversations: number;
    mcpConnections: string[];
}
interface Plan {
    id: string;
    status: 'active' | 'completed' | 'failed';
    phases: number;
    progress: number;
    created: Date;
}
export declare class FullContextIntrospectiveAgent extends BaseAgent {
    specialization: string;
    systemPrompt: string;
    name: string;
    id: string;
    capabilities: string[];
    private logger;
    private agentRegistry;
    private lastAnalysis;
    private continuousMonitoring;
    constructor(agentRegistry: AgentRegistry);
    private generateSystemPrompt;
    /**
     * Get complete system context
     */
    getFullSystemContext(): Promise<SystemContext>;
    /**
     * Analyze all agents in the system
     */
    private analyzeAgents;
    /**
     * Analyze RAG memory system
     */
    private analyzeMemory;
    /**
     * Analyze repository structure and changes
     */
    private analyzeRepository;
    /**
     * Analyze stack integrations
     */
    private analyzeStack;
    /**
     * Analyze plans and execution
     */
    private analyzePlans;
    /**
     * Main activation method
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Analyze overall system health
     */
    private analyzeSystemHealth;
    /**
     * Detect system bottlenecks
     */
    private detectBottlenecks;
    /**
     * Find optimization opportunities
     */
    private findOptimizations;
    /**
     * Generate actionable recommendations
     */
    private generateRecommendations;
    /**
     * Learn from analysis for future improvements
     */
    private learnFromAnalysis;
    /**
     * Start continuous monitoring
     */
    private startContinuousMonitoring;
    private getAgentMetrics;
    private getAgentInteractions;
    private getRecentRAGQueries;
    private detectMemoryPatterns;
    private scanRepository;
    private getRecentChanges;
    private analyzeSupabase;
    private analyzeVercel;
    private analyzeN8N;
    private analyzeClaude;
    private getPlans;
    private storeSystemContext;
    private assessAgentHealth;
    private assessMemoryHealth;
    private assessStackHealth;
    private analyzeCollaborationPatterns;
    private analyzeMemoryUsage;
    private analyzeStackUsage;
    private performComprehensiveAnalysis;
    private determineHandoffs;
    private determinePriority;
    private getResponsibleAgent;
    private canAutomate;
    private detectChanges;
    private handleSystemChanges;
    private analyzePatterns;
}
export {};
