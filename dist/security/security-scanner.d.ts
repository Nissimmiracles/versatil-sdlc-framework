/**
 * VERSATIL Security Scanner & Compliance Framework
 * Comprehensive security scanning, vulnerability assessment, and compliance validation
 */
export interface SecurityScanResult {
    id: string;
    timestamp: number;
    scanType: SecurityScanType;
    status: 'completed' | 'failed' | 'running';
    duration: number;
    findings: SecurityFinding[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    complianceScore: number;
    recommendations: string[];
}
export type SecurityScanType = 'vulnerability' | 'dependency' | 'code-analysis' | 'infrastructure' | 'compliance' | 'penetration';
export interface SecurityFinding {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    cwe?: string;
    cve?: string;
    impact: string;
    remediation: string;
    location: {
        file?: string;
        line?: number;
        function?: string;
        component?: string;
    };
    confidence: number;
    falsePositive: boolean;
    acknowledged: boolean;
    tags: string[];
}
export interface ComplianceFramework {
    name: string;
    version: string;
    requirements: ComplianceRequirement[];
}
export interface ComplianceRequirement {
    id: string;
    title: string;
    description: string;
    category: string;
    mandatory: boolean;
    implemented: boolean;
    evidence: string[];
    gaps: string[];
}
export interface ThreatModel {
    id: string;
    name: string;
    description: string;
    assets: ThreatAsset[];
    threats: Threat[];
    mitigations: Mitigation[];
    riskScore: number;
}
export interface ThreatAsset {
    id: string;
    name: string;
    type: 'data' | 'system' | 'process' | 'network';
    sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
    value: number;
}
export interface Threat {
    id: string;
    name: string;
    description: string;
    category: string;
    likelihood: number;
    impact: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    attackVectors: string[];
    affectedAssets: string[];
}
export interface Mitigation {
    id: string;
    name: string;
    description: string;
    type: 'preventive' | 'detective' | 'corrective';
    effectiveness: number;
    implemented: boolean;
    cost: 'low' | 'medium' | 'high';
    threats: string[];
}
export declare class SecurityScanner {
    private logger;
    private scanResults;
    private complianceFrameworks;
    private threatModels;
    private projectPath;
    constructor(projectPath?: string);
    /**
     * Initialize compliance frameworks
     */
    private initializeComplianceFrameworks;
    /**
     * Initialize threat models
     */
    private initializeThreatModels;
    /**
     * Run comprehensive security scan
     */
    runComprehensiveScan(): Promise<SecurityScanResult>;
    /**
     * Run vulnerability scan
     */
    runVulnerabilityScan(): Promise<SecurityScanResult>;
    /**
     * Run dependency scan
     */
    runDependencyScan(): Promise<SecurityScanResult>;
    /**
     * Run static code analysis
     */
    runCodeAnalysisScan(): Promise<SecurityScanResult>;
    /**
     * Run infrastructure security scan
     */
    runInfrastructureScan(): Promise<SecurityScanResult>;
    /**
     * Run compliance scan
     */
    runComplianceScan(): Promise<SecurityScanResult>;
    /**
     * Calculate findings summary
     */
    private calculateSummary;
    /**
     * Calculate overall compliance score
     */
    private calculateComplianceScore;
    /**
     * Generate security recommendations
     */
    private generateRecommendations;
    /**
     * Generate compliance report
     */
    generateComplianceReport(frameworkName: string): Promise<any>;
    /**
     * Generate compliance recommendations
     */
    private generateComplianceRecommendations;
    /**
     * Acknowledge a finding as false positive or accepted risk
     */
    acknowledgeSecrityFinding(scanId: string, findingId: string, acknowledged: boolean): void;
    /**
     * Get scan results
     */
    getScanResults(): SecurityScanResult[];
    /**
     * Get latest scan result
     */
    getLatestScanResult(): SecurityScanResult | null;
    /**
     * Get threat model
     */
    getThreatModel(modelId: string): ThreatModel | null;
    /**
     * Get all threat models
     */
    getAllThreatModels(): ThreatModel[];
    /**
     * Get security dashboard summary
     */
    getSecuritySummary(): {
        lastScan: number;
        findingsCount: number;
        criticalFindings: number;
        complianceScore: number;
        environment: import("../environment/environment-manager.js").EnvironmentType;
        threatModelsCount: number;
        scanHistory: number;
    };
}
export declare const securityScanner: SecurityScanner;
