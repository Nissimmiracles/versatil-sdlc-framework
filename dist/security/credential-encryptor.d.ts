/**
 * VERSATIL SDLC Framework - Credential Encryptor
 * AES-256-GCM encryption for project-level credential storage
 *
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - PBKDF2 key derivation (600,000 iterations)
 * - Unique salt per project
 * - Authentication tags prevent tampering
 * - Zero-knowledge: keys never leave machine
 */
export interface EncryptedCredentials {
    version: string;
    algorithm: string;
    salt: string;
    iv: string;
    authTag: string;
    ciphertext: string;
    metadata: {
        projectId: string;
        createdAt: string;
        lastModified: string;
    };
}
export interface DecryptedCredentials {
    [service: string]: {
        [key: string]: string;
    };
}
export interface EncryptionContext {
    projectPath: string;
    projectId: string;
}
export declare class CredentialEncryptor {
    private logger;
    private machineId;
    constructor();
    /**
     * Get unique machine identifier (deterministic per machine)
     */
    private getMachineId;
    /**
     * Derive encryption key from project context + machine ID
     * This creates a unique key per project per machine
     */
    private deriveEncryptionKey;
    /**
     * Encrypt credentials using AES-256-GCM
     */
    encrypt(credentials: DecryptedCredentials, context: EncryptionContext, password?: string): Promise<EncryptedCredentials>;
    /**
     * Decrypt credentials using AES-256-GCM
     */
    decrypt(encrypted: EncryptedCredentials, context: EncryptionContext, password?: string): Promise<DecryptedCredentials>;
    /**
     * Encrypt and save credentials to file
     */
    encryptToFile(credentials: DecryptedCredentials, filePath: string, context: EncryptionContext, password?: string): Promise<void>;
    /**
     * Load and decrypt credentials from file
     */
    decryptFromFile(filePath: string, context: EncryptionContext, password?: string): Promise<DecryptedCredentials>;
    /**
     * Validate encrypted credentials file
     */
    validateCredentialsFile(filePath: string): Promise<{
        valid: boolean;
        version?: string;
        projectId?: string;
        createdAt?: string;
        error?: string;
    }>;
    /**
     * Re-encrypt credentials with a new password (for team sharing)
     */
    reencryptWithPassword(filePath: string, context: EncryptionContext, newPassword: string): Promise<void>;
}
export declare function getCredentialEncryptor(): CredentialEncryptor;
