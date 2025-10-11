/**
 * Sarah-PM SDK Agent
 * SDK-native version of Sarah PM that uses Claude Agent SDK for execution
 * while preserving all existing project management functionality
 */

import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import { SarahPm } from './sarah-pm.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';

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
        sprintPhase: this.detectSprintPhase(context.content || '')
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
}
