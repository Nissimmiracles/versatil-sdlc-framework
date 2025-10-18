/**
 * Contract Tracker
 *
 * Tracks agent handoff contracts for analytics and debugging.
 * Integrates with Context Stats Tracker for unified monitoring.
 *
 * Metrics Tracked:
 * - Contract success/failure rates
 * - Handoff performance by agent
 * - Quality gate pass rates
 * - Effort estimation accuracy
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  AgentHandoffContract,
  HandoffType,
  HandoffStatus,
  HandoffPriority
} from './agent-handoff-contract.js';
import { ValidationResult } from './contract-validator.js';
import { AgentId } from '../../memory/memory-tool-config.js';

/**
 * Contract event (creation, status change, completion)
 */
export interface ContractEvent {
  timestamp: Date;
  contractId: string;
  eventType: 'created' | 'sent' | 'accepted' | 'rejected' | 'completed' | 'failed' | 'cancelled';
  sender: AgentId;
  receivers: AgentId[];
  handoffType: HandoffType;
  priority: HandoffPriority;
  validationScore?: number;
  metadata?: Record<string, any>;
}

/**
 * Contract performance metrics
 */
export interface ContractPerformance {
  contractId: string;
  sender: AgentId;
  receivers: AgentId[];
  estimatedEffort?: number;
  actualEffort?: number;
  effortAccuracy?: number; // percentage
  qualityGatesPassed?: number;
  qualityGatesTotal?: number;
  qualityPassRate?: number; // percentage
  duration?: number; // milliseconds
  status: HandoffStatus;
}

/**
 * Aggregate contract statistics
 */
export interface ContractStatistics {
  /**
   * Total contracts tracked
   */
  totalContracts: number;

  /**
   * Contracts by status
   */
  byStatus: Record<HandoffStatus, number>;

  /**
   * Contracts by type
   */
  byType: Record<HandoffType, number>;

  /**
   * Contracts by sender
   */
  bySender: Record<string, number>;

  /**
   * Contracts by receiver
   */
  byReceiver: Record<string, number>;

  /**
   * Average quality score
   */
  avgQualityScore: number;

  /**
   * Success rate (completed / total)
   */
  successRate: number;

  /**
   * Average effort accuracy
   */
  avgEffortAccuracy: number;

  /**
   * Average quality gate pass rate
   */
  avgQualityPassRate: number;

  /**
   * Average handoff duration (ms)
   */
  avgDuration: number;

  /**
   * Last contract event
   */
  lastEvent?: ContractEvent;
}

/**
 * Contract Tracker
 */
export class ContractTracker {
  private statsDir: string;
  private events: ContractEvent[] = [];
  private performances: Map<string, ContractPerformance> = new Map();

  constructor(baseDir: string = path.join(os.homedir(), '.versatil', 'stats')) {
    this.statsDir = baseDir;
  }

  /**
   * Initialize tracker (load existing data)
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.statsDir, { recursive: true });

    try {
      // Load contract events
      const eventsPath = path.join(this.statsDir, 'contract-events.json');
      if (await this.fileExists(eventsPath)) {
        const data = await fs.readFile(eventsPath, 'utf-8');
        this.events = JSON.parse(data, this.dateReviver);
      }

      // Load contract performances
      const performancesPath = path.join(this.statsDir, 'contract-performances.json');
      if (await this.fileExists(performancesPath)) {
        const data = await fs.readFile(performancesPath, 'utf-8');
        const perfArray = JSON.parse(data, this.dateReviver);
        this.performances = new Map(perfArray.map((p: ContractPerformance) => [p.contractId, p]));
      }
    } catch (error) {
      console.warn('Failed to load contract tracking data:', error);
    }
  }

  /**
   * Track contract creation
   */
  async trackContractCreated(
    contract: AgentHandoffContract,
    validationResult?: ValidationResult
  ): Promise<void> {
    const event: ContractEvent = {
      timestamp: new Date(),
      contractId: contract.contractId,
      eventType: 'created',
      sender: contract.sender.agentId,
      receivers: contract.receivers.map(r => r.agentId),
      handoffType: contract.type,
      priority: contract.priority,
      validationScore: validationResult?.score,
      metadata: {
        workItemsCount: contract.workItems.length,
        hasMemorySnapshot: !!contract.memorySnapshot
      }
    };

    this.events.push(event);
    await this.persistEvents();

    // Initialize performance tracking
    this.performances.set(contract.contractId, {
      contractId: contract.contractId,
      sender: contract.sender.agentId,
      receivers: contract.receivers.map(r => r.agentId),
      estimatedEffort: this.calculateEstimatedEffort(contract),
      qualityGatesTotal: contract.expectedOutput?.qualityGates?.length || 0,
      status: contract.status
    });
    await this.persistPerformances();
  }

  /**
   * Track contract status change
   */
  async trackStatusChange(
    contractId: string,
    newStatus: HandoffStatus,
    contract?: AgentHandoffContract
  ): Promise<void> {
    if (!contract) {
      return;
    }

    const event: ContractEvent = {
      timestamp: new Date(),
      contractId,
      eventType: this.statusToEventType(newStatus),
      sender: contract.sender.agentId,
      receivers: contract.receivers.map(r => r.agentId),
      handoffType: contract.type,
      priority: contract.priority
    };

    this.events.push(event);
    await this.persistEvents();

    // Update performance tracking
    const perf = this.performances.get(contractId);
    if (perf) {
      perf.status = newStatus;

      // If completed, calculate final metrics
      if (newStatus === 'completed' && contract.results) {
        perf.actualEffort = contract.results.actualEffort;
        if (perf.estimatedEffort && perf.actualEffort) {
          perf.effortAccuracy = (perf.estimatedEffort / perf.actualEffort) * 100;
        }

        perf.qualityGatesPassed = contract.results.qualityResults?.filter(r => r.passed).length || 0;
        if (perf.qualityGatesTotal && perf.qualityGatesTotal > 0) {
          perf.qualityPassRate = (perf.qualityGatesPassed / perf.qualityGatesTotal) * 100;
        }

        // Calculate duration
        const createdEvent = this.events.find(e => e.contractId === contractId && e.eventType === 'created');
        if (createdEvent && contract.results.completedAt) {
          perf.duration = contract.results.completedAt.getTime() - createdEvent.timestamp.getTime();
        }
      }

      await this.persistPerformances();
    }
  }

  /**
   * Track contract validation
   */
  async trackValidation(
    contractId: string,
    validationResult: ValidationResult
  ): Promise<void> {
    // Update event metadata
    const lastEvent = this.events.find(e => e.contractId === contractId);
    if (lastEvent) {
      lastEvent.validationScore = validationResult.score;
      lastEvent.metadata = {
        ...lastEvent.metadata,
        validationErrors: validationResult.errors.length,
        validationWarnings: validationResult.warnings.length
      };
      await this.persistEvents();
    }
  }

  /**
   * Get contract statistics
   */
  getStatistics(): ContractStatistics {
    const stats: ContractStatistics = {
      totalContracts: this.events.filter(e => e.eventType === 'created').length,
      byStatus: {} as Record<HandoffStatus, number>,
      byType: {} as Record<HandoffType, number>,
      bySender: {},
      byReceiver: {},
      avgQualityScore: 0,
      successRate: 0,
      avgEffortAccuracy: 0,
      avgQualityPassRate: 0,
      avgDuration: 0,
      lastEvent: this.events[this.events.length - 1]
    };

    // Count by status
    this.performances.forEach(perf => {
      stats.byStatus[perf.status] = (stats.byStatus[perf.status] || 0) + 1;
    });

    // Count by type and sender/receiver
    this.events.filter(e => e.eventType === 'created').forEach(event => {
      stats.byType[event.handoffType] = (stats.byType[event.handoffType] || 0) + 1;
      stats.bySender[event.sender] = (stats.bySender[event.sender] || 0) + 1;
      event.receivers.forEach(receiver => {
        stats.byReceiver[receiver] = (stats.byReceiver[receiver] || 0) + 1;
      });
    });

    // Calculate averages
    const perfArray = Array.from(this.performances.values());
    if (perfArray.length > 0) {
      // Average quality score
      const scoresWithData = this.events
        .filter(e => e.validationScore !== undefined)
        .map(e => e.validationScore!);

      if (scoresWithData.length > 0) {
        stats.avgQualityScore = scoresWithData.reduce((sum, score) => sum + score, 0) / scoresWithData.length;
      }

      // Success rate
      const completedCount = stats.byStatus['completed'] || 0;
      stats.successRate = (completedCount / stats.totalContracts) * 100;

      // Average effort accuracy
      const effortAccuracies = perfArray
        .filter(p => p.effortAccuracy !== undefined)
        .map(p => p.effortAccuracy!);

      if (effortAccuracies.length > 0) {
        stats.avgEffortAccuracy = effortAccuracies.reduce((sum, acc) => sum + acc, 0) / effortAccuracies.length;
      }

      // Average quality pass rate
      const qualityRates = perfArray
        .filter(p => p.qualityPassRate !== undefined)
        .map(p => p.qualityPassRate!);

      if (qualityRates.length > 0) {
        stats.avgQualityPassRate = qualityRates.reduce((sum, rate) => sum + rate, 0) / qualityRates.length;
      }

      // Average duration
      const durations = perfArray
        .filter(p => p.duration !== undefined)
        .map(p => p.duration!);

      if (durations.length > 0) {
        stats.avgDuration = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
      }
    }

    return stats;
  }

  /**
   * Get events for a contract
   */
  getContractEvents(contractId: string): ContractEvent[] {
    return this.events.filter(e => e.contractId === contractId);
  }

  /**
   * Get performance for a contract
   */
  getContractPerformance(contractId: string): ContractPerformance | undefined {
    return this.performances.get(contractId);
  }

  /**
   * Get events within time range
   */
  getEventsByTimeRange(since: Date, until: Date): ContractEvent[] {
    return this.events.filter(e => e.timestamp >= since && e.timestamp <= until);
  }

  /**
   * Generate contract report
   */
  async generateReport(): Promise<string> {
    const stats = this.getStatistics();

    const report = `
# Contract Tracking Report

**Generated**: ${new Date().toISOString()}

## Summary Statistics

- **Total Contracts**: ${stats.totalContracts}
- **Success Rate**: ${stats.successRate.toFixed(2)}%
- **Average Quality Score**: ${stats.avgQualityScore.toFixed(1)}/100
- **Average Effort Accuracy**: ${stats.avgEffortAccuracy.toFixed(1)}%
- **Average Quality Pass Rate**: ${stats.avgQualityPassRate.toFixed(1)}%
- **Average Duration**: ${(stats.avgDuration / 1000 / 60).toFixed(1)} minutes

## Contracts by Status

${Object.entries(stats.byStatus)
  .map(([status, count]) => `- **${status}**: ${count}`)
  .join('\n')}

## Contracts by Type

${Object.entries(stats.byType)
  .map(([type, count]) => `- **${type}**: ${count}`)
  .join('\n')}

## Contracts by Sender

${Object.entries(stats.bySender)
  .sort((a, b) => b[1] - a[1])
  .map(([sender, count]) => `- **${sender}**: ${count}`)
  .join('\n')}

## Contracts by Receiver

${Object.entries(stats.byReceiver)
  .sort((a, b) => b[1] - a[1])
  .map(([receiver, count]) => `- **${receiver}**: ${count}`)
  .join('\n')}

## Recent Events (Last 5)

${this.events
  .slice(-5)
  .reverse()
  .map(event => `
### ${event.timestamp.toISOString()} - ${event.eventType}
- Contract: ${event.contractId}
- Sender: ${event.sender}
- Receivers: ${event.receivers.join(', ')}
- Type: ${event.handoffType}
- Priority: ${event.priority}
${event.validationScore ? `- Validation Score: ${event.validationScore}/100` : ''}
`).join('\n')}

---
*Generated by VERSATIL Contract Tracker*
`;

    return report.trim();
  }

  /**
   * Cleanup old data (keep last N days)
   */
  async cleanup(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    this.events = this.events.filter(e => e.timestamp >= cutoffDate);

    // Keep performances for contracts that still have events
    const activeContractIds = new Set(this.events.map(e => e.contractId));
    const performancesToKeep = new Map<string, ContractPerformance>();

    this.performances.forEach((perf, contractId) => {
      if (activeContractIds.has(contractId)) {
        performancesToKeep.set(contractId, perf);
      }
    });

    this.performances = performancesToKeep;

    await Promise.all([
      this.persistEvents(),
      this.persistPerformances()
    ]);
  }

  // Private helper methods

  private async persistEvents(): Promise<void> {
    const filePath = path.join(this.statsDir, 'contract-events.json');
    await fs.writeFile(
      filePath,
      JSON.stringify(this.events, null, 2),
      'utf-8'
    );
  }

  private async persistPerformances(): Promise<void> {
    const filePath = path.join(this.statsDir, 'contract-performances.json');
    const perfArray = Array.from(this.performances.values());
    await fs.writeFile(
      filePath,
      JSON.stringify(perfArray, null, 2),
      'utf-8'
    );
  }

  private calculateEstimatedEffort(contract: AgentHandoffContract): number | undefined {
    const total = contract.workItems.reduce((sum, item) => {
      return sum + (item.estimatedEffort || 0);
    }, 0);

    return total > 0 ? total : undefined;
  }

  private statusToEventType(status: HandoffStatus): ContractEvent['eventType'] {
    switch (status) {
      case 'pending': return 'created';
      case 'in_transit': return 'sent';
      case 'accepted': return 'accepted';
      case 'rejected': return 'rejected';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'cancelled': return 'cancelled';
      default: return 'created';
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private dateReviver(key: string, value: any): any {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  }
}

/**
 * Global singleton instance
 */
let globalTracker: ContractTracker | null = null;

export function getGlobalContractTracker(): ContractTracker {
  if (!globalTracker) {
    globalTracker = new ContractTracker();
    globalTracker.initialize().catch(console.error);
  }
  return globalTracker;
}
