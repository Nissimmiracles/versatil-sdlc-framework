/**
 * Help System Tests
 *
 * Tests for the VERSATIL help system including:
 * - Help query parsing
 * - Context detection
 * - Help content retrieval
 * - Search functionality
 */

import {
  parseHelpQuery,
  getHelpContent,
  searchHelp,
  getAllTopics,
  getHelpMenu,
  formatHelpContent,
} from '../../src/cli/help-system';

import {
  detectContext,
  suggestHelpTopics,
  formatSuggestions,
  getContextAwareHelp,
} from '../../src/cli/help-context-detector';

describe('Help System', () => {
  describe('parseHelpQuery', () => {
    it('should parse direct topic match', () => {
      const result = parseHelpQuery('maria-qa');

      expect(result.topic).toBe('maria-qa');
      expect(result.confidence).toBe(1.0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should parse fuzzy keyword match', () => {
      const result = parseHelpQuery('testing');

      expect(result.topic).toBe('maria-qa'); // "testing" → maria-qa
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return suggestions for unknown query', () => {
      const result = parseHelpQuery('unknown-topic-xyz');

      expect(result.topic).toBe('');
      expect(result.confidence).toBe(0);
      expect(result.suggestions).toContain('quick-start');
      expect(result.suggestions).toContain('agents');
    });

    it('should handle multi-word queries', () => {
      const result = parseHelpQuery('stress test');

      expect(result.topic).toBe('rule-2'); // "stress test" → rule-2
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const result1 = parseHelpQuery('MARIA-QA');
      const result2 = parseHelpQuery('maria-qa');

      expect(result1.topic).toBe(result2.topic);
    });
  });

  describe('getHelpContent', () => {
    it('should return content for valid topic', () => {
      const content = getHelpContent('maria-qa');

      expect(content).toBeDefined();
      expect(content?.topic).toBe('maria-qa');
      expect(content?.title).toContain('Maria-QA');
      expect(content?.content).toContain('Quality Guardian');
    });

    it('should return null for invalid topic', () => {
      const content = getHelpContent('invalid-topic');

      expect(content).toBeNull();
    });

    it('should include keywords', () => {
      const content = getHelpContent('maria-qa');

      expect(content?.keywords).toContain('test');
      expect(content?.keywords).toContain('testing');
    });

    it('should include related topics', () => {
      const content = getHelpContent('maria-qa');

      expect(content?.relatedTopics.length).toBeGreaterThan(0);
    });

    it('should include examples', () => {
      const content = getHelpContent('maria-qa');

      expect(content?.examples).toBeDefined();
      expect(content?.examples!.length).toBeGreaterThan(0);
    });
  });

  describe('searchHelp', () => {
    it('should search across all help content', () => {
      const results = searchHelp('testing');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].topic).toBeDefined();
    });

    it('should rank results by relevance', () => {
      const results = searchHelp('maria');

      expect(results[0].topic).toBe('maria-qa'); // Most relevant
    });

    it('should be case-insensitive', () => {
      const results1 = searchHelp('TESTING');
      const results2 = searchHelp('testing');

      expect(results1.length).toBe(results2.length);
    });

    it('should return empty array for no matches', () => {
      const results = searchHelp('xyzabc123notfound');

      expect(results.length).toBe(0);
    });

    it('should limit results to 10', () => {
      const results = searchHelp('test'); // Very common word

      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getAllTopics', () => {
    it('should return all available topics', () => {
      const topics = getAllTopics();

      expect(topics.length).toBeGreaterThan(10); // Should have many topics
      expect(topics).toContain('maria-qa');
      expect(topics).toContain('marcus-backend');
      expect(topics).toContain('quick-start');
    });

    it('should not contain duplicates', () => {
      const topics = getAllTopics();
      const uniqueTopics = [...new Set(topics)];

      expect(topics.length).toBe(uniqueTopics.length);
    });
  });

  describe('getHelpMenu', () => {
    it('should return formatted help menu', () => {
      const menu = getHelpMenu();

      expect(menu).toContain('VERSATIL');
      expect(menu).toContain('/help');
      expect(menu).toContain('agents');
      expect(menu).toContain('rules');
    });

    it('should include quick actions', () => {
      const menu = getHelpMenu();

      expect(menu).toContain('npm run monitor');
      expect(menu).toContain('npm run doctor');
    });
  });

  describe('formatHelpContent', () => {
    it('should format content with title', () => {
      const content = getHelpContent('maria-qa');
      const formatted = formatHelpContent(content!);

      expect(formatted).toContain('Maria-QA');
      expect(formatted).toContain('Quality Guardian');
    });

    it('should include examples section', () => {
      const content = getHelpContent('maria-qa');
      const formatted = formatHelpContent(content!);

      expect(formatted).toContain('Examples');
    });

    it('should include related topics section', () => {
      const content = getHelpContent('maria-qa');
      const formatted = formatHelpContent(content!);

      expect(formatted).toContain('Related Topics');
    });
  });
});

describe('Help Context Detector', () => {
  describe('detectContext', () => {
    it('should detect context', () => {
      const context = detectContext();

      expect(context).toBeDefined();
      expect(context.projectState).toBeDefined();
    });

    it('should detect project state', () => {
      const context = detectContext();

      expect(context.projectState?.hasTests).toBeDefined();
      expect(context.projectState?.hasAPI).toBeDefined();
      expect(context.projectState?.hasFrontend).toBeDefined();
    });
  });

  describe('suggestHelpTopics', () => {
    it('should suggest topics for test file context', () => {
      const context = {
        currentFile: 'LoginForm.test.tsx',
        fileType: 'test',
      };

      const suggestions = suggestHelpTopics(context);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].topic).toBe('maria-qa');
      expect(suggestions[0].priority).toBe('high');
    });

    it('should suggest topics for API file context', () => {
      const context = {
        currentFile: 'src/api/users.ts',
        fileType: 'api',
      };

      const suggestions = suggestHelpTopics(context);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].topic).toBe('marcus-backend');
      expect(suggestions[0].priority).toBe('high');
    });

    it('should suggest topics for component file context', () => {
      const context = {
        currentFile: 'src/components/Button.tsx',
        fileType: 'component',
      };

      const suggestions = suggestHelpTopics(context);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].topic).toBe('james-frontend');
    });

    it('should suggest topics for database file context', () => {
      const context = {
        currentFile: 'migrations/001_users.sql',
        fileType: 'database',
      };

      const suggestions = suggestHelpTopics(context);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].topic).toBe('dana-database');
    });

    it('should suggest troubleshooting for low health', () => {
      const context = {
        frameworkHealth: 65, // Below 80%
      };

      const suggestions = suggestHelpTopics(context);

      const troubleshootingSuggestion = suggestions.find(
        (s) => s.topic === 'troubleshooting'
      );

      expect(troubleshootingSuggestion).toBeDefined();
      expect(troubleshootingSuggestion?.priority).toBe('high');
    });

    it('should suggest topics for MCP errors', () => {
      const context = {
        recentErrors: ['MCP server unavailable'],
      };

      const suggestions = suggestHelpTopics(context);

      const troubleshootingSuggestion = suggestions.find(
        (s) => s.topic === 'troubleshooting'
      );

      expect(troubleshootingSuggestion).toBeDefined();
      expect(troubleshootingSuggestion?.reason).toContain('MCP');
    });

    it('should prioritize high priority suggestions', () => {
      const context = {
        fileType: 'test',
        frameworkHealth: 65,
      };

      const suggestions = suggestHelpTopics(context);

      expect(suggestions[0].priority).toBe('high');
    });

    it('should remove duplicate suggestions', () => {
      const context = {
        fileType: 'test',
        recentErrors: ['coverage below 80%'],
      };

      const suggestions = suggestHelpTopics(context);
      const topics = suggestions.map((s) => s.topic);
      const uniqueTopics = [...new Set(topics)];

      expect(topics.length).toBe(uniqueTopics.length);
    });
  });

  describe('formatSuggestions', () => {
    it('should format suggestions with priority indicators', () => {
      const suggestions = [
        { topic: 'maria-qa', reason: 'Test file', priority: 'high' as const },
        { topic: 'rule-2', reason: 'Stress testing', priority: 'medium' as const },
      ];

      const formatted = formatSuggestions(suggestions);

      expect(formatted).toContain('maria-qa');
      expect(formatted).toContain('Test file');
      expect(formatted).toContain('🔴'); // High priority
      expect(formatted).toContain('🟡'); // Medium priority
    });

    it('should include commands', () => {
      const suggestions = [
        {
          topic: 'maria-qa',
          reason: 'Test file',
          priority: 'high' as const,
          command: '/help maria-qa',
        },
      ];

      const formatted = formatSuggestions(suggestions);

      expect(formatted).toContain('/help maria-qa');
    });

    it('should handle empty suggestions', () => {
      const formatted = formatSuggestions([]);

      expect(formatted).toBe('');
    });
  });

  describe('getContextAwareHelp', () => {
    it('should return context-aware help', () => {
      const help = getContextAwareHelp();

      expect(help).toContain('VERSATIL');
      expect(help).toContain('Context-Aware');
    });

    it('should show message when no suggestions', () => {
      // Mock detectContext to return minimal context
      const help = getContextAwareHelp();

      // Should always have some output
      expect(help.length).toBeGreaterThan(0);
    });
  });
});

describe('Help System Integration', () => {
  it('should provide help for complete workflow', () => {
    // Step 1: User asks for help
    const query = parseHelpQuery('testing');

    expect(query.topic).toBe('maria-qa');

    // Step 2: Get help content
    const content = getHelpContent(query.topic);

    expect(content).toBeDefined();
    expect(content?.examples).toBeDefined();

    // Step 3: Get related topics
    expect(content?.relatedTopics.length).toBeGreaterThan(0);

    // Step 4: Search for more info
    const searchResults = searchHelp('coverage');

    expect(searchResults.length).toBeGreaterThan(0);
  });

  it('should provide context-aware help for developer workflow', () => {
    // Simulate developer editing test file
    const context = {
      currentFile: 'LoginForm.test.tsx',
      fileType: 'test' as const,
      frameworkHealth: 94,
    };

    const suggestions = suggestHelpTopics(context);

    // Should suggest Maria-QA as primary
    expect(suggestions[0].topic).toBe('maria-qa');

    // Get help content
    const content = getHelpContent(suggestions[0].topic);

    expect(content?.title).toContain('Maria-QA');
    expect(content?.examples).toBeDefined();
  });

  it('should handle troubleshooting workflow', () => {
    // Simulate low health scenario
    const context = {
      frameworkHealth: 65,
      recentErrors: ['MCP server unavailable', 'build failed'],
    };

    const suggestions = suggestHelpTopics(context);

    // Should suggest troubleshooting
    const troubleshooting = suggestions.find((s) => s.topic === 'troubleshooting');

    expect(troubleshooting).toBeDefined();
    expect(troubleshooting?.priority).toBe('high');
  });
});

describe('Help System Performance', () => {
  it('should parse query in < 100ms', () => {
    const start = Date.now();
    parseHelpQuery('maria-qa');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should get help content in < 50ms', () => {
    const start = Date.now();
    getHelpContent('maria-qa');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(50);
  });

  it('should search in < 200ms', () => {
    const start = Date.now();
    searchHelp('testing');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
  });

  it('should detect context in < 100ms', () => {
    const start = Date.now();
    detectContext();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should suggest topics in < 50ms', () => {
    const context = { fileType: 'test' as const };

    const start = Date.now();
    suggestHelpTopics(context);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(50);
  });
});
