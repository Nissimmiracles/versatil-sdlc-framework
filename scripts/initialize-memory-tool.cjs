#!/usr/bin/env node
/**
 * Initialize VERSATIL Memory Tool
 *
 * Creates memory directory structure and template files
 * for all 7 OPERA agents
 *
 * Usage:
 *   node scripts/initialize-memory-tool.cjs
 *   npm run memory:init
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Memory directory base path
const MEMORY_BASE_DIR = path.join(os.homedir(), '.versatil', 'memories');

// Agent IDs
const AGENT_IDS = [
  'maria-qa',
  'james-frontend',
  'marcus-backend',
  'dana-database',
  'alex-ba',
  'sarah-pm',
  'dr-ai-ml'
];

// Memory templates (simplified for initialization)
const TEMPLATES = {
  'maria-qa': [
    {
      filename: 'test-patterns.md',
      content: `# Maria-QA Test Patterns

## Successful Test Patterns

*This file stores successful test patterns discovered across sessions.*

## Notes
- Always test happy path first, then edge cases
- Use descriptive test names (what/when/expected)
- Aim for 80%+ coverage (MANDATORY)
`
    },
    {
      filename: 'bug-signatures.md',
      content: `# Maria-QA Bug Signatures

## Known Bug Patterns

*This file stores bug signatures for faster detection.*

## Notes
- Log all bug signatures for pattern matching
- Update detection rules when new bugs found
`
    },
    {
      filename: 'coverage-strategies.md',
      content: `# Maria-QA Coverage Strategies

## Coverage Improvement Tactics

*This file stores strategies for achieving 80%+ coverage.*

## Coverage Targets
- Statements: 80%+ (MANDATORY)
- Branches: 75%+ (RECOMMENDED)
- Functions: 80%+ (MANDATORY)
- Lines: 80%+ (MANDATORY)
`
    }
  ],

  'james-frontend': [
    {
      filename: 'component-patterns.md',
      content: `# James-Frontend Component Patterns

## Successful Component Architectures

*This file stores reusable React/Vue component patterns.*

## Notes
- Keep components small (<200 lines)
- Separate logic from presentation
- Use composition over inheritance
`
    },
    {
      filename: 'accessibility-fixes.md',
      content: `# James-Frontend Accessibility Fixes

## Common A11y Patterns

*This file stores WCAG 2.1 AA compliance patterns.*

## WCAG 2.1 AA Checklist
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] All interactive elements keyboard accessible
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Focus indicators visible
`
    },
    {
      filename: 'performance-optimizations.md',
      content: `# James-Frontend Performance Optimizations

## Performance Patterns

*This file stores frontend performance optimization strategies.*

## Performance Targets
- First Contentful Paint: <1.8s
- Largest Contentful Paint: <2.5s
- Lighthouse Score: 90+ (REQUIRED)
`
    }
  ],

  'marcus-backend': [
    {
      filename: 'api-security-patterns.md',
      content: `# Marcus-Backend API Security Patterns

## OWASP Top 10 Compliance

*This file stores OWASP-compliant security patterns.*

## Security Checklist
- [ ] Input validation on ALL endpoints
- [ ] Parameterized database queries
- [ ] JWT tokens with expiry
- [ ] HTTPS only (no HTTP)
- [ ] Rate limiting (prevent DoS)
`
    },
    {
      filename: 'database-optimization.md',
      content: `# Marcus-Backend Database Optimization

## Query Performance Patterns

*This file stores database query optimization patterns.*

## Performance Targets
- Simple queries: <50ms
- Complex queries: <200ms
- Index all foreign keys
`
    },
    {
      filename: 'authentication-flows.md',
      content: `# Marcus-Backend Authentication Flows

## JWT Authentication Pattern

*This file stores JWT and OAuth authentication patterns.*

## Security Best Practices
- Access tokens: Short-lived (15min)
- Refresh tokens: Longer-lived (7 days)
- Rotate refresh tokens on use
`
    }
  ],

  'dana-database': [
    {
      filename: 'schema-patterns.md',
      content: `# Dana-Database Schema Patterns

## Schema Design Patterns

*This file stores database schema design patterns.*

## Design Principles
- Use UUIDs for IDs (better for distributed systems)
- Add created_at/updated_at timestamps
- Foreign keys with ON DELETE CASCADE
- Index all foreign keys
`
    },
    {
      filename: 'migration-strategies.md',
      content: `# Dana-Database Migration Strategies

## Safe Migration Patterns

*This file stores zero-downtime migration approaches.*

## Migration Checklist
- [ ] Test migration on staging first
- [ ] Have rollback plan ready
- [ ] Use transactions for data integrity
`
    },
    {
      filename: 'rls-policies.md',
      content: `# Dana-Database RLS Policies

## Row-Level Security Patterns (Supabase)

*This file stores RLS policy patterns for multi-tenant data.*

## RLS Best Practices
- Enable RLS on ALL multi-tenant tables
- Test policies with different user roles
- Document policy logic clearly
`
    }
  ],

  'alex-ba': [
    {
      filename: 'requirement-templates.md',
      content: `# Alex-BA Requirement Templates

## Requirement Documentation Patterns

*This file stores successful requirement formats.*

## Template Structure
- Business Context
- User Stories
- Acceptance Criteria
- API Contract
- Success Metrics
`
    },
    {
      filename: 'user-story-patterns.md',
      content: `# Alex-BA User Story Patterns

## User Story Format

*This file stores effective user story structures.*

### Pattern: Standard User Story
As a [user role]
I want [goal/desire]
So that [benefit/value]
`
    }
  ],

  'sarah-pm': [
    {
      filename: 'sprint-patterns.md',
      content: `# Sarah-PM Sprint Patterns

## Sprint Planning Patterns

*This file stores successful sprint planning strategies.*

## Two-Week Sprint Structure
- Week 1: Planning + Development
- Week 2: Testing + Review + Retrospective
`
    },
    {
      filename: 'coordination-strategies.md',
      content: `# Sarah-PM Coordination Strategies

## Agent Coordination Patterns

*This file stores multi-agent coordination strategies.*

## Handoff Pattern
Alex-BA → Dana + Marcus + James (parallel) → Maria-QA → Production
`
    }
  ],

  'dr-ai-ml': [
    {
      filename: 'model-architectures.md',
      content: `# Dr.AI-ML Model Architectures

## Model Architecture Patterns

*This file stores ML model architecture patterns.*

## Model Selection Guide
- Text Generation: GPT-based models
- Embeddings: Sentence Transformers
- Computer Vision: CLIP, ResNet, YOLO
`
    },
    {
      filename: 'deployment-patterns.md',
      content: `# Dr.AI-ML Deployment Patterns

## Model Deployment Patterns

*This file stores ML model deployment strategies.*

## Production Checklist
- [ ] Model performance acceptable
- [ ] Inference time <100ms
- [ ] Monitoring configured
- [ ] Rollback plan ready
`
    }
  ]
};

async function initializeMemoryTool() {
  try {
    console.log('🧠 Initializing VERSATIL Memory Tool...\n');

    // Create base memories directory
    await fs.ensureDir(MEMORY_BASE_DIR);
    console.log(`✅ Created base directory: ${MEMORY_BASE_DIR}`);

    // Create project-knowledge directory
    const projectKnowledgeDir = path.join(MEMORY_BASE_DIR, 'project-knowledge');
    await fs.ensureDir(projectKnowledgeDir);
    console.log('✅ Created project-knowledge directory');

    // Create agent directories and templates
    for (const agentId of AGENT_IDS) {
      const agentDir = path.join(MEMORY_BASE_DIR, agentId);
      await fs.ensureDir(agentDir);

      const templates = TEMPLATES[agentId] || [];
      for (const template of templates) {
        const filePath = path.join(agentDir, template.filename);
        const exists = await fs.pathExists(filePath);

        if (!exists) {
          await fs.writeFile(filePath, template.content, 'utf-8');
          console.log(`   ├─ ${agentId}/${template.filename}`);
        } else {
          console.log(`   ├─ ${agentId}/${template.filename} (already exists, skipped)`);
        }
      }
    }

    console.log('\n✅ Memory Tool initialization complete!\n');
    console.log('📁 Memory location:', MEMORY_BASE_DIR);
    console.log('🎯 Agents configured:', AGENT_IDS.length);
    console.log('📄 Template files created:', Object.values(TEMPLATES).flat().length);
    console.log('\n🚀 Memory Tool is ready for use!');

  } catch (error) {
    console.error('❌ Failed to initialize Memory Tool:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeMemoryTool();
}

module.exports = { initializeMemoryTool };
