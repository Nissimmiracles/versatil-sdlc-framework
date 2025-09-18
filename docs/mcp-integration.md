# 🔗 VERSATIL MCP Integration Guide

The VERSATIL SDLC Framework includes comprehensive **Model Context Protocol (MCP)** integration, allowing direct repository access and framework control through MCP-compatible tools like Claude Desktop.

## 🎯 What is VERSATIL MCP Integration?

VERSATIL's MCP server provides:
- **Full Repository Access**: Read any file in your project through MCP
- **Agent Control**: Activate and manage all 6 BMAD agents remotely
- **Quality Gates**: Run quality checks and view status via MCP
- **Emergency Response**: Trigger emergency protocols through MCP
- **Automation Tools**: Version management, changelog generation, backups
- **Real-time Status**: Live framework and project health monitoring

## 🚀 Quick Setup

### 1. Install VERSATIL Framework
```bash
npm install -g versatil-sdlc-framework
```

### 2. Configure Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "versatil": {
      "command": "versatil-mcp",
      "args": ["/path/to/your/project"]
    }
  }
}
```

### 3. Restart Claude Desktop

The VERSATIL MCP server will now be available in Claude Desktop!

## 🛠️ Available MCP Tools

- `versatil_analyze_project` - Analyze and recommend agents
- `versatil_activate_agent` - Control BMAD agents
- `versatil_quality_gates` - Run quality checks
- `versatil_emergency_response` - Trigger emergency protocols
- `versatil_version_bump` - Automatic version management
- `versatil_generate_changelog` - Generate changelogs
- `versatil_backup_create` - Create repository backups
- `versatil_context_validate` - Validate task clarity
- `versatil_framework_status` - Get framework status

## 📁 MCP Resources

- **Project Files**: All TypeScript, JavaScript, JSON, Markdown files
- `versatil://config` - Framework configuration
- `versatil://agents` - Active agent status
- `versatil://quality-gates` - Quality gate results
- `versatil://backup-status` - Backup system status

## 💡 Example Usage

**"Analyze my project using VERSATIL"** → Scans project, recommends agents

**"Run quality gates and show results"** → Executes all quality checks

**"Emergency response for build failure"** → Activates emergency protocols

**"Bump version based on commits"** → Analyzes commits, updates version

## 🔧 Manual Server Start

```bash
# Start MCP server for current directory
versatil-mcp

# Start for specific project
versatil-mcp /path/to/project
```

## 🔐 Security

- Access limited to specified project directory only
- No system-wide file access
- Local-only operation (no external network)
- Read/write permissions within project scope

---

🤖 **VERSATIL MCP integration provides unprecedented access to framework capabilities directly through Claude Desktop, revolutionizing AI-native development workflows.**