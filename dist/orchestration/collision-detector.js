/**
 * VERSATIL SDLC Framework - Collision Detector
 * Detects file conflicts between parallel tasks to prevent merge conflicts
 *
 * Features:
 * - Extract file dependencies from task metadata
 * - Detect overlapping file edits between tasks
 * - Calculate collision risk levels (NONE/LOW/MEDIUM/HIGH/CRITICAL)
 * - Auto-reschedule conflicting tasks to later waves
 * - Generate collision warnings and recommendations
 *
 * @module orchestration/collision-detector
 * @version 1.0.0
 */
import { VERSATILLogger } from '../utils/logger.js';
/**
 * Collision risk levels
 */
export var CollisionRisk;
(function (CollisionRisk) {
    CollisionRisk["NONE"] = "none";
    CollisionRisk["LOW"] = "low";
    CollisionRisk["MEDIUM"] = "medium";
    CollisionRisk["HIGH"] = "high";
    CollisionRisk["CRITICAL"] = "critical"; // Destructive operations (delete + modify)
})(CollisionRisk || (CollisionRisk = {}));
/**
 * Resolution strategies
 */
export var ResolutionStrategy;
(function (ResolutionStrategy) {
    ResolutionStrategy["ALLOW_PARALLEL"] = "allow_parallel";
    ResolutionStrategy["SERIALIZE"] = "serialize";
    ResolutionStrategy["RESCHEDULE"] = "reschedule";
    ResolutionStrategy["MANUAL_REVIEW"] = "manual_review";
    ResolutionStrategy["SPLIT_TASKS"] = "split_tasks";
})(ResolutionStrategy || (ResolutionStrategy = {}));
// ============================================================================
// COLLISION DETECTOR IMPLEMENTATION
// ============================================================================
export class CollisionDetector {
    constructor() {
        this.logger = new VERSATILLogger('CollisionDetector');
    }
    /**
     * Detect collisions between multiple tasks
     */
    async detectCollisions(tasks) {
        this.logger.info('Detecting file collisions', {
            taskCount: tasks.length,
            totalFiles: this.getTotalFileCount(tasks),
        });
        // Build file access map
        const fileAccessMap = this.buildFileAccessMap(tasks);
        // Find conflicts
        const details = [];
        const conflictingTasks = new Set();
        const conflictingFiles = new Set();
        let highestRisk = CollisionRisk.NONE;
        for (const [file, accessList] of fileAccessMap) {
            // Skip files accessed by only one task
            if (accessList.length <= 1)
                continue;
            // Check for conflicts
            const collision = this.analyzeFileCollision(file, accessList);
            if (collision.has_collision) {
                details.push(collision.detail);
                collision.tasks.forEach(t => conflictingTasks.add(t));
                conflictingFiles.add(file);
                // Track highest risk level
                if (this.getRiskLevel(collision.risk) > this.getRiskLevel(highestRisk)) {
                    highestRisk = collision.risk;
                }
            }
        }
        // Determine resolution strategy
        const resolution = this.determineResolution(highestRisk, details);
        const requireSerialization = this.requiresSerialization(resolution);
        const result = {
            has_collision: details.length > 0,
            risk: highestRisk,
            conflicting_tasks: Array.from(conflictingTasks),
            conflicting_files: Array.from(conflictingFiles),
            details,
            resolution,
            require_serialization: requireSerialization,
        };
        this.logger.info('Collision detection complete', {
            hasCollision: result.has_collision,
            risk: result.risk,
            conflictingFiles: result.conflicting_files.length,
            resolution: result.resolution,
        });
        return result;
    }
    /**
     * Check if two specific tasks collide
     */
    async checkTaskPairCollision(task1, task2) {
        return this.detectCollisions([task1, task2]);
    }
    /**
     * Extract file dependencies from task metadata
     */
    extractFileDependencies(taskMetadata) {
        // Parse files_involved to categorize operations
        const filesInvolved = taskMetadata.files_involved || [];
        // Simple heuristic: files are categorized by naming patterns
        // In production, this would parse actual task metadata
        const filesRead = [];
        const filesModified = [];
        const filesCreated = [];
        const filesDeleted = [];
        filesInvolved.forEach(file => {
            if (file.includes('new-') || file.includes('create-')) {
                filesCreated.push(file);
            }
            else if (file.includes('delete-') || file.includes('remove-')) {
                filesDeleted.push(file);
            }
            else if (file.includes('read-') || file.includes('.test.')) {
                filesRead.push(file);
            }
            else {
                filesModified.push(file);
            }
        });
        return {
            task_id: taskMetadata.task_id,
            task_name: taskMetadata.task_name,
            files_read: filesRead,
            files_modified: filesModified,
            files_created: filesCreated,
            files_deleted: filesDeleted,
            agent: taskMetadata.agent || 'unknown',
        };
    }
    /**
     * Generate collision report
     */
    generateCollisionReport(result) {
        const lines = [];
        lines.push('═'.repeat(80));
        lines.push('FILE COLLISION DETECTION REPORT');
        lines.push('═'.repeat(80));
        lines.push('');
        if (!result.has_collision) {
            lines.push('✅ No file collisions detected');
            lines.push('   All tasks can execute in parallel safely');
            return lines.join('\n');
        }
        lines.push(`⚠️  Collision Detected: ${result.risk.toUpperCase()}`);
        lines.push(`   Conflicting Tasks: ${result.conflicting_tasks.length}`);
        lines.push(`   Conflicting Files: ${result.conflicting_files.length}`);
        lines.push(`   Resolution: ${result.resolution}`);
        lines.push('');
        lines.push('Collision Details:');
        lines.push('');
        result.details.forEach((detail, index) => {
            const riskIcon = this.getRiskIcon(result.risk);
            lines.push(`${riskIcon} File ${index + 1}: ${detail.file}`);
            lines.push(`   Tasks: ${detail.tasks.join(', ')}`);
            lines.push(`   Reason: ${detail.reason}`);
            lines.push(`   Operations:`);
            detail.operations.forEach(op => {
                lines.push(`      - ${op.task_id}: ${op.operation.toUpperCase()}`);
            });
            lines.push('');
        });
        lines.push('Recommendations:');
        lines.push(this.getResolutionRecommendation(result.resolution));
        lines.push('');
        return lines.join('\n');
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    /**
     * Build map of files to tasks accessing them
     */
    buildFileAccessMap(tasks) {
        const map = new Map();
        for (const task of tasks) {
            // Track reads
            task.files_read.forEach(file => {
                if (!map.has(file))
                    map.set(file, []);
                map.get(file).push({ task_id: task.task_id, operation: 'read' });
            });
            // Track modifications
            task.files_modified.forEach(file => {
                if (!map.has(file))
                    map.set(file, []);
                map.get(file).push({ task_id: task.task_id, operation: 'modify' });
            });
            // Track creates
            task.files_created.forEach(file => {
                if (!map.has(file))
                    map.set(file, []);
                map.get(file).push({ task_id: task.task_id, operation: 'create' });
            });
            // Track deletes
            task.files_deleted.forEach(file => {
                if (!map.has(file))
                    map.set(file, []);
                map.get(file).push({ task_id: task.task_id, operation: 'delete' });
            });
        }
        return map;
    }
    /**
     * Analyze collision for a specific file
     */
    analyzeFileCollision(file, accessList) {
        const tasks = [...new Set(accessList.map(a => a.task_id))];
        const operations = accessList;
        // Check operation types
        const hasDelete = operations.some(op => op.operation === 'delete');
        const hasModify = operations.some(op => op.operation === 'modify');
        const hasCreate = operations.some(op => op.operation === 'create');
        const onlyReads = operations.every(op => op.operation === 'read');
        let risk = CollisionRisk.NONE;
        let reason = '';
        let hasCollision = false;
        if (onlyReads) {
            // Read-only: safe
            risk = CollisionRisk.NONE;
            reason = 'Read-only access (safe for parallel execution)';
            hasCollision = false;
        }
        else if (hasDelete && (hasModify || hasCreate)) {
            // Delete + modify/create: critical
            risk = CollisionRisk.CRITICAL;
            reason = 'Destructive operation conflict (delete + modify/create)';
            hasCollision = true;
        }
        else if (hasModify && operations.filter(op => op.operation === 'modify').length > 1) {
            // Multiple modifications: high risk
            risk = CollisionRisk.HIGH;
            reason = 'Multiple tasks modifying same file';
            hasCollision = true;
        }
        else if (hasCreate && operations.filter(op => op.operation === 'create').length > 1) {
            // Multiple creates: medium risk
            risk = CollisionRisk.MEDIUM;
            reason = 'Multiple tasks creating same file';
            hasCollision = true;
        }
        else if (hasModify || hasCreate || hasDelete) {
            // Single write operation with reads: low risk
            risk = CollisionRisk.LOW;
            reason = 'Write operation with concurrent reads';
            hasCollision = true;
        }
        return {
            has_collision: hasCollision,
            risk,
            tasks,
            detail: {
                file,
                tasks,
                operations,
                reason,
            },
        };
    }
    /**
     * Determine resolution strategy based on risk
     */
    determineResolution(risk, details) {
        switch (risk) {
            case CollisionRisk.NONE:
                return ResolutionStrategy.ALLOW_PARALLEL;
            case CollisionRisk.LOW:
                return ResolutionStrategy.ALLOW_PARALLEL;
            case CollisionRisk.MEDIUM:
                return ResolutionStrategy.RESCHEDULE;
            case CollisionRisk.HIGH:
                return ResolutionStrategy.SERIALIZE;
            case CollisionRisk.CRITICAL:
                // Check if tasks can be split
                if (details.length === 1 && details[0].tasks.length === 2) {
                    return ResolutionStrategy.SERIALIZE;
                }
                return ResolutionStrategy.MANUAL_REVIEW;
            default:
                return ResolutionStrategy.MANUAL_REVIEW;
        }
    }
    /**
     * Check if resolution requires serialization
     */
    requiresSerialization(resolution) {
        return resolution === ResolutionStrategy.SERIALIZE;
    }
    /**
     * Get numeric risk level for comparison
     */
    getRiskLevel(risk) {
        const levels = {
            [CollisionRisk.NONE]: 0,
            [CollisionRisk.LOW]: 1,
            [CollisionRisk.MEDIUM]: 2,
            [CollisionRisk.HIGH]: 3,
            [CollisionRisk.CRITICAL]: 4,
        };
        return levels[risk] || 0;
    }
    /**
     * Get risk icon for display
     */
    getRiskIcon(risk) {
        const icons = {
            [CollisionRisk.NONE]: '✅',
            [CollisionRisk.LOW]: '⚠️',
            [CollisionRisk.MEDIUM]: '⚠️',
            [CollisionRisk.HIGH]: '❌',
            [CollisionRisk.CRITICAL]: '⛔',
        };
        return icons[risk] || '❓';
    }
    /**
     * Get resolution recommendation message
     */
    getResolutionRecommendation(resolution) {
        const recommendations = {
            [ResolutionStrategy.ALLOW_PARALLEL]: '   ✅ Tasks can run in parallel safely',
            [ResolutionStrategy.SERIALIZE]: '   ⚠️ Recommend sequential execution to avoid conflicts',
            [ResolutionStrategy.RESCHEDULE]: '   💡 Reschedule conflicting tasks to later wave',
            [ResolutionStrategy.MANUAL_REVIEW]: '   ⛔ Manual review required - complex conflict detected',
            [ResolutionStrategy.SPLIT_TASKS]: '   💡 Consider splitting tasks into smaller units',
        };
        return recommendations[resolution] || '   ❓ Unknown resolution strategy';
    }
    /**
     * Get total file count across all tasks
     */
    getTotalFileCount(tasks) {
        const allFiles = new Set();
        tasks.forEach(task => {
            task.files_read.forEach(f => allFiles.add(f));
            task.files_modified.forEach(f => allFiles.add(f));
            task.files_created.forEach(f => allFiles.add(f));
            task.files_deleted.forEach(f => allFiles.add(f));
        });
        return allFiles.size;
    }
}
export default CollisionDetector;
//# sourceMappingURL=collision-detector.js.map