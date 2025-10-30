/**
 * VERSATIL MCP Module Loader
 * Implements profile-based dynamic module loading with dependency resolution
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { VERSATILLogger } from '../../utils/logger.js';

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  profiles: string[];  // Which profiles need this module ('*' = all)
  priority: number;    // Load order (0 = highest)
  dependencies: string[];  // Required module IDs
  lazyTools?: string[];    // Tools to lazy-init within module
  version: string;
}

export interface ToolRegistrationOptions {
  lazyTools: string[];
  moduleId: string;
  server: Server | McpServer;
  logger: VERSATILLogger;
}

export interface ModuleLoadResult {
  moduleId: string;
  status: 'success' | 'failed' | 'skipped';
  toolsRegistered: number;
  loadTimeMs: number;
  error?: string;
}

export interface ProfileLoadResult {
  profile: string;
  modulesLoaded: string[];
  toolsRegistered: number;
  totalLoadTimeMs: number;
  errors: string[];
  warnings: string[];
}

// Global tool registry to prevent duplicates across modules
export const GLOBAL_TOOL_REGISTRY = new Map<string, string>();

// Module Registry - defines all available modules
export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: 'core-tools',
    name: 'Core Tools',
    description: 'Essential tools for all profiles',
    profiles: ['*'],  // Always loaded
    priority: 0,
    dependencies: [],
    version: '1.0.0',
  },
  {
    id: 'database-tools',
    name: 'Database Tools',
    description: 'PostgreSQL, Supabase, migrations (Dana-Database)',
    profiles: ['ml', 'full'],
    priority: 1,
    dependencies: ['core-tools'],
    lazyTools: ['database_migrate', 'database_backup'],
    version: '1.0.0',
  },
  {
    id: 'ml-tools',
    name: 'ML/AI Tools',
    description: 'Embeddings, RAG, inference (Dr.AI-ML)',
    profiles: ['ml', 'full'],
    priority: 2,
    dependencies: ['core-tools'],
    lazyTools: ['vertex_train_model', 'openai_fine_tune'],
    version: '1.0.0',
  },
  {
    id: 'quality-tools',
    name: 'Quality Assurance Tools',
    description: 'Testing, linting, coverage (Maria-QA)',
    profiles: ['coding', 'testing', 'full'],
    priority: 2,
    dependencies: ['core-tools'],
    version: '1.0.0',
  },
  // {
  //   id: 'frontend-tools',
  //   name: 'Frontend Tools',
  //   description: 'React, accessibility, lighthouse (James-Frontend)',
  //   profiles: ['testing', 'full'],
  //   priority: 3,
  //   dependencies: ['core-tools', 'quality-tools'],
  //   lazyTools: ['playwright_navigate', 'lighthouse_audit'],
  //   version: '1.0.0',
  // },
  // {
  //   id: 'backend-tools',
  //   name: 'Backend Tools',
  //   description: 'API testing, deployment, Docker (Marcus-Backend)',
  //   profiles: ['coding', 'testing', 'full'],
  //   priority: 2,
  //   dependencies: ['core-tools'],
  //   lazyTools: ['docker_build', 'k8s_deploy'],
  //   version: '1.0.0',
  // },
  // {
  //   id: 'research-tools',
  //   name: 'Research Tools',
  //   description: 'Exa, Enrichr, browser automation (optional)',
  //   profiles: ['full'],
  //   priority: 4,
  //   dependencies: ['core-tools'],
  //   lazyTools: ['*'],  // All research tools lazy-loaded
  //   version: '1.0.0',
  // },
  // {
  //   id: 'monitoring-tools',
  //   name: 'Monitoring Tools',
  //   description: 'Prometheus, Grafana, Sentry (Guardian)',
  //   profiles: ['testing', 'full'],
  //   priority: 3,
  //   dependencies: ['core-tools'],
  //   version: '1.0.0',
  // },
];

export class ModuleLoader {
  private loadedModules = new Map<string, any>();
  private activeProfile: string = 'coding';
  private logger: VERSATILLogger;
  private server: Server | McpServer;
  private moduleLoadTimes = new Map<string, number>();

  constructor(server: Server | McpServer, logger?: VERSATILLogger) {
    this.server = server;
    this.logger = logger || new VERSATILLogger('ModuleLoader');
  }

  /**
   * Load a complete profile (set of modules)
   */
  async loadProfile(profileName: string): Promise<ProfileLoadResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const modulesLoaded: string[] = [];
    let totalToolsRegistered = 0;

    this.logger.info(`Loading profile: ${profileName}`);

    try {
      // Get modules for this profile
      const modules = this.getModulesForProfile(profileName);
      this.logger.info(`Profile '${profileName}' requires ${modules.length} modules`, {
        modules: modules.map(m => m.id),
      });

      // Topologically sort by dependencies + priority
      const sortedModuleIds = this.topologicalSort(modules);
      this.logger.info(`Module load order: ${sortedModuleIds.join(' → ')}`);

      // Load each module in order
      for (const moduleId of sortedModuleIds) {
        const result = await this.loadModule(moduleId);

        if (result.status === 'success') {
          modulesLoaded.push(moduleId);
          totalToolsRegistered += result.toolsRegistered;
        } else if (result.status === 'failed') {
          errors.push(`${moduleId}: ${result.error}`);
        }
      }

      this.activeProfile = profileName;
      const totalLoadTimeMs = Date.now() - startTime;

      this.logger.info(`Profile '${profileName}' loaded successfully`, {
        modulesLoaded: modulesLoaded.length,
        toolsRegistered: totalToolsRegistered,
        loadTimeMs: totalLoadTimeMs,
        errors: errors.length,
      });

      return {
        profile: profileName,
        modulesLoaded,
        toolsRegistered: totalToolsRegistered,
        totalLoadTimeMs,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error(`Failed to load profile '${profileName}'`, { error });
      throw error;
    }
  }

  /**
   * Load a single module
   */
  async loadModule(moduleId: string): Promise<ModuleLoadResult> {
    const startTime = Date.now();

    // Skip if already loaded
    if (this.loadedModules.has(moduleId)) {
      return {
        moduleId,
        status: 'skipped',
        toolsRegistered: 0,
        loadTimeMs: 0,
      };
    }

    const moduleDef = MODULE_REGISTRY.find(m => m.id === moduleId);
    if (!moduleDef) {
      return {
        moduleId,
        status: 'failed',
        toolsRegistered: 0,
        loadTimeMs: Date.now() - startTime,
        error: `Module '${moduleId}' not found in registry`,
      };
    }

    try {
      // Load dependencies first
      for (const depId of moduleDef.dependencies) {
        const depResult = await this.loadModule(depId);
        if (depResult.status === 'failed') {
          throw new Error(`Dependency '${depId}' failed to load: ${depResult.error}`);
        }
      }

      // Dynamic import of module
      const modulePath = path.join(process.cwd(), 'dist', 'mcp', 'modules', `${moduleId}.js`);
      this.logger.info(`Loading module: ${moduleId} from ${modulePath}`);

      const moduleExports = await import(modulePath);

      if (!moduleExports.registerTools) {
        throw new Error(`Module '${moduleId}' missing registerTools export`);
      }

      // Register tools with lazy flag
      const options: ToolRegistrationOptions = {
        lazyTools: moduleDef.lazyTools || [],
        moduleId,
        server: this.server,
        logger: this.logger,
      };

      const toolsRegistered = await moduleExports.registerTools(options);

      // Cache loaded module
      this.loadedModules.set(moduleId, moduleExports);
      const loadTimeMs = Date.now() - startTime;
      this.moduleLoadTimes.set(moduleId, loadTimeMs);

      this.logger.info(`Module '${moduleId}' loaded successfully`, {
        toolsRegistered,
        loadTimeMs,
      });

      return {
        moduleId,
        status: 'success',
        toolsRegistered,
        loadTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to load module '${moduleId}'`, {
        error: errorMessage,
        stack: errorStack
      });
      return {
        moduleId,
        status: 'failed',
        toolsRegistered: 0,
        loadTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Unload a module (clear tools, remove from cache)
   */
  async unloadModule(moduleId: string): Promise<void> {
    const module = this.loadedModules.get(moduleId);
    if (!module) return;

    // Call cleanup if provided
    if (module.cleanup) {
      await module.cleanup();
    }

    // Remove tools from global registry
    const toolsToRemove: string[] = [];
    GLOBAL_TOOL_REGISTRY.forEach((owner, tool) => {
      if (owner === moduleId) {
        toolsToRemove.push(tool);
      }
    });

    toolsToRemove.forEach(tool => GLOBAL_TOOL_REGISTRY.delete(tool));

    // Remove from loaded modules
    this.loadedModules.delete(moduleId);
    this.moduleLoadTimes.delete(moduleId);

    this.logger.info(`Module '${moduleId}' unloaded`, {
      toolsRemoved: toolsToRemove.length,
    });
  }

  /**
   * Get all modules required for a profile
   */
  private getModulesForProfile(profile: string): ModuleDefinition[] {
    return MODULE_REGISTRY.filter(m =>
      m.profiles.includes('*') || m.profiles.includes(profile)
    );
  }

  /**
   * Topologically sort modules by dependencies + priority
   * Uses Kahn's algorithm for DAG ordering
   */
  private topologicalSort(modules: ModuleDefinition[]): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Initialize graph
    modules.forEach(m => {
      inDegree.set(m.id, 0);
      adjList.set(m.id, []);
    });

    // Build adjacency list
    modules.forEach(m => {
      m.dependencies.forEach(dep => {
        const neighbors = adjList.get(dep) || [];
        neighbors.push(m.id);
        adjList.set(dep, neighbors);
        inDegree.set(m.id, (inDegree.get(m.id) || 0) + 1);
      });
    });

    // Start with nodes that have no dependencies, sorted by priority
    const queue = modules
      .filter(m => inDegree.get(m.id) === 0)
      .sort((a, b) => a.priority - b.priority)
      .map(m => m.id);

    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = adjList.get(current) || [];
      neighbors.forEach(neighbor => {
        const deg = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, deg);
        if (deg === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check for circular dependencies
    if (result.length !== modules.length) {
      const missing = modules.filter(m => !result.includes(m.id)).map(m => m.id);
      throw new Error(`Circular dependency detected in modules: ${missing.join(', ')}`);
    }

    return result;
  }

  /**
   * Get current profile
   */
  getActiveProfile(): string {
    return this.activeProfile;
  }

  /**
   * Get loaded modules
   */
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * Get module load statistics
   */
  getLoadStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.moduleLoadTimes.forEach((loadTime, moduleId) => {
      stats[moduleId] = {
        loadTimeMs: loadTime,
        toolsRegistered: Array.from(GLOBAL_TOOL_REGISTRY.entries())
          .filter(([_, owner]) => owner === moduleId)
          .length,
      };
    });

    return stats;
  }

  /**
   * Get a loaded module
   */
  getModule(moduleId: string): any {
    return this.loadedModules.get(moduleId);
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }

  /**
   * Get module definition
   */
  getModuleDefinition(moduleId: string): ModuleDefinition | undefined {
    return MODULE_REGISTRY.find(m => m.id === moduleId);
  }

  /**
   * Get all registered tools
   */
  getRegisteredTools(): Map<string, string> {
    return new Map(GLOBAL_TOOL_REGISTRY);
  }
}
