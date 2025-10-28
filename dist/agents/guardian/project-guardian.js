/**
 * VERSATIL SDLC Framework - Project Guardian
 * Helps users leverage VERSATIL framework in their projects
 *
 * PROJECT_CONTEXT Operations:
 * - Monitor user's project health (their build/tests)
 * - Ensure framework agents activate correctly
 * - Check framework configuration in user project
 * - Monitor user's RAG queries
 * - Suggest framework updates if outdated
 * - Validate user's OPERA workflow
 *
 * This guardian ONLY operates when inside a user's project (has `.versatil-project.json`).
 */
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GuardianLogger } from './guardian-logger.js';
import { AgentMonitor } from './agent-monitor.js';
const execAsync = promisify(exec);
/**
 * Project Guardian - Helps users leverage VERSATIL
 */
export class ProjectGuardian {
    constructor(projectRoot) {
        this.logger = GuardianLogger.getInstance();
        this.agentMonitor = AgentMonitor.getInstance();
        this.projectRoot = projectRoot;
    }
    /**
     * Perform comprehensive project health check
     */
    async performHealthCheck() {
        const startTime = Date.now();
        console.log('🔍 Running Project Health Check...\n');
        // Run all health checks in parallel
        const [frameworkConfigCheck, agentActivationCheck, projectBuildCheck, projectTestsCheck, frameworkVersionCheck, ragUsageCheck] = await Promise.all([
            this.checkFrameworkConfig(),
            this.checkAgentActivation(),
            this.checkProjectBuild(),
            this.checkProjectTests(),
            this.checkFrameworkVersion(),
            this.checkRAGUsage()
        ]);
        const checks = {
            framework_config: frameworkConfigCheck,
            agent_activation: agentActivationCheck,
            project_build: projectBuildCheck,
            project_tests: projectTestsCheck,
            framework_version: frameworkVersionCheck,
            rag_usage: ragUsageCheck
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
     * Check framework configuration
     */
    async checkFrameworkConfig() {
        const startTime = Date.now();
        const issues = [];
        console.log('  Checking framework configuration...');
        // Check 1: .versatil-project.json exists
        const projectConfigPath = path.join(this.projectRoot, '.versatil-project.json');
        if (!fs.existsSync(projectConfigPath)) {
            issues.push('Missing .versatil-project.json - run versatil init');
            return {
                healthy: false,
                score: 0,
                latency_ms: Date.now() - startTime,
                details: { configured: false },
                issues
            };
        }
        // Check 2: Parse and validate configuration
        let config;
        try {
            config = JSON.parse(fs.readFileSync(projectConfigPath, 'utf-8'));
        }
        catch (error) {
            issues.push('Invalid .versatil-project.json format');
            return {
                healthy: false,
                score: 20,
                latency_ms: Date.now() - startTime,
                details: { configured: false },
                issues
            };
        }
        // Check 3: Validate required fields
        const requiredFields = ['projectName', 'projectType', 'frameworkVersion'];
        requiredFields.forEach(field => {
            if (!config[field]) {
                issues.push(`Missing required field: ${field}`);
            }
        });
        // Check 4: Validate agents configuration
        if (!config.agents || config.agents.length === 0) {
            issues.push('No agents configured - consider enabling Maria-QA, James-Frontend, or Marcus-Backend');
        }
        // Check 5: Check .claude/ directory structure
        const claudeDir = path.join(this.projectRoot, '.claude');
        if (!fs.existsSync(claudeDir)) {
            issues.push('Missing .claude/ directory');
        }
        else {
            const requiredDirs = ['agents', 'commands', 'hooks', 'skills'];
            requiredDirs.forEach(dir => {
                if (!fs.existsSync(path.join(claudeDir, dir))) {
                    issues.push(`Missing .claude/${dir}/ directory`);
                }
            });
        }
        const score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 15));
        return {
            healthy: issues.length === 0,
            score,
            latency_ms: Date.now() - startTime,
            details: {
                configured: true,
                project_name: config.projectName,
                project_type: config.projectType,
                agents: config.agents || []
            },
            issues
        };
    }
    /**
     * Check agent activation status
     */
    async checkAgentActivation() {
        const startTime = Date.now();
        console.log('  Checking agent activations...');
        const agentReport = await this.agentMonitor.performHealthCheck();
        const issues = [];
        // Check if any agents have activated in last 7 days
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        const hasRecentActivations = agentReport.activations_24h > 0;
        if (!hasRecentActivations) {
            issues.push('No agent activations in last 24h - agents may not be triggering correctly');
        }
        if (agentReport.failed_agents.length > 0) {
            issues.push(`${agentReport.failed_agents.length} agent(s) failing: ${agentReport.failed_agents.join(', ')}`);
        }
        return {
            healthy: agentReport.status === 'healthy' && hasRecentActivations,
            score: agentReport.overall_health,
            latency_ms: Date.now() - startTime,
            details: {
                activations_24h: agentReport.activations_24h,
                failures_24h: agentReport.failures_24h,
                healthy_agents: agentReport.healthy_agents,
                total_agents: agentReport.total_agents
            },
            issues
        };
    }
    /**
     * Check project build status
     */
    async checkProjectBuild() {
        const startTime = Date.now();
        const issues = [];
        console.log('  Checking project build...');
        // Check if package.json exists
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            issues.push('No package.json found - not a Node.js project');
            return {
                healthy: true, // Not applicable
                score: 100,
                latency_ms: Date.now() - startTime,
                details: { applicable: false },
                issues: []
            };
        }
        try {
            // Check if build script exists
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            if (!packageJson.scripts?.build) {
                issues.push('No build script defined');
                return {
                    healthy: true, // Not applicable
                    score: 100,
                    latency_ms: Date.now() - startTime,
                    details: { applicable: false },
                    issues: []
                };
            }
            // Try to run build
            const { stdout, stderr } = await execAsync('npm run build', {
                cwd: this.projectRoot,
                timeout: 120000 // 2min timeout
            });
            // Check for build warnings
            if (stderr && stderr.includes('warning')) {
                const warningCount = (stderr.match(/warning/gi) || []).length;
                if (warningCount > 10) {
                    issues.push(`${warningCount} build warnings`);
                }
            }
            const score = issues.length === 0 ? 100 : 85;
            return {
                healthy: issues.length === 0,
                score,
                latency_ms: Date.now() - startTime,
                details: { build_success: true, warnings: issues.length },
                issues
            };
        }
        catch (error) {
            issues.push(`Build failed: ${error.message.substring(0, 100)}`);
            return {
                healthy: false,
                score: 0,
                latency_ms: Date.now() - startTime,
                details: { build_success: false },
                issues
            };
        }
    }
    /**
     * Check project tests
     */
    async checkProjectTests() {
        const startTime = Date.now();
        const issues = [];
        console.log('  Checking project tests...');
        // Check if test script exists
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return {
                healthy: true, // Not applicable
                score: 100,
                latency_ms: Date.now() - startTime,
                details: { applicable: false },
                issues: []
            };
        }
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            if (!packageJson.scripts?.test) {
                issues.push('No test script defined');
                return {
                    healthy: true, // Not applicable
                    score: 100,
                    latency_ms: Date.now() - startTime,
                    details: { applicable: false },
                    issues: []
                };
            }
            // Try to run tests
            const { stdout, stderr } = await execAsync('npm test -- --passWithNoTests', {
                cwd: this.projectRoot,
                timeout: 120000
            });
            // Parse test results
            const passMatch = stdout.match(/(\d+) passed/);
            const failMatch = stdout.match(/(\d+) failed/);
            const passed = passMatch ? parseInt(passMatch[1]) : 0;
            const failed = failMatch ? parseInt(failMatch[1]) : 0;
            if (failed > 0) {
                issues.push(`${failed} test(s) failing`);
            }
            if (passed === 0 && failed === 0) {
                issues.push('No tests found - consider adding tests with Maria-QA');
            }
            const score = failed === 0 ? 100 : Math.max(0, 100 - (failed * 10));
            return {
                healthy: failed === 0,
                score,
                latency_ms: Date.now() - startTime,
                details: { passed, failed, has_tests: passed > 0 || failed > 0 },
                issues
            };
        }
        catch (error) {
            // Tests failing is captured above
            issues.push('Tests could not run');
            return {
                healthy: false,
                score: 50,
                latency_ms: Date.now() - startTime,
                details: { test_run_failed: true },
                issues
            };
        }
    }
    /**
     * Check framework version
     */
    async checkFrameworkVersion() {
        const startTime = Date.now();
        const issues = [];
        console.log('  Checking framework version...');
        // Get installed version
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            issues.push('No package.json found');
            return {
                healthy: false,
                score: 0,
                latency_ms: Date.now() - startTime,
                details: {},
                issues
            };
        }
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const installedVersion = packageJson.dependencies?.['versatil-sdlc-framework']
                || packageJson.devDependencies?.['versatil-sdlc-framework'];
            if (!installedVersion) {
                issues.push('VERSATIL framework not installed');
                return {
                    healthy: false,
                    score: 0,
                    latency_ms: Date.now() - startTime,
                    details: { installed: false },
                    issues
                };
            }
            // Check for latest version
            const { stdout } = await execAsync('npm view versatil-sdlc-framework version');
            const latestVersion = stdout.trim();
            const installed = installedVersion.replace(/[^0-9.]/g, '');
            const outdated = this.compareVersions(installed, latestVersion) < 0;
            if (outdated) {
                issues.push(`Framework outdated: v${installed} (latest: v${latestVersion})`);
            }
            const score = outdated ? 80 : 100;
            return {
                healthy: !outdated,
                score,
                latency_ms: Date.now() - startTime,
                details: {
                    installed_version: installed,
                    latest_version: latestVersion,
                    outdated
                },
                issues
            };
        }
        catch (error) {
            issues.push('Could not check framework version');
            return {
                healthy: true,
                score: 90,
                latency_ms: Date.now() - startTime,
                details: {},
                issues
            };
        }
    }
    /**
     * Check RAG usage
     */
    async checkRAGUsage() {
        const startTime = Date.now();
        const issues = [];
        console.log('  Checking RAG usage...');
        // Check if project is using RAG features
        const versatilHome = path.join(require('os').homedir(), '.versatil');
        const ragDir = path.join(versatilHome, 'rag');
        if (!fs.existsSync(ragDir)) {
            issues.push('RAG not initialized - run versatil rag init');
            return {
                healthy: true, // Not critical
                score: 100,
                latency_ms: Date.now() - startTime,
                details: { rag_enabled: false },
                issues: []
            };
        }
        // Check pattern count
        const patternsFile = path.join(ragDir, 'patterns.jsonl');
        let patternCount = 0;
        if (fs.existsSync(patternsFile)) {
            const content = fs.readFileSync(patternsFile, 'utf-8');
            patternCount = content.trim().split('\n').filter(l => l.trim()).length;
        }
        if (patternCount < 5) {
            issues.push(`Low pattern count: ${patternCount} - Use /learn to store more patterns`);
        }
        const score = patternCount >= 5 ? 100 : 85;
        return {
            healthy: true,
            score,
            latency_ms: Date.now() - startTime,
            details: {
                rag_enabled: true,
                pattern_count: patternCount
            },
            issues
        };
    }
    /**
     * Helper methods
     */
    getSuggestedFix(component, issue) {
        const fixes = {
            'framework_config': 'Run versatil init to configure framework',
            'agent_activation': 'Check agent triggers in .claude/agents/',
            'project_build': 'Fix build errors in your project',
            'project_tests': 'Fix failing tests or add tests with Maria-QA',
            'framework_version': 'Update framework: npm update versatil-sdlc-framework',
            'rag_usage': 'Use /learn to store patterns after completing features'
        };
        return fixes[component] || 'Manual investigation required';
    }
    getFixConfidence(component, issue) {
        if (issue.includes('Missing .versatil-project.json'))
            return 95;
        if (issue.includes('outdated'))
            return 90;
        if (issue.includes('No agents configured'))
            return 85;
        if (issue.includes('Build failed'))
            return 70;
        if (issue.includes('test'))
            return 65;
        return 50;
    }
    isAutoFixable(component, issue) {
        const autoFixablePatterns = [
            'Missing .versatil-project.json',
            'outdated',
            'No agents configured'
        ];
        return autoFixablePatterns.some(pattern => issue.includes(pattern));
    }
    generateRecommendations(checks, issues) {
        const recommendations = [];
        // Configuration recommendations
        if (checks.framework_config.score < 100) {
            recommendations.push('⚙️  Configure VERSATIL: versatil init');
        }
        // Agent recommendations
        if (checks.agent_activation.score < 80) {
            recommendations.push('🤖 Check agent triggers and definitions');
        }
        // Build recommendations
        if (checks.project_build.score < 100) {
            recommendations.push('🔧 Fix project build errors');
        }
        // Test recommendations
        if (checks.project_tests.details?.passed === 0) {
            recommendations.push('🧪 Add tests with Maria-QA for quality assurance');
        }
        // Version recommendations
        if (checks.framework_version.details?.outdated) {
            recommendations.push('📦 Update VERSATIL: npm update versatil-sdlc-framework');
        }
        // RAG recommendations
        if (checks.rag_usage.details?.pattern_count < 5) {
            recommendations.push('🧠 Store more patterns: Use /learn after completing features');
        }
        return recommendations;
    }
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 < p2)
                return -1;
            if (p1 > p2)
                return 1;
        }
        return 0;
    }
}
//# sourceMappingURL=project-guardian.js.map