/**
 * VERSATIL SDLC Framework - Architecture Dan Agent
 * System Architecture & Design Patterns Specialist
 *
 * Fills the critical SDLC flywheel gap in Design & Architecture phase
 */

import { BaseAgent, AgentActivationContext, AgentResponse } from './base-agent';
import { VERSATILLogger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ArchitecturalDecision {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'superseded';
  context: string;
  decision: string;
  consequences: string[];
  date: string;
  alternatives: string[];
}

export interface SystemDesignPattern {
  name: string;
  type: 'architectural' | 'design' | 'integration';
  description: string;
  applicability: string[];
  implementation: string;
  tradeoffs: string[];
}

export class ArchitectureDan extends BaseAgent {
  id = 'architecture-dan';
  name = 'Architecture Dan';
  specialization = 'System Architecture & Design Patterns';

  private architecturalDecisions: Map<string, ArchitecturalDecision> = new Map();
  private designPatterns: Map<string, SystemDesignPattern> = new Map();

  constructor(logger: VERSATILLogger) {
    super(logger);
    this.initializeDesignPatterns();
  }

  /**
   * Enhanced Agent Activation with Architecture Focus
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    this.logger.info('🏗️ Architecture Dan activated', {
      filePath: context.filePath,
      trigger: context.trigger
    }, 'architecture-dan');

    const validationResults = await this.runStandardValidation(context);

    if (!validationResults.isValid) {
      return {
        agentId: this.id,
        success: false,
        suggestions: validationResults.errors.map(error => ({
          type: 'error',
          message: error,
          line: 0,
          file: context.filePath
        })),
        context: validationResults
      };
    }

    // Architecture-specific validation
    const architectureResults = await this.runArchitecturalValidation(context);

    return {
      agentId: this.id,
      success: architectureResults.isValid,
      suggestions: [
        ...architectureResults.suggestions,
        ...await this.generateArchitecturalInsights(context)
      ],
      context: {
        ...validationResults,
        architectural: architectureResults
      }
    };
  }

  /**
   * Architecture-specific validation
   */
  private async runArchitecturalValidation(context: AgentActivationContext): Promise<any> {
    const suggestions = [];
    let isValid = true;

    try {
      const content = await fs.readFile(context.filePath, 'utf-8');
      const fileExt = path.extname(context.filePath);

      // System design pattern analysis
      const patternAnalysis = await this.analyzeDesignPatterns(content, fileExt);
      suggestions.push(...patternAnalysis.suggestions);

      // Architecture decision validation
      const decisionValidation = await this.validateArchitecturalDecisions(content, context.filePath);
      suggestions.push(...decisionValidation.suggestions);

      // Scalability assessment
      const scalabilityAssessment = await this.assessScalability(content, fileExt);
      suggestions.push(...scalabilityAssessment.suggestions);

      // Integration pattern validation
      const integrationValidation = await this.validateIntegrationPatterns(content, context);
      suggestions.push(...integrationValidation.suggestions);

      this.logger.debug('Architecture validation completed', {
        patternCount: patternAnalysis.patterns.length,
        suggestionsCount: suggestions.length,
        filePath: context.filePath
      }, 'architecture-dan');

    } catch (error) {
      this.logger.error('Architecture validation failed', {
        error: error.message,
        filePath: context.filePath
      }, 'architecture-dan');

      isValid = false;
      suggestions.push({
        type: 'error',
        message: `Architecture validation failed: ${error.message}`,
        line: 0,
        file: context.filePath
      });
    }

    return {
      isValid,
      suggestions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze design patterns in code
   */
  private async analyzeDesignPatterns(content: string, fileExt: string): Promise<any> {
    const suggestions = [];
    const patterns = [];

    // Detect common architectural patterns
    const detectedPatterns = this.detectArchitecturalPatterns(content);
    patterns.push(...detectedPatterns);

    // Validate pattern implementation
    for (const pattern of detectedPatterns) {
      const validation = this.validatePatternImplementation(pattern, content);
      if (!validation.isCorrect) {
        suggestions.push({
          type: 'warning',
          message: `${pattern.name} pattern implementation issue: ${validation.issue}`,
          line: validation.line || 0,
          file: '',
          fix: validation.suggestedFix
        });
      }
    }

    // Suggest appropriate patterns
    const suggestedPatterns = this.suggestDesignPatterns(content, fileExt);
    for (const pattern of suggestedPatterns) {
      suggestions.push({
        type: 'info',
        message: `Consider implementing ${pattern.name} pattern: ${pattern.rationale}`,
        line: 0,
        file: '',
        fix: pattern.implementation
      });
    }

    return { patterns, suggestions };
  }

  /**
   * Detect architectural patterns in code
   */
  private detectArchitecturalPatterns(content: string): SystemDesignPattern[] {
    const patterns = [];

    // Singleton pattern detection
    if (content.includes('static instance') && content.includes('private constructor')) {
      patterns.push({
        name: 'Singleton',
        type: 'design',
        description: 'Ensures only one instance of a class exists',
        applicability: ['global state', 'resource management'],
        implementation: 'Static instance with private constructor',
        tradeoffs: ['Global state concerns', 'Testing difficulties', 'Thread safety']
      });
    }

    // Factory pattern detection
    if (content.includes('createComponent') || content.includes('Factory')) {
      patterns.push({
        name: 'Factory',
        type: 'design',
        description: 'Creates objects without specifying exact classes',
        applicability: ['object creation', 'polymorphism'],
        implementation: 'Factory method or abstract factory',
        tradeoffs: ['Flexibility vs complexity', 'Runtime type determination']
      });
    }

    // Observer pattern detection
    if (content.includes('addEventListener') || content.includes('subscribe') || content.includes('emit')) {
      patterns.push({
        name: 'Observer',
        type: 'architectural',
        description: 'Defines one-to-many dependency between objects',
        applicability: ['event handling', 'model-view separation'],
        implementation: 'Event emitters or callback registration',
        tradeoffs: ['Loose coupling vs debugging complexity']
      });
    }

    // MVC/MVP/MVVM pattern detection
    if (content.includes('controller') || content.includes('view') || content.includes('model')) {
      patterns.push({
        name: 'MVC/MVP/MVVM',
        type: 'architectural',
        description: 'Separates application logic from presentation',
        applicability: ['UI applications', 'web frameworks'],
        implementation: 'Model-View-Controller separation',
        tradeoffs: ['Code organization vs overhead']
      });
    }

    // Microservices pattern detection
    if (content.includes('service') && (content.includes('api') || content.includes('endpoint'))) {
      patterns.push({
        name: 'Microservices',
        type: 'architectural',
        description: 'Decomposes application into small, independent services',
        applicability: ['distributed systems', 'scalable applications'],
        implementation: 'Service-based architecture with APIs',
        tradeoffs: ['Scalability vs complexity', 'Network latency']
      });
    }

    return patterns;
  }

  /**
   * Validate pattern implementation
   */
  private validatePatternImplementation(pattern: SystemDesignPattern, content: string): any {
    switch (pattern.name) {
      case 'Singleton':
        if (!content.includes('private constructor')) {
          return {
            isCorrect: false,
            issue: 'Singleton missing private constructor',
            suggestedFix: 'Add private constructor to prevent direct instantiation',
            line: this.findLineNumber(content, 'static instance')
          };
        }
        break;

      case 'Factory':
        if (!content.includes('interface') && !content.includes('abstract')) {
          return {
            isCorrect: false,
            issue: 'Factory pattern should use interfaces or abstract classes',
            suggestedFix: 'Define interface for created objects',
            line: this.findLineNumber(content, 'Factory')
          };
        }
        break;

      case 'Observer':
        if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
          return {
            isCorrect: false,
            issue: 'Observer pattern missing cleanup mechanism',
            suggestedFix: 'Implement removeEventListener for proper cleanup',
            line: this.findLineNumber(content, 'addEventListener')
          };
        }
        break;
    }

    return { isCorrect: true };
  }

  /**
   * Suggest appropriate design patterns
   */
  private suggestDesignPatterns(content: string, fileExt: string): any[] {
    const suggestions = [];

    // Suggest Singleton for configuration classes
    if (content.includes('config') && content.includes('class') && !content.includes('static instance')) {
      suggestions.push({
        name: 'Singleton',
        rationale: 'Configuration classes often benefit from Singleton pattern',
        implementation: 'Add static instance property and private constructor'
      });
    }

    // Suggest Factory for object creation
    if (content.includes('new ') && content.match(/new \w+\(/g)?.length > 3) {
      suggestions.push({
        name: 'Factory',
        rationale: 'Multiple object instantiations could benefit from Factory pattern',
        implementation: 'Create factory method to centralize object creation'
      });
    }

    // Suggest Strategy pattern for conditional logic
    if (content.includes('if') && content.includes('else') && content.match(/if.*else/g)?.length > 2) {
      suggestions.push({
        name: 'Strategy',
        rationale: 'Complex conditional logic could be simplified with Strategy pattern',
        implementation: 'Extract conditions into strategy classes'
      });
    }

    // Suggest Decorator for feature enhancement
    if (content.includes('extends') && content.includes('super')) {
      suggestions.push({
        name: 'Decorator',
        rationale: 'Consider Decorator pattern for flexible feature composition',
        implementation: 'Use composition over inheritance for dynamic behavior'
      });
    }

    return suggestions;
  }

  /**
   * Validate architectural decisions
   */
  private async validateArchitecturalDecisions(content: string, filePath: string): Promise<any> {
    const suggestions = [];

    // Check for architectural decision records (ADRs)
    const hasADR = await this.checkForADR(filePath);
    if (!hasADR && this.isArchitecturallySignificant(content)) {
      suggestions.push({
        type: 'info',
        message: 'Consider creating an Architecture Decision Record (ADR) for this component',
        line: 0,
        file: filePath,
        fix: 'Document architectural decisions in ADR format'
      });
    }

    // Technology stack consistency
    const techStackValidation = this.validateTechnologyStack(content, filePath);
    suggestions.push(...techStackValidation);

    return { suggestions };
  }

  /**
   * Assess scalability concerns
   */
  private async assessScalability(content: string, fileExt: string): Promise<any> {
    const suggestions = [];

    // Database scalability
    if (content.includes('SELECT *') || content.includes('select *')) {
      suggestions.push({
        type: 'warning',
        message: 'SELECT * queries can impact scalability - specify needed columns',
        line: this.findLineNumber(content, 'SELECT *'),
        file: '',
        fix: 'Replace SELECT * with specific column names'
      });
    }

    // N+1 query detection
    if (content.includes('forEach') && content.includes('await') && content.includes('query')) {
      suggestions.push({
        type: 'warning',
        message: 'Potential N+1 query problem - consider batch operations',
        line: this.findLineNumber(content, 'forEach'),
        file: '',
        fix: 'Use batch queries or eager loading'
      });
    }

    // Memory management
    if (content.includes('setInterval') && !content.includes('clearInterval')) {
      suggestions.push({
        type: 'error',
        message: 'Memory leak risk - missing clearInterval',
        line: this.findLineNumber(content, 'setInterval'),
        file: '',
        fix: 'Add clearInterval in cleanup or component unmount'
      });
    }

    // Large object creation
    if (content.includes('new Array(') && content.match(/new Array\((\d+)\)/)?.[1]) {
      const size = parseInt(content.match(/new Array\((\d+)\)/)?.[1] || '0');
      if (size > 10000) {
        suggestions.push({
          type: 'warning',
          message: `Large array creation (${size} elements) may impact performance`,
          line: this.findLineNumber(content, 'new Array('),
          file: '',
          fix: 'Consider pagination, virtualization, or streaming'
        });
      }
    }

    return { suggestions };
  }

  /**
   * Validate integration patterns
   */
  private async validateIntegrationPatterns(content: string, context: AgentActivationContext): Promise<any> {
    const suggestions = [];

    // API integration patterns
    if (content.includes('fetch') || content.includes('axios')) {
      // Retry mechanism
      if (!content.includes('retry') && !content.includes('catch')) {
        suggestions.push({
          type: 'warning',
          message: 'API calls should include error handling and retry logic',
          line: this.findLineNumber(content, 'fetch'),
          file: context.filePath,
          fix: 'Add try-catch with exponential backoff retry'
        });
      }

      // Timeout handling
      if (!content.includes('timeout') && !content.includes('AbortController')) {
        suggestions.push({
          type: 'info',
          message: 'Consider adding timeout handling for API calls',
          line: this.findLineNumber(content, 'fetch'),
          file: context.filePath,
          fix: 'Implement AbortController or timeout parameter'
        });
      }
    }

    // Event-driven integration
    if (content.includes('emit') || content.includes('publish')) {
      if (!content.includes('error')) {
        suggestions.push({
          type: 'warning',
          message: 'Event-driven systems should handle event failures',
          line: this.findLineNumber(content, 'emit'),
          file: context.filePath,
          fix: 'Add error event handling and dead letter queues'
        });
      }
    }

    return { suggestions };
  }

  /**
   * Generate architectural insights
   */
  private async generateArchitecturalInsights(context: AgentActivationContext): Promise<any[]> {
    const insights = [];

    try {
      const content = await fs.readFile(context.filePath, 'utf-8');
      const fileExt = path.extname(context.filePath);

      // Component coupling analysis
      const couplingAnalysis = this.analyzeCoupling(content);
      if (couplingAnalysis.tightlyCoupled.length > 0) {
        insights.push({
          type: 'info',
          message: `High coupling detected with: ${couplingAnalysis.tightlyCoupled.join(', ')}`,
          line: 0,
          file: context.filePath,
          fix: 'Consider dependency injection or interface segregation'
        });
      }

      // SOLID principles validation
      const solidValidation = this.validateSOLIDPrinciples(content);
      insights.push(...solidValidation);

      // Architecture layer validation
      const layerValidation = this.validateArchitecturalLayers(content, context.filePath);
      insights.push(...layerValidation);

    } catch (error) {
      this.logger.error('Failed to generate architectural insights', {
        error: error.message,
        filePath: context.filePath
      }, 'architecture-dan');
    }

    return insights;
  }

  /**
   * Initialize common design patterns
   */
  private initializeDesignPatterns(): void {
    // Creational Patterns
    this.designPatterns.set('Singleton', {
      name: 'Singleton',
      type: 'design',
      description: 'Ensures only one instance exists',
      applicability: ['Global state', 'Configuration', 'Logging'],
      implementation: 'Private constructor with static instance',
      tradeoffs: ['Global state', 'Testing difficulty', 'Thread safety']
    });

    this.designPatterns.set('Factory', {
      name: 'Factory',
      type: 'design',
      description: 'Creates objects without specifying exact classes',
      applicability: ['Object creation', 'Plugin systems', 'Polymorphism'],
      implementation: 'Factory method or abstract factory',
      tradeoffs: ['Flexibility vs complexity', 'Runtime determination']
    });

    // Architectural Patterns
    this.designPatterns.set('Microservices', {
      name: 'Microservices',
      type: 'architectural',
      description: 'Decomposes application into independent services',
      applicability: ['Distributed systems', 'Team scalability', 'Technology diversity'],
      implementation: 'Service mesh with API gateways',
      tradeoffs: ['Complexity', 'Network overhead', 'Data consistency']
    });

    this.designPatterns.set('Event Sourcing', {
      name: 'Event Sourcing',
      type: 'architectural',
      description: 'Stores state changes as events',
      applicability: ['Audit trails', 'Complex business logic', 'Time travel'],
      implementation: 'Event store with projections',
      tradeoffs: ['Storage overhead', 'Complexity', 'Eventual consistency']
    });
  }

  /**
   * Helper methods
   */
  private findLineNumber(content: string, searchText: string): number {
    const lines = content.split('\n');
    const lineIndex = lines.findIndex(line => line.includes(searchText));
    return lineIndex >= 0 ? lineIndex + 1 : 0;
  }

  private async checkForADR(filePath: string): Promise<boolean> {
    const projectRoot = this.findProjectRoot(filePath);
    const adrPath = path.join(projectRoot, 'docs', 'adr');

    try {
      await fs.access(adrPath);
      return true;
    } catch {
      return false;
    }
  }

  private isArchitecturallySignificant(content: string): boolean {
    const significantPatterns = [
      'class.*extends',
      'interface.*{',
      'abstract.*class',
      'implements.*{',
      'design.*pattern',
      'architecture',
      'microservice',
      'database',
      'cache',
      'queue'
    ];

    return significantPatterns.some(pattern =>
      new RegExp(pattern, 'i').test(content)
    );
  }

  private validateTechnologyStack(content: string, filePath: string): any[] {
    const suggestions = [];

    // Check for consistent framework usage
    if (content.includes('react') && content.includes('vue')) {
      suggestions.push({
        type: 'warning',
        message: 'Mixed frontend frameworks detected - ensure architectural consistency',
        line: 0,
        file: filePath,
        fix: 'Standardize on single frontend framework'
      });
    }

    return suggestions;
  }

  private analyzeCoupling(content: string): any {
    const imports = content.match(/import.*from ['"](.*)['"];?/g) || [];
    const tightlyCoupled = imports
      .filter(imp => !imp.includes('node_modules'))
      .filter(imp => imp.includes('../') || imp.includes('./'))
      .slice(0, 5); // Top 5 coupling issues

    return { tightlyCoupled };
  }

  private validateSOLIDPrinciples(content: string): any[] {
    const suggestions = [];

    // Single Responsibility Principle
    const classMatches = content.match(/class\s+\w+/g) || [];
    if (classMatches.length > 0) {
      const methods = content.match(/\s+(public|private|protected)?\s*\w+\s*\(/g) || [];
      if (methods.length > 10) {
        suggestions.push({
          type: 'info',
          message: 'Class has many methods - consider Single Responsibility Principle',
          line: 0,
          file: '',
          fix: 'Split class into smaller, focused classes'
        });
      }
    }

    // Dependency Inversion Principle
    if (content.includes('new ') && !content.includes('interface') && !content.includes('inject')) {
      suggestions.push({
        type: 'info',
        message: 'Consider dependency injection for better testability',
        line: 0,
        file: '',
        fix: 'Use dependency injection instead of direct instantiation'
      });
    }

    return suggestions;
  }

  private validateArchitecturalLayers(content: string, filePath: string): any[] {
    const suggestions = [];

    // Layer violations (e.g., UI calling database directly)
    if (filePath.includes('component') && content.includes('database')) {
      suggestions.push({
        type: 'warning',
        message: 'UI component should not directly access database - use service layer',
        line: 0,
        file: filePath,
        fix: 'Introduce service/repository layer between UI and data'
      });
    }

    return suggestions;
  }

  private findProjectRoot(filePath: string): string {
    let currentDir = path.dirname(filePath);

    while (currentDir !== path.dirname(currentDir)) {
      try {
        if (require('fs').existsSync(path.join(currentDir, 'package.json'))) {
          return currentDir;
        }
      } catch {
        // Continue searching
      }
      currentDir = path.dirname(currentDir);
    }

    return path.dirname(filePath);
  }
}