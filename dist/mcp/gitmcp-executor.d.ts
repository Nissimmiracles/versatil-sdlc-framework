/**
 * VERSATIL v6.4.1 - GitMCP Executor
 *
 * Purpose: Execute GitMCP queries for GitHub repository documentation access
 *
 * GitMCP provides zero-hallucination access to GitHub repository documentation
 * by fetching real, up-to-date docs directly from gitmcp.io
 *
 * Benefits:
 * - Zero hallucinations (real code from actual repos)
 * - Always up-to-date (latest docs, not LLM training data)
 * - Framework-specific (FastAPI, React, Next.js, etc.)
 * - No API keys required (public repos)
 *
 * Usage:
 * ```typescript
 * const executor = new GitMCPExecutor();
 * await executor.initialize();
 *
 * // Query framework documentation
 * const result = await executor.queryRepository({
 *   owner: 'tiangolo',
 *   repo: 'fastapi',
 *   path: 'docs/tutorial/security/oauth2.md'
 * });
 *
 * // Search for code examples
 * const examples = await executor.searchFrameworkDocs('React', 'Server Components');
 * ```
 */
import { EventEmitter } from 'events';
export interface GitMCPRepository {
    owner: string;
    repo: string;
    path?: string;
    ref?: string;
}
export interface GitMCPResult {
    success: boolean;
    data?: {
        content: string;
        path: string;
        url: string;
        repository: string;
        lastModified?: string;
    };
    error?: string;
    executionTime: number;
}
export interface CodeExample {
    title: string;
    code: string;
    language: string;
    source: string;
    relevance: number;
}
export interface FrameworkDocsResult {
    framework: string;
    topic: string;
    examples: CodeExample[];
    documentation: string;
    url: string;
}
export declare class GitMCPExecutor extends EventEmitter {
    private baseUrl;
    private initialized;
    private cache;
    private readonly CACHE_TTL;
    constructor();
    /**
     * Initialize GitMCP executor
     */
    initialize(): Promise<void>;
    /**
     * Query GitHub repository documentation via GitMCP
     */
    queryRepository(repo: GitMCPRepository): Promise<GitMCPResult>;
    /**
     * Search framework documentation for specific topic
     */
    searchFrameworkDocs(framework: string, topic: string): Promise<FrameworkDocsResult>;
    /**
     * Get repository README
     */
    getReadme(owner: string, repo: string): Promise<GitMCPResult>;
    /**
     * Get specific file from repository
     */
    getFile(owner: string, repo: string, path: string): Promise<GitMCPResult>;
    private getCacheKey;
    private getFromCache;
    private getFrameworkRepository;
    private extractCodeExamples;
    private getMockDocumentation;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
}
export declare function getGitMCPExecutor(): GitMCPExecutor;
