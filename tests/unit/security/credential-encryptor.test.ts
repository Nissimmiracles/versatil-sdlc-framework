/**
 * VERSATIL SDLC Framework - Credential Encryptor Unit Tests
 * Tests for AES-256-GCM encryption with PBKDF2 key derivation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { CredentialEncryptor, getCredentialEncryptor, EncryptionContext, DecryptedCredentials } from '../../../src/security/credential-encryptor.js';

describe('CredentialEncryptor', () => {
  let encryptor: CredentialEncryptor;
  let testDir: string;
  let testContext: EncryptionContext;
  let testCredentials: DecryptedCredentials;

  beforeEach(async () => {
    encryptor = getCredentialEncryptor();

    // Create temp directory for tests
    testDir = path.join(os.tmpdir(), `versatil-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Setup test context
    testContext = {
      projectPath: testDir,
      projectId: 'test-project-123'
    };

    // Setup test credentials
    testCredentials = {
      github: {
        GITHUB_TOKEN: 'ghp_test_token_12345',
        GITHUB_USER: 'testuser'
      },
      supabase: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test_anon_key_67890'
      }
    };
  });

  afterEach(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('encrypt', () => {
    it('should encrypt credentials successfully', async () => {
      const encrypted = await encryptor.encrypt(testCredentials, testContext);

      expect(encrypted).toBeDefined();
      expect(encrypted.version).toBe('1.0.0');
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.salt).toMatch(/^[0-9a-f]+$/);
      expect(encrypted.iv).toMatch(/^[0-9a-f]+$/);
      expect(encrypted.authTag).toMatch(/^[0-9a-f]+$/);
      expect(encrypted.ciphertext).toMatch(/^[0-9a-f]+$/);
      expect(encrypted.metadata.projectId).toBe('test-project-123');
    });

    it('should produce different ciphertext for same plaintext (unique IV)', async () => {
      const encrypted1 = await encryptor.encrypt(testCredentials, testContext);
      const encrypted2 = await encryptor.encrypt(testCredentials, testContext);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should encrypt with optional password', async () => {
      const password = 'team-secret-password-2025';
      const encrypted = await encryptor.encrypt(testCredentials, testContext, password);

      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle empty credentials', async () => {
      const emptyCredentials: DecryptedCredentials = {};
      const encrypted = await encryptor.encrypt(emptyCredentials, testContext);

      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt credentials successfully', async () => {
      const encrypted = await encryptor.encrypt(testCredentials, testContext);
      const decrypted = await encryptor.decrypt(encrypted, testContext);

      expect(decrypted).toEqual(testCredentials);
    });

    it('should decrypt with correct password', async () => {
      const password = 'team-secret-password-2025';
      const encrypted = await encryptor.encrypt(testCredentials, testContext, password);
      const decrypted = await encryptor.decrypt(encrypted, testContext, password);

      expect(decrypted).toEqual(testCredentials);
    });

    it('should fail with wrong password', async () => {
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';

      const encrypted = await encryptor.encrypt(testCredentials, testContext, correctPassword);

      await expect(
        encryptor.decrypt(encrypted, testContext, wrongPassword)
      ).rejects.toThrow('Decryption failed');
    });

    it('should fail with wrong project context', async () => {
      const encrypted = await encryptor.encrypt(testCredentials, testContext);

      const wrongContext: EncryptionContext = {
        projectPath: '/different/path',
        projectId: 'different-project'
      };

      await expect(
        encryptor.decrypt(encrypted, wrongContext)
      ).rejects.toThrow('Decryption failed');
    });

    it('should fail with corrupted ciphertext', async () => {
      const encrypted = await encryptor.encrypt(testCredentials, testContext);

      // Corrupt ciphertext
      encrypted.ciphertext = encrypted.ciphertext.substring(0, 10) + 'corrupted';

      await expect(
        encryptor.decrypt(encrypted, testContext)
      ).rejects.toThrow('Decryption failed');
    });

    it('should fail with tampered auth tag', async () => {
      const encrypted = await encryptor.encrypt(testCredentials, testContext);

      // Tamper with auth tag
      encrypted.authTag = encrypted.authTag.substring(0, 10) + '0000000000';

      await expect(
        encryptor.decrypt(encrypted, testContext)
      ).rejects.toThrow('Decryption failed');
    });

    it('should fail with unsupported version', async () => {
      const encrypted = await encryptor.encrypt(testCredentials, testContext);
      encrypted.version = '2.0.0';

      await expect(
        encryptor.decrypt(encrypted, testContext)
      ).rejects.toThrow('Unsupported credential format version: 2.0.0');
    });

    it('should fail with unsupported algorithm', async () => {
      const encrypted = await encryptor.encrypt(testCredentials, testContext);
      encrypted.algorithm = 'aes-128-cbc';

      await expect(
        encryptor.decrypt(encrypted, testContext)
      ).rejects.toThrow('Unsupported encryption algorithm: aes-128-cbc');
    });
  });

  describe('encryptToFile', () => {
    it('should encrypt and save to file', async () => {
      const filePath = path.join(testDir, 'credentials.json');

      await encryptor.encryptToFile(testCredentials, filePath, testContext);

      // Check file exists
      const stats = await fs.stat(filePath);
      expect(stats.isFile()).toBe(true);

      // Check file permissions (Unix only)
      if (process.platform !== 'win32') {
        expect(stats.mode & 0o777).toBe(0o600); // Owner read/write only
      }

      // Check file content is valid JSON
      const content = await fs.readFile(filePath, 'utf8');
      const encrypted = JSON.parse(content);
      expect(encrypted.version).toBe('1.0.0');
    });

    it('should create parent directories if needed', async () => {
      const filePath = path.join(testDir, 'nested', 'dir', 'credentials.json');

      await encryptor.encryptToFile(testCredentials, filePath, testContext);

      const stats = await fs.stat(filePath);
      expect(stats.isFile()).toBe(true);
    });
  });

  describe('decryptFromFile', () => {
    it('should decrypt from file', async () => {
      const filePath = path.join(testDir, 'credentials.json');

      await encryptor.encryptToFile(testCredentials, filePath, testContext);
      const decrypted = await encryptor.decryptFromFile(filePath, testContext);

      expect(decrypted).toEqual(testCredentials);
    });

    it('should return empty credentials if file does not exist', async () => {
      const filePath = path.join(testDir, 'nonexistent.json');

      const decrypted = await encryptor.decryptFromFile(filePath, testContext);

      expect(decrypted).toEqual({});
    });

    it('should fail with corrupted file', async () => {
      const filePath = path.join(testDir, 'corrupted.json');

      await fs.writeFile(filePath, 'not valid JSON', 'utf8');

      await expect(
        encryptor.decryptFromFile(filePath, testContext)
      ).rejects.toThrow('Failed to load credentials');
    });
  });

  describe('validateCredentialsFile', () => {
    it('should validate valid credentials file', async () => {
      const filePath = path.join(testDir, 'credentials.json');
      await encryptor.encryptToFile(testCredentials, filePath, testContext);

      const validation = await encryptor.validateCredentialsFile(filePath);

      expect(validation.valid).toBe(true);
      expect(validation.version).toBe('1.0.0');
      expect(validation.projectId).toBe('test-project-123');
    });

    it('should detect missing required fields', async () => {
      const filePath = path.join(testDir, 'invalid.json');

      await fs.writeFile(filePath, JSON.stringify({
        version: '1.0.0'
        // Missing algorithm, ciphertext
      }), 'utf8');

      const validation = await encryptor.validateCredentialsFile(filePath);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Missing required fields');
    });

    it('should detect unsupported version', async () => {
      const filePath = path.join(testDir, 'unsupported.json');

      await fs.writeFile(filePath, JSON.stringify({
        version: '2.0.0',
        algorithm: 'aes-256-gcm',
        ciphertext: 'test'
      }), 'utf8');

      const validation = await encryptor.validateCredentialsFile(filePath);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Unsupported version: 2.0.0');
    });

    it('should detect unsupported algorithm', async () => {
      const filePath = path.join(testDir, 'unsupported-algo.json');

      await fs.writeFile(filePath, JSON.stringify({
        version: '1.0.0',
        algorithm: 'des',
        ciphertext: 'test'
      }), 'utf8');

      const validation = await encryptor.validateCredentialsFile(filePath);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Unsupported algorithm: des');
    });
  });

  describe('reencryptWithPassword', () => {
    it('should reencrypt with new password', async () => {
      const filePath = path.join(testDir, 'credentials.json');

      // Encrypt with machine-derived key
      await encryptor.encryptToFile(testCredentials, filePath, testContext);

      // Re-encrypt with password
      const newPassword = 'team-password-2025';
      await encryptor.reencryptWithPassword(filePath, testContext, newPassword);

      // Decrypt with password
      const decrypted = await encryptor.decryptFromFile(filePath, testContext, newPassword);

      expect(decrypted).toEqual(testCredentials);
    });

    it('should fail to decrypt without password after reencryption', async () => {
      const filePath = path.join(testDir, 'credentials.json');

      await encryptor.encryptToFile(testCredentials, filePath, testContext);
      await encryptor.reencryptWithPassword(filePath, testContext, 'password');

      // Should fail without password
      await expect(
        encryptor.decryptFromFile(filePath, testContext)
      ).rejects.toThrow('Decryption failed');
    });
  });

  describe('round-trip consistency', () => {
    it('should maintain data integrity through multiple encrypt/decrypt cycles', async () => {
      let credentials = testCredentials;

      for (let i = 0; i < 10; i++) {
        const encrypted = await encryptor.encrypt(credentials, testContext);
        credentials = await encryptor.decrypt(encrypted, testContext);
      }

      expect(credentials).toEqual(testCredentials);
    });

    it('should handle large credential sets', async () => {
      const largeCredentials: DecryptedCredentials = {};

      // Create 100 services with 10 credentials each
      for (let i = 0; i < 100; i++) {
        largeCredentials[`service-${i}`] = {};
        for (let j = 0; j < 10; j++) {
          largeCredentials[`service-${i}`][`KEY_${j}`] = `value_${i}_${j}_${'x'.repeat(100)}`;
        }
      }

      const encrypted = await encryptor.encrypt(largeCredentials, testContext);
      const decrypted = await encryptor.decrypt(encrypted, testContext);

      expect(decrypted).toEqual(largeCredentials);
    });
  });
});
