/**
 * VERSATIL MCP Profile Detector
 * Auto-detects optimal profile based on agent, files, and task context
 */
import { ProfileManager, ProfileRecommendation } from './profile-manager.js';
import { VERSATILLogger } from '../../utils/logger.js';
export interface DetectionContext {
    agent?: string;
    recentFiles?: string[];
    task?: string;
    userPreference?: string;
}
/**
 * Detect optimal profile for given context
 */
export declare function detectProfile(context: DetectionContext, profileManager: ProfileManager, logger?: VERSATILLogger): Promise<ProfileRecommendation>;
/**
 * Decision tree for profile selection (rule-based)
 */
export declare function detectProfileRuleBased(context: DetectionContext): string;
/**
 * Suggest profile upgrade based on current work
 */
export declare function suggestProfileUpgrade(currentProfile: string, recentToolCalls: string[]): {
    shouldUpgrade: boolean;
    suggestedProfile: string;
    reason: string;
} | null;
