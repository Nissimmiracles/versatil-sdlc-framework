/**
 * VERSATIL SDLC Framework - Zero Trust Project Isolation Engine
 * Implements zero-trust principles for project isolation with continuous verification
 */
import { EventEmitter } from 'events';
import { z } from 'zod';
export declare const ZeroTrustPolicySchema: z.ZodObject<{
    never_trust: z.ZodDefault<z.ZodBoolean>;
    always_verify: z.ZodDefault<z.ZodBoolean>;
    assume_breach: z.ZodDefault<z.ZodBoolean>;
    principle_of_least_privilege: z.ZodDefault<z.ZodBoolean>;
    continuous_monitoring: z.ZodDefault<z.ZodBoolean>;
    adaptive_response: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    never_trust?: boolean;
    always_verify?: boolean;
    assume_breach?: boolean;
    principle_of_least_privilege?: boolean;
    continuous_monitoring?: boolean;
    adaptive_response?: boolean;
}, {
    never_trust?: boolean;
    always_verify?: boolean;
    assume_breach?: boolean;
    principle_of_least_privilege?: boolean;
    continuous_monitoring?: boolean;
    adaptive_response?: boolean;
}>;
export declare const ProjectIsolationBoundarySchema: z.ZodObject<{
    boundary_id: z.ZodString;
    project_id: z.ZodString;
    boundary_type: z.ZodEnum<["physical", "logical", "temporal", "credential"]>;
    enforcement_mechanisms: z.ZodArray<z.ZodObject<{
        mechanism: z.ZodString;
        strength: z.ZodEnum<["weak", "medium", "strong", "cryptographic"]>;
        monitoring_enabled: z.ZodBoolean;
        automatic_remediation: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        monitoring_enabled?: boolean;
        mechanism?: string;
        strength?: "medium" | "strong" | "weak" | "cryptographic";
        automatic_remediation?: boolean;
    }, {
        monitoring_enabled?: boolean;
        mechanism?: string;
        strength?: "medium" | "strong" | "weak" | "cryptographic";
        automatic_remediation?: boolean;
    }>, "many">;
    verification_checks: z.ZodArray<z.ZodObject<{
        check_name: z.ZodString;
        frequency: z.ZodEnum<["continuous", "periodic", "on_access", "on_change"]>;
        failure_action: z.ZodEnum<["log", "alert", "block", "quarantine"]>;
        remediation_steps: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        frequency?: "continuous" | "periodic" | "on_access" | "on_change";
        check_name?: string;
        failure_action?: "log" | "alert" | "quarantine" | "block";
        remediation_steps?: string[];
    }, {
        frequency?: "continuous" | "periodic" | "on_access" | "on_change";
        check_name?: string;
        failure_action?: "log" | "alert" | "quarantine" | "block";
        remediation_steps?: string[];
    }>, "many">;
    metrics: z.ZodObject<{
        boundary_integrity_score: z.ZodNumber;
        breach_attempts: z.ZodNumber;
        last_verification: z.ZodString;
        verification_failures: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        boundary_integrity_score?: number;
        breach_attempts?: number;
        last_verification?: string;
        verification_failures?: number;
    }, {
        boundary_integrity_score?: number;
        breach_attempts?: number;
        last_verification?: string;
        verification_failures?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    metrics?: {
        boundary_integrity_score?: number;
        breach_attempts?: number;
        last_verification?: string;
        verification_failures?: number;
    };
    project_id?: string;
    boundary_id?: string;
    boundary_type?: "credential" | "physical" | "logical" | "temporal";
    enforcement_mechanisms?: {
        monitoring_enabled?: boolean;
        mechanism?: string;
        strength?: "medium" | "strong" | "weak" | "cryptographic";
        automatic_remediation?: boolean;
    }[];
    verification_checks?: {
        frequency?: "continuous" | "periodic" | "on_access" | "on_change";
        check_name?: string;
        failure_action?: "log" | "alert" | "quarantine" | "block";
        remediation_steps?: string[];
    }[];
}, {
    metrics?: {
        boundary_integrity_score?: number;
        breach_attempts?: number;
        last_verification?: string;
        verification_failures?: number;
    };
    project_id?: string;
    boundary_id?: string;
    boundary_type?: "credential" | "physical" | "logical" | "temporal";
    enforcement_mechanisms?: {
        monitoring_enabled?: boolean;
        mechanism?: string;
        strength?: "medium" | "strong" | "weak" | "cryptographic";
        automatic_remediation?: boolean;
    }[];
    verification_checks?: {
        frequency?: "continuous" | "periodic" | "on_access" | "on_change";
        check_name?: string;
        failure_action?: "log" | "alert" | "quarantine" | "block";
        remediation_steps?: string[];
    }[];
}>;
export declare const ThreatDetectionRuleSchema: z.ZodObject<{
    rule_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    threat_category: z.ZodEnum<["data_exfiltration", "privilege_escalation", "lateral_movement", "persistence", "code_injection", "configuration_tampering", "resource_exhaustion"]>;
    detection_patterns: z.ZodArray<z.ZodObject<{
        pattern_type: z.ZodEnum<["file_access", "process_behavior", "network_activity", "system_call"]>;
        pattern: z.ZodString;
        severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        confidence?: number;
        pattern?: string;
        severity?: "low" | "medium" | "high" | "critical";
        pattern_type?: "file_access" | "process_behavior" | "network_activity" | "system_call";
    }, {
        confidence?: number;
        pattern?: string;
        severity?: "low" | "medium" | "high" | "critical";
        pattern_type?: "file_access" | "process_behavior" | "network_activity" | "system_call";
    }>, "many">;
    response_actions: z.ZodArray<z.ZodObject<{
        action: z.ZodString;
        priority: z.ZodNumber;
        automatic: z.ZodBoolean;
        requires_approval: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        action?: string;
        priority?: number;
        automatic?: boolean;
        requires_approval?: boolean;
    }, {
        action?: string;
        priority?: number;
        automatic?: boolean;
        requires_approval?: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    rule_id?: string;
    threat_category?: "resource_exhaustion" | "privilege_escalation" | "data_exfiltration" | "lateral_movement" | "persistence" | "code_injection" | "configuration_tampering";
    detection_patterns?: {
        confidence?: number;
        pattern?: string;
        severity?: "low" | "medium" | "high" | "critical";
        pattern_type?: "file_access" | "process_behavior" | "network_activity" | "system_call";
    }[];
    response_actions?: {
        action?: string;
        priority?: number;
        automatic?: boolean;
        requires_approval?: boolean;
    }[];
}, {
    name?: string;
    description?: string;
    rule_id?: string;
    threat_category?: "resource_exhaustion" | "privilege_escalation" | "data_exfiltration" | "lateral_movement" | "persistence" | "code_injection" | "configuration_tampering";
    detection_patterns?: {
        confidence?: number;
        pattern?: string;
        severity?: "low" | "medium" | "high" | "critical";
        pattern_type?: "file_access" | "process_behavior" | "network_activity" | "system_call";
    }[];
    response_actions?: {
        action?: string;
        priority?: number;
        automatic?: boolean;
        requires_approval?: boolean;
    }[];
}>;
export type ZeroTrustPolicy = z.infer<typeof ZeroTrustPolicySchema>;
export type ProjectIsolationBoundary = z.infer<typeof ProjectIsolationBoundarySchema>;
export type ThreatDetectionRule = z.infer<typeof ThreatDetectionRuleSchema>;
export declare class ZeroTrustProjectIsolation extends EventEmitter {
    private microsegmentation;
    private policy;
    private boundaries;
    private threatRules;
    private activeMonitoring;
    private logger;
    private frameworkRoot;
    private versatilHome;
    constructor(frameworkRoot: string);
    private initializeZeroTrustPolicy;
    private initializeThreatDetectionRules;
    private setupContinuousMonitoring;
    createProjectIsolation(projectId: string, projectPath: string, projectType?: string): Promise<ProjectIsolationBoundary>;
    private enforcePhysicalBoundaries;
    private enforceLogicalBoundaries;
    private startProjectMonitoring;
    private verifyProjectBoundary;
    private executeVerificationCheck;
    private checkFileSystemIntegrity;
    private checkCrossProjectAccess;
    private checkPrivilegeEscalation;
    private checkConfigurationIntegrity;
    private executeFailureAction;
    private blockProjectAccess;
    private quarantineProject;
    private handleCompromisedBoundary;
    private enhanceProjectMonitoring;
    private verifyAllBoundaryIntegrity;
    private performThreatScan;
    private scanProjectForThreats;
    private evaluateThreatRule;
    private handleThreatDetection;
    private executeThreatResponse;
    private assessSecurityPosture;
    getProjectPath(projectId: string): string;
    validateProjectAccess(projectId: string, operation: string, targetPath: string): Promise<boolean>;
    getProjectBoundary(projectId: string): ProjectIsolationBoundary | undefined;
    getAllProjectBoundaries(): ProjectIsolationBoundary[];
    removeProjectIsolation(projectId: string): Promise<void>;
    generateComplianceReport(): Promise<any>;
}
export default ZeroTrustProjectIsolation;
