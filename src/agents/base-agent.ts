import { AgentResponse, AgentActivationContext, ValidationResults, Issue, Recommendation } from '../types';

export { AgentResponse, AgentActivationContext, ValidationResults, Issue, Recommendation };

export abstract class BaseAgent {
  name: string;
  id: string;
  specialization: string;
  abstract systemPrompt: string;

  constructor(id?: string, specialization?: string) {
    this.id = id || 'base-agent';
    this.specialization = specialization || 'Base Agent';
    this.name = this.extractAgentName(this.id);
  }

  abstract activate(context: AgentActivationContext): Promise<AgentResponse>;

  protected async runStandardValidation(context: AgentActivationContext): Promise<ValidationResults> {
    const issues: Issue[] = [];
    const warnings: string[] = [];
    const content = context.content || '';

    // Check for debugging code
    if (content.includes('console.log') || content.includes('console.warn')) {
      issues.push({
        type: 'debugging-code',
        severity: 'medium',
        message: 'Console.log detected in production code',
        file: context.filePath || 'unknown'
      });
    }

    if (content.includes('debugger')) {
      issues.push({
        type: 'debugging-code',
        severity: 'high',
        message: 'Debugger statement in production code',
        file: context.filePath || 'unknown'
      });
    }

    // Security issue detection
    if (content.includes('eval(') || content.includes('Function(')) {
      issues.push({
        type: 'security-risk',
        severity: 'high',
        message: 'Use of eval() detected - security risk',
        file: context.filePath || 'unknown'
      });
    }

    if (content.match(/innerHTML\s*=/)) {
      issues.push({
        type: 'security-risk',
        severity: 'high',
        message: 'Direct innerHTML assignment can lead to XSS',
        file: context.filePath || 'unknown'
      });
    }

    // Detect hardcoded passwords
    if (content.match(/password\s*=\s*["'][^"']+["']/i)) {
      issues.push({
        type: 'security-risk',
        severity: 'critical',
        message: 'Hardcoded password detected',
        file: context.filePath || 'unknown'
      });
    }

    // Performance issue detection
    if (content.match(/for\s*\([^)]*\)\s*\{[\s\S]*?for\s*\([^)]*\)\s*\{/)) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: 'Nested loops detected - potential performance issue',
        file: context.filePath || 'unknown'
      });
    }

    if (content.includes('.map(') && content.includes('.filter(')) {
      const mapFilterCount = (content.match(/\.map\(/g) || []).length + (content.match(/\.filter\(/g) || []).length;
      if (mapFilterCount > 3) {
        issues.push({
          type: 'performance',
          severity: 'low',
          message: 'Multiple array iterations - consider combining operations',
          file: context.filePath || 'unknown'
        });
      }
    }

    // Code quality issues
    if (content.includes('any') && content.includes('interface')) {
      issues.push({
        type: 'code-quality',
        severity: 'low',
        message: 'Avoid using "any" type in interfaces',
        file: context.filePath || 'unknown'
      });
    }

    // Technical debt markers
    if (content.includes('// HACK:') || content.includes('/* HACK')) {
      issues.push({
        type: 'code-quality',
        severity: 'medium',
        message: 'HACK comment indicates technical debt',
        file: context.filePath || 'unknown'
      });
    }

    // Deep nesting detection
    const nestingLevel = (content.match(/if\s*\([^)]*\)\s*\{[^}]*if\s*\([^)]*\)\s*\{[^}]*if\s*\([^)]*\)\s*\{/g) || []).length;
    if (nestingLevel > 0) {
      issues.push({
        type: 'code-quality',
        severity: 'medium',
        message: 'Deep nesting detected (3+ levels) - consider refactoring',
        file: context.filePath || 'unknown'
      });
    }

    // Check for TODO comments
    if (content.includes('// TODO') || content.includes('// FIXME')) {
      warnings.push('TODO/FIXME comments found in code');
    }

    const score = Math.max(0, 100 - (issues.length * 10) - (warnings.length * 5));

    // Extract security concerns
    const securityConcerns = issues
      .filter(i => i.type === 'security-risk')
      .map(i => i.message);

    return {
      score,
      issues,
      warnings,
      recommendations: [],
      crossFileAnalysis: this.analyzeCrossFileConsistency(context),
      performanceMetrics: {
        analysisTime: Date.now(),
        issueCount: issues.length
      },
      securityConcerns
    };
  }

  protected async runAgentSpecificValidation(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    return {};
  }

  protected generateStandardRecommendations(results: ValidationResults): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (results.issues && results.issues.length > 0) {
      const criticalIssues = results.issues.filter(i => i.severity === 'critical');
      const highIssues = results.issues.filter(i => i.severity === 'high');
      const securityIssues = results.issues.filter(i => i.type === 'security');

      if (criticalIssues.length > 0) {
        recommendations.push({
          type: 'critical-fix',
          message: `Fix ${criticalIssues.length} critical issues immediately`,
          priority: 'critical',
          estimatedEffort: 'high'
        });
      }

      if (highIssues.length > 0) {
        recommendations.push({
          type: 'high-priority-fix',
          message: `Address ${highIssues.length} high priority issues`,
          priority: 'high',
          estimatedEffort: 'medium'
        });
      }

      if (securityIssues.length > 0) {
        recommendations.push({
          type: 'security-improvement',
          message: `Resolve ${securityIssues.length} security vulnerabilities`,
          priority: 'high',
          estimatedEffort: 'medium'
        });
      }
    }

    return recommendations;
  }

  protected calculateStandardPriority(results: ValidationResults): string {
    if (results.issues && results.issues.length > 0) {
      const hasCritical = results.issues.some(i => i.severity === 'critical');
      if (hasCritical) return 'critical';

      const hasHigh = results.issues.some(i => i.severity === 'high');
      if (hasHigh) return 'high';

      const hasMedium = results.issues.some(i => i.severity === 'medium');
      if (hasMedium) return 'medium';
    }
    return 'low';
  }

  async analyze(context: AgentActivationContext): Promise<AgentResponse> {
    return this.activate(context);
  }

  async runTests(context: AgentActivationContext): Promise<any> {
    return { success: true, message: 'Tests not implemented for this agent' };
  }

  async analyzeArchitecture(context: AgentActivationContext): Promise<any> {
    return { success: true, message: 'Architecture analysis not implemented for this agent' };
  }

  async manageDeployment(context: AgentActivationContext): Promise<any> {
    return { success: true, message: 'Deployment management not implemented for this agent' };
  }

  protected analyzeCrossFileConsistency(context: AgentActivationContext): Record<string, string> {
    return {
      [context.filePath]: context.content || ''
    };
  }

  protected hasConfigurationInconsistencies(context: any): boolean {
    return false;
  }

  protected mergeValidationResults(target: ValidationResults, source: ValidationResults): void {
    if (source.issues) {
      target.issues = [...(target.issues || []), ...source.issues];
    }
    if (source.warnings) {
      target.warnings = [...(target.warnings || []), ...source.warnings];
    }
    if (source.recommendations) {
      target.recommendations = [...(target.recommendations || []), ...source.recommendations];
    }
    if (source.score !== undefined) {
      target.score = (target.score + source.score) / 2;
    }
  }

  protected extractAgentName(id: string): string {
    // Convert 'enhanced-maria-qa' to 'Enhanced Maria Qa'
    return id.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  protected getScoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 80) return '🟡';
    if (score >= 70) return '🟠';
    return '🔴';
  }
}
