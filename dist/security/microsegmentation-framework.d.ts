/**
 * VERSATIL SDLC Framework - Microsegmentation Security Architecture
 * Inspired by cybersecurity microsegmentation for zero-trust project isolation
 */
import { EventEmitter } from 'events';
import { z } from 'zod';
export declare const SecuritySegmentSchema: z.ZodObject<{
    segmentId: z.ZodString;
    segmentType: z.ZodEnum<["framework_core", "project_sandbox", "shared_intelligence", "boundary_controller"]>;
    trustLevel: z.ZodEnum<["untrusted", "limited", "trusted", "privileged"]>;
    accessPolicy: z.ZodObject<{
        read: z.ZodArray<z.ZodString, "many">;
        write: z.ZodArray<z.ZodString, "many">;
        execute: z.ZodArray<z.ZodString, "many">;
        network: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        execute?: string[];
        network?: string[];
        write?: string[];
        read?: string[];
    }, {
        execute?: string[];
        network?: string[];
        write?: string[];
        read?: string[];
    }>;
    isolation_rules: z.ZodArray<z.ZodObject<{
        rule_id: z.ZodString;
        source_pattern: z.ZodString;
        target_pattern: z.ZodString;
        action: z.ZodEnum<["allow", "deny", "audit", "quarantine"]>;
        conditions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        action?: "allow" | "quarantine" | "audit" | "deny";
        rule_id?: string;
        source_pattern?: string;
        target_pattern?: string;
        conditions?: string[];
    }, {
        action?: "allow" | "quarantine" | "audit" | "deny";
        rule_id?: string;
        source_pattern?: string;
        target_pattern?: string;
        conditions?: string[];
    }>, "many">;
    metadata: z.ZodObject<{
        created_at: z.ZodString;
        owner: z.ZodString;
        compliance_level: z.ZodEnum<["basic", "enhanced", "enterprise"]>;
        encryption_required: z.ZodBoolean;
        audit_enabled: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        created_at?: string;
        owner?: string;
        compliance_level?: "basic" | "enhanced" | "enterprise";
        encryption_required?: boolean;
        audit_enabled?: boolean;
    }, {
        created_at?: string;
        owner?: string;
        compliance_level?: "basic" | "enhanced" | "enterprise";
        encryption_required?: boolean;
        audit_enabled?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    metadata?: {
        created_at?: string;
        owner?: string;
        compliance_level?: "basic" | "enhanced" | "enterprise";
        encryption_required?: boolean;
        audit_enabled?: boolean;
    };
    segmentId?: string;
    segmentType?: "framework_core" | "project_sandbox" | "shared_intelligence" | "boundary_controller";
    trustLevel?: "limited" | "untrusted" | "trusted" | "privileged";
    accessPolicy?: {
        execute?: string[];
        network?: string[];
        write?: string[];
        read?: string[];
    };
    isolation_rules?: {
        action?: "allow" | "quarantine" | "audit" | "deny";
        rule_id?: string;
        source_pattern?: string;
        target_pattern?: string;
        conditions?: string[];
    }[];
}, {
    metadata?: {
        created_at?: string;
        owner?: string;
        compliance_level?: "basic" | "enhanced" | "enterprise";
        encryption_required?: boolean;
        audit_enabled?: boolean;
    };
    segmentId?: string;
    segmentType?: "framework_core" | "project_sandbox" | "shared_intelligence" | "boundary_controller";
    trustLevel?: "limited" | "untrusted" | "trusted" | "privileged";
    accessPolicy?: {
        execute?: string[];
        network?: string[];
        write?: string[];
        read?: string[];
    };
    isolation_rules?: {
        action?: "allow" | "quarantine" | "audit" | "deny";
        rule_id?: string;
        source_pattern?: string;
        target_pattern?: string;
        conditions?: string[];
    }[];
}>;
export declare const ProjectSecurityContextSchema: z.ZodObject<{
    projectId: z.ZodString;
    segmentId: z.ZodString;
    securityFingerprint: z.ZodString;
    trustBoundaries: z.ZodArray<z.ZodObject<{
        boundary_id: z.ZodString;
        boundary_type: z.ZodEnum<["file_system", "memory", "network", "process"]>;
        enforcement_level: z.ZodEnum<["advisory", "blocking", "quarantine"]>;
        monitoring_enabled: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enforcement_level?: "blocking" | "quarantine" | "advisory";
        boundary_id?: string;
        boundary_type?: "memory" | "network" | "file_system" | "process";
        monitoring_enabled?: boolean;
    }, {
        enforcement_level?: "blocking" | "quarantine" | "advisory";
        boundary_id?: string;
        boundary_type?: "memory" | "network" | "file_system" | "process";
        monitoring_enabled?: boolean;
    }>, "many">;
    accessCredentials: z.ZodObject<{
        project_token: z.ZodString;
        permissions: z.ZodArray<z.ZodString, "many">;
        expiry: z.ZodString;
        renewable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        permissions?: string[];
        project_token?: string;
        expiry?: string;
        renewable?: boolean;
    }, {
        permissions?: string[];
        project_token?: string;
        expiry?: string;
        renewable?: boolean;
    }>;
    isolationMetrics: z.ZodObject<{
        last_breach_attempt: z.ZodOptional<z.ZodString>;
        security_score: z.ZodNumber;
        compliance_status: z.ZodEnum<["compliant", "warning", "violation", "quarantined"]>;
        audit_trail_size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        last_breach_attempt?: string;
        security_score?: number;
        compliance_status?: "warning" | "quarantined" | "violation" | "compliant";
        audit_trail_size?: number;
    }, {
        last_breach_attempt?: string;
        security_score?: number;
        compliance_status?: "warning" | "quarantined" | "violation" | "compliant";
        audit_trail_size?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    projectId?: string;
    segmentId?: string;
    securityFingerprint?: string;
    trustBoundaries?: {
        enforcement_level?: "blocking" | "quarantine" | "advisory";
        boundary_id?: string;
        boundary_type?: "memory" | "network" | "file_system" | "process";
        monitoring_enabled?: boolean;
    }[];
    accessCredentials?: {
        permissions?: string[];
        project_token?: string;
        expiry?: string;
        renewable?: boolean;
    };
    isolationMetrics?: {
        last_breach_attempt?: string;
        security_score?: number;
        compliance_status?: "warning" | "quarantined" | "violation" | "compliant";
        audit_trail_size?: number;
    };
}, {
    projectId?: string;
    segmentId?: string;
    securityFingerprint?: string;
    trustBoundaries?: {
        enforcement_level?: "blocking" | "quarantine" | "advisory";
        boundary_id?: string;
        boundary_type?: "memory" | "network" | "file_system" | "process";
        monitoring_enabled?: boolean;
    }[];
    accessCredentials?: {
        permissions?: string[];
        project_token?: string;
        expiry?: string;
        renewable?: boolean;
    };
    isolationMetrics?: {
        last_breach_attempt?: string;
        security_score?: number;
        compliance_status?: "warning" | "quarantined" | "violation" | "compliant";
        audit_trail_size?: number;
    };
}>;
export declare const MicrosegmentationPolicySchema: z.ZodObject<{
    policy_id: z.ZodString;
    version: z.ZodString;
    framework_segments: z.ZodArray<z.ZodObject<{
        segmentId: z.ZodString;
        segmentType: z.ZodEnum<["framework_core", "project_sandbox", "shared_intelligence", "boundary_controller"]>;
        trustLevel: z.ZodEnum<["untrusted", "limited", "trusted", "privileged"]>;
        accessPolicy: z.ZodObject<{
            read: z.ZodArray<z.ZodString, "many">;
            write: z.ZodArray<z.ZodString, "many">;
            execute: z.ZodArray<z.ZodString, "many">;
            network: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            execute?: string[];
            network?: string[];
            write?: string[];
            read?: string[];
        }, {
            execute?: string[];
            network?: string[];
            write?: string[];
            read?: string[];
        }>;
        isolation_rules: z.ZodArray<z.ZodObject<{
            rule_id: z.ZodString;
            source_pattern: z.ZodString;
            target_pattern: z.ZodString;
            action: z.ZodEnum<["allow", "deny", "audit", "quarantine"]>;
            conditions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            action?: "allow" | "quarantine" | "audit" | "deny";
            rule_id?: string;
            source_pattern?: string;
            target_pattern?: string;
            conditions?: string[];
        }, {
            action?: "allow" | "quarantine" | "audit" | "deny";
            rule_id?: string;
            source_pattern?: string;
            target_pattern?: string;
            conditions?: string[];
        }>, "many">;
        metadata: z.ZodObject<{
            created_at: z.ZodString;
            owner: z.ZodString;
            compliance_level: z.ZodEnum<["basic", "enhanced", "enterprise"]>;
            encryption_required: z.ZodBoolean;
            audit_enabled: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            created_at?: string;
            owner?: string;
            compliance_level?: "basic" | "enhanced" | "enterprise";
            encryption_required?: boolean;
            audit_enabled?: boolean;
        }, {
            created_at?: string;
            owner?: string;
            compliance_level?: "basic" | "enhanced" | "enterprise";
            encryption_required?: boolean;
            audit_enabled?: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        metadata?: {
            created_at?: string;
            owner?: string;
            compliance_level?: "basic" | "enhanced" | "enterprise";
            encryption_required?: boolean;
            audit_enabled?: boolean;
        };
        segmentId?: string;
        segmentType?: "framework_core" | "project_sandbox" | "shared_intelligence" | "boundary_controller";
        trustLevel?: "limited" | "untrusted" | "trusted" | "privileged";
        accessPolicy?: {
            execute?: string[];
            network?: string[];
            write?: string[];
            read?: string[];
        };
        isolation_rules?: {
            action?: "allow" | "quarantine" | "audit" | "deny";
            rule_id?: string;
            source_pattern?: string;
            target_pattern?: string;
            conditions?: string[];
        }[];
    }, {
        metadata?: {
            created_at?: string;
            owner?: string;
            compliance_level?: "basic" | "enhanced" | "enterprise";
            encryption_required?: boolean;
            audit_enabled?: boolean;
        };
        segmentId?: string;
        segmentType?: "framework_core" | "project_sandbox" | "shared_intelligence" | "boundary_controller";
        trustLevel?: "limited" | "untrusted" | "trusted" | "privileged";
        accessPolicy?: {
            execute?: string[];
            network?: string[];
            write?: string[];
            read?: string[];
        };
        isolation_rules?: {
            action?: "allow" | "quarantine" | "audit" | "deny";
            rule_id?: string;
            source_pattern?: string;
            target_pattern?: string;
            conditions?: string[];
        }[];
    }>, "many">;
    inter_segment_rules: z.ZodArray<z.ZodObject<{
        rule_id: z.ZodString;
        source_segment: z.ZodString;
        target_segment: z.ZodString;
        allowed_operations: z.ZodArray<z.ZodString, "many">;
        security_controls: z.ZodArray<z.ZodString, "many">;
        monitoring_level: z.ZodEnum<["none", "basic", "enhanced", "full"]>;
    }, "strip", z.ZodTypeAny, {
        rule_id?: string;
        source_segment?: string;
        target_segment?: string;
        allowed_operations?: string[];
        security_controls?: string[];
        monitoring_level?: "basic" | "full" | "none" | "enhanced";
    }, {
        rule_id?: string;
        source_segment?: string;
        target_segment?: string;
        allowed_operations?: string[];
        security_controls?: string[];
        monitoring_level?: "basic" | "full" | "none" | "enhanced";
    }>, "many">;
    breach_response: z.ZodObject<{
        detection_threshold: z.ZodNumber;
        quarantine_enabled: z.ZodBoolean;
        alert_channels: z.ZodArray<z.ZodString, "many">;
        recovery_procedures: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        detection_threshold?: number;
        quarantine_enabled?: boolean;
        alert_channels?: string[];
        recovery_procedures?: string[];
    }, {
        detection_threshold?: number;
        quarantine_enabled?: boolean;
        alert_channels?: string[];
        recovery_procedures?: string[];
    }>;
    compliance_framework: z.ZodObject<{
        standards: z.ZodArray<z.ZodString, "many">;
        audit_frequency: z.ZodString;
        certification_required: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        standards?: string[];
        audit_frequency?: string;
        certification_required?: boolean;
    }, {
        standards?: string[];
        audit_frequency?: string;
        certification_required?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    version?: string;
    policy_id?: string;
    framework_segments?: {
        metadata?: {
            created_at?: string;
            owner?: string;
            compliance_level?: "basic" | "enhanced" | "enterprise";
            encryption_required?: boolean;
            audit_enabled?: boolean;
        };
        segmentId?: string;
        segmentType?: "framework_core" | "project_sandbox" | "shared_intelligence" | "boundary_controller";
        trustLevel?: "limited" | "untrusted" | "trusted" | "privileged";
        accessPolicy?: {
            execute?: string[];
            network?: string[];
            write?: string[];
            read?: string[];
        };
        isolation_rules?: {
            action?: "allow" | "quarantine" | "audit" | "deny";
            rule_id?: string;
            source_pattern?: string;
            target_pattern?: string;
            conditions?: string[];
        }[];
    }[];
    inter_segment_rules?: {
        rule_id?: string;
        source_segment?: string;
        target_segment?: string;
        allowed_operations?: string[];
        security_controls?: string[];
        monitoring_level?: "basic" | "full" | "none" | "enhanced";
    }[];
    breach_response?: {
        detection_threshold?: number;
        quarantine_enabled?: boolean;
        alert_channels?: string[];
        recovery_procedures?: string[];
    };
    compliance_framework?: {
        standards?: string[];
        audit_frequency?: string;
        certification_required?: boolean;
    };
}, {
    version?: string;
    policy_id?: string;
    framework_segments?: {
        metadata?: {
            created_at?: string;
            owner?: string;
            compliance_level?: "basic" | "enhanced" | "enterprise";
            encryption_required?: boolean;
            audit_enabled?: boolean;
        };
        segmentId?: string;
        segmentType?: "framework_core" | "project_sandbox" | "shared_intelligence" | "boundary_controller";
        trustLevel?: "limited" | "untrusted" | "trusted" | "privileged";
        accessPolicy?: {
            execute?: string[];
            network?: string[];
            write?: string[];
            read?: string[];
        };
        isolation_rules?: {
            action?: "allow" | "quarantine" | "audit" | "deny";
            rule_id?: string;
            source_pattern?: string;
            target_pattern?: string;
            conditions?: string[];
        }[];
    }[];
    inter_segment_rules?: {
        rule_id?: string;
        source_segment?: string;
        target_segment?: string;
        allowed_operations?: string[];
        security_controls?: string[];
        monitoring_level?: "basic" | "full" | "none" | "enhanced";
    }[];
    breach_response?: {
        detection_threshold?: number;
        quarantine_enabled?: boolean;
        alert_channels?: string[];
        recovery_procedures?: string[];
    };
    compliance_framework?: {
        standards?: string[];
        audit_frequency?: string;
        certification_required?: boolean;
    };
}>;
export type SecuritySegment = z.infer<typeof SecuritySegmentSchema>;
export type ProjectSecurityContext = z.infer<typeof ProjectSecurityContextSchema>;
export type MicrosegmentationPolicy = z.infer<typeof MicrosegmentationPolicySchema>;
export declare class MicrosegmentationFramework extends EventEmitter {
    private policy;
    private segments;
    private projectContexts;
    private auditLog;
    private logger;
    constructor();
    private initializeDefaultPolicy;
    private setupSecurityMonitoring;
    createProjectSecurityContext(projectId: string, projectPath: string): Promise<ProjectSecurityContext>;
    private cloneSegmentForProject;
    validateProjectAccess(projectId: string, operation: string, targetPath: string): Promise<boolean>;
    private matchesPattern;
    private checkAccessPolicy;
    private logSecurityEvent;
    private getEventSeverity;
    private quarantineProject;
    private updateSecurityMetrics;
    private generateSecurityFingerprint;
    private generateProjectToken;
    performSecurityScan(): Promise<any>;
    private rotateAuditLogs;
    getProjectSecurityContext(projectId: string): ProjectSecurityContext | undefined;
    getAllSecuritySegments(): SecuritySegment[];
    getMicrosegmentationPolicy(): MicrosegmentationPolicy;
    getSecurityAuditLog(limit?: number): any[];
    exportSecurityReport(): Promise<any>;
    validateFrameworkCompliance(): Promise<boolean>;
    removeProjectSecurityContext(projectId: string): Promise<void>;
}
export default MicrosegmentationFramework;
