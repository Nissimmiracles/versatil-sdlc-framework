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
- goroutines and channels for concurrency
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
        // Check for explicitly ignored errors (blank identifier)
        if (this.hasIgnoredError(content)) {
            score -= 15;
            suggestions.push({
                type: 'error-handling',
                message: 'Error is explicitly ignored using blank identifier (_). Consider handling errors properly.',
                priority: 'high'
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
    // Concurrency Pattern Detection Methods
    hasGoroutine(content) {
        return /go\s+func\(/.test(content) || /go\s+\w+\(/.test(content);
    }
    hasChannel(content) {
        return /make\s*\(\s*chan\s/.test(content) || /<-/.test(content);
    }
    hasSelectStatement(content) {
        return /select\s*\{/.test(content);
    }
    hasUnbufferedChannelRisk(content) {
        return /make\s*\(\s*chan\s+\w+\s*\)/.test(content) && !content.includes(', ');
    }
    hasMissingGoroutineCleanup(content) {
        const hasGoroutine = this.hasGoroutine(content);
        const hasContext = content.includes('context.') || content.includes('ctx.');
        const hasDoneChannel = content.includes('done') || content.includes('quit');
        return hasGoroutine && !hasContext && !hasDoneChannel;
    }
    hasWaitGroup(content) {
        return content.includes('sync.WaitGroup') || /wg\.(Add|Wait|Done)/.test(content);
    }
    // Error Handling Methods
    hasIgnoredError(content) {
        return /,\s*_\s*:=/.test(content);
    }
    hasErrorWrapping(content) {
        return /fmt\.Errorf\([^)]*%w/.test(content);
    }
    hasCustomErrorType(content) {
        return /type\s+\w+Error\s+struct/.test(content) && /func\s*\([^)]*\)\s*Error\(\)/.test(content);
    }
    hasPanic(content) {
        return /panic\s*\(/.test(content);
    }
    hasRecover(content) {
        return /recover\s*\(\)/.test(content);
    }
    // Interface Design Methods
    hasInterface(content) {
        return /type\s+\w+\s+interface\s*\{/.test(content);
    }
    hasTypeAssertion(content) {
        return /\.\([^)]+\)/.test(content);
    }
    // Performance Methods
    hasSlicePreallocation(content) {
        return /make\s*\(\s*\[\]\w+\s*,\s*\d+\s*,\s*\d+\s*\)/.test(content);
    }
    hasStringBuilder(content) {
        return content.includes('strings.Builder');
    }
    hasStringConcatInLoop(content) {
        const hasLoop = /for\s+/.test(content);
        const hasStringConcat = /\w+\s*\+=/.test(content) && !content.includes('strings.Builder');
        return hasLoop && hasStringConcat;
    }
    hasSyncPool(content) {
        return content.includes('sync.Pool');
    }
    // Security Methods
    detectSQLInjection(content) {
        return this.hasSQLInjectionRisk(content);
    }
    hasParameterizedQuery(content) {
        return /Query\([^)]*\$\d+/.test(content) || /Query\([^)]*\?/.test(content);
    }
    hasHardcodedCredentials(content) {
        const patterns = [
            /password\s*[:=]\s*["'][^"']+["']/i,
            /apikey\s*[:=]\s*["'][^"']+["']/i,
            /secret\s*[:=]\s*["'][^"']+["']/i,
            /token\s*[:=]\s*["'][^"']+["']/i
        ];
        return patterns.some(pattern => pattern.test(content));
    }
    hasCryptoUsage(content) {
        return /import\s+"crypto\//.test(content);
    }
    hasUnsafePointer(content) {
        return content.includes('unsafe.Pointer');
    }
    // Memory Management Methods
    hasDefer(content) {
        return /defer\s+\w+/.test(content);
    }
    hasMissingDefer(content) {
        const hasResourceOpen = /\w+\s*,\s*err\s*:=\s*os\.Open/.test(content) || /\w+\s*,\s*err\s*:=\s*\w+\.Open/.test(content);
        const hasDefer = this.hasDefer(content);
        return hasResourceOpen && !hasDefer;
    }
    hasContext(content) {
        return /context\.Context/.test(content) || /ctx\s+context\.Context/.test(content);
    }
    hasContextTimeout(content) {
        return /context\.WithTimeout/.test(content) || /context\.WithDeadline/.test(content);
    }
    // Testing Methods
    hasTestFunction(content) {
        return /func\s+Test\w+\s*\(/.test(content);
    }
    hasTableDrivenTest(content) {
        return /tests\s*:=\s*\[\]struct/.test(content) || /tt\s+:=\s+range\s+tests/.test(content);
    }
    hasTestHelper(content) {
        return /t\.Helper\(\)/.test(content);
    }
    // Code Quality Methods
    hasExportedDocumentation(content) {
        return /\/\/\s*\w+\s+\w+/.test(content) && /func\s+[A-Z]/.test(content);
    }
    hasMissingExportedDoc(content) {
        const hasExportedFunc = /func\s+[A-Z]\w+/.test(content);
        const hasDoc = this.hasExportedDocumentation(content);
        return hasExportedFunc && !hasDoc;
    }
}
//# sourceMappingURL=marcus-go.js.map