/**
 * Semgrep MCP Executor
 * ✅ PRODUCTION IMPLEMENTATION - Semgrep Security Scanning Integration
 *
 * Primary Agent: Marcus-Backend (Security-first development)
 * Secondary Agents: Maria-QA (security testing), Dr.AI-ML (ML model security)
 *
 * Features:
 * - Real-time security vulnerability scanning
 * - OWASP Top 10 detection
 * - Custom rule creation and scanning
 * - AST (Abstract Syntax Tree) analysis
 * - 30+ supported languages
 * - Semgrep AppSec Platform API integration
 *
 * Official Package:
 * - semgrep-mcp (official Semgrep MCP server)
 */
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: {
        operation?: string;
        timestamp?: string;
        language?: string;
        rulesCount?: number;
        findingsCount?: number;
        [key: string]: any;
    };
}
export declare class SemgrepMCPExecutor {
    private semgrepApiKey;
    private semgrepAppUrl;
    constructor();
    /**
     * Execute Semgrep MCP action
     * Routes to appropriate Semgrep operation based on action type
     */
    executeSemgrepMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Quick security check with default OWASP rules
     */
    private securityCheck;
    /**
     * Semgrep scan with custom config
     */
    private semgrepScan;
    /**
     * Scan with custom Semgrep rule
     */
    private scanWithCustomRule;
    /**
     * Get Abstract Syntax Tree of code
     */
    private getAST;
    /**
     * Fetch findings from Semgrep AppSec Platform API
     */
    private getSemgrepFindings;
    /**
     * Get list of supported languages
     */
    private getSupportedLanguages;
    /**
     * Get Semgrep rule JSON schema
     */
    private getRuleSchema;
    /**
     * Run actual Semgrep scan or fallback to pattern detection
     */
    private runSemgrepScan;
    /**
     * Pattern-based security scan (fallback when Semgrep not installed)
     */
    private patternBasedScan;
    /**
     * Get OWASP coverage from findings
     */
    private getOwaspCoverage;
    /**
     * Group findings by file
     */
    private groupFindingsByFile;
    /**
     * Group findings by severity
     */
    private groupFindingsBySeverity;
    /**
     * Cleanup resources
     */
    close(): Promise<void>;
}
export declare const semgrepMCPExecutor: SemgrepMCPExecutor;
