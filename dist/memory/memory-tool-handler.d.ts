/**
 * VERSATIL Memory Tool Handler
 *
 * Implements Claude's Memory Tool API for cross-session learning
 *
 * Features:
 * - File operations (view, create, str_replace, insert, delete, rename)
 * - Path validation and security
 * - Memory directory management
 * - Pattern storage and retrieval
 *
 * Reference: https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
 */
export interface MemoryToolOperation {
    type: 'view' | 'create' | 'str_replace' | 'insert' | 'delete' | 'rename';
    path: string;
    content?: string;
    oldStr?: string;
    newStr?: string;
    insertLine?: number;
    newPath?: string;
}
export interface MemoryToolResult {
    success: boolean;
    message?: string;
    content?: string;
    error?: string;
}
/**
 * Memory Tool Handler
 *
 * Handles all memory operations with security validation
 */
export declare class MemoryToolHandler {
    private readonly baseDir;
    constructor();
    /**
     * Initialize memory directory structure
     *
     * Creates ~/.versatil/memories/ with agent subdirectories
     * and template files
     */
    initialize(): Promise<void>;
    /**
     * Execute memory tool operation
     */
    execute(operation: MemoryToolOperation, agentId?: string): Promise<MemoryToolResult>;
    /**
     * Track memory operation in statistics
     */
    private trackOperation;
    /**
     * Estimate token usage for content
     * Rough approximation: 1 token ≈ 4 characters
     */
    private estimateTokenUsage;
    /**
     * VIEW operation: Show directory or file contents
     */
    private view;
    /**
     * CREATE operation: Create or overwrite file
     */
    private create;
    /**
     * STR_REPLACE operation: Replace text in file
     */
    private strReplace;
    /**
     * INSERT operation: Insert text at specific line
     */
    private insert;
    /**
     * DELETE operation: Remove file or directory
     */
    private delete;
    /**
     * RENAME operation: Move or rename file/directory
     */
    private rename;
    /**
     * Validate path for security
     *
     * Prevents directory traversal attacks
     */
    private validatePath;
    /**
     * Get memory statistics
     */
    getStats(): Promise<MemoryStats>;
    /**
     * Get directory statistics (recursive)
     */
    private getDirectoryStats;
    /**
     * Cleanup old cached documentation
     */
    cleanupCache(): Promise<void>;
    /**
     * Find all cache files recursively
     */
    private findCacheFiles;
}
export interface MemoryStats {
    totalSizeMB: number;
    fileCount: number;
    maxSizeMB: number;
    cleanupThreshold: number;
    needsCleanup: boolean;
}
/**
 * Global Memory Tool instance
 */
export declare const memoryToolHandler: MemoryToolHandler;
