/**
 * VERSATIL v6.1 - Exa Search MCP Client Wrapper
 *
 * Provides AI-powered web search and content extraction for VERSATIL agents.
 *
 * Features:
 * - Neural web search (semantic understanding)
 * - Auto-crawling of relevant content
 * - Research paper discovery
 * - LinkedIn profile search
 * - Real-time web content extraction
 * - Customizable result filtering
 *
 * Usage:
 * ```ts
 * const exa = new ExaSearchMCPClient({ apiKey: process.env.EXA_API_KEY });
 * const results = await exa.search('AI development best practices');
 * ```
 */
import { EventEmitter } from 'events';
export interface ExaSearchConfig {
    apiKey: string;
    timeout?: number;
    maxResults?: number;
}
export interface ExaSearchOptions {
    query: string;
    numResults?: number;
    liveCrawl?: boolean;
    includeDomains?: string[];
    excludeDomains?: string[];
    startPublishedDate?: string;
    endPublishedDate?: string;
    useAutoprompt?: boolean;
    type?: 'neural' | 'keyword';
}
export interface ExaSearchResult {
    title: string;
    url: string;
    publishedDate?: string;
    author?: string;
    score: number;
    text?: string;
    highlights?: string[];
}
export interface ExaSearchResponse {
    success: boolean;
    results?: ExaSearchResult[];
    error?: string;
    requestId?: string;
}
export declare class ExaSearchMCPClient extends EventEmitter {
    private config;
    private serverPath;
    private serverProcess;
    private requestId;
    private pendingRequests;
    constructor(config: ExaSearchConfig);
    /**
     * Initialize Exa Search MCP server
     */
    initialize(): Promise<void>;
    /**
     * Perform neural web search
     */
    search(options: ExaSearchOptions): Promise<ExaSearchResponse>;
    /**
     * Search for research papers
     */
    searchPapers(query: string, options?: {
        numResults?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<ExaSearchResponse>;
    /**
     * Search LinkedIn profiles
     */
    searchLinkedIn(query: string, options?: {
        numResults?: number;
    }): Promise<ExaSearchResponse>;
    /**
     * Search with live crawling (gets full page content)
     */
    searchWithContent(query: string, options?: Omit<ExaSearchOptions, 'liveCrawl'>): Promise<ExaSearchResponse>;
    /**
     * Find similar content to a URL
     */
    findSimilar(url: string, numResults?: number): Promise<ExaSearchResponse>;
    /**
     * Get content from URL
     */
    getContents(urls: string[]): Promise<ExaSearchResponse>;
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
}
export declare function getExaSearchMCPClient(): ExaSearchMCPClient;
