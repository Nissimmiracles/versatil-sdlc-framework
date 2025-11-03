#!/usr/bin/env node

/**
 * Telemetry Analytics Report Generator (v7.5.0)
 *
 * Generates comprehensive analytics reports from telemetry data
 *
 * Usage:
 *   pnpm run telemetry:report           # Console output
 *   pnpm run telemetry:report --json    # JSON output
 *   pnpm run telemetry:report --md      # Markdown file (docs/TELEMETRY_INSIGHTS.md)
 */

const { getMetricsService } = require('../dist/telemetry/automation-metrics.js');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const outputFormat = args.find(arg => arg.startsWith('--'))?.replace('--', '') || 'console';

const workingDir = process.cwd();
const metricsService = getMetricsService(workingDir);

try {
  // Generate analytics report
  const report = metricsService.generateAnalyticsReport();

  switch (outputFormat) {
    case 'json': {
      // JSON output
      const hookPerf = metricsService.getHookPerformance();
      const agentStats = metricsService.getAgentActivationStats();
      const topPatterns = metricsService.getTopPatterns(10);
      const crossSkill = metricsService.getCrossSkillPatterns();

      const jsonOutput = {
        timestamp: new Date().toISOString(),
        hookPerformance: hookPerf,
        agentActivation: agentStats,
        topPatterns,
        crossSkillLoading: crossSkill
      };

      console.log(JSON.stringify(jsonOutput, null, 2));
      break;
    }

    case 'md': {
      // Markdown file output
      const outputPath = path.join(workingDir, 'docs', 'TELEMETRY_INSIGHTS.md');

      // Ensure docs directory exists
      const docsDir = path.join(workingDir, 'docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, report, 'utf-8');
      console.log(`\n✅ Telemetry report saved to: ${outputPath}\n`);
      break;
    }

    case 'console':
    default: {
      // Console output (pretty print)
      console.log('\n' + report + '\n');
      break;
    }
  }

  // Summary
  const hookPerf = metricsService.getHookPerformance();
  const agentStats = metricsService.getAgentActivationStats();

  if (outputFormat !== 'json') {
    console.log('---');
    console.log(`📊 Summary: ${hookPerf.totalExecutions} hook executions, ${agentStats.totalActivations} agent activations`);
    console.log(`⚡ Avg Hook Performance: ${hookPerf.avgTime.toFixed(2)}ms (P95: ${hookPerf.p95.toFixed(2)}ms)`);
    console.log(`🤖 Agent Activation Rate: ${(agentStats.activationRate * 100).toFixed(1)}%`);
    console.log('');
  }

} catch (error) {
  console.error('❌ Error generating telemetry report:', error.message);

  // Check if metrics file exists
  const metricsPath = path.join(workingDir, '.versatil', 'telemetry', 'metrics.json');
  if (!fs.existsSync(metricsPath)) {
    console.error('\nNo telemetry data found at:', metricsPath);
    console.error('Telemetry data is collected automatically during framework usage.');
    console.error('Use the framework for a while, then run this command again.\n');
  }

  process.exit(1);
}
