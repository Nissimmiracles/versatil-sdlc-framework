/**
 * @fileoverview Parallel Task Detector - Detect and group parallel tasks
 *
 * Identifies tasks that can run in parallel, groups them by execution level,
 * and validates parallel execution safety.
 *
 * @module planning/parallel-task-detector
 * @version 1.0.0
 */

import { VERSATILLogger } from '../utils/logger.js';
import { ParsedPlanPhase } from './plan-parser.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Parallel execution group
 */
export interface ParallelGroup {
  /** Group identifier */
  groupId: string;

  /** Phase numbers in this parallel group */
  phaseNumbers: number[];

  /** Agent names involved */
  agents: string[];

  /** Maximum duration in group (bottleneck) */
  maxDuration: number;

  /** Total estimated duration if run sequentially */
  sequentialDuration: number;

  /** Time saved by parallel execution */
  timeSavings: number;

  /** Execution level (0 = can start immediately) */
  level: number;
}

/**
 * Parallel execution analysis
 */
export interface ParallelExecutionAnalysis {
  /** All identified parallel groups */
  groups: ParallelGroup[];

  /** Sequential execution time (no parallelization) */
  sequentialTime: number;

  /** Parallel execution time (with parallelization) */
  parallelTime: number;

  /** Total time saved */
  totalTimeSavings: number;

  /** Percentage faster */
  percentageFaster: number;

  /** Execution order (phases grouped by level) */
  executionOrder: number[][];
}

/**
 * Parallel safety check result
 */
export interface ParallelSafetyCheck {
  /** Whether parallel execution is safe */
  isSafe: boolean;

  /** Safety issues detected */
  issues: string[];

  /** Warnings (non-blocking) */
  warnings: string[];

  /** Recommendations for optimization */
  recommendations: string[];
}

// ============================================================================
// PARALLEL TASK DETECTOR IMPLEMENTATION
// ============================================================================

export class ParallelTaskDetector {
  private logger: VERSATILLogger;

  constructor() {
    this.logger = new VERSATILLogger('ParallelTaskDetector');
  }

  /**
   * Analyze phases for parallel execution opportunities
   */
  async analyze(phases: ParsedPlanPhase[]): Promise<ParallelExecutionAnalysis> {
    this.logger.info('Analyzing parallel execution opportunities', { phaseCount: phases.length });

    // Build execution order (respecting dependencies)
    const executionOrder = this.buildExecutionOrder(phases);

    // Identify parallel groups
    const groups = this.identifyParallelGroups(phases, executionOrder);

    // Calculate time savings
    const sequentialTime = this.calculateSequentialTime(phases);
    const parallelTime = this.calculateParallelTime(executionOrder, phases);
    const totalTimeSavings = sequentialTime - parallelTime;
    const percentageFaster = sequentialTime > 0 ? (totalTimeSavings / sequentialTime) * 100 : 0;

    const analysis: ParallelExecutionAnalysis = {
      groups,
      sequentialTime,
      parallelTime,
      totalTimeSavings,
      percentageFaster,
      executionOrder,
    };

    this.logger.info('Parallel analysis complete', {
      groupCount: groups.length,
      timeSavings: `${totalTimeSavings}min (${percentageFaster.toFixed(1)}% faster)`,
    });

    return analysis;
  }

  /**
   * Check if parallel execution is safe
   */
  async checkSafety(phases: ParsedPlanPhase[]): Promise<ParallelSafetyCheck> {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(phases);
    if (circularDeps.length > 0) {
      issues.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    // Check for resource conflicts (same agent assigned to parallel tasks)
    const agentConflicts = this.detectAgentConflicts(phases);
    if (agentConflicts.length > 0) {
      warnings.push(`Agent conflicts: ${agentConflicts.join(', ')}`);
      recommendations.push('Consider load balancing or sequential execution for conflicting agents');
    }

    // Check for unmarked parallel tasks
    const unmarkedParallel = this.detectUnmarkedParallelTasks(phases);
    if (unmarkedParallel.length > 0) {
      recommendations.push(`Phases ${unmarkedParallel.join(', ')} could potentially run in parallel`);
    }

    return {
      isSafe: issues.length === 0,
      issues,
      warnings,
      recommendations,
    };
  }

  /**
   * Build execution order respecting dependencies
   */
  private buildExecutionOrder(phases: ParsedPlanPhase[]): number[][] {
    const order: number[][] = [];
    const processed = new Set<number>();
    const phaseMap = new Map(phases.map(p => [p.phaseNumber, p]));

    while (processed.size < phases.length) {
      const currentLevel: number[] = [];

      for (const phase of phases) {
        if (processed.has(phase.phaseNumber)) continue;

        // Check if all dependencies are satisfied
        const dependenciesSatisfied = phase.dependencies.every(dep => processed.has(dep));

        if (dependenciesSatisfied) {
          currentLevel.push(phase.phaseNumber);
          processed.add(phase.phaseNumber);
        }
      }

      if (currentLevel.length === 0 && processed.size < phases.length) {
        // Deadlock detection - add remaining phases by priority
        const remaining = phases
          .filter(p => !processed.has(p.phaseNumber))
          .sort((a, b) => a.phaseNumber - b.phaseNumber);

        if (remaining.length > 0) {
          currentLevel.push(remaining[0].phaseNumber);
          processed.add(remaining[0].phaseNumber);
        }
      }

      if (currentLevel.length > 0) {
        order.push(currentLevel);
      }
    }

    return order;
  }

  /**
   * Identify parallel groups from execution order
   */
  private identifyParallelGroups(
    phases: ParsedPlanPhase[],
    executionOrder: number[][]
  ): ParallelGroup[] {
    const groups: ParallelGroup[] = [];
    const phaseMap = new Map(phases.map(p => [p.phaseNumber, p]));

    executionOrder.forEach((level, levelIndex) => {
      // Only create group if more than one phase at this level
      if (level.length <= 1) return;

      const levelPhases = level.map(num => phaseMap.get(num)!).filter(Boolean);

      // Check if phases are marked as parallel
      const parallelPhases = levelPhases.filter(p => p.isParallel);

      if (parallelPhases.length > 1) {
        const agents = [...new Set(parallelPhases.map(p => p.agent))];
        const maxDuration = Math.max(...parallelPhases.map(p => p.estimatedDuration));
        const sequentialDuration = parallelPhases.reduce((sum, p) => sum + p.estimatedDuration, 0);
        const timeSavings = sequentialDuration - maxDuration;

        groups.push({
          groupId: `parallel-group-${levelIndex}`,
          phaseNumbers: parallelPhases.map(p => p.phaseNumber),
          agents,
          maxDuration,
          sequentialDuration,
          timeSavings,
          level: levelIndex,
        });
      }
    });

    return groups;
  }

  /**
   * Calculate sequential execution time (no parallelization)
   */
  private calculateSequentialTime(phases: ParsedPlanPhase[]): number {
    return phases.reduce((total, phase) => total + phase.estimatedDuration, 0);
  }

  /**
   * Calculate parallel execution time (with parallelization)
   */
  private calculateParallelTime(executionOrder: number[][], phases: ParsedPlanPhase[]): number {
    const phaseMap = new Map(phases.map(p => [p.phaseNumber, p]));

    let totalTime = 0;

    for (const level of executionOrder) {
      const levelPhases = level.map(num => phaseMap.get(num)!).filter(Boolean);
      const maxDuration = Math.max(...levelPhases.map(p => p.estimatedDuration), 0);
      totalTime += maxDuration;
    }

    return totalTime;
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(phases: ParsedPlanPhase[]): string[] {
    const cycles: string[] = [];
    const visited = new Set<number>();
    const recursionStack = new Set<number>();
    const phaseMap = new Map(phases.map(p => [p.phaseNumber, p]));

    const dfs = (phaseNum: number, path: number[]): boolean => {
      if (recursionStack.has(phaseNum)) {
        // Cycle detected
        const cycleStart = path.indexOf(phaseNum);
        const cycle = path.slice(cycleStart).concat(phaseNum);
        cycles.push(`Phase ${cycle.join(' → Phase ')}`);
        return true;
      }

      if (visited.has(phaseNum)) {
        return false;
      }

      visited.add(phaseNum);
      recursionStack.add(phaseNum);
      path.push(phaseNum);

      const phase = phaseMap.get(phaseNum);
      if (phase) {
        for (const dep of phase.dependencies) {
          if (dfs(dep, [...path])) {
            return true;
          }
        }
      }

      recursionStack.delete(phaseNum);
      return false;
    };

    for (const phase of phases) {
      if (!visited.has(phase.phaseNumber)) {
        dfs(phase.phaseNumber, []);
      }
    }

    return cycles;
  }

  /**
   * Detect agent conflicts (same agent on parallel tasks)
   */
  private detectAgentConflicts(phases: ParsedPlanPhase[]): string[] {
    const conflicts: string[] = [];
    const executionOrder = this.buildExecutionOrder(phases);
    const phaseMap = new Map(phases.map(p => [p.phaseNumber, p]));

    for (const level of executionOrder) {
      if (level.length <= 1) continue;

      const levelPhases = level.map(num => phaseMap.get(num)!).filter(Boolean);
      const agentCounts = new Map<string, number[]>();

      for (const phase of levelPhases) {
        if (phase.isParallel) {
          const existing = agentCounts.get(phase.agent) || [];
          existing.push(phase.phaseNumber);
          agentCounts.set(phase.agent, existing);
        }
      }

      // Report agents with multiple parallel assignments
      for (const [agent, phaseNums] of agentCounts) {
        if (phaseNums.length > 1) {
          conflicts.push(`${agent} assigned to phases ${phaseNums.join(', ')} in parallel`);
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect tasks that could run in parallel but aren't marked
   */
  private detectUnmarkedParallelTasks(phases: ParsedPlanPhase[]): number[] {
    const unmarked: number[] = [];
    const executionOrder = this.buildExecutionOrder(phases);
    const phaseMap = new Map(phases.map(p => [p.phaseNumber, p]));

    for (const level of executionOrder) {
      if (level.length <= 1) continue;

      const levelPhases = level.map(num => phaseMap.get(num)!).filter(Boolean);

      for (const phase of levelPhases) {
        // If at same level as others but not marked parallel
        if (!phase.isParallel && levelPhases.length > 1) {
          unmarked.push(phase.phaseNumber);
        }
      }
    }

    return unmarked;
  }

  /**
   * Format parallel progress for statusline display
   */
  formatParallelProgress(
    group: ParallelGroup,
    progress: Map<number, number>
  ): string {
    const progressStrings = group.phaseNumbers
      .map(phaseNum => {
        const pct = progress.get(phaseNum) || 0;
        const agent = group.agents.find(a => a.includes(phaseNum.toString())) || `Phase ${phaseNum}`;
        return `${agent} (${pct}%)`;
      });

    return progressStrings.join(' + ');
  }
}

export default ParallelTaskDetector;
