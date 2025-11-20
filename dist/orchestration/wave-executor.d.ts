/**
 * VERSATIL SDLC Framework - Wave Executor
 * Implements wave-based parallel execution for optimal task orchestration
 *
 * Features:
 * - Execute tasks in waves (Wave 1 → Wave 2 → Wave 3)
 * - Parallel execution within waves (40%+ time savings)
 * - Coordination checkpoints between waves
 * - Progress tracking with TodoWrite integration
 * - Error handling and retry logic
 *
 * @module orchestration/wave-executor
 * @version 1.0.0
 */
import { EventEmitter } from 'events';
import { TaskExecution } from './parallel-task-manager.js';
/**
 * Wave definition from plan.md execution_waves
 */
export interface Wave {
    /** Wave number (1, 2, 3, etc.) */
    wave_number: number;
    /** Wave name/description */
    wave_name: string;
    /** Task IDs in this wave */
    tasks: string[];
    /** Agent IDs involved in this wave */
    agents: string[];
    /** Estimated duration (minutes) */
    wave_duration_estimate: number;
    /** Whether tasks can run in parallel */
    parallel_execution: boolean;
    /** Dependencies on other waves */
    dependencies: number[];
    /** Optional coordination checkpoint */
    coordination_checkpoint?: CoordinationCheckpoint;
}
/**
 * Coordination checkpoint configuration
 */
export interface CoordinationCheckpoint {
    /** Checkpoint name */
    checkpoint_name: string;
    /** Location (e.g., "After Wave 1") */
    location: string;
    /** Whether checkpoint blocks next wave on failure */
    blocking: boolean;
    /** Quality gates to validate */
    quality_gates: string[];
    /** Validation steps to run */
    validation_steps: string[];
    /** Optional agent handoff validation */
    handoff_agents?: Array<{
        from: string;
        to: string;
        context: string;
    }>;
}
/**
 * Wave execution result
 */
export interface WaveExecutionResult {
    /** Wave number */
    wave_number: number;
    /** Execution status */
    status: 'completed' | 'failed' | 'blocked';
    /** Start time */
    start_time: Date;
    /** End time */
    end_time?: Date;
    /** Actual duration (ms) */
    actual_duration?: number;
    /** Task execution results */
    task_results: Map<string, TaskExecution>;
    /** Checkpoint result (if checkpoint exists) */
    checkpoint_result?: CheckpointResult;
    /** Error message (if failed) */
    error?: string;
    /** Time savings vs sequential (ms) */
    time_savings?: number;
}
/**
 * Checkpoint validation result
 */
export interface CheckpointResult {
    /** Checkpoint name */
    name: string;
    /** Whether checkpoint passed */
    passed: boolean;
    /** Blocking status */
    blocking: boolean;
    /** Detailed results for each quality gate */
    quality_gate_results: Array<{
        gate: string;
        passed: boolean;
        message: string;
    }>;
    /** Warnings (non-blocking issues) */
    warnings: string[];
    /** Errors (blocking issues) */
    errors: string[];
}
/**
 * Complete wave plan execution result
 */
export interface WavePlanExecutionResult {
    /** All wave results */
    wave_results: WaveExecutionResult[];
    /** Total sequential time (ms) */
    sequential_time: number;
    /** Total parallel time (ms) */
    parallel_time: number;
    /** Total time savings (ms) */
    total_time_savings: number;
    /** Percentage faster */
    percentage_faster: number;
    /** Overall status */
    overall_status: 'completed' | 'failed' | 'blocked';
    /** Number of waves completed */
    waves_completed: number;
    /** Number of waves failed/blocked */
    waves_failed: number;
}
export declare class WaveExecutor extends EventEmitter {
    private parallelTaskManager;
    private collisionDetector;
    private checkpointValidator;
    private logger;
    private currentWave;
    private waveResults;
    constructor();
    /**
     * Execute a complete wave-based plan
     */
    executePlan(waves: Wave[]): Promise<WavePlanExecutionResult>;
    /**
     * Execute a single wave
     */
    executeWave(wave: Wave): Promise<WaveExecutionResult>;
    /**
     * Run a coordination checkpoint
     */
    private runCheckpoint;
    /**
     * Convert wave tasks to Task objects for ParallelTaskManager
     */
    private convertWaveTasksToTasks;
    /**
     * Display wave header
     */
    private displayWaveHeader;
    /**
     * Calculate sequential execution time (sum of all wave durations)
     */
    private calculateSequentialTime;
    /**
     * Calculate estimated parallel execution time
     */
    private calculateEstimatedParallelTime;
    /**
     * Calculate time savings for a wave
     */
    private calculateWaveTimeSavings;
    /**
     * Get current wave number
     */
    getCurrentWave(): number | null;
    /**
     * Get wave execution result
     */
    getWaveResult(waveNumber: number): WaveExecutionResult | undefined;
    /**
     * Get all wave results
     */
    getAllWaveResults(): Map<number, WaveExecutionResult>;
}
export default WaveExecutor;
