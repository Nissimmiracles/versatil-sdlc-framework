/**
 * VERSATIL v6.1 - GitHub MCP Client Wrapper
 *
 * Provides easy access to GitHub MCP server functionality for VERSATIL agents.
 *
 * Features:
 * - Repository access (files, commits, branches)
 * - Issue management (create, list, update)
 * - Pull request operations (create, merge, review)
 * - Code search and navigation
 * - Workflow automation
 *
 * Usage:
 * ```ts
 * const github = new GitHubMCPClient({ token: process.env.GITHUB_TOKEN });
 * await github.createIssue(owner, repo, { title, body });
 * ```
 */
import { EventEmitter } from 'events';
export interface GitHubMCPConfig {
    token: string;
    timeout?: number;
}
export interface GitHubRepository {
    owner: string;
    repo: string;
}
export interface GitHubIssue {
    title: string;
    body: string;
    labels?: string[];
    assignees?: string[];
}
export interface GitHubPullRequest {
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
}
export interface GitHubFile {
    path: string;
    content: string;
    sha?: string;
    message: string;
    branch?: string;
}
export interface MCPResponse {
    success: boolean;
    data?: any;
    error?: string;
}
export declare class GitHubMCPClient extends EventEmitter {
    private config;
    private serverPath;
    private serverProcess;
    constructor(config: GitHubMCPConfig);
    /**
     * Initialize GitHub MCP server
     */
    initialize(): Promise<void>;
    /**
     * Create a new issue
     */
    createIssue(owner: string, repo: string, issue: GitHubIssue): Promise<MCPResponse>;
    /**
     * List issues in repository
     */
    listIssues(owner: string, repo: string, options?: {
        state?: 'open' | 'closed' | 'all';
        labels?: string[];
        per_page?: number;
    }): Promise<MCPResponse>;
    /**
     * Create a pull request
     */
    createPullRequest(owner: string, repo: string, pr: GitHubPullRequest): Promise<MCPResponse>;
    /**
     * Get file contents from repository
     */
    getFile(owner: string, repo: string, path: string, ref?: string): Promise<MCPResponse>;
    /**
     * Create or update a file in repository
     */
    createOrUpdateFile(owner: string, repo: string, file: GitHubFile): Promise<MCPResponse>;
    /**
     * Search code in repositories
     */
    searchCode(query: string, options?: {
        per_page?: number;
        sort?: 'indexed';
        order?: 'asc' | 'desc';
    }): Promise<MCPResponse>;
    /**
     * Get repository metadata
     */
    getRepository(owner: string, repo: string): Promise<MCPResponse>;
    /**
     * List branches in repository
     */
    listBranches(owner: string, repo: string): Promise<MCPResponse>;
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
}
export declare function getGitHubMCPClient(): GitHubMCPClient;
