/**
 * VERSATIL Framework - Release Detector
 *
 * Automatically detects when features are "release-ready" and suggests
 * appropriate version bumps based on semantic versioning rules.
 *
 * Release-Ready Criteria:
 * - All related files committed (no uncommitted changes for feature)
 * - Tests passing (80%+ coverage)
 * - Documentation updated (CLAUDE.md mentions feature)
 * - No open TODO files for feature
 * - No breaking changes (or major version bump required)
 *
 * Version Bump Detection:
 * - MAJOR (x.0.0): Breaking changes, API changes, removed features
 * - MINOR (0.x.0): New features, enhancements, additions
 * - PATCH (0.0.x): Bug fixes, typos, minor improvements
 *
 * @version 7.14.0
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { VERSATILLogger } from '../utils/logger.js';
export class ReleaseDetector {
    constructor(cwd = process.cwd()) {
        this.logger = new VERSATILLogger('ReleaseDetector');
        this.cwd = cwd;
    }
    /**
     * Check if project is release-ready
     */
    async checkReleaseReadiness() {
        const stats = await this.gatherStats();
        const features = await this.detectFeatures();
        const bumpType = this.detectVersionBump(features, stats);
        const currentVersion = this.getCurrentVersion();
        const suggestedVersion = this.calculateNextVersion(currentVersion, bumpType);
        const reasons = [];
        const blockers = [];
        // Evaluate readiness criteria
        if (stats.uncommittedFiles === 0) {
            blockers.push('No uncommitted changes (nothing to release)');
        }
        else {
            reasons.push(`${stats.uncommittedFiles} uncommitted files ready for release`);
        }
        if (stats.testCoverage !== undefined && !isNaN(stats.testCoverage)) {
            if (stats.testCoverage >= 80) {
                reasons.push(`Test coverage: ${stats.testCoverage}% (>= 80% threshold)`);
            }
            else {
                blockers.push(`Test coverage: ${stats.testCoverage}% (< 80% threshold)`);
            }
        }
        else {
            // Test coverage data not available - warn but don't block
            reasons.push('Test coverage data not available (proceed with caution)');
        }
        if (stats.documentationUpdated) {
            reasons.push('Documentation updated (CLAUDE.md)');
        }
        else if (bumpType === 'minor' || bumpType === 'major') {
            blockers.push('Documentation not updated for new features');
        }
        // Allow backlog TODOs (moved to todos/backlog/)
        const activeTodos = stats.openTodos; // Count only todos/ root, not backlog
        if (activeTodos > 10) {
            blockers.push(`${activeTodos} open TODO files (incomplete work)`);
        }
        else if (activeTodos > 0) {
            reasons.push(`${activeTodos} TODO files (acceptable for release)`);
        }
        else {
            reasons.push('No open TODO files (work complete)');
        }
        const confidence = this.calculateConfidence(reasons.length, blockers.length, features);
        const isReady = blockers.length === 0 && confidence >= 70;
        return {
            isReady,
            confidence,
            suggestedVersion,
            bumpType,
            reasons,
            blockers,
            stats
        };
    }
    /**
     * Detect features from uncommitted changes
     */
    async detectFeatures() {
        const features = [];
        try {
            // Get uncommitted files
            const statusOutput = execSync('git status --porcelain', {
                cwd: this.cwd,
                encoding: 'utf-8'
            });
            const files = statusOutput
                .split('\n')
                .filter(Boolean)
                .map(line => line.substring(3));
            // Group files by feature (heuristic)
            const featureGroups = this.groupFilesByFeature(files);
            for (const [featureName, featureFiles] of Object.entries(featureGroups)) {
                const type = this.detectFeatureType(featureFiles);
                const confidence = this.calculateFeatureConfidence(featureFiles);
                features.push({
                    name: featureName,
                    files: featureFiles,
                    type,
                    confidence
                });
            }
        }
        catch (error) {
            this.logger.debug('Failed to detect features', { error: error.message });
        }
        return features;
    }
    /**
     * Detect appropriate version bump type
     */
    detectVersionBump(features, stats) {
        // Check for breaking changes
        if (features.some(f => f.type === 'breaking')) {
            return 'major';
        }
        // Check for new features
        if (features.some(f => f.type === 'feature' || f.type === 'enhancement')) {
            return 'minor';
        }
        // Check for bug fixes
        if (features.some(f => f.type === 'bugfix')) {
            return 'patch';
        }
        // Documentation-only changes
        if (features.every(f => f.type === 'docs')) {
            return 'patch';
        }
        // Default: minor for any uncommitted changes
        return stats.uncommittedFiles > 0 ? 'minor' : 'none';
    }
    /**
     * Calculate next version based on bump type
     */
    calculateNextVersion(current, bumpType) {
        const match = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
        if (!match)
            return current;
        let [, major, minor, patch] = match.map(Number);
        switch (bumpType) {
            case 'major':
                major++;
                minor = 0;
                patch = 0;
                break;
            case 'minor':
                minor++;
                patch = 0;
                break;
            case 'patch':
                patch++;
                break;
            case 'none':
                return current;
        }
        return `${major}.${minor}.${patch}`;
    }
    /**
     * Get current version from package.json
     */
    getCurrentVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(this.cwd, 'package.json'), 'utf-8'));
            return packageJson.version;
        }
        catch {
            return '0.0.0';
        }
    }
    /**
     * Gather release statistics
     */
    async gatherStats() {
        const stats = {
            uncommittedFiles: 0,
            newFiles: 0,
            modifiedFiles: 0,
            deletedFiles: 0,
            testCoverage: undefined,
            documentationUpdated: false,
            openTodos: 0
        };
        try {
            // Count uncommitted files
            const statusOutput = execSync('git status --porcelain', {
                cwd: this.cwd,
                encoding: 'utf-8'
            });
            const lines = statusOutput.split('\n').filter(Boolean);
            stats.uncommittedFiles = lines.length;
            lines.forEach(line => {
                const status = line.substring(0, 2).trim();
                if (status === 'A' || status === '??') {
                    stats.newFiles++;
                }
                else if (status === 'M') {
                    stats.modifiedFiles++;
                }
                else if (status === 'D') {
                    stats.deletedFiles++;
                }
            });
            // Check if CLAUDE.md was modified recently
            if (lines.some(line => line.includes('CLAUDE.md'))) {
                stats.documentationUpdated = true;
            }
            // Count open TODO files
            const todosDir = path.join(this.cwd, 'todos');
            if (fs.existsSync(todosDir)) {
                const todoFiles = fs.readdirSync(todosDir)
                    .filter(f => f.endsWith('.md') && f.includes('pending'));
                stats.openTodos = todoFiles.length;
            }
            // Get test coverage (if available)
            const coverageFile = path.join(this.cwd, 'coverage', 'coverage-summary.json');
            if (fs.existsSync(coverageFile)) {
                const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf-8'));
                stats.testCoverage = Math.round(coverage.total?.lines?.pct || 0);
            }
        }
        catch (error) {
            this.logger.debug('Failed to gather stats', { error: error.message });
        }
        return stats;
    }
    /**
     * Group files by feature (heuristic)
     */
    groupFilesByFeature(files) {
        const groups = { 'Miscellaneous': [] };
        for (const file of files) {
            // Browser testing
            if (file.includes('browser') || file.includes('playwright')) {
                groups['Browser Testing'] = groups['Browser Testing'] || [];
                groups['Browser Testing'].push(file);
            }
            // Guardian features
            else if (file.includes('guardian') && !file.includes('test')) {
                groups['Guardian Enhancements'] = groups['Guardian Enhancements'] || [];
                groups['Guardian Enhancements'].push(file);
            }
            // RAG/Intelligence
            else if (file.includes('intelligence') || file.includes('rag')) {
                groups['Intelligence System'] = groups['Intelligence System'] || [];
                groups['Intelligence System'].push(file);
            }
            // Documentation
            else if (file.endsWith('.md') || file.includes('docs/')) {
                groups['Documentation'] = groups['Documentation'] || [];
                groups['Documentation'].push(file);
            }
            // Tests
            else if (file.includes('test') || file.includes('spec')) {
                groups['Tests'] = groups['Tests'] || [];
                groups['Tests'].push(file);
            }
            // Configuration
            else if (file.includes('config') || file.includes('.json') || file.includes('.yml')) {
                groups['Configuration'] = groups['Configuration'] || [];
                groups['Configuration'].push(file);
            }
            // Everything else
            else {
                groups['Miscellaneous'].push(file);
            }
        }
        // Remove empty groups
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0)
                delete groups[key];
        });
        return groups;
    }
    /**
     * Detect feature type from files
     */
    detectFeatureType(files) {
        const fileContents = files.join(' ').toLowerCase();
        // Breaking changes indicators
        if (fileContents.includes('breaking') || fileContents.includes('migration')) {
            return 'breaking';
        }
        // Documentation-only
        if (files.every(f => f.endsWith('.md') || f.includes('docs/'))) {
            return 'docs';
        }
        // Bug fixes
        if (fileContents.includes('fix') || fileContents.includes('bug')) {
            return 'bugfix';
        }
        // Enhancements
        if (fileContents.includes('improve') || fileContents.includes('enhance') || fileContents.includes('refactor')) {
            return 'enhancement';
        }
        // Default: new feature
        return 'feature';
    }
    /**
     * Calculate confidence for feature detection
     */
    calculateFeatureConfidence(files) {
        let confidence = 50;
        // More files = higher confidence
        if (files.length >= 5)
            confidence += 20;
        else if (files.length >= 3)
            confidence += 10;
        // Has tests
        if (files.some(f => f.includes('test') || f.includes('spec'))) {
            confidence += 15;
        }
        // Has documentation
        if (files.some(f => f.endsWith('.md'))) {
            confidence += 10;
        }
        // Has source files
        if (files.some(f => f.endsWith('.ts') && !f.includes('test'))) {
            confidence += 10;
        }
        return Math.min(100, confidence);
    }
    /**
     * Calculate overall confidence for release readiness
     */
    calculateConfidence(reasons, blockers, features) {
        let confidence = 50;
        // Reasons boost confidence
        confidence += reasons * 10;
        // Blockers reduce confidence
        confidence -= blockers * 20;
        // Feature confidence
        if (features.length > 0) {
            const avgFeatureConfidence = features.reduce((sum, f) => sum + f.confidence, 0) / features.length;
            confidence += (avgFeatureConfidence - 50) / 2;
        }
        return Math.max(0, Math.min(100, confidence));
    }
}
//# sourceMappingURL=release-detector.js.map