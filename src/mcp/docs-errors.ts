/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error category for grouping related errors
 */
export enum ErrorCategory {
  DOCUMENT_ACCESS = 'document_access',
  SECURITY = 'security',
  SIZE_LIMIT = 'size_limit',
  INDEX = 'index',
  PARSING = 'parsing',
  VALIDATION = 'validation',
}

/**
 * Error suggestion interface
 */
export interface ErrorSuggestion {
  message: string;
  action?: string;
  link?: string;
}

/**
 * Custom error class for documentation search operations
 * Provides structured error information with error codes and details
 */
export class DocsSearchError extends Error {
  public severity: ErrorSeverity;
  public category: ErrorCategory;
  public suggestions: ErrorSuggestion[];
  public userMessage: string;

  /**
   * Create a new DocsSearchError
   *
   * @param message - Technical error message
   * @param code - Machine-readable error code (e.g., 'DOCUMENT_NOT_FOUND', 'INVALID_PATH')
   * @param details - Additional error context (optional)
   */
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DocsSearchError';

    // Enhance error with metadata
    const metadata = getErrorMetadata(code);
    this.severity = metadata.severity;
    this.category = metadata.category;
    this.suggestions = metadata.suggestions;
    this.userMessage = generateUserMessage(code, details);

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocsSearchError);
    }
  }

  /**
   * Get formatted error message for display to user
   */
  getUserFriendlyMessage(): string {
    let msg = `${this.getSeverityEmoji()} ${this.userMessage}\n`;

    if (this.suggestions.length > 0) {
      msg += '\n💡 Suggestions:\n';
      this.suggestions.forEach((suggestion, index) => {
        msg += `  ${index + 1}. ${suggestion.message}\n`;
        if (suggestion.action) {
          msg += `     → ${suggestion.action}\n`;
        }
        if (suggestion.link) {
          msg += `     📖 ${suggestion.link}\n`;
        }
      });
    }

    return msg;
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(): string {
    const emojis = {
      [ErrorSeverity.INFO]: 'ℹ️',
      [ErrorSeverity.WARNING]: '⚠️',
      [ErrorSeverity.ERROR]: '❌',
      [ErrorSeverity.CRITICAL]: '🚨',
    };
    return emojis[this.severity];
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      userMessage: this.userMessage,
      code: this.code,
      severity: this.severity,
      category: this.category,
      suggestions: this.suggestions,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Standard error codes used by documentation tools
 */
export const DocsErrorCodes = {
  // Document access errors
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  FILE_NOT_READABLE: 'FILE_NOT_READABLE',

  // Security errors
  INVALID_PATH: 'INVALID_PATH',
  PATH_TRAVERSAL_BLOCKED: 'PATH_TRAVERSAL_BLOCKED',
  PATH_OUTSIDE_DOCS: 'PATH_OUTSIDE_DOCS',

  // Size limit errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Index errors
  INDEX_NOT_BUILT: 'INDEX_NOT_BUILT',
  INDEX_BUILD_FAILED: 'INDEX_BUILD_FAILED',

  // Parsing errors
  MALFORMED_MARKDOWN: 'MALFORMED_MARKDOWN',
  INVALID_CATEGORY: 'INVALID_CATEGORY',
} as const;

export type DocsErrorCode = typeof DocsErrorCodes[keyof typeof DocsErrorCodes];

/**
 * Error metadata for each error code
 */
interface ErrorMetadata {
  severity: ErrorSeverity;
  category: ErrorCategory;
  suggestions: ErrorSuggestion[];
}

/**
 * Get metadata for an error code
 */
function getErrorMetadata(code: string): ErrorMetadata {
  const metadata: Record<string, ErrorMetadata> = {
    [DocsErrorCodes.DOCUMENT_NOT_FOUND]: {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.DOCUMENT_ACCESS,
      suggestions: [
        {
          message: 'Check if the document path is correct',
          action: 'Verify the file exists in the docs/ directory',
        },
        {
          message: 'Make sure the index is up to date',
          action: 'Run buildIndex() to rebuild the documentation index',
        },
        {
          message: 'Check for typos in the document name',
          action: 'Use search() to find similar document names',
        },
      ],
    },
    [DocsErrorCodes.FILE_NOT_READABLE]: {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.DOCUMENT_ACCESS,
      suggestions: [
        {
          message: 'Check file permissions',
          action: 'Ensure the file has read permissions (chmod +r)',
        },
        {
          message: 'Verify file is not corrupted',
          action: 'Try opening the file manually to verify it\'s readable',
        },
      ],
    },
    [DocsErrorCodes.INVALID_PATH]: {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.SECURITY,
      suggestions: [
        {
          message: 'Use relative paths within docs/ directory',
          action: 'Example: "guides/getting-started.md" instead of "/etc/passwd"',
        },
        {
          message: 'Avoid absolute paths',
          action: 'All paths should be relative to the project root',
        },
      ],
    },
    [DocsErrorCodes.PATH_TRAVERSAL_BLOCKED]: {
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.SECURITY,
      suggestions: [
        {
          message: 'Path traversal (../) is not allowed for security',
          action: 'Use paths within the docs/ directory only',
        },
        {
          message: 'This is a security measure to prevent directory traversal attacks',
          link: 'https://owasp.org/www-community/attacks/Path_Traversal',
        },
      ],
    },
    [DocsErrorCodes.PATH_OUTSIDE_DOCS]: {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.SECURITY,
      suggestions: [
        {
          message: 'Documentation must be inside the docs/ directory',
          action: 'Move the file to docs/ or use a different tool for non-docs files',
        },
        {
          message: 'This restriction ensures documentation is organized',
          action: 'Create subdirectories within docs/ if needed',
        },
      ],
    },
    [DocsErrorCodes.FILE_TOO_LARGE]: {
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.SIZE_LIMIT,
      suggestions: [
        {
          message: 'File exceeds maximum size limit',
          action: 'Split large documents into smaller files',
        },
        {
          message: 'Consider using external hosting for large assets',
          action: 'Upload images/videos to a CDN and link to them',
        },
        {
          message: 'Increase the maxFileSize option if needed',
          action: 'Pass { maxFileSize: 20 * 1024 * 1024 } to constructor',
        },
      ],
    },
    [DocsErrorCodes.INDEX_NOT_BUILT]: {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.INDEX,
      suggestions: [
        {
          message: 'Build the search index before searching',
          action: 'Call await engine.buildIndex() before search()',
        },
        {
          message: 'The index is built automatically on first search',
          action: 'This error indicates buildIndex() failed or was interrupted',
        },
      ],
    },
    [DocsErrorCodes.INDEX_BUILD_FAILED]: {
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.INDEX,
      suggestions: [
        {
          message: 'Check if docs/ directory exists',
          action: 'Create a docs/ directory in your project root',
        },
        {
          message: 'Verify file permissions on docs/ directory',
          action: 'Ensure the directory is readable (chmod +rx docs/)',
        },
        {
          message: 'Check for corrupted markdown files',
          action: 'Review recent changes to documentation files',
        },
      ],
    },
    [DocsErrorCodes.MALFORMED_MARKDOWN]: {
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.PARSING,
      suggestions: [
        {
          message: 'Check markdown syntax',
          action: 'Use a markdown linter to validate the file',
          link: 'https://github.com/DavidAnson/markdownlint',
        },
        {
          message: 'Common issues: unclosed code blocks, invalid headers',
          action: 'Look for ``` without closing or headers without space after #',
        },
      ],
    },
    [DocsErrorCodes.INVALID_CATEGORY]: {
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.VALIDATION,
      suggestions: [
        {
          message: 'Use valid documentation categories',
          action: 'Valid categories: guide, reference, tutorial, api, architecture, security, completion',
        },
        {
          message: 'Categories are determined by file path',
          action: 'Place files in appropriate subdirectories (e.g., docs/guides/)',
        },
      ],
    },
  };

  return metadata[code] || {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.VALIDATION,
    suggestions: [
      {
        message: 'An unexpected error occurred',
        action: 'Check the error message for details',
      },
    ],
  };
}

/**
 * Generate user-friendly message for an error code
 */
function generateUserMessage(code: string, details?: any): string {
  const messages: Record<string, string> = {
    [DocsErrorCodes.DOCUMENT_NOT_FOUND]: `Document not found: ${details?.path || 'unknown'}`,
    [DocsErrorCodes.FILE_NOT_READABLE]: `Cannot read file: ${details?.path || 'unknown'}`,
    [DocsErrorCodes.INVALID_PATH]: `Invalid file path: ${details?.path || 'unknown'}`,
    [DocsErrorCodes.PATH_TRAVERSAL_BLOCKED]: `Path traversal attempt blocked for security: ${details?.path || 'unknown'}`,
    [DocsErrorCodes.PATH_OUTSIDE_DOCS]: `File is outside docs/ directory: ${details?.path || 'unknown'}`,
    [DocsErrorCodes.FILE_TOO_LARGE]: `File too large (${details?.size ? Math.round(details.size / 1024 / 1024) + 'MB' : 'unknown size'}). Maximum allowed: ${details?.maxSize ? Math.round(details.maxSize / 1024 / 1024) + 'MB' : '10MB'}`,
    [DocsErrorCodes.INDEX_NOT_BUILT]: `Search index not built yet. Build the index before searching.`,
    [DocsErrorCodes.INDEX_BUILD_FAILED]: `Failed to build search index: ${details?.error || 'unknown error'}`,
    [DocsErrorCodes.MALFORMED_MARKDOWN]: `Malformed markdown in ${details?.path || 'unknown file'}`,
    [DocsErrorCodes.INVALID_CATEGORY]: `Invalid document category: ${details?.category || 'unknown'}`,
  };

  return messages[code] || `Error: ${code}`;
}

/**
 * Helper to format error for console output
 */
export function formatErrorForConsole(error: DocsSearchError): string {
  return error.getUserFriendlyMessage();
}

/**
 * Helper to check if error is recoverable
 */
export function isRecoverableError(error: DocsSearchError): boolean {
  return error.severity === ErrorSeverity.WARNING || error.severity === ErrorSeverity.INFO;
}

/**
 * Helper to get error category name
 */
export function getCategoryDisplayName(category: ErrorCategory): string {
  const names: Record<ErrorCategory, string> = {
    [ErrorCategory.DOCUMENT_ACCESS]: 'Document Access',
    [ErrorCategory.SECURITY]: 'Security',
    [ErrorCategory.SIZE_LIMIT]: 'Size Limit',
    [ErrorCategory.INDEX]: 'Search Index',
    [ErrorCategory.PARSING]: 'Document Parsing',
    [ErrorCategory.VALIDATION]: 'Validation',
  };
  return names[category];
}
