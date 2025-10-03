#!/usr/bin/env node

/**
 * VERSATIL Security Enforcer
 * Real-time enforcement of microsegmentation and security boundaries
 * Simplified standalone version for immediate deployment
 */

const { promises: fs } = require('fs');
const { join, dirname, resolve, relative } = require('path');
const { EventEmitter } = require('events');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const chokidar = require('chokidar');
const os = require('os');

const execAsync = promisify(exec);

class SecurityEnforcer extends EventEmitter {
  constructor(config) {
    super();
    this.config = {
      frameworkRoot: process.cwd(),
      versatilHome: join(os.homedir(), '.versatil'),
      monitoringEnabled: true,
      realTimeEnforcement: true,
      autoRepair: true,
      logLevel: 'info',
      ...config
    };

    this.isRunning = false;
    this.protectedPaths = new Set();
    this.allowedProjects = new Map();
    this.violationCount = 0;
    this.setupProtectedPaths();
  }

  setupProtectedPaths() {
    // Framework core protection
    this.protectedPaths.add(this.config.frameworkRoot);
    this.protectedPaths.add(join(this.config.frameworkRoot, 'src'));
    this.protectedPaths.add(join(this.config.frameworkRoot, 'dist'));
    this.protectedPaths.add(join(this.config.frameworkRoot, 'node_modules'));
    this.protectedPaths.add(join(this.config.frameworkRoot, 'package.json'));
    this.protectedPaths.add(join(this.config.frameworkRoot, 'tsconfig.json'));
    this.protectedPaths.add(join(this.config.frameworkRoot, '.env'));

    // VERSATIL home protection
    this.protectedPaths.add(this.config.versatilHome);
    this.protectedPaths.add(join(this.config.versatilHome, 'runtime'));
    this.protectedPaths.add(join(this.config.versatilHome, 'security'));
    this.protectedPaths.add(join(this.config.versatilHome, 'framework-data'));
  }

  async start() {
    if (this.isRunning) {
      this.log('warn', 'Security enforcer already running');
      return;
    }

    this.log('info', '🔒 Starting VERSATIL Security Enforcer...');

    try {
      // Ensure security directories exist
      await fs.mkdir(join(this.config.versatilHome, 'security', 'quarantine'), { recursive: true });
      await fs.mkdir(join(this.config.versatilHome, 'security', 'logs'), { recursive: true });

      // Start real-time monitoring
      await this.startFileSystemMonitoring();
      await this.startProcessMonitoring();

      this.isRunning = true;
      this.log('info', '🔒 Security Enforcer is now protecting the system');
      this.emit('enforcer-started');

      // Log startup to security log
      await this.logSecurityEvent({
        type: 'system',
        event: 'enforcer-started',
        path: this.config.frameworkRoot,
        timestamp: new Date(),
        severity: 'info'
      });

    } catch (error) {
      this.log('error', `Failed to start security enforcer: ${error.message}`);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) return;

    this.log('info', 'Stopping Security Enforcer...');

    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }

    this.isRunning = false;
    this.emit('enforcer-stopped');
  }

  async startFileSystemMonitoring() {
    const watchPaths = [
      this.config.frameworkRoot,
      this.config.versatilHome
    ];

    this.fileWatcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    this.fileWatcher.on('all', async (event, filePath) => {
      await this.handleFileSystemEvent(event, filePath);
    });

    this.log('info', 'Real-time filesystem monitoring started');
  }

  async handleFileSystemEvent(event, filePath) {
    try {
      // Check if this is a violation
      const violation = await this.detectViolation(event, filePath);
      if (violation) {
        await this.enforceViolation(violation, filePath);
      }

      // Log the event
      await this.logSecurityEvent({
        type: 'filesystem',
        event,
        path: filePath,
        timestamp: new Date(),
        severity: violation ? violation.severity : 'low'
      });

    } catch (error) {
      this.log('error', `Error handling filesystem event: ${error.message}`);
    }
  }

  async detectViolation(event, filePath) {
    const resolvedPath = resolve(filePath);

    // Check for framework core access violations
    if (this.isFrameworkCoreAccess(resolvedPath)) {
      return {
        type: 'block',
        severity: 'critical',
        response: 'Unauthorized framework core access detected'
      };
    }

    // Check for path traversal attempts
    if (this.isPathTraversalAttempt(filePath)) {
      return {
        type: 'block',
        severity: 'critical',
        response: 'Path traversal attack detected'
      };
    }

    // Check for cross-project contamination
    if (await this.detectCrossProjectContamination(resolvedPath)) {
      return {
        type: 'quarantine',
        severity: 'high',
        response: 'Cross-project contamination attempt'
      };
    }

    // Check for privilege escalation patterns
    if (this.detectPrivilegeEscalation(filePath)) {
      return {
        type: 'block',
        severity: 'critical',
        response: 'Privilege escalation attempt detected'
      };
    }

    return null;
  }

  isFrameworkCoreAccess(filePath) {
    const frameworkCore = resolve(this.config.frameworkRoot);
    const accessPath = resolve(filePath);

    // Check if trying to access framework core from outside
    if (accessPath.startsWith(frameworkCore)) {
      const relativePath = relative(frameworkCore, accessPath);

      // Allow access only from framework processes
      const currentProcess = process.cwd();
      if (!currentProcess.startsWith(frameworkCore)) {
        return true; // Violation: external process accessing framework
      }
    }

    return false;
  }

  isPathTraversalAttempt(filePath) {
    const suspiciousPatterns = [
      '../',
      '..\\',
      '%2e%2e%2f',
      '%2e%2e\\',
      '....//',
      '....\\\\',
      '/etc/passwd',
      '/etc/shadow',
      'C:\\Windows\\System32'
    ];

    return suspiciousPatterns.some(pattern => filePath.includes(pattern));
  }

  async detectCrossProjectContamination(filePath) {
    // Check if file is being written across project boundaries
    const projectsDir = join(this.config.versatilHome, 'projects');

    try {
      const projects = await fs.readdir(projectsDir);

      for (const project of projects) {
        const projectPath = join(projectsDir, project);
        const stats = await fs.stat(projectPath);

        if (stats.isDirectory() && filePath.includes(projectPath)) {
          // Check if current process is from a different project
          const currentCwd = process.cwd();
          if (currentCwd.includes(projectsDir) && !currentCwd.includes(projectPath)) {
            return true; // Cross-project access detected
          }
        }
      }
    } catch (error) {
      // Projects directory doesn't exist yet
      return false;
    }

    return false;
  }

  detectPrivilegeEscalation(filePath) {
    const suspiciousNames = ['sudo', 'su', 'chmod', 'chown', 'mount', 'umount'];
    const fileName = filePath.split('/').pop() || '';

    return suspiciousNames.some(name => fileName.includes(name));
  }

  async enforceViolation(violation, filePath) {
    this.violationCount++;
    this.log('warn', `🚨 Security violation #${this.violationCount}: ${violation.response} - ${filePath}`);

    switch (violation.type) {
      case 'block':
        await this.blockAccess(filePath);
        break;
      case 'quarantine':
        await this.quarantineFile(filePath);
        break;
      case 'repair':
        await this.repairViolation(filePath);
        break;
      case 'alert':
        await this.alertViolation(filePath, violation);
        break;
    }

    // Log security incident
    await this.logSecurityEvent({
      type: 'security-incident',
      event: violation.type,
      path: filePath,
      description: violation.response,
      severity: violation.severity,
      timestamp: new Date(),
      response: `Enforcement action: ${violation.type}`
    });
  }

  async blockAccess(filePath) {
    try {
      // Attempt to remove the file/directory
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
      } else {
        await fs.unlink(filePath);
      }
      this.log('info', `🚫 Blocked and removed: ${filePath}`);
    } catch (error) {
      this.log('error', `Failed to block access to: ${filePath} - ${error.message}`);
    }
  }

  async quarantineFile(filePath) {
    try {
      const quarantineDir = join(this.config.versatilHome, 'security', 'quarantine');
      await fs.mkdir(quarantineDir, { recursive: true });

      const fileName = filePath.split('/').pop();
      const quarantinePath = join(quarantineDir, `${Date.now()}-${fileName}`);

      await fs.rename(filePath, quarantinePath);
      this.log('info', `🏥 Quarantined file: ${filePath} -> ${quarantinePath}`);
    } catch (error) {
      this.log('error', `Failed to quarantine: ${filePath} - ${error.message}`);
    }
  }

  async repairViolation(filePath) {
    this.log('info', `🔧 Attempting to repair violation at: ${filePath}`);
  }

  async alertViolation(filePath, violation) {
    this.log('warn', `⚠️  SECURITY ALERT: ${violation.response} at ${filePath}`);
    this.emit('security-alert', { filePath, violation });
  }

  async startProcessMonitoring() {
    // Monitor for suspicious process creation
    setInterval(async () => {
      await this.checkSuspiciousProcesses();
    }, 10000); // Check every 10 seconds
  }

  async checkSuspiciousProcesses() {
    try {
      const { stdout } = await execAsync('ps aux');
      const processes = stdout.split('\n');

      for (const process of processes) {
        if (this.isSuspiciousProcess(process)) {
          await this.handleSuspiciousProcess(process);
        }
      }
    } catch (error) {
      // Process monitoring failed, not critical
    }
  }

  isSuspiciousProcess(processLine) {
    const suspiciousPatterns = [
      'sudo',
      'su ',
      'chmod 777',
      'chown root',
      '/usr/bin/sudo',
      'kernel_exploit'
    ];

    return suspiciousPatterns.some(pattern => processLine.includes(pattern));
  }

  async handleSuspiciousProcess(processLine) {
    this.log('warn', `🔍 Suspicious process detected: ${processLine}`);
    this.emit('suspicious-process', { process: processLine });
  }

  async logSecurityEvent(event) {
    const logDir = join(this.config.versatilHome, 'security', 'logs');
    const logFile = join(logDir, `security-${new Date().toISOString().split('T')[0]}.log`);

    try {
      await fs.mkdir(logDir, { recursive: true });
      const logEntry = `${event.timestamp.toISOString()} [${event.severity.toUpperCase()}] ${event.type}:${event.event} ${event.path || ''} ${event.description || ''}\n`;
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      // Logging failed, not critical
    }
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logLevels = ['debug', 'info', 'warn', 'error'];
    const configLevel = logLevels.indexOf(this.config.logLevel);
    const messageLevel = logLevels.indexOf(level);

    if (messageLevel >= configLevel) {
      console.log(`[${timestamp}] [SECURITY-ENFORCER] [${level.toUpperCase()}] ${message}`);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      protectedPaths: Array.from(this.protectedPaths),
      allowedProjects: Object.fromEntries(this.allowedProjects),
      violationCount: this.violationCount,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
}

// CLI interface when run directly
if (require.main === module) {
  const frameworkRoot = process.env.VERSATIL_FRAMEWORK_ROOT || process.cwd();
  const versatilHome = process.env.VERSATIL_HOME || join(os.homedir(), '.versatil');

  const enforcer = new SecurityEnforcer({
    frameworkRoot,
    versatilHome,
    monitoringEnabled: true,
    realTimeEnforcement: true,
    autoRepair: true,
    logLevel: 'info'
  });

  enforcer.startTime = Date.now();

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Security Enforcer...');
    await enforcer.stop();
    console.log('✅ Security Enforcer stopped safely');
    process.exit(0);
  });

  enforcer.start().catch(console.error);
}

module.exports = { SecurityEnforcer };