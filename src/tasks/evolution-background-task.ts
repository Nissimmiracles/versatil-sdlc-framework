/**
 * VERSATIL OPERA v6.1 - Evolution Background Task
 *
 * Continuous self-learning and framework evolution through:
 * - Daily research on AI/development best practices
 * - Pattern learning from successful/failed executions
 * - Framework optimization recommendations
 * - Knowledge base enrichment
 * - Task plan execution pattern learning (NEW v6.1)
 *
 * Runs as an SDK Background Task with two schedules:
 * - Daily research: 3 AM (configurable)
 * - Pattern learning: Continuous (triggered by agent executions)
 *
 * Integrates with:
 * - RAGEnabledAgent (pattern storage and retrieval)
 * - FlywheelHealthMonitor (learns from flywheel performance)
 * - ContextSentinel (learns from context patterns)
 * - All OPERA agents (learns from execution patterns)
 * - TaskPlanManager (learns from plan executions) - NEW v6.1
 *
 * @module EvolutionBackgroundTask
 * @version 6.1.0
 */

import { EventEmitter } from 'events';
import type { TaskPlan, Task } from '../planning/task-plan-manager.js';

export interface EvolutionConfig {
  dailyResearch: {
    enabled: boolean;
    scheduleTime: string;  // "03:00" format (HH:MM)
    researchTopics: string[];  // Topics to research
    maxResearchDuration: number;  // Milliseconds (default: 30 minutes)
  };
  patternLearning: {
    enabled: boolean;
    minExecutionsForPattern: number;  // Minimum executions before considering a pattern
    successRateThreshold: number;  // Success rate to consider pattern "good" (0-1)
    autoEnrichment: boolean;  // Auto-add learned patterns to RAG
    taskPlanLearning: boolean;  // NEW v6.1: Learn from task plan executions
  };
  optimization: {
    enabled: boolean;
    analyzeInterval: number;  // Milliseconds (default: 1 hour)
    autoApplyRecommendations: boolean;  // Auto-apply safe optimizations
  };
  integrations: {
    userNotifications: boolean;
    ragStorage: boolean;
    reportGeneration: boolean;
    taskPlanManager?: any;  // NEW v6.1: TaskPlanManager instance for event listening
  };
}

export interface EvolutionStatus {
  running: boolean;
  lastResearch: number;
  lastOptimization: number;
  totalResearches: number;
  totalOptimizations: number;
  patternsLearned: number;
  recommendationsGenerated: number;
  autoOptimizationsApplied: number;
  uptimeSeconds: number;
}

export interface ResearchResult {
  topic: string;
  findings: string[];
  recommendations: string[];
  sources: string[];
  timestamp: number;
  relevanceScore: number;  // 0-1
}

export interface LearnedPattern {
  type: 'success' | 'failure' | 'optimization';
  context: string;  // What was the scenario
  pattern: string;  // What pattern emerged
  executions: number;  // How many times observed
  successRate: number;  // 0-1
  recommendation: string;
  timestamp: number;
  appliedToRAG: boolean;
}

export interface OptimizationRecommendation {
  category: 'performance' | 'reliability' | 'context_efficiency' | 'user_experience';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  autoApplicable: boolean;
  implementation?: string;  // Code or config change
  timestamp: number;
}

export interface EvolutionReport {
  period: string;  // "daily", "weekly", "monthly"
  researches: ResearchResult[];
  patternsLearned: LearnedPattern[];
  optimizations: OptimizationRecommendation[];
  metrics: {
    frameworkImprovementScore: number;  // 0-100
    learningVelocity: number;  // Patterns learned per day
    optimizationImpact: number;  // Estimated % improvement
  };
  timestamp: number;
}

export class EvolutionBackgroundTask extends EventEmitter {
  private config: EvolutionConfig;
  private status: EvolutionStatus;
  private startTime: number = 0;
  private researchTimer: NodeJS.Timeout | null = null;
  private optimizationTimer: NodeJS.Timeout | null = null;
  private learningQueue: Map<string, number> = new Map();  // Pattern -> execution count
  private learnedPatterns: LearnedPattern[] = [];
  private optimizationRecommendations: OptimizationRecommendation[] = [];
  private researchHistory: ResearchResult[] = [];

  // NEW v6.1: Task plan learning
  private taskPlanManager?: any;
  private planExecutionPatterns: Map<string, { successes: number; failures: number; avgDuration: number }> = new Map();

  constructor(config?: Partial<EvolutionConfig>) {
    super();

    // Default configuration
    this.config = {
      dailyResearch: {
        enabled: config?.dailyResearch?.enabled ?? true,
        scheduleTime: config?.dailyResearch?.scheduleTime || '03:00',
        researchTopics: config?.dailyResearch?.researchTopics || [
          'AI-assisted development best practices',
          'Context-aware coding frameworks',
          'Multi-agent orchestration patterns',
          'RAG optimization techniques',
          'Prompt engineering advancements',
          'SDLC automation trends'
        ],
        maxResearchDuration: config?.dailyResearch?.maxResearchDuration || 1800000 // 30 minutes
      },
      patternLearning: {
        enabled: config?.patternLearning?.enabled ?? true,
        minExecutionsForPattern: config?.patternLearning?.minExecutionsForPattern || 5,
        successRateThreshold: config?.patternLearning?.successRateThreshold || 0.80,
        autoEnrichment: config?.patternLearning?.autoEnrichment ?? true,
        taskPlanLearning: config?.patternLearning?.taskPlanLearning ?? true  // NEW v6.1
      },
      optimization: {
        enabled: config?.optimization?.enabled ?? true,
        analyzeInterval: config?.optimization?.analyzeInterval || 3600000, // 1 hour
        autoApplyRecommendations: config?.optimization?.autoApplyRecommendations ?? false
      },
      integrations: {
        userNotifications: config?.integrations?.userNotifications ?? true,
        ragStorage: config?.integrations?.ragStorage ?? true,
        reportGeneration: config?.integrations?.reportGeneration ?? true,
        taskPlanManager: config?.integrations?.taskPlanManager  // NEW v6.1
      }
    };

    // Initialize status
    this.status = {
      running: false,
      lastResearch: 0,
      lastOptimization: 0,
      totalResearches: 0,
      totalOptimizations: 0,
      patternsLearned: 0,
      recommendationsGenerated: 0,
      autoOptimizationsApplied: 0,
      uptimeSeconds: 0
    };

    // NEW v6.1: Store TaskPlanManager reference and setup listeners
    if (this.config.integrations.taskPlanManager) {
      this.taskPlanManager = this.config.integrations.taskPlanManager;
      this.setupTaskPlanListeners();
    }
  }

  /**
   * Start the evolution background task
   */
  async start(): Promise<void> {
    if (this.status.running) {
      console.log('[EvolutionBackgroundTask] Already running');
      return;
    }

    console.log('[EvolutionBackgroundTask] Starting evolution engine...');

    this.startTime = Date.now();
    this.status.running = true;

    // Schedule daily research
    if (this.config.dailyResearch.enabled) {
      this.scheduleDailyResearch();
    }

    // Schedule optimization analysis
    if (this.config.optimization.enabled) {
      this.scheduleOptimizationAnalysis();
    }

    // Emit start event
    this.emit('task-started', {
      dailyResearchEnabled: this.config.dailyResearch.enabled,
      patternLearningEnabled: this.config.patternLearning.enabled,
      optimizationEnabled: this.config.optimization.enabled,
      timestamp: Date.now()
    });

    console.log('[EvolutionBackgroundTask] Evolution engine started');
  }

  /**
   * Stop the evolution background task
   */
  async stop(): Promise<void> {
    if (!this.status.running) {
      console.log('[EvolutionBackgroundTask] Not running');
      return;
    }

    console.log('[EvolutionBackgroundTask] Stopping...');

    // Stop timers
    if (this.researchTimer) {
      clearTimeout(this.researchTimer);
      this.researchTimer = null;
    }
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }

    // Update status
    this.status.running = false;

    // Emit stop event
    this.emit('task-stopped', {
      totalResearches: this.status.totalResearches,
      patternsLearned: this.status.patternsLearned,
      recommendationsGenerated: this.status.recommendationsGenerated,
      uptimeSeconds: this.status.uptimeSeconds,
      timestamp: Date.now()
    });
  }

  /**
   * Schedule daily research at configured time
   */
  private scheduleDailyResearch(): void {
    const [hours, minutes] = this.config.dailyResearch.scheduleTime.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If scheduled time already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const msUntilResearch = scheduledTime.getTime() - now.getTime();

    console.log(`[EvolutionBackgroundTask] Daily research scheduled for ${scheduledTime.toLocaleString()}`);

    this.researchTimer = setTimeout(async () => {
      await this.performDailyResearch();
      // Reschedule for next day
      this.scheduleDailyResearch();
    }, msUntilResearch);
  }

  /**
   * Schedule optimization analysis
   */
  private scheduleOptimizationAnalysis(): void {
    console.log(`[EvolutionBackgroundTask] Optimization analysis every ${this.config.optimization.analyzeInterval / 1000 / 60} minutes`);

    this.optimizationTimer = setInterval(async () => {
      await this.performOptimizationAnalysis();
    }, this.config.optimization.analyzeInterval);

    // Run first analysis immediately
    this.performOptimizationAnalysis().catch(console.error);
  }

  /**
   * Perform daily research on AI/development best practices
   */
  private async performDailyResearch(): Promise<void> {
    console.log('[EvolutionBackgroundTask] Starting daily research...');

    const researchResults: ResearchResult[] = [];

    try {
      // Research each configured topic
      for (const topic of this.config.dailyResearch.researchTopics) {
        console.log(`[EvolutionBackgroundTask] Researching: ${topic}`);

        // In real implementation, would use WebFetch or search APIs
        // For now, simulate research results
        const result = await this.simulateResearch(topic);
        researchResults.push(result);

        // Store in RAG if enabled
        if (this.config.integrations.ragStorage && result.relevanceScore >= 0.70) {
          await this.storeResearchInRAG(result);
        }

        // Emit progress
        this.emit('research-progress', {
          topic,
          completed: researchResults.length,
          total: this.config.dailyResearch.researchTopics.length
        });
      }

      // Update status
      this.status.lastResearch = Date.now();
      this.status.totalResearches++;
      this.researchHistory.push(...researchResults);

      // Generate and apply recommendations
      const recommendations = this.extractRecommendations(researchResults);
      this.optimizationRecommendations.push(...recommendations);
      this.status.recommendationsGenerated += recommendations.length;

      // Notify user
      if (this.config.integrations.userNotifications) {
        this.emit('user-notification', {
          level: 'info',
          title: '🔬 Daily Research Complete',
          message: `Researched ${researchResults.length} topics, generated ${recommendations.length} recommendations`,
          timestamp: Date.now()
        });
      }

      // Emit completion event
      this.emit('research-complete', {
        results: researchResults,
        recommendations,
        timestamp: Date.now()
      });

      console.log(`[EvolutionBackgroundTask] Daily research complete: ${researchResults.length} topics`);

    } catch (error) {
      console.error('[EvolutionBackgroundTask] Daily research failed:', error);
      this.emit('research-error', { error, timestamp: Date.now() });
    }
  }

  /**
   * Simulate research (in real implementation, would use WebFetch)
   */
  private async simulateResearch(topic: string): Promise<ResearchResult> {
    // Simulate research delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      topic,
      findings: [
        `Latest trends in ${topic}`,
        `Emerging best practices`,
        `Common anti-patterns to avoid`
      ],
      recommendations: [
        `Consider applying ${topic} patterns to VERSATIL`,
        `Optimize based on latest research`
      ],
      sources: ['research-paper-1', 'blog-post-2', 'documentation-3'],
      timestamp: Date.now(),
      relevanceScore: 0.75 + (Math.random() * 0.25) // 0.75-1.0
    };
  }

  /**
   * Store research results in RAG
   */
  private async storeResearchInRAG(result: ResearchResult): Promise<void> {
    const ragEntry = {
      type: 'research_finding',
      topic: result.topic,
      findings: result.findings,
      recommendations: result.recommendations,
      relevanceScore: result.relevanceScore,
      timestamp: result.timestamp
    };

    this.emit('rag-store', ragEntry);
  }

  /**
   * Extract recommendations from research results
   */
  private extractRecommendations(results: ResearchResult[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const result of results) {
      for (const rec of result.recommendations) {
        recommendations.push({
          category: 'performance',  // Would be inferred from content
          title: `Research-based: ${result.topic}`,
          description: rec,
          impact: result.relevanceScore > 0.85 ? 'high' : 'medium',
          effort: 'medium',
          autoApplicable: false,  // Research recommendations need review
          timestamp: Date.now()
        });
      }
    }

    return recommendations;
  }

  /**
   * Perform optimization analysis
   */
  private async performOptimizationAnalysis(): Promise<void> {
    console.log('[EvolutionBackgroundTask] Running optimization analysis...');

    try {
      // Update uptime
      if (this.startTime > 0) {
        this.status.uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      }

      // Analyze learned patterns
      const patternOptimizations = this.analyzePatterns();

      // Analyze flywheel performance (would integrate with FlywheelHealthMonitor)
      const flywheelOptimizations = await this.analyzeFlywheelPerformance();

      // Analyze context efficiency (would integrate with ContextSentinel)
      const contextOptimizations = await this.analyzeContextEfficiency();

      // Combine all optimizations
      const allOptimizations = [
        ...patternOptimizations,
        ...flywheelOptimizations,
        ...contextOptimizations
      ];

      // Add to recommendations
      this.optimizationRecommendations.push(...allOptimizations);
      this.status.recommendationsGenerated += allOptimizations.length;

      // Auto-apply safe recommendations if enabled
      if (this.config.optimization.autoApplyRecommendations) {
        const autoApplicable = allOptimizations.filter(opt => opt.autoApplicable);
        for (const opt of autoApplicable) {
          await this.applyOptimization(opt);
          this.status.autoOptimizationsApplied++;
        }
      }

      // Update status
      this.status.lastOptimization = Date.now();
      this.status.totalOptimizations++;

      // Emit event
      this.emit('optimization-complete', {
        recommendations: allOptimizations,
        autoApplied: this.config.optimization.autoApplyRecommendations,
        timestamp: Date.now()
      });

      console.log(`[EvolutionBackgroundTask] Optimization analysis complete: ${allOptimizations.length} recommendations`);

    } catch (error) {
      console.error('[EvolutionBackgroundTask] Optimization analysis failed:', error);
      this.emit('optimization-error', { error, timestamp: Date.now() });
    }
  }

  /**
   * Analyze learned patterns for optimizations
   */
  private analyzePatterns(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze successful patterns
    const successPatterns = this.learnedPatterns.filter(
      p => p.type === 'success' && p.successRate >= this.config.patternLearning.successRateThreshold
    );

    if (successPatterns.length > 10) {
      recommendations.push({
        category: 'reliability',
        title: 'High Success Pattern Density',
        description: `${successPatterns.length} successful patterns learned - framework is learning effectively`,
        impact: 'medium',
        effort: 'low',
        autoApplicable: false,
        timestamp: Date.now()
      });
    }

    return recommendations;
  }

  /**
   * Analyze flywheel performance for optimizations
   */
  private async analyzeFlywheelPerformance(): Promise<OptimizationRecommendation[]> {
    // Would integrate with FlywheelHealthMonitor
    // For now, return empty array
    return [];
  }

  /**
   * Analyze context efficiency for optimizations
   */
  private async analyzeContextEfficiency(): Promise<OptimizationRecommendation[]> {
    // Would integrate with ContextSentinel
    // For now, return empty array
    return [];
  }

  /**
   * Apply an optimization recommendation
   */
  private async applyOptimization(recommendation: OptimizationRecommendation): Promise<void> {
    console.log(`[EvolutionBackgroundTask] Applying optimization: ${recommendation.title}`);

    // In real implementation, would apply configuration changes or code modifications
    // For now, just emit event
    this.emit('optimization-applied', recommendation);
  }

  /**
   * Learn from agent execution (called by orchestrator)
   */
  async learnFromExecution(execution: {
    agent: string;
    task: string;
    success: boolean;
    duration: number;
    context: string;
  }): Promise<void> {
    if (!this.config.patternLearning.enabled) return;

    const patternKey = `${execution.agent}:${execution.task}`;

    // Track execution count
    const currentCount = this.learningQueue.get(patternKey) || 0;
    this.learningQueue.set(patternKey, currentCount + 1);

    // If enough executions, create learned pattern
    if (currentCount + 1 >= this.config.patternLearning.minExecutionsForPattern) {
      const pattern: LearnedPattern = {
        type: execution.success ? 'success' : 'failure',
        context: execution.context,
        pattern: `${execution.agent} successfully handles ${execution.task}`,
        executions: currentCount + 1,
        successRate: execution.success ? 1.0 : 0.0,  // Would calculate from history
        recommendation: execution.success
          ? `Reuse this pattern for similar ${execution.task} tasks`
          : `Avoid this approach for ${execution.task}`,
        timestamp: Date.now(),
        appliedToRAG: false
      };

      // Add to learned patterns
      this.learnedPatterns.push(pattern);
      this.status.patternsLearned++;

      // Auto-enrich RAG if enabled
      if (this.config.patternLearning.autoEnrichment && execution.success) {
        await this.enrichRAG(pattern);
        pattern.appliedToRAG = true;
      }

      // Emit learning event
      this.emit('pattern-learned', pattern);

      console.log(`[EvolutionBackgroundTask] Learned pattern: ${pattern.pattern}`);
    }
  }

  /**
   * Enrich RAG with learned pattern
   */
  private async enrichRAG(pattern: LearnedPattern): Promise<void> {
    const ragEntry = {
      type: 'learned_pattern',
      pattern: pattern.pattern,
      context: pattern.context,
      executions: pattern.executions,
      successRate: pattern.successRate,
      recommendation: pattern.recommendation,
      timestamp: pattern.timestamp
    };

    this.emit('rag-store', ragEntry);
  }

  /**
   * Generate evolution report
   */
  generateReport(period: 'daily' | 'weekly' | 'monthly'): EvolutionReport {
    const now = Date.now();
    const periodMs = period === 'daily' ? 86400000 : period === 'weekly' ? 604800000 : 2592000000;
    const cutoff = now - periodMs;

    return {
      period,
      researches: this.researchHistory.filter(r => r.timestamp >= cutoff),
      patternsLearned: this.learnedPatterns.filter(p => p.timestamp >= cutoff),
      optimizations: this.optimizationRecommendations.filter(o => o.timestamp >= cutoff),
      metrics: {
        frameworkImprovementScore: this.calculateImprovementScore(),
        learningVelocity: this.status.patternsLearned / (this.status.uptimeSeconds / 86400),
        optimizationImpact: this.calculateOptimizationImpact()
      },
      timestamp: now
    };
  }

  /**
   * Calculate framework improvement score (0-100)
   */
  private calculateImprovementScore(): number {
    const patternsScore = Math.min(this.status.patternsLearned / 100, 1) * 40;
    const researchScore = Math.min(this.status.totalResearches / 30, 1) * 30;
    const optimizationScore = Math.min(this.status.autoOptimizationsApplied / 50, 1) * 30;

    return Math.round(patternsScore + researchScore + optimizationScore);
  }

  /**
   * Calculate optimization impact percentage
   */
  private calculateOptimizationImpact(): number {
    // Simplified: estimate 2% improvement per 10 optimizations applied
    return Math.round((this.status.autoOptimizationsApplied / 10) * 2);
  }

  /**
   * Get current status
   */
  getStatus(): EvolutionStatus {
    return { ...this.status };
  }

  /**
   * Get learned patterns
   */
  getLearnedPatterns(limit: number = 50): LearnedPattern[] {
    return this.learnedPatterns.slice(-limit);
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(limit: number = 20): OptimizationRecommendation[] {
    return this.optimizationRecommendations.slice(-limit);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<EvolutionConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      dailyResearch: {
        ...this.config.dailyResearch,
        ...updates.dailyResearch
      },
      patternLearning: {
        ...this.config.patternLearning,
        ...updates.patternLearning
      },
      optimization: {
        ...this.config.optimization,
        ...updates.optimization
      },
      integrations: {
        ...this.config.integrations,
        ...updates.integrations
      }
    };

    console.log('[EvolutionBackgroundTask] Configuration updated');
    this.emit('config-updated', this.config);
  }

  /**
   * NEW v6.1: Setup task plan event listeners
   */
  private setupTaskPlanListeners(): void {
    if (!this.taskPlanManager) return;

    console.log('[EvolutionBackgroundTask] Setting up TaskPlanManager event listeners');

    // Listen for plan completions
    this.taskPlanManager.on('plan-completed', (plan: TaskPlan) => {
      this.learnFromPlanExecution(plan).catch(console.error);
    });

    // Listen for plan failures
    this.taskPlanManager.on('plan-failed', ({ plan, error }: { plan: TaskPlan; error: Error }) => {
      this.learnFromPlanFailure(plan, error).catch(console.error);
    });
  }

  /**
   * NEW v6.1: Learn from successful plan execution
   */
  async learnFromPlanExecution(plan: TaskPlan): Promise<void> {
    if (!this.config.patternLearning.taskPlanLearning) return;

    console.log(`[EvolutionBackgroundTask] Learning from plan execution: ${plan.id}`);

    try {
      // 1. Extract patterns from plan structure
      const structurePattern = this.extractStructurePattern(plan);

      // 2. Analyze task breakdown effectiveness
      const breakdownPattern = this.analyzeTaskBreakdown(plan);

      // 3. Track agent collaboration patterns
      const collaborationPattern = this.extractCollaborationPattern(plan);

      // 4. Calculate estimation accuracy
      const estimationAccuracy = plan.actualDuration && plan.estimatedDuration
        ? Math.abs(plan.actualDuration - plan.estimatedDuration) / plan.estimatedDuration
        : 0;

      // 5. Update pattern statistics
      const patternKey = `${plan.agent}:${plan.rootTask}`;
      const existing = this.planExecutionPatterns.get(patternKey) || {
        successes: 0,
        failures: 0,
        avgDuration: 0
      };

      existing.successes++;
      existing.avgDuration = (existing.avgDuration * (existing.successes - 1) + (plan.actualDuration || 0)) / existing.successes;
      this.planExecutionPatterns.set(patternKey, existing);

      // 6. Create learned patterns
      if (existing.successes >= this.config.patternLearning.minExecutionsForPattern) {
        const learnedPattern: LearnedPattern = {
          type: 'success',
          context: `Task plan execution for ${plan.agent}`,
          pattern: `${plan.agent} successfully completed ${plan.rootTask} with ${plan.tasks.length} subtasks`,
          executions: existing.successes,
          successRate: existing.successes / (existing.successes + existing.failures),
          recommendation: `Reuse ${plan.tasks.length}-task structure for similar ${plan.rootTask} tasks`,
          timestamp: Date.now(),
          appliedToRAG: false
        };

        this.learnedPatterns.push(learnedPattern);
        this.status.patternsLearned++;

        // Auto-enrich RAG
        if (this.config.patternLearning.autoEnrichment) {
          await this.enrichRAG(learnedPattern);
          learnedPattern.appliedToRAG = true;
        }

        this.emit('pattern-learned', learnedPattern);
      }

      // 7. Generate optimization recommendations
      if (estimationAccuracy > 0.30) {
        this.optimizationRecommendations.push({
          category: 'performance',
          title: `Improve estimation accuracy for ${plan.agent}`,
          description: `Estimation was ${Math.round(estimationAccuracy * 100)}% off (target: < 20%)`,
          impact: 'medium',
          effort: 'low',
          autoApplicable: false,
          timestamp: Date.now()
        });
        this.status.recommendationsGenerated++;
      }

      // 8. Emit learning event
      this.emit('plan-execution-learned', {
        plan: plan.id,
        agent: plan.agent,
        patternsExtracted: 3,
        estimationAccuracy: Math.round((1 - estimationAccuracy) * 100),
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('[EvolutionBackgroundTask] Failed to learn from plan:', error);
    }
  }

  /**
   * NEW v6.1: Learn from failed plan execution
   */
  async learnFromPlanFailure(plan: TaskPlan, error: Error): Promise<void> {
    if (!this.config.patternLearning.taskPlanLearning) return;

    console.log(`[EvolutionBackgroundTask] Learning from plan failure: ${plan.id}`);

    try {
      // Update failure statistics
      const patternKey = `${plan.agent}:${plan.rootTask}`;
      const existing = this.planExecutionPatterns.get(patternKey) || {
        successes: 0,
        failures: 0,
        avgDuration: 0
      };
      existing.failures++;
      this.planExecutionPatterns.set(patternKey, existing);

      // Create failure pattern
      const failurePattern: LearnedPattern = {
        type: 'failure',
        context: `Task plan failure for ${plan.agent}`,
        pattern: `${plan.agent} failed ${plan.rootTask} - error: ${error.message}`,
        executions: existing.failures,
        successRate: existing.successes / (existing.successes + existing.failures),
        recommendation: `Avoid this approach for ${plan.rootTask}, investigate root cause: ${error.message}`,
        timestamp: Date.now(),
        appliedToRAG: false
      };

      this.learnedPatterns.push(failurePattern);
      this.status.patternsLearned++;

      // Generate critical optimization if high failure rate
      const currentSuccessRate = existing.successes / (existing.successes + existing.failures);
      if (existing.failures >= 3 && currentSuccessRate < 0.50) {
        this.optimizationRecommendations.push({
          category: 'reliability',
          title: `Critical: High failure rate for ${plan.agent} - ${plan.rootTask}`,
          description: `${existing.failures} failures, ${Math.round(currentSuccessRate * 100)}% success rate`,
          impact: 'high',
          effort: 'medium',
          autoApplicable: false,
          timestamp: Date.now()
        });
        this.status.recommendationsGenerated++;
      }

      this.emit('plan-failure-learned', {
        plan: plan.id,
        agent: plan.agent,
        error: error.message,
        failureCount: existing.failures,
        timestamp: Date.now()
      });

    } catch (err) {
      console.error('[EvolutionBackgroundTask] Failed to learn from plan failure:', err);
    }
  }

  /**
   * NEW v6.1: Extract structure pattern from plan
   */
  private extractStructurePattern(plan: TaskPlan): string {
    const taskLevels = this.countTaskLevels(plan.tasks);
    const avgSubtasksPerTask = plan.tasks.length > 0
      ? plan.tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0) / plan.tasks.length
      : 0;

    return `${taskLevels}-level hierarchy with avg ${avgSubtasksPerTask.toFixed(1)} subtasks per task`;
  }

  /**
   * NEW v6.1: Count task hierarchy levels
   */
  private countTaskLevels(tasks: Task[]): number {
    let maxLevel = 1;

    const traverse = (task: Task, level: number) => {
      if (level > maxLevel) maxLevel = level;
      if (task.subtasks) {
        task.subtasks.forEach(subtask => traverse(subtask, level + 1));
      }
    };

    tasks.forEach(task => traverse(task, 1));
    return maxLevel;
  }

  /**
   * NEW v6.1: Analyze task breakdown effectiveness
   */
  private analyzeTaskBreakdown(plan: TaskPlan): string {
    const completedCount = plan.tasks.filter(t => t.status === 'completed').length;
    const failedCount = plan.tasks.filter(t => t.status === 'failed').length;
    const completionRate = plan.tasks.length > 0 ? completedCount / plan.tasks.length : 0;

    return `${Math.round(completionRate * 100)}% completion rate (${completedCount}/${plan.tasks.length} tasks)`;
  }

  /**
   * NEW v6.1: Extract collaboration pattern
   */
  private extractCollaborationPattern(plan: TaskPlan): string {
    const agentCount = plan.involvedAgents.length;
    const subagentCount = plan.subagentCount;

    if (agentCount === 1) {
      return `Single agent (${plan.agent})`;
    } else {
      return `Multi-agent (${agentCount} agents, ${subagentCount} subagents)`;
    }
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await this.stop();

    // NEW v6.1: Remove task plan listeners
    if (this.taskPlanManager) {
      this.taskPlanManager.removeAllListeners('plan-completed');
      this.taskPlanManager.removeAllListeners('plan-failed');
    }

    this.removeAllListeners();
  }
}
