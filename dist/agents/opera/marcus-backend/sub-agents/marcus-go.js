/**
 * Marcus-Go: Go Backend Specialist
 *
 * Language-specific sub-agent for Go 1.21+ backend development.
 * Specializes in Gin/Echo frameworks, goroutines, and channels.
 *
 * Auto-activates on: go.mod, go.sum, .go files
 *
 * @module marcus-go
 * @version 6.6.0
 * @parent marcus-backend
 */
import { EnhancedMarcus } from '../enhanced-marcus.js';
export class MarcusGo extends EnhancedMarcus {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'Marcus-Go';
        this.id = 'marcus-go';
        this.specialization = 'Go 1.21+ Backend Specialist';
        this.systemPrompt = `You are Marcus-Go, a specialized Go backend expert with deep knowledge of:
- Go 1.21+ features (generics, improved error handling)
- Gin and Echo framework best practices
- Goroutines and channels for concurrency
- Context for timeout and cancellation
- Go modules and dependency management
- Error handling patterns (no exceptions)
- Interface-based design
- Testing with testing package and testify`;
    }
    async activate(context) {
        const response = await super.activate(context);
        const goAnalysis = await this.analyzeGoPatterns(context);
        response.suggestions = response.suggestions || [];
        response.suggestions.push(...goAnalysis.suggestions);
        if (response.context) {
            response.context.goAnalysis = goAnalysis;
        }
        return response;
    }
    async analyzeGoPatterns(context) {
        const content = context.content || '';
        const suggestions = [];
        let score = 100;
        // Check for missing error handling
        if (this.hasMissingErrorHandling(content)) {
            score -= 20;
            suggestions.push({
                type: 'error-handling',
                message: 'Missing error handling. Always check errors returned from functions.',
                priority: 'critical'
            });
        }
        // Check for goroutine leaks
        if (this.hasGoroutineLeakRisk(content)) {
            score -= 15;
            suggestions.push({
                type: 'concurrency',
                message: 'Potential goroutine leak. Ensure goroutines can exit properly.',
                priority: 'high'
            });
        }
        // Check for race conditions
        if (this.hasRaceConditionRisk(content)) {
            score -= 20;
            suggestions.push({
                type: 'concurrency',
                message: 'Potential race condition. Use sync.Mutex or channels for synchronization.',
                priority: 'high'
            });
        }
        // Check for context usage in HTTP handlers
        if (this.isHTTPHandler(content) && !content.includes('ctx.Request().Context()')) {
            suggestions.push({
                type: 'best-practice',
                message: 'Use request context for timeout and cancellation handling.',
                priority: 'medium'
            });
        }
        // Check for defer statements with database connections
        if (content.includes('db.') && !content.includes('defer ')) {
            suggestions.push({
                type: 'resource-management',
                message: 'Consider using defer to ensure resources are closed properly.',
                priority: 'medium'
            });
        }
        // Check for SQL injection
        if (this.hasSQLInjectionRisk(content)) {
            score -= 25;
            suggestions.push({
                type: 'security',
                message: 'SQL injection risk detected. Use prepared statements or query builders.',
                priority: 'critical'
            });
        }
        // Check for panic usage
        if (content.includes('panic(') && !content.includes('recover()')) {
            score -= 10;
            suggestions.push({
                type: 'error-handling',
                message: 'Panic detected without recover. Return errors instead of panicking.',
                priority: 'high'
            });
        }
        // Check for interface{} overuse
        if ((content.match(/interface\{\}/g) || []).length > 3) {
            suggestions.push({
                type: 'code-quality',
                message: 'Excessive use of interface{}. Consider using generics (Go 1.21+).',
                priority: 'low'
            });
        }
        return {
            score: Math.max(score, 0),
            suggestions,
            framework: this.detectGoFramework(content)
        };
    }
    hasMissingErrorHandling(content) {
        // Check for function calls that return errors but aren't checked
        const errorReturns = content.match(/,\s*err\s*:=/g);
        const errorChecks = content.match(/if\s+err\s*!=/g);
        if (!errorReturns)
            return false;
        if (!errorChecks)
            return true;
        return errorReturns.length > errorChecks.length;
    }
    hasGoroutineLeakRisk(content) {
        // Check for goroutines without proper context or done channel
        const hasGoroutine = content.includes('go func()') || content.includes('go ');
        const hasContext = content.includes('context.') || content.includes('ctx.');
        const hasDoneChannel = content.includes('done <-') || content.includes('<-done');
        return hasGoroutine && !hasContext && !hasDoneChannel;
    }
    hasRaceConditionRisk(content) {
        // Check for shared state access without synchronization
        const hasSharedState = content.includes('var ') && content.includes('go func()');
        const hasMutex = content.includes('sync.Mutex') || content.includes('sync.RWMutex');
        const hasChannel = content.includes('chan ');
        return hasSharedState && !hasMutex && !hasChannel;
    }
    isHTTPHandler(content) {
        return content.includes('gin.Context') ||
            content.includes('echo.Context') ||
            content.includes('http.ResponseWriter');
    }
    hasSQLInjectionRisk(content) {
        // Check for string concatenation in SQL queries
        return (content.includes('Query(') || content.includes('Exec(')) &&
            (content.includes('fmt.Sprintf') || content.includes('+'));
    }
    detectGoFramework(content) {
        if (content.includes('gin.'))
            return 'Gin';
        if (content.includes('echo.'))
            return 'Echo';
        if (content.includes('fiber.'))
            return 'Fiber';
        if (content.includes('http.'))
            return 'net/http (stdlib)';
        return 'Go';
    }
    getDefaultRAGConfig() {
        return {
            ...super.getDefaultRAGConfig(),
            agentDomain: 'backend-go',
            maxExamples: 5
        };
    }
}
//# sourceMappingURL=marcus-go.js.map