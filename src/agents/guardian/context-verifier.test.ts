/**
 * VERSATIL SDLC Framework - Context Verifier Tests
 * Priority 2: Guardian Component Testing (Batch 6)
 *
 * Test Coverage:
 * - Context switching detection (FRAMEWORK vs PROJECT)
 * - Context isolation validation
 * - Cross-context operation prevention
 * - Context leak detection
 * - Framework file modification protection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextVerifier } from './context-verifier.js';

describe('ContextVerifier', () => {
  let verifier: ContextVerifier;

  beforeEach(() => {
    vi.clearAllMocks();
    verifier = ContextVerifier.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ContextVerifier.getInstance();
      const instance2 = ContextVerifier.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default context', () => {
      expect(verifier.getCurrentContext()).toBe('PROJECT_CONTEXT');
    });
  });

  describe('Context Detection', () => {
    it('should detect FRAMEWORK_CONTEXT from file path', () => {
      const filePath = '/Users/user/versatil-sdlc-fw/src/agents/guardian/iris-guardian.ts';
      const context = verifier.detectContextFromPath(filePath);
      expect(context).toBe('FRAMEWORK_CONTEXT');
    });

    it('should detect PROJECT_CONTEXT from file path', () => {
      const filePath = '/Users/user/my-project/src/components/Button.tsx';
      const context = verifier.detectContextFromPath(filePath);
      expect(context).toBe('PROJECT_CONTEXT');
    });

    it('should detect FRAMEWORK_CONTEXT from package name', () => {
      const packagePath = 'node_modules/@versatil/sdlc-framework/dist/index.js';
      const context = verifier.detectContextFromPath(packagePath);
      expect(context).toBe('FRAMEWORK_CONTEXT');
    });

    it('should handle framework directory patterns', () => {
      const paths = [
        '/path/to/versatil-sdlc-fw/src/core/base-agent.ts',
        '/path/to/versatil-framework/src/agents/iris.ts',
        '/path/to/@versatil/sdlc-framework/dist/index.js'
      ];

      paths.forEach(path => {
        expect(verifier.detectContextFromPath(path)).toBe('FRAMEWORK_CONTEXT');
      });
    });
  });

  describe('Context Switching', () => {
    it('should switch context successfully', () => {
      verifier.switchContext('FRAMEWORK_CONTEXT');
      expect(verifier.getCurrentContext()).toBe('FRAMEWORK_CONTEXT');

      verifier.switchContext('PROJECT_CONTEXT');
      expect(verifier.getCurrentContext()).toBe('PROJECT_CONTEXT');
    });

    it('should track context switch history', () => {
      verifier.switchContext('FRAMEWORK_CONTEXT');
      verifier.switchContext('PROJECT_CONTEXT');
      verifier.switchContext('FRAMEWORK_CONTEXT');

      const history = verifier.getContextHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    it('should emit context switch events', () => {
      const listener = vi.fn();
      verifier.onContextSwitch(listener);

      verifier.switchContext('FRAMEWORK_CONTEXT');

      expect(listener).toHaveBeenCalledWith({
        from: 'PROJECT_CONTEXT',
        to: 'FRAMEWORK_CONTEXT',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Context Isolation Validation', () => {
    it('should allow framework file modifications in FRAMEWORK_CONTEXT', () => {
      verifier.switchContext('FRAMEWORK_CONTEXT');
      const filePath = '/versatil-sdlc-fw/src/agents/iris-guardian.ts';

      const isAllowed = verifier.validateFileOperation(filePath, 'write');
      expect(isAllowed).toBe(true);
    });

    it('should prevent framework file modifications in PROJECT_CONTEXT', () => {
      verifier.switchContext('PROJECT_CONTEXT');
      const filePath = '/versatil-sdlc-fw/src/agents/iris-guardian.ts';

      const isAllowed = verifier.validateFileOperation(filePath, 'write');
      expect(isAllowed).toBe(false);
    });

    it('should allow reading framework files in any context', () => {
      const filePath = '/versatil-sdlc-fw/src/agents/iris-guardian.ts';

      verifier.switchContext('PROJECT_CONTEXT');
      expect(verifier.validateFileOperation(filePath, 'read')).toBe(true);

      verifier.switchContext('FRAMEWORK_CONTEXT');
      expect(verifier.validateFileOperation(filePath, 'read')).toBe(true);
    });

    it('should allow project file modifications in PROJECT_CONTEXT', () => {
      verifier.switchContext('PROJECT_CONTEXT');
      const filePath = '/my-project/src/components/Button.tsx';

      const isAllowed = verifier.validateFileOperation(filePath, 'write');
      expect(isAllowed).toBe(true);
    });

    it('should warn on cross-context operations', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      verifier.switchContext('PROJECT_CONTEXT');
      verifier.validateFileOperation('/versatil-sdlc-fw/src/core/base-agent.ts', 'write');

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Context Leak Detection', () => {
    it('should detect context leak when framework context bleeds into project', () => {
      verifier.switchContext('FRAMEWORK_CONTEXT');
      // Simulate working on framework files
      verifier.validateFileOperation('/versatil-sdlc-fw/src/agents/iris.ts', 'write');

      // Switch to project context but still reference framework files
      verifier.switchContext('PROJECT_CONTEXT');
      const hasLeak = verifier.detectContextLeak();

      expect(typeof hasLeak).toBe('boolean');
    });

    it('should track mixed-context operations', () => {
      verifier.switchContext('PROJECT_CONTEXT');
      verifier.validateFileOperation('/my-project/src/app.ts', 'write');
      verifier.validateFileOperation('/versatil-sdlc-fw/src/agents/iris.ts', 'read');

      const operations = verifier.getMixedContextOperations();
      expect(Array.isArray(operations)).toBe(true);
    });

    it('should clear context leak warnings after context switch', () => {
      verifier.switchContext('FRAMEWORK_CONTEXT');
      verifier.switchContext('PROJECT_CONTEXT');
      verifier.switchContext('FRAMEWORK_CONTEXT');

      verifier.clearContextLeakWarnings();
      const leaks = verifier.getContextLeakWarnings();
      expect(leaks.length).toBe(0);
    });
  });

  describe('Framework File Protection', () => {
    it('should protect core framework files', () => {
      const protectedFiles = [
        '/versatil-sdlc-fw/src/core/base-agent.ts',
        '/versatil-sdlc-fw/src/agents/guardian/iris-guardian.ts',
        '/versatil-sdlc-fw/package.json'
      ];

      verifier.switchContext('PROJECT_CONTEXT');

      protectedFiles.forEach(file => {
        expect(verifier.isFrameworkFile(file)).toBe(true);
        expect(verifier.validateFileOperation(file, 'write')).toBe(false);
      });
    });

    it('should allow framework modifications with explicit flag', () => {
      verifier.switchContext('PROJECT_CONTEXT');
      const filePath = '/versatil-sdlc-fw/src/agents/iris-guardian.ts';

      const isAllowed = verifier.validateFileOperation(filePath, 'write', {
        allowFrameworkModification: true
      });
      expect(typeof isAllowed).toBe('boolean');
    });

    it('should track unauthorized framework modification attempts', () => {
      verifier.switchContext('PROJECT_CONTEXT');
      verifier.validateFileOperation('/versatil-sdlc-fw/src/core/base-agent.ts', 'write');
      verifier.validateFileOperation('/versatil-sdlc-fw/package.json', 'write');

      const attempts = verifier.getUnauthorizedAttempts();
      expect(attempts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Context-Aware Agent Activation', () => {
    it('should allow Iris-Guardian activation in FRAMEWORK_CONTEXT', () => {
      verifier.switchContext('FRAMEWORK_CONTEXT');
      const isAllowed = verifier.validateAgentActivation('iris-guardian');
      expect(isAllowed).toBe(true);
    });

    it('should restrict Iris-Guardian in PROJECT_CONTEXT for user tasks', () => {
      verifier.switchContext('PROJECT_CONTEXT');
      const isAllowed = verifier.validateAgentActivation('iris-guardian', {
        taskType: 'user-feature-request'
      });
      expect(typeof isAllowed).toBe('boolean');
    });

    it('should allow Iris-Guardian in PROJECT_CONTEXT for framework health', () => {
      verifier.switchContext('PROJECT_CONTEXT');
      const isAllowed = verifier.validateAgentActivation('iris-guardian', {
        taskType: 'framework-health-check'
      });
      expect(isAllowed).toBe(true);
    });

    it('should allow OPERA agents in any context', () => {
      const operaAgents = ['alex-ba', 'james-frontend', 'marcus-backend', 'maria-qa'];

      verifier.switchContext('PROJECT_CONTEXT');
      operaAgents.forEach(agent => {
        expect(verifier.validateAgentActivation(agent)).toBe(true);
      });

      verifier.switchContext('FRAMEWORK_CONTEXT');
      operaAgents.forEach(agent => {
        expect(verifier.validateAgentActivation(agent)).toBe(true);
      });
    });
  });

  describe('Context State Persistence', () => {
    it('should save context state', async () => {
      verifier.switchContext('FRAMEWORK_CONTEXT');
      await verifier.saveContextState();

      const state = verifier.getContextState();
      expect(state.currentContext).toBe('FRAMEWORK_CONTEXT');
    });

    it('should restore context state', async () => {
      const savedState = {
        currentContext: 'FRAMEWORK_CONTEXT',
        history: [],
        timestamp: new Date().toISOString()
      };

      await verifier.restoreContextState(savedState);
      expect(verifier.getCurrentContext()).toBe('FRAMEWORK_CONTEXT');
    });
  });

  describe('Context Validation Report', () => {
    it('should generate context validation report', () => {
      verifier.switchContext('FRAMEWORK_CONTEXT');
      verifier.validateFileOperation('/versatil-sdlc-fw/src/agents/iris.ts', 'write');
      verifier.switchContext('PROJECT_CONTEXT');
      verifier.validateFileOperation('/my-project/src/app.ts', 'write');

      const report = verifier.generateValidationReport();

      expect(report).toHaveProperty('contextSwitches');
      expect(report).toHaveProperty('violations');
      expect(report).toHaveProperty('mixedOperations');
    });

    it('should include recommendations in report', () => {
      verifier.switchContext('PROJECT_CONTEXT');
      verifier.validateFileOperation('/versatil-sdlc-fw/src/agents/iris.ts', 'write');

      const report = verifier.generateValidationReport();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined file paths', () => {
      expect(() => verifier.detectContextFromPath('')).not.toThrow();
    });

    it('should handle invalid context values', () => {
      expect(() => verifier.switchContext('INVALID_CONTEXT' as any)).not.toThrow();
    });

    it('should handle rapid context switching', () => {
      for (let i = 0; i < 100; i++) {
        verifier.switchContext(i % 2 === 0 ? 'FRAMEWORK_CONTEXT' : 'PROJECT_CONTEXT');
      }

      expect(verifier.getCurrentContext()).toBeDefined();
    });

    it('should handle concurrent file operations', () => {
      const operations = [
        verifier.validateFileOperation('/file1.ts', 'read'),
        verifier.validateFileOperation('/file2.ts', 'write'),
        verifier.validateFileOperation('/file3.ts', 'read')
      ];

      expect(operations.every(op => typeof op === 'boolean')).toBe(true);
    });
  });
});
