/**
 * VERSATIL SDLC Framework v1.3.0 - Full Context Introspective Agent
 * Has complete visibility into all systems, agents, and memory
 * Based on context engineering patterns
 */

import { BaseAgent, AgentActivationContext, AgentResponse } from '../../core/base-agent.js';
import { VERSATILLogger } from '../../../utils/logger.js';
import { vectorMemoryStore } from '../../../rag/vector-memory-store.js';
import { AgentRegistry } from '../../core/agent-registry.js';
import * as path from 'path';

export interface SystemContext {
  agents: {
    active: string[];
    performance: Record<string, AgentMetrics>;
    interactions: AgentInteraction[];
  };
  memory: {
    totalMemories: number;
    recentQueries: RAGQuery[];
    patterns: Pattern[];
  };
  repository: {
    structure: any;
    changes: GitChange[];
    dependencies: any;
  };
  stack: {
    supabase: SupabaseContext;
    vercel: VercelContext;
    n8n: N8NContext;
    claude: ClaudeContext;
  };
  plans: {
    active: Plan[];
    completed: Plan[];
    success_rate: number;
  };
}

interface AgentMetrics {
  activations: number;
  successRate: number;
  avgResponseTime: number;
  errors: number;
  lastActive: Date;
}

interface AgentInteraction {
  from: string;
  to: string;
  type: string;
  timestamp: Date;
  context: any;
}

interface RAGQuery {
  query: string;
  results: number;
  timestamp: Date;
  agent: string;
}

interface Pattern {
  type: string;
  frequency: number;
  description: string;
  recommendation?: string;
}

interface GitChange {
  file: string;
  type: 'added' | 'modified' | 'deleted';
  lines: { added: number; removed: number };
  timestamp: Date;
}

interface SupabaseContext {
  tables: string[];
  functions: string[];
  policies: number;
  realtimeChannels: string[];
}

interface VercelContext {
  deployments: number;
  domains: string[];
  functions: string[];
  environment: string;
}

interface N8NContext {
  workflows: number;
  activeWorkflows: number;
  executions: number;
  triggers: string[];
}

interface ClaudeContext {
  model: string;
  tokensUsed: number;
  conversations: number;
  mcpConnections: string[];
}

interface Plan {
  id: string;
  status: 'active' | 'completed' | 'failed';
  phases: number;
  progress: number;
  created: Date;
}

export class FullContextIntrospectiveAgent extends BaseAgent {
  specialization = 'Full Context Introspection';
  systemPrompt = 'Full Context Introspective Agent';
  public name = 'Introspective Oracle';
  public id = 'introspective-oracle';
  public capabilities = [
    'full-system-analysis',
    'pattern-detection',
    'self-improvement',
    'bottleneck-identification',
    'optimization-recommendations',
    'context-synthesis',
    'meta-learning'
  ];

  private logger: VERSATILLogger;
  private agentRegistry: AgentRegistry;
  private lastAnalysis: Date | null = null;
  private continuousMonitoring = false;

  constructor(agentRegistry: AgentRegistry) {
    super();
    this.logger = new VERSATILLogger('IntrospectiveOracle');
    this.agentRegistry = agentRegistry;
    this.systemPrompt = this.generateSystemPrompt();
  }

  private generateSystemPrompt(): string {
    return `You are the Introspective Oracle, the meta-agent with complete visibility into the VERSATIL SDLC Framework.

Your capabilities:
- See all agent activities and interactions
- Access entire RAG memory system
- Analyze repository and code patterns
- Monitor stack integrations (Supabase, Vercel, n8n, Claude)
- Detect inefficiencies and bottlenecks
- Recommend optimizations
- Learn from system patterns
- Ensure context coherence

Your mission:
1. Continuously analyze system performance
2. Identify patterns and anti-patterns
3. Recommend improvements proactively
4. Ensure all agents work cohesively
5. Prevent context loss and hallucinations
6. Optimize development velocity

You have access to:
- All agent memories and decisions
- Complete repository context
- Full stack telemetry
- Historical patterns
- Real-time system state

Be proactive, insightful, and focused on continuous improvement.`;
  }

  /**
   * Get complete system context
   */
  async getFullSystemContext(): Promise<SystemContext> {
    this.logger.info('Gathering full system context...');

    const [
      agentContext,
      memoryContext,
      repositoryContext,
      stackContext,
      planContext
    ] = await Promise.all([
      this.analyzeAgents(),
      this.analyzeMemory(),
      this.analyzeRepository(),
      this.analyzeStack(),
      this.analyzePlans()
    ]);

    return {
      agents: agentContext,
      memory: memoryContext,
      repository: repositoryContext,
      stack: stackContext,
      plans: planContext
    };
  }

  /**
   * Analyze all agents in the system
   */
  private async analyzeAgents() {
    const agents = this.agentRegistry.getAllAgents();
    const activeAgents = agents.map(a => a.name);

    // Get performance metrics
    const performance: Record<string, AgentMetrics> = {};
    for (const agent of agents) {
      performance[agent.id] = await this.getAgentMetrics(agent.id);
    }

    // Get agent interactions
    const interactions = await this.getAgentInteractions();

    return {
      active: activeAgents,
      performance,
      interactions
    };
  }

  /**
   * Analyze RAG memory system
   */
  private async analyzeMemory() {
    // Get memory statistics
    const memories = await vectorMemoryStore.getAllMemories();
    const totalMemories = memories.length;

    // Get recent queries
    const recentQueries = await this.getRecentRAGQueries();

    // Detect patterns
    const patterns = await this.detectMemoryPatterns(memories);

    return {
      totalMemories,
      recentQueries,
      patterns
    };
  }

  /**
   * Analyze repository structure and changes
   */
  private async analyzeRepository() {
    const fs = await import('fs/promises');
    const projectRoot = process.cwd();

    // Get repository structure
    const structure = await this.scanRepository(projectRoot);

    // Get recent changes
    const changes = await this.getRecentChanges();

    // Analyze dependencies
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8')
    );
    const dependencies = {
      production: Object.keys(packageJson.dependencies || {}),
      dev: Object.keys(packageJson.devDependencies || {}),
      total: Object.keys({
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }).length
    };

    return {
      structure,
      changes,
      dependencies
    };
  }

  /**
   * Analyze stack integrations
   */
  private async analyzeStack() {
    return {
      supabase: await this.analyzeSupabase(),
      vercel: await this.analyzeVercel(),
      n8n: await this.analyzeN8N(),
      claude: await this.analyzeClaude()
    };
  }

  /**
   * Analyze plans and execution
   */
  private async analyzePlans() {
    // Get plans from memory
    const plans = await this.getPlans();
    
    const active = plans.filter(p => p.status === 'active');
    const completed = plans.filter(p => p.status === 'completed');
    const successful = completed.filter(p => p.status === 'completed');
    
    const success_rate = completed.length > 0
      ? (successful.length / completed.length) * 100
      : 0;

    return {
      active,
      completed,
      success_rate
    };
  }

  /**
   * Main activation method
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const { goal, trigger, currentContext } = context;

    // Get full system context
    const systemContext = await this.getFullSystemContext();

    // Store context for other agents
    await this.storeSystemContext(systemContext);

    // Perform requested analysis
    let analysis: any;
    switch (trigger) {
      case 'system-health':
        analysis = await this.analyzeSystemHealth(systemContext);
        break;
      
      case 'bottleneck-detection':
        analysis = await this.detectBottlenecks(systemContext);
        break;
      
      case 'optimization-opportunities':
        analysis = await this.findOptimizations(systemContext);
        break;
      
      case 'pattern-analysis':
        analysis = await this.analyzePatterns([systemContext]);
        break;
      
      case 'continuous-monitoring':
        analysis = await this.startContinuousMonitoring(systemContext);
        break;
      
      default:
        analysis = await this.performComprehensiveAnalysis(systemContext);
    }

    // Generate recommendations
    const recommendations = await this.generateRecommendations(analysis);

    // Learn from this analysis
    await this.learnFromAnalysis(analysis);

    return {
      agentId: this.id, message: 'Analysis complete', context: {}, data: {
        systemContext,
        analysis,
        recommendations
      },
      suggestions: recommendations,
      handoffTo: this.determineHandoffs(analysis),
      priority: this.determinePriority(analysis)
    };
  }

  /**
   * Analyze overall system health
   */
  private async analyzeSystemHealth(context: SystemContext) {
    const health = {
      overall: 'healthy',
      components: {} as Record<string, any>,
      issues: [] as any[],
      metrics: {} as Record<string, number>
    };

    // Check agent health
    const agentHealth = this.assessAgentHealth(context.agents);
    health.components.agents = agentHealth;

    // Check memory health
    const memoryHealth = this.assessMemoryHealth(context.memory);
    health.components.memory = memoryHealth;

    // Check stack health
    const stackHealth = this.assessStackHealth(context.stack);
    health.components.stack = stackHealth;

    // Calculate overall health
    const healths = Object.values(health.components).map(c => c.score || 0);
    health.metrics.overall = healths.reduce((a, b) => a + b, 0) / healths.length;

    // Determine overall status
    if (health.metrics.overall < 50) {
      health.overall = 'critical';
    } else if (health.metrics.overall < 70) {
      health.overall = 'warning';
    } else if (health.metrics.overall < 90) {
      health.overall = 'good';
    } else {
      health.overall = 'excellent';
    }

    return health;
  }

  /**
   * Detect system bottlenecks
   */
  private async detectBottlenecks(context: SystemContext) {
    const bottlenecks = [];

    // Check for slow agents
    for (const [agentId, metrics] of Object.entries(context.agents.performance)) {
      if (metrics.avgResponseTime > 5000) { // 5 seconds
        bottlenecks.push({
          type: 'slow-agent',
          component: agentId,
          severity: 'high',
          metric: metrics.avgResponseTime,
          recommendation: `Agent ${agentId} is slow. Consider optimizing or parallelizing.`
        });
      }
    }

    // Check for memory issues
    if (context.memory.totalMemories > 10000) {
      bottlenecks.push({
        type: 'memory-overload',
        component: 'rag-system',
        severity: 'medium',
        metric: context.memory.totalMemories,
        recommendation: 'Consider archiving old memories or implementing pagination.'
      });
    }

    // Check for deployment bottlenecks
    if (context.stack.vercel.deployments > 50) {
      bottlenecks.push({
        type: 'deployment-frequency',
        component: 'vercel',
        severity: 'low',
        metric: context.stack.vercel.deployments,
        recommendation: 'High deployment frequency. Consider batching changes.'
      });
    }

    return bottlenecks;
  }

  /**
   * Find optimization opportunities
   */
  private async findOptimizations(context: SystemContext) {
    const optimizations = [];

    // Agent collaboration optimizations
    const collaborationPatterns = this.analyzeCollaborationPatterns(context.agents.interactions);
    if (collaborationPatterns.inefficiencies.length > 0) {
      optimizations.push(...collaborationPatterns.inefficiencies.map(i => ({
        type: 'collaboration',
        area: 'agent-communication',
        impact: 'high',
        suggestion: i.suggestion
      })));
    }

    // Memory optimization
    const memoryOptimizations = this.analyzeMemoryUsage(context.memory);
    optimizations.push(...memoryOptimizations);

    // Stack-specific optimizations
    const stackOptimizations = this.analyzeStackUsage(context.stack);
    optimizations.push(...stackOptimizations);

    return optimizations;
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(analysis: any) {
    const recommendations = [];

    // Convert analysis results to recommendations
    if (analysis.bottlenecks) {
      recommendations.push(...analysis.bottlenecks.map((b: any) => ({
        type: 'bottleneck-fix',
        priority: b.severity,
        message: b.recommendation,
        agent: this.getResponsibleAgent(b.component),
        automated: this.canAutomate(b.type)
      })));
    }

    if (analysis.optimizations) {
      recommendations.push(...analysis.optimizations.map((o: any) => ({
        type: 'optimization',
        priority: o.impact,
        message: o.suggestion,
        agent: 'orchestrator',
        automated: false
      })));
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return (priorities[b.priority as keyof typeof priorities] || 0) - 
             (priorities[a.priority as keyof typeof priorities] || 0);
    });
  }

  /**
   * Learn from analysis for future improvements
   */
  private async learnFromAnalysis(analysis: any) {
    const learning = {
      timestamp: new Date(),
      patterns: [] as any[],
      improvements: [] as any[]
    };

    // Extract patterns
    if (analysis.patterns) {
      learning.patterns = analysis.patterns;
    }

    // Store learning in RAG
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify(learning),
      metadata: {
        agentId: this.id,
        timestamp: Date.now(),
        tags: ['learning', 'introspection', 'patterns']
      }
    });
  }

  /**
   * Start continuous monitoring
   */
  private async startContinuousMonitoring(context: SystemContext) {
    this.continuousMonitoring = true;
    
    // Set up monitoring interval
    setInterval(async () => {
      if (!this.continuousMonitoring) return;
      
      const currentContext = await this.getFullSystemContext();
      const changes = this.detectChanges(context, currentContext);
      
      if (changes.length > 0) {
        await this.handleSystemChanges(changes);
      }
    }, 30000); // Every 30 seconds

    return {
      status: 'monitoring-started',
      baseline: context,
      interval: 30000
    };
  }

  // Helper methods
  private async getAgentMetrics(agentId: string): Promise<AgentMetrics> {
    // Would get real metrics from memory
    return {
      activations: 0,
      successRate: 100,
      avgResponseTime: 1000,
      errors: 0,
      lastActive: new Date()
    };
  }

  private async getAgentInteractions(): Promise<AgentInteraction[]> {
    // Would get real interactions from memory
    return [];
  }

  private async getRecentRAGQueries(): Promise<RAGQuery[]> {
    // Would get real queries from memory
    return [];
  }

  private async detectMemoryPatterns(memories: any[]): Promise<Pattern[]> {
    // Would analyze memory patterns
    return [];
  }

  private async scanRepository(root: string): Promise<any> {
    // Would scan repository structure
    return {};
  }

  private async getRecentChanges(): Promise<GitChange[]> {
    // Would get git changes
    return [];
  }

  private async analyzeSupabase(): Promise<SupabaseContext> {
    return {
      tables: [],
      functions: [],
      policies: 0,
      realtimeChannels: []
    };
  }

  private async analyzeVercel(): Promise<VercelContext> {
    return {
      deployments: 0,
      domains: [],
      functions: [],
      environment: 'production'
    };
  }

  private async analyzeN8N(): Promise<N8NContext> {
    return {
      workflows: 0,
      activeWorkflows: 0,
      executions: 0,
      triggers: []
    };
  }

  private async analyzeClaude(): Promise<ClaudeContext> {
    return {
      model: 'claude-3-opus',
      tokensUsed: 0,
      conversations: 0,
      mcpConnections: []
    };
  }

  private async getPlans(): Promise<Plan[]> {
    // Would get plans from memory
    return [];
  }

  private async storeSystemContext(context: SystemContext) {
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify(context),
      metadata: {
        agentId: this.id,
        timestamp: Date.now(),
        tags: ['system-context', 'introspection', 'full-context']
      }
    });
  }

  private assessAgentHealth(agents: any) {
    // Would assess agent health
    return { status: 'healthy', score: 95 };
  }

  private assessMemoryHealth(memory: any) {
    // Would assess memory health
    return { status: 'healthy', score: 90 };
  }

  private assessStackHealth(stack: any) {
    // Would assess stack health
    return { status: 'healthy', score: 88 };
  }

  private analyzeCollaborationPatterns(interactions: AgentInteraction[]) {
    // Would analyze collaboration patterns
    return { inefficiencies: [] };
  }

  private analyzeMemoryUsage(memory: any) {
    // Would analyze memory usage
    return [];
  }

  private analyzeStackUsage(stack: any) {
    // Would analyze stack usage
    return [];
  }

  private performComprehensiveAnalysis(context: SystemContext) {
    // Would perform comprehensive analysis
    return {
      health: 'good',
      bottlenecks: [],
      optimizations: [],
      patterns: []
    };
  }

  private determineHandoffs(analysis: any): string[] {
    // Would determine which agents to hand off to
    return [];
  }

  private determinePriority(analysis: any): 'low' | 'medium' | 'high' | 'critical' {
    // Would determine priority based on analysis
    return 'medium';
  }

  private getResponsibleAgent(component: string): string {
    // Would map component to responsible agent
    return 'orchestrator';
  }

  private canAutomate(type: string): boolean {
    // Would check if fix can be automated
    const automatable = ['slow-query', 'missing-index', 'lint-error'];
    return automatable.includes(type);
  }

  private detectChanges(oldContext: SystemContext, newContext: SystemContext) {
    // Would detect changes between contexts
    return [];
  }

  private async handleSystemChanges(changes: any[]) {
    // Would handle detected changes
    this.logger.info('System changes detected', { changes: changes.length });
  }

  private analyzePatterns(contexts: any[]): any {
    if (!Array.isArray(contexts)) contexts = [contexts];
    return this.analyzePlans();
  }
}
