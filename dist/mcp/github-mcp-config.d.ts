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
    baseUrl?: string;
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
        languages: {
            name: string;
            percentage: number;
        }[];
    };
    projectHealth: {
        openIssues: number;
        openPRs: number;
    };
    recommendations: string[];
}
export declare const DEFAULT_GITHUB_MCP_CONFIG: GitHubMCPConfig;
