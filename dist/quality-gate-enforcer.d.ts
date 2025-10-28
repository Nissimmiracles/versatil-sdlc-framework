/**
 * VERSATIL SDLC Framework - Quality Gate Enforcer
 * Real-time dependency validation and error prevention system
 *
 * This prevents issues like the Ant Design compatibility problems we encountered
 * by catching dependency conflicts, import issues, and configuration errors
 * BEFORE they break the development environment
 */
interface ValidationContext {
    filePath: string;
    fileContent: string;
    projectRoot: string;
    packageJson: any;
    tsConfig: any;
    gitStatus?: string[];
    userRequest?: string;
    relatedFiles?: string[];
}
interface QualityGateResult {
    passed: boolean;
    issues: QualityIssue[];
    warnings: QualityIssue[];
    blockers: QualityIssue[];
    suggestions: string[];
    autoFixAvailable: boolean;
    estimatedFixTime: number;
}
interface QualityIssue {
    severity: 'blocker' | 'critical' | 'major' | 'minor';
    message: string;
    file: string;
    line?: number;
    column?: number;
    rule: string;
    fixSuggestion?: string;
    affectedComponents?: string[];
}
/**
 * Quality Gate Enforcement System
 * Prevents development issues through proactive validation
 */
declare class QualityGateEnforcer {
    private rules;
    private validationCache;
    private projectRoot;
    private packageJson;
    private tsConfig;
    constructor();
    /**
     * Initialize Quality Gate Enforcer
     */
    private initializeEnforcer;
    /**
     * Load Project Configuration
     */
    private loadProjectConfiguration;
    /**
     * Initialize Quality Gate Rules
     */
    private initializeQualityGateRules;
    /**
     * Setup Real-Time Monitoring
     */
    private setupRealTimeMonitoring;
    /**
     * Connect to Development Integration
     */
    private connectToDevelopmentIntegration;
    /**
     * Main Quality Gate Validation Entry Point
     */
    validateContext(context: ValidationContext): Promise<QualityGateResult>;
    /**
     * Ant Design Compatibility Check (learned from our issue)
     */
    private checkAntdCompatibility;
    /**
     * Dependency Conflict Detection
     */
    private checkDependencyConflicts;
    /**
     * Missing Dependencies Check
     */
    private checkMissingDependencies;
    /**
     * TypeScript Error Check
     */
    private checkTypeScriptErrors;
    /**
     * Import Statement Validation
     */
    private checkImportStatements;
    /**
     * React Router Configuration Check (learned from our routing issue)
     */
    private checkRouterConfiguration;
    /**
     * Security Vulnerability Check
     */
    private checkSecurityVulnerabilities;
    /**
     * Performance Impact Assessment
     */
    private checkPerformanceImpact;
    /**
     * Accessibility Standards Check
     */
    private checkAccessibilityStandards;
    /**
     * Auto-Fix Methods
     */
    private fixAntdCompatibility;
    private fixMissingDependencies;
    private fixDependencyConflicts;
    private fixImportStatements;
    private fixRouterConfiguration;
    /**
     * Helper Methods
     */
    private generateCacheKey;
    private isVersionCompatible;
    private extractImports;
    private isDependencyInstalled;
    private parseTypeScriptErrors;
    /**
     * Validation Event Handlers
     */
    private validateAgentContext;
    private runEmergencyValidation;
    private readFileSafely;
    /**
     * Public API Methods
     */
    runQualityGates(context: ValidationContext): Promise<QualityGateResult>;
    runAutoFix(context: ValidationContext, ruleName?: string): Promise<boolean>;
    getEnforcerStatus(): {
        activeRules: number;
        cacheSize: number;
        projectRoot: string;
        packageJsonLoaded: boolean;
        tsConfigLoaded: boolean;
        status: string;
    };
}
export declare const qualityGateEnforcer: QualityGateEnforcer;
export declare function validateQualityGates(context: ValidationContext): Promise<QualityGateResult>;
export declare function runAutoFix(context: ValidationContext, ruleName?: string): Promise<boolean>;
export declare function getQualityGateStatus(): {
    activeRules: number;
    cacheSize: number;
    projectRoot: string;
    packageJsonLoaded: boolean;
    tsConfigLoaded: boolean;
    status: string;
};
export {};
