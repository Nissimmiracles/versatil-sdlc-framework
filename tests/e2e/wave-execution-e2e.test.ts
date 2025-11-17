/**
 * Wave Execution End-to-End Tests
 * Tests complete wave execution workflows with mocked task execution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WaveExecutor,
  Wave,
} from '../../src/orchestration/wave-executor.js';
import { ExecutionStatus, TaskExecution } from '../../src/orchestration/parallel-task-manager.js';

describe('Wave Execution E2E Tests', () => {
  let executor: WaveExecutor;

  beforeEach(() => {
    executor = new WaveExecutor();

    // Mock ParallelTaskManager methods to simulate task execution
    const parallelTaskManager = (executor as any).parallelTaskManager;

    // Mock addTask - just return success
    vi.spyOn(parallelTaskManager, 'addTask').mockResolvedValue(undefined);

    // Mock executeParallel - simulate successful task completion
    vi.spyOn(parallelTaskManager, 'executeParallel').mockImplementation(
      async (taskIds: string[]) => {
        const results = new Map<string, TaskExecution>();
        for (const taskId of taskIds) {
          results.set(taskId, {
            taskId,
            startTime: new Date(),
            endTime: new Date(),
            status: ExecutionStatus.COMPLETED,
            progress: 100,
            result: { success: true },
            resourceUsage: [],
          });
        }
        return results;
      }
    );

    // Mock getExecutionStatus - return completed status
    vi.spyOn(parallelTaskManager, 'getExecutionStatus').mockImplementation(
      (taskId: string) => {
        return {
          taskId,
          startTime: new Date(),
          endTime: new Date(),
          status: ExecutionStatus.COMPLETED,
          progress: 100,
          result: { success: true },
          resourceUsage: [],
        };
      }
    );
  });

  describe('Full Wave Plan Execution', () => {
    it('should execute complete 3-wave plan successfully', async () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Database Setup',
          wave_duration_estimate: 10,
          parallel_execution: false,
          tasks: ['create-schema', 'seed-data'],
          agents: ['Dana-Database', 'Dana-Database'],
          dependencies: [],
        },
        {
          wave_number: 2,
          wave_name: 'Backend + Frontend (Parallel)',
          wave_duration_estimate: 20,
          parallel_execution: true,
          tasks: ['build-api', 'build-ui'],
          agents: ['Marcus-Backend', 'James-Frontend'],
          dependencies: [1],
          coordination_checkpoint: {
            checkpoint_name: 'API + UI Ready',
            location: 'After Wave 2',
            blocking: true,
            quality_gates: ['Build successful'],
            validation_steps: ['echo "Build check passed"'],
          },
        },
        {
          wave_number: 3,
          wave_name: 'Integration Tests',
          wave_duration_estimate: 15,
          parallel_execution: false,
          tasks: ['run-integration-tests'],
          agents: ['Maria-QA'],
          dependencies: [2],
        },
      ];

      const result = await executor.executePlan(waves);

      // Verify overall success
      expect(result.overall_status).toBe('completed');
      expect(result.waves_completed).toBe(3);
      expect(result.waves_failed).toBe(0);

      // Verify wave results
      expect(result.wave_results.length).toBe(3);
      result.wave_results.forEach(waveResult => {
        expect(waveResult.status).toBe('completed');
      });

      // Verify checkpoint was executed
      const wave2Result = result.wave_results.find(w => w.wave_number === 2);
      expect(wave2Result?.checkpoint_result).toBeDefined();
      expect(wave2Result?.checkpoint_result?.passed).toBe(true);

      // Verify time savings (Wave 2 was parallel)
      expect(result.total_time_savings).toBeGreaterThan(0);
    });

    it('should handle wave dependencies correctly', async () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Foundation',
          wave_duration_estimate: 5,
          parallel_execution: false,
          tasks: ['setup'],
          agents: ['Marcus-Backend'],
          dependencies: [],
        },
        {
          wave_number: 2,
          wave_name: 'Build Layer 1',
          wave_duration_estimate: 10,
          parallel_execution: true,
          tasks: ['feature-a', 'feature-b'],
          agents: ['Marcus-Backend', 'James-Frontend'],
          dependencies: [1],
        },
        {
          wave_number: 3,
          wave_name: 'Build Layer 2',
          wave_duration_estimate: 10,
          parallel_execution: true,
          tasks: ['feature-c', 'feature-d'],
          agents: ['Marcus-Backend', 'James-Frontend'],
          dependencies: [2],
        },
      ];

      const result = await executor.executePlan(waves);

      // Waves should execute in order due to dependencies
      const executionOrder = result.wave_results.map(w => w.wave_number);
      expect(executionOrder).toEqual([1, 2, 3]);

      // All waves should complete
      expect(result.waves_completed).toBe(3);
    });
  });

  describe('Parallel Execution Performance', () => {
    it('should demonstrate time savings with parallel execution', async () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Sequential Tasks',
          wave_duration_estimate: 15,
          parallel_execution: false,
          tasks: ['task-1', 'task-2', 'task-3'],
          agents: ['Agent-1', 'Agent-2', 'Agent-3'],
          dependencies: [],
        },
        {
          wave_number: 2,
          wave_name: 'Parallel Tasks',
          wave_duration_estimate: 15,
          parallel_execution: true,
          tasks: ['task-4', 'task-5', 'task-6'],
          agents: ['Agent-1', 'Agent-2', 'Agent-3'],
          dependencies: [1],
        },
      ];

      const result = await executor.executePlan(waves);

      // Wave 1 (sequential): no time savings
      const wave1 = result.wave_results.find(w => w.wave_number === 1);
      expect(wave1?.time_savings).toBe(0);

      // Wave 2 (parallel): should have time savings
      const wave2 = result.wave_results.find(w => w.wave_number === 2);
      expect(wave2?.time_savings).toBeGreaterThan(0);

      // Overall time savings
      expect(result.total_time_savings).toBeGreaterThan(0);
      expect(result.percentage_faster).toBeGreaterThan(0);
    });
  });

  describe('Agent Distribution', () => {
    it('should execute tasks across multiple agents in parallel wave', async () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Full-Stack Development',
          wave_duration_estimate: 30,
          parallel_execution: true,
          tasks: [
            'database-schema',
            'api-endpoints',
            'ui-components',
            'tests',
          ],
          agents: [
            'Dana-Database',
            'Marcus-Backend',
            'James-Frontend',
            'Maria-QA',
          ],
          dependencies: [],
        },
      ];

      const result = await executor.executePlan(waves);

      expect(result.overall_status).toBe('completed');

      // Verify wave executed successfully with all tasks
      const wave1Result = result.wave_results[0];
      expect(wave1Result.status).toBe('completed');
      expect(wave1Result.task_results.size).toBe(4);
    });
  });

  describe('Coordination Checkpoints', () => {
    it('should validate checkpoints between waves', async () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Development',
          wave_duration_estimate: 20,
          parallel_execution: true,
          tasks: ['dev-task-1', 'dev-task-2'],
          agents: ['Marcus-Backend', 'James-Frontend'],
          dependencies: [],
          coordination_checkpoint: {
            checkpoint_name: 'Development Quality Check',
            location: 'After Wave 1',
            blocking: true,
            quality_gates: [
              'All tests passing',
              'Code quality acceptable',
            ],
            validation_steps: [
              'echo "Tests: PASSED"',
              'echo "Code Quality: OK"',
            ],
          },
        },
        {
          wave_number: 2,
          wave_name: 'Deployment',
          wave_duration_estimate: 10,
          parallel_execution: false,
          tasks: ['deploy'],
          agents: ['Marcus-Backend'],
          dependencies: [1],
        },
      ];

      const result = await executor.executePlan(waves);

      // Checkpoint should have passed
      const wave1Result = result.wave_results[0];
      expect(wave1Result.checkpoint_result).toBeDefined();
      expect(wave1Result.checkpoint_result?.passed).toBe(true);
      expect(wave1Result.checkpoint_result?.quality_gate_results.length).toBe(2);

      // Both waves should complete
      expect(result.waves_completed).toBe(2);
    });

    it('should block execution on failed checkpoint', async () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Development',
          wave_duration_estimate: 20,
          parallel_execution: false,
          tasks: ['dev-task'],
          agents: ['Marcus-Backend'],
          dependencies: [],
          coordination_checkpoint: {
            checkpoint_name: 'Quality Gate',
            location: 'After Wave 1',
            blocking: true,
            quality_gates: ['Tests must pass'],
            validation_steps: ['exit 1'], // Force failure
          },
        },
        {
          wave_number: 2,
          wave_name: 'Should Not Execute',
          wave_duration_estimate: 10,
          parallel_execution: false,
          tasks: ['blocked-task'],
          agents: ['Marcus-Backend'],
          dependencies: [1],
        },
      ];

      const result = await executor.executePlan(waves);

      // Wave 1 checkpoint should fail
      const wave1Result = result.wave_results[0];
      expect(wave1Result.checkpoint_result?.passed).toBe(false);
      expect(wave1Result.checkpoint_result?.blocking).toBe(true);

      // Wave 1 completed but checkpoint blocked it
      expect(wave1Result.status).toBe('blocked');

      // Wave 2 should not execute (only 1 wave result)
      expect(result.wave_results.length).toBe(1);
      expect(result.waves_completed).toBe(0); // Wave 1 status is 'blocked', not 'completed'
      expect(result.waves_failed).toBe(1);
    });

    it('should allow execution despite warning checkpoint failure', async () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Development',
          wave_duration_estimate: 20,
          parallel_execution: false,
          tasks: ['dev-task'],
          agents: ['Marcus-Backend'],
          dependencies: [],
          coordination_checkpoint: {
            checkpoint_name: 'Warning Check',
            location: 'After Wave 1',
            blocking: false, // Non-blocking
            quality_gates: ['Performance check'],
            validation_steps: ['exit 1'], // Force failure
          },
        },
        {
          wave_number: 2,
          wave_name: 'Should Still Execute',
          wave_duration_estimate: 10,
          parallel_execution: false,
          tasks: ['next-task'],
          agents: ['Marcus-Backend'],
          dependencies: [1],
        },
      ];

      const result = await executor.executePlan(waves);

      // Wave 1 checkpoint should fail but not block
      const wave1Result = result.wave_results[0];
      expect(wave1Result.checkpoint_result?.passed).toBe(false);
      expect(wave1Result.checkpoint_result?.blocking).toBe(false);

      // Wave 2 should execute despite checkpoint failure
      expect(result.waves_completed).toBe(2);
      expect(result.waves_failed).toBe(0);
    });
  });

  // NOTE: Agent handoffs are validated internally by CheckpointValidator
  // but not exposed in CheckpointResult interface. This functionality is tested
  // through integration tests that verify CheckpointValidator directly.

  describe('Wave Execution Status Tracking', () => {
    it('should track wave execution status throughout plan', async () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Wave 1',
          wave_duration_estimate: 5,
          parallel_execution: false,
          tasks: ['task-1'],
          agents: ['Agent-1'],
          dependencies: [],
        },
        {
          wave_number: 2,
          wave_name: 'Wave 2',
          wave_duration_estimate: 10,
          parallel_execution: true,
          tasks: ['task-2', 'task-3'],
          agents: ['Agent-2', 'Agent-3'],
          dependencies: [1],
        },
        {
          wave_number: 3,
          wave_name: 'Wave 3',
          wave_duration_estimate: 5,
          parallel_execution: false,
          tasks: ['task-4'],
          agents: ['Agent-4'],
          dependencies: [2],
        },
      ];

      const result = await executor.executePlan(waves);

      // Verify all waves completed
      expect(result.wave_results.every(w => w.status === 'completed')).toBe(true);

      // Verify execution times are tracked (in milliseconds)
      result.wave_results.forEach(waveResult => {
        expect(waveResult.actual_duration).toBeGreaterThanOrEqual(0);
      });

      // Verify overall metrics (in milliseconds)
      expect(result.parallel_time).toBeGreaterThanOrEqual(0);
      expect(result.sequential_time).toBeGreaterThanOrEqual(0);
    });
  });
});
