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
  console.log('🤖 Maria-QA: Test file edited - Quality validation recommended');
  console.log(`   File: ${relativePath}`);
  console.log('   Suggestion: Run tests with `npm test ${relativePath}`');
  process.exit(0);
}

// James-Frontend: UI component files
if (['.tsx', '.jsx', '.vue', '.svelte'].includes(fileExt) ||
    ['.css', '.scss', '.sass', '.less'].includes(fileExt)) {
  console.log('🤖 James-Frontend: UI component edited - Frontend validation recommended');
  console.log(`   File: ${relativePath}`);

  // Check if it's a React component
  if (fileExt === '.tsx' || fileExt === '.jsx') {
    console.log('   Tech: React detected');
    console.log('   Sub-agent: James-React-Frontend available for deep React expertise');
  }

  // Check if it's a Vue component
  if (fileExt === '.vue') {
    console.log('   Tech: Vue detected');
    console.log('   Sub-agent: James-Vue-Frontend available for deep Vue expertise');
  }

  process.exit(0);
}

// Marcus-Backend: API/Backend files
if (relativePath.match(/\/(api|routes|controllers|server|backend|services)\//)) {
  console.log('🤖 Marcus-Backend: API/Backend file edited - Backend validation recommended');
  console.log(`   File: ${relativePath}`);

  // Detect backend language/framework
  if (fileExt === '.ts' || fileExt === '.js') {
    console.log('   Tech: Node.js/Express detected');
    console.log('   Sub-agent: Marcus-Node-Backend available for Node.js expertise');
  } else if (fileExt === '.py') {
    console.log('   Tech: Python detected');
    console.log('   Sub-agent: Marcus-Python-Backend available for FastAPI/Django expertise');
  } else if (fileExt === '.rb') {
    console.log('   Tech: Ruby detected');
    console.log('   Sub-agent: Marcus-Rails-Backend available for Rails expertise');
  } else if (fileExt === '.go') {
    console.log('   Tech: Go detected');
    console.log('   Sub-agent: Marcus-Go-Backend available for Go expertise');
  } else if (fileExt === '.java') {
    console.log('   Tech: Java detected');
    console.log('   Sub-agent: Marcus-Java-Backend available for Spring Boot expertise');
  }

  console.log('   Recommendation: Run API tests, check OWASP security patterns');
  process.exit(0);
}

// Dana-Database: Database schema files
if (['.sql', '.prisma'].includes(fileExt) ||
    relativePath.match(/\/(migrations|schema|database)\//)) {
  console.log('🤖 Dana-Database: Database schema edited - Database validation recommended');
  console.log(`   File: ${relativePath}`);
  console.log('   Recommendation: Review migration safety, RLS policies, query optimization');
  process.exit(0);
}

// Dr.AI-ML: ML/AI code files
if (fileExt === '.py' && relativePath.match(/\/(ml|model|ai|training)\//)) {
  console.log('🤖 Dr.AI-ML: ML/AI code edited - ML validation recommended');
  console.log(`   File: ${relativePath}`);
  console.log('   Recommendation: Validate model architecture, training pipeline, data preprocessing');
  process.exit(0);
}

// Dr.AI-ML: Jupyter notebooks
if (fileExt === '.ipynb') {
  console.log('🤖 Dr.AI-ML: Jupyter notebook edited - ML experimentation detected');
  console.log(`   File: ${relativePath}`);
  console.log('   Recommendation: Review experiment results, validate reproducibility');
  process.exit(0);
}

// Sarah-PM: Documentation files
if (fileExt === '.md' && (relativePath.includes('docs/') || fileName.match(/^README/i))) {
  console.log('🤖 Sarah-PM: Documentation edited - Project documentation updated');
  console.log(`   File: ${relativePath}`);
  console.log('   Recommendation: Ensure documentation aligns with project goals');
  process.exit(0);
}

// Alex-BA: Requirements/Specification files
if (relativePath.match(/\/(requirements|specs|stories|features)\//)) {
  console.log('🤖 Alex-BA: Requirements file edited - Business logic validation recommended');
  console.log(`   File: ${relativePath}`);
  console.log('   Recommendation: Validate against user stories, API contracts');
  process.exit(0);
}

// Default: No specific agent activation
process.exit(0);
