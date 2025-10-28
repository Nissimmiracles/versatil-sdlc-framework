/**
 * Todo Pipeline Visualizer
 *
 * Creates ASCII art pipeline/Gantt chart visualization of todos
 * Supports:
 * - Task dependencies (depends_on)
 * - Parallel execution opportunities
 * - Timeline estimation
 * - Progress tracking
 *
 * Part of VERSATIL Pulse System (Phase 2: Session Opening Hook)
 */
export interface TodoTask {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    priority: 'high' | 'medium' | 'low';
    assignedAgent?: string;
    estimatedMinutes?: number;
    dependsOn?: string[];
    tags?: string[];
    createdAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface TodoPipeline {
    tasks: TodoTask[];
    parallelGroups: string[][];
    criticalPath: string[];
    totalEstimatedMinutes: number;
    completedMinutes: number;
    remainingMinutes: number;
}
export interface GanttChart {
    ascii: string;
    width: number;
    height: number;
    timeScale: 'minutes' | 'hours' | 'days';
}
export declare class TodoPipelineVisualizer {
    private projectRoot;
    private todosDir;
    constructor(projectRoot?: string);
    /**
     * Load all todos from todos/*.md files
     */
    loadTodos(): Promise<TodoTask[]>;
    /**
     * Parse todo markdown file
     */
    private parseTodoFile;
    /**
     * Extract tags from filename and description
     */
    private extractTags;
    /**
     * Analyze pipeline and identify parallel opportunities
     */
    analyzePipeline(): Promise<TodoPipeline>;
    /**
     * Build dependency graph
     */
    private buildDependencyGraph;
    /**
     * Find tasks that can run in parallel
     */
    private findParallelGroups;
    /**
     * Find critical path (longest dependency chain)
     */
    private findCriticalPath;
    /**
     * Generate ASCII Gantt chart
     */
    generateGanttChart(width?: number): Promise<GanttChart>;
    /**
     * Generate timeline header
     */
    private generateTimelineHeader;
    /**
     * Generate task row
     */
    private generateTaskRow;
    /**
     * Generate timeline bar for task
     */
    private generateTimelineBar;
    /**
     * Group tasks by dependency level
     */
    private groupTasksByLevel;
    /**
     * Get status icon
     */
    private getStatusIcon;
    /**
     * Get priority icon
     */
    private getPriorityIcon;
    /**
     * Utility: Center text
     */
    private centerText;
    /**
     * Utility: Pad right
     */
    private padRight;
    /**
     * Utility: Truncate text
     */
    private truncate;
}
export declare function getTodoPipelineVisualizer(projectRoot?: string): TodoPipelineVisualizer;
