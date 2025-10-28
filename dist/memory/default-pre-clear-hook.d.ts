/**
 * VERSATIL Default Pre-Clear Hook
 *
 * Automatically extracts and preserves critical patterns to agent memory
 * before context clearing occurs.
 *
 * This hook ensures zero critical pattern loss during emergency clears
 * by storing important conversations, code patterns, and decisions.
 *
 * Integration: Registered with ContextStatsTracker on framework startup
 */
import { PreClearHook } from './context-stats-tracker.js';
/**
 * Pattern extraction configuration
 */
export interface PatternExtractionConfig {
    /** Agent ID to store patterns for (defaults to current agent) */
    agentId?: string;
    /** Minimum tokens before extraction (default: 80k = 80% of 100k threshold) */
    minTokensBeforeExtraction?: number;
    /** Priority patterns to always preserve */
    priorityPatterns?: string[];
    /** Maximum patterns to extract per clear (default: 10) */
    maxPatterns?: number;
}
/**
 * Create default pre-clear hook for pattern extraction
 *
 * This hook runs before every context clear to preserve critical patterns:
 * 1. Extract recent code patterns from conversation
 * 2. Identify decisions and learnings
 * 3. Store to agent-specific memory directory
 * 4. Return count of patterns preserved
 *
 * @param config - Configuration for pattern extraction
 * @returns Pre-clear hook function
 */
export declare function createDefaultPreClearHook(config?: PatternExtractionConfig): PreClearHook;
/**
 * Advanced pre-clear hook with conversation analysis
 *
 * This hook performs deep analysis of recent conversation to extract:
 * - Code patterns and examples
 * - Important decisions and their rationale
 * - Bug fixes and their solutions
 * - Performance optimizations
 * - Security patterns
 *
 * @param config - Configuration for pattern extraction
 * @returns Pre-clear hook function
 */
export declare function createAdvancedPreClearHook(config?: PatternExtractionConfig): PreClearHook;
/**
 * Create emergency pre-clear hook for critical pattern preservation
 *
 * This hook is designed for emergency clears at 85%+ token usage.
 * It aggressively extracts and stores the most critical patterns only.
 *
 * @param config - Configuration for pattern extraction
 * @returns Pre-clear hook function
 */
export declare function createEmergencyPreClearHook(config?: PatternExtractionConfig): PreClearHook;
