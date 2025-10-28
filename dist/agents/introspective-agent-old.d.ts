import { BaseAgent, AgentResponse, AgentActivationContext } from './base-agent.js';
export interface IntrospectionResult {
    insights: Insight[];
    recommendations: Recommendation[];
    timestamp: number;
    confidence: number;
    healthScore: number;
}
export interface Insight {
    type: string;
    description: string;
    confidence: number;
    impact?: string;
    actionable?: boolean;
}
export interface Recommendation {
    type: string;
    message: string;
    priority: string;
    estimatedEffort?: string;
    autoFixable?: boolean;
}
export interface ImprovementRecord {
    id: string;
    timestamp: number;
    description: string;
    impact: string;
    success: boolean;
}
export interface FrameworkHealth {
    score: number;
    configFiles: {
        [key: string]: boolean;
    };
    dependencies: {
        total: number;
        outdated: number;
    };
    vulnerabilities: number;
    issues: string[];
}
export interface PerformanceMetrics {
    buildTime: number;
    testTime: number;
    lintTime: number;
    memoryUsage: NodeJS.MemoryUsage;
}
/**
 * IntrospectiveAgent - Self-Monitoring & Optimization Controller
 *
 * Responsible for:
 * - Framework health monitoring
 * - Performance optimization
 * - Pattern recognition and learning
 * - Autonomous improvements
 */
export declare class IntrospectiveAgent extends BaseAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    private logger;
    private performanceMonitor;
    private learningInsights;
    private improvementHistory;
    constructor();
    /**
     * Main activation method - performs comprehensive introspective analysis
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Assess framework health by checking configuration files and dependencies
     */
    private assessFrameworkHealth;
    /**
     * Analyze framework performance metrics
     */
    private analyzePerformance;
    /**
     * Execute command with timeout
     */
    private execWithTimeout;
    /**
     * Discover code patterns and anti-patterns
     */
    private discoverPatterns;
    /**
     * Find large files in the project
     */
    private findLargeFiles;
    /**
     * Perform meta-learning from historical data
     */
    private performMetaLearning;
    /**
     * Calculate confidence based on analysis results
     */
    private calculateConfidence;
    /**
     * Generate actionable suggestions based on analysis
     */
    private generateSuggestions;
    /**
     * Determine agent handoffs based on suggestions
     */
    private determineHandoffsFromAnalysis;
    /**
     * Calculate priority based on suggestions
     */
    private calculatePriorityFromSuggestions;
    /**
     * Trigger introspection process
     */
    triggerIntrospection(): Promise<IntrospectionResult>;
    /**
     * Get learning insights
     */
    getLearningInsights(): Map<string, Insight>;
    /**
     * Get improvement history
     */
    getImprovementHistory(): ImprovementRecord[];
    /**
     * Add learning insight
     */
    addLearningInsight(key: string, insight: Insight): void;
    /**
     * Record improvement
     */
    recordImprovement(record: ImprovementRecord): void;
    calculatePriority(issues: any[]): number;
    determineHandoffs(issues: any[]): string[];
    generateActionableRecommendations(issues: any[]): string[];
    generateEnhancedReport(issues: any[], metadata?: any): any;
    getScoreEmoji(score: number): string;
    extractAgentName(text: string): string;
    protected analyzeCrossFileConsistency(context: AgentActivationContext): Record<string, string>;
    hasConfigurationInconsistencies(context: any): boolean;
}
