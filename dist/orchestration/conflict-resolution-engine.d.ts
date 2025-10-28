/**
 * Conflict Resolution Engine - Stub Implementation
 *
 * This is a minimal stub to satisfy TypeScript compilation.
 * Full implementation pending.
 */
export interface SubAgent {
    id: string;
    type: 'maria-qa' | 'james-frontend' | 'marcus-backend' | 'sarah-pm' | 'alex-ba' | 'dr-ai-ml';
    taskId: string;
    priority: number;
    files: string[];
    startTime: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    parentEpicId: string;
    dependencies: string[];
}
export interface ConflictDetection {
    hasConflict: boolean;
    conflictingAgents: string[];
    conflictType: 'file' | 'resource' | 'dependency';
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolution: string;
}
export declare class ConflictResolutionEngine {
    private agents;
    initialize(): Promise<void>;
    registerAgent(agent: SubAgent): Promise<void>;
    updateAgentStatus(agentId: string, status: SubAgent['status']): Promise<void>;
    detectConflicts(agentId: string): Promise<ConflictDetection>;
    resolveConflict(agentId: string, conflictingAgentId: string): Promise<boolean>;
    getRegisteredAgents(): SubAgent[];
    shutdown(): Promise<void>;
}
export default ConflictResolutionEngine;
