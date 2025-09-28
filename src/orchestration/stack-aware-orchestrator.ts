/**
 * VERSATIL SDLC Framework - Stack-Aware Orchestrator
 * Optimized for: Cursor / Claude / Supabase / n8n / Vercel / BMAD
 */

import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger';
import { IsolatedPaths } from './isolated-versatil-orchestrator';
import { AgenticRAGOrchestrator } from './agentic-rag-orchestrator';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface StackConfiguration {
  cursor: boolean;
  claude: boolean;
  supabase: boolean;
  n8n: boolean;
  vercel: boolean;
  shadcn: boolean;
  playwright: boolean;
  chromeDevtools: boolean;
}

export interface StackAgent {
  id: string;
  name: string;
  type: string;
  mcp?: string;
  capabilities: string[];
  stackIntegration: string[];
}

export class StackAwareOrchestrator extends EventEmitter {
  private logger: VERSATILLogger;
  private paths: IsolatedPaths;
  private stackConfig: StackConfiguration;
  private ragOrchestrator: AgenticRAGOrchestrator;
  
  // Stack-specific agents
  private stackAgents: Map<string, StackAgent> = new Map();
  
  // MCP clients for each stack component
  private mcpClients = {
    claude: null as any,
    shadcn: null as any,
    playwright: null as any,
    chrome: null as any,
    supabase: null as any,
    n8n: null as any,
    vercel: null as any
  };

  constructor(paths: IsolatedPaths) {
    super();
    this.logger = new VERSATILLogger('StackAwareOrchestrator');
    this.paths = paths;
    this.ragOrchestrator = new AgenticRAGOrchestrator(paths);
    
    // Default stack configuration
    this.stackConfig = {
      cursor: true,
      claude: true,
      supabase: true,
      n8n: true,
      vercel: true,
      shadcn: true,
      playwright: true,
      chromeDevtools: true
    };
  }

  public async initialize(): Promise<void> {
    // Initialize RAG system
    await this.ragOrchestrator.initialize();
    
    // Load stack-specific agents
    await this.loadStackAgents();
    
    // Initialize MCP connections
    await this.initializeMCPClients();
    
    // Load agents.md if exists
    await this.parseAgentsMD();
    
    this.logger.info('Stack-aware orchestrator initialized', {
      stack: this.stackConfig,
      agents: this.stackAgents.size
    });
  }

  /**
   * Load stack-specific agent definitions
   */
  private async loadStackAgents(): Promise<void> {
    // Claude Coder Agent - integrates with claude-code-mcp
    this.registerAgent({
      id: 'claude-coder',
      name: 'Claude Coder',
      type: 'development',
      mcp: 'claude-code-mcp',
      capabilities: [
        'code-generation',
        'code-review',
        'refactoring',
        'bug-fixing',
        'documentation'
      ],
      stackIntegration: ['cursor', 'claude']
    });

    // Supabase Architect
    this.registerAgent({
      id: 'supabase-architect',
      name: 'Supabase Database Architect',
      type: 'database',
      capabilities: [
        'schema-design',
        'rls-policies',
        'edge-functions',
        'vector-search',
        'realtime-subscriptions'
      ],
      stackIntegration: ['supabase']
    });

    // UI/UX Specialist with shadcn
    this.registerAgent({
      id: 'ui-specialist',
      name: 'UI/UX Specialist',
      type: 'design',
      mcp: 'shadcn-mcp',
      capabilities: [
        'component-design',
        'theme-creation',
        'accessibility',
        'responsive-design',
        'animations'
      ],
      stackIntegration: ['shadcn', 'cursor']
    });

    // Playwright Test Engineer
    this.registerAgent({
      id: 'playwright-tester',
      name: 'Playwright Test Engineer',
      type: 'testing',
      mcp: 'playwright-mcp',
      capabilities: [
        'e2e-testing',
        'visual-regression',
        'cross-browser-testing',
        'accessibility-testing',
        'performance-testing'
      ],
      stackIntegration: ['playwright']
    });

    // Chrome DevTools Analyst
    this.registerAgent({
      id: 'chrome-analyst',
      name: 'Chrome DevTools Performance Analyst',
      type: 'performance',
      mcp: 'chrome-mcp',
      capabilities: [
        'performance-profiling',
        'network-analysis',
        'memory-profiling',
        'lighthouse-audits',
        'coverage-reports'
      ],
      stackIntegration: ['chromeDevtools']
    });

    // n8n Workflow Automator
    this.registerAgent({
      id: 'n8n-automator',
      name: 'n8n Workflow Automator',
      type: 'automation',
      capabilities: [
        'workflow-creation',
        'ci-cd-automation',
        'webhook-integration',
        'data-transformation',
        'scheduled-tasks'
      ],
      stackIntegration: ['n8n']
    });

    // Vercel Deployment Specialist
    this.registerAgent({
      id: 'vercel-deployer',
      name: 'Vercel Deployment Specialist',
      type: 'deployment',
      capabilities: [
        'preview-deployments',
        'production-deployments',
        'edge-functions',
        'analytics-setup',
        'domain-configuration'
      ],
      stackIntegration: ['vercel']
    });

    // Introspective Meta-Agent
    this.registerAgent({
      id: 'introspective-agent',
      name: 'Introspective Meta-Agent',
      type: 'meta',
      capabilities: [
        'full-context-awareness',
        'agent-monitoring',
        'pattern-detection',
        'self-improvement',
        'optimization-suggestions'
      ],
      stackIntegration: ['all']
    });
  }

  /**
   * Register an agent
   */
  private registerAgent(agent: StackAgent): void {
    this.stackAgents.set(agent.id, agent);
    this.logger.debug('Registered stack agent', { agent: agent.name });
  }

  /**
   * Initialize MCP clients for stack components
   */
  private async initializeMCPClients(): Promise<void> {
    // Claude Code MCP (steipete/claude-code-mcp)
    if (this.stackConfig.claude) {
      try {
        const ClaudeCodeMCP = await import('claude-code-mcp');
        this.mcpClients.claude = new ClaudeCodeMCP.Client({
          workspace: this.paths.project.root,
          contextProvider: async () => this.getFullContext()
        });
        this.logger.info('Connected to Claude Code MCP');
      } catch (error) {
        this.logger.warn('Claude Code MCP not available', { error });
      }
    }

    // Initialize other MCP clients similarly...
    // Each would connect to their respective MCP servers
  }

  /**
   * Parse agents.md file format
   */
  private async parseAgentsMD(): Promise<void> {
    const agentsPath = path.join(this.paths.project.root, 'agents.md');
    
    try {
      const agentsMD = await fs.readFile(agentsPath, 'utf-8');
      const parsedAgents = this.parseAgentDefinitions(agentsMD);
      
      // Register custom agents from agents.md
      parsedAgents.forEach(agent => {
        this.registerAgent({
          id: agent.id,
          name: agent.name,
          type: agent.type || 'custom',
          capabilities: agent.capabilities || [],
          stackIntegration: agent.stack || []
        });
      });
      
      this.logger.info('Loaded custom agents from agents.md', {
        count: parsedAgents.length
      });
    } catch (error) {
      this.logger.debug('No agents.md file found');
    }
  }

  /**
   * Parse agent definitions from markdown
   */
  private parseAgentDefinitions(markdown: string): any[] {
    const agents = [];
    const lines = markdown.split('\n');
    let currentAgent: any = null;

    for (const line of lines) {
      // Parse agent headers (## AgentName)
      if (line.startsWith('## ')) {
        if (currentAgent) agents.push(currentAgent);
        currentAgent = {
          name: line.substring(3).trim(),
          id: line.substring(3).trim().toLowerCase().replace(/\s+/g, '-'),
          capabilities: []
        };
      }
      // Parse capabilities
      else if (currentAgent && line.includes('Capabilities:')) {
        // Parse following bullet points
      }
      // Parse other metadata
      else if (currentAgent && line.includes('Stack:')) {
        const stack = line.split(':')[1].trim().split(',').map(s => s.trim());
        currentAgent.stack = stack;
      }
    }

    if (currentAgent) agents.push(currentAgent);
    return agents;
  }

  /**
   * Get full context for agents
   */
  public async getFullContext(): Promise<any> {
    return {
      repository: await this.getRepositoryContext(),
      stack: await this.getStackContext(),
      development: await this.getDevelopmentContext(),
      agents: await this.getAgentContext()
    };
  }

  /**
   * Get repository context
   */
  private async getRepositoryContext(): Promise<any> {
    const gitInfo = await this.getGitInfo();
    const fileStructure = await this.getFileStructure();
    const dependencies = await this.getDependencies();
    
    return {
      root: this.paths.project.root,
      git: gitInfo,
      structure: fileStructure,
      dependencies: dependencies,
      config: await this.getProjectConfig()
    };
  }

  /**
   * Get stack-specific context
   */
  private async getStackContext(): Promise<any> {
    const context: any = {};
    
    // Supabase context
    if (this.stackConfig.supabase) {
      context.supabase = await this.getSupabaseContext();
    }
    
    // Vercel context
    if (this.stackConfig.vercel) {
      context.vercel = await this.getVercelContext();
    }
    
    // n8n context
    if (this.stackConfig.n8n) {
      context.n8n = await this.getN8NContext();
    }
    
    return context;
  }

  /**
   * Get Supabase-specific context
   */
  private async getSupabaseContext(): Promise<any> {
    try {
      // Read supabase config
      const supabaseConfigPath = path.join(this.paths.project.root, 'supabase', 'config.toml');
      const hasSupabase = await this.fileExists(supabaseConfigPath);
      
      if (!hasSupabase) return null;
      
      return {
        config: await fs.readFile(supabaseConfigPath, 'utf-8'),
        migrations: await this.getSupabaseMigrations(),
        functions: await this.getSupabaseEdgeFunctions(),
        schema: await this.getSupabaseSchema()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get Vercel-specific context
   */
  private async getVercelContext(): Promise<any> {
    try {
      const vercelJsonPath = path.join(this.paths.project.root, 'vercel.json');
      const hasVercel = await this.fileExists(vercelJsonPath);
      
      if (!hasVercel) return null;
      
      return {
        config: await fs.readFile(vercelJsonPath, 'utf-8'),
        env: process.env.VERCEL_ENV,
        projectId: process.env.VERCEL_PROJECT_ID
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get n8n workflow context
   */
  private async getN8NContext(): Promise<any> {
    try {
      const n8nWorkflowsPath = path.join(this.paths.project.root, '.n8n', 'workflows');
      const hasN8n = await this.fileExists(n8nWorkflowsPath);
      
      if (!hasN8n) return null;
      
      return {
        workflows: await this.getN8NWorkflows(),
        credentials: 'configured' // Don't expose actual credentials
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get development context
   */
  private async getDevelopmentContext(): Promise<any> {
    return {
      plans: await this.getDevelopmentPlans(),
      issues: await this.getGitHubIssues(),
      prs: await this.getGitHubPRs(),
      todos: await this.extractTODOs()
    };
  }

  /**
   * Get agent context
   */
  private async getAgentContext(): Promise<any> {
    const agents = Array.from(this.stackAgents.values());
    return {
      available: agents,
      active: agents.filter(a => this.isAgentActive(a)),
      memories: await this.ragOrchestrator.getAgentMemories()
    };
  }

  /**
   * Check if agent is active based on stack config
   */
  private isAgentActive(agent: StackAgent): boolean {
    if (agent.stackIntegration.includes('all')) return true;
    
    return agent.stackIntegration.some(stack => {
      return this.stackConfig[stack as keyof StackConfiguration];
    });
  }

  /**
   * Helper methods for context gathering
   */
  private async getGitInfo(): Promise<any> {
    try {
      const { exec } = require('child_process').promises;
      
      const [branch, status, lastCommit] = await Promise.all([
        exec('git branch --show-current', { cwd: this.paths.project.root }),
        exec('git status --porcelain', { cwd: this.paths.project.root }),
        exec('git log -1 --oneline', { cwd: this.paths.project.root })
      ]);
      
      return {
        branch: branch.stdout.trim(),
        hasChanges: status.stdout.trim().length > 0,
        lastCommit: lastCommit.stdout.trim()
      };
    } catch (error) {
      return null;
    }
  }

  private async getFileStructure(): Promise<any> {
    // Get project file structure (simplified)
    const structure: any = {};
    
    const scanDir = async (dir: string, relativePath: string = '') => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip node_modules, .git, etc.
        if (this.shouldSkipDirectory(entry.name)) continue;
        
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          structure[relPath] = 'directory';
          await scanDir(fullPath, relPath);
        } else {
          structure[relPath] = 'file';
        }
      }
    };
    
    await scanDir(this.paths.project.root);
    return structure;
  }

  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.vercel'];
    return skipDirs.includes(name);
  }

  private async getDependencies(): Promise<any> {
    try {
      const packageJsonPath = path.join(this.paths.project.root, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      return {
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {}),
        scripts: Object.keys(packageJson.scripts || {})
      };
    } catch (error) {
      return null;
    }
  }

  private async getProjectConfig(): Promise<any> {
    const configs: any = {};
    
    // Check for various config files
    const configFiles = [
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
      'postcss.config.js'
    ];
    
    for (const configFile of configFiles) {
      const configPath = path.join(this.paths.project.root, configFile);
      if (await this.fileExists(configPath)) {
        configs[configFile] = true;
      }
    }
    
    return configs;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async getSupabaseMigrations(): Promise<string[]> {
    try {
      const migrationsPath = path.join(this.paths.project.root, 'supabase', 'migrations');
      const files = await fs.readdir(migrationsPath);
      return files.filter(f => f.endsWith('.sql'));
    } catch {
      return [];
    }
  }

  private async getSupabaseEdgeFunctions(): Promise<string[]> {
    try {
      const functionsPath = path.join(this.paths.project.root, 'supabase', 'functions');
      return await fs.readdir(functionsPath);
    } catch {
      return [];
    }
  }

  private async getSupabaseSchema(): Promise<any> {
    // Would parse schema from migrations or connect to Supabase
    return null;
  }

  private async getN8NWorkflows(): Promise<any[]> {
    // Would load n8n workflow definitions
    return [];
  }

  private async getDevelopmentPlans(): Promise<any[]> {
    // Load from plan orchestrator
    return [];
  }

  private async getGitHubIssues(): Promise<any[]> {
    // Would use GitHub API
    return [];
  }

  private async getGitHubPRs(): Promise<any[]> {
    // Would use GitHub API
    return [];
  }

  private async extractTODOs(): Promise<string[]> {
    // Would scan codebase for TODO comments
    return [];
  }

  /**
   * Get project context for other orchestrators
   */
  public async getProjectContext(): Promise<any> {
    return await this.getRepositoryContext();
  }

  /**
   * Get stack status
   */
  public async getStackStatus(): Promise<any> {
    return {
      config: this.stackConfig,
      connections: {
        claude: this.mcpClients.claude !== null,
        supabase: await this.testSupabaseConnection(),
        vercel: await this.testVercelConnection(),
        n8n: await this.testN8NConnection()
      },
      agents: {
        total: this.stackAgents.size,
        active: Array.from(this.stackAgents.values()).filter(a => this.isAgentActive(a)).length
      }
    };
  }

  private async testSupabaseConnection(): Promise<boolean> {
    // Would test actual connection
    return this.stackConfig.supabase;
  }

  private async testVercelConnection(): Promise<boolean> {
    // Would test actual connection
    return this.stackConfig.vercel;
  }

  private async testN8NConnection(): Promise<boolean> {
    // Would test actual connection
    return this.stackConfig.n8n;
  }

  /**
   * Set stack configuration
   */
  public setStackConfig(config: Partial<StackConfiguration>): void {
    this.stackConfig = { ...this.stackConfig, ...config };
    this.logger.info('Updated stack configuration', { config: this.stackConfig });
  }

  /**
   * Execute with specific agent
   */
  public async executeWithAgent(agentId: string, task: any): Promise<any> {
    const agent = this.stackAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    // Get full context for agent
    const context = await this.ragOrchestrator.getContextForAgent(agentId, task);
    
    // Execute based on agent type
    if (agent.mcp) {
      return await this.executeViaMCP(agent, task, context);
    } else {
      return await this.executeDirectly(agent, task, context);
    }
  }

  /**
   * Execute agent via MCP
   */
  private async executeViaMCP(agent: StackAgent, task: any, context: any): Promise<any> {
    const mcpClient = this.mcpClients[agent.mcp?.split('-')[0] as keyof typeof this.mcpClients];
    if (!mcpClient) {
      throw new Error(`MCP client not available for ${agent.name}`);
    }
    
    return await mcpClient.execute(task, context);
  }

  /**
   * Execute agent directly
   */
  private async executeDirectly(agent: StackAgent, task: any, context: any): Promise<any> {
    // Direct execution logic
    this.logger.info(`Executing task with ${agent.name}`, { task });
    
    // Store execution in RAG
    await this.ragOrchestrator.storeAgentExecution(agent.id, task, context, 'completed');
    
    return {
      agent: agent.name,
      task: task,
      status: 'completed',
      timestamp: Date.now()
    };
  }

  /**
   * Cleanup
   */
  public async shutdown(): Promise<void> {
    // Disconnect MCP clients
    for (const client of Object.values(this.mcpClients)) {
      if (client && client.disconnect) {
        await client.disconnect();
      }
    }
    
    // Shutdown RAG
    await this.ragOrchestrator.shutdown();
  }
}
