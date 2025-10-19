#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Audit Daemon CLI
 * Command line interface for the daily audit daemon
 *
 * Usage:
 *   versatil-audit-daemon start   - Start the daemon
 *   versatil-audit-daemon stop    - Stop the daemon
 *   versatil-audit-daemon restart - Restart the daemon
 *   versatil-audit-daemon status  - Show daemon status
 *   versatil-audit-daemon run     - Run immediate audit
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const command = process.argv[2] || 'help';
const args = process.argv.slice(3);

// Configuration paths
const configDir = join(os.homedir(), '.versatil');
const logPath = join(configDir, 'logs', 'daily-audit.log');
const pidPath = join(configDir, 'run', 'audit-daemon.pid');

/**
 * Display help message
 */
function showHelp() {
  console.log(`
VERSATIL Audit Daemon - Daily Health Check Automation (Rule 3)

Usage:
  versatil-audit-daemon <command> [options]

Commands:
  start      Start the daemon (runs in foreground by default)
  stop       Stop the running daemon
  restart    Restart the daemon
  status     Show daemon status
  run        Run immediate audit (daemon must be running)
  logs       Show daemon logs (tail -f)
  help       Show this help message

Options:
  --background, -b    Run daemon in background (with start command)
  --verbose, -v       Verbose output
  --schedule <cron>   Custom cron schedule (default: "0 2 * * *")
  --timezone <tz>     Timezone for scheduling (default: "America/New_York")

Examples:
  versatil-audit-daemon start             # Start in foreground
  versatil-audit-daemon start --background # Start in background
  versatil-audit-daemon status            # Check if running
  versatil-audit-daemon logs              # View logs
  versatil-audit-daemon stop              # Stop daemon

Scheduled Audits:
  - Default: Daily at 2:00 AM (${process.env.TZ || 'America/New_York'})
  - Immediate: Triggered on critical issues
  - On-Demand: Use 'run' command

Logs: ${logPath}
PID File: ${pidPath}
`);
}

/**
 * Check if daemon is running
 */
async function isRunning() {
  try {
    if (!(await fs.pathExists(pidPath))) {
      return false;
    }

    const pidStr = await fs.readFile(pidPath, 'utf8');
    const pid = parseInt(pidStr.trim(), 10);

    if (isNaN(pid)) {
      return false;
    }

    // Check if process is running
    try {
      process.kill(pid, 0);
      return pid;
    } catch (error) {
      // Process not found, remove stale PID file
      await fs.remove(pidPath);
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Start daemon
 */
async function startDaemon() {
  const running = await isRunning();
  if (running) {
    console.log(`Daemon is already running (PID: ${running})`);
    process.exit(1);
  }

  const background = args.includes('--background') || args.includes('-b');
  const verbose = args.includes('--verbose') || args.includes('-v');

  // Get custom schedule if provided
  const scheduleIndex = args.indexOf('--schedule');
  const cronSchedule = scheduleIndex !== -1 ? args[scheduleIndex + 1] : '0 2 * * *';

  // Get custom timezone if provided
  const timezoneIndex = args.indexOf('--timezone');
  const timezone = timezoneIndex !== -1 ? args[timezoneIndex + 1] : 'America/New_York';

  console.log('Starting VERSATIL Audit Daemon...');
  console.log(`Schedule: ${cronSchedule}`);
  console.log(`Timezone: ${timezone}`);
  console.log(`Log file: ${logPath}`);

  if (background) {
    console.log('Running in background mode');

    // Spawn child process in background
    const { spawn } = await import('child_process');

    const child = spawn(
      process.argv[0],
      [__filename, '_run-daemon', cronSchedule, timezone],
      {
        detached: true,
        stdio: 'ignore'
      }
    );

    child.unref();

    // Wait a moment to ensure daemon started
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pid = await isRunning();
    if (pid) {
      console.log(`Daemon started successfully (PID: ${pid})`);
      console.log(`\nView logs: tail -f ${logPath}`);
      console.log(`Stop daemon: versatil-audit-daemon stop`);
    } else {
      console.error('Failed to start daemon. Check logs for errors.');
      process.exit(1);
    }
  } else {
    console.log('Running in foreground mode (press Ctrl+C to stop)');
    await runDaemon(cronSchedule, timezone, verbose);
  }
}

/**
 * Run daemon (called internally)
 */
async function runDaemon(cronSchedule, timezone, verbose) {
  try {
    // Import daemon class
    const { DailyAuditDaemon } = await import('../dist/audit/daily-audit-daemon.js');

    // Create and start daemon
    const daemon = new DailyAuditDaemon({
      cronSchedule,
      timezone,
      logPath,
      pidPath
    });

    // Setup event listeners for verbose mode
    if (verbose) {
      daemon.on('daemon:started', (data) => {
        console.log(`[EVENT] Daemon started: PID ${data.pid}`);
      });

      daemon.on('audit:scheduled:completed', (data) => {
        console.log(`[EVENT] Scheduled audit completed: ${data.result.status}`);
      });

      daemon.on('audit:immediate:completed', (data) => {
        console.log(`[EVENT] Immediate audit completed: ${data.result.status}`);
      });
    }

    await daemon.start();

    // Keep process running
    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await daemon.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await daemon.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error(`Failed to start daemon: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Stop daemon
 */
async function stopDaemon() {
  const pid = await isRunning();

  if (!pid) {
    console.log('Daemon is not running');
    process.exit(1);
  }

  console.log(`Stopping daemon (PID: ${pid})...`);

  try {
    process.kill(pid, 'SIGTERM');

    // Wait for graceful shutdown
    let attempts = 0;
    while (attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!(await isRunning())) {
        console.log('Daemon stopped successfully');
        return;
      }
      attempts++;
    }

    // Force kill if still running
    console.log('Daemon did not stop gracefully, forcing shutdown...');
    process.kill(pid, 'SIGKILL');
    await fs.remove(pidPath);
    console.log('Daemon force stopped');

  } catch (error) {
    console.error(`Failed to stop daemon: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Restart daemon
 */
async function restartDaemon() {
  console.log('Restarting daemon...');

  const running = await isRunning();
  if (running) {
    await stopDaemon();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await startDaemon();
}

/**
 * Show daemon status
 */
async function showStatus() {
  const pid = await isRunning();

  console.log('VERSATIL Audit Daemon Status');
  console.log('─'.repeat(50));

  if (pid) {
    console.log(`Status:     Running`);
    console.log(`PID:        ${pid}`);

    // Try to get uptime from PID file modification time
    try {
      const stats = await fs.stat(pidPath);
      const uptime = Math.floor((Date.now() - stats.mtimeMs) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      console.log(`Uptime:     ${hours}h ${minutes}m ${seconds}s`);
    } catch (error) {
      // Ignore
    }

    console.log(`Log file:   ${logPath}`);
    console.log(`PID file:   ${pidPath}`);

    // Show last log entries
    try {
      if (await fs.pathExists(logPath)) {
        console.log('\nRecent logs (last 5 lines):');
        console.log('─'.repeat(50));

        const { execSync } = await import('child_process');
        const logs = execSync(`tail -n 5 "${logPath}"`, { encoding: 'utf8' });
        console.log(logs);
      }
    } catch (error) {
      // Ignore
    }
  } else {
    console.log(`Status:     Not running`);
    console.log(`Log file:   ${logPath}`);
    console.log(`PID file:   ${pidPath}`);
  }

  console.log('─'.repeat(50));
}

/**
 * Run immediate audit
 */
async function runImmediateAudit() {
  const pid = await isRunning();

  if (!pid) {
    console.log('Error: Daemon is not running');
    console.log('Start the daemon first: versatil-audit-daemon start --background');
    process.exit(1);
  }

  console.log('Triggering immediate audit...');
  console.log('Note: This feature requires the daemon to expose an IPC interface.');
  console.log('For now, check the audit logs for scheduled audit results.');
  console.log(`\nLogs: ${logPath}`);
}

/**
 * Show daemon logs
 */
async function showLogs() {
  if (!(await fs.pathExists(logPath))) {
    console.log('No logs found');
    console.log(`Log file: ${logPath}`);
    process.exit(1);
  }

  console.log(`Watching logs: ${logPath}`);
  console.log('Press Ctrl+C to exit');
  console.log('─'.repeat(50));

  const { spawn } = await import('child_process');
  const tail = spawn('tail', ['-f', logPath]);

  tail.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  tail.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  process.on('SIGINT', () => {
    tail.kill();
    process.exit(0);
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    // Ensure config directory exists
    await fs.ensureDir(configDir);
    await fs.ensureDir(join(configDir, 'logs'));
    await fs.ensureDir(join(configDir, 'run'));

    // Handle commands
    switch (command) {
      case 'start':
        await startDaemon();
        break;

      case 'stop':
        await stopDaemon();
        break;

      case 'restart':
        await restartDaemon();
        break;

      case 'status':
        await showStatus();
        break;

      case 'run':
        await runImmediateAudit();
        break;

      case 'logs':
        await showLogs();
        break;

      case '_run-daemon':
        // Internal command for background execution
        await runDaemon(args[0], args[1], false);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run CLI
main();
