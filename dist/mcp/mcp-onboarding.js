/**
 * VERSATIL SDLC Framework - MCP Onboarding Module
 * Automatic onboarding for MCP-only installations
 *
 * Purpose: Detect first-time MCP usage and create minimal configuration
 * automatically without requiring npm framework installation.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { VERSATILLogger } from '../utils/logger.js';
export class MCPOnboarding {
    constructor() {
        this.logger = new VERSATILLogger('MCPOnboarding');
        this.frameworkHome = path.join(os.homedir(), '.versatil');
        this.preferencesFile = path.join(this.frameworkHome, 'preferences.json');
        this.envFile = path.join(this.frameworkHome, '.env');
    }
    /**
     * Check if this is a first-time MCP installation
     */
    async checkOnboardingStatus() {
        const hasPreferences = await this.fileExists(this.preferencesFile);
        const hasEnvFile = await this.fileExists(this.envFile);
        const hasFrameworkHome = await this.directoryExists(this.frameworkHome);
        const missingComponents = [];
        if (!hasFrameworkHome)
            missingComponents.push('Framework directory (~/.versatil/)');
        if (!hasPreferences)
            missingComponents.push('Preferences file');
        if (!hasEnvFile)
            missingComponents.push('Environment configuration');
        const isFirstTime = !hasPreferences || !hasFrameworkHome;
        const setupComplete = hasPreferences && hasFrameworkHome;
        return {
            isFirstTime,
            hasPreferences,
            hasEnvFile,
            frameworkHome: this.frameworkHome,
            setupComplete,
            missingComponents,
        };
    }
    /**
     * Run automatic onboarding for first-time MCP users
     */
    async runAutoOnboarding() {
        this.logger.info('Starting automatic MCP onboarding...');
        const createdFiles = [];
        const nextSteps = [];
        try {
            // Step 1: Create framework home directory
            if (!(await this.directoryExists(this.frameworkHome))) {
                await fs.mkdir(this.frameworkHome, { recursive: true });
                createdFiles.push(this.frameworkHome);
                this.logger.info(`Created framework directory: ${this.frameworkHome}`);
            }
            // Step 2: Create default preferences
            if (!(await this.fileExists(this.preferencesFile))) {
                await this.createDefaultPreferences();
                createdFiles.push(this.preferencesFile);
                this.logger.info(`Created preferences file: ${this.preferencesFile}`);
            }
            // Step 3: Create default .env (optional - framework works without it)
            if (!(await this.fileExists(this.envFile))) {
                await this.createDefaultEnv();
                createdFiles.push(this.envFile);
                this.logger.info(`Created environment file: ${this.envFile}`);
            }
            // Step 4: Create logs directory
            const logsDir = path.join(this.frameworkHome, 'logs');
            if (!(await this.directoryExists(logsDir))) {
                await fs.mkdir(logsDir, { recursive: true });
                createdFiles.push(logsDir);
            }
            // Step 5: Create memory directory (for RAG)
            const memoryDir = path.join(this.frameworkHome, 'memory');
            if (!(await this.directoryExists(memoryDir))) {
                await fs.mkdir(memoryDir, { recursive: true });
                createdFiles.push(memoryDir);
            }
            // Step 6: Generate next steps for user
            nextSteps.push('✅ VERSATIL MCP Server is ready to use!');
            nextSteps.push('');
            nextSteps.push('Optional Setup:');
            nextSteps.push(`  • Edit preferences: ${this.preferencesFile}`);
            nextSteps.push(`  • Add credentials: ${this.envFile}`);
            nextSteps.push('  • Install framework: npm install -g @versatil/sdlc-framework');
            nextSteps.push('');
            nextSteps.push('Get Started:');
            nextSteps.push('  • Use any VERSATIL MCP tool from Claude');
            nextSteps.push('  • Tools work locally without external dependencies');
            nextSteps.push('  • Add Supabase/Vertex AI credentials for advanced features');
            this.logger.info('MCP onboarding completed successfully');
            return {
                success: true,
                message: 'VERSATIL MCP Server configured automatically for first-time use',
                createdFiles,
                nextSteps,
            };
        }
        catch (error) {
            this.logger.error('MCP onboarding failed', error);
            return {
                success: false,
                message: `Onboarding failed: ${error instanceof Error ? error.message : String(error)}`,
                createdFiles,
                nextSteps: ['Please check file permissions and try again'],
            };
        }
    }
    /**
     * Create default preferences file
     */
    async createDefaultPreferences() {
        const preferences = {
            // MCP-specific defaults (optimized for Claude Desktop usage)
            updateBehavior: 'manual', // Don't auto-update MCP server
            updateChannel: 'stable',
            safetyLevel: 'balanced',
            checkFrequency: 0, // No background checks for MCP-only
            autoInstallSecurity: false,
            rollbackBehavior: 'manual',
            maxRollbackPoints: 3,
            rollbackOnFailure: false,
            // Notifications (minimal for MCP usage)
            notificationLevel: 'errors',
            notifyOnUpdateAvailable: false,
            notifyOnUpdateInstalled: false,
            notifyOnSecurityUpdate: true,
            notifyOnBreakingChange: true,
            // Privacy (local-first)
            enableTelemetry: false,
            shareErrorReports: false,
            shareUsageStatistics: false,
            // Agent preferences
            agentActivation: 'auto', // Proactive agents
            ruleExecution: 'automatic', // Automatic rule execution
            feedbackLevel: 'normal',
            // Framework configuration
            backupBeforeUpdate: false, // Not needed for MCP-only
            validateAfterUpdate: true,
            allowPrerelease: false,
            skipOptionalDependencies: true,
            // Metadata
            installationType: 'mcp-only',
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            version: '1.0.0',
        };
        await fs.writeFile(this.preferencesFile, JSON.stringify(preferences, null, 2), 'utf-8');
    }
    /**
     * Create default .env file
     */
    async createDefaultEnv() {
        const envContent = `# VERSATIL SDLC Framework - Environment Configuration
# Created automatically by MCP onboarding
# This file is optional - framework works without external services

# =============================================================================
# Framework Configuration
# =============================================================================
NODE_ENV=production
VERSATIL_LOG_LEVEL=info
VERSATIL_MCP_MODE=true

# =============================================================================
# Optional: Supabase (for RAG memory and pattern learning)
# =============================================================================
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key

# =============================================================================
# Optional: Vertex AI (for AI/ML features with Dr.AI-ML agent)
# =============================================================================
# VERTEX_AI_PROJECT=your_gcp_project
# VERTEX_AI_LOCATION=us-central1

# =============================================================================
# Optional: GitHub (for advanced GitHub integration)
# =============================================================================
# GITHUB_TOKEN=your_github_token

# =============================================================================
# Optional: Sentry (for error monitoring)
# =============================================================================
# SENTRY_DSN=your_sentry_dsn

# =============================================================================
# Optional: n8n (for workflow automation)
# =============================================================================
# N8N_URL=your_n8n_url
# N8N_API_KEY=your_n8n_api_key

# =============================================================================
# Notes
# =============================================================================
# • All external services are OPTIONAL
# • MCP server works fully without any credentials
# • Add credentials only when you need specific features
# • See docs/PRIVACY_POLICY.md for data handling details
`;
        await fs.writeFile(this.envFile, envContent, 'utf-8');
    }
    /**
     * Get setup instructions for user
     */
    async getSetupInstructions() {
        const status = await this.checkOnboardingStatus();
        if (status.setupComplete) {
            return `✅ VERSATIL MCP Server is fully configured!

📁 Configuration location: ${this.frameworkHome}

🚀 Getting Started:
  • All MCP tools are ready to use
  • Agents will activate automatically based on your requests
  • Framework works locally without external dependencies

📖 Learn More:
  • Tool examples: Use any versatil_* tool from Claude
  • Resources: Access versatil:// URIs for real-time framework data
  • Prompts: Generate AI-powered code analysis prompts

🔧 Optional Configuration:
  • Edit preferences: ${this.preferencesFile}
  • Add credentials: ${this.envFile}
  • Install full framework: npm install -g @versatil/sdlc-framework`;
        }
        return `⚠️ VERSATIL MCP Server needs initial setup

Missing Components:
${status.missingComponents.map(c => `  • ${c}`).join('\n')}

🔧 Automatic Setup Available:
  The MCP server can configure itself automatically on first use.
  Simply run any VERSATIL tool from Claude, and setup will complete.

Manual Setup (if needed):
  1. Create directory: mkdir -p ${this.frameworkHome}
  2. Add preferences: touch ${this.preferencesFile}
  3. Add credentials: touch ${this.envFile}

Or install the full framework:
  npm install -g @versatil/sdlc-framework
  versatil init`;
    }
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Check if directory exists
     */
    async directoryExists(dirPath) {
        try {
            const stats = await fs.stat(dirPath);
            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }
}
/**
 * Singleton instance for MCP onboarding
 */
let mcpOnboardingInstance = null;
export function getMCPOnboarding() {
    if (!mcpOnboardingInstance) {
        mcpOnboardingInstance = new MCPOnboarding();
    }
    return mcpOnboardingInstance;
}
//# sourceMappingURL=mcp-onboarding.js.map