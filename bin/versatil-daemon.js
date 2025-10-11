#!/usr/bin/env node

/**
 * VERSATIL Framework Proactive Agent Daemon
 * Runs in background to monitor files and auto-activate agents
 *
 * Usage:
 *   versatil-daemon start [project-path]
 *   versatil-daemon stop
 *   versatil-daemon status
 *   versatil-daemon logs
 */

import { spawn } from 'child_process';
import { writeFile, readFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DAEMON_DIR = join(homedir(), '.versatil', 'daemon');
const PID_FILE = join(DAEMON_DIR, 'daemon.pid');
const LOG_FILE = join(DAEMON_DIR, 'daemon.log');
const STATUS_FILE = join(DAEMON_DIR, 'status.json');

class VERSATILDaemon {
  async start(projectPath = process.cwd()) {
    // Check if already running
    if (await this.isRunning()) {
      console.log('⚠️  Daemon already running');
      const status = await this.getStatus();
      console.log(`   PID: ${status.pid}`);
      console.log(`   Project: ${status.projectPath}`);
      console.log(`   Started: ${new Date(status.startTime).toLocaleString()}`);
      return;
    }

    // Ensure daemon directory exists
    await mkdir(DAEMON_DIR, { recursive: true });

    console.log('🚀 Starting VERSATIL Proactive Agent Daemon...');
    console.log(`   Project: ${projectPath}`);

    // Start daemon in background
    const daemon = spawn(
      process.execPath,
      [join(import.meta.dirname, '../dist/daemon/proactive-daemon.js'), projectPath],
      {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          VERSATIL_PROJECT_PATH: projectPath,
          VERSATIL_DAEMON_MODE: 'true'
        }
      }
    );

    // Save PID
    await writeFile(PID_FILE, String(daemon.pid));

    // Save status
    await writeFile(STATUS_FILE, JSON.stringify({
      pid: daemon.pid,
      projectPath,
      startTime: Date.now(),
      version: '1.0.0'
    }, null, 2));

    // Pipe logs to file
    const logStream = await import('fs').then(fs => fs.createWriteStream(LOG_FILE, { flags: 'a' }));
    daemon.stdout.pipe(logStream);
    daemon.stderr.pipe(logStream);

    daemon.unref();

    console.log('✅ Daemon started successfully');
    console.log(`   PID: ${daemon.pid}`);
    console.log(`   Logs: ${LOG_FILE}`);
    console.log('\n📊 Monitoring:');
    console.log('   • Test files (*.test.*, *.spec.*)');
    console.log('   • Frontend files (*.tsx, *.jsx, *.vue)');
    console.log('   • Backend files (*.api.*, routes/**, controllers/**)');
    console.log('\n🤖 Agents will activate automatically on file changes');
    console.log('   Run "versatil-daemon status" to check activity');
  }

  async stop() {
    if (!(await this.isRunning())) {
      console.log('⚠️  Daemon not running');
      return;
    }

    const status = await this.getStatus();
    console.log(`🛑 Stopping daemon (PID: ${status.pid})...`);

    try {
      process.kill(status.pid, 'SIGTERM');

      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Force kill if still running
      if (await this.isRunning()) {
        process.kill(status.pid, 'SIGKILL');
      }

      // Clean up files
      await unlink(PID_FILE).catch(() => {});
      await unlink(STATUS_FILE).catch(() => {});

      console.log('✅ Daemon stopped');
    } catch (error) {
      if (error.code === 'ESRCH') {
        console.log('⚠️  Process not found, cleaning up...');
        await unlink(PID_FILE).catch(() => {});
        await unlink(STATUS_FILE).catch(() => {});
      } else {
        throw error;
      }
    }
  }

  async status() {
    const running = await this.isRunning();

    if (!running) {
      console.log('🔴 Daemon Status: STOPPED');
      console.log('\nStart with: versatil-daemon start [project-path]');
      return;
    }

    const status = await this.getStatus();
    const uptime = Date.now() - status.startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    console.log('🟢 Daemon Status: RUNNING');
    console.log(`\n📊 Details:`);
    console.log(`   PID: ${status.pid}`);
    console.log(`   Project: ${status.projectPath}`);
    console.log(`   Started: ${new Date(status.startTime).toLocaleString()}`);
    console.log(`   Uptime: ${hours}h ${minutes}m`);
    console.log(`   Version: ${status.version}`);
    console.log(`\n📝 Logs: ${LOG_FILE}`);
    console.log('\n🤖 Active Agents:');
    console.log('   • Maria-QA (Test Quality Assurance)');
    console.log('   • James-Frontend (UI/UX Analysis)');
    console.log('   • Marcus-Backend (API Security)');
  }

  async logs() {
    if (!existsSync(LOG_FILE)) {
      console.log('⚠️  No logs found');
      return;
    }

    console.log('📝 Recent logs (last 50 lines):\n');
    const { exec } = await import('child_process');
    exec(`tail -n 50 "${LOG_FILE}"`, (error, stdout) => {
      if (error) {
        console.error('Error reading logs:', error);
        return;
      }
      console.log(stdout);
    });
  }

  async isRunning() {
    if (!existsSync(PID_FILE)) {
      return false;
    }

    const pid = parseInt(await readFile(PID_FILE, 'utf-8'));

    try {
      // Signal 0 checks if process exists without killing it
      process.kill(pid, 0);
      return true;
    } catch {
      // Process doesn't exist, clean up stale PID file
      await unlink(PID_FILE).catch(() => {});
      await unlink(STATUS_FILE).catch(() => {});
      return false;
    }
  }

  async getStatus() {
    const statusData = await readFile(STATUS_FILE, 'utf-8');
    return JSON.parse(statusData);
  }
}

// Main CLI handler
async function main() {
  const daemon = new VERSATILDaemon();
  const command = process.argv[2];
  const projectPath = process.argv[3];

  switch (command) {
    case 'start':
      await daemon.start(projectPath);
      break;
    case 'stop':
      await daemon.stop();
      break;
    case 'status':
      await daemon.status();
      break;
    case 'logs':
      await daemon.logs();
      break;
    case 'restart':
      await daemon.stop();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await daemon.start(projectPath);
      break;
    default:
      console.log('VERSATIL Framework - Proactive Agent Daemon\n');
      console.log('Usage:');
      console.log('  versatil-daemon start [project-path]  Start background monitoring');
      console.log('  versatil-daemon stop                   Stop the daemon');
      console.log('  versatil-daemon status                 Check daemon status');
      console.log('  versatil-daemon logs                   View recent logs');
      console.log('  versatil-daemon restart                Restart the daemon');
      console.log('\nExample:');
      console.log('  versatil-daemon start ~/my-project');
      console.log('  versatil-daemon status');
  }
}

main().catch(console.error);
