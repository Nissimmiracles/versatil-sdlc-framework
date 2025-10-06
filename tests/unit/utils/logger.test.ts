/**
 * VERSATIL SDLC Framework - Logger Unit Tests
 * Enhanced Maria-QA Quality Assurance Testing
 *
 * Testing framework's own logging system
 */

import { VERSATILLogger } from '../../../src/utils/logger';

describe('VERSATILLogger', () => {
  let logger: VERSATILLogger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new VERSATILLogger();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Logging Methods', () => {
    it('should log debug messages correctly', () => {
      logger.debug('Test debug message', { key: 'value' }, 'test-component');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('DEBUG');
      expect(logCall).toContain('Test debug message');
    });

    it('should log info messages correctly', () => {
      logger.info('Test info message', { key: 'value' }, 'test-component');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('INFO');
      expect(logCall).toContain('Test info message');
    });

    it('should log warning messages correctly', () => {
      logger.warn('Test warning message', { key: 'value' }, 'test-component');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logCall = consoleWarnSpy.mock.calls[0][0];
      expect(logCall).toContain('WARN');
      expect(logCall).toContain('Test warning message');
    });

    it('should log error messages correctly', () => {
      logger.error('Test error message', { key: 'value' }, 'test-component');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('ERROR');
      expect(logCall).toContain('Test error message');
    });
  });

  describe('Framework Self-Logging Validation', () => {
    it('should support enhanced OPERA logging patterns', () => {
      const metadata = {
        agentId: 'maria-qa',
        activationTime: Date.now(),
        context: 'self-testing'
      };

      logger.info('Framework self-testing initiated', metadata, 'versatil-framework');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('maria-qa');
      expect(logCall).toContain('self-testing');
    });

    it('should handle structured logging for agent orchestration', () => {
      const agentContext = {
        agent: 'Enhanced Maria-QA',
        action: 'quality-validation',
        filePath: '/test/path',
        timestamp: new Date().toISOString()
      };

      logger.debug('Agent activation logged', agentContext, 'agent-orchestration');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Enhanced Maria-QA');
    });
  });

  describe('Performance Requirements', () => {
    it('should log messages within performance thresholds', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        logger.info(`Performance test message ${i}`, { iteration: i }, 'performance-test');
      }

      const executionTime = Date.now() - startTime;

      // OPERA requirement: 100 log messages should complete in under 100ms
      expect(executionTime).toBeLessThan(100);
      expect(consoleLogSpy).toHaveBeenCalledTimes(100);
    });
  });
});