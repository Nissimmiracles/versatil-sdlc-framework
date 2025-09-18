# 🤝 Contributing to VERSATIL SDLC Framework

Welcome to the VERSATIL SDLC Framework community! We're excited that you're interested in contributing to the future of AI-native development.

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Use our [bug report template](https://github.com/MiraclesGIT/versatil-sdlc-framework/issues/new?template=bug_report.yml)
- Include detailed reproduction steps
- Specify framework version and environment
- Attach relevant logs and error messages

### ✨ Feature Requests
- Use our [feature request template](https://github.com/MiraclesGIT/versatil-sdlc-framework/issues/new?template=feature_request.yml)
- Describe the problem and proposed solution
- Include real-world use cases
- Consider implementation complexity

### 🤖 New Agent Requests
- Use our [agent request template](https://github.com/MiraclesGIT/versatil-sdlc-framework/issues/new?template=agent_request.yml)
- Define agent specialization and responsibilities
- Specify auto-activation triggers
- Describe collaboration with existing agents

### 📖 Documentation Improvements
- Fix typos and clarify instructions
- Add examples and use cases
- Improve setup and installation guides
- Create tutorials and best practices

### 💻 Code Contributions
- Fix bugs and implement features
- Add new BMAD agents
- Enhance MCP integration
- Improve CLI tools and automation

## 🚀 Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/versatil-sdlc-framework.git
cd versatil-sdlc-framework
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build and Test
```bash
# Build the framework
npm run build

# Run linting
npm run lint

# Run tests
npm test

# Full validation
npm run validate
```

### 4. Set Up Development Environment
```bash
# Link for local testing
npm link

# Test CLI commands
versatil health
versatil-mcp --help
```

## 🏗️ Development Workflow

### Branch Naming
- `feature/agent-name` - New agent implementations
- `feature/mcp-enhancement` - MCP integration improvements
- `fix/bug-description` - Bug fixes
- `docs/topic` - Documentation updates
- `refactor/component` - Code refactoring

### Commit Messages
We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(agents): add DevOps-Dan agent for infrastructure management
fix(mcp): resolve Claude Desktop connection issues
docs(readme): update installation instructions
refactor(quality-gates): improve error handling
```

### Code Standards
- **TypeScript**: All new code must be TypeScript
- **ESLint**: Follow existing linting rules
- **Testing**: Include tests for new features
- **Documentation**: Update relevant docs

### Quality Gates
All contributions must pass:
- ✅ TypeScript compilation
- ✅ ESLint validation
- ✅ Test suite
- ✅ Build process
- ✅ Framework health check

## 🧪 Testing Guidelines

### Unit Tests
```bash
# Run specific test
npm test -- --testNamePattern="Agent Dispatcher"

# Run with coverage
npm run test:coverage
```

### Integration Testing
```bash
# Test framework integration
npm run test:integration

# Test CLI commands
versatil init --dry-run
versatil health
```

### MCP Integration Testing
```bash
# Test MCP server
versatil-mcp /path/to/test/project

# Test with Claude Desktop
# (Configure Claude Desktop and test functionality)
```

## 🤖 Agent Development

### Creating New Agents

1. **Define Agent Specification**
   ```typescript
   interface NewAgentSpec {
     name: string;
     role: string;
     specialization: string;
     triggers: AgentTrigger;
     collaborators: string[];
     mcpTools: string[];
   }
   ```

2. **Implement Agent Class**
   ```typescript
   export class NewAgent extends BaseAgent {
     constructor() {
       super('new-agent', 'Specialization');
     }

     async activate(context: AgentActivationContext) {
       // Implementation
     }
   }
   ```

3. **Add Auto-Activation Rules**
   Update `.cursorrules` with file patterns and keywords

4. **Register with Dispatcher**
   Add agent to `agent-dispatcher.ts`

5. **Add Quality Gates**
   Define agent-specific quality checks

6. **Create Documentation**
   Document agent capabilities and usage

### Agent Guidelines
- **Single Responsibility**: Each agent should have a clear specialization
- **Collaboration**: Define how agents work together
- **Context Awareness**: Use enhanced context validation
- **Emergency Response**: Handle critical situations appropriately
- **Quality Focus**: Maintain high standards for deliverables

## 🔗 MCP Integration Development

### Adding New MCP Tools
1. Define tool schema in `mcp-server.ts`
2. Implement tool handler
3. Add resource access if needed
4. Update documentation
5. Test with Claude Desktop

### MCP Best Practices
- **Resource Efficiency**: Limit file access appropriately
- **Security**: Validate all inputs and paths
- **Error Handling**: Provide clear error messages
- **Documentation**: Include usage examples

## 📋 Pull Request Process

### Before Submitting
- [ ] Run `npm run validate` successfully
- [ ] Update documentation for new features
- [ ] Add tests for new functionality
- [ ] Follow commit message conventions
- [ ] Rebase on latest main branch

### PR Template
Your pull request should include:
- **Description**: What does this PR do?
- **Motivation**: Why is this change needed?
- **Testing**: How was this tested?
- **Screenshots**: For UI/UX changes
- **Breaking Changes**: Any breaking changes?
- **Checklist**: Complete the PR checklist

### Review Process
1. **Automated Checks**: CI/CD pipeline validation
2. **Code Review**: At least one maintainer review
3. **Testing**: Manual testing if needed
4. **Documentation**: Review of docs updates
5. **Merge**: Squash and merge when approved

## 🎖️ Recognition

### Contributors
All contributors are recognized in:
- `CONTRIBUTORS.md` file
- GitHub contributors page
- Release notes for significant contributions

### Maintainers
Active contributors may be invited to become maintainers with:
- Commit access to repository
- Ability to review and merge PRs
- Participation in framework roadmap decisions

## 📞 Getting Help

### Community Support
- **Discussions**: [GitHub Discussions](https://github.com/MiraclesGIT/versatil-sdlc-framework/discussions)
- **Discord**: Join our community chat
- **Office Hours**: Weekly maintainer availability

### Development Questions
- **Technical Issues**: Create detailed GitHub issues
- **Architecture Decisions**: Start a discussion thread
- **Implementation Help**: Ask in community discussions

### Emergency Support
For critical issues affecting production deployments:
- **Emergency Issues**: Use priority labels
- **Security Vulnerabilities**: Email security@versatil-platform.com
- **Urgent Fixes**: Tag maintainers directly

## 🎯 Project Roadmap

### Current Focus
- Expanding BMAD agent ecosystem
- Enhanced MCP integration capabilities
- Enterprise-grade security features
- Performance optimization

### Future Plans
- AI-powered code generation agents
- Multi-repository project support
- Advanced analytics and metrics
- Cloud-native deployment options

### How to Contribute to Roadmap
- **Feature Discussions**: Participate in roadmap discussions
- **User Research**: Share your use cases and needs
- **Prototype Development**: Build proof-of-concept features
- **Community Feedback**: Provide input on proposed features

## 📜 Code of Conduct

### Our Standards
- **Be Respectful**: Treat all community members with respect
- **Be Inclusive**: Welcome diverse perspectives and backgrounds
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Professional**: Maintain professional communication

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or inflammatory comments
- Sharing others' private information
- Other unprofessional conduct

### Enforcement
- **First Offense**: Warning and education
- **Repeat Offenses**: Temporary restrictions
- **Serious Violations**: Permanent bans

Report issues to conduct@versatil-platform.com

## 🏆 Thank You!

The VERSATIL SDLC Framework exists because of amazing contributors like you. Whether you're:
- Reporting bugs
- Suggesting features
- Writing code
- Improving documentation
- Helping other users

**You're making AI-native development better for everyone!**

---

🤖 **Ready to contribute? Start by exploring our [open issues](https://github.com/MiraclesGIT/versatil-sdlc-framework/issues) or join our [community discussions](https://github.com/MiraclesGIT/versatil-sdlc-framework/discussions)!**