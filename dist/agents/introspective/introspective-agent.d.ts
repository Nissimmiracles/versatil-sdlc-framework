/**
 * VERSATIL SDLC Framework - Introspective Agent
 *
 * This agent continuously monitors and tests the framework itself,
 * ensuring all components are working correctly and learning from
 * any issues that arise.
 */
import { BaseAgent } from '../base-agent.js';
import { AgentResponse, AgentActivationContext } from '../agent-types.js';
import { VERSATILLogger } from '../../utils/logger.js';
export declare class IntrospectiveAgent extends BaseAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    private logger;
    private testResults;
    private healthMetrics;
    constructor(logger: VERSATILLogger);
    private startContinuousMonitoring;
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    private isFrameworkFile;
    private performHealthCheck;
    private runHealthCheck;
    private checkFileSystem;
    private checkAgentRegistry;
    private checkMemorySystem;
    private checkOperaStatus;
    private checkAPIEndpoints;
    private performSelfTest;
    private testFileSystem;
    private testImports;
    private testAgentCommunication;
    private testMemoryOperations;
    private testErrorRecovery;
    private diagnoseFrameworkError;
    private analyzeFrameworkFile;
    private storeErrorPattern;
    runContinuousValidation(): Promise<void>;
    getHealthReport(): any;
    private createErrorResponse;
}
