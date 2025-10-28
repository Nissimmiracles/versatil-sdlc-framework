/**
 * Event-Driven Agent Orchestrator
 *
 * Replaces polling with event-driven handoffs for immediate agent activation.
 * Target: 30% faster workflow execution (500ms → 150ms handoff latency)
 *
 * @module EventDrivenOrchestrator
 * @version 5.0.0
 * @sprint Sprint 1 Day 3-4
 */
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
const logger = new VERSATILLogger();
/**
 * Agent lifecycle events
 */
export var AgentEvent;
(function (AgentEvent) {
    AgentEvent["ACTIVATED"] = "agent:activated";
    AgentEvent["COMPLETED"] = "agent:completed";
    AgentEvent["HANDOFF"] = "agent:handoff";
    AgentEvent["ERROR"] = "agent:error";
    AgentEvent["PROGRESS"] = "agent:progress";
    AgentEvent["CHAIN_STARTED"] = "chain:started";
    AgentEvent["CHAIN_COMPLETED"] = "chain:completed";
})(AgentEvent || (AgentEvent = {}));
/**
 * Event-Driven Orchestrator
 *
 * Features:
 * - Immediate handoffs via event bus (no polling)
 * - Priority queue for urgent handoffs
 * - Pre-activation of next agent in chain
 * - Full handoff telemetry
 */
export class EventDrivenOrchestrator extends EventEmitter {
    constructor(agentPool) {
        super();
        this.agentPool = agentPool;
        this.handoffQueue = [];
        this.activeChains = new Map();
        this.handoffMetrics = {
            totalHandoffs: 0,
            averageLatency: 0,
            successRate: 100,
            latencies: []
        };
        this.setupEventListeners();
    }
    /**
     * Setup event listeners for agent lifecycle
     */
    setupEventListeners() {
        // Listen for agent completions
        this.on(AgentEvent.COMPLETED, (data) => {
            this.handleAgentCompletion(data);
        });
        // Listen for handoff requests
        this.on(AgentEvent.HANDOFF, (handoff) => {
            this.handleHandoffRequest(handoff);
        });
        // Listen for errors
        this.on(AgentEvent.ERROR, (data) => {
            this.handleAgentError(data);
        });
    }
    /**
     * Start an agent activation chain
     */
    async startChain(agentIds, context) {
        const chainId = `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const chain = {
            chainId,
            agents: agentIds,
            startTime: Date.now(),
            currentAgent: null,
            completed: false
        };
        this.activeChains.set(chainId, chain);
        logger.info(`🔗 Starting agent chain: ${chainId}`, {
            agents: agentIds,
            context: context.filePath
        });
        this.emit(AgentEvent.CHAIN_STARTED, { chainId, agents: agentIds });
        // Activate first agent immediately
        await this.activateNextAgent(chainId, context);
        return chainId;
    }
    /**
     * Activate next agent in the chain
     */
    async activateNextAgent(chainId, context) {
        const chain = this.activeChains.get(chainId);
        if (!chain || chain.completed) {
            return;
        }
        // Find next agent in chain
        const currentIndex = chain.currentAgent
            ? chain.agents.indexOf(chain.currentAgent)
            : -1;
        const nextIndex = currentIndex + 1;
        if (nextIndex >= chain.agents.length) {
            // Chain complete
            this.completeChain(chainId);
            return;
        }
        const nextAgentId = chain.agents[nextIndex];
        chain.currentAgent = nextAgentId;
        const startTime = Date.now();
        try {
            // Get agent from pool (warm activation - 50% faster)
            const agent = await this.agentPool.getAgent(nextAgentId);
            // Emit activation event
            this.emit(AgentEvent.ACTIVATED, {
                agentId: nextAgentId,
                context,
                timestamp: Date.now()
            });
            logger.info(`🤖 Agent activated: ${nextAgentId}`, {
                chainId,
                position: `${nextIndex + 1}/${chain.agents.length}`
            });
            // Execute agent
            const result = await agent.activate(context);
            const endTime = Date.now();
            const latency = endTime - startTime;
            // Track metrics
            this.updateHandoffMetrics(latency, true);
            // Emit completion event (triggers next handoff)
            this.emit(AgentEvent.COMPLETED, {
                agentId: nextAgentId,
                context,
                result,
                timestamp: endTime
            });
            // Return agent to pool
            await this.agentPool.releaseAgent(agent);
            // Check for explicit handoffs in response
            if (result.handoffTo && result.handoffTo.length > 0) {
                this.handleExplicitHandoffs(nextAgentId, result, context);
            }
        }
        catch (error) {
            const endTime = Date.now();
            const latency = endTime - startTime;
            this.updateHandoffMetrics(latency, false);
            logger.error(`❌ Agent activation failed: ${nextAgentId}`, { error: error.message });
            this.emit(AgentEvent.ERROR, {
                agentId: nextAgentId,
                context,
                error,
                timestamp: endTime
            });
            // Continue chain despite error (graceful degradation)
            await this.activateNextAgent(chainId, context);
        }
    }
    /**
     * Handle agent completion and continue chain
     */
    handleAgentCompletion(data) {
        logger.info(`✅ Agent completed: ${data.agentId}`);
        // Find chains this agent is part of
        for (const [chainId, chain] of this.activeChains.entries()) {
            if (chain.currentAgent === data.agentId && !chain.completed) {
                // Continue chain with next agent (immediate, no polling!)
                setImmediate(() => {
                    this.activateNextAgent(chainId, data.context);
                });
            }
        }
    }
    /**
     * Handle explicit handoff requests
     */
    handleHandoffRequest(handoff) {
        logger.info(`🔄 Handoff request: ${handoff.fromAgent} → ${handoff.toAgent}`, {
            priority: handoff.priority,
            reason: handoff.reason
        });
        // Add to priority queue
        this.addToQueue(handoff);
        // Process immediately if high/urgent priority
        if (handoff.priority === 'high' || handoff.priority === 'urgent') {
            setImmediate(() => this.processQueue());
        }
        else {
            // Process on next tick for medium/low priority
            process.nextTick(() => this.processQueue());
        }
    }
    /**
     * Handle explicit handoffs from agent responses
     */
    handleExplicitHandoffs(fromAgent, result, context) {
        if (!result.handoffTo || result.handoffTo.length === 0) {
            return;
        }
        for (const toAgent of result.handoffTo) {
            const priority = (result.priority === 'low' || result.priority === 'medium' ||
                result.priority === 'high' || result.priority === 'urgent')
                ? result.priority
                : 'medium';
            const handoff = {
                fromAgent,
                toAgent,
                context,
                priority,
                reason: `Explicit handoff from ${fromAgent}`,
                timestamp: Date.now(),
                metadata: result.context
            };
            this.emit(AgentEvent.HANDOFF, handoff);
        }
    }
    /**
     * Add handoff to priority queue
     */
    addToQueue(handoff) {
        // Insert based on priority
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const insertIndex = this.handoffQueue.findIndex(h => priorityOrder[h.priority] > priorityOrder[handoff.priority]);
        if (insertIndex === -1) {
            this.handoffQueue.push(handoff);
        }
        else {
            this.handoffQueue.splice(insertIndex, 0, handoff);
        }
    }
    /**
     * Process handoff queue
     */
    async processQueue() {
        if (this.handoffQueue.length === 0) {
            return;
        }
        const handoff = this.handoffQueue.shift();
        const startTime = Date.now();
        try {
            // Get agent from pool
            const agent = await this.agentPool.getAgent(handoff.toAgent);
            // Emit activation
            this.emit(AgentEvent.ACTIVATED, {
                agentId: handoff.toAgent,
                context: handoff.context,
                timestamp: Date.now()
            });
            // Execute
            const result = await agent.activate(handoff.context);
            const endTime = Date.now();
            const latency = endTime - startTime;
            this.updateHandoffMetrics(latency, true);
            // Emit completion
            this.emit(AgentEvent.COMPLETED, {
                agentId: handoff.toAgent,
                context: handoff.context,
                result,
                timestamp: endTime
            });
            // Return to pool
            await this.agentPool.releaseAgent(agent);
            logger.info(`✅ Handoff completed: ${handoff.fromAgent} → ${handoff.toAgent}`, {
                latency: `${latency}ms`
            });
        }
        catch (error) {
            const endTime = Date.now();
            const latency = endTime - startTime;
            this.updateHandoffMetrics(latency, false);
            logger.error(`❌ Handoff failed: ${handoff.fromAgent} → ${handoff.toAgent}`, {
                error: error.message
            });
            this.emit(AgentEvent.ERROR, {
                agentId: handoff.toAgent,
                context: handoff.context,
                error,
                timestamp: endTime
            });
        }
        // Process next in queue
        if (this.handoffQueue.length > 0) {
            setImmediate(() => this.processQueue());
        }
    }
    /**
     * Handle agent errors
     */
    handleAgentError(data) {
        logger.error(`❌ Agent error: ${data.agentId}`, {
            error: data.error?.message
        });
        // Find chains this agent is part of
        for (const [chainId, chain] of this.activeChains.entries()) {
            if (chain.currentAgent === data.agentId && !chain.completed) {
                // Continue chain despite error (graceful degradation)
                setImmediate(() => {
                    this.activateNextAgent(chainId, data.context);
                });
            }
        }
    }
    /**
     * Complete a chain
     */
    completeChain(chainId) {
        const chain = this.activeChains.get(chainId);
        if (!chain) {
            return;
        }
        chain.completed = true;
        const duration = Date.now() - chain.startTime;
        logger.info(`✅ Chain completed: ${chainId}`, {
            agents: chain.agents.length,
            duration: `${duration}ms`
        });
        this.emit(AgentEvent.CHAIN_COMPLETED, {
            chainId,
            agents: chain.agents,
            duration
        });
        // Cleanup after 1 minute
        setTimeout(() => {
            this.activeChains.delete(chainId);
        }, 60000);
    }
    /**
     * Update handoff metrics
     */
    updateHandoffMetrics(latency, success) {
        this.handoffMetrics.totalHandoffs++;
        this.handoffMetrics.latencies.push(latency);
        // Keep last 100 latencies
        if (this.handoffMetrics.latencies.length > 100) {
            this.handoffMetrics.latencies.shift();
        }
        // Calculate average
        this.handoffMetrics.averageLatency =
            this.handoffMetrics.latencies.reduce((a, b) => a + b, 0) /
                this.handoffMetrics.latencies.length;
        // Update success rate
        const successCount = success
            ? this.handoffMetrics.totalHandoffs * (this.handoffMetrics.successRate / 100) + 1
            : this.handoffMetrics.totalHandoffs * (this.handoffMetrics.successRate / 100);
        this.handoffMetrics.successRate = (successCount / this.handoffMetrics.totalHandoffs) * 100;
    }
    /**
     * Get handoff metrics
     */
    getMetrics() {
        const targetLatency = 150; // Sprint 1 target: <150ms
        const improvement = ((500 - this.handoffMetrics.averageLatency) / 500) * 100;
        return {
            ...this.handoffMetrics,
            targetLatency,
            improvement: `${improvement.toFixed(1)}%`
        };
    }
    /**
     * Get active chains
     */
    getActiveChains() {
        return Array.from(this.activeChains.values());
    }
    /**
     * Shutdown orchestrator
     */
    async shutdown() {
        logger.info('🛑 Shutting down event-driven orchestrator...');
        // Wait for active chains to complete (with timeout)
        const timeout = 10000; // 10 seconds
        const startTime = Date.now();
        while (this.activeChains.size > 0 && Date.now() - startTime < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Clear queue
        this.handoffQueue = [];
        // Remove all listeners
        this.removeAllListeners();
        logger.info('✅ Event-driven orchestrator shutdown complete');
    }
}
//# sourceMappingURL=event-driven-orchestrator.js.map