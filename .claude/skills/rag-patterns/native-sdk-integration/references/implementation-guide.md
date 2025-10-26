# Native SDK Integration - Implementation Guide

This reference contains detailed code examples and implementation instructions for native Claude SDK integration.

## Complete settings.json Example

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/post-file-edit.ts"
        }]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/subagent-handoff-logger.ts"
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/session-codify.ts"
        }]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/before-prompt.ts"
        }]
      }
    ]
  }
}
```

## Complete Hook Implementation

### PostToolUse Hook (File Edit Detection)

**File**: `.claude/hooks/post-file-edit.ts`

```typescript
#!/usr/bin/env ts-node

import * as fs from 'fs';

interface HookInput {
  tool: string;
  parameters: Record<string, unknown>;
  result: unknown;
}

async function main() {
  try {
    const input: HookInput = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));

    // Check if this was a file edit tool
    if (!['Edit', 'Write', 'MultiEdit'].includes(input.tool)) {
      process.exit(0);
    }

    const filePath = input.parameters.file_path as string;

    // Detect file type and suggest relevant agent
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      console.log(JSON.stringify({
        suggestion: {
          agent: 'Maria-QA',
          reason: 'Test file edited - suggest quality validation',
          action: 'Run test coverage check'
        }
      }));
    } else if (filePath.match(/\.(tsx?|jsx?)$/)) {
      console.log(JSON.stringify({
        suggestion: {
          agent: 'James-Frontend',
          reason: 'Frontend file edited',
          action: 'Check component patterns and accessibility'
        }
      }));
    }

    process.exit(0);
  } catch (error) {
    // Fail gracefully
    process.exit(0);
  }
}

main();
```

### Stop Hook (Session Codification)

**File**: `.claude/hooks/session-codify.ts`

```typescript
#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface HookInput {
  conversation_id?: string;
  tools_used?: string[];
  files_modified?: string[];
}

async function main() {
  try {
    const input: HookInput = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));

    // Capture what was accomplished in this session
    const sessionSummary = {
      id: input.conversation_id || Date.now().toString(),
      tools_used: input.tools_used || [],
      files_modified: input.files_modified || [],
      timestamp: Date.now()
    };

    // Store in learning directory for future pattern recognition
    const learningDir = path.join(process.cwd(), '.versatil', 'learning', 'sessions');
    if (!fs.existsSync(learningDir)) {
      fs.mkdirSync(learningDir, { recursive: true });
    }

    const sessionFile = path.join(learningDir, `session-${sessionSummary.id}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(sessionSummary, null, 2));

    process.exit(0);
  } catch (error) {
    // Fail gracefully
    process.exit(0);
  }
}

main();
```

### UserPromptSubmit Hook (Context Injection)

**File**: `.claude/hooks/before-prompt.ts`

```typescript
#!/usr/bin/env ts-node

import * as fs from 'fs';

interface HookInput {
  prompt?: string;
  message?: string;
}

async function main() {
  try {
    const input: HookInput = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));
    const userMessage = input.prompt || input.message || '';

    // Inject relevant context based on user message
    if (userMessage.toLowerCase().includes('hook')) {
      console.log(JSON.stringify({
        role: 'system',
        content: 'User is asking about hooks - native-sdk-integration pattern available'
      }));
    }

    process.exit(0);
  } catch (error) {
    process.exit(0);
  }
}

main();
```

## Prerequisites

1. **TypeScript**: `npm install -D typescript ts-node`
2. **Execute Permissions**: `chmod +x .claude/hooks/*.ts`
3. **Shebang**: All hooks must start with `#!/usr/bin/env ts-node`

## Agent Frontmatter (SDK-Supported Fields Only)

```yaml
---
name: example-agent
description: Agent description here
model: claude-sonnet-4-5
color: blue
allowed-tools:
  - Read
  - Write
  - Bash
---
```

**Do NOT include**:
- lifecycle_hooks
- auto_activation_rules
- trigger_patterns
- Any other custom fields

## Validation Steps

1. **Check for custom YAML fields**:
   ```bash
   grep -r 'lifecycle_hooks\|auto_activation' .claude/agents/
   # Should return nothing
   ```

2. **Verify SDK event names**:
   ```bash
   jq '.hooks | keys' .claude/settings.json
   # Should show: PostToolUse, SubagentStop, Stop, UserPromptSubmit
   ```

3. **Test hook execution**:
   ```bash
   echo '{"tool":"Edit"}' | .claude/hooks/post-file-edit.ts
   # Should run without errors
   ```

4. **Verify executability**:
   ```bash
   ls -la .claude/hooks/*.ts
   # All should show 'x' permission
   ```

## Related Files

- `.claude/settings.json:1-50` - Hook configuration
- `.claude/hooks/post-file-edit.ts:1-120` - File edit detection
- `.claude/hooks/session-codify.ts:1-150` - Session-end learning
- `.claude/hooks/before-prompt.ts:1-273` - Context injection

## Technologies

- TypeScript
- Claude SDK v0.1.22+
- ts-node

## Effort Metrics

- **Estimated**: 40 hours
- **Actual**: 28 hours
- **Accuracy**: 70% (faster than expected)
- **Variance Reason**: Good SDK documentation made implementation smoother
