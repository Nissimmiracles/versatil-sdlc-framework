/**
 * Error Sanitizer for MCP Server
 * Prevents sensitive information leakage in error messages
 */
export var ErrorCode;
(function (ErrorCode) {
    // Agent errors
    ErrorCode["AGENT_NOT_FOUND"] = "AGENT_NOT_FOUND";
    ErrorCode["AGENT_INITIALIZATION_FAILED"] = "AGENT_INITIALIZATION_FAILED";
    ErrorCode["AGENT_EXECUTION_FAILED"] = "AGENT_EXECUTION_FAILED";
    // Orchestrator errors
    ErrorCode["ORCHESTRATOR_FAILURE"] = "ORCHESTRATOR_FAILURE";
    ErrorCode["PHASE_TRANSITION_FAILED"] = "PHASE_TRANSITION_FAILED";
    ErrorCode["QUALITY_GATE_FAILED"] = "QUALITY_GATE_FAILED";
    // Validation errors
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_PARAMETERS"] = "INVALID_PARAMETERS";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    // Resource errors
    ErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCode["RESOURCE_ACCESS_DENIED"] = "RESOURCE_ACCESS_DENIED";
    // Internal errors
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["TIMEOUT"] = "TIMEOUT";
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorCode || (ErrorCode = {}));
/**
 * Patterns to detect and redact sensitive information
 */
const SENSITIVE_PATTERNS = [
    // Absolute file paths
    { pattern: /\/[a-zA-Z0-9_\-/.]+\/([a-zA-Z0-9_\-/.]+)/g, replacement: '[PATH_REDACTED]/$1' },
    // Environment variables
    { pattern: /process\.env\.[A-Z_]+/g, replacement: '[ENV_VAR_REDACTED]' },
    // API keys and tokens
    { pattern: /[a-zA-Z0-9]{32,}/g, replacement: '[TOKEN_REDACTED]' },
    // IP addresses
    { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[IP_REDACTED]' },
    // Email addresses
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },
    // Database connection strings
    { pattern: /(?:postgres|mysql|mongodb):\/\/[^\s]+/g, replacement: '[DB_CONNECTION_REDACTED]' },
    // AWS ARNs
    { pattern: /arn:aws:[a-z0-9-]+:[a-z0-9-]*:[0-9]*:[^\s]+/g, replacement: '[ARN_REDACTED]' },
    // Home directory paths
    { pattern: /\/Users\/[^/\s]+/g, replacement: '~' },
    { pattern: /\/home\/[^/\s]+/g, replacement: '~' },
    { pattern: /C:\\\\Users\\\\[^\\\\]+/g, replacement: '%USERPROFILE%' },
];
/**
 * Sanitize error message to remove sensitive information
 */
function sanitizeMessage(message) {
    let sanitized = message;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, replacement);
    }
    return sanitized;
}
/**
 * Extract relevant error details without exposing sensitive data
 */
function extractSafeDetails(error) {
    const details = {};
    // Safe fields to include
    if (error.name && typeof error.name === 'string') {
        details.name = error.name;
    }
    if (error.code && typeof error.code === 'string') {
        details.errorCode = error.code;
    }
    if (error.statusCode && typeof error.statusCode === 'number') {
        details.statusCode = error.statusCode;
    }
    // Don't include stack traces in production
    if (process.env.NODE_ENV !== 'production' && error.stack) {
        details.stack = sanitizeMessage(error.stack.split('\n').slice(0, 5).join('\n'));
    }
    return Object.keys(details).length > 0 ? details : undefined;
}
/**
 * Determine error code from error type/message
 */
function determineErrorCode(error) {
    const message = (error.message || '').toLowerCase();
    // Agent errors
    if (message.includes('agent') && message.includes('not found')) {
        return ErrorCode.AGENT_NOT_FOUND;
    }
    if (message.includes('agent') && message.includes('initialization')) {
        return ErrorCode.AGENT_INITIALIZATION_FAILED;
    }
    if (message.includes('agent') && message.includes('execution')) {
        return ErrorCode.AGENT_EXECUTION_FAILED;
    }
    // Orchestrator errors
    if (message.includes('orchestrator')) {
        return ErrorCode.ORCHESTRATOR_FAILURE;
    }
    if (message.includes('phase') && message.includes('transition')) {
        return ErrorCode.PHASE_TRANSITION_FAILED;
    }
    if (message.includes('quality gate')) {
        return ErrorCode.QUALITY_GATE_FAILED;
    }
    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
        return ErrorCode.VALIDATION_ERROR;
    }
    if (message.includes('parameter') || message.includes('argument')) {
        return ErrorCode.INVALID_PARAMETERS;
    }
    if (message.includes('required') || message.includes('missing')) {
        return ErrorCode.MISSING_REQUIRED_FIELD;
    }
    // Resource errors
    if (message.includes('resource') && message.includes('not found')) {
        return ErrorCode.RESOURCE_NOT_FOUND;
    }
    if (message.includes('access denied') || message.includes('forbidden')) {
        return ErrorCode.RESOURCE_ACCESS_DENIED;
    }
    // Timeout
    if (message.includes('timeout') || message.includes('timed out')) {
        return ErrorCode.TIMEOUT;
    }
    // Default to internal error
    return ErrorCode.INTERNAL_ERROR;
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
export function sanitizeError(error, customCode) {
    // Handle non-Error objects
    if (!(error instanceof Error)) {
        return {
            isError: true,
            code: customCode || ErrorCode.UNKNOWN_ERROR,
            message: String(error),
            timestamp: new Date().toISOString(),
        };
    }
    const code = customCode || determineErrorCode(error);
    const sanitizedMessage = sanitizeMessage(error.message);
    const details = extractSafeDetails(error);
    return {
        isError: true,
        code,
        message: sanitizedMessage,
        details,
        timestamp: new Date().toISOString(),
    };
}
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
export function withErrorSanitization(fn, errorCode) {
    return fn().catch((error) => sanitizeError(error, errorCode));
}
/**
 * Create a standardized error response for MCP tools/resources/prompts
 */
export function createErrorResponse(error, context) {
    const sanitized = sanitizeError(error);
    const errorMessage = {
        error: sanitized.code,
        message: sanitized.message,
        context,
        timestamp: sanitized.timestamp,
        ...(sanitized.details && { details: sanitized.details }),
    };
    return {
        content: [{
                type: 'text',
                text: JSON.stringify(errorMessage, null, 2),
            }],
    };
}
/**
 * Validate parameters against expected schema
 * Throws validation error if parameters are invalid
 */
export function validateParameters(params, required) {
    const missing = required.filter((key) => !(key in params) || params[key] === undefined);
    if (missing.length > 0) {
        throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
}
/**
 * Log error with sanitization (safe for production logs)
 */
export function logSanitizedError(error, context) {
    const sanitized = sanitizeError(error);
    console.error('[VERSATIL MCP Error]', {
        code: sanitized.code,
        message: sanitized.message,
        context,
        timestamp: sanitized.timestamp,
        details: sanitized.details,
    });
}
//# sourceMappingURL=error-sanitizer.js.map