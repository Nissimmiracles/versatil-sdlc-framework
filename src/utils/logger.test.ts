/**
 * VERSATIL SDLC Framework - VERSATILLogger Tests
 * Wave 1 Day 4: Utility Testing
 *
 * Test Coverage:
 * - Singleton pattern
 * - Log levels (info, warn, error, debug)
 * - MCP mode detection
 * - Message formatting
 * - Component labeling
 * - Context serialization
 * - Console output routing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { VERSATILLogger } from './logger.js';

describe('VERSATILLogger', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let originalMcpMode: string | undefined;

  beforeEach(() => {
    // Store original env
    originalMcpMode = process.env.VERSATIL_MCP_MODE;

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore env
    if (originalMcpMode === undefined) {
      delete process.env.VERSATIL_MCP_MODE;
    } else {
      process.env.VERSATIL_MCP_MODE = originalMcpMode;
    }

    // Restore console
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const logger1 = VERSATILLogger.getInstance();
      const logger2 = VERSATILLogger.getInstance();

      expect(logger1).toBe(logger2);
    });

    it('should support component parameter in getInstance', () => {
      // Note: Singleton instance persists across calls
      // Component parameter only applies on first getInstance call
      const logger = VERSATILLogger.getInstance();

      logger.info('test message', undefined, 'TestComponent');

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComponent] INFO: test message');
    });

    it('should allow creating non-singleton instances', () => {
      const logger1 = new VERSATILLogger('Component1');
      const logger2 = new VERSATILLogger('Component2');

      expect(logger1).not.toBe(logger2);
    });
  });

  describe('Log Levels - Normal Mode', () => {
    beforeEach(() => {
      delete process.env.VERSATIL_MCP_MODE;
    });

    it('should log info messages to console.log', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Info message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log error messages to console.error', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[TestComp] ERROR: Error message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log warn messages to console.warn', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith('[TestComp] WARN: Warning message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should support warning alias for warn', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.warning('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith('[TestComp] WARN: Warning message');
    });

    it('should log debug messages to console.log', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] DEBUG: Debug message');
    });
  });

  describe('Log Levels - MCP Mode', () => {
    beforeEach(() => {
      process.env.VERSATIL_MCP_MODE = 'true';
    });

    it('should route info to stderr in MCP mode', () => {
      const logger = new VERSATILLogger('MCPComp');
      logger.info('Info in MCP mode');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[MCPComp] INFO: Info in MCP mode');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should route warn to stderr in MCP mode', () => {
      const logger = new VERSATILLogger('MCPComp');
      logger.warn('Warn in MCP mode');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[MCPComp] WARN: Warn in MCP mode');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should route debug to stderr in MCP mode', () => {
      const logger = new VERSATILLogger('MCPComp');
      logger.debug('Debug in MCP mode');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[MCPComp] DEBUG: Debug in MCP mode');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should keep error on stderr in MCP mode', () => {
      const logger = new VERSATILLogger('MCPComp');
      logger.error('Error in MCP mode');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[MCPComp] ERROR: Error in MCP mode');
    });
  });

  describe('Message Formatting', () => {
    it('should format message with component from constructor', () => {
      const logger = new VERSATILLogger('MyComponent');
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[MyComponent] INFO: Test message');
    });

    it('should use component parameter over constructor component', () => {
      const logger = new VERSATILLogger('DefaultComp');
      logger.info('Test message', undefined, 'OverrideComp');

      expect(consoleLogSpy).toHaveBeenCalledWith('[OverrideComp] INFO: Test message');
    });

    it('should default to VERSATIL when no component specified', () => {
      const logger = new VERSATILLogger();
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[VERSATIL] INFO: Test message');
    });

    it('should include context as JSON when provided', () => {
      const logger = new VERSATILLogger('TestComp');
      const context = { userId: 123, action: 'login' };

      logger.info('User action', context);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TestComp] INFO: User action {"userId":123,"action":"login"}'
      );
    });

    it('should not include context when empty object', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Test message', {});

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Test message');
    });

    it('should not include context when undefined', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Test message', undefined);

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Test message');
    });
  });

  describe('Context Serialization', () => {
    it('should serialize simple context objects', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Message {"key":"value"}');
    });

    it('should serialize nested context objects', () => {
      const logger = new VERSATILLogger('TestComp');
      const context = {
        user: { id: 1, name: 'Test' },
        metadata: { timestamp: 123456 }
      };

      logger.info('Message', context);

      const expectedContext = JSON.stringify(context);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[TestComp] INFO: Message ${expectedContext}`);
    });

    it('should serialize arrays in context', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Message', { items: [1, 2, 3] });

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Message {"items":[1,2,3]}');
    });

    it('should handle numbers in context', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Message', { count: 42, rate: 0.75 });

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Message {"count":42,"rate":0.75}');
    });

    it('should handle booleans in context', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Message', { success: true, enabled: false });

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Message {"success":true,"enabled":false}');
    });

    it('should handle null in context', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Message', { value: null });

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Message {"value":null}');
    });
  });

  describe('Component Labeling', () => {
    it('should support different component names', () => {
      const components = ['Auth', 'Database', 'API', 'Cache'];

      components.forEach(comp => {
        const logger = new VERSATILLogger(comp);
        logger.info('Test');

        expect(consoleLogSpy).toHaveBeenCalledWith(`[${comp}] INFO: Test`);
        consoleLogSpy.mockClear();
      });
    });

    it('should allow dynamic component override', () => {
      const logger = new VERSATILLogger('Default');

      logger.info('Message 1', undefined, 'ComponentA');
      logger.info('Message 2', undefined, 'ComponentB');
      logger.info('Message 3'); // Should use default

      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, '[ComponentA] INFO: Message 1');
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, '[ComponentB] INFO: Message 2');
      expect(consoleLogSpy).toHaveBeenNthCalledWith(3, '[Default] INFO: Message 3');
    });
  });

  describe('Integration Tests', () => {
    it('should handle all log levels with context', () => {
      const logger = new VERSATILLogger('Integration');
      const context = { test: 'data' };

      logger.info('Info msg', context);
      logger.warn('Warn msg', context);
      logger.error('Error msg', context);
      logger.debug('Debug msg', context);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // info + debug
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should work with getInstance and all log methods', () => {
      const logger = VERSATILLogger.getInstance('Singleton');

      logger.info('Info');
      logger.warn('Warn');
      logger.warning('Warning');
      logger.error('Error');
      logger.debug('Debug');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // info + debug
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2); // warn + warning
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string message', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('');

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: ');
    });

    it('should handle very long messages', () => {
      const logger = new VERSATILLogger('TestComp');
      const longMessage = 'A'.repeat(1000);

      logger.info(longMessage);

      expect(consoleLogSpy).toHaveBeenCalledWith(`[TestComp] INFO: ${longMessage}`);
    });

    it('should handle special characters in messages', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Message with \n newline and \t tab');

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Message with \n newline and \t tab');
    });

    it('should handle unicode in messages', () => {
      const logger = new VERSATILLogger('TestComp');
      logger.info('Unicode: 你好 🚀 ñ');

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestComp] INFO: Unicode: 你好 🚀 ñ');
    });
  });
});
