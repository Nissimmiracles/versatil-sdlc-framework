/**
 * VERSATIL SDLC Framework - Boundary Enforcement Engine
 * Real-time filesystem monitoring and access control
 */
import { EventEmitter } from 'events';
import { z } from 'zod';
export declare const BoundaryViolationSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodString;
    violation_type: z.ZodEnum<["unauthorized_access", "path_traversal", "privilege_escalation", "cross_boundary_write", "symlink_attack", "executable_creation"]>;
    source_path: z.ZodString;
    target_path: z.ZodString;
    project_id: z.ZodOptional<z.ZodString>;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    blocked: z.ZodBoolean;
    remediation_action: z.ZodString;
    evidence: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    timestamp?: string;
    id?: string;
    blocked?: boolean;
    severity?: "low" | "medium" | "high" | "critical";
    evidence?: Record<string, any>;
    violation_type?: "unauthorized_access" | "path_traversal" | "privilege_escalation" | "cross_boundary_write" | "symlink_attack" | "executable_creation";
    source_path?: string;
    target_path?: string;
    project_id?: string;
    remediation_action?: string;
}, {
    timestamp?: string;
    id?: string;
    blocked?: boolean;
    severity?: "low" | "medium" | "high" | "critical";
    evidence?: Record<string, any>;
    violation_type?: "unauthorized_access" | "path_traversal" | "privilege_escalation" | "cross_boundary_write" | "symlink_attack" | "executable_creation";
    source_path?: string;
    target_path?: string;
    project_id?: string;
    remediation_action?: string;
}>;
export declare const BoundaryRuleSchema: z.ZodObject<{
    rule_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    source_pattern: z.ZodString;
    target_pattern: z.ZodString;
    action: z.ZodEnum<["allow", "deny", "audit", "quarantine"]>;
    enforcement_level: z.ZodEnum<["advisory", "blocking", "quarantine"]>;
    conditions: z.ZodArray<z.ZodString, "many">;
    enabled: z.ZodBoolean;
    priority: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    action?: "allow" | "quarantine" | "audit" | "deny";
    name?: string;
    priority?: number;
    description?: string;
    enabled?: boolean;
    rule_id?: string;
    source_pattern?: string;
    target_pattern?: string;
    enforcement_level?: "blocking" | "quarantine" | "advisory";
    conditions?: string[];
}, {
    action?: "allow" | "quarantine" | "audit" | "deny";
    name?: string;
    priority?: number;
    description?: string;
    enabled?: boolean;
    rule_id?: string;
    source_pattern?: string;
    target_pattern?: string;
    enforcement_level?: "blocking" | "quarantine" | "advisory";
    conditions?: string[];
}>;
export declare const FileSystemBoundarySchema: z.ZodObject<{
    boundary_id: z.ZodString;
    name: z.ZodString;
    boundary_type: z.ZodEnum<["framework_core", "project_sandbox", "shared_resource", "quarantine"]>;
    root_path: z.ZodString;
    allowed_paths: z.ZodArray<z.ZodString, "many">;
    forbidden_paths: z.ZodArray<z.ZodString, "many">;
    access_rules: z.ZodArray<z.ZodObject<{
        rule_id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        source_pattern: z.ZodString;
        target_pattern: z.ZodString;
        action: z.ZodEnum<["allow", "deny", "audit", "quarantine"]>;
        enforcement_level: z.ZodEnum<["advisory", "blocking", "quarantine"]>;
        conditions: z.ZodArray<z.ZodString, "many">;
        enabled: z.ZodBoolean;
        priority: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        action?: "allow" | "quarantine" | "audit" | "deny";
        name?: string;
        priority?: number;
        description?: string;
        enabled?: boolean;
        rule_id?: string;
        source_pattern?: string;
        target_pattern?: string;
        enforcement_level?: "blocking" | "quarantine" | "advisory";
        conditions?: string[];
    }, {
        action?: "allow" | "quarantine" | "audit" | "deny";
        name?: string;
        priority?: number;
        description?: string;
        enabled?: boolean;
        rule_id?: string;
        source_pattern?: string;
        target_pattern?: string;
        enforcement_level?: "blocking" | "quarantine" | "advisory";
        conditions?: string[];
    }>, "many">;
    monitoring_enabled: z.ZodBoolean;
    integrity_check_interval: z.ZodNumber;
    last_integrity_check: z.ZodString;
    integrity_hash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
    boundary_id?: string;
    boundary_type?: "quarantine" | "framework_core" | "project_sandbox" | "shared_resource";
    root_path?: string;
    allowed_paths?: string[];
    forbidden_paths?: string[];
    access_rules?: {
        action?: "allow" | "quarantine" | "audit" | "deny";
        name?: string;
        priority?: number;
        description?: string;
        enabled?: boolean;
        rule_id?: string;
        source_pattern?: string;
        target_pattern?: string;
        enforcement_level?: "blocking" | "quarantine" | "advisory";
        conditions?: string[];
    }[];
    monitoring_enabled?: boolean;
    integrity_check_interval?: number;
    last_integrity_check?: string;
    integrity_hash?: string;
}, {
    name?: string;
    boundary_id?: string;
    boundary_type?: "quarantine" | "framework_core" | "project_sandbox" | "shared_resource";
    root_path?: string;
    allowed_paths?: string[];
    forbidden_paths?: string[];
    access_rules?: {
        action?: "allow" | "quarantine" | "audit" | "deny";
        name?: string;
        priority?: number;
        description?: string;
        enabled?: boolean;
        rule_id?: string;
        source_pattern?: string;
        target_pattern?: string;
        enforcement_level?: "blocking" | "quarantine" | "advisory";
        conditions?: string[];
    }[];
    monitoring_enabled?: boolean;
    integrity_check_interval?: number;
    last_integrity_check?: string;
    integrity_hash?: string;
}>;
export type BoundaryViolation = z.infer<typeof BoundaryViolationSchema>;
export type BoundaryRule = z.infer<typeof BoundaryRuleSchema>;
export type FileSystemBoundary = z.infer<typeof FileSystemBoundarySchema>;
export declare class BoundaryEnforcementEngine extends EventEmitter {
    private boundaries;
    private violations;
    private watchers;
    private logger;
    private frameworkRoot;
    private versatilHome;
    constructor(frameworkRoot: string);
    private initializeBoundaries;
    private startBoundaryMonitoring;
    private startDirectoryWatcher;
    private handleFileSystemEvent;
    private matchesRule;
    private matchesPattern;
    private evaluateCondition;
    private isExecutableFile;
    private isPathTraversal;
    private isSymlinkAttempt;
    private createViolation;
    private mapRuleToViolationType;
    private extractProjectId;
    private determineSeverity;
    private getFileStats;
    private enforceViolation;
    private blockAccess;
    private quarantineResource;
    private logViolation;
    private performIntegrityCheck;
    private calculateDirectoryHash;
    private generateViolationId;
    validateFileAccess(filePath: string, operation: 'read' | 'write' | 'execute', projectId?: string): Promise<{
        allowed: boolean;
        reason?: string;
        violation?: BoundaryViolation;
    }>;
    getBoundaryViolations(boundaryId?: string, severity?: BoundaryViolation['severity'], limit?: number): BoundaryViolation[];
    getBoundaryStatus(): any;
    exportSecurityReport(): Promise<any>;
    stopMonitoring(): void;
}
export default BoundaryEnforcementEngine;
