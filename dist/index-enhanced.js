#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework v1.2.0
 * Main Entry Point with Enhanced Features
 */
import { startEnhancedServer, startAutonomousMode } from './enhanced-server.js';
import { VersatilMigration } from './scripts/migrate-to-1.2.0.js';
import * as fs from 'fs/promises';
import * as path from 'path';
async function checkVersion() {
    try {
        const configPath = path.join(process.cwd(), '.versatil', 'config.json');
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        return config.version || '1.1.0';
    }
    catch {
        return '1.1.0';
    }
}
async function showBanner(mode) {
    const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ██╗   ██╗███████╗██████╗ ███████╗ █████╗ ████████╗██╗██╗ ║
║     ██║   ██║██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║██║ ║
║     ██║   ██║█████╗  ██████╔╝███████╗███████║   ██║   ██║██║ ║
║     ╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██╔══██║   ██║   ██║██║ ║
║      ╚████╔╝ ███████╗██║  ██║███████║██║  ██║   ██║   ██║███████╗ ║
║       ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚══════╝ ║
║                                                               ║
║                    SDLC Framework v1.2.0                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;
    console.log(banner);
    if (mode === 'enhanced') {
        console.log(`
🚀 Enhanced Mode Features:
- 🧠 RAG Memory System - Agents learn from experience
- 🤖 Opera Orchestrator - Goal-based development
- 📈 Continuous Learning - Improves with every interaction
- ⚡ 85% faster development

Starting enhanced server...
`);
    }
    else if (mode === 'autonomous') {
        console.log(`
🤖 Autonomous Mode Features:
- 🎯 Full autonomous execution
- 🧠 Self-directed problem solving
- 🔄 Automatic error recovery
- 📊 Zero manual intervention

Starting autonomous mode...
`);
    }
}
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0];
    // Check version and offer migration
    const currentVersion = await checkVersion();
    if (!currentVersion.startsWith('1.2')) {
        console.log(`
⚠️  Current version: ${currentVersion}
📦 New version available: 1.2.0

Would you like to migrate to v1.2.0? (recommended)
Run: npx versatil-sdlc migrate
`);
    }
    switch (mode) {
        case 'enhanced':
            await showBanner('enhanced');
            await startEnhancedServer();
            break;
        case 'autonomous':
            await showBanner('autonomous');
            await startAutonomousMode();
            break;
        case 'migrate':
            const migration = new VersatilMigration();
            await migration.run();
            break;
        case 'test':
            console.log('Running test suite...');
            require('./tests/run-all-tests');
            break;
        case '--version':
        case '-v':
            console.log('VERSATIL SDLC Framework v1.2.0');
            break;
        case '--help':
        case '-h':
        default:
            console.log(`
VERSATIL SDLC Framework v1.2.0

Usage: versatil-sdlc [command] [options]

Commands:
  enhanced     Start in enhanced mode with RAG & Opera
  autonomous   Start in fully autonomous mode
  migrate      Migrate from v1.1.x to v1.2.0
  test         Run interactive test suite
  
Options:
  -v, --version    Show version
  -h, --help       Show help

Examples:
  versatil-sdlc enhanced      # Start with memory & learning
  versatil-sdlc autonomous    # Full autonomous development
  versatil-sdlc test         # See the magic in action

Documentation: https://docs.versatil-framework.com
`);
            break;
    }
}
// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
// Run main
if (require.main === module) {
    main().catch(console.error);
}
export { main };
//# sourceMappingURL=index-enhanced.js.map