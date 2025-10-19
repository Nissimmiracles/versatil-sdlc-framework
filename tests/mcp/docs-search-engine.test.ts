/**
 * Unit tests for DocsSearchEngine
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { DocsSearchEngine, DocCategory } from '../../src/mcp/docs-search-engine.js';
import path from 'path';

describe('DocsSearchEngine', () => {
  let searchEngine: DocsSearchEngine;
  const projectPath = path.join(process.cwd());

  beforeAll(async () => {
    searchEngine = new DocsSearchEngine(projectPath);
    await searchEngine.buildIndex();
  });

  describe('buildIndex', () => {
    it('should build documentation index successfully', async () => {
      const index = await searchEngine.getIndex();
      expect(index).toBeDefined();
      expect(index.length).toBeGreaterThan(0);
    });

    it('should index documents with required metadata', async () => {
      const index = await searchEngine.getIndex();
      const doc = index[0];

      expect(doc).toHaveProperty('filePath');
      expect(doc).toHaveProperty('relativePath');
      expect(doc).toHaveProperty('title');
      expect(doc).toHaveProperty('category');
      expect(doc).toHaveProperty('size');
      expect(doc).toHaveProperty('lastModified');
      expect(doc).toHaveProperty('keywords');
    });

    it('should extract meaningful titles from documents', async () => {
      const index = await searchEngine.getIndex();
      index.forEach(doc => {
        expect(doc.title).toBeTruthy();
        expect(doc.title.length).toBeGreaterThan(0);
      });
    });

    it('should categorize documents correctly', async () => {
      const index = await searchEngine.getIndex();
      const validCategories: DocCategory[] = [
        'agents', 'workflows', 'rules', 'mcp', 'guides',
        'troubleshooting', 'quick-reference', 'architecture',
        'testing', 'security', 'completion'
      ];

      index.forEach(doc => {
        expect(validCategories).toContain(doc.category as DocCategory);
      });
    });

    it('should extract keywords from documents', async () => {
      const index = await searchEngine.getIndex();
      index.forEach(doc => {
        expect(doc.keywords).toBeDefined();
        expect(Array.isArray(doc.keywords)).toBe(true);
      });
    });
  });

  describe('search', () => {
    it('should find documents by title keywords', async () => {
      const results = await searchEngine.search('maria');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.title.toLowerCase()).toContain('maria');
    });

    it('should find documents by content keywords', async () => {
      const results = await searchEngine.search('testing quality');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return results sorted by relevance', async () => {
      const results = await searchEngine.search('workflow');

      if (results.length > 1) {
        // First result should have higher or equal relevance score
        expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1].relevanceScore);
      }
    });

    it('should filter by category when specified', async () => {
      const results = await searchEngine.search('agent', 'agents');

      if (results.length > 0) {
        results.forEach(result => {
          expect(result.document.category).toBe('agents');
        });
      }
    });

    it('should return empty array for non-existent terms', async () => {
      const results = await searchEngine.search('xyznonexistentterm12345');
      expect(results).toEqual([]);
    });

    it('should handle multi-word queries', async () => {
      const results = await searchEngine.search('opera agent workflow');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should extract relevant excerpts', async () => {
      const results = await searchEngine.search('maria qa testing');

      if (results.length > 0) {
        expect(results[0].excerpt).toBeDefined();
        expect(results[0].excerpt.length).toBeGreaterThan(0);
      }
    });

    it('should return top 10 results maximum', async () => {
      const results = await searchEngine.search('agent');
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should include match count in results', async () => {
      const results = await searchEngine.search('workflow');

      if (results.length > 0) {
        expect(results[0].matchCount).toBeGreaterThan(0);
      }
    });
  });

  describe('getDocument', () => {
    it('should retrieve full document content', async () => {
      const index = await searchEngine.getIndex();
      const relativePath = index[0].relativePath;

      const content = await searchEngine.getDocument(relativePath);
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent document', async () => {
      await expect(
        searchEngine.getDocument('non-existent-path.md')
      ).rejects.toThrow('Document not found');
    });
  });

  describe('getDocumentsByCategory', () => {
    it('should return all documents in category', async () => {
      const workflows = await searchEngine.getDocumentsByCategory('workflows');

      workflows.forEach(doc => {
        expect(doc.category).toBe('workflows');
      });
    });

    it('should return empty array for category with no documents', async () => {
      // Assuming 'all' is not a real category in the file system
      const results = await searchEngine.getDocumentsByCategory('testing');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return all documents when category is "all"', async () => {
      const allDocs = await searchEngine.getDocumentsByCategory('all');
      const index = await searchEngine.getIndex();

      expect(allDocs.length).toBe(index.length);
    });

    it('should sort results alphabetically by title', async () => {
      const guides = await searchEngine.getDocumentsByCategory('guides');

      if (guides.length > 1) {
        for (let i = 0; i < guides.length - 1; i++) {
          expect(guides[i].title.localeCompare(guides[i + 1].title)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe('extractExcerpt', () => {
    it('should extract context around query terms', () => {
      const content = `
Line 1: Introduction to the system
Line 2: This talks about workflow patterns
Line 3: And agent coordination
Line 4: Additional context
Line 5: More information here
      `;

      const excerpt = searchEngine.extractExcerpt(content, ['workflow', 'agent'], 1);

      expect(excerpt).toContain('workflow');
      expect(excerpt.length).toBeGreaterThan(0);
    });

    it('should add ellipsis when truncating', () => {
      const content = Array(100).fill('Line content here').join('\n');
      const queryTerms = ['content'];

      const excerpt = searchEngine.extractExcerpt(content, queryTerms, 3);
      expect(excerpt).toMatch(/\.\.\./);
    });

    it('should return first lines if no matches found', () => {
      const content = `Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6`;
      const excerpt = searchEngine.extractExcerpt(content, ['nonexistent'], 2);

      expect(excerpt).toContain('Line 1');
      expect(excerpt).toContain('...');
    });
  });

  describe('performance', () => {
    it('should build index in reasonable time', async () => {
      const newEngine = new DocsSearchEngine(projectPath);
      const startTime = Date.now();

      await newEngine.buildIndex();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should search efficiently', async () => {
      const startTime = Date.now();

      await searchEngine.search('agent workflow testing');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('edge cases', () => {
    it('should handle empty query gracefully', async () => {
      const results = await searchEngine.search('');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle special characters in query', async () => {
      const results = await searchEngine.search('agent-workflow');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const lowerResults = await searchEngine.search('maria');
      const upperResults = await searchEngine.search('MARIA');

      // Should find same or similar documents
      if (lowerResults.length > 0 && upperResults.length > 0) {
        expect(lowerResults[0].document.title).toBe(upperResults[0].document.title);
      }
    });

    it('should handle queries with multiple spaces', async () => {
      const results = await searchEngine.search('agent    workflow    testing');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle very long queries', async () => {
      const longQuery = 'agent '.repeat(50);
      const results = await searchEngine.search(longQuery);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('relevance scoring', () => {
    it('should prioritize title matches over content matches', async () => {
      const results = await searchEngine.search('workflow');

      if (results.length > 1) {
        const titleMatch = results.find(r =>
          r.document.title.toLowerCase().includes('workflow')
        );

        if (titleMatch) {
          // Title matches should have higher scores
          expect(titleMatch.relevanceScore).toBeGreaterThan(5);
        }
      }
    });

    it('should weight keyword matches appropriately', async () => {
      const results = await searchEngine.search('testing');

      if (results.length > 0) {
        // Should have relevance score reflecting keyword weight
        expect(results[0].relevanceScore).toBeGreaterThan(0);
      }
    });
  });

  describe('concurrent access', () => {
    it('should handle concurrent searches', async () => {
      const searches = [
        searchEngine.search('maria'),
        searchEngine.search('james'),
        searchEngine.search('marcus'),
        searchEngine.search('workflow'),
        searchEngine.search('testing'),
      ];

      const results = await Promise.all(searches);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle concurrent document retrievals', async () => {
      const index = await searchEngine.getIndex();
      const paths = index.slice(0, 3).map(doc => doc.relativePath);

      const retrievals = paths.map(path => searchEngine.getDocument(path));
      const contents = await Promise.all(retrievals);

      expect(contents).toHaveLength(paths.length);
      contents.forEach(content => {
        expect(typeof content).toBe('string');
        expect(content.length).toBeGreaterThan(0);
      });
    });
  });
});
