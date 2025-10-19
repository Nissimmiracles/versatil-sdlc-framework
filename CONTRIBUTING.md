# Contributing to VERSATIL SDLC Framework

🎉 **Thank you for your interest in contributing to VERSATIL SDLC Framework!**

We're building the world's first AI-Native SDLC framework that achieves zero context loss through intelligent agent orchestration. Your contributions help make this revolutionary development tool even better.

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

### 📸 Visual Documentation (Screenshots & Diagrams)
- Add screenshots showing agents in action
- Create or update Mermaid diagrams
- Record demo videos
- Design infographics for complex concepts

### 💻 Code Contributions
- Fix bugs and implement features
- Add new OPERA agents
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

---

## 📸 Visual Documentation Guidelines

Visual documentation (screenshots, diagrams, videos) helps users understand VERSATIL faster. Follow these guidelines when contributing visual assets.

### Screenshots

**Where to Save**:
```bash
docs/screenshots/
├── agent-activation-example.png
├── dashboard-view.png
├── statusline-progress.png
├── quality-gates-blocking.png
└── three-tier-parallel-work.png
```

**Naming Convention**:
- Use kebab-case: `agent-activation-example.png`
- Be descriptive: `maria-qa-coverage-report.png` (not `screenshot1.png`)
- Include agent name if relevant: `james-frontend-accessibility-check.png`

**How to Capture**:

1. **macOS**:
   ```bash
   # Capture entire screen
   Command + Shift + 3

   # Capture selection
   Command + Shift + 4

   # Capture window (then click window)
   Command + Shift + 4, then Space
   ```

2. **Cursor IDE Built-in**:
   - Use Cursor's built-in screenshot tool (if available)
   - Automatically saves to clipboard

3. **Windows**:
   ```bash
   # Snipping Tool or Windows + Shift + S
   ```

**What to Capture**:
- ✅ Agent activation in terminal/statusline
- ✅ Dashboard showing active agents
- ✅ Quality gates blocking a commit
- ✅ Code with inline agent suggestions
- ✅ Three-tier parallel execution visualization
- ✅ RAG memory search results
- ❌ Screenshots with sensitive data (API keys, user data, etc.)
- ❌ Screenshots with cluttered/messy backgrounds

**Image Requirements**:
- **Format**: PNG (lossless) or JPG (for photos)
- **Size**: Max 2 MB (optimize with ImageOptim, TinyPNG, or similar)
- **Resolution**: 1920x1080 or smaller (readable on most screens)
- **Annotations**: Use red boxes/arrows to highlight important areas (optional)

**Embedding in Markdown**:
```markdown
# Direct image embed
![Agent Activation](../screenshots/agent-activation-example.png)

# With alt text for accessibility
![Maria-QA running test coverage analysis showing 85% coverage](../screenshots/maria-qa-coverage.png)

# With caption
<figure>
  <img src="../screenshots/dashboard-view.png" alt="VERSATIL Dashboard showing 3 active agents">
  <figcaption>VERSATIL Dashboard with Maria-QA, James-Frontend, and Marcus-Backend active</figcaption>
</figure>
```

---

### Mermaid Diagrams

**Where to Save**:
```bash
docs/diagrams/
├── every-flywheel.mmd
├── 4-step-workflow.mmd
├── time-savings.mmd
├── three-tier-parallel.mmd
├── agent-activation.mmd
└── README.md (diagram documentation)
```

**Creating New Diagrams**:

1. **Write Mermaid Syntax**:
   ```mermaid
   flowchart LR
       A[Start] --> B[Process]
       B --> C[End]
   ```

2. **Preview on mermaid.live**:
   - Go to [mermaid.live](https://mermaid.live/)
   - Paste your diagram code
   - See instant preview
   - Export as PNG/SVG if needed

3. **Save to `docs/diagrams/`**:
   ```bash
   # Save as .mmd file
   echo "flowchart LR..." > docs/diagrams/my-diagram.mmd
   ```

4. **Embed in Documentation**:
   ```markdown
   ```mermaid
   flowchart LR
       A[Start] --> B[Process]
       B --> C[End]
   \```
   ```
   (GitHub renders Mermaid automatically in README.md)

**Diagram Best Practices**:
- ✅ Use consistent colors (see [docs/diagrams/README.md](docs/diagrams/README.md))
- ✅ Keep diagrams simple (max 15 nodes)
- ✅ Add time estimates where relevant (e.g., "⏱️ 30 minutes")
- ✅ Use emoji for agent identification (🎨 James, ⚙️ Marcus)
- ✅ Test on both light and dark backgrounds
- ❌ Don't make diagrams too complex (split into multiple)
- ❌ Don't use obscure Mermaid syntax
- ❌ Don't forget to update embeddings when diagram changes

**Color Scheme** (for consistency):
```yaml
Blue (#e3f2fd):   PLAN phase / Alex-BA
Orange (#fff3e0): ASSESS phase / Sarah-PM
Green (#e8f5e9):  WORK phase / Dana, Marcus, James
Pink (#fce4ec):   CODIFY phase / RAG updates
Purple (#f3e5f5): Individual agents / Sub-agents
Red (#ffccbc):    Quality / Testing / Maria-QA
Gray (#e0e0e0):   User actions / File edits
```

---

### Demo Videos

**Where to Save**:
- **GitHub**: Upload to GitHub Releases (for large files)
- **External**: YouTube, Vimeo (embed link in docs)
- **Small GIFs** (< 10 MB): `docs/screenshots/` directory

**Recording Tools**:
- **macOS**: QuickTime Screen Recording
- **Windows**: Xbox Game Bar (Windows + G)
- **Cross-platform**: OBS Studio (free)
- **GIFs**: Kap (macOS), ScreenToGif (Windows)

**What to Record**:
- ✅ Agent auto-activation demo (file edit → agent triggers)
- ✅ Three-tier parallel execution visualization
- ✅ Dashboard showing real-time progress
- ✅ Quality gates blocking a commit
- ✅ Full feature workflow (PLAN → ASSESS → WORK → CODIFY)

**Video Requirements**:
- **Length**: 30 seconds - 2 minutes (concise)
- **Resolution**: 1920x1080 (1080p)
- **Format**: MP4 (H.264 codec)
- **Audio**: Optional voiceover (if adding narration)
- **Captions**: Include for accessibility

**Embedding Videos**:
```markdown
# YouTube embed
[![VERSATIL Demo](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

# GIF (small files only)
![Agent Activation Demo](../screenshots/agent-activation-demo.gif)
```

---

### Visual Documentation Checklist

Before submitting visual documentation, verify:

- [ ] **Filenames** follow naming convention (kebab-case, descriptive)
- [ ] **Images** are optimized (< 2 MB)
- [ ] **Screenshots** don't contain sensitive data
- [ ] **Diagrams** use consistent color scheme
- [ ] **Diagrams** tested on mermaid.live
- [ ] **Diagrams** tested on GitHub (create PR to preview)
- [ ] **Embeddings** updated in relevant docs (README, GET_STARTED, etc.)
- [ ] **Alt text** provided for accessibility
- [ ] **License** information included (if using external images)
- [ ] **docs/diagrams/README.md** updated (if adding new diagram)

---

## 📐 Visual Documentation Resources

- **Mermaid Docs**: https://mermaid.js.org/intro/
- **Mermaid Live Editor**: https://mermaid.live/
- **GitHub Mermaid Support**: https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/
- **Image Optimization**: https://imageoptim.com/ (macOS), https://tinypng.com/ (web)
- **GIF Recording**: https://getkap.co/ (macOS), https://www.screentogif.com/ (Windows)
- **Diagram Style Guide**: [docs/diagrams/README.md](docs/diagrams/README.md)

**Questions about visual documentation?** Open a [discussion](https://github.com/MiraclesGIT/versatil-sdlc-framework/discussions) or ask in the issue tracker!
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
- **Security Vulnerabilities**: Email security@versatil.vc
- **Urgent Fixes**: Tag maintainers directly

## 🎯 Project Roadmap

### Current Focus
- Expanding OPERA agent ecosystem
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

Report issues to conduct@versatil.vc

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