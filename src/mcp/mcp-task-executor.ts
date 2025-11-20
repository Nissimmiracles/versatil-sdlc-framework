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
  errors: Array<{ tool: string; error: string }>;
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

  constructor() {
    super();
  }

  async inferTools(task: Task): Promise<MCPToolInference> {
    // Stub: infer basic tools based on task type
    const tools: string[] = [];

    if (task.files && task.files.length > 0) {
      tools.push('Read', 'Write');
    }

    if (task.type === 'testing') {
      tools.push('Bash', 'Chrome', 'Playwright');
    } else if (task.type === 'development') {
      tools.push('Bash', 'Glob', 'Grep');
    }

    return {
      taskId: task.id,
      inferredTools: tools,
      confidence: 0.8,
      reasoning: 'Inferred based on task type and files'
    };
  }

  async executeTools(task: Task, inference: MCPToolInference): Promise<MCPExecutionResult> {
    // Check if task was cancelled before execution
    if (this.cancelledTasks.has(task.id)) {
      return {
        success: false,
        toolsExecuted: [],
        results: new Map(),
        errors: [{ tool: 'executor', error: 'Task was cancelled before execution' }]
      };
    }

    // Stub: simulate successful execution
    const results = new Map<string, any>();

    // Emit progress event for each tool
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

      // Simulate async tool execution with delay to allow cancellation
      await new Promise(resolve => setTimeout(resolve, 20));

      results.set(tool, { status: 'success', output: `${tool} executed successfully (stub)` });
      progress++;
      this.emit('execution_progress', {
        taskId: task.id,
        progress: (progress / totalTools) * 100,
        currentTool: tool,
        completedTools: progress,
        totalTools
      });
    }

    return {
      success: true,
      toolsExecuted: inference.inferredTools,
      results,
      errors: []
    };
  }

  async cancelTask(taskId: string): Promise<void> {
    console.log(`[MCPTaskExecutor] Task ${taskId} cancelled (stub)`);
    // Mark task as cancelled
    this.cancelledTasks.add(taskId);
    // Remove from queue
    this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
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
    return Promise.race([
      this.executeTools(task, inference),
      new Promise<MCPExecutionResult>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
      )
    ]).catch(error => ({
      success: false,
      toolsExecuted: [],
      results: new Map(),
      errors: [{ tool: 'timeout', error: error.message }]
    }));
  }

  /**
   * Execute tools with retry logic
   */
  async executeToolsWithRetry(
    task: Task,
    inference: MCPToolInference,
    maxRetries: number = 3
  ): Promise<MCPExecutionResult> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeTools(task, inference);
        if (result.success) {
          return result;
        }
        lastError = result.errors;
      } catch (error) {
        lastError = error;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      toolsExecuted: [],
      results: new Map(),
      errors: [{ tool: 'retry-failed', error: String(lastError) }]
    };
  }

  /**
   * Execute tasks in parallel
   */
  async executeTasksInParallel(tasks: Task[]): Promise<MCPExecutionResult[]> {
    const results: MCPExecutionResult[] = [];

    const batchSize = this.maxConcurrency;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async task => {
          const inference = await this.inferTools(task);
          return this.executeTools(task, inference);
        })
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Execute tasks in batches
   */
  async executeInBatches(tasks: Task[], batchSize: number): Promise<MCPExecutionResult[]> {
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
      throw new Error('Task queue is full');
    }
    this.taskQueue.push(task);
    this.metrics.queuedTasks = this.taskQueue.length;
    this.emit('task-queued', { taskId: task.id, queueSize: this.taskQueue.length });
  }

  /**
   * Set maximum concurrency
   */
  setMaxConcurrency(max: number): void {
    this.maxConcurrency = max;
  }

  /**
   * Set maximum queue size
   */
  setMaxQueueSize(max: number): void {
    this.maxQueueSize = max;
  }

  /**
   * Get task metrics
   */
  getTaskMetrics(): TaskMetrics {
    return { ...this.metrics };
  }

  /**
   * Get execution summary for a task
   */
  getExecutionSummary(taskId: string): ExecutionSummary | undefined {
    return this.executionSummaries.get(taskId);
  }

  /**
   * Provide feedback on task execution
   */
  async provideFeedback(taskId: string, feedback: { rating: number; comment?: string }): Promise<void> {
    this.emit('feedback-received', { taskId, feedback });
    console.log(`[MCPTaskExecutor] Feedback for task ${taskId}: ${feedback.rating}/5`);
  }

  /**
   * Process queued tasks
   */
  async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0) {
      const tasksToProcess = this.taskQueue.splice(0, this.maxConcurrency);
      await Promise.all(
        tasksToProcess.map(async task => {
          const inference = await this.inferTools(task);
          return this.executeTools(task, inference);
        })
      );
    }
    this.metrics.queuedTasks = 0;
    this.emit('queue-processed');
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
   * Save queue state to disk
   */
  async saveQueueState(): Promise<void> {
    // In a real implementation, this would save to disk/database
    const state = {
      queue: this.taskQueue,
      metrics: this.metrics
    };
    this.emit('queue-saved', state);
  }

  /**
   * Load queue state from disk
   */
  async loadQueueState(): Promise<void> {
    // In a real implementation, this would load from disk/database
    // For now, just emit the event
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
    successRate: number;
  } {
    return {
      queueSize: this.taskQueue.length,
      paused: this.queuePaused,
      processing: !!this.processingInterval,
      totalProcessed: this.metrics.totalExecuted,
      successRate: this.metrics.totalExecuted > 0
        ? (this.metrics.successful / this.metrics.totalExecuted) * 100
        : 0
    };
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
