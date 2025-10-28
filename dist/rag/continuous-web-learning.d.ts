/**
 * Continuous Web Learning System
 * Automatically learns latest SDLC patterns from web research
 *
 * This keeps YOUR framework up-to-date with:
 * - Latest industry best practices
 * - Emerging patterns and techniques
 * - New tools and frameworks
 * - Security vulnerabilities and fixes
 * - Performance optimization strategies
 */
import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
export interface WebLearnedPattern {
    id: string;
    title: string;
    content: string;
    source: string;
    url: string;
    category: 'best-practice' | 'tool' | 'security' | 'performance' | 'architecture' | 'testing';
    relevanceScore: number;
    publishDate: Date;
    learnedDate: Date;
    applicableToProject: boolean;
    tags: string[];
}
export interface LearningSource {
    name: string;
    url: string;
    type: 'blog' | 'documentation' | 'github' | 'stackoverflow' | 'research-paper';
    frequency: 'daily' | 'weekly' | 'monthly';
    lastChecked: Date;
}
/**
 * Continuous Web Learning - Keeps framework knowledge fresh
 */
export declare class ContinuousWebLearning {
    private vectorStore;
    private learningSources;
    private learningSchedule;
    private logger;
    constructor(vectorStore: EnhancedVectorMemoryStore);
    /**
     * Initialize default learning sources
     */
    private initializeLearningSources;
    /**
     * Start continuous learning process
     */
    startContinuousLearning(): void;
    /**
     * Stop continuous learning
     */
    stopContinuousLearning(): void;
    /**
     * Perform one learning cycle
     */
    private performLearningCycle;
    /**
     * Check if source should be checked now
     */
    private shouldCheck;
    /**
     * Learn from specific source
     */
    private learnFromSource;
    /**
     * Fetch content from source
     * In production, this would use WebFetch MCP or similar
     */
    private fetchSourceContent;
    /**
     * Extract patterns from fetched content
     */
    private extractPatterns;
    /**
     * Store web-learned pattern in RAG
     */
    private storeWebLearnedPattern;
    /**
     * Query web-learned patterns for context
     */
    getWebLearnedPatternsFor(query: string, category?: WebLearnedPattern['category'], limit?: number): Promise<WebLearnedPattern[]>;
    /**
     * Get latest patterns by category
     */
    getLatestPatterns(category: WebLearnedPattern['category'], limit?: number): Promise<WebLearnedPattern[]>;
    /**
     * Add custom learning source
     */
    addLearningSource(source: LearningSource): void;
    /**
     * Get all learning sources
     */
    getLearningSources(): LearningSource[];
    /**
     * Manually trigger learning from specific source
     */
    learnNow(sourceName: string): Promise<void>;
    /**
     * Get statistics
     */
    getStatistics(): Promise<any>;
}
/**
 * Example usage:
 *
 * const webLearning = new ContinuousWebLearning(vectorStore);
 *
 * // Start continuous learning
 * webLearning.startContinuousLearning();
 *
 * // Query for security best practices
 * const securityPatterns = await webLearning.getLatestPatterns('security');
 *
 * // Add custom source
 * webLearning.addLearningSource({
 *   name: 'Your Company Blog',
 *   url: 'https://your-company.com/blog',
 *   type: 'blog',
 *   frequency: 'weekly',
 *   lastChecked: new Date()
 * });
 *
 * // Manually trigger learning
 * await webLearning.learnNow('Martin Fowler Blog');
 */ 
