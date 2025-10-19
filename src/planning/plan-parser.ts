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
// TYPE DEFINITIONS
// ============================================================================

/**
 * Parsed plan phase from plan text
 */
export interface ParsedPlanPhase {
  /** Phase number (1-6) */
  phaseNumber: number;

  /** Phase name (e.g., "Requirements Analysis") */
  phaseName: string;

  /** Full phase description */
  description: string;

  /** Agent responsible for this phase */
  agent: string;

  /** Estimated duration in minutes */
  estimatedDuration: number;

  /** Whether this phase can run in parallel with others */
  isParallel: boolean;

  /** Phase dependencies (phase numbers this depends on) */
  dependencies: number[];

  /** Original plan text for this phase */
  rawText: string;
}

/**
 * Complete parsed plan with all phases
 */
export interface ParsedPlan {
  /** Plan title/goal */
  title: string;

  /** All parsed phases */
  phases: ParsedPlanPhase[];

  /** Total estimated time (sum of sequential, max of parallel) */
  totalEstimatedMinutes: number;

  /** Parallel groups (phases that can run together) */
  parallelGroups: number[][];

  /** Metadata from plan header */
  metadata: {
    goal?: string;
    estimatedTime?: number;
    risk?: 'low' | 'medium' | 'high';
  };
}

/**
 * Parser configuration
 */
export interface PlanParserConfig {
  /** Enable strict validation (throw on parse errors) */
  strictMode: boolean;

  /** Default duration if none specified (minutes) */
  defaultDuration: number;

  /** Pattern to detect parallel markers */
  parallelMarker: string;
}

// ============================================================================
// PLAN PARSER IMPLEMENTATION
// ============================================================================

export class PlanParser {
  private logger: VERSATILLogger;
  private config: PlanParserConfig;

  // Regex patterns for parsing
  private static readonly PHASE_PATTERN = /Phase\s+(\d+):\s*([^\(]+)\s*\(([^)]+)\)\s*-\s*(\d+)\s*min/i;
  private static readonly PARALLEL_MARKER_PATTERN = /\[PARALLEL\]/i;
  private static readonly DURATION_PATTERN = /(\d+)\s*(min|minutes?|hour|hours?|h)/i;
  private static readonly DEPENDENCY_PATTERN = /depends?\s+on:?\s*Phase\s*(\d+)/i;

  constructor(config: Partial<PlanParserConfig> = {}) {
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
  async parse(planText: string): Promise<ParsedPlan> {
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

      const result: ParsedPlan = {
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

    } catch (error: any) {
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
  private extractTitle(lines: string[]): string {
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
  private extractMetadata(lines: string[]): ParsedPlan['metadata'] {
    const metadata: ParsedPlan['metadata'] = {};

    for (const line of lines.slice(0, 20)) {
      // Goal
      if (line.match(/Goal:\s*(.+)/i)) {
        metadata.goal = line.match(/Goal:\s*(.+)/i)![1].trim();
      }

      // Estimated time
      if (line.match(/Total\s+Estimated:\s*(\d+)/i)) {
        metadata.estimatedTime = parseInt(line.match(/Total\s+Estimated:\s*(\d+)/i)![1], 10);
      }

      // Risk level
      if (line.match(/Risk:\s*(low|medium|high)/i)) {
        metadata.risk = line.match(/Risk:\s*(low|medium|high)/i)![1].toLowerCase() as 'low' | 'medium' | 'high';
      }
    }

    return metadata;
  }

  /**
   * Extract all phases from plan text
   */
  private extractPhases(lines: string[]): ParsedPlanPhase[] {
    const phases: ParsedPlanPhase[] = [];
    let currentPhase: Partial<ParsedPlanPhase> | null = null;

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

      } else if (currentPhase) {
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
  private finalizeParsedPhase(partial: Partial<ParsedPlanPhase>): ParsedPlanPhase {
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
  private calculateTotalTime(phases: ParsedPlanPhase[]): number {
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
  private groupPhasesByLevel(phases: ParsedPlanPhase[]): ParsedPlanPhase[][] {
    const levels: ParsedPlanPhase[][] = [];
    const processed = new Set<number>();

    while (processed.size < phases.length) {
      const currentLevel: ParsedPlanPhase[] = [];

      for (const phase of phases) {
        if (processed.has(phase.phaseNumber)) continue;

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
  private identifyParallelGroups(phases: ParsedPlanPhase[]): number[][] {
    const groups: number[][] = [];
    const processed = new Set<number>();

    for (const phase of phases) {
      if (processed.has(phase.phaseNumber) || !phase.isParallel) continue;

      // Find all phases at same execution level
      const group: number[] = [phase.phaseNumber];
      processed.add(phase.phaseNumber);

      for (const other of phases) {
        if (
          other.phaseNumber !== phase.phaseNumber &&
          other.isParallel &&
          !processed.has(other.phaseNumber) &&
          this.canRunInParallel(phase, other)
        ) {
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
  private canRunInParallel(phase1: ParsedPlanPhase, phase2: ParsedPlanPhase): boolean {
    // Check if either depends on the other
    if (
      phase1.dependencies.includes(phase2.phaseNumber) ||
      phase2.dependencies.includes(phase1.phaseNumber)
    ) {
      return false;
    }

    // Both must be marked as parallel
    return phase1.isParallel && phase2.isParallel;
  }

  /**
   * Parse duration string (e.g., "30 min", "2 hours", "45m")
   */
  static parseDuration(durationStr: string): number {
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

export default PlanParser;
