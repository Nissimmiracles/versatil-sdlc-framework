/**
 * Error Sanitizer for MCP Server
 * Prevents sensitive information leakage in error messages
 */
export declare enum ErrorCode {
    AGENT_NOT_FOUND = "AGENT_NOT_FOUND",
    AGENT_INITIALIZATION_FAILED = "AGENT_INITIALIZATION_FAILED",
    AGENT_EXECUTION_FAILED = "AGENT_EXECUTION_FAILED",
    ORCHESTRATOR_FAILURE = "ORCHESTRATOR_FAILURE",
    PHASE_TRANSITION_FAILED = "PHASE_TRANSITION_FAILED",
    QUALITY_GATE_FAILED = "QUALITY_GATE_FAILED",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_PARAMETERS = "INVALID_PARAMETERS",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    RESOURCE_ACCESS_DENIED = "RESOURCE_ACCESS_DENIED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    TIMEOUT = "TIMEOUT",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export interface SanitizedError {
    isError: true;
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
}
/**
 * Sanitize an error for safe external exposure
 *
 * This function:
 * 1. Removes absolute paths, credentials, and sensitive data
 * 2. Categorizes the error with a standard error code
 * 3. Extracts safe metadata for debugging
 * 4. Adds timestamp for tracking
 *
 * @param error - The raw error to sanitize
 * @param customCode - Optional custom error code override
 * @returns Sanitized error object safe for external exposure
 */
export declare function sanitizeError(error: unknown, customCode?: ErrorCode): SanitizedError;
/**
 * Wrap an async function with error sanitization
 *
 * Usage:
 * ```typescript
 * const safeFn = withErrorSanitization(async () => {
 *   // code that might throw
 * });
 * ```
 */
export declare function withErrorSanitization<T>(fn: () => Promise<T>, errorCode?: ErrorCode): Promise<T | SanitizedError>;
/**
 * Create a standardized error response for MCP tools/resources/prompts
 */
export declare function createErrorResponse(error: unknown, context?: string): {
    content: Array<{
        type: string;
        text: string;
    }>;
};
/**
 * Validate parameters against expected schema
 * Throws validation error if parameters are invalid
 */
export declare function validateParameters(params: Record<string, unknown>, required: string[]): void;
/**
 * Log error with sanitization (safe for production logs)
 */
export declare function logSanitizedError(error: unknown, context?: string): void;
