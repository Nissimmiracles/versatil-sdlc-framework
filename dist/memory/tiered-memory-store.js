/**
 * Tiered Memory Store
 *
 * Three-tier memory architecture for optimal access speed and storage efficiency:
 * - Hot tier: Last 7 days, in-memory cache, <5ms access
 * - Warm tier: 7-30 days, fast disk, <50ms access
 * - Cold tier: 30+ days, compressed, retrieval-on-demand
 *
 * Enhancement 8 of Context Engineering Suite
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
/**
 * Tiered Memory Store - Optimize access speed and storage efficiency
 *
 * Auto-promotion rules:
 * - Cold → Hot: On access if accessed 3+ times in last day
 * - Warm → Hot: On access if accessed 5+ times in last week
 * - Hot → Warm: Auto-demote after 7 days without access
 * - Warm → Cold: Auto-demote after 30 days without access
 */
export class TieredMemoryStore {
    constructor(baseDir = path.join(os.homedir(), '.versatil', 'memories-tiered')) {
        this.hotTier = new Map(); // In-memory
        this.warmTierIndex = new Map(); // Index only
        this.coldTierIndex = new Map(); // Index only
        this.HOT_TIER_MAX_DAYS = 7;
        this.WARM_TIER_MAX_DAYS = 30;
        this.HOT_TIER_MAX_SIZE_MB = 50; // 50MB max for hot tier
        this.HOT_TIER_MAX_SIZE_BYTES = this.HOT_TIER_MAX_SIZE_MB * 1024 * 1024;
        this.baseDir = baseDir;
        this.statistics = {
            hot: { count: 0, totalSize: 0, avgAccessTime: 0 },
            warm: { count: 0, totalSize: 0, avgAccessTime: 0 },
            cold: { count: 0, totalSize: 0, avgAccessTime: 0 },
            promotions: { hotToWarm: 0, warmToCold: 0, coldToHot: 0 }
        };
    }
    /**
     * Initialize tiered store
     */
    async initialize() {
        // Create tier directories
        await fs.mkdir(path.join(this.baseDir, 'hot'), { recursive: true });
        await fs.mkdir(path.join(this.baseDir, 'warm'), { recursive: true });
        await fs.mkdir(path.join(this.baseDir, 'cold'), { recursive: true });
        // Load indexes
        await this.loadIndexes();
        // Load hot tier into memory
        await this.loadHotTier();
        console.log(`[TieredMemoryStore] Initialized: ${this.hotTier.size} hot, ${this.warmTierIndex.size} warm, ${this.coldTierIndex.size} cold`);
    }
    /**
     * Store memory entry (auto-assigns to hot tier)
     */
    async store(memoryPath, content, agentId) {
        const entry = {
            path: memoryPath,
            content,
            metadata: {
                agentId,
                createdAt: new Date(),
                lastAccessed: new Date(),
                accessCount: 1,
                size: Buffer.byteLength(content, 'utf8'),
                tier: 'hot'
            }
        };
        // Store in hot tier
        this.hotTier.set(memoryPath, entry);
        // Write to disk
        await this.writeToTier('hot', memoryPath, content);
        // Update statistics
        this.statistics.hot.count = this.hotTier.size;
        this.statistics.hot.totalSize += entry.metadata.size;
        // Check if hot tier is too large
        if (this.getHotTierSize() > this.HOT_TIER_MAX_SIZE_BYTES) {
            await this.evictFromHotTier();
        }
    }
    /**
     * Retrieve memory entry (with auto-promotion)
     */
    async retrieve(memoryPath) {
        const startTime = Date.now();
        // Check hot tier first (fastest)
        if (this.hotTier.has(memoryPath)) {
            const entry = this.hotTier.get(memoryPath);
            entry.metadata.lastAccessed = new Date();
            entry.metadata.accessCount++;
            this.statistics.hot.avgAccessTime = this.updateAvgAccessTime(this.statistics.hot.avgAccessTime, Date.now() - startTime, this.hotTier.size);
            return entry.content;
        }
        // Check warm tier (moderate speed)
        if (this.warmTierIndex.has(memoryPath)) {
            const metadata = this.warmTierIndex.get(memoryPath);
            const content = await this.readFromTier('warm', memoryPath);
            if (content) {
                metadata.lastAccessed = new Date();
                metadata.accessCount++;
                // Promote to hot if accessed frequently
                if (this.shouldPromoteToHot(metadata)) {
                    await this.promoteToHot(memoryPath, content, metadata);
                }
                this.statistics.warm.avgAccessTime = this.updateAvgAccessTime(this.statistics.warm.avgAccessTime, Date.now() - startTime, this.warmTierIndex.size);
                return content;
            }
        }
        // Check cold tier (slowest, requires decompression)
        if (this.coldTierIndex.has(memoryPath)) {
            const metadata = this.coldTierIndex.get(memoryPath);
            const content = await this.readFromTier('cold', memoryPath, true); // decompress
            if (content) {
                metadata.lastAccessed = new Date();
                metadata.accessCount++;
                // Promote to hot if accessed multiple times recently
                if (this.shouldPromoteToHot(metadata)) {
                    await this.promoteToHot(memoryPath, content, metadata);
                }
                this.statistics.cold.avgAccessTime = this.updateAvgAccessTime(this.statistics.cold.avgAccessTime, Date.now() - startTime, this.coldTierIndex.size);
                return content;
            }
        }
        return null;
    }
    /**
     * Delete memory entry from all tiers
     */
    async delete(memoryPath) {
        let deleted = false;
        // Delete from hot tier
        if (this.hotTier.has(memoryPath)) {
            const entry = this.hotTier.get(memoryPath);
            this.statistics.hot.totalSize -= entry.metadata.size;
            this.statistics.hot.count--;
            this.hotTier.delete(memoryPath);
            await this.deleteFromTier('hot', memoryPath);
            deleted = true;
        }
        // Delete from warm tier
        if (this.warmTierIndex.has(memoryPath)) {
            const metadata = this.warmTierIndex.get(memoryPath);
            this.statistics.warm.totalSize -= metadata.size;
            this.statistics.warm.count--;
            this.warmTierIndex.delete(memoryPath);
            await this.deleteFromTier('warm', memoryPath);
            deleted = true;
        }
        // Delete from cold tier
        if (this.coldTierIndex.has(memoryPath)) {
            const metadata = this.coldTierIndex.get(memoryPath);
            this.statistics.cold.totalSize -= metadata.size;
            this.statistics.cold.count--;
            this.coldTierIndex.delete(memoryPath);
            await this.deleteFromTier('cold', memoryPath);
            deleted = true;
        }
        return deleted;
    }
    /**
     * Run tier migration (move entries between tiers based on age/access)
     */
    async runMigration() {
        console.log('[TieredMemoryStore] Starting tier migration...');
        let hotToWarm = 0;
        let warmToCold = 0;
        const coldToWarm = 0;
        // Demote old hot entries to warm
        for (const [path, entry] of this.hotTier.entries()) {
            if (this.shouldDemoteToWarm(entry.metadata)) {
                await this.demoteToWarm(path, entry);
                hotToWarm++;
            }
        }
        // Demote old warm entries to cold
        for (const [path, metadata] of this.warmTierIndex.entries()) {
            if (this.shouldDemoteToCold(metadata)) {
                await this.demoteToCold(path, metadata);
                warmToCold++;
            }
        }
        // Update statistics
        this.statistics.promotions.hotToWarm += hotToWarm;
        this.statistics.promotions.warmToCold += warmToCold;
        this.statistics.promotions.coldToHot += coldToWarm;
        console.log(`[TieredMemoryStore] Migration complete: ${hotToWarm} hot→warm, ${warmToCold} warm→cold`);
        return { hotToWarm, warmToCold, coldToWarm };
    }
    /**
     * Promote entry to hot tier
     */
    async promoteToHot(memoryPath, content, metadata) {
        const previousTier = metadata.tier;
        // Remove from previous tier
        if (previousTier === 'warm') {
            this.warmTierIndex.delete(memoryPath);
            await this.deleteFromTier('warm', memoryPath);
            this.statistics.warm.count--;
        }
        else if (previousTier === 'cold') {
            this.coldTierIndex.delete(memoryPath);
            await this.deleteFromTier('cold', memoryPath);
            this.statistics.cold.count--;
            this.statistics.promotions.coldToHot++;
        }
        // Add to hot tier
        const entry = {
            path: memoryPath,
            content,
            metadata: {
                ...metadata,
                tier: 'hot',
                lastAccessed: new Date()
            }
        };
        this.hotTier.set(memoryPath, entry);
        await this.writeToTier('hot', memoryPath, content);
        this.statistics.hot.count = this.hotTier.size;
        this.statistics.hot.totalSize += entry.metadata.size;
        console.log(`[TieredMemoryStore] Promoted ${memoryPath} from ${previousTier} to hot`);
    }
    /**
     * Demote entry to warm tier
     */
    async demoteToWarm(memoryPath, entry) {
        // Remove from hot tier
        this.hotTier.delete(memoryPath);
        await this.deleteFromTier('hot', memoryPath);
        this.statistics.hot.count--;
        this.statistics.hot.totalSize -= entry.metadata.size;
        // Add to warm tier
        entry.metadata.tier = 'warm';
        this.warmTierIndex.set(memoryPath, entry.metadata);
        await this.writeToTier('warm', memoryPath, entry.content);
        this.statistics.warm.count = this.warmTierIndex.size;
        this.statistics.warm.totalSize += entry.metadata.size;
    }
    /**
     * Demote entry to cold tier (with compression)
     */
    async demoteToCold(memoryPath, metadata) {
        // Read content from warm tier
        const content = await this.readFromTier('warm', memoryPath);
        if (!content)
            return;
        // Remove from warm tier
        this.warmTierIndex.delete(memoryPath);
        await this.deleteFromTier('warm', memoryPath);
        this.statistics.warm.count--;
        this.statistics.warm.totalSize -= metadata.size;
        // Add to cold tier (compressed)
        metadata.tier = 'cold';
        this.coldTierIndex.set(memoryPath, metadata);
        await this.writeToTier('cold', memoryPath, content, true); // compress
        this.statistics.cold.count = this.coldTierIndex.size;
        this.statistics.cold.totalSize += metadata.size;
    }
    /**
     * Check if entry should be promoted to hot
     */
    shouldPromoteToHot(metadata) {
        const daysSinceAccess = this.daysSince(metadata.lastAccessed);
        // Accessed recently and frequently → promote
        return metadata.accessCount >= 3 && daysSinceAccess < 1;
    }
    /**
     * Check if entry should be demoted to warm
     */
    shouldDemoteToWarm(metadata) {
        return this.daysSince(metadata.lastAccessed) > this.HOT_TIER_MAX_DAYS;
    }
    /**
     * Check if entry should be demoted to cold
     */
    shouldDemoteToCold(metadata) {
        return this.daysSince(metadata.lastAccessed) > this.WARM_TIER_MAX_DAYS;
    }
    /**
     * Evict least recently used entry from hot tier
     */
    async evictFromHotTier() {
        let oldest = null;
        for (const [path, entry] of this.hotTier.entries()) {
            if (!oldest || entry.metadata.lastAccessed < oldest.entry.metadata.lastAccessed) {
                oldest = { path, entry };
            }
        }
        if (oldest) {
            await this.demoteToWarm(oldest.path, oldest.entry);
            console.log(`[TieredMemoryStore] Evicted ${oldest.path} from hot tier (size limit reached)`);
        }
    }
    /**
     * Get hot tier total size
     */
    getHotTierSize() {
        let total = 0;
        for (const entry of this.hotTier.values()) {
            total += entry.metadata.size;
        }
        return total;
    }
    /**
     * Load indexes from disk
     */
    async loadIndexes() {
        // Load warm tier index
        try {
            const warmIndexPath = path.join(this.baseDir, 'warm', 'index.json');
            if (await this.fileExists(warmIndexPath)) {
                const data = await fs.readFile(warmIndexPath, 'utf-8');
                const parsed = JSON.parse(data, this.dateReviver);
                this.warmTierIndex = new Map(Object.entries(parsed));
            }
        }
        catch (error) {
            console.error('[TieredMemoryStore] Failed to load warm index:', error);
        }
        // Load cold tier index
        try {
            const coldIndexPath = path.join(this.baseDir, 'cold', 'index.json');
            if (await this.fileExists(coldIndexPath)) {
                const data = await fs.readFile(coldIndexPath, 'utf-8');
                const parsed = JSON.parse(data, this.dateReviver);
                this.coldTierIndex = new Map(Object.entries(parsed));
            }
        }
        catch (error) {
            console.error('[TieredMemoryStore] Failed to load cold index:', error);
        }
    }
    /**
     * Load hot tier into memory
     */
    async loadHotTier() {
        const hotDir = path.join(this.baseDir, 'hot');
        const files = await fs.readdir(hotDir).catch(() => []);
        for (const file of files) {
            if (file === 'index.json')
                continue;
            const filePath = path.join(hotDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const stats = await fs.stat(filePath);
            this.hotTier.set(file, {
                path: file,
                content,
                metadata: {
                    createdAt: stats.birthtime,
                    lastAccessed: stats.atime,
                    accessCount: 1,
                    size: stats.size,
                    tier: 'hot'
                }
            });
        }
    }
    /**
     * Write to tier
     */
    async writeToTier(tier, memoryPath, content, compress = false) {
        const tierDir = path.join(this.baseDir, tier);
        const filePath = path.join(tierDir, memoryPath + (compress ? '.gz' : ''));
        if (compress) {
            // Write compressed
            const input = Buffer.from(content, 'utf8');
            await pipeline(async function* () { yield input; }(), createGzip(), createWriteStream(filePath));
        }
        else {
            // Write uncompressed
            await fs.writeFile(filePath, content, 'utf-8');
        }
    }
    /**
     * Read from tier
     */
    async readFromTier(tier, memoryPath, decompress = false) {
        const tierDir = path.join(this.baseDir, tier);
        const filePath = path.join(tierDir, memoryPath + (decompress ? '.gz' : ''));
        if (!(await this.fileExists(filePath))) {
            return null;
        }
        if (decompress) {
            // Read compressed
            const chunks = [];
            await pipeline(createReadStream(filePath), createGunzip(), async function (source) {
                for await (const chunk of source) {
                    chunks.push(chunk);
                }
            });
            return Buffer.concat(chunks).toString('utf8');
        }
        else {
            // Read uncompressed
            return await fs.readFile(filePath, 'utf-8');
        }
    }
    /**
     * Delete from tier
     */
    async deleteFromTier(tier, memoryPath) {
        const tierDir = path.join(this.baseDir, tier);
        const filePath = path.join(tierDir, memoryPath);
        const filePathGz = filePath + '.gz';
        try {
            await fs.unlink(filePath).catch(() => { });
            await fs.unlink(filePathGz).catch(() => { });
        }
        catch (error) {
            console.error(`[TieredMemoryStore] Failed to delete from ${tier}:`, error);
        }
    }
    /**
     * Get statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
    /**
     * Update average access time
     */
    updateAvgAccessTime(currentAvg, newTime, count) {
        return (currentAvg * (count - 1) + newTime) / count;
    }
    /**
     * Calculate days since date
     */
    daysSince(date) {
        return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    }
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
        if ((key === 'createdAt' || key === 'lastAccessed') && typeof value === 'string') {
            return new Date(value);
        }
        return value;
    }
}
/**
 * Singleton instance
 */
let globalTieredStore = null;
export function getGlobalTieredStore() {
    if (!globalTieredStore) {
        globalTieredStore = new TieredMemoryStore();
    }
    return globalTieredStore;
}
//# sourceMappingURL=tiered-memory-store.js.map