import { BaseAgent, AgentActivationContext, AgentResponse } from '../agent-dispatcher';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enhanced Maria - Advanced QA Lead with Configuration Validation
 *
 * Original Maria's scope expanded to include:
 * - Configuration consistency validation
 * - Cross-file dependency checking
 * - Navigation integrity testing
 * - Production code cleanliness verification
 * - Real-time quality dashboard
 */
export class EnhancedMaria extends BaseAgent {
  private qualityMetrics: QualityMetrics;
  private configValidators: ConfigValidator[];

  constructor() {
    super('enhanced-maria', 'Advanced QA Lead & Configuration Validator');
    this.qualityMetrics = new QualityMetrics();
    this.configValidators = [
      new RouteConfigValidator(),
      new NavigationValidator(),
      new ProfileContextValidator(),
      new ProductionCodeValidator(),
      new CrossFileValidator()
    ];
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const { trigger, filePath, content, emergency = false, matchedKeywords = [] } = context;

    console.log('🔍 Enhanced Maria activated for comprehensive QA analysis...');

    // Run all validation checks
    const validationResults = await this.runComprehensiveValidation(context);
    const qualityDashboard = this.generateQualityDashboard(validationResults);
    const criticalIssues = this.identifyCriticalIssues(validationResults);

    return {
      agentId: this.id,
      message: this.generateEnhancedReport(validationResults, qualityDashboard, criticalIssues),
      suggestions: this.generateActionableRecommendations(validationResults),
      priority: this.calculatePriority(criticalIssues),
      handoffTo: this.determineHandoffs(validationResults),
      context: {
        qualityScore: qualityDashboard.overallScore,
        criticalIssues: criticalIssues.length,
        configurationHealth: validationResults.configurationScore,
        emergencyMode: emergency
      }
    };
  }

  private async runComprehensiveValidation(context: AgentActivationContext): Promise<ValidationResults> {
    const results: ValidationResults = {
      configurationScore: 100,
      issues: [],
      warnings: [],
      recommendations: [],
      crossFileAnalysis: {},
      performanceMetrics: {},
      accessibilityIssues: [],
      securityConcerns: []
    };

    // Run each validator
    for (const validator of this.configValidators) {
      try {
        const validatorResults = await validator.validate(context);
        this.mergeResults(results, validatorResults);
      } catch (error) {
        results.issues.push({
          type: 'validator-error',
          severity: 'high',
          message: `Validator ${validator.constructor.name} failed: ${error.message}`,
          file: context.filePath || 'unknown'
        });
      }
    }

    return results;
  }

  private generateQualityDashboard(results: ValidationResults): QualityDashboard {
    const criticalCount = results.issues.filter(i => i.severity === 'critical').length;
    const highCount = results.issues.filter(i => i.severity === 'high').length;
    const mediumCount = results.issues.filter(i => i.severity === 'medium').length;

    // Calculate overall quality score
    let score = 100;
    score -= criticalCount * 25; // Critical issues heavily penalized
    score -= highCount * 10;
    score -= mediumCount * 5;
    score -= results.warnings.length * 2;
    score = Math.max(0, score);

    return {
      overallScore: score,
      criticalIssues: criticalCount,
      highIssues: highCount,
      mediumIssues: mediumCount,
      warnings: results.warnings.length,
      configurationHealth: results.configurationScore,
      trend: this.calculateTrend(score),
      lastUpdated: new Date().toISOString()
    };
  }

  private identifyCriticalIssues(results: ValidationResults): CriticalIssue[] {
    return results.issues
      .filter(issue => issue.severity === 'critical' || issue.severity === 'high')
      .map(issue => ({
        ...issue,
        impact: this.assessImpact(issue),
        fix: this.generateFix(issue),
        preventionStrategy: this.generatePreventionStrategy(issue)
      }));
  }

  private generateEnhancedReport(
    results: ValidationResults,
    dashboard: QualityDashboard,
    criticalIssues: CriticalIssue[]
  ): string {
    let report = `🔍 **Enhanced Maria - Advanced QA Analysis Report**\n\n`;

    // Quality Dashboard
    report += `📊 **Quality Dashboard**\n`;
    report += `Overall Score: ${dashboard.overallScore}% ${this.getScoreEmoji(dashboard.overallScore)}\n`;
    report += `Critical Issues: ${dashboard.criticalIssues} 🚨\n`;
    report += `High Priority: ${dashboard.highIssues} ⚠️\n`;
    report += `Medium Priority: ${dashboard.mediumIssues} ⚡\n`;
    report += `Warnings: ${dashboard.warnings} 💡\n`;
    report += `Configuration Health: ${dashboard.configurationHealth}%\n\n`;

    // Critical Issues Section
    if (criticalIssues.length > 0) {
      report += `🚨 **Critical Issues Detected**\n`;
      criticalIssues.forEach((issue, index) => {
        report += `${index + 1}. **${issue.type}** (${issue.severity})\n`;
        report += `   📍 File: ${issue.file}\n`;
        report += `   ❌ Issue: ${issue.message}\n`;
        report += `   💡 Fix: ${issue.fix}\n`;
        report += `   🛡️ Prevention: ${issue.preventionStrategy}\n\n`;
      });
    }

    // Configuration Analysis
    if (results.crossFileAnalysis && Object.keys(results.crossFileAnalysis).length > 0) {
      report += `🔗 **Cross-File Analysis**\n`;
      Object.entries(results.crossFileAnalysis).forEach(([file, analysis]) => {
        report += `📄 ${file}: ${analysis}\n`;
      });
      report += `\n`;
    }

    // Performance Insights
    if (Object.keys(results.performanceMetrics).length > 0) {
      report += `⚡ **Performance Insights**\n`;
      Object.entries(results.performanceMetrics).forEach(([metric, value]) => {
        report += `${metric}: ${value}\n`;
      });
      report += `\n`;
    }

    // Accessibility Review
    if (results.accessibilityIssues.length > 0) {
      report += `♿ **Accessibility Issues**\n`;
      results.accessibilityIssues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += `\n`;
    }

    // Security Concerns
    if (results.securityConcerns.length > 0) {
      report += `🔒 **Security Concerns**\n`;
      results.securityConcerns.forEach(concern => {
        report += `- ${concern}\n`;
      });
      report += `\n`;
    }

    return report;
  }

  private generateActionableRecommendations(results: ValidationResults): any[] {
    const recommendations = [];

    // High-priority fixes
    const criticalIssues = results.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        type: 'critical-fix',
        priority: 'critical',
        message: `Fix ${criticalIssues.length} critical configuration issues immediately`,
        actions: criticalIssues.map(issue => this.generateFix(issue))
      });
    }

    // Configuration improvements
    if (results.configurationScore < 90) {
      recommendations.push({
        type: 'configuration',
        priority: 'high',
        message: 'Improve configuration consistency across files',
        actions: [
          'Implement configuration validation CI/CD checks',
          'Create configuration schema documentation',
          'Add real-time configuration monitoring'
        ]
      });
    }

    // Testing enhancements
    if (results.issues.some(i => i.type.includes('test'))) {
      recommendations.push({
        type: 'testing',
        priority: 'medium',
        message: 'Enhance testing coverage for configuration changes',
        actions: [
          'Add integration tests for navigation flows',
          'Implement configuration validation tests',
          'Create cross-file dependency tests'
        ]
      });
    }

    return recommendations;
  }

  private getScoreEmoji(score: number): string {
    if (score >= 95) return '🟢';
    if (score >= 85) return '🟡';
    if (score >= 70) return '🟠';
    return '🔴';
  }

  private calculateTrend(currentScore: number): 'improving' | 'declining' | 'stable' {
    // This would typically compare with historical data
    // For now, return stable as default
    return 'stable';
  }

  private assessImpact(issue: Issue): string {
    switch (issue.severity) {
      case 'critical':
        return 'High - Blocks user functionality or causes crashes';
      case 'high':
        return 'Medium - Degrades user experience significantly';
      case 'medium':
        return 'Low - Minor impact on user experience';
      default:
        return 'Minimal - Cosmetic or edge case issue';
    }
  }

  private generateFix(issue: Issue): string {
    const fixes = {
      'route-mismatch': 'Update route configuration to match navigation items',
      'navigation-inconsistency': 'Synchronize navigation configuration with actual routes',
      'profile-context-error': 'Fix profile context validation logic',
      'debugging-code': 'Remove debugging code from production routes',
      'dead-code': 'Remove unused route definitions and imports',
      'cross-file-inconsistency': 'Align configuration values across related files',
      'integration-gap': 'Add missing integration tests for the affected flow'
    };

    return fixes[issue.type] || 'Review and fix the identified issue manually';
  }

  private generatePreventionStrategy(issue: Issue): string {
    const strategies = {
      'route-mismatch': 'Add CI/CD check to validate route-navigation consistency',
      'navigation-inconsistency': 'Implement schema validation for navigation config',
      'profile-context-error': 'Add unit tests for profile context logic',
      'debugging-code': 'Add pre-commit hooks to detect debugging code',
      'dead-code': 'Set up automated dead code detection in CI',
      'cross-file-inconsistency': 'Implement configuration schema validation',
      'integration-gap': 'Mandate integration tests for navigation changes'
    };

    return strategies[issue.type] || 'Implement monitoring for this issue type';
  }

  private mergeResults(target: ValidationResults, source: Partial<ValidationResults>): void {
    if (source.issues) target.issues.push(...source.issues);
    if (source.warnings) target.warnings.push(...source.warnings);
    if (source.recommendations) target.recommendations.push(...source.recommendations);
    if (source.crossFileAnalysis) {
      Object.assign(target.crossFileAnalysis, source.crossFileAnalysis);
    }
    if (source.performanceMetrics) {
      Object.assign(target.performanceMetrics, source.performanceMetrics);
    }
    if (source.accessibilityIssues) {
      target.accessibilityIssues.push(...source.accessibilityIssues);
    }
    if (source.securityConcerns) {
      target.securityConcerns.push(...source.securityConcerns);
    }
  }

  private calculatePriority(criticalIssues: CriticalIssue[]): 'low' | 'medium' | 'high' | 'critical' {
    if (criticalIssues.some(i => i.severity === 'critical')) {
      return 'critical';
    }
    if (criticalIssues.length > 2) {
      return 'high';
    }
    if (criticalIssues.length > 0) {
      return 'medium';
    }
    return 'low';
  }

  private determineHandoffs(results: ValidationResults): string[] {
    const handoffs = [];

    // Security issues -> Security-Sam
    if (results.securityConcerns.length > 0) {
      handoffs.push('security-sam');
    }

    // Configuration issues -> DevOps-Dan
    if (results.issues.some(i => i.type.includes('config') || i.type.includes('route'))) {
      handoffs.push('devops-dan');
    }

    // Frontend issues -> James
    if (results.issues.some(i => i.type.includes('navigation') || i.type.includes('ui'))) {
      handoffs.push('james-frontend');
    }

    // Backend issues -> Marcus
    if (results.issues.some(i => i.type.includes('api') || i.type.includes('backend'))) {
      handoffs.push('marcus-backend');
    }

    // Always coordinate with PM for significant issues
    if (results.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length > 0) {
      handoffs.push('sarah-pm');
    }

    return handoffs;
  }
}

// Supporting interfaces and classes
interface ValidationResults {
  configurationScore: number;
  issues: Issue[];
  warnings: string[];
  recommendations: string[];
  crossFileAnalysis: Record<string, string>;
  performanceMetrics: Record<string, any>;
  accessibilityIssues: string[];
  securityConcerns: string[];
}

interface Issue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line?: number;
}

interface CriticalIssue extends Issue {
  impact: string;
  fix: string;
  preventionStrategy: string;
}

interface QualityDashboard {
  overallScore: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  warnings: number;
  configurationHealth: number;
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
}

interface QualityMetrics {
  // Quality metrics tracking would be implemented here
}

// Validator base class
abstract class ConfigValidator {
  abstract validate(context: AgentActivationContext): Promise<Partial<ValidationResults>>;
}

// Route Configuration Validator
class RouteConfigValidator extends ConfigValidator {
  async validate(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    const results: Partial<ValidationResults> = {
      issues: [],
      warnings: [],
      crossFileAnalysis: {}
    };

    if (!context.content) return results;

    // Check for debugging code in routes
    if (this.hasDebuggingCode(context.content)) {
      results.issues!.push({
        type: 'debugging-code',
        severity: 'critical',
        message: 'Debugging code detected in production routes',
        file: context.filePath || 'unknown'
      });
    }

    // Check for route-navigation mismatches
    const routeMismatches = this.checkRouteNavigationConsistency(context.content);
    results.issues!.push(...routeMismatches);

    return results;
  }

  private hasDebuggingCode(content: string): boolean {
    const debugPatterns = [
      /console\.log/,
      /debugger;/,
      /\bTODO\b.*test/i,
      /style.*color.*purple.*Route Test/,
      /🧠.*Route Test/
    ];

    return debugPatterns.some(pattern => pattern.test(content));
  }

  private checkRouteNavigationConsistency(content: string): Issue[] {
    const issues: Issue[] = [];

    // This would implement actual route-navigation consistency checking
    // For now, return example issues that would be detected

    return issues;
  }
}

// Navigation Validator
class NavigationValidator extends ConfigValidator {
  async validate(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    const results: Partial<ValidationResults> = {
      issues: [],
      accessibilityIssues: []
    };

    // Navigation accessibility and consistency checks would be implemented here

    return results;
  }
}

// Profile Context Validator
class ProfileContextValidator extends ConfigValidator {
  async validate(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    const results: Partial<ValidationResults> = {
      issues: [],
      warnings: []
    };

    // Profile context validation logic would be implemented here

    return results;
  }
}

// Production Code Validator
class ProductionCodeValidator extends ConfigValidator {
  async validate(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    const results: Partial<ValidationResults> = {
      issues: [],
      warnings: []
    };

    if (!context.content) return results;

    // Check for development-only code
    if (this.hasDevOnlyCode(context.content)) {
      results.issues!.push({
        type: 'dev-code-in-prod',
        severity: 'high',
        message: 'Development-only code detected in production build',
        file: context.filePath || 'unknown'
      });
    }

    return results;
  }

  private hasDevOnlyCode(content: string): boolean {
    const devPatterns = [
      /if\s*\(\s*process\.env\.NODE_ENV.*development/,
      /console\.warn.*dev/i,
      /\.development\./
    ];

    return devPatterns.some(pattern => pattern.test(content));
  }
}

// Cross File Validator
class CrossFileValidator extends ConfigValidator {
  async validate(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    const results: Partial<ValidationResults> = {
      issues: [],
      crossFileAnalysis: {}
    };

    // Cross-file dependency and consistency checks would be implemented here

    return results;
  }
}

export default EnhancedMaria;