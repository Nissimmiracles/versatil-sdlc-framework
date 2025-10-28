/**
 * VERSATIL SDLC Framework - Integrated Security Orchestrator
 * Coordinates all security systems for enterprise-grade protection
 */
import { EventEmitter } from 'events';
import { z } from 'zod';
export declare const SecurityIncidentSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodString;
    incident_type: z.ZodEnum<["boundary_violation", "path_traversal_attack", "privilege_escalation", "unauthorized_access", "data_exfiltration", "system_compromise", "policy_violation"]>;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    source_system: z.ZodString;
    project_id: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    evidence: z.ZodRecord<z.ZodString, z.ZodAny>;
    response_actions: z.ZodArray<z.ZodString, "many">;
    status: z.ZodEnum<["detected", "investigating", "contained", "resolved", "escalated"]>;
    resolved_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "investigating" | "resolved" | "escalated" | "detected" | "contained";
    timestamp?: string;
    id?: string;
    description?: string;
    severity?: "low" | "medium" | "high" | "critical";
    evidence?: Record<string, any>;
    project_id?: string;
    response_actions?: string[];
    incident_type?: "unauthorized_access" | "privilege_escalation" | "data_exfiltration" | "boundary_violation" | "path_traversal_attack" | "system_compromise" | "policy_violation";
    source_system?: string;
    resolved_at?: string;
}, {
    status?: "investigating" | "resolved" | "escalated" | "detected" | "contained";
    timestamp?: string;
    id?: string;
    description?: string;
    severity?: "low" | "medium" | "high" | "critical";
    evidence?: Record<string, any>;
    project_id?: string;
    response_actions?: string[];
    incident_type?: "unauthorized_access" | "privilege_escalation" | "data_exfiltration" | "boundary_violation" | "path_traversal_attack" | "system_compromise" | "policy_violation";
    source_system?: string;
    resolved_at?: string;
}>;
export declare const SecurityPostureSchema: z.ZodObject<{
    overall_score: z.ZodNumber;
    last_assessment: z.ZodString;
    compliance_status: z.ZodEnum<["compliant", "warning", "violation", "critical"]>;
    active_threats: z.ZodNumber;
    resolved_incidents: z.ZodNumber;
    system_health: z.ZodObject<{
        microsegmentation: z.ZodNumber;
        zero_trust: z.ZodNumber;
        boundary_enforcement: z.ZodNumber;
        path_protection: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        zero_trust?: number;
        microsegmentation?: number;
        boundary_enforcement?: number;
        path_protection?: number;
    }, {
        zero_trust?: number;
        microsegmentation?: number;
        boundary_enforcement?: number;
        path_protection?: number;
    }>;
    recommendations: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    recommendations?: string[];
    overall_score?: number;
    compliance_status?: "warning" | "critical" | "violation" | "compliant";
    last_assessment?: string;
    active_threats?: number;
    resolved_incidents?: number;
    system_health?: {
        zero_trust?: number;
        microsegmentation?: number;
        boundary_enforcement?: number;
        path_protection?: number;
    };
}, {
    recommendations?: string[];
    overall_score?: number;
    compliance_status?: "warning" | "critical" | "violation" | "compliant";
    last_assessment?: string;
    active_threats?: number;
    resolved_incidents?: number;
    system_health?: {
        zero_trust?: number;
        microsegmentation?: number;
        boundary_enforcement?: number;
        path_protection?: number;
    };
}>;
export type SecurityIncident = z.infer<typeof SecurityIncidentSchema>;
export type SecurityPosture = z.infer<typeof SecurityPostureSchema>;
export declare class IntegratedSecurityOrchestrator extends EventEmitter {
    private microsegmentation;
    private zeroTrust;
    private boundaryEnforcement;
    private pathProtection;
    private incidents;
    private logger;
    private frameworkRoot;
    private versatilHome;
    private securityEnabled;
    private monitoringInterval;
    private blockedProjects;
    private networkIsolatedProjects?;
    private operationalMode;
    private pausedOperations?;
    constructor(frameworkRoot: string);
    private initializeSecuritySystems;
    private setupEventHandlers;
    private startSecurityMonitoring;
    private handleSecurityEvent;
    private handleCriticalIncident;
    private handleBoundaryViolation;
    private handlePathTraversalAttempt;
    private handleUnsafePath;
    private createSecurityIncident;
    private processIncident;
    private executeResponseActions;
    private executeAction;
    private executeEmergencyProtocol;
    private quarantineProject;
    private blockProjectAccess;
    private enhanceProjectMonitoring;
    private alertSecurityTeam;
    private backupProjectState;
    private isolateNetworkAccess;
    private triggerForensicAnalysis;
    private pauseNonEssentialOperations;
    private preserveEvidence;
    private escalateToZeroTrust;
    private escalateCriticalIncident;
    private performSecurityAssessment;
    createSecureProject(projectId: string, projectPath: string, securityLevel?: 'standard' | 'enhanced' | 'maximum'): Promise<{
        success: boolean;
        securityContext?: any;
        error?: string;
    }>;
    validateSecureAccess(projectId: string, operation: 'read' | 'write' | 'execute', targetPath: string): Promise<{
        allowed: boolean;
        reason?: string;
        security_incident?: SecurityIncident;
    }>;
    getSecurityStatus(): any;
    getSecurityIncidents(limit?: number): SecurityIncident[];
    getActiveIncidents(): SecurityIncident[];
    getCriticalIncidents(): SecurityIncident[];
    getResolvedIncidents(): SecurityIncident[];
    exportComprehensiveSecurityReport(): Promise<any>;
    stopSecurityMonitoring(): void;
    private mapEventToIncidentType;
    private mapEventSeverity;
    private generateEventDescription;
    private generateResponseActions;
    private generateIncidentId;
    private logToSecurityAudit;
    private captureSystemState;
    private collectSystemLogs;
    private collectRecentSecurityEvents;
    private getActiveThreats;
    private assessMicrosegmentationHealth;
    private assessZeroTrustHealth;
    private assessBoundaryEnforcementHealth;
    private assessPathProtectionHealth;
    private generateSecurityRecommendations;
}
export default IntegratedSecurityOrchestrator;
