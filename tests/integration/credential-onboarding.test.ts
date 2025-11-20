/**
 * VERSATIL SDLC Framework - Credential Onboarding Integration Tests
 * End-to-end tests for project-level credential workflow
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { getCredentialEncryptor } from '../../src/security/credential-encryptor.js';
import { getCredentialLoader } from '../../src/security/credential-loader.js';
import { getCredentialAuditLogger } from '../../src/security/credential-audit-logger.js';

describe('Credential Onboarding Integration', () => {
  let testProjectDir: string;
  let projectId: string;

  beforeEach(async () => {
    // Create temporary project directory
    testProjectDir = path.join(os.tmpdir(), `versatil-test-project-${Date.now()}`);
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.mkdir(path.join(testProjectDir, '.versatil'), { recursive: true });

    projectId = `test-project-${Date.now()}`;
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Full Onboarding Workflow', () => {
    it('should complete full credential setup workflow', async () => {
      const encryptor = getCredentialEncryptor();
      const loader = getCredentialLoader();

      // Step 1: User configures credentials (simulated)
      const credentials = {
        github: {
          GITHUB_TOKEN: 'ghp_test_token_abc123',
          GITHUB_USER: 'testuser'
        },
        supabase: {
          SUPABASE_URL: 'https://test.supabase.co',
          SUPABASE_ANON_KEY: 'test_anon_key_xyz789'
        }
      };

      const context = {
        projectPath: testProjectDir,
        projectId
      };

      const credentialsPath = path.join(testProjectDir, '.versatil', 'credentials.json');

      // Step 2: Encrypt and save
      await encryptor.encryptToFile(credentials, credentialsPath, context);

      // Verify file exists
      const stats = await fs.stat(credentialsPath);
      expect(stats.isFile()).toBe(true);

      // Step 3: Load credentials into environment
      const loaded = await loader.loadCredentials({
        projectPath: testProjectDir,
        projectId,
        clearAfter: 0 // Manual cleanup
      });

      expect(loaded.count).toBe(4); // 2 GitHub + 2 Supabase
      expect(loaded.services).toEqual(['github', 'supabase']);

      // Verify environment variables are set
      expect(process.env.GITHUB_TOKEN).toBe('ghp_test_token_abc123');
      expect(process.env.GITHUB_USER).toBe('testuser');
      expect(process.env.SUPABASE_URL).toBe('https://test.supabase.co');
      expect(process.env.SUPABASE_ANON_KEY).toBe('test_anon_key_xyz789');

      // Step 4: Clear credentials
      loader.clearLoadedCredentials(projectId);

      // Verify environment variables are cleared
      expect(process.env.GITHUB_TOKEN).toBeUndefined();
      expect(process.env.GITHUB_USER).toBeUndefined();
      expect(process.env.SUPABASE_URL).toBeUndefined();
      expect(process.env.SUPABASE_ANON_KEY).toBeUndefined();
    });

    it('should support scoped credential execution', async () => {
      const encryptor = getCredentialEncryptor();
      const loader = getCredentialLoader();

      const credentials = {
        github: {
          GITHUB_TOKEN: 'ghp_scoped_test_token'
        }
      };

      const context = { projectPath: testProjectDir, projectId };
      const credentialsPath = path.join(testProjectDir, '.versatil', 'credentials.json');

      await encryptor.encryptToFile(credentials, credentialsPath, context);

      // Execute with automatic cleanup
      let tokenInsideScope: string | undefined;

      await loader.withCredentials(
        { projectPath: testProjectDir, projectId },
        async () => {
          // Inside scope: credentials available
          tokenInsideScope = process.env.GITHUB_TOKEN;
          expect(tokenInsideScope).toBe('ghp_scoped_test_token');
        }
      );

      // Outside scope: credentials cleared
      expect(process.env.GITHUB_TOKEN).toBeUndefined();
    });
  });

  describe('Project Isolation', () => {
    it('should isolate credentials between projects', async () => {
      const encryptor = getCredentialEncryptor();

      // Create two project directories
      const project1Dir = path.join(os.tmpdir(), `versatil-test-p1-${Date.now()}`);
      const project2Dir = path.join(os.tmpdir(), `versatil-test-p2-${Date.now()}`);

      try {
        await fs.mkdir(path.join(project1Dir, '.versatil'), { recursive: true });
        await fs.mkdir(path.join(project2Dir, '.versatil'), { recursive: true });

        // Project 1 credentials
        const creds1 = {
          github: { GITHUB_TOKEN: 'project1_token' }
        };

        const context1 = { projectPath: project1Dir, projectId: 'project-1' };
        await encryptor.encryptToFile(
          creds1,
          path.join(project1Dir, '.versatil', 'credentials.json'),
          context1
        );

        // Project 2 credentials
        const creds2 = {
          github: { GITHUB_TOKEN: 'project2_token' }
        };

        const context2 = { projectPath: project2Dir, projectId: 'project-2' };
        await encryptor.encryptToFile(
          creds2,
          path.join(project2Dir, '.versatil', 'credentials.json'),
          context2
        );

        // Load project 1 credentials with project 1 context
        const decrypted1 = await encryptor.decryptFromFile(
          path.join(project1Dir, '.versatil', 'credentials.json'),
          context1
        );

        expect(decrypted1.github.GITHUB_TOKEN).toBe('project1_token');

        // Load project 2 credentials with project 2 context
        const decrypted2 = await encryptor.decryptFromFile(
          path.join(project2Dir, '.versatil', 'credentials.json'),
          context2
        );

        expect(decrypted2.github.GITHUB_TOKEN).toBe('project2_token');

        // Attempting to decrypt project 1 with project 2 context should fail
        await expect(
          encryptor.decryptFromFile(
            path.join(project1Dir, '.versatil', 'credentials.json'),
            context2
          )
        ).rejects.toThrow('Decryption failed');

      } finally {
        // Cleanup
        await fs.rm(project1Dir, { recursive: true, force: true });
        await fs.rm(project2Dir, { recursive: true, force: true });
      }
    });
  });

  describe('Team Workflow (Export/Import)', () => {
    it('should export and import credentials with password', async () => {
      const encryptor = getCredentialEncryptor();
      const teamPassword = 'team-secret-2025';

      // Senior developer: Configure credentials
      const credentials = {
        github: { GITHUB_TOKEN: 'team_shared_token' }
      };

      const context = { projectPath: testProjectDir, projectId };
      const credentialsPath = path.join(testProjectDir, '.versatil', 'credentials.json');

      await encryptor.encryptToFile(credentials, credentialsPath, context);

      // Senior developer: Export for team with password
      const exportPath = path.join(testProjectDir, '.versatil', 'credentials-export.json.enc');

      const decrypted = await encryptor.decryptFromFile(credentialsPath, context);
      const encrypted = await encryptor.encrypt(decrypted, context, teamPassword);
      await fs.writeFile(exportPath, JSON.stringify(encrypted, null, 2), 'utf8');

      // New team member: Create new project directory
      const newMemberDir = path.join(os.tmpdir(), `versatil-test-newmember-${Date.now()}`);
      await fs.mkdir(path.join(newMemberDir, '.versatil'), { recursive: true });

      try {
        // New team member: Import credentials
        const newMemberContext = { projectPath: newMemberDir, projectId: 'newmember-project' };

        const exportContent = await fs.readFile(exportPath, 'utf8');
        const encryptedExport = JSON.parse(exportContent);

        const importedCredentials = await encryptor.decrypt(encryptedExport, newMemberContext, teamPassword);

        expect(importedCredentials.github.GITHUB_TOKEN).toBe('team_shared_token');

        // Save to new member's project
        const newMemberCredsPath = path.join(newMemberDir, '.versatil', 'credentials.json');
        await encryptor.encryptToFile(importedCredentials, newMemberCredsPath, newMemberContext);

        // Verify new member can decrypt with their own context
        const verified = await encryptor.decryptFromFile(newMemberCredsPath, newMemberContext);
        expect(verified.github.GITHUB_TOKEN).toBe('team_shared_token');

      } finally {
        await fs.rm(newMemberDir, { recursive: true, force: true });
      }
    });

    it('should fail import with wrong password', async () => {
      const encryptor = getCredentialEncryptor();
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';

      const credentials = {
        github: { GITHUB_TOKEN: 'token' }
      };

      const context = { projectPath: testProjectDir, projectId };

      // Export with correct password
      const encrypted = await encryptor.encrypt(credentials, context, correctPassword);

      // Attempt to decrypt with wrong password
      await expect(
        encryptor.decrypt(encrypted, context, wrongPassword)
      ).rejects.toThrow('Decryption failed');
    });
  });

  describe('Audit Logging', () => {
    it('should log credential access events', async () => {
      const encryptor = getCredentialEncryptor();
      const loader = getCredentialLoader();
      const auditLogger = getCredentialAuditLogger();

      const credentials = {
        github: { GITHUB_TOKEN: 'audit_test_token' }
      };

      const context = { projectPath: testProjectDir, projectId };
      const credentialsPath = path.join(testProjectDir, '.versatil', 'credentials.json');

      await encryptor.encryptToFile(credentials, credentialsPath, context);

      // Load credentials (triggers audit log)
      await loader.loadCredentials({
        projectPath: testProjectDir,
        projectId,
        clearAfter: 0
      });

      // Give audit logger time to write (async)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify audit summary
      const summary = await auditLogger.getProjectSummary(projectId, 1);

      expect(summary.totalEvents).toBeGreaterThan(0);
      expect(summary.successfulAccesses).toBeGreaterThan(0);
      expect(summary.uniqueServices.has('github')).toBe(true);

      // Cleanup
      loader.clearLoadedCredentials(projectId);
    });

    it('should detect audit log integrity', async () => {
      const auditLogger = getCredentialAuditLogger();

      // Create some events
      await auditLogger.logAccess({
        timestamp: new Date(),
        projectId,
        projectPath: testProjectDir,
        service: 'github',
        credentialKey: 'GITHUB_TOKEN',
        action: 'load',
        success: true
      });

      await auditLogger.logAccess({
        timestamp: new Date(),
        projectId,
        projectPath: testProjectDir,
        service: 'supabase',
        credentialKey: 'SUPABASE_URL',
        action: 'read',
        success: true
      });

      // Verify integrity
      const integrity = await auditLogger.verifyLogIntegrity();

      expect(integrity.valid).toBe(true);
      expect(integrity.errors).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing credentials file gracefully', async () => {
      const loader = getCredentialLoader();

      // Attempt to load from project with no credentials
      await expect(
        loader.loadCredentials({
          projectPath: testProjectDir,
          projectId
        })
      ).rejects.toThrow('Failed to load credentials');
    });

    it('should handle corrupted credentials file', async () => {
      const credentialsPath = path.join(testProjectDir, '.versatil', 'credentials.json');

      // Write corrupted file
      await fs.writeFile(credentialsPath, 'not valid JSON', 'utf8');

      const encryptor = getCredentialEncryptor();
      const context = { projectPath: testProjectDir, projectId };

      await expect(
        encryptor.decryptFromFile(credentialsPath, context)
      ).rejects.toThrow('Failed to load credentials');
    });

    it('should handle permission errors gracefully', async () => {
      // Skip on Windows (different permission model)
      if (process.platform === 'win32') {
        return;
      }

      const credentialsPath = path.join(testProjectDir, '.versatil', 'credentials.json');

      await fs.writeFile(credentialsPath, 'test', 'utf8');
      await fs.chmod(credentialsPath, 0o000); // No permissions

      const encryptor = getCredentialEncryptor();
      const context = { projectPath: testProjectDir, projectId };

      await expect(
        encryptor.decryptFromFile(credentialsPath, context)
      ).rejects.toThrow();

      // Restore permissions for cleanup
      await fs.chmod(credentialsPath, 0o600);
    });
  });
});
