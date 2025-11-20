/**
 * Marcus-Python: Python Backend Specialist
 *
 * Language-specific sub-agent for Python 3.11+ backend development.
 * Specializes in FastAPI/Django, async Python, and type hints.
 *
 * Auto-activates on: requirements.txt, pyproject.toml, .py files
 *
 * @module marcus-python
 * @version 6.6.0
 * @parent marcus-backend
 */
import { EnhancedMarcus } from '../enhanced-marcus.js';
export class MarcusPython extends EnhancedMarcus {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'Marcus-Python';
        this.id = 'marcus-python';
        this.specialization = 'Python 3.11+ Backend Specialist';
        this.systemPrompt = `You are Marcus-Python, a specialized Python backend expert with deep knowledge of:
- Python 3.11+ features (match/case, improved error messages, faster runtime)
- FastAPI and Django framework best practices
- Async/await patterns with asyncio
- type hints and Pydantic models
- Poetry and pip dependency management
- Virtual environments (venv, conda)
- PEP 8 style guidelines
- Python security patterns (SQL injection, XSS prevention)`;
    }
    async activate(context) {
        const response = await super.activate(context);
        const pythonAnalysis = await this.analyzePythonPatterns(context);
        response.suggestions = response.suggestions || [];
        response.suggestions.push(...pythonAnalysis.suggestions);
        if (response.context) {
            response.context.pythonAnalysis = pythonAnalysis;
        }
        return response;
    }
    async analyzePythonPatterns(context) {
        const content = context.content || '';
        const suggestions = [];
        let score = 100;
        // Check for missing type hints
        if (!this.hasTypeHints(content) && this.isFunctionDefinition(content)) {
            score -= 10;
            suggestions.push({
                type: 'code-quality',
                message: 'Missing type hints. Add type annotations for better code clarity.',
                priority: 'medium'
            });
        }
        // Check for bare except clauses
        if (content.includes('except:') && !content.includes('except Exception:')) {
            score -= 15;
            suggestions.push({
                type: 'error-handling',
                message: 'Bare except clause detected. Specify exception types.',
                priority: 'high'
            });
        }
        // Check for SQL injection vulnerabilities
        if (this.hasSQLInjectionRisk(content)) {
            score -= 25;
            suggestions.push({
                type: 'security',
                message: 'SQL injection risk detected. Use parameterized queries.',
                priority: 'critical'
            });
        }
        // Check for async/await in FastAPI
        if (content.includes('fastapi') && !content.includes('async def')) {
            suggestions.push({
                type: 'performance',
                message: 'Consider using async def for FastAPI routes for better performance.',
                priority: 'medium'
            });
        }
        // Check for Pydantic models
        if (content.includes('fastapi') && !content.includes('BaseModel')) {
            suggestions.push({
                type: 'best-practice',
                message: 'Use Pydantic BaseModel for request/response validation.',
                priority: 'medium'
            });
        }
        // Check for environment variables
        if (content.includes('os.environ[') && !content.includes('.get(')) {
            score -= 10;
            suggestions.push({
                type: 'error-handling',
                message: 'Use os.environ.get() with default values to prevent KeyError.',
                priority: 'medium'
            });
        }
        // Check for Django security
        if (content.includes('django') && content.includes('User.objects.raw(')) {
            score -= 20;
            suggestions.push({
                type: 'security',
                message: 'Raw SQL in Django detected. Use Django ORM or parameterized queries.',
                priority: 'high'
            });
        }
        return {
            score: Math.max(score, 0),
            suggestions,
            framework: this.detectPythonFramework(content),
            bestPractices: {
                hasTypeHints: this.hasTypeHints(content),
                hasAsyncAwait: /async\s+def/.test(content),
                usesPydantic: content.includes('BaseModel'),
                hasDependencyInjection: /Depends\s*\(/.test(content)
            }
        };
    }
    hasTypeHints(content) {
        return content.includes(': ') || content.includes('->');
    }
    isFunctionDefinition(content) {
        return content.includes('def ');
    }
    hasSQLInjectionRisk(content) {
        // Check for string concatenation in SQL queries
        const sqlPatterns = [
            /execute\(['"]\s*SELECT.*%s/,
            /execute\(['"]\s*SELECT.*\+/,
            /execute\(f['"]\s*SELECT/,
            /\.raw\(['"]\s*SELECT.*%s/,
            /f"SELECT.*\{/, // f-string with variables in SELECT
            /query\s*=\s*f["'].*SELECT.*\{/ // query variable with f-string
        ];
        return sqlPatterns.some(pattern => pattern.test(content));
    }
    detectPythonFramework(content) {
        if (content.includes('from fastapi') || content.includes('import fastapi'))
            return 'FastAPI';
        if (content.includes('from django') || content.includes('import django'))
            return 'Django';
        if (content.includes('from flask') || content.includes('import flask'))
            return 'Flask';
        return 'Python (no framework)';
    }
    // Public pattern detection methods for testing and external use
    detectSQLInjection(content) {
        return this.hasSQLInjectionRisk(content);
    }
    detectHardcodedSecrets(content) {
        const secretPatterns = [
            /API_KEY\s*=\s*["'][^"']+["']/i,
            /SECRET\s*=\s*["'][^"']+["']/i,
            /PASSWORD\s*=\s*["'][^"']+["']/i,
            /TOKEN\s*=\s*["'][^"']+["']/i,
            /sk_live_/i,
            /sk_test_/i
        ];
        return secretPatterns.some(pattern => pattern.test(content));
    }
    detectMissingValidation(content) {
        // Check if FastAPI endpoint accepts dict without Pydantic model
        return /def\s+\w+\([^)]*:\s*dict[^)]*\)/.test(content) &&
            content.includes('@app.');
    }
    detectUnsafeEval(content) {
        return /\beval\s*\(/.test(content) || /\bexec\s*\(/.test(content);
    }
    detectMissingAuth(content) {
        // Check for admin/delete endpoints without Depends
        const hasAdminEndpoint = /@app\.(delete|put|patch).*["']\/admin/.test(content);
        const hasAuthDependency = /Depends\s*\(/.test(content);
        return hasAdminEndpoint && !hasAuthDependency;
    }
    hasDependencyInjection(content) {
        return /Depends\s*\(/.test(content);
    }
    hasResponseModel(content) {
        return /response_model\s*=/.test(content);
    }
    hasMissingTypeHints(content) {
        // Check for function definitions without type hints
        // Look for parameters without type annotations
        const funcWithNoHints = /def\s+\w+\s*\(\s*\w+\s*\)(?!\s*->)/;
        return funcWithNoHints.test(content);
    }
    hasFieldValidators(content) {
        return /Field\s*\(/.test(content) && /from pydantic import/.test(content);
    }
    hasAsyncAwait(content) {
        return /async\s+def/.test(content) && /await\s+/.test(content);
    }
    hasMissingAwait(content) {
        // Check for async function that might be missing await
        const hasAsyncDef = /async\s+def/.test(content);
        const hasAwait = /await\s+/.test(content);
        const hasFunctionCall = /\w+\s*\([^)]*\)/.test(content);
        return hasAsyncDef && !hasAwait && hasFunctionCall;
    }
    hasBlockingIO(content) {
        const blockingPatterns = [
            /with\s+open\s*\(/,
            /open\s*\([^)]*,\s*["']r["']\)/,
            /json\.load\s*\(/,
            /pickle\.load\s*\(/
        ];
        return /async\s+def/.test(content) &&
            blockingPatterns.some(pattern => pattern.test(content));
    }
    hasBareExcept(content) {
        return /except\s*:/.test(content) && !/except\s+\w+\s*:/.test(content);
    }
    hasCustomExceptionHandler(content) {
        return /@app\.exception_handler/.test(content);
    }
    hasMissingSessionManagement(content) {
        const hasSessionLocal = /SessionLocal\s*\(\)/.test(content);
        const hasTryFinally = /try:[\s\S]*finally:/.test(content);
        return hasSessionLocal && !hasTryFinally;
    }
    hasNPlusOne(content) {
        // Simplified detection: for loop with query inside
        return /for\s+\w+\s+in\s+[\s\S]*db\.query\(/.test(content);
    }
    hasListComprehension(content) {
        return /\[[^\]]+for\s+\w+\s+in\s+[^\]]+\]/.test(content);
    }
    hasCaching(content) {
        return /@lru_cache/.test(content) || /@cache/.test(content);
    }
    hasDocstring(content) {
        // Check for docstrings after function definition (handles indentation)
        return /def\s+\w+.*?:[\s\n]+"""/s.test(content) ||
            /def\s+\w+.*?:[\s\n]+'''/s.test(content);
    }
    hasFStrings(content) {
        return /f["']/.test(content);
    }
    getDefaultRAGConfig() {
        return {
            ...super.getDefaultRAGConfig(),
            agentDomain: 'backend-python',
            maxExamples: 5
        };
    }
}
//# sourceMappingURL=marcus-python.js.map