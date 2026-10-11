/**
 * Examples Search Service
 *
 * Searches .versatil/examples/ directory for relevant code patterns
 * based on technology, keywords, and domain matching.
 *
 * Used by /plan command with --with-examples or --full-context flags
 * to enhance agent prompts with concrete code examples (+50% code quality).
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, basename } from 'path';

export interface ExampleFile {
  file_path: string;
  relative_path: string;
  description: string;
  technology: string[];
  domain: string; // 'agents', 'testing', 'rag', 'hooks', 'commands', 'validation'
  keywords: string[];
  content?: string; // Optional: full file content
}

export interface ExampleSearchQuery {
  technologies?: string[]; // 'backend', 'frontend', 'database', 'testing', 'typescript', 'react'
  keywords?: string[]; // 'authentication', 'JWT', 'validation', 'async'
  domain?: string; // 'agents', 'testing', 'rag'
  includeContent?: boolean; // Include full file content in results
}

export interface ExampleSearchResult {
  backend: ExampleFile[];
  frontend: ExampleFile[];
  database: ExampleFile[];
  testing: ExampleFile[];
  rag: ExampleFile[];
  hooks: ExampleFile[];
  commands: ExampleFile[];
  validation: ExampleFile[];
}

export class ExamplesSearchService {
  private examplesDir: string;
  private cache: Map<string, ExampleFile[]> = new Map();

  constructor(examplesDir = '.versatil/examples') {
    this.examplesDir = examplesDir;
  }

  /**
   * Search examples library for relevant patterns
   */
  async search(query: ExampleSearchQuery): Promise<ExampleSearchResult> {
    const allExamples = await this.getAllExamples();

    // Filter by query
    const filtered = allExamples.filter(example => {
      // Technology match
      if (query.technologies && query.technologies.length > 0) {
        const hasMatchingTech = query.technologies.some(tech =>
          example.technology.some(exTech =>
            exTech.toLowerCase().includes(tech.toLowerCase()) ||
            tech.toLowerCase().includes(exTech.toLowerCase())
          )
        );
        if (!hasMatchingTech) return false;
      }

      // Keyword match
      if (query.keywords && query.keywords.length > 0) {
        const hasMatchingKeyword = query.keywords.some(keyword =>
          example.keywords.some(exKeyword =>
            exKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(exKeyword.toLowerCase())
          ) ||
          example.description.toLowerCase().includes(keyword.toLowerCase()) ||
          example.file_path.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasMatchingKeyword) return false;
      }

      // Domain match
      if (query.domain && example.domain !== query.domain) {
        return false;
      }

      return true;
    });

    // Optionally include content
    if (query.includeContent) {
      await Promise.all(
        filtered.map(async example => {
          try {
            example.content = await readFile(example.file_path, 'utf-8');
          } catch {
            // Skip if file can't be read
          }
        })
      );
    }

    // Group by technology
    return {
      backend: filtered.filter(ex =>
        ex.technology.some(t => ['backend', 'api', 'server', 'node'].includes(t.toLowerCase()))
      ),
      frontend: filtered.filter(ex =>
        ex.technology.some(t => ['frontend', 'react', 'ui', 'component'].includes(t.toLowerCase()))
      ),
      database: filtered.filter(ex =>
        ex.technology.some(t => ['database', 'sql', 'postgres', 'schema'].includes(t.toLowerCase()))
      ),
      testing: filtered.filter(ex =>
        ex.technology.some(t => ['testing', 'vitest', 'jest', 'test'].includes(t.toLowerCase())) ||
        ex.domain === 'testing'
      ),
      rag: filtered.filter(ex => ex.domain === 'rag'),
      hooks: filtered.filter(ex => ex.domain === 'hooks'),
      commands: filtered.filter(ex => ex.domain === 'commands'),
      validation: filtered.filter(ex => ex.domain === 'validation')
    };
  }

  /**
   * Get all examples from .versatil/examples/ directory
   */
  private async getAllExamples(): Promise<ExampleFile[]> {
    const cacheKey = 'all';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const examples: ExampleFile[] = [];

    try {
      // Scan all subdirectories
      const domains = await readdir(this.examplesDir);

      for (const domain of domains) {
        if (domain === 'README.md' || domain.startsWith('.')) continue;

        const domainPath = join(this.examplesDir, domain);
        const domainStat = await stat(domainPath);

        if (!domainStat.isDirectory()) continue;

        // Scan files in domain directory
        const files = await this.scanDirectory(domainPath, domain);
        examples.push(...files);
      }

      // Cache results
      this.cache.set(cacheKey, examples);

      return examples;
    } catch {
      console.warn(`Examples directory not found: ${this.examplesDir}`);
      return [];
    }
  }

  /**
   * Recursively scan directory for example files
   */
  private async scanDirectory(dirPath: string, domain: string): Promise<ExampleFile[]> {
    const examples: ExampleFile[] = [];

    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        if (entry.startsWith('.')) continue;

        const fullPath = join(dirPath, entry);
        const entryStat = await stat(fullPath);

        if (entryStat.isDirectory()) {
          // Recursively scan subdirectories
          const subExamples = await this.scanDirectory(fullPath, domain);
          examples.push(...subExamples);
        } else if (entry.endsWith('.ts') || entry.endsWith('.tsx') || entry.endsWith('.js')) {
          // Parse example file
          const example = await this.parseExampleFile(fullPath, domain);
          examples.push(example);
        }
      }
    } catch {
      // Skip directories that can't be read
    }

    return examples;
  }

  /**
   * Parse example file metadata from comments and filename
   */
  private async parseExampleFile(filePath: string, domain: string): Promise<ExampleFile> {
    const relativePath = relative(this.examplesDir, filePath);
    const fileName = basename(filePath);

    // Default metadata
    let description = fileName.replace(/\.(ts|tsx|js)$/, '').replace(/-/g, ' ');
    const technology: string[] = [domain];
    const keywords: string[] = [];

    try {
      // Read first 50 lines to extract metadata from comments
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n').slice(0, 50);

      // Look for JSDoc-style metadata
      for (const line of lines) {
        // @description tag
        if (line.includes('@description')) {
          description = line.split('@description')[1].trim();
        }

        // @technology tag
        if (line.includes('@technology')) {
          const techs = line.split('@technology')[1].trim().split(',');
          technology.push(...techs.map(t => t.trim()));
        }

        // @keywords tag
        if (line.includes('@keywords')) {
          const kws = line.split('@keywords')[1].trim().split(',');
          keywords.push(...kws.map(k => k.trim()));
        }
      }

      // Infer technology from file extension
      if (filePath.endsWith('.tsx')) {
        technology.push('react', 'typescript', 'frontend');
      } else if (filePath.endsWith('.ts')) {
        technology.push('typescript');
      }

      // Infer keywords from filename
      const fileKeywords = fileName
        .replace(/\.(ts|tsx|js)$/, '')
        .split('-')
        .filter(k => k.length > 2);
      keywords.push(...fileKeywords);
    } catch {
      // Use defaults if file can't be read
    }

    return {
      file_path: filePath,
      relative_path: relativePath,
      description,
      technology: [...new Set(technology)], // Remove duplicates
      domain,
      keywords: [...new Set(keywords)] // Remove duplicates
    };
  }

  /**
   * Clear cache (useful after examples are added/modified)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Detect technologies from feature description
   */
  static detectTechnologies(featureDescription: string): string[] {
    const technologies: string[] = [];
    const lower = featureDescription.toLowerCase();

    // Backend technologies
    if (lower.match(/\b(api|endpoint|backend|server|middleware|jwt|authentication)\b/)) {
      technologies.push('backend');
    }

    // Frontend technologies
    if (lower.match(/\b(ui|component|react|frontend|page|dashboard|form)\b/)) {
      technologies.push('frontend');
    }

    // Database technologies
    if (lower.match(/\b(database|schema|migration|query|postgres|sql|table)\b/)) {
      technologies.push('database');
    }

    // Testing
    if (lower.match(/\b(test|testing|coverage|vitest|jest|e2e)\b/)) {
      technologies.push('testing');
    }

    // TypeScript
    if (lower.match(/\b(typescript|type|interface)\b/)) {
      technologies.push('typescript');
    }

    return technologies.length > 0 ? technologies : ['backend']; // Default to backend
  }

  /**
   * Extract keywords from feature description
   */
  static extractKeywords(featureDescription: string): string[] {
    const keywords: string[] = [];
    const lower = featureDescription.toLowerCase();

    // Common patterns
    const patterns = [
      'authentication',
      'authorization',
      'jwt',
      'validation',
      'async',
      'api',
      'rest',
      'graphql',
      'crud',
      'login',
      'signup',
      'dashboard',
      'form',
      'table',
      'chart'
    ];

    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        keywords.push(pattern);
      }
    }

    return keywords;
  }
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Search for backend authentication examples:
 * ```typescript
 * const service = new ExamplesSearchService();
 * const results = await service.search({
 *   technologies: ['backend'],
 *   keywords: ['authentication', 'JWT']
 * });
 * console.log(results.backend); // Array of matching examples
 * ```
 *
 * 2. Auto-detect and search from feature description:
 * ```typescript
 * const featureDescription = "Add user authentication with JWT tokens";
 * const technologies = ExamplesSearchService.detectTechnologies(featureDescription);
 * const keywords = ExamplesSearchService.extractKeywords(featureDescription);
 *
 * const results = await service.search({ technologies, keywords });
 * ```
 *
 * 3. Search with full content included:
 * ```typescript
 * const results = await service.search({
 *   domain: 'testing',
 *   includeContent: true
 * });
 * console.log(results.testing[0].content); // Full file content
 * ```
 */

export default ExamplesSearchService;
