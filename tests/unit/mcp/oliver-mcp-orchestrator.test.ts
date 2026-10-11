/**
 * Oliver-MCP Orchestrator - Unit Tests
 *
 * Tests MCP selection logic, anti-hallucination detection, and routing
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { OliverMCPAgent } from '../../../src/agents/mcp/oliver-mcp-orchestrator.js';
import { VERSATILLogger } from '../../../src/utils/logger.js';

beforeEach(() => { jest.useFakeTimers({ now: new Date('2025-02-01T00:00:00Z') }); });
afterEach(() => { jest.useRealTimers(); });

describe('OliverMCPAgent', () => {
  let oliver: OliverMCPAgent;
  let logger: VERSATILLogger;

  beforeEach(() => {
    logger = new VERSATILLogger('test');
    oliver = new OliverMCPAgent(logger);
  });

  describe('MCP Selection', () => {
    it('should recommend Playwright for browser testing tasks', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'testing',
        description: 'Test login flow in browser',
        agentId: 'maria-qa'
      });

      expect(recommendation.mcpName).toBe('playwright');
      expect(recommendation.mcpType).toBe('integration');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.reasoning).toContain('playwright');
    });

    it('should recommend GitMCP for framework documentation', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'research',
        description: 'Find FastAPI OAuth2 patterns',
        agentId: 'marcus-backend',
        framework: 'FastAPI',
        topic: 'OAuth2'
      });

      expect(recommendation.mcpName).toBe('gitmcp');
      expect(recommendation.confidence).toBe(0.95);
      expect(recommendation.reasoning).toContain('documentation');
      expect(recommendation.parameters).toHaveProperty('repository');
    });

    it('should recommend Supabase for database operations', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'integration',
        description: 'Create users table with RLS policies',
        agentId: 'dana-database',
        requiresWrite: true
      });

      expect(recommendation.mcpName).toBe('supabase');
      expect(recommendation.mcpType).toBe('integration');
      expect(recommendation.confidence).toBeGreaterThan(0.85);
    });

    it('routes an explicit repository action through the current routing engine', async () => {
      const recommendation = await oliver.routeTask({ name: 'create-github-issue', description: 'Create GitHub issue for fixture/project', agentId: 'sarah-pm', keywords: ['github', 'issue'] });
      expect(recommendation.recommendedMCP).toBe('github');
      expect(recommendation.execution.mcpName).toBe('github');
      expect(recommendation.execution.parameters.repository).toBe('fixture/project');
    });

    it('should provide alternative MCP recommendations', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'research',
        description: 'Search for React Server Components examples',
        agentId: 'james-frontend',
        framework: 'React'
      });

      expect(recommendation.alternatives).toBeDefined();
      expect(recommendation.alternatives!.length).toBeGreaterThan(0);
    });
  });

  describe('Anti-Hallucination Detection', () => {
    it('should detect hallucination risk for outdated framework knowledge', async () => {
      const gitMCPRec = await oliver.shouldUseGitMCP({
        framework: 'FastAPI',
        topic: 'dependency injection',
        agentKnowledge: new Date('2024-01-01')
      });

      expect(gitMCPRec.shouldUse).toBe(true);
      expect(gitMCPRec.hallucination_risk).toBe('high');
      expect(gitMCPRec.repository.owner).toBe('tiangolo');
      expect(gitMCPRec.repository.repo).toBe('fastapi');
    });

    it('should recommend GitMCP for React documentation', async () => {
      const gitMCPRec = await oliver.shouldUseGitMCP({
        framework: 'React',
        topic: 'Server Components',
        agentKnowledge: new Date('2024-06-01')
      });

      expect(gitMCPRec.shouldUse).toBe(true);
      expect(gitMCPRec.repository.owner).toBe('facebook');
      expect(gitMCPRec.repository.repo).toBe('react');
      expect(gitMCPRec.confidence).toBeGreaterThan(0.8);
    });

    it('should have low hallucination risk for well-known patterns', async () => {
      const gitMCPRec = await oliver.shouldUseGitMCP({
        framework: 'JavaScript',
        topic: 'array methods',
        agentKnowledge: new Date('2025-01-01')
      });

      expect(gitMCPRec.hallucination_risk).toBe('low');
    });

    it('should recommend specific file paths for targeted queries', async () => {
      const gitMCPRec = await oliver.shouldUseGitMCP({
        framework: 'FastAPI',
        topic: 'OAuth2 security',
        agentKnowledge: new Date('2024-01-01')
      });

      expect(gitMCPRec.repository.path).toContain('security');
    });
  });

  describe('Agent-Specific MCP Routing', () => {
    it('should route Maria-QA to testing MCPs', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'testing',
        description: 'Run accessibility audit',
        agentId: 'maria-qa'
      });

      expect(['playwright', 'semgrep']).toContain(recommendation.mcpName);
    });

    it('should route Marcus-Backend to backend MCPs', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'integration',
        description: 'Query database for users',
        agentId: 'marcus-backend',
        requiresWrite: false
      });

      expect(['supabase', 'github']).toContain(recommendation.mcpName);
    });

    it('should route James-Frontend to UI MCPs', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'testing',
        description: 'Test component rendering',
        agentId: 'james-frontend'
      });

      expect(recommendation.mcpName).toBe('playwright');
    });

    it('includes project management MCPs in Sarah recommendations', () => {
      expect(oliver.getMCPsForAgent('sarah-pm').map(mcp => mcp.name)).toContain('github');
    });
    it('includes AI capabilities in Dr.AI recommendations', () => {
      expect(oliver.getMCPsForAgent('dr-ai-ml').map(mcp => mcp.name)).toContain('vertex-ai');
    });
  });

  describe('MCP Registry', () => {
    it('should expose the ten registered MCP definitions', () => {
      const mcps = Object.fromEntries(['integration', 'documentation', 'hybrid'].flatMap(type => oliver.getMCPsByType(type as any)).map(mcp => [mcp.name, mcp]));

      expect(Object.keys(mcps).sort()).toEqual(['playwright', 'github', 'vertex-ai', 'supabase', 'n8n', 'semgrep', 'sentry', 'claude-code-mcp', 'gitmcp', 'exa'].sort());
      expect(mcps).toHaveProperty('playwright');
      expect(mcps).toHaveProperty('github');
      expect(mcps).toHaveProperty('supabase');
      expect(mcps).toHaveProperty('sentry');
      expect(mcps).toHaveProperty('vertex-ai');
      expect(mcps).toHaveProperty('semgrep');
      expect(mcps).toHaveProperty('n8n');
      expect(mcps).toHaveProperty('exa');
    });

    it('should classify MCPs by type correctly', () => {
      const mcps = Object.fromEntries(['integration', 'documentation', 'hybrid'].flatMap(type => oliver.getMCPsByType(type as any)).map(mcp => [mcp.name, mcp]));

      // Integration MCPs
      expect(mcps.playwright.type).toBe('integration');
      expect(mcps.supabase.type).toBe('integration');
      expect(mcps.sentry.type).toBe('integration');

      // Documentation MCPs
      expect(mcps.exa.type).toBe('documentation');

      // Hybrid MCPs
      expect(mcps.github.type).toBe('hybrid');
      expect(mcps.n8n.type).toBe('integration');
    });

    it('should have write operation flags set correctly', () => {
      const mcps = Object.fromEntries(['integration', 'documentation', 'hybrid'].flatMap(type => oliver.getMCPsByType(type as any)).map(mcp => [mcp.name, mcp]));

      expect(mcps.playwright.writeOperations).toBe(true);
      expect(mcps.github.writeOperations).toBe(true);
      expect(mcps.exa.writeOperations).toBe(false);
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence for exact matches', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'testing',
        description: 'Run Playwright test',
        agentId: 'maria-qa'
      });

      expect(recommendation.confidence).toBe(0.9);
    });

    it('should have lower confidence for ambiguous requests', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'research',
        description: 'Find information',
        agentId: 'alex-ba'
      });

      expect(recommendation.confidence).toBe(0.8);
    });

    it('should increase confidence with more context', async () => {
      const rec1 = await oliver.selectMCPForTask({
        type: 'research',
        description: 'Find docs',
        agentId: 'marcus-backend'
      });

      const rec2 = await oliver.selectMCPForTask({
        type: 'research',
        description: 'Find FastAPI OAuth2 security documentation',
        agentId: 'marcus-backend',
        framework: 'FastAPI',
        topic: 'OAuth2'
      });

      expect(rec2.confidence).toBeGreaterThan(rec1.confidence);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing agent ID gracefully', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'testing',
        description: 'Test something',
        agentId: 'unknown-agent' as any
      });

      expect(recommendation).toBeDefined();
      expect(recommendation.mcpName).toBeDefined();
    });

    it('should provide fallback when no perfect match exists', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'action',
        description: 'Do something unusual',
        agentId: 'sarah-pm'
      });

      expect(recommendation).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThan(0);
      expect(recommendation.alternatives).toBeDefined();
    });
  });

  describe('Integration with Agents', () => {
    it('should provide MCP suggestions for all OPERA agents', async () => {
      const agents = ['maria-qa', 'james-frontend', 'marcus-backend', 'dana-database', 'sarah-pm', 'alex-ba', 'dr-ai-ml'];

      for (const agentId of agents) {
        const suggestions = await oliver.getMCPsForAgent(agentId);

        expect(suggestions).toBeDefined();
        expect(suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should suggest different MCPs for different agents', async () => {
      const mariaSuggestions = await oliver.getMCPsForAgent('maria-qa');
      const jamesSuggestions = await oliver.getMCPsForAgent('james-frontend');

      expect(mariaSuggestions).not.toEqual(jamesSuggestions);
    });
  });
});

describe('OliverMCPAgent - Integration', () => {
  let oliver: OliverMCPAgent;
  let logger: VERSATILLogger;

  beforeEach(() => {
    logger = new VERSATILLogger('test');
    oliver = new OliverMCPAgent(logger);
  });

  it('should activate and return status', async () => {
    const response = await oliver.activate({
      trigger: 'manual',
      input: 'Test activation'
    });

    expect(response).toBeDefined();
    expect(response.agentId).toBe('oliver-mcp');
  });

  it('should provide MCP selection through activation', async () => {
    const response = await oliver.activate({
      trigger: 'manual',
      input: 'Select MCP for testing React component',
      metadata: {
        agentId: 'james-frontend',
        taskType: 'testing'
      }
    });

    expect(response.agentId).toBe('oliver-mcp');
    expect(response.context.mcpRegistry).toBeDefined();
  });
});
