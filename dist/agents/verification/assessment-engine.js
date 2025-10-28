#!/usr/bin/env ts-node
/**
 * Assessment Engine for Victor-Verifier
 *
 * PURPOSE:
 * Extends verification (ground truth checking) with quality assessment (standards checking)
 *
 * DISTINCTION:
 * - Verification: "Did file get created?" → YES/NO
 * - Assessment: "Does file meet quality standards?" → PASS/FAIL (coverage ≥80%, no vulnerabilities)
 *
 * RESEARCH:
 * Industry research (2025): "Before trusting an AI agent's work, auditors must conduct
 * quality checks just as they would with a junior team member"
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
// ============================================================================
// ASSESSMENT ENGINE
// ============================================================================
export class AssessmentEngine {
    constructor(workingDir, configPath) {
        this.workingDir = workingDir;
        // Load assessment config
        const defaultConfigPath = join(workingDir, '.versatil/verification/assessment-config.json');
        const finalConfigPath = configPath || defaultConfigPath;
        if (existsSync(finalConfigPath)) {
            this.config = JSON.parse(readFileSync(finalConfigPath, 'utf-8'));
        }
        else {
            // Fallback to default config
            this.config = this.getDefaultConfig();
        }
    }
    /**
     * Step 1: Detect if a claim needs quality assessment beyond verification
     */
    needsAssessment(claim) {
        // Always assess security-related changes
        if (this.matchesPattern(claim, 'security'))
            return true;
        // Always assess API changes
        if (this.matchesPattern(claim, 'api'))
            return true;
        // Always assess UI changes for accessibility/performance
        if (this.matchesPattern(claim, 'ui'))
            return true;
        // Assess test files for coverage
        if (this.matchesPattern(claim, 'test'))
            return true;
        // Assess database changes for security
        if (this.matchesPattern(claim, 'database'))
            return true;
        return false;
    }
    /**
     * Step 2: Plan which assessments to run based on claim context
     */
    planAssessment(claim) {
        const assessments = [];
        let priority = 'medium';
        let reason = '';
        // Security pattern matching
        if (this.matchesPattern(claim, 'security')) {
            const securityRule = this.config.assessmentRules.security;
            assessments.push(...securityRule.assessments);
            priority = securityRule.priority;
            reason = 'Security-sensitive code detected';
        }
        // API pattern matching
        if (this.matchesPattern(claim, 'api')) {
            const apiRule = this.config.assessmentRules.api;
            assessments.push(...apiRule.assessments);
            if (priority !== 'critical')
                priority = apiRule.priority;
            reason = reason ? `${reason}, API endpoint modified` : 'API endpoint modified';
        }
        // UI pattern matching
        if (this.matchesPattern(claim, 'ui')) {
            const uiRule = this.config.assessmentRules.ui;
            assessments.push(...uiRule.assessments);
            reason = reason ? `${reason}, UI component changed` : 'UI component changed';
        }
        // Test pattern matching
        if (this.matchesPattern(claim, 'test')) {
            const testRule = this.config.assessmentRules.test;
            assessments.push(...testRule.assessments);
            reason = reason ? `${reason}, Test coverage needs validation` : 'Test coverage needs validation';
        }
        // Database pattern matching
        if (this.matchesPattern(claim, 'database')) {
            const dbRule = this.config.assessmentRules.database;
            assessments.push(...dbRule.assessments);
            if (priority !== 'critical')
                priority = dbRule.priority;
            reason = reason ? `${reason}, Database schema changed` : 'Database schema changed';
        }
        // Deduplicate assessments
        const uniqueAssessments = this.deduplicateAssessments(assessments);
        // Estimate duration
        const estimatedDuration = this.estimateDuration(uniqueAssessments);
        return {
            claim,
            needsAssessment: uniqueAssessments.length > 0,
            reason,
            assessments: uniqueAssessments,
            priority,
            estimatedDuration
        };
    }
    /**
     * Step 3: Execute assessments (Phase 2 - not implemented yet)
     *
     * PHASE 1: Just log assessment requirements
     * PHASE 2: Actually execute tools and parse outputs
     */
    async executeAssessment(plan) {
        // Phase 1: Return placeholder results
        return plan.assessments.map(assessment => ({
            assessment,
            executed: false,
            passed: false,
            issues: [],
            output: '[Phase 1] Assessment planned but not executed',
            duration: '0s',
            timestamp: new Date().toISOString()
        }));
    }
    // ============================================================================
    // PRIVATE HELPERS
    // ============================================================================
    matchesPattern(claim, patternType) {
        const rule = this.config.assessmentRules[patternType];
        if (!rule)
            return false;
        const textToMatch = `${claim.text} ${claim.filePath || ''} ${claim.context || ''}`.toLowerCase();
        return rule.patterns.some(pattern => textToMatch.includes(pattern.toLowerCase()));
    }
    deduplicateAssessments(assessments) {
        const seen = new Set();
        const unique = [];
        for (const assessment of assessments) {
            const key = `${assessment.type}-${assessment.tool}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(assessment);
            }
        }
        return unique;
    }
    estimateDuration(assessments) {
        let totalSeconds = 0;
        for (const assessment of assessments) {
            switch (assessment.tool) {
                case 'semgrep':
                case 'bandit':
                case 'safety':
                    totalSeconds += 15; // Security scans: ~15s
                    break;
                case 'jest':
                    totalSeconds += 30; // Test coverage: ~30s
                    break;
                case 'lighthouse':
                    totalSeconds += 45; // Performance audit: ~45s
                    break;
                case 'axe-core':
                    totalSeconds += 10; // Accessibility: ~10s
                    break;
                case 'eslint':
                case 'api-linter':
                    totalSeconds += 5; // Linting: ~5s
                    break;
            }
        }
        if (totalSeconds < 60)
            return `${totalSeconds}s`;
        return `${Math.ceil(totalSeconds / 60)}m`;
    }
    getDefaultConfig() {
        return {
            assessmentRules: {
                security: {
                    patterns: ['auth', 'login', 'password', 'token', 'jwt', 'session', 'crypto', 'hash', 'encrypt', 'credential', 'secret', 'api-key', 'oauth', 'permission', 'role', 'access-control'],
                    assessments: [
                        {
                            type: 'Security',
                            tool: 'semgrep',
                            command: 'npx semgrep scan --config=auto --severity=ERROR --severity=WARNING',
                            threshold: 0,
                            mandatory: true,
                            reason: 'Security vulnerabilities must be zero for authentication code'
                        },
                        {
                            type: 'TestCoverage',
                            tool: 'jest',
                            command: 'npm run test:coverage -- --collectCoverageFrom="**/{auth,login,session}/**/*.{ts,js}"',
                            threshold: 90,
                            mandatory: true,
                            reason: 'Security code requires 90%+ test coverage'
                        }
                    ],
                    priority: 'critical'
                },
                api: {
                    patterns: ['api', 'route', 'endpoint', 'controller', 'handler', 'request', 'response', 'http', 'rest', 'graphql', 'mutation', 'query', 'resolver'],
                    assessments: [
                        {
                            type: 'Security',
                            tool: 'semgrep',
                            command: 'npx semgrep scan --config=auto --severity=ERROR',
                            threshold: 0,
                            mandatory: true,
                            reason: 'API endpoints must have zero critical vulnerabilities'
                        },
                        {
                            type: 'TestCoverage',
                            tool: 'jest',
                            command: 'npm run test:coverage -- --testPathPattern=".*\\.(test|spec)\\.(ts|js)"',
                            threshold: 80,
                            mandatory: true,
                            reason: 'API endpoints require 80%+ test coverage'
                        },
                        {
                            type: 'APICompliance',
                            tool: 'api-linter',
                            command: 'npx @redocly/cli lint openapi.yaml',
                            mandatory: false,
                            reason: 'Validate OpenAPI spec compliance'
                        }
                    ],
                    priority: 'high'
                },
                ui: {
                    patterns: ['component', 'jsx', 'tsx', 'vue', 'svelte', 'react', 'angular', 'ui', 'frontend', 'view', 'page', 'layout', 'button', 'form', 'input', 'modal'],
                    assessments: [
                        {
                            type: 'Accessibility',
                            tool: 'axe-core',
                            command: 'npx @axe-core/cli --exit',
                            threshold: 90,
                            mandatory: true,
                            reason: 'UI components must meet WCAG 2.1 AA standards (90%+ score)'
                        },
                        {
                            type: 'Performance',
                            tool: 'lighthouse',
                            command: 'npx lighthouse --only-categories=performance --quiet --chrome-flags="--headless"',
                            threshold: 90,
                            mandatory: false,
                            reason: 'UI should maintain 90+ performance score'
                        },
                        {
                            type: 'TestCoverage',
                            tool: 'jest',
                            command: 'npm run test:coverage -- --testPathPattern=".*\\.(test|spec)\\.(tsx|jsx)"',
                            threshold: 75,
                            mandatory: false,
                            reason: 'UI components should have 75%+ test coverage'
                        }
                    ],
                    priority: 'high'
                },
                test: {
                    patterns: ['test', 'spec', '.test.', '.spec.', '__tests__', 'jest', 'vitest', 'playwright', 'cypress'],
                    assessments: [
                        {
                            type: 'TestCoverage',
                            tool: 'jest',
                            command: 'npm run test:coverage',
                            threshold: 80,
                            mandatory: true,
                            reason: 'Overall test coverage must be ≥80%'
                        },
                        {
                            type: 'CodeQuality',
                            tool: 'eslint',
                            command: 'npx eslint --max-warnings=0',
                            mandatory: false,
                            reason: 'Test code should follow linting rules'
                        }
                    ],
                    priority: 'medium'
                },
                database: {
                    patterns: ['migration', 'schema', 'database', 'db', 'sql', 'prisma', 'typeorm', 'sequelize', 'model', 'entity', 'rls', 'policy'],
                    assessments: [
                        {
                            type: 'Security',
                            tool: 'semgrep',
                            command: 'npx semgrep scan --config=auto --severity=ERROR',
                            threshold: 0,
                            mandatory: true,
                            reason: 'Database migrations must have zero SQL injection vulnerabilities'
                        },
                        {
                            type: 'TestCoverage',
                            tool: 'jest',
                            command: 'npm run test:coverage -- --testPathPattern=".*database.*\\.(test|spec)\\.(ts|js)"',
                            threshold: 85,
                            mandatory: true,
                            reason: 'Database layer requires 85%+ test coverage'
                        }
                    ],
                    priority: 'critical'
                }
            },
            thresholds: {
                testCoverage: 80,
                securityVulnerabilities: 0,
                performanceScore: 90,
                accessibilityScore: 90
            }
        };
    }
}
// ============================================================================
// EXPORTS
// ============================================================================
export default AssessmentEngine;
//# sourceMappingURL=assessment-engine.js.map