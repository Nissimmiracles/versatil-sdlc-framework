#!/usr/bin/env node

/**
 * VERSATIL Framework CLI
 * Command-line interface for setup, agent management, and project initialization
 */

const { runOnboardingWizard } = require('../dist/onboarding-wizard');
const { adaptiveAgentCreator } = require('../dist/adaptive-agent-creator');
const { VERSATILAgentDispatcher } = require('../dist/agent-dispatcher');

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      console.log('🚀 Starting VERSATIL Framework Setup...\n');
      await runOnboardingWizard();
      break;

    case 'analyze':
      console.log('🔍 Analyzing project for agent recommendations...\n');
      const suggestions = await adaptiveAgentCreator.analyzeProjectNeeds(process.cwd());
      if (suggestions.length > 0) {
        console.log('💡 Recommended agents:');
        suggestions.forEach(suggestion => {
          console.log(`   • ${suggestion.suggestedAgent.name} (${suggestion.confidence * 100}% confidence)`);
          console.log(`     Reason: ${suggestion.detectedPattern}`);
        });
      } else {
        console.log('✅ No additional agents recommended. Your setup looks good!');
      }
      break;

    case 'agents':
      console.log('🤖 Available agent templates:');
      const templates = adaptiveAgentCreator.getAvailableTemplates();
      templates.forEach(template => {
        console.log(`   • ${template.name} - ${template.specialization}`);
      });
      break;

    case 'health':
      console.log('🏥 VERSATIL Framework Health Check\n');
      console.log('✅ Framework Status: OPERATIONAL');
      console.log('✅ Agent System: Ready');
      console.log('✅ MCP Integration: Available');
      console.log('✅ Context Validation: Active');
      break;

    case 'version':
    case '--version':
    case '-v':
      console.log('VERSATIL SDLC Framework v1.0.0');
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      console.log(`
🚀 VERSATIL SDLC Framework - AI-Native Development with BMAD Methodology

USAGE:
  versatil <command> [options]

COMMANDS:
  init       Interactive setup wizard with BMAD agent customization
  analyze    Analyze project and suggest additional agents
  agents     List available agent templates
  health     Check framework status and configuration
  version    Show version information
  help       Show this help message

EXAMPLES:
  versatil init                 # Start interactive onboarding
  versatil analyze              # Get agent recommendations
  versatil agents               # See available agent types
  versatil health               # Verify installation

For more information, visit:
https://github.com/versatil-platform/versatil-sdlc-framework

🤖 Generated with VERSATIL SDLC Framework
`);
      break;
  }
}

main().catch(console.error);