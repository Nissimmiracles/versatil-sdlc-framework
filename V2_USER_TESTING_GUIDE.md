# 🧪 V2.0.0 Claude Code User Testing Guide

**Purpose**: Validate V2.0.0 "Claude Code Native" features work in actual Claude Code environment
**Priority**: P0 - CRITICAL BLOCKER for v2.0.0 release
**Time Required**: 15-30 minutes
**Date**: September 30, 2025

---

## ⚠️ Why This Testing Is Critical

The V2.0.0 implementation is **90-95% complete** with all infrastructure in place, BUT **0% user validated**. Without this testing:
- ❌ Cannot confirm features work in real Claude Code environment
- ❌ Cannot release v2.0.0 to production
- ❌ Trust level remains at 60% (not 90%)

**This testing is the ONLY blocker for v2.0.0 release.**

---

## 📋 Prerequisites

1. ✅ Claude Code installed and running (you're using it now!)
2. ✅ VERSATIL framework at `/Users/nissimmenashe/VERSATIL SDLC FW`
3. ✅ `.claude/` directory exists with all v2.0.0 files
4. ✅ 10-15 minutes of uninterrupted time

---

## 🎯 Test Checklist

### Test 1: Slash Commands (5 minutes)

**What to Test**: Custom slash commands activate agents

**Steps**:
1. In Claude Code chat, type: `/maria`
2. You should see: `/maria` in the command suggestions
3. Type: `/maria review test coverage`
4. Press Enter

**Expected Result**:
- ✅ Maria-QA agent activates
- ✅ Agent analyzes test coverage
- ✅ Returns quality report

**Actual Result** (fill in after testing):
```
□ Pass - Command worked as expected
□ Fail - Command not recognized / Error occurred
□ Partial - Command recognized but didn't work fully

Notes:
[Write what happened here]
```

**Additional Commands to Test**:
```bash
/james optimize React components
/marcus secure API endpoints
/sarah update project status
/alex refine requirements
/dr-ai-ml train model

/validate     # Framework validation
/doctor       # Health check
/parallel     # Enable Rule 1
/stress-test  # Run stress tests
```

---

### Test 2: @-Mentions (5 minutes)

**What to Test**: Agent activation via @-mentions

**Steps**:
1. In Claude Code chat, type: `@maria`
2. You should see: Agent suggestions appear (typeahead)
3. Select `@maria-qa` from dropdown
4. Type: `review test coverage`
5. Press Enter

**Expected Result**:
- ✅ Typeahead shows agent suggestions
- ✅ Agent activates when mentioned
- ✅ Agent performs requested task

**Actual Result** (fill in after testing):
```
□ Pass - @-mentions worked with typeahead
□ Fail - No typeahead / Agent didn't activate
□ Partial - Typeahead worked but agent activation failed

Notes:
[Write what happened here]
```

**Agents to Test**:
```
@maria-qa      - Quality assurance
@james         - Frontend development
@marcus        - Backend development
@sarah-pm      - Project management
@alex-ba       - Requirements analysis
@dr-ai-ml      - Machine learning
```

---

### Test 3: Hooks System (3 minutes)

**What to Test**: Hooks auto-trigger during tool use

**Steps**:
1. Edit a file in the framework: `src/agents/enhanced-maria.ts`
2. Make a small change (add a comment)
3. Save the file
4. Watch for automatic responses

**Expected Result**:
- ✅ `post-tool-use/quality-validator.sh` runs automatically
- ✅ See message about quality validation
- ✅ Maria-QA reviews changes automatically (if significant)

**Actual Result** (fill in after testing):
```
□ Pass - Hooks triggered automatically
□ Fail - No hooks triggered
□ Partial - Some hooks triggered but not all

Notes:
[Write what happened here]
```

**Hook Categories to Observe**:
- **PreToolUse**: Isolation validation, security gate
- **PostToolUse**: Quality validation, Maria-QA review
- **SessionStart**: Framework init (on new session)
- **SessionEnd**: Context save, metrics (on session end)

---

### Test 4: Background Commands (3 minutes)

**What to Test**: Ctrl-B integration for parallel execution

**Steps**:
1. Press `Ctrl-B` (or Cmd-B on Mac)
2. A background command input should appear
3. Type: `npm run test:coverage`
4. Press Enter

**Expected Result**:
- ✅ Command runs in background
- ✅ Output streams in real-time
- ✅ Can continue working while command runs

**Actual Result** (fill in after testing):
```
□ Pass - Background commands worked
□ Fail - Ctrl-B not recognized / No background execution
□ Partial - Command ran but no streaming output

Notes:
[Write what happened here]
```

**Commands to Test**:
```bash
npm run test:coverage
npm run build
npm run security:start
npm run dashboard:background
```

---

### Test 5: /doctor Health Check (2 minutes)

**What to Test**: Framework health validation

**Steps**:
1. Type: `/doctor` in Claude Code chat
2. Press Enter
3. Wait for health check to complete

**Expected Result**:
```
🏥 VERSATIL Framework Doctor

✅ Isolation: Framework properly isolated
✅ Agents: All 6 OPERA agents healthy
✅ MCP Servers: All servers operational
✅ Rules: Rules 1-5 enabled
✅ Tests: Coverage above 80%
✅ Security: No vulnerabilities
✅ Config: All settings valid

Status: HEALTHY
```

**Actual Result** (fill in after testing):
```
□ Pass - Doctor ran and showed health status
□ Fail - Doctor command not recognized
□ Partial - Doctor ran but with errors

Status:
[Paste doctor output here]
```

---

### Test 6: Statusline Updates (2 minutes)

**What to Test**: Real-time statusline shows agent progress

**Steps**:
1. Activate an agent: `/maria review test coverage`
2. Look at the bottom of Claude Code window
3. Observe statusline for agent activity

**Expected Result**:
- ✅ Statusline shows: `🤖 Maria-QA analyzing...`
- ✅ Progress indicator shows: `████░░ 60% complete`
- ✅ Updates in real-time as agent works

**Actual Result** (fill in after testing):
```
□ Pass - Statusline showed agent progress
□ Fail - No statusline updates
□ Partial - Statusline updates but incomplete

Notes:
[Write what happened here]
```

---

## 📊 Test Results Summary

**Test Results**:
```
Test 1 - Slash Commands:      □ Pass  □ Fail  □ Partial
Test 2 - @-Mentions:           □ Pass  □ Fail  □ Partial
Test 3 - Hooks System:         □ Pass  □ Fail  □ Partial
Test 4 - Background Commands:  □ Pass  □ Fail  □ Partial
Test 5 - /doctor Health:       □ Pass  □ Fail  □ Partial
Test 6 - Statusline Updates:   □ Pass  □ Fail  □ Partial

Overall Pass Rate: __/6 (___%)
```

**Trust Level Assessment**:
```
□ HIGH TRUST (5-6 passes)   → V2.0.0 ready for release ✅
□ MEDIUM TRUST (3-4 passes) → Fix failing tests, re-test
□ LOW TRUST (0-2 passes)    → Major issues, investigate ❌
```

---

## 🔧 Troubleshooting

### Issue: Slash Commands Not Recognized

**Possible Causes**:
1. `.claude/commands/` directory not found
2. Command files not in correct format
3. Claude Code not reading `.claude/` directory

**How to Fix**:
```bash
# Verify command files exist
ls -la .claude/commands/

# Should show:
# maria-qa.md
# james-frontend.md
# marcus-backend.md
# etc.

# If missing, check if .claude/ directory exists
ls -la .claude/

# Restart Claude Code to reload configurations
```

---

### Issue: @-Mentions No Typeahead

**Possible Causes**:
1. `.claude/agents/` directory not found
2. Agent JSON files malformed
3. Claude Code not recognizing agents

**How to Fix**:
```bash
# Verify agent files exist
ls -la .claude/agents/

# Should show:
# maria-qa.json
# james-frontend.json
# marcus-backend.json
# etc.

# Validate JSON syntax
cat .claude/agents/maria-qa.json | jq .

# If jq command fails, JSON is malformed
```

---

### Issue: Hooks Not Triggering

**Possible Causes**:
1. Hooks not executable
2. `.claude/hooks/` directory structure incorrect
3. Hook scripts have errors

**How to Fix**:
```bash
# Make hooks executable
chmod +x .claude/hooks/**/*.sh

# Verify hooks exist
ls -la .claude/hooks/pre-tool-use/
ls -la .claude/hooks/post-tool-use/

# Test a hook manually
.claude/hooks/post-tool-use/quality-validator.sh
```

---

### Issue: Background Commands Not Working

**Possible Causes**:
1. Ctrl-B not bound in Claude Code
2. Background execution not supported
3. Script errors

**How to Fix**:
- Check Claude Code settings for keyboard shortcuts
- Try running command directly in terminal: `npm run dashboard:background`
- Check if command works outside Claude Code first

---

## 📝 Reporting Results

### If ALL TESTS PASS ✅

**Action**: V2.0.0 is ready for release!

**Next Steps**:
1. Update `FRAMEWORK_AUDIT_REPORT_2025_09_30.md`:
   - Change trust level from 60% to 95%
   - Mark "User Validation" as COMPLETE
   - Update "Production Ready" to YES

2. Release v2.0.0:
   ```bash
   npm version 2.0.0
   git tag -a v2.0.0 -m "V2.0.0 Claude Code Native - User Validated"
   git push && git push --tags
   npm publish
   ```

3. Celebrate! 🎉 V2.0.0 is production-ready!

---

### If SOME TESTS FAIL ⚠️

**Action**: Fix issues and re-test

**Next Steps**:
1. Document which tests failed
2. Investigate root cause (use troubleshooting section)
3. Fix issues
4. Re-run failed tests
5. Repeat until all pass

**Update Trust Level**:
- 3-4 passes: Trust = 75% (needs fixes)
- 1-2 passes: Trust = 50% (major issues)
- 0 passes: Trust = 30% (critical issues)

---

### If ALL TESTS FAIL ❌

**Action**: Major investigation required

**Possible Root Causes**:
1. `.claude/` directory not being read by Claude Code
2. Fundamental incompatibility with Claude Code
3. Configuration errors

**Next Steps**:
1. Verify Claude Code version is compatible
2. Check Claude Code documentation for `.claude/` support
3. Create minimal test case
4. Report issue to Claude Code team if needed

**Update Trust Level**: 30% (implementation may not work in Claude Code)

---

## 🎯 Success Criteria

**V2.0.0 can be released if**:
- ✅ At least 5/6 tests pass
- ✅ Slash commands work
- ✅ Agent activation works (@-mentions or slash commands)
- ✅ Core functionality validated

**V2.0.0 CANNOT be released if**:
- ❌ Slash commands don't work at all
- ❌ Agents don't activate
- ❌ Fundamental features broken
- ❌ Less than 3/6 tests pass

---

## 📞 Contact & Support

**Questions During Testing**:
- Take detailed notes of what doesn't work
- Capture error messages (screenshots helpful)
- Check console/logs for errors

**After Testing**:
- Fill out test results summary
- Update trust level in audit report
- Decide: Release v2.0.0 or fix issues first

---

## 📌 Quick Start Checklist

**Before You Start**:
- [ ] Claude Code is open
- [ ] Framework directory loaded
- [ ] 15-30 minutes available
- [ ] Ready to take notes

**Testing Order**:
1. [ ] `/doctor` - Verify framework health
2. [ ] `/maria review test coverage` - Test slash command
3. [ ] `@maria-qa check code quality` - Test @-mention
4. [ ] Edit a file - Test hooks
5. [ ] Ctrl-B + command - Test background execution
6. [ ] Check statusline - Test real-time updates

**After Testing**:
- [ ] Fill out test results summary
- [ ] Calculate pass rate
- [ ] Update audit report
- [ ] Decide: Release or fix

---

**Testing Date**: ___________________
**Tester Name**: ___________________
**Environment**: Claude Code v_____
**Framework**: VERSATIL v1.2.1 (testing v2.0.0)

**Overall Assessment**:
```
V2.0.0 Implementation: Complete ✅
V2.0.0 User Validation: [PENDING - Fill after testing]
Trust Level: [____%]
Production Ready: [YES / NO]
```

---

**Good luck with testing! The future of V2.0.0 depends on your feedback.** 🚀