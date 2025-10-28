/**
 * VERSATIL SDLC Framework - Credential Loader
 * Runtime credential injection with project isolation and memory safety
 *
 * Security Features:
 * - Load credentials only for active project
 * - Inject into process.env at runtime (not global)
 * - Clear from memory after use
 * - Audit all credential access
 * - Prevent cross-project contamination
 */
import * as path from 'path';
import { getCredentialEncryptor } from './credential-encryptor.js';
import { getCredentialAuditLogger } from './credential-audit-logger.js';
import { VERSATILLogger } from '../utils/logger.js';
export class CredentialLoader {
    constructor() {
        this.encryptor = getCredentialEncryptor();
        this.auditLogger = getCredentialAuditLogger();
        // Track loaded credentials for cleanup
        this.loadedEnvVars = new Set();
        this.clearTimers = new Map();
        this.logger = new VERSATILLogger('CredentialLoader');
    }
    /**
     * Load credentials for a project into process.env
     */
    async loadCredentials(options) {
        const startTime = Date.now();
        try {
            this.logger.info('Loading credentials', {
                projectId: options.projectId,
                services: options.services
            });
            // Build file path
            const credentialsPath = path.join(options.projectPath, '.versatil', 'credentials.json');
            // Build encryption context
            const context = {
                projectPath: options.projectPath,
                projectId: options.projectId
            };
            // Load and decrypt credentials
            const credentials = await this.encryptor.decryptFromFile(credentialsPath, context, options.password);
            // Filter by requested services (if specified)
            const servicesToLoad = options.services
                ? Object.keys(credentials).filter(s => options.services.includes(s))
                : Object.keys(credentials);
            // Inject into process.env
            let loadedCount = 0;
            for (const service of servicesToLoad) {
                const serviceCreds = credentials[service];
                for (const [key, value] of Object.entries(serviceCreds)) {
                    // Store original value if exists (for restoration)
                    if (process.env[key] !== undefined && !this.loadedEnvVars.has(key)) {
                        this.logger.warn('Environment variable already exists, overwriting', {
                            key,
                            service
                        });
                    }
                    // Inject credential
                    process.env[key] = value;
                    this.loadedEnvVars.add(key);
                    loadedCount++;
                    // Audit log
                    const event = {
                        timestamp: new Date(),
                        projectId: options.projectId,
                        projectPath: options.projectPath,
                        service,
                        credentialKey: key,
                        action: 'load',
                        success: true
                    };
                    await this.auditLogger.logAccess(event);
                }
            }
            // Schedule automatic cleanup if requested
            const clearAfter = options.clearAfter ?? 60000; // Default: 1 minute
            if (clearAfter > 0) {
                const timer = setTimeout(() => {
                    this.clearLoadedCredentials(options.projectId);
                }, clearAfter);
                this.clearTimers.set(options.projectId, timer);
            }
            const result = {
                services: servicesToLoad,
                loadedAt: new Date(),
                expiresAt: clearAfter > 0 ? new Date(Date.now() + clearAfter) : undefined,
                count: loadedCount
            };
            this.logger.info('Credentials loaded successfully', {
                projectId: options.projectId,
                services: servicesToLoad.length,
                credentials: loadedCount,
                duration: Date.now() - startTime
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to load credentials', { error, options });
            // Audit log failure
            const event = {
                timestamp: new Date(),
                projectId: options.projectId,
                projectPath: options.projectPath,
                service: 'all',
                credentialKey: 'all',
                action: 'load',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
            await this.auditLogger.logAccess(event);
            throw new Error(`Failed to load credentials: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Clear loaded credentials from process.env
     */
    clearLoadedCredentials(projectId) {
        try {
            this.logger.info('Clearing loaded credentials', { projectId });
            // Clear environment variables
            for (const key of this.loadedEnvVars) {
                delete process.env[key];
            }
            const count = this.loadedEnvVars.size;
            this.loadedEnvVars.clear();
            // Clear timers
            if (projectId && this.clearTimers.has(projectId)) {
                clearTimeout(this.clearTimers.get(projectId));
                this.clearTimers.delete(projectId);
            }
            this.logger.info('Credentials cleared from memory', {
                projectId,
                count
            });
        }
        catch (error) {
            this.logger.error('Failed to clear credentials', { error, projectId });
        }
    }
    /**
     * Get loaded credential keys (for debugging/validation)
     */
    getLoadedKeys() {
        return Array.from(this.loadedEnvVars);
    }
    /**
     * Check if specific credential is loaded
     */
    isCredentialLoaded(key) {
        return this.loadedEnvVars.has(key);
    }
    /**
     * Scoped credential execution - load, execute function, clear
     * Best practice for short-lived credential usage
     */
    async withCredentials(options, fn) {
        let loaded = false;
        try {
            // Load credentials
            await this.loadCredentials({
                ...options,
                clearAfter: 0 // Manual cleanup
            });
            loaded = true;
            // Execute function with credentials available
            const result = await fn();
            return result;
        }
        finally {
            // Always clear credentials after execution
            if (loaded) {
                this.clearLoadedCredentials(options.projectId);
            }
        }
    }
    /**
     * Load specific service credentials (optimization)
     */
    async loadServiceCredentials(projectPath, projectId, service) {
        const startTime = Date.now();
        try {
            this.logger.info('Loading service credentials', { projectId, service });
            // Build file path
            const credentialsPath = path.join(projectPath, '.versatil', 'credentials.json');
            // Build encryption context
            const context = {
                projectPath,
                projectId
            };
            // Load and decrypt credentials
            const credentials = await this.encryptor.decryptFromFile(credentialsPath, context);
            // Get service credentials
            const serviceCreds = credentials[service] || {};
            // Audit log
            const event = {
                timestamp: new Date(),
                projectId,
                projectPath,
                service,
                credentialKey: 'all',
                action: 'read',
                success: true,
                metadata: {
                    duration: Date.now() - startTime,
                    keyCount: Object.keys(serviceCreds).length
                }
            };
            await this.auditLogger.logAccess(event);
            return serviceCreds;
        }
        catch (error) {
            this.logger.error('Failed to load service credentials', {
                error,
                projectId,
                service
            });
            // Audit log failure
            const event = {
                timestamp: new Date(),
                projectId,
                projectPath,
                service,
                credentialKey: 'all',
                action: 'read',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
            await this.auditLogger.logAccess(event);
            throw new Error(`Failed to load service credentials: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if project has credentials configured
     */
    async hasCredentials(projectPath) {
        const credentialsPath = path.join(projectPath, '.versatil', 'credentials.json');
        try {
            const fs = await import('fs/promises');
            await fs.access(credentialsPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * List configured services for a project
     */
    async listConfiguredServices(projectPath, projectId) {
        try {
            const credentialsPath = path.join(projectPath, '.versatil', 'credentials.json');
            const context = {
                projectPath,
                projectId
            };
            const credentials = await this.encryptor.decryptFromFile(credentialsPath, context);
            return Object.keys(credentials);
        }
        catch (error) {
            this.logger.warn('Failed to list configured services', { error, projectPath });
            return [];
        }
    }
    /**
     * Cleanup all timers on process exit
     */
    cleanup() {
        this.clearLoadedCredentials();
        for (const timer of this.clearTimers.values()) {
            clearTimeout(timer);
        }
        this.clearTimers.clear();
    }
}
/**
 * Singleton instance
 */
let loaderInstance = null;
export function getCredentialLoader() {
    if (!loaderInstance) {
        loaderInstance = new CredentialLoader();
        // Register cleanup on process exit
        process.on('exit', () => {
            loaderInstance?.cleanup();
        });
        process.on('SIGINT', () => {
            loaderInstance?.cleanup();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            loaderInstance?.cleanup();
            process.exit(0);
        });
    }
    return loaderInstance;
}
//# sourceMappingURL=credential-loader.js.map