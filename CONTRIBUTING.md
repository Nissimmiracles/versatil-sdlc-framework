# Contributing to VERSATIL

Thank you for your interest in contributing to VERSATIL! This guide will help you get started.

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 10.17.0
- Git

### Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/versatil-sdlc-framework.git
cd versatil-sdlc-framework

# 2. Install pnpm (if not already installed)
npm install -g pnpm@10.17.0

# 3. Install dependencies
pnpm install

# 4. Build the project
pnpm run build

# 5. Run tests
pnpm test
```

---

## 📝 Development Workflow

### 1. Create a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or bug fix branch
git checkout -b fix/bug-description
```

### 2. Make Changes

```bash
# Run development build (watch mode)
pnpm run dev

# Make your changes...

# Run tests
pnpm test

# Check linting
pnpm run lint

# Fix linting issues
pnpm run lint:fix
```

### 3. Test Your Changes

```bash
# Run full test suite
pnpm run test:full

# Run specific tests
pnpm test -- path/to/test.spec.ts

# Check test coverage
pnpm run test:coverage

# Run E2E tests
pnpm run test:e2e
```

### 4. Commit Changes

We use conventional commits:

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(agents): add Dana-Database agent"
git commit -m "fix(wave-4): resolve collision detection bug"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(maria-qa): add coverage enforcement tests"
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `chore`: Maintenance tasks

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Use the PR template and fill in all sections
```

---

## 📁 Project Structure

```
versatil-sdlc-framework/
├── .claude/                  # Claude Code configuration
│   ├── agents/               # Agent definitions
│   ├── commands/             # Slash commands
│   └── skills/               # Skills library
├── src/                      # Source code
│   ├── agents/               # Agent implementations
│   ├── orchestration/        # Wave 4 coordination
│   ├── rag/                  # RAG memory system
│   └── index.ts              # Main entry point
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── docs/                     # Documentation
├── examples/                 # Example code
└── scripts/                  # Build and utility scripts
```

---

## 🧪 Testing Guidelines

### Writing Tests

```typescript
// tests/agents/alex-ba.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AlexBA } from '@/agents/alex-ba';

describe('AlexBA Agent', () => {
  let agent: AlexBA;

  beforeEach(() => {
    agent = new AlexBA();
  });

  describe('extractRequirements', () => {
    it('should extract requirements from user input', async () => {
      // Arrange
      const userInput = 'Add user authentication';

      // Act
      const requirements = await agent.extractRequirements(userInput);

      // Assert
      expect(requirements).toContain('authentication');
      expect(requirements.length).toBeGreaterThan(0);
    });
  });
});
```

### Coverage Requirements

- Minimum coverage: **80%**
- All new code must have tests
- Run `pnpm run test:coverage` before submitting PR

---

## 📊 Code Quality

### Linting

We use ESLint with TypeScript:

```bash
# Check for issues
pnpm run lint

# Auto-fix issues
pnpm run lint:fix
```

### Type Checking

```bash
# Run TypeScript compiler checks
pnpm run typecheck
```

### Formatting

We use Prettier:

```bash
# Format code
pnpm run format
```

---

## 🎯 Contribution Areas

### 1. Agents

**Creating a new agent**:

```bash
# Use code generator
pnpm exec tsx .claude/skills/code-generators/agent/generator.ts

# Follow prompts to create:
# - Agent implementation (src/agents/your-agent.ts)
# - Agent definition (.claude/agents/your-agent.md)
# - Slash command (.claude/commands/your-agent.md)
# - Tests (tests/agents/your-agent.test.ts)
```

**Agent Guidelines**:
- Clear activation triggers
- Well-documented capabilities
- Error handling
- Comprehensive tests
- Integration with OPERA workflow

### 2. Skills

**Creating a new skill**:

```bash
# Create skill directory
mkdir -p .claude/skills/your-skill

# Create skill.md
# See .claude/skills/template-skill/skill.md for template
```

**Skill Guidelines**:
- Clear use case documentation
- Code examples
- Best practices
- Common pitfalls
- Related resources

### 3. Wave 4 Patterns

**Adding coordination patterns**:

```typescript
// src/orchestration/patterns/your-pattern.ts
import { WavePattern } from '../types';

export const yourPattern: WavePattern = {
  name: 'your-pattern',
  description: 'Description of when to use this pattern',
  waves: [
    {
      id: 'wave-1',
      tasks: [...],
      parallel: false
    },
    {
      id: 'wave-2',
      tasks: [...],
      parallel: true
    }
  ]
};
```

### 4. Documentation

**Documentation priorities**:
- Accuracy over completeness
- Examples over theory
- User benefit over technical details
- Clear over clever

**Where to contribute**:
- Tutorials and guides
- API documentation
- Architecture diagrams
- Example code
- Troubleshooting guides

---

## 🐛 Reporting Bugs

### Before Reporting

1. Search [existing issues](https://github.com/Nissimmiracles/versatil-sdlc-framework/issues)
2. Update to latest version
3. Check [troubleshooting guide](docs/getting-started/troubleshooting.md)

### Bug Report Template

```markdown
**Describe the bug**
Clear and concise description.

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. Do action '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment**
- VERSATIL version: [e.g., v7.16.2]
- Node.js version: [e.g., v20.10.0]
- pnpm version: [e.g., 10.17.0]
- OS: [e.g., macOS 14.1]

**Logs**
Attach relevant logs (see ~/.versatil/logs/)

**Additional context**
Any other relevant information.
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature.

**Use Case**
When and why would this be useful?

**Proposed Solution**
How would this work?

**Alternatives Considered**
What other approaches did you consider?

**Additional Context**
Mockups, examples, related features.
```

---

## 🎨 Design Decisions

### Code Style

- **TypeScript**: Strict mode enabled
- **Async/Await**: Prefer over promises
- **Error Handling**: Always handle errors
- **Naming**: Clear and descriptive
- **Comments**: Explain "why", not "what"

### Architecture Principles

1. **Modularity**: Single responsibility
2. **Composability**: Small, reusable pieces
3. **Testability**: Easy to test
4. **Performance**: Optimize for speed
5. **Maintainability**: Easy to understand and modify

---

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

**Positive behavior**:
- Being respectful
- Accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy

**Unacceptable behavior**:
- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Other unprofessional conduct

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report issues to: [maintainers email]

---

## 🏆 Recognition

Contributors are recognized in:
- [CHANGELOG.md](changelogs/) for each release
- README.md contributors section
- GitHub contributors page

---

## 📚 Additional Resources

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Agent Development](docs/guides/agent-development.md)
- [Testing Guide](docs/guides/testing.md)
- [pnpm Migration Guide](docs/guides/migration/npm-to-pnpm.md)

---

## ❓ Questions?

- 💬 [GitHub Discussions](https://github.com/Nissimmiracles/versatil-sdlc-framework/discussions)
- 🐛 [Issues](https://github.com/Nissimmiracles/versatil-sdlc-framework/issues)
- 📖 [Documentation](docs/README.md)

---

**Thank you for contributing to VERSATIL!** 🎉
