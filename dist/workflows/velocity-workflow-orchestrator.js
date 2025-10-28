/**
 * @fileoverview VELOCITY Workflow Orchestrator - Compounding Engineering 5-Phase System
 *
 * Implements Compounding Engineering methodology:
 * Plan → Assess → Delegate → Work → Codify
 *
 * Each phase automatically transitions to the next upon successful completion,
 * creating a continuous learning loop where each feature makes the next 40% faster.
 *
 * @module workflows/velocity-workflow-orchestrator
 * @version 6.5.0
 */
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { VERSATILLogger } from '../utils/logger.js';
import { VelocityWorkflowStateMachine } from './velocity-workflow-state-machine.js';
import { VelocityPhaseTransitions } from './velocity-phase-transitions.js';
// ============================================================================
// ORCHESTRATOR IMPLEMENTATION
// ============================================================================
export class VelocityWorkflowOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.logger = new VERSATILLogger('VelocityWorkflowOrchestrator');
        this.stateMachine = new VelocityWorkflowStateMachine();
        this.transitions = new VelocityPhaseTransitions();
        this.activeWorkflows = new Map();
        this.workflowMetrics = new Map();
        this.setupEventHandlers();
    }
    // ========================================================================
    // WORKFLOW LIFECYCLE
    // ========================================================================
    /**
     * Start a new VELOCITY workflow
     */
    async startWorkflow(config) {
        const workflowId = config.workflowId || uuidv4();
        this.logger.info(`Starting VELOCITY workflow: ${workflowId}`, { target: config.target });
        // Initialize workflow context
        const context = {
            target: config.target,
        };
        this.activeWorkflows.set(workflowId, context);
        // Initialize metrics
        this.workflowMetrics.set(workflowId, {
            totalDuration: 0,
            phaseBreakdown: {
                Plan: 0,
                Assess: 0,
                Delegate: 0,
                Work: 0,
                Codify: 0,
                Completed: 0,
            },
            estimatedVsActual: {
                estimated: 0,
                actual: 0,
                accuracy: 0,
            },
            compoundingEffect: {
                baseline: 0,
                improvement: 0,
                percentageFaster: 0,
            },
        });
        // Create state machine for this workflow
        await this.stateMachine.createWorkflow(workflowId, {
            target: config.target,
            autoTransition: config.autoTransition,
            requireApprovalPerPhase: config.requireApprovalPerPhase,
            continuousMonitoring: config.continuousMonitoring,
            qualityGateLevel: config.qualityGateLevel,
            maxExecutionHours: config.maxExecutionHours,
            codifyToRAG: config.codifyToRAG,
        });
        // Emit workflow started event
        this.emit('workflowStarted', {
            workflowId,
            target: config.target,
            timestamp: new Date(),
        });
        // Start Phase 1: Plan
        if (config.autoTransition) {
            await this.executePlan(workflowId, context);
        }
        return workflowId;
    }
    /**
     * Phase 1: Plan - Research and design with templates + historical context
     */
    async executePlan(workflowId, context) {
        const startTime = Date.now();
        this.logger.info(`[Phase 1: PLAN] Starting planning phase`, { workflowId });
        try {
            // Transition to Plan phase
            await this.stateMachine.transition(workflowId, 'Plan');
            // Execute /plan command logic (simulated here, actual implementation would invoke command)
            const planResult = await this.invokePlanCommand(context.target);
            // Store plan outputs in context
            context.plan = {
                todos: planResult.todos,
                estimates: planResult.estimates,
                templates: planResult.templates,
                historicalContext: planResult.historicalContext,
            };
            const duration = Date.now() - startTime;
            this.updateMetrics(workflowId, 'Plan', duration);
            const result = {
                phase: 'Plan',
                success: true,
                duration,
                outputs: context.plan,
                nextPhase: 'Assess',
            };
            this.emit('phaseCompleted', { workflowId, result });
            // Auto-transition to Assess if enabled
            const state = await this.stateMachine.getState(workflowId);
            if (state?.config.autoTransition) {
                await this.autoTransitionToAssess(workflowId, context);
            }
            return result;
        }
        catch (error) {
            this.logger.error('Plan phase failed', { workflowId, error: error.message });
            return {
                phase: 'Plan',
                success: false,
                duration: Date.now() - startTime,
                outputs: {},
                errors: [error.message],
            };
        }
    }
    /**
     * Phase 2: Assess - Validate readiness before work starts
     */
    async executeAssess(workflowId, context) {
        const startTime = Date.now();
        this.logger.info(`[Phase 2: ASSESS] Starting assessment phase`, { workflowId });
        try {
            // Transition to Assess phase
            await this.stateMachine.transition(workflowId, 'Assess');
            // Check transition prerequisites
            const canTransition = await this.transitions.canTransitionFromPlanToAssess(context);
            if (!canTransition.allowed) {
                throw new Error(`Cannot transition to Assess: ${canTransition.reason}`);
            }
            // Execute /assess command logic
            const assessResult = await this.invokeAssessCommand(context.target);
            // Store assessment results in context
            context.assessment = {
                health: assessResult.health,
                readiness: assessResult.readiness,
                blockers: assessResult.blockers,
                warnings: assessResult.warnings,
            };
            const duration = Date.now() - startTime;
            this.updateMetrics(workflowId, 'Assess', duration);
            const result = {
                phase: 'Assess',
                success: assessResult.readiness !== 'blocked',
                duration,
                outputs: context.assessment,
                warnings: assessResult.warnings,
                errors: assessResult.readiness === 'blocked' ? assessResult.blockers : undefined,
                nextPhase: assessResult.readiness !== 'blocked' ? 'Delegate' : undefined,
            };
            this.emit('phaseCompleted', { workflowId, result });
            // Auto-transition to Delegate if passing
            const state = await this.stateMachine.getState(workflowId);
            if (state?.config.autoTransition && assessResult.readiness !== 'blocked') {
                await this.autoTransitionToDelegate(workflowId, context);
            }
            return result;
        }
        catch (error) {
            this.logger.error('Assess phase failed', { workflowId, error: error.message });
            return {
                phase: 'Assess',
                success: false,
                duration: Date.now() - startTime,
                outputs: {},
                errors: [error.message],
            };
        }
    }
    /**
     * Phase 3: Delegate - Smart work distribution to optimal agents
     */
    async executeDelegate(workflowId, context) {
        const startTime = Date.now();
        this.logger.info(`[Phase 3: DELEGATE] Starting delegation phase`, { workflowId });
        try {
            // Transition to Delegate phase
            await this.stateMachine.transition(workflowId, 'Delegate');
            // Check transition prerequisites
            const canTransition = await this.transitions.canTransitionFromAssessToDelegate(context);
            if (!canTransition.allowed) {
                throw new Error(`Cannot transition to Delegate: ${canTransition.reason}`);
            }
            // Execute /delegate command logic
            const delegateResult = await this.invokeDelegateCommand(context.plan?.todos || []);
            // Store delegation results in context
            context.delegation = {
                assignments: delegateResult.assignments,
                parallelGroups: delegateResult.parallelGroups,
                dependencies: delegateResult.dependencies,
            };
            const duration = Date.now() - startTime;
            this.updateMetrics(workflowId, 'Delegate', duration);
            const result = {
                phase: 'Delegate',
                success: true,
                duration,
                outputs: context.delegation,
                nextPhase: 'Work',
            };
            this.emit('phaseCompleted', { workflowId, result });
            // Auto-transition to Work
            const state = await this.stateMachine.getState(workflowId);
            if (state?.config.autoTransition) {
                await this.autoTransitionToWork(workflowId, context);
            }
            return result;
        }
        catch (error) {
            this.logger.error('Delegate phase failed', { workflowId, error: error.message });
            return {
                phase: 'Delegate',
                success: false,
                duration: Date.now() - startTime,
                outputs: {},
                errors: [error.message],
            };
        }
    }
    /**
     * Phase 4: Work - Execute implementation with tracking
     */
    async executeWork(workflowId, context) {
        const startTime = Date.now();
        this.logger.info(`[Phase 4: WORK] Starting work execution phase`, { workflowId });
        try {
            // Transition to Work phase
            await this.stateMachine.transition(workflowId, 'Work');
            // Check transition prerequisites
            const canTransition = await this.transitions.canTransitionFromDelegateToWork(context);
            if (!canTransition.allowed) {
                throw new Error(`Cannot transition to Work: ${canTransition.reason}`);
            }
            // Execute /work command logic
            const workResult = await this.invokeWorkCommand(context.target, context.delegation);
            // Store work results in context
            context.work = {
                completedTodos: workResult.completedTodos,
                actualDuration: workResult.actualDuration,
                testsAdded: workResult.testsAdded,
                filesModified: workResult.filesModified,
            };
            const duration = Date.now() - startTime;
            this.updateMetrics(workflowId, 'Work', duration);
            const result = {
                phase: 'Work',
                success: workResult.completedTodos.length > 0,
                duration,
                outputs: context.work,
                nextPhase: 'Codify',
            };
            this.emit('phaseCompleted', { workflowId, result });
            // Auto-transition to Codify
            const state = await this.stateMachine.getState(workflowId);
            if (state?.config.autoTransition) {
                await this.autoTransitionToCodify(workflowId, context);
            }
            return result;
        }
        catch (error) {
            this.logger.error('Work phase failed', { workflowId, error: error.message });
            return {
                phase: 'Work',
                success: false,
                duration: Date.now() - startTime,
                outputs: {},
                errors: [error.message],
            };
        }
    }
    /**
     * Phase 5: Codify - Learn from completed work and store to RAG
     */
    async executeCodify(workflowId, context) {
        const startTime = Date.now();
        this.logger.info(`[Phase 5: CODIFY] Starting codification phase`, { workflowId });
        try {
            // Transition to Codify phase
            await this.stateMachine.transition(workflowId, 'Codify');
            // Check transition prerequisites
            const canTransition = await this.transitions.canTransitionFromWorkToCodify(context);
            if (!canTransition.allowed) {
                throw new Error(`Cannot transition to Codify: ${canTransition.reason}`);
            }
            // Execute /learn command logic
            const learnResult = await this.invokeLearnCommand(context);
            // Store learnings in context
            context.learnings = {
                patterns: learnResult.patterns,
                effortAccuracy: learnResult.effortAccuracy,
                lessonsLearned: learnResult.lessonsLearned,
                ragStored: learnResult.ragStored,
            };
            const duration = Date.now() - startTime;
            this.updateMetrics(workflowId, 'Codify', duration);
            // Calculate compounding metrics
            this.calculateCompoundingEffect(workflowId, context);
            const result = {
                phase: 'Codify',
                success: learnResult.ragStored,
                duration,
                outputs: context.learnings,
            };
            this.emit('phaseCompleted', { workflowId, result });
            // Mark workflow as complete
            await this.stateMachine.transition(workflowId, 'Completed');
            this.emit('workflowCompleted', {
                workflowId,
                context,
                metrics: this.workflowMetrics.get(workflowId),
                timestamp: new Date(),
            });
            return result;
        }
        catch (error) {
            this.logger.error('Codify phase failed', { workflowId, error: error.message });
            return {
                phase: 'Codify',
                success: false,
                duration: Date.now() - startTime,
                outputs: {},
                errors: [error.message],
            };
        }
    }
    // ========================================================================
    // AUTO-TRANSITION HANDLERS
    // ========================================================================
    async autoTransitionToAssess(workflowId, context) {
        this.logger.info('Auto-transitioning Plan → Assess', { workflowId });
        const transitionResult = await this.transitions.transitionPlanToAssess(context);
        if (transitionResult.success) {
            await this.executeAssess(workflowId, context);
        }
        else {
            this.logger.warn('Auto-transition blocked', { reason: transitionResult.reason });
        }
    }
    async autoTransitionToDelegate(workflowId, context) {
        this.logger.info('Auto-transitioning Assess → Delegate', { workflowId });
        const transitionResult = await this.transitions.transitionAssessToDelegate(context);
        if (transitionResult.success) {
            await this.executeDelegate(workflowId, context);
        }
        else {
            this.logger.warn('Auto-transition blocked', { reason: transitionResult.reason });
        }
    }
    async autoTransitionToWork(workflowId, context) {
        this.logger.info('Auto-transitioning Delegate → Work', { workflowId });
        const transitionResult = await this.transitions.transitionDelegateToWork(context);
        if (transitionResult.success) {
            await this.executeWork(workflowId, context);
        }
        else {
            this.logger.warn('Auto-transition blocked', { reason: transitionResult.reason });
        }
    }
    async autoTransitionToCodify(workflowId, context) {
        this.logger.info('Auto-transitioning Work → Codify', { workflowId });
        const transitionResult = await this.transitions.transitionWorkToCodify(context);
        if (transitionResult.success) {
            await this.executeCodify(workflowId, context);
        }
        else {
            this.logger.warn('Auto-transition blocked', { reason: transitionResult.reason });
        }
    }
    // ========================================================================
    // COMMAND INVOCATIONS (Simplified for orchestration)
    // ========================================================================
    async invokePlanCommand(target) {
        // In production, this would invoke the actual /plan command
        // For now, return mock data structure
        return {
            todos: [],
            estimates: { total: 0, byPhase: {} },
            templates: [],
            historicalContext: [],
        };
    }
    async invokeAssessCommand(target) {
        // In production, this would invoke the actual /assess command
        return {
            health: 100,
            readiness: 'ready',
            blockers: [],
            warnings: [],
        };
    }
    async invokeDelegateCommand(todos) {
        // In production, this would invoke the actual /delegate command
        return {
            assignments: new Map(),
            parallelGroups: [],
            dependencies: new Map(),
        };
    }
    async invokeWorkCommand(target, delegation) {
        // In production, this would invoke the actual /work command
        return {
            completedTodos: [],
            actualDuration: 0,
            testsAdded: 0,
            filesModified: [],
        };
    }
    async invokeLearnCommand(context) {
        // In production, this would invoke the actual /learn command
        return {
            patterns: [],
            effortAccuracy: 0,
            lessonsLearned: [],
            ragStored: true,
        };
    }
    // ========================================================================
    // METRICS & ANALYTICS
    // ========================================================================
    updateMetrics(workflowId, phase, duration) {
        const metrics = this.workflowMetrics.get(workflowId);
        if (metrics) {
            metrics.phaseBreakdown[phase] = duration;
            metrics.totalDuration += duration;
        }
    }
    calculateCompoundingEffect(workflowId, context) {
        const metrics = this.workflowMetrics.get(workflowId);
        if (!metrics || !context.plan || !context.work)
            return;
        const estimated = context.plan.estimates.total;
        const actual = context.work.actualDuration;
        metrics.estimatedVsActual = {
            estimated,
            actual,
            accuracy: estimated > 0 ? (1 - Math.abs(estimated - actual) / estimated) * 100 : 0,
        };
        // Calculate improvement over baseline (would use historical data)
        const baseline = estimated; // First feature sets baseline
        const improvement = Math.max(0, baseline - actual);
        const percentageFaster = baseline > 0 ? (improvement / baseline) * 100 : 0;
        metrics.compoundingEffect = {
            baseline,
            improvement,
            percentageFaster,
        };
    }
    // ========================================================================
    // QUERY & MANAGEMENT
    // ========================================================================
    /**
     * Get workflow context
     */
    getWorkflowContext(workflowId) {
        return this.activeWorkflows.get(workflowId);
    }
    /**
     * Get workflow metrics
     */
    getWorkflowMetrics(workflowId) {
        return this.workflowMetrics.get(workflowId);
    }
    /**
     * Get workflow state
     */
    async getWorkflowState(workflowId) {
        return this.stateMachine.getState(workflowId);
    }
    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================
    setupEventHandlers() {
        this.stateMachine.on('transitioned', (event) => {
            this.logger.debug('State transition', event);
        });
        this.stateMachine.on('error', (event) => {
            this.logger.error('State machine error', event);
        });
    }
}
export default VelocityWorkflowOrchestrator;
//# sourceMappingURL=velocity-workflow-orchestrator.js.map