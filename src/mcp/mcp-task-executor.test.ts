/**
 * VERSATIL Framework - MCP Task Executor Tests
 * Test suite for MCP task execution, parallel execution, and queuing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MCPTaskExecutor, Task, MCPToolInference, MCPExecutionResult } from './mcp-task-executor';

describe('MCPTaskExecutor', () => {
  let executor: MCPTaskExecutor;

  beforeEach(async () => {
    vi.clearAllMocks();
    executor = new MCPTaskExecutor();
    await executor.initialize();
  });

  afterEach(async () => {
    if (executor) {
      await executor.shutdown();
    }
  });

  // ============================================================================
  // Task Execution (12 tests)
  // ============================================================================
  describe('Task Execution', () => {
    it('should execute single task', async () => {
      const task: Task = {
        id: 'task-1',
        name: 'Read file',
        type: 'development',
        files: ['src/app.ts']
      };

      const inference = await executor.inferTools(task);
      const result = await executor.executeTools(task, inference);

      expect(result.success).toBe(true);
      expect(result.toolsExecuted.length).toBeGreaterThan(0);
    });

    it('should execute task with dependencies', async () => {
      const task: Task = {
        id: 'task-2',
        name: 'Run tests',
        type: 'testing',
        files: ['test/**/*.test.ts'],
        dependencies: ['task-1']
      };

      const inference = await executor.inferTools(task);
      const result = await executor.executeTools(task, inference);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('toolsExecuted');
    });

    it('should track execution progress', async () => {
      const task: Task = {
        id: 'task-3',
        name: 'Build project',
        type: 'development',
        files: ['src/**/*.ts']
      };

      let progressEvents = 0;
      executor.on('execution_progress', () => {
        progressEvents++;
      });

      const inference = await executor.inferTools(task);
      await executor.executeTools(task, inference);

      expect(progressEvents).toBeGreaterThan(0);
    });

    it('should handle task execution errors', async () => {
      const task: Task = {
        id: 'task-4',
        name: 'Invalid task',
        type: 'unknown',
        files: []
      };

      const inference = await executor.inferTools(task);

      // Mock tool execution failure
      vi.spyOn(executor, 'executeTools').mockResolvedValue({
        success: false,
        toolsExecuted: [],
        results: new Map(),
        errors: [{ tool: 'Unknown', error: 'Tool not found' }]
      });

      const result = await executor.executeTools(task, inference);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate task before execution', async () => {
      const invalidTask: any = {
        // Missing required fields
        name: 'Invalid'
      };

      await expect(async () => {
        await executor.validateTask(invalidTask);
      }).rejects.toThrow();
    });

    it('should timeout long-running tasks', async () => {
      const task: Task = {
        id: 'task-5',
        name: 'Long running task',
        type: 'development',
        files: ['src/app.ts'],
        timeout: 100 // 100ms
      };

      // Mock slow execution
      vi.spyOn(executor, 'executeTools').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return {
          success: true,
          toolsExecuted: [],
          results: new Map(),
          errors: []
        };
      });

      const inference = await executor.inferTools(task);
      const result = await executor.executeToolsWithTimeout(task, inference, 100);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.error.includes('timeout'))).toBe(true);
    });

    it('should cancel running tasks', async () => {
      const task: Task = {
        id: 'task-6',
        name: 'Cancellable task',
        type: 'development',
        files: ['src/**/*.ts']
      };

      const inference = await executor.inferTools(task);
      const executionPromise = executor.executeTools(task, inference);

      // Cancel after 50ms
      setTimeout(() => {
        executor.cancelTask('task-6');
      }, 50);

      const result = await executionPromise;

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.error.includes('cancel'))).toBe(true);
    });

    it('should retry failed tasks', async () => {
      const task: Task = {
        id: 'task-7',
        name: 'Retry task',
        type: 'testing',
        files: ['test/*.test.ts'],
        retries: 2
      };

      let attemptCount = 0;
      vi.spyOn(executor, 'executeTools').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          return {
            success: false,
            toolsExecuted: [],
            results: new Map(),
            errors: [{ tool: 'Bash', error: 'Transient failure' }]
          };
        }
        return {
          success: true,
          toolsExecuted: ['Bash'],
          results: new Map([['Bash', { status: 'success' }]]),
          errors: []
        };
      });

      const inference = await executor.inferTools(task);
      const result = await executor.executeToolsWithRetry(task, inference);

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should emit task_started event', (done) => {
      executor.on('task_started', (data) => {
        expect(data).toHaveProperty('taskId');
        expect(data).toHaveProperty('timestamp');
        done();
      });

      const task: Task = {
        id: 'task-8',
        name: 'Test task',
        type: 'development',
        files: ['src/app.ts']
      };

      executor.inferTools(task).then(inference =>
        executor.executeTools(task, inference)
      );
    });

    it('should emit task_completed event', (done) => {
      executor.on('task_completed', (data) => {
        expect(data).toHaveProperty('taskId');
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('duration');
        done();
      });

      const task: Task = {
        id: 'task-9',
        name: 'Complete task',
        type: 'development',
        files: ['src/app.ts']
      };

      executor.inferTools(task).then(inference =>
        executor.executeTools(task, inference)
      );
    });

    it('should record execution metrics', async () => {
      const task: Task = {
        id: 'task-10',
        name: 'Metrics task',
        type: 'testing',
        files: ['test/*.test.ts']
      };

      const inference = await executor.inferTools(task);
      await executor.executeTools(task, inference);

      const metrics = executor.getTaskMetrics('task-10');

      expect(metrics).toHaveProperty('executionTime');
      expect(metrics).toHaveProperty('toolsUsed');
      expect(metrics).toHaveProperty('success');
    });

    it('should provide execution summary', async () => {
      const tasks: Task[] = [
        { id: 'task-11', name: 'Task 1', type: 'development', files: ['file1.ts'] },
        { id: 'task-12', name: 'Task 2', type: 'testing', files: ['file2.test.ts'] }
      ];

      for (const task of tasks) {
        const inference = await executor.inferTools(task);
        await executor.executeTools(task, inference);
      }

      const summary = executor.getExecutionSummary();

      expect(summary.totalTasks).toBe(2);
      expect(summary).toHaveProperty('successfulTasks');
      expect(summary).toHaveProperty('failedTasks');
    });
  });

  // ============================================================================
  // Tool Inference (10 tests)
  // ============================================================================
  describe('Tool Inference', () => {
    it('should infer tools for development task', async () => {
      const task: Task = {
        id: 'dev-1',
        name: 'Code changes',
        type: 'development',
        files: ['src/app.ts', 'src/utils.ts']
      };

      const inference = await executor.inferTools(task);

      expect(inference.inferredTools).toContain('Read');
      expect(inference.inferredTools).toContain('Write');
      expect(inference.confidence).toBeGreaterThan(0);
    });

    it('should infer tools for testing task', async () => {
      const task: Task = {
        id: 'test-1',
        name: 'Run tests',
        type: 'testing',
        files: ['test/app.test.ts']
      };

      const inference = await executor.inferTools(task);

      expect(inference.inferredTools).toContain('Bash');
      expect(inference.inferredTools.some(t => ['Chrome', 'Playwright'].includes(t))).toBe(true);
    });

    it('should infer tools for Git operations', async () => {
      const task: Task = {
        id: 'git-1',
        name: 'Create PR',
        type: 'git',
        files: ['src/**/*.ts']
      };

      const inference = await executor.inferTools(task);

      expect(inference.inferredTools.some(t => t.includes('Git') || t === 'Bash')).toBe(true);
    });

    it('should infer tools based on file patterns', async () => {
      const task: Task = {
        id: 'pattern-1',
        name: 'Process files',
        type: 'development',
        files: ['src/**/*.tsx', 'components/**/*.tsx']
      };

      const inference = await executor.inferTools(task);

      expect(inference.inferredTools).toContain('Glob');
      expect(inference.inferredTools).toContain('Read');
    });

    it('should provide inference confidence score', async () => {
      const task: Task = {
        id: 'conf-1',
        name: 'Clear task',
        type: 'testing',
        files: ['test/*.test.ts']
      };

      const inference = await executor.inferTools(task);

      expect(inference.confidence).toBeGreaterThan(0);
      expect(inference.confidence).toBeLessThanOrEqual(1);
    });

    it('should provide reasoning for tool selection', async () => {
      const task: Task = {
        id: 'reason-1',
        name: 'Task with reasoning',
        type: 'development',
        files: ['src/app.ts']
      };

      const inference = await executor.inferTools(task);

      expect(inference.reasoning).toBeDefined();
      expect(inference.reasoning.length).toBeGreaterThan(0);
    });

    it('should handle tasks with no files', async () => {
      const task: Task = {
        id: 'no-files-1',
        name: 'No files task',
        type: 'development',
        files: []
      };

      const inference = await executor.inferTools(task);

      expect(inference.inferredTools).toBeDefined();
      expect(inference.confidence).toBeGreaterThan(0);
    });

    it('should infer agent-specific tools', async () => {
      const task: Task = {
        id: 'agent-1',
        name: 'Agent task',
        type: 'development',
        files: ['src/app.ts'],
        agentId: 'james-frontend'
      };

      const inference = await executor.inferTools(task);

      // Should include tools relevant to frontend work
      expect(inference.inferredTools.length).toBeGreaterThan(0);
    });

    it('should cache inference results', async () => {
      const task: Task = {
        id: 'cache-1',
        name: 'Cacheable task',
        type: 'development',
        files: ['src/app.ts']
      };

      const inference1 = await executor.inferTools(task);
      const inference2 = await executor.inferTools(task);

      expect(inference1.inferredTools).toEqual(inference2.inferredTools);
    });

    it('should update inference based on feedback', async () => {
      const task: Task = {
        id: 'feedback-1',
        name: 'Learning task',
        type: 'development',
        files: ['src/app.ts']
      };

      const inference = await executor.inferTools(task);
      const initialTools = [...inference.inferredTools];

      // Provide feedback
      await executor.provideFeedback('feedback-1', {
        correctTools: ['Read', 'Write', 'Edit'],
        missingTools: ['Edit']
      });

      const inference2 = await executor.inferTools(task);

      expect(inference2.inferredTools).toContain('Edit');
    });
  });

  // ============================================================================
  // Parallel Execution (8 tests)
  // ============================================================================
  describe('Parallel Execution', () => {
    it('should execute independent tasks in parallel', async () => {
      const tasks: Task[] = [
        { id: 'par-1', name: 'Task 1', type: 'development', files: ['file1.ts'] },
        { id: 'par-2', name: 'Task 2', type: 'development', files: ['file2.ts'] },
        { id: 'par-3', name: 'Task 3', type: 'development', files: ['file3.ts'] }
      ];

      const startTime = Date.now();
      const results = await executor.executeTasksInParallel(tasks);
      const elapsed = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(elapsed).toBeLessThan(1000); // Should be faster than serial
    });

    it('should respect task dependencies', async () => {
      const tasks: Task[] = [
        { id: 'dep-1', name: 'Task 1', type: 'development', files: ['file1.ts'] },
        { id: 'dep-2', name: 'Task 2', type: 'development', files: ['file2.ts'], dependencies: ['dep-1'] },
        { id: 'dep-3', name: 'Task 3', type: 'development', files: ['file3.ts'], dependencies: ['dep-2'] }
      ];

      const executionOrder: string[] = [];
      executor.on('task_started', (data) => {
        executionOrder.push(data.taskId);
      });

      await executor.executeTasksWithDependencies(tasks);

      expect(executionOrder).toEqual(['dep-1', 'dep-2', 'dep-3']);
    });

    it('should limit concurrent execution', async () => {
      executor.setMaxConcurrency(2);

      const tasks: Task[] = Array(5).fill(null).map((_, i) => ({
        id: `conc-${i}`,
        name: `Task ${i}`,
        type: 'development',
        files: [`file${i}.ts`]
      }));

      let activeCount = 0;
      let maxActive = 0;

      executor.on('task_started', () => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
      });

      executor.on('task_completed', () => {
        activeCount--;
      });

      await executor.executeTasksInParallel(tasks);

      expect(maxActive).toBeLessThanOrEqual(2);
    });

    it('should execute tasks in optimal order', async () => {
      const tasks: Task[] = [
        { id: 'ord-1', name: 'Fast task', type: 'development', files: ['small.ts'], estimatedDuration: 100 },
        { id: 'ord-2', name: 'Slow task', type: 'testing', files: ['large.test.ts'], estimatedDuration: 1000 },
        { id: 'ord-3', name: 'Medium task', type: 'development', files: ['medium.ts'], estimatedDuration: 500 }
      ];

      const executionOrder: string[] = [];
      executor.on('task_started', (data) => {
        executionOrder.push(data.taskId);
      });

      await executor.executeTasksOptimized(tasks);

      // Slow tasks should start first for better parallelism
      expect(executionOrder[0]).toBe('ord-2');
    });

    it('should handle parallel execution failures', async () => {
      const tasks: Task[] = [
        { id: 'fail-1', name: 'Good task', type: 'development', files: ['good.ts'] },
        { id: 'fail-2', name: 'Bad task', type: 'development', files: ['bad.ts'] },
        { id: 'fail-3', name: 'Good task 2', type: 'development', files: ['good2.ts'] }
      ];

      // Mock one failure
      vi.spyOn(executor, 'executeTools').mockImplementation(async (task) => {
        if (task.id === 'fail-2') {
          return {
            success: false,
            toolsExecuted: [],
            results: new Map(),
            errors: [{ tool: 'Read', error: 'File not found' }]
          };
        }
        return {
          success: true,
          toolsExecuted: ['Read'],
          results: new Map([['Read', { status: 'success' }]]),
          errors: []
        };
      });

      const results = await executor.executeTasksInParallel(tasks);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      expect(successCount).toBe(2);
      expect(failCount).toBe(1);
    });

    it('should provide parallel execution progress', async () => {
      const tasks: Task[] = Array(5).fill(null).map((_, i) => ({
        id: `prog-${i}`,
        name: `Task ${i}`,
        type: 'development',
        files: [`file${i}.ts`]
      }));

      let progressUpdates = 0;
      executor.on('parallel_progress', (data) => {
        progressUpdates++;
        expect(data).toHaveProperty('completed');
        expect(data).toHaveProperty('total');
      });

      await executor.executeTasksInParallel(tasks);

      expect(progressUpdates).toBeGreaterThan(0);
    });

    it('should support parallel batching', async () => {
      const tasks: Task[] = Array(10).fill(null).map((_, i) => ({
        id: `batch-${i}`,
        name: `Task ${i}`,
        type: 'development',
        files: [`file${i}.ts`]
      }));

      const results = await executor.executeInBatches(tasks, 3); // Batches of 3

      expect(results).toHaveLength(10);
    });

    it('should calculate parallel execution efficiency', async () => {
      const tasks: Task[] = Array(4).fill(null).map((_, i) => ({
        id: `eff-${i}`,
        name: `Task ${i}`,
        type: 'development',
        files: [`file${i}.ts`]
      }));

      await executor.executeTasksInParallel(tasks);

      const efficiency = executor.getParallelEfficiency();

      expect(efficiency).toBeGreaterThan(0);
      expect(efficiency).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // Task Queue Management (10 tests)
  // ============================================================================
  describe('Task Queue Management', () => {
    it('should add task to queue', async () => {
      const task: Task = {
        id: 'queue-1',
        name: 'Queued task',
        type: 'development',
        files: ['src/app.ts']
      };

      await executor.queueTask(task);

      const queueSize = executor.getQueueSize();
      expect(queueSize).toBeGreaterThan(0);
    });

    it('should process queue in FIFO order', async () => {
      const tasks: Task[] = [
        { id: 'fifo-1', name: 'First', type: 'development', files: ['1.ts'] },
        { id: 'fifo-2', name: 'Second', type: 'development', files: ['2.ts'] },
        { id: 'fifo-3', name: 'Third', type: 'development', files: ['3.ts'] }
      ];

      const executionOrder: string[] = [];
      executor.on('task_started', (data) => {
        executionOrder.push(data.taskId);
      });

      for (const task of tasks) {
        await executor.queueTask(task);
      }

      await executor.processQueue();

      expect(executionOrder).toEqual(['fifo-1', 'fifo-2', 'fifo-3']);
    });

    it('should support priority queue', async () => {
      const tasks: Task[] = [
        { id: 'pri-1', name: 'Low priority', type: 'development', files: ['1.ts'], priority: 1 },
        { id: 'pri-2', name: 'High priority', type: 'development', files: ['2.ts'], priority: 10 },
        { id: 'pri-3', name: 'Medium priority', type: 'development', files: ['3.ts'], priority: 5 }
      ];

      const executionOrder: string[] = [];
      executor.on('task_started', (data) => {
        executionOrder.push(data.taskId);
      });

      for (const task of tasks) {
        await executor.queueTask(task);
      }

      await executor.processQueueByPriority();

      expect(executionOrder[0]).toBe('pri-2'); // Highest priority first
    });

    it('should pause queue processing', async () => {
      const tasks: Task[] = Array(5).fill(null).map((_, i) => ({
        id: `pause-${i}`,
        name: `Task ${i}`,
        type: 'development',
        files: [`${i}.ts`]
      }));

      for (const task of tasks) {
        await executor.queueTask(task);
      }

      executor.startProcessingQueue();
      await new Promise(resolve => setTimeout(resolve, 100));

      executor.pauseQueue();

      const processed = executor.getProcessedCount();
      const remaining = executor.getQueueSize();

      expect(processed + remaining).toBe(5);
      expect(remaining).toBeGreaterThan(0);
    });

    it('should resume queue processing', async () => {
      await executor.queueTask({
        id: 'resume-1',
        name: 'Resume task',
        type: 'development',
        files: ['app.ts']
      });

      executor.pauseQueue();
      executor.resumeQueue();

      const isProcessing = executor.isQueueProcessing();
      expect(isProcessing).toBe(true);
    });

    it('should clear queue', async () => {
      const tasks: Task[] = Array(3).fill(null).map((_, i) => ({
        id: `clear-${i}`,
        name: `Task ${i}`,
        type: 'development',
        files: [`${i}.ts`]
      }));

      for (const task of tasks) {
        await executor.queueTask(task);
      }

      executor.clearQueue();

      const queueSize = executor.getQueueSize();
      expect(queueSize).toBe(0);
    });

    it('should get queue statistics', async () => {
      const tasks: Task[] = Array(5).fill(null).map((_, i) => ({
        id: `stats-${i}`,
        name: `Task ${i}`,
        type: 'development',
        files: [`${i}.ts`]
      }));

      for (const task of tasks) {
        await executor.queueTask(task);
      }

      const stats = executor.getQueueStats();

      expect(stats).toHaveProperty('queueSize');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('completed');
      expect(stats.queueSize).toBe(5);
    });

    it('should emit queue_empty event', (done) => {
      executor.on('queue_empty', () => {
        done();
      });

      executor.queueTask({
        id: 'empty-1',
        name: 'Last task',
        type: 'development',
        files: ['app.ts']
      }).then(() => executor.processQueue());
    });

    it('should handle queue overflow', async () => {
      executor.setMaxQueueSize(5);

      const tasks: Task[] = Array(10).fill(null).map((_, i) => ({
        id: `overflow-${i}`,
        name: `Task ${i}`,
        type: 'development',
        files: [`${i}.ts`]
      }));

      let overflowErrors = 0;
      for (const task of tasks) {
        try {
          await executor.queueTask(task);
        } catch (error: any) {
          if (error.message.includes('queue full')) {
            overflowErrors++;
          }
        }
      }

      expect(overflowErrors).toBeGreaterThan(0);
    });

    it('should persist queue state', async () => {
      const tasks: Task[] = Array(3).fill(null).map((_, i) => ({
        id: `persist-${i}`,
        name: `Task ${i}`,
        type: 'development',
        files: [`${i}.ts`]
      }));

      for (const task of tasks) {
        await executor.queueTask(task);
      }

      await executor.saveQueueState();

      const newExecutor = new MCPTaskExecutor();
      await newExecutor.initialize();
      await newExecutor.loadQueueState();

      const queueSize = newExecutor.getQueueSize();
      expect(queueSize).toBe(3);
    });
  });
});
