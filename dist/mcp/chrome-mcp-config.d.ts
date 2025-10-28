/**
 * Chrome MCP Configuration
 * Production-ready browser automation configuration
 */
export interface ChromeMCPConfig {
    browserType: 'chromium' | 'firefox' | 'webkit';
    headless: boolean;
    devtools: boolean;
    slowMo?: number;
    viewport?: {
        width: number;
        height: number;
    };
    timeout: number;
    sessionTimeout: number;
    baseURL?: string;
}
export interface AccessibilityReport {
    violations: {
        id: string;
        impact: 'critical' | 'serious' | 'moderate' | 'minor';
        description: string;
        nodes: {
            html: string;
            target: string[];
        }[];
    }[];
    passes: number;
    score: number;
    wcagLevel: 'A' | 'AA' | 'AAA';
}
export interface PerformanceMetrics {
    fcp: number;
    lcp: number;
    tti: number;
    tbt: number;
    cls: number;
    score: number;
}
export declare const DEFAULT_CHROME_MCP_CONFIG: ChromeMCPConfig;
