/**
 * Adaptive Agent Creator
 * Automatically creates new specialized agents when specific patterns/needs are detected
 */

import { VERSATILAgentDispatcher, AgentTrigger } from './agent-dispatcher';
import { enhancedContextValidator } from './enhanced-context-validator';

export interface AgentCreationTrigger {
  patternType: 'technology' | 'domain' | 'workflow' | 'error_pattern';
  detectedPattern: string;
  frequency: number;
  confidence: number;
  suggestedAgent: AgentTemplate;
}

export interface AgentTemplate {
  name: string;
  role: string;
  specialization: string;
  triggers: {
    filePatterns: string[];
    keywords: string[];
    technologies: string[];
  };
  mcpTools: string[];
  collaborators: string[];
  priority: number;
}

export class AdaptiveAgentCreator {
  private patternDetector: Map<string, AgentCreationTrigger> = new Map();
  private agentTemplates: Map<string, AgentTemplate> = new Map();
  private dispatcher: VERSATILAgentDispatcher;

  constructor(dispatcher: VERSATILAgentDispatcher) {
    this.dispatcher = dispatcher;
    this.initializeAgentTemplates();
  }

  /**
   * Analyze project patterns and suggest/create new agents
   */
  async analyzeProjectNeeds(projectPath: string): Promise<AgentCreationTrigger[]> {
    const patterns = await this.detectPatterns(projectPath);
    const suggestions: AgentCreationTrigger[] = [];

    for (const pattern of patterns) {
      const trigger = await this.evaluatePatternForAgentCreation(pattern);
      if (trigger && trigger.confidence > 0.8) {
        suggestions.push(trigger);
      }
    }

    return suggestions;
  }

  /**
   * Automatically create agent if pattern confidence is high enough
   */
  async createAgentIfNeeded(trigger: AgentCreationTrigger): Promise<boolean> {
    if (trigger.confidence < 0.9) {
      console.log(`🤔 Pattern detected but confidence too low: ${trigger.confidence}`);
      return false;
    }

    console.log(`🚀 Auto-creating specialized agent: ${trigger.suggestedAgent.name}`);

    const agentConfig: AgentTrigger = {
      agent: trigger.suggestedAgent.name,
      priority: trigger.suggestedAgent.priority,
      triggers: {
        filePatterns: trigger.suggestedAgent.triggers.filePatterns,
        keywords: trigger.suggestedAgent.triggers.keywords,
        actions: ['optimize', 'validate', 'deploy'],
        dependencies: trigger.suggestedAgent.triggers.technologies,
        errorPatterns: [trigger.detectedPattern]
      },
      autoActivate: true,
      mcpTools: trigger.suggestedAgent.mcpTools,
      collaborators: trigger.suggestedAgent.collaborators
    };

    this.dispatcher.registerAgent(agentConfig);
    console.log(`✅ ${trigger.suggestedAgent.name} agent created and registered`);

    return true;
  }

  /**
   * Initialize pre-defined agent templates for common patterns
   */
  private initializeAgentTemplates(): void {
    // DevOps Agent for Docker/K8s patterns
    this.agentTemplates.set('devops', {
      name: 'DevOps-Dan',
      role: 'DevOps Engineer',
      specialization: 'Infrastructure, CI/CD, Deployment',
      triggers: {
        filePatterns: ['Dockerfile', '*.yml', '*.yaml', '*.tf', 'docker-compose.*'],
        keywords: ['deploy', 'infrastructure', 'kubernetes', 'docker'],
        technologies: ['docker', 'kubernetes', 'terraform', 'helm']
      },
      mcpTools: ['docker_mcp', 'kubernetes_mcp', 'terraform_mcp'],
      collaborators: ['Marcus-Backend', 'Maria-QA'],
      priority: 6
    });

    // Security Agent for security patterns
    this.agentTemplates.set('security', {
      name: 'Security-Sam',
      role: 'Security Engineer',
      specialization: 'Security auditing, vulnerability detection',
      triggers: {
        filePatterns: ['*.security.ts', '*auth*', '*security*'],
        keywords: ['auth', 'security', 'vulnerability', 'encrypt'],
        technologies: ['oauth', 'jwt', 'ssl', 'encryption']
      },
      mcpTools: ['security_scanner_mcp', 'vulnerability_mcp'],
      collaborators: ['Marcus-Backend', 'Maria-QA'],
      priority: 8
    });

    // Data Engineer for data pipeline patterns
    this.agentTemplates.set('data', {
      name: 'Data-Diana',
      role: 'Data Engineer',
      specialization: 'Data pipelines, ETL, analytics',
      triggers: {
        filePatterns: ['*.sql', '*.py', '*etl*', '*pipeline*'],
        keywords: ['data', 'pipeline', 'etl', 'analytics'],
        technologies: ['pandas', 'spark', 'airflow', 'kafka']
      },
      mcpTools: ['data_pipeline_mcp', 'sql_analyzer_mcp'],
      collaborators: ['Dr.AI-ML', 'Marcus-Backend'],
      priority: 7
    });

    // Mobile Agent for mobile development
    this.agentTemplates.set('mobile', {
      name: 'Mobile-Mike',
      role: 'Mobile Developer',
      specialization: 'iOS, Android, React Native',
      triggers: {
        filePatterns: ['*.swift', '*.kt', '*.java', '*.dart'],
        keywords: ['mobile', 'ios', 'android', 'flutter'],
        technologies: ['react-native', 'flutter', 'swift', 'kotlin']
      },
      mcpTools: ['mobile_testing_mcp', 'device_farm_mcp'],
      collaborators: ['James-Frontend', 'Maria-QA'],
      priority: 6
    });
  }

  /**
   * Detect technology/domain patterns in project
   */
  private async detectPatterns(projectPath: string): Promise<string[]> {
    // This would scan files, package.json, etc. to detect patterns
    const patterns: string[] = [];

    // Example pattern detection logic
    const packageJson = await this.readPackageJson(projectPath);
    if (packageJson) {
      // DevOps patterns
      if (packageJson.scripts?.['docker:build'] || packageJson.devDependencies?.['@types/docker']) {
        patterns.push('docker_workflow');
      }

      // Mobile patterns
      if (packageJson.dependencies?.['react-native'] || packageJson.dependencies?.['@react-native']) {
        patterns.push('react_native_development');
      }

      // Data patterns
      if (packageJson.dependencies?.['pandas'] || packageJson.dependencies?.['apache-airflow']) {
        patterns.push('data_pipeline');
      }
    }

    return patterns;
  }

  /**
   * Evaluate if pattern warrants agent creation
   */
  private async evaluatePatternForAgentCreation(pattern: string): Promise<AgentCreationTrigger | null> {
    const confidence = this.calculatePatternConfidence(pattern);

    if (pattern === 'docker_workflow' && confidence > 0.8) {
      return {
        patternType: 'technology',
        detectedPattern: pattern,
        frequency: 1,
        confidence,
        suggestedAgent: this.agentTemplates.get('devops')!
      };
    }

    if (pattern === 'react_native_development' && confidence > 0.8) {
      return {
        patternType: 'technology',
        detectedPattern: pattern,
        frequency: 1,
        confidence,
        suggestedAgent: this.agentTemplates.get('mobile')!
      };
    }

    return null;
  }

  private calculatePatternConfidence(pattern: string): number {
    // Simplified confidence calculation
    // In real implementation, this would analyze multiple factors
    return Math.random() * 0.4 + 0.6; // 0.6-1.0 range
  }

  private async readPackageJson(projectPath: string): Promise<any> {
    try {
      // Would read actual package.json file
      return { dependencies: {}, devDependencies: {}, scripts: {} };
    } catch {
      return null;
    }
  }

  /**
   * Get list of available agent templates
   */
  getAvailableTemplates(): AgentTemplate[] {
    return Array.from(this.agentTemplates.values());
  }

  /**
   * Create custom agent template
   */
  createCustomTemplate(template: AgentTemplate): void {
    this.agentTemplates.set(template.name.toLowerCase(), template);
  }
}

export const adaptiveAgentCreator = new AdaptiveAgentCreator(new VERSATILAgentDispatcher());