/**
 * VERSATIL Framework - Priority Scoring Engine
 * Calculates 0-10 priority scores for sub-agents
 *
 * Features:
 * - Multi-factor scoring: criticality, dependencies, deadlines, impact
 * - RAG-based historical priority learning
 * - Dynamic re-scoring as conditions change
 * - Epic-level priority inheritance
 * - Business value integration
 * - SLA-aware scoring
 *
 * Addresses: User requirement #2 - "avoid conflicts/collision with bad priorities"
 */

import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

export interface TaskContext {
  taskId: string;
  taskType: 'epic' | 'story' | 'task' | 'subtask';
  agentType: 'maria-qa' | 'james-frontend' | 'marcus-backend' | 'sarah-pm' | 'alex-ba' | 'dr-ai-ml';
  description: string;
  files: string[];

  // Priority factors
  criticality: 'p0-critical' | 'p1-high' | 'p2-medium' | 'p3-low';
  dependencies: string[]; // Task IDs this depends on
  blockedBy: string[]; // Task IDs blocking others
  deadline?: number; // Unix timestamp
  businessValue?: number; // 0-10 score from Alex-BA
  technicalComplexity?: number; // 0-10 score
  estimatedDuration?: number; // Minutes

  // Epic context
  epicId?: string;
  epicPriority?: number; // Inherited from epic

  // SLA context
  slaTarget?: number; // Target response time (ms)
  customerFacing?: boolean; // User-facing feature
  securityRelated?: boolean; // Security fix/feature

  // Historical context
  similarTasksPriority?: number; // Average priority of similar tasks
}

export interface PriorityScore {
  total: number; // Final 0-10 score
  breakdown: {
    criticalityScore: number; // 0-4 points
    dependencyScore: number; // 0-2 points
    deadlineScore: number; // 0-2 points
    businessValueScore: number; // 0-1 point
    impactScore: number; // 0-1 point
  };
  reasoning: string[];
  confidence: number; // 0-1 (how confident we are in this score)
  historicalMatch?: number; // Similarity to historical tasks
}

export interface PriorityAdjustment {
  taskId: string;
  oldPriority: number;
  newPriority: number;
  reason: string;
  timestamp: number;
}

export class PriorityS coringEngine extends EventEmitter {
  private vectorStore: EnhancedVectorMemoryStore;
  private priorityHistory: Map<string, PriorityScore> = new Map();
  private adjustmentHistory: PriorityAdjustment[] = [];

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super();
    this.vectorStore = vectorStore || new EnhancedVectorMemoryStore();
  }

  async initialize(): Promise<void> {
    console.log('🎯 Priority Scoring Engine initializing...');

    // Load historical priority patterns from RAG
    await this.loadHistoricalPriorities();

    this.emit('engine:initialized');
    console.log('✅ Priority Scoring Engine ready');
  }

  /**
   * Calculate priority score for a task (main method)
   */
  async calculatePriority(context: TaskContext): Promise<PriorityScore> {
    console.log(`🎯 Calculating priority for task: ${context.taskId}`);

    const reasoning: string[] = [];

    // Factor 1: Criticality (0-4 points)
    const criticalityScore = this.scoreCriticality(context.criticality);
    reasoning.push(`Criticality (${context.criticality}): ${criticalityScore}/4 points`);

    // Factor 2: Dependencies (0-2 points)
    const dependencyScore = this.scoreDependencies(context.dependencies, context.blockedBy);
    if (context.blockedBy.length > 0) {
      reasoning.push(`Blocking ${context.blockedBy.length} tasks: ${dependencyScore}/2 points`);
    }

    // Factor 3: Deadline (0-2 points)
    const deadlineScore = context.deadline ? this.scoreDeadline(context.deadline) : 0;
    if (context.deadline) {
      const hoursUntilDeadline = (context.deadline - Date.now()) / (1000 * 60 * 60);
      reasoning.push(`Deadline in ${hoursUntilDeadline.toFixed(1)}h: ${deadlineScore}/2 points`);
    }

    // Factor 4: Business Value (0-1 point)
    const businessValueScore = context.businessValue ? context.businessValue / 10 : 0;
    if (context.businessValue) {
      reasoning.push(`Business value: ${businessValueScore}/1 point`);
    }

    // Factor 5: Impact (0-1 point)
    const impactScore = this.scoreImpact(context);
    const impactReasons: string[] = [];
    if (context.customerFacing) impactReasons.push('customer-facing');
    if (context.securityRelated) impactReasons.push('security');
    if (impactReasons.length > 0) {
      reasoning.push(`Impact (${impactReasons.join(', ')}): ${impactScore}/1 point`);
    }

    // Calculate total (0-10)
    const total = Math.min(10,
      criticalityScore +
      dependencyScore +
      deadlineScore +
      businessValueScore +
      impactScore
    );

    // Query RAG for similar tasks
    const historicalMatch = await this.queryHistoricalPriority(context);
    if (historicalMatch) {
      reasoning.push(`Historical match: ${(historicalMatch.similarity * 100).toFixed(1)}% similar (priority ${historicalMatch.priority})`);
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(context, historicalMatch);

    const score: PriorityScore = {
      total: Math.round(total * 10) / 10, // Round to 1 decimal
      breakdown: {
        criticalityScore,
        dependencyScore,
        deadlineScore,
        businessValueScore,
        impactScore
      },
      reasoning,
      confidence,
      historicalMatch: historicalMatch?.similarity
    };

    // Store in history
    this.priorityHistory.set(context.taskId, score);

    // Store in RAG for future reference
    await this.storePriorityPattern(context, score);

    this.emit('priority:calculated', {
      taskId: context.taskId,
      priority: score.total,
      confidence: score.confidence
    });

    console.log(`   ✅ Priority: ${score.total}/10 (confidence: ${(confidence * 100).toFixed(1)}%)`);
    console.log(`   📊 Breakdown: C=${criticalityScore} D=${dependencyScore} DL=${deadlineScore} BV=${businessValueScore} I=${impactScore}`);

    return score;
  }

  /**
   * Score criticality level (0-4 points)
   */
  private scoreCriticality(criticality: TaskContext['criticality']): number {
    const scores: Record<TaskContext['criticality'], number> = {
      'p0-critical': 4, // Production outage, critical bug
      'p1-high': 3,     // Major feature, high-priority bug
      'p2-medium': 2,   // Standard feature, medium bug
      'p3-low': 1       // Nice-to-have, minor improvement
    };
    return scores[criticality];
  }

  /**
   * Score dependencies (0-2 points)
   */
  private scoreDependencies(dependencies: string[], blockedBy: string[]): number {
    // More tasks blocked = higher priority
    if (blockedBy.length >= 5) return 2; // Blocking many tasks
    if (blockedBy.length >= 2) return 1.5;
    if (blockedBy.length >= 1) return 1;

    // Fewer dependencies = slightly higher priority (can start sooner)
    if (dependencies.length === 0) return 0.5;

    return 0;
  }

  /**
   * Score deadline urgency (0-2 points)
   */
  private scoreDeadline(deadline: number): number {
    const hoursUntilDeadline = (deadline - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilDeadline < 0) return 2; // Past deadline!
    if (hoursUntilDeadline < 2) return 2; // < 2 hours
    if (hoursUntilDeadline < 6) return 1.5; // < 6 hours
    if (hoursUntilDeadline < 24) return 1; // < 1 day
    if (hoursUntilDeadline < 72) return 0.5; // < 3 days

    return 0; // Plenty of time
  }

  /**
   * Score impact (0-1 point)
   */
  private scoreImpact(context: TaskContext): number {
    let score = 0;

    // Customer-facing features get priority
    if (context.customerFacing) score += 0.5;

    // Security-related tasks get priority
    if (context.securityRelated) score += 0.5;

    // SLA targets
    if (context.slaTarget && context.slaTarget < 200) {
      score += 0.3; // Strict SLA
    }

    return Math.min(1, score);
  }

  /**
   * Query RAG for similar historical tasks
   */
  private async queryHistoricalPriority(context: TaskContext): Promise<{ priority: number; similarity: number } | null> {
    const query = `${context.agentType} ${context.taskType}: ${context.description}`;

    try {
      const results = await this.vectorStore.queryMemory(query, 'task-priorities', 5);
      if (results.length > 0 && results[0].similarity > 0.7) {
        return {
          priority: results[0].metadata?.priority || 5,
          similarity: results[0].similarity
        };
      }
    } catch (error) {
      console.warn('Failed to query historical priorities:', error);
    }

    return null;
  }

  /**
   * Calculate confidence in priority score
   */
  private calculateConfidence(context: TaskContext, historicalMatch?: { priority: number; similarity: number } | null): number {
    let confidence = 0.5; // Base confidence

    // More factors provided = higher confidence
    if (context.criticality) confidence += 0.1;
    if (context.dependencies.length > 0 || context.blockedBy.length > 0) confidence += 0.1;
    if (context.deadline) confidence += 0.1;
    if (context.businessValue) confidence += 0.1;
    if (context.epicPriority) confidence += 0.1;

    // Strong historical match = higher confidence
    if (historicalMatch && historicalMatch.similarity > 0.85) {
      confidence += 0.2;
    }

    return Math.min(1, confidence);
  }

  /**
   * Store priority pattern in RAG
   */
  private async storePriorityPattern(context: TaskContext, score: PriorityScore): Promise<void> {
    const pattern = {
      taskType: context.taskType,
      agentType: context.agentType,
      criticality: context.criticality,
      priority: score.total,
      confidence: score.confidence,
      reasoning: score.reasoning.join('; '),
      timestamp: Date.now()
    };

    try {
      await this.vectorStore.storeMemory(
        `${context.agentType} ${context.taskType}: ${context.description}`,
        'task-priorities',
        pattern
      );
    } catch (error) {
      console.warn('Failed to store priority pattern in RAG:', error);
    }
  }

  /**
   * Load historical priorities from RAG
   */
  private async loadHistoricalPriorities(): Promise<void> {
    try {
      const priorities = await this.vectorStore.queryMemory('task priorities', 'task-priorities', 100);
      console.log(`   📚 Loaded ${priorities.length} historical task priorities from RAG`);
    } catch (error) {
      console.warn('   ⚠️  Failed to load historical priorities (starting fresh)');
    }
  }

  /**
   * Adjust priority dynamically (conditions changed)
   */
  async adjustPriority(
    taskId: string,
    reason: 'deadline-approaching' | 'dependency-completed' | 'blocking-increased' | 'manual-override',
    adjustment: number
  ): Promise<PriorityScore> {
    const currentScore = this.priorityHistory.get(taskId);
    if (!currentScore) {
      throw new Error(`Task ${taskId} not found in priority history`);
    }

    const oldPriority = currentScore.total;
    const newPriority = Math.max(0, Math.min(10, oldPriority + adjustment));

    // Record adjustment
    this.adjustmentHistory.push({
      taskId,
      oldPriority,
      newPriority,
      reason,
      timestamp: Date.now()
    });

    // Update score
    const updatedScore: PriorityScore = {
      ...currentScore,
      total: newPriority,
      reasoning: [
        ...currentScore.reasoning,
        `Adjusted ${adjustment > 0 ? '+' : ''}${adjustment} (${reason})`
      ]
    };

    this.priorityHistory.set(taskId, updatedScore);

    this.emit('priority:adjusted', {
      taskId,
      oldPriority,
      newPriority,
      reason
    });

    console.log(`🔄 Priority adjusted: ${taskId} ${oldPriority} → ${newPriority} (${reason})`);

    return updatedScore;
  }

  /**
   * Batch calculate priorities for multiple tasks
   */
  async batchCalculate(contexts: TaskContext[]): Promise<Map<string, PriorityScore>> {
    console.log(`🎯 Batch calculating priorities for ${contexts.length} tasks...`);

    const scores = new Map<string, PriorityScore>();

    for (const context of contexts) {
      const score = await this.calculatePriority(context);
      scores.set(context.taskId, score);
    }

    console.log(`✅ Batch calculation complete`);
    return scores;
  }

  /**
   * Get priority for task (from history)
   */
  getPriority(taskId: string): PriorityScore | undefined {
    return this.priorityHistory.get(taskId);
  }

  /**
   * Get all priorities sorted (highest first)
   */
  getSortedPriorities(): Array<{ taskId: string; score: PriorityScore }> {
    return Array.from(this.priorityHistory.entries())
      .map(([taskId, score]) => ({ taskId, score }))
      .sort((a, b) => b.score.total - a.score.total);
  }

  /**
   * Get adjustment history
   */
  getAdjustmentHistory(taskId?: string): PriorityAdjustment[] {
    if (taskId) {
      return this.adjustmentHistory.filter(adj => adj.taskId === taskId);
    }
    return [...this.adjustmentHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.priorityHistory.clear();
    this.adjustmentHistory = [];
    console.log('🧹 Priority history cleared');
  }

  /**
   * Shutdown engine
   */
  async shutdown(): Promise<void> {
    this.priorityHistory.clear();
    this.adjustmentHistory = [];
    this.emit('engine:shutdown');
    console.log('🛑 Priority Scoring Engine shut down');
  }
}

// Export singleton instance
export const globalPriorityScoringEngine = new PriorityScoringEngine();
