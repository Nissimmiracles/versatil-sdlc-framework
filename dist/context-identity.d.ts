/**
 * VERSATIL SDLC Framework - Context Identity Detection
 * Enables framework self-enhancement without context contamination
 *
 * Detects whether code is running in:
 * - Framework Development Mode (working ON VERSATIL)
 * - User Project Mode (working WITH VERSATIL)
 */
export interface ContextIdentity {
    role: 'framework-developer' | 'framework-user';
    intent: 'enhance-framework' | 'build-with-framework';
    audience: 'opera-team' | 'opera-customers';
    boundary: 'framework-internals' | 'customer-project';
    projectPath: string;
    isolation: {
        ragNamespace: string;
        learnStorage: string;
        blockedPatterns: string[];
        allowedPatterns: string[];
        allowedAgents: string[];
        blockedAgents: string[];
    };
}
/**
 * Detect context identity from project characteristics
 */
export declare function detectContextIdentity(workingDir: string): Promise<ContextIdentity>;
/**
 * Check if path matches any pattern (glob-style)
 */
export declare function matchesPattern(path: string, patterns: string[]): boolean;
/**
 * Validate if access to target path is allowed from source context
 */
export declare function validateAccess(identity: ContextIdentity, targetPath: string): {
    allowed: boolean;
    reason: string;
};
/**
 * Validate if agent invocation is allowed in current context
 */
export declare function validateAgent(identity: ContextIdentity, agentName: string): {
    allowed: boolean;
    reason: string;
};
