/**
 * Search Suggestions for VERSATIL MCP Documentation Tools
 *
 * Provides intelligent search suggestions including:
 * - Auto-complete based on indexed terms
 * - Typo correction using fuzzy matching
 * - Related search terms
 *
 * Part of Phase 3.3: User Experience Enhancements
 */
/**
 * Suggestion with relevance score
 */
export interface Suggestion {
    term: string;
    score: number;
    type: 'autocomplete' | 'correction' | 'related';
    source?: string;
}
/**
 * Suggestion options
 */
export interface SuggestionOptions {
    maxSuggestions?: number;
    minScore?: number;
    includeAutocomplete?: boolean;
    includeCorrections?: boolean;
    includeRelated?: boolean;
}
/**
 * Search Suggestions Engine
 */
export declare class SuggestionsEngine {
    private terms;
    private termFrequency;
    private relatedTerms;
    constructor();
    /**
     * Index a term for suggestions
     */
    indexTerm(term: string, context?: string[]): void;
    /**
     * Get suggestions for a query
     */
    getSuggestions(query: string, options?: SuggestionOptions): Suggestion[];
    /**
     * Get auto-complete suggestions
     */
    private getAutocompleteSuggestions;
    /**
     * Get typo corrections using fuzzy matching
     */
    private getTypoCorrections;
    /**
     * Get related search terms
     */
    private getRelatedTerms;
    /**
     * Calculate auto-complete score
     */
    private calculateAutocompleteScore;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance;
    /**
     * Normalize term for comparison
     */
    private normalizeTerm;
    /**
     * Clear all indexed terms
     */
    clear(): void;
    /**
     * Get total number of indexed terms
     */
    getTermCount(): number;
    /**
     * Get statistics about indexed terms
     */
    getStatistics(): {
        totalTerms: number;
        totalOccurrences: number;
        averageFrequency: number;
        relatedTermsCount: number;
    };
}
/**
 * Helper function to format suggestions for display
 */
export declare function formatSuggestion(suggestion: Suggestion): string;
/**
 * Helper function to get best suggestion
 */
export declare function getBestSuggestion(suggestions: Suggestion[]): Suggestion | null;
