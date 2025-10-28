/**
 * Sarah-PM SDK Agent
 * SDK-native version of Sarah PM that uses Claude Agent SDK for execution
 * while preserving all existing project management functionality
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
import { type ProjectVision, type ProjectHistory } from '../../../project/project-vision-manager.js';
export declare class SarahSDKAgent extends SDKAgentAdapter {
    private legacyAgent;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Sarah-specific enhancements
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Detect project type from content
     */
    private detectProjectType;
    /**
     * Detect sprint phase from content
     */
    private detectSprintPhase;
    /**
     * Generate PM-specific suggestions
     */
    private generatePMSuggestions;
    /**
     * Determine PM-specific handoffs
     */
    private determinePMHandoffs;
    /**
     * Generate sprint report (delegated to legacy agent if exists)
     */
    generateSprintReport(sprintData: any): any;
    /**
     * Track milestone progress
     */
    trackMilestone(milestoneData: any): any;
    /**
     * Coordinate team activities
     */
    coordinateTeam(teamData: any): any;
    /**
     * Assess project risks
     */
    assessRisks(riskData: any): any;
    /**
     * Calculate sprint velocity
     */
    calculateVelocity(velocityData: any): number;
    /**
     * Generate project timeline
     */
    generateTimeline(projectData: any): any;
    /**
     * Generate and store project vision from user input or requirements
     */
    generateAndStoreProjectVision(projectId: string, input: {
        mission?: string;
        targetMarket?: string;
        description?: string;
        goals?: string[];
    }): Promise<ProjectVision>;
    /**
     * Check if action aligns with project vision
     */
    private checkVisionAlignment;
    /**
     * Track completion event for Sarah-PM coordination actions
     */
    private trackCompletionEvent;
    /**
     * Update project goals progress
     */
    updateGoalProgress(projectId: string, goalId: string, progress: number): Promise<void>;
    /**
     * Get project vision for coordination decisions
     */
    getProjectVisionContext(projectId: string): Promise<{
        vision: ProjectVision | null;
        history: ProjectHistory | null;
        summary: string;
    }>;
}
