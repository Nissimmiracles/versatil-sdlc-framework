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
import type { EnhancementSuggestion } from './enhancement-detector.js';
export type ApprovalDecision = 'approved' | 'rejected' | 'deferred';
export interface ApprovalResult {
    enhancement_id: string;
    decision: ApprovalDecision;
    reason?: string;
    timestamp: string;
    user: string;
}
export interface ApprovalPromptOptions {
    timeout_seconds?: number;
    show_details?: boolean;
}
/**
 * Enhancement Approval Service
 */
export declare class EnhancementApprovalService {
    private logger;
    private approvalsDir;
    private decisionsFile;
    constructor();
    /**
     * Prompt user for approval (Tier 2 enhancements)
     */
    promptForApproval(suggestion: EnhancementSuggestion, options?: ApprovalPromptOptions): Promise<ApprovalResult>;
    /**
     * Get approval decision from user input
     */
    private getApprovalDecision;
    /**
     * Show full enhancement details
     */
    private showFullDetails;
    /**
     * Get rejection reason from user
     */
    private getRejectReason;
    /**
     * Store approval decision
     */
    private storeDecision;
    /**
     * Get approval decision for enhancement (check history)
     */
    getDecision(enhancementId: string): ApprovalResult | null;
    /**
     * Get all pending approvals (deferred decisions)
     */
    getPendingApprovals(): ApprovalResult[];
    /**
     * Get approval mode from environment
     */
    getApprovalMode(): 'interactive' | 'auto' | 'manual';
    /**
     * Check if enhancement should be auto-applied based on mode
     */
    shouldAutoApply(suggestion: EnhancementSuggestion): boolean;
    /**
     * Execute approved enhancement
     */
    executeEnhancement(suggestion: EnhancementSuggestion): Promise<{
        success: boolean;
        message: string;
    }>;
}
