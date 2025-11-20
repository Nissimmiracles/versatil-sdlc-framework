/**
 * James-React: React 18+ Frontend Specialist
 *
 * Language-specific sub-agent for React 18+ development.
 * Specializes in Hooks, TypeScript, TanStack Query, and modern React patterns.
 *
 * Auto-activates on: React components (*.tsx, *.jsx), hooks patterns, React Context
 *
 * @module james-react
 * @version 6.6.0
 * @parent james-frontend
 */
import { EnhancedJames } from '../enhanced-james.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export interface ReactBestPractices {
    hooksPatterns: string[];
    componentStructure: string[];
    performanceOptimizations: string[];
    stateManagement: string[];
    testingStrategies: string[];
}
export declare class JamesReact extends EnhancedJames {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add React-specific validation
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Analyze React-specific patterns
     */
    analyzeReactPatterns(context: AgentActivationContext): Promise<{
        score: number;
        suggestions: Array<{
            type: string;
            message: string;
            priority: string;
        }>;
        bestPractices: ReactBestPractices;
    }>;
    /**
     * Detect class components
     */
    hasClassComponents(content: string): boolean;
    /**
     * Detect conditional Hook calls
     */
    hasConditionalHooks(content: string): boolean;
    /**
     * Detect missing dependency arrays
     */
    hasMissingDependencies(content: string): boolean;
    /**
     * Detect unnecessary re-renders
     */
    hasUnnecessaryRerenders(content: string): boolean;
    /**
     * Detect inline objects in JSX
     */
    private hasInlineObjectsInJSX;
    /**
     * Check for proper prop types
     */
    private hasProperPropTypes;
    /**
     * Check for missing keys in lists
     */
    private hasMissingKeys;
    /**
     * Detect complex local state
     */
    private hasComplexLocalState;
    /**
     * Check for accessibility attributes
     */
    private hasAccessibilityAttributes;
    /**
     * Check if component is a container
     */
    private isContainerComponent;
    /**
     * Check for error boundary
     */
    private hasErrorBoundary;
    /**
     * Check if using TanStack Query
     */
    private usesTanStackQuery;
    /**
     * Check for proper query keys
     */
    private hasProperQueryKeys;
    /**
     * Check for loading/error states
     */
    private hasLoadingErrorStates;
    /**
     * Check for test file
     */
    private hasTestFile;
    /**
     * Generate React-specific recommendations
     */
    generateReactRecommendations(content: string): string[];
    /**
     * Override RAG configuration for React domain
     */
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
    /**
     * Detect React version from content
     */
    detectReactVersion(content: string): string;
    /**
     * Detect state management solution
     */
    detectStateManagement(content: string): string;
}
