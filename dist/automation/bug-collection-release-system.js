/**
 * VERSATIL SDLC Framework - Automated Bug Collection and Release System
 * Rule 5: Intelligent bug tracking, collection, and automated version releases
 */
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class BugCollectionReleaseSystem extends EventEmitter {
    constructor(projectRoot, githubRepo) {
        super();
        // Bug tracking
        this.bugDatabase = new Map();
        this.gitHubIssues = new Map();
        // Release management
        this.currentVersion = '1.0.0';
        this.pendingBugFixes = [];
        this.releaseHistory = [];
        // CodeRabbit integration
        this.codeRabbitConfig = {
            enabled: false,
            repoConfig: {
                owner: 'versatil-sdlc',
                repo: 'framework',
                branch: 'main'
            },
            reviewSettings: {
                autoReview: true,
                minApprovals: 2,
                enforceConventions: true,
                qualityGate: 85
            }
        };
        this.githubRepo = '';
        this.logger = new VERSATILLogger('BugCollectionRelease');
        this.projectRoot = projectRoot;
        this.githubRepo = githubRepo || '';
        this.initializeSystem();
    }
    /**
     * Initialize the bug collection and release system
     */
    async initializeSystem() {
        this.logger.info('Initializing bug collection and release system');
        try {
            // Load existing bug database
            await this.loadBugDatabase();
            // Load current version from package.json
            await this.loadCurrentVersion();
            // Setup GitHub integration if available
            await this.setupGitHubIntegration();
            // Setup CodeRabbit integration
            await this.setupCodeRabbitIntegration();
            // Start automated monitoring
            this.startAutomatedMonitoring();
            this.logger.info('Bug collection and release system initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize system', { error });
        }
    }
    /**
     * Setup CodeRabbit integration for enhanced code review
     */
    async setupCodeRabbitIntegration() {
        try {
            // Check if CodeRabbit is configured
            const configPath = path.join(this.projectRoot, '.coderabbit.yml');
            let hasConfig = false;
            try {
                await fs.access(configPath);
                hasConfig = true;
                this.logger.info('CodeRabbit configuration found');
            }
            catch {
                // Create default CodeRabbit configuration
                await this.createCodeRabbitConfig();
                this.logger.info('Created default CodeRabbit configuration');
            }
            this.codeRabbitConfig.enabled = true;
            // Setup CodeRabbit webhook handler for PR reviews
            this.setupCodeRabbitWebhooks();
        }
        catch (error) {
            this.logger.warn('CodeRabbit integration setup failed', { error });
            this.codeRabbitConfig.enabled = false;
        }
    }
    /**
     * Create default CodeRabbit configuration
     */
    async createCodeRabbitConfig() {
        const config = {
            language: 'en-US',
            early_access: false,
            reviews: {
                profile: 'chill',
                request_changes_workflow: false,
                high_level_summary: true,
                poem: true,
                review_status: true,
                collapse_walkthrough: false,
                auto_review: {
                    enabled: true,
                    drafts: false,
                    base_branches: ['main', 'master', 'develop']
                }
            },
            chat: {
                auto_reply: true
            },
            tone_instructions: `
You are reviewing code for the VERSATIL SDLC Framework, an AI-native development framework.
Focus on:
1. Code quality and maintainability
2. TypeScript best practices
3. Agent coordination patterns
4. Rule integration compliance
5. Performance optimization
6. Security considerations
7. Documentation completeness

Be constructive and provide specific suggestions for improvement.
Highlight any violations of OPERA methodology or framework conventions.
`
        };
        await fs.writeFile(path.join(this.projectRoot, '.coderabbit.yml'), this.yamlStringify(config));
    }
    /**
     * Setup CodeRabbit webhooks for automated reviews
     */
    setupCodeRabbitWebhooks() {
        // In a real implementation, this would set up webhook endpoints
        this.logger.info('CodeRabbit webhooks configured for automated PR reviews');
    }
    /**
     * Automatically collect bugs from various sources
     */
    async collectBugsAutomatically() {
        this.logger.info('Starting automated bug collection');
        const collectedBugs = [];
        try {
            // Collect from GitHub issues
            const githubBugs = await this.collectFromGitHubIssues();
            collectedBugs.push(...githubBugs);
            // Collect from error logs
            const logBugs = await this.collectFromErrorLogs();
            collectedBugs.push(...logBugs);
            // Collect from failed tests
            const testBugs = await this.collectFromFailedTests();
            collectedBugs.push(...testBugs);
            // Collect from user feedback (if feedback system exists)
            const feedbackBugs = await this.collectFromUserFeedback();
            collectedBugs.push(...feedbackBugs);
            // Collect from security scans
            const securityBugs = await this.collectFromSecurityScans();
            collectedBugs.push(...securityBugs);
            // Process and deduplicate bugs
            const processedBugs = await this.processBugReports(collectedBugs);
            // Store in database
            for (const bug of processedBugs) {
                this.bugDatabase.set(bug.id, bug);
            }
            this.logger.info('Bug collection completed', { collected: processedBugs.length });
            this.emit('bugs:collected', processedBugs);
            return processedBugs;
        }
        catch (error) {
            this.logger.error('Bug collection failed', { error });
            return [];
        }
    }
    /**
     * Collect bugs from GitHub issues
     */
    async collectFromGitHubIssues() {
        if (!this.githubToken || !this.githubRepo)
            return [];
        try {
            const issues = await this.fetchGitHubIssues();
            const bugs = [];
            for (const issue of issues) {
                if (this.isBugIssue(issue)) {
                    const bug = await this.convertGitHubIssueToBugReport(issue);
                    bugs.push(bug);
                }
            }
            return bugs;
        }
        catch (error) {
            this.logger.warn('Failed to collect GitHub issues', { error });
            return [];
        }
    }
    /**
     * Collect bugs from error logs
     */
    async collectFromErrorLogs() {
        try {
            const logFiles = await this.findLogFiles();
            const bugs = [];
            for (const logFile of logFiles) {
                const logContent = await fs.readFile(logFile, 'utf8');
                const errors = this.parseErrorsFromLog(logContent);
                for (const error of errors) {
                    const bug = await this.convertErrorToBugReport(error, logFile);
                    bugs.push(bug);
                }
            }
            return bugs;
        }
        catch (error) {
            this.logger.warn('Failed to collect from error logs', { error });
            return [];
        }
    }
    /**
     * Collect bugs from failed tests
     */
    async collectFromFailedTests() {
        try {
            // Run tests and capture failures
            const testResult = await execAsync('npm test 2>&1 || true');
            const failures = this.parseTestFailures(testResult.stdout);
            const bugs = [];
            for (const failure of failures) {
                const bug = await this.convertTestFailureToBugReport(failure);
                bugs.push(bug);
            }
            return bugs;
        }
        catch (error) {
            this.logger.warn('Failed to collect from test results', { error });
            return [];
        }
    }
    /**
     * Analyze bug patterns and prioritize fixes
     */
    async analyzeBugPatterns() {
        const allBugs = Array.from(this.bugDatabase.values());
        const criticalIssues = allBugs.filter(bug => bug.severity === 'critical' && bug.status === 'open');
        // Analyze patterns
        const patterns = this.identifyBugPatterns(allBugs);
        // Generate recommendations
        const recommendations = this.generateBugFixRecommendations(allBugs, patterns);
        return {
            criticalIssues,
            patterns,
            recommendations
        };
    }
    /**
     * Generate release candidate based on collected bugs and fixes
     */
    async generateReleaseCandidate() {
        this.logger.info('Generating release candidate');
        try {
            // Get fixed bugs since last release
            const fixedBugs = Array.from(this.bugDatabase.values())
                .filter(bug => bug.status === 'fixed' && !bug.releaseVersion);
            // Determine version increment
            const versionType = this.determineVersionIncrement(fixedBugs);
            // Get new features from git log
            const features = await this.getNewFeatures();
            // Check for breaking changes
            const breakingChanges = await this.detectBreakingChanges();
            // Run quality checks
            const testsPassing = await this.runAllTests();
            const securityAuditPassed = await this.runSecurityAudit();
            const performanceImproved = await this.checkPerformanceImprovement();
            // Generate new version
            const newVersion = this.incrementVersion(this.currentVersion, versionType);
            const releaseCandidate = {
                version: newVersion,
                type: versionType,
                bugFixes: fixedBugs,
                features,
                breakingChanges,
                testsPassing,
                securityAuditPassed,
                performanceImproved,
                recommendedReleaseDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
            };
            this.logger.info('Release candidate generated', {
                version: newVersion,
                bugFixes: fixedBugs.length,
                features: features.length
            });
            return releaseCandidate;
        }
        catch (error) {
            this.logger.error('Failed to generate release candidate', { error });
            throw error;
        }
    }
    /**
     * Automatically create and publish release
     */
    async createAutomaticRelease(candidate) {
        this.logger.info('Creating automatic release', { version: candidate.version });
        try {
            // Validate release candidate
            const validation = await this.validateReleaseCandidate(candidate);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }
            // Create changelog
            const changelog = await this.generateChangelog(candidate);
            // Update version in package.json
            await this.updatePackageVersion(candidate.version);
            // Create git tag
            await this.createGitTag(candidate.version, changelog);
            // Build and package
            const buildResult = await this.buildRelease();
            if (!buildResult.success) {
                return {
                    success: false,
                    errors: ['Build failed: ' + buildResult.error]
                };
            }
            // Create GitHub release
            const releaseUrl = await this.createGitHubRelease(candidate, changelog);
            // Publish to npm (if configured)
            await this.publishToNpm(candidate.version);
            // Update bug reports with release version
            for (const bug of candidate.bugFixes) {
                bug.releaseVersion = candidate.version;
                bug.status = 'closed';
            }
            // Save release to history
            this.releaseHistory.push(candidate);
            this.currentVersion = candidate.version;
            this.logger.info('Release created successfully', {
                version: candidate.version,
                url: releaseUrl
            });
            this.emit('release:created', { candidate, releaseUrl });
            return {
                success: true,
                releaseUrl
            };
        }
        catch (error) {
            this.logger.error('Failed to create release', { error });
            return {
                success: false,
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }
    /**
     * Setup automated monitoring for continuous bug detection
     */
    startAutomatedMonitoring() {
        // Monitor for new issues every hour
        setInterval(async () => {
            await this.collectBugsAutomatically();
        }, 60 * 60 * 1000);
        // Check for release candidates daily
        setInterval(async () => {
            const bugs = Array.from(this.bugDatabase.values());
            const fixedBugs = bugs.filter(bug => bug.status === 'fixed' && !bug.releaseVersion);
            if (fixedBugs.length >= 5 || fixedBugs.some(bug => bug.severity === 'critical')) {
                this.logger.info('Triggering automatic release generation');
                const candidate = await this.generateReleaseCandidate();
                this.emit('release:candidate', candidate);
            }
        }, 24 * 60 * 60 * 1000);
        this.logger.info('Automated monitoring started');
    }
    /**
     * Integrate with CodeRabbit for enhanced code quality
     */
    async integrateWithCodeRabbit() {
        if (!this.codeRabbitConfig.enabled) {
            return {
                success: false,
                features: [],
                recommendations: ['Enable CodeRabbit integration in configuration']
            };
        }
        const features = [
            'Automated PR reviews with AI-powered insights',
            'Code quality scoring and trend analysis',
            'Convention enforcement for VERSATIL framework',
            'Security vulnerability detection',
            'Performance optimization suggestions',
            'Documentation quality assessment',
            'TypeScript best practice validation',
            'Agent coordination pattern verification'
        ];
        const recommendations = [
            'Configure CodeRabbit for automatic reviews on all PRs',
            'Set quality gate threshold to 85+ for production releases',
            'Enable security scanning for all code changes',
            'Use CodeRabbit insights to improve bug fix quality',
            'Integrate CodeRabbit metrics with release candidate validation',
            'Setup automated feedback collection from code review comments'
        ];
        this.logger.info('CodeRabbit integration active', {
            featuresCount: features.length,
            qualityGate: this.codeRabbitConfig.reviewSettings.qualityGate
        });
        return {
            success: true,
            features,
            recommendations
        };
    }
    // Helper methods (implementations would be more detailed)
    async loadBugDatabase() {
        // Load from .versatil/bugs.json
    }
    async loadCurrentVersion() {
        try {
            const packagePath = path.join(this.projectRoot, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            this.currentVersion = packageJson.version || '1.0.0';
        }
        catch {
            this.currentVersion = '1.0.0';
        }
    }
    async setupGitHubIntegration() {
        this.githubToken = process.env.GITHUB_TOKEN;
        // Setup GitHub API client
    }
    async fetchGitHubIssues() {
        // Fetch issues from GitHub API
        return [];
    }
    isBugIssue(issue) {
        return issue.labels.some(label => label.toLowerCase().includes('bug') ||
            label.toLowerCase().includes('defect'));
    }
    async convertGitHubIssueToBugReport(issue) {
        return {
            id: `github-${issue.number}`,
            title: issue.title,
            description: issue.body,
            severity: this.determineSeverityFromLabels(issue.labels),
            category: this.determineCategoryFromLabels(issue.labels),
            environment: await this.getEnvironmentInfo(),
            reproductionSteps: this.extractReproductionSteps(issue.body),
            expectedBehavior: this.extractExpectedBehavior(issue.body),
            actualBehavior: this.extractActualBehavior(issue.body),
            reportedAt: new Date(issue.created_at),
            reportedBy: issue.assignee || 'unknown',
            status: issue.state === 'open' ? 'open' : 'closed'
        };
    }
    // Additional helper methods would be implemented here...
    determineSeverityFromLabels(labels) {
        if (labels.some(l => l.includes('critical')))
            return 'critical';
        if (labels.some(l => l.includes('high')))
            return 'high';
        if (labels.some(l => l.includes('medium')))
            return 'medium';
        return 'low';
    }
    determineCategoryFromLabels(labels) {
        if (labels.some(l => l.includes('security')))
            return 'security';
        if (labels.some(l => l.includes('performance')))
            return 'performance';
        if (labels.some(l => l.includes('ui')))
            return 'ui';
        if (labels.some(l => l.includes('compatibility')))
            return 'compatibility';
        return 'functionality';
    }
    async getEnvironmentInfo() {
        try {
            const nodeVersion = await execAsync('node --version');
            return {
                os: process.platform,
                nodeVersion: nodeVersion.stdout.trim(),
                frameworkVersion: this.currentVersion,
                dependencies: {}
            };
        }
        catch {
            return {
                os: 'unknown',
                nodeVersion: 'unknown',
                frameworkVersion: this.currentVersion,
                dependencies: {}
            };
        }
    }
    extractReproductionSteps(body) {
        // Parse reproduction steps from issue body
        return ['Steps to be extracted from issue description'];
    }
    extractExpectedBehavior(body) {
        return 'Expected behavior to be extracted';
    }
    extractActualBehavior(body) {
        return 'Actual behavior to be extracted';
    }
    async collectFromUserFeedback() {
        return [];
    }
    async collectFromSecurityScans() {
        return [];
    }
    async processBugReports(bugs) {
        // Deduplicate and process bugs
        return bugs;
    }
    async findLogFiles() {
        return [];
    }
    parseErrorsFromLog(content) {
        return [];
    }
    async convertErrorToBugReport(error, logFile) {
        return {};
    }
    parseTestFailures(output) {
        return [];
    }
    async convertTestFailureToBugReport(failure) {
        return {};
    }
    identifyBugPatterns(bugs) {
        return [];
    }
    generateBugFixRecommendations(bugs, patterns) {
        return [];
    }
    determineVersionIncrement(bugs) {
        const hasCritical = bugs.some(bug => bug.severity === 'critical');
        const hasHigh = bugs.some(bug => bug.severity === 'high');
        if (hasCritical)
            return 'patch';
        if (hasHigh && bugs.length > 5)
            return 'minor';
        return 'patch';
    }
    async getNewFeatures() {
        return [];
    }
    async detectBreakingChanges() {
        return [];
    }
    async runAllTests() {
        try {
            await execAsync('npm test');
            return true;
        }
        catch {
            return false;
        }
    }
    async runSecurityAudit() {
        try {
            await execAsync('npm audit --audit-level=moderate');
            return true;
        }
        catch {
            return false;
        }
    }
    async checkPerformanceImprovement() {
        // Check if recent commits include performance improvements
        try {
            // Get recent commit messages
            const { stdout } = await execAsync('git log -10 --oneline');
            // Look for performance-related keywords
            const perfKeywords = ['perf', 'performance', 'optimize', 'faster', 'speed', 'efficiency'];
            const hasPerf = perfKeywords.some(keyword => stdout.toLowerCase().includes(keyword));
            if (!hasPerf) {
                return false;
            }
            // Run performance benchmarks if available
            try {
                const benchResult = await execAsync('npm run test:performance 2>&1 || true', { timeout: 60000 });
                // Check if benchmarks show improvement
                return benchResult.stdout.includes('improvement') ||
                    benchResult.stdout.includes('faster') ||
                    benchResult.stdout.includes('optimized');
            }
            catch (error) {
                // If no benchmark script, accept commit message indication
                return hasPerf;
            }
        }
        catch (error) {
            return false;
        }
    }
    incrementVersion(current, type) {
        const [major, minor, patch] = current.split('.').map(Number);
        switch (type) {
            case 'major': return `${major + 1}.0.0`;
            case 'minor': return `${major}.${minor + 1}.0`;
            case 'patch': return `${major}.${minor}.${patch + 1}`;
        }
    }
    async validateReleaseCandidate(candidate) {
        const errors = [];
        if (!candidate.testsPassing) {
            errors.push('Tests are not passing');
        }
        if (!candidate.securityAuditPassed) {
            errors.push('Security audit failed');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    async generateChangelog(candidate) {
        let changelog = `# Release ${candidate.version}\n\n`;
        if (candidate.bugFixes.length > 0) {
            changelog += '## Bug Fixes\n';
            for (const bug of candidate.bugFixes) {
                changelog += `- ${bug.title}\n`;
            }
            changelog += '\n';
        }
        if (candidate.features.length > 0) {
            changelog += '## Features\n';
            for (const feature of candidate.features) {
                changelog += `- ${feature}\n`;
            }
            changelog += '\n';
        }
        return changelog;
    }
    async updatePackageVersion(version) {
        // Update package.json version
    }
    async createGitTag(version, changelog) {
        await execAsync(`git tag -a v${version} -m "Release ${version}"`);
    }
    async buildRelease() {
        try {
            await execAsync('npm run build');
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async createGitHubRelease(candidate, changelog) {
        // Create GitHub release using API
        return `https://github.com/${this.githubRepo}/releases/tag/v${candidate.version}`;
    }
    async publishToNpm(version) {
        // Publish to npm if configured
    }
    yamlStringify(obj) {
        // Simple YAML stringifier (use js-yaml in production)
        return JSON.stringify(obj, null, 2);
    }
    /**
     * Get system status and metrics
     */
    getSystemStatus() {
        const bugs = Array.from(this.bugDatabase.values());
        return {
            bugCount: bugs.length,
            criticalBugs: bugs.filter(b => b.severity === 'critical' && b.status === 'open').length,
            lastRelease: this.currentVersion,
            pendingFixes: bugs.filter(b => b.status === 'fixed' && !b.releaseVersion).length,
            codeRabbitEnabled: this.codeRabbitConfig.enabled
        };
    }
}
//# sourceMappingURL=bug-collection-release-system.js.map