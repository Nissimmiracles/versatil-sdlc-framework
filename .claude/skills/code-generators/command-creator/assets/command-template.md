---
description: "{{COMMAND_DESCRIPTION}}"
argument-hint: "[{{ARGUMENT_HINT}}]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Task"
  - "TodoWrite"
  - "Read"
  - "Write"
  - "Grep"
  - "Glob"
  - "Bash"
skills:
  - "{{SKILL_1}}"
  - "{{SKILL_2}}"
---

# {{COMMAND_TITLE}}

## Introduction

{{COMMAND_PURPOSE}}

## Flags

- `--{{FLAG_1}}`: {{FLAG_1_DESC}}
- `--{{FLAG_2}}`: {{FLAG_2_DESC}}
- `--{{FLAG_3}}`: {{FLAG_3_DESC}}

## Usage Examples

```bash
# {{EXAMPLE_1_DESC}}
/{{COMMAND_NAME}} {{EXAMPLE_1}}

# {{EXAMPLE_2_DESC}}
/{{COMMAND_NAME}} --{{FLAG_1}} {{EXAMPLE_2}}

# {{EXAMPLE_3_DESC}}
/{{COMMAND_NAME}} --{{FLAG_2}} {{EXAMPLE_3}}
```

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

## ⚠️ CRITICAL: Agent Invocation Requirements

**YOU MUST INVOKE THESE AGENTS - THIS IS MANDATORY:**

When executing this `/{{COMMAND_NAME}}` command, you are REQUIRED to use the Task tool:

- **Step {{STEP_1}}**: MUST invoke `{{AGENT_1}}` agent using Task tool
- **Step {{STEP_2}}**: MUST invoke `{{AGENT_2}}` AND `{{AGENT_3}}` agents in parallel
- **Step {{STEP_3}}**: MUST invoke `{{AGENT_4}}` agent for {{STEP_3_PURPOSE}}

## Implementation Steps

### Step 1: {{STEP_1_TITLE}}

{{STEP_1_DESC}}

```{{STEP_1_LANG}}
{{STEP_1_CODE}}
```

### Step 2: {{STEP_2_TITLE}}

{{STEP_2_DESC}}

```{{STEP_2_LANG}}
{{STEP_2_CODE}}
```

### Step 3: {{STEP_3_TITLE}}

{{STEP_3_DESC}}

### Step 4: {{STEP_4_TITLE}}

{{STEP_4_DESC}}

## Output Format

{{OUTPUT_DESC}}

```{{OUTPUT_LANG}}
{{OUTPUT_EXAMPLE}}
```

## Error Handling

Common errors and solutions:

- **{{ERROR_1}}**: {{ERROR_1_SOLUTION}}
- **{{ERROR_2}}**: {{ERROR_2_SOLUTION}}
- **{{ERROR_3}}**: {{ERROR_3_SOLUTION}}

## Related Commands

- `/{{RELATED_1}}` - {{RELATED_1_DESC}}
- `/{{RELATED_2}}` - {{RELATED_2_DESC}}
---
