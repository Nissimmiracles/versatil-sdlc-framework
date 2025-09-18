/**
 * Enhanced Base Agent Class - Standardized BMAD Agent Framework
 *
 * Based on Enhanced Maria analysis, this provides standardized capabilities
 * for all BMAD agents including configuration validation, cross-file checking,
 * and comprehensive quality assessment.
 */

export interface AgentResponse {
  agentId: string;
  message: string;
  suggestions: Recommendation[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  handoffTo: string[];
  context: Record<string, any>;
}

export interface AgentActivationContext {
  trigger?: any;
  filePath?: string;
  content?: string;
  errorMessage?: string;
  userRequest?: string;
  contextClarity?: 'clear' | 'ambiguous' | 'missing';
  requiredClarifications?: string[];
  matchedKeywords?: string[];
  emergency?: boolean;
  testing?: boolean;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  emergencyType?: string;
  emergencySeverity?: string;
  bridgeInvoked?: boolean;
}

export interface Issue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line?: number;
  fix?: string;
  preventionStrategy?: string;
  impact?: string;
}

export interface Recommendation {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  actions?: string[];
}

export interface ValidationResults {
  score: number;
  issues: Issue[];
  warnings: string[];
  recommendations: Recommendation[];
  crossFileAnalysis?: Record<string, string>;
  performanceMetrics?: Record<string, any>;
  accessibilityIssues?: string[];
  securityConcerns?: string[];
}

/**
 * Enhanced Base Agent - Foundation for all BMAD agents
 */
export abstract class BaseAgent {
  protected id: string;
  protected name: string;
  protected specialization: string;

  constructor(id: string, specialization: string) {
    this.id = id;
    this.name = this.extractAgentName(id);
    this.specialization = specialization;
  }

  /**
   * Main activation method - must be implemented by each agent
   */
  abstract activate(context: AgentActivationContext): Promise<AgentResponse>;

  /**
   * Standardized validation framework
   */
  protected async runStandardValidation(context: AgentActivationContext): Promise<ValidationResults> {
    const results: ValidationResults = {
      score: 100,
      issues: [],
      warnings: [],
      recommendations: [],
      crossFileAnalysis: {},
      performanceMetrics: {},
      accessibilityIssues: [],
      securityConcerns: []
    };

    if (!context.content) return results;

    // Standard checks all agents should perform
    await this.checkDebuggingCode(context, results);
    await this.checkCodeQuality(context, results);
    await this.checkSecurityBasics(context, results);
    await this.checkPerformanceBasics(context, results);

    // Agent-specific validation (implemented by subclasses)
    const agentResults = await this.runAgentSpecificValidation(context);
    this.mergeValidationResults(results, agentResults);

    return results;
  }

  /**
   * Agent-specific validation - implemented by each agent
   */
  protected abstract runAgentSpecificValidation(context: AgentActivationContext): Promise<Partial<ValidationResults>>;

  /**
   * Standard debugging code detection
   */
  protected async checkDebuggingCode(context: AgentActivationContext, results: ValidationResults): Promise<void> {
    if (!context.content) return;

    const debugPatterns = [
      { pattern: /console\.log/, severity: 'medium' as const, message: 'Console.log detected in production code' },
      { pattern: /debugger;/, severity: 'high' as const, message: 'Debugger statement in production code' },
      { pattern: /\bTODO\b.*test/i, severity: 'medium' as const, message: 'TODO comments with test keywords' },
      { pattern: /style.*color.*purple.*test/i, severity: 'critical' as const, message: 'Debug styling detected in production' },
      { pattern: /🧠.*test/i, severity: 'high' as const, message: 'Test markers in production code' }
    ];

    debugPatterns.forEach(({ pattern, severity, message }) => {
      if (pattern.test(context.content!)) {
        results.issues.push({
          type: 'debugging-code',
          severity,
          message,
          file: context.filePath || 'unknown',
          fix: 'Remove debugging code before production deployment',
          preventionStrategy: 'Add pre-commit hooks to detect debugging code'
        });

        // Adjust score based on severity
        const penalties = { critical: 25, high: 15, medium: 10, low: 5 };
        results.score -= penalties[severity];
      }
    });
  }

  /**
   * Standard code quality checks
   */
  protected async checkCodeQuality(context: AgentActivationContext, results: ValidationResults): Promise<void> {
    if (!context.content) return;

    // Check for code smells
    const codeSmells = [
      { pattern: /function\s+\w+\([^)]*\)\s*\{[^}]{500,}\}/, severity: 'medium' as const, message: 'Large function detected - consider refactoring' },
      { pattern: /if\s*\([^)]*\)\s*\{[^}]*if\s*\([^)]*\)\s*\{[^}]*if/, severity: 'medium' as const, message: 'Deep nesting detected - consider refactoring' },
      { pattern: /\/\/ HACK|\/\/ FIXME|\/\/ XXX/i, severity: 'low' as const, message: 'Code comments indicate technical debt' }
    ];

    codeSmells.forEach(({ pattern, severity, message }) => {
      if (pattern.test(context.content!)) {
        results.issues.push({
          type: 'code-quality',
          severity,
          message,
          file: context.filePath || 'unknown',
          fix: 'Refactor code to improve maintainability'
        });
      }
    });
  }

  /**
   * Basic security checks
   */
  protected async checkSecurityBasics(context: AgentActivationContext, results: ValidationResults): Promise<void> {
    if (!context.content) return;

    const securityPatterns = [
      { pattern: /password\s*=\s*['"`][^'"`]+['"`]/i, severity: 'critical' as const, message: 'Hardcoded password detected' },
      { pattern: /api_key\s*=\s*['"`][^'"`]+['"`]/i, severity: 'critical' as const, message: 'Hardcoded API key detected' },
      { pattern: /eval\s*\(/i, severity: 'high' as const, message: 'Use of eval() detected - security risk' },
      { pattern: /innerHTML\s*=/i, severity: 'medium' as const, message: 'Use of innerHTML - potential XSS risk' }
    ];

    securityPatterns.forEach(({ pattern, severity, message }) => {
      if (pattern.test(context.content!)) {
        results.securityConcerns!.push(message);
        results.issues.push({
          type: 'security-risk',
          severity,
          message,
          file: context.filePath || 'unknown',
          fix: 'Replace with secure alternative implementation'
        });
      }
    });
  }

  /**
   * Basic performance checks
   */
  protected async checkPerformanceBasics(context: AgentActivationContext, results: ValidationResults): Promise<void> {
    if (!context.content) return;

    // Check for performance anti-patterns
    const performanceIssues = [
      { pattern: /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{/, severity: 'medium' as const, message: 'Nested loops detected - potential performance issue' },
      { pattern: /\.map\s*\([^)]*\)\.filter/, severity: 'low' as const, message: 'Chained map-filter - consider optimization' },
      { pattern: /setInterval|setTimeout.*\b0\b/, severity: 'medium' as const, message: 'Potential performance issue with timer' }
    ];

    performanceIssues.forEach(({ pattern, severity, message }) => {
      if (pattern.test(context.content!)) {
        results.issues.push({
          type: 'performance',
          severity,
          message,
          file: context.filePath || 'unknown',
          fix: 'Optimize code for better performance'
        });
      }
    });
  }

  /**
   * Merge validation results
   */
  protected mergeValidationResults(target: ValidationResults, source: Partial<ValidationResults>): void {
    if (source.issues) target.issues.push(...source.issues);
    if (source.warnings) target.warnings.push(...source.warnings);
    if (source.recommendations) target.recommendations.push(...source.recommendations);
    if (source.crossFileAnalysis) Object.assign(target.crossFileAnalysis!, source.crossFileAnalysis);
    if (source.performanceMetrics) Object.assign(target.performanceMetrics!, source.performanceMetrics);
    if (source.accessibilityIssues) target.accessibilityIssues!.push(...source.accessibilityIssues);
    if (source.securityConcerns) target.securityConcerns!.push(...source.securityConcerns);

    // Adjust score if source has a different score
    if (source.score !== undefined && source.score < target.score) {
      target.score = Math.min(target.score, source.score);
    }
  }

  /**
   * Generate standardized agent report
   */
  protected generateStandardReport(
    results: ValidationResults,
    agentEmoji: string = '🤖',
    specialAnalysis?: string
  ): string {
    let report = `${agentEmoji} **${this.name} - ${this.specialization}**\n\n`;

    // Quality Dashboard
    report += `📊 **Quality Dashboard**\n`;
    report += `Overall Score: ${results.score}% ${this.getScoreEmoji(results.score)}\n`;
    report += `Critical Issues: ${results.issues.filter(i => i.severity === 'critical').length} 🚨\n`;
    report += `High Priority: ${results.issues.filter(i => i.severity === 'high').length} ⚠️\n`;
    report += `Medium Priority: ${results.issues.filter(i => i.severity === 'medium').length} ⚡\n`;
    report += `Low Priority: ${results.issues.filter(i => i.severity === 'low').length} 💡\n\n`;

    // Special analysis section
    if (specialAnalysis) {
      report += specialAnalysis + '\n\n';
    }

    // Issues section
    if (results.issues.length > 0) {
      report += `🔍 **Issues Detected**\n`;
      results.issues.slice(0, 10).forEach((issue, index) => {
        report += `${index + 1}. **${issue.type}** (${issue.severity})\n`;
        report += `   📍 File: ${issue.file}\n`;
        report += `   ❌ Issue: ${issue.message}\n`;
        if (issue.fix) {
          report += `   💡 Fix: ${issue.fix}\n`;
        }
        if (issue.preventionStrategy) {
          report += `   🛡️ Prevention: ${issue.preventionStrategy}\n`;
        }
        report += '\n';
      });

      if (results.issues.length > 10) {
        report += `... and ${results.issues.length - 10} more issues\n\n`;
      }
    }

    // Security concerns
    if (results.securityConcerns && results.securityConcerns.length > 0) {
      report += `🔒 **Security Concerns**\n`;
      results.securityConcerns.forEach(concern => {
        report += `- ${concern}\n`;
      });
      report += '\n';
    }

    // Accessibility issues
    if (results.accessibilityIssues && results.accessibilityIssues.length > 0) {
      report += `♿ **Accessibility Issues**\n`;
      results.accessibilityIssues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }

    return report;
  }

  /**
   * Generate standard recommendations
   */
  protected generateStandardRecommendations(results: ValidationResults): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Critical issues
    const criticalIssues = results.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        type: 'critical-fix',
        priority: 'critical',
        message: `Fix ${criticalIssues.length} critical issues immediately`,
        actions: criticalIssues.map(issue => issue.fix || issue.message)
      });
    }

    // Security issues
    const securityIssues = results.issues.filter(i => i.type.includes('security'));
    if (securityIssues.length > 0) {
      recommendations.push({
        type: 'security-improvement',
        priority: 'high',
        message: 'Address security vulnerabilities',
        actions: [
          'Implement security scanning in CI/CD',
          'Add input validation',
          'Use secure coding practices'
        ]
      });
    }

    // Performance issues
    const performanceIssues = results.issues.filter(i => i.type.includes('performance'));
    if (performanceIssues.length > 0) {
      recommendations.push({
        type: 'performance-optimization',
        priority: 'medium',
        message: 'Optimize code performance',
        actions: [
          'Profile performance bottlenecks',
          'Implement performance monitoring',
          'Optimize critical code paths'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Calculate priority based on issues
   */
  protected calculateStandardPriority(results: ValidationResults): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = results.issues.filter(i => i.severity === 'critical').length;
    const highCount = results.issues.filter(i => i.severity === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (results.issues.length > 5) return 'medium';
    return 'low';
  }

  /**
   * Utility methods
   */
  protected getScoreEmoji(score: number): string {
    if (score >= 95) return '🟢';
    if (score >= 85) return '🟡';
    if (score >= 70) return '🟠';
    return '🔴';
  }

  protected extractAgentName(id: string): string {
    return id.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Configuration validation helpers
   */
  protected validateConfigurationConsistency(content: string, filePath?: string): Issue[] {
    const issues: Issue[] = [];

    // Check for configuration mismatches
    if (this.hasConfigurationInconsistencies(content)) {
      issues.push({
        type: 'configuration-inconsistency',
        severity: 'medium',
        message: 'Configuration values inconsistent with expected patterns',
        file: filePath || 'unknown',
        fix: 'Align configuration with project standards'
      });
    }

    return issues;
  }

  protected hasConfigurationInconsistencies(content: string): boolean {
    // Look for common configuration inconsistencies
    const hasEnvVars = /process\.env\./i.test(content);
    const hasHardcodedValues = /['"`]http:\/\/localhost|['"`]127\.0\.0\.1/i.test(content);

    return hasEnvVars && hasHardcodedValues;
  }

  /**
   * Cross-file analysis helpers
   */
  protected analyzeCrossFileConsistency(context: AgentActivationContext): Record<string, string> {
    const analysis: Record<string, string> = {};

    if (context.filePath) {
      const fileName = context.filePath.split('/').pop() || 'unknown';
      analysis[fileName] = `Analyzed for ${this.specialization} patterns`;
    }

    return analysis;
  }
}

export default BaseAgent;