/**
 * VERSATIL MCP Profile Manager
 * Handles profile switching with hot-reload and rollback capabilities
 */
import { ModuleLoader, MODULE_REGISTRY } from './module-loader.js';
import { VERSATILLogger } from '../../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
// Simple async lock for profile switching
class AsyncLock {
    constructor() {
        this.locked = false;
        this.queue = [];
    }
    async acquire(key, callback) {
        while (this.locked) {
            await new Promise(resolve => this.queue.push(resolve));
        }
        this.locked = true;
        try {
            return await callback();
        }
        finally {
            this.locked = false;
            const next = this.queue.shift();
            if (next)
                next();
        }
    }
}
export class ProfileManager {
    constructor(server, configPath, logger) {
        this.currentProfile = 'coding';
        this.switchLock = new AsyncLock();
        this.config = null;
        this.server = server;
        this.moduleLoader = new ModuleLoader(server, logger);
        this.logger = logger || new VERSATILLogger('ProfileManager');
        this.configPath = configPath || path.join(process.cwd(), 'mcp-profiles.config.json');
    }
    /**
     * Initialize profile manager and load configuration
     */
    async initialize() {
        await this.loadConfiguration();
        this.logger.info('ProfileManager initialized', {
            profiles: Object.keys(this.config?.profiles || {}),
            currentProfile: this.currentProfile,
        });
    }
    /**
     * Load profile configuration from file
     */
    async loadConfiguration() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            this.config = JSON.parse(configData);
            this.logger.info('Profile configuration loaded', {
                version: this.config?.version,
                profiles: Object.keys(this.config?.profiles || {}),
            });
        }
        catch (error) {
            this.logger.error('Failed to load profile configuration', { error });
            throw new Error(`Failed to load profile config from ${this.configPath}: ${error}`);
        }
    }
    /**
     * Switch to a new profile with hot-reload
     */
    async switchProfile(newProfile, force = false) {
        return this.switchLock.acquire('profile-switch', async () => {
            const startTime = Date.now();
            const fromProfile = this.currentProfile;
            this.logger.info(`Switching profile: ${fromProfile} → ${newProfile}`, { force });
            // Validate profile exists
            if (!this.config?.profiles[newProfile]) {
                return {
                    success: false,
                    fromProfile,
                    toProfile: newProfile,
                    modulesKept: 0,
                    modulesUnloaded: 0,
                    modulesLoaded: 0,
                    switchTimeMs: Date.now() - startTime,
                    error: `Profile '${newProfile}' not found in configuration`,
                };
            }
            try {
                // Get module differences
                const oldModules = this.getModulesForProfile(fromProfile);
                const newModules = this.getModulesForProfile(newProfile);
                const toUnload = oldModules.filter(m => !newModules.includes(m));
                const toLoad = newModules.filter(m => !oldModules.includes(m));
                const toKeep = oldModules.filter(m => newModules.includes(m));
                this.logger.info('Profile switch plan', {
                    keep: toKeep.length,
                    unload: toUnload.length,
                    load: toLoad.length,
                });
                // Phase 1: Unload modules (with timeout)
                try {
                    await Promise.race([
                        this.unloadModules(toUnload),
                        this.timeout(5000, 'Module unload timeout'),
                    ]);
                }
                catch (error) {
                    this.logger.warn('Module unload timed out or failed', { error });
                }
                // Phase 2: Load new modules
                let loadErrors = [];
                for (const moduleId of toLoad) {
                    const result = await this.moduleLoader.loadModule(moduleId);
                    if (result.status === 'failed') {
                        loadErrors.push(`${moduleId}: ${result.error}`);
                    }
                }
                // Check if we should rollback
                if (loadErrors.length > 0 && !force) {
                    this.logger.error('Profile switch failed, rolling back', { errors: loadErrors });
                    // Rollback: reload old modules
                    for (const moduleId of toUnload) {
                        await this.moduleLoader.loadModule(moduleId);
                    }
                    return {
                        success: false,
                        fromProfile,
                        toProfile: newProfile,
                        modulesKept: toKeep.length,
                        modulesUnloaded: toUnload.length,
                        modulesLoaded: 0,
                        switchTimeMs: Date.now() - startTime,
                        error: `Failed to load modules: ${loadErrors.join(', ')}`,
                    };
                }
                // Phase 3: Update current profile (atomic)
                this.currentProfile = newProfile;
                const switchTimeMs = Date.now() - startTime;
                this.logger.info('Profile switch completed', {
                    fromProfile,
                    toProfile: newProfile,
                    modulesKept: toKeep.length,
                    modulesUnloaded: toUnload.length,
                    modulesLoaded: toLoad.length,
                    switchTimeMs,
                    errors: loadErrors.length,
                });
                // Emit notification (if server supports)
                const serverAsAny = this.server;
                if (typeof serverAsAny.notification === 'function') {
                    try {
                        await serverAsAny.notification({
                            method: 'profile/changed',
                            params: {
                                from: fromProfile,
                                to: newProfile,
                                kept: toKeep.length,
                                unloaded: toUnload.length,
                                loaded: toLoad.length,
                                switchTimeMs,
                            },
                        });
                    }
                    catch (error) {
                        this.logger.debug('Failed to send profile change notification', { error });
                    }
                }
                return {
                    success: true,
                    fromProfile,
                    toProfile: newProfile,
                    modulesKept: toKeep.length,
                    modulesUnloaded: toUnload.length,
                    modulesLoaded: toLoad.length,
                    switchTimeMs,
                };
            }
            catch (error) {
                this.logger.error('Profile switch failed with exception', { error });
                return {
                    success: false,
                    fromProfile,
                    toProfile: newProfile,
                    modulesKept: 0,
                    modulesUnloaded: 0,
                    modulesLoaded: 0,
                    switchTimeMs: Date.now() - startTime,
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        });
    }
    /**
     * Recommend a profile based on context
     */
    async recommendProfile(context) {
        // Priority 1: User explicit preference
        if (context.userPreference && this.config?.profiles[context.userPreference]) {
            return {
                profile: context.userPreference,
                confidence: 1.0,
                reason: 'User explicitly selected this profile',
            };
        }
        // Priority 2: Agent override
        if (context.agent && this.config?.agentOverrides?.[context.agent]) {
            const profile = this.config.agentOverrides[context.agent];
            return {
                profile,
                confidence: 0.95,
                reason: `Agent '${context.agent}' default profile`,
            };
        }
        // Priority 3: File-based heuristics
        if (context.recentFiles && context.recentFiles.length > 0) {
            const filePatterns = this.config?.profileDetection?.heuristics?.file_patterns || {};
            for (const file of context.recentFiles) {
                for (const [pattern, profile] of Object.entries(filePatterns)) {
                    // Simple pattern matching (could be enhanced with glob)
                    if (this.matchesPattern(file, pattern)) {
                        return {
                            profile,
                            confidence: 0.85,
                            reason: `Detected ${pattern} file pattern`,
                        };
                    }
                }
            }
        }
        // Priority 4: Task keyword heuristics
        if (context.taskKeywords && context.taskKeywords.length > 0) {
            const taskKeywords = this.config?.profileDetection?.heuristics?.task_keywords || {};
            for (const keyword of context.taskKeywords) {
                if (taskKeywords[keyword]) {
                    return {
                        profile: taskKeywords[keyword],
                        confidence: 0.80,
                        reason: `Task keyword '${keyword}' detected`,
                    };
                }
            }
        }
        // Default: coding profile
        return {
            profile: 'coding',
            confidence: 0.70,
            reason: 'Default profile for general development',
        };
    }
    /**
     * Get modules for a profile (resolves extends)
     */
    getModulesForProfile(profileName) {
        const profile = this.config?.profiles[profileName];
        if (!profile)
            return [];
        let modules = [];
        // Handle 'extends'
        if (profile.extends) {
            modules = this.getModulesForProfile(profile.extends);
        }
        // Add this profile's modules
        if (profile.modules) {
            if (profile.modules.includes('*')) {
                // All modules
                modules = MODULE_REGISTRY.map(m => m.id);
            }
            else {
                modules = [...new Set([...modules, ...profile.modules])];
            }
        }
        return modules;
    }
    /**
     * Unload multiple modules
     */
    async unloadModules(moduleIds) {
        for (const moduleId of moduleIds) {
            await this.moduleLoader.unloadModule(moduleId);
        }
    }
    /**
     * Simple pattern matching (enhanced glob could be added)
     */
    matchesPattern(filename, pattern) {
        // Convert glob-like pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        return new RegExp(regexPattern).test(filename);
    }
    /**
     * Timeout helper
     */
    timeout(ms, message) {
        return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
    }
    /**
     * Get current profile
     */
    getCurrentProfile() {
        return this.currentProfile;
    }
    /**
     * Get profile definition
     */
    getProfileDefinition(profileName) {
        return this.config?.profiles[profileName];
    }
    /**
     * Get all available profiles
     */
    getAvailableProfiles() {
        return Object.keys(this.config?.profiles || {});
    }
    /**
     * Get profile configuration
     */
    getConfiguration() {
        return this.config;
    }
    /**
     * Get module loader
     */
    getModuleLoader() {
        return this.moduleLoader;
    }
    /**
     * Get profile statistics
     */
    getProfileStatistics() {
        const currentModules = this.getModulesForProfile(this.currentProfile);
        return {
            currentProfile: this.currentProfile,
            modulesLoaded: this.moduleLoader.getLoadedModules().length,
            toolsRegistered: this.moduleLoader.getRegisteredTools().size,
            loadStatistics: this.moduleLoader.getLoadStatistics(),
            expectedModules: currentModules,
        };
    }
}
//# sourceMappingURL=profile-manager.js.map