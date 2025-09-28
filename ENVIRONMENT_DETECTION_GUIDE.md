# 🔍 VERSATIL v1.2.0 Automatic Environment Detection & Integration

## Overview

VERSATIL v1.2.0 can **automatically detect and integrate** with your existing Cursor development environment, preserving your current setup while adding powerful new features.

---

## 🚀 Quick Start

In your existing Cursor project, run:

```bash
# Download the detection script
curl -O https://raw.githubusercontent.com/versatil-sdlc/framework/main/detect-and-integrate.cjs

# Run detection and integration
node detect-and-integrate.cjs
```

Or if you have the VERSATIL repo cloned:

```bash
# Copy the script to your project
cp /path/to/VERSATIL-SDLC-FW/detect-and-integrate.cjs .

# Run it
node detect-and-integrate.cjs
```

---

## 🔍 What It Detects

### 1. **Cursor AI Environment**
- `.cursorrules` file
- `.cursor` directory
- `cursor.json` configuration

### 2. **Supabase Setup**
- `supabase/config.toml`
- Environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- Existing vector store setup (if any)

### 3. **Claude Integration**
- `@anthropic-ai/sdk` in package.json
- `ANTHROPIC_API_KEY` in environment
- MCP configuration

### 4. **Existing Agents**
- **agents.md format**: Markdown file with agent definitions
- **/agents folder**: Individual agent files
- **BMAD format**: Agents defined in .cursorrules

### 5. **SDLC Structure**
- requirements/
- design/
- src/
- tests/
- deploy/
- monitoring/

---

## 🛠️ What It Does

### 1. **Preserves Your Setup**
- Backs up existing .cursorrules → .cursorrules.backup
- Keeps all existing agents and configurations
- Adds features without breaking anything

### 2. **Enhances .cursorrules**
Adds these commands to your existing rules:
- `@archon <goal>` - Autonomous goal execution
- `@memory <query>` - Query learned patterns
- `@<agent> memory` - Show agent's memories
- `@introspect` - Run self-diagnostics

### 3. **Creates Integration Files**
```
.versatil/
├── integration-config.json    # Detection results
├── INTEGRATION_REPORT.md      # Detailed report
├── test-integration.js        # Test script
└── migrations/
    └── add-rag-memory.sql    # Supabase migration (if needed)
```

### 4. **Generates Migrations**
If you have Supabase but no vector store, it creates the SQL migration.

---

## 📋 Integration Scenarios

### Scenario 1: Cursor + Supabase + Basic Agents

**What you have:**
```
my-project/
├── .cursorrules
├── agents.md
├── supabase/
├── src/
└── .env.local (with Supabase keys)
```

**What VERSATIL adds:**
- RAG memory to existing Supabase
- Archon orchestration to agents
- Enhanced agent commands
- Introspective testing

### Scenario 2: BMAD in Cursor

**What you have:**
```
.cursorrules with:
- BA- (Business Analyst)
- PM- (Product Manager)
- DEV- (Developer)
- QA- (Quality Assurance)
```

**What VERSATIL adds:**
- Memory for each BMAD agent
- Goal-based orchestration
- Learning from patterns
- Autonomous execution

### Scenario 3: Custom Agent Structure

**What you have:**
```
agents/
├── code-reviewer.js
├── test-generator.js
├── security-scanner.js
└── performance-analyzer.js
```

**What VERSATIL adds:**
- Memory system to each agent
- Cross-agent learning
- Archon coordination
- Pattern recognition

---

## 🧪 Testing the Integration

After running detection, test with:

```bash
node .versatil/test-integration.js
```

This simulates:
1. Agent activation
2. Memory storage
3. Pattern learning
4. Memory recall

---

## 💡 Using Enhanced Features

### 1. **Set High-Level Goals**
Instead of:
```
@dev create user model
@dev create user controller  
@dev create user routes
@qa write tests
```

Now just:
```
@archon Build complete user management API with tests
```

### 2. **Query Learned Patterns**
```
@memory authentication best practices
@memory error handling patterns
@memory performance optimizations
```

### 3. **Agent Memory**
```
@security-scanner memory    # What vulnerabilities has it seen?
@code-reviewer memory       # What patterns has it learned?
@test-generator memory      # What test strategies work best?
```

### 4. **Continuous Improvement**
Every interaction teaches the agents:
- Successful patterns are remembered
- Mistakes are learned from
- Best practices emerge naturally

---

## 🔧 Customization

Edit `.versatil/integration-config.json` to:
- Enable/disable features
- Set memory depth
- Configure learning rate
- Adjust automation level

```json
{
  "features": {
    "rag": {
      "enabled": true,
      "memoryDepth": 100,
      "learningRate": 0.1
    },
    "archon": {
      "enabled": true,
      "autonomousMode": false,
      "requireApproval": true
    },
    "enhancedAgents": {
      "autoLearn": true,
      "shareMemories": true
    }
  }
}
```

---

## 📊 Integration Report

After detection, check `.versatil/INTEGRATION_REPORT.md` for:
- What was detected
- What was enhanced
- What needs setup
- Next steps

---

## 🚨 Troubleshooting

### Issue: "Cursor not detected"
- Ensure you have `.cursorrules` file
- Run from project root directory

### Issue: "Supabase migration needed"
- Copy `.versatil/migrations/add-rag-memory.sql`
- Run in Supabase SQL editor
- Or: `supabase db push`

### Issue: "Agents not enhanced"
- Check `.versatil/integration-config.json`
- Verify agent format detected correctly
- Run enhancement script manually

---

## 🎯 Real Example

```bash
# In your existing project
$ node detect-and-integrate.cjs

╔═══════════════════════════════════════════════════════════════╗
║          VERSATIL v1.2.0 - Environment Auto-Detection          ║
╚═══════════════════════════════════════════════════════════════╝

🔍 Scanning your existing environment...

🎯 Detecting Cursor AI...
   ✅ Cursor AI detected!

💚 Detecting Supabase...
   ✅ Supabase detected!
   🧠 Vector store already configured!

🤖 Detecting Claude integration...
   ✅ Claude SDK detected!

👥 Detecting existing agents...
   ✅ Found agents.md with 6 agents

🔄 Detecting SDLC structure...
   ✅ Found src phase
   ✅ Found tests phase

📋 Creating integration plan...

   ✅ Created .versatil/integration-config.json
   💾 Backed up existing .cursorrules
   ✅ Enhanced .cursorrules with v1.2.0 features
   ✅ Created test script

✅ Integration Complete!

🧪 Test your integration:
   node .versatil/test-integration.js

📚 Full report:
   cat .versatil/INTEGRATION_REPORT.md

🚀 Start using enhanced features in Cursor!
```

---

## 🚀 Next Steps

1. **Test the integration**: `node .versatil/test-integration.js`
2. **Read the report**: `cat .versatil/INTEGRATION_REPORT.md`
3. **Try in Cursor**: Use new @archon and @memory commands
4. **Run migrations**: If Supabase needs vector setup
5. **Start building**: Set goals and watch the magic!

---

**Your existing environment + VERSATIL v1.2.0 = Autonomous Development! 🎉**
