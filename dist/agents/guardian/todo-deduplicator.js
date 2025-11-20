/**
 * VERSATIL Guardian - Todo Deduplication & Cleanup
 *
 * Prevents Guardian from creating duplicate todos and automatically archives resolved issues.
 * Part of v7.16.0 enhancement to reduce todo bloat (925 → 26 todos).
 */
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
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
export function checkDuplicate(verifiedIssue, todosDir, maxAgeHours = 24) {
    try {
        if (!existsSync(todosDir)) {
            return { is_duplicate: false, reason: 'No todos directory' };
        }
        // Generate issue fingerprint (component + description)
        const fingerprint = generateFingerprint(verifiedIssue.original_issue);
        // Find existing todos with same fingerprint
        const existingTodos = findTodosByFingerprint(todosDir, fingerprint);
        if (existingTodos.length === 0) {
            return { is_duplicate: false, reason: 'No matching todos found' };
        }
        // Find most recent matching todo
        const mostRecent = existingTodos.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
        // Check age
        if (mostRecent.age_hours < maxAgeHours) {
            return {
                is_duplicate: true,
                existing_todo: mostRecent,
                reason: `Duplicate of ${mostRecent.filename} (${mostRecent.age_hours.toFixed(1)}h old)`
            };
        }
        else {
            return {
                is_duplicate: false,
                existing_todo: mostRecent,
                reason: `Stale todo found (${mostRecent.age_hours.toFixed(1)}h old), will refresh`
            };
        }
    }
    catch (error) {
        console.error(`[TodoDeduplicator] Error checking duplicate: ${error.message}`);
        return { is_duplicate: false, reason: 'Error during check' };
    }
}
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
export async function reviewAndCleanupTodos(todosDir, maxAgeHours = 72) {
    const result = {
        archived_count: 0,
        archived_files: [],
        kept_count: 0,
        errors: []
    };
    try {
        if (!existsSync(todosDir)) {
            return result;
        }
        const files = readdirSync(todosDir).filter(f => f.endsWith('.md') && f.startsWith('guardian-'));
        const now = new Date();
        // Create archive directory
        const archiveDir = join(todosDir, 'archive', 'guardian-auto-' + new Date().toISOString().split('T')[0]);
        mkdirSync(archiveDir, { recursive: true });
        for (const file of files) {
            const filepath = join(todosDir, file);
            try {
                const stats = statSync(filepath);
                const ageHours = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60);
                // Read todo content
                const content = readFileSync(filepath, 'utf-8');
                // Check if issue is resolved
                const shouldArchive = await shouldArchiveTodo(content, ageHours, maxAgeHours);
                if (shouldArchive.archive) {
                    // Archive the todo
                    const archivePath = join(archiveDir, file);
                    writeFileSync(archivePath, content);
                    // Add archival note
                    const archivalNote = `\n\n---\n**Archived**: ${now.toISOString()}\n**Reason**: ${shouldArchive.reason}\n`;
                    writeFileSync(archivePath, content + archivalNote);
                    // Remove original
                    unlinkSync(filepath);
                    result.archived_count++;
                    result.archived_files.push(file);
                    console.log(`  🗄️  Archived: ${file} (${shouldArchive.reason})`);
                }
                else {
                    result.kept_count++;
                }
            }
            catch (error) {
                result.errors.push(`${file}: ${error.message}`);
            }
        }
    }
    catch (error) {
        result.errors.push(`Cleanup failed: ${error.message}`);
    }
    return result;
}
/**
 * Generate fingerprint for issue deduplication
 */
function generateFingerprint(issue) {
    const normalized = `${issue.component}:${issue.description}`
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[0-9]+ms/g, 'Xms') // Normalize timestamps
        .replace(/[0-9]+%/g, 'X%') // Normalize percentages
        .replace(/[0-9]+ (dependencies|files|errors)/g, 'X $1') // Normalize counts
        .slice(0, 150)
        .trim();
    return normalized;
}
/**
 * Find todos matching a fingerprint
 */
function findTodosByFingerprint(todosDir, fingerprint) {
    const todos = [];
    const files = readdirSync(todosDir).filter(f => f.endsWith('.md') && f.startsWith('guardian-'));
    const now = new Date();
    for (const file of files) {
        const filepath = join(todosDir, file);
        try {
            const content = readFileSync(filepath, 'utf-8');
            const stats = statSync(filepath);
            // Check if content matches fingerprint
            const todoFingerprint = extractFingerprintFromContent(content);
            if (todoFingerprint.includes(fingerprint) || fingerprint.includes(todoFingerprint)) {
                // Extract metadata from filename
                const match = file.match(/guardian-combined-([a-z-]+)-([a-z]+)-(\d+)/);
                const assigned_agent = match?.[1]?.replace(/-/g, ' ') || 'unknown';
                const priority = match?.[2] || 'unknown';
                // Extract issue count from content
                const issueCountMatch = content.match(/issue_count:\s*(\d+)/);
                const issue_count = issueCountMatch ? parseInt(issueCountMatch[1]) : 1;
                const ageHours = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60);
                todos.push({
                    filepath,
                    filename: file,
                    created_at: stats.mtime,
                    age_hours: ageHours,
                    issue_fingerprint: todoFingerprint,
                    assigned_agent,
                    priority,
                    issue_count
                });
            }
        }
        catch (error) {
            // Skip files that can't be read
            continue;
        }
    }
    return todos;
}
/**
 * Extract fingerprint from todo content
 */
function extractFingerprintFromContent(content) {
    // Extract first issue description
    const issueMatch = content.match(/\*\*Issue\*\*:\s*(.+)/);
    if (issueMatch) {
        return generateFingerprint({ component: '', description: issueMatch[1] });
    }
    // Fallback: use first 150 chars
    return content.toLowerCase().slice(0, 150).replace(/\s+/g, ' ').trim();
}
/**
 * Determine if todo should be archived
 */
async function shouldArchiveTodo(content, ageHours, maxAgeHours) {
    // Check age-based archival
    if (ageHours > maxAgeHours) {
        return { archive: true, reason: `Stale (${ageHours.toFixed(1)}h old, max ${maxAgeHours}h)` };
    }
    // Check if issue is resolved
    const issueResolved = await checkIssueResolved(content);
    if (issueResolved) {
        return { archive: true, reason: 'Issue resolved' };
    }
    return { archive: false, reason: 'Active' };
}
/**
 * Check if issue mentioned in todo is resolved
 */
async function checkIssueResolved(content) {
    // Check for build failures
    if (content.includes('Build failed')) {
        return await checkBuildPassing();
    }
    // Check for test failures
    if (content.includes('Tests failed')) {
        return await checkTestsPassing();
    }
    // Check for outdated dependencies
    if (content.includes('outdated dependencies')) {
        return await checkDependenciesUpToDate();
    }
    // Check for RAG issues (performance, not blocking)
    if (content.includes('RAG') && (content.includes('timeout') || content.includes('malfunction'))) {
        // Keep RAG performance todos for now
        return false;
    }
    return false;
}
/**
 * Check if build is currently passing
 */
async function checkBuildPassing() {
    try {
        // Quick check: see if dist/ directory exists and is recent
        const distPath = join(process.cwd(), 'dist');
        if (existsSync(distPath)) {
            const stats = statSync(distPath);
            const ageMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);
            // If dist/ was updated in last 30 minutes, assume build is passing
            return ageMinutes < 30;
        }
        return false;
    }
    catch {
        return false;
    }
}
/**
 * Check if tests are currently passing
 */
async function checkTestsPassing() {
    // Conservative: don't auto-archive test failures
    // Let Maria-QA manually verify tests are fixed
    return false;
}
/**
 * Check if dependencies are up to date
 */
async function checkDependenciesUpToDate() {
    try {
        const output = execSync('npm outdated --json', { encoding: 'utf-8', timeout: 10000 });
        const outdated = JSON.parse(output || '{}');
        return Object.keys(outdated).length === 0;
    }
    catch {
        // If npm outdated fails or times out, keep the todo
        return false;
    }
}
/**
 * Get statistics about current todos
 */
export function getTodoStatistics(todosDir) {
    const stats = {
        total: 0,
        by_agent: {},
        by_priority: {},
        avg_age_hours: 0,
        oldest_age_hours: 0
    };
    try {
        if (!existsSync(todosDir)) {
            return stats;
        }
        const files = readdirSync(todosDir).filter(f => f.endsWith('.md') && f.startsWith('guardian-'));
        stats.total = files.length;
        const now = new Date();
        let totalAgeHours = 0;
        for (const file of files) {
            const filepath = join(todosDir, file);
            const statFile = statSync(filepath);
            const ageHours = (now.getTime() - statFile.mtime.getTime()) / (1000 * 60 * 60);
            totalAgeHours += ageHours;
            stats.oldest_age_hours = Math.max(stats.oldest_age_hours, ageHours);
            // Extract agent and priority from filename
            const match = file.match(/guardian-combined-([a-z-]+)-([a-z]+)-/);
            if (match) {
                const agent = match[1];
                const priority = match[2];
                stats.by_agent[agent] = (stats.by_agent[agent] || 0) + 1;
                stats.by_priority[priority] = (stats.by_priority[priority] || 0) + 1;
            }
        }
        stats.avg_age_hours = stats.total > 0 ? totalAgeHours / stats.total : 0;
    }
    catch (error) {
        console.error('[TodoDeduplicator] Error getting statistics:', error);
    }
    return stats;
}
// Re-export utility functions for testing
export { calculateTodoFingerprint, areTodosSimilar, deduplicateTodos } from './todo-deduplicator-exports.js';
//# sourceMappingURL=todo-deduplicator.js.map