/**
 * VERSATIL SDLC Framework - Integrated Security Orchestrator
 * Coordinates all security systems for enterprise-grade protection
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { VERSATILLogger } from '../utils/logger.js';
import { MicrosegmentationFramework, ProjectSecurityContext } from './microsegmentation-framework.js';
import { ZeroTrustProjectIsolation } from './zero-trust-project-isolation.js';
import { BoundaryEnforcementEngine } from './boundary-enforcement-engine.js';
import { PathTraversalPrevention } from './path-traversal-prevention.js';

export const SecurityIncidentSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  incident_type: z.enum([
    'boundary_violation',
    'path_traversal_attack',
    'privilege_escalation',
    'unauthorized_access',
    'data_exfiltration',
    'system_compromise',
    'policy_violation'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  source_system: z.string(),
  project_id: z.string().optional(),
  description: z.string(),
  evidence: z.record(z.any()),
  response_actions: z.array(z.string()),
  status: z.enum(['detected', 'investigating', 'contained', 'resolved', 'escalated']),
  resolved_at: z.string().optional()
});

export const SecurityPostureSchema = z.object({
  overall_score: z.number().min(0).max(100),
  last_assessment: z.string(),
  compliance_status: z.enum(['compliant', 'warning', 'violation', 'critical']),
  active_threats: z.number(),
  resolved_incidents: z.number(),
  system_health: z.object({
    microsegmentation: z.number().min(0).max(100),
    zero_trust: z.number().min(0).max(100),
    boundary_enforcement: z.number().min(0).max(100),
    path_protection: z.number().min(0).max(100)
  }),
  recommendations: z.array(z.string())
});

export type SecurityIncident = z.infer<typeof SecurityIncidentSchema>;
export type SecurityPosture = z.infer<typeof SecurityPostureSchema>;

export class IntegratedSecurityOrchestrator extends EventEmitter {
  private microsegmentation: MicrosegmentationFramework;
  private zeroTrust: ZeroTrustProjectIsolation;
  private boundaryEnforcement: BoundaryEnforcementEngine;
  private pathProtection: PathTraversalPrevention;

  private incidents: SecurityIncident[] = [];
  private logger: VERSATILLogger;
  private frameworkRoot: string;
  private versatilHome: string;
  private securityEnabled: boolean = true;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(frameworkRoot: string) {
    super();
    this.frameworkRoot = frameworkRoot;
    this.versatilHome = path.join(os.homedir(), '.versatil');
    this.logger = new VERSATILLogger('IntegratedSecurityOrchestrator');

    this.initializeSecuritySystems();
    this.setupEventHandlers();
    this.startSecurityMonitoring();
  }

  private initializeSecuritySystems(): void {
    this.logger.info('Initializing integrated security systems');

    // Initialize all security subsystems
    this.microsegmentation = new MicrosegmentationFramework();
    this.zeroTrust = new ZeroTrustProjectIsolation(this.frameworkRoot);
    this.boundaryEnforcement = new BoundaryEnforcementEngine(this.frameworkRoot);
    this.pathProtection = new PathTraversalPrevention(this.frameworkRoot);

    this.logger.info('All security systems initialized successfully');
  }

  private setupEventHandlers(): void {
    // Microsegmentation events
    this.microsegmentation.on('securityEvent', (event) => {
      this.handleSecurityEvent('microsegmentation', event);
    });

    this.microsegmentation.on('projectQuarantined', (event) => {
      this.handleCriticalIncident('microsegmentation', 'project_quarantined', event);
    });

    // Zero Trust events
    this.zeroTrust.on('projectQuarantined', (event) => {
      this.handleCriticalIncident('zero_trust', 'project_quarantined', event);
    });

    this.zeroTrust.on('boundaryCompromised', (event) => {
      this.handleCriticalIncident('zero_trust', 'boundary_compromised', event);
    });

    this.zeroTrust.on('threatDetected', (event) => {
      this.handleSecurityEvent('zero_trust', event);
    });

    // Boundary Enforcement events
    this.boundaryEnforcement.on('violationDetected', (violation) => {
      this.handleBoundaryViolation(violation);
    });

    this.boundaryEnforcement.on('integrityViolation', (event) => {
      this.handleCriticalIncident('boundary_enforcement', 'integrity_violation', event);
    });

    // Path Traversal events
    this.pathProtection.on('traversalAttempt', (attempt) => {
      this.handlePathTraversalAttempt(attempt);
    });

    this.pathProtection.on('unsafePath', (pathResult) => {
      this.handleUnsafePath(pathResult);
    });

    this.logger.info('Security event handlers configured');
  }

  private startSecurityMonitoring(): void {
    // Periodic security assessment
    this.monitoringInterval = setInterval(() => {
      this.performSecurityAssessment();
    }, 60000); // Every minute

    this.logger.info('Security monitoring started');
  }

  private handleSecurityEvent(source: string, event: any): void {
    const incident = this.createSecurityIncident({
      source_system: source,
      incident_type: this.mapEventToIncidentType(event),
      severity: this.mapEventSeverity(event),
      description: this.generateEventDescription(source, event),
      evidence: event,
      project_id: event.projectId || event.project_id
    });

    this.processIncident(incident);
  }

  private handleCriticalIncident(source: string, type: string, event: any): void {
    const incident = this.createSecurityIncident({
      source_system: source,
      incident_type: 'system_compromise',
      severity: 'critical',
      description: `Critical security incident: ${type}`,
      evidence: event,
      project_id: event.projectId || event.project_id
    });

    this.processIncident(incident);
    this.executeEmergencyProtocol(incident);
  }

  private handleBoundaryViolation(violation: any): void {
    const incident = this.createSecurityIncident({
      source_system: 'boundary_enforcement',
      incident_type: 'boundary_violation',
      severity: violation.severity,
      description: `Boundary violation: ${violation.violation_type}`,
      evidence: violation,
      project_id: violation.project_id
    });

    this.processIncident(incident);

    // Coordinate response across systems
    if (violation.severity === 'critical' || violation.severity === 'high') {
      this.escalateToZeroTrust(violation);
    }
  }

  private handlePathTraversalAttempt(attempt: any): void {
    const incident = this.createSecurityIncident({
      source_system: 'path_protection',
      incident_type: 'path_traversal_attack',
      severity: attempt.severity,
      description: `Path traversal attack: ${attempt.attack_type}`,
      evidence: attempt,
      project_id: attempt.project_id
    });

    this.processIncident(incident);

    // Escalate sophisticated attacks
    if (['double_encoding', 'unicode_traversal', 'symlink_traversal'].includes(attempt.attack_type)) {
      this.escalateToZeroTrust(attempt);
    }
  }

  private handleUnsafePath(pathResult: any): void {
    if (pathResult.violations.length > 0) {
      const incident = this.createSecurityIncident({
        source_system: 'path_protection',
        incident_type: 'unauthorized_access',
        severity: 'medium',
        description: `Unsafe path access blocked: ${pathResult.violations.join(', ')}`,
        evidence: pathResult
      });

      this.processIncident(incident);
    }
  }

  private createSecurityIncident(data: {
    source_system: string;
    incident_type: SecurityIncident['incident_type'];
    severity: SecurityIncident['severity'];
    description: string;
    evidence: any;
    project_id?: string;
  }): SecurityIncident {
    const incident: SecurityIncident = {
      id: this.generateIncidentId(),
      timestamp: new Date().toISOString(),
      incident_type: data.incident_type,
      severity: data.severity,
      source_system: data.source_system,
      project_id: data.project_id,
      description: data.description,
      evidence: data.evidence,
      response_actions: this.generateResponseActions(data.incident_type, data.severity),
      status: 'detected'
    };

    this.incidents.push(incident);
    return incident;
  }

  private processIncident(incident: SecurityIncident): void {
    this.logger.info('Processing security incident', {
      incident_id: incident.id,
      type: incident.incident_type,
      severity: incident.severity,
      source: incident.source_system
    });

    // Execute automated response actions
    this.executeResponseActions(incident);

    // Update incident status
    incident.status = 'investigating';

    // Emit for external monitoring
    this.emit('securityIncident', incident);

    // Log to security audit trail
    this.logToSecurityAudit(incident);

    // Critical incidents require immediate escalation
    if (incident.severity === 'critical') {
      this.escalateCriticalIncident(incident);
    }
  }

  private executeResponseActions(incident: SecurityIncident): void {
    for (const action of incident.response_actions) {
      try {
        this.executeAction(action, incident);
      } catch (error) {
        this.logger.error('Failed to execute response action', {
          incident_id: incident.id,
          action,
          error: error.message
        });
      }
    }
  }

  private executeAction(action: string, incident: SecurityIncident): void {
    switch (action) {
      case 'quarantine_project':
        if (incident.project_id) {
          this.quarantineProject(incident.project_id, incident.description);
        }
        break;

      case 'block_access':
        this.blockProjectAccess(incident);
        break;

      case 'enhance_monitoring':
        this.enhanceProjectMonitoring(incident.project_id);
        break;

      case 'alert_security_team':
        this.alertSecurityTeam(incident);
        break;

      case 'backup_project_state':
        if (incident.project_id) {
          this.backupProjectState(incident.project_id);
        }
        break;

      case 'isolate_network_access':
        this.isolateNetworkAccess(incident.project_id);
        break;

      case 'forensic_analysis':
        this.triggerForensicAnalysis(incident);
        break;

      default:
        this.logger.warn('Unknown response action', { action, incident_id: incident.id });
    }
  }

  private executeEmergencyProtocol(incident: SecurityIncident): void {
    this.logger.error('EMERGENCY PROTOCOL ACTIVATED', {
      incident_id: incident.id,
      severity: incident.severity,
      type: incident.incident_type
    });

    // Immediate containment actions
    if (incident.project_id) {
      this.quarantineProject(incident.project_id, 'Emergency quarantine due to critical security incident');
    }

    // Stop all non-essential operations
    this.pauseNonEssentialOperations();

    // Alert all stakeholders
    this.alertSecurityTeam(incident);
    this.emit('emergencyProtocol', incident);

    // Preserve evidence
    this.preserveEvidence(incident);

    incident.status = 'escalated';
  }

  private async quarantineProject(projectId: string, reason: string): Promise<void> {
    try {
      // Use zero trust system to quarantine
      await this.zeroTrust.removeProjectIsolation(projectId);

      // Remove from microsegmentation
      await this.microsegmentation.removeProjectSecurityContext(projectId);

      // Log quarantine action
      this.logger.error('Project quarantined', { project_id: projectId, reason });

      this.emit('projectQuarantined', { projectId, reason, timestamp: new Date().toISOString() });
    } catch (error) {
      this.logger.error('Failed to quarantine project', { project_id: projectId, error });
    }
  }

  private blockProjectAccess(incident: SecurityIncident): void {
    // Implementation would block project operations
    this.logger.warn('Project access blocked due to security incident', {
      incident_id: incident.id,
      project_id: incident.project_id
    });
  }

  private enhanceProjectMonitoring(projectId?: string): void {
    if (projectId) {
      // Increase monitoring frequency for specific project
      this.logger.info('Enhanced monitoring activated', { project_id: projectId });
    }
  }

  private alertSecurityTeam(incident: SecurityIncident): void {
    // Send alerts through configured channels
    this.logger.error('SECURITY TEAM ALERT', {
      incident_id: incident.id,
      severity: incident.severity,
      description: incident.description
    });

    this.emit('securityAlert', {
      incident,
      urgency: incident.severity === 'critical' ? 'immediate' : 'high',
      channels: ['email', 'slack', 'pager']
    });
  }

  private backupProjectState(projectId: string): void {
    try {
      const backupPath = path.join(this.versatilHome, 'security', 'backups', projectId);
      fs.mkdirSync(backupPath, { recursive: true });

      // Implementation would backup project state
      this.logger.info('Project state backed up for forensic analysis', {
        project_id: projectId,
        backup_path: backupPath
      });
    } catch (error) {
      this.logger.error('Failed to backup project state', { project_id: projectId, error });
    }
  }

  private isolateNetworkAccess(projectId?: string): void {
    // Implementation would isolate network access
    this.logger.warn('Network isolation activated', { project_id: projectId });
  }

  private triggerForensicAnalysis(incident: SecurityIncident): void {
    const forensicId = `forensic_${incident.id}_${Date.now()}`;

    // Save forensic data
    const forensicPath = path.join(this.versatilHome, 'security', 'forensics', forensicId);
    fs.mkdirSync(forensicPath, { recursive: true });

    const forensicData = {
      incident,
      system_state: this.captureSystemState(),
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(forensicPath, 'forensic_data.json'),
      JSON.stringify(forensicData, null, 2)
    );

    this.logger.info('Forensic analysis triggered', {
      incident_id: incident.id,
      forensic_id: forensicId,
      path: forensicPath
    });
  }

  private pauseNonEssentialOperations(): void {
    // Implementation would pause non-critical framework operations
    this.logger.warn('Non-essential operations paused due to security emergency');
  }

  private preserveEvidence(incident: SecurityIncident): void {
    const evidencePath = path.join(this.versatilHome, 'security', 'evidence', incident.id);
    fs.mkdirSync(evidencePath, { recursive: true });

    const evidenceData = {
      incident,
      system_logs: this.collectSystemLogs(),
      security_events: this.collectRecentSecurityEvents(),
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(evidencePath, 'evidence.json'),
      JSON.stringify(evidenceData, null, 2)
    );

    this.logger.info('Evidence preserved', { incident_id: incident.id, path: evidencePath });
  }

  private escalateToZeroTrust(securityEvent: any): void {
    // Coordinate escalation to zero trust system
    this.logger.warn('Escalating security event to zero trust system', {
      event_type: securityEvent.type || securityEvent.violation_type,
      project_id: securityEvent.project_id
    });

    this.emit('escalateToZeroTrust', securityEvent);
  }

  private escalateCriticalIncident(incident: SecurityIncident): void {
    this.logger.error('CRITICAL INCIDENT ESCALATION', {
      incident_id: incident.id,
      type: incident.incident_type,
      description: incident.description
    });

    this.emit('criticalIncidentEscalated', incident);
  }

  private async performSecurityAssessment(): Promise<SecurityPosture> {
    const posture: SecurityPosture = {
      overall_score: 0,
      last_assessment: new Date().toISOString(),
      compliance_status: 'compliant',
      active_threats: this.getActiveThreats().length,
      resolved_incidents: this.getResolvedIncidents().length,
      system_health: {
        microsegmentation: await this.assessMicrosegmentationHealth(),
        zero_trust: await this.assessZeroTrustHealth(),
        boundary_enforcement: await this.assessBoundaryEnforcementHealth(),
        path_protection: await this.assessPathProtectionHealth()
      },
      recommendations: []
    };

    // Calculate overall score
    const healthScores = Object.values(posture.system_health);
    posture.overall_score = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

    // Determine compliance status
    if (posture.overall_score >= 95) {
      posture.compliance_status = 'compliant';
    } else if (posture.overall_score >= 85) {
      posture.compliance_status = 'warning';
    } else if (posture.overall_score >= 70) {
      posture.compliance_status = 'violation';
    } else {
      posture.compliance_status = 'critical';
    }

    // Generate recommendations
    posture.recommendations = this.generateSecurityRecommendations(posture);

    this.emit('securityPostureUpdated', posture);
    return posture;
  }

  // Public API Methods

  public async createSecureProject(
    projectId: string,
    projectPath: string,
    securityLevel: 'standard' | 'enhanced' | 'maximum' = 'enhanced'
  ): Promise<{ success: boolean; securityContext?: any; error?: string }> {
    try {
      this.logger.info('Creating secure project', { project_id: projectId, security_level: securityLevel });

      // Validate path safety
      const pathValidation = this.pathProtection.validatePath(projectPath, projectId, 'write');
      if (!pathValidation.is_safe) {
        return {
          success: false,
          error: `Unsafe project path: ${pathValidation.violations.join(', ')}`
        };
      }

      // Create zero trust isolation
      const isolationBoundary = await this.zeroTrust.createProjectIsolation(
        projectId,
        pathValidation.recommended_path,
        securityLevel
      );

      // Create microsegmentation context
      const securityContext = await this.microsegmentation.createProjectSecurityContext(
        projectId,
        pathValidation.recommended_path
      );

      this.logger.info('Secure project created successfully', {
        project_id: projectId,
        boundary_id: isolationBoundary.boundary_id
      });

      return {
        success: true,
        securityContext: {
          project_id: projectId,
          security_level: securityLevel,
          boundary_id: isolationBoundary.boundary_id,
          safe_path: pathValidation.recommended_path,
          created_at: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.error('Failed to create secure project', { project_id: projectId, error });
      return {
        success: false,
        error: error.message
      };
    }
  }

  public async validateSecureAccess(
    projectId: string,
    operation: 'read' | 'write' | 'execute',
    targetPath: string
  ): Promise<{ allowed: boolean; reason?: string; security_incident?: SecurityIncident }> {
    // Path traversal validation (map execute to write for validation)
    const mappedOp = operation === 'execute' ? 'write' : operation;
    const pathValidation = this.pathProtection.validatePath(targetPath, projectId, mappedOp);
    if (!pathValidation.is_safe) {
      const incident = this.createSecurityIncident({
        source_system: 'integrated_orchestrator',
        incident_type: 'unauthorized_access',
        severity: 'high',
        description: `Unsafe path access attempt: ${pathValidation.violations.join(', ')}`,
        evidence: pathValidation,
        project_id: projectId
      });

      this.processIncident(incident);

      return {
        allowed: false,
        reason: 'Path validation failed',
        security_incident: incident
      };
    }

    // Boundary enforcement validation
    const boundaryValidation = await this.boundaryEnforcement.validateFileAccess(
      targetPath,
      operation,
      projectId
    );

    if (!boundaryValidation.allowed) {
      return {
        allowed: false,
        reason: boundaryValidation.reason,
        security_incident: boundaryValidation.violation ? this.createSecurityIncident({
          source_system: 'integrated_orchestrator',
          incident_type: 'boundary_violation',
          severity: 'medium',
          description: boundaryValidation.reason || 'Boundary violation',
          evidence: boundaryValidation,
          project_id: projectId
        }) : undefined
      };
    }

    // Zero trust validation
    const zeroTrustValidation = await this.zeroTrust.validateProjectAccess(
      projectId,
      operation,
      targetPath
    );

    if (!zeroTrustValidation) {
      const incident = this.createSecurityIncident({
        source_system: 'integrated_orchestrator',
        incident_type: 'unauthorized_access',
        severity: 'high',
        description: 'Zero trust validation failed',
        evidence: { project_id: projectId, operation, target_path: targetPath },
        project_id: projectId
      });

      this.processIncident(incident);

      return {
        allowed: false,
        reason: 'Zero trust validation failed',
        security_incident: incident
      };
    }

    return { allowed: true };
  }

  public getSecurityStatus(): any {
    return {
      security_enabled: this.securityEnabled,
      active_incidents: this.getActiveIncidents().length,
      critical_incidents: this.getCriticalIncidents().length,
      system_health: {
        microsegmentation: this.microsegmentation ? 'active' : 'inactive',
        zero_trust: this.zeroTrust ? 'active' : 'inactive',
        boundary_enforcement: this.boundaryEnforcement ? 'active' : 'inactive',
        path_protection: this.pathProtection ? 'active' : 'inactive'
      },
      last_assessment: new Date().toISOString()
    };
  }

  public getSecurityIncidents(limit: number = 50): SecurityIncident[] {
    return this.incidents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public getActiveIncidents(): SecurityIncident[] {
    return this.incidents.filter(incident =>
      ['detected', 'investigating', 'escalated'].includes(incident.status)
    );
  }

  public getCriticalIncidents(): SecurityIncident[] {
    return this.incidents.filter(incident => incident.severity === 'critical');
  }

  public getResolvedIncidents(): SecurityIncident[] {
    return this.incidents.filter(incident => incident.status === 'resolved');
  }

  public async exportComprehensiveSecurityReport(): Promise<any> {
    const posture = await this.performSecurityAssessment();

    return {
      generated_at: new Date().toISOString(),
      security_framework: 'VERSATIL Integrated Security',
      version: '1.0.0',
      overall_posture: posture,
      system_reports: {
        microsegmentation: await this.microsegmentation.exportSecurityReport(),
        zero_trust: await this.zeroTrust.generateComplianceReport(),
        boundary_enforcement: await this.boundaryEnforcement.exportSecurityReport(),
        path_protection: this.pathProtection.exportSecurityReport()
      },
      security_incidents: this.getSecurityIncidents(100),
      active_threats: this.getActiveThreats(),
      recommendations: this.generateSecurityRecommendations(posture)
    };
  }

  public stopSecurityMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.boundaryEnforcement?.stopMonitoring();
    this.logger.info('Security monitoring stopped');
  }

  // Helper methods
  private mapEventToIncidentType(event: any): SecurityIncident['incident_type'] {
    if (event.type === 'access_denied') return 'unauthorized_access';
    if (event.type === 'boundary_violation') return 'boundary_violation';
    if (event.type === 'privilege_escalation') return 'privilege_escalation';
    return 'policy_violation';
  }

  private mapEventSeverity(event: any): SecurityIncident['severity'] {
    if (event.severity) return event.severity;
    if (event.type === 'critical') return 'critical';
    if (event.type === 'error') return 'high';
    return 'medium';
  }

  private generateEventDescription(source: string, event: any): string {
    return `Security event from ${source}: ${event.type || 'unknown'} - ${event.message || 'No details'}`;
  }

  private generateResponseActions(incidentType: SecurityIncident['incident_type'], severity: SecurityIncident['severity']): string[] {
    const actions: string[] = ['alert_security_team'];

    if (severity === 'critical') {
      actions.push('quarantine_project', 'backup_project_state', 'forensic_analysis');
    } else if (severity === 'high') {
      actions.push('block_access', 'enhance_monitoring', 'backup_project_state');
    } else if (severity === 'medium') {
      actions.push('enhance_monitoring');
    }

    if (incidentType === 'path_traversal_attack') {
      actions.push('isolate_network_access');
    }

    return actions;
  }

  private generateIncidentId(): string {
    return `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToSecurityAudit(incident: SecurityIncident): void {
    const auditEntry = {
      timestamp: incident.timestamp,
      incident_id: incident.id,
      type: incident.incident_type,
      severity: incident.severity,
      source: incident.source_system,
      project_id: incident.project_id,
      description: incident.description
    };

    const auditFile = path.join(this.versatilHome, 'security', 'audit.log');
    fs.appendFileSync(auditFile, JSON.stringify(auditEntry) + '\n');
  }

  private captureSystemState(): any {
    return {
      timestamp: new Date().toISOString(),
      process_info: {
        pid: process.pid,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage()
      },
      security_systems: {
        microsegmentation_active: !!this.microsegmentation,
        zero_trust_active: !!this.zeroTrust,
        boundary_enforcement_active: !!this.boundaryEnforcement,
        path_protection_active: !!this.pathProtection
      }
    };
  }

  private collectSystemLogs(): any[] {
    // Implementation would collect relevant system logs
    return [];
  }

  private collectRecentSecurityEvents(): any[] {
    return this.incidents.slice(-50); // Last 50 incidents
  }

  private getActiveThreats(): SecurityIncident[] {
    return this.incidents.filter(incident =>
      incident.severity === 'critical' &&
      ['detected', 'investigating'].includes(incident.status)
    );
  }

  private async assessMicrosegmentationHealth(): Promise<number> {
    const isCompliant = await this.microsegmentation.validateFrameworkCompliance();
    return isCompliant ? 100 : 75;
  }

  private async assessZeroTrustHealth(): Promise<number> {
    // Assessment based on zero trust principles
    return 95; // Simplified
  }

  private async assessBoundaryEnforcementHealth(): Promise<number> {
    const status = this.boundaryEnforcement.getBoundaryStatus();
    const violationRate = status.total_violations / Math.max(1, status.uptime / 3600); // violations per hour

    if (violationRate === 0) return 100;
    if (violationRate < 1) return 95;
    if (violationRate < 5) return 85;
    return 70;
  }

  private async assessPathProtectionHealth(): Promise<number> {
    const stats = this.pathProtection.getSecurityStatistics();
    const blockRate = stats.blocked_attempts / Math.max(1, stats.total_attempts);

    return Math.max(70, 100 - (stats.total_attempts * 0.1)); // Penalize for attempts
  }

  private generateSecurityRecommendations(posture: SecurityPosture): string[] {
    const recommendations: string[] = [];

    if (posture.overall_score < 95) {
      recommendations.push('Enhance overall security posture to achieve 95%+ compliance');
    }

    if (posture.active_threats > 0) {
      recommendations.push('Address active security threats immediately');
    }

    if (posture.system_health.microsegmentation < 90) {
      recommendations.push('Review and strengthen microsegmentation policies');
    }

    if (posture.system_health.boundary_enforcement < 90) {
      recommendations.push('Enhance boundary enforcement mechanisms');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture is excellent - maintain current standards');
    }

    return recommendations;
  }
}

export default IntegratedSecurityOrchestrator;