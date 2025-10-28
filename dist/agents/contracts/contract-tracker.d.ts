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
import { AgentHandoffContract, HandoffType, HandoffStatus, HandoffPriority } from './agent-handoff-contract.js';
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
    effortAccuracy?: number;
    qualityGatesPassed?: number;
    qualityGatesTotal?: number;
    qualityPassRate?: number;
    duration?: number;
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
export declare class ContractTracker {
    private statsDir;
    private events;
    private performances;
    constructor(baseDir?: string);
    /**
     * Initialize tracker (load existing data)
     */
    initialize(): Promise<void>;
    /**
     * Track contract creation
     */
    trackContractCreated(contract: AgentHandoffContract, validationResult?: ValidationResult): Promise<void>;
    /**
     * Track contract status change
     */
    trackStatusChange(contractId: string, newStatus: HandoffStatus, contract?: AgentHandoffContract): Promise<void>;
    /**
     * Track contract validation
     */
    trackValidation(contractId: string, validationResult: ValidationResult): Promise<void>;
    /**
     * Get contract statistics
     */
    getStatistics(): ContractStatistics;
    /**
     * Get events for a contract
     */
    getContractEvents(contractId: string): ContractEvent[];
    /**
     * Get performance for a contract
     */
    getContractPerformance(contractId: string): ContractPerformance | undefined;
    /**
     * Get events within time range
     */
    getEventsByTimeRange(since: Date, until: Date): ContractEvent[];
    /**
     * Generate contract report
     */
    generateReport(): Promise<string>;
    /**
     * Cleanup old data (keep last N days)
     */
    cleanup(daysToKeep?: number): Promise<void>;
    private persistEvents;
    private persistPerformances;
    private calculateEstimatedEffort;
    private statusToEventType;
    private fileExists;
    private dateReviver;
}
export declare function getGlobalContractTracker(): ContractTracker;
