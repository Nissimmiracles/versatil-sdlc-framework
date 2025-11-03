#!/bin/bash

# VERSATIL SDLC Framework - MCP Installation Script
# This script installs optional MCP dependencies for full functionality

set -e

echo "🚀 VERSATIL SDLC Framework - MCP Installation"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to install with error handling
install_package() {
    local package=$1
    local description=$2

    echo -e "${YELLOW}Installing ${package}...${NC}"
    echo "Description: ${description}"

    if pnpm add "${package}" 2>&1 | tee /tmp/pnpm-install.log; then
        echo -e "${GREEN}✅ ${package} installed successfully${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Failed to install ${package}${NC}"
        echo "Check /tmp/pnpm-install.log for details"
        echo ""
        return 1
    fi
}

echo "This script will install the following MCP packages:"
echo ""
echo "  CORE MCPs (Recommended):"
echo "    • @playwright/mcp - Browser automation for testing"
echo "    • @modelcontextprotocol/server-github - GitHub integration"
echo "    • exa-mcp-server - AI-powered search and research"
echo ""
echo "  OPTIONAL MCPs:"
echo "    • @google-cloud/vertexai - Google Cloud AI (Gemini)"
echo "    • @sentry/node - Error monitoring"
echo "    • semgrep - Security scanning (requires Python/brew)"
echo ""

read -p "Install CORE MCPs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "📦 Installing Core MCPs..."
    echo "=========================="
    echo ""

    install_package "@playwright/mcp@latest" "Browser automation with Playwright"
    install_package "@modelcontextprotocol/server-github@latest" "GitHub repository operations"
    install_package "exa-mcp-server@latest" "AI-powered web search"

    echo -e "${GREEN}✅ Core MCPs installation complete!${NC}"
else
    echo "Skipping core MCPs installation"
fi

echo ""
read -p "Install OPTIONAL MCPs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "📦 Installing Optional MCPs..."
    echo "=============================="
    echo ""

    install_package "@google-cloud/vertexai@latest" "Google Cloud Vertex AI integration"
    install_package "@sentry/node@latest" "Error monitoring and tracking"

    echo ""
    echo "Note: Semgrep requires system-level installation"
    echo ""
    read -p "Install Semgrep via Homebrew? (Mac only, y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        if command -v brew &> /dev/null
        then
            echo "Installing Semgrep via Homebrew..."
            brew install semgrep || echo "Semgrep installation failed. Try: pip install semgrep"
        else
            echo "Homebrew not found. Install manually:"
            echo "  • macOS: brew install semgrep"
            echo "  • Python: pip install semgrep"
        fi
    fi

    echo -e "${GREEN}✅ Optional MCPs installation complete!${NC}"
else
    echo "Skipping optional MCPs installation"
fi

echo ""
echo "🎉 MCP Installation Complete!"
echo "=============================="
echo ""
echo "Next steps:"
echo "  1. Configure MCP credentials in .env file"
echo "  2. Run 'pnpm build' to recompile"
echo "  3. Test MCPs with 'pnpm test'"
echo ""
echo "For more info, see:"
echo "  • docs/MCP_INTEGRATIONS_STATUS.md"
echo "  • docs/WORKFLOWS.md"
echo ""
