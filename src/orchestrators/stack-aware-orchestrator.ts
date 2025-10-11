/**
 * VERSATIL SDLC Framework v1.3.0 - Stack-Aware Orchestrator
 * Focused on: Cursor/Claude/Supabase/n8n/Vercel/OPERA stack
 * With clear framework/project isolation
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as os from 'os';
import { VERSATILLogger } from '../utils/logger.js';
import { EnhancedOperaOrchestrator } from '../opera/enhanced-opera-orchestrator.js';
import { AgentRegistry } from '../agents/core/agent-registry.js';
import { vectorMemoryStore } from '../rag/vector-memory-store.js';

export interface StackContext {
  cursor: {
    workspace: string;
    config: any;
    extensions: string[];
  };
  claude: {
    apiKey?: string;
    models: string[];
    mcpEndpoints: string[];
  };
  supabase: {
    url: string;
    anonKey: string;
    schema: any;
    edgeFunctions: string[];
  };
  n8n: {
    url: string;
    workflows: any[];
    credentials: string[];
  };
  vercel: {
    projectId: string;
    team?: string;
    env: Record<string, string>;
  };
}

export interface IsolatedPaths {
  framework: {
    root: string;
    agents: string;
    memory: string;
    plans: string;
    logs: string;
    mcpServers: string;
  };
  project: {
    root: string;
    src: string;
    config: string;
    tests: string;
    docs: string;
  };
}

export class StackAwareOrchestrator extends EventEmitter {
  private logger: VERSATILLogger;
  private mode: 'plan' | 'execute' = 'plan'; // Always start in plan mode
  
  // Clear separation of framework and project
  private readonly paths: IsolatedPaths = {
    framework: {
      root: path.join(os.homedir(), '.versatil'),
      agents: path.join(os.homedir(), '.versatil', 'agents'),
      memory: path.join(os.homedir(), '.versatil', 'rag'),
      plans: path.join(os.homedir(), '.versatil', 'plans'),
      logs: path.join(os.homedir(), '.versatil', 'logs'),
      mcpServers: path.join(os.homedir(), '.versatil', 'mcp-servers')
    },
    project: {
      root: process.cwd(),
      src: path.join(process.cwd(), 'src'),
      config: path.join(process.cwd(), '.versatil-project'),
      tests: path.join(process.cwd(), 'tests'),
      docs: path.join(process.cwd(), 'docs')
    }
  };

  // Stack-specific integrations
  private stackIntegrations = {
    cursor: null as any,     // CursorMCPClient
    claude: null as any,     // ClaudeCodeMCPClient
    supabase: null as any,   // SupabaseClient
    n8n: null as any,        // N8NClient
    vercel: null as any,     // VercelClient
    shadcn: null as any,     // ShadcnMCPClient
    playwright: null as any, // PlaywrightMCPClient
    chrome: null as any      // ChromeMCPClient
  };

  // MCP servers running in isolation
  private mcpServers = {
    versatil: { port: 3000, name: 'versatil-core' },
    project: { port: 3001, name: 'project-mcp' },
    claude: { port: 3002, name: 'claude-code-mcp' },
    ui: { port: 3003, name: 'shadcn-mcp' },
    browser: { port: 3004, name: 'chrome-mcp' }
  };

  constructor() {
    super();
    this.logger = new VERSATILLogger('StackAwareOrchestrator');
    this.initializeIsolation();
  }

  /**
   * Initialize framework isolation
   */
  private async initializeIsolation() {
    // Ensure all framework directories exist
    const { framework } = this.paths;
    
    for (const dir of Object.values(framework)) {
      await this.ensureDirectory(dir);
    }

    // Create isolation marker
    const isolationConfig = {
      version: '1.3.0',
      isolated: true,
      frameworkPath: framework.root,
      projectPath: this.paths.project.root,
      created: new Date().toISOString()
    };

    await this.saveConfig(
      path.join(framework.root, 'isolation.json'),
      isolationConfig
    );

    this.logger.info('Framework isolation initialized', {
      frameworkPath: framework.root,
      projectPath: this.paths.project.root
    });
  }

  /**
   * Load stack context without contaminating project
   */
  async loadStackContext(): Promise<StackContext> {
    // Load from project config without modifying project files
    const projectConfig = await this.loadProjectConfig();
    
    return {
      cursor: {
        workspace: this.paths.project.root,
        config: await this.loadCursorConfig(),
        extensions: await this.getCursorExtensions()
      },
      claude: {
        apiKey: process.env.CLAUDE_API_KEY,
        models: ['claude-3-opus', 'claude-3-sonnet'],
        mcpEndpoints: [`http://localhost:${this.mcpServers.claude.port}`]
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        schema: await this.loadSupabaseSchema(),
        edgeFunctions: await this.getEdgeFunctions()
      },
      n8n: {
        url: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678',
        workflows: await this.getN8NWorkflows(),
        credentials: ['github', 'supabase', 'vercel']
      },
      vercel: {
        projectId: process.env.VERCEL_PROJECT_ID || '',
        team: process.env.VERCEL_TEAM_ID,
        env: await this.getVercelEnv()
      }
    };
  }

  /**
   * Initialize stack integrations
   */
  async initializeStackIntegrations() {
    const context = await this.loadStackContext();

    // Initialize each integration in isolation
    try {
      // Claude Code MCP (steipete/claude-code-mcp)
      this.stackIntegrations.claude = await this.initializeClaudeMCP(context.claude);
      
      // Supabase client with vector support
      this.stackIntegrations.supabase = await this.initializeSupabase(context.supabase);
      
      // n8n workflow automation
      this.stackIntegrations.n8n = await this.initializeN8N(context.n8n);
      
      // Vercel deployment
      this.stackIntegrations.vercel = await this.initializeVercel(context.vercel);
      
      // UI/UX tools
      this.stackIntegrations.shadcn = await this.initializeShadcnMCP();
      this.stackIntegrations.playwright = await this.initializePlaywrightMCP();
      this.stackIntegrations.chrome = await this.initializeChromeMCP();
      
      this.logger.info('All stack integrations initialized');
    } catch (error) {
      this.logger.error('Failed to initialize stack integrations', { error });
      throw error;
    }
  }

  /**
   * Get full repository context without contamination
   */
  async getFullRepositoryContext() {
    const { project } = this.paths;
    
    // Scan project without modifying it
    const context = {
      structure: await this.scanProjectStructure(project.root),
      dependencies: await this.analyzeDependencies(project.root),
      gitInfo: await this.getGitInfo(project.root),
      config: await this.loadProjectConfig(),
      
      // Stack-specific contexts
      supabase: {
        schema: await this.loadSupabaseSchema(),
        migrations: await this.getSupabaseMigrations(),
        edgeFunctions: await this.getEdgeFunctions()
      },
      
      vercel: {
        config: await this.getVercelConfig(),
        routes: await this.getVercelRoutes(),
        functions: await this.getVercelFunctions()
      },
      
      ui: {
        components: await this.getShadcnComponents(),
        pages: await this.getPages(),
        tests: await this.getPlaywrightTests()
      }
    };

    // Store context in framework memory, not project
    await this.storeInFrameworkMemory('repository-context', context);
    
    return context;
  }

  /**
   * Plan-first execution mode
   */
  async processGoal(goal: any): Promise<any> {
    if (this.mode !== 'plan') {
      throw new Error('Must be in plan mode to process goals');
    }

    // Step 1: Create comprehensive plan
    const plan = await this.createPlan(goal);
    
    // Step 2: Store plan in framework directory
    const planPath = path.join(this.paths.framework.plans, `plan-${Date.now()}.json`);
    await this.saveConfig(planPath, plan);
    
    // Step 3: Present for review
    const reviewedPlan = await this.presentPlanForReview(plan);
    
    // Step 4: Only execute if explicitly approved
    if (reviewedPlan.approved && reviewedPlan.executeNow) {
      this.mode = 'execute';
      const result = await this.executeWithSafeguards(reviewedPlan);
      this.mode = 'plan'; // Always return to plan mode
      return result;
    }
    
    return reviewedPlan;
  }

  /**
   * Create plan following context engineering patterns
   */
  private async createPlan(goal: any) {
    const context = await this.getFullRepositoryContext();
    const stackContext = await this.loadStackContext();
    
    return {
      metadata: {
        version: '1.3.0',
        framework: 'VERSATIL',
        mode: 'plan-first',
        created: new Date().toISOString(),
        goal: goal.description,
        stack: Object.keys(stackContext)
      },
      
      context: {
        repository: context,
        stack: stackContext,
        constraints: goal.constraints || [],
        requirements: goal.requirements || []
      },
      
      phases: [
        {
          phase: 'Analysis',
          agents: ['introspective-agent', 'context-analyzer'],
          tasks: [
            'Analyze repository structure and patterns',
            'Review existing Supabase schema',
            'Check current Vercel deployment',
            'Identify UI component patterns'
          ],
          outputs: ['analysis-report.md', 'dependency-graph.json']
        },
        {
          phase: 'Design',
          agents: ['claude-architect', 'ui-specialist'],
          tasks: [
            'Design component architecture',
            'Plan Supabase schema changes',
            'Create UI/UX mockups with Shadcn',
            'Design n8n workflow integrations'
          ],
          outputs: ['architecture.md', 'schema.sql', 'ui-mockups/']
        },
        {
          phase: 'Implementation',
          agents: ['claude-coder', 'test-engineer'],
          tasks: [
            'Implement features using Claude Code MCP',
            'Create Playwright E2E tests',
            'Write Supabase Edge Functions',
            'Setup n8n automation workflows'
          ],
          outputs: ['src/', 'tests/', 'supabase/functions/']
        },
        {
          phase: 'Testing',
          agents: ['qa-specialist', 'ui-tester'],
          tasks: [
            'Run comprehensive Playwright tests',
            'Perform Chrome DevTools audits',
            'Test Supabase RLS policies',
            'Validate n8n workflow execution'
          ],
          outputs: ['test-results/', 'coverage/', 'lighthouse-reports/']
        },
        {
          phase: 'Deployment',
          agents: ['vercel-deployer', 'monitoring-agent'],
          tasks: [
            'Deploy to Vercel preview',
            'Run smoke tests',
            'Setup monitoring',
            'Create rollback plan'
          ],
          outputs: ['deployment-log.json', 'monitoring-config.yaml']
        }
      ],
      
      safeguards: {
        requireApproval: [
          'database-schema-changes',
          'production-deployment',
          'user-data-migration',
          'api-breaking-changes'
        ],
        automated: [
          'code-formatting',
          'lint-fixes',
          'test-updates',
          'documentation'
        ],
        rollback: {
          strategy: 'git-revert',
          backups: ['database', 'edge-functions'],
          timeout: 3600
        }
      },
      
      estimation: {
        duration: this.estimateDuration(goal),
        complexity: this.assessComplexity(goal),
        risks: this.identifyRisks(goal),
        confidence: 0.85
      }
    };
  }

  /**
   * Present plan for human review
   */
  private async presentPlanForReview(plan: any) {
    // Store plan for UI access
    await this.emit('plan:ready', plan);
    
    // Create readable summary
    const summary = {
      title: `Development Plan: ${plan.metadata.goal}`,
      phases: plan.phases.map((p: any) => ({
        name: p.phase,
        tasks: p.tasks.length,
        agents: p.agents.join(', ')
      })),
      estimation: plan.estimation,
      requiresApproval: plan.safeguards.requireApproval
    };
    
    this.logger.info('Plan ready for review', summary);
    
    // Wait for approval (would integrate with UI)
    return {
      ...plan,
      approved: false,
      reviewedBy: null,
      reviewedAt: null,
      comments: [],
      executeNow: false
    };
  }

  /**
   * Execute plan with safeguards
   */
  private async executeWithSafeguards(plan: any) {
    const execution = {
      planId: plan.id,
      started: new Date().toISOString(),
      completed: null as string | null,
      phases: [],
      results: [],
      errors: []
    };

    try {
      for (const phase of plan.phases) {
        this.logger.info(`Executing phase: ${phase.phase}`);
        
        // Check if phase needs approval
        const needsApproval = phase.tasks.some((task: string) =>
          plan.safeguards.requireApproval.some((required: string) =>
            task.toLowerCase().includes(required.toLowerCase())
          )
        );
        
        if (needsApproval) {
          const approved = await this.requestApproval(phase);
          if (!approved) {
            this.logger.warn(`Phase ${phase.phase} skipped - no approval`);
            continue;
          }
        }
        
        // Execute phase tasks
        const phaseResult = await this.executePhase(phase);
        execution.phases.push(phaseResult);
        
        // Store results in framework memory
        await this.storeExecutionResult(phaseResult);
      }
      
      execution.completed = new Date().toISOString();
      return execution;
      
    } catch (error) {
      execution.errors.push(error);
      
      // Rollback if needed
      if (plan.safeguards.rollback) {
        await this.executeRollback(plan.safeguards.rollback);
      }
      
      throw error;
    }
  }

  // Helper methods
  private async ensureDirectory(dir: string) {
    const fs = await import('fs/promises');
    await fs.mkdir(dir, { recursive: true });
  }

  private async saveConfig(filepath: string, config: any) {
    const fs = await import('fs/promises');
    await fs.writeFile(filepath, JSON.stringify(config, null, 2));
  }

  private async loadProjectConfig() {
    try {
      const fs = await import('fs/promises');
      const configPath = path.join(this.paths.project.config, 'project.json');
      const data = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private async storeInFrameworkMemory(key: string, data: any) {
    const memoryPath = path.join(this.paths.framework.memory, `${key}.json`);
    await this.saveConfig(memoryPath, data);
  }

  // Stub methods for integrations
  private async initializeClaudeMCP(config: any) {
    this.logger.info('Initializing Claude Code MCP', { port: this.mcpServers.claude.port });
    // Would initialize actual MCP client
    return { initialized: true, config };
  }

  private async initializeSupabase(config: any) {
    this.logger.info('Initializing Supabase client');
    // Would initialize actual Supabase client
    return { initialized: true, config };
  }

  private async initializeN8N(config: any) {
    this.logger.info('Initializing n8n client');
    // Would initialize actual n8n client
    return { initialized: true, config };
  }

  private async initializeVercel(config: any) {
    this.logger.info('Initializing Vercel client');
    // Would initialize actual Vercel client
    return { initialized: true, config };
  }

  private async initializeShadcnMCP() {
    this.logger.info('Initializing Shadcn MCP', { port: this.mcpServers.ui.port });
    return { initialized: true };
  }

  private async initializePlaywrightMCP() {
    this.logger.info('Initializing Playwright MCP');
    return { initialized: true };
  }

  private async initializeChromeMCP() {
    this.logger.info('Initializing Chrome MCP', { port: this.mcpServers.browser.port });
    return { initialized: true };
  }

  // Project scanning methods
  private async scanProjectStructure(root: string) {
    // Implementation would scan project structure
    return { files: [], directories: [], patterns: [] };
  }

  private async analyzeDependencies(root: string) {
    // Implementation would analyze package.json, etc.
    return { npm: {}, peer: {}, dev: {} };
  }

  private async getGitInfo(root: string) {
    // Implementation would get git info
    return { branch: 'main', commits: [], remotes: [] };
  }

  // Stack-specific loaders
  private async loadCursorConfig() {
    return {};
  }

  private async getCursorExtensions() {
    return [];
  }

  private async loadSupabaseSchema() {
    return {};
  }

  private async getEdgeFunctions() {
    return [];
  }

  private async getSupabaseMigrations() {
    return [];
  }

  private async getN8NWorkflows() {
    return [];
  }

  private async getVercelConfig() {
    return {};
  }

  private async getVercelEnv() {
    return {};
  }

  private async getVercelRoutes() {
    return [];
  }

  private async getVercelFunctions() {
    return [];
  }

  private async getShadcnComponents() {
    return [];
  }

  private async getPages() {
    return [];
  }

  private async getPlaywrightTests() {
    return [];
  }

  // Plan estimation methods
  private estimateDuration(goal: any) {
    // Would calculate based on complexity
    return '3-5 days';
  }

  private assessComplexity(goal: any) {
    // Would analyze goal complexity
    return 'medium';
  }

  private identifyRisks(goal: any) {
    // Would identify potential risks
    return ['schema-changes', 'api-compatibility'];
  }

  // Execution methods
  private async requestApproval(phase: any) {
    this.emit('approval:needed', phase);
    // Would wait for UI approval
    return false; // Default to not approved
  }

  private async executePhase(phase: any) {
    // Would execute phase with agents
    return { phase: phase.phase, success: true, results: [] };
  }

  private async storeExecutionResult(result: any) {
    const resultPath = path.join(this.paths.framework.logs, `execution-${Date.now()}.json`);
    await this.saveConfig(resultPath, result);
  }

  private async executeRollback(rollbackConfig: any) {
    this.logger.warn('Executing rollback', rollbackConfig);
    // Would perform rollback
  }
}

export default StackAwareOrchestrator;
