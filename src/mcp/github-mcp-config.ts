/**
 * GitHub MCP Configuration
 * Production-ready GitHub API integration configuration
 */

export interface GitHubMCPConfig {
  auth: {
    type: 'token' | 'app';
    token?: string;
    appId?: number;
    privateKey?: string;
  };
  owner?: string;
  repo?: string;
  baseUrl?: string;  // For GitHub Enterprise
  rateLimitStrategy: 'backoff' | 'fixed';
  cacheTTL: number;
  maxRetries: number;
}

export interface RepositoryAnalysis {
  metadata: {
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    openIssues: number;
  };

  codeQuality: {
    languages: { name: string; percentage: number }[];
  };

  projectHealth: {
    openIssues: number;
    openPRs: number;
  };

  recommendations: string[];
}

export const DEFAULT_GITHUB_MCP_CONFIG: GitHubMCPConfig = {
  auth: {
    type: 'token',
    token: process.env.GITHUB_TOKEN
  },
  owner: process.env.GITHUB_OWNER || 'MiraclesGIT',
  repo: process.env.GITHUB_REPO || 'versatil-sdlc-framework',
  baseUrl: process.env.GITHUB_ENTERPRISE_URL || 'https://api.github.com',
  rateLimitStrategy: 'backoff',
  cacheTTL: parseInt(process.env.GITHUB_CACHE_TTL || '3600000'),  // 1 hour
  maxRetries: 3
};
