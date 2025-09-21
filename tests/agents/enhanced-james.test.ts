/**
 * Tests for Enhanced James - Advanced Frontend Specialist
 */

import { EnhancedJames } from '../../src/agents/enhanced-james';
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

describe('Enhanced James Frontend Agent', () => {
  let james: EnhancedJames;
  let mockContext: AgentActivationContext;

  beforeEach(() => {
    james = new EnhancedJames();
    mockContext = {
      content: 'test content',
      filePath: '/test/components/Button.tsx',
      userRequest: 'analyze component'
    };
  });

  describe('Initialization', () => {
    it('should initialize Enhanced James correctly', () => {
      expect(james).toBeInstanceOf(EnhancedJames);
      expect(james['id']).toBe('enhanced-james');
      expect(james['specialization']).toBe('Advanced Frontend Specialist & Navigation Validator');
    });
  });

  describe('Agent Activation', () => {
    it('should activate successfully with valid context', async () => {
      const response = await james.activate(mockContext);

      expect(response).toMatchObject({
        agentId: 'enhanced-james',
        message: expect.stringContaining('Enhanced James'),
        suggestions: expect.any(Array),
        priority: expect.any(String),
        handoffTo: expect.any(Array),
        context: expect.objectContaining({
          frontendHealth: expect.any(Number)
        })
      });
    });

    it('should handle React component analysis', async () => {
      const reactContext = {
        ...mockContext,
        content: `
          import React, { useState } from 'react';

          const Button = ({ onClick, children }) => {
            const [loading, setLoading] = useState(false);

            return (
              <button onClick={onClick} disabled={loading}>
                {loading ? 'Loading...' : children}
              </button>
            );
          };

          export default Button;
        `,
        filePath: '/src/components/Button.tsx'
      };

      const response = await james.activate(reactContext);

      expect(response.agentId).toBe('enhanced-james');
      expect(response.context.frontendHealth).toBeDefined();
    });

    it('should detect debugging code in components', async () => {
      const debugContext = {
        ...mockContext,
        content: `
          import React from 'react';

          const Navigation = () => {
            console.log('🧠 Navigation test - debugging active');
            debugger; // Remove this!

            return (
              <nav>
                <a href="/home">Home</a>
                <a href="/about">About</a>
              </nav>
            );
          };

          export default Navigation;
        `,
        filePath: '/src/components/Navigation.tsx'
      };

      const response = await james.activate(debugContext);

      expect(response.priority).toBe('critical');
      expect(response.message).toContain('Critical Issues Detected');
    });
  });

  describe('Route-Navigation Validation', () => {
    it('should validate navigation integrity', async () => {
      const result = await james['validateNavigationIntegrity'](mockContext);

      expect(result).toMatchObject({
        score: expect.any(Number),
        issues: expect.any(Array),
        warnings: expect.any(Array)
      });
    });

    it('should detect route-navigation mismatches', async () => {
      const routeContext = {
        ...mockContext,
        content: `
          const routes = [
            { path: '/dashboard', component: Dashboard },
            { path: '/profile', component: Profile },
            { path: '/settings', component: Settings }
          ];

          const navigation = [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Profile', path: '/profile' },
            { label: 'Settings', path: '/config' } // Mismatch!
          ];
        `
      };

      const response = await james.activate(routeContext);

      // Should detect the route mismatch
      expect(response.suggestions.length).toBeGreaterThan(0);
      const routeIssue = response.suggestions.find(s =>
        s.message.toLowerCase().includes('route') || s.message.toLowerCase().includes('navigation')
      );
      expect(routeIssue).toBeDefined();
    });

    it('should check route consistency', async () => {
      const result = await james['checkRouteConsistency'](mockContext);

      expect(result).toMatchObject({
        score: expect.any(Number),
        issues: expect.any(Array)
      });
    });

    it('should validate context flow', async () => {
      const result = await james['validateContextFlow'](mockContext);

      expect(result).toMatchObject({
        score: expect.any(Number),
        issues: expect.any(Array)
      });
    });
  });

  describe('Frontend Validation', () => {
    it('should run frontend-specific validation', async () => {
      const result = await james['runFrontendValidation'](mockContext);

      expect(result).toMatchObject({
        score: expect.any(Number),
        issues: expect.any(Array),
        warnings: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });

    it('should detect accessibility issues', async () => {
      const accessibilityContext = {
        ...mockContext,
        content: `
          <div>
            <img src="image.jpg" />
            <button>Click me</button>
            <input type="text" />
          </div>
        `
      };

      const result = await james['runFrontendValidation'](accessibilityContext);

      expect(result.issues).toBeDefined();
    });

    it('should detect performance issues', async () => {
      const performanceContext = {
        ...mockContext,
        content: `
          import React from 'react';

          const HeavyComponent = () => {
            const expensiveCalculation = () => {
              let result = 0;
              for(let i = 0; i < 1000000; i++) {
                result += Math.random();
              }
              return result;
            };

            return <div>{expensiveCalculation()}</div>;
          };
        `
      };

      const result = await james['runFrontendValidation'](performanceContext);

      expect(result.issues).toBeDefined();
    });
  });

  describe('Enhanced Reporting', () => {
    it('should generate enhanced frontend report', () => {
      const mockIssues = [
        { type: 'accessibility', severity: 'high' as const, message: 'Missing alt text', file: 'test.tsx' },
        { type: 'performance', severity: 'medium' as const, message: 'Heavy calculation', file: 'test.tsx' }
      ];

      const mockValidation = {
        score: 75,
        issues: [],
        warnings: [],
        recommendations: []
      };

      const report = james['generateEnhancedReport'](mockIssues, mockValidation);

      expect(report).toContain('Enhanced James');
      expect(report).toContain('Frontend Analysis');
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(100);
    });
  });

  describe('Actionable Recommendations', () => {
    it('should generate actionable recommendations', () => {
      const mockIssues = [
        { type: 'route-mismatch', severity: 'high' as const, message: 'Route mismatch', file: 'routes.ts' },
        { type: 'accessibility', severity: 'medium' as const, message: 'Missing alt text', file: 'component.tsx' }
      ];

      const recommendations = james['generateActionableRecommendations'](mockIssues);

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            priority: expect.any(String),
            message: expect.any(String)
          })
        ])
      );
    });

    it('should prioritize route issues', () => {
      const routeIssues = [
        { type: 'route-mismatch', severity: 'critical' as const, message: 'Critical route issue', file: 'routes.ts' }
      ];

      const recommendations = james['generateActionableRecommendations'](routeIssues);

      const routeRecommendation = recommendations.find(r =>
        r.message.toLowerCase().includes('route')
      );
      expect(routeRecommendation).toBeDefined();
      expect(routeRecommendation?.priority).toBe('critical');
    });
  });

  describe('Priority Calculation', () => {
    it('should calculate priority based on issue severity', () => {
      const criticalIssues = [
        { type: 'debugging-code', severity: 'critical' as const, message: 'Debug code', file: 'test.tsx' }
      ];

      const priority = james['calculatePriority'](criticalIssues);
      expect(priority).toBe('critical');
    });

    it('should handle multiple high-priority issues', () => {
      const highIssues = [
        { type: 'route-mismatch', severity: 'high' as const, message: 'Route issue 1', file: 'test.tsx' },
        { type: 'accessibility', severity: 'high' as const, message: 'Accessibility issue', file: 'test.tsx' },
        { type: 'performance', severity: 'high' as const, message: 'Performance issue', file: 'test.tsx' }
      ];

      const priority = james['calculatePriority'](highIssues);
      expect(priority).toBe('high');
    });

    it('should default to medium priority for mixed issues', () => {
      const mixedIssues = [
        { type: 'style', severity: 'low' as const, message: 'Style issue', file: 'test.tsx' },
        { type: 'warning', severity: 'medium' as const, message: 'Warning', file: 'test.tsx' }
      ];

      const priority = james['calculatePriority'](mixedIssues);
      expect(['low', 'medium']).toContain(priority);
    });
  });

  describe('Agent Handoff Determination', () => {
    it('should determine correct handoffs', () => {
      const mockIssues = [
        { type: 'security-risk', severity: 'high' as const, message: 'Security issue', file: 'test.tsx' },
        { type: 'api-integration', severity: 'medium' as const, message: 'API issue', file: 'test.tsx' }
      ];

      const handoffs = james['determineHandoffs'](mockIssues);

      expect(handoffs).toEqual(
        expect.arrayContaining([
          expect.any(String)
        ])
      );
    });

    it('should include backend agent for API issues', () => {
      const apiIssues = [
        { type: 'api-integration', severity: 'high' as const, message: 'API integration problem', file: 'api.tsx' }
      ];

      const handoffs = james['determineHandoffs'](apiIssues);
      expect(handoffs).toContain('enhanced-marcus');
    });

    it('should include security agent for security issues', () => {
      const securityIssues = [
        { type: 'security-risk', severity: 'high' as const, message: 'Security vulnerability', file: 'auth.tsx' }
      ];

      const handoffs = james['determineHandoffs'](securityIssues);
      expect(handoffs).toContain('security-sam');
    });
  });

  describe('Context Analysis', () => {
    it('should analyze component context', () => {
      const componentContext = {
        ...mockContext,
        content: `
          import React, { useContext } from 'react';
          import { UserContext } from '../context/UserContext';

          const UserProfile = () => {
            const { user } = useContext(UserContext);
            return <div>{user?.name}</div>;
          };
        `
      };

      expect(() => james['validateContextFlow'](componentContext)).not.toThrow();
    });

    it('should handle missing context gracefully', async () => {
      const emptyContext = { ...mockContext, content: undefined };
      const response = await james.activate(emptyContext);

      expect(response.agentId).toBe('enhanced-james');
      expect(response.message).toContain('Enhanced James');
    });
  });

  describe('Framework Detection', () => {
    it('should detect React framework', () => {
      const reactCode = `
        import React from 'react';
        const Component = () => <div>Hello</div>;
      `;

      const isReact = james['detectFramework'](reactCode);
      expect(isReact).toContain('react');
    });

    it('should detect Vue framework', () => {
      const vueCode = `
        <template>
          <div>Hello Vue</div>
        </template>
        <script>
        export default {
          name: 'HelloWorld'
        }
        </script>
      `;

      const isVue = james['detectFramework'](vueCode);
      expect(isVue).toContain('vue');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidContext = {
        content: null,
        filePath: '',
        userRequest: ''
      };

      const response = await james.activate(invalidContext);
      expect(response.agentId).toBe('enhanced-james');
    });

    it('should handle malformed code', async () => {
      const malformedContext = {
        ...mockContext,
        content: 'this is not valid javascript {{{{'
      };

      const response = await james.activate(malformedContext);
      expect(response.agentId).toBe('enhanced-james');
    });
  });
});