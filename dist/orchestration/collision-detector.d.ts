/**
 * VERSATIL SDLC Framework - Collision Detector
 * Detects file conflicts between parallel tasks to prevent merge conflicts
 *
 * Features:
 * - Extract file dependencies from task metadata
 * - Detect overlapping file edits between tasks
 * - Calculate collision risk levels (NONE/LOW/MEDIUM/HIGH/CRITICAL)
 * - Auto-reschedule conflicting tasks to later waves
 * - Generate collision warnings and recommendations
 *
 * @module orchestration/collision-detector
 * @version 1.0.0
 */
/**
 * Task file dependency information
 */
export interface TaskFileDependency {
    /** Task ID */
    task_id: string;
    /** Task name */
    task_name: string;
    /** Files this task will read */
    files_read: string[];
    /** Files this task will modify */
    files_modified: string[];
    /** Files this task will create */
    files_created: string[];
    /** Files this task will delete */
    files_deleted: string[];
    /** Agent assigned to this task */
    agent: string;
}
/**
 * Collision risk levels
 */
export declare enum CollisionRisk {
    NONE = "none",// No file overlap
    LOW = "low",// Read-only overlap (safe)
    MEDIUM = "medium",// Different sections of same file
    HIGH = "high",// Same file, same sections
    CRITICAL = "critical"
}
/**
 * Collision detection result
 */
export interface CollisionResult {
    /** Whether collision exists */
    has_collision: boolean;
    /** Collision risk level */
    risk: CollisionRisk;
    /** Tasks involved in collision */
    conflicting_tasks: string[];
    /** Files causing collision */
    conflicting_files: string[];
    /** Detailed collision information */
    details: CollisionDetail[];
    /** Recommended resolution strategy */
    resolution: ResolutionStrategy;
    /** Whether tasks should be serialized */
    require_serialization: boolean;
}
/**
 * Detailed collision information
 */
export interface CollisionDetail {
    /** File path */
    file: string;
    /** Tasks accessing this file */
    tasks: string[];
    /** Operation types */
    operations: Array<{
        task_id: string;
        operation: 'read' | 'modify' | 'create' | 'delete';
    }>;
    /** Collision reason */
    reason: string;
}
/**
 * Resolution strategies
 */
export declare enum ResolutionStrategy {
    ALLOW_PARALLEL = "allow_parallel",// Safe to run in parallel
    SERIALIZE = "serialize",// Force sequential execution
    RESCHEDULE = "reschedule",// Move to later wave
    MANUAL_REVIEW = "manual_review",// Requires human decision
    SPLIT_TASKS = "split_tasks"
}
export declare class CollisionDetector {
    private logger;
    constructor();
    /**
     * Detect collisions between multiple tasks
     */
    detectCollisions(tasks: TaskFileDependency[]): Promise<CollisionResult>;
    /**
     * Check if two specific tasks collide
     */
    checkTaskPairCollision(task1: TaskFileDependency, task2: TaskFileDependency): Promise<CollisionResult>;
    /**
     * Extract file dependencies from task metadata
     */
    extractFileDependencies(taskMetadata: {
        task_id: string;
        task_name: string;
        files_involved?: string[];
        agent?: string;
    }): TaskFileDependency;
    /**
     * Generate collision report
     */
    generateCollisionReport(result: CollisionResult): string;
    /**
     * Build map of files to tasks accessing them
     */
    private buildFileAccessMap;
    /**
     * Analyze collision for a specific file
     */
    private analyzeFileCollision;
    /**
     * Determine resolution strategy based on risk
     */
    private determineResolution;
    /**
     * Check if resolution requires serialization
     */
    private requiresSerialization;
    /**
     * Get numeric risk level for comparison
     */
    private getRiskLevel;
    /**
     * Get risk icon for display
     */
    private getRiskIcon;
    /**
     * Get resolution recommendation message
     */
    private getResolutionRecommendation;
    /**
     * Get total file count across all tasks
     */
    private getTotalFileCount;
}
export default CollisionDetector;
