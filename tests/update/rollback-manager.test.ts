/**
 * Test Suite: RollbackManager
 * Tests for v3.0.0 rollback system with instant recovery
 * Target: 90%+ coverage
 *
 * FIXED: Using __mocks__ directory for proper mock hoisting
 */

import { RollbackManager, RollbackPoint, HealthCheckResult } from '../../src/update/rollback-manager';
import * as path from 'path';
import * as os from 'os';

// Enable manual mocks from __mocks__ directory
jest.mock('child_process');
jest.mock('util');

// Mock fs/promises inline (Node built-in modules need inline mocking)
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  access: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn()
}));

// Import mockExecAsync from our manual mock (this works because __mocks__ is hoisted)
import { mockExecAsync } from '../__mocks__/child_process';

describe('RollbackManager', () => {
  let rollbackManager: RollbackManager;
  let mockVersatilHome: string;
  let mockRollbackDir: string;
  let mockHistoryFile: string;

  // Get references to mocked fs functions
  const fs = require('fs/promises');
  const mockMkdir = fs.mkdir;
  const mockWriteFile = fs.writeFile;
  const mockReadFile = fs.readFile;
  const mockAccess = fs.access;
  const mockUnlink = fs.unlink;
  const mockStat = fs.stat;

  beforeEach(() => {
    jest.clearAllMocks();

    rollbackManager = new RollbackManager(5);
    mockVersatilHome = path.join(os.homedir(), '.versatil');
    mockRollbackDir = path.join(mockVersatilHome, 'rollback-points');
    mockHistoryFile = path.join(mockVersatilHome, 'rollback-history.json');

    // Default mocks for fs
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockAccess.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ size: 1024 * 1024 } as any); // 1MB

    // Mock execAsync (promise-based) with smart command handling
    mockExecAsync.mockImplementation((cmd: string) => {
      if (cmd.includes('tar -czf') || cmd.includes('tar -xzf')) {
        return Promise.resolve({ stdout: '', stderr: '' });
      } else if (cmd.includes('npm install')) {
        return Promise.resolve({ stdout: 'Installed successfully', stderr: '' });
      } else if (cmd.includes('versatil --version')) {
        return Promise.resolve({ stdout: 'VERSATIL v3.0.0', stderr: '' });
      } else if (cmd.includes('npm list -g')) {
        return Promise.resolve({ stdout: 'versatil-sdlc-framework@3.0.0', stderr: '' });
      }
      return Promise.resolve({ stdout: '', stderr: '' });
    });
  });

  describe('Scenario 1: Create Rollback Point', () => {
    it('should create rollback point successfully', async () => {
      mockReadFile.mockResolvedValue('[]');

      const result = await rollbackManager.createRollbackPoint('2.0.0', 'Before updating to 3.0.0');

      expect(result).toMatchObject({
        version: '2.0.0',
        reason: 'Before updating to 3.0.0',
        automatic: true
      });

      expect(mockMkdir).toHaveBeenCalledWith(mockRollbackDir, { recursive: true });
      expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('tar -czf'));
      expect(mockWriteFile).toHaveBeenCalledWith(
        mockHistoryFile,
        expect.stringContaining('2.0.0')
      );
    });

    it('should handle tar compression failure', async () => {
      mockExecAsync.mockRejectedValue(
        new Error('tar: command failed')
      );

      await expect(
        rollbackManager.createRollbackPoint('2.0.0')
      ).rejects.toThrow('Failed to create rollback point');
    });

    it('should cleanup old rollback points when exceeding max', async () => {
      const existingPoints: RollbackPoint[] = [
        {
          version: '1.9.0',
          timestamp: new Date('2025-01-01').toISOString(),
          backupPath: '/path/to/v1.9.0.tar.gz',
          automatic: true
        },
        {
          version: '1.8.0',
          timestamp: new Date('2025-01-02').toISOString(),
          backupPath: '/path/to/v1.8.0.tar.gz',
          automatic: true
        },
        {
          version: '1.7.0',
          timestamp: new Date('2025-01-03').toISOString(),
          backupPath: '/path/to/v1.7.0.tar.gz',
          automatic: true
        },
        {
          version: '1.6.0',
          timestamp: new Date('2025-01-04').toISOString(),
          backupPath: '/path/to/v1.6.0.tar.gz',
          automatic: true
        },
        {
          version: '1.5.0',
          timestamp: new Date('2025-01-05').toISOString(),
          backupPath: '/path/to/v1.5.0.tar.gz',
          automatic: true
        }
      ];

      // Mock readFile to return different values on successive calls
      // First call: saveRollbackPoint reads existing 5 points
      // Second call: cleanupOldRollbackPoints reads 6 points (after save)
      const newPoint: RollbackPoint = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        backupPath: '/path/to/v2.0.0.tar.gz',
        automatic: true
      };

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(existingPoints))
        .mockResolvedValueOnce(JSON.stringify([...existingPoints, newPoint]));

      await rollbackManager.createRollbackPoint('2.0.0');

      // Should remove oldest point (1.9.0 - has earliest timestamp)
      expect(mockUnlink).toHaveBeenCalledWith('/path/to/v1.9.0.tar.gz');
    });
  });

  describe('Scenario 2: Rollback to Previous Version', () => {
    it('should rollback to previous version successfully', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date('2025-10-01').toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        },
        {
          version: '1.9.0',
          timestamp: new Date('2025-09-01').toISOString(),
          backupPath: '/path/to/v1.9.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));

      const result = await rollbackManager.rollbackToPrevious();

      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('tar -xzf'));
      expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('npm install -g versatil-sdlc-framework@2.0.0'));
    });

    it('should throw error when no rollback points exist', async () => {
      mockReadFile.mockResolvedValue('[]');

      await expect(rollbackManager.rollbackToPrevious()).rejects.toThrow(
        'No rollback points available'
      );
    });

    it('should return false on rollback extraction failure', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));

      mockExecAsync.mockRejectedValueOnce(new Error('tar extraction failed'));

      const result = await rollbackManager.rollbackToPrevious();

      expect(result).toBe(false);
    });
  });

  describe('Scenario 3: Rollback to Specific Version', () => {
    it('should rollback to specific version', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date('2025-10-01').toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        },
        {
          version: '1.9.0',
          timestamp: new Date('2025-09-01').toISOString(),
          backupPath: '/path/to/v1.9.0.tar.gz',
          automatic: true
        },
        {
          version: '1.8.0',
          timestamp: new Date('2025-08-01').toISOString(),
          backupPath: '/path/to/v1.8.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));

      const result = await rollbackManager.rollbackToVersion('1.8.0');

      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('npm install -g versatil-sdlc-framework@1.8.0'));
    });

    it('should throw error when version not found', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));

      await expect(rollbackManager.rollbackToVersion('1.5.0')).rejects.toThrow(
        'No rollback point found for version 1.5.0'
      );
    });
  });

  describe('Scenario 4: Health Check After Update', () => {
    it('should pass all health checks', async () => {
      // Mock successful health checks
      mockAccess.mockResolvedValue(undefined);
      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'VERSATIL v3.0.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'versatil-sdlc-framework@3.0.0', stderr: '' });

      const result = await rollbackManager.validateUpdateHealth();

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.critical).toHaveLength(0);
    });

    it('should detect missing framework directories', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await rollbackManager.validateUpdateHealth();

      expect(result.passed).toBe(false);
      expect(result.critical.length).toBeGreaterThan(0);
      expect(result.critical[0]).toContain('Missing directories');
    });

    it('should detect command failures', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockExecAsync.mockRejectedValue(new Error('command not found'));

      const result = await rollbackManager.validateUpdateHealth();

      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(100);
    });

    it('should identify warnings vs critical issues', async () => {
      // Mock: missing config (warning), but commands work (OK)
      let accessCallCount = 0;
      mockAccess.mockImplementation(() => {
        accessCallCount++;
        if (accessCallCount <= 4) {
          return Promise.resolve(undefined); // Directories OK
        }
        return Promise.reject(new Error('ENOENT')); // Config missing
      });

      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'VERSATIL v3.0.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'versatil-sdlc-framework@3.0.0', stderr: '' });

      const result = await rollbackManager.validateUpdateHealth();

      expect(result.critical).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario 5: Auto-Rollback on Failure', () => {
    it('should auto-rollback when health check fails', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));
      mockAccess.mockRejectedValue(new Error('ENOENT')); // Fail health check

      const updateFn = jest.fn().mockResolvedValue('success');

      await expect(
        rollbackManager.autoRollbackOnFailure(updateFn)
      ).rejects.toThrow('Update failed health check - auto-rolled back');

      expect(updateFn).toHaveBeenCalled();
      expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('tar -xzf')); // Rollback executed
    });

    it('should not rollback when health check passes', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'VERSATIL v3.0.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'versatil-sdlc-framework@3.0.0', stderr: '' });

      const updateFn = jest.fn().mockResolvedValue('success');

      const result = await rollbackManager.autoRollbackOnFailure(updateFn);

      expect(result).toBe('success');
      expect(updateFn).toHaveBeenCalled();
      expect(mockExecAsync).not.toHaveBeenCalledWith(expect.stringContaining('tar -xzf'));
    });

    it('should rollback when update function throws', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));

      const updateFn = jest.fn().mockRejectedValue(new Error('Update failed'));

      await expect(
        rollbackManager.autoRollbackOnFailure(updateFn)
      ).rejects.toThrow('Update failed');

      expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('tar -xzf'));
    });
  });

  describe('Scenario 6: Emergency Rollback', () => {
    it('should perform emergency rollback bypassing checks', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));

      const result = await rollbackManager.emergencyRollback();

      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('tar -xzf'));
      // Should NOT call npm install (emergency = extraction only)
      expect(mockExecAsync).not.toHaveBeenCalledWith(expect.stringContaining('npm install'));
    });

    it('should throw when no rollback points for emergency', async () => {
      mockReadFile.mockResolvedValue('[]');

      await expect(rollbackManager.emergencyRollback()).rejects.toThrow(
        'No rollback points available for emergency recovery'
      );
    });

    it('should return false on emergency extraction failure', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));
      mockExecAsync.mockRejectedValue(new Error('Extraction failed'));

      const result = await rollbackManager.emergencyRollback();

      expect(result).toBe(false);
    });
  });

  describe('Scenario 7: Rollback Storage Management', () => {
    it('should calculate total rollback storage', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        },
        {
          version: '1.9.0',
          timestamp: new Date().toISOString(),
          backupPath: '/path/to/v1.9.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));
      mockStat.mockResolvedValue({ size: 5 * 1024 * 1024 } as any); // 5MB each

      const total = await rollbackManager.getTotalRollbackStorage();

      expect(total).toBe(10 * 1024 * 1024); // 10MB total
    });

    it('should get individual rollback point size', async () => {
      const point: RollbackPoint = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        backupPath: '/path/to/v2.0.0.tar.gz',
        automatic: true
      };

      mockStat.mockResolvedValue({ size: 3 * 1024 * 1024 } as any); // 3MB

      const size = await rollbackManager.getRollbackPointSize(point);

      expect(size).toBe(3 * 1024 * 1024);
    });

    it('should return 0 for missing rollback file', async () => {
      const point: RollbackPoint = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        backupPath: '/path/to/missing.tar.gz',
        automatic: true
      };

      mockStat.mockRejectedValue(new Error('ENOENT'));

      const size = await rollbackManager.getRollbackPointSize(point);

      expect(size).toBe(0);
    });
  });

  describe('Scenario 8: List and Query Rollback Points', () => {
    it('should list rollback points sorted by newest first', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '1.9.0',
          timestamp: new Date('2025-09-01').toISOString(),
          backupPath: '/path/to/v1.9.0.tar.gz',
          automatic: true
        },
        {
          version: '2.0.0',
          timestamp: new Date('2025-10-01').toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        },
        {
          version: '1.8.0',
          timestamp: new Date('2025-08-01').toISOString(),
          backupPath: '/path/to/v1.8.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));

      const list = await rollbackManager.listRollbackPoints();

      expect(list).toHaveLength(3);
      expect(list[0].version).toBe('2.0.0'); // Newest
      expect(list[1].version).toBe('1.9.0');
      expect(list[2].version).toBe('1.8.0'); // Oldest
    });

    it('should return empty array when no rollback points', async () => {
      mockReadFile.mockResolvedValue('[]');

      const list = await rollbackManager.listRollbackPoints();

      expect(list).toHaveLength(0);
    });

    it('should handle missing history file', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      const list = await rollbackManager.listRollbackPoints();

      expect(list).toHaveLength(0);
    });
  });

  describe('Scenario 9: Rollback Chain (Multiple Updates)', () => {
    it('should rollback multiple updates at once', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '3.0.0',
          timestamp: new Date('2025-12-01').toISOString(),
          backupPath: '/path/to/v3.0.0.tar.gz',
          automatic: true
        },
        {
          version: '2.1.0',
          timestamp: new Date('2025-11-01').toISOString(),
          backupPath: '/path/to/v2.1.0.tar.gz',
          automatic: true
        },
        {
          version: '2.0.0',
          timestamp: new Date('2025-10-01').toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));

      const result = await rollbackManager.rollbackChain(2); // Rollback 2 updates

      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('npm install -g versatil-sdlc-framework@2.1.0'));
    });

    it('should throw when not enough rollback points', async () => {
      const rollbackPoints: RollbackPoint[] = [
        {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          backupPath: '/path/to/v2.0.0.tar.gz',
          automatic: true
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(rollbackPoints));

      await expect(rollbackManager.rollbackChain(3)).rejects.toThrow(
        'Only 1 rollback points available (requested 3)'
      );
    });
  });
});
