/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * Error category for grouping related errors
 */
export declare enum ErrorCategory {
    DOCUMENT_ACCESS = "document_access",
    SECURITY = "security",
    SIZE_LIMIT = "size_limit",
    INDEX = "index",
    PARSING = "parsing",
    VALIDATION = "validation"
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
export declare class DocsSearchError extends Error {
    code: string;
    details?: any;
    severity: ErrorSeverity;
    category: ErrorCategory;
    suggestions: ErrorSuggestion[];
    userMessage: string;
    /**
     * Create a new DocsSearchError
     *
     * @param message - Technical error message
     * @param code - Machine-readable error code (e.g., 'DOCUMENT_NOT_FOUND', 'INVALID_PATH')
     * @param details - Additional error context (optional)
     */
    constructor(message: string, code: string, details?: any);
    /**
     * Get formatted error message for display to user
     */
    getUserFriendlyMessage(): string;
    /**
     * Get emoji for severity level
     */
    private getSeverityEmoji;
    /**
     * Convert error to JSON for logging
     */
    toJSON(): {
        name: string;
        message: string;
        userMessage: string;
        code: string;
        severity: ErrorSeverity;
        category: ErrorCategory;
        suggestions: ErrorSuggestion[];
        details: any;
        stack: string;
    };
}
/**
 * Standard error codes used by documentation tools
 */
export declare const DocsErrorCodes: {
    readonly DOCUMENT_NOT_FOUND: "DOCUMENT_NOT_FOUND";
    readonly FILE_NOT_READABLE: "FILE_NOT_READABLE";
    readonly INVALID_PATH: "INVALID_PATH";
    readonly PATH_TRAVERSAL_BLOCKED: "PATH_TRAVERSAL_BLOCKED";
    readonly PATH_OUTSIDE_DOCS: "PATH_OUTSIDE_DOCS";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly INDEX_NOT_BUILT: "INDEX_NOT_BUILT";
    readonly INDEX_BUILD_FAILED: "INDEX_BUILD_FAILED";
    readonly MALFORMED_MARKDOWN: "MALFORMED_MARKDOWN";
    readonly INVALID_CATEGORY: "INVALID_CATEGORY";
};
export type DocsErrorCode = typeof DocsErrorCodes[keyof typeof DocsErrorCodes];
/**
 * Helper to format error for console output
 */
export declare function formatErrorForConsole(error: DocsSearchError): string;
/**
 * Helper to check if error is recoverable
 */
export declare function isRecoverableError(error: DocsSearchError): boolean;
/**
 * Helper to get error category name
 */
export declare function getCategoryDisplayName(category: ErrorCategory): string;
