/**
 * VERSATIL OPERA v6.1.0 - Reorganization Engine
 *
 * Suggests and applies project structure reorganization with safe rollback
 *
 * Features (v6.1.0):
 * - Safe auto-apply with automatic backups
 * - Incremental execution with validation
 * - Automatic rollback on failure
 * - Dry-run mode for preview
 * - Version-specific migrations
 */
import { VERSATILLogger } from '../../../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class ReorganizationEngine {
    constructor(projectRoot) {
        this.logger = new VERSATILLogger('ReorganizationEngine');
        this.projectRoot = projectRoot;
    }
    async createPlan(scanResult) {
        const actions = [];
        // Suggest creating missing standard directories
        if (!scanResult.structure.hasSourceDir) {
            actions.push({
                type: 'create_directory',
                description: 'Create src/ directory for source code',
                to: 'src',
                autoApplicable: false
            });
        }
        if (!scanResult.structure.hasTestDir) {
            actions.push({
                type: 'create_directory',
                description: 'Create tests/ directory for test files',
                to: 'tests',
                autoApplicable: true
            });
        }
        if (!scanResult.structure.hasDocsDir) {
            actions.push({
                type: 'create_directory',
                description: 'Create docs/ directory for documentation',
                to: 'docs',
                autoApplicable: true
            });
        }
        return {
            actions,
            estimatedMinutes: actions.length * 2,
            impact: actions.length > 3 ? 'high' : 'low'
        };
    }
    /**
     * Apply reorganization plan (legacy - no backup)
     *
     * @deprecated Use applyPlanSafe() instead for automatic backups and rollback
     */
    async applyPlan(plan) {
        for (const action of plan.actions) {
            if (action.type === 'create_directory' && action.autoApplicable) {
                await fs.mkdir(path.join(this.projectRoot, action.to), { recursive: true });
                this.logger.info(`Created ${action.to}`);
            }
        }
    }
    /**
     * Apply reorganization plan safely (v6.1.0)
     *
     * Features:
     * - Automatic backup before changes
     * - Dry-run mode for preview
     * - Incremental execution with validation
     * - Automatic rollback on failure
     *
     * @param plan - Reorganization plan
     * @param options - Apply options
     * @returns Apply result
     */
    async applyPlanSafe(plan, options = {}) {
        const opts = {
            createBackup: options.createBackup ?? true,
            dryRun: options.dryRun ?? false,
            incrementalSteps: options.incrementalSteps ?? true,
            autoRollback: options.autoRollback ?? true
        };
        const result = {
            success: false,
            appliedActions: [],
            dryRun: opts.dryRun
        };
        try {
            // Step 1: Create backup
            if (opts.createBackup && !opts.dryRun) {
                result.backupPath = await this.createBackup();
                this.logger.info(`Backup created at ${result.backupPath}`);
            }
            // Step 2: Apply actions incrementally
            for (const action of plan.actions) {
                if (opts.dryRun) {
                    this.logger.info(`[DRY RUN] Would ${action.type}: ${action.description}`);
                    continue;
                }
                // Apply action
                const actionResult = await this.applyAction(action);
                if (!actionResult.success) {
                    result.failedAction = action;
                    result.error = actionResult.error;
                    this.logger.error(`Failed to apply action: ${action.description}`, actionResult.error);
                    // Rollback if enabled
                    if (opts.autoRollback && result.backupPath) {
                        this.logger.info('Auto-rolling back changes...');
                        await this.rollback(result.backupPath);
                    }
                    return result;
                }
                result.appliedActions.push(action);
                // Validate after each step if incremental
                if (opts.incrementalSteps) {
                    const valid = await this.validateAction(action);
                    if (!valid) {
                        result.failedAction = action;
                        result.error = new Error(`Validation failed for ${action.description}`);
                        if (opts.autoRollback && result.backupPath) {
                            await this.rollback(result.backupPath);
                        }
                        return result;
                    }
                }
            }
            result.success = true;
            return result;
        }
        catch (error) {
            result.error = error;
            // Rollback on unexpected error
            if (opts.autoRollback && result.backupPath && !opts.dryRun) {
                this.logger.error('Unexpected error, rolling back...', error);
                await this.rollback(result.backupPath);
            }
            return result;
        }
    }
    /**
     * Create backup of current project state
     *
     * @returns Backup directory path
     */
    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.projectRoot, '.versatil', 'backups', `pre-reorganization-${timestamp}`);
        await fs.mkdir(backupDir, { recursive: true });
        // Copy relevant files (exclude node_modules, .git)
        const filesToBackup = await this.getFilesToBackup();
        for (const file of filesToBackup) {
            const sourcePath = path.join(this.projectRoot, file);
            const destPath = path.join(backupDir, file);
            // Ensure destination directory exists
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            // Copy file
            await fs.copyFile(sourcePath, destPath);
        }
        return backupDir;
    }
    /**
     * Get list of files to backup (excludes node_modules, .git, etc.)
     */
    async getFilesToBackup() {
        const files = [];
        const walkDir = async (dir, baseDir = '') => {
            const entries = await fs.readdir(path.join(this.projectRoot, dir), { withFileTypes: true });
            for (const entry of entries) {
                const relativePath = path.join(baseDir, entry.name);
                // Skip excluded directories
                if (entry.isDirectory()) {
                    if (['node_modules', '.git', 'dist', 'build', '.versatil'].includes(entry.name)) {
                        continue;
                    }
                    await walkDir(path.join(dir, entry.name), relativePath);
                }
                else {
                    files.push(relativePath);
                }
            }
        };
        await walkDir('');
        return files;
    }
    /**
     * Apply a single reorganization action
     */
    async applyAction(action) {
        try {
            const destPath = path.join(this.projectRoot, action.to);
            switch (action.type) {
                case 'create_directory':
                    await fs.mkdir(destPath, { recursive: true });
                    this.logger.info(`Created directory: ${action.to}`);
                    break;
                case 'move_file':
                    if (!action.from) {
                        throw new Error('move_file requires "from" path');
                    }
                    const sourcePath = path.join(this.projectRoot, action.from);
                    // Ensure destination directory exists
                    await fs.mkdir(path.dirname(destPath), { recursive: true });
                    // Move file
                    await fs.rename(sourcePath, destPath);
                    this.logger.info(`Moved ${action.from} → ${action.to}`);
                    break;
                case 'rename_file':
                    if (!action.from) {
                        throw new Error('rename_file requires "from" path');
                    }
                    const oldPath = path.join(this.projectRoot, action.from);
                    await fs.rename(oldPath, destPath);
                    this.logger.info(`Renamed ${action.from} → ${action.to}`);
                    break;
                case 'create_file':
                    // Create file with default content
                    await fs.writeFile(destPath, '', 'utf8');
                    this.logger.info(`Created file: ${action.to}`);
                    break;
                default:
                    throw new Error(`Unknown action type: ${action.type}`);
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error };
        }
    }
    /**
     * Validate action was applied correctly
     */
    async validateAction(action) {
        try {
            const targetPath = path.join(this.projectRoot, action.to);
            // Check if target exists
            await fs.access(targetPath);
            // Additional validation based on action type
            if (action.type === 'create_directory') {
                const stats = await fs.stat(targetPath);
                return stats.isDirectory();
            }
            if (action.type === 'create_file' || action.type === 'move_file' || action.type === 'rename_file') {
                const stats = await fs.stat(targetPath);
                return stats.isFile();
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Validation failed for ${action.description}`, error);
            return false;
        }
    }
    /**
     * Rollback to backup state
     *
     * @param backupPath - Path to backup directory
     */
    async rollback(backupPath) {
        this.logger.info(`Rolling back from backup: ${backupPath}`);
        // Restore files from backup
        const backupFiles = await this.getFilesInDir(backupPath);
        for (const file of backupFiles) {
            const sourcePath = path.join(backupPath, file);
            const destPath = path.join(this.projectRoot, file);
            // Ensure destination directory exists
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            // Copy file back
            await fs.copyFile(sourcePath, destPath);
        }
        this.logger.info('Rollback complete');
    }
    /**
     * Get all files in a directory recursively
     */
    async getFilesInDir(dir) {
        const files = [];
        const walk = async (currentDir, baseDir = '') => {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const relativePath = path.join(baseDir, entry.name);
                if (entry.isDirectory()) {
                    await walk(path.join(currentDir, entry.name), relativePath);
                }
                else {
                    files.push(relativePath);
                }
            }
        };
        await walk(dir);
        return files;
    }
}
//# sourceMappingURL=reorganization-engine.js.map