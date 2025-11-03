/* eslint-disable no-useless-escape */
/**
 * @fileoverview Plan Parser - Parse plan text into structured data
 *
 * Parses plan outputs from PlanFirstOpera into structured format for TodoWrite conversion.
 * Handles phase extraction, duration parsing, dependency detection, and parallel task identification.
 *
 * @module planning/plan-parser
 * @version 1.0.0
 */
import { VERSATILLogger } from '../utils/logger.js';
// ============================================================================
// PLAN PARSER IMPLEMENTATION
// ============================================================================
export class PlanParser {
    constructor(config = {}) {
        this.logger = new VERSATILLogger('PlanParser');
        this.config = {
            strictMode: config.strictMode ?? false,
            defaultDuration: config.defaultDuration ?? 30,
            parallelMarker: config.parallelMarker ?? '[PARALLEL]',
        };
    }
    /**
     * Parse plan text into structured format
     */
    async parse(planText) {
        this.logger.info('Parsing plan text', { length: planText.length });
        try {
            // Split into lines
            const lines = planText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            // Extract title/goal
            const title = this.extractTitle(lines);
            // Extract metadata
            const metadata = this.extractMetadata(lines);
            // Extract phases
            const phases = this.extractPhases(lines);
            // Calculate total time (accounting for parallel execution)
            const totalEstimatedMinutes = this.calculateTotalTime(phases);
            // Identify parallel groups
            const parallelGroups = this.identifyParallelGroups(phases);
            const result = {
                title,
                phases,
                totalEstimatedMinutes,
                parallelGroups,
                metadata,
            };
            this.logger.info('Plan parsed successfully', {
                phaseCount: phases.length,
                totalMinutes: totalEstimatedMinutes,
                parallelGroups: parallelGroups.length,
            });
            return result;
        }
        catch (error) {
            this.logger.error('Plan parsing failed', { error: error.message });
            if (this.config.strictMode) {
                throw error;
            }
            // Return minimal valid plan in non-strict mode
            return {
                title: 'Unparsed Plan',
                phases: [],
                totalEstimatedMinutes: 0,
                parallelGroups: [],
                metadata: {},
            };
        }
    }
    /**
     * Extract plan title from first meaningful line
     */
    extractTitle(lines) {
        // Look for common title patterns
        const titlePatterns = [
            /^PLAN:\s*(.+)$/i,
            /^# (.+)$/,
            /^## (.+)$/,
            /^Goal:\s*(.+)$/i,
            /^Feature:\s*(.+)$/i,
        ];
        for (const line of lines.slice(0, 10)) {
            for (const pattern of titlePatterns) {
                const match = line.match(pattern);
                if (match) {
                    return match[1].trim();
                }
            }
        }
        // Default: use first non-empty line
        return lines[0] || 'Implementation Plan';
    }
    /**
     * Extract metadata from plan header
     */
    extractMetadata(lines) {
        const metadata = {};
        for (const line of lines.slice(0, 20)) {
            // Goal
            if (line.match(/Goal:\s*(.+)/i)) {
                metadata.goal = line.match(/Goal:\s*(.+)/i)[1].trim();
            }
            // Estimated time
            if (line.match(/Total\s+Estimated:\s*(\d+)/i)) {
                metadata.estimatedTime = parseInt(line.match(/Total\s+Estimated:\s*(\d+)/i)[1], 10);
            }
            // Risk level
            if (line.match(/Risk:\s*(low|medium|high)/i)) {
                metadata.risk = line.match(/Risk:\s*(low|medium|high)/i)[1].toLowerCase();
            }
        }
        return metadata;
    }
    /**
     * Extract all phases from plan text
     */
    extractPhases(lines) {
        const phases = [];
        let currentPhase = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Try to match phase header
            const phaseMatch = line.match(PlanParser.PHASE_PATTERN);
            if (phaseMatch) {
                // Save previous phase if exists
                if (currentPhase && currentPhase.phaseNumber) {
                    phases.push(this.finalizeParsedPhase(currentPhase));
                }
                // Start new phase
                currentPhase = {
                    phaseNumber: parseInt(phaseMatch[1], 10),
                    phaseName: phaseMatch[2].trim(),
                    agent: phaseMatch[3].trim(),
                    estimatedDuration: parseInt(phaseMatch[4], 10),
                    isParallel: PlanParser.PARALLEL_MARKER_PATTERN.test(line),
                    dependencies: [],
                    description: '',
                    rawText: line,
                };
            }
            else if (currentPhase) {
                // Accumulate phase description
                if (line.startsWith('-') || line.startsWith('*') || line.startsWith('✓')) {
                    currentPhase.description = (currentPhase.description || '') + '\n' + line.trim();
                }
                // Check for dependencies
                const depMatch = line.match(PlanParser.DEPENDENCY_PATTERN);
                if (depMatch) {
                    currentPhase.dependencies = currentPhase.dependencies || [];
                    currentPhase.dependencies.push(parseInt(depMatch[1], 10));
                }
                // Add to raw text
                currentPhase.rawText = (currentPhase.rawText || '') + '\n' + line;
            }
        }
        // Save last phase
        if (currentPhase && currentPhase.phaseNumber) {
            phases.push(this.finalizeParsedPhase(currentPhase));
        }
        return phases;
    }
    /**
     * Finalize a partially parsed phase
     */
    finalizeParsedPhase(partial) {
        return {
            phaseNumber: partial.phaseNumber || 0,
            phaseName: partial.phaseName || 'Unnamed Phase',
            description: partial.description || '',
            agent: partial.agent || 'Unknown',
            estimatedDuration: partial.estimatedDuration || this.config.defaultDuration,
            isParallel: partial.isParallel || false,
            dependencies: partial.dependencies || [],
            rawText: partial.rawText || '',
        };
    }
    /**
     * Calculate total time accounting for parallel execution
     */
    calculateTotalTime(phases) {
        // Group phases by dependencies to identify sequential vs parallel
        const phasesByLevel = this.groupPhasesByLevel(phases);
        let totalTime = 0;
        // For each level, take max duration (parallel execution)
        for (const levelPhases of phasesByLevel) {
            const maxDuration = Math.max(...levelPhases.map(p => p.estimatedDuration));
            totalTime += maxDuration;
        }
        return totalTime;
    }
    /**
     * Group phases by execution level (for parallel time calculation)
     */
    groupPhasesByLevel(phases) {
        const levels = [];
        const processed = new Set();
        while (processed.size < phases.length) {
            const currentLevel = [];
            for (const phase of phases) {
                if (processed.has(phase.phaseNumber))
                    continue;
                // Check if all dependencies are satisfied
                const dependenciesSatisfied = phase.dependencies.every(dep => processed.has(dep));
                if (dependenciesSatisfied) {
                    currentLevel.push(phase);
                    processed.add(phase.phaseNumber);
                }
            }
            if (currentLevel.length === 0 && processed.size < phases.length) {
                // Deadlock - add remaining phases to avoid infinite loop
                for (const phase of phases) {
                    if (!processed.has(phase.phaseNumber)) {
                        currentLevel.push(phase);
                        processed.add(phase.phaseNumber);
                    }
                }
            }
            if (currentLevel.length > 0) {
                levels.push(currentLevel);
            }
        }
        return levels;
    }
    /**
     * Identify groups of phases that can run in parallel
     */
    identifyParallelGroups(phases) {
        const groups = [];
        const processed = new Set();
        for (const phase of phases) {
            if (processed.has(phase.phaseNumber) || !phase.isParallel)
                continue;
            // Find all phases at same execution level
            const group = [phase.phaseNumber];
            processed.add(phase.phaseNumber);
            for (const other of phases) {
                if (other.phaseNumber !== phase.phaseNumber &&
                    other.isParallel &&
                    !processed.has(other.phaseNumber) &&
                    this.canRunInParallel(phase, other)) {
                    group.push(other.phaseNumber);
                    processed.add(other.phaseNumber);
                }
            }
            if (group.length > 1) {
                groups.push(group);
            }
        }
        return groups;
    }
    /**
     * Check if two phases can run in parallel
     */
    canRunInParallel(phase1, phase2) {
        // Check if either depends on the other
        if (phase1.dependencies.includes(phase2.phaseNumber) ||
            phase2.dependencies.includes(phase1.phaseNumber)) {
            return false;
        }
        // Both must be marked as parallel
        return phase1.isParallel && phase2.isParallel;
    }
    /**
     * Parse duration string (e.g., "30 min", "2 hours", "45m")
     */
    static parseDuration(durationStr) {
        const match = durationStr.match(PlanParser.DURATION_PATTERN);
        if (!match) {
            return 30; // Default 30 minutes
        }
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        if (unit.startsWith('h')) {
            return value * 60; // Convert hours to minutes
        }
        return value; // Already in minutes
    }
}
// Regex patterns for parsing
PlanParser.PHASE_PATTERN = /Phase\s+(\d+):\s*([^\(]+)\s*\(([^)]+)\)\s*-\s*(\d+)\s*min/i;
PlanParser.PARALLEL_MARKER_PATTERN = /\[PARALLEL\]/i;
PlanParser.DURATION_PATTERN = /(\d+)\s*(min|minutes?|hour|hours?|h)/i;
PlanParser.DEPENDENCY_PATTERN = /depends?\s+on:?\s*Phase\s*(\d+)/i;
export default PlanParser;
//# sourceMappingURL=plan-parser.js.map