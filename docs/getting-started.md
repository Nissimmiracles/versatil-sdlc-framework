# Getting Started with VERSATIL SDLC Framework

Welcome to the VERSATIL SDLC Framework! This guide will help you get up and running with AI-native development using the BMAD methodology and specialized agents.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16.0.0 or higher
- **npm** 7.0.0 or higher
- **Git** (recommended)
- **Cursor IDE** (for optimal agent experience)

### Installation Options

#### Option 1: NPM Installation (Recommended)

```bash
# Install globally
npm install -g versatil-sdlc-framework

# Initialize in your project
npx versatil-sdlc init
```

#### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/versatil-platform/versatil-sdlc-framework.git
cd versatil-sdlc-framework

# Run installation script
./scripts/install.sh
```

#### Option 3: Quick Template

```bash
# Create from template
npx create-versatil-project my-app
cd my-app

# Start developing
npm run dev
```

## 🎯 First Steps

### 1. Verify Installation

```bash
# Check if everything is working
npm run versatil:validate

# Should show all agents configured ✅
```

### 2. Meet Your AI Team

The VERSATIL framework provides 6 specialized agents:

| Agent | Role | When They Help |
|-------|------|----------------|
| **🧪 Maria-QA** | Quality Assurance Lead | Testing, bug detection, quality gates |
| **🎨 James-Frontend** | Frontend Specialist | React/Vue, UI/UX, performance |
| **⚙️ Marcus-Backend** | Backend Expert | APIs, databases, security |
| **📋 Sarah-PM** | Project Manager | Planning, documentation, coordination |
| **📊 Alex-BA** | Business Analyst | Requirements, user stories |
| **🤖 Dr.AI-ML** | AI/ML Specialist | Machine learning, data science |

### 3. Open in Cursor IDE

For the best experience, open your project in Cursor IDE:

```bash
cursor .
```

The agents will automatically activate based on the files you're working on!

## 🔥 Your First AI-Assisted Development Session

### Example: Building a Login Feature

Let's walk through creating a login feature with agent assistance:

#### Step 1: Requirements (Alex-BA Activates)

Create a file: `requirements/login-feature.md`

```markdown
# User Login Feature

**User Story**: As a user, I want to log into the application so that I can access my personalized dashboard.

**Acceptance Criteria**:
- User can enter email and password
- System validates credentials
- Successful login redirects to dashboard
- Failed login shows error message
- Password reset option available
```

> 📊 **Alex-BA** automatically activates when you create requirement files and helps refine user stories.

#### Step 2: API Design (Marcus-Backend Activates)

Create: `server/routes/auth.api.js`

```javascript
const express = require('express');
const router = express.Router();

// Marcus-Backend: Secure authentication endpoint
router.post('/login', async (req, res) => {
  // Implementation here
});

module.exports = router;
```

> ⚙️ **Marcus-Backend** activates for API files and suggests security best practices.

#### Step 3: Frontend Component (James-Frontend Activates)

Create: `src/components/LoginForm.jsx`

```jsx
import React, { useState } from 'react';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  // Component implementation
  return <form>...</form>;
};

export default LoginForm;
```

> 🎨 **James-Frontend** activates for React components and suggests UI/UX improvements.

#### Step 4: Testing (Maria-QA Activates)

Create: `tests/auth.test.js`

```javascript
describe('Authentication', () => {
  it('should allow user login with valid credentials', async () => {
    // Test implementation
  });
});
```

> 🧪 **Maria-QA** activates for test files and ensures comprehensive coverage.

#### Step 5: Documentation (Sarah-PM Activates)

Update: `README.md`

```markdown
## Authentication

The login feature supports...
```

> 📋 **Sarah-PM** activates for documentation and helps coordinate the project.

## 🎛️ Agent Commands

Each agent comes with specialized commands:

### Maria-QA Commands
```bash
npm run maria:test          # Run all tests
npm run maria:visual        # Visual regression tests
npm run maria:performance   # Performance testing
npm run maria:accessibility # Accessibility audit
npm run maria:security      # Security scan
```

### James-Frontend Commands
```bash
npm run james:lint          # Code linting & formatting
npm run james:build         # Production build
npm run james:optimize      # Bundle analysis
npm run james:component     # Generate component
```

### Marcus-Backend Commands
```bash
npm run marcus:security     # Security audit
npm run marcus:api          # API documentation
npm run marcus:db           # Database operations
npm run marcus:docker       # Container management
```

## 🚦 Quality Gates

VERSATIL enforces quality at every step:

### Automatic Quality Checks
- **Code Reviews**: Maria-QA reviews all changes
- **Test Coverage**: Minimum 80% coverage required
- **Performance**: Core Web Vitals monitoring
- **Security**: Vulnerability scanning
- **Accessibility**: WCAG 2.1 AA compliance

### Quality Gate Commands
```bash
# Check all quality gates
npm run versatil:test

# Individual quality checks
npm run maria:coverage      # Test coverage report
npm run james:lighthouse    # Performance audit
npm run marcus:snyk         # Security vulnerability scan
```

## 🔧 Customization

### Agent Activation Rules

Edit `.cursorrules` to customize when agents activate:

```yaml
# Custom activation rules
maria-qa:
  patterns: ["*.test.js", "**/__tests__/**"]
  keywords: ["test", "spec", "coverage"]
  auto_activate: true

james-frontend:
  patterns: ["*.jsx", "*.tsx", "components/**"]
  keywords: ["component", "react", "ui"]
  auto_activate: true
```

### Quality Standards

Configure quality thresholds in `.versatil/project-config.json`:

```json
{
  "quality_gates": {
    "test_coverage": 85,
    "performance_score": 90,
    "accessibility_score": 95,
    "security_vulnerabilities": 0
  }
}
```

## 🚀 Advanced Usage

### Multi-Agent Collaboration

For complex features, agents work together:

```bash
# Coordinate full-stack feature development
npm run versatil:collaborate -- "user authentication system"
```

This activates multiple agents in sequence:
1. **Alex-BA**: Requirements analysis
2. **Sarah-PM**: Project planning
3. **Marcus-Backend**: API development
4. **James-Frontend**: UI implementation
5. **Maria-QA**: Testing & validation

### Chrome MCP Testing

VERSATIL uses Chrome MCP as the primary testing framework:

```bash
# Visual regression testing
npm run maria:visual

# Performance testing
npm run maria:performance -- --url=http://localhost:3000

# Accessibility testing
npm run maria:a11y -- --standard=WCAG21AA
```

### Context Preservation

Agents maintain context across switches:

```bash
# Manual agent handoff with context
versatil handoff james-frontend maria-qa --context="login component ready for testing"
```

## 📊 Monitoring & Analytics

### Real-time Dashboard

Access the VERSATIL dashboard:

```bash
npm run versatil:dashboard
```

View:
- Agent activity and performance
- Quality metrics and trends
- Code coverage and test results
- Performance budgets and violations

### Quality Reports

Generate comprehensive reports:

```bash
# Generate quality report
npm run maria:report

# Generate performance report
npm run james:report

# Generate security report
npm run marcus:report
```

## 🛠️ Project Templates

### Basic Template
```bash
npx create-versatil-project my-app --template=basic
```
- Express.js backend
- Vanilla JavaScript frontend
- Jest + Playwright testing
- Basic CI/CD setup

### React Template
```bash
npx create-versatil-project my-app --template=react
```
- React 18 + TypeScript
- Express.js API
- Comprehensive testing suite
- Advanced performance monitoring

### Enterprise Template
```bash
npx create-versatil-project my-app --template=enterprise
```
- Microservices architecture
- Docker containerization
- Advanced monitoring & logging
- Multi-environment support

## 🔍 Troubleshooting

### Common Issues

#### Agent Not Activating
```bash
# Check agent configuration
npm run versatil:agents

# Validate setup
npm run versatil:validate

# Reset configuration
npm run versatil:reset
```

#### Chrome MCP Issues
```bash
# Verify Chrome MCP installation
chrome-mcp --version

# Reinstall Chrome MCP
npm install -g @modelcontextprotocol/server-chrome
```

#### Test Failures
```bash
# Debug test issues
npm run maria:debug

# Update test baselines
npm run maria:baseline-update

# Run tests in watch mode
npm run maria:watch
```

### Getting Help

1. **Documentation**: Check the [full documentation](../README.md)
2. **GitHub Issues**: [Report bugs](https://github.com/versatil-platform/versatil-sdlc-framework/issues)
3. **Discussions**: [Community support](https://github.com/versatil-platform/versatil-sdlc-framework/discussions)
4. **Examples**: Browse the `/examples` directory

## 📚 Next Steps

1. **Explore Examples**: Check out the `/examples` directory for complete projects
2. **Read Agent Guides**: Learn more about each agent in the [Agent Reference](agent-reference.md)
3. **Configure CI/CD**: Set up automated testing and deployment
4. **Join Community**: Connect with other VERSATIL developers

## 🎉 You're Ready!

Congratulations! You're now ready to experience AI-native development with VERSATIL.

Remember:
- Agents activate automatically based on your work
- Quality gates ensure high standards
- Context preservation maintains workflow continuity
- Chrome MCP provides comprehensive testing

Happy coding with your AI team! 🚀

---

**Need more help?** Check out our [comprehensive documentation](../README.md) or join our [community discussions](https://github.com/versatil-platform/versatil-sdlc-framework/discussions).