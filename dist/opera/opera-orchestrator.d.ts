import { EventEmitter } from 'events';
export interface OperaGoal {
    id: string;
    type: string;
    description: string;
    status: string;
    priority: string;
    constraints?: any[];
    successCriteria?: any;
}
export declare class OperaOrchestrator extends EventEmitter {
    private static instance;
    constructor(agentRegistry?: any);
    static getInstance(): OperaOrchestrator;
    createGoal(goal: any): Promise<OperaGoal>;
    initialize(): Promise<void>;
    getActiveGoals(filter?: any, options?: any): Promise<any>;
    getExecutionPlans(goalId?: string, options?: any): Promise<any>;
    executePlan(planId: string, options?: any): Promise<any>;
    getState(): Promise<any>;
    getMetrics(agentId?: string, options?: any): Promise<any>;
    updateEnvironmentContext(context: any, options?: any): Promise<any>;
    addGoal(goal: any): Promise<OperaGoal>;
    pauseAutonomous(reason?: string): Promise<void>;
    resumeAutonomous(reason?: string): Promise<void>;
    analyzeProject(projectPath: string): Promise<any>;
    startAutonomous(): Promise<void>;
    getGoalStatus(goalId: string): Promise<any>;
    getAllGoalsStatus(): Promise<any[]>;
    getDecisionHistory(options?: any): Promise<any[]>;
    getLearningInsights(category?: any): Promise<any>;
    overrideGoal(options: any): Promise<void>;
    getCurrentContext(detailed?: any): Promise<any>;
    getPerformanceMetrics(timeRange?: any): Promise<any>;
    updateMCP(mcp: any): Promise<void>;
}
