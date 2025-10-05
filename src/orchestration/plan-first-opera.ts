/**
 * VERSATIL SDLC Framework - Plan-First Orchestrator
 * Always creates comprehensive plans before execution with human-in-the-loop
 * Based on context engineering patterns
 */

import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import { IsolatedPaths } from './isolated-versatil-orchestrator.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MultiAgentPlan {
  metadata: {
    id: string;
    version: string;
    framework: string;
    timestamp: number;
    goal: string;
    estimatedTime: number;
    risk: 'low' | 'medium' | 'high';
  };
  
  context: {
    repository: any;
    stack: any;
    dependencies: any;
    constraints: string[];
  };
  
  phases: PlanPhase[];
  
  safeguards: {
    requireApproval: string[];
    rollbackPlan: RollbackStrategy;
    testingRequired: boolean;
    dryRunFirst: boolean;
  };
  
  humanCheckpoints: HumanCheckpoint[];
  
  outputs: {
    files: string[];
    deployments: string[];
    migrations: string[];
    documentation: string[];
  };
}

export interface PlanPhase {
  phase: string;
  description: string;
  agents: string[];
  tasks: Task[];
  dependencies: string[];
  estimatedDuration: number;
  parallelizable: boolean;
}

export interface Task {
  id: string;
  description: string;
  agent: string;
  inputs: any;
  expectedOutput: any;
  validation: ValidationCriteria;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ValidationCriteria {
  type: 'test' | 'review' | 'automated' | 'manual';
  criteria: string[];
  required: boolean;
}

export interface HumanCheckpoint {
  afterPhase: string;
  description: string;
  reviewItems: string[];
  approvalRequired: boolean;
  alternatives: string[];
}

export interface RollbackStrategy {
  type: 'git' | 'database' | 'deployment' | 'full';
  steps: string[];
  automated: boolean;
}

export class PlanFirstOpera extends EventEmitter {
  private logger: VERSATILLogger;
  private paths: IsolatedPaths;
  private mode: 'plan' | 'execute' = 'plan'; // ALWAYS start in plan mode
  private activePlans: Map<string, MultiAgentPlan> = new Map();
  
  // Safety configurations
  private safetyConfig = {
    requireApproval: true,
    planFirst: true,
    dryRun: false,
    maxAutoExecute: 0, // Never auto-execute by default
    allowedAutoActions: [] as string[]
  };

  constructor(paths: IsolatedPaths) {
    super();
    this.logger = new VERSATILLogger('PlanFirstOpera');
    this.paths = paths;
  }

  public async initialize(): Promise<void> {
    // Load saved plans
    await this.loadSavedPlans();
    
    // Set up plan templates based on context engineering
    await this.loadPlanTemplates();
    
    this.logger.info('Plan-First Opera initialized', {
      mode: this.mode,
      safetyConfig: this.safetyConfig
    });
  }

  /**
   * Create a comprehensive plan following context engineering patterns
   */
  public async createPlan(goal: string, context: any): Promise<MultiAgentPlan> {
    this.logger.info('Creating comprehensive plan', { goal, mode: this.mode });
    
    // Parse goal into structured format
    const parsedGoal = await this.parseGoal(goal);
    
    // Analyze context and requirements
    const analysis = await this.analyzeRequirements(parsedGoal, context);
    
    // Create multi-phase plan
    const plan: MultiAgentPlan = {
      metadata: {
        id: this.generatePlanId(),
        version: '1.0',
        framework: 'VERSATIL',
        timestamp: Date.now(),
        goal: goal,
        estimatedTime: 0,
        risk: analysis.riskLevel
      },
      
      context: {
        repository: context.project,
        stack: context.stack,
        dependencies: analysis.dependencies,
        constraints: analysis.constraints
      },
      
      phases: await this.createPhases(parsedGoal, analysis),
      
      safeguards: {
        requireApproval: this.identifyHighRiskActions(analysis),
        rollbackPlan: this.createRollbackStrategy(analysis),
        testingRequired: true,
        dryRunFirst: this.safetyConfig.dryRun
      },
      
      humanCheckpoints: this.createHumanCheckpoints(analysis),
      
      outputs: {
        files: analysis.expectedFiles,
        deployments: analysis.expectedDeployments,
        migrations: analysis.expectedMigrations,
        documentation: analysis.expectedDocs
      }
    };
    
    // Calculate estimated time
    plan.metadata.estimatedTime = this.calculateEstimatedTime(plan);
    
    // Save plan
    await this.savePlan(plan);
    
    // Emit plan created event
    this.emit('plan:created', plan);
    
    return plan;
  }

  /**
   * Create phases based on goal and analysis
   */
  private async createPhases(goal: any, analysis: any): Promise<PlanPhase[]> {
    const phases: PlanPhase[] = [];
    
    // Phase 1: Analysis and Planning
    phases.push({
      phase: 'Analysis',
      description: 'Analyze codebase and gather full context',
      agents: ['introspective-agent', 'context-scanner', 'pattern-analyzer'],
      tasks: [
        {
          id: 'analyze-repo',
          description: 'Scan repository structure and dependencies',
          agent: 'context-scanner',
          inputs: { path: this.paths.project.root },
          expectedOutput: { structure: {}, dependencies: {} },
          validation: {
            type: 'automated',
            criteria: ['valid-structure', 'dependencies-resolved'],
            required: true
          },
          riskLevel: 'low'
        },
        {
          id: 'identify-patterns',
          description: 'Identify existing patterns and best practices',
          agent: 'pattern-analyzer',
          inputs: { context: 'full' },
          expectedOutput: { patterns: [], recommendations: [] },
          validation: {
            type: 'automated',
            criteria: ['patterns-found', 'no-anti-patterns'],
            required: true
          },
          riskLevel: 'low'
        }
      ],
      dependencies: [],
      estimatedDuration: 300000, // 5 minutes
      parallelizable: true
    });
    
    // Phase 2: Design and Architecture
    if (analysis.requiresDesign) {
      phases.push({
        phase: 'Design',
        description: 'Create architecture and UI/UX design',
        agents: ['claude-architect', 'ui-ux-specialist', 'shadcn-designer'],
        tasks: [
          {
            id: 'create-architecture',
            description: 'Design component architecture',
            agent: 'claude-architect',
            inputs: { requirements: goal, patterns: 'from-analysis' },
            expectedOutput: { architecture: {}, diagrams: [] },
            validation: {
              type: 'review',
              criteria: ['scalable', 'maintainable', 'follows-patterns'],
              required: true
            },
            riskLevel: 'medium'
          },
          {
            id: 'design-ui',
            description: 'Create UI/UX with shadcn components',
            agent: 'shadcn-designer',
            inputs: { architecture: 'from-previous', style: 'modern' },
            expectedOutput: { components: [], theme: {} },
            validation: {
              type: 'review',
              criteria: ['accessible', 'responsive', 'consistent'],
              required: true
            },
            riskLevel: 'low'
          }
        ],
        dependencies: ['Analysis'],
        estimatedDuration: 600000, // 10 minutes
        parallelizable: false
      });
    }
    
    // Phase 3: Implementation
    phases.push({
      phase: 'Implementation',
      description: 'Implement features with full testing',
      agents: ['claude-coder', 'test-engineer', 'playwright-tester'],
      tasks: this.createImplementationTasks(goal, analysis),
      dependencies: analysis.requiresDesign ? ['Design'] : ['Analysis'],
      estimatedDuration: analysis.implementationTime,
      parallelizable: analysis.parallelizable
    });
    
    // Phase 4: Testing and Validation
    phases.push({
      phase: 'Testing',
      description: 'Comprehensive testing and validation',
      agents: ['playwright-tester', 'chrome-debugger', 'performance-analyzer'],
      tasks: [
        {
          id: 'unit-tests',
          description: 'Create and run unit tests',
          agent: 'test-engineer',
          inputs: { coverage: 90 },
          expectedOutput: { passed: true, coverage: {} },
          validation: {
            type: 'automated',
            criteria: ['all-passing', 'coverage-met'],
            required: true
          },
          riskLevel: 'low'
        },
        {
          id: 'e2e-tests',
          description: 'Create Playwright E2E tests',
          agent: 'playwright-tester',
          inputs: { browsers: ['chrome', 'firefox', 'webkit'] },
          expectedOutput: { passed: true, screenshots: [] },
          validation: {
            type: 'automated',
            criteria: ['all-browsers-pass', 'no-visual-regressions'],
            required: true
          },
          riskLevel: 'medium'
        },
        {
          id: 'performance-test',
          description: 'Run performance analysis',
          agent: 'chrome-debugger',
          inputs: { metrics: ['FCP', 'LCP', 'CLS'] },
          expectedOutput: { scores: {}, report: {} },
          validation: {
            type: 'automated',
            criteria: ['performance-threshold-met'],
            required: false
          },
          riskLevel: 'low'
        }
      ],
      dependencies: ['Implementation'],
      estimatedDuration: 900000, // 15 minutes
      parallelizable: true
    });
    
    // Phase 5: Deployment (if needed)
    if (analysis.requiresDeployment) {
      phases.push({
        phase: 'Deployment',
        description: 'Deploy to Vercel with monitoring',
        agents: ['vercel-deployer', 'edge-function-specialist'],
        tasks: [
          {
            id: 'preview-deploy',
            description: 'Deploy to preview environment',
            agent: 'vercel-deployer',
            inputs: { env: 'preview' },
            expectedOutput: { url: '', status: 'success' },
            validation: {
              type: 'manual',
              criteria: ['preview-working', 'no-errors'],
              required: true
            },
            riskLevel: 'medium'
          }
        ],
        dependencies: ['Testing'],
        estimatedDuration: 300000, // 5 minutes
        parallelizable: false
      });
    }
    
    return phases;
  }

  /**
   * Create implementation tasks based on analysis
   */
  private createImplementationTasks(goal: any, analysis: any): Task[] {
    const tasks: Task[] = [];
    
    // Add tasks based on what needs to be built
    if (analysis.features) {
      analysis.features.forEach((feature: any, index: number) => {
        tasks.push({
          id: `implement-${feature.name}`,
          description: `Implement ${feature.description}`,
          agent: 'claude-coder',
          inputs: {
            feature: feature,
            context: 'from-analysis',
            style: 'clean-code'
          },
          expectedOutput: {
            files: feature.files,
            tests: feature.tests
          },
          validation: {
            type: 'test',
            criteria: ['compiles', 'tests-pass', 'no-lint-errors'],
            required: true
          },
          riskLevel: feature.complexity === 'high' ? 'high' : 'medium'
        });
      });
    }
    
    return tasks;
  }

  /**
   * Identify high-risk actions that require approval
   */
  private identifyHighRiskActions(analysis: any): string[] {
    const highRiskActions = [
      'database-migration',
      'production-deployment',
      'delete-files',
      'modify-config',
      'update-dependencies',
      'api-changes',
      'auth-changes',
      'payment-changes'
    ];
    
    // Add any specific risks from analysis
    if (analysis.identifiedRisks) {
      highRiskActions.push(...analysis.identifiedRisks);
    }
    
    return highRiskActions;
  }

  /**
   * Create rollback strategy
   */
  private createRollbackStrategy(analysis: any): RollbackStrategy {
    const strategy: RollbackStrategy = {
      type: 'git',
      steps: [],
      automated: false
    };
    
    // Git-based rollback
    strategy.steps.push('git stash push -m "VERSATIL rollback backup"');
    strategy.steps.push('git checkout main');
    strategy.steps.push('git pull origin main');
    
    // Database rollback if needed
    if (analysis.hasDatabaseChanges) {
      strategy.type = 'database';
      strategy.steps.push('Run migration rollback');
      strategy.steps.push('Restore database backup');
    }
    
    // Deployment rollback if needed
    if (analysis.hasDeployment) {
      strategy.type = 'deployment';
      strategy.steps.push('Vercel rollback to previous deployment');
      strategy.steps.push('Clear edge function cache');
    }
    
    return strategy;
  }

  /**
   * Create human checkpoints
   */
  private createHumanCheckpoints(analysis: any): HumanCheckpoint[] {
    const checkpoints: HumanCheckpoint[] = [
      {
        afterPhase: 'Analysis',
        description: 'Review analysis results and plan',
        reviewItems: [
          'Identified patterns and anti-patterns',
          'Proposed architecture',
          'Risk assessment'
        ],
        approvalRequired: true,
        alternatives: ['Modify plan', 'Add constraints', 'Cancel']
      }
    ];
    
    if (analysis.requiresDesign) {
      checkpoints.push({
        afterPhase: 'Design',
        description: 'Review UI/UX designs',
        reviewItems: [
          'Component architecture',
          'UI mockups',
          'Accessibility compliance'
        ],
        approvalRequired: true,
        alternatives: ['Request changes', 'Approve with modifications', 'Reject']
      });
    }
    
    checkpoints.push({
      afterPhase: 'Implementation',
      description: 'Review implemented code',
      reviewItems: [
        'Code quality',
        'Test coverage',
        'Performance metrics'
      ],
      approvalRequired: true,
      alternatives: ['Request fixes', 'Approve', 'Rollback']
    });
    
    if (analysis.hasDeployment) {
      checkpoints.push({
        afterPhase: 'Deployment',
        description: 'Verify deployment',
        reviewItems: [
          'Preview deployment',
          'Performance scores',
          'Error monitoring'
        ],
        approvalRequired: true,
        alternatives: ['Deploy to production', 'Fix issues', 'Rollback']
      });
    }
    
    return checkpoints;
  }

  /**
   * Parse goal into structured format
   */
  private async parseGoal(goal: string): Promise<any> {
    // Use Claude to parse natural language goal
    return {
      type: this.inferGoalType(goal),
      description: goal,
      features: this.extractFeatures(goal),
      constraints: this.extractConstraints(goal)
    };
  }

  /**
   * Analyze requirements
   */
  private async analyzeRequirements(goal: any, context: any): Promise<any> {
    return {
      riskLevel: this.assessRisk(goal, context),
      dependencies: await this.identifyDependencies(goal, context),
      constraints: this.identifyConstraints(goal, context),
      requiresDesign: this.needsDesignPhase(goal),
      requiresDeployment: this.needsDeployment(goal),
      implementationTime: this.estimateImplementationTime(goal),
      parallelizable: this.canParallelize(goal),
      features: this.breakdownFeatures(goal),
      expectedFiles: this.predictFiles(goal),
      expectedDeployments: this.predictDeployments(goal),
      expectedMigrations: this.predictMigrations(goal),
      expectedDocs: this.predictDocumentation(goal)
    };
  }

  /**
   * Helper methods for analysis
   */
  private inferGoalType(goal: string): string {
    if (goal.toLowerCase().includes('fix')) return 'bugfix';
    if (goal.toLowerCase().includes('add') || goal.toLowerCase().includes('implement')) return 'feature';
    if (goal.toLowerCase().includes('refactor')) return 'refactor';
    if (goal.toLowerCase().includes('optimize')) return 'optimization';
    return 'feature';
  }

  private extractFeatures(goal: string): string[] {
    // Simple extraction - in real implementation, use NLP
    const features = [];
    if (goal.includes('authentication')) features.push('auth');
    if (goal.includes('ui') || goal.includes('interface')) features.push('ui');
    if (goal.includes('api')) features.push('api');
    if (goal.includes('database')) features.push('database');
    return features;
  }

  private extractConstraints(goal: string): string[] {
    const constraints = [];
    if (goal.includes('secure')) constraints.push('security-required');
    if (goal.includes('fast') || goal.includes('performance')) constraints.push('performance-critical');
    if (goal.includes('accessible')) constraints.push('accessibility-required');
    return constraints;
  }

  private assessRisk(goal: any, context: any): 'low' | 'medium' | 'high' {
    // Assess risk based on various factors
    let riskScore = 0;
    
    if (goal.features.includes('auth')) riskScore += 3;
    if (goal.features.includes('payment')) riskScore += 3;
    if (goal.features.includes('database')) riskScore += 2;
    if (context.stack?.production) riskScore += 2;
    
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private async identifyDependencies(goal: any, context: any): Promise<string[]> {
    // Identify what this goal depends on
    const deps = [];
    if (goal.features.includes('ui')) deps.push('shadcn-ui');
    if (goal.features.includes('auth')) deps.push('supabase-auth');
    if (goal.features.includes('api')) deps.push('api-routes');
    return deps;
  }

  private identifyConstraints(goal: any, context: any): string[] {
    return [
      ...goal.constraints,
      'no-breaking-changes',
      'maintain-test-coverage',
      'follow-conventions'
    ];
  }

  private needsDesignPhase(goal: any): boolean {
    return goal.features.includes('ui') || goal.description.includes('design');
  }

  private needsDeployment(goal: any): boolean {
    return goal.description.includes('deploy') || goal.description.includes('production');
  }

  private estimateImplementationTime(goal: any): number {
    // Base estimate in milliseconds
    let time = 600000; // 10 minutes base
    
    goal.features.forEach((feature: string) => {
      if (feature === 'auth') time += 1200000; // +20 min
      if (feature === 'ui') time += 900000; // +15 min
      if (feature === 'api') time += 600000; // +10 min
    });
    
    return time;
  }

  private canParallelize(goal: any): boolean {
    // Check if features can be built in parallel
    return goal.features.length > 1 && !goal.features.includes('database');
  }

  private breakdownFeatures(goal: any): any[] {
    // Break down into implementable features
    return goal.features.map((f: string) => ({
      name: f,
      description: `Implement ${f} functionality`,
      complexity: this.assessComplexity(f),
      files: this.estimateFiles(f),
      tests: this.estimateTests(f)
    }));
  }

  private assessComplexity(feature: string): 'low' | 'medium' | 'high' {
    if (['auth', 'payment', 'security'].includes(feature)) return 'high';
    if (['api', 'database'].includes(feature)) return 'medium';
    return 'low';
  }

  private estimateFiles(feature: string): string[] {
    // Estimate what files will be created
    const files = [];
    if (feature === 'auth') {
      files.push('src/lib/auth.ts', 'src/components/auth/*.tsx');
    }
    if (feature === 'ui') {
      files.push('src/components/ui/*.tsx', 'src/styles/*.css');
    }
    return files;
  }

  private estimateTests(feature: string): string[] {
    return [`tests/unit/${feature}.test.ts`, `tests/e2e/${feature}.spec.ts`];
  }

  private predictFiles(goal: any): string[] {
    return goal.features.flatMap((f: any) => this.estimateFiles(f));
  }

  private predictDeployments(goal: any): string[] {
    if (goal.features.includes('api')) return ['vercel-functions'];
    return [];
  }

  private predictMigrations(goal: any): string[] {
    if (goal.features.includes('database')) return ['supabase-migration'];
    return [];
  }

  private predictDocumentation(goal: any): string[] {
    return ['README.md', 'CHANGELOG.md'];
  }

  /**
   * Generate unique plan ID
   */
  private generatePlanId(): string {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate total estimated time
   */
  private calculateEstimatedTime(plan: MultiAgentPlan): number {
    return plan.phases.reduce((total, phase) => {
      return total + phase.estimatedDuration;
    }, 0);
  }

  /**
   * Save plan to disk
   */
  private async savePlan(plan: MultiAgentPlan): Promise<void> {
    const planPath = path.join(this.paths.framework.plans, `${plan.metadata.id}.json`);
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
    this.activePlans.set(plan.metadata.id, plan);
  }

  /**
   * Load saved plans
   */
  private async loadSavedPlans(): Promise<void> {
    try {
      const planFiles = await fs.readdir(this.paths.framework.plans);
      for (const file of planFiles) {
        if (file.endsWith('.json')) {
          const planData = await fs.readFile(
            path.join(this.paths.framework.plans, file),
            'utf-8'
          );
          const plan = JSON.parse(planData);
          this.activePlans.set(plan.metadata.id, plan);
        }
      }
    } catch (error) {
      this.logger.warn('No saved plans found');
    }
  }

  /**
   * Load plan templates
   */
  private async loadPlanTemplates(): Promise<void> {
    // Load templates based on context engineering patterns
    // These would be predefined templates for common tasks
  }

  /**
   * Get active plans
   */
  public async getActivePlans(): Promise<MultiAgentPlan[]> {
    return Array.from(this.activePlans.values());
  }

  /**
   * Update safety configuration
   */
  public setSafetyConfig(config: any): void {
    this.safetyConfig = { ...this.safetyConfig, ...config };
  }

  /**
   * Switch mode (requires explicit action)
   */
  public async switchMode(mode: 'plan' | 'execute', authorization?: string): Promise<boolean> {
    if (mode === 'execute' && !authorization) {
      this.logger.warn('Cannot switch to execute mode without authorization');
      return false;
    }
    
    this.mode = mode;
    this.logger.info(`Switched to ${mode} mode`);
    return true;
  }

  /**
   * Execute approved plan
   */
  public async executeApprovedPlan(planId: string, approval: any): Promise<any> {
    if (this.mode !== 'execute') {
      throw new Error('Must be in execute mode to run plans');
    }
    
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }
    
    // Verify approval
    if (!this.verifyApproval(plan, approval)) {
      throw new Error('Invalid approval');
    }
    
    // Execute plan phases
    return await this.executePlan(plan);
  }

  /**
   * Verify approval is valid
   */
  private verifyApproval(plan: MultiAgentPlan, approval: any): boolean {
    // Verify approval has required fields
    return approval && approval.planId === plan.metadata.id && approval.authorized;
  }

  /**
   * Execute plan with safeguards
   */
  private async executePlan(plan: MultiAgentPlan): Promise<any> {
    // This would coordinate the actual execution
    // For now, we just return the plan
    return plan;
  }

  /**
   * Cleanup
   */
  public async shutdown(): Promise<void> {
    // Save any pending plans
    for (const [id, plan] of this.activePlans) {
      await this.savePlan(plan);
    }
  }
}
