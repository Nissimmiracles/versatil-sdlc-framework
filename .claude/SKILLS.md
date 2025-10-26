# VERSATIL Skills Integration

This document describes the skills available in the VERSATIL framework and how to use them.

## Overview

Skills are folders of instructions, scripts, and resources that Claude loads dynamically to improve performance on specialized tasks. The VERSATIL framework integrates Anthropic's official skills repository to enhance agent capabilities.

## Available Skills

### Document Processing Skills (`.claude/skills/document-skills/`)

Advanced document manipulation capabilities:

- **xlsx** - Create, edit, and analyze Excel spreadsheets with formulas, formatting, and data analysis
- **docx** - Create, edit, and analyze Word documents with tracked changes, comments, and formatting
- **pptx** - Create, edit, and analyze PowerPoint presentations with layouts, templates, and charts
- **pdf** - Comprehensive PDF toolkit for text/table extraction, creation, merging, splitting, and forms

**Usage Example:**
```
Use the PDF skill to extract form fields from contracts/agreement.pdf
```

### Development & Technical Skills

- **mcp-builder** (`.claude/skills/mcp-builder/`) - Guide for creating high-quality MCP servers that integrate external APIs
  - Supports Python (FastMCP) and Node/TypeScript (MCP SDK)
  - Includes best practices, evaluation guidelines, and complete implementation workflow

- **skill-creator** (`.claude/skills/skill-creator/`) - Guide for creating effective custom skills
  - Skill structure and YAML frontmatter specifications
  - Best practices for skill development

- **webapp-testing** (`.claude/skills/webapp-testing/`) - Test local web applications using Playwright
  - UI verification and debugging capabilities
  - Automated browser testing workflows

- **artifacts-builder** (`.claude/skills/artifacts-builder/`) - Build complex HTML artifacts
  - React, Tailwind CSS, and shadcn/ui components
  - Interactive web application creation

### Creative & Design Skills

- **canvas-design** (`.claude/skills/canvas-design/`) - Design visual art in PNG and PDF formats
  - Professional design philosophies
  - Visual composition and layout

- **algorithmic-art** (`.claude/skills/algorithmic-art/`) - Create generative art using p5.js
  - Seeded randomness, flow fields, particle systems
  - Procedural art generation

- **slack-gif-creator** (`.claude/skills/slack-gif-creator/`) - Create animated GIFs
  - Optimized for Slack's size constraints
  - Custom animation workflows

- **theme-factory** (`.claude/skills/theme-factory/`) - Style artifacts with professional themes
  - 10 pre-set themes or custom theme generation
  - Consistent design systems

### Enterprise & Communication Skills

- **brand-guidelines** (`.claude/skills/brand-guidelines/`) - Apply Anthropic's brand standards
  - Official brand colors and typography
  - Consistent branding across artifacts

- **internal-comms** (`.claude/skills/internal-comms/`) - Write professional communications
  - Status reports, newsletters, FAQs
  - Enterprise communication patterns

### Template

- **template-skill** (`.claude/skills/template-skill/`) - Basic template for creating new skills
  - YAML frontmatter structure
  - Minimal working example

## Using Skills

### Direct Mention

Simply mention the skill you want to use in your request:

```
Use the mcp-builder skill to create a GitHub MCP server
```

### Skill Auto-Loading

Claude automatically detects and loads relevant skills based on:
- File types you're working with
- Task context and requirements
- Explicit skill mentions in requests

### Skill Structure

Each skill contains a `SKILL.md` file with:
- **YAML Frontmatter**: name, description, license, allowed-tools, metadata
- **Markdown Body**: Instructions, examples, guidelines

Example frontmatter:
```yaml
---
name: my-skill
description: What the skill does and when to use it
license: MIT
allowed-tools:
  - Read
  - Write
  - Bash
---
```

## GitMCP Skills Documentation

Access comprehensive skills documentation via GitMCP:

**MCP Server Configuration**: `.claude/mcp-config.json`
```json
{
  "mcpServers": {
    "skills-docs": {
      "url": "https://gitmcp.io/anthropics/skills"
    }
  }
}
```

This provides access to the complete Anthropic skills repository documentation, including:
- Detailed skill specifications
- Implementation examples
- Best practices and patterns
- API references

## Creating Custom Skills

1. Use the **skill-creator** skill as a guide
2. Create a new directory in `.claude/skills/`
3. Add a `SKILL.md` file with proper frontmatter
4. Include instructions, examples, and guidelines
5. Reference in your requests

## Skill Development Best Practices

From the **skill-creator** skill:

- **Clear naming**: Use hyphen-case names that reflect the skill's purpose
- **Comprehensive description**: Help Claude understand when to use the skill
- **Detailed instructions**: Provide step-by-step guidance
- **Examples**: Show concrete usage patterns
- **Tool permissions**: Specify allowed-tools for safety

## Integration with OPERA Agents

Skills enhance OPERA agent capabilities:

- **Maria-QA**: Uses webapp-testing skill for automated testing
- **James-Frontend**: Leverages artifacts-builder, canvas-design, theme-factory
- **Marcus-Backend**: Uses mcp-builder for API integration
- **Alex-BA**: Applies internal-comms for documentation
- **Dr.AI-ML**: Can leverage document-skills for data processing
- **Sarah-PM**: Uses internal-comms for project communications

## Resources

- **Skill Specification**: `.claude/skills/template-skill/SKILL.md`
- **Anthropic Skills Repo**: https://github.com/anthropics/skills
- **MCP Documentation**: https://modelcontextprotocol.io
- **Skills Documentation**: https://support.claude.com/en/articles/12512180-using-skills-in-claude

## Notes

- Skills are loaded from `.claude/skills/` directory
- Each skill must have a `SKILL.md` file to be recognized
- Skills can include additional resources (scripts, templates, reference files)
- GitMCP provides remote access to official skills documentation
- Local skills take precedence over remote documentation
