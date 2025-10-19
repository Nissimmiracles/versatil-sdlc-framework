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
export class SuggestionsEngine {
  private terms: Set<string>;
  private termFrequency: Map<string, number>;
  private relatedTerms: Map<string, Set<string>>;

  constructor() {
    this.terms = new Set();
    this.termFrequency = new Map();
    this.relatedTerms = new Map();
  }

  /**
   * Index a term for suggestions
   */
  indexTerm(term: string, context?: string[]): void {
    const normalized = this.normalizeTerm(term);
    this.terms.add(normalized);

    // Update frequency
    const current = this.termFrequency.get(normalized) || 0;
    this.termFrequency.set(normalized, current + 1);

    // Index related terms from context
    if (context && context.length > 0) {
      if (!this.relatedTerms.has(normalized)) {
        this.relatedTerms.set(normalized, new Set());
      }
      const related = this.relatedTerms.get(normalized)!;
      context.forEach(ctx => related.add(this.normalizeTerm(ctx)));
    }
  }

  /**
   * Get suggestions for a query
   */
  getSuggestions(query: string, options: SuggestionOptions = {}): Suggestion[] {
    const {
      maxSuggestions = 5,
      minScore = 0.3,
      includeAutocomplete = true,
      includeCorrections = true,
      includeRelated = true,
    } = options;

    const normalized = this.normalizeTerm(query);

    // Return empty array for empty query
    if (!normalized) {
      return [];
    }

    const suggestions: Suggestion[] = [];

    // Auto-complete suggestions
    if (includeAutocomplete) {
      const autocomplete = this.getAutocompleteSuggestions(normalized);
      suggestions.push(...autocomplete);
    }

    // Typo corrections
    if (includeCorrections && !this.terms.has(normalized)) {
      const corrections = this.getTypoCorrections(normalized);
      suggestions.push(...corrections);
    }

    // Related terms
    if (includeRelated && this.terms.has(normalized)) {
      const related = this.getRelatedTerms(normalized);
      suggestions.push(...related);
    }

    // Filter by minimum score and sort by score descending
    return suggestions
      .filter(s => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }

  /**
   * Get auto-complete suggestions
   */
  private getAutocompleteSuggestions(query: string): Suggestion[] {
    const suggestions: Suggestion[] = [];

    for (const term of this.terms) {
      if (term.startsWith(query) && term !== query) {
        const frequency = this.termFrequency.get(term) || 0;
        const score = this.calculateAutocompleteScore(query, term, frequency);
        suggestions.push({
          term,
          score,
          type: 'autocomplete',
        });
      }
    }

    return suggestions;
  }

  /**
   * Get typo corrections using fuzzy matching
   */
  private getTypoCorrections(query: string): Suggestion[] {
    const suggestions: Suggestion[] = [];

    for (const term of this.terms) {
      const distance = this.levenshteinDistance(query, term);
      const maxDistance = Math.floor(query.length / 3); // Allow 1 error per 3 chars

      if (distance > 0 && distance <= maxDistance) {
        const score = 1 - (distance / query.length);
        suggestions.push({
          term,
          score,
          type: 'correction',
        });
      }
    }

    return suggestions;
  }

  /**
   * Get related search terms
   */
  private getRelatedTerms(query: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const related = this.relatedTerms.get(query);

    if (related) {
      for (const term of related) {
        const frequency = this.termFrequency.get(term) || 0;
        // Related terms get a base score of 0.6, with frequency bonus
        const score = Math.min(0.6 + (frequency * 0.02), 0.9);
        suggestions.push({
          term,
          score,
          type: 'related',
          source: query,
        });
      }
    }

    return suggestions;
  }

  /**
   * Calculate auto-complete score
   */
  private calculateAutocompleteScore(query: string, term: string, frequency: number): number {
    // Base score: prefer terms that are close in length to query
    // Shorter terms score higher (less to type)
    const lengthRatio = query.length / term.length;
    const baseScore = 0.5 + (lengthRatio * 0.3); // 0.5-0.8 range

    // Frequency bonus (more frequent = higher score)
    const frequencyBonus = Math.min(frequency * 0.05, 0.4); // Up to 0.4

    return Math.min(baseScore + frequencyBonus, 1.0);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Initialize first column
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    // Initialize first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Normalize term for comparison
   */
  private normalizeTerm(term: string): string {
    return term.toLowerCase().trim();
  }

  /**
   * Clear all indexed terms
   */
  clear(): void {
    this.terms.clear();
    this.termFrequency.clear();
    this.relatedTerms.clear();
  }

  /**
   * Get total number of indexed terms
   */
  getTermCount(): number {
    return this.terms.size;
  }

  /**
   * Get statistics about indexed terms
   */
  getStatistics() {
    const frequencies = Array.from(this.termFrequency.values());
    const totalFrequency = frequencies.reduce((sum, freq) => sum + freq, 0);
    const avgFrequency = frequencies.length > 0 ? totalFrequency / frequencies.length : 0;

    return {
      totalTerms: this.terms.size,
      totalOccurrences: totalFrequency,
      averageFrequency: Math.round(avgFrequency * 100) / 100,
      relatedTermsCount: this.relatedTerms.size,
    };
  }
}

/**
 * Helper function to format suggestions for display
 */
export function formatSuggestion(suggestion: Suggestion): string {
  const emoji = {
    autocomplete: '🔍',
    correction: '📝',
    related: '🔗',
  }[suggestion.type];

  const score = Math.round(suggestion.score * 100);
  let text = `${emoji} ${suggestion.term} (${score}%)`;

  if (suggestion.source) {
    text += ` ← ${suggestion.source}`;
  }

  return text;
}

/**
 * Helper function to get best suggestion
 */
export function getBestSuggestion(suggestions: Suggestion[]): Suggestion | null {
  if (suggestions.length === 0) {
    return null;
  }

  // Sort by score descending
  const sorted = [...suggestions].sort((a, b) => b.score - a.score);
  return sorted[0];
}
