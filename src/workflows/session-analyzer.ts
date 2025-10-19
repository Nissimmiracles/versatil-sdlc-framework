/**
 * VERSATIL Session Analyzer
 *
 * Analyzes completed sessions to extract learnings for RAG storage.
 * Part of the stop hook learning codification workflow.
 *
 * Responsibilities:
 * - Analyze session metrics and outcomes
 * - Extract code patterns from git diff
 * - Identify agent performance patterns
 * - Calculate effort estimation accuracy
 * - Detect successful patterns and anti-patterns
 *
 * Integration: Called by stop hook at session end
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SessionSummary } from '../tracking/session-manager.js';
import { VERSATILLogger } from '../utils/logger.js';

const execAsync = promisify(exec);

export interface CodeChange {
  file: string;
  additions: number;
  deletions: number;
  language: string;
  type: 'component' | 'test' | 'api' | 'config' | 'documentation' | 'other';
  content: string;
}

export interface AgentPerformance {
  agentId: string;
  activations: number;
  successRate: number;
  timeSaved: number;
  averageDuration: number;
  primaryPatterns: string[];
  effectiveness: 'high' | 'medium' | 'low';
}

export interface EffortAnalysis {
  estimatedMinutes: number;
  actualMinutes: number;
  accuracy: number; // percentage
  variance: number; // actual - estimated
  trend: 'overestimated' | 'accurate' | 'underestimated';
}

export interface SessionAnalysis {
  sessionId: string;
  date: string;
  duration: number; // milliseconds
  productivity: {
    timeSaved: number; // minutes
    productivityGain: number; // percentage
    efficiency: number; // 0-100
  };
  codeChanges: CodeChange[];
  agentPerformance: AgentPerformance[];
  effortAnalysis: EffortAnalysis;
  qualityMetrics: {
    averageQuality: number;
    testCoverage?: number;
    buildSuccess: boolean;
    lintWarnings: number;
  };
  patterns: {
    successful: string[];
    needsImprovement: string[];
  };
  metadata: {
    branch: string;
    commitsCreated: number;
    filesModified: number;
    linesAdded: number;
    linesDeleted: number;
  };
}

export class SessionAnalyzer {
  private logger: VERSATILLogger;
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.logger = new VERSATILLogger();
    this.projectPath = projectPath;
  }

  /**
   * Main entry point: Analyze completed session
   */
  async analyzeSession(sessionSummary: SessionSummary): Promise<SessionAnalysis> {
    this.logger.info('Starting session analysis', {
      sessionId: sessionSummary.date,
      duration: sessionSummary.duration
    }, 'session-analyzer');

    try {
      const [
        codeChanges,
        agentPerformance,
        effortAnalysis,
        qualityMetrics,
        patterns,
        metadata
      ] = await Promise.all([
        this.analyzeCodeChanges(),
        this.analyzeAgentPerformance(sessionSummary),
        this.analyzeEffortAccuracy(sessionSummary),
        this.analyzeQualityMetrics(sessionSummary),
        this.identifyPatterns(sessionSummary),
        this.extractMetadata()
      ]);

      const analysis: SessionAnalysis = {
        sessionId: sessionSummary.date,
        date: sessionSummary.date,
        duration: sessionSummary.duration || 0,
        productivity: sessionSummary.productivity,
        codeChanges,
        agentPerformance,
        effortAnalysis,
        qualityMetrics,
        patterns,
        metadata
      };

      this.logger.info('Session analysis complete', {
        codeChanges: codeChanges.length,
        agents: agentPerformance.length,
        patterns: patterns.successful.length
      }, 'session-analyzer');

      return analysis;
    } catch (error) {
      this.logger.error('Session analysis failed', { error }, 'session-analyzer');
      throw error;
    }
  }

  /**
   * Analyze code changes from git diff
   */
  private async analyzeCodeChanges(): Promise<CodeChange[]> {
    try {
      // Get uncommitted changes
      const { stdout: statusOut } = await execAsync('git status --porcelain', {
        cwd: this.projectPath
      });

      if (!statusOut.trim()) {
        // No uncommitted changes, check last commit
        return this.analyzeLastCommit();
      }

      // Parse modified files
      const changes: CodeChange[] = [];
      const lines = statusOut.trim().split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        const status = line.substring(0, 2);
        const file = line.substring(3);

        // Skip deleted files
        if (status.includes('D')) continue;

        try {
          const diffCommand = status.includes('??')
            ? `wc -l "${file}"` // New file
            : `git diff HEAD "${file}" | wc -l`; // Modified file

          const { stdout: diffOut } = await execAsync(diffCommand, {
            cwd: this.projectPath
          });

          const lines = parseInt(diffOut.trim()) || 0;

          // Read file content for pattern analysis
          const content = await this.readFileSafely(path.join(this.projectPath, file));

          changes.push({
            file,
            additions: status.includes('A') || status.includes('??') ? lines : Math.floor(lines / 2),
            deletions: status.includes('D') ? lines : Math.floor(lines / 2),
            language: this.detectLanguage(file),
            type: this.categorizeFileType(file),
            content: content.substring(0, 5000) // Limit for analysis
          });
        } catch (error) {
          // Skip files that can't be analyzed
          continue;
        }
      }

      return changes;
    } catch (error) {
      this.logger.warn('Failed to analyze code changes', { error }, 'session-analyzer');
      return [];
    }
  }

  /**
   * Analyze last commit if no uncommitted changes
   */
  private async analyzeLastCommit(): Promise<CodeChange[]> {
    try {
      const { stdout: diffOut } = await execAsync('git diff HEAD~1 HEAD --numstat', {
        cwd: this.projectPath
      });

      const changes: CodeChange[] = [];
      const lines = diffOut.trim().split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        const [additions, deletions, file] = line.split('\t');

        // Skip binary files
        if (additions === '-' || deletions === '-') continue;

        const content = await this.readFileSafely(path.join(this.projectPath, file));

        changes.push({
          file,
          additions: parseInt(additions) || 0,
          deletions: parseInt(deletions) || 0,
          language: this.detectLanguage(file),
          type: this.categorizeFileType(file),
          content: content.substring(0, 5000)
        });
      }

      return changes;
    } catch (error) {
      return [];
    }
  }

  /**
   * Safely read file content
   */
  private async readFileSafely(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(file: string): string {
    const ext = path.extname(file).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.rb': 'ruby',
      '.go': 'go',
      '.java': 'java',
      '.rs': 'rust',
      '.sql': 'sql',
      '.md': 'markdown',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml'
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Categorize file type
   */
  private categorizeFileType(file: string): CodeChange['type'] {
    const lowerFile = file.toLowerCase();

    if (lowerFile.includes('.test.') || lowerFile.includes('.spec.') || lowerFile.includes('__tests__')) {
      return 'test';
    }
    if (lowerFile.includes('component') || lowerFile.includes('.tsx') || lowerFile.includes('.jsx')) {
      return 'component';
    }
    if (lowerFile.includes('api') || lowerFile.includes('route') || lowerFile.includes('controller')) {
      return 'api';
    }
    if (lowerFile.includes('config') || lowerFile.includes('.json') || lowerFile.includes('.yaml')) {
      return 'config';
    }
    if (lowerFile.endsWith('.md')) {
      return 'documentation';
    }

    return 'other';
  }

  /**
   * Analyze agent performance
   */
  private async analyzeAgentPerformance(summary: SessionSummary): Promise<AgentPerformance[]> {
    const performance: AgentPerformance[] = [];

    for (const [agentId, breakdown] of Object.entries(summary.agentBreakdown)) {
      const effectiveness = this.calculateEffectiveness(breakdown.timeSaved, breakdown.activations);

      performance.push({
        agentId,
        activations: breakdown.activations,
        successRate: breakdown.successRate || 1,
        timeSaved: breakdown.timeSaved,
        averageDuration: breakdown.avgDuration,
        primaryPatterns: summary.topPatterns || [],
        effectiveness
      });
    }

    // Sort by time saved (most effective first)
    return performance.sort((a, b) => b.timeSaved - a.timeSaved);
  }

  /**
   * Calculate agent effectiveness
   */
  private calculateEffectiveness(timeSaved: number, activations: number): 'high' | 'medium' | 'low' {
    const avgTimeSaved = timeSaved / activations;

    if (avgTimeSaved > 30) return 'high';    // >30 min per activation
    if (avgTimeSaved > 15) return 'medium';  // 15-30 min
    return 'low';                             // <15 min
  }

  /**
   * Analyze effort estimation accuracy
   */
  private async analyzeEffortAccuracy(summary: SessionSummary): Promise<EffortAnalysis> {
    // TODO: Integrate with TodoWrite to get estimated vs actual time
    // For now, use heuristics based on session data

    const actualMinutes = (summary.duration || 0) / 60000;
    const estimatedMinutes = actualMinutes - summary.totalTimeSaved; // Reverse calculate

    const variance = actualMinutes - estimatedMinutes;
    const accuracy = estimatedMinutes > 0
      ? Math.max(0, 100 - Math.abs(variance / estimatedMinutes) * 100)
      : 0;

    let trend: EffortAnalysis['trend'] = 'accurate';
    if (variance > actualMinutes * 0.2) trend = 'underestimated';
    if (variance < -actualMinutes * 0.2) trend = 'overestimated';

    return {
      estimatedMinutes: Math.round(estimatedMinutes),
      actualMinutes: Math.round(actualMinutes),
      accuracy: Math.round(accuracy),
      variance: Math.round(variance),
      trend
    };
  }

  /**
   * Analyze quality metrics
   */
  private async analyzeQualityMetrics(summary: SessionSummary): Promise<SessionAnalysis['qualityMetrics']> {
    const qualityMetrics: SessionAnalysis['qualityMetrics'] = {
      averageQuality: summary.averageQuality,
      buildSuccess: true,
      lintWarnings: 0
    };

    try {
      // Try to get test coverage if available
      const coveragePath = path.join(this.projectPath, 'coverage', 'coverage-summary.json');
      const coverageExists = await fs.access(coveragePath).then(() => true).catch(() => false);

      if (coverageExists) {
        const coverage = JSON.parse(await fs.readFile(coveragePath, 'utf-8'));
        qualityMetrics.testCoverage = coverage.total?.lines?.pct || 0;
      }
    } catch (error) {
      // Coverage not available
    }

    return qualityMetrics;
  }

  /**
   * Identify successful patterns and areas for improvement
   */
  private async identifyPatterns(summary: SessionSummary): Promise<{
    successful: string[];
    needsImprovement: string[];
  }> {
    const successful: string[] = [];
    const needsImprovement: string[] = [];

    // High quality patterns
    if (summary.averageQuality >= 85) {
      successful.push('High quality code generation (85%+ average)');
    }

    // High efficiency
    if (summary.productivity.efficiency >= 90) {
      successful.push('Excellent task completion efficiency (90%+)');
    }

    // Significant time savings
    if (summary.totalTimeSaved >= 60) {
      successful.push(`Substantial time savings (${summary.totalTimeSaved} minutes)`);
    }

    // Agent-specific patterns
    for (const [agentId, breakdown] of Object.entries(summary.agentBreakdown)) {
      if (breakdown.successRate >= 0.9) {
        successful.push(`${agentId}: Consistent success rate (${Math.round(breakdown.successRate * 100)}%)`);
      } else if (breakdown.successRate < 0.7) {
        needsImprovement.push(`${agentId}: Low success rate (${Math.round(breakdown.successRate * 100)}%)`);
      }
    }

    // Quality issues
    if (summary.averageQuality < 70) {
      needsImprovement.push('Quality below target (70% threshold)');
    }

    // Low efficiency
    if (summary.productivity.efficiency < 60) {
      needsImprovement.push('Task completion efficiency needs improvement');
    }

    // Add top patterns from summary
    if (summary.topPatterns) {
      successful.push(...summary.topPatterns.map(p => `Pattern: ${p}`));
    }

    return { successful, needsImprovement };
  }

  /**
   * Extract session metadata
   */
  private async extractMetadata(): Promise<SessionAnalysis['metadata']> {
    try {
      const [branch, commits, stats] = await Promise.all([
        this.getCurrentBranch(),
        this.getRecentCommits(),
        this.getGitStats()
      ]);

      return {
        branch,
        commitsCreated: commits,
        filesModified: stats.filesModified,
        linesAdded: stats.linesAdded,
        linesDeleted: stats.linesDeleted
      };
    } catch (error) {
      return {
        branch: 'unknown',
        commitsCreated: 0,
        filesModified: 0,
        linesAdded: 0,
        linesDeleted: 0
      };
    }
  }

  /**
   * Get current git branch
   */
  private async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', {
        cwd: this.projectPath
      });
      return stdout.trim() || 'main';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get number of commits created in this session
   */
  private async getRecentCommits(): Promise<number> {
    try {
      // Count commits in last 4 hours (typical session length)
      const { stdout } = await execAsync(
        'git log --since="4 hours ago" --oneline | wc -l',
        { cwd: this.projectPath }
      );
      return parseInt(stdout.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get git statistics
   */
  private async getGitStats(): Promise<{
    filesModified: number;
    linesAdded: number;
    linesDeleted: number;
  }> {
    try {
      const { stdout } = await execAsync('git diff HEAD --numstat', {
        cwd: this.projectPath
      });

      const lines = stdout.trim().split('\n').filter(l => l);
      let filesModified = 0;
      let linesAdded = 0;
      let linesDeleted = 0;

      for (const line of lines) {
        const [added, deleted] = line.split('\t');
        if (added !== '-' && deleted !== '-') {
          filesModified++;
          linesAdded += parseInt(added) || 0;
          linesDeleted += parseInt(deleted) || 0;
        }
      }

      return { filesModified, linesAdded, linesDeleted };
    } catch (error) {
      return { filesModified: 0, linesAdded: 0, linesDeleted: 0 };
    }
  }
}

/**
 * Factory function for SessionAnalyzer
 */
export function createSessionAnalyzer(projectPath?: string): SessionAnalyzer {
  return new SessionAnalyzer(projectPath);
}
