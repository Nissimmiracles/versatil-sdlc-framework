#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Credentials Command
 * CLI command for managing service credentials
 */

import { CredentialWizard } from '../dist/onboarding/credential-wizard.js';

/**
 * Main credentials command
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'setup':
        await setupCredentials(args.slice(1));
        break;

      case 'list':
        await listCredentials();
        break;

      case 'test':
        await testCredentials();
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Setup credentials (run wizard)
 */
async function setupCredentials(args) {
  const options = {};

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--service' && args[i + 1]) {
      options.services = options.services || [];
      options.services.push(args[i + 1]);
      i++;
    } else if (args[i] === '--skip-tests') {
      options.skipTests = true;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.outputPath = args[i + 1];
      i++;
    }
  }

  const wizard = new CredentialWizard(options);
  const result = await wizard.run(options);

  process.exit(result.success ? 0 : 1);
}

/**
 * List configured credentials
 */
async function listCredentials() {
  await CredentialWizard.listConfigured();
}

/**
 * Test configured credentials
 */
async function testCredentials() {
  await CredentialWizard.testConfigured();
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
VERSATIL Credential Management

Usage: versatil credentials <command> [options]

Commands:
  setup               Run interactive credential setup wizard
  list                Show configured services
  test                Test connectivity of configured services
  help                Show this help message

Setup Options:
  --service <name>    Configure specific service (can be used multiple times)
  --skip-tests        Skip connection testing
  --output <path>     Custom output path for .env file

Examples:
  # Run full setup wizard
  versatil credentials setup

  # Configure specific services
  versatil credentials setup --service vertex-ai --service github

  # Skip connection tests (faster)
  versatil credentials setup --skip-tests

  # List configured services
  versatil credentials list

  # Test all configured credentials
  versatil credentials test

Available Services:
  • vertex-ai       - Google Vertex AI (Gemini models)
  • supabase        - Vector database for RAG memory (required)
  • github          - GitHub API integration
  • sentry          - Error monitoring
  • semgrep         - Security scanning
  • exa             - AI-powered web search
  • n8n             - Workflow automation
  • openai          - OpenAI API (alternative to Vertex AI)

For more information: https://github.com/Nissimmiracles/versatil-sdlc-framework
  `);
}

// Run
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
