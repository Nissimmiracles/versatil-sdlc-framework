/** Real local router contracts with executor doubles. Availability is not agent authorization. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const doubles = vi.hoisted(() => ({ playwright: vi.fn(), listIssues: vi.fn(), initialize: vi.fn(), destroy: vi.fn() }));
vi.mock('../../src/mcp/playwright-mcp-executor.js', () => ({ PlaywrightMCPExecutor: class { executePlaywrightMCP = doubles.playwright; } }));
vi.mock('../../src/mcp/github-mcp-client.js', () => ({ getGitHubMCPClient: () => ({ listIssues: doubles.listIssues, initialize: doubles.initialize, destroy: doubles.destroy }) }));
vi.mock('../../src/mcp/exa-search-mcp-client.js', () => ({ getExaSearchMCPClient: () => ({ initialize: doubles.initialize, destroy: doubles.destroy }) }));
vi.mock('../../src/mcp/gitmcp-executor.js', () => ({ getGitMCPExecutor: () => ({ initialize: doubles.initialize, destroy: doubles.destroy }) }));
import { MCPToolRouter } from '../../src/mcp/mcp-tool-router.js';
beforeEach(() => { vi.resetAllMocks(); doubles.initialize.mockResolvedValue(undefined); doubles.destroy.mockResolvedValue(undefined); });
describe('MCP router integration with isolated executors', () => {
  it('lists locally registered routes without claiming credentials or agent permission', () => {
    const router = new MCPToolRouter();
    expect(router.getAvailableTools()).toEqual(['Playwright', 'Chrome', 'GitHub', 'Exa', 'GitMCP', 'Shadcn']);
    expect(router.isToolAvailable('GitHub')).toBe(true); expect(router.isToolAvailable('Unregistered')).toBe(false);
    expect(doubles.initialize).not.toHaveBeenCalled(); expect(doubles.listIssues).not.toHaveBeenCalled();
    // This method accepts no agent identity: no access verdict follows from its result.
  });
  it('initializes the configured local clients and propagates initialization rejection', async () => {
    const router = new MCPToolRouter(); await router.initialize(); expect(doubles.initialize).toHaveBeenCalledTimes(3);
    doubles.initialize.mockRejectedValue(new Error('fixture unavailable'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try { await expect(new MCPToolRouter().initialize()).rejects.toThrow('fixture unavailable'); } finally { log.mockRestore(); }
  });
  it('forwards a Playwright request and preserves agent attribution in the completion event', async () => {
    doubles.playwright.mockResolvedValue({ success: true, data: { screenshot: 'fixture image' } });
    const router = new MCPToolRouter(); const complete = vi.fn(); router.on('tool-call-complete', complete);
    const request = { tool: 'Playwright', action: 'screenshot', params: { selector: '#fixture' }, agentId: 'james-frontend' };
    const response = await router.handleToolCall(request);
    expect(doubles.playwright).toHaveBeenCalledWith('screenshot', { selector: '#fixture' });
    expect(response).toMatchObject({ success: true, data: { screenshot: 'fixture image' }, tool: 'Playwright', action: 'screenshot' });
    expect(complete).toHaveBeenCalledWith({ request, response, agentId: 'james-frontend' });
    expect(router.getCallHistory()).toEqual([request]); expect(router.getStats()).toMatchObject({ totalCalls: 1, successfulCalls: 1, callsByTool: { Playwright: 1 } });
  });
  it('uses the supported GitHub list_issues client method with exact repository scope', async () => {
    doubles.listIssues.mockResolvedValue({ success: true, data: [{ number: 7 }] });
    const response = await new MCPToolRouter().handleToolCall({ tool: 'GitHub', action: 'list_issues', params: { owner: 'fixture-owner', repo: 'fixture-repo', options: { state: 'open' } }, agentId: 'sarah-pm' });
    expect(doubles.listIssues).toHaveBeenCalledWith('fixture-owner', 'fixture-repo', { state: 'open' });
    expect(response).toMatchObject({ success: true, data: [{ number: 7 }] });
  });
  it('keeps executor refusal visible instead of equating availability with success', async () => {
    doubles.playwright.mockResolvedValue({ success: false, error: 'fixture access denied' });
    const router = new MCPToolRouter(); expect(router.isToolAvailable('Playwright')).toBe(true);
    const response = await router.handleToolCall({ tool: 'Playwright', action: 'screenshot', params: {}, agentId: 'unknown-fixture' });
    expect(response).toMatchObject({ success: false, error: 'fixture access denied' });
    expect(router.getStats()).toMatchObject({ failedCalls: 1, successfulCalls: 0 });
  });
  it('returns failure for an unsupported tool without calling any executor', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await new MCPToolRouter().handleToolCall({ tool: 'Unregistered', action: 'read', params: {} });
      expect(response).toMatchObject({ success: false, error: 'Unknown MCP tool: Unregistered' });
      expect(doubles.playwright).not.toHaveBeenCalled(); expect(doubles.listIssues).not.toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });
});
