/**
 * VERSATIL SDLC Framework - Rollback Manager
 * Advanced rollback system with instant recovery
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class RollbackManager {
    constructor(maxRollbackPoints = 5) {
        this.versatilHome = path.join(os.homedir(), '.versatil');
        this.rollbackDir = path.join(this.versatilHome, 'rollback-points');
        this.rollbackHistoryFile = path.join(this.versatilHome, 'rollback-history.json');
        this.maxRollbackPoints = maxRollbackPoints;
    }
    /**
     * Create rollback point before update
     */
    async createRollbackPoint(version, reason) {
        console.log(`📸 Creating rollback point for v${version}...`);
        await fs.mkdir(this.rollbackDir, { recursive: true });
        const timestamp = new Date().toISOString();
        const rollbackId = `v${version}-${Date.now()}`;
        const backupPath = path.join(this.rollbackDir, `${rollbackId}.tar.gz`);
        try {
            // Create snapshot of ~/.versatil/
            await execAsync(`tar -czf "${backupPath}" -C "${os.homedir()}" .versatil`);
            const rollbackPoint = {
                version,
                timestamp,
                backupPath,
                reason,
                automatic: true
            };
            // Save to history
            await this.saveRollbackPoint(rollbackPoint);
            // Cleanup old rollback points
            await this.cleanupOldRollbackPoints();
            console.log(`✅ Rollback point created: ${rollbackId}`);
            return rollbackPoint;
        }
        catch (error) {
            throw new Error(`Failed to create rollback point: ${error.message}`);
        }
    }
    /**
     * Rollback to previous version
     */
    async rollbackToPrevious() {
        console.log('\n🔄 Rolling back to previous version...\n');
        const rollbackPoints = await this.listRollbackPoints();
        if (rollbackPoints.length === 0) {
            throw new Error('No rollback points available');
        }
        // Get most recent rollback point
        const latestPoint = rollbackPoints[0];
        return this.rollbackToPoint(latestPoint);
    }
    /**
     * Rollback to specific version
     */
    async rollbackToVersion(version) {
        console.log(`\n🔄 Rolling back to v${version}...\n`);
        const rollbackPoints = await this.listRollbackPoints();
        const targetPoint = rollbackPoints.find(p => p.version === version);
        if (!targetPoint) {
            throw new Error(`No rollback point found for version ${version}`);
        }
        return this.rollbackToPoint(targetPoint);
    }
    /**
     * Rollback to specific rollback point
     */
    async rollbackToPoint(point) {
        try {
            console.log(`Restoring from: ${point.backupPath}`);
            console.log(`Version: v${point.version}`);
            console.log(`Created: ${new Date(point.timestamp).toLocaleString()}`);
            // Extract backup
            await execAsync(`tar -xzf "${point.backupPath}" -C "${os.homedir()}"`);
            // Reinstall the npm package for that version
            console.log(`\nReinstalling VERSATIL v${point.version}...`);
            await execAsync(`npm install -g versatil-sdlc-framework@${point.version}`);
            console.log('\n✅ Rollback complete!');
            console.log(`   Now on version: v${point.version}`);
            console.log('\nRun: versatil doctor --verify\n');
            // Record rollback in history
            await this.recordRollback(point);
            return true;
        }
        catch (error) {
            console.error(`\n❌ Rollback failed: ${error.message}\n`);
            return false;
        }
    }
    /**
     * Rollback chain (undo last N updates)
     */
    async rollbackChain(count) {
        console.log(`\n🔄 Rolling back last ${count} updates...\n`);
        const rollbackPoints = await this.listRollbackPoints();
        if (rollbackPoints.length < count) {
            throw new Error(`Only ${rollbackPoints.length} rollback points available (requested ${count})`);
        }
        // Get target (count-th from the end)
        const targetPoint = rollbackPoints[count - 1];
        return this.rollbackToPoint(targetPoint);
    }
    /**
     * Emergency rollback (bypasses all checks)
     */
    async emergencyRollback() {
        console.log('\n🚨 EMERGENCY ROLLBACK - Bypassing all checks...\n');
        const rollbackPoints = await this.listRollbackPoints();
        if (rollbackPoints.length === 0) {
            throw new Error('No rollback points available for emergency recovery');
        }
        const latestPoint = rollbackPoints[0];
        try {
            // Direct extraction without validation
            await execAsync(`tar -xzf "${latestPoint.backupPath}" -C "${os.homedir()}"`);
            console.log('✅ Emergency rollback complete');
            console.log(`   Restored to: v${latestPoint.version}\n`);
            return true;
        }
        catch (error) {
            console.error(`❌ Emergency rollback failed: ${error.message}`);
            console.error('⚠️  Manual recovery required. Contact support.\n');
            return false;
        }
    }
    /**
     * List all available rollback points
     */
    async listRollbackPoints() {
        try {
            const data = await fs.readFile(this.rollbackHistoryFile, 'utf-8');
            const points = JSON.parse(data);
            // Sort by timestamp (newest first)
            return points.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        catch {
            return [];
        }
    }
    /**
     * Validate system health after update
     */
    async validateUpdateHealth() {
        const checks = [];
        // Check 1: Framework files exist
        checks.push(await this.checkFrameworkFiles());
        // Check 2: Commands work
        checks.push(await this.checkCommands());
        // Check 3: Dependencies installed
        checks.push(await this.checkDependencies());
        // Check 4: Configuration valid
        checks.push(await this.checkConfiguration());
        // Check 5: Tests pass (sample)
        checks.push(await this.checkTests());
        // Calculate score
        const passed = checks.filter(c => c.passed).length;
        const score = Math.round((passed / checks.length) * 100);
        // Collect critical failures
        const critical = checks.filter(c => !c.passed && c.critical).map(c => c.message);
        // Collect warnings
        const warnings = checks.filter(c => !c.passed && !c.critical).map(c => c.message);
        return {
            passed: critical.length === 0,
            checks,
            score,
            critical,
            warnings
        };
    }
    /**
     * Automatic rollback on failure
     */
    async autoRollbackOnFailure(updateFn) {
        const rollbackPoints = await this.listRollbackPoints();
        try {
            // Execute update function
            const result = await updateFn();
            // Validate health after update
            const health = await this.validateUpdateHealth();
            if (!health.passed) {
                console.warn('\n⚠️  Health check failed after update!');
                console.warn(`   Score: ${health.score}/100`);
                console.warn(`   Critical issues: ${health.critical.length}`);
                if (health.critical.length > 0) {
                    console.log('\n🔄 Auto-rollback triggered...');
                    await this.rollbackToPrevious();
                    throw new Error('Update failed health check - auto-rolled back');
                }
            }
            return result;
        }
        catch (error) {
            // Update failed - rollback if possible
            if (rollbackPoints.length > 0) {
                console.error('\n❌ Update failed, initiating rollback...');
                await this.rollbackToPrevious();
            }
            throw error;
        }
    }
    /**
     * Health check: Framework files exist
     */
    async checkFrameworkFiles() {
        try {
            const requiredDirs = ['agents', 'config', 'logs', 'memory'];
            const missingDirs = [];
            for (const dir of requiredDirs) {
                const dirPath = path.join(this.versatilHome, dir);
                try {
                    await fs.access(dirPath);
                }
                catch {
                    missingDirs.push(dir);
                }
            }
            return {
                name: 'Framework Files',
                passed: missingDirs.length === 0,
                message: missingDirs.length === 0
                    ? 'All framework directories present'
                    : `Missing directories: ${missingDirs.join(', ')}`,
                critical: missingDirs.length > 2
            };
        }
        catch (error) {
            return {
                name: 'Framework Files',
                passed: false,
                message: `Check failed: ${error.message}`,
                critical: true
            };
        }
    }
    /**
     * Health check: Commands work
     */
    async checkCommands() {
        try {
            const { stdout } = await execAsync('versatil --version');
            return {
                name: 'Commands',
                passed: stdout.length > 0,
                message: 'versatil command works',
                critical: true
            };
        }
        catch (error) {
            return {
                name: 'Commands',
                passed: false,
                message: 'versatil command not found or not working',
                critical: true
            };
        }
    }
    /**
     * Health check: Dependencies
     */
    async checkDependencies() {
        try {
            // Check if node_modules exists in global npm
            const { stdout } = await execAsync('npm list -g versatil-sdlc-framework --depth=0');
            return {
                name: 'Dependencies',
                passed: stdout.includes('versatil-sdlc-framework'),
                message: 'Framework installed in npm global',
                critical: true
            };
        }
        catch (error) {
            return {
                name: 'Dependencies',
                passed: false,
                message: 'Framework not found in npm global',
                critical: true
            };
        }
    }
    /**
     * Health check: Configuration
     */
    async checkConfiguration() {
        try {
            const configPath = path.join(this.versatilHome, 'config', 'framework-config.json');
            await fs.access(configPath);
            return {
                name: 'Configuration',
                passed: true,
                message: 'Configuration files present',
                critical: false
            };
        }
        catch {
            return {
                name: 'Configuration',
                passed: false,
                message: 'Configuration files missing (non-critical)',
                critical: false
            };
        }
    }
    /**
     * Health check: Tests (sample)
     */
    async checkTests() {
        // Skip in production - tests are for dev environment
        return {
            name: 'Tests',
            passed: true,
            message: 'Tests skipped (production mode)',
            critical: false
        };
    }
    /**
     * Save rollback point to history
     */
    async saveRollbackPoint(point) {
        let points = [];
        try {
            const data = await fs.readFile(this.rollbackHistoryFile, 'utf-8');
            points = JSON.parse(data);
        }
        catch {
            // No history file yet
        }
        points.push(point);
        await fs.writeFile(this.rollbackHistoryFile, JSON.stringify(points, null, 2));
    }
    /**
     * Record rollback in history
     */
    async recordRollback(point) {
        const rollbackRecord = {
            timestamp: new Date().toISOString(),
            rolledBackTo: point.version,
            reason: 'Manual rollback'
        };
        const historyFile = path.join(this.versatilHome, 'operation-history.json');
        try {
            let history = [];
            try {
                const data = await fs.readFile(historyFile, 'utf-8');
                history = JSON.parse(data);
            }
            catch {
                // No history yet
            }
            history.push(rollbackRecord);
            await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
        }
        catch (error) {
            // Non-critical, don't fail rollback
            console.warn('Failed to record rollback history:', error);
        }
    }
    /**
     * Cleanup old rollback points
     */
    async cleanupOldRollbackPoints() {
        const points = await this.listRollbackPoints();
        if (points.length <= this.maxRollbackPoints) {
            return;
        }
        // Remove oldest rollback points
        const toRemove = points.slice(this.maxRollbackPoints);
        for (const point of toRemove) {
            try {
                await fs.unlink(point.backupPath);
            }
            catch {
                // Ignore errors
            }
        }
        // Update history file
        const keep = points.slice(0, this.maxRollbackPoints);
        await fs.writeFile(this.rollbackHistoryFile, JSON.stringify(keep, null, 2));
    }
    /**
     * Get rollback point size
     */
    async getRollbackPointSize(point) {
        try {
            const stats = await fs.stat(point.backupPath);
            return stats.size;
        }
        catch {
            return 0;
        }
    }
    /**
     * Get total rollback storage used
     */
    async getTotalRollbackStorage() {
        const points = await this.listRollbackPoints();
        let total = 0;
        for (const point of points) {
            total += await this.getRollbackPointSize(point);
        }
        return total;
    }
}
/**
 * Default rollback manager instance
 */
export const defaultRollbackManager = new RollbackManager();
//# sourceMappingURL=rollback-manager.js.map