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
- Type hints and Pydantic models
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
            framework: this.detectPythonFramework(content)
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
            /\.raw\(['"]\s*SELECT.*%s/
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
    getDefaultRAGConfig() {
        return {
            ...super.getDefaultRAGConfig(),
            agentDomain: 'backend-python',
            maxExamples: 5
        };
    }
}
//# sourceMappingURL=marcus-python.js.map