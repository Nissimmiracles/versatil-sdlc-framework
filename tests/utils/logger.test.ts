/**
 * Tests for VERSATIL Logger System
 */

import { VERSATILLogger, LogLevel } from '../../src/utils/logger';

describe('VERSATILLogger', () => {
  let logger: VERSATILLogger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new VERSATILLogger();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(logger).toBeInstanceOf(VERSATILLogger);
      expect(logger['logs']).toBeDefined();
      expect(logger['logs']).toBeInstanceOf(Array);
      expect(logger['logs'].length).toBe(0);
    });

    it('should be a singleton', () => {
      const logger1 = VERSATILLogger.getInstance();
      const logger2 = VERSATILLogger.getInstance();
      expect(logger1).toBe(logger2);
    });
  });

  describe('Basic Logging Methods', () => {
    it('should log info messages', () => {
      logger.info('Test info message');

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.INFO,
        message: 'Test info message',
        timestamp: expect.any(String)
      });
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.DEBUG,
        message: 'Test debug message'
      });
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.WARN,
        message: 'Test warning message'
      });
    });

    it('should log error messages', () => {
      logger.error('Test error message');

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.ERROR,
        message: 'Test error message'
      });
    });

    it('should log trace messages', () => {
      logger.trace('Test trace message');

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.TRACE,
        message: 'Test trace message'
      });
    });
  });

  describe('Context and Component Logging', () => {
    it('should include context in log entries', () => {
      const context = { userId: '123', action: 'login' };
      logger.info('User action', context);

      const logs = logger.getRecentLogs(1);
      expect(logs[0].context).toEqual(context);
    });

    it('should include component in log entries', () => {
      logger.info('Component message', {}, 'test-component');

      const logs = logger.getRecentLogs(1);
      expect(logs[0].component).toBe('test-component');
    });

    it('should include agent ID in log entries', () => {
      logger.info('Agent message', {}, 'test-component', 'enhanced-maria');

      const logs = logger.getRecentLogs(1);
      expect(logs[0].agentId).toBe('enhanced-maria');
    });

    it('should handle both context and component', () => {
      const context = { action: 'test' };
      logger.info('Full message', context, 'full-component');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        message: 'Full message',
        context,
        component: 'full-component'
      });
    });
  });

  describe('Specialized Logging Methods', () => {
    it('should log agent-specific messages', () => {
      logger.agentLog('enhanced-maria', LogLevel.INFO, 'Agent message', { action: 'analyze' });

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.INFO,
        message: 'Agent message',
        agentId: 'enhanced-maria',
        context: { action: 'analyze' }
      });
    });

    it('should log performance metrics', () => {
      logger.performance('Agent execution', 1500, 'enhanced-maria');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.INFO,
        message: 'Agent execution',
        component: 'enhanced-maria',
        context: { duration: 1500, type: 'performance' }
      });
    });

    it('should log quality metrics', () => {
      logger.quality('Code quality assessment', 0.85, 'quality-agent');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.INFO,
        message: 'Code quality assessment',
        component: 'quality-agent',
        context: { score: 0.85, type: 'quality' }
      });
    });

    it('should log security events', () => {
      logger.security('Security vulnerability detected', 'high', { file: 'auth.js' });

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.WARN,
        message: 'Security vulnerability detected',
        context: {
          severity: 'high',
          type: 'security',
          file: 'auth.js'
        }
      });
    });

    it('should log configuration changes', () => {
      logger.config('Configuration updated', { setting: 'debug_mode', value: true });

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.INFO,
        message: 'Configuration updated',
        context: {
          type: 'config',
          setting: 'debug_mode',
          value: true
        }
      });
    });
  });

  describe('Warning Method Alias', () => {
    it('should provide warning method as alias for warn', () => {
      logger.warning('Warning message');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.WARN,
        message: 'Warning message'
      });
    });
  });

  describe('Log Retrieval and Filtering', () => {
    beforeEach(() => {
      // Add multiple log entries for testing
      logger.info('Info message 1');
      logger.warn('Warning message 1');
      logger.error('Error message 1');
      logger.debug('Debug message 1', {}, 'test-component');
      logger.info('Info message 2', {}, undefined, 'enhanced-maria');
    });

    it('should retrieve recent logs', () => {
      const logs = logger.getRecentLogs(3);
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('Info message 2');
      expect(logs[1].message).toBe('Debug message 1');
      expect(logs[2].message).toBe('Error message 1');
    });

    it('should filter logs by level', () => {
      const infoLogs = logger.getLogsByLevel(LogLevel.INFO);
      expect(infoLogs).toHaveLength(2);
      expect(infoLogs.every(log => log.level === LogLevel.INFO)).toBe(true);

      const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error message 1');
    });

    it('should filter logs by component', () => {
      const componentLogs = logger.getLogsByComponent('test-component');
      expect(componentLogs).toHaveLength(1);
      expect(componentLogs[0].message).toBe('Debug message 1');
    });

    it('should filter logs by agent', () => {
      const agentLogs = logger.getLogsByAgent('enhanced-maria');
      expect(agentLogs).toHaveLength(1);
      expect(agentLogs[0].message).toBe('Info message 2');
    });
  });

  describe('Log Management', () => {
    it('should limit log entries to prevent memory issues', () => {
      // Add more than 1000 log entries
      for (let i = 0; i < 1200; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = logger.getRecentLogs(1200);
      expect(logs.length).toBeLessThanOrEqual(1000);
      // Should keep the most recent logs
      expect(logs[0].message).toBe('Message 1199');
    });

    it('should clear logs', () => {
      logger.info('Test message 1');
      logger.info('Test message 2');

      expect(logger.getRecentLogs().length).toBe(2);

      logger.clearLogs();

      expect(logger.getRecentLogs().length).toBe(0);
    });
  });

  describe('Log Export', () => {
    beforeEach(() => {
      logger.info('Export test 1', { id: 1 });
      logger.warn('Export test 2', { id: 2 });
    });

    it('should export logs as JSON', () => {
      const jsonExport = logger.exportLogs('json');
      const parsed = JSON.parse(jsonExport);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toMatchObject({
        level: LogLevel.WARN,
        message: 'Export test 2'
      });
    });

    it('should export logs as CSV', () => {
      const csvExport = logger.exportLogs('csv');

      expect(csvExport).toContain('timestamp,level,message,component,agentId,context');
      expect(csvExport).toContain('Export test 1');
      expect(csvExport).toContain('Export test 2');
    });

    it('should default to JSON export', () => {
      const defaultExport = logger.exportLogs();
      const jsonExport = logger.exportLogs('json');

      expect(defaultExport).toBe(jsonExport);
    });
  });

  describe('Console Output', () => {
    it('should output to console for different levels', () => {
      const errorSpy = jest.spyOn(console, 'error');
      const warnSpy = jest.spyOn(console, 'warn');
      const debugSpy = jest.spyOn(console, 'debug');

      logger.error('Error message');
      logger.warn('Warning message');
      logger.debug('Debug message');
      logger.info('Info message');

      expect(errorSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle null context gracefully', () => {
      expect(() => {
        logger.info('Test message', null as any);
      }).not.toThrow();

      const logs = logger.getRecentLogs(1);
      expect(logs[0].context).toBeNull();
    });

    it('should handle undefined context gracefully', () => {
      expect(() => {
        logger.info('Test message', undefined);
      }).not.toThrow();

      const logs = logger.getRecentLogs(1);
      expect(logs[0].context).toBeUndefined();
    });

    it('should handle circular references in context', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => {
        logger.info('Circular test', circular);
      }).not.toThrow();
    });

    it('should handle large context objects', () => {
      const largeContext = {
        data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` }))
      };

      expect(() => {
        logger.info('Large context test', largeContext);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency logging efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`, { iteration: i });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain performance with large log history', () => {
      // Fill up the log buffer
      for (let i = 0; i < 1000; i++) {
        logger.info(`Setup message ${i}`);
      }

      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        logger.info(`Performance test ${i}`);
        logger.getRecentLogs(10);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // Should remain fast
    });
  });
});