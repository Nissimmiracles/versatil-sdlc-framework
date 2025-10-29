"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectDetector = void 0;
exports.detectProjectFingerprint = detectProjectFingerprint;
exports.getProjectBlocklist = getProjectBlocklist;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const os = __importStar(require("os"));
/**
 * Project Detector Service
 */
class ProjectDetector {
    constructor(workingDir = process.cwd()) {
        this.workingDir = workingDir;
    }
    /**
     * Detect project fingerprint
     */
    async detect() {
        const detectionMethods = [];
        const identifiers = [];
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
            identifiers: [...new Set(identifiers)], // Deduplicate
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
    detectGCPProjectId() {
        return process.env.GOOGLE_CLOUD_PROJECT || null;
    }
    /**
     * Detect Cloud Run URLs from environment
     */
    detectCloudRunURLs() {
        const urls = [];
        // CLOUD_RUN_URL from .env
        if (process.env.CLOUD_RUN_URL) {
            urls.push(process.env.CLOUD_RUN_URL);
        }
        // Check .env file for additional Cloud Run URLs
        const envPath = (0, path_1.join)(os.homedir(), '.versatil', '.env');
        if ((0, fs_1.existsSync)(envPath)) {
            const envContent = (0, fs_1.readFileSync)(envPath, 'utf-8');
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
    detectSupabaseProjectRef() {
        return process.env.SUPABASE_PROJECT_REF || null;
    }
    /**
     * Detect Supabase URL
     */
    detectSupabaseURL() {
        const supabaseURL = process.env.SUPABASE_URL;
        if (supabaseURL && supabaseURL.includes('supabase')) {
            return supabaseURL;
        }
        return null;
    }
    /**
     * Detect service account emails from credential files
     */
    async detectServiceAccountEmails() {
        const emails = [];
        // Check GOOGLE_APPLICATION_CREDENTIALS
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (credPath && (0, fs_1.existsSync)(credPath)) {
            try {
                const credContent = JSON.parse((0, fs_1.readFileSync)(credPath, 'utf-8'));
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
            }
            catch (error) {
                // Invalid JSON or file not readable
            }
        }
        // Check for common credential file locations
        const commonPaths = [
            (0, path_1.join)(os.homedir(), '.gcp', 'credentials.json'),
            (0, path_1.join)(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json')
        ];
        for (const path of commonPaths) {
            if ((0, fs_1.existsSync)(path)) {
                try {
                    const credContent = JSON.parse((0, fs_1.readFileSync)(path, 'utf-8'));
                    if (credContent.client_email) {
                        emails.push(credContent.client_email);
                    }
                }
                catch (error) {
                    // Invalid JSON or file not readable
                }
            }
        }
        return [...new Set(emails)];
    }
    /**
     * Detect repository URL from git remote
     */
    async detectRepositoryURL() {
        try {
            const gitRemote = (0, child_process_1.execSync)('git remote get-url origin', {
                cwd: this.workingDir,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            return gitRemote || null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Extract repository name from URL
     */
    extractRepoName(url) {
        try {
            // Handle both HTTPS and SSH formats
            // HTTPS: https://github.com/user/repo.git
            // SSH: git@github.com:user/repo.git
            if (url.startsWith('git@')) {
                // SSH format
                const match = url.match(/:([^/]+)\/([^/]+?)(?:\.git)?$/);
                return match ? match[2] : null;
            }
            else {
                // HTTPS format
                const match = url.match(/\/([^/]+?)(?:\.git)?$/);
                return match ? match[1] : null;
            }
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Detect organization name from package.json
     */
    async detectOrganizationName() {
        const packageJsonPath = (0, path_1.join)(this.workingDir, 'package.json');
        if (!(0, fs_1.existsSync)(packageJsonPath)) {
            return null;
        }
        try {
            const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
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
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Detect usernames from git commit history
     */
    async detectUsernames() {
        try {
            const gitLog = (0, child_process_1.execSync)('git log --format="%an" -n 10', {
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
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Parse .env file for project-specific identifiers
     */
    async parseEnvFile() {
        const identifiers = [];
        const envPath = (0, path_1.join)(os.homedir(), '.versatil', '.env');
        if (!(0, fs_1.existsSync)(envPath)) {
            return identifiers;
        }
        try {
            const envContent = (0, fs_1.readFileSync)(envPath, 'utf-8');
            const lines = envContent.split('\n');
            for (const line of lines) {
                // Skip comments and empty lines
                if (line.trim().startsWith('#') || !line.trim()) {
                    continue;
                }
                // Parse KEY=VALUE
                const match = line.match(/^([A-Z_]+)=(.+)$/);
                if (!match)
                    continue;
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
                    }
                    catch (error) {
                        // Invalid URL
                    }
                }
            }
        }
        catch (error) {
            // File not readable
        }
        return identifiers;
    }
    /**
     * Get blocklist for sanitization
     */
    async getBlocklist() {
        const fingerprint = await this.detect();
        return fingerprint.identifiers;
    }
}
exports.ProjectDetector = ProjectDetector;
/**
 * Detect project fingerprint (convenience function)
 */
async function detectProjectFingerprint(workingDir) {
    const detector = new ProjectDetector(workingDir);
    return await detector.detect();
}
/**
 * Get project-specific blocklist
 */
async function getProjectBlocklist(workingDir) {
    const detector = new ProjectDetector(workingDir);
    return await detector.getBlocklist();
}
