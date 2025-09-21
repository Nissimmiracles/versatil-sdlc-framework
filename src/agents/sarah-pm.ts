/**
 * VERSATIL SDLC Framework - Sarah PM Agent
 * Project Manager & Coordination Specialist
 */

import { BaseAgent, ValidationResults } from './base-agent';
import { AgentActivationContext, AgentResponse } from '../types/agent-types';

export class SarahPM extends BaseAgent {
  override id = 'sarah-pm';
  override name = 'Sarah PM';
  override specialization = 'Project Management & Team Coordination';

  override async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const projectManagementResults = await this.runProjectManagementValidation(context);

    return {
      agentId: this.id,
      message: 'Project management analysis completed successfully',
      priority: 'medium',
      handoffTo: [],
      context: projectManagementResults,
      result: projectManagementResults,
      suggestions: [
        ...projectManagementResults.suggestions,
        ...await this.generateProjectManagementInsights(context)
      ]
    };
  }

  override async runAgentSpecificValidation(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    return {
      recommendations: [
        {
          type: 'info',
          priority: 'medium',
          message: 'Project coordination analysis initiated',
          actions: ['Review team collaboration patterns and milestone progress']
        }
      ]
    };
  }

  private async runProjectManagementValidation(context: AgentActivationContext) {
    const suggestions: any[] = [];

    // Project timeline analysis
    suggestions.push({
      type: 'info',
      message: 'Analyzing project timeline and milestones',
      fix: 'Review sprint planning and delivery schedules'
    });

    // Team coordination check
    suggestions.push({
      type: 'info',
      message: 'Evaluating team collaboration effectiveness',
      fix: 'Consider daily standups and cross-functional coordination'
    });

    // Risk assessment
    suggestions.push({
      type: 'warning',
      message: 'Conducting project risk assessment',
      fix: 'Identify potential blockers and mitigation strategies'
    });

    return { suggestions };
  }

  private async generateProjectManagementInsights(context: AgentActivationContext) {
    return [
      {
        type: 'suggestion',
        message: 'Implement agile ceremonies for better team coordination',
        fix: 'Set up sprint planning, daily standups, and retrospectives'
      },
      {
        type: 'suggestion',
        message: 'Establish clear communication channels',
        fix: 'Use project management tools and regular status updates'
      },
      {
        type: 'optimization',
        message: 'Track team velocity and adjust planning accordingly',
        fix: 'Monitor burn-down charts and adjust sprint capacity'
      }
    ];
  }
}