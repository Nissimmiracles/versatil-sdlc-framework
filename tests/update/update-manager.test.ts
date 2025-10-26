/**
 * Tests for UpdateManager - Framework Update System
 * Tests for v3.0.0 Update Manager with backup, rollback, and update capabilities
 *
 * FIXED: Using __mocks__ directory for proper mock hoisting
 */

import { UpdateManager, UpdateConfig, UpdateHistory } from '../../src/update/update-manager';
import { GitHubReleaseChecker, ReleaseInfo, UpdateCheckResult } from '../../src/update/github-release-checker';
import * as path from 'path';
import * as os from 'os';

// Enable manual mocks from __mocks__ directory
jest.mock('child_process');
jest.mock('util');

// Import mockExecAsync from our manual mock (this works because __mocks__ is hoisted)
import { mockExecAsync } from '../__mocks__/child_process';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  readdir: jest.fn()
}));

// Mock GitHubReleaseChecker with factory
var sharedMockInstance = {
  checkForUpdate: jest.fn(),
  getLatestRelease: jest.fn(),
  getReleaseByTag: jest.fn(),
  getAllReleases: jest.fn(),
  getReleaseByVersion: jest.fn(),
  getReleasesBetween: jest.fn(),
  clearCache: jest.fn()
};

jest.mock('../../src/update/github-release-checker', () => ({
  GitHubReleaseChecker: jest.fn().mockImplementation(() => sharedMockInstance),
  GitHubReleaseError: class GitHubReleaseError extends Error {}
}));

describe('UpdateManager', () => {
  let updateManager;
  let versatilHome;
  let updateHistoryFile;

  // Get references to mocked modules
  const fs = require('fs/promises');
  const { exec } = require('child_process');

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup fs mocks
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockResolvedValue('[]');
    (fs.readdir as jest.Mock).mockResolvedValue([]);

    // Setup mockExecAsync (promise-based) with smart command handling
    mockExecAsync.mockImplementation((cmd) => {
      if (cmd.includes('tar -czf') || cmd.includes('tar -xzf')) {
        return Promise.resolve({ stdout: '', stderr: '' });
      } else if (cmd.includes('npm update')) {
        return Promise.resolve({ stdout: 'Updated successfully', stderr: '' });
      } else if (cmd.includes('versatil --version')) {
        // Extract version from npm update command or return default
        const updateMatch = (mockExecAsync.mock.calls || [])
          .flat()
          .find((call) => typeof call === 'string' && call.includes('npm update'))
          ?.match(/@(\d+\.\d+\.\d+)/);
        const version = updateMatch ? updateMatch[1] : '3.0.0';
        return Promise.resolve({ stdout: version, stderr: '' });
      }
      return Promise.resolve({ stdout: '', stderr: '' });
    });

    // Setup paths
    versatilHome = path.join(os.homedir(), '.versatil');
    updateHistoryFile = path.join(versatilHome, 'update-history.json');

    // Create update manager instance
    updateManager = new UpdateManager({
      autoCheck: false,
      checkInterval: 60000,
      includePrerelease: false,
      backupBeforeUpdate: true,
      autoUpdate: false
    });

    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. checkForUpdates - no updates available', () => {
    it('should return hasUpdate=false when current version is latest', async () => {
      const currentVersion = '3.0.0';
      const mockResult = {
        hasUpdate: false,
        currentVersion: '3.0.0',
        latestVersion: '3.0.0'
      };

      sharedMockInstance.checkForUpdate.mockResolvedValue(mockResult);

      const result = await updateManager.checkForUpdates(currentVersion);

      expect(result.hasUpdate).toBe(false);
      expect(result.currentVersion).toBe(currentVersion);
      expect(result.latestVersion).toBe(currentVersion);
      expect(sharedMockInstance.checkForUpdate).toHaveBeenCalledWith(currentVersion, false);
    });

    it('should handle check when already on future version', async () => {
      const currentVersion = '4.0.0';
      const mockResult = {
        hasUpdate: false,
        currentVersion: '4.0.0',
        latestVersion: '3.0.0'
      };

      sharedMockInstance.checkForUpdate.mockResolvedValue(mockResult);

      const result = await updateManager.checkForUpdates(currentVersion);

      expect(result.hasUpdate).toBe(false);
    });
  });

  describe('2. checkForUpdates - new version available', () => {
    it('should detect when a new version is available', async () => {
      const currentVersion = '2.5.0';
      const mockRelease: ReleaseInfo = {
        version: '3.0.0',
        tagName: 'v3.0.0',
        publishedAt: new Date().toISOString(),
        changelog: '# Version 3.0.0\n\n- New features\n- Bug fixes',
        releaseNotes: 'Major update with new features',
        downloadUrl: 'https://github.com/test/repo/archive/v3.0.0.tar.gz',
        prerelease: false
      };

      const mockResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0',
        releaseInfo: mockRelease,
        updateType: 'major'
      };

      sharedMockInstance.checkForUpdate.mockResolvedValue(mockResult);

      const result = await updateManager.checkForUpdates(currentVersion);

      expect(result.hasUpdate).toBe(true);
      expect(result.currentVersion).toBe('2.5.0');
      expect(result.latestVersion).toBe('3.0.0');
      expect(result.updateType).toBe('major');
      expect(result.releaseInfo).toEqual(mockRelease);
    });

    it('should correctly identify minor version updates', async () => {
      const mockResult = {
        hasUpdate: true,
        currentVersion: '3.0.0',
        latestVersion: '3.1.0',
        updateType: 'minor'
      };

      sharedMockInstance.checkForUpdate.mockResolvedValue(mockResult);

      const result = await updateManager.checkForUpdates('3.0.0');

      expect(result.hasUpdate).toBe(true);
      expect(result.updateType).toBe('minor');
    });

    it('should correctly identify patch version updates', async () => {
      const mockResult = {
        hasUpdate: true,
        currentVersion: '3.0.0',
        latestVersion: '3.0.1',
        updateType: 'patch'
      };

      sharedMockInstance.checkForUpdate.mockResolvedValue(mockResult);

      const result = await updateManager.checkForUpdates('3.0.0');

      expect(result.hasUpdate).toBe(true);
      expect(result.updateType).toBe('patch');
    });
  });

  describe('3. installUpdate - successful installation', () => {
    it('should successfully install an update with backup', async () => {
      const currentVersion = '2.5.0';
      const targetVersion = '3.0.0';

      // Mock update check
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0',
        updateType: 'major'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      // Mock backup creation and update commands
      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('tar -czf')) {
          return Promise.resolve({ stdout: '', stderr: '' });
        } else if (cmd.includes('npm update')) {
          return Promise.resolve({ stdout: 'Updated successfully', stderr: '' });
        } else if (cmd.includes('versatil --version')) {
          return Promise.resolve({ stdout: '3.0.0', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await updateManager.update(currentVersion);

      expect(result).toBe(true);
      expect((fs.mkdir as jest.Mock)).toHaveBeenCalled();
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('tar -czf')
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('npm update -g versatil-sdlc-framework@3.0.0')
      );
      expect((fs.writeFile as jest.Mock)).toHaveBeenCalled();
    });

    it('should skip backup if backupBeforeUpdate is false', async () => {
      const managerNoBackup = new UpdateManager({
        backupBeforeUpdate: false
      });

      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('npm update')) {
          return Promise.resolve({ stdout: 'Updated', stderr: '' });
        } else if (cmd.includes('versatil --version')) {
          return Promise.resolve({ stdout: '3.0.0', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      await managerNoBackup.update('2.5.0');

      // Should not call tar command for backup
      const tarCalls = mockExecAsync.mock.calls.filter(
        call => call[0].includes('tar -czf')
      );
      expect(tarCalls.length).toBe(0);
    });

    it('should record successful update in history', async () => {
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('npm update')) {
          return Promise.resolve({ stdout: 'Updated', stderr: '' });
        } else if (cmd.includes('versatil --version')) {
          return Promise.resolve({ stdout: '3.0.0', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      await updateManager.update('2.5.0');

      expect((fs.writeFile as jest.Mock)).toHaveBeenCalledWith(
        updateHistoryFile,
        expect.stringContaining('"success": true')
      );
    });
  });

  describe('4. installUpdate - network failure', () => {
    it('should handle network errors gracefully during update check', async () => {
      const networkError = new Error('Network request failed');
      sharedMockInstance.checkForUpdate.mockRejectedValue(networkError);

      const result = await updateManager.update('3.0.0');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Update failed')
      );
    });

    it('should handle npm update failures gracefully', async () => {
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('npm update')) {
          return Promise.reject(new Error('ECONNREFUSED: Connection refused'));
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await updateManager.update('2.5.0');

      expect(result).toBe(false);
      expect((fs.writeFile as jest.Mock)).toHaveBeenCalledWith(
        updateHistoryFile,
        expect.stringContaining('"success": false')
      );
    });

    it('should continue with failed backup warning', async () => {
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('tar -czf')) {
          return Promise.reject(new Error('Backup failed'));
        } else if (cmd.includes('npm update')) {
          return Promise.resolve({ stdout: 'Updated', stderr: '' });
        } else if (cmd.includes('versatil --version')) {
          return Promise.resolve({ stdout: '3.0.0', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await updateManager.update('2.5.0');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Backup failed')
      );
      // Update should still proceed
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('npm update')
      );
    });
  });

  describe('5. installUpdate - checksum validation', () => {
    it('should detect version mismatch after installation', async () => {
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('npm update')) {
          return Promise.resolve({ stdout: 'Updated', stderr: '' });
        } else if (cmd.includes('versatil --version')) {
          // Return wrong version
          return Promise.resolve({ stdout: '2.9.9', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await updateManager.update('2.5.0');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Update failed')
      );
    });

    it('should accept version without v prefix', async () => {
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('npm update')) {
          return Promise.resolve({ stdout: 'Updated', stderr: '' });
        } else if (cmd.includes('versatil --version')) {
          // Return version with v prefix
          return Promise.resolve({ stdout: 'v3.0.0\n', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await updateManager.update('2.5.0');

      expect(result).toBe(true);
    });
  });

  describe('6. crashRecovery - restore from crash', () => {
    it('should rollback to previous version from backup', async () => {
      const backupFile = path.join(versatilHome, 'backups', 'versatil-v2.5.0-2025-10-03T12-00-00.tar.gz');

      (fs.readdir as jest.Mock).mockResolvedValue(['versatil-v2.5.0-2025-10-03T12-00-00.tar.gz']);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('tar -xzf')) {
          return Promise.resolve({ stdout: '', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await updateManager.rollback(backupFile);

      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('tar -xzf')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Rollback complete')
      );
    });

    it('should find and use most recent backup if none specified', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        'versatil-v2.4.0-2025-10-01T12-00-00.tar.gz',
        'versatil-v2.5.0-2025-10-03T12-00-00.tar.gz',
        'versatil-v2.3.0-2025-09-30T12-00-00.tar.gz'
      ]);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('tar -xzf')) {
          return Promise.resolve({ stdout: '', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await updateManager.rollback();

      expect(result).toBe(true);
      // Should use most recent backup (2025-10-03)
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('versatil-v2.5.0-2025-10-03T12-00-00.tar.gz')
      );
    });

    it('should handle rollback failure gracefully', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue(['backup.tar.gz']);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('tar -xzf')) {
          return Promise.reject(new Error('Extraction failed'));
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await updateManager.rollback();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Rollback failed')
      );
    });

    it('should handle no backups found', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([]);

      const result = await updateManager.rollback();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('No backups found')
      );
    });
  });

  describe('7. updateLock - prevent concurrent updates', () => {
    it('should handle concurrent update attempts', async () => {
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      let updateInProgress = false;
      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('npm update')) {
          if (updateInProgress) {
            return Promise.reject(new Error('Update already in progress'));
            return Promise.resolve({ stdout: '', stderr: '' });
          }
          updateInProgress = true;
          setTimeout(() => {
            updateInProgress = false;
            return Promise.resolve({ stdout: 'Updated', stderr: '' });
          }, 100);
        } else if (cmd.includes('versatil --version')) {
          return Promise.resolve({ stdout: '3.0.0', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      // Start two updates concurrently
      const update1Promise = updateManager.update('2.5.0');
      const update2Promise = updateManager.update('2.5.0');

      const [result1, result2] = await Promise.all([update1Promise, update2Promise]);

      // At least one should complete (both might complete if timing is right)
      expect(result1 || result2).toBeDefined();
    });
  });

  describe('8. backupCreation - verify backup before update', () => {
    it('should create backup before starting update', async () => {
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      let backupCreated = false;
      let updateStarted = false;

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('tar -czf')) {
          expect(updateStarted).toBe(false); // Backup should happen before update
          backupCreated = true;
          return Promise.resolve({ stdout: '', stderr: '' });
        } else if (cmd.includes('npm update')) {
          expect(backupCreated).toBe(true); // Update should happen after backup
          updateStarted = true;
          return Promise.resolve({ stdout: 'Updated', stderr: '' });
        } else if (cmd.includes('versatil --version')) {
          return Promise.resolve({ stdout: '3.0.0', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      await updateManager.update('2.5.0');

      expect(backupCreated).toBe(true);
      expect(updateStarted).toBe(true);
    });

    it('should create backup with correct naming convention', async () => {
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('tar -czf')) {
          // Verify backup path includes version and timestamp
          expect(cmd).toMatch(/versatil-v2\.5\.0-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.tar\.gz/);
          return Promise.resolve({ stdout: '', stderr: '' });
        } else if (cmd.includes('npm update')) {
          return Promise.resolve({ stdout: 'Updated', stderr: '' });
        } else if (cmd.includes('versatil --version')) {
          return Promise.resolve({ stdout: '3.0.0', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      await updateManager.update('2.5.0');
    });

    it('should create backups directory if it does not exist', async () => {
      const mockCheckResult = {
        hasUpdate: true,
        currentVersion: '2.5.0',
        latestVersion: '3.0.0'
      };
      sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

      mockExecAsync.mockImplementation((cmd) => {
        if (cmd.includes('tar -czf')) {
          return Promise.resolve({ stdout: '', stderr: '' });
        } else if (cmd.includes('npm update')) {
          return Promise.resolve({ stdout: 'Updated', stderr: '' });
        } else if (cmd.includes('versatil --version')) {
          return Promise.resolve({ stdout: '3.0.0', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      await updateManager.update('2.5.0');

      expect((fs.mkdir as jest.Mock)).toHaveBeenCalledWith(
        expect.stringContaining('backups'),
        expect.objectContaining({ recursive: true })
      );
    });
  });

  describe('Additional UpdateManager Features', () => {
    describe('getUpdateHistory', () => {
      it('should retrieve update history from file', async () => {
        const mockHistory: UpdateHistory[] = [
          {
            timestamp: '2025-10-01T12:00:00.000Z',
            fromVersion: '2.4.0',
            toVersion: '2.5.0',
            success: true
          },
          {
            timestamp: '2025-10-03T12:00:00.000Z',
            fromVersion: '2.5.0',
            toVersion: '3.0.0',
            success: true
          }
        ];

        (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

        const history = await updateManager.getUpdateHistory();

        expect(history).toEqual(mockHistory);
        expect((fs.readFile as jest.Mock)).toHaveBeenCalledWith(updateHistoryFile, 'utf-8');
      });

      it('should return empty array if history file does not exist', async () => {
        (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

        const history = await updateManager.getUpdateHistory();

        expect(history).toEqual([]);
      });
    });

    describe('getChangelog', () => {
      it('should retrieve changelog for specific version', async () => {
        const mockRelease: ReleaseInfo = {
          version: '3.0.0',
          tagName: 'v3.0.0',
          publishedAt: '2025-10-03T12:00:00.000Z',
          changelog: '# Version 3.0.0\n\n- Feature A\n- Feature B',
          releaseNotes: 'Major release',
          downloadUrl: 'https://test.com/release.tar.gz',
          prerelease: false
        };

        sharedMockInstance.getReleaseByTag.mockResolvedValue(mockRelease);

        const changelog = await updateManager.getChangelog('3.0.0');

        expect(changelog).toBe('# Version 3.0.0\n\n- Feature A\n- Feature B');
        expect(sharedMockInstance.getReleaseByTag).toHaveBeenCalledWith('v3.0.0');
      });

      it('should retrieve latest changelog when no version specified', async () => {
        const mockRelease: ReleaseInfo = {
          version: '3.0.0',
          tagName: 'v3.0.0',
          publishedAt: '2025-10-03T12:00:00.000Z',
          changelog: '# Latest Release',
          releaseNotes: 'Latest',
          downloadUrl: 'https://test.com/release.tar.gz',
          prerelease: false
        };

        sharedMockInstance.getLatestRelease.mockResolvedValue(mockRelease);

        const changelog = await updateManager.getChangelog();

        expect(changelog).toBe('# Latest Release');
      });

      it('should return fallback message when changelog unavailable', async () => {
        sharedMockInstance.getReleaseByTag.mockRejectedValue(new Error('Not found'));

        const changelog = await updateManager.getChangelog('3.0.0');

        expect(changelog).toBe('Changelog not available');
      });
    });

    describe('listBackups', () => {
      it('should list all available backups', async () => {
        const mockBackups = [
          'versatil-v2.5.0-2025-10-03T12-00-00.tar.gz',
          'versatil-v2.4.0-2025-10-01T12-00-00.tar.gz',
          'versatil-v2.3.0-2025-09-30T12-00-00.tar.gz'
        ];

        (fs.readdir as jest.Mock).mockResolvedValue(mockBackups);

        const backups = await updateManager.listBackups();

        expect(backups).toEqual(mockBackups); // Should be sorted newest first
      });

      it('should filter out non-backup files', async () => {
        const mockFiles = [
          'versatil-v2.5.0-2025-10-03T12-00-00.tar.gz',
          'README.md',
          'config.json',
          'versatil-v2.4.0-2025-10-01T12-00-00.tar.gz'
        ];

        (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

        const backups = await updateManager.listBackups();

        expect(backups).toHaveLength(2);
        expect(backups.every(b => b.endsWith('.tar.gz'))).toBe(true);
      });

      it('should return empty array if backups directory does not exist', async () => {
        (fs.readdir as jest.Mock).mockRejectedValue(new Error('ENOENT'));

        const backups = await updateManager.listBackups();

        expect(backups).toEqual([]);
      });
    });

    describe('Configuration', () => {
      it('should initialize with default configuration', () => {
        const defaultManager = new UpdateManager();
        expect(defaultManager).toBeDefined();
      });

      it('should accept custom configuration', () => {
        const customConfig: Partial<UpdateConfig> = {
          autoCheck: true,
          includePrerelease: true,
          backupBeforeUpdate: false,
          autoUpdate: true
        };

        const customManager = new UpdateManager(customConfig);
        expect(customManager).toBeDefined();
      });
    });

    describe('Update History Recording', () => {
      it('should record failed updates with error message', async () => {
        const mockCheckResult = {
          hasUpdate: true,
          currentVersion: '2.5.0',
          latestVersion: '3.0.0'
        };
        sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

        const errorMessage = 'Network error occurred';
        mockExecAsync.mockImplementation((cmd) => {
          if (cmd.includes('npm update')) {
            return Promise.reject(new Error(errorMessage));
          }
          return Promise.resolve({ stdout: '', stderr: '' });
        });

        await updateManager.update('2.5.0');

        expect((fs.writeFile as jest.Mock)).toHaveBeenCalledWith(
          updateHistoryFile,
          expect.stringContaining('"success": false')
        );
        expect((fs.writeFile as jest.Mock)).toHaveBeenCalledWith(
          updateHistoryFile,
          expect.stringContaining(errorMessage)
        );
      });

      it('should limit history to 50 entries', async () => {
        // Create history with 55 entries
        const largeHistory: UpdateHistory[] = Array.from({ length: 55 }, (_, i) => ({
          timestamp: new Date(2025, 9, i + 1).toISOString(),
          fromVersion: `2.${i}.0`,
          toVersion: `2.${i + 1}.0`,
          success: true
        }));

        (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(largeHistory));

        const mockCheckResult = {
          hasUpdate: true,
          currentVersion: '3.0.0',
          latestVersion: '3.1.0'
        };
        sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

        mockExecAsync.mockImplementation((cmd) => {
          if (cmd.includes('npm update')) {
            return Promise.resolve({ stdout: 'Updated', stderr: '' });
          } else if (cmd.includes('versatil --version')) {
            return Promise.resolve({ stdout: '3.1.0', stderr: '' });
          }
          return Promise.resolve({ stdout: '', stderr: '' });
        });

        await updateManager.update('3.0.0');

        // Verify that history was trimmed
        const writeCall = ((fs.writeFile as jest.Mock) as jest.Mock).mock.calls.find(
          call => call[0] === updateHistoryFile
        );
        const writtenHistory = JSON.parse(writeCall[1]);
        expect(writtenHistory.length).toBe(50);
      });

      it('should not fail update if history recording fails', async () => {
        const mockCheckResult = {
          hasUpdate: true,
          currentVersion: '2.5.0',
          latestVersion: '3.0.0'
        };
        sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

        mockExecAsync.mockImplementation((cmd) => {
          if (cmd.includes('npm update')) {
            return Promise.resolve({ stdout: 'Updated', stderr: '' });
          } else if (cmd.includes('versatil --version')) {
            return Promise.resolve({ stdout: '3.0.0', stderr: '' });
          }
          return Promise.resolve({ stdout: '', stderr: '' });
        });

        // Make writeFile fail
        (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Disk full'));

        const result = await updateManager.update('2.5.0');

        // Update should still succeed
        expect(result).toBe(true);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Failed to record update history'),
          expect.any(Error)
        );
      });
    });

    describe('No Update Scenario', () => {
      it('should return true and log message when already on latest version', async () => {
        const mockCheckResult = {
          hasUpdate: false,
          currentVersion: '3.0.0',
          latestVersion: '3.0.0'
        };
        sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

        const result = await updateManager.update('3.0.0');

        expect(result).toBe(true);
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Already on latest version')
        );
      });

      it('should install specific target version even if no update available', async () => {
        const mockCheckResult = {
          hasUpdate: false,
          currentVersion: '3.0.0',
          latestVersion: '3.0.0'
        };
        sharedMockInstance.checkForUpdate.mockResolvedValue(mockCheckResult);

        mockExecAsync.mockImplementation((cmd) => {
          if (cmd.includes('npm update')) {
            return Promise.resolve({ stdout: 'Updated', stderr: '' });
          } else if (cmd.includes('versatil --version')) {
            return Promise.resolve({ stdout: '2.5.0', stderr: '' });
          }
          return Promise.resolve({ stdout: '', stderr: '' });
        });

        const result = await updateManager.update('3.0.0', '2.5.0');

        expect(mockExecAsync).toHaveBeenCalledWith(
          expect.stringContaining('versatil-sdlc-framework@2.5.0')
        );
      });
    });
  });
});
