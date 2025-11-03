/**
 * VERSATIL SDLC Framework - TODO Deduplicator Tests
 * Priority 2: Guardian System Testing
 *
 * Test Coverage:
 * - Duplicate TODO detection
 * - Fingerprint calculation
 * - Similarity matching
 * - Deduplication logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateTodoFingerprint,
  areTodosSimilar,
  deduplicateTodos
} from './todo-deduplicator.js';

describe('TodoDeduplicator', () => {
  describe('Fingerprint Calculation', () => {
    it('should calculate fingerprint for TODO', () => {
      const todo = {
        title: 'Fix TypeScript error',
        description: 'Cannot find module',
        file: 'src/index.ts'
      };

      const fingerprint = calculateTodoFingerprint(todo);

      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
    });

    it('should generate same fingerprint for identical TODOs', () => {
      const todo1 = { title: 'Test', description: 'Desc', file: 'test.ts' };
      const todo2 = { title: 'Test', description: 'Desc', file: 'test.ts' };

      const fp1 = calculateTodoFingerprint(todo1);
      const fp2 = calculateTodoFingerprint(todo2);

      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different TODOs', () => {
      const todo1 = { title: 'Test A', description: 'Desc A', file: 'a.ts' };
      const todo2 = { title: 'Test B', description: 'Desc B', file: 'b.ts' };

      const fp1 = calculateTodoFingerprint(todo1);
      const fp2 = calculateTodoFingerprint(todo2);

      expect(fp1).not.toBe(fp2);
    });
  });

  describe('Similarity Matching', () => {
    it('should detect identical TODOs as similar', () => {
      const todo1 = { title: 'Fix bug', description: 'Error in code', file: 'test.ts' };
      const todo2 = { title: 'Fix bug', description: 'Error in code', file: 'test.ts' };

      const similar = areTodosSimilar(todo1, todo2);

      expect(similar).toBe(true);
    });

    it('should detect similar titles as duplicates', () => {
      const todo1 = { title: 'Fix TypeScript error in utils', description: 'Error', file: 'utils.ts' };
      const todo2 = { title: 'Fix TypeScript error in utils', description: 'Different', file: 'utils.ts' };

      const similar = areTodosSimilar(todo1, todo2);

      expect(similar).toBe(true);
    });

    it('should not match TODOs with different titles', () => {
      const todo1 = { title: 'Fix bug A', description: 'Error', file: 'test.ts' };
      const todo2 = { title: 'Fix bug B', description: 'Error', file: 'test.ts' };

      const similar = areTodosSimilar(todo1, todo2);

      expect(similar).toBe(false);
    });

    it('should handle case insensitive matching', () => {
      const todo1 = { title: 'FIX BUG', description: 'Error', file: 'test.ts' };
      const todo2 = { title: 'fix bug', description: 'Error', file: 'test.ts' };

      const similar = areTodosSimilar(todo1, todo2);

      expect(similar).toBe(true);
    });
  });

  describe('Deduplication Logic', () => {
    it('should remove duplicate TODOs', () => {
      const todos = [
        { title: 'Fix bug', description: 'Error', file: 'test.ts' },
        { title: 'Fix bug', description: 'Error', file: 'test.ts' },
        { title: 'Different', description: 'Other', file: 'test.ts' }
      ];

      const deduplicated = deduplicateTodos(todos);

      expect(deduplicated.length).toBeLessThan(todos.length);
    });

    it('should keep unique TODOs', () => {
      const todos = [
        { title: 'Task A', description: 'Desc A', file: 'a.ts' },
        { title: 'Task B', description: 'Desc B', file: 'b.ts' },
        { title: 'Task C', description: 'Desc C', file: 'c.ts' }
      ];

      const deduplicated = deduplicateTodos(todos);

      expect(deduplicated.length).toBe(todos.length);
    });

    it('should handle empty array', () => {
      const deduplicated = deduplicateTodos([]);

      expect(deduplicated.length).toBe(0);
    });

    it('should handle single TODO', () => {
      const todos = [{ title: 'Single', description: 'Desc', file: 'test.ts' }];

      const deduplicated = deduplicateTodos(todos);

      expect(deduplicated.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle TODOs with missing fields', () => {
      const todo = { title: 'Test', description: '', file: '' };

      const fingerprint = calculateTodoFingerprint(todo);

      expect(fingerprint).toBeDefined();
    });

    it('should handle very long descriptions', () => {
      const longDesc = 'A'.repeat(1000);
      const todo = { title: 'Test', description: longDesc, file: 'test.ts' };

      const fingerprint = calculateTodoFingerprint(todo);

      expect(fingerprint).toBeDefined();
    });
  });
});
