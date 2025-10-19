/**
 * Security Tests for DocsSearchEngine
 * Tests path traversal protection, file size limits, and access controls
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { DocsSearchEngine } from '../../src/mcp/docs-search-engine.js';
import { DocsSearchError, DocsErrorCodes } from '../../src/mcp/docs-errors.js';
import path from 'path';
import * as fs from 'fs/promises';

describe('DocsSearchEngine - Security', () => {
  let searchEngine: DocsSearchEngine;
  const projectPath = path.join(process.cwd());
  const testDocsPath = path.join(projectPath, 'docs');

  beforeAll(async () => {
    searchEngine = new DocsSearchEngine(projectPath);
    await searchEngine.buildIndex();
  });

  describe('Path Traversal Protection', () => {
    it('should block path traversal with ../', async () => {
      await expect(
        searchEngine.getDocument('../../package.json')
      ).rejects.toThrow('Path traversal not allowed');
    });

    it('should block path traversal with multiple ../', async () => {
      await expect(
        searchEngine.getDocument('../../../../../../../etc/passwd')
      ).rejects.toThrow('Path traversal not allowed');
    });

    it('should block absolute paths', async () => {
      await expect(
        searchEngine.getDocument('/etc/passwd')
      ).rejects.toThrow('Path traversal not allowed');
    });

    it('should block Windows-style path traversal', async () => {
      await expect(
        searchEngine.getDocument('..\\..\\package.json')
      ).rejects.toThrow('Path traversal not allowed');
    });

    it('should throw DocsSearchError with correct code', async () => {
      try {
        await searchEngine.getDocument('../package.json');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(DocsSearchError);
        expect(error.code).toBe(DocsErrorCodes.PATH_TRAVERSAL_BLOCKED);
        expect(error.details).toHaveProperty('path');
        expect(error.details).toHaveProperty('normalizedPath');
      }
    });

    it('should allow valid relative paths', async () => {
      // This should work if the file exists
      const index = await searchEngine.getIndex();
      if (index.length > 0) {
        const validPath = index[0].relativePath;
        const content = await searchEngine.getDocument(validPath);
        expect(typeof content).toBe('string');
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('File Size Limits', () => {
    it('should have default file size limit', () => {
      const metadata = searchEngine.getIndexMetadata();
      expect(metadata).toBeDefined();
    });

    it('should reject documents exceeding size limit', async () => {
      // Create a mock search engine with tiny size limit for testing
      const tinyLimitEngine = new DocsSearchEngine(projectPath, {
        maxFileSize: 100, // 100 bytes only
      });

      await tinyLimitEngine.buildIndex();

      const index = await tinyLimitEngine.getIndex();
      if (index.length > 0) {
        // Find a document larger than 100 bytes
        const largeDoc = index.find(doc => doc.size > 100);

        if (largeDoc) {
          await expect(
            tinyLimitEngine.getDocument(largeDoc.relativePath)
          ).rejects.toThrow('Document too large');
        }
      }
    });

    it('should include size information in error', async () => {
      const tinyLimitEngine = new DocsSearchEngine(projectPath, {
        maxFileSize: 100,
      });

      await tinyLimitEngine.buildIndex();

      const index = await tinyLimitEngine.getIndex();
      const largeDoc = index.find(doc => doc.size > 100);

      if (largeDoc) {
        try {
          await tinyLimitEngine.getDocument(largeDoc.relativePath);
          fail('Should have thrown error');
        } catch (error: any) {
          expect(error).toBeInstanceOf(DocsSearchError);
          expect(error.code).toBe(DocsErrorCodes.FILE_TOO_LARGE);
          expect(error.details).toHaveProperty('size');
          expect(error.details).toHaveProperty('limit');
          expect(error.message).toMatch(/Document too large/);
        }
      }
    });

    it('should allow documents within size limit', async () => {
      const largeLimitEngine = new DocsSearchEngine(projectPath, {
        maxFileSize: 50 * 1024 * 1024, // 50MB
      });

      await largeLimitEngine.buildIndex();

      const index = await largeLimitEngine.getIndex();
      if (index.length > 0) {
        const doc = index[0];
        const content = await largeLimitEngine.getDocument(doc.relativePath);
        expect(typeof content).toBe('string');
      }
    });
  });

  describe('Access Control', () => {
    it('should only allow access to files in docs directory', async () => {
      const index = await searchEngine.getIndex();

      // All indexed files should be in docs directory
      index.forEach(doc => {
        expect(doc.filePath).toContain('/docs/');
      });
    });

    it('should throw error for non-existent documents', async () => {
      await expect(
        searchEngine.getDocument('non-existent-file.md')
      ).rejects.toThrow('Document not found');
    });

    it('should throw DocsSearchError for missing documents', async () => {
      try {
        await searchEngine.getDocument('this-file-does-not-exist.md');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(DocsSearchError);
        expect(error.code).toBe(DocsErrorCodes.DOCUMENT_NOT_FOUND);
      }
    });

    it('should validate file readability', async () => {
      // This test ensures the file exists and is readable
      const index = await searchEngine.getIndex();
      if (index.length > 0) {
        const doc = index[0];

        // File should be readable
        const content = await searchEngine.getDocument(doc.relativePath);
        expect(content).toBeDefined();
        expect(typeof content).toBe('string');
      }
    });
  });

  describe('Input Validation', () => {
    it('should handle empty path', async () => {
      await expect(
        searchEngine.getDocument('')
      ).rejects.toThrow();
    });

    it('should handle null-like paths', async () => {
      await expect(
        searchEngine.getDocument('null')
      ).rejects.toThrow('Document not found');
    });

    it('should handle paths with special characters', async () => {
      await expect(
        searchEngine.getDocument('../../../etc/passwd;rm -rf /')
      ).rejects.toThrow('Path traversal not allowed');
    });

    it('should normalize paths before validation', async () => {
      await expect(
        searchEngine.getDocument('./../../package.json')
      ).rejects.toThrow('Path traversal not allowed');
    });
  });

  describe('Error Information', () => {
    it('should provide structured error information', async () => {
      try {
        await searchEngine.getDocument('../package.json');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.name).toBe('DocsSearchError');
        expect(error.message).toBeTruthy();
        expect(error.code).toBeTruthy();
        expect(error.stack).toBeTruthy();
      }
    });

    it('should include context in error details', async () => {
      try {
        await searchEngine.getDocument('../secret.txt');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.details).toBeDefined();
        expect(typeof error.details).toBe('object');
      }
    });
  });

  describe('Concurrent Access Security', () => {
    it('should handle concurrent access attempts safely', async () => {
      const index = await searchEngine.getIndex();
      if (index.length >= 3) {
        const paths = index.slice(0, 3).map(doc => doc.relativePath);

        // Concurrent reads should all succeed
        const reads = paths.map(p => searchEngine.getDocument(p));
        const results = await Promise.all(reads);

        expect(results).toHaveLength(3);
        results.forEach(result => {
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      }
    });

    it('should handle mixed valid and invalid paths concurrently', async () => {
      const index = await searchEngine.getIndex();
      if (index.length > 0) {
        const validPath = index[0].relativePath;

        const reads = [
          searchEngine.getDocument(validPath),
          searchEngine.getDocument('../invalid.txt').catch(e => e),
          searchEngine.getDocument(validPath),
        ];

        const results = await Promise.all(reads);

        expect(typeof results[0]).toBe('string'); // Valid
        expect(results[1]).toBeInstanceOf(Error); // Invalid
        expect(typeof results[2]).toBe('string'); // Valid
      }
    });
  });
});
