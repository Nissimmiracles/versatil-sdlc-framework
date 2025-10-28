/**
 * Victor-Verifier Agent
 *
 * Anti-Hallucination Specialist using Chain-of-Verification (CoVe)
 *
 * Role:
 * - Verify factual claims against filesystem ground truth
 * - Detect hallucinations in agent outputs
 * - Generate proof logs with evidence scoring
 * - Block unsafe operations via quality gates
 *
 * Activation:
 * - AUTO: After any agent makes factual claims
 * - MANUAL: /verify command or explicit verification requests
 *
 * Methodology: Chain-of-Verification (CoVe) + Reflexion
 * 1. Extract claims from agent output
 * 2. Verify each claim against filesystem
 * 3. Score evidence (0-100 confidence)
 * 4. Return only verified claims + flag false claims
 * 5. Block workflow if critical hallucinations detected
 */
export interface VerifiedClaim {
    claim: string;
    verified: boolean;
    confidence: number;
    evidence: string[];
    method: 'filesystem' | 'git' | 'npm' | 'build' | 'runtime';
    timestamp: string;
}
export interface FalseClaim {
    claim: string;
    reality: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommended_action: string;
}
export interface VerificationResult {
    verified_claims: VerifiedClaim[];
    false_claims: FalseClaim[];
    overall_score: number;
    safe_to_proceed: boolean;
    proof_log: string;
    timestamp: string;
}
/**
 * Victor-Verifier - Anti-Hallucination Agent
 */
export declare class VictorVerifier {
    private static instance;
    private workingDir;
    private constructor();
    /**
     * Singleton instance
     */
    static getInstance(workingDir?: string): VictorVerifier;
    /**
     * Verify factual claims using Chain-of-Verification
     *
     * @param claims Array of factual claims to verify
     * @param context Optional context (userId, teamId, projectId)
     * @returns Verification result with evidence scores
     */
    verifyClaims(claims: string[], context?: {
        userId?: string;
        teamId?: string;
        projectId?: string;
    }): Promise<VerificationResult>;
    /**
     * Classify claim type for targeted verification
     */
    private classifyClaim;
    /**
     * Verify context layer claim (user/team/project preferences)
     */
    private verifyContextClaim;
    /**
     * Verify framework layer claim (build, agents, hooks, MCP, RAG)
     */
    private verifyFrameworkClaim;
    /**
     * Verify project layer claim (code, tests, dependencies)
     */
    private verifyProjectClaim;
    /**
     * Generate human-readable proof log
     */
    private generateProofLog;
}
export declare const victorVerifier: VictorVerifier;
