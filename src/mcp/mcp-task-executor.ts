/**
 * MCP Task Executor - Enhanced Implementation
 *
 * Provides advanced task execution capabilities with:
 * - Parallel execution
 * - Timeout/retry logic
 * - Queue management
 * - Event-driven architecture
 * - Metrics tracking
 */

import { EventEmitter } from 'events';

export interface MCPToolInference {
  taskId: string;
  inferredTools: string[];
  confidence: number;
  reasoning: string;
}

export interface MCPExecutionResult {
  success: boolean;
  toolsExecuted: string[];
  results: Map<string, any>;
  errors: Array<{ tool: string; error: string; retryable?: boolean }>;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  type: string;
  files: string[];
  dependencies?: string[];
  [key: string]: any;
}

export interface TaskMetrics {
  totalExecuted: number;
  successful: number;
  failed: number;
  averageExecutionTime: number;
  queuedTasks: number;
}

export interface ExecutionSummary {
  taskId: string;
  status: 'completed' | 'failed' | 'cancelled';
  duration: number;
  toolsUsed: string[];
  errors: string[];
}

export class MCPTaskExecutor extends EventEmitter {
  private taskQueue: Task[] = [];
  private maxConcurrency: number = 5;
  private maxQueueSize: number = 100;
  private metrics: TaskMetrics = {
    totalExecuted: 0,
    successful: 0,
    failed: 0,
    averageExecutionTime: 0,
    queuedTasks: 0
  };
  private executionSummaries: Map<string, ExecutionSummary> = new Map();
  private cancelledTasks: Set<string> = new Set();

  private toolFeedback = new Map<string, string[]>();
  private parallelEfficiency = 0;
  constructor(private executeTool?: (tool: string, task: Task) => Promise<any>) {
    super();
  }
  async validateTask(task: Task): Promise<void> {
    if (!task?.id || !task.name || !task.type || !Array.isArray(task.files)) throw new Error('Invalid task');
  }

  async inferTools(task: Task): Promise<MCPToolInference> {
    // Stub: infer basic tools based on task type
    const tools: string[] = [];

    if (task.files && task.files.length > 0) {
      tools.push('Read', 'Write');
    }

    if (task.type === 'git') tools.push('GitHub', 'Bash');
    if (task.type === 'testing') {
      tools.push('Bash', 'Chrome', 'Playwright');
    } else if (task.type === 'development') {
      tools.push('Bash', 'Glob', 'Grep');
    }

    return {
      taskId: task.id,
      inferredTools: [...new Set([...tools, ...(this.toolFeedback.get(task.id) || [])])],
      confidence: 0.8,
      reasoning: 'Inferred based on task type and files'
    };
  }

  async executeTools(task: Task, inference: MCPToolInference): Promise<MCPExecutionResult> {
    await this.validateTask(task);
    const started = Date.now();
    this.emit("task_started", { taskId: task.id, timestamp: new Date() });
    // Check if task was cancelled before execution
    if (this.cancelledTasks.has(task.id)) {
      return {
        success: false,
        toolsExecuted: [],
        results: new Map(),
        errors: [{ tool: 'executor', error: 'Task was cancelled before execution' }]
      };
    }

    // Execute only through the supplied adapter; missing adapters fail closed.
    const results = new Map<string, any>();

    // Emit progress event for each tool
    const errors: Array<{ tool: string; error: string; retryable?: boolean }> = [];
    let progress = 0;
    const totalTools = inference.inferredTools.length;

    for (const tool of inference.inferredTools) {
      // Check for cancellation during execution
      if (this.cancelledTasks.has(task.id)) {
        return {
          success: false,
          toolsExecuted: Array.from(results.keys()),
          results,
          errors: [{ tool: 'executor', error: 'Task cancelled during execution' }]
        };
      }

      try {
        if (!this.executeTool) throw new Error(`No executor registered for ${tool}`);
        const result = await this.executeTool(tool, task);
        if (this.cancelledTasks.has(task.id)) throw new Error('Task cancelled during execution');
        if (result?.success === false) {
          throw Object.assign(new Error(result.error || `${tool} failed`), { retryable: result.retryable });
        }
        results.set(tool, result);
      } catch (error: any) { errors.push({ tool, error: error.message || String(error), retryable: error.retryable }); }
      progress++;
      this.emit('execution_progress', {
        taskId: task.id,
        progress: (progress / totalTools) * 100,
        currentTool: tool,
        completedTools: progress,
        totalTools
      });
    }

    const duration = Date.now() - started;
    const success = errors.length === 0;
    this.executionSummaries.set(task.id, { taskId: task.id, status: this.cancelledTasks.has(task.id) ? 'cancelled' : success ? 'completed' : 'failed',
      duration, toolsUsed: [...results.keys()], errors: errors.map(e => e.error) });
    this.metrics.totalExecuted++;
    if (success) this.metrics.successful++; else this.metrics.failed++;
    this.metrics.averageExecutionTime += (duration - this.metrics.averageExecutionTime) / this.metrics.totalExecuted;
    this.emit('task_completed', { taskId: task.id, timestamp: new Date(), duration, success });
    return { success, toolsExecuted: [...results.keys()], results, errors };
  }

  async cancelTask(taskId: string): Promise<void> {
    console.log(`[MCPTaskExecutor] Task ${taskId} cancelled`);
    // Mark task as cancelled
    this.cancelledTasks.add(taskId);
    // Remove from queue
    this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
    this.metrics.queuedTasks = this.taskQueue.length;
    // Record cancellation
    this.executionSummaries.set(taskId, {
      taskId,
      status: 'cancelled',
      duration: 0,
      toolsUsed: [],
      errors: []
    });
    this.emit('task-cancelled', { taskId });
  }

  /**
   * Execute tools with timeout
   */
  async executeToolsWithTimeout(
    task: Task,
    inference: MCPToolInference,
    timeoutMs: number = 30000
  ): Promise<MCPExecutionResult> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([this.executeTools(task, inference), new Promise<MCPExecutionResult>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Execution timeout')), timeoutMs);
      })]);
    } catch (error: any) {
      await this.cancelTask(task.id);
      return { success: false, toolsExecuted: [], results: new Map(), errors: [{ tool: 'timeout', error: error.message }] };
    } finally { if (timer) clearTimeout(timer); }

  }

  /**
   * Retry only failed tools with an explicit adapter safety guarantee. Completed
   * tools are retained and never replayed; unknown outcomes and timeouts stop retries.
   */
  async executeToolsWithRetry(
    task: Task,
    inference: MCPToolInference,
    maxRetries: number = 3,
    options: { retrySafeTools?: Record<string, 'read-only' | 'idempotent'> } = {}
  ): Promise<MCPExecutionResult> {
    const started = Date.now();
    const completed = new Map<string, any>();
    let pending = inference;
    let errors: Array<{ tool: string; error: string; retryable?: boolean }> = [];
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeTools(task, pending);
        result.results.forEach((value, tool) => completed.set(tool, value));
        errors = result.errors;
        if (!result.success && errors.length === 0) errors = [{ tool: 'executor', error: 'Execution failed without outcome details' }];
        if (result.success) break;
      } catch (error: any) {
        // An exception can leave the outcome unknown. Never replay the batch.
        errors = [{ tool: 'executor', error: error.message || String(error) }];
        break;
      }
      const retryTools = errors.filter(error => error.retryable !== false && !completed.has(error.tool) &&
        ['read-only', 'idempotent'].includes(options.retrySafeTools?.[error.tool] || '') &&
        !/timeout|cancel/i.test(error.error)).map(error => error.tool);
      if (attempt === maxRetries || this.cancelledTasks.has(task.id) || retryTools.length !== errors.length) break;
      pending = { ...inference, inferredTools: [...new Set(retryTools)] };
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
    const success = errors.length === 0;
    this.executionSummaries.set(task.id, { taskId: task.id,
      status: this.cancelledTasks.has(task.id) ? 'cancelled' : success ? 'completed' : 'failed',
      duration: Date.now() - started, toolsUsed: [...completed.keys()], errors: errors.map(e => e.error) });
    return { success, toolsExecuted: [...completed.keys()], results: completed, errors };
  }

  /**
   * Execute tasks in parallel
   */
  async executeTasksInParallel(tasks: Task[]): Promise<MCPExecutionResult[]> {
    const results: MCPExecutionResult[] = [];

    const started = Date.now();
    const durations: number[] = [];
    let completed = 0;
    const batchSize = this.maxConcurrency;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async task => {
          const inference = await this.inferTools(task);
          const started = Date.now();
          const result = await this.executeTools(task, inference);
          durations.push(Date.now() - started);
          this.emit('parallel_progress', { completed: ++completed, total: tasks.length });
          return result;
        })
      );
      results.push(...batchResults);
    }

    this.parallelEfficiency = durations.length ? Math.min(1, durations.reduce((sum, d) => sum + d, 0) / (Math.max(1, Date.now() - started) * Math.min(this.maxConcurrency, tasks.length))) : 0;
    return results;
  }

  /**
   * Execute tasks in batches
   */
  async executeInBatches(tasks: Task[], batchSize: number): Promise<MCPExecutionResult[]> {
    if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error('Batch size must be a positive integer');
    const results: MCPExecutionResult[] = [];

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async task => {
          const inference = await this.inferTools(task);
          return this.executeTools(task, inference);
        })
      );
      results.push(...batchResults);
      this.emit('batch-completed', { batchNumber: Math.floor(i / batchSize) + 1, results: batchResults });
    }

    return results;
  }

  /**
   * Queue a task for execution
   */
  async queueTask(task: Task): Promise<void> {
    if (this.taskQueue.length >= this.maxQueueSize) {
      throw new Error('Task queue full');
    }
    this.taskQueue.push(task);
    this.metrics.queuedTasks = this.taskQueue.length;
    this.emit('task-queued', { taskId: task.id, queueSize: this.taskQueue.length });
  }

  /**
   * Set maximum concurrency
   */
  setMaxConcurrency(max: number): void {
    if (!Number.isInteger(max) || max < 1) throw new Error('Concurrency must be a positive integer');
    this.maxConcurrency = max;
  }

  /**
   * Set maximum queue size
   */
  setMaxQueueSize(max: number): void {
    if (!Number.isInteger(max) || max < 1) throw new Error('Queue size must be a positive integer');
    this.maxQueueSize = max;
  }

  /**
   * Get task metrics
   */
  getTaskMetrics(taskId?: string): any {
    if (taskId) {
      const summary = this.executionSummaries.get(taskId);
      return summary && { executionTime: summary.duration, toolsUsed: summary.toolsUsed, success: summary.status === 'completed' };
    }
    return { ...this.metrics };
  }

  /**
   * Get execution summary for a task
   */
  getExecutionSummary(taskId?: string): any {
    if (taskId) return this.executionSummaries.get(taskId);
    const summaries = [...this.executionSummaries.values()];
    return { totalTasks: summaries.length, successfulTasks: summaries.filter(s => s.status === 'completed').length,
      failedTasks: summaries.filter(s => s.status === 'failed').length };
  }

  /**
   * Provide feedback on task execution
   */
  async provideFeedback(taskId: string, feedback: { rating?: number; comment?: string; correctTools?: string[]; missingTools?: string[] }): Promise<void> {
    this.toolFeedback.set(taskId, [...new Set([...(feedback.correctTools || []), ...(feedback.missingTools || [])])]);
    this.emit('feedback-received', { taskId, feedback });
    console.log(`[MCPTaskExecutor] Feedback for task ${taskId}: ${feedback.rating}/5`);
  }

  /**
   * Process queued tasks
   */
  async processQueue(): Promise<void> {
    while (!this.queuePaused && this.taskQueue.length > 0) {
      const tasksToProcess = this.taskQueue.splice(0, this.maxConcurrency);
      await Promise.all(
        tasksToProcess.map(async task => {
          const inference = await this.inferTools(task);
          const result = await this.executeTools(task, inference);


          return result;
        })
      );
    }
    this.metrics.queuedTasks = this.taskQueue.length;
    this.emit('queue-processed');
    this.emit('queue_empty');
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.taskQueue.length;
  }

  /**
   * Initialize the executor
   */
  async initialize(): Promise<void> {
    this.taskQueue = [];
    this.metrics = {
      totalExecuted: 0,
      successful: 0,
      failed: 0,
      averageExecutionTime: 0,
      queuedTasks: 0
    };
    this.executionSummaries = new Map();
    this.emit('initialized');
  }

  /**
   * Shared state storage for persistence (static to share across instances)
   */
  private static sharedSavedState: { queue: Task[]; metrics: TaskMetrics } | null = null;

  /**
   * Save queue state to process-local memory
   */
  async saveQueueState(): Promise<void> {
    // In-memory persistence for testing (would be disk/database in production)
    MCPTaskExecutor.sharedSavedState = {
      queue: [...this.taskQueue],
      metrics: { ...this.metrics }
    };
    this.emit('queue-saved', MCPTaskExecutor.sharedSavedState);
  }

  /**
   * Load queue state from process-local memory
   */
  async loadQueueState(): Promise<void> {
    // Load from shared storage (would be disk/database in production)
    if (MCPTaskExecutor.sharedSavedState) {
      this.taskQueue = [...MCPTaskExecutor.sharedSavedState.queue];
      this.metrics = { ...MCPTaskExecutor.sharedSavedState.metrics };
    }
    this.emit('queue-loaded');
  }

  /**
   * Process queue by priority
   */
  async processQueueByPriority(): Promise<void> {
    // Sort queue by priority (assuming higher priority first)
    this.taskQueue.sort((a, b) => {
      const priorityA = (a as any).priority || 0;
      const priorityB = (b as any).priority || 0;
      return priorityB - priorityA;
    });

    await this.processQueue();
  }

  /**
   * Pause queue processing
   */
  private queuePaused: boolean = false;

  pauseQueue(): void {
    this.queuePaused = true;
    this.emit('queue-paused');
  }

  /**
   * Resume queue processing
   */
  resumeQueue(): void {
    this.queuePaused = false;
    this.startProcessingQueue();
    this.emit('queue-resumed');
  }

  /**
   * Start processing queue automatically
   */
  private processingInterval?: NodeJS.Timeout;

  startProcessingQueue(intervalMs: number = 1000): void {
    if (this.processingInterval) {
      return; // Already processing
    }

    this.processingInterval = setInterval(async () => {
      if (!this.queuePaused && this.taskQueue.length > 0) {
        await this.processQueue();
      }
    }, intervalMs);

    this.emit('queue-processing-started');
  }

  /**
   * Clear the task queue
   */
  clearQueue(): void {
    this.taskQueue = [];
    this.metrics.queuedTasks = 0;
    this.emit('queue-cleared');
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    queueSize: number;
    paused: boolean;
    processing: boolean;
    totalProcessed: number;
    completed: number;
    successRate: number;
  } {
    return {
      queueSize: this.taskQueue.length,
      paused: this.queuePaused,
      processing: !!this.processingInterval,
      totalProcessed: this.metrics.totalExecuted,
      completed: this.metrics.successful,
      successRate: this.metrics.totalExecuted > 0
        ? (this.metrics.successful / this.metrics.totalExecuted) * 100
        : 0
    };
  }

  /**
   * Get queue statistics (alias for getQueueStats)
   */
  getQueueStatistics() {
    return this.getQueueStats();
  }

  /**
   * Get number of processed tasks
   */
  getProcessedCount(): number {
    return this.metrics.totalExecuted;
  }

  /**
   * Check if queue is currently being processed
   */
  isQueueProcessing(): boolean {
    return !!this.processingInterval && !this.queuePaused;
  }

  getParallelEfficiency(): number { return this.parallelEfficiency; }
  async executeTasksOptimized(tasks: Task[]): Promise<MCPExecutionResult[]> {
    return this.executeTasksWithDependencies([...tasks].sort((a, b) => (b.estimatedDuration || 0) - (a.estimatedDuration || 0)));
  }
  async executeTasksWithDependencies(tasks: Task[]): Promise<MCPExecutionResult[]> {
    const pending = [...tasks];
    const results = new Map<string, MCPExecutionResult>();
    if (new Set(tasks.map(t => t.id)).size !== tasks.length) throw new Error('Duplicate task IDs');
    while (pending.length) {
      const ready = pending.filter(t => (t.dependencies || []).every(id => results.has(id)));
      if (!ready.length) throw new Error('Unresolved or cyclic task dependencies');
      for (let i = 0; i < ready.length; i += this.maxConcurrency) {
        await Promise.all(ready.slice(i, i + this.maxConcurrency).map(async task => {
          const blocked = (task.dependencies || []).some(id => !results.get(id)?.success);
          const result = blocked ? { success: false, toolsExecuted: [], results: new Map(), errors: [{ tool: 'executor', error: 'Dependency failed' }] } :
            await this.executeTools(task, await this.inferTools(task));
          results.set(task.id, result);
          pending.splice(pending.indexOf(task), 1);
        }));
      }
    }
    return tasks.map(t => results.get(t.id)!);
  }
  async shutdown(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    this.taskQueue = [];
    this.removeAllListeners();
  }
}

export default MCPTaskExecutor;
