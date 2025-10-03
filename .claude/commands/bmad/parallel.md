---
description: "Enable VERSATIL Rule 1: Parallel Task Execution"
---

Enable **VERSATIL Rule 1: Parallel Task Execution** with intelligent collision detection.

## What This Does:
Activates parallel execution of development tasks with:
- **Global max tasks**: 20 concurrent operations
- **Agent workload balancing**: Max 3 tasks per agent
- **Resource contention prevention**: File system/database locks
- **SDLC-aware orchestration**: Respects development phases
- **Real-time optimization**: Auto-scaling based on load

## Tasks That Run in Parallel:
✅ File pattern changes (component builds)
✅ Test execution across modules
✅ Security scans
✅ Documentation generation
✅ Build processes
✅ Code quality checks

## Collision Detection:
🛡️ Resource conflicts (file system, database, network)
🛡️ SDLC phase violations (testing before implementation)
🛡️ Agent overload prevention
🛡️ Dependency cycle detection

## Usage:
```bash
/parallel               # Check status
/parallel enable        # Enable parallel execution
/parallel configure     # Configure max tasks
```

## Integration:
Works with background commands (Ctrl-B) and agent coordination.

## Performance Impact:
- 3x faster development cycles
- Zero resource conflicts
- Optimal agent utilization