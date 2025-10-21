#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Project Context Migration Script
 *
 * Migrates existing projects to new three-layer context structure
 * Part of Layer 2 (Project Context) - Task 5
 *
 * Actions:
 * - Find all projects in ~/.versatil/projects/
 * - Create vision.json, history.jsonl for each
 * - Migrate data from existing .versatil-project.json
 * - Initialize empty timeline if no existing data
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ==================== CONFIGURATION ====================

const VERSATIL_HOME = path.join(os.homedir(), '.versatil');
const PROJECTS_DIR = path.join(VERSATIL_HOME, 'projects');
const BACKUP_DIR = path.join(VERSATIL_HOME, 'backups', 'migration-' + Date.now());

// ==================== MIGRATION LOGIC ====================

/**
 * Find all existing project directories
 */
function findExistingProjects() {
  console.log('🔍 Searching for existing projects...\n');

  const projects = [];

  // Check if projects directory exists
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log('ℹ️ No projects directory found at:', PROJECTS_DIR);
    return projects;
  }

  // List all subdirectories in projects directory
  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const projectPath = path.join(PROJECTS_DIR, entry.name);
      const projectId = entry.name;

      projects.push({
        id: projectId,
        path: projectPath,
        hasVision: fs.existsSync(path.join(projectPath, 'vision.json')),
        hasHistory: fs.existsSync(path.join(projectPath, 'history.jsonl')),
        hasConfig: fs.existsSync(path.join(projectPath, '.versatil-project.json'))
      });
    }
  }

  return projects;
}

/**
 * Migrate single project
 */
async function migrateProject(project) {
  console.log(`\n📦 Migrating project: ${project.id}`);
  console.log(`   Path: ${project.path}`);

  const migrationResults = {
    visionCreated: false,
    historyCreated: false,
    dataImported: false,
    errors: []
  };

  try {
    // 1. Create backup if project has existing data
    if (project.hasConfig || project.hasVision || project.hasHistory) {
      await backupProject(project);
    }

    // 2. Load existing config if available
    let existingConfig = null;
    if (project.hasConfig) {
      const configPath = path.join(project.path, '.versatil-project.json');
      try {
        const configData = fs.readFileSync(configPath, 'utf8');
        existingConfig = JSON.parse(configData);
        console.log('   ✅ Loaded existing project config');
      } catch (error) {
        console.warn(`   ⚠️ Failed to parse existing config: ${error.message}`);
        migrationResults.errors.push(`Config parse error: ${error.message}`);
      }
    }

    // 3. Create/update vision.json
    if (!project.hasVision) {
      const vision = createDefaultVision(project, existingConfig);
      const visionPath = path.join(project.path, 'vision.json');
      fs.writeFileSync(visionPath, JSON.stringify(vision, null, 2));
      console.log('   ✅ Created vision.json');
      migrationResults.visionCreated = true;
    } else {
      console.log('   ℹ️ vision.json already exists, skipping');
    }

    // 4. Create/update history.jsonl
    if (!project.hasHistory) {
      const historyPath = path.join(project.path, 'history.jsonl');

      // Create with initial event
      const initialEvent = {
        id: `evt_migration_${Date.now()}`,
        timestamp: Date.now(),
        type: 'decision_made',
        description: 'Project migrated to three-layer context system',
        impact: 'Enabled project vision tracking and history timeline',
        agent: 'system',
        metadata: {
          migrationVersion: '1.0.0',
          migratedFrom: existingConfig ? 'legacy-config' : 'new-project'
        }
      };

      fs.writeFileSync(historyPath, JSON.stringify(initialEvent) + '\n');
      console.log('   ✅ Created history.jsonl');
      migrationResults.historyCreated = true;
    } else {
      console.log('   ℹ️ history.jsonl already exists, skipping');
    }

    // 5. Create milestones.json if doesn't exist
    const milestonesPath = path.join(project.path, 'milestones.json');
    if (!fs.existsSync(milestonesPath)) {
      const milestones = existingConfig?.milestones || [];
      fs.writeFileSync(milestonesPath, JSON.stringify(milestones, null, 2));
      console.log('   ✅ Created milestones.json');
    }

    // 6. Create decisions.jsonl if doesn't exist
    const decisionsPath = path.join(project.path, 'decisions.jsonl');
    if (!fs.existsSync(decisionsPath)) {
      fs.writeFileSync(decisionsPath, ''); // Empty file
      console.log('   ✅ Created decisions.jsonl');
    }

    // 7. Create market-context.json if doesn't exist
    const marketPath = path.join(project.path, 'market-context.json');
    if (!fs.existsSync(marketPath)) {
      const marketContext = createDefaultMarketContext(project, existingConfig);
      fs.writeFileSync(marketPath, JSON.stringify(marketContext, null, 2));
      console.log('   ✅ Created market-context.json');
    }

    console.log(`   ✅ Migration complete for ${project.id}`);

  } catch (error) {
    console.error(`   ❌ Migration failed for ${project.id}:`, error.message);
    migrationResults.errors.push(error.message);
  }

  return migrationResults;
}

/**
 * Backup project data before migration
 */
async function backupProject(project) {
  const backupPath = path.join(BACKUP_DIR, project.id);

  // Create backup directory
  fs.mkdirSync(backupPath, { recursive: true });

  // Copy all files
  const files = fs.readdirSync(project.path);
  for (const file of files) {
    const srcPath = path.join(project.path, file);
    const destPath = path.join(backupPath, file);

    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  console.log(`   ✅ Backup created at: ${backupPath}`);
}

/**
 * Create default vision from existing config or empty
 */
function createDefaultVision(project, existingConfig) {
  const now = Date.now();

  return {
    mission: existingConfig?.description || `Project: ${project.id}`,
    northStar: existingConfig?.northStar || 'Define north star metric',
    marketOpportunity: existingConfig?.marketOpportunity || 'Define market opportunity',
    targetMarket: existingConfig?.targetMarket || 'Define target market',
    competitors: existingConfig?.competitors || [],
    targetUsers: existingConfig?.targetUsers || [],
    goals: existingConfig?.goals || [],
    values: existingConfig?.values || [],
    strategicPriorities: existingConfig?.strategicPriorities || [],
    productPhilosophy: existingConfig?.productPhilosophy || [],
    scope: existingConfig?.scope || {
      inScope: [],
      outOfScope: []
    },
    createdAt: existingConfig?.createdAt || now,
    updatedAt: now
  };
}

/**
 * Create default market context
 */
function createDefaultMarketContext(project, existingConfig) {
  return {
    size: existingConfig?.marketSize || 'Unknown',
    opportunity: existingConfig?.marketOpportunity || 'Define opportunity',
    trends: existingConfig?.marketTrends || [],
    timing: existingConfig?.marketTiming || 'TBD',
    competitiveLandscape: existingConfig?.competitiveLandscape || 'Unknown',
    updatedAt: Date.now()
  };
}

/**
 * Generate migration report
 */
function generateReport(projects, results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION REPORT');
  console.log('='.repeat(60) + '\n');

  console.log(`Total projects found: ${projects.length}`);
  console.log(`Projects migrated: ${results.filter(r => r.visionCreated || r.historyCreated).length}`);
  console.log(`Projects skipped (already migrated): ${results.filter(r => !r.visionCreated && !r.historyCreated).length}`);

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  if (totalErrors > 0) {
    console.log(`\n⚠️ Errors encountered: ${totalErrors}`);
    results.forEach((r, index) => {
      if (r.errors.length > 0) {
        console.log(`\n   Project: ${projects[index].id}`);
        r.errors.forEach(err => console.log(`   - ${err}`));
      }
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Migration complete!');
  console.log('='.repeat(60) + '\n');

  if (fs.existsSync(BACKUP_DIR)) {
    console.log(`📁 Backups stored at: ${BACKUP_DIR}\n`);
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 VERSATIL Project Context Migration\n');
  console.log('This script will migrate existing projects to the new three-layer context structure.\n');

  // 1. Find existing projects
  const projects = findExistingProjects();

  if (projects.length === 0) {
    console.log('ℹ️ No projects found. Nothing to migrate.');
    console.log('\nProjects directory:', PROJECTS_DIR);
    return;
  }

  console.log(`Found ${projects.length} project(s):\n`);
  projects.forEach(p => {
    console.log(`  - ${p.id}`);
    console.log(`    Vision: ${p.hasVision ? '✅' : '❌'}  History: ${p.hasHistory ? '✅' : '❌'}  Config: ${p.hasConfig ? '✅' : '❌'}`);
  });

  // 2. Migrate each project
  const results = [];
  for (const project of projects) {
    const result = await migrateProject(project);
    results.push(result);
  }

  // 3. Generate report
  generateReport(projects, results);
}

// ==================== EXECUTE ====================

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { main, findExistingProjects, migrateProject };
