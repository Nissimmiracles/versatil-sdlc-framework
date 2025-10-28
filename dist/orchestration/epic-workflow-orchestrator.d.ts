/**
 * Epic Workflow Orchestrator - Stub Implementation
 *
 * This is a minimal stub to satisfy TypeScript compilation.
 * Full implementation pending.
 */
export interface Task {
    id: string;
    name: string;
    description?: string;
    type: 'development' | 'testing' | 'documentation' | 'deployment';
    priority: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    assignedAgent?: string;
    dependencies?: string[];
    dependsOn?: string[];
    files: string[];
    estimatedDuration?: number;
    metadata?: Record<string, any>;
}
export interface Epic {
    id: string;
    name: string;
    description: string;
    tasks: Task[];
    status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
    startTime?: number;
    endTime?: number;
}
export interface WorkflowResult {
    epicId: string;
    status: 'success' | 'partial' | 'failed';
    completedTasks: number;
    failedTasks: number;
    duration: number;
    errors: string[];
}
export declare class EpicWorkflowOrchestrator {
    private epics;
    initialize(): Promise<void>;
    createEpic(epic: Epic): Promise<string>;
    executeEpic(epicId: string): Promise<WorkflowResult>;
    getEpic(epicId: string): Epic | undefined;
    getAllEpics(): Epic[];
    shutdown(): Promise<void>;
}
export default EpicWorkflowOrchestrator;
