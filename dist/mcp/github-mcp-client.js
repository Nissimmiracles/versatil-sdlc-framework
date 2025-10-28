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
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class GitHubMCPClient extends EventEmitter {
    constructor(config) {
        super();
        this.serverProcess = null;
        this.config = {
            timeout: 30000,
            ...config
        };
        // Find GitHub MCP server binary
        this.serverPath = path.join(__dirname, '../../node_modules/@modelcontextprotocol/server-github/dist/index.js');
    }
    /**
     * Initialize GitHub MCP server
     */
    async initialize() {
        console.log('[GitHubMCPClient] Initializing GitHub MCP server...');
        // Note: GitHub MCP server is a CLI tool, not a Node.js module
        // For now, we'll create a direct GitHub API client wrapper
        // Validate token
        if (!this.config.token) {
            throw new Error('GitHub token is required');
        }
        this.emit('initialized');
        console.log('[GitHubMCPClient] Initialized successfully');
    }
    /**
     * Create a new issue
     */
    async createIssue(owner, repo, issue) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(issue)
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `GitHub API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            return {
                success: true,
                data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * List issues in repository
     */
    async listIssues(owner, repo, options) {
        try {
            const params = new URLSearchParams();
            if (options?.state)
                params.append('state', options.state);
            if (options?.labels)
                params.append('labels', options.labels.join(','));
            if (options?.per_page)
                params.append('per_page', options.per_page.toString());
            const url = `https://api.github.com/repos/${owner}/${repo}/issues?${params}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `GitHub API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            return {
                success: true,
                data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Create a pull request
     */
    async createPullRequest(owner, repo, pr) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pr)
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `GitHub API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            return {
                success: true,
                data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get file contents from repository
     */
    async getFile(owner, repo, path, ref) {
        try {
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `GitHub API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            // Decode base64 content
            if (data.content) {
                data.decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
            }
            return {
                success: true,
                data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Create or update a file in repository
     */
    async createOrUpdateFile(owner, repo, file) {
        try {
            const encodedContent = Buffer.from(file.content).toString('base64');
            const body = {
                message: file.message,
                content: encodedContent
            };
            if (file.sha) {
                body.sha = file.sha; // Required for updates
            }
            if (file.branch) {
                body.branch = file.branch;
            }
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `GitHub API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            return {
                success: true,
                data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Search code in repositories
     */
    async searchCode(query, options) {
        try {
            const params = new URLSearchParams({ q: query });
            if (options?.per_page)
                params.append('per_page', options.per_page.toString());
            if (options?.sort)
                params.append('sort', options.sort);
            if (options?.order)
                params.append('order', options.order);
            const url = `https://api.github.com/search/code?${params}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `GitHub API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            return {
                success: true,
                data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get repository metadata
     */
    async getRepository(owner, repo) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `GitHub API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            return {
                success: true,
                data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * List branches in repository
     */
    async listBranches(owner, repo) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `GitHub API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            return {
                success: true,
                data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Cleanup
     */
    async destroy() {
        if (this.serverProcess) {
            this.serverProcess.kill();
            this.serverProcess = null;
        }
        this.removeAllListeners();
    }
}
// Export singleton instance with environment token
let _instance = null;
export function getGitHubMCPClient() {
    if (!_instance) {
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
        if (!token) {
            console.warn('[GitHubMCPClient] No GitHub token found in environment (GITHUB_TOKEN or GH_TOKEN)');
        }
        _instance = new GitHubMCPClient({ token });
    }
    return _instance;
}
//# sourceMappingURL=github-mcp-client.js.map