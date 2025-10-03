#!/usr/bin/env node

/**
 * VERSATIL Security Manager
 * Manages the security enforcer daemon with proper process handling
 */

const { spawn, exec } = require('child_process');
const { join } = require('path');
const { promises: fs } = require('fs');
const os = require('os');

const FRAMEWORK_ROOT = process.cwd();
const VERSATIL_HOME = process.env.VERSATIL_HOME || join(os.homedir(), '.versatil');
const PID_FILE = join(VERSATIL_HOME, 'security', 'enforcer.pid');
const LOG_FILE = join(VERSATIL_HOME, 'security', 'enforcer.log');

class SecurityManager {
  constructor() {
    this.isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  }

  async start() {
    console.log('🔒 Starting VERSATIL Security Enforcer...');

    try {
      // Check if enforcer is already running
      if (await this.isEnforcerRunning()) {
        console.log('✅ Security enforcer is already running');
        return;
      }

      // Ensure security directory exists
      await fs.mkdir(join(VERSATIL_HOME, 'security'), { recursive: true });

      // Create environment variables for the enforcer
      const env = {
        ...process.env,
        VERSATIL_FRAMEWORK_ROOT: FRAMEWORK_ROOT,
        VERSATIL_HOME: VERSATIL_HOME,
        NODE_ENV: 'security'
      };

      // Start the enforcer process
      const enforcerScript = join(FRAMEWORK_ROOT, 'scripts', 'security-enforcer.cjs');

      const enforcer = spawn('node', [enforcerScript], {
        env,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Save PID for later management
      await fs.writeFile(PID_FILE, enforcer.pid.toString());

      // Set up logging
      const logStream = require('fs').createWriteStream(LOG_FILE, { flags: 'a' });
      enforcer.stdout.pipe(logStream);
      enforcer.stderr.pipe(logStream);

      if (this.isVerbose) {
        enforcer.stdout.pipe(process.stdout);
        enforcer.stderr.pipe(process.stderr);
      }

      // Detach the process so it runs independently
      enforcer.unref();

      console.log(`✅ Security enforcer started successfully (PID: ${enforcer.pid})`);
      console.log(`📄 Logs: ${LOG_FILE}`);
      console.log('🛡️  Real-time security enforcement is now active');

      // Wait a moment to ensure it started properly
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (await this.isEnforcerRunning()) {
        console.log('🔐 Security enforcer confirmed running');
      } else {
        throw new Error('Enforcer failed to start properly');
      }

    } catch (error) {
      console.error('❌ Failed to start security enforcer:', error.message);
      process.exit(1);
    }
  }

  async stop() {
    console.log('🛑 Stopping VERSATIL Security Enforcer...');

    try {
      const pid = await this.getEnforcerPid();
      if (!pid) {
        console.log('ℹ️  Security enforcer is not running');
        return;
      }

      // Send SIGTERM to gracefully shutdown
      process.kill(pid, 'SIGTERM');

      // Wait for shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if it's still running
      if (await this.isEnforcerRunning()) {
        console.log('⚠️  Enforcer didn\'t stop gracefully, force killing...');
        process.kill(pid, 'SIGKILL');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Clean up PID file
      try {
        await fs.unlink(PID_FILE);
      } catch (e) {
        // PID file might not exist
      }

      console.log('✅ Security enforcer stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop security enforcer:', error.message);
      process.exit(1);
    }
  }

  async status() {
    try {
      const isRunning = await this.isEnforcerRunning();
      const pid = await this.getEnforcerPid();

      console.log('🔒 VERSATIL Security Enforcer Status');
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
      console.error('❌ Failed to get enforcer status:', error.message);
      process.exit(1);
    }
  }

  async restart() {
    console.log('🔄 Restarting VERSATIL Security Enforcer...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  async isEnforcerRunning() {
    try {
      const pid = await this.getEnforcerPid();
      if (!pid) return false;

      // Check if process is actually running
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getEnforcerPid() {
    try {
      const pidContent = await fs.readFile(PID_FILE, 'utf8');
      return parseInt(pidContent.trim(), 10);
    } catch (error) {
      return null;
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
  const manager = new SecurityManager();
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
      console.log('Usage: node security-manager.cjs [start|stop|restart|status] [--verbose]');
      console.log('');
      console.log('Commands:');
      console.log('  start    Start the security enforcer');
      console.log('  stop     Stop the security enforcer');
      console.log('  restart  Restart the security enforcer');
      console.log('  status   Show enforcer status and recent logs');
      console.log('');
      console.log('Options:');
      console.log('  --verbose, -v    Show verbose output');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SecurityManager };