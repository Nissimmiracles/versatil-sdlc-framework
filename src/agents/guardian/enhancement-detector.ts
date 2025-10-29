/**
 * VERSATIL SDLC Framework - Enhancement Detector
 *
 * Analyzes root cause patterns to suggest framework/project enhancements
 * that prevent recurring issues and improve auto-remediation capabilities.
 *
 * Key Features:
 * - Enhancement opportunity detection from learned patterns
 * - Priority scoring (critical fix vs enhancement)
 * - Effort estimation from historical data
 * - ROI calculation (time saved per week)
 * - Agent assignment for implementation
 *
 * @version 7.12.0
 */

import { GuardianLogger } from './guardian-logger.js';
import type { RootCausePattern } from './root-cause-learner.js';
import { searchGuardianLearnings } from './guardian-learning-store.js';

export interface EnhancementSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'auto-remediation' | 'monitoring' | 'performance' | 'reliability' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  root_cause_pattern_id: string;
  issue_description: string;
  issue_occurrences: number;
  issue_timespan_hours: number;

  // Implementation details
  implementation_steps: string[];
  estimated_effort_hours: number;
  assigned_agent: string;

  // ROI metrics
  roi: {
    hours_saved_per_week: number;
    manual_interventions_eliminated: number;
    reliability_improvement_percent: number;
    roi_ratio: number; // ROI ratio (hours saved / hours effort)
  };

  // Supporting evidence
  evidence: {
    occurrences: number;
    success_rate_if_implemented: number;
    similar_historical_fixes: string[];
    verification_confidence: number;
  };

  // Auto-application (legacy)
  auto_applicable: boolean;
  requires_manual_review: boolean;

  // Approval workflow (v7.12.0+)
  approval_tier: 1 | 2 | 3;
  approval_required: boolean;
  approval_required_reason: string;

  created_at: string;
}

export interface EnhancementDetectionResult {
  total_patterns_analyzed: number;
  enhancements_suggested: EnhancementSuggestion[];
  high_priority_count: number;
  total_roi_hours_per_week: number;
  avg_confidence: number;
}

export interface EnhancementDetectionConfig {
  min_confidence_for_suggestion: number; // Default: 80
  min_occurrences_for_enhancement: number; // Default: 3
  enable_rag_lookup: boolean; // Default: true
}

/**
 * Enhancement Detector
 */
export class EnhancementDetector {
  private logger: GuardianLogger;
  private config: EnhancementDetectionConfig;

  constructor(config?: Partial<EnhancementDetectionConfig>) {
    this.logger = GuardianLogger.getInstance();
    this.config = {
      min_confidence_for_suggestion: parseInt(process.env.GUARDIAN_MIN_CONFIDENCE_FOR_ENHANCEMENT || '80', 10),
      min_occurrences_for_enhancement: 3,
      enable_rag_lookup: true,
      ...config
    };
  }

  /**
   * Analyze root cause patterns and generate enhancement suggestions
   */
  public async detectEnhancements(
    patterns: RootCausePattern[]
  ): Promise<EnhancementDetectionResult> {
    const startTime = Date.now();

    this.logger.info(`🔍 [Enhancement Detector] Analyzing ${patterns.length} root cause patterns`);

    // Filter patterns that are enhancement candidates
    const enhancementCandidates = patterns.filter(p =>
      p.enhancement_candidate &&
      p.root_cause.confidence >= this.config.min_confidence_for_suggestion &&
      p.occurrences >= this.config.min_occurrences_for_enhancement
    );

    this.logger.info(`📊 [Enhancement Detector] Found ${enhancementCandidates.length} enhancement candidates`);

    // Generate enhancement suggestions
    const suggestions: EnhancementSuggestion[] = [];

    for (const pattern of enhancementCandidates) {
      const suggestion = await this.generateEnhancementSuggestion(pattern);
      suggestions.push(suggestion);
    }

    // Calculate statistics
    const highPriorityCount = suggestions.filter(s => s.priority === 'critical' || s.priority === 'high').length;
    const totalRoiHoursPerWeek = suggestions.reduce((sum, s) => sum + s.roi.hours_saved_per_week, 0);
    const avgConfidence = suggestions.length > 0
      ? Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length)
      : 0;

    const duration = Date.now() - startTime;

    this.logger.info(`✅ [Enhancement Detector] Detection complete`, {
      enhancements_suggested: suggestions.length,
      high_priority: highPriorityCount,
      total_roi_hours_per_week: totalRoiHoursPerWeek,
      avg_confidence: avgConfidence,
      duration_ms: duration
    });

    return {
      total_patterns_analyzed: patterns.length,
      enhancements_suggested: suggestions,
      high_priority_count: highPriorityCount,
      total_roi_hours_per_week: totalRoiHoursPerWeek,
      avg_confidence: avgConfidence
    };
  }

  /**
   * Generate enhancement suggestion from root cause pattern
   */
  private async generateEnhancementSuggestion(
    pattern: RootCausePattern
  ): Promise<EnhancementSuggestion> {
    this.logger.info(`💡 [Enhancement Detector] Generating suggestion for pattern`, {
      fingerprint: pattern.issue_fingerprint.slice(0, 50),
      occurrences: pattern.occurrences,
      confidence: pattern.root_cause.confidence
    });

    // Step 1: Determine enhancement category
    const category = this.determineCategory(pattern);

    // Step 2: Generate title and description
    const { title, description } = this.generateTitleAndDescription(pattern, category);

    // Step 3: Generate implementation steps
    const implementationSteps = this.generateImplementationSteps(pattern, category);

    // Step 4: Estimate effort
    const estimatedEffortHours = await this.estimateEffort(pattern, implementationSteps);

    // Step 5: Assign agent
    const assignedAgent = this.assignAgent(pattern, category);

    // Step 6: Calculate ROI
    const roi = this.calculateROI(pattern, estimatedEffortHours);

    // Step 7: Gather supporting evidence
    const evidence = await this.gatherEvidence(pattern);

    // Step 8: Determine auto-applicability (legacy)
    const { autoApplicable, requiresManualReview } = this.determineAutoApplicability(
      pattern,
      evidence.verification_confidence
    );

    // Step 9: Determine approval tier (v7.12.0+)
    const { approvalTier, approvalRequired, approvalRequiredReason } = this.determineApprovalTier(
      pattern,
      evidence.verification_confidence,
      evidence.success_rate_if_implemented,
      roi,
      estimatedEffortHours
    );

    const suggestion: EnhancementSuggestion = {
      id: `enhancement-${category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      description,
      category,
      priority: pattern.enhancement_priority,
      confidence: pattern.root_cause.confidence,
      root_cause_pattern_id: pattern.id,
      issue_description: pattern.issue_description,
      issue_occurrences: pattern.occurrences,
      issue_timespan_hours: pattern.timespan_hours,
      implementation_steps: implementationSteps,
      estimated_effort_hours: estimatedEffortHours,
      assigned_agent: assignedAgent,
      roi,
      evidence,
      auto_applicable: autoApplicable,
      requires_manual_review: requiresManualReview,
      approval_tier: approvalTier,
      approval_required: approvalRequired,
      approval_required_reason: approvalRequiredReason,
      created_at: new Date().toISOString()
    };

    return suggestion;
  }

  /**
   * Determine enhancement category
   */
  private determineCategory(
    pattern: RootCausePattern
  ): 'auto-remediation' | 'monitoring' | 'performance' | 'reliability' | 'security' {
    const descLower = pattern.issue_description.toLowerCase();

    // Auto-remediation if manual fix exists and high success rate
    if (pattern.remediation.manual_fix && pattern.remediation.success_rate >= 80) {
      return 'auto-remediation';
    }

    // Security for vulnerabilities
    if (descLower.includes('vulnerability') || descLower.includes('security')) {
      return 'security';
    }

    // Performance for timeouts, latency, memory
    if (descLower.includes('timeout') || descLower.includes('latency') || descLower.includes('memory') || descLower.includes('slow')) {
      return 'performance';
    }

    // Monitoring if issue could be prevented with better alerts
    if (descLower.includes('exhaustion') || descLower.includes('threshold')) {
      return 'monitoring';
    }

    // Default to reliability
    return 'reliability';
  }

  /**
   * Generate enhancement title and description
   */
  private generateTitleAndDescription(
    pattern: RootCausePattern,
    category: string
  ): { title: string; description: string } {
    const descLower = pattern.issue_description.toLowerCase();

    // Auto-remediation enhancements
    if (category === 'auto-remediation') {
      if (descLower.includes('graphrag') || descLower.includes('neo4j')) {
        return {
          title: 'Auto-restart Neo4j on memory threshold',
          description: `Automatically restart Neo4j when memory usage exceeds 90% to prevent GraphRAG timeouts. Current issue occurs ${pattern.occurrences} times per ${pattern.timespan_hours}h causing manual intervention.`
        };
      }

      if (descLower.includes('build')) {
        return {
          title: 'Auto-rebuild on build failure detection',
          description: `Automatically trigger npm run build when build failures detected. Current issue requires manual rebuild ${pattern.occurrences} times per ${pattern.timespan_hours}h.`
        };
      }

      if (descLower.includes('dependencies')) {
        return {
          title: 'Auto-update dependencies on outdated detection',
          description: `Automatically run npm update when outdated dependencies detected. Currently requires manual intervention ${pattern.occurrences} times per ${pattern.timespan_hours}h.`
        };
      }
    }

    // Monitoring enhancements
    if (category === 'monitoring') {
      if (descLower.includes('memory')) {
        return {
          title: 'Add memory threshold monitoring and alerts',
          description: `Monitor memory usage and alert at 85% threshold before critical failure. Prevents ${pattern.occurrences} failures per ${pattern.timespan_hours}h.`
        };
      }

      if (descLower.includes('timeout')) {
        return {
          title: 'Add latency monitoring and degradation alerts',
          description: `Monitor query latency and alert on degradation trends before timeout. Prevents ${pattern.occurrences} timeouts per ${pattern.timespan_hours}h.`
        };
      }
    }

    // Performance enhancements
    if (category === 'performance') {
      if (descLower.includes('graphrag') || descLower.includes('query')) {
        return {
          title: 'Optimize query performance and add caching',
          description: `Improve query performance with caching and query optimization. Reduces ${pattern.occurrences} slow queries per ${pattern.timespan_hours}h.`
        };
      }

      if (descLower.includes('build')) {
        return {
          title: 'Optimize build process with incremental compilation',
          description: `Improve build performance with incremental TypeScript compilation. Reduces ${pattern.occurrences} slow builds per ${pattern.timespan_hours}h.`
        };
      }
    }

    // Security enhancements
    if (category === 'security') {
      return {
        title: 'Auto-fix security vulnerabilities',
        description: `Automatically run npm audit fix for known vulnerabilities. Prevents ${pattern.occurrences} security issues per ${pattern.timespan_hours}h.`
      };
    }

    // Generic fallback
    return {
      title: `Improve ${pattern.component} reliability`,
      description: `Address recurring ${pattern.component} issues. Current issue occurs ${pattern.occurrences} times per ${pattern.timespan_hours}h requiring manual intervention.`
    };
  }

  /**
   * Generate implementation steps
   */
  private generateImplementationSteps(
    pattern: RootCausePattern,
    category: string
  ): string[] {
    const descLower = pattern.issue_description.toLowerCase();
    const steps: string[] = [];

    // Auto-remediation steps
    if (category === 'auto-remediation') {
      if (descLower.includes('graphrag') || descLower.includes('neo4j')) {
        steps.push('Add memory monitoring to RAG health check (rag-health-monitor.ts)');
        steps.push('Implement auto-restart logic at 90% memory threshold');
        steps.push('Add cooldown period (5 minutes) to prevent restart loops');
        steps.push('Log remediation action to telemetry with success tracking');
        steps.push('Add unit tests for auto-restart logic');
      } else if (descLower.includes('build')) {
        steps.push('Add build failure detection to guardian health check');
        steps.push('Implement auto-rebuild with npm run build on failure');
        steps.push('Add retry logic (max 3 attempts)');
        steps.push('Log rebuild attempts and success rate');
      } else {
        steps.push('Identify auto-remediation trigger condition');
        steps.push('Implement automatic fix command execution');
        steps.push('Add verification step after auto-fix');
        steps.push('Log remediation actions to telemetry');
      }
    }

    // Monitoring steps
    if (category === 'monitoring') {
      steps.push('Add metric collection for threshold monitoring');
      steps.push('Implement alert thresholds (warning at 85%, critical at 95%)');
      steps.push('Add alert notification system');
      steps.push('Create monitoring dashboard integration');
    }

    // Performance steps
    if (category === 'performance') {
      steps.push('Profile current performance bottlenecks');
      steps.push('Implement performance optimization (caching, indexes, etc.)');
      steps.push('Add performance metrics tracking');
      steps.push('Verify improvement with benchmarks');
    }

    // Security steps
    if (category === 'security') {
      steps.push('Run npm audit to identify vulnerabilities');
      steps.push('Implement automated npm audit fix on schedule');
      steps.push('Add breaking change detection and rollback');
      steps.push('Notify on manual review requirements');
    }

    // Common final steps
    steps.push('Update Guardian telemetry to track fix success rate');
    steps.push('Store learned pattern in RAG for future reference');

    return steps;
  }

  /**
   * Estimate effort in hours
   */
  private async estimateEffort(
    pattern: RootCausePattern,
    implementationSteps: string[]
  ): Promise<number> {
    // Base effort: 1 hour per implementation step
    let estimatedHours = implementationSteps.length * 1.0;

    // Query RAG for similar historical fixes
    if (this.config.enable_rag_lookup) {
      try {
        const similarFixes = await searchGuardianLearnings(pattern.issue_description, 3);

        if (similarFixes.length > 0) {
          // Use average duration from similar fixes
          const avgDuration = similarFixes.reduce((sum, fix) => sum + fix.avg_duration_ms, 0) / similarFixes.length;
          const historicalHours = avgDuration / (1000 * 60 * 60);

          // Weight: 70% historical, 30% step-based estimate
          estimatedHours = (historicalHours * 0.7) + (estimatedHours * 0.3);
        }
      } catch (error) {
        this.logger.error('Failed to query historical fixes for effort estimation', { error });
      }
    }

    // Complexity adjustments
    if (pattern.severity === 'critical') {
      estimatedHours *= 1.2; // 20% buffer for critical issues
    }

    if (pattern.root_cause.secondary.length > 2) {
      estimatedHours *= 1.15; // 15% buffer for complex root causes
    }

    // Round to nearest 0.5 hours
    return Math.round(estimatedHours * 2) / 2;
  }

  /**
   * Assign agent for implementation
   */
  private assignAgent(pattern: RootCausePattern, category: string): string {
    // Layer-based assignment
    if (pattern.layer === 'framework') {
      if (pattern.component === 'rag' || pattern.component === 'graphrag') {
        return 'Dr.AI-ML';
      }
      if (pattern.component === 'build' || pattern.component === 'tests') {
        return 'Maria-QA';
      }
      if (pattern.component === 'agents' || pattern.component === 'guardian') {
        return 'Sarah-PM';
      }
    }

    if (pattern.layer === 'project') {
      if (category === 'security') {
        return 'Marcus-Backend';
      }
      if (category === 'performance') {
        return 'Marcus-Backend';
      }
      if (pattern.component.includes('frontend') || pattern.component.includes('ui')) {
        return 'James-Frontend';
      }
      if (pattern.component.includes('database') || pattern.component.includes('migration')) {
        return 'Dana-Database';
      }
    }

    // Default assignments by category
    const categoryAgentMap: Record<string, string> = {
      'auto-remediation': 'Marcus-Backend',
      'monitoring': 'Marcus-Backend',
      'performance': 'Marcus-Backend',
      'reliability': 'Marcus-Backend',
      'security': 'Marcus-Backend'
    };

    return categoryAgentMap[category] || 'Marcus-Backend';
  }

  /**
   * Calculate ROI (return on investment)
   */
  private calculateROI(
    pattern: RootCausePattern,
    estimatedEffortHours: number
  ): { hours_saved_per_week: number; manual_interventions_eliminated: number; reliability_improvement_percent: number } {
    // Calculate occurrences per week
    const occurrencesPerWeek = (pattern.occurrences / pattern.timespan_hours) * (24 * 7);

    // Assume each manual intervention takes 15 minutes (0.25 hours)
    const avgManualFixTimeHours = pattern.remediation.avg_duration_ms > 0
      ? pattern.remediation.avg_duration_ms / (1000 * 60 * 60)
      : 0.25;

    // Hours saved per week
    const hoursSavedPerWeek = Math.round(occurrencesPerWeek * avgManualFixTimeHours * 10) / 10;

    // Manual interventions eliminated
    const manualInterventionsEliminated = Math.round(occurrencesPerWeek);

    // Reliability improvement (based on success rate)
    const currentReliability = 100 - (pattern.occurrences / pattern.timespan_hours * 100);
    const targetReliability = 99.9; // Target: 99.9% uptime
    const reliabilityImprovementPercent = Math.round((targetReliability - currentReliability) * 10) / 10;

    // ROI ratio calculation (hours saved / hours effort)
    const weeklyROI = hoursSavedPerWeek / Math.max(estimatedEffortHours / 52, 0.01);
    const roiRatio = Math.round(weeklyROI * 10) / 10;

    return {
      hours_saved_per_week: hoursSavedPerWeek,
      manual_interventions_eliminated: manualInterventionsEliminated,
      reliability_improvement_percent: Math.max(0, reliabilityImprovementPercent),
      roi_ratio: roiRatio
    };
  }

  /**
   * Gather supporting evidence
   */
  private async gatherEvidence(
    pattern: RootCausePattern
  ): Promise<{
    occurrences: number;
    success_rate_if_implemented: number;
    similar_historical_fixes: string[];
    verification_confidence: number;
  }> {
    const evidence = {
      occurrences: pattern.occurrences,
      success_rate_if_implemented: 95, // Default expected success rate
      similar_historical_fixes: [] as string[],
      verification_confidence: pattern.root_cause.confidence
    };

    // Query RAG for similar historical fixes
    if (this.config.enable_rag_lookup) {
      try {
        const similarFixes = await searchGuardianLearnings(pattern.issue_description, 5);

        evidence.similar_historical_fixes = similarFixes.map(fix =>
          `${fix.pattern.slice(0, 80)} (${fix.success_rate}% success, ${fix.times_used} times used)`
        );

        // Calculate expected success rate from historical data
        if (similarFixes.length > 0) {
          const avgSuccessRate = similarFixes.reduce((sum, fix) => sum + fix.success_rate, 0) / similarFixes.length;
          evidence.success_rate_if_implemented = Math.round(avgSuccessRate);
        }
      } catch (error) {
        this.logger.error('Failed to gather historical evidence', { error });
      }
    }

    return evidence;
  }

  /**
   * Determine auto-applicability
   */
  private determineAutoApplicability(
    pattern: RootCausePattern,
    verificationConfidence: number
  ): { autoApplicable: boolean; requiresManualReview: boolean } {
    // Auto-applicable if:
    // 1. Confidence ≥ 90%
    // 2. Manual fix exists (proven solution)
    // 3. Success rate ≥ 90%
    const autoApplicable =
      verificationConfidence >= 90 &&
      pattern.remediation.manual_fix !== undefined &&
      pattern.remediation.success_rate >= 90;

    // Requires manual review if:
    // 1. Critical severity
    // 2. Confidence < 90%
    // 3. Complex root cause (3+ secondary causes)
    const requiresManualReview =
      pattern.severity === 'critical' ||
      verificationConfidence < 90 ||
      pattern.root_cause.secondary.length >= 3;

    return { autoApplicable, requiresManualReview };
  }

  /**
   * Determine approval tier for human-in-the-loop workflow (v7.12.0+)
   *
   * TIER 1: Auto-Apply (≥95% confidence)
   * - Simple fixes (npm install, npm audit fix)
   * - Proven success rate >95%
   * - Zero risk changes
   * → Execute immediately, notify user
   *
   * TIER 2: Prompt for Approval (80-95% confidence)
   * - Medium confidence
   * - Non-critical changes
   * - ROI >5:1 (5h saved for 1h effort)
   * → Interactive prompt: "Approve? (y/n/defer)"
   *
   * TIER 3: Manual Review Required (<80% confidence)
   * - Critical priority
   * - Complex root causes (3+ secondary)
   * - Unknown success rate
   * → Create TODO only, require explicit /work
   */
  private determineApprovalTier(
    pattern: RootCausePattern,
    verificationConfidence: number,
    successRate: number,
    roi: { hours_saved_per_week: number; roi_ratio: number },
    estimatedEffortHours: number
  ): { approvalTier: 1 | 2 | 3; approvalRequired: boolean; approvalRequiredReason: string } {
    // Get thresholds from environment (with defaults)
    const tier1Threshold = parseInt(process.env.GUARDIAN_TIER1_CONFIDENCE_THRESHOLD || '95', 10);
    const tier2Threshold = parseInt(process.env.GUARDIAN_TIER2_CONFIDENCE_THRESHOLD || '80', 10);

    // TIER 1: Auto-Apply (highest confidence)
    if (
      verificationConfidence >= tier1Threshold &&
      successRate >= 95 &&
      pattern.severity !== 'critical' &&
      pattern.root_cause.secondary.length <= 1 &&
      estimatedEffortHours <= 1
    ) {
      return {
        approvalTier: 1,
        approvalRequired: false,
        approvalRequiredReason: 'High confidence (≥95%), proven success rate (≥95%), simple change (≤1h), non-critical - safe for auto-apply'
      };
    }

    // TIER 3: Manual Review Required (low confidence or high risk)
    if (
      verificationConfidence < tier2Threshold ||
      pattern.severity === 'critical' ||
      pattern.root_cause.secondary.length >= 3 ||
      successRate < 70 ||
      estimatedEffortHours > 8
    ) {
      const reasons: string[] = [];

      if (verificationConfidence < tier2Threshold) {
        reasons.push(`Low confidence (${verificationConfidence}% < ${tier2Threshold}%)`);
      }
      if (pattern.severity === 'critical') {
        reasons.push('Critical priority requires explicit approval');
      }
      if (pattern.root_cause.secondary.length >= 3) {
        reasons.push(`Complex root cause (${pattern.root_cause.secondary.length} secondary causes)`);
      }
      if (successRate < 70) {
        reasons.push(`Low success rate (${successRate}% < 70%)`);
      }
      if (estimatedEffortHours > 8) {
        reasons.push(`High effort (${estimatedEffortHours}h > 8h)`);
      }

      return {
        approvalTier: 3,
        approvalRequired: true,
        approvalRequiredReason: reasons.join(', ')
      };
    }

    // TIER 2: Prompt for Approval (medium confidence)
    const reasons: string[] = [`Medium confidence (${verificationConfidence}%)`];

    if (roi.roi_ratio >= 5) {
      reasons.push(`High ROI (${roi.roi_ratio}:1 ratio)`);
    } else {
      reasons.push(`Moderate ROI (${roi.roi_ratio}:1 ratio, ${roi.hours_saved_per_week}h/week saved)`);
    }

    if (pattern.severity === 'high') {
      reasons.push('High priority');
    }

    return {
      approvalTier: 2,
      approvalRequired: true,
      approvalRequiredReason: reasons.join(', ')
    };
  }
}
