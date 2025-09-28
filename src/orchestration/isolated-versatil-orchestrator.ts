/**
 * VERSATIL SDLC Framework - Isolated Orchestrator
 * Ensures complete separation between framework and user projects
 */

import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger';
import { StackAwareOrchestrator } from './stack-aware-orchestrator';
import { PlanFirstOpera } from './plan-first-opera';
import { GitHubSyncOrchestrator } from './github-sync-orchestrator';

export interface IsolatedPaths {
  framework: {
    root: string;
    agents: string;
    memory: string;
    plans: string;
    logs: string;
    config: string;
  };
  project: {
    root: string;
    src: string;
    config: string;
    versatilConfig: string;
  };
}

export class IsolatedVERSATILOrchestrator extends EventEmitter {
  private logger: VERSATILLogger;
  private versatilRoot: string;
  private projectRoot: string;
  private paths: IsolatedPaths;
  
  // Separate MCP servers for complete isolation
  private mcpServers = {
    versatil: { port: 3000, name: 'versatil-framework' },
    project: { port: 3001, name: 'user-project' },
    claude: { port: 3002, name: 'claude-code-mcp' },
    ui: { port: 3003, name: 'shadcn-ui-mcp' },
    playwright: { port: 3004, name: 'playwright-mcp' },
    chrome: { port: 3005, name: 'chrome-devtools-mcp' }
  };

  // Sub-orchestrators for specific responsibilities
  private stackOrchestrator: StackAwareOrchestrator;
  private planOrchestrator: PlanFirstOpera;
  private githubSync: GitHubSyncOrchestrator;

  constructor(projectRoot?: string) {
    super();
    this.logger = new VERSATILLogger('IsolatedOrchestrator');
    
    // Ensure complete isolation
    this.versatilRoot = path.join(os.homedir(), '.versatil');
    this.projectRoot = projectRoot || process.cwd();
    
    // Validate paths don't overlap
    this.validateIsolation();
    
    // Setup isolated paths
    this.paths = this.setupIsolatedPaths();
    
    // Initialize sub-orchestrators
    this.stackOrchestrator = new StackAwareOrchestrator(this.paths);
    this.planOrchestrator = new PlanFirstOpera(this.paths);
    this.githubSync = new GitHubSyncOrchestrator(this.paths);
    
    this.logger.info('Isolated VERSATIL Orchestrator initialized', {
      frameworkRoot: this.versatilRoot,
      projectRoot: this.projectRoot,
      isolation: 'complete'
    });
  }

  /**
   * Validate that framework and project are properly isolated
   */
  private validateIsolation(): void {
    // Ensure project is not inside VERSATIL directory
    if (this.projectRoot.startsWith(this.versatilRoot)) {
      throw new Error('Project cannot be inside VERSATIL framework directory');
    }
    
    // Ensure VERSATIL is not inside project directory
    if (this.versatilRoot.startsWith(this.projectRoot)) {
      throw new Error('VERSATIL framework cannot be inside project directory');
    }
    
    // Check for .versatil directory in project (old installation)
    const oldVersatilPath = path.join(this.projectRoot, '.versatil');
    if (require('fs').existsSync(oldVersatilPath)) {
      this.logger.warn('Found old .versatil directory in project. Consider migrating to isolated installation.');
    }
  }

  /**
   * Setup completely isolated path structure
   */
  private setupIsolatedPaths(): IsolatedPaths {
    return {
      framework: {
        root: this.versatilRoot,
        agents: path.join(this.versatilRoot, 'agents'),
        memory: path.join(this.versatilRoot, 'rag-memory'),
        plans: path.join(this.versatilRoot, 'execution-plans'),
        logs: path.join(this.versatilRoot, 'logs'),
        config: path.join(this.versatilRoot, 'config')
      },
      project: {
        root: this.projectRoot,
        src: path.join(this.projectRoot, 'src'),
        config: path.join(this.projectRoot, 'package.json'),
        versatilConfig: path.join(this.projectRoot, '.versatil-project.json')
      }
    };
  }

  /**
   * Initialize all framework components in isolated environment
   */
  public async initialize(): Promise<void> {
    // Create framework directories if not exist
    await this.ensureFrameworkDirectories();
    
    // Load project configuration without touching project files
    await this.loadProjectConfig();
    
    // Start MCP servers in isolated ports
    await this.startIsolatedMCPServers();
    
    // Initialize sub-orchestrators
    await Promise.all([
      this.stackOrchestrator.initialize(),
      this.planOrchestrator.initialize(),
      this.githubSync.initialize()
    ]);
    
    this.logger.info('VERSATIL fully initialized with complete project isolation');
  }

  /**
   * Ensure all framework directories exist in user's home
   */
  private async ensureFrameworkDirectories(): Promise<void> {
    const fs = require('fs').promises;
    
    for (const dir of Object.values(this.paths.framework)) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    // Create .gitignore to prevent accidental commits
    const gitignorePath = path.join(this.versatilRoot, '.gitignore');
    const gitignoreContent = `
# VERSATIL Framework Files - DO NOT COMMIT
*
!.gitignore
!README.md
    `.trim();
    
    await fs.writeFile(gitignorePath, gitignoreContent);
    
    // Create README for clarity
    const readmePath = path.join(this.versatilRoot, 'README.md');
    const readmeContent = `
# VERSATIL Framework Directory

This directory contains VERSATIL SDLC Framework data and should NOT be committed to your project repository.

Location: ${this.versatilRoot}

## Contents:
- /agents - Agent definitions and state
- /rag-memory - Vector memory store
- /execution-plans - Development plans
- /logs - Framework logs
- /config - Configuration files

## Project Location:
Your project: ${this.projectRoot}

VERSATIL operates on your project without mixing framework files with your code.
    `.trim();
    
    await fs.writeFile(readmePath, readmeContent);
  }

  /**
   * Load project configuration without modifying project
   */
  private async loadProjectConfig(): Promise<void> {
    const fs = require('fs').promises;
    
    try {
      // Try to load existing .versatil-project.json
      const configPath = this.paths.project.versatilConfig;
      if (require('fs').existsSync(configPath)) {
        const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        this.applyProjectConfig(config);
      } else {
        // Create default config
        await this.createDefaultProjectConfig();
      }
    } catch (error) {
      this.logger.warn('No project configuration found, using defaults');
    }
  }

  /**
   * Create default project configuration
   */
  private async createDefaultProjectConfig(): Promise<void> {
    const fs = require('fs').promises;
    
    const defaultConfig = {
      version: '1.3.0',
      mode: 'plan', // Always start in plan mode
      stack: {
        cursor: true,
        claude: true,
        supabase: false,
        n8n: false,
        vercel: false
      },
      isolation: {
        framework: this.versatilRoot,
        project: this.projectRoot
      },
      safety: {
        requireApproval: true,
        planFirst: true,
        dryRun: false
      },
      ui: {
        shadcn: true,
        playwright: true,
        chromeDevtools: true
      }
    };
    
    const configPath = this.paths.project.versatilConfig;
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    
    this.logger.info('Created default project configuration', { path: configPath });
  }

  /**
   * Start MCP servers with complete port isolation
   */
  private async startIsolatedMCPServers(): Promise<void> {
    const { spawn } = require('child_process');
    
    for (const [key, config] of Object.entries(this.mcpServers)) {
      try {
        // Each MCP server runs in isolated process
        const serverProcess = spawn('node', [
          path.join(__dirname, 'mcp-servers', `${key}-mcp-server.js`),
          '--port', config.port.toString(),
          '--name', config.name,
          '--isolation', 'true'
        ], {
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        serverProcess.unref();
        
        this.logger.info(`Started ${key} MCP server`, { port: config.port });
      } catch (error) {
        this.logger.error(`Failed to start ${key} MCP server`, { error });
      }
    }
  }

  /**
   * Apply project configuration
   */
  private applyProjectConfig(config: any): void {
    // Apply configuration to sub-orchestrators
    this.stackOrchestrator.setStackConfig(config.stack);
    this.planOrchestrator.setSafetyConfig(config.safety);
    
    this.logger.info('Applied project configuration', { config });
  }

  /**
   * Execute goal with complete isolation
   */
  public async executeGoal(goal: string, options?: any): Promise<any> {
    // Always start in plan mode
    const plan = await this.planOrchestrator.createPlan(goal, {
      context: await this.gatherFullContext(),
      isolation: true,
      humanApprovalRequired: true
    });
    
    this.emit('plan-created', plan);
    
    // Return plan for review (never auto-execute)
    return {
      plan,
      frameworkPath: this.versatilRoot,
      projectPath: this.projectRoot,
      requiresApproval: true,
      estimatedTime: plan.metadata?.estimatedTime || 0,
      affectedFiles: (plan as any).affectedFiles || []
    };
  }

  /**
   * Gather full context while respecting isolation
   */
  private async gatherFullContext(): Promise<any> {
    return {
      project: await this.stackOrchestrator.getProjectContext(),
      stack: await this.stackOrchestrator.getStackStatus(),
      plans: await this.planOrchestrator.getActivePlans(),
      github: await this.githubSync.getRepoStatus(),
      isolation: {
        frameworkPath: this.versatilRoot,
        projectPath: this.projectRoot,
        separated: true
      }
    };
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    // Stop all MCP servers
    for (const [key, config] of Object.entries(this.mcpServers)) {
      try {
        await fetch(`http://localhost:${config.port}/shutdown`, { method: 'POST' });
      } catch (error) {
        this.logger.error(`Failed to shutdown ${key} MCP server`, { error });
      }
    }
    
    // Cleanup sub-orchestrators
    await Promise.all([
      this.stackOrchestrator.shutdown(),
      this.planOrchestrator.shutdown(),
      this.githubSync.shutdown()
    ]);
    
    this.logger.info('VERSATIL Orchestrator shut down cleanly');
  }
}
