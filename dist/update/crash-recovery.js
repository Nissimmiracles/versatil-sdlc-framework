/**
 * VERSATIL SDLC Framework - Crash Recovery
 * Detect and resume interrupted updates
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class CrashRecoveryManager {
    constructor() {
        this.versatilHome = path.join(os.homedir(), '.versatil');
        this.stateFile = path.join(this.versatilHome, 'update-state.json');
        this.lockFile = path.join(this.versatilHome, 'update.lock');
    }
    /**
     * Check if there's an interrupted update
     */
    async hasInterruptedUpdate() {
        try {
            const state = await this.loadState();
            return state !== null && !state.completedSteps.includes('complete');
        }
        catch {
            return false;
        }
    }
    /**
     * Get interrupted update state
     */
    async getInterruptedUpdateState() {
        return await this.loadState();
    }
    /**
     * Start tracking new update
     */
    async startUpdate(fromVersion, toVersion, steps) {
        const updateId = this.generateUpdateId();
        const state = {
            updateId,
            startedAt: new Date().toISOString(),
            currentStep: steps[0].id,
            stepIndex: 0,
            totalSteps: steps.length,
            fromVersion,
            toVersion,
            steps,
            completedSteps: [],
            canResume: true
        };
        await this.saveState(state);
        await this.createLock(updateId);
        return updateId;
    }
    /**
     * Mark step as completed
     */
    async completeStep(stepId) {
        const state = await this.loadState();
        if (!state)
            return;
        state.completedSteps.push(stepId);
        const step = state.steps.find(s => s.id === stepId);
        if (step) {
            step.completed = true;
        }
        // Move to next step
        const nextIndex = state.stepIndex + 1;
        if (nextIndex < state.steps.length) {
            state.stepIndex = nextIndex;
            state.currentStep = state.steps[nextIndex].id;
        }
        await this.saveState(state);
    }
    /**
     * Mark step as failed
     */
    async failStep(stepId, error, criticalFailure = false) {
        const state = await this.loadState();
        if (!state)
            return;
        state.failedStep = stepId;
        state.error = error;
        const step = state.steps.find(s => s.id === stepId);
        if (step) {
            step.criticalFailure = criticalFailure;
        }
        state.canResume = !criticalFailure;
        await this.saveState(state);
    }
    /**
     * Complete update successfully
     */
    async completeUpdate() {
        const state = await this.loadState();
        if (!state)
            return;
        state.completedSteps.push('complete');
        state.currentStep = 'complete';
        await this.saveState(state);
        await this.removeLock();
    }
    /**
     * Abort update
     */
    async abortUpdate(reason) {
        const state = await this.loadState();
        if (!state)
            return;
        state.error = reason;
        state.canResume = false;
        await this.saveState(state);
        await this.removeLock();
    }
    /**
     * Resume interrupted update
     */
    async resumeUpdate() {
        const state = await this.loadState();
        if (!state) {
            return {
                recovered: false,
                resumedFrom: 'none',
                completedSteps: 0,
                error: 'No interrupted update found'
            };
        }
        if (!state.canResume) {
            return {
                recovered: false,
                resumedFrom: state.currentStep,
                completedSteps: state.completedSteps.length,
                error: 'Update cannot be resumed - critical failure occurred'
            };
        }
        console.log('\n🔄 Resuming interrupted update...');
        console.log(`   From: ${state.fromVersion}`);
        console.log(`   To: ${state.toVersion}`);
        console.log(`   Progress: ${state.completedSteps.length}/${state.totalSteps} steps completed`);
        console.log(`   Resuming from: ${state.currentStep}\n`);
        return {
            recovered: true,
            resumedFrom: state.currentStep,
            completedSteps: state.completedSteps.length
        };
    }
    /**
     * Clear update state
     */
    async clearState() {
        try {
            await fs.unlink(this.stateFile);
        }
        catch {
            // File doesn't exist - ok
        }
        await this.removeLock();
    }
    /**
     * Get remaining steps
     */
    async getRemainingSteps() {
        const state = await this.loadState();
        if (!state)
            return [];
        return state.steps.filter(step => !state.completedSteps.includes(step.id));
    }
    /**
     * Check if update is locked
     */
    async isUpdateLocked() {
        try {
            await fs.access(this.lockFile);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Force remove lock (emergency use only)
     */
    async forceRemoveLock() {
        await this.removeLock();
        console.log('⚠️  Update lock forcefully removed');
    }
    /**
     * Validate update can proceed
     */
    async validateCanProceed() {
        // Check if another update is in progress
        if (await this.isUpdateLocked()) {
            const state = await this.loadState();
            if (state) {
                const startedAt = new Date(state.startedAt);
                const now = new Date();
                const hoursSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
                // If update started more than 1 hour ago, consider it stale
                if (hoursSinceStart > 1) {
                    return {
                        canProceed: false,
                        reason: `Update locked since ${startedAt.toLocaleString()} (${Math.round(hoursSinceStart)}h ago). Run 'versatil update --recover' to resume or 'versatil update --force-unlock' to clear.`
                    };
                }
                return {
                    canProceed: false,
                    reason: `Update in progress: ${state.currentStep} (${state.completedSteps.length}/${state.totalSteps} completed)`
                };
            }
            // Lock exists but no state - stale lock
            return {
                canProceed: false,
                reason: `Stale update lock detected. Run 'versatil update --force-unlock' to clear.`
            };
        }
        return { canProceed: true };
    }
    /**
     * Get update progress
     */
    async getProgress() {
        const state = await this.loadState();
        if (!state) {
            return {
                percentage: 0,
                currentStep: 'none',
                completedSteps: 0
            };
        }
        const percentage = Math.round((state.completedSteps.length / state.totalSteps) * 100);
        return {
            percentage,
            currentStep: state.currentStep,
            completedSteps: state.completedSteps.length
        };
    }
    /**
     * Generate update summary
     */
    async getUpdateSummary() {
        const state = await this.loadState();
        if (!state) {
            return 'No update in progress';
        }
        const lines = [];
        lines.push('📦 Update Status:');
        lines.push(`   Version: ${state.fromVersion} → ${state.toVersion}`);
        lines.push(`   Started: ${new Date(state.startedAt).toLocaleString()}`);
        lines.push(`   Progress: ${state.completedSteps.length}/${state.totalSteps} steps`);
        lines.push(`   Current: ${state.currentStep}`);
        if (state.failedStep) {
            lines.push(`   ❌ Failed: ${state.failedStep}`);
            if (state.error) {
                lines.push(`   Error: ${state.error}`);
            }
        }
        lines.push(`   Can Resume: ${state.canResume ? 'Yes' : 'No'}`);
        return lines.join('\n');
    }
    /**
     * Load update state
     */
    async loadState() {
        try {
            const data = await fs.readFile(this.stateFile, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    /**
     * Save update state
     */
    async saveState(state) {
        await fs.mkdir(this.versatilHome, { recursive: true });
        await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
    }
    /**
     * Create lock file
     */
    async createLock(updateId) {
        await fs.mkdir(this.versatilHome, { recursive: true });
        await fs.writeFile(this.lockFile, JSON.stringify({
            updateId,
            pid: process.pid,
            createdAt: new Date().toISOString()
        }, null, 2));
    }
    /**
     * Remove lock file
     */
    async removeLock() {
        try {
            await fs.unlink(this.lockFile);
        }
        catch {
            // File doesn't exist - ok
        }
    }
    /**
     * Generate unique update ID
     */
    generateUpdateId() {
        return `update-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
    /**
     * Define standard update steps
     */
    static getStandardUpdateSteps() {
        return [
            {
                id: 'check-prerequisites',
                name: 'Check Prerequisites',
                description: 'Verify system requirements and permissions',
                completed: false,
                skippable: false,
                retryable: true,
                criticalFailure: false
            },
            {
                id: 'create-backup',
                name: 'Create Backup',
                description: 'Backup current framework state',
                completed: false,
                skippable: true,
                retryable: true,
                criticalFailure: false
            },
            {
                id: 'download-package',
                name: 'Download Package',
                description: 'Download new version from npm',
                completed: false,
                skippable: false,
                retryable: true,
                criticalFailure: false
            },
            {
                id: 'verify-package',
                name: 'Verify Package',
                description: 'Verify package integrity',
                completed: false,
                skippable: true,
                retryable: true,
                criticalFailure: false
            },
            {
                id: 'install-package',
                name: 'Install Package',
                description: 'Install new version globally',
                completed: false,
                skippable: false,
                retryable: true,
                criticalFailure: true
            },
            {
                id: 'migrate-config',
                name: 'Migrate Configuration',
                description: 'Update configuration files',
                completed: false,
                skippable: true,
                retryable: true,
                criticalFailure: false
            },
            {
                id: 'validate-installation',
                name: 'Validate Installation',
                description: 'Run health checks',
                completed: false,
                skippable: false,
                retryable: true,
                criticalFailure: true
            },
            {
                id: 'cleanup',
                name: 'Cleanup',
                description: 'Remove temporary files',
                completed: false,
                skippable: true,
                retryable: true,
                criticalFailure: false
            }
        ];
    }
}
/**
 * Default crash recovery manager instance
 */
export const defaultCrashRecovery = new CrashRecoveryManager();
//# sourceMappingURL=crash-recovery.js.map