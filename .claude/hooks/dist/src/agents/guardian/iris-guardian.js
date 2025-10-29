"use strict";
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
 * @version 7.11.0
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
exports.IrisGuardian = void 0;
exports.getGuardian = getGuardian;
exports.initializeGuardian = initializeGuardian;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const logger_js_1 = require("../../utils/logger.js");
/**
 * Guardian core orchestrator
 */
class IrisGuardian {
    constructor() {
        this.healthHistory = [];
        this.logger = new logger_js_1.VERSATILLogger('Iris-Guardian');
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
            const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
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
                    const { detectAndVerifyIssues, createVerifiedTodos } = await Promise.resolve().then(() => __importStar(require('./verified-issue-detector.js')));
                    const { detectContextIdentity } = await Promise.resolve().then(() => __importStar(require('../../isolation/context-identity.js')));
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
                            const { contextPriorityResolver } = await Promise.resolve().then(() => __importStar(require('../../context/context-priority-resolver.js')));
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
            // NEW: Root Cause Learning & Enhancement Detection (v7.11.0+)
            // Analyze health check history for recurring patterns and suggest enhancements
            if (process.env.GUARDIAN_LEARN_FROM_ISSUES !== 'false' && this.healthHistory.length >= 3) {
                try {
                    this.logger.info('🧠 Starting root cause learning analysis...');
                    const { RootCauseLearner } = await Promise.resolve().then(() => __importStar(require('./root-cause-learner.js')));
                    const { EnhancementDetector } = await Promise.resolve().then(() => __importStar(require('./enhancement-detector.js')));
                    const { EnhancementTodoGenerator } = await Promise.resolve().then(() => __importStar(require('./enhancement-todo-generator.js')));
                    // Step 1: Learn from recurring patterns
                    const rootCauseLearner = new RootCauseLearner();
                    const learningResult = await rootCauseLearner.analyzeHealthCheckHistory(this.healthHistory, this.contextDetection.paths.current_working_directory);
                    this.logger.info(`✅ Root cause learning complete: ${learningResult.patterns_detected.length} patterns detected`, {
                        new_patterns: learningResult.new_patterns,
                        updated_patterns: learningResult.updated_patterns,
                        enhancement_candidates: learningResult.enhancement_candidates,
                        confidence_avg: learningResult.confidence_avg
                    });
                    // Step 2: Detect enhancement opportunities
                    if (learningResult.enhancement_candidates > 0 &&
                        process.env.GUARDIAN_CREATE_ENHANCEMENT_TODOS !== 'false') {
                        const enhancementDetector = new EnhancementDetector();
                        const enhancementResult = await enhancementDetector.detectEnhancements(learningResult.patterns_detected);
                        this.logger.info(`💡 Enhancement detection complete: ${enhancementResult.enhancements_suggested.length} suggestions`, {
                            high_priority: enhancementResult.high_priority_count,
                            total_roi_hours_per_week: enhancementResult.total_roi_hours_per_week,
                            avg_confidence: enhancementResult.avg_confidence
                        });
                        // Step 3: Handle enhancements based on approval tier (v7.12.0+)
                        if (enhancementResult.enhancements_suggested.length > 0) {
                            const { EnhancementApprovalService } = await Promise.resolve().then(() => __importStar(require('./enhancement-approval-service.js')));
                            const approvalService = new EnhancementApprovalService();
                            const approvalMode = approvalService.getApprovalMode();
                            this.logger.info(`🔐 [Guardian] Approval mode: ${approvalMode}`);
                            // Separate enhancements by tier
                            const tier1 = enhancementResult.enhancements_suggested.filter(s => s.approval_tier === 1);
                            const tier2 = enhancementResult.enhancements_suggested.filter(s => s.approval_tier === 2);
                            const tier3 = enhancementResult.enhancements_suggested.filter(s => s.approval_tier === 3);
                            this.logger.info(`📊 Enhancement tiers: Tier 1 (${tier1.length}), Tier 2 (${tier2.length}), Tier 3 (${tier3.length})`);
                            // TIER 1: Auto-apply
                            for (const suggestion of tier1) {
                                this.logger.info(`🚀 [Guardian] Auto-applying Tier 1 enhancement: ${suggestion.title}`);
                                const result = await approvalService.executeEnhancement(suggestion);
                                if (result.success) {
                                    console.log(`\n✅ Guardian Auto-Applied: ${suggestion.title}`);
                                    console.log(`   ${result.message}`);
                                    console.log(`   ROI: ${suggestion.roi.hours_saved_per_week}h/week saved\n`);
                                }
                                else {
                                    console.log(`\n⚠️  Guardian Auto-Apply Failed: ${suggestion.title}`);
                                    console.log(`   ${result.message}\n`);
                                    // Fallback: Create TODO
                                    tier3.push(suggestion);
                                }
                            }
                            // TIER 2: Prompt for approval (interactive mode only)
                            const tier2Approved = [];
                            const tier2Deferred = [];
                            if (approvalMode === 'interactive' && tier2.length > 0) {
                                for (const suggestion of tier2) {
                                    const approvalResult = await approvalService.promptForApproval(suggestion);
                                    if (approvalResult.decision === 'approved') {
                                        tier2Approved.push(suggestion);
                                        const result = await approvalService.executeEnhancement(suggestion);
                                        if (!result.success) {
                                            // Execution failed, create TODO
                                            tier2Deferred.push(suggestion);
                                        }
                                    }
                                    else if (approvalResult.decision === 'rejected') {
                                        console.log(`❌ Enhancement rejected: ${suggestion.title}`);
                                        if (approvalResult.reason) {
                                            console.log(`   Reason: ${approvalResult.reason}`);
                                        }
                                    }
                                    else {
                                        // Deferred
                                        tier2Deferred.push(suggestion);
                                    }
                                }
                            }
                            else if (approvalMode === 'auto') {
                                // Auto mode: Treat Tier 2 as Tier 1
                                for (const suggestion of tier2) {
                                    const result = await approvalService.executeEnhancement(suggestion);
                                    if (!result.success) {
                                        tier2Deferred.push(suggestion);
                                    }
                                }
                            }
                            else {
                                // Manual mode: All Tier 2 become TODOs
                                tier2Deferred.push(...tier2);
                            }
                            // TIER 3 + Deferred: Create TODO files
                            const todosToCreate = [...tier3, ...tier2Deferred];
                            if (todosToCreate.length > 0) {
                                const todosDir = path.join(this.contextDetection.paths.current_working_directory, 'todos');
                                const todoGenerator = new EnhancementTodoGenerator(todosDir);
                                const todoResult = await todoGenerator.generateTodos(todosToCreate);
                                this.logger.info(`📝 Enhancement TODOs generated: ${todoResult.todos_created} created, ${todoResult.todos_skipped} skipped`);
                                if (todoResult.todos_created > 0) {
                                    console.log(`\n📝 Created ${todoResult.todos_created} enhancement TODO(s) for manual review`);
                                    console.log(`   Location: todos/enhancement-*.md`);
                                    console.log(`   Use /work <todo-file> to implement\n`);
                                }
                            }
                        }
                    }
                }
                catch (learningError) {
                    this.logger.error('Root cause learning failed', {
                        error: learningError.message
                    });
                    // Continue without failing health check
                }
            }
            const duration = Date.now() - startTime;
            this.logger.info(`Health check completed (${duration}ms)`, {
                overall_health: result.overall_health,
                status: result.status,
                issues: result.issues.length,
            });
            // NEW: User Interaction Learning (v7.13.0+)
            // Generate proactive answers for anticipated user questions
            if (process.env.GUARDIAN_LEARN_USER_PATTERNS !== 'false') {
                try {
                    const { ProactiveAnswerGenerator } = await Promise.resolve().then(() => __importStar(require('../../intelligence/proactive-answer-generator.js')));
                    const generator = new ProactiveAnswerGenerator();
                    // Detect recent code changes for context
                    const gitChanges = await this.detectRecentGitChanges();
                    const context = {
                        feature_name: 'Guardian Health Check',
                        files_created: gitChanges.created,
                        files_modified: gitChanges.modified,
                        total_lines: gitChanges.total_lines,
                        documentation_files: gitChanges.documentation,
                        git_status: {
                            uncommitted: gitChanges.uncommitted,
                            files_count: gitChanges.files_count,
                            branch: gitChanges.branch,
                            commits_ahead: gitChanges.commits_ahead
                        }
                    };
                    const proactiveAnswer = await generator.generateForFeatureCompletion(context);
                    if (proactiveAnswer?.should_show_proactively) {
                        const formattedAnswer = generator.formatProactiveAnswer(proactiveAnswer, context);
                        console.log('\n' + formattedAnswer + '\n');
                        this.logger.info('📊 Proactive answer generated based on learned patterns', {
                            anticipated_questions: proactiveAnswer.anticipated_questions.length,
                            confidence: proactiveAnswer.confidence
                        });
                    }
                }
                catch (learningError) {
                    this.logger.debug('Proactive answer generation skipped', {
                        error: learningError.message
                    });
                    // Continue without failing health check
                }
            }
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
            const { FrameworkGuardian } = await Promise.resolve().then(() => __importStar(require('./framework-guardian.js')));
            return new FrameworkGuardian(this.contextDetection.paths.current_working_directory);
        }
        else {
            const { ProjectGuardian } = await Promise.resolve().then(() => __importStar(require('./project-guardian.js')));
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
     * Detect recent git changes for context (v7.13.0+)
     */
    async detectRecentGitChanges() {
        try {
            const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
            const cwd = this.contextDetection.paths.current_working_directory;
            // Get current branch
            const branch = execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
            // Get uncommitted files
            const statusOutput = execSync('git status --porcelain', { cwd, encoding: 'utf-8' });
            const statusLines = statusOutput.trim().split('\n').filter(Boolean);
            const created = [];
            const modified = [];
            const documentation = [];
            for (const line of statusLines) {
                const status = line.substring(0, 2).trim();
                const filepath = line.substring(3);
                if (status === 'A' || status === '??') {
                    created.push(filepath);
                }
                else if (status === 'M') {
                    modified.push(filepath);
                }
                if (filepath.endsWith('.md') || filepath.includes('docs/')) {
                    documentation.push(filepath);
                }
            }
            // Count total lines added (approximate)
            let total_lines = 0;
            try {
                const diffOutput = execSync('git diff --stat', { cwd, encoding: 'utf-8' });
                const match = diffOutput.match(/(\d+) insertions?/);
                if (match) {
                    total_lines = parseInt(match[1], 10);
                }
            }
            catch {
                // If diff fails, estimate from file count
                total_lines = (created.length + modified.length) * 50;
            }
            // Check commits ahead of origin
            let commits_ahead = 0;
            try {
                const aheadOutput = execSync(`git rev-list --count origin/${branch}..HEAD`, { cwd, encoding: 'utf-8' });
                commits_ahead = parseInt(aheadOutput.trim(), 10);
            }
            catch {
                // Branch might not have upstream
                commits_ahead = 0;
            }
            return {
                created,
                modified,
                total_lines,
                documentation,
                uncommitted: statusLines.length > 0,
                files_count: statusLines.length,
                branch,
                commits_ahead
            };
        }
        catch (error) {
            this.logger.debug('Git change detection failed', { error: error.message });
            return {
                created: [],
                modified: [],
                total_lines: 0,
                documentation: [],
                uncommitted: false,
                files_count: 0,
                branch: 'main',
                commits_ahead: 0
            };
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
            const { AutoRemediationEngine } = await Promise.resolve().then(() => __importStar(require('./auto-remediation-engine.js')));
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
exports.IrisGuardian = IrisGuardian;
/**
 * Singleton instance
 */
let guardianInstance = null;
/**
 * Get Guardian instance (singleton)
 */
function getGuardian() {
    if (!guardianInstance) {
        guardianInstance = new IrisGuardian();
    }
    return guardianInstance;
}
/**
 * Initialize and start Guardian monitoring
 */
async function initializeGuardian(intervalMinutes = 5) {
    const guardian = getGuardian();
    await guardian.startMonitoring(intervalMinutes);
    return guardian;
}
