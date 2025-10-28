/**
 * IntrospectiveAgent - Testable without mocks
 * Uses dependency injection for real testing
 */
import { BaseAgent, AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
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
export interface FileSystemProvider {
    fileExists(path: string): Promise<boolean>;
    readFile(path: string): Promise<string>;
}
export interface CommandExecutor {
    execute(command: string, timeoutMs: number): Promise<{
        stdout: string;
        stderr: string;
    }>;
}
export declare class RealFileSystemProvider implements FileSystemProvider {
    fileExists(path: string): Promise<boolean>;
    readFile(path: string): Promise<string>;
}
export declare class RealCommandExecutor implements CommandExecutor {
    execute(command: string, timeoutMs: number): Promise<{
        stdout: string;
        stderr: string;
    }>;
}
export declare class TestFileSystemProvider implements FileSystemProvider {
    private files;
    constructor(initialFiles?: {
        [path: string]: string;
    });
    fileExists(path: string): Promise<boolean>;
    readFile(path: string): Promise<string>;
    addFile(path: string, content: string): void;
}
export declare class TestCommandExecutor implements CommandExecutor {
    private responses;
    execute(command: string, timeoutMs: number): Promise<{
        stdout: string;
        stderr: string;
    }>;
    setResponse(command: string, stdout: string, stderr?: string, delay?: number): void;
}
/**
 * IntrospectiveAgent - Testable implementation
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
    private fileSystem;
    private commandExecutor;
    constructor(fileSystem?: FileSystemProvider, commandExecutor?: CommandExecutor);
    /**
     * Main activation method
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Assess framework health
     */
    private assessFrameworkHealth;
    /**
     * Analyze performance
     */
    private analyzePerformance;
    /**
     * Discover patterns
     */
    private discoverPatterns;
    /**
     * Perform meta-learning
     */
    private performMetaLearning;
    private calculateConfidence;
    private generateSuggestions;
    private determineHandoffsFromAnalysis;
    private calculatePriorityFromSuggestions;
    triggerIntrospection(): Promise<IntrospectionResult>;
    getLearningInsights(): Map<string, Insight>;
    getImprovementHistory(): ImprovementRecord[];
    calculatePriority(issues: any[]): number;
    determineHandoffs(issues: any[]): string[];
    generateActionableRecommendations(issues: any[]): string[];
    generateEnhancedReport(issues: any[], metadata?: any): any;
    getScoreEmoji(score: number): string;
    extractAgentName(text: string): string;
    protected analyzeCrossFileConsistency(context: AgentActivationContext): Record<string, string>;
    hasConfigurationInconsistencies(context: any): boolean;
}
