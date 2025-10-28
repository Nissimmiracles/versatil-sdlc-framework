/**
 * VERSATIL SDLC Framework - Plan-First Orchestrator
 * Always creates comprehensive plans before execution with human-in-the-loop
 * Based on context engineering patterns
 */
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class PlanFirstOpera extends EventEmitter {
    constructor(paths) {
        super();
        this.mode = 'plan'; // ALWAYS start in plan mode
        this.activePlans = new Map();
        // Safety configurations
        this.safetyConfig = {
            requireApproval: true,
            planFirst: true,
            dryRun: false,
            maxAutoExecute: 0, // Never auto-execute by default
            allowedAutoActions: []
        };
        this.logger = new VERSATILLogger('PlanFirstOpera');
        this.paths = paths;
    }
    async initialize() {
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
    async createPlan(goal, context) {
        this.logger.info('Creating comprehensive plan', { goal, mode: this.mode });
        // Parse goal into structured format
        const parsedGoal = await this.parseGoal(goal);
        // Analyze context and requirements
        const analysis = await this.analyzeRequirements(parsedGoal, context);
        // Create multi-phase plan
        const plan = {
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
    async createPhases(goal, analysis) {
        const phases = [];
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
    createImplementationTasks(goal, analysis) {
        const tasks = [];
        // Add tasks based on what needs to be built
        if (analysis.features) {
            analysis.features.forEach((feature, index) => {
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
    identifyHighRiskActions(analysis) {
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
    createRollbackStrategy(analysis) {
        const strategy = {
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
    createHumanCheckpoints(analysis) {
        const checkpoints = [
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
    async parseGoal(goal) {
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
    async analyzeRequirements(goal, context) {
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
    inferGoalType(goal) {
        if (goal.toLowerCase().includes('fix'))
            return 'bugfix';
        if (goal.toLowerCase().includes('add') || goal.toLowerCase().includes('implement'))
            return 'feature';
        if (goal.toLowerCase().includes('refactor'))
            return 'refactor';
        if (goal.toLowerCase().includes('optimize'))
            return 'optimization';
        return 'feature';
    }
    extractFeatures(goal) {
        // Simple extraction - in real implementation, use NLP
        const features = [];
        if (goal.includes('authentication'))
            features.push('auth');
        if (goal.includes('ui') || goal.includes('interface'))
            features.push('ui');
        if (goal.includes('api'))
            features.push('api');
        if (goal.includes('database'))
            features.push('database');
        return features;
    }
    extractConstraints(goal) {
        const constraints = [];
        if (goal.includes('secure'))
            constraints.push('security-required');
        if (goal.includes('fast') || goal.includes('performance'))
            constraints.push('performance-critical');
        if (goal.includes('accessible'))
            constraints.push('accessibility-required');
        return constraints;
    }
    assessRisk(goal, context) {
        // Assess risk based on various factors
        let riskScore = 0;
        if (goal.features.includes('auth'))
            riskScore += 3;
        if (goal.features.includes('payment'))
            riskScore += 3;
        if (goal.features.includes('database'))
            riskScore += 2;
        if (context.stack?.production)
            riskScore += 2;
        if (riskScore >= 5)
            return 'high';
        if (riskScore >= 3)
            return 'medium';
        return 'low';
    }
    async identifyDependencies(goal, context) {
        // Identify what this goal depends on
        const deps = [];
        if (goal.features.includes('ui'))
            deps.push('shadcn-ui');
        if (goal.features.includes('auth'))
            deps.push('supabase-auth');
        if (goal.features.includes('api'))
            deps.push('api-routes');
        return deps;
    }
    identifyConstraints(goal, context) {
        return [
            ...goal.constraints,
            'no-breaking-changes',
            'maintain-test-coverage',
            'follow-conventions'
        ];
    }
    needsDesignPhase(goal) {
        return goal.features.includes('ui') || goal.description.includes('design');
    }
    needsDeployment(goal) {
        return goal.description.includes('deploy') || goal.description.includes('production');
    }
    estimateImplementationTime(goal) {
        // Base estimate in milliseconds
        let time = 600000; // 10 minutes base
        goal.features.forEach((feature) => {
            if (feature === 'auth')
                time += 1200000; // +20 min
            if (feature === 'ui')
                time += 900000; // +15 min
            if (feature === 'api')
                time += 600000; // +10 min
        });
        return time;
    }
    canParallelize(goal) {
        // Check if features can be built in parallel
        return goal.features.length > 1 && !goal.features.includes('database');
    }
    breakdownFeatures(goal) {
        // Break down into implementable features
        return goal.features.map((f) => ({
            name: f,
            description: `Implement ${f} functionality`,
            complexity: this.assessComplexity(f),
            files: this.estimateFiles(f),
            tests: this.estimateTests(f)
        }));
    }
    assessComplexity(feature) {
        if (['auth', 'payment', 'security'].includes(feature))
            return 'high';
        if (['api', 'database'].includes(feature))
            return 'medium';
        return 'low';
    }
    estimateFiles(feature) {
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
    estimateTests(feature) {
        return [`tests/unit/${feature}.test.ts`, `tests/e2e/${feature}.spec.ts`];
    }
    predictFiles(goal) {
        return goal.features.flatMap((f) => this.estimateFiles(f));
    }
    predictDeployments(goal) {
        if (goal.features.includes('api'))
            return ['vercel-functions'];
        return [];
    }
    predictMigrations(goal) {
        if (goal.features.includes('database'))
            return ['supabase-migration'];
        return [];
    }
    predictDocumentation(goal) {
        return ['README.md', 'CHANGELOG.md'];
    }
    /**
     * Generate unique plan ID
     */
    generatePlanId() {
        return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Calculate total estimated time
     */
    calculateEstimatedTime(plan) {
        return plan.phases.reduce((total, phase) => {
            return total + phase.estimatedDuration;
        }, 0);
    }
    /**
     * Save plan to disk
     */
    async savePlan(plan) {
        const planPath = path.join(this.paths.framework.plans, `${plan.metadata.id}.json`);
        await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
        this.activePlans.set(plan.metadata.id, plan);
    }
    /**
     * Load saved plans
     */
    async loadSavedPlans() {
        try {
            const planFiles = await fs.readdir(this.paths.framework.plans);
            for (const file of planFiles) {
                if (file.endsWith('.json')) {
                    const planData = await fs.readFile(path.join(this.paths.framework.plans, file), 'utf-8');
                    const plan = JSON.parse(planData);
                    this.activePlans.set(plan.metadata.id, plan);
                }
            }
        }
        catch (error) {
            this.logger.warn('No saved plans found');
        }
    }
    /**
     * Load plan templates
     */
    async loadPlanTemplates() {
        // Load templates based on context engineering patterns
        // These would be predefined templates for common tasks
    }
    /**
     * Get active plans
     */
    async getActivePlans() {
        return Array.from(this.activePlans.values());
    }
    /**
     * Update safety configuration
     */
    setSafetyConfig(config) {
        this.safetyConfig = { ...this.safetyConfig, ...config };
    }
    /**
     * Switch mode (requires explicit action)
     */
    async switchMode(mode, authorization) {
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
    async executeApprovedPlan(planId, approval) {
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
    verifyApproval(plan, approval) {
        // Verify approval has required fields
        return approval && approval.planId === plan.metadata.id && approval.authorized;
    }
    /**
     * Execute plan with safeguards
     */
    async executePlan(plan) {
        // This would coordinate the actual execution
        // For now, we just return the plan
        return plan;
    }
    /**
     * Cleanup
     */
    async shutdown() {
        // Save any pending plans
        for (const [id, plan] of this.activePlans) {
            await this.savePlan(plan);
        }
    }
}
//# sourceMappingURL=plan-first-opera.js.map