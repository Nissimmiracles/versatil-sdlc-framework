#!/usr/bin/env node
/**
 * VERSATIL Security Daemon
 * Real-time enforcement of microsegmentation and security boundaries
 * Runs continuously to protect framework and project isolation
 */
import { promises as fs } from 'fs';
import { join, resolve, relative } from 'path';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import chokidar from 'chokidar';
import { IntegratedSecurityOrchestrator } from './integrated-security-orchestrator.js';
import { MicrosegmentationFramework } from './microsegmentation-framework.js';
import { ZeroTrustProjectIsolation } from './zero-trust-project-isolation.js';
import { BoundaryEnforcementEngine } from './boundary-enforcement-engine.js';
import { PathTraversalPrevention } from './path-traversal-prevention.js';
const execAsync = promisify(exec);
export class SecurityDaemon extends EventEmitter {
    constructor(config) {
        super();
        this.isRunning = false;
        this.protectedPaths = new Set();
        this.allowedProjects = new Map();
        this.config = config;
        this.initializeSecuritySystems();
        this.setupProtectedPaths();
    }
    initializeSecuritySystems() {
        // Initialize security systems with appropriate parameters
        this.orchestrator = new IntegratedSecurityOrchestrator(this.config.frameworkRoot);
        this.microsegmentation = new MicrosegmentationFramework();
        this.zeroTrust = new ZeroTrustProjectIsolation(this.config.frameworkRoot);
        this.boundaryEngine = new BoundaryEnforcementEngine(this.config.frameworkRoot);
        this.pathPrevention = new PathTraversalPrevention(this.config.frameworkRoot);
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
            this.log('warn', 'Security daemon already running');
            return;
        }
        this.log('info', 'Starting VERSATIL Security Daemon...');
        try {
            // Security systems are initialized in constructor
            // No additional initialization needed
            // Start real-time monitoring
            await this.startFileSystemMonitoring();
            await this.startProcessMonitoring();
            await this.startNetworkMonitoring();
            // Set up security event handlers
            this.setupSecurityEventHandlers();
            this.isRunning = true;
            this.log('info', '🔒 Security Daemon is now protecting the system');
            this.emit('daemon-started');
        }
        catch (error) {
            this.log('error', `Failed to start security daemon: ${error.message}`);
            throw error;
        }
    }
    async stop() {
        if (!this.isRunning)
            return;
        this.log('info', 'Stopping Security Daemon...');
        if (this.fileWatcher) {
            await this.fileWatcher.close();
        }
        // Security systems cleanup (orchestrator doesn't have shutdown method)
        this.isRunning = false;
        this.emit('daemon-stopped');
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
            // Log event (orchestrator doesn't have logSecurityEvent method)
            this.log('debug', `Filesystem event: ${event} on ${filePath}`);
        }
        catch (error) {
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
        // Check for path traversal attempts (using available method)
        const traversalAttempts = await this.pathPrevention.getTraversalAttempts();
        if (traversalAttempts.length > 0) {
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
        }
        catch (error) {
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
        this.log('warn', `Security violation detected: ${violation.response} - ${filePath}`);
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
        // Log security incident (using available method)
        this.log('warn', `Security violation: ${violation.type} - ${violation.response} at ${filePath}`);
    }
    async blockAccess(filePath) {
        try {
            // Attempt to remove the file/directory
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                await fs.rmdir(filePath, { recursive: true });
            }
            else {
                await fs.unlink(filePath);
            }
            this.log('info', `Blocked and removed: ${filePath}`);
        }
        catch (error) {
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
            this.log('info', `Quarantined file: ${filePath} -> ${quarantinePath}`);
        }
        catch (error) {
            this.log('error', `Failed to quarantine: ${filePath} - ${error.message}`);
        }
    }
    async repairViolation(filePath) {
        // Implementation depends on violation type
        this.log('info', `Attempting to repair violation at: ${filePath}`);
    }
    async alertViolation(filePath, violation) {
        this.log('warn', `SECURITY ALERT: ${violation.response} at ${filePath}`);
        this.emit('security-alert', { filePath, violation });
    }
    async startProcessMonitoring() {
        // Monitor for suspicious process creation
        setInterval(async () => {
            await this.checkSuspiciousProcesses();
        }, 5000); // Check every 5 seconds
    }
    async startNetworkMonitoring() {
        // Basic network monitoring
        this.log('info', 'Network monitoring initialized');
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
        }
        catch (error) {
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
        this.log('warn', `Suspicious process detected: ${processLine}`);
        // Could attempt to kill the process, but that might be too aggressive
        this.emit('suspicious-process', { process: processLine });
    }
    setupSecurityEventHandlers() {
        this.orchestrator.on('security-incident', (incident) => {
            this.log('warn', `Security incident: ${incident.description}`);
        });
        this.microsegmentation.on('boundary-violation', (violation) => {
            this.log('error', `Boundary violation: ${violation.description}`);
        });
        this.zeroTrust.on('trust-violation', (violation) => {
            this.log('error', `Trust violation: ${violation.description}`);
        });
    }
    log(level, message) {
        const timestamp = new Date().toISOString();
        const logLevels = ['debug', 'info', 'warn', 'error'];
        const configLevel = logLevels.indexOf(this.config.logLevel);
        const messageLevel = logLevels.indexOf(level);
        if (messageLevel >= configLevel) {
            console.log(`[${timestamp}] [SECURITY-DAEMON] [${level.toUpperCase()}] ${message}`);
        }
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            protectedPaths: Array.from(this.protectedPaths),
            allowedProjects: Object.fromEntries(this.allowedProjects),
            uptime: this.isRunning ? Date.now() - this.startTime : 0
        };
    }
}
// CLI interface when run directly
if (require.main === module) {
    const frameworkRoot = process.env.VERSATIL_FRAMEWORK_ROOT || process.cwd();
    const versatilHome = process.env.VERSATIL_HOME || join(require('os').homedir(), '.versatil');
    const daemon = new SecurityDaemon({
        frameworkRoot,
        versatilHome,
        monitoringEnabled: true,
        realTimeEnforcement: true,
        autoRepair: true,
        logLevel: 'info'
    });
    process.on('SIGINT', async () => {
        console.log('\nShutting down Security Daemon...');
        await daemon.stop();
        process.exit(0);
    });
    daemon.start().catch(console.error);
}
//# sourceMappingURL=security-daemon.js.map