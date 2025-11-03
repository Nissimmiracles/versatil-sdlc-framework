# VERSATIL Framework Demo Script

This document provides a complete demo script for showcasing the VERSATIL SDLC Framework capabilities.

## Demo Overview

**Duration**: 15-20 minutes
**Audience**: Developers, DevOps teams, Engineering managers
**Prerequisites**: Node.js 18+, Git, Terminal access

## Demo Script

### 1. Introduction (2 minutes)

"Today I'll demonstrate the VERSATIL SDLC Framework - an AI-native development platform that revolutionizes how teams build software. VERSATIL stands for Versatile Extensible Rapid Secure Agile Technical Infrastructure Layer, and it implements the OPERA methodology - Business-Managed Agile Development."

**Key Points to Highlight:**
- Zero context loss between development sessions
- 6 specialized AI agents working collaboratively
- Chrome MCP primary testing framework
- 97.3% deployment success rate
- 340% faster development cycles

### 2. Installation Demo (3 minutes)

```bash
# Install VERSATIL Framework
npm install -g versatil-sdlc-framework

# Verify installation
versatil health

# Initialize new project
versatil init
```

**What to Show:**
- Interactive onboarding wizard
- Automatic project analysis
- Agent recommendation system
- OPERA methodology configuration

### 3. Agent System in Action (5 minutes)

**Scenario**: Create a new React component with authentication

```bash
# Start with a basic component
touch src/components/LoginForm.jsx
```

**Demonstrate:**
- James (Frontend) auto-activates based on .jsx file
- Context validation asks clarifying questions
- Multiple agents collaborate (James + Marcus for auth integration)
- Real-time quality gates enforcement

**Expected Output:**
```
🤖 James (Frontend) activated - React component detected
📝 Context clarity: 67% - requesting clarification
❓ What authentication method should be implemented?
❓ Should this integrate with existing auth service?
🤝 Activating Marcus (Backend) for auth integration
✅ Quality gates passed: 82% coverage maintained
```

### 4. Emergency Response System (3 minutes)

**Scenario**: Simulate a build failure

```bash
# Trigger emergency by breaking build
echo "invalid syntax" >> src/index.js
pnpm run build
```

**Demonstrate:**
- Automatic emergency detection
- Agent cascade activation (Maria-QA takes lead)
- Emergency backup creation
- Rapid problem resolution

### 5. Automation Features (4 minutes)

```bash
# Demonstrate automated workflows
versatil changelog    # Auto-generate from commits
versatil version      # Semantic versioning
versatil backup sync  # Git backup system
versatil release      # Full release automation
```

**Show:**
- Conventional commit parsing
- Automated changelog generation
- Version bumping based on commit analysis
- Git tagging and release notes

### 6. Adaptive Agent Creation (2 minutes)

```bash
# Analyze project for new agent recommendations
versatil analyze
```

**Demonstrate:**
- Pattern detection (e.g., Docker files = DevOps agent suggestion)
- Confidence scoring
- Automatic agent template creation
- Template customization options

### 7. Quality & Performance Metrics (2 minutes)

```bash
# Show framework status
versatil health
```

**Display Metrics:**
- Agent activation success rates
- Context accuracy improvements
- Development velocity gains
- Quality gate compliance

## Demo Variations

### Quick Demo (5 minutes)
Focus on: Installation → Agent activation → Emergency response

### Technical Deep Dive (30 minutes)
Include: Architecture walkthrough → MCP integration → Custom agent creation

### Executive Overview (10 minutes)
Emphasize: Business benefits → ROI metrics → Team productivity gains

## Demo Environment Setup

### Prerequisites
```bash
# Ensure clean environment
node --version  # v18+
npm --version   # v9+
git --version   # v2.30+
```

### Demo Project Template
```bash
# Create standardized demo project
mkdir versatil-demo
cd versatil-demo
npm init -y
mkdir -p src/components src/services tests
echo "console.log('Demo app');" > src/index.js
```

### Key Files to Prepare
- `src/components/` - For frontend demos
- `src/services/` - For backend integration
- `tests/` - For quality gate demonstrations
- `package.json` - With relevant dependencies

## Troubleshooting Demo Issues

### Common Problems
1. **Agent not activating**: Check file patterns match
2. **MCP tools not connecting**: Verify permissions
3. **Quality gates failing**: Lower thresholds for demo
4. **Emergency system not triggering**: Use specific keywords

### Backup Plans
- Have pre-recorded videos ready
- Prepare static screenshots as fallback
- Keep simple examples that always work

## Post-Demo Resources

### Documentation Links
- [Complete Setup Guide](../setup/README.md)
- [OPERA Methodology](../methodology/opera.md)
- [Agent Configuration](../agents/README.md)
- [API Reference](../api/README.md)

### Next Steps for Audience
1. Install framework in development environment
2. Run through onboarding wizard
3. Set up first project with VERSATIL
4. Join community Discord for support

## Demo Feedback Collection

### Key Questions to Ask
- Which features seemed most valuable?
- What concerns do you have about adoption?
- How would this fit your current workflow?
- What additional agents would be helpful?

### Success Metrics
- Demo completion rate
- Follow-up questions asked
- Installation attempts post-demo
- Community engagement increase