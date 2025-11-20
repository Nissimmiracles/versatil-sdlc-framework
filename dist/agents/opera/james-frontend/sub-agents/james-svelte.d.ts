/**
 * James-Svelte: Svelte 4/5 Frontend Specialist
 *
 * Language-specific sub-agent for Svelte 4/5 development.
 * Specializes in SvelteKit, stores, reactive patterns, and modern Svelte.
 *
 * Auto-activates on: Svelte components (*.svelte), SvelteKit routes, stores
 *
 * @module james-svelte
 * @version 6.6.0
 * @parent james-frontend
 */
import { EnhancedJames } from '../enhanced-james.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export interface SvelteBestPractices {
    reactivePatterns: string[];
    storePatterns: string[];
    componentCommunication: string[];
    performanceOptimizations: string[];
    testingStrategies: string[];
}
export declare class JamesSvelte extends EnhancedJames {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Svelte-specific validation
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Analyze Svelte-specific patterns
     */
    analyzeSveltePatterns(context: AgentActivationContext): Promise<{
        score: number;
        suggestions: Array<{
            type: string;
            message: string;
            priority: string;
        }>;
        bestPractices: SvelteBestPractices;
    }>;
    hasStateRune(content: string): boolean;
    hasDerivedRune(content: string): boolean;
    hasEffectRune(content: string): boolean;
    hasPropsRune(content: string): boolean;
    hasReactiveDeclaration(content: string): boolean;
    hasReactiveStatement(content: string): boolean;
    hasReactiveBlock(content: string): boolean;
    hasScript(content: string): boolean;
    hasTypeScript(content: string): boolean;
    private checkTypeScript;
    hasEventHandler(content: string): boolean;
    hasEventDispatcher(content: string): boolean;
    hasWritableStore(content: string): boolean;
    hasReadableStore(content: string): boolean;
    hasDerivedStore(content: string): boolean;
    hasStoreSubscription(content: string): boolean;
    isPageFile(filePath: string): boolean;
    isLayoutFile(filePath: string): boolean;
    isServerFile(filePath: string): boolean;
    hasLoadFunction(content: string): boolean;
    hasFormAction(content: string): boolean;
    hasIfBlock(content: string): boolean;
    hasEachBlock(content: string): boolean;
    hasAwaitBlock(content: string): boolean;
    hasKeyBlock(content: string): boolean;
    hasMissingKeyedEach(content: string): boolean;
    hasOnMount(content: string): boolean;
    hasOnDestroy(content: string): boolean;
    hasBeforeUpdate(content: string): boolean;
    hasAfterUpdate(content: string): boolean;
    hasSvelteWindow(content: string): boolean;
    hasSvelteComponent(content: string): boolean;
    hasImmutable(content: string): boolean;
    /**
     * Check for improper reactive statements
     */
    private hasImproperReactiveStatements;
    /**
     * Check for missing store cleanup
     */
    private hasMissingStoreCleanup;
    /**
     * Check for direct store mutation
     */
    private hasDirectStoreMutation;
    /**
     * Check for missing each keys
     */
    private hasMissingEachKeys;
    /**
     * Check for Svelte 5 runes
     */
    private usesSvelte5Runes;
    /**
     * Check for improper prop binding
     */
    private hasImproperPropBinding;
    /**
     * Check for unused reactive statements
     */
    private hasUnusedReactiveStatements;
    /**
     * Check if SvelteKit route
     */
    private isSvelteKitRoute;
    /**
     * Check for proper load function
     */
    private hasProperLoadFunction;
    /**
     * Check for form handling
     */
    private hasFormHandling;
    /**
     * Check for actions usage
     */
    private usesActions;
    /**
     * Check for conditional rendering
     */
    private hasConditionalRendering;
    /**
     * Check for transitions
     */
    private usesTransitions;
    /**
     * Check for deep prop drilling
     */
    private hasDeepPropDrilling;
    /**
     * Check for derived stores
     */
    private hasDerivedStores;
    /**
     * Check for proper derived usage
     */
    private usesProperDerived;
    /**
     * Check for two-way binding
     */
    private hasTwoWayBinding;
    /**
     * Check for complex two-way binding
     */
    private hasComplexTwoWayBinding;
    /**
     * Check for accessibility attributes
     */
    private hasAccessibilityAttributes;
    /**
     * Check for browser API usage
     */
    private usesBrowserAPIs;
    /**
     * Check for SSR guards
     */
    private hasSSRGuards;
    /**
     * Check for test file
     */
    private hasTestFile;
    /**
     * Generate Svelte-specific recommendations
     */
    generateSvelteRecommendations(content: string): string[];
    /**
     * Override RAG configuration for Svelte domain
     */
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
    /**
     * Detect Svelte version
     */
    detectSvelteVersion(content: string): string;
    private checkSvelteVersion;
    /**
     * Detect state management solution
     */
    detectStateManagement(content: string): string;
    private isSvelte5;
}
