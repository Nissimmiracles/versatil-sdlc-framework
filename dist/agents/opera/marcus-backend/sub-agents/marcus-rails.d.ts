/**
 * Marcus-Rails: Ruby on Rails Specialist
 *
 * Language-specific sub-agent for Ruby on Rails 7+ development.
 * Specializes in Active Record, Hotwire, and Rails conventions.
 *
 * Auto-activates on: Gemfile, config/routes.rb, .rb files
 *
 * @module marcus-rails
 * @version 6.6.0
 * @parent marcus-backend
 */
import { EnhancedMarcus } from '../enhanced-marcus.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export declare class MarcusRails extends EnhancedMarcus {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    analyzeRailsPatterns(context: AgentActivationContext): Promise<{
        score: number;
        suggestions: {
            type: string;
            message: string;
            priority: string;
        }[];
        component: string;
    }>;
    private hasNPlusOnePattern;
    private isController;
    private isModel;
    private getMethodCount;
    private hasLongRunningOperation;
    private detectRailsComponent;
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
    hasActiveRecordModel(content: string): boolean;
    hasAssociations(content: string): boolean;
    hasValidations(content: string): boolean;
    hasNPlusOne(content: string): boolean;
    hasIncludes(content: string): boolean;
    hasScopes(content: string): boolean;
    hasController(content: string): boolean;
    hasBeforeAction(content: string): boolean;
    hasStrongParams(content: string): boolean;
    hasMissingStrongParams(content: string): boolean;
    detectSQLInjection(content: string): boolean;
    hasParameterizedQuery(content: string): boolean;
    hasCSRFProtection(content: string): boolean;
    hasAuthentication(content: string): boolean;
    hasPundit(content: string): boolean;
    hasExposedSecrets(content: string): boolean;
    hasPatternMatching(content: string): boolean;
    hasEndlessMethod(content: string): boolean;
    hasKeywordArgs(content: string): boolean;
    hasSafeNavigation(content: string): boolean;
    hasCounterCache(content: string): boolean;
    hasCaching(content: string): boolean;
    hasFragmentCache(content: string): boolean;
    hasSelect(content: string): boolean;
    hasPluck(content: string): boolean;
    hasFindEach(content: string): boolean;
    hasActiveJob(content: string): boolean;
    hasSidekiq(content: string): boolean;
    hasRSpec(content: string): boolean;
    hasMinitest(content: string): boolean;
    hasFactoryBot(content: string): boolean;
    hasFixtures(content: string, filePath?: string): boolean;
    hasBlocks(content: string): boolean;
    hasSymbols(content: string): boolean;
    hasStringInterpolation(content: string): boolean;
    hasMigration(content: string): boolean;
    hasIndex(content: string): boolean;
    hasForeignKey(content: string): boolean;
}
