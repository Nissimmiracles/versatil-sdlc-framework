/**
 * Repository Analyzer for Sarah-PM
 * Automatically analyzes project structure and identifies organizational issues
 */

import { EventEmitter } from 'events';
import { readdir, stat, readFile } from 'fs/promises';
import { join, relative, dirname, extname, basename } from 'path';
import { existsSync } from 'fs';

export interface RepositoryIssue {
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  category: 'structure' | 'organization' | 'cleanup' | 'missing' | 'security';
  title: string;
  description: string;
  files?: string[];
  recommendation: string;
  autoFixable: boolean;
}

export interface RepositoryHealth {
  score: number; // 0-100
  totalIssues: number;
  issuesBySeverity: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
  };
  categories: {
    structure: number;
    organization: number;
    cleanup: number;
    missing: number;
    security: number;
  };
}

export interface AnalysisResult {
  projectPath: string;
  analyzedAt: Date;
  health: RepositoryHealth;
  issues: RepositoryIssue[];
  statistics: RepositoryStatistics;
  recommendations: string[];
}

export interface RepositoryStatistics {
  totalFiles: number;
  totalDirectories: number;
  filesByExtension: Record<string, number>;
  largestFiles: Array<{ path: string; size: number }>;
  documentationCoverage: number; // 0-100
  testCoverage: {
    hasTests: boolean;
    testFiles: number;
    sourceFiles: number;
  };
}

export interface AnalyzerConfig {
  ignorePaths: string[];
  standardDirectories: string[];
  maxFileSize: number; // bytes
  checkGitignore: boolean;
}

export class RepositoryAnalyzer extends EventEmitter {
  private config: AnalyzerConfig;

  // Standard project directories that should exist
  private readonly STANDARD_DIRS = [
    'src',
    'docs',
    'tests',
    '.github'
  ];

  // Files that should be in root
  private readonly ROOT_FILES = [
    'package.json',
    'README.md',
    '.gitignore',
    'tsconfig.json'
  ];

  // Documentation file patterns
  private readonly DOC_PATTERNS = [
    /\.md$/i,
    /^README/i,
    /^CHANGELOG/i,
    /^LICENSE/i
  ];

  // Files/directories to always ignore
  private readonly IGNORE_PATTERNS = [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
    '.DS_Store',
    '*.log',
    '.env.local',
    '*.tgz',
    '.backup',
    '.cache'
  ];

  constructor(config: Partial<AnalyzerConfig> = {}) {
    super();
    this.config = {
      ignorePaths: [
        'node_modules',
        'dist',
        'build',
        'coverage',
        '.git',
        '.backup',
        '.cache',
        '.venv-python',
        '.jest-cache'
      ],
      standardDirectories: this.STANDARD_DIRS,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      checkGitignore: true,
      ...config
    };
  }

  /**
   * Analyze repository structure and identify issues
   */
  async analyze(projectPath: string): Promise<AnalysisResult> {
    this.emit('analysis:started', { projectPath });

    const issues: RepositoryIssue[] = [];
    const stats: RepositoryStatistics = {
      totalFiles: 0,
      totalDirectories: 0,
      filesByExtension: {},
      largestFiles: [],
      documentationCoverage: 0,
      testCoverage: {
        hasTests: false,
        testFiles: 0,
        sourceFiles: 0
      }
    };

    try {
      // Scan directory structure
      await this.scanDirectory(projectPath, projectPath, stats, issues);

      // Check for standard directories
      await this.checkStandardDirectories(projectPath, issues);

      // Check for orphaned documentation
      await this.checkOrphanedDocs(projectPath, issues);

      // Check .gitignore
      if (this.config.checkGitignore) {
        await this.checkGitignore(projectPath, issues);
      }

      // Check for cleanup opportunities
      await this.checkCleanupNeeded(projectPath, issues);

      // Calculate documentation coverage
      stats.documentationCoverage = this.calculateDocCoverage(stats);

      // Calculate health score
      const health = this.calculateHealth(issues);

      // Generate recommendations
      const recommendations = this.generateRecommendations(issues, stats);

      const result: AnalysisResult = {
        projectPath,
        analyzedAt: new Date(),
        health,
        issues,
        statistics: stats,
        recommendations
      };

      this.emit('analysis:completed', result);
      return result;

    } catch (error: any) {
      this.emit('analysis:error', { projectPath, error: error.message });
      throw error;
    }
  }

  /**
   * Recursively scan directory
   */
  private async scanDirectory(
    basePath: string,
    currentPath: string,
    stats: RepositoryStatistics,
    issues: RepositoryIssue[]
  ): Promise<void> {
    // Check if path should be ignored
    const relativePath = relative(basePath, currentPath);
    if (this.shouldIgnore(relativePath)) {
      return;
    }

    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      const relPath = relative(basePath, fullPath);

      if (this.shouldIgnore(relPath) || this.shouldIgnore(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        stats.totalDirectories++;
        await this.scanDirectory(basePath, fullPath, stats, issues);
      } else if (entry.isFile()) {
        stats.totalFiles++;

        // Track file by extension
        const ext = extname(entry.name);
        stats.filesByExtension[ext] = (stats.filesByExtension[ext] || 0) + 1;

        // Check file size
        const fileStat = await stat(fullPath);
        if (fileStat.size > this.config.maxFileSize) {
          issues.push({
            severity: 'P2',
            category: 'cleanup',
            title: 'Large file detected',
            description: `File exceeds ${this.config.maxFileSize / 1024 / 1024}MB`,
            files: [relPath],
            recommendation: 'Consider splitting or compressing this file',
            autoFixable: false
          });
        }

        // Track largest files
        stats.largestFiles.push({ path: relPath, size: fileStat.size });
        stats.largestFiles.sort((a, b) => b.size - a.size);
        stats.largestFiles = stats.largestFiles.slice(0, 10); // Keep top 10

        // Track test files
        if (this.isTestFile(entry.name)) {
          stats.testCoverage.testFiles++;
          stats.testCoverage.hasTests = true;
        } else if (this.isSourceFile(entry.name)) {
          stats.testCoverage.sourceFiles++;
        }
      }
    }
  }

  /**
   * Check for standard project directories
   */
  private async checkStandardDirectories(
    projectPath: string,
    issues: RepositoryIssue[]
  ): Promise<void> {
    const missingDirs: string[] = [];

    for (const dir of this.config.standardDirectories) {
      const dirPath = join(projectPath, dir);
      if (!existsSync(dirPath)) {
        missingDirs.push(dir);
      }
    }

    if (missingDirs.length > 0) {
      issues.push({
        severity: 'P2',
        category: 'missing',
        title: 'Missing standard directories',
        description: `Project is missing ${missingDirs.length} standard directories`,
        files: missingDirs,
        recommendation: `Create directories: ${missingDirs.join(', ')}`,
        autoFixable: true
      });
    }

    // Check for specific subdirectories
    const docsPath = join(projectPath, 'docs');
    if (existsSync(docsPath)) {
      const recommendedSubdirs = ['api', 'architecture', 'guides'];
      const missingSubdirs: string[] = [];

      for (const subdir of recommendedSubdirs) {
        if (!existsSync(join(docsPath, subdir))) {
          missingSubdirs.push(`docs/${subdir}`);
        }
      }

      if (missingSubdirs.length > 0) {
        issues.push({
          severity: 'P3',
          category: 'structure',
          title: 'Recommended documentation subdirectories missing',
          description: 'Consider organizing docs into subdirectories',
          files: missingSubdirs,
          recommendation: `Create: ${missingSubdirs.join(', ')}`,
          autoFixable: true
        });
      }
    }
  }

  /**
   * Check for orphaned documentation files
   */
  private async checkOrphanedDocs(
    projectPath: string,
    issues: RepositoryIssue[]
  ): Promise<void> {
    const rootFiles = await readdir(projectPath);
    const orphanedDocs: string[] = [];

    for (const file of rootFiles) {
      const filePath = join(projectPath, file);
      const fileStat = await stat(filePath);

      if (!fileStat.isFile()) continue;
      if (this.shouldIgnore(file)) continue;

      // Check if it's a documentation file that should be in docs/
      if (this.isDocumentationFile(file) && !this.ROOT_FILES.includes(file)) {
        orphanedDocs.push(file);
      }
    }

    if (orphanedDocs.length > 0) {
      issues.push({
        severity: 'P1',
        category: 'organization',
        title: 'Documentation files in project root',
        description: `Found ${orphanedDocs.length} documentation files that should be in docs/`,
        files: orphanedDocs,
        recommendation: 'Move these files to docs/ directory',
        autoFixable: true
      });
    }
  }

  /**
   * Check .gitignore for common issues
   */
  private async checkGitignore(
    projectPath: string,
    issues: RepositoryIssue[]
  ): Promise<void> {
    const gitignorePath = join(projectPath, '.gitignore');

    if (!existsSync(gitignorePath)) {
      issues.push({
        severity: 'P0',
        category: 'security',
        title: 'Missing .gitignore file',
        description: 'Project does not have a .gitignore file',
        recommendation: 'Create .gitignore to prevent committing sensitive files',
        autoFixable: true
      });
      return;
    }

    // Read .gitignore
    const gitignoreContent = await readFile(gitignorePath, 'utf-8');
    const ignoredPatterns = gitignoreContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));

    // Check for essential patterns
    const essentialPatterns = [
      'node_modules',
      'dist',
      '.env',
      '*.log',
      '.DS_Store',
      'coverage'
    ];

    const missingPatterns = essentialPatterns.filter(
      pattern => !ignoredPatterns.some(p => p.includes(pattern))
    );

    if (missingPatterns.length > 0) {
      issues.push({
        severity: 'P1',
        category: 'security',
        title: 'Incomplete .gitignore',
        description: 'Missing important ignore patterns',
        files: missingPatterns.map(p => `.gitignore: ${p}`),
        recommendation: `Add to .gitignore: ${missingPatterns.join(', ')}`,
        autoFixable: true
      });
    }

    // Check for files that should be ignored but aren't
    const shouldBeIgnored = ['.DS_Store', '*.log'];
    const trackedFiles: string[] = [];

    for (const pattern of shouldBeIgnored) {
      const rootFiles = await readdir(projectPath);
      const matches = rootFiles.filter(f =>
        pattern.includes('*')
          ? f.endsWith(pattern.replace('*', ''))
          : f === pattern
      );

      if (matches.length > 0) {
        trackedFiles.push(...matches);
      }
    }

    if (trackedFiles.length > 0) {
      issues.push({
        severity: 'P2',
        category: 'cleanup',
        title: 'Files that should be gitignored',
        description: `Found ${trackedFiles.length} files that should be ignored`,
        files: trackedFiles,
        recommendation: 'Remove these files and update .gitignore',
        autoFixable: true
      });
    }
  }

  /**
   * Check for cleanup opportunities
   */
  private async checkCleanupNeeded(
    projectPath: string,
    issues: RepositoryIssue[]
  ): Promise<void> {
    const rootFiles = await readdir(projectPath);
    const backupFiles: string[] = [];

    for (const file of rootFiles) {
      // Check for backup files
      if (file.startsWith('.!') || file.endsWith('.backup') || file.endsWith('~')) {
        backupFiles.push(file);
      }
    }

    if (backupFiles.length > 0) {
      issues.push({
        severity: 'P3',
        category: 'cleanup',
        title: 'Backup files detected',
        description: `Found ${backupFiles.length} backup files in root`,
        files: backupFiles,
        recommendation: 'Remove backup files or move to .backup/ directory',
        autoFixable: true
      });
    }
  }

  /**
   * Calculate repository health score
   */
  private calculateHealth(issues: RepositoryIssue[]): RepositoryHealth {
    const issuesBySeverity = {
      P0: issues.filter(i => i.severity === 'P0').length,
      P1: issues.filter(i => i.severity === 'P1').length,
      P2: issues.filter(i => i.severity === 'P2').length,
      P3: issues.filter(i => i.severity === 'P3').length
    };

    const categories = {
      structure: issues.filter(i => i.category === 'structure').length,
      organization: issues.filter(i => i.category === 'organization').length,
      cleanup: issues.filter(i => i.category === 'cleanup').length,
      missing: issues.filter(i => i.category === 'missing').length,
      security: issues.filter(i => i.category === 'security').length
    };

    // Calculate score (100 - weighted penalties)
    let score = 100;
    score -= issuesBySeverity.P0 * 20; // Critical: -20 each
    score -= issuesBySeverity.P1 * 10; // High: -10 each
    score -= issuesBySeverity.P2 * 5;  // Medium: -5 each
    score -= issuesBySeverity.P3 * 2;  // Low: -2 each

    score = Math.max(0, Math.min(100, score)); // Clamp 0-100

    return {
      score,
      totalIssues: issues.length,
      issuesBySeverity,
      categories
    };
  }

  /**
   * Calculate documentation coverage
   */
  private calculateDocCoverage(stats: RepositoryStatistics): number {
    const docFiles = Object.entries(stats.filesByExtension)
      .filter(([ext]) => ext === '.md')
      .reduce((sum, [, count]) => sum + count, 0);

    const sourceFiles = Object.entries(stats.filesByExtension)
      .filter(([ext]) => ['.ts', '.tsx', '.js', '.jsx'].includes(ext))
      .reduce((sum, [, count]) => sum + count, 0);

    if (sourceFiles === 0) return 0;

    // Expect at least 1 doc file per 10 source files
    const expectedDocs = Math.ceil(sourceFiles / 10);
    const coverage = Math.min(100, (docFiles / expectedDocs) * 100);

    return Math.round(coverage);
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(
    issues: RepositoryIssue[],
    stats: RepositoryStatistics
  ): string[] {
    const recommendations: string[] = [];

    // Priority issues first
    const criticalIssues = issues.filter(i => i.severity === 'P0');
    if (criticalIssues.length > 0) {
      recommendations.push(`🚨 Address ${criticalIssues.length} critical issues immediately`);
    }

    // Documentation recommendations
    if (stats.documentationCoverage < 50) {
      recommendations.push(`📚 Improve documentation coverage (current: ${stats.documentationCoverage}%)`);
    }

    // Test recommendations
    if (!stats.testCoverage.hasTests) {
      recommendations.push('🧪 Add test files (no tests detected)');
    } else if (stats.testCoverage.sourceFiles > 0) {
      const testRatio = stats.testCoverage.testFiles / stats.testCoverage.sourceFiles;
      if (testRatio < 0.5) {
        recommendations.push(`🧪 Increase test coverage (${stats.testCoverage.testFiles} tests for ${stats.testCoverage.sourceFiles} source files)`);
      }
    }

    // Auto-fixable issues
    const autoFixable = issues.filter(i => i.autoFixable);
    if (autoFixable.length > 0) {
      recommendations.push(`⚡ ${autoFixable.length} issues can be auto-fixed`);
    }

    return recommendations;
  }

  /**
   * Helper: Should path be ignored?
   */
  private shouldIgnore(path: string): boolean {
    return this.IGNORE_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(path);
      }
      return path.includes(pattern);
    });
  }

  /**
   * Helper: Is this a documentation file?
   */
  private isDocumentationFile(filename: string): boolean {
    return this.DOC_PATTERNS.some(pattern => pattern.test(filename));
  }

  /**
   * Helper: Is this a test file?
   */
  private isTestFile(filename: string): boolean {
    return /\.(test|spec)\.(ts|tsx|js|jsx)$/i.test(filename) ||
           filename.includes('__tests__');
  }

  /**
   * Helper: Is this a source file?
   */
  private isSourceFile(filename: string): boolean {
    return /\.(ts|tsx|js|jsx)$/i.test(filename) &&
           !this.isTestFile(filename);
  }
}
