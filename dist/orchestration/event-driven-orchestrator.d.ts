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
import { AgentResponse, AgentActivationContext } from '../agents/core/base-agent.js';
import { AgentPool } from '../agents/core/agent-pool.js';
/**
 * Agent lifecycle events
 */
export declare enum AgentEvent {
    ACTIVATED = "agent:activated",
    COMPLETED = "agent:completed",
    HANDOFF = "agent:handoff",
    ERROR = "agent:error",
    PROGRESS = "agent:progress",
    CHAIN_STARTED = "chain:started",
    CHAIN_COMPLETED = "chain:completed"
}
/**
 * Handoff request structure
 */
export interface HandoffRequest {
    fromAgent: string;
    toAgent: string;
    context: AgentActivationContext;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reason: string;
    timestamp: number;
    metadata?: Record<string, any>;
}
/**
 * Agent event data
 */
export interface AgentEventData {
    agentId: string;
    context: AgentActivationContext;
    result?: AgentResponse;
    error?: Error;
    progress?: number;
    timestamp: number;
}
/**
 * Handoff chain tracking
 */
interface HandoffChain {
    chainId: string;
    agents: string[];
    startTime: number;
    currentAgent: string | null;
    completed: boolean;
}
/**
 * Event-Driven Orchestrator
 *
 * Features:
 * - Immediate handoffs via event bus (no polling)
 * - Priority queue for urgent handoffs
 * - Pre-activation of next agent in chain
 * - Full handoff telemetry
 */
export declare class EventDrivenOrchestrator extends EventEmitter {
    private agentPool;
    private handoffQueue;
    private activeChains;
    private handoffMetrics;
    constructor(agentPool: AgentPool);
    /**
     * Setup event listeners for agent lifecycle
     */
    private setupEventListeners;
    /**
     * Start an agent activation chain
     */
    startChain(agentIds: string[], context: AgentActivationContext): Promise<string>;
    /**
     * Activate next agent in the chain
     */
    private activateNextAgent;
    /**
     * Handle agent completion and continue chain
     */
    private handleAgentCompletion;
    /**
     * Handle explicit handoff requests
     */
    private handleHandoffRequest;
    /**
     * Handle explicit handoffs from agent responses
     */
    private handleExplicitHandoffs;
    /**
     * Add handoff to priority queue
     */
    private addToQueue;
    /**
     * Process handoff queue
     */
    private processQueue;
    /**
     * Handle agent errors
     */
    private handleAgentError;
    /**
     * Complete a chain
     */
    private completeChain;
    /**
     * Update handoff metrics
     */
    private updateHandoffMetrics;
    /**
     * Get handoff metrics
     */
    getMetrics(): {
        totalHandoffs: number;
        averageLatency: number;
        successRate: number;
        targetLatency: number;
        improvement: string;
    };
    /**
     * Get active chains
     */
    getActiveChains(): HandoffChain[];
    /**
     * Shutdown orchestrator
     */
    shutdown(): Promise<void>;
}
export {};
