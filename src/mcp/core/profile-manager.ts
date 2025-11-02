/**
 * VERSATIL MCP Profile Manager
 * Handles profile switching with hot-reload and rollback capabilities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ModuleLoader, MODULE_REGISTRY } from './module-loader.js';
import { VERSATILLogger } from '../../utils/logger.js';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';
import * as fssync from 'fs';
import * as path from 'path';

export interface ProfileConfig {
  version: string;
  description: string;
  profiles: Record<string, ProfileDefinition>;
  agentOverrides?: Record<string, string>;
  profileDetection?: ProfileDetectionConfig;
  performance?: PerformanceTargets;
  compatibility?: CompatibilityConfig;
}

export interface ProfileDefinition {
  description: string;
  modules?: string[];
  extends?: string;
  expectedStartupTime?: string;
  expectedMemoryMB?: number;
  toolCount?: number;
  tools?: string[];
  additionalTools?: string[];
  warning?: string;
}

export interface ProfileDetectionConfig {
  enabled: boolean;
  heuristics?: {
    file_patterns?: Record<string, string>;
    task_keywords?: Record<string, string>;
  };
}

export interface PerformanceTargets {
  startup_target_ms: number;
  memory_target_mb: number;
  tool_latency_target_ms: number;
  profile_switch_target_ms: number;
}

export interface CompatibilityConfig {
  backward_compatible: boolean;
  tool_aliases_enabled: boolean;
  deprecation_window_versions: number;
  migration_guide_url: string;
}

export interface ProfileSwitchResult {
  success: boolean;
  fromProfile: string;
  toProfile: string;
  modulesKept: number;
  modulesUnloaded: number;
  modulesLoaded: number;
  switchTimeMs: number;
  error?: string;
}

export interface AgentContext {
  agent?: string;
  recentFiles?: string[];
  taskKeywords?: string[];
  userPreference?: string;
}

export interface ProfileRecommendation {
  profile: string;
  confidence: number;
  reason: string;
}

// Simple async lock for profile switching
class AsyncLock {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(key: string, callback: () => Promise<any>): Promise<any> {
    while (this.locked) {
      await new Promise(resolve => this.queue.push(resolve as () => void));
    }

    this.locked = true;
    try {
      return await callback();
    } finally {
      this.locked = false;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

export class ProfileManager {
  private currentProfile: string = 'coding';
  private moduleLoader: ModuleLoader;
  private switchLock = new AsyncLock();
  private logger: VERSATILLogger;
  private server: Server | McpServer;
  private config: ProfileConfig | null = null;
  private configPath: string;

  constructor(server: Server | McpServer, configPath?: string, logger?: VERSATILLogger) {
    this.server = server;
    this.moduleLoader = new ModuleLoader(server, logger);
    this.logger = logger || new VERSATILLogger('ProfileManager');

    // Path resolution priority:
    // 1. Explicit configPath parameter
    // 2. Framework installation directory (for npx/npm installs)
    // 3. User's project directory (fallback)
    if (configPath) {
      this.configPath = configPath;
      this.logger.debug('Using explicit config path', { path: configPath });
    } else {
      const frameworkRoot = this.getFrameworkRoot();
      const frameworkConfigPath = path.join(frameworkRoot, 'mcp-profiles.config.json');

      if (fssync.existsSync(frameworkConfigPath)) {
        this.configPath = frameworkConfigPath;
        this.logger.debug('Using framework config path', { path: frameworkConfigPath });
      } else {
        // Fallback: check user's project directory
        const userConfigPath = path.join(process.cwd(), 'mcp-profiles.config.json');
        this.configPath = userConfigPath;
        this.logger.debug('Using user project config path', { path: userConfigPath });
      }
    }
  }

  /**
   * Get framework root directory (where this package is installed)
   * Uses import.meta.url to find the actual installation location
   */
  private getFrameworkRoot(): string {
    try {
      // This file is at: <framework-root>/src/mcp/core/profile-manager.ts
      // So we need to go up 3 levels to reach framework root
      const currentFileUrl = new URL(import.meta.url);
      const currentFilePath = fileURLToPath(currentFileUrl);
      const frameworkRoot = path.resolve(path.dirname(currentFilePath), '../../..');

      this.logger.debug('Resolved framework root', {
        currentFile: currentFilePath,
        frameworkRoot
      });

      return frameworkRoot;
    } catch (error) {
      // Fallback to process.cwd() if import.meta.url fails
      this.logger.warn('Failed to resolve framework root, using process.cwd()', { error });
      return process.cwd();
    }
  }

  /**
   * Initialize profile manager and load configuration
   */
  async initialize(): Promise<void> {
    await this.loadConfiguration();
    this.logger.info('ProfileManager initialized', {
      profiles: Object.keys(this.config?.profiles || {}),
      currentProfile: this.currentProfile,
    });
  }

  /**
   * Load profile configuration from file
   */
  async loadConfiguration(): Promise<void> {
    const frameworkRoot = this.getFrameworkRoot();
    const frameworkConfigPath = path.join(frameworkRoot, 'mcp-profiles.config.json');
    const userConfigPath = path.join(process.cwd(), 'mcp-profiles.config.json');

    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
      this.logger.info('Profile configuration loaded', {
        version: this.config?.version,
        profiles: Object.keys(this.config?.profiles || {}),
        source: this.configPath
      });
    } catch (error) {
      // Enhanced error logging with search paths
      if ((error as any).code === 'ENOENT') {
        this.logger.error('Profile configuration not found', {
          searched: [
            { path: frameworkConfigPath, exists: await this.fileExists(frameworkConfigPath) },
            { path: userConfigPath, exists: await this.fileExists(userConfigPath) }
          ],
          selected: this.configPath,
          isUserProject: this.isInUserProjectScope(this.configPath)
        });

        // If config doesn't exist in user project, try to create default
        if (this.isInUserProjectScope(this.configPath)) {
          this.logger.warn(`
Profile config not found. Creating default in your project.

Note: This is optional - framework has built-in config.
Location: ${this.configPath}

To use framework defaults instead:
  - Delete this file
  - Framework will use bundled config
          `);

          await this.createDefaultProfileConfig();

          // Retry loading
          try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            this.config = JSON.parse(configData);
            this.logger.info('Default profile configuration created and loaded');
          } catch (retryError) {
            this.logger.error('Failed to load default profile config', { error: retryError });
            throw new Error(`Failed to load profile config from ${this.configPath}: ${retryError}`);
          }
        } else {
          // Not in user project and config not found - this is a problem
          throw new Error(`
Profile config not found in framework directory.

Searched:
  1. Framework: ${frameworkConfigPath} ✗
  2. User project: ${userConfigPath} ✗

This usually means:
  - npx cache corrupted → Clear: rm -rf ~/.npm/_npx
  - Using old version → Update to v7.16.1+
  - Build issue → Report at github.com/Nissimmiracles/versatil-sdlc-framework/issues

To create custom config:
  npx --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.1 versatil-setup --init-config
          `);
        }
      } else {
        this.logger.error('Failed to load profile configuration', {
          error,
          path: this.configPath,
          errorCode: (error as any).code
        });
        throw new Error(`Failed to load profile config from ${this.configPath}: ${error}`);
      }
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a path is in user's project directory
   */
  private isInUserProjectScope(filePath: string): boolean {
    const frameworkRoot = this.getFrameworkRoot();
    const normalizedPath = path.resolve(filePath);
    const normalizedFrameworkRoot = path.resolve(frameworkRoot);
    return !normalizedPath.startsWith(normalizedFrameworkRoot);
  }

  /**
   * Create default profile configuration in user's project
   */
  private async createDefaultProfileConfig(): Promise<void> {
    const defaultConfig: ProfileConfig & { _metadata?: any } = {
      version: '7.16.2',
      description: 'VERSATIL MCP Profile Configuration - Generated from framework defaults',
      profiles: {
        coding: {
          description: 'General development profile with core tools',
          modules: ['core-tools', 'quality-tools'],
          expectedStartupTime: '~500ms',
          expectedMemoryMB: 150,
          toolCount: 32
        },
        testing: {
          description: 'Testing profile with extended QA tools',
          extends: 'coding',
          modules: ['core-tools', 'quality-tools'],
          expectedStartupTime: '~600ms',
          expectedMemoryMB: 180,
          toolCount: 32
        },
        ml: {
          description: 'ML/AI development profile',
          extends: 'coding',
          modules: ['core-tools', 'database-tools', 'ml-tools'],
          expectedStartupTime: '~1000ms',
          expectedMemoryMB: 250,
          toolCount: 59
        },
        full: {
          description: 'Complete toolset (not recommended for production)',
          modules: ['*'],
          expectedStartupTime: '~2000ms',
          expectedMemoryMB: 300,
          toolCount: 82,
          warning: 'Full profile is resource-intensive. Use specific profiles for better performance.'
        }
      },
      _metadata: {
        created_by: 'versatil-framework',
        created_at: new Date().toISOString(),
        framework_version: '7.16.2',
        auto_generated: true,
        note: 'Auto-generated config. Safe to delete - framework will use bundled defaults.',
        docs: 'https://github.com/Nissimmiracles/versatil-sdlc-framework/blob/main/docs/guides/NPX_INSTALLATION.md'
      }
    };

    try {
      await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      this.logger.info('Created default profile config', {
        path: this.configPath,
        version: defaultConfig.version,
        profiles: Object.keys(defaultConfig.profiles)
      });
    } catch (error) {
      this.logger.error('Failed to create default profile config', { error });
      throw error;
    }
  }

  /**
   * Switch to a new profile with hot-reload
   */
  async switchProfile(newProfile: string, force: boolean = false): Promise<ProfileSwitchResult> {
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
        } catch (error) {
          this.logger.warn('Module unload timed out or failed', { error });
        }

        // Phase 2: Load new modules
        let loadErrors: string[] = [];
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
        const serverAsAny = this.server as any;
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
          } catch (error) {
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
      } catch (error) {
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
  async recommendProfile(context: AgentContext): Promise<ProfileRecommendation> {
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
  private getModulesForProfile(profileName: string): string[] {
    const profile = this.config?.profiles[profileName];
    if (!profile) return [];

    let modules: string[] = [];

    // Handle 'extends'
    if (profile.extends) {
      modules = this.getModulesForProfile(profile.extends);
    }

    // Add this profile's modules
    if (profile.modules) {
      if (profile.modules.includes('*')) {
        // All modules
        modules = MODULE_REGISTRY.map(m => m.id);
      } else {
        modules = [...new Set([...modules, ...profile.modules])];
      }
    }

    return modules;
  }

  /**
   * Unload multiple modules
   */
  private async unloadModules(moduleIds: string[]): Promise<void> {
    for (const moduleId of moduleIds) {
      await this.moduleLoader.unloadModule(moduleId);
    }
  }

  /**
   * Simple pattern matching (enhanced glob could be added)
   */
  private matchesPattern(filename: string, pattern: string): boolean {
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
  private timeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    );
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): string {
    return this.currentProfile;
  }

  /**
   * Get profile definition
   */
  getProfileDefinition(profileName: string): ProfileDefinition | undefined {
    return this.config?.profiles[profileName];
  }

  /**
   * Get all available profiles
   */
  getAvailableProfiles(): string[] {
    return Object.keys(this.config?.profiles || {});
  }

  /**
   * Get profile configuration
   */
  getConfiguration(): ProfileConfig | null {
    return this.config;
  }

  /**
   * Get module loader
   */
  getModuleLoader(): ModuleLoader {
    return this.moduleLoader;
  }

  /**
   * Get profile statistics
   */
  getProfileStatistics(): Record<string, any> {
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
