/**
 * Context Statistics Visualizer
 *
 * Provides visualization and formatting utilities for context statistics.
 * Generates charts, tables, and formatted output for CLI display.
 *
 * Part of Phase 2: Context Editing Enhancement
 */
import { ContextStatistics, ContextClearEvent, MemoryOperation } from './context-stats-tracker.js';
export interface VisualizationConfig {
    maxBarLength: number;
    useColors: boolean;
    showTimestamps: boolean;
    compactMode: boolean;
}
export interface ChartData {
    labels: string[];
    values: number[];
    maxValue: number;
}
export declare class ContextStatsVisualizer {
    private config;
    constructor(config?: Partial<VisualizationConfig>);
    /**
     * Generate horizontal bar chart from data
     */
    generateBarChart(data: ChartData, symbol?: string): string[];
    /**
     * Format memory operations by type as chart data
     */
    formatMemoryOperationsByType(memoryOperationsByType: Record<string, number>): ChartData;
    /**
     * Format clear events by agent as chart data
     */
    formatClearEventsByAgent(clearEventsByAgent: Record<string, number>): ChartData;
    /**
     * Generate summary statistics display
     */
    formatSummaryStatistics(stats: ContextStatistics): string[];
    /**
     * Format clear event details
     */
    formatClearEvent(event: ContextClearEvent): string[];
    /**
     * Format memory operations table
     */
    formatMemoryOperations(operations: MemoryOperation[], limit?: number): string[];
    /**
     * Generate efficiency metrics display
     */
    formatEfficiencyMetrics(stats: ContextStatistics): string[];
    /**
     * Generate dashboard view combining all sections
     */
    generateDashboard(stats: ContextStatistics): string[];
    /**
     * Generate markdown report
     */
    generateMarkdownReport(stats: ContextStatistics, recentEvents: ContextClearEvent[]): string;
    private formatNumber;
    private formatUptime;
    private formatDuration;
    private formatRelativeTime;
}
/**
 * Export utilities for CLI usage
 */
export declare function createDashboard(stats: ContextStatistics): string;
export declare function createMarkdownReport(stats: ContextStatistics, recentEvents: ContextClearEvent[]): string;
