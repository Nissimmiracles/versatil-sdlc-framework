/**
 * Error Handling Tests for Documentation Tools
 * Tests malformed markdown, edge cases, and error recovery
 */

import { describe, it, expect } from '@jest/globals';
import { DocsFormatter } from '../../src/mcp/docs-formatter.js';

describe('DocsFormatter - Error Handling', () => {
  describe('Malformed Markdown', () => {
    it('should handle unterminated code blocks gracefully', () => {
      const malformed = '# Heading\n\n```typescript\nconst x = 1;\n'; // No closing ```

      expect(() => {
        DocsFormatter.extractCodeBlocks(malformed);
      }).not.toThrow();

      const blocks = DocsFormatter.extractCodeBlocks(malformed);
      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks.length).toBe(0); // Should return empty, not crash
    });

    it('should handle empty code blocks', () => {
      const empty = '# Doc\n\n```\n\n```\n';

      const blocks = DocsFormatter.extractCodeBlocks(empty);
      expect(Array.isArray(blocks)).toBe(true);
      // Empty blocks should be skipped
    });

    it('should handle excessively large code blocks', () => {
      const huge = '# Doc\n\n```js\n' + 'x'.repeat(150000) + '\n```';

      const blocks = DocsFormatter.extractCodeBlocks(huge);
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0].code.length).toBeLessThan(101000);
      expect(blocks[0].code).toContain('(truncated)');
    });

    it('should handle code blocks without language', () => {
      const noLang = '```\ncode here\n```';

      const blocks = DocsFormatter.extractCodeBlocks(noLang);
      expect(blocks.length).toBe(1);
      expect(blocks[0].language).toBe('text');
    });

    it('should handle multiple malformed blocks', () => {
      const multiple = `
# Doc

\`\`\`typescript
const x = 1;

\`\`\`python
print("hello")
\`\`\`

\`\`\`
code
\`\`\`
      `;

      expect(() => {
        DocsFormatter.extractCodeBlocks(multiple);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty markdown', () => {
      const blocks = DocsFormatter.extractCodeBlocks('');
      expect(blocks).toEqual([]);
    });

    it('should handle markdown with only whitespace', () => {
      const blocks = DocsFormatter.extractCodeBlocks('   \n\n  \n  ');
      expect(blocks).toEqual([]);
    });

    it('should handle special characters in code', () => {
      const special = '```js\nconst x = "<script>alert(1)</script>";\n```';

      const blocks = DocsFormatter.extractCodeBlocks(special);
      expect(blocks.length).toBe(1);
      expect(blocks[0].code).toContain('<script>');
    });

    it('should handle nested backticks in code', () => {
      const nested = '```md\n\\`\\`\\`js\ncode\n\\`\\`\\`\n```';

      expect(() => {
        DocsFormatter.extractCodeBlocks(nested);
      }).not.toThrow();
    });

    it('should handle unicode in code blocks', () => {
      const unicode = '```js\nconst emoji = "🚀🎯✅";\n```';

      const blocks = DocsFormatter.extractCodeBlocks(unicode);
      expect(blocks.length).toBe(1);
      expect(blocks[0].code).toContain('🚀');
    });
  });

  describe('Error Recovery', () => {
    it('should return empty array on regex timeout', () => {
      // Simulated malicious input that could cause ReDoS
      const malicious = '```\n' + '`'.repeat(10000) + '\n```';

      const start = Date.now();
      const blocks = DocsFormatter.extractCodeBlocks(malicious);
      const duration = Date.now() - start;

      // Should complete quickly (not hang)
      expect(duration).toBeLessThan(5000);
      expect(Array.isArray(blocks)).toBe(true);
    });

    it('should handle invalid UTF-8 sequences', () => {
      const invalidUtf8 = '```js\n' + 'test\uFFFD' + '\n```';

      expect(() => {
        DocsFormatter.extractCodeBlocks(invalidUtf8);
      }).not.toThrow();
    });

    it('should format markdown with broken syntax', () => {
      const broken = '# Heading\n\n## Sub\n\nContent';

      const formatted = DocsFormatter.formatForMCP(broken);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('MCP Formatting', () => {
    it('should remove HTML comments', () => {
      const withComments = '# Doc\n\n<!-- comment -->\n\nContent';

      const formatted = DocsFormatter.formatForMCP(withComments);
      expect(formatted).not.toContain('<!-- comment -->');
      expect(formatted).toContain('Content');
    });

    it('should handle malformed HTML comments', () => {
      const malformed = '# Doc\n\n<!-- unclosed comment\n\nContent';

      expect(() => {
        DocsFormatter.formatForMCP(malformed);
      }).not.toThrow();
    });

    it('should reduce excessive blank lines', () => {
      const excessive = 'Line 1\n\n\n\n\n\nLine 2';

      const formatted = DocsFormatter.formatForMCP(excessive);
      expect(formatted).not.toMatch(/\n{3,}/);
    });

    it('should trim whitespace', () => {
      const whitespace = '   \n# Heading\n\nContent\n\n   ';

      const formatted = DocsFormatter.formatForMCP(whitespace);
      expect(formatted).not.toMatch(/^\s+/);
      expect(formatted).not.toMatch(/\s+$/);
    });
  });
});
