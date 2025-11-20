/**
 * VERSATIL SDLC Framework - Version Manager Tests
 * Priority 2: Guardian System Testing
 *
 * Test Coverage:
 * - Version parsing and calculation
 * - Semantic versioning (major, minor, patch)
 * - Git integration
 * - Release information
 * - Roadmap progress tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VersionManager } from './version-manager.js';
import type { VersionInfo, ReleaseInfo, VersionBumpType } from './version-manager.js';
import * as fs from 'fs';
import { exec } from 'child_process';

// Mock fs
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
  },
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

describe('VersionManager', () => {
  let versionManager: VersionManager;
  const mockFrameworkRoot = '/test/framework';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock package.json read
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      version: '7.16.2',
      name: '@versatil/sdlc-framework'
    }));

    // Mock git commands
    vi.mocked(exec).mockImplementation((cmd: any, options: any, callback: any) => {
      if (cmd.includes('rev-parse')) {
        callback(null, { stdout: 'main\n', stderr: '' });
      } else if (cmd.includes('status --porcelain')) {
        callback(null, { stdout: '', stderr: '' });
      } else if (cmd.includes('rev-list')) {
        callback(null, { stdout: '5\n', stderr: '' });
      } else if (cmd.includes('log')) {
        callback(null, { stdout: '2025-11-01', stderr: '' });
      } else {
        callback(null, { stdout: '', stderr: '' });
      }
      return {} as any;
    });

    versionManager = VersionManager.getInstance(mockFrameworkRoot);
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = VersionManager.getInstance(mockFrameworkRoot);
      const instance2 = VersionManager.getInstance(mockFrameworkRoot);

      expect(instance1).toBe(instance2);
    });
  });

  describe('Version Parsing', () => {
    it('should parse current version from package.json', async () => {
      const versionInfo = await versionManager.getVersionInfo();

      expect(versionInfo.current).toBe('7.16.2');
    });

    it('should calculate next major version', async () => {
      const versionInfo = await versionManager.getVersionInfo();

      expect(versionInfo.next_major).toBe('8.0.0');
    });

    it('should calculate next minor version', async () => {
      const versionInfo = await versionManager.getVersionInfo();

      expect(versionInfo.next_minor).toBe('7.17.0');
    });

    it('should calculate next patch version', async () => {
      const versionInfo = await versionManager.getVersionInfo();

      expect(versionInfo.next_patch).toBe('7.16.3');
    });

    it('should handle different version formats', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        version: '1.0.0'
      }));

      const versionInfo = await versionManager.getVersionInfo();

      expect(versionInfo.current).toBe('1.0.0');
      expect(versionInfo.next_major).toBe('2.0.0');
      expect(versionInfo.next_minor).toBe('1.1.0');
      expect(versionInfo.next_patch).toBe('1.0.1');
    });
  });

  describe('Git Integration', () => {
    it('should detect current git branch', async () => {
      const versionInfo = await versionManager.getVersionInfo();

      expect(versionInfo.branch).toBe('main');
    });

    it('should detect clean working tree', async () => {
      const versionInfo = await versionManager.getVersionInfo();

      expect(versionInfo.is_clean).toBe(true);
    });

    it('should detect dirty working tree', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, options: any, callback: any) => {
        if (cmd.includes('status --porcelain')) {
          callback(null, { stdout: 'M file.ts\n', stderr: '' });
        } else if (cmd.includes('rev-parse')) {
          callback(null, { stdout: 'main\n', stderr: '' });
        } else {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      const versionInfo = await versionManager.getVersionInfo();

      expect(versionInfo.is_clean).toBe(false);
    });

    it('should count commits since release', async () => {
      const versionInfo = await versionManager.getVersionInfo();

      expect(versionInfo.commits_since_release).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Version Bumping', () => {
    it('should validate major bump', () => {
      const isValid = versionManager.validateVersionBump('7.16.2', '8.0.0', 'major' as VersionBumpType);

      expect(isValid).toBe(true);
    });

    it('should validate minor bump', () => {
      const isValid = versionManager.validateVersionBump('7.16.2', '7.17.0', 'minor' as VersionBumpType);

      expect(isValid).toBe(true);
    });

    it('should validate patch bump', () => {
      const isValid = versionManager.validateVersionBump('7.16.2', '7.16.3', 'patch' as VersionBumpType);

      expect(isValid).toBe(true);
    });
  });

  describe('Release Information', () => {
    it('should generate release info structure', async () => {
      const releaseInfo = await versionManager.generateReleaseInfo('7.17.0');

      expect(releaseInfo).toHaveProperty('version');
      expect(releaseInfo).toHaveProperty('date');
      expect(releaseInfo).toHaveProperty('features');
      expect(releaseInfo).toHaveProperty('fixes');
      expect(releaseInfo).toHaveProperty('breaking_changes');
      expect(releaseInfo).toHaveProperty('deprecations');
      expect(releaseInfo).toHaveProperty('commits');
      expect(releaseInfo).toHaveProperty('contributors');
    });

    it('should include version in release info', async () => {
      const releaseInfo = await versionManager.generateReleaseInfo('8.0.0');

      expect(releaseInfo.version).toBe('8.0.0');
    });

    it('should include date in release info', async () => {
      const releaseInfo = await versionManager.generateReleaseInfo('7.17.0');

      expect(releaseInfo.date).toBeDefined();
      expect(typeof releaseInfo.date).toBe('string');
    });

    it('should categorize features and fixes', async () => {
      const releaseInfo = await versionManager.generateReleaseInfo('7.17.0');

      expect(Array.isArray(releaseInfo.features)).toBe(true);
      expect(Array.isArray(releaseInfo.fixes)).toBe(true);
    });
  });

  describe('Semantic Versioning Validation', () => {
    it('should validate semantic version format', () => {
      expect(versionManager.isValidSemanticVersion('1.0.0')).toBe(true);
      expect(versionManager.isValidSemanticVersion('7.16.2')).toBe(true);
    });

    it('should reject invalid version formats', () => {
      expect(versionManager.isValidSemanticVersion('1.0')).toBe(false);
      expect(versionManager.isValidSemanticVersion('v1.0.0')).toBe(false);
      expect(versionManager.isValidSemanticVersion('not-a-version')).toBe(false);
    });

    it('should compare version numbers', () => {
      expect(versionManager.compareVersions('7.17.0', '7.16.2')).toBeGreaterThan(0);
      expect(versionManager.compareVersions('7.16.2', '7.17.0')).toBeLessThan(0);
      expect(versionManager.compareVersions('7.16.2', '7.16.2')).toBe(0);
    });
  });

  describe('Roadmap Progress', () => {
    it('should calculate roadmap progress', async () => {
      const progress = await versionManager.getRoadmapProgress();

      expect(progress).toHaveProperty('total_milestones');
      expect(progress).toHaveProperty('completed_milestones');
      expect(progress).toHaveProperty('progress_percentage');
      expect(progress).toHaveProperty('upcoming_features');
      expect(progress).toHaveProperty('next_version');
    });

    it('should calculate progress percentage', async () => {
      const progress = await versionManager.getRoadmapProgress();

      expect(progress.progress_percentage).toBeGreaterThanOrEqual(0);
      expect(progress.progress_percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing package.json', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(versionManager.getVersionInfo()).rejects.toThrow();
    });

    it('should handle git command failures', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, options: any, callback: any) => {
        callback(new Error('Git error'), null, null);
        return {} as any;
      });

      await expect(versionManager.getVersionInfo()).rejects.toThrow();
    });

    it('should handle malformed version strings', () => {
      expect(versionManager.isValidSemanticVersion('invalid')).toBe(false);
      expect(versionManager.isValidSemanticVersion('')).toBe(false);
    });
  });
});
