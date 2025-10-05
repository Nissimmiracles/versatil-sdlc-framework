# VERSATIL Basic Project Setup

This is a basic project template configured with the VERSATIL SDLC Framework and OPERA methodology.

## 🤖 Active Agents

- **🧪 Maria-QA** - Quality Assurance Lead
- **🎨 James-Frontend** - Frontend Specialist
- **⚙️ Marcus-Backend** - Backend Expert

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run quality checks
npm run maria:test
```

## 📁 Project Structure

```
versatil-basic-project/
├── src/
│   └── index.js          # James-Frontend application
├── server.js             # Marcus-Backend Express server
├── tests/                # Maria-QA test suites
├── .cursorrules          # Auto-agent activation
├── CLAUDE.md            # OPERA methodology
└── package.json         # Dependencies & scripts
```

## 🧪 Available Commands

### Maria-QA Commands
```bash
npm run maria:test          # Run all tests
npm run maria:visual        # Visual regression tests
npm run maria:performance   # Performance testing
npm run maria:accessibility # Accessibility audit
```

### James-Frontend Commands
```bash
npm run james:lint          # Code linting & formatting
npm run james:build         # Production build
npm run james:optimize      # Bundle analysis
```

### Marcus-Backend Commands
```bash
npm run marcus:security     # Security audit
npm run marcus:api          # Start API server
npm run marcus:docker       # Docker containers
```

## 🎯 Quality Gates

- **Test Coverage**: 80% minimum
- **Performance Score**: 90+ (Lighthouse)
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: Zero critical vulnerabilities

## 🔧 Configuration

The project is pre-configured with:

- **Testing**: Jest + Playwright
- **Linting**: ESLint + Prettier
- **Security**: Helmet + CORS
- **Performance**: Lighthouse integration
- **Accessibility**: axe-core + pa11y

## 🚀 Deployment

```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

## 📚 Learn More

- [VERSATIL Framework Documentation](../../docs/)
- [OPERA Methodology](../../CLAUDE.md)
- [Agent Reference](../../docs/agent-reference.md)

## 🆘 Support

- [GitHub Issues](https://github.com/versatil-platform/versatil-sdlc-framework/issues)
- [Community Discussions](https://github.com/versatil-platform/versatil-sdlc-framework/discussions)

---

**Generated with VERSATIL SDLC Framework v1.0.0**