/**
 * VERSATIL Documentation Search Engine
 * Provides fast, indexed search across all framework documentation
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

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
  private documentIndex: Map<string, DocumentMetadata>;
  private indexBuilt: boolean = false;

  constructor(projectPath: string) {
    this.docsPath = path.join(projectPath, 'docs');
    this.documentIndex = new Map();
  }

  /**
   * Build search index from all documentation files
   */
  async buildIndex(): Promise<void> {
    if (this.indexBuilt) {
      return; // Already built
    }

    try {
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

      this.indexBuilt = true;
    } catch (error) {
      throw new Error(`Failed to build documentation index: ${error}`);
    }
  }

  /**
   * Search documentation with keyword matching
   */
  async search(query: string, category?: DocCategory): Promise<SearchResult[]> {
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

    // Return top 10 results
    return results.slice(0, 10);
  }

  /**
   * Get complete document content
   */
  async getDocument(relativePath: string): Promise<string> {
    if (!this.indexBuilt) {
      await this.buildIndex();
    }

    const metadata = this.documentIndex.get(relativePath);
    if (!metadata) {
      throw new Error(`Document not found: ${relativePath}`);
    }

    return await fs.readFile(metadata.filePath, 'utf-8');
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
}
