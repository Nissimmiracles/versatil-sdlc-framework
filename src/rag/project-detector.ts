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

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as os from 'os';

export interface ProjectFingerprint {
  identifiers: string[];  // All detected identifiers
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
  detectionMethods: string[];  // Which methods successfully detected data
  confidence: number;  // 0-100
}

/**
 * Project Detector Service
 */
export class ProjectDetector {
  private workingDir: string;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  /**
   * Detect project fingerprint
   */
  async detect(): Promise<ProjectFingerprint> {
    const detectionMethods: string[] = [];
    const identifiers: string[] = [];

    // Source 1: Environment variables
    const gcpProjectId = this.detectGCPProjectId();
    if (gcpProjectId) {
      identifiers.push(gcpProjectId);
      detectionMethods.push('environment:GOOGLE_CLOUD_PROJECT');
    }

    const cloudRunURLs = this.detectCloudRunURLs();
    if (cloudRunURLs.length > 0) {
      identifiers.push(...cloudRunURLs);
      detectionMethods.push('environment:CLOUD_RUN_URL');
    }

    const supabaseProjectRef = this.detectSupabaseProjectRef();
    if (supabaseProjectRef) {
      identifiers.push(supabaseProjectRef);
      detectionMethods.push('environment:SUPABASE_PROJECT_REF');
    }

    const supabaseURL = this.detectSupabaseURL();
    if (supabaseURL) {
      identifiers.push(supabaseURL);
      detectionMethods.push('environment:SUPABASE_URL');
    }

    // Source 2: Service account emails
    const serviceAccountEmails = await this.detectServiceAccountEmails();
    if (serviceAccountEmails.length > 0) {
      identifiers.push(...serviceAccountEmails);
      detectionMethods.push('credentials:service_accounts');
    }

    // Source 3: Git repository
    const repositoryURL = await this.detectRepositoryURL();
    if (repositoryURL) {
      // Extract repo name from URL
      const repoName = this.extractRepoName(repositoryURL);
      if (repoName) {
        identifiers.push(repoName);
      }
      detectionMethods.push('git:remote');
    }

    // Source 4: Package.json
    const organizationName = await this.detectOrganizationName();
    if (organizationName) {
      identifiers.push(organizationName);
      detectionMethods.push('package.json:name');
    }

    // Source 5: Git commit authors (usernames)
    const usernames = await this.detectUsernames();
    if (usernames.length > 0) {
      identifiers.push(...usernames);
      detectionMethods.push('git:authors');
    }

    // Source 6: .env file parsing
    const envIdentifiers = await this.parseEnvFile();
    if (envIdentifiers.length > 0) {
      identifiers.push(...envIdentifiers);
      detectionMethods.push('file:.env');
    }

    // Calculate confidence based on number of detection methods
    const confidence = Math.min((detectionMethods.length / 6) * 100, 100);

    return {
      identifiers: [...new Set(identifiers)],  // Deduplicate
      sources: {
        gcpProjectId,
        cloudRunURLs,
        supabaseProjectRef,
        supabaseURL,
        serviceAccountEmails,
        organizationName,
        repositoryURL,
        usernames
      },
      detectionMethods,
      confidence
    };
  }

  /**
   * Detect GCP project ID from environment
   */
  private detectGCPProjectId(): string | null {
    return process.env.GOOGLE_CLOUD_PROJECT || null;
  }

  /**
   * Detect Cloud Run URLs from environment
   */
  private detectCloudRunURLs(): string[] {
    const urls: string[] = [];

    // CLOUD_RUN_URL from .env
    if (process.env.CLOUD_RUN_URL) {
      urls.push(process.env.CLOUD_RUN_URL);
    }

    // Check .env file for additional Cloud Run URLs
    const envPath = join(os.homedir(), '.versatil', '.env');
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      const cloudRunMatches = envContent.match(/https:\/\/[a-z0-9-]+-\d{12,}-[a-z0-9]+\.a\.run\.app/g);
      if (cloudRunMatches) {
        urls.push(...cloudRunMatches);
      }
    }

    return [...new Set(urls)];
  }

  /**
   * Detect Supabase project reference
   */
  private detectSupabaseProjectRef(): string | null {
    return process.env.SUPABASE_PROJECT_REF || null;
  }

  /**
   * Detect Supabase URL
   */
  private detectSupabaseURL(): string | null {
    const supabaseURL = process.env.SUPABASE_URL;
    if (supabaseURL && supabaseURL.includes('supabase')) {
      return supabaseURL;
    }
    return null;
  }

  /**
   * Detect service account emails from credential files
   */
  private async detectServiceAccountEmails(): Promise<string[]> {
    const emails: string[] = [];

    // Check GOOGLE_APPLICATION_CREDENTIALS
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath && existsSync(credPath)) {
      try {
        const credContent = JSON.parse(readFileSync(credPath, 'utf-8'));
        if (credContent.client_email) {
          emails.push(credContent.client_email);
        }
        if (credContent.project_id) {
          // Also extract project ID from service account email
          const projectIdFromEmail = credContent.client_email.split('@')[0];
          if (projectIdFromEmail) {
            emails.push(projectIdFromEmail);
          }
        }
      } catch (error) {
        // Invalid JSON or file not readable
      }
    }

    // Check for common credential file locations
    const commonPaths = [
      join(os.homedir(), '.gcp', 'credentials.json'),
      join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json')
    ];

    for (const path of commonPaths) {
      if (existsSync(path)) {
        try {
          const credContent = JSON.parse(readFileSync(path, 'utf-8'));
          if (credContent.client_email) {
            emails.push(credContent.client_email);
          }
        } catch (error) {
          // Invalid JSON or file not readable
        }
      }
    }

    return [...new Set(emails)];
  }

  /**
   * Detect repository URL from git remote
   */
  private async detectRepositoryURL(): Promise<string | null> {
    try {
      const gitRemote = execSync('git remote get-url origin', {
        cwd: this.workingDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();

      return gitRemote || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract repository name from URL
   */
  private extractRepoName(url: string): string | null {
    try {
      // Handle both HTTPS and SSH formats
      // HTTPS: https://github.com/user/repo.git
      // SSH: git@github.com:user/repo.git

      if (url.startsWith('git@')) {
        // SSH format
        const match = url.match(/:([^/]+)\/([^/]+?)(?:\.git)?$/);
        return match ? match[2] : null;
      } else {
        // HTTPS format
        const match = url.match(/\/([^/]+?)(?:\.git)?$/);
        return match ? match[1] : null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect organization name from package.json
   */
  private async detectOrganizationName(): Promise<string | null> {
    const packageJsonPath = join(this.workingDir, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Check for scoped package name (@org/package)
      if (packageJson.name && packageJson.name.startsWith('@')) {
        const org = packageJson.name.split('/')[0].substring(1);
        return org;
      }

      // Check for organization field
      if (packageJson.organization) {
        return packageJson.organization;
      }

      // Check for author.name
      if (packageJson.author && typeof packageJson.author === 'object') {
        return packageJson.author.name || null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect usernames from git commit history
   */
  private async detectUsernames(): Promise<string[]> {
    try {
      const gitLog = execSync('git log --format="%an" -n 10', {
        cwd: this.workingDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      });

      const authors = gitLog
        .split('\n')
        .filter(Boolean)
        .map(author => author.trim())
        .filter(author => author.length > 0);

      return [...new Set(authors)];
    } catch (error) {
      return [];
    }
  }

  /**
   * Parse .env file for project-specific identifiers
   */
  private async parseEnvFile(): Promise<string[]> {
    const identifiers: string[] = [];
    const envPath = join(os.homedir(), '.versatil', '.env');

    if (!existsSync(envPath)) {
      return identifiers;
    }

    try {
      const envContent = readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) {
          continue;
        }

        // Parse KEY=VALUE
        const match = line.match(/^([A-Z_]+)=(.+)$/);
        if (!match) continue;

        const [, key, value] = match;

        // Detect GCP project IDs
        if (key.includes('PROJECT') && /^[a-z][a-z0-9-]+-\d{6,12}-[a-z0-9]{2}$/.test(value)) {
          identifiers.push(value);
        }

        // Detect Supabase project refs
        if (key.includes('SUPABASE') && /^[a-z]{20}$/.test(value)) {
          identifiers.push(value);
        }

        // Detect URLs
        if (value.startsWith('http')) {
          try {
            const url = new URL(value);
            // Only include non-generic hostnames
            if (!['localhost', 'example.com', 'test.com'].includes(url.hostname)) {
              identifiers.push(url.hostname);
            }
          } catch (error) {
            // Invalid URL
          }
        }
      }
    } catch (error) {
      // File not readable
    }

    return identifiers;
  }

  /**
   * Get blocklist for sanitization
   */
  async getBlocklist(): Promise<string[]> {
    const fingerprint = await this.detect();
    return fingerprint.identifiers;
  }
}

/**
 * Detect project fingerprint (convenience function)
 */
export async function detectProjectFingerprint(workingDir?: string): Promise<ProjectFingerprint> {
  const detector = new ProjectDetector(workingDir);
  return await detector.detect();
}

/**
 * Get project-specific blocklist
 */
export async function getProjectBlocklist(workingDir?: string): Promise<string[]> {
  const detector = new ProjectDetector(workingDir);
  return await detector.getBlocklist();
}
