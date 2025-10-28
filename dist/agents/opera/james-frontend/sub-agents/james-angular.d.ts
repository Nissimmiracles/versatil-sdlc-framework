/**
 * James-Angular: Angular 17+ Frontend Specialist
 *
 * Language-specific sub-agent for Angular 17+ development.
 * Specializes in Standalone Components, Signals, RxJS, and modern Angular patterns.
 *
 * Auto-activates on: Angular components (*.component.ts), services, modules, Angular templates
 *
 * @module james-angular
 * @version 6.6.0
 * @parent james-frontend
 */
import { EnhancedJames } from '../enhanced-james.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export interface AngularBestPractices {
    componentPatterns: string[];
    reactivePatterns: string[];
    dependencyInjection: string[];
    performanceOptimizations: string[];
    testingStrategies: string[];
}
export declare class JamesAngular extends EnhancedJames {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Angular-specific validation
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Analyze Angular-specific patterns
     */
    private analyzeAngularPatterns;
    /**
     * Check for NgModule usage
     */
    private usesNgModules;
    /**
     * Check for default change detection
     */
    private hasDefaultChangeDetection;
    /**
     * Check for constructor injection
     */
    private usesConstructorInjection;
    /**
     * Check if component should use Signals
     */
    private shouldUseSignals;
    /**
     * Check if using Signals
     */
    private usesSignals;
    /**
     * Check for unsubscribed observables
     */
    private hasUnsubscribedObservables;
    /**
     * Check for improper async pipe usage
     */
    private hasImproperAsyncPipe;
    /**
     * Check for template-driven forms
     */
    private usesTemplateDrivenForms;
    /**
     * Check for missing trackBy
     */
    private hasMissingTrackBy;
    /**
     * Check if component is a container
     */
    private isContainerComponent;
    /**
     * Check for business logic in component
     */
    private hasBusinessLogic;
    /**
     * Check for improper input/output naming
     */
    private hasImproperInputOutputNaming;
    /**
     * Check for subscriptions
     */
    private hasSubscriptions;
    /**
     * Check if implements OnDestroy
     */
    private implementsOnDestroy;
    /**
     * Check for router usage
     */
    private hasRouterUsage;
    /**
     * Check if uses Router service
     */
    private usesRouterService;
    /**
     * Check for accessibility attributes
     */
    private hasAccessibilityAttributes;
    /**
     * Check if route module
     */
    private isRouteModule;
    /**
     * Check for lazy loading
     */
    private usesLazyLoading;
    /**
     * Check for test file
     */
    private hasTestFile;
    /**
     * Generate Angular-specific recommendations
     */
    generateAngularRecommendations(content: string): string[];
    /**
     * Override RAG configuration for Angular domain
     */
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
    /**
     * Detect Angular version
     */
    detectAngularVersion(content: string): string;
    /**
     * Detect state management solution
     */
    detectStateManagement(content: string): string;
}
