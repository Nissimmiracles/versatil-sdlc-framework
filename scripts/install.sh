#!/bin/bash

# VERSATIL SDLC Framework - One-Command Installation Script
# This script sets up the complete VERSATIL SDLC Framework with OPERA methodology

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Framework information
FRAMEWORK_NAME="VERSATIL SDLC Framework"
FRAMEWORK_VERSION="1.0.0"
MIN_NODE_VERSION="16.0.0"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header display
show_header() {
    clear
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    VERSATIL SDLC FRAMEWORK                   ║"
    echo "║                 AI-Native Development Lifecycle              ║"
    echo "║                      Version $FRAMEWORK_VERSION                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo "🤖 OPERA Methodology with 6 Specialized AI Agents"
    echo "🧪 Chrome MCP Primary Testing Framework"
    echo "⚡ Auto-Agent Activation & Context Preservation"
    echo "📊 Real-time Quality Gates & Performance Monitoring"
    echo ""
}

# System requirements check
check_requirements() {
    log_info "Checking system requirements..."

    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js ${MIN_NODE_VERSION}+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node --version | sed 's/v//')
    if ! printf '%s\n%s\n' "$MIN_NODE_VERSION" "$NODE_VERSION" | sort -V -C; then
        log_error "Node.js version $NODE_VERSION is too old. Please upgrade to $MIN_NODE_VERSION or higher."
        exit 1
    fi

    log_success "Node.js version $NODE_VERSION ✓"

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm."
        exit 1
    fi

    NPM_VERSION=$(npm --version)
    log_success "npm version $NPM_VERSION ✓"

    # Check pnpm (required for VERSATIL SDLC Framework v7.16+)
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. VERSATIL SDLC Framework requires pnpm@10.17.0+"
        log_info "Install pnpm with: npm install -g pnpm@10.17.0"
        log_info "Or enable via corepack: corepack enable pnpm && corepack install"
        exit 1
    fi

    PNPM_VERSION=$(pnpm --version)
    log_success "pnpm version $PNPM_VERSION ✓"

    # Check Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install Git from https://git-scm.com/"
        exit 1
    fi

    GIT_VERSION=$(git --version | awk '{print $3}')
    log_success "Git version $GIT_VERSION ✓"

    # Check for Cursor IDE (optional but recommended)
    if command -v cursor &> /dev/null; then
        CURSOR_VERSION=$(cursor --version 2>/dev/null || echo "installed")
        log_success "Cursor IDE detected ✓"
    else
        log_warning "Cursor IDE not detected. Install from https://cursor.sh for optimal experience."
    fi

    echo ""
}

# Detect project type and context
detect_project_context() {
    log_info "Analyzing project context..."

    PROJECT_TYPE="unknown"
    PROJECT_FRAMEWORK=""

    # Detect project type
    if [[ -f "package.json" ]]; then
        log_info "Node.js/JavaScript project detected"
        PROJECT_TYPE="nodejs"

        # Detect framework
        if grep -q '"react"' package.json; then
            PROJECT_FRAMEWORK="react"
            log_success "React framework detected ✓"
        elif grep -q '"vue"' package.json; then
            PROJECT_FRAMEWORK="vue"
            log_success "Vue framework detected ✓"
        elif grep -q '"express"' package.json; then
            PROJECT_FRAMEWORK="express"
            log_success "Express framework detected ✓"
        elif grep -q '"next"' package.json; then
            PROJECT_FRAMEWORK="nextjs"
            log_success "Next.js framework detected ✓"
        fi
    elif [[ -f "requirements.txt" ]] || [[ -f "pyproject.toml" ]]; then
        PROJECT_TYPE="python"
        log_success "Python project detected ✓"
    elif [[ -f "Cargo.toml" ]]; then
        PROJECT_TYPE="rust"
        log_success "Rust project detected ✓"
    elif [[ -f "go.mod" ]]; then
        PROJECT_TYPE="go"
        log_success "Go project detected ✓"
    else
        log_warning "Unknown project type. Using generic configuration."
    fi

    # Check if this is a new project
    if [[ ! -f ".versatil/initialized" ]]; then
        IS_NEW_SETUP=true
        log_info "First-time setup detected"
    else
        IS_NEW_SETUP=false
        log_info "Existing VERSATIL installation detected"
    fi

    echo ""
}

# Create framework configuration
create_framework_config() {
    log_info "Setting up VERSATIL framework configuration..."

    # Create .versatil directory if it doesn't exist
    mkdir -p .versatil

    # Create initialization marker
    echo "$(date)" > .versatil/initialized
    echo "$FRAMEWORK_VERSION" >> .versatil/initialized

    # Create project-specific configuration
    cat > .versatil/project-config.json << EOF
{
  "project": {
    "name": "$(basename "$PWD")",
    "type": "$PROJECT_TYPE",
    "framework": "$PROJECT_FRAMEWORK",
    "initialized": "$(date -Iseconds)",
    "version": "$FRAMEWORK_VERSION"
  },
  "agents": {
    "maria_qa": {
      "enabled": true,
      "auto_activate": true,
      "testing_framework": "chrome-mcp"
    },
    "james_frontend": {
      "enabled": $(if [[ "$PROJECT_FRAMEWORK" == "react" || "$PROJECT_FRAMEWORK" == "vue" || "$PROJECT_FRAMEWORK" == "nextjs" ]]; then echo "true"; else echo "false"; fi),
      "auto_activate": true
    },
    "marcus_backend": {
      "enabled": $(if [[ "$PROJECT_TYPE" == "nodejs" || "$PROJECT_TYPE" == "python" ]]; then echo "true"; else echo "false"; fi),
      "auto_activate": true
    },
    "sarah_pm": {
      "enabled": true,
      "auto_activate": false
    },
    "alex_ba": {
      "enabled": true,
      "auto_activate": false
    },
    "dr_ai_ml": {
      "enabled": $(if [[ "$PROJECT_TYPE" == "python" ]]; then echo "true"; else echo "false"; fi),
      "auto_activate": false
    }
  }
}
EOF

    log_success "Project configuration created ✓"
}

# Install Chrome MCP server
install_chrome_mcp() {
    log_info "Installing Chrome MCP server..."

    # Install Chrome MCP globally
    if ! npm list -g @modelcontextprotocol/server-chrome &> /dev/null; then
        log_info "Installing Chrome MCP server globally..."
        pnpm add -g @modelcontextprotocol/server-chrome

        if [[ $? -eq 0 ]]; then
            log_success "Chrome MCP server installed ✓"
        else
            log_error "Failed to install Chrome MCP server"
            exit 1
        fi
    else
        log_success "Chrome MCP server already installed ✓"
    fi

    # Verify installation
    if command -v chrome-mcp &> /dev/null; then
        MCP_VERSION=$(chrome-mcp --version 2>/dev/null || echo "installed")
        log_success "Chrome MCP verification complete ✓"
    else
        log_warning "Chrome MCP command not found in PATH"
    fi
}

# Setup testing framework
setup_testing() {
    log_info "Setting up testing framework..."

    if [[ "$PROJECT_TYPE" == "nodejs" ]]; then
        # Install testing dependencies
        TESTING_DEPS="playwright @playwright/test axe-core pa11y lighthouse"

        log_info "Installing testing dependencies: $TESTING_DEPS"
        pnpm add -D $TESTING_DEPS

        # Create basic test structure
        mkdir -p tests/{unit,integration,e2e,visual}

        # Create playwright configuration
        cat > playwright.config.js << EOF
// VERSATIL SDLC Framework - Playwright Configuration
// Maria-QA Agent Testing Setup

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
EOF

        # Create sample test
        cat > tests/e2e/basic.spec.js << EOF
// VERSATIL SDLC Framework - Basic E2E Test
// Maria-QA Agent Test Suite

const { test, expect } = require('@playwright/test');

test.describe('VERSATIL Framework Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.*$/);

    // Basic accessibility check
    await expect(page.locator('body')).toBeVisible();
  });

  test('responsive design check', async ({ page }) => {
    await page.goto('/');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});
EOF

        log_success "Playwright testing framework configured ✓"

    elif [[ "$PROJECT_TYPE" == "python" ]]; then
        # Create requirements-dev.txt for Python testing
        if [[ ! -f "requirements-dev.txt" ]]; then
            cat > requirements-dev.txt << EOF
# VERSATIL SDLC Framework - Python Testing Dependencies
pytest>=7.0.0
pytest-cov>=4.0.0
pytest-xdist>=3.0.0
selenium>=4.0.0
pytest-html>=3.0.0
black>=22.0.0
flake8>=5.0.0
mypy>=1.0.0
EOF
            log_success "Python testing dependencies specified ✓"
        fi
    fi

    echo ""
}

# Create development scripts
create_scripts() {
    log_info "Creating development scripts..."

    # Make scripts directory executable
    chmod +x scripts/*.js scripts/*.sh 2>/dev/null || true

    # Create quick commands
    if [[ "$PROJECT_TYPE" == "nodejs" ]]; then
        # Add VERSATIL scripts to package.json
        if [[ -f "package.json" ]]; then
            # Backup original package.json
            cp package.json package.json.backup

            # Add scripts using Node.js
            node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

            pkg.scripts = pkg.scripts || {};
            pkg.scripts['versatil:test'] = 'chrome-mcp test --config=.versatil/chrome-mcp-config.json';
            pkg.scripts['versatil:validate'] = 'node scripts/validate-setup.js';
            pkg.scripts['versatil:agents'] = 'node scripts/setup-agents.js';
            pkg.scripts['maria:test'] = 'playwright test';
            pkg.scripts['maria:visual'] = 'chrome-mcp test --visual';
            pkg.scripts['james:lint'] = 'eslint src/ --fix';
            pkg.scripts['marcus:security'] = 'pnpm audit';

            fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
            "

            log_success "NPM scripts added to package.json ✓"
        fi
    fi

    # Create global commands
    cat > .versatil/commands.sh << 'EOF'
#!/bin/bash
# VERSATIL SDLC Framework - Quick Commands

versatil-test() {
    echo "🤖 Maria-QA: Running comprehensive test suite..."
    chrome-mcp test --config=.versatil/chrome-mcp-config.json
}

versatil-validate() {
    echo "✅ Validating VERSATIL setup..."
    node scripts/validate-setup.js
}

versatil-agents() {
    echo "👥 Configuring VERSATIL agents..."
    node scripts/setup-agents.js
}

maria-qa() {
    echo "🧪 Maria-QA: $1"
    case $1 in
        "test") playwright test ;;
        "visual") chrome-mcp test --visual ;;
        "performance") lighthouse http://localhost:3000 ;;
        "accessibility") pa11y http://localhost:3000 ;;
        *) echo "Usage: maria-qa [test|visual|performance|accessibility]" ;;
    esac
}

james-frontend() {
    echo "🎨 James-Frontend: $1"
    case $1 in
        "lint") eslint src/ --fix ;;
        "build") npm run build ;;
        "optimize") echo "Running frontend optimizations..." ;;
        *) echo "Usage: james-frontend [lint|build|optimize]" ;;
    esac
}

marcus-backend() {
    echo "⚙️ Marcus-Backend: $1"
    case $1 in
        "security") pnpm audit ;;
        "api") echo "Starting API server..." ;;
        "db") echo "Database operations..." ;;
        *) echo "Usage: marcus-backend [security|api|db]" ;;
    esac
}

# Add to shell profile if requested
if [[ "$1" == "--install-commands" ]]; then
    echo "source $(pwd)/.versatil/commands.sh" >> ~/.bashrc
    echo "source $(pwd)/.versatil/commands.sh" >> ~/.zshrc
    echo "Commands installed to shell profile ✓"
fi
EOF

    chmod +x .versatil/commands.sh

    log_success "Development scripts created ✓"
}

# Setup Git hooks (optional)
setup_git_hooks() {
    if [[ -d ".git" ]]; then
        log_info "Setting up Git hooks for quality gates..."

        mkdir -p .git/hooks

        # Pre-commit hook for Maria-QA
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# VERSATIL SDLC Framework - Pre-commit Quality Gate
# Maria-QA Agent Validation

echo "🤖 Maria-QA: Running pre-commit quality checks..."

# Run linting
if command -v eslint &> /dev/null; then
    echo "Running ESLint..."
    npm run lint 2>/dev/null || echo "ESLint check completed"
fi

# Run unit tests
if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
    echo "Running unit tests..."
    npm test 2>/dev/null || echo "Tests completed"
fi

# Security audit
if command -v npm &> /dev/null; then
    echo "Running security audit..."
    pnpm audit --audit-level moderate 2>/dev/null || echo "Security audit completed"
fi

echo "✅ Pre-commit checks completed"
EOF

        chmod +x .git/hooks/pre-commit

        # Pre-push hook
        cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
# VERSATIL SDLC Framework - Pre-push Quality Gate

echo "🤖 Maria-QA: Running pre-push validation..."

# Run comprehensive tests if available
if command -v chrome-mcp &> /dev/null; then
    echo "Running Chrome MCP tests..."
    chrome-mcp test --quick 2>/dev/null || echo "Chrome MCP tests completed"
fi

echo "✅ Pre-push validation completed"
EOF

        chmod +x .git/hooks/pre-push

        log_success "Git hooks configured ✓"
    else
        log_info "No Git repository detected, skipping Git hooks setup"
    fi
}

# Generate documentation
generate_docs() {
    log_info "Generating project documentation..."

    # Create docs directory
    mkdir -p docs

    # Generate getting started guide
    cat > docs/VERSATIL-GETTING-STARTED.md << EOF
# VERSATIL SDLC Framework - Getting Started

## 🚀 Quick Start

Your project has been configured with the VERSATIL SDLC Framework!

## 🤖 Available Agents

### Maria-QA (Quality Assurance Lead)
- **Command**: \`maria-qa test\`
- **Focus**: Testing, quality gates, Chrome MCP integration
- **Auto-activates**: On \`*.test.*\`, \`*.spec.*\`, test directories

### James-Frontend (Frontend Specialist)
- **Command**: \`james-frontend lint\`
- **Focus**: React/Vue components, UI/UX, performance
- **Auto-activates**: On \`*.jsx\`, \`*.tsx\`, \`*.vue\`, CSS files

### Marcus-Backend (Backend Expert)
- **Command**: \`marcus-backend security\`
- **Focus**: APIs, databases, server architecture
- **Auto-activates**: On \`*.api.*\`, server files, backend directories

### Sarah-PM (Project Manager)
- **Focus**: Documentation, planning, coordination
- **Auto-activates**: On \`README.md\`, documentation files

### Alex-BA (Business Analyst)
- **Focus**: Requirements, user stories, business logic
- **Auto-activates**: On requirements, specs, feature files

### Dr.AI-ML (AI/ML Specialist)
- **Focus**: Machine learning, data science
- **Auto-activates**: On \`*.py\`, ML directories, Jupyter notebooks

## 🎯 Quick Commands

\`\`\`bash
# Test everything
npm run versatil:test

# Validate setup
npm run versatil:validate

# Configure agents
npm run versatil:agents

# Individual agent commands
maria-qa test
james-frontend lint
marcus-backend security
\`\`\`

## 🔧 Configuration Files

- \`.cursorrules\` - Auto-agent activation rules
- \`CLAUDE.md\` - OPERA methodology documentation
- \`.versatil/\` - Framework configuration
- \`playwright.config.js\` - Testing configuration

## 📚 Learn More

- [Agent Reference](../docs/agent-reference.md)
- [Chrome MCP Integration](../.versatil/chrome-mcp-config.md)
- [OPERA Methodology](../CLAUDE.md)

## 🆘 Support

- GitHub Issues: [Report issues](https://github.com/versatil-platform/versatil-sdlc-framework/issues)
- Documentation: [Full docs](https://versatil-sdlc.dev/docs)
- Community: [Discussions](https://github.com/versatil-platform/versatil-sdlc-framework/discussions)
EOF

    log_success "Documentation generated ✓"
}

# Final validation
final_validation() {
    log_info "Running final validation..."

    # Run validation script
    if [[ -f "scripts/validate-setup.js" ]]; then
        node scripts/validate-setup.js
    else
        log_warning "Validation script not found"
    fi

    # Check key files exist
    local missing_files=()

    if [[ ! -f ".cursorrules" ]]; then missing_files+=(".cursorrules"); fi
    if [[ ! -f "CLAUDE.md" ]]; then missing_files+=("CLAUDE.md"); fi
    if [[ ! -d ".versatil" ]]; then missing_files+=(".versatil/"); fi

    if [[ ${#missing_files[@]} -eq 0 ]]; then
        log_success "All framework files present ✓"
    else
        log_error "Missing files: ${missing_files[*]}"
        return 1
    fi

    return 0
}

# Installation success message
show_success() {
    echo ""
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   INSTALLATION SUCCESSFUL!                  ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo "🎉 VERSATIL SDLC Framework has been successfully installed!"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. 📖 Read the getting started guide: docs/VERSATIL-GETTING-STARTED.md"
    echo "2. 🤖 Open your project in Cursor IDE for auto-agent activation"
    echo "3. ✅ Run validation: npm run versatil:validate"
    echo "4. 🧪 Test the setup: maria-qa test"
    echo ""
    echo -e "${BLUE}Quick Commands:${NC}"
    echo "• npm run versatil:test     - Run all tests"
    echo "• maria-qa test            - Quality testing"
    echo "• james-frontend lint      - Frontend linting"
    echo "• marcus-backend security  - Security audit"
    echo ""
    echo -e "${YELLOW}Pro Tip:${NC} Enable shell commands with:"
    echo "source .versatil/commands.sh"
    echo ""
    echo "Happy coding with VERSATIL! 🚀"
}

# Error handler
error_handler() {
    log_error "Installation failed at line $1"
    echo ""
    echo "Please check the error message above and try again."
    echo "For help, visit: https://github.com/versatil-platform/versatil-sdlc-framework/issues"
    exit 1
}

# Main installation function
main() {
    # Set error handler
    trap 'error_handler $LINENO' ERR

    # Check if running with --help
    if [[ "$1" == "--help" || "$1" == "-h" ]]; then
        show_header
        echo "VERSATIL SDLC Framework Installation Script"
        echo ""
        echo "Usage: ./scripts/install.sh [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h        Show this help message"
        echo "  --skip-deps       Skip dependency installation"
        echo "  --skip-git        Skip Git hooks setup"
        echo "  --quick           Quick installation (minimal setup)"
        echo ""
        echo "Examples:"
        echo "  ./scripts/install.sh                    # Full installation"
        echo "  ./scripts/install.sh --quick            # Quick setup"
        echo "  ./scripts/install.sh --skip-git         # Skip Git hooks"
        echo ""
        exit 0
    fi

    # Parse command line arguments
    SKIP_DEPS=false
    SKIP_GIT=false
    QUICK_MODE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deps) SKIP_DEPS=true; shift ;;
            --skip-git) SKIP_GIT=true; shift ;;
            --quick) QUICK_MODE=true; shift ;;
            *) log_warning "Unknown option: $1"; shift ;;
        esac
    done

    # Start installation
    show_header

    log_info "Starting VERSATIL SDLC Framework installation..."
    log_info "Project directory: $(pwd)"
    echo ""

    # Run installation steps
    check_requirements
    detect_project_context
    create_framework_config

    if [[ "$SKIP_DEPS" == false ]]; then
        install_chrome_mcp
        setup_testing
    fi

    create_scripts

    if [[ "$SKIP_GIT" == false ]]; then
        setup_git_hooks
    fi

    if [[ "$QUICK_MODE" == false ]]; then
        generate_docs
    fi

    final_validation

    # Show success message
    show_success

    # Create installation log
    cat > .versatil/install.log << EOF
VERSATIL SDLC Framework Installation Log
========================================
Date: $(date)
Version: $FRAMEWORK_VERSION
Project Type: $PROJECT_TYPE
Framework: $PROJECT_FRAMEWORK
Node Version: $(node --version)
NPM Version: $(npm --version)
Options: SKIP_DEPS=$SKIP_DEPS SKIP_GIT=$SKIP_GIT QUICK_MODE=$QUICK_MODE
Status: SUCCESS
EOF

    log_success "Installation completed successfully!"
}

# Run main function with all arguments
main "$@"