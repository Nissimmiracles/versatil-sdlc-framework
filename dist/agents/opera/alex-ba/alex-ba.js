/**
 * VERSATIL SDLC Framework - Alex BA (Business Analyst)
 * Specialized in requirements analysis, user stories, acceptance criteria
 *
 * RAG-Enhanced: Learns from requirements patterns, user story templates, business rules
 */
import { RAGEnabledAgent } from '../../core/rag-enabled-agent.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class AlexBa extends RAGEnabledAgent {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'AlexBa';
        this.id = 'alex-ba';
        this.specialization = 'Business Analyst & Requirements Engineer';
        this.systemPrompt = 'Expert Business Analyst specializing in requirements analysis, user story creation, acceptance criteria definition, and stakeholder communication';
    }
    /**
     * BA-specific RAG configuration
     * Focus on requirements patterns, user story templates, business rules
     */
    getDefaultRAGConfig() {
        return {
            maxExamples: 4, // Good balance for requirements examples
            similarityThreshold: 0.80, // Higher precision for requirements
            agentDomain: 'business-analysis',
            enableLearning: true
        };
    }
    /**
     * BA-specific pattern analysis
     */
    async runPatternAnalysis(context) {
        const content = context.content || '';
        const filePath = context.filePath || '';
        const patterns = [];
        // User story patterns
        if (content.match(/as a|as an|I want|so that/i)) {
            patterns.push({
                type: 'user-story',
                message: 'User story format detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Acceptance criteria patterns
        if (content.match(/given|when|then|acceptance criteria|AC:/i)) {
            patterns.push({
                type: 'acceptance-criteria',
                message: 'Acceptance criteria (Gherkin format) detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Requirements patterns
        if (content.match(/shall|must|should|requirement|REQ-\d+/i)) {
            patterns.push({
                type: 'requirement',
                message: 'Formal requirement detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Business rule patterns
        if (content.match(/business rule|BR-\d+|policy|rule:/i)) {
            patterns.push({
                type: 'business-rule',
                message: 'Business rule detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Stakeholder communication patterns
        if (content.match(/stakeholder|customer|user feedback|interview|workshop/i)) {
            patterns.push({
                type: 'stakeholder-communication',
                message: 'Stakeholder communication or feedback detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Requirements traceability
        if (content.match(/traces to|depends on|related to|REQ-\d+.*→.*REQ-\d+/i)) {
            patterns.push({
                type: 'requirements-traceability',
                message: 'Requirements traceability link detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Ambiguous requirements (warning)
        if (content.match(/maybe|perhaps|possibly|might|could be|TBD|TODO/i)) {
            patterns.push({
                type: 'ambiguous-requirement',
                message: 'Ambiguous or incomplete requirement detected - needs clarification',
                severity: 'high',
                location: { file: filePath, line: 0 }
            });
        }
        return {
            patterns,
            score: patterns.filter(p => p.severity === 'high').length === 0 ? 90 : 75, // BA quality score
            summary: `Detected ${patterns.length} BA patterns`,
            recommendations: patterns
                .filter(p => p.severity === 'high' || p.severity === 'critical')
                .map(p => p.message)
        };
    }
    /**
     * Override activate to add BA-specific context
     */
    async activate(context) {
        // Call parent (RAGEnabledAgent) to get RAG-enhanced response
        const response = await super.activate(context);
        // Add BA-specific enhancements
        if (response.context) {
            response.context = {
                ...response.context,
                baInsights: {
                    userStoryDetected: context.content?.match(/as a|as an/i) !== null,
                    acceptanceCriteriaPresent: context.content?.match(/given|when|then/i) !== null,
                    requirementsFormality: this.assessRequirementsFormality(context.content || ''),
                    businessValueIdentified: context.content?.includes('business value') || false
                }
            };
        }
        // Add BA-specific suggestions if RAG context available
        const ragContext = context.ragContext;
        if (ragContext && ragContext.previousSolutions) {
            const baSuggestions = this.generateBASuggestions(ragContext, context);
            response.suggestions = [...(response.suggestions || []), ...baSuggestions];
        }
        // Determine handoffs
        response.handoffTo = this.determineHandoffs(context, response);
        return response;
    }
    /**
     * Assess requirements formality (low/medium/high)
     */
    assessRequirementsFormality(content) {
        const shallCount = (content.match(/shall/gi) || []).length;
        const mustCount = (content.match(/must/gi) || []).length;
        const formalCount = shallCount + mustCount;
        if (formalCount >= 5)
            return 'high';
        if (formalCount >= 2)
            return 'medium';
        return 'low';
    }
    /**
     * Generate BA-specific suggestions from RAG context
     */
    generateBASuggestions(ragContext, context) {
        const suggestions = [];
        // User story template suggestions
        if (context.content?.includes('user story') && ragContext.projectStandards.length > 0) {
            suggestions.push({
                type: 'user-story-template',
                message: 'Recommend using standard user story format: "As a [role], I want [feature], so that [benefit]"',
                priority: 'medium',
                file: context.filePath || 'requirements.md'
            });
        }
        // Acceptance criteria suggestions
        if (context.content?.includes('acceptance') && ragContext.previousSolutions['acceptance-criteria']) {
            suggestions.push({
                type: 'acceptance-criteria-format',
                message: 'Use Gherkin format for testable criteria: Given/When/Then',
                priority: 'medium',
                file: context.filePath || 'requirements.md'
            });
        }
        // Requirements traceability suggestions
        if (ragContext.agentExpertise.length > 0) {
            suggestions.push({
                type: 'requirements-traceability',
                message: 'Consider adding traceability links to related requirements and design documents',
                priority: 'low',
                file: context.filePath || 'requirements.md'
            });
        }
        // Ambiguity warnings
        if (context.content?.match(/maybe|perhaps|TBD/i)) {
            suggestions.push({
                type: 'ambiguity-warning',
                message: 'Ambiguous language detected - recommend scheduling stakeholder clarification session',
                priority: 'high',
                file: context.filePath || 'requirements.md'
            });
        }
        return suggestions;
    }
    /**
     * Determine which agents to hand off to
     */
    determineHandoffs(context, response) {
        const handoffs = [];
        // Hand off to Sarah PM for sprint planning
        if (context.content?.includes('sprint') || context.content?.includes('milestone')) {
            handoffs.push('sarah-pm');
        }
        // Hand off to James for UI/UX requirements
        if (context.content?.match(/UI|UX|interface|screen|page/i)) {
            handoffs.push('james-frontend');
        }
        // Hand off to Marcus for API/backend requirements
        if (context.content?.match(/API|endpoint|database|backend/i)) {
            handoffs.push('marcus-backend');
        }
        // Hand off to Maria for quality/testing requirements
        if (context.content?.match(/test|quality|acceptance criteria/i)) {
            handoffs.push('maria-qa');
        }
        return handoffs;
    }
    /**
     * Get base prompt template for BA
     */
    getBasePromptTemplate() {
        return `You are Alex BA, an expert Business Analyst specializing in requirements engineering.
Your role is to analyze requirements, create user stories, define acceptance criteria, and ensure stakeholder alignment.
Focus on clear, testable requirements and business value articulation.`;
    }
    /**
     * Generate domain-specific handoffs based on analysis
     */
    generateDomainHandoffs(analysis) {
        const handoffs = [];
        // Check if ambiguous requirements need PM attention
        if (analysis.patterns.some(p => p.type === 'ambiguous-requirement')) {
            handoffs.push('sarah-pm');
        }
        // Check if technical requirements need technical leads
        if (analysis.patterns.some(p => p.type === 'requirement' && p.message.includes('API'))) {
            handoffs.push('marcus-backend');
        }
        if (analysis.patterns.some(p => p.type === 'requirement' && p.message.includes('UI'))) {
            handoffs.push('james-frontend');
        }
        return handoffs;
    }
    /**
     * NEW v6.1: Initialize PRD template
     */
    async initializePRD(options) {
        try {
            const templatePath = path.join(__dirname, 'templates', 'prd-template.md');
            const template = await fs.readFile(templatePath, 'utf-8');
            // Replace placeholders
            const content = template
                .replace(/\[Project Name\]/g, options.projectName)
                .replace(/\[YYYY-MM-DD\]/g, new Date().toISOString().split('T')[0]);
            // Determine output path
            const outputPath = options.outputPath || `./docs/prd/${options.projectName.toLowerCase().replace(/\s+/g, '-')}-prd.md`;
            const outputDir = path.dirname(outputPath);
            // Ensure directory exists
            await fs.mkdir(outputDir, { recursive: true });
            // Write file
            await fs.writeFile(outputPath, content, 'utf-8');
            console.log(`[Alex-BA] PRD template initialized at: ${outputPath}`);
            return { success: true, filePath: outputPath };
        }
        catch (error) {
            console.error('[Alex-BA] Failed to initialize PRD:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * NEW v6.1: Initialize BRD template
     */
    async initializeBRD(options) {
        try {
            const templatePath = path.join(__dirname, 'templates', 'brd-template.md');
            const template = await fs.readFile(templatePath, 'utf-8');
            // Replace placeholders
            const content = template
                .replace(/\[Project Name\]/g, options.projectName)
                .replace(/\[YYYY-MM-DD\]/g, new Date().toISOString().split('T')[0]);
            // Determine output path
            const outputPath = options.outputPath || `./docs/brd/${options.projectName.toLowerCase().replace(/\s+/g, '-')}-brd.md`;
            const outputDir = path.dirname(outputPath);
            // Ensure directory exists
            await fs.mkdir(outputDir, { recursive: true });
            // Write file
            await fs.writeFile(outputPath, content, 'utf-8');
            console.log(`[Alex-BA] BRD template initialized at: ${outputPath}`);
            return { success: true, filePath: outputPath };
        }
        catch (error) {
            console.error('[Alex-BA] Failed to initialize BRD:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * NEW v6.1: Initialize User Story template
     */
    async initializeUserStory(options) {
        try {
            const templatePath = path.join(__dirname, 'templates', 'user-story-template.md');
            const template = await fs.readFile(templatePath, 'utf-8');
            // Replace placeholders
            const content = template
                .replace(/US-\[Number\]/g, options.storyId)
                .replace(/\[Epic Name\/ID\]/g, options.epicName || '[Epic Name]')
                .replace(/\[YYYY-MM-DD\]/g, new Date().toISOString().split('T')[0]);
            // Determine output path
            const outputPath = options.outputPath || `./docs/user-stories/${options.storyId.toLowerCase()}.md`;
            const outputDir = path.dirname(outputPath);
            // Ensure directory exists
            await fs.mkdir(outputDir, { recursive: true });
            // Write file
            await fs.writeFile(outputPath, content, 'utf-8');
            console.log(`[Alex-BA] User Story template initialized at: ${outputPath}`);
            return { success: true, filePath: outputPath };
        }
        catch (error) {
            console.error('[Alex-BA] Failed to initialize User Story:', error);
            return { success: false, error: error.message };
        }
    }
}
//# sourceMappingURL=alex-ba.js.map