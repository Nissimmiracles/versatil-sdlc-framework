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
import { VERSATILLogger } from '../utils/logger.js';
const execAsync = promisify(exec);
export class SessionAnalyzer {
    constructor(projectPath = process.cwd()) {
        this.logger = new VERSATILLogger();
        this.projectPath = projectPath;
    }
    /**
     * Main entry point: Analyze completed session
     */
    async analyzeSession(sessionSummary) {
        this.logger.info('Starting session analysis', {
            sessionId: sessionSummary.date,
            duration: sessionSummary.duration
        }, 'session-analyzer');
        try {
            const [codeChanges, agentPerformance, effortAnalysis, qualityMetrics, patterns, metadata] = await Promise.all([
                this.analyzeCodeChanges(),
                this.analyzeAgentPerformance(sessionSummary),
                this.analyzeEffortAccuracy(sessionSummary),
                this.analyzeQualityMetrics(sessionSummary),
                this.identifyPatterns(sessionSummary),
                this.extractMetadata()
            ]);
            const analysis = {
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
        }
        catch (error) {
            this.logger.error('Session analysis failed', { error }, 'session-analyzer');
            throw error;
        }
    }
    /**
     * Analyze code changes from git diff
     */
    async analyzeCodeChanges() {
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
            const changes = [];
            const lines = statusOut.trim().split('\n');
            for (const line of lines) {
                if (!line.trim())
                    continue;
                const status = line.substring(0, 2);
                const file = line.substring(3);
                // Skip deleted files
                if (status.includes('D'))
                    continue;
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
                }
                catch (error) {
                    // Skip files that can't be analyzed
                    continue;
                }
            }
            return changes;
        }
        catch (error) {
            this.logger.warn('Failed to analyze code changes', { error }, 'session-analyzer');
            return [];
        }
    }
    /**
     * Analyze last commit if no uncommitted changes
     */
    async analyzeLastCommit() {
        try {
            const { stdout: diffOut } = await execAsync('git diff HEAD~1 HEAD --numstat', {
                cwd: this.projectPath
            });
            const changes = [];
            const lines = diffOut.trim().split('\n');
            for (const line of lines) {
                if (!line.trim())
                    continue;
                const [additions, deletions, file] = line.split('\t');
                // Skip binary files
                if (additions === '-' || deletions === '-')
                    continue;
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
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Safely read file content
     */
    async readFileSafely(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
            return '';
        }
    }
    /**
     * Detect programming language from file extension
     */
    detectLanguage(file) {
        const ext = path.extname(file).toLowerCase();
        const languageMap = {
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
    categorizeFileType(file) {
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
    async analyzeAgentPerformance(summary) {
        const performance = [];
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
    calculateEffectiveness(timeSaved, activations) {
        const avgTimeSaved = timeSaved / activations;
        if (avgTimeSaved > 30)
            return 'high'; // >30 min per activation
        if (avgTimeSaved > 15)
            return 'medium'; // 15-30 min
        return 'low'; // <15 min
    }
    /**
     * Analyze effort estimation accuracy
     */
    async analyzeEffortAccuracy(summary) {
        // TODO: Integrate with TodoWrite to get estimated vs actual time
        // For now, use heuristics based on session data
        const actualMinutes = (summary.duration || 0) / 60000;
        const estimatedMinutes = actualMinutes - summary.totalTimeSaved; // Reverse calculate
        const variance = actualMinutes - estimatedMinutes;
        const accuracy = estimatedMinutes > 0
            ? Math.max(0, 100 - Math.abs(variance / estimatedMinutes) * 100)
            : 0;
        let trend = 'accurate';
        if (variance > actualMinutes * 0.2)
            trend = 'underestimated';
        if (variance < -actualMinutes * 0.2)
            trend = 'overestimated';
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
    async analyzeQualityMetrics(summary) {
        const qualityMetrics = {
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
        }
        catch (error) {
            // Coverage not available
        }
        return qualityMetrics;
    }
    /**
     * Identify successful patterns and areas for improvement
     */
    async identifyPatterns(summary) {
        const successful = [];
        const needsImprovement = [];
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
            }
            else if (breakdown.successRate < 0.7) {
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
    async extractMetadata() {
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
        }
        catch (error) {
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
    async getCurrentBranch() {
        try {
            const { stdout } = await execAsync('git branch --show-current', {
                cwd: this.projectPath
            });
            return stdout.trim() || 'main';
        }
        catch (error) {
            return 'unknown';
        }
    }
    /**
     * Get number of commits created in this session
     */
    async getRecentCommits() {
        try {
            // Count commits in last 4 hours (typical session length)
            const { stdout } = await execAsync('git log --since="4 hours ago" --oneline | wc -l', { cwd: this.projectPath });
            return parseInt(stdout.trim()) || 0;
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Get git statistics
     */
    async getGitStats() {
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
        }
        catch (error) {
            return { filesModified: 0, linesAdded: 0, linesDeleted: 0 };
        }
    }
}
/**
 * Factory function for SessionAnalyzer
 */
export function createSessionAnalyzer(projectPath) {
    return new SessionAnalyzer(projectPath);
}
//# sourceMappingURL=session-analyzer.js.map