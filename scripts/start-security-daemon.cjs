#!/usr/bin/env node

/**
 * VERSATIL Security Daemon Startup Script
 * Starts the security daemon with proper configuration and background monitoring
 */

const { spawn, exec } = require('child_process');
const { join } = require('path');
const { promises: fs } = require('fs');
const os = require('os');

const FRAMEWORK_ROOT = process.cwd();
const VERSATIL_HOME = process.env.VERSATIL_HOME || join(os.homedir(), '.versatil');
const PID_FILE = join(VERSATIL_HOME, 'security', 'daemon.pid');
const LOG_FILE = join(VERSATIL_HOME, 'security', 'daemon.log');

class SecurityDaemonManager {
  constructor() {
    this.isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  }

  async start() {
    console.log('🔒 Starting VERSATIL Security Daemon...');

    try {
      // Check if daemon is already running
      if (await this.isDaemonRunning()) {
        console.log('✅ Security daemon is already running');
        return;
      }

      // Ensure security directory exists
      await fs.mkdir(join(VERSATIL_HOME, 'security'), { recursive: true });

      // Create environment variables for the daemon
      const env = {
        ...process.env,
        VERSATIL_FRAMEWORK_ROOT: FRAMEWORK_ROOT,
        VERSATIL_HOME: VERSATIL_HOME,
        NODE_ENV: 'security'
      };

      // Start the daemon process
      const daemonScript = join(FRAMEWORK_ROOT, 'dist', 'security', 'security-daemon.js');

      // First compile TypeScript if needed
      await this.ensureCompiled();

      const daemon = spawn('node', [daemonScript], {
        env,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Save PID for later management
      await fs.writeFile(PID_FILE, daemon.pid.toString());

      // Set up logging
      const logStream = require('fs').createWriteStream(LOG_FILE, { flags: 'a' });
      daemon.stdout.pipe(logStream);
      daemon.stderr.pipe(logStream);

      if (this.isVerbose) {
        daemon.stdout.pipe(process.stdout);
        daemon.stderr.pipe(process.stderr);
      }

      // Detach the process so it runs independently
      daemon.unref();

      console.log(`✅ Security daemon started successfully (PID: ${daemon.pid})`);
      console.log(`📄 Logs: ${LOG_FILE}`);
      console.log('🛡️  Real-time security enforcement is now active');

      // Wait a moment to ensure it started properly
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (await this.isDaemonRunning()) {
        console.log('🔐 Security daemon confirmed running');
      } else {
        throw new Error('Daemon failed to start properly');
      }

    } catch (error) {
      console.error('❌ Failed to start security daemon:', error.message);
      process.exit(1);
    }
  }

  async stop() {
    console.log('🛑 Stopping VERSATIL Security Daemon...');

    try {
      const pid = await this.getDaemonPid();
      if (!pid) {
        console.log('ℹ️  Security daemon is not running');
        return;
      }

      // Send SIGTERM to gracefully shutdown
      process.kill(pid, 'SIGTERM');

      // Wait for shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if it's still running
      if (await this.isDaemonRunning()) {
        console.log('⚠️  Daemon didn\'t stop gracefully, force killing...');
        process.kill(pid, 'SIGKILL');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Clean up PID file
      try {
        await fs.unlink(PID_FILE);
      } catch (e) {
        // PID file might not exist
      }

      console.log('✅ Security daemon stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop security daemon:', error.message);
      process.exit(1);
    }
  }

  async status() {
    try {
      const isRunning = await this.isDaemonRunning();
      const pid = await this.getDaemonPid();

      console.log('🔒 VERSATIL Security Daemon Status');
      console.log('=====================================');
      console.log(`Status: ${isRunning ? '🟢 Running' : '🔴 Stopped'}`);

      if (pid) {
        console.log(`PID: ${pid}`);

        // Get process info if running
        if (isRunning) {
          try {
            const { stdout } = await this.execAsync(`ps -p ${pid} -o pid,ppid,time,comm`);
            console.log('Process Info:');
            console.log(stdout);
          } catch (e) {
            // Process info unavailable
          }
        }
      }

      console.log(`Framework Root: ${FRAMEWORK_ROOT}`);
      console.log(`VERSATIL Home: ${VERSATIL_HOME}`);
      console.log(`Log File: ${LOG_FILE}`);

      // Show recent log entries
      try {
        const logContent = await fs.readFile(LOG_FILE, 'utf8');
        const recentLines = logContent.split('\n').slice(-10).filter(line => line.trim());
        if (recentLines.length > 0) {
          console.log('\nRecent Log Entries:');
          recentLines.forEach(line => console.log(`  ${line}`));
        }
      } catch (e) {
        // Log file doesn't exist or can't be read
      }

    } catch (error) {
      console.error('❌ Failed to get daemon status:', error.message);
      process.exit(1);
    }
  }

  async restart() {
    console.log('🔄 Restarting VERSATIL Security Daemon...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  async isDaemonRunning() {
    try {
      const pid = await this.getDaemonPid();
      if (!pid) return false;

      // Check if process is actually running
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getDaemonPid() {
    try {
      const pidContent = await fs.readFile(PID_FILE, 'utf8');
      return parseInt(pidContent.trim(), 10);
    } catch (error) {
      return null;
    }
  }

  async ensureCompiled() {
    const daemonDist = join(FRAMEWORK_ROOT, 'dist', 'security', 'security-daemon.js');

    try {
      await fs.access(daemonDist);
    } catch (error) {
      console.log('📦 Compiling TypeScript security modules...');
      await this.execAsync('pnpm run build:security', { cwd: FRAMEWORK_ROOT });
    }
  }

  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}

// CLI Interface
async function main() {
  const manager = new SecurityDaemonManager();
  const command = process.argv[2] || 'start';

  switch (command) {
    case 'start':
      await manager.start();
      break;
    case 'stop':
      await manager.stop();
      break;
    case 'restart':
      await manager.restart();
      break;
    case 'status':
      await manager.status();
      break;
    default:
      console.log('Usage: node start-security-daemon.cjs [start|stop|restart|status] [--verbose]');
      console.log('');
      console.log('Commands:');
      console.log('  start    Start the security daemon');
      console.log('  stop     Stop the security daemon');
      console.log('  restart  Restart the security daemon');
      console.log('  status   Show daemon status and recent logs');
      console.log('');
      console.log('Options:');
      console.log('  --verbose, -v    Show verbose output');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SecurityDaemonManager };