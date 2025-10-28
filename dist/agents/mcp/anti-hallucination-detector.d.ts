/**
 * Anti-Hallucination Detector
 *
 * Purpose: Detect when Claude's knowledge may be outdated and recommend GitMCP queries
 *
 * How It Works:
 * 1. Monitors agent queries for framework/library mentions
 * 2. Checks if Claude's knowledge cutoff (Jan 2025) is outdated for that framework
 * 3. Calculates hallucination risk score (low/medium/high)
 * 4. Recommends GitMCP query to fetch latest docs if risk is high
 *
 * Part of: Oliver-MCP Orchestrator (Gap 1.1 - Critical)
 */
import { EventEmitter } from 'events';
export interface HallucinationRisk {
    level: 'low' | 'medium' | 'high';
    score: number;
    reasoning: string;
    recommendation?: {
        action: 'use-gitmcp' | 'use-web-search' | 'proceed-with-caution';
        gitMCPQuery?: string;
        confidence: number;
    };
}
export interface FrameworkInfo {
    name: string;
    repository: string;
    docsPath?: string;
    lastKnownVersion?: string;
    releaseFrequency: 'high' | 'medium' | 'low';
    knowledgeCutoffRisk: 'high' | 'medium' | 'low';
}
/**
 * Framework Knowledge Base
 * Maps popular frameworks to their GitHub repos and docs paths
 */
export declare const FRAMEWORK_KNOWLEDGE_BASE: Record<string, FrameworkInfo>;
export declare class AntiHallucinationDetector extends EventEmitter {
    private readonly KNOWLEDGE_CUTOFF_DATE;
    constructor();
    /**
     * Detect hallucination risk in a query
     */
    detectHallucinationRisk(query: string, context?: any): Promise<HallucinationRisk>;
    /**
     * Extract framework mentions from query text
     */
    private extractFrameworkMentions;
    /**
     * Calculate hallucination risk for a specific framework
     */
    private calculateFrameworkRisk;
    /**
     * Generate recommendation based on risk assessment
     */
    private generateRecommendation;
    /**
     * Infer specific documentation path from query
     */
    private inferDocumentationPath;
    /**
     * Format GitMCP query recommendation
     */
    private formatGitMCPQuery;
    /**
     * Get days since knowledge cutoff
     */
    private getDaysSinceCutoff;
    /**
     * Get emoji for risk level
     */
    private getRiskEmoji;
    /**
     * Check if framework is in knowledge base
     */
    hasFrameworkInfo(frameworkName: string): boolean;
    /**
     * Get framework info
     */
    getFrameworkInfo(frameworkName: string): FrameworkInfo | undefined;
    /**
     * Add custom framework to knowledge base
     */
    addFramework(key: string, info: FrameworkInfo): void;
}
export declare const antiHallucinationDetector: AntiHallucinationDetector;
