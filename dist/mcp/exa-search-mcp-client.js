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
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class ExaSearchMCPClient extends EventEmitter {
    constructor(config) {
        super();
        this.serverProcess = null;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.config = {
            timeout: 30000,
            maxResults: 10,
            ...config
        };
        // Find Exa MCP server binary
        this.serverPath = path.join(__dirname, '../../node_modules/exa-mcp-server/.smithery/stdio/index.cjs');
    }
    /**
     * Initialize Exa Search MCP server
     */
    async initialize() {
        console.log('[ExaSearchMCPClient] Initializing Exa Search MCP server...');
        if (!this.config.apiKey) {
            throw new Error('Exa API key is required');
        }
        // Start MCP server process
        try {
            this.serverProcess = spawn('node', [this.serverPath], {
                env: {
                    ...process.env,
                    EXA_API_KEY: this.config.apiKey
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });
            this.serverProcess.on('error', (error) => {
                console.error('[ExaSearchMCPClient] Server process error:', error);
                this.emit('error', error);
            });
            this.serverProcess.on('exit', (code) => {
                console.log(`[ExaSearchMCPClient] Server process exited with code ${code}`);
                this.serverProcess = null;
            });
            // Give server time to start
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.emit('initialized');
            console.log('[ExaSearchMCPClient] Initialized successfully');
        }
        catch (error) {
            console.error('[ExaSearchMCPClient] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Perform neural web search
     */
    async search(options) {
        try {
            // Use Exa API directly (more reliable than MCP server for now)
            const apiUrl = 'https://api.exa.ai/search';
            const requestBody = {
                query: options.query,
                num_results: options.numResults || this.config.maxResults,
                type: options.type || 'neural',
                use_autoprompt: options.useAutoprompt ?? true
            };
            if (options.liveCrawl) {
                requestBody.contents = {
                    text: true,
                    highlights: true
                };
            }
            if (options.includeDomains) {
                requestBody.include_domains = options.includeDomains;
            }
            if (options.excludeDomains) {
                requestBody.exclude_domains = options.excludeDomains;
            }
            if (options.startPublishedDate) {
                requestBody.start_published_date = options.startPublishedDate;
            }
            if (options.endPublishedDate) {
                requestBody.end_published_date = options.endPublishedDate;
            }
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey
                },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `Exa API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            const results = data.results?.map((r) => ({
                title: r.title,
                url: r.url,
                publishedDate: r.published_date,
                author: r.author,
                score: r.score,
                text: r.text,
                highlights: r.highlights
            })) || [];
            return {
                success: true,
                results,
                requestId: data.requestId
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
     * Search for research papers
     */
    async searchPapers(query, options) {
        return this.search({
            query: `${query} research paper OR academic paper OR study`,
            numResults: options?.numResults,
            startPublishedDate: options?.startDate,
            endPublishedDate: options?.endDate,
            includeDomains: [
                'arxiv.org',
                'scholar.google.com',
                'pubmed.ncbi.nlm.nih.gov',
                'ieee.org',
                'acm.org'
            ],
            useAutoprompt: true,
            type: 'neural'
        });
    }
    /**
     * Search LinkedIn profiles
     */
    async searchLinkedIn(query, options) {
        return this.search({
            query,
            numResults: options?.numResults,
            includeDomains: ['linkedin.com'],
            useAutoprompt: true,
            type: 'neural'
        });
    }
    /**
     * Search with live crawling (gets full page content)
     */
    async searchWithContent(query, options) {
        return this.search({
            ...options,
            query,
            liveCrawl: true
        });
    }
    /**
     * Find similar content to a URL
     */
    async findSimilar(url, numResults) {
        try {
            const apiUrl = 'https://api.exa.ai/findSimilar';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey
                },
                body: JSON.stringify({
                    url,
                    num_results: numResults || this.config.maxResults
                })
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `Exa API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            const results = data.results?.map((r) => ({
                title: r.title,
                url: r.url,
                publishedDate: r.published_date,
                author: r.author,
                score: r.score,
                text: r.text,
                highlights: r.highlights
            })) || [];
            return {
                success: true,
                results,
                requestId: data.requestId
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
     * Get content from URL
     */
    async getContents(urls) {
        try {
            const apiUrl = 'https://api.exa.ai/contents';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey
                },
                body: JSON.stringify({
                    ids: urls,
                    text: true,
                    highlights: true
                })
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: `Exa API error: ${response.status} - ${error}`
                };
            }
            const data = await response.json();
            const results = data.results?.map((r) => ({
                title: r.title,
                url: r.url,
                publishedDate: r.published_date,
                author: r.author,
                score: 1.0,
                text: r.text,
                highlights: r.highlights
            })) || [];
            return {
                success: true,
                results,
                requestId: data.requestId
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
// Export singleton instance with environment API key
let _instance = null;
export function getExaSearchMCPClient() {
    if (!_instance) {
        const apiKey = process.env.EXA_API_KEY || '';
        if (!apiKey) {
            console.warn('[ExaSearchMCPClient] No Exa API key found in environment (EXA_API_KEY)');
        }
        _instance = new ExaSearchMCPClient({ apiKey });
    }
    return _instance;
}
//# sourceMappingURL=exa-search-mcp-client.js.map