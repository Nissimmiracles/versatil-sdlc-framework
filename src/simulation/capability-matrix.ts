#!/usr/bin/env node
/**
 * Capability Matrix CLI
 *
 * Quick command-line access to SimulationQA capability matrix
 * showing framework promises vs reality with brutal honesty.
 */

import { SimulationQA } from '../agents/simulation-qa.js';

async function showCapabilityMatrix() {
  console.log('📊 VERSATIL Framework Capability Matrix\n');

  try {
    const simulationQA = new SimulationQA();
    const matrix = await simulationQA.getCapabilityMatrix();

    if (!matrix) {
      console.log('⚠️  No validation data available. Run stress test first:');
      console.log('npm run simulation:stress-test\n');
      return;
    }

    console.log(`Framework: ${matrix.framework} v${matrix.version}`);
    console.log(`Analysis Date: ${new Date(matrix.timestamp).toLocaleString()}`);
    console.log(`Overall Score: ${matrix.overallScore}/100`);
    console.log(`GitHub Ready: ${matrix.readyForGitHub ? '✅ YES' : '❌ NO'}\n`);

    console.log('📋 Category Analysis:');
    console.log('========================');

    Object.entries(matrix.categories).forEach(([category, score]) => {
      const statusEmoji = {
        working: '✅',
        partial: '⚡',
        broken: '⚠️',
        vapor: '🌫️'
      }[score.status];

      console.log(`${statusEmoji} ${category}:`);
      console.log(`   Success Rate: ${score.percentage}% (${score.actual}/${score.promised})`);
      console.log(`   Status: ${score.status.toUpperCase()}`);
      if (score.evidence.length > 0) {
        console.log(`   Evidence: ${score.evidence.slice(0, 2).join(', ')}`);
      }
      console.log();
    });

    if (matrix.blockers.length > 0) {
      console.log('🚨 Critical Blockers:');
      matrix.blockers.forEach(blocker => console.log(`  - ${blocker}`));
      console.log();
    }

    if (matrix.recommendations.length > 0) {
      console.log('💡 Priority Recommendations:');
      matrix.recommendations.slice(0, 5).forEach(rec => console.log(`  - ${rec}`));
    }

  } catch (error) {
    console.error('❌ Capability Matrix Failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  showCapabilityMatrix().catch(console.error);
}

export { showCapabilityMatrix };