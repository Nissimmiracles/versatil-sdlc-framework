/**
 * Sub-Agent Selector
 *
 * Intelligently selects the optimal language-specific sub-agent based on context.
 * Integrates with TechStackDetector for high-accuracy agent routing.
 *
 * @module sub-agent-selector
 * @version 6.6.0
 */
import { TechStackDetector } from './tech-stack-detector.js';
export class SubAgentSelector {
    /**
     * Select optimal sub-agent based on file and context
     */
    static async selectSubAgent(filePath, content, projectPath) {
        // Try file-based detection first (faster)
        const fileStack = await TechStackDetector.detectFromFile(filePath, content);
        if (fileStack.confidence >= 0.7 && fileStack.recommendedSubAgents.length > 0) {
            return {
                subAgentId: fileStack.recommendedSubAgents[0],
                baseAgentId: this.getBaseAgentId(fileStack.recommendedSubAgents[0]),
                confidence: fileStack.confidence,
                reason: `Detected from file: ${fileStack.framework || fileStack.language}`,
                fallback: false,
                techStack: fileStack
            };
        }
        // Fall back to project-level detection
        const projectStack = await this.getProjectStack(projectPath);
        if (projectStack.confidence >= 0.5 && projectStack.recommendedSubAgents.length > 0) {
            return {
                subAgentId: projectStack.recommendedSubAgents[0],
                baseAgentId: this.getBaseAgentId(projectStack.recommendedSubAgents[0]),
                confidence: projectStack.confidence,
                reason: `Detected from project: ${projectStack.framework || projectStack.language}`,
                fallback: false,
                techStack: projectStack
            };
        }
        // Ultimate fallback: determine from file type
        return this.fallbackSelection(filePath);
    }
    /**
     * Select backend sub-agent
     */
    static async selectBackendSubAgent(filePath, content, projectPath) {
        const selection = await this.selectSubAgent(filePath, content, projectPath);
        // If selected agent is not a backend agent, use fallback
        if (!this.isBackendAgent(selection.subAgentId)) {
            return this.fallbackBackendSelection(filePath, content);
        }
        return selection;
    }
    /**
     * Select frontend sub-agent
     */
    static async selectFrontendSubAgent(filePath, content, projectPath) {
        const selection = await this.selectSubAgent(filePath, content, projectPath);
        // If selected agent is not a frontend agent, use fallback
        if (!this.isFrontendAgent(selection.subAgentId)) {
            return this.fallbackFrontendSelection(filePath, content);
        }
        return selection;
    }
    /**
     * Get project tech stack (with caching)
     */
    static async getProjectStack(projectPath) {
        const cached = this.techStackCache.get(projectPath);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.result;
        }
        const result = await TechStackDetector.detectFromProject(projectPath);
        this.techStackCache.set(projectPath, { result, timestamp: Date.now() });
        return result;
    }
    /**
     * Clear tech stack cache (useful for testing or after project changes)
     */
    static clearCache() {
        this.techStackCache.clear();
    }
    /**
     * Determine base agent from sub-agent ID
     */
    static getBaseAgentId(subAgentId) {
        if (subAgentId.startsWith('marcus-')) {
            return 'marcus-backend';
        }
        return 'james-frontend';
    }
    /**
     * Check if sub-agent is a backend agent
     */
    static isBackendAgent(subAgentId) {
        return ['marcus-node', 'marcus-python', 'marcus-rails', 'marcus-go', 'marcus-java'].includes(subAgentId);
    }
    /**
     * Check if sub-agent is a frontend agent
     */
    static isFrontendAgent(subAgentId) {
        return ['james-react', 'james-vue', 'james-nextjs', 'james-angular', 'james-svelte'].includes(subAgentId);
    }
    /**
     * Fallback selection based on file type
     */
    static fallbackSelection(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        // Backend extensions
        if (['ts', 'js', 'mjs', 'cjs'].includes(ext || '')) {
            if (filePath.includes('/api/') || filePath.includes('/routes/') || filePath.includes('/controllers/')) {
                return {
                    subAgentId: 'marcus-node',
                    baseAgentId: 'marcus-backend',
                    confidence: 0.5,
                    reason: 'Fallback: Node.js backend file detected',
                    fallback: true
                };
            }
        }
        if (ext === 'py') {
            return {
                subAgentId: 'marcus-python',
                baseAgentId: 'marcus-backend',
                confidence: 0.6,
                reason: 'Fallback: Python file detected',
                fallback: true
            };
        }
        if (ext === 'rb') {
            return {
                subAgentId: 'marcus-rails',
                baseAgentId: 'marcus-backend',
                confidence: 0.6,
                reason: 'Fallback: Ruby file detected',
                fallback: true
            };
        }
        if (ext === 'go') {
            return {
                subAgentId: 'marcus-go',
                baseAgentId: 'marcus-backend',
                confidence: 0.6,
                reason: 'Fallback: Go file detected',
                fallback: true
            };
        }
        if (ext === 'java') {
            return {
                subAgentId: 'marcus-java',
                baseAgentId: 'marcus-backend',
                confidence: 0.6,
                reason: 'Fallback: Java file detected',
                fallback: true
            };
        }
        // Frontend extensions
        if (['tsx', 'jsx'].includes(ext || '')) {
            return {
                subAgentId: 'james-react',
                baseAgentId: 'james-frontend',
                confidence: 0.5,
                reason: 'Fallback: React component detected',
                fallback: true
            };
        }
        if (ext === 'vue') {
            return {
                subAgentId: 'james-vue',
                baseAgentId: 'james-frontend',
                confidence: 0.7,
                reason: 'Fallback: Vue component detected',
                fallback: true
            };
        }
        if (ext === 'svelte') {
            return {
                subAgentId: 'james-svelte',
                baseAgentId: 'james-frontend',
                confidence: 0.7,
                reason: 'Fallback: Svelte component detected',
                fallback: true
            };
        }
        // Default fallback to marcus-node
        return {
            subAgentId: 'marcus-node',
            baseAgentId: 'marcus-backend',
            confidence: 0.3,
            reason: 'Ultimate fallback: defaulting to Node.js',
            fallback: true
        };
    }
    /**
     * Fallback backend selection with content analysis
     */
    static fallbackBackendSelection(filePath, content) {
        // Check for backend-specific patterns
        if (content.includes('fastapi') || content.includes('django') || content.includes('flask')) {
            return {
                subAgentId: 'marcus-python',
                baseAgentId: 'marcus-backend',
                confidence: 0.8,
                reason: 'Python framework detected in content',
                fallback: true
            };
        }
        if (content.includes('express') || content.includes('fastify') || content.includes('nestjs')) {
            return {
                subAgentId: 'marcus-node',
                baseAgentId: 'marcus-backend',
                confidence: 0.8,
                reason: 'Node.js framework detected in content',
                fallback: true
            };
        }
        if (content.includes('Rails.application') || content.includes('ActiveRecord')) {
            return {
                subAgentId: 'marcus-rails',
                baseAgentId: 'marcus-backend',
                confidence: 0.8,
                reason: 'Rails framework detected in content',
                fallback: true
            };
        }
        if (content.includes('gin.') || content.includes('echo.')) {
            return {
                subAgentId: 'marcus-go',
                baseAgentId: 'marcus-backend',
                confidence: 0.8,
                reason: 'Go framework detected in content',
                fallback: true
            };
        }
        if (content.includes('@SpringBootApplication') || content.includes('org.springframework')) {
            return {
                subAgentId: 'marcus-java',
                baseAgentId: 'marcus-backend',
                confidence: 0.8,
                reason: 'Spring Boot detected in content',
                fallback: true
            };
        }
        // File extension fallback
        return this.fallbackSelection(filePath);
    }
    /**
     * Fallback frontend selection with content analysis
     */
    static fallbackFrontendSelection(filePath, content) {
        // Check for frontend-specific patterns
        if (content.includes('from \'react\'') || content.includes('import React')) {
            return {
                subAgentId: 'james-react',
                baseAgentId: 'james-frontend',
                confidence: 0.8,
                reason: 'React detected in content',
                fallback: true
            };
        }
        if (content.includes('from \'vue\'') || content.includes('Vue.')) {
            return {
                subAgentId: 'james-vue',
                baseAgentId: 'james-frontend',
                confidence: 0.8,
                reason: 'Vue detected in content',
                fallback: true
            };
        }
        if (content.includes('from \'next') || content.includes('next/')) {
            return {
                subAgentId: 'james-nextjs',
                baseAgentId: 'james-frontend',
                confidence: 0.8,
                reason: 'Next.js detected in content',
                fallback: true
            };
        }
        if (content.includes('@angular/') || content.includes('Angular')) {
            return {
                subAgentId: 'james-angular',
                baseAgentId: 'james-frontend',
                confidence: 0.8,
                reason: 'Angular detected in content',
                fallback: true
            };
        }
        if (content.includes('from \'svelte\'') || filePath.endsWith('.svelte')) {
            return {
                subAgentId: 'james-svelte',
                baseAgentId: 'james-frontend',
                confidence: 0.8,
                reason: 'Svelte detected in content',
                fallback: true
            };
        }
        // File extension fallback
        return this.fallbackSelection(filePath);
    }
    /**
     * Get all available sub-agents
     */
    static getAvailableSubAgents() {
        return {
            // Backend sub-agents
            'marcus-node': 'Node.js Backend Specialist',
            'marcus-python': 'Python Backend Specialist',
            'marcus-rails': 'Ruby on Rails Specialist',
            'marcus-go': 'Go Backend Specialist',
            'marcus-java': 'Java/Spring Boot Specialist',
            // Frontend sub-agents
            'james-react': 'React Frontend Specialist',
            'james-vue': 'Vue.js Frontend Specialist',
            'james-nextjs': 'Next.js Full-Stack Specialist',
            'james-angular': 'Angular Frontend Specialist',
            'james-svelte': 'Svelte Frontend Specialist'
        };
    }
    /**
     * Check if sub-agent exists
     */
    static isValidSubAgent(subAgentId) {
        return Object.keys(this.getAvailableSubAgents()).includes(subAgentId);
    }
}
SubAgentSelector.techStackCache = new Map();
SubAgentSelector.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
//# sourceMappingURL=sub-agent-selector.js.map