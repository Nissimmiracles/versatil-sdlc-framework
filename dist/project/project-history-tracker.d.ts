/**
 * VERSATIL SDLC Framework - Project History Tracker
 *
 * Automatic event tracking when agents complete work
 * Part of Layer 2 (Project Context) - Task 3
 *
 * Features:
 * - Auto-track when agents finish features
 * - Auto-track architecture decisions
 * - Hook into agent completion events
 * - Timeline visualization helpers
 */
import { EventEmitter } from 'events';
import { AgentResponse } from '../types.js';
export interface AgentCompletionEvent {
    agentId: string;
    projectId: string;
    action: string;
    result: AgentResponse;
    filePaths?: string[];
    duration?: number;
    metadata?: Record<string, any>;
}
export interface ArchitectureDecision {
    decision: string;
    rationale: string;
    alternatives: string[];
    consequences: string[];
    decidedBy: string;
    affectedComponents: string[];
}
export interface FeatureCompletion {
    featureName: string;
    description: string;
    impact: string;
    filesModified: string[];
    testsAdded: boolean;
    agentId: string;
}
export interface TimelineVisualization {
    events: Array<{
        date: string;
        type: string;
        description: string;
        agent: string;
        icon: string;
    }>;
    summary: {
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsByAgent: Record<string, number>;
        timeRange: {
            start: number;
            end: number;
            durationDays: number;
        };
    };
}
export declare class ProjectHistoryTracker extends EventEmitter {
    private activeProjectId;
    private sessionStartTimes;
    constructor();
    /**
     * Set the active project for tracking
     */
    setActiveProject(projectId: string): void;
    /**
     * Get the active project ID
     */
    getActiveProject(): string | null;
    /**
     * Setup listeners for agent completion events
     * This hooks into the RAGEnabledAgent EventEmitter
     */
    private setupAgentListeners;
    /**
     * Track agent completion event
     */
    trackAgentCompletion(event: AgentCompletionEvent): Promise<void>;
    /**
     * Track architecture decision
     */
    trackArchitectureDecision(decision: ArchitectureDecision): Promise<void>;
    /**
     * Track feature completion
     */
    trackFeatureCompletion(feature: FeatureCompletion): Promise<void>;
    /**
     * Handle agent completion event
     */
    private handleAgentCompletion;
    /**
     * Handle architecture decision
     */
    private handleArchitectureDecision;
    /**
     * Handle feature completion
     */
    private handleFeatureCompletion;
    /**
     * Infer event type from agent completion event
     */
    private inferEventType;
    /**
     * Generate human-readable event description
     */
    private generateEventDescription;
    /**
     * Generate impact description from agent response
     */
    private generateImpactDescription;
    /**
     * Format agent ID for display
     */
    private formatAgentName;
    /**
     * Start tracking session for an agent
     */
    startSession(agentId: string): void;
    /**
     * End tracking session and return duration
     */
    endSession(agentId: string): number | null;
    /**
     * Generate timeline visualization data
     */
    generateTimelineVisualization(projectId: string, limit?: number): Promise<TimelineVisualization>;
    /**
     * Get icon for event type (for terminal/markdown display)
     */
    private getEventIcon;
    /**
     * Generate markdown timeline report
     */
    generateMarkdownTimeline(projectId: string, limit?: number): Promise<string>;
    /**
     * Get recent activity summary
     */
    getRecentActivity(projectId: string, hours?: number): Promise<{
        events: number;
        agents: Set<string>;
        topEventType: string;
    }>;
}
export declare const projectHistoryTracker: ProjectHistoryTracker;
