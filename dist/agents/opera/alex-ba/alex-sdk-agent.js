/**
 * Alex-BA SDK Agent
 * SDK-native version of Alex BA that uses Claude Agent SDK for execution
 * while preserving all existing business analysis functionality
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import { AlexBa } from './alex-ba.js';
export class AlexSDKAgent extends SDKAgentAdapter {
    constructor(vectorStore) {
        super({
            agentId: 'alex-ba',
            vectorStore,
            model: 'sonnet'
        });
        // Keep legacy agent for specialized methods
        this.legacyAgent = new AlexBa(vectorStore);
    }
    /**
     * Override activate to add Alex-specific enhancements
     */
    async activate(context) {
        // 1. Run SDK activation (core analysis)
        const response = await super.activate(context);
        // 2. Add BA-specific insights to context
        if (response.context) {
            response.context = {
                ...response.context,
                baInsights: {
                    userStoryDetected: this.detectUserStory(context.content || ''),
                    acceptanceCriteriaPresent: this.detectAcceptanceCriteria(context.content || ''),
                    businessRulesPresent: this.detectBusinessRules(context.content || ''),
                    requirementsFormat: this.detectRequirementsFormat(context.content || ''),
                    traceabilityPresent: this.detectTraceability(context.content || '')
                },
                requirementsQuality: this.assessRequirementsQuality(context.content || '')
            };
        }
        // 3. Add BA-specific suggestions
        const baSuggestions = this.generateBASuggestions(context);
        if (baSuggestions.length > 0) {
            response.suggestions = [...(response.suggestions || []), ...baSuggestions];
        }
        // 4. Determine handoffs for requirements coordination
        const handoffs = this.determineBAHandoffs(context, response);
        if (handoffs.length > 0) {
            response.handoffTo = [...(response.handoffTo || []), ...handoffs];
        }
        return response;
    }
    /**
     * Detect user story format
     */
    detectUserStory(content) {
        return content.match(/as a|as an|I want|so that/i) !== null;
    }
    /**
     * Detect acceptance criteria (Gherkin format)
     */
    detectAcceptanceCriteria(content) {
        return content.match(/given|when|then|acceptance criteria|AC:/i) !== null;
    }
    /**
     * Detect business rules
     */
    detectBusinessRules(content) {
        return content.match(/business rule|BR-\d+|policy|rule:/i) !== null;
    }
    /**
     * Detect requirements format
     */
    detectRequirementsFormat(content) {
        if (content.match(/as a|as an|I want|so that/i))
            return 'user-story';
        if (content.match(/shall|must|should|requirement|REQ-\d+/i))
            return 'formal';
        if (content.match(/given|when|then/i))
            return 'gherkin';
        return 'unstructured';
    }
    /**
     * Detect traceability links
     */
    detectTraceability(content) {
        return content.match(/traces to|depends on|related to|REQ-\d+.*→.*REQ-\d+/i) !== null;
    }
    /**
     * Assess requirements quality
     */
    assessRequirementsQuality(content) {
        let score = 100;
        const issues = [];
        // Check for user story format
        if (content.match(/as a|as an/i) && !content.match(/I want/i)) {
            score -= 20;
            issues.push('User story missing "I want" clause');
        }
        // Check for acceptance criteria
        if (content.match(/user story|story/i) && !content.match(/acceptance criteria|given|when|then/i)) {
            score -= 15;
            issues.push('User story missing acceptance criteria');
        }
        // Check for vague language
        if (content.match(/maybe|possibly|might|could be|etc\./i)) {
            score -= 10;
            issues.push('Requirements contain vague language');
        }
        // Check for testability
        if (content.match(/requirement|shall|must/i) && !content.match(/measure|verify|test|validate/i)) {
            score -= 10;
            issues.push('Requirements may not be testable');
        }
        return { score: Math.max(0, score), issues };
    }
    /**
     * Generate BA-specific suggestions
     */
    generateBASuggestions(context) {
        const suggestions = [];
        const content = context.content || '';
        // User story format suggestions
        if (content.match(/as a|as an/i) && !content.match(/I want/i)) {
            suggestions.push({
                type: 'user-story-format',
                message: 'Complete user story format: "As a [role], I want [feature], so that [benefit]"',
                priority: 'high',
                file: context.filePath || 'requirements'
            });
        }
        // Acceptance criteria suggestions
        if (content.match(/user story/i) && !content.match(/acceptance criteria|given|when|then/i)) {
            suggestions.push({
                type: 'acceptance-criteria',
                message: 'Add acceptance criteria using Given/When/Then format for testability',
                priority: 'high',
                file: context.filePath || 'requirements'
            });
        }
        // Requirements traceability suggestions
        if (content.match(/requirement|REQ-\d+/i) && !content.match(/traces to|depends on/i)) {
            suggestions.push({
                type: 'requirements-traceability',
                message: 'Add traceability links to related requirements and test cases',
                priority: 'medium',
                file: context.filePath || 'requirements'
            });
        }
        // Stakeholder validation suggestions
        if (content.match(/requirement|user story/i) && !content.match(/validated|approved|reviewed/i)) {
            suggestions.push({
                type: 'stakeholder-validation',
                message: 'Ensure requirements are validated with stakeholders before implementation',
                priority: 'high',
                file: context.filePath || 'requirements'
            });
        }
        // Business rules suggestions
        if (content.match(/if|when|unless/i) && !content.match(/business rule|BR-/i)) {
            suggestions.push({
                type: 'business-rules',
                message: 'Consider documenting conditional logic as explicit business rules',
                priority: 'medium',
                file: context.filePath || 'business-rules'
            });
        }
        return suggestions;
    }
    /**
     * Determine BA-specific handoffs
     */
    determineBAHandoffs(context, response) {
        const handoffs = [];
        const content = context.content || '';
        // Hand off to Sarah-PM for sprint planning
        if (content.match(/epic|milestone|release/i)) {
            handoffs.push('sarah-pm');
        }
        // Hand off to Maria-QA for acceptance criteria validation
        if (content.match(/acceptance criteria|test/i)) {
            handoffs.push('maria-qa');
        }
        // Hand off to Marcus for backend requirements
        if (content.match(/api|database|backend|service/i)) {
            handoffs.push('marcus-backend');
        }
        // Hand off to James for UI/UX requirements
        if (content.match(/ui|ux|interface|screen|page/i)) {
            handoffs.push('james-frontend');
        }
        return handoffs;
    }
    /**
     * Extract user stories from content
     */
    extractUserStories(content) {
        const stories = [];
        const storyPattern = /as\s+a(?:n)?\s+([\w\s]+),?\s+I\s+want\s+([\w\s]+)(?:,?\s+so\s+that\s+([\w\s]+))?/gi;
        let match;
        while ((match = storyPattern.exec(content)) !== null) {
            stories.push({
                role: match[1].trim(),
                want: match[2].trim(),
                benefit: match[3]?.trim() || 'unspecified',
                format: 'user-story'
            });
        }
        return stories;
    }
    /**
     * Extract acceptance criteria
     */
    extractAcceptanceCriteria(content) {
        const criteria = [];
        const criteriaPattern = /(?:given|when|then)\s+([^\n]+)/gi;
        let match;
        let currentCriterion = {};
        while ((match = criteriaPattern.exec(content)) !== null) {
            const line = match[0].trim();
            if (line.toLowerCase().startsWith('given')) {
                if (Object.keys(currentCriterion).length > 0) {
                    criteria.push(currentCriterion);
                }
                currentCriterion = { given: match[1].trim(), when: '', then: '' };
            }
            else if (line.toLowerCase().startsWith('when')) {
                currentCriterion.when = match[1].trim();
            }
            else if (line.toLowerCase().startsWith('then')) {
                currentCriterion.then = match[1].trim();
            }
        }
        if (Object.keys(currentCriterion).length > 0) {
            criteria.push(currentCriterion);
        }
        return criteria;
    }
    /**
     * Extract business rules
     */
    extractBusinessRules(content) {
        const rules = [];
        const rulePattern = /(?:business rule|BR-\d+|rule:)\s*([^\n]+)/gi;
        let match;
        while ((match = rulePattern.exec(content)) !== null) {
            rules.push({
                id: match[0].match(/BR-\d+/)?.[0] || `BR-${rules.length + 1}`,
                description: match[1].trim(),
                type: 'business-rule'
            });
        }
        return rules;
    }
    /**
     * Validate user story format
     */
    validateUserStory(story) {
        const issues = [];
        if (!story.role || story.role === 'unspecified') {
            issues.push('Missing role definition');
        }
        if (!story.want || story.want === 'unspecified') {
            issues.push('Missing feature/want clause');
        }
        if (!story.benefit || story.benefit === 'unspecified') {
            issues.push('Missing benefit/so that clause');
        }
        return {
            valid: issues.length === 0,
            issues
        };
    }
    /**
     * Generate requirements document
     */
    generateRequirementsDocument(requirements) {
        return {
            documentId: requirements.id || `REQ-DOC-${Date.now()}`,
            title: requirements.title || 'Requirements Document',
            userStories: requirements.userStories || [],
            acceptanceCriteria: requirements.acceptanceCriteria || [],
            businessRules: requirements.businessRules || [],
            functionalRequirements: requirements.functionalRequirements || [],
            nonFunctionalRequirements: requirements.nonFunctionalRequirements || [],
            constraints: requirements.constraints || [],
            assumptions: requirements.assumptions || [],
            dependencies: requirements.dependencies || [],
            traceabilityMatrix: requirements.traceabilityMatrix || []
        };
    }
}
//# sourceMappingURL=alex-sdk-agent.js.map