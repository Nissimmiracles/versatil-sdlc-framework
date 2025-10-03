# VERSATIL Background Commands (Ctrl-B)

This file documents the recommended background commands for Claude Code 2.0's Ctrl-B feature.

## Recommended Background Commands

Use **Ctrl-B** to run these commands in the background while Claude continues working:

### Test Commands
```bash
# Run test suite with coverage
npm run test:coverage

# Watch mode for tests
npm run test:watch

# Unit tests only
npm run test:unit

# E2E tests
npm run test:e2e
```

### Build Commands
```bash
# Watch mode build
npm run build:watch

# Standard build
npm run build

# TypeScript compilation
npm run dev
```

### Monitoring Commands
```bash
# Security daemon
npm run security:start

# Edge function monitoring
npm run edge:monitor

# Health check monitoring
watch -n 5 'npm run healthcheck'
```

### Development Servers
```bash
# Start dev server
npm run dev

# Start with enhanced agents
npm start:enhanced
```

## Integration with Rule 1 (Parallel Execution)

These commands are automatically collision-detected with VERSATIL Rule 1's parallel task manager:

- **Max concurrent tasks**: 20 global, 3 per agent
- **Resource protection**: File system, database, network locks
- **SDLC awareness**: Respects development phases
- **Auto-scaling**: Based on system load

## Usage

1. Press **Ctrl-B**
2. Enter command (e.g., `npm run test:watch`)
3. Command runs in background
4. Continue working with Claude
5. View output anytime (Ctrl-O for transcript mode)

## Benefits

- ✅ Tests run while developing
- ✅ Builds happen in parallel
- ✅ Security monitoring continuous
- ✅ No workflow interruption
- ✅ Real-time output visibility

## Notes

- Background processes automatically terminate on session end
- Use `/doctor` to check for stuck background processes
- Maximum 10 background processes at once