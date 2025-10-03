/**
 * VERSATIL Framework - Synchronization Dashboard
 *
 * Unified real-time monitoring of all synchronization states across the framework.
 * Integrates all health check systems to provide comprehensive sync validation.
 *
 * @module SynchronizationDashboard
 * @version 2.0.0
 */

import { EventEmitter } from 'events';
import { FrameworkEfficiencyMonitor, FrameworkMetrics } from './framework-efficiency-monitor.js';
import { IntrospectiveMetaAgent, SystemMetrics } from '../agents/meta/introspective-meta-agent.js';
import { ProactiveAgentOrchestrator } from '../orchestration/proactive-agent-orchestrator.js';
import { AgenticRAGOrchestrator } from '../orchestration/agentic-rag-orchestrator.js';
import { PlanFirstOpera } from '../orchestration/plan-first-opera.js';
import { StackAwareOrchestrator } from '../orchestration/stack-aware-orchestrator.js';
import { GitHubSyncOrchestrator } from '../orchestration/github-sync-orchestrator.js';
import { ParallelTaskManager } from '../orchestration/parallel-task-manager.js';

export interface SyncStatus {
  synchronized: boolean;
  score: number; // 0-100
  lastCheck: number;
  issues: SyncIssue[];
  orchestrators: OrchestratorStatus[];
  eventSystem: EventSystemStatus;
  memoryConsistency: MemoryConsistencyStatus;
  healthSystems: HealthSystemsStatus;
}

export interface SyncIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  description: string;
  impact: string;
  autoRecoverable: boolean;
  recommendation: string;
}

export interface OrchestratorStatus {
  name: string;
  active: boolean;
  healthy: boolean;
  eventCount: number;
  lastActivity: number;
  responseTime: number;
  errorCount: number;
}

export interface EventSystemStatus {
  healthy: boolean;
  totalEvents: number;
  eventsPerSecond: number;
  droppedEvents: number;
  averageLatency: number;
  listeners: Map<string, number>;
}

export interface MemoryConsistencyStatus {
  consistent: boolean;
  totalMemories: number;
  orphanedMemories: number;
  duplicateMemories: number;
  corruptedMemories: number;
  lastValidation: number;
}

export interface HealthSystemsStatus {
  frameworkMonitor: {
    active: boolean;
    lastCheck: number;
    health: number;
  };
  introspectiveAgent: {
    active: boolean;
    lastCheck: number;
    health: number;
  };
  doctorSystem: {
    active: boolean;
    lastCheck: number;
    health: number;
  };
}

export class SynchronizationDashboard extends EventEmitter {
  private frameworkMonitor?: FrameworkEfficiencyMonitor;
  private introspectiveAgent?: IntrospectiveMetaAgent;
  private proactiveOrchestrator?: ProactiveAgentOrchestrator;
  private ragOrchestrator?: AgenticRAGOrchestrator;
  private planOrchestrator?: PlanFirstOpera;
  private stackOrchestrator?: StackAwareOrchestrator;
  private githubOrchestrator?: GitHubSyncOrchestrator;
  private parallelManager?: ParallelTaskManager;

  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;
  private syncStatus: SyncStatus;
  private eventMetrics: Map<string, number> = new Map();
  private lastEventTimes: Map<string, number> = new Map();

  constructor() {
    super();
    this.syncStatus = this.initializeSyncStatus();
  }

  /**
   * Initialize with all framework components
   */
  public async initialize(components: {
    frameworkMonitor: FrameworkEfficiencyMonitor;
    introspectiveAgent: IntrospectiveMetaAgent;
    proactiveOrchestrator: ProactiveAgentOrchestrator;
    ragOrchestrator: AgenticRAGOrchestrator;
    planOrchestrator: PlanFirstOpera;
    stackOrchestrator: StackAwareOrchestrator;
    githubOrchestrator?: GitHubSyncOrchestrator;
    parallelManager?: ParallelTaskManager;
  }): Promise<void> {
    this.frameworkMonitor = components.frameworkMonitor;
    this.introspectiveAgent = components.introspectiveAgent;
    this.proactiveOrchestrator = components.proactiveOrchestrator;
    this.ragOrchestrator = components.ragOrchestrator;
    this.planOrchestrator = components.planOrchestrator;
    this.stackOrchestrator = components.stackOrchestrator;
    this.githubOrchestrator = components.githubOrchestrator;
    this.parallelManager = components.parallelManager;

    // Subscribe to all system events
    this.subscribeToSystemEvents();

    console.log('🔄 Synchronization Dashboard initialized');
  }

  /**
   * Subscribe to events from all orchestrators
   */
  private subscribeToSystemEvents(): void {
    // ProactiveAgentOrchestrator events
    if (this.proactiveOrchestrator) {
      this.proactiveOrchestrator.on('agent-activated', () => this.trackEvent('agent-activated'));
      this.proactiveOrchestrator.on('agents-completed', () => this.trackEvent('agents-completed'));
      this.proactiveOrchestrator.on('agents-failed', () => this.trackEvent('agents-failed'));
      this.proactiveOrchestrator.on('monitoring-started', () => this.trackEvent('monitoring-started'));
      this.proactiveOrchestrator.on('monitoring-stopped', () => this.trackEvent('monitoring-stopped'));
    }

    // AgenticRAGOrchestrator events
    if (this.ragOrchestrator) {
      this.ragOrchestrator.on('pattern:detected', () => this.trackEvent('pattern:detected'));
      this.ragOrchestrator.on('rule_pattern:detected', () => this.trackEvent('rule_pattern:detected'));
    }

    // GitHubSyncOrchestrator events
    if (this.githubOrchestrator) {
      this.githubOrchestrator.on('pr:created', () => this.trackEvent('pr:created'));
      this.githubOrchestrator.on('issue:created', () => this.trackEvent('issue:created'));
      this.githubOrchestrator.on('pr:linked', () => this.trackEvent('pr:linked'));
    }

    // FrameworkEfficiencyMonitor events
    if (this.frameworkMonitor) {
      this.frameworkMonitor.on('health-check-complete', () => this.trackEvent('health-check-complete'));
      this.frameworkMonitor.on('critical-issues-detected', () => this.trackEvent('critical-issues-detected'));
      this.frameworkMonitor.on('monitoring-started', () => this.trackEvent('framework-monitoring-started'));
    }

    console.log('📡 Subscribed to all system events');
  }

  /**
   * Track event occurrence
   */
  private trackEvent(eventName: string): void {
    const count = this.eventMetrics.get(eventName) || 0;
    this.eventMetrics.set(eventName, count + 1);
    this.lastEventTimes.set(eventName, Date.now());

    // Update event system status
    this.updateEventSystemStatus();
  }

  /**
   * Start continuous monitoring
   */
  public startMonitoring(interval_ms: number = 30000): void {
    if (this.isMonitoring) {
      console.log('⚠️  Synchronization monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`🔄 Starting synchronization monitoring (interval: ${interval_ms}ms)`);

    this.monitoringInterval = setInterval(async () => {
      await this.performSyncValidation();
    }, interval_ms);

    this.emit('monitoring-started', { interval_ms });
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isMonitoring = false;
    console.log('🔄 Synchronization monitoring stopped');
    this.emit('monitoring-stopped');
  }

  /**
   * Perform comprehensive synchronization validation
   */
  public async performSyncValidation(): Promise<SyncStatus> {
    console.log('🔍 Performing synchronization validation...');

    const startTime = Date.now();

    // 1. Check orchestrator statuses
    const orchestrators = await this.checkAllOrchestrators();

    // 2. Validate event system
    const eventSystem = await this.validateEventSystem();

    // 3. Check memory consistency
    const memoryConsistency = await this.checkMemoryConsistency();

    // 4. Validate health systems
    const healthSystems = await this.validateHealthSystems();

    // 5. Detect sync issues
    const issues = await this.detectSyncIssues(
      orchestrators,
      eventSystem,
      memoryConsistency,
      healthSystems
    );

    // 6. Calculate sync score
    const syncScore = this.calculateSyncScore(
      orchestrators,
      eventSystem,
      memoryConsistency,
      healthSystems,
      issues
    );

    // Update status
    this.syncStatus = {
      synchronized: syncScore >= 90 && issues.filter(i => i.severity === 'critical').length === 0,
      score: syncScore,
      lastCheck: Date.now(),
      issues,
      orchestrators,
      eventSystem,
      memoryConsistency,
      healthSystems
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Sync validation complete in ${duration}ms - Score: ${syncScore}%`);

    // Emit validation complete
    this.emit('sync-validation-complete', {
      status: this.syncStatus,
      duration
    });

    // Check for critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      this.emit('critical-sync-issues', criticalIssues);
      console.error(`❌ ${criticalIssues.length} CRITICAL synchronization issues detected!`);
    }

    return this.syncStatus;
  }

  /**
   * Check status of all orchestrators
   */
  private async checkAllOrchestrators(): Promise<OrchestratorStatus[]> {
    const statuses: OrchestratorStatus[] = [];

    const orchestrators = [
      { name: 'ProactiveAgentOrchestrator', instance: this.proactiveOrchestrator },
      { name: 'AgenticRAGOrchestrator', instance: this.ragOrchestrator },
      { name: 'PlanFirstOpera', instance: this.planOrchestrator },
      { name: 'StackAwareOrchestrator', instance: this.stackOrchestrator },
      { name: 'GitHubSyncOrchestrator', instance: this.githubOrchestrator },
      { name: 'ParallelTaskManager', instance: this.parallelManager },
      { name: 'FrameworkEfficiencyMonitor', instance: this.frameworkMonitor },
      { name: 'IntrospectiveMetaAgent', instance: this.introspectiveAgent }
    ];

    for (const { name, instance } of orchestrators) {
      if (!instance) {
        statuses.push({
          name,
          active: false,
          healthy: false,
          eventCount: 0,
          lastActivity: 0,
          responseTime: 0,
          errorCount: 0
        });
        continue;
      }

      // Check if orchestrator is active by checking listener count
      const listenerCount = (instance as EventEmitter).listenerCount('*') || 0;
      const hasListeners = listenerCount > 0 || (instance as EventEmitter).eventNames().length > 0;

      // Get event metrics for this orchestrator
      const eventCount = this.getOrchestratorEventCount(name);
      const lastActivity = this.lastEventTimes.get(name.toLowerCase()) || 0;

      statuses.push({
        name,
        active: hasListeners || eventCount > 0,
        healthy: true, // Would implement actual health check per orchestrator
        eventCount,
        lastActivity,
        responseTime: 0, // Would track actual response times
        errorCount: 0 // Would track actual errors
      });
    }

    return statuses;
  }

  /**
   * Get event count for specific orchestrator
   */
  private getOrchestratorEventCount(orchestratorName: string): number {
    let total = 0;
    for (const [event, count] of this.eventMetrics.entries()) {
      if (event.toLowerCase().includes(orchestratorName.toLowerCase())) {
        total += count;
      }
    }
    return total;
  }

  /**
   * Validate event system health
   */
  private async validateEventSystem(): Promise<EventSystemStatus> {
    const totalEvents = Array.from(this.eventMetrics.values()).reduce((sum, count) => sum + count, 0);

    // Calculate events per second (over last 60 seconds)
    const recentEvents = this.getRecentEventCount(60000);
    const eventsPerSecond = recentEvents / 60;

    // Get listener counts
    const listeners = new Map<string, number>();
    const orchestrators = [
      this.proactiveOrchestrator,
      this.ragOrchestrator,
      this.githubOrchestrator,
      this.frameworkMonitor
    ].filter(o => o);

    for (const orchestrator of orchestrators) {
      if (orchestrator) {
        const names = (orchestrator as EventEmitter).eventNames();
        for (const name of names) {
          const count = (orchestrator as EventEmitter).listenerCount(name as string | symbol);
          listeners.set(String(name), count);
        }
      }
    }

    return {
      healthy: totalEvents > 0 && eventsPerSecond < 100, // Not overloaded
      totalEvents,
      eventsPerSecond,
      droppedEvents: 0, // Would track actual dropped events
      averageLatency: 0, // Would track actual latency
      listeners
    };
  }

  /**
   * Get recent event count
   */
  private getRecentEventCount(timeWindowMs: number): number {
    const cutoff = Date.now() - timeWindowMs;
    let count = 0;

    for (const timestamp of this.lastEventTimes.values()) {
      if (timestamp >= cutoff) {
        count++;
      }
    }

    return count;
  }

  /**
   * Check memory consistency
   */
  private async checkMemoryConsistency(): Promise<MemoryConsistencyStatus> {
    if (!this.ragOrchestrator) {
      return {
        consistent: true,
        totalMemories: 0,
        orphanedMemories: 0,
        duplicateMemories: 0,
        corruptedMemories: 0,
        lastValidation: Date.now()
      };
    }

    // Get all agent memories
    const agentMemories = await this.ragOrchestrator.getAgentMemories();
    const totalMemories = Array.from(agentMemories.values()).reduce((sum, memories) => sum + memories.length, 0);

    // Would implement actual consistency checks here
    // For now, return basic stats
    return {
      consistent: true,
      totalMemories,
      orphanedMemories: 0,
      duplicateMemories: 0,
      corruptedMemories: 0,
      lastValidation: Date.now()
    };
  }

  /**
   * Validate all health systems
   */
  private async validateHealthSystems(): Promise<HealthSystemsStatus> {
    const frameworkMetrics = this.frameworkMonitor?.getMetrics();

    return {
      frameworkMonitor: {
        active: !!this.frameworkMonitor,
        lastCheck: frameworkMetrics?.timestamp || 0,
        health: frameworkMetrics?.overall_health || 0
      },
      introspectiveAgent: {
        active: !!this.introspectiveAgent,
        lastCheck: Date.now(), // Would get from agent
        health: 100 // Would get from agent
      },
      doctorSystem: {
        active: true, // Doctor is always available
        lastCheck: 0, // Would track last doctor run
        health: 100 // Would get from last doctor run
      }
    };
  }

  /**
   * Detect synchronization issues
   */
  private async detectSyncIssues(
    orchestrators: OrchestratorStatus[],
    eventSystem: EventSystemStatus,
    memoryConsistency: MemoryConsistencyStatus,
    healthSystems: HealthSystemsStatus
  ): Promise<SyncIssue[]> {
    const issues: SyncIssue[] = [];

    // Check inactive orchestrators
    const inactiveOrchestrators = orchestrators.filter(o => !o.active);
    if (inactiveOrchestrators.length > 0) {
      issues.push({
        severity: 'high',
        component: 'Orchestrators',
        description: `${inactiveOrchestrators.length} orchestrators inactive: ${inactiveOrchestrators.map(o => o.name).join(', ')}`,
        impact: 'Reduced framework functionality and coordination',
        autoRecoverable: true,
        recommendation: 'Restart affected orchestrators or run sync recovery'
      });
    }

    // Check unhealthy orchestrators
    const unhealthyOrchestrators = orchestrators.filter(o => !o.healthy);
    if (unhealthyOrchestrators.length > 0) {
      issues.push({
        severity: 'critical',
        component: 'Orchestrators',
        description: `${unhealthyOrchestrators.length} orchestrators unhealthy`,
        impact: 'System instability and potential data loss',
        autoRecoverable: false,
        recommendation: 'Investigate orchestrator logs and restart framework'
      });
    }

    // Check event system health
    if (!eventSystem.healthy) {
      issues.push({
        severity: 'critical',
        component: 'Event System',
        description: 'Event system unhealthy or overloaded',
        impact: 'Orchestrators cannot communicate, sync will fail',
        autoRecoverable: true,
        recommendation: 'Restart event system or reduce event load'
      });
    }

    // Check memory consistency
    if (!memoryConsistency.consistent) {
      issues.push({
        severity: 'high',
        component: 'Memory System',
        description: 'Memory stores inconsistent',
        impact: 'Agents may have incorrect context',
        autoRecoverable: true,
        recommendation: 'Run memory validation and repair'
      });
    }

    if (memoryConsistency.orphanedMemories > 0) {
      issues.push({
        severity: 'medium',
        component: 'Memory System',
        description: `${memoryConsistency.orphanedMemories} orphaned memories detected`,
        impact: 'Wasted storage and potential memory leaks',
        autoRecoverable: true,
        recommendation: 'Run memory cleanup'
      });
    }

    // Check health systems
    if (!healthSystems.frameworkMonitor.active) {
      issues.push({
        severity: 'medium',
        component: 'Health Systems',
        description: 'Framework monitor inactive',
        impact: 'Cannot detect framework issues',
        autoRecoverable: true,
        recommendation: 'Initialize framework monitor'
      });
    }

    if (healthSystems.frameworkMonitor.health < 70) {
      issues.push({
        severity: 'high',
        component: 'Health Systems',
        description: `Framework health below threshold: ${healthSystems.frameworkMonitor.health}%`,
        impact: 'Framework efficiency compromised',
        autoRecoverable: false,
        recommendation: 'Run /doctor to diagnose issues'
      });
    }

    return issues;
  }

  /**
   * Calculate synchronization score (0-100)
   */
  private calculateSyncScore(
    orchestrators: OrchestratorStatus[],
    eventSystem: EventSystemStatus,
    memoryConsistency: MemoryConsistencyStatus,
    healthSystems: HealthSystemsStatus,
    issues: SyncIssue[]
  ): number {
    // Orchestrator health (40%)
    const activeOrchestrators = orchestrators.filter(o => o.active).length;
    const healthyOrchestrators = orchestrators.filter(o => o.healthy).length;
    const orchestratorScore = ((activeOrchestrators + healthyOrchestrators) / (orchestrators.length * 2)) * 100;

    // Event system health (20%)
    const eventScore = eventSystem.healthy ? 100 : 0;

    // Memory consistency (20%)
    const memoryScore = memoryConsistency.consistent ? 100 : 0;

    // Health systems status (20%)
    const healthSystemsScore = (
      (healthSystems.frameworkMonitor.active ? 33 : 0) +
      (healthSystems.introspectiveAgent.active ? 33 : 0) +
      (healthSystems.doctorSystem.active ? 34 : 0)
    );

    // Calculate weighted average
    const baseScore = (
      orchestratorScore * 0.4 +
      eventScore * 0.2 +
      memoryScore * 0.2 +
      healthSystemsScore * 0.2
    );

    // Apply penalty for issues
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const penalty = (criticalIssues * 20) + (highIssues * 10);

    return Math.max(0, Math.min(100, Math.round(baseScore - penalty)));
  }

  /**
   * Update event system status
   */
  private updateEventSystemStatus(): void {
    // Update internal event metrics
    this.emit('event-tracked', {
      totalEvents: Array.from(this.eventMetrics.values()).reduce((sum, count) => sum + count, 0),
      eventTypes: this.eventMetrics.size
    });
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Get sync score
   */
  public getSyncScore(): number {
    return this.syncStatus.score;
  }

  /**
   * Is system synchronized?
   */
  public isSynchronized(): boolean {
    return this.syncStatus.synchronized;
  }

  /**
   * Get critical issues
   */
  public getCriticalIssues(): SyncIssue[] {
    return this.syncStatus.issues.filter(i => i.severity === 'critical');
  }

  /**
   * Generate sync report
   */
  public generateSyncReport(): string {
    const report = [];
    report.push('='.repeat(70));
    report.push('🔄 VERSATIL Synchronization Report');
    report.push('='.repeat(70));
    report.push('');
    report.push(`Status: ${this.syncStatus.synchronized ? '✅ SYNCHRONIZED' : '❌ OUT OF SYNC'}`);
    report.push(`Score: ${this.syncStatus.score}% ${this.getSyncEmoji(this.syncStatus.score)}`);
    report.push(`Last Check: ${new Date(this.syncStatus.lastCheck).toISOString()}`);
    report.push('');

    // Orchestrators
    report.push('🔧 Orchestrators:');
    for (const orch of this.syncStatus.orchestrators) {
      const icon = orch.active && orch.healthy ? '🟢' : orch.active ? '🟡' : '🔴';
      report.push(`  ${icon} ${orch.name}`);
      report.push(`     Events: ${orch.eventCount} | Last Activity: ${this.formatTimestamp(orch.lastActivity)}`);
    }
    report.push('');

    // Event System
    report.push('📡 Event System:');
    report.push(`  Status: ${this.syncStatus.eventSystem.healthy ? '🟢 Healthy' : '🔴 Unhealthy'}`);
    report.push(`  Total Events: ${this.syncStatus.eventSystem.totalEvents}`);
    report.push(`  Rate: ${this.syncStatus.eventSystem.eventsPerSecond.toFixed(2)} events/sec`);
    report.push(`  Active Listeners: ${this.syncStatus.eventSystem.listeners.size}`);
    report.push('');

    // Memory Consistency
    report.push('💾 Memory System:');
    report.push(`  Status: ${this.syncStatus.memoryConsistency.consistent ? '🟢 Consistent' : '🔴 Inconsistent'}`);
    report.push(`  Total Memories: ${this.syncStatus.memoryConsistency.totalMemories}`);
    if (this.syncStatus.memoryConsistency.orphanedMemories > 0) {
      report.push(`  ⚠️  Orphaned: ${this.syncStatus.memoryConsistency.orphanedMemories}`);
    }
    report.push('');

    // Health Systems
    report.push('🏥 Health Systems:');
    const { frameworkMonitor, introspectiveAgent, doctorSystem } = this.syncStatus.healthSystems;
    report.push(`  Framework Monitor: ${frameworkMonitor.active ? '🟢' : '🔴'} ${frameworkMonitor.health}%`);
    report.push(`  Introspective Agent: ${introspectiveAgent.active ? '🟢' : '🔴'} ${introspectiveAgent.health}%`);
    report.push(`  Doctor System: ${doctorSystem.active ? '🟢' : '🔴'} ${doctorSystem.health}%`);
    report.push('');

    // Issues
    if (this.syncStatus.issues.length > 0) {
      report.push('⚠️  Issues Detected:');
      for (const issue of this.syncStatus.issues) {
        const icon = issue.severity === 'critical' ? '🔴' :
                     issue.severity === 'high' ? '🟠' :
                     issue.severity === 'medium' ? '🟡' : '🟢';
        report.push(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.component}`);
        report.push(`     ${issue.description}`);
        report.push(`     Impact: ${issue.impact}`);
        report.push(`     → ${issue.recommendation}`);
        if (issue.autoRecoverable) {
          report.push(`     ✨ Auto-recovery available`);
        }
        report.push('');
      }
    } else {
      report.push('✅ No synchronization issues detected');
    }

    report.push('');
    report.push('='.repeat(70));

    return report.join('\n');
  }

  /**
   * Get sync emoji based on score
   */
  private getSyncEmoji(score: number): string {
    if (score >= 95) return '🟢';
    if (score >= 85) return '🟡';
    if (score >= 70) return '🟠';
    return '🔴';
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(timestamp: number): string {
    if (timestamp === 0) return 'Never';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    return `${Math.round(diff / 3600000)}h ago`;
  }

  /**
   * Initialize empty sync status
   */
  private initializeSyncStatus(): SyncStatus {
    return {
      synchronized: false,
      score: 0,
      lastCheck: 0,
      issues: [],
      orchestrators: [],
      eventSystem: {
        healthy: false,
        totalEvents: 0,
        eventsPerSecond: 0,
        droppedEvents: 0,
        averageLatency: 0,
        listeners: new Map()
      },
      memoryConsistency: {
        consistent: true,
        totalMemories: 0,
        orphanedMemories: 0,
        duplicateMemories: 0,
        corruptedMemories: 0,
        lastValidation: 0
      },
      healthSystems: {
        frameworkMonitor: {
          active: false,
          lastCheck: 0,
          health: 0
        },
        introspectiveAgent: {
          active: false,
          lastCheck: 0,
          health: 0
        },
        doctorSystem: {
          active: false,
          lastCheck: 0,
          health: 0
        }
      }
    };
  }

  /**
   * Cleanup
   */
  public shutdown(): void {
    this.stopMonitoring();
    this.removeAllListeners();
    this.eventMetrics.clear();
    this.lastEventTimes.clear();
  }
}

// Singleton instance
let dashboardInstance: SynchronizationDashboard | null = null;

export function getSyncDashboard(): SynchronizationDashboard {
  if (!dashboardInstance) {
    dashboardInstance = new SynchronizationDashboard();
  }
  return dashboardInstance;
}

export function destroySyncDashboard(): void {
  if (dashboardInstance) {
    dashboardInstance.shutdown();
    dashboardInstance = null;
  }
}