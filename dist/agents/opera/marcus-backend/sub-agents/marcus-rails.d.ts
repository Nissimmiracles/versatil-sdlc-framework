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
    private analyzeRailsPatterns;
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
}
