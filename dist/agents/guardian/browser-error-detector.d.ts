/**
 * Browser Error Detector for Guardian
 *
 * Parses browser console and network errors captured by the
 * post-file-edit-browser-check hook and creates verified Guardian TODOs.
 *
 * Integrates with:
 * - Guardian health check system
 * - Chain-of-Verification (CoVe) methodology
 * - Root cause learning (v7.11.0+)
 *
 * @version 1.0.0
 * @since v7.14.0
 */
export interface BrowserError {
    type: 'console' | 'network';
    severity: 'error' | 'warning';
    message: string;
    location?: string;
    url?: string;
    status?: number;
    timestamp: string;
}
export interface BrowserErrorDetectionResult {
    filePath: string;
    errors: BrowserError[];
    fingerprint: string;
    confidence: number;
    assignedAgent: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    layer: 'framework' | 'project' | 'context';
    verificationEvidence: VerificationEvidence;
}
interface VerificationEvidence {
    consoleErrorsVerified: boolean;
    networkErrorsVerified: boolean;
    fileExistsVerified: boolean;
    confidence: number;
}
/**
 * Parse browser check results from Guardian TODO file
 */
export declare function parseBrowserCheckTodo(todoPath: string): Promise<BrowserError[]>;
/**
 * Calculate fingerprint for browser error
 */
export declare function calculateErrorFingerprint(error: BrowserError): string;
/**
 * Verify browser errors using Chain-of-Verification (CoVe)
 */
export declare function verifyBrowserErrors(filePath: string, errors: BrowserError[]): Promise<VerificationEvidence>;
/**
 * Assign agent based on error type
 */
export declare function assignAgentForBrowserError(errors: BrowserError[]): string;
/**
 * Determine priority based on error severity and count
 */
export declare function determinePriority(errors: BrowserError[]): 'critical' | 'high' | 'medium' | 'low';
/**
 * Detect and verify browser errors from file path
 */
export declare function detectBrowserErrors(filePath: string): Promise<BrowserErrorDetectionResult | null>;
/**
 * Check for browser errors and create Guardian TODO if needed
 */
export declare function checkBrowserErrorsAndCreateTodo(filePath: string): Promise<{
    created: boolean;
    todoPath?: string;
}>;
/**
 * Get browser error statistics for telemetry
 */
export declare function getBrowserErrorStats(): Promise<{
    totalErrors: number;
    consoleErrors: number;
    networkErrors: number;
    mostCommonError: string | null;
}>;
export {};
