/**
 * Agent Activation Tracker
 *
 * Tracks all agent activation events with timestamps, accuracy metrics,
 * and latency measurements. Stores metrics for validation and reporting.
 *
 * @module activation-tracker
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

export interface ActivationEvent {
  eventId: string;
  timestamp: Date;
  agentId: string;
  trigger: {
    type: 'file_pattern' | 'code_content' | 'keyword' | 'context' | 'manual';
    pattern?: string;
    filePath?: string;
    content?: string;
  };
  latency: number; // Time from trigger to activation (ms)
  accuracy: 'correct' | 'incorrect' | 'false_positive' | 'false_negative';
  expectedAgent?: string; // For validation
  confidence: number; // 0-100
  context?: any;
}

export interface ActivationMetrics {
  agentId: string;
  totalActivations: number;
  correctActivations: number;
  incorrectActivations: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number; // Percentage
  averageLatency: number; // ms
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  lastActivation: Date | null;
}

export interface ValidationReport {
  timestamp: Date;
  overallAccuracy: number;
  overallLatency: number;
  totalActivations: number;
  agentMetrics: Map<string, ActivationMetrics>;
  failedAgents: string[]; // Agents with <90% accuracy
  slowAgents: string[]; // Agents with >2000ms latency
  summary: string;
}

export class ActivationTracker extends EventEmitter {
  private events: ActivationEvent[] = [];
  private metricsCache: Map<string, ActivationMetrics> = new Map();
  private storageDir: string;
  private maxEvents: number = 10000; // Keep last 10k events
  private autosaveInterval: NodeJS.Timeout | null = null;

  constructor(storageDir?: string) {
    super();
    this.storageDir = storageDir || join(homedir(), '.versatil', 'metrics', 'activation');
    this.initialize();
  }

  /**
   * Initialize storage directory and load existing events
   */
  private async initialize(): Promise<void> {
    try {
      if (!existsSync(this.storageDir)) {
        await mkdir(this.storageDir, { recursive: true });
      }

      // Load existing events
      await this.loadEvents();

      // Setup autosave every 5 minutes
      this.autosaveInterval = setInterval(() => {
        this.saveEvents();
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error(`Failed to initialize ActivationTracker: ${error.message}`);
    }
  }

  /**
   * Track an activation event
   */
  trackActivation(event: Omit<ActivationEvent, 'eventId' | 'timestamp'>): void {
    const fullEvent: ActivationEvent = {
      eventId: `activation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    this.events.push(fullEvent);

    // Trim to max events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Invalidate cache
    this.metricsCache.delete(event.agentId);

    // Emit event
    this.emit('activation:tracked', fullEvent);

    // Save asynchronously
    this.saveEvents().catch((err) => {
      console.error(`Failed to save activation events: ${err.message}`);
    });
  }

  /**
   * Get metrics for a specific agent
   */
  getAgentMetrics(agentId: string): ActivationMetrics {
    // Check cache first
    if (this.metricsCache.has(agentId)) {
      return this.metricsCache.get(agentId)!;
    }

    const agentEvents = this.events.filter(e => e.agentId === agentId);

    if (agentEvents.length === 0) {
      return {
        agentId,
        totalActivations: 0,
        correctActivations: 0,
        incorrectActivations: 0,
        falsePositives: 0,
        falseNegatives: 0,
        accuracy: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        p95Latency: 0,
        lastActivation: null
      };
    }

    const correct = agentEvents.filter(e => e.accuracy === 'correct').length;
    const incorrect = agentEvents.filter(e => e.accuracy === 'incorrect').length;
    const falsePositives = agentEvents.filter(e => e.accuracy === 'false_positive').length;
    const falseNegatives = agentEvents.filter(e => e.accuracy === 'false_negative').length;

    const latencies = agentEvents.map(e => e.latency).sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);

    const metrics: ActivationMetrics = {
      agentId,
      totalActivations: agentEvents.length,
      correctActivations: correct,
      incorrectActivations: incorrect,
      falsePositives,
      falseNegatives,
      accuracy: agentEvents.length > 0 ? (correct / agentEvents.length) * 100 : 0,
      averageLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
      minLatency: latencies[0] || 0,
      maxLatency: latencies[latencies.length - 1] || 0,
      p95Latency: latencies[p95Index] || 0,
      lastActivation: agentEvents[agentEvents.length - 1]?.timestamp || null
    };

    // Cache result
    this.metricsCache.set(agentId, metrics);

    return metrics;
  }

  /**
   * Get all agent metrics
   */
  getAllMetrics(): Map<string, ActivationMetrics> {
    const agentIds = new Set(this.events.map(e => e.agentId));
    const metricsMap = new Map<string, ActivationMetrics>();

    for (const agentId of agentIds) {
      metricsMap.set(agentId, this.getAgentMetrics(agentId));
    }

    return metricsMap;
  }

  /**
   * Generate validation report
   */
  generateReport(): ValidationReport {
    const allMetrics = this.getAllMetrics();
    const agentMetrics = Array.from(allMetrics.values());

    const overallAccuracy = agentMetrics.length > 0
      ? agentMetrics.reduce((sum, m) => sum + m.accuracy, 0) / agentMetrics.length
      : 0;

    const overallLatency = agentMetrics.length > 0
      ? agentMetrics.reduce((sum, m) => sum + m.averageLatency, 0) / agentMetrics.length
      : 0;

    const totalActivations = agentMetrics.reduce((sum, m) => sum + m.totalActivations, 0);

    const failedAgents = agentMetrics
      .filter(m => m.accuracy < 90)
      .map(m => m.agentId);

    const slowAgents = agentMetrics
      .filter(m => m.averageLatency > 2000)
      .map(m => m.agentId);

    const summary = this.generateSummary(overallAccuracy, overallLatency, failedAgents, slowAgents);

    return {
      timestamp: new Date(),
      overallAccuracy,
      overallLatency,
      totalActivations,
      agentMetrics: allMetrics,
      failedAgents,
      slowAgents,
      summary
    };
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    accuracy: number,
    latency: number,
    failedAgents: string[],
    slowAgents: string[]
  ): string {
    const parts: string[] = [];

    // Accuracy assessment
    if (accuracy >= 95) {
      parts.push('✅ Excellent activation accuracy');
    } else if (accuracy >= 90) {
      parts.push('✅ Good activation accuracy');
    } else if (accuracy >= 80) {
      parts.push('⚠️  Acceptable activation accuracy (improvement recommended)');
    } else {
      parts.push('❌ Poor activation accuracy (immediate attention required)');
    }

    // Latency assessment
    if (latency < 1000) {
      parts.push('✅ Excellent activation latency');
    } else if (latency < 2000) {
      parts.push('✅ Good activation latency');
    } else {
      parts.push('⚠️  High activation latency (optimization recommended)');
    }

    // Failed agents
    if (failedAgents.length > 0) {
      parts.push(`❌ ${failedAgents.length} agents with <90% accuracy: ${failedAgents.join(', ')}`);
    }

    // Slow agents
    if (slowAgents.length > 0) {
      parts.push(`⚠️  ${slowAgents.length} agents with >2s latency: ${slowAgents.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Get recent events (last N)
   */
  getRecentEvents(limit: number = 100): ActivationEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by agent
   */
  getEventsByAgent(agentId: string, limit?: number): ActivationEvent[] {
    const filtered = this.events.filter(e => e.agentId === agentId);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get events by time range
   */
  getEventsByTimeRange(start: Date, end: Date): ActivationEvent[] {
    return this.events.filter(e => e.timestamp >= start && e.timestamp <= end);
  }

  /**
   * Clear all events and cache
   */
  clear(): void {
    this.events = [];
    this.metricsCache.clear();
    this.emit('tracker:cleared');
  }

  /**
   * Save events to disk
   */
  private async saveEvents(): Promise<void> {
    try {
      const filePath = join(this.storageDir, 'activation-events.json');
      await writeFile(filePath, JSON.stringify(this.events, null, 2));
    } catch (error: any) {
      console.error(`Failed to save activation events: ${error.message}`);
    }
  }

  /**
   * Load events from disk
   */
  private async loadEvents(): Promise<void> {
    try {
      const filePath = join(this.storageDir, 'activation-events.json');

      if (existsSync(filePath)) {
        const content = await readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);

        // Convert timestamp strings to Date objects
        this.events = parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));

        console.log(`Loaded ${this.events.length} activation events from storage`);
      }
    } catch (error: any) {
      console.error(`Failed to load activation events: ${error.message}`);
    }
  }

  /**
   * Cleanup and save before shutdown
   */
  async shutdown(): Promise<void> {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }

    await this.saveEvents();
    this.removeAllListeners();
  }

  /**
   * Export events as CSV
   */
  exportCSV(): string {
    const headers = [
      'Event ID',
      'Timestamp',
      'Agent ID',
      'Trigger Type',
      'File Path',
      'Latency (ms)',
      'Accuracy',
      'Confidence'
    ];

    const rows = this.events.map(e => [
      e.eventId,
      e.timestamp.toISOString(),
      e.agentId,
      e.trigger.type,
      e.trigger.filePath || '',
      e.latency.toString(),
      e.accuracy,
      e.confidence.toString()
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Export report as JSON
   */
  exportReportJSON(): string {
    const report = this.generateReport();

    // Convert Map to object for JSON serialization
    const metricsObj: Record<string, ActivationMetrics> = {};
    report.agentMetrics.forEach((value, key) => {
      metricsObj[key] = value;
    });

    return JSON.stringify(
      {
        ...report,
        agentMetrics: metricsObj
      },
      null,
      2
    );
  }
}

// Singleton instance
let globalTracker: ActivationTracker | null = null;

/**
 * Get global activation tracker instance
 */
export function getActivationTracker(): ActivationTracker {
  if (!globalTracker) {
    globalTracker = new ActivationTracker();
  }
  return globalTracker;
}

/**
 * Reset global tracker (for testing)
 */
export function resetActivationTracker(): void {
  if (globalTracker) {
    globalTracker.shutdown();
    globalTracker = null;
  }
}
