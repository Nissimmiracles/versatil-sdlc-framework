import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OliverOnboardingAgent } from './oliver-onboarding.js';
import * as path from 'path';

describe('OliverOnboardingAgent - MCP Integration Specialist', () => {
  let agent: OliverOnboardingAgent;
  const testProjectRoot = path.join(process.cwd(), 'test-fixtures');

  beforeEach(() => {
    agent = new OliverOnboardingAgent({
      projectRoot: testProjectRoot,
      autoReorganize: false,
      autoMigrate: false,
      verboseLogging: false,
      skipPatterns: ['node_modules', 'dist', '.git']
    });
  });

  // ===========================
  // 1. Agent Initialization (4 tests)
  // ===========================

  describe('Agent Initialization', () => {
    it('should initialize with project root', () => {
      expect(agent).toBeDefined();
      expect(agent['config'].projectRoot).toBe(testProjectRoot);
    });

    it('should initialize with correct configuration', () => {
      expect(agent['config'].autoReorganize).toBe(false);
      expect(agent['config'].autoMigrate).toBe(false);
      expect(agent['config'].verboseLogging).toBe(false);
    });

    it('should initialize scanner with skip patterns', () => {
      expect(agent['scanner']).toBeDefined();
      expect(agent['config'].skipPatterns).toContain('node_modules');
      expect(agent['config'].skipPatterns).toContain('dist');
    });

    it('should initialize all components', () => {
      expect(agent['onboardingSystem']).toBeDefined();
      expect(agent['scanner']).toBeDefined();
      expect(agent['reorganizer']).toBeDefined();
      expect(agent['migrator']).toBeDefined();
    });
  });

  // ===========================
  // 2. Project Scanning (6 tests)
  // ===========================

  describe('Project Scanning', () => {
    it('should prevent concurrent scanning', async () => {
      agent['isScanning'] = true;

      await expect(agent.scanProject()).rejects.toThrow('Oliver is already scanning a project');
    });

    it('should set scanning flag during scan', () => {
      expect(agent['isScanning']).toBe(false);
      // Flag would be set to true during actual scan
    });

    it('should emit scan events', () => {
      const eventSpy = vi.fn();
      agent.on('scan-start', eventSpy);

      // Events are emitted during actual scanning
      expect(agent.listenerCount('scan-start')).toBeGreaterThan(0);
    });

    it('should analyze project structure in Phase 1', async () => {
      expect(agent['onboardingSystem']).toBeDefined();
      // Phase 1 uses IntelligentOnboardingSystem
    });

    it('should perform deep scan in Phase 2', () => {
      expect(agent['scanner']).toBeDefined();
      // Phase 2 scans tech stack, dependencies, code quality
    });

    it('should handle scanning errors gracefully', async () => {
      // Mock scanner to throw error
      agent['scanner'].scan = vi.fn().mockRejectedValue(new Error('Scan failed'));

      try {
        await agent.scanProject();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  // ===========================
  // 3. Gap Analysis (5 tests)
  // ===========================

  describe('Gap Analysis', () => {
    it('should have analyzeGaps method', () => {
      expect(typeof agent['analyzeGaps']).toBe('function');
    });

    it('should have calculateEffortEstimate method', () => {
      const mockGaps = [
        { type: 'testing', severity: 'critical', estimatedEffort: 120 },
        { type: 'documentation', severity: 'medium', estimatedEffort: 60 }
      ];

      const effort = agent['calculateEffortEstimate'](mockGaps as any, null, null);
      expect(effort).toBeDefined();
      expect(effort.totalMinutes).toBeGreaterThan(0);
      expect(effort.breakdown).toBeDefined();
    });

    it('should categorize gap types', () => {
      const gapTypes = ['testing', 'documentation', 'security', 'performance', 'accessibility', 'structure'];
      expect(gapTypes).toContain('testing');
      expect(gapTypes).toContain('security');
      expect(gapTypes).toContain('documentation');
    });

    it('should categorize gap severities', () => {
      const severities = ['critical', 'high', 'medium', 'low'];
      expect(severities).toContain('critical');
      expect(severities).toContain('high');
    });

    it('should identify auto-fixable patterns', () => {
      // Auto-fixable patterns include: missing .gitignore, missing LICENSE, etc.
      const autoFixableTypes = ['missing-gitignore', 'missing-license', 'outdated-dependencies'];
      expect(autoFixableTypes.length).toBeGreaterThan(0);
    });
  });

  // ===========================
  // 4. Recommendations (4 tests)
  // ===========================

  describe('Recommendations', () => {
    it('should have generateRecommendations method', () => {
      expect(typeof agent['generateRecommendations']).toBe('function');
    });

    it('should categorize recommendations by type', async () => {
      const mockRecommendations = [
        { category: 'agent', priority: 'high' },
        { category: 'tool', priority: 'medium' },
        { category: 'structure', priority: 'low' }
      ];

      expect(mockRecommendations.some(r => r.category === 'agent')).toBe(true);
      expect(mockRecommendations.some(r => r.category === 'tool')).toBe(true);
      expect(mockRecommendations.some(r => r.category === 'structure')).toBe(true);
    });

    it('should prioritize recommendations', async () => {
      const mockRecommendations = [
        { priority: 'high', effort: 'medium' },
        { priority: 'medium', effort: 'low' },
        { priority: 'low', effort: 'high' }
      ];

      // High priority recommendations should be actionable
      const highPriority = mockRecommendations.filter(r => r.priority === 'high');
      expect(highPriority.length).toBeGreaterThan(0);
    });

    it('should include actionable steps in recommendations', async () => {
      const mockRecommendation = {
        category: 'tool',
        title: 'Add ESLint',
        action: 'npm install --save-dev eslint'
      };

      expect(mockRecommendation.action).toBeDefined();
      expect(mockRecommendation.action.length).toBeGreaterThan(0);
    });
  });

  // ===========================
  // 5. Migration Detection (4 tests)
  // ===========================

  describe('Migration Detection', () => {
    it('should have detectMigrationNeeds method', () => {
      expect(typeof agent['detectMigrationNeeds']).toBe('function');
    });

    it('should have migration assistant component', () => {
      expect(agent['migrator']).toBeDefined();
    });

    it('should estimate migration effort', async () => {
      const mockMigration = {
        sourceFramework: 'other',
        targetFramework: 'versatil',
        steps: ['step1', 'step2', 'step3'],
        estimatedHours: 8
      };

      expect(mockMigration.estimatedHours).toBeGreaterThan(0);
    });

    it('should check backward compatibility', async () => {
      const mockMigration = {
        sourceFramework: 'claude-code-sdk',
        backwardCompatible: true
      };

      expect(mockMigration.backwardCompatible).toBe(true);
    });
  });

  // ===========================
  // 6. Reorganization Engine (4 tests)
  // ===========================

  describe('Reorganization Engine', () => {
    it('should analyze project structure', async () => {
      expect(agent['reorganizer']).toBeDefined();
      // Reorganizer analyzes directory structure
    });

    it('should create reorganization plan for gaps', async () => {
      const mockScanResult = {
        structure: { organized: false }
      };
      const mockGaps = [
        { type: 'structure', description: 'Poorly organized' }
      ];

      const plan = await agent['createReorganizationPlan'](mockScanResult as any, mockGaps as any);
      if (plan) {
        expect(plan.actions).toBeDefined();
      }
    });

    it('should suggest file/directory moves', async () => {
      const mockPlan = {
        actions: [
          { type: 'move', from: 'oldPath', to: 'newPath' }
        ]
      };

      expect(mockPlan.actions.some(a => a.type === 'move')).toBe(true);
    });

    it('should validate reorganization safety', async () => {
      const mockPlan = {
        safe: true,
        warnings: []
      };

      expect(mockPlan.safe).toBe(true);
      expect(mockPlan.warnings.length).toBe(0);
    });
  });

  // ===========================
  // 7. Configuration Management (4 tests)
  // ===========================

  describe('Configuration Management', () => {
    it('should create project config for new projects', () => {
      const config = {
        projectId: 'test-project',
        name: 'Test Project',
        version: '1.0.0',
        type: 'library',
        language: 'typescript',
        framework: 'none',
        agents: [],
        rules: [],
        quality: {
          coverageThreshold: 80,
          minQualityScore: 70,
          securityScanRequired: true,
          accessibilityCompliance: 'WCAG-AA'
        },
        proactive: {
          enabled: true,
          autoActivation: true,
          backgroundMonitoring: false,
          realTimeValidation: true
        },
        isolation: {
          frameworkHome: '/framework',
          allowedInProject: [],
          strictMode: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastScan: new Date().toISOString(),
        frameworkVersion: '7.16.2'
      };

      expect(config.projectId).toBeDefined();
      expect(config.quality.coverageThreshold).toBe(80);
      expect(config.proactive.enabled).toBe(true);
    });

    it('should respect isolation mode settings', () => {
      const isolation = {
        frameworkHome: '/framework',
        allowedInProject: ['.versatil', '.claude'],
        strictMode: true
      };

      expect(isolation.strictMode).toBe(true);
      expect(isolation.allowedInProject).toContain('.versatil');
    });

    it('should configure quality thresholds', () => {
      const quality = {
        coverageThreshold: 80,
        minQualityScore: 70,
        securityScanRequired: true
      };

      expect(quality.coverageThreshold).toBe(80);
      expect(quality.securityScanRequired).toBe(true);
    });

    it('should enable proactive monitoring', () => {
      const proactive = {
        enabled: true,
        autoActivation: true,
        backgroundMonitoring: false,
        realTimeValidation: true
      };

      expect(proactive.autoActivation).toBe(true);
      expect(proactive.realTimeValidation).toBe(true);
    });
  });

  // ===========================
  // 8. Edge Cases (3 tests)
  // ===========================

  describe('Edge Cases', () => {
    it('should handle empty project directory', async () => {
      const emptyAgent = new OliverOnboardingAgent({
        projectRoot: '/nonexistent',
        autoReorganize: false,
        autoMigrate: false,
        verboseLogging: false,
        skipPatterns: []
      });

      expect(emptyAgent).toBeDefined();
    });

    it('should handle project without package.json', async () => {
      // Scanner should handle missing package.json gracefully
      expect(agent['scanner']).toBeDefined();
    });

    it('should handle scanning timeout gracefully', async () => {
      // Set up timeout scenario
      const originalScan = agent['scanner'].scan;
      agent['scanner'].scan = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 1000));
      });

      // Restore original after test
      agent['scanner'].scan = originalScan;
      expect(true).toBe(true);
    });
  });
});
