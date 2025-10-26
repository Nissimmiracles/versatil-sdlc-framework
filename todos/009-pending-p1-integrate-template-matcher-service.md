# Integrate Template Matcher Service into /plan Command - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical - Wave 3 integration)
- **Created**: 2025-10-26
- **Assigned**: Marcus-Backend + Sarah-PM
- **Estimated Effort**: Small (30 minutes)

## Description

Integrate the TemplateMatcher service into `.claude/commands/plan.md` Step 3 to enable automatic template matching for common feature types (auth, CRUD, dashboard, API integration, file upload).

## Acceptance Criteria

- [ ] Import `templateMatcher` from `src/templates/template-matcher.js`
- [ ] Call `matchTemplate()` with description and --template flag
- [ ] Display "Template Applied" section when match found
- [ ] Support explicit template selection via --template=NAME flag
- [ ] Handle no-match scenario (proceed to agent research)
- [ ] Show matched keywords and match score
- [ ] Apply complexity adjustments to base effort

## Dependencies

- **Depends on**: 003 - Template Matcher Service (implemented ✅)
- **Blocks**: 011 - Enhanced Output Format
- **Parallel with**: 008, 010

## Files Involved

- `.claude/commands/plan.md` (modify lines 151-200)
- `src/templates/template-matcher.ts` (import and use)
