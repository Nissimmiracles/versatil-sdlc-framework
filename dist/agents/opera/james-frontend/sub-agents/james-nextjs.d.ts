/**
 * James-NextJS: Next.js 14+ Frontend Specialist
 *
 * Language-specific sub-agent for Next.js 14+ development.
 * Specializes in App Router, Server Components, Server Actions, and modern Next.js patterns.
 *
 * Auto-activates on: Next.js files (app/**, pages/**, next.config.js), Server Components, Route Handlers
 *
 * @module james-nextjs
 * @version 6.6.0
 * @parent james-frontend
 */
import { EnhancedJames } from '../enhanced-james.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export interface NextJSBestPractices {
    appRouterPatterns: string[];
    serverComponentPatterns: string[];
    dataFetchingPatterns: string[];
    performanceOptimizations: string[];
    seoPatterns: string[];
}
export declare class JamesNextJS extends EnhancedJames {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Next.js-specific validation
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Analyze Next.js-specific patterns
     */
    private analyzeNextJSPatterns;
    /**
     * Check if using Pages Router
     */
    private usesPagesRouter;
    /**
     * Check if component needs "use client"
     */
    private needsUseClient;
    /**
     * Check if in App Router context
     */
    private isAppRouter;
    /**
     * Check for client-side data fetching
     */
    private hasClientSideDataFetching;
    /**
     * Check for images
     */
    private hasImages;
    /**
     * Check for links
     */
    private hasLinks;
    /**
     * Check for font links
     */
    private hasFontLinks;
    /**
     * Check if file is a page component
     */
    private isPageComponent;
    /**
     * Check for metadata export
     */
    private hasMetadata;
    /**
     * Check for loading state file
     */
    private hasLoadingState;
    /**
     * Check for error boundary file
     */
    private hasErrorBoundary;
    /**
     * Check for form submission
     */
    private hasFormSubmission;
    /**
     * Check for Server Actions usage
     */
    private usesServerActions;
    /**
     * Check if component is async
     */
    private hasAsyncComponent;
    /**
     * Check if component is large (heuristic)
     */
    private hasLargeComponent;
    /**
     * Check if file is a route handler
     */
    private isRouteHandler;
    /**
     * Check for proper route handler exports
     */
    private hasProperRouteHandlerExports;
    /**
     * Check for multiple independent sections
     */
    private hasMultipleSections;
    /**
     * Check for parallel routes usage
     */
    private usesParallelRoutes;
    /**
     * Check if file is middleware
     */
    private isMiddleware;
    /**
     * Check for proper middleware patterns
     */
    private hasProperMiddlewarePatterns;
    /**
     * Generate Next.js-specific recommendations
     */
    generateNextJSRecommendations(content: string): string[];
    /**
     * Override RAG configuration for Next.js domain
     */
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
    /**
     * Detect Next.js version
     */
    detectNextJSVersion(content: string): string;
    /**
     * Detect rendering strategy
     */
    detectRenderingStrategy(content: string): string;
}
