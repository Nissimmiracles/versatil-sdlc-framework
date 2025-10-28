/**
 * VERSATIL OPERA v6.1.0 - Oliver-Onboarding Agent
 *
 * The 7th OPERA Agent - Project Integration Specialist
 *
 * Responsibilities:
 * - Automatic project scanning on install/update
 * - Deep project structure analysis
 * - Gap analysis (missing tests, docs, quality issues)
 * - Smart reorganization suggestions
 * - Agent and rule recommendations
 * - Migration assistance from other frameworks
 * - Quality baseline establishment
 *
 * Auto-Activation Triggers:
 * - npm install @versatil/sdlc-framework (first install)
 * - npm update @versatil/sdlc-framework (framework updates)
 * - package.json changes
 * - versatil onboard (manual command)
 *
 * Icon: 🎯
 *
 * @module OliverOnboarding
 * @version 6.1.0
 */
import { EventEmitter } from 'events';
import { OnboardingResult, ProjectAnalysis } from '../../../onboarding/intelligent-onboarding-system.js';
import { ScanResult } from './project-scanner.js';
import { ReorganizationPlan } from './reorganization-engine.js';
import { MigrationStrategy } from './migration-assistant.js';
import { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export interface OliverConfig {
    projectRoot: string;
    vectorStore?: EnhancedVectorMemoryStore;
    autoReorganize: boolean;
    autoMigrate: boolean;
    verboseLogging: boolean;
    skipPatterns: string[];
}
export interface OliverScanResult {
    projectAnalysis: ProjectAnalysis;
    scanResult: ScanResult;
    gaps: ProjectGap[];
    recommendations: Recommendation[];
    reorganizationPlan: ReorganizationPlan | null;
    migrationStrategy: MigrationStrategy | null;
    estimatedEffort: EffortEstimate;
}
export interface ProjectGap {
    type: 'testing' | 'documentation' | 'security' | 'performance' | 'accessibility' | 'structure';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    affectedFiles: string[];
    suggestion: string;
    autoFixable: boolean;
    estimatedEffort: number;
}
export interface Recommendation {
    category: 'agent' | 'rule' | 'tool' | 'structure' | 'dependency';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: string;
    action: string;
}
export interface EffortEstimate {
    totalMinutes: number;
    breakdown: {
        testing: number;
        documentation: number;
        reorganization: number;
        migration: number;
        configuration: number;
    };
    complexity: 'simple' | 'moderate' | 'complex';
}
export interface ProjectConfig {
    projectId: string;
    name: string;
    version: string;
    type: string;
    language: string;
    framework: string;
    agents: string[];
    rules: number[];
    quality: {
        coverageThreshold: number;
        minQualityScore: number;
        securityScanRequired: boolean;
        accessibilityCompliance: string;
    };
    proactive: {
        enabled: boolean;
        autoActivation: boolean;
        backgroundMonitoring: boolean;
        realTimeValidation: boolean;
    };
    isolation: {
        frameworkHome: string;
        allowedInProject: string[];
        strictMode: boolean;
    };
    recommendations?: Recommendation[];
    gaps?: ProjectGap[];
    createdAt: string;
    updatedAt: string;
    lastScan: string;
    frameworkVersion: string;
}
export declare class OliverOnboardingAgent extends EventEmitter {
    private logger;
    private config;
    private onboardingSystem;
    private scanner;
    private reorganizer;
    private migrator;
    private vectorStore?;
    private lastScanResult;
    private isScanning;
    constructor(config: OliverConfig);
    /**
     * Main entry point: Scan and analyze project
     */
    scanProject(): Promise<OliverScanResult>;
    /**
     * Analyze gaps in the project
     */
    private analyzeGaps;
    /**
     * Generate recommendations based on scan results
     */
    private generateRecommendations;
    /**
     * Create reorganization plan
     */
    private createReorganizationPlan;
    /**
     * Detect migration needs
     */
    private detectMigrationNeeds;
    /**
     * Calculate effort estimate
     */
    private calculateEffortEstimate;
    /**
     * Store scan results in RAG for pattern learning
     */
    private storeInRAG;
    /**
     * Generate .versatil-project.json configuration file
     */
    generateProjectConfig(): Promise<ProjectConfig>;
    /**
     * Save .versatil-project.json to user's project
     */
    saveProjectConfig(config: ProjectConfig): Promise<void>;
    /**
     * Execute reorganization plan
     */
    applyReorganization(): Promise<void>;
    /**
     * Execute migration strategy
     */
    applyMigration(): Promise<void>;
    /**
     * Complete onboarding flow (scan → configure → reorganize → migrate)
     */
    completeOnboarding(): Promise<OnboardingResult>;
    /**
     * Get last scan result
     */
    getLastScanResult(): OliverScanResult | null;
    /**
     * Generate unique project ID
     */
    private generateProjectId;
}
