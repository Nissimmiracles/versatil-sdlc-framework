# Contributing to VERSATIL SDLC Framework

Thank you for your interest in contributing to the VERSATIL SDLC Framework! This document provides guidelines and information for contributors.

## 🤖 Agent-Driven Development

This project follows the **BMAD (Business-Managed Agile Development)** methodology with specialized AI agents. Understanding our agent system will help you contribute effectively.

### Our AI Agents:
- 🧪 **Maria-QA** - Quality Assurance Lead
- 🎨 **James-Frontend** - Frontend Specialist
- ⚙️ **Marcus-Backend** - Backend Expert
- 📋 **Sarah-PM** - Project Manager
- 📊 **Alex-BA** - Business Analyst
- 🤖 **Dr.AI-ML** - AI/ML Specialist

## 🚀 Getting Started

### Prerequisites
- Node.js 16.0.0 or higher
- npm 7.0.0 or higher
- Git
- Cursor IDE (recommended for optimal agent experience)

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/your-username/versatil-sdlc-framework.git
cd versatil-sdlc-framework

# Install dependencies
npm install

# Run setup validation
npm run versatil:validate

# Start development
npm run dev
```

## 📋 Contribution Types

### 🐛 Bug Fixes
1. Search existing issues to avoid duplicates
2. Create a detailed bug report using our template
3. Reference the issue in your PR
4. Ensure Maria-QA quality gates pass

### ✨ New Features
1. Discuss the feature in an issue first
2. Follow our feature request template
3. Consider which agents will be affected
4. Update documentation and tests

### 📚 Documentation
1. Keep documentation up-to-date with changes
2. Follow our documentation style guide
3. Update agent reference guides when needed

### 🧪 Testing
1. Maintain 80%+ test coverage
2. Use Chrome MCP for browser testing
3. Include accessibility and performance tests
4. Follow Maria-QA testing standards

## 🔄 Development Workflow

### Branch Naming Convention
```
feature/agent-name/feature-description
bugfix/agent-name/bug-description
docs/section-being-updated
chore/maintenance-task
```

Examples:
- `feature/maria-qa/enhanced-visual-testing`
- `bugfix/james-frontend/component-optimization`
- `docs/agent-reference-update`

### Commit Message Format
```
<type>(agent): <description>

[optional body]

🤖 Generated with VERSATIL SDLC Framework
Co-Authored-By: Claude <noreply@anthropic.com>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

Examples:
```
feat(maria-qa): add visual regression baseline update command

Adds new command to update visual test baselines after legitimate
UI changes, improving developer workflow.

🤖 Generated with VERSATIL SDLC Framework
Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🧪 Quality Standards (Maria-QA)

### Code Quality Requirements
- ✅ ESLint and Prettier compliance
- ✅ TypeScript strict mode (where applicable)
- ✅ Test coverage ≥ 80%
- ✅ No security vulnerabilities
- ✅ Performance budget compliance

### Testing Requirements
```bash
# Run all quality checks
npm run maria:test

# Individual checks
npm run lint
npm run test
npm run test:coverage
npm run maria:visual
npm run maria:performance
npm run maria:accessibility
npm run marcus:security
```

### Chrome MCP Testing
All UI changes must pass:
- Visual regression tests
- Performance budgets
- Accessibility compliance (WCAG 2.1 AA)
- Cross-browser compatibility

## 🎨 Frontend Guidelines (James-Frontend)

### Component Development
- Use TypeScript for all React components
- Follow atomic design principles
- Implement responsive design (mobile-first)
- Ensure accessibility compliance
- Include Storybook stories for complex components

### Performance Standards
- First Contentful Paint < 1.8s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- Bundle size limits enforced

### Code Style
```typescript
// Good component example
import React, { memo } from 'react';
import type { ComponentProps } from './types';

interface Props extends ComponentProps {
  variant?: 'primary' | 'secondary';
}

export const Component = memo<Props>(({
  children,
  variant = 'primary',
  ...props
}) => {
  return (
    <div className={`component component--${variant}`} {...props}>
      {children}
    </div>
  );
});

Component.displayName = 'Component';
```

## ⚙️ Backend Guidelines (Marcus-Backend)

### API Development
- Follow RESTful principles
- Include comprehensive OpenAPI documentation
- Implement proper error handling
- Use TypeScript for type safety
- Include integration tests

### Security Requirements
- Input validation and sanitization
- Authentication and authorization
- SQL injection prevention
- XSS protection
- CORS configuration
- Security headers implementation

### Database Guidelines
- Use migrations for schema changes
- Include rollback procedures
- Optimize queries for performance
- Implement proper indexing

## 📊 Business Logic (Alex-BA)

### Requirements Documentation
- Use Gherkin syntax for user stories
- Include acceptance criteria
- Provide business value justification
- Map features to user personas

### User Story Format
```gherkin
Feature: User Authentication
  As a registered user
  I want to log into the application
  So that I can access my personalized dashboard

  Scenario: Successful login
    Given I have valid credentials
    When I submit the login form
    Then I should be redirected to my dashboard
```

## 🤖 AI/ML Guidelines (Dr.AI-ML)

### Model Development
- Document model architecture and decisions
- Include training and evaluation scripts
- Provide model performance metrics
- Implement model versioning
- Include data validation pipelines

### Code Standards
```python
# Good ML code example
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

class VersatilDataProcessor(BaseEstimator, TransformerMixin):
    """Data preprocessing pipeline for VERSATIL models."""

    def __init__(self, feature_columns: List[str]):
        self.feature_columns = feature_columns

    def fit(self, X: pd.DataFrame, y=None):
        # Fit preprocessing parameters
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        # Apply transformations
        return X
```

## 📋 Project Management (Sarah-PM)

### Documentation Standards
- Keep README.md current
- Update CHANGELOG.md for releases
- Maintain agent reference documentation
- Include migration guides for breaking changes

### Issue Management
- Use appropriate labels
- Assign to relevant agents
- Link related issues and PRs
- Update project boards

## 🔍 Code Review Process

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests pass and coverage is maintained
- [ ] Documentation is updated
- [ ] Breaking changes are documented
- [ ] Performance impact is acceptable
- [ ] Security considerations are addressed
- [ ] Accessibility requirements are met

### Agent-Specific Reviews
- **Maria-QA**: Quality and testing standards
- **James-Frontend**: UI/UX and performance
- **Marcus-Backend**: Security and architecture
- **Sarah-PM**: Documentation and process
- **Alex-BA**: Business logic and requirements
- **Dr.AI-ML**: Model quality and data handling

## 🚀 Release Process

### Version Numbering
We follow Semantic Versioning (SemVer):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number bumped
- [ ] GitHub release created
- [ ] NPM package published
- [ ] Docker images updated (if applicable)

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers get started
- Celebrate contributions

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Pull Requests**: Code contributions and reviews

## 📚 Resources

### Documentation
- [Getting Started Guide](docs/getting-started.md)
- [Agent Reference](docs/agent-reference.md)
- [Chrome MCP Integration](docs/mcp-integration.md)

### Tools and Setup
- [Cursor IDE](https://cursor.sh/) - Recommended IDE
- [Chrome MCP](https://github.com/modelcontextprotocol/chrome) - Testing framework
- [Playwright](https://playwright.dev/) - E2E testing

### Learning Resources
- [BMAD Methodology](CLAUDE.md)
- [Agent Collaboration Patterns](docs/agent-reference.md#collaboration-patterns)
- [Quality Gates](docs/getting-started.md#quality-gates)

## ❓ Getting Help

### Before Asking for Help
1. Check existing documentation
2. Search GitHub issues
3. Review the troubleshooting guide
4. Run `npm run versatil:validate`

### How to Ask for Help
1. Provide clear problem description
2. Include environment details
3. Share relevant error messages
4. Mention which agents are involved

### Response Time Expectations
- Bug reports: 1-3 business days
- Feature requests: 1 week
- Questions: 1-2 business days
- Security issues: Same day

---

**Thank you for contributing to VERSATIL SDLC Framework!**

Your contributions help advance AI-native development practices and benefit the entire developer community.

🤖 Generated with VERSATIL SDLC Framework