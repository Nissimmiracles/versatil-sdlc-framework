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

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { VERSATILLogger } from '../utils/logger.js';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 600000; // OWASP 2023 recommendation
const PBKDF2_DIGEST = 'sha512';

export interface EncryptedCredentials {
  version: string;
  algorithm: string;
  salt: string; // hex
  iv: string; // hex
  authTag: string; // hex
  ciphertext: string; // hex
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

export class CredentialEncryptor {
  private logger: VERSATILLogger;
  private machineId: string;

  constructor() {
    this.logger = new VERSATILLogger('CredentialEncryptor');
    this.machineId = this.getMachineId();
  }

  /**
   * Get unique machine identifier (deterministic per machine)
   */
  private getMachineId(): string {
    // Use hostname + home directory as machine fingerprint
    const hostname = os.hostname();
    const homedir = os.homedir();
    const username = os.userInfo().username;

    const fingerprint = `${hostname}:${username}:${homedir}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  /**
   * Derive encryption key from project context + machine ID
   * This creates a unique key per project per machine
   */
  private deriveEncryptionKey(
    context: EncryptionContext,
    salt: Buffer,
    password?: string
  ): Buffer {
    // Combine project path, project ID, and machine ID as passphrase
    // This ensures credentials are tied to specific project + machine
    const projectSignature = crypto
      .createHash('sha256')
      .update(context.projectPath)
      .digest('hex');

    const passphrase = password || `${projectSignature}:${context.projectId}:${this.machineId}`;

    // Derive key using PBKDF2
    return crypto.pbkdf2Sync(
      passphrase,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST
    );
  }

  /**
   * Encrypt credentials using AES-256-GCM
   */
  async encrypt(
    credentials: DecryptedCredentials,
    context: EncryptionContext,
    password?: string
  ): Promise<EncryptedCredentials> {
    try {
      this.logger.info('Encrypting credentials', { projectId: context.projectId });

      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive encryption key
      const key = this.deriveEncryptionKey(context, salt, password);

      // Serialize credentials to JSON
      const plaintext = JSON.stringify(credentials);

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Encrypt
      const ciphertext = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return encrypted structure
      const encrypted: EncryptedCredentials = {
        version: '1.0.0',
        algorithm: ALGORITHM,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        ciphertext: ciphertext.toString('hex'),
        metadata: {
          projectId: context.projectId,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };

      this.logger.info('Credentials encrypted successfully', {
        projectId: context.projectId,
        version: encrypted.version
      });

      return encrypted;

    } catch (error) {
      this.logger.error('Credential encryption failed', { error, context });
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt credentials using AES-256-GCM
   */
  async decrypt(
    encrypted: EncryptedCredentials,
    context: EncryptionContext,
    password?: string
  ): Promise<DecryptedCredentials> {
    try {
      this.logger.info('Decrypting credentials', { projectId: context.projectId });

      // Validate version
      if (encrypted.version !== '1.0.0') {
        throw new Error(`Unsupported credential format version: ${encrypted.version}`);
      }

      // Validate algorithm
      if (encrypted.algorithm !== ALGORITHM) {
        throw new Error(`Unsupported encryption algorithm: ${encrypted.algorithm}`);
      }

      // Convert hex strings to buffers
      const salt = Buffer.from(encrypted.salt, 'hex');
      const iv = Buffer.from(encrypted.iv, 'hex');
      const authTag = Buffer.from(encrypted.authTag, 'hex');
      const ciphertext = Buffer.from(encrypted.ciphertext, 'hex');

      // Derive decryption key
      const key = this.deriveEncryptionKey(context, salt, password);

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]).toString('utf8');

      // Parse JSON
      const credentials = JSON.parse(plaintext) as DecryptedCredentials;

      this.logger.info('Credentials decrypted successfully', {
        projectId: context.projectId,
        serviceCount: Object.keys(credentials).length
      });

      return credentials;

    } catch (error) {
      // Provide user-friendly error messages
      if (error instanceof Error && error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error('Decryption failed: Invalid password or corrupted credentials file');
      }

      this.logger.error('Credential decryption failed', { error, context });
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encrypt and save credentials to file
   */
  async encryptToFile(
    credentials: DecryptedCredentials,
    filePath: string,
    context: EncryptionContext,
    password?: string
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Encrypt credentials
      const encrypted = await this.encrypt(credentials, context, password);

      // Write to file with restricted permissions
      await fs.writeFile(filePath, JSON.stringify(encrypted, null, 2), {
        mode: 0o600, // Owner read/write only
        encoding: 'utf8'
      });

      this.logger.info('Credentials saved to file', {
        filePath,
        projectId: context.projectId
      });

    } catch (error) {
      this.logger.error('Failed to save encrypted credentials', { error, filePath });
      throw new Error(`Failed to save credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load and decrypt credentials from file
   */
  async decryptFromFile(
    filePath: string,
    context: EncryptionContext,
    password?: string
  ): Promise<DecryptedCredentials> {
    try {
      // Check if file exists
      await fs.access(filePath);

      // Read encrypted file
      const content = await fs.readFile(filePath, 'utf8');
      const encrypted = JSON.parse(content) as EncryptedCredentials;

      // Decrypt
      const credentials = await this.decrypt(encrypted, context, password);

      this.logger.info('Credentials loaded from file', {
        filePath,
        projectId: context.projectId,
        serviceCount: Object.keys(credentials).length
      });

      return credentials;

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist - return empty credentials
        this.logger.info('Credentials file not found, returning empty', { filePath });
        return {};
      }

      this.logger.error('Failed to load encrypted credentials', { error, filePath });
      throw new Error(`Failed to load credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate encrypted credentials file
   */
  async validateCredentialsFile(filePath: string): Promise<{
    valid: boolean;
    version?: string;
    projectId?: string;
    createdAt?: string;
    error?: string;
  }> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const encrypted = JSON.parse(content) as EncryptedCredentials;

      // Check required fields
      if (!encrypted.version || !encrypted.algorithm || !encrypted.ciphertext) {
        return {
          valid: false,
          error: 'Missing required fields (version, algorithm, or ciphertext)'
        };
      }

      // Check version
      if (encrypted.version !== '1.0.0') {
        return {
          valid: false,
          version: encrypted.version,
          error: `Unsupported version: ${encrypted.version}`
        };
      }

      // Check algorithm
      if (encrypted.algorithm !== ALGORITHM) {
        return {
          valid: false,
          error: `Unsupported algorithm: ${encrypted.algorithm}`
        };
      }

      return {
        valid: true,
        version: encrypted.version,
        projectId: encrypted.metadata?.projectId,
        createdAt: encrypted.metadata?.createdAt
      };

    } catch (error) {
      return {
        valid: false,
        error: `Invalid file format: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Re-encrypt credentials with a new password (for team sharing)
   */
  async reencryptWithPassword(
    filePath: string,
    context: EncryptionContext,
    newPassword: string
  ): Promise<void> {
    try {
      // Decrypt with machine-derived key
      const credentials = await this.decryptFromFile(filePath, context);

      // Re-encrypt with password
      await this.encryptToFile(credentials, filePath, context, newPassword);

      this.logger.info('Credentials re-encrypted with password', { filePath });

    } catch (error) {
      this.logger.error('Re-encryption failed', { error, filePath });
      throw new Error(`Re-encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Singleton instance
 */
let encryptorInstance: CredentialEncryptor | null = null;

export function getCredentialEncryptor(): CredentialEncryptor {
  if (!encryptorInstance) {
    encryptorInstance = new CredentialEncryptor();
  }
  return encryptorInstance;
}
