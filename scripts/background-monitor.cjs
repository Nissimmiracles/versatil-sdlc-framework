#!/usr/bin/env node
/**
 * VERSATIL Framework - Background Monitoring Service
 *
 * Lightweight daemon that runs continuously in the background
 * Collects framework metrics and writes to shared status file
 * No UI - just data collection for dashboard consumption
 *
 * Usage:
 *   npm run dashboard:background        # Start background service
 *   node scripts/background-monitor.cjs  # Direct start
 *   node scripts/background-monitor.cjs --interval=5000  # Custom interval
 *
 * To stop:
 *   npm run dashboard:stop
 *   Kill the process (PID stored in /tmp/versatil-monitor.pid)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = process.cwd();
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'default';
const STATUS_FILE = `/tmp/versatil-sync-status-${SESSION_ID}.json`;
const PID_FILE = `/tmp/versatil-monitor-${SESSION_ID}.pid`;
const LOG_FILE = path.join(PROJECT_ROOT, '.versatil', 'logs', 'background-monitor.log');

// Parse command line arguments
const args = process.argv.slice(2);
const INTERVAL = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '2000');
const DAEMON_MODE = !args.includes('--foreground');

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Logger
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // Console output in foreground mode
  if (!DAEMON_MODE) {
    console.log(logMessage.trim());
  }

  // Always write to log file
  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    // Ignore file write errors
  }
}

// Check if already running
if (fs.existsSync(PID_FILE)) {
  const existingPid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));

  try {
    // Check if process is still running
    process.kill(existingPid, 0);
    log(`Background monitor already running (PID: ${existingPid})`);
    console.error(`Error: Background monitor already running (PID: ${existingPid})`);
    console.error(`To stop it, run: npm run dashboard:stop`);
    process.exit(1);
  } catch (error) {
    // Process not running, remove stale PID file
    fs.unlinkSync(PID_FILE);
  }
}

// Write PID file
fs.writeFileSync(PID_FILE, process.pid.toString());

log(`Background monitor started (PID: ${process.pid})`);
log(`Interval: ${INTERVAL}ms`);
log(`Status file: ${STATUS_FILE}`);
log(`Project: ${PROJECT_ROOT}`);

// ============================================================================
// DATA COLLECTION
// ============================================================================

/**
 * Check orchestrator status
 */
function checkOrchestrators() {
  const orchestrators = [
    { name: 'ProactiveOrchestrator', file: 'src/orchestration/proactive-agent-orchestrator.ts' },
    { name: 'AgenticRAGOrchestrator', file: 'src/orchestration/agentic-rag-orchestrator.ts' },
    { name: 'PlanFirstOpera', file: 'src/orchestration/plan-first-opera.ts' },
    { name: 'StackAware', file: 'src/orchestration/stack-aware-orchestrator.ts' },
    { name: 'GitHubSync', file: 'src/orchestration/github-sync-orchestrator.ts' },
    { name: 'ParallelTaskManager', file: 'src/orchestration/parallel-task-manager.ts' },
    { name: 'EfficiencyMonitor', file: 'src/monitoring/framework-efficiency-monitor.ts' },
    { name: 'IntrospectiveAgent', file: 'src/agents/introspective-agent.ts' }
  ];

  let active = 0;
  const statuses = {};

  for (const orch of orchestrators) {
    const fullPath = path.join(PROJECT_ROOT, orch.file);
    const exists = fs.existsSync(fullPath);

    if (exists) {
      active++;
      statuses[orch.name] = 'active';
    } else {
      statuses[orch.name] = 'inactive';
    }
  }

  return {
    total: orchestrators.length,
    active,
    inactive: orchestrators.length - active,
    statuses
  };
}

/**
 * Calculate sync score
 */
function calculateSyncScore(orchestrators) {
  const baseScore = (orchestrators.active / orchestrators.total) * 100;

  // Additional factors could be added here
  // - Event system health
  // - Memory consistency
  // - GitHub sync status
  // For now, simplified to orchestrator availability

  return Math.round(baseScore);
}

/**
 * Get system metrics
 */
function getSystemMetrics() {
  const used = process.memoryUsage();
  return {
    memory_mb: Math.round(used.heapUsed / 1024 / 1024),
    memory_total_mb: Math.round(used.heapTotal / 1024 / 1024),
    cpu_user: process.cpuUsage().user,
    cpu_system: process.cpuUsage().system,
    uptime_seconds: Math.round(process.uptime())
  };
}

/**
 * Check RAG system status
 */
function checkRAGStatus() {
  const ragFiles = [
    'src/orchestration/agentic-rag-orchestrator.ts',
    'src/agents/rag-enabled-agent.ts'
  ];

  let active = 0;
  for (const file of ragFiles) {
    if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
      active++;
    }
  }

  return {
    total: ragFiles.length,
    active,
    operational: active === ragFiles.length
  };
}

/**
 * Check Opera MCP status
 */
function checkOperaMCPStatus() {
  const operaFiles = [
    'src/orchestration/plan-first-opera.ts',
    'src/opera/opera-orchestrator.ts',
    'src/opera/opera-mcp-server.ts',
    'init-opera-mcp.mjs'
  ];

  let active = 0;
  for (const file of operaFiles) {
    if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
      active++;
    }
  }

  return {
    total: operaFiles.length,
    active,
    operational: active === operaFiles.length
  };
}

/**
 * Collect all framework status data
 */
function collectFrameworkStatus() {
  try {
    const orchestrators = checkOrchestrators();
    const syncScore = calculateSyncScore(orchestrators);
    const metrics = getSystemMetrics();
    const ragStatus = checkRAGStatus();
    const operaStatus = checkOperaMCPStatus();

    const status = {
      timestamp: Date.now(),
      iso_timestamp: new Date().toISOString(),
      synchronized: syncScore >= 90,
      score: syncScore,
      orchestrators_active: orchestrators.active,
      orchestrators_total: orchestrators.total,
      orchestrators_inactive: orchestrators.inactive,
      orchestrator_statuses: orchestrators.statuses,
      rag_system: {
        active: ragStatus.active,
        total: ragStatus.total,
        operational: ragStatus.operational
      },
      opera_mcp: {
        active: operaStatus.active,
        total: operaStatus.total,
        operational: operaStatus.operational
      },
      current_operation: process.env.VERSATIL_OPERATION || 'Framework monitoring',
      system_metrics: metrics,
      monitor_pid: process.pid,
      session_id: SESSION_ID
    };

    return status;
  } catch (error) {
    log(`Error collecting status: ${error.message}`);
    return null;
  }
}

/**
 * Write status to shared file
 */
function writeStatus(status) {
  if (!status) {
    return;
  }

  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (error) {
    log(`Error writing status file: ${error.message}`);
  }
}

// ============================================================================
// MONITORING LOOP
// ============================================================================

let updateCount = 0;

function monitoringLoop() {
  updateCount++;

  const status = collectFrameworkStatus();
  writeStatus(status);

  if (updateCount % 30 === 0) {
    // Log every 30 updates (every minute with 2s interval)
    log(`Health check #${updateCount}: Sync ${status.score}%, ${status.orchestrators_active}/${status.orchestrators_total} orchestrators active`);
  }
}

// Initial status collection
log('Performing initial status collection...');
monitoringLoop();

// Start monitoring interval
const intervalId = setInterval(monitoringLoop, INTERVAL);

// ============================================================================
// SIGNAL HANDLERS
// ============================================================================

function cleanup() {
  log('Shutting down background monitor...');

  clearInterval(intervalId);

  // Remove PID file
  try {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
  } catch (error) {
    // Ignore
  }

  log(`Background monitor stopped (${updateCount} updates performed)`);
  process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Graceful error handling
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  log(error.stack);
  cleanup();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection: ${reason}`);
  cleanup();
});

// ============================================================================
// DAEMON MODE
// ============================================================================

if (DAEMON_MODE) {
  // Detach from parent process
  process.stdin.pause();

  log('Running in daemon mode');
  log(`To view logs: tail -f ${LOG_FILE}`);
  log(`To stop: npm run dashboard:stop or kill ${process.pid}`);
} else {
  log('Running in foreground mode (--foreground)');
  log('Press Ctrl+C to stop');
}

// Keep process alive
process.stdin.resume();