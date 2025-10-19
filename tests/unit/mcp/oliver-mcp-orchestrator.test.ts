/**
 * Oliver-MCP Orchestrator - Unit Tests
 *
 * Tests MCP selection logic, anti-hallucination detection, and routing
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OliverMCPAgent } from '../../../src/agents/mcp/oliver-mcp-orchestrator.js';
import { VERSATILLogger } from '../../../src/utils/logger.js';

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
      expect(recommendation.reasoning).toContain('browser');
    });

    it('should recommend GitMCP for framework documentation', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'research',
        description: 'Find FastAPI OAuth2 patterns',
        agentId: 'marcus-backend',
        framework: 'FastAPI',
        topic: 'OAuth2'
      });

      expect(recommendation.mcpName).toBe('github');
      expect(recommendation.confidence).toBeGreaterThan(0.9);
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

    it('should recommend GitHub MCP for repository operations', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'action',
        description: 'Create issue for bug fix',
        agentId: 'sarah-pm',
        requiresWrite: true
      });

      expect(recommendation.mcpName).toBe('github');
      expect(recommendation.mcpType).toBe('hybrid');
      expect(recommendation.confidence).toBeGreaterThan(0.9);
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

    it('should route Sarah-PM to project management MCPs', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'action',
        description: 'Update project milestone',
        agentId: 'sarah-pm',
        requiresWrite: true
      });

      expect(['github', 'n8n']).toContain(recommendation.mcpName);
    });

    it('should route Dr.AI-ML to AI/ML MCPs', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'integration',
        description: 'Deploy model to production',
        agentId: 'dr-ai-ml',
        requiresWrite: true
      });

      expect(recommendation.mcpName).toBe('vertex-ai');
    });
  });

  describe('MCP Registry', () => {
    it('should have all 12 MCPs registered', () => {
      const mcps = oliver.getMCPRegistry();

      expect(Object.keys(mcps).length).toBe(12);
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
      const mcps = oliver.getMCPRegistry();

      // Integration MCPs
      expect(mcps.playwright.type).toBe('integration');
      expect(mcps.supabase.type).toBe('integration');
      expect(mcps.sentry.type).toBe('integration');

      // Documentation MCPs
      expect(mcps.exa.type).toBe('documentation');

      // Hybrid MCPs
      expect(mcps.github.type).toBe('hybrid');
      expect(mcps.n8n.type).toBe('hybrid');
    });

    it('should have write operation flags set correctly', () => {
      const mcps = oliver.getMCPRegistry();

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

      expect(recommendation.confidence).toBeGreaterThan(0.95);
    });

    it('should have lower confidence for ambiguous requests', async () => {
      const recommendation = await oliver.selectMCPForTask({
        type: 'research',
        description: 'Find information',
        agentId: 'alex-ba'
      });

      expect(recommendation.confidence).toBeLessThan(0.8);
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
        const suggestions = await oliver.suggestMCPsForAgent(agentId);

        expect(suggestions).toBeDefined();
        expect(suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should suggest different MCPs for different agents', async () => {
      const mariaSuggestions = await oliver.suggestMCPsForAgent('maria-qa');
      const jamesSuggestions = await oliver.suggestMCPsForAgent('james-frontend');

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
    expect(response.success).toBe(true);
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

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });
});
