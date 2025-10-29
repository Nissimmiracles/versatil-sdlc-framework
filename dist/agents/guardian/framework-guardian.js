/**
 * VERSATIL SDLC Framework - Framework Guardian
 * Manages framework development, releases, and evolution
 *
 * FRAMEWORK_CONTEXT Operations:
 * - Monitor framework codebase (src/, tests/, .claude/)
 * - Manage framework version releases
 * - Track framework evolution and update roadmap
 * - Fix framework TypeScript errors, test failures
 * - Restart framework dev services (Neo4j, Redis)
 * - Monitor framework dependencies
 *
 * This guardian ONLY operates when inside the VERSATIL framework repository.
 */
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GuardianLogger } from './guardian-logger.js';
import { RAGHealthMonitor } from './rag-health-monitor.js';
import { AgentMonitor } from './agent-monitor.js';
const execAsync = promisify(exec);
/**
 * Framework Guardian - Manages framework development
 */
export class FrameworkGuardian {
    constructor(frameworkRoot) {
        this.logger = GuardianLogger.getInstance();
        this.ragMonitor = RAGHealthMonitor.getInstance();
        this.agentMonitor = AgentMonitor.getInstance();
        this.frameworkRoot = frameworkRoot;
    }
    /**
     * Perform comprehensive framework health check
     */
    async performHealthCheck() {
        const startTime = Date.now();
        console.log('🔍 Running Framework Health Check...\n');
        // Run all health checks in parallel
        const [buildCheck, testsCheck, typescriptCheck, dependenciesCheck, ragCheck, agentsCheck, hooksCheck, docsCheck] = await Promise.all([
            this.checkBuild(),
            this.checkTests(),
            this.checkTypeScript(),
            this.checkDependencies(),
            this.checkRAGSystem(),
            this.checkAgents(),
            this.checkHooks(),
            this.checkDocumentation()
        ]);
        const checks = {
            build: buildCheck,
            tests: testsCheck,
            typescript: typescriptCheck,
            dependencies: dependenciesCheck,
            rag_system: ragCheck,
            agents: agentsCheck,
            hooks: hooksCheck,
            documentation: docsCheck
        };
        // Calculate overall health
        const scores = Object.values(checks).map(c => c.score);
        const overall_health = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        let status;
        if (overall_health >= 90) {
            status = 'healthy';
        }
        else if (overall_health >= 70) {
            status = 'degraded';
        }
        else {
            status = 'critical';
        }
        // Collect all issues
        const issues = [];
        Object.entries(checks).forEach(([component, check]) => {
            check.issues.forEach(issue => {
                issues.push({
                    component,
                    severity: check.score < 50 ? 'critical' : check.score < 70 ? 'high' : check.score < 90 ? 'medium' : 'low',
                    description: issue,
                    suggested_fix: this.getSuggestedFix(component, issue),
                    confidence: this.getFixConfidence(component, issue),
                    auto_fixable: this.isAutoFixable(component, issue)
                });
            });
        });
        // Generate recommendations
        const recommendations = this.generateRecommendations(checks, issues);
        const result = {
            overall_health,
            status,
            checks,
            issues,
            recommendations,
            timestamp: new Date().toISOString()
        };
        // Log health check
        this.logger.logHealthCheck({
            overall_health,
            status,
            components: checks,
            issues: issues.map(i => ({ component: i.component, severity: i.severity, description: i.description })),
            duration_ms: Date.now() - startTime
        });
        return result;
    }
    /**
     * Check framework build status
     */
    async checkBuild() {
        const startTime = Date.now();
        const issues = [];
        try {
            console.log('  Building framework...');
            const { stdout, stderr } = await execAsync('npm run build', {
                cwd: this.frameworkRoot,
                timeout: 300000 // 5min timeout - allows for slow builds
            });
            // Check for build warnings
            if (stderr && stderr.includes('warning')) {
                const warningCount = (stderr.match(/warning/gi) || []).length;
                issues.push(`${warningCount} build warning(s) detected`);
            }
            // Check dist/ directory exists
            const distDir = path.join(this.frameworkRoot, 'dist');
            if (!fs.existsSync(distDir)) {
                issues.push('dist/ directory not created');
                return {
                    healthy: false,
                    score: 0,
                    latency_ms: Date.now() - startTime,
                    details: { error: 'Build output missing' },
                    issues
                };
            }
            // Check critical files exist
            const criticalFiles = [
                'dist/agents/core/agent-registry.js',
                'dist/rag/pattern-search.js',
                'dist/orchestration/opera-orchestrator.js'
            ];
            const missingFiles = criticalFiles.filter(f => !fs.existsSync(path.join(this.frameworkRoot, f)));
            if (missingFiles.length > 0) {
                issues.push(`Missing critical files: ${missingFiles.join(', ')}`);
            }
            const score = issues.length === 0 ? 100 : issues.length === 1 ? 85 : 70;
            return {
                healthy: issues.length === 0,
                score,
                latency_ms: Date.now() - startTime,
                details: { warnings: issues.length, dist_size_mb: this.getDistSize() },
                issues
            };
        }
        catch (error) {
            issues.push(`Build failed: ${error.message}`);
            return {
                healthy: false,
                score: 0,
                latency_ms: Date.now() - startTime,
                details: { error: error.message },
                issues
            };
        }
    }
    /**
     * Check framework tests
     */
    async checkTests() {
        const startTime = Date.now();
        const issues = [];
        try {
            console.log('  Running tests...');
            const { stdout, stderr } = await execAsync('npm test -- --passWithNoTests', {
                cwd: this.frameworkRoot,
                timeout: 300000 // 5min timeout - allows for full test suites
            });
            // Parse test results
            const passMatch = stdout.match(/(\d+) passed/);
            const failMatch = stdout.match(/(\d+) failed/);
            const coverageMatch = stdout.match(/All files\s+\|\s+([\d.]+)/);
            const passed = passMatch ? parseInt(passMatch[1]) : 0;
            const failed = failMatch ? parseInt(failMatch[1]) : 0;
            const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
            if (failed > 0) {
                issues.push(`${failed} test(s) failing`);
            }
            if (coverage < 80) {
                issues.push(`Coverage below 80%: ${coverage.toFixed(1)}%`);
            }
            let score = 100;
            if (failed > 0)
                score -= (failed * 10);
            if (coverage < 80)
                score -= 20;
            score = Math.max(0, score);
            return {
                healthy: failed === 0 && coverage >= 80,
                score,
                latency_ms: Date.now() - startTime,
                details: { passed, failed, coverage },
                issues
            };
        }
        catch (error) {
            issues.push(`Tests failed: ${error.message}`);
            return {
                healthy: false,
                score: 0,
                latency_ms: Date.now() - startTime,
                details: { error: error.message },
                issues
            };
        }
    }
    /**
     * Check TypeScript compilation
     */
    async checkTypeScript() {
        const startTime = Date.now();
        const issues = [];
        try {
            console.log('  Checking TypeScript...');
            const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
                cwd: this.frameworkRoot,
                timeout: 300000 // 5min timeout
            });
            // No errors = success
            return {
                healthy: true,
                score: 100,
                latency_ms: Date.now() - startTime,
                details: { errors: 0 },
                issues
            };
        }
        catch (error) {
            // Parse TypeScript errors
            const errorMatch = error.stdout?.match(/Found (\d+) error/);
            const errorCount = errorMatch ? parseInt(errorMatch[1]) : 1;
            issues.push(`${errorCount} TypeScript error(s)`);
            const score = Math.max(0, 100 - (errorCount * 5));
            return {
                healthy: false,
                score,
                latency_ms: Date.now() - startTime,
                details: { errors: errorCount, output: error.stdout },
                issues
            };
        }
    }
    /**
     * Check framework dependencies
     */
    async checkDependencies() {
        const startTime = Date.now();
        const issues = [];
        try {
            console.log('  Auditing dependencies...');
            // Check for outdated dependencies
            const { stdout: outdated } = await execAsync('npm outdated --json || true', {
                cwd: this.frameworkRoot
            });
            let outdatedCount = 0;
            if (outdated.trim()) {
                const outdatedPackages = JSON.parse(outdated);
                outdatedCount = Object.keys(outdatedPackages).length;
                if (outdatedCount > 10) {
                    issues.push(`${outdatedCount} outdated dependencies`);
                }
            }
            // Check for security vulnerabilities
            const { stdout: audit } = await execAsync('npm audit --json || true', {
                cwd: this.frameworkRoot
            });
            const auditResult = JSON.parse(audit);
            const vulnerabilities = auditResult.metadata?.vulnerabilities || {};
            const critical = vulnerabilities.critical || 0;
            const high = vulnerabilities.high || 0;
            if (critical > 0) {
                issues.push(`${critical} critical security vulnerabilities`);
            }
            if (high > 0) {
                issues.push(`${high} high security vulnerabilities`);
            }
            let score = 100;
            if (critical > 0)
                score -= 30;
            if (high > 0)
                score -= 15;
            if (outdatedCount > 10)
                score -= 10;
            score = Math.max(0, score);
            return {
                healthy: critical === 0 && high === 0,
                score,
                latency_ms: Date.now() - startTime,
                details: { outdated: outdatedCount, vulnerabilities },
                issues
            };
        }
        catch (error) {
            issues.push(`Dependency check failed: ${error.message}`);
            return {
                healthy: false,
                score: 50,
                latency_ms: Date.now() - startTime,
                details: { error: error.message },
                issues
            };
        }
    }
    /**
     * Check RAG system health
     */
    async checkRAGSystem() {
        const startTime = Date.now();
        console.log('  Checking RAG system...');
        const ragReport = await this.ragMonitor.performHealthCheck();
        return {
            healthy: ragReport.status === 'healthy',
            score: ragReport.overall_health,
            latency_ms: Date.now() - startTime,
            details: {
                graphrag: ragReport.components.graphrag.status,
                vector: ragReport.components.vector.status,
                router: ragReport.components.router.status
            },
            issues: ragReport.issues.map(i => i.description)
        };
    }
    /**
     * Check agents health
     */
    async checkAgents() {
        const startTime = Date.now();
        console.log('  Checking agents...');
        const agentReport = await this.agentMonitor.performHealthCheck();
        return {
            healthy: agentReport.status === 'healthy',
            score: agentReport.overall_health,
            latency_ms: Date.now() - startTime,
            details: {
                total: agentReport.total_agents,
                healthy: agentReport.healthy_agents,
                failed: agentReport.failed_agents.length
            },
            issues: agentReport.issues.map(i => `${i.agent}: ${i.description}`)
        };
    }
    /**
     * Check hooks
     */
    async checkHooks() {
        const startTime = Date.now();
        const issues = [];
        console.log('  Checking hooks...');
        const hooksDir = path.join(this.frameworkRoot, '.claude', 'hooks', 'dist');
        const requiredHooks = [
            'before-prompt.cjs',
            'post-file-edit.cjs',
            'session-codify.cjs',
            'post-action-validator.cjs'
        ];
        const missingHooks = requiredHooks.filter(h => !fs.existsSync(path.join(hooksDir, h)));
        if (missingHooks.length > 0) {
            issues.push(`Missing hooks: ${missingHooks.join(', ')}`);
        }
        // Check hook file sizes (should not be empty)
        requiredHooks.forEach(hook => {
            const hookPath = path.join(hooksDir, hook);
            if (fs.existsSync(hookPath)) {
                const stats = fs.statSync(hookPath);
                if (stats.size < 100) {
                    issues.push(`Hook ${hook} appears empty (${stats.size} bytes)`);
                }
            }
        });
        const score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20));
        return {
            healthy: issues.length === 0,
            score,
            latency_ms: Date.now() - startTime,
            details: { total_hooks: requiredHooks.length, missing: missingHooks.length },
            issues
        };
    }
    /**
     * Check documentation
     */
    async checkDocumentation() {
        const startTime = Date.now();
        const issues = [];
        console.log('  Checking documentation...');
        const requiredDocs = [
            'README.md',
            'CLAUDE.md',
            'docs/VERSATIL_ARCHITECTURE.md',
            'docs/OPERA_METHODOLOGY.md',
            '.claude/agents/README.md',
            '.claude/skills/README.md'
        ];
        const missingDocs = requiredDocs.filter(d => !fs.existsSync(path.join(this.frameworkRoot, d)));
        if (missingDocs.length > 0) {
            issues.push(`Missing docs: ${missingDocs.join(', ')}`);
        }
        // Check if CHANGELOG is up to date
        const changelogPath = path.join(this.frameworkRoot, 'CHANGELOG.md');
        if (fs.existsSync(changelogPath)) {
            const content = fs.readFileSync(changelogPath, 'utf-8');
            const packageJson = JSON.parse(fs.readFileSync(path.join(this.frameworkRoot, 'package.json'), 'utf-8'));
            if (!content.includes(packageJson.version)) {
                issues.push(`CHANGELOG not updated for v${packageJson.version}`);
            }
        }
        const score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 15));
        return {
            healthy: issues.length === 0,
            score,
            latency_ms: Date.now() - startTime,
            details: { total_docs: requiredDocs.length, missing: missingDocs.length },
            issues
        };
    }
    /**
     * Track framework evolution
     */
    async trackEvolution() {
        const packageJson = JSON.parse(fs.readFileSync(path.join(this.frameworkRoot, 'package.json'), 'utf-8'));
        const current_version = packageJson.version;
        // Parse next version from roadmap
        const roadmapPath = path.join(this.frameworkRoot, 'docs', 'VERSATIL_ROADMAP.md');
        let next_version = current_version;
        if (fs.existsSync(roadmapPath)) {
            const roadmap = fs.readFileSync(roadmapPath, 'utf-8');
            const versionMatch = roadmap.match(/v([\d.]+)/);
            if (versionMatch) {
                next_version = versionMatch[1];
            }
        }
        // Parse planned features from roadmap
        const planned_features = this.parseRoadmapFeatures('planned');
        const completed_features = this.parseRoadmapFeatures('completed');
        // Calculate roadmap status
        const roadmap_status = this.calculateRoadmapStatus();
        // Parse breaking changes from CHANGELOG
        const breaking_changes = this.parseBreakingChanges();
        const deprecations = this.parseDeprecations();
        return {
            current_version,
            next_version,
            planned_features,
            completed_features,
            roadmap_status,
            breaking_changes,
            deprecations
        };
    }
    /**
     * Helper methods
     */
    getDistSize() {
        const distDir = path.join(this.frameworkRoot, 'dist');
        if (!fs.existsSync(distDir))
            return 0;
        let totalSize = 0;
        const walk = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    walk(filePath);
                }
                else {
                    totalSize += stats.size;
                }
            });
        };
        walk(distDir);
        return Math.round(totalSize / (1024 * 1024)); // MB
    }
    getSuggestedFix(component, issue) {
        const fixes = {
            'build': 'Run npm run build to rebuild',
            'tests': 'Fix failing tests or update snapshots',
            'typescript': 'Fix TypeScript errors in affected files',
            'dependencies': 'Run npm audit fix or npm update',
            'rag_system': 'Check Neo4j and Supabase connections',
            'agents': 'Validate agent definitions and rebuild',
            'hooks': 'Rebuild hooks: npm run build:hooks',
            'documentation': 'Update missing documentation files'
        };
        return fixes[component] || 'Manual investigation required';
    }
    getFixConfidence(component, issue) {
        if (issue.includes('Build failed'))
            return 90;
        if (issue.includes('TypeScript error'))
            return 85;
        if (issue.includes('Missing'))
            return 95;
        if (issue.includes('test'))
            return 70;
        if (issue.includes('outdated'))
            return 60;
        return 50;
    }
    isAutoFixable(component, issue) {
        const autoFixablePatterns = [
            'Missing hooks',
            'Build failed',
            'Missing critical files',
            'outdated dependencies'
        ];
        return autoFixablePatterns.some(pattern => issue.includes(pattern));
    }
    generateRecommendations(checks, issues) {
        const recommendations = [];
        // Critical issues first
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            recommendations.push(`🚨 ${criticalIssues.length} critical issue(s) - Fix immediately`);
        }
        // Component-specific recommendations
        if (checks.build.score < 100) {
            recommendations.push('🔧 Run npm run build to rebuild framework');
        }
        if (checks.tests.score < 80) {
            recommendations.push('🧪 Fix failing tests to ensure quality');
        }
        if (checks.typescript.score < 100) {
            recommendations.push('📝 Fix TypeScript errors for type safety');
        }
        if (checks.dependencies.score < 90) {
            recommendations.push('📦 Update dependencies: npm audit fix && npm update');
        }
        return recommendations;
    }
    parseRoadmapFeatures(status) {
        const roadmapPath = path.join(this.frameworkRoot, 'docs', 'VERSATIL_ROADMAP.md');
        if (!fs.existsSync(roadmapPath))
            return [];
        const content = fs.readFileSync(roadmapPath, 'utf-8');
        const features = [];
        const regex = status === 'completed'
            ? /- \[x\] (.+)/gi
            : /- \[ \] (.+)/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
            features.push(match[1]);
        }
        return features;
    }
    calculateRoadmapStatus() {
        const roadmapPath = path.join(this.frameworkRoot, 'docs', 'VERSATIL_ROADMAP.md');
        if (!fs.existsSync(roadmapPath)) {
            return { total_milestones: 0, completed_milestones: 0, in_progress_milestones: 0, progress_percentage: 0 };
        }
        const content = fs.readFileSync(roadmapPath, 'utf-8');
        const total = (content.match(/- \[[ x]\]/g) || []).length;
        const completed = (content.match(/- \[x\]/g) || []).length;
        return {
            total_milestones: total,
            completed_milestones: completed,
            in_progress_milestones: total - completed,
            progress_percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }
    parseBreakingChanges() {
        const changelogPath = path.join(this.frameworkRoot, 'CHANGELOG.md');
        if (!fs.existsSync(changelogPath))
            return [];
        const content = fs.readFileSync(changelogPath, 'utf-8');
        const changes = [];
        const regex = /BREAKING CHANGE: (.+)/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
            changes.push(match[1]);
        }
        return changes.slice(0, 10); // Last 10 breaking changes
    }
    parseDeprecations() {
        const changelogPath = path.join(this.frameworkRoot, 'CHANGELOG.md');
        if (!fs.existsSync(changelogPath))
            return [];
        const content = fs.readFileSync(changelogPath, 'utf-8');
        const deprecations = [];
        const regex = /DEPRECATED: (.+)/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
            deprecations.push(match[1]);
        }
        return deprecations.slice(0, 10); // Last 10 deprecations
    }
}
//# sourceMappingURL=framework-guardian.js.map