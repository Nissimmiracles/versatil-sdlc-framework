/**
 * @fileoverview Plan Mode Detector - Identifies complex tasks requiring Plan Mode
 *
 * Analyzes user requests to determine if Plan Mode should be activated.
 * Complex tasks requiring multi-agent coordination get automatic Plan Mode activation.
 *
 * @module workflows/plan-mode-detector
 * @version 6.5.0
 */
import { VERSATILLogger } from '../utils/logger.js';
// ============================================================================
// PLAN MODE DETECTOR IMPLEMENTATION
// ============================================================================
export class PlanModeDetector {
    constructor() {
        /** Complexity weights for scoring */
        this.complexityWeights = {
            'multi-agent': 25,
            'long-horizon': 20,
            'complex-refactor': 18,
            'full-stack': 22,
            'database-migration': 20,
            'integration': 15,
            'security-critical': 20,
            'performance-critical': 15,
            'multi-phase': 18,
            'high-risk': 25,
        };
        /** Threshold for Plan Mode activation (0-100) */
        this.activationThreshold = 60;
        this.logger = new VERSATILLogger('PlanModeDetector');
    }
    // ========================================================================
    // DETECTION API
    // ========================================================================
    /**
     * Detect if Plan Mode should be activated for a given task
     */
    async detectPlanMode(context) {
        this.logger.info('Analyzing task for Plan Mode', {
            requestLength: context.request.length
        });
        // Detect all complexity indicators
        const indicators = this.detectComplexityIndicators(context);
        // Calculate confidence score
        const confidence = this.calculateConfidence(indicators);
        // Estimate task duration
        const estimatedDuration = this.estimateDuration(context, indicators);
        // Identify required agents
        const involvedAgents = this.identifyRequiredAgents(context, indicators);
        // Assess risk level
        const riskLevel = this.assessRiskLevel(indicators);
        // Determine if Plan Mode should activate
        const shouldActivate = confidence >= this.activationThreshold;
        // Generate reasoning
        const reasoning = this.generateReasoning(shouldActivate, confidence, indicators, estimatedDuration, involvedAgents);
        const detection = {
            shouldActivate,
            confidence,
            reasoning,
            complexityIndicators: indicators,
            estimatedDuration,
            agentsRequired: involvedAgents.length,
            involvedAgents,
            riskLevel,
        };
        this.logger.info('Plan Mode detection complete', {
            shouldActivate,
            confidence,
            agentsRequired: involvedAgents.length,
            estimatedDuration,
        });
        return detection;
    }
    // ========================================================================
    // COMPLEXITY DETECTION
    // ========================================================================
    /**
     * Detect all complexity indicators from the task
     */
    detectComplexityIndicators(context) {
        const indicators = [];
        const request = context.request.toLowerCase();
        // Multi-agent detection
        const agentKeywords = this.countAgentRequirements(request, context);
        if (agentKeywords >= 3) {
            indicators.push({
                type: 'multi-agent',
                description: `Requires ${agentKeywords}+ agents for coordination`,
                weight: this.complexityWeights['multi-agent'],
                evidence: this.extractEvidenceForAgents(request),
            });
        }
        // Long-horizon detection
        const durationKeywords = ['complete', 'full', 'entire', 'comprehensive', 'end-to-end'];
        if (durationKeywords.some(kw => request.includes(kw))) {
            indicators.push({
                type: 'long-horizon',
                description: 'Task involves comprehensive implementation (estimated >30 minutes)',
                weight: this.complexityWeights['long-horizon'],
                evidence: durationKeywords.filter(kw => request.includes(kw)).join(', '),
            });
        }
        // Complex refactoring detection
        const refactorKeywords = ['refactor', 'restructure', 'reorganize', 'migrate'];
        const multiFileKeywords = ['across', 'multiple', 'all', 'entire codebase'];
        if (refactorKeywords.some(kw => request.includes(kw)) &&
            multiFileKeywords.some(kw => request.includes(kw))) {
            indicators.push({
                type: 'complex-refactor',
                description: 'Multi-file refactoring across codebase',
                weight: this.complexityWeights['complex-refactor'],
                evidence: 'Refactoring keywords + multi-file indicators detected',
            });
        }
        // Full-stack detection
        const frontendKeywords = ['ui', 'component', 'frontend', 'react', 'vue', 'interface'];
        const backendKeywords = ['api', 'backend', 'server', 'endpoint', 'service'];
        const databaseKeywords = ['database', 'schema', 'migration', 'table', 'query'];
        const hasFrontend = frontendKeywords.some(kw => request.includes(kw));
        const hasBackend = backendKeywords.some(kw => request.includes(kw));
        const hasDatabase = databaseKeywords.some(kw => request.includes(kw));
        const layerCount = [hasFrontend, hasBackend, hasDatabase].filter(Boolean).length;
        if (layerCount >= 2) {
            indicators.push({
                type: 'full-stack',
                description: `Full-stack feature (${layerCount} layers: ${[hasFrontend && 'Frontend', hasBackend && 'Backend', hasDatabase && 'Database']
                    .filter(Boolean)
                    .join(', ')})`,
                weight: this.complexityWeights['full-stack'],
                evidence: `Detected ${layerCount} architectural layers`,
            });
        }
        // Database migration detection
        if (hasDatabase && (hasBackend || hasFrontend)) {
            indicators.push({
                type: 'database-migration',
                description: 'Database schema changes with API/UI updates',
                weight: this.complexityWeights['database-migration'],
                evidence: 'Database + API/Frontend keywords detected',
            });
        }
        // Third-party integration detection
        const integrationKeywords = ['integrate', 'oauth', 'stripe', 'payment', 'auth', 'sso'];
        if (integrationKeywords.some(kw => request.includes(kw))) {
            indicators.push({
                type: 'integration',
                description: 'Third-party service integration required',
                weight: this.complexityWeights['integration'],
                evidence: integrationKeywords.filter(kw => request.includes(kw)).join(', '),
            });
        }
        // Security-critical detection
        const securityKeywords = ['auth', 'authentication', 'authorization', 'security', 'payment', 'credentials'];
        if (securityKeywords.some(kw => request.includes(kw))) {
            indicators.push({
                type: 'security-critical',
                description: 'Security-sensitive implementation',
                weight: this.complexityWeights['security-critical'],
                evidence: securityKeywords.filter(kw => request.includes(kw)).join(', '),
            });
        }
        // Performance-critical detection
        const performanceKeywords = ['optimize', 'performance', 'speed', 'fast', 'cache', 'scale'];
        if (performanceKeywords.some(kw => request.includes(kw))) {
            indicators.push({
                type: 'performance-critical',
                description: 'Performance optimization required',
                weight: this.complexityWeights['performance-critical'],
                evidence: performanceKeywords.filter(kw => request.includes(kw)).join(', '),
            });
        }
        // Multi-phase detection
        const phaseKeywords = ['first', 'then', 'after', 'finally', 'step', 'phase'];
        const phaseCount = request.split(/\n|[.,;]/).filter(line => phaseKeywords.some(kw => line.includes(kw))).length;
        if (phaseCount >= 3) {
            indicators.push({
                type: 'multi-phase',
                description: `Multi-phase task (${phaseCount} sequential steps detected)`,
                weight: this.complexityWeights['multi-phase'],
                evidence: `${phaseCount} sequential phases identified`,
            });
        }
        // High-risk detection
        const highRiskKeywords = ['production', 'deploy', 'breaking', 'critical', 'urgent'];
        if (highRiskKeywords.some(kw => request.includes(kw))) {
            indicators.push({
                type: 'high-risk',
                description: 'High-risk operation (production/critical)',
                weight: this.complexityWeights['high-risk'],
                evidence: highRiskKeywords.filter(kw => request.includes(kw)).join(', '),
            });
        }
        return indicators;
    }
    /**
     * Count how many agents would be required
     */
    countAgentRequirements(request, context) {
        let count = 0;
        const agentMap = {
            'alex-ba': ['requirement', 'user story', 'acceptance criteria', 'analyze'],
            'dana-database': ['database', 'schema', 'migration', 'sql', 'query'],
            'marcus-backend': ['api', 'backend', 'server', 'endpoint', 'security'],
            'james-frontend': ['ui', 'component', 'frontend', 'react', 'vue', 'interface'],
            'maria-qa': ['test', 'quality', 'coverage', 'validation'],
            'sarah-pm': ['plan', 'coordinate', 'milestone'],
            'dr-ai-ml': ['ml', 'ai', 'model', 'training'],
        };
        for (const [agent, keywords] of Object.entries(agentMap)) {
            if (keywords.some(kw => request.includes(kw))) {
                count++;
            }
        }
        return count;
    }
    /**
     * Extract evidence for multi-agent requirement
     */
    extractEvidenceForAgents(request) {
        const matches = [];
        const agentKeywordMap = {
            'Frontend': ['ui', 'component', 'interface'],
            'Backend': ['api', 'server', 'endpoint'],
            'Database': ['database', 'schema', 'migration'],
            'Testing': ['test', 'quality', 'coverage'],
            'Requirements': ['requirement', 'user story'],
        };
        for (const [area, keywords] of Object.entries(agentKeywordMap)) {
            if (keywords.some(kw => request.includes(kw))) {
                matches.push(area);
            }
        }
        return matches.join(' + ') + ' coordination needed';
    }
    // ========================================================================
    // SCORING & ESTIMATION
    // ========================================================================
    /**
     * Calculate confidence score from indicators
     */
    calculateConfidence(indicators) {
        if (indicators.length === 0)
            return 0;
        // Sum weighted scores
        const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
        // Normalize to 0-100 scale (max possible weight is sum of all weights)
        const maxPossibleWeight = Object.values(this.complexityWeights).reduce((a, b) => a + b, 0);
        const confidence = Math.min(100, (totalWeight / maxPossibleWeight) * 100);
        return Math.round(confidence);
    }
    /**
     * Estimate task duration in minutes
     */
    estimateDuration(context, indicators) {
        let baseDuration = 15; // Base 15 minutes
        // Add time based on indicators
        for (const indicator of indicators) {
            switch (indicator.type) {
                case 'multi-agent':
                    baseDuration += 30; // +30 min for coordination
                    break;
                case 'long-horizon':
                    baseDuration += 45; // +45 min for comprehensive tasks
                    break;
                case 'complex-refactor':
                    baseDuration += 40; // +40 min for refactoring
                    break;
                case 'full-stack':
                    baseDuration += 60; // +60 min for full-stack
                    break;
                case 'database-migration':
                    baseDuration += 35; // +35 min for migrations
                    break;
                case 'integration':
                    baseDuration += 30; // +30 min for integrations
                    break;
                case 'security-critical':
                    baseDuration += 25; // +25 min for security review
                    break;
                case 'performance-critical':
                    baseDuration += 30; // +30 min for optimization
                    break;
                case 'multi-phase':
                    baseDuration += 20; // +20 min per phase coordination
                    break;
                case 'high-risk':
                    baseDuration += 15; // +15 min for extra validation
                    break;
            }
        }
        // Apply user history multiplier if available
        if (context.userHistory?.averageTaskDuration) {
            const userMultiplier = context.userHistory.averageTaskDuration / 60; // Convert to multiplier
            baseDuration *= userMultiplier;
        }
        return Math.round(baseDuration);
    }
    /**
     * Identify which agents will be required
     */
    identifyRequiredAgents(context, indicators) {
        const agents = new Set();
        const request = context.request.toLowerCase();
        // Always include Sarah-PM for Plan Mode coordination
        agents.add('sarah-pm');
        // Map complexity types to agents
        const typeToAgent = {
            'multi-agent': ['sarah-pm'], // Already added
            'long-horizon': [],
            'complex-refactor': ['alex-ba', 'maria-qa'],
            'full-stack': ['dana-database', 'marcus-backend', 'james-frontend'],
            'database-migration': ['dana-database', 'marcus-backend'],
            'integration': ['marcus-backend', 'maria-qa'],
            'security-critical': ['marcus-backend', 'maria-qa'],
            'performance-critical': ['marcus-backend', 'james-frontend'],
            'multi-phase': ['alex-ba', 'sarah-pm'],
            'high-risk': ['maria-qa'],
        };
        // Add agents based on detected indicators
        for (const indicator of indicators) {
            const relatedAgents = typeToAgent[indicator.type] || [];
            relatedAgents.forEach(agent => agents.add(agent));
        }
        // Add specific agents based on keywords
        if (request.includes('requirement') || request.includes('user story')) {
            agents.add('alex-ba');
        }
        if (request.includes('database') || request.includes('schema')) {
            agents.add('dana-database');
        }
        if (request.includes('api') || request.includes('backend')) {
            agents.add('marcus-backend');
        }
        if (request.includes('ui') || request.includes('component')) {
            agents.add('james-frontend');
        }
        if (request.includes('test') || request.includes('quality')) {
            agents.add('maria-qa');
        }
        return Array.from(agents);
    }
    /**
     * Assess overall risk level
     */
    assessRiskLevel(indicators) {
        const highRiskTypes = [
            'security-critical',
            'high-risk',
            'database-migration',
            'full-stack',
        ];
        const mediumRiskTypes = [
            'complex-refactor',
            'integration',
            'multi-phase',
            'performance-critical',
        ];
        const hasHighRisk = indicators.some(ind => highRiskTypes.includes(ind.type));
        const hasMediumRisk = indicators.some(ind => mediumRiskTypes.includes(ind.type));
        if (hasHighRisk)
            return 'high';
        if (hasMediumRisk)
            return 'medium';
        return 'low';
    }
    /**
     * Generate human-readable reasoning
     */
    generateReasoning(shouldActivate, confidence, indicators, estimatedDuration, involvedAgents) {
        if (!shouldActivate) {
            return `Simple task detected (${confidence}% confidence). Estimated ${estimatedDuration} minutes. Plan Mode not required.`;
        }
        const reasons = indicators.map(ind => `• ${ind.description}`).join('\n');
        return `Complex task detected (${confidence}% confidence).\n\n` +
            `Complexity Indicators:\n${reasons}\n\n` +
            `Estimated Duration: ${estimatedDuration} minutes\n` +
            `Required Agents: ${involvedAgents.length} (${involvedAgents.join(', ')})\n\n` +
            `Plan Mode recommended for structured multi-phase execution.`;
    }
    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    /**
     * Update activation threshold
     */
    setActivationThreshold(threshold) {
        if (threshold < 0 || threshold > 100) {
            throw new Error('Threshold must be between 0 and 100');
        }
        this.activationThreshold = threshold;
        this.logger.info('Activation threshold updated', { threshold });
    }
    /**
     * Update complexity weight for a specific type
     */
    setComplexityWeight(type, weight) {
        if (weight < 0 || weight > 100) {
            throw new Error('Weight must be between 0 and 100');
        }
        this.complexityWeights[type] = weight;
        this.logger.info('Complexity weight updated', { type, weight });
    }
}
export default PlanModeDetector;
//# sourceMappingURL=plan-mode-detector.js.map