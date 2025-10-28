/**
 * AI-Era Developer Orchestrator
 * Makes agents act like the best full-stack developers of the AI era
 *
 * Core Principles:
 * 1. Full context awareness (entire codebase, not just current file)
 * 2. Systematic winning patterns (learns what works)
 * 3. Latest industry knowledge (continuous web learning)
 * 4. Cross-stack expertise (frontend + backend + testing + deployment)
 * 5. Proactive quality (catches issues before they happen)
 */
import { AgentRegistry } from '../agents/core/agent-registry.js';
import { AgentResponse, AgentActivationContext } from '../agents/core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
export interface AIEraDeveloperConfig {
    enableFullContextCoding: boolean;
    enablePatternLearning: boolean;
    enableWebLearning: boolean;
    enableCrossStackExpertise: boolean;
    enableProactiveQuality: boolean;
    qualityThreshold: number;
    contextDepth: 'shallow' | 'medium' | 'deep';
}
/**
 * The ultimate AI-era developer orchestrator
 * Every agent activation goes through this to get:
 * - Full context awareness
 * - Your team's winning patterns
 * - Latest industry best practices
 * - Cross-stack expertise
 * - Proactive quality gates
 */
export declare class AIEraDeveloperOrchestrator {
    private agentRegistry;
    private ragStore;
    private agentRAGSync;
    private patternLearning;
    private webLearning;
    private config;
    constructor(agentRegistry: AgentRegistry, ragStore: EnhancedVectorMemoryStore, config?: Partial<AIEraDeveloperConfig>);
    /**
     * Activate agent with full AI-era developer capabilities
     *
     * This transforms any agent into a world-class AI-era developer by:
     * 1. Loading full codebase context (not just current file)
     * 2. Applying YOUR team's winning patterns
     * 3. Integrating latest industry best practices
     * 4. Adding cross-stack expertise
     * 5. Running proactive quality gates
     */
    activateAgent(agentId: string, context: AgentActivationContext, userFeedback?: 'positive' | 'negative' | 'neutral'): Promise<AgentResponse>;
    /**
     * STEP 1: Full context coding
     * Load entire codebase context, not just current file
     */
    private enrichWithFullContext;
    /**
     * STEP 2: Add YOUR team's winning patterns
     */
    private addWinningPatterns;
    /**
     * STEP 3: Add latest industry best practices from web
     */
    private addWebLearnings;
    /**
     * STEP 4: Add cross-stack expertise
     */
    private addCrossStackExpertise;
    /**
     * STEP 6: Proactive quality gates
     */
    private runProactiveQualityGates;
    /**
     * STEP 7: Learn from this interaction
     */
    private learnFromInteraction;
    /**
     * Helper: Determine category from context
     */
    private determineCategory;
    /**
     * Helper: Get context topK based on depth
     */
    private getContextTopK;
    /**
     * Get orchestrator statistics
     */
    getStatistics(): any;
    /**
     * Execute full-stack workflow
     * Use this when you need multiple agents working together as AI-era developers
     */
    executeFullStackWorkflow(workflowDescription: string, initialContext: AgentActivationContext): Promise<AgentResponse[]>;
    /**
     * Determine which agents needed for workflow
     */
    private determineAgentSequence;
}
/**
 * Example usage:
 *
 * const orchestrator = new AIEraDeveloperOrchestrator(agentRegistry, ragStore, {
 *   enableFullContextCoding: true,
 *   enablePatternLearning: true,
 *   enableWebLearning: true,
 *   enableCrossStackExpertise: true,
 *   enableProactiveQuality: true,
 *   qualityThreshold: 0.7,
 *   contextDepth: 'deep'
 * });
 *
 * // Activate any agent as AI-era full-stack developer
 * const response = await orchestrator.activateAgent('enhanced-marcus', {
 *   filePath: 'src/api/users.ts',
 *   content: 'implement user authentication',
 *   userRequest: 'add login endpoint'
 * }, 'positive');
 *
 * // Execute full-stack workflow
 * const workflowResponses = await orchestrator.executeFullStackWorkflow(
 *   'Build user authentication feature with frontend and backend',
 *   initialContext
 * );
 */ 
