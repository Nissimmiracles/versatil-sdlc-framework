/**
 * GitMCP Query Generator
 *
 * Purpose: Generate precise GitMCP queries for fetching latest documentation
 *
 * Features:
 * - Framework mention → GitHub repository mapping
 * - Smart path inference (e.g., "FastAPI OAuth" → tiangolo/fastapi/docs/tutorial/security/oauth2.md)
 * - File type detection (README.md, API docs, tutorials, examples)
 * - Query validation and fallback strategies
 *
 * Part of: Oliver-MCP Orchestrator (Gap 1.1 - Critical)
 */
import { EventEmitter } from 'events';
export interface GitMCPQuery {
    repository: string;
    path?: string;
    fileType?: 'readme' | 'docs' | 'examples' | 'api-reference' | 'tutorial';
    confidence: number;
    reasoning: string;
    alternatives?: GitMCPQuery[];
}
export interface QueryContext {
    framework: string;
    topic?: string;
    keywords: string[];
    intent?: 'learn' | 'implement' | 'troubleshoot' | 'reference';
}
export declare class GitMCPQueryGenerator extends EventEmitter {
    constructor();
    /**
     * Generate GitMCP query from context
     */
    generateQuery(context: QueryContext): Promise<GitMCPQuery>;
    /**
     * Get framework info from knowledge base
     */
    private getFrameworkInfo;
    /**
     * Infer documentation path from context
     */
    private inferDocumentationPath;
    /**
     * Infer path from keywords
     */
    private inferPathFromKeywords;
    /**
     * Infer path from intent
     */
    private inferPathFromIntent;
    /**
     * Infer file type from context
     */
    private inferFileType;
    /**
     * Calculate confidence in query accuracy
     */
    private calculateConfidence;
    /**
     * Generate reasoning for query
     */
    private generateReasoning;
    /**
     * Generate alternative queries
     */
    private generateAlternatives;
    /**
     * Generate fallback query for unknown frameworks
     */
    private generateFallbackQuery;
    /**
     * Guess repository name from framework name
     */
    private guessRepository;
    /**
     * Get framework key for pattern lookup
     */
    private getFrameworkKey;
    /**
     * Format query as GitMCP URL
     */
    formatAsURL(query: GitMCPQuery): string;
    /**
     * Parse GitMCP URL into query
     */
    parseURL(url: string): GitMCPQuery | null;
}
export declare const gitMCPQueryGenerator: GitMCPQueryGenerator;
