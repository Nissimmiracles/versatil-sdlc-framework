import { BaseAgent, AgentResponse, AgentActivationContext } from './base-agent';
import { VERSATILLogger } from '../utils/logger';
import { PerformanceMonitor } from '../analytics/performance-monitor';
import * as fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface IntrospectionResult {
  insights: Insight[];
  recommendations: Recommendation[];
  timestamp: number;
  confidence: number;
  healthScore: number;
}

export interface Insight {
  type: string;
  description: string;
  confidence: number;
  impact?: string;
  actionable?: boolean;
}

export interface Recommendation {
  type: string;
  message: string;
  priority: string;
  estimatedEffort?: string;
  autoFixable?: boolean;
}

export interface ImprovementRecord {
  id: string;
  timestamp: number;
  description: string;
  impact: string;
  success: boolean;
}

export interface FrameworkHealth {
  score: number;
  configFiles: { [key: string]: boolean };
  dependencies: { total: number; outdated: number };
  vulnerabilities: number;
  issues: string[];
}

export interface PerformanceMetrics {
  buildTime: number;
  testTime: number;
  lintTime: number;
  memoryUsage: NodeJS.MemoryUsage;
}

/**
 * IntrospectiveAgent - Self-Monitoring & Optimization Controller
 *
 * Responsible for:
 * - Framework health monitoring
 * - Performance optimization
 * - Pattern recognition and learning
 * - Autonomous improvements
 */
export class IntrospectiveAgent extends BaseAgent {
  name = 'IntrospectiveAgent';
  id = 'introspective-agent';
  specialization = 'Self-Monitoring & Optimization Controller';
  systemPrompt = 'Autonomous agent responsible for framework introspection, optimization, and self-improvement';

  private logger: VERSATILLogger;
  private performanceMonitor: PerformanceMonitor;
  private learningInsights: Map<string, Insight> = new Map();
  private improvementHistory: ImprovementRecord[] = [];

  constructor() {
    super();
    this.logger = VERSATILLogger.getInstance();
    this.performanceMonitor = new PerformanceMonitor();

    this.logger.info(
      'IntrospectiveAgent initialized with tool-based controller architecture',
      {
        features: [
          'Framework Health Monitoring',
          'Performance Optimization Engine',
          'Pattern Recognition System',
          'Meta-Learning Capabilities',
          'Autonomous Improvement Engine'
        ]
      },
      'IntrospectiveAgent'
    );
  }

  /**
   * Main activation method - performs comprehensive introspective analysis
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const startTime = Date.now();

    this.logger.info(
      '🔍 Starting introspective analysis using tool controllers',
      {
        context: context.trigger || 'unknown'
      },
      'IntrospectiveAgent'
    );

    try {
      // Perform comprehensive analysis
      const healthAssessment = await this.assessFrameworkHealth();
      const performanceMetrics = await this.analyzePerformance();
      const patterns = await this.discoverPatterns(context);
      const learningInsights = await this.performMetaLearning();

      // Calculate overall confidence based on analysis results
      const confidence = this.calculateConfidence(healthAssessment, performanceMetrics);

      // Generate suggestions based on findings
      const suggestions = this.generateSuggestions(
        healthAssessment,
        performanceMetrics,
        patterns,
        learningInsights
      );

      // Determine handoffs if needed
      const handoffTo = this.determineHandoffsFromAnalysis(suggestions);

      // Calculate priority
      const priority = this.calculatePriorityFromSuggestions(suggestions);

      const executionTime = Date.now() - startTime;

      this.logger.info(
        '✅ Introspective analysis completed',
        {
          executionTime: `${executionTime}ms`,
          improvements: suggestions.length,
          confidence
        },
        'IntrospectiveAgent'
      );

      return {
        agentId: this.id,
        message: `Introspective analysis completed with ${suggestions.length} insights`,
        suggestions,
        priority,
        handoffTo,
        context: {
          confidence,
          introspectionTime: executionTime,
          healthScore: healthAssessment.score,
          performanceMetrics,
          patterns: patterns.length,
          learningInsights: learningInsights.length
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        '❌ Introspective analysis failed',
        {
          error: errorMessage,
          context: context.trigger || 'unknown'
        },
        'IntrospectiveAgent'
      );

      // Return degraded response with error information
      return {
        agentId: this.id,
        message: `Framework encountered errors and requires investigation: ${errorMessage}`,
        suggestions: [{
          type: 'error-recovery',
          message: 'Run framework recovery: npm run recover',
          priority: 'high'
        }, {
          type: 'configuration-check',
          message: 'Verify framework configuration and dependencies',
          priority: 'medium'
        }],
        priority: 'low',
        handoffTo: [],
        context: {
          confidence: 0.1,
          error: true,
          errorMessage
        }
      };
    }
  }

  /**
   * Assess framework health by checking configuration files and dependencies
   */
  private async assessFrameworkHealth(): Promise<FrameworkHealth> {
    const configFiles = {
      'package.json': false,
      'tsconfig.json': false,
      'jest.config.cjs': false,
      '.versatil-project.json': false
    };

    const issues: string[] = [];

    // Check for configuration files
    for (const [file, _] of Object.entries(configFiles)) {
      try {
        await fs.access(file);
        configFiles[file] = true;
      } catch {
        configFiles[file] = false;
        issues.push(`Missing configuration file: ${file}`);
      }
    }

    // Check dependencies and vulnerabilities
    let vulnerabilities = 0;
    let outdatedCount = 0;

    try {
      const auditResult = await execAsync('npm audit --json');
      const auditData = JSON.parse(auditResult.stdout);
      vulnerabilities = auditData.metadata?.vulnerabilities?.total || 0;
    } catch (error) {
      // npm audit returns non-zero exit code if vulnerabilities found
      if (error instanceof Error && 'stdout' in error) {
        try {
          const auditData = JSON.parse((error as any).stdout);
          vulnerabilities = auditData.metadata?.vulnerabilities?.total || 0;
        } catch {
          // Parsing failed, assume no vulnerabilities
        }
      }
    }

    // Calculate health score (0-1)
    const configScore = Object.values(configFiles).filter(Boolean).length / Object.keys(configFiles).length;
    const securityScore = vulnerabilities === 0 ? 1 : Math.max(0, 1 - (vulnerabilities * 0.1));
    const healthScore = (configScore * 0.6 + securityScore * 0.4);

    return {
      score: healthScore,
      configFiles,
      dependencies: {
        total: 0, // Would need npm list parsing
        outdated: outdatedCount
      },
      vulnerabilities,
      issues
    };
  }

  /**
   * Analyze framework performance metrics
   */
  private async analyzePerformance(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      buildTime: 0,
      testTime: 0,
      lintTime: 0,
      memoryUsage: process.memoryUsage()
    };

    // Measure build time (with timeout)
    try {
      const buildStart = Date.now();
      await this.execWithTimeout('npm run build', 60000);
      metrics.buildTime = Date.now() - buildStart;
    } catch {
      metrics.buildTime = -1; // Indicates failure or timeout
    }

    // Measure test time (with timeout)
    try {
      const testStart = Date.now();
      await this.execWithTimeout('npm test -- --silent', 30000);
      metrics.testTime = Date.now() - testStart;
    } catch {
      metrics.testTime = -1;
    }

    // Measure lint time (with timeout)
    try {
      const lintStart = Date.now();
      await this.execWithTimeout('npm run lint', 15000);
      metrics.lintTime = Date.now() - lintStart;
    } catch {
      metrics.lintTime = -1;
    }

    return metrics;
  }

  /**
   * Execute command with timeout
   */
  private execWithTimeout(command: string, timeoutMs: number): Promise<{stdout: string, stderr: string}> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Command timeout: ${command}`));
      }, timeoutMs);

      exec(command, (error, stdout, stderr) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  /**
   * Discover code patterns and anti-patterns
   */
  private async discoverPatterns(context: AgentActivationContext): Promise<Insight[]> {
    const patterns: Insight[] = [];

    // Pattern 1: Large files detection
    try {
      const files = await this.findLargeFiles();
      if (files.length > 0) {
        patterns.push({
          type: 'code-smell',
          description: `Found ${files.length} large files (>500 LOC) that may need refactoring`,
          confidence: 0.8,
          impact: 'medium',
          actionable: true
        });
      }
    } catch {
      // Ignore file system errors
    }

    // Pattern 2: Test coverage analysis
    if (context.content && context.content.includes('test')) {
      patterns.push({
        type: 'test-coverage',
        description: 'Test file detected - consider checking coverage metrics',
        confidence: 0.9,
        impact: 'high',
        actionable: true
      });
    }

    // Pattern 3: Performance patterns
    if (context.content && (context.content.includes('performance') || context.content.includes('optimization'))) {
      patterns.push({
        type: 'performance-focus',
        description: 'Performance-related code detected - monitoring for optimization opportunities',
        confidence: 0.85,
        impact: 'high',
        actionable: true
      });
    }

    return patterns;
  }

  /**
   * Find large files in the project
   */
  private async findLargeFiles(): Promise<string[]> {
    // Simple stub - in real implementation would scan src/ directory
    return [];
  }

  /**
   * Perform meta-learning from historical data
   */
  private async performMetaLearning(): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Learn from improvement history
    if (this.improvementHistory.length > 0) {
      const successRate = this.improvementHistory.filter(i => i.success).length / this.improvementHistory.length;

      if (successRate < 0.5) {
        insights.push({
          type: 'meta-learning',
          description: 'Low success rate in past improvements - review optimization strategy',
          confidence: 0.7,
          impact: 'medium',
          actionable: true
        });
      }
    }

    // Learn from stored insights
    if (this.learningInsights.size > 10) {
      insights.push({
        type: 'meta-learning',
        description: `Accumulated ${this.learningInsights.size} insights - ready for pattern synthesis`,
        confidence: 0.9,
        impact: 'high',
        actionable: true
      });
    }

    return insights;
  }

  /**
   * Calculate confidence based on analysis results
   */
  private calculateConfidence(health: FrameworkHealth, performance: PerformanceMetrics): number {
    let confidence = 0.5; // Base confidence

    // Health contributes 40%
    confidence += health.score * 0.4;

    // Performance contributes 30%
    const perfScore = (
      (performance.buildTime > 0 && performance.buildTime < 30000 ? 0.33 : 0) +
      (performance.testTime > 0 && performance.testTime < 15000 ? 0.33 : 0) +
      (performance.lintTime > 0 && performance.lintTime < 5000 ? 0.34 : 0)
    );
    confidence += perfScore * 0.3;

    // Memory usage contributes 20%
    const memoryMB = performance.memoryUsage.heapUsed / 1024 / 1024;
    const memoryScore = memoryMB < 100 ? 1 : memoryMB < 200 ? 0.7 : 0.3;
    confidence += memoryScore * 0.2;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate actionable suggestions based on analysis
   */
  private generateSuggestions(
    health: FrameworkHealth,
    performance: PerformanceMetrics,
    patterns: Insight[],
    learningInsights: Insight[]
  ): any[] {
    const suggestions: any[] = [];

    // Health-based suggestions
    if (health.vulnerabilities > 0) {
      suggestions.push({
        type: 'security',
        message: `Fix ${health.vulnerabilities} security vulnerabilities`,
        priority: 'critical'
      });
    }

    if (health.issues.length > 0) {
      suggestions.push({
        type: 'configuration',
        message: 'Resolve configuration issues: ' + health.issues.join(', '),
        priority: 'high'
      });
    }

    // Performance-based suggestions
    if (performance.buildTime > 30000) {
      suggestions.push({
        type: 'performance',
        message: 'Build time optimization recommended - consider build time optimization strategies',
        priority: 'medium'
      });
    }

    if (performance.testTime > 15000) {
      suggestions.push({
        type: 'performance',
        message: 'Test suite optimization recommended',
        priority: 'medium'
      });
    }

    const memoryMB = performance.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryMB > 150) {
      suggestions.push({
        type: 'performance',
        message: 'High memory usage detected - implement memory optimization',
        priority: 'medium'
      });
    }

    // Pattern-based suggestions
    for (const pattern of patterns) {
      if (pattern.actionable) {
        suggestions.push({
          type: pattern.type,
          message: pattern.description,
          priority: pattern.impact === 'high' ? 'high' : 'medium'
        });
      }
    }

    // Learning-based suggestions
    for (const insight of learningInsights) {
      if (insight.actionable) {
        suggestions.push({
          type: insight.type,
          message: insight.description,
          priority: 'medium'
        });
      }
    }

    return suggestions;
  }

  /**
   * Determine agent handoffs based on suggestions
   */
  private determineHandoffsFromAnalysis(suggestions: any[]): string[] {
    const handoffs: string[] = [];

    const hasSecurityIssues = suggestions.some(s => s.type === 'security');
    const hasPerformanceIssues = suggestions.some(s => s.type === 'performance');
    const hasTestIssues = suggestions.some(s => s.type === 'test-coverage');

    if (hasSecurityIssues) handoffs.push('security-sam');
    if (hasPerformanceIssues) handoffs.push('enhanced-marcus');
    if (hasTestIssues) handoffs.push('enhanced-maria');

    return handoffs;
  }

  /**
   * Calculate priority based on suggestions
   */
  private calculatePriorityFromSuggestions(suggestions: any[]): 'critical' | 'high' | 'medium' | 'low' {
    if (suggestions.some(s => s.priority === 'critical')) return 'critical';
    if (suggestions.some(s => s.priority === 'high')) return 'high';
    if (suggestions.some(s => s.priority === 'medium')) return 'medium';
    return 'low';
  }

  /**
   * Trigger introspection process
   */
  async triggerIntrospection(): Promise<IntrospectionResult> {
    const startTime = Date.now();

    const health = await this.assessFrameworkHealth();
    const performance = await this.analyzePerformance();
    const patterns = await this.discoverPatterns({ trigger: 'manual-introspection' } as AgentActivationContext);
    const learningInsights = await this.performMetaLearning();

    const confidence = this.calculateConfidence(health, performance);
    const suggestions = this.generateSuggestions(health, performance, patterns, learningInsights);

    const recommendations: Recommendation[] = suggestions.map(s => ({
      type: s.type,
      message: s.message,
      priority: s.priority,
      estimatedEffort: 'medium',
      autoFixable: false
    }));

    return {
      insights: [...patterns, ...learningInsights],
      recommendations,
      timestamp: Date.now(),
      confidence,
      healthScore: health.score
    };
  }

  /**
   * Get learning insights
   */
  getLearningInsights(): Map<string, Insight> {
    return this.learningInsights;
  }

  /**
   * Get improvement history
   */
  getImprovementHistory(): ImprovementRecord[] {
    return this.improvementHistory;
  }

  /**
   * Add learning insight
   */
  addLearningInsight(key: string, insight: Insight): void {
    this.learningInsights.set(key, insight);
  }

  /**
   * Record improvement
   */
  recordImprovement(record: ImprovementRecord): void {
    this.improvementHistory.push(record);
  }

  // Inherited common methods from earlier implementation
  calculatePriority(issues: any[]): number {
    if (!issues || issues.length === 0) return 0;
    const severities = issues.map(i =>
      i.severity === 'critical' ? 4 :
      i.severity === 'high' ? 3 :
      i.severity === 'medium' ? 2 : 1
    );
    return Math.max(...severities);
  }

  determineHandoffs(issues: any[]): string[] {
    const handoffs: string[] = [];
    if (!issues) return handoffs;

    const hasSecurityIssue = issues.some(i => i.type === 'security');
    const hasPerformanceIssue = issues.some(i => i.type === 'performance');
    const hasUIIssue = issues.some(i => i.type === 'ui' || i.type === 'accessibility');

    if (hasSecurityIssue) handoffs.push('security-sam');
    if (hasPerformanceIssue) handoffs.push('enhanced-marcus');
    if (hasUIIssue) handoffs.push('enhanced-james');

    return handoffs;
  }

  generateActionableRecommendations(issues: any[]): string[] {
    if (!issues || issues.length === 0) return [];

    return issues.map(issue => {
      if (issue.type === 'security') {
        return `Fix security issue: ${issue.message || 'Security vulnerability detected'}`;
      }
      if (issue.type === 'performance') {
        return `Optimize performance: ${issue.message || 'Performance issue detected'}`;
      }
      return `Address issue: ${issue.message || issue.description || 'Issue detected'}`;
    });
  }

  generateEnhancedReport(issues: any[], metadata: any = {}): any {
    return {
      summary: {
        totalIssues: issues?.length || 0,
        critical: issues?.filter(i => i.severity === 'critical').length || 0,
        high: issues?.filter(i => i.severity === 'high').length || 0,
        medium: issues?.filter(i => i.severity === 'medium').length || 0,
        low: issues?.filter(i => i.severity === 'low').length || 0
      },
      issues: issues || [],
      recommendations: this.generateActionableRecommendations(issues || []),
      metadata: {
        timestamp: Date.now(),
        ...metadata
      }
    };
  }

  getScoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 75) return '🟡';
    if (score >= 60) return '🟠';
    return '🔴';
  }

  extractAgentName(text: string): string {
    const match = text.match(/@(\w+)/);
    return match ? match[1] : '';
  }

  protected analyzeCrossFileConsistency(context: AgentActivationContext): Record<string, string> {
    return {
      [context.filePath || 'unknown']: context.content || ''
    };
  }

  hasConfigurationInconsistencies(context: any): boolean {
    return false;
  }
}