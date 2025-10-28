/**
 * IP-based Access Control for VERSATIL MCP Documentation Tools
 *
 * Provides IP whitelist/blacklist functionality:
 * - IP whitelist (allow-only mode)
 * - IP blacklist (block specific IPs)
 * - CIDR range support
 * - Multiple access control modes
 * - Integration with SecurityLogger
 *
 * Part of Phase 4.3: IP-based Access Control
 */
import { SecurityLogger } from './docs-security-logger.js';
/**
 * Access control modes
 */
export declare enum AccessControlMode {
    WHITELIST_ONLY = "whitelist_only",
    BLACKLIST_ONLY = "blacklist_only",
    MIXED = "mixed"
}
/**
 * IP rule type
 */
export declare enum IPRuleType {
    WHITELIST = "whitelist",
    BLACKLIST = "blacklist"
}
/**
 * IP rule interface
 */
export interface IPRule {
    ip: string;
    type: IPRuleType;
    reason?: string;
    addedAt: Date;
}
/**
 * Access check result
 */
export interface AccessCheckResult {
    allowed: boolean;
    reason: string;
    matchedRule?: IPRule;
}
/**
 * IP Access Control options
 */
export interface IPAccessControlOptions {
    mode?: AccessControlMode;
    rulesFile?: string;
    securityLogger?: SecurityLogger;
    autoSave?: boolean;
}
/**
 * IP Access Control
 */
export declare class IPAccessControl {
    private mode;
    private whitelist;
    private blacklist;
    private cidrRanges;
    private rules;
    private rulesFile;
    private securityLogger?;
    private autoSave;
    private isInitialized;
    constructor(options?: IPAccessControlOptions);
    /**
     * Initialize IP access control
     */
    initialize(): Promise<void>;
    /**
     * Check if an IP is allowed access
     */
    checkAccess(ip: string, user?: string): Promise<AccessCheckResult>;
    /**
     * Add IP to whitelist
     */
    addToWhitelist(ip: string, reason?: string): Promise<void>;
    /**
     * Add IP to blacklist
     */
    addToBlacklist(ip: string, reason?: string): Promise<void>;
    /**
     * Remove IP from whitelist
     */
    removeFromWhitelist(ip: string): Promise<boolean>;
    /**
     * Remove IP from blacklist
     */
    removeFromBlacklist(ip: string): Promise<boolean>;
    /**
     * Clear all rules
     */
    clearRules(): Promise<void>;
    /**
     * Get all rules
     */
    getRules(): IPRule[];
    /**
     * Get access control mode
     */
    getMode(): AccessControlMode;
    /**
     * Set access control mode
     */
    setMode(mode: AccessControlMode): Promise<void>;
    /**
     * Get statistics
     */
    getStatistics(): {
        mode: AccessControlMode;
        whitelistCount: number;
        blacklistCount: number;
        totalRules: number;
    };
    /**
     * Private: Ensure initialized
     */
    private ensureInitialized;
    /**
     * Private: Check whitelist-only mode
     */
    private checkWhitelistOnly;
    /**
     * Private: Check blacklist-only mode
     */
    private checkBlacklistOnly;
    /**
     * Private: Check mixed mode
     */
    private checkMixed;
    /**
     * Private: Check if IP is in whitelist
     */
    private isInWhitelist;
    /**
     * Private: Check if IP is in blacklist
     */
    private isInBlacklist;
    /**
     * Private: Check if IP is in CIDR range
     */
    private ipInCIDR;
    /**
     * Private: Convert IP to number
     */
    private ipToNumber;
    /**
     * Private: Check if string is CIDR notation
     */
    private isCIDR;
    /**
     * Private: Normalize IP address
     */
    private normalizeIP;
    /**
     * Private: Load rules from file
     */
    private loadRules;
    /**
     * Private: Save rules to file
     */
    private saveRules;
}
/**
 * Helper to validate IP address format
 */
export declare function isValidIP(ip: string): boolean;
