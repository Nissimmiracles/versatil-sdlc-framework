/**
 * Markdown Analyzer
 *
 * Analyzes markdown rendering quality including heading hierarchy,
 * list formatting, code blocks, tables, links, and images.
 *
 * @module MarkdownAnalyzer
 */

import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MarkdownAnalysisResult {
  overallScore: number; // 0-100
  headingHierarchy: HeadingHierarchyReport;
  listFormatting: ListFormattingReport;
  codeBlocks: CodeBlockReport;
  tables: TableReport;
  links: LinkReport;
  images: ImageReport;
  readability: ReadabilityReport;
  summary: string;
}

export interface HeadingHierarchyReport {
  score: number;
  structure: HeadingStructure[];
  violations: HeadingViolation[];
  recommendations: string[];
}

export interface HeadingStructure {
  level: number; // 1-6
  text: string;
  line: number;
  file: string;
}

export interface HeadingViolation {
  file: string;
  line: number;
  type: 'missing-h1' | 'skipped-level' | 'multiple-h1' | 'inconsistent-style';
  description: string;
  currentState: string;
  expectedState: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ListFormattingReport {
  score: number;
  consistency: boolean;
  violations: ListViolation[];
  recommendations: string[];
}

export interface ListViolation {
  file: string;
  line: number;
  type: 'mixed-markers' | 'inconsistent-indentation' | 'missing-blank-lines';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface CodeBlockReport {
  score: number;
  totalBlocks: number;
  syntaxHighlighting: SyntaxHighlightingAnalysis;
  formatting: CodeFormattingAnalysis;
  recommendations: string[];
}

export interface SyntaxHighlightingAnalysis {
  withLanguage: number;
  withoutLanguage: number;
  percentageWithLanguage: number;
}

export interface CodeFormattingAnalysis {
  wellFormatted: number;
  poorlyFormatted: number;
  issues: CodeFormattingIssue[];
}

export interface CodeFormattingIssue {
  file: string;
  line: number;
  type: 'missing-language' | 'inconsistent-indentation' | 'long-lines';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface TableReport {
  score: number;
  totalTables: number;
  violations: TableViolation[];
  recommendations: string[];
}

export interface TableViolation {
  file: string;
  line: number;
  type: 'malformed-table' | 'inconsistent-alignment' | 'missing-headers' | 'uneven-columns';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface LinkReport {
  score: number;
  totalLinks: number;
  internal: number;
  external: number;
  brokenLinks: BrokenLink[];
  recommendations: string[];
}

export interface BrokenLink {
  file: string;
  line: number;
  url: string;
  text: string;
  reason: 'not-found' | 'invalid-format' | 'relative-path-issue';
}

export interface ImageReport {
  score: number;
  totalImages: number;
  withAltText: number;
  withoutAltText: number;
  violations: ImageViolation[];
  recommendations: string[];
}

export interface ImageViolation {
  file: string;
  line: number;
  type: 'missing-alt-text' | 'empty-alt-text' | 'broken-path';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ReadabilityReport {
  score: number;
  paragraphLength: ParagraphAnalysis;
  sentenceLength: SentenceAnalysis;
  recommendations: string[];
}

export interface ParagraphAnalysis {
  average: number;
  tooLong: number; // > 150 words
  optimal: number; // 50-150 words
}

export interface SentenceAnalysis {
  average: number;
  tooLong: number; // > 25 words
  optimal: number; // 10-25 words
}

export interface MarkdownContext {
  filePaths: string[];
  fileContents: Map<string, string>;
  baseUrl?: string; // For link validation
}

// ============================================================================
// MARKDOWN ANALYZER CLASS
// ============================================================================

export class MarkdownAnalyzer {
  /**
   * Analyze markdown files comprehensively
   */
  async analyze(context: MarkdownContext): Promise<MarkdownAnalysisResult> {
    // Filter markdown files
    const markdownFiles = this.filterMarkdownFiles(context);

    if (markdownFiles.length === 0) {
      return this.emptyAnalysis();
    }

    // Run all analyses in parallel
    const [
      headingHierarchy,
      listFormatting,
      codeBlocks,
      tables,
      links,
      images,
      readability
    ] = await Promise.all([
      this.analyzeHeadingHierarchy(markdownFiles, context),
      this.analyzeListFormatting(markdownFiles, context),
      this.analyzeCodeBlocks(markdownFiles, context),
      this.analyzeTables(markdownFiles, context),
      this.analyzeLinks(markdownFiles, context),
      this.analyzeImages(markdownFiles, context),
      this.analyzeReadability(markdownFiles, context)
    ]);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      headingHierarchy,
      listFormatting,
      codeBlocks,
      tables,
      links,
      images,
      readability
    });

    // Generate summary
    const summary = this.generateSummary(overallScore, {
      headingHierarchy,
      listFormatting,
      codeBlocks,
      tables,
      links,
      images,
      readability
    });

    return {
      overallScore,
      headingHierarchy,
      listFormatting,
      codeBlocks,
      tables,
      links,
      images,
      readability,
      summary
    };
  }

  // ==========================================================================
  // HEADING HIERARCHY ANALYSIS
  // ==========================================================================

  private async analyzeHeadingHierarchy(
    files: string[],
    context: MarkdownContext
  ): Promise<HeadingHierarchyReport> {
    const structure: HeadingStructure[] = [];
    const violations: HeadingViolation[] = [];

    for (const file of files) {
      const content = context.fileContents.get(file) || '';
      const lines = content.split('\n');

      let h1Count = 0;
      let lastLevel = 0;

      lines.forEach((line, index) => {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];

          structure.push({
            level,
            text,
            line: index + 1,
            file
          });

          // Check for H1
          if (level === 1) {
            h1Count++;
            if (h1Count > 1) {
              violations.push({
                file,
                line: index + 1,
                type: 'multiple-h1',
                description: 'Document should have only one H1',
                currentState: `H1 #${h1Count}`,
                expectedState: 'Single H1 as document title',
                severity: 'high'
              });
            }
          }

          // Check for skipped levels
          if (lastLevel > 0 && level > lastLevel + 1) {
            violations.push({
              file,
              line: index + 1,
              type: 'skipped-level',
              description: `Heading jumps from H${lastLevel} to H${level}`,
              currentState: `H${lastLevel} → H${level}`,
              expectedState: `H${lastLevel} → H${lastLevel + 1}`,
              severity: 'medium'
            });
          }

          lastLevel = level;
        }
      });

      // Check for missing H1
      if (h1Count === 0 && structure.length > 0) {
        violations.push({
          file,
          line: 1,
          type: 'missing-h1',
          description: 'Document should start with H1',
          currentState: 'No H1',
          expectedState: 'H1 as first heading',
          severity: 'high'
        });
      }
    }

    const score = Math.max(0, 100 - (violations.length * 15));
    const recommendations = this.generateHeadingRecommendations(violations);

    return { score, structure, violations, recommendations };
  }

  private generateHeadingRecommendations(violations: HeadingViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.type === 'missing-h1')) {
      recommendations.push('Add H1 heading as document title');
    }
    if (violations.some(v => v.type === 'multiple-h1')) {
      recommendations.push('Use only one H1 per document');
    }
    if (violations.some(v => v.type === 'skipped-level')) {
      recommendations.push('Follow sequential heading hierarchy (H1 → H2 → H3)');
    }

    return recommendations;
  }

  // ==========================================================================
  // LIST FORMATTING ANALYSIS
  // ==========================================================================

  private async analyzeListFormatting(
    files: string[],
    context: MarkdownContext
  ): Promise<ListFormattingReport> {
    const violations: ListViolation[] = [];
    let consistencyScore = 100;

    for (const file of files) {
      const content = context.fileContents.get(file) || '';
      const lines = content.split('\n');

      const unorderedMarkers = new Set<string>();
      const orderedMarkers = new Set<string>();

      lines.forEach((line, index) => {
        // Check for mixed unordered list markers
        const unorderedMatch = line.match(/^(\s*)([*+-])\s+/);
        if (unorderedMatch) {
          unorderedMarkers.add(unorderedMatch[2]);
        }

        // Check for ordered list markers
        const orderedMatch = line.match(/^(\s*)(\d+)[.)]\s+/);
        if (orderedMatch) {
          orderedMarkers.add(orderedMatch[0].trim()[orderedMatch[0].trim().length - 1]);
        }
      });

      // Check for mixed markers
      if (unorderedMarkers.size > 1) {
        violations.push({
          file,
          line: 0,
          type: 'mixed-markers',
          description: `Mixed unordered list markers: ${Array.from(unorderedMarkers).join(', ')}`,
          severity: 'medium'
        });
        consistencyScore -= 20;
      }

      if (orderedMarkers.size > 1) {
        violations.push({
          file,
          line: 0,
          type: 'mixed-markers',
          description: `Mixed ordered list markers: ${Array.from(orderedMarkers).join(', ')}`,
          severity: 'medium'
        });
        consistencyScore -= 20;
      }
    }

    const score = Math.max(0, consistencyScore);
    const consistency = violations.length === 0;
    const recommendations = [
      'Use consistent list markers (prefer - for unordered lists)',
      'Use consistent numbering (prefer 1. for ordered lists)',
      'Add blank lines before and after lists for clarity'
    ];

    return { score, consistency, violations, recommendations };
  }

  // ==========================================================================
  // CODE BLOCK ANALYSIS
  // ==========================================================================

  private async analyzeCodeBlocks(
    files: string[],
    context: MarkdownContext
  ): Promise<CodeBlockReport> {
    let totalBlocks = 0;
    let withLanguage = 0;
    let withoutLanguage = 0;
    const formattingIssues: CodeFormattingIssue[] = [];

    for (const file of files) {
      const content = context.fileContents.get(file) || '';
      const lines = content.split('\n');

      let inCodeBlock = false;
      let codeBlockStartLine = 0;
      let codeBlockLanguage = '';

      lines.forEach((line, index) => {
        const codeBlockMatch = line.match(/^```(\w*)$/);
        if (codeBlockMatch) {
          if (!inCodeBlock) {
            // Starting code block
            inCodeBlock = true;
            codeBlockStartLine = index + 1;
            codeBlockLanguage = codeBlockMatch[1];
            totalBlocks++;

            if (codeBlockLanguage) {
              withLanguage++;
            } else {
              withoutLanguage++;
              formattingIssues.push({
                file,
                line: index + 1,
                type: 'missing-language',
                description: 'Code block missing language specifier',
                severity: 'medium'
              });
            }
          } else {
            // Ending code block
            inCodeBlock = false;
          }
        }
      });
    }

    const percentageWithLanguage = totalBlocks > 0
      ? Math.round((withLanguage / totalBlocks) * 100)
      : 100;

    const syntaxHighlighting: SyntaxHighlightingAnalysis = {
      withLanguage,
      withoutLanguage,
      percentageWithLanguage
    };

    const formatting: CodeFormattingAnalysis = {
      wellFormatted: withLanguage,
      poorlyFormatted: withoutLanguage,
      issues: formattingIssues
    };

    const score = percentageWithLanguage;
    const recommendations = [
      'Add language specifiers to all code blocks (e.g., ```typescript)',
      'Ensure code is properly indented within blocks',
      'Keep code lines under 80 characters when possible'
    ];

    return { score, totalBlocks, syntaxHighlighting, formatting, recommendations };
  }

  // ==========================================================================
  // TABLE ANALYSIS
  // ==========================================================================

  private async analyzeTables(
    files: string[],
    context: MarkdownContext
  ): Promise<TableReport> {
    let totalTables = 0;
    const violations: TableViolation[] = [];

    for (const file of files) {
      const content = context.fileContents.get(file) || '';
      const lines = content.split('\n');

      let inTable = false;
      let tableStartLine = 0;
      let columnCount = 0;

      lines.forEach((line, index) => {
        // Detect table rows
        if (line.match(/^\|.+\|$/)) {
          if (!inTable) {
            inTable = true;
            tableStartLine = index + 1;
            totalTables++;
            columnCount = line.split('|').length - 2; // Exclude leading/trailing |
          }

          // Check column consistency
          const currentColumns = line.split('|').length - 2;
          if (currentColumns !== columnCount) {
            violations.push({
              file,
              line: index + 1,
              type: 'uneven-columns',
              description: `Table row has ${currentColumns} columns, expected ${columnCount}`,
              severity: 'high'
            });
          }
        } else if (inTable && !line.trim()) {
          inTable = false;
        }

        // Check for separator line
        if (line.match(/^\|[\s:-]+\|$/)) {
          // Table header separator found
        }
      });
    }

    const score = Math.max(0, 100 - (violations.length * 15));
    const recommendations = [
      'Ensure all table rows have the same number of columns',
      'Add header separator line (|---|---|)',
      'Align columns for better readability'
    ];

    return { score, totalTables, violations, recommendations };
  }

  // ==========================================================================
  // LINK ANALYSIS
  // ==========================================================================

  private async analyzeLinks(
    files: string[],
    context: MarkdownContext
  ): Promise<LinkReport> {
    let totalLinks = 0;
    let internal = 0;
    let external = 0;
    const brokenLinks: BrokenLink[] = [];

    for (const file of files) {
      const content = context.fileContents.get(file) || '';
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      const matches = content.matchAll(linkPattern);

      for (const match of matches) {
        totalLinks++;
        const text = match[1];
        const url = match[2];

        if (url.startsWith('http://') || url.startsWith('https://')) {
          external++;
        } else if (url.startsWith('#')) {
          internal++;
        } else if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
          internal++;

          // Check for relative path issues
          if (!url.endsWith('.md') && !url.includes('#')) {
            brokenLinks.push({
              file,
              line: 0,
              url,
              text,
              reason: 'relative-path-issue'
            });
          }
        } else {
          brokenLinks.push({
            file,
            line: 0,
            url,
            text,
            reason: 'invalid-format'
          });
        }
      }
    }

    const score = Math.max(0, 100 - (brokenLinks.length * 10));
    const recommendations = [
      'Validate all external links periodically',
      'Use relative paths for internal links',
      'Add link titles for better accessibility'
    ];

    return { score, totalLinks, internal, external, brokenLinks, recommendations };
  }

  // ==========================================================================
  // IMAGE ANALYSIS
  // ==========================================================================

  private async analyzeImages(
    files: string[],
    context: MarkdownContext
  ): Promise<ImageReport> {
    let totalImages = 0;
    let withAltText = 0;
    let withoutAltText = 0;
    const violations: ImageViolation[] = [];

    for (const file of files) {
      const content = context.fileContents.get(file) || '';
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Detect markdown images
        const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const matches = line.matchAll(imagePattern);

        for (const match of matches) {
          totalImages++;
          const altText = match[1];
          const src = match[2];

          if (altText && altText.trim()) {
            withAltText++;
          } else {
            withoutAltText++;
            violations.push({
              file,
              line: index + 1,
              type: 'missing-alt-text',
              description: `Image missing alt text: ${src}`,
              severity: 'high'
            });
          }
        }
      });
    }

    const score = totalImages > 0
      ? Math.round((withAltText / totalImages) * 100)
      : 100;

    const recommendations = [
      'Add descriptive alt text to all images',
      'Use lazy loading for images (loading="lazy")',
      'Optimize image sizes for web'
    ];

    return { score, totalImages, withAltText, withoutAltText, violations, recommendations };
  }

  // ==========================================================================
  // READABILITY ANALYSIS
  // ==========================================================================

  private async analyzeReadability(
    files: string[],
    context: MarkdownContext
  ): Promise<ReadabilityReport> {
    let totalParagraphs = 0;
    let totalSentences = 0;
    let paragraphWordCount = 0;
    let sentenceWordCount = 0;
    let longParagraphs = 0;
    let longSentences = 0;
    let optimalParagraphs = 0;
    let optimalSentences = 0;

    for (const file of files) {
      const content = context.fileContents.get(file) || '';

      // Analyze paragraphs
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim() && !p.startsWith('#'));
      totalParagraphs += paragraphs.length;

      paragraphs.forEach(para => {
        const words = para.split(/\s+/).length;
        paragraphWordCount += words;

        if (words > 150) {
          longParagraphs++;
        } else if (words >= 50 && words <= 150) {
          optimalParagraphs++;
        }
      });

      // Analyze sentences
      const sentences = content.split(/[.!?]+/).filter(s => s.trim());
      totalSentences += sentences.length;

      sentences.forEach(sentence => {
        const words = sentence.split(/\s+/).length;
        sentenceWordCount += words;

        if (words > 25) {
          longSentences++;
        } else if (words >= 10 && words <= 25) {
          optimalSentences++;
        }
      });
    }

    const paragraphAnalysis: ParagraphAnalysis = {
      average: totalParagraphs > 0 ? Math.round(paragraphWordCount / totalParagraphs) : 0,
      tooLong: longParagraphs,
      optimal: optimalParagraphs
    };

    const sentenceAnalysis: SentenceAnalysis = {
      average: totalSentences > 0 ? Math.round(sentenceWordCount / totalSentences) : 0,
      tooLong: longSentences,
      optimal: optimalSentences
    };

    const score = Math.round(
      ((optimalParagraphs / Math.max(totalParagraphs, 1)) * 50) +
      ((optimalSentences / Math.max(totalSentences, 1)) * 50)
    );

    const recommendations = [
      'Keep paragraphs between 50-150 words',
      'Keep sentences between 10-25 words',
      'Use shorter sentences for better readability'
    ];

    return {
      score,
      paragraphLength: paragraphAnalysis,
      sentenceLength: sentenceAnalysis,
      recommendations
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  private filterMarkdownFiles(context: MarkdownContext): string[] {
    return context.filePaths.filter(path => path.endsWith('.md'));
  }

  private calculateOverallScore(results: {
    headingHierarchy: HeadingHierarchyReport;
    listFormatting: ListFormattingReport;
    codeBlocks: CodeBlockReport;
    tables: TableReport;
    links: LinkReport;
    images: ImageReport;
    readability: ReadabilityReport;
  }): number {
    const scores = [
      results.headingHierarchy.score,
      results.listFormatting.score,
      results.codeBlocks.score,
      results.tables.score,
      results.links.score,
      results.images.score,
      results.readability.score
    ];

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  private generateSummary(score: number, results: any): string {
    const rating = score >= 90 ? 'Excellent' :
                   score >= 70 ? 'Good' :
                   score >= 50 ? 'Fair' : 'Poor';

    const issues: string[] = [];
    if (results.headingHierarchy.score < 70) issues.push('heading hierarchy');
    if (results.codeBlocks.score < 70) issues.push('code block formatting');
    if (results.images.score < 70) issues.push('image alt text');
    if (results.readability.score < 70) issues.push('readability');

    return `Markdown quality is ${rating} (${score}/100). ` +
           (issues.length > 0
             ? `Areas needing attention: ${issues.join(', ')}.`
             : 'All areas meet quality standards.');
  }

  private emptyAnalysis(): MarkdownAnalysisResult {
    return {
      overallScore: 100,
      headingHierarchy: {
        score: 100,
        structure: [],
        violations: [],
        recommendations: []
      },
      listFormatting: {
        score: 100,
        consistency: true,
        violations: [],
        recommendations: []
      },
      codeBlocks: {
        score: 100,
        totalBlocks: 0,
        syntaxHighlighting: {
          withLanguage: 0,
          withoutLanguage: 0,
          percentageWithLanguage: 100
        },
        formatting: {
          wellFormatted: 0,
          poorlyFormatted: 0,
          issues: []
        },
        recommendations: []
      },
      tables: {
        score: 100,
        totalTables: 0,
        violations: [],
        recommendations: []
      },
      links: {
        score: 100,
        totalLinks: 0,
        internal: 0,
        external: 0,
        brokenLinks: [],
        recommendations: []
      },
      images: {
        score: 100,
        totalImages: 0,
        withAltText: 0,
        withoutAltText: 0,
        violations: [],
        recommendations: []
      },
      readability: {
        score: 100,
        paragraphLength: { average: 0, tooLong: 0, optimal: 0 },
        sentenceLength: { average: 0, tooLong: 0, optimal: 0 },
        recommendations: []
      },
      summary: 'No markdown files to analyze.'
    };
  }
}
