/**
 * Context Statistics Visualizer
 *
 * Provides visualization and formatting utilities for context statistics.
 * Generates charts, tables, and formatted output for CLI display.
 *
 * Part of Phase 2: Context Editing Enhancement
 */
export class ContextStatsVisualizer {
    constructor(config = {}) {
        this.config = {
            maxBarLength: 50,
            useColors: true,
            showTimestamps: true,
            compactMode: false,
            ...config
        };
    }
    /**
     * Generate horizontal bar chart from data
     */
    generateBarChart(data, symbol = '█') {
        const lines = [];
        const { maxBarLength } = this.config;
        data.labels.forEach((label, i) => {
            const value = data.values[i];
            const percentage = data.maxValue > 0 ? value / data.maxValue : 0;
            const barLength = Math.round(percentage * maxBarLength);
            const bar = symbol.repeat(Math.max(0, barLength));
            lines.push(`  ${label.padEnd(20)}: ${bar} ${value}`);
        });
        return lines;
    }
    /**
     * Format memory operations by type as chart data
     */
    formatMemoryOperationsByType(memoryOperationsByType) {
        const entries = Object.entries(memoryOperationsByType).sort((a, b) => b[1] - a[1]);
        return {
            labels: entries.map(([type]) => type),
            values: entries.map(([, count]) => count),
            maxValue: Math.max(...entries.map(([, count]) => count), 1)
        };
    }
    /**
     * Format clear events by agent as chart data
     */
    formatClearEventsByAgent(clearEventsByAgent) {
        const entries = Object.entries(clearEventsByAgent).sort((a, b) => b[1] - a[1]);
        return {
            labels: entries.map(([agent]) => agent),
            values: entries.map(([, count]) => count),
            maxValue: Math.max(...entries.map(([, count]) => count), 1)
        };
    }
    /**
     * Generate summary statistics display
     */
    formatSummaryStatistics(stats) {
        const lines = [];
        lines.push('📈 Summary Statistics');
        lines.push('');
        lines.push(`  Total Tokens Processed: ${this.formatNumber(stats.totalTokensProcessed)}`);
        lines.push(`  Total Clear Events: ${stats.totalClearEvents}`);
        lines.push(`  Total Tokens Saved: ${this.formatNumber(stats.totalTokensSaved)}`);
        lines.push(`  Avg Tokens per Clear: ${this.formatNumber(Math.round(stats.avgTokensPerClear))}`);
        lines.push(`  Total Memory Operations: ${stats.totalMemoryOperations}`);
        lines.push(`  Uptime: ${this.formatUptime(stats.uptime)}`);
        return lines;
    }
    /**
     * Format clear event details
     */
    formatClearEvent(event) {
        const lines = [];
        if (this.config.showTimestamps) {
            lines.push(`  Timestamp: ${event.timestamp.toISOString()}`);
        }
        lines.push(`  Input Tokens: ${this.formatNumber(event.inputTokens)}`);
        lines.push(`  Tool Uses Cleared: ${event.toolUsesCleared}`);
        lines.push(`  Tokens Saved: ${this.formatNumber(event.tokensSaved)}`);
        if (event.agentId) {
            lines.push(`  Agent: ${event.agentId}`);
        }
        lines.push(`  Trigger: ${event.triggerType} (${this.formatNumber(event.triggerValue)})`);
        return lines;
    }
    /**
     * Format memory operations table
     */
    formatMemoryOperations(operations, limit = 10) {
        const lines = [];
        lines.push('📝 Recent Memory Operations');
        lines.push('');
        const recentOps = operations.slice(-limit).reverse();
        if (recentOps.length === 0) {
            lines.push('  No operations recorded yet.');
            return lines;
        }
        recentOps.forEach((op, i) => {
            const timestamp = this.config.showTimestamps
                ? op.timestamp.toISOString()
                : this.formatRelativeTime(op.timestamp);
            const status = op.success ? '✅' : '❌';
            const agent = op.agentId ? ` (${op.agentId})` : '';
            lines.push(`  ${i + 1}. ${status} ${op.operation} - ${op.path}${agent}`);
            if (this.config.showTimestamps) {
                lines.push(`     ${timestamp}`);
            }
        });
        return lines;
    }
    /**
     * Generate efficiency metrics display
     */
    formatEfficiencyMetrics(stats) {
        const lines = [];
        lines.push('⚡ Efficiency Metrics');
        lines.push('');
        const savingsRate = stats.totalTokensProcessed > 0
            ? (stats.totalTokensSaved / stats.totalTokensProcessed) * 100
            : 0;
        const opsPerClear = stats.totalClearEvents > 0
            ? stats.totalMemoryOperations / stats.totalClearEvents
            : 0;
        lines.push(`  Token Savings Rate: ${savingsRate.toFixed(2)}%`);
        lines.push(`  Memory Ops per Clear: ${opsPerClear.toFixed(2)}`);
        if (stats.totalClearEvents > 0) {
            const avgClearInterval = stats.uptime / stats.totalClearEvents;
            lines.push(`  Avg Time Between Clears: ${this.formatDuration(avgClearInterval)}`);
        }
        return lines;
    }
    /**
     * Generate dashboard view combining all sections
     */
    generateDashboard(stats) {
        const lines = [];
        // Header
        lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        lines.push('  📊 VERSATIL Context Statistics Dashboard');
        lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        lines.push('');
        // Summary statistics
        lines.push(...this.formatSummaryStatistics(stats));
        lines.push('');
        // Memory operations chart
        if (Object.keys(stats.memoryOperationsByType).length > 0) {
            lines.push('🔧 Memory Operations by Type');
            lines.push('');
            const chartData = this.formatMemoryOperationsByType(stats.memoryOperationsByType);
            lines.push(...this.generateBarChart(chartData));
            lines.push('');
        }
        // Clear events chart
        if (Object.keys(stats.clearEventsByAgent).length > 0) {
            lines.push('📊 Clear Events by Agent');
            lines.push('');
            const chartData = this.formatClearEventsByAgent(stats.clearEventsByAgent);
            lines.push(...this.generateBarChart(chartData, '█'));
            lines.push('');
        }
        // Last clear event
        if (stats.lastClearEvent) {
            lines.push('⏱️  Last Clear Event');
            lines.push('');
            lines.push(...this.formatClearEvent(stats.lastClearEvent));
            lines.push('');
        }
        // Efficiency metrics
        lines.push(...this.formatEfficiencyMetrics(stats));
        lines.push('');
        // Footer
        lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return lines;
    }
    /**
     * Generate markdown report
     */
    generateMarkdownReport(stats, recentEvents) {
        const lines = [];
        lines.push('# Context Management Report');
        lines.push('');
        lines.push(`**Generated**: ${new Date().toISOString()}`);
        lines.push('');
        // Summary
        lines.push('## Summary Statistics');
        lines.push('');
        lines.push(`- **Total Tokens Processed**: ${this.formatNumber(stats.totalTokensProcessed)}`);
        lines.push(`- **Total Clear Events**: ${stats.totalClearEvents}`);
        lines.push(`- **Total Tokens Saved**: ${this.formatNumber(stats.totalTokensSaved)}`);
        lines.push(`- **Avg Tokens Saved per Clear**: ${this.formatNumber(Math.round(stats.avgTokensPerClear))}`);
        lines.push(`- **Total Memory Operations**: ${stats.totalMemoryOperations}`);
        lines.push(`- **Uptime**: ${this.formatUptime(stats.uptime)}`);
        lines.push('');
        // Charts
        if (Object.keys(stats.memoryOperationsByType).length > 0) {
            lines.push('## Memory Operations by Type');
            lines.push('');
            Object.entries(stats.memoryOperationsByType)
                .sort((a, b) => b[1] - a[1])
                .forEach(([type, count]) => {
                lines.push(`- **${type}**: ${count} operations`);
            });
            lines.push('');
        }
        if (Object.keys(stats.clearEventsByAgent).length > 0) {
            lines.push('## Clear Events by Agent');
            lines.push('');
            Object.entries(stats.clearEventsByAgent)
                .sort((a, b) => b[1] - a[1])
                .forEach(([agent, count]) => {
                lines.push(`- **${agent}**: ${count} clears`);
            });
            lines.push('');
        }
        // Recent events
        if (recentEvents.length > 0) {
            lines.push('## Recent Clear Events (Last 5)');
            lines.push('');
            recentEvents.slice(-5).reverse().forEach(event => {
                lines.push(`### ${event.timestamp.toISOString()} ${event.agentId ? `(${event.agentId})` : ''}`);
                lines.push(`- Input Tokens: ${this.formatNumber(event.inputTokens)}`);
                lines.push(`- Tool Uses Cleared: ${event.toolUsesCleared}`);
                lines.push(`- Tokens Saved: ${this.formatNumber(event.tokensSaved)}`);
                lines.push(`- Trigger: ${event.triggerType} (${this.formatNumber(event.triggerValue)})`);
                lines.push('');
            });
        }
        // Efficiency metrics
        lines.push('## Efficiency Metrics');
        lines.push('');
        const savingsRate = stats.totalTokensProcessed > 0
            ? (stats.totalTokensSaved / stats.totalTokensProcessed) * 100
            : 0;
        const opsPerClear = stats.totalClearEvents > 0
            ? stats.totalMemoryOperations / stats.totalClearEvents
            : 0;
        lines.push(`- **Token Savings Rate**: ${savingsRate.toFixed(2)}%`);
        lines.push(`- **Memory Ops per Clear**: ${opsPerClear.toFixed(2)}`);
        lines.push(`- **Uptime**: ${this.formatUptime(stats.uptime)}`);
        lines.push('');
        lines.push('---');
        lines.push('*Generated by VERSATIL Context Stats Tracker*');
        return lines.join('\n');
    }
    // Formatting utilities
    formatNumber(num) {
        return num.toLocaleString();
    }
    formatUptime(seconds) {
        const hours = seconds / 3600;
        const days = hours / 24;
        if (days >= 1) {
            return `${days.toFixed(1)} days (${hours.toFixed(1)} hours)`;
        }
        else if (hours >= 1) {
            return `${hours.toFixed(2)} hours`;
        }
        else {
            return `${(seconds / 60).toFixed(1)} minutes`;
        }
    }
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        }
        else if (seconds < 3600) {
            return `${Math.round(seconds / 60)}m`;
        }
        else {
            return `${(seconds / 3600).toFixed(1)}h`;
        }
    }
    formatRelativeTime(date) {
        const now = Date.now();
        const diff = now - date.getTime();
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60) {
            return `${seconds}s ago`;
        }
        else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)}m ago`;
        }
        else if (seconds < 86400) {
            return `${Math.floor(seconds / 3600)}h ago`;
        }
        else {
            return `${Math.floor(seconds / 86400)}d ago`;
        }
    }
}
/**
 * Export utilities for CLI usage
 */
export function createDashboard(stats) {
    const visualizer = new ContextStatsVisualizer();
    return visualizer.generateDashboard(stats).join('\n');
}
export function createMarkdownReport(stats, recentEvents) {
    const visualizer = new ContextStatsVisualizer();
    return visualizer.generateMarkdownReport(stats, recentEvents);
}
//# sourceMappingURL=context-stats-visualizer.js.map