/**
 * Sarah-PM SDK Agent
 * SDK-native version of Sarah PM that uses Claude Agent SDK for execution
 * while preserving all existing project management functionality
 */

import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import { SarahPm } from './sarah-pm.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
import { projectVisionManager, type ProjectVision, type ProjectHistory } from '../../../project/project-vision-manager.js';
import { projectHistoryTracker } from '../../../project/project-history-tracker.js';

export class SarahSDKAgent extends SDKAgentAdapter {
  private legacyAgent: SarahPm;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super({
      agentId: 'sarah-pm',
      vectorStore,
      model: 'sonnet'
    });

    // Keep legacy agent for specialized methods
    this.legacyAgent = new SarahPm(vectorStore);
  }

  /**
   * Override activate to add Sarah-specific enhancements
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    // 0. Query project vision for context enrichment (if projectId available)
    let projectVision: ProjectVision | null = null;
    let projectHistory: ProjectHistory | null = null;
    const projectId = context.metadata?.projectId || context.projectId;

    if (projectId) {
      try {
        projectVision = await projectVisionManager.getVision(projectId);
        projectHistory = await projectVisionManager.getProjectHistory(projectId, 10);

        // Check alignment with project vision
        if (projectVision && context.content) {
          const alignmentCheck = this.checkVisionAlignment(context.content, projectVision);
          if (!alignmentCheck.aligned) {
            console.warn(`⚠️ Sarah-PM: Action may not align with project vision: ${alignmentCheck.reason}`);
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Failed to load project vision for ${projectId}:`, error.message);
      }
    }

    // 1. Run SDK activation (core analysis)
    const response = await super.activate(context);

    // 2. Add PM-specific insights to context
    if (response.context) {
      response.context = {
        ...response.context,
        pmInsights: {
          sprintPlanningDetected: context.content?.includes('sprint') || false,
          milestoneTracking: context.content?.includes('milestone') || false,
          teamCoordination: context.content?.includes('team') || false,
          riskAssessment: context.content?.includes('risk') || false,
          velocityTracking: context.content?.includes('velocity') || false
        },
        projectType: this.detectProjectType(context.content || ''),
        sprintPhase: this.detectSprintPhase(context.content || ''),
        projectVision: projectVision ? {
          mission: projectVision.mission,
          goals: projectVision.goals.map(g => g.description),
          strategicPriorities: projectVision.strategicPriorities
        } : null,
        recentHistory: projectHistory ? {
          totalEvents: projectHistory.events.length,
          recentEvents: projectHistory.events.slice(0, 3).map(e => ({
            type: e.type,
            description: e.description,
            agent: e.agent
          }))
        } : null
      };
    }

    // 3. Add PM-specific suggestions based on content
    const pmSuggestions = this.generatePMSuggestions(context);
    if (pmSuggestions.length > 0) {
      response.suggestions = [...(response.suggestions || []), ...pmSuggestions];
    }

    // 4. Determine handoffs for PM coordination
    const handoffs = this.determinePMHandoffs(context, response);
    if (handoffs.length > 0) {
      response.handoffTo = [...(response.handoffTo || []), ...handoffs];
    }

    // 5. Track completion event if this was a coordination action
    if (projectId && context.metadata?.trackCompletion !== false) {
      await this.trackCompletionEvent(projectId, context, response);
    }

    return response;
  }

  /**
   * Detect project type from content
   */
  private detectProjectType(content: string): string {
    if (content.match(/agile|scrum|sprint/i)) return 'agile';
    if (content.match(/kanban/i)) return 'kanban';
    if (content.match(/waterfall|phase/i)) return 'waterfall';
    return 'unknown';
  }

  /**
   * Detect sprint phase from content
   */
  private detectSprintPhase(content: string): string {
    if (content.match(/planning|kickoff/i)) return 'planning';
    if (content.match(/development|active|in-progress/i)) return 'development';
    if (content.match(/review|demo/i)) return 'review';
    if (content.match(/retrospective|retro/i)) return 'retrospective';
    return 'unknown';
  }

  /**
   * Generate PM-specific suggestions
   */
  private generatePMSuggestions(context: AgentActivationContext): any[] {
    const suggestions: any[] = [];
    const content = context.content || '';

    // Sprint velocity suggestions
    if (content.includes('velocity') || content.includes('capacity')) {
      suggestions.push({
        type: 'velocity-optimization',
        message: 'Consider planning for 80% capacity to account for meetings and interruptions',
        priority: 'medium',
        file: context.filePath || 'sprint-planning'
      });
    }

    // Risk mitigation suggestions
    if (content.match(/risk|blocker|blocked|dependency/i)) {
      suggestions.push({
        type: 'risk-mitigation',
        message: 'Identify blockers early and communicate with stakeholders proactively',
        priority: 'high',
        file: context.filePath || 'risk-register'
      });
    }

    // Team coordination suggestions
    if (content.includes('team') || content.includes('standup')) {
      suggestions.push({
        type: 'team-coordination',
        message: 'Ensure all team members are aligned on sprint goals and priorities',
        priority: 'low',
        file: context.filePath || 'team-calendar'
      });
    }

    // Milestone tracking suggestions
    if (content.includes('milestone') || content.includes('deadline')) {
      suggestions.push({
        type: 'milestone-tracking',
        message: 'Set up automated reminders for milestone deadlines',
        priority: 'medium',
        file: context.filePath || 'project-timeline'
      });
    }

    return suggestions;
  }

  /**
   * Determine PM-specific handoffs
   */
  private determinePMHandoffs(context: AgentActivationContext, response: AgentResponse): string[] {
    const handoffs: string[] = [];
    const content = context.content || '';

    // Hand off to Maria-QA for quality concerns
    if (response.priority === 'high' || response.priority === 'critical') {
      handoffs.push('maria-qa');
    }

    // Hand off to Alex-BA for requirements clarification
    if (content.match(/requirement|user story|epic|feature/i)) {
      handoffs.push('alex-ba');
    }

    // Hand off to Marcus for backend deployment concerns
    if (content.match(/deployment|release|production/i)) {
      handoffs.push('marcus-backend');
    }

    // Hand off to James for frontend delivery concerns
    if (content.match(/ui|ux|frontend|design/i)) {
      handoffs.push('james-frontend');
    }

    return handoffs;
  }

  /**
   * Generate sprint report (delegated to legacy agent if exists)
   */
  generateSprintReport(sprintData: any): any {
    // For now, generate a basic report
    // TODO: Integrate with legacy agent if it has this method
    return {
      sprintId: sprintData.id || 'unknown',
      velocity: sprintData.velocity || 0,
      completedStories: sprintData.completed || 0,
      totalStories: sprintData.total || 0,
      completionRate: sprintData.total > 0
        ? Math.round((sprintData.completed / sprintData.total) * 100)
        : 0,
      blockers: sprintData.blockers || [],
      recommendations: [
        'Continue current velocity for next sprint',
        'Address blockers in sprint planning',
        'Celebrate team wins in retrospective'
      ]
    };
  }

  /**
   * Track milestone progress
   */
  trackMilestone(milestoneData: any): any {
    return {
      milestoneId: milestoneData.id || 'unknown',
      name: milestoneData.name || 'Unnamed Milestone',
      targetDate: milestoneData.targetDate || new Date().toISOString(),
      progress: milestoneData.progress || 0,
      status: milestoneData.progress >= 100 ? 'completed'
            : milestoneData.progress >= 50 ? 'on-track'
            : 'at-risk',
      remainingTasks: milestoneData.remainingTasks || 0,
      blockers: milestoneData.blockers || []
    };
  }

  /**
   * Coordinate team activities
   */
  coordinateTeam(teamData: any): any {
    return {
      teamSize: teamData.size || 0,
      availability: teamData.availability || {},
      upcomingEvents: teamData.events || [],
      actionItems: teamData.actionItems || [],
      recommendations: [
        'Schedule daily standups',
        'Review sprint backlog',
        'Address team concerns proactively'
      ]
    };
  }

  /**
   * Assess project risks
   */
  assessRisks(riskData: any): any {
    const risks = riskData.risks || [];
    return {
      totalRisks: risks.length,
      highPriority: risks.filter((r: any) => r.severity === 'high').length,
      mediumPriority: risks.filter((r: any) => r.severity === 'medium').length,
      lowPriority: risks.filter((r: any) => r.severity === 'low').length,
      mitigationStrategies: risks.map((r: any) => ({
        risk: r.description,
        mitigation: r.mitigation || 'Develop mitigation plan',
        owner: r.owner || 'Unassigned'
      })),
      overallRiskLevel: risks.some((r: any) => r.severity === 'high') ? 'high'
                      : risks.some((r: any) => r.severity === 'medium') ? 'medium'
                      : 'low'
    };
  }

  /**
   * Calculate sprint velocity
   */
  calculateVelocity(velocityData: any): number {
    const completedPoints = velocityData.completedPoints || 0;
    const sprintDuration = velocityData.sprintDuration || 2; // weeks
    return Math.round(completedPoints / sprintDuration);
  }

  /**
   * Generate project timeline
   */
  generateTimeline(projectData: any): any {
    return {
      projectStart: projectData.startDate || new Date().toISOString(),
      projectEnd: projectData.endDate || new Date().toISOString(),
      milestones: projectData.milestones || [],
      sprints: projectData.sprints || [],
      criticalPath: projectData.criticalPath || [],
      dependencies: projectData.dependencies || []
    };
  }

  // ==================== PROJECT VISION INTEGRATION ====================

  /**
   * Generate and store project vision from user input or requirements
   */
  async generateAndStoreProjectVision(projectId: string, input: {
    mission?: string;
    targetMarket?: string;
    description?: string;
    goals?: string[];
  }): Promise<ProjectVision> {
    // Build project vision from input
    const vision: Partial<ProjectVision> = {
      mission: input.mission || 'Define project mission',
      northStar: input.mission || 'Define north star metric',
      marketOpportunity: input.description || 'Define market opportunity',
      targetMarket: input.targetMarket || 'Define target market',
      competitors: [],
      targetUsers: [],
      goals: (input.goals || []).map((goal, index) => ({
        id: `goal_${index + 1}`,
        description: goal,
        timeframe: '3-months' as const,
        metrics: [],
        status: 'not-started' as const,
        progress: 0
      })),
      values: [],
      strategicPriorities: [],
      productPhilosophy: [],
      scope: {
        inScope: [],
        outOfScope: []
      }
    };

    // Store vision
    await projectVisionManager.storeVision(projectId, vision);

    // Track vision creation event
    await projectVisionManager.trackEvent(projectId, {
      type: 'decision_made',
      description: 'Project vision created',
      impact: 'Established project direction and goals',
      agent: 'sarah-pm'
    });

    console.log(`✅ Sarah-PM: Project vision stored for ${projectId}`);

    // Return full vision
    const storedVision = await projectVisionManager.getVision(projectId);
    return storedVision!;
  }

  /**
   * Check if action aligns with project vision
   */
  private checkVisionAlignment(content: string, vision: ProjectVision): {
    aligned: boolean;
    reason?: string;
  } {
    // Extract key concepts from content
    const contentLower = content.toLowerCase();

    // Check alignment with strategic priorities
    if (vision.strategicPriorities.length > 0) {
      const hasAlignment = vision.strategicPriorities.some(priority =>
        contentLower.includes(priority.toLowerCase())
      );

      if (!hasAlignment) {
        return {
          aligned: false,
          reason: `Does not align with strategic priorities: ${vision.strategicPriorities.join(', ')}`
        };
      }
    }

    // Check alignment with scope
    if (vision.scope.outOfScope.length > 0) {
      const isOutOfScope = vision.scope.outOfScope.some(item =>
        contentLower.includes(item.toLowerCase())
      );

      if (isOutOfScope) {
        return {
          aligned: false,
          reason: 'Appears to be out of project scope'
        };
      }
    }

    // Check alignment with goals
    if (vision.goals.length > 0) {
      const supportsGoal = vision.goals.some(goal =>
        contentLower.includes(goal.description.toLowerCase().slice(0, 20))
      );

      if (!supportsGoal) {
        return {
          aligned: true, // Not a blocker, but worth noting
          reason: 'Consider how this supports project goals'
        };
      }
    }

    return { aligned: true };
  }

  /**
   * Track completion event for Sarah-PM coordination actions
   */
  private async trackCompletionEvent(
    projectId: string,
    context: AgentActivationContext,
    response: AgentResponse
  ): Promise<void> {
    try {
      await projectHistoryTracker.trackAgentCompletion({
        agentId: 'sarah-pm',
        projectId,
        action: context.action || 'project coordination',
        result: response,
        filePaths: context.filePath ? [context.filePath] : [],
        duration: context.metadata?.duration,
        metadata: {
          pmInsights: response.context?.pmInsights,
          priority: response.priority
        }
      });
    } catch (error: any) {
      console.warn('⚠️ Failed to track Sarah-PM completion event:', error.message);
    }
  }

  /**
   * Update project goals progress
   */
  async updateGoalProgress(projectId: string, goalId: string, progress: number): Promise<void> {
    const vision = await projectVisionManager.getVision(projectId);
    if (!vision) {
      throw new Error(`No vision found for project ${projectId}`);
    }

    const goal = vision.goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found in project vision`);
    }

    // Update goal
    goal.progress = Math.min(100, Math.max(0, progress));
    goal.status = progress >= 100 ? 'completed'
                : progress > 0 ? 'in-progress'
                : 'not-started';

    // Store updated vision
    await projectVisionManager.storeVision(projectId, vision);

    // Track milestone if goal completed
    if (goal.status === 'completed') {
      await projectVisionManager.trackEvent(projectId, {
        type: 'milestone_reached',
        description: `Goal completed: ${goal.description}`,
        impact: `Achieved project goal (${goal.timeframe})`,
        agent: 'sarah-pm'
      });
    }

    console.log(`✅ Sarah-PM: Updated goal ${goalId} progress to ${progress}%`);
  }

  /**
   * Get project vision for coordination decisions
   */
  async getProjectVisionContext(projectId: string): Promise<{
    vision: ProjectVision | null;
    history: ProjectHistory | null;
    summary: string;
  }> {
    const vision = await projectVisionManager.getVision(projectId);
    const history = await projectVisionManager.getProjectHistory(projectId, 20);

    let summary = '';
    if (vision) {
      summary += `Mission: ${vision.mission}\n`;
      summary += `Goals: ${vision.goals.length} (${vision.goals.filter(g => g.status === 'completed').length} completed)\n`;
    }
    if (history) {
      summary += `Recent Events: ${history.events.length}\n`;
      summary += `Milestones: ${history.milestones.length}\n`;
      summary += `Decisions: ${history.decisions.length}\n`;
    }

    return { vision, history, summary };
  }
}
