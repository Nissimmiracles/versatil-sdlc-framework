---
name: skill-creator
description: Generate new Claude Code Skills with YAML frontmatter and progressive disclosure. Use when creating skills, implementing When/What/How structure, or setting up references/assets directories. Provides SKILL-template.md based on 20+ production skills following proven patterns.
tags: [code-generation, skills, templates, progressive-disclosure]
---

# skill-creator - Skills Generator

**Purpose**: Generate new skills following Skills-First Architecture patterns

## When to Use

- Creating new skills (library-guides, code-generators, rag-patterns)
- Implementing When/What/How structure
- Setting up progressive disclosure (metadata → SKILL.md → references)
- Following 20+ production skill patterns

## Quick Start

1. **Copy template**: `cp .claude/skills/code-generators/skill-creator/assets/SKILL-template.md .claude/skills/your-category/your-skill/SKILL.md`
2. **Create directories**: `mkdir -p .claude/skills/your-category/your-skill/{references,assets}`
3. **Replace placeholders**: All `{{PLACEHOLDER}}` fields
4. **Add references**: Detailed docs in `references/` directory
5. **Add assets**: Templates/resources in `assets/` directory

## Skill Structure

```
your-skill/
├── SKILL.md                    # Main skill file (~500 tokens)
├── references/                 # Detailed docs (~2,000 tokens each)
│   ├── api-reference.md
│   ├── implementation-guide.md
│   └── troubleshooting.md
└── assets/                     # Templates/resources (copied not loaded)
    ├── template.md
    └── example-config.json
```

## When/What/How Pattern

All skills must follow this structure:

```markdown
## When to Use
[5-7 bullet points of use cases]

## What This [Skill Type] Provides
[Core components + Key features]

## How to [Use/Implement]
[Code examples with Quick Start patterns]
```

## Progressive Disclosure

```
Level 1: Metadata (YAML frontmatter) - ~15 tokens, always in context
Level 2: SKILL.md (main file) - ~500 tokens, loaded when skill triggered
Level 3: references/*.md - ~2,000 tokens each, loaded as-needed
```

## Key Placeholders

| Category | Placeholders |
|----------|--------------|
| **Metadata** | `{{SKILL_NAME}}`, `{{SKILL_DESCRIPTION}}`, `{{TAGS}}` |
| **Structure** | `{{PRIORITY}}`, `{{PRIMARY_AGENT}}`, `{{DATE}}` |
| **Content** | `{{USE_CASE_1-5}}`, `{{DO_1-4}}`, `{{DONT_1-4}}` |
| **Patterns** | `{{PATTERN_1_CODE}}`, `{{PATTERN_1_LANG}}` |
| **Gotchas** | `{{GOTCHA_1_PROBLEM}}`, `{{GOTCHA_1_SOLUTION}}` |

## Template Location

[assets/SKILL-template.md](assets/SKILL-template.md)

## Real Examples

Refer to 20+ production skills:
- [.claude/skills/library-guides/rag-library/SKILL.md](../../library-guides/rag-library/SKILL.md)
- [.claude/skills/compounding-engineering/SKILL.md](../../compounding-engineering/SKILL.md)
- [.claude/skills/rag-patterns/native-sdk-integration/SKILL.md](../../rag-patterns/native-sdk-integration/SKILL.md)
