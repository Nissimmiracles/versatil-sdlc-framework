#!/usr/bin/env node

/**
 * Test Context Statistics Tracking
 *
 * Demonstrates context stats tracking with sample data
 */

const path = require('path');
const fs = require('fs');

// Colors for CLI output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

async function main() {
  console.log(c('cyan', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(c('bright', '  🧪 Context Statistics Tracker Test'));
  console.log(c('cyan', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  // Ensure dist exists
  const distPath = path.join(__dirname, '..', 'dist', 'memory', 'context-stats-tracker.js');

  if (!fs.existsSync(distPath)) {
    console.log(c('yellow', '⚠️  Building framework first...\n'));
    const { execSync } = require('child_process');
    try {
      execSync('pnpm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (error) {
      console.error(c('yellow', '\n⚠️  Build failed. Try: pnpm run build'));
      process.exit(1);
    }
  }

  try {
    const { ContextStatsTracker } = require(distPath);
    const tracker = new ContextStatsTracker();
    await tracker.initialize();

    console.log(c('blue', '📝 Generating sample data...\n'));

    // Start a session
    const sessionId = tracker.startSession('maria-qa');
    console.log(c('green', `✅ Session started: ${sessionId}`));

    // Simulate some memory operations
    console.log(c('blue', '\n📚 Simulating memory operations...'));

    await tracker.trackMemoryOperation({
      operation: 'view',
      path: 'maria-qa/test-patterns.md',
      success: true,
      agentId: 'maria-qa',
      tokensUsed: 120
    });
    console.log(c('green', '  ✓ Tracked view operation'));

    await tracker.trackMemoryOperation({
      operation: 'create',
      path: 'marcus-backend/api-patterns.md',
      success: true,
      agentId: 'marcus-backend',
      tokensUsed: 450
    });
    console.log(c('green', '  ✓ Tracked create operation'));

    await tracker.trackMemoryOperation({
      operation: 'str_replace',
      path: 'james-frontend/component-patterns.md',
      success: true,
      agentId: 'james-frontend',
      tokensUsed: 230
    });
    console.log(c('green', '  ✓ Tracked str_replace operation'));

    // Simulate context clear events
    console.log(c('blue', '\n🧹 Simulating context clear events...'));

    await tracker.trackClearEvent({
      inputTokens: 105000,
      toolUsesCleared: 15,
      tokensSaved: 3500,
      triggerType: 'input_tokens',
      triggerValue: 100000,
      agentId: 'maria-qa'
    });
    console.log(c('green', '  ✓ Tracked clear event (maria-qa)'));

    await tracker.trackClearEvent({
      inputTokens: 110000,
      toolUsesCleared: 18,
      tokensSaved: 4200,
      triggerType: 'input_tokens',
      triggerValue: 100000,
      agentId: 'marcus-backend'
    });
    console.log(c('green', '  ✓ Tracked clear event (marcus-backend)'));

    // Update token usage
    tracker.updateTokenUsage(50000, 12000);
    console.log(c('green', '\n✅ Updated token usage'));

    // Get statistics
    console.log(c('blue', '\n📊 Retrieving statistics...\n'));

    const stats = tracker.getStatistics();

    console.log(c('bright', 'Summary Statistics:'));
    console.log(`  Total Tokens Processed: ${c('green', stats.totalTokensProcessed.toLocaleString())}`);
    console.log(`  Total Clear Events: ${c('green', stats.totalClearEvents.toString())}`);
    console.log(`  Total Tokens Saved: ${c('green', stats.totalTokensSaved.toLocaleString())}`);
    console.log(`  Total Memory Operations: ${c('green', stats.totalMemoryOperations.toString())}`);

    if (Object.keys(stats.memoryOperationsByType).length > 0) {
      console.log(c('bright', '\n\nMemory Operations by Type:'));
      Object.entries(stats.memoryOperationsByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${c('green', count.toString())}`);
      });
    }

    if (Object.keys(stats.clearEventsByAgent).length > 0) {
      console.log(c('bright', '\n\nClear Events by Agent:'));
      Object.entries(stats.clearEventsByAgent).forEach(([agent, count]) => {
        console.log(`  ${agent}: ${c('green', count.toString())}`);
      });
    }

    // Generate report
    console.log(c('blue', '\n\n📄 Generating markdown report...\n'));
    const report = await tracker.generateReport();
    console.log(report);

    // End session
    const sessionMetrics = await tracker.endSession();
    console.log(c('bright', '\n\n📈 Session Metrics:'));
    console.log(`  Session ID: ${c('cyan', sessionMetrics.sessionId)}`);
    console.log(`  Clear Events: ${c('green', sessionMetrics.clearEvents.toString())}`);
    console.log(`  Tokens Saved: ${c('green', sessionMetrics.tokensSaved.toLocaleString())}`);
    console.log(`  Memory Operations: ${c('green', sessionMetrics.memoryOperations.toString())}`);

    console.log(c('cyan', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(c('green', '\n✅ Test completed successfully!\n'));
    console.log(c('bright', 'Try these commands:'));
    console.log('  pnpm run context:stats    - View current statistics');
    console.log('  pnpm run context:report   - Generate detailed report');
    console.log('  pnpm run context:cleanup  - Clean up old stats\n');

  } catch (error) {
    console.error(c('yellow', '\n⚠️  Error:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(colors.yellow, '\n⚠️  Fatal error:', colors.reset, error.message);
  process.exit(1);
});
