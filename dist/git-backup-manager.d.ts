/**
 * Git Backup & Branch Protection Manager
 * Automated backup, branch protection, and disaster recovery system
 */
export interface BackupConfig {
    remoteBackupUrl?: string;
    backupBranches: string[];
    backupInterval: number;
    maxBackups: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
}
export interface BranchProtectionRules {
    branch: string;
    requirePullRequest: boolean;
    requiredReviews: number;
    enforceAdmins: boolean;
    requireStatusChecks: boolean;
    requiredStatusChecks: string[];
    restrictPushes: boolean;
    allowedPushers: string[];
}
export interface BackupStatus {
    lastBackup: Date;
    backupCount: number;
    remoteStatus: 'connected' | 'disconnected' | 'error';
    diskUsage: string;
    protectedBranches: string[];
}
export declare class GitBackupManager {
    private projectPath;
    private backupDir;
    constructor(projectPath?: string);
    /**
     * Initialize backup system
     */
    initializeBackup(config?: Partial<BackupConfig>): Promise<void>;
    /**
     * Create backup of current repository state
     */
    createBackup(message?: string): Promise<string>;
    /**
     * Restore from backup
     */
    restoreFromBackup(backupName: string, targetPath?: string): Promise<void>;
    /**
     * Setup branch protection rules
     */
    setupBranchProtection(rules: BranchProtectionRules[]): Promise<void>;
    /**
     * Setup GitHub branch protection via API
     */
    private setupGitHubBranchProtection;
    /**
     * Setup local branch protection measures
     */
    private setupLocalBranchProtection;
    /**
     * Create emergency backup before risky operations
     */
    createEmergencyBackup(operation: string): Promise<string>;
    /**
     * Auto-backup on significant changes
     */
    autoBackupOnChanges(): Promise<void>;
    /**
     * Sync with remote backup repository
     */
    syncWithRemote(): Promise<void>;
    /**
     * Get backup status and health check
     */
    getBackupStatus(): Promise<BackupStatus>;
    private getCurrentBranch;
    private getCurrentCommit;
    private getFileCount;
    private getRepositorySize;
    private backupConfigFiles;
    private restoreConfigFiles;
    private compressBackup;
    private cleanupOldBackups;
    private saveBackupConfig;
    private getBackupConfig;
    private setupBackupSchedule;
    private getLastBackupTime;
    private getBackupCount;
    private getBackupDiskUsage;
    private getProtectedBranches;
    private getRemoteUrl;
    private getGitHubOwnerRepo;
}
export declare const gitBackupManager: GitBackupManager;
