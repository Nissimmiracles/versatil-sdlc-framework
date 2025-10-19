/**
 * GitHub MCP Integration Tests
 *
 * Tests GitHub repository operations and integration with Sarah-PM agent.
 *
 * Tests:
 * - Repository file reading
 * - Code search
 * - Issue creation (mock)
 * - Pull request operations
 * - Sarah-PM integration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface GitHubMCPClient {
  getFile(repo: string, path: string, ref?: string): Promise<GitHubFile>;
  searchCode(query: string, repo?: string): Promise<GitHubSearchResult[]>;
  createIssue(repo: string, options: CreateIssueOptions): Promise<GitHubIssue>;
  getIssue(repo: string, issueNumber: number): Promise<GitHubIssue>;
  listPullRequests(repo: string, state?: 'open' | 'closed' | 'all'): Promise<GitHubPullRequest[]>;
  close(): Promise<void>;
}

interface GitHubFile {
  path: string;
  content: string;
  sha: string;
  size: number;
  encoding: 'base64' | 'utf-8';
}

interface GitHubSearchResult {
  path: string;
  repository: string;
  score: number;
  matches: Array<{ line: number; text: string }>;
}

interface CreateIssueOptions {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface GitHubPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  headBranch: string;
  baseBranch: string;
  createdAt: Date;
}

// ============================================================================
// Mock GitHub MCP Client
// ============================================================================

/**
 * Mock implementation of GitHub MCP client for testing
 *
 * In production, this would connect to the actual @modelcontextprotocol/server-github
 * via MCP stdio protocol. For tests, we mock the behavior.
 */
class MockGitHubMCPClient implements GitHubMCPClient {
  private mockFiles: Map<string, GitHubFile> = new Map();
  private mockIssues: Map<string, GitHubIssue> = new Map();
  private issueCounter: number = 1;

  constructor() {
    this.initializeMockData();
  }

  async getFile(repo: string, path: string, ref?: string): Promise<GitHubFile> {
    const key = `${repo}:${path}`;
    const file = this.mockFiles.get(key);

    if (!file) {
      throw new Error(`File not found: ${path} in ${repo}`);
    }

    return { ...file };
  }

  async searchCode(query: string, repo?: string): Promise<GitHubSearchResult[]> {
    const results: GitHubSearchResult[] = [];

    // Search through mock files
    for (const [key, file] of this.mockFiles.entries()) {
      const [fileRepo, filePath] = key.split(':');

      // Filter by repo if specified
      if (repo && fileRepo !== repo) continue;

      // Simple text search in content
      if (file.content.toLowerCase().includes(query.toLowerCase())) {
        const lines = file.content.split('\n');
        const matches = lines
          .map((line, index) => ({ line: index + 1, text: line }))
          .filter(match => match.text.toLowerCase().includes(query.toLowerCase()));

        results.push({
          path: filePath,
          repository: fileRepo,
          score: matches.length,
          matches: matches.slice(0, 3) // Top 3 matches per file
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  async createIssue(repo: string, options: CreateIssueOptions): Promise<GitHubIssue> {
    const issue: GitHubIssue = {
      number: this.issueCounter++,
      title: options.title,
      body: options.body,
      state: 'open',
      labels: options.labels || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mockIssues.set(`${repo}:${issue.number}`, issue);

    return issue;
  }

  async getIssue(repo: string, issueNumber: number): Promise<GitHubIssue> {
    const key = `${repo}:${issueNumber}`;
    const issue = this.mockIssues.get(key);

    if (!issue) {
      throw new Error(`Issue #${issueNumber} not found in ${repo}`);
    }

    return { ...issue };
  }

  async listPullRequests(repo: string, state?: 'open' | 'closed' | 'all'): Promise<GitHubPullRequest[]> {
    // Return mock PRs
    const mockPRs: GitHubPullRequest[] = [
      {
        number: 1,
        title: 'Add authentication feature',
        state: 'open',
        headBranch: 'feature/auth',
        baseBranch: 'main',
        createdAt: new Date('2025-01-01')
      },
      {
        number: 2,
        title: 'Fix bug in login',
        state: 'closed',
        headBranch: 'bugfix/login',
        baseBranch: 'main',
        createdAt: new Date('2024-12-15')
      }
    ];

    if (state && state !== 'all') {
      return mockPRs.filter(pr => pr.state === state);
    }

    return mockPRs;
  }

  async close(): Promise<void> {
    // Cleanup
    this.mockFiles.clear();
    this.mockIssues.clear();
  }

  /**
   * Initialize mock data for testing
   */
  private initializeMockData(): void {
    // Add mock files
    this.mockFiles.set('tiangolo/fastapi:docs/tutorial/security/oauth2-jwt.md', {
      path: 'docs/tutorial/security/oauth2-jwt.md',
      content: '# OAuth2 with JWT\n\nFastAPI makes it easy to implement OAuth2 with JWT tokens.\n\n```python\nfrom fastapi import FastAPI\nfrom fastapi.security import OAuth2PasswordBearer\n```',
      sha: 'abc123',
      size: 200,
      encoding: 'utf-8'
    });

    this.mockFiles.set('facebook/react:docs/hooks.md', {
      path: 'docs/hooks.md',
      content: '# React Hooks\n\nHooks let you use state and other React features without writing a class.\n\n```javascript\nimport { useState } from \'react\';\n```',
      sha: 'def456',
      size: 150,
      encoding: 'utf-8'
    });

    this.mockFiles.set('tiangolo/fastapi:README.md', {
      path: 'README.md',
      content: '# FastAPI\n\nFastAPI is a modern, fast web framework for building APIs with Python 3.7+.\n\nKey features:\n- Fast performance\n- Easy to use\n- Automatic documentation',
      sha: 'ghi789',
      size: 180,
      encoding: 'utf-8'
    });
  }
}

// ============================================================================
// Sarah-PM Integration Helper
// ============================================================================

class SarahPMGitHubIntegration {
  private client: GitHubMCPClient;

  constructor(client: GitHubMCPClient) {
    this.client = client;
  }

  /**
   * Track feature development progress
   */
  async trackFeatureProgress(repo: string, featureName: string): Promise<{
    openPRs: number;
    closedPRs: number;
    issues: number;
    progress: number;
  }> {
    const allPRs = await this.client.listPullRequests(repo, 'all');
    const featurePRs = allPRs.filter(pr =>
      pr.title.toLowerCase().includes(featureName.toLowerCase()) ||
      pr.headBranch.toLowerCase().includes(featureName.toLowerCase())
    );

    const openPRs = featurePRs.filter(pr => pr.state === 'open').length;
    const closedPRs = featurePRs.filter(pr => pr.state === 'closed' || pr.state === 'merged').length;

    const progress = featurePRs.length > 0
      ? Math.round((closedPRs / featurePRs.length) * 100)
      : 0;

    return {
      openPRs,
      closedPRs,
      issues: 0, // Would query issues in real implementation
      progress
    };
  }

  /**
   * Create sprint milestone report
   */
  async createMilestoneReport(repo: string, sprint: string): Promise<{
    completed: number;
    inProgress: number;
    blocked: number;
  }> {
    // In real implementation, would query GitHub milestones
    return {
      completed: 5,
      inProgress: 3,
      blocked: 1
    };
  }

  /**
   * Automated issue creation from bug report
   */
  async createBugIssue(
    repo: string,
    bugReport: { title: string; description: string; severity: 'low' | 'medium' | 'high' }
  ): Promise<GitHubIssue> {
    const labels = ['bug'];
    if (bugReport.severity === 'high') {
      labels.push('priority:high', 'urgent');
    } else if (bugReport.severity === 'medium') {
      labels.push('priority:medium');
    }

    return await this.client.createIssue(repo, {
      title: `[BUG] ${bugReport.title}`,
      body: `## Description\n\n${bugReport.description}\n\n## Severity\n\n${bugReport.severity}\n\n*Automatically created by Sarah-PM*`,
      labels
    });
  }

  /**
   * Search codebase for patterns
   */
  async findCodePatterns(repo: string, pattern: string): Promise<{
    totalFiles: number;
    topMatches: GitHubSearchResult[];
  }> {
    const results = await this.client.searchCode(pattern, repo);

    return {
      totalFiles: results.length,
      topMatches: results.slice(0, 5)
    };
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('GitHub MCP Integration', () => {
  let client: MockGitHubMCPClient;

  beforeAll(() => {
    client = new MockGitHubMCPClient();
  });

  afterAll(async () => {
    await client.close();
  });

  describe('Repository File Operations', () => {
    it('should read file from repository', async () => {
      const file = await client.getFile('tiangolo/fastapi', 'README.md');

      expect(file).toBeDefined();
      expect(file.path).toBe('README.md');
      expect(file.content).toContain('FastAPI');
      expect(file.sha).toBeDefined();
      expect(file.size).toBeGreaterThan(0);
    });

    it('should read documentation file', async () => {
      const file = await client.getFile('tiangolo/fastapi', 'docs/tutorial/security/oauth2-jwt.md');

      expect(file.content).toContain('OAuth2');
      expect(file.content).toContain('JWT');
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        client.getFile('tiangolo/fastapi', 'non-existent.md')
      ).rejects.toThrow('File not found');
    });

    it('should handle different repositories', async () => {
      const fastapiFile = await client.getFile('tiangolo/fastapi', 'README.md');
      const reactFile = await client.getFile('facebook/react', 'docs/hooks.md');

      expect(fastapiFile.content).toContain('FastAPI');
      expect(reactFile.content).toContain('Hooks');
    });
  });

  describe('Code Search', () => {
    it('should search for code across repository', async () => {
      const results = await client.searchCode('OAuth2', 'tiangolo/fastapi');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].repository).toBe('tiangolo/fastapi');
      expect(results[0].matches.length).toBeGreaterThan(0);
    });

    it('should search for code without specifying repository', async () => {
      const results = await client.searchCode('FastAPI');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return matches with line numbers', async () => {
      const results = await client.searchCode('OAuth2');

      expect(results[0].matches[0].line).toBeGreaterThan(0);
      expect(results[0].matches[0].text).toBeDefined();
    });

    it('should sort results by relevance', async () => {
      const results = await client.searchCode('FastAPI');

      // Higher scores should come first
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should return empty array for non-matching search', async () => {
      const results = await client.searchCode('non-existent-pattern-xyz123');

      expect(results).toEqual([]);
    });
  });

  describe('Issue Management', () => {
    it('should create new issue', async () => {
      const issue = await client.createIssue('tiangolo/fastapi', {
        title: 'Test issue',
        body: 'This is a test issue',
        labels: ['bug', 'priority:high']
      });

      expect(issue.number).toBeGreaterThan(0);
      expect(issue.title).toBe('Test issue');
      expect(issue.state).toBe('open');
      expect(issue.labels).toContain('bug');
    });

    it('should retrieve created issue', async () => {
      const created = await client.createIssue('tiangolo/fastapi', {
        title: 'Another test issue',
        body: 'Test body'
      });

      const retrieved = await client.getIssue('tiangolo/fastapi', created.number);

      expect(retrieved.number).toBe(created.number);
      expect(retrieved.title).toBe(created.title);
    });

    it('should throw error for non-existent issue', async () => {
      await expect(
        client.getIssue('tiangolo/fastapi', 99999)
      ).rejects.toThrow('Issue #99999 not found');
    });

    it('should track issue metadata', async () => {
      const issue = await client.createIssue('tiangolo/fastapi', {
        title: 'Metadata test',
        body: 'Testing metadata'
      });

      expect(issue.createdAt).toBeInstanceOf(Date);
      expect(issue.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Pull Request Operations', () => {
    it('should list all pull requests', async () => {
      const prs = await client.listPullRequests('tiangolo/fastapi', 'all');

      expect(prs.length).toBeGreaterThan(0);
      expect(prs[0].number).toBeDefined();
      expect(prs[0].title).toBeDefined();
      expect(prs[0].state).toBeDefined();
    });

    it('should list only open pull requests', async () => {
      const openPRs = await client.listPullRequests('tiangolo/fastapi', 'open');

      expect(openPRs.every(pr => pr.state === 'open')).toBe(true);
    });

    it('should list only closed pull requests', async () => {
      const closedPRs = await client.listPullRequests('tiangolo/fastapi', 'closed');

      expect(closedPRs.every(pr => pr.state === 'closed')).toBe(true);
    });

    it('should include branch information in PRs', async () => {
      const prs = await client.listPullRequests('tiangolo/fastapi', 'all');

      expect(prs[0].headBranch).toBeDefined();
      expect(prs[0].baseBranch).toBeDefined();
    });
  });

  describe('Sarah-PM Integration', () => {
    let sarahPM: SarahPMGitHubIntegration;

    beforeAll(() => {
      sarahPM = new SarahPMGitHubIntegration(client);
    });

    it('should track feature development progress', async () => {
      const progress = await sarahPM.trackFeatureProgress('tiangolo/fastapi', 'auth');

      expect(progress.openPRs).toBeDefined();
      expect(progress.closedPRs).toBeDefined();
      expect(progress.progress).toBeGreaterThanOrEqual(0);
      expect(progress.progress).toBeLessThanOrEqual(100);
    });

    it('should create milestone report', async () => {
      const report = await sarahPM.createMilestoneReport('tiangolo/fastapi', 'Sprint 1');

      expect(report.completed).toBeDefined();
      expect(report.inProgress).toBeDefined();
      expect(report.blocked).toBeDefined();
    });

    it('should create bug issue automatically', async () => {
      const issue = await sarahPM.createBugIssue('tiangolo/fastapi', {
        title: 'Login fails with OAuth',
        description: 'Users cannot login using OAuth2 flow',
        severity: 'high'
      });

      expect(issue.title).toContain('[BUG]');
      expect(issue.labels).toContain('bug');
      expect(issue.labels).toContain('priority:high');
      expect(issue.body).toContain('Automatically created by Sarah-PM');
    });

    it('should apply severity labels correctly', async () => {
      const highIssue = await sarahPM.createBugIssue('tiangolo/fastapi', {
        title: 'Critical bug',
        description: 'System crashes',
        severity: 'high'
      });

      const mediumIssue = await sarahPM.createBugIssue('tiangolo/fastapi', {
        title: 'Medium bug',
        description: 'Minor issue',
        severity: 'medium'
      });

      expect(highIssue.labels).toContain('priority:high');
      expect(mediumIssue.labels).toContain('priority:medium');
    });

    it('should find code patterns', async () => {
      const patterns = await sarahPM.findCodePatterns('tiangolo/fastapi', 'OAuth2');

      expect(patterns.totalFiles).toBeGreaterThan(0);
      expect(patterns.topMatches.length).toBeGreaterThan(0);
      expect(patterns.topMatches.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Integration with OPERA Workflow', () => {
    it('should support Alex-BA requirements research', async () => {
      // Alex researches FastAPI OAuth2 patterns
      const file = await client.getFile('tiangolo/fastapi', 'docs/tutorial/security/oauth2-jwt.md');

      expect(file.content).toContain('OAuth2');
      expect(file.content).toContain('JWT');
    });

    it('should support Marcus-Backend code search', async () => {
      // Marcus searches for security implementation examples
      const results = await client.searchCode('OAuth2PasswordBearer');

      expect(results).toBeDefined();
    });

    it('should support Sarah-PM project tracking', async () => {
      const sarahPM = new SarahPMGitHubIntegration(client);

      // Track sprint progress
      const progress = await sarahPM.trackFeatureProgress('tiangolo/fastapi', 'authentication');

      // Create bug report
      const issue = await sarahPM.createBugIssue('tiangolo/fastapi', {
        title: 'Authentication bug',
        description: 'Token validation fails',
        severity: 'high'
      });

      expect(progress).toBeDefined();
      expect(issue.number).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Export for integration use
// ============================================================================

export {
  GitHubMCPClient,
  MockGitHubMCPClient,
  SarahPMGitHubIntegration,
  GitHubFile,
  GitHubSearchResult,
  GitHubIssue,
  GitHubPullRequest
};
