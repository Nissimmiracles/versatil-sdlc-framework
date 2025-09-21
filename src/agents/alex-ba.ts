/**
 * VERSATIL SDLC Framework - Alex BA Agent
 * Business Analyst & Requirements Specialist
 */

import { BaseAgent } from './base-agent';
import { AgentActivationContext, AgentResponse } from '../types/agent-types';

export class AlexBA extends BaseAgent {
  id = 'alex-ba';
  name = 'Alex BA';
  specialization = 'Business Analysis & Requirements Engineering';

  override async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const businessAnalysisResults = await this.runBusinessAnalysisValidation(context);

    return {
      agentId: this.id,
      result: businessAnalysisResults,
      suggestions: [
        ...businessAnalysisResults.suggestions,
        ...await this.generateBusinessAnalysisInsights(context)
      ]
    };
  }

  override async runAgentSpecificValidation(context: AgentActivationContext) {
    return {
      suggestions: [
        {
          type: 'info',
          message: 'Business requirements analysis initiated',
          fix: 'Reviewing user stories and acceptance criteria'
        }
      ]
    };
  }

  private async runBusinessAnalysisValidation(context: AgentActivationContext) {
    const suggestions = [];

    // Requirements analysis
    suggestions.push({
      type: 'info',
      message: 'Analyzing business requirements completeness',
      fix: 'Ensure all user stories have clear acceptance criteria'
    });

    // Stakeholder alignment check
    suggestions.push({
      type: 'info',
      message: 'Validating stakeholder requirements alignment',
      fix: 'Confirm business objectives match implementation plan'
    });

    // User journey analysis
    suggestions.push({
      type: 'suggestion',
      message: 'Reviewing user experience flows',
      fix: 'Map user journeys and identify friction points'
    });

    return { suggestions };
  }

  private async generateBusinessAnalysisInsights(context: AgentActivationContext) {
    return [
      {
        type: 'suggestion',
        message: 'Define clear user personas and use cases',
        fix: 'Create detailed user personas to guide development decisions'
      },
      {
        type: 'suggestion',
        message: 'Establish measurable business success criteria',
        fix: 'Define KPIs and success metrics for feature validation'
      },
      {
        type: 'optimization',
        message: 'Implement requirements traceability matrix',
        fix: 'Track requirements from conception to implementation'
      },
      {
        type: 'business',
        message: 'Conduct stakeholder impact analysis',
        fix: 'Assess how changes affect different user groups and business processes'
      }
    ];
  }
}