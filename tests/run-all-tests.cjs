#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Enhanced Test Runner
 * Comprehensive test orchestration with advanced reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Chalk compatibility handling
const chalkModule = require('chalk');
const chalk = chalkModule.default || chalkModule;

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
║               VERSATIL Enhanced Test Runner                  ║
║            Complete Framework Test Orchestration            ║
╚══════════════════════════════════════════════════════════════╝
`);

class EnhancedTestRunner {
  constructor(options = {}) {
    this.options = {
      parallel: options.parallel || false,
      verbose: options.verbose || false,
      generateReport: options.generateReport !== false,
      skipOptional: options.skipOptional || false,
      ...options
    };

    this.results = {
      startTime: Date.now(),
      phases: new Map(),
      totalExecutionTime: 0,
      systemInfo: this.getSystemInfo()
    };
  }

  getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memoryTotal: Math.round(require('os').totalmem() / 1024 / 1024) + 'MB',
      cpuCount: require('os').cpus().length
    };
  }

  async executeCommand(command, name, options = {}) {
    const startTime = Date.now();
    const timeout = options.timeout || 60000;

    try {
      console.log(`${colors.cyan('⏳')} Executing: ${colors.bold(name)}`);

      const output = execSync(command, {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        cwd: process.cwd(),
        timeout,
        encoding: 'utf8'
      });

      const duration = Date.now() - startTime;
      const success = true;

      this.results.phases.set(name, {
        command,
        duration,
        success,
        output: this.options.verbose ? null : output,
        startTime,
        endTime: Date.now()
      });

      console.log(`${colors.green('✅')} ${name} ${colors.gray(`(${(duration / 1000).toFixed(2)}s)`)}`);
      return { success, output, duration };

    } catch (error) {
      const duration = Date.now() - startTime;
      const success = false;

      this.results.phases.set(name, {
        command,
        duration,
        success,
        error: error.message,
        output: error.output ? error.output.toString() : null,
        startTime,
        endTime: Date.now()
      });

      console.log(`${colors.red('❌')} ${name} ${colors.gray(`(${(duration / 1000).toFixed(2)}s)`)}`);

      if (this.options.verbose) {
        console.log(colors.red(`   Error: ${error.message}`));
        if (error.output) {
          console.log(colors.gray(`   Output: ${error.output.toString().slice(0, 200)}...`));
        }
      }

      return { success, error, duration };
    }
  }

  async runSequentialTests() {
    console.log(colors.blue('🔄 Running tests sequentially...\n'));

    const testPhases = [
      {
        name: 'Script Validation (Phase 1)',
        command: 'npm run validate:scripts',
        required: true
      },
      {
        name: 'Enhanced Maria Integration (Phase 2)',
        command: 'npm run test:phase2',
        required: true
      },
      {
        name: 'End-to-End Integration (Phase 3)',
        command: 'npm run test:phase3',
        required: true
      },
      {
        name: 'Jest Unit Tests',
        command: 'npm run test:unit',
        required: false,
        condition: () => this.hasJestConfig()
      },
      {
        name: 'Jest Integration Tests',
        command: 'npm run test:integration',
        required: false,
        condition: () => this.hasJestConfig()
      },
      {
        name: 'Demo Scenarios',
        command: 'node tests/run-all-tests.js',
        required: false,
        condition: () => fs.existsSync('tests/run-all-tests.js')
      },
      {
        name: 'TypeScript Build',
        command: 'npm run build',
        required: true
      }
    ];

    let allPassed = true;
    let requiredFailed = false;

    for (const phase of testPhases) {
      // Check if phase should be skipped
      if (!phase.required && this.options.skipOptional) {
        console.log(`${colors.yellow('⏭️')} Skipping optional: ${phase.name}`);
        continue;
      }

      // Check conditions
      if (phase.condition && !phase.condition()) {
        console.log(`${colors.gray('⏭️')} Skipping unavailable: ${phase.name}`);
        continue;
      }

      const result = await this.executeCommand(phase.command, phase.name, {
        timeout: phase.timeout || 60000
      });

      if (!result.success) {
        allPassed = false;
        if (phase.required) {
          requiredFailed = true;
        }
      }

      // Add small delay between tests for stability
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { allPassed, requiredFailed };
  }

  hasJestConfig() {
    return fs.existsSync('jest.config.cjs') || fs.existsSync('jest.config.js');
  }

  generateReport() {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`${colors.bold('📊 ENHANCED TEST RUNNER REPORT')}\n`);

    const totalDuration = Date.now() - this.results.startTime;
    const successfulPhases = Array.from(this.results.phases.values()).filter(p => p.success).length;
    const totalPhases = this.results.phases.size;

    console.log(`   Total Phases:     ${colors.bold(successfulPhases)}/${colors.bold(totalPhases)} passed`);
    console.log(`   Success Rate:     ${colors.bold(((successfulPhases / totalPhases) * 100).toFixed(1) + '%')}`);
    console.log(`   Total Duration:   ${colors.bold((totalDuration / 1000).toFixed(2) + 's')}`);
    console.log(`   System:           ${this.results.systemInfo.platform} ${this.results.systemInfo.architecture}`);
    console.log(`   Node Version:     ${this.results.systemInfo.nodeVersion}`);

    console.log(`\n${colors.bold('📋 Phase Details:')}`);
    for (const [name, result] of this.results.phases.entries()) {
      const status = result.success ? colors.green('✅') : colors.red('❌');
      const duration = `${(result.duration / 1000).toFixed(2)}s`.padEnd(6);
      const nameFormatted = name.padEnd(35);

      console.log(`   ${status} ${nameFormatted} ${colors.gray(duration)}`);

      if (!result.success && result.error) {
        console.log(`      ${colors.red('Error:')} ${result.error.split('\n')[0]}`);
      }
    }

    if (this.options.generateReport) {
      this.saveDetailedReport();
    }

    const allPassed = Array.from(this.results.phases.values()).every(p => p.success);
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (allPassed) {
      console.log(colors.green(`✅ ALL TESTS PASSED - FRAMEWORK VALIDATED! 🎉\n`));
    } else {
      console.log(colors.red(`❌ SOME TESTS FAILED - REVIEW REQUIRED\n`));
    }

    return allPassed;
  }

  saveDetailedReport() {
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        framework: 'VERSATIL SDLC Framework',
        version: '1.2.1',
        runner: 'Enhanced Test Runner',
        systemInfo: this.results.systemInfo,
        summary: {
          totalPhases: this.results.phases.size,
          successfulPhases: Array.from(this.results.phases.values()).filter(p => p.success).length,
          totalDuration: Date.now() - this.results.startTime,
          successRate: (Array.from(this.results.phases.values()).filter(p => p.success).length / this.results.phases.size) * 100
        },
        phases: Object.fromEntries(this.results.phases.entries())
      };

      // Save JSON report
      const jsonPath = path.join(process.cwd(), 'enhanced-test-report.json');
      fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

      // Save markdown summary
      const mdPath = path.join(process.cwd(), 'TEST-REPORT.md');
      const markdownReport = this.generateMarkdownReport(reportData);
      fs.writeFileSync(mdPath, markdownReport);

      console.log(colors.gray(`📄 Detailed reports saved:`));
      console.log(colors.gray(`   JSON: ${jsonPath}`));
      console.log(colors.gray(`   Markdown: ${mdPath}`));

    } catch (error) {
      console.warn(colors.yellow(`⚠️  Could not save detailed report: ${error.message}`));
    }
  }

  generateMarkdownReport(data) {
    const date = new Date(data.timestamp).toLocaleString();
    const duration = (data.summary.totalDuration / 1000).toFixed(2);

    return `# VERSATIL Framework Test Report

**Generated:** ${date}
**Framework:** ${data.framework} v${data.version}
**Test Runner:** ${data.runner}

## Summary

- **Total Phases:** ${data.summary.successfulPhases}/${data.summary.totalPhases} passed
- **Success Rate:** ${data.summary.successRate.toFixed(1)}%
- **Total Duration:** ${duration}s
- **System:** ${data.systemInfo.platform} ${data.systemInfo.architecture}
- **Node Version:** ${data.systemInfo.nodeVersion}

## Phase Results

| Phase | Status | Duration | Details |
|-------|--------|----------|---------|
${Object.entries(data.phases).map(([name, result]) => {
  const status = result.success ? '✅ Pass' : '❌ Fail';
  const duration = `${(result.duration / 1000).toFixed(2)}s`;
  const details = result.success ? '-' : result.error?.split('\n')[0] || 'Unknown error';
  return `| ${name} | ${status} | ${duration} | ${details} |`;
}).join('\n')}

---

*Report generated by VERSATIL Enhanced Test Runner*
`;
  }

  async run() {
    console.log(colors.blue(`🚀 Starting enhanced test execution...\n`));
    console.log(colors.gray(`   Platform: ${this.results.systemInfo.platform}`));
    console.log(colors.gray(`   Node: ${this.results.systemInfo.nodeVersion}`));
    console.log(colors.gray(`   Memory: ${this.results.systemInfo.memoryTotal}\n`));

    try {
      const { allPassed, requiredFailed } = await this.runSequentialTests();

      const success = this.generateReport();

      // Exit with appropriate code
      process.exit(requiredFailed ? 1 : 0);

    } catch (error) {
      console.error(colors.red(`\n💥 Test runner error: ${error.message}`));
      process.exit(1);
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  skipOptional: args.includes('--skip-optional'),
  generateReport: !args.includes('--no-report')
};

// Handle both direct execution and module import
if (require.main === module) {
  const runner = new EnhancedTestRunner(options);
  runner.run();
}

module.exports = { EnhancedTestRunner };