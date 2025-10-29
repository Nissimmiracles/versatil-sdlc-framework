"use strict";
/**
 * VERSATIL SDLC Framework - Guardian Health Check (Lightweight)
 * Quick health check for before-prompt hook integration
 *
 * This is a LIGHTWEIGHT version that runs on every prompt (<100ms target)
 * For full health checks, use IrisGuardian.performHealthCheck()
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGuardianHealth = checkGuardianHealth;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Quick health check for hook integration
 * Target: <100ms for lightweight, up to 5s for full health check
 *
 * @param workingDir - Working directory to check
 * @param role - User role (framework-developer or user)
 * @param runFullCheck - If true, runs comprehensive health check via IrisGuardian
 */
async function checkGuardianHealth(workingDir, role, runFullCheck = false) {
    const startTime = Date.now();
    const critical_issues = [];
    const warnings = [];
    const context = role === 'framework-developer' ? 'FRAMEWORK_CONTEXT' : 'PROJECT_CONTEXT';
    // If full health check requested (every 5 minutes), use IrisGuardian
    if (runFullCheck) {
        try {
            const { IrisGuardian } = await Promise.resolve().then(() => __importStar(require('./iris-guardian.js')));
            const guardian = new IrisGuardian();
            const fullHealth = await guardian.performHealthCheck();
            // Convert full health check to QuickHealthStatus format
            const criticalIssues = fullHealth.issues.filter(i => i.severity === 'critical');
            const highIssues = fullHealth.issues.filter(i => i.severity === 'high');
            criticalIssues.forEach(issue => {
                critical_issues.push(`${issue.component}: ${issue.description}`);
            });
            highIssues.forEach(issue => {
                warnings.push(`${issue.component}: ${issue.description}`);
            });
            // Map HealthStatus to QuickHealthStatus format (filter out 'unknown')
            let mappedStatus = 'critical';
            if (fullHealth.status === 'healthy') {
                mappedStatus = 'healthy';
            }
            else if (fullHealth.status === 'degraded') {
                mappedStatus = 'degraded';
            }
            else if (fullHealth.status === 'critical' || fullHealth.status === 'unknown') {
                mappedStatus = 'critical';
            }
            return {
                overall_health: fullHealth.overall_health,
                status: mappedStatus,
                critical_issues,
                warnings,
                context
            };
        }
        catch (error) {
            // If full health check fails, fall back to lightweight check
            console.error(`⚠️  [Guardian] Full health check failed, falling back to lightweight: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Lightweight health check (runs on every prompt)
    // FRAMEWORK_CONTEXT checks
    if (context === 'FRAMEWORK_CONTEXT') {
        // Check 1: dist/ directory exists (build output)
        const distDir = path.join(workingDir, 'dist');
        if (!fs.existsSync(distDir)) {
            critical_issues.push('Framework not built - run npm run build');
        }
        // Check 2: Hook files exist
        const hooksDir = path.join(workingDir, '.claude', 'hooks', 'dist');
        const requiredHooks = ['before-prompt.cjs', 'post-file-edit.cjs', 'session-codify.cjs'];
        const missingHooks = requiredHooks.filter(h => !fs.existsSync(path.join(hooksDir, h)));
        if (missingHooks.length > 0) {
            critical_issues.push(`Missing hooks: ${missingHooks.join(', ')} - run npm run build:hooks`);
        }
        // Check 3: package.json exists and valid
        const packageJsonPath = path.join(workingDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            critical_issues.push('Missing package.json');
        }
    }
    // PROJECT_CONTEXT checks
    if (context === 'PROJECT_CONTEXT') {
        // Check 1: .versatil-project.json exists
        const projectConfigPath = path.join(workingDir, '.versatil-project.json');
        if (!fs.existsSync(projectConfigPath)) {
            warnings.push('VERSATIL not configured - run versatil init');
        }
        else {
            // Check if config is valid
            try {
                const config = JSON.parse(fs.readFileSync(projectConfigPath, 'utf-8'));
                if (!config.agents || config.agents.length === 0) {
                    warnings.push('No agents configured in .versatil-project.json');
                }
            }
            catch (error) {
                critical_issues.push('Invalid .versatil-project.json format');
            }
        }
        // Check 2: Framework installed
        const packageJsonPath = path.join(workingDir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                const hasFramework = packageJson.dependencies?.['versatil-sdlc-framework'] ||
                    packageJson.devDependencies?.['versatil-sdlc-framework'];
                if (!hasFramework) {
                    warnings.push('VERSATIL framework not installed');
                }
            }
            catch (error) {
                // Ignore package.json parse errors
            }
        }
    }
    // Calculate overall health
    let overall_health = 100;
    overall_health -= critical_issues.length * 30; // Each critical issue = -30 points
    overall_health -= warnings.length * 10; // Each warning = -10 points
    overall_health = Math.max(0, overall_health);
    let status;
    if (overall_health >= 90) {
        status = 'healthy';
    }
    else if (overall_health >= 60) {
        status = 'degraded';
    }
    else {
        status = 'critical';
    }
    const duration = Date.now() - startTime;
    // Log if took too long (target: <100ms)
    if (duration > 100) {
        console.error(`⚠️  [Guardian] Health check took ${duration}ms (target: <100ms)`);
    }
    return {
        overall_health,
        status,
        critical_issues,
        warnings,
        context
    };
}
