/**
 * Quality Gate Enforcer
 * Enforces quality standards before allowing task completion
 *
 * Version: 1.0.0
 * Purpose: Block task completion if quality gates fail
 */

import { TestType } from './test-trigger-matrix.js';

export interface QualityGateConfig {
  minCoverage: number;              // Default: 80
  requirePassingTests: boolean;     // Default: true
  requireSecurityScan: boolean;     // Default: true for APIs
  requireAccessibilityScan: boolean; // Default: true for components
  minAccessibilityScore?: number;   // Default: 95
  allowedFailures?: number;         // Default: 0
  allowOverride: boolean;           // Default: false (emergencies only)
}

export interface TestResult {
  testType: TestType;
  passed: boolean;
  failed: number;
  total: number;
  coverage?: number;
  securityIssues?: number;
  accessibilityScore?: number;
  duration: number;
  errors?: TestError[];
  warnings?: TestWarning[];
}

export interface TestError {
  type: string;
  message: string;
  file?: string;
  line?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface TestWarning {
  type: string;
  message: string;
  file?: string;
  suggestion?: string;
}

export interface QualityGateResult {
  passed: boolean;
  failures: QualityGateFailure[];
  warnings: QualityGateWarning[];
  metrics: QualityMetrics;
  message: string;
  recommendations: string[];
  blockCompletion: boolean;
}

export interface QualityGateFailure {
  gate: string;
  expected: any;
  actual: any;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  fixSuggestion: string;
}

export interface QualityGateWarning {
  gate: string;
  message: string;
  suggestion: string;
}

export interface QualityMetrics {
  testsPassed: number;
  testsFailed: number;
  testsTotal: number;
  coverage: number;
  accessibilityScore: number;
  securityIssues: number;
  performanceScore: number;
  overallScore: number;
}

export class QualityGateEnforcer {
  private readonly DEFAULT_CONFIG: QualityGateConfig = {
    minCoverage: 80,
    requirePassingTests: true,
    requireSecurityScan: true,
    requireAccessibilityScan: true,
    minAccessibilityScore: 95,
    allowedFailures: 0,
    allowOverride: false
  };

  /**
   * Enforce quality gates on test results
   */
  async enforce(
    testResults: TestResult[],
    config: Partial<QualityGateConfig> = {}
  ): Promise<QualityGateResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    const failures: QualityGateFailure[] = [];
    const warnings: QualityGateWarning[] = [];
    const recommendations: string[] = [];

    // Calculate overall metrics
    const metrics = this.calculateMetrics(testResults);

    // Gate 1: Test Pass Rate
    if (finalConfig.requirePassingTests) {
      const passRateCheck = this.checkTestPassRate(testResults, finalConfig, metrics);
      if (passRateCheck.failure) {
        failures.push(passRateCheck.failure);
      }
      if (passRateCheck.warning) {
        warnings.push(passRateCheck.warning);
      }
      if (passRateCheck.recommendation) {
        recommendations.push(passRateCheck.recommendation);
      }
    }

    // Gate 2: Code Coverage
    const coverageCheck = this.checkCoverage(testResults, finalConfig, metrics);
    if (coverageCheck.failure) {
      failures.push(coverageCheck.failure);
    }
    if (coverageCheck.warning) {
      warnings.push(coverageCheck.warning);
    }
    if (coverageCheck.recommendation) {
      recommendations.push(coverageCheck.recommendation);
    }

    // Gate 3: Security Scan
    if (finalConfig.requireSecurityScan) {
      const securityCheck = this.checkSecurity(testResults, metrics);
      if (securityCheck.failure) {
        failures.push(securityCheck.failure);
      }
      if (securityCheck.recommendation) {
        recommendations.push(securityCheck.recommendation);
      }
    }

    // Gate 4: Accessibility
    if (finalConfig.requireAccessibilityScan) {
      const accessibilityCheck = this.checkAccessibility(
        testResults,
        finalConfig,
        metrics
      );
      if (accessibilityCheck.failure) {
        failures.push(accessibilityCheck.failure);
      }
      if (accessibilityCheck.warning) {
        warnings.push(accessibilityCheck.warning);
      }
      if (accessibilityCheck.recommendation) {
        recommendations.push(accessibilityCheck.recommendation);
      }
    }

    // Determine if quality gates passed
    const passed = failures.length === 0;
    const blockCompletion = !passed && !finalConfig.allowOverride;

    // Generate summary message
    const message = this.generateSummaryMessage(passed, failures, warnings, metrics);

    return {
      passed,
      failures,
      warnings,
      metrics,
      message,
      recommendations,
      blockCompletion
    };
  }

  /**
   * Calculate overall quality metrics
   */
  private calculateMetrics(testResults: TestResult[]): QualityMetrics {
    const testsPassed = testResults.reduce((sum, r) => sum + (r.total - r.failed), 0);
    const testsFailed = testResults.reduce((sum, r) => sum + r.failed, 0);
    const testsTotal = testsPassed + testsFailed;

    const coverage = this.calculateAverageCoverage(testResults);
    const accessibilityScore = this.calculateAccessibilityScore(testResults);
    const securityIssues = this.countSecurityIssues(testResults);
    const performanceScore = this.calculatePerformanceScore(testResults);

    // Overall score (weighted average)
    const overallScore = Math.round(
      (testsPassed / testsTotal) * 30 +    // 30% test pass rate
      coverage * 0.3 +                      // 30% coverage
      accessibilityScore * 0.2 +            // 20% accessibility
      performanceScore * 0.2                // 20% performance
    );

    return {
      testsPassed,
      testsFailed,
      testsTotal,
      coverage,
      accessibilityScore,
      securityIssues,
      performanceScore,
      overallScore
    };
  }

  /**
   * Check test pass rate
   */
  private checkTestPassRate(
    testResults: TestResult[],
    config: QualityGateConfig,
    metrics: QualityMetrics
  ): { failure?: QualityGateFailure; warning?: QualityGateWarning; recommendation?: string } {
    const failedCount = metrics.testsFailed;
    const allowedFailures = config.allowedFailures ?? 0;

    if (failedCount > allowedFailures) {
      return {
        failure: {
          gate: 'Test Pass Rate',
          expected: `${allowedFailures} or fewer failures`,
          actual: `${failedCount} failures`,
          severity: 'critical',
          impact: 'Code quality compromised, bugs may reach production',
          fixSuggestion: 'Fix failing tests before marking task complete'
        },
        recommendation: this.generateTestFailureRecommendations(testResults)
      };
    }

    return {};
  }

  /**
   * Check code coverage
   */
  private checkCoverage(
    testResults: TestResult[],
    config: QualityGateConfig,
    metrics: QualityMetrics
  ): { failure?: QualityGateFailure; warning?: QualityGateWarning; recommendation?: string } {
    const coverage = metrics.coverage;
    const minCoverage = config.minCoverage;

    if (coverage < minCoverage) {
      return {
        failure: {
          gate: 'Code Coverage',
          expected: `${minCoverage}% or higher`,
          actual: `${coverage}%`,
          severity: coverage < minCoverage - 10 ? 'high' : 'medium',
          impact: 'Untested code paths increase bug risk',
          fixSuggestion: `Add tests to increase coverage by ${minCoverage - coverage}%`
        },
        recommendation: this.generateCoverageRecommendations(testResults)
      };
    }

    // Warning if close to threshold
    if (coverage < minCoverage + 5) {
      return {
        warning: {
          gate: 'Code Coverage',
          message: `Coverage is ${coverage}% (close to ${minCoverage}% threshold)`,
          suggestion: 'Consider adding more tests for better safety margin'
        }
      };
    }

    return {};
  }

  /**
   * Check security scan results
   */
  private checkSecurity(
    testResults: TestResult[],
    metrics: QualityMetrics
  ): { failure?: QualityGateFailure; recommendation?: string } {
    const securityIssues = metrics.securityIssues;

    if (securityIssues > 0) {
      return {
        failure: {
          gate: 'Security Scan',
          expected: '0 security issues',
          actual: `${securityIssues} issues found`,
          severity: 'critical',
          impact: 'Security vulnerabilities may be exploitable',
          fixSuggestion: 'Review and fix all security issues before proceeding'
        },
        recommendation: this.generateSecurityRecommendations(testResults)
      };
    }

    return {};
  }

  /**
   * Check accessibility compliance
   */
  private checkAccessibility(
    testResults: TestResult[],
    config: QualityGateConfig,
    metrics: QualityMetrics
  ): { failure?: QualityGateFailure; warning?: QualityGateWarning; recommendation?: string } {
    const score = metrics.accessibilityScore;
    const minScore = config.minAccessibilityScore ?? 95;

    if (score < minScore) {
      return {
        failure: {
          gate: 'Accessibility',
          expected: `Score ${minScore} or higher (WCAG 2.1 AA)`,
          actual: `Score ${score}`,
          severity: score < 90 ? 'high' : 'medium',
          impact: 'Component not accessible to all users',
          fixSuggestion: 'Fix accessibility violations (aria-labels, keyboard navigation, contrast)'
        },
        recommendation: this.generateAccessibilityRecommendations(testResults)
      };
    }

    return {};
  }

  /**
   * Helper methods for calculating metrics
   */
  private calculateAverageCoverage(testResults: TestResult[]): number {
    const coverageResults = testResults.filter(r => r.coverage !== undefined);
    if (coverageResults.length === 0) return 0;

    const totalCoverage = coverageResults.reduce((sum, r) => sum + (r.coverage || 0), 0);
    return Math.round(totalCoverage / coverageResults.length);
  }

  private calculateAccessibilityScore(testResults: TestResult[]): number {
    const accessibilityResults = testResults.filter(r => r.accessibilityScore !== undefined);
    if (accessibilityResults.length === 0) return 100;

    const totalScore = accessibilityResults.reduce((sum, r) => sum + (r.accessibilityScore || 0), 0);
    return Math.round(totalScore / accessibilityResults.length);
  }

  private countSecurityIssues(testResults: TestResult[]): number {
    return testResults.reduce((sum, r) => sum + (r.securityIssues || 0), 0);
  }

  private calculatePerformanceScore(testResults: TestResult[]): number {
    // Simple performance score based on test duration
    // Faster tests = better performance
    const avgDuration = testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length;

    if (avgDuration < 1000) return 100;        // < 1s = excellent
    if (avgDuration < 3000) return 90;         // < 3s = good
    if (avgDuration < 5000) return 80;         // < 5s = acceptable
    if (avgDuration < 10000) return 70;        // < 10s = slow
    return 60;                                  // >= 10s = very slow
  }

  /**
   * Recommendation generation methods
   */
  private generateTestFailureRecommendations(testResults: TestResult[]): string {
    const failedTests = testResults.filter(r => !r.passed);
    const recommendations: string[] = [];

    failedTests.forEach(result => {
      if (result.errors && result.errors.length > 0) {
        const criticalErrors = result.errors.filter(e => e.severity === 'critical');
        if (criticalErrors.length > 0) {
          recommendations.push(
            `Fix ${criticalErrors.length} critical ${result.testType} test errors first`
          );
        }
      }
    });

    return recommendations.join('; ') || 'Review and fix all test failures';
  }

  private generateCoverageRecommendations(testResults: TestResult[]): string {
    const recommendations: string[] = [];

    const lowCoverageResults = testResults
      .filter(r => r.coverage !== undefined && r.coverage < 80)
      .sort((a, b) => (a.coverage || 0) - (b.coverage || 0));

    if (lowCoverageResults.length > 0) {
      const lowest = lowCoverageResults[0];
      recommendations.push(
        `Focus on ${lowest.testType} tests (currently ${lowest.coverage}% coverage)`
      );
    }

    return recommendations.join('; ') || 'Add tests for uncovered code paths';
  }

  private generateSecurityRecommendations(testResults: TestResult[]): string {
    const securityResults = testResults.filter(r => (r.securityIssues || 0) > 0);

    if (securityResults.length > 0) {
      const mostIssues = securityResults.reduce((max, r) =>
        (r.securityIssues || 0) > (max.securityIssues || 0) ? r : max
      );

      return `Address ${mostIssues.securityIssues} ${mostIssues.testType} security issues (OWASP compliance)`;
    }

    return 'Review security scan results';
  }

  private generateAccessibilityRecommendations(testResults: TestResult[]): string {
    const accessibilityResults = testResults.filter(r => r.accessibilityScore !== undefined);

    if (accessibilityResults.length > 0) {
      const lowest = accessibilityResults.reduce((min, r) =>
        (r.accessibilityScore || 100) < (min.accessibilityScore || 100) ? r : min
      );

      return `Improve accessibility in ${lowest.testType} (current score: ${lowest.accessibilityScore})`;
    }

    return 'Review accessibility violations (WCAG 2.1 AA)';
  }

  /**
   * Generate summary message
   */
  private generateSummaryMessage(
    passed: boolean,
    failures: QualityGateFailure[],
    warnings: QualityGateWarning[],
    metrics: QualityMetrics
  ): string {
    if (passed) {
      return `✅ Quality gate passed! Overall score: ${metrics.overallScore}/100 | ` +
        `Tests: ${metrics.testsPassed}/${metrics.testsTotal} | ` +
        `Coverage: ${metrics.coverage}% | ` +
        `Accessibility: ${metrics.accessibilityScore}`;
    }

    const failureMessages = failures.map(f => `${f.gate}: ${f.actual} (expected: ${f.expected})`);

    return `❌ Quality gate failed (${failures.length} issues):\n` +
      failureMessages.map(m => `  - ${m}`).join('\n') +
      `\n\nOverall score: ${metrics.overallScore}/100`;
  }

  /**
   * Format quality gate result for display
   */
  formatResult(result: QualityGateResult): string {
    let output = result.message + '\n\n';

    if (result.failures.length > 0) {
      output += '🚫 Failures:\n';
      result.failures.forEach(failure => {
        output += `  - ${failure.gate}: ${failure.actual} (expected: ${failure.expected})\n`;
        output += `    Impact: ${failure.impact}\n`;
        output += `    Fix: ${failure.fixSuggestion}\n`;
      });
      output += '\n';
    }

    if (result.warnings.length > 0) {
      output += '⚠️  Warnings:\n';
      result.warnings.forEach(warning => {
        output += `  - ${warning.gate}: ${warning.message}\n`;
        output += `    Suggestion: ${warning.suggestion}\n`;
      });
      output += '\n';
    }

    if (result.recommendations.length > 0) {
      output += '💡 Recommendations:\n';
      result.recommendations.forEach(rec => {
        output += `  - ${rec}\n`;
      });
    }

    return output;
  }
}

export default QualityGateEnforcer;
