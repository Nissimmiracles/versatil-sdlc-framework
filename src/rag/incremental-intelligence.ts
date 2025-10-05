/**
 * Incremental Intelligence System
 * Framework gets smarter with every interaction
 */

import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
import { AgentResponse, AgentActivationContext } from '../agents/base-agent.js';

export interface IntelligenceMetrics {
  totalInteractions: number;
  averageQualityScore: number;
  learningRate: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

export interface Pattern {
  type: string;
  description: string;
  confidence: number;
  occurrences: number;
}

export class IncrementalIntelligence {
  private vectorStore: EnhancedVectorMemoryStore;
  private interactionCount: number = 0;
  private qualityScores: number[] = [];
  private readonly SYNTHESIS_INTERVAL = 100; // Synthesize every 100 interactions

  constructor(vectorStore: EnhancedVectorMemoryStore) {
    this.vectorStore = vectorStore;
  }

  /**
   * Record interaction and learn from it
   */
  async recordInteraction(
    agentId: string,
    context: AgentActivationContext,
    response: AgentResponse,
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    this.interactionCount++;

    const qualityScore = this.calculateQualityScore(response, userFeedback);
    this.qualityScores.push(qualityScore);

    // Store interaction with quality metrics
    await this.storeInteraction(agentId, context, response, qualityScore, userFeedback);

    // Synthesize learnings periodically
    if (this.interactionCount % this.SYNTHESIS_INTERVAL === 0) {
      await this.synthesizeLearnings();
    }
  }

  /**
   * Calculate quality score for an interaction
   */
  private calculateQualityScore(
    response: AgentResponse,
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): number {
    let score = 0.5; // Base score

    // Response completeness
    if (response.suggestions && response.suggestions.length > 0) {
      score += 0.15;
    }

    // Confidence level
    if (response.context?.confidence) {
      score += response.context.confidence * 0.15;
    }

    // Priority appropriateness (critical/high issues should be flagged)
    if (response.priority === 'critical' || response.priority === 'high') {
      score += 0.05;
    }

    // Handoff intelligence (knowing when to delegate)
    if (response.handoffTo && response.handoffTo.length > 0) {
      score += 0.05;
    }

    // User feedback (strongest signal)
    if (userFeedback === 'positive') {
      score += 0.3;
    } else if (userFeedback === 'negative') {
      score -= 0.5;
    } else if (userFeedback === 'neutral') {
      score += 0.05;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Store interaction
   */
  private async storeInteraction(
    agentId: string,
    context: AgentActivationContext,
    response: AgentResponse,
    qualityScore: number,
    userFeedback?: string
  ): Promise<void> {
    await this.vectorStore.storeMemory({
      content: JSON.stringify({
        context: {
          filePath: context.filePath,
          trigger: context.trigger,
          contentPreview: context.content?.substring(0, 200)
        },
        response: {
          message: response.message,
          priority: response.priority,
          suggestions: response.suggestions?.length || 0
        }
      }),
      contentType: 'interaction',
      metadata: {
        agentId,
        timestamp: Date.now(),
        interaction_number: this.interactionCount,
        quality_score: qualityScore,
        user_feedback: userFeedback || 'none',
        tags: ['interaction', agentId, `quality-${Math.floor(qualityScore * 10)}`],
        file_path: context.filePath || 'unknown',
        priority: response.priority
      }
    });
  }

  /**
   * Synthesize learnings from recent interactions
   */
  private async synthesizeLearnings(): Promise<void> {
    console.log(`[IncrementalIntelligence] Synthesizing learnings from ${this.interactionCount} interactions`);

    // Query top 20% highest quality interactions
    const topInteractions = await this.queryTopQualityInteractions(50);

    if (topInteractions.length === 0) {
      return;
    }

    // Extract patterns
    const patterns = this.extractPatterns(topInteractions);

    // Store patterns as meta-learnings
    for (const pattern of patterns) {
      await this.storeMetaLearning(pattern);
    }

    console.log(`[IncrementalIntelligence] Stored ${patterns.length} new meta-learning patterns`);
  }

  /**
   * Query top quality interactions
   */
  private async queryTopQualityInteractions(limit: number): Promise<any[]> {
    const result = await this.vectorStore.queryMemories({
      query: 'high quality successful interactions positive feedback',
      queryType: 'hybrid',
      agentId: 'all',
      topK: limit,
      filters: {
        tags: ['interaction'],
        contentTypes: ['interaction']
      }
    });

    // Filter for high quality (score >= 0.7)
    const highQuality = (result.documents || []).filter(
      doc => doc.metadata?.quality_score && doc.metadata.quality_score >= 0.7
    );

    return highQuality;
  }

  /**
   * Extract patterns from interactions
   */
  private extractPatterns(interactions: any[]): Pattern[] {
    const patterns: Pattern[] = [];
    const patternCounts: Map<string, { count: number; totalConfidence: number }> = new Map();

    for (const interaction of interactions) {
      const metadata = interaction.metadata || {};

      // Pattern 1: Agent-Priority patterns
      const agentPriorityPattern = `${metadata.agentId}-handles-${metadata.priority}`;
      this.incrementPattern(patternCounts, agentPriorityPattern, metadata.quality_score || 0.5);

      // Pattern 2: File type patterns
      if (metadata.file_path) {
        const extension = metadata.file_path.split('.').pop();
        const fileTypePattern = `${metadata.agentId}-processes-${extension}`;
        this.incrementPattern(patternCounts, fileTypePattern, metadata.quality_score || 0.5);
      }

      // Pattern 3: User feedback patterns
      if (metadata.user_feedback && metadata.user_feedback !== 'none') {
        const feedbackPattern = `${metadata.agentId}-receives-${metadata.user_feedback}-feedback`;
        this.incrementPattern(patternCounts, feedbackPattern, metadata.quality_score || 0.5);
      }
    }

    // Convert to patterns with confidence
    for (const [patternKey, stats] of patternCounts.entries()) {
      if (stats.count >= 3) { // Minimum occurrences
        const confidence = stats.totalConfidence / stats.count;
        patterns.push({
          type: this.extractPatternType(patternKey),
          description: this.humanizePattern(patternKey),
          confidence,
          occurrences: stats.count
        });
      }
    }

    return patterns;
  }

  /**
   * Increment pattern count
   */
  private incrementPattern(
    counts: Map<string, { count: number; totalConfidence: number }>,
    pattern: string,
    confidence: number
  ): void {
    const existing = counts.get(pattern) || { count: 0, totalConfidence: 0 };
    counts.set(pattern, {
      count: existing.count + 1,
      totalConfidence: existing.totalConfidence + confidence
    });
  }

  /**
   * Extract pattern type from pattern key
   */
  private extractPatternType(patternKey: string): string {
    if (patternKey.includes('-handles-')) return 'agent-priority';
    if (patternKey.includes('-processes-')) return 'file-type';
    if (patternKey.includes('-feedback')) return 'user-feedback';
    return 'general';
  }

  /**
   * Convert pattern key to human-readable description
   */
  private humanizePattern(patternKey: string): string {
    return patternKey.replace(/-/g, ' ').replace(/_/g, ' ');
  }

  /**
   * Store meta-learning pattern
   */
  private async storeMetaLearning(pattern: Pattern): Promise<void> {
    await this.vectorStore.storeMemory({
      content: pattern.description,
      contentType: 'meta-learning',
      metadata: {
        agentId: 'meta-learning',
        timestamp: Date.now(),
        pattern_type: pattern.type,
        confidence: pattern.confidence,
        occurrences: pattern.occurrences,
        tags: ['meta-learning', 'pattern', pattern.type],
        synthesis_cycle: Math.floor(this.interactionCount / this.SYNTHESIS_INTERVAL)
      }
    });
  }

  /**
   * Get intelligence metrics
   */
  getMetrics(): IntelligenceMetrics {
    const recentScores = this.qualityScores.slice(-100); // Last 100
    const averageQuality = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length || 0;

    // Calculate learning rate (improvement over time)
    const firstHalfAvg = recentScores.slice(0, 50).reduce((sum, s) => sum + s, 0) / 50 || 0;
    const secondHalfAvg = recentScores.slice(50).reduce((sum, s) => sum + s, 0) / 50 || 0;
    const learningRate = secondHalfAvg - firstHalfAvg;

    const improvementTrend =
      learningRate > 0.05 ? 'improving' :
      learningRate < -0.05 ? 'declining' :
      'stable';

    return {
      totalInteractions: this.interactionCount,
      averageQualityScore: averageQuality,
      learningRate,
      improvementTrend
    };
  }

  /**
   * Query meta-learnings for agent
   */
  async queryMetaLearnings(agentId: string, limit: number = 10): Promise<any[]> {
    const result = await this.vectorStore.queryMemories({
      query: `${agentId} meta-learning patterns`,
      queryType: 'semantic',
      agentId: 'meta-learning',
      topK: limit,
      filters: {
        tags: ['meta-learning', 'pattern'],
        contentTypes: ['meta-learning']
      }
    });

    return result.documents || [];
  }

  /**
   * Reset intelligence metrics
   */
  reset(): void {
    this.interactionCount = 0;
    this.qualityScores = [];
  }
}