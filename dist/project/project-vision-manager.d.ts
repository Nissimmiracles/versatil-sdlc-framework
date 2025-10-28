/**
 * VERSATIL SDLC Framework - Project Vision Manager
 *
 * Manages project vision, market context, goals, and history persistently
 * Part of Layer 2 (Project Context) in three-layer context enrichment system
 *
 * Storage: ~/.versatil/projects/[project-id]/
 */
import { EventEmitter } from 'events';
export interface Competitor {
    name: string;
    strengths: string[];
    weaknesses: string[];
    marketShare?: number;
    differentiators?: string[];
}
export interface UserPersona {
    name: string;
    role: string;
    needs: string[];
    painPoints: string[];
    goals: string[];
}
export interface Goal {
    id: string;
    description: string;
    timeframe: '1-month' | '3-months' | '6-months' | '1-year' | '3-years';
    metrics: Metric[];
    status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
    progress: number;
}
export interface Metric {
    name: string;
    current: number;
    target: number;
    unit: string;
}
export interface MarketAnalysis {
    size: string;
    opportunity: string;
    trends: string[];
    timing: string;
    competitiveLandscape: string;
}
export interface ProjectVision {
    mission: string;
    northStar: string;
    marketOpportunity: string;
    targetMarket: string;
    competitors: Competitor[];
    targetUsers: UserPersona[];
    goals: Goal[];
    values: string[];
    strategicPriorities: string[];
    productPhilosophy: string[];
    scope: {
        inScope: string[];
        outOfScope: string[];
    };
    createdAt: number;
    updatedAt: number;
}
export interface ProjectEvent {
    id: string;
    timestamp: number;
    type: 'feature_added' | 'decision_made' | 'milestone_reached' | 'refactor_completed' | 'architecture_changed' | 'dependency_added' | 'bug_fixed';
    description: string;
    impact: string;
    agent: string;
    metadata?: Record<string, any>;
}
export interface Milestone {
    id: string;
    name: string;
    targetDate: number;
    completedDate?: number;
    status: 'planned' | 'in-progress' | 'completed' | 'missed';
    successCriteria: string[];
    dependencies: string[];
}
export interface Decision {
    id: string;
    timestamp: number;
    decision: string;
    rationale: string;
    alternatives: string[];
    consequences: string[];
    decidedBy: string;
}
export interface ProjectHistory {
    events: ProjectEvent[];
    milestones: Milestone[];
    decisions: Decision[];
}
export declare class ProjectVisionManager extends EventEmitter {
    private versatilHome;
    private projectsPath;
    constructor();
    /**
     * Initialize project vision storage directory
     */
    private ensureProjectDir;
    /**
     * Store project vision
     */
    storeVision(projectId: string, vision: Partial<ProjectVision>): Promise<void>;
    /**
     * Get project vision
     */
    getVision(projectId: string): Promise<ProjectVision | null>;
    /**
     * Update market context
     */
    updateMarketContext(projectId: string, market: MarketAnalysis): Promise<void>;
    /**
     * Get market context
     */
    getMarketContext(projectId: string): Promise<MarketAnalysis | null>;
    /**
     * Track project event (append to history timeline)
     */
    trackEvent(projectId: string, event: Omit<ProjectEvent, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Track milestone
     */
    trackMilestone(projectId: string, milestone: Milestone): Promise<void>;
    /**
     * Store decision
     */
    storeDecision(projectId: string, decision: Omit<Decision, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Get project history (events, milestones, decisions)
     */
    getProjectHistory(projectId: string, limit?: number): Promise<ProjectHistory>;
    /**
     * Query events by type
     */
    queryEvents(projectId: string, type: ProjectEvent['type'], limit?: number): Promise<ProjectEvent[]>;
    /**
     * Get project timeline summary
     */
    getTimelineSummary(projectId: string): Promise<string>;
    /**
     * Get default vision template
     */
    private getDefaultVision;
    /**
     * Check if project has vision stored
     */
    hasVision(projectId: string): Promise<boolean>;
    /**
     * Delete project vision (cleanup)
     */
    deleteProjectData(projectId: string): Promise<void>;
}
export declare const projectVisionManager: ProjectVisionManager;
