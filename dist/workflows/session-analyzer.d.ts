/**
 * VERSATIL Session Analyzer
 *
 * Analyzes completed sessions to extract learnings for RAG storage.
 * Part of the stop hook learning codification workflow.
 *
 * Responsibilities:
 * - Analyze session metrics and outcomes
 * - Extract code patterns from git diff
 * - Identify agent performance patterns
 * - Calculate effort estimation accuracy
 * - Detect successful patterns and anti-patterns
 *
 * Integration: Called by stop hook at session end
 */
import { SessionSummary } from '../tracking/session-manager.js';
export interface CodeChange {
    file: string;
    additions: number;
    deletions: number;
    language: string;
    type: 'component' | 'test' | 'api' | 'config' | 'documentation' | 'other';
    content: string;
}
export interface AgentPerformance {
    agentId: string;
    activations: number;
    successRate: number;
    timeSaved: number;
    averageDuration: number;
    primaryPatterns: string[];
    effectiveness: 'high' | 'medium' | 'low';
}
export interface EffortAnalysis {
    estimatedMinutes: number;
    actualMinutes: number;
    accuracy: number;
    variance: number;
    trend: 'overestimated' | 'accurate' | 'underestimated';
}
export interface SessionAnalysis {
    sessionId: string;
    date: string;
    duration: number;
    productivity: {
        timeSaved: number;
        productivityGain: number;
        efficiency: number;
    };
    codeChanges: CodeChange[];
    agentPerformance: AgentPerformance[];
    effortAnalysis: EffortAnalysis;
    qualityMetrics: {
        averageQuality: number;
        testCoverage?: number;
        buildSuccess: boolean;
        lintWarnings: number;
    };
    patterns: {
        successful: string[];
        needsImprovement: string[];
    };
    metadata: {
        branch: string;
        commitsCreated: number;
        filesModified: number;
        linesAdded: number;
        linesDeleted: number;
    };
}
export declare class SessionAnalyzer {
    private logger;
    private projectPath;
    constructor(projectPath?: string);
    /**
     * Main entry point: Analyze completed session
     */
    analyzeSession(sessionSummary: SessionSummary): Promise<SessionAnalysis>;
    /**
     * Analyze code changes from git diff
     */
    private analyzeCodeChanges;
    /**
     * Analyze last commit if no uncommitted changes
     */
    private analyzeLastCommit;
    /**
     * Safely read file content
     */
    private readFileSafely;
    /**
     * Detect programming language from file extension
     */
    private detectLanguage;
    /**
     * Categorize file type
     */
    private categorizeFileType;
    /**
     * Analyze agent performance
     */
    private analyzeAgentPerformance;
    /**
     * Calculate agent effectiveness
     */
    private calculateEffectiveness;
    /**
     * Analyze effort estimation accuracy
     */
    private analyzeEffortAccuracy;
    /**
     * Analyze quality metrics
     */
    private analyzeQualityMetrics;
    /**
     * Identify successful patterns and areas for improvement
     */
    private identifyPatterns;
    /**
     * Extract session metadata
     */
    private extractMetadata;
    /**
     * Get current git branch
     */
    private getCurrentBranch;
    /**
     * Get number of commits created in this session
     */
    private getRecentCommits;
    /**
     * Get git statistics
     */
    private getGitStats;
}
/**
 * Factory function for SessionAnalyzer
 */
export declare function createSessionAnalyzer(projectPath?: string): SessionAnalyzer;
