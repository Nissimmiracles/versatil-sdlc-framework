/**
 * VERSATIL Session Compass
 *
 * Provides automatic context overview every time you open Cursor/Claude.
 *
 * Shows:
 * - Current development context
 * - Main plan summary
 * - Task prioritization
 * - Parallel execution opportunities
 * - Context budget status
 * - Three-tier status (backend/database/frontend)
 *
 * Integrates:
 * - SessionManager (session tracking)
 * - TaskPlanManager (task hierarchy)
 * - ContextSentinel (token monitoring)
 * - ThreeTierStatusTracker (layer monitoring)
 * - TodoPipelineVisualizer (visual pipeline)
 */
export interface ProjectContext {
    projectName: string;
    branch: string;
    gitStatus: {
        clean: boolean;
        ahead: number;
        behind: number;
        modified: number;
        untracked: number;
    };
    lastSession: {
        when: string;
        timeSaved: number;
        impactScore: number;
    } | null;
}
export interface MainPlanSummary {
    activeFeature: string | null;
    status: string;
    agentsWorking: string[];
    phases: Array<{
        number: number;
        name: string;
        status: 'completed' | 'in_progress' | 'pending';
        progress: number;
        eta: string;
    }>;
    totalETA: string;
}
export interface TaskPriority {
    priority: 'high' | 'medium' | 'low';
    tasks: Array<{
        id: string;
        description: string;
        assignedAgent: string;
        canParallel: boolean;
        dependsOn: string[];
        contextNeeded: number;
        eta: string;
    }>;
}
export interface ParallelOpportunities {
    now: string[];
    after: Record<string, string[]>;
    timeSavings: string;
}
export interface ContextBudgetStatus {
    available: number;
    allocated: number;
    reserved: number;
    remaining: number;
    status: 'healthy' | 'warning' | 'critical';
    message: string;
}
export interface ThreeTierStatus {
    backend: {
        progress: number;
        completed: number;
        total: number;
        next: string;
        recommendation: string;
    };
    database: {
        progress: number;
        status: string;
        recommendation: string;
    };
    frontend: {
        progress: number;
        completed: number;
        total: number;
        next: string;
        recommendation: string;
    };
}
export interface QuickStats {
    frameworkHealth: number;
    activeAgents: string;
    openTodos: string;
    gitStatus: string;
    lastBuild: string;
    tests: string;
}
export interface SessionCompassData {
    projectContext: ProjectContext;
    mainPlan: MainPlanSummary;
    taskPriority: {
        high: TaskPriority['tasks'];
        medium: TaskPriority['tasks'];
        low: TaskPriority['tasks'];
    };
    parallelOpportunities: ParallelOpportunities;
    contextBudget: ContextBudgetStatus;
    threeTierStatus: ThreeTierStatus;
    quickStats: QuickStats;
    timestamp: Date;
}
export declare class SessionCompass {
    private projectPath;
    constructor(projectPath?: string);
    /**
     * Main entry point: Generate complete session overview
     */
    generateOverview(): Promise<SessionCompassData>;
    /**
     * Get current project context
     */
    private getProjectContext;
    /**
     * Get git status
     */
    private getGitStatus;
    /**
     * Get current git branch
     */
    private getCurrentBranch;
    /**
     * Get last session info
     */
    private getLastSessionInfo;
    /**
     * Format time ago (e.g., "2h ago", "30m ago")
     */
    private formatTimeAgo;
    /**
     * Get main plan summary
     */
    private getMainPlanSummary;
    /**
     * Get task prioritization
     */
    private getTaskPrioritization;
    /**
     * Get parallel execution opportunities
     */
    private getParallelOpportunities;
    /**
     * Calculate time savings from parallel execution
     */
    private calculateParallelTimeSavings;
    /**
     * Get context budget status
     */
    private getContextBudget;
    /**
     * Get three-tier status
     */
    private getThreeTierStatus;
    /**
     * Get quick stats
     */
    private getQuickStats;
    /**
     * Format overview as human-readable text
     */
    formatAsText(data: SessionCompassData): string;
    /**
     * Create progress bar (10 blocks)
     */
    private createProgressBar;
    /**
     * Format overview as JSON
     */
    formatAsJSON(data: SessionCompassData): string;
    /**
     * Format overview as markdown
     */
    formatAsMarkdown(data: SessionCompassData): string;
}
