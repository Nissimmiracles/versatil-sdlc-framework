/**
 * VERSATIL Guardian - Todo Deduplication & Cleanup
 *
 * Prevents Guardian from creating duplicate todos and automatically archives resolved issues.
 * Part of v7.16.0 enhancement to reduce todo bloat (925 → 26 todos).
 */
import type { VerifiedIssue } from './verified-issue-detector.js';
export interface TodoMetadata {
    filepath: string;
    filename: string;
    created_at: Date;
    age_hours: number;
    issue_fingerprint: string;
    assigned_agent: string;
    priority: string;
    issue_count: number;
}
export interface DeduplicationResult {
    is_duplicate: boolean;
    existing_todo?: TodoMetadata;
    reason?: string;
}
export interface CleanupResult {
    archived_count: number;
    archived_files: string[];
    kept_count: number;
    errors: string[];
}
/**
 * Enhanced duplicate detection with time-based logic
 *
 * Rules:
 * 1. If same issue exists and is <24h old → Skip (is duplicate)
 * 2. If same issue exists and is >24h old → Update timestamp (not duplicate, refresh)
 * 3. If different issue → Create new (not duplicate)
 *
 * @param verifiedIssue - Issue to check
 * @param todosDir - Directory containing todo files
 * @param maxAgeHours - Max age before todo is considered stale (default: 24)
 * @returns Deduplication result with existing todo info if duplicate
 */
export declare function checkDuplicate(verifiedIssue: VerifiedIssue, todosDir: string, maxAgeHours?: number): DeduplicationResult;
/**
 * Review all todos and archive resolved/stale issues
 *
 * Archival criteria:
 * 1. Build failure todos when build passes
 * 2. Test failure todos when tests pass
 * 3. Dependency todos when npm outdated shows 0
 * 4. Todos older than maxAgeHours (default: 72h)
 *
 * @param todosDir - Directory containing todo files
 * @param maxAgeHours - Max age before auto-archive (default: 72)
 * @returns Cleanup result with archived file list
 */
export declare function reviewAndCleanupTodos(todosDir: string, maxAgeHours?: number): Promise<CleanupResult>;
/**
 * Get statistics about current todos
 */
export declare function getTodoStatistics(todosDir: string): {
    total: number;
    by_agent: Record<string, number>;
    by_priority: Record<string, number>;
    avg_age_hours: number;
    oldest_age_hours: number;
};
export { calculateTodoFingerprint, areTodosSimilar, deduplicateTodos } from './todo-deduplicator-exports.js';
