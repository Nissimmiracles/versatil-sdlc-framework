/**
 * Test Suite: GitHubReleaseChecker
 * Tests for v3.0.0 GitHub release fetching and parsing
 * Target: 90%+ coverage
 */

import { GitHubReleaseChecker, ReleaseInfo, UpdateCheckResult, GitHubReleaseError } from '../../src/update/github-release-checker';

// Mock global fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('GitHubReleaseChecker', () => {
  let checker: GitHubReleaseChecker;

  beforeEach(() => {
    jest.clearAllMocks();
    checker = new GitHubReleaseChecker('test-owner', 'test-repo');
  });

  describe('Scenario 1: Get Latest Release', () => {
    it('should fetch latest release successfully', async () => {
      const mockRelease = {
        tag_name: 'v3.0.0',
        published_at: '2025-10-01T00:00:00Z',
        body: '## Features\n- New feature 1\n- New feature 2',
        tarball_url: 'https://api.github.com/repos/test/test/tarball/v3.0.0',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRelease
      } as Response);

      const release = await checker.getLatestRelease();

      expect(release.version).toBe('3.0.0');
      expect(release.tagName).toBe('v3.0.0');
      expect(release.prerelease).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/releases/latest'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json'
          })
        })
      );
    });

    it('should handle 404 error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(checker.getLatestRelease()).rejects.toThrow(
        'No releases found for this repository'
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(checker.getLatestRelease()).rejects.toThrow(
        'GitHub API error: 500 Internal Server Error'
      );
    });

    it('should use cache for repeated requests', async () => {
      const mockRelease = {
        tag_name: 'v3.0.0',
        published_at: '2025-10-01T00:00:00Z',
        body: 'Release notes',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      // First call - should fetch
      await checker.getLatestRelease();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await checker.getLatestRelease();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should skip prerelease when includePrerelease=false', async () => {
      const mockPrereleaseResponse = {
        tag_name: 'v3.0.0-beta.1',
        published_at: '2025-10-01T00:00:00Z',
        body: 'Beta release',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: true,
        draft: false
      };

      const mockStableRelease = {
        tag_name: 'v2.0.0',
        published_at: '2025-09-01T00:00:00Z',
        body: 'Stable release',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPrereleaseResponse
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockStableRelease]
        } as Response);

      const release = await checker.getLatestRelease(false);

      expect(release.version).toBe('2.0.0');
      expect(release.prerelease).toBe(false);
    });
  });

  describe('Scenario 2: Check for Updates', () => {
    it('should detect available update', async () => {
      const mockRelease = {
        tag_name: 'v3.0.0',
        published_at: '2025-10-01T00:00:00Z',
        body: 'New version',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      const result = await checker.checkForUpdate('2.0.0');

      expect(result.hasUpdate).toBe(true);
      expect(result.currentVersion).toBe('2.0.0');
      expect(result.latestVersion).toBe('3.0.0');
      expect(result.updateType).toBe('major');
    });

    it('should detect no update when already latest', async () => {
      const mockRelease = {
        tag_name: 'v3.0.0',
        published_at: '2025-10-01T00:00:00Z',
        body: 'Current version',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      const result = await checker.checkForUpdate('3.0.0');

      expect(result.hasUpdate).toBe(false);
      expect(result.currentVersion).toBe('3.0.0');
      expect(result.latestVersion).toBe('3.0.0');
    });

    it('should identify update type correctly (minor)', async () => {
      const mockRelease = {
        tag_name: 'v2.5.0',
        published_at: '2025-10-01T00:00:00Z',
        body: 'Minor update',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      const result = await checker.checkForUpdate('2.0.0');

      expect(result.hasUpdate).toBe(true);
      expect(result.updateType).toBe('minor');
    });

    it('should identify update type correctly (patch)', async () => {
      const mockRelease = {
        tag_name: 'v2.0.5',
        published_at: '2025-10-01T00:00:00Z',
        body: 'Patch update',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      const result = await checker.checkForUpdate('2.0.0');

      expect(result.hasUpdate).toBe(true);
      expect(result.updateType).toBe('patch');
    });

    it('should return no update on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checker.checkForUpdate('2.0.0');

      expect(result.hasUpdate).toBe(false);
      expect(result.currentVersion).toBe('2.0.0');
      expect(result.latestVersion).toBe('2.0.0');
    });
  });

  describe('Scenario 3: Get All Releases', () => {
    it('should fetch multiple releases', async () => {
      const mockReleases = [
        {
          tag_name: 'v3.0.0',
          published_at: '2025-10-01T00:00:00Z',
          body: 'Version 3.0.0',
          tarball_url: 'https://api.github.com/test',
          assets: [],
          prerelease: false,
          draft: false
        },
        {
          tag_name: 'v2.0.0',
          published_at: '2025-09-01T00:00:00Z',
          body: 'Version 2.0.0',
          tarball_url: 'https://api.github.com/test',
          assets: [],
          prerelease: false,
          draft: false
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReleases
      } as Response);

      const releases = await checker.getAllReleases(10);

      expect(releases).toHaveLength(2);
      expect(releases[0].version).toBe('3.0.0');
      expect(releases[1].version).toBe('2.0.0');
    });

    it('should respect limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await checker.getAllReleases(5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=5'),
        expect.any(Object)
      );
    });
  });

  describe('Scenario 4: Get Release by Tag', () => {
    it('should fetch specific release by tag', async () => {
      const mockRelease = {
        tag_name: 'v2.5.0',
        published_at: '2025-09-15T00:00:00Z',
        body: 'Version 2.5.0',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      const release = await checker.getReleaseByTag('v2.5.0');

      expect(release.version).toBe('2.5.0');
      expect(release.tagName).toBe('v2.5.0');
    });

    it('should throw error when tag not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(checker.getReleaseByTag('v9.9.9')).rejects.toThrow(
        'Release not found: v9.9.9'
      );
    });
  });

  describe('Scenario 5: Get Release by Version', () => {
    it('should fetch release by version (without v prefix)', async () => {
      const mockRelease = {
        tag_name: 'v2.5.0',
        published_at: '2025-09-15T00:00:00Z',
        body: 'Version 2.5.0',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      const release = await checker.getReleaseByVersion('2.5.0');

      expect(release?.version).toBe('2.5.0');
    });

    it('should return null when version not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as Response);

      const release = await checker.getReleaseByVersion('9.9.9');

      expect(release).toBeNull();
    });
  });

  describe('Scenario 6: Get Releases Between Versions', () => {
    it('should fetch releases between two versions', async () => {
      const mockReleases = [
        {
          tag_name: 'v3.0.0',
          published_at: '2025-10-01T00:00:00Z',
          body: 'Version 3.0.0',
          tarball_url: 'https://api.github.com/test',
          assets: [],
          prerelease: false,
          draft: false
        },
        {
          tag_name: 'v2.5.0',
          published_at: '2025-09-15T00:00:00Z',
          body: 'Version 2.5.0',
          tarball_url: 'https://api.github.com/test',
          assets: [],
          prerelease: false,
          draft: false
        },
        {
          tag_name: 'v2.0.0',
          published_at: '2025-09-01T00:00:00Z',
          body: 'Version 2.0.0',
          tarball_url: 'https://api.github.com/test',
          assets: [],
          prerelease: false,
          draft: false
        },
        {
          tag_name: 'v1.5.0',
          published_at: '2025-08-01T00:00:00Z',
          body: 'Version 1.5.0',
          tarball_url: 'https://api.github.com/test',
          assets: [],
          prerelease: false,
          draft: false
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReleases
      } as Response);

      const releases = await checker.getReleasesBetween('2.0.0', '3.0.0');

      expect(releases).toHaveLength(2);
      expect(releases[0].version).toBe('3.0.0');
      expect(releases[1].version).toBe('2.5.0');
    });

    it('should return empty array when no releases in range', async () => {
      const mockReleases = [
        {
          tag_name: 'v1.0.0',
          published_at: '2025-01-01T00:00:00Z',
          body: 'Old version',
          tarball_url: 'https://api.github.com/test',
          assets: [],
          prerelease: false,
          draft: false
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReleases
      } as Response);

      const releases = await checker.getReleasesBetween('2.0.0', '3.0.0');

      expect(releases).toHaveLength(0);
    });
  });

  describe('Scenario 7: Cache Management', () => {
    it('should clear cache', async () => {
      const mockRelease = {
        tag_name: 'v3.0.0',
        published_at: '2025-10-01T00:00:00Z',
        body: 'Cached release',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRelease
      } as Response);

      // First call - caches
      await checker.getLatestRelease();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - uses cache
      await checker.getLatestRelease();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      checker.clearCache();

      // Third call - fetches again
      await checker.getLatestRelease();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Scenario 8: Parse Release Data', () => {
    it('should parse release with assets', async () => {
      const mockRelease = {
        tag_name: 'v3.0.0',
        published_at: '2025-10-01T00:00:00Z',
        body: '## Changelog\n- Feature 1\n- Feature 2',
        tarball_url: 'https://api.github.com/test/tarball',
        assets: [
          {
            name: 'versatil-3.0.0.tgz',
            browser_download_url: 'https://github.com/test/download/versatil-3.0.0.tgz',
            size: 1024000,
            content_type: 'application/gzip'
          }
        ],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      const release = await checker.getLatestRelease();

      expect(release.assets).toHaveLength(1);
      expect(release.assets![0].name).toBe('versatil-3.0.0.tgz');
      expect(release.assets![0].size).toBe(1024000);
    });

    it('should handle release without body', async () => {
      const mockRelease = {
        tag_name: 'v3.0.0',
        published_at: '2025-10-01T00:00:00Z',
        body: null,
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      const release = await checker.getLatestRelease();

      expect(release.changelog).toBe('No changelog available');
      expect(release.releaseNotes).toBe('No release notes available');
    });

    it('should strip v prefix from version', async () => {
      const mockRelease = {
        tag_name: 'v3.0.0',
        published_at: '2025-10-01T00:00:00Z',
        body: 'Release',
        tarball_url: 'https://api.github.com/test',
        assets: [],
        prerelease: false,
        draft: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelease
      } as Response);

      const release = await checker.getLatestRelease();

      expect(release.version).toBe('3.0.0'); // Without 'v'
      expect(release.tagName).toBe('v3.0.0'); // With 'v'
    });
  });
});
