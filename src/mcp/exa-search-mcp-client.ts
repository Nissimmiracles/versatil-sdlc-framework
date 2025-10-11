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

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ExaSearchConfig {
  apiKey: string;  // Exa API key
  timeout?: number;  // Request timeout in ms (default: 30000)
  maxResults?: number;  // Max results per search (default: 10)
}

export interface ExaSearchOptions {
  query: string;
  numResults?: number;  // Number of results to return
  liveCrawl?: boolean;  // Enable live crawling
  includeDomains?: string[];  // Only search these domains
  excludeDomains?: string[];  // Exclude these domains
  startPublishedDate?: string;  // ISO 8601 date
  endPublishedDate?: string;  // ISO 8601 date
  useAutoprompt?: boolean;  // Let Exa optimize the query
  type?: 'neural' | 'keyword';  // Search type
}

export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score: number;  // Relevance score
  text?: string;  // Content snippet
  highlights?: string[];  // Key highlights
}

export interface ExaSearchResponse {
  success: boolean;
  results?: ExaSearchResult[];
  error?: string;
  requestId?: string;
}

export class ExaSearchMCPClient extends EventEmitter {
  private config: ExaSearchConfig;
  private serverPath: string;
  private serverProcess: ChildProcess | null = null;
  private requestId: number = 0;
  private pendingRequests: Map<number, any> = new Map();

  constructor(config: ExaSearchConfig) {
    super();
    this.config = {
      timeout: 30000,
      maxResults: 10,
      ...config
    };

    // Find Exa MCP server binary
    this.serverPath = path.join(
      __dirname,
      '../../node_modules/exa-mcp-server/.smithery/stdio/index.cjs'
    );
  }

  /**
   * Initialize Exa Search MCP server
   */
  async initialize(): Promise<void> {
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

    } catch (error: any) {
      console.error('[ExaSearchMCPClient] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Perform neural web search
   */
  async search(options: ExaSearchOptions): Promise<ExaSearchResponse> {
    try {
      // Use Exa API directly (more reliable than MCP server for now)
      const apiUrl = 'https://api.exa.ai/search';

      const requestBody: any = {
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

      const data: any = await response.json();

      const results: ExaSearchResult[] = data.results?.map((r: any) => ({
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

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search for research papers
   */
  async searchPapers(
    query: string,
    options?: { numResults?: number; startDate?: string; endDate?: string }
  ): Promise<ExaSearchResponse> {
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
  async searchLinkedIn(
    query: string,
    options?: { numResults?: number }
  ): Promise<ExaSearchResponse> {
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
  async searchWithContent(
    query: string,
    options?: Omit<ExaSearchOptions, 'liveCrawl'>
  ): Promise<ExaSearchResponse> {
    return this.search({
      ...options,
      query,
      liveCrawl: true
    });
  }

  /**
   * Find similar content to a URL
   */
  async findSimilar(url: string, numResults?: number): Promise<ExaSearchResponse> {
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

      const data: any = await response.json();

      const results: ExaSearchResult[] = data.results?.map((r: any) => ({
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

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get content from URL
   */
  async getContents(urls: string[]): Promise<ExaSearchResponse> {
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

      const data: any = await response.json();

      const results: ExaSearchResult[] = data.results?.map((r: any) => ({
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

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    this.removeAllListeners();
  }
}

// Export singleton instance with environment API key
let _instance: ExaSearchMCPClient | null = null;

export function getExaSearchMCPClient(): ExaSearchMCPClient {
  if (!_instance) {
    const apiKey = process.env.EXA_API_KEY || '';
    if (!apiKey) {
      console.warn('[ExaSearchMCPClient] No Exa API key found in environment (EXA_API_KEY)');
    }
    _instance = new ExaSearchMCPClient({ apiKey });
  }
  return _instance;
}
