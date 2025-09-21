# VERSATIL SDLC Framework - Cursor Framework Update Context Guide

## 🎯 Framework Update Overview

This guide provides comprehensive context for Cursor AI when performing framework updates on the VERSATIL SDLC Framework with Enhanced BMAD methodology and Chrome MCP integration.

---

## 📋 Current Framework State

### Core Technologies
- **Framework**: VERSATIL SDLC with Enhanced BMAD methodology
- **TypeScript**: 5.0+ with strict mode enabled
- **Testing**: Hybrid Jest (unit) + Playwright (e2e) with Chrome MCP
- **Node.js**: 18.0+
- **Package Manager**: npm
- **MCP Integration**: Model Context Protocol SDK 0.5.0

### Agent Configuration
- **Enhanced Maria-QA**: Quality assurance lead with Chrome MCP integration
- **Enhanced James-Frontend**: Frontend specialist with navigation validation
- **Enhanced Marcus-Backend**: Backend specialist with API integration validation
- **Security-Sam**: Security and compliance specialist
- **DevOps-Dan**: Infrastructure and deployment specialist
- **Sarah-PM**: Project manager and coordinator
- **Alex-BA**: Business analyst and requirements expert
- **Dr.AI-ML**: Machine learning and AI specialist

---

## 🔧 Configuration Files Structure

### Primary Configurations
```
VERSATIL SDLC FW/
├── .cursor/
│   ├── settings.json          # Cursor-specific settings
│   └── framework-update-context.md
├── .vscode/
│   ├── settings.json          # VSCode compatibility
│   └── extensions.json        # Recommended extensions
├── playwright.config.ts       # Playwright + Chrome MCP config
├── jest.config.js             # Jest unit testing config
├── tsconfig.json              # Main TypeScript config
├── tests/tsconfig.json        # Test-specific TypeScript config
├── .cursorrules               # BMAD agent activation rules
└── CLAUDE.md                  # BMAD methodology configuration
```

### Key Settings

#### Cursor AI Settings (`.cursor/settings.json`)
- Model: claude-3.5-sonnet
- TypeScript SDK: workspace version
- Path intellisense with BMAD structure mapping
- Chrome MCP integration enabled
- BMAD agent auto-activation

#### TypeScript Configuration (Enhanced)
- Strict mode: enabled
- Target: ES2022
- Enhanced path mapping for BMAD structure
- Playwright types included
- Project references for test separation

---

## 🧪 Testing Framework Configuration

### Hybrid Testing Approach

#### Jest (Unit Testing)
```javascript
// Coverage thresholds enhanced for BMAD compliance
coverageThreshold: {
  global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  'src/agents/': { branches: 85, functions: 85, lines: 85, statements: 85 },
  'src/testing/': { branches: 90, functions: 90, lines: 90, statements: 90 }
}
```

#### Playwright (E2E Testing with Chrome MCP)
```typescript
// Primary projects for comprehensive testing
projects: [
  'chromium-desktop',      // Main desktop testing
  'chromium-mobile',       // Mobile testing
  'visual-regression',     // Screenshot comparison
  'performance',           // Performance monitoring
  'accessibility',         // A11y compliance
  'security',              // Security validation
  'bmad-integration'       // BMAD methodology testing
]
```

### Chrome MCP Integration
- Browser: Chromium with enhanced flags
- Visual regression: threshold 0.1%
- Performance budget: enforced
- Accessibility: WCAG 2.1 AA compliance
- Security: headers validation and vulnerability scanning

---

## 🎯 BMAD Methodology Integration

### Agent Activation Rules (`.cursorrules`)

#### Enhanced Maria-QA Triggers
```yaml
enhanced_maria_files:
  - "*.config.*"         # Configuration files
  - "*.tsx" / "*.jsx"    # React components (for route validation)
  - "*.ts" / "*.js"      # All TypeScript/JavaScript files
  - "*router*"           # Router configuration
  - "*navigation*"       # Navigation configuration
```

#### Critical Detection Patterns
```yaml
critical_detection_patterns:
  debugging_code_production:
    - "console.log"
    - "debugger;"
    - "style.*color.*purple.*test"

  route_navigation_mismatches:
    - "Route.*path.*element.*div.*style"
    - "navigation.*mismatch"

  configuration_inconsistencies:
    - "localhost.*hardcoded"
    - "api.*hardcoded"
```

### Quality Gates
- Configuration consistency: 100%
- Navigation integrity: 100%
- Test coverage: 80%+ (85%+ for agents, 90%+ for testing)
- Zero debugging code in production
- WCAG 2.1 AA accessibility compliance

---

## 🚀 Framework Update Instructions for Cursor AI

### When Updating Dependencies

1. **Always Preserve BMAD Structure**
   ```bash
   # Maintain agent-specific configurations
   # Preserve Chrome MCP integration
   # Keep quality gates intact
   ```

2. **TypeScript Updates**
   - Maintain strict mode settings
   - Preserve enhanced path mappings
   - Keep Playwright type integration
   - Update incrementally with validation

3. **Testing Framework Updates**
   - Maintain hybrid Jest + Playwright approach
   - Preserve Chrome MCP configuration
   - Keep coverage thresholds (80%+ global, 85%+ agents)
   - Validate all test projects work

4. **Chrome MCP Updates**
   - Ensure Chromium compatibility
   - Maintain visual regression baselines
   - Preserve performance budgets
   - Keep accessibility standards

### Configuration Validation Checklist

#### Pre-Update Validation
- [ ] All tests passing (Jest + Playwright)
- [ ] TypeScript compilation successful
- [ ] Chrome MCP server connectivity
- [ ] BMAD agent activation working
- [ ] Quality gates enforced

#### Post-Update Validation
- [ ] All dependencies resolved
- [ ] TypeScript strict mode still enabled
- [ ] Hybrid testing framework functional
- [ ] Chrome MCP integration working
- [ ] BMAD methodology preserved
- [ ] Quality thresholds maintained

### Emergency Rollback Procedure

If framework update fails:
```bash
# Rollback to backup branch
git checkout backup/pre-framework-update

# Restore working configuration
git checkout main
git reset --hard backup/pre-framework-update

# Validate restoration
npm test
npx playwright test --project=chromium-desktop
```

---

## 🔍 Troubleshooting Common Issues

### TypeScript Compilation Errors
1. Check strict mode compatibility
2. Validate path mappings
3. Ensure Playwright types available
4. Verify test file exclusions

### Jest + Playwright Conflicts
1. Ensure test file patterns don't overlap
2. Check Jest excludes Playwright files
3. Validate global setup/teardown
4. Verify coverage collection

### Chrome MCP Issues
1. Check Chromium installation
2. Validate MCP server configuration
3. Ensure performance budgets realistic
4. Verify accessibility audit setup

### BMAD Agent Activation Problems
1. Check `.cursorrules` syntax
2. Validate file pattern matching
3. Ensure agent context preservation
4. Verify quality gates configuration

---

## 📊 Performance Monitoring

### Framework Update Metrics
- TypeScript compilation time: < 30s
- Jest test execution: < 2min
- Playwright test execution: < 5min
- Chrome MCP startup: < 10s
- Agent activation time: < 2s

### Quality Metrics to Maintain
- Test coverage: 80%+ (85%+ agents, 90%+ testing)
- Performance score: 90+ (Lighthouse)
- Accessibility score: 95+ (axe)
- Security score: A+ (headers validation)
- BMAD compliance: 100%

---

## 🎛️ Development Workflow Integration

### Cursor AI Workflow
1. **Context Awareness**: Always reference this guide during updates
2. **Incremental Updates**: Update one component at a time
3. **Validation Steps**: Run tests after each change
4. **Quality Preservation**: Maintain BMAD standards throughout
5. **Documentation**: Update this guide if structure changes

### IDE Integration
- **Auto-completion**: Configured for BMAD structure
- **Type checking**: Real-time with strict mode
- **Testing**: Integrated Jest + Playwright support
- **Debugging**: Chrome DevTools integration via MCP
- **Quality**: Real-time linting and formatting

---

## 📚 Reference Documentation

### Key Files to Understand
- `CLAUDE.md`: Complete BMAD methodology configuration
- `.cursorrules`: Agent activation and collaboration rules
- `playwright.config.ts`: Chrome MCP and testing configuration
- `jest.config.js`: Unit testing and coverage configuration
- `tsconfig.json`: TypeScript strict mode and path mapping

### External Dependencies
- `@playwright/test`: E2E testing framework
- `@modelcontextprotocol/sdk`: MCP integration
- `typescript`: Strict type checking
- `jest`: Unit testing framework
- `ts-jest`: TypeScript support for Jest

---

## 🔐 Security Considerations

### Framework Update Security
- Always validate dependency sources
- Check for known vulnerabilities
- Maintain security headers validation
- Preserve authentication patterns
- Keep sensitive data out of configurations

### BMAD Security Integration
- Security-Sam agent activation for security-related changes
- Automated vulnerability scanning
- Configuration security validation
- Input validation preservation
- Secure coding practice enforcement

---

*This context guide ensures Cursor AI maintains the integrity and quality of the VERSATIL SDLC Framework during all updates while preserving the Enhanced BMAD methodology and Chrome MCP integration capabilities.*

**Framework Version**: 1.0.0
**Last Updated**: 2024-01-15
**Maintained By**: Enhanced Maria-QA & VERSATIL Team