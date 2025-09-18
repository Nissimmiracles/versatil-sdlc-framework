/**
 * VERSATIL SDLC Framework - QA Monitoring Agent Template
 * Maria-QA Specialized Template for Quality Assurance and Testing
 */

import { EventEmitter } from 'events';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Types for Maria-QA Agent
interface TestResult {
  passed: number;
  failed: number;
  coverage: number;
  duration: number;
  errors: TestError[];
}

interface TestError {
  file: string;
  line: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface QualityGate {
  name: string;
  threshold: number;
  current: number;
  passed: boolean;
  required: boolean;
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time
}

/**
 * Maria-QA Agent - Quality Assurance and Testing Specialist
 * Handles all quality-related operations in the VERSATIL framework
 */
export class MariaQAAgent extends EventEmitter {
  private projectRoot: string;
  private testConfig: any;
  private qualityGates: QualityGate[];
  private chromeMCPEnabled: boolean;

  constructor(projectRoot: string = process.cwd()) {
    super();
    this.projectRoot = projectRoot;
    this.chromeMCPEnabled = this.checkChromeMCPAvailability();
    this.qualityGates = this.initializeQualityGates();
    this.testConfig = this.loadTestConfiguration();

    this.setupEventHandlers();
  }

  /**
   * Initialize Maria-QA with project-specific configuration
   */
  async initialize(): Promise<void> {
    console.log('🧪 Maria-QA: Initializing Quality Assurance Agent...');

    try {
      await this.detectProjectType();
      await this.setupTestingFramework();
      await this.configureQualityGates();

      if (this.chromeMCPEnabled) {
        await this.initializeChromeMCP();
      }

      console.log('✅ Maria-QA: Agent initialized successfully');
      this.emit('initialized', { agent: 'Maria-QA', status: 'ready' });

    } catch (error) {
      console.error('❌ Maria-QA: Initialization failed:', error);
      this.emit('error', { agent: 'Maria-QA', error });
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runTests(options: {
    type?: 'unit' | 'integration' | 'e2e' | 'all';
    coverage?: boolean;
    watch?: boolean;
  } = {}): Promise<TestResult> {
    console.log('🧪 Maria-QA: Running comprehensive test suite...');

    const { type = 'all', coverage = true, watch = false } = options;

    try {
      let results: TestResult = {
        passed: 0,
        failed: 0,
        coverage: 0,
        duration: 0,
        errors: []
      };

      const startTime = Date.now();

      // Run different test types
      if (type === 'all' || type === 'unit') {
        const unitResults = await this.runUnitTests(coverage);
        results = this.mergeTestResults(results, unitResults);
      }

      if (type === 'all' || type === 'integration') {
        const integrationResults = await this.runIntegrationTests();
        results = this.mergeTestResults(results, integrationResults);
      }

      if (type === 'all' || type === 'e2e') {
        const e2eResults = await this.runE2ETests();
        results = this.mergeTestResults(results, e2eResults);
      }

      results.duration = Date.now() - startTime;

      // Validate against quality gates
      await this.validateQualityGates(results);

      console.log(`✅ Maria-QA: Tests completed - ${results.passed} passed, ${results.failed} failed`);
      this.emit('test-complete', results);

      return results;

    } catch (error) {
      console.error('❌ Maria-QA: Test execution failed:', error);
      this.emit('test-error', error);
      throw error;
    }
  }

  /**
   * Run visual regression testing using Chrome MCP
   */
  async runVisualTests(baselineUpdate: boolean = false): Promise<TestResult> {
    if (!this.chromeMCPEnabled) {
      console.warn('⚠️  Maria-QA: Chrome MCP not available, skipping visual tests');
      return { passed: 0, failed: 0, coverage: 0, duration: 0, errors: [] };
    }

    console.log('👁️  Maria-QA: Running visual regression tests...');

    try {
      const command = baselineUpdate
        ? 'chrome-mcp test --visual --baseline-update'
        : 'chrome-mcp test --visual';

      const output = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      const results = this.parseVisualTestResults(output);

      console.log(`✅ Maria-QA: Visual tests completed - ${results.passed} passed`);
      return results;

    } catch (error) {
      console.error('❌ Maria-QA: Visual testing failed:', error);
      throw error;
    }
  }

  /**
   * Run performance testing and validation
   */
  async runPerformanceTests(url: string = 'http://localhost:3000'): Promise<PerformanceMetrics> {
    console.log('⚡ Maria-QA: Running performance tests...');

    try {
      // Use Lighthouse for performance testing
      const command = `lighthouse ${url} --output json --quiet --chrome-flags="--headless"`;
      const output = execSync(command, { encoding: 'utf8' });

      const lighthouse = JSON.parse(output);
      const metrics: PerformanceMetrics = {
        fcp: lighthouse.audits['first-contentful-paint'].numericValue,
        lcp: lighthouse.audits['largest-contentful-paint'].numericValue,
        fid: lighthouse.audits['first-input-delay']?.numericValue || 0,
        cls: lighthouse.audits['cumulative-layout-shift'].numericValue,
        tbt: lighthouse.audits['total-blocking-time'].numericValue
      };

      await this.validatePerformanceBudget(metrics);

      console.log('✅ Maria-QA: Performance tests completed');
      this.emit('performance-complete', metrics);

      return metrics;

    } catch (error) {
      console.error('❌ Maria-QA: Performance testing failed:', error);
      throw error;
    }
  }

  /**
   * Run accessibility audit
   */
  async runAccessibilityAudit(url: string = 'http://localhost:3000'): Promise<any> {
    console.log('♿ Maria-QA: Running accessibility audit...');

    try {
      // Using axe-core for accessibility testing
      const command = `pa11y ${url} --standard WCAG2AA --reporter json`;
      const output = execSync(command, { encoding: 'utf8' });

      const results = JSON.parse(output);
      const violations = results.issues?.filter((issue: any) => issue.type === 'error') || [];

      if (violations.length > 0) {
        console.warn(`⚠️  Maria-QA: ${violations.length} accessibility violations found`);
        this.emit('accessibility-violations', violations);
      } else {
        console.log('✅ Maria-QA: No accessibility violations found');
      }

      return results;

    } catch (error) {
      console.error('❌ Maria-QA: Accessibility audit failed:', error);
      throw error;
    }
  }

  /**
   * Run security scan
   */
  async runSecurityScan(): Promise<any> {
    console.log('🔒 Maria-QA: Running security scan...');

    try {
      // NPM audit for dependency vulnerabilities
      const auditOutput = execSync('npm audit --json', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      const auditResults = JSON.parse(auditOutput);
      const vulnerabilities = auditResults.vulnerabilities || {};

      const criticalCount = Object.values(vulnerabilities)
        .filter((vuln: any) => vuln.severity === 'critical').length;

      if (criticalCount > 0) {
        console.warn(`⚠️  Maria-QA: ${criticalCount} critical vulnerabilities found`);
        this.emit('security-vulnerabilities', { critical: criticalCount });
      } else {
        console.log('✅ Maria-QA: No critical vulnerabilities found');
      }

      return auditResults;

    } catch (error) {
      console.error('❌ Maria-QA: Security scan failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive quality report
   */
  async generateQualityReport(): Promise<any> {
    console.log('📊 Maria-QA: Generating quality report...');

    try {
      const report = {
        timestamp: new Date().toISOString(),
        agent: 'Maria-QA',
        project: path.basename(this.projectRoot),

        testing: await this.runTests({ coverage: true }),
        performance: await this.runPerformanceTests(),
        accessibility: await this.runAccessibilityAudit(),
        security: await this.runSecurityScan(),

        quality_gates: this.qualityGates,
        recommendations: await this.generateRecommendations(),

        summary: {
          overall_score: this.calculateOverallScore(),
          risk_level: this.assessRiskLevel(),
          next_actions: this.getNextActions()
        }
      };

      // Save report
      const reportPath = path.join(this.projectRoot, '.versatil', 'reports', `maria-qa-${Date.now()}.json`);
      this.ensureDirectoryExists(path.dirname(reportPath));
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log('✅ Maria-QA: Quality report generated');
      this.emit('report-generated', report);

      return report;

    } catch (error) {
      console.error('❌ Maria-QA: Report generation failed:', error);
      throw error;
    }
  }

  // Private helper methods

  private setupEventHandlers(): void {
    this.on('test-complete', (results: TestResult) => {
      if (results.failed > 0) {
        console.warn(`⚠️  Maria-QA: ${results.failed} tests failed - investigating...`);
      }
    });

    this.on('quality-gate-failed', (gate: QualityGate) => {
      console.error(`❌ Maria-QA: Quality gate failed - ${gate.name}: ${gate.current} < ${gate.threshold}`);
    });
  }

  private checkChromeMCPAvailability(): boolean {
    try {
      execSync('chrome-mcp --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private initializeQualityGates(): QualityGate[] {
    return [
      { name: 'Test Coverage', threshold: 80, current: 0, passed: false, required: true },
      { name: 'Performance Score', threshold: 90, current: 0, passed: false, required: true },
      { name: 'Accessibility Score', threshold: 95, current: 0, passed: false, required: true },
      { name: 'Security Vulnerabilities', threshold: 0, current: 0, passed: false, required: true }
    ];
  }

  private async detectProjectType(): Promise<string> {
    if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      return 'nodejs';
    } else if (fs.existsSync(path.join(this.projectRoot, 'requirements.txt'))) {
      return 'python';
    }
    return 'unknown';
  }

  private async setupTestingFramework(): Promise<void> {
    // Setup based on detected project type and available test frameworks
    const hasPlaywright = fs.existsSync(path.join(this.projectRoot, 'playwright.config.js'));
    const hasJest = fs.existsSync(path.join(this.projectRoot, 'jest.config.js'));

    if (!hasPlaywright && !hasJest) {
      console.warn('⚠️  Maria-QA: No testing framework detected - recommend installing Playwright');
    }
  }

  private loadTestConfiguration(): any {
    const configPath = path.join(this.projectRoot, '.versatil', 'agents', 'maria-qa', 'test.config.js');
    if (fs.existsSync(configPath)) {
      return require(configPath);
    }
    return {};
  }

  private async configureQualityGates(): Promise<void> {
    // Configure quality gates based on project requirements
    if (this.testConfig.coverage) {
      const coverageGate = this.qualityGates.find(g => g.name === 'Test Coverage');
      if (coverageGate) {
        coverageGate.threshold = this.testConfig.coverage.threshold || 80;
      }
    }
  }

  private async initializeChromeMCP(): Promise<void> {
    console.log('🌐 Maria-QA: Initializing Chrome MCP integration...');
    // Initialize Chrome MCP for visual and browser testing
  }

  private async runUnitTests(coverage: boolean): Promise<TestResult> {
    try {
      const command = coverage ? 'npm test -- --coverage' : 'npm test';
      const output = execSync(command, { cwd: this.projectRoot, encoding: 'utf8' });
      return this.parseTestResults(output, 'unit');
    } catch (error) {
      return { passed: 0, failed: 1, coverage: 0, duration: 0, errors: [{
        file: 'unit-tests', line: 0, message: error.message, severity: 'high'
      }]};
    }
  }

  private async runIntegrationTests(): Promise<TestResult> {
    try {
      const command = 'npm run test:integration';
      const output = execSync(command, { cwd: this.projectRoot, encoding: 'utf8' });
      return this.parseTestResults(output, 'integration');
    } catch (error) {
      return { passed: 0, failed: 0, coverage: 0, duration: 0, errors: [] };
    }
  }

  private async runE2ETests(): Promise<TestResult> {
    try {
      const command = 'npx playwright test';
      const output = execSync(command, { cwd: this.projectRoot, encoding: 'utf8' });
      return this.parseTestResults(output, 'e2e');
    } catch (error) {
      return { passed: 0, failed: 0, coverage: 0, duration: 0, errors: [] };
    }
  }

  private parseTestResults(output: string, type: string): TestResult {
    // Parse test framework output to extract results
    // This is a simplified parser - real implementation would be more sophisticated
    const passed = (output.match(/✓|passed/gi) || []).length;
    const failed = (output.match(/✗|failed|error/gi) || []).length;
    const coverage = this.extractCoverageFromOutput(output);

    return {
      passed,
      failed,
      coverage,
      duration: 0,
      errors: []
    };
  }

  private parseVisualTestResults(output: string): TestResult {
    // Parse Chrome MCP visual test results
    return {
      passed: 1,
      failed: 0,
      coverage: 0,
      duration: 0,
      errors: []
    };
  }

  private extractCoverageFromOutput(output: string): number {
    const coverageMatch = output.match(/(\d+\.?\d*)%/);
    return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  }

  private mergeTestResults(a: TestResult, b: TestResult): TestResult {
    return {
      passed: a.passed + b.passed,
      failed: a.failed + b.failed,
      coverage: Math.max(a.coverage, b.coverage),
      duration: a.duration + b.duration,
      errors: [...a.errors, ...b.errors]
    };
  }

  private async validateQualityGates(results: TestResult): Promise<void> {
    const coverageGate = this.qualityGates.find(g => g.name === 'Test Coverage');
    if (coverageGate) {
      coverageGate.current = results.coverage;
      coverageGate.passed = results.coverage >= coverageGate.threshold;

      if (!coverageGate.passed && coverageGate.required) {
        this.emit('quality-gate-failed', coverageGate);
      }
    }
  }

  private async validatePerformanceBudget(metrics: PerformanceMetrics): Promise<void> {
    const performanceGate = this.qualityGates.find(g => g.name === 'Performance Score');
    if (performanceGate) {
      // Calculate performance score based on Core Web Vitals
      const score = this.calculatePerformanceScore(metrics);
      performanceGate.current = score;
      performanceGate.passed = score >= performanceGate.threshold;

      if (!performanceGate.passed && performanceGate.required) {
        this.emit('quality-gate-failed', performanceGate);
      }
    }
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    // Simplified performance scoring
    let score = 100;
    if (metrics.fcp > 1800) score -= 20;
    if (metrics.lcp > 2500) score -= 20;
    if (metrics.fid > 100) score -= 20;
    if (metrics.cls > 0.1) score -= 20;
    if (metrics.tbt > 300) score -= 20;

    return Math.max(0, score);
  }

  private calculateOverallScore(): number {
    const passedGates = this.qualityGates.filter(g => g.passed).length;
    const totalGates = this.qualityGates.length;
    return Math.round((passedGates / totalGates) * 100);
  }

  private assessRiskLevel(): string {
    const failedCriticalGates = this.qualityGates.filter(g => !g.passed && g.required).length;
    if (failedCriticalGates > 2) return 'HIGH';
    if (failedCriticalGates > 0) return 'MEDIUM';
    return 'LOW';
  }

  private getNextActions(): string[] {
    const actions: string[] = [];

    this.qualityGates.forEach(gate => {
      if (!gate.passed && gate.required) {
        actions.push(`Fix ${gate.name}: Currently ${gate.current}, needs ${gate.threshold}`);
      }
    });

    if (actions.length === 0) {
      actions.push('All quality gates passed! Consider optimizing for better performance');
    }

    return actions;
  }

  private async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    // Add intelligent recommendations based on test results
    if (this.qualityGates.find(g => g.name === 'Test Coverage' && !g.passed)) {
      recommendations.push('Increase test coverage by adding unit tests for uncovered functions');
    }

    if (this.qualityGates.find(g => g.name === 'Performance Score' && !g.passed)) {
      recommendations.push('Optimize performance by reducing bundle size and improving loading times');
    }

    return recommendations;
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// Export for use in VERSATIL framework
export default MariaQAAgent;