/**
 * VERSATIL SDLC Framework - Credential Wizard
 * Interactive CLI wizard for setting up service credentials
 */
import { ConnectionTestResult } from './credential-validator.js';
export interface CredentialWizardOptions {
    services?: string[];
    skipTests?: boolean;
    outputPath?: string;
    interactive?: boolean;
    projectContext?: {
        projectPath: string;
        projectId: string;
    };
    useEncryption?: boolean;
    password?: string;
}
export interface CredentialWizardResult {
    success: boolean;
    configured: string[];
    skipped: string[];
    failed: string[];
    testResults: ConnectionTestResult[];
    credentialsPath: string;
    encrypted: boolean;
}
export declare class CredentialWizard {
    private rl;
    private logger;
    private encryptor;
    private versatilHome;
    private credentialsPath;
    private existingCredentials;
    private useEncryption;
    private projectContext?;
    private password?;
    constructor(options?: CredentialWizardOptions);
    /**
     * Load existing credentials from encrypted file or legacy .env
     */
    private loadExistingCredentials;
    /**
     * Load encrypted credentials (new format)
     */
    private loadEncryptedCredentials;
    /**
     * Load legacy .env format credentials (backward compatibility)
     */
    private loadLegacyEnvCredentials;
    /**
     * Ask a question and get user input
     */
    private ask;
    /**
     * Ask a yes/no question
     */
    private askYesNo;
    /**
     * Ask for credential field value with validation
     */
    private askForField;
    /**
     * Ask for password (hidden input)
     */
    private askPassword;
    /**
     * Mask sensitive values for display
     */
    private maskSensitive;
    /**
     * Configure a single service
     */
    private configureService;
    /**
     * Run the credential wizard
     */
    run(options?: CredentialWizardOptions): Promise<CredentialWizardResult>;
    /**
     * Custom service selection
     */
    private customSelection;
    /**
     * Save credentials to .env file
     */
    /**
     * Save credentials (encrypted or legacy .env format)
     */
    private saveCredentials;
    /**
     * Save encrypted credentials (new format)
     */
    private saveEncryptedCredentials;
    /**
     * Save legacy .env format credentials (backward compatibility)
     */
    private saveLegacyEnvCredentials;
    /**
     * Show summary of configuration
     */
    private showSummary;
    /**
     * List configured services
     */
    static listConfigured(): Promise<void>;
    /**
     * Test configured credentials
     */
    static testConfigured(): Promise<void>;
}
