/**
 * Project Detector - Automatic Project Fingerprinting
 *
 * Auto-detects project-specific identifiers that should be sanitized:
 * - GCP project IDs
 * - Cloud Run URLs
 * - Supabase project references
 * - Service account emails
 * - Organization names
 * - Repository URLs
 *
 * Generates dynamic blocklist for pattern sanitization.
 */
export interface ProjectFingerprint {
    identifiers: string[];
    sources: {
        gcpProjectId: string | null;
        cloudRunURLs: string[];
        supabaseProjectRef: string | null;
        supabaseURL: string | null;
        serviceAccountEmails: string[];
        organizationName: string | null;
        repositoryURL: string | null;
        usernames: string[];
    };
    detectionMethods: string[];
    confidence: number;
}
/**
 * Project Detector Service
 */
export declare class ProjectDetector {
    private workingDir;
    constructor(workingDir?: string);
    /**
     * Detect project fingerprint
     */
    detect(): Promise<ProjectFingerprint>;
    /**
     * Detect GCP project ID from environment
     */
    private detectGCPProjectId;
    /**
     * Detect Cloud Run URLs from environment
     */
    private detectCloudRunURLs;
    /**
     * Detect Supabase project reference
     */
    private detectSupabaseProjectRef;
    /**
     * Detect Supabase URL
     */
    private detectSupabaseURL;
    /**
     * Detect service account emails from credential files
     */
    private detectServiceAccountEmails;
    /**
     * Detect repository URL from git remote
     */
    private detectRepositoryURL;
    /**
     * Extract repository name from URL
     */
    private extractRepoName;
    /**
     * Detect organization name from package.json
     */
    private detectOrganizationName;
    /**
     * Detect usernames from git commit history
     */
    private detectUsernames;
    /**
     * Parse .env file for project-specific identifiers
     */
    private parseEnvFile;
    /**
     * Get blocklist for sanitization
     */
    getBlocklist(): Promise<string[]>;
}
/**
 * Detect project fingerprint (convenience function)
 */
export declare function detectProjectFingerprint(workingDir?: string): Promise<ProjectFingerprint>;
/**
 * Get project-specific blocklist
 */
export declare function getProjectBlocklist(workingDir?: string): Promise<string[]>;
