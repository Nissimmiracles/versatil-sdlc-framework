#!/bin/bash

echo "🚀 Setting up VERSATIL MCP Modules"
echo ""

cd "/Users/nissimmenashe/VERSATIL SDLC FW"

# Install Context7 for documentation
echo "📚 Installing Context7 MCP..."
npm install @context7/mcp --save

echo ""
echo "✅ MCP Modules setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review: src/mcp/mcp-integration-guide.md"
echo "2. Configure: mcp-modules.config.json"
echo "3. Integrate MCPModuleManager into VERSATILMCPServerV2"
echo "4. Test: node bin/versatil-mcp.js"
echo ""
echo "📊 Monitor logs: tail -f ~/.versatil/mcp-server.log"
