/**
 * VERSATIL SDLC Framework - Guardian Type Definitions
 *
 * Shared types used across Guardian verification system
 */
export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';
export interface HealthCheckResult {
    overall_health: number;
    status: HealthStatus;
    components: Record<string, ComponentHealth>;
    issues: HealthIssue[];
    timestamp: string;
    resolvedContext?: any;
}
export interface ComponentHealth {
    score: number;
    status: HealthStatus;
    message: string;
    metrics?: Record<string, any>;
}
export interface HealthIssue {
    id?: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    component: string;
    description: string;
    root_cause?: string;
    confidence?: number;
    auto_fix_available?: boolean;
    recommendation?: string;
}
