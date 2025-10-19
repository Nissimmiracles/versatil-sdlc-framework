/**
 * Tests for VERSATIL MCP Documentation Suggestions
 * Phase 3.3: Search Suggestions
 */

import {
  SuggestionsEngine,
  Suggestion,
  formatSuggestion,
  getBestSuggestion,
} from '../../src/mcp/docs-suggestions.js';

describe('SuggestionsEngine', () => {
  describe('auto-complete suggestions', () => {
    it('should suggest completions for partial terms', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('authentication');
      engine.indexTerm('authorization');
      engine.indexTerm('audit');

      const suggestions = engine.getSuggestions('auth', {
        includeCorrections: false,
        includeRelated: false,
      });

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.term === 'authentication')).toBe(true);
      expect(suggestions.some(s => s.term === 'authorization')).toBe(true);
      expect(suggestions.every(s => s.type === 'autocomplete')).toBe(true);
    });

    it('should rank completions by frequency', () => {
      const engine = new SuggestionsEngine();

      // Index 'test' 5 times
      for (let i = 0; i < 5; i++) {
        engine.indexTerm('testing');
      }
      // Index 'tests' 1 time
      engine.indexTerm('tests');

      const suggestions = engine.getSuggestions('test', {
        includeCorrections: false,
        includeRelated: false,
      });

      expect(suggestions.length).toBe(2);
      // 'testing' should rank higher due to frequency
      expect(suggestions[0].term).toBe('testing');
      expect(suggestions[0].score).toBeGreaterThan(suggestions[1].score);
    });

    it('should not suggest exact matches', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('authentication');

      const suggestions = engine.getSuggestions('authentication', {
        includeCorrections: false,
        includeRelated: false,
      });

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('typo corrections', () => {
    it('should suggest corrections for misspelled terms', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('authentication');
      engine.indexTerm('authorization');

      // Typo: 'authentiction' (missing 'a')
      const suggestions = engine.getSuggestions('authentiction', {
        includeAutocomplete: false,
        includeRelated: false,
      });

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.term === 'authentication')).toBe(true);
      expect(suggestions.every(s => s.type === 'correction')).toBe(true);
    });

    it('should calculate reasonable similarity scores', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('database');

      // Typo: 'databse' (1 character transposition)
      const suggestions = engine.getSuggestions('databse', {
        includeAutocomplete: false,
        includeRelated: false,
      });

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].score).toBeGreaterThan(0.7); // High similarity
    });

    it('should not suggest corrections for correct terms', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('authentication');

      const suggestions = engine.getSuggestions('authentication', {
        includeAutocomplete: false,
        includeRelated: false,
      });

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('related terms', () => {
    it('should suggest related terms from context', () => {
      const engine = new SuggestionsEngine();

      // Index terms with context
      engine.indexTerm('authentication', ['login', 'password', 'session']);
      engine.indexTerm('login', ['authentication', 'user']);
      engine.indexTerm('password', ['authentication', 'security']);

      const suggestions = engine.getSuggestions('authentication', {
        includeAutocomplete: false,
        includeCorrections: false,
      });

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.term === 'login')).toBe(true);
      expect(suggestions.some(s => s.term === 'password')).toBe(true);
      expect(suggestions.some(s => s.term === 'session')).toBe(true);
      expect(suggestions.every(s => s.type === 'related')).toBe(true);
    });

    it('should include source term in related suggestions', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('authentication', ['login', 'password']);

      const suggestions = engine.getSuggestions('authentication', {
        includeAutocomplete: false,
        includeCorrections: false,
      });

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every(s => s.source === 'authentication')).toBe(true);
    });
  });

  describe('combined suggestions', () => {
    it('should combine all suggestion types', () => {
      const engine = new SuggestionsEngine();

      engine.indexTerm('authentication', ['login', 'password']);
      engine.indexTerm('authorization', ['permission', 'access']);
      engine.indexTerm('audit', ['logging', 'tracking']);

      const suggestions = engine.getSuggestions('authentication');

      // Should have related terms for exact match
      const types = new Set(suggestions.map(s => s.type));
      expect(types.has('related')).toBe(true);
    });

    it('should respect maxSuggestions limit', () => {
      const engine = new SuggestionsEngine();

      for (let i = 0; i < 20; i++) {
        engine.indexTerm(`term${i}`);
      }

      const suggestions = engine.getSuggestions('term', { maxSuggestions: 5 });

      expect(suggestions).toHaveLength(5);
    });

    it('should filter by minimum score', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('authentication');
      engine.indexTerm('something-completely-different');

      const suggestions = engine.getSuggestions('auth', { minScore: 0.5 });

      // Should not include low-scoring suggestions
      expect(suggestions.every(s => s.score >= 0.5)).toBe(true);
    });
  });

  describe('statistics', () => {
    it('should provide accurate statistics', () => {
      const engine = new SuggestionsEngine();

      engine.indexTerm('authentication');
      engine.indexTerm('authentication'); // Duplicate
      engine.indexTerm('authorization');

      const stats = engine.getStatistics();

      expect(stats.totalTerms).toBe(2); // Unique terms
      expect(stats.totalOccurrences).toBe(3); // Total indexed
      expect(stats.averageFrequency).toBeGreaterThan(0);
    });

    it('should track term count', () => {
      const engine = new SuggestionsEngine();

      expect(engine.getTermCount()).toBe(0);

      engine.indexTerm('term1');
      expect(engine.getTermCount()).toBe(1);

      engine.indexTerm('term2');
      expect(engine.getTermCount()).toBe(2);

      engine.indexTerm('term1'); // Duplicate
      expect(engine.getTermCount()).toBe(2); // Still 2 unique
    });
  });

  describe('helper functions', () => {
    it('should format suggestions correctly', () => {
      const suggestion: Suggestion = {
        term: 'authentication',
        score: 0.85,
        type: 'autocomplete',
      };

      const formatted = formatSuggestion(suggestion);

      expect(formatted).toContain('🔍'); // Autocomplete emoji
      expect(formatted).toContain('authentication');
      expect(formatted).toContain('85%');
    });

    it('should format correction suggestions', () => {
      const suggestion: Suggestion = {
        term: 'authentication',
        score: 0.75,
        type: 'correction',
      };

      const formatted = formatSuggestion(suggestion);

      expect(formatted).toContain('📝'); // Correction emoji
    });

    it('should format related suggestions with source', () => {
      const suggestion: Suggestion = {
        term: 'login',
        score: 0.65,
        type: 'related',
        source: 'authentication',
      };

      const formatted = formatSuggestion(suggestion);

      expect(formatted).toContain('🔗'); // Related emoji
      expect(formatted).toContain('login');
      expect(formatted).toContain('authentication');
    });

    it('should get best suggestion', () => {
      const suggestions: Suggestion[] = [
        { term: 'term1', score: 0.5, type: 'autocomplete' },
        { term: 'term2', score: 0.9, type: 'autocomplete' },
        { term: 'term3', score: 0.7, type: 'autocomplete' },
      ];

      const best = getBestSuggestion(suggestions);

      expect(best).not.toBeNull();
      expect(best!.term).toBe('term2');
      expect(best!.score).toBe(0.9);
    });

    it('should return null for empty suggestions', () => {
      const best = getBestSuggestion([]);
      expect(best).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('authentication');

      const suggestions = engine.getSuggestions('');

      expect(suggestions).toHaveLength(0);
    });

    it('should handle special characters', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('test-term');
      engine.indexTerm('test_term');

      const suggestions = engine.getSuggestions('test');

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('Authentication');

      const suggestions = engine.getSuggestions('auth');

      expect(suggestions.some(s => s.term === 'authentication')).toBe(true);
    });

    it('should handle clear operation', () => {
      const engine = new SuggestionsEngine();
      engine.indexTerm('term1');
      engine.indexTerm('term2');

      expect(engine.getTermCount()).toBe(2);

      engine.clear();

      expect(engine.getTermCount()).toBe(0);
      const suggestions = engine.getSuggestions('term');
      expect(suggestions).toHaveLength(0);
    });
  });
});
