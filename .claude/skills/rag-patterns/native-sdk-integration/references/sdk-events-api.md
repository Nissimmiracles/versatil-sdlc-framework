# Claude SDK Events API Reference

Complete specification of SDK-supported hook events.

## PostToolUse

**Fires**: After any tool execution completes

**Input Schema**:
```typescript
interface PostToolUseInput {
  tool: string;                          // Tool name: 'Edit', 'Write', 'Read', etc.
  parameters: Record<string, unknown>;   // Tool parameters passed
  result: unknown;                       // Tool execution result
}
```

**Example Input**:
```json
{
  "tool": "Edit",
  "parameters": {
    "file_path": "/path/to/file.ts",
    "old_string": "foo",
    "new_string": "bar"
  },
  "result": {
    "success": true,
    "lines_changed": 3
  }
}
```

**Use Cases**:
- File edit detection for agent auto-activation
- Quality gates (run tests after code changes)
- Validation (TypeScript compilation after edits)
- Logging and audit trails

**Matcher Patterns**:
- `"*"` - All tools
- `"Edit"` - Only Edit tool
- `"Edit|Write|MultiEdit"` - Multiple tools (regex OR)
- `"^Read"` - Tools starting with "Read" (regex)

---

## SubagentStop

**Fires**: When a sub-agent (invoked via Task tool) finishes execution

**Input Schema**:
```typescript
interface SubagentStopInput {
  agent_name: string;           // Name of sub-agent that stopped
  result: unknown;              // Agent's final output
  execution_time_ms: number;    // How long agent ran
  tools_used: string[];         // Tools the sub-agent used
}
```

**Example Input**:
```json
{
  "agent_name": "Marcus-Backend",
  "result": {
    "implementation": "API endpoint created",
    "files_modified": ["src/api/users.ts"]
  },
  "execution_time_ms": 45000,
  "tools_used": ["Write", "Edit", "Bash"]
}
```

**Use Cases**:
- Handoff logging (record what agent accomplished)
- Context transfer (pass agent results to next agent)
- Performance monitoring (track agent execution times)
- Quality validation (verify agent outputs)

**Matcher Patterns**:
- `"*"` - All sub-agents
- `"Marcus-Backend"` - Specific agent
- `"Marcus-Backend|James-Frontend"` - Multiple agents

---

## Stop

**Fires**: When the main session ends (user closes conversation, timeout, etc.)

**Input Schema**:
```typescript
interface StopInput {
  conversation_id?: string;     // Unique conversation ID
  tools_used?: string[];        // All tools used in session
  files_modified?: string[];    // All files changed
  duration_ms?: number;         // Session duration
}
```

**Example Input**:
```json
{
  "conversation_id": "conv_abc123",
  "tools_used": ["Edit", "Write", "Bash", "Read"],
  "files_modified": [
    "src/api/auth.ts",
    "tests/api/auth.test.ts"
  ],
  "duration_ms": 1800000
}
```

**Use Cases**:
- Learning codification (CODIFY phase)
- Session summary generation
- Cleanup operations
- Analytics and metrics collection

**Matcher Patterns**:
- `"*"` - Always fires (recommended)

---

## UserPromptSubmit

**Fires**: Before Claude processes user input (before any tools execute)

**Input Schema**:
```typescript
interface UserPromptSubmitInput {
  prompt?: string;              // User's message text
  message?: string;             // Alternate field for message
  workingDirectory?: string;    // Current working directory
  context?: Record<string, unknown>;  // Additional context
}
```

**Example Input**:
```json
{
  "prompt": "How do I implement hooks?",
  "workingDirectory": "/Users/user/project",
  "context": {
    "files_in_context": ["src/hooks/example.ts"]
  }
}
```

**Use Cases**:
- Context injection (RAG patterns, library guides)
- Keyword detection (auto-activate relevant skills)
- User intent analysis
- Pre-processing and validation

**Matcher Patterns**:
- `"*"` - All user prompts (recommended)

---

## Event Execution Order

When multiple hooks are configured:

1. **UserPromptSubmit** (before processing)
2. **PostToolUse** (after each tool)
3. **SubagentStop** (when sub-agents finish)
4. **Stop** (session end)

**Example Flow**:
```
User: "Add authentication API"
  ↓
[UserPromptSubmit] → Inject auth patterns
  ↓
Claude uses Task tool → Invokes Marcus-Backend
  ↓
Marcus-Backend uses Edit tool
  ↓
[PostToolUse] → Detect file edit
  ↓
Marcus-Backend finishes
  ↓
[SubagentStop] → Log handoff
  ↓
User closes session
  ↓
[Stop] → Codify learnings
```

---

## Hook Return Values

Hooks can return JSON to inject context or suggestions:

**Context Injection**:
```json
{
  "role": "system",
  "content": "Relevant pattern information here..."
}
```

**Agent Suggestion** (informational only):
```json
{
  "suggestion": {
    "agent": "Maria-QA",
    "reason": "Test file edited",
    "action": "Run coverage check"
  }
}
```

**Silent (no output)**:
```typescript
process.exit(0);  // No JSON output
```

---

## Error Handling

Hooks should ALWAYS exit gracefully:

```typescript
try {
  // Hook logic here
  process.exit(0);
} catch (error) {
  // Fail silently - don't block Claude
  process.exit(0);
}
```

**Never throw errors** - This will block Claude's execution.

---

## Matcher Regex Patterns

Matchers use JavaScript regex syntax:

| Pattern | Matches | Example |
|---------|---------|---------|
| `"*"` | All | Any tool/agent |
| `"Edit"` | Exact match | Only "Edit" tool |
| `"Edit\|Write"` | OR logic | Edit OR Write |
| `"^Read"` | Starts with | Read, ReadMultiple, etc. |
| `".*Backend$"` | Ends with | Marcus-Backend, Dana-Backend |
| `"Maria.*"` | Prefix | Maria-QA, Maria-Security |

---

## Version Compatibility

| SDK Version | Supported Events |
|-------------|-----------------|
| v0.1.20 | PostToolUse, Stop |
| v0.1.22+ | PostToolUse, SubagentStop, Stop, UserPromptSubmit |
| Latest | All events + future additions |

**Recommended**: Use SDK v0.1.22 or later for full event support.

---

## Common Mistakes

1. **Custom event names** - Only use SDK events, not `PreToolUse`, `BeforeAgent`, etc.
2. **Blocking errors** - Always exit gracefully (exit 0)
3. **Missing shebang** - TypeScript hooks need `#!/usr/bin/env ts-node`
4. **Non-executable** - Run `chmod +x` on all hook files
5. **Wrong matcher syntax** - Use regex, not glob patterns

---

## Related Documentation

- Official SDK: https://github.com/anthropics/claude-sdk
- Hook Examples: `.claude/hooks/` directory
- Settings Schema: `.claude/settings.json`
