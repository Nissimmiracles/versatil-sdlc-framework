#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Main Entry Point
 * Enhanced BMAD agent system entry point
 */

import { VERSATILLogger } from './utils/logger';

const logger = new VERSATILLogger();

// Check if we're being run directly or imported
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case '--health-check':
    case 'health-check':
    case 'health':
      runHealthCheck();
      break;

    case '--enhanced':
    case 'enhanced':
      // Start with enhanced BMAD features
      startEnhancedServer();
      break;

    case '--autonomous':
    case 'auto':
      // Start in fully autonomous mode
      startAutonomousMode();
      break;

    case '--server':
    case 'server':
    case 'start':
    default:
      // Start the server
      startServer();
      break;
  }
}

async function startServer() {
  try {
    logger.info('Starting VERSATIL SDLC Framework server...', {}, 'main');

    // Import and start the server
    const { server } = await import('./server');

    logger.info('Server module loaded successfully', {}, 'main');
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'main');
    process.exit(1);
  }
}

async function startEnhancedServer() {
  try {
    logger.info('Starting VERSATIL SDLC Framework with Enhanced BMAD...', {}, 'main');

    // Initialize enhanced BMAD coordinator
    const { enhancedBMAD } = await import('./bmad/enhanced-bmad-coordinator');
    
    // Start the regular server
    await startServer();
    
    logger.info('Enhanced BMAD features activated', {
      ragEnabled: true,
      archonEnabled: true,
      autonomousMode: false
    }, 'main');
  } catch (error) {
    logger.error('Failed to start enhanced server', {
      error: error instanceof Error ? error.message : String(error)
    }, 'main');
    process.exit(1);
  }
}

async function startAutonomousMode() {
  try {
    logger.info('Starting VERSATIL SDLC Framework in Autonomous Mode...', {}, 'main');

    // Initialize enhanced BMAD coordinator with autonomous mode
    const { enhancedBMAD } = await import('./bmad/enhanced-bmad-coordinator');
    
    // Enable autonomous mode
    enhancedBMAD.setAutonomousMode(true);
    
    // Start the regular server
    await startServer();
    
    logger.info('Autonomous mode activated', {
      ragEnabled: true,
      archonEnabled: true,
      autonomousMode: true
    }, 'main');
    
    // Log Archon status
    const metrics = await enhancedBMAD.getPerformanceMetrics();
    logger.info('Archon orchestrator ready', {
      activeGoals: metrics.archonMetrics?.activeGoals || 0,
      performance: metrics.archonMetrics?.performance
    }, 'main');
  } catch (error) {
    logger.error('Failed to start autonomous mode', {
      error: error instanceof Error ? error.message : String(error)
    }, 'main');
    process.exit(1);
  }
}

async function runHealthCheck() {
  try {
    logger.info('Running health check...', {}, 'main');

    // Import health check utilities
    const { healthChecker } = await import('../templates/enterprise/healthcheck.js');

    const result = await healthChecker.runChecks();

    if (result.healthy) {
      logger.info('Health check passed', { score: result.checks.length }, 'main');
      process.exit(0);
    } else {
      logger.error('Health check failed', {
        issues: result.checks.filter(c => c.status !== 'healthy').length
      }, 'main');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Health check error', {
      error: error instanceof Error ? error.message : String(error)
    }, 'main');
    process.exit(1);
  }
}

// Export for programmatic use
export { startServer, runHealthCheck, startEnhancedServer, startAutonomousMode };
export * from './server';
export * from './utils/logger';
export * from './analytics/performance-monitor';
export * from './agents/base-agent';

// Export enhanced components
export * from './rag/vector-memory-store';
export * from './archon/archon-orchestrator';
export * from './bmad/enhanced-bmad-coordinator';

// Default export
export default { startServer, runHealthCheck, startEnhancedServer, startAutonomousMode };