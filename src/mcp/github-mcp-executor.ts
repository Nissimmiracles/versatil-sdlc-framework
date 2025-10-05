/**
 * GitHub MCP Executor - Production Implementation
 * Real GitHub API integration using Octokit
 */

import { Octokit } from '@octokit/rest';
import type { GitHubMCPConfig, RepositoryAnalysis } from './github-mcp-config.js';
import { DEFAULT_GITHUB_MCP_CONFIG } from './github-mcp-config.js';

export interface MCPExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export class GitHubMCPExecutor {
  private octokit: Octokit;
  private config: GitHubMCPConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: Partial<GitHubMCPConfig> = {}) {
    this.config = { ...DEFAULT_GITHUB_MCP_CONFIG, ...config };

    if (!this.config.auth.token) {
      console.warn('⚠️  GitHub token not found. Set GITHUB_TOKEN in .env');
    }

    this.octokit = new Octokit({
      auth: this.config.auth.token,
      baseUrl: this.config.baseUrl
    });
  }

  /**
   * Execute GitHub MCP action
   */
  async executeGitHubMCP(action: string, params: any = {}): Promise<MCPExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`🐙 SARAH-PM: Executing GitHub MCP action: ${action}`);

      switch (action) {
        case 'repository_analysis':
          return await this.analyzeRepository(params);

        case 'create_issue':
          return await this.createIssue(params);

        case 'list_issues':
          return await this.listIssues(params);

        case 'get_workflow_status':
          return await this.getWorkflowStatus(params);

        default:
          throw new Error(`Unknown GitHub MCP action: ${action}`);
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze GitHub repository
   */
  private async analyzeRepository(params: any): Promise<MCPExecutionResult> {
    const startTime = Date.now();
    const owner = params.owner || this.config.owner;
    const repo = params.repo || this.config.repo;

    try {
      // Check cache first
      const cacheKey = `repo:${owner}:${repo}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(`📦 Using cached repository analysis for ${owner}/${repo}`);
        return {
          success: true,
          data: cached,
          executionTime: Date.now() - startTime
        };
      }

      console.log(`🔍 Analyzing repository: ${owner}/${repo}`);

      // Fetch repository metadata
      const { data: repoData } = await this.octokit.rest.repos.get({
        owner,
        repo
      });

      // Fetch languages
      const { data: languages } = await this.octokit.rest.repos.listLanguages({
        owner,
        repo
      });

      // Calculate language percentages
      const totalBytes = Object.values(languages).reduce((sum: number, bytes) => sum + (bytes as number), 0);
      const languagePercentages = Object.entries(languages).map(([name, bytes]) => ({
        name,
        percentage: Math.round(((bytes as number) / totalBytes) * 100)
      })).sort((a, b) => b.percentage - a.percentage);

      // Fetch issues and PRs
      const { data: issues } = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: 100
      });

      const openPRs = issues.filter(issue => issue.pull_request).length;
      const openIssues = issues.length - openPRs;

      const analysis: RepositoryAnalysis = {
        metadata: {
          name: repoData.name,
          description: repoData.description || 'No description',
          language: repoData.language || 'Unknown',
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          openIssues: repoData.open_issues_count
        },
        codeQuality: {
          languages: languagePercentages
        },
        projectHealth: {
          openIssues,
          openPRs
        },
        recommendations: this.generateRecommendations(repoData, openIssues, openPRs)
      };

      // Cache the result
      this.setCache(cacheKey, analysis);

      console.log(`✅ Repository analysis complete for ${owner}/${repo}`);

      return {
        success: true,
        data: analysis,
        executionTime: Date.now() - startTime
      };

    } catch (error: any) {
      if (error.status === 404) {
        return {
          success: false,
          error: `Repository ${owner}/${repo} not found or not accessible`,
          executionTime: Date.now() - startTime
        };
      }
      throw error;
    }
  }

  /**
   * Create GitHub issue
   */
  private async createIssue(params: any): Promise<MCPExecutionResult> {
    const startTime = Date.now();
    const owner = params.owner || this.config.owner;
    const repo = params.repo || this.config.repo;

    try {
      if (!this.config.auth.token) {
        throw new Error('GitHub token required to create issues');
      }

      console.log(`📝 Creating issue in ${owner}/${repo}...`);

      const { data: issue } = await this.octokit.rest.issues.create({
        owner: owner!,
        repo: repo!,
        title: params.title,
        body: params.body,
        labels: params.labels || ['automated', 'versatil-framework']
      });

      console.log(`✅ Issue created: #${issue.number}`);

      return {
        success: true,
        data: {
          number: issue.number,
          url: issue.html_url,
          title: issue.title,
          state: issue.state
        },
        executionTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create issue: ${error.message}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * List GitHub issues
   */
  private async listIssues(params: any): Promise<MCPExecutionResult> {
    const startTime = Date.now();
    const owner = params.owner || this.config.owner;
    const repo = params.repo || this.config.repo;

    try {
      console.log(`📋 Fetching issues from ${owner}/${repo}...`);

      const { data: issues } = await this.octokit.rest.issues.listForRepo({
        owner: owner!,
        repo: repo!,
        state: params.state || 'open',
        per_page: params.limit || 30
      });

      console.log(`✅ Found ${issues.length} issues`);

      return {
        success: true,
        data: {
          total: issues.length,
          issues: issues.map(issue => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            labels: issue.labels.map((label: any) => label.name),
            url: issue.html_url,
            created_at: issue.created_at
          }))
        },
        executionTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to list issues: ${error.message}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get workflow status
   */
  private async getWorkflowStatus(params: any): Promise<MCPExecutionResult> {
    const startTime = Date.now();
    const owner = params.owner || this.config.owner;
    const repo = params.repo || this.config.repo;

    try {
      console.log(`⚙️  Fetching workflow status for ${owner}/${repo}...`);

      const { data: workflows } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
        owner: owner!,
        repo: repo!,
        per_page: 10
      });

      const latestRuns = workflows.workflow_runs.slice(0, 5).map(run => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        html_url: run.html_url
      }));

      console.log(`✅ Found ${workflows.total_count} workflow runs`);

      return {
        success: true,
        data: {
          total: workflows.total_count,
          latest_runs: latestRuns
        },
        executionTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to fetch workflows: ${error.message}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate recommendations based on repository data
   */
  private generateRecommendations(repoData: any, openIssues: number, openPRs: number): string[] {
    const recommendations: string[] = [];

    if (openIssues > 50) {
      recommendations.push('High number of open issues - consider triaging and prioritizing');
    }

    if (openPRs > 10) {
      recommendations.push('Multiple open PRs - review and merge to reduce backlog');
    }

    if (!repoData.description) {
      recommendations.push('Add repository description for better discoverability');
    }

    if (repoData.stargazers_count < 10) {
      recommendations.push('Promote project to increase visibility and stars');
    }

    return recommendations.length > 0 ? recommendations : ['Repository health looks good'];
  }

  /**
   * Cache helpers
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

// Export singleton instance
export const githubMCPExecutor = new GitHubMCPExecutor();
