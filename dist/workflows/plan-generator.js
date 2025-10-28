/**
 * @fileoverview Plan Generator - Creates structured multi-phase plans with historical context
 *
 * Generates comprehensive execution plans using:
 * - Phase breakdown (requirements, development, integration, QA)
 * - Agent assignments per phase
 * - Time estimates from historical RAG data
 * - Dependencies and parallel execution opportunities
 *
 * @module workflows/plan-generator
 * @version 6.5.0
 */
import { VERSATILLogger } from '../utils/logger.js';
// ============================================================================
// PLAN GENERATOR IMPLEMENTATION
// ============================================================================
export class PlanGenerator {
    constructor(vectorStore) {
        this.logger = new VERSATILLogger('PlanGenerator');
        this.vectorStore = vectorStore;
    }
    // ========================================================================
    // PLAN GENERATION API
    // ========================================================================
    /**
     * Generate execution plan from detection result and context
     */
    async generatePlan(detection, request, projectContext) {
        this.logger.info('Generating execution plan', {
            confidence: detection.confidence,
            agentsRequired: detection.agentsRequired,
            estimatedDuration: detection.estimatedDuration,
        });
        // Retrieve historical context from RAG
        const historicalContext = await this.retrieveHistoricalContext(request, detection);
        // Create plan metadata
        const metadata = this.createMetadata(request, detection);
        // Generate phases
        const phases = await this.generatePhases(detection, request, historicalContext, projectContext);
        // Calculate estimates
        const estimates = this.calculateEstimates(phases, historicalContext);
        // Identify dependencies
        const dependencies = this.identifyDependencies(phases);
        // Find parallel execution opportunities
        const parallelGroups = this.findParallelGroups(phases, dependencies);
        // Assess risks
        const risks = this.assessRisks(phases, detection);
        const plan = {
            metadata,
            phases,
            estimates,
            dependencies,
            parallelGroups,
            risks,
            historicalContext,
        };
        this.logger.info('Plan generated successfully', {
            planId: metadata.id,
            phasesCount: phases.length,
            totalSequential: estimates.totalSequential,
            totalParallel: estimates.totalParallel,
            timeSaved: estimates.timeSaved,
        });
        return plan;
    }
    // ========================================================================
    // HISTORICAL CONTEXT RETRIEVAL
    // ========================================================================
    /**
     * Retrieve relevant historical context from RAG
     */
    async retrieveHistoricalContext(request, detection) {
        if (!this.vectorStore) {
            this.logger.warn('No vector store available, skipping historical context');
            return [];
        }
        const context = [];
        try {
            // Search for similar features
            const similarFeatures = await this.vectorStore.searchSimilar(request, {
                limit: 5,
                threshold: 0.7,
                domain: 'features',
            });
            for (const result of similarFeatures) {
                context.push({
                    type: 'similar-feature',
                    description: `Similar feature: ${result.metadata?.description || 'Unknown'}`,
                    relevance: result.score,
                    data: {
                        description: result.metadata?.description,
                        duration: result.metadata?.actualDuration,
                        agents: result.metadata?.agents,
                    },
                    source: 'RAG Vector Store',
                });
            }
            // Search for agent performance data
            for (const agent of detection.involvedAgents) {
                const agentPerf = await this.vectorStore.searchSimilar(`${agent} performance`, {
                    limit: 3,
                    threshold: 0.6,
                    domain: 'agent-performance',
                });
                if (agentPerf.length > 0) {
                    const avgDuration = agentPerf.reduce((sum, r) => sum + (r.metadata?.duration || 0), 0) / agentPerf.length;
                    context.push({
                        type: 'agent-performance',
                        description: `${agent} average performance`,
                        relevance: 0.8,
                        data: {
                            agent,
                            averageDuration: avgDuration,
                            successRate: agentPerf[0].metadata?.successRate || 0.9,
                        },
                        source: 'RAG Agent Metrics',
                    });
                }
            }
            // Search for time estimates
            const timeEstimates = await this.vectorStore.searchSimilar(`estimate ${request}`, {
                limit: 5,
                threshold: 0.65,
                domain: 'estimates',
            });
            if (timeEstimates.length > 0) {
                const avgEstimate = timeEstimates.reduce((sum, r) => sum + (r.metadata?.estimated || 0), 0) / timeEstimates.length;
                const avgActual = timeEstimates.reduce((sum, r) => sum + (r.metadata?.actual || 0), 0) / timeEstimates.length;
                const accuracy = avgEstimate > 0 ? (1 - Math.abs(avgEstimate - avgActual) / avgEstimate) : 0;
                context.push({
                    type: 'time-estimate',
                    description: 'Historical time estimate accuracy',
                    relevance: 0.75,
                    data: {
                        averageEstimated: avgEstimate,
                        averageActual: avgActual,
                        accuracy: accuracy * 100,
                    },
                    source: 'RAG Time Estimates',
                });
            }
            // Search for patterns
            const patterns = await this.vectorStore.searchSimilar(`pattern ${request}`, {
                limit: 3,
                threshold: 0.7,
                domain: 'patterns',
            });
            for (const pattern of patterns) {
                context.push({
                    type: 'pattern',
                    description: pattern.metadata?.description || 'Relevant pattern',
                    relevance: pattern.score,
                    data: pattern.metadata,
                    source: 'RAG Patterns',
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to retrieve historical context', { error: error.message });
        }
        this.logger.info('Retrieved historical context', { contextCount: context.length });
        return context;
    }
    // ========================================================================
    // PLAN CREATION
    // ========================================================================
    /**
     * Create plan metadata
     */
    createMetadata(request, detection) {
        return {
            id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            createdAt: new Date(),
            version: '1.0.0',
            description: request,
            complexity: detection.riskLevel,
            generatedBy: 'PlanGenerator',
        };
    }
    /**
     * Generate execution phases
     */
    async generatePhases(detection, request, historicalContext, projectContext) {
        const phases = [];
        let phaseNumber = 1;
        // Phase 1: Requirements Analysis (if Alex-BA involved)
        if (detection.involvedAgents.includes('alex-ba')) {
            phases.push(this.createRequirementsPhase(phaseNumber++, request, historicalContext));
        }
        // Identify if this is a three-tier feature
        const hasDana = detection.involvedAgents.includes('dana-database');
        const hasMarcus = detection.involvedAgents.includes('marcus-backend');
        const hasJames = detection.involvedAgents.includes('james-frontend');
        const isThreeTier = hasDana && hasMarcus && hasJames;
        if (isThreeTier) {
            // Three-tier parallel development
            phases.push(this.createDatabasePhase(phaseNumber++, request, historicalContext));
            phases.push(this.createBackendPhase(phaseNumber++, request, historicalContext, true)); // with mocks
            phases.push(this.createFrontendPhase(phaseNumber++, request, historicalContext, true)); // with mocks
            // Integration phase
            phases.push(this.createIntegrationPhase(phaseNumber++, request));
        }
        else {
            // Standard sequential development
            if (hasDana) {
                phases.push(this.createDatabasePhase(phaseNumber++, request, historicalContext));
            }
            if (hasMarcus) {
                phases.push(this.createBackendPhase(phaseNumber++, request, historicalContext, false));
            }
            if (hasJames) {
                phases.push(this.createFrontendPhase(phaseNumber++, request, historicalContext, false));
            }
        }
        // Phase N: Quality Assurance (always include if Maria-QA involved)
        if (detection.involvedAgents.includes('maria-qa')) {
            phases.push(this.createQualityPhase(phaseNumber++, request, historicalContext));
        }
        return phases;
    }
    /**
     * Create Requirements Analysis phase
     */
    createRequirementsPhase(number, request, historicalContext) {
        // Get historical duration for requirements phase
        const historicalDuration = this.getHistoricalDuration(historicalContext, 'alex-ba', 30);
        return {
            id: `phase-${number}-requirements`,
            name: 'Requirements Analysis',
            description: 'Define requirements, create user stories, establish API contracts',
            agents: ['alex-ba'],
            tasks: [
                {
                    id: 'task-req-1',
                    description: 'Extract and analyze requirements from request',
                    agent: 'alex-ba',
                    estimatedDuration: historicalDuration * 0.4,
                    inputs: { request },
                    expectedOutputs: { userStories: [], acceptanceCriteria: [] },
                    successCriteria: ['Clear user stories defined', 'Acceptance criteria specified'],
                    priority: 'high',
                },
                {
                    id: 'task-req-2',
                    description: 'Define API contracts (endpoints + schemas)',
                    agent: 'alex-ba',
                    estimatedDuration: historicalDuration * 0.4,
                    inputs: { userStories: 'from-task-req-1' },
                    expectedOutputs: { apiContract: {}, schemas: {} },
                    successCriteria: ['API endpoints defined', 'Request/response schemas specified'],
                    priority: 'high',
                },
                {
                    id: 'task-req-3',
                    description: 'Create acceptance criteria and test scenarios',
                    agent: 'alex-ba',
                    estimatedDuration: historicalDuration * 0.2,
                    inputs: { userStories: 'from-task-req-1', apiContract: 'from-task-req-2' },
                    expectedOutputs: { acceptanceCriteria: [], testScenarios: [] },
                    successCriteria: ['Acceptance criteria complete', 'Test scenarios documented'],
                    priority: 'medium',
                },
            ],
            estimatedDuration: historicalDuration,
            dependsOn: [],
            canParallelize: false,
            qualityGates: [
                {
                    type: 'approval',
                    description: 'Requirements review and approval',
                    criteria: ['User stories approved', 'API contract validated', 'Acceptance criteria clear'],
                    mandatory: true,
                },
            ],
            outputs: [
                {
                    type: 'artifact',
                    description: 'User stories document',
                    format: 'markdown',
                    required: true,
                },
                {
                    type: 'artifact',
                    description: 'API contract specification',
                    format: 'OpenAPI/JSON Schema',
                    required: true,
                },
            ],
        };
    }
    /**
     * Create Database Layer phase
     */
    createDatabasePhase(number, request, historicalContext) {
        const historicalDuration = this.getHistoricalDuration(historicalContext, 'dana-database', 45);
        return {
            id: `phase-${number}-database`,
            name: 'Database Layer',
            description: 'Design schema, create migrations, add RLS policies',
            agents: ['dana-database'],
            tasks: [
                {
                    id: 'task-db-1',
                    description: 'Design database schema and relationships',
                    agent: 'dana-database',
                    estimatedDuration: historicalDuration * 0.4,
                    inputs: { requirements: 'from-requirements-phase' },
                    expectedOutputs: { schema: {}, relationships: [] },
                    successCriteria: ['Schema normalized', 'Relationships defined', 'Indexes planned'],
                    priority: 'high',
                },
                {
                    id: 'task-db-2',
                    description: 'Create migration scripts',
                    agent: 'dana-database',
                    estimatedDuration: historicalDuration * 0.3,
                    inputs: { schema: 'from-task-db-1' },
                    expectedOutputs: { migrations: [] },
                    successCriteria: ['Migrations tested', 'Rollback strategy defined'],
                    priority: 'high',
                },
                {
                    id: 'task-db-3',
                    description: 'Add Row Level Security (RLS) policies',
                    agent: 'dana-database',
                    estimatedDuration: historicalDuration * 0.3,
                    inputs: { schema: 'from-task-db-1' },
                    expectedOutputs: { rlsPolicies: [] },
                    successCriteria: ['RLS policies tested', 'Security validated'],
                    priority: 'high',
                },
            ],
            estimatedDuration: historicalDuration,
            dependsOn: ['phase-1-requirements'],
            canParallelize: true,
            qualityGates: [
                {
                    type: 'automated',
                    description: 'Database migration tests',
                    criteria: ['Migrations run successfully', 'Rollback tested', 'RLS policies effective'],
                    mandatory: true,
                },
            ],
            outputs: [
                {
                    type: 'file',
                    description: 'Migration scripts',
                    format: 'SQL',
                    required: true,
                },
                {
                    type: 'artifact',
                    description: 'Database schema documentation',
                    format: 'markdown/ER diagram',
                    required: true,
                },
            ],
        };
    }
    /**
     * Create Backend API phase
     */
    createBackendPhase(number, request, historicalContext, useMocks) {
        const historicalDuration = this.getHistoricalDuration(historicalContext, 'marcus-backend', 60);
        const tasks = [
            {
                id: 'task-api-1',
                description: `Implement API endpoints ${useMocks ? '(with mock database)' : ''}`,
                agent: 'marcus-backend',
                estimatedDuration: historicalDuration * 0.5,
                inputs: { apiContract: 'from-requirements-phase', mocks: useMocks },
                expectedOutputs: { endpoints: [], tests: [] },
                successCriteria: ['Endpoints implemented', 'Request validation added', 'Error handling complete'],
                priority: 'high',
            },
            {
                id: 'task-api-2',
                description: 'Add security patterns (OWASP compliance)',
                agent: 'marcus-backend',
                estimatedDuration: historicalDuration * 0.3,
                inputs: { endpoints: 'from-task-api-1' },
                expectedOutputs: { securityValidation: {}, tests: [] },
                successCriteria: ['OWASP Top 10 addressed', 'Security tests passing'],
                priority: 'high',
            },
            {
                id: 'task-api-3',
                description: 'Generate stress tests (Rule 2)',
                agent: 'marcus-backend',
                estimatedDuration: historicalDuration * 0.2,
                inputs: { endpoints: 'from-task-api-1' },
                expectedOutputs: { stressTests: [], performanceBaseline: {} },
                successCriteria: ['< 200ms response time', 'Handles 100 req/s'],
                priority: 'medium',
            },
        ];
        return {
            id: `phase-${number}-backend`,
            name: 'Backend API Layer',
            description: `Implement API endpoints ${useMocks ? 'with mocks (parallel)' : 'with real database'}`,
            agents: ['marcus-backend'],
            tasks,
            estimatedDuration: historicalDuration,
            dependsOn: useMocks ? ['phase-1-requirements'] : ['phase-1-requirements', `phase-${number - 1}-database`],
            canParallelize: useMocks,
            qualityGates: [
                {
                    type: 'automated',
                    description: 'API tests and security scan',
                    criteria: ['All tests passing', 'Security scan clean', 'Performance within limits'],
                    mandatory: true,
                },
            ],
            outputs: [
                {
                    type: 'file',
                    description: 'API implementation files',
                    format: 'TypeScript/Python/etc',
                    required: true,
                },
                {
                    type: 'artifact',
                    description: 'API test suite',
                    format: 'Jest/Pytest',
                    required: true,
                },
            ],
        };
    }
    /**
     * Create Frontend UI phase
     */
    createFrontendPhase(number, request, historicalContext, useMocks) {
        const historicalDuration = this.getHistoricalDuration(historicalContext, 'james-frontend', 50);
        const tasks = [
            {
                id: 'task-ui-1',
                description: `Build UI components ${useMocks ? '(with mock API)' : ''}`,
                agent: 'james-frontend',
                estimatedDuration: historicalDuration * 0.5,
                inputs: { requirements: 'from-requirements-phase', mocks: useMocks },
                expectedOutputs: { components: [], styles: [] },
                successCriteria: ['Components implemented', 'Responsive design', 'Form validation added'],
                priority: 'high',
            },
            {
                id: 'task-ui-2',
                description: 'Add accessibility (WCAG 2.1 AA)',
                agent: 'james-frontend',
                estimatedDuration: historicalDuration * 0.3,
                inputs: { components: 'from-task-ui-1' },
                expectedOutputs: { accessibilityReport: {}, fixes: [] },
                successCriteria: ['WCAG 2.1 AA compliant', 'ARIA labels added', 'Keyboard navigation working'],
                priority: 'high',
            },
            {
                id: 'task-ui-3',
                description: 'Optimize performance and bundle size',
                agent: 'james-frontend',
                estimatedDuration: historicalDuration * 0.2,
                inputs: { components: 'from-task-ui-1' },
                expectedOutputs: { performanceReport: {}, optimizations: [] },
                successCriteria: ['< 2s load time', 'Bundle < 200KB', 'Lighthouse score > 90'],
                priority: 'medium',
            },
        ];
        return {
            id: `phase-${number}-frontend`,
            name: 'Frontend UI Layer',
            description: `Build UI components ${useMocks ? 'with mock API (parallel)' : 'with real API'}`,
            agents: ['james-frontend'],
            tasks,
            estimatedDuration: historicalDuration,
            dependsOn: useMocks ? ['phase-1-requirements'] : ['phase-1-requirements', `phase-${number - 1}-backend`],
            canParallelize: useMocks,
            qualityGates: [
                {
                    type: 'automated',
                    description: 'Accessibility and performance validation',
                    criteria: ['Accessibility tests passing', 'Performance targets met', 'Visual tests passing'],
                    mandatory: true,
                },
            ],
            outputs: [
                {
                    type: 'file',
                    description: 'UI component files',
                    format: 'React/Vue/etc',
                    required: true,
                },
                {
                    type: 'artifact',
                    description: 'Component tests',
                    format: 'Jest/Vitest',
                    required: true,
                },
            ],
        };
    }
    /**
     * Create Integration phase (for three-tier architecture)
     */
    createIntegrationPhase(number, request) {
        return {
            id: `phase-${number}-integration`,
            name: 'Integration',
            description: 'Connect database → API → frontend, end-to-end testing',
            agents: ['dana-database', 'marcus-backend', 'james-frontend'],
            tasks: [
                {
                    id: 'task-int-1',
                    description: 'Connect real database to API (remove mocks)',
                    agent: 'marcus-backend',
                    estimatedDuration: 8,
                    inputs: { database: 'from-database-phase', api: 'from-backend-phase' },
                    expectedOutputs: { connectedApi: {} },
                    successCriteria: ['Database queries working', 'Mock removed', 'Tests updated'],
                    priority: 'high',
                },
                {
                    id: 'task-int-2',
                    description: 'Connect real API to frontend (remove mocks)',
                    agent: 'james-frontend',
                    estimatedDuration: 7,
                    inputs: { api: 'from-backend-phase', frontend: 'from-frontend-phase' },
                    expectedOutputs: { connectedFrontend: {} },
                    successCriteria: ['API calls working', 'Mock removed', 'Error handling tested'],
                    priority: 'high',
                },
                {
                    id: 'task-int-3',
                    description: 'End-to-end testing across all layers',
                    agent: 'maria-qa',
                    estimatedDuration: 10,
                    inputs: { fullStack: 'integrated-system' },
                    expectedOutputs: { e2eTests: [], report: {} },
                    successCriteria: ['E2E tests passing', 'User flows validated', 'Performance acceptable'],
                    priority: 'high',
                },
            ],
            estimatedDuration: 25,
            dependsOn: [`phase-${number - 3}-database`, `phase-${number - 2}-backend`, `phase-${number - 1}-frontend`],
            canParallelize: false,
            qualityGates: [
                {
                    type: 'automated',
                    description: 'End-to-end integration tests',
                    criteria: ['All E2E tests passing', 'No integration errors', 'Performance targets met'],
                    mandatory: true,
                },
            ],
            outputs: [
                {
                    type: 'artifact',
                    description: 'E2E test suite',
                    format: 'Playwright/Cypress',
                    required: true,
                },
            ],
        };
    }
    /**
     * Create Quality Assurance phase
     */
    createQualityPhase(number, request, historicalContext) {
        const historicalDuration = this.getHistoricalDuration(historicalContext, 'maria-qa', 20);
        return {
            id: `phase-${number}-quality`,
            name: 'Quality Assurance',
            description: 'Final quality validation, test coverage, security scan',
            agents: ['maria-qa'],
            tasks: [
                {
                    id: 'task-qa-1',
                    description: 'Validate test coverage (80%+ required)',
                    agent: 'maria-qa',
                    estimatedDuration: historicalDuration * 0.3,
                    inputs: { allTests: 'from-previous-phases' },
                    expectedOutputs: { coverageReport: {} },
                    successCriteria: ['Coverage >= 80%', 'Critical paths covered', 'Edge cases tested'],
                    priority: 'high',
                },
                {
                    id: 'task-qa-2',
                    description: 'Run comprehensive security scan',
                    agent: 'maria-qa',
                    estimatedDuration: historicalDuration * 0.3,
                    inputs: { codebase: 'full-implementation' },
                    expectedOutputs: { securityReport: {}, vulnerabilities: [] },
                    successCriteria: ['No critical vulnerabilities', 'OWASP compliance verified'],
                    priority: 'high',
                },
                {
                    id: 'task-qa-3',
                    description: 'Performance and load testing',
                    agent: 'maria-qa',
                    estimatedDuration: historicalDuration * 0.4,
                    inputs: { system: 'integrated-system' },
                    expectedOutputs: { performanceReport: {}, loadTestResults: {} },
                    successCriteria: ['Response times acceptable', 'Load targets met', 'No memory leaks'],
                    priority: 'medium',
                },
            ],
            estimatedDuration: historicalDuration,
            dependsOn: [`phase-${number - 1}-integration`].filter((_, i) => number > 1),
            canParallelize: false,
            qualityGates: [
                {
                    type: 'automated',
                    description: 'Final quality validation',
                    criteria: ['All tests passing', 'Coverage >= 80%', 'Security scan clean', 'Performance acceptable'],
                    mandatory: true,
                },
                {
                    type: 'approval',
                    description: 'Final approval before deployment',
                    criteria: ['Quality metrics met', 'Stakeholder approval'],
                    mandatory: true,
                },
            ],
            outputs: [
                {
                    type: 'artifact',
                    description: 'Quality assurance report',
                    format: 'markdown/PDF',
                    required: true,
                },
            ],
        };
    }
    /**
     * Get historical duration for an agent from context
     */
    getHistoricalDuration(historicalContext, agent, defaultDuration) {
        const agentPerf = historicalContext.find(ctx => ctx.type === 'agent-performance' && ctx.data?.agent === agent);
        if (agentPerf && agentPerf.data?.averageDuration) {
            return Math.round(agentPerf.data.averageDuration);
        }
        // Check time estimates
        const timeEst = historicalContext.find(ctx => ctx.type === 'time-estimate');
        if (timeEst && timeEst.data?.averageActual) {
            // Apply accuracy adjustment
            const accuracy = timeEst.data.accuracy / 100;
            return Math.round(defaultDuration * (1 / accuracy));
        }
        return defaultDuration;
    }
    /**
     * Calculate overall estimates
     */
    calculateEstimates(phases, historicalContext) {
        // Calculate sequential total
        const totalSequential = phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);
        // Calculate parallel total (considering parallelizable phases)
        let totalParallel = 0;
        const processed = new Set();
        for (const phase of phases) {
            if (processed.has(phase.id))
                continue;
            if (phase.canParallelize) {
                // Find all parallel phases
                const parallelPhases = phases.filter(p => p.canParallelize && !processed.has(p.id) &&
                    p.dependsOn.every(dep => processed.has(dep)));
                // Add max duration of parallel group
                const maxDuration = Math.max(...parallelPhases.map(p => p.estimatedDuration), phase.estimatedDuration);
                totalParallel += maxDuration;
                // Mark all as processed
                parallelPhases.forEach(p => processed.add(p.id));
            }
            else {
                totalParallel += phase.estimatedDuration;
            }
            processed.add(phase.id);
        }
        const timeSaved = totalSequential - totalParallel;
        // Calculate confidence from historical accuracy
        const timeEst = historicalContext.find(ctx => ctx.type === 'time-estimate');
        const confidence = timeEst?.data?.accuracy || 75;
        // Breakdown by phase
        const byPhase = {};
        phases.forEach(phase => {
            byPhase[phase.id] = phase.estimatedDuration;
        });
        // Breakdown by agent
        const byAgent = {};
        phases.forEach(phase => {
            phase.agents.forEach(agent => {
                byAgent[agent] = (byAgent[agent] || 0) + phase.estimatedDuration / phase.agents.length;
            });
        });
        return {
            totalSequential,
            totalParallel,
            timeSaved,
            confidence,
            byPhase,
            byAgent,
        };
    }
    /**
     * Identify dependencies between phases
     */
    identifyDependencies(phases) {
        const dependencies = [];
        for (const phase of phases) {
            for (const depId of phase.dependsOn) {
                const depPhase = phases.find(p => p.id === depId);
                if (depPhase) {
                    dependencies.push({
                        fromPhase: phase.id,
                        toPhase: depId,
                        type: 'hard',
                        reason: `${phase.name} requires outputs from ${depPhase.name}`,
                    });
                }
            }
        }
        return dependencies;
    }
    /**
     * Find parallel execution opportunities
     */
    findParallelGroups(phases, dependencies) {
        const groups = [];
        const processed = new Set();
        for (const phase of phases) {
            if (processed.has(phase.id) || !phase.canParallelize)
                continue;
            // Find all phases that can run in parallel with this one
            const parallelPhases = phases.filter(p => p.canParallelize && !processed.has(p.id) &&
                p.dependsOn.every(dep => processed.has(dep)) &&
                phase.dependsOn.every(dep => processed.has(dep)));
            if (parallelPhases.length > 0) {
                parallelPhases.push(phase);
                const group = {
                    id: `parallel-group-${groups.length + 1}`,
                    phases: parallelPhases.map(p => p.id),
                    description: `Parallel execution: ${parallelPhases.map(p => p.name).join(', ')}`,
                    estimatedDuration: Math.max(...parallelPhases.map(p => p.estimatedDuration)),
                };
                groups.push(group);
                parallelPhases.forEach(p => processed.add(p.id));
            }
        }
        return groups;
    }
    /**
     * Assess risks for the plan
     */
    assessRisks(phases, detection) {
        const risks = [];
        const mitigations = [];
        // Overall risk level from detection
        const level = detection.riskLevel;
        // Database migration risks
        const dbPhase = phases.find(p => p.id.includes('database'));
        if (dbPhase) {
            const risk = {
                id: 'risk-db-migration',
                description: 'Database migration could fail or corrupt data',
                level: 'high',
                affectedPhases: [dbPhase.id],
                probability: 30,
                impact: 90,
            };
            risks.push(risk);
            mitigations.push({
                forRisk: risk.id,
                strategy: 'Create database backup before migration, test rollback procedure',
                implementIn: dbPhase.id,
                effectiveness: 85,
            });
        }
        // Integration risks
        const intPhase = phases.find(p => p.id.includes('integration'));
        if (intPhase) {
            const risk = {
                id: 'risk-integration',
                description: 'Integration between layers could reveal unexpected incompatibilities',
                level: 'medium',
                affectedPhases: [intPhase.id],
                probability: 50,
                impact: 60,
            };
            risks.push(risk);
            mitigations.push({
                forRisk: risk.id,
                strategy: 'Incremental integration with testing at each step',
                implementIn: intPhase.id,
                effectiveness: 75,
            });
        }
        // Performance risks
        if (detection.complexityIndicators.some(ind => ind.type === 'performance-critical')) {
            const risk = {
                id: 'risk-performance',
                description: 'Performance targets may not be met',
                level: 'medium',
                affectedPhases: phases.filter(p => p.id.includes('backend') || p.id.includes('frontend')).map(p => p.id),
                probability: 40,
                impact: 50,
            };
            risks.push(risk);
            mitigations.push({
                forRisk: risk.id,
                strategy: 'Early performance testing, profiling, and optimization',
                implementIn: 'phase-quality',
                effectiveness: 70,
            });
        }
        // Security risks
        if (detection.complexityIndicators.some(ind => ind.type === 'security-critical')) {
            const risk = {
                id: 'risk-security',
                description: 'Security vulnerabilities could be introduced',
                level: 'high',
                affectedPhases: phases.filter(p => p.id.includes('backend')).map(p => p.id),
                probability: 35,
                impact: 95,
            };
            risks.push(risk);
            mitigations.push({
                forRisk: risk.id,
                strategy: 'OWASP compliance checks, security scan, penetration testing',
                implementIn: 'phase-quality',
                effectiveness: 90,
            });
        }
        return {
            level,
            risks,
            mitigations,
        };
    }
}
export default PlanGenerator;
//# sourceMappingURL=plan-generator.js.map