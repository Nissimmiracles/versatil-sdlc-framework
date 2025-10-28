/**
 * Template Matcher Service - Template Automation
 *
 * Automatically matches feature descriptions to plan templates using:
 * - Keyword matching algorithm
 * - Category detection
 * - Complexity scoring
 * - Explicit template selection support
 *
 * Templates Location: templates/plan-templates/*.yaml
 *
 * @module src/templates/template-matcher
 */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { VERSATILLogger } from '../utils/logger.js';
// ============================================================================
// Template Matcher Service
// ============================================================================
export class TemplateMatcher {
    constructor() {
        this.templates = new Map();
        this.templatesLoaded = false;
        // Stopwords to filter out from keyword matching
        this.stopwords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
            'may', 'might', 'can', 'add', 'create', 'build', 'implement', 'make'
        ]);
        this.logger = new VERSATILLogger();
        this.templatesDir = path.join(process.cwd(), 'templates', 'plan-templates');
    }
    /**
     * Load all YAML templates from templates directory
     */
    async loadTemplates() {
        if (this.templatesLoaded)
            return;
        try {
            this.logger.info('Loading plan templates', { dir: this.templatesDir }, 'template-matcher');
            const files = fs.readdirSync(this.templatesDir);
            const yamlFiles = files.filter(f => f.endsWith('.yaml') && f !== 'README.md');
            for (const file of yamlFiles) {
                const filePath = path.join(this.templatesDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const template = yaml.load(content);
                const templateName = file.replace('.yaml', '');
                this.templates.set(templateName, template);
                this.logger.info(`Loaded template: ${template.name}`, {
                    keywords: template.keywords,
                    category: template.category
                }, 'template-matcher');
            }
            this.templatesLoaded = true;
            this.logger.info(`Loaded ${this.templates.size} templates`, {}, 'template-matcher');
        }
        catch (error) {
            this.logger.error('Failed to load templates', { error }, 'template-matcher');
            throw error;
        }
    }
    /**
     * Match feature description to best template
     */
    async matchTemplate(options) {
        await this.loadTemplates();
        // Handle explicit template selection
        if (options.explicit_template) {
            return this.matchExplicitTemplate(options.explicit_template);
        }
        // Auto-match based on description
        return this.autoMatchTemplate(options.description);
    }
    /**
     * Match explicit template selection (--template=NAME)
     */
    matchExplicitTemplate(templateName) {
        const template = this.templates.get(templateName);
        if (!template) {
            this.logger.warn(`Template not found: ${templateName}`, {}, 'template-matcher');
            return {
                best_match: null,
                all_matches: [],
                use_template: false,
                reason: `Template "${templateName}" not found. Available: ${Array.from(this.templates.keys()).join(', ')}`
            };
        }
        const match = {
            template_name: templateName,
            template_path: path.join(this.templatesDir, `${templateName}.yaml`),
            match_score: 100, // Explicit selection = perfect match
            matched_keywords: template.keywords,
            category: template.category,
            estimated_effort: template.estimated_effort,
            complexity: template.complexity
        };
        return {
            best_match: match,
            all_matches: [match],
            use_template: true,
            reason: `Explicitly selected template: ${template.name}`
        };
    }
    /**
     * Auto-match template based on keyword similarity
     */
    autoMatchTemplate(description) {
        const descTokens = this.tokenize(description);
        const matches = [];
        // Score each template
        for (const [templateName, template] of this.templates.entries()) {
            const score = this.calculateMatchScore(descTokens, template);
            if (score > 0) {
                matches.push({
                    template_name: templateName,
                    template_path: path.join(this.templatesDir, `${templateName}.yaml`),
                    match_score: score,
                    matched_keywords: this.getMatchedKeywords(descTokens, template.keywords),
                    category: template.category,
                    estimated_effort: template.estimated_effort,
                    complexity: template.complexity
                });
            }
        }
        // Sort by score descending
        matches.sort((a, b) => b.match_score - a.match_score);
        // Threshold for using template (70%)
        const threshold = 70;
        const bestMatch = matches[0];
        const useTemplate = bestMatch && bestMatch.match_score >= threshold;
        return {
            best_match: useTemplate ? bestMatch : null,
            all_matches: matches,
            use_template: !!useTemplate,
            reason: useTemplate
                ? `Matched template "${bestMatch.template_name}" with ${bestMatch.match_score}% confidence`
                : matches.length > 0
                    ? `Best match "${matches[0].template_name}" (${matches[0].match_score}%) below threshold (${threshold}%). Using agent research.`
                    : 'No template matches found. Using agent research for custom feature.'
        };
    }
    /**
     * Calculate match score for a template
     */
    calculateMatchScore(descTokens, template) {
        const templateKeywords = template.keywords.map(k => k.toLowerCase());
        // Count keyword overlaps
        const matchedCount = descTokens.filter(token => templateKeywords.some(kw => kw.includes(token) || token.includes(kw))).length;
        // Base score: percentage of matched keywords
        let score = (matchedCount / templateKeywords.length) * 100;
        // Boost for exact name match
        const templateNameTokens = this.tokenize(template.name);
        const exactNameMatch = templateNameTokens.some(nt => descTokens.some(dt => dt === nt));
        if (exactNameMatch) {
            score += 30;
        }
        // Boost for category keyword match
        const categoryTokens = this.tokenize(template.category);
        const categoryMatch = categoryTokens.some(ct => descTokens.some(dt => dt === ct));
        if (categoryMatch) {
            score += 20;
        }
        // Cap at 100
        return Math.min(100, Math.round(score));
    }
    /**
     * Get list of matched keywords
     */
    getMatchedKeywords(descTokens, templateKeywords) {
        const matched = [];
        const normalizedKeywords = templateKeywords.map(k => k.toLowerCase());
        for (const token of descTokens) {
            for (const keyword of normalizedKeywords) {
                if (keyword.includes(token) || token.includes(keyword)) {
                    matched.push(keyword);
                }
            }
        }
        return [...new Set(matched)]; // Deduplicate
    }
    /**
     * Tokenize description (lowercase, remove stopwords)
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .split(/\s+/)
            .filter(token => token.length > 2 && !this.stopwords.has(token));
    }
    /**
     * Load specific template by name
     */
    async loadTemplate(templateName) {
        await this.loadTemplates();
        return this.templates.get(templateName) || null;
    }
    /**
     * Get all available template names
     */
    async getAvailableTemplates() {
        await this.loadTemplates();
        return Array.from(this.templates.keys());
    }
    /**
     * Calculate effort adjustment based on complexity
     */
    calculateEffortAdjustment(baseEffort, complexityDiff, customRequirements) {
        let adjustedHours = baseEffort;
        let confidenceReduction = 0;
        // Adjust for complexity difference
        if (complexityDiff === 'higher') {
            adjustedHours *= 1.3; // +30%
            confidenceReduction += 10;
        }
        else if (complexityDiff === 'lower') {
            adjustedHours *= 0.8; // -20%
            confidenceReduction += 5;
        }
        // Adjust for custom requirements
        const customCount = customRequirements.length;
        if (customCount > 0) {
            adjustedHours += customCount * 2; // +2 hours per custom requirement
            confidenceReduction += customCount * 5;
        }
        // Calculate range (±20%)
        const variance = adjustedHours * 0.2;
        const min = Math.max(1, Math.round(adjustedHours - variance));
        const max = Math.round(adjustedHours + variance);
        return {
            hours: Math.round(adjustedHours),
            range: `${min}-${max}`,
            confidence: Math.max(50, 90 - confidenceReduction)
        };
    }
}
// ============================================================================
// Singleton Export
// ============================================================================
export const templateMatcher = new TemplateMatcher();
//# sourceMappingURL=template-matcher.js.map