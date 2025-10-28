/**
 * VERSATIL SDLC Framework - Guardian Health Check (Lightweight)
 * Quick health check for before-prompt hook integration
 *
 * This is a LIGHTWEIGHT version that runs on every prompt (<100ms target)
 * For full health checks, use IrisGuardian.performHealthCheck()
 */
export interface QuickHealthStatus {
    overall_health: number;
    status: 'healthy' | 'degraded' | 'critical';
    critical_issues: string[];
    warnings: string[];
    context: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT';
}
/**
 * Quick health check for hook integration
 * Target: <100ms for lightweight, up to 5s for full health check
 *
 * @param workingDir - Working directory to check
 * @param role - User role (framework-developer or user)
 * @param runFullCheck - If true, runs comprehensive health check via IrisGuardian
 */
export declare function checkGuardianHealth(workingDir: string, role: 'framework-developer' | 'user', runFullCheck?: boolean): Promise<QuickHealthStatus>;
