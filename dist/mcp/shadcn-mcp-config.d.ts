/**
 * Shadcn MCP Configuration
 * Production-ready component analysis configuration
 */
export interface ShadcnMCPConfig {
    projectPath: string;
    componentsPath: string;
    filePatterns: string[];
    excludePatterns: string[];
    analysisTimeout: number;
}
export interface ComponentScanResult {
    installed: {
        name: string;
        path: string;
    }[];
    used: {
        component: string;
        usageCount: number;
        files: string[];
        variants: string[];
    }[];
    unused: string[];
    statistics: {
        totalComponents: number;
        utilizationRate: number;
        mostUsed: string;
    };
}
export interface ComponentUsageReport {
    component: string;
    usage: {
        file: string;
        line: number;
        props: Record<string, any>;
    }[];
    patterns: {
        commonProps: Record<string, number>;
        customizationLevel: 'low' | 'medium' | 'high';
    };
    recommendations: string[];
}
export declare const DEFAULT_SHADCN_MCP_CONFIG: ShadcnMCPConfig;
