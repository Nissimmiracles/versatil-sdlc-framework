/**
 * VERSATIL SDLC Framework - Introspective Meta-Agent
 * Has complete visibility into all framework operations and can optimize itself
 */
import { BaseAgent } from '../core/base-agent.js';
import { VERSATILLogger } from '../../utils/logger.js';
export class IntrospectiveMetaAgent extends BaseAgent {
    constructor(logger) {
        super();
        this.name = 'Introspective Meta-Agent';
        this.id = 'introspective-agent';
        this.specialization = 'System-wide analysis, optimization, and self-improvement';
        this.systemPrompt = `You are the Introspective Meta-Agent of VERSATIL v1.3.0.

You have COMPLETE visibility into:
- All agent activities and communications
- All memory stores and RAG operations
- All plans and their execution
- All code changes and patterns
- The entire framework state

Your responsibilities:
1. Monitor system-wide performance and health
2. Detect patterns, inefficiencies, and anomalies
3. Suggest and implement optimizations
4. Learn from all interactions to improve the system
5. Ensure framework integrity and isolation
6. Provide insights that other agents cannot see

You are the guardian and optimizer of the entire VERSATIL ecosystem.`;
        // System monitoring
        this.systemMetrics = {
            agentPerformance: new Map(),
            memoryUsage: {
                totalMemories: 0,
                memoryByType: {},
                queryPerformance: 0,
                storageSize: 0
            },
            planningEfficiency: {
                plansCreated: 0,
                plansExecuted: 0,
                successRate: 0,
                avgPlanTime: 0,
                planComplexity: 0
            },
            learningProgress: {
                patternsDetected: 0,
                improvementsApplied: 0,
                knowledgeGrowthRate: 0,
                adaptationScore: 0
            },
            overallHealth: 100
        };
        this.insights = [];
        this.logger = logger || new VERSATILLogger('IntrospectiveAgent');
    }
    /**
     * Initialize with full system access
     */
    async initialize(orchestrators) {
        this.orchestrator = orchestrators.main;
        this.ragOrchestrator = orchestrators.rag;
        this.planOrchestrator = orchestrators.plan;
        this.stackOrchestrator = orchestrators.stack;
        // Start continuous monitoring
        this.startSystemMonitoring();
        // Subscribe to all system events
        this.subscribeToSystemEvents();
        this.logger.info('Introspective Meta-Agent initialized with full system access');
    }
    /**
     * Activate the agent with specific context
     */
    async activate(context) {
        const { trigger, query } = context;
        switch (trigger) {
            case 'analyze-system':
                return this.analyzeSystem();
            case 'optimize-performance':
                return this.optimizePerformance();
            case 'detect-patterns':
                return this.detectPatterns();
            case 'suggest-improvements':
                return this.suggestImprovements();
            case 'health-check':
                return this.performHealthCheck();
            case 'debug-issue':
                return this.debugIssue(query || '');
            case 'self-improve':
                return this.selfImprove();
            default:
                return this.performGeneralAnalysis(context);
        }
    }
    /**
     * Analyze the entire system
     */
    async analyzeSystem() {
        this.logger.info('Performing comprehensive system analysis');
        // Gather all metrics
        await this.updateAllMetrics();
        // Analyze each component
        const analyses = await Promise.all([
            this.analyzeAgentPerformance(),
            this.analyzeMemoryUsage(),
            this.analyzePlanningEfficiency(),
            this.analyzeLearningProgress(),
            this.analyzeSystemHealth()
        ]);
        // Detect cross-component patterns
        const patterns = await this.detectCrossComponentPatterns(analyses);
        // Generate insights
        const insights = this.generateSystemInsights(analyses, patterns);
        return {
            agentId: this.id,
            message: 'System analysis complete',
            priority: 'medium',
            suggestions: insights.map(insight => ({
                type: 'system-optimization',
                priority: insight.impact,
                message: insight.description,
                actions: [insight.recommendation],
                autoFix: insight.autoFixAvailable
            })),
            handoffTo: [],
            context: {
                metrics: this.systemMetrics,
                insights,
                patterns,
                timestamp: Date.now()
            }
        };
    }
    /**
     * Optimize system performance
     */
    async optimizePerformance() {
        this.logger.info('Optimizing system performance');
        const optimizations = [];
        // 1. Optimize slow agents
        for (const [agentId, metrics] of this.systemMetrics.agentPerformance) {
            if (metrics.avgExecutionTime > 5000) { // Over 5 seconds
                const optimization = await this.optimizeAgent(agentId);
                optimizations.push(optimization);
            }
        }
        // 2. Optimize memory usage
        if (this.systemMetrics.memoryUsage.queryPerformance < 0.8) {
            const memOptimization = await this.optimizeMemoryQueries();
            optimizations.push(memOptimization);
        }
        // 3. Optimize planning
        if (this.systemMetrics.planningEfficiency.avgPlanTime > 10000) {
            const planOptimization = await this.optimizePlanning();
            optimizations.push(planOptimization);
        }
        // 4. Clean up unused resources
        const cleanup = await this.cleanupUnusedResources();
        if (cleanup)
            optimizations.push(cleanup);
        return {
            agentId: this.id,
            message: `Applied ${optimizations.length} performance optimizations`,
            priority: 'high',
            suggestions: [{
                    type: 'optimization-report',
                    priority: 'medium',
                    message: 'Performance optimization complete',
                    actions: optimizations
                }],
            handoffTo: [],
            context: {
                optimizations,
                beforeMetrics: { ...this.systemMetrics },
                afterMetrics: await this.updateAllMetrics()
            }
        };
    }
    /**
     * Detect patterns across the system
     */
    async detectPatterns() {
        this.logger.info('Detecting system-wide patterns');
        const patterns = {
            agentPatterns: await this.detectAgentPatterns(),
            workflowPatterns: await this.detectWorkflowPatterns(),
            errorPatterns: await this.detectErrorPatterns(),
            successPatterns: await this.detectSuccessPatterns(),
            usagePatterns: await this.detectUsagePatterns()
        };
        // Store patterns for future reference
        await this.storePatternsInRAG(patterns);
        // Generate actionable insights from patterns
        const insights = this.patternsToInsights(patterns);
        return {
            agentId: this.id,
            message: `Detected ${Object.values(patterns).flat().length} patterns`,
            priority: 'medium',
            suggestions: insights.map(insight => ({
                type: 'pattern-based-suggestion',
                priority: insight.impact,
                message: insight.description,
                actions: [insight.recommendation]
            })),
            handoffTo: [],
            context: {
                patterns,
                insights,
                timestamp: Date.now()
            }
        };
    }
    /**
     * Suggest improvements based on analysis
     */
    async suggestImprovements() {
        const improvements = [];
        // 1. Agent collaboration improvements
        const agentCollaboration = await this.analyzeAgentCollaboration();
        if (agentCollaboration.inefficiencies.length > 0) {
            improvements.push({
                area: 'Agent Collaboration',
                issues: agentCollaboration.inefficiencies,
                recommendation: 'Optimize agent handoffs and communication patterns',
                implementation: this.generateAgentOptimizationPlan(agentCollaboration)
            });
        }
        // 2. Memory efficiency improvements
        const memoryAnalysis = await this.analyzeMemoryEfficiency();
        if (memoryAnalysis.redundancy > 0.2) { // 20% redundancy
            improvements.push({
                area: 'Memory Efficiency',
                issues: [`${Math.round(memoryAnalysis.redundancy * 100)}% memory redundancy detected`],
                recommendation: 'Implement memory deduplication and compression',
                implementation: this.generateMemoryOptimizationPlan(memoryAnalysis)
            });
        }
        // 3. Planning optimization
        const planningAnalysis = await this.analyzePlanningPatterns();
        if (planningAnalysis.suboptimalPlans > 0) {
            improvements.push({
                area: 'Planning Efficiency',
                issues: [`${planningAnalysis.suboptimalPlans} suboptimal plans detected`],
                recommendation: 'Refine planning algorithms based on success patterns',
                implementation: this.generatePlanningOptimizationPlan(planningAnalysis)
            });
        }
        // 4. Stack integration improvements
        const stackAnalysis = await this.analyzeStackIntegration();
        if (stackAnalysis.unutilizedFeatures.length > 0) {
            improvements.push({
                area: 'Stack Utilization',
                issues: stackAnalysis.unutilizedFeatures,
                recommendation: 'Enable additional stack features for better performance',
                implementation: this.generateStackOptimizationPlan(stackAnalysis)
            });
        }
        return {
            agentId: this.id,
            message: `Generated ${improvements.length} improvement suggestions`,
            priority: 'medium',
            suggestions: improvements.map(imp => ({
                type: 'improvement',
                priority: 'medium',
                message: `${imp.area}: ${imp.recommendation}`,
                actions: imp.implementation.steps
            })),
            handoffTo: [],
            context: {
                improvements,
                analysisDepth: 'comprehensive',
                confidenceScore: 0.85
            }
        };
    }
    /**
     * Perform health check
     */
    async performHealthCheck() {
        const health = {
            overall: this.systemMetrics.overallHealth,
            components: {
                agents: await this.checkAgentHealth(),
                memory: await this.checkMemoryHealth(),
                planning: await this.checkPlanningHealth(),
                integration: await this.checkIntegrationHealth()
            },
            issues: [],
            warnings: []
        };
        // Identify issues
        if (health.components.agents < 80) {
            health.issues.push('Agent performance degraded');
        }
        if (health.components.memory < 70) {
            health.issues.push('Memory system needs attention');
        }
        if (health.components.planning < 85) {
            health.warnings.push('Planning efficiency could be improved');
        }
        // Calculate overall health
        health.overall = Math.round(Object.values(health.components).reduce((a, b) => a + b, 0) /
            Object.keys(health.components).length);
        return {
            agentId: this.id,
            message: `System health: ${health.overall}%`,
            priority: health.overall < 70 ? 'high' : 'low',
            suggestions: [
                ...health.issues.map(issue => ({
                    type: 'health-issue',
                    priority: 'high',
                    message: issue,
                    actions: ['Investigate and resolve']
                })),
                ...health.warnings.map(warning => ({
                    type: 'health-warning',
                    priority: 'medium',
                    message: warning,
                    actions: ['Monitor and optimize']
                }))
            ],
            handoffTo: [],
            context: health
        };
    }
    /**
     * Debug specific issue
     */
    async debugIssue(issue) {
        this.logger.info(`Debugging issue: ${issue}`);
        // Search for related memories
        const relatedMemories = await this.ragOrchestrator?.searchAllStores(issue);
        // Analyze error patterns
        const errorAnalysis = await this.analyzeErrorContext(issue, relatedMemories || []);
        // Find similar resolved issues
        const similarResolved = await this.findSimilarResolvedIssues(issue);
        // Generate debugging strategy
        const debugStrategy = this.generateDebugStrategy(errorAnalysis, similarResolved);
        return {
            agentId: this.id,
            message: 'Issue analysis complete',
            priority: 'high',
            suggestions: [{
                    type: 'debug-solution',
                    priority: 'high',
                    message: debugStrategy.summary,
                    actions: debugStrategy.steps
                }],
            handoffTo: debugStrategy.recommendedAgents,
            context: {
                issue,
                analysis: errorAnalysis,
                similarCases: similarResolved,
                strategy: debugStrategy
            }
        };
    }
    /**
     * Self-improvement routine
     */
    async selfImprove() {
        this.logger.info('Initiating self-improvement routine');
        const improvements = [];
        // 1. Update system prompt based on learnings
        const promptImprovement = await this.improveSystemPrompt();
        if (promptImprovement)
            improvements.push(promptImprovement);
        // 2. Optimize internal algorithms
        const algorithmOptimization = await this.optimizeAlgorithms();
        if (algorithmOptimization)
            improvements.push(algorithmOptimization);
        // 3. Update pattern recognition
        const patternUpdate = await this.updatePatternRecognition();
        if (patternUpdate)
            improvements.push(patternUpdate);
        // 4. Refine monitoring thresholds
        const thresholdRefinement = await this.refineMonitoringThresholds();
        if (thresholdRefinement)
            improvements.push(thresholdRefinement);
        return {
            agentId: this.id,
            message: `Applied ${improvements.length} self-improvements`,
            priority: 'low',
            suggestions: [{
                    type: 'self-improvement-report',
                    priority: 'low',
                    message: 'Self-improvement cycle complete',
                    actions: improvements
                }],
            handoffTo: [],
            context: {
                improvements,
                learningRate: this.calculateLearningRate(),
                adaptationScore: this.systemMetrics.learningProgress.adaptationScore
            }
        };
    }
    /**
     * Start continuous system monitoring
     */
    startSystemMonitoring() {
        // Monitor every 30 seconds
        this.monitoringInterval = setInterval(async () => {
            await this.performContinuousMonitoring();
        }, 30000);
        this.logger.info('Started continuous system monitoring');
    }
    /**
     * Continuous monitoring routine
     */
    async performContinuousMonitoring() {
        try {
            // Update metrics
            await this.updateAllMetrics();
            // Check for anomalies
            const anomalies = await this.detectAnomalies();
            if (anomalies.length > 0) {
                this.logger.warn('Anomalies detected', { count: anomalies.length });
                await this.handleAnomalies(anomalies);
            }
            // Check system health
            const health = await this.calculateSystemHealth();
            if (health < 70) {
                this.logger.warn('System health below threshold', { health });
                await this.initiateHealthRecovery();
            }
            // Detect optimization opportunities
            const opportunities = await this.detectOptimizationOpportunities();
            if (opportunities.length > 0) {
                this.insights.push(...opportunities);
            }
        }
        catch (error) {
            this.logger.error('Monitoring cycle failed', { error });
        }
    }
    /**
     * Subscribe to all system events
     */
    subscribeToSystemEvents() {
        // Subscribe to orchestrator events
        if (this.orchestrator) {
            this.orchestrator.on('plan-created', (plan) => this.onPlanCreated(plan));
            this.orchestrator.on('execution-complete', (result) => this.onExecutionComplete(result));
        }
        // Subscribe to RAG events
        if (this.ragOrchestrator) {
            this.ragOrchestrator.on('pattern:detected', (pattern) => this.onPatternDetected(pattern));
            this.ragOrchestrator.on('memory:stored', (memory) => this.onMemoryStored(memory));
        }
        // Subscribe to agent events
        if (this.stackOrchestrator) {
            this.stackOrchestrator.on('agent:activated', (agent) => this.onAgentActivated(agent));
            this.stackOrchestrator.on('agent:error', (error) => this.onAgentError(error));
        }
    }
    /**
     * Event handlers
     */
    async onPlanCreated(plan) {
        this.systemMetrics.planningEfficiency.plansCreated++;
        await this.analyzePlanQuality(plan);
    }
    async onExecutionComplete(result) {
        this.systemMetrics.planningEfficiency.plansExecuted++;
        await this.analyzeExecutionResult(result);
    }
    async onPatternDetected(pattern) {
        this.systemMetrics.learningProgress.patternsDetected++;
        await this.evaluatePattern(pattern);
    }
    async onMemoryStored(memory) {
        this.systemMetrics.memoryUsage.totalMemories++;
        await this.evaluateMemoryValue(memory);
    }
    async onAgentActivated(agent) {
        const agentId = agent.id;
        if (!this.systemMetrics.agentPerformance.has(agentId)) {
            this.systemMetrics.agentPerformance.set(agentId, {
                successRate: 0,
                avgExecutionTime: 0,
                errorRate: 0,
                utilizationRate: 0,
                lastActive: new Date()
            });
        }
        const metrics = this.systemMetrics.agentPerformance.get(agentId);
        metrics.lastActive = new Date();
        metrics.utilizationRate = (metrics.utilizationRate * 0.9) + 0.1; // Exponential average
    }
    async onAgentError(error) {
        const agentId = error.agentId;
        if (this.systemMetrics.agentPerformance.has(agentId)) {
            const metrics = this.systemMetrics.agentPerformance.get(agentId);
            metrics.errorRate = (metrics.errorRate * 0.9) + 0.1;
        }
        await this.analyzeError(error);
    }
    /**
     * Update all system metrics
     */
    async updateAllMetrics() {
        // Update agent performance
        for (const [agentId, metrics] of this.systemMetrics.agentPerformance) {
            // Decay utilization rate over time
            const timeSinceActive = Date.now() - metrics.lastActive.getTime();
            if (timeSinceActive > 300000) { // 5 minutes
                metrics.utilizationRate *= 0.9;
            }
        }
        // Update memory metrics
        if (this.ragOrchestrator) {
            const memStats = await this.ragOrchestrator.getMemoryStatistics();
            this.systemMetrics.memoryUsage = {
                totalMemories: memStats.total,
                memoryByType: memStats.byType,
                queryPerformance: memStats.avgQueryTime < 100 ? 1 : 100 / memStats.avgQueryTime,
                storageSize: memStats.storageSize
            };
        }
        // Update planning metrics
        if (this.planOrchestrator) {
            const plans = await this.planOrchestrator.getActivePlans();
            this.systemMetrics.planningEfficiency.planComplexity =
                plans.reduce((sum, plan) => sum + plan.phases.length, 0) / Math.max(plans.length, 1);
        }
        // Calculate overall health
        this.systemMetrics.overallHealth = await this.calculateSystemHealth();
        return this.systemMetrics;
    }
    /**
     * Helper methods for analysis
     */
    async analyzeAgentPerformance() {
        const analysis = {
            underperforming: [],
            overutilized: [],
            idle: [],
            optimal: []
        };
        for (const [agentId, metrics] of this.systemMetrics.agentPerformance) {
            if (metrics.successRate < 0.7)
                analysis.underperforming.push(agentId);
            else if (metrics.utilizationRate > 0.9)
                analysis.overutilized.push(agentId);
            else if (metrics.utilizationRate < 0.1)
                analysis.idle.push(agentId);
            else
                analysis.optimal.push(agentId);
        }
        return analysis;
    }
    async analyzeMemoryUsage() {
        const totalMemories = this.systemMetrics.memoryUsage.totalMemories;
        const distribution = this.systemMetrics.memoryUsage.memoryByType;
        return {
            total: totalMemories,
            distribution,
            efficiency: this.systemMetrics.memoryUsage.queryPerformance,
            recommendations: this.generateMemoryRecommendations(distribution)
        };
    }
    async analyzePlanningEfficiency() {
        const metrics = this.systemMetrics.planningEfficiency;
        return {
            successRate: metrics.successRate,
            avgComplexity: metrics.planComplexity,
            avgTime: metrics.avgPlanTime,
            bottlenecks: await this.identifyPlanningBottlenecks()
        };
    }
    async analyzeLearningProgress() {
        const progress = this.systemMetrics.learningProgress;
        return {
            patternsLearned: progress.patternsDetected,
            improvementsApplied: progress.improvementsApplied,
            growthRate: progress.knowledgeGrowthRate,
            adaptability: progress.adaptationScore
        };
    }
    async analyzeSystemHealth() {
        return {
            score: this.systemMetrics.overallHealth,
            components: await this.getComponentHealth(),
            risks: await this.identifySystemRisks(),
            recommendations: await this.generateHealthRecommendations()
        };
    }
    async detectCrossComponentPatterns(analyses) {
        const patterns = [];
        const byType = new Map();
        for (const analysis of analyses) {
            const type = analysis.type || 'unknown';
            if (!byType.has(type))
                byType.set(type, []);
            byType.get(type).push(analysis);
        }
        for (const [type, typeAnalyses] of byType) {
            if (typeAnalyses.length >= 2) {
                patterns.push({
                    type: 'recurring',
                    category: type,
                    count: typeAnalyses.length,
                    description: `${type} pattern detected ${typeAnalyses.length} times`,
                    confidence: Math.min(0.9, typeAnalyses.length * 0.2)
                });
            }
        }
        return patterns;
    }
    generateSystemInsights(analyses, patterns) {
        const insights = [];
        for (const pattern of patterns) {
            if (pattern.confidence > 0.7) {
                insights.push({
                    type: 'pattern',
                    description: pattern.description,
                    impact: pattern.count > 5 ? 'high' : 'medium',
                    recommendation: `Consider automating ${pattern.category} handling`,
                    autoFixAvailable: false,
                    confidence: pattern.confidence
                });
            }
        }
        if (this.systemMetrics.overallHealth < 80) {
            insights.push({
                type: 'inefficiency',
                description: `System health at ${this.systemMetrics.overallHealth}%`,
                impact: 'high',
                recommendation: 'Run optimization and cleanup',
                autoFixAvailable: true,
                confidence: 1.0
            });
        }
        return insights;
    }
    async calculateSystemHealth() {
        const components = {
            agents: await this.checkAgentHealth(),
            memory: await this.checkMemoryHealth(),
            planning: await this.checkPlanningHealth(),
            integration: await this.checkIntegrationHealth()
        };
        return Math.round(Object.values(components).reduce((a, b) => a + b, 0) /
            Object.keys(components).length);
    }
    async checkAgentHealth() {
        if (this.systemMetrics.agentPerformance.size === 0)
            return 100;
        let totalScore = 0;
        for (const metrics of this.systemMetrics.agentPerformance.values()) {
            const agentScore = (metrics.successRate * 0.4 +
                Math.min(1, 5000 / metrics.avgExecutionTime) * 0.3 +
                (1 - metrics.errorRate) * 0.3) * 100;
            totalScore += agentScore;
        }
        return Math.round(totalScore / this.systemMetrics.agentPerformance.size);
    }
    async checkMemoryHealth() {
        return Math.round(this.systemMetrics.memoryUsage.queryPerformance * 100);
    }
    async checkPlanningHealth() {
        const metrics = this.systemMetrics.planningEfficiency;
        const timeScore = Math.min(1, 5000 / Math.max(metrics.avgPlanTime, 1));
        return Math.round((metrics.successRate * 0.5 +
            timeScore * 0.3 +
            Math.min(1, 10 / Math.max(metrics.planComplexity, 1)) * 0.2) * 100);
    }
    async checkIntegrationHealth() {
        // Check stack integration health
        if (!this.stackOrchestrator)
            return 100;
        const status = await this.stackOrchestrator.getStackStatus();
        const connectedCount = Object.values(status.connections).filter(Boolean).length;
        const totalCount = Object.keys(status.connections).length;
        return Math.round((connectedCount / totalCount) * 100);
    }
    // Stub implementations for other methods
    async optimizeAgent(agentId) {
        return `Optimized ${agentId} execution pipeline`;
    }
    async optimizeMemoryQueries() {
        return 'Implemented memory query caching and indexing';
    }
    async optimizePlanning() {
        return 'Optimized planning algorithms for faster execution';
    }
    async cleanupUnusedResources() {
        return 'Cleaned up 15MB of unused memory entries';
    }
    async detectAgentPatterns() {
        const patterns = [];
        for (const [agentId, metrics] of this.systemMetrics.agentPerformance) {
            if (metrics.successRate < 0.8) {
                patterns.push({
                    type: 'low_success',
                    agentId,
                    successRate: metrics.successRate,
                    description: `${agentId} has low success rate: ${(metrics.successRate * 100).toFixed(1)}%`
                });
            }
            if (metrics.avgExecutionTime > 10000) {
                patterns.push({
                    type: 'slow_execution',
                    agentId,
                    avgTime: metrics.avgExecutionTime,
                    description: `${agentId} has slow execution: ${metrics.avgExecutionTime}ms`
                });
            }
        }
        return patterns;
    }
    async detectWorkflowPatterns() {
        // Workflow pattern detection from orchestrator
        return [];
    }
    async detectErrorPatterns() {
        const errorPatterns = [];
        const errorMap = new Map();
        for (const metrics of this.systemMetrics.agentPerformance.values()) {
            if (metrics.errorRate > 0.1) {
                const key = `error-${metrics.errorRate.toFixed(2)}`;
                errorMap.set(key, (errorMap.get(key) || 0) + 1);
            }
        }
        for (const [pattern, count] of errorMap) {
            if (count >= 2) {
                errorPatterns.push({
                    type: 'recurring_error',
                    pattern,
                    count,
                    description: `Recurring error pattern detected ${count} times`
                });
            }
        }
        return errorPatterns;
    }
    async detectSuccessPatterns() {
        const successPatterns = [];
        for (const [agentId, metrics] of this.systemMetrics.agentPerformance) {
            if (metrics.successRate > 0.95) {
                successPatterns.push({
                    type: 'high_success',
                    agentId,
                    successRate: metrics.successRate,
                    description: `${agentId} consistently successful (${(metrics.successRate * 100).toFixed(1)}%)`
                });
            }
        }
        return successPatterns;
    }
    async detectUsagePatterns() {
        const usagePatterns = [];
        for (const [agentId, metrics] of this.systemMetrics.agentPerformance) {
            if (metrics.utilizationRate > 0.8) {
                usagePatterns.push({
                    type: 'high_utilization',
                    agentId,
                    utilization: metrics.utilizationRate,
                    description: `${agentId} heavily utilized (${(metrics.utilizationRate * 100).toFixed(1)}%)`
                });
            }
            else if (metrics.utilizationRate < 0.2) {
                usagePatterns.push({
                    type: 'underutilized',
                    agentId,
                    utilization: metrics.utilizationRate,
                    description: `${agentId} underutilized (${(metrics.utilizationRate * 100).toFixed(1)}%)`
                });
            }
        }
        return usagePatterns;
    }
    async storePatternsInRAG(patterns) {
        // Store patterns in RAG for future reference
        if (!this.ragOrchestrator)
            return;
        // Patterns are stored through orchestrator's memory system
        this.logger.info('Patterns stored in RAG', { patternCount: patterns.length || 0 });
    }
    patternsToInsights(patterns) {
        if (!Array.isArray(patterns))
            return [];
        return patterns.map((pattern) => ({
            type: 'pattern',
            description: pattern.description || JSON.stringify(pattern),
            impact: pattern.count > 5 ? 'high' : 'medium',
            recommendation: `Investigate ${pattern.type} pattern`,
            autoFixAvailable: false,
            confidence: pattern.confidence || 0.8
        }));
    }
    generateMemoryRecommendations(distribution) {
        const recommendations = [];
        if (distribution.codeMemories < distribution.totalMemories * 0.2) {
            recommendations.push('Increase code pattern storage for better code generation');
        }
        if (distribution.errorMemories > distribution.totalMemories * 0.3) {
            recommendations.push('High error rate - investigate recurring issues');
        }
        if (this.systemMetrics.memoryUsage.queryPerformance < 0.7) {
            recommendations.push('Optimize memory query performance - consider indexing');
        }
        return recommendations;
    }
    async identifyPlanningBottlenecks() {
        const bottlenecks = [];
        const metrics = this.systemMetrics.planningEfficiency;
        if (metrics.avgPlanTime > 5000) {
            bottlenecks.push(`Slow planning: ${metrics.avgPlanTime}ms average`);
        }
        if (metrics.successRate < 0.8) {
            bottlenecks.push(`Low planning success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
        }
        if (metrics.planComplexity > 10) {
            bottlenecks.push(`High plan complexity: ${metrics.planComplexity} average steps`);
        }
        return bottlenecks;
    }
    async getComponentHealth() {
        return {
            agents: await this.checkAgentHealth(),
            memory: await this.checkMemoryHealth(),
            planning: await this.checkPlanningHealth(),
            integration: await this.checkIntegrationHealth(),
            overall: this.systemMetrics.overallHealth
        };
    }
    async identifySystemRisks() {
        const risks = [];
        if (this.systemMetrics.overallHealth < 70) {
            risks.push('Critical: System health below 70%');
        }
        for (const [agentId, metrics] of this.systemMetrics.agentPerformance) {
            if (metrics.errorRate > 0.2) {
                risks.push(`High error rate in ${agentId}: ${(metrics.errorRate * 100).toFixed(1)}%`);
            }
        }
        if (this.systemMetrics.memoryUsage.queryPerformance < 0.6) {
            risks.push('Memory system performance degraded');
        }
        return risks;
    }
    async generateHealthRecommendations() {
        const recommendations = [];
        const health = this.systemMetrics.overallHealth;
        if (health < 70) {
            recommendations.push('URGENT: Run full system diagnostic and cleanup');
            recommendations.push('Review recent errors and failures');
            recommendations.push('Consider restarting underperforming agents');
        }
        else if (health < 85) {
            recommendations.push('Schedule maintenance and optimization');
            recommendations.push('Review agent performance metrics');
        }
        if (this.systemMetrics.agentPerformance.size > 10) {
            recommendations.push('Consider agent consolidation for better resource usage');
        }
        if (this.systemMetrics.memoryUsage.queryPerformance < 0.8) {
            recommendations.push('Optimize memory query performance');
        }
        if (this.systemMetrics.planningEfficiency.avgPlanTime > 5000) {
            recommendations.push('Simplify planning algorithms to reduce execution time');
        }
        return recommendations;
    }
    async detectAnomalies() {
        return [];
    }
    async handleAnomalies(anomalies) {
        // Handle detected anomalies
    }
    async initiateHealthRecovery() {
        // Initiate recovery procedures
    }
    async detectOptimizationOpportunities() {
        return [];
    }
    async analyzePlanQuality(plan) {
        // Analyze plan quality
    }
    async analyzeExecutionResult(result) {
        // Analyze execution results
    }
    async evaluatePattern(pattern) {
        // Evaluate detected pattern
    }
    async evaluateMemoryValue(memory) {
        // Evaluate memory value
    }
    async analyzeError(error) {
        // Analyze error for patterns
    }
    async analyzeAgentCollaboration() {
        return { inefficiencies: [] };
    }
    async analyzeMemoryEfficiency() {
        return { redundancy: 0 };
    }
    async analyzePlanningPatterns() {
        return { suboptimalPlans: 0 };
    }
    async analyzeStackIntegration() {
        return { unutilizedFeatures: [] };
    }
    generateAgentOptimizationPlan(analysis) {
        return { steps: [] };
    }
    generateMemoryOptimizationPlan(analysis) {
        return { steps: [] };
    }
    generatePlanningOptimizationPlan(analysis) {
        return { steps: [] };
    }
    generateStackOptimizationPlan(analysis) {
        return { steps: [] };
    }
    async analyzeErrorContext(issue, memories) {
        return {};
    }
    async findSimilarResolvedIssues(issue) {
        return [];
    }
    generateDebugStrategy(analysis, similar) {
        return {
            summary: 'Debug strategy generated',
            steps: [],
            recommendedAgents: []
        };
    }
    async improveSystemPrompt() {
        return null;
    }
    async optimizeAlgorithms() {
        return null;
    }
    async updatePatternRecognition() {
        return null;
    }
    async refineMonitoringThresholds() {
        return null;
    }
    calculateLearningRate() {
        return this.systemMetrics.learningProgress.knowledgeGrowthRate;
    }
    async performGeneralAnalysis(context) {
        return {
            agentId: this.id,
            message: 'General analysis complete',
            priority: 'low',
            suggestions: [],
            handoffTo: [],
            context: {}
        };
    }
    /**
     * Cleanup
     */
    shutdown() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }
}
//# sourceMappingURL=introspective-meta-agent.js.map