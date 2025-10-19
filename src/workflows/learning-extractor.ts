/**
 * VERSATIL Learning Extractor
 *
 * Extracts actionable learnings from session analysis for RAG storage.
 * Converts session data into structured knowledge that makes future work faster.
 *
 * Responsibilities:
 * - Extract "what worked" patterns
 * - Extract "watch out for" warnings
 * - Identify reusable code patterns
 * - Generate lessons learned
 * - Calculate pattern effectiveness scores
 *
 * Integration: Used by LearningCodifier before RAG storage
 */

import { SessionAnalysis, CodeChange, AgentPerformance } from './session-analyzer.js';
import { VERSATILLogger } from '../utils/logger.js';

export interface CodePattern {
  category: 'test' | 'component' | 'api' | 'database' | 'configuration' | 'optimization';
  language: string;
  framework?: string;
  pattern: string;
  description: string;
  codeSnippet: string;
  effectiveness: number; // 0-100
  tags: string[];
  usageContext: string;
  recommendations: string;
}

export interface WatchOutWarning {
  category: 'performance' | 'quality' | 'security' | 'efficiency' | 'estimation';
  severity: 'low' | 'medium' | 'high';
  issue: string;
  impact: string;
  resolution: string;
  agentRelated?: string;
}

export interface LessonLearned {
  title: string;
  context: string;
  insight: string;
  application: string;
  evidence: string;
  relatedPatterns: string[];
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  benchmark: number;
  status: 'excellent' | 'good' | 'needs-improvement';
  improvement: string;
}

export interface ExtractedLearnings {
  sessionId: string;
  timestamp: Date;
  codePatterns: CodePattern[];
  warnings: WatchOutWarning[];
  lessons: LessonLearned[];
  performanceMetrics: PerformanceMetric[];
  agentInsights: Array<{
    agentId: string;
    effectiveness: 'high' | 'medium' | 'low';
    bestPractices: string[];
    improvementAreas: string[];
  }>;
  overallEffectiveness: number; // 0-100
  compoundingScore: number; // How much will this help future sessions (0-100)
}

export class LearningExtractor {
  private logger: VERSATILLogger;

  constructor() {
    this.logger = new VERSATILLogger();
  }

  /**
   * Main entry point: Extract learnings from session analysis
   */
  async extractLearnings(analysis: SessionAnalysis): Promise<ExtractedLearnings> {
    this.logger.info('Extracting learnings from session', {
      sessionId: analysis.sessionId
    }, 'learning-extractor');

    try {
      const [
        codePatterns,
        warnings,
        lessons,
        performanceMetrics,
        agentInsights
      ] = await Promise.all([
        this.extractCodePatterns(analysis.codeChanges),
        this.extractWarnings(analysis),
        this.extractLessons(analysis),
        this.extractPerformanceMetrics(analysis),
        this.extractAgentInsights(analysis.agentPerformance)
      ]);

      const overallEffectiveness = this.calculateOverallEffectiveness(analysis);
      const compoundingScore = this.calculateCompoundingScore(codePatterns, lessons, performanceMetrics);

      const learnings: ExtractedLearnings = {
        sessionId: analysis.sessionId,
        timestamp: new Date(),
        codePatterns,
        warnings,
        lessons,
        performanceMetrics,
        agentInsights,
        overallEffectiveness,
        compoundingScore
      };

      this.logger.info('Learning extraction complete', {
        patterns: codePatterns.length,
        warnings: warnings.length,
        lessons: lessons.length,
        compoundingScore
      }, 'learning-extractor');

      return learnings;
    } catch (error) {
      this.logger.error('Learning extraction failed', { error }, 'learning-extractor');
      throw error;
    }
  }

  /**
   * Extract code patterns from changes
   */
  private async extractCodePatterns(codeChanges: CodeChange[]): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];

    for (const change of codeChanges) {
      // Test patterns
      if (change.type === 'test' && change.content) {
        const testPattern = this.identifyTestPattern(change);
        if (testPattern) patterns.push(testPattern);
      }

      // Component patterns
      if (change.type === 'component' && change.content) {
        const componentPattern = this.identifyComponentPattern(change);
        if (componentPattern) patterns.push(componentPattern);
      }

      // API patterns
      if (change.type === 'api' && change.content) {
        const apiPattern = this.identifyAPIPattern(change);
        if (apiPattern) patterns.push(apiPattern);
      }
    }

    return patterns;
  }

  /**
   * Identify test pattern from code
   */
  private identifyTestPattern(change: CodeChange): CodePattern | null {
    const content = change.content;

    // React Testing Library pattern
    if (content.includes('@testing-library/react') || content.includes('render(')) {
      return {
        category: 'test',
        language: change.language,
        framework: 'React Testing Library',
        pattern: 'Component testing with RTL',
        description: 'Testing React components using React Testing Library patterns',
        codeSnippet: this.extractSnippet(content, 'render(', 200),
        effectiveness: 85,
        tags: ['testing', 'react', 'rtl', 'component-testing'],
        usageContext: 'Use for testing React components with user-centric queries',
        recommendations: 'Prefer user-facing queries (getByRole, getByLabelText) over implementation details'
      };
    }

    // Jest mock pattern
    if (content.includes('jest.mock') || content.includes('jest.fn()')) {
      return {
        category: 'test',
        language: change.language,
        framework: 'Jest',
        pattern: 'Mock implementation',
        description: 'Mocking external dependencies in tests',
        codeSnippet: this.extractSnippet(content, 'jest.mock', 150),
        effectiveness: 80,
        tags: ['testing', 'jest', 'mocking'],
        usageContext: 'Use for isolating units under test from external dependencies',
        recommendations: 'Keep mocks simple and close to real implementations'
      };
    }

    return null;
  }

  /**
   * Identify component pattern from code
   */
  private identifyComponentPattern(change: CodeChange): CodePattern | null {
    const content = change.content;

    // React hook pattern
    if (content.includes('useState') || content.includes('useEffect')) {
      return {
        category: 'component',
        language: change.language,
        framework: 'React',
        pattern: 'React Hooks usage',
        description: 'Modern React component with hooks for state and effects',
        codeSnippet: this.extractSnippet(content, 'use', 200),
        effectiveness: 90,
        tags: ['react', 'hooks', 'component', 'functional-component'],
        usageContext: 'Use for functional React components with state management',
        recommendations: 'Follow hooks rules: only call at top level, only in React functions'
      };
    }

    // Tailwind CSS pattern
    if (content.includes('className=') && (content.includes('flex') || content.includes('grid'))) {
      return {
        category: 'component',
        language: change.language,
        framework: 'Tailwind CSS',
        pattern: 'Utility-first styling',
        description: 'Component styling using Tailwind utility classes',
        codeSnippet: this.extractSnippet(content, 'className=', 150),
        effectiveness: 85,
        tags: ['styling', 'tailwind', 'css', 'utility-classes'],
        usageContext: 'Use for rapid UI development with consistent design system',
        recommendations: 'Extract repeated patterns into reusable components'
      };
    }

    return null;
  }

  /**
   * Identify API pattern from code
   */
  private identifyAPIPattern(change: CodeChange): CodePattern | null {
    const content = change.content;

    // Express/Fastify route pattern
    if (content.includes('app.get') || content.includes('app.post') || content.includes('router.')) {
      return {
        category: 'api',
        language: change.language,
        framework: 'Express/Fastify',
        pattern: 'REST API endpoint',
        description: 'RESTful API endpoint with route handler',
        codeSnippet: this.extractSnippet(content, 'app.', 200),
        effectiveness: 85,
        tags: ['api', 'rest', 'backend', 'route-handler'],
        usageContext: 'Use for creating HTTP endpoints with proper error handling',
        recommendations: 'Add input validation, error handling, and proper status codes'
      };
    }

    // Database query pattern
    if (content.includes('await') && (content.includes('prisma') || content.includes('supabase') || content.includes('db.'))) {
      return {
        category: 'database',
        language: change.language,
        pattern: 'Async database query',
        description: 'Asynchronous database operations with proper error handling',
        codeSnippet: this.extractSnippet(content, 'await', 200),
        effectiveness: 80,
        tags: ['database', 'async', 'query'],
        usageContext: 'Use for database operations with async/await pattern',
        recommendations: 'Always handle errors and use transactions for multiple operations'
      };
    }

    return null;
  }

  /**
   * Extract code snippet around keyword
   */
  private extractSnippet(content: string, keyword: string, maxLength: number): string {
    const index = content.indexOf(keyword);
    if (index === -1) return content.substring(0, maxLength);

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + maxLength);
    return content.substring(start, end).trim();
  }

  /**
   * Extract warnings from analysis
   */
  private async extractWarnings(analysis: SessionAnalysis): Promise<WatchOutWarning[]> {
    const warnings: WatchOutWarning[] = [];

    // Quality warnings
    if (analysis.qualityMetrics.averageQuality < 70) {
      warnings.push({
        category: 'quality',
        severity: 'high',
        issue: 'Low average quality score',
        impact: `Quality at ${analysis.qualityMetrics.averageQuality}% (target: 85%+)`,
        resolution: 'Review generated code more carefully, add more specific requirements'
      });
    }

    // Test coverage warnings
    if (analysis.qualityMetrics.testCoverage !== undefined && analysis.qualityMetrics.testCoverage < 80) {
      warnings.push({
        category: 'quality',
        severity: 'medium',
        issue: 'Low test coverage',
        impact: `Coverage at ${analysis.qualityMetrics.testCoverage}% (target: 80%+)`,
        resolution: 'Add tests for uncovered code paths, especially edge cases'
      });
    }

    // Efficiency warnings
    if (analysis.productivity.efficiency < 60) {
      warnings.push({
        category: 'efficiency',
        severity: 'medium',
        issue: 'Low task completion efficiency',
        impact: `Only ${analysis.productivity.efficiency}% of started tasks completed`,
        resolution: 'Break down tasks into smaller chunks, reduce scope creep'
      });
    }

    // Estimation warnings
    if (analysis.effortAnalysis.accuracy < 70) {
      warnings.push({
        category: 'estimation',
        severity: 'low',
        issue: 'Inaccurate effort estimates',
        impact: `Estimates off by ${Math.abs(analysis.effortAnalysis.variance)} minutes`,
        resolution: 'Use historical data for better estimates, add buffer for unknowns'
      });
    }

    // Agent-specific warnings
    for (const agent of analysis.agentPerformance) {
      if (agent.successRate < 0.7) {
        warnings.push({
          category: 'efficiency',
          severity: 'medium',
          issue: `${agent.agentId} low success rate`,
          impact: `Only ${Math.round(agent.successRate * 100)}% success rate`,
          resolution: 'Review agent configuration and task complexity',
          agentRelated: agent.agentId
        });
      }
    }

    return warnings;
  }

  /**
   * Extract lessons learned
   */
  private async extractLessons(analysis: SessionAnalysis): Promise<LessonLearned[]> {
    const lessons: LessonLearned[] = [];

    // High productivity lesson
    if (analysis.productivity.timeSaved >= 60) {
      lessons.push({
        title: 'Significant productivity gain achieved',
        context: `Session saved ${analysis.productivity.timeSaved} minutes of manual work`,
        insight: 'Effective use of VERSATIL agents dramatically reduces development time',
        application: 'Continue using agents for similar tasks, delegate more work',
        evidence: `${analysis.productivity.timeSaved} min saved across ${analysis.agentPerformance.length} agents`,
        relatedPatterns: analysis.patterns.successful
      });
    }

    // Successful pattern lesson
    if (analysis.patterns.successful.length > 3) {
      lessons.push({
        title: 'Multiple successful patterns identified',
        context: `${analysis.patterns.successful.length} patterns worked well`,
        insight: 'Project has established effective development patterns',
        application: 'Codify these patterns in RAG for 40% faster future development',
        evidence: analysis.patterns.successful.join(', '),
        relatedPatterns: analysis.patterns.successful
      });
    }

    // Agent effectiveness lesson
    const highPerformingAgents = analysis.agentPerformance.filter(a => a.effectiveness === 'high');
    if (highPerformingAgents.length > 0) {
      lessons.push({
        title: 'Optimal agent utilization',
        context: `${highPerformingAgents.length} agents performed exceptionally well`,
        insight: `Agents ${highPerformingAgents.map(a => a.agentId).join(', ')} excel at their tasks`,
        application: 'Prioritize these agents for similar work in future',
        evidence: `Average ${highPerformingAgents.reduce((sum, a) => sum + a.timeSaved, 0)} min saved`,
        relatedPatterns: []
      });
    }

    // Estimation improvement lesson
    if (analysis.effortAnalysis.accuracy >= 85) {
      lessons.push({
        title: 'Accurate effort estimation',
        context: `Estimates were ${analysis.effortAnalysis.accuracy}% accurate`,
        insight: 'Historical data and compounding learning improve estimation',
        application: 'Trust current estimation model for future planning',
        evidence: `Estimated ${analysis.effortAnalysis.estimatedMinutes} min, actual ${analysis.effortAnalysis.actualMinutes} min`,
        relatedPatterns: []
      });
    }

    return lessons;
  }

  /**
   * Extract performance metrics
   */
  private async extractPerformanceMetrics(analysis: SessionAnalysis): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    // Time saved metric
    metrics.push({
      metric: 'Time Saved',
      value: analysis.productivity.timeSaved,
      unit: 'minutes',
      benchmark: 60, // Target: 1 hour saved per session
      status: analysis.productivity.timeSaved >= 60 ? 'excellent' : analysis.productivity.timeSaved >= 30 ? 'good' : 'needs-improvement',
      improvement: analysis.productivity.timeSaved < 60 ? 'Use more agents for parallel work' : 'Maintain current workflow'
    });

    // Productivity gain metric
    metrics.push({
      metric: 'Productivity Gain',
      value: analysis.productivity.productivityGain,
      unit: 'percent',
      benchmark: 40, // Target: 40% faster (compounding engineering)
      status: analysis.productivity.productivityGain >= 40 ? 'excellent' : analysis.productivity.productivityGain >= 25 ? 'good' : 'needs-improvement',
      improvement: analysis.productivity.productivityGain < 40 ? 'Leverage more RAG patterns' : 'Excellent compounding'
    });

    // Quality score metric
    metrics.push({
      metric: 'Code Quality',
      value: analysis.qualityMetrics.averageQuality,
      unit: 'percent',
      benchmark: 85,
      status: analysis.qualityMetrics.averageQuality >= 85 ? 'excellent' : analysis.qualityMetrics.averageQuality >= 70 ? 'good' : 'needs-improvement',
      improvement: analysis.qualityMetrics.averageQuality < 85 ? 'Add more specific requirements' : 'Quality target met'
    });

    // Efficiency metric
    metrics.push({
      metric: 'Task Efficiency',
      value: analysis.productivity.efficiency,
      unit: 'percent',
      benchmark: 85,
      status: analysis.productivity.efficiency >= 85 ? 'excellent' : analysis.productivity.efficiency >= 70 ? 'good' : 'needs-improvement',
      improvement: analysis.productivity.efficiency < 85 ? 'Break tasks into smaller chunks' : 'Excellent efficiency'
    });

    // Test coverage metric (if available)
    if (analysis.qualityMetrics.testCoverage !== undefined) {
      metrics.push({
        metric: 'Test Coverage',
        value: analysis.qualityMetrics.testCoverage,
        unit: 'percent',
        benchmark: 80,
        status: analysis.qualityMetrics.testCoverage >= 80 ? 'excellent' : analysis.qualityMetrics.testCoverage >= 70 ? 'good' : 'needs-improvement',
        improvement: analysis.qualityMetrics.testCoverage < 80 ? 'Add edge case tests' : 'Coverage target met'
      });
    }

    return metrics;
  }

  /**
   * Extract agent insights
   */
  private async extractAgentInsights(performance: AgentPerformance[]): Promise<ExtractedLearnings['agentInsights']> {
    return performance.map(agent => ({
      agentId: agent.agentId,
      effectiveness: agent.effectiveness,
      bestPractices: this.getAgentBestPractices(agent),
      improvementAreas: this.getAgentImprovements(agent)
    }));
  }

  /**
   * Get best practices for agent
   */
  private getAgentBestPractices(agent: AgentPerformance): string[] {
    const practices: string[] = [];

    if (agent.successRate >= 0.9) {
      practices.push(`Consistent success rate (${Math.round(agent.successRate * 100)}%)`);
    }

    if (agent.timeSaved >= 30) {
      practices.push(`High time savings (${agent.timeSaved} min per session)`);
    }

    if (agent.effectiveness === 'high') {
      practices.push('Optimal for complex tasks requiring domain expertise');
    }

    return practices;
  }

  /**
   * Get improvement areas for agent
   */
  private getAgentImprovements(agent: AgentPerformance): string[] {
    const improvements: string[] = [];

    if (agent.successRate < 0.8) {
      improvements.push('Improve task clarity and requirements specificity');
    }

    if (agent.effectiveness === 'low') {
      improvements.push('Consider re-evaluating task suitability for this agent');
    }

    if (agent.activations === 1) {
      improvements.push('Underutilized - find more opportunities to leverage agent');
    }

    return improvements;
  }

  /**
   * Calculate overall effectiveness score
   */
  private calculateOverallEffectiveness(analysis: SessionAnalysis): number {
    // Weighted average of key metrics
    const weights = {
      timeSaved: 0.3,
      quality: 0.25,
      efficiency: 0.25,
      agentPerformance: 0.2
    };

    const timeSavedScore = Math.min(100, (analysis.productivity.timeSaved / 60) * 100);
    const qualityScore = analysis.qualityMetrics.averageQuality;
    const efficiencyScore = analysis.productivity.efficiency;
    const agentScore = analysis.agentPerformance.reduce((sum, a) => {
      const score = a.effectiveness === 'high' ? 90 : a.effectiveness === 'medium' ? 70 : 50;
      return sum + score;
    }, 0) / analysis.agentPerformance.length;

    return Math.round(
      timeSavedScore * weights.timeSaved +
      qualityScore * weights.quality +
      efficiencyScore * weights.efficiency +
      agentScore * weights.agentPerformance
    );
  }

  /**
   * Calculate compounding score (impact on future sessions)
   */
  private calculateCompoundingScore(
    patterns: CodePattern[],
    lessons: LessonLearned[],
    metrics: PerformanceMetric[]
  ): number {
    // High-value patterns increase future speed
    const patternScore = Math.min(100, patterns.length * 15);

    // Actionable lessons compound knowledge
    const lessonScore = Math.min(100, lessons.length * 20);

    // Excellent metrics indicate patterns worth codifying
    const metricsScore = metrics.filter(m => m.status === 'excellent').length * 10;

    return Math.min(100, Math.round((patternScore + lessonScore + metricsScore) / 3));
  }
}

/**
 * Factory function for LearningExtractor
 */
export function createLearningExtractor(): LearningExtractor {
  return new LearningExtractor();
}
