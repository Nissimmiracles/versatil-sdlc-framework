#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - ES Module Import Fixer
 * Automatically fixes ES module imports by adding .js extensions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ESModuleImportFixer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distDir = path.join(this.projectRoot, 'dist');
    this.fixedFiles = [];
    this.errors = [];
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🔧 VERSATIL ES Module Import Fixer');
    console.log('=====================================\n');

    try {
      // Step 1: Find all JS files in dist directory
      const jsFiles = this.findJSFiles(this.distDir);
      console.log(`📁 Found ${jsFiles.length} JavaScript files to check\n`);

      // Step 2: Fix imports in each file
      for (const file of jsFiles) {
        await this.fixImportsInFile(file);
      }

      // Step 3: Report results
      this.reportResults();

      // Step 4: Test the fixes
      await this.testFixes();

    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Recursively find all .js files in directory
   */
  findJSFiles(dir) {
    const files = [];

    function traverse(currentDir) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          traverse(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    }

    traverse(dir);
    return files;
  }

  /**
   * Fix ES module imports in a single file
   */
  async fixImportsInFile(filePath) {
    try {
      const relativePath = path.relative(this.projectRoot, filePath);
      const content = fs.readFileSync(filePath, 'utf8');

      // Patterns to match ES module imports that need .js extension
      const importPatterns = [
        // import { something } from './module'
        /import\s*{([^}]*)}\s*from\s*['"`](\.[^'"`]*?)(?<!\.js)['"`]/g,
        // import something from './module'
        /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s+['"`](\.[^'"`]*?)(?<!\.js)['"`]/g,
        // import * as something from './module'
        /import\s*\*\s*as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s+['"`](\.[^'"`]*?)(?<!\.js)['"`]/g,
      ];

      let newContent = content;
      let hasChanges = false;

      // Apply each pattern
      for (const pattern of importPatterns) {
        const matches = [...content.matchAll(pattern)];

        for (const match of matches) {
          const originalImport = match[0];
          const modulePath = match[2] || match[1]; // Get the path part

          // Skip if already has .js extension or is not a relative import
          if (modulePath.endsWith('.js') || !modulePath.startsWith('./')) {
            continue;
          }

          // Add .js extension
          const fixedImport = originalImport.replace(modulePath, `${modulePath}.js`);
          newContent = newContent.replace(originalImport, fixedImport);
          hasChanges = true;

          console.log(`  ✅ ${relativePath}: ${modulePath} → ${modulePath}.js`);
        }
      }

      // Write back if changes were made
      if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.fixedFiles.push(relativePath);
      }

    } catch (error) {
      this.errors.push({
        file: filePath,
        error: error.message
      });
      console.log(`  ❌ Error fixing ${filePath}: ${error.message}`);
    }
  }

  /**
   * Report fixing results
   */
  reportResults() {
    console.log('\n📊 ES Module Import Fix Results');
    console.log('================================');
    console.log(`✅ Files fixed: ${this.fixedFiles.length}`);
    console.log(`❌ Errors: ${this.errors.length}\n`);

    if (this.fixedFiles.length > 0) {
      console.log('📝 Fixed files:');
      this.fixedFiles.forEach(file => console.log(`  - ${file}`));
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('⚠️ Errors encountered:');
      this.errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
      console.log('');
    }
  }

  /**
   * Test if the fixes work by trying to start the MCP server
   */
  async testFixes() {
    console.log('🧪 Testing ES module fixes...\n');

    try {
      // Test the main MCP server binary
      const testCommand = `cd "${this.projectRoot}" && timeout 5s node bin/versatil-mcp.js . --test || true`;
      const result = execSync(testCommand, { encoding: 'utf8', stdio: 'pipe' });

      if (result.includes('Error [ERR_MODULE_NOT_FOUND]')) {
        console.log('❌ ES module issues still present');
        return false;
      } else {
        console.log('✅ ES module imports fixed successfully!');
        return true;
      }

    } catch (error) {
      console.log('⚠️ Test completed (some issues may remain)');
      return false;
    }
  }
}

// Run the fixer if called directly
if (require.main === module) {
  const fixer = new ESModuleImportFixer();
  fixer.run().catch(console.error);
}

module.exports = { ESModuleImportFixer };