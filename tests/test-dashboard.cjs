#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Comprehensive Test Dashboard
 * Unified testing orchestration across all framework components
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Chalk compatibility handling (ES module wrapper)
const chalkModule = require('chalk');
const chalk = chalkModule.default || chalkModule;

// Create color wrapper functions
const colors = {
  blue: (text) => chalk.blue(text),
  green: (text) => chalk.green(text),
  red: (text) => chalk.red(text),
  yellow: (text) => chalk.yellow(text),
  cyan: (text) => chalk.cyan(text),
  magenta: (text) => chalk.magenta(text),
  gray: (text) => chalk.gray(text),
  bold: (text) => chalk.bold(text)
};

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 VERSATIL Test Dashboard                      ║
║              Comprehensive Framework Validation             ║
╚══════════════════════════════════════════════════════════════╝
`);

class TestDashboard {
  constructor() {
    this.results = {
      phases: [],
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalDuration: 0,
      startTime: Date.now(),
      memoryUsage: {
        start: process.memoryUsage(),
        peak: process.memoryUsage()
      }
    };
  }

  updateMemoryUsage() {
    const current = process.memoryUsage();
    if (current.rss > this.results.memoryUsage.peak.rss) {
      this.results.memoryUsage.peak = current;
    }
  }

  formatMemory(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  createProgressBar(current, total, width = 12) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((width * current) / total);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${current}/${total}`;
  }

  async runTestPhase(name, description, command, expectedTests = null) {
    const phaseStart = Date.now();
    process.stdout.write(`${colors.cyan('🔍')} ${name}: ${description} `);

    try {
      this.updateMemoryUsage();

      // Execute the test command
      const output = execSync(command, {
        stdio: 'pipe',
        cwd: process.cwd(),
        timeout: 120000 // 2 minute timeout for comprehensive tests
      }).toString();

      const duration = ((Date.now() - phaseStart) / 1000).toFixed(1);

      // Parse test results from output
      const testCounts = this.parseTestResults(output, name);
      const passed = testCounts.passed;
      const failed = testCounts.failed;
      const total = passed + failed;

      // Update progress bar
      const progressBar = this.createProgressBar(passed, total);
      const status = failed === 0 ? colors.green('✅') : colors.red('❌');
      const timing = colors.gray(`(${duration}s)`);

      console.log(`${progressBar} ${status} ${timing}`);

      // Store results
      this.results.phases.push({
        name,
        description,
        passed,
        failed,
        total,
        duration: parseFloat(duration),
        status: failed === 0 ? 'passed' : 'failed'
      });

      this.results.totalTests += total;
      this.results.totalPassed += passed;
      this.results.totalFailed += failed;
      this.results.totalDuration += parseFloat(duration);

      return failed === 0;

    } catch (error) {
      const duration = ((Date.now() - phaseStart) / 1000).toFixed(1);
      console.log(`${colors.red('[ERROR]')} ${colors.red('❌')} ${colors.gray(`(${duration}s)`)}`);

      // Store error results
      this.results.phases.push({
        name,
        description,
        passed: 0,
        failed: 1,
        total: 1,
        duration: parseFloat(duration),
        status: 'error',
        error: error.message
      });

      this.results.totalTests += 1;
      this.results.totalFailed += 1;
      this.results.totalDuration += parseFloat(duration);

      return false;
    }
  }

  parseTestResults(output, phaseName) {
    // Default parsing for different test output formats
    let passed = 0;
    let failed = 0;

    if (phaseName.includes('Phase 1')) {
      // Script validation format: "Success Rate: 100.0%"
      const successMatch = output.match(/Success Rate:\s+(\d+(?:\.\d+)?)%/);
      const testMatch = output.match(/Total Tests:\s+(\d+)/);
      if (successMatch && testMatch) {
        const total = parseInt(testMatch[1]);
        const successRate = parseFloat(successMatch[1]);
        passed = Math.round((total * successRate) / 100);
        failed = total - passed;
      }
    } else if (phaseName.includes('Phase 2') || phaseName.includes('Phase 3')) {
      // Phase runner format: "Test Suites: 4/4 passed"
      const suiteMatch = output.match(/Test Suites:\s+(\d+)\/(\d+)\s+passed/);
      if (suiteMatch) {
        passed = parseInt(suiteMatch[1]);
        const total = parseInt(suiteMatch[2]);
        failed = total - passed;
      }
    } else if (phaseName.includes('Jest')) {
      // Jest format: "Tests: 45 passed"
      const jestMatch = output.match(/Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?/);
      if (jestMatch) {
        passed = parseInt(jestMatch[1]);
        failed = jestMatch[2] ? parseInt(jestMatch[2]) : 0;
      }
    } else if (phaseName.includes('Demo')) {
      // Demo format: Look for test completion indicators
      const demoMatch = output.match(/(\d+)\s+(?:tests?|scenarios?)\s+(?:passed|completed)/i);
      if (demoMatch) {
        passed = parseInt(demoMatch[1]);
        failed = 0; // Demo tests typically don't report failures explicitly
      }
    }

    // Fallback: assume success if no errors and output exists
    if (passed === 0 && failed === 0 && output.length > 100) {
      passed = 1;
    }

    return { passed, failed };
  }

  async runJestTests() {
    try {
      // Check if Jest tests exist and are configured
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const hasJest = packageJson.devDependencies && packageJson.devDependencies.jest;

      if (hasJest && fs.existsSync('jest.config.cjs')) {
        // Check if test scripts are available in package.json
        if (packageJson.scripts['test:unit']) {
          await this.runTestPhase(
            'Jest Unit Tests',
            'TypeScript unit tests with coverage',
            'npm run test:unit',
            45
          );
        } else {
          console.log(`${colors.yellow('⚠️')} Jest unit tests script not found`);
        }

        if (packageJson.scripts['test:integration']) {
          await this.runTestPhase(
            'Jest Integration Tests',
            'Cross-component integration validation',
            'npm run test:integration',
            12
          );
        } else {
          console.log(`${colors.yellow('⚠️')} Jest integration tests script not found`);
        }
      } else {
        console.log(`${colors.yellow('⚠️')} Jest not configured - skipping unit/integration tests`);
      }
    } catch (error) {
      // Jest tests are optional - continue if not configured
      console.log(`${colors.yellow('⚠️')} Jest tests error: ${error.message}`);
    }
  }

  async runDemoTests() {
    try {
      // Check if demo tests exist
      if (fs.existsSync('tests/run-all-tests.js')) {
        await this.runTestPhase(
          'Demo Scenarios',
          'Real-world usage scenario validation',
          'node tests/run-all-tests.js',
          8
        );
      }
    } catch (error) {
      // Demo tests are optional
      console.log(`${colors.yellow('⚠️')} Demo tests not available`);
    }
  }

  generateSummary() {
    const totalDuration = ((Date.now() - this.results.startTime) / 1000).toFixed(1);
    const successRate = this.results.totalTests > 0
      ? ((this.results.totalPassed / this.results.totalTests) * 100).toFixed(1)
      : '0.0';

    const memoryUsed = this.formatMemory(this.results.memoryUsage.peak.rss);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`${colors.bold('📊 COMPREHENSIVE TEST SUMMARY')}\n`);
    console.log(`   Total Tests:      ${colors.bold(this.results.totalPassed)}/${colors.bold(this.results.totalTests)} passed`);
    console.log(`   Success Rate:     ${colors.bold(successRate + '%')}`);
    console.log(`   Total Duration:   ${colors.bold(totalDuration + 's')}`);
    console.log(`   Memory Peak:      ${colors.bold(memoryUsed)}`);

    // Show phase breakdown
    if (this.results.phases.length > 0) {
      console.log(`\n${colors.bold('📋 Phase Breakdown:')}`);
      for (const phase of this.results.phases) {
        const status = phase.status === 'passed' ? colors.green('✅') : colors.red('❌');
        const name = phase.name.padEnd(25);
        const results = `${phase.passed}/${phase.total}`.padEnd(8);
        const duration = `${phase.duration}s`.padEnd(6);
        console.log(`   ${status} ${name} ${results} ${colors.gray(duration)}`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (this.results.totalFailed === 0) {
      console.log(colors.green(`✅ ALL TESTS PASSED - PRODUCTION READY! 🚀\n`));
      return true;
    } else {
      console.log(colors.red(`❌ ${this.results.totalFailed} TEST(S) FAILED\n`));
      console.log(colors.yellow(`⚠️  Review failures before production deployment\n`));
      return false;
    }
  }

  async run() {
    console.log(colors.blue('🚀 Starting comprehensive framework validation...\n'));

    try {
      // Phase 1: Script Validation
      await this.runTestPhase(
        'Phase 1: Script Validation',
        'Dependencies and script execution',
        'npm run validate:scripts',
        17
      );

      // Phase 2: Enhanced Maria Integration
      await this.runTestPhase(
        'Phase 2: Enhanced Maria',
        'Pattern detection and QA integration',
        'npm run test:phase2',
        27
      );

      // Phase 3: End-to-End Integration
      await this.runTestPhase(
        'Phase 3: E2E Integration',
        'Complete system workflow validation',
        'npm run test:phase3',
        5
      );

      // Jest Unit & Integration Tests (if available)
      await this.runJestTests();

      // Demo Scenario Tests (if available)
      await this.runDemoTests();

      // Performance validation
      this.updateMemoryUsage();

      // Generate final summary
      const success = this.generateSummary();

      // Save results to JSON for CI/CD integration
      this.saveResults();

      // Generate visual HTML report
      await this.generateVisualReport();

      process.exit(success ? 0 : 1);

    } catch (error) {
      console.error(colors.red('\n💥 Dashboard execution error:'), error.message);
      process.exit(1);
    }
  }

  saveResults() {
    try {
      const resultsPath = path.join(process.cwd(), 'test-results.json');
      const jsonResults = {
        ...this.results,
        timestamp: new Date().toISOString(),
        framework: 'VERSATIL SDLC Framework',
        version: '1.2.1'
      };

      fs.writeFileSync(resultsPath, JSON.stringify(jsonResults, null, 2));
      console.log(colors.gray(`📄 Test results saved to: ${resultsPath}`));
    } catch (error) {
      console.warn(colors.yellow('⚠️  Could not save test results to JSON'));
    }
  }

  async generateVisualReport() {
    try {
      console.log(colors.cyan('\n🎨 Generating visual HTML report...'));

      const { VisualReportGenerator } = require('./generate-visual-report.cjs');
      const generator = new VisualReportGenerator({
        openBrowser: false // Don't auto-open in dashboard mode
      });

      const success = await generator.generate();
      if (success) {
        console.log(colors.green('✅ Visual HTML report generated: versatil-test-report.html'));
        console.log(colors.cyan('🌐 Open in browser: file://' + path.resolve('versatil-test-report.html')));
      }
    } catch (error) {
      console.warn(colors.yellow(`⚠️  Could not generate visual report: ${error.message}`));
    }
  }
}

// Handle both direct execution and module import
if (require.main === module) {
  const dashboard = new TestDashboard();
  dashboard.run();
}

module.exports = { TestDashboard };