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
import { BaseAgent, AgentResponse, AgentActivationContext } from '../agents/core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import { AgentRAGSynchronization, EnrichedContext } from './agent-rag-sync.js';
import { PatternLearningSystem } from '../rag/pattern-learning-system.js';
import { ContinuousWebLearning } from '../rag/continuous-web-learning.js';
import { BidirectionalRAGSync } from '../rag/bidirectional-sync.js';
import { CrossAgentLearning } from '../rag/cross-agent-learning.js';
import { IncrementalIntelligence } from '../rag/incremental-intelligence.js';

export interface AIEraDeveloperConfig {
  enableFullContextCoding: boolean; // See entire codebase, not just current file
  enablePatternLearning: boolean; // Learn YOUR team's winning patterns
  enableWebLearning: boolean; // Learn latest SDLC patterns from web
  enableCrossStackExpertise: boolean; // Act as full-stack expert
  enableProactiveQuality: boolean; // Catch issues before they happen
  qualityThreshold: number; // Minimum quality score (0-1)
  contextDepth: 'shallow' | 'medium' | 'deep'; // How much context to load
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
export class AIEraDeveloperOrchestrator {
  private agentRegistry: AgentRegistry;
  private ragStore: EnhancedVectorMemoryStore;
  private agentRAGSync: AgentRAGSynchronization;
  private patternLearning: PatternLearningSystem;
  private webLearning: ContinuousWebLearning;
  private config: AIEraDeveloperConfig;

  constructor(
    agentRegistry: AgentRegistry,
    ragStore: EnhancedVectorMemoryStore,
    config: Partial<AIEraDeveloperConfig> = {}
  ) {
    this.agentRegistry = agentRegistry;
    this.ragStore = ragStore;
    this.agentRAGSync = new AgentRAGSynchronization(agentRegistry, ragStore);
    this.patternLearning = new PatternLearningSystem(ragStore);
    this.webLearning = new ContinuousWebLearning(ragStore);

    this.config = {
      enableFullContextCoding: config.enableFullContextCoding !== false,
      enablePatternLearning: config.enablePatternLearning !== false,
      enableWebLearning: config.enableWebLearning !== false,
      enableCrossStackExpertise: config.enableCrossStackExpertise !== false,
      enableProactiveQuality: config.enableProactiveQuality !== false,
      qualityThreshold: config.qualityThreshold || 0.7,
      contextDepth: config.contextDepth || 'deep'
    };

    // Start continuous web learning
    if (this.config.enableWebLearning) {
      this.webLearning.startContinuousLearning();
    }

    console.log('[AIEraDev] Initialized AI-Era Developer Orchestrator with full intelligence stack');
  }

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
  async activateAgent(
    agentId: string,
    context: AgentActivationContext,
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): Promise<AgentResponse> {
    console.log(`[AIEraDev] Activating ${agentId} as AI-era full-stack developer`);

    // STEP 1: Enrich context with full codebase awareness
    const fullContext = await this.enrichWithFullContext(context, agentId);

    // STEP 2: Add your team's winning patterns
    const contextWithPatterns = await this.addWinningPatterns(fullContext, agentId);

    // STEP 3: Add latest industry best practices from web
    const contextWithWebKnowledge = await this.addWebLearnings(contextWithPatterns);

    // STEP 4: Add cross-stack expertise
    const aiEraContext = await this.addCrossStackExpertise(contextWithWebKnowledge, agentId);

    // STEP 5: Activate agent with enhanced context
    const response = await this.agentRAGSync.activateAgentWithFullContext(
      agentId,
      aiEraContext,
      [],
      userFeedback
    );

    // STEP 6: Run proactive quality gates
    if (this.config.enableProactiveQuality) {
      await this.runProactiveQualityGates(response, aiEraContext);
    }

    // STEP 7: Learn from this interaction
    await this.learnFromInteraction(agentId, aiEraContext, response, userFeedback);

    console.log(`[AIEraDev] ${agentId} completed as AI-era developer with quality score: ${response.context?.confidence || 0}`);

    return response;
  }

  /**
   * STEP 1: Full context coding
   * Load entire codebase context, not just current file
   */
  private async enrichWithFullContext(
    context: AgentActivationContext,
    agentId: string
  ): Promise<EnrichedContext> {
    if (!this.config.enableFullContextCoding) {
      return context as EnrichedContext;
    }

    console.log('[AIEraDev] Loading full codebase context...');

    // Query for related files and code
    const relatedCode = await this.ragStore.queryMemories({
      query: context.content || context.userRequest || context.filePath || '',
      queryType: 'hybrid',
      agentId,
      topK: this.getContextTopK(),
      filters: {
        tags: ['code', 'codebase'],
        contentTypes: ['code', 'text']
      }
    });

    // Query for project architecture
    const architecture = await this.ragStore.queryMemories({
      query: 'project architecture structure dependencies',
      queryType: 'semantic',
      agentId: 'architecture-dan',
      topK: 3,
      filters: {
        tags: ['architecture', 'structure'],
        contentTypes: ['text']
      }
    });

    return {
      ...context,
      fullCodebaseContext: {
        relatedFiles: relatedCode.documents || [],
        architecture: architecture.documents || [],
        totalFilesAnalyzed: relatedCode.documents?.length || 0
      }
    } as EnrichedContext;
  }

  /**
   * STEP 2: Add YOUR team's winning patterns
   */
  private async addWinningPatterns(
    context: EnrichedContext,
    agentId: string
  ): Promise<EnrichedContext> {
    if (!this.config.enablePatternLearning) {
      return context;
    }

    console.log('[AIEraDev] Adding your team\'s winning patterns...');

    // Get winning patterns for this context
    const winningPatterns = await this.patternLearning.getWinningPatternsFor(context, 5);

    // Get anti-patterns to avoid
    const antiPatterns = await this.patternLearning.getAntiPatternsToAvoid(context);

    // Get team development style
    const teamStyle = this.patternLearning.getTeamStyle();

    return {
      ...context,
      teamWinningPatterns: {
        patterns: winningPatterns,
        antiPatterns,
        teamStyle
      }
    } as EnrichedContext;
  }

  /**
   * STEP 3: Add latest industry best practices from web
   */
  private async addWebLearnings(context: EnrichedContext): Promise<EnrichedContext> {
    if (!this.config.enableWebLearning) {
      return context;
    }

    console.log('[AIEraDev] Adding latest industry best practices...');

    // Determine category based on context
    const category = this.determineCategory(context);

    // Get latest patterns from web
    const latestPatterns = await this.webLearning.getLatestPatterns(category, 3);

    return {
      ...context,
      latestIndustryKnowledge: {
        patterns: latestPatterns,
        category,
        lastUpdated: new Date()
      }
    } as EnrichedContext;
  }

  /**
   * STEP 4: Add cross-stack expertise
   */
  private async addCrossStackExpertise(
    context: EnrichedContext,
    agentId: string
  ): Promise<EnrichedContext> {
    if (!this.config.enableCrossStackExpertise) {
      return context;
    }

    console.log('[AIEraDev] Adding cross-stack expertise...');

    // Query frontend knowledge
    const frontendKnowledge = await this.ragStore.queryMemories({
      query: `${context.content || context.filePath || ''} frontend UI components`,
      queryType: 'semantic',
      agentId: 'enhanced-james',
      topK: 2,
      filters: {
        tags: ['frontend', 'ui'],
        contentTypes: ['text', 'code']
      }
    });

    // Query backend knowledge
    const backendKnowledge = await this.ragStore.queryMemories({
      query: `${context.content || context.filePath || ''} backend API database`,
      queryType: 'semantic',
      agentId: 'enhanced-marcus',
      topK: 2,
      filters: {
        tags: ['backend', 'api'],
        contentTypes: ['text', 'code']
      }
    });

    // Query testing knowledge
    const testingKnowledge = await this.ragStore.queryMemories({
      query: `${context.content || context.filePath || ''} testing quality coverage`,
      queryType: 'semantic',
      agentId: 'enhanced-maria',
      topK: 2,
      filters: {
        tags: ['testing', 'qa'],
        contentTypes: ['text', 'code']
      }
    });

    return {
      ...context,
      crossStackExpertise: {
        frontend: frontendKnowledge.documents || [],
        backend: backendKnowledge.documents || [],
        testing: testingKnowledge.documents || []
      }
    } as EnrichedContext;
  }

  /**
   * STEP 6: Proactive quality gates
   */
  private async runProactiveQualityGates(
    response: AgentResponse,
    context: EnrichedContext
  ): Promise<void> {
    console.log('[AIEraDev] Running proactive quality gates...');

    const confidence = response.context?.confidence || 0;

    // Gate 1: Confidence threshold
    if (confidence < this.config.qualityThreshold) {
      response.suggestions = response.suggestions || [];
      response.suggestions.unshift({
        type: 'quality-gate',
        message: `⚠️ Low confidence (${Math.round(confidence * 100)}%) - consider manual review`,
        priority: 'high'
      });
    }

    // Gate 2: Security check
    if (context.content?.includes('password') ||
        context.content?.includes('secret') ||
        context.content?.includes('token')) {
      response.suggestions = response.suggestions || [];
      response.suggestions.unshift({
        type: 'security-gate',
        message: '🔒 Security-sensitive code detected - ensure proper encryption and validation',
        priority: 'critical'
      });
    }

    // Gate 3: Test coverage check
    if (context.filePath && !context.filePath.includes('test') && !context.filePath.includes('spec')) {
      response.suggestions = response.suggestions || [];
      response.suggestions.push({
        type: 'testing-gate',
        message: '🧪 Consider adding tests for this functionality',
        priority: 'medium'
      });
    }

    // Gate 4: Performance check
    if (context.content?.includes('for (') ||
        context.content?.includes('while (') ||
        context.content?.includes('forEach(')) {
      const hasLargeLoop = context.content.split('\n').length > 100;
      if (hasLargeLoop) {
        response.suggestions = response.suggestions || [];
        response.suggestions.push({
          type: 'performance-gate',
          message: '⚡ Large file with loops - consider performance optimization',
          priority: 'medium'
        });
      }
    }
  }

  /**
   * STEP 7: Learn from this interaction
   */
  private async learnFromInteraction(
    agentId: string,
    context: EnrichedContext,
    response: AgentResponse,
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    console.log('[AIEraDev] Learning from interaction...');

    // If positive feedback or high confidence, learn as winning pattern
    if (userFeedback === 'positive' || (response.context?.confidence || 0) > 0.8) {
      await this.patternLearning.learnFromSuccess(
        context,
        response,
        {
          timeToComplete: response.context?.introspectionTime || 0,
          testsPassed: true, // Would track in production
          codeReviewed: false, // Would track in production
          deployed: false, // Would track in production
          userSatisfaction: userFeedback === 'positive' ? 1 : 0.7
        }
      );
    }

    // If negative feedback or low confidence, learn as failure
    if (userFeedback === 'negative' || (response.context?.confidence || 0) < 0.3) {
      await this.patternLearning.learnFromFailure(
        context,
        response,
        response.context?.errorMessage || 'Low confidence result',
        response.context?.introspectionTime || 0
      );
    }
  }

  /**
   * Helper: Determine category from context
   */
  private determineCategory(context: EnrichedContext): 'best-practice' | 'tool' | 'security' | 'performance' | 'architecture' | 'testing' {
    const content = context.content?.toLowerCase() || '';
    const filePath = context.filePath?.toLowerCase() || '';

    if (content.includes('security') || content.includes('auth') || content.includes('encrypt')) return 'security';
    if (content.includes('performance') || content.includes('optimize') || content.includes('cache')) return 'performance';
    if (content.includes('test') || filePath.includes('test')) return 'testing';
    if (content.includes('architecture') || content.includes('design pattern')) return 'architecture';
    if (content.includes('tool') || content.includes('library') || content.includes('framework')) return 'tool';

    return 'best-practice';
  }

  /**
   * Helper: Get context topK based on depth
   */
  private getContextTopK(): number {
    switch (this.config.contextDepth) {
      case 'shallow':
        return 5;
      case 'medium':
        return 15;
      case 'deep':
        return 30;
      default:
        return 15;
    }
  }

  /**
   * Get orchestrator statistics
   */
  getStatistics(): any {
    return {
      config: this.config,
      ragSync: this.agentRAGSync.getIntelligenceMetrics(),
      patternLearning: this.patternLearning.getStatistics(),
      webLearning: this.webLearning.getStatistics()
    };
  }

  /**
   * Execute full-stack workflow
   * Use this when you need multiple agents working together as AI-era developers
   */
  async executeFullStackWorkflow(
    workflowDescription: string,
    initialContext: AgentActivationContext
  ): Promise<AgentResponse[]> {
    console.log(`[AIEraDev] Executing full-stack workflow: ${workflowDescription}`);

    // Determine agent sequence based on workflow
    const agentSequence = this.determineAgentSequence(workflowDescription, initialContext);

    console.log(`[AIEraDev] Workflow requires: ${agentSequence.join(' → ')}`);

    // Execute sequence with full AI-era capabilities
    const responses: AgentResponse[] = [];

    for (const agentId of agentSequence) {
      const response = await this.activateAgent(agentId, initialContext);
      responses.push(response);

      // Accumulate context for next agent
      initialContext = {
        ...initialContext,
        content: (initialContext.content || '') + '\n\n' + response.message,
        userRequest: response.message
      };
    }

    console.log(`[AIEraDev] Full-stack workflow completed with ${responses.length} agent activations`);

    return responses;
  }

  /**
   * Determine which agents needed for workflow
   */
  private determineAgentSequence(
    workflowDescription: string,
    context: AgentActivationContext
  ): string[] {
    const desc = workflowDescription.toLowerCase();
    const agents: string[] = [];

    // Requirements analysis
    if (desc.includes('requirement') || desc.includes('feature') || desc.includes('user story')) {
      agents.push('alex-ba');
    }

    // Backend development
    if (desc.includes('api') || desc.includes('backend') || desc.includes('database') || desc.includes('server')) {
      agents.push('enhanced-marcus');
    }

    // Frontend development
    if (desc.includes('ui') || desc.includes('frontend') || desc.includes('component') || desc.includes('page')) {
      agents.push('enhanced-james');
    }

    // Testing
    if (desc.includes('test') || desc.includes('quality') || agents.length > 0) {
      agents.push('enhanced-maria'); // Always test if other development happens
    }

    // Default to introspective if unclear
    if (agents.length === 0) {
      agents.push('introspective-agent');
    }

    return agents;
  }
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