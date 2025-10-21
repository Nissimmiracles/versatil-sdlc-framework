/**
 * Security Report Generator
 * Generates comprehensive security reports from Observatory scans
 * Outputs: JSON, Markdown, HTML, CSV formats
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger.js';
import { ObservatoryScanResult, ObservatoryTestResult, SecurityHeaderValidation } from './observatory-scanner.js';

export interface SecurityReport {
  id: string;
  timestamp: number;
  url: string;
  grade: string;
  score: number;
  pass: boolean;
  summary: {
    tests_passed: number;
    tests_failed: number;
    tests_total: number;
    pass_percentage: number;
  };
  headers: {
    present: string[];
    missing: string[];
    invalid: string[];
  };
  vulnerabilities: ReportVulnerability[];
  recommendations: ReportRecommendation[];
  remediation_steps: RemediationStep[];
}

export interface ReportVulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  impact: string;
  affected_components: string[];
  cwe?: string;
}

export interface ReportRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation_time: string;
  effort: 'quick' | 'medium' | 'complex';
}

export interface RemediationStep {
  step: number;
  action: string;
  code_example?: string;
  verification: string;
  resources: string[];
}

export class SecurityReportGenerator {
  private logger: VERSATILLogger;
  private outputDir: string;

  constructor(outputDir: string = '~/.versatil/security-reports') {
    this.logger = new VERSATILLogger();
    this.outputDir = outputDir.replace('~', process.env.HOME || '');
  }

  /**
   * Generate comprehensive security report
   */
  async generateReport(
    scanResult: ObservatoryScanResult,
    validations: SecurityHeaderValidation[]
  ): Promise<SecurityReport> {
    this.logger.info('Generating security report', {
      url: scanResult.url,
      grade: scanResult.grade
    }, 'security-report-generator');

    const report: SecurityReport = {
      id: scanResult.id,
      timestamp: scanResult.timestamp,
      url: scanResult.url,
      grade: scanResult.grade,
      score: scanResult.score,
      pass: this.determinePass(scanResult.grade),
      summary: {
        tests_passed: scanResult.tests_passed,
        tests_failed: scanResult.tests_failed,
        tests_total: scanResult.tests_total,
        pass_percentage: Math.round((scanResult.tests_passed / scanResult.tests_total) * 100)
      },
      headers: this.analyzeHeaders(validations),
      vulnerabilities: this.extractVulnerabilities(scanResult, validations),
      recommendations: this.generateRecommendations(scanResult, validations),
      remediation_steps: this.generateRemediationSteps(scanResult, validations)
    };

    return report;
  }

  /**
   * Determine if grade passes minimum threshold
   */
  private determinePass(grade: string): boolean {
    const passingGrades = ['A+', 'A', 'A-', 'B+', 'B'];
    return passingGrades.includes(grade);
  }

  /**
   * Analyze header presence and validity
   */
  private analyzeHeaders(validations: SecurityHeaderValidation[]) {
    return {
      present: validations.filter(v => v.present && v.valid).map(v => v.header),
      missing: validations.filter(v => !v.present).map(v => v.header),
      invalid: validations.filter(v => v.present && !v.valid).map(v => v.header)
    };
  }

  /**
   * Extract vulnerabilities from scan results
   */
  private extractVulnerabilities(
    scanResult: ObservatoryScanResult,
    validations: SecurityHeaderValidation[]
  ): ReportVulnerability[] {
    const vulnerabilities: ReportVulnerability[] = [];

    // Failed Observatory tests
    const failedTests = scanResult.test_results.filter(t => !t.pass);

    failedTests.forEach(test => {
      const severity = this.mapScoreToSeverity(test.score_modifier);

      vulnerabilities.push({
        severity,
        title: this.formatTestName(test.name),
        description: test.expectation,
        impact: test.score_description,
        affected_components: [test.name],
        cwe: this.mapTestToCWE(test.name)
      });
    });

    // Invalid headers
    const invalidHeaders = validations.filter(v => v.present && !v.valid);

    invalidHeaders.forEach(header => {
      vulnerabilities.push({
        severity: 'medium',
        title: `Invalid ${header.header} Configuration`,
        description: header.issues.join('; '),
        impact: `Weakened security posture for ${header.header}`,
        affected_components: [header.header]
      });
    });

    // Missing critical headers
    const missingHeaders = validations.filter(v => !v.present);

    missingHeaders.forEach(header => {
      const severity = this.getHeaderSeverity(header.header);

      vulnerabilities.push({
        severity,
        title: `Missing ${header.header} Header`,
        description: `The ${header.header} security header is not present`,
        impact: header.recommendations[0] || 'Reduced security posture',
        affected_components: [header.header]
      });
    });

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    vulnerabilities.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return vulnerabilities;
  }

  /**
   * Generate prioritized recommendations
   */
  private generateRecommendations(
    scanResult: ObservatoryScanResult,
    validations: SecurityHeaderValidation[]
  ): ReportRecommendation[] {
    const recommendations: ReportRecommendation[] = [];

    // Critical: Missing HSTS
    const hsts = validations.find(v => v.header === 'Strict-Transport-Security');
    if (!hsts?.present) {
      recommendations.push({
        priority: 'critical',
        title: 'Enable HSTS (HTTP Strict Transport Security)',
        description: 'Force all connections to use HTTPS, preventing man-in-the-middle attacks',
        implementation_time: '5 minutes',
        effort: 'quick'
      });
    }

    // High: Missing CSP
    const csp = validations.find(v => v.header === 'Content-Security-Policy');
    if (!csp?.present) {
      recommendations.push({
        priority: 'high',
        title: 'Implement Content Security Policy (CSP)',
        description: 'Prevent XSS attacks by controlling allowed resource sources',
        implementation_time: '30-60 minutes',
        effort: 'medium'
      });
    }

    // High: Missing X-Frame-Options
    const xfo = validations.find(v => v.header === 'X-Frame-Options');
    if (!xfo?.present && !csp?.value?.includes('frame-ancestors')) {
      recommendations.push({
        priority: 'high',
        title: 'Add X-Frame-Options Header',
        description: 'Prevent clickjacking attacks by controlling frame embedding',
        implementation_time: '5 minutes',
        effort: 'quick'
      });
    }

    // Medium: Missing other headers
    const otherHeaders = validations.filter(v =>
      !v.present &&
      !['Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options'].includes(v.header)
    );

    otherHeaders.forEach(header => {
      recommendations.push({
        priority: 'medium',
        title: `Add ${header.header} Header`,
        description: header.recommendations[0] || `Implement ${header.header} for enhanced security`,
        implementation_time: '5-10 minutes',
        effort: 'quick'
      });
    });

    // Low: Grade improvements
    if (scanResult.grade === 'B' || scanResult.grade === 'B+' || scanResult.grade === 'B-') {
      recommendations.push({
        priority: 'low',
        title: 'Optimize for A+ Grade',
        description: 'Fine-tune CSP directives, enable subresource integrity, optimize cookie security',
        implementation_time: '1-2 hours',
        effort: 'complex'
      });
    }

    return recommendations;
  }

  /**
   * Generate step-by-step remediation guide
   */
  private generateRemediationSteps(
    scanResult: ObservatoryScanResult,
    validations: SecurityHeaderValidation[]
  ): RemediationStep[] {
    const steps: RemediationStep[] = [];
    let stepNumber = 1;

    // Step 1: Install security middleware
    steps.push({
      step: stepNumber++,
      action: 'Install security middleware for your framework',
      code_example: this.getMiddlewareExample(),
      verification: 'Run npm list helmet (for Node.js) or equivalent for your framework',
      resources: [
        'https://helmetjs.github.io/ (Node.js)',
        'https://flask-talisman.readthedocs.io/ (Python Flask)',
        'https://github.com/rails/secure_headers (Ruby on Rails)'
      ]
    });

    // Step 2: Configure HSTS
    const hsts = validations.find(v => v.header === 'Strict-Transport-Security');
    if (!hsts?.present || !hsts.valid) {
      steps.push({
        step: stepNumber++,
        action: 'Enable HSTS with 1-year max-age',
        code_example: "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
        verification: 'curl -I https://yoursite.com | grep Strict-Transport-Security',
        resources: [
          'https://hstspreload.org/',
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'
        ]
      });
    }

    // Step 3: Implement CSP
    const csp = validations.find(v => v.header === 'Content-Security-Policy');
    if (!csp?.present) {
      steps.push({
        step: stepNumber++,
        action: 'Implement Content Security Policy (start with report-only)',
        code_example: "Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; report-uri /csp-report",
        verification: 'Check browser console for CSP violations, analyze reports',
        resources: [
          'https://csp-evaluator.withgoogle.com/',
          'https://content-security-policy.com/',
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'
        ]
      });

      steps.push({
        step: stepNumber++,
        action: 'Remove unsafe-inline from CSP (use nonces or hashes)',
        code_example: "<script nonce='random-per-request-nonce'>...</script>",
        verification: 'Verify no CSP violations in production logs',
        resources: [
          'https://content-security-policy.com/nonce/',
          'https://csp.withgoogle.com/docs/adopting-csp.html'
        ]
      });
    }

    // Step 4: Add remaining headers
    const missingHeaders = validations.filter(v => !v.present);
    if (missingHeaders.length > 2) {
      steps.push({
        step: stepNumber++,
        action: 'Add remaining security headers',
        code_example: missingHeaders.map(h => h.recommendations[0]).filter(Boolean).join('\n'),
        verification: 'Run security scan again: npm run security:scan',
        resources: [
          'https://observatory.mozilla.org/',
          'https://securityheaders.com/'
        ]
      });
    }

    // Step 5: Test and deploy
    steps.push({
      step: stepNumber++,
      action: 'Test security headers in staging environment',
      verification: 'Run: npm run security:scan https://staging.yoursite.com',
      resources: [
        'https://github.com/mozilla/http-observatory',
        'https://www.ssllabs.com/ssltest/'
      ]
    });

    steps.push({
      step: stepNumber++,
      action: 'Deploy to production and verify',
      verification: 'Run: npm run security:scan https://yoursite.com\nTarget: Grade A or higher',
      resources: [
        'VERSATIL Security Documentation',
        'Mozilla Observatory API: https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md'
      ]
    });

    return steps;
  }

  /**
   * Export report to JSON
   */
  async exportJSON(report: SecurityReport, filename?: string): Promise<string> {
    const outputPath = path.join(
      this.outputDir,
      filename || `security-report-${report.id}.json`
    );

    await this.ensureDirectoryExists(this.outputDir);
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');

    this.logger.info('Security report exported (JSON)', { outputPath }, 'security-report-generator');

    return outputPath;
  }

  /**
   * Export report to Markdown
   */
  async exportMarkdown(report: SecurityReport, filename?: string): Promise<string> {
    const outputPath = path.join(
      this.outputDir,
      filename || `security-report-${report.id}.md`
    );

    const markdown = this.generateMarkdown(report);

    await this.ensureDirectoryExists(this.outputDir);
    await fs.writeFile(outputPath, markdown, 'utf-8');

    this.logger.info('Security report exported (Markdown)', { outputPath }, 'security-report-generator');

    return outputPath;
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdown(report: SecurityReport): string {
    const passEmoji = report.pass ? '✅' : '❌';
    const gradeEmoji = this.getGradeEmoji(report.grade);

    return `# Security Report: ${report.url}

${passEmoji} **Grade: ${report.grade}** ${gradeEmoji} | **Score: ${report.score}/100**

Generated: ${new Date(report.timestamp).toISOString()}

---

## Summary

- **Tests Passed**: ${report.summary.tests_passed}/${report.summary.tests_total} (${report.summary.pass_percentage}%)
- **Tests Failed**: ${report.summary.tests_failed}
- **Status**: ${report.pass ? 'PASS ✅' : 'FAIL ❌ - Deployment blocked'}

### Security Headers

**Present & Valid** (${report.headers.present.length}):
${report.headers.present.map(h => `- ✅ ${h}`).join('\n')}

**Missing** (${report.headers.missing.length}):
${report.headers.missing.map(h => `- ❌ ${h}`).join('\n')}

${report.headers.invalid.length > 0 ? `**Invalid Configuration** (${report.headers.invalid.length}):\n${report.headers.invalid.map(h => `- ⚠️ ${h}`).join('\n')}` : ''}

---

## Vulnerabilities

${report.vulnerabilities.length === 0 ? '✅ No vulnerabilities detected!' : ''}

${report.vulnerabilities.map((v, i) => `
### ${i + 1}. ${v.title} ${this.getSeverityBadge(v.severity)}

**Severity**: ${v.severity.toUpperCase()}
**Description**: ${v.description}
**Impact**: ${v.impact}
**Affected**: ${v.affected_components.join(', ')}
${v.cwe ? `**CWE**: [${v.cwe}](https://cwe.mitre.org/data/definitions/${v.cwe.replace('CWE-', '')}.html)` : ''}
`).join('\n')}

---

## Recommendations

${report.recommendations.map((r, i) => `
### ${i + 1}. ${r.title} ${this.getPriorityBadge(r.priority)}

**Priority**: ${r.priority.toUpperCase()}
**Description**: ${r.description}
**Effort**: ${r.effort} (${r.implementation_time})
`).join('\n')}

---

## Remediation Steps

${report.remediation_steps.map(step => `
### Step ${step.step}: ${step.action}

${step.code_example ? `\`\`\`\n${step.code_example}\n\`\`\`` : ''}

**Verification**: ${step.verification}

**Resources**:
${step.resources.map(r => `- ${r}`).join('\n')}
`).join('\n')}

---

## Next Steps

${!report.pass ? `
🚨 **DEPLOYMENT BLOCKED**: Security grade below minimum threshold (A required)

1. Address all CRITICAL and HIGH priority recommendations
2. Re-run security scan: \`npm run security:scan ${report.url}\`
3. Verify grade A or higher before deploying
` : `
✅ **READY FOR DEPLOYMENT**: Security posture meets requirements

1. Continue monitoring with daily scans
2. Review MEDIUM priority recommendations for further improvements
3. Consider A+ optimizations for enhanced security
`}

---

**Report ID**: ${report.id}
**Generated by**: VERSATIL Security Scanner (Mozilla Observatory Integration)
**Documentation**: docs/security/MOZILLA_OBSERVATORY.md
`;
  }

  /**
   * Helper: Get grade emoji
   */
  private getGradeEmoji(grade: string): string {
    if (grade === 'A+') return '🏆';
    if (grade.startsWith('A')) return '🎖️';
    if (grade.startsWith('B')) return '🥈';
    if (grade.startsWith('C')) return '🥉';
    return '⚠️';
  }

  /**
   * Helper: Get severity badge
   */
  private getSeverityBadge(severity: string): string {
    const badges = {
      critical: '🔴 CRITICAL',
      high: '🟠 HIGH',
      medium: '🟡 MEDIUM',
      low: '🟢 LOW',
      info: 'ℹ️ INFO'
    };
    return badges[severity] || '';
  }

  /**
   * Helper: Get priority badge
   */
  private getPriorityBadge(priority: string): string {
    const badges = {
      critical: '🔴 CRITICAL',
      high: '🟠 HIGH',
      medium: '🟡 MEDIUM',
      low: '🟢 LOW'
    };
    return badges[priority] || '';
  }

  /**
   * Helper: Map score modifier to severity
   */
  private mapScoreToSeverity(scoreModifier: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (scoreModifier <= -10) return 'critical';
    if (scoreModifier <= -5) return 'high';
    if (scoreModifier <= -2) return 'medium';
    if (scoreModifier < 0) return 'low';
    return 'info';
  }

  /**
   * Helper: Format test name
   */
  private formatTestName(name: string): string {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Helper: Map test to CWE
   */
  private mapTestToCWE(testName: string): string | undefined {
    const cweMap: Record<string, string> = {
      'content-security-policy': 'CWE-1021',
      'x-frame-options': 'CWE-1021',
      'cross-origin-resource-sharing': 'CWE-942',
      'subresource-integrity': 'CWE-353',
      'x-content-type-options': 'CWE-16',
      'strict-transport-security': 'CWE-319',
      'cookies': 'CWE-614'
    };

    return cweMap[testName];
  }

  /**
   * Helper: Get header severity
   */
  private getHeaderSeverity(header: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const criticalHeaders = ['Strict-Transport-Security'];
    const highHeaders = ['Content-Security-Policy', 'X-Frame-Options'];
    const mediumHeaders = ['X-Content-Type-Options', 'Referrer-Policy'];

    if (criticalHeaders.includes(header)) return 'critical';
    if (highHeaders.includes(header)) return 'high';
    if (mediumHeaders.includes(header)) return 'medium';
    return 'low';
  }

  /**
   * Helper: Get middleware installation example
   */
  private getMiddlewareExample(): string {
    return `# Node.js (Express)
npm install helmet
const helmet = require('helmet');
app.use(helmet());

# Python (Flask)
pip install flask-talisman
from flask_talisman import Talisman
Talisman(app)

# Ruby on Rails
gem 'secure_headers'
SecureHeaders::Configuration.default`;
  }

  /**
   * Helper: Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory already exists or can't be created
    }
  }
}

// Export singleton instance
export const securityReportGenerator = new SecurityReportGenerator();
