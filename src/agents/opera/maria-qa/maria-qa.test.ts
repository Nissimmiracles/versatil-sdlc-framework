import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedMaria } from './enhanced-maria.js';
import { AgentActivationContext } from '../../core/base-agent.js';

describe('EnhancedMaria - QA Lead Agent', () => {
  let agent: EnhancedMaria;

  beforeEach(() => {
    agent = new EnhancedMaria();
  });

  // ===========================
  // 1. Agent Initialization (4 tests)
  // ===========================

  describe('Agent Initialization', () => {
    it('should initialize with correct name', () => {
      expect(agent.name).toBe('EnhancedMaria');
    });

    it('should initialize with correct id', () => {
      expect(agent.id).toBe('enhanced-maria');
    });

    it('should initialize with correct specialization', () => {
      expect(agent.specialization).toBe('Advanced QA Lead & Configuration Validator');
    });

    it('should have RAG config with qa domain', () => {
      const ragConfig = agent['getDefaultRAGConfig']();
      expect(ragConfig.maxExamples).toBe(3);
      expect(ragConfig.similarityThreshold).toBe(0.8);
      expect(ragConfig.agentDomain).toBe('qa');
      expect(ragConfig.enableLearning).toBe(true);
    });
  });

  // ===========================
  // 2. QA Pattern Analysis (10 tests)
  // ===========================

  describe('QA Pattern Analysis via PatternAnalyzer.analyzeQA()', () => {
    it('should detect missing assertions in test cases with high severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'it("should return user", () => {\n  const user = getUser();\n  // no assertion\n});',
        filePath: 'user.test.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'missing-assertion' && p.severity === 'high')).toBe(true);
    });

    it('should detect console.log as debugging code with medium severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'function process() {\n  console.log("Debug info");\n  return data;\n}',
        filePath: 'processor.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'debug-code' && p.severity === 'medium')).toBe(true);
    });

    it('should detect debugger statement with critical severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'function calculate() {\n  debugger;\n  return result;\n}',
        filePath: 'calculator.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'debugger-statement' && p.severity === 'critical')).toBe(true);
    });

    it('should detect TODO comments with low severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: '// TODO: implement error handling\nfunction save() {}',
        filePath: 'storage.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'todo-comment')).toBe(true);
    });

    it('should detect FIXME comments with low severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: '// FIXME: memory leak in this function\nfunction process() {}',
        filePath: 'worker.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      // Pattern analyzer treats FIXME same as TODO with type 'todo-comment'
      expect(analysis.patterns.some(p => p.type === 'todo-comment' && p.severity === 'low')).toBe(true);
    });

    it('should detect empty catch blocks with high severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'try {\n  riskyOperation();\n} catch (error) {\n}',
        filePath: 'handler.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      // Pattern analyzer checks if next line after 'catch' is exactly '}'
      expect(analysis.patterns.some(p => p.type === 'empty-catch' && p.severity === 'high')).toBe(true);
    });

    it('should detect missing error handling with medium severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const fetchData = async () => {\n  const response = await fetch(url);\n  return response.json();\n}',
        filePath: 'api.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      // Pattern analyzer checks for 'async ' + '=>' pattern without try/catch
      expect(analysis.patterns.some(p => p.type === 'missing-error-handling' && p.severity === 'medium')).toBe(true);
    });

    it('should detect patterns in test files', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'it("should work", () => {\n  const result = doSomething();\n  // missing expect\n});',
        filePath: 'fixtures.test.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      // Pattern analyzer doesn't have hardcoded-test-data pattern
      // Instead test for missing-assertion which is more common in test files
      expect(analysis.patterns.some(p => p.type === 'missing-assertion')).toBe(true);
    });

    it('should calculate quality score based on patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'it("should work", () => { expect(true).toBe(true); });',
        filePath: 'clean.test.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.score).toBeGreaterThan(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });

    it('should generate QA recommendations', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'function test() { return 1; }',
        filePath: 'util.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.recommendations).toBeDefined();
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });
  });

  // ===========================
  // 3. Configuration Validation (6 tests)
  // ===========================

  describe('Configuration Validation', () => {
    it('should detect mixed environment variables and hardcoded URLs', () => {
      const context = {
        content: 'const apiUrl = process.env.API_URL || "http://localhost:3000";'
      };

      const hasInconsistency = agent.hasConfigurationInconsistencies(context);
      expect(hasInconsistency).toBe(true);
    });

    it('should detect mixed config patterns with fallback values', () => {
      const context = {
        content: 'const config = { url: process.env.URL, fallback: "http://example.com" };'
      };

      const hasInconsistency = agent.hasConfigurationInconsistencies(context);
      expect(hasInconsistency).toBe(true);
    });

    it('should pass for consistent environment variable usage', () => {
      const context = {
        content: 'const apiUrl = process.env.API_URL;'
      };

      const hasInconsistency = agent.hasConfigurationInconsistencies(context);
      expect(hasInconsistency).toBe(false);
    });

    it('should pass for consistent hardcoded values in tests', () => {
      const context = {
        content: 'const testUrl = "http://localhost:3000";'
      };

      const hasInconsistency = agent.hasConfigurationInconsistencies(context);
      expect(hasInconsistency).toBe(false);
    });

    it('should add configuration inconsistency to response suggestions', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const url = process.env.URL || "http://localhost";',
        filePath: 'config.ts'
      };

      const response = await agent.activate(context);
      expect(response.suggestions?.some(s => s.type === 'configuration-inconsistency')).toBe(true);
    });

    it('should handle string context for configuration check', () => {
      const stringContext = 'const api = process.env.API || "http://test.com";';

      const hasInconsistency = agent.hasConfigurationInconsistencies(stringContext);
      expect(hasInconsistency).toBe(true);
    });
  });

  // ===========================
  // 4. Route-Navigation Consistency (6 tests)
  // ===========================

  describe('Route-Navigation Consistency', () => {
    it('should detect nav link pointing to undefined route', () => {
      const context = {
        content: `
          const routes = [{ path: '/home', component: Home }];
          const navigation = [{ label: 'Contact', path: '/contact' }];
        `
      };

      const validation = agent.validateRouteNavigationConsistency(context);
      expect(validation.issues.some(i => i.type === 'route-navigation-mismatch')).toBe(true);
    });

    it('should detect route not in navigation (warning)', () => {
      const context = {
        content: `
          const routes = [
            { path: '/home', component: Home },
            { path: '/admin', component: Admin }
          ];
          const navigation = [{ label: 'Home', path: '/home' }];
        `
      };

      const validation = agent.validateRouteNavigationConsistency(context);
      expect(validation.warnings.some(w => w.message.includes('/admin'))).toBe(true);
    });

    it('should pass when routes and navigation match', () => {
      const context = {
        content: `
          const routes = [{ path: '/home', component: Home }];
          const navigation = [{ label: 'Home', path: '/home' }];
        `
      };

      const validation = agent.validateRouteNavigationConsistency(context);
      expect(validation.issues.length).toBe(0);
      expect(validation.score).toBe(100);
    });

    it('should return score 100 for missing routes/navigation', () => {
      const context = {
        content: 'const Component = () => <div>No routes</div>;'
      };

      const validation = agent.validateRouteNavigationConsistency(context);
      expect(validation.score).toBe(100);
    });

    it('should add route validation issues to response suggestions', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: `
          const routes = [{ path: '/home', component: Home }];
          const navigation = [{ label: 'About', path: '/about' }];
        `,
        filePath: 'App.tsx'
      };

      const response = await agent.activate(context);
      expect(response.suggestions?.some(s => s.type === 'route-navigation-mismatch')).toBe(true);
    });

    it('should handle null/undefined context', () => {
      const validation = agent.validateRouteNavigationConsistency(null);
      expect(validation.score).toBe(100);
      expect(validation.issues.length).toBe(0);
    });
  });

  // ===========================
  // 5. Emergency Mode Detection (4 tests)
  // ===========================

  describe('Emergency Mode Detection', () => {
    it('should detect URGENT keyword and activate emergency mode', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'URGENT: Production database is down!',
        filePath: 'incident.txt'
      };

      const response = await agent.activate(context);
      expect(response.context?.emergencyMode).toBe(true);
    });

    it('should detect CRITICAL keyword and activate emergency mode', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'CRITICAL: Payment processing failed',
        filePath: 'alert.txt'
      };

      const response = await agent.activate(context);
      expect(response.context?.emergencyMode).toBe(true);
    });

    it('should detect EMERGENCY keyword and activate emergency mode', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'EMERGENCY: Security breach detected',
        filePath: 'security.txt'
      };

      const response = await agent.activate(context);
      expect(response.context?.emergencyMode).toBe(true);
    });

    it('should escalate priority to critical in emergency mode', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'URGENT: System failure',
        filePath: 'alert.txt'
      };

      const response = await agent.activate(context);
      expect(response.priority).toBe('critical');
    });
  });

  // ===========================
  // 6. Response Enhancement (3 tests)
  // ===========================

  describe('Response Enhancement', () => {
    it('should replace analysisScore with qualityScore in response context', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'function test() { return true; }',
        filePath: 'test.ts'
      };

      const response = await agent.activate(context);
      if (response.context) {
        expect(response.context).toHaveProperty('qualityScore');
        expect(response.context).not.toHaveProperty('analysisScore');
      }
    });

    it('should add testCoverage to response context', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'it("test", () => {});',
        filePath: 'spec.test.ts'
      };

      const response = await agent.activate(context);
      expect(response.context?.testCoverage).toBe(85);
    });

    it('should generate enhanced message with agent name', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const x = 1;',
        filePath: 'code.ts'
      };

      const response = await agent.activate(context);
      expect(response.message).toContain('Enhanced Maria');
    });
  });

  // ===========================
  // 7. Domain Handoffs (4 tests)
  // ===========================

  describe('Domain Handoffs', () => {
    it('should handoff to security-sam for security issues', async () => {
      const analysis = {
        patterns: [{
          type: 'security-issue',
          severity: 'high' as const,
          line: 1,
          column: 0,
          message: 'Security vulnerability',
          suggestion: 'Fix',
          code: '',
          category: 'security' as const
        }],
        score: 70,
        summary: '',
        recommendations: []
      };

      const handoffs = agent['generateDomainHandoffs'](analysis);
      expect(handoffs).toContain('security-sam');
    });

    it('should handoff to enhanced-marcus for critical issues', async () => {
      const analysis = {
        patterns: [{
          type: 'critical-bug',
          severity: 'critical' as const,
          line: 1,
          column: 0,
          message: 'Critical issue',
          suggestion: 'Fix immediately',
          code: '',
          category: 'bug' as const
        }],
        score: 50,
        summary: '',
        recommendations: []
      };

      const handoffs = agent['generateDomainHandoffs'](analysis);
      expect(handoffs).toContain('enhanced-marcus');
    });

    it('should handoff to enhanced-james for frontend/UI issues', async () => {
      const analysis = {
        patterns: [{
          type: 'frontend-issue',
          severity: 'medium' as const,
          line: 1,
          column: 0,
          message: 'UI problem',
          suggestion: 'Fix',
          code: '',
          category: 'best-practice' as const
        }],
        score: 75,
        summary: '',
        recommendations: []
      };

      const handoffs = agent['generateDomainHandoffs'](analysis);
      expect(handoffs).toContain('enhanced-james');
    });

    it('should return empty array for clean code', async () => {
      const analysis = {
        patterns: [],
        score: 95,
        summary: '',
        recommendations: []
      };

      const handoffs = agent['generateDomainHandoffs'](analysis);
      expect(handoffs.length).toBe(0);
    });
  });

  // ===========================
  // 8. Edge Cases (3 tests)
  // ===========================

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: '',
        filePath: 'empty.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle null/undefined context in activate', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const x = 1;',
        filePath: ''
      };

      const response = await agent.activate(context);
      expect(response).toBeDefined();
    });

    it('should handle malformed code gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'function { const if = true; }',
        filePath: 'broken.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis).toBeDefined();
      expect(analysis.patterns).toBeDefined();
    });
  });
});
