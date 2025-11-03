# VERSATIL MCP Server - Troubleshooting Guide

**Version**: 6.1.0
**Last Updated**: October 10, 2025

This guide helps you diagnose and resolve common issues with the VERSATIL SDLC Framework MCP server.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Server Startup Issues](#server-startup-issues)
3. [Tool Execution Errors](#tool-execution-errors)
4. [Resource Access Errors](#resource-access-errors)
5. [Prompt Generation Issues](#prompt-generation-issues)
6. [HTTP Server Issues](#http-server-issues)
7. [Claude Desktop Integration](#claude-desktop-integration)
8. [Performance Problems](#performance-problems)
9. [Logging & Debugging](#logging--debugging)
10. [Known Issues & Workarounds](#known-issues--workarounds)

---

## Installation Issues

### Issue: `npm install` fails with dependency errors

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:

1. **Clear npm cache**:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **Use compatible Node.js version**:
```bash
# Check current version
node --version

# Install Node 18 LTS (recommended)
nvm install 18
nvm use 18
npm install
```

3. **Force install** (last resort):
```bash
npm install --legacy-peer-deps
```

### Issue: TypeScript compilation errors during build

**Symptoms**:
```
src/mcp/versatil-mcp-server-v2.ts(42,7): error TS2345
```

**Solutions**:

1. **Verify TypeScript version**:
```bash
npx tsc --version  # Should be >= 5.0.0
npm install -D typescript@latest
```

2. **Clean build**:
```bash
rm -rf dist/
pnpm run build
```

3. **Check for syntax errors**:
```bash
npx tsc --noEmit  # Type-check only, no output
```

---

## Server Startup Issues

### Issue: MCP server exits immediately with no output

**Symptoms**:
- Server starts then exits
- No error messages
- Process exit code 0

**Solutions**:

1. **Check stdio connection**:
```bash
# Test with echo
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  node dist/mcp/versatil-mcp-server-v2.js
```

2. **Enable debug logging**:
```bash
VERSATIL_LOG_LEVEL=debug node dist/mcp/versatil-mcp-server-v2.js
```

3. **Verify build artifacts**:
```bash
ls -la dist/mcp/versatil-mcp-server-v2.js  # Should exist
node -c dist/mcp/versatil-mcp-server-v2.js  # Syntax check
```

### Issue: "Module not found" errors

**Symptoms**:
```
Error: Cannot find module '@modelcontextprotocol/sdk/server/mcp.js'
```

**Solutions**:

1. **Reinstall MCP SDK**:
```bash
npm install @modelcontextprotocol/sdk@latest
```

2. **Check module resolution**:
```bash
node -e "require.resolve('@modelcontextprotocol/sdk/server/mcp.js')"
```

3. **Verify package.json**:
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.19.1"
  }
}
```

### Issue: Agent registry initialization fails

**Symptoms**:
```
Error: Agent registry failed to initialize
AGENT_INITIALIZATION_FAILED
```

**Solutions**:

1. **Check agent files exist**:
```bash
ls -la src/agents/core/agent-registry.ts
ls -la src/agents/opera/enhanced-maria.ts
```

2. **Verify agent imports**:
```bash
# Check for circular dependencies
npx madge --circular src/
```

3. **Test agent registry directly**:
```typescript
import { AgentRegistry } from './src/agents/core/agent-registry.js';
const registry = new AgentRegistry();
console.log(registry.listAgents());
```

---

## Tool Execution Errors

### Issue: All tools return "INTERNAL_ERROR"

**Symptoms**:
```json
{
  "isError": true,
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

**Solutions**:

1. **Enable error stack traces**:
```bash
NODE_ENV=development node dist/mcp/versatil-mcp-server-v2.js
```

2. **Test individual tool**:
```bash
# Call versatil_health_check (simplest tool)
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "versatil_health_check",
    "arguments": {"comprehensive": false}
  }
}' | node dist/mcp/versatil-mcp-server-v2.js
```

3. **Check tool registration**:
```bash
# Look for this log message
grep "VERSATIL MCP tools registered successfully" logs/versatil.log
```

### Issue: "AGENT_NOT_FOUND" error

**Symptoms**:
```json
{
  "code": "AGENT_NOT_FOUND",
  "message": "Agent enhanced-maria not found"
}
```

**Solutions**:

1. **List available agents**:
```bash
# Use versatil_get_status tool
curl -X POST http://localhost:3100/messages?sessionId=test \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"versatil_get_status"}}'
```

2. **Verify agent ID spelling**:
```
Valid agent IDs:
- enhanced-maria
- enhanced-james
- enhanced-marcus
- sarah-pm
- alex-ba
- dr-ai-ml
```

3. **Check agent registry**:
```typescript
// src/agents/core/agent-registry.ts
const agent = registry.getAgent('enhanced-maria');
if (!agent) {
  console.error('Agent not registered');
}
```

### Issue: Tool validation errors

**Symptoms**:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid parameter type for 'testType'"
}
```

**Solutions**:

1. **Check parameter schema**:
```typescript
// Example for versatil_run_tests
{
  testType: z.enum(['unit', 'integration', 'e2e', 'visual', 'performance', 'security']),
  coverage: z.boolean().optional(),
  chromeMCP: z.boolean().optional()
}
```

2. **Validate JSON format**:
```bash
# Use jq to validate JSON
echo '{"testType":"unit"}' | jq .
```

3. **Check required vs optional params**:
```
Required: testType
Optional: coverage, chromeMCP
```

---

## Resource Access Errors

### Issue: "RESOURCE_NOT_FOUND" error

**Symptoms**:
```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Resource not found: versatil://invalid-resource"
}
```

**Solutions**:

1. **List available resources**:
```bash
# Call resources/list
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list"
}' | node dist/mcp/versatil-mcp-server-v2.js
```

2. **Verify URI format**:
```
Correct: versatil://quality-metrics
Wrong:   versatil:/quality-metrics  (missing /)
Wrong:   versatil//quality-metrics   (missing :)
Wrong:   quality-metrics             (missing protocol)
```

3. **Check resource registration**:
```typescript
// src/mcp/versatil-mcp-server-v2.ts
// Look for server.resource() calls
```

### Issue: Dynamic resource returns empty data

**Symptoms**:
```json
{
  "contents": [{
    "uri": "versatil://agent-status/enhanced-maria",
    "text": "{}"
  }]
}
```

**Solutions**:

1. **Verify agent is initialized**:
```bash
# Check agent startup logs
grep "Agent initialized" logs/versatil.log
```

2. **Test with static resource first**:
```bash
# versatil://quality-metrics always returns data
curl "http://localhost:3100/resources/read?uri=versatil://quality-metrics"
```

3. **Check resource handler**:
```typescript
// Ensure handler returns valid data structure
return {
  contents: [{
    uri: uri.href,
    text: JSON.stringify(data, null, 2),
    mimeType: 'application/json'
  }]
};
```

### Issue: Resource URI template variables not working

**Symptoms**:
```
URI: versatil://agent-status/{agentId}
Error: Variable {agentId} not replaced
```

**Solutions**:

1. **Use proper ResourceTemplate**:
```typescript
new ResourceTemplate('versatil://agent-status/{agentId}', {
  list: undefined  // Required parameter
})
```

2. **Test variable extraction**:
```bash
# Call with specific agentId
curl "http://localhost:3100/resources/read?uri=versatil://agent-status/enhanced-maria"
```

3. **Check callback signature**:
```typescript
async (uri, { agentId }) => {
  // agentId should be extracted from URI
  console.log('Agent ID:', agentId);
}
```

---

## Prompt Generation Issues

### Issue: Prompt returns empty messages array

**Symptoms**:
```json
{
  "description": "Code analysis prompt...",
  "messages": []
}
```

**Solutions**:

1. **Check prompt arguments**:
```bash
# Ensure all required arguments provided
{
  "filePath": "src/api/login.ts",
  "analysisType": "security"  // Must be valid enum value
}
```

2. **Verify prompt handler**:
```typescript
async ({ filePath, analysisType }) => {
  return {
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: promptText  // Must not be empty
      }
    }]
  };
}
```

3. **Test with simple prompt**:
```bash
# Try analyze-code with 'quality' type (simplest)
echo '{
  "method": "prompts/get",
  "params": {
    "name": "analyze-code",
    "arguments": {
      "filePath": "test.ts",
      "analysisType": "quality"
    }
  }
}' | node dist/mcp/versatil-mcp-server-v2.js
```

### Issue: Invalid enum value for prompt arguments

**Symptoms**:
```
Error: Invalid value "invalid-type" for analysisType
Expected: quality, security, performance, architecture, comprehensive
```

**Solutions**:

1. **Check valid enum values**:
```typescript
// analyze-code prompt
analysisType: z.enum(['quality', 'security', 'performance', 'architecture', 'comprehensive'])

// test-generation prompt
testType: z.enum(['unit', 'integration', 'e2e', 'visual', 'performance', 'security'])

// performance-optimization prompt
metric: z.enum(['response-time', 'throughput', 'memory', 'bundle-size', 'database-queries'])
```

2. **Use exact enum spelling**:
```json
Correct: "analysisType": "quality"
Wrong:   "analysisType": "Quality"  (case-sensitive)
Wrong:   "analysisType": "qual"     (not a valid value)
```

---

## HTTP Server Issues

### Issue: HTTP server won't start - port already in use

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::3100
```

**Solutions**:

1. **Find and kill process using port**:
```bash
# macOS/Linux
lsof -ti:3100 | xargs kill -9

# Or use different port
PORT=3200 node dist/mcp/versatil-mcp-http-server.js
```

2. **Check what's using the port**:
```bash
lsof -i :3100
netstat -an | grep 3100
```

3. **Configure different port**:
```typescript
const server = new VERSATILMCPHTTPServer(mcpConfig, {
  port: 3200  // Use different port
});
```

### Issue: CORS errors in browser

**Symptoms**:
```
Access to fetch at 'http://localhost:3100' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions**:

1. **Configure CORS origins**:
```typescript
const server = new VERSATILMCPHTTPServer(mcpConfig, {
  cors: {
    enabled: true,
    origins: [
      'http://localhost:3000',
      'http://localhost:3100',
      'http://127.0.0.1:*'
    ]
  }
});
```

2. **Test CORS headers**:
```bash
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://localhost:3100/messages
```

3. **Check preflight response**:
```
Expected headers:
- Access-Control-Allow-Origin: http://localhost:3000
- Access-Control-Allow-Methods: GET, POST, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization
```

### Issue: SSE connection drops immediately

**Symptoms**:
```
SSE connection established then immediately closed
EventSource readyState: 2 (CLOSED)
```

**Solutions**:

1. **Check server logs**:
```bash
# Look for SSE connection errors
tail -f logs/versatil.log | grep SSE
```

2. **Test SSE endpoint directly**:
```bash
curl -N -H "Accept: text/event-stream" http://localhost:3100/sse
```

3. **Verify keep-alive**:
```typescript
// SSE transport should send periodic keep-alive
// Check for `:keep-alive` comments in stream
```

4. **Check reverse proxy timeout** (if using nginx/apache):
```nginx
# nginx
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

---

## Claude Desktop Integration

### Issue: Claude doesn't see MCP server

**Symptoms**:
- No MCP tools available in Claude
- Server not listed in Claude settings
- No connection logs

**Solutions**:

1. **Verify config file location**:
```bash
# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%/Claude/claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json
```

2. **Check config format**:
```json
{
  "mcpServers": {
    "versatil": {
      "command": "node",
      "args": [
        "/absolute/path/to/versatil-sdlc-framework/dist/mcp/versatil-mcp-server-v2.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "VERSATIL_MCP_MODE": "true"
      }
    }
  }
}
```

3. **Use absolute paths**:
```bash
# Find absolute path
pwd  # /Users/username/versatil-sdlc-framework
# Use: /Users/username/versatil-sdlc-framework/dist/mcp/versatil-mcp-server-v2.js
```

4. **Restart Claude Desktop**:
```bash
# macOS
killall Claude
open -a Claude

# Verify connection in Claude Dev Tools
# Help > Toggle Developer Tools > Console
```

### Issue: MCP server crashes in Claude Desktop

**Symptoms**:
- Claude shows "MCP server disconnected"
- Tools work for a few seconds then fail
- Repeated crashes

**Solutions**:

1. **Check Claude logs**:
```bash
# macOS
~/Library/Logs/Claude/mcp-server-versatil.log

# Look for error stack traces
tail -100 ~/Library/Logs/Claude/mcp-server-versatil.log
```

2. **Test server standalone**:
```bash
# Run server outside Claude to see errors
node dist/mcp/versatil-mcp-server-v2.js
```

3. **Increase memory limit**:
```json
{
  "mcpServers": {
    "versatil": {
      "command": "node",
      "args": [
        "--max-old-space-size=4096",
        "/path/to/versatil-mcp-server-v2.js"
      ]
    }
  }
}
```

4. **Check for uncaught exceptions**:
```typescript
// Add to server startup
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
```

---

## Performance Problems

### Issue: Slow tool execution (> 5 seconds)

**Symptoms**:
- Tools take long time to respond
- Timeout errors
- High CPU usage

**Solutions**:

1. **Profile tool execution**:
```bash
# Enable performance monitoring
VERSATIL_PERFORMANCE_MONITORING=true node dist/mcp/versatil-mcp-server-v2.js
```

2. **Check for blocking operations**:
```typescript
// Avoid synchronous file operations
// Use async/await for all I/O
```

3. **Monitor resource usage**:
```bash
# Check memory and CPU
top -pid $(pgrep -f versatil-mcp-server)
```

4. **Optimize agent operations**:
```typescript
// Cache agent instances
// Use connection pooling
// Batch database queries
```

### Issue: Memory leak - growing heap size

**Symptoms**:
```
Memory usage increases over time
Eventually crashes with OOM error
```

**Solutions**:

1. **Monitor memory usage**:
```bash
node --trace-gc dist/mcp/versatil-mcp-server-v2.js
```

2. **Check for event listener leaks**:
```typescript
// Ensure event listeners are cleaned up
process.setMaxListeners(20);  // Increase if needed
```

3. **Profile with heap snapshot**:
```bash
node --inspect dist/mcp/versatil-mcp-server-v2.js
# Open chrome://inspect
# Take heap snapshots
```

4. **Clear caches periodically**:
```typescript
// Implement cache TTL
// Limit cache size
// Use weak references for large objects
```

---

## Logging & Debugging

### Enable Debug Logging

```bash
# Maximum verbosity
VERSATIL_LOG_LEVEL=debug node dist/mcp/versatil-mcp-server-v2.js

# Log to file
VERSATIL_LOG_FILE=versatil-debug.log node dist/mcp/versatil-mcp-server-v2.js

# Both console and file
VERSATIL_LOG_LEVEL=debug VERSATIL_LOG_FILE=versatil.log node dist/mcp/versatil-mcp-server-v2.js
```

### Inspect MCP Messages

```bash
# Log all JSON-RPC messages
tee versatil-messages.log | node dist/mcp/versatil-mcp-server-v2.js | tee versatil-responses.log
```

### Debug TypeScript Source

```bash
# Run with source maps
node --enable-source-maps dist/mcp/versatil-mcp-server-v2.js

# Attach debugger
node --inspect-brk dist/mcp/versatil-mcp-server-v2.js
# Open chrome://inspect
```

### Test Individual Components

```typescript
// Test agent registry
import { AgentRegistry } from './src/agents/core/agent-registry.js';
const registry = new AgentRegistry();
console.log('Agents:', registry.listAgents());

// Test error sanitizer
import { sanitizeError } from './src/mcp/error-sanitizer.js';
const error = new Error('Test error with /sensitive/path');
console.log('Sanitized:', sanitizeError(error));
```

---

## Known Issues & Workarounds

### Issue: Windows path handling

**Symptom**: File paths with backslashes fail on Windows

**Workaround**:
```typescript
// Normalize paths
const path = filePath.replace(/\\/g, '/');
```

### Issue: Large response truncation

**Symptom**: Tool responses > 100KB get truncated

**Workaround**:
```typescript
// Use resource for large data
// Tools should return < 100KB
// Resources can return larger payloads
```

### Issue: Chrome MCP requires Playwright installation

**Symptom**: `chromeMCP: true` fails if Playwright not installed

**Workaround**:
```bash
# Install Playwright browsers
npx playwright install chromium
```

---

## Getting Help

### Before Opening an Issue

1. ✅ Check this troubleshooting guide
2. ✅ Search existing issues: https://github.com/MiraclesGIT/versatil-sdlc-framework/issues
3. ✅ Enable debug logging and check logs
4. ✅ Test with minimal reproduction case
5. ✅ Include version information (`node --version`, `npm --version`)

### Opening a Support Issue

Include:
- **Version**: Node.js, npm, VERSATIL framework
- **Environment**: OS, Claude Desktop version (if applicable)
- **Error Message**: Full error with stack trace
- **Steps to Reproduce**: Minimal reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Logs**: Debug logs (`VERSATIL_LOG_LEVEL=debug`)

### Emergency Support

For critical production issues:
- **Email**: support@versatil.dev
- **Discord**: https://discord.gg/versatil
- **Response Time**: < 4 hours for P0, < 24 hours for P1

---

**Last Updated**: October 10, 2025
**Framework Version**: 6.1.0
**Maintained By**: VERSATIL Development Team
