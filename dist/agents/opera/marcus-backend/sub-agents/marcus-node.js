/**
 * Marcus-Node: Node.js Backend Specialist
 *
 * Language-specific sub-agent for Node.js 18+ backend development.
 * Specializes in Express/Fastify, async/await patterns, and NPM package management.
 *
 * Auto-activates on: package.json with node version, .js/.ts backend files
 *
 * @module marcus-node
 * @version 6.6.0
 * @parent marcus-backend
 */
import { EnhancedMarcus } from '../enhanced-marcus.js';
export class MarcusNode extends EnhancedMarcus {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'Marcus-Node';
        this.id = 'marcus-node';
        this.specialization = 'Node.js 18+ Backend Specialist';
        this.systemPrompt = `You are Marcus-Node, a specialized Node.js backend expert with deep knowledge of:
- Node.js 18+ features (native fetch, test runner, watch mode)
- Express.js and Fastify framework best practices
- Async/await patterns and error handling
- NPM package management and security
- CommonJS vs ESM module systems
- Event loop optimization
- Stream processing and buffers
- Cluster mode and worker threads`;
    }
    /**
     * Override activate to add Node.js-specific validation
     */
    async activate(context) {
        // Run base Marcus activation
        const response = await super.activate(context);
        // Add Node.js-specific analysis
        const nodeAnalysis = await this.analyzeNodeJSPatterns(context);
        // Enhance response with Node.js insights
        response.suggestions = response.suggestions || [];
        response.suggestions.push(...nodeAnalysis.suggestions);
        if (response.context) {
            response.context.nodeJSAnalysis = nodeAnalysis;
        }
        return response;
    }
    /**
     * Analyze Node.js-specific patterns
     */
    async analyzeNodeJSPatterns(context) {
        const content = context.content || '';
        const suggestions = [];
        const bestPractices = {
            asyncPatterns: [],
            errorHandling: [],
            securityPatterns: [],
            performanceOptimizations: []
        };
        let score = 100;
        // Check for callback hell (anti-pattern)
        if (this.hasCallbackHell(content)) {
            score -= 15;
            suggestions.push({
                type: 'async-pattern',
                message: 'Callback hell detected. Refactor to async/await for better readability.',
                priority: 'high'
            });
            bestPractices.asyncPatterns.push('Use async/await instead of nested callbacks');
        }
        // Check for unhandled promise rejections
        if (this.hasUnhandledPromises(content)) {
            score -= 20;
            suggestions.push({
                type: 'error-handling',
                message: 'Unhandled promise rejections detected. Add .catch() or try/catch blocks.',
                priority: 'critical'
            });
            bestPractices.errorHandling.push('Always handle promise rejections');
        }
        // Check for blocking operations
        if (this.hasBlockingOperations(content)) {
            score -= 10;
            suggestions.push({
                type: 'performance',
                message: 'Blocking synchronous operations detected. Use async alternatives.',
                priority: 'medium'
            });
            bestPractices.performanceOptimizations.push('Avoid blocking sync operations (fs.readFileSync, etc.)');
        }
        // Check for vulnerable packages patterns
        if (this.hasVulnerablePatterns(content)) {
            score -= 25;
            suggestions.push({
                type: 'security',
                message: 'Potential security vulnerability pattern detected. Review dependencies.',
                priority: 'critical'
            });
            bestPractices.securityPatterns.push('Regularly audit dependencies with npm audit');
        }
        // Check for proper error middleware (Express)
        if (content.includes('express()') && !this.hasErrorMiddleware(content)) {
            score -= 10;
            suggestions.push({
                type: 'error-handling',
                message: 'Express app missing centralized error handling middleware.',
                priority: 'high'
            });
            bestPractices.errorHandling.push('Implement centralized error middleware');
        }
        // Check for environment variable handling
        if (!this.hasProperEnvHandling(content)) {
            score -= 5;
            suggestions.push({
                type: 'configuration',
                message: 'Environment variables not properly validated. Consider using dotenv-safe or zod.',
                priority: 'medium'
            });
            bestPractices.securityPatterns.push('Validate environment variables at startup');
        }
        // Check for CORS configuration
        if ((content.includes('express()') || content.includes('fastify()')) && !content.includes('cors')) {
            suggestions.push({
                type: 'security',
                message: 'CORS middleware not detected. Ensure CORS is properly configured.',
                priority: 'medium'
            });
            bestPractices.securityPatterns.push('Configure CORS explicitly');
        }
        // Check for rate limiting
        if (this.isAPIRoute(content) && !content.includes('rateLimit')) {
            suggestions.push({
                type: 'security',
                message: 'Rate limiting not detected. Consider adding rate limiting to prevent abuse.',
                priority: 'medium'
            });
            bestPractices.securityPatterns.push('Implement rate limiting on API routes');
        }
        // Check for helmet.js usage (Express security)
        if (content.includes('express()') && !content.includes('helmet')) {
            suggestions.push({
                type: 'security',
                message: 'Helmet middleware not detected. Add helmet for security headers.',
                priority: 'high'
            });
            bestPractices.securityPatterns.push('Use helmet.js for security headers');
        }
        // Check for proper logging
        if (!this.hasProperLogging(content)) {
            score -= 5;
            suggestions.push({
                type: 'observability',
                message: 'Console.log detected. Use structured logging (winston, pino).',
                priority: 'low'
            });
            bestPractices.performanceOptimizations.push('Use structured logging libraries');
        }
        // Check for TypeScript usage
        if (context.filePath?.endsWith('.js') && !context.filePath.endsWith('.test.js')) {
            suggestions.push({
                type: 'code-quality',
                message: 'Consider migrating to TypeScript for better type safety.',
                priority: 'low'
            });
        }
        return {
            score: Math.max(score, 0),
            suggestions,
            bestPractices
        };
    }
    /**
     * Detect callback hell pattern
     */
    hasCallbackHell(content) {
        // Look for deeply nested callbacks
        const lines = content.split('\n');
        let maxNesting = 0;
        let currentNesting = 0;
        for (const line of lines) {
            if (line.includes('function') && line.includes('(') && line.includes(')') && line.includes('{')) {
                currentNesting++;
                maxNesting = Math.max(maxNesting, currentNesting);
            }
            if (line.includes('}')) {
                currentNesting = Math.max(0, currentNesting - 1);
            }
        }
        return maxNesting > 3;
    }
    /**
     * Detect unhandled promises
     */
    hasUnhandledPromises(content) {
        // Check for promises without .catch() or try/catch
        const hasPromises = content.includes('.then(') || content.includes('await ');
        const hasCatch = content.includes('.catch(') || content.includes('try {');
        return hasPromises && !hasCatch;
    }
    /**
     * Detect blocking operations
     */
    hasBlockingOperations(content) {
        const blockingPatterns = [
            'fs.readFileSync',
            'fs.writeFileSync',
            'fs.existsSync',
            'crypto.pbkdf2Sync',
            'crypto.scryptSync'
        ];
        return blockingPatterns.some(pattern => content.includes(pattern));
    }
    /**
     * Detect vulnerable patterns
     */
    hasVulnerablePatterns(content) {
        const vulnerablePatterns = [
            'eval(',
            'Function(',
            'child_process.exec(',
            'innerHTML =',
            'dangerouslySetInnerHTML'
        ];
        return vulnerablePatterns.some(pattern => content.includes(pattern));
    }
    /**
     * Check for Express error middleware
     */
    hasErrorMiddleware(content) {
        // Error middleware has 4 parameters: (err, req, res, next)
        return content.includes('(err, req, res, next)') || content.includes('app.use((err,');
    }
    /**
     * Check for proper environment variable handling
     */
    hasProperEnvHandling(content) {
        return content.includes('dotenv') || content.includes('process.env') && content.includes('||');
    }
    /**
     * Check if content is an API route
     */
    isAPIRoute(content) {
        return content.includes('app.get(') ||
            content.includes('app.post(') ||
            content.includes('router.get(') ||
            content.includes('router.post(') ||
            content.includes('fastify.get(') ||
            content.includes('fastify.post(');
    }
    /**
     * Check for structured logging
     */
    hasProperLogging(content) {
        const hasStructuredLogging = content.includes('winston') ||
            content.includes('pino') ||
            content.includes('bunyan');
        const hasConsoleLog = content.includes('console.log');
        return hasStructuredLogging || !hasConsoleLog;
    }
    /**
     * Generate Node.js-specific recommendations
     */
    generateNodeRecommendations(content) {
        const recommendations = [];
        // Framework recommendations
        if (content.includes('express()')) {
            recommendations.push('Consider Fastify for 3x faster performance than Express');
            recommendations.push('Use express-validator for input validation');
            recommendations.push('Implement compression middleware for response optimization');
        }
        if (content.includes('fastify()')) {
            recommendations.push('Leverage Fastify schema validation for better performance');
            recommendations.push('Use fastify-rate-limit for built-in rate limiting');
        }
        // Performance recommendations
        if (content.includes('JSON.parse') || content.includes('JSON.stringify')) {
            recommendations.push('Consider using fast-json-stringify for 2x faster serialization');
        }
        // Security recommendations
        if (content.includes('password') && !content.includes('bcrypt')) {
            recommendations.push('Use bcrypt or argon2 for password hashing');
        }
        if (content.includes('jwt') && !content.includes('verify')) {
            recommendations.push('Always verify JWT tokens and handle expiration');
        }
        return recommendations;
    }
    /**
     * Override RAG configuration for Node.js domain
     */
    getDefaultRAGConfig() {
        return {
            ...super.getDefaultRAGConfig(),
            agentDomain: 'backend-nodejs',
            maxExamples: 5 // More examples for Node.js patterns
        };
    }
    /**
     * Detect Node.js framework
     */
    detectNodeFramework(content) {
        if (content.includes('fastify'))
            return 'Fastify';
        if (content.includes('express'))
            return 'Express';
        if (content.includes('koa'))
            return 'Koa';
        if (content.includes('@nestjs'))
            return 'NestJS';
        if (content.includes('hapi'))
            return 'Hapi';
        return 'Node.js (no framework)';
    }
}
//# sourceMappingURL=marcus-node.js.map