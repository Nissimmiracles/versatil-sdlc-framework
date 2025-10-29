/**
 * VERSATIL SDLC Framework - Root Cause Learning Engine
 *
 * Detects recurring issues, identifies root causes, and learns patterns
 * for future auto-remediation. Core component of Guardian's continuous
 * learning system (v7.11.0+).
 *
 * Key Features:
 * - Pattern detection (3+ occurrences in configurable timespan)
 * - Historical context querying (RAG integration)
 * - Confidence-based root cause identification
 * - Verified pattern storage for auto-remediation
 * - Correlation analysis (link related failures)
 *
 * @version 7.11.0
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GuardianLogger } from './guardian-logger.js';
import { searchGuardianLearnings } from './guardian-learning-store.js';
/**
 * Root Cause Learning Engine
 */
export class RootCauseLearner {
    constructor(config) {
        this.patternsCache = new Map();
        this.logger = GuardianLogger.getInstance();
        this.config = {
            min_occurrences: parseInt(process.env.GUARDIAN_MIN_OCCURRENCES_FOR_PATTERN || '3', 10),
            timespan_hours: parseInt(process.env.GUARDIAN_PATTERN_TIMESPAN_HOURS || '24', 10),
            min_confidence_for_pattern: 70,
            min_confidence_for_enhancement: parseInt(process.env.GUARDIAN_MIN_CONFIDENCE_FOR_ENHANCEMENT || '80', 10),
            enable_rag_lookup: true,
            ...config
        };
        const versatilHome = path.join(os.homedir(), '.versatil');
        const patternsDir = path.join(versatilHome, 'learning', 'root-causes');
        if (!fs.existsSync(patternsDir)) {
            fs.mkdirSync(patternsDir, { recursive: true });
        }
        this.patternsFile = path.join(patternsDir, 'patterns.jsonl');
        this.loadPatternsCache();
    }
    /**
     * Analyze health check history to detect recurring patterns
     */
    async analyzeHealthCheckHistory(healthHistory, currentWorkingDir) {
        const startTime = Date.now();
        this.logger.info('🔍 [Root Cause Learner] Starting pattern analysis', {
            history_size: healthHistory.length,
            timespan_hours: this.config.timespan_hours
        });
        // Step 1: Extract all issues from health check history
        const allIssues = this.extractIssuesFromHistory(healthHistory);
        // Step 2: Group issues by fingerprint (similar issues)
        const issueGroups = this.groupIssuesByFingerprint(allIssues);
        // Step 3: Detect recurring patterns (≥min_occurrences)
        const recurringPatterns = this.detectRecurringPatterns(issueGroups);
        this.logger.info(`📊 [Root Cause Learner] Detected ${recurringPatterns.length} recurring patterns`, {
            total_issues: allIssues.length,
            unique_fingerprints: issueGroups.size,
            recurring_patterns: recurringPatterns.length
        });
        // Step 4: Analyze root causes for each pattern
        const analyzedPatterns = [];
        let newPatterns = 0;
        let updatedPatterns = 0;
        for (const pattern of recurringPatterns) {
            const existingPattern = this.patternsCache.get(pattern.issue_fingerprint);
            if (existingPattern) {
                // Update existing pattern
                const updatedPattern = await this.updateExistingPattern(existingPattern, pattern);
                analyzedPatterns.push(updatedPattern);
                updatedPatterns++;
            }
            else {
                // Analyze new pattern
                const newPattern = await this.analyzeNewPattern(pattern, currentWorkingDir);
                analyzedPatterns.push(newPattern);
                newPatterns++;
            }
        }
        // Step 5: Store patterns to disk and cache
        await this.storePatterns(analyzedPatterns);
        // Step 6: Calculate statistics
        const enhancementCandidates = analyzedPatterns.filter(p => p.enhancement_candidate).length;
        const totalOccurrences = analyzedPatterns.reduce((sum, p) => sum + p.occurrences, 0);
        const confidenceAvg = analyzedPatterns.length > 0
            ? Math.round(analyzedPatterns.reduce((sum, p) => sum + p.root_cause.confidence, 0) / analyzedPatterns.length)
            : 0;
        const duration = Date.now() - startTime;
        this.logger.info(`✅ [Root Cause Learner] Analysis complete`, {
            patterns_detected: analyzedPatterns.length,
            new_patterns: newPatterns,
            updated_patterns: updatedPatterns,
            enhancement_candidates: enhancementCandidates,
            confidence_avg: confidenceAvg,
            duration_ms: duration
        });
        return {
            patterns_detected: analyzedPatterns,
            new_patterns: newPatterns,
            updated_patterns: updatedPatterns,
            enhancement_candidates: enhancementCandidates,
            total_occurrences_analyzed: totalOccurrences,
            confidence_avg: confidenceAvg
        };
    }
    /**
     * Extract all issues from health check history within timespan
     */
    extractIssuesFromHistory(healthHistory) {
        const cutoffTime = Date.now() - (this.config.timespan_hours * 60 * 60 * 1000);
        const issues = [];
        for (const healthCheck of healthHistory) {
            const healthCheckTime = new Date(healthCheck.timestamp).getTime();
            if (healthCheckTime >= cutoffTime) {
                for (const issue of healthCheck.issues) {
                    issues.push({
                        ...issue,
                        timestamp: healthCheck.timestamp
                    });
                }
            }
        }
        return issues;
    }
    /**
     * Group issues by fingerprint (first 100 chars of description)
     */
    groupIssuesByFingerprint(issues) {
        const groups = new Map();
        for (const issue of issues) {
            const fingerprint = this.generateFingerprint(issue.description);
            if (!groups.has(fingerprint)) {
                groups.set(fingerprint, []);
            }
            groups.get(fingerprint).push(issue);
        }
        return groups;
    }
    /**
     * Generate fingerprint from issue description
     */
    generateFingerprint(description) {
        return description
            .toLowerCase()
            .slice(0, 100)
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[0-9]{4,}/g, 'NUM') // Replace numbers with NUM placeholder
            .replace(/\d+(\.\d+)?ms/g, 'Xms') // Replace latency values
            .replace(/\d+%/g, 'X%'); // Replace percentages
    }
    /**
     * Detect recurring patterns (≥min_occurrences)
     */
    detectRecurringPatterns(issueGroups) {
        const patterns = [];
        for (const [fingerprint, issues] of issueGroups.entries()) {
            if (issues.length >= this.config.min_occurrences) {
                const firstIssue = issues[0];
                const lastIssue = issues[issues.length - 1];
                patterns.push({
                    issue_fingerprint: fingerprint,
                    issue_description: firstIssue.description,
                    occurrences: issues.length,
                    first_seen: issues[0].timestamp,
                    last_seen: lastIssue.timestamp,
                    timespan_hours: this.config.timespan_hours,
                    component: firstIssue.component,
                    severity: firstIssue.severity
                });
            }
        }
        return patterns;
    }
    /**
     * Update existing pattern with new occurrences
     */
    async updateExistingPattern(existingPattern, newOccurrences) {
        // Update occurrence count and timestamps
        const updated = {
            ...existingPattern,
            occurrences: existingPattern.occurrences + (newOccurrences.occurrences || 0),
            last_seen: newOccurrences.last_seen || existingPattern.last_seen
        };
        // Increase confidence if pattern continues to occur
        updated.root_cause.confidence = Math.min(100, updated.root_cause.confidence + 5);
        // Update enhancement priority based on frequency
        updated.enhancement_candidate = updated.root_cause.confidence >= this.config.min_confidence_for_enhancement;
        if (updated.enhancement_candidate) {
            // Calculate ROI: hours saved per week
            const occurrencesPerWeek = (updated.occurrences / updated.timespan_hours) * (24 * 7);
            const avgFixTimeHours = updated.remediation.avg_duration_ms / (1000 * 60 * 60);
            updated.estimated_roi_hours_per_week = Math.round(occurrencesPerWeek * avgFixTimeHours * 10) / 10;
        }
        this.logger.info(`📈 [Root Cause Learner] Updated pattern`, {
            fingerprint: updated.issue_fingerprint.slice(0, 50),
            occurrences: updated.occurrences,
            confidence: updated.root_cause.confidence,
            enhancement_candidate: updated.enhancement_candidate
        });
        return updated;
    }
    /**
     * Analyze new pattern and generate root cause hypothesis
     */
    async analyzeNewPattern(pattern, currentWorkingDir) {
        this.logger.info(`🆕 [Root Cause Learner] Analyzing new pattern`, {
            fingerprint: pattern.issue_fingerprint.slice(0, 50),
            occurrences: pattern.occurrences
        });
        // Step 1: Query RAG for similar historical issues
        const similarPatterns = await this.queryRAGForSimilarIssues(pattern.issue_description);
        // Step 2: Generate root cause hypothesis
        const rootCauseHypothesis = await this.generateRootCauseHypothesis(pattern, similarPatterns);
        // Step 3: Determine context (framework vs project)
        const context = this.determineContext(currentWorkingDir);
        // Step 4: Calculate enhancement priority
        const enhancementPriority = this.calculateEnhancementPriority(pattern.severity, pattern.occurrences, rootCauseHypothesis.confidence);
        // Step 5: Create complete pattern
        const completePattern = {
            id: `root-cause-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            issue_fingerprint: pattern.issue_fingerprint,
            issue_description: pattern.issue_description,
            occurrences: pattern.occurrences,
            first_seen: pattern.first_seen,
            last_seen: pattern.last_seen,
            timespan_hours: pattern.timespan_hours,
            root_cause: rootCauseHypothesis,
            remediation: {
                success_rate: 0, // Will be updated after first successful fix
                avg_duration_ms: 0
            },
            enhancement_candidate: rootCauseHypothesis.confidence >= this.config.min_confidence_for_enhancement,
            enhancement_priority: enhancementPriority,
            context: context,
            layer: this.classifyLayer(pattern.component),
            component: pattern.component,
            severity: pattern.severity
        };
        return completePattern;
    }
    /**
     * Query RAG for similar historical issues
     */
    async queryRAGForSimilarIssues(issueDescription) {
        if (!this.config.enable_rag_lookup) {
            return [];
        }
        try {
            const similarPatterns = await searchGuardianLearnings(issueDescription, 5);
            return similarPatterns.filter(p => p.category === 'auto-remediation' || p.category === 'issue-resolution');
        }
        catch (error) {
            this.logger.error('Failed to query RAG for similar issues', { error });
            return [];
        }
    }
    /**
     * Generate root cause hypothesis based on issue and historical context
     */
    async generateRootCauseHypothesis(pattern, similarPatterns) {
        const evidence = [];
        let confidence = 60; // Base confidence for new patterns
        // Evidence 1: Recurring occurrences
        evidence.push(`${pattern.occurrences} occurrences in ${pattern.timespan_hours}h`);
        confidence += Math.min(20, pattern.occurrences * 5);
        // Evidence 2: Historical patterns
        if (similarPatterns.length > 0) {
            evidence.push(`${similarPatterns.length} similar historical patterns found`);
            const avgSuccessRate = similarPatterns.reduce((sum, p) => sum + p.success_rate, 0) / similarPatterns.length;
            confidence += Math.min(15, avgSuccessRate / 10);
        }
        // Evidence 3: Component-specific patterns
        const componentPatterns = this.getComponentSpecificPatterns(pattern.component);
        if (componentPatterns) {
            evidence.push(`Known pattern for ${pattern.component}`);
            confidence += 10;
        }
        // Generate primary root cause
        const primaryRootCause = this.inferPrimaryRootCause(pattern.issue_description, pattern.component, similarPatterns);
        // Generate secondary root causes
        const secondaryRootCauses = this.inferSecondaryRootCauses(pattern.issue_description, similarPatterns);
        // Cap confidence at 95% for new patterns (human verification needed for 100%)
        confidence = Math.min(95, confidence);
        return {
            primary: primaryRootCause,
            secondary: secondaryRootCauses,
            confidence: Math.round(confidence),
            evidence
        };
    }
    /**
     * Infer primary root cause from issue description
     */
    inferPrimaryRootCause(issueDescription, component, similarPatterns) {
        const descLower = issueDescription.toLowerCase();
        // Pattern matching rules
        if (descLower.includes('timeout') && descLower.includes('graphrag')) {
            return 'Neo4j memory exhaustion or query complexity';
        }
        if (descLower.includes('build failed') || descLower.includes('tsc not found')) {
            return 'Missing TypeScript compiler or build configuration issue';
        }
        if (descLower.includes('test') && descLower.includes('failed')) {
            return 'Test suite failure - requires investigation';
        }
        if (descLower.includes('vulnerability') || descLower.includes('security')) {
            return 'Dependency security vulnerability detected';
        }
        if (descLower.includes('outdated') && descLower.includes('dependencies')) {
            return 'Outdated npm dependencies requiring updates';
        }
        if (descLower.includes('memory') || descLower.includes('exhaustion')) {
            return 'Memory resource exhaustion';
        }
        // Use similar patterns if available
        if (similarPatterns.length > 0) {
            return `Similar to: ${similarPatterns[0].pattern.slice(0, 80)}`;
        }
        // Fallback
        return `${component} component issue requiring investigation`;
    }
    /**
     * Infer secondary root causes
     */
    inferSecondaryRootCauses(issueDescription, similarPatterns) {
        const secondary = [];
        const descLower = issueDescription.toLowerCase();
        if (descLower.includes('graphrag') || descLower.includes('neo4j')) {
            secondary.push('Docker resource limits');
            secondary.push('Query complexity');
        }
        if (descLower.includes('build') || descLower.includes('typescript')) {
            secondary.push('Node modules corruption');
            secondary.push('TypeScript configuration mismatch');
        }
        if (descLower.includes('test')) {
            secondary.push('Flaky test');
            secondary.push('Environment configuration');
        }
        return secondary.slice(0, 3); // Max 3 secondary causes
    }
    /**
     * Get component-specific known patterns
     */
    getComponentSpecificPatterns(component) {
        const knownPatterns = {
            'rag': 'GraphRAG timeout → Neo4j restart',
            'build': 'Build failure → npm run build',
            'tests': 'Test failure → npm test',
            'guardian': 'Health check failure → Investigate dependencies'
        };
        return knownPatterns[component] || null;
    }
    /**
     * Calculate enhancement priority
     */
    calculateEnhancementPriority(severity, occurrences, confidence) {
        // Critical if: critical severity OR 10+ occurrences OR 90+ confidence
        if (severity === 'critical' || occurrences >= 10 || confidence >= 90) {
            return 'critical';
        }
        // High if: high severity OR 5+ occurrences OR 80+ confidence
        if (severity === 'high' || occurrences >= 5 || confidence >= 80) {
            return 'high';
        }
        // Medium if: medium severity OR 3+ occurrences
        if (severity === 'medium' || occurrences >= 3) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * Determine context (framework vs project)
     */
    determineContext(workingDir) {
        if (workingDir.includes('VERSATIL SDLC FW') || fs.existsSync(path.join(workingDir, '.versatil-framework-repo'))) {
            return 'FRAMEWORK_CONTEXT';
        }
        if (fs.existsSync(path.join(workingDir, '.versatil-project.json'))) {
            return 'PROJECT_CONTEXT';
        }
        return 'SHARED';
    }
    /**
     * Classify layer (framework, project, context)
     */
    classifyLayer(component) {
        const frameworkComponents = ['build', 'agents', 'rag', 'guardian', 'hooks'];
        if (frameworkComponents.includes(component)) {
            return 'framework';
        }
        return 'project';
    }
    /**
     * Store patterns to disk and update cache
     */
    async storePatterns(patterns) {
        for (const pattern of patterns) {
            // Update cache
            this.patternsCache.set(pattern.issue_fingerprint, pattern);
            // Append to JSONL file
            fs.appendFileSync(this.patternsFile, JSON.stringify(pattern) + '\n');
        }
    }
    /**
     * Load patterns cache from disk
     */
    loadPatternsCache() {
        if (!fs.existsSync(this.patternsFile)) {
            return;
        }
        try {
            const lines = fs.readFileSync(this.patternsFile, 'utf-8').trim().split('\n');
            const patterns = lines
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
            // Only keep latest version of each fingerprint
            for (const pattern of patterns) {
                this.patternsCache.set(pattern.issue_fingerprint, pattern);
            }
            this.logger.info(`📚 [Root Cause Learner] Loaded ${this.patternsCache.size} patterns from cache`);
        }
        catch (error) {
            this.logger.error('Failed to load patterns cache', { error });
        }
    }
    /**
     * Get all patterns
     */
    getPatterns() {
        return Array.from(this.patternsCache.values());
    }
    /**
     * Get pattern by fingerprint
     */
    getPattern(fingerprint) {
        return this.patternsCache.get(fingerprint);
    }
}
//# sourceMappingURL=root-cause-learner.js.map