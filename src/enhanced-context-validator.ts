/**
 * VERSATIL SDLC Framework - Enhanced Context Validator
 * Implementation of the user's specific enhancement request:
 * "when user add new task the relevant agents need to check task and context clarity
 * before planning and if not clear the agent need to ask questions"
 *
 * This ensures agents understand exactly what needs to be done before starting work
 */

import { versatilDispatcher } from './agent-dispatcher';
import { cursorClaudeBridge } from './cursor-claude-bridge';
import { qualityGateEnforcer } from './quality-gate-enforcer';
import path from 'path';
import { promises as fs } from 'fs';

interface TaskContext {
  userRequest: string;
  filePath?: string;
  relatedFiles?: string[];
  projectContext?: ProjectContext;
  previousConversation?: ConversationContext[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
}

interface ProjectContext {
  framework: string;
  language: string;
  dependencies: string[];
  architecture: string;
  currentFeatures: string[];
  knownIssues: string[];
}

interface ConversationContext {
  timestamp: string;
  userMessage: string;
  agentResponse: string;
  outcome: 'completed' | 'partial' | 'failed' | 'clarification_needed';
}

interface ClarityAssessment {
  overall: 'clear' | 'ambiguous' | 'missing' | 'conflicting';
  confidence: number; // 0-100
  issues: ClarityIssue[];
  requiredClarifications: ClarificationRequest[];
  recommendedAgents: string[];
  contextSufficiency: 'sufficient' | 'partial' | 'insufficient';
  estimatedComplexity: 'simple' | 'moderate' | 'complex' | 'expert';
}

interface ClarityIssue {
  type: 'ambiguous_reference' | 'missing_specifics' | 'conflicting_requirements' | 'unclear_scope' | 'missing_context';
  severity: 'blocking' | 'critical' | 'major' | 'minor';
  description: string;
  examples?: string[];
  affectedArea?: string;
}

interface ClarificationRequest {
  question: string;
  type: 'specification' | 'scope' | 'technical' | 'priority' | 'context';
  importance: 'must_have' | 'should_have' | 'nice_to_have';
  suggestedAnswers?: string[];
  relatedTo?: string;
}

/**
 * Enhanced Context Validation System
 * Implements intelligent task clarity assessment before agent activation
 */
class EnhancedContextValidator {
  private projectContext: ProjectContext | null = null;
  private conversationHistory: ConversationContext[] = [];
  private clarityPatterns: Map<string, RegExp[]> = new Map();
  private domainKnowledge: Map<string, string[]> = new Map();

  constructor() {
    this.initializeValidator();
  }

  /**
   * Initialize the Enhanced Context Validator
   */
  private async initializeValidator(): Promise<void> {
    console.log('🧠 Enhanced Context Validator: Initializing...');

    // Load project context
    await this.loadProjectContext();

    // Load conversation history
    await this.loadConversationHistory();

    // Initialize clarity patterns
    this.initializeClarityPatterns();

    // Initialize domain knowledge
    this.initializeDomainKnowledge();

    console.log('✅ Enhanced Context Validator: ACTIVE');
  }

  /**
   * Main Context Validation Entry Point (User's Enhancement Request)
   */
  async validateTaskContext(userRequest: string, additionalContext?: Partial<TaskContext>): Promise<ClarityAssessment> {
    console.log('🎯 ENHANCED CONTEXT VALIDATION: Analyzing task clarity...');

    const taskContext: TaskContext = {
      userRequest,
      urgency: 'medium',
      projectContext: this.projectContext || {
        framework: 'unknown',
        language: 'unknown',
        dependencies: [],
        architecture: 'unknown',
        currentFeatures: [],
        knownIssues: []
      },
      previousConversation: this.conversationHistory.slice(-10), // Last 10 interactions
      ...additionalContext
    };

    // Comprehensive clarity analysis
    const assessment: ClarityAssessment = {
      overall: 'clear',
      confidence: 100,
      issues: [],
      requiredClarifications: [],
      recommendedAgents: [],
      contextSufficiency: 'sufficient',
      estimatedComplexity: 'simple'
    };

    console.log('🔍 Running clarity checks...');

    // 1. Ambiguity Detection
    await this.detectAmbiguity(taskContext, assessment);

    // 2. Specification Completeness Check
    await this.checkSpecificationCompleteness(taskContext, assessment);

    // 3. Technical Context Validation
    await this.validateTechnicalContext(taskContext, assessment);

    // 4. Scope Clarity Assessment
    await this.assessScopeClarity(taskContext, assessment);

    // 5. Priority and Urgency Validation
    await this.validatePriorityContext(taskContext, assessment);

    // 6. Historical Context Integration
    await this.integrateHistoricalContext(taskContext, assessment);

    // 7. Agent Recommendation Based on Clarity
    await this.recommendAppropriateAgents(taskContext, assessment);

    // Calculate overall confidence and clarity
    this.calculateOverallClarity(assessment);

    console.log(`🎯 Context Assessment: ${assessment.overall} (${assessment.confidence}% confidence)`);

    if (assessment.requiredClarifications.length > 0) {
      console.log(`❓ ${assessment.requiredClarifications.length} clarifications needed before proceeding`);
    }

    return assessment;
  }

  /**
   * Ambiguity Detection - Find vague references and unclear terms
   */
  private async detectAmbiguity(context: TaskContext, assessment: ClarityAssessment): Promise<void> {
    const request = context.userRequest.toLowerCase();

    // Vague pronouns and references
    const ambiguousPronouns = ['it', 'this', 'that', 'these', 'those', 'them', 'thing', 'stuff', 'something'];
    const foundPronouns = ambiguousPronouns.filter(pronoun =>
      new RegExp(`\\b${pronoun}\\b`).test(request)
    );

    if (foundPronouns.length > 0) {
      assessment.issues.push({
        type: 'ambiguous_reference',
        severity: 'major',
        description: `Ambiguous references found: ${foundPronouns.join(', ')}`,
        examples: foundPronouns.map(p => `What does "${p}" refer to specifically?`),
        affectedArea: 'Reference clarity'
      });

      assessment.requiredClarifications.push({
        question: `Please specify what "${foundPronouns[0]}" refers to in your request.`,
        type: 'specification',
        importance: 'must_have',
        relatedTo: 'ambiguous references'
      });
    }

    // Unclear action words
    const vagueActions = ['fix', 'improve', 'update', 'change', 'modify', 'handle', 'deal with'];
    const foundActions = vagueActions.filter(action => request.includes(action));

    if (foundActions.length > 0) {
      assessment.issues.push({
        type: 'unclear_scope',
        severity: 'major',
        description: `Vague action words detected: ${foundActions.join(', ')}`,
        examples: foundActions.map(a => `How specifically should we "${a}" this?`),
        affectedArea: 'Action specification'
      });

      assessment.requiredClarifications.push({
        question: `What specific action should be taken? (instead of "${foundActions[0]}")`,
        type: 'specification',
        importance: 'must_have',
        suggestedAnswers: ['Add new feature', 'Fix bug', 'Refactor code', 'Update documentation', 'Optimize performance'],
        relatedTo: 'action clarity'
      });
    }

    // Conflicting requirements detection
    const conflictPatterns = [
      { pattern: /(quick|fast|rapid).*(thorough|comprehensive|detailed)/i, message: 'Conflicting speed vs. thoroughness requirements' },
      { pattern: /(simple|basic).*(advanced|complex|sophisticated)/i, message: 'Conflicting complexity requirements' },
      { pattern: /(minimal|small).*(complete|full|comprehensive)/i, message: 'Conflicting scope requirements' }
    ];

    conflictPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(context.userRequest)) {
        assessment.issues.push({
          type: 'conflicting_requirements',
          severity: 'critical',
          description: message,
          affectedArea: 'Requirements consistency'
        });

        assessment.requiredClarifications.push({
          question: `There seems to be conflicting requirements. Please clarify your priority: ${message}`,
          type: 'priority',
          importance: 'must_have',
          relatedTo: 'requirement conflicts'
        });
      }
    });
  }

  /**
   * Specification Completeness Check
   */
  private async checkSpecificationCompleteness(context: TaskContext, assessment: ClarityAssessment): Promise<void> {
    const request = context.userRequest.toLowerCase();

    // Check for missing WHERE (location/file)
    const hasLocation = /file|component|page|service|\.tsx?|\.jsx?|src\/|pages\/|components\//.test(request);
    if (!hasLocation && !context.filePath) {
      assessment.issues.push({
        type: 'missing_specifics',
        severity: 'major',
        description: 'No specific file or component location mentioned',
        affectedArea: 'Location specification'
      });

      assessment.requiredClarifications.push({
        question: 'Which file, component, or area of the codebase should be modified?',
        type: 'specification',
        importance: 'must_have',
        suggestedAnswers: ['Specific file path', 'Component name', 'Page location', 'Service module'],
        relatedTo: 'target location'
      });
    }

    // Check for missing WHAT (specific action)
    const hasSpecificAction = /create|add|remove|delete|implement|build|design|configure|install|update/.test(request);
    if (!hasSpecificAction) {
      assessment.issues.push({
        type: 'missing_specifics',
        severity: 'critical',
        description: 'No specific action or deliverable mentioned',
        affectedArea: 'Action specification'
      });

      assessment.requiredClarifications.push({
        question: 'What specific action or deliverable is expected?',
        type: 'specification',
        importance: 'must_have',
        suggestedAnswers: ['Create new feature', 'Fix existing bug', 'Add functionality', 'Remove feature', 'Refactor code'],
        relatedTo: 'expected action'
      });
    }

    // Check for missing HOW (technical approach)
    const hasTechnicalContext = /react|typescript|javascript|antd|supabase|api|database|component|hook|service/.test(request);
    if (!hasTechnicalContext && this.projectContext) {
      assessment.issues.push({
        type: 'missing_context',
        severity: 'minor',
        description: 'Limited technical context provided',
        affectedArea: 'Technical specification'
      });

      assessment.requiredClarifications.push({
        question: `Should this use our existing tech stack (${this.projectContext.framework}, ${this.projectContext.language})?`,
        type: 'technical',
        importance: 'should_have',
        relatedTo: 'technical approach'
      });
    }

    // Check for missing WHY (business context)
    const hasBusinessContext = /user|feature|requirement|business|customer|client|goal|purpose|because|need|want/.test(request);
    if (!hasBusinessContext) {
      assessment.issues.push({
        type: 'missing_context',
        severity: 'minor',
        description: 'No business context or reasoning provided',
        affectedArea: 'Business justification'
      });

      assessment.requiredClarifications.push({
        question: 'What is the business reason or user benefit for this change?',
        type: 'context',
        importance: 'nice_to_have',
        relatedTo: 'business context'
      });
    }
  }

  /**
   * Technical Context Validation
   */
  private async validateTechnicalContext(context: TaskContext, assessment: ClarityAssessment): Promise<void> {
    if (!this.projectContext) return;

    const request = context.userRequest.toLowerCase();

    // Check technology alignment
    const mentionedTechs = this.extractMentionedTechnologies(context.userRequest);
    const unknownTechs = mentionedTechs.filter(tech =>
      !this.projectContext!.dependencies.includes(tech) &&
      !this.projectContext!.framework.toLowerCase().includes(tech.toLowerCase())
    );

    if (unknownTechs.length > 0) {
      assessment.issues.push({
        type: 'missing_context',
        severity: 'major',
        description: `Unknown or uninstalled technologies mentioned: ${unknownTechs.join(', ')}`,
        affectedArea: 'Technology stack'
      });

      assessment.requiredClarifications.push({
        question: `The following technologies aren't in our current stack: ${unknownTechs.join(', ')}. Should we install them or use existing alternatives?`,
        type: 'technical',
        importance: 'must_have',
        suggestedAnswers: ['Install new dependencies', 'Use existing alternatives', 'Clarify requirements'],
        relatedTo: 'technology dependencies'
      });
    }

    // Check architectural context
    if (request.includes('backend') || request.includes('api') || request.includes('server')) {
      if (!this.projectContext.architecture.includes('backend')) {
        assessment.requiredClarifications.push({
          question: 'This seems to require backend changes. Should this be implemented as a Supabase Edge Function?',
          type: 'technical',
          importance: 'should_have',
          suggestedAnswers: ['Supabase Edge Function', 'Client-side solution', 'External API integration'],
          relatedTo: 'backend architecture'
        });
      }
    }
  }

  /**
   * Scope Clarity Assessment
   */
  private async assessScopeClarity(context: TaskContext, assessment: ClarityAssessment): Promise<void> {
    const request = context.userRequest;

    // Detect scope indicators
    const scopeIndicators = {
      minimal: ['small', 'simple', 'basic', 'minimal', 'quick', 'minor'],
      moderate: ['feature', 'component', 'page', 'service', 'update'],
      extensive: ['complete', 'full', 'comprehensive', 'entire', 'whole', 'all', 'system', 'platform'],
      unclear: ['everything', 'all', 'complete overhaul', 'rebuild', 'redesign']
    };

    let detectedScope = 'unclear';
    let scopeConfidence = 0;

    Object.entries(scopeIndicators).forEach(([scope, indicators]) => {
      const matches = indicators.filter(indicator =>
        request.toLowerCase().includes(indicator)
      );

      if (matches.length > scopeConfidence) {
        detectedScope = scope;
        scopeConfidence = matches.length;
      }
    });

    if (detectedScope === 'unclear' || scopeConfidence === 0) {
      assessment.issues.push({
        type: 'unclear_scope',
        severity: 'major',
        description: 'Project scope is not clearly defined',
        affectedArea: 'Scope definition'
      });

      assessment.requiredClarifications.push({
        question: 'What is the expected scope of this work?',
        type: 'scope',
        importance: 'must_have',
        suggestedAnswers: [
          'Small change (< 1 day)',
          'Medium feature (1-3 days)',
          'Large feature (1+ weeks)',
          'System-wide changes'
        ],
        relatedTo: 'work scope'
      });
    }

    // Set complexity based on scope
    if (detectedScope === 'minimal') {
      assessment.estimatedComplexity = 'simple';
    } else if (detectedScope === 'moderate') {
      assessment.estimatedComplexity = 'moderate';
    } else if (detectedScope === 'extensive') {
      assessment.estimatedComplexity = 'complex';
    } else {
      assessment.estimatedComplexity = 'expert';
    }
  }

  /**
   * Priority and Urgency Validation
   */
  private async validatePriorityContext(context: TaskContext, assessment: ClarityAssessment): Promise<void> {
    const request = context.userRequest.toLowerCase();

    // Urgency indicators
    const urgencyIndicators = {
      emergency: ['urgent', 'asap', 'immediately', 'critical', 'blocking', 'broken'],
      high: ['soon', 'priority', 'important', 'needed'],
      medium: ['when possible', 'next', 'should'],
      low: ['sometime', 'eventually', 'nice to have', 'if time']
    };

    let detectedUrgency = context.urgency;
    let conflictingUrgencies: string[] = [];

    Object.entries(urgencyIndicators).forEach(([urgency, indicators]) => {
      const hasIndicators = indicators.some(indicator => request.includes(indicator));
      if (hasIndicators) {
        if (detectedUrgency !== urgency) {
          conflictingUrgencies.push(urgency);
        } else {
          detectedUrgency = urgency as any;
        }
      }
    });

    if (conflictingUrgencies.length > 1) {
      assessment.issues.push({
        type: 'conflicting_requirements',
        severity: 'major',
        description: `Conflicting urgency indicators: ${conflictingUrgencies.join(', ')}`,
        affectedArea: 'Priority specification'
      });

      assessment.requiredClarifications.push({
        question: 'What is the actual urgency/priority level for this task?',
        type: 'priority',
        importance: 'should_have',
        suggestedAnswers: ['Emergency (fix now)', 'High (this week)', 'Medium (next sprint)', 'Low (when time permits)'],
        relatedTo: 'task priority'
      });
    }
  }

  /**
   * Historical Context Integration
   */
  private async integrateHistoricalContext(context: TaskContext, assessment: ClarityAssessment): Promise<void> {
    if (context.previousConversation && context.previousConversation.length > 0) {
      // Look for related previous requests
      const relatedConversations = context.previousConversation.filter(conv =>
        this.calculateContextSimilarity(context.userRequest, conv.userMessage) > 0.7
      );

      if (relatedConversations.length > 0) {
        const lastRelated = relatedConversations[relatedConversations.length - 1];

        if (lastRelated && lastRelated.outcome === 'clarification_needed') {
          assessment.issues.push({
            type: 'missing_context',
            severity: 'major',
            description: 'Previous similar request required clarification - may need additional context',
            affectedArea: 'Historical context'
          });

          assessment.requiredClarifications.push({
            question: 'This seems related to a previous request that needed clarification. Please provide additional context to avoid similar issues.',
            type: 'context',
            importance: 'should_have',
            relatedTo: 'previous conversations'
          });
        }
      }
    }
  }

  /**
   * Agent Recommendation Based on Clarity
   */
  private async recommendAppropriateAgents(context: TaskContext, assessment: ClarityAssessment): Promise<void> {
    const request = context.userRequest.toLowerCase();

    // Agent matching based on clarity and context
    if (request.includes('ui') || request.includes('component') || request.includes('frontend')) {
      assessment.recommendedAgents.push('James (Frontend)');

      if (assessment.overall !== 'clear') {
        assessment.requiredClarifications.push({
          question: 'Which specific UI components or pages should James focus on?',
          type: 'specification',
          importance: 'must_have',
          relatedTo: 'frontend scope'
        });
      }
    }

    if (request.includes('api') || request.includes('backend') || request.includes('database')) {
      assessment.recommendedAgents.push('Marcus (Backend)');

      if (assessment.overall !== 'clear') {
        assessment.requiredClarifications.push({
          question: 'What specific backend functionality or API endpoints are needed?',
          type: 'technical',
          importance: 'must_have',
          relatedTo: 'backend scope'
        });
      }
    }

    if (request.includes('test') || request.includes('bug') || request.includes('quality')) {
      assessment.recommendedAgents.push('Maria (QA)');

      if (assessment.overall !== 'clear') {
        assessment.requiredClarifications.push({
          question: 'What specific testing approach or quality criteria should Maria apply?',
          type: 'specification',
          importance: 'should_have',
          relatedTo: 'qa scope'
        });
      }
    }

    if (request.includes('ai') || request.includes('rag') || request.includes('ml') || request.includes('osint')) {
      assessment.recommendedAgents.push('Dr. AI (ML)');

      if (assessment.overall !== 'clear') {
        assessment.requiredClarifications.push({
          question: 'What AI/ML capabilities or OSINT features are specifically needed?',
          type: 'technical',
          importance: 'must_have',
          relatedTo: 'ai scope'
        });
      }
    }

    // If no specific agents identified but task is unclear, recommend PM
    if (assessment.recommendedAgents.length === 0 && assessment.overall !== 'clear') {
      assessment.recommendedAgents.push('Sarah (PM)');
      assessment.requiredClarifications.push({
        question: 'This request needs more definition. Should Sarah help break this down into specific tasks?',
        type: 'scope',
        importance: 'should_have',
        relatedTo: 'task definition'
      });
    }
  }

  /**
   * Calculate Overall Clarity Score
   */
  private calculateOverallClarity(assessment: ClarityAssessment): void {
    const totalIssues = assessment.issues.length;
    const blockingIssues = assessment.issues.filter(i => i.severity === 'blocking').length;
    const criticalIssues = assessment.issues.filter(i => i.severity === 'critical').length;
    const majorIssues = assessment.issues.filter(i => i.severity === 'major').length;

    // Calculate confidence based on issues
    let confidence = 100;
    confidence -= blockingIssues * 40;
    confidence -= criticalIssues * 25;
    confidence -= majorIssues * 15;
    confidence -= (totalIssues - blockingIssues - criticalIssues - majorIssues) * 5;

    assessment.confidence = Math.max(0, confidence);

    // Determine overall clarity
    if (blockingIssues > 0) {
      assessment.overall = 'missing';
      assessment.contextSufficiency = 'insufficient';
    } else if (criticalIssues > 0 || assessment.confidence < 50) {
      assessment.overall = 'ambiguous';
      assessment.contextSufficiency = 'partial';
    } else if (majorIssues > 0 || assessment.confidence < 80) {
      assessment.overall = 'ambiguous';
      assessment.contextSufficiency = 'partial';
    } else {
      assessment.overall = 'clear';
      assessment.contextSufficiency = 'sufficient';
    }
  }

  /**
   * Helper Methods
   */
  private async loadProjectContext(): Promise<void> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      this.projectContext = {
        framework: 'React',
        language: 'TypeScript',
        dependencies: Object.keys({
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        }),
        architecture: 'Frontend + Supabase Backend',
        currentFeatures: ['Portfolio Management', 'Deal Flow', 'OSINT Brain', 'Settings'],
        knownIssues: ['Router configuration issues', 'Ant Design compatibility']
      };

      console.log('📋 Project context loaded');
    } catch (error) {
      console.error('❌ Failed to load project context:', error);
    }
  }

  private async loadConversationHistory(): Promise<void> {
    try {
      const historyPath = path.join(process.cwd(), '.versatil', 'conversation-history.json');
      const historyContent = await fs.readFile(historyPath, 'utf-8');
      this.conversationHistory = JSON.parse(historyContent);
    } catch (error) {
      // No history file yet - start fresh
      this.conversationHistory = [];
    }
  }

  private initializeClarityPatterns(): void {
    // Patterns for detecting various types of clarity issues
    this.clarityPatterns.set('vague_pronouns', [
      /\bit\b/gi, /\bthis\b/gi, /\bthat\b/gi, /\bthese\b/gi, /\bthose\b/gi
    ]);

    this.clarityPatterns.set('vague_actions', [
      /\bfix\b/gi, /\bimprove\b/gi, /\bupdate\b/gi, /\bchange\b/gi, /\bmodify\b/gi
    ]);

    this.clarityPatterns.set('scope_indicators', [
      /\ball\b/gi, /\beverything\b/gi, /\bcomplete\b/gi, /\bentire\b/gi, /\bwhole\b/gi
    ]);
  }

  private initializeDomainKnowledge(): void {
    // Domain-specific knowledge for better context understanding
    this.domainKnowledge.set('frontend', [
      'component', 'ui', 'styling', 'responsive', 'react', 'jsx', 'tsx', 'css', 'antd'
    ]);

    this.domainKnowledge.set('backend', [
      'api', 'endpoint', 'service', 'database', 'supabase', 'edge function', 'auth'
    ]);

    this.domainKnowledge.set('testing', [
      'test', 'spec', 'unit', 'integration', 'e2e', 'playwright', 'jest', 'cypress'
    ]);

    this.domainKnowledge.set('ai', [
      'rag', 'llm', 'ai', 'ml', 'osint', 'neural', 'model', 'embedding'
    ]);
  }

  private extractMentionedTechnologies(request: string): string[] {
    const techKeywords = [
      'react', 'typescript', 'javascript', 'antd', 'supabase', 'playwright',
      'cypress', 'jest', 'vite', 'nodejs', 'python', 'sql', 'postgresql'
    ];

    return techKeywords.filter(tech =>
      request.toLowerCase().includes(tech)
    );
  }

  private calculateContextSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation based on common words
    const words1 = text1.toLowerCase().split(/\W+/);
    const words2 = text2.toLowerCase().split(/\W+/);

    const commonWords = words1.filter(word =>
      words2.includes(word) && word.length > 3
    );

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Public API Methods
   */
  async saveConversationContext(userMessage: string, agentResponse: string, outcome: string): Promise<void> {
    const context: ConversationContext = {
      timestamp: new Date().toISOString(),
      userMessage,
      agentResponse,
      outcome: outcome as any
    };

    this.conversationHistory.push(context);

    // Keep only last 50 conversations
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }

    // Save to file
    try {
      const historyPath = path.join(process.cwd(), '.versatil', 'conversation-history.json');
      await fs.writeFile(historyPath, JSON.stringify(this.conversationHistory, null, 2));
    } catch (error) {
      console.error('❌ Failed to save conversation history:', error);
    }
  }

  getValidatorStatus() {
    return {
      projectContextLoaded: !!this.projectContext,
      conversationHistorySize: this.conversationHistory.length,
      clarityPatterns: this.clarityPatterns.size,
      domainKnowledge: this.domainKnowledge.size,
      status: 'operational'
    };
  }
}

// Export singleton instance
export const enhancedContextValidator = new EnhancedContextValidator();

// Public API functions
export async function validateEnhancedContext(userRequest: string, additionalContext?: Partial<TaskContext>): Promise<ClarityAssessment> {
  return await enhancedContextValidator.validateTaskContext(userRequest, additionalContext);
}

export async function saveConversationOutcome(userMessage: string, agentResponse: string, outcome: string): Promise<void> {
  return await enhancedContextValidator.saveConversationContext(userMessage, agentResponse, outcome);
}

export function getContextValidatorStatus() {
  return enhancedContextValidator.getValidatorStatus();
}

console.log('🧠 Enhanced Context Validator: LOADED');