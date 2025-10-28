/**
 * Multi-Instance Collaborative Coordinator
 * Enables multiple VERSATIL instances to work together on the same project
 *
 * Features:
 * - Real-time collaboration between multiple instances
 * - Work distribution and load balancing
 * - Conflict detection and resolution
 * - Shared state synchronization
 * - Cross-instance communication
 * - Collaborative decision making
 * - Resource sharing and optimization
 */
import { EventEmitter } from 'events';
export interface CollaborationInstance {
    id: string;
    name: string;
    type: 'primary' | 'secondary' | 'specialized';
    status: 'active' | 'idle' | 'busy' | 'offline';
    capabilities: string[];
    currentTask?: CollaborationTask;
    performance: InstancePerformance;
    connection: InstanceConnection;
    lastSeen: number;
}
export interface CollaborationTask {
    id: string;
    type: TaskType;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    requirements: string[];
    assignedTo: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
    dependencies: string[];
    estimatedDuration: number;
    actualDuration?: number;
    result?: any;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
}
export declare enum TaskType {
    CODE_ANALYSIS = "code_analysis",
    TEST_GENERATION = "test_generation",
    DOCUMENTATION = "documentation",
    REFACTORING = "refactoring",
    OPTIMIZATION = "optimization",
    VALIDATION = "validation",
    DEPLOYMENT = "deployment",
    MONITORING = "monitoring"
}
export interface InstancePerformance {
    tasksCompleted: number;
    averageTaskDuration: number;
    successRate: number;
    currentLoad: number;
    specializations: string[];
    reliabilityScore: number;
    responsiveness: number;
}
export interface InstanceConnection {
    endpoint: string;
    heartbeatInterval: number;
    lastHeartbeat: number;
    latency: number;
    bandwidth: number;
}
export interface CollaborationSession {
    id: string;
    projectPath: string;
    participants: string[];
    leader: string;
    startTime: number;
    endTime?: number;
    tasks: Map<string, CollaborationTask>;
    sharedState: Map<string, any>;
    decisions: CollaborationDecision[];
    metrics: SessionMetrics;
}
export interface CollaborationDecision {
    id: string;
    type: 'task_assignment' | 'conflict_resolution' | 'resource_allocation' | 'strategy_change';
    description: string;
    options: DecisionOption[];
    selectedOption: string;
    reasoning: string;
    decidedBy: string;
    timestamp: number;
    impact: 'low' | 'medium' | 'high';
}
export interface DecisionOption {
    id: string;
    description: string;
    pros: string[];
    cons: string[];
    estimatedImpact: any;
    votes: number;
    confidence: number;
}
export interface SessionMetrics {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    parallelismEfficiency: number;
    communicationOverhead: number;
    conflictCount: number;
    resolutionTime: number;
}
export interface ConflictDetection {
    type: 'file_conflict' | 'resource_conflict' | 'task_conflict' | 'decision_conflict';
    description: string;
    participants: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoResolvable: boolean;
    resolutionStrategy?: string;
    timestamp: number;
}
export interface WorkDistributionStrategy {
    name: string;
    description: string;
    algorithm: (tasks: CollaborationTask[], instances: CollaborationInstance[]) => Map<string, string[]>;
    balancingFactors: string[];
    efficiency: number;
}
export declare class MultiInstanceCoordinator extends EventEmitter {
    private instanceId;
    private instances;
    private currentSession;
    private distributionStrategies;
    private conflictResolvers;
    private communicationPath;
    private isLeader;
    private heartbeatInterval;
    constructor(instanceName?: string);
    private initialize;
    startCollaboration(projectPath: string, instanceNames?: string[]): Promise<string>;
    distributeTask(taskDescription: string, requirements?: string[], priority?: CollaborationTask['priority']): Promise<string>;
    completeTask(taskId: string, result: any): Promise<void>;
    detectConflicts(): Promise<ConflictDetection[]>;
    resolveConflict(conflict: ConflictDetection): Promise<boolean>;
    syncSharedState(key: string, value: any): Promise<void>;
    getSharedState(key: string): Promise<any>;
    makeCollaborativeDecision(decisionType: CollaborationDecision['type'], description: string, options: Omit<DecisionOption, 'votes' | 'confidence'>[]): Promise<string>;
    getSessionMetrics(): Promise<SessionMetrics | null>;
    endCollaboration(): Promise<void>;
    private registerInstance;
    private discoverInstances;
    private startHeartbeat;
    private initializeDistributionStrategies;
    private initializeConflictResolvers;
    private initializeSessionMetrics;
    private inviteInstances;
    private electLeader;
    private saveSessionState;
    private determineTaskType;
    private estimateTaskDuration;
    private assignTask;
    private notifyTaskAssignment;
    private updateInstancePerformance;
    private processDependentTasks;
    private detectFileConflicts;
    private detectResourceConflicts;
    private detectTaskConflicts;
    private analyzeConflictSeverity;
    private broadcastStateUpdate;
    private collectVotes;
    private analyzeVotes;
    private generateDecisionReasoning;
    private calculateAverageTaskDuration;
    private calculateParallelismEfficiency;
    private calculateCommunicationOverhead;
    private calculateAverageResolutionTime;
    private notifySessionEnd;
    private loadBalancedDistribution;
    private specializationBasedDistribution;
    private performanceBasedDistribution;
    private resolveFileConflict;
    private resolveResourceConflict;
    private resolveTaskConflict;
    private resolveDecisionConflict;
}
export default MultiInstanceCoordinator;
