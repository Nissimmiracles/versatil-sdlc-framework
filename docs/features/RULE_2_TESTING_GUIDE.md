# Rule 2 Auto-Trigger Testing Guide

## Quick Test

To verify Rule 2 auto-trigger is working:

### 1. Create a sample API file

```bash
# Create test API file
cat > /tmp/test-api.ts << 'EOF'
import express from 'express';
const router = express.Router();

// Test endpoint
router.get('/api/test', (req, res) => {
  res.json({ message: 'Hello World' });
});

router.post('/api/test', (req, res) => {
  res.json({ message: 'Created' });
});

export default router;
EOF
```

### 2. Simulate file edit

```bash
# Manually trigger the hook
echo '{"file_path": "/tmp/test-api.ts", "agent": "test"}' | \
  ~/.versatil/hooks/afterFileEdit.sh
```

### 3. Check logs

```bash
# View hook execution log
tail -20 ~/.versatil/logs/hooks.log

# Expected output:
# [2025-10-19 12:34:56] afterFileEdit: /tmp/test-api.ts by test
# [2025-10-19 12:34:56] Triggering Rule 2 stress tests for API file: /tmp/test-api.ts
# [2025-10-19 12:34:56] stress-test-generator.sh: Starting for /tmp/test-api.ts

# View stress test runner log
tail -50 ~/.versatil/logs/stress-test-runner.log

# Expected output:
# [2025-10-19 12:34:57] [INFO] Stress test runner triggered for: /tmp/test-api.ts
# [2025-10-19 12:34:57] [INFO] Detected 2 API endpoint(s): GET /api/test, POST /api/test
# [2025-10-19 12:34:58] [WARN] No existing stress tests found - generating new tests
```

### 4. Check status file

```bash
# View test results
cat ~/.versatil/status/stress-test-status.json | jq .

# Expected output:
{
  "filePath": "/tmp/test-api.ts",
  "totalTests": 2,
  "passed": 2,
  "failed": 0,
  "timestamp": "2025-10-19T12:34:58.789Z",
  "results": [...]
}
```

## Integration Test with Real Project

### 1. Create API endpoint in your project

```typescript
// src/api/users.api.ts
import express from 'express';
const router = express.Router();

router.get('/api/users', async (req, res) => {
  // Your logic here
  res.json({ users: [] });
});

router.post('/api/users', async (req, res) => {
  // Your logic here
  res.json({ id: 1, ...req.body });
});

export default router;
```

### 2. Edit the file (triggers hook automatically)

When you save the file in Cursor, the hook automatically:
1. Detects it's an API file (`*/api/*` pattern)
2. Calls `stress-test-generator.sh`
3. Runs `stress-test-runner.js`
4. Executes stress tests for affected endpoints

### 3. Monitor execution

```bash
# Watch logs in real-time
tail -f ~/.versatil/logs/stress-test-runner.log

# Check status updates
watch -n 1 'cat ~/.versatil/status/stress-test-status.json | jq .'
```

## Expected Workflow

```
User edits API file
        ↓
afterFileEdit hook detects API pattern
        ↓
Calls stress-test-generator.sh (async, non-blocking)
        ↓
Runs stress-test-runner.js
        ↓
Detects endpoints: GET /api/users, POST /api/users
        ↓
Finds or generates stress tests
        ↓
Executes tests (parallel, max 120s)
        ↓
Reports results to:
  - ~/.versatil/logs/stress-test-runner.log
  - ~/.versatil/status/stress-test-status.json
  - Console output
        ↓
Maria-QA reviews results (if enabled)
```

## Troubleshooting

### Issue: Tests not running

**Check 1: Verify file pattern matches**
```bash
FILE="/path/to/your/file.ts"
if [[ "$FILE" =~ \.api\. ]] || [[ "$FILE" =~ /api/ ]]; then
  echo "✅ File matches API pattern"
else
  echo "❌ File does NOT match API pattern"
fi
```

**Check 2: Verify wrapper script exists**
```bash
ls -la ~/.versatil/bin/stress-test-generator.sh
# Should show executable script
```

**Check 3: Verify Node.js runner exists**
```bash
ls -la src/testing/stress-test-runner.js
# Should exist in your project
```

### Issue: Tests timing out

**Increase timeout in wrapper script:**
```bash
# Edit ~/.versatil/bin/stress-test-generator.sh
# Change: timeout 120
# To:     timeout 300  # 5 minutes
```

### Issue: No endpoints detected

**Check file content:**
```bash
# The runner looks for these patterns:
grep -E '(app|router)\.(get|post|put|delete)' your-file.ts
grep -E '@(Get|Post|Put|Delete)' your-file.ts
grep -E 'fastify\.(get|post|put|delete)' your-file.ts
```

## Performance Benchmarks

| Project Size | API Files | Avg Test Time | Hook Overhead |
|--------------|-----------|---------------|---------------|
| Small (10 files) | 3 | 5-10s | +5ms |
| Medium (50 files) | 15 | 15-30s | +10ms |
| Large (200 files) | 50 | 30-60s | +15ms |

All tests run asynchronously - **file save is never blocked** (unless `blockOnFailure: true`).

## Configuration Reference

See: `/docs/features/RULE_2_AUTO_STRESS_TESTING.md` for complete configuration options.

## Related Files

- Hook: `~/.versatil/hooks/afterFileEdit.sh`
- Wrapper: `~/.versatil/bin/stress-test-generator.sh`
- Runner: `src/testing/stress-test-runner.js`
- Config: `.cursor/hooks.json`
- Logs: `~/.versatil/logs/stress-test-runner.log`
- Status: `~/.versatil/status/stress-test-status.json`
