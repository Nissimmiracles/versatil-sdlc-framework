/**
 * VERSATIL SDLC Framework - MCP Server Implementation v2
 * SDK v1.18.2 Compatible
 * Model Context Protocol server for agent communication and tool integration
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AgentRegistry } from '../agents/core/agent-registry.js';
import { SDLCOrchestrator } from '../flywheel/sdlc-orchestrator.js';
import { VERSATILLogger } from '../utils/logger.js';
import { PerformanceMonitor } from '../analytics/performance-monitor.js';
import { type ContextIdentity } from '../isolation/context-identity.js';
import { type ProjectContext, MultiProjectManager } from '../isolation/multi-project-manager.js';
export interface VERSATILMCPConfig {
    name: string;
    version: string;
    agents?: AgentRegistry;
    orchestrator?: SDLCOrchestrator;
    logger?: VERSATILLogger;
    performanceMonitor?: PerformanceMonitor;
    projectPath?: string;
    lazyInit?: boolean;
    contextIdentity?: ContextIdentity;
    projectContext?: ProjectContext;
    projectManager?: MultiProjectManager;
}
export declare class VERSATILMCPServerV2 {
    private server;
    private config;
    private onboardingCompleted;
    private docsSearchEngine;
    private lazyInitialized;
    private eventCallbacks;
    private boundaryEngine;
    private zeroTrust;
    constructor(config: VERSATILMCPConfig);
    /**
     * Lazy initialize ShadcnMCPExecutor with correct projectPath
     */
    private ensureShadcnInitialized;
    /**
     * EventEmitter-like API for lazy initialization events
     */
    on(event: string, callback: (...args: any[]) => void): void;
    emit(event: string, data: any): void;
    /**
     * Phase 7.6.0: Check if file access is allowed based on context identity
     */
    private checkFileAccess;
    /**
     * Phase 7.6.0: Check if agent invocation is allowed based on context identity
     */
    private checkAgentAccess;
    /**
     * Phase 7.6.0: Filter RAG results based on context identity
     */
    private filterRagResults;
    /**
     * Lazy initialize heavy dependencies on first tool call
     */
    private lazyInitialize;
    /**
     * Check and run MCP onboarding if needed (first-time setup)
     */
    checkAndRunOnboarding(): Promise<void>;
    /**
     * Register MCP Resources - Expose framework data and metrics
     */
    private registerResources;
    /**
     * Register MCP Prompts - Pre-configured prompts for common development tasks
     */
    private registerPrompts;
    private registerTools;
    /**
     * Connect to a transport (stdio, SSE, etc.)
     */
    connect(transport: any): Promise<void>;
    /**
     * Start server with stdio transport (default)
     */
    start(): Promise<void>;
    stop(): Promise<void>;
    getServer(): McpServer;
}
