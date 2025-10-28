/**
 * Iris-Guardian - Meta-Framework Intelligence & System Guardian
 *
 * Dual-Context Operation:
 * - FRAMEWORK_CONTEXT: Framework development (version management, roadmap, releases)
 * - PROJECT_CONTEXT: User projects (framework assistance, configuration, agent monitoring)
 *
 * Core Capabilities:
 * - RAG/GraphRAG health monitoring and ownership
 * - Auto-remediation with confidence-based decision making
 * - Agent coordination and intelligence
 * - Context-aware proactive monitoring
 * - Version management and evolution tracking (framework context only)
 *
 * @version 7.8.0
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { VERSATILLogger } from '../../utils/logger.js';
/**
 * Guardian core orchestrator
 */
export class IrisGuardian {
    constructor() {
        this.healthHistory = [];
        this.logger = new VERSATILLogger('Iris-Guardian');
        this.contextDetection = this.detectContext();
        this.context = this.contextDetection.context;
        this.logger.info(`Guardian initialized in ${this.context}`, {
            context: this.context,
            confidence: this.contextDetection.confidence,
            evidence: this.contextDetection.evidence,
        });
    }
    /**
     * Detect execution context (FRAMEWORK vs PROJECT)
     */
    detectContext() {
        const cwd = process.cwd();
        const evidence = [];
        let context = 'PROJECT_CONTEXT'; // Default
        let confidence = 50;
        // Check 1: Framework repository marker file
        const frameworkMarkerPath = path.join(cwd, '.versatil-framework-repo');
        if (fs.existsSync(frameworkMarkerPath)) {
            evidence.push('.versatil-framework-repo file exists');
            context = 'FRAMEWORK_CONTEXT';
            confidence += 30;
        }
        // Check 2: Path contains "VERSATIL SDLC FW"
        if (cwd.includes('VERSATIL SDLC FW')) {
            evidence.push('Path contains "VERSATIL SDLC FW"');
            context = 'FRAMEWORK_CONTEXT';
            confidence += 20;
        }
        // Check 3: Project marker file
        const projectMarkerPath = path.join(cwd, '.versatil-project.json');
        if (fs.existsSync(projectMarkerPath)) {
            evidence.push('.versatil-project.json file exists');
            if (context !== 'FRAMEWORK_CONTEXT') {
                context = 'PROJECT_CONTEXT';
                confidence += 30;
            }
        }
        // Check 4: Framework home exists
        const frameworkHome = path.join(os.homedir(), '.versatil');
        if (fs.existsSync(frameworkHome)) {
            evidence.push('Framework home exists at ~/.versatil/');
            if (context !== 'FRAMEWORK_CONTEXT') {
                context = 'PROJECT_CONTEXT';
                confidence += 20;
            }
        }
        // Check 5: Framework src/ directory structure
        const hasSrcAgents = fs.existsSync(path.join(cwd, 'src', 'agents'));
        const hasClaudeAgents = fs.existsSync(path.join(cwd, '.claude', 'agents'));
        if (hasSrcAgents && hasClaudeAgents) {
            evidence.push('Framework src/ and .claude/ directories exist');
            context = 'FRAMEWORK_CONTEXT';
            confidence += 20;
        }
        // Ensure confidence doesn't exceed 100
        confidence = Math.min(100, confidence);
        return {
            context,
            confidence,
            evidence,
            paths: {
                current_working_directory: cwd,
                framework_home: fs.existsSync(frameworkHome) ? frameworkHome : undefined,
                project_root: context === 'PROJECT_CONTEXT' ? cwd : undefined,
            },
        };
    }
    /**
     * Get current context
     */
    getContext() {
        return this.context;
    }
    /**
     * Get context detection details
     */
    getContextDetection() {
        return this.contextDetection;
    }
    /**
     * Resolve user/team/project IDs from git config and project metadata
     * Enables 100% context alignment with user expectations
     */
    async resolveContextIds() {
        const workingDir = this.contextDetection.paths.current_working_directory;
        // Extract user ID from git config
        const userId = await this.getUserIdFromGit(workingDir);
        // Extract team/project IDs from project metadata
        const projectMetadata = await this.loadProjectMetadata(workingDir);
        return {
            userId: userId || undefined,
            teamId: projectMetadata?.teamId || undefined,
            projectId: projectMetadata?.projectId || undefined
        };
    }
    /**
     * Extract user ID from git config
     */
    async getUserIdFromGit(workingDir) {
        try {
            // Try to get user email from git config
            const { execSync } = await import('child_process');
            const gitEmail = execSync('git config user.email', {
                cwd: workingDir,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            if (gitEmail) {
                // Convert email to user ID (e.g., john@example.com → john-example-com)
                const userId = gitEmail.replace(/@/g, '-').replace(/\./g, '-');
                return userId;
            }
        }
        catch (error) {
            // Git config not available or no user.email set
        }
        // Fallback: Check environment variable
        const envUserId = process.env.VERSATIL_USER_ID;
        if (envUserId) {
            return envUserId;
        }
        return null;
    }
    /**
     * Load project metadata containing team/project IDs
     */
    async loadProjectMetadata(workingDir) {
        const metadataPath = path.join(workingDir, '.versatil-project.json');
        if (!fs.existsSync(metadataPath)) {
            return null;
        }
        try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            return {
                teamId: metadata.teamId || metadata.team_id || undefined,
                projectId: metadata.projectId || metadata.project_id || metadata.id || undefined
            };
        }
        catch (error) {
            this.logger.warn('Failed to parse project metadata', {
                error: error.message
            });
            return null;
        }
    }
    /**
     * Start background monitoring
     */
    async startMonitoring(intervalMinutes = 5) {
        this.logger.info(`Starting background monitoring (every ${intervalMinutes} minutes)`);
        // Initial health check
        await this.performHealthCheck();
        // Schedule recurring checks
        const intervalMs = intervalMinutes * 60 * 1000;
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            }
            catch (error) {
                this.logger.error('Health check failed', { error: error.message });
            }
        }, intervalMs);
        this.logger.info('Background monitoring started');
    }
    /**
     * Stop background monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
            this.logger.info('Background monitoring stopped');
        }
    }
    /**
     * Perform comprehensive health check
     */
    async performHealthCheck() {
        const startTime = Date.now();
        try {
            // Load context-specific guardian
            const guardian = await this.loadContextGuardian();
            // Perform health check
            const result = await guardian.performHealthCheck();
            // Store in history
            this.healthHistory.push(result);
            if (this.healthHistory.length > 100) {
                this.healthHistory.shift(); // Keep last 100 checks
            }
            // Check for alerts
            await this.checkAlertThresholds(result);
            // NEW: Three-layer verification pipeline (v7.7.0+)
            // Verify issues using Victor-Verifier's CoVe methodology
            if (result.issues.length > 0) {
                this.logger.info(`🔍 Starting three-layer verification for ${result.issues.length} issues...`);
                try {
                    const { detectAndVerifyIssues, createVerifiedTodos } = await import('./verified-issue-detector.js');
                    const { detectContextIdentity } = await import('../../isolation/context-identity.js');
                    // Get context identity for enforcement
                    const contextIdentity = await detectContextIdentity(this.contextDetection.paths.current_working_directory);
                    // Resolve user/team/project IDs (v7.8.0 - 100% context alignment)
                    const contextIds = await this.resolveContextIds();
                    if (contextIds.userId || contextIds.teamId || contextIds.projectId) {
                        this.logger.info(`📊 Context IDs resolved:`, {
                            userId: contextIds.userId || 'none',
                            teamId: contextIds.teamId || 'none',
                            projectId: contextIds.projectId || 'none'
                        });
                        // Load full context with priority resolution
                        try {
                            const { contextPriorityResolver } = await import('../../context/context-priority-resolver.js');
                            const resolvedContext = await contextPriorityResolver.resolveContext({
                                userId: contextIds.userId,
                                teamId: contextIds.teamId,
                                projectId: contextIds.projectId
                            });
                            this.logger.info(`✅ Context resolved with priority (User > Team > Project > Framework):`, {
                                userOverrides: resolvedContext.resolution.userOverrides.length,
                                teamOverrides: resolvedContext.resolution.teamOverrides.length,
                                projectOverrides: resolvedContext.resolution.projectOverrides.length,
                                conflicts: resolvedContext.resolution.conflicts.length
                            });
                            // Store resolved context for verification
                            result.resolvedContext = resolvedContext;
                        }
                        catch (contextError) {
                            this.logger.warn('Context priority resolution failed, proceeding without resolved context', {
                                error: contextError.message
                            });
                        }
                    }
                    else {
                        this.logger.warn('No context IDs found - context layer verification will be limited');
                    }
                    // Run verification pipeline with context IDs
                    const verificationResult = await detectAndVerifyIssues(result, this.contextDetection.paths.current_working_directory, contextIdentity, contextIds.userId, // ✅ Now provided
                    contextIds.teamId, // ✅ Now provided
                    contextIds.projectId // ✅ Now provided
                    );
                    this.logger.info(`✅ Verification complete: ${verificationResult.verified_issues.length}/${verificationResult.total_issues} verified ` +
                        `(${verificationResult.auto_apply_count} auto-apply, ${verificationResult.manual_review_count} manual)`);
                    // Create verified todos for all verified issues
                    if (verificationResult.verified_issues.length > 0) {
                        const todosDir = path.join(this.contextDetection.paths.current_working_directory, 'todos');
                        // Ensure todos directory exists
                        if (!fs.existsSync(todosDir)) {
                            fs.mkdirSync(todosDir, { recursive: true });
                        }
                        const createdTodos = await createVerifiedTodos(verificationResult.verified_issues, todosDir);
                        this.logger.info(`📝 Created ${createdTodos.length} verified todo(s)`);
                    }
                    // Only attempt auto-remediation on HIGH-CONFIDENCE auto-apply issues
                    const autoApplyIssues = verificationResult.verified_issues.filter(v => v.auto_apply);
                    if (autoApplyIssues.length > 0) {
                        this.logger.info(`🔧 Auto-remediating ${autoApplyIssues.length} high-confidence issue(s)...`);
                        for (const verifiedIssue of autoApplyIssues) {
                            // Ensure Issue has required fields
                            const issue = {
                                ...verifiedIssue.original_issue,
                                auto_fix_available: true,
                                recommendation: verifiedIssue.verification_details.recommended_fix || verifiedIssue.original_issue.recommendation || 'See verification details'
                            };
                            await this.attemptAutoRemediation([issue]);
                        }
                    }
                }
                catch (verificationError) {
                    this.logger.warn('Verification pipeline failed, falling back to traditional auto-remediation', {
                        error: verificationError.message
                    });
                    // Fallback: Traditional auto-remediation (no verification)
                    if (result.status === 'critical' || result.status === 'degraded') {
                        await this.attemptAutoRemediation(result.issues);
                    }
                }
            }
            const duration = Date.now() - startTime;
            this.logger.info(`Health check completed (${duration}ms)`, {
                overall_health: result.overall_health,
                status: result.status,
                issues: result.issues.length,
            });
            return result;
        }
        catch (error) {
            this.logger.error('Health check failed', { error: error.message });
            return {
                overall_health: 0,
                status: 'critical',
                components: {
                    framework: { score: 0, status: 'unknown', message: 'Health check failed' },
                    agents: { score: 0, status: 'unknown', message: 'Health check failed' },
                    rag: { score: 0, status: 'unknown', message: 'Health check failed' },
                    build: { score: 0, status: 'unknown', message: 'Health check failed' },
                    tests: { score: 0, status: 'unknown', message: 'Health check failed' },
                },
                issues: [
                    {
                        severity: 'critical',
                        component: 'guardian',
                        description: `Health check failed: ${error.message}`,
                        auto_fix_available: false,
                        recommendation: 'Investigate Guardian implementation',
                    },
                ],
                timestamp: new Date().toISOString(),
            };
        }
    }
    /**
     * Load context-specific guardian implementation
     */
    async loadContextGuardian() {
        if (this.context === 'FRAMEWORK_CONTEXT') {
            const { FrameworkGuardian } = await import('./framework-guardian.js');
            return new FrameworkGuardian(this.contextDetection.paths.current_working_directory);
        }
        else {
            const { ProjectGuardian } = await import('./project-guardian.js');
            return new ProjectGuardian(this.contextDetection.paths.current_working_directory);
        }
    }
    /**
     * Check alert thresholds
     */
    async checkAlertThresholds(result) {
        const CRITICAL_THRESHOLD = 70;
        const WARNING_THRESHOLD = 80;
        if (result.overall_health < CRITICAL_THRESHOLD) {
            this.logger.error('🚨 CRITICAL: Framework health below threshold', {
                health: result.overall_health,
                threshold: CRITICAL_THRESHOLD,
                issues: result.issues.length,
            });
            // TODO: Send Slack/email alert
        }
        else if (result.overall_health < WARNING_THRESHOLD) {
            this.logger.warn('⚠️ WARNING: Framework health degraded', {
                health: result.overall_health,
                threshold: WARNING_THRESHOLD,
                issues: result.issues.length,
            });
        }
    }
    /**
     * Attempt auto-remediation for detected issues
     */
    async attemptAutoRemediation(issues) {
        const autoFixableIssues = issues.filter(i => i.auto_fix_available && (i.confidence || 0) >= 90);
        if (autoFixableIssues.length === 0) {
            this.logger.info('No auto-fixable issues (confidence <90%)');
            return;
        }
        this.logger.info(`Attempting auto-remediation for ${autoFixableIssues.length} issues`);
        for (const issue of autoFixableIssues) {
            try {
                const remediation = await this.autoRemediateIssue(issue);
                if (remediation.success) {
                    this.logger.info(`✅ Auto-remediated: ${issue.description}`, {
                        action: remediation.action_taken,
                        confidence: remediation.confidence,
                        duration_ms: remediation.duration_ms,
                    });
                    // Store learning in RAG if enabled
                    if (remediation.learned) {
                        this.logger.info('Stored remediation pattern in RAG for future use');
                    }
                }
                else {
                    this.logger.warn(`❌ Auto-remediation failed: ${issue.description}`);
                }
            }
            catch (error) {
                this.logger.error(`Auto-remediation error: ${issue.description}`, {
                    error: error.message,
                });
            }
        }
    }
    /**
     * Auto-remediate specific issue
     */
    async autoRemediateIssue(issue) {
        const startTime = Date.now();
        try {
            // Load auto-remediation engine
            const { AutoRemediationEngine } = await import('./auto-remediation-engine.js');
            const engine = AutoRemediationEngine.getInstance();
            // Convert Issue to RemediationIssue
            const remediationIssue = {
                id: `${issue.component}-${Date.now()}`,
                component: issue.component,
                severity: issue.severity,
                description: issue.description,
                context: this.context,
                error_message: issue.root_cause
            };
            // Attempt fix
            const result = await engine.remediate(remediationIssue, this.contextDetection.paths.current_working_directory);
            return {
                success: result.success,
                action_taken: result.action_taken,
                confidence: result.confidence,
                before_state: result.before_state || `Issue: ${issue.description}`,
                after_state: result.after_state || (result.success ? 'Fixed' : 'Failed'),
                duration_ms: Date.now() - startTime,
                learned: typeof result.learned === 'string' ? result.learned.length > 0 : false,
            };
        }
        catch (error) {
            return {
                success: false,
                action_taken: 'none',
                confidence: 0,
                before_state: 'unknown',
                after_state: 'unknown',
                duration_ms: Date.now() - startTime,
                learned: false,
            };
        }
    }
    /**
     * Get health history
     */
    getHealthHistory(limit = 10) {
        return this.healthHistory.slice(-limit);
    }
    /**
     * Get current health status
     */
    async getCurrentHealth() {
        if (this.healthHistory.length > 0) {
            return this.healthHistory[this.healthHistory.length - 1];
        }
        // Perform initial check if no history
        return await this.performHealthCheck();
    }
}
/**
 * Singleton instance
 */
let guardianInstance = null;
/**
 * Get Guardian instance (singleton)
 */
export function getGuardian() {
    if (!guardianInstance) {
        guardianInstance = new IrisGuardian();
    }
    return guardianInstance;
}
/**
 * Initialize and start Guardian monitoring
 */
export async function initializeGuardian(intervalMinutes = 5) {
    const guardian = getGuardian();
    await guardian.startMonitoring(intervalMinutes);
    return guardian;
}
//# sourceMappingURL=iris-guardian.js.map