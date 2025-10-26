#!/usr/bin/env ts-node
/**
 * Post-File-Edit Hook
 * Triggers agent auto-activation after file edits
 * Maps to VERSATIL's "afterFileEdit" lifecycle event
 *
 * SDK Hook: PostToolUse with matcher "Edit|Write|MultiEdit"
 */

import { readFileSync } from 'fs';
import { join, extname, basename } from 'path';
import { execSync } from 'child_process';

interface HookInput {
  toolName: string;
  filePath?: string;
  workingDirectory: string;
  sessionId: string;
}

// Read hook input from stdin
const input: HookInput = JSON.parse(readFileSync(0, 'utf-8'));

const { toolName, filePath, workingDirectory } = input;

// Exit if no file path (shouldn't happen for Edit/Write tools)
if (!filePath) {
  process.exit(0);
}

const fileExt = extname(filePath).toLowerCase();
const fileName = basename(filePath);
const relativePath = filePath.replace(workingDirectory, '').replace(/^\//, '');

/**
 * Agent Activation Rules
 * Based on file patterns and extensions
 */

// Maria-QA: Test files
if (fileName.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/) || relativePath.includes('__tests__')) {
  console.log(JSON.stringify({
    hookType: 'agent-activation-suggestion',
    agent: 'Maria-QA',
    filePath: relativePath,
    filePattern: fileName.match(/\.(test|spec)\./) ? '*.test.*|*.spec.*' : '__tests__/**',
    trigger: 'file-edit',
    recommendation: 'Test file edited - Quality validation and coverage analysis recommended',
    autoActivate: true,
    priority: 'high'
  }));
  process.exit(0);
}

// James-Frontend: UI component files
if (['.tsx', '.jsx', '.vue', '.svelte'].includes(fileExt) ||
    ['.css', '.scss', '.sass', '.less'].includes(fileExt)) {

  let subAgent = 'james-frontend';
  let techStack = 'Frontend';

  // Detect specific framework for sub-agent routing
  if (fileExt === '.tsx' || fileExt === '.jsx') {
    subAgent = 'james-react';
    techStack = 'React';
  } else if (fileExt === '.vue') {
    subAgent = 'james-vue';
    techStack = 'Vue';
  } else if (fileExt === '.svelte') {
    subAgent = 'james-svelte';
    techStack = 'Svelte';
  }

  console.log(JSON.stringify({
    hookType: 'agent-activation-suggestion',
    agent: 'James-Frontend',
    subAgent,
    filePath: relativePath,
    filePattern: `*.${fileExt.slice(1)}`,
    techStack,
    trigger: 'file-edit',
    recommendation: `${techStack} component edited - UI/UX validation and accessibility check recommended`,
    autoActivate: true,
    priority: 'medium'
  }));
  process.exit(0);
}

// Marcus-Backend: API/Backend files
if (relativePath.match(/\/(api|routes|controllers|server|backend|services)\//)) {

  let subAgent = 'marcus-backend';
  let techStack = 'Backend';

  // Detect backend language/framework for sub-agent routing
  if (fileExt === '.ts' || fileExt === '.js') {
    subAgent = 'marcus-node';
    techStack = 'Node.js';
  } else if (fileExt === '.py') {
    subAgent = 'marcus-python';
    techStack = 'Python';
  } else if (fileExt === '.rb') {
    subAgent = 'marcus-rails';
    techStack = 'Ruby/Rails';
  } else if (fileExt === '.go') {
    subAgent = 'marcus-go';
    techStack = 'Go';
  } else if (fileExt === '.java') {
    subAgent = 'marcus-java';
    techStack = 'Java/Spring';
  }

  console.log(JSON.stringify({
    hookType: 'agent-activation-suggestion',
    agent: 'Marcus-Backend',
    subAgent,
    filePath: relativePath,
    filePattern: 'api/**|routes/**|controllers/**|services/**',
    techStack,
    trigger: 'file-edit',
    recommendation: `${techStack} backend file edited - API security, performance, and OWASP validation recommended`,
    autoActivate: true,
    priority: 'high'
  }));
  process.exit(0);
}

// Dana-Database: Database schema files
if (['.sql', '.prisma'].includes(fileExt) ||
    relativePath.match(/\/(migrations|schema|database|supabase)\//)) {
  console.log(JSON.stringify({
    hookType: 'agent-activation-suggestion',
    agent: 'Dana-Database',
    filePath: relativePath,
    filePattern: '*.sql|*.prisma|migrations/**|schema/**',
    trigger: 'file-edit',
    recommendation: 'Database schema edited - Migration safety, RLS policies, and query optimization review recommended',
    autoActivate: true,
    priority: 'high'
  }));
  process.exit(0);
}

// Dr.AI-ML: ML/AI code files
if (fileExt === '.py' && relativePath.match(/\/(ml|model|ai|training)\//)) {
  console.log(JSON.stringify({
    hookType: 'agent-activation-suggestion',
    agent: 'Dr.AI-ML',
    filePath: relativePath,
    filePattern: 'ml/**/*.py|models/**/*.py|ai/**/*.py',
    trigger: 'file-edit',
    recommendation: 'ML/AI code edited - Model architecture, training pipeline, and data preprocessing validation recommended',
    autoActivate: true,
    priority: 'medium'
  }));
  process.exit(0);
}

// Dr.AI-ML: Jupyter notebooks
if (fileExt === '.ipynb') {
  console.log(JSON.stringify({
    hookType: 'agent-activation-suggestion',
    agent: 'Dr.AI-ML',
    filePath: relativePath,
    filePattern: '*.ipynb',
    trigger: 'file-edit',
    recommendation: 'Jupyter notebook edited - Experiment review and reproducibility validation recommended',
    autoActivate: true,
    priority: 'low'
  }));
  process.exit(0);
}

// Sarah-PM: Documentation files
if (fileExt === '.md' && (relativePath.includes('docs/') || fileName.match(/^README/i))) {
  console.log(JSON.stringify({
    hookType: 'agent-activation-suggestion',
    agent: 'Sarah-PM',
    filePath: relativePath,
    filePattern: '*.md|docs/**|README.*',
    trigger: 'file-edit',
    recommendation: 'Documentation edited - Alignment with project goals and completeness review recommended',
    autoActivate: false,
    priority: 'low'
  }));
  process.exit(0);
}

// Alex-BA: Requirements/Specification files
if (relativePath.match(/\/(requirements|specs|stories|features)\//)) {
  console.log(JSON.stringify({
    hookType: 'agent-activation-suggestion',
    agent: 'Alex-BA',
    filePath: relativePath,
    filePattern: 'requirements/**|specs/**|*.feature',
    trigger: 'file-edit',
    recommendation: 'Requirements file edited - User story and API contract validation recommended',
    autoActivate: true,
    priority: 'medium'
  }));
  process.exit(0);
}

// Default: No specific agent activation
process.exit(0);
