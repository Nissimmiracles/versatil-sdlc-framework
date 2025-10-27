# VERSATIL Visual Assets

**Visual storytelling for the OPERA methodology and context coding engine**

This directory contains all visual assets that demonstrate VERSATIL's unique capabilities. Use these to quickly understand how OPERA orchestration and the context engine work together.

---

## 🎬 Quick Tour (30 seconds)

**New to VERSATIL?** Start here:

1. **[OPERA Workflow →](opera-workflow-simple.md)** - See 8 agents orchestrate (Mermaid diagram)
2. **[Live Dashboard →](opera-dashboard.md)** - Watch a real session (ASCII art)
3. **[Before/After Code →](before-after-code.md)** - Generic AI vs VERSATIL (side-by-side)

**Result**: Understand VERSATIL's value in under 1 minute!

---

## 📊 Visual Assets

### 1. OPERA Workflow Orchestration

**[opera-workflow-simple.md](opera-workflow-simple.md)**
- **What**: Mermaid diagram showing 8 OPERA agents coordinating
- **Use case**: Understand how agents work together on a feature
- **Example**: "Add user authentication" - from request to production in 125 min
- **Key insight**: Parallel execution = 43% faster than sequential
- **Format**: Mermaid (renders natively on GitHub)

**Preview**:
```
YOU: "Add user authentication"
  ↓
Alex-BA (Planning) → Sarah-PM (Validation)
  ↓
Dana + Marcus + James (Parallel Work)
  ↓
Maria-QA (Quality Gates)
  ↓
RESULT: Production-ready in 125 min (vs 220 min sequential)
```

---

### 2. Live OPERA Dashboard

**[opera-dashboard.md](opera-dashboard.md)**
- **What**: ASCII art dashboard showing real-time agent activity
- **Use case**: See what's happening during feature development
- **Example**: Payment processing feature (45 min elapsed)
- **Key insight**: Context engine applies YOUR style automatically
- **Format**: ASCII art (works everywhere)

**Preview**:
```
╔═══════════════════════════════════════════════════════╗
║  OPERA Dashboard - Live Session                       ║
╠═══════════════════════════════════════════════════════╣
║  Feature: Add Payment Processing                      ║
║  Time: 45/120 min (62% faster!)                       ║
║                                                       ║
║  ✅ Alex-BA      Requirements extracted               ║
║  ✅ Sarah-PM     Readiness validated                  ║
║  🔄 Marcus-Back  API in progress (50% done)           ║
║  ⏳ Dana-DB      Queued                              ║
║                                                       ║
║  Context: YOUR async/await + TEAM Zod + PROJECT PCI  ║
╚═══════════════════════════════════════════════════════╝
```

---

### 3. Context Coding Engine

**[context-engine-diagram.md](context-engine-diagram.md)**
- **What**: Mermaid diagram of 3-layer context system
- **Use case**: Understand how VERSATIL learns YOUR coding style
- **Example**: Auto-detection from git → priority resolution → code generation
- **Key insight**: 96% accuracy, 88% less rework, 100% privacy
- **Format**: Mermaid + code examples

**Preview**:
```
Git History (15 sec analysis)
  ↓
Layer 1: YOUR Style (async/await, arrow functions)
Layer 2: TEAM Standards (Zod, JWT)
Layer 3: PROJECT Requirements (GDPR, WCAG)
  ↓
All 18 Agents (context-aware)
  ↓
Code Output (96% accuracy!)
```

---

### 4. Before/After Code Comparison

**[before-after-code.md](before-after-code.md)**
- **What**: Side-by-side comparison of generic AI vs VERSATIL output
- **Use case**: See the difference context makes
- **Examples**:
  - User authentication API
  - React component
  - Database query
- **Key insight**: 40 min manual rework → 0 min with VERSATIL
- **Format**: Markdown with TypeScript code blocks

**Preview**:
```typescript
// ❌ Generic AI (no context)
function createUser(req, res) {
  return User.create(req.body)
    .then(function(user) {
      return res.json(user);
    });
}

// ✅ VERSATIL (YOUR style + TEAM + PROJECT)
export const createUser = async (req: Request, res: Response) => {
  const validated = userSchema.parse(req.body);  // Team: Zod
  const user = await User.create({               // You: async/await
    ...validated,
    gdprConsent: validated.gdprConsent,          // Project: GDPR
  });
  return res.json({ user });
};
```

---

### 5. Compounding Engineering

**[compounding-effect.md](compounding-effect.md)**
- **What**: Visual progression showing 40% speed improvement by Feature 5
- **Use case**: Understand how pattern learning accelerates development
- **Example**: Auth features (User → Admin → OAuth → MFA → SSO)
- **Key insight**: Each feature stores patterns → next feature reuses them
- **Format**: Mermaid graph + effort table

**Preview**:
```
Feature 1: 125 min (baseline)
Feature 2: 104 min (17% faster)
Feature 3:  93 min (26% faster)
Feature 4:  86 min (31% faster)
Feature 5:  75 min (40% faster!) 🎯

Cumulative savings: 142 min (2.4 hours) after 5 features!
```

---

## 🎯 Use Cases

### For First-Time Visitors
**Goal**: Understand VERSATIL in 30 seconds

**Path**:
1. [OPERA Workflow](opera-workflow-simple.md) - See the big picture
2. [Before/After Code](before-after-code.md) - See the value
3. [→ Try Installation](../INSTALLATION.md)

---

### For Developers Evaluating
**Goal**: Understand how it works technically

**Path**:
1. [Context Engine](context-engine-diagram.md) - How YOUR style is detected
2. [Live Dashboard](opera-dashboard.md) - What happens during development
3. [Compounding Effect](compounding-effect.md) - Long-term benefits
4. [→ Deep Dive Docs](../VERSATIL_ARCHITECTURE.md)

---

### For Enterprise Decision Makers
**Goal**: Assess production readiness

**Path**:
1. [OPERA Workflow](opera-workflow-simple.md) - Quality gates built-in
2. [Context Engine](context-engine-diagram.md) - Privacy guarantees
3. [Compounding Effect](compounding-effect.md) - ROI calculation
4. [→ Security Policy](../../SECURITY.md)

---

### For Contributors
**Goal**: Understand architecture before contributing

**Path**:
1. [OPERA Workflow](opera-workflow-simple.md) - Agent coordination
2. [Context Engine](context-engine-diagram.md) - Context resolution
3. [→ Architecture Docs](../VERSATIL_ARCHITECTURE.md)
4. [→ Contributing Guide](../CONTRIBUTING.md)

---

## 📊 Quick Reference

| Visual | Purpose | Time | Format |
|--------|---------|------|--------|
| [OPERA Workflow](opera-workflow-simple.md) | Agent orchestration | 1 min | Mermaid |
| [Live Dashboard](opera-dashboard.md) | Real-time session | 2 min | ASCII art |
| [Context Engine](context-engine-diagram.md) | Style learning | 3 min | Mermaid + code |
| [Before/After](before-after-code.md) | Value proof | 5 min | Code comparison |
| [Compounding](compounding-effect.md) | Long-term ROI | 3 min | Graph + table |

**Total**: ~15 minutes to fully understand VERSATIL's capabilities

---

## 🎨 Format Guide

### Mermaid Diagrams
- Render natively on GitHub
- Interactive on GitHub Pages
- Accessible on all devices
- Best for: Workflows, architectures, processes

### ASCII Art Dashboards
- Work everywhere (no rendering needed)
- Terminal-friendly
- Copy-paste safe
- Best for: Live sessions, status displays

### Code Comparisons
- Side-by-side markdown
- Syntax highlighting
- Clear annotations
- Best for: Before/after, style examples

---

## 🔗 Related Documentation

### Deep Dives
- [VERSATIL Architecture](../VERSATIL_ARCHITECTURE.md) - Technical deep dive
- [Three-Layer Context System](../THREE_LAYER_CONTEXT_SYSTEM.md) - Context engine details
- [Compounding Engineering](../guides/compounding-engineering.md) - Pattern learning

### Getting Started
- [Installation Guide](../INSTALLATION.md) - MCP or CLI setup
- [Agent Reference](../agents/README.md) - All 18 agents explained
- [Examples](../../examples/) - Real-world usage

### Methodology
- [CLAUDE.md](../../CLAUDE.md) - OPERA methodology guide
- [Agent Triggers](.claude/AGENT_TRIGGERS.md) - Auto-activation patterns

---

## 🚀 Next Steps

1. **Browse visuals above** - Pick what interests you
2. **[Try installation](../INSTALLATION.md)** - 2 minutes for MCP, 5 for CLI
3. **See it live**: `versatil-daemon start` - Watch agents activate
4. **[Join discussions](https://github.com/Nissimmiracles/versatil-sdlc-framework/discussions)** - Share your experience

---

## 📝 Contributing Visuals

Want to add a visual asset?

**Guidelines**:
1. **Mermaid preferred** - GitHub renders it natively
2. **ASCII art for dashboards** - Works everywhere
3. **Keep it simple** - Focus on one concept
4. **Add to this README** - Update the index
5. **Include use case** - Who needs this and why

**Template**: See existing visuals for format examples

---

**Questions?** [Open a discussion](https://github.com/Nissimmiracles/versatil-sdlc-framework/discussions)
