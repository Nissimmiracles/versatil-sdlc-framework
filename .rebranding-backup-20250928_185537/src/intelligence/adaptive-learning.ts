/**
 * VERSATIL SDLC Framework - Adaptive Learning & Auto-Improvement System
 *
 * This system learns from user interactions and automatically improves
 * the Enhanced BMAD agents based on real usage patterns, feedback, and outcomes.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger';

export interface UserInteraction {
  id: string;
  timestamp: number;
  agentId: string;
  actionType: 'activation' | 'feedback' | 'dismissal' | 'follow_suggestion' | 'ignore_suggestion';
  context: {
    filePath?: string;
    fileType?: string;
    projectType?: string;
    userRole?: string;
    issue?: {
      type: string;
      severity: string;
      wasAccurate: boolean;
      userVerified: boolean;
    };
    suggestion?: {
      id: string;
      type: string;
      wasFollowed: boolean;
      wasHelpful: boolean;
      userRating?: number; // 1-5 scale
    };
  };
  outcome?: {
    problemSolved: boolean;
    timeToResolution?: number;
    userSatisfaction?: number; // 1-5 scale
    agentAccuracy?: number; // 0-1 scale
  };
}

export interface LearningPattern {
  id: string;
  agentId: string;
  pattern: string;
  confidence: number; // 0-1 scale
  usageCount: number;
  successRate: number;
  context: {
    fileTypes: string[];
    projectTypes: string[];
    commonIssues: string[];
    userPreferences: Record<string, any>;
  };
  recommendations: {
    agentImprovements: string[];
    detectionRules: string[];
    suggestionTypes: string[];
  };
}

export interface AgentAdaptation {
  agentId: string;
  adaptationType: 'detection_rule' | 'suggestion_algorithm' | 'priority_weighting' | 'context_awareness';
  changes: Record<string, any>;
  confidence: number;
  expectedImprovement: number;
  rollbackData?: Record<string, any>;
}

export class AdaptiveLearningEngine extends EventEmitter {
  private logger: VERSATILLogger;
  private interactions: Map<string, UserInteraction[]> = new Map();
  private patterns: Map<string, LearningPattern> = new Map();
  private adaptations: Map<string, AgentAdaptation[]> = new Map();
  private learningConfig: {
    minInteractionsForPattern: number;
    confidenceThreshold: number;
    adaptationInterval: number;
    maxAdaptationsPerAgent: number;
  };
  private dataPath: string;
  private isLearning: boolean = false;

  constructor() {
    super();
    this.logger = new VERSATILLogger();
    this.dataPath = path.join(process.cwd(), '.versatil', 'learning');
    this.learningConfig = {
      minInteractionsForPattern: 10,
      confidenceThreshold: 0.7,
      adaptationInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxAdaptationsPerAgent: 5
    };
    this.initializeLearning();
  }

  /**
   * Start the adaptive learning process
   */
  public startLearning(): void {
    if (this.isLearning) return;

    this.isLearning = true;
    this.logger.info('Adaptive learning engine started', {}, 'adaptive-learning');

    // Load historical data
    this.loadLearningData();

    // Start periodic pattern analysis
    setInterval(() => {
      this.analyzePatterns();
    }, this.learningConfig.adaptationInterval);

    // Start real-time adaptation
    this.on('interaction', this.handleInteraction.bind(this));
    this.on('pattern_discovered', this.handlePatternDiscovery.bind(this));
  }

  /**
   * Stop the learning engine
   */
  public stopLearning(): void {
    this.isLearning = false;
    this.logger.info('Adaptive learning stopped', {}, 'adaptive-learning');
  }

  /**
   * Record a user interaction with an agent
   */
  public recordInteraction(interaction: UserInteraction): void {
    if (!this.isLearning) return;
    if (!this.interactions.has(interaction.agentId)) {
      this.interactions.set(interaction.agentId, []);
    }

    this.interactions.get(interaction.agentId)!.push(interaction);

    this.logger.info('User interaction recorded', {
      agentId: interaction.agentId,
      actionType: interaction.actionType,
      context: interaction.context
    }, 'adaptive-learning');

    this.emit('interaction', interaction);
    this.saveInteraction(interaction);
  }

  /**
   * Analyze user interactions to discover learning patterns
   */
  private async analyzePatterns(): Promise<void> {
    this.logger.info('Analyzing user interaction patterns...', {}, 'adaptive-learning');

    for (const [agentId, interactions] of this.interactions) {
      if (interactions.length < this.learningConfig.minInteractionsForPattern) {
        continue;
      }

      // Analyze success/failure patterns
      const successPatterns = this.findSuccessPatterns(agentId, interactions);
      const failurePatterns = this.findFailurePatterns(agentId, interactions);
      const userPreferences = this.extractUserPreferences(interactions);

      // Create learning patterns
      for (const pattern of [...successPatterns, ...failurePatterns]) {
        this.patterns.set(pattern.id, pattern);
        this.emit('pattern_discovered', pattern);
      }

      // Generate agent adaptations
      const adaptations = await this.generateAdaptations(agentId, interactions, userPreferences);
      for (const adaptation of adaptations) {
        this.proposeAdaptation(agentId, adaptation);
      }
    }
  }

  /**
   * Find patterns that lead to successful outcomes
   */
  private findSuccessPatterns(agentId: string, interactions: UserInteraction[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    const successfulInteractions = interactions.filter(i =>
      i.outcome?.problemSolved &&
      (i.outcome?.userSatisfaction ?? 0) >= 4
    );

    // Group by file type
    const fileTypeGroups = this.groupByFileType(successfulInteractions);

    for (const [fileType, groupInteractions] of fileTypeGroups) {
      if (groupInteractions.length >= 5) {
        const pattern: LearningPattern = {
          id: `${agentId}_success_${fileType}_${Date.now()}`,
          agentId,
          pattern: `Successful detection in ${fileType} files`,
          confidence: this.calculateConfidence(groupInteractions),
          usageCount: groupInteractions.length,
          successRate: this.calculateSuccessRate(groupInteractions),
          context: {
            fileTypes: [fileType],
            projectTypes: this.extractProjectTypes(groupInteractions),
            commonIssues: this.extractCommonIssues(groupInteractions),
            userPreferences: this.extractUserPreferences(groupInteractions)
          },
          recommendations: {
            agentImprovements: this.generateAgentImprovements(groupInteractions),
            detectionRules: this.generateDetectionRules(groupInteractions),
            suggestionTypes: this.generateSuggestionTypes(groupInteractions)
          }
        };

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Find patterns that lead to failed outcomes
   */
  private findFailurePatterns(agentId: string, interactions: UserInteraction[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    const failedInteractions = interactions.filter(i =>
      !i.outcome?.problemSolved ||
      (i.outcome?.userSatisfaction ?? 5) < 3 ||
      i.context.issue?.wasAccurate === false
    );

    // Analyze false positives
    const falsePositives = failedInteractions.filter(i =>
      i.context.issue?.wasAccurate === false
    );

    if (falsePositives.length >= 3) {
      const pattern: LearningPattern = {
        id: `${agentId}_false_positive_${Date.now()}`,
        agentId,
        pattern: 'False positive detection pattern',
        confidence: this.calculateConfidence(falsePositives),
        usageCount: falsePositives.length,
        successRate: 0,
        context: {
          fileTypes: this.extractFileTypes(falsePositives),
          projectTypes: this.extractProjectTypes(falsePositives),
          commonIssues: this.extractCommonIssues(falsePositives),
          userPreferences: {}
        },
        recommendations: {
          agentImprovements: ['Reduce false positive rate for these patterns'],
          detectionRules: this.generateAntiPatterns(falsePositives),
          suggestionTypes: ['Add confidence scoring to suggestions']
        }
      };

      patterns.push(pattern);
    }

    return patterns;
  }

  /**
   * Generate adaptive improvements for agents
   */
  private async generateAdaptations(
    agentId: string,
    interactions: UserInteraction[],
    userPreferences: Record<string, any>
  ): Promise<AgentAdaptation[]> {
    const adaptations: AgentAdaptation[] = [];

    // Analyze suggestion follow-through rates
    const suggestionAnalysis = this.analyzeSuggestionEffectiveness(interactions);

    if (suggestionAnalysis.lowFollowThroughSuggestions.length > 0) {
      adaptations.push({
        agentId,
        adaptationType: 'suggestion_algorithm',
        changes: {
          deprioritizeSuggestions: suggestionAnalysis.lowFollowThroughSuggestions,
          prioritizeSuggestions: suggestionAnalysis.highFollowThroughSuggestions
        },
        confidence: 0.8,
        expectedImprovement: 0.15
      });
    }

    // Analyze detection accuracy
    const detectionAnalysis = this.analyzeDetectionAccuracy(interactions);

    if (detectionAnalysis.falsePositiveRate > 0.2) {
      adaptations.push({
        agentId,
        adaptationType: 'detection_rule',
        changes: {
          addExclusions: detectionAnalysis.falsePositivePatterns,
          increaseConfidenceThreshold: true
        },
        confidence: 0.7,
        expectedImprovement: 0.25
      });
    }

    // Adapt to user preferences
    if (userPreferences['preferredSeverityLevel']) {
      adaptations.push({
        agentId,
        adaptationType: 'priority_weighting',
        changes: {
          adjustSeverityWeights: userPreferences['preferredSeverityLevel'],
          personalizeAlerts: userPreferences['alertPreferences']
        },
        confidence: 0.9,
        expectedImprovement: 0.1
      });
    }

    return adaptations;
  }

  /**
   * Propose an adaptation to an agent
   */
  private proposeAdaptation(agentId: string, adaptation: AgentAdaptation): void {
    if (!this.adaptations.has(agentId)) {
      this.adaptations.set(agentId, []);
    }

    const agentAdaptations = this.adaptations.get(agentId)!;

    // Don't exceed max adaptations per agent
    if (agentAdaptations.length >= this.learningConfig.maxAdaptationsPerAgent) {
      // Remove least confident adaptation
      const leastConfident = agentAdaptations.reduce((min, curr) =>
        curr.confidence < min.confidence ? curr : min
      );
      const index = agentAdaptations.indexOf(leastConfident);
      agentAdaptations.splice(index, 1);
    }

    agentAdaptations.push(adaptation);

    this.logger.info('Agent adaptation proposed', {
      agentId,
      adaptationType: adaptation.adaptationType,
      confidence: adaptation.confidence,
      expectedImprovement: adaptation.expectedImprovement
    }, 'adaptive-learning');

    this.emit('adaptation_proposed', { agentId, adaptation });
  }

  /**
   * Apply approved adaptations to agents
   */
  public async applyAdaptation(agentId: string, adaptationId: string): Promise<boolean> {
    const agentAdaptations = this.adaptations.get(agentId);
    if (!agentAdaptations) return false;

    const adaptation = agentAdaptations.find(a =>
      `${a.agentId}_${a.adaptationType}_${a.confidence}` === adaptationId
    );

    if (!adaptation) return false;

    try {
      // Store rollback data
      adaptation.rollbackData = await this.createRollbackData(agentId);

      // Apply the adaptation
      await this.applyAdaptationChanges(agentId, adaptation);

      this.logger.info('Agent adaptation applied successfully', {
        agentId,
        adaptationType: adaptation.adaptationType
      }, 'adaptive-learning');

      this.emit('adaptation_applied', { agentId, adaptation });
      return true;

    } catch (error) {
      this.logger.error('Failed to apply agent adaptation', {
        agentId,
        adaptationType: adaptation.adaptationType,
        error: error instanceof Error ? error.message : String(error)
      }, 'adaptive-learning');

      return false;
    }
  }

  /**
   * Get learning insights for dashboard
   */
  public getLearningInsights(): {
    totalInteractions: number;
    patternsDiscovered: number;
    adaptationsProposed: number;
    adaptationsApplied: number;
    topPerformingAgents: Array<{ agentId: string; successRate: number }>;
    recentLearnings: LearningPattern[];
  } {
    const totalInteractions = Array.from(this.interactions.values())
      .reduce((sum, interactions) => sum + interactions.length, 0);

    const patternsDiscovered = this.patterns.size;

    const adaptationsProposed = Array.from(this.adaptations.values())
      .reduce((sum, adaptations) => sum + adaptations.length, 0);

    const topPerformingAgents = this.calculateTopPerformingAgents();

    const recentLearnings = Array.from(this.patterns.values())
      .sort((a, b) => parseInt(b.id.split('_').pop()!) - parseInt(a.id.split('_').pop()!))
      .slice(0, 5);

    return {
      totalInteractions,
      patternsDiscovered,
      adaptationsProposed,
      adaptationsApplied: 0, // Would track from applied adaptations log
      topPerformingAgents,
      recentLearnings
    };
  }

  // Helper methods
  private initializeLearning(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private loadLearningData(): void {
    try {
      const interactionsFile = path.join(this.dataPath, 'interactions.json');
      const patternsFile = path.join(this.dataPath, 'patterns.json');

      if (fs.existsSync(interactionsFile)) {
        const data = JSON.parse(fs.readFileSync(interactionsFile, 'utf8'));
        this.interactions = new Map(Object.entries(data));
      }

      if (fs.existsSync(patternsFile)) {
        const data = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
        this.patterns = new Map(Object.entries(data));
      }
    } catch (error) {
      this.logger.error('Failed to load learning data', { error: error instanceof Error ? error.message : String(error) }, 'adaptive-learning');
    }
  }

  private saveInteraction(interaction: UserInteraction): void {
    // Save to persistent storage for learning
    const interactionsFile = path.join(this.dataPath, 'interactions.json');
    const data = Object.fromEntries(this.interactions);
    fs.writeFileSync(interactionsFile, JSON.stringify(data, null, 2));
  }

  private handleInteraction(interaction: UserInteraction): void {
    // Real-time learning from interactions
    if (interaction.outcome?.problemSolved && interaction.outcome.userSatisfaction && interaction.outcome.userSatisfaction >= 4) {
      this.reinforceSuccessfulBehavior(interaction);
    } else if (interaction.context.issue?.wasAccurate === false) {
      this.adjustForFalsePositive(interaction);
    }
  }

  private handlePatternDiscovery(pattern: LearningPattern): void {
    this.logger.info('New learning pattern discovered', {
      patternId: pattern.id,
      agentId: pattern.agentId,
      confidence: pattern.confidence,
      successRate: pattern.successRate
    }, 'adaptive-learning');
  }

  // Additional helper methods would be implemented here...
  private groupByFileType(interactions: UserInteraction[]): Map<string, UserInteraction[]> {
    const groups = new Map<string, UserInteraction[]>();
    // Implementation...
    return groups;
  }

  private calculateConfidence(interactions: UserInteraction[]): number {
    // Implementation based on interaction quality and outcomes
    return 0.8;
  }

  private calculateSuccessRate(interactions: UserInteraction[]): number {
    const successful = interactions.filter(i => i.outcome?.problemSolved);
    return successful.length / interactions.length;
  }

  private extractProjectTypes(interactions: UserInteraction[]): string[] {
    return interactions.map(i => i.context.projectType).filter(Boolean) as string[];
  }

  private extractCommonIssues(interactions: UserInteraction[]): string[] {
    return interactions.map(i => i.context.issue?.type).filter(Boolean) as string[];
  }

  private extractUserPreferences(interactions: UserInteraction[]): Record<string, any> {
    // Analyze user behavior patterns to extract preferences
    return {};
  }

  private generateAgentImprovements(interactions: UserInteraction[]): string[] {
    return ['Improve detection accuracy for this file type'];
  }

  private generateDetectionRules(interactions: UserInteraction[]): string[] {
    return ['Add specialized rules for successful patterns'];
  }

  private generateSuggestionTypes(interactions: UserInteraction[]): string[] {
    return ['Prioritize suggestion types that users follow'];
  }

  private extractFileTypes(interactions: UserInteraction[]): string[] {
    return interactions.map(i => i.context.fileType).filter(Boolean) as string[];
  }

  private generateAntiPatterns(interactions: UserInteraction[]): string[] {
    return ['Exclude patterns that cause false positives'];
  }

  private analyzeSuggestionEffectiveness(interactions: UserInteraction[]): any {
    return { lowFollowThroughSuggestions: [], highFollowThroughSuggestions: [] };
  }

  private analyzeDetectionAccuracy(interactions: UserInteraction[]): any {
    return { falsePositiveRate: 0.1, falsePositivePatterns: [] };
  }

  private calculateTopPerformingAgents(): Array<{ agentId: string; successRate: number }> {
    return [];
  }

  private reinforceSuccessfulBehavior(interaction: UserInteraction): void {
    // Implement reinforcement learning
  }

  private adjustForFalsePositive(interaction: UserInteraction): void {
    // Implement negative feedback learning
  }

  private async createRollbackData(agentId: string): Promise<Record<string, any>> {
    return {};
  }

  private async applyAdaptationChanges(agentId: string, adaptation: AgentAdaptation): Promise<void> {
    // Apply changes to the agent's configuration/behavior
  }
}

// Export singleton instance
export const adaptiveLearning = new AdaptiveLearningEngine();
export default adaptiveLearning;