/**
 * Mozilla Observatory Security Scanner
 * DAST (Dynamic Application Security Testing) integration
 *
 * Scans deployed applications for security vulnerabilities:
 * - HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - TLS/SSL configuration
 * - Cookie security
 * - Subresource integrity
 * - Content security policy
 *
 * API Documentation: https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md
 */

import { VERSATILLogger } from '../utils/logger.js';
import { environmentManager } from '../environment/environment-manager.js';

export interface ObservatoryScanResult {
  id: string;
  url: string;
  timestamp: number;
  state: 'PENDING' | 'STARTING' | 'RUNNING' | 'FINISHED' | 'ABORTED' | 'FAILED';
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F';
  score: number; // 0-130+ (100+ = A+)
  tests_passed: number;
  tests_failed: number;
  tests_total: number;
  scan_id: number;
  response_headers: Record<string, string>;
  test_results: ObservatoryTestResult[];
  recommendations: string[];
  error?: string;
}

export interface ObservatoryTestResult {
  name: string;
  pass: boolean;
  score_modifier: number;
  score_description: string;
  expectation: string;
  result: string;
  output: ObservatoryTestOutput;
}

export interface ObservatoryTestOutput {
  data: Record<string, any>;
  level?: 'info' | 'warning' | 'error';
  messages?: string[];
}

export interface SecurityHeaderValidation {
  header: string;
  present: boolean;
  value?: string;
  valid: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface SecurityScanOptions {
  rescan?: boolean; // Force rescan even if recent results exist
  hidden?: boolean; // Don't include scan in public results
  timeout?: number; // Max wait time in ms (default: 120000 = 2 min)
}

export class ObservatoryScanner {
  private logger: VERSATILLogger;
  private baseUrl = 'https://http-observatory.security.mozilla.org/api/v1';
  private rateLimit = 30000; // 30 seconds between scans per domain
  private lastScanTimes: Map<string, number> = new Map();

  constructor() {
    this.logger = new VERSATILLogger();
  }

  /**
   * Scan a URL with Mozilla Observatory
   */
  async scanUrl(
    url: string,
    options: SecurityScanOptions = {}
  ): Promise<ObservatoryScanResult> {
    const startTime = Date.now();
    const hostname = new URL(url).hostname;

    this.logger.info('Starting Observatory security scan', { url }, 'observatory-scanner');

    // Rate limiting check
    if (!options.rescan) {
      const lastScan = this.lastScanTimes.get(hostname);
      if (lastScan && Date.now() - lastScan < this.rateLimit) {
        const waitTime = Math.ceil((this.rateLimit - (Date.now() - lastScan)) / 1000);
        throw new Error(
          `Rate limit: Please wait ${waitTime} seconds before scanning ${hostname} again`
        );
      }
    }

    try {
      // Step 1: Initiate scan
      const scanId = await this.initiateScan(hostname, options);

      // Step 2: Poll for results
      const result = await this.pollScanResults(scanId, options.timeout || 120000);

      // Step 3: Enhance with recommendations
      result.recommendations = this.generateRecommendations(result);

      // Update rate limit tracker
      this.lastScanTimes.set(hostname, Date.now());

      this.logger.info('Observatory scan completed', {
        url,
        grade: result.grade,
        score: result.score,
        duration: Date.now() - startTime
      }, 'observatory-scanner');

      return result;

    } catch (error) {
      this.logger.error('Observatory scan failed', {
        url,
        error: error.message
      }, 'observatory-scanner');

      throw new Error(`Observatory scan failed: ${error.message}`);
    }
  }

  /**
   * Initiate a new scan
   */
  private async initiateScan(hostname: string, options: SecurityScanOptions): Promise<number> {
    const params = new URLSearchParams({
      host: hostname,
      ...(options.rescan && { rescan: 'true' }),
      ...(options.hidden && { hidden: 'true' })
    });

    const response = await fetch(`${this.baseUrl}/analyze?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to initiate scan: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    return data.scan_id;
  }

  /**
   * Poll for scan results with timeout
   */
  private async pollScanResults(
    scanId: number,
    timeout: number
  ): Promise<ObservatoryScanResult> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeout) {
      const response = await fetch(`${this.baseUrl}/getScanResults?scan=${scanId}`);

      if (!response.ok) {
        throw new Error(`Failed to get scan results: ${response.status}`);
      }

      const data = await response.json() as any;

      if (data.state === 'FINISHED') {
        return this.parseScanResult(data, scanId);
      }

      if (data.state === 'FAILED' || data.state === 'ABORTED') {
        throw new Error(`Scan ${data.state.toLowerCase()}: ${data.error || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Scan timeout after ${timeout}ms`);
  }

  /**
   * Parse Observatory API response into our format
   */
  private parseScanResult(data: any, scanId: number): ObservatoryScanResult {
    return {
      id: `obs-${scanId}`,
      url: data.scan?.target || '',
      timestamp: Date.now(),
      state: data.state,
      grade: data.grade || 'F',
      score: data.score || 0,
      tests_passed: data.tests_passed || 0,
      tests_failed: data.tests_failed || 0,
      tests_total: (data.tests_passed || 0) + (data.tests_failed || 0),
      scan_id: scanId,
      response_headers: data.response_headers || {},
      test_results: this.parseTestResults(data.tests || {}),
      recommendations: []
    };
  }

  /**
   * Parse individual test results
   */
  private parseTestResults(tests: Record<string, any>): ObservatoryTestResult[] {
    return Object.entries(tests).map(([name, test]) => ({
      name,
      pass: test.pass || false,
      score_modifier: test.score_modifier || 0,
      score_description: test.score_description || '',
      expectation: test.expectation || '',
      result: test.result || '',
      output: test.output || { data: {} }
    }));
  }

  /**
   * Generate actionable recommendations based on test results
   */
  private generateRecommendations(result: ObservatoryScanResult): string[] {
    const recommendations: string[] = [];

    // Critical issues (blocking deployment)
    const failedTests = result.test_results.filter(t => !t.pass);

    if (result.grade === 'F' || result.grade === 'D' || result.grade === 'D-' || result.grade === 'D+') {
      recommendations.push(
        '🚨 CRITICAL: Security grade is below minimum threshold (C required)'
      );
    }

    // Specific header recommendations
    const headers = result.response_headers;

    if (!headers['content-security-policy']) {
      recommendations.push(
        '🔒 Add Content-Security-Policy (CSP) header to prevent XSS attacks'
      );
    }

    if (!headers['strict-transport-security']) {
      recommendations.push(
        '🔒 Enable HSTS (Strict-Transport-Security) to enforce HTTPS'
      );
    }

    if (!headers['x-frame-options'] && !headers['content-security-policy']) {
      recommendations.push(
        '🔒 Add X-Frame-Options header to prevent clickjacking'
      );
    }

    if (!headers['x-content-type-options']) {
      recommendations.push(
        '🔒 Add X-Content-Type-Options: nosniff to prevent MIME sniffing'
      );
    }

    if (!headers['referrer-policy']) {
      recommendations.push(
        '🔒 Add Referrer-Policy header to control referrer information'
      );
    }

    // Test-specific recommendations
    failedTests.forEach(test => {
      if (test.name === 'content-security-policy') {
        recommendations.push(
          '📋 CSP Implementation: Start with report-only mode, then enforce'
        );
      }

      if (test.name === 'subresource-integrity') {
        recommendations.push(
          '🔐 Enable Subresource Integrity (SRI) for third-party scripts/styles'
        );
      }

      if (test.name === 'cookies') {
        recommendations.push(
          '🍪 Secure cookies with HttpOnly, Secure, and SameSite attributes'
        );
      }

      if (test.name === 'redirection') {
        recommendations.push(
          '🔄 Ensure all HTTP traffic redirects to HTTPS'
        );
      }
    });

    // Score-based recommendations
    if (result.score < 50) {
      recommendations.push(
        '⚡ Quick wins: Add basic security headers (takes < 5 minutes)'
      );
    }

    if (result.score >= 50 && result.score < 80) {
      recommendations.push(
        '📈 Good progress! Focus on CSP and cookie security next'
      );
    }

    if (result.score >= 80) {
      recommendations.push(
        '✅ Strong security posture! Consider A+ optimizations'
      );
    }

    return recommendations;
  }

  /**
   * Validate specific security headers
   */
  async validateSecurityHeaders(url: string): Promise<SecurityHeaderValidation[]> {
    const scanResult = await this.scanUrl(url);
    const headers = scanResult.response_headers;
    const validations: SecurityHeaderValidation[] = [];

    // Content-Security-Policy
    validations.push(this.validateCSP(headers));

    // Strict-Transport-Security (HSTS)
    validations.push(this.validateHSTS(headers));

    // X-Frame-Options
    validations.push(this.validateXFrameOptions(headers));

    // X-Content-Type-Options
    validations.push(this.validateXContentTypeOptions(headers));

    // Referrer-Policy
    validations.push(this.validateReferrerPolicy(headers));

    // Permissions-Policy (formerly Feature-Policy)
    validations.push(this.validatePermissionsPolicy(headers));

    return validations;
  }

  /**
   * Validate Content Security Policy
   */
  private validateCSP(headers: Record<string, string>): SecurityHeaderValidation {
    const csp = headers['content-security-policy'];
    const validation: SecurityHeaderValidation = {
      header: 'Content-Security-Policy',
      present: !!csp,
      value: csp,
      valid: false,
      score: 0,
      issues: [],
      recommendations: []
    };

    if (!csp) {
      validation.issues.push('CSP header missing');
      validation.recommendations.push(
        "Add: Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'"
      );
      return validation;
    }

    // Check for unsafe directives
    if (csp.includes("'unsafe-eval'")) {
      validation.issues.push("Contains 'unsafe-eval' - allows dangerous eval() usage");
      validation.score -= 10;
    }

    if (csp.includes("'unsafe-inline'") && csp.includes('script-src')) {
      validation.issues.push("Contains 'unsafe-inline' for scripts - vulnerable to XSS");
      validation.score -= 5;
    }

    // Check for required directives
    const hasDefaultSrc = csp.includes('default-src');
    const hasScriptSrc = csp.includes('script-src');

    if (!hasDefaultSrc && !hasScriptSrc) {
      validation.issues.push('Missing default-src or script-src directive');
      validation.score -= 10;
    }

    // Positive checks
    if (csp.includes('upgrade-insecure-requests')) {
      validation.score += 5;
    }

    if (csp.includes('report-uri') || csp.includes('report-to')) {
      validation.score += 3;
    }

    validation.valid = validation.issues.length === 0;
    validation.score = Math.max(0, 100 + validation.score);

    if (validation.issues.length > 0) {
      validation.recommendations.push(
        'Review CSP directives and remove unsafe-* values',
        'Use nonces or hashes instead of unsafe-inline',
        'Add report-uri to monitor violations'
      );
    }

    return validation;
  }

  /**
   * Validate HTTP Strict Transport Security
   */
  private validateHSTS(headers: Record<string, string>): SecurityHeaderValidation {
    const hsts = headers['strict-transport-security'];
    const validation: SecurityHeaderValidation = {
      header: 'Strict-Transport-Security',
      present: !!hsts,
      value: hsts,
      valid: false,
      score: 0,
      issues: [],
      recommendations: []
    };

    if (!hsts) {
      validation.issues.push('HSTS header missing');
      validation.recommendations.push(
        'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload'
      );
      return validation;
    }

    // Extract max-age
    const maxAgeMatch = hsts.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;

    if (maxAge < 31536000) {
      validation.issues.push(`max-age too low (${maxAge}s, should be ≥ 31536000s = 1 year)`);
      validation.score = 50;
    } else {
      validation.score = 100;
    }

    if (!hsts.includes('includeSubDomains')) {
      validation.issues.push('Missing includeSubDomains directive');
      validation.recommendations.push('Add includeSubDomains to protect all subdomains');
    }

    if (!hsts.includes('preload')) {
      validation.recommendations.push(
        'Consider adding preload directive and submitting to HSTS preload list'
      );
    }

    validation.valid = validation.issues.length === 0;

    return validation;
  }

  /**
   * Validate X-Frame-Options
   */
  private validateXFrameOptions(headers: Record<string, string>): SecurityHeaderValidation {
    const xfo = headers['x-frame-options'];
    const csp = headers['content-security-policy'];

    const validation: SecurityHeaderValidation = {
      header: 'X-Frame-Options',
      present: !!xfo,
      value: xfo,
      valid: false,
      score: 0,
      issues: [],
      recommendations: []
    };

    // CSP frame-ancestors can replace X-Frame-Options
    if (csp?.includes('frame-ancestors')) {
      validation.score = 100;
      validation.valid = true;
      validation.recommendations.push(
        'Using CSP frame-ancestors (modern alternative to X-Frame-Options)'
      );
      return validation;
    }

    if (!xfo) {
      validation.issues.push('X-Frame-Options header missing');
      validation.recommendations.push(
        'Add: X-Frame-Options: DENY or SAMEORIGIN',
        'Or use CSP frame-ancestors directive (recommended)'
      );
      return validation;
    }

    const upperXfo = xfo.toUpperCase();

    if (upperXfo === 'DENY' || upperXfo === 'SAMEORIGIN') {
      validation.valid = true;
      validation.score = 100;
    } else if (upperXfo.startsWith('ALLOW-FROM')) {
      validation.issues.push('ALLOW-FROM is deprecated and not supported in modern browsers');
      validation.recommendations.push('Use CSP frame-ancestors instead');
      validation.score = 50;
    } else {
      validation.issues.push(`Invalid value: ${xfo}`);
      validation.score = 0;
    }

    return validation;
  }

  /**
   * Validate X-Content-Type-Options
   */
  private validateXContentTypeOptions(headers: Record<string, string>): SecurityHeaderValidation {
    const xcto = headers['x-content-type-options'];

    const validation: SecurityHeaderValidation = {
      header: 'X-Content-Type-Options',
      present: !!xcto,
      value: xcto,
      valid: false,
      score: 0,
      issues: [],
      recommendations: []
    };

    if (!xcto) {
      validation.issues.push('X-Content-Type-Options header missing');
      validation.recommendations.push('Add: X-Content-Type-Options: nosniff');
      return validation;
    }

    if (xcto.toLowerCase() === 'nosniff') {
      validation.valid = true;
      validation.score = 100;
    } else {
      validation.issues.push(`Invalid value: ${xcto} (should be 'nosniff')`);
      validation.score = 0;
    }

    return validation;
  }

  /**
   * Validate Referrer-Policy
   */
  private validateReferrerPolicy(headers: Record<string, string>): SecurityHeaderValidation {
    const rp = headers['referrer-policy'];

    const validation: SecurityHeaderValidation = {
      header: 'Referrer-Policy',
      present: !!rp,
      value: rp,
      valid: false,
      score: 0,
      issues: [],
      recommendations: []
    };

    const validPolicies = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url'
    ];

    if (!rp) {
      validation.issues.push('Referrer-Policy header missing');
      validation.recommendations.push(
        'Add: Referrer-Policy: strict-origin-when-cross-origin (recommended)',
        'Or: Referrer-Policy: no-referrer (most secure)'
      );
      return validation;
    }

    if (validPolicies.includes(rp.toLowerCase())) {
      validation.valid = true;

      // Score based on security level
      if (rp === 'no-referrer' || rp === 'strict-origin') {
        validation.score = 100;
      } else if (rp === 'strict-origin-when-cross-origin' || rp === 'same-origin') {
        validation.score = 90;
      } else if (rp === 'origin') {
        validation.score = 70;
      } else {
        validation.score = 50;
      }

      if (rp === 'unsafe-url') {
        validation.recommendations.push(
          'unsafe-url leaks full URL in referrer - consider stricter policy'
        );
      }
    } else {
      validation.issues.push(`Invalid value: ${rp}`);
      validation.score = 0;
    }

    return validation;
  }

  /**
   * Validate Permissions-Policy (formerly Feature-Policy)
   */
  private validatePermissionsPolicy(headers: Record<string, string>): SecurityHeaderValidation {
    const pp = headers['permissions-policy'] || headers['feature-policy'];

    const validation: SecurityHeaderValidation = {
      header: 'Permissions-Policy',
      present: !!pp,
      value: pp,
      valid: true,
      score: 100,
      issues: [],
      recommendations: []
    };

    if (!pp) {
      validation.recommendations.push(
        'Consider adding Permissions-Policy to control browser features',
        "Example: Permissions-Policy: geolocation=(), microphone=(), camera=()"
      );
      validation.score = 80; // Not critical, but recommended
      return validation;
    }

    // Optional header, so presence gets full marks
    return validation;
  }

  /**
   * Quick security grade check (without full scan)
   */
  async quickGradeCheck(url: string): Promise<{ grade: string; score: number }> {
    try {
      const hostname = new URL(url).hostname;
      const response = await fetch(`${this.baseUrl}/analyze?host=${hostname}`);

      if (!response.ok) {
        throw new Error(`Failed to check grade: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        grade: data.grade || 'F',
        score: data.score || 0
      };
    } catch (error) {
      this.logger.warn('Quick grade check failed, performing full scan', {
        url,
        error: error.message
      }, 'observatory-scanner');

      // Fallback to full scan
      const result = await this.scanUrl(url);
      return { grade: result.grade, score: result.score };
    }
  }

  /**
   * Check if grade meets minimum threshold
   */
  meetsMinimumGrade(grade: string, minimum: string = 'A'): boolean {
    const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
    const gradeIndex = gradeOrder.indexOf(grade);
    const minIndex = gradeOrder.indexOf(minimum);

    if (gradeIndex === -1 || minIndex === -1) {
      return false;
    }

    return gradeIndex <= minIndex;
  }
}

// Export singleton instance
export const observatoryScanner = new ObservatoryScanner();
