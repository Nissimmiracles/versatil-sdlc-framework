#!/usr/bin/env node
/**
 * Agent Auto-Activation Validation Script
 *
 * Validates agent activation accuracy and latency across all 18 agents.
 * Displays interactive dashboard with metrics and recommendations.
 *
 * Usage:
 *   node scripts/validate-activation.cjs [--run-tests] [--json] [--csv]
 *
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const AGENTS = {
  core: [
    'maria-qa',
    'dana-database',
    'marcus-backend',
    'james-frontend',
    'alex-ba',
    'sarah-pm',
    'dr-ai-ml',
    'oliver-mcp'
  ],
  subAgents: {
    backend: ['marcus-node', 'marcus-python', 'marcus-rails', 'marcus-go', 'marcus-java'],
    frontend: ['james-react', 'james-vue', 'james-nextjs', 'james-angular', 'james-svelte']
  }
};

class ActivationValidator {
  constructor(options = {}) {
    this.options = options;
    this.metricsDir = path.join(os.homedir(), '.versatil', 'metrics', 'activation');
    this.eventsFile = path.join(this.metricsDir, 'activation-events.json');
    this.events = [];
    this.metrics = new Map();
  }

  /**
   * Run activation validation
   */
  async run() {
    console.log(`${COLORS.bright}${COLORS.cyan}╔════════════════════════════════════════════════════════════╗${COLORS.reset}`);
    console.log(`${COLORS.bright}${COLORS.cyan}║     VERSATIL Agent Auto-Activation Validator v1.0.0       ║${COLORS.reset}`);
    console.log(`${COLORS.bright}${COLORS.cyan}╚════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);

    // Step 1: Run tests if requested
    if (this.options.runTests) {
      console.log(`${COLORS.bright}Running activation tests...${COLORS.reset}\n`);
      await this.runTests();
    }

    // Step 2: Load activation events
    console.log(`${COLORS.bright}Loading activation events...${COLORS.reset}`);
    await this.loadEvents();

    if (this.events.length === 0) {
      console.log(`${COLORS.yellow}No activation events found. Run tests first with --run-tests${COLORS.reset}\n`);
      process.exit(0);
    }

    console.log(`${COLORS.green}✓ Loaded ${this.events.length} activation events${COLORS.reset}\n`);

    // Step 3: Calculate metrics
    console.log(`${COLORS.bright}Calculating metrics...${COLORS.reset}`);
    this.calculateMetrics();
    console.log(`${COLORS.green}✓ Metrics calculated for ${this.metrics.size} agents${COLORS.reset}\n`);

    // Step 4: Display dashboard
    this.displayDashboard();

    // Step 5: Export if requested
    if (this.options.json) {
      this.exportJSON();
    }

    if (this.options.csv) {
      this.exportCSV();
    }

    // Step 6: Exit with appropriate code
    const report = this.generateReport();
    process.exit(report.failedAgents.length > 0 || report.slowAgents.length > 0 ? 1 : 0);
  }

  /**
   * Run activation tests
   */
  async runTests() {
    try {
      execSync('npm run test -- tests/agents/auto-activation.test.ts', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });

      execSync('npm run test -- tests/agents/sub-agent-activation.test.ts', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });

      execSync('npm run test -- tests/integration/agent-auto-activation-e2e.test.ts', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } catch (error) {
      console.error(`${COLORS.red}✗ Test execution failed${COLORS.reset}`);
      process.exit(1);
    }
  }

  /**
   * Load activation events from storage
   */
  async loadEvents() {
    try {
      if (fs.existsSync(this.eventsFile)) {
        const content = fs.readFileSync(this.eventsFile, 'utf-8');
        this.events = JSON.parse(content);
      }
    } catch (error) {
      console.error(`${COLORS.red}✗ Failed to load events: ${error.message}${COLORS.reset}`);
    }
  }

  /**
   * Calculate metrics for each agent
   */
  calculateMetrics() {
    const agentIds = new Set(this.events.map(e => e.agentId));

    for (const agentId of agentIds) {
      const agentEvents = this.events.filter(e => e.agentId === agentId);

      const correct = agentEvents.filter(e => e.accuracy === 'correct').length;
      const incorrect = agentEvents.filter(e => e.accuracy === 'incorrect').length;
      const falsePositives = agentEvents.filter(e => e.accuracy === 'false_positive').length;
      const falseNegatives = agentEvents.filter(e => e.accuracy === 'false_negative').length;

      const latencies = agentEvents.map(e => e.latency).sort((a, b) => a - b);
      const p95Index = Math.floor(latencies.length * 0.95);

      this.metrics.set(agentId, {
        agentId,
        totalActivations: agentEvents.length,
        correctActivations: correct,
        incorrectActivations: incorrect,
        falsePositives,
        falseNegatives,
        accuracy: agentEvents.length > 0 ? (correct / agentEvents.length) * 100 : 0,
        averageLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length || 0,
        minLatency: latencies[0] || 0,
        maxLatency: latencies[latencies.length - 1] || 0,
        p95Latency: latencies[p95Index] || 0,
        lastActivation: agentEvents[agentEvents.length - 1]?.timestamp || null
      });
    }
  }

  /**
   * Display interactive dashboard
   */
  displayDashboard() {
    const report = this.generateReport();

    console.log(`${COLORS.bright}┌────────────────────────────────────────────────────────────┐${COLORS.reset}`);
    console.log(`${COLORS.bright}│                    VALIDATION SUMMARY                      │${COLORS.reset}`);
    console.log(`${COLORS.bright}└────────────────────────────────────────────────────────────┘${COLORS.reset}\n`);

    // Overall metrics
    this.printMetric('Overall Accuracy', `${report.overallAccuracy.toFixed(2)}%`, report.overallAccuracy >= 90 ? 'green' : 'yellow');
    this.printMetric('Overall Latency', `${report.overallLatency.toFixed(0)}ms`, report.overallLatency < 2000 ? 'green' : 'yellow');
    this.printMetric('Total Activations', report.totalActivations.toString(), 'blue');

    console.log();

    // Core OPERA Agents
    console.log(`${COLORS.bright}${COLORS.blue}Core OPERA Agents (8):${COLORS.reset}\n`);

    AGENTS.core.forEach(agentId => {
      const metrics = this.metrics.get(agentId);
      if (metrics) {
        this.printAgentRow(metrics);
      } else {
        console.log(`  ${agentId.padEnd(20)} ${COLORS.gray}No data${COLORS.reset}`);
      }
    });

    console.log();

    // Backend Sub-Agents
    console.log(`${COLORS.bright}${COLORS.blue}Backend Sub-Agents (5):${COLORS.reset}\n`);

    AGENTS.subAgents.backend.forEach(agentId => {
      const metrics = this.metrics.get(agentId);
      if (metrics) {
        this.printAgentRow(metrics);
      } else {
        console.log(`  ${agentId.padEnd(20)} ${COLORS.gray}No data${COLORS.reset}`);
      }
    });

    console.log();

    // Frontend Sub-Agents
    console.log(`${COLORS.bright}${COLORS.blue}Frontend Sub-Agents (5):${COLORS.reset}\n`);

    AGENTS.subAgents.frontend.forEach(agentId => {
      const metrics = this.metrics.get(agentId);
      if (metrics) {
        this.printAgentRow(metrics);
      } else {
        console.log(`  ${agentId.padEnd(20)} ${COLORS.gray}No data${COLORS.reset}`);
      }
    });

    console.log();

    // Issues
    if (report.failedAgents.length > 0) {
      console.log(`${COLORS.bright}${COLORS.red}❌ Failed Agents (<90% accuracy):${COLORS.reset}`);
      report.failedAgents.forEach(agentId => {
        const metrics = this.metrics.get(agentId);
        console.log(`   - ${agentId}: ${metrics?.accuracy.toFixed(2)}%`);
      });
      console.log();
    }

    if (report.slowAgents.length > 0) {
      console.log(`${COLORS.bright}${COLORS.yellow}⚠️  Slow Agents (>2s latency):${COLORS.reset}`);
      report.slowAgents.forEach(agentId => {
        const metrics = this.metrics.get(agentId);
        console.log(`   - ${agentId}: ${metrics?.averageLatency.toFixed(0)}ms`);
      });
      console.log();
    }

    // Recommendations
    if (report.failedAgents.length > 0 || report.slowAgents.length > 0) {
      console.log(`${COLORS.bright}💡 Recommendations:${COLORS.reset}`);

      if (report.failedAgents.length > 0) {
        console.log(`   1. Review trigger patterns for failed agents in agent-definitions.ts`);
        console.log(`   2. Add more specific file/code patterns to improve accuracy`);
        console.log(`   3. Check for conflicting trigger patterns between agents`);
      }

      if (report.slowAgents.length > 0) {
        console.log(`   4. Optimize agent initialization (use agent pool warm-up)`);
        console.log(`   5. Review RAG memory queries for slow agents`);
        console.log(`   6. Consider async activation for non-critical agents`);
      }

      console.log();
    }

    // Final status
    if (report.failedAgents.length === 0 && report.slowAgents.length === 0) {
      console.log(`${COLORS.green}${COLORS.bright}✓ All agents passing validation requirements!${COLORS.reset}\n`);
    } else {
      console.log(`${COLORS.red}${COLORS.bright}✗ Validation failed. Please fix the issues above.${COLORS.reset}\n`);
    }
  }

  /**
   * Print metric row
   */
  printMetric(label, value, color) {
    const colorCode = COLORS[color] || COLORS.reset;
    console.log(`  ${label.padEnd(20)} ${colorCode}${COLORS.bright}${value}${COLORS.reset}`);
  }

  /**
   * Print agent row
   */
  printAgentRow(metrics) {
    const accuracyColor = metrics.accuracy >= 90 ? COLORS.green : COLORS.yellow;
    const latencyColor = metrics.averageLatency < 2000 ? COLORS.green : COLORS.yellow;

    const status = metrics.accuracy >= 90 && metrics.averageLatency < 2000 ? '✓' : '⚠';
    const statusColor = status === '✓' ? COLORS.green : COLORS.yellow;

    console.log(
      `  ${statusColor}${status}${COLORS.reset} ` +
      `${metrics.agentId.padEnd(18)} ` +
      `${accuracyColor}${metrics.accuracy.toFixed(0)}%${COLORS.reset} ` +
      `${latencyColor}${metrics.averageLatency.toFixed(0)}ms${COLORS.reset} ` +
      `${COLORS.gray}(${metrics.totalActivations} activations)${COLORS.reset}`
    );
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const allMetrics = Array.from(this.metrics.values());

    const overallAccuracy = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.accuracy, 0) / allMetrics.length
      : 0;

    const overallLatency = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.averageLatency, 0) / allMetrics.length
      : 0;

    const totalActivations = allMetrics.reduce((sum, m) => sum + m.totalActivations, 0);

    const failedAgents = allMetrics.filter(m => m.accuracy < 90).map(m => m.agentId);
    const slowAgents = allMetrics.filter(m => m.averageLatency > 2000).map(m => m.agentId);

    return {
      timestamp: new Date(),
      overallAccuracy,
      overallLatency,
      totalActivations,
      agentMetrics: this.metrics,
      failedAgents,
      slowAgents
    };
  }

  /**
   * Export as JSON
   */
  exportJSON() {
    const report = this.generateReport();
    const outputPath = path.join(process.cwd(), 'activation-validation-report.json');

    const metricsObj = {};
    report.agentMetrics.forEach((value, key) => {
      metricsObj[key] = value;
    });

    fs.writeFileSync(
      outputPath,
      JSON.stringify({ ...report, agentMetrics: metricsObj }, null, 2)
    );

    console.log(`${COLORS.green}✓ JSON report exported to ${outputPath}${COLORS.reset}\n`);
  }

  /**
   * Export as CSV
   */
  exportCSV() {
    const headers = ['Agent ID', 'Accuracy %', 'Avg Latency (ms)', 'Total Activations', 'False Positives', 'False Negatives'];

    const rows = Array.from(this.metrics.values()).map(m => [
      m.agentId,
      m.accuracy.toFixed(2),
      m.averageLatency.toFixed(0),
      m.totalActivations,
      m.falsePositives,
      m.falseNegatives
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const outputPath = path.join(process.cwd(), 'activation-validation-report.csv');

    fs.writeFileSync(outputPath, csv);

    console.log(`${COLORS.green}✓ CSV report exported to ${outputPath}${COLORS.reset}\n`);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  runTests: args.includes('--run-tests'),
  json: args.includes('--json'),
  csv: args.includes('--csv')
};

// Run validator
const validator = new ActivationValidator(options);
validator.run().catch(error => {
  console.error(`${COLORS.red}✗ Validation failed: ${error.message}${COLORS.reset}`);
  process.exit(1);
});
