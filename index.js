#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Main Entry Point
 * AI-Native Development Lifecycle with BMAD Methodology
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

class VersatilCLI {
  constructor() {
    this.packageRoot = __dirname;
    this.currentDir = process.cwd();
  }

  showHeader() {
    console.log(`${colors.blue}╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║                    VERSATIL SDLC FRAMEWORK                   ║`);
    console.log(`║                 AI-Native Development Lifecycle              ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log('');
    console.log('🤖 BMAD Methodology with 6 Specialized AI Agents');
    console.log('🧪 Chrome MCP Primary Testing Framework');
    console.log('⚡ Auto-Agent Activation & Context Preservation');
    console.log('');
  }

  showHelp() {
    this.showHeader();
    console.log('Usage: versatil-sdlc <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  init [template]    Initialize VERSATIL in current directory');
    console.log('  validate          Validate VERSATIL setup');
    console.log('  agents            Configure agents');
    console.log('  version           Show version information');
    console.log('  help              Show this help message');
    console.log('');
    console.log('Templates:');
    console.log('  basic             Basic project setup (default)');
    console.log('  enterprise        Enterprise setup with Docker');
    console.log('');
    console.log('Examples:');
    console.log('  versatil-sdlc init              # Initialize with basic template');
    console.log('  versatil-sdlc init enterprise   # Initialize with enterprise template');
    console.log('  versatil-sdlc validate          # Validate current setup');
    console.log('  versatil-sdlc agents            # Configure agents');
    console.log('');
    console.log('Agent Commands (after initialization):');
    console.log('  npm run maria:test              # Maria-QA testing');
    console.log('  npm run james:lint              # James-Frontend linting');
    console.log('  npm run marcus:security         # Marcus-Backend security');
    console.log('');
    console.log('For more help: https://github.com/versatil-platform/versatil-sdlc-framework');
  }

  showVersion() {
    const packageJson = JSON.parse(fs.readFileSync(path.join(this.packageRoot, 'package.json'), 'utf8'));
    this.showHeader();
    console.log(`Version: ${packageJson.version}`);
    console.log(`Description: ${packageJson.description}`);
    console.log(`Homepage: ${packageJson.homepage || 'https://github.com/versatil-platform/versatil-sdlc-framework'}`);
    console.log('');
    console.log('🤖 Agents Available:');
    console.log('  🧪 Maria-QA      - Quality Assurance Lead');
    console.log('  🎨 James-Frontend - Frontend Specialist');
    console.log('  ⚙️ Marcus-Backend - Backend Expert');
    console.log('  📋 Sarah-PM      - Project Manager');
    console.log('  📊 Alex-BA       - Business Analyst');
    console.log('  🤖 Dr.AI-ML      - AI/ML Specialist');
  }

  async init(template = 'basic') {
    this.showHeader();
    log.info(`Initializing VERSATIL SDLC Framework with ${template} template...`);

    try {
      // Check if already initialized
      if (fs.existsSync('.versatil/project-config.json')) {
        log.warning('VERSATIL already initialized in this directory.');
        log.info('Run "versatil-sdlc validate" to check the setup.');
        return;
      }

      // Copy framework files
      await this.copyFrameworkFiles();

      // Copy template files
      await this.copyTemplate(template);

      // Run setup script
      await this.runSetup();

      log.success('VERSATIL SDLC Framework initialized successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('1. npm install                   # Install dependencies');
      console.log('2. npm run versatil:validate     # Validate setup');
      console.log('3. npm run versatil:agents       # Configure agents');
      console.log('4. Open in Cursor IDE for optimal agent experience');
      console.log('');
      console.log('📚 Documentation: docs/getting-started.md');

    } catch (error) {
      log.error(`Initialization failed: ${error.message}`);
      process.exit(1);
    }
  }

  async copyFrameworkFiles() {
    log.info('Copying VERSATIL framework files...');

    const frameworkFiles = [
      '.cursorrules',
      'CLAUDE.md',
      '.versatil/',
      'scripts/',
      'docs/'
    ];

    for (const file of frameworkFiles) {
      const source = path.join(this.packageRoot, file);
      const dest = path.join(this.currentDir, file);

      if (fs.existsSync(source)) {
        if (fs.lstatSync(source).isDirectory()) {
          this.copyDirectory(source, dest);
        } else {
          this.copyFile(source, dest);
        }
      }
    }
  }

  async copyTemplate(template) {
    log.info(`Copying ${template} template files...`);

    const templatePath = path.join(this.packageRoot, 'templates', `${template}-project-setup`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template "${template}" not found. Available templates: basic, enterprise`);
    }

    this.copyDirectory(templatePath, this.currentDir);
  }

  copyDirectory(source, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(source);

    for (const file of files) {
      const sourcePath = path.join(source, file);
      const destPath = path.join(dest, file);

      if (fs.lstatSync(sourcePath).isDirectory()) {
        this.copyDirectory(sourcePath, destPath);
      } else {
        this.copyFile(sourcePath, destPath);
      }
    }
  }

  copyFile(source, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(source, dest);
  }

  async runSetup() {
    log.info('Running VERSATIL setup...');

    const setupScript = path.join(this.currentDir, 'scripts', 'setup-agents.js');

    if (fs.existsSync(setupScript)) {
      execSync(`node "${setupScript}"`, {
        stdio: 'inherit',
        cwd: this.currentDir
      });
    }
  }

  async validate() {
    log.info('Validating VERSATIL setup...');

    const validateScript = path.join(this.currentDir, 'scripts', 'validate-setup.js');

    if (fs.existsSync(validateScript)) {
      execSync(`node "${validateScript}"`, {
        stdio: 'inherit',
        cwd: this.currentDir
      });
    } else {
      log.error('VERSATIL not initialized. Run "versatil-sdlc init" first.');
    }
  }

  async configureAgents() {
    log.info('Configuring VERSATIL agents...');

    const agentsScript = path.join(this.currentDir, 'scripts', 'setup-agents.js');

    if (fs.existsSync(agentsScript)) {
      execSync(`node "${agentsScript}"`, {
        stdio: 'inherit',
        cwd: this.currentDir
      });
    } else {
      log.error('VERSATIL not initialized. Run "versatil-sdlc init" first.');
    }
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];
    const options = args.slice(1);

    switch (command) {
      case 'init':
        await this.init(options[0]);
        break;

      case 'validate':
        await this.validate();
        break;

      case 'agents':
        await this.configureAgents();
        break;

      case 'version':
      case '--version':
      case '-v':
        this.showVersion();
        break;

      case 'help':
      case '--help':
      case '-h':
      case undefined:
        this.showHelp();
        break;

      default:
        log.error(`Unknown command: ${command}`);
        console.log('Run "versatil-sdlc help" for available commands.');
        process.exit(1);
    }
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}[FATAL ERROR]${colors.reset} ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}[UNHANDLED REJECTION]${colors.reset}`, reason);
  process.exit(1);
});

// Run CLI if called directly
if (require.main === module) {
  const cli = new VersatilCLI();
  cli.run();
}

module.exports = VersatilCLI;