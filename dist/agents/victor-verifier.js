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
import { verifyContextIssue } from './guardian/context-verifier.js';
import { verifyFrameworkIssue } from './guardian/framework-verifier.js';
import { verifyProjectIssue } from './guardian/project-verifier.js';
/**
 * Victor-Verifier - Anti-Hallucination Agent
 */
export class VictorVerifier {
    constructor(workingDir = process.cwd()) {
        this.workingDir = workingDir;
    }
    /**
     * Singleton instance
     */
    static getInstance(workingDir) {
        if (!VictorVerifier.instance) {
            VictorVerifier.instance = new VictorVerifier(workingDir);
        }
        return VictorVerifier.instance;
    }
    /**
     * Verify factual claims using Chain-of-Verification
     *
     * @param claims Array of factual claims to verify
     * @param context Optional context (userId, teamId, projectId)
     * @returns Verification result with evidence scores
     */
    async verifyClaims(claims, context) {
        const verifiedClaims = [];
        const falseClaims = [];
        for (const claim of claims) {
            // Step 1: Classify claim type
            const claimType = this.classifyClaim(claim);
            // Step 2: Verify based on layer
            let verification;
            if (claimType.layer === 'context') {
                verification = await this.verifyContextClaim(claim, claimType.type, context);
            }
            else if (claimType.layer === 'framework') {
                verification = await this.verifyFrameworkClaim(claim, claimType.type);
            }
            else if (claimType.layer === 'project') {
                verification = await this.verifyProjectClaim(claim, claimType.type);
            }
            else {
                // Unknown claim type - mark as unverified
                verification = {
                    claim,
                    reality: 'Unable to classify claim type',
                    severity: 'medium',
                    recommended_action: 'Manually verify claim accuracy'
                };
            }
            // Step 3: Categorize result
            if ('verified' in verification && verification.verified) {
                verifiedClaims.push(verification);
            }
            else {
                falseClaims.push(verification);
            }
        }
        // Step 4: Calculate overall score
        const totalClaims = claims.length;
        const verifiedCount = verifiedClaims.length;
        const overallScore = totalClaims > 0 ? Math.round((verifiedCount / totalClaims) * 100) : 0;
        // Step 5: Determine if safe to proceed (blocking quality gate)
        const criticalFalse = falseClaims.filter(fc => fc.severity === 'critical').length;
        const highFalse = falseClaims.filter(fc => fc.severity === 'high').length;
        const safeToProceed = criticalFalse === 0 && highFalse === 0 && overallScore >= 80;
        // Step 6: Generate proof log
        const proofLog = this.generateProofLog(verifiedClaims, falseClaims, overallScore);
        return {
            verified_claims: verifiedClaims,
            false_claims: falseClaims,
            overall_score: overallScore,
            safe_to_proceed: safeToProceed,
            proof_log: proofLog,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Classify claim type for targeted verification
     */
    classifyClaim(claim) {
        const lowerClaim = claim.toLowerCase();
        // Context layer (user/team/project preferences)
        if (lowerClaim.includes('indentation') || lowerClaim.includes('tabs') || lowerClaim.includes('spaces')) {
            return { layer: 'context', type: 'indentation-style' };
        }
        if (lowerClaim.includes('quote') || lowerClaim.includes('single') || lowerClaim.includes('double')) {
            return { layer: 'context', type: 'quote-style' };
        }
        if (lowerClaim.includes('naming') || lowerClaim.includes('camelcase') || lowerClaim.includes('snake_case')) {
            return { layer: 'context', type: 'naming-convention' };
        }
        // Framework layer (build, agents, hooks, MCP, RAG)
        if (lowerClaim.includes('build') || lowerClaim.includes('compile') || lowerClaim.includes('typescript')) {
            return { layer: 'framework', type: 'build-failure' };
        }
        if (lowerClaim.includes('agent') && (lowerClaim.includes('invalid') || lowerClaim.includes('not found'))) {
            return { layer: 'framework', type: 'agent-invalid' };
        }
        if (lowerClaim.includes('hook')) {
            return { layer: 'framework', type: 'hook-not-found' };
        }
        if (lowerClaim.includes('mcp')) {
            return { layer: 'framework', type: 'mcp-error' };
        }
        if (lowerClaim.includes('rag')) {
            return { layer: 'framework', type: 'rag-health' };
        }
        // Project layer (code, tests, dependencies)
        if (lowerClaim.includes('test') || lowerClaim.includes('coverage')) {
            return { layer: 'project', type: 'test-failure' };
        }
        if (lowerClaim.includes('dependency') || lowerClaim.includes('package')) {
            return { layer: 'project', type: 'dependency-missing' };
        }
        if (lowerClaim.includes('file') && lowerClaim.includes('exist')) {
            return { layer: 'project', type: 'file-missing' };
        }
        // Default: project layer, generic type
        return { layer: 'project', type: 'generic' };
    }
    /**
     * Verify context layer claim (user/team/project preferences)
     */
    async verifyContextClaim(claim, type, context) {
        try {
            const issue = {
                id: `claim-${Date.now()}`,
                component: 'context',
                severity: 'medium',
                description: claim,
            };
            const result = await verifyContextIssue(issue, this.workingDir, context?.userId, context?.teamId, context?.projectId);
            if (result.verified) {
                return {
                    claim,
                    verified: true,
                    confidence: result.confidence,
                    evidence: result.verifications.map(v => v.method),
                    method: 'filesystem',
                    timestamp: new Date().toISOString()
                };
            }
            else {
                return {
                    claim,
                    reality: result.recommended_fix || 'Claim could not be verified',
                    severity: 'medium',
                    recommended_action: result.recommended_fix || 'Review context settings'
                };
            }
        }
        catch (error) {
            return {
                claim,
                reality: `Verification failed: ${error.message}`,
                severity: 'low',
                recommended_action: 'Manual verification required'
            };
        }
    }
    /**
     * Verify framework layer claim (build, agents, hooks, MCP, RAG)
     */
    async verifyFrameworkClaim(claim, type) {
        try {
            const issue = {
                id: `claim-${Date.now()}`,
                component: 'framework',
                severity: 'medium',
                description: claim,
            };
            const result = await verifyFrameworkIssue(issue, this.workingDir);
            if (result.verified) {
                return {
                    claim,
                    verified: true,
                    confidence: result.confidence,
                    evidence: result.verifications.map(v => v.method),
                    method: 'filesystem',
                    timestamp: new Date().toISOString()
                };
            }
            else {
                return {
                    claim,
                    reality: result.recommended_fix || 'Claim could not be verified',
                    severity: 'high',
                    recommended_action: result.recommended_fix || 'Fix framework infrastructure'
                };
            }
        }
        catch (error) {
            return {
                claim,
                reality: `Verification failed: ${error.message}`,
                severity: 'medium',
                recommended_action: 'Manual verification required'
            };
        }
    }
    /**
     * Verify project layer claim (code, tests, dependencies)
     */
    async verifyProjectClaim(claim, type) {
        try {
            const issue = {
                id: `claim-${Date.now()}`,
                component: 'project',
                severity: 'medium',
                description: claim,
            };
            const result = await verifyProjectIssue(issue, this.workingDir);
            if (result.verified) {
                return {
                    claim,
                    verified: true,
                    confidence: result.confidence,
                    evidence: result.verifications.map(v => v.method),
                    method: 'filesystem',
                    timestamp: new Date().toISOString()
                };
            }
            else {
                return {
                    claim,
                    reality: result.recommended_fix || 'Claim could not be verified',
                    severity: 'medium',
                    recommended_action: result.recommended_fix || 'Review project code'
                };
            }
        }
        catch (error) {
            return {
                claim,
                reality: `Verification failed: ${error.message}`,
                severity: 'low',
                recommended_action: 'Manual verification required'
            };
        }
    }
    /**
     * Generate human-readable proof log
     */
    generateProofLog(verifiedClaims, falseClaims, overallScore) {
        const lines = [];
        lines.push('# Victor-Verifier Proof Log');
        lines.push('');
        lines.push(`**Overall Score**: ${overallScore}% verified`);
        lines.push(`**Timestamp**: ${new Date().toISOString()}`);
        lines.push('');
        if (verifiedClaims.length > 0) {
            lines.push('## ✅ Verified Claims');
            lines.push('');
            verifiedClaims.forEach((vc, i) => {
                lines.push(`${i + 1}. **${vc.claim}**`);
                lines.push(`   - Confidence: ${vc.confidence}%`);
                lines.push(`   - Evidence: ${vc.evidence.join(', ')}`);
                lines.push('');
            });
        }
        if (falseClaims.length > 0) {
            lines.push('## ❌ False Claims');
            lines.push('');
            falseClaims.forEach((fc, i) => {
                lines.push(`${i + 1}. **${fc.claim}**`);
                lines.push(`   - Reality: ${fc.reality}`);
                lines.push(`   - Severity: ${fc.severity}`);
                lines.push(`   - Action: ${fc.recommended_action}`);
                lines.push('');
            });
        }
        return lines.join('\n');
    }
}
// Export singleton instance
export const victorVerifier = VictorVerifier.getInstance();
//# sourceMappingURL=victor-verifier.js.map