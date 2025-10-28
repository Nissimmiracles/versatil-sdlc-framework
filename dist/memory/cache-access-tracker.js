/**
 * Cache Access Tracker
 *
 * Tracks memory file access patterns to inform cache warming decisions
 * Records: access count, recency, agent usage, context
 *
 * Part of Enhancement 7: Cache Warming Strategy
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
/**
 * Tracks memory file access patterns for cache warming optimization
 */
export class CacheAccessTracker {
    constructor(statsDir = path.join(os.homedir(), '.versatil', 'cache-access')) {
        this.patterns = new Map();
        this.recentEvents = [];
        this.MAX_RECENT_EVENTS = 1000;
        this.statsDir = statsDir;
    }
    /**
     * Initialize tracker and load historical patterns
     */
    async initialize() {
        await fs.mkdir(this.statsDir, { recursive: true });
        // Load existing patterns
        try {
            const patternsPath = path.join(this.statsDir, 'access-patterns.json');
            if (await this.fileExists(patternsPath)) {
                const data = await fs.readFile(patternsPath, 'utf-8');
                const parsed = JSON.parse(data, this.dateReviver);
                for (const [path, pattern] of Object.entries(parsed)) {
                    this.patterns.set(path, pattern);
                }
            }
        }
        catch (error) {
            console.error('[CacheAccessTracker] Failed to load patterns:', error);
        }
        // Load recent events
        try {
            const eventsPath = path.join(this.statsDir, 'recent-events.json');
            if (await this.fileExists(eventsPath)) {
                const data = await fs.readFile(eventsPath, 'utf-8');
                this.recentEvents = JSON.parse(data, this.dateReviver);
            }
        }
        catch (error) {
            console.error('[CacheAccessTracker] Failed to load events:', error);
        }
    }
    /**
     * Record an access event
     */
    async recordAccess(memoryPath, agentId, operation = 'view', context) {
        const event = {
            path: memoryPath,
            timestamp: new Date(),
            agentId,
            operation,
            context
        };
        // Add to recent events
        this.recentEvents.push(event);
        if (this.recentEvents.length > this.MAX_RECENT_EVENTS) {
            this.recentEvents = this.recentEvents.slice(-this.MAX_RECENT_EVENTS);
        }
        // Update pattern
        const pattern = this.patterns.get(memoryPath);
        if (pattern) {
            // Update existing pattern
            pattern.accessCount++;
            pattern.recentAccessCount = this.countRecentAccesses(memoryPath, 7); // Last 7 days
            // Update average access interval
            const intervalHours = (new Date().getTime() - pattern.lastAccessed.getTime()) / (1000 * 60 * 60);
            pattern.avgAccessInterval = (pattern.avgAccessInterval * (pattern.accessCount - 1) + intervalHours) / pattern.accessCount;
            pattern.lastAccessed = new Date();
            pattern.agentId = agentId; // Update to most recent agent
        }
        else {
            // Create new pattern
            this.patterns.set(memoryPath, {
                path: memoryPath,
                accessCount: 1,
                lastAccessed: new Date(),
                firstAccessed: new Date(),
                agentId,
                avgAccessInterval: 0,
                recentAccessCount: 1
            });
        }
        // Save periodically (every 10 accesses)
        if (this.recentEvents.length % 10 === 0) {
            await this.save();
        }
    }
    /**
     * Get top N most accessed patterns
     */
    async getTopPatterns(limit = 10) {
        return Array.from(this.patterns.values())
            .sort((a, b) => {
            // Sort by: recent access count (60%), total access count (30%), recency (10%)
            const scoreA = (a.recentAccessCount * 0.6) + (a.accessCount * 0.3) + (this.recencyScore(a.lastAccessed) * 0.1);
            const scoreB = (b.recentAccessCount * 0.6) + (b.accessCount * 0.3) + (this.recencyScore(b.lastAccessed) * 0.1);
            return scoreB - scoreA;
        })
            .slice(0, limit);
    }
    /**
     * Get patterns for specific agent
     */
    async getPatternsByAgent(agentId) {
        return Array.from(this.patterns.values())
            .filter(p => p.agentId === agentId)
            .sort((a, b) => b.accessCount - a.accessCount);
    }
    /**
     * Get patterns accessed recently (last N days)
     */
    async getRecentPatterns(days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return Array.from(this.patterns.values())
            .filter(p => p.lastAccessed > cutoff)
            .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
    }
    /**
     * Get patterns likely to be accessed next
     * Based on: recent access, regular intervals, agent patterns
     */
    async predictNextPatterns(currentAgentId) {
        const now = Date.now();
        const predictions = [];
        for (const pattern of this.patterns.values()) {
            let score = 0;
            // Factor 1: High recent access count (40%)
            score += (pattern.recentAccessCount / 10) * 40;
            // Factor 2: Regular access intervals (30%)
            if (pattern.avgAccessInterval > 0) {
                const hoursSinceLastAccess = (now - pattern.lastAccessed.getTime()) / (1000 * 60 * 60);
                const expectedNextAccess = pattern.avgAccessInterval;
                // If we're near the expected next access time, boost score
                if (Math.abs(hoursSinceLastAccess - expectedNextAccess) < 2) {
                    score += 30;
                }
            }
            // Factor 3: Same agent (20%)
            if (currentAgentId && pattern.agentId === currentAgentId) {
                score += 20;
            }
            // Factor 4: Very recent access (10%)
            const hoursSinceAccess = (now - pattern.lastAccessed.getTime()) / (1000 * 60 * 60);
            if (hoursSinceAccess < 1) {
                score += 10;
            }
            if (score > 20) { // Only include if score > 20
                predictions.push({ pattern, score });
            }
        }
        return predictions
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(p => p.pattern);
    }
    /**
     * Count recent accesses for a path
     */
    countRecentAccesses(memoryPath, days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return this.recentEvents.filter(e => e.path === memoryPath && e.timestamp > cutoff).length;
    }
    /**
     * Calculate recency score (0-100)
     */
    recencyScore(lastAccessed) {
        const hoursSince = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 1)
            return 100;
        if (hoursSince < 24)
            return 80;
        if (hoursSince < 168)
            return 50; // 1 week
        if (hoursSince < 720)
            return 20; // 1 month
        return 0;
    }
    /**
     * Save patterns and events to disk
     */
    async save() {
        try {
            // Save patterns
            const patternsPath = path.join(this.statsDir, 'access-patterns.json');
            const patternsData = Object.fromEntries(this.patterns.entries());
            await fs.writeFile(patternsPath, JSON.stringify(patternsData, null, 2));
            // Save recent events
            const eventsPath = path.join(this.statsDir, 'recent-events.json');
            await fs.writeFile(eventsPath, JSON.stringify(this.recentEvents, null, 2));
        }
        catch (error) {
            console.error('[CacheAccessTracker] Failed to save:', error);
        }
    }
    /**
     * Clean up old patterns (not accessed in 90+ days)
     */
    async cleanup() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const original = this.patterns.size;
        for (const [path, pattern] of this.patterns.entries()) {
            if (pattern.lastAccessed < cutoff) {
                this.patterns.delete(path);
            }
        }
        await this.save();
        return original - this.patterns.size;
    }
    /**
     * Get statistics
     */
    getStatistics() {
        let totalAccesses = 0;
        let mostAccessed = null;
        let mostRecent = null;
        for (const pattern of this.patterns.values()) {
            totalAccesses += pattern.accessCount;
            if (!mostAccessed || pattern.accessCount > mostAccessed.accessCount) {
                mostAccessed = pattern;
            }
            if (!mostRecent || pattern.lastAccessed > mostRecent) {
                mostRecent = pattern.lastAccessed;
            }
        }
        return {
            totalPatterns: this.patterns.size,
            recentEvents: this.recentEvents.length,
            avgAccessCount: this.patterns.size > 0 ? Math.round(totalAccesses / this.patterns.size) : 0,
            mostAccessedFile: mostAccessed?.path || null,
            mostRecentAccess: mostRecent
        };
    }
    // Helper methods
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    dateReviver(key, value) {
        if ((key === 'timestamp' || key === 'lastAccessed' || key === 'firstAccessed') && typeof value === 'string') {
            return new Date(value);
        }
        return value;
    }
}
/**
 * Singleton instance for global access
 */
let globalAccessTracker = null;
export function getGlobalAccessTracker() {
    if (!globalAccessTracker) {
        globalAccessTracker = new CacheAccessTracker();
    }
    return globalAccessTracker;
}
export function setGlobalAccessTracker(tracker) {
    globalAccessTracker = tracker;
}
//# sourceMappingURL=cache-access-tracker.js.map