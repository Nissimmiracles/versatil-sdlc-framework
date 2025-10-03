---
description: "Run comprehensive framework health check and auto-fix"
---

Run the **VERSATIL Framework Doctor** to diagnose and fix issues automatically.

## What Gets Checked:
🏥 **Isolation**: Framework-project separation validation
🤖 **Agents**: All 6 BMAD agents operational
🔌 **MCP Servers**: Connection and tool availability
📊 **Rules**: Rules 1-5 configuration and enablement
✅ **Test Coverage**: 85%+ threshold validation
🔒 **Security**: Zero vulnerabilities compliance
⚙️ **Configuration**: Settings file syntax validation
📦 **Dependencies**: Package integrity and versions

## Auto-Fix Capabilities:
🔧 Recreate missing directories
🔧 Fix permission issues
🔧 Restart failed MCP servers
🔧 Update outdated dependencies
🔧 Repair broken agent configurations
🔧 Reset corrupted settings files
🔧 Clean up temporary data

## Example Output:
```
🏥 VERSATIL Framework Doctor

✅ Isolation: Framework properly isolated in ~/.versatil/
✅ Agents: All 6 BMAD agents healthy
⚠️  MCP Servers: 1 server disconnected (archon-mcp)
✅ Rules: 3/3 enabled (Parallel, Stress Test, Audit)
✅ Tests: 87% coverage (target: 85%+)
✅ Security: 0 vulnerabilities
✅ Config: All settings valid

Issues Found: 1 (MCP server disconnected)
Auto-fixable: 1

💡 Suggested Fix: Run '/doctor --fix' to restart MCP server
```

## Usage:
```bash
/doctor                         # Run health check
/doctor --fix                  # Auto-fix detected issues
/doctor --verbose              # Detailed diagnostic output
/doctor --quick                # Fast check (< 2 seconds)
```

## Integration:
Runs validation scripts:
- `npm run validate:isolation`
- `npm run healthcheck`
- Agent health checks
- MCP server status
- Rule enablement verification

## Performance:
⚡ < 5 second execution time
⚡ 95%+ issue detection accuracy
⚡ Clear, actionable output