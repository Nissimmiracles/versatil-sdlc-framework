/**
 * VERSATIL Memory Tool Operations
 *
 * Implements 6 core memory operations:
 * - view: Read memory file or list directory
 * - create: Create or overwrite memory file
 * - str_replace: Replace text in memory file
 * - insert: Insert text at specific line
 * - delete: Remove memory file
 * - rename: Rename or move memory file
 *
 * All operations include:
 * - File validation
 * - Error handling
 * - Security checks (path traversal prevention)
 * - Markdown format support
 *
 * Reference: https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
 */
/**
 * Memory Tool operation types
 */
export type MemoryOperationType = 'view' | 'create' | 'str_replace' | 'insert' | 'delete' | 'rename';
/**
 * Base operation interface
 */
export interface BaseMemoryOperation {
    /** Operation type */
    type: MemoryOperationType;
    /** Path to file/directory (relative to ~/.versatil/memories/) */
    path: string;
}
/**
 * VIEW operation: Show directory or file contents
 *
 * @example
 * // View directory
 * { type: 'view', path: 'maria-qa' }
 * // Returns: List of files in maria-qa/
 *
 * // View file
 * { type: 'view', path: 'maria-qa/test-patterns.md' }
 * // Returns: File contents
 */
export interface ViewOperation extends BaseMemoryOperation {
    type: 'view';
}
/**
 * CREATE operation: Create or overwrite file
 *
 * @example
 * {
 *   type: 'create',
 *   path: 'maria-qa/oauth-test-pattern.md',
 *   content: '# OAuth2 Testing Pattern\n...'
 * }
 */
export interface CreateOperation extends BaseMemoryOperation {
    type: 'create';
    /** File content */
    content: string;
}
/**
 * STR_REPLACE operation: Replace text in file
 *
 * @example
 * {
 *   type: 'str_replace',
 *   path: 'maria-qa/test-patterns.md',
 *   oldStr: 'jest.fn()',
 *   newStr: 'vi.fn()'
 * }
 */
export interface StrReplaceOperation extends BaseMemoryOperation {
    type: 'str_replace';
    /** String to find */
    oldStr: string;
    /** Replacement string */
    newStr: string;
    /** Whether to replace all occurrences (default: false) */
    replaceAll?: boolean;
}
/**
 * INSERT operation: Insert text at specific line
 *
 * @example
 * {
 *   type: 'insert',
 *   path: 'maria-qa/test-patterns.md',
 *   insertLine: 5,
 *   content: '## New Section\n'
 * }
 */
export interface InsertOperation extends BaseMemoryOperation {
    type: 'insert';
    /** Line number to insert at (0-based) */
    insertLine: number;
    /** Content to insert */
    content: string;
}
/**
 * DELETE operation: Remove file or directory
 *
 * @example
 * { type: 'delete', path: 'maria-qa/old-pattern.md' }
 */
export interface DeleteOperation extends BaseMemoryOperation {
    type: 'delete';
}
/**
 * RENAME operation: Move or rename file/directory
 *
 * @example
 * {
 *   type: 'rename',
 *   path: 'maria-qa/old-name.md',
 *   newPath: 'maria-qa/new-name.md'
 * }
 */
export interface RenameOperation extends BaseMemoryOperation {
    type: 'rename';
    /** New path */
    newPath: string;
}
/**
 * Union type of all memory operations
 */
export type MemoryOperation = ViewOperation | CreateOperation | StrReplaceOperation | InsertOperation | DeleteOperation | RenameOperation;
/**
 * Operation result
 */
export interface MemoryOperationResult {
    /** Whether operation succeeded */
    success: boolean;
    /** Success or error message */
    message?: string;
    /** File/directory content (for view operation) */
    content?: string;
    /** Error details (if failed) */
    error?: string;
    /** Operation metadata */
    metadata?: {
        /** Path that was operated on */
        path: string;
        /** Operation type */
        operation: MemoryOperationType;
        /** Timestamp */
        timestamp: string;
        /** Estimated tokens used */
        tokensUsed?: number;
    };
}
/**
 * Memory Tool Operations Handler
 *
 * Implements all 6 memory operations with validation and security
 */
export declare class MemoryToolOperations {
    private readonly baseDir;
    constructor(baseDir?: string);
    /**
     * Execute a memory operation
     *
     * @param operation - Memory operation to execute
     * @returns Operation result
     */
    execute(operation: MemoryOperation): Promise<MemoryOperationResult>;
    /**
     * VIEW operation implementation
     */
    private view;
    /**
     * CREATE operation implementation
     */
    private create;
    /**
     * STR_REPLACE operation implementation
     */
    private strReplace;
    /**
     * INSERT operation implementation
     */
    private insert;
    /**
     * DELETE operation implementation
     */
    private delete;
    /**
     * RENAME operation implementation
     */
    private rename;
    /**
     * Validate path for security
     *
     * Prevents directory traversal attacks
     */
    private isValidPath;
    /**
     * Get full path from relative path
     */
    private getFullPath;
    /**
     * Create error result
     */
    private errorResult;
    /**
     * Estimate token usage for content
     *
     * Rough approximation: 1 token ≈ 4 characters
     */
    private estimateTokenUsage;
}
/**
 * Global operations instance
 */
export declare const memoryToolOperations: MemoryToolOperations;
export default MemoryToolOperations;
