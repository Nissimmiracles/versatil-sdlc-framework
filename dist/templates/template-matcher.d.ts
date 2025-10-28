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
export interface TemplateMatch {
    template_name: string;
    template_path: string;
    match_score: number;
    matched_keywords: string[];
    category: string;
    estimated_effort: {
        hours: number;
        range: string;
        confidence: number;
    };
    complexity: 'Small' | 'Medium' | 'Large' | 'XL';
}
export interface TemplateMatchResult {
    best_match: TemplateMatch | null;
    all_matches: TemplateMatch[];
    use_template: boolean;
    reason: string;
}
export interface PlanTemplate {
    name: string;
    category: string;
    keywords: string[];
    estimated_effort: {
        hours: number;
        range: string;
        confidence: number;
    };
    complexity: string;
    description?: string;
    phases: {
        database?: any;
        api?: any;
        frontend?: any;
        testing?: any;
    };
    success_metrics?: string[];
    risks?: any;
    alternative_approaches?: any[];
}
export declare class TemplateMatcher {
    private logger;
    private templates;
    private templatesLoaded;
    private templatesDir;
    private stopwords;
    constructor();
    /**
     * Load all YAML templates from templates directory
     */
    private loadTemplates;
    /**
     * Match feature description to best template
     */
    matchTemplate(options: {
        description: string;
        explicit_template?: string;
    }): Promise<TemplateMatchResult>;
    /**
     * Match explicit template selection (--template=NAME)
     */
    private matchExplicitTemplate;
    /**
     * Auto-match template based on keyword similarity
     */
    private autoMatchTemplate;
    /**
     * Calculate match score for a template
     */
    private calculateMatchScore;
    /**
     * Get list of matched keywords
     */
    private getMatchedKeywords;
    /**
     * Tokenize description (lowercase, remove stopwords)
     */
    private tokenize;
    /**
     * Load specific template by name
     */
    loadTemplate(templateName: string): Promise<PlanTemplate | null>;
    /**
     * Get all available template names
     */
    getAvailableTemplates(): Promise<string[]>;
    /**
     * Calculate effort adjustment based on complexity
     */
    calculateEffortAdjustment(baseEffort: number, complexityDiff: string, customRequirements: string[]): {
        hours: number;
        range: string;
        confidence: number;
    };
}
export declare const templateMatcher: TemplateMatcher;
