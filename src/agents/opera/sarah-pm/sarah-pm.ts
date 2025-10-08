/**
 * VERSATIL SDLC Framework - Sarah PM (Project Manager)
 * Specialized in sprint planning, milestone tracking, team coordination
 *
 * RAG-Enhanced: Learns from project patterns, sprint velocity, team dynamics
 */

import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from './rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from './base-agent.js';
import { PatternAnalyzer, AnalysisResult } from '../intelligence/pattern-analyzer.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

export class SarahPm extends RAGEnabledAgent {
  name = 'SarahPm';
  id = 'sarah-pm';
  specialization = 'Project Manager & Sprint Coordinator';
  systemPrompt = 'Experienced Project Manager specializing in Agile/Scrum methodology, sprint planning, team coordination, and milestone tracking';

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  /**
   * PM-specific RAG configuration
   * Focus on project patterns, sprint velocity, team dynamics
   */
  protected getDefaultRAGConfig(): RAGConfig {
    return {
      maxExamples: 5, // More examples for better sprint planning
      similarityThreshold: 0.75, // Slightly lower - more historical data
      agentDomain: 'project-management',
      enableLearning: true
    };
  }

  /**
   * PM-specific pattern analysis
   */
  protected async runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult> {
    const content = context.content || '';
    const filePath = context.filePath || '';

    // Detect PM-related patterns
    const patterns: any[] = [];

    // Sprint planning patterns
    if (content.match(/sprint|iteration|milestone|deadline/i)) {
      patterns.push({
        type: 'sprint-planning',
        message: 'Sprint planning or milestone tracking detected',
        severity: 'info',
        location: { file: filePath, line: 0 }
      });
    }

    // Task coordination patterns
    if (content.match(/task|story|epic|backlog|TODO/i)) {
      patterns.push({
        type: 'task-coordination',
        message: 'Task management activity detected',
        severity: 'info',
        location: { file: filePath, line: 0 }
      });
    }

    // Team communication patterns
    if (content.match(/standup|review|retrospective|demo/i)) {
      patterns.push({
        type: 'team-communication',
        message: 'Agile ceremony or team communication detected',
        severity: 'info',
        location: { file: filePath, line: 0 }
      });
    }

    // Risk assessment patterns
    if (content.match(/risk|blocker|dependency|blocked/i)) {
      patterns.push({
        type: 'risk-assessment',
        message: 'Project risk or blocker detected',
        severity: 'high',
        location: { file: filePath, line: 0 }
      });
    }

    // Velocity tracking
    if (content.match(/velocity|burndown|capacity|points/i)) {
      patterns.push({
        type: 'velocity-tracking',
        message: 'Sprint velocity or capacity planning detected',
        severity: 'info',
        location: { file: filePath, line: 0 }
      });
    }

    return {
      patterns,
      score: patterns.length > 0 ? 85 : 100, // PM quality score
      summary: `Detected ${patterns.length} PM patterns`,
      recommendations: patterns
        .filter(p => p.severity === 'high' || p.severity === 'critical')
        .map(p => p.message)
    };
  }

  /**
   * Override activate to add PM-specific context
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    // Call parent (RAGEnabledAgent) to get RAG-enhanced response
    const response = await super.activate(context);

    // Add PM-specific enhancements
    if (response.context) {
      response.context = {
        ...response.context,
        pmInsights: {
          sprintPlanningDetected: context.content?.includes('sprint') || false,
          milestoneTracking: context.content?.includes('milestone') || false,
          teamCoordination: context.content?.includes('team') || false,
          riskAssessment: context.content?.includes('risk') || false
        }
      };
    }

    // Add PM-specific suggestions if RAG context available
    const ragContext = context.ragContext as AgentRAGContext | undefined;
    if (ragContext && ragContext.previousSolutions) {
      const pmSuggestions = this.generatePMSuggestions(ragContext, context);
      response.suggestions = [...(response.suggestions || []), ...pmSuggestions];
    }

    // Determine handoffs
    response.handoffTo = this.determineHandoffs(context, response);

    return response;
  }

  /**
   * Generate PM-specific suggestions from RAG context
   */
  private generatePMSuggestions(ragContext: AgentRAGContext, context: AgentActivationContext): any[] {
    const suggestions: any[] = [];

    // Sprint velocity suggestions
    if (context.content?.includes('velocity') && ragContext.previousSolutions['velocity-tracking']) {
      suggestions.push({
        type: 'velocity-optimization',
        message: 'Historical velocity data suggests planning for 80% capacity to account for interruptions',
        priority: 'medium',
        file: context.filePath || 'sprint-planning'
      });
    }

    // Risk mitigation suggestions
    if (context.content?.includes('risk') && ragContext.previousSolutions['risk-assessment']) {
      suggestions.push({
        type: 'risk-mitigation',
        message: 'Similar risks in previous sprints were mitigated by early stakeholder communication',
        priority: 'high',
        file: context.filePath || 'risk-register'
      });
    }

    // Team coordination suggestions
    if (context.content?.includes('team') && ragContext.agentExpertise.length > 0) {
      suggestions.push({
        type: 'team-coordination',
        message: 'Previous team coordination patterns suggest daily standups at 9:30 AM work best',
        priority: 'low',
        file: context.filePath || 'team-calendar'
      });
    }

    return suggestions;
  }

  /**
   * Determine which agents to hand off to
   */
  private determineHandoffs(context: AgentActivationContext, response: AgentResponse): string[] {
    const handoffs: string[] = [];

    // Hand off to Maria if quality concerns detected
    if (response.priority === 'high' || response.priority === 'critical') {
      handoffs.push('maria-qa');
    }

    // Hand off to Alex-BA for requirements clarification
    if (context.content?.includes('requirement') || context.content?.includes('user story')) {
      handoffs.push('alex-ba');
    }

    return handoffs;
  }

  /**
   * Get base prompt template for PM
   */
  protected getBasePromptTemplate(): string {
    return `You are Sarah PM, an expert Project Manager specializing in Agile/Scrum methodology.
Your role is to coordinate sprint planning, track milestones, assess risks, and ensure team alignment.
Focus on practical project management guidance based on historical data and best practices.`;
  }

  /**
   * Generate domain-specific handoffs based on analysis
   */
  protected generateDomainHandoffs(analysis: AnalysisResult): string[] {
    const handoffs: string[] = [];

    // Check if QA involvement needed
    if (analysis.patterns.some(p => p.type === 'risk-assessment' && (p.severity === 'high' || p.severity === 'critical'))) {
      handoffs.push('maria-qa');
    }

    // Check if requirements clarification needed
    if (analysis.patterns.some(p => p.type === 'task-coordination')) {
      handoffs.push('alex-ba');
    }

    return handoffs;
  }
}
