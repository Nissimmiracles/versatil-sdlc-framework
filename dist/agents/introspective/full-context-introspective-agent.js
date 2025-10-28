/**
 * VERSATIL SDLC Framework v1.3.0 - Full Context Introspective Agent
 * Has complete visibility into all systems, agents, and memory
 * Based on context engineering patterns
 */
import { BaseAgent } from '../base-agent.js';
import { VERSATILLogger } from '../../utils/logger.js';
import { vectorMemoryStore } from '../../rag/vector-memory-store.js';
import * as path from 'path';
export class FullContextIntrospectiveAgent extends BaseAgent {
    constructor(agentRegistry) {
        super();
        this.specialization = 'Full Context Introspection';
        this.systemPrompt = 'Full Context Introspective Agent';
        this.name = 'Introspective Oracle';
        this.id = 'introspective-oracle';
        this.capabilities = [
            'full-system-analysis',
            'pattern-detection',
            'self-improvement',
            'bottleneck-identification',
            'optimization-recommendations',
            'context-synthesis',
            'meta-learning'
        ];
        this.lastAnalysis = null;
        this.continuousMonitoring = false;
        this.logger = new VERSATILLogger('IntrospectiveOracle');
        this.agentRegistry = agentRegistry;
        this.systemPrompt = this.generateSystemPrompt();
    }
    generateSystemPrompt() {
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
    async getFullSystemContext() {
        this.logger.info('Gathering full system context...');
        const [agentContext, memoryContext, repositoryContext, stackContext, planContext] = await Promise.all([
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
    async analyzeAgents() {
        const agents = this.agentRegistry.getAllAgents();
        const activeAgents = agents.map(a => a.name);
        // Get performance metrics
        const performance = {};
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
    async analyzeMemory() {
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
    async analyzeRepository() {
        const fs = await import('fs/promises');
        const projectRoot = process.cwd();
        // Get repository structure
        const structure = await this.scanRepository(projectRoot);
        // Get recent changes
        const changes = await this.getRecentChanges();
        // Analyze dependencies
        const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8'));
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
    async analyzeStack() {
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
    async analyzePlans() {
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
    async activate(context) {
        const { goal, trigger, currentContext } = context;
        // Get full system context
        const systemContext = await this.getFullSystemContext();
        // Store context for other agents
        await this.storeSystemContext(systemContext);
        // Perform requested analysis
        let analysis;
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
    async analyzeSystemHealth(context) {
        const health = {
            overall: 'healthy',
            components: {},
            issues: [],
            metrics: {}
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
        }
        else if (health.metrics.overall < 70) {
            health.overall = 'warning';
        }
        else if (health.metrics.overall < 90) {
            health.overall = 'good';
        }
        else {
            health.overall = 'excellent';
        }
        return health;
    }
    /**
     * Detect system bottlenecks
     */
    async detectBottlenecks(context) {
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
    async findOptimizations(context) {
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
    async generateRecommendations(analysis) {
        const recommendations = [];
        // Convert analysis results to recommendations
        if (analysis.bottlenecks) {
            recommendations.push(...analysis.bottlenecks.map((b) => ({
                type: 'bottleneck-fix',
                priority: b.severity,
                message: b.recommendation,
                agent: this.getResponsibleAgent(b.component),
                automated: this.canAutomate(b.type)
            })));
        }
        if (analysis.optimizations) {
            recommendations.push(...analysis.optimizations.map((o) => ({
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
            return (priorities[b.priority] || 0) -
                (priorities[a.priority] || 0);
        });
    }
    /**
     * Learn from analysis for future improvements
     */
    async learnFromAnalysis(analysis) {
        const learning = {
            timestamp: new Date(),
            patterns: [],
            improvements: []
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
    async startContinuousMonitoring(context) {
        this.continuousMonitoring = true;
        // Set up monitoring interval
        setInterval(async () => {
            if (!this.continuousMonitoring)
                return;
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
    async getAgentMetrics(agentId) {
        // Would get real metrics from memory
        return {
            activations: 0,
            successRate: 100,
            avgResponseTime: 1000,
            errors: 0,
            lastActive: new Date()
        };
    }
    async getAgentInteractions() {
        // Would get real interactions from memory
        return [];
    }
    async getRecentRAGQueries() {
        // Would get real queries from memory
        return [];
    }
    async detectMemoryPatterns(memories) {
        // Would analyze memory patterns
        return [];
    }
    async scanRepository(root) {
        // Would scan repository structure
        return {};
    }
    async getRecentChanges() {
        // Would get git changes
        return [];
    }
    async analyzeSupabase() {
        return {
            tables: [],
            functions: [],
            policies: 0,
            realtimeChannels: []
        };
    }
    async analyzeVercel() {
        return {
            deployments: 0,
            domains: [],
            functions: [],
            environment: 'production'
        };
    }
    async analyzeN8N() {
        return {
            workflows: 0,
            activeWorkflows: 0,
            executions: 0,
            triggers: []
        };
    }
    async analyzeClaude() {
        return {
            model: 'claude-3-opus',
            tokensUsed: 0,
            conversations: 0,
            mcpConnections: []
        };
    }
    async getPlans() {
        // Would get plans from memory
        return [];
    }
    async storeSystemContext(context) {
        await vectorMemoryStore.storeMemory({
            content: JSON.stringify(context),
            metadata: {
                agentId: this.id,
                timestamp: Date.now(),
                tags: ['system-context', 'introspection', 'full-context']
            }
        });
    }
    assessAgentHealth(agents) {
        // Would assess agent health
        return { status: 'healthy', score: 95 };
    }
    assessMemoryHealth(memory) {
        // Would assess memory health
        return { status: 'healthy', score: 90 };
    }
    assessStackHealth(stack) {
        // Would assess stack health
        return { status: 'healthy', score: 88 };
    }
    analyzeCollaborationPatterns(interactions) {
        // Would analyze collaboration patterns
        return { inefficiencies: [] };
    }
    analyzeMemoryUsage(memory) {
        // Would analyze memory usage
        return [];
    }
    analyzeStackUsage(stack) {
        // Would analyze stack usage
        return [];
    }
    performComprehensiveAnalysis(context) {
        // Would perform comprehensive analysis
        return {
            health: 'good',
            bottlenecks: [],
            optimizations: [],
            patterns: []
        };
    }
    determineHandoffs(analysis) {
        // Would determine which agents to hand off to
        return [];
    }
    determinePriority(analysis) {
        // Would determine priority based on analysis
        return 'medium';
    }
    getResponsibleAgent(component) {
        // Would map component to responsible agent
        return 'orchestrator';
    }
    canAutomate(type) {
        // Would check if fix can be automated
        const automatable = ['slow-query', 'missing-index', 'lint-error'];
        return automatable.includes(type);
    }
    detectChanges(oldContext, newContext) {
        // Would detect changes between contexts
        return [];
    }
    async handleSystemChanges(changes) {
        // Would handle detected changes
        this.logger.info('System changes detected', { changes: changes.length });
    }
    analyzePatterns(contexts) {
        if (!Array.isArray(contexts))
            contexts = [contexts];
        return this.analyzePlans();
    }
}
//# sourceMappingURL=full-context-introspective-agent.js.map