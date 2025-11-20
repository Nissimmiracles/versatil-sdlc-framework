/**
 * James-Vue: Vue 3 Frontend Specialist
 *
 * Language-specific sub-agent for Vue 3 development.
 * Specializes in Composition API, Pinia, VeeValidate, and modern Vue patterns.
 *
 * Auto-activates on: Vue components (*.vue), Composition API patterns, Vue directives
 *
 * @module james-vue
 * @version 6.6.0
 * @parent james-frontend
 */
import { EnhancedJames } from '../enhanced-james.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export interface VueBestPractices {
    compositionAPIPatterns: string[];
    reactivityPatterns: string[];
    componentCommunication: string[];
    performanceOptimizations: string[];
    testingStrategies: string[];
}
export declare class JamesVue extends EnhancedJames {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Vue-specific validation
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Analyze Vue-specific patterns
     */
    analyzeVuePatterns(context: AgentActivationContext): Promise<{
        score: number;
        suggestions: Array<{
            type: string;
            message: string;
            priority: string;
        }>;
        bestPractices: VueBestPractices;
        recommendations?: string[];
    }>;
    private internalAnalyzeVuePatterns;
    hasOptionsAPI(content: string): boolean;
    hasCompositionAPI(content: string): boolean;
    hasScriptSetup(content: string): boolean;
    hasRefUsage(content: string): boolean;
    hasReactiveUsage(content: string): boolean;
    hasComputedUsage(content: string): boolean;
    hasMissingValueAccess(content: string): boolean;
    hasReactiveDestructuring(content: string): boolean;
    hasLifecycleHook(content: string, hookName: string): boolean;
    hasWatchEffect(content: string): boolean;
    hasWatch(content: string): boolean;
    hasDefineProps(content: string): boolean;
    hasDefineEmits(content: string): boolean;
    hasMissingVForKey(content: string): boolean;
    hasComposableUsage(content: string): boolean;
    hasProperComposableNaming(content: string): boolean;
    hasVIf(content: string): boolean;
    hasVModel(content: string): boolean;
    hasSlot(content: string): boolean;
    hasScopedSlot(content: string): boolean;
    hasUnnecessaryReactive(content: string): boolean;
    /**
     * Detect Options API usage
     */
    private usesOptionsAPI;
    /**
     * Detect reactivity issues
     */
    private hasReactivityIssues;
    /**
     * Check for missing watch cleanup
     */
    private hasMissingWatchCleanup;
    /**
     * Check for missing v-for keys
     */
    private hasMissingVForKeys;
    /**
     * Check for ref unwrapping issues
     */
    private hasRefUnwrappingIssues;
    /**
     * Check for proper TypeScript usage
     */
    private hasProperTypeScript;
    /**
     * Check if using script setup
     */
    private usesScriptSetup;
    /**
     * Check for computed used as methods
     */
    private hasComputedAsMethods;
    /**
     * Check if using Pinia
     */
    private usesPinia;
    /**
     * Check for proper store usage
     */
    private hasProperStoreUsage;
    /**
     * Check for modal/overlay components
     */
    private hasModalOrOverlay;
    /**
     * Check for improper emits
     */
    private hasImproperEmits;
    /**
     * Check for custom v-model
     */
    private hasCustomVModel;
    /**
     * Check for v-model modifiers
     */
    private usesVModelModifiers;
    /**
     * Check for provide/inject usage
     */
    private usesProvideInject;
    /**
     * Check for injection keys
     */
    private hasInjectionKeys;
    /**
     * Check for accessibility attributes
     */
    private hasAccessibilityAttributes;
    /**
     * Check for test file
     */
    private hasTestFile;
    /**
     * Generate Vue-specific recommendations
     */
    generateVueRecommendations(content: string): string[];
    /**
     * Override RAG configuration for Vue domain
     */
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
    /**
     * Detect Vue version
     */
    detectVueVersion(content: string): string;
    /**
     * Detect state management solution
     */
    detectStateManagement(content: string): string;
}
