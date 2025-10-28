/**
 * Pattern Library MCP Tools (v7.5.1)
 *
 * MCP tools for v7.5.0 pattern library integration:
 * - Pattern search and discovery
 * - Pattern application with code generation
 * - Pattern-specific setup tools (WebSocket, Payments, S3, Email, Rate-limiting)
 * - Telemetry analytics integration
 */
interface Pattern {
    name: string;
    category: string;
    keywords: string[];
    description: string;
    estimated_effort: {
        hours: number;
        range: string;
        confidence: number;
    };
    complexity: string;
    time_savings: string;
    success_rate: number;
    technologies: string[];
    use_cases: string[];
}
interface PatternSearchResult {
    pattern: Pattern;
    file_path: string;
    match_score: number;
}
export declare function searchPatterns(query: string): Promise<PatternSearchResult[]>;
export declare function applyPattern(patternName: string, options?: {
    dryRun?: boolean;
    outputDir?: string;
}): Promise<{
    success: boolean;
    message: string;
    files_created?: string[];
    next_steps?: string[];
}>;
export declare function setupWebSocket(options?: {
    port?: number;
    auth?: boolean;
    rooms?: boolean;
}): Promise<{
    success: boolean;
    message: string;
    next_steps: string[];
}>;
export declare function setupPayment(options?: {
    provider?: 'stripe' | 'paypal' | 'both';
    subscriptions?: boolean;
    webhooks?: boolean;
}): Promise<{
    success: boolean;
    message: string;
    next_steps: string[];
}>;
export declare function setupS3Upload(options?: {
    imageOptimization?: boolean;
    multipart?: boolean;
    cdn?: boolean;
}): Promise<{
    success: boolean;
    message: string;
    next_steps: string[];
}>;
export declare function setupEmail(options?: {
    provider?: 'sendgrid' | 'nodemailer' | 'both';
    templates?: boolean;
}): Promise<{
    success: boolean;
    message: string;
    next_steps: string[];
}>;
export declare function setupRateLimiting(options?: {
    distributed?: boolean;
    tiered?: boolean;
    costBased?: boolean;
}): Promise<{
    success: boolean;
    message: string;
    next_steps: string[];
}>;
export declare function generateTelemetryReport(format?: 'console' | 'json' | 'markdown'): Promise<{
    success: boolean;
    report: string | object;
}>;
export declare const patternMCPTools: {
    pattern_search: typeof searchPatterns;
    pattern_apply: typeof applyPattern;
    websocket_setup: typeof setupWebSocket;
    payment_setup: typeof setupPayment;
    s3_upload_setup: typeof setupS3Upload;
    email_setup: typeof setupEmail;
    rate_limit_setup: typeof setupRateLimiting;
    telemetry_report: typeof generateTelemetryReport;
};
export {};
