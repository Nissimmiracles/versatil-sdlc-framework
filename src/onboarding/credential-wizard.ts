/**
 * VERSATIL SDLC Framework - Credential Wizard
 * Interactive CLI wizard for setting up service credentials
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ServiceTemplate,
  CredentialField,
  getServiceTemplate,
  getAllServiceTemplates,
  getRequiredServices,
  getOptionalServices,
  detectNeededServices
} from './credential-templates.js';
import {
  validateField,
  validateServiceCredentials,
  testServiceConnection,
  ConnectionTestResult
} from './credential-validator.js';

export interface CredentialWizardOptions {
  services?: string[]; // Specific services to configure
  skipTests?: boolean; // Skip connection testing
  outputPath?: string; // Custom .env path
  interactive?: boolean; // Interactive mode (default: true)
}

export interface CredentialWizardResult {
  success: boolean;
  configured: string[];
  skipped: string[];
  failed: string[];
  testResults: ConnectionTestResult[];
  envPath: string;
}

export class CredentialWizard {
  private rl: readline.Interface;
  private versatilHome: string;
  private envPath: string;
  private existingCredentials: Map<string, Record<string, string>> = new Map();

  constructor(options: CredentialWizardOptions = {}) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // ISOLATION: Credentials stored in ~/.versatil/.env
    this.versatilHome = path.join(os.homedir(), '.versatil');
    this.envPath = options.outputPath || path.join(this.versatilHome, '.env');

    // Ensure .versatil directory exists (synchronous for constructor)
    const fsSync = require('fs');
    if (!fsSync.existsSync(this.versatilHome)) {
      fsSync.mkdirSync(this.versatilHome, { recursive: true });
    }

    // Load existing credentials
    this.loadExistingCredentials();
  }

  /**
   * Load existing credentials from .env file
   */
  private loadExistingCredentials(): void {
    if (!fs.existsSync(this.envPath)) {
      return;
    }

    try {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const lines = envContent.split('\n');

      const currentService: Record<string, string> = {};

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }

        // Parse KEY=VALUE
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          currentService[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        }
      }

      // Group credentials by service
      for (const service of getAllServiceTemplates()) {
        const serviceCreds: Record<string, string> = {};
        for (const field of service.credentials) {
          if (currentService[field.key]) {
            serviceCreds[field.key] = currentService[field.key];
          }
        }
        if (Object.keys(serviceCreds).length > 0) {
          this.existingCredentials.set(service.id, serviceCreds);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not load existing credentials: ${error}`);
    }
  }

  /**
   * Ask a question and get user input
   */
  private ask(question: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Ask a yes/no question
   */
  private async askYesNo(question: string, defaultYes: boolean = true): Promise<boolean> {
    const defaultStr = defaultYes ? 'Y/n' : 'y/N';
    const answer = await this.ask(`${question} (${defaultStr}): `);

    if (!answer) {
      return defaultYes;
    }

    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  /**
   * Ask for credential field value with validation
   */
  private async askForField(
    field: CredentialField,
    existingValue?: string
  ): Promise<string> {
    let value = '';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      // Show existing value if available
      const prompt = existingValue
        ? `${field.label} [current: ${this.maskSensitive(field, existingValue)}]: `
        : `${field.label}${field.required ? ' *' : ' (optional)'}: `;

      // For password fields, hide input
      if (field.type === 'password') {
        value = await this.askPassword(prompt);
      } else {
        value = await this.ask(prompt);
      }

      // Use existing value if user pressed Enter
      if (!value && existingValue) {
        value = existingValue;
      }

      // Use default if provided and no input
      if (!value && field.default) {
        value = field.default;
      }

      // Show help text for first attempt
      if (attempts === 0 && field.helpText) {
        console.log(`  ℹ️  ${field.helpText}`);
      }

      // Validate
      const validation = validateField(field, value);
      if (validation.valid) {
        return value;
      } else {
        attempts++;
        console.log(`  ❌ ${validation.message}`);

        if (attempts < maxAttempts) {
          console.log(`  Try again (${maxAttempts - attempts} attempts left)\n`);
        } else {
          throw new Error(`Failed to validate ${field.label} after ${maxAttempts} attempts`);
        }
      }
    }

    return value;
  }

  /**
   * Ask for password (hidden input)
   */
  private async askPassword(prompt: string): Promise<string> {
    return new Promise(resolve => {
      const stdin = process.stdin;
      const stdout = process.stdout;

      stdout.write(prompt);

      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      let password = '';

      const onData = (char: string) => {
        const charStr = String(char);

        switch (char) {
          case '\n':
          case '\r':
          case '\u0004': // Ctrl+D
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('data', onData);
            stdout.write('\n');
            resolve(password);
            break;

          case '\u0003': // Ctrl+C
            stdin.setRawMode(false);
            process.exit(0);
            break;

          case '\u007f': // Backspace
          case '\b':
            if (password.length > 0) {
              password = password.slice(0, -1);
              stdout.write('\b \b');
            }
            break;

          default:
            password += char;
            stdout.write('*');
            break;
        }
      };

      stdin.on('data', onData);
    });
  }

  /**
   * Mask sensitive values for display
   */
  private maskSensitive(field: CredentialField, value: string): string {
    if (field.type === 'password' && value) {
      return `${'*'.repeat(Math.min(value.length, 20))}`;
    }
    if (field.type === 'file') {
      return path.basename(value);
    }
    return value.substring(0, 40) + (value.length > 40 ? '...' : '');
  }

  /**
   * Configure a single service
   */
  private async configureService(
    service: ServiceTemplate,
    skipTests: boolean = false
  ): Promise<{ configured: boolean; credentials?: Record<string, string>; testResult?: ConnectionTestResult }> {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`\n📦 ${service.name} Setup\n`);
    console.log(`${service.description}`);
    console.log(`Use case: ${service.useCase}\n`);

    // Check if already configured
    const existing = this.existingCredentials.get(service.id);
    if (existing) {
      console.log(`✅ Already configured`);
      const reconfigure = await this.askYesNo('Reconfigure?', false);
      if (!reconfigure) {
        return { configured: true, credentials: existing };
      }
    }

    // Show setup guide link
    if (service.signupUrl) {
      console.log(`🔗 Need an account? ${service.signupUrl}`);
    }
    if (service.setupGuide) {
      console.log(`📖 Setup guide: ${service.setupGuide}`);
    }
    console.log('');

    // Ask if user wants to configure
    const shouldConfigure = await this.askYesNo(`Configure ${service.name} now?`, !service.required);
    if (!shouldConfigure) {
      if (service.fallbackAvailable) {
        console.log(`ℹ️  ${service.name} will use fallback: ${service.fallbackDescription}`);
      }
      return { configured: false };
    }

    // Collect credentials
    const credentials: Record<string, string> = {};

    for (const field of service.credentials) {
      const existingValue = existing?.[field.key];
      const value = await this.askForField(field, existingValue);
      credentials[field.key] = value;
    }

    // Validate all credentials
    const validation = validateServiceCredentials(service, credentials);
    if (!validation.valid) {
      console.log(`\n❌ Validation failed: ${validation.message}`);
      return { configured: false };
    }

    // Test connection if not skipped
    let testResult: ConnectionTestResult | undefined;
    if (!skipTests) {
      console.log(`\n🧪 Testing connection...`);
      testResult = await testServiceConnection(service.id, credentials);

      if (testResult.success) {
        console.log(`✅ ${testResult.message} ${testResult.latency ? `(${testResult.latency}ms)` : ''}`);
      } else {
        console.log(`❌ ${testResult.message}`);
        const continueAnyway = await this.askYesNo('Save credentials anyway?', false);
        if (!continueAnyway) {
          return { configured: false, testResult };
        }
      }
    }

    console.log(`\n✅ ${service.name} configured successfully`);

    return { configured: true, credentials, testResult };
  }

  /**
   * Run the credential wizard
   */
  async run(options: CredentialWizardOptions = {}): Promise<CredentialWizardResult> {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   🔐 VERSATIL Credential Onboarding Wizard   🔐        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('This wizard will help you configure API keys and credentials');
    console.log('for external services used by the VERSATIL framework.\n');
    console.log(`Credentials will be stored securely in: ${this.envPath}\n`);

    const result: CredentialWizardResult = {
      success: false,
      configured: [],
      skipped: [],
      failed: [],
      testResults: [],
      envPath: this.envPath
    };

    try {
      // Determine which services to configure
      let servicesToConfigure: ServiceTemplate[];

      if (options.services && options.services.length > 0) {
        // Configure specific services
        servicesToConfigure = options.services
          .map(id => getServiceTemplate(id))
          .filter((s): s is ServiceTemplate => s !== undefined);
      } else {
        // Show menu
        console.log('Which services would you like to configure?\n');
        console.log('1. Required services only (Supabase)');
        console.log('2. Recommended services (Supabase + GitHub + Vertex AI)');
        console.log('3. All available services');
        console.log('4. Custom selection\n');

        const choice = await this.ask('Your choice (1-4): ');

        switch (choice) {
          case '1':
            servicesToConfigure = getRequiredServices();
            break;

          case '2':
            servicesToConfigure = [
              getServiceTemplate('supabase')!,
              getServiceTemplate('github')!,
              getServiceTemplate('vertex-ai')!
            ];
            break;

          case '3':
            servicesToConfigure = getAllServiceTemplates();
            break;

          case '4':
            servicesToConfigure = await this.customSelection();
            break;

          default:
            servicesToConfigure = getRequiredServices();
        }
      }

      console.log(`\n📊 Services to configure: ${servicesToConfigure.length}\n`);

      // Configure each service
      const allCredentials: Record<string, Record<string, string>> = {};

      for (const service of servicesToConfigure) {
        const { configured, credentials, testResult } = await this.configureService(
          service,
          options.skipTests || false
        );

        if (configured && credentials) {
          allCredentials[service.id] = credentials;
          result.configured.push(service.id);
        } else {
          if (service.required) {
            result.failed.push(service.id);
          } else {
            result.skipped.push(service.id);
          }
        }

        if (testResult) {
          result.testResults.push(testResult);
        }
      }

      // Save credentials to .env file
      if (Object.keys(allCredentials).length > 0) {
        this.saveCredentials(allCredentials);
        console.log(`\n💾 Credentials saved to: ${this.envPath}`);
      }

      // Show summary
      this.showSummary(result);

      result.success = result.failed.length === 0;

      return result;
    } catch (error) {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    } finally {
      this.rl.close();
    }
  }

  /**
   * Custom service selection
   */
  private async customSelection(): Promise<ServiceTemplate[]> {
    const allServices = getAllServiceTemplates();
    const selected: ServiceTemplate[] = [];

    console.log('\nSelect services to configure:\n');

    for (const service of allServices) {
      const current = this.existingCredentials.has(service.id) ? '✅' : '❌';
      const shouldSelect = await this.askYesNo(
        `${current} ${service.name} - ${service.description}`,
        service.required
      );

      if (shouldSelect) {
        selected.push(service);
      }
    }

    return selected;
  }

  /**
   * Save credentials to .env file
   */
  private saveCredentials(allCredentials: Record<string, Record<string, string>>): void {
    const envLines: string[] = [];

    envLines.push('# VERSATIL SDLC Framework - Service Credentials');
    envLines.push('# Generated by Credential Wizard');
    envLines.push(`# Date: ${new Date().toISOString()}`);
    envLines.push('# ⚠️  KEEP THIS FILE SECRET - DO NOT COMMIT TO VERSION CONTROL');
    envLines.push('');

    for (const [serviceId, credentials] of Object.entries(allCredentials)) {
      const service = getServiceTemplate(serviceId);
      if (!service) continue;

      envLines.push(`# ─────────────────────────────────────────────────────────`);
      envLines.push(`# ${service.name}`);
      envLines.push(`# ${service.description}`);
      envLines.push('');

      for (const field of service.credentials) {
        if (credentials[field.key]) {
          envLines.push(`${field.key}="${credentials[field.key]}"`);
        }
      }

      envLines.push('');
    }

    // Write to file
    fs.writeFileSync(this.envPath, envLines.join('\n'), { mode: 0o600 }); // User read/write only
    console.log(`\n✅ Credentials saved with permissions 600 (user-only access)`);
  }

  /**
   * Show summary of configuration
   */
  private showSummary(result: CredentialWizardResult): void {
    console.log(`\n${'═'.repeat(60)}`);
    console.log('\n📊 Configuration Summary\n');

    if (result.configured.length > 0) {
      console.log(`✅ Configured (${result.configured.length}):`);
      result.configured.forEach(id => {
        const service = getServiceTemplate(id);
        console.log(`   • ${service?.name}`);
      });
      console.log('');
    }

    if (result.skipped.length > 0) {
      console.log(`⏩ Skipped (${result.skipped.length}):`);
      result.skipped.forEach(id => {
        const service = getServiceTemplate(id);
        console.log(`   • ${service?.name}`);
      });
      console.log('');
    }

    if (result.failed.length > 0) {
      console.log(`❌ Failed (${result.failed.length}):`);
      result.failed.forEach(id => {
        const service = getServiceTemplate(id);
        console.log(`   • ${service?.name}`);
      });
      console.log('');
    }

    if (result.testResults.length > 0) {
      const passed = result.testResults.filter(r => r.success).length;
      const total = result.testResults.length;
      console.log(`🧪 Connection Tests: ${passed}/${total} passed\n`);
    }

    console.log(`Credentials saved to: ${result.envPath}`);
    console.log(`\n${'═'.repeat(60)}\n`);

    if (result.success) {
      console.log('✅ Setup complete! You\'re ready to use VERSATIL framework.\n');
      console.log('Next steps:');
      console.log('  • Start the daemon: versatil-daemon start');
      console.log('  • Test credentials: versatil credentials test');
      console.log('  • View configured services: versatil credentials list\n');
    } else {
      console.log('⚠️  Setup incomplete. Some required services failed.\n');
      console.log('To retry:');
      console.log('  • Run: versatil setup credentials');
      console.log('  • Or configure specific service: versatil setup credentials --service <name>\n');
    }
  }

  /**
   * List configured services
   */
  static async listConfigured(): Promise<void> {
    const wizard = new CredentialWizard();
    console.log('\n📊 Configured Services:\n');

    const allServices = getAllServiceTemplates();
    for (const service of allServices) {
      const configured = wizard.existingCredentials.has(service.id);
      const icon = configured ? '✅' : '❌';
      console.log(`${icon} ${service.name} - ${service.description}`);
    }

    console.log('');
    wizard.rl.close();
  }

  /**
   * Test configured credentials
   */
  static async testConfigured(): Promise<void> {
    const wizard = new CredentialWizard();
    console.log('\n🧪 Testing Configured Credentials...\n');

    for (const [serviceId, credentials] of wizard.existingCredentials.entries()) {
      const service = getServiceTemplate(serviceId);
      if (!service) continue;

      process.stdout.write(`Testing ${service.name}... `);

      const result = await testServiceConnection(serviceId, credentials);

      if (result.success) {
        console.log(`✅ ${result.message} ${result.latency ? `(${result.latency}ms)` : ''}`);
      } else {
        console.log(`❌ ${result.message}`);
      }
    }

    console.log('');
    wizard.rl.close();
  }
}
