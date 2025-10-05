/**
 * Test Suite: VersionDiffGenerator
 * Tests for v3.0.0 version comparison and changelog parsing
 * Target: 90%+ coverage
 */

import { VersionDiffGenerator, VersionDiff } from '../../src/update/version-diff';
import { GitHubReleaseChecker, ReleaseInfo } from '../../src/update/github-release-checker';

// Mock GitHubReleaseChecker
jest.mock('../../src/update/github-release-checker');

const MockedGitHubReleaseChecker = GitHubReleaseChecker as jest.MockedClass<typeof GitHubReleaseChecker>;

describe('VersionDiffGenerator', () => {
  let diffGenerator: VersionDiffGenerator;
  let mockReleaseChecker: jest.Mocked<GitHubReleaseChecker>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReleaseChecker = new MockedGitHubReleaseChecker() as jest.Mocked<GitHubReleaseChecker>;
    diffGenerator = new VersionDiffGenerator(mockReleaseChecker);
  });

  describe('Scenario 1: Generate Basic Version Diff', () => {
    it('should generate diff between two versions', async () => {
      const fromRelease: ReleaseInfo = {
        version: '2.0.0',
        publishedAt: '2025-09-01T00:00:00Z',
        changelog: '## Features\n- Old feature',
        releaseNotes: 'Version 2.0.0',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      const toRelease: ReleaseInfo = {
        version: '3.0.0',
        publishedAt: '2025-10-01T00:00:00Z',
        changelog: '## Breaking Changes\n- API redesign\n\n## Features\n- New feature 1\n- New feature 2\n\n## Bug Fixes\n- Fixed bug 1',
        releaseNotes: 'Version 3.0.0',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(fromRelease);
      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(toRelease);

      const diff = await diffGenerator.generateDiff('2.0.0', '3.0.0');

      expect(diff.fromVersion).toBe('2.0.0');
      expect(diff.toVersion).toBe('3.0.0');
      expect(diff.updateType).toBe('major');
      expect(diff.breakingChanges.length).toBeGreaterThan(0);
      expect(diff.newFeatures.length).toBeGreaterThan(0);
      expect(diff.bugFixes.length).toBeGreaterThan(0);
    });

    it('should throw error when release not found', async () => {
      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(null);

      await expect(
        diffGenerator.generateDiff('2.0.0', '3.0.0')
      ).rejects.toThrow('Could not find release information');
    });

    it('should identify minor update type', async () => {
      const fromRelease: ReleaseInfo = {
        version: '2.0.0',
        publishedAt: '2025-09-01T00:00:00Z',
        changelog: 'Old version',
        releaseNotes: 'Version 2.0.0',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      const toRelease: ReleaseInfo = {
        version: '2.5.0',
        publishedAt: '2025-09-15T00:00:00Z',
        changelog: '## Features\n- New feature',
        releaseNotes: 'Version 2.5.0',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(fromRelease);
      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(toRelease);

      const diff = await diffGenerator.generateDiff('2.0.0', '2.5.0');

      expect(diff.updateType).toBe('minor');
    });

    it('should identify patch update type', async () => {
      const fromRelease: ReleaseInfo = {
        version: '2.0.0',
        publishedAt: '2025-09-01T00:00:00Z',
        changelog: 'Old version',
        releaseNotes: 'Version 2.0.0',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      const toRelease: ReleaseInfo = {
        version: '2.0.5',
        publishedAt: '2025-09-05T00:00:00Z',
        changelog: '## Bug Fixes\n- Fixed critical bug',
        releaseNotes: 'Version 2.0.5',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(fromRelease);
      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(toRelease);

      const diff = await diffGenerator.generateDiff('2.0.0', '2.0.5');

      expect(diff.updateType).toBe('patch');
    });
  });

  describe('Scenario 2: Parse Changelog Categories', () => {
    it('should parse breaking changes', async () => {
      const changelog = `
## Breaking Changes
- Removed deprecated API endpoints
- Changed configuration format

## Features
- New feature`;

      const fromRelease: ReleaseInfo = {
        version: '2.0.0',
        publishedAt: '2025-09-01T00:00:00Z',
        changelog: 'Old',
        releaseNotes: 'Old',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      const toRelease: ReleaseInfo = {
        version: '3.0.0',
        publishedAt: '2025-10-01T00:00:00Z',
        changelog,
        releaseNotes: 'Version 3.0.0',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(fromRelease);
      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(toRelease);

      const diff = await diffGenerator.generateDiff('2.0.0', '3.0.0');

      expect(diff.breakingChanges).toContain('Removed deprecated API endpoints');
      expect(diff.breakingChanges).toContain('Changed configuration format');
    });

    it('should parse security fixes', async () => {
      const changelog = `
## Security
- Fixed XSS vulnerability
- Patched SQL injection`;

      const fromRelease: ReleaseInfo = {
        version: '2.0.0',
        publishedAt: '2025-09-01T00:00:00Z',
        changelog: 'Old',
        releaseNotes: 'Old',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      const toRelease: ReleaseInfo = {
        version: '2.0.1',
        publishedAt: '2025-09-02T00:00:00Z',
        changelog,
        releaseNotes: 'Security patch',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(fromRelease);
      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(toRelease);

      const diff = await diffGenerator.generateDiff('2.0.0', '2.0.1');

      expect(diff.securityFixes).toContain('Fixed XSS vulnerability');
      expect(diff.securityFixes).toContain('Patched SQL injection');
    });

    it('should parse performance improvements', async () => {
      const changelog = `
## Performance
- 3x faster compilation
- Reduced memory usage by 40%`;

      const fromRelease: ReleaseInfo = {
        version: '2.0.0',
        publishedAt: '2025-09-01T00:00:00Z',
        changelog: 'Old',
        releaseNotes: 'Old',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      const toRelease: ReleaseInfo = {
        version: '2.1.0',
        publishedAt: '2025-09-15T00:00:00Z',
        changelog,
        releaseNotes: 'Performance update',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(fromRelease);
      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(toRelease);

      const diff = await diffGenerator.generateDiff('2.0.0', '2.1.0');

      expect(diff.performanceImprovements).toContain('3x faster compilation');
      expect(diff.performanceImprovements).toContain('Reduced memory usage by 40%');
    });

    it('should parse conventional commit format', async () => {
      const changelog = `
- feat: Add new authentication system
- fix: Resolve memory leak in cache
- perf: Optimize database queries
- docs: Update API documentation`;

      const fromRelease: ReleaseInfo = {
        version: '2.0.0',
        publishedAt: '2025-09-01T00:00:00Z',
        changelog: 'Old',
        releaseNotes: 'Old',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      const toRelease: ReleaseInfo = {
        version: '2.1.0',
        publishedAt: '2025-09-15T00:00:00Z',
        changelog,
        releaseNotes: 'Version 2.1.0',
        downloadUrl: 'https://test.com',
        prerelease: false
      };

      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(fromRelease);
      mockReleaseChecker.getReleaseByVersion.mockResolvedValueOnce(toRelease);

      const diff = await diffGenerator.generateDiff('2.0.0', '2.1.0');

      expect(diff.newFeatures).toContain('Add new authentication system');
      expect(diff.bugFixes).toContain('Resolve memory leak in cache');
      expect(diff.performanceImprovements).toContain('Optimize database queries');
      expect(diff.documentation).toContain('Update API documentation');
    });
  });

  describe('Scenario 3: Generate Cumulative Diff', () => {
    it('should aggregate changes from multiple releases', async () => {
      const releases: ReleaseInfo[] = [
        {
          version: '3.0.0',
          publishedAt: '2025-10-01T00:00:00Z',
          changelog: '## Features\n- Feature from 3.0.0',
          releaseNotes: 'Version 3.0.0',
          downloadUrl: 'https://test.com',
          prerelease: false
        },
        {
          version: '2.5.0',
          publishedAt: '2025-09-15T00:00:00Z',
          changelog: '## Features\n- Feature from 2.5.0\n\n## Bug Fixes\n- Fix from 2.5.0',
          releaseNotes: 'Version 2.5.0',
          downloadUrl: 'https://test.com',
          prerelease: false
        }
      ];

      mockReleaseChecker.getReleasesBetween.mockResolvedValueOnce(releases);

      const diff = await diffGenerator.generateCumulativeDiff('2.0.0', '3.0.0');

      expect(diff.newFeatures).toContain('Feature from 3.0.0');
      expect(diff.newFeatures).toContain('Feature from 2.5.0');
      expect(diff.bugFixes).toContain('Fix from 2.5.0');
      expect(diff.fullChangelog).toContain('3.0.0');
      expect(diff.fullChangelog).toContain('2.5.0');
    });

    it('should throw when no releases found', async () => {
      mockReleaseChecker.getReleasesBetween.mockResolvedValueOnce([]);

      await expect(
        diffGenerator.generateCumulativeDiff('2.0.0', '3.0.0')
      ).rejects.toThrow('No releases found between');
    });
  });

  describe('Scenario 4: Generate Summary', () => {
    it('should generate user-friendly summary', async () => {
      const diff: VersionDiff = {
        fromVersion: '2.0.0',
        toVersion: '3.0.0',
        updateType: 'major',
        breakingChanges: ['API redesign', 'Config format change'],
        newFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
        bugFixes: ['Bug fix 1', 'Bug fix 2'],
        deprecations: ['Old method deprecated'],
        securityFixes: ['XSS fix'],
        performanceImprovements: ['3x faster'],
        documentation: [],
        other: [],
        fullChangelog: 'Full changelog text',
        releaseNotes: 'Release notes'
      };

      const summary = diffGenerator.generateSummary(diff);

      expect(summary).toContain('2.0.0 → 3.0.0');
      expect(summary).toContain('Breaking Changes');
      expect(summary).toContain('Security Fixes');
      expect(summary).toContain('New Features');
      expect(summary).toContain('Bug Fixes');
      expect(summary).toContain('Deprecations');
    });

    it('should limit features/fixes to 5 in summary', async () => {
      const diff: VersionDiff = {
        fromVersion: '2.0.0',
        toVersion: '3.0.0',
        updateType: 'major',
        breakingChanges: [],
        newFeatures: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7'],
        bugFixes: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'],
        deprecations: [],
        securityFixes: [],
        performanceImprovements: [],
        documentation: [],
        other: [],
        fullChangelog: 'Full changelog',
        releaseNotes: 'Notes'
      };

      const summary = diffGenerator.generateSummary(diff);

      expect(summary).toContain('... and 2 more'); // For features (7-5=2)
      expect(summary).toContain('... and 1 more'); // For bug fixes (6-5=1)
    });
  });

  describe('Scenario 5: Utility Methods', () => {
    it('should detect when update requires user action', () => {
      const diff: VersionDiff = {
        fromVersion: '2.0.0',
        toVersion: '3.0.0',
        updateType: 'major',
        breakingChanges: ['API change'],
        newFeatures: [],
        bugFixes: [],
        deprecations: [],
        securityFixes: [],
        performanceImprovements: [],
        documentation: [],
        other: [],
        fullChangelog: 'Changelog',
        releaseNotes: 'Notes'
      };

      expect(diffGenerator.requiresUserAction(diff)).toBe(true);
    });

    it('should detect when update has security fixes', () => {
      const diff: VersionDiff = {
        fromVersion: '2.0.0',
        toVersion: '2.0.1',
        updateType: 'patch',
        breakingChanges: [],
        newFeatures: [],
        bugFixes: [],
        deprecations: [],
        securityFixes: ['XSS vulnerability'],
        performanceImprovements: [],
        documentation: [],
        other: [],
        fullChangelog: 'Changelog',
        releaseNotes: 'Notes'
      };

      expect(diffGenerator.hasSecurityFixes(diff)).toBe(true);
    });

    it('should recommend "required" action for security fixes', () => {
      const diff: VersionDiff = {
        fromVersion: '2.0.0',
        toVersion: '2.0.1',
        updateType: 'patch',
        breakingChanges: [],
        newFeatures: [],
        bugFixes: [],
        deprecations: [],
        securityFixes: ['Security issue'],
        performanceImprovements: [],
        documentation: [],
        other: [],
        fullChangelog: 'Changelog',
        releaseNotes: 'Notes'
      };

      expect(diffGenerator.getRecommendedAction(diff)).toBe('required');
    });

    it('should recommend "recommended" for breaking changes', () => {
      const diff: VersionDiff = {
        fromVersion: '2.0.0',
        toVersion: '3.0.0',
        updateType: 'major',
        breakingChanges: ['API change'],
        newFeatures: [],
        bugFixes: [],
        deprecations: [],
        securityFixes: [],
        performanceImprovements: [],
        documentation: [],
        other: [],
        fullChangelog: 'Changelog',
        releaseNotes: 'Notes'
      };

      expect(diffGenerator.getRecommendedAction(diff)).toBe('recommended');
    });

    it('should recommend "optional" for patch updates', () => {
      const diff: VersionDiff = {
        fromVersion: '2.0.0',
        toVersion: '2.0.1',
        updateType: 'patch',
        breakingChanges: [],
        newFeatures: [],
        bugFixes: ['Minor fix'],
        deprecations: [],
        securityFixes: [],
        performanceImprovements: [],
        documentation: [],
        other: [],
        fullChangelog: 'Changelog',
        releaseNotes: 'Notes'
      };

      expect(diffGenerator.getRecommendedAction(diff)).toBe('optional');
    });
  });
});
