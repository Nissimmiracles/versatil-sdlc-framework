/**
 * @fileoverview Parallel Task Detector - Detect and group parallel tasks
 *
 * Identifies tasks that can run in parallel, groups them by execution level,
 * and validates parallel execution safety.
 *
 * @module planning/parallel-task-detector
 * @version 1.0.0
 */
import { ParsedPlanPhase } from './plan-parser.js';
/**
 * Parallel execution group
 */
export interface ParallelGroup {
    /** Group identifier */
    groupId: string;
    /** Phase numbers in this parallel group */
    phaseNumbers: number[];
    /** Agent names involved */
    agents: string[];
    /** Maximum duration in group (bottleneck) */
    maxDuration: number;
    /** Total estimated duration if run sequentially */
    sequentialDuration: number;
    /** Time saved by parallel execution */
    timeSavings: number;
    /** Execution level (0 = can start immediately) */
    level: number;
}
/**
 * Parallel execution analysis
 */
export interface ParallelExecutionAnalysis {
    /** All identified parallel groups */
    groups: ParallelGroup[];
    /** Sequential execution time (no parallelization) */
    sequentialTime: number;
    /** Parallel execution time (with parallelization) */
    parallelTime: number;
    /** Total time saved */
    totalTimeSavings: number;
    /** Percentage faster */
    percentageFaster: number;
    /** Execution order (phases grouped by level) */
    executionOrder: number[][];
}
/**
 * Parallel safety check result
 */
export interface ParallelSafetyCheck {
    /** Whether parallel execution is safe */
    isSafe: boolean;
    /** Safety issues detected */
    issues: string[];
    /** Warnings (non-blocking) */
    warnings: string[];
    /** Recommendations for optimization */
    recommendations: string[];
}
export declare class ParallelTaskDetector {
    private logger;
    constructor();
    /**
     * Analyze phases for parallel execution opportunities
     */
    analyze(phases: ParsedPlanPhase[]): Promise<ParallelExecutionAnalysis>;
    /**
     * Check if parallel execution is safe
     */
    checkSafety(phases: ParsedPlanPhase[]): Promise<ParallelSafetyCheck>;
    /**
     * Build execution order respecting dependencies
     */
    private buildExecutionOrder;
    /**
     * Identify parallel groups from execution order
     */
    private identifyParallelGroups;
    /**
     * Calculate sequential execution time (no parallelization)
     */
    private calculateSequentialTime;
    /**
     * Calculate parallel execution time (with parallelization)
     */
    private calculateParallelTime;
    /**
     * Detect circular dependencies
     */
    private detectCircularDependencies;
    /**
     * Detect agent conflicts (same agent on parallel tasks)
     */
    private detectAgentConflicts;
    /**
     * Detect tasks that could run in parallel but aren't marked
     */
    private detectUnmarkedParallelTasks;
    /**
     * Format parallel progress for statusline display
     */
    formatParallelProgress(group: ParallelGroup, progress: Map<number, number>): string;
}
export default ParallelTaskDetector;
