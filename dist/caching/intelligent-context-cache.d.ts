/**
 * Intelligent Context Caching Layer
 * Provides 10x faster environmental analyses through smart caching strategies
 *
 * Features:
 * - Multi-layer caching (memory, disk, distributed)
 * - Intelligent invalidation based on file changes
 * - Context similarity detection for cache hits
 * - Learning from cache patterns for optimization
 * - Cross-project knowledge sharing
 * - Predictive pre-caching
 */
import { EventEmitter } from 'events';
export interface CacheEntry {
    id: string;
    key: string;
    data: any;
    metadata: {
        projectPath: string;
        filePatterns: string[];
        dependencies: string[];
        timestamp: number;
        accessCount: number;
        lastAccessed: number;
        size: number;
        tags: string[];
        similarity: number;
    };
    expiry?: number;
    invalidationRules: InvalidationRule[];
}
export interface InvalidationRule {
    type: 'file_change' | 'dependency_update' | 'time_based' | 'manual';
    pattern?: string;
    maxAge?: number;
    condition?: (entry: CacheEntry) => boolean;
}
export interface CacheConfig {
    memoryLimit: number;
    diskLimit: number;
    ttl: number;
    maxEntries: number;
    persistentStorage: boolean;
    distributedMode: boolean;
    learningEnabled: boolean;
    preloadPatterns: string[];
    compressionEnabled: boolean;
    encryptionKey?: string;
}
export interface ContextScanResult {
    projectStructure: any;
    dependencies: any;
    configurations: any;
    codeMetrics: any;
    agentRecommendations: any;
    patterns: any;
    timestamp: number;
    scanDuration: number;
}
export interface CacheStats {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    averageResponseTime: number;
    memoryUsage: number;
    diskUsage: number;
    entriesCount: number;
    topPatterns: Array<{
        pattern: string;
        hits: number;
    }>;
    recentActivity: Array<{
        timestamp: number;
        operation: string;
        key: string;
    }>;
}
export interface SimilarityMatch {
    entry: CacheEntry;
    similarity: number;
    confidence: number;
    reasons: string[];
}
export declare class IntelligentContextCache extends EventEmitter {
    private memoryCache;
    private diskCachePath;
    private config;
    private stats;
    private watchers;
    private learningData;
    private similarityThreshold;
    private compressionLevel;
    constructor(config?: Partial<CacheConfig>);
    private initializeStats;
    private initialize;
    get(key: string, projectPath?: string): Promise<any | null>;
    set(key: string, data: any, metadata?: Partial<CacheEntry['metadata']>, invalidationRules?: InvalidationRule[]): Promise<void>;
    invalidate(key: string): Promise<void>;
    clear(): Promise<void>;
    warmup(projectPath: string): Promise<void>;
    scanAndCache(projectPath: string): Promise<ContextScanResult>;
    getStats(): CacheStats;
    exportCache(filePath: string): Promise<void>;
    importCache(filePath: string): Promise<void>;
    private findSimilarContext;
    private generateProjectSignature;
    private calculateSimilarity;
    private calculateConfidence;
    private getSimilarityReasons;
    private adaptContextForProject;
    private performContextScan;
    private analyzeProjectStructure;
    private analyzeDependencies;
    private analyzeConfigurations;
    private analyzeCodeMetrics;
    private generateAgentRecommendations;
    private analyzePatterns;
    private generateProjectCacheKey;
    private getProjectFilePatterns;
    private getProjectDependencies;
    private compareDependencies;
    private compareFileStructures;
    private compareTechnologyStacks;
    private safeReadJson;
    private getFileStructureHash;
    private hashString;
    private generateId;
    private calculateSize;
    private isExpired;
    private recordHit;
    private recordMiss;
    private recordSimilarityHit;
    private updateResponseTime;
    private addRecentActivity;
    private updateStats;
    private setupInvalidationWatchers;
    private removeWatcher;
    private loadPersistedCache;
    private loadFromDisk;
    private saveToDisk;
    private removeFromDisk;
    private enforceLimits;
    private evictLeastUsed;
    private preloadPattern;
    private loadLearningData;
    private updateLearningData;
    private startCacheMaintenance;
    private runMaintenance;
}
export default IntelligentContextCache;
