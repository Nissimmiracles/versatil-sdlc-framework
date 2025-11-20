/**
 * VERSATIL SDLC Framework - IDE Performance Detector
 *
 * Detects IDE crash risks by analyzing:
 * - IDE type (Cursor, VSCode, JetBrains)
 * - Missing ignore files (.cursorignore, .vscode/settings.json)
 * - Large directory sizes (node_modules, dist, .git)
 * - Available RAM vs indexable size
 *
 * Part of Guardian's proactive IDE optimization system (v7.15.0+)
 *
 * @version 7.15.0
 */
export type IDEType = 'cursor' | 'vscode' | 'jetbrains' | 'unknown';
export type CrashRisk = 'low' | 'medium' | 'high' | 'critical';
export interface IDECrashRisk {
    ide_type: IDEType;
    crash_risk: CrashRisk;
    confidence: number;
    evidence: {
        missing_ignore_files: string[];
        large_directories: Array<{
            path: string;
            size_mb: number;
        }>;
        total_indexable_size_gb: number;
        available_ram_gb: number;
        current_memory_usage_percent: number;
        ide_memory_usage_mb?: number;
    };
    recommendation: string;
    auto_fixable: boolean;
    suggested_fixes: string[];
}
export interface DirectorySize {
    path: string;
    size_bytes: number;
    size_mb: number;
    size_gb: number;
}
/**
 * IDE Performance Detector
 * Analyzes IDE crash risk and suggests optimizations
 */
export declare class IDEPerformanceDetector {
    private static instance;
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Get singleton instance
     */
    static getInstance(projectRoot?: string): IDEPerformanceDetector;
    /**
     * Detect IDE crash risk
     * Returns comprehensive analysis with confidence scoring
     */
    detectCrashRisk(): Promise<IDECrashRisk>;
    /**
     * Detect IDE type from running processes
     */
    private detectIDEType;
    /**
     * Check for missing IDE ignore files
     */
    private checkMissingIgnoreFiles;
    /**
     * Detect large directories that should be ignored
     * Returns directories > 10MB
     */
    private detectLargeDirectories;
    /**
     * Get system memory information
     */
    private getSystemMemoryInfo;
    /**
     * Calculate crash risk based on evidence
     */
    private calculateCrashRisk;
    /**
     * Calculate confidence in crash risk detection
     */
    private calculateConfidence;
    /**
     * Generate recommendation message
     */
    private generateRecommendation;
    /**
     * Generate suggested fixes
     */
    private generateSuggestedFixes;
}
