/**
 * Anti-Hallucination Detector
 *
 * Purpose: Detect when Claude's knowledge may be outdated and recommend GitMCP queries
 *
 * How It Works:
 * 1. Monitors agent queries for framework/library mentions
 * 2. Checks if Claude's knowledge cutoff (Jan 2025) is outdated for that framework
 * 3. Calculates hallucination risk score (low/medium/high)
 * 4. Recommends GitMCP query to fetch latest docs if risk is high
 *
 * Part of: Oliver-MCP Orchestrator (Gap 1.1 - Critical)
 */
import { EventEmitter } from 'events';
/**
 * Framework Knowledge Base
 * Maps popular frameworks to their GitHub repos and docs paths
 */
export const FRAMEWORK_KNOWLEDGE_BASE = {
    // Python Frameworks
    'fastapi': {
        name: 'FastAPI',
        repository: 'tiangolo/fastapi',
        docsPath: 'docs/en/docs',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    'django': {
        name: 'Django',
        repository: 'django/django',
        docsPath: 'docs',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'medium'
    },
    'flask': {
        name: 'Flask',
        repository: 'pallets/flask',
        docsPath: 'docs',
        releaseFrequency: 'low',
        knowledgeCutoffRisk: 'low'
    },
    // JavaScript/TypeScript Frameworks
    'react': {
        name: 'React',
        repository: 'facebook/react',
        docsPath: 'docs',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    'next.js': {
        name: 'Next.js',
        repository: 'vercel/next.js',
        docsPath: 'docs',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    'nextjs': {
        name: 'Next.js',
        repository: 'vercel/next.js',
        docsPath: 'docs',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    'vue': {
        name: 'Vue.js',
        repository: 'vuejs/core',
        docsPath: 'packages/vue',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'medium'
    },
    'angular': {
        name: 'Angular',
        repository: 'angular/angular',
        docsPath: 'adev/src/content/docs',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    'svelte': {
        name: 'Svelte',
        repository: 'sveltejs/svelte',
        docsPath: 'documentation',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'medium'
    },
    // Backend Frameworks (Node.js)
    'express': {
        name: 'Express',
        repository: 'expressjs/express',
        releaseFrequency: 'low',
        knowledgeCutoffRisk: 'low'
    },
    'fastify': {
        name: 'Fastify',
        repository: 'fastify/fastify',
        docsPath: 'docs',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'medium'
    },
    'nestjs': {
        name: 'NestJS',
        repository: 'nestjs/nest',
        docsPath: 'sample',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    // Ruby
    'rails': {
        name: 'Ruby on Rails',
        repository: 'rails/rails',
        docsPath: 'guides',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'medium'
    },
    // Go
    'gin': {
        name: 'Gin',
        repository: 'gin-gonic/gin',
        releaseFrequency: 'low',
        knowledgeCutoffRisk: 'low'
    },
    'echo': {
        name: 'Echo',
        repository: 'labstack/echo',
        docsPath: 'website/docs',
        releaseFrequency: 'low',
        knowledgeCutoffRisk: 'low'
    },
    // Java
    'spring boot': {
        name: 'Spring Boot',
        repository: 'spring-projects/spring-boot',
        docsPath: 'spring-boot-project/spring-boot-docs/src/docs/asciidoc',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'medium'
    },
    // Databases
    'supabase': {
        name: 'Supabase',
        repository: 'supabase/supabase',
        docsPath: 'apps/docs/content',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    'prisma': {
        name: 'Prisma',
        repository: 'prisma/prisma',
        docsPath: 'docs',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    // Testing
    'playwright': {
        name: 'Playwright',
        repository: 'microsoft/playwright',
        docsPath: 'docs/src',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    'jest': {
        name: 'Jest',
        repository: 'jestjs/jest',
        docsPath: 'docs',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'low'
    },
    // Build Tools
    'vite': {
        name: 'Vite',
        repository: 'vitejs/vite',
        docsPath: 'docs',
        releaseFrequency: 'high',
        knowledgeCutoffRisk: 'high'
    },
    'webpack': {
        name: 'Webpack',
        repository: 'webpack/webpack',
        docsPath: 'examples',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'low'
    },
    // State Management
    'redux': {
        name: 'Redux',
        repository: 'reduxjs/redux',
        docsPath: 'docs',
        releaseFrequency: 'low',
        knowledgeCutoffRisk: 'low'
    },
    'zustand': {
        name: 'Zustand',
        repository: 'pmndrs/zustand',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'medium'
    },
    'pinia': {
        name: 'Pinia',
        repository: 'vuejs/pinia',
        docsPath: 'packages/docs',
        releaseFrequency: 'medium',
        knowledgeCutoffRisk: 'medium'
    }
};
export class AntiHallucinationDetector extends EventEmitter {
    constructor() {
        super();
        // Claude's knowledge cutoff date
        this.KNOWLEDGE_CUTOFF_DATE = new Date('2025-01-01');
    }
    /**
     * Detect hallucination risk in a query
     */
    async detectHallucinationRisk(query, context) {
        console.log(`🔍 Analyzing query for hallucination risk: "${query.substring(0, 100)}..."`);
        // Step 1: Extract framework mentions from query
        const frameworks = this.extractFrameworkMentions(query);
        if (frameworks.length === 0) {
            // No frameworks mentioned - low risk
            return {
                level: 'low',
                score: 10,
                reasoning: 'No specific frameworks or libraries mentioned. General knowledge query has low risk of hallucination.'
            };
        }
        // Step 2: Calculate risk for each framework
        const frameworkRisks = frameworks.map(fw => this.calculateFrameworkRisk(fw));
        // Step 3: Get highest risk
        const highestRisk = frameworkRisks.reduce((max, risk) => risk.score > max.score ? risk : max);
        // Step 4: Generate recommendation
        const recommendation = this.generateRecommendation(highestRisk, frameworks[0], query);
        const result = {
            level: highestRisk.level,
            score: highestRisk.score,
            reasoning: highestRisk.reasoning,
            recommendation
        };
        this.emit('hallucination-risk-detected', {
            query,
            risk: result.level,
            score: result.score,
            frameworks: frameworks.map(f => f.name)
        });
        console.log(`   ${this.getRiskEmoji(result.level)} Risk Level: ${result.level.toUpperCase()} (${result.score}/100)`);
        console.log(`   💡 ${result.reasoning}`);
        if (result.recommendation) {
            console.log(`   📋 Recommendation: ${result.recommendation.action}`);
        }
        return result;
    }
    /**
     * Extract framework mentions from query text
     */
    extractFrameworkMentions(query) {
        const queryLower = query.toLowerCase();
        const mentioned = [];
        for (const [key, framework] of Object.entries(FRAMEWORK_KNOWLEDGE_BASE)) {
            // Check if framework name or key is mentioned
            if (queryLower.includes(key.toLowerCase()) ||
                queryLower.includes(framework.name.toLowerCase())) {
                mentioned.push(framework);
            }
        }
        return mentioned;
    }
    /**
     * Calculate hallucination risk for a specific framework
     */
    calculateFrameworkRisk(framework) {
        let score = 0;
        let reasoning = '';
        // Factor 1: Time since knowledge cutoff (0-40 points)
        const daysSinceCutoff = this.getDaysSinceCutoff();
        const timeRiskScore = Math.min(daysSinceCutoff / 365 * 40, 40); // Max 40 points after 1 year
        score += timeRiskScore;
        // Factor 2: Framework release frequency (0-30 points)
        const releaseRiskScore = {
            'high': 30, // Frameworks that release often (FastAPI, React, Next.js)
            'medium': 15, // Moderate release cadence (Django, Vue)
            'low': 5 // Stable frameworks (Express, Flask)
        }[framework.releaseFrequency];
        score += releaseRiskScore;
        // Factor 3: Known risk level (0-30 points)
        const knownRiskScore = {
            'high': 30,
            'medium': 15,
            'low': 5
        }[framework.knowledgeCutoffRisk];
        score += knownRiskScore;
        // Determine risk level
        let level;
        if (score >= 70) {
            level = 'high';
            reasoning = `${framework.name} has ${framework.releaseFrequency} release frequency and high knowledge cutoff risk. ${daysSinceCutoff} days since Claude's knowledge cutoff (Jan 2025). Strongly recommend using GitMCP for latest docs.`;
        }
        else if (score >= 40) {
            level = 'medium';
            reasoning = `${framework.name} has ${framework.releaseFrequency} release frequency. ${daysSinceCutoff} days since knowledge cutoff. Consider using GitMCP to verify latest patterns.`;
        }
        else {
            level = 'low';
            reasoning = `${framework.name} is relatively stable with ${framework.releaseFrequency} release frequency. Claude's knowledge is likely current enough for general queries.`;
        }
        return { level, score, reasoning };
    }
    /**
     * Generate recommendation based on risk assessment
     */
    generateRecommendation(risk, framework, query) {
        if (risk.level === 'high') {
            // High risk: Strongly recommend GitMCP
            const specificPath = this.inferDocumentationPath(query, framework);
            return {
                action: 'use-gitmcp',
                gitMCPQuery: this.formatGitMCPQuery(framework, specificPath),
                confidence: 95
            };
        }
        else if (risk.level === 'medium') {
            // Medium risk: Suggest GitMCP for verification
            return {
                action: 'use-gitmcp',
                gitMCPQuery: this.formatGitMCPQuery(framework),
                confidence: 70
            };
        }
        else {
            // Low risk: Proceed but mention limitation
            return {
                action: 'proceed-with-caution',
                confidence: 50
            };
        }
    }
    /**
     * Infer specific documentation path from query
     */
    inferDocumentationPath(query, framework) {
        const queryLower = query.toLowerCase();
        // Common patterns
        const patterns = {
            'auth': 'authentication',
            'oauth': 'security/oauth2',
            'security': 'security',
            'deployment': 'deployment',
            'database': 'database',
            'testing': 'testing',
            'api': 'api-reference',
            'tutorial': 'tutorial',
            'getting started': 'getting-started',
            'migration': 'migration',
            'configuration': 'configuration',
            'hooks': 'hooks',
            'components': 'components'
        };
        for (const [keyword, path] of Object.entries(patterns)) {
            if (queryLower.includes(keyword)) {
                return framework.docsPath ? `${framework.docsPath}/${path}` : path;
            }
        }
        return framework.docsPath;
    }
    /**
     * Format GitMCP query recommendation
     */
    formatGitMCPQuery(framework, specificPath) {
        if (specificPath) {
            return `gitmcp://${framework.repository}/${specificPath}`;
        }
        return `gitmcp://${framework.repository}${framework.docsPath ? '/' + framework.docsPath : ''}`;
    }
    /**
     * Get days since knowledge cutoff
     */
    getDaysSinceCutoff() {
        const now = new Date();
        const diffMs = now.getTime() - this.KNOWLEDGE_CUTOFF_DATE.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    /**
     * Get emoji for risk level
     */
    getRiskEmoji(level) {
        switch (level) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
        }
    }
    /**
     * Check if framework is in knowledge base
     */
    hasFrameworkInfo(frameworkName) {
        const lowerName = frameworkName.toLowerCase();
        return Object.keys(FRAMEWORK_KNOWLEDGE_BASE).some(key => key.toLowerCase() === lowerName ||
            FRAMEWORK_KNOWLEDGE_BASE[key].name.toLowerCase() === lowerName);
    }
    /**
     * Get framework info
     */
    getFrameworkInfo(frameworkName) {
        const lowerName = frameworkName.toLowerCase();
        const entry = Object.entries(FRAMEWORK_KNOWLEDGE_BASE).find(([key, fw]) => key.toLowerCase() === lowerName ||
            fw.name.toLowerCase() === lowerName);
        return entry ? entry[1] : undefined;
    }
    /**
     * Add custom framework to knowledge base
     */
    addFramework(key, info) {
        FRAMEWORK_KNOWLEDGE_BASE[key] = info;
        this.emit('framework-added', { key, info });
    }
}
// Export singleton instance
export const antiHallucinationDetector = new AntiHallucinationDetector();
//# sourceMappingURL=anti-hallucination-detector.js.map