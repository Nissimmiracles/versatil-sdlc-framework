/**
 * Context Budget Manager
 *
 * Manages context token budget and provides smart task deferral
 * Integrates with ContextSentinel for real-time token tracking
 *
 * Features:
 * - Real-time token usage monitoring
 * - Smart task deferral when approaching limits
 * - Context allocation prediction
 * - Priority-based task scheduling
 *
 * Part of VERSATIL Pulse System (Phase 2: Session Opening Hook)
 */

export interface ContextBudget {
  available: number;    // Total context window size (e.g., 200000)
  allocated: number;    // Tokens allocated to active tasks
  reserved: number;     // Emergency buffer (never use)
  remaining: number;    // Available for new tasks
  used: number;         // Currently consumed tokens
  usagePercent: number; // Percentage of budget used
  status: 'healthy' | 'warning' | 'critical';
  message: string;
}

export interface TaskContextRequirement {
  taskId: string;
  description: string;
  estimatedTokens: number;
  priority: 'high' | 'medium' | 'low';
  canDefer: boolean;
}

export interface ContextAllocation {
  taskId: string;
  allocatedTokens: number;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

export interface DeferralRecommendation {
  shouldDefer: boolean;
  tasksToDefer: string[]; // Task IDs to defer
  reason: string;
  alternativeSuggestion?: string;
}

export class ContextBudgetManager {
  // Context limits
  private readonly TOTAL_CONTEXT: number = 200_000; // Claude's context window
  private readonly SAFE_THRESHOLD: number = 180_000; // 90% - start warning
  private readonly EMERGENCY_BUFFER: number = 15_000; // Reserved for critical operations
  private readonly CRITICAL_THRESHOLD: number = 170_000; // 85% - start deferring

  // Active allocations
  private allocations: Map<string, ContextAllocation> = new Map();
  private deferredTasks: Set<string> = new Set();

  /**
   * Get current context budget status
   */
  async getBudgetStatus(): Promise<ContextBudget> {
    // Get real-time usage from ContextSentinel (if available)
    const currentUsage = await this.getCurrentContextUsage();

    const allocated = this.getAllocatedTokens();
    const reserved = this.EMERGENCY_BUFFER;
    const used = currentUsage;
    const remaining = Math.max(0, this.TOTAL_CONTEXT - used - reserved);
    const usagePercent = Math.round((used / this.TOTAL_CONTEXT) * 100);

    let status: ContextBudget['status'];
    let message: string;

    if (used >= this.CRITICAL_THRESHOLD) {
      status = 'critical';
      message = 'Context approaching limit - deferring low-priority tasks automatically';
    } else if (used >= this.SAFE_THRESHOLD) {
      status = 'warning';
      message = 'Context usage high - consider deferring non-critical tasks';
    } else {
      status = 'healthy';
      message = 'Plenty of context available for all tasks';
    }

    return {
      available: this.TOTAL_CONTEXT,
      allocated,
      reserved,
      remaining,
      used,
      usagePercent,
      status,
      message
    };
  }

  /**
   * Get current context usage from ContextSentinel
   */
  private async getCurrentContextUsage(): Promise<number> {
    try {
      // Try to import ContextSentinel
      const { ContextSentinel } = await import('../intelligence/context-sentinel.js');
      const sentinel = new ContextSentinel();
      const stats = await sentinel.getContextStats();

      // Estimate current usage from input tokens
      return stats.currentInputTokens || 0;
    } catch (error) {
      // Fallback: Estimate from allocations if ContextSentinel unavailable
      return this.getAllocatedTokens();
    }
  }

  /**
   * Get total allocated tokens
   */
  private getAllocatedTokens(): number {
    return Array.from(this.allocations.values()).reduce(
      (sum, alloc) => sum + alloc.allocatedTokens,
      0
    );
  }

  /**
   * Request context allocation for a task
   */
  async requestAllocation(task: TaskContextRequirement): Promise<boolean> {
    const budget = await this.getBudgetStatus();

    // Check if enough context available
    if (task.estimatedTokens > budget.remaining) {
      // Try to defer lower priority tasks
      const deferralRec = await this.recommendDeferral([task]);

      if (deferralRec.shouldDefer) {
        // Defer lower priority tasks to make room
        for (const taskId of deferralRec.tasksToDefer) {
          this.deallocate(taskId);
          this.deferredTasks.add(taskId);
        }
      } else {
        // Cannot allocate
        return false;
      }
    }

    // Allocate tokens
    this.allocations.set(task.taskId, {
      taskId: task.taskId,
      allocatedTokens: task.estimatedTokens,
      timestamp: new Date(),
      priority: task.priority
    });

    return true;
  }

  /**
   * Release context allocation for a completed task
   */
  deallocate(taskId: string): void {
    this.allocations.delete(taskId);
    this.deferredTasks.delete(taskId);
  }

  /**
   * Recommend which tasks to defer
   */
  async recommendDeferral(
    newTasks: TaskContextRequirement[]
  ): Promise<DeferralRecommendation> {
    const budget = await this.getBudgetStatus();

    // Calculate total tokens needed for new tasks
    const tokensNeeded = newTasks.reduce((sum, t) => sum + t.estimatedTokens, 0);

    // Check if deferral is necessary
    if (budget.remaining >= tokensNeeded) {
      return {
        shouldDefer: false,
        tasksToDefer: [],
        reason: 'Sufficient context available for all tasks'
      };
    }

    // Calculate how many tokens we need to free
    const tokensToFree = tokensNeeded - budget.remaining;

    // Get current allocations sorted by priority (low priority first)
    const currentAllocations = Array.from(this.allocations.values()).sort(
      (a, b) => this.priorityValue(a.priority) - this.priorityValue(b.priority)
    );

    // Select tasks to defer
    const tasksToDefer: string[] = [];
    let freedTokens = 0;

    for (const alloc of currentAllocations) {
      // Only defer low/medium priority tasks
      if (alloc.priority === 'high') {
        continue;
      }

      tasksToDefer.push(alloc.taskId);
      freedTokens += alloc.allocatedTokens;

      if (freedTokens >= tokensToFree) {
        break;
      }
    }

    // Check if we freed enough tokens
    if (freedTokens < tokensToFree) {
      return {
        shouldDefer: false,
        tasksToDefer: [],
        reason: 'Cannot defer enough tasks - all remaining tasks are high priority',
        alternativeSuggestion: 'Consider clearing old context or splitting tasks'
      };
    }

    return {
      shouldDefer: true,
      tasksToDefer,
      reason: `Deferring ${tasksToDefer.length} low-priority tasks to free ${freedTokens} tokens`,
      alternativeSuggestion: 'Complete deferred tasks after high-priority work'
    };
  }

  /**
   * Get priority numeric value for sorting
   */
  private priorityValue(priority: 'high' | 'medium' | 'low'): number {
    const values = { high: 3, medium: 2, low: 1 };
    return values[priority];
  }

  /**
   * Estimate context tokens needed for a task
   */
  estimateTaskTokens(task: {
    description: string;
    codeFiles?: string[];
    dependencies?: string[];
  }): number {
    // Base estimate from description length
    let estimate = Math.ceil(task.description.length / 4); // ~4 chars per token

    // Add estimate for code files (if known)
    if (task.codeFiles) {
      estimate += task.codeFiles.length * 500; // ~500 tokens per file average
    }

    // Add estimate for dependencies
    if (task.dependencies) {
      estimate += task.dependencies.length * 200; // ~200 tokens per dependency
    }

    // Add buffer for agent responses and tool calls
    estimate = Math.ceil(estimate * 1.5); // 50% buffer

    return estimate;
  }

  /**
   * Get list of deferred tasks
   */
  getDeferredTasks(): string[] {
    return Array.from(this.deferredTasks);
  }

  /**
   * Clear all allocations (reset)
   */
  clear(): void {
    this.allocations.clear();
    this.deferredTasks.clear();
  }

  /**
   * Get allocation summary
   */
  getAllocationSummary(): {
    total: number;
    byPriority: Record<string, number>;
    topAllocations: Array<{ taskId: string; tokens: number; priority: string }>;
  } {
    const allocArray = Array.from(this.allocations.values());

    const byPriority = allocArray.reduce((acc, alloc) => {
      acc[alloc.priority] = (acc[alloc.priority] || 0) + alloc.allocatedTokens;
      return acc;
    }, {} as Record<string, number>);

    const topAllocations = allocArray
      .sort((a, b) => b.allocatedTokens - a.allocatedTokens)
      .slice(0, 5)
      .map(alloc => ({
        taskId: alloc.taskId,
        tokens: alloc.allocatedTokens,
        priority: alloc.priority
      }));

    return {
      total: this.getAllocatedTokens(),
      byPriority,
      topAllocations
    };
  }

  /**
   * Predict if task set will fit in context
   */
  async predictAllocation(tasks: TaskContextRequirement[]): Promise<{
    canFitAll: boolean;
    canFitWithDeferral: boolean;
    tokensNeeded: number;
    tokensAvailable: number;
    deferralNeeded: string[];
  }> {
    const budget = await this.getBudgetStatus();
    const tokensNeeded = tasks.reduce((sum, t) => sum + t.estimatedTokens, 0);

    const canFitAll = tokensNeeded <= budget.remaining;

    if (canFitAll) {
      return {
        canFitAll: true,
        canFitWithDeferral: true,
        tokensNeeded,
        tokensAvailable: budget.remaining,
        deferralNeeded: []
      };
    }

    // Check if we can fit with deferral
    const deferralRec = await this.recommendDeferral(tasks);

    return {
      canFitAll: false,
      canFitWithDeferral: deferralRec.shouldDefer,
      tokensNeeded,
      tokensAvailable: budget.remaining,
      deferralNeeded: deferralRec.tasksToDefer
    };
  }

  /**
   * Generate context budget visualization (ASCII art)
   */
  async visualizeBudget(width: number = 50): Promise<string> {
    const budget = await this.getBudgetStatus();

    const lines: string[] = [];

    // Header
    lines.push('╔' + '═'.repeat(width - 2) + '╗');
    lines.push('║' + this.centerText('CONTEXT BUDGET', width - 2) + '║');
    lines.push('╠' + '═'.repeat(width - 2) + '╣');

    // Status
    const statusIcon = budget.status === 'healthy' ? '🟢' : budget.status === 'warning' ? '🟡' : '🔴';
    lines.push(`║ Status: ${statusIcon} ${budget.status.toUpperCase()}`);
    lines.push(`║ ${budget.message}`);
    lines.push('╠' + '═'.repeat(width - 2) + '╣');

    // Metrics
    lines.push(`║ Available:  ${this.formatNumber(budget.available)} tokens`);
    lines.push(`║ Used:       ${this.formatNumber(budget.used)} tokens`);
    lines.push(`║ Allocated:  ${this.formatNumber(budget.allocated)} tokens`);
    lines.push(`║ Reserved:   ${this.formatNumber(budget.reserved)} tokens`);
    lines.push(`║ Remaining:  ${this.formatNumber(budget.remaining)} tokens`);
    lines.push('╠' + '═'.repeat(width - 2) + '╣');

    // Progress bar
    const barWidth = width - 10;
    const usedWidth = Math.round((budget.usagePercent / 100) * barWidth);
    const bar = '█'.repeat(usedWidth) + '░'.repeat(barWidth - usedWidth);
    lines.push(`║ ${bar} ${budget.usagePercent}%`);

    // Footer
    lines.push('╚' + '═'.repeat(width - 2) + '╝');

    return lines.join('\n');
  }

  /**
   * Utility: Center text
   */
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, width - text.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  }

  /**
   * Utility: Format number with commas
   */
  private formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

// Export singleton instance
let _managerInstance: ContextBudgetManager | null = null;

export function getContextBudgetManager(): ContextBudgetManager {
  if (!_managerInstance) {
    _managerInstance = new ContextBudgetManager();
  }
  return _managerInstance;
}
