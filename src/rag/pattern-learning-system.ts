/**
 * Pattern Learning System
 * Systematically learns YOUR team's winning development patterns
 *
 * This is the key to the intelligence flywheel:
 * - Captures what works for YOUR team
 * - Reinforces successful patterns
 * - Eliminates failed approaches
 * - Builds institutional knowledge
 */

import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
import { AgentResponse, AgentActivationContext } from '../agents/core/base-agent.js';

export interface WinningPattern {
  id: string;
  type: 'development' | 'testing' | 'architecture' | 'deployment' | 'debugging';
  description: string;
  context: string;
  approach: string;
  outcome: 'success' | 'failure';
  successRate: number;
  timesApplied: number;
  averageTimeToComplete: number;
  teamMemberWhoDiscovered?: string;
  tags: string[];
  confidence: number;
  lastUsed: number;
  created: number;
}

export interface TeamDevelopmentStyle {
  preferredArchitectures: string[];
  preferredTestingApproaches: string[];
  preferredNamingConventions: string[];
  preferredCodePatterns: string[];
  avoidedAntiPatterns: string[];
  teamVelocityMetrics: {
    averageFeatureTime: number;
    averageBugFixTime: number;
    codeReviewTurnaround: number;
  };
}

/**
 * Learns YOUR team's systematic winning patterns
 */
export class PatternLearningSystem {
  private vectorStore: EnhancedVectorMemoryStore;
  private winningPatterns: Map<string, WinningPattern> = new Map();
  private teamStyle: TeamDevelopmentStyle;

  constructor(vectorStore: EnhancedVectorMemoryStore) {
    this.vectorStore = vectorStore;
    this.teamStyle = this.initializeTeamStyle();
  }

  /**
   * Learn from a successful development session
   * This is called after ANY successful agent interaction
   */
  async learnFromSuccess(
    context: AgentActivationContext,
    response: AgentResponse,
    actualOutcome: {
      timeToComplete: number;
      testsPassed: boolean;
      codeReviewed: boolean;
      deployed: boolean;
      userSatisfaction?: number;
    }
  ): Promise<void> {
    console.log('[PatternLearning] Learning from successful interaction');

    // Extract the pattern from this success
    const pattern = await this.extractPattern(context, response, actualOutcome, 'success');

    // Check if similar pattern exists
    const existingPattern = await this.findSimilarPattern(pattern);

    if (existingPattern) {
      // Reinforce existing pattern
      await this.reinforcePattern(existingPattern.id, actualOutcome);
    } else {
      // Store new winning pattern
      await this.storeNewPattern(pattern);
    }

    // Update team development style
    await this.updateTeamStyle(pattern);
  }

  /**
   * Learn from a failed approach
   * Equally important - learn what NOT to do
   */
  async learnFromFailure(
    context: AgentActivationContext,
    response: AgentResponse,
    failureReason: string,
    timeWasted: number
  ): Promise<void> {
    console.log('[PatternLearning] Learning from failure to avoid future mistakes');

    const pattern = await this.extractPattern(
      context,
      response,
      { timeToComplete: timeWasted, testsPassed: false, codeReviewed: false, deployed: false },
      'failure'
    );

    // Store as anti-pattern to avoid
    await this.storeAntiPattern(pattern, failureReason);
  }

  /**
   * Extract pattern from interaction
   */
  private async extractPattern(
    context: AgentActivationContext,
    response: AgentResponse,
    outcome: any,
    result: 'success' | 'failure'
  ): Promise<WinningPattern> {
    // Determine pattern type
    const type = this.determinePatternType(context, response);

    // Extract the approach taken
    const approach = this.extractApproach(context, response);

    // Generate description
    const description = this.generatePatternDescription(type, approach, result);

    // Create pattern
    const pattern: WinningPattern = {
      id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      context: context.filePath || context.userRequest || 'unknown',
      approach,
      outcome: result,
      successRate: result === 'success' ? 1.0 : 0.0,
      timesApplied: 1,
      averageTimeToComplete: outcome.timeToComplete,
      tags: this.extractTags(context, response),
      confidence: result === 'success' ? 0.8 : 0.2,
      lastUsed: Date.now(),
      created: Date.now()
    };

    return pattern;
  }

  /**
   * Determine what type of pattern this is
   */
  private determinePatternType(
    context: AgentActivationContext,
    response: AgentResponse
  ): WinningPattern['type'] {
    const content = context.content?.toLowerCase() || '';
    const filePath = context.filePath?.toLowerCase() || '';

    if (filePath.includes('test') || content.includes('test')) return 'testing';
    if (filePath.includes('deploy') || content.includes('deploy')) return 'deployment';
    if (content.includes('debug') || content.includes('error') || content.includes('fix')) return 'debugging';
    if (filePath.includes('architect') || content.includes('architect') || content.includes('design')) return 'architecture';

    return 'development';
  }

  /**
   * Extract the approach that was taken
   */
  private extractApproach(
    context: AgentActivationContext,
    response: AgentResponse
  ): string {
    // Combine the agent's suggestions and actions
    const suggestions = response.suggestions?.map(s => s.message || s.description).join('; ') || '';
    const message = response.message || '';

    return `${message}\nApproach: ${suggestions}`.substring(0, 500);
  }

  /**
   * Generate human-readable pattern description
   */
  private generatePatternDescription(
    type: string,
    approach: string,
    result: 'success' | 'failure'
  ): string {
    const resultText = result === 'success' ? '✅ Successfully' : '❌ Failed to';
    return `${resultText} ${type}: ${approach.substring(0, 200)}`;
  }

  /**
   * Extract tags for categorization
   */
  private extractTags(context: AgentActivationContext, response: AgentResponse): string[] {
    const tags: string[] = ['pattern', 'team-specific'];

    // Add agent tag
    if (response.agentId) {
      tags.push(response.agentId);
    }

    // Add file type tag
    if (context.filePath) {
      const extension = context.filePath.split('.').pop();
      if (extension) {
        tags.push(`filetype-${extension}`);
      }
    }

    // Add priority tag
    if (response.priority) {
      tags.push(`priority-${response.priority}`);
    }

    // Extract keywords from content
    const content = context.content?.toLowerCase() || '';
    if (content.includes('react')) tags.push('react');
    if (content.includes('typescript')) tags.push('typescript');
    if (content.includes('api')) tags.push('api');
    if (content.includes('database')) tags.push('database');
    if (content.includes('test')) tags.push('testing');

    return tags;
  }

  /**
   * Find similar existing pattern
   */
  private async findSimilarPattern(pattern: WinningPattern): Promise<WinningPattern | null> {
    // Query for similar patterns
    const result = await this.vectorStore.queryMemories({
      query: pattern.description,
      queryType: 'semantic',
      agentId: 'pattern-learning',
      topK: 1,
      filters: {
        tags: ['winning-pattern', pattern.type],
        contentTypes: ['winning-pattern']
      }
    });

    if (result.documents && result.documents.length > 0) {
      const doc = result.documents[0];
      if (doc.metadata?.relevanceScore && doc.metadata.relevanceScore > 0.85) {
        // Very similar pattern found
        return {
          id: doc.id,
          type: doc.metadata.pattern_type,
          description: doc.content,
          context: doc.metadata.context || 'unknown',
          approach: doc.metadata.approach || '',
          outcome: doc.metadata.outcome,
          successRate: doc.metadata.success_rate || 0.5,
          timesApplied: doc.metadata.times_applied || 1,
          averageTimeToComplete: doc.metadata.avg_time || 0,
          tags: doc.metadata.tags || [],
          confidence: doc.metadata.confidence || 0.5,
          lastUsed: doc.metadata.last_used || Date.now(),
          created: doc.metadata.created || Date.now()
        };
      }
    }

    return null;
  }

  /**
   * Reinforce existing pattern (it worked again!)
   */
  private async reinforcePattern(patternId: string, outcome: any): Promise<void> {
    const pattern = this.winningPatterns.get(patternId);
    if (!pattern) return;

    // Update statistics
    pattern.timesApplied++;
    pattern.successRate = (pattern.successRate * (pattern.timesApplied - 1) + 1) / pattern.timesApplied;
    pattern.averageTimeToComplete =
      (pattern.averageTimeToComplete * (pattern.timesApplied - 1) + outcome.timeToComplete) / pattern.timesApplied;
    pattern.confidence = Math.min(0.99, pattern.confidence + 0.05); // Increase confidence
    pattern.lastUsed = Date.now();

    this.winningPatterns.set(patternId, pattern);

    // Update in vector store
    await this.vectorStore.storeMemory({
      content: pattern.description,
      contentType: 'winning-pattern',
      metadata: {
        agentId: 'pattern-learning',
        timestamp: Date.now(),
        pattern_id: pattern.id,
        pattern_type: pattern.type,
        outcome: pattern.outcome,
        success_rate: pattern.successRate,
        times_applied: pattern.timesApplied,
        avg_time: pattern.averageTimeToComplete,
        confidence: pattern.confidence,
        last_used: pattern.lastUsed,
        created: pattern.created,
        approach: pattern.approach,
        context: pattern.context,
        tags: ['winning-pattern', 'reinforced', pattern.type, ...pattern.tags]
      }
    });

    console.log(`[PatternLearning] Reinforced pattern ${patternId} (applied ${pattern.timesApplied} times, ${Math.round(pattern.successRate * 100)}% success rate)`);
  }

  /**
   * Store new winning pattern
   */
  private async storeNewPattern(pattern: WinningPattern): Promise<void> {
    this.winningPatterns.set(pattern.id, pattern);

    await this.vectorStore.storeMemory({
      content: pattern.description,
      contentType: 'winning-pattern',
      metadata: {
        agentId: 'pattern-learning',
        timestamp: Date.now(),
        pattern_id: pattern.id,
        pattern_type: pattern.type,
        outcome: pattern.outcome,
        success_rate: pattern.successRate,
        times_applied: pattern.timesApplied,
        avg_time: pattern.averageTimeToComplete,
        confidence: pattern.confidence,
        last_used: pattern.lastUsed,
        created: pattern.created,
        approach: pattern.approach,
        context: pattern.context,
        tags: ['winning-pattern', 'new', pattern.type, ...pattern.tags]
      }
    });

    console.log(`[PatternLearning] Stored new winning pattern: ${pattern.description.substring(0, 100)}`);
  }

  /**
   * Store anti-pattern (what NOT to do)
   */
  private async storeAntiPattern(pattern: WinningPattern, failureReason: string): Promise<void> {
    await this.vectorStore.storeMemory({
      content: `⛔ AVOID: ${pattern.description}\nReason: ${failureReason}`,
      contentType: 'anti-pattern',
      metadata: {
        agentId: 'pattern-learning',
        timestamp: Date.now(),
        pattern_id: pattern.id,
        pattern_type: pattern.type,
        outcome: 'failure',
        failure_reason: failureReason,
        time_wasted: pattern.averageTimeToComplete,
        tags: ['anti-pattern', 'avoid', pattern.type, ...pattern.tags]
      }
    });

    console.log(`[PatternLearning] Stored anti-pattern to avoid: ${failureReason}`);
  }

  /**
   * Update team development style based on patterns
   */
  private async updateTeamStyle(pattern: WinningPattern): Promise<void> {
    // Extract team preferences from successful patterns
    if (pattern.outcome === 'success') {
      // Update preferred approaches
      if (pattern.type === 'architecture') {
        this.teamStyle.preferredArchitectures.push(pattern.approach.substring(0, 100));
      } else if (pattern.type === 'testing') {
        this.teamStyle.preferredTestingApproaches.push(pattern.approach.substring(0, 100));
      }

      // Keep only top 10 most successful
      this.teamStyle.preferredArchitectures = this.teamStyle.preferredArchitectures.slice(-10);
      this.teamStyle.preferredTestingApproaches = this.teamStyle.preferredTestingApproaches.slice(-10);
    }

    // Store team style
    await this.vectorStore.storeMemory({
      content: JSON.stringify(this.teamStyle),
      contentType: 'team-style',
      metadata: {
        agentId: 'pattern-learning',
        timestamp: Date.now(),
        tags: ['team-style', 'preferences']
      }
    });
  }

  /**
   * Query winning patterns for current context
   * This is what gets fed back to agents for better decisions
   */
  async getWinningPatternsFor(
    context: AgentActivationContext,
    limit: number = 5
  ): Promise<WinningPattern[]> {
    const query = context.content || context.userRequest || context.filePath || '';

    const result = await this.vectorStore.queryMemories({
      query,
      queryType: 'hybrid',
      agentId: 'pattern-learning',
      topK: limit,
      filters: {
        tags: ['winning-pattern'],
        contentTypes: ['winning-pattern']
      }
    });

    return (result.documents || []).map(doc => ({
      id: doc.id,
      type: doc.metadata?.pattern_type || 'development',
      description: doc.content,
      context: doc.metadata?.context || 'unknown',
      approach: doc.metadata?.approach || '',
      outcome: doc.metadata?.outcome || 'success',
      successRate: doc.metadata?.success_rate || 0.5,
      timesApplied: doc.metadata?.times_applied || 1,
      averageTimeToComplete: doc.metadata?.avg_time || 0,
      tags: doc.metadata?.tags || [],
      confidence: doc.metadata?.confidence || 0.5,
      lastUsed: doc.metadata?.last_used || Date.now(),
      created: doc.metadata?.created || Date.now()
    }));
  }

  /**
   * Get anti-patterns to avoid
   */
  async getAntiPatternsToAvoid(context: AgentActivationContext): Promise<any[]> {
    const query = context.content || context.userRequest || context.filePath || '';

    const result = await this.vectorStore.queryMemories({
      query,
      queryType: 'hybrid',
      agentId: 'pattern-learning',
      topK: 3,
      filters: {
        tags: ['anti-pattern'],
        contentTypes: ['anti-pattern']
      }
    });

    return result.documents || [];
  }

  /**
   * Get team development style
   */
  getTeamStyle(): TeamDevelopmentStyle {
    return this.teamStyle;
  }

  /**
   * Get pattern statistics
   */
  getStatistics(): any {
    const patterns = Array.from(this.winningPatterns.values());

    return {
      totalPatterns: patterns.length,
      successfulPatterns: patterns.filter(p => p.outcome === 'success').length,
      averageSuccessRate: patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length || 0,
      mostUsedPattern: patterns.sort((a, b) => b.timesApplied - a.timesApplied)[0],
      patternsByType: {
        development: patterns.filter(p => p.type === 'development').length,
        testing: patterns.filter(p => p.type === 'testing').length,
        architecture: patterns.filter(p => p.type === 'architecture').length,
        deployment: patterns.filter(p => p.type === 'deployment').length,
        debugging: patterns.filter(p => p.type === 'debugging').length
      }
    };
  }

  private initializeTeamStyle(): TeamDevelopmentStyle {
    return {
      preferredArchitectures: [],
      preferredTestingApproaches: [],
      preferredNamingConventions: [],
      preferredCodePatterns: [],
      avoidedAntiPatterns: [],
      teamVelocityMetrics: {
        averageFeatureTime: 0,
        averageBugFixTime: 0,
        codeReviewTurnaround: 0
      }
    };
  }
}