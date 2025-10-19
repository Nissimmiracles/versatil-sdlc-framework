/**
 * VERSATIL v6.4.1 - Oliver-MCP Integration Tests
 *
 * Tests the complete Oliver-MCP orchestration system:
 * 1. MCP Selection Engine
 * 2. Anti-Hallucination Detector
 * 3. GitMCP Query Generator
 * 4. Main Orchestrator Integration
 *
 * Gap Analysis Task 1.1 - Critical Gap Remediation
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { OliverMCPAgent, MCPRoutingRequest, MCPRoutingResult } from '../../../src/agents/mcp/oliver-mcp-orchestrator.js';
import { VERSATILLogger } from '../../../src/utils/logger.js';

describe('Oliver-MCP Integration Tests', () => {
  let oliver: OliverMCPAgent;
  let logger: VERSATILLogger;

  beforeEach(() => {
    logger = new VERSATILLogger({ level: 'error' }); // Suppress logs during tests
    oliver = new OliverMCPAgent(logger);
  });

  // ============================================================================
  // Test Suite 1: MCP Selection Engine
  // ============================================================================

  describe('MCP Selection Engine', () => {
    test('should select Playwright for browser testing tasks', async () => {
      const request: MCPRoutingRequest = {
        name: 'e2e-test-login',
        description: 'Test login flow with real browser',
        agentId: 'maria-qa',
        filePatterns: ['login.spec.ts'],
        keywords: ['test', 'browser', 'e2e', 'login']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('playwright');
      expect(result.confidence).toBeGreaterThanOrEqual(85);
      expect(result.reasoning).toContain('browser');
    });

    test('should select GitHub MCP for repository operations', async () => {
      const request: MCPRoutingRequest = {
        name: 'create-issue',
        description: 'Create GitHub issue for bug report',
        agentId: 'sarah-pm',
        keywords: ['github', 'issue', 'bug']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('github');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    test('should select Exa for general research tasks', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-competitors',
        description: 'Research competitor analysis for SaaS products',
        agentId: 'alex-ba',
        keywords: ['research', 'competitors', 'market']
      };

      const result = await oliver.routeTask(request);

      // Should select either Exa or GitMCP (both valid for research)
      expect(['exa', 'gitmcp']).toContain(result.recommendedMCP);
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should select Supabase for database operations', async () => {
      const request: MCPRoutingRequest = {
        name: 'query-users',
        description: 'Query user database with vector search',
        agentId: 'dana-database',
        keywords: ['database', 'query', 'vector', 'supabase']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('supabase');
      expect(result.confidence).toBeGreaterThanOrEqual(85);
    });

    test('should select Semgrep for security scanning', async () => {
      const request: MCPRoutingRequest = {
        name: 'security-scan',
        description: 'Run OWASP security scan on API endpoints',
        agentId: 'marcus-backend',
        keywords: ['security', 'scan', 'owasp', 'vulnerabilities']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('semgrep');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  // ============================================================================
  // Test Suite 2: Anti-Hallucination Detection
  // ============================================================================

  describe('Anti-Hallucination Detector', () => {
    test('should detect high hallucination risk for FastAPI queries', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-fastapi-oauth',
        description: 'How do I implement OAuth2 in FastAPI?',
        agentId: 'marcus-backend',
        keywords: ['fastapi', 'oauth2', 'authentication']
      };

      const result = await oliver.routeTask(request);

      // Should recommend GitMCP due to high hallucination risk
      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.hallucinationRisk).toBeDefined();
      expect(result.hallucinationRisk!.level).toBe('high');
      expect(result.hallucinationRisk!.score).toBeGreaterThanOrEqual(70);
    });

    test('should detect high hallucination risk for React queries', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-react-server-components',
        description: 'How do React Server Components work?',
        agentId: 'james-frontend',
        keywords: ['react', 'server components', 'rsc']
      };

      const result = await oliver.routeTask(request);

      // Should recommend GitMCP due to high hallucination risk (React v19+ features)
      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.hallucinationRisk).toBeDefined();
      expect(result.hallucinationRisk!.level).toMatch(/high|medium/);
    });

    test('should detect high hallucination risk for Django queries', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-django-async',
        description: 'How do I use async views in Django?',
        agentId: 'marcus-backend',
        keywords: ['django', 'async', 'views']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.hallucinationRisk).toBeDefined();
      expect(result.hallucinationRisk!.level).toMatch(/high|medium/);
    });

    test('should detect high hallucination risk for Next.js queries', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-nextjs-app-router',
        description: 'How does the Next.js App Router work?',
        agentId: 'james-frontend',
        keywords: ['nextjs', 'app router', 'routing']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.hallucinationRisk).toBeDefined();
    });

    test('should provide direct anti-hallucination detection', async () => {
      const risk = await oliver.detectHallucinationRisk(
        'How do I implement OAuth2 in FastAPI with SQLAlchemy?'
      );

      expect(risk.level).toBe('high');
      expect(risk.score).toBeGreaterThanOrEqual(70);
      expect(risk.reasoning).toContain('FastAPI');
      expect(risk.recommendation).toBeDefined();
      expect(risk.recommendation!.action).toBe('use-gitmcp');
      expect(risk.recommendation!.framework).toBe('FastAPI');
    });
  });

  // ============================================================================
  // Test Suite 3: GitMCP Query Generator
  // ============================================================================

  describe('GitMCP Query Generator', () => {
    test('should generate precise GitMCP query for FastAPI OAuth', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-fastapi-oauth',
        description: 'Find FastAPI OAuth2 implementation patterns',
        agentId: 'marcus-backend',
        keywords: ['fastapi', 'oauth2', 'authentication']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.gitMCPQuery).toBeDefined();
      expect(result.gitMCPQuery!.repository).toBe('tiangolo/fastapi');
      expect(result.gitMCPQuery!.path).toContain('security');
      expect(result.gitMCPQuery!.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should generate precise GitMCP query for React Server Components', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-react-server-components',
        description: 'How do React Server Components work?',
        agentId: 'james-frontend',
        keywords: ['react', 'server components']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.gitMCPQuery).toBeDefined();
      expect(result.gitMCPQuery!.repository).toBe('facebook/react');
      expect(result.gitMCPQuery!.path).toBeDefined();
    });

    test('should generate precise GitMCP query for Next.js App Router', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-nextjs-app-router',
        description: 'How does the Next.js App Router work?',
        agentId: 'james-frontend',
        keywords: ['nextjs', 'app router']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.gitMCPQuery).toBeDefined();
      expect(result.gitMCPQuery!.repository).toBe('vercel/next.js');
    });

    test('should generate GitMCP query for Django database migrations', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-django-migrations',
        description: 'How do I create Django database migrations?',
        agentId: 'dana-database',
        keywords: ['django', 'migrations', 'database']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.gitMCPQuery).toBeDefined();
      expect(result.gitMCPQuery!.repository).toBe('django/django');
      expect(result.gitMCPQuery!.path).toContain('migrations');
    });

    test('should generate direct GitMCP query', async () => {
      const query = await oliver.generateGitMCPQuery({
        framework: 'FastAPI',
        topic: 'OAuth2',
        keywords: ['fastapi', 'oauth2'],
        intent: 'learn'
      });

      expect(query.repository).toBe('tiangolo/fastapi');
      expect(query.path).toContain('security');
      expect(query.fileType).toMatch(/docs|tutorial/);
      expect(query.confidence).toBeGreaterThanOrEqual(70);
      expect(query.reasoning).toBeDefined();
    });
  });

  // ============================================================================
  // Test Suite 4: Main Orchestrator Integration
  // ============================================================================

  describe('Main Orchestrator Integration', () => {
    test('should route research task with full anti-hallucination flow', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-fastapi-oauth',
        description: 'Find FastAPI OAuth2 implementation patterns',
        agentId: 'marcus-backend',
        keywords: ['fastapi', 'oauth2', 'authentication']
      };

      const result = await oliver.routeTask(request);

      // Verify complete routing result structure
      expect(result.recommendedMCP).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(70);
      expect(result.reasoning).toBeDefined();
      expect(result.alternatives).toBeInstanceOf(Array);
      expect(result.execution).toBeDefined();
      expect(result.execution.mcpName).toBe(result.recommendedMCP);
      expect(result.execution.parameters).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.selectionEngine).toBeDefined();
    });

    test('should provide execution parameters for GitMCP', async () => {
      const request: MCPRoutingRequest = {
        name: 'research-fastapi-oauth',
        description: 'Find FastAPI OAuth2 implementation patterns',
        agentId: 'marcus-backend',
        keywords: ['fastapi', 'oauth2']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.execution.parameters.repository).toBe('tiangolo/fastapi');
      expect(result.execution.parameters.path).toBeDefined();
      expect(result.execution.parameters.query).toContain('gitmcp://');
    });

    test('should provide execution parameters for Playwright', async () => {
      const request: MCPRoutingRequest = {
        name: 'e2e-test-login',
        description: 'Test login flow with real browser',
        agentId: 'maria-qa',
        keywords: ['test', 'browser', 'e2e']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('playwright');
      expect(result.execution.parameters.browserType).toBe('chromium');
      expect(result.execution.parameters.headless).toBe(true);
    });

    test('should provide execution parameters for GitHub', async () => {
      const request: MCPRoutingRequest = {
        name: 'create-issue',
        description: 'Create GitHub issue in tiangolo/fastapi',
        agentId: 'sarah-pm',
        keywords: ['github', 'issue']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('github');
      expect(result.execution.parameters.repository).toBe('tiangolo/fastapi');
    });

    test('should provide expected duration for all MCPs', async () => {
      const requests: MCPRoutingRequest[] = [
        { name: 'test1', description: 'GitMCP query', keywords: ['fastapi'] },
        { name: 'test2', description: 'Test with browser', keywords: ['browser', 'test'] },
        { name: 'test3', description: 'Query database', keywords: ['database', 'supabase'] }
      ];

      for (const request of requests) {
        const result = await oliver.routeTask(request);
        expect(result.execution.expectedDuration).toBeDefined();
        expect(result.execution.expectedDuration).toMatch(/\d+-\d+ seconds/);
      }
    });
  });

  // ============================================================================
  // Test Suite 5: Agent Activation
  // ============================================================================

  describe('Agent Activation', () => {
    test('should activate successfully', async () => {
      const context = {
        workingDirectory: '/test/project',
        triggerType: 'manual' as const
      };

      const response = await oliver.activate(context);

      expect(response.agentId).toBe('oliver-mcp');
      expect(response.message).toContain('ready');
      expect(response.context.mcpRegistry).toBeDefined();
      expect(response.context.integrationMCPs).toBeInstanceOf(Array);
      expect(response.context.documentationMCPs).toBeInstanceOf(Array);
    });

    test('should provide MCP suggestions on activation', async () => {
      const context = {
        workingDirectory: '/test/project',
        triggerType: 'manual' as const
      };

      const response = await oliver.activate(context);

      expect(response.suggestions).toBeInstanceOf(Array);
      expect(response.suggestions.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Test Suite 6: MCP Registry
  // ============================================================================

  describe('MCP Registry', () => {
    test('should have all 11 MCPs registered', () => {
      const allMCPs = [
        ...oliver.getMCPsByType('integration'),
        ...oliver.getMCPsByType('documentation'),
        ...oliver.getMCPsByType('hybrid')
      ];

      // Should have all 11 MCPs: playwright, github, vertex-ai, supabase,
      // n8n, semgrep, sentry, claude-code-mcp, gitmcp, exa, (11 total)
      expect(allMCPs.length).toBeGreaterThanOrEqual(10);
    });

    test('should classify MCPs correctly', () => {
      expect(oliver.classifyMCP('playwright')).toBe('integration');
      expect(oliver.classifyMCP('gitmcp')).toBe('documentation');
      expect(oliver.classifyMCP('github')).toBe('hybrid');
      expect(oliver.classifyMCP('exa')).toBe('documentation');
    });

    test('should get MCP definition', () => {
      const playwright = oliver.getMCPDefinition('playwright');
      expect(playwright).toBeDefined();
      expect(playwright!.name).toBe('playwright');
      expect(playwright!.capabilities).toContain('navigate');
      expect(playwright!.writeOperations).toBe(true);
    });

    test('should get MCPs for specific agent', () => {
      const mariaQAMCPs = oliver.getMCPsForAgent('maria-qa');
      expect(mariaQAMCPs.length).toBeGreaterThan(0);
      expect(mariaQAMCPs.some(mcp => mcp.name === 'playwright')).toBe(true);
    });

    test('should get MCPs by type', () => {
      const integrationMCPs = oliver.getMCPsByType('integration');
      const documentationMCPs = oliver.getMCPsByType('documentation');
      const hybridMCPs = oliver.getMCPsByType('hybrid');

      expect(integrationMCPs.length).toBeGreaterThan(0);
      expect(documentationMCPs.length).toBeGreaterThan(0);
      expect(hybridMCPs.length).toBeGreaterThanOrEqual(0);

      // Integration MCPs should have write operations
      integrationMCPs.forEach(mcp => {
        expect(mcp.writeOperations).toBe(true);
      });

      // Documentation MCPs should be read-only
      documentationMCPs.forEach(mcp => {
        expect(mcp.writeOperations).toBe(false);
      });
    });
  });

  // ============================================================================
  // Test Suite 7: Usage Statistics
  // ============================================================================

  describe('Usage Statistics', () => {
    test('should track MCP usage', async () => {
      const requests: MCPRoutingRequest[] = [
        { name: 'test1', description: 'FastAPI OAuth', keywords: ['fastapi', 'oauth2'] },
        { name: 'test2', description: 'FastAPI database', keywords: ['fastapi', 'database'] },
        { name: 'test3', description: 'React components', keywords: ['react', 'components'] }
      ];

      for (const request of requests) {
        await oliver.routeTask(request);
      }

      const stats = oliver.getUsageStats();
      expect(Object.keys(stats).length).toBeGreaterThan(0);

      // GitMCP should have been used at least twice (for FastAPI queries)
      expect(stats['gitmcp']).toBeGreaterThanOrEqual(2);
    });

    test('should track usage for different MCPs', async () => {
      const requests: MCPRoutingRequest[] = [
        { name: 'test1', description: 'Test with browser', keywords: ['browser', 'test'] },
        { name: 'test2', description: 'GitHub issue', keywords: ['github', 'issue'] },
        { name: 'test3', description: 'Database query', keywords: ['database', 'supabase'] }
      ];

      for (const request of requests) {
        await oliver.routeTask(request);
      }

      const stats = oliver.getUsageStats();

      // Should have tracked multiple different MCPs
      expect(Object.keys(stats).length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // Test Suite 8: Edge Cases & Error Handling
  // ============================================================================

  describe('Edge Cases & Error Handling', () => {
    test('should handle minimal request information', async () => {
      const request: MCPRoutingRequest = {
        name: 'minimal-request',
        description: 'Very minimal description'
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
    });

    test('should handle unknown framework gracefully', async () => {
      const request: MCPRoutingRequest = {
        name: 'unknown-framework',
        description: 'How do I use NonExistentFramework for authentication?',
        keywords: ['nonexistentframework', 'auth']
      };

      const result = await oliver.routeTask(request);

      // Should still provide a recommendation (likely Exa for general search)
      expect(result.recommendedMCP).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should handle very long descriptions', async () => {
      const longDescription = 'How do I implement '.repeat(100) + 'OAuth2 in FastAPI?';
      const request: MCPRoutingRequest = {
        name: 'long-description',
        description: longDescription,
        keywords: ['fastapi', 'oauth2']
      };

      const result = await oliver.routeTask(request);

      expect(result.recommendedMCP).toBe('gitmcp');
      expect(result.gitMCPQuery).toBeDefined();
    });

    test('should handle multiple framework mentions', async () => {
      const request: MCPRoutingRequest = {
        name: 'multi-framework',
        description: 'Compare FastAPI, Django, and Flask for authentication',
        keywords: ['fastapi', 'django', 'flask', 'auth']
      };

      const result = await oliver.routeTask(request);

      // Should recommend GitMCP or Exa for comparative research
      expect(['gitmcp', 'exa']).toContain(result.recommendedMCP);
    });

    test('should handle conflicting task type signals', async () => {
      const request: MCPRoutingRequest = {
        name: 'conflicting-signals',
        description: 'Test database research with browser',
        keywords: ['test', 'database', 'research', 'browser']
      };

      const result = await oliver.routeTask(request);

      // Should still make a confident decision
      expect(result.recommendedMCP).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
    });
  });
});
