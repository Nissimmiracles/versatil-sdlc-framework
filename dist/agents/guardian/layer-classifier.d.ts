/**
 * VERSATIL SDLC Framework - Guardian Layer Classifier
 *
 * Classifies issues into three verification layers:
 * - Framework Layer: Infrastructure (build, agents, hooks, MCP, RAG)
 * - Project Layer: Application code (tests, security, quality)
 * - Context Layer: Preferences (user prefs, team conventions, vision)
 *
 * Part of Guardian's anti-hallucination system (v7.7.0+)
 */
import type { HealthIssue } from './types.js';
export type VerificationLayer = 'framework' | 'project' | 'context';
export interface LayerClassification {
    layer: VerificationLayer;
    confidence: number;
    matched_patterns: string[];
    reasoning: string;
}
/**
 * Classify issue into verification layer
 */
export declare function classifyIssueLayer(issue: HealthIssue): LayerClassification;
/**
 * Classify multiple issues in batch
 */
export declare function classifyIssues(issues: HealthIssue[]): Map<HealthIssue, LayerClassification>;
/**
 * Get layer statistics for a set of issues
 */
export declare function getLayerStatistics(classifications: Map<HealthIssue, LayerClassification>): {
    total: number;
    by_layer: Record<VerificationLayer, number>;
    avg_confidence: Record<VerificationLayer, number>;
};
/**
 * Export layer-specific agent routing rules
 * Used by verified-issue-detector for agent assignment
 */
export declare const LAYER_AGENT_ROUTING: {
    readonly framework: {
        readonly 'build-failure': "Maria-QA";
        readonly 'typescript-error': "Marcus-Backend";
        readonly 'agent-invalid': "Sarah-PM";
        readonly 'hook-error': "Marcus-Backend";
        readonly 'mcp-error': "Oliver-MCP";
        readonly 'rag-health': "Dr.AI-ML";
        readonly 'orchestrator-error': "Sarah-PM";
    };
    readonly project: {
        readonly 'test-failure': "Maria-QA";
        readonly 'test-coverage': "Maria-QA";
        readonly 'security-vulnerability': "Marcus-Backend";
        readonly 'code-quality': "Maria-QA";
        readonly accessibility: "James-Frontend";
        readonly performance: "James-Frontend";
        readonly database: "Dana-Database";
        readonly dependency: "Marcus-Backend";
    };
    readonly context: {
        readonly 'style-violation': "git-blame";
        readonly 'convention-violation': "Alex-BA";
        readonly 'vision-misalignment': "Sarah-PM";
        readonly 'preference-mismatch': "git-blame";
    };
};
