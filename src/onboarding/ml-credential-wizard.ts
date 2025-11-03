/* eslint-disable no-empty, no-case-declarations */
/**
 * VERSATIL SDLC Framework - ML Workflow Multi-Cloud Credential Wizard
 * Interactive CLI wizard for setting up ML workflow credentials on GCP, AWS, or Supabase
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { SERVICE_TEMPLATES, ServiceTemplate, CredentialField } from './credential-templates';

interface WizardState {
  cloudProvider: 'gcp' | 'aws' | 'supabase' | null;
  credentials: Record<string, string>;
  servicesSelected: string[];
}

const VERSATIL_CONFIG_DIR = path.join(os.homedir(), '.versatil');
const CREDENTIALS_DIR = path.join(VERSATIL_CONFIG_DIR, 'credentials');

/**
 * Create readline interface for interactive CLI
 */
function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompt user for input
 */
function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Print colored output
 */
function printHeader(text: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${text}`);
  console.log('='.repeat(80) + '\n');
}

function printSuccess(text: string) {
  console.log(`✅ ${text}`);
}

function printError(text: string) {
  console.log(`❌ ${text}`);
}

function printWarning(text: string) {
  console.log(`⚠️  ${text}`);
}

function printInfo(text: string) {
  console.log(`ℹ️  ${text}`);
}

/**
 * Detect existing cloud provider from environment
 */
function detectCloudProvider(): 'gcp' | 'aws' | 'supabase' | null {
  // Check environment variables
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return 'gcp';
  }
  if (process.env.AWS_REGION || process.env.AWS_ACCESS_KEY_ID) {
    return 'aws';
  }
  if (process.env.SUPABASE_URL) {
    return 'supabase';
  }

  // Check for credential files
  const gcpKeyPath = path.join(CREDENTIALS_DIR, 'gcp.json');
  const awsKeyPath = path.join(CREDENTIALS_DIR, 'aws.json');
  const supabaseKeyPath = path.join(CREDENTIALS_DIR, 'supabase.json');

  if (fs.existsSync(gcpKeyPath)) return 'gcp';
  if (fs.existsSync(awsKeyPath)) return 'aws';
  if (fs.existsSync(supabaseKeyPath)) return 'supabase';

  // Check for gcloud/aws CLI installation
  try {
    execSync('gcloud --version', { stdio: 'ignore' });
    return 'gcp';
  } catch {}

  try {
    execSync('aws --version', { stdio: 'ignore' });
    return 'aws';
  } catch {}

  return null;
}

/**
 * Select cloud provider
 */
async function selectCloudProvider(rl: readline.Interface, detected: string | null): Promise<'gcp' | 'aws' | 'supabase'> {
  printHeader('Cloud Provider Selection');

  console.log('Which cloud provider do you want to use for ML workflows?\n');
  console.log('1. Google Cloud Platform (GCP)');
  console.log('   - Cloud SQL PostgreSQL with pgvector');
  console.log('   - Vertex AI for model training');
  console.log('   - Cloud Run for API deployment');
  console.log('   - Cost: ~$110/month (db-custom-2-7680)\n');

  console.log('2. Amazon Web Services (AWS)');
  console.log('   - RDS PostgreSQL with pgvector');
  console.log('   - SageMaker for model training');
  console.log('   - ECS/Lambda for API deployment');
  console.log('   - Cost: ~$150/month (db.r6g.large)\n');

  console.log('3. Supabase');
  console.log('   - Managed PostgreSQL with pgvector');
  console.log('   - Edge Functions for serverless');
  console.log('   - Built-in authentication and storage');
  console.log('   - Cost: Free tier available, $25/month Pro\n');

  if (detected) {
    printInfo(`Detected existing setup: ${detected.toUpperCase()}`);
  }

  const choice = await prompt(rl, 'Enter your choice (1-3): ');

  switch (choice) {
    case '1':
      return 'gcp';
    case '2':
      return 'aws';
    case '3':
      return 'supabase';
    default:
      printError('Invalid choice. Please enter 1, 2, or 3.');
      return selectCloudProvider(rl, detected);
  }
}

/**
 * Validate credential field
 */
function validateField(field: CredentialField, value: string): string | true {
  if (field.required && !value) {
    return `${field.label} is required`;
  }

  if (field.validation) {
    const result = field.validation(value);
    if (result !== true) {
      return result as string;
    }
  }

  return true;
}

/**
 * Collect credentials for a service
 */
async function collectServiceCredentials(
  rl: readline.Interface,
  service: ServiceTemplate
): Promise<Record<string, string>> {
  printHeader(`Setup: ${service.name}`);

  console.log(`${service.description}\n`);
  console.log(`Use Case: ${service.useCase}\n`);

  if (service.signupUrl) {
    printInfo(`Sign up: ${service.signupUrl}`);
  }
  if (service.docsUrl) {
    printInfo(`Docs: ${service.docsUrl}\n`);
  }

  const credentials: Record<string, string> = {};

  for (const field of service.credentials) {
    let value = '';
    let isValid = false;

    while (!isValid) {
      const promptText = field.required
        ? `${field.label} (required): `
        : `${field.label} (optional, default: ${field.default || 'none'}): `;

      if (field.helpText) {
        console.log(`  ${field.helpText}`);
      }

      const input = await prompt(rl, promptText);
      value = input || field.default || '';

      const validation = validateField(field, value);
      if (validation === true) {
        isValid = true;
        credentials[field.key] = value;
        if (value) {
          printSuccess(`${field.label} configured`);
        }
      } else {
        printError(validation);
      }
    }
  }

  return credentials;
}

/**
 * Test database connection
 */
async function testDatabaseConnection(
  provider: 'gcp' | 'aws' | 'supabase',
  credentials: Record<string, string>
): Promise<boolean> {
  printInfo('Testing database connection...');

  try {
    let connectionString = '';

    switch (provider) {
      case 'gcp':
        // Cloud SQL connection
        const gcpHost = credentials.CLOUD_SQL_INSTANCE_IP || 'localhost';
        const gcpDb = credentials.CLOUD_SQL_DATABASE_NAME || 'postgres';
        const gcpUser = credentials.CLOUD_SQL_USERNAME || 'postgres';
        const gcpPassword = credentials.CLOUD_SQL_PASSWORD || '';
        connectionString = `postgresql://${gcpUser}:${gcpPassword}@${gcpHost}:5432/${gcpDb}`;
        break;

      case 'aws':
        // RDS connection
        const rdsEndpoint = credentials.RDS_ENDPOINT;
        const rdsDb = credentials.RDS_DATABASE_NAME;
        const rdsUser = credentials.RDS_USERNAME;
        const rdsPassword = credentials.RDS_PASSWORD;
        connectionString = `postgresql://${rdsUser}:${rdsPassword}@${rdsEndpoint}:5432/${rdsDb}`;
        break;

      case 'supabase':
        // Supabase direct connection
        const supabaseUrl = credentials.SUPABASE_URL;
        const supabasePassword = credentials.SUPABASE_DB_PASSWORD;
        // Extract host from URL (e.g., https://xyz.supabase.co -> xyz.supabase.co)
        const supabaseHost = supabaseUrl.replace(/^https?:\/\//, '').split('/')[0];
        connectionString = `postgresql://postgres:${supabasePassword}@db.${supabaseHost}:5432/postgres`;
        break;
    }

    // Test connection using psql
    execSync(`psql "${connectionString}" -c "SELECT 1" > /dev/null 2>&1`, { stdio: 'ignore' });
    printSuccess('Database connection successful!');
    return true;
  } catch (error) {
    printWarning('Database connection test failed (this is OK if database is not yet created)');
    return false;
  }
}

/**
 * Save credentials to file
 */
function saveCredentials(
  provider: 'gcp' | 'aws' | 'supabase',
  credentials: Record<string, string>
): void {
  // Ensure credentials directory exists
  if (!fs.existsSync(CREDENTIALS_DIR)) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
  }

  // Save provider-specific credentials
  const credentialFile = path.join(CREDENTIALS_DIR, `${provider}.json`);
  fs.writeFileSync(credentialFile, JSON.stringify(credentials, null, 2));
  printSuccess(`Credentials saved to ${credentialFile}`);

  // Create .env file for easy sourcing
  const envFile = path.join(CREDENTIALS_DIR, `${provider}.env`);
  const envContent = Object.entries(credentials)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');
  fs.writeFileSync(envFile, envContent);
  printSuccess(`Environment file created: ${envFile}`);

  // Set file permissions (readable only by owner)
  fs.chmodSync(credentialFile, 0o600);
  fs.chmodSync(envFile, 0o600);
}

/**
 * Generate setup script
 */
function generateSetupScript(
  provider: 'gcp' | 'aws' | 'supabase',
  credentials: Record<string, string>
): void {
  const scriptsDir = path.join(process.cwd(), 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  let scriptContent = '';
  let scriptPath = '';

  switch (provider) {
    case 'gcp':
      scriptPath = path.join(scriptsDir, 'setup-ml-gcp.sh');
      scriptContent = `#!/bin/bash
# GCP ML Workflow Setup Script
# Generated by VERSATIL ML Credential Wizard

set -e

echo "🚀 Setting up ML Workflow on Google Cloud Platform..."

# Load credentials
export GOOGLE_CLOUD_PROJECT="${credentials.GOOGLE_CLOUD_PROJECT || ''}"
export GOOGLE_CLOUD_LOCATION="${credentials.GOOGLE_CLOUD_LOCATION || 'us-central1'}"
export GOOGLE_APPLICATION_CREDENTIALS="${credentials.GOOGLE_APPLICATION_CREDENTIALS || ''}"

# Enable required APIs
echo "📦 Enabling GCP APIs..."
gcloud services enable sqladmin.googleapis.com --project=\${GOOGLE_CLOUD_PROJECT}
gcloud services enable aiplatform.googleapis.com --project=\${GOOGLE_CLOUD_PROJECT}
gcloud services enable run.googleapis.com --project=\${GOOGLE_CLOUD_PROJECT}
gcloud services enable compute.googleapis.com --project=\${GOOGLE_CLOUD_PROJECT}

# Create Cloud SQL instance (if not exists)
echo "🗄️  Creating Cloud SQL instance..."
if ! gcloud sql instances describe ml-workflow-db --project=\${GOOGLE_CLOUD_PROJECT} 2>/dev/null; then
  gcloud sql instances create ml-workflow-db \\
    --database-version=POSTGRES_15 \\
    --tier=db-custom-2-7680 \\
    --region=\${GOOGLE_CLOUD_LOCATION} \\
    --database-flags=cloudsql.iam_authentication=on \\
    --backup-start-time=02:00 \\
    --project=\${GOOGLE_CLOUD_PROJECT}

  echo "⏳ Waiting for instance to be ready..."
  gcloud sql operations wait --project=\${GOOGLE_CLOUD_PROJECT} \\
    $(gcloud sql operations list --instance=ml-workflow-db --limit=1 --format="value(name)" --project=\${GOOGLE_CLOUD_PROJECT})
else
  echo "ℹ️  Instance ml-workflow-db already exists"
fi

# Create database
echo "📊 Creating database..."
gcloud sql databases create ml_workflow_dev \\
  --instance=ml-workflow-db \\
  --project=\${GOOGLE_CLOUD_PROJECT} || echo "Database already exists"

# Install pgvector extension
echo "🔌 Installing pgvector extension..."
gcloud sql connect ml-workflow-db --user=postgres --project=\${GOOGLE_CLOUD_PROJECT} <<SQL
CREATE EXTENSION IF NOT EXISTS vector;
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
SQL

echo "✅ GCP ML Workflow setup complete!"
echo ""
echo "Database URL: postgresql://postgres:PASSWORD@INSTANCE_IP:5432/ml_workflow_dev"
echo "Get instance IP: gcloud sql instances describe ml-workflow-db --format='value(ipAddresses[0].ipAddress)' --project=\${GOOGLE_CLOUD_PROJECT}"
`;
      break;

    case 'aws':
      scriptPath = path.join(scriptsDir, 'setup-ml-aws.sh');
      scriptContent = `#!/bin/bash
# AWS ML Workflow Setup Script
# Generated by VERSATIL ML Credential Wizard

set -e

echo "🚀 Setting up ML Workflow on Amazon Web Services..."

# Load credentials
export AWS_REGION="${credentials.AWS_REGION || 'us-east-1'}"
export AWS_ACCESS_KEY_ID="${credentials.AWS_ACCESS_KEY_ID || ''}"
export AWS_SECRET_ACCESS_KEY="${credentials.AWS_SECRET_ACCESS_KEY || ''}"

# Create RDS parameter group
echo "⚙️  Creating RDS parameter group..."
aws rds create-db-parameter-group \\
  --db-parameter-group-name ml-workflow-postgres15 \\
  --db-parameter-group-family postgres15 \\
  --description "PostgreSQL 15 with pgvector support" \\
  --region \${AWS_REGION} || echo "Parameter group already exists"

# Enable pgvector in parameter group
aws rds modify-db-parameter-group \\
  --db-parameter-group-name ml-workflow-postgres15 \\
  --parameters "ParameterName=shared_preload_libraries,ParameterValue=vector,ApplyMethod=pending-reboot" \\
  --region \${AWS_REGION} || true

# Create RDS instance
echo "🗄️  Creating RDS PostgreSQL instance..."
if ! aws rds describe-db-instances --db-instance-identifier ml-workflow-db --region \${AWS_REGION} 2>/dev/null; then
  aws rds create-db-instance \\
    --db-instance-identifier ml-workflow-db \\
    --db-instance-class db.t3.medium \\
    --engine postgres \\
    --engine-version 15.4 \\
    --master-username postgres \\
    --master-user-password "${credentials.RDS_PASSWORD || 'CHANGE_ME'}" \\
    --allocated-storage 100 \\
    --storage-type gp3 \\
    --backup-retention-period 7 \\
    --preferred-backup-window "02:00-03:00" \\
    --db-parameter-group-name ml-workflow-postgres15 \\
    --enable-cloudwatch-logs-exports postgresql \\
    --storage-encrypted \\
    --region \${AWS_REGION}

  echo "⏳ Waiting for RDS instance to be available (this may take 5-10 minutes)..."
  aws rds wait db-instance-available --db-instance-identifier ml-workflow-db --region \${AWS_REGION}
else
  echo "ℹ️  RDS instance ml-workflow-db already exists"
fi

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \\
  --db-instance-identifier ml-workflow-db \\
  --query 'DBInstances[0].Endpoint.Address' \\
  --output text \\
  --region \${AWS_REGION})

echo "✅ AWS ML Workflow setup complete!"
echo ""
echo "RDS Endpoint: \${RDS_ENDPOINT}"
echo "Database URL: postgresql://postgres:PASSWORD@\${RDS_ENDPOINT}:5432/ml_workflow_dev"
echo ""
echo "Next steps:"
echo "1. Connect to RDS: psql -h \${RDS_ENDPOINT} -U postgres -d postgres"
echo "2. Create database: CREATE DATABASE ml_workflow_dev;"
echo "3. Install pgvector: CREATE EXTENSION vector;"
`;
      break;

    case 'supabase':
      scriptPath = path.join(scriptsDir, 'setup-ml-supabase.sh');
      scriptContent = `#!/bin/bash
# Supabase ML Workflow Setup Script
# Generated by VERSATIL ML Credential Wizard

set -e

echo "🚀 Setting up ML Workflow on Supabase..."

# Load credentials
export SUPABASE_URL="${credentials.SUPABASE_URL || ''}"
export SUPABASE_ANON_KEY="${credentials.SUPABASE_ANON_KEY || ''}"
export SUPABASE_SERVICE_KEY="${credentials.SUPABASE_SERVICE_ROLE_KEY || ''}"

# Install Supabase CLI if not installed
if ! command -v supabase &> /dev/null; then
  echo "📦 Installing Supabase CLI..."
  npm install -g supabase
fi

# Initialize Supabase project
echo "🔧 Initializing Supabase project..."
supabase init || echo "Project already initialized"

# Link to remote project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref \${SUPABASE_URL##*//} || true

# Create migration for pgvector
echo "📝 Creating pgvector migration..."
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_enable_pgvector.sql <<SQL
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Test vector operations
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
SQL

# Push migrations
echo "⬆️  Pushing migrations to Supabase..."
supabase db push

echo "✅ Supabase ML Workflow setup complete!"
echo ""
echo "Supabase URL: \${SUPABASE_URL}"
echo "Project Dashboard: \${SUPABASE_URL}/project/default"
`;
      break;
  }

  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, 0o755);
  printSuccess(`Setup script created: ${scriptPath}`);
}

/**
 * Main wizard flow
 */
async function runWizard(): Promise<void> {
  const rl = createReadline();

  try {
    printHeader('VERSATIL ML Workflow - Multi-Cloud Credential Wizard');

    console.log('This wizard will help you set up credentials for ML workflow deployment.');
    console.log('You can choose between GCP (Cloud SQL), AWS (RDS), or Supabase.\n');

    // Detect existing setup
    const detected = detectCloudProvider();

    // Select cloud provider
    const provider = await selectCloudProvider(rl, detected);

    printSuccess(`Selected: ${provider.toUpperCase()}\n`);

    // Collect credentials based on provider
    let allCredentials: Record<string, string> = {};

    switch (provider) {
      case 'gcp':
        // Vertex AI credentials
        const vertexCreds = await collectServiceCredentials(rl, SERVICE_TEMPLATES['vertex-ai']);
        allCredentials = { ...allCredentials, ...vertexCreds };

        // Additional Cloud SQL specific fields
        printHeader('Cloud SQL Configuration');
        const cloudSqlIp = await prompt(rl, 'Cloud SQL Instance IP (if already created): ');
        const cloudSqlDb = await prompt(rl, 'Database Name (default: ml_workflow_dev): ') || 'ml_workflow_dev';
        const cloudSqlUser = await prompt(rl, 'Database Username (default: postgres): ') || 'postgres';
        const cloudSqlPassword = await prompt(rl, 'Database Password: ');

        allCredentials.CLOUD_SQL_INSTANCE_IP = cloudSqlIp;
        allCredentials.CLOUD_SQL_DATABASE_NAME = cloudSqlDb;
        allCredentials.CLOUD_SQL_USERNAME = cloudSqlUser;
        allCredentials.CLOUD_SQL_PASSWORD = cloudSqlPassword;
        break;

      case 'aws':
        // AWS credentials
        const awsCreds = await collectServiceCredentials(rl, SERVICE_TEMPLATES['aws-credentials']);
        allCredentials = { ...allCredentials, ...awsCreds };

        // RDS credentials
        const rdsCreds = await collectServiceCredentials(rl, SERVICE_TEMPLATES['aws-rds']);
        allCredentials = { ...allCredentials, ...rdsCreds };

        // SageMaker credentials (optional)
        const useSagemaker = await prompt(rl, 'Configure SageMaker for model training? (y/n): ');
        if (useSagemaker.toLowerCase() === 'y') {
          const sagemakerCreds = await collectServiceCredentials(rl, SERVICE_TEMPLATES['aws-sagemaker']);
          allCredentials = { ...allCredentials, ...sagemakerCreds };
        }
        break;

      case 'supabase':
        // Supabase credentials
        const supabaseCreds = await collectServiceCredentials(rl, SERVICE_TEMPLATES['supabase']);
        allCredentials = { ...allCredentials, ...supabaseCreds };
        break;
    }

    // Test connection
    const testConnection = await prompt(rl, '\nTest database connection? (y/n): ');
    if (testConnection.toLowerCase() === 'y') {
      await testDatabaseConnection(provider, allCredentials);
    }

    // Save credentials
    printHeader('Saving Credentials');
    saveCredentials(provider, allCredentials);

    // Generate setup script
    printHeader('Generating Setup Script');
    generateSetupScript(provider, allCredentials);

    // Final summary
    printHeader('Setup Complete!');
    printSuccess('Credentials configured successfully');
    console.log('\nNext steps:');
    console.log(`1. Review credentials: ${path.join(CREDENTIALS_DIR, provider + '.json')}`);
    console.log(`2. Source environment: source ${path.join(CREDENTIALS_DIR, provider + '.env')}`);
    console.log(`3. Run setup script: ./scripts/setup-ml-${provider}.sh`);
    console.log('4. Deploy ML workflow: npm run deploy\n');

    printInfo('Security reminder: Keep your credentials secure and never commit them to git!');

  } catch (error) {
    printError(`Wizard error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run wizard if executed directly
if (require.main === module) {
  runWizard().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runWizard, detectCloudProvider };
