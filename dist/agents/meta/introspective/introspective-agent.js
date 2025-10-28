/**
 * IntrospectiveAgent - Testable without mocks
 * Uses dependency injection for real testing
 */
import { BaseAgent } from '../../core/base-agent.js';
import { VERSATILLogger } from '../../../utils/logger.js';
import { PerformanceMonitor } from '../../../analytics/performance-monitor.js';
// Real implementations for production
export class RealFileSystemProvider {
    async fileExists(path) {
        try {
            const fs = await import('fs-extra');
            await fs.access(path);
            return true;
        }
        catch {
            return false;
        }
    }
    async readFile(path) {
        const fs = await import('fs-extra');
        return await fs.readFile(path, 'utf-8');
    }
}
export class RealCommandExecutor {
    async execute(command, timeoutMs) {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Command timeout: ${command}`));
            }, timeoutMs);
            execAsync(command)
                .then(result => {
                clearTimeout(timeout);
                resolve(result);
            })
                .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
}
// Test implementations (lightweight, real behavior)
export class TestFileSystemProvider {
    constructor(initialFiles = {}) {
        this.files = new Map();
        for (const [path, content] of Object.entries(initialFiles)) {
            this.files.set(path, content);
        }
    }
    async fileExists(path) {
        return this.files.has(path);
    }
    async readFile(path) {
        const content = this.files.get(path);
        if (content === undefined) {
            throw new Error(`File not found: ${path}`);
        }
        return content;
    }
    addFile(path, content) {
        this.files.set(path, content);
    }
}
export class TestCommandExecutor {
    constructor() {
        this.responses = new Map();
    }
    async execute(command, timeoutMs) {
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 10));
        const response = this.responses.get(command) || { stdout: '', stderr: '', delay: 10 };
        // Simulate actual command delay if configured
        if (response.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, response.delay));
        }
        // If stderr is present, throw error (simulating command failure)
        if (response.stderr) {
            const error = new Error(`Command failed: ${command}`);
            error.stdout = response.stdout;
            error.stderr = response.stderr;
            throw error;
        }
        return { stdout: response.stdout, stderr: response.stderr };
    }
    setResponse(command, stdout, stderr = '', delay = 10) {
        this.responses.set(command, { stdout, stderr, delay });
    }
}
/**
 * IntrospectiveAgent - Testable implementation
 */
export class IntrospectiveAgent extends BaseAgent {
    constructor(fileSystem, commandExecutor) {
        super();
        this.name = 'IntrospectiveAgent';
        this.id = 'introspective-agent';
        this.specialization = 'Self-Monitoring & Optimization Controller';
        this.systemPrompt = 'Autonomous agent responsible for framework introspection, optimization, and self-improvement';
        this.learningInsights = new Map();
        this.improvementHistory = [];
        this.logger = VERSATILLogger.getInstance();
        this.performanceMonitor = new PerformanceMonitor();
        // Use injected or default to real implementations
        this.fileSystem = fileSystem || new RealFileSystemProvider();
        this.commandExecutor = commandExecutor || new RealCommandExecutor();
        this.logger.info('IntrospectiveAgent initialized with tool-based controller architecture', {
            features: [
                'Framework Health Monitoring',
                'Performance Optimization Engine',
                'Pattern Recognition System',
                'Meta-Learning Capabilities',
                'Autonomous Improvement Engine'
            ]
        }, 'IntrospectiveAgent');
    }
    /**
     * Main activation method
     */
    async activate(context) {
        const startTime = Date.now();
        this.logger.info('🔍 Starting introspective analysis using tool controllers', {
            context: context.trigger || 'unknown'
        }, 'IntrospectiveAgent');
        try {
            // Perform analysis
            const healthAssessment = await this.assessFrameworkHealth();
            const performanceMetrics = await this.analyzePerformance();
            const patterns = await this.discoverPatterns(context);
            const learningInsights = await this.performMetaLearning();
            const confidence = this.calculateConfidence(healthAssessment, performanceMetrics);
            const suggestions = this.generateSuggestions(healthAssessment, performanceMetrics, patterns, learningInsights);
            const handoffTo = this.determineHandoffsFromAnalysis(suggestions);
            const priority = this.calculatePriorityFromSuggestions(suggestions);
            const executionTime = Date.now() - startTime;
            this.logger.info('✅ Introspective analysis completed', {
                executionTime: `${executionTime}ms`,
                improvements: suggestions.length,
                confidence
            }, 'IntrospectiveAgent');
            return {
                agentId: this.id,
                message: `Introspective analysis completed with ${suggestions.length} insights`,
                suggestions,
                priority,
                handoffTo,
                context: {
                    confidence,
                    introspectionTime: executionTime,
                    healthScore: healthAssessment.score,
                    performanceMetrics,
                    patterns: patterns.length,
                    learningInsights: learningInsights.length,
                    // Additional fields for test compatibility
                    patternsDiscovered: patterns.length,
                    learningUpdates: learningInsights.length,
                    optimizationsApplied: suggestions.filter(s => s.autoFixable).length,
                    qualityGates: {
                        config: healthAssessment.score >= 0.8,
                        security: healthAssessment.vulnerabilities === 0,
                        performance: performanceMetrics.buildTime > 0 && performanceMetrics.buildTime < 30000,
                        overall: confidence >= 0.7
                    }
                }
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('❌ Introspective analysis failed', {
                error: errorMessage,
                context: context.trigger || 'unknown'
            }, 'IntrospectiveAgent');
            return {
                agentId: this.id,
                message: `Framework encountered errors and requires investigation: ${errorMessage}`,
                suggestions: [{
                        type: 'error-recovery',
                        message: 'Run framework recovery: npm run recover',
                        priority: 'high'
                    }, {
                        type: 'configuration-check',
                        message: 'Verify framework configuration and dependencies',
                        priority: 'medium'
                    }],
                priority: 'low',
                handoffTo: [],
                context: {
                    confidence: 0.1,
                    error: true,
                    errorMessage
                }
            };
        }
    }
    /**
     * Assess framework health
     */
    async assessFrameworkHealth() {
        const configFiles = {
            'package.json': false,
            'tsconfig.json': false,
            'jest.config.cjs': false,
            '.versatil-project.json': false
        };
        const issues = [];
        // Check configuration files using injected file system
        for (const file of Object.keys(configFiles)) {
            const exists = await this.fileSystem.fileExists(file);
            configFiles[file] = exists;
            if (!exists) {
                issues.push(`Missing configuration file: ${file}`);
            }
        }
        // Check for vulnerabilities using injected command executor
        let vulnerabilities = 0;
        try {
            const auditResult = await this.commandExecutor.execute('npm audit --json', 5000);
            const auditData = JSON.parse(auditResult.stdout);
            vulnerabilities = auditData.metadata?.vulnerabilities?.total || 0;
        }
        catch (error) {
            // npm audit returns non-zero for vulnerabilities, try parsing anyway
            if (error instanceof Error && 'stdout' in error) {
                try {
                    const auditData = JSON.parse(error.stdout);
                    vulnerabilities = auditData.metadata?.vulnerabilities?.total || 0;
                }
                catch {
                    // Parsing failed, assume no vulnerabilities
                }
            }
        }
        // Calculate health score
        const configScore = Object.values(configFiles).filter(Boolean).length / Object.keys(configFiles).length;
        const securityScore = vulnerabilities === 0 ? 1 : Math.max(0, 1 - (vulnerabilities * 0.1));
        const healthScore = (configScore * 0.6 + securityScore * 0.4);
        return {
            score: healthScore,
            configFiles,
            dependencies: { total: 0, outdated: 0 },
            vulnerabilities,
            issues
        };
    }
    /**
     * Analyze performance
     */
    async analyzePerformance() {
        const metrics = {
            buildTime: 0,
            testTime: 0,
            lintTime: 0,
            memoryUsage: process.memoryUsage()
        };
        // Measure build time
        try {
            const buildStart = Date.now();
            await this.commandExecutor.execute('npm run build', 60000);
            metrics.buildTime = Date.now() - buildStart;
        }
        catch {
            metrics.buildTime = -1;
        }
        // Measure test time
        try {
            const testStart = Date.now();
            await this.commandExecutor.execute('npm test -- --silent', 30000);
            metrics.testTime = Date.now() - testStart;
        }
        catch {
            metrics.testTime = -1;
        }
        // Measure lint time
        try {
            const lintStart = Date.now();
            await this.commandExecutor.execute('npm run lint', 15000);
            metrics.lintTime = Date.now() - lintStart;
        }
        catch {
            metrics.lintTime = -1;
        }
        return metrics;
    }
    /**
     * Discover patterns
     */
    async discoverPatterns(context) {
        const patterns = [];
        if (context.content && context.content.includes('test')) {
            patterns.push({
                type: 'test-coverage',
                description: 'Test file detected - consider checking coverage metrics',
                confidence: 0.9,
                impact: 'high',
                actionable: true
            });
        }
        if (context.content && (context.content.includes('performance') || context.content.includes('optimization'))) {
            patterns.push({
                type: 'performance-focus',
                description: 'Performance-related code detected - monitoring for optimization opportunities',
                confidence: 0.85,
                impact: 'high',
                actionable: true
            });
        }
        return patterns;
    }
    /**
     * Perform meta-learning
     */
    async performMetaLearning() {
        const insights = [];
        if (this.improvementHistory.length > 0) {
            const successRate = this.improvementHistory.filter(i => i.success).length / this.improvementHistory.length;
            if (successRate < 0.5) {
                insights.push({
                    type: 'meta-learning',
                    description: 'Low success rate in past improvements - review optimization strategy',
                    confidence: 0.7,
                    impact: 'medium',
                    actionable: true
                });
            }
        }
        if (this.learningInsights.size > 10) {
            insights.push({
                type: 'meta-learning',
                description: `Accumulated ${this.learningInsights.size} insights - ready for pattern synthesis`,
                confidence: 0.9,
                impact: 'high',
                actionable: true
            });
        }
        return insights;
    }
    calculateConfidence(health, performance) {
        let confidence = 0.5;
        // Health score is heavily weighted (40%)
        confidence += health.score * 0.4;
        // Performance score (30%) - penalize negative values (command failures)
        const perfScore = ((performance.buildTime > 0 && performance.buildTime < 30000 ? 0.33 : performance.buildTime === -1 ? -0.1 : 0) +
            (performance.testTime > 0 && performance.testTime < 15000 ? 0.33 : performance.testTime === -1 ? -0.1 : 0) +
            (performance.lintTime > 0 && performance.lintTime < 5000 ? 0.34 : performance.lintTime === -1 ? -0.1 : 0));
        confidence += perfScore * 0.3;
        const memoryMB = performance.memoryUsage.heapUsed / 1024 / 1024;
        const memoryScore = memoryMB < 100 ? 1 : memoryMB < 200 ? 0.7 : 0.3;
        confidence += memoryScore * 0.2;
        return Math.max(0, Math.min(1, confidence));
    }
    generateSuggestions(health, performance, patterns, learningInsights) {
        const suggestions = [];
        if (health.vulnerabilities > 0) {
            suggestions.push({
                type: 'security',
                message: `Fix ${health.vulnerabilities} security vulnerabilities`,
                priority: 'critical'
            });
        }
        if (health.issues.length > 0) {
            suggestions.push({
                type: 'configuration',
                message: 'Resolve configuration issues: ' + health.issues.join(', '),
                priority: 'high'
            });
        }
        if (performance.buildTime > 30000) {
            suggestions.push({
                type: 'performance',
                message: 'Build time optimization recommended - consider build time optimization strategies',
                priority: 'medium'
            });
        }
        const memoryMB = performance.memoryUsage.heapUsed / 1024 / 1024;
        if (memoryMB > 150) {
            suggestions.push({
                type: 'performance',
                message: 'High memory usage detected - implement memory optimization',
                priority: 'medium'
            });
        }
        for (const pattern of patterns) {
            if (pattern.actionable) {
                suggestions.push({
                    type: pattern.type,
                    message: pattern.description,
                    priority: pattern.impact === 'high' ? 'high' : 'medium'
                });
            }
        }
        return suggestions;
    }
    determineHandoffsFromAnalysis(suggestions) {
        const handoffs = [];
        if (suggestions.some(s => s.type === 'security'))
            handoffs.push('security-sam');
        if (suggestions.some(s => s.type === 'performance'))
            handoffs.push('enhanced-marcus');
        if (suggestions.some(s => s.type === 'test-coverage'))
            handoffs.push('enhanced-maria');
        return handoffs;
    }
    calculatePriorityFromSuggestions(suggestions) {
        if (suggestions.some(s => s.priority === 'critical'))
            return 'critical';
        if (suggestions.some(s => s.priority === 'high'))
            return 'high';
        if (suggestions.some(s => s.priority === 'medium'))
            return 'medium';
        return 'low';
    }
    // Public API methods
    async triggerIntrospection() {
        const health = await this.assessFrameworkHealth();
        const performance = await this.analyzePerformance();
        const patterns = await this.discoverPatterns({ trigger: 'manual-introspection' });
        const learningInsights = await this.performMetaLearning();
        const confidence = this.calculateConfidence(health, performance);
        const suggestions = this.generateSuggestions(health, performance, patterns, learningInsights);
        return {
            insights: [...patterns, ...learningInsights],
            recommendations: suggestions.map(s => ({
                type: s.type,
                message: s.message,
                priority: s.priority,
                estimatedEffort: 'medium',
                autoFixable: false
            })),
            timestamp: Date.now(),
            confidence,
            healthScore: health.score
        };
    }
    getLearningInsights() {
        return this.learningInsights;
    }
    getImprovementHistory() {
        return this.improvementHistory;
    }
    // Common methods from earlier
    calculatePriority(issues) {
        if (!issues || issues.length === 0)
            return 0;
        const severities = issues.map(i => i.severity === 'critical' ? 4 :
            i.severity === 'high' ? 3 :
                i.severity === 'medium' ? 2 : 1);
        return Math.max(...severities);
    }
    determineHandoffs(issues) {
        const handoffs = [];
        if (!issues)
            return handoffs;
        const hasSecurityIssue = issues.some(i => i.type === 'security');
        const hasPerformanceIssue = issues.some(i => i.type === 'performance');
        const hasUIIssue = issues.some(i => i.type === 'ui' || i.type === 'accessibility');
        if (hasSecurityIssue)
            handoffs.push('security-sam');
        if (hasPerformanceIssue)
            handoffs.push('enhanced-marcus');
        if (hasUIIssue)
            handoffs.push('enhanced-james');
        return handoffs;
    }
    generateActionableRecommendations(issues) {
        if (!issues || issues.length === 0)
            return [];
        return issues.map(issue => {
            if (issue.type === 'security') {
                return `Fix security issue: ${issue.message || 'Security vulnerability detected'}`;
            }
            if (issue.type === 'performance') {
                return `Optimize performance: ${issue.message || 'Performance issue detected'}`;
            }
            return `Address issue: ${issue.message || issue.description || 'Issue detected'}`;
        });
    }
    generateEnhancedReport(issues, metadata = {}) {
        return {
            summary: {
                totalIssues: issues?.length || 0,
                critical: issues?.filter(i => i.severity === 'critical').length || 0,
                high: issues?.filter(i => i.severity === 'high').length || 0,
                medium: issues?.filter(i => i.severity === 'medium').length || 0,
                low: issues?.filter(i => i.severity === 'low').length || 0
            },
            issues: issues || [],
            recommendations: this.generateActionableRecommendations(issues || []),
            metadata: {
                timestamp: Date.now(),
                ...metadata
            }
        };
    }
    getScoreEmoji(score) {
        if (score >= 90)
            return '🟢';
        if (score >= 75)
            return '🟡';
        if (score >= 60)
            return '🟠';
        return '🔴';
    }
    extractAgentName(text) {
        const match = text.match(/@(\w+)/);
        return match ? match[1] : '';
    }
    analyzeCrossFileConsistency(context) {
        return {
            [context.filePath || 'unknown']: context.content || ''
        };
    }
    hasConfigurationInconsistencies(context) {
        return false;
    }
}
//# sourceMappingURL=introspective-agent.js.map