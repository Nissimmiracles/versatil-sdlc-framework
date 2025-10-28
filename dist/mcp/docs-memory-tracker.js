/**
 * VERSATIL Documentation Memory Tracker
 * Memory usage tracking, leak detection, and monitoring
 */
export class DocsMemoryTracker {
    constructor(options = {}) {
        this.snapshots = [];
        this.maxSnapshots = options.maxSnapshots || 100;
        this.warningThresholds = {
            heapUsagePercent: options.warningThresholds?.heapUsagePercent || 80,
            growthRateMbPerMin: options.warningThresholds?.growthRateMbPerMin || 10,
            absoluteLimitMb: options.warningThresholds?.absoluteLimitMb || 500,
        };
    }
    /**
     * Get current memory usage
     */
    getMemoryUsage(indexSize = 0, cacheSize = 0) {
        const mem = process.memoryUsage();
        return {
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            external: mem.external,
            rss: mem.rss,
            indexSize,
            cacheSize,
            estimatedTotal: mem.heapUsed + indexSize + cacheSize,
            timestamp: new Date(),
        };
    }
    /**
     * Take a snapshot of current memory usage
     */
    takeSnapshot(indexSize = 0, cacheSize = 0) {
        const mem = process.memoryUsage();
        const snapshot = {
            timestamp: new Date(),
            heapUsed: mem.heapUsed,
            indexSize,
            cacheSize,
        };
        this.snapshots.push(snapshot);
        // Trim old snapshots
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots = this.snapshots.slice(-this.maxSnapshots);
        }
    }
    /**
     * Detect potential memory leaks based on growth rate
     */
    detectMemoryLeaks() {
        if (this.snapshots.length < 10) {
            return false; // Not enough data
        }
        // Get last 10 snapshots
        const recentSnapshots = this.snapshots.slice(-10);
        // Calculate total memory for each snapshot
        const memoryValues = recentSnapshots.map(s => s.heapUsed + s.indexSize + s.cacheSize);
        // Check if memory is consistently increasing
        let increasingCount = 0;
        for (let i = 1; i < memoryValues.length; i++) {
            if (memoryValues[i] > memoryValues[i - 1]) {
                increasingCount++;
            }
        }
        // If 80% or more snapshots show increase, potential leak
        return increasingCount >= 8;
    }
    /**
     * Get memory growth rate (MB per minute)
     */
    getMemoryGrowthRate() {
        if (this.snapshots.length < 2) {
            return null;
        }
        const first = this.snapshots[0];
        const last = this.snapshots[this.snapshots.length - 1];
        const firstTotal = first.heapUsed + first.indexSize + first.cacheSize;
        const lastTotal = last.heapUsed + last.indexSize + last.cacheSize;
        const memoryGrowth = lastTotal - firstTotal; // Bytes
        const timeSpan = last.timestamp.getTime() - first.timestamp.getTime(); // ms
        if (timeSpan === 0) {
            return null;
        }
        // Convert to MB per minute
        const growthMb = memoryGrowth / (1024 * 1024);
        const timeMinutes = timeSpan / (60 * 1000);
        return growthMb / timeMinutes;
    }
    /**
     * Get memory warnings based on thresholds
     */
    getMemoryWarnings(currentUsage) {
        const warnings = [];
        // Check heap usage percentage
        const heapUsagePercent = (currentUsage.heapUsed / currentUsage.heapTotal) * 100;
        if (heapUsagePercent >= this.warningThresholds.heapUsagePercent) {
            warnings.push({
                type: 'HIGH_USAGE',
                message: `Heap usage at ${heapUsagePercent.toFixed(1)}%`,
                currentUsage: currentUsage.heapUsed,
                threshold: this.warningThresholds.heapUsagePercent,
                recommendation: 'Consider increasing heap size or reducing cache size',
            });
        }
        // Check absolute memory limit
        const totalMb = currentUsage.estimatedTotal / (1024 * 1024);
        if (totalMb >= this.warningThresholds.absoluteLimitMb) {
            warnings.push({
                type: 'HIGH_USAGE',
                message: `Total memory usage at ${totalMb.toFixed(1)}MB`,
                currentUsage: currentUsage.estimatedTotal,
                threshold: this.warningThresholds.absoluteLimitMb * 1024 * 1024,
                recommendation: 'Consider clearing cache or reducing index size',
            });
        }
        // Check memory leak
        if (this.detectMemoryLeaks()) {
            warnings.push({
                type: 'MEMORY_LEAK',
                message: 'Potential memory leak detected (consistent growth)',
                currentUsage: currentUsage.estimatedTotal,
                threshold: 0,
                recommendation: 'Investigate memory usage patterns and clear unused data',
            });
        }
        // Check growth rate
        const growthRate = this.getMemoryGrowthRate();
        if (growthRate !== null && growthRate >= this.warningThresholds.growthRateMbPerMin) {
            warnings.push({
                type: 'RAPID_GROWTH',
                message: `Memory growing at ${growthRate.toFixed(2)}MB/min`,
                currentUsage: currentUsage.estimatedTotal,
                threshold: this.warningThresholds.growthRateMbPerMin,
                recommendation: 'Check for memory leaks or excessive caching',
            });
        }
        return warnings;
    }
    /**
     * Get memory time series (last N snapshots)
     */
    getMemoryTimeSeries(duration) {
        if (!duration) {
            return [...this.snapshots];
        }
        const cutoff = Date.now() - duration;
        return this.snapshots.filter(s => s.timestamp.getTime() >= cutoff);
    }
    /**
     * Get memory statistics
     */
    getMemoryStats() {
        if (this.snapshots.length === 0) {
            return {
                avgHeapUsed: 0,
                maxHeapUsed: 0,
                minHeapUsed: 0,
                currentGrowthRate: null,
                totalSnapshots: 0,
            };
        }
        const heapValues = this.snapshots.map(s => s.heapUsed);
        return {
            avgHeapUsed: heapValues.reduce((sum, v) => sum + v, 0) / heapValues.length,
            maxHeapUsed: Math.max(...heapValues),
            minHeapUsed: Math.min(...heapValues),
            currentGrowthRate: this.getMemoryGrowthRate(),
            totalSnapshots: this.snapshots.length,
        };
    }
    /**
     * Clear all snapshots
     */
    reset() {
        this.snapshots = [];
    }
    /**
     * Format memory size for display
     */
    static formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }
    /**
     * Get memory usage summary as string
     */
    getMemoryUsageSummary(usage) {
        const lines = [];
        lines.push('Memory Usage Summary:');
        lines.push(`  Heap Used: ${DocsMemoryTracker.formatBytes(usage.heapUsed)}`);
        lines.push(`  Heap Total: ${DocsMemoryTracker.formatBytes(usage.heapTotal)}`);
        lines.push(`  Index Size: ${DocsMemoryTracker.formatBytes(usage.indexSize)}`);
        lines.push(`  Cache Size: ${DocsMemoryTracker.formatBytes(usage.cacheSize)}`);
        lines.push(`  Total Estimated: ${DocsMemoryTracker.formatBytes(usage.estimatedTotal)}`);
        const warnings = this.getMemoryWarnings(usage);
        if (warnings.length > 0) {
            lines.push('');
            lines.push('Warnings:');
            warnings.forEach(w => {
                lines.push(`  - ${w.type}: ${w.message}`);
                lines.push(`    ${w.recommendation}`);
            });
        }
        return lines.join('\n');
    }
}
//# sourceMappingURL=docs-memory-tracker.js.map