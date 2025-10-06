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
  category: 'ai' | 'database' | 'testing' | 'monitoring' | 'automation' | 'search' | 'security';
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
    fallbackAvailable: false
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
    )) {
      needed.push(SERVICE_TEMPLATES['vertex-ai']);
    }

    // Sentry for production apps
    if (projectAnalysis.hasBackend) {
      needed.push(SERVICE_TEMPLATES['sentry']);
    }

    // Semgrep for security-conscious projects
    if (projectAnalysis.hasBackend) {
      needed.push(SERVICE_TEMPLATES['semgrep']);
    }
  }

  return Array.from(new Set(needed)); // Remove duplicates
}
