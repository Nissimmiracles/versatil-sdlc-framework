/**
 * Pattern Learning System
 * Systematically learns YOUR team's winning development patterns
 *
 * This is the key to the intelligence flywheel:
 * - Captures what works for YOUR team
 * - Reinforces successful patterns
 * - Eliminates failed approaches
 * - Builds institutional knowledge
 */
import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
import { AgentResponse, AgentActivationContext } from '../agents/core/base-agent.js';
export interface WinningPattern {
    id: string;
    type: 'development' | 'testing' | 'architecture' | 'deployment' | 'debugging';
    description: string;
    context: string;
    approach: string;
    outcome: 'success' | 'failure';
    successRate: number;
    timesApplied: number;
    averageTimeToComplete: number;
    teamMemberWhoDiscovered?: string;
    tags: string[];
    confidence: number;
    lastUsed: number;
    created: number;
}
export interface TeamDevelopmentStyle {
    preferredArchitectures: string[];
    preferredTestingApproaches: string[];
    preferredNamingConventions: string[];
    preferredCodePatterns: string[];
    avoidedAntiPatterns: string[];
    teamVelocityMetrics: {
        averageFeatureTime: number;
        averageBugFixTime: number;
        codeReviewTurnaround: number;
    };
}
/**
 * Learns YOUR team's systematic winning patterns
 */
export declare class PatternLearningSystem {
    private vectorStore;
    private winningPatterns;
    private teamStyle;
    constructor(vectorStore: EnhancedVectorMemoryStore);
    /**
     * Learn from a successful development session
     * This is called after ANY successful agent interaction
     */
    learnFromSuccess(context: AgentActivationContext, response: AgentResponse, actualOutcome: {
        timeToComplete: number;
        testsPassed: boolean;
        codeReviewed: boolean;
        deployed: boolean;
        userSatisfaction?: number;
    }): Promise<void>;
    /**
     * Learn from a failed approach
     * Equally important - learn what NOT to do
     */
    learnFromFailure(context: AgentActivationContext, response: AgentResponse, failureReason: string, timeWasted: number): Promise<void>;
    /**
     * Extract pattern from interaction
     */
    private extractPattern;
    /**
     * Determine what type of pattern this is
     */
    private determinePatternType;
    /**
     * Extract the approach that was taken
     */
    private extractApproach;
    /**
     * Generate human-readable pattern description
     */
    private generatePatternDescription;
    /**
     * Extract tags for categorization
     */
    private extractTags;
    /**
     * Find similar existing pattern
     */
    private findSimilarPattern;
    /**
     * Reinforce existing pattern (it worked again!)
     */
    private reinforcePattern;
    /**
     * Store new winning pattern
     */
    private storeNewPattern;
    /**
     * Store anti-pattern (what NOT to do)
     */
    private storeAntiPattern;
    /**
     * Update team development style based on patterns
     */
    private updateTeamStyle;
    /**
     * Query winning patterns for current context
     * This is what gets fed back to agents for better decisions
     */
    getWinningPatternsFor(context: AgentActivationContext, limit?: number): Promise<WinningPattern[]>;
    /**
     * Get anti-patterns to avoid
     */
    getAntiPatternsToAvoid(context: AgentActivationContext): Promise<any[]>;
    /**
     * Get team development style
     */
    getTeamStyle(): TeamDevelopmentStyle;
    /**
     * Get pattern statistics
     */
    getStatistics(): any;
    private initializeTeamStyle;
}
