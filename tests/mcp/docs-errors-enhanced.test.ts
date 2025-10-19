/**
 * Tests for Enhanced VERSATIL MCP Documentation Error Messages
 * Phase 3.4: Better Error Messages
 */

import {
  DocsSearchError,
  DocsErrorCodes,
  ErrorSeverity,
  ErrorCategory,
  formatErrorForConsole,
  isRecoverableError,
  getCategoryDisplayName,
} from '../../src/mcp/docs-errors.js';

describe('Enhanced DocsSearchError', () => {
  describe('error metadata', () => {
    it('should include severity for each error code', () => {
      const error = new DocsSearchError(
        'Test error',
        DocsErrorCodes.DOCUMENT_NOT_FOUND,
        { path: 'test.md' }
      );

      expect(error.severity).toBeDefined();
      expect(Object.values(ErrorSeverity)).toContain(error.severity);
    });

    it('should include category for each error code', () => {
      const error = new DocsSearchError(
        'Test error',
        DocsErrorCodes.PATH_TRAVERSAL_BLOCKED
      );

      expect(error.category).toBeDefined();
      expect(Object.values(ErrorCategory)).toContain(error.category);
    });

    it('should include suggestions for each error code', () => {
      const error = new DocsSearchError(
        'Test error',
        DocsErrorCodes.FILE_TOO_LARGE,
        { size: 15 * 1024 * 1024, maxSize: 10 * 1024 * 1024 }
      );

      expect(error.suggestions).toBeDefined();
      expect(error.suggestions.length).toBeGreaterThan(0);
      expect(error.suggestions[0]).toHaveProperty('message');
    });
  });

  describe('user-friendly messages', () => {
    it('should generate user-friendly message for DOCUMENT_NOT_FOUND', () => {
      const error = new DocsSearchError(
        'Technical message',
        DocsErrorCodes.DOCUMENT_NOT_FOUND,
        { path: 'missing-doc.md' }
      );

      expect(error.userMessage).toContain('missing-doc.md');
      expect(error.userMessage).toContain('not found');
    });

    it('should generate user-friendly message for FILE_TOO_LARGE', () => {
      const error = new DocsSearchError(
        'Technical message',
        DocsErrorCodes.FILE_TOO_LARGE,
        { size: 15 * 1024 * 1024, maxSize: 10 * 1024 * 1024 }
      );

      expect(error.userMessage).toContain('15MB');
      expect(error.userMessage).toContain('10MB');
    });

    it('should generate user-friendly message for PATH_TRAVERSAL_BLOCKED', () => {
      const error = new DocsSearchError(
        'Technical message',
        DocsErrorCodes.PATH_TRAVERSAL_BLOCKED,
        { path: '../../../etc/passwd' }
      );

      expect(error.userMessage).toContain('traversal');
      expect(error.userMessage).toContain('blocked');
    });
  });

  describe('formatted error messages', () => {
    it('should include severity emoji in formatted message', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.PATH_TRAVERSAL_BLOCKED
      );

      const formatted = error.getUserFriendlyMessage();

      // Should include critical emoji
      expect(formatted).toMatch(/🚨/);
    });

    it('should include suggestions in formatted message', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.INDEX_NOT_BUILT
      );

      const formatted = error.getUserFriendlyMessage();

      expect(formatted).toContain('💡 Suggestions:');
      expect(formatted).toContain('buildIndex()');
    });

    it('should include action steps in formatted message', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.FILE_NOT_READABLE,
        { path: 'test.md' }
      );

      const formatted = error.getUserFriendlyMessage();

      expect(formatted).toContain('→'); // Action indicator
      expect(formatted).toContain('permissions');
    });

    it('should include links when available', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.MALFORMED_MARKDOWN,
        { path: 'bad.md' }
      );

      const formatted = error.getUserFriendlyMessage();

      expect(formatted).toContain('📖'); // Link indicator
      expect(formatted).toMatch(/https?:\/\//);
    });
  });

  describe('error categorization', () => {
    it('should categorize DOCUMENT_NOT_FOUND as DOCUMENT_ACCESS', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.DOCUMENT_NOT_FOUND
      );

      expect(error.category).toBe(ErrorCategory.DOCUMENT_ACCESS);
    });

    it('should categorize PATH_TRAVERSAL_BLOCKED as SECURITY', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.PATH_TRAVERSAL_BLOCKED
      );

      expect(error.category).toBe(ErrorCategory.SECURITY);
    });

    it('should categorize FILE_TOO_LARGE as SIZE_LIMIT', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.FILE_TOO_LARGE
      );

      expect(error.category).toBe(ErrorCategory.SIZE_LIMIT);
    });

    it('should categorize INDEX_NOT_BUILT as INDEX', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.INDEX_NOT_BUILT
      );

      expect(error.category).toBe(ErrorCategory.INDEX);
    });
  });

  describe('severity levels', () => {
    it('should assign CRITICAL severity to security threats', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.PATH_TRAVERSAL_BLOCKED
      );

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should assign ERROR severity to access issues', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.DOCUMENT_NOT_FOUND
      );

      expect(error.severity).toBe(ErrorSeverity.ERROR);
    });

    it('should assign WARNING severity to size limit issues', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.FILE_TOO_LARGE
      );

      expect(error.severity).toBe(ErrorSeverity.WARNING);
    });
  });

  describe('helper functions', () => {
    it('should format error for console output', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.DOCUMENT_NOT_FOUND,
        { path: 'test.md' }
      );

      const formatted = formatErrorForConsole(error);

      expect(formatted).toContain('test.md');
      expect(formatted).toContain('💡 Suggestions:');
    });

    it('should identify recoverable errors', () => {
      const warning = new DocsSearchError(
        'Test',
        DocsErrorCodes.MALFORMED_MARKDOWN
      );

      expect(isRecoverableError(warning)).toBe(true);
    });

    it('should identify non-recoverable errors', () => {
      const critical = new DocsSearchError(
        'Test',
        DocsErrorCodes.PATH_TRAVERSAL_BLOCKED
      );

      expect(isRecoverableError(critical)).toBe(false);
    });

    it('should get category display name', () => {
      const name = getCategoryDisplayName(ErrorCategory.SECURITY);

      expect(name).toBe('Security');
    });
  });

  describe('JSON serialization', () => {
    it('should serialize error to JSON', () => {
      const error = new DocsSearchError(
        'Technical message',
        DocsErrorCodes.INDEX_BUILD_FAILED,
        { error: 'Permission denied' }
      );

      const json = error.toJSON();

      expect(json).toHaveProperty('code', DocsErrorCodes.INDEX_BUILD_FAILED);
      expect(json).toHaveProperty('severity');
      expect(json).toHaveProperty('category');
      expect(json).toHaveProperty('suggestions');
      expect(json).toHaveProperty('userMessage');
      expect(json).toHaveProperty('details');
    });

    it('should include all error metadata in JSON', () => {
      const error = new DocsSearchError(
        'Test',
        DocsErrorCodes.PATH_OUTSIDE_DOCS,
        { path: '/etc/passwd' }
      );

      const json = error.toJSON();

      expect(json.severity).toBe(ErrorSeverity.ERROR);
      expect(json.category).toBe(ErrorCategory.SECURITY);
      expect(json.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('all error codes', () => {
    it('should have metadata for all error codes', () => {
      const codes = Object.values(DocsErrorCodes);

      codes.forEach(code => {
        const error = new DocsSearchError('Test', code);

        expect(error.severity).toBeDefined();
        expect(error.category).toBeDefined();
        expect(error.suggestions).toBeDefined();
        expect(error.userMessage).toBeDefined();
      });
    });

    it('should have at least one suggestion for each error code', () => {
      const codes = Object.values(DocsErrorCodes);

      codes.forEach(code => {
        const error = new DocsSearchError('Test', code);

        expect(error.suggestions.length).toBeGreaterThan(0);
      });
    });
  });
});
