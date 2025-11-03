#!/usr/bin/env node

/**
 * Context Statistics CLI Tool
 *
 * View context management and memory operation statistics
 *
 * Usage:
 *   pnpm run context:stats     # View current statistics
 *   pnpm run context:report    # Generate detailed report
 *   pnpm run context:cleanup   # Clean up old stats (keep last 30 days)
 */

const path = require('path');
const fs = require('fs');

// Colors for CLI output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const { c, dim, bright } = {
  c: (color, text) => `${colors[color]}${text}${colors.reset}`,
  dim: (text) => `${colors.dim}${text}${colors.reset}`,
  bright: (text) => `${colors.bright}${text}${colors.reset}`
};

async function main() {
  const command = process.argv[2] || 'stats';

  console.log(c('cyan', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(c('bright', '  📊 VERSATIL Context Statistics'));
  console.log(c('cyan', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  // Ensure dist exists
  const distPath = path.join(__dirname, '..', 'dist', 'memory', 'context-stats-tracker.js');

  if (!fs.existsSync(distPath)) {
    console.log(c('yellow', '⚠️  Building framework first...\n'));
    const { execSync } = require('child_process');
    try {
      execSync('pnpm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (error) {
      console.error(c('yellow', '\n⚠️  Build failed. Statistics may not be available yet.'));
      console.log(dim('   Run: pnpm run build'));
      process.exit(1);
    }
  }

  try {
    const { getGlobalContextTracker } = require(distPath);
    const tracker = getGlobalContextTracker();
    await tracker.initialize();

    switch (command) {
      case 'stats':
      case 'status':
        await showStats(tracker);
        break;

      case 'report':
        await showReport(tracker);
        break;

      case 'cleanup':
        await cleanup(tracker);
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.log(c('yellow', `⚠️  Unknown command: ${command}\n`));
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(c('yellow', '\n⚠️  Error:'), error.message);
    console.log(dim('\n   Statistics may not be available yet.'));
    console.log(dim('   Try: pnpm run build && pnpm run memory:init\n'));
    process.exit(1);
  }
}

async function showStats(tracker) {
  const stats = tracker.getStatistics();

  console.log(c('bright', '📈 Summary Statistics\n'));

  console.log(c('white', '  Total Tokens Processed:'), c('green', stats.totalTokensProcessed.toLocaleString()));
  console.log(c('white', '  Total Clear Events:'), c('green', stats.totalClearEvents.toString()));
  console.log(c('white', '  Total Tokens Saved:'), c('green', stats.totalTokensSaved.toLocaleString()));
  console.log(c('white', '  Avg Tokens per Clear:'), c('green', Math.round(stats.avgTokensPerClear).toLocaleString()));
  console.log(c('white', '  Total Memory Operations:'), c('green', stats.totalMemoryOperations.toString()));
  console.log(c('white', '  Uptime:'), c('green', `${(stats.uptime / 3600).toFixed(2)} hours`));

  if (Object.keys(stats.memoryOperationsByType).length > 0) {
    console.log(c('bright', '\n\n🔧 Memory Operations by Type\n'));
    Object.entries(stats.memoryOperationsByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const bar = '█'.repeat(Math.min(50, Math.round(count / 2)));
        console.log(c('white', `  ${type.padEnd(12)}:`), c('blue', bar), c('dim', count.toString()));
      });
  }

  if (Object.keys(stats.clearEventsByAgent).length > 0) {
    console.log(c('bright', '\n\n📊 Clear Events by Agent\n'));
    Object.entries(stats.clearEventsByAgent)
      .sort((a, b) => b[1] - a[1])
      .forEach(([agent, count]) => {
        const bar = '█'.repeat(Math.min(50, Math.round(count / 2)));
        console.log(c('white', `  ${agent.padEnd(20)}:`), c('cyan', bar), c('dim', count.toString()));
      });
  }

  if (stats.lastClearEvent) {
    console.log(c('bright', '\n\n⏱️  Last Clear Event\n'));
    console.log(c('white', '  Timestamp:'), c('dim', stats.lastClearEvent.timestamp.toISOString()));
    console.log(c('white', '  Input Tokens:'), c('green', stats.lastClearEvent.inputTokens.toLocaleString()));
    console.log(c('white', '  Tool Uses Cleared:'), c('yellow', stats.lastClearEvent.toolUsesCleared.toString()));
    console.log(c('white', '  Tokens Saved:'), c('green', stats.lastClearEvent.tokensSaved.toLocaleString()));
    if (stats.lastClearEvent.agentId) {
      console.log(c('white', '  Agent:'), c('cyan', stats.lastClearEvent.agentId));
    }
  }

  console.log(c('cyan', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  console.log(dim('  Run `pnpm run context:report` for detailed report'));
  console.log(dim('  Run `pnpm run context:cleanup` to remove old stats\n'));
}

async function showReport(tracker) {
  const report = await tracker.generateReport();
  console.log(report);
  console.log(c('cyan', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

async function cleanup(tracker) {
  console.log(c('yellow', '🧹 Cleaning up old statistics (keeping last 30 days)...\n'));
  await tracker.cleanup(30);
  console.log(c('green', '✅ Cleanup complete!\n'));
}

function showHelp() {
  console.log(c('bright', 'Usage:\n'));
  console.log(c('white', '  pnpm run context:stats    '), dim('# View current statistics'));
  console.log(c('white', '  pnpm run context:report   '), dim('# Generate detailed report'));
  console.log(c('white', '  pnpm run context:cleanup  '), dim('# Clean up old stats (keep last 30 days)'));
  console.log();
}

main().catch(error => {
  console.error(c('yellow', '\n⚠️  Fatal error:'), error.message);
  process.exit(1);
});
