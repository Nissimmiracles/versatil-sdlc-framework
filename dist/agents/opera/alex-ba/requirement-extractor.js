/**
 * Requirement Extractor for Alex-BA
 * Automatically detects and extracts requirements from user messages and code
 */
import { EventEmitter } from 'events';
export class RequirementExtractor extends EventEmitter {
    constructor(config = {}) {
        super();
        // Feature request keywords (weighted by importance)
        this.FEATURE_KEYWORDS = {
            high: ['add feature', 'new feature', 'we need', 'implement', 'create', 'build'],
            medium: ['want', 'would like', 'should have', 'add support for', 'enable'],
            low: ['could use', 'nice to have', 'perhaps', 'maybe add']
        };
        // Requirement type indicators
        this.TYPE_INDICATORS = {
            feature: ['feature', 'functionality', 'capability', 'add'],
            enhancement: ['improve', 'better', 'enhance', 'optimize', 'upgrade'],
            'bug-fix': ['fix', 'bug', 'issue', 'broken', 'error', 'not working'],
            refactor: ['refactor', 'cleanup', 'reorganize', 'restructure'],
            documentation: ['document', 'docs', 'readme', 'guide', 'tutorial']
        };
        // Technical domain keywords
        this.DOMAIN_KEYWORDS = {
            auth: ['authentication', 'login', 'oauth', 'jwt', 'auth', 'sign in', 'sign up'],
            api: ['api', 'endpoint', 'rest', 'graphql', 'webhook'],
            ui: ['ui', 'interface', 'component', 'page', 'view', 'design'],
            database: ['database', 'db', 'sql', 'query', 'schema', 'model'],
            testing: ['test', 'testing', 'qa', 'coverage', 'e2e', 'integration test'],
            performance: ['performance', 'speed', 'optimize', 'fast', 'slow'],
            security: ['security', 'secure', 'vulnerability', 'encryption', 'ssl'],
            deployment: ['deploy', 'deployment', 'ci/cd', 'pipeline', 'release']
        };
        this.config = {
            minConfidence: 60, // 60% confidence minimum
            autoActivate: true,
            ...config
        };
    }
    /**
     * Extract feature request from user message
     */
    async extractFromMessage(message, context) {
        const lowerMessage = message.toLowerCase();
        // Calculate confidence score
        let confidence = 0;
        const detectedKeywords = [];
        // Check for high-confidence feature keywords
        for (const keyword of this.FEATURE_KEYWORDS.high) {
            if (lowerMessage.includes(keyword)) {
                confidence += 30;
                detectedKeywords.push(keyword);
            }
        }
        // Check for medium-confidence keywords
        for (const keyword of this.FEATURE_KEYWORDS.medium) {
            if (lowerMessage.includes(keyword)) {
                confidence += 15;
                detectedKeywords.push(keyword);
            }
        }
        // Check for low-confidence keywords
        for (const keyword of this.FEATURE_KEYWORDS.low) {
            if (lowerMessage.includes(keyword)) {
                confidence += 5;
                detectedKeywords.push(keyword);
            }
        }
        // Boost confidence if technical domain is mentioned
        const domainKeywords = [];
        for (const [domain, keywords] of Object.entries(this.DOMAIN_KEYWORDS)) {
            for (const keyword of keywords) {
                if (lowerMessage.includes(keyword)) {
                    confidence += 10;
                    domainKeywords.push(keyword);
                    break; // Only count once per domain
                }
            }
        }
        // Boost confidence if message is structured (has requirements)
        if (lowerMessage.match(/requirements?:|acceptance criteria:|user story:|as a .* i want/)) {
            confidence += 20;
            detectedKeywords.push('structured-requirement');
        }
        // Cap confidence at 100
        confidence = Math.min(100, confidence);
        // Determine requirement type
        const requirementType = this.determineRequirementType(lowerMessage);
        const detected = confidence >= this.config.minConfidence;
        if (!detected) {
            return {
                detected: false,
                confidence,
                keywords: detectedKeywords,
                requirementType: 'unknown'
            };
        }
        // Extract feature request details
        const featureRequest = {
            title: this.extractTitle(message),
            description: message,
            priority: this.inferPriority(message),
            keywords: [...detectedKeywords, ...domainKeywords],
            context: context?.codeContext || context?.filename || '',
            timestamp: Date.now()
        };
        const result = {
            detected: true,
            featureRequest,
            confidence,
            keywords: [...detectedKeywords, ...domainKeywords],
            requirementType
        };
        this.emit('requirement:detected', result);
        if (this.config.autoActivate && confidence >= 75) {
            this.emit('requirement:high-confidence', result);
        }
        return result;
    }
    /**
     * Extract requirements from code comments
     */
    async extractFromCode(filePath, content) {
        const results = [];
        // Extract TODO comments
        const todoPattern = /\/\/\s*TODO:?\s*(.+)|\/\*\s*TODO:?\s*(.+?)\s*\*\//gi;
        let match;
        while ((match = todoPattern.exec(content)) !== null) {
            const todoText = match[1] || match[2];
            const extraction = await this.extractFromMessage(todoText, { filename: filePath });
            if (extraction.detected) {
                results.push(extraction);
            }
        }
        // Extract FIXME comments
        const fixmePattern = /\/\/\s*FIXME:?\s*(.+)|\/\*\s*FIXME:?\s*(.+?)\s*\*\//gi;
        while ((match = fixmePattern.exec(content)) !== null) {
            const fixmeText = match[1] || match[2];
            const extraction = await this.extractFromMessage(fixmeText, { filename: filePath });
            if (extraction.detected) {
                extraction.requirementType = 'bug-fix';
                results.push(extraction);
            }
        }
        // Extract JSDoc/TypeScript comments with @requires or @feature tags
        const jsdocPattern = /\/\*\*[\s\S]*?@(requires?|feature):?\s*(.+?)[\s\S]*?\*\//gi;
        while ((match = jsdocPattern.exec(content)) !== null) {
            const requirementText = match[2];
            const extraction = await this.extractFromMessage(requirementText, { filename: filePath });
            if (extraction.detected) {
                results.push(extraction);
            }
        }
        return results;
    }
    /**
     * Extract feature title from message
     */
    extractTitle(message) {
        // Try to extract a concise title from the message
        const firstSentence = message.split(/[.!?]/)[0].trim();
        // Remove common prefix words
        let title = firstSentence
            .replace(/^(we need|i want|add|create|implement|build|please)\s+/i, '')
            .trim();
        // Capitalize first letter
        title = title.charAt(0).toUpperCase() + title.slice(1);
        // Limit length
        if (title.length > 80) {
            title = title.substring(0, 77) + '...';
        }
        return title || 'New Feature Request';
    }
    /**
     * Determine requirement type
     */
    determineRequirementType(message) {
        for (const [type, keywords] of Object.entries(this.TYPE_INDICATORS)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    return type;
                }
            }
        }
        return 'unknown';
    }
    /**
     * Infer priority from message content
     */
    inferPriority(message) {
        const lower = message.toLowerCase();
        if (lower.match(/critical|urgent|asap|emergency|blocker/)) {
            return 'P0';
        }
        if (lower.match(/important|high priority|soon|needed/)) {
            return 'P1';
        }
        if (lower.match(/nice to have|optional|low priority|eventually/)) {
            return 'P3';
        }
        return 'P2'; // Default to medium
    }
    /**
     * Batch extract from multiple messages
     */
    async extractFromBatch(messages) {
        const results = [];
        for (const message of messages) {
            const result = await this.extractFromMessage(message);
            if (result.detected) {
                results.push(result);
            }
        }
        return results;
    }
    /**
     * Get extraction statistics
     */
    getStats() {
        // This would track stats in a real implementation
        return {
            totalExtractions: 0,
            byType: {},
            averageConfidence: 0
        };
    }
}
//# sourceMappingURL=requirement-extractor.js.map