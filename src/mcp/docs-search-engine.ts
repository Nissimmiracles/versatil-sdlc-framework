/**
 * VERSATIL Documentation Search Engine
 * Provides fast, indexed search across all framework documentation
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { DocsSearchError, DocsErrorCodes } from './docs-errors.js';
import { DocsCache, CacheOptions } from './docs-cache.js';
import { DocsPerformanceMonitor } from './docs-performance-monitor.js';

// Configuration constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default limit
const INDEX_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

export interface DocumentMetadata {
  filePath: string;
  relativePath: string;
  title: string;
  category: DocCategory;
  size: number;
  lastModified: Date;
  keywords: string[];
}

export interface SearchResult {
  document: DocumentMetadata;
  excerpt: string;
  relevanceScore: number;
  matchCount: number;
}

export interface AgentDoc {
  agentId: string;
  name: string;
  role: string;
  capabilities: string[];
  triggers: string[];
  filePatterns: string[];
  examples: string[];
  integration: string[];
}

export interface WorkflowDoc {
  workflowType: string;
  name: string;
  description: string;
  phases: WorkflowPhase[];
  timeSavings: string;
  examples: string[];
}

export interface WorkflowPhase {
  name: string;
  duration: string;
  agents: string[];
  activities: string[];
}

export type DocCategory =
  | 'agents'
  | 'workflows'
  | 'rules'
  | 'mcp'
  | 'guides'
  | 'troubleshooting'
  | 'quick-reference'
  | 'architecture'
  | 'testing'
  | 'security'
  | 'completion'
  | 'all';

export class DocsSearchEngine {
  private docsPath: string;
  private projectPath: string;
  private documentIndex: Map<string, DocumentMetadata>;
  private indexBuilt: boolean = false;
  private lastIndexBuild: Date | null = null;
  private indexBuildPromise: Promise<void> | null = null;
  private maxFileSize: number;
  private indexTTL: number;
  private cache: DocsCache;
  private performanceMonitor: DocsPerformanceMonitor;

  constructor(
    projectPath: string,
    options: {
      maxFileSize?: number;
      indexTTL?: number;
      cacheOptions?: CacheOptions;
      enablePerformanceMonitoring?: boolean;
    } = {}
  ) {
    this.projectPath = projectPath;
    this.docsPath = path.join(projectPath, 'docs');
    this.documentIndex = new Map();
    this.maxFileSize = options.maxFileSize || MAX_FILE_SIZE;
    this.indexTTL = options.indexTTL || INDEX_TTL_MS;
    this.cache = new DocsCache(options.cacheOptions);
    this.performanceMonitor = new DocsPerformanceMonitor();
  }

  /**
   * Build search index from all documentation files
   * @param force - Force rebuild even if index is fresh
   */
  async buildIndex(force: boolean = false): Promise<void> {
    // Return existing build promise if build is in progress
    if (this.indexBuildPromise) {
      console.log('Index build already in progress, waiting...');
      return this.indexBuildPromise;
    }

    // Check if rebuild is needed
    const now = new Date();
    if (
      this.indexBuilt &&
      !force &&
      this.lastIndexBuild &&
      (now.getTime() - this.lastIndexBuild.getTime()) < this.indexTTL
    ) {
      return; // Index is still fresh
    }

    // Create build promise to prevent concurrent builds
    this.indexBuildPromise = (async () => {
      try {
        console.log(`Building documentation index... (force: ${force})`);
        const startTime = Date.now();

        // Clear existing index if rebuilding
        this.documentIndex.clear();

        // Find all markdown files in docs directory
        const pattern = path.join(this.docsPath, '**/*.md');
        const files = await glob(pattern, { absolute: true });

        for (const filePath of files) {
          try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf-8');

            const relativePath = path.relative(this.docsPath, filePath);
            const title = this.extractTitle(content, relativePath);
            const category = this.determineCategory(relativePath);
            const keywords = this.extractKeywords(content, title);

            const metadata: DocumentMetadata = {
              filePath,
              relativePath,
              title,
              category,
              size: stats.size,
              lastModified: stats.mtime,
              keywords,
            };

            this.documentIndex.set(relativePath, metadata);
          } catch (error) {
            // Skip files that can't be read
            console.error(`Error indexing ${filePath}:`, error);
          }
        }

        const duration = Date.now() - startTime;
        console.log(`Documentation index built: ${files.length} files in ${duration}ms`);

        // Track performance
        this.performanceMonitor.trackIndexBuild(duration, files.length);

        this.indexBuilt = true;
        this.lastIndexBuild = now;
      } catch (error) {
        throw new DocsSearchError(
          `Failed to build documentation index: ${error}`,
          DocsErrorCodes.INDEX_BUILD_FAILED,
          { error }
        );
      } finally {
        this.indexBuildPromise = null;
      }
    })();

    return this.indexBuildPromise;
  }

  /**
   * Force rebuild of documentation index
   */
  async rebuildIndex(): Promise<void> {
    return this.buildIndex(true);
  }

  /**
   * Check if index is stale (older than TTL)
   */
  isIndexStale(): boolean {
    if (!this.lastIndexBuild) return true;

    const now = new Date();
    return (now.getTime() - this.lastIndexBuild.getTime()) >= this.indexTTL;
  }

  /**
   * Get index metadata
   */
  getIndexMetadata(): {
    built: boolean;
    lastBuild: Date | null;
    isStale: boolean;
    documentsCount: number;
    ttlMs: number;
  } {
    return {
      built: this.indexBuilt,
      lastBuild: this.lastIndexBuild,
      isStale: this.isIndexStale(),
      documentsCount: this.documentIndex.size,
      ttlMs: this.indexTTL,
    };
  }

  /**
   * Search documentation with keyword matching (with performance tracking)
   */
  async search(query: string, category?: DocCategory): Promise<SearchResult[]> {
    const startTime = Date.now();

    if (!this.indexBuilt) {
      await this.buildIndex();
    }

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2);

    for (const [relativePath, metadata] of this.documentIndex.entries()) {
      // Filter by category if specified
      if (category && category !== 'all' && metadata.category !== category) {
        continue;
      }

      // Calculate relevance score
      let relevanceScore = 0;
      let matchCount = 0;

      // Title matches (highest weight)
      for (const term of queryTerms) {
        if (metadata.title.toLowerCase().includes(term)) {
          relevanceScore += 10;
          matchCount++;
        }
      }

      // Keyword matches (medium weight)
      for (const term of queryTerms) {
        for (const keyword of metadata.keywords) {
          if (keyword.includes(term)) {
            relevanceScore += 5;
            matchCount++;
          }
        }
      }

      // File path matches (lower weight)
      for (const term of queryTerms) {
        if (metadata.relativePath.toLowerCase().includes(term)) {
          relevanceScore += 2;
          matchCount++;
        }
      }

      // If no matches, skip this document
      if (matchCount === 0) {
        continue;
      }

      // Read content and extract excerpt
      const content = await fs.readFile(metadata.filePath, 'utf-8');
      const excerpt = this.extractExcerpt(content, queryTerms, 3);

      results.push({
        document: metadata,
        excerpt,
        relevanceScore,
        matchCount,
      });
    }

    // Sort by relevance score (highest first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Track performance (cache hit = false for search queries)
    const duration = Date.now() - startTime;
    this.performanceMonitor.trackQuery(query, duration, false, results.length);

    // Return top 10 results
    return results.slice(0, 10);
  }

  /**
   * Get complete document content with security validation and caching
   */
  async getDocument(relativePath: string, options?: { bypassCache?: boolean }): Promise<string> {
    const startTime = Date.now();

    if (!this.indexBuilt) {
      await this.buildIndex();
    }

    // 1. Normalize path to prevent directory traversal
    const normalizedPath = path.normalize(relativePath);

    // 2. Check cache first (unless bypassed)
    let cacheHit = false;
    if (!options?.bypassCache) {
      const cached = this.cache.get(normalizedPath);
      if (cached) {
        cacheHit = true;
        const duration = Date.now() - startTime;
        this.performanceMonitor.trackQuery(normalizedPath, duration, true);
        return cached as string;
      }
    }

    // 3. Block path traversal patterns
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
      throw new DocsSearchError(
        'Path traversal not allowed',
        DocsErrorCodes.PATH_TRAVERSAL_BLOCKED,
        { path: relativePath, normalizedPath }
      );
    }

    // 4. Get metadata from index
    const metadata = this.documentIndex.get(normalizedPath);
    if (!metadata) {
      throw new DocsSearchError(
        `Document not found: ${normalizedPath}`,
        DocsErrorCodes.DOCUMENT_NOT_FOUND,
        { path: normalizedPath }
      );
    }

    // 5. Validate file path is within docs directory
    const resolvedPath = path.resolve(metadata.filePath);
    const allowedDocsPath = path.resolve(this.docsPath);

    if (!resolvedPath.startsWith(allowedDocsPath)) {
      throw new DocsSearchError(
        'Security violation: Path outside docs directory',
        DocsErrorCodes.PATH_OUTSIDE_DOCS,
        { path: resolvedPath, allowedPath: allowedDocsPath }
      );
    }

    // 6. Check file size before reading
    if (metadata.size > this.maxFileSize) {
      throw new DocsSearchError(
        `Document too large: ${Math.round(metadata.size / 1024 / 1024)}MB (max ${Math.round(this.maxFileSize / 1024 / 1024)}MB)`,
        DocsErrorCodes.FILE_TOO_LARGE,
        { size: metadata.size, limit: this.maxFileSize }
      );
    }

    // 7. Verify file is readable
    try {
      await fs.access(resolvedPath, fs.constants.R_OK);
    } catch (error) {
      throw new DocsSearchError(
        `Cannot read file: ${normalizedPath}`,
        DocsErrorCodes.FILE_NOT_READABLE,
        { path: normalizedPath, error }
      );
    }

    // 8. Read file content
    const content = await fs.readFile(resolvedPath, 'utf-8');

    // 9. Store in cache
    this.cache.set(normalizedPath, content);

    // 10. Track performance (cache miss)
    const duration = Date.now() - startTime;
    this.performanceMonitor.trackQuery(normalizedPath, duration, false);

    return content;
  }

  /**
   * Get all documents in a category
   */
  async getDocumentsByCategory(category: DocCategory): Promise<DocumentMetadata[]> {
    if (!this.indexBuilt) {
      await this.buildIndex();
    }

    const results: DocumentMetadata[] = [];
    for (const metadata of this.documentIndex.values()) {
      if (category === 'all' || metadata.category === category) {
        results.push(metadata);
      }
    }

    return results.sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Get documentation index (all documents)
   */
  async getIndex(): Promise<DocumentMetadata[]> {
    if (!this.indexBuilt) {
      await this.buildIndex();
    }

    return Array.from(this.documentIndex.values()).sort((a, b) =>
      a.relativePath.localeCompare(b.relativePath)
    );
  }

  /**
   * Extract title from markdown content
   */
  private extractTitle(content: string, fallbackFromPath: string): string {
    // Try to find H1 heading (# Title)
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Fallback to filename without extension
    return path.basename(fallbackFromPath, '.md').replace(/-/g, ' ');
  }

  /**
   * Determine document category from path
   */
  private determineCategory(relativePath: string): DocCategory {
    const pathLower = relativePath.toLowerCase();

    if (pathLower.includes('agents') || pathLower.includes('maria') ||
        pathLower.includes('marcus') || pathLower.includes('james') ||
        pathLower.includes('dana') || pathLower.includes('alex') ||
        pathLower.includes('sarah') || pathLower.includes('oliver')) {
      return 'agents';
    }

    if (pathLower.includes('workflow') || pathLower.includes('every') ||
        pathLower.includes('three-tier') || pathLower.includes('instinctive')) {
      return 'workflows';
    }

    if (pathLower.includes('rule')) {
      return 'rules';
    }

    if (pathLower.includes('mcp')) {
      return 'mcp';
    }

    if (pathLower.includes('guides/')) {
      return 'guides';
    }

    if (pathLower.includes('troubleshooting') || pathLower.includes('agent-troubleshooting')) {
      return 'troubleshooting';
    }

    if (pathLower.includes('quick-reference') || pathLower.includes('cheat')) {
      return 'quick-reference';
    }

    if (pathLower.includes('architecture')) {
      return 'architecture';
    }

    if (pathLower.includes('testing')) {
      return 'testing';
    }

    if (pathLower.includes('security')) {
      return 'security';
    }

    if (pathLower.includes('completion') || pathLower.includes('phase')) {
      return 'completion';
    }

    return 'guides'; // Default category
  }

  /**
   * Extract keywords from document
   */
  private extractKeywords(content: string, title: string): string[] {
    const keywords = new Set<string>();

    // Add title words as keywords
    const titleWords = title.toLowerCase().split(/\s+/);
    titleWords.forEach(word => {
      if (word.length > 3) {
        keywords.add(word);
      }
    });

    // Extract words from headings (## Heading)
    const headingMatches = content.matchAll(/^#{1,6}\s+(.+)$/gm);
    for (const match of headingMatches) {
      const headingWords = match[1].toLowerCase().split(/\s+/);
      headingWords.forEach(word => {
        const cleaned = word.replace(/[^a-z0-9-]/g, '');
        if (cleaned.length > 3) {
          keywords.add(cleaned);
        }
      });
    }

    // Extract common technical terms
    const technicalTerms = [
      'agent', 'workflow', 'mcp', 'rule', 'quality', 'test', 'coverage',
      'security', 'performance', 'accessibility', 'parallel', 'orchestration',
      'maria', 'marcus', 'james', 'dana', 'alex', 'sarah', 'oliver', 'dr-ai',
      'react', 'vue', 'nextjs', 'angular', 'svelte', 'node', 'python', 'rails',
      'every', 'three-tier', 'instinctive', 'compounding', 'plan-mode',
      'playwright', 'github', 'gitmcp', 'supabase', 'semgrep', 'sentry'
    ];

    const contentLower = content.toLowerCase();
    technicalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        keywords.add(term);
      }
    });

    return Array.from(keywords);
  }

  /**
   * Extract relevant excerpt around query terms
   */
  extractExcerpt(content: string, queryTerms: string[], contextLines: number = 3): string {
    const lines = content.split('\n');
    const matchedLines: { lineNum: number; line: string; score: number }[] = [];

    // Find lines containing query terms
    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        if (lineLower.includes(term)) {
          score += 10;
        }
      }

      if (score > 0) {
        matchedLines.push({ lineNum: index, line, score });
      }
    });

    if (matchedLines.length === 0) {
      // No matches in content, return first few lines
      return lines.slice(0, 5).join('\n') + '\n...';
    }

    // Sort by score and get best match
    matchedLines.sort((a, b) => b.score - a.score);
    const bestMatch = matchedLines[0];

    // Extract context around best match
    const startLine = Math.max(0, bestMatch.lineNum - contextLines);
    const endLine = Math.min(lines.length, bestMatch.lineNum + contextLines + 1);

    let excerpt = lines.slice(startLine, endLine).join('\n');

    // Add ellipsis if truncated
    if (startLine > 0) {
      excerpt = '...\n' + excerpt;
    }
    if (endLine < lines.length) {
      excerpt = excerpt + '\n...';
    }

    return excerpt;
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics() {
    return this.cache.getMetrics();
  }

  /**
   * Get ETag for document (for HTTP 304 support)
   */
  getDocumentETag(relativePath: string): string | null {
    const normalizedPath = path.normalize(relativePath);
    const entry = this.cache.getEntry(normalizedPath);
    return entry ? entry.etag : null;
  }

  /**
   * Check if cached document is still valid
   */
  isCacheValid(relativePath: string, ifNoneMatch?: string): boolean {
    const normalizedPath = path.normalize(relativePath);
    return this.cache.isCacheValid(normalizedPath, ifNoneMatch);
  }

  /**
   * Clear document cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get compression ratio
   */
  getCompressionRatio() {
    return this.cache.getCompressionRatio();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Export performance metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    return this.performanceMonitor.exportPrometheus();
  }

  /**
   * Get recent queries for monitoring
   */
  getRecentQueries(limit?: number) {
    return this.performanceMonitor.getRecentQueries(limit);
  }

  /**
   * Get slowest queries for optimization
   */
  getSlowestQueries(limit?: number) {
    return this.performanceMonitor.getSlowestQueries(limit);
  }
}
