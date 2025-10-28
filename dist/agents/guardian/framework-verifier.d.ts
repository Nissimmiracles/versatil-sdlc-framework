/**
 * VERSATIL SDLC Framework - Framework Layer Verifier
 *
 * Verifies issues in the Framework Layer (infrastructure):
 * - Build system (TypeScript compilation, npm scripts)
 * - Agent system (agent definitions, handoff contracts)
 * - Hook system (lifecycle hooks, event handlers)
 * - MCP server (tool definitions, server health)
 * - RAG system (GraphRAG, Vector store, RAG Router)
 * - Flywheel orchestration (SDLC phases, state machine)
 *
 * Part of Guardian's anti-hallucination system (v7.7.0+)
 */
import type { HealthIssue } from './types.js';
export interface FrameworkVerification {
    claim: string;
    verified: boolean;
    method: string;
    confidence: number;
    evidence?: {
        command?: string;
        exit_code?: number;
        output?: string;
        file_exists?: boolean;
        error_details?: string;
    };
}
export interface FrameworkVerificationResult {
    issue_id: string;
    layer: 'framework';
    verified: boolean;
    confidence: number;
    verifications: FrameworkVerification[];
    recommended_fix?: string;
}
/**
 * Verify framework layer issue using ground truth methods
 */
export declare function verifyFrameworkIssue(issue: HealthIssue, workingDir: string): Promise<FrameworkVerificationResult>;
