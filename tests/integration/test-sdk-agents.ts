/** Local wrapper contracts. SDK, legacy analyses and MCP executors are doubles; no provider proof. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const doubles = vi.hoisted(() => ({
  activate: vi.fn(), configIssue: vi.fn(), dashboard: vi.fn(), navigation: vi.fn(),
  recommendations: vi.fn(), apiValidation: vi.fn(), security: vi.fn(), priority: vi.fn(),
  handoffs: vi.fn(), route: vi.fn(), toolCall: vi.fn(), options: [] as any[],
}));
vi.mock('../../src/agents/sdk/sdk-agent-adapter.js', () => ({ SDKAgentAdapter: class {
  constructor(options: any) { doubles.options.push(options); }
  activate(context: any) { return doubles.activate(context); }
} }));
vi.mock('../../src/agents/opera/maria-qa/enhanced-maria.js', () => ({ EnhancedMaria: class {
  hasConfigurationInconsistencies = doubles.configIssue;
  generateQualityDashboard = doubles.dashboard;
  validateRouteNavigationConsistency = doubles.route;
} }));
vi.mock('../../src/agents/opera/james-frontend/enhanced-james.js', () => ({ EnhancedJames: class {
  validateNavigationIntegrity = doubles.navigation;
  generateActionableRecommendations = doubles.recommendations;
} }));
vi.mock('../../src/agents/opera/james-frontend/sub-agents/ux-excellence-reviewer.js', () => ({ UXExcellenceReviewer: class {} }));
vi.mock('../../src/agents/opera/marcus-backend/enhanced-marcus.js', () => ({ EnhancedMarcus: class {
  validateAPIIntegration = doubles.apiValidation;
  checkAPISecurity = doubles.security;
  calculatePriority = doubles.priority;
  determineHandoffs = doubles.handoffs;
} }));
vi.mock('../../src/mcp/mcp-tool-router.js', () => ({ getMCPToolRouter: () => ({ handleToolCall: doubles.toolCall }) }));
import { MariaSDKAgent } from '../../src/agents/opera/maria-qa/maria-sdk-agent.js';
import { JamesSDKAgent } from '../../src/agents/opera/james-frontend/james-sdk-agent.js';
import { MarcusSDKAgent } from '../../src/agents/opera/marcus-backend/marcus-sdk-agent.js';

beforeEach(() => {
  vi.resetAllMocks(); doubles.options.length = 0;
  doubles.activate.mockImplementation(async () => ({ priority: 'low', suggestions: [], context: { analysisScore: 75 } }));
  doubles.configIssue.mockReturnValue(false);
  doubles.navigation.mockReturnValue({ score: 100, issues: [], warnings: [] });
  doubles.route.mockReturnValue({ score: 100, issues: [], warnings: [] });
});
describe('SDK agent wrappers with isolated collaborators', () => {
  it('passes agent identity and the supplied vector store to the adapter', () => {
    const store = {} as any;
    new MariaSDKAgent(store); new JamesSDKAgent(store); new MarcusSDKAgent(store);
    expect(doubles.options).toEqual(['maria-qa', 'james-frontend', 'marcus-backend'].map(agentId => ({ agentId, vectorStore: store, model: 'sonnet' })));
  });
  it('delegates Maria configuration detection and dashboard without changing inputs', () => {
    const agent = new MariaSDKAgent(); const context = { content: 'configuration fixture' };
    const results = { score: 75 }; const dashboard = { overallScore: 75 };
    doubles.configIssue.mockReturnValue(true); doubles.dashboard.mockReturnValue(dashboard);
    expect(agent.hasConfigurationInconsistencies(context)).toBe(true);
    expect(doubles.configIssue).toHaveBeenCalledWith(context);
    expect(agent.generateQualityDashboard(results)).toBe(dashboard);
    expect(doubles.dashboard).toHaveBeenCalledWith(results);
  });
  it('adds Maria-specific configuration suggestions and escalates an emergency', async () => {
    doubles.configIssue.mockReturnValue(true);
    const context = { filePath: 'config.ts', content: 'URGENT', trigger: { type: 'file_change' } } as any;
    const response = await new MariaSDKAgent().activate(context);
    expect(doubles.activate).toHaveBeenCalledWith(context);
    expect(response.priority).toBe('critical');
    expect(response.suggestions).toContainEqual({ type: 'configuration-inconsistency', message: 'Mixed environment variables and hardcoded values detected', priority: 'high', file: 'config.ts' });
    expect(response.context).toMatchObject({ qualityScore: 75, emergencyMode: true });
  });
  it('does not invent a configuration issue for clean Maria content', async () => {
    const response = await new MariaSDKAgent().activate({ content: 'ordinary fixture' } as any);
    expect(response.suggestions).toEqual([]); expect(response.priority).toBe('low');
  });
  it('delegates James navigation and recommendations', () => {
    const agent = new JamesSDKAgent(); const context = { content: 'routes fixture' };
    const result = { score: 40, issues: [{ type: 'route-navigation-mismatch' }], warnings: [] };
    doubles.navigation.mockReturnValue(result); doubles.recommendations.mockReturnValue(['repair route']);
    expect(agent.validateNavigationIntegrity(context)).toBe(result);
    expect(doubles.navigation).toHaveBeenCalledWith(context);
    expect(agent.generateActionableRecommendations(result.issues)).toEqual(['repair route']);
    expect(doubles.recommendations).toHaveBeenCalledWith(result.issues);
  });
  it('adds actual James wrapper navigation context and mapped suggestions', async () => {
    doubles.navigation.mockReturnValue({ score: 40, issues: [{ type: 'route', message: 'missing route', severity: 'high', file: 'App.tsx' }], warnings: [] });
    const response = await new JamesSDKAgent().activate({ content: 'useState(0)' } as any);
    expect(response.context).toMatchObject({ frontendHealth: 75, navigationScore: 40, componentType: 'functional-react' });
    expect(response.suggestions).toContainEqual({ type: 'route', message: 'missing route', priority: 'high', file: 'App.tsx' });
  });
  it('delegates Marcus API, security, priority and handoff decisions', () => {
    const agent = new MarcusSDKAgent(); const context = { content: 'API fixture' }; const issues = [{ severity: 'critical' }];
    const result = { score: 25, issues }; doubles.apiValidation.mockReturnValue(result);
    doubles.security.mockReturnValue(issues); doubles.priority.mockReturnValue('critical'); doubles.handoffs.mockReturnValue(['maria-qa']);
    expect(agent.validateAPIIntegration(context)).toBe(result); expect(doubles.apiValidation).toHaveBeenCalledWith(context);
    expect(agent.checkAPISecurity(context)).toBe(issues); expect(doubles.security).toHaveBeenCalledWith(context);
    expect(agent.calculatePriority(issues)).toBe('critical'); expect(doubles.priority).toHaveBeenCalledWith(issues);
    expect(agent.determineHandoffs(issues)).toEqual(['maria-qa']); expect(doubles.handoffs).toHaveBeenCalledWith(issues);
  });
  it('uses actual Marcus wrapper detection without claiming live API security', async () => {
    doubles.activate.mockResolvedValue({ suggestions: [{ type: 'security', priority: 'critical' }], context: { analysisScore: 75 } });
    const response = await new MarcusSDKAgent().activate({ content: "app.post('/users'); prisma.user" } as any);
    expect(response.context).toMatchObject({ backendHealth: 75, apiType: 'rest', dbType: 'prisma', securityScore: 30 });
  });
  it('forwards Maria E2E routing and propagates the router failure', async () => {
    const failure = { success: false, error: 'executor unavailable' }; doubles.toolCall.mockResolvedValue(failure);
    expect(await new MariaSDKAgent().runE2ETests({ testFile: 'demo.spec.ts' })).toBe(failure);
    expect(doubles.toolCall).toHaveBeenCalledWith({ tool: 'Playwright', action: 'run_tests', params: { testFile: 'demo.spec.ts', testPattern: undefined, headless: true }, agentId: 'maria-qa' });
  });
});
