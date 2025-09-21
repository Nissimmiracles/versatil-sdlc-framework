/**
 * Tests for Enhanced Maria - Advanced QA Lead with Configuration Validation
 */

import { EnhancedMaria } from '../../src/agents/enhanced-maria';
import { AgentActivationContext } from '../../src/agents/base-agent';

// Mock performance monitor
jest.mock('../../src/analytics/performance-monitor', () => ({
  performanceMonitor: {
    recordAgentExecution: jest.fn(),
    getPerformanceDashboard: jest.fn(() => ({
      agents: [],
      system: { overallHealth: 100 }
    }))
  }
}));

describe('Enhanced Maria QA Agent', () => {
  let maria: EnhancedMaria;
  let mockContext: AgentActivationContext;

  beforeEach(() => {
    maria = new EnhancedMaria();
    mockContext = {
      content: 'test content',
      filePath: '/test/components/Button.tsx',
      userRequest: 'analyze component quality',
      matchedKeywords: ['react', 'component']
    };
  });

  describe('Initialization', () => {
    it('should initialize Enhanced Maria correctly', () => {
      expect(maria).toBeInstanceOf(EnhancedMaria);
      expect(maria['id']).toBe('enhanced-maria');
      expect(maria['specialization']).toBe('Advanced QA Lead & Configuration Validator');
    });

    it('should initialize with config validators', () => {
      expect(maria['configValidators']).toBeDefined();
      expect(maria['configValidators'].length).toBeGreaterThan(0);
    });

    it('should initialize quality metrics', () => {
      expect(maria['qualityMetrics']).toBeDefined();
    });
  });

  describe('Agent Activation', () => {
    it('should activate successfully with valid context', async () => {
      const response = await maria.activate(mockContext);

      expect(response).toMatchObject({
        agentId: 'enhanced-maria',
        message: expect.stringContaining('Enhanced Maria'),
        suggestions: expect.any(Array),
        priority: expect.any(String),
        handoffTo: expect.any(Array),
        context: expect.objectContaining({
          qualityScore: expect.any(Number),
          criticalIssues: expect.any(Number)
        })
      });
    });

    it('should handle emergency mode activation', async () => {
      const emergencyContext = {
        ...mockContext,
        emergency: true,
        content: 'console.log("CRITICAL BUG"); debugger;'
      };

      const response = await maria.activate(emergencyContext);

      expect(response.priority).toBe('critical');
      expect(response.context.emergencyMode).toBe(true);
    });

    it('should handle missing content gracefully', async () => {
      const emptyContext = { ...mockContext, content: undefined };
      const response = await maria.activate(emptyContext);

      expect(response.agentId).toBe('enhanced-maria');
      expect(response.message).toContain('Enhanced Maria');
    });
  });

  describe('Configuration Validation', () => {
    it('should detect debugging code in routes', async () => {
      const debuggingContext = {
        ...mockContext,
        content: `
          const routes = [
            { path: '/home', component: Home },
            { path: '/profile', component: Profile }
          ];
          console.log('🧠 Route Test - debugging active');
          debugger;
        `,
        filePath: '/src/routes/index.js'
      };

      const response = await maria.activate(debuggingContext);

      expect(response.priority).toBe('critical');
      expect(response.message).toContain('Critical Issues Detected');
    });

    it('should detect route-navigation mismatches', async () => {
      const routeContext = {
        ...mockContext,
        content: `
          const routes = [
            { path: '/dashboard', component: Dashboard },
            { path: '/settings', component: Settings }
          ];
          const navigation = [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Profile', path: '/profile' } // Mismatch!
          ];
        `
      };

      const response = await maria.activate(routeContext);
      expect(response.suggestions.length).toBeGreaterThan(0);
    });

    it('should validate configuration consistency', async () => {
      const configContext = {
        ...mockContext,
        content: `
          const config = {
            apiUrl: process.env.API_URL,
            fallback: "http://localhost:3000" // Inconsistent!
          };
        `
      };

      const response = await maria.activate(configContext);
      expect(response.message).toContain('configuration');
    });
  });

  describe('Quality Dashboard Generation', () => {
    it('should generate quality dashboard with scores', () => {
      const mockResults = {
        score: 85,
        issues: [
          { type: 'critical', severity: 'critical' as const, message: 'Critical issue', file: 'test.js' },
          { type: 'high', severity: 'high' as const, message: 'High issue', file: 'test.js' },
          { type: 'medium', severity: 'medium' as const, message: 'Medium issue', file: 'test.js' }
        ],
        warnings: ['Warning 1', 'Warning 2'],
        recommendations: [],
        crossFileAnalysis: {},
        performanceMetrics: {},
        accessibilityIssues: [],
        securityConcerns: [],
        configurationScore: 90
      };

      const dashboard = maria['generateQualityDashboard'](mockResults);

      expect(dashboard).toMatchObject({
        overallScore: expect.any(Number),
        criticalIssues: 1,
        highIssues: 1,
        mediumIssues: 1,
        warnings: 2,
        configurationHealth: 90,
        trend: expect.any(String),
        lastUpdated: expect.any(String)
      });
    });

    it('should calculate quality scores correctly', () => {
      const perfectResults = {
        score: 100,
        issues: [],
        warnings: [],
        recommendations: [],
        crossFileAnalysis: {},
        performanceMetrics: {},
        accessibilityIssues: [],
        securityConcerns: [],
        configurationScore: 100
      };

      const dashboard = maria['generateQualityDashboard'](perfectResults);
      expect(dashboard.overallScore).toBe(100);
    });
  });

  describe('Critical Issues Identification', () => {
    it('should identify and enhance critical issues', () => {
      const mockResults = {
        score: 60,
        issues: [
          { type: 'security-risk', severity: 'critical' as const, message: 'SQL injection vulnerability', file: 'db.js' },
          { type: 'debugging-code', severity: 'high' as const, message: 'Debug code in production', file: 'routes.js' }
        ],
        warnings: [],
        recommendations: [],
        crossFileAnalysis: {},
        performanceMetrics: {},
        accessibilityIssues: [],
        securityConcerns: [],
        configurationScore: 80
      };

      const criticalIssues = maria['identifyCriticalIssues'](mockResults);

      expect(criticalIssues).toHaveLength(2);
      expect(criticalIssues[0]).toMatchObject({
        type: 'security-risk',
        severity: 'critical',
        impact: expect.stringContaining('High'),
        fix: expect.any(String),
        preventionStrategy: expect.any(String)
      });
    });
  });

  describe('Actionable Recommendations', () => {
    it('should generate actionable recommendations for critical issues', () => {
      const mockResults = {
        score: 70,
        issues: [
          { type: 'debugging-code', severity: 'critical' as const, message: 'Debug code', file: 'test.js' }
        ],
        warnings: [],
        recommendations: [],
        crossFileAnalysis: {},
        performanceMetrics: {},
        accessibilityIssues: [],
        securityConcerns: [],
        configurationScore: 80
      };

      const recommendations = maria['generateActionableRecommendations'](mockResults);

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'critical-fix',
            priority: 'critical',
            message: expect.stringContaining('Fix 1 critical')
          })
        ])
      );
    });

    it('should recommend configuration improvements', () => {
      const mockResults = {
        score: 95,
        issues: [],
        warnings: [],
        recommendations: [],
        crossFileAnalysis: {},
        performanceMetrics: {},
        accessibilityIssues: [],
        securityConcerns: [],
        configurationScore: 85 // Below 90 threshold
      };

      const recommendations = maria['generateActionableRecommendations'](mockResults);

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'configuration',
            priority: 'high',
            message: expect.stringContaining('configuration consistency')
          })
        ])
      );
    });
  });

  describe('Agent Handoff Determination', () => {
    it('should determine correct handoffs based on issues', () => {
      const mockResults = {
        score: 75,
        issues: [
          { type: 'security-risk', severity: 'high' as const, message: 'Security issue', file: 'test.js' },
          { type: 'route-mismatch', severity: 'medium' as const, message: 'Route issue', file: 'routes.js' },
          { type: 'api-error', severity: 'high' as const, message: 'API issue', file: 'api.js' }
        ],
        warnings: [],
        recommendations: [],
        crossFileAnalysis: {},
        performanceMetrics: {},
        accessibilityIssues: [],
        securityConcerns: ['Security concern'],
        configurationScore: 80
      };

      const handoffs = maria['determineHandoffs'](mockResults);

      expect(handoffs).toEqual(
        expect.arrayContaining([
          'security-sam',
          'devops-dan',
          'james-frontend',
          'marcus-backend',
          'sarah-pm'
        ])
      );
    });

    it('should include PM for significant issues', () => {
      const mockResults = {
        score: 95,
        issues: [
          { type: 'critical-bug', severity: 'critical' as const, message: 'Critical bug', file: 'test.js' }
        ],
        warnings: [],
        recommendations: [],
        crossFileAnalysis: {},
        performanceMetrics: {},
        accessibilityIssues: [],
        securityConcerns: [],
        configurationScore: 95
      };

      const handoffs = maria['determineHandoffs'](mockResults);
      expect(handoffs).toContain('sarah-pm');
    });
  });

  describe('Fix and Prevention Strategy Generation', () => {
    it('should generate appropriate fixes for known issue types', () => {
      const routeFix = maria['generateFix']({ type: 'route-mismatch', severity: 'medium', message: 'test', file: 'test.js' });
      const debugFix = maria['generateFix']({ type: 'debugging-code', severity: 'high', message: 'test', file: 'test.js' });
      const unknownFix = maria['generateFix']({ type: 'unknown-issue', severity: 'low', message: 'test', file: 'test.js' });

      expect(routeFix).toContain('route configuration');
      expect(debugFix).toContain('debugging code');
      expect(unknownFix).toContain('manually');
    });

    it('should generate prevention strategies', () => {
      const routeStrategy = maria['generatePreventionStrategy']({ type: 'route-mismatch', severity: 'medium', message: 'test', file: 'test.js' });
      const debugStrategy = maria['generatePreventionStrategy']({ type: 'debugging-code', severity: 'high', message: 'test', file: 'test.js' });

      expect(routeStrategy).toContain('CI/CD check');
      expect(debugStrategy).toContain('pre-commit hooks');
    });
  });

  describe('Priority Calculation', () => {
    it('should calculate priority based on critical issues', () => {
      const criticalIssues = [
        { type: 'test', severity: 'critical' as const, message: 'test', file: 'test.js', impact: 'high', fix: 'fix', preventionStrategy: 'prevent' }
      ];

      const priority = maria['calculatePriority'](criticalIssues);
      expect(priority).toBe('critical');
    });

    it('should handle multiple high-priority issues', () => {
      const highIssues = [
        { type: 'test1', severity: 'high' as const, message: 'test1', file: 'test.js', impact: 'high', fix: 'fix', preventionStrategy: 'prevent' },
        { type: 'test2', severity: 'high' as const, message: 'test2', file: 'test.js', impact: 'high', fix: 'fix', preventionStrategy: 'prevent' },
        { type: 'test3', severity: 'high' as const, message: 'test3', file: 'test.js', impact: 'high', fix: 'fix', preventionStrategy: 'prevent' }
      ];

      const priority = maria['calculatePriority'](highIssues);
      expect(priority).toBe('high');
    });
  });

  describe('Configuration Validators', () => {
    it('should have all required validators', () => {
      const validatorNames = maria['configValidators'].map(v => v.constructor.name);

      expect(validatorNames).toEqual(
        expect.arrayContaining([
          'RouteConfigValidator',
          'NavigationValidator',
          'ProfileContextValidator',
          'ProductionCodeValidator',
          'CrossFileValidator'
        ])
      );
    });
  });

  describe('Enhanced Reporting', () => {
    it('should generate comprehensive enhanced report', () => {
      const mockResults = {
        score: 85,
        issues: [
          { type: 'test-issue', severity: 'medium' as const, message: 'Test issue', file: 'test.js' }
        ],
        warnings: ['Test warning'],
        recommendations: [],
        crossFileAnalysis: { 'test.js': 'Test analysis' },
        performanceMetrics: { loadTime: '50ms' },
        accessibilityIssues: ['Missing alt text'],
        securityConcerns: ['Weak password'],
        configurationScore: 90
      };

      const dashboard = maria['generateQualityDashboard'](mockResults);
      const criticalIssues = maria['identifyCriticalIssues'](mockResults);

      const report = maria['generateEnhancedReport'](mockResults, dashboard, criticalIssues);

      expect(report).toContain('Enhanced Maria');
      expect(report).toContain('Quality Dashboard');
      expect(report).toContain('85%');
      expect(report).toContain('Cross-File Analysis');
      expect(report).toContain('Performance Insights');
      expect(report).toContain('Accessibility Issues');
      expect(report).toContain('Security Concerns');
    });
  });
});