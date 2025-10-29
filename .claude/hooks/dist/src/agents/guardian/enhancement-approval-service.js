"use strict";
/**
 * VERSATIL SDLC Framework - Enhancement Approval Service
 *
 * Human-in-the-loop approval workflow for Guardian enhancements.
 *
 * Three-tier approval system:
 * - TIER 1: Auto-apply (≥95% confidence) - Execute immediately, notify user
 * - TIER 2: Prompt for approval (80-95% confidence) - Interactive prompt
 * - TIER 3: Manual review required (<80% confidence) - Create TODO only
 *
 * @version 7.12.0
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
exports.EnhancementApprovalService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const readline = __importStar(require("readline"));
const guardian_logger_js_1 = require("./guardian-logger.js");
/**
 * Enhancement Approval Service
 */
class EnhancementApprovalService {
    constructor() {
        this.logger = guardian_logger_js_1.GuardianLogger.getInstance();
        this.approvalsDir = path.join(os.homedir(), '.versatil', 'approvals');
        this.decisionsFile = path.join(this.approvalsDir, 'decisions.jsonl');
        // Ensure approvals directory exists
        if (!fs.existsSync(this.approvalsDir)) {
            fs.mkdirSync(this.approvalsDir, { recursive: true });
        }
    }
    /**
     * Prompt user for approval (Tier 2 enhancements)
     */
    async promptForApproval(suggestion, options) {
        const timeoutSeconds = options?.timeout_seconds || parseInt(process.env.GUARDIAN_APPROVAL_TIMEOUT_SECONDS || '300', 10);
        this.logger.info(`🔔 [Approval Service] Prompting for approval: ${suggestion.title}`);
        // Display enhancement summary
        console.log('\n' + '='.repeat(80));
        console.log('🚀 Guardian Enhancement Detected');
        console.log('='.repeat(80));
        console.log(`\n📋 ${suggestion.title}`);
        console.log(`\n📊 **Impact**:`);
        console.log(`   • Pattern: ${suggestion.issue_description}`);
        console.log(`   • Occurrences: ${suggestion.issue_occurrences} times in ${suggestion.issue_timespan_hours}h`);
        console.log(`   • Priority: ${suggestion.priority.toUpperCase()}`);
        console.log(`   • Category: ${suggestion.category}`);
        console.log(`\n💰 **ROI**:`);
        console.log(`   • Implementation Time: ${suggestion.estimated_effort_hours}h`);
        console.log(`   • Time Saved per Week: ${suggestion.roi.hours_saved_per_week}h`);
        console.log(`   • ROI Ratio: ${suggestion.roi.roi_ratio}:1`);
        console.log(`   • Break-even: ${Math.round((suggestion.estimated_effort_hours / suggestion.roi.hours_saved_per_week) * 10) / 10} weeks`);
        console.log(`   • Annual Savings: ${Math.round(suggestion.roi.hours_saved_per_week * 52)}h/year`);
        console.log(`\n🎯 **Confidence**:`);
        console.log(`   • Verification: ${suggestion.evidence.verification_confidence}%`);
        console.log(`   • Expected Success Rate: ${suggestion.evidence.success_rate_if_implemented}%`);
        console.log(`\n🔧 **Assigned Agent**: ${suggestion.assigned_agent}`);
        console.log(`\n⏱️  **Timeout**: ${timeoutSeconds}s (auto-defer if no response)\n`);
        // Get approval decision
        const decision = await this.getApprovalDecision(suggestion, timeoutSeconds);
        // Store decision
        const result = {
            enhancement_id: suggestion.id,
            decision,
            reason: decision === 'rejected' ? await this.getRejectReason() : undefined,
            timestamp: new Date().toISOString(),
            user: os.userInfo().username
        };
        this.storeDecision(result);
        return result;
    }
    /**
     * Get approval decision from user input
     */
    async getApprovalDecision(suggestion, timeoutSeconds) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const prompt = () => {
            console.log('Approve this enhancement?');
            console.log('  [Y]es  - Approve and implement now');
            console.log('  [N]o   - Reject (requires reason)');
            console.log('  [D]efer - Review later (creates TODO)');
            console.log('  [I]nfo  - Show full details');
            rl.prompt();
        };
        return new Promise((resolve) => {
            let timeoutHandle = null;
            // Set timeout for auto-defer
            if (timeoutSeconds > 0) {
                timeoutHandle = setTimeout(() => {
                    console.log(`\n⏱️  Timeout (${timeoutSeconds}s) - Auto-deferring for manual review`);
                    rl.close();
                    resolve('deferred');
                }, timeoutSeconds * 1000);
            }
            rl.on('line', async (answer) => {
                const input = answer.trim().toLowerCase();
                if (input === 'y' || input === 'yes') {
                    if (timeoutHandle)
                        clearTimeout(timeoutHandle);
                    rl.close();
                    console.log('✅ Approved - Implementing now...\n');
                    resolve('approved');
                }
                else if (input === 'n' || input === 'no') {
                    if (timeoutHandle)
                        clearTimeout(timeoutHandle);
                    rl.close();
                    console.log('❌ Rejected\n');
                    resolve('rejected');
                }
                else if (input === 'd' || input === 'defer') {
                    if (timeoutHandle)
                        clearTimeout(timeoutHandle);
                    rl.close();
                    console.log('⏸️  Deferred - Creating TODO for manual review\n');
                    resolve('deferred');
                }
                else if (input === 'i' || input === 'info') {
                    // Show full details
                    this.showFullDetails(suggestion);
                    prompt(); // Re-prompt after showing details
                }
                else {
                    console.log('❓ Invalid input. Please enter Y, N, D, or I.');
                    prompt();
                }
            });
            rl.on('close', () => {
                if (timeoutHandle)
                    clearTimeout(timeoutHandle);
            });
            prompt();
        });
    }
    /**
     * Show full enhancement details
     */
    showFullDetails(suggestion) {
        console.log('\n' + '='.repeat(80));
        console.log('📖 Full Enhancement Details');
        console.log('='.repeat(80));
        console.log(`\n**Goal**: ${suggestion.description}`);
        console.log(`\n**Implementation Steps** (${suggestion.implementation_steps.length} steps):`);
        suggestion.implementation_steps.forEach((step, index) => {
            console.log(`   ${index + 1}. ${step}`);
        });
        if (suggestion.evidence.similar_historical_fixes.length > 0) {
            console.log(`\n**Similar Historical Fixes**:`);
            suggestion.evidence.similar_historical_fixes.forEach((fix) => {
                console.log(`   • ${fix}`);
            });
        }
        console.log(`\n**Root Cause Pattern**: ${suggestion.root_cause_pattern_id}`);
        console.log(`**Approval Tier**: ${suggestion.approval_tier}`);
        console.log(`**Approval Reason**: ${suggestion.approval_required_reason}`);
        console.log('\n' + '='.repeat(80) + '\n');
    }
    /**
     * Get rejection reason from user
     */
    async getRejectReason() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            rl.question('Rejection reason (optional, press Enter to skip): ', (reason) => {
                rl.close();
                resolve(reason.trim() || 'No reason provided');
            });
        });
    }
    /**
     * Store approval decision
     */
    storeDecision(result) {
        try {
            const line = JSON.stringify(result) + '\n';
            fs.appendFileSync(this.decisionsFile, line);
            this.logger.info(`📝 [Approval Service] Decision stored`, {
                enhancement_id: result.enhancement_id,
                decision: result.decision,
                user: result.user
            });
        }
        catch (error) {
            this.logger.error('Failed to store approval decision', { error });
        }
    }
    /**
     * Get approval decision for enhancement (check history)
     */
    getDecision(enhancementId) {
        if (!fs.existsSync(this.decisionsFile)) {
            return null;
        }
        try {
            const content = fs.readFileSync(this.decisionsFile, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);
            // Find most recent decision for this enhancement
            for (let i = lines.length - 1; i >= 0; i--) {
                const decision = JSON.parse(lines[i]);
                if (decision.enhancement_id === enhancementId) {
                    return decision;
                }
            }
            return null;
        }
        catch (error) {
            this.logger.error('Failed to read approval decisions', { error });
            return null;
        }
    }
    /**
     * Get all pending approvals (deferred decisions)
     */
    getPendingApprovals() {
        if (!fs.existsSync(this.decisionsFile)) {
            return [];
        }
        try {
            const content = fs.readFileSync(this.decisionsFile, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);
            // Group by enhancement_id, keep only most recent
            const decisionsMap = new Map();
            for (const line of lines) {
                const decision = JSON.parse(line);
                decisionsMap.set(decision.enhancement_id, decision);
            }
            // Return only deferred decisions
            return Array.from(decisionsMap.values()).filter(d => d.decision === 'deferred');
        }
        catch (error) {
            this.logger.error('Failed to read pending approvals', { error });
            return [];
        }
    }
    /**
     * Get approval mode from environment
     */
    getApprovalMode() {
        const mode = process.env.GUARDIAN_APPROVAL_MODE || 'interactive';
        if (mode === 'auto' || mode === 'manual') {
            return mode;
        }
        return 'interactive';
    }
    /**
     * Check if enhancement should be auto-applied based on mode
     */
    shouldAutoApply(suggestion) {
        const mode = this.getApprovalMode();
        if (mode === 'auto') {
            // Auto mode: Apply Tier 1 and Tier 2
            return suggestion.approval_tier === 1 || suggestion.approval_tier === 2;
        }
        if (mode === 'manual') {
            // Manual mode: Never auto-apply (all go to TODO)
            return false;
        }
        // Interactive mode (default): Only Tier 1
        return suggestion.approval_tier === 1;
    }
    /**
     * Execute approved enhancement
     */
    async executeEnhancement(suggestion) {
        this.logger.info(`🚀 [Approval Service] Executing enhancement: ${suggestion.title}`);
        try {
            // Check if auto-remediation engine can handle this
            const { AutoRemediationEngine } = await Promise.resolve().then(() => __importStar(require('./auto-remediation-engine.js')));
            const engine = AutoRemediationEngine.getInstance();
            // Convert enhancement to remediation issue
            const issue = {
                id: suggestion.id,
                component: suggestion.category,
                severity: suggestion.priority,
                description: suggestion.issue_description,
                context: 'SHARED',
                error_message: suggestion.description,
                affected_files: []
            };
            // Try auto-remediation
            const result = await engine.attemptRemediation(issue, process.cwd());
            if (result.success) {
                this.logger.info(`✅ [Approval Service] Enhancement executed successfully`, {
                    enhancement_id: suggestion.id,
                    action_taken: result.action_taken,
                    duration_ms: result.duration_ms
                });
                return {
                    success: true,
                    message: `Enhancement applied successfully: ${result.action_taken}`
                };
            }
            else {
                this.logger.warn(`⚠️  [Approval Service] Enhancement execution failed`, {
                    enhancement_id: suggestion.id,
                    message: result.after_state
                });
                return {
                    success: false,
                    message: `Enhancement execution failed: ${result.after_state}. Creating TODO for manual implementation.`
                };
            }
        }
        catch (error) {
            this.logger.error('Enhancement execution failed', { error });
            return {
                success: false,
                message: `Enhancement execution error: ${error.message}. Creating TODO for manual implementation.`
            };
        }
    }
}
exports.EnhancementApprovalService = EnhancementApprovalService;
