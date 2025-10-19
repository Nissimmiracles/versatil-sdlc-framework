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

import * as fs from 'fs-extra';
import * as path from 'path';
import { MEMORY_TOOL_CONFIG } from './memory-tool-config.js';

/**
 * Memory Tool operation types
 */
export type MemoryOperationType =
  | 'view'
  | 'create'
  | 'str_replace'
  | 'insert'
  | 'delete'
  | 'rename';

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
export type MemoryOperation =
  | ViewOperation
  | CreateOperation
  | StrReplaceOperation
  | InsertOperation
  | DeleteOperation
  | RenameOperation;

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
export class MemoryToolOperations {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || MEMORY_TOOL_CONFIG.memoryDirectory;
  }

  /**
   * Execute a memory operation
   *
   * @param operation - Memory operation to execute
   * @returns Operation result
   */
  async execute(operation: MemoryOperation): Promise<MemoryOperationResult> {
    const startTime = Date.now();

    try {
      // Validate path security
      if (!this.isValidPath(operation.path)) {
        return this.errorResult(
          operation.type,
          operation.path,
          `Invalid path: ${operation.path} (security violation)`
        );
      }

      // Execute operation based on type
      let result: MemoryOperationResult;

      switch (operation.type) {
        case 'view':
          result = await this.view(operation);
          break;
        case 'create':
          result = await this.create(operation);
          break;
        case 'str_replace':
          result = await this.strReplace(operation);
          break;
        case 'insert':
          result = await this.insert(operation);
          break;
        case 'delete':
          result = await this.delete(operation);
          break;
        case 'rename':
          result = await this.rename(operation);
          break;
        default:
          // This should never happen due to TypeScript type checking
          const unknownOp = operation as any;
          return this.errorResult(
            unknownOp.type || 'unknown',
            unknownOp.path || 'unknown',
            `Unknown operation type: ${unknownOp.type}`
          );
      }

      // Add metadata
      result.metadata = {
        path: operation.path,
        operation: operation.type,
        timestamp: new Date().toISOString(),
        tokensUsed: this.estimateTokenUsage(result.content || result.message || '')
      };

      return result;
    } catch (error) {
      return this.errorResult(
        operation.type,
        operation.path,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * VIEW operation implementation
   */
  private async view(operation: ViewOperation): Promise<MemoryOperationResult> {
    const fullPath = this.getFullPath(operation.path);

    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      return this.errorResult('view', operation.path, `Path does not exist: ${operation.path}`);
    }

    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      // List directory contents
      const files = await fs.readdir(fullPath);
      const items: string[] = [];

      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const fileStats = await fs.stat(filePath);

        items.push(fileStats.isDirectory() ? `${file}/` : file);
      }

      return {
        success: true,
        message: `Directory: ${operation.path}`,
        content: items.join('\n')
      };
    } else {
      // Read file contents
      const content = await fs.readFile(fullPath, 'utf-8');

      return {
        success: true,
        message: `File: ${operation.path}`,
        content
      };
    }
  }

  /**
   * CREATE operation implementation
   */
  private async create(operation: CreateOperation): Promise<MemoryOperationResult> {
    const fullPath = this.getFullPath(operation.path);

    // Ensure parent directory exists
    await fs.ensureDir(path.dirname(fullPath));

    // Write file
    await fs.writeFile(fullPath, operation.content, 'utf-8');

    return {
      success: true,
      message: `Created/updated: ${operation.path}`
    };
  }

  /**
   * STR_REPLACE operation implementation
   */
  private async strReplace(operation: StrReplaceOperation): Promise<MemoryOperationResult> {
    const fullPath = this.getFullPath(operation.path);

    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      return this.errorResult('str_replace', operation.path, `File does not exist: ${operation.path}`);
    }

    // Read file
    let content = await fs.readFile(fullPath, 'utf-8');

    // Check if old string exists
    if (!content.includes(operation.oldStr)) {
      return this.errorResult(
        'str_replace',
        operation.path,
        `String not found in file: "${operation.oldStr}"`
      );
    }

    // Replace string (once or all occurrences)
    if (operation.replaceAll) {
      content = content.split(operation.oldStr).join(operation.newStr);
    } else {
      content = content.replace(operation.oldStr, operation.newStr);
    }

    // Write back
    await fs.writeFile(fullPath, content, 'utf-8');

    return {
      success: true,
      message: `Replaced text in: ${operation.path}`
    };
  }

  /**
   * INSERT operation implementation
   */
  private async insert(operation: InsertOperation): Promise<MemoryOperationResult> {
    const fullPath = this.getFullPath(operation.path);

    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      return this.errorResult('insert', operation.path, `File does not exist: ${operation.path}`);
    }

    // Read file
    const fileContent = await fs.readFile(fullPath, 'utf-8');
    const lines = fileContent.split('\n');

    // Validate line number
    if (operation.insertLine < 0 || operation.insertLine > lines.length) {
      return this.errorResult(
        'insert',
        operation.path,
        `Invalid line number: ${operation.insertLine} (file has ${lines.length} lines)`
      );
    }

    // Insert content
    lines.splice(operation.insertLine, 0, operation.content);

    // Write back
    await fs.writeFile(fullPath, lines.join('\n'), 'utf-8');

    return {
      success: true,
      message: `Inserted text at line ${operation.insertLine} in: ${operation.path}`
    };
  }

  /**
   * DELETE operation implementation
   */
  private async delete(operation: DeleteOperation): Promise<MemoryOperationResult> {
    const fullPath = this.getFullPath(operation.path);

    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      return this.errorResult('delete', operation.path, `Path does not exist: ${operation.path}`);
    }

    // Remove file or directory
    await fs.remove(fullPath);

    return {
      success: true,
      message: `Deleted: ${operation.path}`
    };
  }

  /**
   * RENAME operation implementation
   */
  private async rename(operation: RenameOperation): Promise<MemoryOperationResult> {
    const fullOldPath = this.getFullPath(operation.path);
    const fullNewPath = this.getFullPath(operation.newPath);

    // Validate both paths
    if (!this.isValidPath(operation.path) || !this.isValidPath(operation.newPath)) {
      return this.errorResult('rename', operation.path, 'Invalid path (security violation)');
    }

    const exists = await fs.pathExists(fullOldPath);
    if (!exists) {
      return this.errorResult('rename', operation.path, `Path does not exist: ${operation.path}`);
    }

    // Ensure parent directory of new path exists
    await fs.ensureDir(path.dirname(fullNewPath));

    // Move/rename
    await fs.move(fullOldPath, fullNewPath, { overwrite: false });

    return {
      success: true,
      message: `Renamed: ${operation.path} → ${operation.newPath}`
    };
  }

  /**
   * Validate path for security
   *
   * Prevents directory traversal attacks
   */
  private isValidPath(targetPath: string): boolean {
    try {
      // Resolve path
      const fullPath = path.resolve(this.baseDir, targetPath);

      // Ensure path is within base directory
      if (!fullPath.startsWith(this.baseDir)) {
        console.warn('⚠️ Security violation: Path outside base directory:', targetPath);
        return false;
      }

      // Prevent dangerous patterns
      if (targetPath.includes('..') || targetPath.includes('~')) {
        console.warn('⚠️ Security violation: Dangerous path pattern:', targetPath);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Path validation error:', error);
      return false;
    }
  }

  /**
   * Get full path from relative path
   */
  private getFullPath(relativePath: string): string {
    return path.join(this.baseDir, relativePath);
  }

  /**
   * Create error result
   */
  private errorResult(
    operation: MemoryOperationType,
    path: string,
    error: string
  ): MemoryOperationResult {
    return {
      success: false,
      error,
      metadata: {
        path,
        operation,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Estimate token usage for content
   *
   * Rough approximation: 1 token ≈ 4 characters
   */
  private estimateTokenUsage(content: string): number {
    return Math.ceil(content.length / 4);
  }
}

/**
 * Global operations instance
 */
export const memoryToolOperations = new MemoryToolOperations();

export default MemoryToolOperations;
