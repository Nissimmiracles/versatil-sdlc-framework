/** Compiled export/unsupported-input contract, without provider or credential access. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MCPToolManager, mcpToolManager } from '../../dist/mcp-integration.js';

test('compiled integration exposes the actual manager and singleton', () => {
  assert.equal(typeof MCPToolManager, 'function');
  assert(mcpToolManager instanceof MCPToolManager);
  assert.equal(typeof new MCPToolManager().executeMCPTool, 'function');
});

test('unsupported tools fail without fallback or provider execution', async () => {
  const manager = new MCPToolManager();
  let providerCalls = 0;
  manager.callMCPFunction = async () => { providerCalls++; throw new Error('Unexpected provider execution'); };
  const result = await manager.executeMCPTool('__unsupported_ci_fixture__', {
    trigger: { type: 'user_request', agent: 'CI fixture' },
  });
  assert.equal(result.success, false);
  assert.equal(result.tool, '__unsupported_ci_fixture__');
  assert.equal(result.agent, 'CI fixture');
  assert.match(result.error, /Unknown MCP tool/);
  assert(result.timestamp instanceof Date);
  assert.equal(providerCalls, 0);
});
