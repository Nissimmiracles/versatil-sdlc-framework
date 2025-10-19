/**
 * Custom error class for documentation search operations
 * Provides structured error information with error codes and details
 */
export class DocsSearchError extends Error {
  /**
   * Create a new DocsSearchError
   *
   * @param message - Human-readable error message
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

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocsSearchError);
    }
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
