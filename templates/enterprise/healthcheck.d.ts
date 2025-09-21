#!/usr/bin/env node
export class HealthChecker {
    checks: any[];
    timeout: number;
    addCheck(name: any, checkFunction: any): void;
    runChecks(): Promise<{
        healthy: boolean;
        checks: ({
            name: any;
            status: string;
            duration: number;
            details: any;
            error?: undefined;
        } | {
            name: any;
            status: string;
            error: any;
            duration?: undefined;
            details?: undefined;
        })[];
    }>;
}
export const healthChecker: HealthChecker;
//# sourceMappingURL=healthcheck.d.ts.map