/**
 * VERSATIL SDLC Framework - Emergency Response System
 * Automatic agent cascade for critical development situations
 *
 * This system handles emergencies like:
 * - Build failures that block development
 * - Router issues that break the entire application
 * - Dependency conflicts that prevent deployment
 * - Security vulnerabilities that need immediate attention
 * - Performance issues that impact user experience
 */
interface EmergencyContext {
    type: EmergencyType;
    severity: EmergencySeverity;
    errorMessage: string;
    affectedSystems: string[];
    detectedAt: Date;
    stackTrace?: string;
    affectedFiles?: string[];
    userImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    businessImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
}
export type EmergencyType = 'build_failure' | 'runtime_error' | 'dependency_conflict' | 'security_vulnerability' | 'performance_degradation' | 'data_loss_risk' | 'router_failure' | 'api_failure' | 'deployment_failure' | 'test_failure_cascade' | 'memory_leak' | 'infinite_loop';
export type EmergencySeverity = 'low' | 'medium' | 'high' | 'critical' | 'catastrophic';
interface EmergencyResponse {
    responseId: string;
    activatedAgents: string[];
    mcpToolsActivated: string[];
    timeline: EmergencyAction[];
    estimatedResolutionTime: number;
    escalationRequired: boolean;
    status: 'responding' | 'investigating' | 'fixing' | 'testing' | 'resolved' | 'escalated';
    resolution?: string;
}
interface EmergencyAction {
    timestamp: Date;
    agent: string;
    action: string;
    result: 'success' | 'failure' | 'partial' | 'pending';
    details: string;
    nextActions?: string[];
}
/**
 * Emergency Response Coordination System
 * Handles critical development situations with automatic agent cascade
 */
declare class EmergencyResponseSystem {
    private activeEmergencies;
    private emergencyRules;
    private responseQueue;
    private isProcessing;
    private maxConcurrentEmergencies;
    constructor();
    /**
     * Initialize Emergency Response System
     */
    private initializeEmergencySystem;
    /**
     * Main Emergency Handler - Entry Point for All Emergencies
     */
    handleEmergency(errorMessage: string, context?: Partial<EmergencyContext>): Promise<EmergencyResponse>;
    /**
     * Classify Emergency Type and Severity
     */
    private classifyEmergency;
    /**
     * Execute Emergency Response Protocol
     */
    private executeEmergencyResponse;
    /**
     * Get Primary Agents for Emergency Type
     */
    private getPrimaryAgentsForEmergency;
    /**
     * Activate Primary Agents for Emergency
     */
    private activatePrimaryAgents;
    /**
     * Activate Emergency MCP Tools
     */
    private activateEmergencyMCPTools;
    /**
     * Activate Emergency MCP Tool
     */
    private activateEmergencyMCP;
    /**
     * Run Emergency Diagnostics
     */
    private runEmergencyDiagnostics;
    /**
     * Build Failure Diagnostics
     */
    private diagnosticsBuildFailure;
    /**
     * Router Failure Diagnostics (learned from our experience)
     */
    private diagnosticsRouterFailure;
    /**
     * Dependency Conflict Diagnostics
     */
    private diagnosticsDependencyConflict;
    /**
     * API Failure Diagnostics
     */
    private diagnosticsAPIFailure;
    private runApiHealthChecks;
    /**
     * Generic Error Diagnostics
     */
    private diagnosticsGenericError;
    /**
     * Execute Coordinated Fix
     */
    private executeCoordinatedFix;
    private getAgentInstance;
    /**
     * Validate Emergency Fix
     */
    private validateEmergencyFix;
    /**
     * Helper Methods
     */
    private identifyAffectedSystems;
    private estimateResolutionTime;
    private shouldEscalate;
    private setupEmergencyRules;
    private setupSystemMonitoring;
    private initializeEscalationRules;
    private setupEmergencyQueue;
    private connectToVERSATILSystems;
    private escalateEmergency;
    private logEmergencyResolution;
    /**
     * Public API Methods
     */
    getActiveEmergencies(): EmergencyResponse[];
    getEmergencyStatus(responseId: string): Promise<EmergencyResponse | null>;
    getSystemStatus(): {
        activeEmergencies: number;
        queuedEmergencies: number;
        maxConcurrentEmergencies: number;
        isProcessing: boolean;
        emergencyRules: number;
        status: string;
    };
}
export declare const emergencyResponseSystem: EmergencyResponseSystem;
export declare function handleEmergencyResponse(errorMessage: string, context?: Partial<EmergencyContext>): Promise<EmergencyResponse>;
export declare function getActiveEmergencies(): EmergencyResponse[];
export declare function getEmergencySystemStatus(): {
    activeEmergencies: number;
    queuedEmergencies: number;
    maxConcurrentEmergencies: number;
    isProcessing: boolean;
    emergencyRules: number;
    status: string;
};
export {};
