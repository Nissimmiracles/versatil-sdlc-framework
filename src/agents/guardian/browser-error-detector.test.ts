/**
 * VERSATIL SDLC Framework - Browser Error Detector Tests
 * Priority 2: Guardian System Testing
 *
 * Test Coverage:
 * - Browser error parsing (console & network)
 * - Error fingerprint calculation
 * - Chain-of-Verification (CoVe) evidence
 * - Agent assignment logic
 * - Priority determination
 * - Error detection workflow
 * - File validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseBrowserCheckTodo,
  calculateErrorFingerprint,
  verifyBrowserErrors,
  assignAgentForBrowserError,
  determinePriority,
  detectBrowserErrors,
  BrowserError,
  BrowserErrorDetectionResult
} from './browser-error-detector.js';
import * as fs from 'fs/promises';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    readdir: vi.fn(),
    access: vi.fn(),
  },
  readFile: vi.fn(),
  readdir: vi.fn(),
  access: vi.fn(),
}));

describe('BrowserErrorDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Fingerprint Calculation', () => {
    it('should calculate unique fingerprint for error', () => {
      const error: BrowserError = {
        type: 'console',
        severity: 'error',
        message: 'Uncaught TypeError: Cannot read property',
        timestamp: '2025-11-03T13:00:00.000Z'
      };

      const fingerprint = calculateErrorFingerprint(error);

      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBe(8);
    });

    it('should generate same fingerprint for identical errors', () => {
      const error1: BrowserError = {
        type: 'console',
        severity: 'error',
        message: 'Test error message',
        timestamp: '2025-11-03T13:00:00.000Z'
      };

      const error2: BrowserError = {
        type: 'console',
        severity: 'error',
        message: 'Test error message',
        timestamp: '2025-11-03T14:00:00.000Z'
      };

      const fp1 = calculateErrorFingerprint(error1);
      const fp2 = calculateErrorFingerprint(error2);

      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different errors', () => {
      const error1: BrowserError = {
        type: 'console',
        severity: 'error',
        message: 'Error A',
        timestamp: '2025-11-03T13:00:00.000Z'
      };

      const error2: BrowserError = {
        type: 'console',
        severity: 'error',
        message: 'Error B',
        timestamp: '2025-11-03T13:00:00.000Z'
      };

      const fp1 = calculateErrorFingerprint(error1);
      const fp2 = calculateErrorFingerprint(error2);

      expect(fp1).not.toBe(fp2);
    });

    it('should handle long error messages', () => {
      const longMessage = 'A'.repeat(200);
      const error: BrowserError = {
        type: 'console',
        severity: 'error',
        message: longMessage,
        timestamp: '2025-11-03T13:00:00.000Z'
      };

      const fingerprint = calculateErrorFingerprint(error);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.length).toBe(8);
    });
  });

  describe('Agent Assignment', () => {
    it('should assign James-Frontend for console errors only', () => {
      const errors: BrowserError[] = [
        {
          type: 'console',
          severity: 'error',
          message: 'Uncaught TypeError',
          timestamp: '2025-11-03T13:00:00.000Z'
        }
      ];

      const agent = assignAgentForBrowserError(errors);

      expect(agent).toBe('James-Frontend');
    });

    it('should assign Marcus-Backend for network errors only', () => {
      const errors: BrowserError[] = [
        {
          type: 'network',
          severity: 'error',
          message: 'GET /api/users',
          url: '/api/users',
          status: 404,
          timestamp: '2025-11-03T13:00:00.000Z'
        }
      ];

      const agent = assignAgentForBrowserError(errors);

      expect(agent).toBe('Marcus-Backend');
    });

    it('should assign James-Frontend for mixed errors', () => {
      const errors: BrowserError[] = [
        {
          type: 'console',
          severity: 'error',
          message: 'Uncaught TypeError',
          timestamp: '2025-11-03T13:00:00.000Z'
        },
        {
          type: 'network',
          severity: 'error',
          message: 'GET /api/users',
          url: '/api/users',
          status: 404,
          timestamp: '2025-11-03T13:00:00.000Z'
        }
      ];

      const agent = assignAgentForBrowserError(errors);

      expect(agent).toBe('James-Frontend');
    });

    it('should handle empty errors array', () => {
      const errors: BrowserError[] = [];

      const agent = assignAgentForBrowserError(errors);

      expect(agent).toBe('James-Frontend');
    });
  });

  describe('Priority Determination', () => {
    it('should assign critical priority for 3+ errors', () => {
      const errors: BrowserError[] = [
        { type: 'console', severity: 'error', message: 'Error 1', timestamp: '2025-11-03T13:00:00.000Z' },
        { type: 'console', severity: 'error', message: 'Error 2', timestamp: '2025-11-03T13:00:00.000Z' },
        { type: 'console', severity: 'error', message: 'Error 3', timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const priority = determinePriority(errors);

      expect(priority).toBe('critical');
    });

    it('should assign high priority for 1-2 errors', () => {
      const errors: BrowserError[] = [
        { type: 'console', severity: 'error', message: 'Error 1', timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const priority = determinePriority(errors);

      expect(priority).toBe('high');
    });

    it('should assign high priority for 5+ warnings', () => {
      const errors: BrowserError[] = [
        { type: 'console', severity: 'warning', message: 'Warning 1', timestamp: '2025-11-03T13:00:00.000Z' },
        { type: 'console', severity: 'warning', message: 'Warning 2', timestamp: '2025-11-03T13:00:00.000Z' },
        { type: 'console', severity: 'warning', message: 'Warning 3', timestamp: '2025-11-03T13:00:00.000Z' },
        { type: 'console', severity: 'warning', message: 'Warning 4', timestamp: '2025-11-03T13:00:00.000Z' },
        { type: 'console', severity: 'warning', message: 'Warning 5', timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const priority = determinePriority(errors);

      expect(priority).toBe('high');
    });

    it('should assign medium priority for 1-4 warnings', () => {
      const errors: BrowserError[] = [
        { type: 'console', severity: 'warning', message: 'Warning 1', timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const priority = determinePriority(errors);

      expect(priority).toBe('medium');
    });

    it('should assign low priority for no errors', () => {
      const errors: BrowserError[] = [];

      const priority = determinePriority(errors);

      expect(priority).toBe('low');
    });
  });

  describe('Chain-of-Verification (CoVe)', () => {
    it('should verify file exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const errors: BrowserError[] = [
        { type: 'console', severity: 'error', message: 'Test error', timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const evidence = await verifyBrowserErrors('test.ts', errors);

      expect(evidence.fileExistsVerified).toBe(true);
    });

    it('should detect missing files', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const errors: BrowserError[] = [
        { type: 'console', severity: 'error', message: 'Test error', timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const evidence = await verifyBrowserErrors('missing.ts', errors);

      expect(evidence.fileExistsVerified).toBe(false);
    });

    it('should verify console errors are not empty', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const errors: BrowserError[] = [
        { type: 'console', severity: 'error', message: 'Valid error message', timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const evidence = await verifyBrowserErrors('test.ts', errors);

      expect(evidence.consoleErrorsVerified).toBe(true);
    });

    it('should verify network errors have valid status codes', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const errors: BrowserError[] = [
        { type: 'network', severity: 'error', message: 'GET /api', url: '/api', status: 404, timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const evidence = await verifyBrowserErrors('test.ts', errors);

      expect(evidence.networkErrorsVerified).toBe(true);
    });

    it('should reject invalid network status codes', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const errors: BrowserError[] = [
        { type: 'network', severity: 'error', message: 'GET /api', url: '/api', status: 200, timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const evidence = await verifyBrowserErrors('test.ts', errors);

      expect(evidence.networkErrorsVerified).toBe(false);
    });

    it('should calculate confidence score (0-100)', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const errors: BrowserError[] = [
        { type: 'console', severity: 'error', message: 'Test', timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const evidence = await verifyBrowserErrors('test.ts', errors);

      expect(evidence.confidence).toBeGreaterThanOrEqual(0);
      expect(evidence.confidence).toBeLessThanOrEqual(100);
    });

    it('should return high confidence for all checks passing', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const errors: BrowserError[] = [
        { type: 'console', severity: 'error', message: 'Valid error', timestamp: '2025-11-03T13:00:00.000Z' }
      ];

      const evidence = await verifyBrowserErrors('test.ts', errors);

      expect(evidence.confidence).toBe(100);
    });
  });

  describe('Browser Error Parsing', () => {
    it('should parse console errors from TODO', async () => {
      const mockTodoContent = `
## Console Errors

### 1. Uncaught TypeError: Cannot read property 'foo' of undefined

- **Type**: error
- **Location**: main.js:45

---
`;

      vi.mocked(fs.readFile).mockResolvedValue(mockTodoContent);

      const errors = await parseBrowserCheckTodo('test-todo.md');

      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe('console');
      expect(errors[0].severity).toBe('error');
      expect(errors[0].message).toContain('Uncaught TypeError');
    });

    it('should parse network errors from TODO', async () => {
      const mockTodoContent = `
## Network Errors

### 1. GET /api/users

- **Status**: 404
- **Message**: Not Found

---
`;

      vi.mocked(fs.readFile).mockResolvedValue(mockTodoContent);

      const errors = await parseBrowserCheckTodo('test-todo.md');

      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe('network');
      expect(errors[0].severity).toBe('error');
      expect(errors[0].status).toBe(404);
    });

    it('should parse multiple errors', async () => {
      const mockTodoContent = `
## Console Errors

### 1. Error A

- **Type**: error

### 2. Error B

- **Type**: error

---

## Network Errors

### 1. GET /api/test

- **Status**: 500

---
`;

      vi.mocked(fs.readFile).mockResolvedValue(mockTodoContent);

      const errors = await parseBrowserCheckTodo('test-todo.md');

      expect(errors.length).toBe(3);
    });

    it('should handle TODO with no errors', async () => {
      const mockTodoContent = `
## Console Errors

No console errors detected.

---

## Network Errors

No network errors detected.

---
`;

      vi.mocked(fs.readFile).mockResolvedValue(mockTodoContent);

      const errors = await parseBrowserCheckTodo('test-todo.md');

      expect(errors.length).toBe(0);
    });
  });

  describe('Error Detection Workflow', () => {
    it('should return null if no TODOs exist', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Directory not found'));

      const result = await detectBrowserErrors('test.ts');

      expect(result).toBeNull();
    });

    it('should return null if TODO directory is empty', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const result = await detectBrowserErrors('test.ts');

      expect(result).toBeNull();
    });

    it('should return null if no browser-check TODOs', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['other-todo.md'] as any);

      const result = await detectBrowserErrors('test.ts');

      expect(result).toBeNull();
    });

    it('should parse latest browser check TODO', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'guardian-browser-check-old.md',
        'guardian-browser-check-new.md'
      ] as any);

      const mockTodoContent = `
## Console Errors

### 1. Test error

- **Type**: error

---
`;
      vi.mocked(fs.readFile).mockResolvedValue(mockTodoContent);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await detectBrowserErrors('test.ts');

      expect(result).not.toBeNull();
      expect(result?.errors.length).toBeGreaterThan(0);
    });

    it('should include all required fields in result', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['guardian-browser-check-test.md'] as any);
      const mockTodoContent = `
## Console Errors

### 1. Test error

- **Type**: error

---
`;
      vi.mocked(fs.readFile).mockResolvedValue(mockTodoContent);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await detectBrowserErrors('test.ts');

      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('fingerprint');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('assignedAgent');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('layer');
      expect(result).toHaveProperty('verificationEvidence');
    });

    it('should set layer to project', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['guardian-browser-check-test.md'] as any);
      const mockTodoContent = `
## Console Errors

### 1. Test error

- **Type**: error

---
`;
      vi.mocked(fs.readFile).mockResolvedValue(mockTodoContent);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await detectBrowserErrors('test.ts');

      expect(result?.layer).toBe('project');
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors gracefully', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['guardian-browser-check-test.md'] as any);
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'));

      await expect(detectBrowserErrors('test.ts')).rejects.toThrow();
    });

    it('should handle empty error messages', () => {
      const error: BrowserError = {
        type: 'console',
        severity: 'error',
        message: '',
        timestamp: '2025-11-03T13:00:00.000Z'
      };

      const fingerprint = calculateErrorFingerprint(error);

      expect(fingerprint).toBeDefined();
    });
  });
});
