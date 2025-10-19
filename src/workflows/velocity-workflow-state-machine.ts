/**
 * @fileoverview VELOCITY Workflow State Machine - State management for 5-phase workflow
 *
 * Manages workflow state transitions through:
 * - Planning → Assessing → Delegating → Working → Codifying → Completed
 *
 * Includes:
 * - State definitions and transitions
 * - State persistence to filesystem
 * - Resume workflow from saved state
 * - Transition guards and validation
 *
 * @module workflows/velocity-workflow-state-machine
 * @version 6.5.0
 */

import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Workflow phases (matches VELOCITY methodology)
 */
export type WorkflowPhase =
  | 'Plan'
  | 'Assess'
  | 'Delegate'
  | 'Work'
  | 'Codify'
  | 'Completed';

/**
 * Workflow state status
 */
export type WorkflowStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'rolled_back';

/**
 * Complete workflow state
 */
export interface WorkflowState {
  /** Workflow identifier */
  id: string;

  /** Current phase */
  currentPhase: WorkflowPhase;

  /** Previous phase (for rollback) */
  previousPhase?: WorkflowPhase;

  /** Workflow status */
  status: WorkflowStatus;

  /** Phase history (for tracking progression) */
  phaseHistory: PhaseTransitionRecord[];

  /** Workflow configuration */
  config: WorkflowConfig;

  /** State metadata */
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    pausedAt?: Date;
  };

  /** Error information (if failed) */
  error?: {
    phase: WorkflowPhase;
    message: string;
    stack?: string;
    timestamp: Date;
  };
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  target: string;
  autoTransition: boolean;
  requireApprovalPerPhase: boolean;
  continuousMonitoring: boolean;
  qualityGateLevel: 'strict' | 'normal' | 'relaxed';
  maxExecutionHours: number;
  codifyToRAG: boolean;
}

/**
 * Phase transition record (audit trail)
 */
export interface PhaseTransitionRecord {
  from: WorkflowPhase | 'initial';
  to: WorkflowPhase;
  timestamp: Date;
  duration?: number; // milliseconds
  success: boolean;
  reason?: string;
}

/**
 * State transition event
 */
export interface StateTransitionEvent {
  workflowId: string;
  from: WorkflowPhase;
  to: WorkflowPhase;
  timestamp: Date;
}

// ============================================================================
// STATE MACHINE IMPLEMENTATION
// ============================================================================

export class VelocityWorkflowStateMachine extends EventEmitter {
  private logger: VERSATILLogger;
  private states: Map<string, WorkflowState>;
  private stateStoragePath: string;

  // Valid phase transitions (directed graph)
  private readonly VALID_TRANSITIONS: Map<WorkflowPhase | 'initial', WorkflowPhase[]> = new Map([
    ['initial', ['Plan']],
    ['Plan', ['Assess', 'Plan']], // Can re-plan
    ['Assess', ['Delegate', 'Plan']], // Can rollback to plan
    ['Delegate', ['Work', 'Assess']], // Can rollback to assess
    ['Work', ['Codify', 'Delegate']], // Can rollback to delegate
    ['Codify', ['Completed']],
    ['Completed', []], // Terminal state
  ]);

  constructor() {
    super();
    this.logger = new VERSATILLogger('VelocityWorkflowStateMachine');
    this.states = new Map();

    // State storage in ~/.versatil/workflows/
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
    this.stateStoragePath = path.join(homeDir, '.versatil', 'workflows', 'states');

    this.ensureStateStorage();
  }

  // ========================================================================
  // WORKFLOW LIFECYCLE
  // ========================================================================

  /**
   * Create a new workflow
   */
  async createWorkflow(id: string, config: WorkflowConfig): Promise<WorkflowState> {
    this.logger.info('Creating workflow', { id, target: config.target });

    const state: WorkflowState = {
      id,
      currentPhase: 'Plan',
      status: 'idle',
      phaseHistory: [],
      config,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    this.states.set(id, state);
    await this.persistState(state);

    this.emit('workflowCreated', { id, timestamp: new Date() });

    return state;
  }

  /**
   * Transition workflow to a new phase
   */
  async transition(workflowId: string, toPhase: WorkflowPhase): Promise<void> {
    const state = this.states.get(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const fromPhase = state.currentPhase;

    // Validate transition
    if (!this.isValidTransition(fromPhase, toPhase)) {
      throw new Error(
        `Invalid transition: ${fromPhase} → ${toPhase}. Valid transitions: ${this.getValidTransitions(fromPhase).join(', ')}`
      );
    }

    this.logger.info('Transitioning workflow', { workflowId, from: fromPhase, to: toPhase });

    // Record transition
    const transitionRecord: PhaseTransitionRecord = {
      from: fromPhase,
      to: toPhase,
      timestamp: new Date(),
      success: true,
    };

    state.phaseHistory.push(transitionRecord);
    state.previousPhase = fromPhase;
    state.currentPhase = toPhase;
    state.status = toPhase === 'Completed' ? 'completed' : 'running';
    state.metadata.updatedAt = new Date();

    if (!state.metadata.startedAt && toPhase !== 'Plan') {
      state.metadata.startedAt = new Date();
    }

    if (toPhase === 'Completed') {
      state.metadata.completedAt = new Date();
    }

    await this.persistState(state);

    this.emit('transitioned', {
      workflowId,
      from: fromPhase,
      to: toPhase,
      timestamp: new Date(),
    } as StateTransitionEvent);
  }

  /**
   * Pause workflow
   */
  async pause(workflowId: string): Promise<void> {
    const state = this.states.get(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    state.status = 'paused';
    state.metadata.pausedAt = new Date();
    state.metadata.updatedAt = new Date();

    await this.persistState(state);

    this.emit('paused', { workflowId, timestamp: new Date() });
  }

  /**
   * Resume workflow
   */
  async resume(workflowId: string): Promise<void> {
    const state = this.states.get(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (state.status !== 'paused') {
      throw new Error(`Cannot resume workflow in status: ${state.status}`);
    }

    state.status = 'running';
    state.metadata.pausedAt = undefined;
    state.metadata.updatedAt = new Date();

    await this.persistState(state);

    this.emit('resumed', { workflowId, timestamp: new Date() });
  }

  /**
   * Mark workflow as failed
   */
  async fail(workflowId: string, error: { message: string; stack?: string }): Promise<void> {
    const state = this.states.get(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    state.status = 'failed';
    state.error = {
      phase: state.currentPhase,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
    };
    state.metadata.updatedAt = new Date();

    await this.persistState(state);

    this.emit('failed', { workflowId, error, timestamp: new Date() });
  }

  /**
   * Rollback to previous phase
   */
  async rollback(workflowId: string, reason: string): Promise<void> {
    const state = this.states.get(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!state.previousPhase) {
      throw new Error('No previous phase to rollback to');
    }

    this.logger.warn('Rolling back workflow', {
      workflowId,
      from: state.currentPhase,
      to: state.previousPhase,
      reason,
    });

    const fromPhase = state.currentPhase;
    const toPhase = state.previousPhase;

    // Validate rollback is allowed
    if (!this.isValidTransition(fromPhase, toPhase)) {
      throw new Error(`Invalid rollback: ${fromPhase} → ${toPhase}`);
    }

    // Record rollback transition
    const transitionRecord: PhaseTransitionRecord = {
      from: fromPhase,
      to: toPhase,
      timestamp: new Date(),
      success: false,
      reason,
    };

    state.phaseHistory.push(transitionRecord);
    state.currentPhase = toPhase;
    state.status = 'rolled_back';
    state.metadata.updatedAt = new Date();

    await this.persistState(state);

    this.emit('rolledBack', {
      workflowId,
      from: fromPhase,
      to: toPhase,
      reason,
      timestamp: new Date(),
    });
  }

  // ========================================================================
  // STATE QUERIES
  // ========================================================================

  /**
   * Get workflow state
   */
  async getState(workflowId: string): Promise<WorkflowState | null> {
    let state = this.states.get(workflowId);

    // Try loading from disk if not in memory
    if (!state) {
      state = await this.loadState(workflowId);
    }

    return state || null;
  }

  /**
   * Get all workflow states
   */
  getAllStates(): WorkflowState[] {
    return Array.from(this.states.values());
  }

  /**
   * Get workflows by status
   */
  getWorkflowsByStatus(status: WorkflowStatus): WorkflowState[] {
    return this.getAllStates().filter(state => state.status === status);
  }

  /**
   * Get workflows by phase
   */
  getWorkflowsByPhase(phase: WorkflowPhase): WorkflowState[] {
    return this.getAllStates().filter(state => state.currentPhase === phase);
  }

  // ========================================================================
  // TRANSITION VALIDATION
  // ========================================================================

  /**
   * Check if transition is valid
   */
  private isValidTransition(from: WorkflowPhase, to: WorkflowPhase): boolean {
    const validTransitions = this.VALID_TRANSITIONS.get(from) || [];
    return validTransitions.includes(to);
  }

  /**
   * Get valid transitions from a phase
   */
  private getValidTransitions(from: WorkflowPhase): WorkflowPhase[] {
    return this.VALID_TRANSITIONS.get(from) || [];
  }

  // ========================================================================
  // STATE PERSISTENCE
  // ========================================================================

  /**
   * Ensure state storage directory exists
   */
  private async ensureStateStorage(): Promise<void> {
    try {
      await fs.mkdir(this.stateStoragePath, { recursive: true });
    } catch (error: any) {
      this.logger.error('Failed to create state storage', { error: error.message });
    }
  }

  /**
   * Persist state to disk
   */
  private async persistState(state: WorkflowState): Promise<void> {
    const filePath = path.join(this.stateStoragePath, `${state.id}.json`);

    try {
      // Convert dates to ISO strings for JSON serialization
      const serializable = {
        ...state,
        metadata: {
          ...state.metadata,
          createdAt: state.metadata.createdAt.toISOString(),
          updatedAt: state.metadata.updatedAt.toISOString(),
          startedAt: state.metadata.startedAt?.toISOString(),
          completedAt: state.metadata.completedAt?.toISOString(),
          pausedAt: state.metadata.pausedAt?.toISOString(),
        },
        phaseHistory: state.phaseHistory.map(record => ({
          ...record,
          timestamp: record.timestamp.toISOString(),
        })),
        error: state.error ? {
          ...state.error,
          timestamp: state.error.timestamp.toISOString(),
        } : undefined,
      };

      await fs.writeFile(filePath, JSON.stringify(serializable, null, 2), 'utf-8');

      this.logger.debug('State persisted', { workflowId: state.id, filePath });

    } catch (error: any) {
      this.logger.error('Failed to persist state', {
        workflowId: state.id,
        error: error.message,
      });
    }
  }

  /**
   * Load state from disk
   */
  private async loadState(workflowId: string): Promise<WorkflowState | null> {
    const filePath = path.join(this.stateStoragePath, `${workflowId}.json`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      // Convert ISO strings back to dates
      const state: WorkflowState = {
        ...parsed,
        metadata: {
          ...parsed.metadata,
          createdAt: new Date(parsed.metadata.createdAt),
          updatedAt: new Date(parsed.metadata.updatedAt),
          startedAt: parsed.metadata.startedAt ? new Date(parsed.metadata.startedAt) : undefined,
          completedAt: parsed.metadata.completedAt ? new Date(parsed.metadata.completedAt) : undefined,
          pausedAt: parsed.metadata.pausedAt ? new Date(parsed.metadata.pausedAt) : undefined,
        },
        phaseHistory: parsed.phaseHistory.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
        })),
        error: parsed.error ? {
          ...parsed.error,
          timestamp: new Date(parsed.error.timestamp),
        } : undefined,
      };

      this.states.set(workflowId, state);

      this.logger.debug('State loaded from disk', { workflowId });

      return state;

    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logger.error('Failed to load state', {
          workflowId,
          error: error.message,
        });
      }
      return null;
    }
  }

  /**
   * Delete state (cleanup completed workflows)
   */
  async deleteState(workflowId: string): Promise<void> {
    const filePath = path.join(this.stateStoragePath, `${workflowId}.json`);

    try {
      await fs.unlink(filePath);
      this.states.delete(workflowId);

      this.logger.debug('State deleted', { workflowId });

    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logger.error('Failed to delete state', {
          workflowId,
          error: error.message,
        });
      }
    }
  }

  /**
   * List all saved workflow IDs
   */
  async listSavedWorkflows(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.stateStoragePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error: any) {
      this.logger.error('Failed to list saved workflows', { error: error.message });
      return [];
    }
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  /**
   * Clean up old completed workflows (older than N days)
   */
  async cleanupOldWorkflows(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleaned = 0;

    const entries = Array.from(this.states.entries());

    for (const [id, state] of entries) {
      if (
        state.status === 'completed' &&
        state.metadata.completedAt &&
        state.metadata.completedAt < cutoffDate
      ) {
        await this.deleteState(id);
        cleaned++;
      }
    }

    this.logger.info('Cleaned up old workflows', { count: cleaned, olderThanDays });

    return cleaned;
  }
}

export default VelocityWorkflowStateMachine;
