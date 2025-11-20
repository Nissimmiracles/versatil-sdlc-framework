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
    analyzeNextPatterns(context: AgentActivationContext): Promise<{
        score: number;
        suggestions: Array<{
            type: string;
            message: string;
            priority: string;
        }>;
        bestPractices: NextJSBestPractices;
    }>;
    private analyzeNextJSPatterns;
    hasAppRouter(filePath: string): boolean;
    hasPagesRouter(filePath: string): boolean;
    hasUseClient(content: string): boolean;
    hasUseServer(content: string): boolean;
    hasClientHookInServerComponent(content: string, filePath: string): boolean;
    hasServerAction(content: string): boolean;
    hasFormAction(content: string): boolean;
    hasAsyncComponent(content: string): boolean;
    private checkAsyncComponent;
    hasGetServerSideProps(content: string): boolean;
    hasGetStaticProps(content: string): boolean;
    hasLinkComponent(content: string): boolean;
    hasUseRouter(content: string): boolean;
    hasRedirect(content: string): boolean;
    hasDynamicRoute(filePath: string): boolean;
    hasImageComponent(content: string): boolean;
    hasDynamicImport(content: string): boolean;
    hasSuspense(content: string): boolean;
    hasLoadingFile(filePath: string): boolean;
    hasMetadata(content: string): boolean;
    private checkMetadata;
    hasGenerateMetadata(content: string): boolean;
    hasSitemap(filePath: string): boolean;
    hasRobots(filePath: string): boolean;
    hasLayout(filePath: string): boolean;
    hasErrorBoundary(filePath: string): boolean;
    private checkHasErrorBoundary;
    hasNotFound(filePath: string): boolean;
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
     * Check for loading state file
     */
    private hasLoadingState;
    /**
     * Check for form submission
     */
    private hasFormSubmission;
    /**
     * Check for Server Actions usage
     */
    private usesServerActions;
    /**
     * Check if component is large (heuristic)
     */
    private hasLargeComponent;
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
