/**
 * VERSATIL SDLC Framework - Parallel Task Manager
 * Implements Rule 1: Run many tasks in parallel if not colliding with SDLC process
 *
 * Features:
 * - Intelligent collision detection
 * - SDLC process-aware task orchestration
 * - Resource contention prevention
 * - Agent coordination and handoff management
 */
import { EventEmitter } from 'events';
/**
 * TodoWrite Integration
 *
 * Note: TodoWrite is a Claude Code tool (not imported as a module).
 * It's invoked by Claude directly during parallel task execution to:
 * 1. Create todos when tasks start
 * 2. Update progress (0-100%)
 * 3. Mark todos complete when tasks finish
 *
 * This integration emits 'todowrite:*' events that Claude monitors
 * to keep users informed of parallel task progress.
 */
export interface Task {
    id: string;
    name: string;
    type: TaskType;
    priority: Priority;
    estimatedDuration: number;
    requiredResources: Resource[];
    dependencies: string[];
    agentId?: string;
    sdlcPhase: SDLCPhase;
    collisionRisk: CollisionRisk;
    metadata: Record<string, any>;
}
export declare enum TaskType {
    DEVELOPMENT = "development",
    TESTING = "testing",
    BUILD = "build",
    DEPLOYMENT = "deployment",
    QUALITY_ASSURANCE = "quality_assurance",
    DOCUMENTATION = "documentation",
    ANALYSIS = "analysis",
    MONITORING = "monitoring",
    SECURITY = "security"
}
export declare enum Priority {
    CRITICAL = 1,
    HIGH = 2,
    MEDIUM = 3,
    LOW = 4,
    BACKGROUND = 5
}
export declare enum SDLCPhase {
    PLANNING = "planning",
    ANALYSIS = "analysis",
    DESIGN = "design",
    IMPLEMENTATION = "implementation",
    TESTING = "testing",
    DEPLOYMENT = "deployment",
    MAINTENANCE = "maintenance"
}
export declare enum CollisionRisk {
    NONE = "none",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface Resource {
    type: ResourceType;
    name: string;
    capacity: number;
    exclusive: boolean;
}
export declare enum ResourceType {
    FILE_SYSTEM = "file_system",
    DATABASE = "database",
    NETWORK = "network",
    CPU = "cpu",
    MEMORY = "memory",
    AGENT = "agent",
    BUILD_SYSTEM = "build_system",
    TEST_ENVIRONMENT = "test_environment"
}
export interface TaskExecution {
    taskId: string;
    startTime: Date;
    endTime?: Date;
    status: ExecutionStatus;
    progress: number;
    result?: any;
    error?: Error;
    resourceUsage: ResourceUsage[];
    todoId?: string;
}
export declare enum ExecutionStatus {
    QUEUED = "queued",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    PAUSED = "paused"
}
export interface ResourceUsage {
    resourceType: ResourceType;
    resourceName: string;
    usage: number;
    maxUsage: number;
}
export interface CollisionDetectionResult {
    hasCollision: boolean;
    collisionType: CollisionType;
    conflictingTasks: string[];
    recommendation: CollisionRecommendation;
    severity: CollisionSeverity;
}
export declare enum CollisionType {
    RESOURCE_CONFLICT = "resource_conflict",
    DEPENDENCY_CYCLE = "dependency_cycle",
    SDLC_PHASE_VIOLATION = "sdlc_phase_violation",
    AGENT_OVERLOAD = "agent_overload",
    FILE_LOCK_CONFLICT = "file_lock_conflict",
    BUILD_SYSTEM_CONFLICT = "build_system_conflict"
}
export declare enum CollisionRecommendation {
    SERIALIZE = "serialize",
    RESCHEDULE = "reschedule",
    RESOURCE_ALLOCATION = "resource_allocation",
    TASK_SPLITTING = "task_splitting",
    PRIORITY_ADJUSTMENT = "priority_adjustment",
    AGENT_REASSIGNMENT = "agent_reassignment"
}
export declare enum CollisionSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
export declare class ParallelTaskManager extends EventEmitter {
    private tasks;
    private executions;
    private resourcePool;
    private agentWorkload;
    private sdlcState;
    private maxParallelTasks;
    private environmentManager;
    private todoWriteEnabled;
    constructor();
    /**
     * Add a task to the execution queue with collision detection
     */
    addTask(task: Task): Promise<string>;
    /**
     * Execute multiple tasks in parallel with intelligent orchestration
     */
    executeParallel(taskIds: string[]): Promise<Map<string, TaskExecution>>;
    /**
     * Intelligent collision detection system
     */
    private detectCollisions;
    /**
     * Handle collisions with intelligent resolution strategies
     */
    private handleCollision;
    /**
     * Create intelligent execution plan with dependency resolution
     */
    private createExecutionPlan;
    /**
     * Execute a single task with resource management
     */
    private executeTask;
    /**
     * Execute task based on its type with proper agent coordination
     */
    private executeTaskByType;
    private executeDevelopmentTask;
    private executeTestingTask;
    private executeBuildTask;
    private executeDeploymentTask;
    private executeQualityAssuranceTask;
    private executeDocumentationTask;
    private executeAnalysisTask;
    private executeMonitoringTask;
    private executeSecurityTask;
    private initializeResourcePool;
    private startResourceMonitoring;
    private getSeverityLevel;
    private validateTask;
    private checkResourceConflict;
    private checkSDLCPhaseConflict;
    private checkDependencyCycle;
    private generateRecommendation;
    private tryExecuteTask;
    private waitForTasks;
    private calculateOptimalDelay;
    private reallocateResources;
    private findAlternativeAgent;
    private splitTask;
    private buildDependencyGraph;
    private canAddTaskToBatch;
    private allocateResources;
    private releaseResources;
    getExecutionStatus(taskId: string): TaskExecution | undefined;
    getResourceUtilization(): Map<string, number>;
    getAgentWorkload(): Map<string, number>;
    cancelTask(taskId: string): Promise<void>;
    pauseTask(taskId: string): Promise<void>;
    resumeTask(taskId: string): Promise<void>;
    /**
     * Enable/disable TodoWrite integration
     */
    setTodoWriteEnabled(enabled: boolean): void;
    /**
     * Get current progress for all running tasks (for TodoWrite updates)
     */
    getParallelProgress(): Map<string, number>;
    /**
     * Get summary of parallel execution for TodoWrite display
     */
    getParallelExecutionSummary(): {
        runningCount: number;
        completedCount: number;
        failedCount: number;
        agents: string[];
        overallProgress: number;
    };
    /**
     * Format parallel progress for statusline display
     * Example: "Dana (30%) + Marcus (45%) + James (60%) working in parallel"
     */
    formatParallelProgressForStatusline(): string;
}
export default ParallelTaskManager;
