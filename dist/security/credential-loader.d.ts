/**
 * VERSATIL SDLC Framework - Credential Loader
 * Runtime credential injection with project isolation and memory safety
 *
 * Security Features:
 * - Load credentials only for active project
 * - Inject into process.env at runtime (not global)
 * - Clear from memory after use
 * - Audit all credential access
 * - Prevent cross-project contamination
 */
export interface CredentialLoadOptions {
    projectPath: string;
    projectId: string;
    services?: string[];
    password?: string;
    clearAfter?: number;
}
export interface LoadedCredentials {
    services: string[];
    loadedAt: Date;
    expiresAt?: Date;
    count: number;
}
export declare class CredentialLoader {
    private logger;
    private encryptor;
    private auditLogger;
    private loadedEnvVars;
    private clearTimers;
    constructor();
    /**
     * Load credentials for a project into process.env
     */
    loadCredentials(options: CredentialLoadOptions): Promise<LoadedCredentials>;
    /**
     * Clear loaded credentials from process.env
     */
    clearLoadedCredentials(projectId?: string): void;
    /**
     * Get loaded credential keys (for debugging/validation)
     */
    getLoadedKeys(): string[];
    /**
     * Check if specific credential is loaded
     */
    isCredentialLoaded(key: string): boolean;
    /**
     * Scoped credential execution - load, execute function, clear
     * Best practice for short-lived credential usage
     */
    withCredentials<T>(options: CredentialLoadOptions, fn: () => Promise<T>): Promise<T>;
    /**
     * Load specific service credentials (optimization)
     */
    loadServiceCredentials(projectPath: string, projectId: string, service: string): Promise<{
        [key: string]: string;
    }>;
    /**
     * Check if project has credentials configured
     */
    hasCredentials(projectPath: string): Promise<boolean>;
    /**
     * List configured services for a project
     */
    listConfiguredServices(projectPath: string, projectId: string): Promise<string[]>;
    /**
     * Cleanup all timers on process exit
     */
    cleanup(): void;
}
export declare function getCredentialLoader(): CredentialLoader;
