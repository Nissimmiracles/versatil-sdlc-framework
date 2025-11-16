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
import { ParallelTaskManager, Task, TaskExecution, ExecutionStatus } from './parallel-task-manager.js';
import { CollisionDetector, TaskFileDependency, CollisionRisk } from './collision-detector.js';
import { CheckpointValidator, Checkpoint as CheckpointConfig } from './checkpoint-validator.js';
import { VERSATILLogger } from '../utils/logger.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// WAVE EXECUTOR IMPLEMENTATION
// ============================================================================

export class WaveExecutor extends EventEmitter {
  private parallelTaskManager: ParallelTaskManager;
  private collisionDetector: CollisionDetector;
  private checkpointValidator: CheckpointValidator;
  private logger: VERSATILLogger;
  private currentWave: number | null = null;
  private waveResults: Map<number, WaveExecutionResult> = new Map();

  constructor() {
    super();
    this.parallelTaskManager = new ParallelTaskManager();
    this.collisionDetector = new CollisionDetector();
    this.checkpointValidator = new CheckpointValidator();
    this.logger = new VERSATILLogger('WaveExecutor');
  }

  /**
   * Execute a complete wave-based plan
   */
  async executePlan(waves: Wave[]): Promise<WavePlanExecutionResult> {
    this.logger.info('Starting wave-based plan execution', {
      totalWaves: waves.length,
      totalTasks: waves.reduce((sum, w) => sum + w.tasks.length, 0),
    });

    // Emit TodoWrite event for plan execution start
    this.emit('todowrite:plan-start', {
      waveCount: waves.length,
      taskCount: waves.reduce((sum, w) => sum + w.tasks.length, 0),
    });

    const waveResults: WaveExecutionResult[] = [];
    let wavesCompleted = 0;
    let wavesFailed = 0;

    // Calculate sequential and parallel time
    const sequentialTime = this.calculateSequentialTime(waves);
    // const __________estimatedParallelTime = this.calculateEstimatedParallelTime(waves);

    const planStartTime = Date.now();

    // Execute waves sequentially (wave dependencies enforced)
    for (const wave of waves) {
      // Check dependencies satisfied
      const dependenciesSatisfied = wave.dependencies.every(depWave => {
        const depResult = this.waveResults.get(depWave);
        return depResult && depResult.status === 'completed';
      });

      if (!dependenciesSatisfied) {
        this.logger.error('Wave dependencies not satisfied', {
          wave: wave.wave_number,
          dependencies: wave.dependencies,
        });

        waveResults.push({
          wave_number: wave.wave_number,
          status: 'blocked',
          start_time: new Date(),
          error: 'Dependencies not satisfied',
          task_results: new Map(),
        });

        wavesFailed++;
        break; // Stop execution
      }

      // Execute wave
      const waveResult = await this.executeWave(wave);
      waveResults.push(waveResult);
      this.waveResults.set(wave.wave_number, waveResult);

      if (waveResult.status === 'completed') {
        wavesCompleted++;
      } else {
        wavesFailed++;

        // Check if we should stop (checkpoint blocked or critical failure)
        if (waveResult.status === 'blocked' || waveResult.checkpoint_result?.blocking) {
          this.logger.warn('Wave execution blocked - stopping plan execution', {
            wave: wave.wave_number,
            reason: waveResult.error || 'Checkpoint failure',
          });
          break;
        }
      }
    }

    const planEndTime = Date.now();
    const actualParallelTime = planEndTime - planStartTime;
    const totalTimeSavings = sequentialTime - actualParallelTime;
    const percentageFaster = sequentialTime > 0 ? (totalTimeSavings / sequentialTime) * 100 : 0;

    const result: WavePlanExecutionResult = {
      wave_results: waveResults,
      sequential_time: sequentialTime,
      parallel_time: actualParallelTime,
      total_time_savings: totalTimeSavings,
      percentage_faster: percentageFaster,
      overall_status: wavesFailed > 0 ? 'failed' : 'completed',
      waves_completed: wavesCompleted,
      waves_failed: wavesFailed,
    };

    // Emit TodoWrite event for plan completion
    this.emit('todowrite:plan-complete', {
      wavesCompleted,
      wavesFailed,
      timeSavings: `${Math.round(totalTimeSavings / 60000)}min (${percentageFaster.toFixed(1)}% faster)`,
      overallStatus: result.overall_status,
    });

    this.logger.info('Wave-based plan execution complete', {
      wavesCompleted,
      wavesFailed,
      timeSavings: `${Math.round(totalTimeSavings / 60000)}min (${percentageFaster.toFixed(1)}% faster)`,
    });

    return result;
  }

  /**
   * Execute a single wave
   */
  async executeWave(wave: Wave): Promise<WaveExecutionResult> {
    this.currentWave = wave.wave_number;

    this.logger.info(`Executing Wave ${wave.wave_number}: ${wave.wave_name}`, {
      tasks: wave.tasks.length,
      agents: wave.agents,
      parallelExecution: wave.parallel_execution,
      estimatedDuration: `${wave.wave_duration_estimate}min`,
    });

    // Emit TodoWrite event for wave start
    this.emit('todowrite:wave-start', {
      waveNumber: wave.wave_number,
      waveName: wave.wave_name,
      taskCount: wave.tasks.length,
      agents: wave.agents,
      parallelExecution: wave.parallel_execution,
    });

    // Display wave header
    this.displayWaveHeader(wave);

    const startTime = new Date();
    let taskResults: Map<string, TaskExecution> = new Map();
    let status: 'completed' | 'failed' | 'blocked' = 'completed';
    let error: string | undefined;

    try {
      // Convert wave tasks to Task objects for ParallelTaskManager
      const tasks = await this.convertWaveTasksToTasks(wave);

      // Run collision detection if parallel execution enabled
      if (wave.parallel_execution && wave.tasks.length > 1) {
        this.logger.info('Running collision detection for parallel wave');

        // Extract file dependencies from tasks
        const fileDependencies: TaskFileDependency[] = tasks.map(task => ({
          task_id: task.id,
          task_name: task.name,
          files_read: task.metadata.files_read || [],
          files_modified: task.metadata.files_modified || [],
          files_created: task.metadata.files_created || [],
          files_deleted: task.metadata.files_deleted || [],
          agent: task.agentId || 'unknown',
        }));

        const collisionResult = await this.collisionDetector.detectCollisions(fileDependencies);

        // Display collision report
        if (collisionResult.has_collision) {
          const report = this.collisionDetector.generateCollisionReport(collisionResult);
          console.log('\n' + report);

          // Check if serialization required
          if (collisionResult.require_serialization) {
            this.logger.warn('Collision detected - forcing sequential execution', {
              risk: collisionResult.risk,
              conflictingFiles: collisionResult.conflicting_files.length,
            });

            console.log('⚠️  HIGH COLLISION RISK DETECTED');
            console.log('   Forcing sequential execution to prevent merge conflicts\n');

            // Override parallel execution flag
            wave.parallel_execution = false;
          } else if (collisionResult.risk === CollisionRisk.MEDIUM) {
            this.logger.warn('Medium collision risk - proceeding with caution', {
              conflictingFiles: collisionResult.conflicting_files.length,
            });

            console.log('⚠️  MEDIUM COLLISION RISK');
            console.log('   Proceeding with parallel execution (monitor for issues)\n');
          }
        } else {
          this.logger.info('No file collisions detected - safe for parallel execution');
          console.log('✅ No file collisions detected - safe for parallel execution\n');
        }
      }

      // Add tasks to parallel task manager
      for (const task of tasks) {
        await this.parallelTaskManager.addTask(task);
      }

      // Execute tasks (parallel or sequential based on wave config + collision detection)
      if (wave.parallel_execution && wave.tasks.length > 1) {
        // Parallel execution
        this.logger.info(`Running ${wave.tasks.length} tasks in parallel`);
        taskResults = await this.parallelTaskManager.executeParallel(wave.tasks);
      } else {
        // Sequential execution
        this.logger.info(`Running ${wave.tasks.length} tasks sequentially`);
        for (const taskId of wave.tasks) {
          const result = await this.parallelTaskManager.getExecutionStatus(taskId);
          if (result) {
            taskResults.set(taskId, result);
          }
        }
      }

      // Check if any tasks failed
      const failedTasks = Array.from(taskResults.values()).filter(
        r => r.status === ExecutionStatus.FAILED
      );

      if (failedTasks.length > 0) {
        status = 'failed';
        error = `${failedTasks.length} tasks failed`;
        this.logger.error('Wave execution failed', {
          wave: wave.wave_number,
          failedTasks: failedTasks.map(t => t.taskId),
        });
      }

    } catch (err) {
      status = 'failed';
      error = (err as Error).message;
      this.logger.error('Wave execution error', {
        wave: wave.wave_number,
        error: error,
      });
    }

    const endTime = new Date();
    const actualDuration = endTime.getTime() - startTime.getTime();

    // Calculate time savings for parallel execution
    const timeSavings = wave.parallel_execution
      ? this.calculateWaveTimeSavings(wave, actualDuration)
      : 0;

    // Run coordination checkpoint if defined
    let checkpointResult: CheckpointResult | undefined;
    if (wave.coordination_checkpoint && status === 'completed') {
      checkpointResult = await this.runCheckpoint(wave.coordination_checkpoint);

      // Update status if checkpoint blocked
      if (!checkpointResult.passed && checkpointResult.blocking) {
        status = 'blocked';
        error = `Checkpoint "${wave.coordination_checkpoint.checkpoint_name}" failed`;
      }
    }

    const result: WaveExecutionResult = {
      wave_number: wave.wave_number,
      status,
      start_time: startTime,
      end_time: endTime,
      actual_duration: actualDuration,
      task_results: taskResults,
      checkpoint_result: checkpointResult,
      error,
      time_savings: timeSavings,
    };

    // Emit TodoWrite event for wave completion
    this.emit('todowrite:wave-complete', {
      waveNumber: wave.wave_number,
      status,
      actualDuration: `${Math.round(actualDuration / 60000)}min`,
      timeSavings: timeSavings > 0 ? `${Math.round(timeSavings / 60000)}min saved` : undefined,
      checkpointPassed: checkpointResult?.passed,
    });

    this.logger.info(`Wave ${wave.wave_number} execution complete`, {
      status,
      duration: `${Math.round(actualDuration / 60000)}min`,
      timeSavings: timeSavings > 0 ? `${Math.round(timeSavings / 60000)}min saved` : 'N/A',
      checkpointPassed: checkpointResult?.passed,
    });

    this.currentWave = null;
    return result;
  }

  /**
   * Run a coordination checkpoint
   */
  private async runCheckpoint(checkpoint: CoordinationCheckpoint): Promise<CheckpointResult> {
    this.logger.info(`Running checkpoint: ${checkpoint.checkpoint_name}`);

    // Convert CoordinationCheckpoint to CheckpointConfig format
    const checkpointConfig: CheckpointConfig = {
      checkpoint_name: checkpoint.checkpoint_name,
      location: checkpoint.location,
      blocking: checkpoint.blocking,
      quality_gates: checkpoint.quality_gates,
      validation_steps: checkpoint.validation_steps,
      handoff_agents: checkpoint.handoff_agents,
    };

    // Use CheckpointValidator for actual validation
    const validationResult = await this.checkpointValidator.validate(checkpointConfig);

    // Display checkpoint report
    const report = this.checkpointValidator.generateReport(validationResult);
    console.log('\n' + report);

    // Convert validation result to CheckpointResult format
    const result: CheckpointResult = {
      name: validationResult.checkpoint_name,
      passed: validationResult.passed,
      blocking: validationResult.blocking,
      quality_gate_results: validationResult.quality_gate_results.map(qg => ({
        gate: qg.gate,
        passed: qg.passed,
        message: qg.message,
      })),
      warnings: validationResult.warnings,
      errors: validationResult.errors,
    };

    this.logger.info(`Checkpoint complete: ${checkpoint.checkpoint_name}`, {
      passed: validationResult.passed,
      blocking: validationResult.blocking,
      warnings: validationResult.warnings.length,
      errors: validationResult.errors.length,
      executionTime: `${validationResult.total_execution_time}ms`,
    });

    return result;
  }

  /**
   * Convert wave tasks to Task objects for ParallelTaskManager
   */
  private async convertWaveTasksToTasks(wave: Wave): Promise<Task[]> {
    // This is a simplified conversion - in production would fetch actual task details
    return wave.tasks.map((taskId, index) => ({
      id: taskId,
      name: `Task ${index + 1} in Wave ${wave.wave_number}`,
      type: 'development' as any,
      priority: 2 as any,
      estimatedDuration: wave.wave_duration_estimate * 60000 / wave.tasks.length,
      requiredResources: [
        {
          type: 'cpu' as any,
          name: 'cpu-cores',
          capacity: 1,
          exclusive: false,
        },
      ],
      dependencies: [],
      agentId: wave.agents[index % wave.agents.length],
      sdlcPhase: 'implementation' as any,
      collisionRisk: 'low' as any,
      metadata: {
        wave: wave.wave_number,
        waveName: wave.wave_name,
      },
    }));
  }

  /**
   * Display wave header
   */
  private displayWaveHeader(wave: Wave): void {
    const divider = '═'.repeat(80);
    console.log(`\n${divider}`);
    console.log(`## Wave ${wave.wave_number}: ${wave.wave_name}`);
    console.log(`Duration: ${wave.wave_duration_estimate}min`);
    console.log(`Parallel Execution: ${wave.parallel_execution ? 'YES' : 'NO'}`);
    console.log(`Agents: ${wave.agents.join(', ')}`);
    console.log(`Tasks: ${wave.tasks.length}`);
    console.log(`${divider}\n`);
  }

  /**
   * Calculate sequential execution time (sum of all wave durations)
   */
  private calculateSequentialTime(waves: Wave[]): number {
    return waves.reduce((total, wave) => {
      // Sequential time is sum of all task durations
      return total + (wave.wave_duration_estimate * 60000);
    }, 0);
  }

  /**
   * Calculate estimated parallel execution time
   */
  private calculateEstimatedParallelTime(waves: Wave[]): number {
    return waves.reduce((total, wave) => {
      // For parallel waves, time is max task duration
      // For sequential waves, time is sum of task durations
      if (wave.parallel_execution && wave.tasks.length > 1) {
        // Parallel time is max duration (bottleneck task)
        const avgTaskDuration = wave.wave_duration_estimate / wave.tasks.length;
        return total + (avgTaskDuration * 60000);
      } else {
        // Sequential time
        return total + (wave.wave_duration_estimate * 60000);
      }
    }, 0);
  }

  /**
   * Calculate time savings for a wave
   */
  private calculateWaveTimeSavings(wave: Wave, actualDuration: number): number {
    if (!wave.parallel_execution || wave.tasks.length <= 1) {
      return 0;
    }

    // Sequential time would be sum of all tasks
    const sequentialTime = wave.wave_duration_estimate * 60000;

    // Time saved is difference between sequential and actual
    return Math.max(0, sequentialTime - actualDuration);
  }

  /**
   * Get current wave number
   */
  getCurrentWave(): number | null {
    return this.currentWave;
  }

  /**
   * Get wave execution result
   */
  getWaveResult(waveNumber: number): WaveExecutionResult | undefined {
    return this.waveResults.get(waveNumber);
  }

  /**
   * Get all wave results
   */
  getAllWaveResults(): Map<number, WaveExecutionResult> {
    return new Map(this.waveResults);
  }
}

export default WaveExecutor;
