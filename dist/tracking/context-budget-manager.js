/**
 * Context Budget Manager
 *
 * Manages context token budget and provides smart task deferral
 * Integrates with ContextSentinel for real-time token tracking
 *
 * Features:
 * - Real-time token usage monitoring via ContextSentinel
 * - Smart task deferral when approaching limits
 * - Context allocation prediction
 * - Priority-based task scheduling
 *
 * Part of VERSATIL Pulse System (Phase 2: Session Opening Hook)
 */
import { ContextSentinel } from '../agents/monitoring/context-sentinel.js';
export class ContextBudgetManager {
    constructor() {
        // Context limits
        this.TOTAL_CONTEXT = 200000; // Claude's context window
        this.SAFE_THRESHOLD = 180000; // 90% - start warning
        this.EMERGENCY_BUFFER = 15000; // Reserved for critical operations
        this.CRITICAL_THRESHOLD = 170000; // 85% - start deferring
        // Active allocations
        this.allocations = new Map();
        this.deferredTasks = new Set();
        this.contextSentinel = new ContextSentinel();
        // Start monitoring context in background
        this.contextSentinel.startMonitoring();
    }
    /**
     * Get current context budget status
     */
    async getBudgetStatus() {
        // Get real-time usage from ContextSentinel (if available)
        const currentUsage = await this.getCurrentContextUsage();
        const allocated = this.getAllocatedTokens();
        const reserved = this.EMERGENCY_BUFFER;
        const used = currentUsage;
        const remaining = Math.max(0, this.TOTAL_CONTEXT - used - reserved);
        const usagePercent = Math.round((used / this.TOTAL_CONTEXT) * 100);
        let status;
        let message;
        if (used >= this.CRITICAL_THRESHOLD) {
            status = 'critical';
            message = 'Context approaching limit - deferring low-priority tasks automatically';
        }
        else if (used >= this.SAFE_THRESHOLD) {
            status = 'warning';
            message = 'Context usage high - consider deferring non-critical tasks';
        }
        else {
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
    async getCurrentContextUsage() {
        try {
            // Get real-time usage from ContextSentinel
            const dashboard = await this.contextSentinel.runContextCheck();
            return dashboard.usage.totalTokens;
        }
        catch (error) {
            // Fallback: Use allocated tokens as estimate if sentinel unavailable
            console.warn('[ContextBudgetManager] ContextSentinel unavailable, using allocation estimate');
            return this.getAllocatedTokens();
        }
    }
    /**
     * Get total allocated tokens
     */
    getAllocatedTokens() {
        return Array.from(this.allocations.values()).reduce((sum, alloc) => sum + alloc.allocatedTokens, 0);
    }
    /**
     * Request context allocation for a task
     */
    async requestAllocation(task) {
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
            }
            else {
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
    deallocate(taskId) {
        this.allocations.delete(taskId);
        this.deferredTasks.delete(taskId);
    }
    /**
     * Recommend which tasks to defer
     */
    async recommendDeferral(newTasks) {
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
        const currentAllocations = Array.from(this.allocations.values()).sort((a, b) => this.priorityValue(a.priority) - this.priorityValue(b.priority));
        // Select tasks to defer
        const tasksToDefer = [];
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
    priorityValue(priority) {
        const values = { high: 3, medium: 2, low: 1 };
        return values[priority];
    }
    /**
     * Estimate context tokens needed for a task
     */
    estimateTaskTokens(task) {
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
    getDeferredTasks() {
        return Array.from(this.deferredTasks);
    }
    /**
     * Clear all allocations (reset)
     */
    clear() {
        this.allocations.clear();
        this.deferredTasks.clear();
    }
    /**
     * Stop context monitoring and cleanup resources
     */
    destroy() {
        this.contextSentinel.stopMonitoring();
        this.clear();
    }
    /**
     * Get allocation summary
     */
    getAllocationSummary() {
        const allocArray = Array.from(this.allocations.values());
        const byPriority = allocArray.reduce((acc, alloc) => {
            acc[alloc.priority] = (acc[alloc.priority] || 0) + alloc.allocatedTokens;
            return acc;
        }, {});
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
    async predictAllocation(tasks) {
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
    async visualizeBudget(width = 50) {
        const budget = await this.getBudgetStatus();
        const lines = [];
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
    centerText(text, width) {
        const padding = Math.max(0, width - text.length);
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    }
    /**
     * Utility: Format number with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}
// Export singleton instance
let _managerInstance = null;
export function getContextBudgetManager() {
    if (!_managerInstance) {
        _managerInstance = new ContextBudgetManager();
    }
    return _managerInstance;
}
//# sourceMappingURL=context-budget-manager.js.map