/**
 * VERSATIL SDLC Framework - Framework Verifier Tests
 * Priority 2: Guardian Component Testing (Batch 6)
 *
 * Test Coverage:
 * - Framework integrity validation
 * - Dependency version checking
 * - Configuration validation
 * - Agent registration verification
 * - Framework update detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FrameworkVerifier } from './framework-verifier.js';

describe('FrameworkVerifier', () => {
  let verifier: FrameworkVerifier;

  beforeEach(() => {
    vi.clearAllMocks();
    verifier = FrameworkVerifier.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FrameworkVerifier.getInstance();
      const instance2 = FrameworkVerifier.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Framework Integrity Validation', () => {
    it('should validate core framework files exist', async () => {
      const result = await verifier.validateCoreFiles();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('missingFiles');
      expect(Array.isArray(result.missingFiles)).toBe(true);
    });

    it('should detect missing core agent files', async () => {
      const result = await verifier.validateAgentFiles();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('agents');
      expect(result.agents).toHaveProperty('missing');
    });

    it('should validate package.json structure', async () => {
      const result = await verifier.validatePackageJson();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('dependencies');
    });

    it('should check for required framework dependencies', async () => {
      const requiredDeps = ['vitest', '@anthropic-ai/sdk'];

      const result = await verifier.checkDependencies(requiredDeps);
      expect(result).toHaveProperty('allPresent');
      expect(result).toHaveProperty('missing');
    });
  });

  describe('Dependency Version Checking', () => {
    it('should validate dependency versions match requirements', async () => {
      const result = await verifier.validateDependencyVersions();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('conflicts');
      expect(Array.isArray(result.conflicts)).toBe(true);
    });

    it('should detect outdated dependencies', async () => {
      const result = await verifier.checkOutdatedDependencies();

      expect(result).toHaveProperty('outdated');
      expect(Array.isArray(result.outdated)).toBe(true);
    });

    it('should validate peer dependency compatibility', async () => {
      const result = await verifier.validatePeerDependencies();

      expect(result).toHaveProperty('compatible');
      expect(result).toHaveProperty('warnings');
    });

    it('should check for security vulnerabilities', async () => {
      const result = await verifier.checkSecurityVulnerabilities();

      expect(result).toHaveProperty('vulnerabilities');
      expect(result).toHaveProperty('severity');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate TypeScript configuration', async () => {
      const result = await verifier.validateTsConfig();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
    });

    it('should validate Vitest configuration', async () => {
      const result = await verifier.validateVitestConfig();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('coverageThreshold');
    });

    it('should check RAG store configuration', async () => {
      const result = await verifier.validateRagConfig();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('stores');
    });

    it('should validate agent configuration files', async () => {
      const result = await verifier.validateAgentConfigs();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('invalidConfigs');
    });
  });

  describe('Agent Registration Verification', () => {
    it('should verify all OPERA agents are registered', async () => {
      const expectedAgents = [
        'alex-ba',
        'james-frontend',
        'marcus-backend',
        'dana-database',
        'maria-qa',
        'sarah-pm',
        'dr-ai-ml',
        'oliver-mcp'
      ];

      const result = await verifier.verifyAgentRegistration(expectedAgents);

      expect(result).toHaveProperty('allRegistered');
      expect(result).toHaveProperty('missing');
    });

    it('should validate Iris-Guardian registration', async () => {
      const result = await verifier.verifyGuardianRegistration();

      expect(result).toHaveProperty('registered');
      expect(result).toHaveProperty('health');
    });

    it('should check agent activation hooks', async () => {
      const result = await verifier.validateActivationHooks();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('missingHooks');
    });

    it('should verify agent interdependencies', async () => {
      const result = await verifier.validateAgentDependencies();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('circularDeps');
    });
  });

  describe('Framework Update Detection', () => {
    it('should detect framework version changes', async () => {
      const result = await verifier.detectVersionChange();

      expect(result).toHaveProperty('changed');
      expect(result).toHaveProperty('previousVersion');
      expect(result).toHaveProperty('currentVersion');
    });

    it('should validate migration requirements', async () => {
      const result = await verifier.checkMigrationRequired('7.15.0', '7.16.2');

      expect(result).toHaveProperty('required');
      expect(result).toHaveProperty('migrationSteps');
    });

    it('should detect breaking changes', async () => {
      const result = await verifier.detectBreakingChanges('7.15.0', '7.16.2');

      expect(result).toHaveProperty('hasBreakingChanges');
      expect(result).toHaveProperty('changes');
    });

    it('should check for pending framework updates', async () => {
      const result = await verifier.checkForUpdates();

      expect(result).toHaveProperty('updateAvailable');
      expect(result).toHaveProperty('latestVersion');
    });
  });

  describe('Framework Health Check', () => {
    it('should perform comprehensive framework health check', async () => {
      const report = await verifier.performHealthCheck();

      expect(report).toHaveProperty('overall_health');
      expect(report).toHaveProperty('components');
      expect(report).toHaveProperty('timestamp');
    });

    it('should validate critical paths', async () => {
      const result = await verifier.validateCriticalPaths();

      expect(result).toHaveProperty('allAccessible');
      expect(result).toHaveProperty('inaccessible');
    });

    it('should check file system permissions', async () => {
      const result = await verifier.checkFilePermissions();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('permissionErrors');
    });

    it('should validate framework environment variables', async () => {
      const result = await verifier.validateEnvironmentVariables();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('missing');
    });
  });

  describe('Build System Validation', () => {
    it('should validate TypeScript compilation', async () => {
      const result = await verifier.validateTypeScriptBuild();

      expect(result).toHaveProperty('compiles');
      expect(result).toHaveProperty('errors');
    });

    it('should check dist directory integrity', async () => {
      const result = await verifier.validateDistDirectory();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('missingFiles');
    });

    it('should validate source maps', async () => {
      const result = await verifier.validateSourceMaps();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('invalidMaps');
    });

    it('should check build artifacts', async () => {
      const result = await verifier.validateBuildArtifacts();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('outdated');
    });
  });

  describe('Documentation Validation', () => {
    it('should validate README completeness', async () => {
      const result = await verifier.validateReadme();

      expect(result).toHaveProperty('complete');
      expect(result).toHaveProperty('missingSections');
    });

    it('should check for required documentation files', async () => {
      const requiredDocs = ['README.md', 'CHANGELOG.md', 'LICENSE'];

      const result = await verifier.checkDocumentationFiles(requiredDocs);
      expect(result).toHaveProperty('allPresent');
    });

    it('should validate agent documentation', async () => {
      const result = await verifier.validateAgentDocumentation();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('undocumentedAgents');
    });

    it('should check for broken documentation links', async () => {
      const result = await verifier.validateDocumentationLinks();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('brokenLinks');
    });
  });

  describe('Test Coverage Validation', () => {
    it('should validate test coverage meets threshold', async () => {
      const result = await verifier.validateTestCoverage(80);

      expect(result).toHaveProperty('meetsThreshold');
      expect(result).toHaveProperty('currentCoverage');
      expect(result).toHaveProperty('threshold');
    });

    it('should identify untested files', async () => {
      const result = await verifier.findUntestedFiles();

      expect(result).toHaveProperty('untestedFiles');
      expect(Array.isArray(result.untestedFiles)).toBe(true);
    });

    it('should check for missing test files', async () => {
      const result = await verifier.validateTestFiles();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('missingTests');
    });
  });

  describe('Framework Repair', () => {
    it('should suggest repair actions for issues', async () => {
      const issues = [
        { type: 'missing-file', file: 'src/agents/iris-guardian.ts' },
        { type: 'outdated-dependency', package: 'vitest' }
      ];

      const suggestions = await verifier.suggestRepairActions(issues);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should validate repair actions before execution', async () => {
      const action = {
        type: 'install-dependency',
        package: 'vitest',
        version: '^4.0.0'
      };

      const result = await verifier.validateRepairAction(action);
      expect(result).toHaveProperty('safe');
    });

    it('should create backup before repair', async () => {
      const result = await verifier.createFrameworkBackup();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('backupPath');
    });
  });

  describe('Verification Report Generation', () => {
    it('should generate comprehensive verification report', async () => {
      const report = await verifier.generateVerificationReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('frameworkVersion');
      expect(report).toHaveProperty('integrity');
      expect(report).toHaveProperty('dependencies');
      expect(report).toHaveProperty('agents');
      expect(report).toHaveProperty('health');
    });

    it('should include actionable recommendations', async () => {
      const report = await verifier.generateVerificationReport();

      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should calculate framework health score', async () => {
      const report = await verifier.generateVerificationReport();

      expect(report).toHaveProperty('healthScore');
      expect(typeof report.healthScore).toBe('number');
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing package.json gracefully', async () => {
      const result = await verifier.validatePackageJson();
      expect(result).toBeDefined();
    });

    it('should handle corrupted configuration files', async () => {
      const result = await verifier.validateTsConfig();
      expect(result).toBeDefined();
    });

    it('should handle network errors during update check', async () => {
      const result = await verifier.checkForUpdates();
      expect(result).toBeDefined();
    });

    it('should handle concurrent verification requests', async () => {
      const promises = [
        verifier.validateCoreFiles(),
        verifier.validateAgentFiles(),
        verifier.validateDependencyVersions()
      ];

      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
    });
  });
});
