/**
 * VERSATIL SDLC Framework - Development Environment Integration
 * Connects theoretical agent dispatcher to actual Claude Code/Cursor environment
 *
 * This service makes the OPERA methodology work in practice by:
 * - Monitoring actual file system changes
 * - Triggering real MCP tool activations
 * - Running actual quality gates
 * - Managing development lifecycle
 */
import { EventEmitter } from 'events';
interface DevelopmentContext {
    projectRoot: string;
    nodeEnv: string;
    activeServices: string[];
    runningTests: boolean;
    lastError?: string;
}
/**
 * Development Environment Integration Service
 * Bridges VERSATIL framework with actual development tools
 */
declare class VERSATILDevelopmentIntegration extends EventEmitter {
    private context;
    private isInitialized;
    private qualityGateResults;
    constructor();
    /**
     * Initialize Development Integration
     */
    private initialize;
    /**
     * Setup Real File System Watching (replaces mock watching)
     */
    private setupRealFileWatching;
    /**
     * Fallback to native Node.js file watching
     */
    private setupNativeFileWatching;
    /**
     * Handle Real File Changes - Trigger Actual Agent Activation
     */
    private handleRealFileChange;
    /**
     * Connect to Actual MCP Services
     */
    private connectToMCPServices;
    /**
     * Test MCP Connection
     */
    private testMCPConnection;
    /**
     * Setup Development Lifecycle Hooks
     */
    private setupDevelopmentHooks;
    /**
     * Setup Agent Activation Pipeline
     */
    private setupAgentActivationPipeline;
    /**
     * Handle Agent Activated Event
     */
    private handleAgentActivated;
    /**
     * Run Pre-Activation Quality Gates
     */
    private runPreActivationGates;
    /**
     * Find Agents for File Changes
     */
    private findAgentsForFile;
    /**
     * Activate Real Agent with Actual Context
     */
    private activateRealAgent;
    /**
     * Activate Agent-Specific MCP Tools
     */
    private activateAgentMCPTools;
    /**
     * Activate Real MCP Tool (connects to actual MCP system)
     */
    private activateRealMCPTool;
    /**
     * Handle Development Errors - Emergency Protocol
     */
    private handleDevelopmentError;
    /**
     * Handle Emergency Protocol Event
     */
    private handleEmergencyProtocol;
    /**
     * Log Agent Activation for Context Preservation (Logan's job)
     */
    private logAgentActivation;
    /**
     * Log Emergency Protocol for Context Preservation
     */
    private logEmergencyProtocol;
    /**
     * Write to Context Log
     */
    private writeToContextLog;
    /**
     * Activate Emergency MCP Tools
     */
    private activateEmergencyMCPTools;
    /**
     * Helper Methods
     */
    private readFileSafely;
    private shouldIgnoreFile;
    private runPostActivationValidation;
    /**
     * Get Integration Status
     */
    getIntegrationStatus(): {
        initialized: boolean;
        context: DevelopmentContext;
        activeServices: string[];
        qualityGateResults: {
            [k: string]: any;
        };
        status: string;
    };
    /**
     * Cleanup
     */
    private cleanup;
}
export declare const versatilDevIntegration: VERSATILDevelopmentIntegration;
export declare function getVERSATILDevStatus(): {
    initialized: boolean;
    context: DevelopmentContext;
    activeServices: string[];
    qualityGateResults: {
        [k: string]: any;
    };
    status: string;
};
export {};
