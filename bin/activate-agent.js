#!/usr/bin/env node
/**
 * VERSATIL Framework - Agent Activation System
 *
 * Automatically detects and activates the appropriate OPERA agent based on file patterns.
 * Called by Cursor hooks (afterFileEdit, beforeShellExecution, etc.)
 *
 * Usage:
 *   activate-agent <file-path> [--content <file-content>] [--trigger <hook-name>]
 *
 * Examples:
 *   activate-agent src/components/Button.tsx --trigger afterFileEdit
 *   activate-agent src/api/users.ts --content "..." --trigger beforeShellExecution
 */
import { EnhancedMaria } from '../dist/agents/opera/maria-qa/enhanced-maria.js';
import { EnhancedJames } from '../dist/agents/opera/james-frontend/enhanced-james.js';
import { EnhancedMarcus } from '../dist/agents/opera/marcus-backend/enhanced-marcus.js';
import { EnhancedDana } from '../dist/agents/opera/dana-database/enhanced-dana.js';
import { AlexBa } from '../dist/agents/opera/alex-ba/alex-ba.js';
import { SarahPm } from '../dist/agents/opera/sarah-pm/sarah-pm.js';
import { DrAiMl } from '../dist/agents/opera/dr-ai-ml/dr-ai-ml.js';
import { OliverOnboardingAgent } from '../dist/agents/opera/oliver-onboarding/oliver-onboarding.js';
// Sub-agents (Marcus Backend)
import { MarcusNode } from '../dist/agents/opera/marcus-backend/sub-agents/marcus-node.js';
import { MarcusPython } from '../dist/agents/opera/marcus-backend/sub-agents/marcus-python.js';
import { MarcusRails } from '../dist/agents/opera/marcus-backend/sub-agents/marcus-rails.js';
import { MarcusGo } from '../dist/agents/opera/marcus-backend/sub-agents/marcus-go.js';
import { MarcusJava } from '../dist/agents/opera/marcus-backend/sub-agents/marcus-java.js';
// Sub-agents (James Frontend)
import { JamesReact } from '../dist/agents/opera/james-frontend/sub-agents/james-react.js';
import { JamesVue } from '../dist/agents/opera/james-frontend/sub-agents/james-vue.js';
import { JamesNextJS } from '../dist/agents/opera/james-frontend/sub-agents/james-nextjs.js';
import { JamesAngular } from '../dist/agents/opera/james-frontend/sub-agents/james-angular.js';
import { JamesSvelte } from '../dist/agents/opera/james-frontend/sub-agents/james-svelte.js';
import { EnhancedVectorMemoryStore } from '../dist/rag/enhanced-vector-memory-store.js';
import * as fs from 'fs';
/**
 * Agent Pattern Mapping
 * Maps file patterns to agent IDs for automatic activation
 */
const AGENT_PATTERNS = {
    // Quality Assurance
    'maria-qa': [
        /\.test\.(ts|js|tsx|jsx)$/,
        /\.spec\.(ts|js)$/,
        /__tests__\//,
        /\.e2e\.(ts|js)$/,
        /cypress\//,
        /playwright\//,
    ],
    // Frontend (Core)
    'james-frontend': [
        /\.tsx$/,
        /\.jsx$/,
        /\.vue$/,
        /\.svelte$/,
        /components\//,
        /\.css$/,
        /\.scss$/,
        /\.styled\.(ts|js)$/,
    ],
    // Backend (Core)
    'marcus-backend': [
        /\.api\.(ts|js)$/,
        /routes\//,
        /controllers\//,
        /\/api\//,
        /middleware\//,
        /services\//,
    ],
    // Database
    'dana-database': [
        /\.sql$/,
        /migrations\//,
        /schema\./,
        /supabase\//,
        /prisma\//,
        /drizzle\//,
        /\.db$/,
    ],
    // Requirements Analysis
    'alex-ba': [
        /requirements\//,
        /\.feature$/,
        /user-stories\//,
        /\.md$/, // Markdown files (docs)
        /\.txt$/, // Text requirements
    ],
    // Project Management
    'sarah-pm': [
        /CHANGELOG/,
        /RELEASE/,
        /milestones\//,
        /sprints\//,
        /roadmap/,
    ],
    // AI/ML
    'dr-ai-ml': [
        /\.py$/,
        /\.ipynb$/,
        /models\//,
        /ml\//,
        /ai\//,
        /\.pkl$/,
        /\.h5$/,
    ],
    // Onboarding/Project Setup
    'oliver-onboarding': [
        /\/mcp\//,
        /\.mcp\./,
        /mcp-config/,
        /package\.json$/,
        /tsconfig\.json$/,
    ],
};
/**
 * Sub-Agent Pattern Mapping (Language/Framework Specific)
 */
const SUB_AGENT_PATTERNS = {
    // Marcus Backend Sub-Agents
    'marcus-node': [/package\.json$/, /\.ts$/, /\.js$/, /express/, /fastify/],
    'marcus-python': [/\.py$/, /requirements\.txt$/, /pyproject\.toml$/, /fastapi/, /django/],
    'marcus-rails': [/Gemfile$/, /\.rb$/, /rails/, /active_record/],
    'marcus-go': [/\.go$/, /go\.mod$/, /go\.sum$/],
    'marcus-java': [/\.java$/, /pom\.xml$/, /build\.gradle$/, /spring/],
    // James Frontend Sub-Agents
    'james-react': [/\.tsx$/, /\.jsx$/, /react/, /\.react\./],
    'james-vue': [/\.vue$/, /vue\.config/, /vite\.config/],
    'james-nextjs': [/next\.config/, /app\//, /pages\//],
    'james-angular': [/\.component\.ts$/, /\.module\.ts$/, /angular\.json/],
    'james-svelte': [/\.svelte$/, /svelte\.config/],
};
/**
 * Agent Class Registry
 */
const AGENT_CLASSES = {
    'maria-qa': EnhancedMaria,
    'james-frontend': EnhancedJames,
    'marcus-backend': EnhancedMarcus,
    'dana-database': EnhancedDana,
    'alex-ba': AlexBa,
    'sarah-pm': SarahPm,
    'dr-ai-ml': DrAiMl,
    'oliver-onboarding': OliverOnboardingAgent,
    // Sub-agents
    'marcus-node': MarcusNode,
    'marcus-python': MarcusPython,
    'marcus-rails': MarcusRails,
    'marcus-go': MarcusGo,
    'marcus-java': MarcusJava,
    'james-react': JamesReact,
    'james-vue': JamesVue,
    'james-nextjs': JamesNextJS,
    'james-angular': JamesAngular,
    'james-svelte': JamesSvelte,
};
/**
 * Detect which agent should handle this file
 */
function detectAgent(filePath) {
    // Normalize path
    const normalizedPath = filePath.replace(/\\/g, '/');
    // Check core agent patterns first
    for (const [agentId, patterns] of Object.entries(AGENT_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(normalizedPath))) {
            return agentId;
        }
    }
    // No match - use general agent
    return 'general';
}
/**
 * Detect sub-agent for specialization (if applicable)
 */
function detectSubAgent(filePath, baseAgent) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    // Only check sub-agents if base agent supports them
    if (baseAgent !== 'marcus-backend' && baseAgent !== 'james-frontend') {
        return null;
    }
    // Check sub-agent patterns
    for (const [subAgentId, patterns] of Object.entries(SUB_AGENT_PATTERNS)) {
        // Only consider sub-agents matching the base agent
        if (baseAgent === 'marcus-backend' && !subAgentId.startsWith('marcus-')) {
            continue;
        }
        if (baseAgent === 'james-frontend' && !subAgentId.startsWith('james-')) {
            continue;
        }
        if (patterns.some(pattern => pattern.test(normalizedPath))) {
            return subAgentId;
        }
    }
    return null;
}
/**
 * Read file content if not provided
 */
async function readFileContent(filePath) {
    try {
        return await fs.promises.readFile(filePath, 'utf-8');
    }
    catch (error) {
        // File might not exist yet (e.g., new file creation)
        return '';
    }
}
/**
 * Main activation function
 */
async function activateAgent(filePath, content, trigger) {
    try {
        // Detect agent
        const agentId = detectAgent(filePath);
        if (agentId === 'general') {
            return {
                success: true,
                agent: 'general',
                message: 'No specific agent required for this file',
            };
        }
        // Detect sub-agent (if applicable)
        const subAgentId = detectSubAgent(filePath, agentId);
        const activeAgentId = subAgentId || agentId;
        // Get agent class
        const AgentClass = AGENT_CLASSES[activeAgentId];
        if (!AgentClass) {
            return {
                success: false,
                agent: activeAgentId,
                message: `Agent class not found: ${activeAgentId}`,
            };
        }
        // Initialize RAG memory store
        const memoryStore = new EnhancedVectorMemoryStore();
        // Initialize agent
        const agent = new AgentClass(memoryStore);
        // Read file content if not provided
        const fileContent = content || await readFileContent(filePath);
        // Create activation context
        const context = {
            filePath,
            content: fileContent,
            trigger: trigger || 'manual',
            timestamp: new Date(),
            projectRoot: process.cwd(),
            gitBranch: await getGitBranch(),
            recentChanges: await getRecentGitChanges(),
        };
        // Activate agent (RAG query happens inside activate method)
        const response = await agent.activate(context);
        // Format statusline message
        const statusMessage = formatStatusMessage(activeAgentId, response);
        return {
            success: true,
            agent: activeAgentId,
            message: statusMessage,
            metadata: {
                confidence: response.confidence,
                suggestions: response.suggestions,
                warnings: response.warnings,
                metrics: response.metrics,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            agent: 'unknown',
            message: `Agent activation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
/**
 * Format status message for Cursor statusline
 */
function formatStatusMessage(agentId, response) {
    const agentEmoji = {
        'maria-qa': '🧪',
        'james-frontend': '🎨',
        'marcus-backend': '⚙️',
        'dana-database': '🗄️',
        'alex-ba': '📋',
        'sarah-pm': '📊',
        'dr-ai-ml': '🤖',
        'oliver-mcp': '🔌',
    };
    const emoji = agentEmoji[agentId] || '🤖';
    const agentName = agentId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
    let message = `${emoji} ${agentName}`;
    if (response.status === 'analyzing') {
        message += ' analyzing...';
    }
    else if (response.status === 'complete') {
        message += ' ✅';
    }
    // Add metrics if available
    if (response.metrics) {
        const metrics = Object.entries(response.metrics)
            .slice(0, 2) // First 2 metrics only
            .map(([key, value]) => `${key}: ${value}`)
            .join(' │ ');
        if (metrics) {
            message += ` │ ${metrics}`;
        }
    }
    // Add warnings count
    if (response.warnings && response.warnings.length > 0) {
        message += ` │ ⚠️ ${response.warnings.length} warnings`;
    }
    return message;
}
/**
 * Get current git branch
 */
async function getGitBranch() {
    try {
        const { execSync } = await import('child_process');
        return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    }
    catch {
        return 'unknown';
    }
}
/**
 * Get recent git changes (last commit)
 */
async function getRecentGitChanges() {
    try {
        const { execSync } = await import('child_process');
        const changes = execSync('git diff --name-only HEAD~1..HEAD', { encoding: 'utf-8' });
        return changes.split('\n').filter(Boolean);
    }
    catch {
        return [];
    }
}
/**
 * CLI Entry Point
 */
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
VERSATIL Agent Activation System

Usage:
  activate-agent <file-path> [options]

Options:
  --content <content>   File content (optional, will read from disk if not provided)
  --trigger <hook>      Hook that triggered activation (afterFileEdit, etc.)
  --json                Output JSON format

Examples:
  activate-agent src/components/Button.tsx
  activate-agent src/api/users.ts --trigger afterFileEdit
  activate-agent src/__tests__/auth.test.ts --json
    `);
        process.exit(0);
    }
    const filePath = args[0];
    let content;
    let trigger;
    let jsonOutput = false;
    // Parse options
    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--content' && args[i + 1]) {
            content = args[i + 1];
            i++;
        }
        else if (args[i] === '--trigger' && args[i + 1]) {
            trigger = args[i + 1];
            i++;
        }
        else if (args[i] === '--json') {
            jsonOutput = true;
        }
    }
    // Activate agent
    const result = await activateAgent(filePath, content, trigger);
    // Output result
    if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        if (result.success) {
            console.log(result.message);
        }
        else {
            console.error(`❌ ${result.message}`);
            process.exit(1);
        }
    }
}
// Export for programmatic use
export { activateAgent, detectAgent, detectSubAgent };
// Run CLI - Always run main (since this is a CLI script)
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
