/**
 * VERSATIL Framework - MCP Auto-Configurator
 * Automatically configures VERSATIL MCP Server in Claude Desktop and Cursor
 *
 * Features:
 * - Auto-detects Claude Desktop and Cursor installations
 * - Backs up existing configurations
 * - Adds VERSATIL MCP Server configuration
 * - Cross-platform support (macOS, Linux, Windows)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class MCPAutoConfigurator {
    constructor() {
        this.claudeConfigPaths = [
            // Claude Desktop (macOS)
            path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json'),
            // Claude Desktop (Linux)
            path.join(os.homedir(), '.config/Claude/claude_desktop_config.json'),
            // Claude Desktop (Windows)
            path.join(process.env.APPDATA || '', 'Claude/claude_desktop_config.json')
        ];
        this.cursorConfigPaths = [
            // Cursor (macOS)
            path.join(os.homedir(), 'Library/Application Support/Cursor/User/settings.json'),
            // Cursor (Linux)
            path.join(os.homedir(), '.config/Cursor/User/settings.json'),
            // Cursor (Windows)
            path.join(process.env.APPDATA || '', 'Cursor/User/settings.json')
        ];
    }
    /**
     * Detect Claude Desktop and Cursor installations
     */
    async detectInstallations() {
        // Detect Claude Desktop
        let claudeConfigPath = null;
        for (const configPath of this.claudeConfigPaths) {
            if (fs.existsSync(configPath)) {
                claudeConfigPath = configPath;
                break;
            }
        }
        // Detect Cursor
        let cursorConfigPath = null;
        for (const configPath of this.cursorConfigPaths) {
            if (fs.existsSync(configPath)) {
                cursorConfigPath = configPath;
                break;
            }
        }
        return {
            claudeDesktop: claudeConfigPath !== null,
            claudeConfigPath,
            cursor: cursorConfigPath !== null,
            cursorConfigPath
        };
    }
    /**
     * Configure VERSATIL MCP Server in Claude Desktop
     */
    async configureClaude(projectPath) {
        const detection = await this.detectInstallations();
        if (!detection.claudeDesktop || !detection.claudeConfigPath) {
            return {
                success: false,
                configPath: '',
                error: 'Claude Desktop not detected'
            };
        }
        const configPath = detection.claudeConfigPath;
        try {
            // Ensure config directory exists
            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            // Read existing config or create new
            let config = {};
            if (fs.existsSync(configPath)) {
                try {
                    const content = fs.readFileSync(configPath, 'utf8');
                    config = JSON.parse(content);
                }
                catch (parseError) {
                    console.warn('⚠️  Existing config is invalid JSON, creating new config');
                    config = {};
                }
            }
            // Ensure mcpServers exists
            if (!config.mcpServers) {
                config.mcpServers = {};
            }
            // Get VERSATIL MCP Server path
            const versatilMCPPath = this.getVERSATILMCPPath();
            // Add VERSATIL MCP Server
            config.mcpServers.versatil = {
                command: 'node',
                args: [versatilMCPPath, projectPath],
                env: {
                    VERSATIL_PROJECT_PATH: projectPath,
                    VERSATIL_MCP_ENABLED: 'true',
                    NODE_ENV: process.env.NODE_ENV || 'production'
                }
            };
            // Backup existing config
            let backupPath;
            if (fs.existsSync(configPath)) {
                backupPath = `${configPath}.backup.${Date.now()}`;
                fs.copyFileSync(configPath, backupPath);
            }
            // Write new config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            return {
                success: true,
                configPath,
                backupPath
            };
        }
        catch (error) {
            return {
                success: false,
                configPath,
                error: error.message
            };
        }
    }
    /**
     * Configure VERSATIL MCP Server in Cursor
     */
    async configureCursor(projectPath) {
        const detection = await this.detectInstallations();
        if (!detection.cursor || !detection.cursorConfigPath) {
            return {
                success: false,
                configPath: '',
                error: 'Cursor not detected'
            };
        }
        const configPath = detection.cursorConfigPath;
        try {
            // Ensure config directory exists
            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            // Read existing config or create new
            let config = {};
            if (fs.existsSync(configPath)) {
                try {
                    const content = fs.readFileSync(configPath, 'utf8');
                    config = JSON.parse(content);
                }
                catch (parseError) {
                    console.warn('⚠️  Existing Cursor config is invalid JSON, creating new config');
                    config = {};
                }
            }
            // Ensure mcp.servers exists (Cursor-specific structure)
            if (!config.mcp) {
                config.mcp = { servers: {} };
            }
            if (!config.mcp.servers) {
                config.mcp.servers = {};
            }
            // Get VERSATIL MCP Server path
            const versatilMCPPath = this.getVERSATILMCPPath();
            // Add VERSATIL MCP Server
            config.mcp.servers.versatil = {
                command: 'node',
                args: [versatilMCPPath, projectPath],
                env: {
                    VERSATIL_PROJECT_PATH: projectPath,
                    VERSATIL_MCP_ENABLED: 'true',
                    NODE_ENV: process.env.NODE_ENV || 'production'
                }
            };
            // Backup existing config
            let backupPath;
            if (fs.existsSync(configPath)) {
                backupPath = `${configPath}.backup.${Date.now()}`;
                fs.copyFileSync(configPath, backupPath);
            }
            // Write new config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            return {
                success: true,
                configPath,
                backupPath
            };
        }
        catch (error) {
            return {
                success: false,
                configPath,
                error: error.message
            };
        }
    }
    /**
     * Get path to VERSATIL MCP Server binary
     */
    getVERSATILMCPPath() {
        // Try multiple locations
        const possiblePaths = [
            // Global installation
            path.join(__dirname, '../../bin/versatil-mcp.js'),
            // Local node_modules
            path.join(process.cwd(), 'node_modules/@versatil/sdlc-framework/bin/versatil-mcp.js'),
            // Direct bin path
            path.join(process.cwd(), 'bin/versatil-mcp.js'),
            // Relative to dist
            path.join(__dirname, '../../../bin/versatil-mcp.js')
        ];
        for (const mcpPath of possiblePaths) {
            if (fs.existsSync(mcpPath)) {
                return path.resolve(mcpPath);
            }
        }
        // Fallback to relative path
        return path.resolve(process.cwd(), 'bin/versatil-mcp.js');
    }
    /**
     * Auto-configure MCP Server in all detected IDEs
     */
    async autoConfigureAll(projectPath) {
        const workingDir = projectPath || process.cwd();
        console.log('\n╔════════════════════════════════════════════════════╗');
        console.log('║  🚀 VERSATIL MCP Auto-Configuration               ║');
        console.log('╚════════════════════════════════════════════════════╝\n');
        console.log(`📂 Project: ${workingDir}\n`);
        // Detect installations
        const detection = await this.detectInstallations();
        if (!detection.claudeDesktop && !detection.cursor) {
            console.log('⚠️  Neither Claude Desktop nor Cursor detected.\n');
            this.printManualInstructions(workingDir);
            return;
        }
        // Configure Claude Desktop
        if (detection.claudeDesktop) {
            console.log('🔧 Configuring Claude Desktop...');
            const result = await this.configureClaude(workingDir);
            if (result.success) {
                console.log('   ✅ Successfully configured!');
                console.log(`   📍 Config: ${result.configPath}`);
                if (result.backupPath) {
                    console.log(`   📋 Backup: ${result.backupPath}`);
                }
                console.log('   🔄 Please restart Claude Desktop to activate MCP tools.\n');
            }
            else {
                console.log(`   ❌ Failed: ${result.error}\n`);
            }
        }
        // Configure Cursor
        if (detection.cursor) {
            console.log('🔧 Configuring Cursor...');
            const result = await this.configureCursor(workingDir);
            if (result.success) {
                console.log('   ✅ Successfully configured!');
                console.log(`   📍 Config: ${result.configPath}`);
                if (result.backupPath) {
                    console.log(`   📋 Backup: ${result.backupPath}`);
                }
                console.log('   🔄 Please restart Cursor to activate MCP tools.\n');
            }
            else {
                console.log(`   ❌ Failed: ${result.error}\n`);
            }
        }
        // Display available tools
        this.printAvailableTools();
        console.log('✅ MCP Auto-configuration complete!\n');
    }
    /**
     * Print manual setup instructions
     */
    printManualInstructions(projectPath) {
        const mcpPath = this.getVERSATILMCPPath();
        console.log('📖 Manual Setup Instructions:\n');
        console.log('For Claude Desktop:');
        console.log('  1. Open: ~/Library/Application Support/Claude/claude_desktop_config.json');
        console.log('  2. Add:\n');
        console.log('     {');
        console.log('       "mcpServers": {');
        console.log('         "versatil": {');
        console.log('           "command": "node",');
        console.log(`           "args": ["${mcpPath}", "${projectPath}"]`);
        console.log('         }');
        console.log('       }');
        console.log('     }\n');
        console.log('For Cursor:');
        console.log('  1. Open: ~/Library/Application Support/Cursor/User/settings.json');
        console.log('  2. Add similar config under "mcp.servers"\n');
    }
    /**
     * Print available MCP tools
     */
    printAvailableTools() {
        console.log('🎯 Available VERSATIL MCP Tools:\n');
        console.log('   1. versatil_activate_agent       - Activate OPERA agents (Maria, James, Marcus, etc.)');
        console.log('   2. versatil_orchestrate_sdlc     - Manage SDLC workflow phases');
        console.log('   3. versatil_quality_gate         - Execute quality gates and validations');
        console.log('   4. versatil_test_suite           - Run comprehensive test suites');
        console.log('   5. versatil_architecture_analysis - Analyze system architecture');
        console.log('   6. versatil_deployment_pipeline  - Manage deployment pipelines');
        console.log('   7. versatil_framework_status     - Get framework health and metrics');
        console.log('   8. versatil_adaptive_insights    - Generate adaptive improvement insights');
        console.log('   9. versatil_file_analysis        - Analyze files with agent intelligence');
        console.log('   10. versatil_performance_report  - Generate performance reports\n');
        console.log('💡 Try asking Claude:');
        console.log('   "Use versatil_framework_status to show me the framework health"\n');
    }
}
// Export singleton instance
export const mcpAutoConfigurator = new MCPAutoConfigurator();
//# sourceMappingURL=mcp-auto-configurator.js.map