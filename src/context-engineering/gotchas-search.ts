/**
 * Gotchas Search Service
 *
 * Searches .versatil/gotchas/ directory for relevant anti-patterns
 * and common mistakes based on technology, pattern, and severity.
 *
 * Used by /plan command with --with-gotchas or --full-context flags
 * to prevent agents from repeating known mistakes (-50% errors).
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, basename } from 'path';

export type GotchaSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface GotchaEntry {
  id: string;
  title: string;
  severity: GotchaSeverity;
  frequency: string; // 'Common (45%)', 'Rare (5%)', etc.
  technology: string; // 'typescript', 'react', 'postgresql'
  pattern?: string; // 'authentication', 'async', 'api-design'
  mistake: string; // What NOT to do (code example)
  correctPattern: string; // What TO do (code example)
  detection: string; // How to detect (ESLint rule, manual review, etc.)
  historicalExample?: string; // Real impact from past
  lessonLearned?: string; // One sentence takeaway
  file_path: string;
  relative_path: string;
}

export interface GotchaSearchQuery {
  technologies?: string[]; // 'typescript', 'react', 'postgresql'
  patterns?: string[]; // 'authentication', 'async', 'api-design'
  severity?: GotchaSeverity[]; // ['high', 'critical']
  agent?: string; // 'marcus-backend', 'james-frontend'
}

export interface GotchaSearchResult {
  backend: GotchaEntry[];
  frontend: GotchaEntry[];
  database: GotchaEntry[];
  testing: GotchaEntry[];
  all: GotchaEntry[];
}

export class GotchasSearchService {
  private gotchasDir: string;
  private cache: Map<string, GotchaEntry[]> = new Map();

  constructor(gotchasDir = '.versatil/gotchas') {
    this.gotchasDir = gotchasDir;
  }

  /**
   * Search gotchas library for relevant anti-patterns
   */
  async search(query: GotchaSearchQuery): Promise<GotchaSearchResult> {
    const allGotchas = await this.getAllGotchas();

    // Filter by query
    const filtered = allGotchas.filter(gotcha => {
      // Technology match
      if (query.technologies && query.technologies.length > 0) {
        const hasMatchingTech = query.technologies.some(tech =>
          gotcha.technology.toLowerCase().includes(tech.toLowerCase()) ||
          tech.toLowerCase().includes(gotcha.technology.toLowerCase())
        );
        if (!hasMatchingTech) return false;
      }

      // Pattern match
      if (query.patterns && query.patterns.length > 0 && gotcha.pattern) {
        const hasMatchingPattern = query.patterns.some(pattern =>
          gotcha.pattern!.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(gotcha.pattern!.toLowerCase())
        );
        if (!hasMatchingPattern) return false;
      }

      // Severity match
      if (query.severity && query.severity.length > 0) {
        if (!query.severity.includes(gotcha.severity)) {
          return false;
        }
      }

      // Agent match (by technology/pattern)
      if (query.agent) {
        const agentLower = query.agent.toLowerCase();
        if (agentLower.includes('backend') || agentLower.includes('marcus')) {
          if (!['typescript', 'node', 'api', 'authentication'].some(tech =>
            gotcha.technology.toLowerCase().includes(tech)
          )) {
            return false;
          }
        } else if (agentLower.includes('frontend') || agentLower.includes('james')) {
          if (!['react', 'typescript', 'accessibility', 'ui'].some(tech =>
            gotcha.technology.toLowerCase().includes(tech)
          )) {
            return false;
          }
        } else if (agentLower.includes('database') || agentLower.includes('dana')) {
          if (!['postgresql', 'sql', 'database'].some(tech =>
            gotcha.technology.toLowerCase().includes(tech)
          )) {
            return false;
          }
        }
      }

      return true;
    });

    // Sort by severity (critical > high > medium > low)
    const sorted = filtered.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    // Group by domain
    return {
      backend: sorted.filter(g =>
        ['typescript', 'node', 'api', 'authentication', 'async'].some(tech =>
          g.technology.toLowerCase().includes(tech)
        )
      ),
      frontend: sorted.filter(g =>
        ['react', 'typescript', 'accessibility', 'ui'].some(tech =>
          g.technology.toLowerCase().includes(tech)
        )
      ),
      database: sorted.filter(g =>
        ['postgresql', 'sql', 'database'].some(tech =>
          g.technology.toLowerCase().includes(tech)
        )
      ),
      testing: sorted.filter(g =>
        ['test', 'vitest', 'jest'].some(tech =>
          g.technology.toLowerCase().includes(tech)
        )
      ),
      all: sorted
    };
  }

  /**
   * Get all gotchas from .versatil/gotchas/ directory
   */
  private async getAllGotchas(): Promise<GotchaEntry[]> {
    const cacheKey = 'all';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const gotchas: GotchaEntry[] = [];

    try {
      // Scan all subdirectories
      const categories = await readdir(this.gotchasDir);

      for (const category of categories) {
        if (category === 'README.md' || category.startsWith('.')) continue;

        const categoryPath = join(this.gotchasDir, category);
        const categoryStat = await stat(categoryPath);

        if (!categoryStat.isDirectory()) continue;

        // Scan markdown files in category
        const files = await this.scanDirectory(categoryPath);
        gotchas.push(...files);
      }

      // Cache results
      this.cache.set(cacheKey, gotchas);

      return gotchas;
    } catch {
      console.warn(`Gotchas directory not found: ${this.gotchasDir}`);
      return [];
    }
  }

  /**
   * Scan directory for gotcha markdown files
   */
  private async scanDirectory(dirPath: string): Promise<GotchaEntry[]> {
    const gotchas: GotchaEntry[] = [];

    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        if (entry === 'README.md' || entry.startsWith('.')) continue;

        const fullPath = join(dirPath, entry);
        const entryStat = await stat(fullPath);

        if (entryStat.isFile() && entry.endsWith('.md')) {
          // Parse gotcha file
          const parsed = await this.parseGotchaFile(fullPath);
          gotchas.push(...parsed);
        }
      }
    } catch {
      // Skip directories that can't be read
    }

    return gotchas;
  }

  /**
   * Parse gotcha markdown file into structured entries
   */
  private async parseGotchaFile(filePath: string): Promise<GotchaEntry[]> {
    const relativePath = relative(this.gotchasDir, filePath);
    const technology = basename(filePath, '.md') || 'unknown';

    try {
      const content = await readFile(filePath, 'utf-8');
      const entries: GotchaEntry[] = [];

      // Split by "## Gotcha N:" headers
      const sections = content.split(/## Gotcha \d+:/);

      for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const entry = this.parseGotchaSection(section, technology, filePath, relativePath, i);
        if (entry) {
          entries.push(entry);
        }
      }

      return entries;
    } catch {
      console.warn(`Failed to parse gotcha file: ${filePath}`);
      return [];
    }
  }

  /**
   * Parse individual gotcha section
   */
  private parseGotchaSection(
    section: string,
    technology: string,
    filePath: string,
    relativePath: string,
    index: number
  ): GotchaEntry | null {
    try {
      // Extract title (first line)
      const titleMatch = section.match(/^([^\n]+)/);
      const title = titleMatch ? titleMatch[1].trim() : `Gotcha ${index}`;

      // Extract severity
      const severityMatch = section.match(/\*\*Severity\*\*:\s*(\w+)/i);
      const severity: GotchaSeverity = (severityMatch?.[1]?.toLowerCase() as GotchaSeverity) || 'medium';

      // Extract frequency
      const frequencyMatch = section.match(/\*\*Frequency\*\*:\s*([^\n]+)/i);
      const frequency = frequencyMatch ? frequencyMatch[1].trim() : 'Unknown';

      // Extract pattern (optional)
      const patternMatch = section.match(/\*\*Pattern\*\*:\s*([^\n]+)/i);
      const pattern = patternMatch ? patternMatch[1].trim() : undefined;

      // Extract mistake (code block after "### The Mistake")
      const mistakeMatch = section.match(/### The Mistake\s*\n(?:.*\n)*?```[\s\S]*?\n([\s\S]*?)```/);
      const mistake = mistakeMatch ? mistakeMatch[1].trim() : 'See file for details';

      // Extract correct pattern (code block after "### The Correct Pattern")
      const correctMatch = section.match(/### The Correct Pattern\s*\n(?:.*\n)*?```[\s\S]*?\n([\s\S]*?)```/);
      const correctPattern = correctMatch ? correctMatch[1].trim() : 'See file for details';

      // Extract detection
      const detectionMatch = section.match(/### Detection\s*\n([^\n#]+)/);
      const detection = detectionMatch ? detectionMatch[1].trim() : 'Manual review';

      // Extract historical example (optional)
      const historicalMatch = section.match(/### Historical Example\s*\n([^\n#]+)/);
      const historicalExample = historicalMatch ? historicalMatch[1].trim() : undefined;

      // Extract lesson learned (optional)
      const lessonMatch = section.match(/### Lesson Learned\s*\n([^\n#]+)/);
      const lessonLearned = lessonMatch ? lessonMatch[1].trim() : undefined;

      return {
        id: `${technology}-${index}`,
        title,
        severity,
        frequency,
        technology,
        pattern,
        mistake,
        correctPattern,
        detection,
        historicalExample,
        lessonLearned,
        file_path: filePath,
        relative_path: relativePath
      };
    } catch (error) {
      console.warn(`Failed to parse gotcha section: ${error}`);
      return null;
    }
  }

  /**
   * Clear cache (useful after gotchas are added/modified)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Detect patterns from feature description
   */
  static detectPatterns(featureDescription: string): string[] {
    const patterns: string[] = [];
    const lower = featureDescription.toLowerCase();

    // Common patterns
    const patternMap: Record<string, RegExp> = {
      authentication: /\b(auth|login|signup|jwt|token|session)\b/,
      async: /\b(async|await|promise|callback)\b/,
      'api-design': /\b(api|endpoint|rest|graphql|route)\b/,
      validation: /\b(validation|validate|schema|zod)\b/,
      'error-handling': /\b(error|exception|try|catch)\b/,
      accessibility: /\b(accessibility|wcag|aria|a11y)\b/,
      performance: /\b(performance|optimization|cache|fast)\b/
    };

    for (const [pattern, regex] of Object.entries(patternMap)) {
      if (regex.test(lower)) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Search for high-severity TypeScript gotchas:
 * ```typescript
 * const service = new GotchasSearchService();
 * const results = await service.search({
 *   technologies: ['typescript'],
 *   severity: ['high', 'critical']
 * });
 * console.log(results.all); // Sorted by severity
 * ```
 *
 * 2. Search for authentication-related gotchas:
 * ```typescript
 * const results = await service.search({
 *   patterns: ['authentication', 'async'],
 *   severity: ['high', 'critical']
 * });
 * ```
 *
 * 3. Get gotchas for specific agent:
 * ```typescript
 * const results = await service.search({
 *   agent: 'marcus-backend',
 *   severity: ['high', 'critical']
 * });
 * console.log(results.backend); // Backend-specific gotchas
 * ```
 */

export default GotchasSearchService;
