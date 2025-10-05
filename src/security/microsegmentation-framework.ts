/**
 * VERSATIL SDLC Framework - Microsegmentation Security Architecture
 * Inspired by cybersecurity microsegmentation for zero-trust project isolation
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { VERSATILLogger } from '../utils/logger.js';

export const SecuritySegmentSchema = z.object({
  segmentId: z.string(),
  segmentType: z.enum(['framework_core', 'project_sandbox', 'shared_intelligence', 'boundary_controller']),
  trustLevel: z.enum(['untrusted', 'limited', 'trusted', 'privileged']),
  accessPolicy: z.object({
    read: z.array(z.string()),
    write: z.array(z.string()),
    execute: z.array(z.string()),
    network: z.array(z.string())
  }),
  isolation_rules: z.array(z.object({
    rule_id: z.string(),
    source_pattern: z.string(),
    target_pattern: z.string(),
    action: z.enum(['allow', 'deny', 'audit', 'quarantine']),
    conditions: z.array(z.string())
  })),
  metadata: z.object({
    created_at: z.string(),
    owner: z.string(),
    compliance_level: z.enum(['basic', 'enhanced', 'enterprise']),
    encryption_required: z.boolean(),
    audit_enabled: z.boolean()
  })
});

export const ProjectSecurityContextSchema = z.object({
  projectId: z.string(),
  segmentId: z.string(),
  securityFingerprint: z.string(),
  trustBoundaries: z.array(z.object({
    boundary_id: z.string(),
    boundary_type: z.enum(['file_system', 'memory', 'network', 'process']),
    enforcement_level: z.enum(['advisory', 'blocking', 'quarantine']),
    monitoring_enabled: z.boolean()
  })),
  accessCredentials: z.object({
    project_token: z.string(),
    permissions: z.array(z.string()),
    expiry: z.string(),
    renewable: z.boolean()
  }),
  isolationMetrics: z.object({
    last_breach_attempt: z.string().optional(),
    security_score: z.number().min(0).max(100),
    compliance_status: z.enum(['compliant', 'warning', 'violation', 'quarantined']),
    audit_trail_size: z.number()
  })
});

export const MicrosegmentationPolicySchema = z.object({
  policy_id: z.string(),
  version: z.string(),
  framework_segments: z.array(SecuritySegmentSchema),
  inter_segment_rules: z.array(z.object({
    rule_id: z.string(),
    source_segment: z.string(),
    target_segment: z.string(),
    allowed_operations: z.array(z.string()),
    security_controls: z.array(z.string()),
    monitoring_level: z.enum(['none', 'basic', 'enhanced', 'full'])
  })),
  breach_response: z.object({
    detection_threshold: z.number(),
    quarantine_enabled: z.boolean(),
    alert_channels: z.array(z.string()),
    recovery_procedures: z.array(z.string())
  }),
  compliance_framework: z.object({
    standards: z.array(z.string()),
    audit_frequency: z.string(),
    certification_required: z.boolean()
  })
});

export type SecuritySegment = z.infer<typeof SecuritySegmentSchema>;
export type ProjectSecurityContext = z.infer<typeof ProjectSecurityContextSchema>;
export type MicrosegmentationPolicy = z.infer<typeof MicrosegmentationPolicySchema>;

export class MicrosegmentationFramework extends EventEmitter {
  private policy: MicrosegmentationPolicy;
  private segments: Map<string, SecuritySegment> = new Map();
  private projectContexts: Map<string, ProjectSecurityContext> = new Map();
  private auditLog: any[] = [];
  private logger: VERSATILLogger;

  constructor() {
    super();
    this.logger = new VERSATILLogger('MicrosegmentationFramework');
    this.initializeDefaultPolicy();
    this.setupSecurityMonitoring();
  }

  private initializeDefaultPolicy(): void {
    // Framework Core Segment - Highest Security
    const frameworkCore: SecuritySegment = {
      segmentId: 'framework_core',
      segmentType: 'framework_core',
      trustLevel: 'privileged',
      accessPolicy: {
        read: ['system', 'framework_admin'],
        write: ['framework_admin'],
        execute: ['system', 'framework_admin'],
        network: ['localhost', 'framework_services']
      },
      isolation_rules: [
        {
          rule_id: 'core_no_project_write',
          source_pattern: 'project_*',
          target_pattern: 'framework_core/**',
          action: 'deny',
          conditions: ['always']
        },
        {
          rule_id: 'core_audit_all_access',
          source_pattern: '*',
          target_pattern: 'framework_core/**',
          action: 'audit',
          conditions: ['always']
        }
      ],
      metadata: {
        created_at: new Date().toISOString(),
        owner: 'framework_system',
        compliance_level: 'enterprise',
        encryption_required: true,
        audit_enabled: true
      }
    };

    // Project Sandbox Segment - Isolated by Default
    const projectSandbox: SecuritySegment = {
      segmentId: 'project_sandbox_template',
      segmentType: 'project_sandbox',
      trustLevel: 'untrusted',
      accessPolicy: {
        read: ['project_owner'],
        write: ['project_owner'],
        execute: ['project_owner'],
        network: ['project_allowed_hosts']
      },
      isolation_rules: [
        {
          rule_id: 'sandbox_no_cross_project',
          source_pattern: 'project_{projectId}/**',
          target_pattern: 'project_{otherProjectId}/**',
          action: 'deny',
          conditions: ['projectId != otherProjectId']
        },
        {
          rule_id: 'sandbox_no_framework_write',
          source_pattern: 'project_*/**',
          target_pattern: 'framework_core/**',
          action: 'deny',
          conditions: ['always']
        },
        {
          rule_id: 'sandbox_limited_shared_read',
          source_pattern: 'project_*/**',
          target_pattern: 'shared_intelligence/**',
          action: 'allow',
          conditions: ['read_only', 'authenticated']
        }
      ],
      metadata: {
        created_at: new Date().toISOString(),
        owner: 'framework_system',
        compliance_level: 'enhanced',
        encryption_required: false,
        audit_enabled: true
      }
    };

    // Shared Intelligence Segment - Read-Only by Projects
    const sharedIntelligence: SecuritySegment = {
      segmentId: 'shared_intelligence',
      segmentType: 'shared_intelligence',
      trustLevel: 'trusted',
      accessPolicy: {
        read: ['framework_core', 'project_*'],
        write: ['framework_core', 'intelligence_agents'],
        execute: ['framework_core'],
        network: ['framework_services']
      },
      isolation_rules: [
        {
          rule_id: 'intelligence_read_only_projects',
          source_pattern: 'project_*',
          target_pattern: 'shared_intelligence/**',
          action: 'allow',
          conditions: ['read_only']
        },
        {
          rule_id: 'intelligence_no_project_write',
          source_pattern: 'project_*',
          target_pattern: 'shared_intelligence/**',
          action: 'deny',
          conditions: ['write_operation']
        }
      ],
      metadata: {
        created_at: new Date().toISOString(),
        owner: 'framework_system',
        compliance_level: 'enhanced',
        encryption_required: false,
        audit_enabled: true
      }
    };

    // Boundary Controller Segment - Security Enforcement
    const boundaryController: SecuritySegment = {
      segmentId: 'boundary_controller',
      segmentType: 'boundary_controller',
      trustLevel: 'privileged',
      accessPolicy: {
        read: ['framework_core', 'security_monitor'],
        write: ['framework_core', 'security_monitor'],
        execute: ['framework_core'],
        network: ['all']
      },
      isolation_rules: [
        {
          rule_id: 'controller_monitor_all',
          source_pattern: '*',
          target_pattern: '*',
          action: 'audit',
          conditions: ['security_event']
        },
        {
          rule_id: 'controller_quarantine_violations',
          source_pattern: '*',
          target_pattern: '*',
          action: 'quarantine',
          conditions: ['isolation_violation']
        }
      ],
      metadata: {
        created_at: new Date().toISOString(),
        owner: 'framework_system',
        compliance_level: 'enterprise',
        encryption_required: true,
        audit_enabled: true
      }
    };

    this.segments.set('framework_core', frameworkCore);
    this.segments.set('project_sandbox_template', projectSandbox);
    this.segments.set('shared_intelligence', sharedIntelligence);
    this.segments.set('boundary_controller', boundaryController);

    // Initialize complete microsegmentation policy
    this.policy = {
      policy_id: 'versatil_microsegmentation_v1',
      version: '1.0.0',
      framework_segments: Array.from(this.segments.values()),
      inter_segment_rules: [
        {
          rule_id: 'core_to_intelligence_write',
          source_segment: 'framework_core',
          target_segment: 'shared_intelligence',
          allowed_operations: ['read', 'write', 'execute'],
          security_controls: ['authentication', 'authorization', 'audit'],
          monitoring_level: 'enhanced'
        },
        {
          rule_id: 'project_to_intelligence_read',
          source_segment: 'project_sandbox_template',
          target_segment: 'shared_intelligence',
          allowed_operations: ['read'],
          security_controls: ['authentication', 'rate_limiting', 'audit'],
          monitoring_level: 'full'
        },
        {
          rule_id: 'controller_to_all_monitor',
          source_segment: 'boundary_controller',
          target_segment: '*',
          allowed_operations: ['monitor', 'audit', 'quarantine'],
          security_controls: ['privileged_access', 'encryption'],
          monitoring_level: 'full'
        }
      ],
      breach_response: {
        detection_threshold: 3,
        quarantine_enabled: true,
        alert_channels: ['security_log', 'admin_notification'],
        recovery_procedures: [
          'isolate_affected_segment',
          'audit_breach_scope',
          'restore_from_clean_state',
          'update_security_rules'
        ]
      },
      compliance_framework: {
        standards: ['ISO27001', 'SOC2', 'NIST_Cybersecurity_Framework'],
        audit_frequency: 'daily',
        certification_required: false
      }
    };

    this.emit('policyInitialized', { policy: this.policy });
  }

  private setupSecurityMonitoring(): void {
    // Real-time security monitoring
    setInterval(() => {
      this.performSecurityScan();
    }, 30000); // Every 30 seconds

    // Audit log rotation
    setInterval(() => {
      this.rotateAuditLogs();
    }, 3600000); // Every hour
  }

  public async createProjectSecurityContext(projectId: string, projectPath: string): Promise<ProjectSecurityContext> {
    const segmentId = `project_sandbox_${projectId}`;
    const securityFingerprint = this.generateSecurityFingerprint(projectId, projectPath);

    // Create project-specific segment based on template
    const projectSegment = this.cloneSegmentForProject('project_sandbox_template', segmentId, projectId);
    this.segments.set(segmentId, projectSegment);

    const context: ProjectSecurityContext = {
      projectId,
      segmentId,
      securityFingerprint,
      trustBoundaries: [
        {
          boundary_id: `${projectId}_filesystem`,
          boundary_type: 'file_system',
          enforcement_level: 'blocking',
          monitoring_enabled: true
        },
        {
          boundary_id: `${projectId}_memory`,
          boundary_type: 'memory',
          enforcement_level: 'advisory',
          monitoring_enabled: true
        },
        {
          boundary_id: `${projectId}_process`,
          boundary_type: 'process',
          enforcement_level: 'blocking',
          monitoring_enabled: true
        }
      ],
      accessCredentials: {
        project_token: this.generateProjectToken(projectId),
        permissions: [
          'read:shared_intelligence',
          'write:project_sandbox',
          'execute:project_sandbox'
        ],
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        renewable: true
      },
      isolationMetrics: {
        security_score: 100,
        compliance_status: 'compliant',
        audit_trail_size: 0
      }
    };

    this.projectContexts.set(projectId, context);
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      event: 'project_context_created',
      projectId,
      segmentId,
      securityLevel: 'INFO'
    });

    this.emit('projectContextCreated', { projectId, context });
    return context;
  }

  private cloneSegmentForProject(templateId: string, newSegmentId: string, projectId: string): SecuritySegment {
    const template = this.segments.get(templateId);
    if (!template) throw new Error(`Template segment ${templateId} not found`);

    const projectSegment: SecuritySegment = {
      ...template,
      segmentId: newSegmentId,
      isolation_rules: template.isolation_rules.map(rule => ({
        ...rule,
        rule_id: `${projectId}_${rule.rule_id}`,
        source_pattern: rule.source_pattern.replace('{projectId}', projectId),
        target_pattern: rule.target_pattern.replace('{projectId}', projectId)
      })),
      metadata: {
        ...template.metadata,
        created_at: new Date().toISOString(),
        owner: `project_${projectId}`
      }
    };

    return projectSegment;
  }

  public async validateProjectAccess(projectId: string, operation: string, targetPath: string): Promise<boolean> {
    const context = this.projectContexts.get(projectId);
    if (!context) {
      this.logSecurityEvent('access_denied', 'unknown_project', { projectId, operation, targetPath });
      return false;
    }

    const segment = this.segments.get(context.segmentId);
    if (!segment) {
      this.logSecurityEvent('access_denied', 'invalid_segment', { projectId, segmentId: context.segmentId });
      return false;
    }

    // Check isolation rules
    for (const rule of segment.isolation_rules) {
      if (this.matchesPattern(targetPath, rule.target_pattern)) {
        if (rule.action === 'deny') {
          this.logSecurityEvent('access_denied', 'isolation_rule_violation', {
            projectId,
            operation,
            targetPath,
            ruleId: rule.rule_id
          });
          return false;
        }

        if (rule.action === 'quarantine') {
          await this.quarantineProject(projectId, `Rule violation: ${rule.rule_id}`);
          return false;
        }

        if (rule.action === 'audit') {
          this.logSecurityEvent('access_audited', 'monitoring', {
            projectId,
            operation,
            targetPath,
            ruleId: rule.rule_id
          });
        }
      }
    }

    // Check access policy
    const hasPermission = this.checkAccessPolicy(segment, operation, context.accessCredentials.permissions);
    if (!hasPermission) {
      this.logSecurityEvent('access_denied', 'insufficient_permissions', {
        projectId,
        operation,
        targetPath,
        permissions: context.accessCredentials.permissions
      });
      return false;
    }

    // Update security metrics
    this.updateSecurityMetrics(projectId, 'access_granted');

    return true;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    // Convert glob-like pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\{(\w+)\}/g, '([^/]+)');

    return new RegExp(`^${regexPattern}$`).test(path);
  }

  private checkAccessPolicy(segment: SecuritySegment, operation: string, permissions: string[]): boolean {
    const operationMap = {
      'read': segment.accessPolicy.read,
      'write': segment.accessPolicy.write,
      'execute': segment.accessPolicy.execute
    };

    const allowedRoles = operationMap[operation as keyof typeof operationMap] || [];
    return permissions.some(permission => allowedRoles.includes(permission.split(':')[0]));
  }

  private logSecurityEvent(event: string, category: string, details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      category,
      details,
      severity: this.getEventSeverity(event, category)
    };

    this.auditLog.push(logEntry);
    this.emit('securityEvent', logEntry);

    if (logEntry.severity === 'HIGH' || logEntry.severity === 'CRITICAL') {
      this.logger.warn(`Security event: ${event} - ${category}`, details);
    }
  }

  private getEventSeverity(event: string, category: string): string {
    const severityMap = {
      'access_denied': 'MEDIUM',
      'isolation_rule_violation': 'HIGH',
      'unknown_project': 'HIGH',
      'invalid_segment': 'CRITICAL',
      'quarantine_triggered': 'CRITICAL',
      'access_granted': 'LOW',
      'monitoring': 'LOW'
    };

    return severityMap[category] || 'MEDIUM';
  }

  private async quarantineProject(projectId: string, reason: string): Promise<void> {
    const context = this.projectContexts.get(projectId);
    if (!context) return;

    // Update compliance status
    context.isolationMetrics.compliance_status = 'quarantined';
    context.isolationMetrics.security_score = 0;

    // Log quarantine event
    this.logSecurityEvent('project_quarantined', 'quarantine_triggered', {
      projectId,
      reason,
      timestamp: new Date().toISOString()
    });

    // Emit quarantine event for external handling
    this.emit('projectQuarantined', { projectId, reason, context });

    this.logger.error(`Project ${projectId} quarantined: ${reason}`);
  }

  private updateSecurityMetrics(projectId: string, event: string): void {
    const context = this.projectContexts.get(projectId);
    if (!context) return;

    // Update audit trail size
    context.isolationMetrics.audit_trail_size++;

    // Adjust security score based on events
    if (event === 'access_granted') {
      // Maintain or slightly improve score for normal operations
      context.isolationMetrics.security_score = Math.min(100, context.isolationMetrics.security_score + 0.1);
    }

    // Update compliance status based on score
    if (context.isolationMetrics.security_score >= 90) {
      context.isolationMetrics.compliance_status = 'compliant';
    } else if (context.isolationMetrics.security_score >= 70) {
      context.isolationMetrics.compliance_status = 'warning';
    } else {
      context.isolationMetrics.compliance_status = 'violation';
    }
  }

  private generateSecurityFingerprint(projectId: string, projectPath: string): string {
    const data = `${projectId}:${projectPath}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateProjectToken(projectId: string): string {
    const tokenData = {
      projectId,
      timestamp: Date.now(),
      random: crypto.randomBytes(16).toString('hex')
    };

    const token = crypto.createHash('sha256').update(JSON.stringify(tokenData)).digest('hex');
    return `versatil_${projectId}_${token.substring(0, 32)}`;
  }

  public async performSecurityScan(): Promise<any> {
    const scanResults = {
      timestamp: new Date().toISOString(),
      segments_scanned: this.segments.size,
      projects_scanned: this.projectContexts.size,
      violations_detected: 0,
      quarantined_projects: 0,
      overall_security_score: 0,
      recommendations: []
    };

    let totalSecurityScore = 0;
    let projectCount = 0;

    // Scan all project contexts
    for (const [projectId, context] of this.projectContexts) {
      projectCount++;
      totalSecurityScore += context.isolationMetrics.security_score;

      // Check for violations
      if (context.isolationMetrics.compliance_status === 'violation') {
        scanResults.violations_detected++;
      }

      if (context.isolationMetrics.compliance_status === 'quarantined') {
        scanResults.quarantined_projects++;
      }

      // Check token expiry
      const tokenExpiry = new Date(context.accessCredentials.expiry);
      if (tokenExpiry < new Date()) {
        if (context.accessCredentials.renewable) {
          // Auto-renew token
          context.accessCredentials.project_token = this.generateProjectToken(projectId);
          context.accessCredentials.expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

          this.logSecurityEvent('token_renewed', 'maintenance', { projectId });
        } else {
          scanResults.violations_detected++;
          this.logSecurityEvent('token_expired', 'security_violation', { projectId });
        }
      }
    }

    scanResults.overall_security_score = projectCount > 0 ? totalSecurityScore / projectCount : 100;

    // Generate recommendations
    if (scanResults.violations_detected > 0) {
      scanResults.recommendations.push('Review and remediate projects with compliance violations');
    }

    if (scanResults.quarantined_projects > 0) {
      scanResults.recommendations.push('Investigate quarantined projects and implement recovery procedures');
    }

    if (scanResults.overall_security_score < 90) {
      scanResults.recommendations.push('Enhance security policies and monitoring for improved compliance');
    }

    this.emit('securityScanCompleted', scanResults);
    return scanResults;
  }

  private rotateAuditLogs(): void {
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      const rotatedLogs = this.auditLog.splice(0, this.auditLog.length - 1000);

      // Save rotated logs to file (in production environment)
      this.emit('auditLogsRotated', { rotatedCount: rotatedLogs.length });
    }
  }

  // Public API Methods

  public getProjectSecurityContext(projectId: string): ProjectSecurityContext | undefined {
    return this.projectContexts.get(projectId);
  }

  public getAllSecuritySegments(): SecuritySegment[] {
    return Array.from(this.segments.values());
  }

  public getMicrosegmentationPolicy(): MicrosegmentationPolicy {
    return this.policy;
  }

  public getSecurityAuditLog(limit: number = 100): any[] {
    return this.auditLog.slice(-limit);
  }

  public async exportSecurityReport(): Promise<any> {
    const scanResults = await this.performSecurityScan();

    return {
      report_metadata: {
        generated_at: new Date().toISOString(),
        framework_version: '1.2.1',
        security_framework: 'microsegmentation_v1'
      },
      policy_summary: {
        policy_id: this.policy.policy_id,
        version: this.policy.version,
        segments_configured: this.segments.size,
        compliance_standards: this.policy.compliance_framework.standards
      },
      current_state: scanResults,
      active_projects: Array.from(this.projectContexts.entries()).map(([id, context]) => ({
        project_id: id,
        segment_id: context.segmentId,
        security_score: context.isolationMetrics.security_score,
        compliance_status: context.isolationMetrics.compliance_status
      })),
      recent_security_events: this.getSecurityAuditLog(50),
      recommendations: scanResults.recommendations
    };
  }

  public async validateFrameworkCompliance(): Promise<boolean> {
    const scanResults = await this.performSecurityScan();

    return scanResults.violations_detected === 0 &&
           scanResults.quarantined_projects === 0 &&
           scanResults.overall_security_score >= 90;
  }

  public async removeProjectSecurityContext(projectId: string): Promise<void> {
    const context = this.projectContexts.get(projectId);
    if (!context) return;

    // Remove project segment
    this.segments.delete(context.segmentId);

    // Remove project context
    this.projectContexts.delete(projectId);

    // Log removal
    this.logSecurityEvent('project_context_removed', 'cleanup', { projectId });

    this.emit('projectContextRemoved', { projectId });
  }
}

export default MicrosegmentationFramework;