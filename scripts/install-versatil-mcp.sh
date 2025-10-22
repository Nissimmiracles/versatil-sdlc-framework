#!/bin/bash

# VERSATIL SDLC Framework - Universal MCP Installation Script
# This script installs VERSATIL MCP server from GitHub for any user

echo "🚀 VERSATIL SDLC Framework - Universal MCP Installation"
echo "======================================================"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📥 Cloning VERSATIL framework from GitHub..."
    git clone https://github.com/MiraclesGIT/versatil-sdlc-framework.git versatil-framework
    cd versatil-framework
else
    echo "📁 Using existing repository..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "package.json" ]; then
    npm install
else
    echo "⚠️ No package.json found, creating minimal setup..."
    npm init -y
    npm install @modelcontextprotocol/sdk
fi

# Get current directory
VERSATIL_DIR=$(pwd)

# Detect user's MCP configuration location
if [ -f "$HOME/.cursor/mcp.json" ]; then
    MCP_CONFIG="$HOME/.cursor/mcp.json"
    MCP_TYPE="Cursor"
elif [ -f "$HOME/Library/Application Support/Claude/claude_desktop_config.json" ]; then
    MCP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    MCP_TYPE="Claude Desktop"
else
    echo "❌ No MCP configuration found. Please ensure you have Cursor or Claude Desktop installed."
    exit 1
fi

echo "🔧 Found $MCP_TYPE configuration at: $MCP_CONFIG"

# Backup existing config
cp "$MCP_CONFIG" "$MCP_CONFIG.backup.$(date +%s)"
echo "💾 Backed up existing configuration"

# Update MCP configuration based on type
if [ "$MCP_TYPE" = "Cursor" ]; then
    # Update Cursor mcp.json
    echo "📝 Updating Cursor MCP configuration..."

    # Create temporary config with VERSATIL added
    cat > temp_mcp.json << EOF
{
  "mcpServers": {
    "versatil-sdlc-framework": {
      "command": "node",
      "args": ["$VERSATIL_DIR/versatil-mcp-server.js"],
      "cwd": "$VERSATIL_DIR",
      "env": {
        "NODE_ENV": "production",
        "VERSATIL_MCP_MODE": "true"
      }
    }
  }
}
EOF

    # Merge with existing config if it has other servers
    if [ -s "$MCP_CONFIG" ]; then
        # Use jq to merge if available, otherwise replace
        if command -v jq &> /dev/null; then
            jq -s '.[0].mcpServers * .[1].mcpServers | {mcpServers: .}' "$MCP_CONFIG" temp_mcp.json > merged_mcp.json
            mv merged_mcp.json "$MCP_CONFIG"
        else
            # Simple merge for common case
            sed '$ s/}//' "$MCP_CONFIG" > temp_existing.json
            echo '    ,' >> temp_existing.json
            sed '1,2d; $ s/^  }//' temp_mcp.json >> temp_existing.json
            echo '  }' >> temp_existing.json
            echo '}' >> temp_existing.json
            mv temp_existing.json "$MCP_CONFIG"
        fi
    else
        mv temp_mcp.json "$MCP_CONFIG"
    fi

    rm -f temp_mcp.json

elif [ "$MCP_TYPE" = "Claude Desktop" ]; then
    # Update Claude Desktop config
    echo "📝 Updating Claude Desktop MCP configuration..."

    # Claude Desktop uses different format
    if command -v jq &> /dev/null; then
        jq ".mcpServers[\"versatil-sdlc-framework\"] = {
            \"command\": \"node\",
            \"args\": [\"$VERSATIL_DIR/versatil-mcp-server.js\"],
            \"cwd\": \"$VERSATIL_DIR\",
            \"env\": {
                \"NODE_ENV\": \"production\",
                \"VERSATIL_MCP_MODE\": \"true\"
            }
        }" "$MCP_CONFIG" > temp_claude.json && mv temp_claude.json "$MCP_CONFIG"
    else
        echo "⚠️ jq not found. Please manually add VERSATIL to your Claude Desktop config."
    fi
fi

# Test MCP server
echo "🧪 Testing VERSATIL MCP server..."
if echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node "$VERSATIL_DIR/versatil-mcp-server.js" > /dev/null 2>&1; then
    echo "✅ MCP server test successful"
else
    echo "⚠️ MCP server test failed, but installation completed"
fi

echo ""
echo "======================================================"
echo "🎉 VERSATIL MCP Installation Complete!"
echo "======================================================"
echo ""
echo "📍 Installation Location: $VERSATIL_DIR"
echo "🔧 MCP Configuration: $MCP_CONFIG"
echo "🎯 MCP Type: $MCP_TYPE"
echo ""
echo "🚀 Available VERSATIL MCP Tools:"
echo "   • versatil_activate_agent - Activate OPERA agents"
echo "   • versatil_orchestrate_sdlc - Manage SDLC phases"
echo "   • versatil_quality_gate - Execute quality checks"
echo "   • versatil_framework_status - Get framework status"
echo ""
echo "📋 Next Steps:"
echo "   1. Restart $MCP_TYPE"
echo "   2. Test: Ask AI to 'Use versatil_framework_status'"
echo "   3. Enjoy adaptive AI-native development!"
echo ""
echo "📚 Documentation: https://github.com/MiraclesGIT/versatil-sdlc-framework"
echo "🐛 Issues: https://github.com/MiraclesGIT/versatil-sdlc-framework/issues"
echo ""