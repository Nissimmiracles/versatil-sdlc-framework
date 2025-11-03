#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Architectural Watcher Orchestration Script
 *
 * Purpose: Wrapper script for real-time architectural validation during development.
 * This script initializes and manages the ArchitecturalWatcher for HMR integration.
 *
 * Usage:
 *   pnpm run validate:watch          # Start watcher with normal verbosity
 *   pnpm run validate:watch -- --verbose  # Verbose mode
 *   pnpm run validate:watch -- --silent   # Silent mode (errors only)
 *   pnpm run validate:watch -- --errors-only  # Show only errors, no warnings
 *
 * Phase 4: HMR Integration
 * @see docs/enhancements/HMR_INTEGRATION.md
 */

const path = require('path');
const fs = require('fs');

// Parse command-line arguments
const args = process.argv.slice(2);
const config = {
  verbosity: 'normal',
  errorsOnly: false,
  colors: true,
  debounce: 500
};

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--verbose' || arg === '-v') {
    config.verbosity = 'verbose';
  } else if (arg === '--silent' || arg === '-s') {
    config.verbosity = 'silent';
  } else if (arg === '--errors-only' || arg === '-e') {
    config.errorsOnly = true;
  } else if (arg === '--no-colors') {
    config.colors = false;
  } else if (arg === '--debounce' && args[i + 1]) {
    config.debounce = parseInt(args[i + 1], 10);
    i++; // Skip next argument
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
VERSATIL Architectural Watcher

Usage:
  pnpm run validate:watch [options]

Options:
  --verbose, -v         Show detailed output including successful validations
  --silent, -s          Only show critical errors (minimal output)
  --errors-only, -e     Show only errors, suppress warnings
  --no-colors           Disable colored output
  --debounce <ms>       Set debounce delay in milliseconds (default: 500)
  --help, -h            Show this help message

Examples:
  pnpm run validate:watch                    # Normal mode
  pnpm run validate:watch -- --verbose       # Verbose output
  pnpm run validate:watch -- --errors-only   # Errors only

The watcher monitors your project for architectural violations in real-time:
  • Orphaned page components (pages without routes)
  • Broken navigation (menu items without routes)
  • Incomplete deliverables (partial implementations)

Press Ctrl+C to stop the watcher.
`);
    process.exit(0);
  }
}

// Ensure TypeScript is compiled
const validatorPath = path.join(__dirname, '../dist/validation/architectural-watcher.js');
if (!fs.existsSync(validatorPath)) {
  console.error('❌ Error: Architectural watcher not compiled.');
  console.error('   Run: pnpm run build');
  process.exit(1);
}

// Import the watcher (after TypeScript compilation)
const { ArchitecturalWatcher } = require(validatorPath);

// Initialize watcher
const projectRoot = process.cwd();
const watcher = new ArchitecturalWatcher(projectRoot, config);

// Handle process signals for graceful shutdown
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return; // Prevent duplicate shutdown
  }

  isShuttingDown = true;

  if (config.verbosity !== 'silent') {
    console.log(`\n\n📡 Received ${signal}, shutting down gracefully...`);
  }

  try {
    await watcher.stop();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  shutdown('uncaughtException').then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection').then(() => process.exit(1));
});

// Start the watcher
(async () => {
  try {
    await watcher.start();

    // Keep the process running
    // The watcher handles its own event loop via chokidar
    // This script just needs to stay alive until Ctrl+C

  } catch (error) {
    console.error('❌ Failed to start architectural watcher:', error.message);

    if (error.stack && config.verbosity === 'verbose') {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    console.error('\nTroubleshooting:');
    console.error('  1. Ensure project has pages/routes to monitor');
    console.error('  2. Check file permissions');
    console.error('  3. Run with --verbose for more details');
    console.error('  4. Report issue: https://github.com/versatil-sdlc-framework/issues');

    process.exit(1);
  }
})();
