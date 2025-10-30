/**
 * VERSATIL SDLC Framework - Credential Service Templates
 * Metadata for all MCP services requiring credentials
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'file' | 'url';
  required: boolean;
  default?: string;
  placeholder?: string;
  validation?: (value: string) => boolean | string;
  helpText?: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  category: 'ai' | 'database' | 'testing' | 'monitoring' | 'automation' | 'search' | 'security' | 'design' | 'infrastructure' | 'documentation';
  description: string;
  required: boolean;
  useCase: string;
  credentials: CredentialField[];
  setupGuide: string;
  signupUrl?: string;
  docsUrl?: string;
  testConnection?: (credentials: Record<string, string>) => Promise<boolean>;
  fallbackAvailable: boolean;
  fallbackDescription?: string;
  usedByAgents?: string[]; // NEW: Which OPERA agents use this service
}

/**
 * All service templates for credential onboarding
 */
export const SERVICE_TEMPLATES: Record<string, ServiceTemplate> = {
  'vertex-ai': {
    id: 'vertex-ai',
    name: 'Google Vertex AI',
    category: 'ai',
    description: 'AI-powered code generation using Gemini models',
    required: false,
    useCase: 'Use Gemini for code generation, embeddings, and AI analysis',
    usedByAgents: ['dr-ai-ml'],
    credentials: [
      {
        key: 'GOOGLE_CLOUD_PROJECT',
        label: 'GCP Project ID',
        type: 'text',
        required: true,
        placeholder: 'my-project-id',
        validation: (value) => {
          if (!value) return 'Project ID is required';
          if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(value)) {
            return 'Invalid project ID format (lowercase, alphanumeric + hyphens, 6-30 chars)';
          }
          return true;
        },
        helpText: 'Your Google Cloud Project ID (e.g., versatil-ai-project)'
      },
      {
        key: 'GOOGLE_CLOUD_LOCATION',
        label: 'GCP Region',
        type: 'text',
        required: true,
        default: 'us-central1',
        placeholder: 'us-central1',
        validation: (value) => {
          const validRegions = ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-southeast1'];
          if (!validRegions.includes(value)) {
            return `Must be one of: ${validRegions.join(', ')}`;
          }
          return true;
        },
        helpText: 'GCP region for Vertex AI (us-central1, europe-west1, etc.)'
      },
      {
        key: 'GOOGLE_APPLICATION_CREDENTIALS',
        label: 'Service Account JSON Path',
        type: 'file',
        required: true,
        placeholder: '/path/to/service-account-key.json',
        validation: (value) => {
          if (!value) return 'Service account key path is required';
          if (!fs.existsSync(value)) {
            return `File not found: ${value}`;
          }
          if (!value.endsWith('.json')) {
            return 'Must be a .json file';
          }
          try {
            const content = JSON.parse(fs.readFileSync(value, 'utf8'));
            if (!content.type || content.type !== 'service_account') {
              return 'Invalid service account JSON (missing "type": "service_account")';
            }
            if (!content.private_key || !content.client_email) {
              return 'Invalid service account JSON (missing private_key or client_email)';
            }
          } catch (error) {
            return `Invalid JSON file: ${error instanceof Error ? error.message : String(error)}`;
          }
          return true;
        },
        helpText: 'Absolute path to your GCP service account JSON key file'
      }
    ],
    setupGuide: 'https://cloud.google.com/docs/authentication/getting-started',
    signupUrl: 'https://console.cloud.google.com/freetrial',
    docsUrl: 'https://cloud.google.com/vertex-ai/docs',
    fallbackAvailable: true,
    fallbackDescription: 'Hash-based deterministic embeddings (development only)'
  },

  'supabase': {
    id: 'supabase',
    name: 'Supabase',
    category: 'database',
    description: 'Vector database for RAG memory and agent context',
    required: true,
    useCase: 'Store agent memory, code patterns, and enable semantic search',
    credentials: [
      {
        key: 'SUPABASE_URL',
        label: 'Supabase Project URL',
        type: 'url',
        required: true,
        placeholder: 'https://xxxxxxxxxxx.supabase.co',
        validation: (value) => {
          if (!value) return 'Supabase URL is required';
          if (!value.startsWith('https://')) {
            return 'URL must start with https://';
          }
          if (!value.includes('.supabase.co')) {
            return 'Must be a valid Supabase URL (*.supabase.co)';
          }
          return true;
        },
        helpText: 'Your Supabase project URL from the dashboard'
      },
      {
        key: 'SUPABASE_ANON_KEY',
        label: 'Supabase Anon Key',
        type: 'password',
        required: true,
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        validation: (value) => {
          if (!value) return 'Anon key is required';
          if (!value.startsWith('eyJ')) {
            return 'Invalid JWT format (should start with "eyJ")';
          }
          if (value.length < 100) {
            return 'Key seems too short (should be ~200+ characters)';
          }
          return true;
        },
        helpText: 'Anon/public key for client-side operations'
      },
      {
        key: 'SUPABASE_SERVICE_KEY',
        label: 'Supabase Service Role Key',
        type: 'password',
        required: true,
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        validation: (value) => {
          if (!value) return 'Service key is required';
          if (!value.startsWith('eyJ')) {
            return 'Invalid JWT format (should start with "eyJ")';
          }
          if (value.length < 100) {
            return 'Key seems too short (should be ~200+ characters)';
          }
          return true;
        },
        helpText: 'Service role key for admin operations (keep secret!)'
      }
    ],
    setupGuide: 'https://supabase.com/docs/guides/getting-started',
    signupUrl: 'https://app.supabase.com',
    docsUrl: 'https://supabase.com/docs',
    fallbackAvailable: false
  },

  'github': {
    id: 'github',
    name: 'GitHub',
    category: 'automation',
    description: 'GitHub API integration for repository management',
    required: false,
    useCase: 'Create issues, manage PRs, sync code, automated workflows',
    usedByAgents: ['sarah-pm', 'alex-ba', 'devops-dan'],
    credentials: [
      {
        key: 'GITHUB_TOKEN',
        label: 'GitHub Personal Access Token',
        type: 'password',
        required: true,
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'GitHub token is required';
          if (!value.startsWith('ghp_') && !value.startsWith('github_pat_')) {
            return 'Invalid token format (should start with "ghp_" or "github_pat_")';
          }
          if (value.length < 40) {
            return 'Token seems too short';
          }
          return true;
        },
        helpText: 'Personal access token with repo, workflow, and admin:org scopes'
      }
    ],
    setupGuide: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
    signupUrl: 'https://github.com/settings/tokens/new',
    docsUrl: 'https://docs.github.com/en/rest',
    fallbackAvailable: false
  },

  'sentry': {
    id: 'sentry',
    name: 'Sentry',
    category: 'monitoring',
    description: 'Error monitoring and performance tracking',
    required: false,
    useCase: 'Track errors, analyze stack traces, monitor performance',
    usedByAgents: ['marcus-backend', 'devops-dan', 'security-sam'],
    credentials: [
      {
        key: 'SENTRY_DSN',
        label: 'Sentry DSN',
        type: 'url',
        required: true,
        placeholder: 'https://xxxx@xxxx.ingest.sentry.io/xxxx',
        validation: (value) => {
          if (!value) return 'Sentry DSN is required';
          if (!value.startsWith('https://')) {
            return 'DSN must start with https://';
          }
          if (!value.includes('ingest.sentry.io')) {
            return 'Must be a valid Sentry DSN URL';
          }
          return true;
        },
        helpText: 'Data Source Name from Sentry project settings'
      },
      {
        key: 'SENTRY_AUTH_TOKEN',
        label: 'Sentry Auth Token',
        type: 'password',
        required: false,
        placeholder: 'sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return true; // Optional
          if (!value.startsWith('sntrys_')) {
            return 'Invalid token format (should start with "sntrys_")';
          }
          return true;
        },
        helpText: 'Auth token for API access (optional, for advanced features)'
      },
      {
        key: 'SENTRY_ORG',
        label: 'Sentry Organization Slug',
        type: 'text',
        required: false,
        placeholder: 'my-org',
        helpText: 'Your Sentry organization slug (optional)'
      }
    ],
    setupGuide: 'https://docs.sentry.io/product/sentry-basics/dsn-explainer/',
    signupUrl: 'https://sentry.io/signup/',
    docsUrl: 'https://docs.sentry.io/',
    fallbackAvailable: true,
    fallbackDescription: 'Generic JavaScript stack trace parser'
  },

  'semgrep': {
    id: 'semgrep',
    name: 'Semgrep',
    category: 'security',
    description: 'Static code analysis and security scanning',
    required: false,
    useCase: 'Scan code for security vulnerabilities and code quality issues',
    usedByAgents: ['marcus-backend', 'security-sam'],
    credentials: [
      {
        key: 'SEMGREP_API_KEY',
        label: 'Semgrep App Token (Optional)',
        type: 'password',
        required: false,
        placeholder: 'sgk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return true; // Optional
          if (!value.startsWith('sgk_')) {
            return 'Invalid token format (should start with "sgk_")';
          }
          return true;
        },
        helpText: 'API token for Semgrep Cloud Platform (optional, uses local rules otherwise)'
      }
    ],
    setupGuide: 'https://semgrep.dev/docs/getting-started/',
    signupUrl: 'https://semgrep.dev/login',
    docsUrl: 'https://semgrep.dev/docs/',
    fallbackAvailable: true,
    fallbackDescription: 'Local Semgrep binary with pattern-based fallback'
  },

  'exa': {
    id: 'exa',
    name: 'Exa Search',
    category: 'search',
    description: 'AI-powered web search for context gathering',
    required: false,
    useCase: 'Search documentation, Stack Overflow, GitHub for solutions',
    credentials: [
      {
        key: 'EXA_API_KEY',
        label: 'Exa API Key',
        type: 'password',
        required: true,
        placeholder: 'exa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'Exa API key is required';
          if (!value.startsWith('exa_')) {
            return 'Invalid key format (should start with "exa_")';
          }
          return true;
        },
        helpText: 'API key from Exa Labs dashboard'
      }
    ],
    setupGuide: 'https://docs.exa.ai/reference/getting-started',
    signupUrl: 'https://dashboard.exa.ai/api-keys',
    docsUrl: 'https://docs.exa.ai/',
    fallbackAvailable: false
  },

  'n8n': {
    id: 'n8n',
    name: 'n8n',
    category: 'automation',
    description: 'Workflow automation and integration platform',
    required: false,
    useCase: 'Automate workflows, integrate external services, trigger actions',
    credentials: [
      {
        key: 'N8N_BASE_URL',
        label: 'n8n Instance URL',
        type: 'url',
        required: true,
        default: 'http://localhost:5678',
        placeholder: 'http://localhost:5678',
        validation: (value) => {
          if (!value) return 'n8n URL is required';
          if (!value.startsWith('http://') && !value.startsWith('https://')) {
            return 'URL must start with http:// or https://';
          }
          return true;
        },
        helpText: 'URL of your n8n instance (local or cloud)'
      },
      {
        key: 'N8N_API_KEY',
        label: 'n8n API Key',
        type: 'password',
        required: true,
        placeholder: 'n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'n8n API key is required';
          return true;
        },
        helpText: 'API key from n8n settings → API'
      }
    ],
    setupGuide: 'https://docs.n8n.io/hosting/authentication/',
    signupUrl: 'https://n8n.io/cloud/',
    docsUrl: 'https://docs.n8n.io/',
    fallbackAvailable: false
  },

  'openai': {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai',
    description: 'OpenAI API for embeddings and analysis (optional)',
    required: false,
    useCase: 'Generate embeddings for RAG system, alternative to Vertex AI',
    credentials: [
      {
        key: 'OPENAI_API_KEY',
        label: 'OpenAI API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'OpenAI API key is required';
          if (!value.startsWith('sk-')) {
            return 'Invalid key format (should start with "sk-")';
          }
          if (value.length < 40) {
            return 'Key seems too short';
          }
          return true;
        },
        helpText: 'API key from OpenAI platform'
      }
    ],
    setupGuide: 'https://platform.openai.com/docs/quickstart',
    signupUrl: 'https://platform.openai.com/signup',
    docsUrl: 'https://platform.openai.com/docs',
    fallbackAvailable: false,
    usedByAgents: ['dr-ai-ml']
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // AGENT-SPECIFIC SERVICE INTEGRATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  'chrome-mcp': {
    id: 'chrome-mcp',
    name: 'Chrome/Playwright MCP',
    category: 'testing',
    description: 'Browser automation for E2E testing and visual regression',
    required: false,
    useCase: 'Automated browser testing, screenshots, accessibility audits (Maria-QA)',
    credentials: [
      {
        key: 'PLAYWRIGHT_BROWSERS_PATH',
        label: 'Playwright Browsers Path (Optional)',
        type: 'text',
        required: false,
        placeholder: '/path/to/browsers',
        helpText: 'Custom path for Playwright browsers (optional, auto-detected by default)'
      },
      {
        key: 'CHROME_MCP_ENABLED',
        label: 'Enable Chrome MCP',
        type: 'text',
        required: false,
        default: 'true',
        validation: (value) => {
          if (value !== 'true' && value !== 'false') {
            return 'Must be "true" or "false"';
          }
          return true;
        },
        helpText: 'Enable browser automation via Chrome MCP'
      }
    ],
    setupGuide: 'https://playwright.dev/docs/intro',
    signupUrl: undefined,
    docsUrl: 'https://playwright.dev/docs/api/class-playwright',
    fallbackAvailable: true,
    fallbackDescription: 'Headless browser with manual test execution',
    usedByAgents: ['maria-qa']
  },

  'figma': {
    id: 'figma',
    name: 'Figma',
    category: 'design',
    description: 'Design system integration for UI/UX consistency',
    required: false,
    useCase: 'Import designs, extract design tokens, validate UI against mockups (James-Frontend)',
    credentials: [
      {
        key: 'FIGMA_API_TOKEN',
        label: 'Figma Personal Access Token',
        type: 'password',
        required: true,
        placeholder: 'your_figma_token_starts_with_figd_',
        validation: (value) => {
          if (!value) return 'Figma API token is required';
          if (!value.startsWith('figd_')) {
            return 'Invalid token format (should start with "figd_")';
          }
          return true;
        },
        helpText: 'Personal access token from Figma account settings'
      },
      {
        key: 'FIGMA_TEAM_ID',
        label: 'Figma Team ID (Optional)',
        type: 'text',
        required: false,
        placeholder: '1234567890',
        helpText: 'Your Figma team ID for team-specific operations'
      }
    ],
    setupGuide: 'https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens',
    signupUrl: 'https://www.figma.com/signup',
    docsUrl: 'https://www.figma.com/developers/api',
    fallbackAvailable: true,
    fallbackDescription: 'Manual design review and token extraction',
    usedByAgents: ['james-frontend']
  },

  'ant-design': {
    id: 'ant-design',
    name: 'Ant Design MCP',
    category: 'design',
    description: 'Ant Design component library integration',
    required: false,
    useCase: 'Component scaffolding, design token sync, theme customization (James-Frontend)',
    credentials: [
      {
        key: 'ANT_DESIGN_TOKEN',
        label: 'Ant Design Token (Optional)',
        type: 'password',
        required: false,
        placeholder: 'antd_xxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'Optional token for premium Ant Design Pro features'
      }
    ],
    setupGuide: 'https://ant.design/docs/react/introduce',
    signupUrl: undefined,
    docsUrl: 'https://ant.design/components/overview',
    fallbackAvailable: true,
    fallbackDescription: 'Uses public Ant Design components without premium features',
    usedByAgents: ['james-frontend']
  },

  'docker-hub': {
    id: 'docker-hub',
    name: 'Docker Hub',
    category: 'infrastructure',
    description: 'Container registry for Docker images',
    required: false,
    useCase: 'Push/pull Docker images, container deployment (Marcus-Backend, DevOps Dan)',
    credentials: [
      {
        key: 'DOCKER_HUB_USERNAME',
        label: 'Docker Hub Username',
        type: 'text',
        required: true,
        placeholder: 'your-username',
        validation: (value) => {
          if (!value) return 'Docker Hub username is required';
          if (!/^[a-z0-9_-]{4,30}$/.test(value)) {
            return 'Invalid username format (lowercase, alphanumeric, 4-30 chars)';
          }
          return true;
        },
        helpText: 'Your Docker Hub username'
      },
      {
        key: 'DOCKER_HUB_TOKEN',
        label: 'Docker Hub Access Token',
        type: 'password',
        required: true,
        placeholder: 'dckr_pat_xxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'Docker Hub token is required';
          return true;
        },
        helpText: 'Personal access token from Docker Hub → Account Settings → Security'
      }
    ],
    setupGuide: 'https://docs.docker.com/docker-hub/access-tokens/',
    signupUrl: 'https://hub.docker.com/signup',
    docsUrl: 'https://docs.docker.com/docker-hub/',
    fallbackAvailable: false,
    usedByAgents: ['marcus-backend', 'devops-dan']
  },

  'jira': {
    id: 'jira',
    name: 'Jira',
    category: 'automation',
    description: 'Project management and issue tracking',
    required: false,
    useCase: 'Create issues, track sprints, manage project workflows (Sarah-PM)',
    credentials: [
      {
        key: 'JIRA_API_TOKEN',
        label: 'Jira API Token',
        type: 'password',
        required: true,
        placeholder: 'ATATT3xFfGF0xxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'Jira API token is required';
          if (!value.startsWith('ATATT')) {
            return 'Invalid token format (should start with "ATATT")';
          }
          return true;
        },
        helpText: 'API token from Jira account settings'
      },
      {
        key: 'JIRA_DOMAIN',
        label: 'Jira Domain',
        type: 'text',
        required: true,
        placeholder: 'yourcompany.atlassian.net',
        validation: (value) => {
          if (!value) return 'Jira domain is required';
          if (!value.includes('.atlassian.net')) {
            return 'Must be a valid Jira domain (*.atlassian.net)';
          }
          return true;
        },
        helpText: 'Your Jira cloud domain (e.g., yourcompany.atlassian.net)'
      },
      {
        key: 'JIRA_EMAIL',
        label: 'Jira Account Email',
        type: 'text',
        required: true,
        placeholder: 'your-email@company.com',
        validation: (value) => {
          if (!value) return 'Email is required';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Invalid email format';
          }
          return true;
        },
        helpText: 'Email associated with your Jira account'
      }
    ],
    setupGuide: 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/',
    signupUrl: 'https://www.atlassian.com/software/jira/free',
    docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/',
    fallbackAvailable: false,
    usedByAgents: ['sarah-pm']
  },

  'linear': {
    id: 'linear',
    name: 'Linear',
    category: 'automation',
    description: 'Modern issue tracking and project management',
    required: false,
    useCase: 'Streamlined issue management, roadmap planning (Sarah-PM)',
    credentials: [
      {
        key: 'LINEAR_API_KEY',
        label: 'Linear API Key',
        type: 'password',
        required: true,
        placeholder: 'lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'Linear API key is required';
          if (!value.startsWith('lin_api_')) {
            return 'Invalid key format (should start with "lin_api_")';
          }
          return true;
        },
        helpText: 'API key from Linear → Settings → API'
      },
      {
        key: 'LINEAR_TEAM_ID',
        label: 'Linear Team ID (Optional)',
        type: 'text',
        required: false,
        placeholder: 'team-id-here',
        helpText: 'Specific team ID for team-scoped operations'
      }
    ],
    setupGuide: 'https://developers.linear.app/docs/graphql/working-with-the-graphql-api',
    signupUrl: 'https://linear.app/signup',
    docsUrl: 'https://developers.linear.app/',
    fallbackAvailable: false,
    usedByAgents: ['sarah-pm']
  },

  'confluence': {
    id: 'confluence',
    name: 'Confluence',
    category: 'documentation',
    description: 'Documentation and knowledge management',
    required: false,
    useCase: 'Store requirements, create documentation, knowledge sharing (Alex-BA, Sarah-PM)',
    credentials: [
      {
        key: 'CONFLUENCE_API_TOKEN',
        label: 'Confluence API Token',
        type: 'password',
        required: true,
        placeholder: 'ATATT3xFfGF0xxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'Confluence API token is required';
          if (!value.startsWith('ATATT')) {
            return 'Invalid token format (should start with "ATATT")';
          }
          return true;
        },
        helpText: 'API token from Atlassian account settings'
      },
      {
        key: 'CONFLUENCE_DOMAIN',
        label: 'Confluence Domain',
        type: 'text',
        required: true,
        placeholder: 'yourcompany.atlassian.net/wiki',
        validation: (value) => {
          if (!value) return 'Confluence domain is required';
          if (!value.includes('.atlassian.net')) {
            return 'Must be a valid Confluence domain (*.atlassian.net)';
          }
          return true;
        },
        helpText: 'Your Confluence cloud domain'
      },
      {
        key: 'CONFLUENCE_EMAIL',
        label: 'Confluence Account Email',
        type: 'text',
        required: true,
        placeholder: 'your-email@company.com',
        validation: (value) => {
          if (!value) return 'Email is required';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Invalid email format';
          }
          return true;
        },
        helpText: 'Email associated with your Confluence account'
      }
    ],
    setupGuide: 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/',
    signupUrl: 'https://www.atlassian.com/software/confluence/free',
    docsUrl: 'https://developer.atlassian.com/cloud/confluence/rest/v2/intro/',
    fallbackAvailable: true,
    fallbackDescription: 'Markdown files in project repository',
    usedByAgents: ['alex-ba', 'sarah-pm']
  },

  'notion': {
    id: 'notion',
    name: 'Notion',
    category: 'documentation',
    description: 'Collaborative workspace for docs and databases',
    required: false,
    useCase: 'Requirements tracking, documentation, team collaboration (Alex-BA)',
    credentials: [
      {
        key: 'NOTION_API_KEY',
        label: 'Notion Integration Token',
        type: 'password',
        required: true,
        placeholder: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'Notion API key is required';
          if (!value.startsWith('secret_')) {
            return 'Invalid token format (should start with "secret_")';
          }
          return true;
        },
        helpText: 'Integration token from Notion → Settings → Integrations'
      },
      {
        key: 'NOTION_DATABASE_ID',
        label: 'Notion Database ID (Optional)',
        type: 'text',
        required: false,
        placeholder: '32-character database ID',
        validation: (value) => {
          if (!value) return true; // Optional
          if (value.length !== 32) {
            return 'Database ID should be 32 characters';
          }
          return true;
        },
        helpText: 'Database ID for requirements tracking (optional)'
      }
    ],
    setupGuide: 'https://developers.notion.com/docs/create-a-notion-integration',
    signupUrl: 'https://www.notion.so/signup',
    docsUrl: 'https://developers.notion.com/',
    fallbackAvailable: true,
    fallbackDescription: 'Local markdown files with YAML frontmatter',
    usedByAgents: ['alex-ba']
  },

  'huggingface': {
    id: 'huggingface',
    name: 'Hugging Face',
    category: 'ai',
    description: 'ML model hub and inference API',
    required: false,
    useCase: 'Access pre-trained models, run inference, model fine-tuning (Dr.AI-ML)',
    credentials: [
      {
        key: 'HUGGINGFACE_API_TOKEN',
        label: 'Hugging Face API Token',
        type: 'password',
        required: true,
        placeholder: 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'Hugging Face token is required';
          if (!value.startsWith('hf_')) {
            return 'Invalid token format (should start with "hf_")';
          }
          return true;
        },
        helpText: 'API token from huggingface.co → Settings → Access Tokens'
      }
    ],
    setupGuide: 'https://huggingface.co/docs/hub/security-tokens',
    signupUrl: 'https://huggingface.co/join',
    docsUrl: 'https://huggingface.co/docs/api-inference/index',
    fallbackAvailable: true,
    fallbackDescription: 'Local model inference (slower, requires GPU)',
    usedByAgents: ['dr-ai-ml']
  },

  'wandb': {
    id: 'wandb',
    name: 'Weights & Biases',
    category: 'monitoring',
    description: 'ML experiment tracking and model monitoring',
    required: false,
    useCase: 'Track ML experiments, visualize metrics, model versioning (Dr.AI-ML)',
    credentials: [
      {
        key: 'WANDB_API_KEY',
        label: 'W&B API Key',
        type: 'password',
        required: true,
        placeholder: 'local-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validation: (value) => {
          if (!value) return 'W&B API key is required';
          return true;
        },
        helpText: 'API key from wandb.ai → Settings → API keys'
      },
      {
        key: 'WANDB_PROJECT',
        label: 'W&B Project Name (Optional)',
        type: 'text',
        required: false,
        placeholder: 'my-ml-project',
        helpText: 'Default project for experiment tracking'
      }
    ],
    setupGuide: 'https://docs.wandb.ai/quickstart',
    signupUrl: 'https://wandb.ai/signup',
    docsUrl: 'https://docs.wandb.ai/',
    fallbackAvailable: true,
    fallbackDescription: 'Local JSON logs and TensorBoard',
    usedByAgents: ['dr-ai-ml']
  },

  'aws-credentials': {
    id: 'aws-credentials',
    name: 'AWS Credentials',
    category: 'infrastructure',
    description: 'AWS access credentials for RDS, SageMaker, and other services',
    required: false,
    useCase: 'Deploy ML workflows on AWS with RDS PostgreSQL, SageMaker, Lambda, ECS',
    credentials: [
      {
        key: 'AWS_REGION',
        label: 'AWS Region',
        type: 'text',
        required: true,
        default: 'us-east-1',
        placeholder: 'us-east-1',
        validation: (value) => {
          const validRegions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'];
          if (!validRegions.includes(value)) {
            return `Must be one of: ${validRegions.join(', ')}`;
          }
          return true;
        },
        helpText: 'AWS region for your resources (us-east-1, eu-west-1, etc.)'
      },
      {
        key: 'AWS_ACCESS_KEY_ID',
        label: 'AWS Access Key ID',
        type: 'text',
        required: true,
        placeholder: 'AKIAIOSFODNN7EXAMPLE',
        validation: (value) => {
          if (!value) return 'Access Key ID is required';
          if (!/^AKIA[0-9A-Z]{16}$/.test(value)) {
            return 'Invalid Access Key ID format (should start with AKIA)';
          }
          return true;
        },
        helpText: 'AWS IAM Access Key ID from AWS Console → IAM → Users → Security credentials'
      },
      {
        key: 'AWS_SECRET_ACCESS_KEY',
        label: 'AWS Secret Access Key',
        type: 'password',
        required: true,
        placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        validation: (value) => {
          if (!value) return 'Secret Access Key is required';
          if (value.length !== 40) {
            return 'Invalid Secret Access Key length (should be 40 characters)';
          }
          return true;
        },
        helpText: 'AWS IAM Secret Access Key (only shown once when created)'
      },
      {
        key: 'AWS_ACCOUNT_ID',
        label: 'AWS Account ID (Optional)',
        type: 'text',
        required: false,
        placeholder: '123456789012',
        validation: (value) => {
          if (!value) return true;
          if (!/^\d{12}$/.test(value)) {
            return 'Invalid Account ID format (should be 12 digits)';
          }
          return true;
        },
        helpText: 'Your 12-digit AWS Account ID (for IAM policies and ARNs)'
      }
    ],
    setupGuide: 'https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html',
    signupUrl: 'https://aws.amazon.com/free/',
    docsUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html',
    fallbackAvailable: false,
    usedByAgents: ['dana-database', 'dr-ai-ml', 'marcus-backend']
  },

  'aws-rds': {
    id: 'aws-rds',
    name: 'AWS RDS PostgreSQL',
    category: 'database',
    description: 'Amazon RDS managed PostgreSQL with pgvector for ML workflows',
    required: false,
    useCase: 'Managed PostgreSQL database on AWS with pgvector for RAG/embeddings',
    credentials: [
      {
        key: 'RDS_ENDPOINT',
        label: 'RDS Endpoint',
        type: 'text',
        required: true,
        placeholder: 'ml-workflow-db.abc123.us-east-1.rds.amazonaws.com',
        validation: (value) => {
          if (!value) return 'RDS endpoint is required';
          if (!value.includes('.rds.amazonaws.com')) {
            return 'Invalid RDS endpoint format (should end with .rds.amazonaws.com)';
          }
          return true;
        },
        helpText: 'RDS instance endpoint from AWS Console → RDS → Databases'
      },
      {
        key: 'RDS_DATABASE_NAME',
        label: 'Database Name',
        type: 'text',
        required: true,
        default: 'ml_workflow',
        placeholder: 'ml_workflow',
        validation: (value) => {
          if (!value) return 'Database name is required';
          if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
            return 'Invalid database name (lowercase, alphanumeric + underscores)';
          }
          return true;
        },
        helpText: 'PostgreSQL database name'
      },
      {
        key: 'RDS_USERNAME',
        label: 'Master Username',
        type: 'text',
        required: true,
        default: 'postgres',
        placeholder: 'postgres',
        validation: (value) => {
          if (!value) return 'Username is required';
          return true;
        },
        helpText: 'RDS master username'
      },
      {
        key: 'RDS_PASSWORD',
        label: 'Master Password',
        type: 'password',
        required: true,
        placeholder: 'Your secure password',
        validation: (value) => {
          if (!value) return 'Password is required';
          if (value.length < 8) {
            return 'Password must be at least 8 characters';
          }
          return true;
        },
        helpText: 'RDS master password (recommend using AWS Secrets Manager)'
      },
      {
        key: 'RDS_USE_IAM_AUTH',
        label: 'Use IAM Authentication',
        type: 'text',
        required: false,
        default: 'false',
        placeholder: 'true/false',
        validation: (value) => {
          if (!value) return true;
          if (!['true', 'false'].includes(value.toLowerCase())) {
            return 'Must be "true" or "false"';
          }
          return true;
        },
        helpText: 'Enable IAM authentication (recommended for production)'
      }
    ],
    setupGuide: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html',
    signupUrl: 'https://aws.amazon.com/rds/postgresql/',
    docsUrl: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html',
    fallbackAvailable: true,
    fallbackDescription: 'Use Cloud SQL (GCP) or Supabase instead',
    usedByAgents: ['dana-database', 'marcus-backend']
  },

  'aws-sagemaker': {
    id: 'aws-sagemaker',
    name: 'AWS SageMaker',
    category: 'ai',
    description: 'AWS SageMaker for ML model training and deployment',
    required: false,
    useCase: 'Train and deploy ML models on AWS infrastructure',
    credentials: [
      {
        key: 'SAGEMAKER_EXECUTION_ROLE_ARN',
        label: 'SageMaker Execution Role ARN',
        type: 'text',
        required: true,
        placeholder: 'arn:aws:iam::123456789012:role/SageMakerRole',
        validation: (value) => {
          if (!value) return 'Execution role ARN is required';
          if (!value.startsWith('arn:aws:iam::')) {
            return 'Invalid ARN format (should start with arn:aws:iam::)';
          }
          return true;
        },
        helpText: 'IAM role ARN for SageMaker execution (from IAM → Roles)'
      },
      {
        key: 'SAGEMAKER_S3_BUCKET',
        label: 'S3 Bucket for Artifacts',
        type: 'text',
        required: true,
        placeholder: 'sagemaker-ml-workflow',
        validation: (value) => {
          if (!value) return 'S3 bucket name is required';
          if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value)) {
            return 'Invalid S3 bucket name format';
          }
          return true;
        },
        helpText: 'S3 bucket for model artifacts and training data'
      },
      {
        key: 'SAGEMAKER_DEFAULT_INSTANCE_TYPE',
        label: 'Default Instance Type',
        type: 'text',
        required: false,
        default: 'ml.m5.xlarge',
        placeholder: 'ml.m5.xlarge',
        validation: (value) => {
          if (!value) return true;
          if (!value.startsWith('ml.')) {
            return 'Instance type should start with "ml."';
          }
          return true;
        },
        helpText: 'Default instance type for training jobs'
      }
    ],
    setupGuide: 'https://docs.aws.amazon.com/sagemaker/latest/dg/gs-set-up.html',
    signupUrl: 'https://aws.amazon.com/sagemaker/',
    docsUrl: 'https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html',
    fallbackAvailable: true,
    fallbackDescription: 'Use Vertex AI (GCP) or local training',
    usedByAgents: ['dr-ai-ml']
  }
};

/**
 * Get service template by ID
 */
export function getServiceTemplate(serviceId: string): ServiceTemplate | undefined {
  return SERVICE_TEMPLATES[serviceId];
}

/**
 * Get all service templates
 */
export function getAllServiceTemplates(): ServiceTemplate[] {
  return Object.values(SERVICE_TEMPLATES);
}

/**
 * Get required services
 */
export function getRequiredServices(): ServiceTemplate[] {
  return getAllServiceTemplates().filter(s => s.required);
}

/**
 * Get optional services
 */
export function getOptionalServices(): ServiceTemplate[] {
  return getAllServiceTemplates().filter(s => !s.required);
}

/**
 * Get services by category
 */
export function getServicesByCategory(category: ServiceTemplate['category']): ServiceTemplate[] {
  return getAllServiceTemplates().filter(s => s.category === category);
}

/**
 * Detect which services are needed based on project analysis
 */
export function detectNeededServices(projectAnalysis?: {
  detectedTechnologies?: string[];
  hasTests?: boolean;
  hasBackend?: boolean;
  hasFrontend?: boolean;
  hasML?: boolean;
}): ServiceTemplate[] {
  const needed: ServiceTemplate[] = [];

  // Always need Supabase for RAG
  needed.push(SERVICE_TEMPLATES['supabase']);

  // GitHub if working with repos
  needed.push(SERVICE_TEMPLATES['github']);

  if (projectAnalysis) {
    // Vertex AI for AI-heavy projects
    if (projectAnalysis.detectedTechnologies?.some(t =>
      t.toLowerCase().includes('ai') ||
      t.toLowerCase().includes('ml') ||
      t.toLowerCase().includes('python')
    ) || projectAnalysis.hasML) {
      needed.push(SERVICE_TEMPLATES['vertex-ai']);
      needed.push(SERVICE_TEMPLATES['huggingface']);
      needed.push(SERVICE_TEMPLATES['wandb']);
    }

    // Frontend integrations
    if (projectAnalysis.hasFrontend || projectAnalysis.detectedTechnologies?.some(t =>
      ['react', 'vue', 'angular', 'frontend'].some(fw => t.toLowerCase().includes(fw))
    )) {
      needed.push(SERVICE_TEMPLATES['figma']);
      needed.push(SERVICE_TEMPLATES['ant-design']);
    }

    // Backend integrations
    if (projectAnalysis.hasBackend) {
      needed.push(SERVICE_TEMPLATES['sentry']);
      needed.push(SERVICE_TEMPLATES['semgrep']);
      needed.push(SERVICE_TEMPLATES['docker-hub']);
    }

    // Testing integrations
    if (projectAnalysis.hasTests) {
      needed.push(SERVICE_TEMPLATES['chrome-mcp']);
    }
  }

  return Array.from(new Set(needed)); // Remove duplicates
}

/**
 * Agent to service credential mapping
 */
export const AGENT_CREDENTIAL_MAP: Record<string, string[]> = {
  'maria-qa': ['chrome-mcp', 'playwright'],
  'enhanced-maria': ['chrome-mcp', 'playwright'],

  'james-frontend': ['figma', 'ant-design'],
  'enhanced-james': ['figma', 'ant-design'],

  'marcus-backend': ['docker-hub', 'sentry', 'semgrep'],
  'enhanced-marcus': ['docker-hub', 'sentry', 'semgrep'],

  'sarah-pm': ['jira', 'linear', 'github', 'confluence'],

  'alex-ba': ['confluence', 'notion', 'github'],

  'dr-ai-ml': ['vertex-ai', 'openai', 'huggingface', 'wandb'],

  'devops-dan': ['docker-hub', 'github', 'sentry'],

  'security-sam': ['semgrep', 'sentry']
};

/**
 * Get services needed by specific agents
 */
export function getServicesForAgents(agentIds: string[]): ServiceTemplate[] {
  const serviceIds = new Set<string>();

  for (const agentId of agentIds) {
    const services = AGENT_CREDENTIAL_MAP[agentId] || [];
    services.forEach(id => serviceIds.add(id));
  }

  return Array.from(serviceIds)
    .map(id => SERVICE_TEMPLATES[id])
    .filter((s): s is ServiceTemplate => s !== undefined);
}

/**
 * Get agents that use a specific service
 */
export function getAgentsUsingService(serviceId: string): string[] {
  const service = SERVICE_TEMPLATES[serviceId];
  if (service?.usedByAgents) {
    return service.usedByAgents;
  }

  // Fallback: search through AGENT_CREDENTIAL_MAP
  return Object.entries(AGENT_CREDENTIAL_MAP)
    .filter(([, services]) => services.includes(serviceId))
    .map(([agentId]) => agentId);
}
