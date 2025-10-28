/**
 * Mozilla Observatory Security Scanner
 * DAST (Dynamic Application Security Testing) integration
 *
 * Scans deployed applications for security vulnerabilities:
 * - HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - TLS/SSL configuration
 * - Cookie security
 * - Subresource integrity
 * - Content security policy
 *
 * API Documentation: https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md
 */
export interface ObservatoryScanResult {
    id: string;
    url: string;
    timestamp: number;
    state: 'PENDING' | 'STARTING' | 'RUNNING' | 'FINISHED' | 'ABORTED' | 'FAILED';
    grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F';
    score: number;
    tests_passed: number;
    tests_failed: number;
    tests_total: number;
    scan_id: number;
    response_headers: Record<string, string>;
    test_results: ObservatoryTestResult[];
    recommendations: string[];
    error?: string;
}
export interface ObservatoryTestResult {
    name: string;
    pass: boolean;
    score_modifier: number;
    score_description: string;
    expectation: string;
    result: string;
    output: ObservatoryTestOutput;
}
export interface ObservatoryTestOutput {
    data: Record<string, any>;
    level?: 'info' | 'warning' | 'error';
    messages?: string[];
}
export interface SecurityHeaderValidation {
    header: string;
    present: boolean;
    value?: string;
    valid: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
}
export interface SecurityScanOptions {
    rescan?: boolean;
    hidden?: boolean;
    timeout?: number;
}
export declare class ObservatoryScanner {
    private logger;
    private baseUrl;
    private rateLimit;
    private lastScanTimes;
    constructor();
    /**
     * Scan a URL with Mozilla Observatory
     */
    scanUrl(url: string, options?: SecurityScanOptions): Promise<ObservatoryScanResult>;
    /**
     * Initiate a new scan
     */
    private initiateScan;
    /**
     * Poll for scan results with timeout
     */
    private pollScanResults;
    /**
     * Parse Observatory API response into our format
     */
    private parseScanResult;
    /**
     * Parse individual test results
     */
    private parseTestResults;
    /**
     * Generate actionable recommendations based on test results
     */
    private generateRecommendations;
    /**
     * Validate specific security headers
     */
    validateSecurityHeaders(url: string): Promise<SecurityHeaderValidation[]>;
    /**
     * Validate Content Security Policy
     */
    private validateCSP;
    /**
     * Validate HTTP Strict Transport Security
     */
    private validateHSTS;
    /**
     * Validate X-Frame-Options
     */
    private validateXFrameOptions;
    /**
     * Validate X-Content-Type-Options
     */
    private validateXContentTypeOptions;
    /**
     * Validate Referrer-Policy
     */
    private validateReferrerPolicy;
    /**
     * Validate Permissions-Policy (formerly Feature-Policy)
     */
    private validatePermissionsPolicy;
    /**
     * Quick security grade check (without full scan)
     */
    quickGradeCheck(url: string): Promise<{
        grade: string;
        score: number;
    }>;
    /**
     * Check if grade meets minimum threshold
     */
    meetsMinimumGrade(grade: string, minimum?: string): boolean;
}
export declare const observatoryScanner: ObservatoryScanner;
