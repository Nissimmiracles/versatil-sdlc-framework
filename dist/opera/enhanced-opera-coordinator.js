/**
 * VERSATIL SDLC Framework - Enhanced OPERA Integration
 * Integrates RAG memory and Opera orchestration with existing OPERA agents
 */
import { EventEmitter } from 'events';
import { AgentRegistry } from '../agents/core/agent-registry.js';
import { VERSATILLogger } from '../utils/logger.js';
import { vectorMemoryStore } from '../rag/vector-memory-store.js';
import { OperaOrchestrator } from '../opera/opera-orchestrator.js';
import { SDLCOrchestrator } from '../flywheel/sdlc-orchestrator.js';
import { AgentIntelligenceManager } from '../intelligence/agent-intelligence.js';
/**
 * Enhanced OPERA Coordinator - Integrates all autonomous capabilities
 */
export class EnhancedOPERACoordinator extends EventEmitter {
    constructor(config = {}) {
        super();
        this.contexts = new Map();
        this.enhancedAgents = new Map();
        this.logger = new VERSATILLogger();
        this.config = {
            ragEnabled: true,
            operaEnabled: true,
            autonomousMode: true,
            memoryDepth: 10,
            contextWindowSize: 5,
            learningRate: 0.1,
            ...config
        };
        this.initialize();
    }
    async initialize() {
        // Initialize core components
        this.agentRegistry = new AgentRegistry();
        this.intelligenceManager = new AgentIntelligenceManager();
        this.sdlcOrchestrator = new SDLCOrchestrator();
        if (this.config.operaEnabled) {
            this.operaOrchestrator = new OperaOrchestrator(this.agentRegistry);
            this.setupOperaIntegration();
        }
        // Enhance all agents with RAG and autonomous capabilities
        await this.enhanceAgents();
        this.logger.info('Enhanced OPERA Coordinator initialized', this.config, 'opera-enhanced');
    }
    /**
     * Enhance all OPERA agents with RAG and autonomous capabilities
     */
    async enhanceAgents() {
        const agents = this.agentRegistry.getAllAgents();
        for (const agent of agents) {
            const agentId = agent.id;
            const enhancedAgent = this.createEnhancedAgent(agent);
            this.enhancedAgents.set(agentId, enhancedAgent);
            // Replace in registry
            this.agentRegistry.registerAgent(agentId, enhancedAgent);
        }
    }
    /**
     * Create an enhanced version of an agent with RAG and autonomous capabilities
     */
    createEnhancedAgent(originalAgent) {
        const coordinator = this;
        const agentId = originalAgent['id'];
        // Create enhanced proxy
        return new Proxy(originalAgent, {
            get(target, prop, receiver) {
                if (prop === 'activate') {
                    return async (context) => {
                        // Enhanced activation with RAG and context
                        return coordinator.enhancedAgentActivation(target, context);
                    };
                }
                return Reflect.get(target, prop, receiver);
            }
        });
    }
    /**
     * Enhanced agent activation with RAG memory and autonomous capabilities
     */
    async enhancedAgentActivation(agent, context) {
        const agentId = agent['id'];
        const startTime = Date.now();
        this.logger.info(`Enhanced activation for ${agentId}`, { context }, 'opera-enhanced');
        // 1. Query relevant memories if RAG is enabled
        let relevantMemories = [];
        if (this.config.ragEnabled && context.filePath) {
            relevantMemories = await this.queryAgentMemory(agentId, context);
            // Enrich context with memories
            context = {
                ...context,
                memories: relevantMemories
            };
        }
        // 2. Get original agent response
        const originalResponse = await agent.activate(context);
        // 3. Enhance response with memories and learnings
        const enhancedResponse = {
            ...originalResponse,
            memories: relevantMemories,
            learnings: [],
            autonomousActions: []
        };
        // 4. Store this interaction in memory
        if (this.config.ragEnabled) {
            await this.storeAgentInteraction(agentId, context, enhancedResponse);
        }
        // 5. Check for autonomous actions
        if (this.config.autonomousMode && this.config.operaEnabled) {
            const autonomousActions = await this.checkAutonomousActions(agentId, context, enhancedResponse);
            if (autonomousActions.length > 0) {
                enhancedResponse.autonomousActions = autonomousActions;
                // Queue autonomous goals
                for (const action of autonomousActions) {
                    await this.queueAutonomousGoal(action, agentId);
                }
            }
        }
        // 6. Learn from this interaction
        const learnings = await this.learnFromInteraction(agentId, context, enhancedResponse, Date.now() - startTime);
        enhancedResponse.learnings = learnings;
        // 7. Emit enhanced activation event
        this.emit('enhanced_activation', {
            agentId,
            context,
            response: enhancedResponse,
            executionTime: Date.now() - startTime
        });
        return enhancedResponse;
    }
    /**
     * Query agent-specific memories using RAG
     */
    async queryAgentMemory(agentId, context) {
        // Build query from context
        let queryText = '';
        if (context.filePath) {
            queryText += `file:${context.filePath} `;
        }
        if (context.errorMessage) {
            queryText += `error:"${context.errorMessage}" `;
        }
        if (context.userRequest) {
            queryText += context.userRequest;
        }
        // Query memories
        const query = {
            query: queryText.trim(),
            agentId,
            topK: this.config.memoryDepth,
            filters: {
                tags: []
            }
        };
        // Add file type filter
        if (context.filePath) {
            const fileType = this.getFileType(context.filePath);
            if (fileType) {
                query.filters.fileTypes = [fileType];
            }
        }
        const results = await vectorMemoryStore.queryMemories(query);
        // Parse and return relevant memories
        return results.documents.map(doc => {
            try {
                const memory = JSON.parse(doc.content);
                return {
                    ...memory,
                    relevanceScore: doc.metadata.relevanceScore
                };
            }
            catch {
                return {
                    content: doc.content,
                    relevanceScore: doc.metadata.relevanceScore
                };
            }
        });
    }
    /**
     * Store agent interaction in vector memory
     */
    async storeAgentInteraction(agentId, context, response) {
        const interaction = {
            agentId,
            timestamp: Date.now(),
            context: {
                filePath: context.filePath,
                errorMessage: context.errorMessage,
                userRequest: context.userRequest,
                contextClarity: context.contextClarity,
                urgency: context.urgency
            },
            response: {
                message: response.message,
                priority: response.priority,
                suggestionCount: response.suggestions.length,
                handoffAgents: response.handoffTo
            }
        };
        // Determine tags
        const tags = [agentId, 'interaction'];
        if (context.filePath) {
            const fileType = this.getFileType(context.filePath);
            if (fileType)
                tags.push(fileType);
        }
        if (response.priority === 'critical' || response.priority === 'high') {
            tags.push('important');
        }
        if (context.emergency) {
            tags.push('emergency');
        }
        // Store in vector memory
        await vectorMemoryStore.storeMemory({
            content: JSON.stringify(interaction),
            metadata: {
                agentId,
                timestamp: Date.now(),
                fileType: context.filePath ? this.getFileType(context.filePath) : undefined,
                tags
            }
        });
    }
    /**
     * Check for autonomous actions based on agent response
     */
    async checkAutonomousActions(agentId, context, response) {
        const autonomousActions = [];
        // Check for critical issues requiring immediate action
        if (response.priority === 'critical' || context.emergency) {
            autonomousActions.push({
                type: 'emergency_response',
                reason: 'Critical issue detected',
                suggestedAction: 'Immediate investigation and resolution',
                agents: [agentId, ...response.handoffTo]
            });
        }
        // Check for handoff requests
        if (response.handoffTo.length > 0) {
            autonomousActions.push({
                type: 'agent_coordination',
                reason: 'Multi-agent collaboration needed',
                suggestedAction: 'Coordinate with recommended agents',
                agents: response.handoffTo
            });
        }
        // Check for patterns requiring proactive action
        const patterns = await this.detectActionablePatterns(agentId, context, response);
        for (const pattern of patterns) {
            autonomousActions.push({
                type: 'pattern_response',
                reason: pattern.description,
                suggestedAction: pattern.action,
                confidence: pattern.confidence
            });
        }
        return autonomousActions;
    }
    /**
     * Queue autonomous goal for Opera execution
     */
    async queueAutonomousGoal(action, agentId) {
        if (!this.operaOrchestrator)
            return;
        const goal = {
            id: this.generateId('goal'),
            type: this.mapActionToGoalType(action.type),
            description: `${action.reason}: ${action.suggestedAction}`,
            priority: this.determinePriority(action),
            status: 'pending',
            constraints: [],
            successCriteria: [`${action.type} completed successfully`]
        };
        await this.operaOrchestrator.addGoal(goal);
        this.logger.info('Autonomous goal queued', { goal, action, agentId }, 'opera-enhanced');
    }
    /**
     * Learn from interaction and update agent behavior
     */
    async learnFromInteraction(agentId, context, response, executionTime) {
        const learnings = [];
        // Track execution time patterns
        if (executionTime > 5000) { // Slow execution
            learnings.push({
                type: 'performance',
                observation: 'Slow execution detected',
                recommendation: 'Optimize query or cache results',
                metric: executionTime
            });
        }
        // Track memory effectiveness
        if (response.memories && response.memories.length > 0) {
            const avgRelevance = response.memories.reduce((sum, m) => sum + (m.relevanceScore || 0), 0) / response.memories.length;
            if (avgRelevance < 0.5) {
                learnings.push({
                    type: 'memory_quality',
                    observation: 'Low relevance memories retrieved',
                    recommendation: 'Improve memory tagging or embedding quality',
                    metric: avgRelevance
                });
            }
        }
        // Track suggestion patterns
        if (response.suggestions.length > 5) {
            learnings.push({
                type: 'suggestion_overload',
                observation: 'Many suggestions provided',
                recommendation: 'Prioritize and filter suggestions',
                count: response.suggestions.length
            });
        }
        // Store learnings
        if (learnings.length > 0) {
            await vectorMemoryStore.storeMemory({
                content: JSON.stringify({ agentId, learnings, context, response }),
                metadata: {
                    agentId: 'opera-enhanced',
                    timestamp: Date.now(),
                    tags: ['learning', agentId, 'performance']
                }
            });
        }
        return learnings;
    }
    /**
     * Detect actionable patterns from agent interactions
     */
    async detectActionablePatterns(agentId, context, response) {
        const patterns = [];
        // Query recent similar interactions
        const query = {
            query: `${agentId} ${context.filePath || ''} pattern`,
            topK: 5,
            filters: {
                timeRange: {
                    start: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
                    end: Date.now()
                }
            }
        };
        const recentInteractions = await vectorMemoryStore.queryMemories(query);
        // Simple pattern detection - repeated issues
        if (recentInteractions.documents.length >= 3) {
            const commonIssues = this.findCommonIssues(recentInteractions.documents);
            for (const issue of commonIssues) {
                patterns.push({
                    description: `Recurring issue: ${issue.type}`,
                    action: 'Implement permanent fix or automation',
                    confidence: issue.frequency / recentInteractions.documents.length
                });
            }
        }
        return patterns;
    }
    /**
     * Find common issues in memories
     */
    findCommonIssues(memories) {
        const issueMap = new Map();
        for (const memory of memories) {
            try {
                const content = JSON.parse(memory.content);
                if (content.context?.errorMessage) {
                    const key = this.normalizeError(content.context.errorMessage);
                    issueMap.set(key, (issueMap.get(key) || 0) + 1);
                }
            }
            catch {
                // Ignore parsing errors
            }
        }
        return Array.from(issueMap.entries())
            .filter(([_, count]) => count >= 2)
            .map(([type, frequency]) => ({ type, frequency }));
    }
    /**
     * Setup Opera integration
     */
    setupOperaIntegration() {
        // Listen to Opera events
        this.operaOrchestrator.on('goal_completed', ({ goal, decision }) => {
            this.logger.info('Opera goal completed', { goal, decision }, 'opera-enhanced');
            this.emit('autonomous_goal_completed', { goal, decision });
        });
        this.operaOrchestrator.on('goal_failed', ({ goal, decision }) => {
            this.logger.warn('Opera goal failed', { goal, decision }, 'opera-enhanced');
            this.emit('autonomous_goal_failed', { goal, decision });
        });
        this.operaOrchestrator.on('human_intervention_required', ({ step, error }) => {
            this.logger.warn('Human intervention required', { step, error }, 'opera-enhanced');
            this.emit('human_intervention_required', { step, error });
        });
    }
    /**
     * Create a new OPERA context for a project
     */
    async createContext(projectId) {
        const context = {
            projectId,
            phase: 'initialization',
            activeAgents: [],
            memory: [],
            goals: [],
            decisions: []
        };
        this.contexts.set(projectId, context);
        // Initialize project memory
        await vectorMemoryStore.storeMemory({
            content: JSON.stringify({ projectId, action: 'context_created' }),
            metadata: {
                agentId: 'opera-enhanced',
                timestamp: Date.now(),
                projectContext: projectId,
                tags: ['project', 'initialization']
            }
        });
        this.emit('context_created', context);
        return context;
    }
    /**
     * Get or create context for a project
     */
    async getContext(projectId) {
        let context = this.contexts.get(projectId);
        if (!context) {
            context = await this.createContext(projectId);
        }
        return context;
    }
    /**
     * Update context phase
     */
    async updateContextPhase(projectId, phase) {
        const context = await this.getContext(projectId);
        context.phase = phase;
        // Store phase transition
        await vectorMemoryStore.storeMemory({
            content: JSON.stringify({ projectId, phase, previousPhase: context.phase }),
            metadata: {
                agentId: 'opera-enhanced',
                timestamp: Date.now(),
                projectContext: projectId,
                tags: ['project', 'phase-transition', phase]
            }
        });
        this.emit('phase_updated', { projectId, phase });
    }
    /**
     * Execute OPERA workflow for a project
     */
    async executeOPERAWorkflow(projectId, requirements) {
        const context = await this.getContext(projectId);
        // Create initial goal
        const goal = {
            id: this.generateId('workflow'),
            type: 'feature',
            description: requirements,
            priority: 'high',
            status: 'pending',
            constraints: ['Follow OPERA methodology', 'Maintain zero context loss'],
            successCriteria: [
                'Requirements analyzed',
                'Architecture designed',
                'Implementation completed',
                'Tests passing',
                'Documentation updated'
            ],
        };
        context.goals.push(goal);
        // Queue for autonomous execution
        if (this.operaOrchestrator) {
            await this.operaOrchestrator.addGoal(goal);
        }
        this.emit('workflow_started', { projectId, goal });
    }
    /**
     * Helper methods
     */
    getFileType(filePath) {
        const extension = filePath.split('.').pop()?.toLowerCase();
        const typeMap = {
            'js': 'javascript',
            'jsx': 'react',
            'ts': 'typescript',
            'tsx': 'react',
            'py': 'python',
            'java': 'java',
            'css': 'css',
            'scss': 'scss',
            'html': 'html',
            'json': 'json',
            'yml': 'yaml',
            'yaml': 'yaml',
            'md': 'markdown'
        };
        return typeMap[extension || ''] || 'unknown';
    }
    normalizeError(error) {
        // Simple error normalization
        return error.toLowerCase()
            .replace(/line \d+/g, 'line X')
            .replace(/column \d+/g, 'column X')
            .replace(/\d+/g, 'N')
            .trim();
    }
    mapActionToGoalType(actionType) {
        const mapping = {
            'emergency_response': 'bug_fix',
            'agent_coordination': 'feature',
            'pattern_response': 'optimization'
        };
        return mapping[actionType] || 'feature';
    }
    determinePriority(action) {
        if (action.type === 'emergency_response')
            return 'critical';
        if (action.confidence && action.confidence > 0.8)
            return 'high';
        return 'medium';
    }
    generateId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Public API
     */
    /**
     * Get enhanced agent by ID
     */
    getEnhancedAgent(agentId) {
        return this.enhancedAgents.get(agentId);
    }
    /**
     * Enable/disable RAG
     */
    setRAGEnabled(enabled) {
        this.config.ragEnabled = enabled;
        this.emit('config_updated', { ragEnabled: enabled });
    }
    /**
     * Enable/disable autonomous mode
     */
    setAutonomousMode(enabled) {
        this.config.autonomousMode = enabled;
        if (this.operaOrchestrator) {
            if (enabled) {
                this.operaOrchestrator.resumeAutonomous();
            }
            else {
                this.operaOrchestrator.pauseAutonomous();
            }
        }
        this.emit('config_updated', { autonomousMode: enabled });
    }
    /**
     * Get performance metrics
     */
    async getPerformanceMetrics() {
        const metrics = {
            contexts: this.contexts.size,
            enhancedAgents: this.enhancedAgents.size,
            ragEnabled: this.config.ragEnabled,
            operaEnabled: this.config.operaEnabled,
            autonomousMode: this.config.autonomousMode
        };
        if (this.operaOrchestrator) {
            const operaState = await this.operaOrchestrator.getState();
            metrics['operaMetrics'] = {
                activeGoals: operaState.currentGoals.length,
                activeDecisions: operaState.activeDecisions.length,
                queuedSteps: operaState.executionQueue.length,
                performance: operaState.performance
            };
        }
        // Query memory statistics
        const memoryStats = await this.getMemoryStatistics();
        metrics['memoryStats'] = memoryStats;
        return metrics;
    }
    /**
     * Get memory statistics
     */
    async getMemoryStatistics() {
        // Query total memories per agent
        const agentStats = {};
        for (const agentId of this.enhancedAgents.keys()) {
            const query = {
                query: '',
                agentId,
                topK: 1000 // Get count
            };
            const results = await vectorMemoryStore.queryMemories(query);
            agentStats[agentId] = results.documents.length;
        }
        return {
            totalMemories: Object.values(agentStats).reduce((sum, count) => sum + count, 0),
            agentBreakdown: agentStats
        };
    }
}
// Export singleton instance
export const enhancedOPERA = new EnhancedOPERACoordinator();
//# sourceMappingURL=enhanced-opera-coordinator.js.map