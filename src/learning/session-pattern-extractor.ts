/**
 * Session Pattern Extractor
 *
 * Extracts reusable patterns from completed development sessions.
 * Part of Stop Hook Learning Codification system.
 *
 * Pattern Types Extracted:
 * - Code patterns (repeated structures, common solutions)
 * - Debugging strategies (error → fix mappings)
 * - Performance optimizations
 * - Test patterns
 * - API design patterns
 * - Database schema patterns
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { VERSATILLogger } from '../utils/logger.js';

export interface SessionMetrics {
  sessionId: string;
  agent: string;
  duration: number;
  timestamp: string;
  actions: string[];
  filesChanged: string[];
  linesAdded: number;
  linesRemoved: number;
}

export interface ExtractedPattern {
  id: string;
  type: PatternType;
  category: PatternCategory;
  title: string;
  description: string;
  code?: string;
  context: PatternContext;
  metadata: PatternMetadata;
  examples: CodeExample[];
  tags: string[];
}

export enum PatternType {
  CODE = 'code',
  DEBUGGING = 'debugging',
  PERFORMANCE = 'performance',
  TESTING = 'testing',
  API_DESIGN = 'api_design',
  DATABASE = 'database',
  ARCHITECTURE = 'architecture',
  REFACTORING = 'refactoring'
}

export enum PatternCategory {
  SOLUTION = 'solution',
  OPTIMIZATION = 'optimization',
  BUG_FIX = 'bug_fix',
  FEATURE = 'feature',
  TEST = 'test',
  DOCUMENTATION = 'documentation'
}

export interface PatternContext {
  agent: string;
  sessionId: string;
  timestamp: string;
  fileTypes: string[];
  frameworks: string[];
  languages: string[];
  complexity: 'simple' | 'medium' | 'complex';
}

export interface PatternMetadata {
  confidence: number;
  reusability: number;
  effectiveness: number;
  frequency: number;
  projectType?: string;
  relatedFiles: string[];
}

export interface CodeExample {
  before?: string;
  after: string;
  explanation: string;
  filePath: string;
  lineRange?: { start: number; end: number };
}

export interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  language: string;
  additions: number;
  deletions: number;
  diff: string;
}

export interface SessionAnalysis {
  sessionMetrics: SessionMetrics;
  fileChanges: FileChange[];
  patterns: ExtractedPattern[];
  insights: string[];
  recommendations: string[];
}

export class SessionPatternExtractor {
  private logger: VERSATILLogger;
  private workingDir: string;

  constructor(workingDir: string = process.cwd()) {
    this.logger = new VERSATILLogger();
    this.workingDir = workingDir;
  }

  /**
   * Extract patterns from a completed session
   */
  async extractFromSession(sessionId: string): Promise<SessionAnalysis> {
    this.logger.info('Starting pattern extraction', { sessionId }, 'session-pattern-extractor');

    try {
      // 1. Load session metrics
      const sessionMetrics = await this.loadSessionMetrics(sessionId);

      // 2. Analyze git changes since session start
      const fileChanges = await this.analyzeGitChanges(sessionMetrics.timestamp);

      // 3. Extract patterns from changes
      const patterns = await this.extractPatterns(fileChanges, sessionMetrics);

      // 4. Generate insights
      const insights = this.generateInsights(fileChanges, patterns);

      // 5. Generate recommendations
      const recommendations = this.generateRecommendations(patterns, sessionMetrics);

      const analysis: SessionAnalysis = {
        sessionMetrics,
        fileChanges,
        patterns,
        insights,
        recommendations
      };

      this.logger.info('Pattern extraction complete', {
        sessionId,
        patternsFound: patterns.length,
        filesChanged: fileChanges.length
      }, 'session-pattern-extractor');

      return analysis;
    } catch (error) {
      this.logger.error('Pattern extraction failed', { sessionId, error }, 'session-pattern-extractor');
      throw error;
    }
  }

  /**
   * Load session metrics from log file
   */
  private async loadSessionMetrics(sessionId: string): Promise<SessionMetrics> {
    const sessionFile = join(process.env.HOME!, '.versatil', 'learning', `session-${sessionId}.json`);

    try {
      const content = await fs.readFile(sessionFile, 'utf-8');
      const data = JSON.parse(content);

      return {
        sessionId: data.session_id,
        agent: data.agent,
        duration: data.duration,
        timestamp: data.timestamp,
        actions: Array.isArray(data.actions) ? data.actions : [],
        filesChanged: [],
        linesAdded: 0,
        linesRemoved: 0
      };
    } catch (error) {
      this.logger.warn('Could not load session metrics', { sessionId, error }, 'session-pattern-extractor');

      // Return default metrics
      return {
        sessionId,
        agent: 'unknown',
        duration: 0,
        timestamp: new Date().toISOString(),
        actions: [],
        filesChanged: [],
        linesAdded: 0,
        linesRemoved: 0
      };
    }
  }

  /**
   * Analyze git changes since session start
   */
  private async analyzeGitChanges(since: string): Promise<FileChange[]> {
    try {
      // Get changed files since timestamp
      const sinceDate = new Date(since);
      const gitLogCommand = `git log --since="${sinceDate.toISOString()}" --name-status --pretty=format:`;

      let output: string;
      try {
        output = execSync(gitLogCommand, {
          cwd: this.workingDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
      } catch (error) {
        // No git repo or no changes
        return [];
      }

      if (!output.trim()) {
        return [];
      }

      const fileChanges: FileChange[] = [];
      const lines = output.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const [status, ...pathParts] = line.split('\t');
        const path = pathParts.join('\t');

        if (!path || this.shouldIgnoreFile(path)) {
          continue;
        }

        const language = this.detectLanguage(path);
        const diff = await this.getFileDiff(path);
        const { additions, deletions } = this.countDiffLines(diff);

        let changeType: 'added' | 'modified' | 'deleted' = 'modified';
        if (status === 'A') changeType = 'added';
        else if (status === 'D') changeType = 'deleted';

        fileChanges.push({
          path,
          type: changeType,
          language,
          additions,
          deletions,
          diff
        });
      }

      return fileChanges;
    } catch (error) {
      this.logger.error('Failed to analyze git changes', { error }, 'session-pattern-extractor');
      return [];
    }
  }

  /**
   * Extract patterns from file changes
   */
  private async extractPatterns(
    fileChanges: FileChange[],
    sessionMetrics: SessionMetrics
  ): Promise<ExtractedPattern[]> {
    const patterns: ExtractedPattern[] = [];

    // Extract code patterns
    patterns.push(...await this.extractCodePatterns(fileChanges, sessionMetrics));

    // Extract test patterns
    patterns.push(...await this.extractTestPatterns(fileChanges, sessionMetrics));

    // Extract API patterns
    patterns.push(...await this.extractAPIPatterns(fileChanges, sessionMetrics));

    // Extract database patterns
    patterns.push(...await this.extractDatabasePatterns(fileChanges, sessionMetrics));

    // Extract performance patterns
    patterns.push(...await this.extractPerformancePatterns(fileChanges, sessionMetrics));

    // Extract debugging patterns
    patterns.push(...await this.extractDebuggingPatterns(fileChanges, sessionMetrics));

    return patterns;
  }

  /**
   * Extract code patterns (repeated structures, common solutions)
   */
  private async extractCodePatterns(
    fileChanges: FileChange[],
    sessionMetrics: SessionMetrics
  ): Promise<ExtractedPattern[]> {
    const patterns: ExtractedPattern[] = [];

    for (const change of fileChanges) {
      // Look for common patterns in added code
      const addedLines = this.extractAddedLines(change.diff);

      // Pattern: React component creation
      if (this.isReactComponent(addedLines, change.language)) {
        patterns.push({
          id: this.generatePatternId('react-component', change.path),
          type: PatternType.CODE,
          category: PatternCategory.FEATURE,
          title: 'React Component Pattern',
          description: 'React component structure with hooks and TypeScript',
          code: addedLines,
          context: this.buildContext(change, sessionMetrics),
          metadata: {
            confidence: 0.85,
            reusability: 0.9,
            effectiveness: 0.8,
            frequency: 1,
            relatedFiles: [change.path]
          },
          examples: [{
            after: addedLines,
            explanation: 'React component with TypeScript and hooks',
            filePath: change.path
          }],
          tags: ['react', 'typescript', 'component', 'frontend', change.language]
        });
      }

      // Pattern: API endpoint creation
      if (this.isAPIEndpoint(addedLines, change.language)) {
        patterns.push({
          id: this.generatePatternId('api-endpoint', change.path),
          type: PatternType.API_DESIGN,
          category: PatternCategory.FEATURE,
          title: 'API Endpoint Pattern',
          description: 'RESTful API endpoint with validation and error handling',
          code: addedLines,
          context: this.buildContext(change, sessionMetrics),
          metadata: {
            confidence: 0.8,
            reusability: 0.85,
            effectiveness: 0.8,
            frequency: 1,
            relatedFiles: [change.path]
          },
          examples: [{
            after: addedLines,
            explanation: 'API endpoint with proper error handling',
            filePath: change.path
          }],
          tags: ['api', 'backend', 'endpoint', change.language]
        });
      }

      // Pattern: Error handling
      if (this.hasErrorHandling(addedLines)) {
        patterns.push({
          id: this.generatePatternId('error-handling', change.path),
          type: PatternType.CODE,
          category: PatternCategory.SOLUTION,
          title: 'Error Handling Pattern',
          description: 'Comprehensive error handling with try-catch and logging',
          code: this.extractErrorHandlingCode(addedLines),
          context: this.buildContext(change, sessionMetrics),
          metadata: {
            confidence: 0.9,
            reusability: 0.95,
            effectiveness: 0.85,
            frequency: 1,
            relatedFiles: [change.path]
          },
          examples: [{
            after: this.extractErrorHandlingCode(addedLines),
            explanation: 'Error handling with proper logging and recovery',
            filePath: change.path
          }],
          tags: ['error-handling', 'reliability', change.language]
        });
      }
    }

    return patterns;
  }

  /**
   * Extract test patterns
   */
  private async extractTestPatterns(
    fileChanges: FileChange[],
    sessionMetrics: SessionMetrics
  ): Promise<ExtractedPattern[]> {
    const patterns: ExtractedPattern[] = [];

    for (const change of fileChanges) {
      if (!this.isTestFile(change.path)) {
        continue;
      }

      const addedLines = this.extractAddedLines(change.diff);

      // Pattern: Unit test structure
      if (addedLines.includes('describe(') && addedLines.includes('it(')) {
        patterns.push({
          id: this.generatePatternId('unit-test', change.path),
          type: PatternType.TESTING,
          category: PatternCategory.TEST,
          title: 'Unit Test Pattern',
          description: 'Well-structured unit test with setup and assertions',
          code: addedLines,
          context: this.buildContext(change, sessionMetrics),
          metadata: {
            confidence: 0.85,
            reusability: 0.9,
            effectiveness: 0.85,
            frequency: 1,
            relatedFiles: [change.path]
          },
          examples: [{
            after: addedLines,
            explanation: 'Unit test with describe/it structure',
            filePath: change.path
          }],
          tags: ['testing', 'unit-test', 'jest', change.language]
        });
      }
    }

    return patterns;
  }

  /**
   * Extract API design patterns
   */
  private async extractAPIPatterns(
    fileChanges: FileChange[],
    sessionMetrics: SessionMetrics
  ): Promise<ExtractedPattern[]> {
    const patterns: ExtractedPattern[] = [];

    for (const change of fileChanges) {
      const addedLines = this.extractAddedLines(change.diff);

      // Pattern: REST API with validation
      if (this.hasValidation(addedLines) && this.isAPIEndpoint(addedLines, change.language)) {
        patterns.push({
          id: this.generatePatternId('api-validation', change.path),
          type: PatternType.API_DESIGN,
          category: PatternCategory.SOLUTION,
          title: 'API Validation Pattern',
          description: 'API endpoint with input validation and schema checking',
          code: this.extractValidationCode(addedLines),
          context: this.buildContext(change, sessionMetrics),
          metadata: {
            confidence: 0.85,
            reusability: 0.9,
            effectiveness: 0.9,
            frequency: 1,
            relatedFiles: [change.path]
          },
          examples: [{
            after: this.extractValidationCode(addedLines),
            explanation: 'API validation with schema checking',
            filePath: change.path
          }],
          tags: ['api', 'validation', 'backend', change.language]
        });
      }
    }

    return patterns;
  }

  /**
   * Extract database patterns
   */
  private async extractDatabasePatterns(
    fileChanges: FileChange[],
    sessionMetrics: SessionMetrics
  ): Promise<ExtractedPattern[]> {
    const patterns: ExtractedPattern[] = [];

    for (const change of fileChanges) {
      if (!this.isDatabaseFile(change.path)) {
        continue;
      }

      const addedLines = this.extractAddedLines(change.diff);

      // Pattern: Database migration
      if (addedLines.includes('CREATE TABLE') || addedLines.includes('ALTER TABLE')) {
        patterns.push({
          id: this.generatePatternId('db-migration', change.path),
          type: PatternType.DATABASE,
          category: PatternCategory.FEATURE,
          title: 'Database Migration Pattern',
          description: 'Database schema change with proper constraints',
          code: addedLines,
          context: this.buildContext(change, sessionMetrics),
          metadata: {
            confidence: 0.9,
            reusability: 0.8,
            effectiveness: 0.85,
            frequency: 1,
            relatedFiles: [change.path]
          },
          examples: [{
            after: addedLines,
            explanation: 'Database migration with constraints and indexes',
            filePath: change.path
          }],
          tags: ['database', 'migration', 'schema', 'sql']
        });
      }
    }

    return patterns;
  }

  /**
   * Extract performance optimization patterns
   */
  private async extractPerformancePatterns(
    fileChanges: FileChange[],
    sessionMetrics: SessionMetrics
  ): Promise<ExtractedPattern[]> {
    const patterns: ExtractedPattern[] = [];

    for (const change of fileChanges) {
      const diff = change.diff;

      // Pattern: Memoization added
      if (diff.includes('+') && (diff.includes('useMemo') || diff.includes('useCallback'))) {
        patterns.push({
          id: this.generatePatternId('memoization', change.path),
          type: PatternType.PERFORMANCE,
          category: PatternCategory.OPTIMIZATION,
          title: 'React Memoization Pattern',
          description: 'Performance optimization using React memoization hooks',
          code: this.extractMemoizationCode(diff),
          context: this.buildContext(change, sessionMetrics),
          metadata: {
            confidence: 0.85,
            reusability: 0.9,
            effectiveness: 0.8,
            frequency: 1,
            relatedFiles: [change.path]
          },
          examples: [{
            after: this.extractMemoizationCode(diff),
            explanation: 'Memoization to prevent unnecessary re-renders',
            filePath: change.path
          }],
          tags: ['performance', 'react', 'memoization', 'optimization']
        });
      }
    }

    return patterns;
  }

  /**
   * Extract debugging patterns (error → fix mappings)
   */
  private async extractDebuggingPatterns(
    fileChanges: FileChange[],
    sessionMetrics: SessionMetrics
  ): Promise<ExtractedPattern[]> {
    const patterns: ExtractedPattern[] = [];

    for (const change of fileChanges) {
      const diff = change.diff;
      const removedLines = this.extractRemovedLines(diff);
      const addedLines = this.extractAddedLines(diff);

      // Pattern: Bug fix (removed problematic code, added fix)
      if (removedLines && addedLines && this.looksLikeBugFix(removedLines, addedLines)) {
        patterns.push({
          id: this.generatePatternId('bug-fix', change.path),
          type: PatternType.DEBUGGING,
          category: PatternCategory.BUG_FIX,
          title: 'Bug Fix Pattern',
          description: 'Common bug pattern and its solution',
          context: this.buildContext(change, sessionMetrics),
          metadata: {
            confidence: 0.8,
            reusability: 0.85,
            effectiveness: 0.9,
            frequency: 1,
            relatedFiles: [change.path]
          },
          examples: [{
            before: removedLines,
            after: addedLines,
            explanation: 'Bug fix: replaced problematic code with correct implementation',
            filePath: change.path
          }],
          tags: ['debugging', 'bug-fix', change.language]
        });
      }
    }

    return patterns;
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(fileChanges: FileChange[], patterns: ExtractedPattern[]): string[] {
    const insights: string[] = [];

    // Language distribution
    const languages = new Set(fileChanges.map(fc => fc.language));
    insights.push(`Worked with ${languages.size} programming language(s): ${Array.from(languages).join(', ')}`);

    // Pattern types
    const patternTypes = new Map<PatternType, number>();
    patterns.forEach(p => {
      patternTypes.set(p.type, (patternTypes.get(p.type) || 0) + 1);
    });

    if (patternTypes.size > 0) {
      const topPattern = Array.from(patternTypes.entries())
        .sort((a, b) => b[1] - a[1])[0];
      insights.push(`Most common pattern type: ${topPattern[0]} (${topPattern[1]} patterns)`);
    }

    // Code churn
    const totalAdditions = fileChanges.reduce((sum, fc) => sum + fc.additions, 0);
    const totalDeletions = fileChanges.reduce((sum, fc) => sum + fc.deletions, 0);
    insights.push(`Code changes: +${totalAdditions} -${totalDeletions} lines across ${fileChanges.length} file(s)`);

    return insights;
  }

  /**
   * Generate recommendations for future sessions
   */
  private generateRecommendations(
    patterns: ExtractedPattern[],
    sessionMetrics: SessionMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Test patterns
    const testPatterns = patterns.filter(p => p.type === PatternType.TESTING);
    if (testPatterns.length === 0) {
      recommendations.push('Consider adding tests for the changes made');
    }

    // Error handling
    const errorHandlingPatterns = patterns.filter(p =>
      p.tags.includes('error-handling')
    );
    if (errorHandlingPatterns.length === 0 && patterns.length > 0) {
      recommendations.push('Consider adding error handling to new code');
    }

    // Performance
    const performancePatterns = patterns.filter(p => p.type === PatternType.PERFORMANCE);
    if (performancePatterns.length > 0) {
      recommendations.push('Performance optimizations detected - consider documenting the improvements');
    }

    return recommendations;
  }

  // Helper methods

  private generatePatternId(type: string, filePath: string): string {
    return `${type}-${Date.now()}-${this.hashString(filePath)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private buildContext(change: FileChange, sessionMetrics: SessionMetrics): PatternContext {
    return {
      agent: sessionMetrics.agent,
      sessionId: sessionMetrics.sessionId,
      timestamp: sessionMetrics.timestamp,
      fileTypes: [change.language],
      frameworks: this.detectFrameworks(change.path),
      languages: [change.language],
      complexity: this.estimateComplexity(change)
    };
  }

  private shouldIgnoreFile(path: string): boolean {
    const ignorePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.next/,
      /coverage/,
      /\.cache/,
      /package-lock\.json/,
      /yarn\.lock/
    ];

    return ignorePatterns.some(pattern => pattern.test(path));
  }

  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'rb': 'ruby',
      'php': 'php',
      'sql': 'sql',
      'sh': 'shell',
      'md': 'markdown',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml'
    };

    return langMap[ext || ''] || 'unknown';
  }

  private detectFrameworks(path: string): string[] {
    const frameworks: string[] = [];

    if (path.includes('react') || path.includes('.tsx') || path.includes('.jsx')) {
      frameworks.push('react');
    }
    if (path.includes('next')) {
      frameworks.push('nextjs');
    }
    if (path.includes('vue')) {
      frameworks.push('vue');
    }
    if (path.includes('express')) {
      frameworks.push('express');
    }

    return frameworks;
  }

  private async getFileDiff(path: string): Promise<string> {
    try {
      return execSync(`git diff HEAD~1 HEAD -- "${path}"`, {
        cwd: this.workingDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
    } catch {
      return '';
    }
  }

  private countDiffLines(diff: string): { additions: number; deletions: number } {
    const lines = diff.split('\n');
    let additions = 0;
    let deletions = 0;

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
      }
    }

    return { additions, deletions };
  }

  private extractAddedLines(diff: string): string {
    return diff
      .split('\n')
      .filter(line => line.startsWith('+') && !line.startsWith('+++'))
      .map(line => line.substring(1))
      .join('\n');
  }

  private extractRemovedLines(diff: string): string {
    return diff
      .split('\n')
      .filter(line => line.startsWith('-') && !line.startsWith('---'))
      .map(line => line.substring(1))
      .join('\n');
  }

  private isReactComponent(code: string, language: string): boolean {
    return (language === 'typescript' || language === 'javascript') &&
      (code.includes('function ') || code.includes('const ')) &&
      (code.includes('return (') || code.includes('return <')) &&
      (code.includes('React') || code.includes('jsx') || code.includes('tsx'));
  }

  private isAPIEndpoint(code: string, language: string): boolean {
    return (
      code.includes('router.') ||
      code.includes('app.get(') ||
      code.includes('app.post(') ||
      code.includes('async def ') ||
      code.includes('@app.route')
    );
  }

  private hasErrorHandling(code: string): boolean {
    return code.includes('try') && code.includes('catch');
  }

  private hasValidation(code: string): boolean {
    return code.includes('validate') ||
      code.includes('schema') ||
      code.includes('zod') ||
      code.includes('joi');
  }

  private isTestFile(path: string): boolean {
    return path.includes('.test.') ||
      path.includes('.spec.') ||
      path.includes('__tests__');
  }

  private isDatabaseFile(path: string): boolean {
    return path.includes('.sql') ||
      path.includes('migration') ||
      path.includes('schema');
  }

  private looksLikeBugFix(removed: string, added: string): boolean {
    // Simple heuristic: if removed and added are similar but different
    return removed.length > 10 &&
      added.length > 10 &&
      removed !== added &&
      this.similarity(removed, added) > 0.5;
  }

  private similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  private extractErrorHandlingCode(code: string): string {
    const lines = code.split('\n');
    const result: string[] = [];
    let inTryCatch = false;

    for (const line of lines) {
      if (line.includes('try')) {
        inTryCatch = true;
      }
      if (inTryCatch) {
        result.push(line);
      }
      if (line.includes('}') && inTryCatch) {
        inTryCatch = false;
      }
    }

    return result.join('\n');
  }

  private extractValidationCode(code: string): string {
    const lines = code.split('\n');
    return lines
      .filter(line =>
        line.includes('validate') ||
        line.includes('schema') ||
        line.includes('zod') ||
        line.includes('joi')
      )
      .join('\n');
  }

  private extractMemoizationCode(diff: string): string {
    const lines = diff.split('\n');
    return lines
      .filter(line =>
        line.startsWith('+') &&
        (line.includes('useMemo') || line.includes('useCallback'))
      )
      .map(line => line.substring(1))
      .join('\n');
  }

  private estimateComplexity(change: FileChange): 'simple' | 'medium' | 'complex' {
    const totalLines = change.additions + change.deletions;

    if (totalLines < 50) return 'simple';
    if (totalLines < 200) return 'medium';
    return 'complex';
  }
}

export default SessionPatternExtractor;
