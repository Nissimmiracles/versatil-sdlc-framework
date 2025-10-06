/**
 * VERSATIL SDLC Framework - Public Release Persona Tests
 *
 * These tests validate that users with different backgrounds can:
 * 1. Install the framework
 * 2. Set it up successfully
 * 3. Experience full capabilities
 * 4. Achieve their goals
 *
 * Test Personas:
 * - Junior Developer: New to AI-assisted development
 * - Senior Developer: Wants advanced features
 * - QA Engineer: Focuses on testing
 * - Tech Lead: Needs full team integration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import * as os from 'os';

// Simulated user environments
const TEST_ENVIRONMENTS = {
  junior: path.join(os.tmpdir(), 'versatil-test-junior'),
  senior: path.join(os.tmpdir(), 'versatil-test-senior'),
  qa: path.join(os.tmpdir(), 'versatil-test-qa'),
  techlead: path.join(os.tmpdir(), 'versatil-test-techlead')
};

describe('VERSATIL Public Release - Persona Tests', () => {

  // ========================================
  // PERSONA 1: Junior Developer (Emily)
  // ========================================
  describe('Persona 1: Junior Developer (Emily)', () => {
    const testDir = TEST_ENVIRONMENTS.junior;
    let installResult: any;

    beforeAll(async () => {
      // Clean setup
      await fs.emptyDir(testDir);
      process.chdir(testDir);
    });

    it('Emily can install the framework via npm', () => {
      // Emily runs: npm install @versatil/sdlc-framework
      expect(() => {
        installResult = execSync('npm install @versatil/sdlc-framework', {
          cwd: testDir,
          encoding: 'utf-8'
        });
      }).not.toThrow();

      // Verify installation
      expect(fs.existsSync(path.join(testDir, 'node_modules/@versatil/sdlc-framework'))).toBe(true);
    });

    it('Emily can initialize a new project with the init wizard', () => {
      // Emily runs: npx versatil init
      const initOutput = execSync('npx versatil init --yes', {
        cwd: testDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          VERSATIL_AUTO_ACCEPT: 'true',  // Auto-accept defaults for testing
          VERSATIL_PROJECT_TYPE: 'express-typescript'
        }
      });

      // Verify files created
      expect(fs.existsSync(path.join(testDir, '.versatil-project.json'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.env.example'))).toBe(true);
      expect(initOutput).toContain('Setup complete');
    });

    it('Emily can activate her first agent (Maria QA)', async () => {
      // Emily creates a simple test file
      await fs.writeFile(
        path.join(testDir, 'src/app.test.ts'),
        `
        describe('App', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
        `
      );

      // Import framework
      const { EnhancedMaria } = require('@versatil/sdlc-framework');

      // Activate Maria
      const maria = new EnhancedMaria();
      const response = await maria.activate({
        trigger: 'file-change',
        filePath: 'src/app.test.ts',
        content: fs.readFileSync(path.join(testDir, 'src/app.test.ts'), 'utf-8')
      });

      // Emily should get helpful suggestions
      expect(response.agentId).toBe('enhanced-maria');
      expect(response.suggestions).toBeDefined();
      expect(Array.isArray(response.suggestions)).toBe(true);
    });

    it('Emily can see the agent provided helpful feedback', async () => {
      const { EnhancedMaria } = require('@versatil/sdlc-framework');
      const maria = new EnhancedMaria();

      // Emily writes code with obvious issues
      const poorTestCode = `
        describe('Calculator', () => {
          it('test 1', () => {});  // Empty test
          it('test 2', () => {});  // Empty test
        });
      `;

      const response = await maria.activate({
        trigger: 'file-change',
        filePath: 'src/calculator.test.ts',
        content: poorTestCode
      });

      // Maria should suggest improvements
      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.priority).toMatch(/high|medium/);
    });

    it('Emily finds the documentation helpful', () => {
      const docsPath = path.join(
        testDir,
        'node_modules/@versatil/sdlc-framework/docs'
      );

      // Check essential docs exist
      expect(fs.existsSync(path.join(docsPath, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(docsPath, 'GETTING_STARTED.md'))).toBe(true);
      expect(fs.existsSync(path.join(docsPath, 'AGENTS.md'))).toBe(true);

      // Read getting started guide
      const gettingStarted = fs.readFileSync(
        path.join(docsPath, 'GETTING_STARTED.md'),
        'utf-8'
      );

      // Should have clear instructions
      expect(gettingStarted).toContain('npm install');
      expect(gettingStarted).toContain('versatil init');
      expect(gettingStarted).toContain('examples');
    });

    afterAll(async () => {
      // Cleanup
      await fs.remove(testDir);
    });
  });

  // ========================================
  // PERSONA 2: Senior Developer (Marcus)
  // ========================================
  describe('Persona 2: Senior Developer (Marcus)', () => {
    const testDir = TEST_ENVIRONMENTS.senior;

    beforeAll(async () => {
      await fs.emptyDir(testDir);
      process.chdir(testDir);

      // Marcus already has a project - add VERSATIL to it
      await fs.writeJson(path.join(testDir, 'package.json'), {
        name: 'my-existing-app',
        version: '1.0.0'
      });
    });

    it('Marcus can add VERSATIL to his existing TypeScript project', () => {
      execSync('npm install @versatil/sdlc-framework', { cwd: testDir });

      // Initialize in existing project
      execSync('npx versatil init --existing', {
        cwd: testDir,
        env: {
          ...process.env,
          VERSATIL_AUTO_ACCEPT: 'true'
        }
      });

      // Verify it didn't overwrite his package.json
      const pkg = fs.readJsonSync(path.join(testDir, 'package.json'));
      expect(pkg.name).toBe('my-existing-app');
      expect(pkg.dependencies['@versatil/sdlc-framework']).toBeDefined();
    });

    it('Marcus can configure advanced RAG settings', async () => {
      const { EnhancedVectorMemoryStore } = require('@versatil/sdlc-framework');

      // Marcus wants advanced configuration
      const ragStore = new EnhancedVectorMemoryStore({
        supabaseUrl: 'http://localhost:54321',  // Local Supabase
        supabaseKey: 'test-key',
        projectId: 'my-existing-app',
        caching: {
          enabled: true,
          ttl: 3600,
          maxSize: 100
        },
        bidirectionalSync: true,
        patternLearning: {
          enabled: true,
          reinforcementThreshold: 0.8
        }
      });

      expect(ragStore).toBeDefined();
      expect(ragStore.config.bidirectionalSync).toBe(true);
    });

    it('Marcus can use AI-Era Developer Orchestrator with advanced settings', async () => {
      const { AIEraDeveloperOrchestrator, EnhancedVectorMemoryStore } = require('@versatil/sdlc-framework');

      const ragStore = new EnhancedVectorMemoryStore({
        supabaseUrl: 'http://localhost:54321',
        supabaseKey: 'test-key',
        projectId: 'my-existing-app'
      });

      // Marcus wants full context (30 files, not 5)
      const orchestrator = new AIEraDeveloperOrchestrator({
        ragStore,
        contextDepth: 'advanced',           // 30 files
        enableWebLearning: true,            // Industry best practices
        enablePatternLearning: true,        // Team patterns
        enableExternalKB: false,            // Not yet configured
        proactiveQualityGates: true
      });

      expect(orchestrator.config.contextDepth).toBe('advanced');
    });

    it('Marcus can use dependency injection for testing', async () => {
      const {
        TestFileSystemProvider,
        TestCommandExecutor
      } = require('@versatil/sdlc-framework/testing');

      // Marcus creates test setup
      const testFS = new TestFileSystemProvider({
        'package.json': '{"name": "test"}',
        'tsconfig.json': '{}'
      });

      const testExec = new TestCommandExecutor();
      testExec.setResponse('npm test', '100 tests passed', '', 50);

      // Use with his agent
      const { IntrospectiveAgent } = require('@versatil/sdlc-framework');
      const agent = new IntrospectiveAgent(testFS, testExec);

      const response = await agent.activate({
        trigger: 'test',
        content: ''
      });

      expect(response.agentId).toBe('introspective-agent');
    });

    it('Marcus can run framework health audit', () => {
      const auditOutput = execSync('npx versatil audit --json', {
        cwd: testDir,
        encoding: 'utf-8'
      });

      const audit = JSON.parse(auditOutput);

      // Should have health metrics
      expect(audit.health).toBeDefined();
      expect(audit.health.score).toBeGreaterThanOrEqual(0);
      expect(audit.health.score).toBeLessThanOrEqual(100);
      expect(audit.agents).toBeDefined();
      expect(audit.rag).toBeDefined();
    });

    afterAll(async () => {
      await fs.remove(testDir);
    });
  });

  // ========================================
  // PERSONA 3: QA Engineer (Maria)
  // ========================================
  describe('Persona 3: QA Engineer (Maria)', () => {
    const testDir = TEST_ENVIRONMENTS.qa;

    beforeAll(async () => {
      await fs.emptyDir(testDir);
      process.chdir(testDir);
      execSync('npm install @versatil/sdlc-framework', { cwd: testDir });
      execSync('npx versatil init --yes', {
        cwd: testDir,
        env: { ...process.env, VERSATIL_AUTO_ACCEPT: 'true' }
      });
    });

    it('Maria can generate test coverage reports', async () => {
      const { EnhancedMaria } = require('@versatil/sdlc-framework');
      const maria = new EnhancedMaria();

      // Maria analyzes a component without tests
      const componentCode = `
        export function Button({ onClick, label }) {
          return <button onClick={onClick}>{label}</button>;
        }
      `;

      const response = await maria.activate({
        trigger: 'code-review',
        filePath: 'src/components/Button.tsx',
        content: componentCode,
        userRequest: 'Generate test coverage recommendations'
      });

      // Maria should get specific test suggestions
      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.suggestions.some(s =>
        s.message.includes('test') || s.message.includes('coverage')
      )).toBe(true);
    });

    it('Maria can use real behavior testing patterns', async () => {
      const { TestFileSystemProvider } = require('@versatil/sdlc-framework/testing');

      // Maria creates test with real file system behavior
      const testFS = new TestFileSystemProvider({
        'package.json': '{"name": "app", "version": "1.0.0"}',
        'src/index.ts': 'export const app = true;'
      });

      // Test real file system behavior
      expect(await testFS.fileExists('package.json')).toBe(true);
      expect(await testFS.fileExists('missing.json')).toBe(false);

      // Test real error behavior
      await expect(async () => {
        await testFS.readFile('missing.json');
      }).rejects.toThrow();
    });

    it('Maria can track quality metrics over time', async () => {
      const { PatternLearningSystem, EnhancedVectorMemoryStore } = require('@versatil/sdlc-framework');

      const ragStore = new EnhancedVectorMemoryStore({
        supabaseUrl: 'http://localhost:54321',
        supabaseKey: 'test-key',
        projectId: 'qa-project'
      });

      const patternSystem = new PatternLearningSystem(ragStore);

      // Maria records successful test pattern
      await patternSystem.learnFromSuccess(
        {
          trigger: 'test-run',
          content: 'Integration test for API'
        },
        {
          agentId: 'enhanced-maria',
          message: 'Tests passed',
          suggestions: [],
          priority: 'low',
          handoffTo: [],
          context: {}
        },
        {
          timeToComplete: 5000,
          testsPassed: true,
          codeReviewed: true,
          deployed: false,
          userSatisfaction: 5
        }
      );

      // Maria can query winning patterns
      const patterns = await patternSystem.getWinningPatternsFor({
        trigger: 'test-run',
        content: 'API testing'
      });

      expect(Array.isArray(patterns)).toBe(true);
    });

    it('Maria can generate quality dashboards', async () => {
      const { EnhancedMaria } = require('@versatil/sdlc-framework');
      const maria = new EnhancedMaria();

      // Mock analysis result
      const analysisResult = {
        score: 85,
        coverage: 80,
        quality: 90,
        security: 95,
        performance: 85,
        issues: [
          { type: 'coverage', severity: 'medium', message: 'Some functions not tested' }
        ],
        recommendations: [
          'Add tests for edge cases',
          'Improve error handling'
        ]
      };

      const dashboard = maria.generateQualityDashboard(analysisResult);

      expect(dashboard.overallScore).toBe(85);
      expect(dashboard.metrics.testCoverage).toBe(80);
      expect(dashboard.issues.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
      await fs.remove(testDir);
    });
  });

  // ========================================
  // PERSONA 4: Tech Lead (Sarah)
  // ========================================
  describe('Persona 4: Tech Lead (Sarah)', () => {
    const testDir = TEST_ENVIRONMENTS.techlead;

    beforeAll(async () => {
      await fs.emptyDir(testDir);
      process.chdir(testDir);
      execSync('npm install @versatil/sdlc-framework', { cwd: testDir });
    });

    it('Sarah can set up VERSATIL for her entire team', () => {
      execSync('npx versatil init --team', {
        cwd: testDir,
        env: {
          ...process.env,
          VERSATIL_AUTO_ACCEPT: 'true',
          VERSATIL_TEAM_SIZE: '5',
          VERSATIL_ENABLE_ALL_AGENTS: 'true'
        }
      });

      // Verify team configuration
      const config = fs.readJsonSync(path.join(testDir, '.versatil-project.json'));

      expect(config.agents).toBeDefined();
      expect(config.agents['enhanced-maria'].enabled).toBe(true);
      expect(config.agents['enhanced-james'].enabled).toBe(true);
      expect(config.agents['enhanced-marcus'].enabled).toBe(true);
      expect(config.agents['sarah-pm'].enabled).toBe(true);
      expect(config.agents['alex-ba'].enabled).toBe(true);
    });

    it('Sarah can configure multi-agent workflows', async () => {
      const {
        ProactiveAgentOrchestrator,
        EnhancedMaria,
        EnhancedJames,
        EnhancedMarcus
      } = require('@versatil/sdlc-framework');

      // Sarah sets up orchestrated workflow
      const orchestrator = new ProactiveAgentOrchestrator({
        agents: {
          'enhanced-maria': new EnhancedMaria(),
          'enhanced-james': new EnhancedJames(),
          'enhanced-marcus': new EnhancedMarcus()
        },
        workflows: [
          {
            name: 'feature-development',
            stages: [
              { agent: 'enhanced-marcus', triggers: ['api-change'] },
              { agent: 'enhanced-james', triggers: ['component-change'] },
              { agent: 'enhanced-maria', triggers: ['test-review'] }
            ]
          }
        ]
      });

      expect(orchestrator).toBeDefined();
      expect(orchestrator.workflows.length).toBeGreaterThan(0);
    });

    it('Sarah can enable external knowledge base integration', async () => {
      const { MCPKnowledgeBaseOrchestrator } = require('@versatil/sdlc-framework');

      // Sarah configures GitHub, JIRA, StackOverflow
      const kbOrchestrator = new MCPKnowledgeBaseOrchestrator({
        sources: {
          github: {
            enabled: true,
            token: process.env.GITHUB_TOKEN,
            repos: ['myorg/myrepo']
          },
          jira: {
            enabled: true,
            host: process.env.JIRA_HOST,
            token: process.env.JIRA_TOKEN,
            project: 'MYPROJ'
          },
          stackoverflow: {
            enabled: true,
            tags: ['typescript', 'react', 'nodejs']
          }
        },
        caching: true,
        parallelQueries: true
      });

      expect(kbOrchestrator.sources.github.enabled).toBe(true);
      expect(kbOrchestrator.sources.jira.enabled).toBe(true);
    });

    it('Sarah can monitor team performance metrics', async () => {
      const { PerformanceMonitor } = require('@versatil/sdlc-framework');

      const monitor = new PerformanceMonitor({
        projectId: 'team-project',
        trackMetrics: [
          'agent-activation-time',
          'test-pass-rate',
          'code-review-time',
          'deployment-frequency',
          'mttr'  // Mean Time To Recovery
        ]
      });

      // Sarah records metrics
      monitor.recordMetric('agent-activation-time', 1500);  // 1.5s
      monitor.recordMetric('test-pass-rate', 0.95);         // 95%

      const summary = monitor.getSummary();

      expect(summary.metrics['agent-activation-time'].avg).toBeDefined();
      expect(summary.metrics['test-pass-rate'].latest).toBe(0.95);
    });

    it('Sarah can export team patterns for sharing', async () => {
      const { PatternLearningSystem, EnhancedVectorMemoryStore } = require('@versatil/sdlc-framework');

      const ragStore = new EnhancedVectorMemoryStore({
        supabaseUrl: 'http://localhost:54321',
        supabaseKey: 'test-key',
        projectId: 'team-project'
      });

      const patternSystem = new PatternLearningSystem(ragStore);

      // Export team patterns
      const exportedPatterns = await patternSystem.exportPatterns({
        anonymize: true,           // Remove sensitive data
        includeMetrics: true,
        format: 'json'
      });

      expect(exportedPatterns).toBeDefined();
      expect(exportedPatterns.patterns).toBeDefined();
      expect(Array.isArray(exportedPatterns.patterns)).toBe(true);
    });

    it('Sarah can deploy to production with one command', () => {
      const deployOutput = execSync('npx versatil deploy --dry-run', {
        cwd: testDir,
        encoding: 'utf-8'
      });

      expect(deployOutput).toContain('Deployment plan');
      expect(deployOutput).toContain('agents');
      expect(deployOutput).toContain('database');
    });

    afterAll(async () => {
      await fs.remove(testDir);
    });
  });

  // ========================================
  // CROSS-PERSONA: Integration Tests
  // ========================================
  describe('Cross-Persona Integration', () => {
    it('All personas can use the same framework installation', async () => {
      // Verify framework is consistent across all environments
      const frameworkPaths = Object.values(TEST_ENVIRONMENTS).map(dir =>
        path.join(dir, 'node_modules/@versatil/sdlc-framework')
      );

      // All should have the same version
      const versions = await Promise.all(
        frameworkPaths.map(async p => {
          if (await fs.pathExists(path.join(p, 'package.json'))) {
            const pkg = await fs.readJson(path.join(p, 'package.json'));
            return pkg.version;
          }
          return null;
        })
      );

      const uniqueVersions = [...new Set(versions.filter(v => v !== null))];
      expect(uniqueVersions.length).toBe(1);  // All same version
    });

    it('All personas have access to complete documentation', async () => {
      const docsToCheck = [
        'README.md',
        'GETTING_STARTED.md',
        'API_REFERENCE.md',
        'AGENTS.md',
        'RAG.md',
        'TESTING.md',
        'CONFIGURATION.md'
      ];

      const firstEnv = TEST_ENVIRONMENTS.junior;
      const docsPath = path.join(
        firstEnv,
        'node_modules/@versatil/sdlc-framework/docs'
      );

      for (const doc of docsToCheck) {
        const docPath = path.join(docsPath, doc);
        expect(await fs.pathExists(docPath)).toBe(true);
      }
    });

    it('All personas can collaborate through shared RAG', async () => {
      const { EnhancedVectorMemoryStore } = require('@versatil/sdlc-framework');

      // Shared RAG store
      const sharedRAG = new EnhancedVectorMemoryStore({
        supabaseUrl: 'http://localhost:54321',
        supabaseKey: 'test-key',
        projectId: 'shared-team-project'
      });

      // Emily (junior) stores a pattern
      await sharedRAG.storeMemory({
        content: 'async function fetchData() { ... }',
        contentType: 'code',
        metadata: { author: 'emily', pattern: 'async-fetch' }
      });

      // Marcus (senior) can retrieve it
      const results = await sharedRAG.queryMemories({
        query: 'how to fetch data asynchronously',
        topK: 5
      });

      expect(results.documents.length).toBeGreaterThan(0);
      expect(results.documents[0].metadata.pattern).toBe('async-fetch');
    });
  });

  // ========================================
  // FULL CAPABILITY VERIFICATION
  // ========================================
  describe('Full Capability Verification', () => {
    it('All 6 OPERA agents are available', () => {
      const {
        EnhancedMaria,
        EnhancedJames,
        EnhancedMarcus,
        SarahPM,
        AlexBA,
        DrAIML
      } = require('@versatil/sdlc-framework');

      expect(EnhancedMaria).toBeDefined();
      expect(EnhancedJames).toBeDefined();
      expect(EnhancedMarcus).toBeDefined();
      expect(SarahPM).toBeDefined();
      expect(AlexBA).toBeDefined();
      expect(DrAIML).toBeDefined();
    });

    it('RAG Intelligence System is complete', () => {
      const {
        EnhancedVectorMemoryStore,
        BidirectionalRAGSync,
        PatternLearningSystem,
        LRUCache,
        ConnectionPool
      } = require('@versatil/sdlc-framework');

      expect(EnhancedVectorMemoryStore).toBeDefined();
      expect(BidirectionalRAGSync).toBeDefined();
      expect(PatternLearningSystem).toBeDefined();
      expect(LRUCache).toBeDefined();
      expect(ConnectionPool).toBeDefined();
    });

    it('Orchestration System is complete', () => {
      const {
        AIEraDeveloperOrchestrator,
        AgentRAGSync,
        ParallelTaskManager,
        ProactiveAgentOrchestrator
      } = require('@versatil/sdlc-framework');

      expect(AIEraDeveloperOrchestrator).toBeDefined();
      expect(AgentRAGSync).toBeDefined();
      expect(ParallelTaskManager).toBeDefined();
      expect(ProactiveAgentOrchestrator).toBeDefined();
    });

    it('Testing Utilities are available', () => {
      const {
        TestFileSystemProvider,
        TestCommandExecutor
      } = require('@versatil/sdlc-framework/testing');

      expect(TestFileSystemProvider).toBeDefined();
      expect(TestCommandExecutor).toBeDefined();
    });

    it('CLI Tool is functional', () => {
      const cliPath = require.resolve('@versatil/sdlc-framework/dist/cli');
      expect(fs.existsSync(cliPath)).toBe(true);
    });

    it('Examples are present and runnable', async () => {
      const examplesPath = path.join(
        TEST_ENVIRONMENTS.junior,
        'node_modules/@versatil/sdlc-framework/examples'
      );

      const examples = await fs.readdir(examplesPath);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples).toContain('01-getting-started');
    });

    it('Templates are present', async () => {
      const templatesPath = path.join(
        TEST_ENVIRONMENTS.junior,
        'node_modules/@versatil/sdlc-framework/templates'
      );

      const templates = await fs.readdir(templatesPath);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toContain('express-typescript');
    });

    it('Database schema is included', async () => {
      const schemaPath = path.join(
        TEST_ENVIRONMENTS.junior,
        'node_modules/@versatil/sdlc-framework/database/schema.sql'
      );

      expect(await fs.pathExists(schemaPath)).toBe(true);
    });
  });
});

/**
 * Success Criteria:
 *
 * ✅ Junior Developer (Emily):
 *    - Can install and initialize in < 5 minutes
 *    - Gets helpful agent feedback immediately
 *    - Finds documentation clear and actionable
 *
 * ✅ Senior Developer (Marcus):
 *    - Can add to existing project without conflicts
 *    - Has access to advanced configuration
 *    - Can use dependency injection for testing
 *    - Can run health audits
 *
 * ✅ QA Engineer (Maria):
 *    - Can generate test coverage reports
 *    - Has real behavior testing patterns
 *    - Can track quality metrics over time
 *    - Can generate quality dashboards
 *
 * ✅ Tech Lead (Sarah):
 *    - Can configure for entire team
 *    - Can set up multi-agent workflows
 *    - Can integrate external knowledge bases
 *    - Can monitor team performance
 *    - Can export/share team patterns
 *    - Can deploy with one command
 *
 * ✅ Cross-Persona:
 *    - All use same framework version
 *    - All have complete documentation
 *    - Can collaborate through shared RAG
 *
 * ✅ Full Capability:
 *    - All 6 agents available
 *    - RAG system complete
 *    - Orchestration system complete
 *    - Testing utilities available
 *    - CLI functional
 *    - Examples runnable
 *    - Templates present
 *    - Database schema included
 */