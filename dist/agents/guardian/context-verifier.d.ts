/**
 * VERSATIL SDLC Framework - Context Layer Verifier
 *
 * Verifies issues in the Context Layer (preferences & conventions):
 * - User preferences (indentation, quotes, naming, async style)
 * - Team conventions (code style, commit format, testing policy)
 * - Project vision alignment (goals, values, priorities)
 * - Style consistency (across codebase)
 *
 * Part of Guardian's anti-hallucination system (v7.7.0+)
 *
 * Context Priority: User > Team > Project > Framework
 */
import type { HealthIssue } from './types.js';
export interface ContextVerification {
    claim: string;
    verified: boolean;
    method: string;
    confidence: number;
    evidence?: {
        user_preference?: any;
        team_convention?: any;
        project_vision?: any;
        actual_value?: any;
        expected_value?: any;
        priority_violation?: {
            expected_priority: string;
            actual_priority: string;
        };
        error_details?: string;
    };
}
export interface PriorityViolation {
    field: string;
    expected_value: string;
    actual_value: string;
    expected_priority: 'User' | 'Team' | 'Project' | 'Framework';
    actual_priority: 'User' | 'Team' | 'Project' | 'Framework';
    severity: 'critical' | 'high' | 'medium' | 'low';
    explanation: string;
}
export interface ContextVerificationResult {
    issue_id: string;
    layer: 'context';
    verified: boolean;
    confidence: number;
    verifications: ContextVerification[];
    recommended_fix?: string;
    responsible_agent?: string;
    priority_violation?: PriorityViolation;
}
/**
 * Verify context layer issue using ground truth methods
 *
 * @param resolvedContext - Optional resolved context from Context Priority Resolver (v7.8.0)
 */
export declare function verifyContextIssue(issue: HealthIssue, workingDir: string, userId?: string, teamId?: string, projectId?: string, resolvedContext?: any): Promise<ContextVerificationResult>;
