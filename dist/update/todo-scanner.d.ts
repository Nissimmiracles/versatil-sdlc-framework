/**
 * VERSATIL SDLC Framework - Todo Scanner
 * Scans and analyzes todos/*.md files for open work and stale items
 */
export interface TodoItem {
    filename: string;
    number: string;
    status: 'pending' | 'resolved';
    priority: 'p1' | 'p2' | 'p3' | 'p4';
    description: string;
    age: number;
    createdDate: Date | null;
    assignedAgent: string | null;
    estimatedEffort: string | null;
}
export interface TodoSummary {
    total: number;
    pending: number;
    resolved: number;
    byPriority: {
        p1: number;
        p2: number;
        p3: number;
        p4: number;
    };
    byAgent: Record<string, number>;
    stale: TodoItem[];
    recent: TodoItem[];
    oldestPending: TodoItem | null;
    newestPending: TodoItem | null;
}
export interface TodoAnalysisOptions {
    todosDir?: string;
    staleThresholdDays?: number;
    recentThresholdDays?: number;
    includeResolved?: boolean;
}
export declare class TodoScanner {
    private todosDir;
    private staleThresholdDays;
    private recentThresholdDays;
    constructor(options?: TodoAnalysisOptions);
    /**
     * Scan all todos and generate summary
     */
    scanTodos(includeResolved?: boolean): Promise<TodoSummary>;
    /**
     * Parse a single todo file
     */
    private parseTodoFile;
    /**
     * Extract created date from file content
     */
    private extractCreatedDate;
    /**
     * Extract assigned agent from file content
     */
    private extractAssignedAgent;
    /**
     * Extract estimated effort from file content
     */
    private extractEstimatedEffort;
    /**
     * Generate summary from parsed todos
     */
    private generateSummary;
    /**
     * Get empty summary (fallback)
     */
    private getEmptySummary;
    /**
     * Get detailed todo information
     */
    getTodoDetails(number: string): Promise<TodoItem | null>;
    /**
     * Get todos by priority
     */
    getTodosByPriority(priority: 'p1' | 'p2' | 'p3' | 'p4'): Promise<TodoItem[]>;
    /**
     * Get todos by agent
     */
    getTodosByAgent(agentName: string): Promise<TodoItem[]>;
    /**
     * Format summary for console output
     */
    formatSummary(summary: TodoSummary): string;
    /**
     * Format recommendations based on summary
     */
    formatRecommendations(summary: TodoSummary): string[];
    /**
     * Export summary to JSON
     */
    exportSummaryToJSON(outputPath?: string): Promise<string>;
}
/**
 * Default todo scanner instance
 */
export declare const defaultTodoScanner: TodoScanner;
