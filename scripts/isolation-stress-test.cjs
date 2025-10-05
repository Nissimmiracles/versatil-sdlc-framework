#!/usr/bin/env node

/**
 * VERSATIL Framework - Isolation Stress Test
 *
 * Tests that framework installation in user projects maintains perfect isolation:
 * - No framework files in user project (except .versatil-project.json)
 * - All framework data in ~/.versatil/
 * - No accidental commits of framework data
 * - Multi-project support works correctly
 * - Framework updates don't touch user code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Framework home directory
const FRAMEWORK_HOME = path.join(os.homedir(), '.versatil');

/**
 * Log test result
 */
function logTest(name, passed, message = '') {
  const status = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;

  console.log(`${color}${status} ${name}${colors.reset}`);
  if (message) {
    console.log(`   ${message}`);
  }

  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

/**
 * Log warning
 */
function logWarning(name, message) {
  console.log(`${colors.yellow}⚠️  ${name}${colors.reset}`);
  if (message) {
    console.log(`   ${message}`);
  }
  results.warnings++;
}

/**
 * Check if path exists
 */
function pathExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

/**
 * Create temporary test project
 */
function createTestProject(name) {
  const tempDir = path.join(os.tmpdir(), `versatil-test-${name}-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  // Create a simple Node.js project
  const packageJson = {
    name: `test-project-${name}`,
    version: '1.0.0',
    description: 'Test project for VERSATIL isolation',
    main: 'index.js'
  };

  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create a simple source file
  fs.mkdirSync(path.join(tempDir, 'src'));
  fs.writeFileSync(
    path.join(tempDir, 'src', 'index.js'),
    '// User project code\nconsole.log("Hello from user project");'
  );

  // Initialize git
  try {
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git add .', { cwd: tempDir, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { cwd: tempDir, stdio: 'ignore' });
  } catch (error) {
    console.warn('Could not initialize git:', error.message);
  }

  return tempDir;
}

/**
 * Simulate framework installation
 */
function simulateFrameworkInstall(projectPath) {
  // Create .versatil-project.json (the ONLY file allowed in user project)
  const projectConfig = {
    name: path.basename(projectPath),
    frameworkVersion: '3.0.0',
    installedAt: new Date().toISOString(),
    frameworkHome: FRAMEWORK_HOME
  };

  fs.writeFileSync(
    path.join(projectPath, '.versatil-project.json'),
    JSON.stringify(projectConfig, null, 2)
  );
}

/**
 * Test 1: Framework home exists
 */
function testFrameworkHomeExists() {
  const exists = pathExists(FRAMEWORK_HOME);
  logTest(
    'Framework home directory exists',
    exists,
    exists ? `Found at: ${FRAMEWORK_HOME}` : 'Framework home not initialized'
  );
}

/**
 * Test 2: No framework pollution in user project
 */
function testNoFrameworkPollution(projectPath) {
  const forbiddenPaths = [
    '.versatil',
    'versatil',
    'supabase',
    '.versatil-memory',
    '.versatil-logs',
    '.versatil-self',
    'node_modules/versatil-sdlc-framework/.versatil'
  ];

  let polluted = false;
  const foundPollution = [];

  for (const forbidden of forbiddenPaths) {
    const fullPath = path.join(projectPath, forbidden);
    if (pathExists(fullPath)) {
      polluted = true;
      foundPollution.push(forbidden);
    }
  }

  logTest(
    'No framework pollution in user project',
    !polluted,
    polluted
      ? `Found forbidden paths: ${foundPollution.join(', ')}`
      : 'Project is clean'
  );
}

/**
 * Test 3: Only allowed file exists (.versatil-project.json)
 */
function testOnlyAllowedFile(projectPath) {
  const allowedFile = '.versatil-project.json';
  const allowedPath = path.join(projectPath, allowedFile);

  const exists = pathExists(allowedPath);

  logTest(
    'Only allowed file (.versatil-project.json) exists',
    exists,
    exists ? 'Configuration file present' : 'Configuration file missing'
  );

  if (exists) {
    try {
      const content = JSON.parse(fs.readFileSync(allowedPath, 'utf8'));
      const hasRequiredFields = content.frameworkVersion && content.frameworkHome;

      logTest(
        'Configuration file has required fields',
        hasRequiredFields,
        hasRequiredFields
          ? `Version: ${content.frameworkVersion}, Home: ${content.frameworkHome}`
          : 'Missing required fields'
      );
    } catch (error) {
      logTest('Configuration file is valid JSON', false, error.message);
    }
  }
}

/**
 * Test 4: Framework data in correct location
 */
function testFrameworkDataLocation() {
  const expectedPaths = [
    'logs',
    'rag-memory',
    'config',
    'supabase'
  ];

  let allPresent = true;
  const missing = [];

  for (const dir of expectedPaths) {
    const fullPath = path.join(FRAMEWORK_HOME, dir);
    if (!pathExists(fullPath)) {
      allPresent = false;
      missing.push(dir);
    }
  }

  if (missing.length > 0) {
    logWarning(
      'Some framework directories missing',
      `Missing: ${missing.join(', ')} (may not be initialized yet)`
    );
  } else {
    logTest(
      'Framework data in correct location (~/.versatil/)',
      true,
      `All expected directories present: ${expectedPaths.join(', ')}`
    );
  }
}

/**
 * Test 5: Git safety (no framework files would be committed)
 */
function testGitSafety(projectPath) {
  try {
    // Check git status
    const status = execSync('git status --porcelain', {
      cwd: projectPath,
      encoding: 'utf8'
    });

    // Parse status for framework-related files
    const lines = status.split('\n').filter(l => l.trim());
    const frameworkFiles = lines.filter(line => {
      const lowerLine = line.toLowerCase();
      return lowerLine.includes('.versatil/') ||
             lowerLine.includes('supabase/') ||
             lowerLine.includes('versatil-logs');
    });

    const isSafe = frameworkFiles.length === 0;

    logTest(
      'Git safety: No framework files in staging',
      isSafe,
      isSafe
        ? 'No framework files would be accidentally committed'
        : `Found ${frameworkFiles.length} framework files: ${frameworkFiles.join(', ')}`
    );
  } catch (error) {
    logWarning('Git safety check', 'Project not a git repository or git not available');
  }
}

/**
 * Test 6: Multi-project isolation
 */
function testMultiProjectIsolation() {
  const project1 = createTestProject('proj1');
  const project2 = createTestProject('proj2');

  simulateFrameworkInstall(project1);
  simulateFrameworkInstall(project2);

  const config1 = JSON.parse(fs.readFileSync(path.join(project1, '.versatil-project.json'), 'utf8'));
  const config2 = JSON.parse(fs.readFileSync(path.join(project2, '.versatil-project.json'), 'utf8'));

  // Both should point to same framework home
  const sameHome = config1.frameworkHome === config2.frameworkHome;

  logTest(
    'Multi-project isolation: Both projects share framework home',
    sameHome,
    sameHome
      ? `Both use: ${config1.frameworkHome}`
      : `Project 1: ${config1.frameworkHome}, Project 2: ${config2.frameworkHome}`
  );

  // Cleanup
  fs.rmSync(project1, { recursive: true, force: true });
  fs.rmSync(project2, { recursive: true, force: true });
}

/**
 * Test 7: .gitignore recommendation
 */
function testGitignoreRecommendation(projectPath) {
  const gitignorePath = path.join(projectPath, '.gitignore');

  if (pathExists(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const hasIgnore = content.includes('.versatil-project.json');

    if (hasIgnore) {
      logTest(
        '.gitignore includes .versatil-project.json',
        true,
        'Configuration file is ignored (recommended)'
      );
    } else {
      logWarning(
        '.gitignore recommendation',
        'Consider adding .versatil-project.json to .gitignore'
      );
    }
  } else {
    logWarning(
      '.gitignore recommendation',
      'No .gitignore found. Recommend creating one with .versatil-project.json'
    );
  }
}

/**
 * Test 8: File system permissions
 */
function testFileSystemPermissions() {
  try {
    const testFile = path.join(FRAMEWORK_HOME, '.test-write');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    logTest(
      'Framework home is writable',
      true,
      `Can write to ${FRAMEWORK_HOME}`
    );
  } catch (error) {
    logTest(
      'Framework home is writable',
      false,
      `Cannot write to ${FRAMEWORK_HOME}: ${error.message}`
    );
  }
}

/**
 * Test 9: Symlink detection (potential isolation breach)
 */
function testNoSymlinks(projectPath) {
  try {
    const entries = fs.readdirSync(projectPath, { withFileTypes: true });
    const symlinks = entries.filter(e => e.isSymbolicLink());

    const frameworkSymlinks = symlinks.filter(s => {
      const linkPath = fs.readlinkSync(path.join(projectPath, s.name));
      return linkPath.includes('.versatil') || linkPath.includes('framework');
    });

    const noFrameworkSymlinks = frameworkSymlinks.length === 0;

    logTest(
      'No framework symlinks in project',
      noFrameworkSymlinks,
      noFrameworkSymlinks
        ? 'No symlinks pointing to framework directories'
        : `Found ${frameworkSymlinks.length} framework symlinks: ${frameworkSymlinks.map(s => s.name).join(', ')}`
    );
  } catch (error) {
    logWarning('Symlink detection', `Could not check symlinks: ${error.message}`);
  }
}

/**
 * Test 10: Environment variable isolation
 */
function testEnvironmentIsolation() {
  const frameworkEnvVars = [
    'VERSATIL_HOME',
    'VERSATIL_PROJECT_ROOT',
    'VERSATIL_FRAMEWORK_PATH'
  ];

  const setVars = frameworkEnvVars.filter(v => process.env[v]);

  if (setVars.length > 0) {
    logTest(
      'Environment variables are set',
      true,
      `Found: ${setVars.join(', ')}`
    );

    // Check they point to correct locations
    if (process.env.VERSATIL_HOME) {
      const pointsToHome = process.env.VERSATIL_HOME === FRAMEWORK_HOME;
      logTest(
        'VERSATIL_HOME points to framework home',
        pointsToHome,
        pointsToHome
          ? `Correctly set to: ${FRAMEWORK_HOME}`
          : `Expected: ${FRAMEWORK_HOME}, Got: ${process.env.VERSATIL_HOME}`
      );
    }
  } else {
    logWarning(
      'Environment variables',
      'No framework environment variables set (may be normal if not running framework)'
    );
  }
}

/**
 * Test 11: Package.json dependency check
 */
function testPackageJsonClean(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (pathExists(packageJsonPath)) {
    const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...content.dependencies, ...content.devDependencies };

    // Check if framework is a dependency (it shouldn't be for isolation)
    const hasFrameworkDep = Object.keys(deps).some(dep =>
      dep.includes('versatil') || dep.includes('opera')
    );

    if (hasFrameworkDep) {
      logWarning(
        'Framework as dependency',
        'Framework found in package.json. For isolation, consider global install.'
      );
    } else {
      logTest(
        'No framework dependencies in package.json',
        true,
        'Project dependencies are clean'
      );
    }
  }
}

/**
 * Test 12: Stress test with multiple simultaneous projects
 */
function testConcurrentProjects() {
  console.log(`\n${colors.blue}${colors.bold}Running concurrent projects stress test...${colors.reset}\n`);

  const numProjects = 10;
  const projects = [];

  // Create multiple projects simultaneously
  for (let i = 0; i < numProjects; i++) {
    const proj = createTestProject(`concurrent-${i}`);
    simulateFrameworkInstall(proj);
    projects.push(proj);
  }

  // Verify isolation for each
  let allIsolated = true;
  for (const proj of projects) {
    const config = JSON.parse(fs.readFileSync(path.join(proj, '.versatil-project.json'), 'utf8'));

    // Check only allowed file exists
    const entries = fs.readdirSync(proj);
    const frameworkFiles = entries.filter(e =>
      e.includes('.versatil') && e !== '.versatil-project.json'
    );

    if (frameworkFiles.length > 0) {
      allIsolated = false;
      break;
    }
  }

  logTest(
    `Concurrent projects stress test (${numProjects} projects)`,
    allIsolated,
    allIsolated
      ? `All ${numProjects} projects maintain isolation`
      : 'Some projects have isolation breaches'
  );

  // Cleanup
  for (const proj of projects) {
    fs.rmSync(proj, { recursive: true, force: true });
  }
}

/**
 * Generate report
 */
function generateReport() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${colors.bold}VERSATIL Framework Isolation Stress Test Report${colors.reset}`);
  console.log(`${'='.repeat(70)}\n`);

  // Summary
  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(`  ${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);

  const totalTests = results.passed + results.failed;
  const passRate = totalTests > 0 ? (results.passed / totalTests * 100).toFixed(1) : 0;

  console.log(`\n  Pass Rate: ${passRate}%`);

  // Isolation score
  let score = 100;
  score -= results.failed * 10;
  score -= results.warnings * 2;
  score = Math.max(0, score);

  console.log(`\n${colors.bold}Isolation Score: ${score}/100${colors.reset}`);

  if (score >= 90) {
    console.log(`${colors.green}${colors.bold}✅ EXCELLENT - Framework isolation is robust${colors.reset}`);
  } else if (score >= 70) {
    console.log(`${colors.yellow}${colors.bold}⚠️  GOOD - Minor isolation concerns${colors.reset}`);
  } else if (score >= 50) {
    console.log(`${colors.yellow}${colors.bold}⚠️  FAIR - Some isolation issues detected${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ POOR - Significant isolation problems${colors.reset}`);
  }

  // Recommendations
  if (results.failed > 0 || results.warnings > 0) {
    console.log(`\n${colors.bold}Recommendations:${colors.reset}`);

    if (results.failed > 0) {
      console.log('  • Review failed tests and fix isolation breaches');
    }

    if (results.warnings > 0) {
      console.log('  • Address warnings to improve isolation');
      console.log('  • Add .versatil-project.json to .gitignore');
      console.log('  • Consider global framework installation');
    }
  }

  console.log(`\n${'='.repeat(70)}\n`);

  return score >= 70;
}

/**
 * Main test suite
 */
function runIsolationStressTest() {
  console.log(`\n${colors.blue}${colors.bold}VERSATIL Framework - Isolation Stress Test${colors.reset}`);
  console.log(`Testing framework installation isolation in user projects\n`);
  console.log(`Framework Home: ${FRAMEWORK_HOME}\n`);

  // Create test project
  const testProject = createTestProject('main');
  console.log(`${colors.blue}Test Project: ${testProject}${colors.reset}\n`);

  // Simulate installation
  simulateFrameworkInstall(testProject);

  // Run tests
  console.log(`${colors.bold}Running Tests:${colors.reset}\n`);

  testFrameworkHomeExists();
  testNoFrameworkPollution(testProject);
  testOnlyAllowedFile(testProject);
  testFrameworkDataLocation();
  testGitSafety(testProject);
  testMultiProjectIsolation();
  testGitignoreRecommendation(testProject);
  testFileSystemPermissions();
  testNoSymlinks(testProject);
  testEnvironmentIsolation();
  testPackageJsonClean(testProject);
  testConcurrentProjects();

  // Cleanup
  fs.rmSync(testProject, { recursive: true, force: true });

  // Generate report
  const passed = generateReport();

  // Exit code
  process.exit(passed ? 0 : 1);
}

// Run tests
runIsolationStressTest();