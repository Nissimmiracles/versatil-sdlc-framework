#!/usr/bin/env -S npx tsx
"use strict";
/**
 * Post-File-Edit Hook
 * Triggers agent auto-activation after file edits
 * Maps to VERSATIL's "afterFileEdit" lifecycle event
 *
 * SDK Hook: PostToolUse with matcher "Edit|Write|MultiEdit"
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
// Read hook input from stdin
const input = JSON.parse((0, fs_1.readFileSync)(0, 'utf-8'));
const { toolName, filePath, workingDirectory } = input;
// Exit if no file path (shouldn't happen for Edit/Write tools)
if (!filePath) {
    process.exit(0);
}
const fileExt = (0, path_1.extname)(filePath).toLowerCase();
const fileName = (0, path_1.basename)(filePath);
const relativePath = filePath.replace(workingDirectory, '').replace(/^\//, '');
/**
 * Helper: Detect if file is newly created (not just edited) - Phase 6
 */
function isNewFile(filePath) {
    try {
        const stats = require('fs').statSync(filePath);
        // File is "new" if:
        // 1. Empty (0 bytes)
        // 2. Very small (< 200 bytes) - likely just created
        // 3. Modified very recently (< 30 seconds ago) - increased from 10s
        const isEmpty = stats.size === 0;
        const isSmall = stats.size < 200;
        const isRecent = (Date.now() - stats.mtimeMs) < 30000; // 30 seconds
        return isEmpty || isSmall || isRecent;
    }
    catch {
        return false; // File doesn't exist yet (will fail on Write matcher)
    }
}
/**
 * Agent Activation Rules
 * Based on file patterns and extensions
 * Phase 6: Enhanced with template auto-suggestions for new files
 */
// Phase 6: Template auto-suggestion for new agent files
if (fileName.match(/\.claude\/agents\/.*\.md$/) && isNewFile(filePath)) {
    console.log(JSON.stringify({
        hookType: 'template-auto-suggestion',
        message: '💡 Creating new agent detected',
        template: {
            name: 'agent-creator',
            path: '.claude/skills/code-generators/agent-creator/assets/agent-template.md',
            productivity: '6x faster (60min → 10min)',
            placeholders: 40
        },
        action: 'COPY_TEMPLATE_NOW',
        instructions: [
            'Read template from assets/ path',
            'Replace {{AGENT_NAME}}, {{ROLE}}, {{TOOLS}}, etc.',
            'Write to target location',
            'Notify user what was applied'
        ],
        relatedSkills: ['agents-library', 'testing-library'],
        autoApply: true,
        priority: 'high'
    }));
    process.exit(0);
}
// Phase 6: Template auto-suggestion for new command files
if (fileName.match(/\.claude\/commands\/.*\.md$/) && isNewFile(filePath)) {
    console.log(JSON.stringify({
        hookType: 'template-auto-suggestion',
        message: '💡 Creating new command detected',
        template: {
            name: 'command-creator',
            path: '.claude/skills/code-generators/command-creator/assets/command-template.md',
            productivity: '5.6x faster (45min → 8min)',
            placeholders: 30
        },
        action: 'COPY_TEMPLATE_NOW',
        relatedSkills: ['orchestration-library', 'planning-library'],
        autoApply: true,
        priority: 'high'
    }));
    process.exit(0);
}
// Phase 6: Template auto-suggestion for new hook files
if (fileName.match(/\.claude\/hooks\/.*\.ts$/) && isNewFile(filePath)) {
    console.log(JSON.stringify({
        hookType: 'template-auto-suggestion',
        message: '💡 Creating new hook detected',
        template: {
            name: 'hook-creator',
            path: '.claude/skills/code-generators/hook-creator/assets/hook-template.ts',
            productivity: '5x faster (30min → 6min)',
            placeholders: 25
        },
        action: 'COPY_TEMPLATE_NOW',
        relatedSkills: ['hooks-library', 'rag-patterns'],
        relatedPattern: 'native-sdk-integration',
        autoApply: true,
        priority: 'high'
    }));
    process.exit(0);
}
// Phase 6: Template auto-suggestion + agent activation for new test files
if (fileName.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/) && isNewFile(filePath)) {
    console.log(JSON.stringify({
        hookType: 'template-auto-suggestion + agent-activation',
        message: '💡 Creating new test file detected',
        template: {
            name: 'test-creator',
            path: '.claude/skills/code-generators/test-creator/assets/unit-test-template.ts',
            productivity: '5x faster',
            pattern: 'AAA (Arrange-Act-Assert)'
        },
        agent: {
            name: 'Maria-QA',
            autoActivate: true,
            task: 'Validate test structure and coverage requirements (80%+ standard)'
        },
        action: 'COPY_TEMPLATE_THEN_INVOKE_AGENT',
        relatedSkills: ['testing-library', 'quality-gates'],
        autoApply: true,
        priority: 'high'
    }));
    process.exit(0);
}
// Maria-QA: Test files (existing file edits)
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
    }
    else if (fileExt === '.vue') {
        subAgent = 'james-vue';
        techStack = 'Vue';
    }
    else if (fileExt === '.svelte') {
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
    }
    else if (fileExt === '.py') {
        subAgent = 'marcus-python';
        techStack = 'Python';
    }
    else if (fileExt === '.rb') {
        subAgent = 'marcus-rails';
        techStack = 'Ruby/Rails';
    }
    else if (fileExt === '.go') {
        subAgent = 'marcus-go';
        techStack = 'Go';
    }
    else if (fileExt === '.java') {
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
// Phase 7.7.0: Guardian Integration - Track file edits for agent failure detection
// This runs asynchronously and doesn't block hook execution
(async () => {
    try {
        const { trackFileEditForGuardian } = await Promise.resolve().then(() => __importStar(require('../../src/agents/guardian/guardian-file-tracker.js')));
        await trackFileEditForGuardian({
            filePath,
            relativePath,
            toolName,
            workingDirectory,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        // Non-blocking - don't fail hook if Guardian tracking fails
    }
})();
// Default: No specific agent activation
process.exit(0);
